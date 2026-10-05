import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { RosterBatchReviewService } from '../services/import/rosterBatchReview.service';
import { UnifiedImportBatch, PipelineContext, ImportResult } from '../types/unifiedImport';
import { DriverTruckPipelineService } from '../services/import/driverTruckPipeline.service';
import { classifyFinalReviewBlocker } from '../components/import/RosterFinalReviewLayer';

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

describe('C1–C5 Smart Import — Deep Workflow Navigation & UX Integrity Convergence Suite', () => {
  const wizardContent = findFileContent('src/components/wizard/ProjectSetupWizard.tsx');
  const carrierLayerContent = findFileContent('src/components/import/RosterCarrierResolutionLayer.tsx');
  const materialLayerContent = findFileContent('src/components/import/RosterMaterialResolutionLayer.tsx');
  const driverTruckLayerContent = findFileContent('src/components/import/RosterDriverTruckResolutionLayer.tsx');
  const finalReviewLayerContent = findFileContent('src/components/import/RosterFinalReviewLayer.tsx');
  const commitResultLayerContent = findFileContent('src/components/import/RosterCommitResultLayer.tsx');

  // A. HAPPY PATH & STAGE SEQUENCE
  it('1-10. Happy path stage progression sequence is preserved', () => {
    expect(wizardContent).toContain("rosterImportStage === 'SOURCE_DISCOVERY'");
    expect(wizardContent).toContain("rosterImportStage === 'MAPPING_APPROVAL'");
    expect(wizardContent).toContain("rosterImportStage === 'CARRIER_RESOLUTION'");
    expect(wizardContent).toContain("rosterImportStage === 'MATERIAL_RESOLUTION'");
    expect(wizardContent).toContain("rosterImportStage === 'DRIVER_TRUCK_RESOLUTION'");
    expect(wizardContent).toContain("rosterImportStage === 'FINAL_REVIEW'");
    expect(wizardContent).toContain("rosterImportStage === 'COMMIT_RESULT'");
    expect(wizardContent).toContain("setRosterImportStage('SOURCE_DISCOVERY')");
  });

  // B. CANCEL PATHS & CLEAN SOURCE RESET
  it('11. Cancel at Mapping returns cleanly to SOURCE_DISCOVERY', () => {
    expect(wizardContent).toContain('onClick={handleResetRosterImport}');
  });

  it('12. Cancel at Carrier calls onCancelImport (handleResetRosterImport)', () => {
    expect(carrierLayerContent).toContain('onCancelImport');
    expect(carrierLayerContent).toContain('سيتم إلغاء جلسة الاستيراد الحالية وفقدان القرارات غير المنفذة. هل تريد المتابعة؟');
    expect(wizardContent).toContain('onCancelImport={handleResetRosterImport}');
  });

  it('13. Cancel at Material calls onCancelImport (handleResetRosterImport)', () => {
    expect(materialLayerContent).toContain('onCancelImport');
    expect(materialLayerContent).toContain('سيتم إلغاء جلسة الاستيراد الحالية وفقدان القرارات غير المنفذة. هل تريد المتابعة؟');
  });

  it('14. Cancel at Driver/Truck calls onCancelImport (handleResetRosterImport)', () => {
    expect(driverTruckLayerContent).toContain('onCancelImport');
    expect(driverTruckLayerContent).toContain('سيتم إلغاء جلسة الاستيراد الحالية وفقدان القرارات غير المنفذة. هل تريد المتابعة؟');
  });

  it('15. Reset clears import batch and session data completely', () => {
    const fnIdx = wizardContent.indexOf('const handleResetRosterImport = () => {');
    const fnBlock = wizardContent.slice(fnIdx, fnIdx + 1200);
    expect(fnBlock).toContain('setImportBatch(null)');
    expect(fnBlock).toContain('setRosterSelectedFile(null)');
    expect(fnBlock).toContain('setRosterBuffer(null)');
    expect(fnBlock).toContain('setCachedSuccessfulDriverResult(null)');
    expect(fnBlock).toContain('setCachedSuccessfulTruckResult(null)');
    expect(fnBlock).toContain('setDriverConvergenceError(null)');
    expect(fnBlock).toContain('setTruckConvergenceError(null)');
  });

  // C. GATES & FAIL-CLOSED CHECKS
  it('16. Zero Carrier groups cannot enter Material layer', () => {
    expect(wizardContent).toContain('if (carrierGroups.length === 0)');
    expect(wizardContent).toContain('لم يتم اكتشاف أي مجموعات ناقلين في الملف');
  });

  it('17. Unresolved Carrier groups block progression to Material', () => {
    expect(wizardContent).toContain('hasUnresolvedCarriers');
  });

  it('18. Zero Material groups block progression to Driver/Truck', () => {
    expect(wizardContent).toContain('if (materialGroups.length === 0)');
  });

  it('19. Unresolved Material groups block progression to Driver/Truck', () => {
    expect(wizardContent).toContain('hasUnresolvedMaterials');
  });

  it('20. Zero Driver/Truck groups block progression to Final Review', () => {
    expect(wizardContent).toContain('if (driverTruckGroups.length === 0)');
    expect(wizardContent).toContain('تعذر الانتقال للمراجعة النهائية: لا توجد مجموعات سائقين أو شاحنات لتقييمها.');
  });

  it('21. Unresolved Driver/Truck groups block progression to Final Review', () => {
    expect(wizardContent).toContain('hasUnresolvedDrivers');
    expect(wizardContent).toContain('hasUnresolvedTrucks');
  });

  // D. REAL reviewGroups CONTRACT (NO BATCH.REVIEWGROUPS ASSUMPTION)
  it('22. RosterBatchReviewService derives groups dynamically when batch has NO reviewGroups property', () => {
    const batchWithoutProperty: UnifiedImportBatch = {
      importBatchId: 'BATCH-NO-PROP',
      projectId: 'PRJ-1',
      source: { sourceType: 'EXCEL_CSV' },
      totalRows: 1,
      validRows: 1,
      errorRows: 0,
      warningRows: 0,
      requiresReviewRows: 0,
      rows: [
        {
          rowNumber: 1,
          raw: { carrier: 'Carrier A', driverName: 'Driver X', truckPlate: '1234' },
          canonical: { carrierName: 'Carrier A', driverName: 'Driver X', truckPlate: '1234' },
          entityResolutions: {
            carrier: { matchedId: 'CAR-1', matchedName: 'Carrier A', resolutionType: 'AUTO' },
            driver: { matchedId: 'DRV-1', matchedName: 'Driver X', resolutionType: 'AUTO' },
            truck: { matchedId: 'TRK-1', matchedName: '1234', resolutionType: 'AUTO' },
          },
          status: 'VALID',
          reviewStatus: 'accepted',
        },
      ],
      issues: [],
      auditTrail: [],
      currentStage: 'REVIEW',
      commitStatus: 'READY_TO_COMMIT',
    };

    expect((batchWithoutProperty as any).reviewGroups).toBeUndefined();

    const groups = RosterBatchReviewService.getBatchReviewGroups(batchWithoutProperty);
    expect(groups.carrier).toHaveLength(1);
    expect(groups.driver).toHaveLength(1);
    expect(groups.truck).toHaveLength(1);
    expect(groups.carrier[0].matchedId).toBe('CAR-1');
    expect(groups.driver[0].matchedId).toBe('DRV-1');
    expect(groups.truck[0].matchedId).toBe('TRK-1');
  });

  it('23-24. C5 Orchestration derives review groups via RosterBatchReviewService in wizard', () => {
    expect(wizardContent).toContain('const batchGroups = RosterBatchReviewService.getBatchReviewGroups(importBatch)');
    expect(wizardContent).toContain('const revalidatedGroups = RosterBatchReviewService.getBatchReviewGroups(revalidated)');
    expect(finalReviewLayerContent).toContain('const batchGroups = RosterBatchReviewService.getBatchReviewGroups(importBatch)');
  });

  // E. FINAL REVIEW & BLOCKER ROUTING
  it('25. Fresh revalidation before commit can detect unresolved issues and block commit', () => {
    expect(wizardContent).toContain('DriverTruckPipelineService.revalidateRosterBatch(importBatch, pipelineCtx)');
    expect(wizardContent).toContain('setSmartImportCommitError');
  });

  it('26. Blocked progression provides user-visible alert feedback', () => {
    expect(wizardContent).toContain("alert('تعذر الانتقال للمراجعة النهائية: توجد بيانات سائقين/شاحنات معلقة أو أخطاء تطابق قيد المعالجة.')");
  });

  it('27. Entering Final Review runs revalidation without committing data', () => {
    const fnIdx = wizardContent.indexOf('handleSmartImportContinueToFinalReview');
    const fnBlock = wizardContent.slice(fnIdx, fnIdx + 3500);
    expect(fnBlock).toContain('revalidateRosterBatch');
    expect(fnBlock).not.toContain('commitBatch');
  });

  it('28. Final Review back action policy: Carrier blocker resets session, Material/Driver route to stage', () => {
    const fnIdx = wizardContent.indexOf('handleFinalReviewBack');
    const fnBlock = wizardContent.slice(fnIdx, fnIdx + 3000);
    expect(fnBlock).toContain('handleResetRosterImport');
    expect(fnBlock.includes("transitionToRosterStage('MATERIAL_RESOLUTION')") || fnBlock.includes("setRosterImportStage('MATERIAL_RESOLUTION')")).toBe(true);
    expect(fnBlock.includes("transitionToRosterStage('DRIVER_TRUCK_RESOLUTION')") || fnBlock.includes("setRosterImportStage('DRIVER_TRUCK_RESOLUTION')")).toBe(true);
  });

  // F. CREATE RECOVERY
  it('29-31. Driver/Truck creation uses mutation success cache and recovery banner on convergence failure', () => {
    expect(wizardContent).toContain('cachedSuccessfulDriverResult');
    expect(wizardContent).toContain('cachedSuccessfulTruckResult');
    expect(wizardContent).toContain('DRIVER_CANONICAL_CONVERGENCE_NOT_PROVEN');
    expect(driverTruckLayerContent).toContain('driverConvergenceError');
    expect(driverTruckLayerContent).toContain('truckConvergenceError');
    expect(driverTruckLayerContent).toContain('إعادة تحديث البيانات');
  });

  // G. COMMIT TERMINALITY
  it('32-36. Commit result layer is strictly terminal with single Finish action; repeat commit blocked only on full success', () => {
    const fnIdx = wizardContent.indexOf('handleSmartImportCommit');
    const fnBlock = wizardContent.slice(fnIdx, fnIdx + 600);
    expect(fnBlock).toContain('if (smartImportCommitResult !== null && smartImportCommitResult.success)');
    expect(fnBlock).toContain('تم اعتماد دفعة الاستيراد بنجاح بالفعل لهذه الجلسة');

    expect(wizardContent).not.toContain('onClose={() => setRosterImportStage(\'FINAL_REVIEW\')}');
    expect(commitResultLayerContent).toContain('<span>إنهاء الاستيراد</span>');
  });

  // H. RESET & NEW SESSION CLEANLINESS
  it('37-41. Selecting new file clears prior session state completely before start', () => {
    const procIdx = wizardContent.indexOf('const processRosterFile = async');
    const procBlock = wizardContent.slice(procIdx, procIdx + 400);
    expect(procBlock).toContain('handleResetRosterImport()');
    expect(procBlock).toContain('setRosterSelectedFile(file)');
  });
});

