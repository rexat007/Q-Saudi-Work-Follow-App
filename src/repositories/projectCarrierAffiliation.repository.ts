import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
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
  AffiliationStatus,
  BaseProjectCarrierAffiliationEntity,
  ProjectDriverCarrierAffiliationEntity,
  ProjectTruckCarrierAffiliationEntity,
} from '../types/projectCarrierAffiliation';
import {
  projectDriverMembershipRepository,
  projectTruckMembershipRepository,
  projectCarrierMembershipRepository,
} from './projectMembership.repository';
import { auditLogRepository } from './auditLog.repository';

export type AffiliationEntityType = 'driver' | 'truck';

export interface SetAffiliationResult<T extends BaseProjectCarrierAffiliationEntity> {
  affiliation: T;
  reassigned: boolean;
  previousCarrierId: string | null;
  idempotent: boolean;
}

/**
 * Common Affiliation Audit Context
 */
export interface AffiliationAuditActor {
  userId: string;
  email: string;
  role: string;
}

/**
 * ============================================================================
 * GENERIC PROJECT CARRIER AFFILIATION REPOSITORY FOUNDATION
 * ============================================================================
 * Manages Driver and Truck operational Carrier affiliations under /projects/{projectId}
 * with deterministic document ID (driverId or truckId).
 *
 * Invariants:
 * 1. Document key is entityId. Zero redundant affiliationId.
 * 2. Strict Preconditions:
 *    - Entity (Driver/Truck) must have an ACTIVE Project Membership.
 *    - Target Carrier must have an ACTIVE Project Carrier Membership.
 * 3. Idempotency: Setting same carrier on already ACTIVE affiliation is a no-op.
 * 4. Carrier Reassignment: Atomically updates current affiliation authority and records audit provenance.
 * 5. Concurrency Safe: Uses Firestore transaction to detect concurrent modifications and ensure atomicity.
 * 6. Zero Profile/PII Duplication: Contains only canonical IDs, status, and audit stamps.
 * 7. Zero Material IDs: Strictly excluded.
 */
export class GenericProjectCarrierAffiliationRepository<
  TEntity extends BaseProjectCarrierAffiliationEntity,
  TIdKey extends 'driverId' | 'truckId'
