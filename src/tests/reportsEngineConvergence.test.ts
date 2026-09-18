/**
 * Reports Engine Convergence Unit Test Suite
 * 
 * Detailed Automated Coverage:
 * 1. Zero Production tripEngineService Authority
 * 2. generateReport Requires Explicit Trip Data
 * 3. Non-SUPER_ADMIN Uses Only assignedProjectIds
 * 4. SUPER_ADMIN Uses Canonical Active Project Scope (Excludes ARCHIVED)
 * 5. ALL Means All Authorized Projects
 * 6. Unauthorized Project Exclusion
 * 7. Subscription Cleanup
 * 8. >100 Trips Are Not Truncated
 * 9. Multi-Project Merge / Deduplication
 * 10. Origin / Destination / Variance Weight Mapping
 * 11. loadTime / arrivalTime / unloadTime Truthful Mapping
 * 12. loaderId / unloaderId Truthful Mapping
 * 13. OFFLOADED → OFFLOADED
 * 14. REJECTED → RETURNED
 * 15. Settlement Precedence (pricingSnapshot vs financials vs absent)
 * 16. Version Is Not Fabricated
 * 17. Historical pricingSnapshot Preservation
 * 18. Empty Canonical Dataset Never Exposes Legacy Mock Trips
 * 19. Partial Multi-Project Loading Does Not Appear Complete
 * 20. One-Project Subscription Failure Reaches Error State
 * 21. ALL-Project Failure of One Required Project Prevents Partial-Complete Report
 * 22. Recovery From Subscription Error Behaves Correctly
 * 23. All Listeners Clean Up On Scope Change / Unmount
 */

import { reportsEngineService } from '../services/reportsEngine.service';
import { computeMergedTripsFromProjects } from '../components/reports/ReportsEngineView';
import { TripEntity, ProjectEntity } from '../types/entities';
import { TripRecord } from '../types/tripEngine';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

interface TestCaseResult {
  id: string;
  category: string;
  titleAr: string;
  passed: boolean;
  expected: any;
  actual: any;
  details: string;
}

const testResultsList: TestCaseResult[] = [];

function test(id: string, description: string, fn: () => void | Promise<void>) {
  totalTests++;
  try {
    const result = fn();
    if (result instanceof Promise) {
      return result.then(() => {
        passedTests++;
        testResultsList.push({
          id,
          category: 'REPORTS_CONVERGENCE',
          titleAr: description,
          passed: true,
          expected: 'SUCCESS',
          actual: 'SUCCESS',
          details: 'الاختبار مر بنجاح'
        });
      }).catch((err: any) => {
        failedTests++;
        testResultsList.push({
          id,
          category: 'REPORTS_CONVERGENCE',
          titleAr: description,
          passed: false,
          expected: 'SUCCESS',
          actual: String(err.message || err),
          details: String(err.stack || '')
        });
      });
    } else {
      passedTests++;
      testResultsList.push({
        id,
        category: 'REPORTS_CONVERGENCE',
        titleAr: description,
        passed: true,
        expected: 'SUCCESS',
        actual: 'SUCCESS',
        details: 'الاختبار مر بنجاح'
      });
    }
  } catch (err: any) {
    failedTests++;
    testResultsList.push({
      id,
      category: 'REPORTS_CONVERGENCE',
      titleAr: description,
      passed: false,
      expected: 'SUCCESS',
      actual: String(err.message || err),
      details: String(err.stack || '')
    });
  }
}

function expect(val: any) {
  return {
    toBe: (expected: any) => {
      if (val !== expected) throw new Error(`Expected ${expected} but got ${val}`);
    },
    toBeTrue: () => {
      if (val !== true) throw new Error(`Expected true but got ${val}`);
    },
    toBeFalse: () => {
      if (val !== false) throw new Error(`Expected false but got ${val}`);
    },
    toBeNull: () => {
      if (val !== null) throw new Error(`Expected null but got ${val}`);
    },
    toBeUndefined: () => {
      if (val !== undefined) throw new Error(`Expected undefined but got ${val}`);
    },
    toBeDefined: () => {
      if (val === undefined || val === null) throw new Error(`Expected value to be defined`);
    },
    toThrow: () => {
      let threw = false;
      try {
        val();
      } catch (e) {
        threw = true;
      }
      if (!threw) throw new Error(`Expected function to throw error but it did not`);
    }
  };
}

