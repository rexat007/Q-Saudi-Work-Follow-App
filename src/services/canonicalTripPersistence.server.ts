import { ProjectPricingServerService } from './projectPricing.server';
import { readCurrentAssignment, readCurrentAllocation } from './temporalRelationshipAuthority.server';
import { decodeTrip, decodeProject, decodePricing, decodeScopedProjection, decodePersistence, decodeGlobal, decodeRelationship } from '../utils/persistenceBoundary';
import { sanitizeUndefined } from '../utils/sanitize';
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
  public tripRepository: TripPersistenceContext['tripRepository'];
  public projectRepository: TripPersistenceContext['projectRepository'];
  public globalCarrierRepository: TripPersistenceContext['globalCarrierRepository'];
  public globalTruckRepository: TripPersistenceContext['globalTruckRepository'];
  public globalDriverRepository: TripPersistenceContext['globalDriverRepository'];
  public globalMaterialRepository: TripPersistenceContext['globalMaterialRepository'];
  public projectCarrierMembershipRepository: TripPersistenceContext['projectCarrierMembershipRepository'];
  public projectTruckMembershipRepository: TripPersistenceContext['projectTruckMembershipRepository'];
  public projectDriverMembershipRepository: TripPersistenceContext['projectDriverMembershipRepository'];
  public projectMaterialMembershipRepository: TripPersistenceContext['projectMaterialMembershipRepository'];
  public projectDriverCarrierAffiliationRepository: TripPersistenceContext['projectDriverCarrierAffiliationRepository'];
  public projectTruckCarrierAffiliationRepository: TripPersistenceContext['projectTruckCarrierAffiliationRepository'];
  public projectDriverTruckAssignmentRepository: TripPersistenceContext['projectDriverTruckAssignmentRepository'];
  public projectTruckMaterialAllocationRepository: TripPersistenceContext['projectTruckMaterialAllocationRepository'];
  public pricingRuleRepository: TripPersistenceContext['pricingRuleRepository'];
  public tripNumberGenerator: TripPersistenceContext['tripNumberGenerator'];
  public tripEventService: { recordEvent(payload: any, context: AuthUserContext): Promise<any> };
  public auditLogService: { recordLog(params: any, context: AuthUserContext): Promise<any> };
  constructor(database: any = adminDb) {
    const adminDb = database;
    this.tripRepository = {
    async findById(projectId: string, tripId: string): Promise<TripEntity | null> {
      if (!projectId || !tripId) return null;
      const snap = await adminDb.collection('projects').doc(projectId).collection('trips').doc(tripId).get();
      if (!snap.exists) return null;
      return decodeTrip<TripEntity>(snap.data(), tripId, projectId);
    },

    async listByProject(projectId: string, maxLimit = 100): Promise<TripEntity[]> {
      if (!projectId) return [];
      const snap = await adminDb.collection('projects').doc(projectId).collection('trips').limit(maxLimit).get();
      return snap.docs.map((d: any) => decodeTrip<TripEntity>(d.data(), d.id, projectId));
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
      await adminDb.collection('projects').doc(trip.projectId).collection('trips').doc(trip.tripId).set(sanitizeUndefined(payload));
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
      await docRef.update(sanitizeUndefined(payload));
    },
  };

    this.projectRepository = {
    async findById(projectId: string): Promise<any> {
      if (!projectId) return null;
      const snap = await adminDb.collection('projects').doc(projectId).get();
      if (!snap.exists) return null;
      return decodeProject(snap.data(), projectId);
    },
  };

    this.globalCarrierRepository = {
    async findById(carrierId: string): Promise<any> {
      if (!carrierId) return null;
      const snap = await adminDb.collection('carriers').doc(carrierId).get();
      if (!snap.exists) return null;
      return decodeGlobal(snap.data(), 'carrier', carrierId);
    },
  };

    this.globalTruckRepository = {
    async findById(truckId: string): Promise<any> {
      if (!truckId) return null;
      const snap = await adminDb.collection('trucks').doc(truckId).get();
      if (!snap.exists) return null;
      return decodeGlobal(snap.data(), 'truck', truckId);
    },
  };

    this.globalDriverRepository = {
    async findById(driverId: string): Promise<any> {
      if (!driverId) return null;
      const snap = await adminDb.collection('drivers').doc(driverId).get();
      if (!snap.exists) return null;
      return decodeGlobal(snap.data(), 'driver', driverId);
    },
  };

    this.globalMaterialRepository = {
    async findById(materialId: string): Promise<any> {
      if (!materialId) return null;
      const snap = await adminDb.collection('materials').doc(materialId).get();
      if (!snap.exists) return null;
      return decodeGlobal(snap.data(), 'material', materialId);
    },
  };

    this.projectCarrierMembershipRepository = {
    async getMembership(projectId: string, carrierId: string): Promise<any> {
      if (!projectId || !carrierId) return null;
      const snap = await adminDb.collection('projects').doc(projectId).collection('carrier_memberships').doc(carrierId).get();
      if (!snap.exists) return null;
      return decodeRelationship(snap.data(), 'carrierId', carrierId, projectId, ['ACTIVE', 'SUSPENDED', 'REMOVED']);
    },
  };

    this.projectTruckMembershipRepository = {
    async getMembership(projectId: string, truckId: string): Promise<any> {
      if (!projectId || !truckId) return null;
      const snap = await adminDb.collection('projects').doc(projectId).collection('truck_memberships').doc(truckId).get();
      if (!snap.exists) return null;
      return decodeRelationship(snap.data(), 'truckId', truckId, projectId, ['ACTIVE', 'SUSPENDED', 'REMOVED']);
    },
  };

    this.projectDriverMembershipRepository = {
    async getMembership(projectId: string, driverId: string): Promise<any> {
      if (!projectId || !driverId) return null;
      const snap = await adminDb.collection('projects').doc(projectId).collection('driver_memberships').doc(driverId).get();
      if (!snap.exists) return null;
      return decodeRelationship(snap.data(), 'driverId', driverId, projectId, ['ACTIVE', 'SUSPENDED', 'REMOVED']);
    },
  };

    this.projectMaterialMembershipRepository = {
    async getMembership(projectId: string, materialId: string): Promise<any> {
      if (!projectId || !materialId) return null;
      const snap = await adminDb.collection('projects').doc(projectId).collection('material_memberships').doc(materialId).get();
      if (!snap.exists) return null;
      return decodeRelationship(snap.data(), 'materialId', materialId, projectId, ['ACTIVE', 'SUSPENDED', 'REMOVED']);
    },
  };

    this.projectDriverCarrierAffiliationRepository = {
    async getAffiliation(projectId: string, driverId: string): Promise<any> {
      if (!projectId || !driverId) return null;
      const snap = await adminDb.collection('projects').doc(projectId).collection('driver_carrier_affiliations').doc(driverId).get();
      if (!snap.exists) return null;
      return decodeRelationship(snap.data(), 'driverId', driverId, projectId, ['ACTIVE', 'INACTIVE']);
    },
  };

    this.projectTruckCarrierAffiliationRepository = {
    async getAffiliation(projectId: string, truckId: string): Promise<any> {
      if (!projectId || !truckId) return null;
      const snap = await adminDb.collection('projects').doc(projectId).collection('truck_carrier_affiliations').doc(truckId).get();
      if (!snap.exists) return null;
      return decodeRelationship(snap.data(), 'truckId', truckId, projectId, ['ACTIVE', 'INACTIVE']);
    },
  };

    this.projectDriverTruckAssignmentRepository = {
      async getActiveAssignmentByDriver(projectId: string, driverId: string): Promise<any> {
        if (!projectId || !driverId) return null;
        return readCurrentAssignment({ get: (ref: any) => ref.get() }, adminDb, projectId, 'driverId', driverId, new Date());
      },
      async getActiveAssignmentByTruck(projectId: string, truckId: string): Promise<any> {
        if (!projectId || !truckId) return null;
        return readCurrentAssignment({ get: (ref: any) => ref.get() }, adminDb, projectId, 'truckId', truckId, new Date());
      },
    };
    this.projectTruckMaterialAllocationRepository = {
      async getActiveAllocationByTruck(projectId: string, truckId: string): Promise<any> {
        if (!projectId || !truckId) return null;
        return readCurrentAllocation({ get: (ref: any) => ref.get() }, adminDb, projectId, truckId, new Date());
      },
    };

    this.pricingRuleRepository = {
    resolve: (p:string,c:string,m:string,date:string,id?:string) => new ProjectPricingServerService(adminDb).resolvePricing(p,c,m,date,id),
    async findById(projectId: string, pricingRuleId: string): Promise<any> {
      if (!projectId || !pricingRuleId) return null;
      const snap = await adminDb.collection('projects').doc(projectId).collection('pricing_rules').doc(pricingRuleId).get();
      if (snap.exists) return decodePricing(snap.data(), pricingRuleId, projectId);
      // Read-only legacy inspection compatibility. Active assignment uses resolve(), never this fallback.
      const altSnap = await adminDb.collection('projects').doc(projectId).collection('pricingRules').doc(pricingRuleId).get();
      if (altSnap.exists) return decodeScopedProjection(altSnap.data(), 'pricingRuleId', altSnap.id, projectId);
      return null;
    },
  };

    this.tripNumberGenerator = {
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

    this.tripEventService = {
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
      await adminDb.collection('projects').doc(payload.projectId).collection('trip_events').doc(eventId).set(sanitizeUndefined(eventDoc));
      return eventDoc;
    },
  };

    this.auditLogService = {
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
      await adminDb.collection('projects').doc(params.projectId).collection('audit_logs').doc(auditLogId).set(sanitizeUndefined(logEntry));
      return auditLogId;
    },
  };
  }
}

