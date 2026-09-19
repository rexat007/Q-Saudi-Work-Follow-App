import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  runTransaction,
  Transaction,
} from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../firebase/errors';
import {
  ProjectTruckMaterialAllocationEntity,
  ActiveTruckMaterialSlotPayload,
  AllocationStatus,
  generateOpaqueAllocationId,
} from '../types/projectTruckMaterialAllocation';
import {
  projectTruckMembershipRepository,
  projectMaterialMembershipRepository,
} from './projectMembership.repository';
import { projectTruckCarrierAffiliationRepository } from './projectCarrierAffiliation.repository';
import { auditLogRepository } from './auditLog.repository';

/**
 * Result of allocateTruckToMaterial canonical operation
 */
export interface AllocateTruckToMaterialResult {
  allocation: ProjectTruckMaterialAllocationEntity;
  idempotent: boolean;
  reallocated: boolean;
  closedAllocationId: string | null;
}

/**
 * Result of closeTruckMaterialAllocation canonical operation
 */
export interface CloseTruckMaterialAllocationResult {
  allocation: ProjectTruckMaterialAllocationEntity;
  idempotent: boolean;
}

/**
 * ============================================================================
 * PROJECT TRUCK ↔ MATERIAL TEMPORAL ALLOCATION REPOSITORY
 * ============================================================================
 * Canonical repository managing:
 * - Historical allocations: /projects/{projectId}/truck_material_allocations/{allocationId}
 * - Active Truck Material slot: /projects/{projectId}/truck_active_material_allocations/{truckId}
 */
export class ProjectTruckMaterialAllocationRepository {
  // In-memory data structures for unit testing and offline fallback
  private inMemoryAllocations: Map<string, ProjectTruckMaterialAllocationEntity> = new Map();
  private inMemoryActiveSlots: Map<string, ActiveTruckMaterialSlotPayload> = new Map(); // key: `${projectId}#${truckId}`

  private getSlotKey(projectId: string, truckId: string): string {
    return `${projectId}#${truckId}`;
  }

  /**
   * Test helper to clear in-memory cache
   */
  _clearMemory(): void {
    this.inMemoryAllocations.clear();
    this.inMemoryActiveSlots.clear();
  }

