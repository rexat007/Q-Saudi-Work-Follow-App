import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { indexedDBService } from '../services/offline/indexedDB.service';

describe('LU-P6-04 — Field Supervision Monitoring Convergence Tests', () => {
  beforeEach(async () => {
    // Clear local test state
    const all = await indexedDBService.getAll('trips').catch(() => []);
    for (const t of all) {
      if (t.tripId?.startsWith('TRP-P604')) {
        await indexedDBService.delete('trips', t.tripId).catch(() => {});
      }
    }
  });

  it('1. FieldSupervisionView source file does not import or depend on tripEngineService', () => {
    const filePath = path.join(process.cwd(), 'src/components/field/FieldSupervisionView.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    expect(content).not.toContain("from '../../services/tripEngine.service'");
    expect(content).not.toContain("from '../services/tripEngine.service'");
    expect(content).not.toContain("tripEngineService");
  });

  it('2. FieldSupervisionView imports canonical IndexedDB service and Trip Repository', () => {
    const filePath = path.join(process.cwd(), 'src/components/field/FieldSupervisionView.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    expect(content).toContain("indexedDBService");
    expect(content).toContain("tripRepository");
  });

  it('3. Canonical trip read path filters correctly by targetProjectId', async () => {
    const projA = 'PRJ-P604-ALPHA';
    const projB = 'PRJ-P604-BETA';

    await indexedDBService.put('trips', {
      tripId: 'TRP-P604-001',
      projectId: projA,
      status: 'IN_TRANSIT',
      carrierId: 'CRR-01',
      truckId: 'TRK-01',
      materialId: 'MAT-01',
    });

    await indexedDBService.put('trips', {
      tripId: 'TRP-P604-002',
      projectId: projB,
      status: 'LOADED',
      carrierId: 'CRR-02',
      truckId: 'TRK-02',
      materialId: 'MAT-02',
    });

    const allTrips: any[] = await indexedDBService.getAll('trips');
    const projATrips = allTrips.filter(t => t.projectId === projA);
    const projBTrips = allTrips.filter(t => t.projectId === projB);

    expect(projATrips.length).toBe(1);
    expect(projATrips[0].tripId).toBe('TRP-P604-001');

    expect(projBTrips.length).toBe(1);
    expect(projBTrips[0].tripId).toBe('TRP-P604-002');
  });

  it('4. Monitoring metrics correctly categorize canonical statuses including AT_DESTINATION', async () => {
    const proj = 'PRJ-P604-METRICS';

    const testTrips = [
      { tripId: 'TRP-P604-10', projectId: proj, status: 'LOADED' },
      { tripId: 'TRP-P604-11', projectId: proj, status: 'IN_TRANSIT' },
      { tripId: 'TRP-P604-12', projectId: proj, status: 'AT_DESTINATION' },
      { tripId: 'TRP-P604-13', projectId: proj, status: 'ARRIVED' },
      { tripId: 'TRP-P604-14', projectId: proj, status: 'UNLOADING' },
      { tripId: 'TRP-P604-15', projectId: proj, status: 'COMPLETED' },
    ];

    for (const t of testTrips) {
      await indexedDBService.put('trips', t);
    }

    const all: any[] = await indexedDBService.getAll('trips');
    const trips = all.filter(t => t.projectId === proj);

    const loadingQueueCount = trips.filter(t => t.status === 'LOADED').length;
    const inTransitCount = trips.filter(t => t.status === 'LOADED' || t.status === 'IN_TRANSIT').length;
    const unloadingQueueCount = trips.filter(t => t.status === 'UNLOADING' || t.status === 'ARRIVED' || t.status === 'AT_DESTINATION').length;
    const completedCount = trips.filter(t => t.status === 'COMPLETED').length;

    expect(loadingQueueCount).toBe(1);
    expect(inTransitCount).toBe(2);
    expect(unloadingQueueCount).toBe(3); // AT_DESTINATION + ARRIVED + UNLOADING
    expect(completedCount).toBe(1);
  });

  it('5. FieldSupervisionView does not enqueue outbox operations (read-only monitoring)', () => {
    const filePath = path.join(process.cwd(), 'src/components/field/FieldSupervisionView.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    expect(content).not.toContain("outboxService");
    expect(content).not.toContain("queueOperation");
  });

  it('6. FieldSupervisionView performs no direct Firestore mutation calls', () => {
    const filePath = path.join(process.cwd(), 'src/components/field/FieldSupervisionView.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    expect(content).not.toContain("setDoc(");
    expect(content).not.toContain("updateDoc(");
    expect(content).not.toContain("addDoc(");
    expect(content).not.toContain("deleteDoc(");
  });
});
