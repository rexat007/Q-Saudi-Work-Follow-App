import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

function findFileContent(relativePath: string): string {
  const possiblePaths = [
    path.join(process.cwd(), relativePath),
    path.join(process.cwd(), 'app/applet', relativePath),
    path.join(__dirname, '..', relativePath.replace(/^src\//, '')),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return fs.readFileSync(p, 'utf-8');
    }
  }

  throw new Error(`Could not find file at any location for ${relativePath}`);
}

describe('C5 — Smart Import Final Review & Commit Result Layer Contract Suite', () => {
  const wizardContent = findFileContent('src/components/wizard/ProjectSetupWizard.tsx');
  const driverTruckContent = findFileContent('src/components/import/RosterDriverTruckResolutionLayer.tsx');
  const finalReviewContent = findFileContent('src/components/import/RosterFinalReviewLayer.tsx');
  const commitResultContent = findFileContent('src/components/import/RosterCommitResultLayer.tsx');

  // TRANSITION TO FINAL REVIEW
  it('1. C4 incomplete blocks Final Review', () => {
    expect(driverTruckContent).toContain('disabled={!isLayerComplete || isProcessing || Boolean(driverConvergenceError) || Boolean(truckConvergenceError)}');
  });

  it('2. Driver REVIEW_REQUIRED blocks transition', () => {
    expect(wizardContent).toContain('hasUnresolvedDrivers');
    expect(wizardContent).toContain("g.status === 'REVIEW_REQUIRED'");
  });

  it('3. Driver UNRESOLVED blocks transition', () => {
    expect(wizardContent).toContain("g.status === 'UNRESOLVED'");
  });

  it('4. Driver CONFLICT blocks transition', () => {
    expect(wizardContent).toContain("g.status === 'CONFLICT'");
  });

  it('5. Truck REVIEW_REQUIRED blocks transition', () => {
    expect(wizardContent).toContain('hasUnresolvedTrucks');
  });

  it('6. Truck UNRESOLVED blocks transition', () => {
    expect(wizardContent).toContain('batchGroups.truck');
  });

  it('7. Truck CONFLICT blocks transition', () => {
    expect(wizardContent).toContain('hasUnresolvedTrucks');
  });

  it('8. Zero Driver+Truck groups block transition', () => {
    expect(wizardContent).toContain('if (driverTruckGroups.length === 0)');
  });

  it('9. Pending Driver convergence cache blocks transition', () => {
    expect(wizardContent).toContain('driverConvergenceError !== null');
  });

  it('10. Pending Truck convergence cache blocks transition', () => {
    expect(wizardContent).toContain('truckConvergenceError !== null');
  });

  it('11. Exactly one Continue-to-Final-Review action in C4', () => {
    expect(driverTruckContent).toContain('متابعة إلى المراجعة النهائية');
  });

  it('12. Final Review transition preserves same batch', () => {
    expect(wizardContent).toContain('setImportBatch({ ...revalidated });');
    expect(wizardContent).toContain("setRosterImportStage('FINAL_REVIEW');");
  });

  // FINAL REVALIDATION
  it('13. Entering FINAL_REVIEW loads fresh RelationshipContext', () => {
    expect(wizardContent).toContain('canonicalRelationshipContextService.getProjectRelationshipContext');
  });

  it('14. ImportProjectContextAdapter used for final review revalidation', () => {
    expect(wizardContent).toContain('ImportProjectContextAdapter.createPipelineContext');
  });

  it('15. revalidateRosterBatch used before entering Final Review', () => {
    expect(wizardContent).toContain('DriverTruckPipelineService.revalidateRosterBatch');
  });

  it('16. Revalidated batch becomes review source', () => {
    expect(wizardContent).toContain('setImportBatch({ ...revalidated });');
  });

  it('17. No write occurs during preview transition', () => {
    const fnIdx = wizardContent.indexOf('handleSmartImportContinueToFinalReview');
    const fnBlock = wizardContent.slice(fnIdx, fnIdx + 2000);
    expect(fnBlock).not.toContain('commitBatch');
    expect(fnBlock).not.toContain('/api/intake/canonical');
  });

  // FINAL REVIEW UI
  it('18. Total rows shown in Final Review', () => {
    expect(finalReviewContent).toContain('totalRows');
    expect(finalReviewContent).toContain('إجمالي السجلات');
  });

  it('19. Ready rows shown', () => {
    expect(finalReviewContent).toContain('readyRowsCount');
    expect(finalReviewContent).toContain('جاهزة للاعتماد');
  });

  it('20. Warning rows shown', () => {
    expect(finalReviewContent).toContain('warningRows');
    expect(finalReviewContent).toContain('صفوف بها تنبيهات');
  });

  it('21. Blocked rows shown', () => {
    expect(finalReviewContent).toContain('blockedRows');
    expect(finalReviewContent).toContain('صفوف محجوبة/أخطاء');
  });

  it('22. Carrier summary shown', () => {
    expect(finalReviewContent).toContain('carrierGroups');
    expect(finalReviewContent).toContain('الناقلون (Carriers)');
  });

  it('23. Material summary shown', () => {
    expect(finalReviewContent).toContain('materialGroups');
    expect(finalReviewContent).toContain('المواد (Materials)');
  });

  it('24. Driver summary shown', () => {
    expect(finalReviewContent).toContain('driverGroups');
    expect(finalReviewContent).toContain('السائقون (Drivers)');
  });

  it('25. Truck summary shown', () => {
    expect(finalReviewContent).toContain('truckGroups');
    expect(finalReviewContent).toContain('الشاحنات (Trucks)');
  });

  it('26. Effective canonical/resolved values shown', () => {
    expect(finalReviewContent).toContain('row.entityResolutions?.carrier?.matchedName');
    expect(finalReviewContent).toContain('row.entityResolutions?.material?.matchedName');
    expect(finalReviewContent).toContain('row.entityResolutions?.driver?.matchedName');
    expect(finalReviewContent).toContain('row.entityResolutions?.truck?.matchedName');
  });

  it('27. Raw stale value not preferred over matchedName', () => {
    expect(finalReviewContent).toContain('row.entityResolutions?.carrier?.matchedName ||');
  });

  it('28. Blocking issues visible in Final Review', () => {
    expect(finalReviewContent).toContain('blockingIssues');
  });

  it('29. No entity-edit or create controls in Final Review', () => {
    expect(finalReviewContent).not.toContain('onCreateDriver');
    expect(finalReviewContent).not.toContain('onCreateTruck');
    expect(finalReviewContent).not.toContain('onCreateCarrier');
    expect(finalReviewContent).not.toContain('onCreateMaterial');
  });

  it('30. Exactly one commit button in Final Review', () => {
    expect(finalReviewContent).toContain('اعتماد وتنفيذ الاستيراد');
  });

  // COMMIT GATE
  it('31. requires_review blocks commit', () => {
    expect(finalReviewContent).toContain("r.reviewStatus === 'requires_review'");
  });

  it('32. error row blocks commit', () => {
    expect(finalReviewContent).toContain("r.status === 'ERROR'");
  });

  it('33. BLOCKING issue blocks commit', () => {
    expect(finalReviewContent).toContain("iss.severity === 'BLOCKING'");
  });

  it('34. Missing Carrier resolution blocks commit', () => {
    expect(finalReviewContent).toContain('!r.entityResolutions?.carrier?.matchedId');
  });

  it('35. Missing Material resolution blocks commit', () => {
    expect(finalReviewContent).toContain('!r.entityResolutions?.material?.matchedId');
  });

  it('36. Applicable missing Driver blocks commit', () => {
    expect(finalReviewContent).toContain('!r.entityResolutions?.driver?.matchedId');
  });

  it('37. Applicable missing Truck blocks commit', () => {
    expect(finalReviewContent).toContain('!r.entityResolutions?.truck?.matchedId');
  });

  it('38. Commit performs fresh second revalidation preflight', () => {
    const fnIdx = wizardContent.indexOf('handleSmartImportCommit');
    const fnBlock = wizardContent.slice(fnIdx, fnIdx + 4000);
    expect(fnBlock).toContain('canonicalRelationshipContextService.getProjectRelationshipContext');
    expect(fnBlock).toContain('DriverTruckPipelineService.revalidateRosterBatch');
  });

  it('39. Changed canonical context can newly block commit preflight', () => {
    const fnIdx = wizardContent.indexOf('handleSmartImportCommit');
    const fnBlock = wizardContent.slice(fnIdx, fnIdx + 4000);
    expect(fnBlock).toContain('setSmartImportCommitError');
    expect(fnBlock).toContain('hasBlockingIssues');
  });

  it('40. commitBatch not called when preflight fails', () => {
    const fnIdx = wizardContent.indexOf('handleSmartImportCommit');
    const fnBlock = wizardContent.slice(fnIdx, fnIdx + 4000);
    expect(fnBlock).toContain('if (hasUnresolved || hasRowErrors || hasBlockingIssues)');
    expect(fnBlock).toContain('setIsCommittingImport(false);');
  });

  // COMMIT EXECUTION
  it('41. Only DriverTruckPipelineService.commitBatch used for commitment', () => {
    const fnIdx = wizardContent.indexOf('handleSmartImportCommit');
    const fnBlock = wizardContent.slice(fnIdx, fnIdx + 4000);
    expect(fnBlock).toContain('DriverTruckPipelineService.commitBatch(revalidated, pipelineCtx)');
    expect(fnBlock).not.toContain('/api/intake/canonical');
  });

  it('42. No direct /api/intake/canonical call in wizard commit flow', () => {
    const fnIdx = wizardContent.indexOf('handleSmartImportCommit');
    const fnBlock = wizardContent.slice(fnIdx, fnIdx + 4000);
    expect(fnBlock).not.toContain('fetch(');
  });

  it('43. isCommittingImport prevents double click during commit', () => {
    expect(finalReviewContent).toContain('disabled={!isReadyToCommit || isCommitting}');
  });

  it('44. Result stored in smartImportCommitResult', () => {
    expect(wizardContent).toContain('setSmartImportCommitResult(result)');
  });

  it('45. Committed batch stored in importBatch', () => {
    expect(wizardContent).toContain('setImportBatch({ ...committedBatch })');
  });

  it('46. Transition to COMMIT_RESULT occurs only after attempt', () => {
    expect(wizardContent).toContain("setRosterImportStage('COMMIT_RESULT')");
  });

  it('47. Batch is NOT cleared automatically after commit', () => {
    const fnIdx = wizardContent.indexOf('handleSmartImportCommit');
    const fnBlock = wizardContent.slice(fnIdx, fnIdx + 2500);
    expect(fnBlock).not.toContain('setImportBatch(null)');
  });

  // RESULT CLASSIFICATION
  it('48. failedRows=0 + committedRows>0 classifies as FULL SUCCESS', () => {
    expect(commitResultContent).toContain('failedRows === 0 && committedRows > 0');
    expect(commitResultContent).toContain('تم تنفيذ الاستيراد بنجاح');
  });

  it('49. committedRows>0 + failedRows>0 classifies as PARTIAL', () => {
    expect(commitResultContent).toContain('committedRows > 0 && failedRows > 0');
    expect(commitResultContent).toContain('تم تنفيذ جزء من الاستيراد مع وجود صفوف فاشلة');
  });

  it('50. committedRows=0 + failedRows>0 classifies as FAILURE', () => {
    expect(commitResultContent).toContain('committedRows === 0 && failedRows > 0');
    expect(commitResultContent).toContain('فشل تنفيذ الاستيراد');
  });

  it('51. committedRows=0 + failedRows=0 classifies as ZERO/INVALID', () => {
    expect(commitResultContent).toContain('committedRows === 0 && failedRows === 0');
    expect(commitResultContent).toContain('لم يتم تنفيذ أي تغييرات');
  });

  it('52. result.success=true with failedRows>0 is NOT displayed as full success', () => {
    expect(commitResultContent).toContain('const isFullSuccess = failedRows === 0 && committedRows > 0;');
  });

  // PARTIAL FAILURE
  it('53. Partial result preserves batch in COMMIT_RESULT', () => {
    expect(commitResultContent).toContain('commitResult.committedRows');
    expect(commitResultContent).toContain('commitResult.failedRows');
  });

  it('54. Partial result shows failed count', () => {
    expect(commitResultContent).toContain('الصفوف الفاشلة');
  });

  it('55. Partial result shows issues log', () => {
    expect(commitResultContent).toContain('commitResult.issues');
  });

  it('56. No automatic retry in partial commit result', () => {
    expect(commitResultContent).not.toContain('onRetryCommit');
  });

  it('57. Terminal finish action present in commit result', () => {
    expect(commitResultContent).toContain('{onFinish && (');
  });

  // FULL SUCCESS
  it('58. Full success shown with emerald banner', () => {
    expect(commitResultContent).toContain('bg-emerald-950');
  });

  it('59. Result preserved for inspection', () => {
    expect(commitResultContent).toContain('commitResult.executedAt');
  });

  it('60. Finish action invokes explicit reset only after user click', () => {
    expect(commitResultContent).toContain('إنهاء الاستيراد');
  });

  // RESET
  it('61. Reset clears smartImportCommitResult', () => {
    const fnIdx = wizardContent.indexOf('handleResetRosterImport');
    const fnBlock = wizardContent.slice(fnIdx, fnIdx + 1000);
    expect(fnBlock).toContain('setSmartImportCommitResult(null)');
    expect(fnBlock).toContain('setSmartImportCommitError(null)');
  });

  it('62. Reset returns to SOURCE_DISCOVERY stage', () => {
    const fnIdx = wizardContent.indexOf('handleResetRosterImport');
    const fnBlock = wizardContent.slice(fnIdx, fnIdx + 1000);
    expect(fnBlock).toContain("setRosterImportStage('SOURCE_DISCOVERY')");
  });

  // STAGE CEILING & REGRESSION
  it('63. FINAL_REVIEW reachable only after C4', () => {
    expect(wizardContent).toContain("rosterImportStage === 'FINAL_REVIEW'");
  });

  it('64. COMMIT_RESULT reachable only after actual commit attempt', () => {
    expect(wizardContent).toContain("rosterImportStage === 'COMMIT_RESULT'");
  });

  it('65. Stepper remains informational and non-clickable', () => {
    const stepperIdx = wizardContent.indexOf('C1 Layered Smart Import Stage Indicator Stepper');
    const stepperBlock = wizardContent.slice(stepperIdx, stepperIdx + 1500);
    expect(stepperBlock).not.toContain('onClick');
  });

  it('66. COMMIT_RESULT mount does not pass onClose to prevent navigating back to FINAL_REVIEW', () => {
    const layerIdx = wizardContent.indexOf('<RosterCommitResultLayer');
    const layerBlock = wizardContent.slice(layerIdx, layerIdx + 400);
    expect(layerBlock).not.toContain('onClose=');
  });

  it('67. handleSmartImportCommit fails closed if smartImportCommitResult is not null', () => {
    const fnIdx = wizardContent.indexOf('handleSmartImportCommit');
    const fnBlock = wizardContent.slice(fnIdx, fnIdx + 500);
    expect(fnBlock).toContain('if (smartImportCommitResult !== null)');
    expect(fnBlock).toContain('تم تنفيذ محاولة الاستيراد بالفعل لهذه الجلسة');
  });
});

import { UnifiedImportPipelineService } from '../services/import/unifiedImportPipeline.service';
import { UnifiedImportBatch, PipelineContext, ImportResult } from '../types/unifiedImport';

describe('C5 — UnifiedImportPipelineService executeCommit Partial Contract Runtime Suite', () => {
  const dummyContext: PipelineContext = {
    projectId: 'PRJ-TEST',
    userId: 'USR-TEST',
    operationId: 'OP-TEST-001',
  };

  it('Case A — FULL SUCCESS: 2 active rows succeed', async () => {
    const mockCommitter = {
      commit: async (batch: UnifiedImportBatch, ctx: PipelineContext): Promise<ImportResult> => ({
        importBatchId: batch.importBatchId,
        projectId: batch.projectId,
        operationId: ctx.operationId,
        sourceType: 'EXCEL_CSV',
        success: true,
        totalRows: 2,
        committedRows: 2,
        skippedRows: 0,
        failedRows: 0,
        issues: [],
        executedAt: new Date().toISOString(),
      }),
    };

    const pipeline = new UnifiedImportPipelineService({ committer: mockCommitter as any });
    const batch: UnifiedImportBatch = {
      importBatchId: 'BATCH-001',
      projectId: 'PRJ-TEST',
      source: { sourceType: 'EXCEL_CSV' },
      totalRows: 2,
      validRows: 2,
      errorRows: 0,
      warningRows: 0,
      requiresReviewRows: 0,
      rows: [
        { rowNumber: 1, raw: {}, canonical: {}, status: 'VALID', reviewStatus: 'resolved' },
        { rowNumber: 2, raw: {}, canonical: {}, status: 'VALID', reviewStatus: 'resolved' },
      ],
      issues: [],
      auditTrail: [],
      currentStage: 'REVIEW',
      commitStatus: 'READY_TO_COMMIT',
    };

    const { batch: finalBatch, result } = await pipeline.executeCommit(batch, dummyContext);

    expect(result.committedRows).toBe(2);
    expect(result.failedRows).toBe(0);
    expect(finalBatch.commitStatus).toBe('COMMITTED');
    expect(finalBatch.rows[0].status).toBe('COMMITTED');
    expect(finalBatch.rows[1].status).toBe('COMMITTED');
  });

  it('Case B — PARTIAL FAILURE: row 1 succeeds, row 2 fails', async () => {
    const mockCommitter = {
      commit: async (batch: UnifiedImportBatch, ctx: PipelineContext): Promise<ImportResult> => ({
        importBatchId: batch.importBatchId,
        projectId: batch.projectId,
        operationId: ctx.operationId,
        sourceType: 'EXCEL_CSV',
        success: true,
        totalRows: 2,
        committedRows: 1,
        skippedRows: 1,
        failedRows: 1,
        issues: [
          {
            issueId: 'ISSUE-2-FAIL',
            row: 2,
            field: 'driverName',
            code: 'CANONICAL_INTAKE_FAILED',
            severity: 'BLOCKING',
            message: 'Row 2 commitment failed',
            resolvable: false,
            blocking: true,
          },
        ],
        executedAt: new Date().toISOString(),
      }),
    };

    const pipeline = new UnifiedImportPipelineService({ committer: mockCommitter as any });
    const batch: UnifiedImportBatch = {
      importBatchId: 'BATCH-002',
      projectId: 'PRJ-TEST',
      source: { sourceType: 'EXCEL_CSV' },
      totalRows: 2,
      validRows: 2,
      errorRows: 0,
      warningRows: 0,
      requiresReviewRows: 0,
      rows: [
        { rowNumber: 1, raw: {}, canonical: {}, status: 'VALID', reviewStatus: 'resolved' },
        { rowNumber: 2, raw: {}, canonical: {}, status: 'VALID', reviewStatus: 'resolved' },
      ],
      issues: [],
      auditTrail: [],
      currentStage: 'REVIEW',
      commitStatus: 'READY_TO_COMMIT',
    };

    const { batch: finalBatch, result } = await pipeline.executeCommit(batch, dummyContext);

    expect(result.committedRows).toBe(1);
    expect(result.failedRows).toBe(1);
    expect(finalBatch.commitStatus).not.toBe('COMMITTED');
    expect(finalBatch.commitStatus).toBe('FAILED');
    expect(finalBatch.rows[0].status).toBe('COMMITTED');
    expect(finalBatch.rows[1].status).not.toBe('COMMITTED');
    expect(finalBatch.rows[1].status).toBe('ERROR');
    expect(finalBatch.issues).toContainEqual(expect.objectContaining({ issueId: 'ISSUE-2-FAIL' }));
  });

  it('Case C — FULL FAILURE: both rows fail', async () => {
    const mockCommitter = {
      commit: async (batch: UnifiedImportBatch, ctx: PipelineContext): Promise<ImportResult> => ({
        importBatchId: batch.importBatchId,
        projectId: batch.projectId,
        operationId: ctx.operationId,
        sourceType: 'EXCEL_CSV',
        success: false,
        totalRows: 2,
        committedRows: 0,
        skippedRows: 2,
        failedRows: 2,
        issues: [
          {
            issueId: 'ISSUE-1-FAIL',
            row: 1,
            field: 'driverName',
            code: 'CANONICAL_INTAKE_FAILED',
            severity: 'BLOCKING',
            message: 'Row 1 failed',
            resolvable: false,
            blocking: true,
          },
          {
            issueId: 'ISSUE-2-FAIL',
            row: 2,
            field: 'driverName',
            code: 'CANONICAL_INTAKE_FAILED',
            severity: 'BLOCKING',
            message: 'Row 2 failed',
            resolvable: false,
            blocking: true,
          },
        ],
        executedAt: new Date().toISOString(),
      }),
    };

    const pipeline = new UnifiedImportPipelineService({ committer: mockCommitter as any });
    const batch: UnifiedImportBatch = {
      importBatchId: 'BATCH-003',
      projectId: 'PRJ-TEST',
      source: { sourceType: 'EXCEL_CSV' },
      totalRows: 2,
      validRows: 2,
      errorRows: 0,
      warningRows: 0,
      requiresReviewRows: 0,
      rows: [
        { rowNumber: 1, raw: {}, canonical: {}, status: 'VALID', reviewStatus: 'resolved' },
        { rowNumber: 2, raw: {}, canonical: {}, status: 'VALID', reviewStatus: 'resolved' },
      ],
      issues: [],
      auditTrail: [],
      currentStage: 'REVIEW',
      commitStatus: 'READY_TO_COMMIT',
    };

    const { batch: finalBatch, result } = await pipeline.executeCommit(batch, dummyContext);

    expect(result.committedRows).toBe(0);
    expect(result.failedRows).toBe(2);
    expect(finalBatch.commitStatus).toBe('FAILED');
    expect(finalBatch.rows[0].status).not.toBe('COMMITTED');
    expect(finalBatch.rows[1].status).not.toBe('COMMITTED');
  });

  it('Case D — ZERO WORK: no active commit-eligible rows', async () => {
    const mockCommitter = {
      commit: async (batch: UnifiedImportBatch, ctx: PipelineContext): Promise<ImportResult> => ({
        importBatchId: batch.importBatchId,
        projectId: batch.projectId,
        operationId: ctx.operationId,
        sourceType: 'EXCEL_CSV',
        success: true,
        totalRows: 1,
        committedRows: 0,
        skippedRows: 1,
        failedRows: 0,
        issues: [],
        executedAt: new Date().toISOString(),
      }),
    };

    const pipeline = new UnifiedImportPipelineService({ committer: mockCommitter as any });
    const batch: UnifiedImportBatch = {
      importBatchId: 'BATCH-004',
      projectId: 'PRJ-TEST',
      source: { sourceType: 'EXCEL_CSV' },
      totalRows: 1,
      validRows: 0,
      errorRows: 0,
      warningRows: 0,
      requiresReviewRows: 0,
      rows: [
        { rowNumber: 1, raw: {}, canonical: {}, status: 'REJECTED', reviewStatus: 'resolved' },
      ],
      issues: [],
      auditTrail: [],
      currentStage: 'REVIEW',
      commitStatus: 'REVIEW_REQUIRED',
    };

    const { batch: finalBatch, result } = await pipeline.executeCommit(batch, dummyContext);

    expect(result.committedRows).toBe(0);
    expect(result.failedRows).toBe(0);
    expect(finalBatch.commitStatus).not.toBe('COMMITTED');
  });
});
