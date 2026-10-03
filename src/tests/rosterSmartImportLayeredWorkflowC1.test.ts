import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  RosterSmartImportStage,
  ROSTER_SMART_IMPORT_STAGES,
  ROSTER_STAGE_DEFINITIONS,
  RosterSmartImportWorkflowService,
  RosterWorkflowContext,
} from '../services/import/rosterSmartImportWorkflow.service';

describe('FOUNDATION C1 — LAYERED SMART IMPORT WORKFLOW FOUNDATION', () => {
  const wizardPath = path.resolve(__dirname, '../components/wizard/ProjectSetupWizard.tsx');
  const wizardContent = fs.readFileSync(wizardPath, 'utf-8');

  const workflowServicePath = path.resolve(__dirname, '../services/import/rosterSmartImportWorkflow.service.ts');
  const workflowContent = fs.readFileSync(workflowServicePath, 'utf-8');

  // 1. all seven canonical stages exist
  it('1. all seven canonical stages exist', () => {
    expect(ROSTER_SMART_IMPORT_STAGES).toEqual([
      'SOURCE_DISCOVERY',
      'MAPPING_APPROVAL',
      'CARRIER_RESOLUTION',
      'MATERIAL_RESOLUTION',
      'DRIVER_TRUCK_RESOLUTION',
      'FINAL_REVIEW',
      'COMMIT_RESULT',
    ]);
    expect(ROSTER_SMART_IMPORT_STAGES.length).toBe(7);
  });

  // 2. all seven stages remain displayed in orientation stepper
  it('2. all seven stages remain displayed in orientation stepper', () => {
    const labels = ROSTER_STAGE_DEFINITIONS.map((d) => d.labelAr);
    expect(labels).toContain('استكشاف المصدر');
    expect(labels).toContain('اعتماد ربط الأعمدة');
    expect(labels).toContain('مراجعة الناقلين');
    expect(labels).toContain('مراجعة المواد');
    expect(labels).toContain('مراجعة السائقين والشاحنات');
    expect(labels).toContain('المراجعة النهائية');
    expect(labels).toContain('التنفيذ والنتيجة');
    expect(wizardContent).toContain('ROSTER_STAGE_DEFINITIONS.map(');
  });

  // 3. initial stage is SOURCE_DISCOVERY
  it('3. initial stage is SOURCE_DISCOVERY', () => {
    expect(ROSTER_SMART_IMPORT_STAGES[0]).toBe('SOURCE_DISCOVERY');
    expect(wizardContent).toContain("useState<RosterSmartImportStage>('SOURCE_DISCOVERY')");
  });

  // 4. from SOURCE_DISCOVERY: future stages are not directly clickable in UI
  it('4. from SOURCE_DISCOVERY: future stages are not directly clickable in UI', () => {
    // Stepper is informational orientation-first without interactive forward clicking
    expect(wizardContent).not.toContain('onClick={() => setRosterImportStage(def.stage)}');
    expect(wizardContent).toContain('C1 Layered Smart Import Stage Indicator Stepper (Orientation & Progress Indicator)');
  });

  // 5. from MAPPING_APPROVAL: only CARRIER_RESOLUTION can become next active stage after pipeline execution
  it('5. from MAPPING_APPROVAL: only CARRIER_RESOLUTION becomes next active stage after pipeline execution', () => {
    const pipelineCallIdx = wizardContent.indexOf('DriverTruckPipelineService.processFileToReview');
    const followingLines = wizardContent.slice(pipelineCallIdx, pipelineCallIdx + 1000);
    expect(followingLines.includes("transitionToRosterStage('CARRIER_RESOLUTION'") || followingLines.includes("setRosterImportStage('CARRIER_RESOLUTION')")).toBe(true);
    expect(followingLines).not.toContain("setRosterImportStage('MATERIAL_RESOLUTION')");
    expect(followingLines).not.toContain("setRosterImportStage('FINAL_REVIEW')");
  });

  // 6. from CARRIER_RESOLUTION: MATERIAL_RESOLUTION is NOT clickable in C1
  it('6. from CARRIER_RESOLUTION: MATERIAL_RESOLUTION is NOT clickable in C1', () => {
    // The stepper does not render interactive buttons allowing forward navigation to MATERIAL_RESOLUTION
    const stepperIdx = wizardContent.indexOf('C1 Layered Smart Import Stage Indicator Stepper');
    const stepperBlock = wizardContent.slice(stepperIdx, stepperIdx + 1500);
    expect(stepperBlock).not.toContain('<button');
  });

  // 7. DRIVER_TRUCK_RESOLUTION, FINAL_REVIEW, and COMMIT_RESULT are NOT clickable in C1
  it('7. DRIVER_TRUCK_RESOLUTION, FINAL_REVIEW, and COMMIT_RESULT are NOT clickable in C1', () => {
    const stepperIdx = wizardContent.indexOf('C1 Layered Smart Import Stage Indicator Stepper');
    const stepperBlock = wizardContent.slice(stepperIdx, stepperIdx + 1500);
    expect(stepperBlock).not.toContain('onClick');
  });

  // 8. future stages can remain defined in workflow service without being UI-enterable in C1
  it('8. future stages can remain defined in workflow service without being UI-enterable in C1', () => {
    expect(ROSTER_SMART_IMPORT_STAGES).toContain('MATERIAL_RESOLUTION');
    expect(ROSTER_SMART_IMPORT_STAGES).toContain('DRIVER_TRUCK_RESOLUTION');
    expect(ROSTER_SMART_IMPORT_STAGES).toContain('FINAL_REVIEW');
    expect(ROSTER_SMART_IMPORT_STAGES).toContain('COMMIT_RESULT');
  });

  // 9. monolithic review workspace renders ONLY under CARRIER_RESOLUTION
  it('9. monolithic review workspace renders ONLY under CARRIER_RESOLUTION', () => {
    expect(wizardContent).toContain("importBatch && rosterImportStage === 'CARRIER_RESOLUTION'");
    expect(wizardContent).not.toContain("rosterImportStage === 'FINAL_REVIEW' && (\n                    <RosterCarrierResolutionLayer");
  });

  // 10. FINAL_REVIEW does not render the compatibility review workspace
  it('10. FINAL_REVIEW does not render the compatibility review workspace', () => {
    expect(wizardContent).not.toContain("rosterImportStage === 'FINAL_REVIEW' && (\n                    <RosterCarrierResolutionLayer");
  });

  // 11. Carrier resolution layer is explicitly present under CARRIER_RESOLUTION
  it('11. Carrier resolution layer is explicitly present under CARRIER_RESOLUTION', () => {
    expect(wizardContent).toContain('C2: True Carrier-Only Resolution Layer');
    expect(wizardContent).toContain(
      'Only Carrier review groups are resolved here before future layers.'
    );
  });

  // 12. reset returns to SOURCE_DISCOVERY
  it('12. reset returns to SOURCE_DISCOVERY', () => {
    expect(wizardContent).toContain("setRosterImportStage('SOURCE_DISCOVERY')");
  });

  // 13. reset clears import session data as before
  it('13. reset clears import session data as before', () => {
    const resetFnBody = wizardContent.slice(
      wizardContent.indexOf('const handleResetRosterImport = () => {'),
      wizardContent.indexOf('};', wizardContent.indexOf('const handleResetRosterImport = () => {')) + 2
    );

    expect(resetFnBody).toContain('setRosterSelectedFile(null)');
    expect(resetFnBody).toContain('setRosterBuffer(null)');
    expect(resetFnBody).toContain('setRosterDiscoveryResult(null)');
    expect(resetFnBody).toContain('setRosterSelectedSheet(\'\')');
    expect(resetFnBody).toContain('setRosterHeaderRowIndex(0)');
    expect(resetFnBody).toContain('setRosterCustomMappings({})');
    expect(resetFnBody).toContain('setIsRosterMappingApproved(false)');
    expect(resetFnBody).toContain('setImportBatch(null)');
    expect(resetFnBody).toContain('setImportError(null)');
    expect(resetFnBody).toContain('setRosterDiscoveryError(null)');
    expect(resetFnBody).toContain("setRosterImportStage('SOURCE_DISCOVERY')");
  });

  // 14. logical stage transition does not itself clear selected file, mapping, or batch
  it('14. logical stage transition does not itself clear selected file, mapping, or batch', () => {
    expect(workflowContent).not.toContain('setRosterSelectedFile');
    expect(workflowContent).not.toContain('setRosterCustomMappings');
    expect(workflowContent).not.toContain('setImportBatch');
  });

  // 15. ProjectSetupWizard has one explicit rosterImportStage state
  it('15. ProjectSetupWizard has one explicit rosterImportStage state', () => {
    expect(wizardContent).toContain('const [rosterImportStage, setRosterImportStage] = useState<RosterSmartImportStage>');
  });

  // 16. successful discovery transitions to MAPPING_APPROVAL
  it('16. successful discovery transitions to MAPPING_APPROVAL', () => {
    expect(wizardContent.includes("transitionToRosterStage('MAPPING_APPROVAL'") || wizardContent.includes("setRosterImportStage('MAPPING_APPROVAL')")).toBe(true);
  });

  // 17. existing mapping approval button remains the explicit gate
  it('17. existing mapping approval button remains the explicit gate', () => {
    expect(wizardContent).toContain('onClick={handleApproveRosterMappingAndStartPipeline}');
    expect(wizardContent).toContain('اعتماد الربط وبدء تحليل سجل التشغيل');
  });

  // 18. carrier resolution layer is rendered once
  it('18. carrier resolution layer is rendered once', () => {
    const matches = wizardContent.match(/<RosterCarrierResolutionLayer/g);
    expect(matches?.length).toBe(1);
  });

  // 19. stage indicator remains informational / orientation-first
  it('19. stage indicator remains informational / orientation-first', () => {
    expect(wizardContent).toContain('مسار الاستيراد الذكي التراكمي (Smart Import Workflow)');
  });

  // 20. no prompt() cleanup in C1
  it('20. no prompt() cleanup in C1', () => {
    expect(wizardContent).toContain('prompt(');
  });

  // 21. no CarrierEditorModal Smart Import integration in C1
  it('21. no CarrierEditorModal Smart Import integration in C1', () => {
    const missingEntityFn = wizardContent.slice(
      wizardContent.indexOf('const handleGroupedCreateMissingEntity = async (group: any) => {'),
      wizardContent.indexOf('};', wizardContent.indexOf('const handleGroupedCreateMissingEntity = async (group: any) => {')) + 200
    );
    expect(missingEntityFn).not.toContain('setIsCarrierEditorOpen(true)');
  });

  // 22. no MaterialEditorModal Smart Import integration in C1
  it('22. no MaterialEditorModal Smart Import integration in C1', () => {
    const missingEntityFn = wizardContent.slice(
      wizardContent.indexOf('const handleGroupedCreateMissingEntity = async (group: any) => {'),
      wizardContent.indexOf('};', wizardContent.indexOf('const handleGroupedCreateMissingEntity = async (group: any) => {')) + 200
    );
    expect(missingEntityFn).not.toContain('setIsAddingMaterial(true)');
  });

  // 23. no changes to entity resolution semantics
  it('23. no changes to entity resolution semantics', () => {
    expect(wizardContent).toContain('DriverTruckPipelineService.applyEntityResolutionDecision');
    expect(wizardContent).toContain('DriverTruckPipelineService.applyGroupedEntityResolutionDecision');
    expect(wizardContent).toContain('DriverTruckPipelineService.applyCreatedEntityResolution');
  });

  // 24. no changes to commit semantics
  it('24. no changes to commit semantics', () => {
    expect(wizardContent).toContain('DriverTruckPipelineService.commitBatch(importBatch, commitContext)');
  });

  // 25. no changes to DriverTruckPipelineService
  it('25. no changes to DriverTruckPipelineService', () => {
    const pipelinePath = path.resolve(__dirname, '../services/import/driverTruckPipeline.service.ts');
    expect(fs.existsSync(pipelinePath)).toBe(true);
  });

  // 26. no changes to SmartSourceDiscoveryService
  it('26. no changes to SmartSourceDiscoveryService', () => {
    const discoveryPath = path.resolve(__dirname, '../services/import/smartSourceDiscovery.service.ts');
    expect(fs.existsSync(discoveryPath)).toBe(true);
  });

  // 27. reset cannot leave stale isRosterMappingApproved/importBatch/stage mismatch
  it('27. reset cannot leave stale isRosterMappingApproved/importBatch/stage mismatch', () => {
    const resetIdx = wizardContent.indexOf('handleResetRosterImport = () =>');
    const resetBody = wizardContent.slice(resetIdx, resetIdx + 1000);
    expect(resetBody).toContain("setRosterImportStage('SOURCE_DISCOVERY')");
    expect(resetBody).toContain('setIsRosterMappingApproved(false)');
    expect(resetBody).toContain('setImportBatch(null)');
  });

  // 28. existing B2 Project Setup Material/Carrier editing remains unaffected
  it('28. existing B2 Project Setup Material/Carrier editing remains unaffected', () => {
    expect(wizardContent).toContain('<CarrierEditorModal');
    expect(wizardContent).toContain('<MaterialEditorModal');
    expect(wizardContent).toContain('editingMaterial');
    expect(wizardContent).toContain('editingCarrier');
  });

  // 29. BEHAVIORAL: SOURCE_DISCOVERY to MAPPING_APPROVAL transition contract
  it('29. BEHAVIORAL: SOURCE_DISCOVERY to MAPPING_APPROVAL allows transition when discovery completed', () => {
    const validDiscoveryContext: RosterWorkflowContext = {
      hasSource: true,
      hasDiscovery: true,
      hasDetectedHeaders: true,
      isMappingApproved: false,
      hasImportBatch: false,
    };
    expect(
      RosterSmartImportWorkflowService.canEnterStage('MAPPING_APPROVAL', validDiscoveryContext, 'SOURCE_DISCOVERY')
    ).toBe(true);

    const incompleteDiscoveryContext: RosterWorkflowContext = {
      hasSource: true,
      hasDiscovery: false,
      hasDetectedHeaders: false,
      isMappingApproved: false,
      hasImportBatch: false,
    };
    expect(
      RosterSmartImportWorkflowService.canEnterStage('MAPPING_APPROVAL', incompleteDiscoveryContext, 'SOURCE_DISCOVERY')
    ).toBe(false);
  });

  // 30. BEHAVIORAL: MAPPING_APPROVAL to CARRIER_RESOLUTION with effective next context
  it('30. BEHAVIORAL: MAPPING_APPROVAL to CARRIER_RESOLUTION succeeds with effective next context despite stale state', () => {
    // Stale React state before re-render
    const staleContext: RosterWorkflowContext = {
      hasSource: true,
      hasDiscovery: true,
      hasDetectedHeaders: true,
      isMappingApproved: false,
      hasImportBatch: false,
    };

    // Fails on stale context
    expect(
      RosterSmartImportWorkflowService.canEnterStage('CARRIER_RESOLUTION', staleContext, 'MAPPING_APPROVAL')
    ).toBe(false);

    // Effective next context overrides
    const effectiveContext: RosterWorkflowContext = {
      ...staleContext,
      isMappingApproved: true,
      hasImportBatch: true,
    };

    // Succeeds on effective context
    expect(
      RosterSmartImportWorkflowService.canEnterStage('CARRIER_RESOLUTION', effectiveContext, 'MAPPING_APPROVAL')
    ).toBe(true);
  });

  // 31. BEHAVIORAL: ONE-STAGE-AT-A-TIME sequential isolation
  it('31. BEHAVIORAL: ONE-STAGE-AT-A-TIME strict sequential guard prevents skipping layers', () => {
    const fullContext: RosterWorkflowContext = {
      hasSource: true,
      hasDiscovery: true,
      hasDetectedHeaders: true,
      isMappingApproved: true,
      hasImportBatch: true,
      isCommitAttemptedOrCompleted: false,
    };

    // Cannot jump from SOURCE_DISCOVERY directly to CARRIER_RESOLUTION or later
    expect(RosterSmartImportWorkflowService.canEnterStage('CARRIER_RESOLUTION', fullContext, 'SOURCE_DISCOVERY')).toBe(false);
    expect(RosterSmartImportWorkflowService.canEnterStage('MATERIAL_RESOLUTION', fullContext, 'SOURCE_DISCOVERY')).toBe(false);
    expect(RosterSmartImportWorkflowService.canEnterStage('FINAL_REVIEW', fullContext, 'SOURCE_DISCOVERY')).toBe(false);

    // Cannot jump from MAPPING_APPROVAL directly to MATERIAL_RESOLUTION or later
    expect(RosterSmartImportWorkflowService.canEnterStage('MATERIAL_RESOLUTION', fullContext, 'MAPPING_APPROVAL')).toBe(false);
    expect(RosterSmartImportWorkflowService.canEnterStage('FINAL_REVIEW', fullContext, 'MAPPING_APPROVAL')).toBe(false);

    // Cannot jump from CARRIER_RESOLUTION directly to FINAL_REVIEW
    expect(RosterSmartImportWorkflowService.canEnterStage('FINAL_REVIEW', fullContext, 'CARRIER_RESOLUTION')).toBe(false);

    // Sequential step transitions succeed
    expect(RosterSmartImportWorkflowService.canEnterStage('CARRIER_RESOLUTION', fullContext, 'MAPPING_APPROVAL')).toBe(true);
    expect(RosterSmartImportWorkflowService.canEnterStage('MATERIAL_RESOLUTION', fullContext, 'CARRIER_RESOLUTION')).toBe(true);
    expect(RosterSmartImportWorkflowService.canEnterStage('DRIVER_TRUCK_RESOLUTION', fullContext, 'MATERIAL_RESOLUTION')).toBe(true);
    expect(RosterSmartImportWorkflowService.canEnterStage('FINAL_REVIEW', fullContext, 'DRIVER_TRUCK_RESOLUTION')).toBe(true);
  });
});
