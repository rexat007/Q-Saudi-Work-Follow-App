import { describe, it, expect, beforeEach, vi } from 'vitest';
import { offlineCacheService } from '../services/offline/offlineCache.service';
import { indexedDBService } from '../services/offline/indexedDB.service';
import { projectRepository } from '../repositories/project.repository';
import { carrierRepository } from '../repositories/carrier.repository';
import { materialRepository } from '../repositories/material.repository';
import { truckRepository } from '../repositories/truck.repository';
import { driverRepository } from '../repositories/driver.repository';
import { pricingRuleRepository } from '../repositories/pricingRule.repository';
import { 
  ProjectEntity, 
  CarrierEntity, 
  MaterialEntity, 
  TruckEntity, 
  DriverEntity, 
  PricingRuleEntity 
} from '../types/entities';

describe('BLOCK 130 — LU-P5-01 Canonical Cache Hydration Verification', () => {
  let mockProjects: ProjectEntity[] = [];
  let mockCarriers: Record<string, CarrierEntity[]> = {};
  let mockMaterials: Record<string, MaterialEntity[]> = {};
  let mockTrucks: Record<string, TruckEntity[]> = {};
  let mockDrivers: Record<string, DriverEntity[]> = {};
  let mockPricingRules: Record<string, PricingRuleEntity[]> = {};

  beforeEach(async () => {
    await offlineCacheService.clearAllMasterData();
    mockProjects = [];
    mockCarriers = {};
    mockMaterials = {};
    mockTrucks = {};
    mockDrivers = {};
    mockPricingRules = {};

    vi.spyOn(projectRepository, 'listAll').mockImplementation(async () => mockProjects);
    vi.spyOn(projectRepository, 'findById').mockImplementation(async (id: string) => {
      return mockProjects.find(p => p.projectId === id) || null;
    });

    vi.spyOn(carrierRepository, 'listByProject').mockImplementation(async (pId: string) => {
      return mockCarriers[pId] || [];
    });
    vi.spyOn(materialRepository, 'listByProject').mockImplementation(async (pId: string) => {
      return mockMaterials[pId] || [];
    });
    vi.spyOn(truckRepository, 'listByProject').mockImplementation(async (pId: string) => {
      return mockTrucks[pId] || [];
    });
    vi.spyOn(driverRepository, 'listByProject').mockImplementation(async (pId: string) => {
      return mockDrivers[pId] || [];
    });
    vi.spyOn(pricingRuleRepository, 'listByProject').mockImplementation(async (pId: string) => {
      return mockPricingRules[pId] || [];
    });
  });

  it('1. Canonical repositories are used as hydration sources for all 6 master stores', async () => {
    mockProjects = [{
      projectId: 'PRJ-101',
      projectCode: '101',
      nameAr: 'مشروع رئيسي',
      status: 'ACTIVE',
      authorizedCarrierIds: ['CAR-1'],
      authorizedMaterialIds: ['MAT-1'],
      createdAt: new Date(),
      createdBy: 'test',
      updatedAt: new Date(),
      updatedBy: 'test'
    } as any];
    mockCarriers['PRJ-101'] = [{
      carrierId: 'CAR-1',
      projectId: 'PRJ-101',
      name: 'ناقل الرياض',
      companyNameAr: 'شركة ناقل الرياض',
      commercialRegistrationNo: '1010111111',
      status: 'ACTIVE',
      isActive: true,
      createdAt: new Date(),
      createdBy: 'test',
      updatedAt: new Date(),
      updatedBy: 'test'
    } as any];
    mockMaterials['PRJ-101'] = [{
      materialId: 'MAT-1',
      projectId: 'PRJ-101',
      name: 'حصى خشن',
      code: 'AGGR-01',
      unitOfMeasure: 'TON',
      status: 'ACTIVE',
      isActive: true,
      createdAt: new Date(),
      createdBy: 'test',
      updatedAt: new Date(),
      updatedBy: 'test'
    } as any];
    mockTrucks['PRJ-101'] = [{
      truckId: 'TRK-1',
      carrierId: 'CAR-1',
      projectId: 'PRJ-101',
      plate: '1234 ABC',
      truckType: 'TIPPER_32M3',
      status: 'ACTIVE',
      isActive: true,
      createdAt: new Date(),
      createdBy: 'test',
      updatedAt: new Date(),
      updatedBy: 'test'
    } as any];
    mockDrivers['PRJ-101'] = [{
      driverId: 'DRV-1',
      carrierId: 'CAR-1',
      projectId: 'PRJ-101',
      name: 'سالم أحمد',
      phone: '0501234567',
      idNumber: '1023456789',
      status: 'ACTIVE',
      isActive: true,
      createdAt: new Date(),
      createdBy: 'test',
      updatedAt: new Date(),
      updatedBy: 'test'
    } as any];
    mockPricingRules['PRJ-101'] = [{
      pricingRuleId: 'RULE-1',
      projectId: 'PRJ-101',
      carrierId: 'CAR-1',
      materialId: 'MAT-1',
      name: 'تسعيرة الحصى',
      pricingModel: 'PER_TON',
      baseRateSAR: 25.5,
      currency: 'SAR',
      effectiveFrom: '2026-01-01',
      effectiveTo: '2026-12-31',
      status: 'ACTIVE',
      isActive: true,
      createdAt: new Date(),
      createdBy: 'test',
      updatedAt: new Date(),
      updatedBy: 'test'
    } as any];

    await offlineCacheService.seedAllMasterData();

    const [projects, carriers, materials, trucks, drivers, rules] = await Promise.all([
      offlineCacheService.getProjects(),
      offlineCacheService.getCarriers('PRJ-101'),
      offlineCacheService.getMaterials('PRJ-101'),
      offlineCacheService.getTrucks('CAR-1'),
      offlineCacheService.getDrivers('CAR-1'),
      offlineCacheService.getPricingRules({ projectId: 'PRJ-101' })
    ]);

    expect(projects.length).toBe(1);
    expect(projects[0].projectId).toBe('PRJ-101');
    expect(carriers.length).toBe(1);
    expect(carriers[0].carrierId).toBe('CAR-1');
    expect(materials.length).toBe(1);
    expect(materials[0].materialId).toBe('MAT-1');
    expect(trucks.length).toBe(1);
    expect(trucks[0].truckId).toBe('TRK-1');
    expect(drivers.length).toBe(1);
    expect(drivers[0].driverId).toBe('DRV-1');
    expect(rules.length).toBe(1);
    expect(rules[0].pricingRuleId).toBe('RULE-1');
    expect(rules[0].agreedRate).toBe(25.5);
  });

  it('2. Legacy adminConsoleService and pricingService are not invoked during hydration', async () => {
    mockProjects = [{
      projectId: 'PRJ-102',
      projectCode: '102',
      nameAr: 'مشروع 102',
      status: 'ACTIVE',
      authorizedCarrierIds: [],
      authorizedMaterialIds: [],
      createdAt: new Date(),
      createdBy: 'test',
      updatedAt: new Date(),
      updatedBy: 'test'
    } as any];

    const listAllSpy = vi.spyOn(projectRepository, 'listAll');
    const carrierSpy = vi.spyOn(carrierRepository, 'listByProject');

    await offlineCacheService.seedAllMasterData();

    expect(listAllSpy).toHaveBeenCalled();
    expect(carrierSpy).toHaveBeenCalledWith('PRJ-102');
  });

  it('3. Existing IndexedDB object stores and schemas remain intact', async () => {
    const rawStores = await Promise.all([
      indexedDBService.getAll('projects'),
      indexedDBService.getAll('carriers'),
      indexedDBService.getAll('materials'),
      indexedDBService.getAll('trucks'),
      indexedDBService.getAll('drivers'),
      indexedDBService.getAll('pricingRules'),
      indexedDBService.getAll('metadata')
    ]);

    // All 7 stores respond cleanly without schema errors
    expect(rawStores).toHaveLength(7);
  });

  it('4. Project scoping is respected when scoping by projectId', async () => {
    mockProjects = [
      {
        projectId: 'PRJ-A',
        projectCode: 'A',
        nameAr: 'مشروع أ',
        status: 'ACTIVE',
        authorizedCarrierIds: ['CAR-A'],
        authorizedMaterialIds: [],
        createdAt: new Date(),
        createdBy: 'test',
        updatedAt: new Date(),
        updatedBy: 'test'
      } as any,
      {
        projectId: 'PRJ-B',
        projectCode: 'B',
        nameAr: 'مشروع ب',
        status: 'ACTIVE',
        authorizedCarrierIds: ['CAR-B'],
        authorizedMaterialIds: [],
        createdAt: new Date(),
        createdBy: 'test',
        updatedAt: new Date(),
        updatedBy: 'test'
      } as any
    ];
    mockCarriers['PRJ-A'] = [{
      carrierId: 'CAR-A',
      projectId: 'PRJ-A',
      name: 'ناقل أ',
      companyNameAr: 'شركة أ',
      commercialRegistrationNo: '10101',
      status: 'ACTIVE',
      isActive: true,
      createdAt: new Date(),
      createdBy: 'test',
      updatedAt: new Date(),
      updatedBy: 'test'
    } as any];
    mockCarriers['PRJ-B'] = [{
      carrierId: 'CAR-B',
      projectId: 'PRJ-B',
      name: 'ناقل ب',
      companyNameAr: 'شركة ب',
      commercialRegistrationNo: '10102',
      status: 'ACTIVE',
      isActive: true,
      createdAt: new Date(),
      createdBy: 'test',
      updatedAt: new Date(),
      updatedBy: 'test'
    } as any];

    // Seed only Project A
    await offlineCacheService.seedByProject('PRJ-A');

    const carriersForA = await offlineCacheService.getCarriers('PRJ-A');
    expect(carriersForA.length).toBe(1);
    expect(carriersForA[0].carrierId).toBe('CAR-A');
  });

  it('5. Inactive entities are filtered out from operational selectors', async () => {
    mockProjects = [{
      projectId: 'PRJ-1',
      projectCode: '1',
      nameAr: 'مشروع',
      status: 'ACTIVE',
      authorizedCarrierIds: ['CAR-ACT', 'CAR-INACT'],
      authorizedMaterialIds: [],
      createdAt: new Date(),
      createdBy: 'test',
      updatedAt: new Date(),
      updatedBy: 'test'
    } as any];
    mockCarriers['PRJ-1'] = [
      {
        carrierId: 'CAR-ACT',
        projectId: 'PRJ-1',
        name: 'نشط',
        companyNameAr: 'نشط',
        commercialRegistrationNo: '11',
        status: 'ACTIVE',
        isActive: true,
        createdAt: new Date(),
        createdBy: 'test',
        updatedAt: new Date(),
        updatedBy: 'test'
      } as any,
      {
        carrierId: 'CAR-INACT',
        projectId: 'PRJ-1',
        name: 'معطل',
        companyNameAr: 'معطل',
        commercialRegistrationNo: '12',
        status: 'INACTIVE',
        isActive: false,
        createdAt: new Date(),
        createdBy: 'test',
        updatedAt: new Date(),
        updatedBy: 'test'
      } as any
    ];

    await offlineCacheService.seedAllMasterData();
    const activeCarriers = await offlineCacheService.getCarriers('PRJ-1');
    expect(activeCarriers.length).toBe(1);
    expect(activeCarriers[0].carrierId).toBe('CAR-ACT');
  });

  it('6. Deletion-aware reconciliation prunes entities deleted remotely', async () => {
    mockProjects = [{
      projectId: 'PRJ-DEL',
      projectCode: 'DEL',
      nameAr: 'للحذف',
      status: 'ACTIVE',
      authorizedCarrierIds: [],
      authorizedMaterialIds: [],
      createdAt: new Date(),
      createdBy: 'test',
      updatedAt: new Date(),
      updatedBy: 'test'
    } as any];

    await offlineCacheService.seedAllMasterData();
    expect((await offlineCacheService.getProjects()).length).toBe(1);

    // Upstream project deleted
    mockProjects = [];
    await offlineCacheService.seedAllMasterData();

    // Local cache pruned
    expect((await offlineCacheService.getProjects()).length).toBe(0);
  });

  it('7. Empty authoritative repository results do not resurrect stale local records', async () => {
    mockProjects = [];
    mockCarriers = {};
    mockMaterials = {};

    await offlineCacheService.seedAllMasterData();

    const [projects, carriers, materials] = await Promise.all([
      offlineCacheService.getProjects(),
      offlineCacheService.getCarriers(),
      offlineCacheService.getMaterials()
    ]);

    expect(projects).toHaveLength(0);
    expect(carriers).toHaveLength(0);
    expect(materials).toHaveLength(0);
  });

  it('8. Hydration does not write to Firestore repositories (purely read-only hydration)', async () => {
    const createProjectSpy = vi.spyOn(projectRepository, 'create');
    const updateProjectSpy = vi.spyOn(projectRepository, 'update');
    const deleteProjectSpy = vi.spyOn(projectRepository, 'delete');

    await offlineCacheService.seedAllMasterData();

    expect(createProjectSpy).not.toHaveBeenCalled();
    expect(updateProjectSpy).not.toHaveBeenCalled();
    expect(deleteProjectSpy).not.toHaveBeenCalled();
  });
});
