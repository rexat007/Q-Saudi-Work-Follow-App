import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TripService } from '../services/trip.service';
import { materialRepository } from '../repositories/material.repository';
import { carrierRepository } from '../repositories/carrier.repository';
import { truckRepository } from '../repositories/truck.repository';
import { driverRepository } from '../repositories/driver.repository';
import { pricingRuleRepository } from '../repositories/pricingRule.repository';
import { projectRepository } from '../repositories/project.repository';
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

    // Mock Repositories
    vi.spyOn(projectRepository, 'findById').mockImplementation(async (pId: string) => ({
      projectId: pId,
      projectNumber: 101,
      nameAr: 'مشروع اختبار المادة',
      nameEn: 'Material Test Project',
      status: 'ACTIVE',
      authorizedCarrierIds: ['CAR-01'],
      authorizedMaterialIds: ['MAT-AGG-01'],
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    } as any));

    vi.spyOn(carrierRepository, 'findById').mockImplementation(async (_pId: string, cId: string) => {
      if (cId === 'CAR-01') {
        return { carrierId: 'CAR-01', nameAr: 'الناقل الأول', status: 'ACTIVE', isActive: true } as any;
      }
      return null;
    });

    vi.spyOn(truckRepository, 'findById').mockImplementation(async (_pId: string, tId: string) => {
      if (tId === 'TRK-01') {
        return { truckId: 'TRK-01', carrierId: 'CAR-01', status: 'ACTIVE', isActive: true } as any;
      }
      return null;
    });

    vi.spyOn(driverRepository, 'findById').mockImplementation(async (_pId: string, dId: string) => {
      if (dId === 'DRV-01') {
        return { driverId: 'DRV-01', carrierId: 'CAR-01', status: 'ACTIVE', isActive: true } as any;
      }
      return null;
    });

    vi.spyOn(materialRepository, 'findById').mockImplementation(async (_pId: string, mId: string) => {
      if (mId === 'MAT-AGG-01') {
        return { materialId: 'MAT-AGG-01', nameAr: 'حصى معتمد', status: 'ACTIVE', isActive: true } as any;
      }
      if (mId === 'MAT-UNAUTHORIZED') {
        return { materialId: 'MAT-UNAUTHORIZED', nameAr: 'مادة غير مصرح بها', status: 'ACTIVE', isActive: true } as any;
      }
      return null;
    });

    vi.spyOn(pricingRuleRepository, 'findById').mockImplementation(async (_pId: string, prId: string) => {
      if (prId === 'PRC-01') {
        return { pricingRuleId: 'PRC-01', status: 'ACTIVE', isActive: true, pricingType: 'PER_TON', agreedRate: 10 } as any;
      }
      return null;
    });
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
      .rejects.toThrow('المادة المحددة غير مصرح بها أو غير نشطة');
  });

  it('3. Raw materialName cannot establish authority without valid materialId', async () => {
    const rawNameParams = { ...validParams, materialId: 'RAW_AGGREGATE_STRING', materialName: 'حصى سائب' } as any;
    await expect(tripService.dispatchTrip(rawNameParams, mockAuthContext))
      .rejects.toThrow('المادة المحددة غير مصرح بها أو غير نشطة');
  });

  it('4. Rejects dispatch when materialId is not authorized for the project', async () => {
    const unauthorizedParams = { ...validParams, materialId: 'MAT-UNAUTHORIZED' };
    await expect(tripService.dispatchTrip(unauthorizedParams, mockAuthContext))
      .rejects.toThrow('المادة (MAT-UNAUTHORIZED) غير مصرح بتوريدها في هذا المشروع');
  });

  it('5. Successfully dispatches when materialId is valid and authorized', async () => {
    const trip = await tripService.dispatchTrip(validParams, mockAuthContext);
    expect(trip).toBeDefined();
    expect(trip.materialId).toBe('MAT-AGG-01');
    expect(trip.status).toBe('DISPATCHED');
  });

  it('6. Confirms no automatic MaterialEntity creation occurs on invalid dispatch attempts', async () => {
    const createSpy = vi.spyOn(materialRepository, 'create');
    try {
      await tripService.dispatchTrip({ ...validParams, materialId: 'MAT-AUTO' }, mockAuthContext);
    } catch (e) {
      // Expected rejection
    }
    expect(createSpy).not.toHaveBeenCalled();
  });
});
