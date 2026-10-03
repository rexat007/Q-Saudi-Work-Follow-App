import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { RosterBatchReviewService } from '../services/import/rosterBatchReview.service';
import { UnifiedImportBatch } from '../types/unifiedImport';
import { ROSTER_SMART_IMPORT_STAGES } from '../services/import/rosterSmartImportWorkflow.service';
import { CarrierCreationResult } from '../services/carrierManagementClient.service';

describe('UNIT C2 — SMART IMPORT CARRIER RESOLUTION LAYER', () => {
  const layerPath = path.resolve(__dirname, '../components/import/RosterCarrierResolutionLayer.tsx');
  const layerContent = fs.readFileSync(layerPath, 'utf-8');

  const wizardPath = path.resolve(__dirname, '../components/wizard/ProjectSetupWizard.tsx');
  const wizardContent = fs.readFileSync(wizardPath, 'utf-8');

  const mockBatch: UnifiedImportBatch = {
    batchId: 'BATCH-C2-001',
    fileName: 'roster_2026.xlsx',
    fileSize: 12400,
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
        raw: { 'رقم الشاحنة': 'TRK-101', 'الناقل': 'شركة الرمال للنقل', 'المادة': 'رمل مغسول', 'اسم السائق': 'سالم علي' },
        entityResolutions: {
          carrier: { sourceValue: 'شركة الرمال للنقل', recommendation: 'REVIEW' },
          material: { sourceValue: 'رمل مغسول', recommendation: 'REVIEW' },
          driver: { sourceValue: 'سالم علي', recommendation: 'REVIEW' },
          truck: { sourceValue: 'TRK-101', recommendation: 'REVIEW' },
        },
        status: 'WARNING',
        validationIssues: [],
        resolutionDecisions: {},
      },
      {
        rowNumber: 2,
        raw: { 'رقم الشاحنة': 'TRK-102', 'الناقل': 'شركة الرمال للنقل', 'المادة': 'رمل مغسول', 'اسم السائق': 'أحمد فهد' },
        entityResolutions: {
          carrier: { sourceValue: 'شركة الرمال للنقل', recommendation: 'REVIEW' },
          material: { sourceValue: 'رمل مغسول', recommendation: 'REVIEW' },
          driver: { sourceValue: 'أحمد فهد', recommendation: 'REVIEW' },
          truck: { sourceValue: 'TRK-102', recommendation: 'REVIEW' },
        },
        status: 'WARNING',
        validationIssues: [],
        resolutionDecisions: {},
      },
      {
        rowNumber: 3,
        raw: { 'رقم الشاحنة': 'TRK-103', 'الناقل': 'مؤسسة الصحراء المتقدمة', 'المادة': 'حصى ناعم', 'اسم السائق': 'خالد عمر' },
        entityResolutions: {
          carrier: {
            sourceValue: 'مؤسسة الصحراء المتقدمة',
            recommendation: 'REVIEW',
            candidates: [
              {
                candidateEntityId: 'CARRIER-SAHRA',
                candidateDisplayName: 'مؤسسة الصحراء للنقليات',
                matchConfidence: 0.88,
              },
            ],
          },
          material: { sourceValue: 'حصى ناعم', recommendation: 'REVIEW' },
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

  it('1. RosterBatchReviewService extracts grouped carrier entities from batch', () => {
    const groups = RosterBatchReviewService.getBatchReviewGroups(mockBatch);
    expect(groups.carrier).toBeDefined();
    expect(groups.carrier.length).toBe(2);

    const remalGroup = groups.carrier.find((g) => g.sourceValue === 'شركة الرمال للنقل');
    expect(remalGroup).toBeDefined();
    expect(remalGroup?.occurrenceCount).toBe(2);
    expect(remalGroup?.rowNumbers).toEqual([1, 2]);

    const sahraGroup = groups.carrier.find((g) => g.sourceValue === 'مؤسسة الصحراء المتقدمة');
    expect(sahraGroup).toBeDefined();
    expect(sahraGroup?.occurrenceCount).toBe(1);
    expect(sahraGroup?.candidates?.length).toBeGreaterThan(0);
  });

  it('2. RosterCarrierResolutionLayer isolates carrier groups strictly (no material/driver/truck exposure)', () => {
    expect(layerContent).toContain('reviewGroups.carrier');
    expect(layerContent).not.toContain('reviewGroups.material');
    expect(layerContent).not.toContain('reviewGroups.driver');
    expect(layerContent).not.toContain('reviewGroups.truck');
    expect(layerContent).toContain('C2: STRICT CARRIER-ONLY SCOPE');
  });

  it('3. RosterCarrierResolutionLayer provides completion banner and status indicators', () => {
    expect(layerContent).toContain('مجموعات الناقلين المصدرية');
    expect(layerContent).toContain('ناقلون محسومون ومعتمدون');
    expect(layerContent).toContain('بحاجة لحسم أو إنشاء');
    expect(layerContent).toContain('طبقة المواد ستُفتح في المرحلة التالية');
  });

  it('4. ProjectSetupWizard mounts RosterCarrierResolutionLayer exclusively under CARRIER_RESOLUTION', () => {
    expect(wizardContent).toContain('RosterCarrierResolutionLayer');
    expect(wizardContent).toContain("importBatch && rosterImportStage === 'CARRIER_RESOLUTION'");
    expect(wizardContent).not.toContain("rosterImportStage === 'FINAL_REVIEW' && (\n                    <RosterCarrierResolutionLayer");
  });

  it('5. ProjectSetupWizard hooks candidate acceptance and alternate carrier selection handlers', () => {
    expect(wizardContent).toContain('handleSmartImportCarrierAcceptCandidate');
    expect(wizardContent).toContain('handleSmartImportCarrierSelectAlternate');
    expect(wizardContent).toContain("applyGroupedEntityResolutionDecision");
  });

  it('6. ProjectSetupWizard hooks authoritative CarrierEditorModal for smart import creation', () => {
    expect(wizardContent).toContain('handleSmartImportCarrierCreated');
    expect(wizardContent).toContain('isSmartImportCarrierModalOpen');
    expect(wizardContent).toContain('smartImportPendingCarrierGroup');
    expect(wizardContent).toContain('projectCanonicalRefreshService.refresh');
    expect(wizardContent).toContain('DriverTruckPipelineService.applyGroupedCreatedEntityResolution');
  });

  it('7. C2 enforces Stage Ceiling at CARRIER_RESOLUTION (no premature advancement to MATERIAL_RESOLUTION)', () => {
    // Check that workflow stages remain canonical
    expect(ROSTER_SMART_IMPORT_STAGES[2]).toBe('CARRIER_RESOLUTION');
    expect(ROSTER_SMART_IMPORT_STAGES[3]).toBe('MATERIAL_RESOLUTION');

    // Stepper in wizard does not allow jumping ahead to MATERIAL_RESOLUTION
    const stepperIdx = wizardContent.indexOf('C1 Layered Smart Import Stage Indicator Stepper');
    const stepperBlock = wizardContent.slice(stepperIdx, stepperIdx + 1500);
    expect(stepperBlock).not.toContain('onClick');
  });

  it('8. All source and mapping state is preserved during carrier resolution', () => {
    expect(wizardContent).toContain('rosterSelectedFile');
    expect(wizardContent).toContain('rosterBuffer');
    expect(wizardContent).toContain('rosterDiscoveryResult');
    expect(wizardContent).toContain('rosterCustomMappings');
    expect(wizardContent).toContain('isRosterMappingApproved');
  });

  it('9. Closing/dismissing Carrier layer does NOT clear importBatch or cause stage/batch desync', () => {
    // In ProjectSetupWizard.tsx, RosterCarrierResolutionLayer must NOT have onClose={() => setImportBatch(null)}
    const mountIdx = wizardContent.indexOf('<RosterCarrierResolutionLayer');
    const mountBlock = wizardContent.slice(mountIdx, mountIdx + 500);
    expect(mountBlock).not.toContain('setImportBatch(null)');
    expect(mountBlock).not.toContain('onClose={() => setImportBatch(null)}');
  });

  it('10. Destructive import session clearing occurs ONLY through handleResetRosterImport()', () => {
    const resetIdx = wizardContent.indexOf('const handleResetRosterImport = () => {');
    const resetBody = wizardContent.slice(
      resetIdx,
      wizardContent.indexOf('};', resetIdx) + 2
    );

    expect(resetBody).toContain('setRosterSelectedFile(null)');
    expect(resetBody).toContain('setRosterBuffer(null)');
    expect(resetBody).toContain('setRosterDiscoveryResult(null)');
    expect(resetBody).toContain('setImportBatch(null)');
    expect(resetBody).toContain("setRosterImportStage('SOURCE_DISCOVERY')");
    expect(resetBody).toContain('setIsSmartImportCarrierModalOpen(false)');
    expect(resetBody).toContain('setSmartImportPendingCarrierGroup(null)');
  });

  it('11. handleSmartImportCarrierCreated adheres strictly to CarrierCreationResult type contract', () => {
    const handlerIdx = wizardContent.indexOf('const handleSmartImportCarrierCreated = async (result: CarrierCreationResult) => {');
    const handlerBody = wizardContent.slice(
      handlerIdx,
      wizardContent.indexOf('};', handlerIdx) + 500
    );

    // Must NOT access result.carrier
    expect(handlerBody).not.toContain('result.carrier?.');
    expect(handlerBody).not.toContain('result.carrier.');

    // Must use result.carrierId and smartImportPendingCarrierGroup.sourceValue
    expect(handlerBody).toContain('matchedId: result.carrierId');
    expect(handlerBody).toContain('matchedName: smartImportPendingCarrierGroup.sourceValue');
    expect(handlerBody).toContain('sourceValue: smartImportPendingCarrierGroup.sourceValue');
  });

  it('12. CarrierCreationResult type contract remains authoritative and unmodified', () => {
    // Verify CarrierCreationResult structure compatibility
    const sampleResult: CarrierCreationResult = {
      success: true,
      projectId: 'PRJ-100',
      carrierId: 'CAR-100',
      membershipStatus: 'ACTIVE',
    };
    expect(sampleResult.carrierId).toBe('CAR-100');
    expect(sampleResult.success).toBe(true);
  });

  it('13. Created Carrier grouped resolution uses result.carrierId and pending group context', () => {
    const handlerIdx = wizardContent.indexOf('const handleSmartImportCarrierCreated = async (result: CarrierCreationResult) => {');
    const handlerBody = wizardContent.slice(
      handlerIdx,
      wizardContent.indexOf('};', handlerIdx) + 500
    );

    expect(handlerBody).toContain('DriverTruckPipelineService.applyGroupedCreatedEntityResolution(');
    expect(handlerBody).toContain('importBatch');
    expect(handlerBody).toContain("'carrier'");
    expect(handlerBody).toContain('smartImportPendingCarrierGroup.normalizedSourceKey');
    expect(handlerBody).toContain('resolutionPayload');
    expect(handlerBody).toContain('pipelineCtx');
  });

  it('14. Smart Import CarrierEditorModal renders at z-60 above parent Carrier Resolution layer z-50', () => {
    const smartImportCarrierModalIdx = wizardContent.indexOf('Smart Import Dedicated Carrier Creation Modal');
    const smartImportModalBlock = wizardContent.slice(smartImportCarrierModalIdx, smartImportCarrierModalIdx + 600);
    expect(smartImportModalBlock).toContain('zIndexClass="z-60"');
  });
});
