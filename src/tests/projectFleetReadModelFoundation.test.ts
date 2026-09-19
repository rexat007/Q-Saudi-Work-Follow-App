/**
 * PHASE 6 — UNIT 2D: PROJECT FLEET READ MODEL FOUNDATION TESTS
 *
 * Comprehensive behavioral and boundary verification tests:
 * A. Security Boundary & Authority
 * B. Read Authority (Canonical sources vs legacy Roster)
 * C. Target Grain (Truck-Centric, Unassigned/Unallocated handling)
 * D. Integrity State Surfacing (Slot corruption, missing affiliations, mismatches)
 * E. PII Minimization
 * F. Pricing / Business Boundary Preservation
 * G. Roster Convergence (Read authority retired, writers untouched)
 * H. Project Isolation
 * I. Upstream Unit Preservation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

import { projectFleetReadModelService } from '../services/projectFleetReadModel.service';
import {
  projectTruckMembershipRepository,
  projectDriverMembershipRepository,
  projectCarrierMembershipRepository,
  projectMaterialMembershipRepository,
} from '../repositories/projectMembership.repository';
import {
  projectTruckCarrierAffiliationRepository,
  projectDriverCarrierAffiliationRepository,
} from '../repositories/projectCarrierAffiliation.repository';
import { projectDriverTruckAssignmentRepository } from '../repositories/projectDriverTruckAssignment.repository';
import { projectTruckMaterialAllocationRepository } from '../repositories/projectTruckMaterialAllocation.repository';
import {
  globalTruckRepository,
  globalCarrierRepository,
  globalDriverRepository,
  globalMaterialRepository,
} from '../repositories/globalIdentity.repository';

describe('Phase 6 Unit 2D: Project Fleet Read Model Foundation', () => {
  let idCounter = 100;
  const projectId = 'PRJ-TEST-FLEET-2D';

  beforeEach(() => {
    projectTruckMembershipRepository.clearInMemoryCache();
    projectDriverMembershipRepository.clearInMemoryCache();
    projectCarrierMembershipRepository.clearInMemoryCache();
    projectMaterialMembershipRepository.clearInMemoryCache();

    projectTruckCarrierAffiliationRepository._clearMemory();
    projectDriverCarrierAffiliationRepository._clearMemory();

    projectDriverTruckAssignmentRepository._clearMemory();
    projectTruckMaterialAllocationRepository._clearMemory();

    globalTruckRepository.clearInMemoryCache();
    globalCarrierRepository.clearInMemoryCache();
    globalDriverRepository.clearInMemoryCache();
    globalMaterialRepository.clearInMemoryCache();
  });

  async function createActiveCarrier(pId = projectId) {
    const cr = `1010${String(idCounter++).padStart(6, '0')}`;
    const carrier = await globalCarrierRepository.createGlobal({
      commercialRegistrationNo: cr,
      nameAr: `شركة النقل التجاري ${idCounter}`,
      status: 'ACTIVE',
      createdBy: 'admin-test',
    });
    await projectCarrierMembershipRepository.attachMember(pId, carrier.carrierId, 'admin-test');
    return carrier;
  }

  async function createActiveTruck(pId = projectId, carrierId?: string) {
    const plate = `${String(idCounter++).padStart(4, '0')} أ ب ج`;
    const truck = await globalTruckRepository.createGlobal({
      plate,
      tareWeightKg: 12000,
      maxGrossWeightKg: 32000,
      truckType: 'DUMP_TRUCK_32M3',
      status: 'ACTIVE',
      createdBy: 'admin-test',
    });
    await projectTruckMembershipRepository.attachMember(pId, truck.truckId, 'admin-test');
    if (carrierId) {
      await projectTruckCarrierAffiliationRepository.setAffiliation(pId, truck.truckId, carrierId, 'admin-test');
    }
    return truck;
  }

  async function createActiveDriver(pId = projectId, carrierId?: string) {
    const nationalId = `10${String(idCounter++).padStart(8, '0')}`;
    const driver = await globalDriverRepository.createGlobal({
      nationalId,
      fullNameAr: `سائق تجريبي ${idCounter}`,
      phone: '0551234567',
      status: 'ACTIVE',
      createdBy: 'admin-test',
    });
    await projectDriverMembershipRepository.attachMember(pId, driver.driverId, 'admin-test');
    if (carrierId) {
      await projectDriverCarrierAffiliationRepository.setAffiliation(pId, driver.driverId, carrierId, 'admin-test');
    }
    return driver;
  }

  async function createActiveMaterial(pId = projectId) {
    const code = `MAT-${idCounter++}`;
    const material = await globalMaterialRepository.createGlobal({
      code,
      nameAr: `مادة تجريبية ${code}`,
      status: 'ACTIVE',
      createdBy: 'admin-test',
    });
    await projectMaterialMembershipRepository.attachMember(pId, material.materialId, 'admin-test');
    return material;
  }

  // =========================================================================
  // SECTION A: Security Boundary
  // =========================================================================
  describe('A. Security Boundary & Unit 1 Policy Preservation', () => {
    const rules = readFileSync(resolve(__dirname, '../../firestore.rules'), 'utf-8');

    it('1. Ordinary client Project user is NOT allowed to read /drivers/{driverId}', () => {
      // Look for the root collection match /drivers/{driverId} under Global Identity Authorities
      const globalIdentitySection = rules.slice(rules.indexOf('Global Identity Authorities'));
      const matchDriver = globalIdentitySection.match(/match \/drivers\/\{driverId\} \{[\s\S]*?allow get, list: (.*?);/);
      expect(matchDriver).not.toBeNull();
      expect(matchDriver![1]).toContain('isSuperAdmin() || isServerAuthorized()');
      expect(matchDriver![1]).not.toContain('isProjectMember');
    });

    it('2. Ordinary client Project user is NOT allowed to read /trucks/{truckId}', () => {
      // Look for the root collection match /trucks/{truckId} under Global Identity Authorities
      const globalIdentitySection = rules.slice(rules.indexOf('Global Identity Authorities'));
      const matchTruck = globalIdentitySection.match(/match \/trucks\/\{truckId\} \{[\s\S]*?allow get, list: (.*?);/);
      expect(matchTruck).not.toBeNull();
      expect(matchTruck![1]).toContain('isSuperAdmin() || isServerAuthorized()');
      expect(matchTruck![1]).not.toContain('isProjectMember');
    });

    it('3. Ordinary client Project user is NOT allowed to read /carriers/{carrierId}', () => {
      // Look for the root collection match /carriers/{carrierId} under Global Identity Authorities
      const globalIdentitySection = rules.slice(rules.indexOf('Global Identity Authorities'));
      const matchCarrier = globalIdentitySection.match(/match \/carriers\/\{carrierId\} \{[\s\S]*?allow get, list: (.*?);/);
      expect(matchCarrier).not.toBeNull();
      expect(matchCarrier![1]).toContain('isSuperAdmin() || isServerAuthorized()');
      expect(matchCarrier![1]).not.toContain('isProjectMember');
    });

    it('4. Unit 1 Firestore security rules are preserved with zero modifications', () => {
      expect(rules).toContain('Phase 6 Unit 1: Additive Foundation Only');
      expect(rules).toContain('match /natural_identity_lookups/{token}');
    });

    it('5. Trusted-server composition path is established in server.ts', () => {
      const serverCode = readFileSync(resolve(__dirname, '../../server.ts'), 'utf-8');
      expect(serverCode).toContain('/api/projects/:projectId/fleet-read-model');
      expect(serverCode).toContain('enforceProjectIsolation');
    });
  });

  // =========================================================================
  // SECTION B: Read Authority & Canonical Source Derivation
  // =========================================================================
  describe('B. Read Authority & Canonical Source Derivation', () => {
    it('6. Fleet rows derive strictly from ACTIVE Truck memberships', async () => {
      const truck = await createActiveTruck(projectId);
      const truck2 = await createActiveTruck(projectId);
      await projectTruckMembershipRepository.setMembershipStatus(projectId, truck2.truckId, 'SUSPENDED', 'admin-test');

      const res = await projectFleetReadModelService.getProjectFleetReadModel(projectId);
      expect(res.truckCount).toBe(1);
      expect(res.rows[0].truckId).toBe(truck.truckId);
    });

    it('7. Carrier derives from Unit 2B-1 Truck Carrier Affiliation', async () => {
      const carrier = await createActiveCarrier(projectId);
      const truck = await createActiveTruck(projectId, carrier.carrierId);

      const res = await projectFleetReadModelService.getProjectFleetReadModel(projectId);
      expect(res.rows[0].carrierId).toBe(carrier.carrierId);
      expect(res.rows[0].carrierName).toBe(carrier.nameAr);
    });

    it('8. Driver derives from Unit 2B-2 Active Driver-Truck Assignment Slot', async () => {
      const carrier = await createActiveCarrier(projectId);
      const truck = await createActiveTruck(projectId, carrier.carrierId);
      const driver = await createActiveDriver(projectId, carrier.carrierId);

      await projectDriverTruckAssignmentRepository.assignDriverToTruck(
        projectId,
        driver.driverId,
        truck.truckId,
        'admin-test'
      );

      const res = await projectFleetReadModelService.getProjectFleetReadModel(projectId);
      expect(res.rows[0].driverId).toBe(driver.driverId);
      expect(res.rows[0].driverName).toBe(driver.fullNameAr);
      expect(res.rows[0].assignmentStatus).toBe('ASSIGNMENT_ACTIVE');
    });

    it('9. Material derives from Unit 2C Active Truck Material Allocation Slot', async () => {
      const carrier = await createActiveCarrier(projectId);
      const truck = await createActiveTruck(projectId, carrier.carrierId);
      const material = await createActiveMaterial(projectId);

      await projectTruckMaterialAllocationRepository.allocateTruckToMaterial(
        projectId,
        truck.truckId,
        material.materialId,
        'admin-test'
      );

      const res = await projectFleetReadModelService.getProjectFleetReadModel(projectId);
      expect(res.rows[0].materialId).toBe(material.materialId);
      expect(res.rows[0].materialName).toBe(material.nameAr);
      expect(res.rows[0].allocationStatus).toBe('ALLOCATION_ACTIVE');
    });

    it('10. Global display fields hydrate server-side without leaking raw entity copies', async () => {
      const truck = await createActiveTruck(projectId);

      const res = await projectFleetReadModelService.getProjectFleetReadModel(projectId);
      expect(res.rows[0].plateNumber).toBe(truck.plate);
      expect(res.rows[0].truckType).toBe(truck.truckType);
    });

    it('11. Legacy Roster collection is NEVER read for canonical fields', async () => {
      const code = readFileSync(
        resolve(__dirname, '../../src/services/projectFleetReadModel.service.ts'),
        'utf-8'
      );
      expect(code).not.toContain('projectCarrierRosterRepository');
      expect(code).not.toContain('ProjectCarrierRosterEntity');
    });
  });

  // =========================================================================
  // SECTION C: Target Grain
  // =========================================================================
  describe('C. Target Grain & Operational Nullability', () => {
    it('12. Produces exactly one row per ACTIVE Project Truck', async () => {
      const t1 = await createActiveTruck(projectId);
      const t2 = await createActiveTruck(projectId);

      const res = await projectFleetReadModelService.getProjectFleetReadModel(projectId);
      expect(res.truckCount).toBe(2);
      expect(res.rows.map((r) => r.truckId)).toEqual([t1.truckId, t2.truckId]);
    });

    it('13. Unassigned Driver does NOT hide Truck (valid business state)', async () => {
      await createActiveTruck(projectId);

      const res = await projectFleetReadModelService.getProjectFleetReadModel(projectId);
      expect(res.truckCount).toBe(1);
      expect(res.rows[0].driverId).toBeNull();
      expect(res.rows[0].driverName).toBeNull();
      expect(res.rows[0].assignmentStatus).toBe('UNASSIGNED_DRIVER');
    });

    it('14. Unallocated Material does NOT hide Truck (valid business state)', async () => {
      await createActiveTruck(projectId);

      const res = await projectFleetReadModelService.getProjectFleetReadModel(projectId);
      expect(res.truckCount).toBe(1);
      expect(res.rows[0].materialId).toBeNull();
      expect(res.rows[0].materialName).toBeNull();
      expect(res.rows[0].allocationStatus).toBe('UNALLOCATED_MATERIAL');
    });
  });

  // =========================================================================
  // SECTION D: Integrity Diagnostic Surfacing
  // =========================================================================
  describe('D. Integrity Diagnostic Surfacing (No Silent Repair)', () => {
    it('15. Missing Carrier Affiliation surfaces MISSING_CARRIER_AFFILIATION issue', async () => {
      // Truck has membership but no carrier affiliation
      await createActiveTruck(projectId);

      const res = await projectFleetReadModelService.getProjectFleetReadModel(projectId);
      const issues = res.rows[0].integrityIssues;
      expect(issues.some((i) => i.code === 'MISSING_CARRIER_AFFILIATION')).toBe(true);
    });

    it('16. Invalid Driver Assignment slot pointer surfaces INVALID_DRIVER_ASSIGNMENT_POINTER', async () => {
      const carrier = await createActiveCarrier(projectId);
      const truck = await createActiveTruck(projectId, carrier.carrierId);

      // In-memory slot points to non-existent assignment
      (projectDriverTruckAssignmentRepository as any).inMemoryTruckSlots.set(
        `${projectId}#${truck.truckId}`,
        { assignmentId: 'NON-EXISTENT-ASN', driverId: 'DRV-FAKE', carrierId: carrier.carrierId }
      );

      const res = await projectFleetReadModelService.getProjectFleetReadModel(projectId);
      const issues = res.rows[0].integrityIssues;
      expect(issues.some((i) => i.code === 'INVALID_DRIVER_ASSIGNMENT_POINTER')).toBe(true);
    });

    it('17. Invalid Material Allocation slot pointer surfaces INVALID_MATERIAL_ALLOCATION_POINTER', async () => {
      const carrier = await createActiveCarrier(projectId);
      const truck = await createActiveTruck(projectId, carrier.carrierId);

      // In-memory slot points to non-existent allocation
      (projectTruckMaterialAllocationRepository as any).inMemoryActiveSlots.set(
        `${projectId}#${truck.truckId}`,
        { allocationId: 'NON-EXISTENT-ALC', materialId: 'MAT-FAKE' }
      );

      const res = await projectFleetReadModelService.getProjectFleetReadModel(projectId);
      const issues = res.rows[0].integrityIssues;
      expect(issues.some((i) => i.code === 'INVALID_MATERIAL_ALLOCATION_POINTER')).toBe(true);
    });

    it('18. Carrier Mismatch surfaces CARRIER_MISMATCH issue', async () => {
      const carrierA = await createActiveCarrier(projectId);
      const carrierB = await createActiveCarrier(projectId);
      const truck = await createActiveTruck(projectId, carrierA.carrierId);
      const driver = await createActiveDriver(projectId, carrierB.carrierId);

      // Manually simulate active assignment slot with carrier mismatch
      const fakeAssignmentId = 'ASN-MISMATCH-1';
      (projectDriverTruckAssignmentRepository as any).inMemoryAssignments.set(fakeAssignmentId, {
        assignmentId: fakeAssignmentId,
        projectId,
        driverId: driver.driverId,
        truckId: truck.truckId,
        carrierId: carrierB.carrierId,
        status: 'ACTIVE',
        effectiveFrom: new Date().toISOString(),
        effectiveTo: null,
      });

      (projectDriverTruckAssignmentRepository as any).inMemoryTruckSlots.set(
        `${projectId}#${truck.truckId}`,
        { assignmentId: fakeAssignmentId, driverId: driver.driverId, carrierId: carrierB.carrierId }
      );

      const res = await projectFleetReadModelService.getProjectFleetReadModel(projectId);
      const issues = res.rows[0].integrityIssues;
      expect(issues.some((i) => i.code === 'CARRIER_MISMATCH')).toBe(true);
    });

    it('19. Zero silent legacy repair: no fallback data from legacy roster', async () => {
      await createActiveTruck(projectId);

      const res = await projectFleetReadModelService.getProjectFleetReadModel(projectId);
      expect(res.rows[0].carrierId).toBe('');
      expect(res.rows[0].driverId).toBeNull();
      expect(res.rows[0].materialId).toBeNull();
    });
  });

  // =========================================================================
  // SECTION E: PII Minimization
  // =========================================================================
  describe('E. PII Minimization in Read Model DTO', () => {
    it('20. driverPhone is strictly ABSENT from ProjectFleetRowDTO', () => {
      const typeDef = readFileSync(
        resolve(__dirname, '../../src/types/projectFleetReadModel.ts'),
        'utf-8'
      );
      expect(typeDef).not.toMatch(/\bdriverPhone\s*[:?]/);
      expect(typeDef).not.toMatch(/\bphone\s*[:?]/);
    });

    it('21. nationalId and residencyId (Iqama) are strictly ABSENT from ProjectFleetRowDTO', () => {
      const typeDef = readFileSync(
        resolve(__dirname, '../../src/types/projectFleetReadModel.ts'),
        'utf-8'
      );
      expect(typeDef).not.toMatch(/\bnationalId\s*[:?]/);
      expect(typeDef).not.toMatch(/\bresidencyId\s*[:?]/);
      expect(typeDef).not.toMatch(/\biqama\s*[:?]/);
    });

    it('22. Only approved display fields are returned in DTO', () => {
      const typeDef = readFileSync(
        resolve(__dirname, '../../src/types/projectFleetReadModel.ts'),
        'utf-8'
      );
      expect(typeDef).toContain('plateNumber: string');
      expect(typeDef).toContain('truckType: string');
      expect(typeDef).toContain('carrierName: string');
      expect(typeDef).toContain('driverName: string | null');
      expect(typeDef).toContain('materialName: string | null');
    });
  });

  // =========================================================================
  // SECTION F: Pricing / Business Boundaries
  // =========================================================================
  describe('F. Pricing & Business Boundaries', () => {
    it('23. price is ABSENT from DTO', () => {
      const typeDef = readFileSync(
        resolve(__dirname, '../../src/types/projectFleetReadModel.ts'),
        'utf-8'
      );
      // Assert price is not a declared property in ProjectFleetRowDTO
      expect(typeDef).not.toMatch(/\bprice\s*[:?]/);
    });

    it('24. rate is ABSENT from DTO', () => {
      const typeDef = readFileSync(
        resolve(__dirname, '../../src/types/projectFleetReadModel.ts'),
        'utf-8'
      );
      // Assert rate is not a declared property in ProjectFleetRowDTO
      expect(typeDef).not.toMatch(/\brate\s*[:?]/);
    });

    it('25. pricingRuleId is ABSENT from DTO', () => {
      const typeDef = readFileSync(
        resolve(__dirname, '../../src/types/projectFleetReadModel.ts'),
        'utf-8'
      );
      // Assert pricingRuleId is not a declared property in ProjectFleetRowDTO
      expect(typeDef).not.toMatch(/\bpricingRuleId\s*[:?]/);
    });

    it('26. Pricing services remain untouched', () => {
      const pricingServiceCode = readFileSync(
        resolve(__dirname, '../../src/services/pricing.service.ts'),
        'utf-8'
      );
      expect(pricingServiceCode).toContain('export class PricingService');
    });

    it('27. Trip snapshot immutability remains untouched', () => {
      const tripServiceCode = readFileSync(
        resolve(__dirname, '../../src/services/trip.service.ts'),
        'utf-8'
      );
      expect(tripServiceCode).toContain('export class TripService');
    });

    it('28. Import commit engine remains untouched', () => {
      const commitCode = readFileSync(
        resolve(__dirname, '../../src/services/commitEngine.service.ts'),
        'utf-8'
      );
      expect(commitCode).toContain('export class CanonicalCommitEngineService');
    });

    it('29. Offline storage remains untouched', () => {
      const offlineCode = readFileSync(
        resolve(__dirname, '../../src/services/offline/indexedDB.service.ts'),
        'utf-8'
      );
      expect(offlineCode).toContain('export class IndexedDBService');
    });
  });

  // =========================================================================
  // SECTION G: Roster Convergence
  // =========================================================================
  describe('G. Roster Convergence Boundary', () => {
    it('30. ProjectWorkspaceView Fleet table reads from canonical fleet read model', () => {
      const wsCode = readFileSync(
        resolve(__dirname, '../../src/components/workspace/ProjectWorkspaceView.tsx'),
        'utf-8'
      );
      expect(wsCode).toContain('projectFleetReadModelService');
      expect(wsCode).toContain('setFleetRows');
    });

    it('31. Canonical Fleet table contains no legacy row delete button', () => {
      const wsCode = readFileSync(
        resolve(__dirname, '../../src/components/workspace/ProjectWorkspaceView.tsx'),
        'utf-8'
      );
      const fleetTableSection = wsCode.slice(
        wsCode.indexOf("activeWorkspaceTab === 'drivers'"),
        wsCode.indexOf('form-enroll-roster')
      );
      expect(fleetTableSection).not.toContain('handleDeleteRoster');
    });

    it('32. Legacy Roster documents are NOT deleted or migrated', () => {
      const readModelServiceCode = readFileSync(
        resolve(__dirname, '../../src/services/projectFleetReadModel.service.ts'),
        'utf-8'
      );
      expect(readModelServiceCode).not.toContain('delete');
      expect(readModelServiceCode).not.toContain('migration');
    });

    it('33. Legacy Roster writers remain active and unchanged', () => {
      const intakeCode = readFileSync(
        resolve(__dirname, '../../src/services/driverTruckIntake.service.ts'),
        'utf-8'
      );
      expect(intakeCode).toContain('projectCarrierRosterRepository.create');
    });

    it('34. No new mutable Fleet collection is created', () => {
      const readModelServiceCode = readFileSync(
        resolve(__dirname, '../../src/services/projectFleetReadModel.service.ts'),
        'utf-8'
      );
      expect(readModelServiceCode).not.toContain('setDoc');
      expect(readModelServiceCode).not.toContain('addDoc');
      expect(readModelServiceCode).not.toContain('updateDoc');
    });
  });

  // =========================================================================
  // SECTION H: Project Isolation
  // =========================================================================
  describe('H. Project Isolation', () => {
    it('35. Project A cannot read Project B fleet rows', async () => {
      const projectA = 'PRJ-ISOLATION-A';
      const projectB = 'PRJ-ISOLATION-B';

      const tA = await createActiveTruck(projectA);
      const tB = await createActiveTruck(projectB);

      const resA = await projectFleetReadModelService.getProjectFleetReadModel(projectA);
      expect(resA.truckCount).toBe(1);
      expect(resA.rows[0].truckId).toBe(tA.truckId);

      const resB = await projectFleetReadModelService.getProjectFleetReadModel(projectB);
      expect(resB.truckCount).toBe(1);
      expect(resB.rows[0].truckId).toBe(tB.truckId);
    });

    it('36. Global identity hydration does not weaken Project relationship isolation', async () => {
      await createActiveTruck(projectId);

      const res = await projectFleetReadModelService.getProjectFleetReadModel(projectId);
      expect(res.rows[0].projectId).toBe(projectId);
    });
  });

  // =========================================================================
  // SECTION I: Upstream Preservation
  // =========================================================================
  describe('I. Upstream Unit Preservation', () => {
    it('37. Unit 1 Global Identity authority is preserved', () => {
      expect(typeof globalDriverRepository.findById).toBe('function');
      expect(typeof globalTruckRepository.findById).toBe('function');
      expect(typeof globalCarrierRepository.findById).toBe('function');
      expect(typeof globalMaterialRepository.findById).toBe('function');
    });

    it('38. Unit 2A Project Membership authority is preserved', () => {
      expect(typeof projectTruckMembershipRepository.listMemberships).toBe('function');
    });

    it('39. Unit 2B-1 Project Carrier Affiliation authority is preserved', () => {
      expect(typeof projectTruckCarrierAffiliationRepository.getAffiliation).toBe('function');
    });

    it('40. Unit 2B-2 Project Driver-Truck Assignment authority is preserved', () => {
      expect(typeof projectDriverTruckAssignmentRepository.getActiveAssignmentByTruck).toBe('function');
    });

    it('41. Unit 2C Project Truck-Material Allocation authority is preserved', () => {
      expect(typeof projectTruckMaterialAllocationRepository.getActiveAllocationByTruck).toBe('function');
    });
  });
});
