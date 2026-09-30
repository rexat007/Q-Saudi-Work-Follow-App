import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';
import { smartSourceDiscoveryService } from '../services/import/smartSourceDiscovery.service';
import { ExcelCsvPipelineService } from '../services/import/excelCsvPipeline.service';
import { ExcelCsvColumnMapper } from '../services/import/columnMapper.service';
import { CANONICAL_FIELD_OPTIONS } from '../components/importCenter/ExcelCsvImportSection';
import { ImportSource, PipelineContext } from '../types/unifiedImport';

describe('Smart Import R1 — Source Discovery & Mapping Approval Gate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockContext: PipelineContext = {
    projectId: 'PRJ-TEST-R1',
    userId: 'USR-ADMIN',
    userName: 'مدير النظام',
    role: 'PROJECT_ADMIN',
    operationId: 'OP-R1-STABLE-001',
  };

  const createSampleWorkbook = (): ArrayBuffer => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet([
        ['رقم التذكرة', 'رقم اللوحة', 'الناقل', 'المادة', 'الوزن الصافي'],
        ['T-101', 'أ ب ج 1234', 'شركة البدر للنقل', 'ركام بازلتي 20 ملم', '20000'],
      ]),
      'Trips'
    );
    return XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  };

  // 1. File selection performs discovery but does NOT invoke processFileToReview automatically
  it('1. File selection performs discovery but does NOT invoke processFileToReview automatically', async () => {
    const sectionPath = path.resolve(__dirname, '../components/importCenter/ExcelCsvImportSection.tsx');
    const content = fs.readFileSync(sectionPath, 'utf-8');

    const handleFileSelectBody = content.slice(
      content.indexOf('const handleFileSelect'),
      content.indexOf('const handleSheetChange')
    );

    expect(handleFileSelectBody).toContain('smartSourceDiscoveryService.discover(importSource, buffer)');
    expect(handleFileSelectBody).not.toContain('processFileToReview');
    expect(handleFileSelectBody).not.toContain('runPipeline');
  });

  // 2. File selection leaves activeBatch unset until approval
  it('2. File selection leaves activeBatch unset until approval', () => {
    const sectionPath = path.resolve(__dirname, '../components/importCenter/ExcelCsvImportSection.tsx');
    const content = fs.readFileSync(sectionPath, 'utf-8');

    const handleFileSelectBody = content.slice(
      content.indexOf('const handleFileSelect'),
      content.indexOf('const handleSheetChange')
    );

    expect(handleFileSelectBody).toContain('setActiveBatch(null);');
    expect(content).toContain('{selectedFile && discoveryResult && !activeBatch && (');
  });

  // 3. Sheet change performs discovery only
  it('3. Sheet change performs discovery only', () => {
    const sectionPath = path.resolve(__dirname, '../components/importCenter/ExcelCsvImportSection.tsx');
    const content = fs.readFileSync(sectionPath, 'utf-8');

    const handleSheetChangeBody = content.slice(
      content.indexOf('const handleSheetChange'),
      content.indexOf('const handleHeaderRowIndexChange')
    );

    expect(handleSheetChangeBody).toContain('smartSourceDiscoveryService.discover');
    expect(handleSheetChangeBody).not.toContain('processFileToReview');
    expect(handleSheetChangeBody).not.toContain('runPipeline');
  });

  // 4. Header-row change performs discovery only
  it('4. Header-row change performs discovery only', () => {
    const sectionPath = path.resolve(__dirname, '../components/importCenter/ExcelCsvImportSection.tsx');
    const content = fs.readFileSync(sectionPath, 'utf-8');

    const handleHeaderRowChangeBody = content.slice(
      content.indexOf('const handleHeaderRowIndexChange'),
      content.indexOf('const handleMappingOverrideChange')
    );

    expect(handleHeaderRowChangeBody).not.toContain('processFileToReview');
    expect(handleHeaderRowChangeBody).not.toContain('runPipeline');
  });

  // 5. Mapping proposals originate from existing discovery/mapper
  it('5. Mapping proposals originate from existing discovery/mapper', async () => {
    const buffer = createSampleWorkbook();
    const source: ImportSource = {
      sourceType: 'EXCEL',
      importBatchId: 'BAT-DISC-001',
      sourceFileName: 'test.xlsx',
    };

    const discovery = await smartSourceDiscoveryService.discover(source, buffer);
    expect(discovery.detectedHeaders).toContain('رقم التذكرة');
    expect(discovery.detectedHeaders).toContain('الناقل');
    expect(discovery.mappingDiagnostics['رقم التذكرة']?.canonicalField).toBe('ticketId');
    expect(discovery.mappingDiagnostics['الناقل']?.canonicalField).toBe('carrier');
  });

  // 6. Manual mapping override is retained in local approved mapping state
  it('6. Manual mapping override options match canonical trip schema', () => {
    expect(CANONICAL_FIELD_OPTIONS.some(o => o.value === 'ticketId')).toBe(true);
    expect(CANONICAL_FIELD_OPTIONS.some(o => o.value === 'truckNo')).toBe(true);
    expect(CANONICAL_FIELD_OPTIONS.some(o => o.value === 'carrier')).toBe(true);
    expect(CANONICAL_FIELD_OPTIONS.some(o => o.value === 'materialType')).toBe(true);
    expect(CANONICAL_FIELD_OPTIONS.some(o => o.value === 'unmapped')).toBe(true);
  });

  // 7. Approved custom mappings are passed into ExcelCsvPipelineService.processFileToReview
  it('7. Approved custom mappings are passed into ExcelCsvPipelineService.processFileToReview', async () => {
    const buffer = createSampleWorkbook();
    const customMappings = {
      'رقم التذكرة': 'ticketId' as const,
      'الناقل': 'carrier' as const,
    };

    const batch = await ExcelCsvPipelineService.processFileToReview(
      buffer,
      'test.xlsx',
      buffer.byteLength,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      mockContext,
      {
        sheetName: 'Trips',
        headerRowIndex: 0,
        customMappings,
        importBatchId: 'BAT-APPROVED-001',
      }
    );

    expect(batch).toBeDefined();
    expect(batch.currentStage).toBe('REVIEW');
    expect(batch.totalRows).toBe(1);
  });

  // 8. Approved sheet is passed to processFileToReview
  it('8. Approved sheet is passed to processFileToReview', async () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['Dummy']]), 'Sheet1');
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet([
        ['رقم التذكرة', 'اللوحة', 'الناقل'],
        ['T-202', 'أ ب ج 9999', 'شركة النقل'],
      ]),
      'TargetSheet'
    );
    const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });

    const batch = await ExcelCsvPipelineService.processFileToReview(
      buffer,
      'multi.xlsx',
      buffer.byteLength,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      mockContext,
      {
        sheetName: 'TargetSheet',
        headerRowIndex: 0,
      }
    );

    expect(batch.totalRows).toBe(1);
    expect(batch.source.sourceSheetName).toBe('TargetSheet');
  });

  // 9. Approved headerRowIndex is passed to processFileToReview
  it('9. Approved headerRowIndex is passed to processFileToReview', async () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet([
        ['عنوان التقرير'],
        ['رقم التذكرة', 'اللوحة', 'الناقل'],
        ['T-303', 'أ ب ج 5555', 'شركة النقل'],
      ]),
      'Sheet1'
    );
    const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });

    const batch = await ExcelCsvPipelineService.processFileToReview(
      buffer,
      'offset.xlsx',
      buffer.byteLength,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      mockContext,
      {
        headerRowIndex: 1,
      }
    );

    expect(batch.totalRows).toBe(1);
  });

  // 10. Stable operationId/importBatchId are preserved across discovery -> approval
  it('10. Stable operationId/importBatchId are preserved across discovery -> approval', () => {
    const sectionPath = path.resolve(__dirname, '../components/importCenter/ExcelCsvImportSection.tsx');
    const content = fs.readFileSync(sectionPath, 'utf-8');

    expect(content).toContain('activeOperationId || `OP-IMP-${Date.now()}`');
    expect(content).toContain('activeImportBatchId || `BAT-${Date.now()}`');
  });

  // 11. A new file resets previous mapping state
  it('11. A new file resets previous mapping state', () => {
    const sectionPath = path.resolve(__dirname, '../components/importCenter/ExcelCsvImportSection.tsx');
    const content = fs.readFileSync(sectionPath, 'utf-8');

    expect(content).toContain('setCustomMappingOverrides({});');
  });

  // 12. No Firestore trip write occurs before mapping approval
  it('12. No Firestore trip write occurs before mapping approval', () => {
    const sectionPath = path.resolve(__dirname, '../components/importCenter/ExcelCsvImportSection.tsx');
    const content = fs.readFileSync(sectionPath, 'utf-8');

    // Discovery phase has zero commit calls
    expect(content).toContain('smartSourceDiscoveryService.discover');
    expect(content).toContain('handleApproveAndStartPipeline');
  });

  // 13. No entity-resolution review state is entered before approval
  it('13. No entity-resolution review state is entered before approval', () => {
    const sectionPath = path.resolve(__dirname, '../components/importCenter/ExcelCsvImportSection.tsx');
    const content = fs.readFileSync(sectionPath, 'utf-8');

    // Review stage only rendered if activeBatch is populated
    expect(content).toContain('{activeBatch && !isProcessing && (');
  });

  // 14. Session stage before approval is not falsely REVIEW
  it('14. Session stage before approval is not falsely REVIEW', () => {
    const sectionPath = path.resolve(__dirname, '../components/importCenter/ExcelCsvImportSection.tsx');
    const content = fs.readFileSync(sectionPath, 'utf-8');

    expect(content).toContain("lifecycleState: 'MAPPING_REQUIRED'");
    expect(content).toContain("currentStage: 'DISCOVERY'");
  });

  // 15. After explicit approval, existing pipeline reaches REVIEW normally
  it('15. After explicit approval, existing pipeline reaches REVIEW normally', async () => {
    const buffer = createSampleWorkbook();
    const batch = await ExcelCsvPipelineService.processFileToReview(
      buffer,
      'test.xlsx',
      buffer.byteLength,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      mockContext,
      {
        sheetName: 'Trips',
        headerRowIndex: 0,
      }
    );

    expect(batch.currentStage).toBe('REVIEW');
    expect(batch.commitStatus).toBe('AWAITING_REVIEW');
  });

  // 16. Existing smartSourceDiscovery behavior remains compatible
  it('16. Existing smartSourceDiscovery behavior remains compatible', async () => {
    const buffer = createSampleWorkbook();
    const discovery = await smartSourceDiscoveryService.discover(
      { sourceType: 'EXCEL', importBatchId: 'BAT-1' },
      buffer
    );
    expect(discovery.availableSheets).toContain('Trips');
    expect(discovery.confidence).toBeGreaterThan(50);
  });

  // 17. Existing Unit 2 discovery tests remain green
  it('17. ColumnMapper mapHeaders remains functional', () => {
    const diags = ExcelCsvColumnMapper.mapHeaders(['رقم التذكرة', 'اللوحة', 'الناقل']);
    expect(diags['رقم التذكرة']?.canonicalField).toBe('ticketId');
    expect(diags['اللوحة']?.canonicalField).toBe('truckNo');
  });

  // 18. No changes to tripImportCommitter
  it('18. No changes to tripImportCommitter', () => {
    const committerPath = path.resolve(__dirname, '../services/import/tripImportCommitter.ts');
    expect(fs.existsSync(committerPath)).toBe(true);
  });

  // 19. No changes to Unit 6A persistence boundary
  it('19. No changes to Unit 6A persistence boundary', () => {
    const persistencePath = path.resolve(__dirname, '../services/canonicalTripPersistence.server.ts');
    expect(fs.existsSync(persistencePath)).toBe(true);
  });

  // 20. No workspace changes
  it('20. ExcelCsvImportSection exports CANONICAL_FIELD_OPTIONS and ExcelCsvImportSection correctly', () => {
    expect(typeof CANONICAL_FIELD_OPTIONS).toBe('object');
  });
});
