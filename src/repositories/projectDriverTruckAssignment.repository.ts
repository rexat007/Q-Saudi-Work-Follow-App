import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  runTransaction,
  Transaction,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../firebase/errors';
import {
  ProjectDriverTruckAssignmentEntity,
  ActiveAssignmentSlotPayload,
  AssignmentStatus,
} from '../types/projectDriverTruckAssignment';
import { generateOpaqueGlobalId } from './globalIdentity.repository';
import {
  projectDriverMembershipRepository,
  projectTruckMembershipRepository,
} from './projectMembership.repository';
import {
  projectDriverCarrierAffiliationRepository,
  projectTruckCarrierAffiliationRepository,
} from './projectCarrierAffiliation.repository';
import { auditLogRepository } from './auditLog.repository';

/**
 * Result of assignDriverToTruck canonical operation
 */
export interface AssignDriverToTruckResult {
  assignment: ProjectDriverTruckAssignmentEntity;
  idempotent: boolean;
  reassignedDriver: boolean;
  reassignedTruck: boolean;
  closedAssignments: string[];
}

/**
 * Result of closeAssignment canonical operation
 */
export interface CloseAssignmentResult {
  assignment: ProjectDriverTruckAssignmentEntity;
  idempotent: boolean;
}

/**
 * Generator for opaque Assignment ID: ASN-<32-char hex string> (128 bits cryptographic entropy)
 */
export function generateOpaqueAssignmentId(): string {
  // Reuses the established 128-bit cryptographic random generator with prefix 'ASN'
  if (typeof globalThis !== 'undefined' && globalThis.crypto) {
    if (typeof globalThis.crypto.randomUUID === 'function') {
      const uuidHex = globalThis.crypto.randomUUID().replace(/-/g, '').toLowerCase();
      return `ASN-${uuidHex}`;
    }
    if (typeof globalThis.crypto.getRandomValues === 'function') {
      const bytes = new Uint8Array(16); // 128 bits
      globalThis.crypto.getRandomValues(bytes);
      const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
      return `ASN-${hex}`;
    }
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const nodeCrypto = require('crypto');
    const hex = nodeCrypto.randomBytes(16).toString('hex');
    return `ASN-${hex}`;
  } catch {
    throw new Error('SECURE_CRYPTO_UNAVAILABLE: Cryptographic random generator is required for assignment ID creation');
  }
}

/**
 * ============================================================================
 * PROJECT DRIVER ↔ TRUCK TEMPORAL ASSIGNMENT REPOSITORY
 * ============================================================================
 * Canonical repository managing:
 * - Historical assignments: /projects/{projectId}/driver_truck_assignments/{assignmentId}
 * - Active Driver slots: /projects/{projectId}/driver_active_assignments/{driverId}
 * - Active Truck slots: /projects/{projectId}/truck_active_assignments/{truckId}
 */
export class ProjectDriverTruckAssignmentRepository {
  // In-memory data structures for fast unit tests or when unauthenticated
  private inMemoryAssignments: Map<string, ProjectDriverTruckAssignmentEntity> = new Map();
  private inMemoryDriverSlots: Map<string, ActiveAssignmentSlotPayload> = new Map(); // key: `${projectId}#${driverId}`
  private inMemoryTruckSlots: Map<string, ActiveAssignmentSlotPayload> = new Map(); // key: `${projectId}#${truckId}`

  private getSlotKey(projectId: string, entityId: string): string {
    return `${projectId}#${entityId}`;
  }

  /**
   * Internal test helper to clear in-memory stores
   */
  _clearMemory(): void {
    this.inMemoryAssignments.clear();
    this.inMemoryDriverSlots.clear();
    this.inMemoryTruckSlots.clear();
  }

