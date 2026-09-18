import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { outboxService } from '../services/offline/outbox.service';
import { indexedDBService } from '../services/offline/indexedDB.service';
import { TripValidator } from '../validators/trip.validator';
import { OutboxOperation } from '../types/offline';
import { conflictResolutionService } from '../services/offline/conflictResolution.service';

describe('LU-P6-01 — FSM Alignment Unloading Operator Remediation Tests', () => {
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

  it('Scenario A: Valid arrival is AT_DESTINATION', () => {
    // Under the verified FSM, arriving at destination must transition IN_TRANSIT -> AT_DESTINATION
    const result = TripValidator.validateStatusTransition('IN_TRANSIT', 'AT_DESTINATION');
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('Scenario B: Invalid direct OFFLOADED attempt (AT_DESTINATION -> OFFLOADED must be rejected)', () => {
    // Under the verified FSM, AT_DESTINATION -> OFFLOADED is invalid because WEIGHED_DESTINATION must happen first
    const result = TripValidator.validateStatusTransition('AT_DESTINATION', 'OFFLOADED');
    expect(result.isValid).toBe(false);
    expect(result.errors[0].messageEn).toContain('Invalid FSM transition');
  });

  it('Scenario C: Receipt (RECORD_RECEIPT transitions AT_DESTINATION -> WEIGHED_DESTINATION)', () => {
    const result = TripValidator.validateStatusTransition('AT_DESTINATION', 'WEIGHED_DESTINATION');
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('Scenario D: Offload (WEIGHED_DESTINATION -> OFFLOADED)', () => {
    const result = TripValidator.validateStatusTransition('WEIGHED_DESTINATION', 'OFFLOADED');
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('Scenario E: Complete (OFFLOADED -> COMPLETED)', () => {
    const result = TripValidator.validateStatusTransition('OFFLOADED', 'COMPLETED');
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('Scenario F: Full valid sequence verification (RECORD_RECEIPT -> OFFLOADED -> COMPLETED)', () => {
    // Test the progressive transitions
    let state = 'AT_DESTINATION';
    
    // 1. RECORD_RECEIPT transitions to WEIGHED_DESTINATION
    const step1 = TripValidator.validateStatusTransition(state as any, 'WEIGHED_DESTINATION');
    expect(step1.isValid).toBe(true);
    state = 'WEIGHED_DESTINATION';

    // 2. OFFLOADED transition
    const step2 = TripValidator.validateStatusTransition(state as any, 'OFFLOADED');
    expect(step2.isValid).toBe(true);
    state = 'OFFLOADED';

    // 3. COMPLETED transition
    const step3 = TripValidator.validateStatusTransition(state as any, 'COMPLETED');
    expect(step3.isValid).toBe(true);
    state = 'COMPLETED';

    expect(state).toBe('COMPLETED');
  });

  it('Scenario G: Intermediate failure handling (If OFFLOADED fails, COMPLETED must not be reported as success)', async () => {
    const tripId = 'TRP-FSM-FAIL-TEST';
    const projectId = 'PRJ-TEST-FSM';

    // Mock initial state in DB
    await indexedDBService.put('trips', {
      tripId,
      projectId,
      status: 'AT_DESTINATION',
      netWeight: 15000,
      version: 1,
    });

    // Queue sequential operations mimicking handleCompleteUnloading:
    // 1. RECORD_RECEIPT
    await outboxService.queueOperation({
      operationId: 'OP-REC-1',
      projectId,
      userId: 'USR-TEST',
      operationType: 'RECORD_RECEIPT',
      payload: {
        tripId,
        destinationTareKg: 10000,
        destinationGrossKg: 25000,
        destinationTicketNo: 'WB-REC-1',
      }
    });

    // 2. UPDATE_TRIP_STATUS OFFLOADED
    await outboxService.queueOperation({
      operationId: 'OP-OFF-2',
      projectId,
      userId: 'USR-TEST',
      operationType: 'UPDATE_TRIP_STATUS',
      payload: {
        tripId,
        status: 'OFFLOADED'
      }
    });

    // 3. UPDATE_TRIP_STATUS COMPLETED
    await outboxService.queueOperation({
      operationId: 'OP-CMP-3',
      projectId,
      userId: 'USR-TEST',
      operationType: 'UPDATE_TRIP_STATUS',
      payload: {
        tripId,
        status: 'COMPLETED'
      }
    });

    // Mock global fetch & conflict detector
    vi.spyOn(conflictResolutionService, 'detectConflict').mockReturnValue(null);
    const mockFetch = vi.fn();
    global.fetch = mockFetch;

    // First request (RECORD_RECEIPT) succeeds
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        trip: {
          tripId,
          projectId,
          status: 'WEIGHED_DESTINATION',
          version: 2,
        }
      })
    });

    // Second request (OFFLOADED status update) fails (e.g. server rejects it with a 500 or 400)
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'فشلت معالجة التنزيل على السيرفر' })
    });

    // Perform sync
    const syncRes = await outboxService.syncAll(false);

    // Expect at least one failure or conflict preventing completion
    expect(syncRes.failedCount + syncRes.conflictCount).toBeGreaterThan(0);

    // Read the current local status of the trip in IndexedDB
    const tripInDB = await indexedDBService.getById<any>('trips', tripId);
    
    // The trip should NOT be COMPLETED because the OFFLOADED transition failed
    expect(tripInDB.status).not.toBe('COMPLETED');
    expect(tripInDB.status).toBe('WEIGHED_DESTINATION'); // Stopped at the last successful step!

    // Verify operations statuses in outbox
    const ops = await outboxService.getOperations();
    const op1 = ops.find(o => o.operationId === 'OP-REC-1');
    const op2 = ops.find(o => o.operationId === 'OP-OFF-2');
    const op3 = ops.find(o => o.operationId === 'OP-CMP-3');

    expect(op1?.status).toBe('SYNCED');
    expect(['FAILED', 'CONFLICT']).toContain(op2?.status);
    // COMPLETED should not be synced successfully
    expect(op3?.status).not.toBe('SYNCED');
  });
});
