import { adminDb } from '../firebase/admin';
import { TripEntity, TripExceptionEntity, AuthUserContext } from '../types/entities';
import { TripPersistenceContext, TripService } from './trip.service';
import { ExceptionPersistenceContext, ExceptionService } from './exception.service';

/**
 * ============================================================================
 * SERVER-AUTHORITATIVE TRIP PERSISTENCE ADAPTER (UNIT 6A)
 * ============================================================================
 * Uses Firebase Admin SDK (adminDb) exclusively.
 * Strictly decoupled from client Firebase auth session state.
 * Fails closed on any persistence error with zero silent skips.
 */

export class ServerTripPersistenceAdapter implements TripPersistenceContext {
  public tripRepository = {
    async findById(projectId: string, tripId: string): Promise<TripEntity | null> {
      if (!projectId || !tripId) return null;
      const snap = await adminDb.collection('projects').doc(projectId).collection('trips').doc(tripId).get();
      if (!snap.exists) return null;
      return snap.data() as TripEntity;
    },

    async listByProject(projectId: string, maxLimit = 100): Promise<TripEntity[]> {
      if (!projectId) return [];
      const snap = await adminDb.collection('projects').doc(projectId).collection('trips').limit(maxLimit).get();
      return snap.docs.map((d: any) => d.data() as TripEntity);
    },

    async create(trip: Omit<TripEntity, 'createdAt' | 'updatedAt'> & { createdBy: string; updatedBy: string }): Promise<void> {
      if (!trip || !trip.projectId || !trip.tripId) {
        throw new Error('INVALID_TRIP_PAYLOAD: projectId and tripId are required for canonical trip persistence');
      }
      const now = new Date().toISOString();
      const payload = {
        ...trip,
        createdAt: now,
        updatedAt: now,
      };
      await adminDb.collection('projects').doc(trip.projectId).collection('trips').doc(trip.tripId).set(payload);
    },

    async update(projectId: string, tripId: string, updates: Partial<TripEntity>, updatedBy: string): Promise<void> {
      if (!projectId || !tripId) {
        throw new Error('INVALID_TRIP_UPDATE: projectId and tripId are required for canonical trip update');
      }
      const docRef = adminDb.collection('projects').doc(projectId).collection('trips').doc(tripId);
      const snap = await docRef.get();
      if (!snap.exists) {
        throw new Error(`TRIP_NOT_FOUND: Trip ${tripId} not found in project ${projectId}`);
      }
      const now = new Date().toISOString();
      const payload = {
        ...updates,
        tripId,
        projectId,
        updatedAt: now,
        updatedBy,
      };
      await docRef.update(payload);
    },
  };

  public projectRepository = {
    async findById(projectId: string): Promise<any> {
      if (!projectId) return null;
      const snap = await adminDb.collection('projects').doc(projectId).get();
      if (!snap.exists) return null;
      return snap.data();
    },
  };

  public globalCarrierRepository = {
    async findById(carrierId: string): Promise<any> {
      if (!carrierId) return null;
      const snap = await adminDb.collection('carriers').doc(carrierId).get();
      if (!snap.exists) return null;
      return snap.data();
    },
  };

  public globalTruckRepository = {
    async findById(truckId: string): Promise<any> {
      if (!truckId) return null;
      const snap = await adminDb.collection('trucks').doc(truckId).get();
      if (!snap.exists) return null;
      return snap.data();
    },
  };

  public globalDriverRepository = {
    async findById(driverId: string): Promise<any> {
      if (!driverId) return null;
      const snap = await adminDb.collection('drivers').doc(driverId).get();
      if (!snap.exists) return null;
      return snap.data();
    },
  };

  public globalMaterialRepository = {
    async findById(materialId: string): Promise<any> {
      if (!materialId) return null;
      const snap = await adminDb.collection('materials').doc(materialId).get();
      if (!snap.exists) return null;
      return snap.data();
    },
  };

  public projectCarrierMembershipRepository = {
    async getMembership(projectId: string, carrierId: string): Promise<any> {
      if (!projectId || !carrierId) return null;
      const snap = await adminDb.collection('projects').doc(projectId).collection('carrier_memberships').doc(carrierId).get();
      if (!snap.exists) return null;
      return snap.data();
    },
  };

