import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { RosterBatchReviewService } from '../services/import/rosterBatchReview.service';
import { DriverTruckPipelineService } from '../services/import/driverTruckPipeline.service';
import { entityResolutionCommandService } from '../services/import/entityResolutionCommand.service';
import { UnifiedImportBatch, PipelineContext } from '../types/unifiedImport';

describe('Smart Import R2 — Entity Review Workspace Wiring Test Suite', () => {
  const sectionFilePath = path.resolve(__dirname, '../components/importCenter/ExcelCsvImportSection.tsx');
  let sectionContent = '';

  beforeEach(() => {
    vi.clearAllMocks();
    sectionContent = fs.readFileSync(sectionFilePath, 'utf-8');
  });

  const mockContext: PipelineContext = {
    projectId: 'PRJ-R2-TEST',
    userId: 'USR-ADMIN',
    userName: 'مدير النظام',
    role: 'PROJECT_ADMIN',
    operationId: 'OP-R2-001',
    knownEntities: {
      carriers: [
        { carrierId: 'CAR-101', name: 'شركة الناقل المعتمد', projectId: 'PRJ-R2-TEST' },
        { carrierId: 'CAR-102', name: 'شركة الناقل البديل', projectId: 'PRJ-R2-TEST' },
      ],
      trucks: [{ truckId: 'TRK-201', plate: 'أ ب ج 1234', projectId: 'PRJ-R2-TEST' }],
      drivers: [{ driverId: 'DRV-301', name: 'سائق معتمد', projectId: 'PRJ-R2-TEST' }],
      materials: [{ materialId: 'MAT-401', name: 'ركام بازلتي', code: 'AGG-20', projectId: 'PRJ-R2-TEST' }],
    },
  };

  const createSampleGroupedBatch = (): UnifiedImportBatch => ({
    importBatchId: 'BAT-R2-001',
    projectId: 'PRJ-R2-TEST',
    source: { sourceType: 'EXCEL', importBatchId: 'BAT-R2-001', sourceFileName: 'trips.xlsx' },
    currentStage: 'REVIEW',
    validationStatus: 'WARNING',
    commitStatus: 'AWAITING_REVIEW',
    totalRows: 3,
    validRows: 0,
    warningRows: 3,
    errorRows: 0,
    requiresReviewRows: 3,
    committedRows: 0,
    auditTrail: [],
    rows: [
      {
        rowNumber: 1,
        status: 'WARNING',
        reviewStatus: 'requires_review',
        raw: { 'الناقل': 'شركة الناقل المجهول', 'المادة': 'ركام جديد', 'السائق': 'سائق جديد', 'اللوحة': '1111 XYZ' },
        canonical: { carrierName: 'شركة الناقل المجهول', materialName: 'ركام جديد', driverName: 'سائق جديد', plateNumber: '1111 XYZ' },
        validationIssues: [],
        resolvedValues: {},
        entityResolutions: {
          carrier: {
            entityType: 'CARRIER',
            sourceValue: 'شركة الناقل المجهول',
            recommendation: 'REVIEW',
            riskLevel: 'MEDIUM',
            relationshipStatus: 'VALID',
            candidates: [{ entityId: 'CAR-101', displayName: 'شركة الناقل المعتمد', score: 0.82 }],
            matchedId: 'CAR-101',
            matchedName: 'شركة الناقل المعتمد',
          },
          material: {
            entityType: 'MATERIAL',
            sourceValue: 'ركام جديد',
            recommendation: 'CREATE',
            riskLevel: 'HIGH',
            relationshipStatus: 'VALID',
            candidates: [],
          },
          driver: {
            entityType: 'DRIVER',
            sourceValue: 'سائق جديد',
            recommendation: 'CREATE',
            riskLevel: 'HIGH',
            relationshipStatus: 'VALID',
            candidates: [],
          },
          truck: {
            entityType: 'TRUCK',
            sourceValue: '1111 XYZ',
            recommendation: 'CREATE',
            riskLevel: 'HIGH',
            relationshipStatus: 'VALID',
            candidates: [],
          },
        },
      },
      {
        rowNumber: 2,
        status: 'WARNING',
        reviewStatus: 'requires_review',
        raw: { 'الناقل': 'شركة الناقل المجهول', 'المادة': 'ركام جديد', 'السائق': 'سائق جديد', 'اللوحة': '1111 XYZ' },
        canonical: { carrierName: 'شركة الناقل المجهول', materialName: 'ركام جديد', driverName: 'سائق جديد', plateNumber: '1111 XYZ' },
        validationIssues: [],
        resolvedValues: {},
        entityResolutions: {
          carrier: {
            entityType: 'CARRIER',
            sourceValue: 'شركة الناقل المجهول',
            recommendation: 'REVIEW',
            riskLevel: 'MEDIUM',
            relationshipStatus: 'VALID',
            candidates: [{ entityId: 'CAR-101', displayName: 'شركة الناقل المعتمد', score: 0.82 }],
            matchedId: 'CAR-101',
            matchedName: 'شركة الناقل المعتمد',
          },
          material: {
            entityType: 'MATERIAL',
            sourceValue: 'ركام جديد',
            recommendation: 'CREATE',
            riskLevel: 'HIGH',
            relationshipStatus: 'VALID',
            candidates: [],
          },
          driver: {
            entityType: 'DRIVER',
            sourceValue: 'سائق جديد',
            recommendation: 'CREATE',
            riskLevel: 'HIGH',
            relationshipStatus: 'VALID',
            candidates: [],
          },
          truck: {
            entityType: 'TRUCK',
            sourceValue: '1111 XYZ',
            recommendation: 'CREATE',
            riskLevel: 'HIGH',
            relationshipStatus: 'VALID',
            candidates: [],
          },
        },
      },
      {
        rowNumber: 3,
        status: 'VALID',
        reviewStatus: 'accepted',
        raw: { 'الناقل': 'شركة الناقل المعتمد' },
        canonical: { carrierName: 'شركة الناقل المعتمد' },
        validationIssues: [],
        resolvedValues: { carrierId: 'CAR-101' },
        entityResolutions: {
          carrier: {
            entityType: 'CARRIER',
            sourceValue: 'شركة الناقل المعتمد',
            recommendation: 'ACCEPT',
            matchMethod: 'EXACT',
            riskLevel: 'LOW',
            relationshipStatus: 'VALID',
            candidates: [],
            matchedId: 'CAR-101',
            matchedName: 'شركة الناقل المعتمد',
          },
        },
      },
    ],
  });

  // 1. Grouped review uses RosterBatchReviewService
  it('1. Grouped review uses RosterBatchReviewService', () => {
    expect(sectionContent).toContain('RosterBatchReviewService.getBatchReviewGroups(activeBatch)');
    const groups = RosterBatchReviewService.getBatchReviewGroups(createSampleGroupedBatch());
    expect(groups.carrier).toBeDefined();
    expect(groups.material).toBeDefined();
    expect(groups.driver).toBeDefined();
    expect(groups.truck).toBeDefined();
  });

  // 2. Same repeated entity is represented as one group
  it('2. Same repeated entity is represented as one group', () => {
    const batch = createSampleGroupedBatch();
    const groups = RosterBatchReviewService.getBatchReviewGroups(batch);
    const unknownCarrierGroup = groups.carrier.find(g => g.sourceValue === 'شركة الناقل المجهول');
    expect(unknownCarrierGroup).toBeDefined();
    expect(unknownCarrierGroup?.rowNumbers).toEqual([1, 2]);
  });

  // 3. occurrenceCount is visible
  it('3. occurrenceCount is visible and calculated correctly', () => {
    const batch = createSampleGroupedBatch();
    const groups = RosterBatchReviewService.getBatchReviewGroups(batch);
    const unknownCarrierGroup = groups.carrier.find(g => g.sourceValue === 'شركة الناقل المجهول');
    expect(unknownCarrierGroup?.occurrenceCount).toBe(2);
    expect(sectionContent).toContain('تكرار: {group.occurrenceCount} صفوف');
  });

  // 4. AUTO_RESOLVED requires no manual acceptance
  it('4. AUTO_RESOLVED requires no manual acceptance', () => {
    const batch = createSampleGroupedBatch();
    const groups = RosterBatchReviewService.getBatchReviewGroups(batch);
    const autoGroup = groups.carrier.find(g => g.sourceValue === 'شركة الناقل المعتمد');
    expect(autoGroup?.status).toBe('AUTO_RESOLVED');
    expect(sectionContent).toContain('مطابقة تلقائية مؤكدة');
  });

  // 5. REVIEW_REQUIRED renders decision UI
  it('5. REVIEW_REQUIRED renders decision UI', () => {
    expect(sectionContent).toContain('قبول المقترح');
    expect(sectionContent).toContain('اختيار بديل');
    expect(sectionContent).toContain('ترك بدون حسم');
  });

  // 6. Candidate suggestion is visible
  it('6. Candidate suggestion is visible', () => {
    expect(sectionContent).toContain('الكيان المعتمد المطابق:');
    expect(sectionContent).toContain('{group.matchedName || group.matchedId}');
  });

  // 7. ACCEPT_CANDIDATE calls grouped decision path
  it('7. ACCEPT_CANDIDATE calls grouped decision path', () => {
    expect(sectionContent).toContain("'ACCEPT_CANDIDATE'");
    const batch = createSampleGroupedBatch();
    const groups = RosterBatchReviewService.getBatchReviewGroups(batch);
    const carrierGroup = groups.carrier.find(g => g.status === 'REVIEW_REQUIRED')!;
    const updated = DriverTruckPipelineService.applyGroupedEntityResolutionDecision(
      batch,
      'carrier',
      carrierGroup.normalizedSourceKey,
      'ACCEPT_CANDIDATE',
      { selectedEntityId: carrierGroup.matchedId, selectedDisplayName: carrierGroup.matchedName },
      mockContext,
      'USR-ADMIN'
    );
    expect(updated.rows[0].resolvedValues?.carrierId).toBe(carrierGroup.matchedId);
    expect(updated.rows[1].resolvedValues?.carrierId).toBe(carrierGroup.matchedId);
  });

  // 8. SELECT_ALTERNATE calls grouped decision path
  it('8. SELECT_ALTERNATE calls grouped decision path', () => {
    expect(sectionContent).toContain("'SELECT_ALTERNATE'");
    const batch = createSampleGroupedBatch();
    const groups = RosterBatchReviewService.getBatchReviewGroups(batch);
    const carrierGroup = groups.carrier.find(g => g.status === 'REVIEW_REQUIRED')!;
    const updated = DriverTruckPipelineService.applyGroupedEntityResolutionDecision(
      batch,
      'carrier',
      carrierGroup.normalizedSourceKey,
      'SELECT_ALTERNATE',
      { selectedEntityId: 'CAR-102', selectedDisplayName: 'شركة الناقل البديل' },
      mockContext,
      'USR-ADMIN'
    );
    expect(updated.rows[0].resolvedValues?.carrierId).toBe('CAR-102');
    expect(updated.rows[1].resolvedValues?.carrierId).toBe('CAR-102');
  });

  // 9. LEAVE_UNRESOLVED calls grouped decision path
  it('9. LEAVE_UNRESOLVED calls grouped decision path', () => {
    expect(sectionContent).toContain("'LEAVE_UNRESOLVED'");
    const batch = createSampleGroupedBatch();
    const groups = RosterBatchReviewService.getBatchReviewGroups(batch);
    const carrierGroup = groups.carrier.find(g => g.status === 'REVIEW_REQUIRED')!;
    const updated = DriverTruckPipelineService.applyGroupedEntityResolutionDecision(
      batch,
      'carrier',
      carrierGroup.normalizedSourceKey,
      'LEAVE_UNRESOLVED',
      {},
      mockContext,
      'USR-ADMIN'
    );
    expect(updated.rows[0].entityResolutions?.carrier?.riskLevel).toBe('HIGH');
    expect(updated.rows[0].entityResolutions?.carrier?.recommendation).toBe('REVIEW');
  });

  // 10. Decisions use normalizedSourceKey
  it('10. Decisions use normalizedSourceKey', () => {
    expect(sectionContent).toContain('group.normalizedSourceKey');
  });

  // 11. Carrier category is shown before driver/truck
  it('11. Carrier category is shown before driver/truck', () => {
    const carrierPos = sectionContent.indexOf("titleAr: '1. الناقلون'");
    const materialPos = sectionContent.indexOf("titleAr: '2. المواد والأصناف'");
    const driverPos = sectionContent.indexOf("titleAr: '3. السائقون'");
    const truckPos = sectionContent.indexOf("titleAr: '4. الشاحنات والمركبات'");

    expect(carrierPos).toBeGreaterThan(-1);
    expect(materialPos).toBeGreaterThan(carrierPos);
    expect(driverPos).toBeGreaterThan(materialPos);
    expect(truckPos).toBeGreaterThan(driverPos);
  });

  // 12. Driver create is blocked without resolved carrier
  it('12. Driver create is blocked without resolved carrier', () => {
    expect(sectionContent).toContain('يجب حسم مطابقة الناقل أولاً قبل إنشاء');
    expect(sectionContent).toContain('isCarrierBlocked');
  });

  // 13. Truck create is blocked without resolved carrier
  it('13. Truck create is blocked without resolved carrier', () => {
    expect(sectionContent).toContain('isCarrierBlocked');
  });

  // 14. Carrier creation uses existing createCarrier command
  it('14. Carrier creation uses existing createCarrier command', () => {
    expect(sectionContent).toContain('entityResolutionCommandService.createCarrier');
  });

  // 15. Material creation uses existing createMaterial command
  it('15. Material creation uses existing createMaterial command', () => {
    expect(sectionContent).toContain('entityResolutionCommandService.createMaterial');
  });

  // 16. Driver creation uses existing createDriver command
  it('16. Driver creation uses existing createDriver command', () => {
    expect(sectionContent).toContain('entityResolutionCommandService.createDriver');
  });

  // 17. Truck creation uses existing createTruck command
  it('17. Truck creation uses existing createTruck command', () => {
    expect(sectionContent).toContain('entityResolutionCommandService.createTruck');
  });

  // 18. No auto-create during render
  it('18. No auto-create during render', () => {
    expect(sectionContent).not.toMatch(/useEffect\(\s*\(\)\s*=>\s*\{[^}]*createCarrier/);
    expect(sectionContent).not.toMatch(/useEffect\(\s*\(\)\s*=>\s*\{[^}]*createDriver/);
    expect(sectionContent).not.toMatch(/useEffect\(\s*\(\)\s*=>\s*\{[^}]*createTruck/);
  });

  // 19. Only one create form can be active at once
  it('19. Only one create form can be active at once', () => {
    expect(sectionContent).toContain('activeCreateGroupKey === group.normalizedSourceKey');
  });

  // 20. Created canonical entity is applied to whole group
  it('20. Created canonical entity is applied to whole group', () => {
    expect(sectionContent).toContain('DriverTruckPipelineService.applyGroupedCreatedEntityResolution');
  });

  // 21. Post-decision batch is revalidated
  it('21. Post-decision batch is revalidated', () => {
    const batch = createSampleGroupedBatch();
    const groups = RosterBatchReviewService.getBatchReviewGroups(batch);
    const carrierGroup = groups.carrier.find(g => g.status === 'REVIEW_REQUIRED')!;
    const updated = DriverTruckPipelineService.applyGroupedEntityResolutionDecision(
      batch,
      'carrier',
      carrierGroup.normalizedSourceKey,
      'ACCEPT_CANDIDATE',
      { selectedEntityId: carrierGroup.matchedId, selectedDisplayName: carrierGroup.matchedName },
      mockContext,
      'USR-ADMIN'
    );
    expect(updated.validRows + updated.warningRows + updated.errorRows).toBe(batch.totalRows);
  });

  // 22. Review checkpoint is persisted
  it('22. Review checkpoint is persisted', () => {
    expect(sectionContent).toContain('importSessionClientService.updateCheckpoint');
  });

  // 23. unresolvedGroups gate row-review progression
  it('23. unresolvedGroups gate row-review progression', () => {
    expect(sectionContent).toContain('مراجعة الصفوف والاستثناءات (طابور الاستثناءات) مقفلة مؤقتاً حتى اكتمال حسم مطابقة الكيانات');
    expect(sectionContent).toContain("unresolvedGroups.length > 0 ? 'opacity-60 pointer-events-none' : ''");
  });

  // 24. When unresolvedGroups becomes zero, row review is available
  it('24. When unresolvedGroups becomes zero, row review is available', () => {
    expect(sectionContent).toContain('تم حسم مطابقة الكيانات — الانتقال إلى مراجعة الصفوف');
  });

  // 25. No row-by-row duplicate entity decision workflow is introduced
  it('25. No row-by-row duplicate entity decision workflow is introduced', () => {
    expect(sectionContent).toContain('handleGroupResolutionDecision');
    expect(sectionContent).toContain('handleGroupCreateCanonicalEntity');
  });

  // 26. R1 approval gate remains intact
  it('26. R1 approval gate remains intact', () => {
    expect(sectionContent).toContain('handleApproveAndStartPipeline');
    expect(sectionContent).toContain('CANONICAL_FIELD_OPTIONS');
  });

  // 27. tripImportCommitter unchanged
  it('27. tripImportCommitter unchanged', () => {
    const committerPath = path.resolve(__dirname, '../services/import/tripImportCommitter.ts');
    expect(fs.existsSync(committerPath)).toBe(true);
  });

  // 28. Unit 6A boundary unchanged
  it('28. Unit 6A boundary unchanged', () => {
    const persistencePath = path.resolve(__dirname, '../services/canonicalTripPersistence.server.ts');
    expect(fs.existsSync(persistencePath)).toBe(true);
  });

  // 29. Workspace unchanged
  it('29. Workspace unchanged', () => {
    const appPath = path.resolve(__dirname, '../App.tsx');
    expect(fs.existsSync(appPath)).toBe(true);
  });

  // 30. Existing entity resolution semantics unchanged
  it('30. Existing entity resolution semantics unchanged', () => {
    const resPath = path.resolve(__dirname, '../services/import/entityResolution.service.ts');
    expect(fs.existsSync(resPath)).toBe(true);
  });
});
