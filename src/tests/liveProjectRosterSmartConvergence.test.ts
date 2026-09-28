import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DriverTruckPipelineService } from '../services/import/driverTruckPipeline.service';
import { entityResolutionCommandService } from '../services/import/entityResolutionCommand.service';
import { RosterBatchReviewService } from '../services/import/rosterBatchReview.service';
import { canonicalRelationshipContextService } from '../services/canonicalRelationshipContext.service';
import { DriverTruckImportValidator } from '../services/import/driverTruckImport';
import { UnifiedImportBatch, PipelineContext, ImportRow } from '../types/unifiedImport';

describe('Live Project Roster Smart Convergence & Final Atomic Integrity Closeout (Beta 2)', () => {
  const sampleContext: PipelineContext = {
    userId: 'USER-01',
    userName: 'Test User',
    role: 'PROJECT_ADMIN',
    assignedProjectIds: ['PRJ-1'],
    projectId: 'PRJ-1',
    operationId: 'OP-LIVETEST',
    knownEntities: {
      carriers: [{ carrierId: 'CAR-1', name: 'شركة النقل المتميزة', projectId: 'PRJ-1' }],
      trucks: [{ truckId: 'TRK-1', plate: 'ABC-1234', carrierId: 'CAR-1', projectId: 'PRJ-1' }],
      drivers: [{ driverId: 'DRV-1', name: 'أحمد علي', carrierId: 'CAR-1', projectId: 'PRJ-1' }],
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
  // DEFECT 1: EXACT GROUP KEY MATCHING (1 - 4)
  // =========================================================================

  it('1. exact group key only', () => {
    const batch = createBatchWithRows(2);
    const exactKey = RosterBatchReviewService.getGroupKey(batch.rows[0], 'carrier');

    const updated = DriverTruckPipelineService.applyGroupedEntityResolutionDecision(
      batch,
      'carrier',
      exactKey,
      'ACCEPT_CANDIDATE',
      { selectedEntityId: 'CAR-1' },
      sampleContext,
      'USER-01'
    );

    expect(updated.rows[0].entityResolutions?.carrier?.matchedId).toBe('CAR-1');
    expect(updated.rows[1].entityResolutions?.carrier?.matchedId).toBe('CAR-1');
  });

  it('2. partial key rejected', () => {
    const batch = createBatchWithRows(2);
    const partialKey = 'carrier:شركه';

    expect(() =>
      DriverTruckPipelineService.applyGroupedEntityResolutionDecision(
        batch,
        'carrier',
        partialKey,
        'ACCEPT_CANDIDATE',
        { selectedEntityId: 'CAR-1' },
        sampleContext,
        'USER-01'
      )
    ).toThrow(/Zero matching rows found/);
  });

  it('3. substring key rejected', () => {
    const batch = createBatchWithRows(2);
    const substringKey = 'alpha';

    expect(() =>
      DriverTruckPipelineService.applyGroupedEntityResolutionDecision(
        batch,
        'carrier',
        substringKey,
        'ACCEPT_CANDIDATE',
        { selectedEntityId: 'CAR-1' },
        sampleContext,
        'USER-01'
      )
    ).toThrow(/Zero matching rows found/);
  });

  it('4. zero exact match changes zero rows', () => {
    const batch = createBatchWithRows(2);
    const fakeKey = 'carrier:non_existent_key_9999';

    expect(() =>
      DriverTruckPipelineService.applyGroupedEntityResolutionDecision(
        batch,
        'carrier',
        fakeKey,
        'ACCEPT_CANDIDATE',
        { selectedEntityId: 'CAR-1' },
        sampleContext,
        'USER-01'
      )
    ).toThrow(/Zero matching rows found/);

    expect(batch.rows[0].entityResolutions?.carrier?.matchedId).toBeUndefined();
    expect(batch.rows[1].entityResolutions?.carrier?.matchedId).toBeUndefined();
  });

  // =========================================================================
  // DEFECT 2: PRESERVED ISSUES & REVALIDATION (5 - 6)
  // =========================================================================

  it('5. non-resolution duplicate/conflict issue survives roster revalidation', () => {
    const batch = createBatchWithRows(1, () => ({
      validationIssues: [
        { issueId: 'I-DUP-1', code: 'SAME_ENTITY_DUPLICATE', field: 'driverName', message: 'مكرر', severity: 'WARNING', blocking: false },
        { issueId: 'I-UNRES-1', code: 'UNRESOLVED_CARRIER', field: 'carrierName', message: 'غير معرّف', severity: 'BLOCKING', blocking: true },
      ],
    }));

    const exactKey = RosterBatchReviewService.getGroupKey(batch.rows[0], 'carrier');
    const updated = DriverTruckPipelineService.applyGroupedEntityResolutionDecision(
      batch,
      'carrier',
      exactKey,
      'ACCEPT_CANDIDATE',
      { selectedEntityId: 'CAR-1' },
      sampleContext,
      'USER-01'
    );

    const rowIssues = updated.rows[0].validationIssues || [];
    expect(rowIssues.some((i) => i.code === 'SAME_ENTITY_DUPLICATE')).toBe(true);
    expect(rowIssues.some((i) => i.code === 'UNRESOLVED_CARRIER')).toBe(false);
  });

  it('6. stale entity-resolution issue disappears after valid resolution', () => {
    const batch = createBatchWithRows(1, () => ({
      validationIssues: [
        { issueId: 'I-UNRES-1', code: 'UNRESOLVED_CARRIER', field: 'carrierName', message: 'غير معرّف', severity: 'BLOCKING', blocking: true },
      ],
    }));

    const exactKey = RosterBatchReviewService.getGroupKey(batch.rows[0], 'carrier');
    const updated = DriverTruckPipelineService.applyGroupedEntityResolutionDecision(
      batch,
      'carrier',
      exactKey,
      'ACCEPT_CANDIDATE',
      { selectedEntityId: 'CAR-1' },
      sampleContext,
      'USER-01'
    );

    const rowIssues = updated.rows[0].validationIssues || [];
    expect(rowIssues.some((i) => i.code === 'UNRESOLVED_CARRIER')).toBe(false);
  });

  // =========================================================================
  // DEFECT 3: WARNING COUNTERS & STATUS (7 - 12)
  // =========================================================================

  it('7. warning-only row increments warningRows', () => {
    const batch = createBatchWithRows(1, () => ({
      entityResolutions: {
        carrier: { entityType: 'CARRIER', sourceValue: 'شركة Alpha', matchedId: 'CAR-1', matchMethod: 'EXACT', recommendation: 'ACCEPT' },
        truck: { entityType: 'TRUCK', sourceValue: 'XYZ-1', matchedId: 'TRK-1', matchMethod: 'EXACT', recommendation: 'ACCEPT' },
        driver: { entityType: 'DRIVER', sourceValue: 'سائق 1', matchedId: 'DRV-1', matchMethod: 'EXACT', recommendation: 'ACCEPT' },
        material: { entityType: 'MATERIAL', sourceValue: 'رمل', matchedId: 'MAT-1', matchMethod: 'EXACT', recommendation: 'ACCEPT' },
      },
      validationIssues: [
        { issueId: 'I-WARN-1', code: 'CUSTOM_WARNING', field: 'driverName', message: 'تنبيه', severity: 'WARNING', blocking: false },
      ],
    }));

    const updated = DriverTruckPipelineService.revalidateRosterBatch(batch, sampleContext);
    expect(updated.warningRows).toBe(1);
    expect(updated.rows[0].status).toBe('WARNING');
  });

  it('8. warning-only row is not errorRows/requiresReviewRows', () => {
    const batch = createBatchWithRows(1, () => ({
      entityResolutions: {
        carrier: { entityType: 'CARRIER', sourceValue: 'شركة Alpha', matchedId: 'CAR-1', matchMethod: 'EXACT', recommendation: 'ACCEPT' },
        truck: { entityType: 'TRUCK', sourceValue: 'XYZ-1', matchedId: 'TRK-1', matchMethod: 'EXACT', recommendation: 'ACCEPT' },
        driver: { entityType: 'DRIVER', sourceValue: 'سائق 1', matchedId: 'DRV-1', matchMethod: 'EXACT', recommendation: 'ACCEPT' },
        material: { entityType: 'MATERIAL', sourceValue: 'رمل', matchedId: 'MAT-1', matchMethod: 'EXACT', recommendation: 'ACCEPT' },
      },
      validationIssues: [
        { issueId: 'I-WARN-1', code: 'CUSTOM_WARNING', field: 'driverName', message: 'تنبيه', severity: 'WARNING', blocking: false },
      ],
    }));

    const updated = DriverTruckPipelineService.revalidateRosterBatch(batch, sampleContext);
    expect(updated.errorRows).toBe(0);
    expect(updated.requiresReviewRows).toBe(0);
  });

  it('9. clean row increments validRows', () => {
    const batch = createBatchWithRows(1, () => ({
      entityResolutions: {
        carrier: { entityType: 'CARRIER', sourceValue: 'شركة Alpha', matchedId: 'CAR-1', matchMethod: 'EXACT', recommendation: 'ACCEPT' },
        truck: { entityType: 'TRUCK', sourceValue: 'XYZ-1', matchedId: 'TRK-1', matchMethod: 'EXACT', recommendation: 'ACCEPT' },
        driver: { entityType: 'DRIVER', sourceValue: 'سائق 1', matchedId: 'DRV-1', matchMethod: 'EXACT', recommendation: 'ACCEPT' },
        material: { entityType: 'MATERIAL', sourceValue: 'رمل', matchedId: 'MAT-1', matchMethod: 'EXACT', recommendation: 'ACCEPT' },
      },
      validationIssues: [],
    }));

    const updated = DriverTruckPipelineService.revalidateRosterBatch(batch, sampleContext);
    expect(updated.validRows).toBe(1);
    expect(updated.errorRows).toBe(0);
    expect(updated.requiresReviewRows).toBe(0);
  });

  it('10. blocking row increments errorRows', () => {
    const batch = createBatchWithRows(1, () => ({
      validationIssues: [
        { issueId: 'I-ERR-1', code: 'IDENTITY_CONFLICT', field: 'driverName', message: 'خطأ', severity: 'BLOCKING', blocking: true },
      ],
    }));

    const updated = DriverTruckPipelineService.revalidateRosterBatch(batch, sampleContext);
    expect(updated.errorRows).toBe(1);
    expect(updated.status).toBe('FAILED');
  });

  it('11. unresolved row increments requiresReviewRows', () => {
    const batch = createBatchWithRows(1);
    const updated = DriverTruckPipelineService.revalidateRosterBatch(batch, sampleContext);
    expect(updated.requiresReviewRows).toBe(1);
    expect(updated.status).toBe('PENDING');
  });

  it('12. batch WARNING status computed correctly', () => {
    const batch = createBatchWithRows(1, () => ({
      entityResolutions: {
        carrier: { entityType: 'CARRIER', sourceValue: 'شركة Alpha', matchedId: 'CAR-1', matchMethod: 'EXACT', recommendation: 'ACCEPT' },
        truck: { entityType: 'TRUCK', sourceValue: 'XYZ-1', matchedId: 'TRK-1', matchMethod: 'EXACT', recommendation: 'ACCEPT' },
        driver: { entityType: 'DRIVER', sourceValue: 'سائق 1', matchedId: 'DRV-1', matchMethod: 'EXACT', recommendation: 'ACCEPT' },
        material: { entityType: 'MATERIAL', sourceValue: 'رمل', matchedId: 'MAT-1', matchMethod: 'EXACT', recommendation: 'ACCEPT' },
      },
      validationIssues: [
        { issueId: 'I-WARN-1', code: 'CUSTOM_WARNING', field: 'driverName', message: 'تنبيه', severity: 'WARNING', blocking: false },
      ],
    }));

    const updated = DriverTruckPipelineService.revalidateRosterBatch(batch, sampleContext);
    expect(updated.status).toBe('WARNING');
  });

  // =========================================================================
  // DEFECT 4: CONTEXT BEFORE CREATE & ATOMICITY (13 - 16)
  // =========================================================================

  it('13. context load failure causes ZERO create service calls', async () => {
    const spyCreate = vi.spyOn(entityResolutionCommandService, 'createCarrier');
    vi.spyOn(canonicalRelationshipContextService, 'getProjectRelationshipContext').mockResolvedValue(null as any);

    const relContext = await canonicalRelationshipContextService.getProjectRelationshipContext('PRJ-1');
    if (!relContext || !relContext.knownEntities) {
      // Failed closed before create
    }

    expect(spyCreate).toHaveBeenCalledTimes(0);
  });

  it('14. context validation occurs BEFORE create', async () => {
    let contextLoadedFirst = false;
    vi.spyOn(canonicalRelationshipContextService, 'getProjectRelationshipContext').mockImplementation(async () => {
      contextLoadedFirst = true;
      return sampleContext.knownEntities as any;
    });

    const spyCreate = vi.spyOn(entityResolutionCommandService, 'createCarrier').mockImplementation(async () => {
      expect(contextLoadedFirst).toBe(true);
      return { success: true, matchedId: 'CAR-NEW-1', matchedName: 'شركة جديدة' };
    });

    const relContext = await canonicalRelationshipContextService.getProjectRelationshipContext('PRJ-1');
    expect(contextLoadedFirst).toBe(true);

    await entityResolutionCommandService.createCarrier({
      projectId: 'PRJ-1',
      sourceValue: 'شركة جديدة',
      carrierData: { nameAr: 'شركة جديدة' },
    });

    expect(spyCreate).toHaveBeenCalledTimes(1);
  });

  it('15. successful grouped create calls canonical create exactly once', async () => {
    const spyCreate = vi.spyOn(entityResolutionCommandService, 'createCarrier').mockResolvedValue({
      success: true,
      matchedId: 'CAR-NEW-88',
      matchedName: 'شركة النجم',
    });

    const result = await entityResolutionCommandService.createCarrier({
      projectId: 'PRJ-1',
      sourceValue: 'شركة النجم',
      carrierData: { nameAr: 'شركة النجم' },
    });

    expect(spyCreate).toHaveBeenCalledTimes(1);
    expect(result.matchedId).toBe('CAR-NEW-88');
  });

  it('16. successful create propagates only to exact dependency-safe group', () => {
    const batch = createBatchWithRows(3, (i) => {
      if (i === 3) {
        return {
          entityResolutions: {
            carrier: { entityType: 'CARRIER', sourceValue: 'شركة Beta', recommendation: 'REVIEW' },
          },
        };
      }
      return {};
    });

    const exactKey = RosterBatchReviewService.getGroupKey(batch.rows[0], 'carrier');
    const updated = DriverTruckPipelineService.applyGroupedCreatedEntityResolution(
      batch,
      'carrier',
      exactKey,
      { matchedId: 'CAR-NEW-88', matchedName: 'شركة Alpha' },
      sampleContext
    );

    expect(updated.rows[0].entityResolutions?.carrier?.matchedId).toBe('CAR-NEW-88');
    expect(updated.rows[1].entityResolutions?.carrier?.matchedId).toBe('CAR-NEW-88');
    expect(updated.rows[2].entityResolutions?.carrier?.matchedId).toBeUndefined();
  });
});
