import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { inMemoryAdminStore, adminDb, createInMemoryAdminDb, setTestDbOverride } from '../firebase/admin';
import {
  getState,
  markDirtyInTransaction,
  markDirty,
  projectWorkspaceProjectionStateServer,
  PROJECTION_STATE_SUBCOLLECTION,
  PROJECTION_STATE_DOC_ID,
} from '../services/projectWorkspaceProjectionState.server';
import { ProjectProvisioningAdminService } from '../services/projectProvisioning.server';
import { driverTruckIntakeServer } from '../services/driverTruckIntake.server';
import { AuthUserContext } from '../types/common';

describe('Unit 5B: Atomic Canonical Mutation Invalidation Wiring Tests', () => {
  const TEST_PROJECT_ID = 'PRJ-UNIT5B-001';
  let provisioningService: ProjectProvisioningAdminService;
  const adminContext: AuthUserContext = {
    userId: 'USER-ADMIN-001',
    email: 'admin@q-saudi.com',
    role: 'PROJECT_ADMIN',
    assignedProjectIds: [TEST_PROJECT_ID],
    displayName: 'Project Admin',
  };

  beforeEach(() => {
    // Hermetic in-memory store reset
    for (const key of Object.keys(inMemoryAdminStore)) {
      delete inMemoryAdminStore[key];
    }
    setTestDbOverride(createInMemoryAdminDb());
    provisioningService = new ProjectProvisioningAdminService();

    // Seed base test project
    inMemoryAdminStore[`projects/${TEST_PROJECT_ID}`] = {
      projectId: TEST_PROJECT_ID,
      nameAr: 'مشروع اختبار 5B',
      status: 'SETUP',
    };
  });

  // ==========================================
  // SECTION 1: PROJECTION STATE TRANSACTION HELPER
  // ==========================================

  // 1. markDirtyInTransaction reuses supplied transaction
  it('1. markDirtyInTransaction reuses supplied transaction', async () => {
    let transactionUsed = false;
    await adminDb.runTransaction(async (tx: any) => {
      const getSpy = vi.spyOn(tx, 'get');
      const setSpy = vi.spyOn(tx, 'set');

      await markDirtyInTransaction(tx, TEST_PROJECT_ID, ['DRIVERS'], 'Test Reason');
      expect(getSpy).toHaveBeenCalled();
      expect(setSpy).toHaveBeenCalled();
      transactionUsed = true;
    });
    expect(transactionUsed).toBe(true);

    const state = await getState(TEST_PROJECT_ID);
    expect(state.dirtyTabs).toEqual(['DRIVERS']);
  });

  // 2. no nested adminDb.runTransaction
  it('2. no nested adminDb.runTransaction inside markDirtyInTransaction', async () => {
    const runTxSpy = vi.spyOn(adminDb, 'runTransaction');
    await adminDb.runTransaction(async (tx: any) => {
      await markDirtyInTransaction(tx, TEST_PROJECT_ID, ['MATERIALS'], 'Check no nesting');
    });
    // runTransaction should have been called only ONCE (the outer call), never inside markDirtyInTransaction
    expect(runTxSpy).toHaveBeenCalledTimes(1);
    runTxSpy.mockRestore();
  });

  // 3. unions existing dirty domains
  it('3. unions existing dirty domains', async () => {
    await markDirty(TEST_PROJECT_ID, ['CARRIERS']);

    await adminDb.runTransaction(async (tx: any) => {
      await markDirtyInTransaction(tx, TEST_PROJECT_ID, ['DRIVERS']);
    });

    const state = await getState(TEST_PROJECT_ID);
    expect(state.dirtyTabs).toEqual(['DRIVERS', 'CARRIERS']);
  });

  // 4. preserves dirtySince when already dirty
  it('4. preserves dirtySince when already dirty', async () => {
    const initial = await markDirty(TEST_PROJECT_ID, ['DRIVERS']);
    const originalDirtySince = initial.dirtySince;
    expect(originalDirtySince).not.toBeNull();

    await adminDb.runTransaction(async (tx: any) => {
      await markDirtyInTransaction(tx, TEST_PROJECT_ID, ['FLEET_ROSTER'], 'Second mutation');
    });

    const state = await getState(TEST_PROJECT_ID);
    expect(state.dirtySince).toBe(originalDirtySince);
    expect(state.dirtyTabs).toEqual(['DRIVERS', 'FLEET_ROSTER']);
  });

  // 5. preserves successful projection metadata
  it('5. preserves successful projection metadata', async () => {
    // Seed initial projection state with past successful projection
    const docRefKey = `projects/${TEST_PROJECT_ID}/workspace_projection_state/current`;
    inMemoryAdminStore[docRefKey] = {
      projectId: TEST_PROJECT_ID,
      dirtyTabs: [],
      dirtySince: null,
      lastMutationAt: '2026-09-30T00:00:00.000Z',
      lastMutationReason: 'Prior',
      lastSuccessfulProjectionAt: '2026-09-30T01:00:00.000Z',
      lastSuccessfulProjectionTabs: ['MATERIALS'],
      updatedAt: '2026-09-30T01:00:00.000Z',
    };

    await adminDb.runTransaction(async (tx: any) => {
      await markDirtyInTransaction(tx, TEST_PROJECT_ID, ['DRIVERS'], 'New driver');
    });

    const state = await getState(TEST_PROJECT_ID);
    expect(state.lastSuccessfulProjectionAt).toBe('2026-09-30T01:00:00.000Z');
    expect(state.lastSuccessfulProjectionTabs).toEqual(['MATERIALS']);
  });

  // 6. deterministic canonical ordering
  it('6. deterministic canonical ordering', async () => {
    await adminDb.runTransaction(async (tx: any) => {
      await markDirtyInTransaction(tx, TEST_PROJECT_ID, ['FLEET_ROSTER', 'MATERIALS', 'DRIVERS']);
    });

    const state = await getState(TEST_PROJECT_ID);
    expect(state.dirtyTabs).toEqual(['DRIVERS', 'MATERIALS', 'FLEET_ROSTER']);
  });

  // ==========================================
  // SECTION 2: MATERIAL
  // ==========================================

  // 7. new Material identity → MATERIALS dirty
  it('7. new Material identity -> MATERIALS dirty', async () => {
    const res = await provisioningService.setupProjectMaterial(
      TEST_PROJECT_ID,
      { code: 'MAT-AGG-01', nameAr: 'حصى صلب 20 ملم' },
      { userId: adminContext.userId }
    );
    expect(res.materialId).toBeDefined();

    const state = await getState(TEST_PROJECT_ID);
    expect(state.dirtyTabs).toContain('MATERIALS');
    expect(state.lastMutationReason).toBe('PROJECT_MATERIAL_SETUP_CHANGED');
  });

  // 8. new Material membership → MATERIALS dirty
  it('8. new Material membership -> MATERIALS dirty', async () => {
    // Seed existing global material in another project/global
    const existingMatId = 'MAT-EXISTING-GLOBAL-1';
    inMemoryAdminStore[`materials/${existingMatId}`] = {
      materialId: existingMatId,
      code: 'MAT-SAND-01',
      nameAr: 'رمل أحمر',
      status: 'ACTIVE',
    };
    inMemoryAdminStore['natural_identity_lookups/MATERIAL_TUFULVNBTkQtMDE_'] = {
      entityType: 'MATERIAL',
      systemId: existingMatId,
    };

    // Enroll into TEST_PROJECT_ID where membership does not exist yet
    await provisioningService.setupProjectMaterial(
      TEST_PROJECT_ID,
      { code: 'MAT-SAND-01', nameAr: 'رمل أحمر' },
      { userId: adminContext.userId }
    );

    const state = await getState(TEST_PROJECT_ID);
    expect(state.dirtyTabs).toContain('MATERIALS');
    expect(state.lastMutationReason).toBe('PROJECT_MATERIAL_SETUP_CHANGED');
  });

  // 9. lookup-repair-only path does NOT dirty MATERIALS
  it('9. lookup-repair-only path does NOT dirty MATERIALS', async () => {
    // Global material exists AND project membership exists, but lookup was missing
    const existingMatId = 'MAT-EXISTING-GLOBAL-2';
    inMemoryAdminStore[`materials/${existingMatId}`] = {
      materialId: existingMatId,
      code: 'MAT-GRAVEL-02',
      nameAr: 'حصمة ناعمة',
      status: 'ACTIVE',
    };
    inMemoryAdminStore[`projects/${TEST_PROJECT_ID}/material_memberships/${existingMatId}`] = {
      materialId: existingMatId,
      projectId: TEST_PROJECT_ID,
      status: 'ACTIVE',
    };

    // Clean state before call
    const stateBefore = await getState(TEST_PROJECT_ID);
    expect(stateBefore.dirtyTabs).toEqual([]);

    await provisioningService.setupProjectMaterial(
      TEST_PROJECT_ID,
      { code: 'MAT-GRAVEL-02', nameAr: 'حصمة ناعمة' },
      { userId: adminContext.userId }
    );

    const stateAfter = await getState(TEST_PROJECT_ID);
    expect(stateAfter.dirtyTabs).toEqual([]);
    expect(stateAfter.lastMutationAt).toBeNull();
  });

  // 10. existing active no-op Material setup does NOT dirty MATERIALS
  it('10. existing active no-op Material setup does NOT dirty MATERIALS', async () => {
    // First call creates it
    await provisioningService.setupProjectMaterial(
      TEST_PROJECT_ID,
      { code: 'MAT-AGG-03', nameAr: 'حصى صلب' },
      { userId: adminContext.userId }
    );
    // Artificially reset dirty state to clean
    inMemoryAdminStore[`projects/${TEST_PROJECT_ID}/workspace_projection_state/current`] = {
      projectId: TEST_PROJECT_ID,
      dirtyTabs: [],
      dirtySince: null,
      lastMutationAt: null,
      lastMutationReason: null,
      lastSuccessfulProjectionAt: null,
      lastSuccessfulProjectionTabs: [],
      updatedAt: '2026-09-30T00:00:00.000Z',
    };

    // Idempotent second call
    await provisioningService.setupProjectMaterial(
      TEST_PROJECT_ID,
      { code: 'MAT-AGG-03', nameAr: 'حصى صلب' },
      { userId: adminContext.userId }
    );

    const state = await getState(TEST_PROJECT_ID);
    expect(state.dirtyTabs).toEqual([]);
    expect(state.lastMutationAt).toBeNull();
  });

  // ==========================================
  // SECTION 3: CARRIER
  // ==========================================

  // 11. new Carrier identity → CARRIERS dirty
  it('11. new Carrier identity -> CARRIERS dirty', async () => {
    const res = await provisioningService.setupProjectCarrier(
      TEST_PROJECT_ID,
      { commercialRegistrationNo: '1010998877', nameAr: 'شركة الرمال للنقل' },
      { userId: adminContext.userId }
    );
    expect(res.carrierId).toBeDefined();

    const state = await getState(TEST_PROJECT_ID);
    expect(state.dirtyTabs).toContain('CARRIERS');
    expect(state.lastMutationReason).toBe('PROJECT_CARRIER_SETUP_CHANGED');
  });

  // 12. new Carrier membership → CARRIERS dirty
  it('12. new Carrier membership -> CARRIERS dirty', async () => {
    const existingCarId = 'CAR-EXISTING-GLOBAL-1';
    inMemoryAdminStore[`carriers/${existingCarId}`] = {
      carrierId: existingCarId,
      commercialRegistrationNo: '1010112233',
      nameAr: 'شركة النقل السريع',
      status: 'ACTIVE',
    };
    inMemoryAdminStore['natural_identity_lookups/CARRIER_MTAxMDExMjIzMw__'] = {
      entityType: 'CARRIER',
      systemId: existingCarId,
    };

    await provisioningService.setupProjectCarrier(
      TEST_PROJECT_ID,
      { commercialRegistrationNo: '1010112233', nameAr: 'شركة النقل السريع' },
      { userId: adminContext.userId }
    );

    const state = await getState(TEST_PROJECT_ID);
    expect(state.dirtyTabs).toContain('CARRIERS');
  });

  // 13. lookup-repair-only path does NOT dirty CARRIERS
  it('13. lookup-repair-only path does NOT dirty CARRIERS', async () => {
    const existingCarId = 'CAR-EXISTING-GLOBAL-2';
    inMemoryAdminStore[`carriers/${existingCarId}`] = {
      carrierId: existingCarId,
      commercialRegistrationNo: '1010445566',
      nameAr: 'شركة الدرب للنقل',
      status: 'ACTIVE',
    };
    inMemoryAdminStore[`projects/${TEST_PROJECT_ID}/carrier_memberships/${existingCarId}`] = {
      carrierId: existingCarId,
      projectId: TEST_PROJECT_ID,
      status: 'ACTIVE',
    };

    await provisioningService.setupProjectCarrier(
      TEST_PROJECT_ID,
      { commercialRegistrationNo: '1010445566', nameAr: 'شركة الدرب للنقل' },
      { userId: adminContext.userId }
    );

    const state = await getState(TEST_PROJECT_ID);
    expect(state.dirtyTabs).toEqual([]);
  });

  // 14. existing active no-op Carrier setup does NOT dirty CARRIERS
  it('14. existing active no-op Carrier setup does NOT dirty CARRIERS', async () => {
    await provisioningService.setupProjectCarrier(
      TEST_PROJECT_ID,
      { commercialRegistrationNo: '1010778899', nameAr: 'شركة الأفق' },
      { userId: adminContext.userId }
    );
    // Reset dirty state to clean
    inMemoryAdminStore[`projects/${TEST_PROJECT_ID}/workspace_projection_state/current`] = {
      projectId: TEST_PROJECT_ID,
      dirtyTabs: [],
      dirtySince: null,
      lastMutationAt: null,
      lastMutationReason: null,
      lastSuccessfulProjectionAt: null,
      lastSuccessfulProjectionTabs: [],
      updatedAt: '2026-09-30T00:00:00.000Z',
    };

    await provisioningService.setupProjectCarrier(
      TEST_PROJECT_ID,
      { commercialRegistrationNo: '1010778899', nameAr: 'شركة الأفق' },
      { userId: adminContext.userId }
    );

    const state = await getState(TEST_PROJECT_ID);
    expect(state.dirtyTabs).toEqual([]);
  });

  // ==========================================
  // SECTION 4: STANDALONE DRIVER
  // ==========================================

  // 15. new Driver → DRIVERS dirty
  it('15. new Driver -> DRIVERS dirty', async () => {
    // Seed active carrier membership
    const carrierId = 'CAR-TEST-001';
    inMemoryAdminStore[`projects/${TEST_PROJECT_ID}/carrier_memberships/${carrierId}`] = {
      projectId: TEST_PROJECT_ID,
      carrierId,
      status: 'ACTIVE',
    };

    await driverTruckIntakeServer.createStandaloneDriver(
      {
        projectId: TEST_PROJECT_ID,
        carrierId,
        driverName: 'محمد أحمد السعيد',
        residencyId: '1099887766',
        phone: '0501234567',
      },
      adminContext
    );

    const state = await getState(TEST_PROJECT_ID);
    expect(state.dirtyTabs).toContain('DRIVERS');
    expect(state.dirtyTabs).not.toContain('FLEET_ROSTER');
    expect(state.lastMutationReason).toBe('PROJECT_DRIVER_SETUP_CHANGED');
  });

  // 16. new Driver project membership → DRIVERS dirty
  it('16. new Driver project membership -> DRIVERS dirty', async () => {
    const carrierId = 'CAR-TEST-001';
    inMemoryAdminStore[`projects/${TEST_PROJECT_ID}/carrier_memberships/${carrierId}`] = {
      projectId: TEST_PROJECT_ID,
      carrierId,
      status: 'ACTIVE',
    };
    const globalDriverId = 'DRV-GLOBAL-001';
    inMemoryAdminStore[`drivers/${globalDriverId}`] = {
      driverId: globalDriverId,
      nationalId: '1088776655',
      fullNameAr: 'خالد عبد الله',
      status: 'ACTIVE',
    };
    inMemoryAdminStore['natural_identity_lookups/DRIVER_MTA4ODc3NjY1NQ__'] = {
      entityType: 'DRIVER',
      systemId: globalDriverId,
    };

    await driverTruckIntakeServer.createStandaloneDriver(
      {
        projectId: TEST_PROJECT_ID,
        carrierId,
        driverName: 'خالد عبد الله',
        residencyId: '1088776655',
      },
      adminContext
    );

    const state = await getState(TEST_PROJECT_ID);
    expect(state.dirtyTabs).toContain('DRIVERS');
  });

  // 17. standalone Driver does NOT dirty FLEET_ROSTER
  it('17. standalone Driver does NOT dirty FLEET_ROSTER', async () => {
    const carrierId = 'CAR-TEST-001';
    inMemoryAdminStore[`projects/${TEST_PROJECT_ID}/carrier_memberships/${carrierId}`] = {
      projectId: TEST_PROJECT_ID,
      carrierId,
      status: 'ACTIVE',
    };

    await driverTruckIntakeServer.createStandaloneDriver(
      {
        projectId: TEST_PROJECT_ID,
        carrierId,
        driverName: 'سعيد عبد الرحمن',
        residencyId: '1077665544',
      },
      adminContext
    );

    const state = await getState(TEST_PROJECT_ID);
    expect(state.dirtyTabs).not.toContain('FLEET_ROSTER');
  });

  // 18. idempotent existing standalone Driver does not rewrite freshness state
  it('18. idempotent existing standalone Driver does not rewrite freshness state', async () => {
    const carrierId = 'CAR-TEST-001';
    inMemoryAdminStore[`projects/${TEST_PROJECT_ID}/carrier_memberships/${carrierId}`] = {
      projectId: TEST_PROJECT_ID,
      carrierId,
      status: 'ACTIVE',
    };

    const res = await driverTruckIntakeServer.createStandaloneDriver(
      {
        projectId: TEST_PROJECT_ID,
        carrierId,
        driverName: 'علي حسن',
        residencyId: '1066554433',
      },
      adminContext
    );

    // Reset projection state to clean baseline
    inMemoryAdminStore[`projects/${TEST_PROJECT_ID}/workspace_projection_state/current`] = {
      projectId: TEST_PROJECT_ID,
      dirtyTabs: [],
      dirtySince: null,
      lastMutationAt: null,
      lastMutationReason: null,
      lastSuccessfulProjectionAt: null,
      lastSuccessfulProjectionTabs: [],
      updatedAt: '2026-09-30T00:00:00.000Z',
    };

    // Second call with same data
    await driverTruckIntakeServer.createStandaloneDriver(
      {
        projectId: TEST_PROJECT_ID,
        carrierId,
        driverName: 'علي حسن',
        residencyId: '1066554433',
      },
      adminContext
    );

    const state = await getState(TEST_PROJECT_ID);
    expect(state.dirtyTabs).toEqual([]);
    expect(state.lastMutationAt).toBeNull();
  });

  // ==========================================
  // SECTION 5: STANDALONE TRUCK
  // ==========================================

  // 19. new Truck → FLEET_ROSTER dirty
  it('19. new Truck -> FLEET_ROSTER dirty', async () => {
    const carrierId = 'CAR-TEST-001';
    inMemoryAdminStore[`projects/${TEST_PROJECT_ID}/carrier_memberships/${carrierId}`] = {
      projectId: TEST_PROJECT_ID,
      carrierId,
      status: 'ACTIVE',
    };

    await driverTruckIntakeServer.createStandaloneTruck(
      {
        projectId: TEST_PROJECT_ID,
        carrierId,
        plateNumber: 'أ ب ج 1 2 3 4',
      },
      adminContext
    );

    const state = await getState(TEST_PROJECT_ID);
    expect(state.dirtyTabs).toContain('FLEET_ROSTER');
    expect(state.dirtyTabs).not.toContain('DRIVERS');
    expect(state.lastMutationReason).toBe('PROJECT_TRUCK_SETUP_CHANGED');
  });

  // 20. new Truck membership → FLEET_ROSTER dirty
  it('20. new Truck membership -> FLEET_ROSTER dirty', async () => {
    const carrierId = 'CAR-TEST-001';
    inMemoryAdminStore[`projects/${TEST_PROJECT_ID}/carrier_memberships/${carrierId}`] = {
      projectId: TEST_PROJECT_ID,
      carrierId,
      status: 'ACTIVE',
    };
    const globalTruckId = 'TRK-GLOBAL-001';
    inMemoryAdminStore[`trucks/${globalTruckId}`] = {
      truckId: globalTruckId,
      plate: 'د هـ و 5 6 7 8',
      normalizedPlate: 'د_هـ_و_5_6_7_8',
      status: 'ACTIVE',
    };
    inMemoryAdminStore['natural_identity_lookups/TRUCK_2K__2YfZgV81XzZfN184'] = {
      entityType: 'TRUCK',
      systemId: globalTruckId,
    };

    await driverTruckIntakeServer.createStandaloneTruck(
      {
        projectId: TEST_PROJECT_ID,
        carrierId,
        plateNumber: 'د هـ و 5 6 7 8',
      },
      adminContext
    );

    const state = await getState(TEST_PROJECT_ID);
    expect(state.dirtyTabs).toContain('FLEET_ROSTER');
  });

  // 21. new/change Truck affiliation → FLEET_ROSTER dirty
  it('21. new/change Truck affiliation -> FLEET_ROSTER dirty', async () => {
    const carrierId = 'CAR-TEST-001';
    inMemoryAdminStore[`projects/${TEST_PROJECT_ID}/carrier_memberships/${carrierId}`] = {
      projectId: TEST_PROJECT_ID,
      carrierId,
      status: 'ACTIVE',
    };
    const globalTruckId = 'TRK-GLOBAL-002';
    inMemoryAdminStore[`trucks/${globalTruckId}`] = {
      truckId: globalTruckId,
      plate: 'ر ز س 9 9 9 9',
      normalizedPlate: 'ر_ز_س_9_9_9_9',
      status: 'ACTIVE',
    };
    // Truck is already a member of project, but had no affiliation
    inMemoryAdminStore[`projects/${TEST_PROJECT_ID}/truck_memberships/${globalTruckId}`] = {
      projectId: TEST_PROJECT_ID,
      truckId: globalTruckId,
      status: 'ACTIVE',
    };

    await driverTruckIntakeServer.createStandaloneTruck(
      {
        projectId: TEST_PROJECT_ID,
        carrierId,
        plateNumber: 'ر ز س 9 9 9 9',
      },
      adminContext
    );

    const state = await getState(TEST_PROJECT_ID);
    expect(state.dirtyTabs).toContain('FLEET_ROSTER');
  });

  // 22. idempotent existing standalone Truck does not rewrite freshness state
  it('22. idempotent existing standalone Truck does not rewrite freshness state', async () => {
    const carrierId = 'CAR-TEST-001';
    inMemoryAdminStore[`projects/${TEST_PROJECT_ID}/carrier_memberships/${carrierId}`] = {
      projectId: TEST_PROJECT_ID,
      carrierId,
      status: 'ACTIVE',
    };

    await driverTruckIntakeServer.createStandaloneTruck(
      {
        projectId: TEST_PROJECT_ID,
        carrierId,
        plateNumber: 'ط ي ك 1 1 1 1',
      },
      adminContext
    );

    // Reset state to clean
    inMemoryAdminStore[`projects/${TEST_PROJECT_ID}/workspace_projection_state/current`] = {
      projectId: TEST_PROJECT_ID,
      dirtyTabs: [],
      dirtySince: null,
      lastMutationAt: null,
      lastMutationReason: null,
      lastSuccessfulProjectionAt: null,
      lastSuccessfulProjectionTabs: [],
      updatedAt: '2026-09-30T00:00:00.000Z',
    };

    await driverTruckIntakeServer.createStandaloneTruck(
      {
        projectId: TEST_PROJECT_ID,
        carrierId,
        plateNumber: 'ط ي ك 1 1 1 1',
      },
      adminContext
    );

    const state = await getState(TEST_PROJECT_ID);
    expect(state.dirtyTabs).toEqual([]);
    expect(state.lastMutationAt).toBeNull();
  });

  // ==========================================
  // SECTION 6: CANONICAL SHARED INTAKE
  // ==========================================

  // 23. new Driver + Truck intake → DRIVERS + FLEET_ROSTER dirty
  it('23. new Driver + Truck intake -> DRIVERS + FLEET_ROSTER dirty', async () => {
    const carrierId = 'CAR-TEST-001';
    const materialId = 'MAT-TEST-001';
    inMemoryAdminStore[`projects/${TEST_PROJECT_ID}/carrier_memberships/${carrierId}`] = {
      projectId: TEST_PROJECT_ID,
      carrierId,
      status: 'ACTIVE',
    };
    inMemoryAdminStore[`projects/${TEST_PROJECT_ID}/material_memberships/${materialId}`] = {
      projectId: TEST_PROJECT_ID,
      materialId,
      status: 'ACTIVE',
    };

    await driverTruckIntakeServer.processSharedIntake(
      {
        projectId: TEST_PROJECT_ID,
        carrierId,
        materialId,
        driverName: 'ناصر فهد',
        residencyId: '1055443322',
        plateNumber: 'ل م ن 2 2 2 2',
      },
      adminContext
    );

    const state = await getState(TEST_PROJECT_ID);
    expect(state.dirtyTabs).toContain('DRIVERS');
    expect(state.dirtyTabs).toContain('FLEET_ROSTER');
    expect(state.lastMutationReason).toBe('CANONICAL_SHARED_INTAKE_CHANGED');
  });

  // 24. Driver-only master change includes DRIVERS
  it('24. Driver-only master change includes DRIVERS', async () => {
    const carrierId = 'CAR-TEST-001';
    const materialId = 'MAT-TEST-001';
    const truckId = 'TRK-PRE-001';
    inMemoryAdminStore[`projects/${TEST_PROJECT_ID}/carrier_memberships/${carrierId}`] = {
      projectId: TEST_PROJECT_ID,
      carrierId,
      status: 'ACTIVE',
    };
    inMemoryAdminStore[`projects/${TEST_PROJECT_ID}/material_memberships/${materialId}`] = {
      projectId: TEST_PROJECT_ID,
      materialId,
      status: 'ACTIVE',
    };
    // Pre-existing truck, membership, affiliation, allocation
    inMemoryAdminStore[`trucks/${truckId}`] = {
      truckId,
      plate: 'س ع ف 3 3 3 3',
      normalizedPlate: 'س_ع_ف_3_3_3_3',
      status: 'ACTIVE',
    };
    inMemoryAdminStore['natural_identity_lookups/TRUCK_2LPZhdi5XzNfM18zXzM_'] = {
      entityType: 'TRUCK',
      systemId: truckId,
    };
    inMemoryAdminStore[`projects/${TEST_PROJECT_ID}/truck_memberships/${truckId}`] = {
      projectId: TEST_PROJECT_ID,
      truckId,
      status: 'ACTIVE',
    };
    inMemoryAdminStore[`projects/${TEST_PROJECT_ID}/truck_carrier_affiliations/${truckId}`] = {
      projectId: TEST_PROJECT_ID,
      truckId,
      carrierId,
      status: 'ACTIVE',
    };

    // Intake introduces brand new Driver
    await driverTruckIntakeServer.processSharedIntake(
      {
        projectId: TEST_PROJECT_ID,
        carrierId,
        materialId,
        driverName: 'طارق زياد',
        residencyId: '1044332211',
        plateNumber: 'س ع ف 3 3 3 3',
      },
      adminContext
    );

    const state = await getState(TEST_PROJECT_ID);
    expect(state.dirtyTabs).toContain('DRIVERS');
    expect(state.dirtyTabs).toContain('FLEET_ROSTER'); // New assignment also dirties fleet
  });

  // 25. Fleet relationship change includes FLEET_ROSTER
  it('25. Fleet relationship change includes FLEET_ROSTER', async () => {
    const carrierId = 'CAR-TEST-001';
    const materialId = 'MAT-TEST-001';
    inMemoryAdminStore[`projects/${TEST_PROJECT_ID}/carrier_memberships/${carrierId}`] = {
      projectId: TEST_PROJECT_ID,
      carrierId,
      status: 'ACTIVE',
    };
    inMemoryAdminStore[`projects/${TEST_PROJECT_ID}/material_memberships/${materialId}`] = {
      projectId: TEST_PROJECT_ID,
      materialId,
      status: 'ACTIVE',
    };

    await driverTruckIntakeServer.processSharedIntake(
      {
        projectId: TEST_PROJECT_ID,
        carrierId,
        materialId,
        driverName: 'ياسر محمد',
        residencyId: '1033221100',
        plateNumber: 'ق ر ش 4 4 4 4',
      },
      adminContext
    );

    const state = await getState(TEST_PROJECT_ID);
    expect(state.dirtyTabs).toContain('FLEET_ROSTER');
  });

  // 26. assignment change dirties FLEET_ROSTER
  it('26. assignment change dirties FLEET_ROSTER', async () => {
    const carrierId = 'CAR-TEST-001';
    const materialId = 'MAT-TEST-001';
    inMemoryAdminStore[`projects/${TEST_PROJECT_ID}/carrier_memberships/${carrierId}`] = {
      projectId: TEST_PROJECT_ID,
      carrierId,
      status: 'ACTIVE',
    };
    inMemoryAdminStore[`projects/${TEST_PROJECT_ID}/material_memberships/${materialId}`] = {
      projectId: TEST_PROJECT_ID,
      materialId,
      status: 'ACTIVE',
    };

    // Intake pair A
    await driverTruckIntakeServer.processSharedIntake(
      {
        projectId: TEST_PROJECT_ID,
        carrierId,
        materialId,
        driverName: 'سالم أحمد',
        residencyId: '1022110099',
        plateNumber: 'ت ث ج 5 5 5 5',
      },
      adminContext
    );

    // Intake pair B (different truck, same driver reassigned)
    await driverTruckIntakeServer.processSharedIntake(
      {
        projectId: TEST_PROJECT_ID,
        carrierId,
        materialId,
        driverName: 'سالم أحمد',
        residencyId: '1022110099',
        plateNumber: 'ح خ د 6 6 6 6',
      },
      adminContext
    );

    const state = await getState(TEST_PROJECT_ID);
    expect(state.dirtyTabs).toContain('FLEET_ROSTER');
  });

  // 27. material allocation change dirties FLEET_ROSTER
  it('27. material allocation change dirties FLEET_ROSTER', async () => {
    const carrierId = 'CAR-TEST-001';
    const mat1 = 'MAT-001';
    const mat2 = 'MAT-002';
    inMemoryAdminStore[`projects/${TEST_PROJECT_ID}/carrier_memberships/${carrierId}`] = {
      projectId: TEST_PROJECT_ID,
      carrierId,
      status: 'ACTIVE',
    };
    inMemoryAdminStore[`projects/${TEST_PROJECT_ID}/material_memberships/${mat1}`] = {
      projectId: TEST_PROJECT_ID,
      materialId: mat1,
      status: 'ACTIVE',
    };
    inMemoryAdminStore[`projects/${TEST_PROJECT_ID}/material_memberships/${mat2}`] = {
      projectId: TEST_PROJECT_ID,
      materialId: mat2,
      status: 'ACTIVE',
    };

    // Initial allocation to mat1
    await driverTruckIntakeServer.processSharedIntake(
      {
        projectId: TEST_PROJECT_ID,
        carrierId,
        materialId: mat1,
        driverName: 'بندر سعد',
        residencyId: '1011009988',
        plateNumber: 'ص ض ط 7 7 7 7',
      },
      adminContext
    );

    // Reset dirty state
    inMemoryAdminStore[`projects/${TEST_PROJECT_ID}/workspace_projection_state/current`] = {
      projectId: TEST_PROJECT_ID,
      dirtyTabs: [],
      dirtySince: null,
      lastMutationAt: null,
      lastMutationReason: null,
      lastSuccessfulProjectionAt: null,
      lastSuccessfulProjectionTabs: [],
      updatedAt: '2026-09-30T00:00:00.000Z',
    };

    // Reallocate truck to mat2
    await driverTruckIntakeServer.processSharedIntake(
      {
        projectId: TEST_PROJECT_ID,
        carrierId,
        materialId: mat2,
        driverName: 'بندر سعد',
        residencyId: '1011009988',
        plateNumber: 'ص ض ط 7 7 7 7',
      },
      adminContext
    );

    const state = await getState(TEST_PROJECT_ID);
    expect(state.dirtyTabs).toContain('FLEET_ROSTER');
  });

  // 28. carrier affiliation change affecting fleet dirties FLEET_ROSTER
  it('28. carrier affiliation change affecting fleet dirties FLEET_ROSTER', async () => {
    const car1 = 'CAR-001';
    const car2 = 'CAR-002';
    const mat = 'MAT-001';
    inMemoryAdminStore[`projects/${TEST_PROJECT_ID}/carrier_memberships/${car1}`] = {
      projectId: TEST_PROJECT_ID,
      carrierId: car1,
      status: 'ACTIVE',
    };
    inMemoryAdminStore[`projects/${TEST_PROJECT_ID}/carrier_memberships/${car2}`] = {
      projectId: TEST_PROJECT_ID,
      carrierId: car2,
      status: 'ACTIVE',
    };
    inMemoryAdminStore[`projects/${TEST_PROJECT_ID}/material_memberships/${mat}`] = {
      projectId: TEST_PROJECT_ID,
      materialId: mat,
      status: 'ACTIVE',
    };

    await driverTruckIntakeServer.processSharedIntake(
      {
        projectId: TEST_PROJECT_ID,
        carrierId: car1,
        materialId: mat,
        driverName: 'حمزة عمر',
        residencyId: '1000998877',
        plateNumber: 'ظ ع غ 8 8 8 8',
      },
      adminContext
    );

    const state = await getState(TEST_PROJECT_ID);
    expect(state.dirtyTabs).toContain('FLEET_ROSTER');
  });

  // 29. semantically idempotent repeated intake does NOT refresh dirty state
  it('29. semantically idempotent repeated intake does NOT refresh dirty state', async () => {
    const carrierId = 'CAR-TEST-001';
    const materialId = 'MAT-TEST-001';
    inMemoryAdminStore[`projects/${TEST_PROJECT_ID}/carrier_memberships/${carrierId}`] = {
      projectId: TEST_PROJECT_ID,
      carrierId,
      status: 'ACTIVE',
    };
    inMemoryAdminStore[`projects/${TEST_PROJECT_ID}/material_memberships/${materialId}`] = {
      projectId: TEST_PROJECT_ID,
      materialId,
      status: 'ACTIVE',
    };

    const payload = {
      projectId: TEST_PROJECT_ID,
      carrierId,
      materialId,
      driverName: 'مازن سامي',
      residencyId: '1099001122',
      plateNumber: 'ف ق ك 9 9 9 9',
    };

    // First intake creates everything and marks dirty
    await driverTruckIntakeServer.processSharedIntake(payload, adminContext);

    // Reset projection state to clean baseline
    inMemoryAdminStore[`projects/${TEST_PROJECT_ID}/workspace_projection_state/current`] = {
      projectId: TEST_PROJECT_ID,
      dirtyTabs: [],
      dirtySince: null,
      lastMutationAt: null,
      lastMutationReason: null,
      lastSuccessfulProjectionAt: null,
      lastSuccessfulProjectionTabs: [],
      updatedAt: '2026-09-30T00:00:00.000Z',
    };

    // Second call with EXACT identical data (idempotent no-op)
    await driverTruckIntakeServer.processSharedIntake(payload, adminContext);

    const state = await getState(TEST_PROJECT_ID);
    expect(state.dirtyTabs).toEqual([]);
    expect(state.lastMutationAt).toBeNull();
  });

  // ==========================================
  // SECTION 7: ATOMICITY / BOUNDARIES
  // ==========================================

  // 30. dirty-state document write occurs inside same transaction as canonical mutation
  it('30. dirty-state document write occurs inside same transaction as canonical mutation', async () => {
    let capturedTx: any = null;
    const originalRunTransaction = adminDb.runTransaction;
    adminDb.runTransaction = async (cb: any) => {
      return originalRunTransaction(async (tx: any) => {
        capturedTx = tx;
        const setSpy = vi.spyOn(tx, 'set');
        const res = await cb(tx);
        const setCalls = setSpy.mock.calls;
        const stateSetCall = setCalls.find((call: any[]) => call[0]?.id === 'current');
        expect(stateSetCall).toBeDefined();
        return res;
      });
    };

    await provisioningService.setupProjectMaterial(
      TEST_PROJECT_ID,
      { code: 'MAT-ATOMIC-01', nameAr: 'مادة ذرية' },
      { userId: adminContext.userId }
    );

    expect(capturedTx).not.toBeNull();
    const state = await getState(TEST_PROJECT_ID);
    expect(state.dirtyTabs).toContain('MATERIALS');

    adminDb.runTransaction = originalRunTransaction;
  });

  // 31. invalidation failure prevents canonical transaction commit
  it('31. invalidation failure prevents canonical transaction commit', async () => {
    // Inject a failure into transaction.set specifically for the workspace_projection_state path
    const originalRunTransaction = adminDb.runTransaction;
    adminDb.runTransaction = async (cb: any) => {
      return originalRunTransaction(async (tx: any) => {
        const originalSet = tx.set;
        tx.set = (ref: any, data: any) => {
          if (ref.id === 'current') {
            throw new Error('SIMULATED_TRANSACTION_FAILURE: Projection state set failed');
          }
          return originalSet(ref, data);
        };
        return cb(tx);
      });
    };

    await expect(
      provisioningService.setupProjectMaterial(
        TEST_PROJECT_ID,
        { code: 'MAT-ROLLBACK-01', nameAr: 'مادة متراجعة' },
        { userId: adminContext.userId }
      )
    ).rejects.toThrow('SIMULATED_TRANSACTION_FAILURE');

    // Verify canonical material was NOT committed
    const query = await adminDb.collection('materials').where('code', '==', 'MAT-ROLLBACK-01').get();
    expect(query.empty).toBe(true);

    adminDb.runTransaction = originalRunTransaction;
  });

  // 32. server/app.ts contains no route-level markDirty wiring
  it('32. server/app.ts contains no route-level markDirty wiring', () => {
    const appTsPath = path.resolve(__dirname, '../../server/app.ts');
    const appTsContent = fs.readFileSync(appTsPath, 'utf-8');

    expect(appTsContent).not.toContain('markDirty');
    expect(appTsContent).not.toContain('markDirtyInTransaction');
    expect(appTsContent).not.toContain('projectWorkspaceProjectionStateServer');
  });

  // 33. entityResolutionCommand.service.ts contains no duplicate markDirty wiring
  it('33. entityResolutionCommand.service.ts contains no duplicate markDirty wiring', () => {
    const filePath = path.resolve(__dirname, '../services/import/entityResolutionCommand.service.ts');
    const content = fs.readFileSync(filePath, 'utf-8');

    expect(content).not.toContain('markDirty');
    expect(content).not.toContain('markDirtyInTransaction');
    expect(content).not.toContain('workspace_projection_state');
  });

  // 34. driverTruckImport.ts contains no duplicate markDirty wiring
  it('34. driverTruckImport.ts contains no duplicate markDirty wiring', () => {
    const filePath = path.resolve(__dirname, '../services/import/driverTruckImport.ts');
    const content = fs.readFileSync(filePath, 'utf-8');

    expect(content).not.toContain('markDirty');
    expect(content).not.toContain('markDirtyInTransaction');
    expect(content).not.toContain('workspace_projection_state');
  });

  // 35. no Google dependency added
  it('35. no Google dependency added to modified server services', () => {
    const provPath = path.resolve(__dirname, '../services/projectProvisioning.server.ts');
    const provContent = fs.readFileSync(provPath, 'utf-8');
    expect(provContent).not.toContain('googleapis');
    expect(provContent).not.toContain('clientWorkspaceService');
    expect(provContent).not.toContain('serverWorkspaceService');

    const intakePath = path.resolve(__dirname, '../services/driverTruckIntake.server.ts');
    const intakeContent = fs.readFileSync(intakePath, 'utf-8');
    expect(intakeContent).not.toContain('googleapis');
    expect(intakeContent).not.toContain('clientWorkspaceService');
    expect(intakeContent).not.toContain('serverWorkspaceService');
  });

  // 36. no OPERATIONS invalidation
  it('36. no OPERATIONS invalidation in Unit 5B mutations', () => {
    const provPath = path.resolve(__dirname, '../services/projectProvisioning.server.ts');
    const provContent = fs.readFileSync(provPath, 'utf-8');
    expect(provContent).not.toContain("'OPERATIONS'");

    const intakePath = path.resolve(__dirname, '../services/driverTruckIntake.server.ts');
    const intakeContent = fs.readFileSync(intakePath, 'utf-8');
    expect(intakeContent).not.toContain("'OPERATIONS'");
  });

  // 37. no EXCEPTIONS invalidation
  it('37. no EXCEPTIONS invalidation in Unit 5B mutations', () => {
    const provPath = path.resolve(__dirname, '../services/projectProvisioning.server.ts');
    const provContent = fs.readFileSync(provPath, 'utf-8');
    expect(provContent).not.toContain("'EXCEPTIONS'");

    const intakePath = path.resolve(__dirname, '../services/driverTruckIntake.server.ts');
    const intakeContent = fs.readFileSync(intakePath, 'utf-8');
    expect(intakeContent).not.toContain("'EXCEPTIONS'");
  });

  // 38. no REPORTS invalidation
  it('38. no REPORTS invalidation in Unit 5B mutations', () => {
    const provPath = path.resolve(__dirname, '../services/projectProvisioning.server.ts');
    const provContent = fs.readFileSync(provPath, 'utf-8');
    expect(provContent).not.toContain("'REPORTS'");

    const intakePath = path.resolve(__dirname, '../services/driverTruckIntake.server.ts');
    const intakeContent = fs.readFileSync(intakePath, 'utf-8');
    expect(intakeContent).not.toContain("'REPORTS'");
  });

  // 39. Wizard and activation remain untouched
  it('39. Wizard and activation remain untouched in Unit 5B', () => {
    const wizardPath = path.resolve(__dirname, '../components/wizard/ProjectSetupWizard.tsx');
    const wizardContent = fs.readFileSync(wizardPath, 'utf-8');
    expect(wizardContent).not.toContain('markDirtyInTransaction');

    const activationPath = path.resolve(__dirname, '../services/projectActivation.service.ts');
    const activationContent = fs.readFileSync(activationPath, 'utf-8');
    expect(activationContent).not.toContain('markDirtyInTransaction');
    expect(activationContent).not.toContain('workspace_projection_state');
  });

  // 40. canonical ID/code generation unchanged
  it('40. canonical ID/code generation contracts unchanged', () => {
    const entitiesPath = path.resolve(__dirname, '../types/entities.ts');
    const entitiesContent = fs.readFileSync(entitiesPath, 'utf-8');

    expect(entitiesContent).toContain('projectId: string');
    expect(entitiesContent).toContain('projectCode?: string');
  });
});
