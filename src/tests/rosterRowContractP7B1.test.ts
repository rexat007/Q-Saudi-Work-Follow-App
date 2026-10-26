import { RosterBatchReviewService } from '../services/import/rosterBatchReview.service';
import { describe, it, expect, vi } from 'vitest';
import * as XLSX from 'xlsx';
import { DriverTruckPipelineService as Pipeline } from '../services/import/driverTruckPipeline.service';
import { DriverTruckImportNormalizer, DriverTruckImportEntityResolver, DriverTruckImportValidator, translateDiscoveryToRosterTarget, validateRosterMapping } from '../services/import/driverTruckImport';
import { smartSourceDiscoveryService } from '../services/import/smartSourceDiscovery.service';
import { CsvImportParser } from '../services/import/csvParser.service';
import { ExcelImportParser } from '../services/import/excelParser.service';
import { rosterSourceColumns, validateRosterFile, MAX_ROSTER_SOURCE_CELLS, assertRosterDimensions } from '../services/import/rosterSourceContract';
import { ExcelCsvTripValidator } from '../services/import/tripImportValidator';
import { normalizeCode } from '../utils/normalization';
vi.mock('../firebase/config', () => ({ auth: { currentUser: null }, db: {} }));
const context: any = { projectId: 'P1', userId: 'U', operationId: 'OP', knownEntities: { carriers: [{ carrierId: 'C', name: 'Carrier', projectId: 'P1' }], materials: [{ materialId: 'M', name: 'Material', code: 'MAT-1', projectId: 'P1' }], drivers: [{ driverId: 'D', name: 'Driver', idNumber: '1234567890', carrierId: 'C', projectId: 'P1' }], trucks: [{ truckId: 'T', plate: 'ABC 123', carrierId: 'C', projectId: 'P1' }], projectCarriers: ['C'], projectMaterials: ['M'] } };
const mappings = { Driver: 'driverName', Plate: 'truckPlate', Carrier: 'carrierName', Material: 'materialName' } as const;
const csv = 'Driver,Plate,Carrier,Material\nDriver,ABC 123,Carrier,Material';
const source: any = { sourceType: 'CSV', importBatchId: 'B' };
async function batch() { return Pipeline.processFileToReview(csv, 'roster.csv', csv.length, undefined, context, { headerRowIndex: 0, customMappings: mappings }); }
function workbook(type: 'xls' | 'xlsx', sheets: Record<string, any[][]>) { const wb = XLSX.utils.book_new(); Object.entries(sheets).forEach(([k, v]) => XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(v), k)); return XLSX.write(wb, { type: 'array', bookType: type }); }
describe('P7-B1 approved roster row contract', () => {
  it('preserves approved vocabulary through the actual resolver and review, with no Trip aliases', async () => {
    const spy = vi.spyOn(DriverTruckImportEntityResolver.prototype, 'resolveEntities');
    const result = await batch(), row = result.rows[0], raw = { ...row.raw };
    for (const value of [spy.mock.calls[0][0], row.canonical, row.mapped]) {
      expect(value).toMatchObject({ driverName: 'Driver', truckPlate: 'ABC 123', carrierName: 'Carrier', materialName: 'Material' });
      for (const key of Object.keys(value!)) expect(key).not.toMatch(/^(truckNo|carrier|materialType|ticketId|load.*|unload.*)$/);
    }
    expect(row.entityResolutions?.carrier.matchedId).toBe('C'); expect(row.entityResolutions?.truck.matchedId).toBe('T');
    expect(row.raw).toEqual(raw); expect(row.raw).not.toHaveProperty('truckPlate'); spy.mockRestore();
  });
  it('accepts a code-only material mapping and canonical code normalization', async () => {
    const text = 'Carrier,Truck,Material Code\nCarrier,ABC 123, mat 1 ';
    const map = { Carrier: 'carrierName', Truck: 'truckPlate', 'Material Code': 'materialCode' } as const;
    expect(validateRosterMapping(Object.keys(map), map)).toBeNull();
    const b = await Pipeline.processFileToReview(text, 'code.csv', text.length, undefined, context, { headerRowIndex: 0, customMappings: map });
    expect(b.rows[0].canonical?.materialCode).toBe(normalizeCode(' mat 1 ')); expect(b.rows[0].entityResolutions?.material.matchedId).toBe('M');
  });
  it.each(['ACCEPT_CANDIDATE', 'SELECT_ALTERNATE'] as const)('%s revalidates only roster concerns', async decision => {
    const b = await batch(), before = JSON.stringify(b.rows[0].raw), trip = vi.spyOn(ExcelCsvTripValidator.prototype, 'validateRow');
    const updated = Pipeline.applyEntityResolutionDecision(b, 1, 'carrier', decision, { selectedEntityId: 'C' }, context, 'U');
    expect(trip).not.toHaveBeenCalled(); expect(updated.rows[0].resolvedValues?.carrierId).toBe('C');
    expect(updated.issues.map(i => i.code)).not.toEqual(expect.arrayContaining(['MISSING_UNLOAD_DATA']));
    expect(updated.issues.some(i => /TICKET|LOAD_DATA|TRIP_DATE/.test(i.code))).toBe(false); expect(JSON.stringify(updated.rows[0].raw)).toBe(before); trip.mockRestore();
  });
  it('created and grouped decisions also avoid Trip validation, while Trip validation still emits its own errors', async () => {
    let b = await batch(); const trip = vi.spyOn(ExcelCsvTripValidator.prototype, 'validateRow');
    b = Pipeline.applyGroupedEntityResolutionDecision(b, 'carrier', RosterBatchReviewService.getGroupKey(b.rows[0], 'carrier'), 'SELECT_ALTERNATE', { selectedEntityId: 'C' }, context, 'U');
    b = Pipeline.applyGroupedCreatedEntityResolution(b, 'material', RosterBatchReviewService.getGroupKey(b.rows[0], 'material'), { matchedId: 'M', matchedName: 'Material' }, context);
    b = Pipeline.applyCreatedEntityResolution(b, 1, 'truck', { matchedId: 'T', matchedName: 'ABC 123' }, context);
    expect(trip).not.toHaveBeenCalled(); expect(b.issues.every(i => !/TICKET|LOAD_DATA|TRIP_DATE/.test(i.code))).toBe(true);
    const issues = new ExcelCsvTripValidator().validateRow({ rowNumber: 1, canonical: {}, mapped: {}, validationIssues: [] } as any, context);
    expect(issues.length).toBeGreaterThan(0); trip.mockRestore();
  });
  it('blocks duplicate targets and mismatched source identities before silent overwrite', async () => {
    const map = { ...mappings, 'Plate B': 'truckPlate' } as const;
    expect(validateRosterMapping(Object.keys(map), map)).toBe('MAPPING_DUPLICATE');
    expect(() => new DriverTruckImportNormalizer(map).normalize({ Plate: 'A', 'Plate B': 'B' }, 1)).toThrow('MAPPING_DUPLICATE');
    await expect(Pipeline.processFileToReview(csv, 'r.csv', csv.length, '', context, { headerRowIndex: 0, customMappings: map })).rejects.toThrow('MAPPING_DUPLICATE');
    await expect(Pipeline.processFileToReview(csv, 'r.csv', csv.length, '', context, { headerRowIndex: 0, customMappings: { ...mappings, Wrong: 'driverPhone' } })).rejects.toThrow('MAPPING_SOURCE');
  });
  it.each(['materialCode', 'materialName', 'materialType', 'truckNo', 'truckPlate'] as const)('has one deterministic discovery translation for %s', key => {
    expect(translateDiscoveryToRosterTarget(key)).toBe(({ materialCode: 'materialCode', materialName: 'materialName', materialType: 'materialName', truckNo: 'truckPlate', truckPlate: 'truckPlate' })[key]);
  });
  it.each(['١٢٬٣٤٥ كجم', '12,345 kg', '12345', 12345])('normalizes optional weight %s without Trip rules', value => {
    const row = new DriverTruckImportNormalizer({ Weight: 'tareWeightKg' }).normalize({ Weight: value }, 1);
    expect(row.tareWeightKg).toBe(12345); expect(row._invalidNumericFields).toBeUndefined();
  });
  it.each(['abc', '12oops', 'kg', 'Infinity', NaN])('retains an issue for malformed optional weight %s', value => {
    const canonical = new DriverTruckImportNormalizer({ Weight: 'maxGrossWeightKg' }).normalize({ Weight: value }, 1);
    expect(canonical.maxGrossWeightKg).toBeUndefined(); expect(JSON.stringify(canonical)).not.toContain('NaN');
    const issues = new DriverTruckImportValidator().validateRow({ canonical, rowNumber: 1 } as any, context);
    expect(issues.some(i => i.code === 'INVALID_ROSTER_WEIGHT' && i.blocking)).toBe(true);
  });
  it('does not make optional weights or phone mandatory, and checkpoint rows stay serializable', async () => {
    const b = await batch(); expect(b.rows[0].canonical?.tareWeightKg).toBeUndefined(); expect(b.rows[0].canonical?.driverPhone).toBe('');
    expect(JSON.parse(JSON.stringify(b)).rows[0].canonical).toEqual(b.rows[0].canonical);
  });
  it.each(['', 'application/octet-stream', 'text/csv'])('parses UTF-8 CSV using actual source type with MIME %s', async mime => {
    const b = await Pipeline.processFileToReview('\ufeff' + csv, 'r.csv', csv.length + 1, mime || undefined, context, { headerRowIndex: 0, customMappings: mappings });
    expect(b.source.sourceType).toBe('CSV'); expect(b.source.sourceMimeType).toBe(mime || undefined);
  });
  it.each(['xls', 'xlsx'] as const)('%s uses the approved sheet/header and physical duplicate/blank columns', async type => {
    const rows = [['Driver', 'Driver', '', 'Carrier', 'Material'], ['Wrong', 'Driver', 'ABC 123', 'Carrier', 'Material']];
    const input = workbook(type, { First: [['ignore'], ['unused']], Selected: [['preamble'], ...rows] });
    const discovery = await smartSourceDiscoveryService.discover({ ...source, sourceType: 'EXCEL', sourceSheetName: 'Selected' }, input, { roster: true, headerRowIndex: 1 });
    const parsed = new ExcelImportParser().parse({ ...source, sourceType: 'EXCEL' }, input, { roster: true, sheetName: 'Selected', headerRowIndex: 1 });
    expect(discovery.detectedHeaders).toEqual(parsed.headers); expect(new Set(parsed.headers).size).toBe(5);
    const map = { [parsed.headers[1]]: 'driverName', [parsed.headers[2]]: 'truckPlate', Carrier: 'carrierName', Material: 'materialName' } as const;
    const b = await Pipeline.processFileToReview(input, 'r.' + type, input.byteLength, undefined, context, { sheetName: 'Selected', headerRowIndex: 1, customMappings: map });
    expect(b.rows[0].canonical).toMatchObject({ driverName: 'Driver', truckPlate: 'ABC 123' });
  });
  it('uses the same CSV source keys and preserves intended physical columns even with suffix collisions', async () => {
    const text = 'Driver,Driver,,Driver_2\nA,B,C,D';
    const d = await smartSourceDiscoveryService.discover(source, text, { roster: true, headerRowIndex: 0 });
    const p = new CsvImportParser().parse(source, text, { roster: true });
    expect(d.detectedHeaders).toEqual(p.headers); expect(new Set(p.headers).size).toBe(4); expect(p.rows[0][p.headers[1]]).toBe('B'); expect(p.rows[0][p.headers[2]]).toBe('C');
    expect(rosterSourceColumns(['Driver', 'Driver', '']).map(c => c.index)).toEqual([0, 1, 2]);
  });
  it.each(['A,B\n"unterminated,value', 'A,B\n1,2,3'])('rejects malformed roster CSV with a bounded code', text => {
    expect(() => new CsvImportParser().parse(source, text, { roster: true })).toThrow('FILE_PARSE_ERROR');
  });
  it('recomputes physical keys for a user-selected sheet and a non-default header row', async () => {
    const input = workbook('xlsx', { First: [['Driver', 'Plate', 'Carrier', 'Material'], ['First', 'ABC 123', 'Carrier', 'Material']], Selected: [['Driver', 'Plate', 'Carrier', 'Material'], ['ignored', 'ABC 123', 'Carrier', 'Material'], ['Person', 'Vehicle', 'Company', 'Code'], ['Second', 'XYZ 456', 'Carrier', 'MAT-1']] });
    const proposed = await smartSourceDiscoveryService.discover({ ...source, sourceType: 'EXCEL' }, input, { roster: true });
    expect(proposed.selectedSheet).toBe('First');
    const chosen = await smartSourceDiscoveryService.discover({ ...source, sourceType: 'EXCEL', sourceSheetName: 'Selected' }, input, { roster: true, headerRowIndex: 2 });
    expect(chosen.detectedHeaders).toEqual(['Person', 'Vehicle', 'Company', 'Code']);
    const b = await Pipeline.processFileToReview(input, 'r.xlsx', input.byteLength, '', context, { sheetName: 'Selected', headerRowIndex: 2, customMappings: { Person: 'driverName', Vehicle: 'truckPlate', Company: 'carrierName', Code: 'materialCode' } });
    expect(b.rows).toHaveLength(1); expect(b.rows[0].canonical).toMatchObject({ driverName: 'Second', truckPlate: 'XYZ 456', materialCode: 'MAT-1' });
  });
  it('honors an overridden CSV header with its own delimiter after a preamble', async () => {
    const text = 'Preamble\nCarrier;Truck;Code\nCarrier;ABC 123;MAT-1';
    const d = await smartSourceDiscoveryService.discover(source, text, { roster: true, headerRowIndex: 1 });
    expect(d.detectedHeaders).toEqual(['Carrier', 'Truck', 'Code']);
    const b = await Pipeline.processFileToReview(text, 'r.csv', text.length, '', context, { headerRowIndex: 1, customMappings: { Carrier: 'carrierName', Truck: 'truckPlate', Code: 'materialCode' } });
    expect(b.rows[0].canonical?.truckPlate).toBe('ABC 123');
  });
  it('reports nonzero whitespace-only source as a bounded empty-file error', async () => {
    await expect(smartSourceDiscoveryService.discover(source, '  \n  ', { roster: true })).rejects.toThrow('FILE_EMPTY');
  });
  it('preserves exact file size and MIME boundaries', () => {
    expect(validateRosterFile({ name: 'r.csv', size: 25 * 1024 * 1024 }).isValid).toBe(true);
    expect(() => validateRosterFile({ name: 'r.csv', size: 25 * 1024 * 1024 + 1 })).toThrow('FILE_TOO_LARGE');
    expect(() => validateRosterFile({ name: 'r.csv', size: 0 })).toThrow('FILE_EMPTY');
    expect(() => validateRosterFile({ name: 'r.csv', size: 1, type: 'image/png' })).toThrow('FILE_MIME_MISMATCH');
    expect(() => validateRosterFile({ name: 'r.zip', size: 1 })).toThrow('FILE_UNSUPPORTED');
  });
  it('bounds discovery expansion and rejects corrupt workbooks without library details', async () => {
    expect(() => assertRosterDimensions(10001, 1)).toThrow('SOURCE_LIMIT'); expect(() => assertRosterDimensions(1, 257)).toThrow('SOURCE_LIMIT');
    expect(() => assertRosterDimensions(10000, 101)).toThrow('SOURCE_LIMIT'); expect(() => assertRosterDimensions(10000, MAX_ROSTER_SOURCE_CELLS / 10000)).not.toThrow();
    const wb = XLSX.utils.book_new(), ws: any = { A1: { t: 's', v: 'Driver' }, '!ref': 'A1:B10001' }; XLSX.utils.book_append_sheet(wb, ws, 'Huge');
    // A compact sparse workbook exercises metadata bounds without allocating the represented grid.
    const input = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
    await expect(smartSourceDiscoveryService.discover({ ...source, sourceType: 'EXCEL' }, input, { roster: true })).rejects.toThrow('SOURCE_LIMIT');
    await expect(Pipeline.processFileToReview(new Uint8Array([0x50, 0x4b, 3, 4]), 'bad.xlsx', 4, '', context, { headerRowIndex: 0, customMappings: mappings })).rejects.toThrow('FILE_PARSE_ERROR');
  });
});