  public projectTruckMembershipRepository = {
    async getMembership(projectId: string, truckId: string): Promise<any> {
      if (!projectId || !truckId) return null;
      const snap = await adminDb.collection('projects').doc(projectId).collection('truck_memberships').doc(truckId).get();
      if (!snap.exists) return null;
      return snap.data();
    },
  };

  public projectDriverMembershipRepository = {
    async getMembership(projectId: string, driverId: string): Promise<any> {
      if (!projectId || !driverId) return null;
      const snap = await adminDb.collection('projects').doc(projectId).collection('driver_memberships').doc(driverId).get();
      if (!snap.exists) return null;
      return snap.data();
    },
  };

  public projectMaterialMembershipRepository = {
    async getMembership(projectId: string, materialId: string): Promise<any> {
      if (!projectId || !materialId) return null;
      const snap = await adminDb.collection('projects').doc(projectId).collection('material_memberships').doc(materialId).get();
      if (!snap.exists) return null;
      return snap.data();
    },
  };

  public projectDriverCarrierAffiliationRepository = {
    async getAffiliation(projectId: string, driverId: string): Promise<any> {
      if (!projectId || !driverId) return null;
      const snap = await adminDb.collection('projects').doc(projectId).collection('driver_carrier_affiliations').doc(driverId).get();
      if (!snap.exists) return null;
      return snap.data();
    },
  };

  public projectTruckCarrierAffiliationRepository = {
    async getAffiliation(projectId: string, truckId: string): Promise<any> {
      if (!projectId || !truckId) return null;
      const snap = await adminDb.collection('projects').doc(projectId).collection('truck_carrier_affiliations').doc(truckId).get();
      if (!snap.exists) return null;
      return snap.data();
    },
  };

  public projectDriverTruckAssignmentRepository = {
    async getActiveAssignmentByDriver(projectId: string, driverId: string): Promise<any> {
      if (!projectId || !driverId) return null;
      // 1. Direct slot lookup
      const slotSnap = await adminDb.collection('projects').doc(projectId).collection('driver_active_assignments').doc(driverId).get();
      if (slotSnap.exists && slotSnap.data()?.assignmentId) {
        const assignSnap = await adminDb.collection('projects').doc(projectId).collection('driver_truck_assignments').doc(slotSnap.data()?.assignmentId).get();
        if (assignSnap.exists && assignSnap.data()?.status === 'ACTIVE') {
          return assignSnap.data();
        }
      }
      // 2. Query fallback
      const q = await adminDb.collection('projects').doc(projectId).collection('driver_truck_assignments')
        .where('driverId', '==', driverId)
        .get();
      if (!q.empty) {
        const active = q.docs.find((d: any) => d.data()?.status === 'ACTIVE');
        if (active) return active.data();
      }
      return null;
    },

    async getActiveAssignmentByTruck(projectId: string, truckId: string): Promise<any> {
      if (!projectId || !truckId) return null;
      // 1. Direct slot lookup
      const slotSnap = await adminDb.collection('projects').doc(projectId).collection('truck_active_assignments').doc(truckId).get();
      if (slotSnap.exists && slotSnap.data()?.assignmentId) {
        const assignSnap = await adminDb.collection('projects').doc(projectId).collection('driver_truck_assignments').doc(slotSnap.data()?.assignmentId).get();
        if (assignSnap.exists && assignSnap.data()?.status === 'ACTIVE') {
          return assignSnap.data();
        }
      }
      // 2. Query fallback
      const q = await adminDb.collection('projects').doc(projectId).collection('driver_truck_assignments')
        .where('truckId', '==', truckId)
        .get();
      if (!q.empty) {
        const active = q.docs.find((d: any) => d.data()?.status === 'ACTIVE');
        if (active) return active.data();
      }
      return null;
    },
  };

  public projectTruckMaterialAllocationRepository = {
    async getActiveAllocationByTruck(projectId: string, truckId: string): Promise<any> {
      if (!projectId || !truckId) return null;
      // 1. Direct slot lookup
      const slotSnap = await adminDb.collection('projects').doc(projectId).collection('truck_active_allocations').doc(truckId).get();
      if (slotSnap.exists && slotSnap.data()?.allocationId) {
        const allocSnap = await adminDb.collection('projects').doc(projectId).collection('truck_material_allocations').doc(slotSnap.data()?.allocationId).get();
        if (allocSnap.exists && allocSnap.data()?.status === 'ACTIVE') {
          return allocSnap.data();
        }
      }
      // 2. Query fallback
      const q = await adminDb.collection('projects').doc(projectId).collection('truck_material_allocations')
        .where('truckId', '==', truckId)
        .get();
      if (!q.empty) {
        const active = q.docs.find((d: any) => d.data()?.status === 'ACTIVE');
        if (active) return active.data();
      }
      return null;
    },
  };

