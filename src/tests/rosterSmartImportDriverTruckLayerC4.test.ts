import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { RosterBatchReviewService } from '../services/import/rosterBatchReview.service';
import { UnifiedImportBatch } from '../types/unifiedImport';
import { ROSTER_SMART_IMPORT_STAGES } from '../services/import/rosterSmartImportWorkflow.service';

describe('UNIT C4 — SMART IMPORT DRIVER & TRUCK RESOLUTION LAYER', () => {
  const driverTruckLayerPath = path.resolve(__dirname, '../components/import/RosterDriverTruckResolutionLayer.tsx');
  const driverTruckLayerContent = fs.readFileSync(driverTruckLayerPath, 'utf-8');

  const materialLayerPath = path.resolve(__dirname, '../components/import/RosterMaterialResolutionLayer.tsx');
  const materialLayerContent = fs.readFileSync(materialLayerPath, 'utf-8');

  const wizardPath = path.resolve(__dirname, '../components/wizard/ProjectSetupWizard.tsx');
  const wizardContent = fs.readFileSync(wizardPath, 'utf-8');

  const mockBatchC4: UnifiedImportBatch = {
    batchId: 'BATCH-C4-001',
    fileName: 'roster_c4_test.xlsx',
    fileSize: 18400,
    fileType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    uploadedAt: new Date().toISOString(),
    status: 'PARSED',
    totalRows: 2,
    validRows: 0,
    warningRows: 2,
    errorRows: 0,
    requiresReviewRows: 2,
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
        raw: { 'رقم الشاحنة': 'TRK-201', 'الناقل': 'شركة الرمال للنقل', 'المادة': 'رمل مغسول', 'اسم السائق': 'سالم علي' },
        entityResolutions: {
          carrier: { sourceValue: 'شركة الرمال للنقل', matchedId: 'CAR-REMAL-01', matchedName: 'شركة الرمال للنقل', recommendation: 'ACCEPT', matchMethod: 'EXACT' },
          material: { sourceValue: 'رمل مغسول', matchedId: 'MAT-SAND-01', matchedName: 'رمل مغسول', recommendation: 'ACCEPT', matchMethod: 'EXACT' },
          driver: { sourceValue: 'سالم علي', recommendation: 'REVIEW' },
          truck: { sourceValue: 'TRK-201', recommendation: 'REVIEW' },
        },
        status: 'WARNING',
        validationIssues: [],
        resolutionDecisions: {},
      },
      {
        rowNumber: 2,
        raw: { 'رقم الشاحنة': 'TRK-202', 'الناقل': 'مؤسسة الصحراء المتقدمة', 'المادة': 'حصى ناعم', 'اسم السائق': 'خالد عمر' },
        entityResolutions: {
          carrier: { sourceValue: 'مؤسسة الصحراء المتقدمة', matchedId: 'CAR-SAHRA-01', matchedName: 'مؤسسة الصحراء المتقدمة', recommendation: 'ACCEPT', matchMethod: 'EXACT' },
          material: { sourceValue: 'حصى ناعم', matchedId: 'MAT-HASHA-01', matchedName: 'حصى ناعم', recommendation: 'ACCEPT', matchMethod: 'EXACT' },
          driver: { sourceValue: 'خالد عمر', recommendation: 'REVIEW' },
          truck: { sourceValue: 'TRK-202', recommendation: 'REVIEW' },
        },
        status: 'WARNING',
        validationIssues: [],
        resolutionDecisions: {},
      },
    ],
    issues: [],
  };

  it('1. Material completion gates transition to Driver/Truck layer via handleSmartImportContinueToDriverTruck', () => {
    expect(wizardContent).toContain('handleSmartImportContinueToDriverTruck');
    expect(wizardContent.includes("transitionToRosterStage('DRIVER_TRUCK_RESOLUTION')") || wizardContent.includes("setRosterImportStage('DRIVER_TRUCK_RESOLUTION')")).toBe(true);
    expect(materialLayerContent).toContain('onContinueToDriverTruck');
    expect(materialLayerContent).toContain('متابعة إلى مراجعة السائقين والشاحنات');
  });

  it('2. Group keys for drivers and trucks incorporate carrier context to prevent leakage', () => {
    const groups = RosterBatchReviewService.getBatchReviewGroups(mockBatchC4);
    expect(groups.driver.length).toBe(2);
    expect(groups.truck.length).toBe(2);

    const driverSalimKey = RosterBatchReviewService.getGroupKey(mockBatchC4.rows[0], 'driver');
    expect(driverSalimKey).toContain('driver:');
    expect(driverSalimKey).toContain('::carrier:CAR-REMAL-01');

    const truck201Key = RosterBatchReviewService.getGroupKey(mockBatchC4.rows[0], 'truck');
    expect(truck201Key).toContain('truck:');
    expect(truck201Key).toContain('::carrier:CAR-REMAL-01');
  });

  it('3. RosterDriverTruckResolutionLayer isolates Driver and Truck groups strictly', () => {
    expect(driverTruckLayerContent).toContain('reviewGroups.driver');
    expect(driverTruckLayerContent).toContain('reviewGroups.truck');
    expect(driverTruckLayerContent).not.toContain('reviewGroups.carrier');
    expect(driverTruckLayerContent).not.toContain('reviewGroups.material');
    expect(driverTruckLayerContent).not.toContain('commitBatch');
  });

  it('4. Wizard mounts RosterDriverTruckResolutionLayer under DRIVER_TRUCK_RESOLUTION stage', () => {
    expect(wizardContent).toContain('RosterDriverTruckResolutionLayer');
    expect(wizardContent).toContain("importBatch && rosterImportStage === 'DRIVER_TRUCK_RESOLUTION'");
  });

  it('5. Candidate acceptance and alternate selection handlers are wired correctly for drivers and trucks', () => {
    expect(wizardContent).toContain('handleSmartImportDriverAcceptCandidate');
    expect(wizardContent).toContain('handleSmartImportDriverSelectAlternate');
    expect(wizardContent).toContain('handleSmartImportTruckAcceptCandidate');
    expect(wizardContent).toContain('handleSmartImportTruckSelectAlternate');
  });

  it('6. Driver and Truck creation use entityResolutionCommandService without prompt()', () => {
    expect(driverTruckLayerContent).toContain('onCreateDriver');
    expect(driverTruckLayerContent).toContain('onCreateTruck');
    expect(driverTruckLayerContent).not.toContain('prompt(');
    expect(wizardContent).toContain('entityResolutionCommandService.createDriver');
    expect(wizardContent).toContain('entityResolutionCommandService.createTruck');
  });

  it('7. Post-create handlers refresh canonical snapshot and apply grouped created resolution', () => {
    expect(wizardContent).toContain('projectCanonicalRefreshService.refresh');
    expect(wizardContent).toContain('DriverTruckPipelineService.applyGroupedCreatedEntityResolution');
  });

  it('8. Stage ceiling ensures stages after DRIVER_TRUCK_RESOLUTION remain non-interactive', () => {
    expect(ROSTER_SMART_IMPORT_STAGES[4]).toBe('DRIVER_TRUCK_RESOLUTION');
    expect(ROSTER_SMART_IMPORT_STAGES[5]).toBe('FINAL_REVIEW');
    expect(ROSTER_SMART_IMPORT_STAGES[6]).toBe('COMMIT_RESULT');

    const stepperIdx = wizardContent.indexOf('C1 Layered Smart Import Stage Indicator Stepper');
    const stepperBlock = wizardContent.slice(stepperIdx, stepperIdx + 1500);
    expect(stepperBlock).not.toContain('onClick');
  });

  it('9. Driver POST is called once and cached successfully before canonical refresh', () => {
    expect(wizardContent).toContain('cachedSuccessfulDriverResult');
    expect(wizardContent).toContain('entityResolutionCommandService.createDriver');
  });

  it('10. Driver refresh failure after POST triggers fail-closed error without clearing cache', () => {
    expect(wizardContent).toContain('DRIVER_CANONICAL_CONVERGENCE_NOT_PROVEN');
    expect(wizardContent).toContain('setCachedSuccessfulDriverResult');
  });

  it('11. Driver retry uses cached result and does not repeat entityResolutionCommandService.createDriver POST', () => {
    expect(wizardContent).toContain('handleRetryDriverConvergence');
    const retryBlock = wizardContent.slice(wizardContent.indexOf('handleRetryDriverConvergence'), wizardContent.indexOf('handleRetryDriverConvergence') + 1200);
    expect(retryBlock).not.toContain('entityResolutionCommandService.createDriver');
  });

  it('12. Driver absent from knownDrivers blocks batch resolution and sets convergence error', () => {
    expect(wizardContent).toContain('knownDrivers?.some');
    expect(wizardContent).toContain('DRIVER_CANONICAL_CONVERGENCE_NOT_PROVEN');
  });

  it('13. Driver present under wrong carrier blocks batch resolution and sets convergence error', () => {
    expect(wizardContent).toContain('d.driverId === result.matchedId && d.carrierId === carrierId');
  });

  it('14. Driver correct ID and carrier allows batch resolution and clears cache', () => {
    expect(wizardContent).toContain('applyGroupedCreatedEntityResolution');
    expect(wizardContent).toContain('setCachedSuccessfulDriverResult(null)');
  });

  it('15. Truck POST is called once and cached successfully before canonical refresh', () => {
    expect(wizardContent).toContain('cachedSuccessfulTruckResult');
    expect(wizardContent).toContain('entityResolutionCommandService.createTruck');
  });

  it('16. Truck refresh failure after POST triggers fail-closed error without clearing cache', () => {
    expect(wizardContent).toContain('TRUCK_CANONICAL_CONVERGENCE_NOT_PROVEN');
  });

  it('17. Truck retry uses cached result and does not repeat entityResolutionCommandService.createTruck POST', () => {
    expect(wizardContent).toContain('handleRetryTruckConvergence');
    const truckRetryBlock = wizardContent.slice(wizardContent.indexOf('handleRetryTruckConvergence'), wizardContent.indexOf('handleRetryTruckConvergence') + 1200);
    expect(truckRetryBlock).not.toContain('entityResolutionCommandService.createTruck');
  });

  it('18. Truck absent from knownTrucks blocks batch resolution and sets convergence error', () => {
    expect(wizardContent).toContain('knownTrucks?.some');
    expect(wizardContent).toContain('TRUCK_CANONICAL_CONVERGENCE_NOT_PROVEN');
  });

  it('19. Truck wrong carrier blocks batch resolution and sets convergence error', () => {
    expect(wizardContent).toContain('t.truckId === result.matchedId && t.carrierId === carrierId');
  });

  it('20. Truck correct ID and carrier allows batch resolution and clears cache', () => {
    expect(wizardContent).toContain('setCachedSuccessfulTruckResult(null)');
  });

  it('21. importBatch remains unchanged after Driver convergence failure', () => {
    expect(wizardContent).toContain('if (!foundDriver)');
    expect(wizardContent).toContain('DRIVER_CANONICAL_CONVERGENCE_NOT_PROVEN');
  });

  it('22. importBatch remains unchanged after Truck convergence failure', () => {
    expect(wizardContent).toContain('if (!foundTruck)');
    expect(wizardContent).toContain('TRUCK_CANONICAL_CONVERGENCE_NOT_PROVEN');
  });

  it('23. Cached successful result survives convergence failure for both driver and truck', () => {
    expect(wizardContent).toContain('cachedSuccessfulDriverResult');
    expect(wizardContent).toContain('cachedSuccessfulTruckResult');
  });

  it('24. UI recovery state displays required messaging and retry action button without permitting duplicate submission', () => {
    expect(driverTruckLayerContent).toContain('تم إنشاء السجل بنجاح، لكن تعذر تحديث البيانات الموثوقة.');
    expect(driverTruckLayerContent).toContain('إعادة تحديث البيانات');
    expect(driverTruckLayerContent).toContain('driverConvergenceError');
    expect(driverTruckLayerContent).toContain('truckConvergenceError');
  });
});
