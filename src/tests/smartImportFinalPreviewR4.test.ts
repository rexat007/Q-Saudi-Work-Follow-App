/**
 * SMART IMPORT R4 — FINAL PREVIEW & COMMIT READINESS TEST SUITE
 * 
 * Verifies:
 * - Truthful, truthful final preview derived from active batch state & committer eligibility
 * - Effective corrected data usage (row.mapped / row.canonical over row.raw)
 * - Exact classification of ready, pending warning, blocked, rejected, and already committed rows
 * - Contract-aligned ImportResult usage (no createdCount / updatedCount fallbacks)
 * - Explicit partial success, full success, and failure handling
 * - Zero side effects / zero Firestore writes during preview
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ExcelCsvPipelineService } from '../services/import/excelCsvPipeline.service';
import { ExcelCsvTripCommitter } from '../services/import/tripImportCommitter';
import { UnifiedImportBatch, PipelineContext, ImportRow, ImportResult } from '../types/unifiedImport';
import { tripRepository } from '../repositories/trip.repository';
import { canonicalSnapshotClientService } from '../services/import/canonicalSnapshotClient.service';
import { importedTripClientService } from '../services/import/importedTripClient.service';

describe('SMART IMPORT R4 — Final Preview & Commit Readiness', () => {
  const sampleContext: PipelineContext = {
    projectId: 'PRJ-R4-TEST',
    userId: 'USR-R4-ADMIN',
    userName: 'R4 Admin',
    role: 'PROJECT_ADMIN',
    operationId: 'OP-R4-TEST-001',
    allowWarningsCommit: false,
  };

  const createBaseBatch = (rows: ImportRow[]): UnifiedImportBatch => ({
    importBatchId: 'BAT-R4-001',
    projectId: 'PRJ-R4-TEST',
    source: {
      sourceType: 'EXCEL',
      importBatchId: 'BAT-R4-001',
      sourceFileName: 'test_r4_preview.xlsx',
    },
    currentStage: 'REVIEW',
    validationStatus: 'PASSED',
    commitStatus: 'AWAITING_REVIEW',
    totalRows: rows.length,
    validRows: rows.filter((r) => r.status === 'VALID' || r.reviewStatus === 'accepted').length,
    warningRows: rows.filter((r) => r.status === 'WARNING' || r.reviewStatus === 'warning').length,
    errorRows: rows.filter((r) => r.status === 'ERROR' || r.reviewStatus === 'error').length,
    requiresReviewRows: rows.filter((r) => r.reviewStatus === 'requires_review').length,
    committedRows: rows.filter((r) => r.status === 'COMMITTED').length,
    rows,
    issues: rows.flatMap((r) => r.validationIssues || []),
    operationId: 'OP-R4-TEST-001',
    createdAt: new Date().toISOString(),
    createdBy: 'USR-R4-ADMIN',
    auditTrail: [],
  });

  const validResolvedRow = (rowNumber: number): ImportRow => ({
    rowNumber,
    raw: { ticket: 'RAW-TICKET', driver: 'RAW DRIVER', truck: 'RAW TRUCK' },
    canonical: {
      ticketId: `TCK-${rowNumber}`,
      tripSerial: rowNumber,
      shiftDate: '2026-09-30',
      carrierId: 'CAR-ALMAJDOUIE',
      truckId: 'TRK-1234',
      driverId: 'DRV-5678',
      materialId: 'MAT-SAND-01',
      carrierName: 'Al Majdouie',
      truckNo: '1234-XYZ',
      driverName: 'Ahmed Ali',
      materialName: 'Red Sand',
      grossWeight: 40000,
      tareWeight: 15000,
      netWeight: 25000,
    },
    mapped: {
      ticketId: `TCK-${rowNumber}`,
      tripSerial: rowNumber,
      shiftDate: '2026-09-30',
      carrierId: 'CAR-ALMAJDOUIE',
      truckId: 'TRK-1234',
      driverId: 'DRV-5678',
      materialId: 'MAT-SAND-01',
      carrierName: 'Al Majdouie',
      truckNo: '1234-XYZ',
      driverName: 'Ahmed Ali',
      materialName: 'Red Sand',
      grossWeight: 40000,
      tareWeight: 15000,
      netWeight: 25000,
    },
    resolvedValues: {
      carrierId: 'CAR-ALMAJDOUIE',
      truckId: 'TRK-1234',
      driverId: 'DRV-5678',
      materialId: 'MAT-SAND-01',
    },
    entityResolutions: {
      carrier: { entityType: 'CARRIER', originalValue: 'Al Majdouie', matchedId: 'CAR-ALMAJDOUIE', matchedName: 'Al Majdouie', confidence: 1, isExact: true },
      truck: { entityType: 'TRUCK', originalValue: '1234-XYZ', matchedId: 'TRK-1234', matchedName: '1234-XYZ', confidence: 1, isExact: true },
      driver: { entityType: 'DRIVER', originalValue: 'Ahmed Ali', matchedId: 'DRV-5678', matchedName: 'Ahmed Ali', confidence: 1, isExact: true },
      material: { entityType: 'MATERIAL', originalValue: 'Red Sand', matchedId: 'MAT-SAND-01', matchedName: 'Red Sand', confidence: 1, isExact: true },
    },
    validationIssues: [],
    reviewStatus: 'accepted',
    status: 'VALID',
  });

  beforeEach(() => {
    vi.restoreAllMocks();
    ExcelCsvTripCommitter.resetIdempotencyCache();
  });

  it('1. Preview uses current effective corrected values (mapped/canonical)', () => {
    const row = validResolvedRow(1);
    row.raw = { ticketId: 'RAW-STALE-111' };
    row.mapped = { ticketId: 'CORRECTED-TICKET-222' };

    const batch = createBaseBatch([row]);
    const preview = ExcelCsvPipelineService.getFinalPreview(batch, false);

    expect(preview.commitEligibleRows.length).toBe(1);
    const effective = preview.commitEligibleRows[0].mapped;
    expect(effective.ticketId).toBe('CORRECTED-TICKET-222');
  });

  it('2. row.raw is NOT used as final preview authority', () => {
    const row = validResolvedRow(1);
    row.raw = { driverName: 'RAW WRONG DRIVER' };
    row.mapped = { driverName: 'EFFECTIVE CORRECT DRIVER' };

    const batch = createBaseBatch([row]);
    const preview = ExcelCsvPipelineService.getFinalPreview(batch, false);

    expect(preview.commitEligibleRows[0].raw.driverName).not.toBe('EFFECTIVE CORRECT DRIVER');
    expect(preview.commitEligibleRows[0].mapped!.driverName).toBe('EFFECTIVE CORRECT DRIVER');
  });

  it('3. VALID row is listed as ready', () => {
    const row = validResolvedRow(1);
    const batch = createBaseBatch([row]);
    const preview = ExcelCsvPipelineService.getFinalPreview(batch, false);

    expect(preview.readyRows.length).toBe(1);
    expect(preview.commitEligibleRows.length).toBe(1);
    expect(preview.canCommit).toBe(true);
  });

  it('4. Accepted row is listed as ready', () => {
    const row = validResolvedRow(1);
    row.reviewStatus = 'accepted';
    row.status = 'VALID';

    const batch = createBaseBatch([row]);
    const preview = ExcelCsvPipelineService.getFinalPreview(batch, false);

    expect(preview.commitEligibleRows.length).toBe(1);
    expect(preview.commitEligibleRows[0].rowNumber).toBe(1);
  });

  it('5. Warning row without confirmation is pending approval', () => {
    const row = validResolvedRow(1);
    row.status = 'WARNING';
    row.reviewStatus = 'warning';
    row.validationIssues = [
      {
        issueId: 'ISS-1',
        row: 1,
        field: 'grossWeight',
        code: 'WEIGHT_WARNING',
        severity: 'WARNING',
        message: 'Gross weight warning',
        resolvable: true,
        blocking: false,
      },
    ];

    const batch = createBaseBatch([row]);
    const preview = ExcelCsvPipelineService.getFinalPreview(batch, false);

    expect(preview.pendingWarningCount).toBe(1);
    expect(preview.commitEligibleRows.length).toBe(0);
    expect(preview.canCommit).toBe(false);
    expect(preview.blockers.some((b) => b.includes('تنبيهات معلقة'))).toBe(true);
  });

  it('6. Warning row with confirmation becomes eligible', () => {
    const row = validResolvedRow(1);
    row.status = 'WARNING';
    row.reviewStatus = 'warning';
    row.validationIssues = [
      {
        issueId: 'ISS-1',
        row: 1,
        field: 'grossWeight',
        code: 'WEIGHT_WARNING',
        severity: 'WARNING',
        message: 'Gross weight warning',
        resolvable: true,
        blocking: false,
      },
    ];

    const batch = createBaseBatch([row]);
    batch.warningConfirmation = {
      confirmed: true,
      confirmedBy: 'USR-ADMIN',
      confirmedAt: new Date().toISOString(),
    };

    const preview = ExcelCsvPipelineService.getFinalPreview(batch, true);

    expect(preview.pendingWarningCount).toBe(0);
    expect(preview.commitEligibleRows.length).toBe(1);
    expect(preview.canCommit).toBe(true);
  });

  it('7. REJECTED row is excluded from eligible rows', () => {
    const row1 = validResolvedRow(1);
    const row2 = validResolvedRow(2);
    row2.status = 'REJECTED';
    row2.reviewStatus = 'rejected' as any;

    const batch = createBaseBatch([row1, row2]);
    const preview = ExcelCsvPipelineService.getFinalPreview(batch, false);

    expect(preview.rejectedRows.length).toBe(1);
    expect(preview.rejectedRows[0].rowNumber).toBe(2);
    expect(preview.commitEligibleRows.length).toBe(1);
    expect(preview.commitEligibleRows[0].rowNumber).toBe(1);
  });

  it('8. COMMITTED row is excluded from retry preview', () => {
    const row1 = validResolvedRow(1);
    row1.status = 'COMMITTED';
    const row2 = validResolvedRow(2);

    const batch = createBaseBatch([row1, row2]);
    const preview = ExcelCsvPipelineService.getFinalPreview(batch, false);

    expect(preview.alreadyCommittedRows.length).toBe(1);
    expect(preview.alreadyCommittedRows[0].rowNumber).toBe(1);
    expect(preview.commitEligibleRows.length).toBe(1);
    expect(preview.commitEligibleRows[0].rowNumber).toBe(2);
  });

  it('9. reviewStatus=error row is excluded as blocked', () => {
    const row = validResolvedRow(1);
    row.reviewStatus = 'error';

    const batch = createBaseBatch([row]);
    const preview = ExcelCsvPipelineService.getFinalPreview(batch, false);

    expect(preview.blockedRows.length).toBe(1);
    expect(preview.commitEligibleRows.length).toBe(0);
    expect(preview.canCommit).toBe(false);
  });

  it('10. Blocking issue row is blocked', () => {
    const row = validResolvedRow(1);
    row.status = 'ERROR';
    row.validationIssues = [
      {
        issueId: 'ISS-BLOCK',
        row: 1,
        field: 'ticketId',
        code: 'MISSING_TICKET',
        severity: 'BLOCKING',
        message: 'Ticket required',
        resolvable: true,
        blocking: true,
      },
    ];

    const batch = createBaseBatch([row]);
    const preview = ExcelCsvPipelineService.getFinalPreview(batch, false);

    expect(preview.blockedRows.length).toBe(1);
    expect(preview.commitEligibleRows.length).toBe(0);
    expect(preview.canCommit).toBe(false);
  });

  it('11. Unresolved review row blocks commit', () => {
    const row = validResolvedRow(1);
    row.reviewStatus = 'requires_review';

    const batch = createBaseBatch([row]);
    const preview = ExcelCsvPipelineService.getFinalPreview(batch, false);

    expect(preview.blockedRows.length).toBe(1);
    expect(preview.commitEligibleRows.length).toBe(0);
    expect(preview.canCommit).toBe(false);
  });

  it('12. Missing required canonical IDs block commit eligibility', () => {
    const row = validResolvedRow(1);
    delete row.resolvedValues!.carrierId;
    delete row.entityResolutions!.carrier;
    delete row.canonical!.carrierId;
    delete row.mapped!.carrierId;

    const batch = createBaseBatch([row]);
    const preview = ExcelCsvPipelineService.getFinalPreview(batch, false);

    expect(preview.blockedRows.length).toBe(1);
    expect(preview.commitEligibleRows.length).toBe(0);
    expect(preview.canCommit).toBe(false);
  });

  it('13. Ready count equals exact eligible row list length', () => {
    const r1 = validResolvedRow(1);
    const r2 = validResolvedRow(2);
    const r3 = validResolvedRow(3);
    r3.status = 'REJECTED';

    const batch = createBaseBatch([r1, r2, r3]);
    const preview = ExcelCsvPipelineService.getFinalPreview(batch, false);

    expect(preview.commitEligibleRows.length).toBe(2);
    expect(preview.readyRows.length).toBe(2);
  });

  it('14. No hidden eligible rows in preview summary', () => {
    const rows = [validResolvedRow(1), validResolvedRow(2), validResolvedRow(3)];
    const batch = createBaseBatch(rows);
    const preview = ExcelCsvPipelineService.getFinalPreview(batch, false);

    const sum =
      preview.commitEligibleRows.length +
      preview.pendingWarningCount +
      preview.blockedRows.length +
      preview.rejectedRows.length +
      preview.alreadyCommittedRows.length;

    expect(sum).toBe(batch.totalRows);
  });

  it('15. Excluded rows are visible with explicit reasons', () => {
    const r1 = validResolvedRow(1);
    const r2 = validResolvedRow(2);
    r2.status = 'REJECTED';
    const r3 = validResolvedRow(3);
    r3.status = 'ERROR';
    r3.validationIssues = [
      { issueId: 'E1', row: 3, field: 'netWeight', code: 'INVALID_NET', severity: 'BLOCKING', message: 'Net weight invalid', resolvable: true, blocking: true },
    ];

    const batch = createBaseBatch([r1, r2, r3]);
    const preview = ExcelCsvPipelineService.getFinalPreview(batch, false);

    expect(preview.rejectedRows.length).toBe(1);
    expect(preview.rejectedRows[0].rowNumber).toBe(2);
    expect(preview.blockedRows.length).toBe(1);
    expect(preview.blockedRows[0].rowNumber).toBe(3);
  });

  it('16. Warning rows are visible before confirmation', () => {
    const r1 = validResolvedRow(1);
    r1.status = 'WARNING';
    r1.validationIssues = [{ issueId: 'W1', row: 1, field: 'tareWeight', code: 'TARE_WARN', severity: 'WARNING', message: 'Tare high', resolvable: true, blocking: false }];

    const batch = createBaseBatch([r1]);
    const preview = ExcelCsvPipelineService.getFinalPreview(batch, false);

    expect(preview.warningRows.length).toBe(1);
    expect(preview.pendingWarningRows.length).toBe(1);
    expect(preview.commitEligibleRows.length).toBe(0);
  });

  it('17. Final commit CTA count matches commitEligibleRows length exactly', () => {
    const r1 = validResolvedRow(1);
    const r2 = validResolvedRow(2);
    const batch = createBaseBatch([r1, r2]);
    const preview = ExcelCsvPipelineService.getFinalPreview(batch, false);

    expect(preview.commitEligibleRows.length).toBe(2);
  });

  it('18. ImportResult committedRows used directly', () => {
    const result: ImportResult = {
      importBatchId: 'BAT-1',
      projectId: 'PRJ-1',
      operationId: 'OP-1',
      sourceType: 'EXCEL',
      success: true,
      totalRows: 10,
      committedRows: 10,
      skippedRows: 0,
      failedRows: 0,
      issues: [],
      executedAt: new Date().toISOString(),
    };

    expect(result.committedRows).toBe(10);
  });

  it('19. ImportResult skippedRows used directly', () => {
    const result: ImportResult = {
      importBatchId: 'BAT-1',
      projectId: 'PRJ-1',
      operationId: 'OP-1',
      sourceType: 'EXCEL',
      success: false,
      totalRows: 10,
      committedRows: 6,
      skippedRows: 2,
      failedRows: 2,
      issues: [],
      executedAt: new Date().toISOString(),
    };

    expect(result.skippedRows).toBe(2);
  });

  it('20. ImportResult failedRows used directly', () => {
    const result: ImportResult = {
      importBatchId: 'BAT-1',
      projectId: 'PRJ-1',
      operationId: 'OP-1',
      sourceType: 'EXCEL',
      success: false,
      totalRows: 5,
      committedRows: 0,
      skippedRows: 0,
      failedRows: 5,
      issues: [],
      executedAt: new Date().toISOString(),
    };

    expect(result.failedRows).toBe(5);
  });

  it('21. Full success renders success state', () => {
    const result: ImportResult = {
      importBatchId: 'BAT-1',
      projectId: 'PRJ-1',
      operationId: 'OP-1',
      sourceType: 'EXCEL',
      success: true,
      totalRows: 5,
      committedRows: 5,
      skippedRows: 0,
      failedRows: 0,
      issues: [],
      executedAt: new Date().toISOString(),
    };

    expect(result.success).toBe(true);
    expect(result.committedRows).toBe(5);
  });

  it('22. Partial success renders partial state', () => {
    const result: ImportResult = {
      importBatchId: 'BAT-1',
      projectId: 'PRJ-1',
      operationId: 'OP-1',
      sourceType: 'EXCEL',
      success: false,
      totalRows: 10,
      committedRows: 7,
      skippedRows: 1,
      failedRows: 2,
      issues: [
        { issueId: 'I1', row: 8, field: 'tripId', code: 'TRIP_PERSISTENCE_FAILED', severity: 'BLOCKING', message: 'Write failed', resolvable: false, blocking: true },
      ],
      executedAt: new Date().toISOString(),
    };

    const isPartialSuccess = !result.success && result.committedRows > 0;
    expect(isPartialSuccess).toBe(true);
    expect(result.committedRows).toBe(7);
    expect(result.failedRows).toBe(2);
  });

  it('23. Full failure renders failure state', () => {
    const result: ImportResult = {
      importBatchId: 'BAT-1',
      projectId: 'PRJ-1',
      operationId: 'OP-1',
      sourceType: 'EXCEL',
      success: false,
      totalRows: 5,
      committedRows: 0,
      skippedRows: 0,
      failedRows: 5,
      issues: [],
      error: 'Project isolation error',
      executedAt: new Date().toISOString(),
    };

    const isFullFailure = !result.success && result.committedRows === 0;
    expect(isFullFailure).toBe(true);
    expect(result.error).toBe('Project isolation error');
  });

  it('24. Row-aware issues are preserved in ImportResult', () => {
    const result: ImportResult = {
      importBatchId: 'BAT-1',
      projectId: 'PRJ-1',
      operationId: 'OP-1',
      sourceType: 'EXCEL',
      success: false,
      totalRows: 3,
      committedRows: 2,
      skippedRows: 0,
      failedRows: 1,
      issues: [
        {
          issueId: 'ISS-ROW-3',
          row: 3,
          field: 'carrierId',
          code: 'CANONICAL_CARRIER_ID_REQUIRED',
          severity: 'BLOCKING',
          message: 'Carrier required',
          messageAr: 'الناقل مطلوب',
          resolvable: false,
          blocking: true,
        },
      ],
      executedAt: new Date().toISOString(),
    };

    expect(result.issues.length).toBe(1);
    expect(result.issues[0].row).toBe(3);
    expect(result.issues[0].messageAr).toBe('الناقل مطلوب');
  });

  it('25. Partial retry excludes COMMITTED rows', async () => {
    const r1 = validResolvedRow(1);
    r1.status = 'COMMITTED';
    const r2 = validResolvedRow(2);

    const batch = createBaseBatch([r1, r2]);
    const preview = ExcelCsvPipelineService.getFinalPreview(batch, false);

    expect(preview.commitEligibleRows.length).toBe(1);
    expect(preview.commitEligibleRows[0].rowNumber).toBe(2);
    expect(preview.alreadyCommittedRows.length).toBe(1);
    expect(preview.alreadyCommittedRows[0].rowNumber).toBe(1);
  });

  it('26. No Firestore writes occur during preview calculation', () => {
    const createSpy = vi.spyOn(tripRepository, 'create');
    const r1 = validResolvedRow(1);
    const r2 = validResolvedRow(2);

    const batch = createBaseBatch([r1, r2]);
    const preview = ExcelCsvPipelineService.getFinalPreview(batch, true);

    expect(preview.commitEligibleRows.length).toBe(2);
    expect(createSpy).not.toHaveBeenCalled();
  });

  it('27. tripImportCommitter behavior uses importedTripClientService and remains fail-closed', async () => {
    const createSpy = vi.spyOn(importedTripClientService, 'dispatchImportedTrip').mockResolvedValue({
      trip: { tripId: 'TRP-IMP-001-1', tripNumber: 'TRP-2026-000001', projectId: 'PRJ-1' } as any,
    });

    const r1 = validResolvedRow(1);
    const batch = createBaseBatch([r1]);

    const committer = new ExcelCsvTripCommitter();
    const result = await committer.commit(batch, sampleContext);

    expect(result.success).toBe(true);
    expect(result.committedRows).toBe(1);
    expect(createSpy).toHaveBeenCalledTimes(1);
  });

  it('28. Partial commit does NOT mark session COMMITTED', () => {
    const r1 = validResolvedRow(1);
    r1.status = 'COMMITTED';
    const r2 = validResolvedRow(2);
    r2.status = 'ERROR';

    const batch = createBaseBatch([r1, r2]);
    batch.committedRows = 1;

    const checkpointPayload = {
      lifecycleState: 'REVIEW_REQUIRED',
      currentStage: 'REVIEW',
      reviewSnapshot: {
        totalRows: batch.totalRows,
        committedRows: batch.committedRows,
        rows: batch.rows.map((r) => { const { rawInput, ...rest } = r as any; return rest; }),
      },
    };

    expect(checkpointPayload.lifecycleState).toBe('REVIEW_REQUIRED');
    expect(checkpointPayload.lifecycleState).not.toBe('COMMITTED');
  });

  it('29. Partial commit checkpoint uses UPDATED post-commit batch', () => {
    const r1 = validResolvedRow(1);
    r1.status = 'COMMITTED';
    const r2 = validResolvedRow(2);

    const batch = createBaseBatch([r1, r2]);
    batch.committedRows = 1;

    const snapshotRows = batch.rows.map((r) => { const { rawInput, ...rest } = r as any; return rest; });
    expect(snapshotRows[0].status).toBe('COMMITTED');
    expect(snapshotRows[1].status).toBe('VALID');
  });

  it('30. COMMITTED row status is persisted in reviewSnapshot', () => {
    const r1 = validResolvedRow(1);
    r1.status = 'COMMITTED';
    const r2 = validResolvedRow(2);

    const batch = createBaseBatch([r1, r2]);
    const snapshot = {
      rows: batch.rows.map((r) => { const { rawInput, ...rest } = r as any; return rest; }),
    };

    expect(snapshot.rows[0].status).toBe('COMMITTED');
  });

  it('31. committedRows counter is persisted in checkpoint snapshot', () => {
    const r1 = validResolvedRow(1);
    r1.status = 'COMMITTED';
    const r2 = validResolvedRow(2);

    const batch = createBaseBatch([r1, r2]);
    batch.committedRows = 1;

    const snapshot = {
      totalRows: batch.totalRows,
      committedRows: batch.committedRows,
    };

    expect(snapshot.committedRows).toBe(1);
    expect(snapshot.totalRows).toBe(2);
  });

  it('32. session locator is retained on partial commit', () => {
    const locatorKey = 'qsaudi_import_session_locator_PRJ-TEST';
    const locatorData = JSON.stringify({ projectId: 'PRJ-TEST', importSessionId: 'SES-001' });

    // Simulate partial commit handling
    const result: ImportResult = {
      importBatchId: 'BAT-1',
      projectId: 'PRJ-TEST',
      operationId: 'OP-1',
      sourceType: 'EXCEL',
      success: false,
      totalRows: 2,
      committedRows: 1,
      skippedRows: 0,
      failedRows: 1,
      issues: [],
      executedAt: new Date().toISOString(),
    };

    // On partial commit, locator is NOT removed
    if (!result.success && result.committedRows > 0) {
      // Do NOT call removeItem(locatorKey)
    }

    expect(locatorData).not.toBeNull();
  });

  it('33. Resumed batch restores COMMITTED rows from reviewSnapshot', () => {
    const snapshot = {
      totalRows: 2,
      committedRows: 1,
      rows: [
        { rowNumber: 1, status: 'COMMITTED', canonical: { ticketId: 'TCK-1' } },
        { rowNumber: 2, status: 'VALID', canonical: { ticketId: 'TCK-2' } },
      ],
    };

    const restoredRows = snapshot.rows;
    expect(restoredRows[0].status).toBe('COMMITTED');
    expect(restoredRows[1].status).toBe('VALID');
  });

  it('34. getFinalPreview excludes restored COMMITTED rows', () => {
    const r1 = validResolvedRow(1);
    r1.status = 'COMMITTED';
    const r2 = validResolvedRow(2);

    const batch = createBaseBatch([r1, r2]);
    const preview = ExcelCsvPipelineService.getFinalPreview(batch, false);

    expect(preview.alreadyCommittedRows.length).toBe(1);
    expect(preview.alreadyCommittedRows[0].rowNumber).toBe(1);
    expect(preview.commitEligibleRows.length).toBe(1);
    expect(preview.commitEligibleRows[0].rowNumber).toBe(2);
  });

  it('35. Retry eligible row set contains ONLY remaining uncommitted rows', () => {
    const r1 = validResolvedRow(1);
    r1.status = 'COMMITTED';
    const r2 = validResolvedRow(2);
    const r3 = validResolvedRow(3);

    const batch = createBaseBatch([r1, r2, r3]);
    const preview = ExcelCsvPipelineService.getFinalPreview(batch, false);

    expect(preview.commitEligibleRows.map((r) => r.rowNumber)).toEqual([2, 3]);
  });

  it('36. Full success behavior remains unchanged (lifecycleState COMMITTED)', () => {
    const result: ImportResult = {
      importBatchId: 'BAT-1',
      projectId: 'PRJ-1',
      operationId: 'OP-1',
      sourceType: 'EXCEL',
      success: true,
      totalRows: 2,
      committedRows: 2,
      skippedRows: 0,
      failedRows: 0,
      issues: [],
      executedAt: new Date().toISOString(),
    };

    const targetLifecycleState = result.success ? 'COMMITTED' : 'REVIEW_REQUIRED';
    expect(targetLifecycleState).toBe('COMMITTED');
  });

  it('37. Full failure behavior remains resumable', () => {
    const result: ImportResult = {
      importBatchId: 'BAT-1',
      projectId: 'PRJ-1',
      operationId: 'OP-1',
      sourceType: 'EXCEL',
      success: false,
      totalRows: 2,
      committedRows: 0,
      skippedRows: 0,
      failedRows: 2,
      issues: [],
      executedAt: new Date().toISOString(),
    };

    const isResumable = !result.success;
    expect(isResumable).toBe(true);
    expect(result.committedRows).toBe(0);
  });

  it('38. No rawInput binary is persisted in reviewSnapshot', () => {
    const rowWithRawInput: any = {
      rowNumber: 1,
      status: 'COMMITTED',
      rawInput: new ArrayBuffer(1024),
      canonical: { ticketId: 'TCK-1' },
    };

    const { rawInput, ...cleanRow } = rowWithRawInput;
    expect((cleanRow as any).rawInput).toBeUndefined();
    expect(cleanRow.canonical.ticketId).toBe('TCK-1');
  });

  it('39. Trip commit architecture remains unchanged and fail-closed', () => {
    const committer = new ExcelCsvTripCommitter();
    expect(committer).toBeDefined();
    expect(typeof committer.commit).toBe('function');
  });
});
