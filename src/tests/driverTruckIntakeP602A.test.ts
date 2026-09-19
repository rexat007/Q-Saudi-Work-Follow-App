import { describe, it, expect, beforeEach, vi } from 'vitest';
import { driverTruckIntakeServer } from '../services/driverTruckIntake.server';
import { AuthUserContext } from '../types/common';

// Spy on legacy repositories to verify they receive zero writes
import { driverRepository } from '../repositories/driver.repository';
import { truckRepository } from '../repositories/truck.repository';
import { projectCarrierRosterRepository } from '../repositories/projectCarrierRoster.repository';

// In-memory Firestore Transaction Simulator
let mockStore: Record<string, any> = {};

function mockDocRef(paths: string[]): any {
  const pathKey = paths.join('/');
  return {
    get: async () => {
      const val = mockStore[pathKey];
      return {
        exists: val !== undefined,
        data: () => val,
      };
    },
    set: async (data: any) => {
      mockStore[pathKey] = data;
    },
    update: async (data: any) => {
      mockStore[pathKey] = {
        ...mockStore[pathKey],
        ...data,
      };
    },
    delete: async () => {
      delete mockStore[pathKey];
    },
    collection: (col: string) => ({
      doc: (id: string) => mockDocRef([...paths, col, id]),
    }),
  };
}

vi.mock('../firebase/admin', () => {
  return {
    adminDb: {
      collection: (col: string) => ({
        doc: (docId: string) => mockDocRef([col, docId]),
      }),
      runTransaction: async (cb: any) => {
        const tx = {
          get: async (ref: any) => ref.get(),
          set: (ref: any, data: any) => ref.set(data),
          update: (ref: any, data: any) => ref.update(data),
          delete: (ref: any) => ref.delete(),
        };
        return cb(tx);
      },
    },
  };
});

