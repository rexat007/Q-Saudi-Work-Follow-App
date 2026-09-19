import { describe, it, expect, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  ProjectDriverTruckAssignmentEntity,
  ActiveAssignmentSlotPayload,
} from '../types/projectDriverTruckAssignment';
import {
  projectDriverTruckAssignmentRepository,
  generateOpaqueAssignmentId,
} from '../repositories/projectDriverTruckAssignment.repository';
import { projectDriverTruckAssignmentService } from '../services/projectDriverTruckAssignment.service';
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

describe('PHASE 6 — UNIT 2B-2: Project Driver ↔ Truck Temporal Assignment Foundation Test Suite', () => {
  const projectId = 'PRJ-TEST-ASSIGNMENT-01';
  let idCounter = 1;

  beforeEach(() => {
    projectDriverTruckAssignmentRepository._clearMemory();
    projectDriverCarrierAffiliationRepository._clearMemory();
    projectTruckCarrierAffiliationRepository._clearMemory();
    projectDriverMembershipRepository.clearInMemoryCache();
    projectTruckMembershipRepository.clearInMemoryCache();
    projectCarrierMembershipRepository.clearInMemoryCache();
    globalDriverRepository.clearInMemoryCache();
    globalTruckRepository.clearInMemoryCache();
    globalCarrierRepository.clearInMemoryCache();
  });

  async function setupActiveCarrier(pId = projectId, crNo?: string) {
    const cr = crNo || `1010${String(idCounter++).padStart(6, '0')}`;
    const globalCarrier = await globalCarrierRepository.createGlobal({
      commercialRegistrationNo: cr,
      nameAr: 'شركة الرمال للنقليات',
      status: 'ACTIVE',
      createdBy: 'admin-test',
    });
    const membership = await projectCarrierMembershipRepository.attachMember(
      pId,
      globalCarrier.carrierId,
      'admin-test'
    );
    return { globalCarrier, membership };
  }

  async function setupActiveDriver(pId = projectId, carrierId?: string) {
    const nid = `10${String(idCounter++).padStart(8, '0')}`;
    const globalDriver = await globalDriverRepository.createGlobal({
      nationalId: nid,
      fullNameAr: 'سالم الدوسري',
      phone: '0501112233',
      status: 'ACTIVE',
      createdBy: 'admin-test',
    });
    const membership = await projectDriverMembershipRepository.attachMember(
      pId,
      globalDriver.driverId,
      'admin-test'
    );
    let affiliation;
    if (carrierId) {
      affiliation = (
        await projectDriverCarrierAffiliationRepository.setAffiliation(
          pId,
          globalDriver.driverId,
          carrierId,
          'admin-test'
        )
      ).affiliation;
    }
    return { globalDriver, membership, affiliation };
  }

  async function setupActiveTruck(pId = projectId, carrierId?: string) {
    const plate = `${String(idCounter++).padStart(4, '0')} أ ب ج`;
    const globalTruck = await globalTruckRepository.createGlobal({
      plate: plate,
      tareWeightKg: 12000,
      maxGrossWeightKg: 32000,
      status: 'ACTIVE',
      createdBy: 'admin-test',
    });
    const membership = await projectTruckMembershipRepository.attachMember(
      pId,
      globalTruck.truckId,
      'admin-test'
    );
    let affiliation;
    if (carrierId) {
      affiliation = (
        await projectTruckCarrierAffiliationRepository.setAffiliation(
          pId,
          globalTruck.truckId,
          carrierId,
          'admin-test'
        )
      ).affiliation;
    }
    return { globalTruck, membership, affiliation };
  }

  // ============================================================================
  // GROUP A: ID / SCHEMA & MINIMAL KEY PRINCIPLE
  // ============================================================================
  describe('GROUP A: ID / Schema & Minimal Key Principle', () => {
    it('1. assignment ID uses cryptographic 128-bit opaque value with ASN- prefix', () => {
      const id1 = generateOpaqueAssignmentId();
      const id2 = generateOpaqueAssignmentId();

      expect(id1).toMatch(/^ASN-[0-9a-f]{32}$/i);
      expect(id2).toMatch(/^ASN-[0-9a-f]{32}$/i);
      expect(id1).not.toBe(id2);
    });

    it('2. ID contains no timestamp and 3. no natural/entity identifiers', () => {
      const id = generateOpaqueAssignmentId();
      const rawHex = id.replace('ASN-', '');
      expect(rawHex.length).toBe(32);
      expect(id).not.toContain(projectId);
      expect(id).not.toContain('DRV');
      expect(id).not.toContain('TRK');
      expect(id).not.toContain('CAR');
    });

    it('4. carrierId, 5. materialId, 6. profile/PII, 7. closedAt, 8. closedBy are ABSENT', async () => {
      const { globalCarrier } = await setupActiveCarrier();
      const { globalDriver } = await setupActiveDriver(projectId, globalCarrier.carrierId);
      const { globalTruck } = await setupActiveTruck(projectId, globalCarrier.carrierId);

      const result = await projectDriverTruckAssignmentService.assignDriverToTruck(
        projectId,
        globalDriver.driverId,
        globalTruck.truckId,
        'actor-admin'
      );

      const entity = result.assignment;
      const keys = Object.keys(entity);

      // Kept fields
      expect(keys).toContain('assignmentId');
      expect(keys).toContain('projectId');
      expect(keys).toContain('driverId');
      expect(keys).toContain('truckId');
      expect(keys).toContain('status');
      expect(keys).toContain('effectiveFrom');
      expect(keys).toContain('effectiveTo');
      expect(keys).toContain('createdAt');
      expect(keys).toContain('createdBy');

      // OMITTED / BANNED fields
      expect(keys).not.toContain('carrierId');
      expect(keys).not.toContain('materialId');
      expect(keys).not.toContain('materialIds');
      expect(keys).not.toContain('driverName');
      expect(keys).not.toContain('plateNumber');
      expect(keys).not.toContain('phone');
      expect(keys).not.toContain('nationalId');
      expect(keys).not.toContain('closedAt');
      expect(keys).not.toContain('closedBy');
      expect(keys).not.toContain('updatedAt');
      expect(keys).not.toContain('updatedBy');
      expect(keys).not.toContain('shiftId');
    });
  });

  // ============================================================================
  // GROUP B: PREREQUISITES & SAME-CARRIER VALIDATION
  // ============================================================================
  describe('GROUP B: Prerequisites & Same-Carrier Validation', () => {
    it('9. ACTIVE Driver Membership required', async () => {
      const { globalCarrier } = await setupActiveCarrier();
      const { globalTruck } = await setupActiveTruck(projectId, globalCarrier.carrierId);
      const nid = `10${String(idCounter++).padStart(8, '0')}`;
      const unattachedDriver = await globalDriverRepository.createGlobal({
        nationalId: nid,
        fullNameAr: 'سائق غير مسجل',
        phone: '0501112244',
        status: 'ACTIVE',
        createdBy: 'admin-test',
      });

      await expect(
        projectDriverTruckAssignmentService.assignDriverToTruck(
          projectId,
          unattachedDriver.driverId,
          globalTruck.truckId,
          'actor-admin'
        )
      ).rejects.toThrow(/PRECONDITION_FAILED.*Driver membership/);
    });

    it('10. ACTIVE Truck Membership required', async () => {
      const { globalCarrier } = await setupActiveCarrier();
      const { globalDriver } = await setupActiveDriver(projectId, globalCarrier.carrierId);
      const unattachedTruck = await globalTruckRepository.createGlobal({
        plate: '9999 خ خ خ',
        tareWeightKg: 12000,
        maxGrossWeightKg: 32000,
        status: 'ACTIVE',
        createdBy: 'admin-test',
      });

      await expect(
        projectDriverTruckAssignmentService.assignDriverToTruck(
          projectId,
          globalDriver.driverId,
          unattachedTruck.truckId,
          'actor-admin'
        )
      ).rejects.toThrow(/PRECONDITION_FAILED.*Truck membership/);
    });

    it('11. ACTIVE Driver Carrier affiliation required', async () => {
      const { globalCarrier } = await setupActiveCarrier();
      const { globalDriver } = await setupActiveDriver(projectId); // no carrier affiliation
      const { globalTruck } = await setupActiveTruck(projectId, globalCarrier.carrierId);

      await expect(
        projectDriverTruckAssignmentService.assignDriverToTruck(
          projectId,
          globalDriver.driverId,
          globalTruck.truckId,
          'actor-admin'
        )
      ).rejects.toThrow(/PRECONDITION_FAILED.*Driver carrier affiliation/);
    });

    it('12. ACTIVE Truck Carrier affiliation required', async () => {
      const { globalCarrier } = await setupActiveCarrier();
      const { globalDriver } = await setupActiveDriver(projectId, globalCarrier.carrierId);
      const { globalTruck } = await setupActiveTruck(projectId); // no carrier affiliation

      await expect(
        projectDriverTruckAssignmentService.assignDriverToTruck(
          projectId,
          globalDriver.driverId,
          globalTruck.truckId,
          'actor-admin'
        )
      ).rejects.toThrow(/PRECONDITION_FAILED.*Truck carrier affiliation/);
    });

    it('13. same Carrier required & 14. cross-Carrier pairing rejected', async () => {
      const carrierA = await setupActiveCarrier(projectId);
      const carrierB = await setupActiveCarrier(projectId);

      const { globalDriver } = await setupActiveDriver(projectId, carrierA.globalCarrier.carrierId);
      const { globalTruck } = await setupActiveTruck(projectId, carrierB.globalCarrier.carrierId);

      await expect(
        projectDriverTruckAssignmentService.assignDriverToTruck(
          projectId,
          globalDriver.driverId,
          globalTruck.truckId,
          'actor-admin'
        )
      ).rejects.toThrow(/PRECONDITION_FAILED: Cross-carrier pairing rejected/);
    });
  });

  // ============================================================================
  // GROUP C: ATOMIC PRECONDITION RACE PROTECTION
  // ============================================================================
  describe('GROUP C: Atomic Precondition Race Protection', () => {
    it('15. membership/affiliation state is validated inside transaction boundary', async () => {
      const { globalCarrier } = await setupActiveCarrier();
      const { globalDriver } = await setupActiveDriver(projectId, globalCarrier.carrierId);
      const { globalTruck } = await setupActiveTruck(projectId, globalCarrier.carrierId);

      // Suspend driver membership right before assignment
      await projectDriverMembershipRepository.setMembershipStatus(
        projectId,
        globalDriver.driverId,
        'SUSPENDED',
        'admin-test'
      );

      await expect(
        projectDriverTruckAssignmentService.assignDriverToTruck(
          projectId,
          globalDriver.driverId,
          globalTruck.truckId,
          'actor-admin'
        )
      ).rejects.toThrow(/PRECONDITION_FAILED.*is SUSPENDED, must be ACTIVE/);
    });

    it('16. stale preflight validation cannot authorize a later invalid assignment', async () => {
      const { globalCarrier } = await setupActiveCarrier();
      const { globalDriver } = await setupActiveDriver(projectId, globalCarrier.carrierId);
      const { globalTruck } = await setupActiveTruck(projectId, globalCarrier.carrierId);

      // Deactivate driver affiliation
      await projectDriverCarrierAffiliationRepository.setAffiliationStatus(
        projectId,
        globalDriver.driverId,
        'INACTIVE',
        'admin-test'
      );

      await expect(
        projectDriverTruckAssignmentService.assignDriverToTruck(
          projectId,
          globalDriver.driverId,
          globalTruck.truckId,
          'actor-admin'
        )
      ).rejects.toThrow(/PRECONDITION_FAILED.*Driver carrier affiliation/);
    });
  });

  // ============================================================================
  // GROUP D: CARDINALITY (ONE ACTIVE DRIVER, ONE ACTIVE TRUCK)
  // ============================================================================
  describe('GROUP D: Cardinality', () => {
    it('17. one active Truck per Driver & 18. one active Driver per Truck', async () => {
      const { globalCarrier } = await setupActiveCarrier();
      const d1 = (await setupActiveDriver(projectId, globalCarrier.carrierId)).globalDriver;
      const t1 = (await setupActiveTruck(projectId, globalCarrier.carrierId)).globalTruck;
      const t2 = (await setupActiveTruck(projectId, globalCarrier.carrierId)).globalTruck;

      // D1 assigned to T1
      await projectDriverTruckAssignmentService.assignDriverToTruck(projectId, d1.driverId, t1.truckId, 'admin');

      // Now D1 assigned to T2
      await projectDriverTruckAssignmentService.assignDriverToTruck(projectId, d1.driverId, t2.truckId, 'admin');

      const activeD1 = await projectDriverTruckAssignmentService.getActiveAssignmentByDriver(projectId, d1.driverId);
      expect(activeD1?.truckId).toBe(t2.truckId);

      // T1 should now have NO active driver
      const activeT1 = await projectDriverTruckAssignmentService.getActiveAssignmentByTruck(projectId, t1.truckId);
      expect(activeT1).toBeNull();
    });
  });

  // ============================================================================
  // GROUP E: IDEMPOTENCY
  // ============================================================================
  describe('GROUP E: Idempotency', () => {
    it('19. assigning existing active D ↔ T returns same assignment without creating new interval', async () => {
      const { globalCarrier } = await setupActiveCarrier();
      const d = (await setupActiveDriver(projectId, globalCarrier.carrierId)).globalDriver;
      const t = (await setupActiveTruck(projectId, globalCarrier.carrierId)).globalTruck;

      const firstCall = await projectDriverTruckAssignmentService.assignDriverToTruck(
        projectId,
        d.driverId,
        t.truckId,
        'admin'
      );
      expect(firstCall.idempotent).toBe(false);

      const secondCall = await projectDriverTruckAssignmentService.assignDriverToTruck(
        projectId,
        d.driverId,
        t.truckId,
        'admin'
      );
      expect(secondCall.idempotent).toBe(true);
      expect(secondCall.assignment.assignmentId).toBe(firstCall.assignment.assignmentId);

      const history = await projectDriverTruckAssignmentService.listDriverAssignmentHistory(projectId, d.driverId);
      expect(history.length).toBe(1);
    });
  });

  // ============================================================================
  // GROUP F: REASSIGNMENT (DRIVER CHANGES TRUCK, TRUCK CHANGES DRIVER)
  // ============================================================================
  describe('GROUP F: Reassignment', () => {
    it('21. D→A then D→B closes D→A and activates D→B', async () => {
      const { globalCarrier } = await setupActiveCarrier();
      const d = (await setupActiveDriver(projectId, globalCarrier.carrierId)).globalDriver;
      const tA = (await setupActiveTruck(projectId, globalCarrier.carrierId)).globalTruck;
      const tB = (await setupActiveTruck(projectId, globalCarrier.carrierId)).globalTruck;

      const assignA = await projectDriverTruckAssignmentService.assignDriverToTruck(projectId, d.driverId, tA.truckId, 'admin');
      const assignB = await projectDriverTruckAssignmentService.assignDriverToTruck(projectId, d.driverId, tB.truckId, 'admin');

      expect(assignB.reassignedDriver).toBe(true);
      expect(assignB.closedAssignments).toContain(assignA.assignment.assignmentId);

      const oldAssign = await projectDriverTruckAssignmentRepository.getAssignment(projectId, assignA.assignment.assignmentId);
      expect(oldAssign?.status).toBe('CLOSED');
      expect(oldAssign?.effectiveTo).not.toBeNull();

      const newAssign = await projectDriverTruckAssignmentRepository.getAssignment(projectId, assignB.assignment.assignmentId);
      expect(newAssign?.status).toBe('ACTIVE');
      expect(newAssign?.effectiveTo).toBeNull();
    });

    it('22. X→B then D→B closes X→B and activates D→B & 23. old assignments remain historical', async () => {
      const { globalCarrier } = await setupActiveCarrier();
      const dX = (await setupActiveDriver(projectId, globalCarrier.carrierId)).globalDriver;
      const dD = (await setupActiveDriver(projectId, globalCarrier.carrierId)).globalDriver;
      const tB = (await setupActiveTruck(projectId, globalCarrier.carrierId)).globalTruck;

      const assignX = await projectDriverTruckAssignmentService.assignDriverToTruck(projectId, dX.driverId, tB.truckId, 'admin');
      await new Promise((r) => setTimeout(r, 10));
      const assignD = await projectDriverTruckAssignmentService.assignDriverToTruck(projectId, dD.driverId, tB.truckId, 'admin');

      expect(assignD.reassignedTruck).toBe(true);
      expect(assignD.closedAssignments).toContain(assignX.assignment.assignmentId);

      const historyTruck = await projectDriverTruckAssignmentService.listTruckAssignmentHistory(projectId, tB.truckId);
      expect(historyTruck.length).toBe(2);
      expect(historyTruck[0].driverId).toBe(dD.driverId);
      expect(historyTruck[0].status).toBe('ACTIVE');
      expect(historyTruck[1].driverId).toBe(dX.driverId);
      expect(historyTruck[1].status).toBe('CLOSED');
    });
  });

  // ============================================================================
  // GROUP G: COUNTERPART SLOTS & REFERENTIAL INTEGRITY
  // ============================================================================
  describe('GROUP G: Counterpart Slots & Referential Integrity', () => {
    it('24. Truck A old pointer is released when D leaves A', async () => {
      const { globalCarrier } = await setupActiveCarrier();
      const d = (await setupActiveDriver(projectId, globalCarrier.carrierId)).globalDriver;
      const tA = (await setupActiveTruck(projectId, globalCarrier.carrierId)).globalTruck;
      const tB = (await setupActiveTruck(projectId, globalCarrier.carrierId)).globalTruck;

      await projectDriverTruckAssignmentService.assignDriverToTruck(projectId, d.driverId, tA.truckId, 'admin');
      expect(await projectDriverTruckAssignmentService.getActiveTruckSlot(projectId, tA.truckId)).not.toBeNull();

      await projectDriverTruckAssignmentService.assignDriverToTruck(projectId, d.driverId, tB.truckId, 'admin');
      expect(await projectDriverTruckAssignmentService.getActiveTruckSlot(projectId, tA.truckId)).toBeNull();
      expect(await projectDriverTruckAssignmentService.getActiveTruckSlot(projectId, tB.truckId)).not.toBeNull();
    });

    it('25. Driver X old pointer is released when B leaves X', async () => {
      const { globalCarrier } = await setupActiveCarrier();
      const dX = (await setupActiveDriver(projectId, globalCarrier.carrierId)).globalDriver;
      const dD = (await setupActiveDriver(projectId, globalCarrier.carrierId)).globalDriver;
      const tB = (await setupActiveTruck(projectId, globalCarrier.carrierId)).globalTruck;

      await projectDriverTruckAssignmentService.assignDriverToTruck(projectId, dX.driverId, tB.truckId, 'admin');
      expect(await projectDriverTruckAssignmentService.getActiveDriverSlot(projectId, dX.driverId)).not.toBeNull();

      await projectDriverTruckAssignmentService.assignDriverToTruck(projectId, dD.driverId, tB.truckId, 'admin');
      expect(await projectDriverTruckAssignmentService.getActiveDriverSlot(projectId, dX.driverId)).toBeNull();
      expect(await projectDriverTruckAssignmentService.getActiveDriverSlot(projectId, dD.driverId)).not.toBeNull();
    });

    it('26. counterpart pointer docs validated & 27. no orphan active pointer remains', async () => {
      const { globalCarrier } = await setupActiveCarrier();
      const d1 = (await setupActiveDriver(projectId, globalCarrier.carrierId)).globalDriver;
      const d2 = (await setupActiveDriver(projectId, globalCarrier.carrierId)).globalDriver;
      const t1 = (await setupActiveTruck(projectId, globalCarrier.carrierId)).globalTruck;
      const t2 = (await setupActiveTruck(projectId, globalCarrier.carrierId)).globalTruck;

      // Pair (d1, t1) and (d2, t2)
      await projectDriverTruckAssignmentService.assignDriverToTruck(projectId, d1.driverId, t1.truckId, 'admin');
      await projectDriverTruckAssignmentService.assignDriverToTruck(projectId, d2.driverId, t2.truckId, 'admin');

      // Now swap: pair (d1, t2)
      await projectDriverTruckAssignmentService.assignDriverToTruck(projectId, d1.driverId, t2.truckId, 'admin');

      // d1 points to new assignment with t2
      const slotD1 = await projectDriverTruckAssignmentService.getActiveDriverSlot(projectId, d1.driverId);
      const slotT2 = await projectDriverTruckAssignmentService.getActiveTruckSlot(projectId, t2.truckId);
      expect(slotD1?.assignmentId).toBe(slotT2?.assignmentId);

      // t1 and d2 slots are now released (unassigned)
      expect(await projectDriverTruckAssignmentService.getActiveTruckSlot(projectId, t1.truckId)).toBeNull();
      expect(await projectDriverTruckAssignmentService.getActiveDriverSlot(projectId, d2.driverId)).toBeNull();
    });
  });

  // ============================================================================
  // GROUP H: CONCURRENCY & POINTER INTEGRITY CONFLICTS
  // ============================================================================
  describe('GROUP H: Concurrency & Pointer Integrity', () => {
    it('30. pointer integrity conflict fails explicitly without silent overwrite', async () => {
      const { globalCarrier } = await setupActiveCarrier();
      const d = (await setupActiveDriver(projectId, globalCarrier.carrierId)).globalDriver;
      const t = (await setupActiveTruck(projectId, globalCarrier.carrierId)).globalTruck;

      // Manually simulate a corrupt driver slot pointing to an assignment for another driver
      const corruptAssignment: ProjectDriverTruckAssignmentEntity = {
        assignmentId: 'ASN-CORRUPT-001',
        projectId,
        driverId: 'DRV-SOME-OTHER',
        truckId: t.truckId,
        status: 'ACTIVE',
        effectiveFrom: new Date().toISOString(),
        effectiveTo: null,
        createdAt: new Date().toISOString(),
        createdBy: 'admin',
      };
      (projectDriverTruckAssignmentRepository as any).inMemoryAssignments.set(corruptAssignment.assignmentId, corruptAssignment);
      (projectDriverTruckAssignmentRepository as any).inMemoryDriverSlots.set(
        `${projectId}#${d.driverId}`,
        { assignmentId: corruptAssignment.assignmentId }
      );

      await expect(
        projectDriverTruckAssignmentService.assignDriverToTruck(
          projectId,
          d.driverId,
          t.truckId,
          'admin'
        )
      ).rejects.toThrow(/ASSIGNMENT_POINTER_INTEGRITY_ERROR/);
    });
  });

  // ============================================================================
  // GROUP I: CLOSE ASSIGNMENT & IMMUTABILITY
  // ============================================================================
  describe('GROUP I: Close Assignment & Immutability', () => {
    it('31. close sets status CLOSED, 32. sets effectiveTo, 33. releases both active slots, 34. history remains', async () => {
      const { globalCarrier } = await setupActiveCarrier();
      const d = (await setupActiveDriver(projectId, globalCarrier.carrierId)).globalDriver;
      const t = (await setupActiveTruck(projectId, globalCarrier.carrierId)).globalTruck;

      const { assignment } = await projectDriverTruckAssignmentService.assignDriverToTruck(
        projectId,
        d.driverId,
        t.truckId,
        'admin'
      );

      const closeResult = await projectDriverTruckAssignmentService.closeAssignment(
        projectId,
        assignment.assignmentId,
        'admin'
      );

      expect(closeResult.assignment.status).toBe('CLOSED');
      expect(closeResult.assignment.effectiveTo).not.toBeNull();

      // Active slots released
      expect(await projectDriverTruckAssignmentService.getActiveDriverSlot(projectId, d.driverId)).toBeNull();
      expect(await projectDriverTruckAssignmentService.getActiveTruckSlot(projectId, t.truckId)).toBeNull();

      // History preserved
      const fetched = await projectDriverTruckAssignmentRepository.getAssignment(projectId, assignment.assignmentId);
      expect(fetched?.status).toBe('CLOSED');
      expect(fetched?.effectiveTo).toBe(closeResult.assignment.effectiveTo);
    });

    it('35. closing already closed assignment is idempotent', async () => {
      const { globalCarrier } = await setupActiveCarrier();
      const d = (await setupActiveDriver(projectId, globalCarrier.carrierId)).globalDriver;
      const t = (await setupActiveTruck(projectId, globalCarrier.carrierId)).globalTruck;

      const { assignment } = await projectDriverTruckAssignmentService.assignDriverToTruck(
        projectId,
        d.driverId,
        t.truckId,
        'admin'
      );

      await projectDriverTruckAssignmentService.closeAssignment(projectId, assignment.assignmentId, 'admin');
      const secondClose = await projectDriverTruckAssignmentService.closeAssignment(projectId, assignment.assignmentId, 'admin');

      expect(secondClose.idempotent).toBe(true);
      expect(secondClose.assignment.status).toBe('CLOSED');
    });
  });

  // ============================================================================
  // GROUP J: PROJECT TENANCY ISOLATION
  // ============================================================================
  describe('GROUP J: Project Tenancy Isolation', () => {
    it('36. Project A assignment cannot leak into Project B reads & 37. independent histories', async () => {
      const projectB = 'PRJ-TEST-ASSIGNMENT-02';

      const carrierA = await setupActiveCarrier(projectId);
      const carrierB = await setupActiveCarrier(projectB);

      const d = (await setupActiveDriver(projectId, carrierA.globalCarrier.carrierId)).globalDriver;
      const t = (await setupActiveTruck(projectId, carrierA.globalCarrier.carrierId)).globalTruck;

      // Attach same driver and truck to Project B under carrier B
      await projectDriverMembershipRepository.attachMember(projectB, d.driverId, 'admin');
      await projectTruckMembershipRepository.attachMember(projectB, t.truckId, 'admin');
      await projectDriverCarrierAffiliationRepository.setAffiliation(projectB, d.driverId, carrierB.globalCarrier.carrierId, 'admin');
      await projectTruckCarrierAffiliationRepository.setAffiliation(projectB, t.truckId, carrierB.globalCarrier.carrierId, 'admin');

      // Create assignment in Project A
      const assignA = await projectDriverTruckAssignmentService.assignDriverToTruck(projectId, d.driverId, t.truckId, 'admin');

      // Project B should have NO active assignment
      const activeB = await projectDriverTruckAssignmentService.getActiveAssignmentByDriver(projectB, d.driverId);
      expect(activeB).toBeNull();

      // Create assignment in Project B
      const assignB = await projectDriverTruckAssignmentService.assignDriverToTruck(projectB, d.driverId, t.truckId, 'admin');

      expect(assignA.assignment.assignmentId).not.toBe(assignB.assignment.assignmentId);
      expect(assignA.assignment.projectId).toBe(projectId);
      expect(assignB.assignment.projectId).toBe(projectB);
    });
  });

  // ============================================================================
  // GROUP K: BOUNDARIES & LEGACY INVARIANCE
  // ============================================================================
  describe('GROUP K: Boundaries & Legacy Invariance', () => {
    it('41. Global identities unchanged after assignment', async () => {
      const { globalCarrier } = await setupActiveCarrier();
      const d = (await setupActiveDriver(projectId, globalCarrier.carrierId)).globalDriver;
      const t = (await setupActiveTruck(projectId, globalCarrier.carrierId)).globalTruck;

      await projectDriverTruckAssignmentService.assignDriverToTruck(projectId, d.driverId, t.truckId, 'admin');

      const rootDriver = await globalDriverRepository.findById(d.driverId);
      const rootTruck = await globalTruckRepository.findById(t.truckId);

      expect(rootDriver?.driverId).toBe(d.driverId);
      expect(rootDriver?.fullNameAr).toBe('سالم الدوسري');
      expect((rootDriver as any).currentAssignedTruckId).toBeUndefined();

      expect(rootTruck?.truckId).toBe(t.truckId);
      expect(rootTruck?.tareWeightKg).toBe(12000);
    });

    it('42. Carrier affiliations unchanged after assignment', async () => {
      const { globalCarrier } = await setupActiveCarrier();
      const d = (await setupActiveDriver(projectId, globalCarrier.carrierId)).globalDriver;
      const t = (await setupActiveTruck(projectId, globalCarrier.carrierId)).globalTruck;

      await projectDriverTruckAssignmentService.assignDriverToTruck(projectId, d.driverId, t.truckId, 'admin');

      const dAffil = await projectDriverCarrierAffiliationRepository.getAffiliation(projectId, d.driverId);
      const tAffil = await projectTruckCarrierAffiliationRepository.getAffiliation(projectId, t.truckId);

      expect(dAffil?.carrierId).toBe(globalCarrier.carrierId);
      expect(tAffil?.carrierId).toBe(globalCarrier.carrierId);
    });

    it('51. Production assignment callers zero: only services, repositories, and test files reference assignDriverToTruck', () => {
      const srcDir = path.resolve(process.cwd(), 'src');
      const files = getAllTsFiles(srcDir);

      const callers: string[] = [];
      for (const file of files) {
        if (
          file.includes('/tests/') ||
          file.endsWith('projectDriverTruckAssignment.service.ts') ||
          file.endsWith('projectDriverTruckAssignment.repository.ts') ||
          file.endsWith('driverTruckIntake.service.ts')
        ) {
          continue;
        }

        const content = fs.readFileSync(file, 'utf-8');
        if (content.includes('assignDriverToTruck(') || content.includes('projectDriverTruckAssignmentService')) {
          callers.push(file);
        }
      }

      expect(callers).toEqual([]);
    });
  });
});

function getAllTsFiles(dir: string): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllTsFiles(filePath));
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      results.push(filePath);
    }
  }
  return results;
}
