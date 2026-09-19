import { describe, it, expect, beforeEach, vi } from 'vitest';
import { driverTruckIntakeService } from '../services/driverTruckIntake.service';
import { driverRepository } from '../repositories/driver.repository';
import { truckRepository } from '../repositories/truck.repository';
import { projectCarrierRosterRepository } from '../repositories/projectCarrierRoster.repository';
import { AuthUserContext } from '../types/common';

/**
 * TEST ENVIRONMENT CLASSIFICATION:
 * Mode: IN-MEMORY TRANSACTION SIMULATION / UNIT TEST
 * Live Firestore: LIVE_FIRESTORE_E2E_VERIFIED = NO
 */

describe('LU-P6-02A Driver/Truck Project Intake & Roster Convergence (Atomicity Tests)', () => {
  const testProjectId = 'PRJ-P602A-TEST';
  const testCarrierId = 'CRR-P602A-01';
  const testMaterialId = 'MAT-P602A-AGG';

  const adminAuth: AuthUserContext = {
    userId: 'USR-ADMIN-P602A',
    role: 'PROJECT_ADMIN',
    email: 'admin@p602a.sa',
    displayName: 'مدير المشروع الاختباري',
    assignedProjectIds: [testProjectId],
  };

  const unauthorizedAuth: AuthUserContext = {
    userId: 'USR-UNAUTH-01',
    role: 'SCALE_OPERATOR',
    email: 'operator@p602a.sa',
    displayName: 'مشغل ميزان غير مصرح',
    assignedProjectIds: ['PRJ-OTHER'],
  };

  beforeEach(async () => {
    vi.restoreAllMocks();
  });

  it('1. Atomically registers new driver, new truck, and project roster entry', async () => {
    const payload = {
      projectId: testProjectId,
      carrierId: testCarrierId,
      materialId: testMaterialId,
      driverName: 'سلطان عبد الله القحطاني',
      plateNumber: 'أ ب ج 9876',
      phone: '0551122334',
      residencyId: '1099887766',
    };

    const result = await driverTruckIntakeService.processSharedIntake(payload, adminAuth);

    expect(result).toBeDefined();
    expect(result.driverId).toBeDefined();
    const driver = await driverRepository.findById(testProjectId, result.driverId);
    expect(driver).toBeDefined();
    expect(driver?.name).toBe('سلطان عبد الله القحطاني');
    expect(driver?.idNumber).toBe('1099887766');

    expect(result.truckId).toBeDefined();
    const truck = await truckRepository.findById(testProjectId, result.truckId);
    expect(truck).toBeDefined();
    expect(truck?.plate).toBe('أ ب ج 9876');

    const savedTrucks = await truckRepository.listByProject(testProjectId);
    const savedTruck = savedTrucks.find((t) => t.truckId === result.truckId);
    expect(savedTruck).toBeDefined();

    const savedDrivers = await driverRepository.listByProject(testProjectId);
    const savedDriver = savedDrivers.find((d) => d.driverId === result.driver.driverId);
    expect(savedDriver).toBeDefined();

    const savedRosters = await projectCarrierRosterRepository.listByProject(testProjectId);
    const savedRoster = savedRosters.find((r) => r.rosterId === result.roster.rosterId);
    expect(savedRoster).toBeDefined();
    expect(savedRoster?.globalDriverId).toBe(result.driver.driverId);
  });

  it('2. Atomically rolls back if roster write fails mid-intake', async () => {
    const uniquePlate = 'ط ظ ع 9999';
    const uniqueDriver = 'فهد ناصر الشمري';

    // Mock projectCarrierRosterRepository.create to throw error
    vi.spyOn(projectCarrierRosterRepository, 'create').mockRejectedValueOnce(
      new Error('FIRESTORE_WRITE_FAILURE: Roster creation failed')
    );

    const payload = {
      projectId: testProjectId,
      carrierId: testCarrierId,
      materialId: testMaterialId,
      driverName: uniqueDriver,
      plateNumber: uniquePlate,
    };

    await expect(
      driverTruckIntakeService.processSharedIntake(payload, adminAuth)
    ).rejects.toThrow('FIRESTORE_WRITE_FAILURE');
  });

  it('3. Existing Driver + New Truck + Roster (Atomic Commit)', async () => {
    const payload1 = {
      projectId: testProjectId,
      carrierId: testCarrierId,
      materialId: testMaterialId,
      driverName: 'عمر خالد الدوسري',
      plateNumber: 'ر ز س 1111',
    };
    const res1 = await driverTruckIntakeService.processSharedIntake(payload1, adminAuth);

    // Intake with same driver name but NEW truck plate
    const payload2 = {
      projectId: testProjectId,
      carrierId: testCarrierId,
      materialId: testMaterialId,
      driverName: 'عمر خالد الدوسري', // existing driver
      plateNumber: 'ش ص ض 2222', // new truck
    };
    const res2 = await driverTruckIntakeService.processSharedIntake(payload2, adminAuth);

    expect(res2.driver.driverId).toBe(res1.driver.driverId);
    expect(res2.truck.truckId).not.toBe(res1.truck.truckId);
    expect(res2.roster.globalDriverId).toBe(res1.driver.driverId);
  });

  it('4. New Driver + Existing Truck + Roster (Atomic Commit)', async () => {
    const payload1 = {
      projectId: testProjectId,
      carrierId: testCarrierId,
      materialId: testMaterialId,
      driverName: 'سعد علي المري',
      plateNumber: 'ط ظ ع 3333',
    };
    const res1 = await driverTruckIntakeService.processSharedIntake(payload1, adminAuth);

    // Intake with NEW driver name but EXISTING truck plate
    const payload2 = {
      projectId: testProjectId,
      carrierId: testCarrierId,
      materialId: testMaterialId,
      driverName: 'ماجد عبد العزيز الزهراني', // new driver
      plateNumber: 'ط ظ ع 3333', // existing truck
    };
    const res2 = await driverTruckIntakeService.processSharedIntake(payload2, adminAuth);

    expect(res2.driver.driverId).not.toBe(res1.driver.driverId);
    expect(res2.truck.truckId).toBe(res1.truck.truckId);
    expect(res2.roster.globalDriverId).toBe(res2.driver.driverId);
  });

  it('5. Existing Driver + Existing Truck + Existing Roster (Correct Update/Reuse)', async () => {
    const payload1 = {
      projectId: testProjectId,
      carrierId: testCarrierId,
      materialId: testMaterialId,
      driverName: 'خالد محمد العتيبي',
      plateNumber: 'س ص ع 1234',
      phone: '0509988776',
      residencyId: '2088776655',
    };

    const result1 = await driverTruckIntakeService.processSharedIntake(payload1, adminAuth);

    // Repeat intake with same normalized driver & plate
    const payload2 = {
      projectId: testProjectId,
      carrierId: testCarrierId,
      materialId: testMaterialId,
      driverName: 'خالد محمد العتيبي',
      plateNumber: 'س ص ع 1234',
      phone: '0509988776',
      residencyId: '2088776655',
    };

    const result2 = await driverTruckIntakeService.processSharedIntake(payload2, adminAuth);

    // Should reuse driverId, truckId, and update roster
    expect(result2.driver.driverId).toBe(result1.driver.driverId);
    expect(result2.truck.truckId).toBe(result1.truck.truckId);
    expect(result2.roster.rosterId).toBe(result1.roster.rosterId);
  });

  it('6. Rejects unauthorized role and unassigned project context', async () => {
    const payload = {
      projectId: testProjectId,
      carrierId: testCarrierId,
      materialId: testMaterialId,
      driverName: 'محمد أحمد',
      plateNumber: 'د ذ ر 5555',
    };

    await expect(
      driverTruckIntakeService.processSharedIntake(payload, unauthorizedAuth)
    ).rejects.toThrow();
  });
});

