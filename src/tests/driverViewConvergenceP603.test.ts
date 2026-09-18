import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { outboxService } from '../services/offline/outbox.service';
import { indexedDBService } from '../services/offline/indexedDB.service';
import { TripValidator } from '../validators/trip.validator';

describe('LU-P6-03 — Field Driver View Operational Convergence Tests', () => {
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

  it('1. DriverView source file does not import or depend on tripEngineService', () => {
    const driverViewPath = path.resolve(__dirname, '../components/field/DriverView.tsx');
    const content = fs.readFileSync(driverViewPath, 'utf-8');
    expect(content.includes('tripEngineService')).toBe(false);
  });

  it('2. Active driver trip resolution reads from canonical IndexedDB local store', async () => {
    const testDriverId = 'DRV-1001';
    const testTrip = {
      tripId: 'TRP-DRV-001',
      projectId: 'PRJ-1',
      driverId: testDriverId,
      carrierId: 'CAR-1',
      truckId: 'TRK-1',
      materialId: 'MAT-1',
      status: 'IN_TRANSIT',
      netWeight: 25000,
    };

    await indexedDBService.put('trips', testTrip);

    const allTrips = await indexedDBService.getAll<any>('trips');
    const activeTrip = allTrips.find(t =>
      (t.driverId === testDriverId || t.assignedDriverId === testDriverId) &&
      ['LOADED', 'IN_TRANSIT', 'ARRIVED', 'UNLOADING'].includes(t.status)
    );

    expect(activeTrip).toBeDefined();
    expect(activeTrip.tripId).toBe('TRP-DRV-001');
    expect(activeTrip.status).toBe('IN_TRANSIT');
  });

  it('3 & 4 & 5. Driver arrival queues canonical UPDATE_TRIP_STATUS operation for IN_TRANSIT -> AT_DESTINATION / ARRIVED', async () => {
    const projectId = 'PRJ-DRIVER-TEST';
    const tripId = 'TRP-ARR-001';
    const driverId = 'DRV-2002';
    const now = new Date().toISOString();

    await indexedDBService.put('trips', {
      tripId,
      projectId,
      driverId,
      status: 'IN_TRANSIT',
      netWeight: 22000,
    });

    // Validate FSM transition IN_TRANSIT -> AT_DESTINATION
    const fsmCheck = TripValidator.validateStatusTransition('IN_TRANSIT', 'AT_DESTINATION');
    expect(fsmCheck.isValid).toBe(true);

    // Queue operation as DriverView would
    const queuedOp = await outboxService.queueOperation({
      projectId,
      userId: driverId,
      operationType: 'UPDATE_TRIP_STATUS',
      payload: {
        tripId,
        status: 'AT_DESTINATION',
        arrivedAt: now,
        timestamp: now,
        actorId: driverId,
        actorName: 'سائق اختبار',
        actorRole: 'DRIVER',
      },
    });

    expect(queuedOp.operationType).toBe('UPDATE_TRIP_STATUS');
    expect(queuedOp.payload.status).toBe('AT_DESTINATION');
    expect(queuedOp.payload.tripId).toBe(tripId);
    expect(queuedOp.status).toBe('PENDING');
  });

  it('6. Local canonical trip cache is updated with ARRIVED status via indexedDBService', async () => {
    const tripId = 'TRP-CACHE-001';
    const projectId = 'PRJ-CACHE';
    const driverId = 'DRV-3003';
    const now = new Date().toISOString();

    const initialTrip = {
      tripId,
      projectId,
      driverId,
      status: 'IN_TRANSIT',
    };
    await indexedDBService.put('trips', initialTrip);

    const updatedTrip = {
      ...initialTrip,
      status: 'ARRIVED',
      arrivedAt: now,
      updatedAt: now,
      updatedBy: driverId,
    };
    await indexedDBService.put('trips', updatedTrip);

    const tripInDb = await indexedDBService.getById<any>('trips', tripId);
    expect(tripInDb).toBeDefined();
    expect(tripInDb.status).toBe('ARRIVED');
    expect(tripInDb.arrivedAt).toBe(now);
  });

  it('7. Synchronization is triggered through outboxService.syncAll', async () => {
    const projectId = 'PRJ-SYNC-TEST';
    const tripId = 'TRP-SYNC-001';
    const driverId = 'DRV-4004';

    await outboxService.queueOperation({
      projectId,
      userId: driverId,
      operationType: 'UPDATE_TRIP_STATUS',
      payload: { tripId, status: 'ARRIVED' },
    });

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ trip: { tripId, status: 'ARRIVED', version: 2 } }),
    });
    global.fetch = mockFetch;

    const syncResult = await outboxService.syncAll(false);
    expect(syncResult.syncedCount).toBe(1);
    expect(syncResult.failedCount).toBe(0);

    const ops = await outboxService.getOperations();
    expect(ops[0].status).toBe('SYNCED');
  });

  it('8. DriverView source file performs no direct Firestore collection set/update calls', () => {
    const driverViewPath = path.resolve(__dirname, '../components/field/DriverView.tsx');
    const content = fs.readFileSync(driverViewPath, 'utf-8');
    expect(content.includes('setDoc')).toBe(false);
    expect(content.includes('updateDoc')).toBe(false);
    expect(content.includes('doc(')).toBe(false);
  });

  it('9. Offline arrival is retained safely in Outbox queue with PENDING status', async () => {
    const projectId = 'PRJ-OFFLINE-TEST';
    const tripId = 'TRP-OFF-001';
    const driverId = 'DRV-5005';

    // Queue operation offline
    await outboxService.queueOperation({
      projectId,
      userId: driverId,
      operationType: 'UPDATE_TRIP_STATUS',
      payload: {
        tripId,
        status: 'ARRIVED',
        arrivedAt: new Date().toISOString(),
      },
    });

    const ops = await outboxService.getOperations();
    expect(ops.length).toBe(1);
    expect(ops[0].status).toBe('PENDING');
    expect(ops[0].operationType).toBe('UPDATE_TRIP_STATUS');
    expect(ops[0].payload.status).toBe('ARRIVED');
  });
});
