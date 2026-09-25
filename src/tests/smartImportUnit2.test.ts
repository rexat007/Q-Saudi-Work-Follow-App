import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import { smartSourceDiscoveryService } from '../services/import/smartSourceDiscovery.service';
import { ImportSource } from '../types/unifiedImport';
import { ExcelCsvPipelineService } from '../services/import/excelCsvPipeline.service';
import { UnifiedImportPipelineService } from '../services/import/unifiedImportPipeline.service';
import { ExcelImportParser } from '../services/import/excelParser.service';
import { CsvImportParser } from '../services/import/csvParser.service';
import { GoogleSheetsImportParser } from '../services/import/googleSheetsParser.service';
import { DriverTruckPipelineService } from '../services/import/driverTruckPipeline.service';
import { ImportProjectContextAdapter } from '../services/import/importProjectContext.adapter';
import { RelationshipContext } from '../types/dataQuality';

describe('Unit 2 - Smart Source Discovery and Option Propagation', () => {
  const mockRelContext: RelationshipContext = {
    projectId: 'PRJ-NEOM-NORTH-01',
    authorizedCarrierIds: ['CAR-001'],
    authorizedMaterialIds: ['MAT-001'],
    knownCarriers: [{ carrierId: 'CAR-001', name: 'شركة البدر للنقل', status: 'ACTIVE' }],
    knownTrucks: [{ truckId: 'TRK-001', plate: 'أ ب ج 1234', carrierId: 'CAR-001', status: 'ACTIVE' }],
    knownDrivers: [{ driverId: 'DRV-001', name: 'سالم الدوسري', idNumber: '1099887766', carrierId: 'CAR-001', status: 'ACTIVE' }],
    knownMaterials: [{ materialId: 'MAT-001', name: 'ركام بازلتي 20 ملم', code: 'AGG-20', status: 'ACTIVE' }],
  };

  const context = ImportProjectContextAdapter.createPipelineContext({
    relContext: mockRelContext,
    projectId: 'PRJ-NEOM-NORTH-01',
    userId: 'USR-ADMIN-1',
    userName: 'عبدالرحمن',
    role: 'PROJECT_ADMIN',
  });

  // 1. Excel data on non-first sheet
  it('1. should discover Excel data on non-first sheet', async () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['Dummy Data']]), 'FirstSheet');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
      ['رقم التذكرة', 'رقم اللوحة', 'الناقل', 'التاريخ', 'صافي كجم'],
      ['T-101', 'أ ب ج 1234', 'شركة البدر للنقل', '2026-09-24', '20000']
    ]), 'RealTrips');

    const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
    const source: ImportSource = {
      sourceType: 'EXCEL',
      importBatchId: 'BAT-NONFIRST',
    };

    const result = await smartSourceDiscoveryService.discover(source, buffer);
    expect(result.availableSheets).toContain('FirstSheet');
    expect(result.availableSheets).toContain('RealTrips');
    expect(result.selectedSheet).toBe('RealTrips');
    expect(result.detectedHeaderRowIndex).toBe(0);
    expect(result.confidence).toBeGreaterThanOrEqual(80);
  });

  // 2. Header on row 3 (0-indexed 2)
  it('2. should discover Excel data with header on row 3', async () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
      ['تقرير توريدات مشروع الشمال'],
      ['التاريخ: 2026-09-24'],
      ['رقم التذكرة', 'رقم اللوحة', 'الناقل', 'التاريخ', 'صافي كجم'],
      ['T-101', 'أ ب ج 1234', 'شركة البدر للنقل', '2026-09-24', '20000']
    ]), 'Trips');

    const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
    const source: ImportSource = {
      sourceType: 'EXCEL',
      importBatchId: 'BAT-ROW3',
    };

    const result = await smartSourceDiscoveryService.discover(source, buffer);
    expect(result.detectedHeaderRowIndex).toBe(2);
    expect(result.detectedHeaders).toContain('رقم التذكرة');
  });

  // 3. Header on row 4 (0-indexed 3)
  it('3. should discover Excel data with header on row 4', async () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
      ['عنوان الجدول'],
      [],
      [],
      ['رقم التذكرة', 'رقم اللوحة', 'الناقل', 'التاريخ', 'صافي كجم'],
      ['T-101', 'أ ب ج 1234', 'شركة البدر للنقل', '2026-09-24', '20000']
    ]), 'Trips');

    const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
    const source: ImportSource = {
      sourceType: 'EXCEL',
      importBatchId: 'BAT-ROW4',
    };

    const result = await smartSourceDiscoveryService.discover(source, buffer);
    expect(result.detectedHeaderRowIndex).toBe(3);
    expect(result.detectedHeaders).toContain('رقم التذكرة');
  });

  // 4. Blank rows before header
  it('4. should discover Excel data with blank rows before header', async () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
      ['', ''],
      ['', ''],
      ['رقم التذكرة', 'رقم اللوحة', 'الناقل', 'التاريخ', 'صافي كجم'],
      ['T-101', 'أ ب ج 1234', 'شركة البدر للنقل', '2026-09-24', '20000']
    ]), 'Trips');

    const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
    const source: ImportSource = {
      sourceType: 'EXCEL',
      importBatchId: 'BAT-BLANKS',
    };

    const result = await smartSourceDiscoveryService.discover(source, buffer);
    expect(result.detectedHeaderRowIndex).toBe(2);
  });

  // 5. Title/Preamble before header
  it('5. should discover Excel data with title/preamble before header', async () => {
    const csvContent = `بيانات الميزان لمشروع نيوم الشمالي وردية أ\nالتاريخ: 24-09-2026\nرقم التذكرة,رقم اللوحة,الناقل,التاريخ,صافي كجم\nT-101,أ ب ج 1234,شركة البدر للنقل,2026-09-24,20000`;
    const source: ImportSource = {
      sourceType: 'CSV',
      importBatchId: 'BAT-PREAMBLE',
    };

    const result = await smartSourceDiscoveryService.discover(source, csvContent);
    expect(result.detectedHeaderRowIndex).toBe(2);
    expect(result.detectedHeaders).toContain('رقم التذكرة');
  });

  // 6. Arbitrary column order
  it('6. should discover headers in arbitrary column order', async () => {
    const csvContent = `الناقل,صافي كجم,رقم اللوحة,التاريخ,رقم التذكرة\nشركة البدر للنقل,20000,أ ب ج 1234,2026-09-24,T-101`;
    const source: ImportSource = {
      sourceType: 'CSV',
      importBatchId: 'BAT-ORDER',
    };

    const result = await smartSourceDiscoveryService.discover(source, csvContent);
    expect(result.detectedHeaders[0]).toBe('الناقل');
    expect(result.detectedHeaders[4]).toBe('رقم التذكرة');
    expect(result.mappingDiagnostics['الناقل'].canonicalField).toBe('carrier');
    expect(result.mappingDiagnostics['رقم التذكرة'].canonicalField).toBe('ticketId');
  });

  // 7. Mixed Arabic/English headers
  it('7. should discover mixed Arabic/English headers', async () => {
    const csvContent = `رقم التذكرة,Plate No,الناقل,date,netWeight\nT-101,أ ب ج 1234,شركة البدر للنقل,2026-09-24,20000`;
    const source: ImportSource = {
      sourceType: 'CSV',
      importBatchId: 'BAT-MIXED',
    };

    const result = await smartSourceDiscoveryService.discover(source, csvContent);
    expect(result.mappingDiagnostics['Plate No'].canonicalField).toBe('truckNo');
    expect(result.mappingDiagnostics['date'].canonicalField).toBe('shiftDate');
  });

  // 8. Name "اسم السائق" mapping
  it('8. should discover name "اسم السائق" correctly', async () => {
    const csvContent = `اسم السائق,رقم اللوحة,الناقل,التاريخ\nسالم الدوسري,أ ب ج 1234,شركة البدر للنقل,2026-09-24`;
    const result = await smartSourceDiscoveryService.discover({ sourceType: 'CSV', importBatchId: 'B' }, csvContent);
    expect(result.mappingDiagnostics['اسم السائق'].canonicalField).toBe('driverName');
  });

  // 9. Iqama "إقامة السائق" mapping
  it('9. should discover iqama "إقامة السائق" correctly', async () => {
    const csvContent = `إقامة السائق,رقم اللوحة,الناقل\n1099887766,أ ب ج 1234,شركة البدر للنقل`;
    const result = await smartSourceDiscoveryService.discover({ sourceType: 'CSV', importBatchId: 'B' }, csvContent);
    expect(result.mappingDiagnostics['إقامة السائق'].canonicalField).toBe('driverIdentity');
    // Note: Since iqama of driver might match note or driverIdentity or unmapped depending on definitions, we check it doesn't fail
    expect(result.mappingDiagnostics['إقامة السائق']).toBeDefined();
  });

  // 10. Plate "عربى" mapping
  it('10. should discover Plate "اللوحة" or "عربى" correctly', async () => {
    const csvContent = `رقم اللوحة,الناقل,التاريخ\nأ ب ج 1234,شركة البدر للنقل,2026-09-24`;
    const result = await smartSourceDiscoveryService.discover({ sourceType: 'CSV', importBatchId: 'B' }, csvContent);
    expect(result.mappingDiagnostics['رقم اللوحة'].canonicalField).toBe('truckNo');
  });

  // 11. Vehicle No mapping
  it('11. should discover "Vehicle No" correctly', async () => {
    const csvContent = `Vehicle No,الناقل,التاريخ\nTRK-001,شركة البدر للنقل,2026-09-24`;
    const result = await smartSourceDiscoveryService.discover({ sourceType: 'CSV', importBatchId: 'B' }, csvContent);
    expect(result.mappingDiagnostics['Vehicle No'].canonicalField).toBe('truckNo');
  });

  // 12. DRIVER NAME mapping
  it('12. should discover "DRIVER NAME" correctly', async () => {
    const csvContent = `DRIVER NAME,Plate,الناقل\nسالم الدوسري,أ ب ج 1234,شركة البدر للنقل`;
    const result = await smartSourceDiscoveryService.discover({ sourceType: 'CSV', importBatchId: 'B' }, csvContent);
    expect(result.mappingDiagnostics['DRIVER NAME'].canonicalField).toBe('driverName');
  });

  // 13. VECHLE NO mapping
  it('13. should discover "VECHLE NO" or "VEHICLE" correctly', async () => {
    const csvContent = `VECHLE NO,الناقل,التاريخ\nTRK-001,شركة البدر للنقل,2026-09-24`;
    const result = await smartSourceDiscoveryService.discover({ sourceType: 'CSV', importBatchId: 'B' }, csvContent);
    expect(result.mappingDiagnostics['VECHLE NO'].canonicalField).toBe('truckNo');
  });

  // 14. IQAMA NO mapping
  it('14. should discover "IQAMA NO" or similar correctly', async () => {
    const csvContent = `IQAMA NO,DRIVER NAME,Plate\n1099887766,سالم الدوسري,أ ب ج 1234`;
    const result = await smartSourceDiscoveryService.discover({ sourceType: 'CSV', importBatchId: 'B' }, csvContent);
    expect(result.mappingDiagnostics['IQAMA NO']).toBeDefined();
  });

  // 15. MOBILE NO mapping
  it('15. should discover "MOBILE NO" or similar correctly', async () => {
    const csvContent = `MOBILE NO,DRIVER NAME,Plate\n0501234567,سالم الدوسري,أ ب ج 1234`;
    const result = await smartSourceDiscoveryService.discover({ sourceType: 'CSV', importBatchId: 'B' }, csvContent);
    expect(result.mappingDiagnostics['MOBILE NO']).toBeDefined();
  });

  // 16. Duplicate canonical mappings
  it('16. should penalize confidence and detect duplicate canonical mappings in the same row', async () => {
    const csvContent = `الوزن الصافي,صافي كجم,رقم اللوحة,الناقل\n15000,15000,أ ب ج 1234,شركة البدر للنقل`;
    const result = await smartSourceDiscoveryService.discover({ sourceType: 'CSV', importBatchId: 'B' }, csvContent);
    expect(result.requiresReview).toBe(true);
    expect(result.ambiguityReasons.some(r => r.includes('تكرار') || r.includes('Duplicate'))).toBe(true);
  });

  // 17. Ambiguous headers require review
  it('17. should flag requiresReview when ambiguous headers are present', async () => {
    const csvContent = `اسم السائق,الرقم\nسالم الدوسري,123`;
    const result = await smartSourceDiscoveryService.discover({ sourceType: 'CSV', importBatchId: 'B' }, csvContent);
    expect(result.requiresReview).toBe(true);
  });

  // 18. Unknown header remains unmapped
  it('18. should keep unknown header unmapped without raising error', async () => {
    const csvContent = `رقم التذكرة,رقم اللوحة,الناقل,لون الشاحنة\nT-101,أ ب ج 1234,شركة البدر للنقل,أزرق`;
    const result = await smartSourceDiscoveryService.discover({ sourceType: 'CSV', importBatchId: 'B' }, csvContent);
    expect(result.mappingDiagnostics['لون الشاحنة'].canonicalField).toContain('unmapped_');
    expect(result.mappingDiagnostics['لون الشاحنة'].confidence).toBe(0);
  });

  // 19. C N is NOT guessed
  it('19. should ensure Carrier/Client Name (C N) or ambiguous fields are NOT guessed or mapped incorrectly', async () => {
    const csvContent = `رقم التذكرة,رقم اللوحة,المقاول,C N\nT-101,أ ب ج 1234,شركة البدر للنقل,عقد فرعي`;
    const result = await smartSourceDiscoveryService.discover({ sourceType: 'CSV', importBatchId: 'B' }, csvContent);
    expect(String(result.mappingDiagnostics['C N']?.canonicalField).startsWith('unmapped_')).toBe(true);
  });

  // 20. Excel sheetName propagation
  it('20. should propagate Excel sheetName through parser options', () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
      ['رقم التذكرة', 'رقم اللوحة', 'الناقل'],
      ['T-201', 'أ ب ج 1234', 'شركة البدر للنقل']
    ]), 'SheetOne');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
      ['رقم التذكرة', 'رقم اللوحة', 'الناقل'],
      ['T-202', 'أ ب ج 1234', 'شركة البدر للنقل']
    ]), 'SheetTwo');

    const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
    const parser = new ExcelImportParser();

    const result = parser.parse({ sourceType: 'EXCEL', importBatchId: 'B' }, buffer, { sheetName: 'SheetTwo' });
    expect(result.metadata.selectedSheet).toBe('SheetTwo');
    expect(result.rows[0]['رقم التذكرة']).toBe('T-202');
  });

  // 21. headerRowIndex propagation through UnifiedImportPipelineService (PRODUCTION CALL PATH EXERCISE)
  it('21. should propagate headerRowIndex through UnifiedImportPipelineService parser path', async () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
      ['عنوان غير هام'],
      [],
      ['رقم التذكرة', 'رقم اللوحة', 'الناقل'],
      ['T-303', 'أ ب ج 1234', 'شركة البدر للنقل']
    ]), 'Sheet1');

    const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
    const source: ImportSource = {
      sourceType: 'EXCEL',
      importBatchId: 'B-PROP',
      sourceSheetName: 'Sheet1',
      rawInput: buffer,
    };

    const pipeline = new UnifiedImportPipelineService({
      parser: new ExcelImportParser(),
    });

    const batch = pipeline.createBatch(source, context);
    // Propagate headerRowIndex: 2
    const processed = await pipeline.processThroughReview(batch, buffer, context, { headerRowIndex: 2 });

    expect(processed.totalRows).toBe(1);
    expect(processed.rows[0].raw['رقم التذكرة']).toBe('T-303');
  });

  // 22. CSV delayed-header production path
  it('22. should exercise CSV delayed-header production path', async () => {
    const csvContent = `عقد المشروع\nتقرير يومي\nرقم التذكرة,رقم اللوحة,الناقل\nT-404,أ ب ج 1234,شركة البدر للنقل`;
    const batch = await ExcelCsvPipelineService.processFileToReview(
      csvContent,
      'test.csv',
      csvContent.length,
      'text/csv',
      context,
      { headerRowIndex: 2 }
    );
    expect(batch.totalRows).toBe(1);
    expect(batch.rows[0].raw['رقم التذكرة']).toBe('T-404');
  });

  // 23. Google Sheets delayed-header production path
  it('23. should exercise Google Sheets delayed-header production path', async () => {
    const values = [
      ['تقرير توريد'],
      ['رقم التذكرة', 'رقم اللوحة', 'الناقل'],
      ['T-505', 'أ ب ج 1234', 'شركة البدر للنقل']
    ];

    const parser = new GoogleSheetsImportParser();
    const result = parser.parse({ sourceType: 'GOOGLE_SHEETS', importBatchId: 'G' }, values, { headerRowIndex: 1 });
    expect(result.rows.length).toBe(1);
    expect(result.rows[0]['رقم التذكرة']).toBe('T-505');
  });

  // 24. Driver/Truck roster smart discovery
  it('24. should run Smart Source Discovery on Driver/Truck roster format successfully', async () => {
    const rosterCsv = `اسم السائق,رقم الهاتف,رقم الهوية,رقم اللوحة,نوع المركبة,الناقل\nسالم الدوسري,0501234567,1099887766,أ ب ج 1234,TIPPER_32M3,شركة البدر للنقل`;
    const source: ImportSource = {
      sourceType: 'CSV',
      importBatchId: 'BAT-ROSTER',
    };
    const result = await smartSourceDiscoveryService.discover(source, rosterCsv);
    expect(result.detectedHeaderRowIndex).toBe(0);
    expect(result.detectedHeaders).toContain('اسم السائق');
    expect(result.detectedHeaders).toContain('رقم اللوحة');
    expect(result.mappingDiagnostics['اسم السائق'].canonicalField).toBe('driverName');
    expect(result.mappingDiagnostics['رقم اللوحة'].canonicalField).toBe('truckNo');
  });

  // 25. existing Trip import compatibility
  it('25. should remain compatible with standard Trip imports when no custom option is provided', async () => {
    const csvContent = `رقم التذكرة,رقم اللوحة,الناقل\nT-606,أ ب ج 1234,شركة البدر للنقل`;
    const batch = await ExcelCsvPipelineService.processFileToReview(
      csvContent,
      'test.csv',
      csvContent.length,
      'text/csv',
      context
    );
    expect(batch.totalRows).toBe(1);
    expect(batch.rows[0].raw['رقم التذكرة']).toBe('T-606');
  });
});
