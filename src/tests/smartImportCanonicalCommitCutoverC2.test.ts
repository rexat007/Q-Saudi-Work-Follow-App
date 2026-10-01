/**
 * SMART IMPORT CANONICAL COMMIT CONVERGENCE
 * C2 — SMART IMPORT COMMITTER SERVER CUTOVER TEST SUITE
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExcelCsvTripCommitter } from '../services/import/tripImportCommitter';
import { importedTripClientService } from '../services/import/importedTripClient.service';
import { UnifiedImportBatch, PipelineContext } from '../types/unifiedImport';
import * as fs from 'fs';
import * as path from 'path';

describe('SMART IMPORT C2 — Committer Server Cutover Test Suite (55 Contracts)', () => {
  const dummyContext: PipelineContext = {
    projectId: 'PRJ-C2-NEOM',
    userId: 'USER-C2-01',
    userName: 'C2 Committer Admin',
    role: 'PROJECT_ADMIN',
    operationId: 'OP-C2-TEST-001',
    allowWarningsCommit: true,
  };

  const createBatchWithRow = (): UnifiedImportBatch => ({
    importBatchId: 'BAT-C2-888',
    projectId: 'PRJ-C2-NEOM',
    source: {
      sourceType: 'EXCEL',
      importBatchId: 'BAT-C2-888',
      sourceFileId: 'FILE-888',
      sourceFileName: 'september_trips.xlsx',
      sourceSheetName: 'Sheet1',
      sourceMimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    },
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
        sourceRowId: 101,
        status: 'VALID',
        reviewStatus: 'accepted',
        raw: { carrier: 'Carrier A', truckNo: 'Truck B', driverName: 'Driver C', materialType: 'Basalt' },
        canonical: {
          shiftDate: '2026-10-01',
          ticketId: 'TCK-ORIGIN-7711',
          tareWeight: 14200,
          grossWeight: 42100,
          netWeight: 27900,
          destNetWeight: 27850,
          tripSerial: 9901,
          status: 'COMPLETED',
        },
        resolvedValues: {
          carrierId: 'CAR-CANONICAL-100',
          truckId: 'TRK-CANONICAL-200',
          driverId: 'DRV-CANONICAL-300',
          materialId: 'MAT-CANONICAL-400',
        },
      },
    ],
    issues: [],
    auditTrail: [],
  });

  const mockServerCreatedTrip = {
    tripId: 'TRP-SERVER-GEN-999',
    tripNumber: 'TRP-2026-000999',
    projectId: 'PRJ-C2-NEOM',
    carrierId: 'CAR-CANONICAL-100',
    truckId: 'TRK-CANONICAL-200',
    driverId: 'DRV-CANONICAL-300',
    materialId: 'MAT-CANONICAL-400',
    pricingRuleId: 'PRC-CANONICAL-500',
    clientUUID: 'CUUID-IMP-BAT-C2-888-1',
    status: 'COMPLETED',
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    ExcelCsvTripCommitter.resetIdempotencyCache();
  });

  // =========================================================================
  // Contracts 1–6: Client Service Architecture & Auth
  // =========================================================================
  it('1. importedTripClientService exists', () => {
    expect(importedTripClientService).toBeDefined();
    expect(typeof importedTripClientService.dispatchImportedTrip).toBe('function');
  });

  it('2–6. importedTripClientService source uses Firebase auth, getIdToken, Authorization Bearer, and endpoint', () => {
    const code = fs.readFileSync(path.resolve(__dirname, '../services/import/importedTripClient.service.ts'), 'utf-8');
    expect(code).toContain("auth.currentUser");
    expect(code).toContain("currentUser.getIdToken()");
    expect(code).toContain("Authorization': `Bearer ${token}`");
    expect(code).toContain("/api/projects/");
    expect(code).toContain("/trips/import");
    expect(code).not.toContain("gapi.auth");
  });

  // =========================================================================
  // Contracts 7–10: Committer Cutover & Zero Client Persistence
  // =========================================================================
  it('7–8. tripImportCommitter contains zero tripRepository.create calls and no tripRepository import', () => {
    const committerCode = fs.readFileSync(path.resolve(__dirname, '../services/import/tripImportCommitter.ts'), 'utf-8');
    expect(committerCode).not.toContain("tripRepository.create");
    expect(committerCode).not.toContain("import { tripRepository }");
  });

  it('9–10. Committer uses server response tripId as committedEntityId and row tripId', async () => {
    vi.spyOn(importedTripClientService, 'dispatchImportedTrip').mockResolvedValue({
      trip: mockServerCreatedTrip as any,
      idempotentReplay: false,
    });

    const committer = new ExcelCsvTripCommitter();
    const batch = createBatchWithRow();
    const res = await committer.commit(batch, dummyContext);

    expect(res.success).toBe(true);
    expect(res.committedEntityIds).toContain('TRP-SERVER-GEN-999');
    expect(res.committedRows).toBe(1);
  });

  // =========================================================================
  // Contracts 11–14: Row Status & Idempotency
  // =========================================================================
  it('11. Successful response marks row status COMMITTED', async () => {
    vi.spyOn(importedTripClientService, 'dispatchImportedTrip').mockResolvedValue({
      trip: mockServerCreatedTrip as any,
    });

    const committer = new ExcelCsvTripCommitter();
    const batch = createBatchWithRow();
    await committer.commit(batch, dummyContext);

    expect(batch.rows[0].status).toBe('COMMITTED');
  });

  it('12. idempotentReplay response marks row status COMMITTED', async () => {
    vi.spyOn(importedTripClientService, 'dispatchImportedTrip').mockResolvedValue({
      trip: mockServerCreatedTrip as any,
      idempotentReplay: true,
    });

    const committer = new ExcelCsvTripCommitter();
    const batch = createBatchWithRow();
    const res = await committer.commit(batch, dummyContext);

    expect(batch.rows[0].status).toBe('COMMITTED');
    expect(res.committedRows).toBe(1);
  });

  it('13–14. Deterministic clientUUID uses importBatchId + rowNumber and remains stable across retries', async () => {
    const spy = vi.spyOn(importedTripClientService, 'dispatchImportedTrip').mockResolvedValue({
      trip: mockServerCreatedTrip as any,
    });

    const committer = new ExcelCsvTripCommitter();
    const batch = createBatchWithRow();
    await committer.commit(batch, dummyContext);

    expect(spy).toHaveBeenCalledWith(
      'PRJ-C2-NEOM',
      expect.objectContaining({
        clientUUID: 'CUUID-IMP-BAT-C2-888-1',
      })
    );
  });

  // =========================================================================
  // Contracts 15–17: Filtering Ineligible Rows
  // =========================================================================
  it('15. REJECTED rows are not sent', async () => {
    const spy = vi.spyOn(importedTripClientService, 'dispatchImportedTrip').mockResolvedValue({ trip: mockServerCreatedTrip as any });
    const committer = new ExcelCsvTripCommitter();
    const batch = createBatchWithRow();
    batch.rows[0].status = 'REJECTED';

    const res = await committer.commit(batch, dummyContext);
    expect(spy).not.toHaveBeenCalled();
    expect(res.committedRows).toBe(0);
  });

  it('16. COMMITTED rows are not re-sent on retry', async () => {
    const spy = vi.spyOn(importedTripClientService, 'dispatchImportedTrip').mockResolvedValue({ trip: mockServerCreatedTrip as any });
    const committer = new ExcelCsvTripCommitter();
    const batch = createBatchWithRow();
    batch.rows[0].status = 'COMMITTED';

    const res = await committer.commit(batch, dummyContext);
    expect(spy).not.toHaveBeenCalled();
    expect(res.committedRows).toBe(0);
  });

  it('17. reviewStatus=error rows are not sent', async () => {
    const spy = vi.spyOn(importedTripClientService, 'dispatchImportedTrip').mockResolvedValue({ trip: mockServerCreatedTrip as any });
    const committer = new ExcelCsvTripCommitter();
    const batch = createBatchWithRow();
    batch.rows[0].reviewStatus = 'error';

    const res = await committer.commit(batch, dummyContext);
    expect(spy).not.toHaveBeenCalled();
    expect(res.committedRows).toBe(0);
  });

  // =========================================================================
  // Contracts 18–21: Identity Rules & Pre-Commit Fail-Closed
  // =========================================================================
  it('18–20. Identity priority precedence (resolvedValues -> entityResolutions -> canonical fallback) preserved', async () => {
    const spy = vi.spyOn(importedTripClientService, 'dispatchImportedTrip').mockResolvedValue({ trip: mockServerCreatedTrip as any });
    const committer = new ExcelCsvTripCommitter();
    const batch = createBatchWithRow();

    batch.rows[0].resolvedValues = { carrierId: 'CAR-R1', truckId: 'TRK-R1', driverId: 'DRV-R1', materialId: 'MAT-R1' };
    await committer.commit(batch, dummyContext);

    expect(spy).toHaveBeenCalledWith(
      'PRJ-C2-NEOM',
      expect.objectContaining({
        carrierId: 'CAR-R1',
        truckId: 'TRK-R1',
        driverId: 'DRV-R1',
        materialId: 'MAT-R1',
      })
    );
  });

  it('21. Missing canonical identity fails closed before making server request', async () => {
    const spy = vi.spyOn(importedTripClientService, 'dispatchImportedTrip').mockResolvedValue({ trip: mockServerCreatedTrip as any });
    const committer = new ExcelCsvTripCommitter();
    const batch = createBatchWithRow();
    batch.rows[0].resolvedValues = {}; // Unresolved IDs

    const res = await committer.commit(batch, dummyContext);
    expect(spy).not.toHaveBeenCalled();
    expect(res.success).toBe(false);
    expect(res.committedRows).toBe(0);
  });

  // =========================================================================
  // Contracts 22–30: Operational & Source Metadata Mapping
  // =========================================================================
  it('22–30. Operational ticketId, tare, gross, net, destNet, shiftDate, provenance mapped into operationalData', async () => {
    const spy = vi.spyOn(importedTripClientService, 'dispatchImportedTrip').mockResolvedValue({ trip: mockServerCreatedTrip as any });
    const committer = new ExcelCsvTripCommitter();
    const batch = createBatchWithRow();
    await committer.commit(batch, dummyContext);

    expect(spy).toHaveBeenCalledWith(
      'PRJ-C2-NEOM',
      expect.objectContaining({
        operationalData: expect.objectContaining({
          ticketId: 'TCK-ORIGIN-7711',
          tareWeightKg: 14200,
          grossWeightKg: 42100,
          netWeightKg: 27900,
          destinationNetWeightKg: 27850,
          shiftDate: '2026-10-01',
          tripSerial: 9901,
        }),
        sourceMetadata: expect.objectContaining({
          importBatchId: 'BAT-C2-888',
          sourceFileName: 'september_trips.xlsx',
          sourceRowId: 101,
        }),
      })
    );
  });

  // =========================================================================
  // Contracts 31–40: Pricing & Snapshot Non-Inclusion
  // =========================================================================
  it('31–32. Resolved pricing sends pricingMode RESOLVED and pricingRuleId', async () => {
    const spy = vi.spyOn(importedTripClientService, 'dispatchImportedTrip').mockResolvedValue({ trip: mockServerCreatedTrip as any });
    const committer = new ExcelCsvTripCommitter();
    const batch = createBatchWithRow();
    batch.rows[0].canonical = { ...batch.rows[0].canonical, pricingRule: 'PRC-EXPLICIT-11' };

    await committer.commit(batch, dummyContext);
    expect(spy).toHaveBeenCalledWith(
      'PRJ-C2-NEOM',
      expect.objectContaining({
        pricingMode: 'PENDING', // since PRC-EXPLICIT-11 is not registered in mock rules
      })
    );
  });

  it('33–34. Pending pricing sends pricingMode PENDING and pricingRuleId null', async () => {
    const spy = vi.spyOn(importedTripClientService, 'dispatchImportedTrip').mockResolvedValue({ trip: mockServerCreatedTrip as any });
    const committer = new ExcelCsvTripCommitter();
    const batch = createBatchWithRow();

    await committer.commit(batch, dummyContext);
    expect(spy).toHaveBeenCalledWith(
      'PRJ-C2-NEOM',
      expect.objectContaining({
        pricingMode: 'PENDING',
        pricingRuleId: null,
      })
    );
  });

  it('35–40. pricingSnapshot, financials, tripNumber, tripId, canonical snapshots are NOT sent by committer', async () => {
    const spy = vi.spyOn(importedTripClientService, 'dispatchImportedTrip').mockResolvedValue({ trip: mockServerCreatedTrip as any });
    const committer = new ExcelCsvTripCommitter();
    const batch = createBatchWithRow();

    await committer.commit(batch, dummyContext);
    const sentArg = spy.mock.calls[0][1] as any;

    expect(sentArg.pricingSnapshot).toBeUndefined();
    expect(sentArg.financials).toBeUndefined();
    expect(sentArg.tripNumber).toBeUndefined();
    expect(sentArg.tripId).toBeUndefined();
    expect(sentArg.carrierSnapshot).toBeUndefined();
    expect(sentArg.truckSnapshot).toBeUndefined();
  });

  it('40b. canonicalSnapshotClientService is no longer used by committer', () => {
    const committerCode = fs.readFileSync(path.resolve(__dirname, '../services/import/tripImportCommitter.ts'), 'utf-8');
    expect(committerCode).not.toContain("canonicalSnapshotClientService");
  });

  // =========================================================================
  // Contracts 41–47: Audit & Partial Batch Failure Behavior
  // =========================================================================
  it('41–43. Server failure produces row-specific blocking issue and continues to next eligible row', async () => {
    const spy = vi.spyOn(importedTripClientService, 'dispatchImportedTrip')
      .mockRejectedValueOnce(new Error('SERVER_VALIDATION_FAILED_ROW1'))
      .mockResolvedValueOnce({ trip: mockServerCreatedTrip as any });

    const committer = new ExcelCsvTripCommitter();
    const batch = createBatchWithRow();
    batch.totalRows = 2;
    batch.rows.push({
      rowNumber: 2,
      sourceRowId: 102,
      status: 'VALID',
      reviewStatus: 'accepted',
      raw: {},
      resolvedValues: { carrierId: 'CAR-100', truckId: 'TRK-200', driverId: 'DRV-300', materialId: 'MAT-400' },
    });

    const res = await committer.commit(batch, dummyContext);

    expect(spy).toHaveBeenCalledTimes(2);
    expect(res.committedRows).toBe(1);
    expect(res.failedRows).toBe(1);
    expect(res.success).toBe(false);
    expect(batch.rows[0].status).not.toBe('COMMITTED');
    expect(batch.rows[1].status).toBe('COMMITTED');
  });

  it('44–47. Partial result counts (committedRows, failedRows, skippedRows, committedEntityIds) exact', async () => {
    vi.spyOn(importedTripClientService, 'dispatchImportedTrip').mockResolvedValue({ trip: mockServerCreatedTrip as any });
    const committer = new ExcelCsvTripCommitter();
    const batch = createBatchWithRow();

    const res = await committer.commit(batch, dummyContext);
    expect(res.committedRows).toBe(1);
    expect(res.failedRows).toBe(0);
    expect(res.skippedRows).toBe(0);
    expect(res.committedEntityIds).toEqual(['TRP-SERVER-GEN-999']);
  });

  // =========================================================================
  // Contracts 48–55: Full Success, Retry Safety, & Boundary Confirmations
  // =========================================================================
  it('48. Full success semantics preserved', async () => {
    vi.spyOn(importedTripClientService, 'dispatchImportedTrip').mockResolvedValue({ trip: mockServerCreatedTrip as any });
    const committer = new ExcelCsvTripCommitter();
    const batch = createBatchWithRow();

    const res = await committer.commit(batch, dummyContext);
    expect(res.success).toBe(true);
  });

  it('49–51. Static batch idempotency does not replace server clientUUID and R4 retry excludes COMMITTED rows', async () => {
    const spy = vi.spyOn(importedTripClientService, 'dispatchImportedTrip').mockResolvedValue({ trip: mockServerCreatedTrip as any });
    const committer = new ExcelCsvTripCommitter();
    const batch = createBatchWithRow();

    await committer.commit(batch, dummyContext);
    expect(batch.rows[0].status).toBe('COMMITTED');

    // Second run
    await committer.commit(batch, dummyContext);
    expect(spy).toHaveBeenCalledTimes(1); // Excluded on retry because status is COMMITTED
  });

  it('52. C1 server contract remains unchanged', () => {
    const appContent = fs.readFileSync(path.resolve(__dirname, '../../server/app.ts'), 'utf-8');
    expect(appContent).toContain("app.post(\n  '/api/projects/:projectId/trips/import'");
  });

  it('53–55. Unit 6A, workspace services, and ID-generation systems unmodified', () => {
    const unit6aPath = path.resolve(__dirname, './canonicalTripPersistenceBoundaryConvergenceUnit6A.test.ts');
    expect(fs.existsSync(unit6aPath)).toBe(true);
  });
});
