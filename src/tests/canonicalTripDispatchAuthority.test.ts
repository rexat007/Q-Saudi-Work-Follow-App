import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TripService, DispatchTripParams } from '../services/trip.service';
import {
  globalCarrierRepository,
  globalTruckRepository,
  globalDriverRepository,
  globalMaterialRepository,
} from '../repositories/globalIdentity.repository';
import {
  projectCarrierMembershipRepository,
  projectTruckMembershipRepository,
  projectDriverMembershipRepository,
  projectMaterialMembershipRepository,
} from '../repositories/projectMembership.repository';
import {
  projectDriverCarrierAffiliationRepository,
  projectTruckCarrierAffiliationRepository,
} from '../repositories/projectCarrierAffiliation.repository';
import { projectDriverTruckAssignmentRepository } from '../repositories/projectDriverTruckAssignment.repository';
import { projectTruckMaterialAllocationRepository } from '../repositories/projectTruckMaterialAllocation.repository';
import { pricingRuleRepository } from '../repositories/pricingRule.repository';
import { projectRepository } from '../repositories/project.repository';
import { tripRepository } from '../repositories/trip.repository';
import { AuthUserContext } from '../types/common';
import * as fs from 'fs';
import * as path from 'path';

describe('Canonical Trip Dispatch Authority Convergence (Phase 6)', () => {
  let tripService: TripService;

  const mockAuthContext: AuthUserContext = {
    userId: 'DISPATCHER-CANONICAL-01',
    email: 'dispatcher@qsaudi.com',
    displayName: 'Canonical Dispatcher',
    role: 'DISPATCHER',
    assignedProjectIds: ['PRJ-CANONICAL-01'],
  };

  const validParams: DispatchTripParams = {
    projectId: 'PRJ-CANONICAL-01',
    carrierId: 'CAR-GLOBAL-01',
    truckId: 'TRK-GLOBAL-01',
    driverId: 'DRV-GLOBAL-01',
    materialId: 'MAT-GLOBAL-01',
    pricingRuleId: 'PRC-RULE-01',
    clientUUID: 'CUUID-TEST-001',
  };

  beforeEach(() => {
    tripService = new TripService();
    vi.restoreAllMocks();

    // 1. Mock Project
    vi.spyOn(projectRepository, 'findById').mockImplementation(async (pId: string) => {
      if (pId === 'PRJ-CANONICAL-01') {
        return {
          projectId: 'PRJ-CANONICAL-01',
          projectNumber: 105,
          nameAr: 'مشروع البحر الأحمر النموذجي',
          nameEn: 'Red Sea Canonical Project',
          status: 'ACTIVE',
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
        } as any;
      }
      return null;
    });

    // 2. Mock Global Carrier & Membership
    vi.spyOn(globalCarrierRepository, 'findById').mockImplementation(async (cId: string) => {
      if (cId === 'CAR-GLOBAL-01') {
        return {
          carrierId: 'CAR-GLOBAL-01',
          nameAr: 'شركة اليمامة للخدمات اللوجستية',
          commercialRegistrationNo: '1010887766',
          status: 'ACTIVE',
        } as any;
      }
      if (cId === 'CAR-GLOBAL-02') {
        return {
          carrierId: 'CAR-GLOBAL-02',
          nameAr: 'شركة الأفق للنقليات',
          commercialRegistrationNo: '1010998877',
          status: 'ACTIVE',
        } as any;
      }
      if (cId === 'CAR-INACTIVE') {
        return {
          carrierId: 'CAR-INACTIVE',
          nameAr: 'ناقل معطل',
          commercialRegistrationNo: '1010000000',
          status: 'INACTIVE',
        } as any;
      }
      return null;
    });

    vi.spyOn(projectCarrierMembershipRepository, 'getMembership').mockImplementation(async (pId: string, cId: string) => {
      if (pId === 'PRJ-CANONICAL-01' && (cId === 'CAR-GLOBAL-01' || cId === 'CAR-GLOBAL-02')) {
        return {
          membershipId: `MEM-CAR-${cId}`,
          projectId: pId,
          entityId: cId,
          status: 'ACTIVE',
        } as any;
      }
      if (pId === 'PRJ-CANONICAL-01' && cId === 'CAR-MEM-INACTIVE') {
        return {
          membershipId: 'MEM-CAR-INACT',
          projectId: pId,
          entityId: cId,
          status: 'INACTIVE',
        } as any;
      }
      return null;
    });

    // 3. Mock Global Material & Membership
    vi.spyOn(globalMaterialRepository, 'findById').mockImplementation(async (mId: string) => {
      if (mId === 'MAT-GLOBAL-01') {
        return {
          materialId: 'MAT-GLOBAL-01',
          code: 'AGG_3_4',
          nameAr: 'حصى متدرج 3/4 إنش',
          unitOfMeasure: 'TON',
          status: 'ACTIVE',
        } as any;
      }
      if (mId === 'MAT-GLOBAL-02') {
        return {
          materialId: 'MAT-GLOBAL-02',
          code: 'SUB_BASE',
          nameAr: 'طبقة تحت الأساس صب بيس',
          unitOfMeasure: 'TON',
          status: 'ACTIVE',
        } as any;
      }
      if (mId === 'MAT-INACTIVE') {
        return {
          materialId: 'MAT-INACTIVE',
          code: 'INACT',
          nameAr: 'مادة معطلة',
          unitOfMeasure: 'TON',
          status: 'INACTIVE',
        } as any;
      }
      return null;
    });

    vi.spyOn(projectMaterialMembershipRepository, 'getMembership').mockImplementation(async (pId: string, mId: string) => {
      if (pId === 'PRJ-CANONICAL-01' && (mId === 'MAT-GLOBAL-01' || mId === 'MAT-GLOBAL-02')) {
        return {
          membershipId: `MEM-MAT-${mId}`,
          projectId: pId,
          entityId: mId,
          status: 'ACTIVE',
        } as any;
      }
      if (pId === 'PRJ-CANONICAL-01' && mId === 'MAT-MEM-INACTIVE') {
        return {
          membershipId: 'MEM-MAT-INACT',
          projectId: pId,
          entityId: mId,
          status: 'INACTIVE',
        } as any;
      }
      return null;
    });

    // 4. Mock Global Driver & Membership
    vi.spyOn(globalDriverRepository, 'findById').mockImplementation(async (dId: string) => {
      if (dId === 'DRV-GLOBAL-01') {
        return {
          driverId: 'DRV-GLOBAL-01',
          fullNameAr: 'سالم عبدالله القحطاني',
          nationalId: '1098765432',
          phone: '0501234567',
          status: 'ACTIVE',
        } as any;
      }
      if (dId === 'DRV-INACTIVE') {
        return {
          driverId: 'DRV-INACTIVE',
          fullNameAr: 'سائق معطل',
          nationalId: '1098760000',
          phone: '0500000000',
          status: 'INACTIVE',
        } as any;
      }
      return null;
    });

    vi.spyOn(projectDriverMembershipRepository, 'getMembership').mockImplementation(async (pId: string, dId: string) => {
      if (pId === 'PRJ-CANONICAL-01' && dId === 'DRV-GLOBAL-01') {
        return {
          membershipId: 'MEM-DRV-01',
          projectId: pId,
          entityId: dId,
          status: 'ACTIVE',
        } as any;
      }
      if (pId === 'PRJ-CANONICAL-01' && dId === 'DRV-MEM-INACTIVE') {
        return {
          membershipId: 'MEM-DRV-INACT',
          projectId: pId,
          entityId: dId,
          status: 'INACTIVE',
        } as any;
      }
      return null;
    });

    // 5. Mock Global Truck & Membership
    vi.spyOn(globalTruckRepository, 'findById').mockImplementation(async (tId: string) => {
      if (tId === 'TRK-GLOBAL-01') {
        return {
          truckId: 'TRK-GLOBAL-01',
          plate: 'أ ب ج 5566',
          normalizedPlate: '5566 JBA',
          tareWeightKg: 14200,
          legalPayloadLimitKg: 30000,
          status: 'ACTIVE',
        } as any;
      }
      if (tId === 'TRK-GLOBAL-02') {
        return {
          truckId: 'TRK-GLOBAL-02',
          plate: 'د هـ و 7788',
          normalizedPlate: '7788 WHD',
          tareWeightKg: 15000,
          legalPayloadLimitKg: 29000,
          status: 'ACTIVE',
        } as any;
      }
      if (tId === 'TRK-INACTIVE') {
        return {
          truckId: 'TRK-INACTIVE',
          plate: 'س ع ص 0000',
          normalizedPlate: '0000 SCE',
          tareWeightKg: 14000,
          legalPayloadLimitKg: 30000,
          status: 'INACTIVE',
        } as any;
      }
      return null;
    });

    vi.spyOn(projectTruckMembershipRepository, 'getMembership').mockImplementation(async (pId: string, tId: string) => {
      if (pId === 'PRJ-CANONICAL-01' && (tId === 'TRK-GLOBAL-01' || tId === 'TRK-GLOBAL-02')) {
        return {
          membershipId: `MEM-TRK-${tId}`,
          projectId: pId,
          entityId: tId,
          status: 'ACTIVE',
        } as any;
      }
      if (pId === 'PRJ-CANONICAL-01' && tId === 'TRK-MEM-INACTIVE') {
        return {
          membershipId: 'MEM-TRK-INACT',
          projectId: pId,
          entityId: tId,
          status: 'INACTIVE',
        } as any;
      }
      return null;
    });

    // 6. Mock Carrier Affiliations
    vi.spyOn(projectDriverCarrierAffiliationRepository, 'getAffiliation').mockImplementation(async (pId: string, dId: string) => {
      if (pId === 'PRJ-CANONICAL-01' && dId === 'DRV-GLOBAL-01') {
        return {
          affiliationId: 'AFF-DRV-01',
          projectId: pId,
          driverId: dId,
          carrierId: 'CAR-GLOBAL-01',
          status: 'ACTIVE',
        } as any;
      }
      return null;
    });

    vi.spyOn(projectTruckCarrierAffiliationRepository, 'getAffiliation').mockImplementation(async (pId: string, tId: string) => {
      if (pId === 'PRJ-CANONICAL-01' && tId === 'TRK-GLOBAL-01') {
        return {
          affiliationId: 'AFF-TRK-01',
          projectId: pId,
          truckId: tId,
          carrierId: 'CAR-GLOBAL-01',
          status: 'ACTIVE',
        } as any;
      }
      return null;
    });

    // 7. Mock Driver ↔ Truck Assignments
    vi.spyOn(projectDriverTruckAssignmentRepository, 'getActiveAssignmentByDriver').mockImplementation(async (pId: string, dId: string) => {
      if (pId === 'PRJ-CANONICAL-01' && dId === 'DRV-GLOBAL-01') {
        return {
          assignmentId: 'ASN-01',
          projectId: pId,
          driverId: 'DRV-GLOBAL-01',
          truckId: 'TRK-GLOBAL-01',
          status: 'ACTIVE',
          effectiveFrom: '2026-01-01',
          effectiveTo: null,
          createdAt: '2026-01-01',
          createdBy: 'DISPATCHER-01',
        };
      }
      return null;
    });

    vi.spyOn(projectDriverTruckAssignmentRepository, 'getActiveAssignmentByTruck').mockImplementation(async (pId: string, tId: string) => {
      if (pId === 'PRJ-CANONICAL-01' && tId === 'TRK-GLOBAL-01') {
        return {
          assignmentId: 'ASN-01',
          projectId: pId,
          driverId: 'DRV-GLOBAL-01',
          truckId: 'TRK-GLOBAL-01',
          status: 'ACTIVE',
          effectiveFrom: '2026-01-01',
          effectiveTo: null,
          createdAt: '2026-01-01',
          createdBy: 'DISPATCHER-01',
        };
      }
      return null;
    });

    // 8. Mock Truck ↔ Material Allocation
    vi.spyOn(projectTruckMaterialAllocationRepository, 'getActiveAllocationByTruck').mockImplementation(async (pId: string, tId: string) => {
      if (pId === 'PRJ-CANONICAL-01' && tId === 'TRK-GLOBAL-01') {
        return {
          allocationId: 'ALC-01',
          projectId: pId,
          truckId: 'TRK-GLOBAL-01',
          materialId: 'MAT-GLOBAL-01',
          status: 'ACTIVE',
          effectiveFrom: '2026-01-01',
          effectiveTo: null,
          createdAt: '2026-01-01',
          createdBy: 'DISPATCHER-01',
        };
      }
      return null;
    });

    // 9. Mock Pricing Rule
    vi.spyOn(pricingRuleRepository, 'findById').mockImplementation(async (pId: string, prId: string) => {
      if (pId === 'PRJ-CANONICAL-01' && prId === 'PRC-RULE-01') {
        return {
          pricingRuleId: 'PRC-RULE-01',
          projectId: 'PRJ-CANONICAL-01',
          carrierId: 'CAR-GLOBAL-01',
          materialId: 'MAT-GLOBAL-01',
          pricingType: 'PER_TON',
          agreedRate: 45.5,
          baseRateSAR: 45.5,
          currency: 'SAR',
          status: 'ACTIVE',
          effectiveFrom: '2025-01-01',
          effectiveTo: '2027-12-31',
          vatApplicable: true,
        } as any;
      }
      if (pId === 'PRJ-CANONICAL-01' && prId === 'PRC-RULE-EXPIRED') {
        return {
          pricingRuleId: 'PRC-RULE-EXPIRED',
          projectId: 'PRJ-CANONICAL-01',
          carrierId: 'CAR-GLOBAL-01',
          materialId: 'MAT-GLOBAL-01',
          pricingType: 'PER_TON',
          baseRateSAR: 40,
          status: 'ACTIVE',
          effectiveFrom: '2020-01-01',
          effectiveTo: '2021-01-01',
        } as any;
      }
      return null;
    });

    // 10. Mock Trip Repository create
    vi.spyOn(tripRepository, 'create').mockImplementation(async (trip: any) => trip);
  });

  // A. SUCCESSFUL CANONICAL DISPATCH
  it('A. Successfully dispatches trip when ALL canonical contracts are satisfied', async () => {
    const trip = await tripService.dispatchTrip(validParams, mockAuthContext);

    expect(trip).toBeDefined();
    expect(trip.tripId).toMatch(/^TRP-/);
    expect(trip.status).toBe('DISPATCHED');
    expect(trip.projectId).toBe('PRJ-CANONICAL-01');
    expect(trip.carrierId).toBe('CAR-GLOBAL-01');
    expect(trip.truckId).toBe('TRK-GLOBAL-01');
    expect(trip.driverId).toBe('DRV-GLOBAL-01');
    expect(trip.materialId).toBe('MAT-GLOBAL-01');
    expect(trip.pricingRuleId).toBe('PRC-RULE-01');

    // Immutable Snapshots check
    expect(trip.carrierSnapshot.companyNameAr).toBe('شركة اليمامة للخدمات اللوجستية');
    expect(trip.carrierSnapshot.commercialRegistrationNo).toBe('1010887766');
    expect(trip.truckSnapshot.plateNumberAr).toBe('أ ب ج 5566');
    expect(trip.truckSnapshot.tareWeightKg).toBe(14200);
    expect(trip.driverSnapshot.fullNameAr).toBe('سالم عبدالله القحطاني');
    expect(trip.driverSnapshot.nationalOrIqamaId).toBe('1098765432');
    expect(trip.materialSnapshot.nameAr).toBe('حصى متدرج 3/4 إنش');
    expect(trip.pricingSnapshot.agreedRate).toBe(45.5);
    expect(trip.pricingSnapshot.pricingType).toBe('PER_TON');
  });

  // B. INACTIVE GLOBAL DRIVER
  it('B. Rejects dispatch when Global Driver is inactive or not found', async () => {
    await expect(tripService.dispatchTrip({ ...validParams, driverId: 'DRV-INACTIVE' }, mockAuthContext))
      .rejects.toThrow('السائق المحدد غير موجود في الهوية الموحدة أو غير نشط');

    await expect(tripService.dispatchTrip({ ...validParams, driverId: 'DRV-NONEXISTENT' }, mockAuthContext))
      .rejects.toThrow('السائق المحدد غير موجود في الهوية الموحدة أو غير نشط');
  });

  // C. INACTIVE PROJECT DRIVER MEMBERSHIP
  it('C. Rejects dispatch when Driver does not have ACTIVE project membership', async () => {
    vi.spyOn(globalDriverRepository, 'findById').mockImplementation(async () => ({
      driverId: 'DRV-NO-MEM',
      fullNameAr: 'سائق بلا عضوية',
      status: 'ACTIVE',
    } as any));

    await expect(tripService.dispatchTrip({ ...validParams, driverId: 'DRV-NO-MEM' }, mockAuthContext))
      .rejects.toThrow('ليس لديه عضوية نشطة (ACTIVE) في هذا المشروع');
  });

  // D. INACTIVE GLOBAL TRUCK
  it('D. Rejects dispatch when Global Truck is inactive or not found', async () => {
    await expect(tripService.dispatchTrip({ ...validParams, truckId: 'TRK-INACTIVE' }, mockAuthContext))
      .rejects.toThrow('الشاحنة المحددة غير موجودة في الهوية الموحدة أو غير مصرح لها بالعمل');

    await expect(tripService.dispatchTrip({ ...validParams, truckId: 'TRK-NONEXISTENT' }, mockAuthContext))
      .rejects.toThrow('الشاحنة المحددة غير موجودة في الهوية الموحدة أو غير مصرح لها بالعمل');
  });

  // E. INACTIVE PROJECT TRUCK MEMBERSHIP
  it('E. Rejects dispatch when Truck does not have ACTIVE project membership', async () => {
    vi.spyOn(globalTruckRepository, 'findById').mockImplementation(async () => ({
      truckId: 'TRK-NO-MEM',
      plate: 'ط ي ك 1122',
      status: 'ACTIVE',
    } as any));

    await expect(tripService.dispatchTrip({ ...validParams, truckId: 'TRK-NO-MEM' }, mockAuthContext))
      .rejects.toThrow('ليس لديها عضوية نشطة (ACTIVE) في هذا المشروع');
  });

  // F. INACTIVE GLOBAL CARRIER
  it('F. Rejects dispatch when Global Carrier is inactive or not found', async () => {
    await expect(tripService.dispatchTrip({ ...validParams, carrierId: 'CAR-INACTIVE' }, mockAuthContext))
      .rejects.toThrow('الناقل المحدد غير موجود في الهوية الموحدة أو غير نشط');

    await expect(tripService.dispatchTrip({ ...validParams, carrierId: 'CAR-NONEXISTENT' }, mockAuthContext))
      .rejects.toThrow('الناقل المحدد غير موجود في الهوية الموحدة أو غير نشط');
  });

  // G. INACTIVE PROJECT CARRIER MEMBERSHIP
  it('G. Rejects dispatch when Carrier does not have ACTIVE project membership', async () => {
    vi.spyOn(globalCarrierRepository, 'findById').mockImplementation(async () => ({
      carrierId: 'CAR-NO-MEM',
      nameAr: 'ناقل بلا عضوية',
      status: 'ACTIVE',
    } as any));

    await expect(tripService.dispatchTrip({ ...validParams, carrierId: 'CAR-NO-MEM' }, mockAuthContext))
      .rejects.toThrow('ليس لديه عضوية نشطة (ACTIVE) في هذا المشروع');
  });

  // H. INACTIVE GLOBAL MATERIAL
  it('H. Rejects dispatch when Global Material is inactive or not found', async () => {
    await expect(tripService.dispatchTrip({ ...validParams, materialId: 'MAT-INACTIVE' }, mockAuthContext))
      .rejects.toThrow('المادة المحددة غير موجودة في الهوية الموحدة أو غير نشطة');

    await expect(tripService.dispatchTrip({ ...validParams, materialId: 'MAT-NONEXISTENT' }, mockAuthContext))
      .rejects.toThrow('المادة المحددة غير موجودة في الهوية الموحدة أو غير نشطة');
  });

  // I. INACTIVE PROJECT MATERIAL MEMBERSHIP
  it('I. Rejects dispatch when Material does not have ACTIVE project membership', async () => {
    vi.spyOn(globalMaterialRepository, 'findById').mockImplementation(async () => ({
      materialId: 'MAT-NO-MEM',
      nameAr: 'مادة بلا عضوية',
      status: 'ACTIVE',
    } as any));

    await expect(tripService.dispatchTrip({ ...validParams, materialId: 'MAT-NO-MEM' }, mockAuthContext))
      .rejects.toThrow('ليس لديها عضوية نشطة (ACTIVE) في هذا المشروع');
  });

  // J. MISSING DRIVER ↔ TRUCK ASSIGNMENT
  it('J. Rejects dispatch when Driver ↔ Truck assignment slot is missing', async () => {
    vi.spyOn(projectDriverTruckAssignmentRepository, 'getActiveAssignmentByDriver').mockResolvedValue(null);

    await expect(tripService.dispatchTrip(validParams, mockAuthContext))
      .rejects.toThrow('لا يوجد تعيين تشغيلي نشط (Driver ↔ Truck)');
  });

  // K. INACTIVE / EMPTY TRUCK SLOT
  it('K. Rejects dispatch when Truck slot does not have active driver', async () => {
    vi.spyOn(projectDriverTruckAssignmentRepository, 'getActiveAssignmentByTruck').mockResolvedValue(null);

    await expect(tripService.dispatchTrip(validParams, mockAuthContext))
      .rejects.toThrow('لا يوجد تعيين تشغيلي نشط (Driver ↔ Truck)');
  });

  // L. DRIVER ASSIGNED TO DIFFERENT TRUCK
  it('L. Rejects dispatch when Driver is currently assigned to a different truck', async () => {
    vi.spyOn(projectDriverTruckAssignmentRepository, 'getActiveAssignmentByDriver').mockResolvedValue({
      driverId: 'DRV-GLOBAL-01',
      truckId: 'TRK-DIFFERENT',
      assignmentId: 'ASN-02',
      projectId: 'PRJ-CANONICAL-01',
      status: 'ACTIVE',
      effectiveFrom: '2026-01-01',
      effectiveTo: null,
      createdAt: '2026-01-01',
      createdBy: 'DISPATCHER-01',
    });

    await expect(tripService.dispatchTrip(validParams, mockAuthContext))
      .rejects.toThrow('تعارض في التعيين التشغيلي: السائق (DRV-GLOBAL-01) معين للشاحنة (TRK-DIFFERENT)');
  });

  // M. TRUCK ASSIGNED TO DIFFERENT DRIVER
  it('M. Rejects dispatch when Truck is currently assigned to a different driver', async () => {
    vi.spyOn(projectDriverTruckAssignmentRepository, 'getActiveAssignmentByTruck').mockResolvedValue({
      truckId: 'TRK-GLOBAL-01',
      driverId: 'DRV-DIFFERENT',
      assignmentId: 'ASN-03',
      projectId: 'PRJ-CANONICAL-01',
      status: 'ACTIVE',
      effectiveFrom: '2026-01-01',
      effectiveTo: null,
      createdAt: '2026-01-01',
      createdBy: 'DISPATCHER-01',
    });

    await expect(tripService.dispatchTrip(validParams, mockAuthContext))
      .rejects.toThrow('تعارض في التعيين التشغيلي');
  });

  // N. DRIVER AFFILIATED WITH CARRIER A WHILE DISPATCH SPECIFIES CARRIER B
  it('N. Rejects dispatch when Driver is affiliated with Carrier A but Carrier B is requested', async () => {
    await expect(tripService.dispatchTrip({ ...validParams, carrierId: 'CAR-GLOBAL-02' }, mockAuthContext))
      .rejects.toThrow('تابع للناقل (CAR-GLOBAL-01) وليس للناقل المختار (CAR-GLOBAL-02)');
  });

  // O. TRUCK AFFILIATED WITH CARRIER A WHILE DISPATCH SPECIFIES CARRIER B
  it('O. Rejects dispatch when Truck is affiliated with Carrier A but Carrier B is requested', async () => {
    // Make driver match CAR-GLOBAL-02 to isolate truck affiliation failure
    vi.spyOn(projectDriverCarrierAffiliationRepository, 'getAffiliation').mockResolvedValue({
      affiliationId: 'AFF-DRV-02',
      projectId: 'PRJ-CANONICAL-01',
      driverId: 'DRV-GLOBAL-01',
      carrierId: 'CAR-GLOBAL-02',
      status: 'ACTIVE',
    } as any);
    vi.spyOn(projectCarrierMembershipRepository, 'getMembership').mockResolvedValue({
      membershipId: 'MEM-CAR-02',
      projectId: 'PRJ-CANONICAL-01',
      entityId: 'CAR-GLOBAL-02',
      status: 'ACTIVE',
    } as any);

    await expect(tripService.dispatchTrip({ ...validParams, carrierId: 'CAR-GLOBAL-02' }, mockAuthContext))
      .rejects.toThrow('تابعة للناقل (CAR-GLOBAL-01) وليس للناقل المختار (CAR-GLOBAL-02)');
  });

  // P. TRUCK ALLOCATED TO MATERIAL A WHILE DISPATCH SPECIFIES MATERIAL B
  it('P. Rejects dispatch when Truck is allocated to Material A but Material B is requested', async () => {
    await expect(tripService.dispatchTrip({ ...validParams, materialId: 'MAT-GLOBAL-02' }, mockAuthContext))
      .rejects.toThrow('مخصصة للمادة (MAT-GLOBAL-01) وليس للمادة المختارة (MAT-GLOBAL-02)');
  });

  // Q. TRUCK HAS NO MATERIAL ALLOCATION
  it('Q. Rejects dispatch when Truck has no active material allocation record', async () => {
    vi.spyOn(projectTruckMaterialAllocationRepository, 'getActiveAllocationByTruck').mockResolvedValue(null);

    await expect(tripService.dispatchTrip(validParams, mockAuthContext))
      .rejects.toThrow('لا يوجد تخصيص مادة نشط (Truck ↔ Material)');
  });

  // R. INVALID OR MISSING PRICING RULE
  it('R. Rejects dispatch when pricing rule is invalid or not found', async () => {
    await expect(tripService.dispatchTrip({ ...validParams, pricingRuleId: 'PRC-NONEXISTENT' }, mockAuthContext))
      .rejects.toThrow('قاعدة التسعير غير صالحة أو غير نشطة');
  });

  // S. STALE / EXPIRED PRICING RULE
  it('S. Rejects dispatch when pricing rule is expired', async () => {
    await expect(tripService.dispatchTrip({ ...validParams, pricingRuleId: 'PRC-RULE-EXPIRED' }, mockAuthContext))
      .rejects.toThrow('قاعدة التسعير منتهية الصلاحية');
  });

  // T. STATIC SOURCE ASSERTION
  it('T. Static source check: TripService does NOT import or reference legacy repositories or project authorization arrays', () => {
    const tripServiceFile = path.resolve(__dirname, '../services/trip.service.ts');
    const content = fs.readFileSync(tripServiceFile, 'utf-8');

    // Forbidden legacy repository imports
    expect(content).not.toContain("from '../repositories/carrier.repository'");
    expect(content).not.toContain("from '../repositories/truck.repository'");
    expect(content).not.toContain("from '../repositories/driver.repository'");
    expect(content).not.toContain("from '../repositories/material.repository'");

    // Forbidden legacy authorization arrays used as dispatch authority
    expect(content).not.toContain('project.authorizedCarrierIds');
    expect(content).not.toContain('project.authorizedMaterialIds');
    expect(content).not.toContain('authorizedCarrierIds');
    expect(content).not.toContain('authorizedMaterialIds');

    // Mandatory canonical repository imports
    expect(content).toContain('globalCarrierRepository');
    expect(content).toContain('globalTruckRepository');
    expect(content).toContain('globalDriverRepository');
    expect(content).toContain('globalMaterialRepository');
    expect(content).toContain('projectCarrierMembershipRepository');
    expect(content).toContain('projectTruckMembershipRepository');
    expect(content).toContain('projectDriverMembershipRepository');
    expect(content).toContain('projectMaterialMembershipRepository');
    expect(content).toContain('projectDriverTruckAssignmentRepository');
    expect(content).toContain('projectTruckMaterialAllocationRepository');
  });

  // U. IMMUTABLE SNAPSHOT VERIFICATION
  it('U. Accurately builds immutable snapshots from canonical source data', async () => {
    const trip = await tripService.dispatchTrip(validParams, mockAuthContext);

    expect(trip.carrierSnapshot).toEqual({
      carrierId: 'CAR-GLOBAL-01',
      companyNameAr: 'شركة اليمامة للخدمات اللوجستية',
      commercialRegistrationNo: '1010887766',
    });

    expect(trip.truckSnapshot).toEqual({
      truckId: 'TRK-GLOBAL-01',
      plateNumberAr: 'أ ب ج 5566',
      tareWeightKg: 14200,
      legalPayloadLimitKg: 30000,
    });

    expect(trip.driverSnapshot).toEqual({
      driverId: 'DRV-GLOBAL-01',
      fullNameAr: 'سالم عبدالله القحطاني',
      nationalOrIqamaId: '1098765432',
      phone: '0501234567',
    });

    expect(trip.materialSnapshot).toEqual({
      materialId: 'MAT-GLOBAL-01',
      code: 'AGG_3_4',
      nameAr: 'حصى متدرج 3/4 إنش',
      unitOfMeasure: 'TON',
    });

    expect(trip.pricingSnapshot.pricingRuleId).toBe('PRC-RULE-01');
    expect(trip.pricingSnapshot.pricingType).toBe('PER_TON');
    expect(trip.pricingSnapshot.agreedRate).toBe(45.5);
    expect(trip.pricingSnapshot.baseRateSAR).toBe(45.5);
    expect(trip.pricingSnapshot.currency).toBe('SAR');
  });
});
