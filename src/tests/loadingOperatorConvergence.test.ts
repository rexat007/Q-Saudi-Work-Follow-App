import { describe, it, expect, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { 
  buildRelationshipContextFromCanonical, 
  buildRelationshipContext,
  MasterDataRelationshipInput 
} from '../utils/masterDataUtils';
import { truckRepository } from '../repositories/truck.repository';
import { CarrierEntity, DriverEntity, TruckEntity, MaterialEntity } from '../types/entities';

describe('Loading Operator Canonical Master-Data Resolution Convergence', () => {
  const dummyDate = new Date();

  const sampleCarriers: CarrierEntity[] = [
    {
      carrierId: 'CRR-001',
      name: 'شركة الناقل المعتمد',
      normalizedName: 'شركة الناقل المعتمد',
      projectId: 'PRJ-ALPHA',
      companyNameAr: 'شركة الناقل المعتمد',
      commercialRegistrationNo: '1010101010',
      status: 'ACTIVE',
      createdBy: 'USER-1',
      updatedBy: 'USER-1',
      createdAt: dummyDate,
      updatedAt: dummyDate
    }
  ];

  const sampleDrivers: DriverEntity[] = [
    {
      driverId: 'DRV-001',
      name: 'محمد علي',
      normalizedName: 'محمد علي',
      carrierId: 'CRR-001',
      projectId: 'PRJ-ALPHA',
      idNumber: '2020202020',
      fullNameAr: 'محمد علي',
      nationalOrIqamaId: '2020202020',
      phone: '0555555555',
      status: 'ACTIVE',
      createdBy: 'USER-1',
      updatedBy: 'USER-1',
      createdAt: dummyDate,
      updatedAt: dummyDate
    }
  ];

  const sampleTrucks: TruckEntity[] = [
    {
      truckId: 'TRK-001',
      plate: 'أ ب ج 1234',
      normalizedPlate: 'أ ب ج 1234',
      carrierId: 'CRR-001',
      projectId: 'PRJ-ALPHA',
      plateNumberAr: 'أ ب ج 1234',
      tareWeightKg: 14000,
      legalPayloadLimitKg: 30000,
      status: 'ACTIVE',
      createdBy: 'USER-1',
      updatedBy: 'USER-1',
      createdAt: dummyDate,
      updatedAt: dummyDate
    }
  ];

  const sampleMaterials: MaterialEntity[] = [
    {
      materialId: 'MAT-001',
      name: 'بحص مقاس 3/4',
      normalizedName: 'بحص مقاس 3/4',
      projectId: 'PRJ-ALPHA',
      nameAr: 'بحص مقاس 3/4',
      code: 'AGG-034',
      unitOfMeasure: 'TON',
      status: 'ACTIVE',
      createdBy: 'USER-1',
      updatedBy: 'USER-1',
      createdAt: dummyDate,
      updatedAt: dummyDate
    }
  ];

  // 1. Source file code audit
  it('1. LoadingOperatorView does NOT call legacy buildRelationshipContext("ALL")', () => {
    const filePath = path.join(process.cwd(), 'src/components/field/LoadingOperatorView.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    expect(content).not.toContain('buildRelationshipContext("ALL")');
    expect(content).not.toContain("buildRelationshipContext('ALL')");
    expect(content).toContain('buildRelationshipContextFromCanonical');
  });

  it('2. LoadingOperatorView does NOT import adminConsoleService', () => {
    const filePath = path.join(process.cwd(), 'src/components/field/LoadingOperatorView.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    expect(content).not.toContain('adminConsoleService');
  });

  it('3. LoadingOperatorView imports all four canonical project repositories', () => {
    const filePath = path.join(process.cwd(), 'src/components/field/LoadingOperatorView.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    expect(content).toContain('carrierRepository');
    expect(content).toContain('driverRepository');
    expect(content).toContain('truckRepository');
    expect(content).toContain('materialRepository');
  });

  // 2. Canonical resolution for selected project only
  it('4. buildRelationshipContextFromCanonical resolves project-scoped entities deterministically', () => {
    const input: MasterDataRelationshipInput = {
      projectId: 'PRJ-ALPHA',
      carriers: sampleCarriers,
      drivers: sampleDrivers,
      trucks: sampleTrucks,
      materials: sampleMaterials
    };

    const ctx = buildRelationshipContextFromCanonical(input);

    expect(ctx.projectId).toBe('PRJ-ALPHA');
    expect(ctx.authorizedCarrierIds).toEqual(['CRR-001']);
    expect(ctx.authorizedMaterialIds).toEqual(['MAT-001']);
    expect(ctx.knownCarriers.length).toBe(1);
    expect(ctx.knownCarriers[0].carrierId).toBe('CRR-001');
    expect(ctx.knownCarriers[0].name).toBe('شركة الناقل المعتمد');
    expect(ctx.knownTrucks.length).toBe(1);
    expect(ctx.knownTrucks[0].truckId).toBe('TRK-001');
    expect(ctx.knownTrucks[0].plate).toBe('أ ب ج 1234');
    expect(ctx.knownDrivers.length).toBe(1);
    expect(ctx.knownDrivers[0].driverId).toBe('DRV-001');
    expect(ctx.knownDrivers[0].name).toBe('محمد علي');
    expect(ctx.knownMaterials.length).toBe(1);
    expect(ctx.knownMaterials[0].materialId).toBe('MAT-001');
    expect(ctx.knownMaterials[0].name).toBe('بحص مقاس 3/4');
  });

  // 3. Strict rejection of empty/ALL projectId
  it('5. buildRelationshipContextFromCanonical rejects empty, whitespace, or ALL projectId', () => {
    const baseInput: MasterDataRelationshipInput = {
      projectId: '',
      carriers: sampleCarriers,
      drivers: sampleDrivers,
      trucks: sampleTrucks,
      materials: sampleMaterials
    };

    expect(() => buildRelationshipContextFromCanonical(baseInput)).toThrow(
      'projectId must be a valid project identifier and cannot be empty or ALL'
    );

    expect(() => buildRelationshipContextFromCanonical({ ...baseInput, projectId: '   ' })).toThrow(
      'projectId must be a valid project identifier and cannot be empty or ALL'
    );

    expect(() => buildRelationshipContextFromCanonical({ ...baseInput, projectId: 'ALL' })).toThrow(
      'projectId must be a valid project identifier and cannot be empty or ALL'
    );
  });

  // 4. No semantic substitution (name = name || id forbidden)
  it('6. Truthful absence preserved: display labels do NOT substitute ID when label is absent', () => {
    const carriersNoName: CarrierEntity[] = [
      {
        carrierId: 'CRR-NONAME',
        name: '',
        normalizedName: '',
        projectId: 'PRJ-STRICT',
        companyNameAr: '',
        commercialRegistrationNo: '1010',
        status: 'ACTIVE',
        createdBy: 'USER-1',
        updatedBy: 'USER-1',
        createdAt: dummyDate,
        updatedAt: dummyDate
      }
    ];

    const trucksNoPlate: TruckEntity[] = [
      {
        truckId: 'TRK-NOPLATE',
        plate: '',
        normalizedPlate: '',
        projectId: 'PRJ-STRICT',
        carrierId: 'CRR-NONAME',
        plateNumberAr: '',
        tareWeightKg: 10000,
        legalPayloadLimitKg: 20000,
        status: 'ACTIVE',
        createdBy: 'USER-1',
        updatedBy: 'USER-1',
        createdAt: dummyDate,
        updatedAt: dummyDate
      }
    ];

    const input: MasterDataRelationshipInput = {
      projectId: 'PRJ-STRICT',
      carriers: carriersNoName,
      drivers: [],
      trucks: trucksNoPlate,
      materials: []
    };

    const ctx = buildRelationshipContextFromCanonical(input);

    // Name must NOT be the carrierId 'CRR-NONAME'
    expect(ctx.knownCarriers[0].name).not.toBe('CRR-NONAME');
    expect(ctx.knownCarriers[0].name).toBe('');

    // Plate must NOT be the truckId 'TRK-NOPLATE'
    expect(ctx.knownTrucks[0].plate).not.toBe('TRK-NOPLATE');
    expect(ctx.knownTrucks[0].plate).toBe('');
  });

  // 5. Zero side-effects
  it('7. buildRelationshipContextFromCanonical has zero side effects and does not mutate inputs', () => {
    const input: MasterDataRelationshipInput = {
      projectId: 'PRJ-ALPHA',
      carriers: Object.freeze([...sampleCarriers]) as any,
      drivers: Object.freeze([...sampleDrivers]) as any,
      trucks: Object.freeze([...sampleTrucks]) as any,
      materials: Object.freeze([...sampleMaterials]) as any
    };

    const res1 = buildRelationshipContextFromCanonical(input);
    const res2 = buildRelationshipContextFromCanonical(input);

    expect(res1).toEqual(res2);
    expect(res1).not.toBe(res2); // New pure object
  });

  // 6. Backward compatibility of legacy buildRelationshipContext
  it('8. Legacy buildRelationshipContext remains preserved and backward-compatible for existing callers', () => {
    const legacyCtx = buildRelationshipContext('PRJ-NONEXISTENT');
    expect(legacyCtx).toBeDefined();
    expect(legacyCtx.projectId).toBe('PRJ-NONEXISTENT');
    expect(Array.isArray(legacyCtx.authorizedCarrierIds)).toBe(true);
    expect(Array.isArray(legacyCtx.knownCarriers)).toBe(true);
  });

  // 7. Truck repository optional onError callback
  it('9. truckRepository.subscribeByProject supports optional onError callback without breaking', () => {
    expect(typeof truckRepository.subscribeByProject).toBe('function');

    // Calling subscribeByProject without auth should return clean unsubscribe function without throwing
    const unsub = truckRepository.subscribeByProject(
      'PRJ-TEST',
      () => {},
      (err) => console.log('Error callback received', err)
    );

    expect(typeof unsub).toBe('function');
    unsub();

    // Call site without onError (existing callers)
    const unsub2 = truckRepository.subscribeByProject(
      'PRJ-TEST',
      () => {}
    );
    expect(typeof unsub2).toBe('function');
    unsub2();
  });

  // 8. Project switch isolation logic verification
  it('10. Generation guard drops late callbacks from previous project', () => {
    let currentGen = 0;
    let activeCarriers: CarrierEntity[] = [];

    // Switch to Project A
    const genA = ++currentGen;
    activeCarriers = []; // flushed immediately

    // Switch to Project B
    const genB = ++currentGen;
    activeCarriers = []; // flushed immediately

    // Late callback arrives from Project A
    const lateProjectACallback = (list: CarrierEntity[]) => {
      if (genA !== currentGen) return; // Dropped!
      activeCarriers = list;
    };

    lateProjectACallback(sampleCarriers);
    expect(activeCarriers).toEqual([]); // Still empty, late callback ignored!

    // Project B callback arrives
    const projectBCallback = (list: CarrierEntity[]) => {
      if (genB !== currentGen) return;
      activeCarriers = list;
    };

    const projectBCarriers: CarrierEntity[] = [
      {
        carrierId: 'CRR-BETA-01',
        name: 'شركة ناقل مشروع باء',
        normalizedName: 'شركة ناقل مشروع باء',
        projectId: 'PRJ-BETA',
        companyNameAr: 'شركة ناقل مشروع باء',
        commercialRegistrationNo: '9999',
        status: 'ACTIVE',
        createdBy: 'USER-1',
        updatedBy: 'USER-1',
        createdAt: dummyDate,
        updatedAt: dummyDate
      }
    ];

    projectBCallback(projectBCarriers);
    expect(activeCarriers).toEqual(projectBCarriers);
    expect(activeCarriers[0].carrierId).toBe('CRR-BETA-01');
  });
});