  /**
   * Fetch an assignment document by ID
   */
  async getAssignment(projectId: string, assignmentId: string, transaction?: Transaction): Promise<ProjectDriverTruckAssignmentEntity | null> {
    if (!projectId || !assignmentId) return null;

    if (!auth.currentUser) {
      return this.inMemoryAssignments.get(assignmentId) || null;
    }

    const docPath = `projects/${projectId}/driver_truck_assignments/${assignmentId}`;
    try {
      const docRef = doc(db, 'projects', projectId, 'driver_truck_assignments', assignmentId);
      if (transaction) {
        const snap = await transaction.get(docRef);
        return snap.exists() ? snap.data() as ProjectDriverTruckAssignmentEntity : null;
      }
      const snap = await getDoc(docRef);
      if (!snap.exists()) {
        return this.inMemoryAssignments.get(assignmentId) || null;
      }
      return snap.data() as ProjectDriverTruckAssignmentEntity;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, docPath);
      return this.inMemoryAssignments.get(assignmentId) || null;
    }
  }

  async listAssignments(projectId: string, transaction?: Transaction): Promise<ProjectDriverTruckAssignmentEntity[]> {
    const colRef = collection(db, 'projects', projectId, 'driver_truck_assignments');
    const q = query(colRef);
    if (transaction) {
      const snap = await getDocs(q);
      return snap.docs.map(d => d.data() as ProjectDriverTruckAssignmentEntity);
    }
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as ProjectDriverTruckAssignmentEntity);
  }

  /**
   * Fetch active assignment slot pointer for driver
   */
  async getActiveDriverSlot(projectId: string, driverId: string, transaction?: Transaction): Promise<ActiveAssignmentSlotPayload | null> {
    if (!projectId || !driverId) return null;

    const compKey = this.getSlotKey(projectId, driverId);
    if (!auth.currentUser) {
      return this.inMemoryDriverSlots.get(compKey) || null;
    }

    const docPath = `projects/${projectId}/driver_active_assignments/${driverId}`;
    try {
      const docRef = doc(db, 'projects', projectId, 'driver_active_assignments', driverId);
      if (transaction) {
        const snap = await transaction.get(docRef);
        return snap.exists() ? snap.data() as ActiveAssignmentSlotPayload : null;
      }
      const snap = await getDoc(docRef);
      if (!snap.exists()) {
        return this.inMemoryDriverSlots.get(compKey) || null;
      }
      return snap.data() as ActiveAssignmentSlotPayload;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, docPath);
      return this.inMemoryDriverSlots.get(compKey) || null;
    }
  }

  /**
   * Fetch active assignment slot pointer for truck
   */
  async getActiveTruckSlot(projectId: string, truckId: string, transaction?: Transaction): Promise<ActiveAssignmentSlotPayload | null> {
    if (!projectId || !truckId) return null;

    const compKey = this.getSlotKey(projectId, truckId);
    if (!auth.currentUser) {
      return this.inMemoryTruckSlots.get(compKey) || null;
    }

    const docPath = `projects/${projectId}/truck_active_assignments/${truckId}`;
    try {
      const docRef = doc(db, 'projects', projectId, 'truck_active_assignments', truckId);
      if (transaction) {
        const snap = await transaction.get(docRef);
        return snap.exists() ? snap.data() as ActiveAssignmentSlotPayload : null;
      }
      const snap = await getDoc(docRef);
      if (!snap.exists()) {
        return this.inMemoryTruckSlots.get(compKey) || null;
      }
      return snap.data() as ActiveAssignmentSlotPayload;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, docPath);
      return this.inMemoryTruckSlots.get(compKey) || null;
    }
  }

  /**
   * Get active assignment entity for Driver
   */
  async getActiveAssignmentByDriver(projectId: string, driverId: string): Promise<ProjectDriverTruckAssignmentEntity | null> {
    const slot = await this.getActiveDriverSlot(projectId, driverId);
    if (!slot || !slot.assignmentId) return null;
    const assignment = await this.getAssignment(projectId, slot.assignmentId);
    if (!assignment || assignment.status !== 'ACTIVE') return null;
    return assignment;
  }

  /**
   * Get active assignment entity for Truck
   */
  async getActiveAssignmentByTruck(projectId: string, truckId: string): Promise<ProjectDriverTruckAssignmentEntity | null> {
    const slot = await this.getActiveTruckSlot(projectId, truckId);
    if (!slot || !slot.assignmentId) return null;
    const assignment = await this.getAssignment(projectId, slot.assignmentId);
    if (!assignment || assignment.status !== 'ACTIVE') return null;
    return assignment;
  }

  /**
   * List assignment history for Driver
   */
  async listDriverAssignmentHistory(projectId: string, driverId: string): Promise<ProjectDriverTruckAssignmentEntity[]> {
    if (!projectId || !driverId) return [];

    if (!auth.currentUser) {
      return Array.from(this.inMemoryAssignments.values())
        .filter((a) => a.projectId === projectId && a.driverId === driverId)
        .sort((a, b) => new Date(b.effectiveFrom).getTime() - new Date(a.effectiveFrom).getTime());
    }

    const colPath = `projects/${projectId}/driver_truck_assignments`;
    try {
      const colRef = collection(db, 'projects', projectId, 'driver_truck_assignments');
      const q = query(colRef, where('driverId', '==', driverId), orderBy('effectiveFrom', 'desc'));
      const snap = await getDocs(q);
      const live = snap.docs.map((d) => d.data() as ProjectDriverTruckAssignmentEntity);
      if (live.length === 0) {
        return Array.from(this.inMemoryAssignments.values())
          .filter((a) => a.projectId === projectId && a.driverId === driverId)
          .sort((a, b) => new Date(b.effectiveFrom).getTime() - new Date(a.effectiveFrom).getTime());
      }
      return live;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, colPath);
      return Array.from(this.inMemoryAssignments.values())
        .filter((a) => a.projectId === projectId && a.driverId === driverId)
        .sort((a, b) => new Date(b.effectiveFrom).getTime() - new Date(a.effectiveFrom).getTime());
    }
  }

  /**
   * List assignment history for Truck
   */
  async listTruckAssignmentHistory(projectId: string, truckId: string): Promise<ProjectDriverTruckAssignmentEntity[]> {
    if (!projectId || !truckId) return [];

    if (!auth.currentUser) {
      return Array.from(this.inMemoryAssignments.values())
        .filter((a) => a.projectId === projectId && a.truckId === truckId)
        .sort((a, b) => new Date(b.effectiveFrom).getTime() - new Date(a.effectiveFrom).getTime());
    }

    const colPath = `projects/${projectId}/driver_truck_assignments`;
    try {
      const colRef = collection(db, 'projects', projectId, 'driver_truck_assignments');
      const q = query(colRef, where('truckId', '==', truckId), orderBy('effectiveFrom', 'desc'));
      const snap = await getDocs(q);
      const live = snap.docs.map((d) => d.data() as ProjectDriverTruckAssignmentEntity);
      if (live.length === 0) {
        return Array.from(this.inMemoryAssignments.values())
          .filter((a) => a.projectId === projectId && a.truckId === truckId)
          .sort((a, b) => new Date(b.effectiveFrom).getTime() - new Date(a.effectiveFrom).getTime());
      }
      return live;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, colPath);
      return Array.from(this.inMemoryAssignments.values())
        .filter((a) => a.projectId === projectId && a.truckId === truckId)
        .sort((a, b) => new Date(b.effectiveFrom).getTime() - new Date(a.effectiveFrom).getTime());
    }
  }

  /**
   * Transactional Precondition Validator:
   * Validates:
   * 1. Driver Project Membership == ACTIVE
   * 2. Truck Project Membership == ACTIVE
   * 3. Driver Carrier Affiliation == ACTIVE
   * 4. Truck Carrier Affiliation == ACTIVE
   * 5. driverCarrier.carrierId === truckCarrier.carrierId
   */
  async validateAssignmentPreconditions(projectId: string, driverId: string, truckId: string): Promise<string> {
    // 1. Driver Membership
    const driverMembership = await projectDriverMembershipRepository.getMembership(projectId, driverId);
    if (!driverMembership) {
      throw new Error(`PRECONDITION_FAILED: Driver membership does not exist for ID ${driverId} in project ${projectId}`);
    }
    if (driverMembership.status !== 'ACTIVE') {
      throw new Error(`PRECONDITION_FAILED: Driver membership for ID ${driverId} is ${driverMembership.status}, must be ACTIVE`);
    }

    // 2. Truck Membership
    const truckMembership = await projectTruckMembershipRepository.getMembership(projectId, truckId);
    if (!truckMembership) {
      throw new Error(`PRECONDITION_FAILED: Truck membership does not exist for ID ${truckId} in project ${projectId}`);
    }
    if (truckMembership.status !== 'ACTIVE') {
      throw new Error(`PRECONDITION_FAILED: Truck membership for ID ${truckId} is ${truckMembership.status}, must be ACTIVE`);
    }

    // 3. Driver Carrier Affiliation
    const driverAffiliation = await projectDriverCarrierAffiliationRepository.getAffiliation(projectId, driverId);
    if (!driverAffiliation) {
      throw new Error(`PRECONDITION_FAILED: Driver carrier affiliation does not exist for ID ${driverId} in project ${projectId}`);
    }
    if (driverAffiliation.status !== 'ACTIVE') {
      throw new Error(`PRECONDITION_FAILED: Driver carrier affiliation for ID ${driverId} is ${driverAffiliation.status}, must be ACTIVE`);
    }

    // 4. Truck Carrier Affiliation
    const truckAffiliation = await projectTruckCarrierAffiliationRepository.getAffiliation(projectId, truckId);
    if (!truckAffiliation) {
      throw new Error(`PRECONDITION_FAILED: Truck carrier affiliation does not exist for ID ${truckId} in project ${projectId}`);
    }
    if (truckAffiliation.status !== 'ACTIVE') {
      throw new Error(`PRECONDITION_FAILED: Truck carrier affiliation for ID ${truckId} is ${truckAffiliation.status}, must be ACTIVE`);
    }

    // 5. Same Carrier Check
    if (driverAffiliation.carrierId !== truckAffiliation.carrierId) {
      throw new Error(`PRECONDITION_FAILED: Cross-carrier pairing rejected. Driver ${driverId} belongs to carrier ${driverAffiliation.carrierId} while Truck ${truckId} belongs to carrier ${truckAffiliation.carrierId}`);
    }

    return driverAffiliation.carrierId;
  }

  /**
   * Canonical Assignment Mutation: assignDriverToTruck
   * Handles:
   * - initial assignment
   * - Driver changes Truck
   * - Truck changes Driver
   * - Idempotency
   * - Counterpart slot referential integrity
   * - Atomic Firestore transaction
   */
  async assignDriverToTruck(
    projectId: string,
    driverId: string,
    truckId: string,
    actorId: string
  ): Promise<AssignDriverToTruckResult> {
    if (!projectId || !driverId || !truckId) {
      throw new Error('INVALID_ARGUMENT: projectId, driverId, and truckId are required');
    }
    if (!actorId) {
      throw new Error('INVALID_ARGUMENT: actorId is required');
    }

    // In-memory or authenticated Firestore transaction execution
    if (!auth.currentUser) {
      return this._assignDriverToTruckInMemory(projectId, driverId, truckId, actorId);
    }

    return this._assignDriverToTruckFirestore(projectId, driverId, truckId, actorId);
  }

  /**
   * In-memory atomic implementation of assignDriverToTruck
   */
  private async _assignDriverToTruckInMemory(
    projectId: string,
    driverId: string,
    truckId: string,
    actorId: string
  ): Promise<AssignDriverToTruckResult> {
    // 1. Validate preconditions inside transaction boundary
    const carrierId = await this.validateAssignmentPreconditions(projectId, driverId, truckId);

    const now = new Date().toISOString();
    const driverSlotKey = this.getSlotKey(projectId, driverId);
    const truckSlotKey = this.getSlotKey(projectId, truckId);

    const currentDriverSlot = this.inMemoryDriverSlots.get(driverSlotKey);
    const currentTruckSlot = this.inMemoryTruckSlots.get(truckSlotKey);

    // 2. Check Idempotency: both slots point to same active assignment between driverId and truckId
    if (
      currentDriverSlot &&
      currentTruckSlot &&
      currentDriverSlot.assignmentId === currentTruckSlot.assignmentId
    ) {
      const existing = this.inMemoryAssignments.get(currentDriverSlot.assignmentId);
      if (existing && existing.status === 'ACTIVE' && existing.driverId === driverId && existing.truckId === truckId) {
        return {
          assignment: existing,
          idempotent: true,
          reassignedDriver: false,
          reassignedTruck: false,
          closedAssignments: [],
        };
      }
    }

    // 3. Pointer Corruption Detection
    if (currentDriverSlot) {
      const dAssign = this.inMemoryAssignments.get(currentDriverSlot.assignmentId);
      if (dAssign && dAssign.driverId !== driverId) {
        throw new Error(`ASSIGNMENT_POINTER_INTEGRITY_ERROR: Driver slot points to assignment ${dAssign.assignmentId} with mismatched driverId ${dAssign.driverId}`);
      }
    }
    if (currentTruckSlot) {
      const tAssign = this.inMemoryAssignments.get(currentTruckSlot.assignmentId);
      if (tAssign && tAssign.truckId !== truckId) {
        throw new Error(`ASSIGNMENT_POINTER_INTEGRITY_ERROR: Truck slot points to assignment ${tAssign.assignmentId} with mismatched truckId ${tAssign.truckId}`);
      }
    }

    const closedAssignments: string[] = [];
    let reassignedDriver = false;
    let reassignedTruck = false;

    // 4. Resolve Counterpart Entities and Close Conflicting Active Assignments
    // A. If Driver D is currently assigned to Truck A
    if (currentDriverSlot) {
      const dAssign = this.inMemoryAssignments.get(currentDriverSlot.assignmentId);
      if (dAssign && dAssign.status === 'ACTIVE') {
        const oldTruckId = dAssign.truckId;
        const oldTruckSlotKey = this.getSlotKey(projectId, oldTruckId);
        const oldTruckSlot = this.inMemoryTruckSlots.get(oldTruckSlotKey);

        // Verify counterpart truck pointer references this assignment
        if (oldTruckSlot && oldTruckSlot.assignmentId === dAssign.assignmentId) {
          this.inMemoryTruckSlots.delete(oldTruckSlotKey);
        }

        // Close D ↔ A
        const closedDAssign: ProjectDriverTruckAssignmentEntity = {
          ...dAssign,
          status: 'CLOSED',
          effectiveTo: now,
        };
        this.inMemoryAssignments.set(closedDAssign.assignmentId, closedDAssign);
        closedAssignments.push(closedDAssign.assignmentId);
        reassignedDriver = true;
      }
      this.inMemoryDriverSlots.delete(driverSlotKey);
    }

    // B. If Truck B is currently assigned to Driver X
    if (currentTruckSlot) {
      const tAssign = this.inMemoryAssignments.get(currentTruckSlot.assignmentId);
      if (tAssign && tAssign.status === 'ACTIVE' && tAssign.assignmentId !== currentDriverSlot?.assignmentId) {
        const oldDriverId = tAssign.driverId;
        const oldDriverSlotKey = this.getSlotKey(projectId, oldDriverId);
        const oldDriverSlot = this.inMemoryDriverSlots.get(oldDriverSlotKey);

        // Verify counterpart driver pointer references this assignment
        if (oldDriverSlot && oldDriverSlot.assignmentId === tAssign.assignmentId) {
          this.inMemoryDriverSlots.delete(oldDriverSlotKey);
        }

        // Close X ↔ B
        const closedTAssign: ProjectDriverTruckAssignmentEntity = {
          ...tAssign,
          status: 'CLOSED',
          effectiveTo: now,
        };
        this.inMemoryAssignments.set(closedTAssign.assignmentId, closedTAssign);
        closedAssignments.push(closedTAssign.assignmentId);
        reassignedTruck = true;
      }
      this.inMemoryTruckSlots.delete(truckSlotKey);
    }

    // 5. Create new Assignment D ↔ B
    const assignmentId = generateOpaqueAssignmentId();
    const newAssignment: ProjectDriverTruckAssignmentEntity = {
      assignmentId,
      projectId,
      driverId,
      truckId,
      status: 'ACTIVE',
      effectiveFrom: now,
      effectiveTo: null,
      createdAt: now,
      createdBy: actorId,
    };

    // 6. Set Active Slots
    this.inMemoryAssignments.set(assignmentId, newAssignment);
    this.inMemoryDriverSlots.set(driverSlotKey, { assignmentId });
    this.inMemoryTruckSlots.set(truckSlotKey, { assignmentId });

    // 7. Audit log event
    await auditLogRepository.create({
      auditLogId: `AUD-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      projectId,
      entityType: 'TRUCK',
      entityId: truckId,
      action: reassignedDriver || reassignedTruck ? 'UPDATE' : 'CREATE',
      actor: {
        userId: actorId,
        email: `${actorId}@system.local`,
        role: 'PROJECT_ADMIN',
      },
      changes: {
        before: { closedAssignments },
        after: { assignmentId, driverId, truckId, status: 'ACTIVE', carrierId },
        deltaFields: ['status', 'driverId', 'truckId'],
      },
      correlationId: `ASN-${projectId}-${assignmentId}`,
      createdBy: actorId,
      updatedBy: actorId,
    });

    return {
      assignment: newAssignment,
      idempotent: false,
      reassignedDriver,
      reassignedTruck,
      closedAssignments,
    };
  }

  /**
   * Live Firestore Transactional implementation of assignDriverToTruck
   */
  private async _assignDriverToTruckFirestore(
    projectId: string,
    driverId: string,
    truckId: string,
    actorId: string
  ): Promise<AssignDriverToTruckResult> {
    const colPath = `projects/${projectId}/driver_truck_assignments`;

    try {
      return await runTransaction(db, async (transaction) => {
        // 1. Transactional Precondition Reads
        const driverMemRef = doc(db, 'projects', projectId, 'driver_memberships', driverId);
        const truckMemRef = doc(db, 'projects', projectId, 'truck_memberships', truckId);
        const driverAffilRef = doc(db, 'projects', projectId, 'driver_carrier_affiliations', driverId);
        const truckAffilRef = doc(db, 'projects', projectId, 'truck_carrier_affiliations', truckId);

        const [driverMemSnap, truckMemSnap, driverAffilSnap, truckAffilSnap] = await Promise.all([
          transaction.get(driverMemRef),
          transaction.get(truckMemRef),
          transaction.get(driverAffilRef),
          transaction.get(truckAffilRef),
        ]);

        if (!driverMemSnap.exists() || driverMemSnap.data()?.status !== 'ACTIVE') {
          throw new Error(`PRECONDITION_FAILED: Driver membership for ID ${driverId} does not exist or is not ACTIVE`);
        }
        if (!truckMemSnap.exists() || truckMemSnap.data()?.status !== 'ACTIVE') {
          throw new Error(`PRECONDITION_FAILED: Truck membership for ID ${truckId} does not exist or is not ACTIVE`);
        }
        if (!driverAffilSnap.exists() || driverAffilSnap.data()?.status !== 'ACTIVE') {
          throw new Error(`PRECONDITION_FAILED: Driver carrier affiliation for ID ${driverId} does not exist or is not ACTIVE`);
        }
        if (!truckAffilSnap.exists() || truckAffilSnap.data()?.status !== 'ACTIVE') {
          throw new Error(`PRECONDITION_FAILED: Truck carrier affiliation for ID ${truckId} does not exist or is not ACTIVE`);
        }

        const driverCarrierId = driverAffilSnap.data()?.carrierId;
        const truckCarrierId = truckAffilSnap.data()?.carrierId;
        if (driverCarrierId !== truckCarrierId) {
          throw new Error(`PRECONDITION_FAILED: Cross-carrier pairing rejected. Driver ${driverId} belongs to ${driverCarrierId} while Truck ${truckId} belongs to ${truckCarrierId}`);
        }

        // 2. Read requested Driver and Truck active slots
        const driverSlotRef = doc(db, 'projects', projectId, 'driver_active_assignments', driverId);
        const truckSlotRef = doc(db, 'projects', projectId, 'truck_active_assignments', truckId);

        const [driverSlotSnap, truckSlotSnap] = await Promise.all([
          transaction.get(driverSlotRef),
          transaction.get(truckSlotRef),
        ]);

        const currentDriverSlot = driverSlotSnap.exists() ? (driverSlotSnap.data() as ActiveAssignmentSlotPayload) : null;
        const currentTruckSlot = truckSlotSnap.exists() ? (truckSlotSnap.data() as ActiveAssignmentSlotPayload) : null;

        // 3. Idempotency Check
        if (
          currentDriverSlot &&
          currentTruckSlot &&
          currentDriverSlot.assignmentId === currentTruckSlot.assignmentId
        ) {
          const assignRef = doc(db, 'projects', projectId, 'driver_truck_assignments', currentDriverSlot.assignmentId);
          const assignSnap = await transaction.get(assignRef);
          if (assignSnap.exists()) {
            const existing = assignSnap.data() as ProjectDriverTruckAssignmentEntity;
            if (existing.status === 'ACTIVE' && existing.driverId === driverId && existing.truckId === truckId) {
              return {
                assignment: existing,
                idempotent: true,
                reassignedDriver: false,
                reassignedTruck: false,
                closedAssignments: [],
              };
            }
          }
        }

        // 4. Resolve referenced assignment documents for counterpart tracking
        let dAssign: ProjectDriverTruckAssignmentEntity | null = null;
        let tAssign: ProjectDriverTruckAssignmentEntity | null = null;

        if (currentDriverSlot?.assignmentId) {
          const dRef = doc(db, 'projects', projectId, 'driver_truck_assignments', currentDriverSlot.assignmentId);
          const dSnap = await transaction.get(dRef);
          if (dSnap.exists()) {
            dAssign = dSnap.data() as ProjectDriverTruckAssignmentEntity;
            if (dAssign.driverId !== driverId) {
              throw new Error(`ASSIGNMENT_POINTER_INTEGRITY_ERROR: Driver slot points to assignment ${dAssign.assignmentId} with mismatched driverId ${dAssign.driverId}`);
            }
          }
        }

        if (currentTruckSlot?.assignmentId && currentTruckSlot.assignmentId !== currentDriverSlot?.assignmentId) {
          const tRef = doc(db, 'projects', projectId, 'driver_truck_assignments', currentTruckSlot.assignmentId);
          const tSnap = await transaction.get(tRef);
          if (tSnap.exists()) {
            tAssign = tSnap.data() as ProjectDriverTruckAssignmentEntity;
            if (tAssign.truckId !== truckId) {
              throw new Error(`ASSIGNMENT_POINTER_INTEGRITY_ERROR: Truck slot points to assignment ${tAssign.assignmentId} with mismatched truckId ${tAssign.truckId}`);
            }
          }
        }

        // 5. Read counterpart slot documents BEFORE writes
        let counterpartTruckSlotSnap: any = null;
        let counterpartTruckSlotRef: any = null;
        if (dAssign && dAssign.status === 'ACTIVE' && dAssign.truckId !== truckId) {
          counterpartTruckSlotRef = doc(db, 'projects', projectId, 'truck_active_assignments', dAssign.truckId);
          counterpartTruckSlotSnap = await transaction.get(counterpartTruckSlotRef);
        }

        let counterpartDriverSlotSnap: any = null;
        let counterpartDriverSlotRef: any = null;
        if (tAssign && tAssign.status === 'ACTIVE' && tAssign.driverId !== driverId) {
          counterpartDriverSlotRef = doc(db, 'projects', projectId, 'driver_active_assignments', tAssign.driverId);
          counterpartDriverSlotSnap = await transaction.get(counterpartDriverSlotRef);
        }

        // ==========================================
        // ALL READS COMPLETED -> PROCEED TO WRITES
        // ==========================================
        const now = new Date().toISOString();
        const closedAssignments: string[] = [];
        let reassignedDriver = false;
        let reassignedTruck = false;

        // Close old D ↔ A
        if (dAssign && dAssign.status === 'ACTIVE') {
          const dRef = doc(db, 'projects', projectId, 'driver_truck_assignments', dAssign.assignmentId);
          transaction.update(dRef, {
            status: 'CLOSED',
            effectiveTo: now,
          });
          closedAssignments.push(dAssign.assignmentId);
          reassignedDriver = true;

          // Release counterpart Truck slot if it still points to this assignment
          if (counterpartTruckSlotRef && counterpartTruckSlotSnap?.exists()) {
            if (counterpartTruckSlotSnap.data()?.assignmentId === dAssign.assignmentId) {
              transaction.delete(counterpartTruckSlotRef);
            }
          }
        }

        // Close old X ↔ B
        if (tAssign && tAssign.status === 'ACTIVE') {
          const tRef = doc(db, 'projects', projectId, 'driver_truck_assignments', tAssign.assignmentId);
          transaction.update(tRef, {
            status: 'CLOSED',
            effectiveTo: now,
          });
          closedAssignments.push(tAssign.assignmentId);
          reassignedTruck = true;

          // Release counterpart Driver slot if it still points to this assignment
          if (counterpartDriverSlotRef && counterpartDriverSlotSnap?.exists()) {
            if (counterpartDriverSlotSnap.data()?.assignmentId === tAssign.assignmentId) {
              transaction.delete(counterpartDriverSlotRef);
            }
          }
        }

        // Create new assignment D ↔ B
        const assignmentId = generateOpaqueAssignmentId();
        const newAssignment: ProjectDriverTruckAssignmentEntity = {
          assignmentId,
          projectId,
          driverId,
          truckId,
          status: 'ACTIVE',
          effectiveFrom: now,
          effectiveTo: null,
          createdAt: now,
          createdBy: actorId,
        };

        const newAssignRef = doc(db, 'projects', projectId, 'driver_truck_assignments', assignmentId);
        transaction.set(newAssignRef, newAssignment);

        // Update active slot pointers
        transaction.set(driverSlotRef, { assignmentId });
        transaction.set(truckSlotRef, { assignmentId });

        return {
          assignment: newAssignment,
          idempotent: false,
          reassignedDriver,
          reassignedTruck,
          closedAssignments,
        };
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, colPath);
      throw error;
    }
  }

  /**
   * Canonical Close Assignment Mutation
   */
  async closeAssignment(
    projectId: string,
    assignmentId: string,
    actorId: string
  ): Promise<CloseAssignmentResult> {
    if (!projectId || !assignmentId) {
      throw new Error('INVALID_ARGUMENT: projectId and assignmentId are required');
    }
    if (!actorId) {
      throw new Error('INVALID_ARGUMENT: actorId is required');
    }

    if (!auth.currentUser) {
      return this._closeAssignmentInMemory(projectId, assignmentId, actorId);
    }

    return this._closeAssignmentFirestore(projectId, assignmentId, actorId);
  }

  /**
   * In-memory implementation of closeAssignment
   */
  private async _closeAssignmentInMemory(
    projectId: string,
    assignmentId: string,
    actorId: string
  ): Promise<CloseAssignmentResult> {
    const assignment = this.inMemoryAssignments.get(assignmentId);
    if (!assignment || assignment.projectId !== projectId) {
      throw new Error(`NOT_FOUND: Assignment ${assignmentId} not found in project ${projectId}`);
    }

    // Idempotent return if already closed
    if (assignment.status === 'CLOSED') {
      return { assignment, idempotent: true };
    }

    const now = new Date().toISOString();
    const closed: ProjectDriverTruckAssignmentEntity = {
      ...assignment,
      status: 'CLOSED',
      effectiveTo: now,
    };

    this.inMemoryAssignments.set(assignmentId, closed);

    // Release slots if they point to this assignment
    const driverSlotKey = this.getSlotKey(projectId, assignment.driverId);
    const truckSlotKey = this.getSlotKey(projectId, assignment.truckId);

    const dSlot = this.inMemoryDriverSlots.get(driverSlotKey);
    if (dSlot && dSlot.assignmentId === assignmentId) {
      this.inMemoryDriverSlots.delete(driverSlotKey);
    }

    const tSlot = this.inMemoryTruckSlots.get(truckSlotKey);
    if (tSlot && tSlot.assignmentId === assignmentId) {
      this.inMemoryTruckSlots.delete(truckSlotKey);
    }

    // Audit log
    await auditLogRepository.create({
      auditLogId: `AUD-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      projectId,
      entityType: 'TRUCK',
      entityId: assignment.truckId,
      action: 'UPDATE',
      actor: {
        userId: actorId,
        email: `${actorId}@system.local`,
        role: 'PROJECT_ADMIN',
      },
      changes: {
        before: { status: 'ACTIVE', effectiveTo: null },
        after: { status: 'CLOSED', effectiveTo: now },
        deltaFields: ['status', 'effectiveTo'],
      },
      correlationId: `ASN-CLOSE-${projectId}-${assignmentId}`,
      createdBy: actorId,
      updatedBy: actorId,
    });

    return { assignment: closed, idempotent: false };
  }

  /**
   * Live Firestore Transactional implementation of closeAssignment
   */
  private async _closeAssignmentFirestore(
    projectId: string,
    assignmentId: string,
    actorId: string
  ): Promise<CloseAssignmentResult> {
    const docPath = `projects/${projectId}/driver_truck_assignments/${assignmentId}`;

    try {
      return await runTransaction(db, async (transaction) => {
        const assignRef = doc(db, 'projects', projectId, 'driver_truck_assignments', assignmentId);
        const assignSnap = await transaction.get(assignRef);

        if (!assignSnap.exists()) {
          throw new Error(`NOT_FOUND: Assignment ${assignmentId} not found in project ${projectId}`);
        }

        const assignment = assignSnap.data() as ProjectDriverTruckAssignmentEntity;
        if (assignment.status === 'CLOSED') {
          return { assignment, idempotent: true };
        }

        // Read active slots before writing
        const driverSlotRef = doc(db, 'projects', projectId, 'driver_active_assignments', assignment.driverId);
        const truckSlotRef = doc(db, 'projects', projectId, 'truck_active_assignments', assignment.truckId);

        const [driverSlotSnap, truckSlotSnap] = await Promise.all([
          transaction.get(driverSlotRef),
          transaction.get(truckSlotRef),
        ]);

        const now = new Date().toISOString();

        // Close assignment
        transaction.update(assignRef, {
          status: 'CLOSED',
          effectiveTo: now,
        });

        // Release slots if pointing to this assignment
        if (driverSlotSnap.exists() && driverSlotSnap.data()?.assignmentId === assignmentId) {
          transaction.delete(driverSlotRef);
        }
        if (truckSlotSnap.exists() && truckSlotSnap.data()?.assignmentId === assignmentId) {
          transaction.delete(truckSlotRef);
        }

        const closedAssignment: ProjectDriverTruckAssignmentEntity = {
          ...assignment,
          status: 'CLOSED',
          effectiveTo: now,
        };

        return { assignment: closedAssignment, idempotent: false };
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, docPath);
      throw error;
    }
  }
}

export const projectDriverTruckAssignmentRepository = new ProjectDriverTruckAssignmentRepository();
