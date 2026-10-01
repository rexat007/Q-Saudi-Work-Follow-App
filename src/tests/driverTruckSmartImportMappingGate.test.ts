import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';
import { smartSourceDiscoveryService } from '../services/import/smartSourceDiscovery.service';
import { 
  DriverTruckPipelineService, 
  ProcessDriverTruckFileOptions 
} from '../services/import/driverTruckPipeline.service';
import { 
  DriverTruckImportNormalizer, 
  DriverTruckCanonicalMappingTarget, 
  ROSTER_CANONICAL_FIELD_OPTIONS, 
  translateDiscoveryToRosterTarget,
  DriverTruckImportEntityResolver
} from '../services/import/driverTruckImport';
import { ExcelCsvColumnMapper } from '../services/import/columnMapper.service';
import { ImportSource, PipelineContext } from '../types/unifiedImport';

describe('Unit DT-01 — Driver/Truck Smart Import: Source Discovery & Explicit Mapping Approval Gate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockPipelineContext: PipelineContext = {
    projectId: 'PRJ-DT01-TEST',
    userId: 'USR-ADMIN-DT01',
    userName: 'مشرف النظام',
    role: 'PROJECT_ADMIN',
    operationId: 'OP-DT01-TEST-001',
    knownEntities: {
      carriers: [
        { carrierId: 'CAR-101', name: 'شركة اليمامة للمقاولات' },
        { carrierId: 'CAR-102', name: 'الناقل العام المتحد' }
      ],
      materials: [
        { materialId: 'MAT-201', name: 'ركام بازلتي 20 ملم', code: 'AGG-20' },
        { materialId: 'MAT-202', name: 'رمل أحمر مغسول', code: 'SAND-RED' }
      ],
      drivers: [
        { driverId: 'DRV-301', name: 'سالم الشمري', idNumber: '1088776655', carrierId: 'CAR-101' }
      ],
      trucks: [
        { truckId: 'TRK-401', plate: 'أ ب ج 1234', carrierId: 'CAR-101' }
      ]
    }
  };

  const createSampleRosterWorkbook = (): ArrayBuffer => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet([
        ['اسم السائق', 'رقم الجوال', 'رقم الهوية', 'رقم اللوحة', 'نوع الشاحنة', 'الناقل', 'المادة'],
        ['سالم الشمري', '0501234567', '1088776655', 'أ ب ج 1234', 'TIPPER_32M3', 'شركة اليمامة للمقاولات', 'ركام بازلتي 20 ملم']
      ]),
      'RosterList'
    );
    return XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  };

  const wizardPath = path.resolve(__dirname, '../components/wizard/ProjectSetupWizard.tsx');
  const wizardContent = fs.readFileSync(wizardPath, 'utf-8');

  // 1. roster file upload performs discovery
  it('1. roster file upload performs discovery', () => {
    const processRosterBody = wizardContent.slice(
      wizardContent.indexOf('const processRosterFile'),
      wizardContent.indexOf('const handleRosterSheetChange')
    );
    expect(processRosterBody).toContain('smartSourceDiscoveryService.discover(discSource, data)');
  });

  // 2. upload does not immediately create importBatch review
  it('2. upload does not immediately create importBatch review', () => {
    const processRosterBody = wizardContent.slice(
      wizardContent.indexOf('const processRosterFile'),
      wizardContent.indexOf('const handleRosterSheetChange')
    );
    expect(processRosterBody).toContain('setImportBatch(null);');
    expect(processRosterBody).not.toContain('DriverTruckPipelineService.processFileToReview');
  });

  // 3. source headers are represented in mapping state
  it('3. source headers are represented in mapping state', async () => {
    const buffer = createSampleRosterWorkbook();
    const source: ImportSource = {
      sourceType: 'EXCEL',
      importBatchId: 'BAT-DISC-001',
      sourceFileName: 'roster.xlsx',
    };
    const discovery = await smartSourceDiscoveryService.discover(source, buffer);
    expect(discovery.detectedHeaders).toContain('اسم السائق');
    expect(discovery.detectedHeaders).toContain('رقم الجوال');
    expect(discovery.detectedHeaders).toContain('رقم الهوية');
    expect(discovery.detectedHeaders).toContain('رقم اللوحة');
  });

  // 4. DRIVER NAME proposal → driverName
  it('4. DRIVER NAME proposal → driverName', () => {
    const diags = ExcelCsvColumnMapper.mapHeaders(['DRIVER NAME']);
    const target = translateDiscoveryToRosterTarget(diags['DRIVER NAME']?.canonicalField);
    expect(target).toBe('driverName');
  });

  // 5. Arabic driver-name proposal → driverName
  it('5. Arabic driver-name proposal → driverName', () => {
    const diags = ExcelCsvColumnMapper.mapHeaders(['اسم السائق']);
    const target = translateDiscoveryToRosterTarget(diags['اسم السائق']?.canonicalField);
    expect(target).toBe('driverName');
  });

  // 6. IQAMA NO → driverIdentity
  it('6. IQAMA NO → driverIdentity', () => {
    const diags = ExcelCsvColumnMapper.mapHeaders(['IQAMA NO']);
    const target = translateDiscoveryToRosterTarget(diags['IQAMA NO']?.canonicalField);
    expect(target).toBe('driverIdentity');
  });

  // 7. Arabic iqama/residency header → driverIdentity
  it('7. Arabic iqama/residency header → driverIdentity', () => {
    const diags = ExcelCsvColumnMapper.mapHeaders(['إقامة السائق']);
    const target = translateDiscoveryToRosterTarget(diags['إقامة السائق']?.canonicalField);
    expect(target).toBe('driverIdentity');
  });

  // 8. MOBILE NO → driverPhone
  it('8. MOBILE NO → driverPhone', () => {
    const diags = ExcelCsvColumnMapper.mapHeaders(['MOBILE NO']);
    const target = translateDiscoveryToRosterTarget(diags['MOBILE NO']?.canonicalField);
    expect(target).toBe('driverPhone');
  });

  // 9. Vehicle No → truckPlate
  it('9. Vehicle No → truckPlate', () => {
    const diags = ExcelCsvColumnMapper.mapHeaders(['Vehicle No']);
    const target = translateDiscoveryToRosterTarget(diags['Vehicle No']?.canonicalField);
    expect(target).toBe('truckPlate');
  });

  // 10. VECHLE NO → truckPlate
  it('10. VECHLE NO → truckPlate', () => {
    const diags = ExcelCsvColumnMapper.mapHeaders(['VECHLE NO']);
    const target = translateDiscoveryToRosterTarget(diags['VECHLE NO']?.canonicalField);
    expect(target).toBe('truckPlate');
  });

  // 11. Arabic plate header → truckPlate
  it('11. Arabic plate header → truckPlate', () => {
    const diags = ExcelCsvColumnMapper.mapHeaders(['رقم اللوحة']);
    const target = translateDiscoveryToRosterTarget(diags['رقم اللوحة']?.canonicalField);
    expect(target).toBe('truckPlate');
  });

  // 12. carrier/transporter → carrierName
  it('12. carrier/transporter → carrierName', () => {
    const diags = ExcelCsvColumnMapper.mapHeaders(['الناقل']);
    const target = translateDiscoveryToRosterTarget(diags['الناقل']?.canonicalField);
    expect(target).toBe('carrierName');
  });

  // 13. material → materialName
  it('13. material → materialName', () => {
    const diags = ExcelCsvColumnMapper.mapHeaders(['المادة']);
    const target = translateDiscoveryToRosterTarget(diags['المادة']?.canonicalField);
    expect(target).toBe('materialName');
  });

  // 14. unknown column → unmapped
  it('14. unknown column → unmapped', () => {
    const diags = ExcelCsvColumnMapper.mapHeaders(['لون الشاحنة غير المعروف']);
    const target = translateDiscoveryToRosterTarget(diags['لون الشاحنة غير المعروف']?.canonicalField);
    expect(target).toBe('unmapped');
  });

  // 15. manual override is supported
  it('15. manual override is supported', () => {
    const normalizer = new DriverTruckImportNormalizer({
      'العمود الخاص': 'driverName',
    });
    const raw = { 'العمود الخاص': 'محمد العتيبي' };
    const canonical = normalizer.normalize(raw, 1);
    expect(canonical.driverName).toBe('محمد العتيبي');
  });

  // 16. explicit unmapped is supported
  it('16. explicit unmapped is supported', () => {
    const normalizer = new DriverTruckImportNormalizer({
      'اسم السائق': 'unmapped' as any,
    });
    const raw = { 'اسم السائق': 'محمد العتيبي' };
    const canonical = normalizer.normalize(raw, 1);
    expect(canonical.driverName).toBe('');
  });

  // 17. custom mapping wins over automatic mapping
  it('17. custom mapping wins over automatic mapping', () => {
    // Header is normally carrier, but human mapped it to driverName
    const normalizer = new DriverTruckImportNormalizer({
      'الناقل': 'driverName',
    });
    const raw = { 'الناقل': 'سالم فهد' };
    const canonical = normalizer.normalize(raw, 1);
    expect(canonical.driverName).toBe('سالم فهد');
    expect(canonical.carrierName).toBe('');
  });

  // 18. customMappings are typed and accepted by ProcessDriverTruckFileOptions
  it('18. customMappings are typed and accepted by ProcessDriverTruckFileOptions', () => {
    const options: ProcessDriverTruckFileOptions = {
      sheetName: 'RosterList',
      headerRowIndex: 0,
      customMappings: {
        'رقم اللوحة': 'truckPlate',
        'اسم السائق': 'driverName',
      },
    };
    expect(options.customMappings?.['رقم اللوحة']).toBe('truckPlate');
  });

  // 19. pipeline propagates customMappings to normalizer
  it('19. pipeline propagates customMappings to normalizer', async () => {
    const buffer = createSampleRosterWorkbook();
    const batch = await DriverTruckPipelineService.processFileToReview(
      buffer,
      'roster.xlsx',
      buffer.byteLength,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      mockPipelineContext,
      {
        sheetName: 'RosterList',
        headerRowIndex: 0,
        customMappings: {
          'اسم السائق': 'driverName',
          'رقم اللوحة': 'truckPlate',
          'الناقل': 'carrierName',
        },
      }
    );
    expect(batch.rows.length).toBe(1);
    expect(batch.rows[0].canonical?.driverName).toBe('سالم الشمري');
    expect(batch.rows[0].canonical?.truckPlate).toBe('ا ب ج 1234');
  });

  // 20. normalizer honors custom mapping
  it('20. normalizer honors custom mapping', () => {
    const normalizer = new DriverTruckImportNormalizer({
      'رقم الجوال السري': 'driverPhone',
      'لوحة المركبة الخاصة': 'truckPlate',
    });
    const raw = {
      'رقم الجوال السري': '0551122334',
      'لوحة المركبة الخاصة': 'د ه و 9999',
    };
    const canonical = normalizer.normalize(raw, 1);
    expect(canonical.driverPhone).toBe('0551122334');
    expect(canonical.truckPlate).toBe('د ه و 9999');
  });

  // 21. original extra source column remains in _raw
  it('21. original extra source column remains in _raw', () => {
    const normalizer = new DriverTruckImportNormalizer({
      'اسم السائق': 'driverName',
    });
    const raw = {
      'اسم السائق': 'سالم',
      'بيانات إضافية غير مربوطة': 'معلومات سرية',
      'تاريخ الفحص': '2026-10-01',
    };
    const canonical = normalizer.normalize(raw, 1);
    expect(canonical._raw['بيانات إضافية غير مربوطة']).toBe('معلومات سرية');
    expect(canonical._raw['تاريخ الفحص']).toBe('2026-10-01');
  });

  // 22. unmapped column does not leak into canonical payload fields
  it('22. unmapped column does not leak into canonical payload fields', () => {
    const normalizer = new DriverTruckImportNormalizer({
      'اسم السائق': 'driverName',
    });
    const raw = {
      'اسم السائق': 'سالم',
      'extraUnmappedCol': 'leak_test',
    };
    const canonical = normalizer.normalize(raw, 1);
    expect((canonical as any).extraUnmappedCol).toBeUndefined();
  });

  // 23. changing sheet does not run entity analysis
  it('23. changing sheet does not run entity analysis', () => {
    const handleRosterSheetChangeBody = wizardContent.slice(
      wizardContent.indexOf('const handleRosterSheetChange'),
      wizardContent.indexOf('const handleRosterHeaderRowIndexChange')
    );
    expect(handleRosterSheetChangeBody).toContain('smartSourceDiscoveryService.discover');
    expect(handleRosterSheetChangeBody).not.toContain('DriverTruckPipelineService.processFileToReview');
    expect(handleRosterSheetChangeBody).not.toContain('setImportBatch');
  });

  // 24. changing header row does not run entity analysis
  it('24. changing header row does not run entity analysis', () => {
    const handleRosterHeaderRowBody = wizardContent.slice(
      wizardContent.indexOf('const handleRosterHeaderRowIndexChange'),
      wizardContent.indexOf('const handleRosterMappingChange')
    );
    expect(handleRosterHeaderRowBody).not.toContain('DriverTruckPipelineService.processFileToReview');
    expect(handleRosterHeaderRowBody).not.toContain('setImportBatch');
  });

  // 25. approval button exists
  it('25. approval button exists', () => {
    expect(wizardContent).toContain('اعتماد الربط وبدء تحليل سجل التشغيل');
  });

  // 26. processFileToReview is called only by approval path for the new flow
  it('26. processFileToReview is called only by approval path for the new flow', () => {
    const handleApprovalBody = wizardContent.slice(
      wizardContent.indexOf('const handleApproveRosterMappingAndStartPipeline'),
      wizardContent.indexOf('const handleResetRosterImport')
    );
    expect(handleApprovalBody).toContain('DriverTruckPipelineService.processFileToReview');
    expect(handleApprovalBody).toContain('setImportBatch(batch);');
  });

  // 27. approval passes selected sheet
  it('27. approval passes selected sheet', () => {
    const handleApprovalBody = wizardContent.slice(
      wizardContent.indexOf('const handleApproveRosterMappingAndStartPipeline'),
      wizardContent.indexOf('const handleResetRosterImport')
    );
    expect(handleApprovalBody).toContain('sheetName: rosterSelectedSheet');
  });

  // 28. approval passes selected header row
  it('28. approval passes selected header row', () => {
    const handleApprovalBody = wizardContent.slice(
      wizardContent.indexOf('const handleApproveRosterMappingAndStartPipeline'),
      wizardContent.indexOf('const handleResetRosterImport')
    );
    expect(handleApprovalBody).toContain('headerRowIndex: rosterHeaderRowIndex');
  });

  // 29. approval passes exact customMappings
  it('29. approval passes exact customMappings', () => {
    const handleApprovalBody = wizardContent.slice(
      wizardContent.indexOf('const handleApproveRosterMappingAndStartPipeline'),
      wizardContent.indexOf('const handleResetRosterImport')
    );
    expect(handleApprovalBody).toContain('customMappings: approvedCustomMappings');
  });

  // 30. existing automatic behavior remains valid when customMappings absent
  it('30. existing automatic behavior remains valid when customMappings absent', () => {
    const normalizer = new DriverTruckImportNormalizer();
    const raw = {
      'اسم السائق': 'فهد الدوسري',
      'رقم اللوحة': 'ر س ت 7777',
      'الناقل': 'شركة اليمامة للمقاولات',
    };
    const canonical = normalizer.normalize(raw, 1);
    expect(canonical.driverName).toBe('فهد الدوسري');
    expect(canonical.truckPlate).toBe('ر س ت 7777');
    expect(canonical.carrierName).toBe('شركة اليمامة للمقاولات');
  });

  // 31. Unit 2 source discovery compatibility preserved
  it('31. Unit 2 source discovery compatibility preserved', async () => {
    const buffer = createSampleRosterWorkbook();
    const source: ImportSource = {
      sourceType: 'EXCEL',
      importBatchId: 'BAT-DISC-ROSTER-COMPAT',
      sourceFileName: 'roster.xlsx',
    };
    const result = await smartSourceDiscoveryService.discover(source, buffer);
    expect(result.detectedHeaderRowIndex).toBe(0);
    expect(result.availableSheets).toContain('RosterList');
    expect(result.detectedHeaders.length).toBeGreaterThan(0);
  });

  // 32. Unit 3 roster entity-resolution behavior preserved
  it('32. Unit 3 roster entity-resolution behavior preserved', async () => {
    const resolver = new DriverTruckImportEntityResolver();
    const mapped = {
      carrierName: 'شركة اليمامة للمقاولات',
      materialName: 'ركام بازلتي 20 ملم',
      materialCode: 'AGG-20',
    };
    const resolutions = await resolver.resolveEntities(mapped as any, 1, mockPipelineContext);
    expect(resolutions.carrier?.matchedId).toBe('CAR-101');
    expect(resolutions.carrier?.isExact).toBe(true);
    expect(resolutions.material?.matchedId).toBe('MAT-201');
  });

  // Additional sanity check: ROSTER_CANONICAL_FIELD_OPTIONS matches expectations
  it('33. ROSTER_CANONICAL_FIELD_OPTIONS includes all required canonical targets', () => {
    const values = ROSTER_CANONICAL_FIELD_OPTIONS.map(o => o.value);
    expect(values).toContain('unmapped');
    expect(values).toContain('driverName');
    expect(values).toContain('driverPhone');
    expect(values).toContain('driverIdentity');
    expect(values).toContain('truckPlate');
    expect(values).toContain('truckType');
    expect(values).toContain('carrierName');
    expect(values).toContain('materialName');
    expect(values).toContain('materialCode');
    expect(values).toContain('tareWeightKg');
    expect(values).toContain('maxGrossWeightKg');
  });
});