  /**
   * Fetch an allocation document by ID
   */
  async getAllocation(
    projectId: string,
    allocationId: string,
    transaction?: Transaction
  ): Promise<ProjectTruckMaterialAllocationEntity | null> {
    if (!projectId || !allocationId) return null;

    if (!auth.currentUser) {
      const mem = this.inMemoryAllocations.get(allocationId);
      return mem && mem.projectId === projectId ? mem : null;
    }

    const docPath = `projects/${projectId}/truck_material_allocations/${allocationId}`;
    try {
      const docRef = doc(db, 'projects', projectId, 'truck_material_allocations', allocationId);
      if (transaction) {
        const snap = await transaction.get(docRef);
        return snap.exists() ? snap.data() as ProjectTruckMaterialAllocationEntity : null;
      }
      const snap = await getDoc(docRef);
      if (!snap.exists()) {
        const mem = this.inMemoryAllocations.get(allocationId);
        return mem && mem.projectId === projectId ? mem : null;
      }
      return snap.data() as ProjectTruckMaterialAllocationEntity;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, docPath);
      const mem = this.inMemoryAllocations.get(allocationId);
      return mem && mem.projectId === projectId ? mem : null;
    }
  }

  /**
   * Fetch active slot pointer for truck
   */
  async getActiveSlot(
    projectId: string,
    truckId: string,
    transaction?: Transaction
  ): Promise<ActiveTruckMaterialSlotPayload | null> {
    if (!projectId || !truckId) return null;

    const compKey = this.getSlotKey(projectId, truckId);
    if (!auth.currentUser) {
      return this.inMemoryActiveSlots.get(compKey) || null;
    }

    const docPath = `projects/${projectId}/truck_active_material_allocations/${truckId}`;
    try {
      const docRef = doc(db, 'projects', projectId, 'truck_active_material_allocations', truckId);
      if (transaction) {
        const snap = await transaction.get(docRef);
        return snap.exists() ? snap.data() as ActiveTruckMaterialSlotPayload : null;
      }
      const snap = await getDoc(docRef);
      if (!snap.exists()) {
        return this.inMemoryActiveSlots.get(compKey) || null;
      }
      return snap.data() as ActiveTruckMaterialSlotPayload;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, docPath);
      return this.inMemoryActiveSlots.get(compKey) || null;
    }
  }

  async listAllocations(projectId: string, transaction?: Transaction): Promise<ProjectTruckMaterialAllocationEntity[]> {
    const colRef = collection(db, 'projects', projectId, 'truck_material_allocations');
    const q = query(colRef);
    if (transaction) {
      const snap = await getDocs(q);
      return snap.docs.map(d => d.data() as ProjectTruckMaterialAllocationEntity);
    }
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as ProjectTruckMaterialAllocationEntity);
  }

  /**
   * Get active allocation for a truck (resolves active slot pointer)
   */
  async getActiveAllocationByTruck(
    projectId: string,
    truckId: string
  ): Promise<ProjectTruckMaterialAllocationEntity | null> {
    const slot = await this.getActiveSlot(projectId, truckId);
    if (!slot) return null;

    const allocation = await this.getAllocation(projectId, slot.allocationId);
    if (!allocation) {
      throw new Error(
        `ALLOCATION_POINTER_CORRUPTION: Active slot points to non-existent allocation ${slot.allocationId} for truck ${truckId}`
      );
    }
    if (allocation.projectId !== projectId || allocation.truckId !== truckId) {
      throw new Error(
        `ALLOCATION_POINTER_CORRUPTION: Active slot points to allocation ${slot.allocationId} with mismatched truck or project`
      );
    }
    if (allocation.status !== 'ACTIVE' || allocation.effectiveTo !== null) {
      throw new Error(
        `ALLOCATION_POINTER_CORRUPTION: Active slot points to inactive or closed allocation ${slot.allocationId}`
      );
    }
    return allocation;
  }

  /**
   * List historical allocation intervals for a truck (descending by effectiveFrom)
   */
  async listTruckMaterialHistory(
    projectId: string,
    truckId: string
  ): Promise<ProjectTruckMaterialAllocationEntity[]> {
    if (!projectId || !truckId) return [];

    if (!auth.currentUser) {
      return Array.from(this.inMemoryAllocations.values())
        .filter((a) => a.projectId === projectId && a.truckId === truckId)
        .sort((a, b) => {
          const diff = new Date(b.effectiveFrom).getTime() - new Date(a.effectiveFrom).getTime();
          if (diff !== 0) return diff;
          if (a.status === 'ACTIVE') return -1;
          if (b.status === 'ACTIVE') return 1;
          return 0;
        });
    }

    const colPath = `projects/${projectId}/truck_material_allocations`;
    try {
      const colRef = collection(db, 'projects', projectId, 'truck_material_allocations');
      const q = query(colRef, where('truckId', '==', truckId), orderBy('effectiveFrom', 'desc'));
      const snap = await getDocs(q);
      const live = snap.docs.map((d) => d.data() as ProjectTruckMaterialAllocationEntity);
      if (live.length === 0) {
        return Array.from(this.inMemoryAllocations.values())
          .filter((a) => a.projectId === projectId && a.truckId === truckId)
          .sort((a, b) => new Date(b.effectiveFrom).getTime() - new Date(a.effectiveFrom).getTime());
      }
      return live;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, colPath);
      return Array.from(this.inMemoryAllocations.values())
        .filter((a) => a.projectId === projectId && a.truckId === truckId)
        .sort((a, b) => new Date(b.effectiveFrom).getTime() - new Date(a.effectiveFrom).getTime());
    }
  }

  /**
   * Precondition validator (used in in-memory atomic executions)
   * Validates:
   * 1. Truck Project Membership == ACTIVE
   * 2. Truck Project Carrier Affiliation == ACTIVE
   * 3. Project Material Membership == ACTIVE
   */
  async validateAllocationPreconditions(
    projectId: string,
    truckId: string,
    materialId: string
  ): Promise<void> {
    // 1. Truck Membership
    const truckMembership = await projectTruckMembershipRepository.getMembership(projectId, truckId);
    if (!truckMembership) {
      throw new Error(`PRECONDITION_FAILED: Truck membership does not exist for ID ${truckId} in project ${projectId}`);
    }
    if (truckMembership.status !== 'ACTIVE') {
      throw new Error(`PRECONDITION_FAILED: Truck membership for ID ${truckId} is ${truckMembership.status}, must be ACTIVE`);
    }

    // 2. Truck Carrier Affiliation
    const truckAffiliation = await projectTruckCarrierAffiliationRepository.getAffiliation(projectId, truckId);
    if (!truckAffiliation) {
      throw new Error(`PRECONDITION_FAILED: Truck carrier affiliation does not exist for ID ${truckId} in project ${projectId}`);
    }
    if (truckAffiliation.status !== 'ACTIVE') {
      throw new Error(`PRECONDITION_FAILED: Truck carrier affiliation for ID ${truckId} is ${truckAffiliation.status}, must be ACTIVE`);
    }

    // 3. Project Material Membership
    const materialMembership = await projectMaterialMembershipRepository.getMembership(projectId, materialId);
    if (!materialMembership) {
      throw new Error(`PRECONDITION_FAILED: Material membership does not exist for ID ${materialId} in project ${projectId}`);
    }
    if (materialMembership.status !== 'ACTIVE') {
      throw new Error(`PRECONDITION_FAILED: Material membership for ID ${materialId} is ${materialMembership.status}, must be ACTIVE`);
    }
  }

  /**
   * Canonical Mutation: allocateTruckToMaterial
   * Handles:
   * 1. Initial allocation
   * 2. Idempotent repeat
   * 3. Reallocation (atomically closes current allocation, creates new one, updates pointer)
   */
  async allocateTruckToMaterial(
    projectId: string,
    truckId: string,
    materialId: string,
    actorId: string,
    transaction?: Transaction
  ): Promise<AllocateTruckToMaterialResult> {
    if (!projectId || !truckId || !materialId) {
      throw new Error('INVALID_ARGUMENT: projectId, truckId, and materialId are required');
    }
    if (!actorId) {
      throw new Error('INVALID_ARGUMENT: actorId is required');
    }

    if (!auth.currentUser) {
      return this._allocateTruckToMaterialInMemory(projectId, truckId, materialId, actorId);
    }

    return this._allocateTruckToMaterialFirestore(projectId, truckId, materialId, actorId, transaction);
  }

  /**
   * In-memory atomic implementation of allocateTruckToMaterial
   */
  private async _allocateTruckToMaterialInMemory(
    projectId: string,
    truckId: string,
    materialId: string,
    actorId: string
  ): Promise<AllocateTruckToMaterialResult> {
    // 1. Transactional Precondition Reads
    await this.validateAllocationPreconditions(projectId, truckId, materialId);

    const now = new Date().toISOString();
    const truckSlotKey = this.getSlotKey(projectId, truckId);
    const currentSlot = this.inMemoryActiveSlots.get(truckSlotKey);

    // 2. Check existing active allocation
    if (currentSlot) {
      const existing = this.inMemoryAllocations.get(currentSlot.allocationId);
      if (!existing) {
        throw new Error(
          `ALLOCATION_POINTER_CORRUPTION: Active slot points to non-existent allocation ${currentSlot.allocationId}`
        );
      }
      if (existing.projectId !== projectId || existing.truckId !== truckId) {
        throw new Error(
          `ALLOCATION_POINTER_CORRUPTION: Active slot points to allocation ${existing.allocationId} with mismatched truck or project`
        );
      }
      if (existing.status !== 'ACTIVE' || existing.effectiveTo !== null) {
        throw new Error(
          `ALLOCATION_POINTER_CORRUPTION: Active slot points to inactive or closed allocation ${existing.allocationId}`
        );
      }

      // Idempotency: truck is already active on this exact material
      if (existing.materialId === materialId) {
        return {
          allocation: existing,
          idempotent: true,
          reallocated: false,
          closedAllocationId: null,
        };
      }

      // Reallocation: close existing allocation
      const closedExisting: ProjectTruckMaterialAllocationEntity = {
        ...existing,
        status: 'CLOSED',
        effectiveTo: now,
      };
      this.inMemoryAllocations.set(closedExisting.allocationId, closedExisting);

      // Create new allocation
      const newAllocationId = generateOpaqueAllocationId();
      const newAllocation: ProjectTruckMaterialAllocationEntity = {
        allocationId: newAllocationId,
        projectId,
        truckId,
        materialId,
        status: 'ACTIVE',
        effectiveFrom: now,
        effectiveTo: null,
        createdAt: now,
        createdBy: actorId,
      };
      this.inMemoryAllocations.set(newAllocationId, newAllocation);
      this.inMemoryActiveSlots.set(truckSlotKey, { allocationId: newAllocationId });

      await auditLogRepository.create({
        auditLogId: `AUD-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        projectId,
        entityType: 'TRUCK',
        entityId: truckId,
        action: 'UPDATE',
        actor: {
          userId: actorId,
          email: `${actorId}@system.local`,
          role: 'PROJECT_ADMIN',
        },
        changes: {
          before: { allocationId: existing.allocationId, materialId: existing.materialId },
          after: { allocationId: newAllocationId, materialId, status: 'ACTIVE' },
          deltaFields: ['materialId', 'allocationId'],
        },
        correlationId: `TMA-${projectId}-${newAllocationId}`,
        createdBy: actorId,
        updatedBy: actorId,
      });

      return {
        allocation: newAllocation,
        idempotent: false,
        reallocated: true,
        closedAllocationId: existing.allocationId,
      };
    }

    // 3. Initial allocation: no existing slot
    const allocationId = generateOpaqueAllocationId();
    const newAllocation: ProjectTruckMaterialAllocationEntity = {
      allocationId,
      projectId,
      truckId,
      materialId,
      status: 'ACTIVE',
      effectiveFrom: now,
      effectiveTo: null,
      createdAt: now,
      createdBy: actorId,
    };
    this.inMemoryAllocations.set(allocationId, newAllocation);
    this.inMemoryActiveSlots.set(truckSlotKey, { allocationId });

    await auditLogRepository.create({
      auditLogId: `AUD-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      projectId,
      entityType: 'TRUCK',
      entityId: truckId,
      action: 'CREATE',
      actor: {
        userId: actorId,
        email: `${actorId}@system.local`,
        role: 'PROJECT_ADMIN',
      },
      changes: {
        before: {},
        after: { allocationId, truckId, materialId, status: 'ACTIVE' },
        deltaFields: ['allocationId', 'truckId', 'materialId', 'status'],
      },
      correlationId: `TMA-${projectId}-${allocationId}`,
      createdBy: actorId,
      updatedBy: actorId,
    });

    return {
      allocation: newAllocation,
      idempotent: false,
      reallocated: false,
      closedAllocationId: null,
    };
  }

  /**
   * Live Firestore Transactional implementation of allocateTruckToMaterial
   */
  private async _allocateTruckToMaterialFirestore(
    projectId: string,
    truckId: string,
    materialId: string,
    actorId: string,
    transaction?: Transaction
  ): Promise<AllocateTruckToMaterialResult> {
    const colPath = `projects/${projectId}/truck_material_allocations`;

    const executeWithTx = async (tx: Transaction) => {
        // 1. Transactional Precondition Reads BEFORE any writes
        const truckMemRef = doc(db, 'projects', projectId, 'truck_memberships', truckId);
        const truckAffilRef = doc(db, 'projects', projectId, 'truck_carrier_affiliations', truckId);
        const materialMemRef = doc(db, 'projects', projectId, 'material_memberships', materialId);
        const truckSlotRef = doc(db, 'projects', projectId, 'truck_active_material_allocations', truckId);

        const [truckMemSnap, truckAffilSnap, materialMemSnap, truckSlotSnap] = await Promise.all([
          tx.get(truckMemRef),
          tx.get(truckAffilRef),
          tx.get(materialMemRef),
          tx.get(truckSlotRef),
        ]);

        if (!truckMemSnap.exists() || truckMemSnap.data()?.status !== 'ACTIVE') {
          throw new Error(`PRECONDITION_FAILED: Truck membership for ID ${truckId} does not exist or is not ACTIVE`);
        }
        if (!truckAffilSnap.exists() || truckAffilSnap.data()?.status !== 'ACTIVE') {
          throw new Error(`PRECONDITION_FAILED: Truck carrier affiliation for ID ${truckId} does not exist or is not ACTIVE`);
        }
        if (!materialMemSnap.exists() || materialMemSnap.data()?.status !== 'ACTIVE') {
          throw new Error(`PRECONDITION_FAILED: Material membership for ID ${materialId} does not exist or is not ACTIVE`);
        }

        const now = new Date().toISOString();
        const currentSlot = truckSlotSnap.exists()
          ? (truckSlotSnap.data() as ActiveTruckMaterialSlotPayload)
          : null;

        let existingAllocation: ProjectTruckMaterialAllocationEntity | null = null;

        if (currentSlot?.allocationId) {
          const currentAssignRef = doc(
            db,
            'projects',
            projectId,
            'truck_material_allocations',
            currentSlot.allocationId
          );
          const assignSnap = await tx.get(currentAssignRef);
          if (!assignSnap.exists()) {
            throw new Error(
              `ALLOCATION_POINTER_CORRUPTION: Active slot points to non-existent allocation ${currentSlot.allocationId}`
            );
          }
          existingAllocation = assignSnap.data() as ProjectTruckMaterialAllocationEntity;

          if (existingAllocation.projectId !== projectId || existingAllocation.truckId !== truckId) {
            throw new Error(
              `ALLOCATION_POINTER_CORRUPTION: Active slot points to allocation ${existingAllocation.allocationId} with mismatched truck or project`
            );
          }
          if (existingAllocation.status !== 'ACTIVE' || existingAllocation.effectiveTo !== null) {
            throw new Error(
              `ALLOCATION_POINTER_CORRUPTION: Active slot points to inactive or closed allocation ${existingAllocation.allocationId}`
            );
          }

          // Idempotency check
          if (existingAllocation.materialId === materialId) {
            return {
              allocation: existingAllocation,
              idempotent: true,
              reallocated: false,
              closedAllocationId: null,
            };
          }
        }

        // Writes begin after all reads complete
        let reallocated = false;
        let closedAllocationId: string | null = null;

        if (existingAllocation) {
          // Close old allocation
          const oldAssignRef = doc(
            db,
            'projects',
            projectId,
            'truck_material_allocations',
            existingAllocation.allocationId
          );
          tx.update(oldAssignRef, {
            status: 'CLOSED',
            effectiveTo: now,
          });
          reallocated = true;
          closedAllocationId = existingAllocation.allocationId;
        }

        // Create new allocation
        const allocationId = generateOpaqueAllocationId();
        const newAllocation: ProjectTruckMaterialAllocationEntity = {
          allocationId,
          projectId,
          truckId,
          materialId,
          status: 'ACTIVE',
          effectiveFrom: now,
          effectiveTo: null,
          createdAt: now,
          createdBy: actorId,
        };

        const newAssignRef = doc(db, 'projects', projectId, 'truck_material_allocations', allocationId);
        tx.set(newAssignRef, newAllocation);

        // Set or update active slot pointer
        tx.set(truckSlotRef, { allocationId });

        return {
          allocation: newAllocation,
          idempotent: false,
          reallocated,
          closedAllocationId,
        };
    };

    if (transaction) {
      return await executeWithTx(transaction);
    }

    try {
      return await runTransaction(db, async (tx) => {
        return await executeWithTx(tx);
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, colPath);
      throw error;
    }
  }

  /**
   * Canonical Close Allocation Mutation
   */
  async closeTruckMaterialAllocation(
    projectId: string,
    allocationId: string,
    actorId: string
  ): Promise<CloseTruckMaterialAllocationResult> {
    if (!projectId || !allocationId) {
      throw new Error('INVALID_ARGUMENT: projectId and allocationId are required');
    }
    if (!actorId) {
      throw new Error('INVALID_ARGUMENT: actorId is required');
    }

    if (!auth.currentUser) {
      return this._closeTruckMaterialAllocationInMemory(projectId, allocationId, actorId);
    }

    return this._closeTruckMaterialAllocationFirestore(projectId, allocationId, actorId);
  }

  /**
   * In-memory atomic implementation of closeTruckMaterialAllocation
   */
  private async _closeTruckMaterialAllocationInMemory(
    projectId: string,
    allocationId: string,
    actorId: string
  ): Promise<CloseTruckMaterialAllocationResult> {
    const allocation = this.inMemoryAllocations.get(allocationId);
    if (!allocation || allocation.projectId !== projectId) {
      throw new Error(`NOT_FOUND: Allocation ${allocationId} not found in project ${projectId}`);
    }

    // Idempotent close
    if (allocation.status === 'CLOSED') {
      return {
        allocation,
        idempotent: true,
      };
    }

    const truckSlotKey = this.getSlotKey(projectId, allocation.truckId);
    const activeSlot = this.inMemoryActiveSlots.get(truckSlotKey);

    if (!activeSlot || activeSlot.allocationId !== allocationId) {
      throw new Error(
        `ALLOCATION_POINTER_CORRUPTION: Active slot for truck ${allocation.truckId} is missing or points to different allocation`
      );
    }

    const now = new Date().toISOString();
    const closedAllocation: ProjectTruckMaterialAllocationEntity = {
      ...allocation,
      status: 'CLOSED',
      effectiveTo: now,
    };

    this.inMemoryAllocations.set(allocationId, closedAllocation);
    this.inMemoryActiveSlots.delete(truckSlotKey);

    await auditLogRepository.create({
      auditLogId: `AUD-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      projectId,
      entityType: 'TRUCK',
      entityId: allocation.truckId,
      action: 'UPDATE',
      actor: {
        userId: actorId,
        email: `${actorId}@system.local`,
        role: 'PROJECT_ADMIN',
      },
      changes: {
        before: { allocationId, status: 'ACTIVE', effectiveTo: null },
        after: { allocationId, status: 'CLOSED', effectiveTo: now },
        deltaFields: ['status', 'effectiveTo'],
      },
      correlationId: `TMA-${projectId}-${allocationId}`,
      createdBy: actorId,
      updatedBy: actorId,
    });

    return {
      allocation: closedAllocation,
      idempotent: false,
    };
  }

  /**
   * Live Firestore Transactional implementation of closeTruckMaterialAllocation
   */
  private async _closeTruckMaterialAllocationFirestore(
    projectId: string,
    allocationId: string,
    actorId: string
  ): Promise<CloseTruckMaterialAllocationResult> {
    const docPath = `projects/${projectId}/truck_material_allocations/${allocationId}`;

    try {
      return await runTransaction(db, async (transaction) => {
        const assignRef = doc(db, 'projects', projectId, 'truck_material_allocations', allocationId);
        const assignSnap = await transaction.get(assignRef);

        if (!assignSnap.exists()) {
          throw new Error(`NOT_FOUND: Allocation ${allocationId} not found in project ${projectId}`);
        }

        const allocation = assignSnap.data() as ProjectTruckMaterialAllocationEntity;
        if (allocation.projectId !== projectId) {
          throw new Error(`NOT_FOUND: Allocation ${allocationId} not found in project ${projectId}`);
        }

        // Idempotent close
        if (allocation.status === 'CLOSED') {
          return {
            allocation,
            idempotent: true,
          };
        }

        // Read active slot
        const truckSlotRef = doc(
          db,
          'projects',
          projectId,
          'truck_active_material_allocations',
          allocation.truckId
        );
        const slotSnap = await transaction.get(truckSlotRef);

        if (!slotSnap.exists() || slotSnap.data()?.allocationId !== allocationId) {
          throw new Error(
            `ALLOCATION_POINTER_CORRUPTION: Active slot for truck ${allocation.truckId} is missing or points to different allocation`
          );
        }

        const now = new Date().toISOString();
        const closedAllocation: ProjectTruckMaterialAllocationEntity = {
          ...allocation,
          status: 'CLOSED',
          effectiveTo: now,
        };

        // Write updates
        transaction.update(assignRef, {
          status: 'CLOSED',
          effectiveTo: now,
        });
        transaction.delete(truckSlotRef);

        return {
          allocation: closedAllocation,
          idempotent: false,
        };
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, docPath);
      throw error;
    }
  }
}

export const projectTruckMaterialAllocationRepository =
  new ProjectTruckMaterialAllocationRepository();