> {
  private inMemoryStore: Map<string, TEntity> = new Map();

  constructor(
    public readonly subcollectionName: string,
    public readonly entityType: AffiliationEntityType,
    public readonly idKey: TIdKey
  ) {}

  private getStoreKey(projectId: string, entityId: string): string {
    return `${projectId}:${entityId}`;
  }

  /**
   * Fetch current carrier affiliation for an entity in project
   */
  async getAffiliation(projectId: string, entityId: string, transaction?: Transaction): Promise<TEntity | null> {
    if (!projectId || !entityId) return null;

    if (!auth.currentUser) {
      return this.inMemoryStore.get(this.getStoreKey(projectId, entityId)) || null;
    }

    const docPath = `projects/${projectId}/${this.subcollectionName}/${entityId}`;
    try {
      const docRef = doc(db, 'projects', projectId, this.subcollectionName, entityId);
      if (transaction) {
        const snap = await transaction.get(docRef);
        return snap.exists() ? snap.data() as TEntity : null;
      }
      const snap = await getDoc(docRef);
      if (!snap.exists()) {
        return null;
      }
      return snap.data() as TEntity;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, docPath);
      return null;
    }
  }

  /**
   * List all entity affiliations for a specific Carrier in a project
   */
  async listAffiliationsByCarrier(projectId: string, carrierId: string): Promise<TEntity[]> {
    if (!projectId || !carrierId) return [];

    if (!auth.currentUser) {
      return Array.from(this.inMemoryStore.values()).filter(
        (a) => a.projectId === projectId && a.carrierId === carrierId
      );
    }

    const colPath = `projects/${projectId}/${this.subcollectionName}`;
    try {
      const q = query(
        collection(db, 'projects', projectId, this.subcollectionName),
        where('carrierId', '==', carrierId)
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => d.data() as TEntity);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, colPath);
      return [];
    }
  }

  /**
   * Precondition Validator:
   * 1. Entity must have ACTIVE Project Membership
   * 2. Target Carrier must have ACTIVE Project Carrier Membership
   */
  private async validateAffiliationPreconditions(projectId: string, entityId: string, carrierId: string): Promise<void> {
    // 1. Verify Entity Membership
    let entityMembership;
    if (this.entityType === 'driver') {
      entityMembership = await projectDriverMembershipRepository.getMembership(projectId, entityId);
    } else {
      entityMembership = await projectTruckMembershipRepository.getMembership(projectId, entityId);
    }

    if (!entityMembership) {
      throw new Error(`PRECONDITION_FAILED: Project ${this.entityType} membership does not exist for ID ${entityId} in project ${projectId}`);
    }
    if (entityMembership.status !== 'ACTIVE') {
      throw new Error(`PRECONDITION_FAILED: Project ${this.entityType} membership for ID ${entityId} is ${entityMembership.status}, must be ACTIVE`);
    }

    // 2. Verify Carrier Membership
    const carrierMembership = await projectCarrierMembershipRepository.getMembership(projectId, carrierId);
    if (!carrierMembership) {
      throw new Error(`PRECONDITION_FAILED: Project carrier membership does not exist for ID ${carrierId} in project ${projectId}`);
    }
    if (carrierMembership.status !== 'ACTIVE') {
      throw new Error(`PRECONDITION_FAILED: Project carrier membership for ID ${carrierId} is ${carrierMembership.status}, must be ACTIVE`);
    }
  }

  /**
   * Set or Reassign Carrier Affiliation
   * Enforces idempotency, preconditions, atomic updates, and audit logging.
   */
  async createAffiliation(
    projectId: string,
    entityId: string,
    carrierId: string,
    createdBy: string,
    transaction?: Transaction,
    actorContext?: AffiliationAuditActor
  ): Promise<SetAffiliationResult<TEntity>> {
    // ... implementation ...
    return this.setAffiliation(projectId, entityId, carrierId, createdBy, transaction, actorContext);
  }

  async setAffiliation(
    projectId: string,
    entityId: string,
    carrierId: string,
    createdBy: string,
    transaction?: Transaction,
    actorContext?: AffiliationAuditActor
  ): Promise<SetAffiliationResult<TEntity>> {
    if (!projectId?.trim()) throw new Error('PROJECT_ID_REQUIRED');
    if (!entityId?.trim()) throw new Error('ENTITY_ID_REQUIRED');
    if (!carrierId?.trim()) throw new Error('CARRIER_ID_REQUIRED');
    if (!createdBy?.trim()) throw new Error('CREATOR_ID_REQUIRED');

    // Verify preconditions
    await this.validateAffiliationPreconditions(projectId, entityId, carrierId);

    const storeKey = this.getStoreKey(projectId, entityId);
    const docPath = `projects/${projectId}/${this.subcollectionName}/${entityId}`;
    const timestampOrDate = auth.currentUser ? serverTimestamp() : new Date();

    const executeLogic = async (currentSnapData: TEntity | null): Promise<SetAffiliationResult<TEntity>> => {
      // Check Idempotency: same carrier and currently ACTIVE
      if (currentSnapData && currentSnapData.carrierId === carrierId && currentSnapData.status === 'ACTIVE') {
        return {
          affiliation: currentSnapData,
          reassigned: false,
          previousCarrierId: null,
          idempotent: true,
        };
      }

      const isReassignment = !!currentSnapData && currentSnapData.carrierId !== carrierId;
      const previousCarrierId = currentSnapData ? currentSnapData.carrierId : null;

      const recordData = {
        projectId,
        [this.idKey]: entityId,
        carrierId,
        status: 'ACTIVE' as AffiliationStatus,
        createdAt: currentSnapData?.createdAt || timestampOrDate,
        createdBy: currentSnapData?.createdBy || createdBy,
        updatedAt: timestampOrDate,
        updatedBy: createdBy,
      } as unknown as TEntity;

      // In-Memory store update for local/test context
      this.inMemoryStore.set(storeKey, recordData);

      // Emit Audit Log
      const auditAction = isReassignment ? 'UPDATE' : 'CREATE';
      const eventCode = isReassignment
        ? (this.entityType === 'driver' ? 'DRIVER_CARRIER_AFFILIATION_CHANGED' : 'TRUCK_CARRIER_AFFILIATION_CHANGED')
        : (this.entityType === 'driver' ? 'DRIVER_CARRIER_AFFILIATION_SET' : 'TRUCK_CARRIER_AFFILIATION_SET');

      await auditLogRepository.create({
        auditLogId: `AUD-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        projectId,
        entityType: this.entityType === 'driver' ? 'CARRIER' : 'TRUCK',
        entityId,
        action: auditAction,
        actor: {
          userId: actorContext?.userId || createdBy,
          email: actorContext?.email || 'system@q-saudi.com',
          role: actorContext?.role || 'PROJECT_ADMIN',
        },
        changes: {
          before: currentSnapData ? { carrierId: previousCarrierId, status: currentSnapData.status } : null,
          after: { carrierId, status: 'ACTIVE', eventCode },
          deltaFields: ['carrierId', 'status', 'updatedAt', 'updatedBy'],
        },
        correlationId: `AFFIL-${projectId}-${entityId}`,
        createdBy: actorContext?.userId || createdBy,
        updatedBy: actorContext?.userId || createdBy,
      });

      return {
        affiliation: recordData,
        reassigned: isReassignment,
        previousCarrierId,
        idempotent: false,
      };
    };

    if (auth.currentUser) {
      try {
        const docRef = doc(db, 'projects', projectId, this.subcollectionName, entityId);

        if (transaction) {
          const snap = await transaction.get(docRef);
          const currentData = snap.exists() ? (snap.data() as TEntity) : null;
          const result = await executeLogic(currentData);
          transaction.set(docRef, result.affiliation);
          return result;
        } else {
          return await runTransaction(db, async (tx) => {
            const snap = await tx.get(docRef);
            const currentData = snap.exists() ? (snap.data() as TEntity) : null;
            const result = await executeLogic(currentData);
            tx.set(docRef, result.affiliation);
            return result;
          });
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, docPath);
      }
    }

    // Local / In-memory path
    const existing = this.inMemoryStore.get(storeKey) || null;
    return await executeLogic(existing);
  }

  /**
   * Update Affiliation Status (e.g. ACTIVE -> INACTIVE)
   */
  async setAffiliationStatus(
    projectId: string,
    entityId: string,
    status: AffiliationStatus,
    updatedBy: string,
    actorContext?: AffiliationAuditActor
  ): Promise<TEntity> {
    if (!projectId?.trim()) throw new Error('PROJECT_ID_REQUIRED');
    if (!entityId?.trim()) throw new Error('ENTITY_ID_REQUIRED');
    if (!updatedBy?.trim()) throw new Error('UPDATED_BY_REQUIRED');

    const storeKey = this.getStoreKey(projectId, entityId);
    const docPath = `projects/${projectId}/${this.subcollectionName}/${entityId}`;
    const timestampOrDate = auth.currentUser ? serverTimestamp() : new Date();

    const executeUpdate = async (currentSnapData: TEntity | null): Promise<TEntity> => {
      if (!currentSnapData) {
        throw new Error(`NOT_FOUND: Affiliation for ${entityId} does not exist in project ${projectId}`);
      }
      if (currentSnapData.status === status) {
        return currentSnapData;
      }

      const updated = {
        ...currentSnapData,
        status,
        updatedAt: timestampOrDate,
        updatedBy,
      } as unknown as TEntity;

      this.inMemoryStore.set(storeKey, updated);

      const eventCode = this.entityType === 'driver'
        ? 'DRIVER_CARRIER_AFFILIATION_STATUS_CHANGED'
        : 'TRUCK_CARRIER_AFFILIATION_STATUS_CHANGED';

      await auditLogRepository.create({
        auditLogId: `AUD-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        projectId,
        entityType: this.entityType === 'driver' ? 'CARRIER' : 'TRUCK',
        entityId,
        action: 'UPDATE',
        actor: {
          userId: actorContext?.userId || updatedBy,
          email: actorContext?.email || 'system@q-saudi.com',
          role: actorContext?.role || 'PROJECT_ADMIN',
        },
        changes: {
          before: { status: currentSnapData.status },
          after: { status, eventCode },
          deltaFields: ['status', 'updatedAt', 'updatedBy'],
        },
        correlationId: `AFFIL-STATUS-${projectId}-${entityId}`,
        createdBy: actorContext?.userId || updatedBy,
        updatedBy: actorContext?.userId || updatedBy,
      });

      return updated;
    };

    if (auth.currentUser) {
      try {
        const docRef = doc(db, 'projects', projectId, this.subcollectionName, entityId);
        return await runTransaction(db, async (tx) => {
          const snap = await tx.get(docRef);
          if (!snap.exists()) {
            throw new Error(`NOT_FOUND: Affiliation for ${entityId} does not exist in project ${projectId}`);
          }
          const currentData = snap.data() as TEntity;
          const updated = await executeUpdate(currentData);
          tx.set(docRef, updated);
          return updated;
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, docPath);
      }
    }

    const current = this.inMemoryStore.get(storeKey) || null;
    return await executeUpdate(current);
  }

  /**
   * Test-only helper to clear in-memory state
   */
  _clearMemory(): void {
    this.inMemoryStore.clear();
  }
}

/**
 * Canonical Project Driver Carrier Affiliation Repository
 * Path: /projects/{projectId}/driver_carrier_affiliations/{driverId}
 */
export const projectDriverCarrierAffiliationRepository =
  new GenericProjectCarrierAffiliationRepository<
    ProjectDriverCarrierAffiliationEntity,
    'driverId'
  >('driver_carrier_affiliations', 'driver', 'driverId');

/**
 * Canonical Project Truck Carrier Affiliation Repository
 * Path: /projects/{projectId}/truck_carrier_affiliations/{truckId}
 */
export const projectTruckCarrierAffiliationRepository =
  new GenericProjectCarrierAffiliationRepository<
    ProjectTruckCarrierAffiliationEntity,
    'truckId'
  >('truck_carrier_affiliations', 'truck', 'truckId');
