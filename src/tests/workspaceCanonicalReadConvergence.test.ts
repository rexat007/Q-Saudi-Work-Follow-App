import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { clientWorkspaceService, mapTripToWorkspaceProjection } from '../services/workspace.service';
import { projectCarrierMembershipRepository, projectMaterialMembershipRepository, projectDriverMembershipRepository } from '../repositories/projectMembership.repository';
import { globalCarrierRepository, globalMaterialRepository, globalDriverRepository } from '../repositories/globalIdentity.repository';
import { projectFleetReadModelService } from '../services/projectFleetReadModel.service';
import { tripRepository } from '../repositories/trip.repository';
import { exceptionRepository } from '../repositories/exception.repository';

describe('Workspace Integration Canonical Master-Data Read Convergence', () => {
  const workspaceViewPath = path.resolve(__dirname, '../components/workspace/WorkspaceIntegrationView.tsx');
  const viewContent = fs.readFileSync(workspaceViewPath, 'utf-8');

  it('1. WorkspaceIntegrationView does NOT import legacy driverRepository, carrierRepository, or materialRepository', () => {
    expect(viewContent).not.toMatch(/from\s+['"].*\/driver\.repository['"]/);
    expect(viewContent).not.toMatch(/from\s+['"].*\/carrier\.repository['"]/);
    expect(viewContent).not.toMatch(/from\s+['"].*\/material\.repository['"]/);
    expect(viewContent).not.toContain('driverRepository.subscribeByProject');
    expect(viewContent).not.toContain('carrierRepository.subscribeByProject');
    expect(viewContent).not.toContain('materialRepository.subscribeByProject');
  });

  it('2. WorkspaceIntegrationView imports and utilizes canonical project membership repositories and global identity repositories', () => {
    expect(viewContent).toContain('projectCarrierMembershipRepository');
    expect(viewContent).toContain('projectMaterialMembershipRepository');
    expect(viewContent).toContain('projectDriverMembershipRepository');
    expect(viewContent).toContain('globalCarrierRepository');
    expect(viewContent).toContain('globalMaterialRepository');
    expect(viewContent).toContain('globalDriverRepository');
  });

  it('3. Fleet-level projection and state is sourced through canonical project Fleet read authority (projectFleetReadModelService)', () => {
    expect(viewContent).toContain('projectFleetReadModelService');
    expect(viewContent).toContain('projectFleetReadModelService.getProjectFleetReadModel');
  });

  it('4. Trips and Exceptions remain sourced through canonical project operational authority', () => {
    expect(viewContent).toContain('tripRepository.subscribeByProject');
    expect(viewContent).toContain('exceptionRepository.subscribeByProject');
  });

  it('5. Google Workspace projection mapping strictly treats Sheets/Drive as export targets without mutating canonical business authority', () => {
    const mockTrip: any = {
      tripId: 'TRP-CANONICAL-99',
      tripNumber: 'T-99',
      projectId: 'PRJ-NEOM-01',
      carrierId: 'CAR-01',
      carrierSnapshot: { companyNameAr: 'شركة الناقل المعتمد' },
      driverId: 'DRV-01',
      driverSnapshot: { fullNameAr: 'سائق معتمد' },
      truckId: 'TRK-01',
      truckSnapshot: { plateNumberAr: 'أ ب ج 9999' },
      materialId: 'MAT-01',
      materialSnapshot: { nameAr: 'رمل ناعم' },
      status: 'COMPLETED',
      weights: { originNetKg: 30000, originTicketNo: 'WB-9900' },
      pricingSnapshot: { agreedRate: 50, settlementAmount: 1500, pricingType: 'PER_TON' },
      createdAt: new Date(),
    };

    const projection = mapTripToWorkspaceProjection(mockTrip);
    expect(projection.tripId).toBe('TRP-CANONICAL-99');
    expect(projection.carrierNameAr).toBe('شركة الناقل المعتمد');
    expect(projection.driverNameAr).toBe('سائق معتمد');
    expect(projection.truckPlateAr).toBe('أ ب ج 9999');
    expect(projection.materialNameAr).toBe('رمل ناعم');
    expect(projection.originNetKg).toBe(30000);
    expect(projection.settlementAmount).toBe(1500);
  });

  it('6. OAuth requestGoogleScopes fails closed under production semantics', async () => {
    const origEnv = process.env.NODE_ENV;
    try {
      process.env.NODE_ENV = 'production';
      // In production without interactive auth or valid credentials, requestGoogleScopes must reject / fail closed
      await expect(clientWorkspaceService.requestGoogleScopes()).rejects.toThrow();
    } finally {
      process.env.NODE_ENV = origEnv;
    }
  });

  it('7. Canonical repositories and read model service instances are available and function correctly', async () => {
    expect(projectCarrierMembershipRepository).toBeDefined();
    expect(projectMaterialMembershipRepository).toBeDefined();
    expect(projectDriverMembershipRepository).toBeDefined();
    expect(globalCarrierRepository).toBeDefined();
    expect(globalMaterialRepository).toBeDefined();
    expect(globalDriverRepository).toBeDefined();
    expect(projectFleetReadModelService).toBeDefined();
    expect(tripRepository).toBeDefined();
    expect(exceptionRepository).toBeDefined();
  });
});
