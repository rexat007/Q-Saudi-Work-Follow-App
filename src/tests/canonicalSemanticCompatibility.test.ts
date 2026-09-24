import { describe, it, expect } from 'vitest';
import { ExcelCsvTripValidator } from '../services/import/tripImportValidator';
import {
  DriverTruckImportEntityResolver,
  DriverTruckImportValidator,
  DriverTruckImportCommitter,
  CanonicalDriverTruckRow,
} from '../services/import/driverTruckImport';
import { ImportProjectContextAdapter } from '../services/import/importProjectContext.adapter';
import { RelationshipContext } from '../types/dataQuality';
import { PipelineContext, UnifiedImportBatch } from '../types/unifiedImport';

describe('Unit 1 Post-Push Remediation: Canonical Semantic Compatibility Suite', () => {
  const mockRelContext: RelationshipContext = {
    projectId: 'PRJ-NEOM-NORTH-01',
    authorizedCarrierIds: ['CAR-001'],
    authorizedMaterialIds: ['MAT-001'],
    knownCarriers: [
      { carrierId: 'CAR-001', name: 'شركة البدر للنقل', status: 'ACTIVE' },
    ],
    knownTrucks: [
      { truckId: 'TRK-001', plate: 'أ ب ج 1234', carrierId: 'CAR-001', status: 'ACTIVE' },
    ],
    knownDrivers: [
      { driverId: 'DRV-001', name: 'سالم الدوسري', idNumber: '1099887766', carrierId: 'CAR-001', status: 'ACTIVE' },
    ],
    knownMaterials: [
      { materialId: 'MAT-001', name: 'ركام بازلتي 20 ملم', code: 'AGG-20', status: 'ACTIVE' },
    ],
  };

  const pipelineContext = ImportProjectContextAdapter.createPipelineContext({
    relContext: mockRelContext,
    projectId: 'PRJ-NEOM-NORTH-01',
    userId: 'USR-ADMIN-1',
    role: 'PROJECT_ADMIN',
  });

  const tripValidator = new ExcelCsvTripValidator();
  const dtResolver = new DriverTruckImportEntityResolver();
  const dtValidator = new DriverTruckImportValidator();

  describe('Part A: Trip Validator Canonical Compatibility', () => {
    it('1. accepts row when canonical.carrier is the canonical Arabic name matching knownEntities.carriers', () => {
      const row: any = {
        rowNumber: 1,
        canonical: {
          tripId: 'TRIP-101',
          date: '2026-05-10',
          truckNo: 'أ ب ج 1234',
          carrier: 'شركة البدر للنقل',
          materialType: 'AGG-20',
          netWeight: 30000,
        },
        raw: {},
        status: 'VALID',
        validationIssues: [],
      };

      const issues = tripValidator.validateRow(row, pipelineContext);
      const carrierIssues = issues.filter((i) => i.code === 'UNKNOWN_CARRIER' || i.code === 'RELATIONSHIP_CONFLICT');
      expect(carrierIssues).toHaveLength(0);
    });

    it('2. accepts row when canonical.carrier is the canonical carrier ID (CAR-001)', () => {
      const row: any = {
        rowNumber: 2,
        canonical: {
          tripId: 'TRIP-102',
          date: '2026-05-10',
          truckNo: 'أ ب ج 1234',
          carrier: 'CAR-001',
          materialType: 'AGG-20',
          netWeight: 30000,
        },
        raw: {},
        status: 'VALID',
        validationIssues: [],
      };

      const issues = tripValidator.validateRow(row, pipelineContext);
      const carrierIssues = issues.filter((i) => i.code === 'UNKNOWN_CARRIER' || i.code === 'RELATIONSHIP_CONFLICT');
      expect(carrierIssues).toHaveLength(0);
    });

    it('3. warns with UNKNOWN_CARRIER when carrier is completely unknown', () => {
      const row: any = {
        rowNumber: 3,
        canonical: {
          tripId: 'TRIP-103',
          date: '2026-05-10',
          truckNo: 'أ ب ج 1234',
          carrier: 'شركة غير معروفة إطلاقاً',
          materialType: 'AGG-20',
          netWeight: 30000,
        },
        raw: {},
        status: 'VALID',
        validationIssues: [],
      };

      const issues = tripValidator.validateRow(row, pipelineContext);
      expect(issues.some((i) => i.code === 'UNKNOWN_CARRIER')).toBe(true);
    });

    it('4. accepts row when material is provided by materialId, code, or canonical name', () => {
      const rowId: any = {
        rowNumber: 4,
        canonical: { tripId: 'T4', date: '2026-05-10', materialType: 'MAT-001' },
        raw: {},
      };
      const rowCode: any = {
        rowNumber: 5,
        canonical: { tripId: 'T5', date: '2026-05-10', materialType: 'AGG-20' },
        raw: {},
      };
      const rowName: any = {
        rowNumber: 6,
        canonical: { tripId: 'T6', date: '2026-05-10', materialType: 'ركام بازلتي 20 ملم' },
        raw: {},
      };

      expect(tripValidator.validateRow(rowId, pipelineContext).some((i) => i.code === 'UNKNOWN_MATERIAL')).toBe(false);
      expect(tripValidator.validateRow(rowCode, pipelineContext).some((i) => i.code === 'UNKNOWN_MATERIAL')).toBe(false);
      expect(tripValidator.validateRow(rowName, pipelineContext).some((i) => i.code === 'UNKNOWN_MATERIAL')).toBe(false);
    });

    it('5. warns with UNKNOWN_MATERIAL and MATERIAL_PROJECT_CONFLICT for unknown materials', () => {
      const row: any = {
        rowNumber: 7,
        canonical: { tripId: 'T7', date: '2026-05-10', materialType: 'مادة غير مصرحة' },
        raw: {},
      };

      const issues = tripValidator.validateRow(row, pipelineContext);
      expect(issues.some((i) => i.code === 'UNKNOWN_MATERIAL')).toBe(true);
      expect(issues.some((i) => i.code === 'MATERIAL_PROJECT_CONFLICT')).toBe(true);
    });

    it('6. validates truck-carrier association using canonical relationship map and normalized names', () => {
      // Truck 'أ ب ج 1234' belongs to CAR-001 ('شركة البدر للنقل')
      const rowMatchingName: any = {
        rowNumber: 8,
        canonical: { tripId: 'T8', date: '2026-05-10', truckNo: 'ا ب ج 1234', carrier: 'شركة البدر للنقل' },
        raw: {},
      };
      const rowMatchingId: any = {
        rowNumber: 9,
        canonical: { tripId: 'T9', date: '2026-05-10', truckNo: 'أ ب ج 1234', carrier: 'CAR-001' },
        raw: {},
      };

      expect(tripValidator.validateRow(rowMatchingName, pipelineContext).some((i) => i.code === 'RELATIONSHIP_CONFLICT')).toBe(false);
      expect(tripValidator.validateRow(rowMatchingId, pipelineContext).some((i) => i.code === 'RELATIONSHIP_CONFLICT')).toBe(false);
    });

    it('7. warns with RELATIONSHIP_CONFLICT when known truck is paired with wrong carrier', () => {
      const rowMismatch: any = {
        rowNumber: 10,
        canonical: { tripId: 'T10', date: '2026-05-10', truckNo: 'أ ب ج 1234', carrier: 'CAR-OTHER-99' },
        raw: {},
      };

      const issues = tripValidator.validateRow(rowMismatch, pipelineContext);
      expect(issues.some((i) => i.code === 'RELATIONSHIP_CONFLICT')).toBe(true);
    });

    it('8. warns with TRUCK_MATCHED_CARRIER_UNKNOWN when known truck has no carrier in row', () => {
      const rowNoCarrier: any = {
        rowNumber: 11,
        canonical: { tripId: 'T11', date: '2026-05-10', truckNo: 'أ ب ج 1234', carrier: '' },
        raw: {},
      };

      const issues = tripValidator.validateRow(rowNoCarrier, pipelineContext);
      expect(issues.some((i) => i.code === 'TRUCK_MATCHED_CARRIER_UNKNOWN')).toBe(true);
    });
  });

  describe('Part B: Driver/Truck Import No-Guess Resolution & Validation', () => {
    it('9. does NOT fallback to context.knownEntities.carriers[0] when carrierName is missing', async () => {
      const row: CanonicalDriverTruckRow = {
        driverName: 'سائق جديد',
        driverIdentity: '1011223344',
        truckPlate: 'د ر ع 9999',
        // carrierName is omitted
      };

      const res = await dtResolver.resolveEntities(row, 1, pipelineContext);
      expect(res.carrier.matchedId).toBeUndefined();
      expect(res.carrier.isAuthorized).toBe(false);
    });

    it('10. resolves carrier correctly when explicit carrierName or carrierId matches knownEntities', async () => {
      const rowByName: CanonicalDriverTruckRow = {
        driverName: 'سائق جديد',
        driverIdentity: '1011223344',
        truckPlate: 'د ر ع 9999',
        carrierName: 'شركة البدر للنقل',
      };
      const rowById: CanonicalDriverTruckRow = {
        driverName: 'سائق جديد',
        driverIdentity: '1011223344',
        truckPlate: 'د ر ع 9999',
        carrierName: 'CAR-001',
      };

      const resByName = await dtResolver.resolveEntities(rowByName, 1, pipelineContext);
      const resById = await dtResolver.resolveEntities(rowById, 2, pipelineContext);

      expect(resByName.carrier.matchedId).toBe('CAR-001');
      expect(resByName.carrier.isAuthorized).toBe(true);
      expect(resById.carrier.matchedId).toBe('CAR-001');
      expect(resById.carrier.isAuthorized).toBe(true);
    });

    it('11. does NOT fallback to context.knownEntities.materials[0] when material is missing', async () => {
      const row: CanonicalDriverTruckRow = {
        driverName: 'سائق جديد',
        driverIdentity: '1011223344',
        truckPlate: 'د ر ع 9999',
        carrierName: 'CAR-001',
      };

      const res = await dtResolver.resolveEntities(row, 1, pipelineContext);
      expect(res.material.matchedId).toBeUndefined();
      expect(res.material.isAuthorized).toBe(false);
    });

    it('12. resolves material correctly when explicit material name, id, or code is provided', async () => {
      const rowByCode: CanonicalDriverTruckRow = {
        driverName: 'سائق جديد',
        truckPlate: 'د ر ع 9999',
        materialName: 'AGG-20',
      };
      const rowByName: CanonicalDriverTruckRow = {
        driverName: 'سائق جديد',
        truckPlate: 'د ر ع 9999',
        materialName: 'ركام بازلتي 20 ملم',
      };

      const resCode = await dtResolver.resolveEntities(rowByCode, 1, pipelineContext);
      const resName = await dtResolver.resolveEntities(rowByName, 2, pipelineContext);

      expect(resCode.material.matchedId).toBe('MAT-001');
      expect(resName.material.matchedId).toBe('MAT-001');
    });

    it('13. blocks row validation with UNRESOLVED_CARRIER when carrier cannot be resolved', () => {
      const importRow: any = {
        rowNumber: 1,
        canonical: {
          driverName: 'سائق جديد',
          truckPlate: 'د ر ع 9999',
          carrierName: 'ناقل غير مسجل',
        },
        entityResolutions: {
          carrier: { entityType: 'CARRIER', originalValue: 'ناقل غير مسجل', matchedId: undefined, confidence: 0, isExact: false },
        },
        validationIssues: [],
      };

      const issues = dtValidator.validateRow(importRow, pipelineContext);
      expect(issues.some((i) => i.code === 'UNRESOLVED_CARRIER' && i.blocking)).toBe(true);
    });

    it('13.1 blocks row validation with UNRESOLVED_MATERIAL when material is missing or unresolved', () => {
      const importRow: any = {
        rowNumber: 1,
        canonical: {
          driverName: 'سائق جديد',
          truckPlate: 'د ر ع 9999',
          carrierName: 'شركة البدر للنقل',
        },
        entityResolutions: {
          carrier: { entityType: 'CARRIER', matchedId: 'CAR-001', isAuthorized: true },
          material: { entityType: 'MATERIAL', matchedId: undefined, isAuthorized: false },
        },
        validationIssues: [],
      };

      const issues = dtValidator.validateRow(importRow, pipelineContext);
      expect(issues.some((i) => i.code === 'UNRESOLVED_MATERIAL' && i.blocking)).toBe(true);
    });

    it('14. committer fails row when carrierId or materialId is missing and does NOT fallback', async () => {
      const committer = new DriverTruckImportCommitter();
      const batch: UnifiedImportBatch = {
        importBatchId: 'BAT-NO-CARRIER',
        projectId: 'PRJ-NEOM-NORTH-01',
        source: { sourceType: 'EXCEL', importBatchId: 'BAT-NO-CARRIER' },
        currentStage: 'REVIEW',
        validationStatus: 'PASSED',
        commitStatus: 'READY_TO_COMMIT',
        totalRows: 2,
        validRows: 2,
        warningRows: 0,
        errorRows: 0,
        requiresReviewRows: 0,
        committedRows: 0,
        rows: [
          {
            rowNumber: 1,
            raw: {},
            canonical: {
              driverName: 'سائق مجهول الناقل',
              driverIdentity: '1099887711',
              truckPlate: 'د ر ع 1122',
              materialName: 'AGG-20',
            },
            entityResolutions: {
              material: { entityType: 'MATERIAL', matchedId: 'MAT-001', isAuthorized: true },
            },
            validationIssues: [],
            reviewStatus: 'accepted',
            status: 'VALID',
          },
          {
            rowNumber: 2,
            raw: {},
            canonical: {
              driverName: 'سائق مجهول المادة',
              driverIdentity: '1099887722',
              truckPlate: 'د ر ع 3344',
              carrierName: 'شركة البدر للنقل',
            },
            entityResolutions: {
              carrier: { entityType: 'CARRIER', matchedId: 'CAR-001', isAuthorized: true },
            },
            validationIssues: [],
            reviewStatus: 'accepted',
            status: 'VALID',
          },
        ],
        issues: [],
        operationId: 'OP-TEST-NO-CARRIER',
        createdAt: new Date().toISOString(),
        createdBy: 'USR-ADMIN-1',
        auditTrail: [],
      };

      const res = await committer.commit(batch, pipelineContext);
      expect(res.committedRows).toBe(0);
      expect(res.failedRows).toBe(2);
      expect(res.issues.some((i) => i.code === 'MISSING_CARRIER_ID')).toBe(true);
      expect(res.issues.some((i) => i.code === 'MISSING_MATERIAL_ID')).toBe(true);
    });
  });

  describe('Part C: Adapter Role Purity', () => {
    it('15. preserves provided role exactly (SUPER_ADMIN, VIEWER, DISPATCHER, etc.)', () => {
      const ctxSuper = ImportProjectContextAdapter.createPipelineContext({
        relContext: mockRelContext,
        projectId: 'PRJ-1',
        userId: 'U-1',
        role: 'SUPER_ADMIN',
      });
      const ctxViewer = ImportProjectContextAdapter.createPipelineContext({
        relContext: mockRelContext,
        projectId: 'PRJ-1',
        userId: 'U-2',
        role: 'VIEWER',
      });

      expect(ctxSuper.role).toBe('SUPER_ADMIN');
      expect(ctxViewer.role).toBe('VIEWER');
    });

    it('16. does NOT default missing role to PROJECT_ADMIN', () => {
      const ctxUndefined = ImportProjectContextAdapter.createPipelineContext({
        relContext: mockRelContext,
        projectId: 'PRJ-1',
        userId: 'U-3',
      });

      expect(ctxUndefined.role).toBeUndefined();
      expect(ctxUndefined.role).not.toBe('PROJECT_ADMIN');
    });

    it('17. retains full canonical knownEntities structure intact', () => {
      const ctx = ImportProjectContextAdapter.createPipelineContext({
        relContext: mockRelContext,
        projectId: 'PRJ-NEOM-NORTH-01',
        userId: 'U-4',
        role: 'PROJECT_ADMIN',
      });

      expect(ctx.knownEntities?.carriers).toHaveLength(1);
      expect(ctx.knownEntities?.trucks).toHaveLength(1);
      expect(ctx.knownEntities?.drivers).toHaveLength(1);
      expect(ctx.knownEntities?.materials).toHaveLength(1);
      expect(ctx.knownEntities?.carriers?.[0].carrierId).toBe('CAR-001');
      expect(ctx.knownEntities?.truckCarrierMap['أ ب ج 1234']).toBe('CAR-001');
      expect(ctx.knownEntities?.driverCarrierMap['DRV-001']).toBe('CAR-001');
    });

    it('18. guarantees tenant isolation when projectId in relContext matches boundary', () => {
      const ctx = ImportProjectContextAdapter.createPipelineContext({
        relContext: mockRelContext,
        projectId: 'FALLBACK-DIFF',
        userId: 'U-5',
      });

      expect(ctx.projectId).toBe('PRJ-NEOM-NORTH-01');
    });
  });
});
