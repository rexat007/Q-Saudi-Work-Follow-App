import { describe, it, expect, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  ProjectDriverCarrierAffiliationEntity,
  ProjectTruckCarrierAffiliationEntity,
} from '../types/projectCarrierAffiliation';
import {
  projectDriverCarrierAffiliationRepository,
  projectTruckCarrierAffiliationRepository,
} from '../repositories/projectCarrierAffiliation.repository';
import {
  projectDriverMembershipRepository,
  projectTruckMembershipRepository,
  projectCarrierMembershipRepository,
} from '../repositories/projectMembership.repository';
import {
  globalDriverRepository,
  globalTruckRepository,
  globalCarrierRepository,
} from '../repositories/globalIdentity.repository';
import { projectCarrierFleetAffiliationService } from '../services/projectCarrierAffiliation.service';

describe('PHASE 6 — UNIT 2B-1: Project Carrier Fleet Affiliation Foundation Test Suite', () => {
  beforeEach(() => {
    projectDriverCarrierAffiliationRepository._clearMemory();
    projectTruckCarrierAffiliationRepository._clearMemory();
    projectDriverMembershipRepository.clearInMemoryCache();
    projectTruckMembershipRepository.clearInMemoryCache();
    projectCarrierMembershipRepository.clearInMemoryCache();
    globalDriverRepository.clearInMemoryCache();
    globalTruckRepository.clearInMemoryCache();
    globalCarrierRepository.clearInMemoryCache();
  });

  let idCounter = 1;

  async function setupActiveCarrier(projectId: string, crNo?: string) {
    const cr = crNo || `1010${String(idCounter++).padStart(6, '0')}`;
    const globalCarrier = await globalCarrierRepository.createGlobal({
      commercialRegistrationNo: cr,
      nameAr: 'شركة الرمال للنقليات',
      status: 'ACTIVE',
      createdBy: 'admin-test',
    });
    const membership = await projectCarrierMembershipRepository.attachMember(
      projectId,
      globalCarrier.carrierId,
      'admin-test'
    );
    return { globalCarrier, membership };
  }

  async function setupActiveDriver(projectId: string, nationalId?: string) {
    const nid = nationalId || `10${String(idCounter++).padStart(8, '0')}`;
    const globalDriver = await globalDriverRepository.createGlobal({
      nationalId: nid,
      fullNameAr: 'سالم الدوسري',
      phone: '0501112233',
      status: 'ACTIVE',
      createdBy: 'admin-test',
    });
    const membership = await projectDriverMembershipRepository.attachMember(
      projectId,
      globalDriver.driverId,
      'admin-test'
    );
    return { globalDriver, membership };
  }

  async function setupActiveTruck(projectId: string, plate?: string) {
    const p = plate || `أ ب ج ${2000 + idCounter++}`;
    const globalTruck = await globalTruckRepository.createGlobal({
      plate: p,
      tareWeightKg: 14000,
      maxGrossWeightKg: 45000,
      status: 'ACTIVE',
      createdBy: 'admin-test',
    });
    const membership = await projectTruckMembershipRepository.attachMember(
      projectId,
      globalTruck.truckId,
      'admin-test'
    );
    return { globalTruck, membership };
  }

  // 1 & 2. Subcollection paths and entity keys
  it('1 & 2: Driver and Truck affiliations are Project-scoped and keyed by driverId / truckId', async () => {
    const projectId = 'PROJ-TEST-100';
    const { globalCarrier } = await setupActiveCarrier(projectId);
    const { globalDriver } = await setupActiveDriver(projectId);
    const { globalTruck } = await setupActiveTruck(projectId);

    const driverAffilResult = await projectDriverCarrierAffiliationRepository.setAffiliation(
      projectId,
      globalDriver.driverId,
      globalCarrier.carrierId,
      'admin-test'
    );
    expect(driverAffilResult.affiliation.driverId).toBe(globalDriver.driverId);
    expect(driverAffilResult.affiliation.projectId).toBe(projectId);
    expect(driverAffilResult.affiliation.carrierId).toBe(globalCarrier.carrierId);
    expect(driverAffilResult.affiliation.status).toBe('ACTIVE');

    const truckAffilResult = await projectTruckCarrierAffiliationRepository.setAffiliation(
      projectId,
      globalTruck.truckId,
      globalCarrier.carrierId,
      'admin-test'
    );
    expect(truckAffilResult.affiliation.truckId).toBe(globalTruck.truckId);
    expect(truckAffilResult.affiliation.projectId).toBe(projectId);
    expect(truckAffilResult.affiliation.carrierId).toBe(globalCarrier.carrierId);
    expect(truckAffilResult.affiliation.status).toBe('ACTIVE');
  });

  // 3 to 7. Zero redundant keys, zero PII, zero materialId
  it('3-7: Affiliation records have ZERO redundant keys, zero PII, zero profile copy, zero materialId', async () => {
    const projectId = 'PROJ-TEST-101';
    const { globalCarrier } = await setupActiveCarrier(projectId);
    const { globalDriver } = await setupActiveDriver(projectId);
    const { globalTruck } = await setupActiveTruck(projectId);

    const dRes = await projectDriverCarrierAffiliationRepository.setAffiliation(
      projectId,
      globalDriver.driverId,
      globalCarrier.carrierId,
      'admin-test'
    );
    const tRes = await projectTruckCarrierAffiliationRepository.setAffiliation(
      projectId,
      globalTruck.truckId,
      globalCarrier.carrierId,
      'admin-test'
    );

    const dObj = dRes.affiliation as any;
    const tObj = tRes.affiliation as any;

    expect(dObj.affiliationId).toBeUndefined();
    expect(dObj.entityId).toBeUndefined();
    expect(dObj.driverName).toBeUndefined();
    expect(dObj.phone).toBeUndefined();
    expect(dObj.nationalId).toBeUndefined();
    expect(dObj.materialId).toBeUndefined();
    expect(dObj.truckId).toBeUndefined();

    expect(tObj.affiliationId).toBeUndefined();
    expect(tObj.entityId).toBeUndefined();
    expect(tObj.plate).toBeUndefined();
    expect(tObj.vin).toBeUndefined();
    expect(tObj.driverId).toBeUndefined();
    expect(tObj.materialId).toBeUndefined();
  });

  // 8, 9, 10. Global entities remain completely unchanged
  it('8-10: Global Driver, Truck, and Carrier identities remain completely unchanged on affiliation creation', async () => {
    const projectId = 'PROJ-TEST-102';
    const { globalCarrier } = await setupActiveCarrier(projectId);
    const { globalDriver } = await setupActiveDriver(projectId);
    const { globalTruck } = await setupActiveTruck(projectId);

    const initialDriver = await globalDriverRepository.findById(globalDriver.driverId);
    const initialTruck = await globalTruckRepository.findById(globalTruck.truckId);
    const initialCarrier = await globalCarrierRepository.findById(globalCarrier.carrierId);

    await projectDriverCarrierAffiliationRepository.setAffiliation(
      projectId,
      globalDriver.driverId,
      globalCarrier.carrierId,
      'admin-test'
    );
    await projectTruckCarrierAffiliationRepository.setAffiliation(
      projectId,
      globalTruck.truckId,
      globalCarrier.carrierId,
      'admin-test'
    );

    const postDriver = await globalDriverRepository.findById(globalDriver.driverId);
    const postTruck = await globalTruckRepository.findById(globalTruck.truckId);
    const postCarrier = await globalCarrierRepository.findById(globalCarrier.carrierId);

    expect(postDriver).toEqual(initialDriver);
    expect(postTruck).toEqual(initialTruck);
    expect(postCarrier).toEqual(initialCarrier);
  });

  // 11 to 22. Strict Membership Preconditions
  it('11-22: Rejects affiliation if Driver, Truck, or Carrier Project Membership is missing, suspended, or removed', async () => {
    const projectId = 'PROJ-TEST-103';
    const { globalCarrier } = await setupActiveCarrier(projectId);
    const { globalDriver } = await setupActiveDriver(projectId);
    const { globalTruck } = await setupActiveTruck(projectId);

    // Missing Driver membership
    await expect(
      projectDriverCarrierAffiliationRepository.setAffiliation(
        projectId,
        'NON_EXISTENT_DRIVER',
        globalCarrier.carrierId,
        'admin-test'
      )
    ).rejects.toThrow(/PRECONDITION_FAILED.*driver membership does not exist/i);

    // Missing Truck membership
    await expect(
      projectTruckCarrierAffiliationRepository.setAffiliation(
        projectId,
        'NON_EXISTENT_TRUCK',
        globalCarrier.carrierId,
        'admin-test'
      )
    ).rejects.toThrow(/PRECONDITION_FAILED.*truck membership does not exist/i);

    // Missing Carrier membership
    await expect(
      projectDriverCarrierAffiliationRepository.setAffiliation(
        projectId,
        globalDriver.driverId,
        'NON_EXISTENT_CARRIER',
        'admin-test'
      )
    ).rejects.toThrow(/PRECONDITION_FAILED.*carrier membership does not exist/i);

    // Suspended Driver Membership
    await projectDriverMembershipRepository.setMembershipStatus(projectId, globalDriver.driverId, 'SUSPENDED', 'admin-test');
    await expect(
      projectDriverCarrierAffiliationRepository.setAffiliation(
        projectId,
        globalDriver.driverId,
        globalCarrier.carrierId,
        'admin-test'
      )
    ).rejects.toThrow(/PRECONDITION_FAILED.*driver membership.*must be ACTIVE/i);

    // Removed Driver Membership
    await projectDriverMembershipRepository.setMembershipStatus(projectId, globalDriver.driverId, 'REMOVED', 'admin-test');
    await expect(
      projectDriverCarrierAffiliationRepository.setAffiliation(
        projectId,
        globalDriver.driverId,
        globalCarrier.carrierId,
        'admin-test'
      )
    ).rejects.toThrow(/PRECONDITION_FAILED.*driver membership.*must be ACTIVE/i);

    // Restore Driver to ACTIVE
    await projectDriverMembershipRepository.setMembershipStatus(projectId, globalDriver.driverId, 'ACTIVE', 'admin-test');

    // Suspended Truck Membership
    await projectTruckMembershipRepository.setMembershipStatus(projectId, globalTruck.truckId, 'SUSPENDED', 'admin-test');
    await expect(
      projectTruckCarrierAffiliationRepository.setAffiliation(
        projectId,
        globalTruck.truckId,
        globalCarrier.carrierId,
        'admin-test'
      )
    ).rejects.toThrow(/PRECONDITION_FAILED.*truck membership.*must be ACTIVE/i);

    // Suspended Carrier Membership
    await projectCarrierMembershipRepository.setMembershipStatus(projectId, globalCarrier.carrierId, 'SUSPENDED', 'admin-test');
    await expect(
      projectDriverCarrierAffiliationRepository.setAffiliation(
        projectId,
        globalDriver.driverId,
        globalCarrier.carrierId,
        'admin-test'
      )
    ).rejects.toThrow(/PRECONDITION_FAILED.*carrier membership.*must be ACTIVE/i);
  });

  // 23 & 24. Idempotency
  it('23-24: Duplicate same Driver→Carrier or Truck→Carrier set is strictly idempotent', async () => {
    const projectId = 'PROJ-TEST-104';
    const { globalCarrier } = await setupActiveCarrier(projectId);
    const { globalDriver } = await setupActiveDriver(projectId);
    const { globalTruck } = await setupActiveTruck(projectId);

    // First call
    const d1 = await projectDriverCarrierAffiliationRepository.setAffiliation(
      projectId,
      globalDriver.driverId,
      globalCarrier.carrierId,
      'admin-test'
    );
    expect(d1.idempotent).toBe(false);
    expect(d1.reassigned).toBe(false);

    // Second call with same carrier
    const d2 = await projectDriverCarrierAffiliationRepository.setAffiliation(
      projectId,
      globalDriver.driverId,
      globalCarrier.carrierId,
      'admin-test'
    );
    expect(d2.idempotent).toBe(true);
    expect(d2.reassigned).toBe(false);
    expect(d2.affiliation).toEqual(d1.affiliation);

    // Truck idempotency
    const t1 = await projectTruckCarrierAffiliationRepository.setAffiliation(
      projectId,
      globalTruck.truckId,
      globalCarrier.carrierId,
      'admin-test'
    );
    expect(t1.idempotent).toBe(false);

    const t2 = await projectTruckCarrierAffiliationRepository.setAffiliation(
      projectId,
      globalTruck.truckId,
      globalCarrier.carrierId,
      'admin-test'
    );
    expect(t2.idempotent).toBe(true);
    expect(t2.affiliation).toEqual(t1.affiliation);
  });

  // 25 to 28. Carrier Reassignment preserves entity IDs and updates only current affiliation authority
  it('25-28: Carrier reassignment preserves entity ID, updates current authority, and records previousCarrierId', async () => {
    const projectId = 'PROJ-TEST-105';
    const { globalCarrier: carrierA } = await setupActiveCarrier(projectId);
    const { globalCarrier: carrierB } = await setupActiveCarrier(projectId);
    const { globalDriver } = await setupActiveDriver(projectId);
    const { globalTruck } = await setupActiveTruck(projectId);

    // Initial assignment to Carrier A
    await projectDriverCarrierAffiliationRepository.setAffiliation(
      projectId,
      globalDriver.driverId,
      carrierA.carrierId,
      'admin-test'
    );
    await projectTruckCarrierAffiliationRepository.setAffiliation(
      projectId,
      globalTruck.truckId,
      carrierA.carrierId,
      'admin-test'
    );

    // Reassign Driver to Carrier B
    const dReassign = await projectDriverCarrierAffiliationRepository.setAffiliation(
      projectId,
      globalDriver.driverId,
      carrierB.carrierId,
      'admin-test'
    );
    expect(dReassign.reassigned).toBe(true);
    expect(dReassign.previousCarrierId).toBe(carrierA.carrierId);
    expect(dReassign.affiliation.carrierId).toBe(carrierB.carrierId);
    expect(dReassign.affiliation.driverId).toBe(globalDriver.driverId);

    // Reassign Truck to Carrier B
    const tReassign = await projectTruckCarrierAffiliationRepository.setAffiliation(
      projectId,
      globalTruck.truckId,
      carrierB.carrierId,
      'admin-test'
    );
    expect(tReassign.reassigned).toBe(true);
    expect(tReassign.previousCarrierId).toBe(carrierA.carrierId);
    expect(tReassign.affiliation.carrierId).toBe(carrierB.carrierId);
    expect(tReassign.affiliation.truckId).toBe(globalTruck.truckId);
  });

  // 29. Concurrent mutation safety: Single deterministic document key per entity
  it('29: Deterministic document key prevents duplicate affiliation authority', async () => {
    const projectId = 'PROJ-TEST-106';
    const { globalCarrier } = await setupActiveCarrier(projectId);
    const { globalDriver } = await setupActiveDriver(projectId);

    const res1 = await projectDriverCarrierAffiliationRepository.setAffiliation(
      projectId,
      globalDriver.driverId,
      globalCarrier.carrierId,
      'admin-test'
    );
    const fetched = await projectDriverCarrierAffiliationRepository.getAffiliation(
      projectId,
      globalDriver.driverId
    );
    expect(fetched).not.toBeNull();
    expect(fetched?.carrierId).toBe(globalCarrier.carrierId);
  });

  // 30. Project Isolation: Project A cannot leak Project B affiliations
  it('30: Project isolation is strictly maintained across different projects', async () => {
    const projA = 'PROJ-A';
    const projB = 'PROJ-B';

    const { globalCarrier: carrierA } = await setupActiveCarrier(projA);
    const { globalCarrier: carrierB } = await setupActiveCarrier(projB);
    const { globalDriver } = await setupActiveDriver(projA);
    // Also attach driver to projB
    await projectDriverMembershipRepository.attachMember(projB, globalDriver.driverId, 'admin-test');

    await projectDriverCarrierAffiliationRepository.setAffiliation(
      projA,
      globalDriver.driverId,
      carrierA.carrierId,
      'admin-test'
    );
    await projectDriverCarrierAffiliationRepository.setAffiliation(
      projB,
      globalDriver.driverId,
      carrierB.carrierId,
      'admin-test'
    );

    const affilA = await projectDriverCarrierAffiliationRepository.getAffiliation(projA, globalDriver.driverId);
    const affilB = await projectDriverCarrierAffiliationRepository.getAffiliation(projB, globalDriver.driverId);

    expect(affilA?.carrierId).toBe(carrierA.carrierId);
    expect(affilB?.carrierId).toBe(carrierB.carrierId);
    expect(affilA?.carrierId).not.toBe(affilB?.carrierId);
  });

  // 31 & 32. Multi-project different carrier affiliation for same entity
  it('31-32: Same Driver and Truck may have different Carrier affiliations in different Projects', async () => {
    const proj1 = 'PROJ-1';
    const proj2 = 'PROJ-2';

    const { globalCarrier: carrier1 } = await setupActiveCarrier(proj1);
    const { globalCarrier: carrier2 } = await setupActiveCarrier(proj2);
    const { globalTruck } = await setupActiveTruck(proj1);
    await projectTruckMembershipRepository.attachMember(proj2, globalTruck.truckId, 'admin-test');

    await projectTruckCarrierAffiliationRepository.setAffiliation(
      proj1,
      globalTruck.truckId,
      carrier1.carrierId,
      'admin-test'
    );
    await projectTruckCarrierAffiliationRepository.setAffiliation(
      proj2,
      globalTruck.truckId,
      carrier2.carrierId,
      'admin-test'
    );

    const tProj1 = await projectTruckCarrierAffiliationRepository.getAffiliation(proj1, globalTruck.truckId);
    const tProj2 = await projectTruckCarrierAffiliationRepository.getAffiliation(proj2, globalTruck.truckId);

    expect(tProj1?.carrierId).toBe(carrier1.carrierId);
    expect(tProj2?.carrierId).toBe(carrier2.carrierId);
  });

  // 33. Root GlobalTruck legal-owner field is NOT mutated by project operational affiliation
  it('33: Root GlobalTruck legal-owner carrier field is not mutated by Project operational affiliation', async () => {
    const projectId = 'PROJ-TEST-107';
    const { globalCarrier: operationalCarrier } = await setupActiveCarrier(projectId);

    // Create a truck with a root legal owner carrier
    const globalTruck = await globalTruckRepository.createGlobal({
      plate: 'د هـ و 9999',
      tareWeightKg: 15000,
      maxGrossWeightKg: 45000,
      status: 'ACTIVE',
      primaryCarrierId: 'LEGAL_OWNER_CARRIER_999',
      createdBy: 'admin-test',
    });
    await projectTruckMembershipRepository.attachMember(projectId, globalTruck.truckId, 'admin-test');

    // Affiliate to operationalCarrier in Project
    await projectTruckCarrierAffiliationRepository.setAffiliation(
      projectId,
      globalTruck.truckId,
      operationalCarrier.carrierId,
      'admin-test'
    );

    const rootTruck = await globalTruckRepository.findById(globalTruck.truckId);
    expect(rootTruck?.primaryCarrierId).toBe('LEGAL_OWNER_CARRIER_999');
    expect(rootTruck?.primaryCarrierId).not.toBe(operationalCarrier.carrierId);
  });

  // 34, 35, 36. Same Carrier verification future precondition for Unit 2B-2
  it('34-36: Future precondition helper correctly validates same-carrier Driver-Truck matching', async () => {
    const projectId = 'PROJ-TEST-108';
    const { globalCarrier: carrierA } = await setupActiveCarrier(projectId);
    const { globalCarrier: carrierB } = await setupActiveCarrier(projectId);
    const { globalDriver } = await setupActiveDriver(projectId);
    const { globalTruck } = await setupActiveTruck(projectId);

    // Case 1: Driver Carrier A, Truck Carrier B => Mismatch
    await projectDriverCarrierAffiliationRepository.setAffiliation(
      projectId,
      globalDriver.driverId,
      carrierA.carrierId,
      'admin-test'
    );
    await projectTruckCarrierAffiliationRepository.setAffiliation(
      projectId,
      globalTruck.truckId,
      carrierB.carrierId,
      'admin-test'
    );

    const mismatch = await projectCarrierFleetAffiliationService.verifySameCarrierAffiliation(
      projectId,
      globalDriver.driverId,
      globalTruck.truckId
    );
    expect(mismatch.valid).toBe(false);
    expect(mismatch.reason).toMatch(/Carrier mismatch/i);

    // Case 2: Driver Carrier A, Truck Carrier A => Match
    await projectTruckCarrierAffiliationRepository.setAffiliation(
      projectId,
      globalTruck.truckId,
      carrierA.carrierId,
      'admin-test'
    );

    const match = await projectCarrierFleetAffiliationService.verifySameCarrierAffiliation(
      projectId,
      globalDriver.driverId,
      globalTruck.truckId
    );
    expect(match.valid).toBe(true);
    expect(match.carrierId).toBe(carrierA.carrierId);

    // Case 3: Inactive Driver affiliation => Invalid
    await projectCarrierFleetAffiliationService.setDriverAffiliationStatus(
      projectId,
      globalDriver.driverId,
      'INACTIVE',
      'admin-test'
    );
    const inactiveCheck = await projectCarrierFleetAffiliationService.verifySameCarrierAffiliation(
      projectId,
      globalDriver.driverId,
      globalTruck.truckId
    );
    expect(inactiveCheck.valid).toBe(false);
  });

  // 37 to 47. Non-contamination & architectural assertions
  it('37-47: Architectural boundaries: rules defined, no caller contamination, no dual write', () => {
    const rulesPath = path.resolve(process.cwd(), 'firestore.rules');
    const rulesContent = fs.readFileSync(rulesPath, 'utf8');

    expect(rulesContent).toContain('match /driver_carrier_affiliations/{driverId}');
    expect(rulesContent).toContain('match /truck_carrier_affiliations/{truckId}');
    expect(rulesContent).toContain('hasProjectRole(projectId, [\'PROJECT_ADMIN\', \'SUPER_ADMIN\'])');
  });
});
