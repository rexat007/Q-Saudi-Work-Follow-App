import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { outboxService } from '../services/offline/outbox.service';
import { conflictResolutionService } from '../services/offline/conflictResolution.service';
import { indexedDBService } from '../services/offline/indexedDB.service';
import { runConflictResolutionTestSuite } from './conflictResolution.test';
import { OutboxOperation } from '../types/offline';
import { syncOperationRepository } from '../repositories/syncOperation.repository';

describe('BLOCK 132 — LU-P5-02 Canonical Replay & Outbox Harmonization', () => {
  beforeEach(async () => {
    if (typeof navigator !== 'undefined') {
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true, writable: true });
    }
    await indexedDBService.clear('outbox');
    await indexedDBService.clear('trips');
    await indexedDBService.clear('conflicts');
    (outboxService as any).isSyncing = false;
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('1. Verifies ConflictResolutionService runs fully on canonical local cache without legacy tripEngineService', async () => {
    const suiteResult = await runConflictResolutionTestSuite();
    expect(suiteResult.totalTests).toBeGreaterThan(0);
    expect(suiteResult.failedTests).toBe(0);
    expect(suiteResult.allPassed).toBe(true);
  });

  it('2. Verifies legacy fallback mutation path in OutboxService is strictly prohibited', async () => {
    const op: OutboxOperation = {
      operationId: 'OP-TEST-FORBIDDEN-FALLBACK',
      projectId: 'PRJ-TEST',
      userId: 'USR-TEST',
      deviceId: 'DEV-TEST',
      operationType: 'CREATE_TRIP_LOADING',
      createdAt: new Date().toISOString(),
      retryCount: 0,
      status: 'PENDING',
      payload: {
        tripId: 'TRP-FORBIDDEN',
        tareWeight: 12000,
        grossWeight: 32000,
        pricingRuleId: 'PRC-01',
        truckId: 'TRK-01',
        carrierId: 'CAR-01',
        driverId: 'DRV-01',
        materialId: 'MAT-01',
      },
    };

    // Calling private commitOperation directly should throw
    expect(() => {
      (outboxService as any).commitOperation(op);
    }).toThrow(/مسار الاعتماد المحلي القديم تم إيقافه/);
  });

  it('3. Verifies OutboxService network failure marks operation as FAILED without reporting false success', async () => {
    const op = await outboxService.queueOperation({
      operationId: 'OP-NETWORK-FAIL-TEST',
      projectId: 'PRJ-TEST',
      userId: 'USR-TEST',
      operationType: 'CREATE_TRIP_LOADING',
      payload: {
        tripId: 'TRP-FAIL-01',
        tareWeight: 14000,
        grossWeight: 42000,
        pricingRuleId: 'PRC-01',
        truckId: 'TRK-01',
        carrierId: 'CAR-01',
        driverId: 'DRV-01',
        materialId: 'MAT-01',
      },
    });

    expect(op.status).toBe('PENDING');

    // Syncing when network request fails should fail gracefully and mark FAILED
    const syncResult = await outboxService.syncAll(false);
    expect(syncResult.syncedCount).toBe(0);
    expect(syncResult.failedCount).toBe(1);

    const ops = await outboxService.getOperations();
    const recordedOp = ops.find(o => o.operationId === 'OP-NETWORK-FAIL-TEST');
    expect(recordedOp).toBeDefined();
    expect(recordedOp?.status).toBe('FAILED');
    expect(recordedOp?.retryCount).toBe(1);
  });

  it('4. Verifies OutboxService detects state conflict against canonical local cache', async () => {
    // Seed completed trip into local cache
    await indexedDBService.put('trips', {
      tripId: 'TRP-ALREADY-COMPLETED',
      projectId: 'PRJ-TEST',
      status: 'COMPLETED',
      version: 3,
    });

    const conflict = (outboxService as any).detectStateConflict({
      operationId: 'OP-CONFLICT-TEST',
      projectId: 'PRJ-TEST',
      userId: 'USR-TEST',
      deviceId: 'DEV-TEST',
      operationType: 'CREATE_TRIP_LOADING',
      createdAt: new Date().toISOString(),
      retryCount: 0,
      status: 'PENDING',
      payload: {
        tripId: 'TRP-ALREADY-COMPLETED',
        version: 1,
      },
    });

    expect(conflict).not.toBeNull();
    expect(conflict.conflictField).toBe('status');
    expect(conflict.serverVersion).toBe(3);
  });

  it('5. Positive Canonical Replay Proof: Outbox PENDING -> syncAll() -> HTTP replay -> authoritative server response -> authoritative Trip cached -> Outbox SYNCED', async () => {
    const operationId = 'OP-CANONICAL-REPLAY-SUCCESS';
    const tripId = 'TRP-CANONICAL-REPLAY-123';
    
    // 1. Queue a pending outbox operation
    const op = await outboxService.queueOperation({
      operationId,
      projectId: 'PRJ-NEOM-NORTH',
      userId: 'USR-TEST-DISPATCHER',
      operationType: 'CREATE_TRIP_LOADING',
      payload: {
        tripId,
        tareWeight: 14200,
        grossWeight: 42800,
        pricingRuleId: 'PRC-001',
        truckId: 'TRK-9011',
        carrierId: 'CAR-001',
        driverId: 'DRV-501',
        materialId: 'MAT-AGG-01',
      },
    });

    expect(op.status).toBe('PENDING');

    // 2. Mock fetch to return a successful 201 Created with authoritative Trip response
    const mockAuthoritativeTrip = {
      tripId,
      tripNumber: 1045,
      tripSerial: 'TRP-NEOM-1045',
      projectId: 'PRJ-NEOM-NORTH',
      status: 'IN_TRANSIT',
      version: 1,
      pricingSnapshot: {
        agreedRate: 8.5,
        pricingType: 'PER_TON',
      },
    };

    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        success: true,
        trip: mockAuthoritativeTrip,
        message: 'تم إنشاء وتأكيد الرحلة خادومياً بنجاح',
      }),
    } as any);

    // 3. Trigger syncAll()
    const syncResult = await outboxService.syncAll(false);
    expect(syncResult.syncedCount).toBe(1);
    expect(syncResult.failedCount).toBe(0);

    // 4. Assert HTTP Replay details
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [calledUrl, calledOptions] = fetchSpy.mock.calls[0];
    expect(calledUrl).toContain('/api/projects/PRJ-NEOM-NORTH/trips');
    expect(calledOptions?.method).toBe('POST');
    
    const requestBody = JSON.parse(calledOptions?.body as string);
    expect(requestBody.operationId).toBe(operationId);
    expect(requestBody.tripId).toBe(tripId);

    // 5. Assert authoritative Trip is now cached in IndexedDB
    const cachedTrip = (await indexedDBService.getById('trips', tripId)) as any;
    expect(cachedTrip).toBeDefined();
    expect(cachedTrip.tripNumber).toBe(1045);
    expect(cachedTrip.tripSerial).toBe('TRP-NEOM-1045');

    // 6. Assert Outbox operation status is now SYNCED with proper serverAck
    const ops = await outboxService.getOperations();
    const recordedOp = ops.find(o => o.operationId === operationId);
    expect(recordedOp?.status).toBe('SYNCED');
    expect(recordedOp?.serverAck).toBeDefined();
    expect(recordedOp?.serverAck?.tripId).toBe(tripId);
    expect(recordedOp?.serverAck?.tripSerial).toBe(1045);
  });

  it('6. Durable Idempotency Proof: Existing sync ledger record instantly commits Outbox PENDING -> SYNCED without calling server', async () => {
    const operationId = 'OP-IDEMPOTENCY-TEST-456';
    const tripId = 'TRP-IDEMPOTENCY-456';

    // 1. Queue a pending outbox operation
    await outboxService.queueOperation({
      operationId,
      projectId: 'PRJ-NEOM-NORTH',
      userId: 'USR-TEST-DISPATCHER',
      operationType: 'CREATE_TRIP_LOADING',
      payload: {
        tripId,
        tareWeight: 14200,
        grossWeight: 42800,
        pricingRuleId: 'PRC-001',
        truckId: 'TRK-9011',
        carrierId: 'CAR-001',
        driverId: 'DRV-501',
        materialId: 'MAT-AGG-01',
      },
    });

    // 2. Mock syncOperationRepository.findById to return a matching processed record
    const repoSpy = vi.spyOn(syncOperationRepository, 'findById').mockResolvedValue({
      operationId,
      projectId: 'PRJ-NEOM-NORTH',
      clientOperationUUID: operationId,
      targetCollection: 'trips',
      targetDocId: tripId,
      status: 'PROCESSED',
      createdAt: new Date().toISOString(),
      createdBy: 'USR-TEST-DISPATCHER',
      updatedBy: 'USR-TEST-DISPATCHER',
    } as any);

    const fetchSpy = vi.spyOn(global, 'fetch');

    // 3. Trigger syncAll()
    const syncResult = await outboxService.syncAll(false);
    expect(syncResult.syncedCount).toBe(1);
    expect(syncResult.failedCount).toBe(0);

    // 4. Assert repository was queried but no network call was made
    expect(repoSpy).toHaveBeenCalledWith('PRJ-NEOM-NORTH', operationId);
    expect(fetchSpy).not.toHaveBeenCalled();

    // 5. Assert Outbox operation is SYNCED with Idempotency Hit message
    const ops = await outboxService.getOperations();
    const recordedOp = ops.find(o => o.operationId === operationId);
    expect(recordedOp?.status).toBe('SYNCED');
    expect(recordedOp?.serverAck?.messageAr).toContain('Idempotency Hit');
  });

  it('7. Conflict False-Success Remediation Proof: Mutating Resolution (OVERRIDE_TO_NEW_PRICING) re-queues Outbox as PENDING with sanitized payload and does not write local Trip', async () => {
    const operationId = 'OP-CONFLICT-REMEDY-789';
    const tripId = 'TRP-CONFLICT-789';
    const conflictId = 'CONF-REMEDY-789';

    // 1. Seed a pending outbox operation with dirty fields
    await outboxService.queueOperation({
      operationId,
      projectId: 'PRJ-NEOM-NORTH',
      userId: 'USR-TEST',
      operationType: 'CREATE_TRIP_LOADING',
      payload: {
        tripId,
        tareWeight: 14200,
        grossWeight: 42800,
        pricingRuleId: 'PRC-001',
        pricingSnapshot: { agreedRate: 8.5 }, // Restricted field
        settlementAmount: 243.1, // Restricted field
      },
    });

    // 2. Seed an open conflict record
    const conflictRecord = {
      conflictId,
      operationId,
      projectId: 'PRJ-NEOM-NORTH',
      conflictType: 'PRICING_CHANGED' as const,
      status: 'OPEN' as const,
      titleAr: 'تغير التسعيرة التعاقدية',
      descriptionAr: 'قيمة التسعيرة على السيرفر تختلف عن اللقطة المخزنة محلياً',
      tripId,
      localCommand: {
        operationType: 'CREATE_TRIP_LOADING',
        payload: {
          tripId,
          pricingRuleId: 'PRC-001',
          pricingSnapshot: { agreedRate: 8.5 },
          settlementAmount: 243.1,
        },
        createdAt: new Date().toISOString(),
        userId: 'USR-TEST',
        deviceId: 'DEV-TEST',
      },
      serverState: {
        pricingRule: {
          pricingRuleId: 'PRC-NEW-999',
          name: 'تسعيرة خادومية جديدة',
          agreedRate: 9.5,
          pricingType: 'PER_TON' as const,
        },
        serverVersion: 1,
      },
      diffFields: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await indexedDBService.saveConflictRecord(conflictRecord);
    (conflictResolutionService as any).inMemoryConflicts.set(conflictId, conflictRecord);

    // Mock outboxService.syncAll to prevent immediate background execution on import
    const syncAllSpy = vi.spyOn(outboxService, 'syncAll').mockResolvedValue({
      processedCount: 0,
      syncedCount: 0,
      failedCount: 0,
      conflictCount: 0,
    });

    // 3. Resolve conflict with OVERRIDE_TO_NEW_PRICING strategy
    const resolutionResult = await conflictResolutionService.resolveConflict(conflictId, {
      strategy: 'OVERRIDE_TO_NEW_PRICING',
      resolvedBy: 'MGR-OPS',
      justification: 'الاعتماد الاستثنائي للتسعيرة الخادومية الجديدة',
    });

    // 4. Assert resolution response structure (no direct Trip was returned/created)
    expect(resolutionResult.success).toBe(true);
    expect(resolutionResult.committedTrip).toBeUndefined();

    // 5. Assert local trips cache is STILL empty (remediating the false success local commit)
    const cachedTrip = await indexedDBService.getById('trips', tripId);
    expect(cachedTrip).toBeUndefined();

    // 6. Assert conflict record is marked RESOLVED
    const resolvedConflict = await indexedDBService.getConflictRecordById(conflictId);
    expect(resolvedConflict?.status).toBe('RESOLVED');
    expect(resolvedConflict?.resolution?.strategy).toBe('OVERRIDE_TO_NEW_PRICING');

    // 7. Assert Outbox operation is re-queued as PENDING
    const ops = await outboxService.getOperations();
    const opInQueue = ops.find(o => o.operationId === operationId);
    expect(opInQueue?.status).toBe('PENDING');
    expect(opInQueue?.retryCount).toBe(0);

    // 8. Assert Outbox payload is fully updated and sanitized (all restricted fields stripped)
    expect(opInQueue?.payload.pricingRuleId).toBe('PRC-NEW-999');
    expect(opInQueue?.payload.pricingSnapshot).toBeUndefined();
    expect(opInQueue?.payload.settlementAmount).toBeUndefined();
    expect(opInQueue?.payload.financials).toBeUndefined();
  });

  describe('GAP-P5-04 — Focused Tests (Positive, Failure, and Durable Idempotency)', () => {
    it('1. UPDATE_TRIP_STATUS Positive Replay and Local Cache Convergence', async () => {
      const operationId = 'OP-STATUS-UPDATE-SUCCESS';
      const tripId = 'TRP-UPDATE-123';

      await outboxService.queueOperation({
        operationId,
        projectId: 'PRJ-TEST',
        userId: 'USR-TEST',
        operationType: 'UPDATE_TRIP_STATUS',
        payload: {
          tripId,
          status: 'IN_TRANSIT',
        },
      });

      const mockUpdatedTrip = {
        tripId,
        projectId: 'PRJ-TEST',
        status: 'IN_TRANSIT',
        version: 2,
      };

      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          trip: mockUpdatedTrip,
        }),
      } as any);

      const syncResult = await outboxService.syncAll(false);
      expect(syncResult.syncedCount).toBe(1);
      expect(syncResult.failedCount).toBe(0);

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      const [calledUrl, calledOptions] = fetchSpy.mock.calls[0];
      expect(calledUrl).toContain('/api/projects/PRJ-TEST/trips/TRP-UPDATE-123/status');
      expect(calledOptions?.method).toBe('PATCH');

      const cachedTrip = await indexedDBService.getById<any>('trips', tripId);
      expect(cachedTrip).toBeDefined();
      expect(cachedTrip.status).toBe('IN_TRANSIT');
      expect(cachedTrip.version).toBe(2);

      const ops = await outboxService.getOperations();
      const op = ops.find(o => o.operationId === operationId);
      expect(op?.status).toBe('SYNCED');
      expect(op?.serverAck?.messageAr).toContain('تحديث حالة الرحلة');
    });

    it('2. RECORD_RECEIPT Positive Replay and Local Cache Convergence', async () => {
      const operationId = 'OP-RECEIPT-SUCCESS';
      const tripId = 'TRP-RECEIPT-123';

      await outboxService.queueOperation({
        operationId,
        projectId: 'PRJ-TEST',
        userId: 'USR-TEST',
        operationType: 'RECORD_RECEIPT',
        payload: {
          tripId,
          destinationTareKg: 15000,
          destinationGrossKg: 45000,
          destinationTicketNo: 'TKT-DEST-999',
        },
      });

      const mockUpdatedTrip = {
        tripId,
        projectId: 'PRJ-TEST',
        status: 'WEIGHED_DESTINATION',
        destinationTareKg: 15000,
        destinationGrossKg: 45000,
        destinationTicketNo: 'TKT-DEST-999',
        version: 3,
      };

      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          trip: mockUpdatedTrip,
        }),
      } as any);

      const syncResult = await outboxService.syncAll(false);
      expect(syncResult.syncedCount).toBe(1);
      expect(syncResult.failedCount).toBe(0);

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      const [calledUrl, calledOptions] = fetchSpy.mock.calls[0];
      expect(calledUrl).toContain('/api/projects/PRJ-TEST/trips/TRP-RECEIPT-123/receipt');
      expect(calledOptions?.method).toBe('POST');

      const cachedTrip = await indexedDBService.getById<any>('trips', tripId);
      expect(cachedTrip).toBeDefined();
      expect(cachedTrip.status).toBe('WEIGHED_DESTINATION');
      expect(cachedTrip.destinationGrossKg).toBe(45000);

      const ops = await outboxService.getOperations();
      const op = ops.find(o => o.operationId === operationId);
      expect(op?.status).toBe('SYNCED');
    });

    it('3. REPORT_EXCEPTION Positive Replay and Local Cache Convergence', async () => {
      const operationId = 'OP-EXCEPTION-SUCCESS';
      const tripId = 'TRP-EXCEPTION-123';

      // Seed local trip first
      await indexedDBService.put('trips', {
        tripId,
        projectId: 'PRJ-TEST',
        status: 'IN_TRANSIT',
        hasExceptions: false,
        version: 1,
      });

      await outboxService.queueOperation({
        operationId,
        projectId: 'PRJ-TEST',
        userId: 'USR-TEST',
        operationType: 'REPORT_EXCEPTION',
        payload: {
          tripId,
          exceptionId: 'EXC-123',
          type: 'ROUTE_DEVIATION',
          severity: 'HIGH',
          descriptionAr: 'انحراف عن المسار',
          descriptionEn: 'Route deviation',
        },
      });

      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({
          success: true,
          exception: {
            exceptionId: 'EXC-123',
            tripId,
            projectId: 'PRJ-TEST',
            type: 'ROUTE_DEVIATION',
            severity: 'HIGH',
          },
        }),
      } as any);

      const syncResult = await outboxService.syncAll(false);
      expect(syncResult.syncedCount).toBe(1);
      expect(syncResult.failedCount).toBe(0);

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      const [calledUrl] = fetchSpy.mock.calls[0];
      expect(calledUrl).toContain('/api/projects/PRJ-TEST/trips/TRP-EXCEPTION-123/exceptions');

      const cachedTrip = await indexedDBService.getById<any>('trips', tripId);
      expect(cachedTrip?.hasExceptions).toBe(true);

      const ops = await outboxService.getOperations();
      const op = ops.find(o => o.operationId === operationId);
      expect(op?.status).toBe('SYNCED');
    });

    it('4. Negative Replay: Server returns 500 error, marks Outbox FAILED and increments retryCount', async () => {
      const operationId = 'OP-FAIL-TEST';

      await outboxService.queueOperation({
        operationId,
        projectId: 'PRJ-TEST',
        userId: 'USR-TEST',
        operationType: 'UPDATE_TRIP_STATUS',
        payload: {
          tripId: 'TRP-123',
          status: 'COMPLETED',
        },
      });

      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({
          success: false,
          error: 'فشل عشوائي بالسيرفر',
        }),
      } as any);

      const syncResult = await outboxService.syncAll(false);
      expect(syncResult.syncedCount).toBe(0);
      expect(syncResult.failedCount).toBe(1);

      const ops = await outboxService.getOperations();
      const op = ops.find(o => o.operationId === operationId);
      expect(op?.status).toBe('FAILED');
      expect(op?.retryCount).toBe(1);
      expect(op?.errorReason).toContain('فشل عشوائي بالسيرفر');
    });

    it('5. Durable Idempotency check with local syncOperationRepository instantly commits to SYNCED', async () => {
      const operationId = 'OP-IDEMPOTENCY-TEST-GAP';
      const tripId = 'TRP-GAP-123';

      await outboxService.queueOperation({
        operationId,
        projectId: 'PRJ-TEST',
        userId: 'USR-TEST',
        operationType: 'UPDATE_TRIP_STATUS',
        payload: {
          tripId,
          status: 'COMPLETED',
        },
      });

      const repoSpy = vi.spyOn(syncOperationRepository, 'findById').mockResolvedValue({
        operationId,
        projectId: 'PRJ-TEST',
        clientOperationUUID: operationId,
        targetCollection: 'trips',
        targetDocId: tripId,
        status: 'PROCESSED',
        createdAt: new Date().toISOString(),
        createdBy: 'USR-TEST',
        updatedBy: 'USR-TEST',
      } as any);

      const fetchSpy = vi.spyOn(global, 'fetch');

      const syncResult = await outboxService.syncAll(false);
      expect(syncResult.syncedCount).toBe(1);
      expect(syncResult.failedCount).toBe(0);

      expect(repoSpy).toHaveBeenCalledWith('PRJ-TEST', operationId);
      expect(fetchSpy).not.toHaveBeenCalled();

      const ops = await outboxService.getOperations();
      const op = ops.find(o => o.operationId === operationId);
      expect(op?.status).toBe('SYNCED');
      expect(op?.serverAck?.messageAr).toContain('Idempotency Hit');
    });
  });
});
