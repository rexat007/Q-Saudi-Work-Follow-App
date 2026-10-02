import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { RosterBatchReviewService } from '../services/import/rosterBatchReview.service';
import { UnifiedImportBatch } from '../types/unifiedImport';
import { ROSTER_SMART_IMPORT_STAGES, ROSTER_STAGE_DEFINITIONS } from '../services/import/rosterSmartImportWorkflow.service';
import { MaterialCreationResult } from '../services/materialManagementClient.service';

describe('UNIT C3 — SMART IMPORT MATERIAL RESOLUTION LAYER', () => {
  const materialLayerPath = path.resolve(__dirname, '../components/import/RosterMaterialResolutionLayer.tsx');
  const materialLayerContent = fs.readFileSync(materialLayerPath, 'utf-8');

  const carrierLayerPath = path.resolve(__dirname, '../components/import/RosterCarrierResolutionLayer.tsx');
  const carrierLayerContent = fs.readFileSync(carrierLayerPath, 'utf-8');

  const wizardPath = path.resolve(__dirname, '../components/wizard/ProjectSetupWizard.tsx');
  const wizardContent = fs.readFileSync(wizardPath, 'utf-8');

  const mockBatchWithCarriersAndMaterials: UnifiedImportBatch = {
    batchId: 'BATCH-C3-001',
    fileName: 'roster_c3_test.xlsx',
    fileSize: 15600,
    fileType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    uploadedAt: new Date().toISOString(),
    status: 'PARSED',
    totalRows: 3,
    validRows: 0,
    warningRows: 3,
    errorRows: 0,
    requiresReviewRows: 3,
    importedRows: 0,
    sourceHeaders: ['رقم الشاحنة', 'الناقل', 'المادة', 'اسم السائق'],
    columnMappings: {
      'رقم الشاحنة': 'truck_plate',
      'الناقل': 'carrier_name',
      'المادة': 'material_name',
      'اسم السائق': 'driver_name',
    },
    rows: [
      {
        rowNumber: 1,
        raw: { 'رقم الشاحنة': 'TRK-101', 'الناقل': 'شركة الرمال للنقل', 'المادة': 'رمل مغسول A', 'اسم السائق': 'سالم علي' },
        entityResolutions: {
          carrier: { sourceValue: 'شركة الرمال للنقل', matchedId: 'CAR-REMAL-01', matchedName: 'شركة الرمال للنقل', recommendation: 'ACCEPT', matchMethod: 'EXACT' },
          material: { sourceValue: 'رمل مغسول A', recommendation: 'REVIEW' },
          driver: { sourceValue: 'سالم علي', recommendation: 'REVIEW' },
          truck: { sourceValue: 'TRK-101', recommendation: 'REVIEW' },
        },
        status: 'WARNING',
        validationIssues: [],
        resolutionDecisions: {},
      },
      {
        rowNumber: 2,
        raw: { 'رقم الشاحنة': 'TRK-102', 'الناقل': 'شركة الرمال للنقل', 'المادة': 'رمل مغسول A', 'اسم السائق': 'أحمد فهد' },
        entityResolutions: {
          carrier: { sourceValue: 'شركة الرمال للنقل', matchedId: 'CAR-REMAL-01', matchedName: 'شركة الرمال للنقل', recommendation: 'ACCEPT', matchMethod: 'EXACT' },
          material: { sourceValue: 'رمل مغسول A', recommendation: 'REVIEW' },
          driver: { sourceValue: 'أحمد فهد', recommendation: 'REVIEW' },
          truck: { sourceValue: 'TRK-102', recommendation: 'REVIEW' },
        },
        status: 'WARNING',
        validationIssues: [],
        resolutionDecisions: {},
      },
      {
        rowNumber: 3,
        raw: { 'رقم الشاحنة': 'TRK-103', 'الناقل': 'شركة الرمال للنقل', 'المادة': 'حصى خشن B', 'اسم السائق': 'خالد عمر' },
        entityResolutions: {
          carrier: { sourceValue: 'شركة الرمال للنقل', matchedId: 'CAR-REMAL-01', matchedName: 'شركة الرمال للنقل', recommendation: 'ACCEPT', matchMethod: 'EXACT' },
          material: {
            sourceValue: 'حصى خشن B',
            recommendation: 'REVIEW',
            candidates: [
              {
                candidateEntityId: 'MAT-HASHA-01',
                candidateDisplayName: 'حصى خشن قياسي 20mm',
                matchConfidence: 0.85,
              },
            ],
          },
          driver: { sourceValue: 'خالد عمر', recommendation: 'REVIEW' },
          truck: { sourceValue: 'TRK-103', recommendation: 'REVIEW' },
        },
        status: 'WARNING',
        validationIssues: [],
        resolutionDecisions: {},
      },
    ],
    issues: [],
  };

  // 1. LAYER TRANSITION TESTS
  it('1. Carrier completion is derived from current batch', () => {
    const groups = RosterBatchReviewService.getBatchReviewGroups(mockBatchWithCarriersAndMaterials);
    const carrierGroups = groups.carrier;
    expect(carrierGroups.length).toBe(1);
    expect(carrierGroups[0].matchedId).toBe('CAR-REMAL-01');
    expect(carrierGroups[0].status).toBe('AUTO_RESOLVED');
  });

  it('2. REVIEW_REQUIRED, UNRESOLVED, or CONFLICT Carrier blocks Material transition in wizard handler', () => {
    expect(wizardContent).toContain('handleSmartImportContinueToMaterials');
    expect(wizardContent).toContain("g.status === 'REVIEW_REQUIRED' || g.status === 'UNRESOLVED' || g.status === 'CONFLICT'");
  });

  it('3. Completed Carrier layer provides onContinueToMaterials callback and progression button', () => {
    expect(carrierLayerContent).toContain('onContinueToMaterials');
    expect(carrierLayerContent).toContain('متابعة إلى مراجعة المواد');
    expect(wizardContent).toContain('onContinueToMaterials={handleSmartImportContinueToMaterials}');
  });

  it('4. Clicking Continue transitions stage explicitly to MATERIAL_RESOLUTION without destroying batch', () => {
    expect(wizardContent).toContain("setRosterImportStage('MATERIAL_RESOLUTION')");
    // Ensure transition doesn't reset batch or file
    const transitionIdx = wizardContent.indexOf('const handleSmartImportContinueToMaterials = () => {');
    const transitionBody = wizardContent.slice(transitionIdx, wizardContent.indexOf('};', transitionIdx) + 2);
    expect(transitionBody).not.toContain('setImportBatch(null)');
    expect(transitionBody).not.toContain('setRosterSelectedFile(null)');
    expect(transitionBody).not.toContain('DriverTruckPipelineService.processFileToReview');
  });

  // 2. MATERIAL-ONLY UI TESTS
  it('5. RosterMaterialResolutionLayer isolates Material groups strictly (no carrier/driver/truck exposure)', () => {
    expect(materialLayerContent).toContain('reviewGroups.material');
    expect(materialLayerContent).not.toContain('reviewGroups.carrier');
    expect(materialLayerContent).not.toContain('reviewGroups.driver');
    expect(materialLayerContent).not.toContain('reviewGroups.truck');
    expect(materialLayerContent).toContain('C3: STRICT MATERIAL-ONLY SCOPE');
  });

  it('6. ProjectSetupWizard mounts RosterMaterialResolutionLayer exclusively under MATERIAL_RESOLUTION', () => {
    expect(wizardContent).toContain('RosterMaterialResolutionLayer');
    expect(wizardContent).toContain("importBatch && rosterImportStage === 'MATERIAL_RESOLUTION'");
    expect(wizardContent).not.toContain("rosterImportStage === 'FINAL_REVIEW' && (\n                    <RosterMaterialResolutionLayer");
  });

  it('7. Commit controls are absent from RosterMaterialResolutionLayer', () => {
    expect(materialLayerContent).not.toContain('commitBatch');
    expect(materialLayerContent).not.toContain('handleCommitRosterImport');
    expect(materialLayerContent).not.toContain('حقن وتأكيد الاستيراد');
  });

  // 3. GROUPING TESTS
  it('8. RosterBatchReviewService groups Materials by normalizedSourceKey with occurrence counts', () => {
    const groups = RosterBatchReviewService.getBatchReviewGroups(mockBatchWithCarriersAndMaterials);
    expect(groups.material).toBeDefined();
    expect(groups.material.length).toBe(2);

    const ramelGroup = groups.material.find((g) => g.sourceValue === 'رمل مغسول A');
    expect(ramelGroup).toBeDefined();
    expect(ramelGroup?.occurrenceCount).toBe(2);
    expect(ramelGroup?.rowNumbers).toEqual([1, 2]);

    const hashaGroup = groups.material.find((g) => g.sourceValue === 'حصى خشن B');
    expect(hashaGroup).toBeDefined();
    expect(hashaGroup?.occurrenceCount).toBe(1);
    expect(hashaGroup?.candidates?.length).toBe(1);
  });

  // 4. EXISTING MATERIAL RESOLUTION TESTS
  it('9. Material candidate acceptance and alternate selection use grouped resolution without prompt', () => {
    expect(wizardContent).toContain('handleSmartImportMaterialAcceptCandidate');
    expect(wizardContent).toContain('handleSmartImportMaterialSelectAlternate');
    expect(wizardContent).toContain("DriverTruckPipelineService.applyGroupedEntityResolutionDecision");
    expect(wizardContent).toContain("'material'");
  });

  it('10. Material resolution uses canonicalRelationshipContextService and ImportProjectContextAdapter without checking relContext.knownEntities', () => {
    const acceptHandlerIdx = wizardContent.indexOf('const handleSmartImportMaterialAcceptCandidate');
    const acceptHandlerBody = wizardContent.slice(acceptHandlerIdx, wizardContent.indexOf('};', acceptHandlerIdx) + 500);

    expect(acceptHandlerBody).toContain('canonicalRelationshipContextService.getProjectRelationshipContext');
    expect(acceptHandlerBody).toContain('ImportProjectContextAdapter.createPipelineContext');
    expect(acceptHandlerBody).not.toContain('relContext.knownEntities');
  });

  // 5. CREATE MATERIAL TESTS
  it('11. Material creation uses authoritative MaterialEditorModal in CREATE mode without prompt()', () => {
    expect(wizardContent).toContain('handleSmartImportMaterialCreated');
    expect(wizardContent).toContain('isSmartImportMaterialModalOpen');
    expect(wizardContent).toContain('smartImportPendingMaterialGroup');
    expect(wizardContent).toContain('<MaterialEditorModal');
    expect(wizardContent).toContain('initialName={smartImportPendingMaterialGroup ? smartImportPendingMaterialGroup.sourceValue : \'\'}');

    const smartImportCreationIdx = wizardContent.indexOf('{project && isSmartImportMaterialModalOpen && (');
    const modalMountBlock = wizardContent.slice(smartImportCreationIdx, smartImportCreationIdx + 600);
    expect(modalMountBlock).toContain('mode="CREATE"');
    expect(modalMountBlock).not.toContain('prompt(');
  });

  it('12. MaterialCreationResult contract compliance — never accesses result.material', () => {
    const handlerIdx = wizardContent.indexOf('const handleSmartImportMaterialCreated = async (result: MaterialCreationResult) => {');
    const handlerBody = wizardContent.slice(handlerIdx, wizardContent.indexOf('};', handlerIdx) + 500);

    expect(handlerBody).not.toContain('result.material?.');
    expect(handlerBody).not.toContain('result.material.');
    expect(handlerBody).toContain('matchedId: result.materialId');
    expect(handlerBody).toContain('matchedName: smartImportPendingMaterialGroup.sourceValue');
    expect(handlerBody).toContain('sourceValue: smartImportPendingMaterialGroup.sourceValue');

    const sampleResult: MaterialCreationResult = {
      success: true,
      projectId: 'PRJ-100',
      materialId: 'MAT-100',
      membershipStatus: 'ACTIVE',
    };
    expect(sampleResult.materialId).toBe('MAT-100');
  });

  it('13. Post-create flow refreshes project data expecting materialId and applies grouped resolution', () => {
    const handlerIdx = wizardContent.indexOf('const handleSmartImportMaterialCreated = async (result: MaterialCreationResult) => {');
    const handlerBody = wizardContent.slice(handlerIdx, wizardContent.indexOf('};', handlerIdx) + 500);

    expect(handlerBody).toContain('projectCanonicalRefreshService.refresh(');
    expect(handlerBody).toContain('{ expect: { materialId: result.materialId } }');
    expect(handlerBody).toContain('applyCanonicalSnapshot(snapshot)');
    expect(handlerBody).toContain('DriverTruckPipelineService.applyGroupedCreatedEntityResolution(');
    expect(handlerBody).toContain("'material'");
    expect(handlerBody).toContain('smartImportPendingMaterialGroup.normalizedSourceKey');
  });

  // 6. COMPLETION GATE AND STAGE CEILING TESTS
  it('14. RosterMaterialResolutionLayer dynamically derives completion from materialGroups and stays at MATERIAL_RESOLUTION', () => {
    expect(materialLayerContent).toContain('مجموعات المواد المصدرية');
    expect(materialLayerContent).toContain('مواد محسومة ومعتمدة');
    expect(materialLayerContent).toContain('بحاجة لحسم أو إنشاء');
    expect(materialLayerContent).toContain('تم حسم جميع المواد بنجاح');
    expect(materialLayerContent).toContain('طبقة السائقين والشاحنات ستُفتح في المرحلة التالية');

    // Material layer does NOT render continue button to driver/truck in C3
    expect(materialLayerContent).not.toContain('onContinueToDrivers');
    expect(materialLayerContent).not.toContain('onContinueToTrucks');
  });

  it('15. C3 enforces Stage Ceiling at MATERIAL_RESOLUTION — subsequent stages remain non-interactive', () => {
    expect(ROSTER_SMART_IMPORT_STAGES[3]).toBe('MATERIAL_RESOLUTION');
    expect(ROSTER_SMART_IMPORT_STAGES[4]).toBe('DRIVER_TRUCK_RESOLUTION');
    expect(ROSTER_SMART_IMPORT_STAGES[5]).toBe('FINAL_REVIEW');
    expect(ROSTER_SMART_IMPORT_STAGES[6]).toBe('COMMIT_RESULT');

    const stepperIdx = wizardContent.indexOf('C1 Layered Smart Import Stage Indicator Stepper');
    const stepperBlock = wizardContent.slice(stepperIdx, stepperIdx + 1500);
    expect(stepperBlock).not.toContain('onClick');
  });

  it('16. All session state and previous Carrier resolutions are preserved throughout Material layer', () => {
    expect(wizardContent).toContain('rosterSelectedFile');
    expect(wizardContent).toContain('rosterBuffer');
    expect(wizardContent).toContain('rosterDiscoveryResult');
    expect(wizardContent).toContain('rosterCustomMappings');
    expect(wizardContent).toContain('isRosterMappingApproved');
    expect(wizardContent).toContain('importBatch');
  });

  // 7. ZERO-MATERIAL FAIL-CLOSED TESTS
  it('17. Zero Material groups strictly reject optionality language and communicate that Material is required', () => {
    // Must NOT contain misleading optionality language
    expect(materialLayerContent).not.toContain('اختيارية');
    expect(materialLayerContent).not.toContain('اختياري');

    // Must communicate required fail-closed status
    expect(materialLayerContent).toContain('لم يتم اكتشاف بيانات مواد قابلة للحسم في ملف الاستيراد.');
    expect(materialLayerContent).toContain('المادة مطلوبة لكل سجل تشغيل. راجع ربط عمود المادة أو بيانات المصدر قبل المتابعة.');
  });

  it('18. Zero Material groups evaluate to incomplete and do not display completion banner or progress', () => {
    // When a batch has zero material columns/data:
    // isMaterialLayerComplete = materialGroups.length > 0 && unresolvedCount === 0 => false
    const emptyMaterialBatch: UnifiedImportBatch = {
      ...mockBatchWithCarriersAndMaterials,
      sourceHeaders: ['رقم الشاحنة', 'الناقل', 'اسم السائق'],
      columnMappings: {
        'رقم الشاحنة': 'truck_plate',
        'الناقل': 'carrier_name',
        'اسم السائق': 'driver_name',
      },
      rows: mockBatchWithCarriersAndMaterials.rows.map((r) => ({
        ...r,
        raw: { 'رقم الشاحنة': r.raw['رقم الشاحنة'], 'الناقل': r.raw['الناقل'], 'اسم السائق': r.raw['اسم السائق'] },
        entityResolutions: {
          carrier: r.entityResolutions?.carrier,
          driver: r.entityResolutions?.driver,
          truck: r.entityResolutions?.truck,
        },
      })),
    };

    const reviewGroups = RosterBatchReviewService.getBatchReviewGroups(emptyMaterialBatch);
    const materialGroups = reviewGroups.material || [];
    expect(materialGroups.length).toBe(0);

    const unresolvedCount = materialGroups.filter(
      (g) => g.status === 'REVIEW_REQUIRED' || g.status === 'UNRESOLVED' || g.status === 'CONFLICT'
    ).length;
    const isMaterialLayerComplete = materialGroups.length > 0 && unresolvedCount === 0;

    expect(isMaterialLayerComplete).toBe(false);
    expect(materialLayerContent).toContain('materialGroups.length > 0 && unresolvedCount === 0');
  });
});