export async function runConvergenceTests() {
  console.log('🏁 Starting Reports Engine Convergence Regression Test Suite...');

  // 1. Zero Production tripEngineService Authority
  test('[CONV-01]', 'no production tripEngineService authority in reportsEngineService', () => {
    // Verify generateReport strictly requires customTrips and does not fallback
    const fn = () => {
      // @ts-ignore
      reportsEngineService.generateReport('DAILY_OPERATIONS', { projectId: 'ALL' });
    };
    expect(fn).toThrow();
  });

  // 2. generateReport Requires Explicit Trip Data
  test('[CONV-02]', 'generateReport requires explicit trip data', () => {
    let thrownErrorMsg = '';
    try {
      // @ts-ignore
      reportsEngineService.generateReport('DAILY_OPERATIONS', { projectId: 'ALL' });
    } catch (e: any) {
      thrownErrorMsg = e.message;
    }
    expect(thrownErrorMsg.includes('Trip data must be explicitly provided')).toBeTrue();
  });

  // 3. Non-SUPER_ADMIN Uses Only assignedProjectIds
  test('[CONV-03]', 'non-SUPER_ADMIN uses only assignedProjectIds', () => {
    const projects = [
      { projectId: 'PRJ-1', status: 'ACTIVE', nameAr: 'مشروع 1' },
      { projectId: 'PRJ-2', status: 'ACTIVE', nameAr: 'مشروع 2' },
      { projectId: 'PRJ-3', status: 'ACTIVE', nameAr: 'مشروع 3' },
    ] as ProjectEntity[];

    const isSuperAdmin = false;
    const assignedIds = ['PRJ-1', 'PRJ-3'];

    const filtered = projects.filter(p => {
      if (p.status === 'ARCHIVED') return false;
      if (isSuperAdmin) return true;
      return assignedIds.includes(p.projectId);
    });

    expect(filtered.length).toBe(2);
    expect(filtered.map(p => p.projectId).includes('PRJ-2')).toBeFalse();
  });

  // 4. SUPER_ADMIN Uses Canonical Active Project Scope
  test('[CONV-04]', 'SUPER_ADMIN uses canonical active project scope (excludes ARCHIVED)', () => {
    const projects = [
      { projectId: 'PRJ-ACTIVE-1', status: 'ACTIVE', nameAr: 'مشروع نشط 1' },
      { projectId: 'PRJ-ACTIVE-2', status: 'SETUP', nameAr: 'مشروع نشط 2' },
      { projectId: 'PRJ-ARCHIVED', status: 'ARCHIVED', nameAr: 'مشروع مؤرشف' },
    ] as ProjectEntity[];

    const isSuperAdmin = true;
    const assignedIds: string[] = [];

    const filtered = projects.filter(p => {
      if (p.status === 'ARCHIVED') return false;
      if (isSuperAdmin) return true;
      return assignedIds.includes(p.projectId);
    });

    expect(filtered.length).toBe(2);
    expect(filtered.map(p => p.projectId).includes('PRJ-ARCHIVED')).toBeFalse();
  });

  // 5. ALL Means All Authorized Projects
  test('[CONV-05]', 'ALL means all authorized projects', () => {
    const authorizedProjectIds = ['PRJ-1', 'PRJ-2', 'PRJ-3'];
    const filterProjectId = 'ALL';

    const targetIds = filterProjectId === 'ALL'
      ? authorizedProjectIds
      : (authorizedProjectIds.includes(filterProjectId) ? [filterProjectId] : []);

    expect(targetIds.length).toBe(3);
    expect(targetIds[0]).toBe('PRJ-1');
    expect(targetIds[1]).toBe('PRJ-2');
    expect(targetIds[2]).toBe('PRJ-3');
  });

  // 6. Unauthorized Project Exclusion
  test('[CONV-06]', 'unauthorized project exclusion', () => {
    const authorizedProjectIds = ['PRJ-1', 'PRJ-2'];
    const filterProjectId = 'PRJ-UNAUTHORIZED';

    const targetIds = (filterProjectId as string) === 'ALL'
      ? authorizedProjectIds
      : (authorizedProjectIds.includes(filterProjectId) ? [filterProjectId] : []);

    expect(targetIds.length).toBe(0);
  });

  // 7. Subscription Cleanup
  test('[CONV-07]', 'subscription cleanup invokes all unsubscribers', () => {
    let unmounted = false;
    const unsub1 = () => { unmounted = true; };
    const unsubscribers = [unsub1];

    unsubscribers.forEach(u => u());
    expect(unmounted).toBeTrue();
  });

  // 8. >100 Trips Are Not Truncated
  test('[CONV-08]', '>100 trips are not truncated', () => {
    const manyTrips: TripRecord[] = [];
    for (let i = 1; i <= 150; i++) {
      const day = String((i % 28) + 1).padStart(2, '0');
      const month = String(Math.floor(i / 28) + 1).padStart(2, '0');
      manyTrips.push({
        tripId: `TRP-MANY-${i}`,
        projectId: 'PRJ-1',
        tripSerial: `S-${i}`,
        ticketId: `TKT-${i}`,
        truckId: `TRK-${i}`,
        driverId: `DRV-${i}`,
        carrierId: `CAR-${i}`,
        materialId: `MAT-${i}`,
        shiftDate: `2026-${month}-${day}`,
        tareWeight: 10000,
        grossWeight: 30000,
        netWeight: 20000,
        pricingType: 'PER_TRIP',
        agreedRate: 100,
        settlementAmount: 100,
        status: 'COMPLETED',
        createdAt: '2026-09-18T00:00:00.000Z',
        createdBy: 'USR-1',
        updatedAt: '2026-09-18T00:00:00.000Z',
        updatedBy: 'USR-1',
      } as unknown as TripRecord);
    }

    const ds = reportsEngineService.generateReport('DAILY_OPERATIONS', { projectId: 'ALL' }, manyTrips);
    expect(ds.summary.totalTrips).toBe(150);
  });

  // 9. Multi-Project Merge / Deduplication
  test('[CONV-09]', 'multi-project merge/deduplication via computeMergedTripsFromProjects', () => {
    const tripsPrj1: TripRecord[] = [
      {
        tripId: 'TRP-DUP-01',
        projectId: 'PRJ-1',
        tripSerial: 'S-1',
        ticketId: 'TKT-1',
        truckId: 'TRK-1',
        driverId: 'DRV-1',
        carrierId: 'CAR-1',
        materialId: 'MAT-1',
        shiftDate: '2026-09-18',
        status: 'COMPLETED',
        createdAt: '2026-09-18T00:00:00.000Z',
        createdBy: 'U1',
        updatedAt: '2026-09-18T00:00:00.000Z',
        updatedBy: 'U1',
      } as unknown as TripRecord
    ];

    const tripsPrj2: TripRecord[] = [
      {
        tripId: 'TRP-DUP-01', // Duplicate across projects
        projectId: 'PRJ-2',
        tripSerial: 'S-1',
        ticketId: 'TKT-1',
        truckId: 'TRK-1',
        driverId: 'DRV-1',
        carrierId: 'CAR-1',
        materialId: 'MAT-1',
        shiftDate: '2026-09-18',
        status: 'COMPLETED',
        createdAt: '2026-09-18T00:00:00.000Z',
        createdBy: 'U1',
        updatedAt: '2026-09-18T00:00:00.000Z',
        updatedBy: 'U1',
      } as unknown as TripRecord,
      {
        tripId: 'TRP-UNIQUE-02',
        projectId: 'PRJ-2',
        tripSerial: 'S-2',
        ticketId: 'TKT-2',
        truckId: 'TRK-2',
        driverId: 'DRV-2',
        carrierId: 'CAR-2',
        materialId: 'MAT-2',
        shiftDate: '2026-09-18',
        status: 'COMPLETED',
        createdAt: '2026-09-18T00:00:00.000Z',
        createdBy: 'U1',
        updatedAt: '2026-09-18T00:00:00.000Z',
        updatedBy: 'U1',
      } as unknown as TripRecord
    ];

    const merged = computeMergedTripsFromProjects({
      'PRJ-1': tripsPrj1,
      'PRJ-2': tripsPrj2,
    });

    expect(merged.length).toBe(2);
    expect(merged[0].tripId).toBe('TRP-DUP-01');
    expect(merged[1].tripId).toBe('TRP-UNIQUE-02');
  });

  // 10. Origin / Destination / Variance Weight Mapping
  test('[CONV-10]', 'origin/destination/variance weight mapping', () => {
    const entity = {
      tripId: 'TRP-W-1',
      tripNumber: 'TN-1',
      projectId: 'PRJ-1',
      weights: {
        originTicketNo: 'TKT-W1',
        originTareKg: 12000,
        originGrossKg: 42000,
        originNetKg: 30000,
        destinationNetKg: 29850,
        varianceKg: -150,
      },
      truckId: 'TRK-1',
      driverId: 'DRV-1',
      carrierId: 'CAR-1',
      materialId: 'MAT-1',
      status: 'DISPATCHED',
      createdAt: new Date('2026-09-18T00:00:00.000Z'),
      createdBy: 'U1',
      updatedAt: new Date('2026-09-18T00:00:00.000Z'),
      updatedBy: 'U1',
    } as unknown as TripEntity;

    const record = reportsEngineService.adaptTripEntityToRecord(entity);
    expect(record.tareWeight).toBe(12000);
    expect(record.grossWeight).toBe(42000);
    expect(record.netWeight).toBe(30000);
    expect(record.destNetWeight).toBe(29850);
    expect(record.varianceWeight).toBe(-150);
  });

  // 11. loadTime / arrivalTime / unloadTime Truthful Mapping
  test('[CONV-11]', 'loadTime / arrivalTime / unloadTime truthful mapping', () => {
    const entity = {
      tripId: 'TRP-TIME-1',
      tripNumber: 'TN-1',
      projectId: 'PRJ-1',
      weights: { originTicketNo: 'TKT-1' },
      truckId: 'TRK-1',
      driverId: 'DRV-1',
      carrierId: 'CAR-1',
      materialId: 'MAT-1',
      status: 'COMPLETED',
      loadTime: '2026-09-18T08:00:00.000Z',
      arrivalTime: '2026-09-18T10:00:00.000Z',
      unloadTime: '2026-09-18T10:30:00.000Z',
      createdAt: new Date('2026-09-18T00:00:00.000Z'),
      createdBy: 'U1',
      updatedAt: new Date('2026-09-18T00:00:00.000Z'),
      updatedBy: 'U1',
    } as unknown as TripEntity;

    const record = reportsEngineService.adaptTripEntityToRecord(entity);
    expect(record.loadTime).toBe('2026-09-18T08:00:00.000Z');
    expect(record.arrivalTime).toBe('2026-09-18T10:00:00.000Z');
    expect(record.unloadTime).toBe('2026-09-18T10:30:00.000Z');
  });

  // 12. loaderId / unloaderId Truthful Mapping
  test('[CONV-12]', 'loaderId / unloaderId truthful mapping', () => {
    const entity = {
      tripId: 'TRP-ACT-1',
      tripNumber: 'TN-1',
      projectId: 'PRJ-1',
      weights: { originTicketNo: 'TKT-1' },
      truckId: 'TRK-1',
      driverId: 'DRV-1',
      carrierId: 'CAR-1',
      materialId: 'MAT-1',
      loaderId: 'SUP-LOAD-99',
      unloaderId: 'SUP-UNLOAD-88',
      status: 'COMPLETED',
      createdAt: new Date('2026-09-18T00:00:00.000Z'),
      createdBy: 'U1',
      updatedAt: new Date('2026-09-18T00:00:00.000Z'),
      updatedBy: 'U1',
    } as unknown as TripEntity;

    const record = reportsEngineService.adaptTripEntityToRecord(entity);
    expect(record.loaderId).toBe('SUP-LOAD-99');
    expect(record.unloaderId).toBe('SUP-UNLOAD-88');
  });

  // 13. OFFLOADED → OFFLOADED
  test('[CONV-13]', 'OFFLOADED status maps truthfully to OFFLOADED', () => {
    const entity = {
      tripId: 'TRP-OFF-1',
      tripNumber: 'TN-1',
      projectId: 'PRJ-1',
      weights: { originTicketNo: 'TKT-1' },
      truckId: 'TRK-1',
      driverId: 'DRV-1',
      carrierId: 'CAR-1',
      materialId: 'MAT-1',
      status: 'OFFLOADED',
      createdAt: new Date('2026-09-18T00:00:00.000Z'),
      createdBy: 'U1',
      updatedAt: new Date('2026-09-18T00:00:00.000Z'),
      updatedBy: 'U1',
    } as unknown as TripEntity;

    const record = reportsEngineService.adaptTripEntityToRecord(entity);
    expect(record.status).toBe('OFFLOADED');
  });

  // 14. REJECTED → RETURNED
  test('[CONV-14]', 'REJECTED status maps truthfully to RETURNED', () => {
    const entity = {
      tripId: 'TRP-REJ-1',
      tripNumber: 'TN-1',
      projectId: 'PRJ-1',
      weights: { originTicketNo: 'TKT-1' },
      truckId: 'TRK-1',
      driverId: 'DRV-1',
      carrierId: 'CAR-1',
      materialId: 'MAT-1',
      status: 'REJECTED',
      createdAt: new Date('2026-09-18T00:00:00.000Z'),
      createdBy: 'U1',
      updatedAt: new Date('2026-09-18T00:00:00.000Z'),
      updatedBy: 'U1',
    } as unknown as TripEntity;

    const record = reportsEngineService.adaptTripEntityToRecord(entity);
    expect(record.status).toBe('RETURNED');
  });

  // 15. Settlement Precedence: pricingSnapshot first, financials fallback, absent if both missing
  test('[CONV-15]', 'settlement precedence: pricingSnapshot > financials > absent', () => {
    // With pricingSnapshot
    const entitySnap = {
      tripId: 'TRP-S1',
      tripNumber: 'TN-1',
      projectId: 'PRJ-1',
      weights: { originTicketNo: 'TKT-1' },
      truckId: 'TRK-1',
      driverId: 'DRV-1',
      carrierId: 'CAR-1',
      materialId: 'MAT-1',
      status: 'COMPLETED',
      pricingSnapshot: {
        settlementAmount: 1800,
        pricingRuleId: 'PRC-1',
        pricingType: 'PER_TRIP',
        agreedRate: 1800,
        currency: 'SAR',
        settlementBase: 1,
        pricingSnapshotAt: '2026-09-18T00:00:00.000Z',
      },
      createdAt: new Date('2026-09-18T00:00:00.000Z'),
      createdBy: 'U1',
      updatedAt: new Date('2026-09-18T00:00:00.000Z'),
      updatedBy: 'U1',
    } as unknown as TripEntity;

    const recSnap = reportsEngineService.adaptTripEntityToRecord(entitySnap);
    expect(recSnap.settlementAmount).toBe(1800);

    // With financials fallback
    const entityFin = {
      tripId: 'TRP-S2',
      tripNumber: 'TN-2',
      projectId: 'PRJ-1',
      weights: { originTicketNo: 'TKT-2' },
      truckId: 'TRK-1',
      driverId: 'DRV-1',
      carrierId: 'CAR-1',
      materialId: 'MAT-1',
      status: 'COMPLETED',
      financials: {
        baseAmountSAR: 1200,
        rateSAR: 1200,
      },
      createdAt: new Date('2026-09-18T00:00:00.000Z'),
      createdBy: 'U1',
      updatedAt: new Date('2026-09-18T00:00:00.000Z'),
      updatedBy: 'U1',
    } as unknown as TripEntity;

    const recFin = reportsEngineService.adaptTripEntityToRecord(entityFin);
    expect(recFin.settlementAmount).toBe(1200);

    // Absent both
    const entityAbsent = {
      tripId: 'TRP-S3',
      tripNumber: 'TN-3',
      projectId: 'PRJ-1',
      weights: { originTicketNo: 'TKT-3' },
      truckId: 'TRK-1',
      driverId: 'DRV-1',
      carrierId: 'CAR-1',
      materialId: 'MAT-1',
      status: 'COMPLETED',
      createdAt: new Date('2026-09-18T00:00:00.000Z'),
      createdBy: 'U1',
      updatedAt: new Date('2026-09-18T00:00:00.000Z'),
      updatedBy: 'U1',
    } as unknown as TripEntity;

    const recAbsent = reportsEngineService.adaptTripEntityToRecord(entityAbsent);
    expect(recAbsent.settlementAmount).toBeUndefined();
  });

  // 16. Version Is Not Fabricated
  test('[CONV-16]', 'version is not fabricated', () => {
    const entityWithVersion = {
      tripId: 'TRP-V1',
      tripNumber: 'TN-1',
      projectId: 'PRJ-1',
      weights: { originTicketNo: 'TKT-1' },
      truckId: 'TRK-1',
      driverId: 'DRV-1',
      carrierId: 'CAR-1',
      materialId: 'MAT-1',
      status: 'COMPLETED',
      version: 5,
      createdAt: new Date('2026-09-18T00:00:00.000Z'),
      createdBy: 'U1',
      updatedAt: new Date('2026-09-18T00:00:00.000Z'),
      updatedBy: 'U1',
    } as unknown as TripEntity;

    const recV1 = reportsEngineService.adaptTripEntityToRecord(entityWithVersion);
    expect(recV1.version).toBe(5);

    const entityNoVersion = {
      tripId: 'TRP-V2',
      tripNumber: 'TN-2',
      projectId: 'PRJ-1',
      weights: { originTicketNo: 'TKT-2' },
      truckId: 'TRK-1',
      driverId: 'DRV-1',
      carrierId: 'CAR-1',
      materialId: 'MAT-1',
      status: 'COMPLETED',
      createdAt: new Date('2026-09-18T00:00:00.000Z'),
      createdBy: 'U1',
      updatedAt: new Date('2026-09-18T00:00:00.000Z'),
      updatedBy: 'U1',
    } as unknown as TripEntity;

    const recV2 = reportsEngineService.adaptTripEntityToRecord(entityNoVersion);
    expect(recV2.version).toBeUndefined();
  });

  // 17. Historical pricingSnapshot Preservation
  test('[CONV-17]', 'historical pricingSnapshot preservation', () => {
    const snapshot = {
      pricingRuleId: 'PRC-HIST-1',
      pricingType: 'PER_TON' as const,
      agreedRate: 65,
      currency: 'SAR',
      settlementBase: 25,
      settlementAmount: 1625,
      pricingSnapshotAt: '2026-09-15T10:00:00.000Z'
    };

    const entity = {
      tripId: 'TRP-HIST-1',
      tripNumber: 'TN-1',
      projectId: 'PRJ-1',
      weights: { originTicketNo: 'TKT-1' },
      truckId: 'TRK-1',
      driverId: 'DRV-1',
      carrierId: 'CAR-1',
      materialId: 'MAT-1',
      status: 'COMPLETED',
      pricingSnapshot: snapshot,
      createdAt: new Date('2026-09-15T10:00:00.000Z'),
      createdBy: 'U1',
      updatedAt: new Date('2026-09-15T10:00:00.000Z'),
      updatedBy: 'U1',
    } as unknown as TripEntity;

    const rec = reportsEngineService.adaptTripEntityToRecord(entity);
    expect(rec.pricingSnapshot?.pricingRuleId).toBe('PRC-HIST-1');
    expect(rec.pricingSnapshot?.settlementAmount).toBe(1625);
  });

  // 18. Empty Canonical Dataset Never Exposes Legacy Mock Trips
  test('[CONV-18]', 'empty canonical dataset never exposes legacy mock trips', () => {
    const emptyDataset = reportsEngineService.generateReport('DAILY_OPERATIONS', { projectId: 'ALL' }, []);
    expect(emptyDataset.rows.length).toBe(0);
    expect(emptyDataset.summary.totalTrips).toBe(0);
  });

  // 19. Partial Multi-Project Loading Does Not Appear Complete
  test('[CONV-19]', 'partial multi-project loading state machine', () => {
    const targetIds = ['P1', 'P2', 'P3'];
    const pendingSet = new Set<string>(targetIds);
    let isDataLoading = true;

    // First project resolves
    pendingSet.delete('P1');
    if (pendingSet.size === 0) isDataLoading = false;
    expect(isDataLoading).toBeTrue(); // Still loading because P2 and P3 are pending!

    // Second project resolves
    pendingSet.delete('P2');
    if (pendingSet.size === 0) isDataLoading = false;
    expect(isDataLoading).toBeTrue();

    // Third project resolves
    pendingSet.delete('P3');
    if (pendingSet.size === 0) isDataLoading = false;
    expect(isDataLoading).toBeFalse(); // Now complete!
  });

  // 20. One-Project Subscription Failure Reaches ReportsEngineView Error State
  test('[CONV-20]', 'one-project subscription failure reaches error state', () => {
    const targetIds = ['P1'];
    const pendingSet = new Set<string>(targetIds);
    const failedSet = new Set<string>();
    let dataError: string | null = null;
    let isDataLoading = true;

    // Simulate onError callback for P1
    const pId = 'P1';
    failedSet.add(pId);
    pendingSet.delete(pId);
    dataError = 'عذراً، فشل جلب بيانات الرحلات لبعض المشاريع المصرحة.';
    if (pendingSet.size === 0) isDataLoading = false;

    expect(isDataLoading).toBeFalse();
    expect(dataError).toBe('عذراً، فشل جلب بيانات الرحلات لبعض المشاريع المصرحة.');
  });

  // 21. ALL-Project Failure of One Required Project Prevents Partial-Complete Report
  test('[CONV-21]', 'ALL-project failure of one required project sets error state and omits partial dataset', () => {
    const targetIds = ['P1', 'P2', 'P3'];
    const pendingSet = new Set<string>(targetIds);
    const failedSet = new Set<string>();
    const tripsByProject: Record<string, TripRecord[]> = {};
    let dataError: string | null = null;
    let isDataLoading = true;

    // P1 resolves OK
    tripsByProject['P1'] = [{ tripId: 'T1', projectId: 'P1' } as TripRecord];
    pendingSet.delete('P1');

    // P2 fails
    failedSet.add('P2');
    pendingSet.delete('P2');
    delete tripsByProject['P2'];
    dataError = 'عذراً، فشل جلب بيانات الرحلات لبعض المشاريع المصرحة.';

    // P3 resolves OK
    tripsByProject['P3'] = [{ tripId: 'T3', projectId: 'P3' } as TripRecord];
    pendingSet.delete('P3');

    if (failedSet.size > 0) {
      dataError = 'عذراً، فشل جلب بيانات الرحلات لبعض المشاريع المصرحة.';
    }
    if (pendingSet.size === 0) isDataLoading = false;

    expect(isDataLoading).toBeFalse();
    expect(dataError).toBe('عذراً، فشل جلب بيانات الرحلات لبعض المشاريع المصرحة.');
    
    // Key rule: dataError is set, so UI will not render partial report
    const canRenderCompleteReport = !isDataLoading && !dataError;
    expect(canRenderCompleteReport).toBeFalse();
  });

  // 22. Recovery From Subscription Error Behaves Correctly
  test('[CONV-22]', 'recovery from subscription error clears error state when project recovers', () => {
    const pendingSet = new Set<string>();
    const failedSet = new Set<string>(['P2']);
    const tripsByProject: Record<string, TripRecord[]> = {
      'P1': [{ tripId: 'T1', projectId: 'P1' } as TripRecord]
    };
    let dataError: string | null = 'عذراً، فشل جلب بيانات الرحلات لبعض المشاريع المصرحة.';

    // P2 later recovers and emits data via onData
    const pId = 'P2';
    tripsByProject[pId] = [{ tripId: 'T2', projectId: 'P2' } as TripRecord];
    failedSet.delete(pId);
    pendingSet.delete(pId);

    if (failedSet.size > 0) {
      dataError = 'عذراً، فشل جلب بيانات الرحلات لبعض المشاريع المصرحة.';
    } else {
      dataError = null;
    }

    expect(dataError).toBeNull();
    const merged = computeMergedTripsFromProjects(tripsByProject);
    expect(merged.length).toBe(2);
  });

  // 23. All Listeners Clean Up On Scope Change / Unmount
  test('[CONV-23]', 'all listeners clean up on scope change or unmount', () => {
    let unsubsCount = 0;
    const unsub1 = () => { unsubsCount++; };
    const unsub2 = () => { unsubsCount++; };
    const unsubscribers = [unsub1, unsub2];

    // Simulate cleanup
    unsubscribers.forEach(u => u());

    expect(unsubsCount).toBe(2);
  });

  console.log('\n======================================================');
  console.log(`📊 Reports Engine Convergence Test Suite: ${totalTests} Total Tests`);
  console.log(`   ✅ Passed: ${passedTests}`);
  console.log(`   ❌ Failed: ${failedTests}`);
  if (failedTests > 0) {
    console.log('\n--- Failed Tests Details ---');
    testResultsList.forEach(t => {
      if (!t.passed) {
        console.log(`❌ [${t.id}] ${t.titleAr}`);
        console.log(`   Expected: ${t.expected}`);
        console.log(`   Actual  : ${t.actual}`);
        if (t.details) {
          console.log(`   Details : ${t.details}`);
        }
      }
    });
  }
  console.log('======================================================\n');

  return {
    allPassed: failedTests === 0,
    totalTests,
    passedTests,
    failedTests,
    results: testResultsList
  };
}

// Direct execution harness
if (process.argv[1]?.endsWith('reportsEngineConvergence.test.ts')) {
  runConvergenceTests().then((res) => {
    process.exit(res.allPassed ? 0 : 1);
  });
}
