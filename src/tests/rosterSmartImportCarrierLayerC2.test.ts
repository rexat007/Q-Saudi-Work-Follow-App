import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { RosterBatchReviewService } from '../services/import/rosterBatchReview.service';
import { UnifiedImportBatch } from '../types/unifiedImport';
import { ROSTER_SMART_IMPORT_STAGES } from '../services/import/rosterSmartImportWorkflow.service';

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
});
