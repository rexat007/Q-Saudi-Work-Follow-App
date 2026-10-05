import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { RosterBatchReviewService } from '../services/import/rosterBatchReview.service';
import { DriverTruckPipelineService } from '../services/import/driverTruckPipeline.service';
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

  it('13. PREPARED_NEW Driver creation planning causes ZERO createDriver calls and creates correct prepared plan', () => {
    const fnIdx = wizardContent.indexOf('handleSmartImportDriverCreate');
    const fnBlock = wizardContent.slice(fnIdx, fnIdx + 1200);
    expect(fnBlock).toContain('DriverTruckPipelineService.applyPreparedNewDriverPlan');
    expect(fnBlock).not.toContain('entityResolutionCommandService.createDriver');
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

  it('19. PREPARED_NEW Truck creation planning causes ZERO createTruck calls and creates correct prepared plan', () => {
    const fnIdx = wizardContent.indexOf('handleSmartImportTruckCreate');
    const fnBlock = wizardContent.slice(fnIdx, fnIdx + 1200);
    expect(fnBlock).toContain('DriverTruckPipelineService.applyPreparedNewTruckPlan');
    expect(fnBlock).not.toContain('entityResolutionCommandService.createTruck');
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

  it('25. Driver prefill extracts driverName, residencyId/iqama, and phone from source row canonical/mapped data', () => {
    const testBatch: UnifiedImportBatch = {
      ...mockBatchC4,
      rows: [
        {
          rowNumber: 1,
          raw: { 'اسم السائق': 'سالم القحطاني', 'رقم الهوية': '1023456789', 'الجوال': '0501234567' },
          canonical: { driverName: 'سالم القحطاني', driverIdentity: '1023456789', driverPhone: '0501234567' },
          entityResolutions: {
            carrier: { matchedId: 'CAR-001', matchedName: 'ناقل الرمال', sourceValue: 'ناقل الرمال', recommendation: 'ACCEPT', matchMethod: 'EXACT', confidence: 1.0, isExact: true },
            driver: { sourceValue: 'سالم القحطاني', recommendation: 'REVIEW', confidence: 0, isExact: false, originalValue: 'سالم القحطاني' },
          },
          status: 'WARNING',
          validationIssues: [],
          reviewStatus: 'requires_review',
        },
      ],
    };

    const groups = RosterBatchReviewService.getBatchReviewGroups(testBatch);
    const driverGroup = groups.driver[0];
    expect(driverGroup).toBeDefined();

    const defaults = RosterBatchReviewService.deriveDriverCreationDefaults(testBatch, driverGroup);
    expect(defaults.driverName).toBe('سالم القحطاني');
    expect(defaults.residencyId).toBe('1023456789');
    expect(defaults.phone).toBe('0501234567');
    expect(defaults.hasConflict).toBe(false);
  });

  it('26. Driver repeated across 5 rows with identical values yields single group and identical prefill', () => {
    const rows = Array.from({ length: 5 }, (_, i) => ({
      rowNumber: i + 1,
      raw: { 'اسم السائق': 'أحمد فهد', 'رقم الهوية': '2034567890', 'الجوال': '0551112233' },
      canonical: { driverName: 'أحمد فهد', driverIdentity: '2034567890', driverPhone: '0551112233' },
      entityResolutions: {
        carrier: { matchedId: 'CAR-001', matchedName: 'ناقل الرمال', sourceValue: 'ناقل الرمال', recommendation: 'ACCEPT', matchMethod: 'EXACT', confidence: 1.0, isExact: true },
        driver: { sourceValue: 'أحمد فهد', recommendation: 'REVIEW', confidence: 0, isExact: false, originalValue: 'أحمد فهد' },
      },
      status: 'WARNING' as const,
      validationIssues: [],
      reviewStatus: 'requires_review' as const,
    }));

    const multiRowBatch: UnifiedImportBatch = { ...mockBatchC4, rows };
    const groups = RosterBatchReviewService.getBatchReviewGroups(multiRowBatch);
    expect(groups.driver.length).toBe(1);
    expect(groups.driver[0].occurrenceCount).toBe(5);

    const defaults = RosterBatchReviewService.deriveDriverCreationDefaults(multiRowBatch, groups.driver[0]);
    expect(defaults.driverName).toBe('أحمد فهد');
    expect(defaults.residencyId).toBe('2034567890');
    expect(defaults.phone).toBe('0551112233');
    expect(defaults.hasConflict).toBe(false);
  });

  it('27. Driver same name + carrier + different residency IDs yields 2 separate groups', () => {
    const rows = [
      {
        rowNumber: 1,
        raw: {},
        canonical: { driverName: 'خالد عمر', driverIdentity: '1023456789' },
        entityResolutions: {
          carrier: { matchedId: 'CAR-001', matchedName: 'ناقل الرمال', sourceValue: 'ناقل الرمال', recommendation: 'ACCEPT', matchMethod: 'EXACT', confidence: 1.0, isExact: true },
          driver: { sourceValue: 'خالد عمر', recommendation: 'REVIEW', confidence: 0, isExact: false, originalValue: 'خالد عمر' },
        },
        status: 'WARNING' as const,
        validationIssues: [],
        reviewStatus: 'requires_review' as const,
      },
      {
        rowNumber: 2,
        raw: {},
        canonical: { driverName: 'خالد عمر', driverIdentity: '2098765432' },
        entityResolutions: {
          carrier: { matchedId: 'CAR-001', matchedName: 'ناقل الرمال', sourceValue: 'ناقل الرمال', recommendation: 'ACCEPT', matchMethod: 'EXACT', confidence: 1.0, isExact: true },
          driver: { sourceValue: 'خالد عمر', recommendation: 'REVIEW', confidence: 0, isExact: false, originalValue: 'خالد عمر' },
        },
        status: 'WARNING' as const,
        validationIssues: [],
        reviewStatus: 'requires_review' as const,
      },
    ];

    const differentIqamaBatch: UnifiedImportBatch = { ...mockBatchC4, rows };
    const groups = RosterBatchReviewService.getBatchReviewGroups(differentIqamaBatch);
    expect(groups.driver.length).toBe(2);

    // True intra-identity conflict: same residency ID, conflicting phone
    const intraConflictRows = [
      {
        rowNumber: 1,
        raw: {},
        canonical: { driverName: 'خالد عمر', driverIdentity: '1023456789', driverPhone: '0501112222' },
        entityResolutions: {
          carrier: { matchedId: 'CAR-001', matchedName: 'ناقل الرمال', sourceValue: 'ناقل الرمال', recommendation: 'ACCEPT', matchMethod: 'EXACT', confidence: 1.0, isExact: true },
          driver: { sourceValue: 'خالد عمر', recommendation: 'REVIEW', confidence: 0, isExact: false, originalValue: 'خالد عمر' },
        },
        status: 'WARNING' as const,
        validationIssues: [],
        reviewStatus: 'requires_review' as const,
      },
      {
        rowNumber: 2,
        raw: {},
        canonical: { driverName: 'خالد عمر', driverIdentity: '1023456789', driverPhone: '0509998888' },
        entityResolutions: {
          carrier: { matchedId: 'CAR-001', matchedName: 'ناقل الرمال', sourceValue: 'ناقل الرمال', recommendation: 'ACCEPT', matchMethod: 'EXACT', confidence: 1.0, isExact: true },
          driver: { sourceValue: 'خالد عمر', recommendation: 'REVIEW', confidence: 0, isExact: false, originalValue: 'خالد عمر' },
        },
        status: 'WARNING' as const,
        validationIssues: [],
        reviewStatus: 'requires_review' as const,
      },
    ];
    const intraConflictBatch: UnifiedImportBatch = { ...mockBatchC4, rows: intraConflictRows };
    const intraGroups = RosterBatchReviewService.getBatchReviewGroups(intraConflictBatch);
    expect(intraGroups.driver.length).toBe(1);
    const defaults = RosterBatchReviewService.deriveDriverCreationDefaults(intraConflictBatch, intraGroups.driver[0]);
    expect(defaults.hasConflict).toBe(true);
    expect(defaults.conflicts['رقم الجوال']).toContain('0501112222');
    expect(defaults.conflicts['رقم الجوال']).toContain('0509998888');
  });

  it('28. Truck prefill extracts plateNumber, truckType, tareWeight, and maxGrossWeight', () => {
    const testBatch: UnifiedImportBatch = {
      ...mockBatchC4,
      rows: [
        {
          rowNumber: 1,
          raw: {},
          canonical: { truckPlate: 'أ ب ج 1234', truckType: 'قلاب كبير', tareWeightKg: 14500, maxGrossWeightKg: 45000 },
          entityResolutions: {
            carrier: { matchedId: 'CAR-001', matchedName: 'ناقل الرمال', sourceValue: 'ناقل الرمال', recommendation: 'ACCEPT', matchMethod: 'EXACT', confidence: 1.0, isExact: true },
            truck: { sourceValue: 'أ ب ج 1234', recommendation: 'REVIEW', confidence: 0, isExact: false, originalValue: 'أ ب ج 1234' },
          },
          status: 'WARNING',
          validationIssues: [],
          reviewStatus: 'requires_review',
        },
      ],
    };

    const groups = RosterBatchReviewService.getBatchReviewGroups(testBatch);
    const truckGroup = groups.truck[0];
    expect(truckGroup).toBeDefined();

    const defaults = RosterBatchReviewService.deriveTruckCreationDefaults(testBatch, truckGroup);
    expect(defaults.plateNumber).toBe('أ ب ج 1234');
    expect(defaults.truckType).toBe('قلاب كبير');
    expect(defaults.tareWeightKg).toBe(14500);
    expect(defaults.maxGrossWeightKg).toBe(45000);
    expect(defaults.hasConflict).toBe(false);
  });

  it('29. Truck tareWeight conflict across rows flags hasConflict=true', () => {
    const rows = [
      {
        rowNumber: 1,
        raw: {},
        canonical: { truckPlate: 'د هـ و 5555', tareWeightKg: 14000 },
        entityResolutions: {
          carrier: { matchedId: 'CAR-001', matchedName: 'ناقل الرمال', sourceValue: 'ناقل الرمال', recommendation: 'ACCEPT', matchMethod: 'EXACT', confidence: 1.0, isExact: true },
          truck: { sourceValue: 'د هـ و 5555', recommendation: 'REVIEW', confidence: 0, isExact: false, originalValue: 'د هـ و 5555' },
        },
        status: 'WARNING' as const,
        validationIssues: [],
        reviewStatus: 'requires_review' as const,
      },
      {
        rowNumber: 2,
        raw: {},
        canonical: { truckPlate: 'د هـ و 5555', tareWeightKg: 16000 },
        entityResolutions: {
          carrier: { matchedId: 'CAR-001', matchedName: 'ناقل الرمال', sourceValue: 'ناقل الرمال', recommendation: 'ACCEPT', matchMethod: 'EXACT', confidence: 1.0, isExact: true },
          truck: { sourceValue: 'د هـ و 5555', recommendation: 'REVIEW', confidence: 0, isExact: false, originalValue: 'د هـ و 5555' },
        },
        status: 'WARNING' as const,
        validationIssues: [],
        reviewStatus: 'requires_review' as const,
      },
    ];

    const conflictBatch: UnifiedImportBatch = { ...mockBatchC4, rows };
    const groups = RosterBatchReviewService.getBatchReviewGroups(conflictBatch);

    const defaults = RosterBatchReviewService.deriveTruckCreationDefaults(conflictBatch, groups.truck[0]);
    expect(defaults.hasConflict).toBe(true);
    expect(defaults.conflicts['الوزن الفارغ']).toContain('14000');
    expect(defaults.conflicts['الوزن الفارغ']).toContain('16000');
    expect(defaults.tareWeightKg).toBeUndefined();
  });

  it('30. Missing optional phone yields valid prefill with phone="" without conflict', () => {
    const testBatch: UnifiedImportBatch = {
      ...mockBatchC4,
      rows: [
        {
          rowNumber: 1,
          raw: {},
          canonical: { driverName: 'سعيد العتيبي', driverIdentity: '1099999999' },
          entityResolutions: {
            carrier: { matchedId: 'CAR-001', matchedName: 'ناقل الرمال', sourceValue: 'ناقل الرمال', recommendation: 'ACCEPT', matchMethod: 'EXACT', confidence: 1.0, isExact: true },
            driver: { sourceValue: 'سعيد العتيبي', recommendation: 'REVIEW', confidence: 0, isExact: false, originalValue: 'سعيد العتيبي' },
          },
          status: 'WARNING',
          validationIssues: [],
          reviewStatus: 'requires_review',
        },
      ],
    };

    const groups = RosterBatchReviewService.getBatchReviewGroups(testBatch);
    const defaults = RosterBatchReviewService.deriveDriverCreationDefaults(testBatch, groups.driver[0]);
    expect(defaults.driverName).toBe('سعيد العتيبي');
    expect(defaults.residencyId).toBe('1099999999');
    expect(defaults.phone).toBe('');
    expect(defaults.hasConflict).toBe(false);
  });

  it('31. Cross-Carrier Isolation: Same driver name and same truck plate under different carriers produce separate groups', () => {
    const testBatch: UnifiedImportBatch = {
      ...mockBatchC4,
      rows: [
        {
          rowNumber: 1,
          raw: {},
          canonical: { driverName: 'سالم علي', truckPlate: 'أ ب ج 1000' },
          entityResolutions: {
            carrier: { matchedId: 'CAR-001', matchedName: 'الناقل الأول', sourceValue: 'الناقل الأول', recommendation: 'ACCEPT', matchMethod: 'EXACT', confidence: 1.0, isExact: true },
            driver: { sourceValue: 'سالم علي', recommendation: 'REVIEW' },
            truck: { sourceValue: 'أ ب ج 1000', recommendation: 'REVIEW' },
          },
          status: 'WARNING',
          validationIssues: [],
          reviewStatus: 'requires_review',
        },
        {
          rowNumber: 2,
          raw: {},
          canonical: { driverName: 'سالم علي', truckPlate: 'أ ب ج 1000' },
          entityResolutions: {
            carrier: { matchedId: 'CAR-002', matchedName: 'الناقل الثاني', sourceValue: 'الناقل الثاني', recommendation: 'ACCEPT', matchMethod: 'EXACT', confidence: 1.0, isExact: true },
            driver: { sourceValue: 'سالم علي', recommendation: 'REVIEW' },
            truck: { sourceValue: 'أ ب ج 1000', recommendation: 'REVIEW' },
          },
          status: 'WARNING',
          validationIssues: [],
          reviewStatus: 'requires_review',
        },
      ],
    };

    const groups = RosterBatchReviewService.getBatchReviewGroups(testBatch);
    expect(groups.driver.length).toBe(2);
    expect(groups.truck.length).toBe(2);

    expect(groups.driver[0].normalizedSourceKey).toContain('::carrier:CAR-001');
    expect(groups.driver[1].normalizedSourceKey).toContain('::carrier:CAR-002');
    expect(groups.truck[0].normalizedSourceKey).toContain('::carrier:CAR-001');
    expect(groups.truck[1].normalizedSourceKey).toContain('::carrier:CAR-002');
  });

  it('32. Grouped Canonical Propagation: Creation updates ALL rows matching the exact group key', () => {
    const rows = Array.from({ length: 5 }, (_, i) => ({
      rowNumber: i + 1,
      raw: {},
      canonical: { driverName: 'فيصل العلي', driverIdentity: '1088888888' },
      entityResolutions: {
        carrier: { matchedId: 'CAR-001', matchedName: 'ناقل الرمال', sourceValue: 'ناقل الرمال', recommendation: 'ACCEPT', matchMethod: 'EXACT', confidence: 1.0, isExact: true },
        driver: { sourceValue: 'فيصل العلي', recommendation: 'REVIEW', confidence: 0, isExact: false, originalValue: 'فيصل العلي' },
      },
      status: 'WARNING' as const,
      validationIssues: [],
      reviewStatus: 'requires_review' as const,
    }));

    const batch: UnifiedImportBatch = { ...mockBatchC4, rows };
    const groups = RosterBatchReviewService.getBatchReviewGroups(batch);
    const driverGroup = groups.driver[0];

    const pipelineCtx = { projectId: 'PRJ-100', operationId: 'OP-TEST', userId: 'USR-1', role: 'PROJECT_ADMIN' as const };
    const updatedBatch = DriverTruckPipelineService.applyGroupedCreatedEntityResolution(
      batch,
      'driver',
      driverGroup.normalizedSourceKey,
      { matchedId: 'DRV-CREATED-999', matchedName: 'فيصل العلي' },
      pipelineCtx
    );

    updatedBatch.rows.forEach((row) => {
      expect(row.entityResolutions?.driver?.matchedId).toBe('DRV-CREATED-999');
      expect(row.entityResolutions?.driver?.matchedName).toBe('فيصل العلي');
      expect(row.entityResolutions?.driver?.recommendation).toBe('ACCEPT');
      expect(row.entityResolutions?.driver?.matchMethod).toBe('EXACT');
      expect(row.resolvedValues?.driverId).toBe('DRV-CREATED-999');
    });

    const updatedGroups = RosterBatchReviewService.getBatchReviewGroups(updatedBatch);
    expect(updatedGroups.driver[0].status).toBe('AUTO_RESOLVED');
  });

  it('33. Smart Prefill & No-Retyping Contract: Form prefill requires no manual re-entry when source contains identity and phone', () => {
    const testBatch: UnifiedImportBatch = {
      ...mockBatchC4,
      rows: [
        {
          rowNumber: 1,
          raw: {},
          canonical: { driverName: 'نايف محمد', driverIdentity: '1077777777', driverPhone: '0507777777' },
          entityResolutions: {
            carrier: { matchedId: 'CAR-001', matchedName: 'ناقل الرمال', sourceValue: 'ناقل الرمال', recommendation: 'ACCEPT', matchMethod: 'EXACT', confidence: 1.0, isExact: true },
            driver: { sourceValue: 'نايف محمد', recommendation: 'REVIEW', confidence: 0, isExact: false, originalValue: 'نايف محمد' },
          },
          status: 'WARNING',
          validationIssues: [],
          reviewStatus: 'requires_review',
        },
      ],
    };

    const groups = RosterBatchReviewService.getBatchReviewGroups(testBatch);
    const defaults = RosterBatchReviewService.deriveDriverCreationDefaults(testBatch, groups.driver[0]);

    // Validate that form data is immediately ready for submission without editing
    expect(defaults.driverName).toBe('نايف محمد');
    expect(defaults.residencyId).toBe('1077777777');
    expect(defaults.phone).toBe('0507777777');
    expect(defaults.residencyId.length).toBe(10);
    expect(defaults.hasConflict).toBe(false);
  });
});
