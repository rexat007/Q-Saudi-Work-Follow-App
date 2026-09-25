import { describe, it, expect, vi } from 'vitest';
import { 
  DriverTruckImportNormalizer, 
  DriverTruckImportEntityResolver,
  DriverTruckImportDuplicateChecker,
  DriverTruckImportValidator,
  DriverTruckImportCommitter
} from '../services/import/driverTruckImport';
import { PipelineContext } from '../types/unifiedImport';

describe('Unit 3 Roster Convergence — 34 Behavior Matrix', () => {
  const mockContext: PipelineContext = {
    projectId: 'PRJ-123',
    operationId: 'OP-123',
    userId: 'user-1',
    userName: 'Test User',
    knownEntities: {
      carriers: [{ carrierId: 'CAR-1', name: 'Carrier One' }],
      materials: [{ materialId: 'MAT-1', name: 'Aggregate', code: 'AGG-20' }],
      drivers: [{ driverId: 'DRV-1', name: 'John Doe', idNumber: '1234567890', carrierId: 'CAR-1' }],
      trucks: [{ truckId: 'TRK-1', plate: 'ABC 123', carrierId: 'CAR-1' }]
    }
  };

  const normalizer = new DriverTruckImportNormalizer();

  // 1. DRIVER NAME mapping
  it('1. shared mapper maps DRIVER NAME', () => {
    const raw = { 'DRIVER NAME': 'John Doe' };
    const canonical = normalizer.normalize(raw, 1);
    expect(canonical.driverName).toBe('John Doe');
  });

  // 2. name اسم السائق mapping
  it('2. shared mapper maps name اسم السائق', () => {
    const raw = { 'اسم السائق': 'سالم محمد' };
    const canonical = normalizer.normalize(raw, 1);
    expect(canonical.driverName).toBe('سالم محمد');
  });

  // 3. IQAMA NO mapping
  it('3. shared mapper maps IQAMA NO', () => {
    const raw = { 'IQAMA NO': '2345678901' };
    const canonical = normalizer.normalize(raw, 1);
    expect(canonical.driverIdentity).toBe('2345678901');
  });

  // 4. iqama إقامة السائق mapping
  it('4. shared mapper maps iqama إقامة السائق', () => {
    const raw = { 'إقامة السائق': '2345678901' };
    const canonical = normalizer.normalize(raw, 1);
    expect(canonical.driverIdentity).toBe('2345678901');
  });

  // 5. MOBILE NO mapping
  it('5. shared mapper maps MOBILE NO', () => {
    const raw = { 'MOBILE NO': '0501234567' };
    const canonical = normalizer.normalize(raw, 1);
    expect(canonical.driverPhone).toBe('0501234567');
  });

  // 6. Vehicle No mapping
  it('6. shared mapper maps Vehicle No', () => {
    const raw = { 'Vehicle No': 'ABC 123' };
    const canonical = normalizer.normalize(raw, 1);
    expect(canonical.truckPlate).toBe('ABC 123');
  });

  // 7. VECHLE NO mapping
  it('7. shared mapper maps VECHLE NO', () => {
    const raw = { 'VECHLE NO': 'XYZ 789' };
    const canonical = normalizer.normalize(raw, 1);
    expect(canonical.truckPlate).toBe('XYZ 789');
  });

  // 8. Plate عربى mapping
  it('8. shared mapper maps Plate عربى', () => {
    const raw = { 'Plate عربى': 'أ ب ج 1234' };
    const canonical = normalizer.normalize(raw, 1);
    expect(canonical.truckPlate).toBe('ا ب ج 1234');
  });

  // 9. arbitrary roster column order
  it('9. arbitrary roster column order does not impact normalization', () => {
    const raw = { 'Plate عربى': 'أ ب ج 1234', 'MOBILE NO': '0555555555', 'اسم السائق': 'فهد' };
    const canonical = normalizer.normalize(raw, 1);
    expect(canonical.driverName).toBe('فهد');
    expect(canonical.driverPhone).toBe('0555555555');
    expect(canonical.truckPlate).toBe('ا ب ج 1234');
  });

  // 10. carrier field maps per row
  it('10. carrier field maps per row', () => {
    const raw = { 'carrier': 'Carrier One', 'الناقل': 'الناقل الأول' };
    const canonical = normalizer.normalize(raw, 1);
    expect(canonical.carrierName).toBeDefined();
    expect(canonical.carrierName.length).toBeGreaterThan(0);
  });

  // 11. material field maps per row
  it('11. material field maps per row', () => {
    const raw = { 'material': 'Aggregate', 'اسم المادة': 'ركام' };
    const canonical = normalizer.normalize(raw, 1);
    expect(canonical.materialName).toBeDefined();
    expect(canonical.materialName.length).toBeGreaterThan(0);
  });

  // 12. material code resolves to canonical materialId
  it('12. material code resolves to canonical materialId', async () => {
    const resolver = new DriverTruckImportEntityResolver();
    const mapped = { materialCode: 'AGG-20' };
    const res = await resolver.resolveEntities(mapped, 1, mockContext);
    expect(res.material.matchedId).toBe('MAT-1');
  });

  // 13. material code is NOT reused as materialId
  it('13. material code is NOT reused as materialId', async () => {
    const resolver = new DriverTruckImportEntityResolver();
    const mapped = { materialCode: 'AGG-20' };
    const res = await resolver.resolveEntities(mapped, 1, mockContext);
    expect(res.material.matchedId).not.toBe('AGG-20');
  });

  // 14. unresolved material remains blocking
  it('14. unresolved material remains blocking', () => {
    const validator = new DriverTruckImportValidator();
    const row: any = { 
      rowNumber: 1, 
      canonical: { driverName: 'Test', materialName: 'UNKNOWN_MAT' }, 
      entityResolutions: { 
        carrier: { matchedId: 'CAR-1', isAuthorized: true }, 
        material: { matchedId: null, isAuthorized: false } 
      } 
    };
    const issues = validator.validateRow(row, mockContext);
    const matIssue = issues.find(i => i.code === 'UNRESOLVED_MATERIAL');
    expect(matIssue).toBeDefined();
    expect(matIssue?.blocking).toBe(true);
    expect(matIssue?.severity).toBe('BLOCKING');
  });

  // 15. unresolved carrier remains blocking
  it('15. unresolved carrier remains blocking', () => {
    const validator = new DriverTruckImportValidator();
    const row: any = { 
      rowNumber: 1, 
      canonical: { driverName: 'Test', carrierName: 'UNKNOWN_CAR' }, 
      entityResolutions: { 
        carrier: { matchedId: null, isAuthorized: false }, 
        material: { matchedId: 'MAT-1', isAuthorized: true } 
      } 
    };
    const issues = validator.validateRow(row, mockContext);
    const carIssue = issues.find(i => i.code === 'UNRESOLVED_CARRIER');
    expect(carIssue).toBeDefined();
    expect(carIssue?.blocking).toBe(true);
    expect(carIssue?.severity).toBe('BLOCKING');
  });

  // 16. canonical.carrierId cannot bypass unresolved carrier resolution
  it('16. canonical.carrierId cannot bypass unresolved carrier resolution', async () => {
    const committer = new DriverTruckImportCommitter();
    const batch: any = {
      projectId: 'PRJ-123',
      source: { sourceType: 'EXCEL' },
      rows: [{
        rowNumber: 1,
        status: 'VALID',
        reviewStatus: 'accepted',
        canonical: { driverName: 'Test', carrierId: 'CAR-BYPASS' },
        entityResolutions: { carrier: { matchedId: null }, material: { matchedId: 'MAT-1' } }
      }]
    };
    const result = await committer.commit(batch, mockContext);
    expect(result.failedRows).toBe(1);
    expect(result.issues.some(i => i.code === 'MISSING_CARRIER_ID')).toBe(true);
  });

  // 17. exact driver identity match resolves
  it('17. exact driver identity match resolves', async () => {
    const resolver = new DriverTruckImportEntityResolver();
    const res = await resolver.resolveEntities({ driverName: 'John', driverIdentity: '1234567890' }, 1, mockContext);
    expect(res.driver.matchedId).toBe('DRV-1');
    expect(res.driver.matchMethod).toBe('EXACT');
  });

  // 18. normalized unique driver match resolves
  it('18. normalized unique driver match resolves', async () => {
    const resolver = new DriverTruckImportEntityResolver();
    const res = await resolver.resolveEntities({ driverName: 'john doe' }, 1, mockContext);
    expect(res.driver.matchedId).toBe('DRV-1');
    expect(res.driver.matchMethod).toBe('NORMALIZED');
  });

  // 19. fuzzy driver candidate does NOT silently resolve
  it('19. fuzzy driver candidate does NOT silently resolve', async () => {
    const resolver = new DriverTruckImportEntityResolver();
    const res = await resolver.resolveEntities({ driverName: 'John D' }, 1, mockContext);
    expect(res.driver.matchedId).toBeUndefined();
    expect(res.driver.matchMethod).toBe('FUZZY');
  });

  // 20. multiple candidate ambiguity requires review
  it('20. multiple candidate ambiguity requires review', async () => {
    const resolver = new DriverTruckImportEntityResolver();
    const res = await resolver.resolveEntities({ driverName: 'John Partial' }, 1, mockContext);
    expect(res.driver.matchedId).toBeUndefined();
    expect(res.driver.isExact).toBe(false);
  });

  // 21. exact truck plate resolves
  it('21. exact truck plate resolves', async () => {
    const resolver = new DriverTruckImportEntityResolver();
    const res = await resolver.resolveEntities({ truckPlate: 'ABC 123' }, 1, mockContext);
    expect(res.truck.matchedId).toBe('TRK-1');
    expect(res.truck.isExact).toBe(true);
  });

  // 22. driver/carrier relationship conflict blocks
  it('22. driver/carrier relationship conflict blocks', async () => {
    const resolver = new DriverTruckImportEntityResolver();
    const res = await resolver.resolveEntities({ 
      driverName: 'John Doe', 
      carrierName: 'Carrier Two' 
    }, 1, {
      ...mockContext,
      knownEntities: {
        ...mockContext.knownEntities,
        carriers: [{ carrierId: 'CAR-2', name: 'Carrier Two' }]
      }
    });
    expect(res.driver.relationshipStatus).toBe('DRIVER_CARRIER_CONFLICT');
    expect(res.driver.riskLevel).toBe('CRITICAL');
  });

  // 23. truck/carrier relationship conflict blocks
  it('23. truck/carrier relationship conflict blocks', async () => {
    const resolver = new DriverTruckImportEntityResolver();
    const res = await resolver.resolveEntities({ 
      truckPlate: 'ABC 123',
      carrierName: 'Carrier Two' 
    }, 1, {
      ...mockContext,
      knownEntities: {
        ...mockContext.knownEntities,
        carriers: [{ carrierId: 'CAR-2', name: 'Carrier Two' }]
      }
    });
    expect(res.truck.relationshipStatus).toBe('RELATIONSHIP_CONFLICT');
    expect(res.truck.riskLevel).toBe('CRITICAL');
  });

  // 24. same-entity duplicate is classified distinctly
  it('24. same-entity duplicate is classified distinctly as SAME_ENTITY_DUPLICATE', () => {
    const checker = new DriverTruckImportDuplicateChecker();
    const rows: any[] = [
      { rowNumber: 1, canonical: { driverIdentity: '1234567890', driverName: 'John Doe' }, validationIssues: [] },
      { rowNumber: 2, canonical: { driverIdentity: '1234567890', driverName: 'John Doe' }, validationIssues: [] }
    ];
    const checked = checker.checkDuplicates(rows, mockContext);
    expect(checked[1].validationIssues[0].code).toBe('SAME_ENTITY_DUPLICATE');
    expect(checked[1].validationIssues[0].severity).toBe('WARNING');
    expect(checked[1].validationIssues[0].blocking).toBe(false);
  });

  // 25. conflicting duplicate is blocking (IDENTITY_CONFLICT)
  it('25. conflicting duplicate is blocking (IDENTITY_CONFLICT)', () => {
    const checker = new DriverTruckImportDuplicateChecker();
    const rows: any[] = [
      { rowNumber: 1, canonical: { driverIdentity: '1234567890', driverName: 'John Doe' }, validationIssues: [] },
      { rowNumber: 2, canonical: { driverIdentity: '1234567890', driverName: 'Conflict Name' }, validationIssues: [] }
    ];
    const checked = checker.checkDuplicates(rows, mockContext);
    expect(checked[1].validationIssues[0].code).toBe('IDENTITY_CONFLICT');
    expect(checked[1].validationIssues[0].severity).toBe('BLOCKING');
    expect(checked[1].validationIssues[0].blocking).toBe(true);
  });

  // 26. PLATE_CONFLICT is blocking
  it('26. PLATE_CONFLICT is blocking', () => {
    const checker = new DriverTruckImportDuplicateChecker();
    const rows: any[] = [
      { rowNumber: 1, canonical: { truckPlate: 'ABC 123', driverIdentity: '1234567890' }, validationIssues: [] },
      { rowNumber: 2, canonical: { truckPlate: 'ABC 123', driverIdentity: '9999999999' }, validationIssues: [] }
    ];
    const checked = checker.checkDuplicates(rows, mockContext);
    expect(checked[1].validationIssues[0].code).toBe('PLATE_CONFLICT');
    expect(checked[1].validationIssues[0].severity).toBe('BLOCKING');
    expect(checked[1].validationIssues[0].blocking).toBe(true);
  });

  // 27. same duplicate is not silently deleted
  it('27. same duplicate is not silently deleted and preserves rows array length', () => {
    const checker = new DriverTruckImportDuplicateChecker();
    const rows: any[] = [
      { rowNumber: 1, canonical: { driverIdentity: '1234567890', driverName: 'John Doe' }, validationIssues: [] },
      { rowNumber: 2, canonical: { driverIdentity: '1234567890', driverName: 'John Doe' }, validationIssues: [] }
    ];
    const checked = checker.checkDuplicates(rows, mockContext);
    expect(checked.length).toBe(2);
  });

  // 28. extra source column remains in row.raw/source data
  it('28. extra source column remains in raw source data', () => {
    const raw = { driverName: 'John', 'Unrecognized Custom Note': 'Keep me safe' };
    const canonical = normalizer.normalize(raw, 1);
    expect(canonical._raw['Unrecognized Custom Note']).toBe('Keep me safe');
  });

  // 29. extra fields do not leak into canonical entity payload
  it('29. extra fields do not leak into canonical entity payload', () => {
    const raw = { driverName: 'John', 'Unrecognized Custom Note': 'Do not leak' };
    const canonical = normalizer.normalize(raw, 1);
    expect((canonical as any)['Unrecognized Custom Note']).toBeUndefined();
  });

  // 30. no Smart Import generation of DRV IDs
  it('30. no Smart Import generation of DRV IDs', async () => {
    const resolver = new DriverTruckImportEntityResolver();
    const res = await resolver.resolveEntities({ driverName: 'New Driver Who Has No ID' }, 1, mockContext);
    expect(res.driver?.matchedId).toBeUndefined();
  });

  // 31. no Smart Import generation of TRK IDs
  it('31. no Smart Import generation of TRK IDs', async () => {
    const resolver = new DriverTruckImportEntityResolver();
    const res = await resolver.resolveEntities({ truckPlate: 'NEW 9999' }, 1, mockContext);
    expect(res.truck?.matchedId).toBeUndefined();
  });

  // 32. no Smart Import generation of CAR IDs or MAT IDs
  it('32. no Smart Import generation of CAR IDs or MAT IDs', async () => {
    const resolver = new DriverTruckImportEntityResolver();
    const res = await resolver.resolveEntities({ carrierName: 'Unregistered Carrier', materialName: 'Unregistered Material' }, 1, mockContext);
    expect(res.carrier?.matchedId).toBeUndefined();
    expect(res.material?.matchedId).toBeUndefined();
  });

  // 33. commit still routes through canonical intake boundary
  it('33. commit requires resolved carrier/material and preserves /api/intake/canonical', async () => {
    const committer = new DriverTruckImportCommitter();
    const batch: any = {
      projectId: 'PRJ-123',
      source: { sourceType: 'EXCEL' },
      rows: [{
        rowNumber: 1,
        status: 'VALID',
        reviewStatus: 'accepted',
        canonical: { driverName: 'John', truckPlate: 'ABC 123' },
        entityResolutions: { carrier: { matchedId: 'CAR-1' }, material: { matchedId: 'MAT-1' } }
      }]
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ affiliationId: 'AFF-1' })
    });
    global.fetch = mockFetch;

    await committer.commit(batch, mockContext);
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/api/intake/canonical'), expect.any(Object));
  });

  // 34. Unit 2 Smart Source Discovery compatibility remains intact
  it('34. Unit 2 Smart Source Discovery compatibility remains intact', async () => {
    const { DriverTruckPipelineService } = await import('../services/import/driverTruckPipeline.service');
    expect(typeof DriverTruckPipelineService.processFileToReview).toBe('function');
  });

  // 35. Regression: Commit fails-closed if material matchedId is absent (no fallback to canonical, context, or MAT-DEFAULT)
  it('35. Commit fails-closed if material matchedId is absent despite canonical/context fallback availability', async () => {
    const committer = new DriverTruckImportCommitter();
    const batch: any = {
      projectId: 'PRJ-123',
      source: { sourceType: 'EXCEL' },
      rows: [{
        rowNumber: 1,
        status: 'VALID',
        reviewStatus: 'accepted',
        canonical: {
          driverName: 'عادل السليمي',
          truckPlate: 'ط ي ر 9999',
          materialId: 'MAT-CANONICAL-UNRESOLVED',
          materialName: 'اسفلت'
        },
        entityResolutions: {
          carrier: { matchedId: 'CAR-1' },
          material: { matchedId: undefined }
        }
      }]
    };

    const mockFetch = vi.fn();
    global.fetch = mockFetch;

    const result = await committer.commit(batch, mockContext);

    // MUST NOT call /api/intake/canonical
    expect(mockFetch).not.toHaveBeenCalled();
    // return failedRows = 1
    expect(result.failedRows).toBe(1);
    expect(result.committedRows).toBe(0);
    // include MISSING_MATERIAL_ID
    expect(result.issues.some(i => i.code === 'MISSING_MATERIAL_ID' && i.blocking)).toBe(true);
  });
});
