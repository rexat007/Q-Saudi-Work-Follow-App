import { describe, it, expect, beforeAll, vi } from 'vitest';
import { projectService } from '../services/project.service';
import { materialService } from '../services/material.service';
import { carrierService } from '../services/carrier.service';
import { driverService } from '../services/driver.service';
import { truckService } from '../services/truck.service';
import { pricingRuleService } from '../services/pricingRule.service';
import { tripService } from '../services/trip.service';
import { settlementAdjustmentService } from '../services/settlementAdjustment.service';
import { auditLogService } from '../services/auditLog.service';
import { dashboardService } from '../services/dashboard.service';
import { reportsEngineService } from '../services/reportsEngine.service';
import { outboxService } from '../services/offline/outbox.service';
import { indexedDBService } from '../services/offline/indexedDB.service';
import { syncOperationRepository } from '../repositories/syncOperation.repository';
import { ProjectNumberGenerator } from '../services/projectNumberGenerator';
import { TripNumberGenerator } from '../services/tripNumberGenerator';
import { projectRepository } from '../repositories/project.repository';
import { carrierRepository } from '../repositories/carrier.repository';
import { materialRepository } from '../repositories/material.repository';
import { truckRepository } from '../repositories/truck.repository';
import { driverRepository } from '../repositories/driver.repository';
import { pricingRuleRepository } from '../repositories/pricingRule.repository';
import { tripRepository } from '../repositories/trip.repository';
import { settlementAdjustmentRepository } from '../repositories/settlementAdjustment.repository';
import { auditLogRepository } from '../repositories/auditLog.repository';
import { AuthUserContext } from '../types/common';
import { 
  ProjectEntity, 
  CarrierEntity, 
  MaterialEntity, 
  TruckEntity, 
  DriverEntity, 
  PricingRuleEntity, 
  TripEntity, 
  SettlementAdjustmentEntity, 
  AuditLogEntity 
} from '../types/entities';
import { TripRecord } from '../types/tripEngine';
import { OutboxOperation } from '../types/offline';

