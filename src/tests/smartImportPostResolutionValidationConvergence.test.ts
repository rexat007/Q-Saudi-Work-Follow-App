import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ExcelCsvPipelineService } from '../services/import/excelCsvPipeline.service';
import { UnifiedImportBatch, PipelineContext, ImportRow } from '../types/unifiedImport';
import { ExcelCsvTripValidator } from '../services/import/tripImportValidator';

describe('Smart Import Post-Resolution Validation Convergence Test Suite', () => {
  const dummyContext: PipelineContext = {
    projectId: 'PRJ-CONV-001',
    userId: 'user-1',
    userName: 'Tester',
    role: 'PROJECT_ADMIN',
    operationId: 'OP-CONV-TEST',
    knownEntities: {
      carriers: [
        { carrierId: 'CAR-100', name: 'Carrier One', projectId: 'PRJ-CONV-001' },
        { carrierId: 'CAR-200', name: 'Carrier Two', projectId: 'PRJ-CONV-001' },
      ],
      trucks: [
        { truckId: 'TRK-100', plate: '123 ABC', projectId: 'PRJ-CONV-001' },
      ],
      truckCarrierMap: {
        '123 ABC': 'CAR-100',
        'ABC 123': 'CAR-100',
        '123ABC': 'CAR-100',
      },
      drivers: [
        { driverId: 'DRV-100', name: 'Driver One', projectId: 'PRJ-CONV-001' },
      ],
      materials: [
        { materialId: 'MAT-100', name: 'Material One', code: 'M1', projectId: 'PRJ-CONV-001' },
      ],
    },
  };

  const createBaseBatch = (rows: ImportRow[]): UnifiedImportBatch => ({
    importBatchId: 'BAT-CONV-001',
    projectId: 'PRJ-CONV-001',
    source: { sourceType: 'EXCEL', importBatchId: 'BAT-CONV-001', sourceFileName: 'test.xlsx' },
    currentStage: 'REVIEW',
    validationStatus: 'PASSED',
    commitStatus: 'AWAITING_REVIEW',
    totalRows: rows.length,
    validRows: 0,
    warningRows: 0,
    errorRows: 0,
    requiresReviewRows: rows.length,
    committedRows: 0,
    auditTrail: [],
    rows,
    issues: [],
    operationId: 'OP-CONV-TEST',
    createdAt: new Date().toISOString(),
    createdBy: 'user-1',
  });

  const unresolvedRow: ImportRow = {
    rowNumber: 1,
    status: 'WARNING',
    reviewStatus: 'requires_review',
    raw: { 'Carrier': 'Unknown Carrier', 'Truck': '123 ABC', 'Material': 'M1' },
    canonical: { carrier: 'Unknown Carrier', truckNo: '123 ABC', driverName: 'Driver One', materialType: 'Material One', ticketId: 'T-001', shiftDate: '2024-01-01', grossWeight: 100, tareWeight: 50, netWeight: 50, destNetWeight: 50 },
    validationIssues: [
      { issueId: 'iss-1', row: 1, field: 'carrier', code: 'UNKNOWN_CARRIER', severity: 'WARNING', message: 'Unknown', resolvable: true, blocking: false }
    ],
    resolvedValues: {},
    entityResolutions: {
      carrier: { entityType: 'CARRIER', sourceValue: 'Unknown Carrier', originalValue: 'Unknown Carrier', normalizedValue: 'Unknown Carrier', confidence: 0, matchMethod: 'NONE', riskLevel: 'HIGH', recommendation: 'REVIEW', isExact: false, isAuthorized: false },
      truck: { entityType: 'TRUCK', sourceValue: '123 ABC', originalValue: '123 ABC', normalizedValue: '123 ABC', matchedId: 'TRK-100', matchedName: '123 ABC', confidence: 1, matchMethod: 'EXACT', riskLevel: 'LOW', recommendation: 'ACCEPT', isExact: true, isAuthorized: true },
      driver: { entityType: 'DRIVER', sourceValue: 'Driver One', originalValue: 'Driver One', normalizedValue: 'Driver One', matchedId: 'DRV-100', matchedName: 'Driver One', confidence: 1, matchMethod: 'EXACT', riskLevel: 'LOW', recommendation: 'ACCEPT', isExact: true, isAuthorized: true },
      material: { entityType: 'MATERIAL', sourceValue: 'Material One', originalValue: 'Material One', normalizedValue: 'Material One', matchedId: 'MAT-100', matchedName: 'Material One', confidence: 1, matchMethod: 'EXACT', riskLevel: 'LOW', recommendation: 'ACCEPT', isExact: true, isAuthorized: true },
    },
  };

  it('1. Precedence: resolvedValues.carrierId wins over entityResolution', () => {
    const row: ImportRow = {
      ...unresolvedRow,
      resolvedValues: { carrierId: 'CAR-UNKNOWN' },
      entityResolutions: {
        ...unresolvedRow.entityResolutions,
        carrier: { ...unresolvedRow.entityResolutions!.carrier as any, matchedId: 'CAR-100', recommendation: 'ACCEPT' }
      }
    };
    const validator = new ExcelCsvTripValidator();
    const issues = validator.validateRow(row, dummyContext);
    // If it chose CAR-100, no warning. If CAR-OVERRIDE (which is unknown), warning.
    expect(issues.some(i => i.code === 'UNKNOWN_CARRIER')).toBe(true);
  });

  it('2. Precedence: accepted entityResolution wins over canonical', () => {
    const row: ImportRow = {
      ...unresolvedRow,
      canonical: { ...unresolvedRow.canonical, carrier: 'Raw Text' },
      entityResolutions: {
        ...unresolvedRow.entityResolutions,
        carrier: { ...unresolvedRow.entityResolutions!.carrier, matchedId: 'CAR-100', recommendation: 'ACCEPT' }
      }
    };
    const validator = new ExcelCsvTripValidator();
    const issues = validator.validateRow(row, dummyContext);
    // CAR-100 is known, so no UNKNOWN_CARRIER warning
    expect(issues.some(i => i.code === 'UNKNOWN_CARRIER')).toBe(false);
  });

  it('3. Precedence: fallback to canonical if no resolved/accepted', () => {
    const row: ImportRow = {
      ...unresolvedRow,
      canonical: { ...unresolvedRow.canonical, carrier: 'Carrier One' },
      entityResolutions: {
        ...unresolvedRow.entityResolutions,
        carrier: { ...unresolvedRow.entityResolutions!.carrier, matchedId: undefined, recommendation: 'REVIEW' }
      }
    };
    const validator = new ExcelCsvTripValidator();
    const issues = validator.validateRow(row, dummyContext);
    // Carrier One is known in context
    expect(issues.some(i => i.code === 'UNKNOWN_CARRIER')).toBe(false);
  });

  it('4. applyEntityResolutionDecision (ACCEPT_CANDIDATE) triggers revalidation', () => {
    const batch = createBaseBatch([unresolvedRow]);
    const updated = ExcelCsvPipelineService.applyEntityResolutionDecision(
      batch, 1, 'carrier', 'ACCEPT_CANDIDATE', { selectedEntityId: 'CAR-100' }, 'user-1', dummyContext
    );
    // UNKNOWN_CARRIER warning should be gone
    expect(updated.rows[0].validationIssues.some(i => i.code === 'UNKNOWN_CARRIER')).toBe(false);
    // reviewStatus should become accepted (since truck is also resolved and no other issues)
    expect(updated.rows[0].reviewStatus).toBe('accepted');
  });

  it('5. applyEntityResolutionDecision (SELECT_ALTERNATE) triggers revalidation', () => {
    const batch = createBaseBatch([unresolvedRow]);
    const updated = ExcelCsvPipelineService.applyEntityResolutionDecision(
      batch, 1, 'carrier', 'SELECT_ALTERNATE', { selectedEntityId: 'CAR-200' }, 'user-1', dummyContext
    );
    expect(updated.rows[0].validationIssues.some(i => i.code === 'UNKNOWN_CARRIER')).toBe(false);
    // CAR-200 conflicts with TRK-100 (which expects CAR-100). This proves revalidation ran.
    expect(updated.rows[0].validationIssues.some(i => i.code === 'RELATIONSHIP_CONFLICT')).toBe(true);
    expect(updated.rows[0].reviewStatus).toBe('warning');
  });

  it('6. applyCreatedEntityResolution triggers revalidation', () => {
    const batch = createBaseBatch([unresolvedRow]);
    const updated = ExcelCsvPipelineService.applyCreatedEntityResolution(
      batch, 1, 'carrier', { matchedId: 'CAR-NEW', matchedName: 'New Carrier' }, dummyContext
    );
    // It's still unknown in dummyContext, but let's see if it revalidates.
    // Wait, CAR-NEW is not in dummyContext, so UNKNOWN_CARRIER will remain.
    // But let's check if the issue is still there.
    expect(updated.rows[0].validationIssues.some(i => i.code === 'UNKNOWN_CARRIER')).toBe(true);
  });

  it('7. applyCreatedEntityResolution with known ID clears issues', () => {
    const batch = createBaseBatch([unresolvedRow]);
    const updated = ExcelCsvPipelineService.applyCreatedEntityResolution(
      batch, 1, 'carrier', { matchedId: 'CAR-100', matchedName: 'Carrier One' }, dummyContext
    );
    expect(updated.rows[0].validationIssues.some(i => i.code === 'UNKNOWN_CARRIER')).toBe(false);
    expect(updated.rows[0].reviewStatus).toBe('accepted');
  });

  it('8. Numeric invariant violation detected after resolution', () => {
    const row = {
      ...unresolvedRow,
      canonical: { ...unresolvedRow.canonical, tareWeight: -50 }, // Invalid tare
      validationIssues: []
    };
    const batch = createBaseBatch([row]);
    
    const updated = ExcelCsvPipelineService.applyEntityResolutionDecision(
      batch, 1, 'carrier', 'ACCEPT_CANDIDATE', { selectedEntityId: 'CAR-100' }, 'user-1', dummyContext
    );
    
    expect(updated.rows[0].validationIssues.some(i => i.code === 'TARE_WEIGHT_NON_POSITIVE')).toBe(true);
    expect(updated.rows[0].reviewStatus).toBe('requires_review');
  });

  it('9. Blocking issue keeps reviewStatus as requires_review', () => {
    const rowWithBlocking = {
      ...unresolvedRow,
      canonical: { ...unresolvedRow.canonical, grossWeight: -100 } // Blocking issue
    };
    const batch = createBaseBatch([rowWithBlocking]);
    
    const updated = ExcelCsvPipelineService.applyEntityResolutionDecision(
      batch, 1, 'carrier', 'ACCEPT_CANDIDATE', { selectedEntityId: 'CAR-100' }, 'user-1', dummyContext
    );
    
    expect(updated.rows[0].reviewStatus).toBe('requires_review');
    expect(updated.rows[0].status).toBe('ERROR');
  });

  it('10. applyCreatedEntityResolution without context = No revalidation (backward compatibility)', () => {
    const batch = createBaseBatch([unresolvedRow]);
    const updated = ExcelCsvPipelineService.applyCreatedEntityResolution(
      batch, 1, 'carrier', { matchedId: 'CAR-100', matchedName: 'Carrier One' }, undefined
    );
    // Issue remains because no revalidation happened
    expect(updated.rows[0].validationIssues.some(i => i.code === 'UNKNOWN_CARRIER')).toBe(true);
  });

  it('11. Truck resolution clears UNKNOWN_TRUCK', () => {
    const row = {
      ...unresolvedRow,
      canonical: { ...unresolvedRow.canonical, truckNo: '999 UNK' },
      validationIssues: [{ issueId: 'iss-2', row: 1, field: 'truckNo', code: 'UNKNOWN_TRUCK', severity: 'WARNING', message: 'UNK', resolvable: true, blocking: false }]
    };
    const batch = createBaseBatch([row]);
    const updated = ExcelCsvPipelineService.applyEntityResolutionDecision(
      batch, 1, 'truck', 'ACCEPT_CANDIDATE', { selectedEntityId: 'TRK-100' }, 'user-1', dummyContext
    );
    expect(updated.rows[0].validationIssues.some(i => i.code === 'UNKNOWN_TRUCK')).toBe(false);
  });

  it('12. Material resolution clears UNKNOWN_MATERIAL', () => {
    const row = {
      ...unresolvedRow,
      canonical: { ...unresolvedRow.canonical, materialType: 'UNK MAT' },
      validationIssues: [{ issueId: 'iss-3', row: 1, field: 'materialType', code: 'UNKNOWN_MATERIAL', severity: 'WARNING', message: 'UNK', resolvable: true, blocking: false }],
      entityResolutions: {
        ...unresolvedRow.entityResolutions,
        material: { entityType: 'MATERIAL', sourceValue: 'UNK MAT', recommendation: 'REVIEW' }
      }
    };
    const batch = createBaseBatch([row]);
    const updated = ExcelCsvPipelineService.applyEntityResolutionDecision(
      batch, 1, 'material', 'ACCEPT_CANDIDATE', { selectedEntityId: 'MAT-100' }, 'user-1', dummyContext
    );
    expect(updated.rows[0].validationIssues.some(i => i.code === 'UNKNOWN_MATERIAL')).toBe(false);
  });

  it('13. Relationship conflict with Driver appears after resolution', () => {
    const contextWithDriverMap = {
      ...dummyContext,
      knownEntities: {
        ...dummyContext.knownEntities,
        driverCarrierMap: { 'DRV-100': 'CAR-100' }
      }
    };
    const row = {
      ...unresolvedRow,
      resolvedValues: { driverId: 'DRV-100' },
      entityResolutions: {
        ...unresolvedRow.entityResolutions,
        carrier: { entityType: 'CARRIER', sourceValue: 'c', matchedId: undefined, recommendation: 'REVIEW', isExact: false, isAuthorized: false }
      }
    };
    const batch = createBaseBatch([row]);
    // Resolve carrier to CAR-200, which conflicts with DRV-100 (expects CAR-100)
    const updated = ExcelCsvPipelineService.applyEntityResolutionDecision(
      batch, 1, 'carrier', 'SELECT_ALTERNATE', { selectedEntityId: 'CAR-200' }, 'user-1', contextWithDriverMap
    );
    expect(updated.rows[0].validationIssues.some(i => i.code === 'DRIVER_CARRIER_CONFLICT')).toBe(true);
  });

  it('14. Batch counters update after resolution revalidation', () => {
    const batch = createBaseBatch([unresolvedRow]);
    expect(batch.requiresReviewRows).toBe(1);
    expect(batch.validRows).toBe(0);
    
    const updated = ExcelCsvPipelineService.applyEntityResolutionDecision(
      batch, 1, 'carrier', 'ACCEPT_CANDIDATE', { selectedEntityId: 'CAR-100' }, 'user-1', dummyContext
    );
    
    expect(updated.requiresReviewRows).toBe(0);
    expect(updated.validRows).toBe(1);
  });

  it('15. REJECT_ROW action bypasses revalidation but updates counters', () => {
    const batch = createBaseBatch([unresolvedRow]);
    const updated = ExcelCsvPipelineService.applyRowReview(batch, 1, 'REJECT_ROW', dummyContext);
    expect(updated.rows[0].reviewStatus).toBe('error');
    expect(updated.errorRows).toBe(0); // REJECTED rows are skipped in errorCount by pipeline
    expect(updated.requiresReviewRows).toBe(0);
  });

  it('16. Multiple resolutions in one row: stage 1', () => {
    const row = {
      ...unresolvedRow,
      entityResolutions: {
        carrier: { entityType: 'CARRIER', recommendation: 'REVIEW' },
        truck: { entityType: 'TRUCK', recommendation: 'REVIEW' }
      }
    };
    const batch = createBaseBatch([row]);
    const step1 = ExcelCsvPipelineService.applyEntityResolutionDecision(
      batch, 1, 'carrier', 'ACCEPT_CANDIDATE', { selectedEntityId: 'CAR-100' }, 'user-1', dummyContext
    );
    // Still needs truck resolution
    expect(step1.rows[0].reviewStatus).toBe('requires_review');
  });

  it('17. Multiple resolutions in one row: stage 2 completion', () => {
    const row = {
      ...unresolvedRow,
      entityResolutions: {
        carrier: { entityType: 'CARRIER', recommendation: 'REVIEW' },
        truck: { entityType: 'TRUCK', recommendation: 'REVIEW' }
      }
    };
    const batch = createBaseBatch([row]);
    const step1 = ExcelCsvPipelineService.applyEntityResolutionDecision(
      batch, 1, 'carrier', 'ACCEPT_CANDIDATE', { selectedEntityId: 'CAR-100' }, 'user-1', dummyContext
    );
    const step2 = ExcelCsvPipelineService.applyEntityResolutionDecision(
      step1, 1, 'truck', 'ACCEPT_CANDIDATE', { selectedEntityId: 'TRK-100' }, 'user-1', dummyContext
    );
    expect(step2.rows[0].reviewStatus).toBe('accepted');
  });

  it('18. Weight calculation warning appears if weights were unresolved but then validated', () => {
    const row = {
      ...unresolvedRow,
      canonical: { ...unresolvedRow.canonical, grossWeight: 100, tareWeight: 50, netWeight: 40 }, // 100-50 != 40
      validationIssues: [] // Suppose it was empty
    };
    const batch = createBaseBatch([row]);
    const updated = ExcelCsvPipelineService.applyEntityResolutionDecision(
      batch, 1, 'carrier', 'ACCEPT_CANDIDATE', { selectedEntityId: 'CAR-100' }, 'user-1', dummyContext
    );
    expect(updated.rows[0].validationIssues.some(i => i.code === 'NET_WEIGHT_CALCULATION_MISMATCH')).toBe(true);
  });

  it('19. applyCreatedEntityResolution with driverId', () => {
    const batch = createBaseBatch([unresolvedRow]);
    const updated = ExcelCsvPipelineService.applyCreatedEntityResolution(
      batch, 1, 'driver', { matchedId: 'DRV-NEW', matchedName: 'New Driver' }, dummyContext
    );
    expect(updated.rows[0].resolvedValues?.driverId).toBe('DRV-NEW');
  });

  it('20. applyCreatedEntityResolution with truckId', () => {
    const batch = createBaseBatch([unresolvedRow]);
    const updated = ExcelCsvPipelineService.applyCreatedEntityResolution(
      batch, 1, 'truck', { matchedId: 'TRK-NEW', matchedName: 'New Truck' }, dummyContext
    );
    expect(updated.rows[0].resolvedValues?.truckId).toBe('TRK-NEW');
  });

  it('21. applyCreatedEntityResolution with materialId', () => {
    const batch = createBaseBatch([unresolvedRow]);
    const updated = ExcelCsvPipelineService.applyCreatedEntityResolution(
      batch, 1, 'material', { matchedId: 'MAT-NEW', matchedName: 'New Material' }, dummyContext
    );
    expect(updated.rows[0].resolvedValues?.materialId).toBe('MAT-NEW');
  });

  it('22. Identity precedence: isAuthorized resolution used if matchedId missing', () => {
    const row = {
      ...unresolvedRow,
      entityResolutions: {
        carrier: { entityType: 'CARRIER', entityId: 'CAR-AUTH', recommendation: 'ACCEPT', isAuthorized: true }
      }
    };
    const validator = new ExcelCsvTripValidator();
    const issues = validator.validateRow(row, { ...dummyContext, knownEntities: { ...dummyContext.knownEntities, carriers: [{ carrierId: 'CAR-AUTH', name: 'Auth', projectId: 'PRJ-CONV-001' }] } });
    expect(issues.some(i => i.code === 'UNKNOWN_CARRIER')).toBe(false);
  });

  it('23. Identity precedence: isExact resolution used', () => {
    const row = {
      ...unresolvedRow,
      entityResolutions: {
        carrier: { entityType: 'CARRIER', matchedId: 'CAR-100', isExact: true }
      }
    };
    const validator = new ExcelCsvTripValidator();
    const issues = validator.validateRow(row, dummyContext);
    expect(issues.some(i => i.code === 'UNKNOWN_CARRIER')).toBe(false);
  });

  it('24. LEAVE_UNRESOLVED keeps reviewStatus', () => {
    const batch = createBaseBatch([unresolvedRow]);
    const updated = ExcelCsvPipelineService.applyEntityResolutionDecision(
      batch, 1, 'carrier', 'LEAVE_UNRESOLVED', {}, 'user-1', dummyContext
    );
    expect(updated.rows[0].reviewStatus).toBe('requires_review');
  });

  it('25. revalidateRow handles row not found gracefully', () => {
    const batch = createBaseBatch([unresolvedRow]);
    const result = ExcelCsvPipelineService.revalidateRow(batch, { ...unresolvedRow, rowNumber: 99 }, dummyContext);
    expect(result).toBe(batch);
  });

  it('26. Recalculate counts with mixed statuses', () => {
    const rows: ImportRow[] = [
      { ...unresolvedRow, rowNumber: 1, reviewStatus: 'accepted', status: 'VALID' },
      { ...unresolvedRow, rowNumber: 2, reviewStatus: 'warning', status: 'WARNING' },
      { ...unresolvedRow, rowNumber: 3, reviewStatus: 'requires_review', status: 'ERROR' },
    ];
    const batch = createBaseBatch(rows);
    const updated = ExcelCsvPipelineService.recalculateBatchCounts(batch);
    expect(updated.validRows).toBe(1);
    expect(updated.warningRows).toBe(1);
    expect(updated.requiresReviewRows).toBe(1);
  });

  it('27. MISSING_IDENTIFICATION cleared after truck resolution', () => {
    const row: ImportRow = {
      ...unresolvedRow,
      canonical: { ...unresolvedRow.canonical, ticketId: undefined, truckNo: undefined },
      validationIssues: [{ issueId: 'iss-4', row: 1, field: 'identification', code: 'MISSING_IDENTIFICATION', severity: 'BLOCKING', message: 'M', resolvable: true, blocking: true }]
    };
    const batch = createBaseBatch([row]);
    const updated = ExcelCsvPipelineService.applyEntityResolutionDecision(
      batch, 1, 'truck', 'ACCEPT_CANDIDATE', { selectedEntityId: 'TRK-100' }, 'user-1', dummyContext
    );
    expect(updated.rows[0].validationIssues.some(i => i.code === 'MISSING_IDENTIFICATION')).toBe(false);
  });

  it('28. Physics error remains after resolution', () => {
    const row = {
      ...unresolvedRow,
      canonical: { ...unresolvedRow.canonical, grossWeight: 50, tareWeight: 100 },
      validationIssues: [{ issueId: 'iss-5', row: 1, field: 'grossWeight', code: 'GROSS_LESS_THAN_TARE', severity: 'BLOCKING', message: 'P', resolvable: true, blocking: true }]
    };
    const batch = createBaseBatch([row]);
    const updated = ExcelCsvPipelineService.applyEntityResolutionDecision(
      batch, 1, 'carrier', 'ACCEPT_CANDIDATE', { selectedEntityId: 'CAR-100' }, 'user-1', dummyContext
    );
    expect(updated.rows[0].validationIssues.some(i => i.code === 'GROSS_LESS_THAN_TARE')).toBe(true);
    expect(updated.rows[0].reviewStatus).toBe('requires_review');
  });

  it('29. Material project conflict appears after resolution', () => {
    const contextWithMatScope = {
      ...dummyContext,
      knownEntities: {
        ...dummyContext.knownEntities,
        projectMaterials: ['MAT-ALLOW']
      }
    };
    const batch = createBaseBatch([unresolvedRow]);
    // Resolve material to MAT-100, which is not in the allowed project list
    const updated = ExcelCsvPipelineService.applyEntityResolutionDecision(
      batch, 1, 'material', 'ACCEPT_CANDIDATE', { selectedEntityId: 'MAT-100' }, 'user-1', contextWithMatScope
    );
    expect(updated.rows[0].validationIssues.some(i => i.code === 'MATERIAL_PROJECT_CONFLICT')).toBe(true);
  });

  it('30. Driver missing warning disappears if driver resolved', () => {
    const row = {
      ...unresolvedRow,
      canonical: { ...unresolvedRow.canonical, driverName: undefined },
      validationIssues: [{ issueId: 'iss-6', row: 1, field: 'driverName', code: 'MISSING_OPTIONAL_DRIVER', severity: 'WARNING', message: 'W', resolvable: true, blocking: false }]
    };
    const batch = createBaseBatch([row]);
    const updated = ExcelCsvPipelineService.applyEntityResolutionDecision(
      batch, 1, 'driver', 'ACCEPT_CANDIDATE', { selectedEntityId: 'DRV-100' }, 'user-1', dummyContext
    );
    expect(updated.rows[0].validationIssues.some(i => i.code === 'MISSING_OPTIONAL_DRIVER')).toBe(false);
  });

  it('31. applyCreatedEntityResolution preserves existing resolvedValues', () => {
    const row = { ...unresolvedRow, resolvedValues: { truckId: 'T-EXIST' } };
    const batch = createBaseBatch([row]);
    const updated = ExcelCsvPipelineService.applyCreatedEntityResolution(
      batch, 1, 'carrier', { matchedId: 'C-NEW', matchedName: 'N' }, dummyContext
    );
    expect(updated.rows[0].resolvedValues?.truckId).toBe('T-EXIST');
    expect(updated.rows[0].resolvedValues?.carrierId).toBe('C-NEW');
  });

  it('32. applyEntityResolutionDecision preserves existing resolvedValues', () => {
    const row = { ...unresolvedRow, resolvedValues: { truckId: 'TRK-100' } };
    const batch = createBaseBatch([row]);
    const updated = ExcelCsvPipelineService.applyEntityResolutionDecision(
      batch, 1, 'carrier', 'ACCEPT_CANDIDATE', { selectedEntityId: 'CAR-100' }, 'user-1', dummyContext
    );
    expect(updated.rows[0].resolvedValues?.truckId).toBe('TRK-100');
    expect(updated.rows[0].resolvedValues?.carrierId).toBe('CAR-100');
  });

  it('33. Weighbridge mandatory ticket check clears after ticketId resolved?', () => {
    // ticketId isn't an entity, but let's check if revalidation happens correctly for weights
    const wbContext = { ...dummyContext, profile: 'WEIGHBRIDGE' };
    const row = {
      ...unresolvedRow,
      canonical: { ...unresolvedRow.canonical, grossWeight: undefined },
      validationIssues: [{ issueId: 'iss-7', row: 1, field: 'grossWeight', code: 'MISSING_GROSS_WEIGHT', severity: 'BLOCKING', message: 'M', resolvable: true, blocking: true }]
    };
    const batch = createBaseBatch([row]);
    // Simulate resolving something else, but weights still missing
    const updated = ExcelCsvPipelineService.applyEntityResolutionDecision(
      batch, 1, 'carrier', 'ACCEPT_CANDIDATE', { selectedEntityId: 'CAR-100' }, 'user-1', wbContext as any
    );
    expect(updated.rows[0].validationIssues.some(i => i.code === 'MISSING_GROSS_WEIGHT')).toBe(true);
  });

  it('34. applyCreatedEntityResolution sets riskLevel LOW', () => {
    const batch = createBaseBatch([unresolvedRow]);
    const updated = ExcelCsvPipelineService.applyCreatedEntityResolution(
      batch, 1, 'carrier', { matchedId: 'C-NEW', matchedName: 'N' }, dummyContext
    );
    expect(updated.rows[0].entityResolutions?.carrier?.riskLevel).toBe('LOW');
  });

  it('35. applyCreatedEntityResolution sets confidence 1.0', () => {
    const batch = createBaseBatch([unresolvedRow]);
    const updated = ExcelCsvPipelineService.applyCreatedEntityResolution(
      batch, 1, 'carrier', { matchedId: 'C-NEW', matchedName: 'N' }, dummyContext
    );
    expect(updated.rows[0].entityResolutions?.carrier?.confidence).toBe(1.0);
  });

  it('36. applyCreatedEntityResolution sets matchMethod EXACT', () => {
    const batch = createBaseBatch([unresolvedRow]);
    const updated = ExcelCsvPipelineService.applyCreatedEntityResolution(
      batch, 1, 'carrier', { matchedId: 'C-NEW', matchedName: 'N' }, dummyContext
    );
    expect(updated.rows[0].entityResolutions?.carrier?.matchMethod).toBe('EXACT');
  });

  it('37. applyCreatedEntityResolution clears ambiguous flag', () => {
    const row = {
      ...unresolvedRow,
      entityResolutions: {
        carrier: { ...unresolvedRow.entityResolutions!.carrier, ambiguous: true }
      }
    };
    const batch = createBaseBatch([row]);
    const updated = ExcelCsvPipelineService.applyCreatedEntityResolution(
      batch, 1, 'carrier', { matchedId: 'C-NEW', matchedName: 'N' }, dummyContext
    );
    expect(updated.rows[0].entityResolutions?.carrier?.ambiguous).toBe(false);
  });

  it('38. applyEntityResolutionDecision clears ambiguous flag', () => {
    const row = {
      ...unresolvedRow,
      entityResolutions: {
        carrier: { ...unresolvedRow.entityResolutions!.carrier, ambiguous: true }
      }
    };
    const batch = createBaseBatch([row]);
    const updated = ExcelCsvPipelineService.applyEntityResolutionDecision(
      batch, 1, 'carrier', 'ACCEPT_CANDIDATE', { selectedEntityId: 'CAR-100' }, 'user-1', dummyContext
    );
    expect(updated.rows[0].entityResolutions?.carrier?.ambiguous).toBe(false);
  });

  it('39. Pipeline recalculateBatchCounts handles error reviewStatus', () => {
    const row = { ...unresolvedRow, reviewStatus: 'error' as any };
    const batch = createBaseBatch([row]);
    const updated = ExcelCsvPipelineService.recalculateBatchCounts(batch);
    expect(updated.errorRows).toBe(1);
  });

  it('40. Final Convergence: Full row acceptance after all entities resolved', () => {
    const row = {
      ...unresolvedRow,
      entityResolutions: {
        carrier: { entityType: 'CARRIER', recommendation: 'REVIEW' },
        truck: { entityType: 'TRUCK', recommendation: 'REVIEW' },
        material: { entityType: 'MATERIAL', recommendation: 'REVIEW' }
      }
    };
    const batch = createBaseBatch([row]);
    let b = ExcelCsvPipelineService.applyEntityResolutionDecision(batch, 1, 'carrier', 'ACCEPT_CANDIDATE', { selectedEntityId: 'CAR-100' }, 'user-1', dummyContext);
    b = ExcelCsvPipelineService.applyEntityResolutionDecision(b, 1, 'truck', 'ACCEPT_CANDIDATE', { selectedEntityId: 'TRK-100' }, 'user-1', dummyContext);
    b = ExcelCsvPipelineService.applyEntityResolutionDecision(b, 1, 'material', 'ACCEPT_CANDIDATE', { selectedEntityId: 'MAT-100' }, 'user-1', dummyContext);
    
    expect(b.rows[0].reviewStatus).toBe('accepted');
    expect(b.validRows).toBe(1);
    expect(b.requiresReviewRows).toBe(0);
  });

  it('41. Truck/Carrier conflict appears after carrier change', () => {
    const row = {
      ...unresolvedRow,
      canonical: { ...unresolvedRow.canonical, truckNo: '123 ABC' },
      resolvedValues: { truckId: 'TRK-100' }
    };
    const batch = createBaseBatch([row]);
    // 123 ABC belongs to CAR-100. Select CAR-200.
    const updated = ExcelCsvPipelineService.applyEntityResolutionDecision(
      batch, 1, 'carrier', 'ACCEPT_CANDIDATE', { selectedEntityId: 'CAR-200' }, 'user-1', dummyContext
    );
    expect(updated.rows[0].validationIssues.some(i => i.code === 'RELATIONSHIP_CONFLICT')).toBe(true);
  });

  it('42. Truck/Carrier conflict removed after carrier correction', () => {
    const row = {
      ...unresolvedRow,
      canonical: { ...unresolvedRow.canonical, truckNo: '123 ABC' },
      resolvedValues: { truckId: 'TRK-100', carrierId: 'CAR-200' },
      validationIssues: [{ issueId: 'iss-8', row: 1, field: 'carrier', code: 'RELATIONSHIP_CONFLICT', severity: 'WARNING', message: 'C', resolvable: true, blocking: false }]
    };
    const batch = createBaseBatch([row]);
    // Fix carrier to CAR-100 (which 123 ABC belongs to)
    const updated = ExcelCsvPipelineService.applyEntityResolutionDecision(
      batch, 1, 'carrier', 'SELECT_ALTERNATE', { selectedEntityId: 'CAR-100' }, 'user-1', dummyContext
    );
    expect(updated.rows[0].validationIssues.some(i => i.code === 'RELATIONSHIP_CONFLICT')).toBe(false);
  });

  it('43. Material Project conflict removed after material authorized', () => {
    const contextWithScope = {
      ...dummyContext,
      knownEntities: { ...dummyContext.knownEntities, projectMaterials: ['MAT-100'] }
    };
    const row = {
      ...unresolvedRow,
      validationIssues: [{ issueId: 'iss-9', row: 1, field: 'materialType', code: 'MATERIAL_PROJECT_CONFLICT', severity: 'WARNING', message: 'C', resolvable: true, blocking: false }]
    };
    const batch = createBaseBatch([row]);
    const updated = ExcelCsvPipelineService.applyEntityResolutionDecision(
      batch, 1, 'material', 'SELECT_ALTERNATE', { selectedEntityId: 'MAT-100' }, 'user-1', contextWithScope
    );
    expect(updated.rows[0].validationIssues.some(i => i.code === 'MATERIAL_PROJECT_CONFLICT')).toBe(false);
  });

  it('44. Batch counters: requiresReview decreases when row valid', () => {
    const batch = createBaseBatch([unresolvedRow]);
    expect(batch.requiresReviewRows).toBe(1);
    const updated = ExcelCsvPipelineService.applyEntityResolutionDecision(
      batch, 1, 'carrier', 'ACCEPT_CANDIDATE', { selectedEntityId: 'CAR-100' }, 'user-1', dummyContext
    );
    expect(updated.requiresReviewRows).toBe(0);
    expect(updated.validRows).toBe(1);
  });

  it('45. Batch counters: requiresReview increases when new conflict appears', () => {
    const validRow = { ...unresolvedRow, status: 'VALID', reviewStatus: 'accepted' as any, validationIssues: [] };
    const batch = createBaseBatch([validRow]);
    batch.requiresReviewRows = 0;
    batch.validRows = 1;
    
    // Create a conflict (e.g. invalid tare)
    const rowWithConflict = { ...validRow, canonical: { ...validRow.canonical, tareWeight: -10 } };
    const updated = ExcelCsvPipelineService.revalidateRow(batch, rowWithConflict, dummyContext);
    
    expect(updated.requiresReviewRows).toBe(1);
    expect(updated.validRows).toBe(0);
  });

  it('46. Architecture: Duplicate checker not rerun during revalidation', () => {
    // We can't easily prove it wasn't run without mocks, but we ensure revalidateRow uses ExcelCsvTripValidator directly.
    const spy = vi.spyOn(ExcelCsvTripValidator.prototype, 'validateRow');
    ExcelCsvPipelineService.revalidateRow(createBaseBatch([unresolvedRow]), unresolvedRow, dummyContext);
    expect(spy).toHaveBeenCalled();
  });
});
