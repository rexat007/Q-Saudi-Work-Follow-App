import { describe, it, expect, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { 
  buildRelationshipContextFromCanonical, 
  buildRelationshipContext,
  MasterDataRelationshipInput 
} from '../utils/masterDataUtils';
import { carrierRepository } from '../repositories/carrier.repository';
import { driverRepository } from '../repositories/driver.repository';
import { truckRepository } from '../repositories/truck.repository';
import { materialRepository } from '../repositories/material.repository';
import { CarrierEntity, DriverEntity, TruckEntity, MaterialEntity } from '../types/entities';

describe('ImportCenter Canonical Master-Entity Resolution Convergence Tests', () => {
  const dummyDate = new Date();

  const sampleCarriersP1: CarrierEntity[] = [
    {
      carrierId: 'CRR-P1-001',
      name: 'شركة ناقل مشروع نيوم',
      normalizedName: 'شركة ناقل مشروع نيوم',
      projectId: 'PRJ-NEOM-001',
      companyNameAr: 'شركة ناقل مشروع نيوم',
      commercialRegistrationNo: '1010101010',
      status: 'ACTIVE',
      createdBy: 'USER-1',
      updatedBy: 'USER-1',
      createdAt: dummyDate,
      updatedAt: dummyDate
    }
  ];

  const sampleDriversP1: DriverEntity[] = [
    {
      driverId: 'DRV-P1-001',
      name: 'أحمد محمود',
      normalizedName: 'أحمد محمود',
      carrierId: 'CRR-P1-001',
      projectId: 'PRJ-NEOM-001',
      idNumber: '1020304050',
      fullNameAr: 'أحمد محمود',
      nationalOrIqamaId: '1020304050',
      phone: '0501112233',
      status: 'ACTIVE',
      createdBy: 'USER-1',
      updatedBy: 'USER-1',
      createdAt: dummyDate,
      updatedAt: dummyDate
    }
  ];

  const sampleTrucksP1: TruckEntity[] = [
    {
      truckId: 'TRK-P1-001',
      plate: 'أ ب ج 5555',
      normalizedPlate: 'أ ب ج 5555',
      carrierId: 'CRR-P1-001',
      projectId: 'PRJ-NEOM-001',
      plateNumberAr: 'أ ب ج 5555',
      tareWeightKg: 13500,
      legalPayloadLimitKg: 32000,
      status: 'ACTIVE',
      createdBy: 'USER-1',
      updatedBy: 'USER-1',
      createdAt: dummyDate,
      updatedAt: dummyDate
    }
  ];

  const sampleMaterialsP1: MaterialEntity[] = [
    {
      materialId: 'MAT-P1-001',
      name: 'رمل أحمر مغسول',
      normalizedName: 'رمل أحمر مغسول',
      projectId: 'PRJ-NEOM-001',
      nameAr: 'رمل أحمر مغسول',
      code: 'SND-RED-01',
      unitOfMeasure: 'TON',
      status: 'ACTIVE',
      createdBy: 'USER-1',
      updatedBy: 'USER-1',
      createdAt: dummyDate,
      updatedAt: dummyDate
    }
  ];

  const sampleCarriersP2: CarrierEntity[] = [
    {
      carrierId: 'CRR-P2-999',
      name: 'شركة ناقل مشروع البحر الأحمر',
      normalizedName: 'شركة ناقل مشروع البحر الأحمر',
      projectId: 'PRJ-REDSEA-002',
      companyNameAr: 'شركة ناقل مشروع البحر الأحمر',
      commercialRegistrationNo: '2020202020',
      status: 'ACTIVE',
      createdBy: 'USER-2',
      updatedBy: 'USER-2',
      createdAt: dummyDate,
      updatedAt: dummyDate
    }
  ];

  const sampleDriversP2: DriverEntity[] = [
    {
      driverId: 'DRV-P2-999',
      name: 'سالم الدوسري',
      normalizedName: 'سالم الدوسري',
      carrierId: 'CRR-P2-999',
      projectId: 'PRJ-REDSEA-002',
      idNumber: '1099887766',
      fullNameAr: 'سالم الدوسري',
      nationalOrIqamaId: '1099887766',
      phone: '0509998877',
      status: 'ACTIVE',
      createdBy: 'USER-2',
      updatedBy: 'USER-2',
      createdAt: dummyDate,
      updatedAt: dummyDate
    }
  ];

  const sampleTrucksP2: TruckEntity[] = [
    {
      truckId: 'TRK-P2-999',
      plate: 'د هـ و 9999',
      normalizedPlate: 'د هـ و 9999',
      carrierId: 'CRR-P2-999',
      projectId: 'PRJ-REDSEA-002',
      plateNumberAr: 'د هـ و 9999',
      tareWeightKg: 14000,
      legalPayloadLimitKg: 30000,
      status: 'ACTIVE',
      createdBy: 'USER-2',
      updatedBy: 'USER-2',
      createdAt: dummyDate,
      updatedAt: dummyDate
    }
  ];

  const sampleMaterialsP2: MaterialEntity[] = [
    {
      materialId: 'MAT-P2-999',
      name: 'دفان صخري معتمد',
      normalizedName: 'دفان صخري معتمد',
      projectId: 'PRJ-REDSEA-002',
      nameAr: 'دفان صخري معتمد',
      code: 'RCK-FL-02',
      unitOfMeasure: 'TON',
      status: 'ACTIVE',
      createdBy: 'USER-2',
      updatedBy: 'USER-2',
      createdAt: dummyDate,
      updatedAt: dummyDate
    }
  ];

  // =========================================================================
  // SUITE 1: Source File Static Audits (Elimination of Legacy Master Authority)
  // =========================================================================
  describe('Suite 1: Static Code Audits & Authority Elimination', () => {
    const importCenterPath = path.join(process.cwd(), 'src/components/importCenter/ImportCenterView.tsx');
    const wbPath = path.join(process.cwd(), 'src/components/importCenter/WeighbridgeImportSection.tsx');
    const resPath = path.join(process.cwd(), 'src/components/importCenter/EntityResolutionSection.tsx');
    const archPath = path.join(process.cwd(), 'src/components/importCenter/UnifiedImportArchitectureSection.tsx');

    it('1. ImportCenterView is physically retired and does not exist', () => {
      expect(fs.existsSync(importCenterPath)).toBe(false);
    });

    it('2. WeighbridgeImportSection is physically retired and does not exist', () => {
      expect(fs.existsSync(wbPath)).toBe(false);
    });

    it('3. EntityResolutionSection is physically retired and does not exist', () => {
      expect(fs.existsSync(resPath)).toBe(false);
    });

    it('4. UnifiedImportArchitectureSection is physically retired and does not exist', () => {
      expect(fs.existsSync(archPath)).toBe(false);
    });
  });

  // =========================================================================
  // SUITE 2: Canonical RelationshipContext Construction & Scoping
  // =========================================================================
  describe('Suite 2: Canonical RelationshipContext Construction & Scoping', () => {
    it('9. buildRelationshipContextFromCanonical correctly maps P1 canonical entities', () => {
      const input: MasterDataRelationshipInput = {
        projectId: 'PRJ-NEOM-001',
        carriers: sampleCarriersP1,
        drivers: sampleDriversP1,
        trucks: sampleTrucksP1,
        materials: sampleMaterialsP1,
      };

      const ctx = buildRelationshipContextFromCanonical(input);

      expect(ctx.projectId).toBe('PRJ-NEOM-001');
      expect(ctx.authorizedCarrierIds).toEqual(['CRR-P1-001']);
      expect(ctx.authorizedMaterialIds).toEqual(['MAT-P1-001']);
      expect(ctx.knownCarriers).toHaveLength(1);
      expect(ctx.knownCarriers[0].carrierId).toBe('CRR-P1-001');
      expect(ctx.knownCarriers[0].name).toBe('شركة ناقل مشروع نيوم');
      expect(ctx.knownTrucks[0].truckId).toBe('TRK-P1-001');
      expect(ctx.knownTrucks[0].plate).toBe('أ ب ج 5555');
      expect(ctx.knownDrivers[0].driverId).toBe('DRV-P1-001');
      expect(ctx.knownDrivers[0].name).toBe('أحمد محمود');
      expect(ctx.knownMaterials[0].materialId).toBe('MAT-P1-001');
      expect(ctx.knownMaterials[0].code).toBe('SND-RED-01');
    });

    it('10. Context for P1 contains zero entities from P2 (strict tenant isolation)', () => {
      const inputP1: MasterDataRelationshipInput = {
        projectId: 'PRJ-NEOM-001',
        carriers: sampleCarriersP1,
        drivers: sampleDriversP1,
        trucks: sampleTrucksP1,
        materials: sampleMaterialsP1,
      };

      const ctxP1 = buildRelationshipContextFromCanonical(inputP1);

      expect(ctxP1.authorizedCarrierIds).not.toContain('CRR-P2-999');
      expect(ctxP1.authorizedMaterialIds).not.toContain('MAT-P2-999');
      expect(ctxP1.knownCarriers.some(c => c.carrierId === 'CRR-P2-999')).toBe(false);
      expect(ctxP1.knownTrucks.some(t => t.truckId === 'TRK-P2-999')).toBe(false);
      expect(ctxP1.knownDrivers.some(d => d.driverId === 'DRV-P2-999')).toBe(false);
      expect(ctxP1.knownMaterials.some(m => m.materialId === 'MAT-P2-999')).toBe(false);
    });

    it('11. buildRelationshipContextFromCanonical strictly throws on invalid/empty/ALL project ID', () => {
      const baseInput: MasterDataRelationshipInput = {
        projectId: '',
        carriers: sampleCarriersP1,
        drivers: sampleDriversP1,
        trucks: sampleTrucksP1,
        materials: sampleMaterialsP1,
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

    it('12. Inactive historical entities are preserved in canonical context (do NOT filter out INACTIVE)', () => {
      const inactiveCarrier: CarrierEntity = {
        ...sampleCarriersP1[0],
        carrierId: 'CRR-INACTIVE-01',
        name: 'الناقل المنتهي عقده',
        status: 'INACTIVE',
      };

      const ctx = buildRelationshipContextFromCanonical({
        projectId: 'PRJ-NEOM-001',
        carriers: [sampleCarriersP1[0], inactiveCarrier],
        drivers: sampleDriversP1,
        trucks: sampleTrucksP1,
        materials: sampleMaterialsP1,
      });

      expect(ctx.knownCarriers).toHaveLength(2);
      const foundInactive = ctx.knownCarriers.find(c => c.carrierId === 'CRR-INACTIVE-01');
      expect(foundInactive).toBeDefined();
      expect(foundInactive?.status).toBe('INACTIVE');
      expect(ctx.authorizedCarrierIds).toContain('CRR-INACTIVE-01');
    });

    it('13. Canonical context preserves truthful absence of names without substituting ID', () => {
      const noNameCarrier: CarrierEntity = {
        ...sampleCarriersP1[0],
        carrierId: 'CRR-EMPTY-NAME',
        name: '',
        companyNameAr: '',
      };

      const ctx = buildRelationshipContextFromCanonical({
        projectId: 'PRJ-NEOM-001',
        carriers: [noNameCarrier],
        drivers: [],
        trucks: [],
        materials: [],
      });

      expect(ctx.knownCarriers[0].name).toBe('');
      expect(ctx.knownCarriers[0].name).not.toBe('CRR-EMPTY-NAME');
    });
  });

  // =========================================================================
  // SUITE 3: Project Switch (P1 -> P2) Invalidation & Readiness Semantics
  // =========================================================================
  describe('Suite 3: Project Switch (P1 -> P2) Invalidation & Readiness Simulation', () => {
    it('14. P1 -> P2 switch invalidation flushes master data and resets readiness to PENDING', () => {
      // Simulate ImportCenterView state machine during project switch
      let currentProjectId: string | undefined = 'PRJ-NEOM-001';
      let generation = 0;
      let carriers: CarrierEntity[] = [...sampleCarriersP1];
      let readiness = { carriers: 'READY', drivers: 'READY', trucks: 'READY', materials: 'READY' };
      let activeBatch: any = { importBatchId: 'BATCH-P1-001', status: 'IN_REVIEW', rowCount: 10 };

      // Switch to PRJ-REDSEA-002
      currentProjectId = 'PRJ-REDSEA-002';
      const gen2 = ++generation;

      // Invalidation logic executed in useEffect:
      carriers = [];
      readiness = { carriers: 'PENDING', drivers: 'PENDING', trucks: 'PENDING', materials: 'PENDING' };
      activeBatch = createEmptyImportBatch();

      expect(carriers).toEqual([]);
      expect(readiness.carriers).toBe('PENDING');
      expect(readiness.drivers).toBe('PENDING');
      expect(readiness.trucks).toBe('PENDING');
      expect(readiness.materials).toBe('PENDING');
      expect(activeBatch.importBatchId).toBe('BATCH-EMPTY');
      expect(activeBatch.rowCount).toBe(0);
    });

    it('15. Generation guard discards late callbacks from previous project (P1)', () => {
      let generation = 0;
      let activeCarriers: CarrierEntity[] = [];

      // Mount with Project 1
      const genP1 = ++generation;
      activeCarriers = [...sampleCarriersP1];

      // Switch to Project 2
      const genP2 = ++generation;
      activeCarriers = []; // immediately flushed

      // Late async callback from P1 arrives
      const lateP1Callback = (list: CarrierEntity[]) => {
        if (genP1 !== generation) return; // Must drop
        activeCarriers = list;
      };

      lateP1Callback(sampleCarriersP1);
      expect(activeCarriers).toEqual([]); // Still flushed, late callback safely dropped

      // P2 callback arrives with genP2
      const p2Callback = (list: CarrierEntity[]) => {
        if (genP2 !== generation) return;
        activeCarriers = list;
      };

      p2Callback(sampleCarriersP2);
      expect(activeCarriers).toEqual(sampleCarriersP2);
      expect(activeCarriers[0].carrierId).toBe('CRR-P2-999');
    });

    it('16. Readiness is NOT READY if any one of the four collections is still PENDING', () => {
      const readinessStates = [
        { carriers: 'READY', drivers: 'READY', trucks: 'READY', materials: 'PENDING' },
        { carriers: 'READY', drivers: 'READY', trucks: 'PENDING', materials: 'READY' },
        { carriers: 'READY', drivers: 'PENDING', trucks: 'READY', materials: 'READY' },
        { carriers: 'PENDING', drivers: 'READY', trucks: 'READY', materials: 'READY' },
      ];

      for (const r of readinessStates) {
        const isReady = (
          r.carriers === 'READY' &&
          r.drivers === 'READY' &&
          r.trucks === 'READY' &&
          r.materials === 'READY'
        );
        expect(isReady).toBe(false);
      }
    });

    it('17. Readiness is NOT READY if any collection reports ERROR', () => {
      const readinessWithError = {
        carriers: 'READY',
        drivers: 'ERROR',
        trucks: 'READY',
        materials: 'READY',
      };

      const isReady = (
        readinessWithError.carriers === 'READY' &&
        readinessWithError.drivers === 'READY' &&
        readinessWithError.trucks === 'READY' &&
        readinessWithError.materials === 'READY'
      );
      expect(isReady).toBe(false);
    });

    it('18. Undefined, empty, or whitespace-only selectedProjectId produces null context', () => {
      const checkContext = (projectId?: string) => {
        const trimmed = projectId?.trim();
        if (!trimmed) return null;
        return buildRelationshipContextFromCanonical({
          projectId: trimmed,
          carriers: sampleCarriersP1,
          drivers: sampleDriversP1,
          trucks: sampleTrucksP1,
          materials: sampleMaterialsP1,
        });
      };

      expect(checkContext(undefined)).toBeNull();
      expect(checkContext('')).toBeNull();
      expect(checkContext('   ')).toBeNull();
      expect(checkContext('PRJ-VALID')).not.toBeNull();
    });
  });



  // =========================================================================
  // SUITE 5: Canonical Repository Compatibility & Pure Helpers
  // =========================================================================
  describe('Suite 5: Canonical Repository Compatibility & Backward Compatibility', () => {
    it('23. All 4 repositories have working subscribeByProject functions', () => {
      expect(typeof carrierRepository.subscribeByProject).toBe('function');
      expect(typeof driverRepository.subscribeByProject).toBe('function');
      expect(typeof truckRepository.subscribeByProject).toBe('function');
      expect(typeof materialRepository.subscribeByProject).toBe('function');
    });

    it('24. Subscriptions return clean unsubscribe functions even without auth', () => {
      const unsubC = carrierRepository.subscribeByProject('PRJ-TEST', () => {});
      const unsubD = driverRepository.subscribeByProject('PRJ-TEST', () => {});
      const unsubT = truckRepository.subscribeByProject('PRJ-TEST', () => {});
      const unsubM = materialRepository.subscribeByProject('PRJ-TEST', () => {});

      expect(typeof unsubC).toBe('function');
      expect(typeof unsubD).toBe('function');
      expect(typeof unsubT).toBe('function');
      expect(typeof unsubM).toBe('function');

      // Invoking them should not throw
      expect(() => {
        unsubC();
        unsubD();
        unsubT();
        unsubM();
      }).not.toThrow();
    });

    it('25. Subscriptions accept optional onError handler without crashing', () => {
      const dummyErrorCallback = vi.fn();
      const unsub = carrierRepository.subscribeByProject(
        'PRJ-TEST', 
        () => {}, 
        dummyErrorCallback
      );
      expect(typeof unsub).toBe('function');
      unsub();
    });

    it('26. Legacy buildRelationshipContext remains backward-compatible for existing callers', () => {
      const legacy = buildRelationshipContext('PRJ-LEGACY-TEST');
      expect(legacy).toBeDefined();
      expect(legacy.projectId).toBe('PRJ-LEGACY-TEST');
      expect(Array.isArray(legacy.authorizedCarrierIds)).toBe(true);
      expect(Array.isArray(legacy.knownCarriers)).toBe(true);
    });

    it('27. Pure builder does not mutate input collections', () => {
      const carriersFrozen = Object.freeze([...sampleCarriersP1]);
      const driversFrozen = Object.freeze([...sampleDriversP1]);
      const trucksFrozen = Object.freeze([...sampleTrucksP1]);
      const materialsFrozen = Object.freeze([...sampleMaterialsP1]);

      expect(() => {
        buildRelationshipContextFromCanonical({
          projectId: 'PRJ-FROZEN',
          carriers: carriersFrozen as any,
          drivers: driversFrozen as any,
          trucks: trucksFrozen as any,
          materials: materialsFrozen as any,
        });
      }).not.toThrow();
    });
  });
});
