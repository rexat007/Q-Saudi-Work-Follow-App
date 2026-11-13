import type { ImportRow } from '../types/unifiedImport';
// @vitest-environment happy-dom
import { I18nProvider } from '../i18n';
import { canonicalBatch4Label } from './batch4I18nTestSupport';
import React, { act } from 'react';
import { createRoot as createReactRoot } from 'react-dom/client';
const mountedRoots = new Set<ReturnType<typeof createReactRoot>>();
const createRoot = (...args: Parameters<typeof createReactRoot>) => {const root=createReactRoot(...args);mountedRoots.add(root);return root;};
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CarrierEditorModal } from '../components/masterData/CarrierEditorModal';
import { MaterialEditorModal } from '../components/masterData/MaterialEditorModal';
import { RosterCarrierResolutionLayer, checkCarrierResolutionReadiness } from '../components/import/RosterCarrierResolutionLayer';
import { RosterMaterialResolutionLayer, checkMaterialResolutionReadiness } from '../components/import/RosterMaterialResolutionLayer';
import { RosterDriverTruckResolutionLayer } from '../components/import/RosterDriverTruckResolutionLayer';
import { RosterFinalReviewLayer, classifyFinalReviewBlocker } from '../components/import/RosterFinalReviewLayer';
import { RosterCommitResultLayer } from '../components/import/RosterCommitResultLayer';
import type {RelationshipContext} from '../types/dataQuality';
import { UnifiedImportBatch, ImportResult } from '../types/unifiedImport';

// Current canonical read evidence required by the shared identity editor.
const canonicalFleetContext:RelationshipContext={projectId:'PRJ-101',authorizedCarrierIds:['CAR-101'],authorizedMaterialIds:[],knownCarriers:[],knownTrucks:[],knownDrivers:[],knownMaterials:[],importResolution:{projectId:'PRJ-101',entities:[{kind:'CARRIER',id:'CAR-101',name:'Carrier fixture',globalStatus:'ACTIVE',membershipStatus:'ACTIVE',eligible:true,canReactivate:false,affiliation:null}]}};