export class ServerExceptionPersistenceAdapter implements ExceptionPersistenceContext {
  public exceptionRepository: ExceptionPersistenceContext['exceptionRepository'];
  public tripRepository: ExceptionPersistenceContext['tripRepository'];
  public auditLogService: { recordLog(params: any, context: AuthUserContext): Promise<any> };
  constructor(database: any = adminDb) {
    const adminDb = database;
    this.exceptionRepository = {
    async listByTrip(projectId: string, tripId: string): Promise<TripExceptionEntity[]> {
      const safeTrip = tripId || '_general';
      const snap = await adminDb.collection('projects').doc(projectId).collection('trips').doc(safeTrip).collection('exceptions').get();
      return snap.docs.map((d: any) => decodePersistence<TripExceptionEntity>(d.data(), { id: ['exceptionId', d.id], projectId }));
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
      await adminDb.collection('projects').doc(exception.projectId).collection('trips').doc(safeTrip).collection('exceptions').doc(exception.exceptionId).set(sanitizeUndefined(payload));
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
      await docRef.update(sanitizeUndefined(payload));
    },
  };

    this.tripRepository = {
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
      await docRef.update(sanitizeUndefined(payload));
    },
  };

    this.auditLogService = {
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
      await adminDb.collection('projects').doc(params.projectId).collection('audit_logs').doc(auditLogId).set(sanitizeUndefined(logEntry));
      return auditLogId;
    },
  };
  }
}

export const serverTripPersistenceAdapter = new ServerTripPersistenceAdapter();
export const serverExceptionPersistenceAdapter = new ServerExceptionPersistenceAdapter();

export const serverTripService = new TripService(serverTripPersistenceAdapter);
export const serverExceptionService = new ExceptionService(serverExceptionPersistenceAdapter);
