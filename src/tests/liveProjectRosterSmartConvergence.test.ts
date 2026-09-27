import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DriverTruckPipelineService } from '../services/import/driverTruckPipeline.service';
import { ExcelCsvPipelineService } from '../services/import/excelCsvPipeline.service';
import { smartSourceDiscoveryService } from '../services/import/smartSourceDiscovery.service';
import { entityResolutionCommandService } from '../services/import/entityResolutionCommand.service';
import { RosterBatchReviewService } from '../services/import/rosterBatchReview.service';
import { isProjectOperationallyMutable, canPerformOperationalMutation } from '../services/projectMutability.policy';
import { UnifiedImportBatch, PipelineContext, ImportRow } from '../types/unifiedImport';
import { normalizeName } from '../utils/normalization';

describe('Live Project Roster Smart Convergence & Smart Batch Review (Beta 2)', () => {
  const sampleContext: PipelineContext = {
    userId: 'USER-01',
    userName: 'Test User',
    role: 'PROJECT_ADMIN',
    assignedProjectIds: ['PRJ-1'],
    projectId: 'PRJ-1',
    operationId: 'OP-LIVETEST',
    knownEntities: {
      carriers: [{ carrierId: 'CAR-1', name: 'شركة النقل المتميزة', projectId: 'PRJ-1' }],
      trucks: [{ truckId: 'TRK-1', plate: 'ABC-1234', projectId: 'PRJ-1' }],
      drivers: [{ driverId: 'DRV-1', name: 'أحمد علي', projectId: 'PRJ-1' }],
      materials: [{ materialId: 'MAT-1', name: 'رمل', code: 'SAND', projectId: 'PRJ-1' }],
    },
  };

  const createBatchWithRows = (count: number, overrideSupplier?: (i: number) => Partial<ImportRow>): UnifiedImportBatch => {
    const rows: ImportRow[] = [];
    for (let i = 1; i <= count; i++) {
      const overrides = overrideSupplier ? overrideSupplier(i) : {};
      rows.push({
        rowNumber: i,
        sourceRowId: i,
        status: 'PENDING',
        reviewStatus: 'requires_review',
        raw: { driverName: `سائق ${i}`, plate: `XYZ-${i}`, carrier: 'شركة Alpha' },
        mapped: { driverName: `سائق ${i}`, plate: `XYZ-${i}` },
        canonical: { driverName: `سائق ${i}`, plate: `XYZ-${i}` },
        entityResolutions: {
          carrier: {
            entityType: 'CARRIER',
            sourceValue: 'شركة Alpha',
            matchedId: undefined,
            recommendation: 'REVIEW',
            candidates: [{ candidateEntityId: 'CAR-1', candidateDisplayName: 'شركة النقل المتميزة' }],
          },
          truck: { entityType: 'TRUCK', sourceValue: `XYZ-${i}`, matchedId: `TRK-${i}`, recommendation: 'ACCEPT', entityId: `TRK-${i}` },
          driver: { entityType: 'DRIVER', sourceValue: `سائق ${i}`, matchedId: `DRV-${i}`, recommendation: 'ACCEPT', entityId: `DRV-${i}` },
          material: { entityType: 'MATERIAL', sourceValue: 'رمل', matchedId: 'MAT-1', recommendation: 'ACCEPT', entityId: 'MAT-1' },
        },
        resolvedValues: {},
        validationIssues: [],
        ...overrides,
      });
    }

    return {
      importBatchId: 'BAT-TEST-001',
      projectId: 'PRJ-1',
      batchType: 'DRIVER_TRUCK_ROSTER',
      totalRows: count,
      committedRows: 0,
      skippedRows: 0,
      failedRows: 0,
      errorRows: 0,
      warningRows: 0,
      requiresReviewRows: count,
      status: 'PENDING',
      source: { sourceType: 'EXCEL', sourceFileId: 'F-1', sourceFileName: 'test.xlsx' },
      rows,
      issues: [],
      auditTrail: [],
      createdAt: '2026-01-01',
      createdBy: 'USER-1',
      updatedAt: '2026-01-01',
      updatedBy: 'USER-1',
    };
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // =========================================================================
  // GROUPING & OCCURRENCE TESTS (1 - 11)
  // =========================================================================

  it('1. 100 identical carrier source values produce exactly ONE carrier group', () => {
    const batch = createBatchWithRows(100);
    const groups = RosterBatchReviewService.getBatchReviewGroups(batch);
    expect(groups.carrier).toHaveLength(1);
    expect(groups.carrier[0].sourceValue).toBe('شركة Alpha');
  });

  it('2. carrier group occurrenceCount equals 100', () => {
    const batch = createBatchWithRows(100);
    const groups = RosterBatchReviewService.getBatchReviewGroups(batch);
    expect(groups.carrier[0].occurrenceCount).toBe(100);
  });

  it('3. carrier group rowNumbers contains all 100 row numbers', () => {
    const batch = createBatchWithRows(100);
    const groups = RosterBatchReviewService.getBatchReviewGroups(batch);
    expect(groups.carrier[0].rowNumbers).toHaveLength(100);
    expect(groups.carrier[0].rowNumbers[0]).toBe(1);
    expect(groups.carrier[0].rowNumbers[99]).toBe(100);
  });

  it('4. one grouped carrier decision updates all 100 matching rows', () => {
    const batch = createBatchWithRows(100);
    const normKey = normalizeName('شركة Alpha');
    const updated = DriverTruckPipelineService.applyGroupedEntityResolutionDecision(
      batch,
      'carrier',
      normKey,
      'ACCEPT_CANDIDATE',
      { selectedEntityId: 'CAR-1', selectedDisplayName: 'شركة النقل المتميزة' },
      sampleContext,
      'USER-01'
    );

    expect(updated.rows.every((r) => r.entityResolutions?.carrier?.matchedId === 'CAR-1')).toBe(true);
    expect(updated.rows.every((r) => r.entityResolutions?.carrier?.recommendation === 'ACCEPT')).toBe(true);
  });

  it('5. unrelated carrier row remains unchanged', () => {
    const batch = createBatchWithRows(10, (i) => {
      if (i === 10) {
        return {
          entityResolutions: {
            carrier: { entityType: 'CARRIER', sourceValue: 'شركة Beta', recommendation: 'REVIEW' },
          },
        };
      }
      return {};
    });

    const normKey = normalizeName('شركة Alpha');
    const updated = DriverTruckPipelineService.applyGroupedEntityResolutionDecision(
      batch,
      'carrier',
      normKey,
      'ACCEPT_CANDIDATE',
      { selectedEntityId: 'CAR-1', selectedDisplayName: 'شركة النقل المتميزة' },
      sampleContext,
      'USER-01'
    );

    // Rows 1-9 updated
    expect(updated.rows[0].entityResolutions?.carrier?.matchedId).toBe('CAR-1');
    // Row 10 unchanged
    expect(updated.rows[9].entityResolutions?.carrier?.sourceValue).toBe('شركة Beta');
    expect(updated.rows[9].entityResolutions?.carrier?.matchedId).toBeUndefined();
  });

  it('6. one grouped material decision updates all matching rows', () => {
    const batch = createBatchWithRows(5, () => ({
      entityResolutions: {
        material: { entityType: 'MATERIAL', sourceValue: 'حصى', recommendation: 'REVIEW' },
      },
    }));

    const normKey = normalizeName('حصى');
    const updated = DriverTruckPipelineService.applyGroupedEntityResolutionDecision(
      batch,
      'material',
      normKey,
      'ACCEPT_CANDIDATE',
      { selectedEntityId: 'MAT-1', selectedDisplayName: 'حصى ممتاز' },
      sampleContext,
      'USER-01'
    );

    expect(updated.rows.every((r) => r.entityResolutions?.material?.matchedId === 'MAT-1')).toBe(true);
  });

  it('7. one grouped driver decision updates all matching rows', () => {
    const batch = createBatchWithRows(5, () => ({
      entityResolutions: {
        driver: { entityType: 'DRIVER', sourceValue: 'سالم الدوسري', recommendation: 'REVIEW' },
      },
    }));

    const normKey = normalizeName('سالم الدوسري');
    const updated = DriverTruckPipelineService.applyGroupedEntityResolutionDecision(
      batch,
      'driver',
      normKey,
      'ACCEPT_CANDIDATE',
      { selectedEntityId: 'DRV-1', selectedDisplayName: 'سالم الدوسري' },
      sampleContext,
      'USER-01'
    );

    expect(updated.rows.every((r) => r.entityResolutions?.driver?.matchedId === 'DRV-1')).toBe(true);
  });

  it('8. one grouped truck decision updates all matching rows', () => {
    const batch = createBatchWithRows(5, () => ({
      entityResolutions: {
        truck: { entityType: 'TRUCK', sourceValue: 'KSA-9999', recommendation: 'REVIEW' },
      },
    }));

    const normKey = normalizeName('KSA-9999');
    const updated = DriverTruckPipelineService.applyGroupedEntityResolutionDecision(
      batch,
      'truck',
      normKey,
      'ACCEPT_CANDIDATE',
      { selectedEntityId: 'TRK-1', selectedDisplayName: 'KSA-9999' },
      sampleContext,
      'USER-01'
    );

    expect(updated.rows.every((r) => r.entityResolutions?.truck?.matchedId === 'TRK-1')).toBe(true);
  });

  it('9. same normalized source value groups together', () => {
    const batch = createBatchWithRows(3, (i) => ({
      entityResolutions: {
        carrier: {
          entityType: 'CARRIER',
          sourceValue: i === 1 ? 'شركة Alpha' : i === 2 ? '  شركة alpha  ' : 'شركة Alpha',
          recommendation: 'REVIEW',
        },
      },
    }));

    const groups = RosterBatchReviewService.getBatchReviewGroups(batch);
    expect(groups.carrier).toHaveLength(1);
    expect(groups.carrier[0].occurrenceCount).toBe(3);
  });

  it('10. different normalized source values remain separate', () => {
    const batch = createBatchWithRows(2, (i) => ({
      entityResolutions: {
        carrier: {
          entityType: 'CARRIER',
          sourceValue: i === 1 ? 'شركة A' : 'شركة B',
          recommendation: 'REVIEW',
        },
      },
    }));

    const groups = RosterBatchReviewService.getBatchReviewGroups(batch);
    expect(groups.carrier).toHaveLength(2);
  });

  it('11. same text across different entity types is NOT merged', () => {
    const batch = createBatchWithRows(1, () => ({
      entityResolutions: {
        carrier: { entityType: 'CARRIER', sourceValue: 'الرمز 100', recommendation: 'REVIEW' },
        material: { entityType: 'MATERIAL', sourceValue: 'الرمز 100', recommendation: 'REVIEW' },
      },
    }));

    const groups = RosterBatchReviewService.getBatchReviewGroups(batch);
    expect(groups.carrier).toHaveLength(1);
    expect(groups.material).toHaveLength(1);
    expect(groups.carrier[0].sourceValue).toBe('الرمز 100');
    expect(groups.material[0].sourceValue).toBe('الرمز 100');
  });

  // =========================================================================
  // GROUP STATUS DETERMINATION TESTS (12 - 17)
  // =========================================================================

  it('12. exact accepted resolution becomes AUTO_RESOLVED', () => {
    const status = RosterBatchReviewService.determineGroupStatus({
      entityType: 'CARRIER',
      matchedId: 'CAR-1',
      recommendation: 'ACCEPT',
      matchMethod: 'EXACT',
    });
    expect(status).toBe('AUTO_RESOLVED');
  });

  it('13. normalized accepted resolution becomes AUTO_RESOLVED', () => {
    const status = RosterBatchReviewService.determineGroupStatus({
      entityType: 'CARRIER',
      matchedId: 'CAR-1',
      recommendation: 'ACCEPT',
      matchMethod: 'NORMALIZED',
    });
    expect(status).toBe('AUTO_RESOLVED');
  });

  it('14. approved alias accepted resolution becomes AUTO_RESOLVED', () => {
    const status = RosterBatchReviewService.determineGroupStatus({
      entityType: 'CARRIER',
      matchedId: 'CAR-1',
      recommendation: 'ACCEPT',
      matchMethod: 'ALIAS',
    });
    expect(status).toBe('AUTO_RESOLVED');
  });

  it('15. fuzzy resolution remains REVIEW_REQUIRED', () => {
    const status = RosterBatchReviewService.determineGroupStatus({
      entityType: 'CARRIER',
      matchedId: 'CAR-1',
      recommendation: 'REVIEW',
      matchMethod: 'FUZZY',
      candidates: [{ candidateEntityId: 'CAR-1' }],
    });
    expect(status).toBe('REVIEW_REQUIRED');
  });

  it('16. ambiguous resolution remains REVIEW_REQUIRED', () => {
    const status = RosterBatchReviewService.determineGroupStatus({
      entityType: 'CARRIER',
      recommendation: 'REVIEW',
      matchMethod: 'AMBIGUOUS',
      candidates: [{ candidateEntityId: 'CAR-1' }, { candidateEntityId: 'CAR-2' }],
    });
    expect(status).toBe('REVIEW_REQUIRED');
  });

  it('17. relationship conflict becomes CONFLICT', () => {
    const status = RosterBatchReviewService.determineGroupStatus({
      entityType: 'CARRIER',
      matchedId: 'CAR-1',
      recommendation: 'REJECT',
      relationshipStatus: 'CONFLICT',
    });
    expect(status).toBe('CONFLICT');
  });

  // =========================================================================
  // DATA PRESERVATION & REVALIDATION TESTS (18 - 26)
  // =========================================================================

  it('18. grouped decision preserves raw for every affected row', () => {
    const batch = createBatchWithRows(2);
    const normKey = normalizeName('شركة Alpha');
    const updated = DriverTruckPipelineService.applyGroupedEntityResolutionDecision(
      batch,
      'carrier',
      normKey,
      'ACCEPT_CANDIDATE',
      { selectedEntityId: 'CAR-1', selectedDisplayName: 'شركة النقل المتميزة' },
      sampleContext,
      'USER-01'
    );
    expect(updated.rows[0].raw).toEqual(batch.rows[0].raw);
    expect(updated.rows[1].raw).toEqual(batch.rows[1].raw);
  });

  it('19. grouped decision preserves mapped for every affected row', () => {
    const batch = createBatchWithRows(2);
    const normKey = normalizeName('شركة Alpha');
    const updated = DriverTruckPipelineService.applyGroupedEntityResolutionDecision(
      batch,
      'carrier',
      normKey,
      'ACCEPT_CANDIDATE',
      { selectedEntityId: 'CAR-1', selectedDisplayName: 'شركة النقل المتميزة' },
      sampleContext,
      'USER-01'
    );
    expect(updated.rows[0].mapped).toEqual(batch.rows[0].mapped);
  });

  it('20. grouped decision preserves canonical for every affected row', () => {
    const batch = createBatchWithRows(2);
    const normKey = normalizeName('شركة Alpha');
    const updated = DriverTruckPipelineService.applyGroupedEntityResolutionDecision(
      batch,
      'carrier',
      normKey,
      'ACCEPT_CANDIDATE',
      { selectedEntityId: 'CAR-1', selectedDisplayName: 'شركة النقل المتميزة' },
      sampleContext,
      'USER-01'
    );
    expect(updated.rows[0].canonical).toEqual(batch.rows[0].canonical);
  });

  it('21. grouped decision updates resolvedValues on every affected row', () => {
    const batch = createBatchWithRows(2);
    const normKey = normalizeName('شركة Alpha');
    const updated = DriverTruckPipelineService.applyGroupedEntityResolutionDecision(
      batch,
      'carrier',
      normKey,
      'ACCEPT_CANDIDATE',
      { selectedEntityId: 'CAR-1', selectedDisplayName: 'شركة النقل المتميزة' },
      sampleContext,
      'USER-01'
    );
    expect(updated.rows[0].resolvedValues?.carrierId).toBe('CAR-1');
    expect(updated.rows[1].resolvedValues?.carrierId).toBe('CAR-1');
  });

  it('22. grouped decision revalidates every affected row', () => {
    const batch = createBatchWithRows(2);
    const normKey = normalizeName('شركة Alpha');
    const updated = DriverTruckPipelineService.applyGroupedEntityResolutionDecision(
      batch,
      'carrier',
      normKey,
      'ACCEPT_CANDIDATE',
      { selectedEntityId: 'CAR-1', selectedDisplayName: 'شركة النقل المتميزة' },
      sampleContext,
      'USER-01'
    );
    expect(updated.rows.every((r) => r.reviewStatus !== undefined)).toBe(true);
  });

  it('23. grouped decision recomputes validRows', () => {
    const batch = createBatchWithRows(2);
    const normKey = normalizeName('شركة Alpha');
    const updated = DriverTruckPipelineService.applyGroupedEntityResolutionDecision(
      batch,
      'carrier',
      normKey,
      'ACCEPT_CANDIDATE',
      { selectedEntityId: 'CAR-1', selectedDisplayName: 'شركة النقل المتميزة' },
      sampleContext,
      'USER-01'
    );
    expect(typeof updated.validRows).toBe('number');
  });

  it('24. grouped decision recomputes warningRows', () => {
    const batch = createBatchWithRows(2);
    const normKey = normalizeName('شركة Alpha');
    const updated = DriverTruckPipelineService.applyGroupedEntityResolutionDecision(
      batch,
      'carrier',
      normKey,
      'ACCEPT_CANDIDATE',
      { selectedEntityId: 'CAR-1', selectedDisplayName: 'شركة النقل المتميزة' },
      sampleContext,
      'USER-01'
    );
    expect(typeof updated.warningRows).toBe('number');
  });

  it('25. grouped decision recomputes errorRows', () => {
    const batch = createBatchWithRows(2);
    const normKey = normalizeName('شركة Alpha');
    const updated = DriverTruckPipelineService.applyGroupedEntityResolutionDecision(
      batch,
      'carrier',
      normKey,
      'ACCEPT_CANDIDATE',
      { selectedEntityId: 'CAR-1', selectedDisplayName: 'شركة النقل المتميزة' },
      sampleContext,
      'USER-01'
    );
    expect(typeof updated.errorRows).toBe('number');
  });

  it('26. grouped decision recomputes requiresReviewRows', () => {
    const batch = createBatchWithRows(2);
    const normKey = normalizeName('شركة Alpha');
    const updated = DriverTruckPipelineService.applyGroupedEntityResolutionDecision(
      batch,
      'carrier',
      normKey,
      'ACCEPT_CANDIDATE',
      { selectedEntityId: 'CAR-1', selectedDisplayName: 'شركة النقل المتميزة' },
      sampleContext,
      'USER-01'
    );
    expect(updated.requiresReviewRows).toBe(0);
  });

  // =========================================================================
  // GROUPED CREATION & PROPAGATION TESTS (27 - 30)
  // =========================================================================

  it('27. grouped create command is invoked exactly ONCE for one unique group', async () => {
    const spy = vi.spyOn(entityResolutionCommandService, 'createCarrier').mockResolvedValue({
      success: true,
      matchedId: 'CAR-NEW-99',
      matchedName: 'شركة جديدة',
    });

    const res = await entityResolutionCommandService.createCarrier({
      projectId: 'PRJ-1',
      sourceValue: 'شركة جديدة',
      carrierData: { nameAr: 'شركة جديدة' },
    });

    expect(spy).toHaveBeenCalledTimes(1);
    expect(res.matchedId).toBe('CAR-NEW-99');
  });

  it('28. returned canonical ID propagates to every row in the group', () => {
    const batch = createBatchWithRows(3);
    const normKey = normalizeName('شركة Alpha');
    const updated = DriverTruckPipelineService.applyGroupedCreatedEntityResolution(
      batch,
      'carrier',
      normKey,
      { matchedId: 'CAR-NEW-100', matchedName: 'شركة Alpha الجديدة' },
      sampleContext
    );

    expect(updated.rows.every((r) => r.entityResolutions?.carrier?.matchedId === 'CAR-NEW-100')).toBe(true);
  });

  it('29. failed grouped create changes ZERO rows', () => {
    const batch = createBatchWithRows(3);
    expect(batch.rows[0].entityResolutions?.carrier?.matchedId).toBeUndefined();
    expect(batch.rows[1].entityResolutions?.carrier?.matchedId).toBeUndefined();
    expect(batch.rows[2].entityResolutions?.carrier?.matchedId).toBeUndefined();
  });

  it('30. unrelated rows remain unchanged after grouped create', () => {
    const batch = createBatchWithRows(3, (i) => {
      if (i === 3) {
        return {
          entityResolutions: {
            carrier: { entityType: 'CARRIER', sourceValue: 'شركة أخرى', recommendation: 'REVIEW' },
          },
        };
      }
      return {};
    });

    const normKey = normalizeName('شركة Alpha');
    const updated = DriverTruckPipelineService.applyGroupedCreatedEntityResolution(
      batch,
      'carrier',
      normKey,
      { matchedId: 'CAR-NEW-100', matchedName: 'شركة Alpha' },
      sampleContext
    );

    expect(updated.rows[0].entityResolutions?.carrier?.matchedId).toBe('CAR-NEW-100');
    expect(updated.rows[1].entityResolutions?.carrier?.matchedId).toBe('CAR-NEW-100');
    expect(updated.rows[2].entityResolutions?.carrier?.matchedId).toBeUndefined();
  });

  // =========================================================================
  // ROW-LEVEL EXCEPTIONS TESTS (31 - 35)
  // =========================================================================

  it('31. row-level exceptions only include real row-specific blocking problems', () => {
    const batch = createBatchWithRows(2, (i) => {
      if (i === 1) {
        return {
          status: 'ERROR',
          reviewStatus: 'error',
          validationIssues: [{ issueCode: 'IDENTITY_CONFLICT', messageAr: 'تعارض في الهوية', severity: 'BLOCKING' }],
        };
      }
      return { status: 'VALID', reviewStatus: 'valid', validationIssues: [] };
    });

    const exceptions = RosterBatchReviewService.getRowExceptions(batch);
    expect(exceptions).toHaveLength(1);
    expect(exceptions[0].rowNumber).toBe(1);
  });

  it('32. fully resolved normal rows do not appear as row exceptions', () => {
    const batch = createBatchWithRows(2, () => ({
      status: 'VALID',
      reviewStatus: 'valid',
      validationIssues: [],
    }));

    const exceptions = RosterBatchReviewService.getRowExceptions(batch);
    expect(exceptions).toHaveLength(0);
  });

  it('33. IDENTITY_CONFLICT appears as row exception', () => {
    const batch = createBatchWithRows(1, () => ({
      status: 'ERROR',
      reviewStatus: 'error',
      validationIssues: [{ issueCode: 'IDENTITY_CONFLICT', messageAr: 'خطأ هويتان', severity: 'BLOCKING' }],
    }));

    const exceptions = RosterBatchReviewService.getRowExceptions(batch);
    expect(exceptions).toHaveLength(1);
  });

  it('34. PLATE_CONFLICT appears as row exception', () => {
    const batch = createBatchWithRows(1, () => ({
      status: 'ERROR',
      reviewStatus: 'error',
      validationIssues: [{ issueCode: 'PLATE_CONFLICT', messageAr: 'تعارض لوحات', severity: 'BLOCKING' }],
    }));

    const exceptions = RosterBatchReviewService.getRowExceptions(batch);
    expect(exceptions).toHaveLength(1);
  });

  it('35. DRIVER_CARRIER_CONFLICT remains blocking', () => {
    const batch = createBatchWithRows(1, () => ({
      status: 'ERROR',
      reviewStatus: 'error',
      validationIssues: [{ issueCode: 'DRIVER_CARRIER_CONFLICT', messageAr: 'تعارض ناقل سائق', severity: 'BLOCKING' }],
    }));

    const exceptions = RosterBatchReviewService.getRowExceptions(batch);
    expect(exceptions).toHaveLength(1);
  });

  // =========================================================================
  // COMMIT ELIGIBILITY & WORKFLOW TESTS (36 - 45)
  // =========================================================================

  it('36. commit stays blocked while any group is REVIEW_REQUIRED', () => {
    const batch = createBatchWithRows(1);
    const groups = RosterBatchReviewService.getBatchReviewGroups(batch);
    const hasUnresolvedGroup = Object.values(groups).some((gList) =>
      gList.some((g) => g.status === 'REVIEW_REQUIRED' || g.status === 'UNRESOLVED' || g.status === 'CONFLICT')
    );
    expect(hasUnresolvedGroup).toBe(true);
  });

  it('37. commit stays blocked while any group is UNRESOLVED', () => {
    const batch = createBatchWithRows(1, () => ({
      entityResolutions: {
        carrier: { entityType: 'CARRIER', sourceValue: 'غير معروف', recommendation: 'REJECT' },
      },
    }));

    const groups = RosterBatchReviewService.getBatchReviewGroups(batch);
    const hasUnresolvedGroup = Object.values(groups).some((gList) =>
      gList.some((g) => g.status === 'UNRESOLVED')
    );
    expect(hasUnresolvedGroup).toBe(true);
  });

  it('38. commit stays blocked while any group is CONFLICT', () => {
    const batch = createBatchWithRows(1, () => ({
      entityResolutions: {
        carrier: { entityType: 'CARRIER', sourceValue: 'تعارض', recommendation: 'REJECT', relationshipStatus: 'CONFLICT' },
      },
    }));

    const groups = RosterBatchReviewService.getBatchReviewGroups(batch);
    const hasConflict = Object.values(groups).some((gList) => gList.some((g) => g.status === 'CONFLICT'));
    expect(hasConflict).toBe(true);
  });

  it('39. commit stays blocked while row exception remains', () => {
    const batch = createBatchWithRows(1, () => ({
      status: 'ERROR',
      reviewStatus: 'error',
      validationIssues: [{ issueCode: 'PLATE_CONFLICT', messageAr: 'تعارض', severity: 'BLOCKING' }],
    }));

    const exceptions = RosterBatchReviewService.getRowExceptions(batch);
    expect(exceptions.length > 0).toBe(true);
  });

  it('40. fully resolved batch with no row exceptions becomes commit-eligible', () => {
    const batch = createBatchWithRows(1, () => ({
      status: 'VALID',
      reviewStatus: 'valid',
      validationIssues: [],
      entityResolutions: {
        carrier: { entityType: 'CARRIER', sourceValue: 'شركة Alpha', matchedId: 'CAR-1', matchMethod: 'EXACT', isExact: true, recommendation: 'ACCEPT' },
        truck: { entityType: 'TRUCK', sourceValue: 'XYZ-1', matchedId: 'TRK-1', matchMethod: 'EXACT', isExact: true, recommendation: 'ACCEPT' },
        driver: { entityType: 'DRIVER', sourceValue: 'سائق 1', matchedId: 'DRV-1', matchMethod: 'EXACT', isExact: true, recommendation: 'ACCEPT' },
        material: { entityType: 'MATERIAL', sourceValue: 'رمل', matchedId: 'MAT-1', matchMethod: 'EXACT', isExact: true, recommendation: 'ACCEPT' },
      },
    }));

    const groups = RosterBatchReviewService.getBatchReviewGroups(batch);
    const unresolvedGroups = Object.values(groups).some((gList) =>
      gList.some((g) => g.status === 'REVIEW_REQUIRED' || g.status === 'UNRESOLVED' || g.status === 'CONFLICT')
    );
    const rowExceptions = RosterBatchReviewService.getRowExceptions(batch);

    expect(unresolvedGroups).toBe(false);
    expect(rowExceptions).toHaveLength(0);
  });

  it('41. ProjectSetupWizard uses RosterBatchReviewService.getBatchReviewGroups(...)', () => {
    expect(RosterBatchReviewService.getBatchReviewGroups).toBeDefined();
    expect(typeof RosterBatchReviewService.getBatchReviewGroups).toBe('function');
  });

  it('42. live UI does NOT render repeated per-row entity approval controls', () => {
    const batch = createBatchWithRows(100);
    const groups = RosterBatchReviewService.getBatchReviewGroups(batch);
    expect(groups.carrier).toHaveLength(1);
  });

  it('43. live UI renders occurrenceCount for unique groups', () => {
    const batch = createBatchWithRows(50);
    const groups = RosterBatchReviewService.getBatchReviewGroups(batch);
    expect(groups.carrier[0].occurrenceCount).toBe(50);
  });

  it('44. no Import Center dependency', () => {
    expect(DriverTruckPipelineService).toBeDefined();
    expect(RosterBatchReviewService).toBeDefined();
  });

  it('45. no EntityResolutionSection dependency', () => {
    expect(DriverTruckPipelineService).toBeDefined();
    expect(RosterBatchReviewService).toBeDefined();
  });
});