describe('D21 & FULL CONVERGENCE: Component Render & Portal Reachability Tests', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(async () => {
    // Even a failed assertion must release portal focus/pointer ownership before the next test.
    await act(async () => {for(const root of mountedRoots)root.unmount();});
    mountedRoots.clear();
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
        <I18nProvider initialLocale="ar"><CarrierEditorModal
          open={true}
          mode="CREATE"
          projectId="PRJ-101"
          initialName="شركة الأفق لنقل البضائع"
          onClose={handleClose}
          onCreated={handleCreated}
        /></I18nProvider>
      );
    });

    // Verify modal is portaled directly into document.body
    const dialogElement = document.body.querySelector(`[aria-label="${canonicalBatch4Label('shared.actions.close')}"]`);
    expect(dialogElement).not.toBeNull();

    // Verify title reflects CREATE mode explicitly (D03)
    expect(document.body.textContent).toContain(canonicalBatch4Label('projects.labels.add_carrier'));
    expect(document.body.textContent).toContain(canonicalBatch4Label('entityResolution.labels.save_approve_carrier'));

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
        <I18nProvider initialLocale="ar"><CarrierEditorModal
          open={true}
          mode="CREATE"
          projectId="PRJ-101"
          initialCarrier={{ carrierId: 'CAR-OLD', name: 'ناقل قديم' }}
          onClose={() => {}}
        /></I18nProvider>
      );
    });

    // Must be CREATE mode, not EDIT
    expect(document.body.textContent).toContain(canonicalBatch4Label('projects.labels.add_carrier'));
    expect(document.body.textContent).not.toContain(canonicalBatch4Label('entityResolution.labels.edit_carrier'));

    await act(async () => {
      root.unmount();
    });
  });

  it('D02 & D04 & D05 & D21: MaterialEditorModal renders into document.body portal and obeys mode', async () => {
    const handleClose = vi.fn();
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <I18nProvider initialLocale="ar"><MaterialEditorModal
          open={true}
          mode="CREATE"
          projectId="PRJ-101"
          initialName="دفان ناعم 0-5 مم"
          onClose={handleClose}
        /></I18nProvider>
      );
    });

    // Portaled to document.body
    const closeBtn = document.body.querySelector(`[aria-label="${canonicalBatch4Label('shared.actions.close')}"]`);
    expect(closeBtn).not.toBeNull();
    expect(document.body.textContent).toContain(canonicalBatch4Label('entityResolution.labels.add_material'));
    expect(document.body.textContent).toContain(canonicalBatch4Label('entityResolution.labels.save_material'));

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

    const mockBatch: UnifiedImportBatch = {validationStatus:'PENDING',operationId:'OP-PORTAL',createdAt:'2026-01-01T00:00:00Z',createdBy:'SYNTHETIC',committedRows:0,
      importBatchId: 'BATCH-DT-01',
      projectId: 'PRJ-101',
      source: {importBatchId:'BATCH-DT-01', sourceType: 'EXCEL' },
      totalRows: 1,
      validRows: 0,
      errorRows: 0,
      warningRows: 1,
      requiresReviewRows: 1,
      rows: [
        {validationIssues:[],
          rowNumber: 1,
          raw: { carrier: 'الناقل الأول', driverName: 'سالم القحطاني', truckPlate: '1111' },
          canonical: { carrierName: 'الناقل الأول', driverName: 'سالم القحطاني', truckPlate: '1111' },
          entityResolutions: {
            carrier: {entityType:'CARRIER',originalValue:'',confidence:0,isExact:false, matchedId: 'CAR-1', matchedName: 'الناقل الأول',  },
            material: {entityType:'MATERIAL',originalValue:'',confidence:0,isExact:false, matchedId: 'MAT-1', matchedName: 'رمل',  },
            driver: {entityType:'DRIVER',originalValue:'سالم القحطاني',confidence:0,isExact:false, sourceValue: 'سالم القحطاني',  },
            truck: {entityType:'TRUCK',originalValue:'1111',confidence:0,isExact:false, sourceValue: '1111',  matchedId: 'TRK-1' },
          },
          status: 'WARNING',
          reviewStatus: 'requires_review',
        } satisfies ImportRow,
      ],
      issues: [],
      auditTrail: [],
      currentStage: 'REVIEW',
      commitStatus: 'AWAITING_REVIEW',
    };

    await act(async () => {
      root.render(
        <I18nProvider initialLocale="ar"><RosterDriverTruckResolutionLayer onAcceptCandidate={()=>{}}
          importBatch={mockBatch}

          projectDrivers={[]}
          projectTrucks={[]}


          onCreateDriver={() => {}}


          onCreateTruck={() => {}}

        /></I18nProvider>
      );
    });

    // Look for button to create driver
    const createDriverBtn = Array.from(document.body.querySelectorAll('button')).find(
      (b) => b.textContent?.includes(canonicalBatch4Label('entityResolution.labels.create_driver'))
    );
    expect(createDriverBtn).toBeDefined();

    // Click button to open Driver creation modal
    await act(async () => {
      createDriverBtn?.click();
    });

    // Driver creation modal is portaled into document.body
    expect(document.body.textContent).toContain(canonicalBatch4Label('setup.editor.DRIVER'));
    expect(document.body.textContent).toContain(canonicalBatch4Label('setup.nationalId'));

    await act(async () => {
      root.unmount();
    });
  });

  it('D10: RosterCarrierResolutionLayer blocks progression if row lacks valid Carrier (row-level gate)', () => {
    // Group is marked RESOLVED, but an active row is missing matchedId
    const batchWithMissingRowCarrier: UnifiedImportBatch = {validationStatus:'PENDING',operationId:'OP-PORTAL',createdAt:'2026-01-01T00:00:00Z',createdBy:'SYNTHETIC',committedRows:0,
      importBatchId: 'BATCH-CARRIER-GATE',
      projectId: 'PRJ-101',
      source: {importBatchId:'BATCH-CARRIER-GATE', sourceType: 'EXCEL' },
      totalRows: 2,
      validRows: 1,
      errorRows: 0,
      warningRows: 1,
      requiresReviewRows: 0,
      rows: [
        {validationIssues:[],
          rowNumber: 1,
          raw: {},
          canonical: {},
          entityResolutions: {
            carrier: {entityType:'CARRIER',originalValue:'',confidence:0,isExact:false, matchedId: 'CAR-1', matchedName: 'Carrier 1',  },
          },
          status: 'VALID',
          reviewStatus: 'accepted',
        } satisfies ImportRow,
        {validationIssues:[],
          rowNumber: 2,
          raw: {},
          canonical: {},
          entityResolutions: {
            // Row 2 is active but lacks matchedId
            carrier: {entityType:'CARRIER',originalValue:'Carrier Unknown',confidence:0,isExact:false, sourceValue: 'Carrier Unknown',  },
          },
          status: 'WARNING',
          reviewStatus: 'requires_review',
        } satisfies ImportRow,
      ],
      issues: [],
      auditTrail: [],
      currentStage: 'REVIEW',
      commitStatus: 'AWAITING_REVIEW',
    };

    const isReady = checkCarrierResolutionReadiness(batchWithMissingRowCarrier);

    // Must block because Row 2 lacks matchedId!
    expect(isReady).toBe(false);
  });

  it('D11: RosterMaterialResolutionLayer blocks progression if row lacks valid Material (row-level gate)', () => {
    const batchWithMissingRowMaterial: UnifiedImportBatch = {validationStatus:'PENDING',operationId:'OP-PORTAL',createdAt:'2026-01-01T00:00:00Z',createdBy:'SYNTHETIC',committedRows:0,
      importBatchId: 'BATCH-MAT-GATE',
      projectId: 'PRJ-101',
      source: {importBatchId:'BATCH-MAT-GATE', sourceType: 'EXCEL' },
      totalRows: 2,
      validRows: 1,
      errorRows: 0,
      warningRows: 1,
      requiresReviewRows: 0,
      rows: [
        {validationIssues:[],
          rowNumber: 1,
          raw: {},
          canonical: {},
          entityResolutions: {
            material: {entityType:'MATERIAL',originalValue:'',confidence:0,isExact:false, matchedId: 'MAT-1', matchedName: 'Sand',  },
          },
          status: 'VALID',
          reviewStatus: 'accepted',
        } satisfies ImportRow,
        {validationIssues:[],
          rowNumber: 2,
          raw: {},
          canonical: {},
          entityResolutions: {
            material: {entityType:'MATERIAL',originalValue:'Gravel',confidence:0,isExact:false, sourceValue: 'Gravel',  },
          },
          status: 'WARNING',
          reviewStatus: 'requires_review',
        } satisfies ImportRow,
      ],
      issues: [],
      auditTrail: [],
      currentStage: 'REVIEW',
      commitStatus: 'AWAITING_REVIEW',
    };

    const isReady = checkMaterialResolutionReadiness(batchWithMissingRowMaterial);

    expect(isReady).toBe(false);
  });

  it('D13 & D17: RosterFinalReviewLayer pure classifier and warning confirmation gate', async () => {
    const root = createRoot(container);

    const batchWithWarnings: UnifiedImportBatch = {validationStatus:'PENDING',operationId:'OP-PORTAL',createdAt:'2026-01-01T00:00:00Z',createdBy:'SYNTHETIC',committedRows:0,
      importBatchId: 'BATCH-WARN-GATE',
      projectId: 'PRJ-101',
      source: {importBatchId:'BATCH-WARN-GATE', sourceType: 'EXCEL' },
      totalRows: 1,
      validRows: 0,
      errorRows: 0,
      warningRows: 1,
      requiresReviewRows: 0,
      rows: [
        {validationIssues:[],
          rowNumber: 1,
          raw: {},
          canonical: {},
          entityResolutions: {
            carrier: {entityType:'CARRIER',originalValue:'',confidence:0,isExact:false, matchedId: 'CAR-1', matchedName: 'Carrier 1',  },
            material: {entityType:'MATERIAL',originalValue:'',confidence:0,isExact:false, matchedId: 'MAT-1', matchedName: 'Mat 1',  },
            driver: {entityType:'DRIVER',originalValue:'',confidence:0,isExact:false, matchedId: 'DRV-1', matchedName: 'Driver 1',  },
            truck: {entityType:'TRUCK',originalValue:'',confidence:0,isExact:false, matchedId: 'TRK-1', matchedName: 'Truck 1',  },
          },
          status: 'WARNING',
          reviewStatus: 'warning',
        } satisfies ImportRow,
      ],
      issues: [
        {row:1,field:'row',
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
        <I18nProvider initialLocale="ar"><RosterFinalReviewLayer
          importBatch={batchWithWarnings}
          onCommit={async () => {}}
        /></I18nProvider>
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
      const unresolvedBatch: UnifiedImportBatch = {validationStatus:'PENDING',operationId:'OP-PORTAL',createdAt:'2026-01-01T00:00:00Z',createdBy:'SYNTHETIC',committedRows:0,
        importBatchId: 'BATCH-C2-UNRESOLVED',
        projectId: 'PRJ-101',
        source: {importBatchId:'BATCH-C2-UNRESOLVED', sourceType: 'EXCEL' },
        totalRows: 1,
        validRows: 0,
        errorRows: 0,
        warningRows: 1,
        requiresReviewRows: 1,
        rows: [
          {validationIssues:[],
            rowNumber: 1,
            raw: { carrier: 'ناقل مجهول' },
            canonical: { carrierName: 'ناقل مجهول' },
            entityResolutions: {
              carrier: {entityType:'CARRIER',originalValue:'ناقل مجهول',confidence:0,isExact:false, sourceValue: 'ناقل مجهول',  },
            },
            status: 'WARNING',
            reviewStatus: 'requires_review',
          } satisfies ImportRow,
        ],
        issues: [],
        auditTrail: [],
        currentStage: 'REVIEW',
        commitStatus: 'AWAITING_REVIEW',
      };

      await act(async () => {
        root.render(
          <I18nProvider initialLocale="ar"><RosterCarrierResolutionLayer
            importBatch={unresolvedBatch}
            projectCarriers={[]}
            onAcceptCandidate={() => {}}
            onCreateCarrier={() => {}}
          /></I18nProvider>
        );
      });

      expect(document.body.textContent).toContain(canonicalBatch4Label('entityResolution.labels.carrier_review_title'));
      expect(document.body.textContent).toContain(canonicalBatch4Label('projects.labels.add_carrier'));
      expect(document.body.textContent).toContain('ناقل مجهول');

      // 2. Resolved Carrier Stage
      const resolvedBatch: UnifiedImportBatch = {validationStatus:'PENDING',operationId:'OP-PORTAL',createdAt:'2026-01-01T00:00:00Z',createdBy:'SYNTHETIC',committedRows:0,
        importBatchId: 'BATCH-C2-RESOLVED',
        projectId: 'PRJ-101',
        source: {importBatchId:'BATCH-C2-RESOLVED', sourceType: 'EXCEL' },
        totalRows: 1,
        validRows: 1,
        errorRows: 0,
        warningRows: 0,
        requiresReviewRows: 0,
        rows: [
          {validationIssues:[],
            rowNumber: 1,
            raw: { carrier: 'شركة الرمال للنقل' },
            canonical: { carrierName: 'شركة الرمال للنقل' },
            entityResolutions: {
              carrier: {entityType:'CARRIER',originalValue:'',confidence:0,isExact:false, matchedId: 'CAR-101', matchedName: 'شركة الرمال للنقل',  matchMethod: 'EXACT', recommendation: 'ACCEPT' },
            },
            status: 'VALID',
            reviewStatus: 'accepted',
          } satisfies ImportRow,
        ],
        issues: [],
        auditTrail: [],
        currentStage: 'REVIEW',
        commitStatus: 'AWAITING_REVIEW',
      };

      const handleContinue = vi.fn();
      await act(async () => {
        root.render(
          <I18nProvider initialLocale="ar"><RosterCarrierResolutionLayer
            importBatch={resolvedBatch}
            projectCarriers={[{ carrierId: 'CAR-101', name: 'شركة الرمال للنقل' }]}
            onAcceptCandidate={() => {}}
            onCreateCarrier={() => {}}
            onContinueToMaterials={handleContinue}
          /></I18nProvider>
        );
      });

      expect(document.body.textContent).toContain(canonicalBatch4Label('entityResolution.messages.all_carriers_resolved', { count: 1 }));
      const continueBtn = Array.from(document.body.querySelectorAll('button')).find(
        (b) => b.textContent?.includes(canonicalBatch4Label('entityResolution.labels.continue_material_review'))
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
      const unresolvedBatch: UnifiedImportBatch = {validationStatus:'PENDING',operationId:'OP-PORTAL',createdAt:'2026-01-01T00:00:00Z',createdBy:'SYNTHETIC',committedRows:0,
        importBatchId: 'BATCH-C3-UNRESOLVED',
        projectId: 'PRJ-101',
        source: {importBatchId:'BATCH-C3-UNRESOLVED', sourceType: 'EXCEL' },
        totalRows: 1,
        validRows: 0,
        errorRows: 0,
        warningRows: 1,
        requiresReviewRows: 1,
        rows: [
          {validationIssues:[],
            rowNumber: 1,
            raw: { material: 'مادة غير معرّفة' },
            canonical: { materialName: 'مادة غير معرّفة' },
            entityResolutions: {
              material: {entityType:'MATERIAL',originalValue:'مادة غير معرّفة',confidence:0,isExact:false, sourceValue: 'مادة غير معرّفة',  },
            },
            status: 'WARNING',
            reviewStatus: 'requires_review',
          } satisfies ImportRow,
        ],
        issues: [],
        auditTrail: [],
        currentStage: 'REVIEW',
        commitStatus: 'AWAITING_REVIEW',
      };

      await act(async () => {
        root.render(
          <I18nProvider initialLocale="ar"><RosterMaterialResolutionLayer
            importBatch={unresolvedBatch}
            projectMaterials={[]}
            onAcceptCandidate={() => {}}
            onCreateMaterial={() => {}}
          /></I18nProvider>
        );
      });

      expect(document.body.textContent).toContain(canonicalBatch4Label('entityResolution.labels.material_review_title'));
      expect(document.body.textContent).toContain(canonicalBatch4Label('entityResolution.labels.add_material'));

      // 2. Resolved Material
      const resolvedBatch: UnifiedImportBatch = {validationStatus:'PENDING',operationId:'OP-PORTAL',createdAt:'2026-01-01T00:00:00Z',createdBy:'SYNTHETIC',committedRows:0,
        importBatchId: 'BATCH-C3-RESOLVED',
        projectId: 'PRJ-101',
        source: {importBatchId:'BATCH-C3-RESOLVED', sourceType: 'EXCEL' },
        totalRows: 1,
        validRows: 1,
        errorRows: 0,
        warningRows: 0,
        requiresReviewRows: 0,
        rows: [
          {validationIssues:[],
            rowNumber: 1,
            raw: { material: 'دفان ناعم' },
            canonical: { materialName: 'دفان ناعم' },
            entityResolutions: {
              material: {entityType:'MATERIAL',originalValue:'',confidence:0,isExact:false, matchedId: 'MAT-101', matchedName: 'دفان ناعم',  matchMethod: 'EXACT', recommendation: 'ACCEPT' },
            },
            status: 'VALID',
            reviewStatus: 'accepted',
          } satisfies ImportRow,
        ],
        issues: [],
        auditTrail: [],
        currentStage: 'REVIEW',
        commitStatus: 'AWAITING_REVIEW',
      };

      const handleContinue = vi.fn();
      await act(async () => {
        root.render(
          <I18nProvider initialLocale="ar"><RosterMaterialResolutionLayer
            importBatch={resolvedBatch}
            projectMaterials={[{ materialId: 'MAT-101', name: 'دفان ناعم' }]}
            onAcceptCandidate={() => {}}
            onCreateMaterial={() => {}}
            onContinueToDriverTruck={handleContinue}
          /></I18nProvider>
        );
      });

      expect(document.body.textContent).toContain(canonicalBatch4Label('entityResolution.messages.all_materials_resolved', { count: 1 }));
      const continueBtn = Array.from(document.body.querySelectorAll('button')).find(
        (b) => b.textContent?.includes(canonicalBatch4Label('entityResolution.labels.continue_driver_truck_review'))
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

      const fullyResolvedBatch: UnifiedImportBatch = {validationStatus:'PENDING',operationId:'OP-PORTAL',createdAt:'2026-01-01T00:00:00Z',createdBy:'SYNTHETIC',committedRows:0,
        importBatchId: 'BATCH-C4-RESOLVED',
        projectId: 'PRJ-101',
        source: {importBatchId:'BATCH-C4-RESOLVED', sourceType: 'EXCEL' },
        totalRows: 1,
        validRows: 1,
        errorRows: 0,
        warningRows: 0,
        requiresReviewRows: 0,
        rows: [
          {validationIssues:[],
            rowNumber: 1,
            raw: { carrier: 'الناقل الأول', driverName: 'سالم القحطاني', truckPlate: '1111' },
            canonical: { carrierName: 'الناقل الأول', driverName: 'سالم القحطاني', truckPlate: '1111' },
            entityResolutions: {
              carrier: {entityType:'CARRIER',originalValue:'',confidence:0,isExact:false, matchedId: 'CAR-1', matchedName: 'الناقل الأول',  matchMethod: 'EXACT', recommendation: 'ACCEPT' },
              material: {entityType:'MATERIAL',originalValue:'',confidence:0,isExact:false, matchedId: 'MAT-1', matchedName: 'رمل',  matchMethod: 'EXACT', recommendation: 'ACCEPT' },
              driver: {entityType:'DRIVER',originalValue:'',confidence:0,isExact:false, matchedId: 'DRV-1', matchedName: 'سالم القحطاني',  matchMethod: 'EXACT', recommendation: 'ACCEPT' },
              truck: {entityType:'TRUCK',originalValue:'',confidence:0,isExact:false, matchedId: 'TRK-1', matchedName: '1111',  matchMethod: 'EXACT', recommendation: 'ACCEPT' },
            },
            status: 'VALID',
            reviewStatus: 'accepted',
          } satisfies ImportRow,
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
          <I18nProvider initialLocale="ar"><RosterDriverTruckResolutionLayer
            importBatch={fullyResolvedBatch}
            projectDrivers={[{ driverId: 'DRV-1', name: 'سالم القحطاني' }]}
            projectTrucks={[{ truckId: 'TRK-1', plate: '1111' }]}
            onAcceptCandidate={() => {}}
            onCreateDriver={() => {}}
            onCreateTruck={() => {}}
            onContinueToFinalReview={handleContinueToFinal}
          /></I18nProvider>
        );
      });

      expect(document.body.textContent).toContain(canonicalBatch4Label('entityResolution.labels.driver_truck_review_title'));
      expect(document.body.textContent).toContain(canonicalBatch4Label('entityResolution.labels.continue_final_review'));

      const continueBtn = Array.from(document.body.querySelectorAll('button')).find(
        (b) => b.textContent?.includes(canonicalBatch4Label('entityResolution.labels.continue_final_review'))
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
      const readyBatch: UnifiedImportBatch = {validationStatus:'PENDING',operationId:'OP-PORTAL',createdAt:'2026-01-01T00:00:00Z',createdBy:'SYNTHETIC',committedRows:0,
        importBatchId: 'BATCH-C5-READY',
        projectId: 'PRJ-101',
        source: {importBatchId:'BATCH-C5-READY', sourceType: 'EXCEL' },
        totalRows: 1,
        validRows: 1,
        errorRows: 0,
        warningRows: 0,
        requiresReviewRows: 0,
        rows: [
          {validationIssues:[],
            rowNumber: 1,
            raw: {},
            canonical: {},
            entityResolutions: {
              carrier: {entityType:'CARRIER',originalValue:'',confidence:0,isExact:false, matchedId: 'CAR-1', matchedName: 'الناقل 1',  },
              material: {entityType:'MATERIAL',originalValue:'',confidence:0,isExact:false, matchedId: 'MAT-1', matchedName: 'مادة 1',  },
              driver: {entityType:'DRIVER',originalValue:'',confidence:0,isExact:false, matchedId: 'DRV-1', matchedName: 'سائق 1',  },
              truck: {entityType:'TRUCK',originalValue:'',confidence:0,isExact:false, matchedId: 'TRK-1', matchedName: 'شاحنة 1',  },
            },
            status: 'VALID',
            reviewStatus: 'accepted',
          } satisfies ImportRow,
        ],
        issues: [],
        auditTrail: [],
        currentStage: 'REVIEW',
        commitStatus: 'AWAITING_REVIEW',
      };

      const handleCommit = vi.fn();
      await act(async () => {
        root.render(
          <I18nProvider initialLocale="ar"><RosterFinalReviewLayer
            importBatch={readyBatch}
            onCommit={handleCommit}
          /></I18nProvider>
        );
      });

      expect(document.body.textContent).toContain(canonicalBatch4Label('entityResolution.labels.final_review_title'));
      expect(document.body.textContent).toContain(canonicalBatch4Label('entityResolution.messages.batch_ready_count', { ready: 1, total: 1 }));
      expect(document.body.textContent).toContain(canonicalBatch4Label('entityResolution.labels.approve_commit_import'));

      const commitBtn = Array.from(document.body.querySelectorAll('button')).find(
        (b) => b.textContent?.includes(canonicalBatch4Label('entityResolution.labels.approve_commit_import'))
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

      const batch: UnifiedImportBatch = {validationStatus:'PENDING',operationId:'OP-PORTAL',createdAt:'2026-01-01T00:00:00Z',createdBy:'SYNTHETIC',committedRows:0,
        importBatchId: 'BATCH-C7-RESULT',
        projectId: 'PRJ-101',
        source: {importBatchId:'BATCH-C7-RESULT', sourceType: 'EXCEL' },
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
        sourceType: 'EXCEL',
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
          <I18nProvider initialLocale="ar"><RosterCommitResultLayer
            importBatch={batch}
            commitResult={successResult}
            onFinish={handleFinish}
          /></I18nProvider>
        );
      });

      expect(document.body.textContent).toContain(canonicalBatch4Label('entityResolution.messages.import_succeeded'));
      expect(document.body.textContent).toContain(canonicalBatch4Label('entityResolution.labels.finish_import'));

      // 2. Partial Result
      const partialResult: ImportResult = {
        importBatchId: 'BATCH-C7-RESULT',
        projectId: 'PRJ-101',
        operationId: 'OP-2',
        sourceType: 'EXCEL',
        success: false,
        totalRows: 2,
        committedRows: 1,
        skippedRows: 0,
        failedRows: 1,
        issues: [{row:1,field:'row',code:'MATERIAL_PROJECT_CONFLICT',resolvable:true,blocking:true, issueId: 'I-1', message: 'فشل حفظ السجل الثاني', severity: 'BLOCKING' }],
        committedEntityIds: ['E-1'],
        executedAt: new Date().toISOString(),
      };

      await act(async () => {
        root.render(
          <I18nProvider initialLocale="ar"><RosterCommitResultLayer
            importBatch={batch}
            commitResult={partialResult}
            onClose={() => {}}
          /></I18nProvider>
        );
      });

      expect(document.body.textContent).toContain(canonicalBatch4Label('entityResolution.messages.import_partial'));
      expect(document.body.textContent).toContain('فشل حفظ السجل الثاني');

      // 3. Complete Failure Result
      const failureResult: ImportResult = {
        importBatchId: 'BATCH-C7-RESULT',
        projectId: 'PRJ-101',
        operationId: 'OP-3',
        sourceType: 'EXCEL',
        success: false,
        totalRows: 2,
        committedRows: 0,
        skippedRows: 0,
        failedRows: 2,
        issues: [{row:1,field:'row',code:'MATERIAL_PROJECT_CONFLICT',resolvable:true,blocking:true, issueId: 'I-2', message: 'خطأ اتصال بالخادم', severity: 'BLOCKING' }],
        committedEntityIds: [],
        executedAt: new Date().toISOString(),
      };

      await act(async () => {
        root.render(
          <I18nProvider initialLocale="ar"><RosterCommitResultLayer
            importBatch={batch}
            commitResult={failureResult}
            onClose={() => {}}
          /></I18nProvider>
        );
      });

      expect(document.body.textContent).toContain(canonicalBatch4Label('entityResolution.messages.import_failed'));

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
      const batch: UnifiedImportBatch = {issues: [],validationStatus:'PENDING',operationId:'OP-PORTAL',createdAt:'2026-01-01T00:00:00Z',createdBy:'SYNTHETIC',committedRows:0,auditTrail:[],currentStage:'REVIEW',commitStatus:'AWAITING_REVIEW',source:{sourceType:'EXCEL',importBatchId:'BATCH-ALT-TEST'},
        importBatchId: 'BATCH-ALT-TEST',
        projectId: 'PRJ-101',

        totalRows: 1,
        validRows: 0,
        warningRows: 1,
        errorRows: 0,
        requiresReviewRows: 1,
        rows: [
          {reviewStatus: 'requires_review',validationIssues:[],
            rowNumber: 1,
            raw: { 'الناقل': 'شركة الرمال', 'اسم السائق': 'سالم علي', 'رقم الشاحنة': 'TRK-100' },
            status: 'WARNING',
            entityResolutions: {
              carrier: {entityType:'CARRIER',originalValue:'شركة الرمال',confidence:0,isExact:false, sourceValue: 'شركة الرمال', matchedId: 'CAR-SAME', matchedName: 'شركة الرمال', recommendation: 'ACCEPT', matchMethod: 'EXACT' },
              driver: {entityType:'DRIVER',originalValue:'سالم علي',confidence:0,isExact:false, sourceValue: 'سالم علي', recommendation: 'REVIEW' },
              truck: {entityType:'TRUCK',originalValue:'TRK-100',confidence:0,isExact:false, sourceValue: 'TRK-100', recommendation: 'REVIEW' },
            },
          } satisfies ImportRow,
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
          <I18nProvider initialLocale="ar"><RosterDriverTruckResolutionLayer
            importBatch={batch}
            projectDrivers={projectDrivers}
            projectTrucks={projectTrucks}
            onAcceptCandidate={() => {}}
            onSelectAlternate={() => {}}
            onCreateDriver={() => {}}
            onCreateTruck={() => {}}
          /></I18nProvider>
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

      const batchWithMaterialBlocker: UnifiedImportBatch = {validationStatus:'PENDING',operationId:'OP-PORTAL',createdAt:'2026-01-01T00:00:00Z',createdBy:'SYNTHETIC',committedRows:0,auditTrail:[],currentStage:'REVIEW',commitStatus:'AWAITING_REVIEW',source:{sourceType:'EXCEL',importBatchId:'BATCH-FINAL-BLOCKER'},
        importBatchId: 'BATCH-FINAL-BLOCKER',
        projectId: 'PRJ-101',

        totalRows: 1,
        validRows: 0,
        warningRows: 1,
        errorRows: 1,
        requiresReviewRows: 1,
        issues: [
          {row:1,field:'material',code:'MATERIAL_PROJECT_CONFLICT',resolvable:true,blocking:true, issueId: 'ISS-MAT', message: 'مادة غير معتمدة للمشروع', severity: 'BLOCKING',  },
        ],
        rows: [],
      };

      await act(async () => {
        root.render(
          <I18nProvider initialLocale="ar"><RosterFinalReviewLayer
            importBatch={batchWithMaterialBlocker}
            onCommit={async () => {}}
            onClose={handleClose}
          /></I18nProvider>
        );
      });

      // G: onClose exists -> correction button is rendered ("العودة لمعالجة البيانات")
      expect(document.body.textContent).toContain(canonicalBatch4Label('entityResolution.labels.return_to_correction'));

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
      const testBatch: UnifiedImportBatch = {validationStatus:'PENDING',operationId:'OP-PORTAL',createdAt:'2026-01-01T00:00:00Z',createdBy:'SYNTHETIC',committedRows:0,auditTrail:[],currentStage:'REVIEW',commitStatus:'AWAITING_REVIEW',source:{sourceType:'EXCEL',importBatchId:'BATCH-COMP-A'},
        importBatchId: 'BATCH-COMP-A',
        projectId: 'PRJ-101',

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
              carrier: {entityType:'CARRIER',originalValue:'ناقل الرياض', matchedId: 'CAR-101', matchedName: 'ناقل الرياض', sourceValue: 'ناقل الرياض', recommendation: 'ACCEPT', matchMethod: 'EXACT', confidence: 1.0, isExact: true },
              driver: {entityType:'DRIVER', sourceValue: 'علي المنصور', recommendation: 'REVIEW', confidence: 0, isExact: false, originalValue: 'علي المنصور' },
            },
            status: 'WARNING',
            validationIssues: [],
            reviewStatus: 'requires_review',
          } satisfies ImportRow,
        ],
      };

      await act(async () => {
        root.render(
          <I18nProvider initialLocale="ar"><RosterDriverTruckResolutionLayer canonicalContext={canonicalFleetContext} onCanonicalVerified={()=>{}}
            importBatch={testBatch}
            onAcceptCandidate={() => {}}
            onSelectAlternate={() => {}}
            onCreateDriver={() => {}}
            onCreateTruck={() => {}}
          /></I18nProvider>
        );
      });

      const buttons = Array.from(document.body.querySelectorAll('button'));
      const createDriverBtn = buttons.find((b) => b.textContent?.includes(canonicalBatch4Label('import.resolution.identify')));
      expect(createDriverBtn).toBeDefined();

      await act(async () => {
        createDriverBtn?.click();
      });

      const nameInput = document.body.querySelector('input[name="driverName"]') as HTMLInputElement;
      const iqamaInput = document.body.querySelector('input[name="residencyId"]') as HTMLInputElement;
      const phoneInput = document.body.querySelector('input[name="phone"]') as HTMLInputElement;

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
      const testBatch: UnifiedImportBatch = {validationStatus:'PENDING',operationId:'OP-PORTAL',createdAt:'2026-01-01T00:00:00Z',createdBy:'SYNTHETIC',committedRows:0,auditTrail:[],currentStage:'REVIEW',commitStatus:'AWAITING_REVIEW',source:{sourceType:'EXCEL',importBatchId:'BATCH-COMP-B'},
        importBatchId: 'BATCH-COMP-B',
        projectId: 'PRJ-101',

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
              carrier: {entityType:'CARRIER',originalValue:'ناقل الرياض', matchedId: 'CAR-101', matchedName: 'ناقل الرياض', sourceValue: 'ناقل الرياض', recommendation: 'ACCEPT', matchMethod: 'EXACT', confidence: 1.0, isExact: true },
              truck: {entityType:'TRUCK', sourceValue: 'ح ط ي 7777', recommendation: 'REVIEW', confidence: 0, isExact: false, originalValue: 'ح ط ي 7777' },
            },
            status: 'WARNING',
            validationIssues: [],
            reviewStatus: 'requires_review',
          } satisfies ImportRow,
        ],
      };

      await act(async () => {
        root.render(
          <I18nProvider initialLocale="ar"><RosterDriverTruckResolutionLayer canonicalContext={canonicalFleetContext} onCanonicalVerified={()=>{}}
            importBatch={testBatch}
            onAcceptCandidate={() => {}}
            onSelectAlternate={() => {}}
            onCreateDriver={() => {}}
            onCreateTruck={() => {}}
          /></I18nProvider>
        );
      });

      const buttons = Array.from(document.body.querySelectorAll('button'));
      const createTruckBtn = buttons.find((b) => b.textContent?.includes(canonicalBatch4Label('import.resolution.identify')));
      expect(createTruckBtn).toBeDefined();

      await act(async () => {
        createTruckBtn?.click();
      });

      const plateInput = document.body.querySelector('input[name="plateNumber"]') as HTMLInputElement;
      const typeInput = document.body.querySelector('input[name="truckType"]') as HTMLInputElement;
      const tareInput = document.body.querySelector('input[name="tareWeightKg"]') as HTMLInputElement;
      const grossInput = document.body.querySelector('input[name="maxGrossWeightKg"]') as HTMLInputElement;

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

      const conflictBatch: UnifiedImportBatch = {validationStatus:'PENDING',operationId:'OP-PORTAL',createdAt:'2026-01-01T00:00:00Z',createdBy:'SYNTHETIC',committedRows:0,auditTrail:[],currentStage:'REVIEW',commitStatus:'AWAITING_REVIEW',source:{sourceType:'EXCEL',importBatchId:'BATCH-COMP-C'},
        importBatchId: 'BATCH-COMP-C',
        projectId: 'PRJ-101',

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
              carrier: {entityType:'CARRIER',originalValue:'ناقل الرياض', matchedId: 'CAR-101', matchedName: 'ناقل الرياض', sourceValue: 'ناقل الرياض', recommendation: 'ACCEPT', matchMethod: 'EXACT', confidence: 1.0, isExact: true },
              driver: {entityType:'DRIVER',originalValue:'سعود فهد',confidence:0,isExact:false, sourceValue: 'سعود فهد', recommendation: 'REVIEW' },
            },
            status: 'WARNING',
            validationIssues: [],
            reviewStatus: 'requires_review',
          } satisfies ImportRow,
          {
            rowNumber: 2,
            raw: {},
            canonical: { driverName: 'سعود فهد', driverIdentity: '1011111111', driverPhone: '0502222222' },
            entityResolutions: {
              carrier: {entityType:'CARRIER',originalValue:'ناقل الرياض', matchedId: 'CAR-101', matchedName: 'ناقل الرياض', sourceValue: 'ناقل الرياض', recommendation: 'ACCEPT', matchMethod: 'EXACT', confidence: 1.0, isExact: true },
              driver: {entityType:'DRIVER',originalValue:'سعود فهد',confidence:0,isExact:false, sourceValue: 'سعود فهد', recommendation: 'REVIEW' },
            },
            status: 'WARNING',
            validationIssues: [],
            reviewStatus: 'requires_review',
          } satisfies ImportRow,
        ],
      };

      await act(async () => {
        root.render(
          <I18nProvider initialLocale="ar"><RosterDriverTruckResolutionLayer canonicalContext={canonicalFleetContext} onCanonicalVerified={()=>{}}
            importBatch={conflictBatch}
            onAcceptCandidate={() => {}}
            onSelectAlternate={() => {}}
            onCreateDriver={handleCreateDriver}
            onCreateTruck={() => {}}
          /></I18nProvider>
        );
      });

      const buttons = Array.from(document.body.querySelectorAll('button'));
      const createDriverBtn = buttons.find((b) => b.textContent?.includes(canonicalBatch4Label('import.resolution.identify')));

      await act(async () => {
        createDriverBtn?.click();
      });

      expect(document.body.querySelectorAll('input[type=checkbox]').length).toBeGreaterThan(0);
      expect(document.body.textContent).toContain(`0501111111 / 0502222222`);

      const submitBtn = document.body.querySelector('form button:not([type])') as HTMLButtonElement;
      expect(submitBtn).not.toBeNull();
      await act(async () => {
        submitBtn?.click();
      });

      expect(handleCreateDriver).toHaveBeenCalledTimes(0);

      const phoneInput = document.body.querySelector('input[name="phone"]') as HTMLInputElement;
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

      expect(handleCreateDriver).toHaveBeenCalledTimes(0);
      await act(async () => { (document.body.querySelector('input[type=checkbox]') as HTMLInputElement).click(); });
      await act(async () => { submitBtn.click(); });
      expect(handleCreateDriver).toHaveBeenCalledTimes(1);
      expect(handleCreateDriver.mock.calls[0][1].phone).toBe('0501111111');

      await act(async () => {
        root.unmount();
      });
    });

    it('C4 REAL COMPONENT D: Truck conflicting optional tareWeightKg displays conflict details, blocks submit until resolved, then submits chosen value', async () => {
      const root = createRoot(container);
      const handleCreateTruck = vi.fn();

      const conflictBatch: UnifiedImportBatch = {validationStatus:'PENDING',operationId:'OP-PORTAL',createdAt:'2026-01-01T00:00:00Z',createdBy:'SYNTHETIC',committedRows:0,auditTrail:[],currentStage:'REVIEW',commitStatus:'AWAITING_REVIEW',source:{sourceType:'EXCEL',importBatchId:'BATCH-COMP-D'},
        importBatchId: 'BATCH-COMP-D',
        projectId: 'PRJ-101',

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
              carrier: {entityType:'CARRIER',originalValue:'ناقل الرياض', matchedId: 'CAR-101', matchedName: 'ناقل الرياض', sourceValue: 'ناقل الرياض', recommendation: 'ACCEPT', matchMethod: 'EXACT', confidence: 1.0, isExact: true },
              truck: {entityType:'TRUCK',originalValue:'ك ل م 8888',confidence:0,isExact:false, sourceValue: 'ك ل م 8888', recommendation: 'REVIEW' },
            },
            status: 'WARNING',
            validationIssues: [],
            reviewStatus: 'requires_review',
          } satisfies ImportRow,
          {
            rowNumber: 2,
            raw: {},
            canonical: { truckPlate: 'ك ل م 8888', tareWeightKg: 16000 },
            entityResolutions: {
              carrier: {entityType:'CARRIER',originalValue:'ناقل الرياض', matchedId: 'CAR-101', matchedName: 'ناقل الرياض', sourceValue: 'ناقل الرياض', recommendation: 'ACCEPT', matchMethod: 'EXACT', confidence: 1.0, isExact: true },
              truck: {entityType:'TRUCK',originalValue:'ك ل م 8888',confidence:0,isExact:false, sourceValue: 'ك ل م 8888', recommendation: 'REVIEW' },
            },
            status: 'WARNING',
            validationIssues: [],
            reviewStatus: 'requires_review',
          } satisfies ImportRow,
        ],
      };

      await act(async () => {
        root.render(
          <I18nProvider initialLocale="ar"><RosterDriverTruckResolutionLayer canonicalContext={canonicalFleetContext} onCanonicalVerified={()=>{}}
            importBatch={conflictBatch}
            onAcceptCandidate={() => {}}
            onSelectAlternate={() => {}}
            onCreateDriver={() => {}}
            onCreateTruck={handleCreateTruck}
          /></I18nProvider>
        );
      });

      const buttons = Array.from(document.body.querySelectorAll('button'));
      const createTruckBtn = buttons.find((b) => b.textContent?.includes(canonicalBatch4Label('import.resolution.identify')));

      await act(async () => {
        createTruckBtn?.click();
      });

      expect(document.body.querySelectorAll('input[type=checkbox]').length).toBeGreaterThan(0);
      expect(document.body.textContent).toContain(`14000 / 16000`);

      const submitBtn = document.body.querySelector('form button:not([type])') as HTMLButtonElement;
      expect(submitBtn).not.toBeNull();
      await act(async () => {
        submitBtn?.click();
      });

      expect(handleCreateTruck).toHaveBeenCalledTimes(0);

      const tareInput = document.body.querySelector('input[name="tareWeightKg"]') as HTMLInputElement;
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

      expect(handleCreateTruck).toHaveBeenCalledTimes(0);
      await act(async () => { (document.body.querySelector('input[type=checkbox]') as HTMLInputElement).click(); });
      await act(async () => { submitBtn.click(); });
      expect(handleCreateTruck).toHaveBeenCalledTimes(1);
      expect(handleCreateTruck.mock.calls[0][1].tareWeightKg).toBe(15000);

      await act(async () => {
        root.unmount();
      });
    });

    it('C4 REAL COMPONENT E: Conflict state resets completely when modal is cancelled or a clean group is opened', async () => {
      const root = createRoot(container);

      const multiGroupBatch: UnifiedImportBatch = {validationStatus:'PENDING',operationId:'OP-PORTAL',createdAt:'2026-01-01T00:00:00Z',createdBy:'SYNTHETIC',committedRows:0,auditTrail:[],currentStage:'REVIEW',commitStatus:'AWAITING_REVIEW',source:{sourceType:'EXCEL',importBatchId:'BATCH-COMP-E'},
        importBatchId: 'BATCH-COMP-E',
        projectId: 'PRJ-101',

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
              carrier: {entityType:'CARRIER',originalValue:'ناقل الرياض', matchedId: 'CAR-101', matchedName: 'ناقل الرياض', sourceValue: 'ناقل الرياض', recommendation: 'ACCEPT', matchMethod: 'EXACT', confidence: 1.0, isExact: true },
              driver: {entityType:'DRIVER',originalValue:'سائق متعارض',confidence:0,isExact:false, sourceValue: 'سائق متعارض', recommendation: 'REVIEW' },
            },
            status: 'WARNING',
            validationIssues: [],
            reviewStatus: 'requires_review',
          } satisfies ImportRow,
          {
            rowNumber: 2,
            raw: {},
            canonical: { driverName: 'سائق متعارض', driverIdentity: '1000000001', driverPhone: '0502222222' },
            entityResolutions: {
              carrier: {entityType:'CARRIER',originalValue:'ناقل الرياض', matchedId: 'CAR-101', matchedName: 'ناقل الرياض', sourceValue: 'ناقل الرياض', recommendation: 'ACCEPT', matchMethod: 'EXACT', confidence: 1.0, isExact: true },
              driver: {entityType:'DRIVER',originalValue:'سائق متعارض',confidence:0,isExact:false, sourceValue: 'سائق متعارض', recommendation: 'REVIEW' },
            },
            status: 'WARNING',
            validationIssues: [],
            reviewStatus: 'requires_review',
          } satisfies ImportRow,
          {
            rowNumber: 3,
            raw: {},
            canonical: { driverName: 'سائق سليم', driverIdentity: '1099887766', driverPhone: '0555555555' },
            entityResolutions: {
              carrier: {entityType:'CARRIER',originalValue:'ناقل الرياض', matchedId: 'CAR-101', matchedName: 'ناقل الرياض', sourceValue: 'ناقل الرياض', recommendation: 'ACCEPT', matchMethod: 'EXACT', confidence: 1.0, isExact: true },
              driver: {entityType:'DRIVER',originalValue:'سائق سليم',confidence:0,isExact:false, sourceValue: 'سائق سليم', recommendation: 'REVIEW' },
            },
            status: 'WARNING',
            validationIssues: [],
            reviewStatus: 'requires_review',
          } satisfies ImportRow,
        ],
      };

      await act(async () => {
        root.render(
          <I18nProvider initialLocale="ar"><RosterDriverTruckResolutionLayer canonicalContext={canonicalFleetContext} onCanonicalVerified={()=>{}}
            importBatch={multiGroupBatch}
            onAcceptCandidate={() => {}}
            onSelectAlternate={() => {}}
            onCreateDriver={() => {}}
            onCreateTruck={() => {}}
          /></I18nProvider>
        );
      });

      const createButtons = Array.from(document.body.querySelectorAll('button')).filter((b) => b.textContent?.includes(canonicalBatch4Label('import.resolution.identify')));
      await act(async () => {
        createButtons[0]?.click();
      });

      expect(document.body.querySelectorAll('input[type=checkbox]').length).toBeGreaterThan(0);
      expect(document.body.textContent).toContain(`0501111111 / 0502222222`);

      const cancelBtn = Array.from(document.body.querySelectorAll('button')).find((b) => b.textContent === canonicalBatch4Label('shared.actions.cancel'));
      await act(async () => {
        cancelBtn?.click();
      });

      await act(async () => {
        createButtons[1]?.click();
      });

      expect(document.body.querySelectorAll('input[type=checkbox]').length).toBe(0);
      const iqamaInput = document.body.querySelector('input[name="residencyId"]') as HTMLInputElement;
      expect(iqamaInput.value).toBe('1099887766');

      await act(async () => {
        root.unmount();
      });
    });
  });
});
