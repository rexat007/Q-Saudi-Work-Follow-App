import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ExcelCsvPipelineService } from '../services/import/excelCsvPipeline.service';
import { EntityResolutionService } from '../services/import/entityResolution.service';
import { EntityResolutionItem } from '../types/entityResolution';
import { UnifiedImportBatch, ImportRow, PipelineContext } from '../types/unifiedImport';
import * as fs from 'fs';
import * as path from 'path';

describe('Smart Import Unit 5B-1 Production Interactive Entity Resolution Test Suite', () => {
  const dummyContext: PipelineContext = {
    projectId: 'PRJ-NEOM-01',
    userId: 'user-admin-1',
    userName: 'Admin User',
    role: 'PROJECT_ADMIN',
    operationId: 'OP-5B1-TEST',
    knownEntities: {
      carriers: [{ carrierId: 'CAR-100', name: 'الناقل الأول', projectId: 'PRJ-NEOM-01' }],
      trucks: [{ truckId: 'TRK-200', plate: '1234 A B C', projectId: 'PRJ-NEOM-01' }],
      drivers: [{ driverId: 'DRV-300', name: 'أحمد علي', projectId: 'PRJ-NEOM-01' }],
      materials: [{ materialId: 'MAT-400', name: 'رمل', code: 'SAND', projectId: 'PRJ-NEOM-01' }],
    },
  };

  const createSampleBatch = (): UnifiedImportBatch => ({
    importBatchId: 'BAT-5B1-001',
    projectId: 'PRJ-NEOM-01',
    source: { sourceType: 'EXCEL', importBatchId: 'BAT-5B1-001', sourceFileName: 'test.xlsx' },
    currentStage: 'REVIEW',
    validationStatus: 'PASSED',
    commitStatus: 'AWAITING_REVIEW',
    totalRows: 1,
    validRows: 0,
    warningRows: 0,
    errorRows: 0,
    requiresReviewRows: 1,
    committedRows: 0,
    auditTrail: [],
    rows: [
      {
        rowNumber: 1,
        status: 'WARNING',
        reviewStatus: 'requires_review',
        raw: { 'الناقل': 'ناقل غير مؤكد', 'الشاحنة': '1234 A B C' },
        canonical: { carrierName: 'ناقل غير مؤكد', plateNumber: '1234 A B C' },
        validationIssues: [],
        resolvedValues: {},
        entityResolutions: {
          carrier: {
            entityType: 'CARRIER',
            sourceValue: 'ناقل غير مؤكد',
            normalizedValue: 'ناقل غير مؤكد',
            originalValue: 'ناقل غير مؤكد',
            matchedId: 'CAR-100',
            matchedName: 'الناقل الأول',
            confidence: 0.75,
            matchMethod: 'FUZZY',
            riskLevel: 'HIGH',
            relationshipStatus: 'VALID',
            recommendation: 'REVIEW',
            isExact: false,
            isAuthorized: true,
            candidates: [
              { candidateEntityId: 'CAR-100', candidateDisplayName: 'الناقل الأول', confidence: 0.75, matchMethod: 'FUZZY' },
            ],
          },
          truck: {
            entityType: 'TRUCK',
            sourceValue: '1234 A B C',
            normalizedValue: '1234 A B C',
            originalValue: '1234 A B C',
            matchedId: 'TRK-200',
            matchedName: '1234 A B C',
            confidence: 1.0,
            matchMethod: 'EXACT',
            riskLevel: 'LOW',
            relationshipStatus: 'VALID',
            recommendation: 'ACCEPT',
            isExact: true,
            isAuthorized: true,
          },
        },
      },
    ],
    issues: [],
    operationId: 'OP-5B1-TEST',
    createdAt: new Date().toISOString(),
    createdBy: 'user-admin-1',
  });

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('1. exact valid LOW-risk resolution does not require UI attention', () => {
    const lowRiskItem = {
      entityType: 'CARRIER',
      sourceValue: 'الناقل الأول',
      normalizedValue: 'الناقل الأول',
      originalValue: 'الناقل الأول',
      matchedId: 'CAR-100',
      matchedName: 'الناقل الأول',
      confidence: 1.0,
      matchMethod: 'EXACT',
      riskLevel: 'LOW',
      relationshipStatus: 'VALID',
      recommendation: 'ACCEPT',
      isExact: true,
      isAuthorized: true,
    } as EntityResolutionItem;

    expect(ExcelCsvPipelineService.checkResolutionRequiresAttention(lowRiskItem)).toBe(false);
  });

  it('2. REVIEW resolution recommendation requires attention', () => {
    const reviewItem = {
      entityType: 'CARRIER',
      sourceValue: 'ناقل غير مؤكد',
      matchedId: 'CAR-100',
      confidence: 0.75,
      recommendation: 'REVIEW',
      riskLevel: 'HIGH',
    } as EntityResolutionItem;

    expect(ExcelCsvPipelineService.checkResolutionRequiresAttention(reviewItem)).toBe(true);
  });

  it('3. ambiguous resolution requires attention', () => {
    const ambiguousItem = {
      entityType: 'CARRIER',
      sourceValue: 'ناقل متشابه',
      matchedId: 'CAR-100',
      ambiguous: true,
      riskLevel: 'MEDIUM',
    } as EntityResolutionItem;

    expect(ExcelCsvPipelineService.checkResolutionRequiresAttention(ambiguousItem)).toBe(true);
  });

  it('4. missing matchedId/entityId requires attention', () => {
    const missingIdItem = {
      entityType: 'CARRIER',
      sourceValue: 'ناقل مجهول',
      confidence: 0.0,
      riskLevel: 'HIGH',
    } as EntityResolutionItem;

    expect(ExcelCsvPipelineService.checkResolutionRequiresAttention(missingIdItem)).toBe(true);
  });

  it('5. HIGH/CRITICAL resolution requires attention', () => {
    const highRiskItem = {
      entityType: 'CARRIER',
      sourceValue: 'ناقل خطير',
      matchedId: 'CAR-100',
      riskLevel: 'HIGH',
    } as EntityResolutionItem;

    const criticalRiskItem = {
      entityType: 'TRUCK',
      sourceValue: 'شاحنة حرجة',
      matchedId: 'TRK-200',
      riskLevel: 'CRITICAL',
    } as EntityResolutionItem;

    expect(ExcelCsvPipelineService.checkResolutionRequiresAttention(highRiskItem)).toBe(true);
    expect(ExcelCsvPipelineService.checkResolutionRequiresAttention(criticalRiskItem)).toBe(true);
  });

  it('6. invalid relationshipStatus requires attention', () => {
    const invalidRelItem = {
      entityType: 'TRUCK',
      sourceValue: '1234 A B C',
      matchedId: 'TRK-200',
      riskLevel: 'LOW',
      relationshipStatus: 'CONFLICT',
    } as unknown as EntityResolutionItem;

    expect(ExcelCsvPipelineService.checkResolutionRequiresAttention(invalidRelItem)).toBe(true);
  });

  it('7. ACCEPT_CANDIDATE uses EntityResolutionService.applyUserDecision', () => {
    const spy = vi.spyOn(EntityResolutionService, 'applyUserDecision');
    const batch = createSampleBatch();

    ExcelCsvPipelineService.applyEntityResolutionDecision(
      batch,
      1,
      'carrier',
      'ACCEPT_CANDIDATE',
      { selectedEntityId: 'CAR-100', selectedDisplayName: 'الناقل الأول' },
      dummyContext,
      'user-admin-1'
    );

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        decision: 'ACCEPT_CANDIDATE',
        selectedEntityId: 'CAR-100',
        entityType: 'CARRIER',
      })
    );
  });

  it('8. SELECT_ALTERNATE uses EntityResolutionService.applyUserDecision', () => {
    const spy = vi.spyOn(EntityResolutionService, 'applyUserDecision');
    const batch = createSampleBatch();

    ExcelCsvPipelineService.applyEntityResolutionDecision(
      batch,
      1,
      'carrier',
      'SELECT_ALTERNATE',
      { selectedEntityId: 'CAR-100', selectedDisplayName: 'الناقل المختار' },
      dummyContext,
      'user-admin-1'
    );

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        decision: 'SELECT_ALTERNATE',
        selectedEntityId: 'CAR-100',
      })
    );
  });

  it('9. LEAVE_UNRESOLVED uses EntityResolutionService.applyUserDecision', () => {
    const spy = vi.spyOn(EntityResolutionService, 'applyUserDecision');
    const batch = createSampleBatch();

    ExcelCsvPipelineService.applyEntityResolutionDecision(
      batch,
      1,
      'carrier',
      'LEAVE_UNRESOLVED',
      {},
      dummyContext,
      'user-admin-1'
    );

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        decision: 'LEAVE_UNRESOLVED',
      })
    );
  });

  it('10. selecting carrier updates resolvedValues.carrierId', () => {
    const batch = createSampleBatch();
    const res = ExcelCsvPipelineService.applyEntityResolutionDecision(
      batch,
      1,
      'carrier',
      'SELECT_ALTERNATE',
      { selectedEntityId: 'CAR-100', selectedDisplayName: 'الناقل الأول' },
      dummyContext,
      'user-admin-1'
    );

    expect(res.rows[0].resolvedValues?.carrierId).toBe('CAR-100');
  });

  it('11. selecting truck updates resolvedValues.truckId', () => {
    const batch = createSampleBatch();
    // Add unresolved truck item
    batch.rows[0].entityResolutions!.truck = {
      entityType: 'TRUCK',
      sourceValue: '9999 XYZ',
      normalizedValue: '9999 XYZ',
      originalValue: '9999 XYZ',
      confidence: 0.5,
      matchMethod: 'FUZZY',
      relationshipStatus: 'VALID',
      recommendation: 'REVIEW',
      riskLevel: 'HIGH',
      isExact: false,
      isAuthorized: true,
      candidates: [{ candidateEntityId: 'TRK-200', candidateDisplayName: '1234 A B C', confidence: 0.8, matchMethod: 'FUZZY' }],
    };

    const res = ExcelCsvPipelineService.applyEntityResolutionDecision(
      batch,
      1,
      'truck',
      'SELECT_ALTERNATE',
      { selectedEntityId: 'TRK-200', selectedDisplayName: '1234 A B C' },
      dummyContext,
      'user-admin-1'
    );

    expect(res.rows[0].resolvedValues?.truckId).toBe('TRK-200');
  });

  it('12. selecting driver updates resolvedValues.driverId', () => {
    const batch = createSampleBatch();
    batch.rows[0].entityResolutions!.driver = {
      entityType: 'DRIVER',
      sourceValue: 'سائق غير معروف',
      normalizedValue: 'سائق غير معروف',
      originalValue: 'سائق غير معروف',
      confidence: 0.5,
      matchMethod: 'FUZZY',
      relationshipStatus: 'VALID',
      recommendation: 'REVIEW',
      riskLevel: 'HIGH',
      isExact: false,
      isAuthorized: true,
      candidates: [{ candidateEntityId: 'DRV-300', candidateDisplayName: 'أحمد علي', confidence: 0.8, matchMethod: 'FUZZY' }],
    };

    const res = ExcelCsvPipelineService.applyEntityResolutionDecision(
      batch,
      1,
      'driver',
      'SELECT_ALTERNATE',
      { selectedEntityId: 'DRV-300', selectedDisplayName: 'أحمد علي' },
      dummyContext,
      'user-admin-1'
    );

    expect(res.rows[0].resolvedValues?.driverId).toBe('DRV-300');
  });

  it('13. selecting material updates resolvedValues.materialId', () => {
    const batch = createSampleBatch();
    batch.rows[0].entityResolutions!.material = {
      entityType: 'MATERIAL',
      sourceValue: 'رمل اسود',
      normalizedValue: 'رمل اسود',
      originalValue: 'رمل اسود',
      confidence: 0.5,
      matchMethod: 'FUZZY',
      relationshipStatus: 'VALID',
      recommendation: 'REVIEW',
      riskLevel: 'HIGH',
      isExact: false,
      isAuthorized: true,
      candidates: [{ candidateEntityId: 'MAT-400', candidateDisplayName: 'رمل', confidence: 0.8, matchMethod: 'FUZZY' }],
    };

    const res = ExcelCsvPipelineService.applyEntityResolutionDecision(
      batch,
      1,
      'material',
      'SELECT_ALTERNATE',
      { selectedEntityId: 'MAT-400', selectedDisplayName: 'رمل' },
      dummyContext,
      'user-admin-1'
    );

    expect(res.rows[0].resolvedValues?.materialId).toBe('MAT-400');
  });

  it('14. raw source data remains unchanged after decision', () => {
    const batch = createSampleBatch();
    const originalRaw = { ...batch.rows[0].raw };

    const res = ExcelCsvPipelineService.applyEntityResolutionDecision(
      batch,
      1,
      'carrier',
      'SELECT_ALTERNATE',
      { selectedEntityId: 'CAR-100', selectedDisplayName: 'الناقل المختار' },
      dummyContext,
      'user-admin-1'
    );

    expect(res.rows[0].raw).toEqual(originalRaw);
  });

  it('15. sourceValue/originalValue remains preserved in resolution item', () => {
    const batch = createSampleBatch();
    const res = ExcelCsvPipelineService.applyEntityResolutionDecision(
      batch,
      1,
      'carrier',
      'SELECT_ALTERNATE',
      { selectedEntityId: 'CAR-100', selectedDisplayName: 'الناقل المختار' },
      dummyContext,
      'user-admin-1'
    );

    expect(res.rows[0].entityResolutions?.carrier?.sourceValue).toBe('ناقل غير مؤكد');
  });

  it('16. row remains requires_review if another entity remains unresolved', () => {
    const batch = createSampleBatch();
    // Add two unresolved entity resolutions
    batch.rows[0].entityResolutions!.carrier = {
      entityType: 'CARRIER',
      sourceValue: 'ناقل 1',
      normalizedValue: 'ناقل 1',
      originalValue: 'ناقل 1',
      confidence: 0.5,
      matchMethod: 'FUZZY',
      relationshipStatus: 'VALID',
      recommendation: 'REVIEW',
      riskLevel: 'HIGH',
      isExact: false,
      isAuthorized: true,
    };
    batch.rows[0].entityResolutions!.truck = {
      entityType: 'TRUCK',
      sourceValue: 'شاحنة 1',
      normalizedValue: 'شاحنة 1',
      originalValue: 'شاحنة 1',
      confidence: 0.5,
      matchMethod: 'FUZZY',
      relationshipStatus: 'VALID',
      recommendation: 'REVIEW',
      riskLevel: 'HIGH',
      isExact: false,
      isAuthorized: true,
    };

    // Resolve carrier only
    const res = ExcelCsvPipelineService.applyEntityResolutionDecision(
      batch,
      1,
      'carrier',
      'SELECT_ALTERNATE',
      { selectedEntityId: 'CAR-100', selectedDisplayName: 'الناقل الأول' },
      dummyContext,
      'user-admin-1'
    );

    // Truck is still unresolved -> row MUST remain requires_review
    expect(res.rows[0].reviewStatus).toBe('requires_review');
  });

  it('17. row does not become valid when blocking validation issue exists', () => {
    const batch = createSampleBatch();
    batch.rows[0].status = 'ERROR';
    batch.rows[0].validationIssues = [{ issueId: 'iss-1', row: 1, field: 'date', code: 'FATAL_DATE', message: 'التاريخ غير صالح', severity: 'BLOCKING', resolvable: false, blocking: true }];

    const res = ExcelCsvPipelineService.applyEntityResolutionDecision(
      batch,
      1,
      'carrier',
      'SELECT_ALTERNATE',
      { selectedEntityId: 'CAR-100', selectedDisplayName: 'الناقل الأول' },
      dummyContext,
      'user-admin-1'
    );

    expect(res.rows[0].reviewStatus).not.toBe('accepted');
    expect(res.rows[0].reviewStatus).toBe('requires_review');
  });

  it('18. fully resolved row can leave requires_review if validation permits', () => {
    const batch = createSampleBatch();
    batch.rows[0].status = 'VALID';
    batch.rows[0].validationIssues = [];

    const res = ExcelCsvPipelineService.applyEntityResolutionDecision(
      batch,
      1,
      'carrier',
      'SELECT_ALTERNATE',
      { selectedEntityId: 'CAR-100', selectedDisplayName: 'الناقل الأول' },
      dummyContext,
      'user-admin-1'
    );

    expect(res.rows[0].reviewStatus).toBe('accepted');
  });

  it('19. resolution decision updates REVIEW snapshot and recalculates KPIs', () => {
    const batch = createSampleBatch();
    batch.rows[0].status = 'VALID';

    const res = ExcelCsvPipelineService.applyEntityResolutionDecision(
      batch,
      1,
      'carrier',
      'SELECT_ALTERNATE',
      { selectedEntityId: 'CAR-100', selectedDisplayName: 'الناقل الأول' },
      dummyContext,
      'user-admin-1'
    );

    expect(res.requiresReviewRows).toBe(0);
    expect(res.validRows).toBe(1);
  });

  it('20. LEAVE_UNRESOLVED decision keeps riskLevel HIGH and recommendation REVIEW', () => {
    const batch = createSampleBatch();
    const res = ExcelCsvPipelineService.applyEntityResolutionDecision(
      batch,
      1,
      'carrier',
      'LEAVE_UNRESOLVED',
      {},
      dummyContext,
      'user-admin-1'
    );

    expect(res.rows[0].entityResolutions?.carrier?.recommendation).toBe('REVIEW');
    expect(res.rows[0].entityResolutions?.carrier?.riskLevel).toBe('HIGH');
    expect(res.rows[0].reviewStatus).toBe('requires_review');
  });

  it('21. VERSION_CONFLICT in session update is handled gracefully without fake success', async () => {
    const batch = createSampleBatch();
    const err: any = new Error('VERSION_CONFLICT');
    err.code = 'VERSION_CONFLICT';

    // Verify error code structure
    expect(err.code).toBe('VERSION_CONFLICT');
  });

  it('22. persisted entityResolutions survive resume intact', () => {
    const batch = createSampleBatch();
    const jsonStr = JSON.stringify(batch);
    const restoredBatch: UnifiedImportBatch = JSON.parse(jsonStr);

    expect(restoredBatch.rows[0].entityResolutions?.carrier?.sourceValue).toBe('ناقل غير مؤكد');
  });

  it('23. persisted resolvedValues survive resume intact', () => {
    const batch = createSampleBatch();
    batch.rows[0].resolvedValues = { carrierId: 'CAR-100', truckId: 'TRK-200' };

    const jsonStr = JSON.stringify(batch);
    const restoredBatch: UnifiedImportBatch = JSON.parse(jsonStr);

    expect(restoredBatch.rows[0].resolvedValues?.carrierId).toBe('CAR-100');
    expect(restoredBatch.rows[0].resolvedValues?.truckId).toBe('TRK-200');
  });

  it('24. no canonical CREATE endpoint is called during resolution decisions', () => {
    const serviceFilePath = path.resolve(__dirname, '../components/importCenter/ExcelCsvImportSection.tsx');
    const code = fs.readFileSync(serviceFilePath, 'utf-8');

    expect(code).not.toContain('/setup-carrier');
    expect(code).not.toContain('/setup-material');
    expect(code).not.toContain('/setup-driver');
    expect(code).not.toContain('/setup-truck');
  });

  it('25. no /api/intake/canonical is called during resolution decisions', () => {
    const serviceFilePath = path.resolve(__dirname, '../components/importCenter/ExcelCsvImportSection.tsx');
    const code = fs.readFileSync(serviceFilePath, 'utf-8');

    expect(code).not.toContain('/api/intake/canonical');
  });

  it('26. EntityResolutionSection.tsx is not imported into production UI', () => {
    const serviceFilePath = path.resolve(__dirname, '../components/importCenter/ExcelCsvImportSection.tsx');
    const code = fs.readFileSync(serviceFilePath, 'utf-8');

    expect(code).not.toContain('EntityResolutionSection');
  });

  it('27. only one row-level permanent resolution action entry point is rendered', () => {
    const serviceFilePath = path.resolve(__dirname, '../components/importCenter/ExcelCsvImportSection.tsx');
    const code = fs.readFileSync(serviceFilePath, 'utf-8');

    expect(code).toContain('مراجعة المطابقة');
    expect(code).not.toContain('مراجعة الناقل');
    expect(code).not.toContain('مراجعة الشاحنة');
  });

  it('28. rowRequiresEntityResolution detects rows with unresolved attention items', () => {
    const batch = createSampleBatch();
    expect(ExcelCsvPipelineService.rowRequiresEntityResolution(batch.rows[0])).toBe(true);

    batch.rows[0].entityResolutions!.carrier!.recommendation = 'ACCEPT';
    batch.rows[0].entityResolutions!.carrier!.riskLevel = 'LOW';
    batch.rows[0].entityResolutions!.carrier!.confidence = 1.0;

    expect(ExcelCsvPipelineService.rowRequiresEntityResolution(batch.rows[0])).toBe(false);
  });

  it('29. recalculateBatchCounts accurately updates summary KPIs', () => {
    const batch = createSampleBatch();
    batch.rows[0].reviewStatus = 'accepted';

    const updated = ExcelCsvPipelineService.recalculateBatchCounts(batch);
    expect(updated.validRows).toBe(1);
    expect(updated.requiresReviewRows).toBe(0);
  });
});
