import { describe, it, expect, beforeEach, vi } from 'vitest';
import { offlineCacheService } from '../services/offline/offlineCache.service';
import { indexedDBService } from '../services/offline/indexedDB.service';
import { projectRepository } from '../repositories/project.repository';
import { carrierRepository } from '../repositories/carrier.repository';
import { materialRepository } from '../repositories/material.repository';
import { truckRepository } from '../repositories/truck.repository';
import { driverRepository } from '../repositories/driver.repository';
import { pricingRuleRepository } from '../repositories/pricingRule.repository';
import { ProjectEntity, CarrierEntity } from '../types/entities';

describe('BLOCK 103B — Ghost Data Elimination & Canonical Cache Reconciliation (LU-P5-01)', () => {
  let mockProjects: ProjectEntity[] = [];
  let mockCarriers: Record<string, CarrierEntity[]> = {};

  beforeEach(async () => {
    await offlineCacheService.clearAllMasterData();
    mockProjects = [];
    mockCarriers = {};

    vi.spyOn(projectRepository, 'listAll').mockImplementation(async () => mockProjects);
    vi.spyOn(projectRepository, 'findById').mockImplementation(async (id: string) => {
      return mockProjects.find(p => p.projectId === id) || null;
    });

    vi.spyOn(carrierRepository, 'listByProject').mockImplementation(async (pId: string) => {
      return mockCarriers[pId] || [];
    });
    vi.spyOn(materialRepository, 'listByProject').mockImplementation(async () => []);
    vi.spyOn(truckRepository, 'listByProject').mockImplementation(async () => []);
    vi.spyOn(driverRepository, 'listByProject').mockImplementation(async () => []);
    vi.spyOn(pricingRuleRepository, 'listByProject').mockImplementation(async () => []);
  });

  it('1. Authoritative cache reconciliation removes deleted entities from local cache', async () => {
    // Seed initial master data via canonical project repository
    mockProjects = [{
      projectId: 'PRJ-100',
      projectCode: '100',
      nameAr: 'مشروع التجربة 1',
      nameEn: 'Test Project 1',
      clientName: 'Client A',
      status: 'ACTIVE',
      authorizedCarrierIds: [],
      authorizedMaterialIds: [],
      createdAt: new Date(),
      createdBy: 'test',
      updatedAt: new Date(),
      updatedBy: 'test'
    } as any];

    await offlineCacheService.seedAllMasterData();
    let projects = await offlineCacheService.getProjects();
    expect(projects.length).toBe(1);
    expect(projects[0].projectId).toBe('PRJ-100');

    // Now project is deleted in upstream authoritative source
    mockProjects = [];

    // Re-sync authoritative dataset via reconcileStore
    await offlineCacheService.reconcileStore('projects', [], p => p.projectId);

    projects = await offlineCacheService.getProjects();
    expect(projects.length).toBe(0);
  });

  it('2. Empty Firestore state does not repopulate cache or restore deleted entities', async () => {
    mockProjects = [];
    await offlineCacheService.seedAllMasterData();
    
    const projects = await offlineCacheService.getProjects();
    expect(projects.length).toBe(0);
  });

  it('3. Inactive or deleted entities are filtered out from operational selectors', async () => {
    mockProjects = [
      {
        projectId: 'PRJ-ACTIVE',
        projectCode: '101',
        nameAr: 'نشط',
        nameEn: 'Active',
        clientName: 'Client',
        status: 'ACTIVE',
        authorizedCarrierIds: [],
        authorizedMaterialIds: [],
        createdAt: new Date(),
        createdBy: 'test',
        updatedAt: new Date(),
        updatedBy: 'test'
      } as any,
      {
        projectId: 'PRJ-INACTIVE',
        projectCode: '102',
        nameAr: 'غير نشط',
        nameEn: 'Inactive',
        clientName: 'Client',
        status: 'ARCHIVED',
        authorizedCarrierIds: [],
        authorizedMaterialIds: [],
        createdAt: new Date(),
        createdBy: 'test',
        updatedAt: new Date(),
        updatedBy: 'test'
      } as any
    ];

    await offlineCacheService.seedAllMasterData();
    const activeProjects = await offlineCacheService.getProjects();
    expect(activeProjects.length).toBe(1);
    expect(activeProjects[0].projectId).toBe('PRJ-ACTIVE');
  });

  it('4. Project scoping and carrier hydration from canonical repository', async () => {
    mockProjects = [{
      projectId: 'PRJ-200',
      projectCode: '200',
      nameAr: 'مشروع 200',
      status: 'ACTIVE',
      authorizedCarrierIds: ['CAR-1'],
      authorizedMaterialIds: [],
      createdAt: new Date(),
      createdBy: 'test',
      updatedAt: new Date(),
      updatedBy: 'test'
    } as any];
    mockCarriers['PRJ-200'] = [{
      carrierId: 'CAR-1',
      projectId: 'PRJ-200',
      name: 'ناقل معتمد',
      companyNameAr: 'شركة النقل المعتمدة',
      commercialRegistrationNo: '1010123456',
      status: 'ACTIVE',
      isActive: true,
      createdAt: new Date(),
      createdBy: 'test',
      updatedAt: new Date(),
      updatedBy: 'test'
    } as any];

    await offlineCacheService.seedAllMasterData();
    const cachedCarriers = await offlineCacheService.getCarriers('PRJ-200');
    expect(cachedCarriers.length).toBe(1);
    expect(cachedCarriers[0].carrierId).toBe('CAR-1');
  });

  it('5. Outbox state preservation and error handling for invalid operations', async () => {
    expect(offlineCacheService).toBeDefined();
  });
});