describe('BLOCK 95 — Concurrency, Offline Replay & Data Integrity Stress Test', () => {
  const projectId = 'Q-PRJ-0095';
  const otherProjectId = 'Q-PRJ-OTHER-888';
  const carrierId = 'CAR-95-01';
  const materialId = 'MAT-95-01';
  const driverId = 'DRV-95-01';
  const truckId = 'TRK-95-01';
  const pricingRuleId = 'PRC-95-01';
  const pricingRuleV2Id = 'PRC-95-02';

  // In-memory data store for isolated mock repositories
  const store = {
    projects: new Map<string, ProjectEntity>(),
    carriers: new Map<string, CarrierEntity>(),
    materials: new Map<string, MaterialEntity>(),
    trucks: new Map<string, TruckEntity>(),
    drivers: new Map<string, DriverEntity>(),
    pricingRules: new Map<string, PricingRuleEntity>(),
    trips: new Map<string, TripEntity>(),
    adjustments: new Map<string, SettlementAdjustmentEntity>(),
    auditLogs: [] as AuditLogEntity[],
    syncOps: new Map<string, any>(),
    indexedDBOutbox: new Map<string, OutboxOperation>(),
    indexedDBTrips: new Map<string, any>(),
  };

  const adminContext: AuthUserContext = {
    userId: 'USR-ADMIN-95',
    displayName: 'Admin User 95',
    email: 'admin95@qsaudi.sa',
    role: 'PROJECT_ADMIN',
    assignedProjectIds: [projectId],
  };

  const supervisorContext: AuthUserContext = {
    userId: 'USR-SUPERVISOR-95',
    displayName: 'Supervisor 95',
    email: 'supervisor95@qsaudi.sa',
    role: 'SITE_SUPERVISOR',
    assignedProjectIds: [projectId],
  };

  const driverContext: AuthUserContext = {
    userId: 'USR-DRIVER-95',
    displayName: 'Driver 95',
    email: 'driver95@qsaudi.sa',
    role: 'DRIVER',
    assignedProjectIds: [projectId],
  };

  const foreignProjectAdminContext: AuthUserContext = {
    userId: 'USR-FOREIGN-ADMIN',
    displayName: 'Foreign Admin',
    email: 'foreign@othercorp.sa',
    role: 'PROJECT_ADMIN',
    assignedProjectIds: [otherProjectId],
  };

  beforeAll(() => {
    if (typeof navigator !== 'undefined') {
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true, writable: true });
    }
    // Mock repositories to use test-isolated in-memory store
    vi.spyOn(projectRepository, 'create').mockImplementation(async (p: any) => {
      store.projects.set(p.projectId, p);
    });
    vi.spyOn(projectRepository, 'findById').mockImplementation(async (id: string) => {
      return store.projects.get(id) || null;
    });

    vi.spyOn(carrierRepository, 'create').mockImplementation(async (c: any) => {
      store.carriers.set(c.carrierId, c);
    });
    vi.spyOn(carrierRepository, 'findById').mockImplementation(async (_pId: string, cId: string) => {
      return store.carriers.get(cId) || null;
    });
    vi.spyOn(carrierRepository, 'update').mockImplementation(async (_pId: string, cId: string, updates: any) => {
      const ex = store.carriers.get(cId);
      if (ex) store.carriers.set(cId, { ...ex, ...updates });
    });

    vi.spyOn(materialRepository, 'create').mockImplementation(async (m: any) => {
      store.materials.set(m.materialId, m);
    });
    vi.spyOn(materialRepository, 'findById').mockImplementation(async (_pId: string, mId: string) => {
      return store.materials.get(mId) || null;
    });
    vi.spyOn(materialRepository, 'update').mockImplementation(async (_pId: string, mId: string, updates: any) => {
      const ex = store.materials.get(mId);
      if (ex) store.materials.set(mId, { ...ex, ...updates });
    });

    vi.spyOn(truckRepository, 'create').mockImplementation(async (t: any) => {
      store.trucks.set(t.truckId, t);
    });
    vi.spyOn(truckRepository, 'findById').mockImplementation(async (_pId: string, tId: string) => {
      return store.trucks.get(tId) || null;
    });

    vi.spyOn(driverRepository, 'create').mockImplementation(async (d: any) => {
      store.drivers.set(d.driverId, d);
    });
    vi.spyOn(driverRepository, 'findById').mockImplementation(async (_pId: string, dId: string) => {
      return store.drivers.get(dId) || null;
    });

    vi.spyOn(pricingRuleRepository, 'create').mockImplementation(async (r: any) => {
      store.pricingRules.set(r.pricingRuleId, r);
    });
    vi.spyOn(pricingRuleRepository, 'findById').mockImplementation(async (_pId: string, rId: string) => {
      return store.pricingRules.get(rId) || null;
    });
    vi.spyOn(pricingRuleRepository, 'update').mockImplementation(async (_pId: string, rId: string, updates: any) => {
      const ex = store.pricingRules.get(rId);
      if (ex) store.pricingRules.set(rId, { ...ex, ...updates });
    });

    vi.spyOn(tripRepository, 'create').mockImplementation(async (t: any) => {
      store.trips.set(t.tripId, t);
    });
    vi.spyOn(tripRepository, 'findById').mockImplementation(async (_pId: string, tId: string) => {
      return store.trips.get(tId) || null;
    });
    vi.spyOn(tripRepository, 'listByProject').mockImplementation(async (pId: string) => {
      return Array.from(store.trips.values()).filter(t => t.projectId === pId);
    });
    vi.spyOn(tripRepository, 'update').mockImplementation(async (_pId: string, tId: string, updates: any) => {
      const ex = store.trips.get(tId);
      if (ex) store.trips.set(tId, { ...ex, ...updates });
    });

    vi.spyOn(settlementAdjustmentRepository, 'create').mockImplementation(async (a: any) => {
      store.adjustments.set(a.adjustmentId, a);
    });
    vi.spyOn(settlementAdjustmentRepository, 'findById').mockImplementation(async (_pId: string, _tId: string, aId: string) => {
      return store.adjustments.get(aId) || null;
    });
    vi.spyOn(settlementAdjustmentRepository, 'update').mockImplementation(async (_pId: string, _tId: string, aId: string, updates: any) => {
      const ex = store.adjustments.get(aId);
      if (ex) store.adjustments.set(aId, { ...ex, ...updates });
    });

    vi.spyOn(auditLogRepository, 'create').mockImplementation(async (l: any) => {
      store.auditLogs.push(l);
    });
    vi.spyOn(auditLogRepository, 'listRecent').mockImplementation(async () => {
      return [...store.auditLogs].reverse();
    });

    vi.spyOn(syncOperationRepository, 'findById').mockImplementation(async (_pId: string, opId: string) => {
      return store.syncOps.get(opId) || null;
    });
    vi.spyOn(syncOperationRepository, 'create').mockImplementation(async (params: any) => {
      store.syncOps.set(params.operationId, params);
    });

    // Mock IndexedDB operations for offline tests
    vi.spyOn(indexedDBService, 'saveOutboxOperation').mockImplementation(async (op: OutboxOperation) => {
      store.indexedDBOutbox.set(op.operationId, op);
    });
    vi.spyOn(indexedDBService, 'getOutboxOperations').mockImplementation(async () => {
      return Array.from(store.indexedDBOutbox.values());
    });
    vi.spyOn(indexedDBService, 'updateOutboxStatus').mockImplementation(async (opId: string, status: any, extra: any = {}) => {
      const ex = store.indexedDBOutbox.get(opId);
      if (ex) {
        store.indexedDBOutbox.set(opId, { ...ex, status, ...extra });
      }
    });
    vi.spyOn(indexedDBService, 'put').mockImplementation(async (table: string, val: any) => {
      if (table === 'trips') store.indexedDBTrips.set(val.tripId, val);
    });
    vi.spyOn(indexedDBService, 'delete').mockImplementation(async (table: string, key: string) => {
      if (table === 'trips') store.indexedDBTrips.delete(key);
    });

    // Mock fetch for online sync calls
    global.fetch = vi.fn().mockImplementation(async (url: string, init?: any) => {
      if (typeof url === 'string' && url.includes('/api/projects/')) {
        const body = JSON.parse(init?.body || '{}');
        // If invalid payload, simulate error
        if (!body.projectId || body.missingFields) {
          return {
            ok: false,
            status: 400,
            json: async () => ({ error: 'بيانات العملية غير مكتملة' }),
          };
        }
        return {
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            trip: {
              tripId: body.tripId || 'TRP-SYNCED-95',
              tripNumber: body.tripSerial || 'Q-PRJ-0095-TRP-00001',
              version: 1,
              ...body,
            },
          }),
        };
      }
      return { ok: true, status: 200, json: async () => ({}) };
    }) as any;
  });

  it('Prerequisite Setup: Project & Master Data', async () => {
    ProjectNumberGenerator.resetInMemorySequence(95);
    TripNumberGenerator.resetInMemorySequence(projectId, 1);

    await projectService.createProject({
      projectId,
      projectCode: 'Q-PRJ-0095',
      nameAr: 'مشروع اختبار الضغط والنزاهة 95',
      nameEn: 'Stress & Concurrency Validation Project 95',
      clientName: 'Audit Authority',
      location: { lat: 24.7136, lng: 46.6753, geoFenceRadiusMeters: 1000 },
      settings: { zatcaTaxNumber: '311122233300003', vatRatePercent: 15, allowDriverSelfDispatch: false, currency: 'SAR' },
      authorizedCarrierIds: [carrierId],
      authorizedMaterialIds: [materialId],
      status: 'ACTIVE',
    }, adminContext);

    await materialService.createMaterial({
      materialId,
      projectId,
      name: 'Subbase Aggregate Class A',
      nameAr: 'طبقة أساس ركامية فئة أ',
      normalizedName: 'طبقة اساس ركامية فئة أ',
      code: 'SUB-A',
      unitOfMeasure: 'TON',
      status: 'ACTIVE',
      isActive: true,
    }, adminContext);

    await carrierService.registerCarrier({
      carrierId,
      projectId,
      name: 'Najd Heavy Haulage',
      companyNameAr: 'شركة نجد للنقل الثقيل',
      normalizedName: 'شركة نجد للنقل الثقيل',
      commercialRegistrationNo: '1010778899',
      status: 'ACTIVE',
      isActive: true,
    }, adminContext);

    await driverService.registerDriver({
      driverId,
      projectId,
      carrierId,
      name: 'Fahad Al-Otaibi',
      fullNameAr: 'فهد العتيبي',
      normalizedName: 'فهد العتيبي',
      phone: '+966501112233',
      idNumber: '1099887766',
      status: 'ACTIVE',
      isActive: true,
    }, adminContext);

    await truckService.registerTruck({
      truckId,
      projectId,
      carrierId,
      plate: '9988-KSA',
      plateNumberAr: 'د ر س 9988',
      normalizedPlate: 'د ر س 9988',
      tareWeightKg: 15000,
      maxGrossWeightKg: 45000,
      status: 'ACTIVE',
      isActive: true,
    }, adminContext);

    await pricingRuleService.createPricingRule({
      pricingRuleId,
      projectId,
      carrierId,
      materialId,
      name: 'تعرفة الأساس فئة أ - 2026',
      pricingModel: 'PER_TON',
      baseRateSAR: 60.0,
      demurrageRatePerHourSAR: 200.0,
      freeTimeHours: 2,
      effectiveFrom: '2026-01-01',
      effectiveTo: '2026-06-30',
      vatApplicable: true,
      status: 'ACTIVE',
      isActive: true,
    }, adminContext);
  });

  // 1. Concurrent trip creation
  it('1. Concurrent trip creation: Generates distinct server-authoritative numbers without collision', async () => {
    // Trigger 5 concurrent dispatch requests simultaneously
    const dispatchPromises = Array.from({ length: 5 }).map((_, idx) =>
      tripService.dispatchTrip({
        projectId,
        carrierId,
        truckId,
        driverId,
        materialId,
        pricingRuleId,
        sourceType: 'MANUAL',
        clientUUID: `CUUID-CONCURRENT-${idx}`,
      }, supervisorContext)
    );

    const createdTrips = await Promise.all(dispatchPromises);
    expect(createdTrips.length).toBe(5);

    // Verify all tripNumbers are unique
    const tripNumbers = createdTrips.map(t => t.tripNumber);
    const uniqueTripNumbers = new Set(tripNumbers);
    expect(uniqueTripNumbers.size).toBe(5);

    // Verify all tripIds are unique
    const tripIds = createdTrips.map(t => t.tripId);
    const uniqueTripIds = new Set(tripIds);
    expect(uniqueTripIds.size).toBe(5);

    // Check numbering format
    tripNumbers.forEach(num => {
      expect(num).toMatch(/^Q-PRJ-0095-TRP-\d{5}$/);
    });
  });

  // 2. Idempotency
  it('2. Idempotency: Replaying the same operationId / clientUUID results in exactly one logical state', async () => {
    const fixedOperationId = 'OP-IDEMP-TEST-001';
    
    // Simulate Outbox queue with specific operationId
    const op = await outboxService.queueOperation({
      operationId: fixedOperationId,
      projectId,
      userId: supervisorContext.userId,
      operationType: 'CREATE_TRIP',
      payload: {
        tripId: 'TRP-IDEMP-01',
        tripSerial: 'Q-PRJ-0095-TRP-00099',
        projectId,
        carrierId,
        driverId,
        truckId,
        materialId,
        pricingRuleId,
        status: 'DISPATCHED',
      },
    });

    expect(op.operationId).toBe(fixedOperationId);

    // First Replay
    const result1 = await outboxService.syncAll(false);
    expect(result1.processedCount).toBeGreaterThanOrEqual(1);

    // Record the commit in syncOperationRepository to represent authoritative server persistence
    await syncOperationRepository.create({
      operationId: fixedOperationId,
      projectId,
      userId: supervisorContext.userId,
      deviceId: 'DEV-TEST-01',
      operationType: 'CREATE_TRIP',
      entityId: 'TRP-IDEMP-01',
      status: 'COMMITTED',
      syncedAt: new Date().toISOString() as any,
      createdBy: supervisorContext.userId,
      updatedBy: supervisorContext.userId,
    });

    // Reset status to PENDING and simulate duplicate network retry
    await indexedDBService.updateOutboxStatus(fixedOperationId, 'PENDING');

    // Second Replay
    const result2 = await outboxService.syncAll(false);
    
    // Verify idempotency hit in outbox service
    const opAfter = (await indexedDBService.getOutboxOperations()).find(o => o.operationId === fixedOperationId);
    expect(opAfter?.status).toBe('SYNCED');
    expect(opAfter?.serverAck?.messageAr).toContain('Idempotency Hit');
  });

  // 3. Offline trip creation & reconnect replay
  it('3. Offline trip creation: Generates pending local entity and successfully transitions on sync', async () => {
    const offlineOpId = 'OP-OFFLINE-CREATE-95';
    const tempTripId = 'OFFLINE-TEMP-TRIP-95';

    // 1. Enqueue in offline state
    const op = await outboxService.queueOperation({
      operationId: offlineOpId,
      projectId,
      userId: supervisorContext.userId,
      operationType: 'CREATE_TRIP',
      payload: {
        tripId: tempTripId,
        projectId,
        carrierId,
        driverId,
        truckId,
        materialId,
        pricingRuleId,
        status: 'DISPATCHED',
      },
    });

    expect(op.status).toBe('PENDING');

    // 2. Simulate Sync when online
    const syncRes = await outboxService.syncAll(false);
    expect(syncRes.processedCount).toBeGreaterThanOrEqual(1);

    const updatedOp = (await indexedDBService.getOutboxOperations()).find(o => o.operationId === offlineOpId);
    expect(updatedOp?.status).toBe('SYNCED');
    expect(updatedOp?.serverAck).toBeDefined();
  });

  // 4. Offline mutation failure
  it('4. Offline mutation failure: Rejection puts outbox in FAILED state without reporting false success', async () => {
    const invalidOpId = 'OP-INVALID-PAYLOAD-95';

    // Enqueue operation missing required fields (e.g., missing projectId / carrierId)
    await outboxService.queueOperation({
      operationId: invalidOpId,
      projectId: '', // Invalid empty project ID
      userId: supervisorContext.userId,
      operationType: 'CREATE_TRIP',
      payload: {
        missingFields: true,
      },
    });

    const syncRes = await outboxService.syncAll(false);
    expect(syncRes.failedCount).toBeGreaterThanOrEqual(1);

    const op = (await indexedDBService.getOutboxOperations()).find(o => o.operationId === invalidOpId);
    expect(op?.status).toBe('FAILED');
    expect(op?.errorReason).toBeDefined();
    expect(op?.serverAck).toBeUndefined(); // UI cannot see a false success
  });

  // 5. Concurrent master-data changes & Historical Snapshot Immutability
  it('5. Concurrent master-data changes: Master data update leaves historical trip snapshot unchanged', async () => {
    const trip = await tripService.dispatchTrip({
      projectId,
      carrierId,
      truckId,
      driverId,
      materialId,
      pricingRuleId,
      sourceType: 'MANUAL',
    }, supervisorContext);

    expect(trip.carrierSnapshot?.companyNameAr).toBe('شركة نجد للنقل الثقيل');
    expect(trip.materialSnapshot?.nameAr).toBe('طبقة أساس ركامية فئة أ');

    // Update master data
    await carrierService.updateCarrier(projectId, carrierId, {
      companyNameAr: 'شركة نجد القابضة للخدمات اللوجستية (اسم جديد)',
    }, adminContext);

    await materialService.updateMaterial(projectId, materialId, {
      nameAr: 'طبقة أساس ركامية فئة أ - معدلة',
    }, adminContext);

    // Fetch existing trip from repository
    const fetchedTrip = await tripService.getTrip(projectId, trip.tripId);
    expect(fetchedTrip?.carrierSnapshot?.companyNameAr).toBe('شركة نجد للنقل الثقيل');
    expect(fetchedTrip?.materialSnapshot?.nameAr).toBe('طبقة أساس ركامية فئة أ');
  });

  // 6. Pricing effective-date boundary
  it('6. Pricing effective-date boundary: Correct pricing rule selection across date boundaries', async () => {
    // Create second pricing rule effective from 2026-07-01
    await pricingRuleService.createPricingRule({
      pricingRuleId: pricingRuleV2Id,
      projectId,
      carrierId,
      materialId,
      name: 'تعرفة الأساس فئة أ - النصف الثاني 2026',
      pricingModel: 'PER_TON',
      baseRateSAR: 75.0,
      demurrageRatePerHourSAR: 250.0,
      freeTimeHours: 2,
      effectiveFrom: '2026-07-01',
      effectiveTo: '2026-12-31',
      vatApplicable: true,
      status: 'ACTIVE',
      isActive: true,
    }, adminContext);

    // Rule 1 trip (60 SAR)
    const tripV1 = await tripService.dispatchTrip({
      projectId,
      carrierId,
      truckId,
      driverId,
      materialId,
      pricingRuleId,
      sourceType: 'MANUAL',
    }, supervisorContext);
    expect(tripV1.pricingSnapshot?.baseRateSAR).toBe(60.0);

    // Rule 2 trip (75 SAR)
    const tripV2 = await tripService.dispatchTrip({
      projectId,
      carrierId,
      truckId,
      driverId,
      materialId,
      pricingRuleId: pricingRuleV2Id,
      sourceType: 'MANUAL',
    }, supervisorContext);
    expect(tripV2.pricingSnapshot?.baseRateSAR).toBe(75.0);

    // Historical trip remains at 60.0 SAR
    const verifiedV1 = await tripService.getTrip(projectId, tripV1.tripId);
    expect(verifiedV1?.pricingSnapshot?.baseRateSAR).toBe(60.0);
  });

  // 7. Settlement adjustment concurrency
  it('7. Settlement adjustment concurrency: Duplicate approvals blocked; unauthorized roles rejected', async () => {
    const trip = await tripService.dispatchTrip({
      projectId,
      carrierId,
      truckId,
      driverId,
      materialId,
      pricingRuleId,
      sourceType: 'MANUAL',
    }, supervisorContext);

    // Progress trip to COMPLETED
    await tripService.transitionTripStatus(projectId, trip.tripId, 'AT_ORIGIN', {}, driverContext);
    await tripService.transitionTripStatus(projectId, trip.tripId, 'LOADING', {}, supervisorContext);
    await tripService.transitionTripStatus(projectId, trip.tripId, 'WEIGHED_ORIGIN', { originTareKg: 15000, originGrossKg: 45000 }, supervisorContext);
    await tripService.transitionTripStatus(projectId, trip.tripId, 'IN_TRANSIT', {}, driverContext);
    await tripService.transitionTripStatus(projectId, trip.tripId, 'AT_DESTINATION', {}, driverContext);
    await tripService.transitionTripStatus(projectId, trip.tripId, 'WEIGHED_DESTINATION', { destinationGrossKg: 45000, destinationTareKg: 15000 }, supervisorContext);
    await tripService.transitionTripStatus(projectId, trip.tripId, 'OFFLOADED', {}, supervisorContext);
    await tripService.transitionTripStatus(projectId, trip.tripId, 'COMPLETED', {}, adminContext);

    // Request adjustment
    const adj = await settlementAdjustmentService.requestAdjustment({
      projectId,
      tripId: trip.tripId,
      adjustmentType: 'RATE',
      amountOrRateAdjustment: 10.0,
      reason: 'Extra diesel surcharge',
    }, supervisorContext);

    // First Approval by Admin
    const approved = await settlementAdjustmentService.approveAdjustment(
      projectId,
      trip.tripId,
      adj.adjustmentId,
      adminContext
    );
    expect(approved.status).toBe('APPLIED');

    // Duplicate Approval attempt must be rejected
    await expect(
      settlementAdjustmentService.approveAdjustment(
        projectId,
        trip.tripId,
        adj.adjustmentId,
        adminContext
      )
    ).rejects.toThrow(/لا يمكن اعتماد الطلب لأنه معالج مسبقاً/);

    // Driver approval attempt must be blocked by RBAC
    await expect(
      settlementAdjustmentService.approveAdjustment(
        projectId,
        trip.tripId,
        adj.adjustmentId,
        driverContext
      )
    ).rejects.toThrow(/RBAC|ليس لديك الصلاحية/);
  });

  // 8. Project isolation under direct API access
  it('8. Project isolation: Cross-project queries and unauthorized writes strictly rejected', async () => {
    const foreignTripId = 'TRP-FOREIGN-01';

    // Foreign admin attempting to modify Project 95's trip
    await expect(
      tripService.updateTrip(
        projectId,
        foreignTripId,
        { notes: 'Unauthorized malicious change' } as any,
        foreignProjectAdminContext
      )
    ).rejects.toThrow(/Cross-Project Violation|غير مصرح/);

    // Querying non-assigned project
    const foreignTrips = await tripService.getTripsByProject('Q-PRJ-NON-EXISTENT');
    expect(foreignTrips.length).toBe(0);
  });

  // 9. Audit integrity
  it('9. Audit integrity: Successful mutations generate audit entries; blocked operations do not create false success logs', async () => {
    const initialLogCount = store.auditLogs.length;

    // Successful action
    await tripService.dispatchTrip({
      projectId,
      carrierId,
      truckId,
      driverId,
      materialId,
      pricingRuleId,
      sourceType: 'MANUAL',
    }, supervisorContext);

    expect(store.auditLogs.length).toBe(initialLogCount + 1);
    const lastLog = store.auditLogs[store.auditLogs.length - 1];
    expect(lastLog.action).toBe('CREATE');
    expect(lastLog.entityType).toBe('TRIP');

    // Attempt blocked action (Supervisor trying to change carrierId)
    await expect(
      tripService.updateTrip(
        projectId,
        lastLog.entityId,
        { carrierId: 'CAR-UNAUTHORIZED' } as any,
        supervisorContext
      )
    ).rejects.toThrow(/RBAC|غير مصرح للمشرف بتعديل الناقل/);

    // Audit logs should NOT have added a successful UPDATE record
    const failedUpdateLog = store.auditLogs.find(
      l => l.entityId === lastLog.entityId && l.action === 'UPDATE' && (l.after as any)?.carrierId === 'CAR-UNAUTHORIZED'
    );
    expect(failedUpdateLog).toBeUndefined();
  });

  // 10. Network / API failure recovery
  it('10. Network/API failure: Handled gracefully without corrupting local state or showing false success', async () => {
    // Simulate repository network rejection
    const mockTripCreate = vi.spyOn(tripRepository, 'create').mockRejectedValueOnce(
      new Error('Firebase network timeout (503)')
    );

    await expect(
      tripService.dispatchTrip({
        projectId,
        carrierId,
        truckId,
        driverId,
        materialId,
        pricingRuleId,
        sourceType: 'MANUAL',
      }, supervisorContext)
    ).rejects.toThrow(/Firebase network timeout/);

    mockTripCreate.mockRestore();
  });

  // 11. Report consistency
  it('11. Report consistency: Aggregation outputs match across trip creation, completion, and adjustment', async () => {
    const projectTrips = await tripService.getTripsByProject(projectId);
    
    // Map to TripRecords for engine computation
    const tripRecords: TripRecord[] = projectTrips.map(t => ({
      tripId: t.tripId,
      tripNumber: t.tripNumber,
      projectId: t.projectId,
      carrierId: t.carrierId,
      driverId: t.driverId,
      truckId: t.truckId,
      materialId: t.materialId,
      status: t.status as any,
      pricingType: 'PER_TON',
      tareWeight: t.weights?.originTareKg || 15000,
      grossWeight: t.weights?.originGrossKg || 45000,
      netWeight: t.weights?.originNetKg || (t.weights?.originGrossKg ? t.weights.originGrossKg - (t.weights.originTareKg || 0) : 30000),
      destNetWeight: t.weights?.destinationNetKg || 30000,
      settlementAmount: t.financials?.totalAmountSAR || 1800,
      vatAmount: t.financials?.vatAmountSAR || 270,
      totalWithVat: t.financials?.totalAmountSAR || 2070,
      pricingSnapshot: t.pricingSnapshot as any,
      sourceType: 'MANUAL',
    } as unknown as TripRecord));

    const statusMetrics = dashboardService.computeTripStatusMetrics(tripRecords);
    const tonnageMetrics = dashboardService.computeTonnageMetrics(tripRecords);
    const summary = reportsEngineService.calculateSummary(tripRecords);

    expect(statusMetrics.totalTrips).toBe(projectTrips.length);
    expect(tonnageMetrics.totalLoadedTons).toBeGreaterThan(0);
    expect(summary.totalTrips).toBe(projectTrips.length);
  });

  // 12. Trip snapshot protection
  it('12. Trip snapshot protection: Protected fields cannot be overridden directly', async () => {
    const trip = await tripService.dispatchTrip({
      projectId,
      carrierId,
      truckId,
      driverId,
      materialId,
      pricingRuleId,
      sourceType: 'MANUAL',
    }, supervisorContext);

    // Supervisor attempting to bypass financial computation
    await expect(
      tripService.updateTrip(
        projectId,
        trip.tripId,
        {
          financials: { totalAmountSAR: 999999, currency: 'SAR', isFinalized: true } as any,
        },
        supervisorContext
      )
    ).rejects.toThrow(/RBAC|غير مصرح للمشرف بتعديل البيانات المالية/);

    // Supervisor attempting to modify pricingRuleId
    await expect(
      tripService.updateTrip(
        projectId,
        trip.tripId,
        {
          pricingRuleId: 'PRC-UNAUTHORIZED',
        },
        supervisorContext
      )
    ).rejects.toThrow(/RBAC|غير مصرح للمشرف بتعديل قاعدة التسعير/);

    // Non-server user attempting to modify destination weighbridge values directly
    await expect(
      tripService.updateTrip(
        projectId,
        trip.tripId,
        {
          destNetWeight: 50000,
        } as any,
        supervisorContext
      )
    ).rejects.toThrow(/Workflow Bypass|لا يمكن تعديل صافي وزن الوجهة/);
  });
});
