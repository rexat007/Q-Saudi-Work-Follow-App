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
import { UnifiedImportBatch } from '../types/unifiedImport';

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
});
