import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TripService } from '../services/trip.service';
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

describe('LU-P6-02B2 Material Identity & Authority Enforcement', () => {
  let tripService: TripService;

  const mockAuthContext: AuthUserContext = {
    userId: 'DISPATCHER-01',
    email: 'dispatcher@qsaudi.com',
    displayName: 'Dispatcher',
    role: 'DISPATCHER',
    assignedProjectIds: ['PRJ-P602B2-TEST'],
  };

  const validParams = {
    projectId: 'PRJ-P602B2-TEST',
    carrierId: 'CAR-01',
    truckId: 'TRK-01',
    driverId: 'DRV-01',
    materialId: 'MAT-AGG-01',
    pricingRuleId: 'PRC-01',
  };

  beforeEach(() => {
    tripService = new TripService();
    vi.restoreAllMocks();

    // Mock Project
    vi.spyOn(projectRepository, 'findById').mockImplementation(async (pId: string) => ({
      projectId: pId,
      projectNumber: 101,
      nameAr: 'مشروع اختبار المادة',
      nameEn: 'Material Test Project',
      status: 'ACTIVE',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    } as any));

    // Mock Carrier
    vi.spyOn(globalCarrierRepository, 'findById').mockImplementation(async (cId: string) => {
      if (cId === 'CAR-01') {
        return { carrierId: 'CAR-01', nameAr: 'الناقل الأول', status: 'ACTIVE', commercialRegistrationNo: '1010101010' } as any;
      }
      return null;
    });
    vi.spyOn(projectCarrierMembershipRepository, 'getMembership').mockImplementation(async (_pId: string, cId: string) => {
      if (cId === 'CAR-01') {
        return { membershipId: 'MEM-CAR-01', projectId: _pId, entityId: 'CAR-01', status: 'ACTIVE' } as any;
      }
      return null;
    });

    // Mock Truck
    vi.spyOn(globalTruckRepository, 'findById').mockImplementation(async (tId: string) => {
      if (tId === 'TRK-01') {
        return { truckId: 'TRK-01', plate: 'ا ب ج 1234', normalizedPlate: '1234 ABC', tareWeightKg: 14000, legalPayloadLimitKg: 30000, status: 'ACTIVE' } as any;
      }
      return null;
    });
    vi.spyOn(projectTruckMembershipRepository, 'getMembership').mockImplementation(async (_pId: string, tId: string) => {
      if (tId === 'TRK-01') {
        return { membershipId: 'MEM-TRK-01', projectId: _pId, entityId: 'TRK-01', status: 'ACTIVE' } as any;
      }
      return null;
    });

    // Mock Driver
    vi.spyOn(globalDriverRepository, 'findById').mockImplementation(async (dId: string) => {
      if (dId === 'DRV-01') {
        return { driverId: 'DRV-01', fullNameAr: 'أحمد السائق', nationalId: '1000000001', phone: '0500000001', status: 'ACTIVE' } as any;
      }
      return null;
    });
    vi.spyOn(projectDriverMembershipRepository, 'getMembership').mockImplementation(async (_pId: string, dId: string) => {
      if (dId === 'DRV-01') {
        return { membershipId: 'MEM-DRV-01', projectId: _pId, entityId: 'DRV-01', status: 'ACTIVE' } as any;
      }
      return null;
    });

    // Mock Affiliations
    vi.spyOn(projectDriverCarrierAffiliationRepository, 'getAffiliation').mockImplementation(async (_pId: string, dId: string) => {
      if (dId === 'DRV-01') {
        return { affiliationId: 'AFF-DRV-01', projectId: _pId, driverId: 'DRV-01', carrierId: 'CAR-01', status: 'ACTIVE' } as any;
      }
      return null;
    });
    vi.spyOn(projectTruckCarrierAffiliationRepository, 'getAffiliation').mockImplementation(async (_pId: string, tId: string) => {
      if (tId === 'TRK-01') {
        return { affiliationId: 'AFF-TRK-01', projectId: _pId, truckId: 'TRK-01', carrierId: 'CAR-01', status: 'ACTIVE' } as any;
      }
      return null;
    });

    // Mock Assignments & Allocations
    vi.spyOn(projectDriverTruckAssignmentRepository, 'getActiveAssignmentByDriver').mockImplementation(async (pId: string, dId: string) => {
      if (dId === 'DRV-01') {
        return { assignmentId: 'ASN-01', projectId: pId, driverId: 'DRV-01', truckId: 'TRK-01', status: 'ACTIVE', effectiveFrom: '2026-01-01', effectiveTo: null, createdAt: '2026-01-01', createdBy: 'DISPATCHER-01' };
      }
      return null;
    });
    vi.spyOn(projectDriverTruckAssignmentRepository, 'getActiveAssignmentByTruck').mockImplementation(async (pId: string, tId: string) => {
      if (tId === 'TRK-01') {
        return { assignmentId: 'ASN-01', projectId: pId, driverId: 'DRV-01', truckId: 'TRK-01', status: 'ACTIVE', effectiveFrom: '2026-01-01', effectiveTo: null, createdAt: '2026-01-01', createdBy: 'DISPATCHER-01' };
      }
      return null;
    });
    vi.spyOn(projectTruckMaterialAllocationRepository, 'getActiveAllocationByTruck').mockImplementation(async (pId: string, tId: string) => {
      if (tId === 'TRK-01') {
        return { allocationId: 'ALC-01', projectId: pId, truckId: 'TRK-01', materialId: 'MAT-AGG-01', status: 'ACTIVE', effectiveFrom: '2026-01-01', effectiveTo: null, createdAt: '2026-01-01', createdBy: 'DISPATCHER-01' };
      }
      return null;
    });

    // Mock Material
    vi.spyOn(globalMaterialRepository, 'findById').mockImplementation(async (mId: string) => {
      if (mId === 'MAT-AGG-01') {
        return { materialId: 'MAT-AGG-01', code: 'AGG_01', nameAr: 'حصى معتمد', status: 'ACTIVE', unitOfMeasure: 'TON' } as any;
      }
      if (mId === 'MAT-UNAUTHORIZED') {
        return { materialId: 'MAT-UNAUTHORIZED', code: 'UNAUTH', nameAr: 'مادة غير مصرح بها', status: 'ACTIVE', unitOfMeasure: 'TON' } as any;
      }
      return null;
    });
    vi.spyOn(projectMaterialMembershipRepository, 'getMembership').mockImplementation(async (_pId: string, mId: string) => {
      if (mId === 'MAT-AGG-01') {
        return { membershipId: 'MEM-MAT-01', projectId: _pId, entityId: 'MAT-AGG-01', status: 'ACTIVE' } as any;
      }
      return null;
    });

    // Mock Pricing
    vi.spyOn(pricingRuleRepository, 'findById').mockImplementation(async (pId: string, prId: string) => {
      if (prId === 'PRC-01') {
        return { pricingRuleId: 'PRC-01', projectId: pId, carrierId: 'CAR-01', materialId: 'MAT-AGG-01', status: 'ACTIVE', pricingType: 'PER_TON', agreedRate: 10, baseRateSAR: 10 } as any;
      }
      return null;
    });

    // Mock Trip Repository create
    vi.spyOn(tripRepository, 'create').mockImplementation(async (trip: any) => trip);
  });

  it('1. Rejects dispatch when materialId is missing (undefined/null/empty)', async () => {
    const missingMaterialParams = { ...validParams, materialId: '' };
    await expect(tripService.dispatchTrip(missingMaterialParams, mockAuthContext))
      .rejects.toThrow('معرف المادة (materialId) مطلوب');

    const nullMaterialParams = { ...validParams, materialId: null as any };
    await expect(tripService.dispatchTrip(nullMaterialParams, mockAuthContext))
      .rejects.toThrow('معرف المادة (materialId) مطلوب');
  });

  it('2. Rejects dispatch when materialId is invalid/unknown (not in catalog)', async () => {
    const invalidMaterialParams = { ...validParams, materialId: 'MAT-NONEXISTENT' };
    await expect(tripService.dispatchTrip(invalidMaterialParams, mockAuthContext))
      .rejects.toThrow('المادة المحددة غير موجودة في الهوية الموحدة أو غير نشطة');
  });

  it('3. Raw materialName cannot establish authority without valid materialId', async () => {
    const rawNameParams = { ...validParams, materialId: 'RAW_AGGREGATE_STRING', materialName: 'حصى سائب' } as any;
    await expect(tripService.dispatchTrip(rawNameParams, mockAuthContext))
      .rejects.toThrow('المادة المحددة غير موجودة في الهوية الموحدة أو غير نشطة');
  });

  it('4. Rejects dispatch when materialId has no active membership in the project', async () => {
    const unauthorizedParams = { ...validParams, materialId: 'MAT-UNAUTHORIZED' };
    await expect(tripService.dispatchTrip(unauthorizedParams, mockAuthContext))
      .rejects.toThrow('ليس لديها عضوية نشطة (ACTIVE) في هذا المشروع');
  });

  it('5. Successfully dispatches when materialId is valid and authorized', async () => {
    const trip = await tripService.dispatchTrip(validParams, mockAuthContext);
    expect(trip).toBeDefined();
    expect(trip.materialId).toBe('MAT-AGG-01');
    expect(trip.status).toBe('DISPATCHED');
  });

  it('6. Confirms no automatic MaterialEntity creation occurs on invalid dispatch attempts', async () => {
    const createSpy = vi.spyOn(globalMaterialRepository, 'createGlobal');
    try {
      await tripService.dispatchTrip({ ...validParams, materialId: 'MAT-AUTO' }, mockAuthContext);
    } catch (e) {
      // Expected rejection
    }
    expect(createSpy).not.toHaveBeenCalled();
  });
});
