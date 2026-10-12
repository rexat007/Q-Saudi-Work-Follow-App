import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as XLSX from 'xlsx';
import {
  FileIntakeValidator,
  ExcelImportParser,
  CsvImportParser,
  ExcelCsvNormalizer,
  ExcelCsvColumnMapper,
  ExcelCsvTripValidator,
  ExcelCsvTripDuplicateChecker,
  ExcelCsvTripCommitter,
  ExcelCsvPipelineService,
  UnifiedImportPipelineService,
} from '../services';
import { importedTripClientService } from '../services/import/importedTripClient.service';
import { PipelineContext, ImportSource } from '../types/unifiedImport';

describe('BLOCK 31 — Excel / CSV Import Test Suite', () => {
  let baseContext: PipelineContext;

  beforeEach(() => {
    ExcelCsvTripCommitter.resetIdempotencyCache();
    vi.spyOn(importedTripClientService, 'dispatchImportedTrip').mockImplementation(async (projectId, params) => {
      return {
        trip: {
          tripId: `TRP-${params.operationalData.ticketId || '101'}`,
          projectId,
          status: 'DISPATCHED',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as any,
      };
    });
    baseContext = {
      projectId: 'proj_riyadh_metro',
      userId: 'usr_importer_01',
      userName: 'مهندس الاستيراد',
      role: 'PROJECT_ADMIN',
      operationId: `OP-TEST-BLOCK31-${Date.now()}`,
      allowWarningsCommit: true,
      knownEntities: {
        carrierIds: ['الشركة الشرقية للنقل', 'مؤسسة الرمال السريعة'],
        truckPlates: ['1010-أ ب ج', '2020-د هـ و'],
        driverIds: ['محمد أحمد', 'علي حسن'],
        materialCodes: ['AGG-01', 'ركام ناعم 0-5 مم'],
      },
      existingKeys: new Set(['TKT-EXISTING-999']),
    };
  });

  // -------------------------------------------------------------------------
  // 1. File Intake Validation
  // -------------------------------------------------------------------------
  it('TC-01-FILE-INTAKE: فحص واستقبال ملفات Excel (.xlsx, .xls) و CSV والتحقق من الحجم والامتداد', () => {
    const v1 = FileIntakeValidator.validate('trips_export.xlsx', 1024 * 50);
    const v2 = FileIntakeValidator.validate('old_records.xls', 1024 * 20);
    const v3 = FileIntakeValidator.validate('scale_data.csv', 1024 * 10);
    const v4 = FileIntakeValidator.validate('trips.pdf', 1024);
    const v5 = FileIntakeValidator.validate('empty.csv', 0);
    const v6 = FileIntakeValidator.validate('oversized.xlsx', 30 * 1024 * 1024);

    expect(v1.isValid).toBe(true);
    expect(v1.fileType).toBe('EXCEL');
    expect(v2.isValid).toBe(true);
    expect(v2.fileType).toBe('EXCEL');
    expect(v3.isValid).toBe(true);
    expect(v3.fileType).toBe('CSV');
    expect(v4.isValid).toBe(false);
    expect(v5.isValid).toBe(false);
    expect(v6.isValid).toBe(false);
  });

  // -------------------------------------------------------------------------
  // 2. Multi-Sheet XLSX Parsing & Sheet Selection
  // -------------------------------------------------------------------------
  it('TC-02-EXCEL-MULTISHEET: تحليل مصنف Excel متعدد الأوراق واختيار ورقة العمل المحددة', () => {
    const wb = XLSX.utils.book_new();
    const wsSheet1 = XLSX.utils.aoa_to_sheet([
      ['رقم التذكرة', 'اللوحة', 'الناقل', 'فارغ', 'قائم'],
      ['TKT-001', '1010-أ ب ج', 'الشركة الشرقية للنقل', 15000, 42000],
      ['TKT-002', '2020-د هـ و', 'مؤسسة الرمال السريعة', 14500, 41000],
    ]);
    const wsSheet2 = XLSX.utils.aoa_to_sheet([
      ['رقم التذكرة', 'اللوحة', 'الناقل'],
      ['TKT-SHEET2-01', '3030-س ص ع', 'ناقل خاص'],
    ]);

    XLSX.utils.book_append_sheet(wb, wsSheet1, 'ورقة الميزان');
    XLSX.utils.book_append_sheet(wb, wsSheet2, 'شحنات إضافية');

    const xlsxBuffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
    const sheetNames = ExcelImportParser.getWorkbookSheetNames(xlsxBuffer);

    const parser = new ExcelImportParser();
    const source: ImportSource = {
      sourceType: 'EXCEL',
      importBatchId: 'BAT-XLSX-01',
      sourceFileName: 'test.xlsx',
    };

    // Sheet 1 default
    const res1 = parser.parse(source, xlsxBuffer);
    // Sheet 2 selected
    const res2 = parser.parse(source, xlsxBuffer, { sheetName: 'شحنات إضافية' });

    expect(sheetNames.length).toBe(2);
    expect(sheetNames[0]).toBe('ورقة الميزان');
    expect(res1.rows.length).toBe(2);
    expect(res1.rows[0]['رقم التذكرة']).toBe('TKT-001');
    expect(res2.rows.length).toBe(1);
    expect(res2.rows[0]['رقم التذكرة']).toBe('TKT-SHEET2-01');
  });

  // -------------------------------------------------------------------------
  // 3. Duplicate Headers & Empty Row Filtering
  // -------------------------------------------------------------------------
  it('TC-03-EMPTY-ROWS-DUP-HEADERS: معالجة تكرار أسماء الأعمدة واستبعاد الصفوف الفارغة في Excel', () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([
      ['الوزن', 'الوزن', 'اللوحة'], // Duplicate header
      ['', '', ''],                  // Empty row to skip
      ['15000', '42000', '1010-أ ب ج'],
      ['', '', ''],                  // Empty row to skip
    ]);
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    const xlsxBuffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });

    const parser = new ExcelImportParser();
    const res = parser.parse({ sourceType: 'EXCEL', importBatchId: 'BAT-DEDUP' }, xlsxBuffer);

    expect(res.headers?.includes('الوزن')).toBe(true);
    expect(res.headers?.includes('الوزن_2')).toBe(true);
    expect(res.rows.length).toBe(1);
  });

  // -------------------------------------------------------------------------
  // 4. CSV Parsing: UTF-8 BOM, Quoted Fields, Delimiters
  // -------------------------------------------------------------------------
  it('TC-04-CSV-BOM-QUOTES-DELIMITER: تحليل ملفات CSV مع إزالة BOM والتعامل مع الفواصل داخل النصوص وعلامات التنصيص المزدوجة', () => {
    const csvContent =
      '\uFEFF"رقم التذكرة","الناقل, شركة معتمدة","اللوحة","الصافي"\r\n' +
      '"TKT-101","الشركة الشرقية, فرع الرياض","1010-أ ب ج","27000"\r\n' +
      '"TKT-102","مؤسسة الرمال ""المتحدة""","2020-د هـ و","26500"\r\n';

    const parser = new CsvImportParser();
    const res = parser.parse({ sourceType: 'CSV', importBatchId: 'BAT-CSV-BOM' }, csvContent);

    // Semicolon test
    const csvSemi = 'Ticket;Truck;Net\nTKT-500;1010-ABC;25000';
    const resSemi = parser.parse({ sourceType: 'CSV', importBatchId: 'BAT-SEMI' }, csvSemi);

    expect(res.headers?.includes('رقم التذكرة')).toBe(true);
    expect(res.headers?.includes('الناقل, شركة معتمدة')).toBe(true);
    expect(res.rows.length).toBe(2);
    expect(res.rows[0]['الناقل, شركة معتمدة']).toBe('الشركة الشرقية, فرع الرياض');
    expect(res.rows[1]['الناقل, شركة معتمدة']).toBe('مؤسسة الرمال "المتحدة"');
    expect(resSemi.headers?.includes('Truck')).toBe(true);
    expect(resSemi.rows[0]['Ticket']).toBe('TKT-500');
  });

  // -------------------------------------------------------------------------
  // 5. Column Mapping Intelligence (Exact, Normalized, Aliases)
  // -------------------------------------------------------------------------
  it('TC-05-COLUMN-MAPPING: مطابقة الأعمدة الذكية (Exact, Normalized, Aliases Arabic/English)', () => {
    const headers = [
      'ticket_no',
      'رقم التذكرة',
      'رقم اللوحة',
      'الناقل',
      'نوع المادة',
      'الوزن الفارغ',
      'الوزن القائم',
      'الوزن الصافي',
      'تاريخ الوردية',
      'unknown_custom_x',
    ];

    const mappings = ExcelCsvColumnMapper.mapHeaders(headers);

    expect(mappings['ticket_no'].canonicalField).toBe('ticketId');
    expect(mappings['رقم التذكرة'].canonicalField).toBe('ticketId');
    expect(mappings['رقم اللوحة'].canonicalField).toBe('truckNo');
    expect(mappings['الناقل'].canonicalField).toBe('carrier');
    expect(mappings['نوع المادة'].canonicalField).toBe('materialType');
    expect(mappings['الوزن الفارغ'].canonicalField).toBe('tareWeight');
    expect(mappings['الوزن القائم'].canonicalField).toBe('grossWeight');
    expect(mappings['الوزن الصافي'].canonicalField).toBe('netWeight');
    expect(mappings['تاريخ الوردية'].canonicalField).toBe('shiftDate');
    expect(mappings['unknown_custom_x'].confidence).toBeLessThan(0.70);
  });

  // -------------------------------------------------------------------------
  // 6. Normalization: Arabic Digits, Units, Dates, Net Calculation
  // -------------------------------------------------------------------------
  it('TC-06-DATA-NORMALIZATION: معايرة الأرقام العربية الشرقية، الفواصل العشرية، وحدات القياس، والتواريخ، وحساب الصافي تلقائياً', () => {
    const raw = {
      tareWeight: '١٥,٠٠٠ كجم',
      grossWeight: '٤٢٫٥٠٠ طن',
      notes: '   بيان رحلة تجريبي   ',
    };

    const normalizer = new ExcelCsvNormalizer();
    const norm = normalizer.normalize(raw, 1, baseContext);

    // Date normalization tests
    const dateSerial = ExcelCsvNormalizer.normalizeValue(45180, 'shiftDate'); // 2023-09-11
    const dateSlash = ExcelCsvNormalizer.normalizeValue('15/09/2026', 'shiftDate'); // 2026-09-15

    // Auto calculate net weight
    const rawWithNetCalc = { grossWeight: 42000, tareWeight: 15000 };
    const normWithNet = normalizer.normalize(rawWithNetCalc, 2, baseContext);

    expect(norm.tareWeight).toBe(15000);
    expect(norm.grossWeight).toBe(42.5);
    expect(norm.notes).toBe('بيان رحلة تجريبي');
    expect(dateSerial).toBe('2023-09-11');
    expect(dateSlash).toBe('2026-09-15');
    expect(normWithNet.netWeight).toBe(27000);
  });

  // -------------------------------------------------------------------------
  // 7. Validation: Blocking vs Non-Blocking (Weighbridge Compatible)
  // -------------------------------------------------------------------------
  it('TC-07-VALIDATION-RULES: قواعد التحقق: تمييز الأخطاء المانعة عن التحذيرات غير المانعة (متوافق مع الميزان)', () => {
    const validator = new ExcelCsvTripValidator();

    // Row 1: Missing identification (neither ticket nor truck) -> BLOCKING
    const row1: any = {
      rowNumber: 1,
      canonical: { tareWeight: 15000, grossWeight: 42000 },
    };
    const issues1 = validator.validateRow(row1, baseContext);
    const hasMissingIdBlocking = issues1.some((i) => i.code === 'MISSING_IDENTIFICATION' && i.blocking);

    // Row 2: Physical Invariant Violation: gross < tare -> BLOCKING
    const row2: any = {
      rowNumber: 2,
      canonical: { ticketId: 'TKT-INV-01', truckNo: '1010-أ ب ج', tareWeight: 42000, grossWeight: 15000 },
    };
    const issues2 = validator.validateRow(row2, baseContext);
    const hasGrossLessThanTare = issues2.some((i) => i.code === 'GROSS_LESS_THAN_TARE' && i.blocking);

    // Row 3: Weighbridge row missing driver & destNetWeight -> NON-BLOCKING WARNINGS ONLY
    const row3: any = {
      rowNumber: 3,
      canonical: {
        ticketId: 'TKT-WEIGH-01',
        truckNo: '1010-أ ب ج',
        tareWeight: 15000,
        grossWeight: 42000,
        netWeight: 27000,
      },
    };
    const issues3 = validator.validateRow(row3, baseContext);
    const row3HasBlocking = issues3.some((i) => i.blocking);
    const row3HasUnloadWarning = issues3.some((i) => i.code === 'MISSING_UNLOAD_DATA' && i.severity === 'WARNING');
    const row3HasDriverWarning = issues3.some((i) => i.code === 'MISSING_OPTIONAL_DRIVER' && i.severity === 'WARNING');

    expect(hasMissingIdBlocking).toBe(true);
    expect(hasGrossLessThanTare).toBe(true);
    expect(row3HasBlocking).toBe(false);
    expect(row3HasUnloadWarning).toBe(true);
    expect(row3HasDriverWarning).toBe(true);
  });

  // -------------------------------------------------------------------------
  // 8. Duplicate Detection (Batch and Database)
  // -------------------------------------------------------------------------
  it('TC-08-DUPLICATE-CHECK: اكتشاف التكرار داخل نفس الدفعة ومع قاعدة البيانات وإحالتها للمراجعة', () => {
    const checker = new ExcelCsvTripDuplicateChecker();
    const rows: any[] = [
      { rowNumber: 1, canonical: { ticketId: 'TKT-DUP-01' } },
      { rowNumber: 2, canonical: { ticketId: 'TKT-DUP-01' } }, // batch internal duplicate
      { rowNumber: 3, canonical: { ticketId: 'TKT-EXISTING-999' } }, // db duplicate
    ];

    const checked = checker.checkDuplicates(rows, baseContext);

    expect(checked[0].duplicateInfo?.isDuplicate).toBeFalsy();
    expect(checked[1].duplicateInfo?.isDuplicate).toBe(true);
    expect(checked[1].duplicateInfo?.duplicateWithRow).toBe(1);
    expect(checked[2].duplicateInfo?.isDuplicate).toBe(true);
    expect(checked[2].reviewStatus).toBe('requires_review');
  });

  // -------------------------------------------------------------------------
  // 9. Pre-Commit Gate, Warnings Confirmation, Idempotency & Project Isolation
  // -------------------------------------------------------------------------
  it('TC-09-PRECOMMIT-GATE-IDEMPOTENCY: بوابة الاعتماد الصارمة، تأكيد التحذيرات، عزل المشاريع، وضمان عدم تكرار التنفيذ (Idempotency)', async () => {
    const committer = new ExcelCsvTripCommitter();
    const pipelineService = new UnifiedImportPipelineService();

    // 1. Rejection due to blocking errors
    const batchError = pipelineService.createBatch(
      { sourceType: 'EXCEL', importBatchId: 'BAT-ERR-01' },
      baseContext
    );
    batchError.currentStage = 'REVIEW';
    batchError.commitStatus = 'AWAITING_REVIEW';
    batchError.errorRows = 1;
    batchError.issues = [
      { issueId: 'E1', row: 1, field: 'identification', code: 'ERR', severity: 'BLOCKING', message: 'err', blocking: true, resolvable: true },
    ];
    const resError = await committer.commit(batchError, baseContext);

    // 2. Rejection due to unconfirmed warnings
    const batchWarn = pipelineService.createBatch(
      { sourceType: 'EXCEL', importBatchId: 'BAT-WRN-01' },
      baseContext
    );
    batchWarn.currentStage = 'REVIEW';
    batchWarn.commitStatus = 'AWAITING_REVIEW';
    batchWarn.warningRows = 1;
    batchWarn.issues = [
      { issueId: 'W1', row: 1, field: 'driverName', code: 'WARN', severity: 'WARNING', message: 'warn', blocking: false, resolvable: true },
    ];
    const resWarn = await committer.commit(batchWarn, { ...baseContext, allowWarningsCommit: false });

    // 3. Project isolation rejection
    const foreignContext: PipelineContext = {
      ...baseContext,
      projectId: 'other_proj_neom',
    };
    const batchForeign = pipelineService.createBatch(
      { sourceType: 'CSV', importBatchId: 'BAT-FOR-01' },
      foreignContext
    );
    batchForeign.currentStage = 'REVIEW';
    batchForeign.commitStatus = 'READY_TO_COMMIT';
    batchForeign.validRows = 1;
    const resForeign = await committer.commit(batchForeign, baseContext);

    // 4. Successful commit & Idempotency
    const validBatch = pipelineService.createBatch(
      {
        sourceType: 'EXCEL',
        importBatchId: 'BAT-OK-01',
        sourceFileName: 'dispatch.xlsx',
      },
      baseContext
    );
    validBatch.currentStage = 'REVIEW';
    validBatch.commitStatus = 'READY_TO_COMMIT';
    validBatch.validRows = 1;
    validBatch.rows = [
      {
        rowNumber: 1,
        raw: { ticket: 'TKT-VALID-01' },
        resolvedValues: {
          carrierId: 'CAR-01',
          truckId: 'TRK-01',
          driverId: 'DRV-01',
          materialId: 'MAT-01',
        },
        canonical: {
          projectId: 'proj_riyadh_metro',
          ticketId: 'TKT-VALID-01',
          truckNo: '1010-أ ب ج',
          carrier: 'الشركة الشرقية للنقل',
          tareWeight: 15000,
          grossWeight: 42000,
          netWeight: 27000,
        },
        status: 'VALID',
        reviewStatus: 'accepted',
        validationIssues: [],
      },
    ];

    const fixedContext = { ...baseContext, operationId: 'OP-IDEMP-CHECK-999' };
    const commitRes1 = await committer.commit(validBatch, fixedContext);
    const commitRes2 = await committer.commit(validBatch, fixedContext);

    expect(resError.success).toBe(false);
    expect(resWarn.success).toBe(false);
    expect(resForeign.success).toBe(false);
    expect(commitRes1.success).toBe(true);
    expect(commitRes1.committedRows).toBe(1);
    expect(commitRes2.success).toBe(true);
    expect(commitRes2.executedAt).toBe(commitRes1.executedAt);
  });

  // -------------------------------------------------------------------------
  // 10. End-to-End File-to-Review (No Firestore writes before commit)
  // -------------------------------------------------------------------------
  it('TC-10-E2E-PIPELINE-NO-PRE-WRITES: التشغيل الشامل عبر ExcelCsvPipelineService حتى مرحلة REVIEW دون كتابة مسبقة في قاعدة البيانات', async () => {
    const rawCsv =
      'رقم التذكرة,رقم اللوحة,الناقل,المادة,تاريخ,فارغ,قائم\n' +
      'TKT-E2E-01,1010-أ ب ج,الشركة الشرقية للنقل,AGG-01,2026-09-11,15000,42000\n' +
      'TKT-E2E-02,2020-د هـ و,مؤسسة الرمال السريعة,AGG-01,2026-09-11,14000,41000\n';

    const batch = await ExcelCsvPipelineService.processFileToReview(
      rawCsv,
      'daily_scale_dispatch.csv',
      rawCsv.length,
      'text/csv',
      baseContext
    );

    expect(batch.currentStage).toBe('REVIEW');
    expect(batch.totalRows).toBe(2);
    expect(batch.errorRows).toBe(0);
    expect(batch.rows[0].canonical.netWeight).toBe(27000);
    expect(batch.rows[1].canonical.netWeight).toBe(27000);
  });

  // -------------------------------------------------------------
  // 11. Net Weight Safety & Calculation Verification
  // -------------------------------------------------------------
  it('TC-11-NET-WEIGHT-SAFETY-AND-CALCULATION-CHECK: التحقق من سلامة الوزن الصافي: مطابقة الحساب، إطلاق تحذير غير مانع عند الاختلاف، والتوافق مع الميزان', () => {
    const validator = new ExcelCsvTripValidator();
    const context: PipelineContext = {
      projectId: 'proj_riyadh_metro',
      userId: 'usr_test',
      operationId: 'op_test_net_safety',
    };

    // Sub-case 1: net == gross - tare => NO warning
    const matchingRow: any = {
      rowNumber: 1,
      sourceRowId: 1,
      raw: { ticket: 'TKT-MATCH', gross: 42000, tare: 15000, net: 27000 },
      mapped: {
        ticketId: 'TKT-MATCH',
        truckNo: 'TRK-1111',
        grossWeight: 42000,
        tareWeight: 15000,
        netWeight: 27000,
        shiftDate: '2026-09-11',
      },
    };
    const issuesMatch = validator.validateRow(matchingRow, context);
    const hasMismatchIssue1 = issuesMatch.some((i) => i.code === 'NET_WEIGHT_CALCULATION_MISMATCH');

    // Sub-case 2: net differs => WARNING with metadata (actual, calculated, diff)
    const differingRow: any = {
      rowNumber: 2,
      sourceRowId: 2,
      raw: { ticket: 'TKT-DIFF', gross: 42000, tare: 15000, net: 26500 },
      mapped: {
        ticketId: 'TKT-DIFF',
        truckNo: 'TRK-2222',
        grossWeight: 42000,
        tareWeight: 15000,
        netWeight: 26500, // 500 kg difference from 27000
        shiftDate: '2026-09-11',
      },
    };
    const issuesDiff = validator.validateRow(differingRow, context);
    const diffIssue = issuesDiff.find((i) => i.code === 'NET_WEIGHT_CALCULATION_MISMATCH');
    const diffPassed =
      diffIssue !== undefined &&
      diffIssue.field === 'netWeight' &&
      diffIssue.severity === 'WARNING' &&
      diffIssue.blocking === false &&
      diffIssue.actualNetWeight === 26500 &&
      diffIssue.calculatedNetWeight === 27000 &&
      diffIssue.difference === 500;

    // Sub-case 3: Floating point tolerance (within 0.05 kg) => NO warning
    const floatRow: any = {
      rowNumber: 3,
      sourceRowId: 3,
      raw: { ticket: 'TKT-FLOAT', gross: 42000.08, tare: 15000.05, net: 27000.05 },
      mapped: {
        ticketId: 'TKT-FLOAT',
        truckNo: 'TRK-3333',
        grossWeight: 42000.08,
        tareWeight: 15000.05,
        netWeight: 27000.05, // difference is 0.02 <= 0.05 kg tolerance
        shiftDate: '2026-09-11',
      },
    };
    const issuesFloat = validator.validateRow(floatRow, context);
    const hasMismatchIssueFloat = issuesFloat.some((i) => i.code === 'NET_WEIGHT_CALCULATION_MISMATCH');

    // Sub-case 4: Missing net => calculate net only when missing; preserve existing net
    const normalizer = new ExcelCsvNormalizer();
    const missingNetNorm = normalizer.normalize(
      { ticket: 'TKT-MISSING-NET', gross: 35000, tare: 12000 },
      4,
      context
    );
    const providedNetNorm = normalizer.normalize(
      { ticket: 'TKT-PRESERVED-NET', gross: 35000, tare: 12000, net: 22800 },
      5,
      context
    );
    const calcOnlyWhenMissing =
      missingNetNorm.netWeight === 23000 &&
      providedNetNorm.netWeight === 22800; // Original net 22800 was NOT replaced!

    // Sub-case 5: Raw net preserved in raw input
    const rawNetPreserved = differingRow.raw.net === 26500;

    // Sub-case 6: Null unloading remains valid (weighbridge compatible, no fake variance)
    const weighbridgeRow: any = {
      rowNumber: 6,
      sourceRowId: 6,
      raw: { ticket: 'TKT-WB', gross: 40000, tare: 14000, net: 26000 },
      mapped: {
        ticketId: 'TKT-WB',
        truckNo: 'TRK-4444',
        grossWeight: 40000,
        tareWeight: 14000,
        netWeight: 26000,
        shiftDate: '2026-09-11',
        destNetWeight: undefined,
      },
    };
    const issuesWb = validator.validateRow(weighbridgeRow, context);
    const hasBlockingInWb = issuesWb.some((i) => i.blocking);
    const hasUnloadWarning = issuesWb.some(
      (i) => i.code === 'MISSING_UNLOAD_DATA' && i.severity === 'WARNING' && !i.blocking
    );
    const nullUnloadValid = !hasBlockingInWb && hasUnloadWarning;

    expect(hasMismatchIssue1).toBe(false);
    expect(diffPassed).toBe(true);
    expect(hasMismatchIssueFloat).toBe(false);
    expect(calcOnlyWhenMissing).toBe(true);
    expect(rawNetPreserved).toBe(true);
    expect(nullUnloadValid).toBe(true);
  });
});