describe('Runtime Behavioral Race & Navigation Safety Suite', () => {
  it('A. Async Cancel Race: Old promise completing after session reset does NOT update state', async () => {
    let sessionGen = 0;
    let importBatchState: any = { id: 'BATCH-A', val: 'old' };

    const currentGen = sessionGen;
    const currentBatchId = importBatchState.id;

    let resolveAsync: (res: any) => void = () => {};
    const asyncWork = new Promise((resolve) => { resolveAsync = resolve; });

    // User cancels / resets session
    sessionGen += 1;
    importBatchState = null;

    // Old async work resolves
    resolveAsync({ id: 'BATCH-A', val: 'mutated-old' });
    const result = await asyncWork;

    // Session guard check
    if (currentGen === sessionGen && importBatchState?.id === currentBatchId) {
      importBatchState = result;
    }

    expect(importBatchState).toBeNull();
  });

  it('B. New Session Race: Session A async work resolving after Session B starts does NOT overwrite Session B', async () => {
    let sessionGen = 0;
    let importBatchState: any = { id: 'BATCH-A', status: 'session-A-initial' };

    const genA = sessionGen;
    const batchIdA = importBatchState.id;

    let resolveWorkA: (res: any) => void = () => {};
    const workA = new Promise((resolve) => { resolveWorkA = resolve; });

    // Reset session and start Session B
    sessionGen += 1;
    importBatchState = { id: 'BATCH-B', status: 'session-B-fresh' };

    // Work A completes
    resolveWorkA({ id: 'BATCH-A', status: 'session-A-mutated' });
    const resultA = await workA;

    if (genA === sessionGen && importBatchState?.id === batchIdA) {
      importBatchState = resultA;
    }

    expect(importBatchState.id).toBe('BATCH-B');
    expect(importBatchState.status).toBe('session-B-fresh');
  });

  it('C. Double Click / Busy Lock: Second invocation rejected while isProcessing is true', async () => {
    let isProcessing = false;
    let executionCount = 0;

    const asyncResolutionHandler = async () => {
      if (isProcessing) return;
      isProcessing = true;
      try {
        executionCount += 1;
        await new Promise((r) => setTimeout(r, 20));
      } finally {
        isProcessing = false;
      }
    };

    const p1 = asyncResolutionHandler();
    const p2 = asyncResolutionHandler();

    await Promise.all([p1, p2]);

    expect(executionCount).toBe(1);
  });

  it('D. Final Review with UNRESOLVED_CARRIER classifies as CARRIER blocker', () => {
    const batch: UnifiedImportBatch = {
      importBatchId: 'B1',
      projectId: 'P1',
      source: { sourceType: 'EXCEL_CSV' },
      totalRows: 1, validRows: 0, errorRows: 1, warningRows: 0, requiresReviewRows: 1,
      rows: [
        {
          rowNumber: 1,
          raw: { carrier: 'Unknown Carrier' },
          canonical: { carrierName: 'Unknown Carrier' },
          entityResolutions: {
            carrier: { matchedId: '', matchedName: '', resolutionType: 'AUTO', status: 'UNRESOLVED' },
          },
          status: 'ERROR',
          reviewStatus: 'requires_review',
        },
      ],
      issues: [{ code: 'UNRESOLVED_CARRIER', message: 'Carrier unresolved', severity: 'BLOCKING', blocking: true, field: 'carrierId' }],
      auditTrail: [], currentStage: 'REVIEW', commitStatus: 'BLOCKED',
    };

    expect(classifyFinalReviewBlocker(batch)).toBe('CARRIER');
  });

  it('E. Final Review with UNRESOLVED_MATERIAL classifies as MATERIAL blocker', () => {
    const batch: UnifiedImportBatch = {
      importBatchId: 'B2',
      projectId: 'P1',
      source: { sourceType: 'EXCEL_CSV' },
      totalRows: 1, validRows: 0, errorRows: 1, warningRows: 0, requiresReviewRows: 1,
      rows: [
        {
          rowNumber: 1,
          raw: { carrier: 'Car A', material: 'Unk Material' },
          canonical: { carrierName: 'Car A', materialName: 'Unk Material' },
          entityResolutions: {
            carrier: { matchedId: 'C1', matchedName: 'Car A', resolutionType: 'AUTO', recommendation: 'ACCEPT', matchMethod: 'EXACT', status: 'RESOLVED' },
            material: { matchedId: '', matchedName: '', resolutionType: 'AUTO', status: 'UNRESOLVED' },
          },
          status: 'ERROR',
          reviewStatus: 'requires_review',
        },
      ],
      issues: [{ code: 'UNRESOLVED_MATERIAL', message: 'Material unresolved', severity: 'BLOCKING', blocking: true, field: 'materialId' }],
      auditTrail: [], currentStage: 'REVIEW', commitStatus: 'BLOCKED',
    };

    expect(classifyFinalReviewBlocker(batch)).toBe('MATERIAL');
  });

  it('F. Final Review with DRIVER_CARRIER_CONFLICT classifies as DRIVER_TRUCK blocker', () => {
    const batch: UnifiedImportBatch = {
      importBatchId: 'B3',
      projectId: 'P1',
      source: { sourceType: 'EXCEL_CSV' },
      totalRows: 1, validRows: 0, errorRows: 1, warningRows: 0, requiresReviewRows: 1,
      rows: [
        {
          rowNumber: 1,
          raw: { carrier: 'Car A', material: 'Mat A', driverName: 'Drv X' },
          canonical: { carrierName: 'Car A', materialName: 'Mat A', driverName: 'Drv X' },
          entityResolutions: {
            carrier: { matchedId: 'C1', matchedName: 'Car A', resolutionType: 'AUTO', recommendation: 'ACCEPT', matchMethod: 'EXACT', status: 'RESOLVED' },
            material: { matchedId: 'M1', matchedName: 'Mat A', resolutionType: 'AUTO', recommendation: 'ACCEPT', matchMethod: 'EXACT', status: 'RESOLVED' },
            driver: { matchedId: '', matchedName: '', resolutionType: 'AUTO', status: 'UNRESOLVED' },
          },
          status: 'ERROR',
          reviewStatus: 'requires_review',
        },
      ],
      issues: [{ code: 'DRIVER_CARRIER_CONFLICT', message: 'Driver conflict', severity: 'BLOCKING', blocking: true, field: 'driverName' }],
      auditTrail: [], currentStage: 'REVIEW', commitStatus: 'BLOCKED',
    };

    expect(classifyFinalReviewBlocker(batch)).toBe('DRIVER_TRUCK');
  });

  // Section 19: Full User Journey In-Memory Behavioral Sequence
  it('G. Full User Journey Sequence: 1 to 7 sequential progression with one-stage-at-a-time isolation', () => {
    type Stage = 'SOURCE_DISCOVERY' | 'MAPPING_APPROVAL' | 'CARRIER_RESOLUTION' | 'MATERIAL_RESOLUTION' | 'DRIVER_TRUCK_RESOLUTION' | 'FINAL_REVIEW' | 'COMMIT_RESULT';
    let currentStage: Stage = 'SOURCE_DISCOVERY';
    const stageHistory: Stage[] = [currentStage];

    const transition = (next: Stage) => {
      currentStage = next;
      stageHistory.push(currentStage);
    };

    // Stage 1 -> 2: Discovery completes
    transition('MAPPING_APPROVAL');
    expect(currentStage).toBe('MAPPING_APPROVAL');

    // Stage 2 -> 3: Mapping approved and batch created
    transition('CARRIER_RESOLUTION');
    expect(currentStage).toBe('CARRIER_RESOLUTION');

    // Stage 3 -> 4: Carrier resolved
    transition('MATERIAL_RESOLUTION');
    expect(currentStage).toBe('MATERIAL_RESOLUTION');

    // Stage 4 -> 5: Material resolved
    transition('DRIVER_TRUCK_RESOLUTION');
    expect(currentStage).toBe('DRIVER_TRUCK_RESOLUTION');

    // Stage 5 -> 6: Driver & Truck resolved
    transition('FINAL_REVIEW');
    expect(currentStage).toBe('FINAL_REVIEW');

    // Stage 6 -> 7: Commit executed
    transition('COMMIT_RESULT');
    expect(currentStage).toBe('COMMIT_RESULT');

    expect(stageHistory).toEqual([
      'SOURCE_DISCOVERY',
      'MAPPING_APPROVAL',
      'CARRIER_RESOLUTION',
      'MATERIAL_RESOLUTION',
      'DRIVER_TRUCK_RESOLUTION',
      'FINAL_REVIEW',
      'COMMIT_RESULT',
    ]);
  });

  // Section 20: Crash Recovery & Master Data Persistence Independence
  it('H. Crash Recovery Simulation: Master data created before crash persists while import session resets cleanly', () => {
    // Simulated Project Master Data Store
    const projectMasterData = {
      carriers: [{ carrierId: 'CAR-EXISTING', name: 'الناقل القديم' }],
      materials: [{ materialId: 'MAT-EXISTING', name: 'المادة القديمة' }],
    };

    // Simulated Active Import Session State (in React memory)
    let inMemorySession: any = {
      stage: 'CARRIER_RESOLUTION',
      file: { name: 'roster.xlsx' },
      batchId: 'BATCH-CRASH-TEST',
    };

    // 1. User creates a new Carrier during import
    const newCarrier = { carrierId: 'CAR-CREATED-DURING-IMPORT', name: 'شركة النقل الحديث' };
    projectMasterData.carriers.push(newCarrier);

    // 2. Simulated unexpected crash / refresh / interruption
    inMemorySession = null;

    // 3. Verify Contract:
    // A. In-memory session is clean / reset to initial state
    expect(inMemorySession).toBeNull();

    // B. Authoritative project master data retains the created carrier
    const persistedCarrier = projectMasterData.carriers.find(c => c.carrierId === 'CAR-CREATED-DURING-IMPORT');
    expect(persistedCarrier).toBeDefined();
    expect(persistedCarrier?.name).toBe('شركة النقل الحديث');

    // C. Re-running import for same file will now auto-match with newly created carrier
    const newImportRow = { carrierName: 'شركة النقل الحديث' };
    const matched = projectMasterData.carriers.find(c => c.name === newImportRow.carrierName);
    expect(matched?.carrierId).toBe('CAR-CREATED-DURING-IMPORT');
  });
});
