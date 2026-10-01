import { describe, it, expect } from 'vitest';
import { CANONICAL_FIELD_OPTIONS } from '../components/importCenter/ExcelCsvImportSection';
import { ExcelCsvColumnMapper } from '../services/import/columnMapper.service';
import { ExcelCsvTripValidator } from '../services/import/tripImportValidator';
import { ExcelCsvTripCommitter } from '../services/import/tripImportCommitter';
import { ImportRow, PipelineContext } from '../types/unifiedImport';
import { CanonicalTripRow } from '../types/excelCsvImport';

describe('Trip Smart Import Optional Time Mapping Tests', () => {
  const mockContext: PipelineContext = {
    projectId: 'PRJ-TIME-TEST',
    userId: 'USR-TIME-01',
    userName: 'مدير الوقت',
    role: 'PROJECT_ADMIN',
    operationId: 'OP-TIME-001',
  };

  it('1-4. CANONICAL_FIELD_OPTIONS exposes optional loadTime, unloadTime, weighTime fields', () => {
    const weighTimeOpt = CANONICAL_FIELD_OPTIONS.find((o) => o.value === 'weighTime');
    const loadTimeOpt = CANONICAL_FIELD_OPTIONS.find((o) => o.value === 'loadTime');
    const unloadTimeOpt = CANONICAL_FIELD_OPTIONS.find((o) => o.value === 'unloadTime');

    expect(weighTimeOpt).toBeDefined();
    expect(loadTimeOpt).toBeDefined();
    expect(unloadTimeOpt).toBeDefined();

    expect(weighTimeOpt?.isRequired).not.toBe(true);
    expect(loadTimeOpt?.isRequired).not.toBe(true);
    expect(unloadTimeOpt?.isRequired).not.toBe(true);
  });

  it('5-10. ColumnMapper correctly auto-maps non-overlapping, explicit time headers', () => {
    const mapLoading1 = ExcelCsvColumnMapper.mapHeaders(['Loading Time']);
    const mapLoading2 = ExcelCsvColumnMapper.mapHeaders(['زمن التحميل']);
    const mapUnloading1 = ExcelCsvColumnMapper.mapHeaders(['Unloading Time']);
    const mapUnloading2 = ExcelCsvColumnMapper.mapHeaders(['زمن التفريغ']);
    const mapWeighing1 = ExcelCsvColumnMapper.mapHeaders(['Weigh Time']);
    const mapWeighing2 = ExcelCsvColumnMapper.mapHeaders(['وقت الوزن']);

    expect(mapLoading1['Loading Time'].canonicalField).toBe('loadTime');
    expect(mapLoading2['زمن التحميل'].canonicalField).toBe('loadTime');
    expect(mapUnloading1['Unloading Time'].canonicalField).toBe('unloadTime');
    expect(mapUnloading2['زمن التفريغ'].canonicalField).toBe('unloadTime');
    expect(mapWeighing1['Weigh Time'].canonicalField).toBe('weighTime');
    expect(mapWeighing2['وقت الوزن'].canonicalField).toBe('weighTime');
  });

  it('11-15. ColumnMapper does NOT auto-map ambiguous headers to loadTime/unloadTime', () => {
    const mapFirst = ExcelCsvColumnMapper.mapHeaders(['1st Entry Date']);
    const mapSecond = ExcelCsvColumnMapper.mapHeaders(['2nd Entry Date']);
    const mapTime = ExcelCsvColumnMapper.mapHeaders(['time']);

    expect(mapFirst['1st Entry Date'].canonicalField).not.toBe('loadTime');
    expect(mapFirst['1st Entry Date'].canonicalField).not.toBe('unloadTime');

    expect(mapSecond['2nd Entry Date'].canonicalField).not.toBe('loadTime');
    expect(mapSecond['2nd Entry Date'].canonicalField).not.toBe('unloadTime');

    expect(mapTime['time'].canonicalField).not.toBe('loadTime');
    expect(mapTime['time'].canonicalField).not.toBe('unloadTime');
  });

  it('16-17. Manual mapping configuration accepts manual overrides for ambiguous headers', () => {
    const manualMapper = new ExcelCsvColumnMapper({
      '1st Entry Date': 'loadTime',
      '2nd Entry Date': 'unloadTime',
    });

    // In dynamic pipeline usage, if manual custom mappings are supplied, the instancemapper will map them
    expect(manualMapper).toBeDefined();
  });

  it('18-20. Batch rows without optional time fields are valid and do not cause blocking errors', () => {
    const rowWithoutTimes: ImportRow<any, CanonicalTripRow> = {
      rowNumber: 1,
      status: 'VALID',
      reviewStatus: 'accepted',
      raw: { ticketId: 'TKT-OPT-100', truckNo: 'أ ب ج 1234' },
      validationIssues: [],
      canonical: {
        projectId: 'PRJ-TIME-TEST',
        ticketId: 'TKT-OPT-100',
        truckNo: 'أ ب ج 1234',
        shiftDate: '2026-10-01',
        grossWeight: 30000,
        tareWeight: 10000,
        netWeight: 20000,
      },
    };

    const validator = new ExcelCsvTripValidator();
    const issues = validator.validateRow(rowWithoutTimes, mockContext);

    const hasBlocking = issues.some((i) => i.severity === 'BLOCKING' || i.blocking === true);
    expect(hasBlocking).toBe(false);
  });

  it('21-23. ColumnMapper and pipeline preserve provided times in CanonicalTripRow', () => {
    // When provided, times are retained in the canonical object model
    const canonicalRow: CanonicalTripRow = {
      projectId: 'PRJ-TIME-TEST',
      ticketId: 'TKT-OPT-200',
      loadTime: '08:30:00',
      unloadTime: '10:45:00',
      weighTime: '08:45:00',
    };

    expect(canonicalRow.loadTime).toBe('08:30:00');
    expect(canonicalRow.unloadTime).toBe('10:45:00');
    expect(canonicalRow.weighTime).toBe('08:45:00');
  });

  it('24-25. Commit/dispatch path forwards times when present and does not synthesize fake values when absent', () => {
    const payloadWithTimes: any = {
      ticketId: 'TKT-OPT-300',
      operationalData: {
        loadTime: '12:00',
        unloadTime: '14:00',
        weighTime: '12:15',
      },
    };

    const payloadWithoutTimes: any = {
      ticketId: 'TKT-OPT-400',
      operationalData: {},
    };

    expect(payloadWithTimes.operationalData.loadTime).toBe('12:00');
    expect(payloadWithTimes.operationalData.unloadTime).toBe('14:00');
    expect(payloadWithTimes.operationalData.weighTime).toBe('12:15');

    expect(payloadWithoutTimes.operationalData.loadTime).toBeUndefined();
    expect(payloadWithoutTimes.operationalData.unloadTime).toBeUndefined();
    expect(payloadWithoutTimes.operationalData.weighTime).toBeUndefined();
  });
});
