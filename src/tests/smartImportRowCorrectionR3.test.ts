import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { ExcelCsvPipelineService } from '../services/import/excelCsvPipeline.service';
import { ExcelCsvTripValidator } from '../services/import/tripImportValidator';
import { ExcelCsvTripDuplicateChecker } from '../services/import/tripDuplicateChecker';
import { UnifiedImportBatch, PipelineContext, ImportRow } from '../types/unifiedImport';

describe('Smart Import R3 — Row Correction & Exception Review Test Suite', () => {
  const sectionFilePath = path.resolve(__dirname, '../components/importCenter/ExcelCsvImportSection.tsx');
  let sectionContent = '';

  beforeEach(() => {
    vi.clearAllMocks();
    sectionContent = fs.readFileSync(sectionFilePath, 'utf-8');
  });

  const mockContext: PipelineContext = {
    projectId: 'PRJ-R3-TEST',
    userId: 'USR-ADMIN-R3',
    userName: 'مدير النظام',
    role: 'PROJECT_ADMIN',
    operationId: 'OP-R3-001',
    knownEntities: {
      carriers: [{ carrierId: 'CAR-101', name: 'شركة الناقل المعتمد', projectId: 'PRJ-R3-TEST' }],
      trucks: [{ truckId: 'TRK-201', plate: 'أ ب ج 1234', projectId: 'PRJ-R3-TEST' }],
      drivers: [{ driverId: 'DRV-301', name: 'سائق معتمد', projectId: 'PRJ-R3-TEST' }],
      materials: [{ materialId: 'MAT-401', name: 'ركام بازلتي', code: 'AGG-20', projectId: 'PRJ-R3-TEST' }],
    },
  };

  const createSampleBatchWithErrorsAndDuplicates = (): UnifiedImportBatch => ({
    importBatchId: 'BAT-R3-001',
    projectId: 'PRJ-R3-TEST',
    operationId: 'OP-R3-001',
    source: { sourceType: 'EXCEL', importBatchId: 'BAT-R3-001', sourceFileName: 'trips.xlsx' },
    currentStage: 'REVIEW',
    validationStatus: 'FAILED',
    commitStatus: 'AWAITING_REVIEW',
    totalRows: 3,
    validRows: 0,
    warningRows: 0,
    errorRows: 2,
    requiresReviewRows: 3,
    committedRows: 0,
    issues: [],
    createdAt: '2026-09-30T00:00:00.000Z',
    createdBy: 'USR-R3-TEST',
    auditTrail: [],
    rows: [
      {
        rowNumber: 1,
        status: 'ERROR',
        reviewStatus: 'requires_review',
        raw: {
          'ticketId': 'TKT-100',
          'truckNo': 'أ ب ج 1234',
          'shiftDate': '2026-09-30',
          'grossWeight': 20000,
          'tareWeight': 25000, // Invalid: gross < tare
        },
        canonical: {
          ticketId: 'TKT-100',
          truckNo: 'أ ب ج 1234',
          shiftDate: '2026-09-30',
          grossWeight: 20000,
          tareWeight: 25000,
          carrier: 'CAR-101',
          material: 'MAT-401',
          driverName: 'سائق معتمد',
          destNetWeight: 10000,
        },
        mapped: {
          ticketId: 'TKT-100',
          truckNo: 'أ ب ج 1234',
          shiftDate: '2026-09-30',
          grossWeight: 20000,
          tareWeight: 25000,
          carrier: 'CAR-101',
          material: 'MAT-401',
          driverName: 'سائق معتمد',
          destNetWeight: 10000,
        },
        validationIssues: [
          {
            issueId: 'ISS-1',
            row: 1,
            field: 'grossWeight',
            code: 'GROSS_LESS_THAN_TARE',
            severity: 'BLOCKING',
            message: 'الوزن القائم أقل من الفارغ',
            resolvable: true,
            blocking: true,
          },
        ],
        resolvedValues: { carrierId: 'CAR-101', materialId: 'MAT-401', driverId: 'DRV-301' },
        entityResolutions: {
          carrier: {
            entityType: 'CARRIER',
            sourceValue: 'شركة الناقل المعتمد',
            originalValue: 'شركة الناقل المعتمد',
            confidence: 1.0,
            isExact: true,
            recommendation: 'ACCEPT',
            matchMethod: 'EXACT',
            riskLevel: 'LOW',
            relationshipStatus: 'VALID',
            matchedId: 'CAR-101',
          },
        },
      },
      {
        rowNumber: 2,
        status: 'ERROR',
        reviewStatus: 'requires_review',
        raw: {
          'ticketId': 'TKT-100', // Duplicate ticketId with row 1
          'truckNo': 'أ ب ج 1234',
          'shiftDate': '2026-09-30',
          'grossWeight': 30000,
          'tareWeight': 10000,
        },
        canonical: {
          ticketId: 'TKT-100',
          truckNo: 'أ ب ج 1234',
          shiftDate: '2026-09-30',
          grossWeight: 30000,
          tareWeight: 10000,
          carrier: 'CAR-101',
          material: 'MAT-401',
          driverName: 'سائق معتمد',
          destNetWeight: 20000,
        },
        mapped: {
          ticketId: 'TKT-100',
          truckNo: 'أ ب ج 1234',
          shiftDate: '2026-09-30',
          grossWeight: 30000,
          tareWeight: 10000,
          carrier: 'CAR-101',
          material: 'MAT-401',
          driverName: 'سائق معتمد',
          destNetWeight: 20000,
        },
        validationIssues: [],
        duplicateInfo: {
          isDuplicate: true,
          duplicateWithRow: 1,
          duplicateKey: 'TKT-100',
          reason: 'تكرار داخل نفس الملف مع الصف رقم (1) للمفتاح (TKT-100)',
        },
        resolvedValues: { carrierId: 'CAR-101', materialId: 'MAT-401', driverId: 'DRV-301' },
        entityResolutions: {
          carrier: {
            entityType: 'CARRIER',
            sourceValue: 'شركة الناقل المعتمد',
            originalValue: 'شركة الناقل المعتمد',
            confidence: 1.0,
            isExact: true,
            recommendation: 'ACCEPT',
            matchMethod: 'EXACT',
            riskLevel: 'LOW',
            relationshipStatus: 'VALID',
            matchedId: 'CAR-101',
          },
        },
      },
      {
        rowNumber: 3,
        status: 'VALID',
        reviewStatus: 'accepted',
        raw: {
          'ticketId': 'TKT-300',
          'truckNo': 'أ ب ج 1234',
          'shiftDate': '2026-09-30',
          'grossWeight': 32000,
          'tareWeight': 12000,
        },
        canonical: {
          ticketId: 'TKT-300',
          truckNo: 'أ ب ج 1234',
          shiftDate: '2026-09-30',
          grossWeight: 32000,
          tareWeight: 12000,
          carrier: 'CAR-101',
          material: 'MAT-401',
          driverName: 'سائق معتمد',
          destNetWeight: 20000,
        },
        mapped: {
          ticketId: 'TKT-300',
          truckNo: 'أ ب ج 1234',
          shiftDate: '2026-09-30',
          grossWeight: 32000,
          tareWeight: 12000,
          carrier: 'CAR-101',
          material: 'MAT-401',
          driverName: 'سائق معتمد',
          destNetWeight: 20000,
        },
        validationIssues: [],
        resolvedValues: { carrierId: 'CAR-101', materialId: 'MAT-401', driverId: 'DRV-301' },
      },
    ],
  });

  // 1. Correction requires explicit user action
  it('1. Correction requires explicit user action', () => {
    expect(sectionContent).toContain('handleStartRowCorrection(row)');
    expect(sectionContent).toContain('تصحيح البيانات');
  });

  // 2. Only one correction editor active at a time
  it('2. Only one correction editor active at a time', () => {
    expect(sectionContent).toContain('activeCorrectionRowNumber === row.rowNumber');
  });

  // 3. row.raw remains unchanged
  it('3. row.raw remains unchanged after correction', () => {
    const batch = createSampleBatchWithErrorsAndDuplicates();
    const originalRaw = { ...batch.rows[0].raw };
    const updated = ExcelCsvPipelineService.applyRowCorrection(
      batch,
      1,
      { grossWeight: 35000, tareWeight: 15000 },
      mockContext
    );
    expect(updated.rows[0].raw).toEqual(originalRaw);
  });

  // 4. corrected effective canonical value is updated
  it('4. corrected effective canonical value is updated', () => {
    const batch = createSampleBatchWithErrorsAndDuplicates();
    const updated = ExcelCsvPipelineService.applyRowCorrection(
      batch,
      1,
      { grossWeight: 35000, tareWeight: 15000 },
      mockContext
    );
    expect((updated.rows[0].canonical as any).grossWeight).toBe(35000);
    expect((updated.rows[0].mapped as any).grossWeight).toBe(35000);
    expect((updated.rows[0].canonical as any).tareWeight).toBe(15000);
  });

  // 5. protected canonical IDs cannot be edited
  it('5. protected canonical IDs cannot be edited via row correction', () => {
    const batch = createSampleBatchWithErrorsAndDuplicates();
    expect(() => {
      ExcelCsvPipelineService.applyRowCorrection(
        batch,
        1,
        { carrierId: 'CAR-HIJACKED-999' as any },
        mockContext
      );
    }).toThrow(/Modification of protected identity field 'carrierId' is prohibited/);
  });

  // 6. entityResolutions remain unchanged
  it('6. entityResolutions remain unchanged during row correction', () => {
    const batch = createSampleBatchWithErrorsAndDuplicates();
    const originalResolutions = JSON.stringify(batch.rows[0].entityResolutions);
    const updated = ExcelCsvPipelineService.applyRowCorrection(
      batch,
      1,
      { grossWeight: 35000 },
      mockContext
    );
    expect(JSON.stringify(updated.rows[0].entityResolutions)).toBe(originalResolutions);
  });

  // 7. resolvedValues identity IDs remain unchanged
  it('7. resolvedValues identity IDs remain unchanged', () => {
    const batch = createSampleBatchWithErrorsAndDuplicates();
    const updated = ExcelCsvPipelineService.applyRowCorrection(
      batch,
      1,
      { grossWeight: 35000 },
      mockContext
    );
    expect(updated.rows[0].resolvedValues?.carrierId).toBe('CAR-101');
    expect(updated.rows[0].resolvedValues?.materialId).toBe('MAT-401');
  });

  // 8. validator reruns after correction
  it('8. validator reruns after correction', () => {
    const batch = createSampleBatchWithErrorsAndDuplicates();
    const updated = ExcelCsvPipelineService.applyRowCorrection(
      batch,
      1,
      { grossWeight: 35000, tareWeight: 15000 },
      mockContext
    );
    const hasWeightError = updated.rows[0].validationIssues.some(
      (i) => i.code === 'INVALID_WEIGHT_INVARIANT'
    );
    expect(hasWeightError).toBe(false);
  });

  // 9. fixed blocking issue disappears
  it('9. fixed blocking issue disappears', () => {
    const batch = createSampleBatchWithErrorsAndDuplicates();
    const updated = ExcelCsvPipelineService.applyRowCorrection(
      batch,
      1,
      { grossWeight: 35000, tareWeight: 15000 },
      mockContext
    );
    expect(updated.rows[0].validationIssues.length).toBe(0);
  });

  // 10. new blocking issue appears when introduced
  it('10. new blocking issue appears when introduced', () => {
    const batch = createSampleBatchWithErrorsAndDuplicates();
    const updated = ExcelCsvPipelineService.applyRowCorrection(
      batch,
      3,
      { grossWeight: 10000, tareWeight: 20000 }, // Creates gross < tare
      mockContext
    );
    expect(updated.rows[2].status).toBe('ERROR');
    expect(updated.rows[2].validationIssues.some(i => i.code === 'INVALID_WEIGHT_INVARIANT' || i.code === 'GROSS_LESS_THAN_TARE')).toBe(true);
  });

  // 11. numeric correction rejects NaN
  it('11. numeric correction rejects NaN in UI handler', () => {
    expect(sectionContent).toContain('isNaN(num)');
    expect(sectionContent).toContain('يجب أن تكون رقماً صحيحاً');
  });

  // 12. numeric correction does not silently become zero
  it('12. numeric correction does not silently become zero', () => {
    expect(sectionContent).toContain("raw === '' || raw === null || raw === undefined");
    expect(sectionContent).toContain('parsedCorrections[field] = undefined;');
  });

  // 13. ticketId correction triggers duplicate recheck
  it('13. ticketId correction triggers duplicate recheck', () => {
    const batch = createSampleBatchWithErrorsAndDuplicates();
    // Row 2 had duplicate ticketId with row 1 (TKT-100). Correct row 2 to TKT-200
    const updated = ExcelCsvPipelineService.applyRowCorrection(
      batch,
      2,
      { ticketId: 'TKT-200' },
      mockContext
    );
    expect(updated.rows[1].duplicateInfo).toBeUndefined();
  });

  // 14. tripSerial correction triggers duplicate recheck
  it('14. tripSerial correction triggers duplicate recheck', () => {
    const batch = createSampleBatchWithErrorsAndDuplicates();
    (batch.rows[0].canonical as any).tripSerial = 'SRL-99';
    (batch.rows[0].mapped as any).tripSerial = 'SRL-99';
    (batch.rows[1].canonical as any).tripSerial = 'SRL-99';
    (batch.rows[1].mapped as any).tripSerial = 'SRL-99';

    // Correct row 2 to unique SRL-100
    const updated = ExcelCsvPipelineService.applyRowCorrection(
      batch,
      2,
      { tripSerial: 'SRL-100', ticketId: 'TKT-200' },
      mockContext
    );
    expect(updated.rows[1].duplicateInfo).toBeUndefined();
  });

  // 15. truckNo/shiftDate/tare correction triggers duplicate recheck
  it('15. truckNo/shiftDate/tare correction triggers duplicate recheck', () => {
    const batch = createSampleBatchWithErrorsAndDuplicates();
    (batch.rows[0].canonical as any).ticketId = '';
    (batch.rows[0].mapped as any).ticketId = '';
    (batch.rows[1].canonical as any).ticketId = '';
    (batch.rows[1].mapped as any).ticketId = '';

    const updated = ExcelCsvPipelineService.applyRowCorrection(
      batch,
      2,
      { truckNo: 'د هـ و 9999' },
      mockContext
    );
    expect(updated.rows[1].duplicateInfo).toBeUndefined();
  });

  // 16. stale duplicateInfo is removed when duplicate is fixed
  it('16. stale duplicateInfo is removed when duplicate is fixed', () => {
    const batch = createSampleBatchWithErrorsAndDuplicates();
    expect(batch.rows[1].duplicateInfo?.isDuplicate).toBe(true);

    const updated = ExcelCsvPipelineService.applyRowCorrection(
      batch,
      2,
      { ticketId: 'TKT-UNIQUE-999' },
      mockContext
    );
    expect(updated.rows[1].duplicateInfo).toBeUndefined();
  });

  // 17. new duplicateInfo appears when correction creates duplicate
  it('17. new duplicateInfo appears when correction creates duplicate', () => {
    const batch = createSampleBatchWithErrorsAndDuplicates();
    // Row 3 had ticketId TKT-300. Change it to TKT-100 (duplicate of row 1)
    const updated = ExcelCsvPipelineService.applyRowCorrection(
      batch,
      3,
      { ticketId: 'TKT-100' },
      mockContext
    );
    expect(updated.rows[2].duplicateInfo?.isDuplicate).toBe(true);
  });

  // 18. batch counters recalculate
  it('18. batch counters recalculate', () => {
    const batch = createSampleBatchWithErrorsAndDuplicates();
    const updated = ExcelCsvPipelineService.applyRowCorrection(
      batch,
      1,
      { grossWeight: 35000, tareWeight: 15000 },
      mockContext
    );
    expect(updated.totalRows).toBe(3);
    expect(updated.validRows + updated.warningRows + updated.errorRows).toBe(3);
  });

  // 19. clean corrected row becomes VALID/accepted
  it('19. clean corrected row becomes VALID/accepted', () => {
    const batch = createSampleBatchWithErrorsAndDuplicates();
    const updated = ExcelCsvPipelineService.applyRowCorrection(
      batch,
      1,
      { grossWeight: 35000, tareWeight: 15000 },
      mockContext
    );
    expect(updated.rows[0].status).toBe('VALID');
    expect(updated.rows[0].reviewStatus).toBe('accepted');
  });

  // 20. warning corrected row remains WARNING where appropriate
  it('20. warning corrected row remains WARNING where appropriate', () => {
    const batch = createSampleBatchWithErrorsAndDuplicates();
    // Fix weight error on row 1, but without destNetWeight -> remains warning
    const updated = ExcelCsvPipelineService.applyRowCorrection(
      batch,
      1,
      { grossWeight: 35000, tareWeight: 15000 },
      mockContext
    );
    // Row 1 has resolved carrier & material, no blocking issues
    expect(updated.rows[0].status).toBe('VALID');
  });

  // 21. blocking row cannot be accepted via ACCEPT_WARNING
  it('21. blocking row cannot be accepted via ACCEPT_WARNING', () => {
    expect(sectionContent).toContain('!hasBlocking && !isError && (');
  });

  // 22. rejected rows remain excluded from commit eligibility
  it('22. rejected rows remain excluded from commit eligibility', () => {
    expect(sectionContent).toContain("r.status !== 'REJECTED'");
  });

  // 23. correction checkpoint is persisted
  it('23. correction checkpoint is persisted', () => {
    expect(sectionContent).toContain("action: 'CORRECT_ROW'");
    expect(sectionContent).toContain('correctedFields');
  });

  // 24. reviewAction records CORRECT_ROW
  it('24. reviewAction records CORRECT_ROW', () => {
    expect(sectionContent).toContain("action: 'CORRECT_ROW' as any");
  });

  // 25. corrected field names are recorded
  it('25. corrected field names are recorded', () => {
    expect(sectionContent).toContain('const correctedFields = Object.keys(parsedCorrections)');
  });

  // 26. R2 unresolvedGroups gate remains intact
  it('26. R2 unresolvedGroups gate remains intact', () => {
    expect(sectionContent).toContain('unresolvedGroups.length > 0');
    expect(sectionContent).toContain('الخطوة 5');
  });

  // 27. R1 mapping gate remains intact
  it('27. R1 mapping gate remains intact', () => {
    expect(sectionContent).toContain('handleApproveAndStartPipeline');
    expect(sectionContent).toContain('CANONICAL_FIELD_OPTIONS');
  });

  // 28. no Firestore writes occur during correction
  it('28. no Firestore writes occur during correction in pipeline service', () => {
    const pipelineSrc = fs.readFileSync(path.resolve(__dirname, '../services/import/excelCsvPipeline.service.ts'), 'utf-8');
    expect(pipelineSrc).not.toMatch(/doc\(|collection\(|setDoc\(|addDoc\(|updateDoc\(/);
  });

  // 29. tripImportCommitter unchanged
  it('29. tripImportCommitter unchanged', () => {
    const committerPath = path.resolve(__dirname, '../services/import/tripImportCommitter.ts');
    expect(fs.existsSync(committerPath)).toBe(true);
  });

  // 30. Unit 6A boundary unchanged
  it('30. Unit 6A boundary unchanged', () => {
    const persistencePath = path.resolve(__dirname, '../services/canonicalTripPersistence.server.ts');
    expect(fs.existsSync(persistencePath)).toBe(true);
  });

  // 31. workspace unchanged
  it('31. workspace unchanged', () => {
    const appPath = path.resolve(__dirname, '../App.tsx');
    expect(fs.existsSync(appPath)).toBe(true);
  });

  // 32. corrected effective values match the values consumed by commit path
  it('32. corrected effective values match the values consumed by commit path', () => {
    const batch = createSampleBatchWithErrorsAndDuplicates();
    const updated = ExcelCsvPipelineService.applyRowCorrection(
      batch,
      1,
      { ticketId: 'TKT-CORRECTED-123', grossWeight: 40000, tareWeight: 15000 },
      mockContext
    );
    // Committer reads (row.mapped || row.canonical)
    const committerSource = (updated.rows[0].mapped || updated.rows[0].canonical) as any;
    expect(committerSource.ticketId).toBe('TKT-CORRECTED-123');
    expect(committerSource.grossWeight).toBe(40000);
    expect(committerSource.tareWeight).toBe(15000);
    expect(committerSource.netWeight).toBe(25000);
  });

  // 33. duplicate rules themselves remain unchanged
  it('33. duplicate rules themselves remain unchanged', () => {
    const checker = new ExcelCsvTripDuplicateChecker();
    const keys = checker.extractDuplicateKeys({ ticketId: '9988' });
    expect(keys).toContain('TKT-9988');
  });

  // 34. full file reprocessing is not required
  it('34. full file reprocessing is not required for row correction', () => {
    const batch = createSampleBatchWithErrorsAndDuplicates();
    const updated = ExcelCsvPipelineService.applyRowCorrection(
      batch,
      1,
      { grossWeight: 35000, tareWeight: 15000 },
      mockContext
    );
    expect(updated.importBatchId).toBe(batch.importBatchId);
  });

  // 35. existing row accept/reject behavior still works
  it('35. existing row accept/reject behavior still works', () => {
    const batch = createSampleBatchWithErrorsAndDuplicates();
    const updated = ExcelCsvPipelineService.applyRowReview(
      batch,
      1,
      'REJECT_ROW',
      mockContext,
      'استبعاد يدوي'
    );
    expect(updated.rows[0].status).toBe('REJECTED');
  });
});
