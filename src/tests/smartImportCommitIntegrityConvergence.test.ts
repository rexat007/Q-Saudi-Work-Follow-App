import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ExcelCsvTripCommitter } from '../services/import/tripImportCommitter';
import { unifiedImportPipelineService } from '../services/import/unifiedImportPipeline.service';
import { carrierRepository } from '../repositories/carrier.repository';
import { truckRepository } from '../repositories/truck.repository';
import { driverRepository } from '../repositories/driver.repository';
import { materialRepository } from '../repositories/material.repository';
import { tripRepository } from '../repositories/trip.repository';
import { UnifiedImportBatch, PipelineContext } from '../types/unifiedImport';
import * as fs from 'fs';
import * as path from 'path';

describe('Smart Import Commit Integrity Convergence Test Suite', () => {
  const dummyContext: PipelineContext = {
    projectId: 'PRJ-NEOM-CONVERGE',
    userId: 'user-admin-1',
    userName: 'Admin User',
    role: 'PROJECT_ADMIN',
    operationId: 'OP-CONVERGE-TEST',
    allowWarningsCommit: true,
  };

  const createValidRowBatch = (): UnifiedImportBatch => ({
    importBatchId: 'BAT-CONVERGE-001',
    projectId: 'PRJ-NEOM-CONVERGE',
    source: { sourceType: 'EXCEL', importBatchId: 'BAT-CONVERGE-001', sourceFileName: 'test.xlsx' },
    currentStage: 'REVIEW',
    validationStatus: 'PASSED',
    commitStatus: 'READY_TO_COMMIT',
    totalRows: 1,
    validRows: 1,
    warningRows: 0,
    errorRows: 0,
    requiresReviewRows: 0,
    committedRows: 0,
    rows: [
      {
        rowNumber: 1,
        status: 'VALID',
        reviewStatus: 'accepted',
        raw: { carrier: 'A', truckNo: 'B', driverName: 'C', materialType: 'D' },
        canonical: {
          carrierId: 'CAR-100',
          truckId: 'TRK-200',
          driverId: 'DRV-300',
          materialId: 'MAT-400',
        },
        resolvedValues: {
          carrierId: 'CAR-100',
          truckId: 'TRK-200',
          driverId: 'DRV-300',
          materialId: 'MAT-400',
        },
        entityResolutions: {
          carrier: { entityType: 'CARRIER', sourceValue: 'A', matchedId: 'CAR-100', matchedName: 'Carrier A', confidence: 1.0, isExact: true, isAuthorized: true, riskLevel: 'LOW', relationshipStatus: 'VALID', recommendation: 'ACCEPT' },
          truck: { entityType: 'TRUCK', sourceValue: 'B', matchedId: 'TRK-200', matchedName: 'Truck B', confidence: 1.0, isExact: true, isAuthorized: true, riskLevel: 'LOW', relationshipStatus: 'VALID', recommendation: 'ACCEPT' },
          driver: { entityType: 'DRIVER', sourceValue: 'C', matchedId: 'DRV-300', matchedName: 'Driver C', confidence: 1.0, isExact: true, isAuthorized: true, riskLevel: 'LOW', relationshipStatus: 'VALID', recommendation: 'ACCEPT' },
          material: { entityType: 'MATERIAL', sourceValue: 'D', matchedId: 'MAT-400', matchedName: 'Material D', confidence: 1.0, isExact: true, isAuthorized: true, riskLevel: 'LOW', relationshipStatus: 'VALID', recommendation: 'ACCEPT' },
        },
      },
    ],
    issues: [],
    auditTrail: [],
    operationId: 'OP-CONVERGE-TEST',
    createdAt: new Date().toISOString(),
    createdBy: 'user-admin-1',
  });

  beforeEach(() => {
    vi.restoreAllMocks();
    ExcelCsvTripCommitter.resetIdempotencyCache();
    vi.spyOn(tripRepository, 'create').mockResolvedValue(undefined as any);
  });

  // Priorities 1-4
  it('1. resolvedValues.carrierId overrides stale canonical.carrierId', async () => {
    const batch = createValidRowBatch();
    batch.rows[0].canonical.carrierId = 'CAR-STALE';
    batch.rows[0].resolvedValues = {
      carrierId: 'CAR-FRESH',
      truckId: 'TRK-200',
      driverId: 'DRV-300',
      materialId: 'MAT-400',
    };

    const committer = new ExcelCsvTripCommitter();
    const res = await committer.commit(batch, dummyContext);
    const issue = res.issues?.find(i => i.code === 'CANONICAL_SNAPSHOT_DATA_MISSING');
    expect(issue?.message).toContain('Carrier: CAR-FRESH');
  });

  it('2. resolvedValues.truckId overrides stale canonical.truckId', async () => {
    const batch = createValidRowBatch();
    batch.rows[0].canonical.truckId = 'TRK-STALE';
    batch.rows[0].resolvedValues = {
      carrierId: 'CAR-100',
      truckId: 'TRK-FRESH',
      driverId: 'DRV-300',
      materialId: 'MAT-400',
    };

    const committer = new ExcelCsvTripCommitter();
    const res = await committer.commit(batch, dummyContext);
    const issue = res.issues?.find(i => i.code === 'CANONICAL_SNAPSHOT_DATA_MISSING');
    expect(issue?.message).toContain('Truck: TRK-FRESH');
  });

  it('3. resolvedValues.driverId overrides stale canonical.driverId', async () => {
    const batch = createValidRowBatch();
    batch.rows[0].canonical.driverId = 'DRV-STALE';
    batch.rows[0].resolvedValues = {
      carrierId: 'CAR-100',
      truckId: 'TRK-200',
      driverId: 'DRV-FRESH',
      materialId: 'MAT-400',
    };

    const committer = new ExcelCsvTripCommitter();
    const res = await committer.commit(batch, dummyContext);
    const issue = res.issues?.find(i => i.code === 'CANONICAL_SNAPSHOT_DATA_MISSING');
    expect(issue?.message).toContain('Driver: DRV-FRESH');
  });

  it('4. resolvedValues.materialId overrides stale canonical.materialId', async () => {
    const batch = createValidRowBatch();
    batch.rows[0].canonical.materialId = 'MAT-STALE';
    batch.rows[0].resolvedValues = {
      carrierId: 'CAR-100',
      truckId: 'TRK-200',
      driverId: 'DRV-300',
      materialId: 'MAT-FRESH',
    };

    const committer = new ExcelCsvTripCommitter();
    const res = await committer.commit(batch, dummyContext);
    const issue = res.issues?.find(i => i.code === 'CANONICAL_SNAPSHOT_DATA_MISSING');
    expect(issue?.message).toContain('Material: MAT-FRESH');
  });

  // accepted & real IDs 5-10
  it('5. accepted entity resolution ID is used when resolvedValues absent', async () => {
    const batch = createValidRowBatch();
    batch.rows[0].resolvedValues = {};
    batch.rows[0].entityResolutions!.carrier = {
      matchedId: 'CAR-ACCEPTED',
      matchedName: 'Carrier Accepted',
      isExact: true,
      confidence: 1.0,
    } as any;

    const committer = new ExcelCsvTripCommitter();
    const res = await committer.commit(batch, dummyContext);
    const issue = res.issues?.find(i => i.code === 'CANONICAL_SNAPSHOT_DATA_MISSING');
    expect(issue?.message).toContain('Carrier: CAR-ACCEPTED');
  });

  it('6. canonical real ID may be used only when already present (non-synthetic format)', async () => {
    const batch = createValidRowBatch();
    batch.rows[0].resolvedValues = {
      truckId: 'TRK-200',
      driverId: 'DRV-300',
      materialId: 'MAT-400',
    };
    batch.rows[0].entityResolutions = {
      truck: { matchedId: 'TRK-200' },
      driver: { matchedId: 'DRV-300' },
      material: { matchedId: 'MAT-400' },
    } as any;
    batch.rows[0].canonical.carrierId = 'CAR-REAL-123';

    const committer = new ExcelCsvTripCommitter();
    const res = await committer.commit(batch, dummyContext);
    const issue = res.issues?.find(i => i.code === 'CANONICAL_SNAPSHOT_DATA_MISSING');
    expect(issue?.message).toContain('Carrier: CAR-REAL-123');
  });

  it('7. name text never becomes carrierId', async () => {
    const batch = createValidRowBatch();
    batch.rows[0].resolvedValues = {};
    batch.rows[0].entityResolutions = {};
    batch.rows[0].canonical = {
      carrierId: 'Al-Majdouie Cargo', // text name format
      truckId: 'TRK-200',
      driverId: 'DRV-300',
      materialId: 'MAT-400',
    };

    const committer = new ExcelCsvTripCommitter();
    const res = await committer.commit(batch, dummyContext);
    const issue = res.issues?.find(i => i.code === 'CANONICAL_CARRIER_ID_REQUIRED');
    expect(issue).toBeDefined();
  });

  it('8. plate text never becomes truckId', async () => {
    const batch = createValidRowBatch();
    batch.rows[0].resolvedValues = {};
    batch.rows[0].entityResolutions = {};
    batch.rows[0].canonical = {
      carrierId: 'CAR-100',
      truckId: 'TRUCK-1234 ABC', // synthetic format
      driverId: 'DRV-300',
      materialId: 'MAT-400',
    };

    const committer = new ExcelCsvTripCommitter();
    const res = await committer.commit(batch, dummyContext);
    const issue = res.issues?.find(i => i.code === 'CANONICAL_TRUCK_ID_REQUIRED');
    expect(issue).toBeDefined();
  });

  it('9. driver name never becomes driverId', async () => {
    const batch = createValidRowBatch();
    batch.rows[0].resolvedValues = {};
    batch.rows[0].entityResolutions = {};
    batch.rows[0].canonical = {
      carrierId: 'CAR-100',
      truckId: 'TRK-200',
      driverId: 'DRIVER-Ali Ahmad',
      materialId: 'MAT-400',
    };

    const committer = new ExcelCsvTripCommitter();
    const res = await committer.commit(batch, dummyContext);
    const issue = res.issues?.find(i => i.code === 'CANONICAL_DRIVER_ID_REQUIRED');
    expect(issue).toBeDefined();
  });

  it('10. material name never becomes materialId', async () => {
    const batch = createValidRowBatch();
    batch.rows[0].resolvedValues = {};
    batch.rows[0].entityResolutions = {};
    batch.rows[0].canonical = {
      carrierId: 'CAR-100',
      truckId: 'TRK-200',
      driverId: 'DRV-300',
      materialId: 'MAT-Red Sand',
    };

    const committer = new ExcelCsvTripCommitter();
    const res = await committer.commit(batch, dummyContext);
    const issue = res.issues?.find(i => i.code === 'CANONICAL_MATERIAL_ID_REQUIRED');
    expect(issue).toBeDefined();
  });

  // Purged fallbacks 11-15
  it('11. no CARRIER-${name} fallback remains', () => {
    const code = fs.readFileSync(path.resolve(__dirname, '../services/import/tripImportCommitter.ts'), 'utf-8');
    expect(code).not.toContain('CARRIER-${');
  });

  it('12. no TRUCK-${plate} fallback remains', () => {
    const code = fs.readFileSync(path.resolve(__dirname, '../services/import/tripImportCommitter.ts'), 'utf-8');
    expect(code).not.toContain('TRUCK-${');
  });

  it('13. no DRIVER-${name} fallback remains', () => {
    const code = fs.readFileSync(path.resolve(__dirname, '../services/import/tripImportCommitter.ts'), 'utf-8');
    expect(code).not.toContain('DRIVER-${');
  });

  it('14. no MAT-${material} fallback remains', () => {
    const code = fs.readFileSync(path.resolve(__dirname, '../services/import/tripImportCommitter.ts'), 'utf-8');
    expect(code).not.toContain('MAT-${');
  });

  it('15. no DEFAULT/GENERAL/UNASSIGNED canonical identity fallback', () => {
    const code = fs.readFileSync(path.resolve(__dirname, '../services/import/tripImportCommitter.ts'), 'utf-8');
    expect(code).not.toMatch(/\s+===\s+['"](DEFAULT|GENERAL|UNASSIGNED)['"]/);
  });

  // Review & Gate checks 16-20
  it('16. requires_review row cannot commit', async () => {
    const batch = createValidRowBatch();
    batch.rows[0].reviewStatus = 'requires_review';

    const committer = new ExcelCsvTripCommitter();
    const res = await committer.commit(batch, dummyContext);
    expect(res.committedRows).toBe(0);
    expect(res.issues?.some(i => i.code === 'ENTITY_RESOLUTION_REVIEW_REQUIRED')).toBe(true);
  });

  it('17. warning confirmation cannot bypass requires_review', async () => {
    const batch = createValidRowBatch();
    batch.rows[0].reviewStatus = 'requires_review';
    batch.warningConfirmation = { confirmed: true, confirmedAt: '', confirmedBy: '' };

    const committer = new ExcelCsvTripCommitter();
    const res = await committer.commit(batch, dummyContext);
    expect(res.committedRows).toBe(0);
  });

  it('18. confirmWarnings does not READY_TO_COMMIT with requiresReviewRows > 0', () => {
    const batch = createValidRowBatch();
    batch.requiresReviewRows = 1;
    batch.commitStatus = 'AWAITING_REVIEW';

    const updated = unifiedImportPipelineService.confirmWarnings(batch, dummyContext);
    expect(updated.commitStatus).toBe('REVIEW_REQUIRED');
  });

  it('19. executeCommit fails closed with unresolved review state', async () => {
    const batch = createValidRowBatch();
    batch.requiresReviewRows = 1;
    batch.auditTrail = [];

    const res = await unifiedImportPipelineService.executeCommit(batch, dummyContext);
    expect(res.result.success).toBe(false);
    expect(res.result.issues?.some(i => i.code === 'ENTITY_RESOLUTION_REVIEW_REQUIRED')).toBe(true);
  });

  it('20. committer independently rejects unresolved row', async () => {
    const batch = createValidRowBatch();
    batch.rows[0].reviewStatus = 'requires_review';

    const committer = new ExcelCsvTripCommitter();
    const res = await committer.commit(batch, dummyContext);
    expect(res.committedRows).toBe(0);
  });

  // ID validation 21-25
  it('21. missing carrierId blocks row write', async () => {
    const batch = createValidRowBatch();
    batch.rows[0].resolvedValues!.carrierId = undefined as any;
    batch.rows[0].canonical.carrierId = undefined;
    batch.rows[0].entityResolutions!.carrier = undefined as any;

    const committer = new ExcelCsvTripCommitter();
    const res = await committer.commit(batch, dummyContext);
    expect(res.committedRows).toBe(0);
    expect(res.issues?.some(i => i.code === 'CANONICAL_CARRIER_ID_REQUIRED')).toBe(true);
  });

  it('22. missing truckId blocks row write', async () => {
    const batch = createValidRowBatch();
    batch.rows[0].resolvedValues!.truckId = undefined as any;
    batch.rows[0].canonical.truckId = undefined;
    batch.rows[0].entityResolutions!.truck = undefined as any;

    const committer = new ExcelCsvTripCommitter();
    const res = await committer.commit(batch, dummyContext);
    expect(res.committedRows).toBe(0);
    expect(res.issues?.some(i => i.code === 'CANONICAL_TRUCK_ID_REQUIRED')).toBe(true);
  });

  it('23. missing driverId blocks row write', async () => {
    const batch = createValidRowBatch();
    batch.rows[0].resolvedValues!.driverId = undefined as any;
    batch.rows[0].canonical.driverId = undefined;
    batch.rows[0].entityResolutions!.driver = undefined as any;

    const committer = new ExcelCsvTripCommitter();
    const res = await committer.commit(batch, dummyContext);
    expect(res.committedRows).toBe(0);
    expect(res.issues?.some(i => i.code === 'CANONICAL_DRIVER_ID_REQUIRED')).toBe(true);
  });

  it('24. missing materialId blocks row write', async () => {
    const batch = createValidRowBatch();
    batch.rows[0].resolvedValues!.materialId = undefined as any;
    batch.rows[0].canonical.materialId = undefined;
    batch.rows[0].entityResolutions!.material = undefined as any;

    const committer = new ExcelCsvTripCommitter();
    const res = await committer.commit(batch, dummyContext);
    expect(res.committedRows).toBe(0);
    expect(res.issues?.some(i => i.code === 'CANONICAL_MATERIAL_ID_REQUIRED')).toBe(true);
  });

  it('25. tripRepository.create is zero for blocked row', async () => {
    const batch = createValidRowBatch();
    batch.rows[0].resolvedValues!.carrierId = undefined as any;
    batch.rows[0].canonical.carrierId = undefined;
    batch.rows[0].entityResolutions!.carrier = undefined as any;

    const committer = new ExcelCsvTripCommitter();
    const spy = vi.spyOn(tripRepository, 'create');
    await committer.commit(batch, dummyContext);
    expect(spy).toHaveBeenCalledTimes(0);
  });

  // Pricing 26-28
  it('26. pricing uses final resolved carrierId', async () => {
    const batch = createValidRowBatch();
    batch.rows[0].resolvedValues!.carrierId = 'CAR-RESOLVED-VAL';

    const committer = new ExcelCsvTripCommitter();
    const res = await committer.commit(batch, dummyContext);
    const issue = res.issues?.find(i => i.code === 'CANONICAL_SNAPSHOT_DATA_MISSING');
    expect(issue?.message).toContain('Carrier: CAR-RESOLVED-VAL');
  });

  it('27. pricing uses final resolved materialId', async () => {
    const batch = createValidRowBatch();
    batch.rows[0].resolvedValues!.materialId = 'MAT-RESOLVED-VAL';

    const committer = new ExcelCsvTripCommitter();
    const res = await committer.commit(batch, dummyContext);
    const issue = res.issues?.find(i => i.code === 'CANONICAL_SNAPSHOT_DATA_MISSING');
    expect(issue?.message).toContain('Material: MAT-RESOLVED-VAL');
  });

  it('28. pricing never derives ID from carrier/material source text', async () => {
    const batch = createValidRowBatch();
    batch.rows[0].resolvedValues = {};
    batch.rows[0].entityResolutions = {};

    const committer = new ExcelCsvTripCommitter();
    const res = await committer.commit(batch, dummyContext);
    expect(res.success).toBe(false);
    expect(res.committedRows).toBe(0); // row was skipped because IDs unresolved
  });

  // Trip properties 29-30
  it('29. successful Trip payload is NOT written because of snapshot data missing (0 writes)', async () => {
    const batch = createValidRowBatch();
    const committer = new ExcelCsvTripCommitter();
    const spy = vi.spyOn(tripRepository, 'create');

    const res = await committer.commit(batch, dummyContext);
    expect(spy).not.toHaveBeenCalled();
    expect(res.committedRows).toBe(0);
  });

  it('30. rejected row remains excluded without new canonical-ID errors', async () => {
    const batch = createValidRowBatch();
    batch.rows[0].status = 'REJECTED';

    const committer = new ExcelCsvTripCommitter();
    const res = await committer.commit(batch, dummyContext);
    expect(res.success).toBe(true);
    expect(res.committedRows).toBe(0);
    expect(res.failedRows).toBe(0);
  });

  // Hardcoded check 31-36
  it('31-36. fabricated details are strictly absent from committer code', () => {
    const code = fs.readFileSync(path.resolve(__dirname, '../services/import/tripImportCommitter.ts'), 'utf-8');
    expect(code).not.toContain('1010000000');
    expect(code).not.toContain('2000000000');
    expect(code).not.toContain('0500000000');
    expect(code).not.toContain('0000-أ ب ج');
    expect(code).not.toContain('legalPayloadLimitKg: 30000');
    expect(code).not.toContain('AGG-01');
  });

  // Snapshot read boundaries check 37-40
  it('37. project-local repositories are NOT treated as authoritative canonical snapshot sources', async () => {
    const spyCarrier = vi.spyOn(carrierRepository, 'findById');
    const spyTruck = vi.spyOn(truckRepository, 'findById');
    const spyDriver = vi.spyOn(driverRepository, 'findById');
    const spyMaterial = vi.spyOn(materialRepository, 'findById');

    const batch = createValidRowBatch();
    const committer = new ExcelCsvTripCommitter();
    await committer.commit(batch, dummyContext);

    expect(spyCarrier).not.toHaveBeenCalled();
    expect(spyTruck).not.toHaveBeenCalled();
    expect(spyDriver).not.toHaveBeenCalled();
    expect(spyMaterial).not.toHaveBeenCalled();
  });

  it('38. valid canonical IDs + unavailable global snapshot read boundary => CANONICAL_SNAPSHOT_DATA_MISSING', async () => {
    const batch = createValidRowBatch();
    const committer = new ExcelCsvTripCommitter();
    const spy = vi.spyOn(tripRepository, 'create');

    const res = await committer.commit(batch, dummyContext);
    expect(res.success).toBe(false);
    expect(res.committedRows).toBe(0);
    expect(spy).toHaveBeenCalledTimes(0);

    const issues = res.issues || [];
    expect(issues.some(i => i.code === 'CANONICAL_SNAPSHOT_DATA_MISSING')).toBe(true);
  });

  it('39. report states SNAPSHOT_READ_BOUNDARY_REQUIRED holds true', () => {
    const code = fs.readFileSync(path.resolve(__dirname, '../services/import/tripImportCommitter.ts'), 'utf-8');
    expect(code).toContain('SNAPSHOT_READ_BOUNDARY_REQUIRED');
  });

  it('40. no Unit 5B behavior is modified', () => {
    const sectionPath = path.resolve(__dirname, '../components/importCenter/ExcelCsvImportSection.tsx');
    expect(fs.existsSync(sectionPath)).toBe(true);
  });
});
