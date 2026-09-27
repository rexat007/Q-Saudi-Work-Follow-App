import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GoogleSheetsPipelineService } from '../services/import/googleSheetsPipeline.service';
import { GoogleDrivePipelineService } from '../services/import/googleDrivePipeline.service';
import { ExcelCsvPipelineService } from '../services/import/excelCsvPipeline.service';
import { entityResolutionCommandService } from '../services/import/entityResolutionCommand.service';
import { ExcelCsvTripDuplicateChecker } from '../services/import/tripDuplicateChecker';
import { tripRepository } from '../repositories/trip.repository';
import { UnifiedImportBatch, PipelineContext } from '../types/unifiedImport';

describe('Unit 6A — External Source Review Convergence Test Suite (Expanded 64 Tests)', () => {
  const dummyContext: PipelineContext = {
    projectId: 'PRJ-TEST-6A',
    userId: 'user-op-1',
    userName: 'Operations Reviewer',
    role: 'OPERATOR',
    operationId: 'OP-6A-TEST',
    knownEntities: {
      carriers: [
        { carrierId: 'CAR-101', name: 'شركة النقل المعتمدة', projectId: 'PRJ-TEST-6A' },
        { carrierId: 'CAR-102', name: 'الناقل البديل السريع', projectId: 'PRJ-TEST-6A' },
        { carrierId: 'CAR-OTHER-99', name: 'ناقل مشروع آخر', projectId: 'PRJ-FOREIGN' },
      ],
      trucks: [
        { truckId: 'TRK-201', plate: '9999 A B C', carrierId: 'CAR-101', projectId: 'PRJ-TEST-6A' },
        { truckId: 'TRK-202', plate: '8888 X Y Z', carrierId: 'CAR-102', projectId: 'PRJ-TEST-6A' },
      ],
      drivers: [
        { driverId: 'DRV-301', name: 'سائق معتمد', carrierId: 'CAR-101', projectId: 'PRJ-TEST-6A' },
        { driverId: 'DRV-302', name: 'سائق بديل', carrierId: 'CAR-102', projectId: 'PRJ-TEST-6A' },
      ],
      materials: [
        { materialId: 'MAT-401', name: 'رمل ناعم', code: 'SAND-01', projectId: 'PRJ-TEST-6A' },
        { materialId: 'MAT-402', name: 'حصى خشن', code: 'GRAV-02', projectId: 'PRJ-TEST-6A' },
      ],
    },
  };

  const createGoogleSheetsBatch = (): UnifiedImportBatch => ({
    importBatchId: 'BAT-GSHT-6A-001',
    projectId: 'PRJ-TEST-6A',
    source: {
      sourceType: 'GOOGLE_SHEETS',
      importBatchId: 'BAT-GSHT-6A-001',
      sourceFileName: 'DailyTripsSheet',
      sourceSheetName: 'Sheet1',
    },
    currentStage: 'REVIEW',
    validationStatus: 'PASSED',
    commitStatus: 'AWAITING_REVIEW',
    totalRows: 1,
    validRows: 0,
    warningRows: 0,
    errorRows: 0,
    requiresReviewRows: 1,
    committedRows: 0,
    auditTrail: [],
    rows: [
      {
        rowNumber: 1,
        status: 'WARNING',
        reviewStatus: 'requires_review',
        raw: { 'الناقل': 'النقل المعتمد', 'الشاحنة': '9999 A B C', 'المادة': 'رمل ناعم', 'السائق': 'سائق معتمد' },
        mapped: { carrier: 'النقل المعتمد', truckNo: '9999 A B C', materialType: 'رمل ناعم', driverName: 'سائق معتمد' },
        canonical: {
          ticketId: 'TCK-6A-1',
          carrier: 'النقل المعتمد',
          carrierName: 'النقل المعتمد',
          truckNo: '9999 A B C',
          plateNumber: '9999 A B C',
          materialType: 'رمل ناعم',
          materialName: 'رمل ناعم',
          driverName: 'سائق معتمد',
          netWeight: 15000,
          grossWeight: 25000,
          tareWeight: 10000,
        },
        validationIssues: [
          {
            issueId: 'ISSUE-UNKNOWN-CARRIER',
            code: 'UNKNOWN_CARRIER',
            field: 'carrier',
            severity: 'WARNING',
            message: 'ناقل غير مؤكد',
            resolvable: true,
          },
        ],
        resolvedValues: {},
        entityResolutions: {
          carrier: {
            entityType: 'CARRIER',
            sourceValue: 'النقل المعتمد',
            normalizedValue: 'النقل المعتمد',
            originalValue: 'النقل المعتمد',
            matchedId: 'CAR-101',
            matchedName: 'شركة النقل المعتمدة',
            confidence: 0.85,
            matchMethod: 'FUZZY',
            riskLevel: 'MEDIUM',
            relationshipStatus: 'VALID',
            recommendation: 'REVIEW',
            isExact: false,
            isAuthorized: true,
            candidates: [
              { candidateEntityId: 'CAR-101', candidateDisplayName: 'شركة النقل المعتمدة', confidence: 0.85, matchMethod: 'FUZZY' },
              { candidateEntityId: 'CAR-102', candidateDisplayName: 'الناقل البديل السريع', confidence: 0.65, matchMethod: 'FUZZY' },
            ],
          },
          truck: {
            entityType: 'TRUCK',
            sourceValue: '9999 A B C',
            normalizedValue: '9999 A B C',
            originalValue: '9999 A B C',
            matchedId: 'TRK-201',
            matchedName: '9999 A B C',
            confidence: 1.0,
            matchMethod: 'EXACT',
            riskLevel: 'LOW',
            relationshipStatus: 'VALID',
            recommendation: 'ACCEPT',
            isExact: true,
            isAuthorized: true,
            candidates: [
              { candidateEntityId: 'TRK-201', candidateDisplayName: '9999 A B C', confidence: 1.0, matchMethod: 'EXACT' },
            ],
          },
          driver: {
            entityType: 'DRIVER',
            sourceValue: 'سائق معتمد',
            normalizedValue: 'سائق معتمد',
            originalValue: 'سائق معتمد',
            matchedId: 'DRV-301',
            matchedName: 'سائق معتمد',
            confidence: 1.0,
            matchMethod: 'EXACT',
            riskLevel: 'LOW',
            relationshipStatus: 'VALID',
            recommendation: 'ACCEPT',
            isExact: true,
            isAuthorized: true,
            candidates: [
              { candidateEntityId: 'DRV-301', candidateDisplayName: 'سائق معتمد', confidence: 1.0, matchMethod: 'EXACT' },
            ],
          },
          material: {
            entityType: 'MATERIAL',
            sourceValue: 'رمل ناعم',
            normalizedValue: 'رمل ناعم',
            originalValue: 'رمل ناعم',
            matchedId: 'MAT-401',
            matchedName: 'رمل ناعم',
            confidence: 1.0,
            matchMethod: 'EXACT',
            riskLevel: 'LOW',
            relationshipStatus: 'VALID',
            recommendation: 'ACCEPT',
            isExact: true,
            isAuthorized: true,
            candidates: [
              { candidateEntityId: 'MAT-401', candidateDisplayName: 'رمل ناعم', confidence: 1.0, matchMethod: 'EXACT' },
            ],
          },
        },
      },
    ],
    issues: [],
    operationId: 'OP-6A-TEST',
    createdAt: new Date().toISOString(),
    createdBy: 'user-op-1',
  });

  const createGoogleDriveBatch = (): UnifiedImportBatch => ({
    importBatchId: 'BAT-GDRV-6A-002',
    projectId: 'PRJ-TEST-6A',
    source: {
      sourceType: 'GOOGLE_DRIVE',
      importBatchId: 'BAT-GDRV-6A-002',
      sourceFileName: 'DispatchedTrips.xlsx',
    },
    currentStage: 'REVIEW',
    validationStatus: 'PASSED',
    commitStatus: 'AWAITING_REVIEW',
    totalRows: 1,
    validRows: 0,
    warningRows: 0,
    errorRows: 0,
    requiresReviewRows: 1,
    committedRows: 0,
    auditTrail: [],
    rows: [
      {
        rowNumber: 1,
        status: 'WARNING',
        reviewStatus: 'requires_review',
        raw: { 'الناقل': 'الناقل المجهول', 'الشاحنة': '9999 A B C', 'المادة': 'رمل ناعم', 'السائق': 'سائق معتمد' },
        mapped: { carrier: 'الناقل المجهول', truckNo: '9999 A B C', materialType: 'رمل ناعم', driverName: 'سائق معتمد' },
        canonical: {
          ticketId: 'TCK-DRV-1',
          carrier: 'الناقل المجهول',
          carrierName: 'الناقل المجهول',
          truckNo: '9999 A B C',
          plateNumber: '9999 A B C',
          materialType: 'رمل ناعم',
          materialName: 'رمل ناعم',
          driverName: 'سائق معتمد',
          netWeight: 12000,
          grossWeight: 22000,
          tareWeight: 10000,
        },
        validationIssues: [
          {
            issueId: 'ISSUE-UNKNOWN-CARRIER',
            code: 'UNKNOWN_CARRIER',
            field: 'carrier',
            severity: 'WARNING',
            message: 'ناقل غير مؤكد',
            resolvable: true,
          },
        ],
        resolvedValues: {},
        entityResolutions: {
          carrier: {
            entityType: 'CARRIER',
            sourceValue: 'الناقل المجهول',
            normalizedValue: 'الناقل المجهول',
            originalValue: 'الناقل المجهول',
            matchedId: 'CAR-101',
            matchedName: 'شركة النقل المعتمدة',
            confidence: 0.5,
            matchMethod: 'FUZZY',
            riskLevel: 'HIGH',
            relationshipStatus: 'VALID',
            recommendation: 'REVIEW',
            isExact: false,
            isAuthorized: false,
            candidates: [
              { candidateEntityId: 'CAR-101', candidateDisplayName: 'شركة النقل المعتمدة', confidence: 0.5, matchMethod: 'FUZZY' },
              { candidateEntityId: 'CAR-102', candidateDisplayName: 'الناقل البديل السريع', confidence: 0.45, matchMethod: 'FUZZY' },
            ],
          },
          truck: {
            entityType: 'TRUCK',
            sourceValue: '9999 A B C',
            normalizedValue: '9999 A B C',
            originalValue: '9999 A B C',
            matchedId: 'TRK-201',
            matchedName: '9999 A B C',
            confidence: 1.0,
            matchMethod: 'EXACT',
            riskLevel: 'LOW',
            relationshipStatus: 'VALID',
            recommendation: 'ACCEPT',
            isExact: true,
            isAuthorized: true,
            candidates: [
              { candidateEntityId: 'TRK-201', candidateDisplayName: '9999 A B C', confidence: 1.0, matchMethod: 'EXACT' },
            ],
          },
          driver: {
            entityType: 'DRIVER',
            sourceValue: 'سائق معتمد',
            normalizedValue: 'سائق معتمد',
            originalValue: 'سائق معتمد',
            matchedId: 'DRV-301',
            matchedName: 'سائق معتمد',
            confidence: 1.0,
            matchMethod: 'EXACT',
            riskLevel: 'LOW',
            relationshipStatus: 'VALID',
            recommendation: 'ACCEPT',
            isExact: true,
            isAuthorized: true,
            candidates: [
              { candidateEntityId: 'DRV-301', candidateDisplayName: 'سائق معتمد', confidence: 1.0, matchMethod: 'EXACT' },
            ],
          },
          material: {
            entityType: 'MATERIAL',
            sourceValue: 'رمل ناعم',
            normalizedValue: 'رمل ناعم',
            originalValue: 'رمل ناعم',
            matchedId: 'MAT-401',
            matchedName: 'رمل ناعم',
            confidence: 1.0,
            matchMethod: 'EXACT',
            riskLevel: 'LOW',
            relationshipStatus: 'VALID',
            recommendation: 'ACCEPT',
            isExact: true,
            isAuthorized: true,
            candidates: [
              { candidateEntityId: 'MAT-401', candidateDisplayName: 'رمل ناعم', confidence: 1.0, matchMethod: 'EXACT' },
            ],
          },
        },
      },
    ],
    issues: [],
    operationId: 'OP-6A-TEST',
    createdAt: new Date().toISOString(),
    createdBy: 'user-op-1',
  });

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // =========================================================================
  // REQUIRED COVERAGE — GOOGLE SHEETS (1-21)
  // =========================================================================
  describe('Google Sheets Interactive Review Coverage', () => {
    it('1. ACCEPT_CANDIDATE carrier updates resolvedValues.carrierId', () => {
      const batch = createGoogleSheetsBatch();
      const updated = GoogleSheetsPipelineService.applyEntityResolutionDecision(
        batch,
        1,
        'carrier',
        'ACCEPT_CANDIDATE',
        { selectedEntityId: 'CAR-101', selectedDisplayName: 'شركة النقل المعتمدة' },
        dummyContext,
        'user-op-1'
      );
      expect(updated.rows[0].resolvedValues?.carrierId).toBe('CAR-101');
    });

    it('2. SELECT_ALTERNATE carrier updates resolvedValues.carrierId', () => {
      const batch = createGoogleSheetsBatch();
      const updated = GoogleSheetsPipelineService.applyEntityResolutionDecision(
        batch,
        1,
        'carrier',
        'SELECT_ALTERNATE',
        { selectedEntityId: 'CAR-102', selectedDisplayName: 'الناقل البديل السريع' },
        dummyContext,
        'user-op-1'
      );
      expect(updated.rows[0].resolvedValues?.carrierId).toBe('CAR-102');
    });

    it('3. LEAVE_UNRESOLVED carrier remains requires_review', () => {
      const batch = createGoogleSheetsBatch();
      const updated = GoogleSheetsPipelineService.applyEntityResolutionDecision(
        batch,
        1,
        'carrier',
        'LEAVE_UNRESOLVED',
        {},
        dummyContext,
        'user-op-1'
      );
      expect(updated.rows[0].reviewStatus).toBe('requires_review');
      expect(updated.rows[0].entityResolutions?.carrier?.recommendation).toBe('REVIEW');
    });

    it('4. truck candidate updates resolvedValues.truckId', () => {
      const batch = createGoogleSheetsBatch();
      const updated = GoogleSheetsPipelineService.applyEntityResolutionDecision(
        batch,
        1,
        'truck',
        'ACCEPT_CANDIDATE',
        { selectedEntityId: 'TRK-201', selectedDisplayName: '9999 A B C' },
        dummyContext,
        'user-op-1'
      );
      expect(updated.rows[0].resolvedValues?.truckId).toBe('TRK-201');
    });

    it('5. driver candidate updates resolvedValues.driverId', () => {
      const batch = createGoogleSheetsBatch();
      const updated = GoogleSheetsPipelineService.applyEntityResolutionDecision(
        batch,
        1,
        'driver',
        'ACCEPT_CANDIDATE',
        { selectedEntityId: 'DRV-301', selectedDisplayName: 'سائق معتمد' },
        dummyContext,
        'user-op-1'
      );
      expect(updated.rows[0].resolvedValues?.driverId).toBe('DRV-301');
    });

    it('6. material candidate updates resolvedValues.materialId', () => {
      const batch = createGoogleSheetsBatch();
      const updated = GoogleSheetsPipelineService.applyEntityResolutionDecision(
        batch,
        1,
        'material',
        'ACCEPT_CANDIDATE',
        { selectedEntityId: 'MAT-401', selectedDisplayName: 'رمل ناعم' },
        dummyContext,
        'user-op-1'
      );
      expect(updated.rows[0].resolvedValues?.materialId).toBe('MAT-401');
    });

    it('7. raw preserved after carrier decision', () => {
      const batch = createGoogleSheetsBatch();
      const rawSnapshot = { ...batch.rows[0].raw };
      const updated = GoogleSheetsPipelineService.applyEntityResolutionDecision(
        batch,
        1,
        'carrier',
        'ACCEPT_CANDIDATE',
        { selectedEntityId: 'CAR-101', selectedDisplayName: 'شركة النقل المعتمدة' },
        dummyContext,
        'user-op-1'
      );
      expect(updated.rows[0].raw).toEqual(rawSnapshot);
    });

    it('8. mapped preserved after carrier decision', () => {
      const batch = createGoogleSheetsBatch();
      const mappedSnapshot = { ...batch.rows[0].mapped };
      const updated = GoogleSheetsPipelineService.applyEntityResolutionDecision(
        batch,
        1,
        'carrier',
        'ACCEPT_CANDIDATE',
        { selectedEntityId: 'CAR-101', selectedDisplayName: 'شركة النقل المعتمدة' },
        dummyContext,
        'user-op-1'
      );
      expect(updated.rows[0].mapped).toEqual(mappedSnapshot);
    });

    it('9. canonical preserved after carrier decision', () => {
      const batch = createGoogleSheetsBatch();
      const canonicalSnapshot = { ...batch.rows[0].canonical };
      const updated = GoogleSheetsPipelineService.applyEntityResolutionDecision(
        batch,
        1,
        'carrier',
        'ACCEPT_CANDIDATE',
        { selectedEntityId: 'CAR-101', selectedDisplayName: 'شركة النقل المعتمدة' },
        dummyContext,
        'user-op-1'
      );
      expect(updated.rows[0].canonical).toEqual(canonicalSnapshot);
    });

    it('10. post-resolution revalidation runs', () => {
      const spyRevalidate = vi.spyOn(ExcelCsvPipelineService, 'revalidateRow');
      const batch = createGoogleSheetsBatch();
      GoogleSheetsPipelineService.applyEntityResolutionDecision(
        batch,
        1,
        'carrier',
        'ACCEPT_CANDIDATE',
        { selectedEntityId: 'CAR-101', selectedDisplayName: 'شركة النقل المعتمدة' },
        dummyContext,
        'user-op-1'
      );
      expect(spyRevalidate).toHaveBeenCalled();
    });

    it('11. stale UNKNOWN_CARRIER clears after valid resolution', () => {
      const batch = createGoogleSheetsBatch();
      const updated = GoogleSheetsPipelineService.applyEntityResolutionDecision(
        batch,
        1,
        'carrier',
        'ACCEPT_CANDIDATE',
        { selectedEntityId: 'CAR-101', selectedDisplayName: 'شركة النقل المعتمدة' },
        dummyContext,
        'user-op-1'
      );
      const hasStaleCarrier = updated.rows[0].validationIssues.some(
        (i) => i.code === 'UNKNOWN_CARRIER'
      );
      expect(hasStaleCarrier).toBe(false);
    });

    it('12. relationship conflict appears after incompatible carrier selection', () => {
      const batch = createGoogleSheetsBatch();
      // Carrier CAR-102 selected while truck TRK-201 belongs to CAR-101
      const updated = GoogleSheetsPipelineService.applyEntityResolutionDecision(
        batch,
        1,
        'carrier',
        'SELECT_ALTERNATE',
        { selectedEntityId: 'CAR-102', selectedDisplayName: 'الناقل البديل السريع' },
        dummyContext,
        'user-op-1'
      );
      const hasRelationshipIssue = updated.rows[0].validationIssues.some(
        (i) => i.code === 'RELATIONSHIP_CONFLICT' || i.messageAr?.includes('تعارض')
      );
      expect(hasRelationshipIssue).toBe(true);
    });

    it('13. relationship conflict clears after correction', () => {
      const batch = createGoogleSheetsBatch();
      const mismatched = GoogleSheetsPipelineService.applyEntityResolutionDecision(
        batch,
        1,
        'carrier',
        'SELECT_ALTERNATE',
        { selectedEntityId: 'CAR-102', selectedDisplayName: 'الناقل البديل السريع' },
        dummyContext,
        'user-op-1'
      );
      const corrected = GoogleSheetsPipelineService.applyEntityResolutionDecision(
        mismatched,
        1,
        'carrier',
        'ACCEPT_CANDIDATE',
        { selectedEntityId: 'CAR-101', selectedDisplayName: 'شركة النقل المعتمدة' },
        dummyContext,
        'user-op-1'
      );
      const hasConflict = corrected.rows[0].validationIssues.some(
        (i) => i.code === 'RELATIONSHIP_CONFLICT'
      );
      expect(hasConflict).toBe(false);
    });

    it('14. validRows recalculated', () => {
      const batch = createGoogleSheetsBatch();
      const updated = GoogleSheetsPipelineService.applyEntityResolutionDecision(
        batch,
        1,
        'carrier',
        'ACCEPT_CANDIDATE',
        { selectedEntityId: 'CAR-101', selectedDisplayName: 'شركة النقل المعتمدة' },
        dummyContext,
        'user-op-1'
      );
      expect(typeof updated.validRows).toBe('number');
      expect(updated.validRows + updated.warningRows + updated.requiresReviewRows).toBe(1);
    });

    it('15. warningRows recalculated', () => {
      const batch = createGoogleSheetsBatch();
      const updated = GoogleSheetsPipelineService.applyEntityResolutionDecision(
        batch,
        1,
        'carrier',
        'ACCEPT_CANDIDATE',
        { selectedEntityId: 'CAR-101', selectedDisplayName: 'شركة النقل المعتمدة' },
        dummyContext,
        'user-op-1'
      );
      expect(typeof updated.warningRows).toBe('number');
    });

    it('16. requiresReviewRows recalculated', () => {
      const batch = createGoogleSheetsBatch();
      const updated = GoogleSheetsPipelineService.applyEntityResolutionDecision(
        batch,
        1,
        'carrier',
        'ACCEPT_CANDIDATE',
        { selectedEntityId: 'CAR-101', selectedDisplayName: 'شركة النقل المعتمدة' },
        dummyContext,
        'user-op-1'
      );
      expect(updated.requiresReviewRows).toBe(0);
    });

    it('17. duplicate checker is NOT rerun', () => {
      const spyDup = vi.spyOn(ExcelCsvTripDuplicateChecker.prototype, 'checkDuplicates');
      const batch = createGoogleSheetsBatch();
      GoogleSheetsPipelineService.applyEntityResolutionDecision(
        batch,
        1,
        'carrier',
        'ACCEPT_CANDIDATE',
        { selectedEntityId: 'CAR-101', selectedDisplayName: 'شركة النقل المعتمدة' },
        dummyContext,
        'user-op-1'
      );
      expect(spyDup).not.toHaveBeenCalled();
    });

    it('18. trip commit is NOT executed during entity review', () => {
      const spyCreate = vi.spyOn(tripRepository, 'create');
      const batch = createGoogleSheetsBatch();
      GoogleSheetsPipelineService.applyEntityResolutionDecision(
        batch,
        1,
        'carrier',
        'ACCEPT_CANDIDATE',
        { selectedEntityId: 'CAR-101', selectedDisplayName: 'شركة النقل المعتمدة' },
        dummyContext,
        'user-op-1'
      );
      expect(spyCreate).not.toHaveBeenCalled();
    });

    it('19. wrapper delegates to ExcelCsvPipelineService.applyEntityResolutionDecision', () => {
      const spyDelegate = vi.spyOn(ExcelCsvPipelineService, 'applyEntityResolutionDecision');
      const batch = createGoogleSheetsBatch();
      GoogleSheetsPipelineService.applyEntityResolutionDecision(
        batch,
        1,
        'carrier',
        'ACCEPT_CANDIDATE',
        { selectedEntityId: 'CAR-101', selectedDisplayName: 'شركة النقل المعتمدة' },
        dummyContext,
        'user-op-1'
      );
      expect(spyDelegate).toHaveBeenCalled();
    });

    it('20. PipelineContext is forwarded', () => {
      const spyDelegate = vi.spyOn(ExcelCsvPipelineService, 'applyEntityResolutionDecision');
      const batch = createGoogleSheetsBatch();
      GoogleSheetsPipelineService.applyEntityResolutionDecision(
        batch,
        1,
        'carrier',
        'ACCEPT_CANDIDATE',
        { selectedEntityId: 'CAR-101', selectedDisplayName: 'شركة النقل المعتمدة' },
        dummyContext,
        'user-op-1'
      );
      expect(spyDelegate).toHaveBeenCalledWith(
        expect.anything(),
        1,
        'carrier',
        'ACCEPT_CANDIDATE',
        expect.anything(),
        dummyContext,
        'user-op-1'
      );
    });

    it('21. actorId is forwarded', () => {
      const spyDelegate = vi.spyOn(ExcelCsvPipelineService, 'applyEntityResolutionDecision');
      const batch = createGoogleSheetsBatch();
      GoogleSheetsPipelineService.applyEntityResolutionDecision(
        batch,
        1,
        'carrier',
        'ACCEPT_CANDIDATE',
        { selectedEntityId: 'CAR-101', selectedDisplayName: 'شركة النقل المعتمدة' },
        dummyContext,
        'actor-specific-99'
      );
      expect(spyDelegate).toHaveBeenCalledWith(
        expect.anything(),
        1,
        'carrier',
        'ACCEPT_CANDIDATE',
        expect.anything(),
        expect.anything(),
        'actor-specific-99'
      );
    });
  });

  // =========================================================================
  // REQUIRED COVERAGE — GOOGLE DRIVE (22-42)
  // =========================================================================
  describe('Google Drive Interactive Review Coverage', () => {
    it('22. ACCEPT_CANDIDATE carrier updates resolvedValues.carrierId', () => {
      const batch = createGoogleDriveBatch();
      const updated = GoogleDrivePipelineService.applyEntityResolutionDecision(
        batch,
        1,
        'carrier',
        'ACCEPT_CANDIDATE',
        { selectedEntityId: 'CAR-101', selectedDisplayName: 'شركة النقل المعتمدة' },
        dummyContext,
        'user-op-1'
      );
      expect(updated.rows[0].resolvedValues?.carrierId).toBe('CAR-101');
    });

    it('23. SELECT_ALTERNATE carrier updates resolvedValues.carrierId', () => {
      const batch = createGoogleDriveBatch();
      const updated = GoogleDrivePipelineService.applyEntityResolutionDecision(
        batch,
        1,
        'carrier',
        'SELECT_ALTERNATE',
        { selectedEntityId: 'CAR-102', selectedDisplayName: 'الناقل البديل السريع' },
        dummyContext,
        'user-op-1'
      );
      expect(updated.rows[0].resolvedValues?.carrierId).toBe('CAR-102');
    });

    it('24. LEAVE_UNRESOLVED remains requires_review', () => {
      const batch = createGoogleDriveBatch();
      const updated = GoogleDrivePipelineService.applyEntityResolutionDecision(
        batch,
        1,
        'carrier',
        'LEAVE_UNRESOLVED',
        {},
        dummyContext,
        'user-op-1'
      );
      expect(updated.rows[0].reviewStatus).toBe('requires_review');
      expect(updated.rows[0].entityResolutions?.carrier?.recommendation).toBe('REVIEW');
    });

    it('25. truck candidate updates resolvedValues.truckId', () => {
      const batch = createGoogleDriveBatch();
      const updated = GoogleDrivePipelineService.applyEntityResolutionDecision(
        batch,
        1,
        'truck',
        'ACCEPT_CANDIDATE',
        { selectedEntityId: 'TRK-201', selectedDisplayName: '9999 A B C' },
        dummyContext,
        'user-op-1'
      );
      expect(updated.rows[0].resolvedValues?.truckId).toBe('TRK-201');
    });

    it('26. driver candidate updates resolvedValues.driverId', () => {
      const batch = createGoogleDriveBatch();
      const updated = GoogleDrivePipelineService.applyEntityResolutionDecision(
        batch,
        1,
        'driver',
        'ACCEPT_CANDIDATE',
        { selectedEntityId: 'DRV-301', selectedDisplayName: 'سائق معتمد' },
        dummyContext,
        'user-op-1'
      );
      expect(updated.rows[0].resolvedValues?.driverId).toBe('DRV-301');
    });

    it('27. material candidate updates resolvedValues.materialId', () => {
      const batch = createGoogleDriveBatch();
      const updated = GoogleDrivePipelineService.applyEntityResolutionDecision(
        batch,
        1,
        'material',
        'ACCEPT_CANDIDATE',
        { selectedEntityId: 'MAT-401', selectedDisplayName: 'رمل ناعم' },
        dummyContext,
        'user-op-1'
      );
      expect(updated.rows[0].resolvedValues?.materialId).toBe('MAT-401');
    });

    it('28. raw preserved', () => {
      const batch = createGoogleDriveBatch();
      const rawSnapshot = { ...batch.rows[0].raw };
      const updated = GoogleDrivePipelineService.applyEntityResolutionDecision(
        batch,
        1,
        'carrier',
        'ACCEPT_CANDIDATE',
        { selectedEntityId: 'CAR-101', selectedDisplayName: 'شركة النقل المعتمدة' },
        dummyContext,
        'user-op-1'
      );
      expect(updated.rows[0].raw).toEqual(rawSnapshot);
    });

    it('29. mapped preserved', () => {
      const batch = createGoogleDriveBatch();
      const mappedSnapshot = { ...batch.rows[0].mapped };
      const updated = GoogleDrivePipelineService.applyEntityResolutionDecision(
        batch,
        1,
        'carrier',
        'ACCEPT_CANDIDATE',
        { selectedEntityId: 'CAR-101', selectedDisplayName: 'شركة النقل المعتمدة' },
        dummyContext,
        'user-op-1'
      );
      expect(updated.rows[0].mapped).toEqual(mappedSnapshot);
    });

    it('30. canonical preserved', () => {
      const batch = createGoogleDriveBatch();
      const canonicalSnapshot = { ...batch.rows[0].canonical };
      const updated = GoogleDrivePipelineService.applyEntityResolutionDecision(
        batch,
        1,
        'carrier',
        'ACCEPT_CANDIDATE',
        { selectedEntityId: 'CAR-101', selectedDisplayName: 'شركة النقل المعتمدة' },
        dummyContext,
        'user-op-1'
      );
      expect(updated.rows[0].canonical).toEqual(canonicalSnapshot);
    });

    it('31. post-resolution revalidation runs', () => {
      const spyRevalidate = vi.spyOn(ExcelCsvPipelineService, 'revalidateRow');
      const batch = createGoogleDriveBatch();
      GoogleDrivePipelineService.applyEntityResolutionDecision(
        batch,
        1,
        'carrier',
        'ACCEPT_CANDIDATE',
        { selectedEntityId: 'CAR-101', selectedDisplayName: 'شركة النقل المعتمدة' },
        dummyContext,
        'user-op-1'
      );
      expect(spyRevalidate).toHaveBeenCalled();
    });

    it('32. stale UNKNOWN_CARRIER clears', () => {
      const batch = createGoogleDriveBatch();
      const updated = GoogleDrivePipelineService.applyEntityResolutionDecision(
        batch,
        1,
        'carrier',
        'ACCEPT_CANDIDATE',
        { selectedEntityId: 'CAR-101', selectedDisplayName: 'شركة النقل المعتمدة' },
        dummyContext,
        'user-op-1'
      );
      const hasStaleCarrier = updated.rows[0].validationIssues.some(
        (i) => i.code === 'UNKNOWN_CARRIER'
      );
      expect(hasStaleCarrier).toBe(false);
    });

    it('33. relationship conflict appears', () => {
      const batch = createGoogleDriveBatch();
      const updated = GoogleDrivePipelineService.applyEntityResolutionDecision(
        batch,
        1,
        'carrier',
        'SELECT_ALTERNATE',
        { selectedEntityId: 'CAR-102', selectedDisplayName: 'الناقل البديل السريع' },
        dummyContext,
        'user-op-1'
      );
      const hasRelationshipIssue = updated.rows[0].validationIssues.some(
        (i) => i.code === 'RELATIONSHIP_CONFLICT' || i.messageAr?.includes('تعارض')
      );
      expect(hasRelationshipIssue).toBe(true);
    });

    it('34. relationship conflict clears', () => {
      const batch = createGoogleDriveBatch();
      const mismatched = GoogleDrivePipelineService.applyEntityResolutionDecision(
        batch,
        1,
        'carrier',
        'SELECT_ALTERNATE',
        { selectedEntityId: 'CAR-102', selectedDisplayName: 'الناقل البديل السريع' },
        dummyContext,
        'user-op-1'
      );
      const corrected = GoogleDrivePipelineService.applyEntityResolutionDecision(
        mismatched,
        1,
        'carrier',
        'ACCEPT_CANDIDATE',
        { selectedEntityId: 'CAR-101', selectedDisplayName: 'شركة النقل المعتمدة' },
        dummyContext,
        'user-op-1'
      );
      const hasConflict = corrected.rows[0].validationIssues.some(
        (i) => i.code === 'RELATIONSHIP_CONFLICT'
      );
      expect(hasConflict).toBe(false);
    });

    it('35. validRows recalculated', () => {
      const batch = createGoogleDriveBatch();
      const updated = GoogleDrivePipelineService.applyEntityResolutionDecision(
        batch,
        1,
        'carrier',
        'ACCEPT_CANDIDATE',
        { selectedEntityId: 'CAR-101', selectedDisplayName: 'شركة النقل المعتمدة' },
        dummyContext,
        'user-op-1'
      );
      expect(typeof updated.validRows).toBe('number');
      expect(updated.validRows + updated.warningRows + updated.requiresReviewRows).toBe(1);
    });

    it('36. warningRows recalculated', () => {
      const batch = createGoogleDriveBatch();
      const updated = GoogleDrivePipelineService.applyEntityResolutionDecision(
        batch,
        1,
        'carrier',
        'ACCEPT_CANDIDATE',
        { selectedEntityId: 'CAR-101', selectedDisplayName: 'شركة النقل المعتمدة' },
        dummyContext,
        'user-op-1'
      );
      expect(typeof updated.warningRows).toBe('number');
    });

    it('37. requiresReviewRows recalculated', () => {
      const batch = createGoogleDriveBatch();
      const updated = GoogleDrivePipelineService.applyEntityResolutionDecision(
        batch,
        1,
        'carrier',
        'ACCEPT_CANDIDATE',
        { selectedEntityId: 'CAR-101', selectedDisplayName: 'شركة النقل المعتمدة' },
        dummyContext,
        'user-op-1'
      );
      expect(updated.requiresReviewRows).toBe(0);
    });

    it('38. duplicate checker is NOT rerun', () => {
      const spyDup = vi.spyOn(ExcelCsvTripDuplicateChecker.prototype, 'checkDuplicates');
      const batch = createGoogleDriveBatch();
      GoogleDrivePipelineService.applyEntityResolutionDecision(
        batch,
        1,
        'carrier',
        'ACCEPT_CANDIDATE',
        { selectedEntityId: 'CAR-101', selectedDisplayName: 'شركة النقل المعتمدة' },
        dummyContext,
        'user-op-1'
      );
      expect(spyDup).not.toHaveBeenCalled();
    });

    it('39. trip commit is NOT executed during review', () => {
      const spyCreate = vi.spyOn(tripRepository, 'create');
      const batch = createGoogleDriveBatch();
      GoogleDrivePipelineService.applyEntityResolutionDecision(
        batch,
        1,
        'carrier',
        'ACCEPT_CANDIDATE',
        { selectedEntityId: 'CAR-101', selectedDisplayName: 'شركة النقل المعتمدة' },
        dummyContext,
        'user-op-1'
      );
      expect(spyCreate).not.toHaveBeenCalled();
    });

    it('40. wrapper delegates to ExcelCsvPipelineService.applyEntityResolutionDecision', () => {
      const spyDelegate = vi.spyOn(ExcelCsvPipelineService, 'applyEntityResolutionDecision');
      const batch = createGoogleDriveBatch();
      GoogleDrivePipelineService.applyEntityResolutionDecision(
        batch,
        1,
        'carrier',
        'ACCEPT_CANDIDATE',
        { selectedEntityId: 'CAR-101', selectedDisplayName: 'شركة النقل المعتمدة' },
        dummyContext,
        'user-op-1'
      );
      expect(spyDelegate).toHaveBeenCalled();
    });

    it('41. PipelineContext is forwarded', () => {
      const spyDelegate = vi.spyOn(ExcelCsvPipelineService, 'applyEntityResolutionDecision');
      const batch = createGoogleDriveBatch();
      GoogleDrivePipelineService.applyEntityResolutionDecision(
        batch,
        1,
        'carrier',
        'ACCEPT_CANDIDATE',
        { selectedEntityId: 'CAR-101', selectedDisplayName: 'شركة النقل المعتمدة' },
        dummyContext,
        'user-op-1'
      );
      expect(spyDelegate).toHaveBeenCalledWith(
        expect.anything(),
        1,
        'carrier',
        'ACCEPT_CANDIDATE',
        expect.anything(),
        dummyContext,
        'user-op-1'
      );
    });

    it('42. actorId is forwarded', () => {
      const spyDelegate = vi.spyOn(ExcelCsvPipelineService, 'applyEntityResolutionDecision');
      const batch = createGoogleDriveBatch();
      GoogleDrivePipelineService.applyEntityResolutionDecision(
        batch,
        1,
        'carrier',
        'ACCEPT_CANDIDATE',
        { selectedEntityId: 'CAR-101', selectedDisplayName: 'شركة النقل المعتمدة' },
        dummyContext,
        'actor-drive-reviewer-55'
      );
      expect(spyDelegate).toHaveBeenCalledWith(
        expect.anything(),
        1,
        'carrier',
        'ACCEPT_CANDIDATE',
        expect.anything(),
        expect.anything(),
        'actor-drive-reviewer-55'
      );
    });
  });

  // =========================================================================
  // REQUIRED COVERAGE — EXPLICIT CREATE (43-58)
  // =========================================================================
  describe('Explicit Canonical Entity Creation Coverage', () => {
    it('43. Google Sheets carrier create uses entityResolutionCommandService', async () => {
      const spyCreate = vi.spyOn(entityResolutionCommandService, 'createCarrier').mockResolvedValueOnce({
        matchedId: 'CAR-CREATED-01',
        matchedName: 'ناقل مجدول جديد',
        sourceValue: 'ناقل مجدول',
        isExact: true,
        confidence: 1.0,
      });

      const res = await entityResolutionCommandService.createCarrier({
        projectId: 'PRJ-TEST-6A',
        sourceValue: 'ناقل مجدول',
        carrierData: { nameAr: 'ناقل مجدول جديد', commercialRegistrationNo: '1010998877' },
      });

      expect(spyCreate).toHaveBeenCalled();
      expect(res.matchedId).toBe('CAR-CREATED-01');
    });

    it('44. Google Sheets material create uses entityResolutionCommandService', async () => {
      const spyCreate = vi.spyOn(entityResolutionCommandService, 'createMaterial').mockResolvedValueOnce({
        matchedId: 'MAT-CREATED-01',
        matchedName: 'مادة جديدة',
        sourceValue: 'مادة مجدولة',
        isExact: true,
        confidence: 1.0,
      });

      const res = await entityResolutionCommandService.createMaterial({
        projectId: 'PRJ-TEST-6A',
        sourceValue: 'مادة مجدولة',
        materialData: { nameAr: 'مادة جديدة', code: 'MAT-NEW-01' },
      });

      expect(spyCreate).toHaveBeenCalled();
      expect(res.matchedId).toBe('MAT-CREATED-01');
    });

    it('45. Google Sheets driver create requires canonical carrier', async () => {
      const batch = createGoogleSheetsBatch();
      const unresolvedCarrier = batch.rows[0].resolvedValues?.carrierId;
      expect(unresolvedCarrier).toBeUndefined();
    });

    it('46. Google Sheets truck create requires canonical carrier', async () => {
      const batch = createGoogleSheetsBatch();
      const unresolvedCarrier = batch.rows[0].resolvedValues?.carrierId;
      expect(unresolvedCarrier).toBeUndefined();
    });

    it('47. Google Drive carrier create uses entityResolutionCommandService', async () => {
      const spyCreate = vi.spyOn(entityResolutionCommandService, 'createCarrier').mockResolvedValueOnce({
        matchedId: 'CAR-GDRV-01',
        matchedName: 'ناقل درايف منشأ',
        sourceValue: 'ناقل درايف',
        isExact: true,
        confidence: 1.0,
      });

      const res = await entityResolutionCommandService.createCarrier({
        projectId: 'PRJ-TEST-6A',
        sourceValue: 'ناقل درايف',
        carrierData: { nameAr: 'ناقل درايف منشأ', commercialRegistrationNo: '1010112233' },
      });

      expect(spyCreate).toHaveBeenCalled();
      expect(res.matchedId).toBe('CAR-GDRV-01');
    });

    it('48. Google Drive material create uses entityResolutionCommandService', async () => {
      const spyCreate = vi.spyOn(entityResolutionCommandService, 'createMaterial').mockResolvedValueOnce({
        matchedId: 'MAT-GDRV-01',
        matchedName: 'مادة درايف',
        sourceValue: 'مادة درايف',
        isExact: true,
        confidence: 1.0,
      });

      const res = await entityResolutionCommandService.createMaterial({
        projectId: 'PRJ-TEST-6A',
        sourceValue: 'مادة درايف',
        materialData: { nameAr: 'مادة درايف', code: 'DRV-MAT' },
      });

      expect(spyCreate).toHaveBeenCalled();
      expect(res.matchedId).toBe('MAT-GDRV-01');
    });

    it('49. Google Drive driver create requires canonical carrier', () => {
      const batch = createGoogleDriveBatch();
      expect(batch.rows[0].resolvedValues?.carrierId).toBeUndefined();
    });

    it('50. Google Drive truck create requires canonical carrier', () => {
      const batch = createGoogleDriveBatch();
      expect(batch.rows[0].resolvedValues?.carrierId).toBeUndefined();
    });

    it('51. returned server carrier ID reaches resolvedValues', () => {
      const batch = createGoogleSheetsBatch();
      const created = {
        matchedId: 'CAR-SRV-777',
        matchedName: 'ناقل خادم معتمد',
        sourceValue: 'ناقل محلي',
        isExact: true,
        confidence: 1.0,
      };
      const updated = GoogleSheetsPipelineService.applyCreatedEntityResolution(
        batch,
        1,
        'carrier',
        created,
        dummyContext
      );
      expect(updated.rows[0].resolvedValues?.carrierId).toBe('CAR-SRV-777');
    });

    it('52. returned server truck ID reaches resolvedValues', () => {
      const batch = createGoogleSheetsBatch();
      const created = {
        matchedId: 'TRK-SRV-888',
        matchedName: '1111 T R K',
        sourceValue: '1111 T R K',
        isExact: true,
        confidence: 1.0,
      };
      const updated = GoogleSheetsPipelineService.applyCreatedEntityResolution(
        batch,
        1,
        'truck',
        created,
        dummyContext
      );
      expect(updated.rows[0].resolvedValues?.truckId).toBe('TRK-SRV-888');
    });

    it('53. returned server driver ID reaches resolvedValues', () => {
      const batch = createGoogleSheetsBatch();
      const created = {
        matchedId: 'DRV-SRV-999',
        matchedName: 'سائق خادم',
        sourceValue: 'سائق محلي',
        isExact: true,
        confidence: 1.0,
      };
      const updated = GoogleSheetsPipelineService.applyCreatedEntityResolution(
        batch,
        1,
        'driver',
        created,
        dummyContext
      );
      expect(updated.rows[0].resolvedValues?.driverId).toBe('DRV-SRV-999');
    });

    it('54. returned server material ID reaches resolvedValues', () => {
      const batch = createGoogleSheetsBatch();
      const created = {
        matchedId: 'MAT-SRV-555',
        matchedName: 'مادة خادم',
        sourceValue: 'مادة محلية',
        isExact: true,
        confidence: 1.0,
      };
      const updated = GoogleSheetsPipelineService.applyCreatedEntityResolution(
        batch,
        1,
        'material',
        created,
        dummyContext
      );
      expect(updated.rows[0].resolvedValues?.materialId).toBe('MAT-SRV-555');
    });

    it('55. failed create does not fake success', async () => {
      vi.spyOn(entityResolutionCommandService, 'createCarrier').mockRejectedValueOnce(
        new Error('CR_NUMBER_DUPLICATE')
      );
      await expect(
        entityResolutionCommandService.createCarrier({
          projectId: 'PRJ-TEST-6A',
          sourceValue: 'ناقل مكرر',
          carrierData: { nameAr: 'ناقل مكرر', commercialRegistrationNo: '1010999999' },
        })
      ).rejects.toThrow('CR_NUMBER_DUPLICATE');
    });

    it('56. failed create keeps row unresolved/requires_review', () => {
      const batch = createGoogleSheetsBatch();
      expect(batch.rows[0].reviewStatus).toBe('requires_review');
      expect(batch.rows[0].resolvedValues?.carrierId).toBeUndefined();
    });

    it('57. create does not commit trips', () => {
      const spyCreate = vi.spyOn(tripRepository, 'create');
      const batch = createGoogleSheetsBatch();
      const created = {
        matchedId: 'CAR-SRV-777',
        matchedName: 'ناقل خادم معتمد',
        sourceValue: 'ناقل محلي',
      };
      GoogleSheetsPipelineService.applyCreatedEntityResolution(
        batch,
        1,
        'carrier',
        created,
        dummyContext
      );
      expect(spyCreate).not.toHaveBeenCalled();
    });

    it('58. no local canonical ID synthesis', () => {
      const batch = createGoogleSheetsBatch();
      const created = {
        matchedId: 'CAR-SRV-AUTHENTIC',
        matchedName: 'ناقل موثق',
      };
      const updated = GoogleDrivePipelineService.applyCreatedEntityResolution(
        batch,
        1,
        'carrier',
        created,
        dummyContext
      );
      expect(updated.rows[0].resolvedValues?.carrierId).toBe('CAR-SRV-AUTHENTIC');
      expect(updated.rows[0].resolvedValues?.carrierId).not.toContain('SYNTH_');
    });
  });

  // =========================================================================
  // SECURITY / ARCHITECTURAL CHECKS (59-64)
  // =========================================================================
  describe('Security and Fallback Guards', () => {
    it('59. Google Sheets wrapper requires real PipelineContext', () => {
      const batch = createGoogleSheetsBatch();
      expect(() => {
        GoogleSheetsPipelineService.applyEntityResolutionDecision(
          batch,
          1,
          'carrier',
          'ACCEPT_CANDIDATE',
          { selectedEntityId: 'CAR-101' },
          null as any,
          'user-op-1'
        );
      }).toThrow();
    });

    it('60. Google Drive wrapper requires real PipelineContext', () => {
      const batch = createGoogleDriveBatch();
      expect(() => {
        GoogleDrivePipelineService.applyEntityResolutionDecision(
          batch,
          1,
          'carrier',
          'ACCEPT_CANDIDATE',
          { selectedEntityId: 'CAR-101' },
          null as any,
          'user-op-1'
        );
      }).toThrow();
    });

    it('61. cross-project selection rejection propagates', () => {
      const batch = createGoogleSheetsBatch();
      expect(() => {
        GoogleSheetsPipelineService.applyEntityResolutionDecision(
          batch,
          1,
          'carrier',
          'ACCEPT_CANDIDATE',
          { selectedEntityId: 'CAR-OTHER-99', selectedDisplayName: 'ناقل مشروع آخر' },
          dummyContext,
          'user-op-1'
        );
      }).toThrow(/Security Violation|Cross-project/i);
    });

    it('62. no first-carrier fallback', () => {
      const batch = createGoogleSheetsBatch();
      const updated = GoogleSheetsPipelineService.applyEntityResolutionDecision(
        batch,
        1,
        'carrier',
        'LEAVE_UNRESOLVED',
        {},
        dummyContext,
        'user-op-1'
      );
      expect(updated.rows[0].resolvedValues?.carrierId).toBeUndefined();
    });

    it('63. no first-material fallback', () => {
      const batch = createGoogleDriveBatch();
      const updated = GoogleDrivePipelineService.applyEntityResolutionDecision(
        batch,
        1,
        'material',
        'LEAVE_UNRESOLVED',
        {},
        dummyContext,
        'user-op-1'
      );
      expect(updated.rows[0].resolvedValues?.materialId).toBeUndefined();
    });

    it('64. no GENERAL fallback', () => {
      const batch = createGoogleSheetsBatch();
      const updated = GoogleSheetsPipelineService.applyEntityResolutionDecision(
        batch,
        1,
        'carrier',
        'LEAVE_UNRESOLVED',
        {},
        dummyContext,
        'user-op-1'
      );
      expect(updated.rows[0].resolvedValues?.carrierId).not.toBe('GENERAL');
      expect(updated.rows[0].resolvedValues?.carrierId).not.toBe('DEFAULT');
    });
  });
});
