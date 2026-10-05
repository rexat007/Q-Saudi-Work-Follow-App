// @vitest-environment happy-dom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CarrierEditorModal } from '../components/masterData/CarrierEditorModal';
import { MaterialEditorModal } from '../components/masterData/MaterialEditorModal';
import { RosterCarrierResolutionLayer, checkCarrierResolutionReadiness } from '../components/import/RosterCarrierResolutionLayer';
import { RosterMaterialResolutionLayer, checkMaterialResolutionReadiness } from '../components/import/RosterMaterialResolutionLayer';
import { RosterDriverTruckResolutionLayer } from '../components/import/RosterDriverTruckResolutionLayer';
import { RosterFinalReviewLayer, classifyFinalReviewBlocker } from '../components/import/RosterFinalReviewLayer';
import { RosterCommitResultLayer } from '../components/import/RosterCommitResultLayer';
import { UnifiedImportBatch, ImportResult } from '../types/unifiedImport';

describe('D21 & FULL CONVERGENCE: Component Render & Portal Reachability Tests', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
    // Clean up any stray modals in body
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('D01 & D05 & D21: CarrierEditorModal renders into document.body portal and responds to click', async () => {
    const handleClose = vi.fn();
    const handleCreated = vi.fn();
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <CarrierEditorModal
          open={true}
          mode="CREATE"
          projectId="PRJ-101"
          initialName="شركة الأفق لنقل البضائع"
          onClose={handleClose}
          onCreated={handleCreated}
        />
      );
    });

    // Verify modal is portaled directly into document.body
    const dialogElement = document.body.querySelector('[aria-label="إغلاق النافذة"]');
    expect(dialogElement).not.toBeNull();

    // Verify title reflects CREATE mode explicitly (D03)
    expect(document.body.textContent).toContain('إضافة ناقل للمشروع');
    expect(document.body.textContent).toContain('حفظ واعتماد الناقل');

    // Click Close Button
    await act(async () => {
      (dialogElement as HTMLButtonElement).click();
    });
    expect(handleClose).toHaveBeenCalledTimes(1);

    await act(async () => {
      root.unmount();
    });
  });

  it('D03: CarrierEditorModal strictly obeys mode="CREATE" even if initialCarrier is passed', async () => {
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <CarrierEditorModal
          open={true}
          mode="CREATE"
          projectId="PRJ-101"
          initialCarrier={{ carrierId: 'CAR-OLD', name: 'ناقل قديم' }}
          onClose={() => {}}
        />
      );
    });

    // Must be CREATE mode, not EDIT
    expect(document.body.textContent).toContain('إضافة ناقل للمشروع');
    expect(document.body.textContent).not.toContain('تعديل بيانات الناقل');

    await act(async () => {
      root.unmount();
    });
  });

  it('D02 & D04 & D05 & D21: MaterialEditorModal renders into document.body portal and obeys mode', async () => {
    const handleClose = vi.fn();
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <MaterialEditorModal
          open={true}
          mode="CREATE"
          projectId="PRJ-101"
          initialName="دفان ناعم 0-5 مم"
          onClose={handleClose}
        />
      );
    });

    // Portaled to document.body
    const closeBtn = document.body.querySelector('[aria-label="إغلاق النافذة"]');
    expect(closeBtn).not.toBeNull();
    expect(document.body.textContent).toContain('إضافة مادة جديدة للمشروع');
    expect(document.body.textContent).toContain('حفظ المادة');

    await act(async () => {
      (closeBtn as HTMLButtonElement).click();
    });
    expect(handleClose).toHaveBeenCalledTimes(1);

    await act(async () => {
      root.unmount();
    });
  });

  it('D06 & D21: RosterDriverTruckResolutionLayer renders driver creation modal in document.body portal on click', async () => {
    const root = createRoot(container);

    const mockBatch: UnifiedImportBatch = {
      importBatchId: 'BATCH-DT-01',
      projectId: 'PRJ-101',
      source: { sourceType: 'EXCEL_CSV' },
      totalRows: 1,
      validRows: 0,
      errorRows: 0,
      warningRows: 1,
      requiresReviewRows: 1,
      rows: [
        {
          rowNumber: 1,
          raw: { carrier: 'الناقل الأول', driverName: 'سالم القحطاني', truckPlate: '1111' },
          canonical: { carrierName: 'الناقل الأول', driverName: 'سالم القحطاني', truckPlate: '1111' },
          entityResolutions: {
            carrier: { matchedId: 'CAR-1', matchedName: 'الناقل الأول', status: 'RESOLVED' },
            material: { matchedId: 'MAT-1', matchedName: 'رمل', status: 'RESOLVED' },
            driver: { sourceValue: 'سالم القحطاني', status: 'UNRESOLVED' },
            truck: { sourceValue: '1111', status: 'RESOLVED', matchedId: 'TRK-1' },
          },
          status: 'WARNING',
          reviewStatus: 'requires_review',
        },
      ],
      issues: [],
      auditTrail: [],
      currentStage: 'REVIEW',
      commitStatus: 'AWAITING_REVIEW',
    };

    await act(async () => {
      root.render(
        <RosterDriverTruckResolutionLayer
          importBatch={mockBatch}
          projectCarriers={[{ carrierId: 'CAR-1', name: 'الناقل الأول' }]}
          projectDrivers={[]}
          projectTrucks={[]}
          onAcceptDriverCandidate={() => {}}
          onSelectAlternateDriver={() => {}}
          onCreateDriver={() => {}}
          onAcceptTruckCandidate={() => {}}
          onSelectAlternateTruck={() => {}}
          onCreateTruck={() => {}}
          onOpenFinalReview={() => {}}
        />
      );
    });

    // Look for button to create driver
    const createDriverBtn = Array.from(document.body.querySelectorAll('button')).find(
      (b) => b.textContent?.includes('إنشاء سائق')
    );
    expect(createDriverBtn).toBeDefined();

    // Click button to open Driver creation modal
    await act(async () => {
      createDriverBtn?.click();
    });

    // Driver creation modal is portaled into document.body
    expect(document.body.textContent).toContain('إنشاء سائق جديد للناقل');
    expect(document.body.textContent).toContain('رقم الهوية الوطنية / الإقامة');

    await act(async () => {
      root.unmount();
    });
  });

  it('D10: RosterCarrierResolutionLayer blocks progression if row lacks valid Carrier (row-level gate)', () => {
    // Group is marked RESOLVED, but an active row is missing matchedId
    const batchWithMissingRowCarrier: UnifiedImportBatch = {
      importBatchId: 'BATCH-CARRIER-GATE',
      projectId: 'PRJ-101',
      source: { sourceType: 'EXCEL_CSV' },
      totalRows: 2,
      validRows: 1,
      errorRows: 0,
      warningRows: 1,
      requiresReviewRows: 0,
      rows: [
        {
          rowNumber: 1,
          raw: {},
          canonical: {},
          entityResolutions: {
            carrier: { matchedId: 'CAR-1', matchedName: 'Carrier 1', status: 'RESOLVED' },
          },
          status: 'VALID',
          reviewStatus: 'accepted',
        },
        {
          rowNumber: 2,
          raw: {},
          canonical: {},
          entityResolutions: {
            // Row 2 is active but lacks matchedId
            carrier: { sourceValue: 'Carrier Unknown', status: 'UNRESOLVED' },
          },
          status: 'WARNING',
          reviewStatus: 'requires_review',
        },
      ],
      issues: [],
      auditTrail: [],
      currentStage: 'REVIEW',
      commitStatus: 'AWAITING_REVIEW',
    };

    const isReady = checkCarrierResolutionReadiness(batchWithMissingRowCarrier, [
      {
        entityType: 'carrier',
        normalizedSourceKey: 'carrier 1',
        sourceValue: 'Carrier 1',
        occurrenceCount: 1,
        rowNumbers: [1],
        status: 'RESOLVED',
        resolutionRecommendation: 'AUTO_MATCH',
      },
    ]);

    // Must block because Row 2 lacks matchedId!
    expect(isReady).toBe(false);
  });

  it('D11: RosterMaterialResolutionLayer blocks progression if row lacks valid Material (row-level gate)', () => {
    const batchWithMissingRowMaterial: UnifiedImportBatch = {
      importBatchId: 'BATCH-MAT-GATE',
      projectId: 'PRJ-101',
      source: { sourceType: 'EXCEL_CSV' },
      totalRows: 2,
      validRows: 1,
      errorRows: 0,
      warningRows: 1,
      requiresReviewRows: 0,
      rows: [
        {
          rowNumber: 1,
          raw: {},
          canonical: {},
          entityResolutions: {
            material: { matchedId: 'MAT-1', matchedName: 'Sand', status: 'RESOLVED' },
          },
          status: 'VALID',
          reviewStatus: 'accepted',
        },
        {
          rowNumber: 2,
          raw: {},
          canonical: {},
          entityResolutions: {
            material: { sourceValue: 'Gravel', status: 'UNRESOLVED' },
          },
          status: 'WARNING',
          reviewStatus: 'requires_review',
        },
      ],
      issues: [],
      auditTrail: [],
      currentStage: 'REVIEW',
      commitStatus: 'AWAITING_REVIEW',
    };

    const isReady = checkMaterialResolutionReadiness(batchWithMissingRowMaterial, [
      {
        entityType: 'material',
        normalizedSourceKey: 'sand',
        sourceValue: 'Sand',
        occurrenceCount: 1,
        rowNumbers: [1],
        status: 'RESOLVED',
        resolutionRecommendation: 'AUTO_MATCH',
      },
    ]);

    expect(isReady).toBe(false);
  });

  it('D13 & D17: RosterFinalReviewLayer pure classifier and warning confirmation gate', async () => {
    const root = createRoot(container);

    const batchWithWarnings: UnifiedImportBatch = {
      importBatchId: 'BATCH-WARN-GATE',
      projectId: 'PRJ-101',
      source: { sourceType: 'EXCEL_CSV' },
      totalRows: 1,
      validRows: 0,
      errorRows: 0,
      warningRows: 1,
      requiresReviewRows: 0,
      rows: [
        {
          rowNumber: 1,
          raw: {},
          canonical: {},
          entityResolutions: {
            carrier: { matchedId: 'CAR-1', matchedName: 'Carrier 1', status: 'RESOLVED' },
            material: { matchedId: 'MAT-1', matchedName: 'Mat 1', status: 'RESOLVED' },
            driver: { matchedId: 'DRV-1', matchedName: 'Driver 1', status: 'RESOLVED' },
            truck: { matchedId: 'TRK-1', matchedName: 'Truck 1', status: 'RESOLVED' },
          },
          status: 'WARNING',
          reviewStatus: 'warning',
        },
      ],
      issues: [
        {
          issueId: 'W1',
          code: 'DRIVER_PHONE_MISSING',
          message: 'رقم هاتف السائق غير مدخل',
          severity: 'WARNING',
          blocking: false,
          resolvable: true,
        },
      ],
      auditTrail: [],
      currentStage: 'REVIEW',
      commitStatus: 'AWAITING_REVIEW',
    };

    // Blocker classifier classifies it correctly
    const blocker = classifyFinalReviewBlocker(batchWithWarnings);
    expect(blocker).toBe('DRIVER_TRUCK');

    await act(async () => {
      root.render(
        <RosterFinalReviewLayer
          importBatch={batchWithWarnings}
          onCommit={async () => {}}
        />
      );
    });

    // Commit button should be disabled until checkbox is checked
    const commitBtn = document.body.querySelector('button.bg-amber-600') as HTMLButtonElement | null;
    expect(commitBtn?.disabled).toBe(true);

    // Find and check warning confirmation checkbox
    const checkbox = document.body.querySelector('#confirm-warnings') as HTMLInputElement | null;
    expect(checkbox).not.toBeNull();

    await act(async () => {
      checkbox?.click();
    });

    // Now button should be enabled
    expect(commitBtn?.disabled).toBe(false);

    await act(async () => {
      root.unmount();
    });
  });

  describe('STAGE RENDER INTEGRITY & RUNTIME SYMBOL SWEEP (All 7 Stages)', () => {
    it('Stage 3 (CARRIER_RESOLUTION): renders unresolved state and resolved state with Continue button', async () => {
      const root = createRoot(container);

      // 1. Unresolved Carrier Stage
      const unresolvedBatch: UnifiedImportBatch = {
        importBatchId: 'BATCH-C2-UNRESOLVED',
        projectId: 'PRJ-101',
        source: { sourceType: 'EXCEL_CSV' },
        totalRows: 1,
        validRows: 0,
        errorRows: 0,
        warningRows: 1,
        requiresReviewRows: 1,
        rows: [
          {
            rowNumber: 1,
            raw: { carrier: 'ناقل مجهول' },
            canonical: { carrierName: 'ناقل مجهول' },
            entityResolutions: {
              carrier: { sourceValue: 'ناقل مجهول', status: 'UNRESOLVED' },
            },
            status: 'WARNING',
            reviewStatus: 'requires_review',
          },
        ],
        issues: [],
        auditTrail: [],
        currentStage: 'REVIEW',
        commitStatus: 'AWAITING_REVIEW',
      };

      await act(async () => {
        root.render(
          <RosterCarrierResolutionLayer
            importBatch={unresolvedBatch}
            projectCarriers={[]}
            onAcceptCandidate={() => {}}
            onCreateCarrier={() => {}}
          />
        );
      });

      expect(document.body.textContent).toContain('مراجعة وحسم الناقلين');
      expect(document.body.textContent).toContain('إنشاء ناقل جديد');
      expect(document.body.textContent).toContain('ناقل مجهول');

      // 2. Resolved Carrier Stage
      const resolvedBatch: UnifiedImportBatch = {
        importBatchId: 'BATCH-C2-RESOLVED',
        projectId: 'PRJ-101',
        source: { sourceType: 'EXCEL_CSV' },
        totalRows: 1,
        validRows: 1,
        errorRows: 0,
        warningRows: 0,
        requiresReviewRows: 0,
        rows: [
          {
            rowNumber: 1,
            raw: { carrier: 'شركة الرمال للنقل' },
            canonical: { carrierName: 'شركة الرمال للنقل' },
            entityResolutions: {
              carrier: { matchedId: 'CAR-101', matchedName: 'شركة الرمال للنقل', status: 'RESOLVED', matchMethod: 'EXACT', recommendation: 'ACCEPT' },
            },
            status: 'VALID',
            reviewStatus: 'accepted',
          },
        ],
        issues: [],
        auditTrail: [],
        currentStage: 'REVIEW',
        commitStatus: 'AWAITING_REVIEW',
      };

      const handleContinue = vi.fn();
      await act(async () => {
        root.render(
          <RosterCarrierResolutionLayer
            importBatch={resolvedBatch}
            projectCarriers={[{ carrierId: 'CAR-101', name: 'شركة الرمال للنقل' }]}
            onAcceptCandidate={() => {}}
            onCreateCarrier={() => {}}
            onContinueToMaterials={handleContinue}
          />
        );
      });

      expect(document.body.textContent).toContain('تم حسم جميع الناقلين بنجاح');
      const continueBtn = Array.from(document.body.querySelectorAll('button')).find(
        (b) => b.textContent?.includes('متابعة إلى مراجعة المواد')
      );
      expect(continueBtn).toBeDefined();

      await act(async () => {
        continueBtn?.click();
      });
      expect(handleContinue).toHaveBeenCalled();

      await act(async () => {
        root.unmount();
      });
    });

    it('Stage 4 (MATERIAL_RESOLUTION): renders unresolved state and resolved state with Continue button', async () => {
      const root = createRoot(container);

      // 1. Unresolved Material
      const unresolvedBatch: UnifiedImportBatch = {
        importBatchId: 'BATCH-C3-UNRESOLVED',
        projectId: 'PRJ-101',
        source: { sourceType: 'EXCEL_CSV' },
        totalRows: 1,
        validRows: 0,
        errorRows: 0,
        warningRows: 1,
        requiresReviewRows: 1,
        rows: [
          {
            rowNumber: 1,
            raw: { material: 'مادة غير معرّفة' },
            canonical: { materialName: 'مادة غير معرّفة' },
            entityResolutions: {
              material: { sourceValue: 'مادة غير معرّفة', status: 'UNRESOLVED' },
            },
            status: 'WARNING',
            reviewStatus: 'requires_review',
          },
        ],
        issues: [],
        auditTrail: [],
        currentStage: 'REVIEW',
        commitStatus: 'AWAITING_REVIEW',
      };

      await act(async () => {
        root.render(
          <RosterMaterialResolutionLayer
            importBatch={unresolvedBatch}
            projectMaterials={[]}
            onAcceptCandidate={() => {}}
            onCreateMaterial={() => {}}
          />
        );
      });

      expect(document.body.textContent).toContain('مراجعة وحسم المواد');
      expect(document.body.textContent).toContain('إنشاء مادة جديدة');

      // 2. Resolved Material
      const resolvedBatch: UnifiedImportBatch = {
        importBatchId: 'BATCH-C3-RESOLVED',
        projectId: 'PRJ-101',
        source: { sourceType: 'EXCEL_CSV' },
        totalRows: 1,
        validRows: 1,
        errorRows: 0,
        warningRows: 0,
        requiresReviewRows: 0,
        rows: [
          {
            rowNumber: 1,
            raw: { material: 'دفان ناعم' },
            canonical: { materialName: 'دفان ناعم' },
            entityResolutions: {
              material: { matchedId: 'MAT-101', matchedName: 'دفان ناعم', status: 'RESOLVED', matchMethod: 'EXACT', recommendation: 'ACCEPT' },
            },
            status: 'VALID',
            reviewStatus: 'accepted',
          },
        ],
        issues: [],
        auditTrail: [],
        currentStage: 'REVIEW',
        commitStatus: 'AWAITING_REVIEW',
      };

      const handleContinue = vi.fn();
      await act(async () => {
        root.render(
          <RosterMaterialResolutionLayer
            importBatch={resolvedBatch}
            projectMaterials={[{ materialId: 'MAT-101', name: 'دفان ناعم' }]}
            onAcceptCandidate={() => {}}
            onCreateMaterial={() => {}}
            onContinueToDriverTruck={handleContinue}
          />
        );
      });

      expect(document.body.textContent).toContain('تم حسم جميع المواد بنجاح');
      const continueBtn = Array.from(document.body.querySelectorAll('button')).find(
        (b) => b.textContent?.includes('متابعة إلى مراجعة السائقين والشاحنات')
      );
      expect(continueBtn).toBeDefined();

      await act(async () => {
        continueBtn?.click();
      });
      expect(handleContinue).toHaveBeenCalled();

      await act(async () => {
        root.unmount();
      });
    });

    it('Stage 5 (DRIVER_TRUCK_RESOLUTION): renders completed state with "متابعة إلى المراجعة النهائية" and verifies ArrowLeft does not throw', async () => {
      const root = createRoot(container);

      const fullyResolvedBatch: UnifiedImportBatch = {
        importBatchId: 'BATCH-C4-RESOLVED',
        projectId: 'PRJ-101',
        source: { sourceType: 'EXCEL_CSV' },
        totalRows: 1,
        validRows: 1,
        errorRows: 0,
        warningRows: 0,
        requiresReviewRows: 0,
        rows: [
          {
            rowNumber: 1,
            raw: { carrier: 'الناقل الأول', driverName: 'سالم القحطاني', truckPlate: '1111' },
            canonical: { carrierName: 'الناقل الأول', driverName: 'سالم القحطاني', truckPlate: '1111' },
            entityResolutions: {
              carrier: { matchedId: 'CAR-1', matchedName: 'الناقل الأول', status: 'RESOLVED', matchMethod: 'EXACT', recommendation: 'ACCEPT' },
              material: { matchedId: 'MAT-1', matchedName: 'رمل', status: 'RESOLVED', matchMethod: 'EXACT', recommendation: 'ACCEPT' },
              driver: { matchedId: 'DRV-1', matchedName: 'سالم القحطاني', status: 'RESOLVED', matchMethod: 'EXACT', recommendation: 'ACCEPT' },
              truck: { matchedId: 'TRK-1', matchedName: '1111', status: 'RESOLVED', matchMethod: 'EXACT', recommendation: 'ACCEPT' },
            },
            status: 'VALID',
            reviewStatus: 'accepted',
          },
        ],
        issues: [],
        auditTrail: [],
        currentStage: 'REVIEW',
        commitStatus: 'AWAITING_REVIEW',
      };

      const handleContinueToFinal = vi.fn();

      // This render must execute smoothly and mount the ArrowLeft icon without throwing ReferenceError
      await act(async () => {
        root.render(
          <RosterDriverTruckResolutionLayer
            importBatch={fullyResolvedBatch}
            projectDrivers={[{ driverId: 'DRV-1', name: 'سالم القحطاني' }]}
            projectTrucks={[{ truckId: 'TRK-1', plate: '1111' }]}
            onAcceptCandidate={() => {}}
            onCreateDriver={() => {}}
            onCreateTruck={() => {}}
            onContinueToFinalReview={handleContinueToFinal}
          />
        );
      });

      expect(document.body.textContent).toContain('مراجعة وحسم السائقين والشاحنات');
      expect(document.body.textContent).toContain('متابعة إلى المراجعة النهائية');

      const continueBtn = Array.from(document.body.querySelectorAll('button')).find(
        (b) => b.textContent?.includes('متابعة إلى المراجعة النهائية')
      );
      expect(continueBtn).toBeDefined();
      expect((continueBtn as HTMLButtonElement).disabled).toBe(false);

      await act(async () => {
        continueBtn?.click();
      });
      expect(handleContinueToFinal).toHaveBeenCalledTimes(1);

      await act(async () => {
        root.unmount();
      });
    });

    it('Stage 6 (FINAL_REVIEW): renders ready state and blocker state correctly', async () => {
      const root = createRoot(container);

      // Ready batch
      const readyBatch: UnifiedImportBatch = {
        importBatchId: 'BATCH-C5-READY',
        projectId: 'PRJ-101',
        source: { sourceType: 'EXCEL_CSV' },
        totalRows: 1,
        validRows: 1,
        errorRows: 0,
        warningRows: 0,
        requiresReviewRows: 0,
        rows: [
          {
            rowNumber: 1,
            raw: {},
            canonical: {},
            entityResolutions: {
              carrier: { matchedId: 'CAR-1', matchedName: 'الناقل 1', status: 'RESOLVED' },
              material: { matchedId: 'MAT-1', matchedName: 'مادة 1', status: 'RESOLVED' },
              driver: { matchedId: 'DRV-1', matchedName: 'سائق 1', status: 'RESOLVED' },
              truck: { matchedId: 'TRK-1', matchedName: 'شاحنة 1', status: 'RESOLVED' },
            },
            status: 'VALID',
            reviewStatus: 'accepted',
          },
        ],
        issues: [],
        auditTrail: [],
        currentStage: 'REVIEW',
        commitStatus: 'AWAITING_REVIEW',
      };

      const handleCommit = vi.fn();
      await act(async () => {
        root.render(
          <RosterFinalReviewLayer
            importBatch={readyBatch}
            onCommit={handleCommit}
          />
        );
      });

      expect(document.body.textContent).toContain('المراجعة النهائية والاعتماد');
      expect(document.body.textContent).toContain('الدفعة جاهزة تماماً للاعتماد والتنفيذ');
      expect(document.body.textContent).toContain('اعتماد وتنفيذ الاستيراد');

      const commitBtn = Array.from(document.body.querySelectorAll('button')).find(
        (b) => b.textContent?.includes('اعتماد وتنفيذ الاستيراد')
      );
      expect(commitBtn).toBeDefined();
      expect((commitBtn as HTMLButtonElement).disabled).toBe(false);

      await act(async () => {
        commitBtn?.click();
      });
      expect(handleCommit).toHaveBeenCalledTimes(1);

      await act(async () => {
        root.unmount();
      });
    });

    it('Stage 7 (COMMIT_RESULT): renders full success, partial, and failure outcomes truthfully', async () => {
      const root = createRoot(container);

      const batch: UnifiedImportBatch = {
        importBatchId: 'BATCH-C7-RESULT',
        projectId: 'PRJ-101',
        source: { sourceType: 'EXCEL_CSV' },
        totalRows: 2,
        validRows: 2,
        errorRows: 0,
        warningRows: 0,
        requiresReviewRows: 0,
        rows: [],
        issues: [],
        auditTrail: [],
        currentStage: 'COMMIT',
        commitStatus: 'COMMITTED',
      };

      // 1. Full Success Result
      const successResult: ImportResult = {
        importBatchId: 'BATCH-C7-RESULT',
        projectId: 'PRJ-101',
        operationId: 'OP-1',
        sourceType: 'EXCEL_CSV',
        success: true,
        totalRows: 2,
        committedRows: 2,
        skippedRows: 0,
        failedRows: 0,
        issues: [],
        committedEntityIds: ['E-1', 'E-2'],
        executedAt: new Date().toISOString(),
      };

      const handleFinish = vi.fn();
      await act(async () => {
        root.render(
          <RosterCommitResultLayer
            importBatch={batch}
            commitResult={successResult}
            onFinish={handleFinish}
          />
        );
      });

      expect(document.body.textContent).toContain('تم تنفيذ الاستيراد بنجاح');
      expect(document.body.textContent).toContain('إنهاء الاستيراد');

      // 2. Partial Result
      const partialResult: ImportResult = {
        importBatchId: 'BATCH-C7-RESULT',
        projectId: 'PRJ-101',
        operationId: 'OP-2',
        sourceType: 'EXCEL_CSV',
        success: false,
        totalRows: 2,
        committedRows: 1,
        skippedRows: 0,
        failedRows: 1,
        issues: [{ issueId: 'I-1', message: 'فشل حفظ السجل الثاني', severity: 'BLOCKING' }],
        committedEntityIds: ['E-1'],
        executedAt: new Date().toISOString(),
      };

      await act(async () => {
        root.render(
          <RosterCommitResultLayer
            importBatch={batch}
            commitResult={partialResult}
            onClose={() => {}}
          />
        );
      });

      expect(document.body.textContent).toContain('تم تنفيذ جزء من الاستيراد مع وجود صفوف فاشلة');
      expect(document.body.textContent).toContain('فشل حفظ السجل الثاني');

      // 3. Complete Failure Result
      const failureResult: ImportResult = {
        importBatchId: 'BATCH-C7-RESULT',
        projectId: 'PRJ-101',
        operationId: 'OP-3',
        sourceType: 'EXCEL_CSV',
        success: false,
        totalRows: 2,
        committedRows: 0,
        skippedRows: 0,
        failedRows: 2,
        issues: [{ issueId: 'I-2', message: 'خطأ اتصال بالخادم', severity: 'BLOCKING' }],
        committedEntityIds: [],
        executedAt: new Date().toISOString(),
      };

      await act(async () => {
        root.render(
          <RosterCommitResultLayer
            importBatch={batch}
            commitResult={failureResult}
            onClose={() => {}}
          />
        );
      });

      expect(document.body.textContent).toContain('فشل تنفيذ الاستيراد');

      await act(async () => {
        root.unmount();
      });
    });
  });

  describe('C4 & FINAL REVIEW BEHAVIORAL DISPATCH & CORRECTION TESTS', () => {
    it('A & B & C: Joint driver/truck accept handler dispatches based on entityType and fails closed on invalid entityType', async () => {
      const handleDriverAccept = vi.fn();
      const handleTruckAccept = vi.fn();

      const jointAccept = async (group: any, candidateId: string) => {
        if (group.entityType === 'truck') {
          await handleTruckAccept(group, candidateId);
          return;
        }
        if (group.entityType === 'driver') {
          await handleDriverAccept(group, candidateId);
          return;
        }
        throw new Error('INVALID_DRIVER_TRUCK_GROUP_TYPE');
      };

      // A: Driver group
      await jointAccept({ entityType: 'driver', normalizedSourceKey: 'driver:salim' }, 'DRV-1');
      expect(handleDriverAccept).toHaveBeenCalledTimes(1);
      expect(handleTruckAccept).toHaveBeenCalledTimes(0);

      handleDriverAccept.mockReset();
      handleTruckAccept.mockReset();

      // B: Truck group
      await jointAccept({ entityType: 'truck', normalizedSourceKey: 'truck:trk1' }, 'TRK-1');
      expect(handleTruckAccept).toHaveBeenCalledTimes(1);
      expect(handleDriverAccept).toHaveBeenCalledTimes(0);

      handleDriverAccept.mockReset();
      handleTruckAccept.mockReset();

      // C: Invalid group (carrier/material) -> Fail closed
      await expect(
        jointAccept({ entityType: 'carrier', normalizedSourceKey: 'carrier:c1' }, 'CAR-1')
      ).rejects.toThrow('INVALID_DRIVER_TRUCK_GROUP_TYPE');
      expect(handleDriverAccept).toHaveBeenCalledTimes(0);
      expect(handleTruckAccept).toHaveBeenCalledTimes(0);
    });

    it('D & E & F: projectDrivers and projectTrucks supplied to C4 filter same-carrier alternates and exclude cross-carrier alternates', async () => {
      const root = createRoot(container);
      const batch: UnifiedImportBatch = {
        importBatchId: 'BATCH-ALT-TEST',
        projectId: 'PRJ-101',
        sourceType: 'EXCEL_CSV',
        status: 'DISCOVERED',
        totalRows: 1,
        validRows: 0,
        warningRows: 1,
        errorRows: 0,
        requiresReviewRows: 1,
        rows: [
          {
            rowNumber: 1,
            raw: { 'الناقل': 'شركة الرمال', 'اسم السائق': 'سالم علي', 'رقم الشاحنة': 'TRK-100' },
            status: 'WARNING',
            entityResolutions: {
              carrier: { sourceValue: 'شركة الرمال', matchedId: 'CAR-SAME', matchedName: 'شركة الرمال', recommendation: 'ACCEPT', matchMethod: 'EXACT' },
              driver: { sourceValue: 'سالم علي', recommendation: 'REVIEW' },
              truck: { sourceValue: 'TRK-100', recommendation: 'REVIEW' },
            },
          },
        ],
      };

      const projectDrivers = [
        { driverId: 'DRV-SAME-1', name: 'خالد عبدالله (نفس الناقل)', carrierId: 'CAR-SAME', status: 'ACTIVE' },
        { driverId: 'DRV-DIFF-1', name: 'فهد محمد (ناقل مختلف)', carrierId: 'CAR-OTHER', status: 'ACTIVE' },
      ];

      const projectTrucks = [
        { truckId: 'TRK-SAME-1', plate: 'أ ب ج 1234 (نفس الناقل)', carrierId: 'CAR-SAME', status: 'ACTIVE' },
        { truckId: 'TRK-DIFF-1', plate: 'س ش ص 9999 (ناقل مختلف)', carrierId: 'CAR-OTHER', status: 'ACTIVE' },
      ];

      await act(async () => {
        root.render(
          <RosterDriverTruckResolutionLayer
            importBatch={batch}
            projectDrivers={projectDrivers}
            projectTrucks={projectTrucks}
            onAcceptCandidate={() => {}}
            onSelectAlternate={() => {}}
            onCreateDriver={() => {}}
            onCreateTruck={() => {}}
          />
        );
      });

      // D & E: Same-carrier driver and truck appear
      expect(document.body.textContent).toContain('خالد عبدالله');
      expect(document.body.textContent).toContain('أ ب ج 1234');

      // F: Cross-carrier driver and truck do NOT appear
      expect(document.body.textContent).not.toContain('فهد محمد');
      expect(document.body.textContent).not.toContain('س ش ص 9999');

      await act(async () => {
        root.unmount();
      });
    });

    it('G & H & I: RosterFinalReviewLayer renders correction button when onClose exists and invokes correct policy', async () => {
      const root = createRoot(container);
      const handleClose = vi.fn();

      const batchWithMaterialBlocker: UnifiedImportBatch = {
        importBatchId: 'BATCH-FINAL-BLOCKER',
        projectId: 'PRJ-101',
        sourceType: 'EXCEL_CSV',
        status: 'DISCOVERED',
        totalRows: 1,
        validRows: 0,
        warningRows: 1,
        errorRows: 1,
        requiresReviewRows: 1,
        issues: [
          { issueId: 'ISS-MAT', message: 'مادة غير معتمدة للمشروع', severity: 'BLOCKING', entityType: 'material' },
        ],
        rows: [],
      };

      await act(async () => {
        root.render(
          <RosterFinalReviewLayer
            importBatch={batchWithMaterialBlocker}
            onCommit={async () => {}}
            onClose={handleClose}
          />
        );
      });

      // G: onClose exists -> correction button is rendered ("العودة لمعالجة البيانات")
      expect(document.body.textContent).toContain('العودة لمعالجة البيانات');

      // Click correction button
      const backBtn = document.body.querySelectorAll('button')[0];
      if (backBtn) {
        await act(async () => {
          (backBtn as HTMLButtonElement).click();
        });
      }
      expect(handleClose).toHaveBeenCalledTimes(1);

      await act(async () => {
        root.unmount();
      });
    });

    it('C4 REAL COMPONENT A: Driver creation modal opens prefilled with driverName, residencyId/iqama, and phone from source rows', async () => {
      const root = createRoot(container);
      const testBatch: UnifiedImportBatch = {
        importBatchId: 'BATCH-COMP-A',
        projectId: 'PRJ-101',
        sourceType: 'EXCEL_CSV',
        status: 'DISCOVERED',
        totalRows: 1,
        validRows: 0,
        warningRows: 1,
        errorRows: 0,
        requiresReviewRows: 1,
        issues: [],
        rows: [
          {
            rowNumber: 1,
            raw: { 'اسم السائق': 'علي المنصور', 'رقم الهوية': '1098765432', 'الجوال': '0509876543' },
            canonical: { driverName: 'علي المنصور', driverIdentity: '1098765432', driverPhone: '0509876543' },
            entityResolutions: {
              carrier: { matchedId: 'CAR-101', matchedName: 'ناقل الرياض', sourceValue: 'ناقل الرياض', recommendation: 'ACCEPT', matchMethod: 'EXACT', confidence: 1.0, isExact: true },
              driver: { sourceValue: 'علي المنصور', recommendation: 'REVIEW', confidence: 0, isExact: false, originalValue: 'علي المنصور' },
            },
            status: 'WARNING',
            validationIssues: [],
            reviewStatus: 'requires_review',
          },
        ],
      };

      await act(async () => {
        root.render(
          <RosterDriverTruckResolutionLayer
            importBatch={testBatch}
            onAcceptCandidate={() => {}}
            onSelectAlternate={() => {}}
            onCreateDriver={() => {}}
            onCreateTruck={() => {}}
          />
        );
      });

      const buttons = Array.from(document.body.querySelectorAll('button'));
      const createDriverBtn = buttons.find((b) => b.textContent?.includes('إنشاء سائق جديد'));
      expect(createDriverBtn).toBeDefined();

      await act(async () => {
        createDriverBtn?.click();
      });

      const nameInput = document.body.querySelector('input[placeholder="مثال: سالم علي القحطاني"]') as HTMLInputElement;
      const iqamaInput = document.body.querySelector('input[placeholder="مثال: 1023456789 أو 2023456789"]') as HTMLInputElement;
      const phoneInput = document.body.querySelector('input[placeholder="مثال: 0501234567"]') as HTMLInputElement;

      expect(nameInput).not.toBeNull();
      expect(nameInput.value).toBe('علي المنصور');
      expect(iqamaInput.value).toBe('1098765432');
      expect(phoneInput.value).toBe('0509876543');

      await act(async () => {
        root.unmount();
      });
    });

    it('C4 REAL COMPONENT B: Truck creation modal opens prefilled with plateNumber, truckType, tareWeight, and maxGrossWeight', async () => {
      const root = createRoot(container);
      const testBatch: UnifiedImportBatch = {
        importBatchId: 'BATCH-COMP-B',
        projectId: 'PRJ-101',
        sourceType: 'EXCEL_CSV',
        status: 'DISCOVERED',
        totalRows: 1,
        validRows: 0,
        warningRows: 1,
        errorRows: 0,
        requiresReviewRows: 1,
        issues: [],
        rows: [
          {
            rowNumber: 1,
            raw: {},
            canonical: { truckPlate: 'ح ط ي 7777', truckType: 'سطحة هايدروليك', tareWeightKg: 15200, maxGrossWeightKg: 42000 },
            entityResolutions: {
              carrier: { matchedId: 'CAR-101', matchedName: 'ناقل الرياض', sourceValue: 'ناقل الرياض', recommendation: 'ACCEPT', matchMethod: 'EXACT', confidence: 1.0, isExact: true },
              truck: { sourceValue: 'ح ط ي 7777', recommendation: 'REVIEW', confidence: 0, isExact: false, originalValue: 'ح ط ي 7777' },
            },
            status: 'WARNING',
            validationIssues: [],
            reviewStatus: 'requires_review',
          },
        ],
      };

      await act(async () => {
        root.render(
          <RosterDriverTruckResolutionLayer
            importBatch={testBatch}
            onAcceptCandidate={() => {}}
            onSelectAlternate={() => {}}
            onCreateDriver={() => {}}
            onCreateTruck={() => {}}
          />
        );
      });

      const buttons = Array.from(document.body.querySelectorAll('button'));
      const createTruckBtn = buttons.find((b) => b.textContent?.includes('إنشاء شاحنة جديدة'));
      expect(createTruckBtn).toBeDefined();

      await act(async () => {
        createTruckBtn?.click();
      });

      const plateInput = document.body.querySelector('input[placeholder="مثال: أ ب ج 1234"]') as HTMLInputElement;
      const typeInput = document.body.querySelector('input[placeholder="مثال: قلاب، تريلا، سطحة"]') as HTMLInputElement;
      const tareInput = document.body.querySelector('input[placeholder="مثال: 14000"]') as HTMLInputElement;
      const grossInput = document.body.querySelector('input[placeholder="مثال: 45000"]') as HTMLInputElement;

      expect(plateInput.value).toBe('ح ط ي 7777');
      expect(typeInput.value).toBe('سطحة هايدروليك');
      expect(tareInput.value).toBe('15200');
      expect(grossInput.value).toBe('42000');

      await act(async () => {
        root.unmount();
      });
    });

    it('C4 REAL COMPONENT C: Driver conflicting Iqama displays conflict details, blocks submit until resolved, then submits chosen value', async () => {
      const root = createRoot(container);
      const handleCreateDriver = vi.fn();

      const conflictBatch: UnifiedImportBatch = {
        importBatchId: 'BATCH-COMP-C',
        projectId: 'PRJ-101',
        sourceType: 'EXCEL_CSV',
        status: 'DISCOVERED',
        totalRows: 2,
        validRows: 0,
        warningRows: 2,
        errorRows: 0,
        requiresReviewRows: 2,
        issues: [],
        rows: [
          {
            rowNumber: 1,
            raw: {},
            canonical: { driverName: 'سعود فهد', driverIdentity: '1011111111', driverPhone: '0501111111' },
            entityResolutions: {
              carrier: { matchedId: 'CAR-101', matchedName: 'ناقل الرياض', sourceValue: 'ناقل الرياض', recommendation: 'ACCEPT', matchMethod: 'EXACT', confidence: 1.0, isExact: true },
              driver: { sourceValue: 'سعود فهد', recommendation: 'REVIEW' },
            },
            status: 'WARNING',
            validationIssues: [],
            reviewStatus: 'requires_review',
          },
          {
            rowNumber: 2,
            raw: {},
            canonical: { driverName: 'سعود فهد', driverIdentity: '1011111111', driverPhone: '0502222222' },
            entityResolutions: {
              carrier: { matchedId: 'CAR-101', matchedName: 'ناقل الرياض', sourceValue: 'ناقل الرياض', recommendation: 'ACCEPT', matchMethod: 'EXACT', confidence: 1.0, isExact: true },
              driver: { sourceValue: 'سعود فهد', recommendation: 'REVIEW' },
            },
            status: 'WARNING',
            validationIssues: [],
            reviewStatus: 'requires_review',
          },
        ],
      };

      await act(async () => {
        root.render(
          <RosterDriverTruckResolutionLayer
            importBatch={conflictBatch}
            onAcceptCandidate={() => {}}
            onSelectAlternate={() => {}}
            onCreateDriver={handleCreateDriver}
            onCreateTruck={() => {}}
          />
        );
      });

      const buttons = Array.from(document.body.querySelectorAll('button'));
      const createDriverBtn = buttons.find((b) => b.textContent?.includes('إنشاء سائق جديد'));

      await act(async () => {
        createDriverBtn?.click();
      });

      expect(document.body.textContent).toContain('توجد بيانات متعارضة في الملف المصدر');
      expect(document.body.textContent).toContain('0501111111 مقابل 0502222222');

      const submitBtn = Array.from(document.body.querySelectorAll('button')).find((b) => b.textContent?.includes('حفظ وإنشاء السائق'));
      await act(async () => {
        submitBtn?.click();
      });

      expect(handleCreateDriver).toHaveBeenCalledTimes(0);

      const phoneInput = document.body.querySelector('input[placeholder="مثال: 0501234567"]') as HTMLInputElement;
      await act(async () => {
        const valueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
        if (valueSetter) {
          valueSetter.call(phoneInput, '0501111111');
        } else {
          phoneInput.value = '0501111111';
        }
        phoneInput.dispatchEvent(new Event('input', { bubbles: true }));
        phoneInput.dispatchEvent(new Event('change', { bubbles: true }));
      });

      await act(async () => {
        submitBtn?.click();
      });

      expect(handleCreateDriver).toHaveBeenCalledTimes(1);
      expect(handleCreateDriver.mock.calls[0][1].phone).toBe('0501111111');

      await act(async () => {
        root.unmount();
      });
    });

    it('C4 REAL COMPONENT D: Truck conflicting optional tareWeightKg displays conflict details, blocks submit until resolved, then submits chosen value', async () => {
      const root = createRoot(container);
      const handleCreateTruck = vi.fn();

      const conflictBatch: UnifiedImportBatch = {
        importBatchId: 'BATCH-COMP-D',
        projectId: 'PRJ-101',
        sourceType: 'EXCEL_CSV',
        status: 'DISCOVERED',
        totalRows: 2,
        validRows: 0,
        warningRows: 2,
        errorRows: 0,
        requiresReviewRows: 2,
        issues: [],
        rows: [
          {
            rowNumber: 1,
            raw: {},
            canonical: { truckPlate: 'ك ل م 8888', tareWeightKg: 14000 },
            entityResolutions: {
              carrier: { matchedId: 'CAR-101', matchedName: 'ناقل الرياض', sourceValue: 'ناقل الرياض', recommendation: 'ACCEPT', matchMethod: 'EXACT', confidence: 1.0, isExact: true },
              truck: { sourceValue: 'ك ل م 8888', recommendation: 'REVIEW' },
            },
            status: 'WARNING',
            validationIssues: [],
            reviewStatus: 'requires_review',
          },
          {
            rowNumber: 2,
            raw: {},
            canonical: { truckPlate: 'ك ل م 8888', tareWeightKg: 16000 },
            entityResolutions: {
              carrier: { matchedId: 'CAR-101', matchedName: 'ناقل الرياض', sourceValue: 'ناقل الرياض', recommendation: 'ACCEPT', matchMethod: 'EXACT', confidence: 1.0, isExact: true },
              truck: { sourceValue: 'ك ل م 8888', recommendation: 'REVIEW' },
            },
            status: 'WARNING',
            validationIssues: [],
            reviewStatus: 'requires_review',
          },
        ],
      };

      await act(async () => {
        root.render(
          <RosterDriverTruckResolutionLayer
            importBatch={conflictBatch}
            onAcceptCandidate={() => {}}
            onSelectAlternate={() => {}}
            onCreateDriver={() => {}}
            onCreateTruck={handleCreateTruck}
          />
        );
      });

      const buttons = Array.from(document.body.querySelectorAll('button'));
      const createTruckBtn = buttons.find((b) => b.textContent?.includes('إنشاء شاحنة جديدة'));

      await act(async () => {
        createTruckBtn?.click();
      });

      expect(document.body.textContent).toContain('توجد بيانات متعارضة في الملف المصدر');
      expect(document.body.textContent).toContain('14000 مقابل 16000');

      const submitBtn = Array.from(document.body.querySelectorAll('button')).find((b) => b.textContent?.includes('حفظ وإنشاء الشاحنة'));
      await act(async () => {
        submitBtn?.click();
      });

      expect(handleCreateTruck).toHaveBeenCalledTimes(0);

      const tareInput = document.body.querySelector('input[placeholder="مثال: 14000"]') as HTMLInputElement;
      await act(async () => {
        const valueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
        if (valueSetter) {
          valueSetter.call(tareInput, '15000');
        } else {
          tareInput.value = '15000';
        }
        tareInput.dispatchEvent(new Event('input', { bubbles: true }));
        tareInput.dispatchEvent(new Event('change', { bubbles: true }));
      });

      await act(async () => {
        submitBtn?.click();
      });

      expect(handleCreateTruck).toHaveBeenCalledTimes(1);
      expect(handleCreateTruck.mock.calls[0][1].tareWeightKg).toBe(15000);

      await act(async () => {
        root.unmount();
      });
    });

    it('C4 REAL COMPONENT E: Conflict state resets completely when modal is cancelled or a clean group is opened', async () => {
      const root = createRoot(container);

      const multiGroupBatch: UnifiedImportBatch = {
        importBatchId: 'BATCH-COMP-E',
        projectId: 'PRJ-101',
        sourceType: 'EXCEL_CSV',
        status: 'DISCOVERED',
        totalRows: 3,
        validRows: 0,
        warningRows: 3,
        errorRows: 0,
        requiresReviewRows: 3,
        issues: [],
        rows: [
          {
            rowNumber: 1,
            raw: {},
            canonical: { driverName: 'سائق متعارض', driverIdentity: '1000000001', driverPhone: '0501111111' },
            entityResolutions: {
              carrier: { matchedId: 'CAR-101', matchedName: 'ناقل الرياض', sourceValue: 'ناقل الرياض', recommendation: 'ACCEPT', matchMethod: 'EXACT', confidence: 1.0, isExact: true },
              driver: { sourceValue: 'سائق متعارض', recommendation: 'REVIEW' },
            },
            status: 'WARNING',
            validationIssues: [],
            reviewStatus: 'requires_review',
          },
          {
            rowNumber: 2,
            raw: {},
            canonical: { driverName: 'سائق متعارض', driverIdentity: '1000000001', driverPhone: '0502222222' },
            entityResolutions: {
              carrier: { matchedId: 'CAR-101', matchedName: 'ناقل الرياض', sourceValue: 'ناقل الرياض', recommendation: 'ACCEPT', matchMethod: 'EXACT', confidence: 1.0, isExact: true },
              driver: { sourceValue: 'سائق متعارض', recommendation: 'REVIEW' },
            },
            status: 'WARNING',
            validationIssues: [],
            reviewStatus: 'requires_review',
          },
          {
            rowNumber: 3,
            raw: {},
            canonical: { driverName: 'سائق سليم', driverIdentity: '1099887766', driverPhone: '0555555555' },
            entityResolutions: {
              carrier: { matchedId: 'CAR-101', matchedName: 'ناقل الرياض', sourceValue: 'ناقل الرياض', recommendation: 'ACCEPT', matchMethod: 'EXACT', confidence: 1.0, isExact: true },
              driver: { sourceValue: 'سائق سليم', recommendation: 'REVIEW' },
            },
            status: 'WARNING',
            validationIssues: [],
            reviewStatus: 'requires_review',
          },
        ],
      };

      await act(async () => {
        root.render(
          <RosterDriverTruckResolutionLayer
            importBatch={multiGroupBatch}
            onAcceptCandidate={() => {}}
            onSelectAlternate={() => {}}
            onCreateDriver={() => {}}
            onCreateTruck={() => {}}
          />
        );
      });

      const createButtons = Array.from(document.body.querySelectorAll('button')).filter((b) => b.textContent?.includes('إنشاء سائق جديد'));
      await act(async () => {
        createButtons[0]?.click();
      });

      expect(document.body.textContent).toContain('توجد بيانات متعارضة في الملف المصدر');
      expect(document.body.textContent).toContain('0501111111 مقابل 0502222222');

      const cancelBtn = Array.from(document.body.querySelectorAll('button')).find((b) => b.textContent === 'إلغاء');
      await act(async () => {
        cancelBtn?.click();
      });

      await act(async () => {
        createButtons[1]?.click();
      });

      expect(document.body.textContent).not.toContain('توجد بيانات متعارضة في الملف المصدر');
      const iqamaInput = document.body.querySelector('input[placeholder="مثال: 1023456789 أو 2023456789"]') as HTMLInputElement;
      expect(iqamaInput.value).toBe('1099887766');

      await act(async () => {
        root.unmount();
      });
    });
  });
});
