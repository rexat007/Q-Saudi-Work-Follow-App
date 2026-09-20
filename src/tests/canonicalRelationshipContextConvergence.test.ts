import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { 
  canonicalRelationshipContextService,
  CanonicalRelationshipContextService
} from '../services/canonicalRelationshipContext.service';
import {
  projectCarrierMembershipRepository,
  projectMaterialMembershipRepository,
  projectDriverMembershipRepository,
  projectTruckMembershipRepository,
} from '../repositories/projectMembership.repository';
import {
  projectDriverCarrierAffiliationRepository,
  projectTruckCarrierAffiliationRepository,
} from '../repositories/projectCarrierAffiliation.repository';
import {
  globalCarrierRepository,
  globalMaterialRepository,
  globalDriverRepository,
  globalTruckRepository,
} from '../repositories/globalIdentity.repository';
import { projectFleetReadModelService } from '../services/projectFleetReadModel.service';

describe('Canonical Relationship Context Convergence Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Service Architecture & Fail-Closed Behavior', () => {
    it('1. Singleton instance is exported and available', () => {
      expect(canonicalRelationshipContextService).toBeDefined();
      expect(canonicalRelationshipContextService).toBeInstanceOf(CanonicalRelationshipContextService);
      expect(typeof canonicalRelationshipContextService.getProjectRelationshipContext).toBe('function');
    });

    it('2. getProjectRelationshipContext throws when projectId is empty, whitespace, or "ALL"', async () => {
      await expect(canonicalRelationshipContextService.getProjectRelationshipContext('')).rejects.toThrow(
        'projectId must be a valid non-empty project identifier and cannot be ALL'
      );
      await expect(canonicalRelationshipContextService.getProjectRelationshipContext('   ')).rejects.toThrow(
        'projectId must be a valid non-empty project identifier and cannot be ALL'
      );
      await expect(canonicalRelationshipContextService.getProjectRelationshipContext('ALL')).rejects.toThrow(
        'projectId must be a valid non-empty project identifier and cannot be ALL'
      );
    });

    it('3. getProjectRelationshipContext aggregates canonical memberships, affiliations, and fleet read models', async () => {
      const targetProjectId = 'PRJ-NEOM-CANONICAL-01';

      // Mock Memberships
      vi.spyOn(projectCarrierMembershipRepository, 'listMemberships').mockResolvedValue([
        {
          id: 'MEM-C1',
          projectId: targetProjectId,
          carrierId: 'CRR-001',
          status: 'ACTIVE',
          createdAt: new Date(),
          updatedAt: new Date()
        } as any
      ]);
      vi.spyOn(projectMaterialMembershipRepository, 'listMemberships').mockResolvedValue([
        {
          id: 'MEM-M1',
          projectId: targetProjectId,
          materialId: 'MAT-001',
          status: 'ACTIVE',
          createdAt: new Date(),
          updatedAt: new Date()
        } as any
      ]);
      vi.spyOn(projectDriverMembershipRepository, 'listMemberships').mockResolvedValue([
        {
          id: 'MEM-D1',
          projectId: targetProjectId,
          driverId: 'DRV-001',
          status: 'ACTIVE',
          createdAt: new Date(),
          updatedAt: new Date()
        } as any
      ]);
      vi.spyOn(projectTruckMembershipRepository, 'listMemberships').mockResolvedValue([
        {
          id: 'MEM-T1',
          projectId: targetProjectId,
          truckId: 'TRK-001',
          status: 'ACTIVE',
          createdAt: new Date(),
          updatedAt: new Date()
        } as any
      ]);

      // Mock Global Identities
      vi.spyOn(globalCarrierRepository, 'listByIds').mockResolvedValue([
        {
          carrierId: 'CRR-001',
          nameAr: 'شركة الناقل المعتمد الدولية',
          nameEn: 'Certified Carrier International',
          status: 'ACTIVE'
        } as any
      ]);
      vi.spyOn(globalMaterialRepository, 'listByIds').mockResolvedValue([
        {
          materialId: 'MAT-001',
          nameAr: 'ركام بازلتي معتمد',
          code: 'AGG-BASALT-01',
          status: 'ACTIVE'
        } as any
      ]);
      vi.spyOn(globalDriverRepository, 'findById').mockResolvedValue({
        driverId: 'DRV-001',
        fullNameAr: 'عبدالله السعيد',
        nationalOrIqamaId: '1099887766',
        status: 'ACTIVE'
      } as any);
      vi.spyOn(globalTruckRepository, 'findById').mockResolvedValue({
        truckId: 'TRK-001',
        plateNumberAr: 'أ ب ج 9876',
        tareWeightKg: 14500,
        legalPayloadLimitKg: 32000,
        status: 'ACTIVE'
      } as any);

      // Mock Affiliations
      vi.spyOn(projectDriverCarrierAffiliationRepository, 'getAffiliation').mockResolvedValue({
        id: 'AFF-D1',
        projectId: targetProjectId,
        driverId: 'DRV-001',
        carrierId: 'CRR-001',
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date()
      } as any);
      vi.spyOn(projectTruckCarrierAffiliationRepository, 'getAffiliation').mockResolvedValue({
        id: 'AFF-T1',
        projectId: targetProjectId,
        truckId: 'TRK-001',
        carrierId: 'CRR-001',
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date()
      } as any);

      // Mock Fleet Read Model (Active driver assignments & material allocations)
      vi.spyOn(projectFleetReadModelService, 'getProjectFleetReadModel').mockResolvedValue({
        projectId: targetProjectId,
        truckCount: 1,
        rows: [
          {
            projectId: targetProjectId,
            truckId: 'TRK-001',
            plateNumber: 'أ ب ج 9876',
            truckType: 'TIPPER',
            carrierId: 'CRR-001',
            carrierName: 'شركة الناقل المعتمد الدولية',
            driverId: 'DRV-001',
            driverName: 'عبدالله السعيد',
            materialId: 'MAT-001',
            materialName: 'ركام بازلتي معتمد',
            assignmentStatus: 'ASSIGNMENT_ACTIVE',
            allocationStatus: 'ALLOCATION_ACTIVE',
            integrityIssues: []
          }
        ],
        generatedAt: new Date().toISOString()
      });

      const context = await canonicalRelationshipContextService.getProjectRelationshipContext(targetProjectId);

      expect(context).toBeDefined();
      expect(context.projectId).toBe(targetProjectId);
      expect(context.authorizedCarrierIds).toEqual(['CRR-001']);
      expect(context.authorizedMaterialIds).toEqual(['MAT-001']);
      expect(context.knownCarriers).toHaveLength(1);
      expect(context.knownCarriers[0].carrierId).toBe('CRR-001');
      expect(context.knownCarriers[0].name).toBe('شركة الناقل المعتمد الدولية');
      expect(context.knownTrucks).toHaveLength(1);
      expect(context.knownTrucks[0].truckId).toBe('TRK-001');
      expect(context.knownTrucks[0].carrierId).toBe('CRR-001');
      expect(context.knownDrivers).toHaveLength(1);
      expect(context.knownDrivers[0].driverId).toBe('DRV-001');
      expect(context.knownDrivers[0].carrierId).toBe('CRR-001');
      expect(context.knownMaterials).toHaveLength(1);
      expect(context.knownMaterials[0].materialId).toBe('MAT-001');
      expect(context.activeDriverByTruck).toEqual({ 'TRK-001': 'DRV-001' });
      expect(context.activeMaterialByTruck).toEqual({ 'TRK-001': 'MAT-001' });
    });
  });

  describe('Static Architectural Verification', () => {
    it('4. LoadingOperatorView does not import legacy repositories', () => {
      const filePath = path.join(process.cwd(), 'src/components/field/LoadingOperatorView.tsx');
      const content = fs.readFileSync(filePath, 'utf-8');

      expect(content).toContain('canonicalRelationshipContextService');
      expect(content).not.toContain("from '../../repositories/carrier.repository'");
      expect(content).not.toContain("from '../../repositories/driver.repository'");
      expect(content).not.toContain("from '../../repositories/truck.repository'");
      expect(content).not.toContain("from '../../repositories/material.repository'");
      expect(content).not.toContain('buildRelationshipContextFromCanonical');
    });

    it('5. ImportCenterView does not import legacy repositories', () => {
      const filePath = path.join(process.cwd(), 'src/components/importCenter/ImportCenterView.tsx');
      const content = fs.readFileSync(filePath, 'utf-8');

      expect(content).toContain('canonicalRelationshipContextService');
      expect(content).not.toContain("from '../../repositories/carrier.repository'");
      expect(content).not.toContain("from '../../repositories/driver.repository'");
      expect(content).not.toContain("from '../../repositories/truck.repository'");
      expect(content).not.toContain("from '../../repositories/material.repository'");
      expect(content).not.toContain('buildRelationshipContextFromCanonical');
    });
  });
});
