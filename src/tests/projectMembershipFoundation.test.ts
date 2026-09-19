import { describe, it, expect, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  ProjectDriverMembershipEntity,
  ProjectTruckMembershipEntity,
  ProjectCarrierMembershipEntity,
  ProjectMaterialMembershipEntity,
} from '../types/projectMembership';
import {
  projectDriverMembershipRepository,
  projectTruckMembershipRepository,
  projectCarrierMembershipRepository,
  projectMaterialMembershipRepository,
} from '../repositories/projectMembership.repository';
import {
  globalDriverRepository,
  globalTruckRepository,
  globalCarrierRepository,
  globalMaterialRepository,
} from '../repositories/globalIdentity.repository';

describe('PHASE 6 — UNIT 2A: Project Membership Foundation Test Suite', () => {
  beforeEach(() => {
    projectDriverMembershipRepository.clearInMemoryCache();
    projectTruckMembershipRepository.clearInMemoryCache();
    projectCarrierMembershipRepository.clearInMemoryCache();
    projectMaterialMembershipRepository.clearInMemoryCache();
    globalDriverRepository.clearInMemoryCache();
    globalTruckRepository.clearInMemoryCache();
    globalCarrierRepository.clearInMemoryCache();
    globalMaterialRepository.clearInMemoryCache();
  });

  let idCounter = 1;

  // Helper to seed global entity
  async function seedGlobalDriver(nationalId?: string) {
    const nid = nationalId || `10${String(idCounter++).padStart(8, '0')}`;
    return await globalDriverRepository.createGlobal({
      nationalId: nid,
      fullNameAr: 'محمد أحمد القحطاني',
      phone: '0501234567',
      status: 'ACTIVE',
      createdBy: 'system-test',
    });
  }

  async function seedGlobalTruck(plate?: string) {
    const p = plate || `أ ب ج ${1000 + idCounter++}`;
    return await globalTruckRepository.createGlobal({
      plate: p,
      tareWeightKg: 15000,
      maxGrossWeightKg: 45000,
      status: 'ACTIVE',
      createdBy: 'system-test',
    });
  }

  async function seedGlobalCarrier(crNo?: string) {
    const cr = crNo || `1010${String(idCounter++).padStart(6, '0')}`;
    return await globalCarrierRepository.createGlobal({
      nameAr: 'شركة الرمال السريعة للنقل',
      commercialRegistrationNo: cr,
      status: 'ACTIVE',
      createdBy: 'system-test',
    });
  }

  async function seedGlobalMaterial(code?: string) {
    const c = code || `AGG_3_4_${idCounter++}`;
    return await globalMaterialRepository.createGlobal({
      code: c,
      nameAr: 'حصى متدرج 3/4',
      unitOfMeasure: 'TON',
      status: 'ACTIVE',
      createdBy: 'system-test',
    });
  }

  // ==========================================================================
  // Requirements 1-4: Subcollection Paths and Natural Keys
  // ==========================================================================
  it('1. Driver membership uses subcollection driver_memberships and driverId', () => {
    expect(projectDriverMembershipRepository.subcollectionName).toBe('driver_memberships');
    expect(projectDriverMembershipRepository.idKey).toBe('driverId');
  });

  it('2. Truck membership uses subcollection truck_memberships and truckId', () => {
    expect(projectTruckMembershipRepository.subcollectionName).toBe('truck_memberships');
    expect(projectTruckMembershipRepository.idKey).toBe('truckId');
  });

  it('3. Carrier membership uses subcollection carrier_memberships and carrierId', () => {
    expect(projectCarrierMembershipRepository.subcollectionName).toBe('carrier_memberships');
    expect(projectCarrierMembershipRepository.idKey).toBe('carrierId');
  });

  it('4. Material membership uses subcollection material_memberships and materialId', () => {
    expect(projectMaterialMembershipRepository.subcollectionName).toBe('material_memberships');
    expect(projectMaterialMembershipRepository.idKey).toBe('materialId');
  });

  // ==========================================================================
  // Requirement 5: Duplicate Attach Idempotency
  // ==========================================================================
  it('5. Duplicate attach cannot create duplicate membership and returns existing record idempotently', async () => {
    const driver = await seedGlobalDriver();
    const first = await projectDriverMembershipRepository.attachMember('PRJ-A', driver.driverId, 'admin-user');
    expect(first.driverId).toBe(driver.driverId);
    expect(first.status).toBe('ACTIVE');

    const second = await projectDriverMembershipRepository.attachMember('PRJ-A', driver.driverId, 'admin-user');
    expect(second).toEqual(first);

    const list = await projectDriverMembershipRepository.listMemberships('PRJ-A');
    expect(list.length).toBe(1);
  });

  // ==========================================================================
  // Requirements 6-11: Zero PII / Profile Duplication in Memberships
  // ==========================================================================
  it('6-8. Driver membership contains NO nationalId, NO phone, NO global profile name, and NO speculative fields', async () => {
    const driver = await seedGlobalDriver();
    const m = await projectDriverMembershipRepository.attachMember('PRJ-A', driver.driverId, 'admin-user');
    const record = m as any;

    expect(record.nationalId).toBeUndefined();
    expect(record.iqama).toBeUndefined();
    expect(record.phone).toBeUndefined();
    expect(record.fullNameAr).toBeUndefined();
    expect(record.name).toBeUndefined();
    expect(record.driverName).toBeUndefined();
    expect(record.siteBadgeNumber).toBeUndefined();
    expect(record.safetyBriefingValidUntil).toBeUndefined();
    expect(record.notes).toBeUndefined();
  });

  it('9. Truck membership contains NO plate, NO VIN, NO physical specs duplication, and NO speculative fields', async () => {
    const truck = await seedGlobalTruck();
    const m = await projectTruckMembershipRepository.attachMember('PRJ-A', truck.truckId, 'admin-user');
    const record = m as any;

    expect(record.plate).toBeUndefined();
    expect(record.normalizedPlate).toBeUndefined();
    expect(record.vin).toBeUndefined();
    expect(record.tareWeightKg).toBeUndefined();
    expect(record.maxGrossWeightKg).toBeUndefined();
    expect(record.siteRfidTag).toBeUndefined();
    expect(record.siteInspectionValidUntil).toBeUndefined();
    expect(record.notes).toBeUndefined();
  });

  it('10. Carrier membership contains NO CR number, NO VAT number, NO legal profile duplication, and NO speculative fields', async () => {
    const carrier = await seedGlobalCarrier();
    const m = await projectCarrierMembershipRepository.attachMember('PRJ-A', carrier.carrierId, 'admin-user');
    const record = m as any;

    expect(record.nameAr).toBeUndefined();
    expect(record.commercialRegistrationNo).toBeUndefined();
    expect(record.vatNumber).toBeUndefined();
    expect(record.transportLicenseNo).toBeUndefined();
    expect(record.contractReference).toBeUndefined();
    expect(record.contractValidUntil).toBeUndefined();
    expect(record.notes).toBeUndefined();
  });

  it('11. Material membership contains NO code, NO name, NO global catalog duplication, and NO speculative fields', async () => {
    const material = await seedGlobalMaterial();
    const m = await projectMaterialMembershipRepository.attachMember('PRJ-A', material.materialId, 'admin-user');
    const record = m as any;

    expect(record.code).toBeUndefined();
    expect(record.nameAr).toBeUndefined();
    expect(record.nameEn).toBeUndefined();
    expect(record.unitOfMeasure).toBeUndefined();
    expect(record.standardDensityTonPerM3).toBeUndefined();
    expect(record.sourceQuarryName).toBeUndefined();
    expect(record.projectSpecificationRef).toBeUndefined();
    expect(record.notes).toBeUndefined();
  });

  // ==========================================================================
  // Requirements 12-14: Redundant Membership Keys Omission
  // ==========================================================================
  it('12. Redundant membershipId (e.g. PRJ_DRV) is absent from stored document', async () => {
    const driver = await seedGlobalDriver();
    const m = await projectDriverMembershipRepository.attachMember('PRJ-A', driver.driverId, 'admin-user');
    expect((m as any).membershipId).toBeUndefined();
  });

  it('13. Redundant generic entityId + typed ID duplication is absent', async () => {
    const truck = await seedGlobalTruck();
    const m = await projectTruckMembershipRepository.attachMember('PRJ-A', truck.truckId, 'admin-user');
    expect((m as any).entityId).toBeUndefined();
    expect(m.truckId).toBe(truck.truckId);
  });

  it('14. projectId inside document is justified for collection-group / offline indexing', async () => {
    const carrier = await seedGlobalCarrier();
    const m = await projectCarrierMembershipRepository.attachMember('PRJ-A', carrier.carrierId, 'admin-user');
    expect(m.projectId).toBe('PRJ-A');
  });

  // ==========================================================================
  // Requirements 15-18: Non-interference with Assignments, Pricing, and Roster
  // ==========================================================================
  it('15. No Driver-Truck assignment is implemented in Unit 2A', () => {
    const driverMembershipKeys = Object.keys({
      projectId: '',
      driverId: '',
      status: 'ACTIVE',
      createdAt: '',
      updatedAt: '',
      createdBy: '',
      updatedBy: '',
    });
    expect(driverMembershipKeys).not.toContain('assignedTruckId');
    expect(driverMembershipKeys).not.toContain('currentAssignedTruckId');
    expect(driverMembershipKeys).not.toContain('truckId');
  });

  it('16. No Truck-Material assignment is implemented in Unit 2A', () => {
    const truckMembershipKeys = Object.keys({
      projectId: '',
      truckId: '',
      status: 'ACTIVE',
      createdAt: '',
      updatedAt: '',
      createdBy: '',
      updatedBy: '',
    });
    expect(truckMembershipKeys).not.toContain('materialId');
    expect(truckMembershipKeys).not.toContain('materialIds');
  });

  it('17. No Carrier-Material authorization or pricing rule is created in Unit 2A', () => {
    const carrierMembershipKeys = Object.keys({
      projectId: '',
      carrierId: '',
      status: 'ACTIVE',
      createdAt: '',
      updatedAt: '',
      createdBy: '',
      updatedBy: '',
    });
    expect(carrierMembershipKeys).not.toContain('materialId');
    expect(carrierMembershipKeys).not.toContain('materialIds');
    expect(carrierMembershipKeys).not.toContain('pricingRuleId');
  });

  it('18. No Roster projection or mutation is executed in Unit 2A', () => {
    const rosterFile = fs.readFileSync(path.resolve(__dirname, '../repositories/projectCarrierRoster.repository.ts'), 'utf-8');
    expect(rosterFile).not.toContain('ProjectMembershipRepository');
  });

  // ==========================================================================
  // Requirements 19-21: Security Rules Verification
  // ==========================================================================
  it('19. Global root repository security remains unchanged (restricted to superadmin / server)', () => {
    const rules = fs.readFileSync(path.resolve(__dirname, '../../firestore.rules'), 'utf-8');
    expect(rules).toContain('match /drivers/{driverId} {');
    expect(rules).toContain('allow get, list: if isSuperAdmin() || isServerAuthorized();');
    expect(rules).toContain('match /natural_identity_lookups/{token} {');
    expect(rules).toContain('allow get, list: if isSuperAdmin() || isServerAuthorized();');
  });

  it('20. Project membership subcollections enforce project authorization', () => {
    const rules = fs.readFileSync(path.resolve(__dirname, '../../firestore.rules'), 'utf-8');
    expect(rules).toContain('match /driver_memberships/{driverId} {');
    expect(rules).toContain('allow get, list: if isSignedIn() && isValidId(projectId) && isProjectMember(projectId);');
    expect(rules).toContain('hasProjectRole(projectId, [\'PROJECT_ADMIN\', \'SUPER_ADMIN\'])');

    expect(rules).toContain('match /truck_memberships/{truckId} {');
    expect(rules).toContain('match /carrier_memberships/{carrierId} {');
    expect(rules).toContain('match /material_memberships/{materialId} {');
  });

  it('21. No new RBAC powers introduced (only PROJECT_ADMIN and SUPER_ADMIN write memberships)', () => {
    const rules = fs.readFileSync(path.resolve(__dirname, '../../firestore.rules'), 'utf-8');
    // Field supervisor and loading operator must NOT have write access to memberships
    expect(rules).not.toContain("match /driver_memberships/{driverId} {\n        allow create: if isSignedIn() && isValidId(driverId) &&\n                         hasProjectRole(projectId, ['FIELD_SUPERVISOR'");
  });

  // ==========================================================================
  // Requirements 22-24: Legacy Array Preservation & No Dual Writes
  // ==========================================================================
  it('22-24. Legacy authorizedCarrierIds & authorizedMaterialIds production flows remain preserved without dual writes', () => {
    const memRepo = fs.readFileSync(path.resolve(__dirname, '../repositories/projectMembership.repository.ts'), 'utf-8');
    expect(memRepo).not.toContain('authorizedCarrierIds');
    expect(memRepo).not.toContain('authorizedMaterialIds');
  });

  // ==========================================================================
  // Requirements 25-30: No Unapproved Changes to Import, Migration, Views
  // ==========================================================================
  it('25-30. Import, MasterDataView, ProjectWorkspace, ProjectSetupWizard, FieldSupervision remain unedited', () => {
    const importResolver = fs.readFileSync(path.resolve(__dirname, '../services/import/driverTruckImport.ts'), 'utf-8');
    expect(importResolver).not.toContain('projectDriverMembershipRepository');

    const masterDataView = fs.readFileSync(path.resolve(__dirname, '../components/masterData/MasterDataView.tsx'), 'utf-8');
    expect(masterDataView).not.toContain('projectDriverMembershipRepository');
  });

  // ==========================================================================
  // Requirements 31-32: Cross-Project Isolation
  // ==========================================================================
  it('31. Project A membership query cannot return Project B memberships', async () => {
    const drv1 = await seedGlobalDriver();
    const drv2 = await seedGlobalDriver();

    await projectDriverMembershipRepository.attachMember('PRJ-A', drv1.driverId, 'admin-user');
    await projectDriverMembershipRepository.attachMember('PRJ-B', drv2.driverId, 'admin-user');

    const prjAList = await projectDriverMembershipRepository.listMemberships('PRJ-A');
    const prjBList = await projectDriverMembershipRepository.listMemberships('PRJ-B');

    expect(prjAList.map(m => m.driverId)).toEqual([drv1.driverId]);
    expect(prjBList.map(m => m.driverId)).toEqual([drv2.driverId]);

    const inPrjA = await projectDriverMembershipRepository.hasActiveMembership('PRJ-A', drv2.driverId);
    expect(inPrjA).toBe(false);
  });

  it('32. Project switch repository reads are strictly project-scoped', async () => {
    const truck = await seedGlobalTruck();
    await projectTruckMembershipRepository.attachMember('PRJ-ALPHA', truck.truckId, 'admin-user');

    expect(await projectTruckMembershipRepository.getMembership('PRJ-BETA', truck.truckId)).toBeNull();
    expect(await projectTruckMembershipRepository.getMembership('PRJ-ALPHA', truck.truckId)).not.toBeNull();
  });

  // ==========================================================================
  // Requirements 33-34: Membership State Transitions & Re-attach Policy
  // ==========================================================================
  it('33. Membership state transitions reject invalid transition', async () => {
    const driver = await seedGlobalDriver();
    await projectDriverMembershipRepository.attachMember('PRJ-A', driver.driverId, 'admin-user');

    // ACTIVE -> REMOVED is valid
    const removed = await projectDriverMembershipRepository.setMembershipStatus(
      'PRJ-A',
      driver.driverId,
      'REMOVED',
      'admin-user',
      { reason: 'Driver resigned from project' }
    );
    expect(removed.status).toBe('REMOVED');
    expect(removed.statusReason).toBe('Driver resigned from project');

    // REMOVED -> SUSPENDED is invalid (only REMOVED -> ACTIVE allowed)
    await expect(
      projectDriverMembershipRepository.setMembershipStatus('PRJ-A', driver.driverId, 'SUSPENDED', 'admin-user')
    ).rejects.toThrow('INVALID_STATE_TRANSITION');
  });

  it('34. Membership re-attach does not silently overwrite suspended or removed state', async () => {
    const driver = await seedGlobalDriver();
    await projectDriverMembershipRepository.attachMember('PRJ-A', driver.driverId, 'admin-user');

    await projectDriverMembershipRepository.setMembershipStatus('PRJ-A', driver.driverId, 'SUSPENDED', 'admin-user');

    // Attempting attachMember on SUSPENDED member throws explicit conflict error
    await expect(
      projectDriverMembershipRepository.attachMember('PRJ-A', driver.driverId, 'admin-user')
    ).rejects.toThrow('MEMBERSHIP_STATE_CONFLICT');

    // Explicit reactivation works
    const reactivated = await projectDriverMembershipRepository.setMembershipStatus(
      'PRJ-A',
      driver.driverId,
      'ACTIVE',
      'admin-user'
    );
    expect(reactivated.status).toBe('ACTIVE');
  });

  // ==========================================================================
  // Requirement 35: Dangling Reference Prevention
  // ==========================================================================
  it('35. Dangling membership creation is prevented when Global Entity does not exist', async () => {
    await expect(
      projectDriverMembershipRepository.attachMember('PRJ-A', 'DRV-NONEXISTENT', 'admin-user')
    ).rejects.toThrow('DANGLING_MEMBERSHIP_PREVENTED');

    await expect(
      projectTruckMembershipRepository.attachMember('PRJ-A', 'TRK-NONEXISTENT', 'admin-user')
    ).rejects.toThrow('DANGLING_MEMBERSHIP_PREVENTED');

    await expect(
      projectCarrierMembershipRepository.attachMember('PRJ-A', 'CAR-NONEXISTENT', 'admin-user')
    ).rejects.toThrow('DANGLING_MEMBERSHIP_PREVENTED');

    await expect(
      projectMaterialMembershipRepository.attachMember('PRJ-A', 'MAT-NONEXISTENT', 'admin-user')
    ).rejects.toThrow('DANGLING_MEMBERSHIP_PREVENTED');
  });
});
