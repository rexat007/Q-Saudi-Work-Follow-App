import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ExcelCsvTripCommitter } from '../services/import/tripImportCommitter';
import { canonicalSnapshotClientService } from '../services/import/canonicalSnapshotClient.service';
import { tripRepository } from '../repositories/trip.repository';
import { UnifiedImportBatch, PipelineContext } from '../types/unifiedImport';
import { unifiedImportPipelineService, UnifiedImportPipelineService } from '../services/import/unifiedImportPipeline.service';
import * as fs from 'fs';
import * as path from 'path';

describe('Trip Write Failure Integrity (Unit 6)', () => {
  const mockSnapshot = {
    projectId: 'PRJ-1',
    carrierSnapshot: { carrierId: 'CAR-1', companyNameAr: 'شركة مخصصة للناقل', commercialRegistrationNo: '1234567890' },
    truckSnapshot: { truckId: 'TRK-1', plateNumberAr: 'س ص ع 9999', tareWeightKg: 14500, legalPayloadLimitKg: 24000 },
    driverSnapshot: { driverId: 'DRV-1', fullNameAr: 'سعيد عاصم', nationalOrIqamaId: '1100998877', phone: '0599887766' },
    materialSnapshot: { materialId: 'MAT-1', code: 'CODE-SUPER-RED', nameAr: 'رمل أحمر فائق الجودة', unitOfMeasure: 'TON' },
  };

  const sampleContext: PipelineContext = {
    userId: 'USER-DISPATCHER-01',
    userName: 'Test Dispatcher',
    role: 'DISPATCHER',
    assignedProjectIds: ['PRJ-1'],
    projectId: 'PRJ-1',
    operationId: 'OP-1234',
  };

  const getSingleRowBatch = (): UnifiedImportBatch => ({
    importBatchId: 'BCH-TEST-001',
    projectId: 'PRJ-1',
    batchType: 'WEIGHBRIDGE_IMPORT',
    totalRows: 1,
    committedRows: 0,
    skippedRows: 0,
    failedRows: 0,
    errorRows: 0,
    warningRows: 0,
    status: 'PENDING',
    source: {
      sourceType: 'WEIGHBRIDGE',
      sourceFileId: 'FILE-1',
      sourceFileName: 'tickets.xlsx',
      sourceMimeType: 'application/vnd.ms-excel',
    },
    rows: [
      {
        rowNumber: 1,
        sourceRowId: 1,
        status: 'PENDING',
        reviewStatus: 'matched',
        resolvedValues: {
          carrierId: 'CAR-1',
          truckId: 'TRK-1',
          driverId: 'DRV-1',
          materialId: 'MAT-1',
        },
        mapped: {
          ticketId: 'TKT-900',
          tareWeight: 15000,
          grossWeight: 35000,
          netWeight: 20000,
        },
      },
    ],
    issues: [],
    auditTrail: [],
    createdAt: '2026-01-01',
    createdBy: 'USER-1',
    updatedAt: '2026-01-01',
    updatedBy: 'USER-1',
  });

  const getTwoRowBatch = (): UnifiedImportBatch => ({
    importBatchId: 'BCH-TEST-002',
    projectId: 'PRJ-1',
    batchType: 'WEIGHBRIDGE_IMPORT',
    totalRows: 2,
    committedRows: 0,
    skippedRows: 0,
    failedRows: 0,
    errorRows: 0,
    warningRows: 0,
    status: 'PENDING',
    source: {
      sourceType: 'WEIGHBRIDGE',
      sourceFileId: 'FILE-1',
      sourceFileName: 'tickets.xlsx',
      sourceMimeType: 'application/vnd.ms-excel',
    },
    rows: [
      {
        rowNumber: 1,
        sourceRowId: 1,
        status: 'PENDING',
        reviewStatus: 'matched',
        resolvedValues: {
          carrierId: 'CAR-1',
          truckId: 'TRK-1',
          driverId: 'DRV-1',
          materialId: 'MAT-1',
        },
        mapped: {
          ticketId: 'TKT-901',
          tareWeight: 15000,
          grossWeight: 35000,
          netWeight: 20000,
        },
      },
      {
        rowNumber: 2,
        sourceRowId: 2,
        status: 'PENDING',
        reviewStatus: 'matched',
        resolvedValues: {
          carrierId: 'CAR-1',
          truckId: 'TRK-1',
          driverId: 'DRV-1',
          materialId: 'MAT-1',
        },
        mapped: {
          ticketId: 'TKT-902',
          tareWeight: 16000,
          grossWeight: 36000,
          netWeight: 20000,
        },
      },
    ],
    issues: [],
    auditTrail: [],
    createdAt: '2026-01-01',
    createdBy: 'USER-1',
    updatedAt: '2026-01-01',
    updatedBy: 'USER-1',
  });

  beforeEach(() => {
    vi.restoreAllMocks();
    ExcelCsvTripCommitter.resetIdempotencyCache();
    vi.spyOn(canonicalSnapshotClientService, 'getTripCanonicalSnapshot').mockResolvedValue(mockSnapshot);
  });

  it('1. tripRepository.create success -> tripId counted committed', async () => {
    const spyCreate = vi.spyOn(tripRepository, 'create').mockResolvedValue({} as any);
    const committer = new ExcelCsvTripCommitter();
    const batch = getSingleRowBatch();
    const result = await committer.commit(batch, sampleContext);

    expect(spyCreate).toHaveBeenCalled();
    expect(result.committedRows).toBe(1);
    expect(result.committedEntityIds).toHaveLength(1);
    expect(result.success).toBe(true);
  });

  it('2. successful write -> row.status COMMITTED', async () => {
    const spyCreate = vi.spyOn(tripRepository, 'create').mockResolvedValue({} as any);
    const committer = new ExcelCsvTripCommitter();
    const batch = getSingleRowBatch();
    await committer.commit(batch, sampleContext);

    expect(batch.rows[0].status).toBe('COMMITTED');
  });

  it('3. tripRepository.create throws -> tripId NOT counted', async () => {
    const spyCreate = vi.spyOn(tripRepository, 'create').mockRejectedValue(new Error('FIRESTORE_WRITE_ERROR'));
    const committer = new ExcelCsvTripCommitter();
    const batch = getSingleRowBatch();
    const result = await committer.commit(batch, sampleContext);

    expect(result.committedRows).toBe(0);
    expect(result.committedEntityIds).toHaveLength(0);
  });

  it('4. thrown write -> row.status NOT COMMITTED', async () => {
    const spyCreate = vi.spyOn(tripRepository, 'create').mockRejectedValue(new Error('FIRESTORE_WRITE_ERROR'));
    const committer = new ExcelCsvTripCommitter();
    const batch = getSingleRowBatch();
    await committer.commit(batch, sampleContext);

    expect(batch.rows[0].status).not.toBe('COMMITTED');
  });

  it('5. thrown write -> TRIP_PERSISTENCE_FAILED blocking issue recorded', async () => {
    const spyCreate = vi.spyOn(tripRepository, 'create').mockRejectedValue(new Error('FIRESTORE_WRITE_ERROR'));
    const committer = new ExcelCsvTripCommitter();
    const batch = getSingleRowBatch();
    const result = await committer.commit(batch, sampleContext);

    const issue = result.issues?.find(i => i.code === 'TRIP_PERSISTENCE_FAILED');
    expect(issue).toBeDefined();
    expect(issue?.blocking).toBe(true);
    expect(issue?.severity).toBe('BLOCKING');
    expect(issue?.row).toBe(1);
  });

  it('6. thrown write -> failedRows increments', async () => {
    const spyCreate = vi.spyOn(tripRepository, 'create').mockRejectedValue(new Error('FIRESTORE_WRITE_ERROR'));
    const committer = new ExcelCsvTripCommitter();
    const batch = getSingleRowBatch();
    const result = await committer.commit(batch, sampleContext);

    expect(result.failedRows).toBe(1);
  });

  it('7. thrown write -> committedRows remains 0 for single-row batch', async () => {
    const spyCreate = vi.spyOn(tripRepository, 'create').mockRejectedValue(new Error('FIRESTORE_WRITE_ERROR'));
    const committer = new ExcelCsvTripCommitter();
    const batch = getSingleRowBatch();
    const result = await committer.commit(batch, sampleContext);

    expect(result.committedRows).toBe(0);
  });

  it('8. single eligible row write failure -> result.success === false', async () => {
    const spyCreate = vi.spyOn(tripRepository, 'create').mockRejectedValue(new Error('FIRESTORE_WRITE_ERROR'));
    const committer = new ExcelCsvTripCommitter();
    const batch = getSingleRowBatch();
    const result = await committer.commit(batch, sampleContext);

    expect(result.success).toBe(false);
  });

  it('9. two rows: one succeeds, one fails -> committedRows === 1 and success === false', async () => {
    const spyCreate = vi.spyOn(tripRepository, 'create')
      .mockResolvedValueOnce({} as any)
      .mockRejectedValueOnce(new Error('FIRESTORE_WRITE_ERROR'));

    const committer = new ExcelCsvTripCommitter();
    const batch = getTwoRowBatch();
    const result = await committer.commit(batch, sampleContext);

    expect(result.committedRows).toBe(1);
    expect(result.failedRows).toBe(1);
    expect(result.success).toBe(false);
  });

  it('10. failed row is not in committedEntityIds', async () => {
    const spyCreate = vi.spyOn(tripRepository, 'create')
      .mockResolvedValueOnce({} as any)
      .mockRejectedValueOnce(new Error('FIRESTORE_WRITE_ERROR'));

    const committer = new ExcelCsvTripCommitter();
    const batch = getTwoRowBatch();
    const result = await committer.commit(batch, sampleContext);

    expect(result.committedEntityIds).toHaveLength(1);
    expect(result.committedEntityIds?.[0]).toBe('TRP-IMP-ST-002-1');
  });

  it('11. successful row remains in committedEntityIds', async () => {
    const spyCreate = vi.spyOn(tripRepository, 'create')
      .mockResolvedValueOnce({} as any)
      .mockRejectedValueOnce(new Error('FIRESTORE_WRITE_ERROR'));

    const committer = new ExcelCsvTripCommitter();
    const batch = getTwoRowBatch();
    const result = await committer.commit(batch, sampleContext);

    expect(result.committedEntityIds).toContain('TRP-IMP-ST-002-1');
  });

  it('12. snapshot failure still causes zero tripRepository.create', async () => {
    vi.spyOn(canonicalSnapshotClientService, 'getTripCanonicalSnapshot').mockRejectedValue(new Error('SNAPSHOT_FETCH_FAILED'));
    const spyCreate = vi.spyOn(tripRepository, 'create');

    const committer = new ExcelCsvTripCommitter();
    const batch = getSingleRowBatch();
    const result = await committer.commit(batch, sampleContext);

    expect(spyCreate).not.toHaveBeenCalled();
    expect(result.committedRows).toBe(0);
    expect(result.failedRows).toBe(1);
    expect(result.success).toBe(false);
  });

  it('13. missing canonical ID still causes zero tripRepository.create', async () => {
    const spyCreate = vi.spyOn(tripRepository, 'create');

    const committer = new ExcelCsvTripCommitter();
    const batch = getSingleRowBatch();
    batch.rows[0].resolvedValues = {
      carrierId: '', // missing
      truckId: 'TRK-1',
      driverId: 'DRV-1',
      materialId: 'MAT-1',
    };
    const result = await committer.commit(batch, sampleContext);

    expect(spyCreate).not.toHaveBeenCalled();
    expect(result.committedRows).toBe(0);
    expect(result.success).toBe(false);
  });

  it('14. no catch block may swallow repository failure and then mark row COMMITTED', () => {
    const committerCode = fs.readFileSync(path.resolve(__dirname, '../services/import/tripImportCommitter.ts'), 'utf8');
    
    // Find tripRepository.create
    const writeIndex = committerCode.indexOf('tripRepository.create(');
    expect(writeIndex).toBeGreaterThan(-1);
    
    const catchIndex = committerCode.indexOf('catch (err: any) {', writeIndex);
    const commitedPushIndex = committerCode.indexOf('committedTripIds.push(tripId);', writeIndex);
    
    expect(commitedPushIndex).toBeLessThan(catchIndex);
  });

  it('15. executeCommit does not mark a fully failed batch COMMITTED', async () => {
    const spyCreate = vi.spyOn(tripRepository, 'create').mockRejectedValue(new Error('FIRESTORE_WRITE_ERROR'));
    const batch = getSingleRowBatch();
    
    const pipeline = new UnifiedImportPipelineService({
      committer: new ExcelCsvTripCommitter(),
    });
    const { batch: finalBatch, result } = await pipeline.executeCommit(batch, sampleContext);
    
    expect(result.success).toBe(false);
    expect(finalBatch.commitStatus).toBe('FAILED');
  });

  it('16. explicitly rejected-only batch with no commit attempts/errors does not become false merely because committedRows is zero', async () => {
    const spyCreate = vi.spyOn(tripRepository, 'create');
    const batch = getSingleRowBatch();
    batch.rows[0].status = 'REJECTED';
    batch.rows[0].reviewStatus = 'error';

    const committer = new ExcelCsvTripCommitter();
    const result = await committer.commit(batch, sampleContext);

    expect(spyCreate).not.toHaveBeenCalled();
    expect(result.committedRows).toBe(0);
    expect(result.failedRows).toBe(0);
    expect(result.success).toBe(true);
  });

  it('17. ZERO production references to PRJ-NEOM-CONVERGE in tripImportCommitter.ts', () => {
    const committerCode = fs.readFileSync(path.resolve(__dirname, '../services/import/tripImportCommitter.ts'), 'utf8');
    expect(committerCode).not.toContain('PRJ-NEOM-CONVERGE');
  });

  it('18. partial failure marks only successfully written row COMMITTED and leaves failed row uncommitted', async () => {
    const spyCreate = vi.spyOn(tripRepository, 'create')
      .mockResolvedValueOnce({} as any)
      .mockRejectedValueOnce(new Error('NETWORK_TIMEOUT'));

    const committer = new ExcelCsvTripCommitter();
    const batch = getTwoRowBatch();
    const result = await committer.commit(batch, sampleContext);

    expect(batch.rows[0].status).toBe('COMMITTED');
    expect(batch.rows[1].status).not.toBe('COMMITTED');
    expect(result.success).toBe(false);
    expect(result.committedRows).toBe(1);
    expect(result.failedRows).toBe(1);
  });

  it('19. retry after partial failure excludes already COMMITTED rows from re-creation', async () => {
    const spyCreate = vi.spyOn(tripRepository, 'create')
      .mockResolvedValueOnce({} as any) // first call: row 1 succeeds
      .mockRejectedValueOnce(new Error('NETWORK_TIMEOUT')) // first call: row 2 fails
      .mockResolvedValueOnce({} as any); // second call (retry): row 2 succeeds

    const committer = new ExcelCsvTripCommitter();
    const batch = getTwoRowBatch();

    // First attempt (partial failure)
    const result1 = await committer.commit(batch, sampleContext);
    expect(result1.success).toBe(false);
    expect(batch.rows[0].status).toBe('COMMITTED');
    expect(batch.rows[1].status).not.toBe('COMMITTED');
    expect(spyCreate).toHaveBeenCalledTimes(2);

    // Second attempt (retry on same batch with row 0 already COMMITTED)
    const result2 = await committer.commit(batch, sampleContext);
    expect(result2.success).toBe(true);
    expect(result2.committedRows).toBe(1); // row 2 committed
    expect(result2.failedRows).toBe(0);
    expect(batch.rows[1].status).toBe('COMMITTED');
    // spyCreate called 1 additional time for row 2 only, NOT for row 1
    expect(spyCreate).toHaveBeenCalledTimes(3);
  });

  it('20. partial result does not poison idempotency cache and allows subsequent retry to succeed', async () => {
    const spyCreate = vi.spyOn(tripRepository, 'create')
      .mockRejectedValueOnce(new Error('TRANSIENT_DB_ERROR'))
      .mockResolvedValueOnce({} as any);

    const committer = new ExcelCsvTripCommitter();
    const batch = getSingleRowBatch();

    // 1st attempt: fails
    const res1 = await committer.commit(batch, sampleContext);
    expect(res1.success).toBe(false);

    // 2nd attempt: does NOT return cached res1; retries and succeeds!
    const res2 = await committer.commit(batch, sampleContext);
    expect(res2.success).toBe(true);
    expect(res2.committedRows).toBe(1);

    // 3rd attempt: fully successful result IS cached and idempotent
    const res3 = await committer.commit(batch, sampleContext);
    expect(res3.success).toBe(true);
    expect(spyCreate).toHaveBeenCalledTimes(2); // not called a 3rd time
  });
});