  public pricingRuleRepository = {
    async findById(projectId: string, pricingRuleId: string): Promise<any> {
      if (!projectId || !pricingRuleId) return null;
      const snap = await adminDb.collection('projects').doc(projectId).collection('pricing_rules').doc(pricingRuleId).get();
      if (snap.exists) return snap.data();
      const altSnap = await adminDb.collection('projects').doc(projectId).collection('pricingRules').doc(pricingRuleId).get();
      if (altSnap.exists) return altSnap.data();
      return null;
    },
  };

  public tripNumberGenerator = {
    async getNextTripNumber(projectId: string, projectNumberVal?: number): Promise<string> {
      let formattedProjNum = /^Q-PRJ-\d+$/i.test(projectId) ? projectId.toUpperCase() : 'Q-PRJ-0001';
      if (projectNumberVal !== undefined) {
        formattedProjNum = `Q-PRJ-${String(projectNumberVal).padStart(4, '0')}`;
      } else {
        const projSnap = await adminDb.collection('projects').doc(projectId).get();
        if (projSnap.exists && typeof projSnap.data()?.projectNumber === 'number') {
          formattedProjNum = `Q-PRJ-${String(projSnap.data().projectNumber).padStart(4, '0')}`;
        }
      }

      const counterRef = adminDb.collection('systemCounters').doc(`tripNumber_${projectId}`);
      const nextNumber = await adminDb.runTransaction(async (tx: any) => {
        const snap = await tx.get(counterRef);
        let seq = 1;
        if (snap.exists) {
          const data = snap.data();
          seq = typeof data.nextNumber === 'number' ? data.nextNumber : 1;
        } else {
          const tripsSnap = await adminDb.collection('projects').doc(projectId).collection('trips').get();
          let maxExisting = 0;
          tripsSnap.docs.forEach((d: any) => {
            const data = d.data();
            if (data && data.tripNumber) {
              const parts = data.tripNumber.split('-TRP-');
              if (parts.length === 2) {
                const idx = parseInt(parts[1], 10);
                if (!isNaN(idx)) maxExisting = Math.max(maxExisting, idx);
              }
            }
          });
          seq = maxExisting > 0 ? maxExisting + 1 : 1;
        }

        tx.set(counterRef, {
          nextNumber: seq + 1,
          updatedAt: new Date().toISOString(),
        });
        return seq;
      });

      const formattedTripNum = `TRP-${String(nextNumber).padStart(5, '0')}`;
      return `${formattedProjNum}-${formattedTripNum}`;
    },
  };

  public tripEventService = {
    async recordEvent(payload: any, context: AuthUserContext): Promise<any> {
      const eventId = payload.eventId || `EVT-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const now = new Date().toISOString();
      const eventDoc = {
        ...payload,
        eventId,
        createdAt: now,
        updatedAt: now,
        actor: {
          userId: context.userId,
          role: context.role,
          displayName: context.displayName,
        },
        createdBy: context.userId,
        updatedBy: context.userId,
      };
      await adminDb.collection('projects').doc(payload.projectId).collection('trip_events').doc(eventId).set(eventDoc);
      return eventDoc;
    },
  };

  public auditLogService = {
    async recordLog(params: any, context: AuthUserContext): Promise<any> {
      const auditLogId = `AUD-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const now = new Date().toISOString();
      const logEntry = {
        auditLogId,
        projectId: params.projectId,
        entityType: params.entityType,
        entityId: params.entityId,
        action: params.action,
        actor: {
          userId: context.userId,
          email: context.email,
          role: context.role,
          ipAddress: context.ipAddress || 'server',
          userAgent: context.userAgent || 'server-admin',
        },
        changes: {
          before: params.before || null,
          after: params.after,
        },
        correlationId: params.correlationId || `CORR-${Date.now()}`,
        createdAt: now,
        updatedAt: now,
        createdBy: context.userId,
        updatedBy: context.userId,
      };
      await adminDb.collection('projects').doc(params.projectId).collection('audit_logs').doc(auditLogId).set(logEntry);
      return auditLogId;
    },
  };
}

