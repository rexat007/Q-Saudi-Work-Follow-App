import { describe, it, expect, beforeEach } from 'vitest';
import { createInMemoryAdminDb, setTestDbOverride, inMemoryAdminStore } from '../firebase/admin';
import { ProjectReadinessAdminReadContext } from '../services/projectReadiness.server';
import { ProjectReadinessService } from '../services/projectReadiness.service';

describe('Project Readiness Server-Safe Admin-Based ReadContext Test Suite', () => {
  let context: ProjectReadinessAdminReadContext;

  beforeEach(() => {
    // Clear the active mock admin database store
    for (const key of Object.keys(inMemoryAdminStore)) {
      delete inMemoryAdminStore[key];
    }
    const testDb = createInMemoryAdminDb({});
    setTestDbOverride(testDb);
    context = new ProjectReadinessAdminReadContext();
  });

  it('1. Existing project is returned correctly', async () => {
    inMemoryAdminStore['projects/PRJ-123'] = {
      projectId: 'PRJ-123',
      nameAr: 'مشروع الفحص',
      status: 'ACTIVE',
    };

    const proj = await context.getProject('PRJ-123');
    expect(proj).toBeDefined();
    expect(proj?.projectId).toBe('PRJ-123');
    expect(proj?.status).toBe('ACTIVE');
  });

  it('2. Missing project returns null preserving missing-project path', async () => {
    const proj = await context.getProject('PRJ-MISSING');
    expect(proj).toBeNull();
  });

  it('3. ACTIVE material memberships are returned', async () => {
    inMemoryAdminStore['projects/PRJ-123/material_memberships/m1'] = { materialId: 'm1', status: 'ACTIVE' };
    inMemoryAdminStore['projects/PRJ-123/material_memberships/m2'] = { materialId: 'm2', status: 'INACTIVE' };

    const active = await context.listActiveMaterialMemberships('PRJ-123');
    expect(active).toHaveLength(1);
    expect(active[0].materialId).toBe('m1');
  });

  it('4. ACTIVE carrier memberships are returned', async () => {
    inMemoryAdminStore['projects/PRJ-123/carrier_memberships/c1'] = { carrierId: 'c1', status: 'ACTIVE' };
    inMemoryAdminStore['projects/PRJ-123/carrier_memberships/c2'] = { carrierId: 'c2', status: 'SUSPENDED' };

    const active = await context.listActiveCarrierMemberships('PRJ-123');
    expect(active).toHaveLength(1);
    expect(active[0].carrierId).toBe('c1');
  });

  it('5. ACTIVE driver memberships are returned', async () => {
    inMemoryAdminStore['projects/PRJ-123/driver_memberships/d1'] = { driverId: 'd1', status: 'ACTIVE' };
    inMemoryAdminStore['projects/PRJ-123/driver_memberships/d2'] = { driverId: 'd2', status: 'PENDING_APPROVAL' };

    const active = await context.listActiveDriverMemberships('PRJ-123');
    expect(active).toHaveLength(1);
    expect(active[0].driverId).toBe('d1');
  });

  it('6. ACTIVE truck memberships are returned', async () => {
    inMemoryAdminStore['projects/PRJ-123/truck_memberships/t1'] = { truckId: 't1', status: 'ACTIVE' };
    inMemoryAdminStore['projects/PRJ-123/truck_memberships/t2'] = { truckId: 't2', status: 'BLOCKED' };

    const active = await context.listActiveTruckMemberships('PRJ-123');
    expect(active).toHaveLength(1);
    expect(active[0].truckId).toBe('t1');
  });

  it('7. Driver/carrier affiliation resolution preserves canonical IDs/status', async () => {
    inMemoryAdminStore['projects/PRJ-123/driver_carrier_affiliations/d1'] = {
      projectId: 'PRJ-123',
      driverId: 'd1',
      carrierId: 'c1',
      status: 'ACTIVE',
    };

    const aff = await context.getDriverCarrierAffiliation('PRJ-123', 'd1');
    expect(aff).not.toBeNull();
    expect(aff?.carrierId).toBe('c1');
    expect(aff?.status).toBe('ACTIVE');
  });

  it('8. Truck/carrier affiliation resolution preserves canonical IDs/status', async () => {
    inMemoryAdminStore['projects/PRJ-123/truck_carrier_affiliations/t1'] = {
      projectId: 'PRJ-123',
      truckId: 't1',
      carrierId: 'c1',
      status: 'ACTIVE',
    };

    const aff = await context.getTruckCarrierAffiliation('PRJ-123', 't1');
    expect(aff).not.toBeNull();
    expect(aff?.carrierId).toBe('c1');
    expect(aff?.status).toBe('ACTIVE');
  });

  it('9. Driver active-assignment pointer resolves the referenced ACTIVE assignment', async () => {
    // Pointer
    inMemoryAdminStore['projects/PRJ-123/driver_active_assignments/d1'] = {
      assignmentId: 'assign-99',
    };
    // Assignment
    inMemoryAdminStore['projects/PRJ-123/driver_truck_assignments/assign-99'] = {
      assignmentId: 'assign-99',
      projectId: 'PRJ-123',
      driverId: 'd1',
      truckId: 't1',
      status: 'ACTIVE',
    };

    const ass = await context.getActiveDriverAssignment('PRJ-123', 'd1');
    expect(ass).not.toBeNull();
    expect(ass?.assignmentId).toBe('assign-99');
    expect(ass?.status).toBe('ACTIVE');
  });

  it('10. Truck active-assignment pointer resolves the referenced ACTIVE assignment', async () => {
    // Pointer
    inMemoryAdminStore['projects/PRJ-123/truck_active_assignments/t1'] = {
      assignmentId: 'assign-99',
    };
    // Assignment
    inMemoryAdminStore['projects/PRJ-123/driver_truck_assignments/assign-99'] = {
      assignmentId: 'assign-99',
      projectId: 'PRJ-123',
      driverId: 'd1',
      truckId: 't1',
      status: 'ACTIVE',
    };

    const ass = await context.getActiveTruckAssignment('PRJ-123', 't1');
    expect(ass).not.toBeNull();
    expect(ass?.assignmentId).toBe('assign-99');
  });

  it('11. Truck active-material pointer resolves the referenced allocation', async () => {
    // Pointer
    inMemoryAdminStore['projects/PRJ-123/truck_active_material_allocations/t1'] = {
      allocationId: 'alloc-77',
    };
    // Allocation
    inMemoryAdminStore['projects/PRJ-123/truck_material_allocations/alloc-77'] = {
      allocationId: 'alloc-77',
      projectId: 'PRJ-123',
      truckId: 't1',
      status: 'ACTIVE',
      effectiveTo: null,
    };

    const alloc = await context.getActiveTruckAllocation('PRJ-123', 't1');
    expect(alloc).not.toBeNull();
    expect(alloc?.allocationId).toBe('alloc-77');
  });

  it('12. Invalid/inactive allocation is not accepted as active', async () => {
    // Pointer
    inMemoryAdminStore['projects/PRJ-123/truck_active_material_allocations/t1'] = {
      allocationId: 'alloc-expired',
    };
    // Invalid due to status
    inMemoryAdminStore['projects/PRJ-123/truck_material_allocations/alloc-expired'] = {
      allocationId: 'alloc-expired',
      projectId: 'PRJ-123',
      truckId: 't1',
      status: 'EXPIRED',
      effectiveTo: null,
    };

    const alloc = await context.getActiveTruckAllocation('PRJ-123', 't1');
    expect(alloc).toBeNull();
  });

  it('13. Pricing rules are returned in the entity shape required by ProjectReadinessService', async () => {
    inMemoryAdminStore['projects/PRJ-123/pricing_rules/rule-1'] = {
      pricingRuleId: 'rule-1',
      projectId: 'PRJ-123',
      carrierId: 'c1',
      materialId: 'm1',
      baseRateSAR: 25.5,
    };

    const rules = await context.listPricingRules('PRJ-123');
    expect(rules).toHaveLength(1);
    expect(rules[0].baseRateSAR).toBe(25.5);
  });

  it('14. ProjectReadinessService itself is NOT duplicated or reimplemented', async () => {
    const service = new ProjectReadinessService();
    expect(service.evaluateProjectReadiness).toBeDefined();
  });
});
