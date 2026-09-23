import { describe, it, expect, beforeEach } from 'vitest';
import { createInMemoryAdminDb, setTestDbOverride, inMemoryAdminStore } from '../firebase/admin';
import { ProjectFleetReadModelAdminReadContext } from '../services/projectFleetReadModel.server';
import { projectFleetReadModelService } from '../services/projectFleetReadModel.service';

describe('Project Fleet Read Model Server-Safe Admin-Based ReadContext Test Suite', () => {
  let context: ProjectFleetReadModelAdminReadContext;
  const projectId = 'PRJ-ADMIN-FLEET-TEST';

  beforeEach(() => {
    // Clear mock admin database store
    for (const key of Object.keys(inMemoryAdminStore)) {
      delete inMemoryAdminStore[key];
    }
    const testDb = createInMemoryAdminDb({});
    setTestDbOverride(testDb);
    context = new ProjectFleetReadModelAdminReadContext();
  });

  it('1. listActiveTruckMemberships returns only ACTIVE memberships from Admin collection', async () => {
    inMemoryAdminStore[`projects/${projectId}/truck_memberships/TRK-001`] = {
      truckId: 'TRK-001',
      status: 'ACTIVE',
    };
    inMemoryAdminStore[`projects/${projectId}/truck_memberships/TRK-002`] = {
      truckId: 'TRK-002',
      status: 'SUSPENDED',
    };

    const memberships = await context.listActiveTruckMemberships(projectId);
    expect(memberships).toHaveLength(1);
    expect(memberships[0].truckId).toBe('TRK-001');
    expect(memberships[0].status).toBe('ACTIVE');
  });

  it('2. getTruckCarrierAffiliation returns active carrier affiliation correctly', async () => {
    inMemoryAdminStore[`projects/${projectId}/truck_carrier_affiliations/TRK-001`] = {
      projectId,
      truckId: 'TRK-001',
      carrierId: 'CAR-001',
      status: 'ACTIVE',
    };

    const aff = await context.getTruckCarrierAffiliation(projectId, 'TRK-001');
    expect(aff).not.toBeNull();
    expect(aff?.carrierId).toBe('CAR-001');
    expect(aff?.status).toBe('ACTIVE');
  });

  it('3. getActiveTruckSlot returns the active assignment slot payload', async () => {
    inMemoryAdminStore[`projects/${projectId}/truck_active_assignments/TRK-001`] = {
      assignmentId: 'ASN-001',
      driverId: 'DRV-001',
    };

    const slot = await context.getActiveTruckSlot(projectId, 'TRK-001');
    expect(slot).not.toBeNull();
    expect(slot?.assignmentId).toBe('ASN-001');
  });

  it('4. getDriverTruckAssignment returns assignment entity from Admin collection', async () => {
    inMemoryAdminStore[`projects/${projectId}/driver_truck_assignments/ASN-001`] = {
      assignmentId: 'ASN-001',
      projectId,
      driverId: 'DRV-001',
      truckId: 'TRK-001',
      status: 'ACTIVE',
    };

    const assignment = await context.getDriverTruckAssignment(projectId, 'ASN-001');
    expect(assignment).not.toBeNull();
    expect(assignment?.assignmentId).toBe('ASN-001');
    expect(assignment?.status).toBe('ACTIVE');
  });

  it('5. getDriverCarrierAffiliation returns active driver carrier affiliation correctly', async () => {
    inMemoryAdminStore[`projects/${projectId}/driver_carrier_affiliations/DRV-001`] = {
      projectId,
      driverId: 'DRV-001',
      carrierId: 'CAR-001',
      status: 'ACTIVE',
    };

    const aff = await context.getDriverCarrierAffiliation(projectId, 'DRV-001');
    expect(aff).not.toBeNull();
    expect(aff?.carrierId).toBe('CAR-001');
  });

  it('6. getActiveAllocationByTruck reads slot and resolves active allocation correctly', async () => {
    inMemoryAdminStore[`projects/${projectId}/truck_active_material_allocations/TRK-001`] = {
      allocationId: 'ALC-001',
    };
    inMemoryAdminStore[`projects/${projectId}/truck_material_allocations/ALC-001`] = {
      allocationId: 'ALC-001',
      projectId,
      truckId: 'TRK-001',
      materialId: 'MAT-001',
      status: 'ACTIVE',
      effectiveTo: null,
    };

    const allocation = await context.getActiveAllocationByTruck(projectId, 'TRK-001');
    expect(allocation).not.toBeNull();
    expect(allocation?.allocationId).toBe('ALC-001');
    expect(allocation?.materialId).toBe('MAT-001');
  });

  it('7. getActiveAllocationByTruck throws ALLOCATION_POINTER_CORRUPTION if allocation document is missing', async () => {
    inMemoryAdminStore[`projects/${projectId}/truck_active_material_allocations/TRK-001`] = {
      allocationId: 'ALC-MISSING',
    };

    await expect(context.getActiveAllocationByTruck(projectId, 'TRK-001')).rejects.toThrow(
      'ALLOCATION_POINTER_CORRUPTION'
    );
  });

  it('8. getActiveAllocationByTruck throws ALLOCATION_POINTER_CORRUPTION on truck or project mismatch', async () => {
    inMemoryAdminStore[`projects/${projectId}/truck_active_material_allocations/TRK-001`] = {
      allocationId: 'ALC-MISMATCH',
    };
    inMemoryAdminStore[`projects/${projectId}/truck_material_allocations/ALC-MISMATCH`] = {
      allocationId: 'ALC-MISMATCH',
      projectId,
      truckId: 'TRK-MISMATCHED-ID',
      status: 'ACTIVE',
      effectiveTo: null,
    };

    await expect(context.getActiveAllocationByTruck(projectId, 'TRK-001')).rejects.toThrow(
      'ALLOCATION_POINTER_CORRUPTION'
    );
  });

  it('9. getActiveAllocationByTruck throws ALLOCATION_POINTER_CORRUPTION if allocation status is not ACTIVE', async () => {
    inMemoryAdminStore[`projects/${projectId}/truck_active_material_allocations/TRK-001`] = {
      allocationId: 'ALC-CLOSED',
    };
    inMemoryAdminStore[`projects/${projectId}/truck_material_allocations/ALC-CLOSED`] = {
      allocationId: 'ALC-CLOSED',
      projectId,
      truckId: 'TRK-001',
      status: 'CLOSED',
      effectiveTo: 'some-date',
    };

    await expect(context.getActiveAllocationByTruck(projectId, 'TRK-001')).rejects.toThrow(
      'ALLOCATION_POINTER_CORRUPTION'
    );
  });

  it('10. Global identities can be loaded safely from top-level collections', async () => {
    inMemoryAdminStore['trucks/TRK-001'] = { truckId: 'TRK-001', plate: '1234 ABC', truckType: 'TIPPER_32M3' };
    inMemoryAdminStore['carriers/CAR-001'] = { carrierId: 'CAR-001', nameAr: 'الناقل الأول' };
    inMemoryAdminStore['drivers/DRV-001'] = { driverId: 'DRV-001', fullNameAr: 'السائق الأول' };
    inMemoryAdminStore['materials/MAT-001'] = { materialId: 'MAT-001', nameAr: 'بحص تجريبي' };

    const t = await context.getGlobalTruck('TRK-001');
    const c = await context.getGlobalCarrier('CAR-001');
    const d = await context.getGlobalDriver('DRV-001');
    const m = await context.getGlobalMaterial('MAT-001');

    expect(t?.plate).toBe('1234 ABC');
    expect(c?.nameAr).toBe('الناقل الأول');
    expect(d?.fullNameAr).toBe('السائق الأول');
    expect(m?.nameAr).toBe('بحص تجريبي');
  });

  it('11. End-to-end ProjectFleetReadModelService with AdminReadContext integration works flawlessly', async () => {
    // 1. Memberships
    inMemoryAdminStore[`projects/${projectId}/truck_memberships/TRK-001`] = {
      truckId: 'TRK-001',
      status: 'ACTIVE',
    };

    // 2. Affiliation
    inMemoryAdminStore[`projects/${projectId}/truck_carrier_affiliations/TRK-001`] = {
      projectId,
      truckId: 'TRK-001',
      carrierId: 'CAR-001',
      status: 'ACTIVE',
    };

    // 3. Driver assignment
    inMemoryAdminStore[`projects/${projectId}/truck_active_assignments/TRK-001`] = {
      assignmentId: 'ASN-001',
    };
    inMemoryAdminStore[`projects/${projectId}/driver_truck_assignments/ASN-001`] = {
      assignmentId: 'ASN-001',
      projectId,
      driverId: 'DRV-001',
      truckId: 'TRK-001',
      status: 'ACTIVE',
    };
    inMemoryAdminStore[`projects/${projectId}/driver_carrier_affiliations/DRV-001`] = {
      projectId,
      driverId: 'DRV-001',
      carrierId: 'CAR-001',
      status: 'ACTIVE',
    };

    // 4. Material Allocation
    inMemoryAdminStore[`projects/${projectId}/truck_active_material_allocations/TRK-001`] = {
      allocationId: 'ALC-001',
    };
    inMemoryAdminStore[`projects/${projectId}/truck_material_allocations/ALC-001`] = {
      allocationId: 'ALC-001',
      projectId,
      truckId: 'TRK-001',
      materialId: 'MAT-001',
      status: 'ACTIVE',
      effectiveTo: null,
    };

    // 5. Globals
    inMemoryAdminStore['trucks/TRK-001'] = { truckId: 'TRK-001', plate: '1234 ABC', truckType: 'TIPPER_32M3' };
    inMemoryAdminStore['carriers/CAR-001'] = { carrierId: 'CAR-001', nameAr: 'الناقل الأول' };
    inMemoryAdminStore['drivers/DRV-001'] = { driverId: 'DRV-001', fullNameAr: 'السائق الأول' };
    inMemoryAdminStore['materials/MAT-001'] = { materialId: 'MAT-001', nameAr: 'بحص تجريبي' };

    const response = await projectFleetReadModelService.getProjectFleetReadModel(projectId, context);

    expect(response.projectId).toBe(projectId);
    expect(response.truckCount).toBe(1);
    expect(response.rows).toHaveLength(1);

    const row = response.rows[0];
    expect(row.truckId).toBe('TRK-001');
    expect(row.plateNumber).toBe('1234 ABC');
    expect(row.carrierId).toBe('CAR-001');
    expect(row.carrierName).toBe('الناقل الأول');
    expect(row.driverId).toBe('DRV-001');
    expect(row.driverName).toBe('السائق الأول');
    expect(row.materialId).toBe('MAT-001');
    expect(row.materialName).toBe('بحص تجريبي');
    expect(row.integrityIssues).toHaveLength(0);
  });
});
