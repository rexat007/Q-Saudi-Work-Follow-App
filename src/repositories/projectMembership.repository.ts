import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  serverTimestamp,
  query,
  where,
  runTransaction,
  Transaction,
  Timestamp,
} from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../firebase/errors';
import {
  MembershipStatus,
  BaseProjectMembershipEntity,
  ProjectDriverMembershipEntity,
  ProjectTruckMembershipEntity,
  ProjectCarrierMembershipEntity,
  ProjectMaterialMembershipEntity,
} from '../types/projectMembership';
import {
  globalDriverRepository,
  globalTruckRepository,
  globalCarrierRepository,
  globalMaterialRepository,
} from './globalIdentity.repository';

/**
 * Valid membership state transition policy
 */
const VALID_TRANSITIONS: Record<MembershipStatus, MembershipStatus[]> = {
  ACTIVE: ['SUSPENDED', 'REMOVED'],
  SUSPENDED: ['ACTIVE', 'REMOVED'],
  REMOVED: ['ACTIVE'], // Explicit reactivation
};

export type MembershipEntityType = 'driver' | 'truck' | 'carrier' | 'material';

export interface AttachMemberOptions {
  metadata?: Record<string, any>;
}

export interface SetStatusOptions {
  reason?: string;
}

/**
 * ============================================================================
 * GENERIC PROJECT MEMBERSHIP REPOSITORY FOUNDATION
 * ============================================================================
 * Provides typed, isolated subcollection persistence for Driver, Truck, Carrier,
 * and Material project memberships without code duplication.
 *
 * Enforces:
 * 1. Natural document path uniqueness: /projects/{projectId}/{subcollection}/{entityId}
 * 2. Strict IDEMPOTENCY: Re-attaching an already ACTIVE member is a no-op returning existing record.
 * 3. EXPLICIT TRANSITIONS: Cannot silently overwrite SUSPENDED or REMOVED state via attach.
 * 4. GLOBAL EXISTENCE VERIFICATION: Rejects dangling membership creation.
 * 5. KEY MINIMIZATION: Zero redundant keys (no composite membershipId, no entityId duplication).
 * 6. ZERO PROFILE DUPLICATION: No PII, plate, nationalId, or catalog attributes stored.
 */
export class ProjectMembershipRepository<
  TEntity extends BaseProjectMembershipEntity,
  TIdKey extends 'driverId' | 'truckId' | 'carrierId' | 'materialId'