export class ServerExceptionPersistenceAdapter implements ExceptionPersistenceContext {
  public exceptionRepository = {
    async listByTrip(projectId: string, tripId: string): Promise<TripExceptionEntity[]> {
      const safeTrip = tripId || '_general';
      const snap = await adminDb.collection('projects').doc(projectId).collection('trips').doc(safeTrip).collection('exceptions').get();
      return snap.docs.map((d: any) => d.data() as TripExceptionEntity);
    },

    async create(exception: Omit<TripExceptionEntity, 'createdAt' | 'updatedAt'> & { createdBy: string; updatedBy: string }): Promise<void> {
      if (!exception || !exception.projectId || !exception.exceptionId) {
        throw new Error('INVALID_EXCEPTION_PAYLOAD: projectId and exceptionId are required');
      }
      const safeTrip = exception.tripId || '_general';
      const now = new Date().toISOString();
      const payload = {
        ...exception,
        createdAt: now,
        updatedAt: now,
      };
      await adminDb.collection('projects').doc(exception.projectId).collection('trips').doc(safeTrip).collection('exceptions').doc(exception.exceptionId).set(payload);
    },

    async update(projectId: string, tripId: string | null, exceptionId: string, updates: Partial<TripExceptionEntity>, updatedBy: string): Promise<void> {
      if (!projectId || !exceptionId) {
        throw new Error('INVALID_EXCEPTION_UPDATE: projectId and exceptionId are required');
      }
      const safeTrip = tripId || '_general';
      const docRef = adminDb.collection('projects').doc(projectId).collection('trips').doc(safeTrip).collection('exceptions').doc(exceptionId);
      const snap = await docRef.get();
      if (!snap.exists) {
        throw new Error(`EXCEPTION_NOT_FOUND: Exception ${exceptionId} not found`);
      }
      const now = new Date().toISOString();
      const payload = {
        ...updates,
        exceptionId,
        tripId,
        projectId,
        updatedAt: now,
        updatedBy,
      };
      await docRef.update(payload);
    },
  };

  public tripRepository = {
    async update(projectId: string, tripId: string, updates: Partial<TripEntity>, updatedBy: string): Promise<void> {
      if (!projectId || !tripId) {
        throw new Error('INVALID_TRIP_UPDATE: projectId and tripId are required');
      }
      const docRef = adminDb.collection('projects').doc(projectId).collection('trips').doc(tripId);
      const snap = await docRef.get();
      if (!snap.exists) {
        throw new Error(`TRIP_NOT_FOUND: Trip ${tripId} not found in project ${projectId}`);
      }
      const now = new Date().toISOString();
      const payload = {
        ...updates,
        tripId,
        projectId,
        updatedAt: now,
        updatedBy,
      };
      await docRef.update(payload);
    },
  };

  public auditLogService = {
    async recordLog(params: any, context: AuthUserContext): Promise<any> {
      const auditLogId = `AUD-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const now = new Date().toISOString();
      const logEntry = {
        auditLogId,
        projectId: params.projectId,
        entityType: params.entityType,
        entityId: params.entityId,
        action: params.action,
        actor: {
          userId: context.userId,
          email: context.email,
          role: context.role,
          ipAddress: context.ipAddress || 'server',
          userAgent: context.userAgent || 'server-admin',
        },
        changes: {
          before: params.before || null,
          after: params.after,
        },
        correlationId: params.correlationId || `CORR-${Date.now()}`,
        createdAt: now,
        updatedAt: now,
        createdBy: context.userId,
        updatedBy: context.userId,
      };
      await adminDb.collection('projects').doc(params.projectId).collection('audit_logs').doc(auditLogId).set(logEntry);
      return auditLogId;
    },
  };
}

export const serverTripPersistenceAdapter = new ServerTripPersistenceAdapter();
export const serverExceptionPersistenceAdapter = new ServerExceptionPersistenceAdapter();

export const serverTripService = new TripService(serverTripPersistenceAdapter);
export const serverExceptionService = new ExceptionService(serverExceptionPersistenceAdapter);
