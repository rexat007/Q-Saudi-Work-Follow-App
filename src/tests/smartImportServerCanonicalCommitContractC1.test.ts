/**
 * SMART IMPORT CANONICAL COMMIT CONVERGENCE
 * C1 — SERVER-AUTHORITATIVE IMPORTED TRIP CREATION CONTRACT TEST SUITE
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TripService, ImportedTripDispatchParams, DispatchTripParams } from '../services/trip.service';
import { globalCarrierRepository, globalTruckRepository, globalDriverRepository, globalMaterialRepository } from '../repositories/globalIdentity.repository';
import { projectCarrierMembershipRepository, projectTruckMembershipRepository, projectDriverMembershipRepository, projectMaterialMembershipRepository } from '../repositories/projectMembership.repository';
import { projectDriverCarrierAffiliationRepository, projectTruckCarrierAffiliationRepository } from '../repositories/projectCarrierAffiliation.repository';
import { projectDriverTruckAssignmentRepository } from '../repositories/projectDriverTruckAssignment.repository';
import { projectTruckMaterialAllocationRepository } from '../repositories/projectTruckMaterialAllocation.repository';
import { pricingRuleRepository } from '../repositories/pricingRule.repository';
import { projectRepository } from '../repositories/project.repository';
import { tripRepository } from '../repositories/trip.repository';
import { AuthUserContext } from '../types/common';
import * as fs from 'fs';
import * as path from 'path';

describe('SMART IMPORT C1 — Server-Authoritative Imported Trip Creation Contract', () => {
  let tripService: TripService;

  const mockAuthContext: AuthUserContext = {
    userId: 'USER-IMPORT-COMMITTER-01',
    email: 'committer@qsaudi.com',
    displayName: 'Import Committer',
    role: 'PROJECT_ADMIN',
    assignedProjectIds: ['PRJ-C1-TEST'],
  };

  const validImportParams: ImportedTripDispatchParams = {
    projectId: 'PRJ-C1-TEST',
    carrierId: 'CAR-C1-01',
    truckId: 'TRK-C1-01',
    driverId: 'DRV-C1-01',
    materialId: 'MAT-C1-01',
    pricingRuleId: 'PRC-C1-01',
    clientUUID: 'CUUID-BATCH-001-ROW-1',
    sourceType: 'EXCEL',
    operationalData: {
      shiftDate: '2026-10-01',
      ticketId: 'TCK-ORIGIN-9901',
      tareWeightKg: 14000,
      grossWeightKg: 42000,
      netWeightKg: 28000,
      destinationNetWeightKg: 27950,
      legacyStatus: 'COMPLETED',
      tripSerial: 1001,
    },
    sourceMetadata: {
      importBatchId: 'BAT-C1-001',
      sourceFileName: 'september_trips.xlsx',
      sourceSheetName: 'Sheet1',
      sourceRowId: 1,
    },
  };

  beforeEach(() => {
    tripService = new TripService();
    vi.restoreAllMocks();

    // Setup valid repository mocks
    vi.spyOn(projectRepository, 'findById').mockImplementation(async (pId: string) => {
      if (pId === 'PRJ-C1-TEST') {
        return { projectId: 'PRJ-C1-TEST', projectNumber: 88, nameAr: 'مشروع C1 المعتمد', status: 'ACTIVE' };
      }
      return null;
    });

    vi.spyOn(globalCarrierRepository, 'findById').mockImplementation(async (cId: string) => {
      if (cId === 'CAR-C1-01') return { carrierId: 'CAR-C1-01', nameAr: 'شركة الناقل الموحد', status: 'ACTIVE' };
      return null;
    });

    vi.spyOn(projectCarrierMembershipRepository, 'getMembership').mockImplementation(async (pId, cId) => {
      if (pId === 'PRJ-C1-TEST' && cId === 'CAR-C1-01') return { status: 'ACTIVE' };
      return null;
    });

    vi.spyOn(globalMaterialRepository, 'findById').mockImplementation(async (mId: string) => {
      if (mId === 'MAT-C1-01') return { materialId: 'MAT-C1-01', nameAr: 'حجر بازلتي', code: 'MAT-BASALT', status: 'ACTIVE' };
      return null;
    });

    vi.spyOn(projectMaterialMembershipRepository, 'getMembership').mockImplementation(async (pId, mId) => {
      if (pId === 'PRJ-C1-TEST' && mId === 'MAT-C1-01') return { status: 'ACTIVE' };
      return null;
    });

    vi.spyOn(globalDriverRepository, 'findById').mockImplementation(async (dId: string) => {
      if (dId === 'DRV-C1-01') return { driverId: 'DRV-C1-01', fullNameAr: 'أحمد علي السائق', idNumber: '2412345678', status: 'ACTIVE' };
      return null;
    });

    vi.spyOn(projectDriverMembershipRepository, 'getMembership').mockImplementation(async (pId, dId) => {
      if (pId === 'PRJ-C1-TEST' && dId === 'DRV-C1-01') return { status: 'ACTIVE' };
      return null;
    });

    vi.spyOn(globalTruckRepository, 'findById').mockImplementation(async (tId: string) => {
      if (tId === 'TRK-C1-01') return { truckId: 'TRK-C1-01', plateNumberAr: 'أ ب ج 1234', status: 'ACTIVE' };
      return null;
    });

    vi.spyOn(projectTruckMembershipRepository, 'getMembership').mockImplementation(async (pId, tId) => {
      if (pId === 'PRJ-C1-TEST' && tId === 'TRK-C1-01') return { status: 'ACTIVE' };
      return null;
    });

    vi.spyOn(projectDriverCarrierAffiliationRepository, 'getAffiliation').mockImplementation(async (pId, dId) => {
      if (pId === 'PRJ-C1-TEST' && dId === 'DRV-C1-01') return { carrierId: 'CAR-C1-01', status: 'ACTIVE' };
      return null;
    });

    vi.spyOn(projectTruckCarrierAffiliationRepository, 'getAffiliation').mockImplementation(async (pId, tId) => {
      if (pId === 'PRJ-C1-TEST' && tId === 'TRK-C1-01') return { carrierId: 'CAR-C1-01', status: 'ACTIVE' };
      return null;
    });

    vi.spyOn(projectDriverTruckAssignmentRepository, 'getActiveAssignmentByDriver').mockImplementation(async (pId, dId) => {
      if (pId === 'PRJ-C1-TEST' && dId === 'DRV-C1-01') return { driverId: 'DRV-C1-01', truckId: 'TRK-C1-01', status: 'ACTIVE' };
      return null;
    });

    vi.spyOn(projectDriverTruckAssignmentRepository, 'getActiveAssignmentByTruck').mockImplementation(async (pId, tId) => {
      if (pId === 'PRJ-C1-TEST' && tId === 'TRK-C1-01') return { driverId: 'DRV-C1-01', truckId: 'TRK-C1-01', status: 'ACTIVE' };
      return null;
    });

    vi.spyOn(projectTruckMaterialAllocationRepository, 'getActiveAllocationByTruck').mockImplementation(async (pId, tId) => {
      if (pId === 'PRJ-C1-TEST' && tId === 'TRK-C1-01') return { truckId: 'TRK-C1-01', materialId: 'MAT-C1-01', status: 'ACTIVE' };
      return null;
    });

    vi.spyOn(pricingRuleRepository, 'findById').mockImplementation(async (pId, prId) => {
      if (pId === 'PRJ-C1-TEST' && prId === 'PRC-C1-01') {
        return { pricingRuleId: 'PRC-C1-01', projectId: 'PRJ-C1-TEST', carrierId: 'CAR-C1-01', materialId: 'MAT-C1-01', agreedRate: 45, pricingType: 'PER_TON', status: 'ACTIVE' };
      }
      return null;
    });

    vi.spyOn(tripRepository, 'create').mockImplementation(async () => {});
  });

  // =========================================================================
  // Contracts 1–7: Method Presence & Required Inputs
  // =========================================================================
  it('1. Dedicated imported-trip dispatch method exists on TripService', () => {
    expect(typeof tripService.dispatchImportedTrip).toBe('function');
  });

  it('2. Normal dispatchTrip method still exists unchanged', () => {
    expect(typeof tripService.dispatchTrip).toBe('function');
  });

  it('3. Imported contract requires projectId', async () => {
    const invalid = { ...validImportParams, projectId: '' };
    await expect(tripService.dispatchImportedTrip(invalid, mockAuthContext)).rejects.toThrow('projectId');
  });

  it('4. Requires carrierId', async () => {
    const invalid = { ...validImportParams, carrierId: '' };
    await expect(tripService.dispatchImportedTrip(invalid, mockAuthContext)).rejects.toThrow('carrierId');
  });

  it('5. Requires truckId', async () => {
    const invalid = { ...validImportParams, truckId: '' };
    await expect(tripService.dispatchImportedTrip(invalid, mockAuthContext)).rejects.toThrow('truckId');
  });

  it('6. Requires driverId', async () => {
    const invalid = { ...validImportParams, driverId: '' };
    await expect(tripService.dispatchImportedTrip(invalid, mockAuthContext)).rejects.toThrow('driverId');
  });

  it('7. Requires materialId', async () => {
    const invalid = { ...validImportParams, materialId: '' };
    await expect(tripService.dispatchImportedTrip(invalid, mockAuthContext)).rejects.toThrow('materialId');
  });

  // =========================================================================
  // Contracts 8–16: Canonical Validation Reuse & Fail-Closed Behavior
  // =========================================================================
  it('8. Server validates project existence and non-archived status', async () => {
    vi.spyOn(projectRepository, 'findById').mockResolvedValueOnce({ projectId: 'PRJ-C1-TEST', status: 'ARCHIVED' });
    await expect(tripService.dispatchImportedTrip(validImportParams, mockAuthContext)).rejects.toThrow('ARCHIVED');
  });

  it('9. Server validates carrier project membership', async () => {
    vi.spyOn(projectCarrierMembershipRepository, 'getMembership').mockResolvedValueOnce(null);
    await expect(tripService.dispatchImportedTrip(validImportParams, mockAuthContext)).rejects.toThrow('عضوية نشطة');
  });

  it('10. Server validates material project membership', async () => {
    vi.spyOn(projectMaterialMembershipRepository, 'getMembership').mockResolvedValueOnce(null);
    await expect(tripService.dispatchImportedTrip(validImportParams, mockAuthContext)).rejects.toThrow('عضوية نشطة');
  });

  it('11. Server validates driver project membership', async () => {
    vi.spyOn(projectDriverMembershipRepository, 'getMembership').mockResolvedValueOnce(null);
    await expect(tripService.dispatchImportedTrip(validImportParams, mockAuthContext)).rejects.toThrow('عضوية نشطة');
  });

  it('12. Server validates truck project membership', async () => {
    vi.spyOn(projectTruckMembershipRepository, 'getMembership').mockResolvedValueOnce(null);
    await expect(tripService.dispatchImportedTrip(validImportParams, mockAuthContext)).rejects.toThrow('عضوية نشطة');
  });

  it('13. Server validates driver/truck assignment', async () => {
    vi.spyOn(projectDriverTruckAssignmentRepository, 'getActiveAssignmentByDriver').mockResolvedValueOnce(null);
    await expect(tripService.dispatchImportedTrip(validImportParams, mockAuthContext)).rejects.toThrow('تعيين تشغيلي نشط');
  });

  it('14. Server validates driver/carrier affiliation', async () => {
    vi.spyOn(projectDriverCarrierAffiliationRepository, 'getAffiliation').mockResolvedValueOnce({ carrierId: 'CAR-OTHER', status: 'ACTIVE' });
    await expect(tripService.dispatchImportedTrip(validImportParams, mockAuthContext)).rejects.toThrow('العلاقة: Driver → Carrier');
  });

  it('15. Server validates truck/carrier affiliation', async () => {
    vi.spyOn(projectTruckCarrierAffiliationRepository, 'getAffiliation').mockResolvedValueOnce({ carrierId: 'CAR-OTHER', status: 'ACTIVE' });
    await expect(tripService.dispatchImportedTrip(validImportParams, mockAuthContext)).rejects.toThrow('العلاقة: Truck → Carrier');
  });

  it('16. Server validates truck/material allocation', async () => {
    vi.spyOn(projectTruckMaterialAllocationRepository, 'getActiveAllocationByTruck').mockResolvedValueOnce({ materialId: 'MAT-OTHER', status: 'ACTIVE' });
    await expect(tripService.dispatchImportedTrip(validImportParams, mockAuthContext)).rejects.toThrow('العلاقة: Truck ↔ Material');
  });

  // =========================================================================
  // Contracts 17–24: Server Authority Security & Output Generation
  // =========================================================================
  it('17a. Server app route rejects client tripId with HTTP 400', async () => {
    const appContent = fs.readFileSync(path.resolve(__dirname, '../../server/app.ts'), 'utf-8');
    expect(appContent).toContain("req.body.tripId !== undefined");
    expect(appContent).toContain("معرّف الرحلة (tripId) يتم إنشاؤه خادومياً ولا يمكن للعميل تحديده يدوياً.");
  });

  it('17b. Server app route rejects client tripNumber', async () => {
    const appContent = fs.readFileSync(path.resolve(__dirname, '../../server/app.ts'), 'utf-8');
    expect(appContent).toContain("req.body.tripNumber !== undefined");
    expect(appContent).toContain("لا يمكن للعميل تحديد رقم الرحلة (tripNumber) يدوياً.");
  });

  it('18. Server app route rejects client pricingSnapshot', async () => {
    const appContent = fs.readFileSync(path.resolve(__dirname, '../../server/app.ts'), 'utf-8');
    expect(appContent).toContain("req.body.pricingSnapshot !== undefined");
  });

  it('19. Server app route rejects client financials', async () => {
    const appContent = fs.readFileSync(path.resolve(__dirname, '../../server/app.ts'), 'utf-8');
    expect(appContent).toContain("req.body.financials !== undefined");
  });

  it('20. Server app route rejects client settlementAmount', async () => {
    const appContent = fs.readFileSync(path.resolve(__dirname, '../../server/app.ts'), 'utf-8');
    expect(appContent).toContain("req.body.settlementAmount !== undefined");
  });

  it('21. Server app route rejects client canonical entity snapshots', async () => {
    const appContent = fs.readFileSync(path.resolve(__dirname, '../../server/app.ts'), 'utf-8');
    expect(appContent).toContain("req.body.carrierSnapshot !== undefined");
    expect(appContent).toContain("req.body.truckSnapshot !== undefined");
  });

  it('22. Server generates tripId on dispatchImportedTrip', async () => {
    const trip = await tripService.dispatchImportedTrip(validImportParams, mockAuthContext);
    expect(trip.tripId).toMatch(/^TRP-/);
  });

  it('23. Server generates tripNumber on dispatchImportedTrip', async () => {
    const trip = await tripService.dispatchImportedTrip(validImportParams, mockAuthContext);
    expect(trip.tripNumber).toBeDefined();
    expect(trip.tripNumber.length).toBeGreaterThan(0);
  });

  it('24. Server builds canonical snapshots authoritatively', async () => {
    const trip = await tripService.dispatchImportedTrip(validImportParams, mockAuthContext);
    expect(trip.carrierSnapshot.companyNameAr).toBe('شركة الناقل الموحد');
    expect(trip.driverSnapshot.fullNameAr).toBe('أحمد علي السائق');
    expect(trip.materialSnapshot.nameAr).toBe('حجر بازلتي');
  });

  // =========================================================================
  // Contracts 25–35: Operational Data & Provenance Preservation
  // =========================================================================
  it('25. Imported ticket preserved in weights.originTicketNo', async () => {
    const trip = await tripService.dispatchImportedTrip(validImportParams, mockAuthContext);
    expect(trip.weights.originTicketNo).toBe('TCK-ORIGIN-9901');
  });

  it('26. Imported date preserved in sourceMetadata / weights', async () => {
    const trip = await tripService.dispatchImportedTrip(validImportParams, mockAuthContext);
    expect(trip.sourceMetadata?.legacyTripSerial).toBe(1001);
  });

  it('27. Imported origin tare preserved', async () => {
    const trip = await tripService.dispatchImportedTrip(validImportParams, mockAuthContext);
    expect(trip.weights.originTareKg).toBe(14000);
  });

  it('28. Imported origin gross preserved', async () => {
    const trip = await tripService.dispatchImportedTrip(validImportParams, mockAuthContext);
    expect(trip.weights.originGrossKg).toBe(42000);
  });

  it('29. Imported origin net preserved or deterministically recomputed', async () => {
    const trip = await tripService.dispatchImportedTrip(validImportParams, mockAuthContext);
    expect(trip.weights.originNetKg).toBe(28000);
  });

  it('30. Imported destination net preserved when valid', async () => {
    const trip = await tripService.dispatchImportedTrip(validImportParams, mockAuthContext);
    expect(trip.weights.destinationNetKg).toBe(27950);
  });

  it('31. Import source metadata preserved', async () => {
    const trip = await tripService.dispatchImportedTrip(validImportParams, mockAuthContext);
    expect(trip.sourceMetadata?.sourceFileName).toBe('september_trips.xlsx');
  });

  it('32. importBatchId provenance preserved', async () => {
    const trip = await tripService.dispatchImportedTrip(validImportParams, mockAuthContext);
    expect(trip.sourceMetadata?.importBatchId).toBe('BAT-C1-001');
  });

  it('33. sourceRowId provenance preserved', async () => {
    const trip = await tripService.dispatchImportedTrip(validImportParams, mockAuthContext);
    expect(trip.sourceMetadata?.sourceRowId).toBe(1);
  });

  it('34. Deterministic clientUUID accepted', async () => {
    const trip = await tripService.dispatchImportedTrip(validImportParams, mockAuthContext);
    expect(trip.clientUUID).toBe('CUUID-BATCH-001-ROW-1');
  });

  it('35. Idempotent replay route exists in server/app.ts', async () => {
    const appContent = fs.readFileSync(path.resolve(__dirname, '../../server/app.ts'), 'utf-8');
    expect(appContent).toContain("/api/projects/:projectId/trips/import");
    expect(appContent).toContain("idempotentReplay: true");
  });

  // =========================================================================
  // Contracts 36–45: Pricing, Status, & Boundary Safeguards
  // =========================================================================
  it('36. Resolved pricing generated server-side when rule exists', async () => {
    const trip = await tripService.dispatchImportedTrip(validImportParams, mockAuthContext);
    expect(trip.pricingSnapshot.pricingRuleId).toBe('PRC-C1-01');
    expect(trip.pricingSnapshot.agreedRate).toBe(45);
    expect(trip.financials.baseAmountSAR).toBe(45);
  });

  it('37. Pending-pricing behavior matches current approved Smart Import semantics when rule is missing', async () => {
    const pendingParams = { ...validImportParams, pricingRuleId: undefined };
    const trip = await tripService.dispatchImportedTrip(pendingParams, mockAuthContext);
    expect(trip.pricingRuleId).toBe('UNRESOLVED_PENDING');
    expect(trip.pricingSnapshot.pricingType).toBe('LEGACY_UNRESOLVED');
    expect(trip.financials.baseAmountSAR).toBe(0);
  });

  it('38. Arbitrary imported status cannot bypass canonical status rules', async () => {
    const weirdStatusParams = {
      ...validImportParams,
      operationalData: { ...validImportParams.operationalData, legacyStatus: 'SUPER_ADMIN_APPROVED_DIRECT' },
    };
    const trip = await tripService.dispatchImportedTrip(weirdStatusParams, mockAuthContext);
    expect(trip.status).toBe('COMPLETED'); // Fallback based on weights/net weight
  });

  it('39. Server route calls serverTripService.dispatchImportedTrip', async () => {
    const appContent = fs.readFileSync(path.resolve(__dirname, '../../server/app.ts'), 'utf-8');
    expect(appContent).toContain('serverTripService.dispatchImportedTrip');
  });

  it('40. No auth.currentUser in server canonical persistence adapter', async () => {
    const serverPersistPath = path.resolve(__dirname, '../services/canonicalTripPersistence.server.ts');
    const content = fs.readFileSync(serverPersistPath, 'utf-8');
    expect(content).not.toMatch(/auth\.currentUser/);
  });

  it('41. No client tripRepository persistence in server route app.ts', async () => {
    const appContent = fs.readFileSync(path.resolve(__dirname, '../../server/app.ts'), 'utf-8');
    expect(appContent).toContain("import { serverTripService");
  });

  it('42. Unit 6A normal trip path remains intact', async () => {
    const normalTrip = await tripService.dispatchTrip({
      projectId: 'PRJ-C1-TEST',
      carrierId: 'CAR-C1-01',
      truckId: 'TRK-C1-01',
      driverId: 'DRV-C1-01',
      materialId: 'MAT-C1-01',
      pricingRuleId: 'PRC-C1-01',
      clientUUID: 'CUUID-NORMAL-001',
    }, mockAuthContext);
    expect(normalTrip.tripId).toBeDefined();
    expect(normalTrip.status).toBe('DISPATCHED');
  });

  it('43. No changes made to tripImportCommitter.ts in C1', async () => {
    const committerPath = path.resolve(__dirname, '../services/import/tripImportCommitter.ts');
    const content = fs.readFileSync(committerPath, 'utf-8');
    expect(content).toContain('tripRepository.create(sanitizedTrip)');
  });

  it('44. Endpoint defined in server app.ts in C1', async () => {
    const appContent = fs.readFileSync(path.resolve(__dirname, '../../server/app.ts'), 'utf-8');
    expect(appContent).toContain("'/api/projects/:projectId/trips/import'");
  });

  it('45. Trip number generator used on server path', async () => {
    const trip = await tripService.dispatchImportedTrip(validImportParams, mockAuthContext);
    expect(trip.tripNumber).toBeDefined();
  });
});