> {
  private inMemoryMemberships: Map<string, TEntity> = new Map(); // key: `${projectId}_${entityId}`

  constructor(
    public readonly entityType: MembershipEntityType,
    public readonly subcollectionName: string,
    public readonly idKey: TIdKey,
    private readonly verifyGlobalExistence: (entityId: string) => Promise<boolean>
  ) {}

  /**
   * Internal composite key for in-memory and unit test isolation
   */
  private getCompositeKey(projectId: string, entityId: string): string {
    return `${projectId}#${entityId}`;
  }

  /**
   * Clear cache for testing isolation
   */
  clearInMemoryCache(): void {
    this.inMemoryMemberships.clear();
  }

  /**
   * Retrieve a specific membership record
   */
  async getMembership(projectId: string, entityId: string): Promise<TEntity | null> {
    if (!projectId || !entityId) return null;
    const compKey = this.getCompositeKey(projectId, entityId);

    if (!auth.currentUser) {
      return this.inMemoryMemberships.get(compKey) || null;
    }

    const path = `projects/${projectId}/${this.subcollectionName}/${entityId}`;
    try {
      const snap = await getDoc(doc(db, 'projects', projectId, this.subcollectionName, entityId));
      if (!snap.exists()) {
        return this.inMemoryMemberships.get(compKey) || null;
      }
      return snap.data() as TEntity;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return this.inMemoryMemberships.get(compKey) || null;
    }
  }

  /**
   * List all memberships for a project (optionally filter by status)
   */
  async listMemberships(projectId: string, statusFilter?: MembershipStatus): Promise<TEntity[]> {
    if (!projectId) return [];

    if (!auth.currentUser) {
      const all = Array.from(this.inMemoryMemberships.values()).filter(m => m.projectId === projectId);
      return statusFilter ? all.filter(m => m.status === statusFilter) : all;
    }

    const path = `projects/${projectId}/${this.subcollectionName}`;
    try {
      const colRef = collection(db, 'projects', projectId, this.subcollectionName);
      const q = statusFilter ? query(colRef, where('status', '==', statusFilter)) : query(colRef);
      const snap = await getDocs(q);
      const live = snap.docs.map(d => d.data() as TEntity);
      if (live.length === 0) {
        const cached = Array.from(this.inMemoryMemberships.values()).filter(m => m.projectId === projectId);
        return statusFilter ? cached.filter(m => m.status === statusFilter) : cached;
      }
      return live;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      const cached = Array.from(this.inMemoryMemberships.values()).filter(m => m.projectId === projectId);
      return statusFilter ? cached.filter(m => m.status === statusFilter) : cached;
    }
  }

  /**
   * Checks if an entity currently has an ACTIVE membership in the project
   */
  async hasActiveMembership(projectId: string, entityId: string): Promise<boolean> {
    const membership = await this.getMembership(projectId, entityId);
    return membership !== null && membership.status === 'ACTIVE';
  }

  /**
   * Attach an existing Global Entity to Project P
   *
   * Idempotency Policy:
   * - If not present: Creates ACTIVE membership.
   * - If already ACTIVE: Returns existing without redundant mutation.
   * - If SUSPENDED or REMOVED: Throws error. Must call reactivateMember explicitly.
   * - If Global Entity does not exist: Throws DANGLING_MEMBERSHIP_PREVENTED.
   */
  async attachMember(
    projectId: string,
    entityId: string,
    createdBy: string,
    options?: AttachMemberOptions,
    transaction?: Transaction
  ): Promise<TEntity> {
    if (!projectId || !entityId) {
      throw new Error('INVALID_ARGUMENT: projectId and entityId are required');
    }

    // 1. Verify Global Entity Existence to prevent dangling reference
    const exists = await this.verifyGlobalExistence(entityId);
    if (!exists) {
      throw new Error(`DANGLING_MEMBERSHIP_PREVENTED: Global entity "${entityId}" (${this.entityType}) does not exist.`);
    }

    const compKey = this.getCompositeKey(projectId, entityId);
    const existing = await this.getMembership(projectId, entityId);

    if (existing) {
      if (existing.status === 'ACTIVE') {
        // Idempotent: already active member
        return existing;
      }
      // Re-attaching a non-active entity without explicit reactivation is blocked
      throw new Error(
        `MEMBERSHIP_STATE_CONFLICT: Entity "${entityId}" is currently "${existing.status}" in Project "${projectId}". Call setMembershipStatus('ACTIVE') to explicitly reactivate.`
      );
    }

    const now = new Date();
    const timestampOrDate = auth.currentUser ? serverTimestamp() : now;

    const newMembership: Record<string, any> = {
      projectId,
      [this.idKey]: entityId,
      status: 'ACTIVE' as MembershipStatus,
      statusChangedAt: timestampOrDate,
      createdAt: timestampOrDate,
      updatedAt: timestampOrDate,
      createdBy,
      updatedBy: createdBy,
      ...(options?.metadata || {}),
    };

    if (transaction && auth.currentUser) {
      const docRef = doc(db, 'projects', projectId, this.subcollectionName, entityId);
      transaction.set(docRef, newMembership);
    } else if (auth.currentUser) {
      const path = `projects/${projectId}/${this.subcollectionName}/${entityId}`;
      try {
        await setDoc(doc(db, 'projects', projectId, this.subcollectionName, entityId), newMembership);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }
    }

    const saved = { ...newMembership, statusChangedAt: now, createdAt: now, updatedAt: now } as TEntity;
    this.inMemoryMemberships.set(compKey, saved);
    return saved;
  }

  /**
   * Explicitly updates membership lifecycle state (ACTIVE <-> SUSPENDED -> REMOVED -> ACTIVE)
   */
  async setMembershipStatus(
    projectId: string,
    entityId: string,
    newStatus: MembershipStatus,
    updatedBy: string,
    options?: SetStatusOptions,
    transaction?: Transaction
  ): Promise<TEntity> {
    if (!projectId || !entityId) {
      throw new Error('INVALID_ARGUMENT: projectId and entityId are required');
    }

    const compKey = this.getCompositeKey(projectId, entityId);
    const existing = await this.getMembership(projectId, entityId);
    if (!existing) {
      throw new Error(`MEMBERSHIP_NOT_FOUND: Entity "${entityId}" is not a member of Project "${projectId}".`);
    }

    if (existing.status === newStatus) {
      return existing; // Idempotent
    }

    const allowed = VALID_TRANSITIONS[existing.status] || [];
    if (!allowed.includes(newStatus)) {
      throw new Error(
        `INVALID_STATE_TRANSITION: Cannot transition membership status from "${existing.status}" to "${newStatus}".`
      );
    }

    const now = new Date();
    const timestampOrDate = auth.currentUser ? serverTimestamp() : now;

    const updates: Partial<BaseProjectMembershipEntity> = {
      status: newStatus,
      statusChangedAt: timestampOrDate as any,
      statusReason: options?.reason || undefined,
      updatedAt: timestampOrDate as any,
      updatedBy,
    };

    if (transaction && auth.currentUser) {
      const docRef = doc(db, 'projects', projectId, this.subcollectionName, entityId);
      transaction.update(docRef, updates as Record<string, any>);
    } else if (auth.currentUser) {
      const path = `projects/${projectId}/${this.subcollectionName}/${entityId}`;
      try {
        await updateDoc(doc(db, 'projects', projectId, this.subcollectionName, entityId), updates as Record<string, any>);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, path);
      }
    }

    const updated = {
      ...existing,
      ...updates,
      statusChangedAt: now,
      updatedAt: now,
    } as TEntity;

    this.inMemoryMemberships.set(compKey, updated);
    return updated;
  }
}

/**
 * ============================================================================
 * CANONICAL REPOSITORY SINGLETONS
 * ============================================================================
 */

export const projectDriverMembershipRepository = new ProjectMembershipRepository<
  ProjectDriverMembershipEntity,
  'driverId'
>('driver', 'driver_memberships', 'driverId', async (id) => {
  const driver = await globalDriverRepository.findById(id);
  return driver !== null;
});

export const projectTruckMembershipRepository = new ProjectMembershipRepository<
  ProjectTruckMembershipEntity,
  'truckId'
>('truck', 'truck_memberships', 'truckId', async (id) => {
  const truck = await globalTruckRepository.findById(id);
  return truck !== null;
});

export const projectCarrierMembershipRepository = new ProjectMembershipRepository<
  ProjectCarrierMembershipEntity,
  'carrierId'
>('carrier', 'carrier_memberships', 'carrierId', async (id) => {
  const carrier = await globalCarrierRepository.findById(id);
  return carrier !== null;
});

export const projectMaterialMembershipRepository = new ProjectMembershipRepository<
  ProjectMaterialMembershipEntity,
  'materialId'
>('material', 'material_memberships', 'materialId', async (id) => {
  const material = await globalMaterialRepository.findById(id);
  return material !== null;
});