describe('LU-P6-02A Driver/Truck Project Intake Canonical Verification Suite (Zero-Legacy/Fortress)', () => {
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

  beforeEach(() => {
    vi.restoreAllMocks();
    mockStore = {};

    // Seed required ACTIVE Carrier & Material memberships on the project
    mockStore[`projects/${testProjectId}/carrier_memberships/${testCarrierId}`] = { status: 'ACTIVE' };
    mockStore[`projects/${testProjectId}/material_memberships/${testMaterialId}`] = { status: 'ACTIVE' };

    // Spy on legacy write methods to assert they are never called
    vi.spyOn(driverRepository, 'create').mockImplementation(async () => { throw new Error('LEGACY_WRITE_VIOLATION: driverRepository is deprecated'); });
    vi.spyOn(truckRepository, 'create').mockImplementation(async () => { throw new Error('LEGACY_WRITE_VIOLATION: truckRepository is deprecated'); });
    vi.spyOn(projectCarrierRosterRepository, 'create').mockImplementation(async () => { throw new Error('LEGACY_WRITE_VIOLATION: projectCarrierRosterRepository is deprecated'); });
  });

  it('1. Atomically registers a valid pair into the project with strict canonical properties and zero legacy writes', async () => {
    const payload = {
      projectId: testProjectId,
      carrierId: testCarrierId,
      materialId: testMaterialId,
      driverName: 'سلطان عبد الله القحطاني',
      plateNumber: 'أ ب ج 9876',
      phone: '0551122334',
      residencyId: '1099887766',
    };

    const result = await driverTruckIntakeServer.processSharedIntake(payload, adminAuth);

    expect(result).toBeDefined();
    expect(result.driverId).toBeDefined();
    expect(result.truckId).toBeDefined();
    expect(result.assignmentId).toBeDefined();
    expect(result.allocationId).toBeDefined();

    // Verify written Global entities
    const driverDoc = mockStore[`drivers/${result.driverId}`];
    expect(driverDoc).toBeDefined();
    expect(driverDoc.nationalId).toBe('1099887766');
    expect(driverDoc.phone).toBe('0551122334');

    const truckDoc = mockStore[`trucks/${result.truckId}`];
    expect(truckDoc).toBeDefined();
    expect(truckDoc.plate).toBe('أ ب ج 9876');

    // Verify lookups exist
    const { computeNaturalKeyToken } = await import('../repositories/globalIdentity.repository');
    const { normalizePlate, normalizeIdNumber } = await import('../utils/normalization');
    const expectedDriverLookupKey = `natural_identity_lookups/${computeNaturalKeyToken('DRIVER', normalizeIdNumber('1099887766'))}`;
    const expectedTruckLookupKey = `natural_identity_lookups/${computeNaturalKeyToken('TRUCK', normalizePlate('أ ب ج 9876'))}`;

    expect(mockStore[expectedDriverLookupKey]).toBeDefined();
    expect(mockStore[expectedTruckLookupKey]).toBeDefined();

    // Verify project-level memberships and affiliations are ACTIVE
    expect(mockStore[`projects/${testProjectId}/driver_memberships/${result.driverId}`].status).toBe('ACTIVE');
    expect(mockStore[`projects/${testProjectId}/truck_memberships/${result.truckId}`].status).toBe('ACTIVE');
    expect(mockStore[`projects/${testProjectId}/driver_carrier_affiliations/${result.driverId}`].status).toBe('ACTIVE');
    expect(mockStore[`projects/${testProjectId}/truck_carrier_affiliations/${result.truckId}`].status).toBe('ACTIVE');

    // Verify correct assignments and material allocations exist
    expect(mockStore[`projects/${testProjectId}/driver_truck_assignments/${result.assignmentId}`].status).toBe('ACTIVE');
    expect(mockStore[`projects/${testProjectId}/truck_material_allocations/${result.allocationId}`].status).toBe('ACTIVE');

    // Assert absolutely ZERO legacy writes occurred
    expect(driverRepository.create).not.toHaveBeenCalled();
    expect(truckRepository.create).not.toHaveBeenCalled();
    expect(projectCarrierRosterRepository.create).not.toHaveBeenCalled();
  });

  it('2. Rejects with a clear validation error if residencyId / National ID is absent or missing (No synthetic derivation)', async () => {
    const payload = {
      projectId: testProjectId,
      carrierId: testCarrierId,
      materialId: testMaterialId,
      driverName: 'عمر ناصر',
      plateNumber: 'ب ج د 1122',
      // residencyId is missing
    };

    await expect(
      driverTruckIntakeServer.processSharedIntake(payload, adminAuth)
    ).rejects.toThrow('رقم الهوية الوطنية أو الإقامة مطلوب وغير موجود');
  });

  it('3. Rejects with a clear error if the residencyId format is invalid', async () => {
    const payload = {
      projectId: testProjectId,
      carrierId: testCarrierId,
      materialId: testMaterialId,
      driverName: 'عمر ناصر',
      plateNumber: 'ب ج د 1122',
      residencyId: '3009998877', // Invalid start digit (must be 1 or 2)
    };

    await expect(
      driverTruckIntakeServer.processSharedIntake(payload, adminAuth)
    ).rejects.toThrow('رقم الهوية الوطنية أو الإقامة غير صالح');
  });

  it('4. Rejects with a validation error if the requested Carrier or Material membership is inactive or absent (No auto-creation)', async () => {
    // Inactivate the seeded material membership
    mockStore[`projects/${testProjectId}/material_memberships/${testMaterialId}`] = { status: 'INACTIVE' };

    const payload = {
      projectId: testProjectId,
      carrierId: testCarrierId,
      materialId: testMaterialId,
      driverName: 'أحمد علي الشمراني',
      plateNumber: 'ع ص ق 5555',
      residencyId: '2011223344',
    };

    await expect(
      driverTruckIntakeServer.processSharedIntake(payload, adminAuth)
    ).rejects.toThrow('MATERIAL_NOT_ACTIVE_IN_PROJECT');
  });

  it('5. Rejects and blocks silent carrier reassignments if active affiliation conflict exists', async () => {
    // Register first
    const payload1 = {
      projectId: testProjectId,
      carrierId: testCarrierId,
      materialId: testMaterialId,
      driverName: 'عيسى خالد السبيعي',
      plateNumber: 'س ع ص 4444',
      residencyId: '1044332211',
    };
    await driverTruckIntakeServer.processSharedIntake(payload1, adminAuth);

    // Attempt to register same driver under a different Carrier
    const payload2 = {
      projectId: testProjectId,
      carrierId: 'CRR-OTHER-99', // Different carrier
      materialId: testMaterialId,
      driverName: 'عيسى خالد السبيعي',
      plateNumber: 'س ع ص 4444',
      residencyId: '1044332211',
    };

    // Pre-seed the other carrier as active so we don't fail membership checks first
    mockStore[`projects/${testProjectId}/carrier_memberships/CRR-OTHER-99`] = { status: 'ACTIVE' };

    await expect(
      driverTruckIntakeServer.processSharedIntake(payload2, adminAuth)
    ).rejects.toThrow('CARRIER_REASSIGNMENT_CONFLICT');
  });

  it('6. Rejects non-admin access contexts', async () => {
    const payload = {
      projectId: testProjectId,
      carrierId: testCarrierId,
      materialId: testMaterialId,
      driverName: 'محمد فهد',
      plateNumber: 'ر ز س 9900',
      residencyId: '1022334455',
    };

    await expect(
      driverTruckIntakeServer.processSharedIntake(payload, unauthorizedAuth)
    ).rejects.toThrow('غير مصرح لك');
  });
});
