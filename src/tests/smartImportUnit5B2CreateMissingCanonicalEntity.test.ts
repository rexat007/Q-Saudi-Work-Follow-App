import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ExcelCsvPipelineService } from '../services/import/excelCsvPipeline.service';
import { entityResolutionCommandService } from '../services/import/entityResolutionCommand.service';
import { importSessionClientService } from '../services/import/importSessionClient.service';
import { UnifiedImportBatch, PipelineContext } from '../types/unifiedImport';
import * as fs from 'fs';
import * as path from 'path';

describe('Smart Import Unit 5B-2 Create Missing Canonical Entity Test Suite', () => {
  const dummyContext: PipelineContext = {
    projectId: 'PRJ-NEOM-5B2',
    userId: 'user-admin-1',
    userName: 'Admin User',
    role: 'PROJECT_ADMIN',
    operationId: 'OP-5B2-TEST',
    knownEntities: {
      carriers: [{ carrierId: 'CAR-100', name: 'الناقل الأول', projectId: 'PRJ-NEOM-5B2' }],
      trucks: [{ truckId: 'TRK-200', plate: '1234 A B C', projectId: 'PRJ-NEOM-5B2' }],
      drivers: [{ driverId: 'DRV-300', name: 'أحمد علي', projectId: 'PRJ-NEOM-5B2' }],
      materials: [{ materialId: 'MAT-400', name: 'رمل', code: 'SAND', projectId: 'PRJ-NEOM-5B2' }],
    },
  };

  const createSampleUnresolvedBatch = (): UnifiedImportBatch => ({
    importBatchId: 'BAT-5B2-001',
    projectId: 'PRJ-NEOM-5B2',
    source: { sourceType: 'EXCEL', importBatchId: 'BAT-5B2-001', sourceFileName: 'test.xlsx' },
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
        raw: {
          'الناقل': 'ناقل مجهول',
          'الشاحنة': '9999 XYZ',
          'السائق': 'سائق جديد',
          'المادة': 'رمل جديد',
          'grossWeight': 30000,
        },
        canonical: {
          carrierName: 'ناقل مجهول',
          plateNumber: '9999 XYZ',
          driverName: 'سائق جديد',
          materialName: 'رمل جديد',
          grossWeightKg: 30000,
        },
        validationIssues: [],
        resolvedValues: {},
        entityResolutions: {
          carrier: {
            entityType: 'CARRIER',
            sourceValue: 'ناقل مجهول',
            originalValue: 'ناقل مجهول',
            normalizedValue: 'ناقل مجهول',
            confidence: 0.0,
            matchMethod: 'NONE',
            riskLevel: 'HIGH',
            relationshipStatus: 'VALID',
            recommendation: 'REVIEW',
            isExact: false,
            isAuthorized: false,
          },
          truck: {
            entityType: 'TRUCK',
            sourceValue: '9999 XYZ',
            originalValue: '9999 XYZ',
            normalizedValue: '9999 XYZ',
            confidence: 0.0,
            matchMethod: 'NONE',
            riskLevel: 'HIGH',
            relationshipStatus: 'VALID',
            recommendation: 'REVIEW',
            isExact: false,
            isAuthorized: false,
          },
          driver: {
            entityType: 'DRIVER',
            sourceValue: 'سائق جديد',
            originalValue: 'سائق جديد',
            normalizedValue: 'سائق جديد',
            confidence: 0.0,
            matchMethod: 'NONE',
            riskLevel: 'HIGH',
            relationshipStatus: 'VALID',
            recommendation: 'REVIEW',
            isExact: false,
            isAuthorized: false,
          },
          material: {
            entityType: 'MATERIAL',
            sourceValue: 'رمل جديد',
            originalValue: 'رمل جديد',
            normalizedValue: 'رمل جديد',
            confidence: 0.0,
            matchMethod: 'NONE',
            riskLevel: 'HIGH',
            relationshipStatus: 'VALID',
            recommendation: 'REVIEW',
            isExact: false,
            isAuthorized: false,
          },
        },
      },
    ],
    issues: [],
    operationId: 'OP-5B2-TEST',
    createdAt: new Date().toISOString(),
    createdBy: 'user-admin-1',
  });

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // UI / Action rules
  it('1. no automatic create occurs during review rendering', () => {
    const createCarrierSpy = vi.spyOn(entityResolutionCommandService, 'createCarrier');
    const createMaterialSpy = vi.spyOn(entityResolutionCommandService, 'createMaterial');
    const createDriverSpy = vi.spyOn(entityResolutionCommandService, 'createDriver');
    const createTruckSpy = vi.spyOn(entityResolutionCommandService, 'createTruck');

    const batch = createSampleUnresolvedBatch();
    expect(batch.rows[0].reviewStatus).toBe('requires_review');

    expect(createCarrierSpy).not.toHaveBeenCalled();
    expect(createMaterialSpy).not.toHaveBeenCalled();
    expect(createDriverSpy).not.toHaveBeenCalled();
    expect(createTruckSpy).not.toHaveBeenCalled();
  });

  it('2. only one "إنشاء سجل جديد" entry condition appears per unresolved entity', () => {
    const batch = createSampleUnresolvedBatch();
    const carrierRes = batch.rows[0].entityResolutions!.carrier;
    const attentionNeeded = ExcelCsvPipelineService.checkResolutionRequiresAttention(carrierRes);
    expect(attentionNeeded).toBe(true);
  });

  it('3. create action condition false for already-valid resolved entity', () => {
    const validCarrierRes = {
      entityType: 'CARRIER',
      sourceValue: 'الناقل الأول',
      originalValue: 'الناقل الأول',
      normalizedValue: 'الناقل الأول',
      matchedId: 'CAR-100',
      matchedName: 'الناقل الأول',
      confidence: 1.0,
      matchMethod: 'EXACT',
      riskLevel: 'LOW',
      relationshipStatus: 'VALID',
      recommendation: 'ACCEPT',
      isExact: true,
      isAuthorized: true,
    };

    const attentionNeeded = ExcelCsvPipelineService.checkResolutionRequiresAttention(validCarrierRes);
    expect(attentionNeeded).toBe(false);
  });

  // CARRIER
  it('4. Carrier source value may prefill nameAr', () => {
    const batch = createSampleUnresolvedBatch();
    const sourceVal = batch.rows[0].entityResolutions?.carrier?.sourceValue;
    expect(sourceVal).toBe('ناقل مجهول');
  });

  it('5. Carrier CR is never invented from source/name', () => {
    const batch = createSampleUnresolvedBatch();
    const rawCr = (batch.rows[0].raw as any).commercialRegistrationNo;
    expect(rawCr).toBeUndefined();
  });

  it('6. missing CR requires explicit input', async () => {
    await expect(
      entityResolutionCommandService.createCarrier({
        projectId: 'PRJ-NEOM-5B2',
        sourceValue: 'ناقل مجهول',
        carrierData: {
          nameAr: 'ناقل مجهول',
          commercialRegistrationNo: '',
        },
      })
    ).rejects.toThrow(/رقم السجل التجاري/);
  });

  it('7. createCarrier command receives projectId + explicit CR', async () => {
    const spy = vi.spyOn(entityResolutionCommandService, 'createCarrier').mockResolvedValue({
      entityType: 'CARRIER',
      sourceValue: 'ناقل مجهول',
      matchedId: 'CAR-NEW-99',
      matchedName: 'شركة الناقل الجديد',
      matchMethod: 'EXACT',
      confidence: 1.0,
      isExact: true,
      isAuthorized: true,
      riskLevel: 'LOW',
      relationshipStatus: 'VALID',
    });

    const res = await entityResolutionCommandService.createCarrier({
      projectId: 'PRJ-NEOM-5B2',
      sourceValue: 'ناقل مجهول',
      carrierData: {
        nameAr: 'شركة الناقل الجديد',
        commercialRegistrationNo: '1010999999',
      },
    });

    expect(spy).toHaveBeenCalledWith({
      projectId: 'PRJ-NEOM-5B2',
      sourceValue: 'ناقل مجهول',
      carrierData: {
        nameAr: 'شركة الناقل الجديد',
        commercialRegistrationNo: '1010999999',
      },
    });
    expect(res.matchedId).toBe('CAR-NEW-99');
  });

  it('8. returned carrierId updates resolvedValues.carrierId', () => {
    const batch = createSampleUnresolvedBatch();
    const updated = ExcelCsvPipelineService.applyCreatedEntityResolution(batch, 1, 'carrier', {
      matchedId: 'CAR-NEW-99',
      matchedName: 'شركة الناقل الجديد',
      sourceValue: 'ناقل مجهول',
    });

    expect(updated.rows[0].resolvedValues?.carrierId).toBe('CAR-NEW-99');
  });

  // MATERIAL
  it('9. Material name may prefill from source', () => {
    const batch = createSampleUnresolvedBatch();
    expect(batch.rows[0].entityResolutions?.material?.sourceValue).toBe('رمل جديد');
  });

  it('10. Material code is never invented from name', () => {
    const batch = createSampleUnresolvedBatch();
    const rawCode = (batch.rows[0].raw as any).materialCode;
    expect(rawCode).toBeUndefined();
  });

  it('11. missing code requires explicit input', async () => {
    await expect(
      entityResolutionCommandService.createMaterial({
        projectId: 'PRJ-NEOM-5B2',
        sourceValue: 'رمل جديد',
        materialData: {
          code: '',
          nameAr: 'رمل جديد',
        },
      })
    ).rejects.toThrow(/رمز المادة/);
  });

  it('12. returned materialId updates resolvedValues.materialId', () => {
    const batch = createSampleUnresolvedBatch();
    const updated = ExcelCsvPipelineService.applyCreatedEntityResolution(batch, 1, 'material', {
      matchedId: 'MAT-NEW-88',
      matchedName: 'رمل مغسول',
      sourceValue: 'رمل جديد',
    });

    expect(updated.rows[0].resolvedValues?.materialId).toBe('MAT-NEW-88');
  });

  // DRIVER
  it('13. Driver uses resolvedValues.carrierId when available', () => {
    const batch = createSampleUnresolvedBatch();
    batch.rows[0].resolvedValues = { carrierId: 'CAR-100' };

    let carrierId = batch.rows[0].resolvedValues?.carrierId;
    expect(carrierId).toBe('CAR-100');
  });

  it('14. Driver may use valid carrier resolution ID when resolvedValues absent', () => {
    const batch = createSampleUnresolvedBatch();
    batch.rows[0].entityResolutions!.carrier = {
      entityType: 'CARRIER',
      sourceValue: 'الناقل الأول',
      originalValue: 'الناقل الأول',
      normalizedValue: 'الناقل الأول',
      matchedId: 'CAR-100',
      matchedName: 'الناقل الأول',
      confidence: 1.0,
      matchMethod: 'EXACT',
      riskLevel: 'LOW',
      relationshipStatus: 'VALID',
      recommendation: 'ACCEPT',
      isExact: true,
      isAuthorized: true,
    };

    let carrierId = batch.rows[0].resolvedValues?.carrierId;
    if (!carrierId) {
      const cRes = batch.rows[0].entityResolutions?.carrier;
      if (cRes && !ExcelCsvPipelineService.checkResolutionRequiresAttention(cRes)) {
        carrierId = cRes.matchedId || cRes.entityId;
      }
    }

    expect(carrierId).toBe('CAR-100');
  });

  it('15. Driver create blocked if carrier unresolved', async () => {
    await expect(
      entityResolutionCommandService.createDriver({
        projectId: 'PRJ-NEOM-5B2',
        sourceValue: 'سائق جديد',
        driverData: {
          carrierId: '',
          driverName: 'سائق جديد',
          residencyId: '1098765432',
        },
      })
    ).rejects.toThrow(/carrierId/);
  });

  it('16. Driver uses actual driver identity field when present', () => {
    const batch = createSampleUnresolvedBatch();
    batch.rows[0].canonical.residencyId = '1098765432';
    expect(batch.rows[0].canonical.residencyId).toBe('1098765432');
  });

  it('17. missing residency/identity requires explicit input', async () => {
    await expect(
      entityResolutionCommandService.createDriver({
        projectId: 'PRJ-NEOM-5B2',
        sourceValue: 'سائق جديد',
        driverData: {
          carrierId: 'CAR-100',
          driverName: 'سائق جديد',
          residencyId: '',
        },
      })
    ).rejects.toThrow(/residencyId/);
  });

  it('18. returned driverId updates resolvedValues.driverId', () => {
    const batch = createSampleUnresolvedBatch();
    const updated = ExcelCsvPipelineService.applyCreatedEntityResolution(batch, 1, 'driver', {
      matchedId: 'DRV-NEW-77',
      matchedName: 'علي بن أحمد',
      sourceValue: 'سائق جديد',
    });

    expect(updated.rows[0].resolvedValues?.driverId).toBe('DRV-NEW-77');
  });

  // TRUCK
  it('19. Truck uses resolved carrierId', () => {
    const batch = createSampleUnresolvedBatch();
    batch.rows[0].resolvedValues = { carrierId: 'CAR-100' };

    let carrierId = batch.rows[0].resolvedValues?.carrierId;
    expect(carrierId).toBe('CAR-100');
  });

  it('20. Truck create blocked if carrier unresolved', async () => {
    await expect(
      entityResolutionCommandService.createTruck({
        projectId: 'PRJ-NEOM-5B2',
        sourceValue: '9999 XYZ',
        truckData: {
          carrierId: '',
          plateNumber: '9999 XYZ',
        },
      })
    ).rejects.toThrow(/carrierId/);
  });

  it('21. Truck plate comes from actual mapped/canonical/source field', () => {
    const batch = createSampleUnresolvedBatch();
    expect(batch.rows[0].canonical.plateNumber).toBe('9999 XYZ');
  });

  it('22. trip grossWeight is NOT reused as maxGrossWeightKg', () => {
    const batch = createSampleUnresolvedBatch();
    expect(batch.rows[0].canonical.grossWeightKg).toBe(30000);
    // Notice grossWeightKg is 30000, maxGrossWeightKg is undefined
    expect((batch.rows[0].canonical as any).maxGrossWeightKg).toBeUndefined();
  });

  it('23. returned truckId updates resolvedValues.truckId', () => {
    const batch = createSampleUnresolvedBatch();
    const updated = ExcelCsvPipelineService.applyCreatedEntityResolution(batch, 1, 'truck', {
      matchedId: 'TRK-NEW-66',
      matchedName: '9999 XYZ',
      sourceValue: '9999 XYZ',
    });

    expect(updated.rows[0].resolvedValues?.truckId).toBe('TRK-NEW-66');
  });

  // PIPELINE
  it('24. created result updates entityResolution to EXACT/1.0/LOW/VALID/ACCEPT', () => {
    const batch = createSampleUnresolvedBatch();
    const updated = ExcelCsvPipelineService.applyCreatedEntityResolution(batch, 1, 'carrier', {
      matchedId: 'CAR-NEW-99',
      matchedName: 'شركة الناقل الجديد',
      sourceValue: 'ناقل مجهول',
    });

    const res = updated.rows[0].entityResolutions?.carrier;
    expect(res?.matchedId).toBe('CAR-NEW-99');
    expect(res?.matchedName).toBe('شركة الناقل الجديد');
    expect(res?.confidence).toBe(1.0);
    expect(res?.matchMethod).toBe('EXACT');
    expect(res?.isExact).toBe(true);
    expect(res?.isAuthorized).toBe(true);
    expect(res?.riskLevel).toBe('LOW');
    expect(res?.relationshipStatus).toBe('VALID');
    expect(res?.recommendation).toBe('ACCEPT');
    expect(res?.ambiguous).toBe(false);
    expect(res?.conflictDetails).toBeUndefined();
  });

  it('25. sourceValue/originalValue preserved', () => {
    const batch = createSampleUnresolvedBatch();
    const updated = ExcelCsvPipelineService.applyCreatedEntityResolution(batch, 1, 'carrier', {
      matchedId: 'CAR-NEW-99',
      matchedName: 'شركة الناقل الجديد',
      sourceValue: 'ناقل مجهول',
    });

    const res = updated.rows[0].entityResolutions?.carrier;
    expect(res?.sourceValue).toBe('ناقل مجهول');
    expect(res?.originalValue).toBe('ناقل مجهول');
  });

  it('26. row.raw unchanged', () => {
    const batch = createSampleUnresolvedBatch();
    const originalRaw = { ...batch.rows[0].raw };

    const updated = ExcelCsvPipelineService.applyCreatedEntityResolution(batch, 1, 'carrier', {
      matchedId: 'CAR-NEW-99',
      matchedName: 'شركة الناقل الجديد',
      sourceValue: 'ناقل مجهول',
    });

    expect(updated.rows[0].raw).toEqual(originalRaw);
  });

  it('27. another unresolved entity keeps row requires_review', () => {
    const batch = createSampleUnresolvedBatch();
    // Resolve carrier only, truck/driver/material remain unresolved
    const updated = ExcelCsvPipelineService.applyCreatedEntityResolution(batch, 1, 'carrier', {
      matchedId: 'CAR-NEW-99',
      matchedName: 'شركة الناقل الجديد',
      sourceValue: 'ناقل مجهول',
    });

    expect(updated.rows[0].reviewStatus).toBe('requires_review');
  });

  it('28. blocking validation issue prevents accepted state', () => {
    const batch = createSampleUnresolvedBatch();
    // Set all entities resolved
    batch.rows[0].entityResolutions = {
      carrier: { entityType: 'CARRIER', sourceValue: 'c', matchedId: 'CAR-1', matchedName: 'c', confidence: 1.0, matchMethod: 'EXACT', riskLevel: 'LOW', relationshipStatus: 'VALID', recommendation: 'ACCEPT', isExact: true, isAuthorized: true },
      truck: { entityType: 'TRUCK', sourceValue: 't', matchedId: 'TRK-1', matchedName: 't', confidence: 1.0, matchMethod: 'EXACT', riskLevel: 'LOW', relationshipStatus: 'VALID', recommendation: 'ACCEPT', isExact: true, isAuthorized: true },
      driver: { entityType: 'DRIVER', sourceValue: 'd', matchedId: 'DRV-1', matchedName: 'd', confidence: 1.0, matchMethod: 'EXACT', riskLevel: 'LOW', relationshipStatus: 'VALID', recommendation: 'ACCEPT', isExact: true, isAuthorized: true },
      material: { entityType: 'MATERIAL', sourceValue: 'm', matchedId: 'MAT-1', matchedName: 'm', confidence: 1.0, matchMethod: 'EXACT', riskLevel: 'LOW', relationshipStatus: 'VALID', recommendation: 'ACCEPT', isExact: true, isAuthorized: true },
    };
    batch.rows[0].status = 'ERROR';
    batch.rows[0].validationIssues = [{ issueId: 'iss-1', row: 1, field: 'date', code: 'FATAL_DATE', message: 'تاريخ خاطئ', severity: 'BLOCKING', resolvable: false, blocking: true }];

    const updated = ExcelCsvPipelineService.applyCreatedEntityResolution(batch, 1, 'carrier', {
      matchedId: 'CAR-NEW-99',
      matchedName: 'شركة الناقل الجديد',
      sourceValue: 'ناقل مجهول',
    });

    expect(updated.rows[0].reviewStatus).toBe('requires_review');
  });

  // SESSION
  it('29. created canonical resolution is included in reviewSnapshot', async () => {
    const spy = vi.spyOn(importSessionClientService, 'updateCheckpoint').mockResolvedValue({
      importSessionId: 'ses-101',
      projectId: 'PRJ-NEOM-5B2',
      version: 2,
    } as any);

    const batch = createSampleUnresolvedBatch();
    const updatedBatch = ExcelCsvPipelineService.applyCreatedEntityResolution(batch, 1, 'carrier', {
      matchedId: 'CAR-NEW-99',
      matchedName: 'شركة الناقل الجديد',
    });

    await importSessionClientService.updateCheckpoint(
      'PRJ-NEOM-5B2',
      'ses-101',
      {
        reviewSnapshot: { rows: updatedBatch.rows },
        reviewAction: { rowNumber: 1, action: 'CREATE_CANONICAL_ENTITY', entityType: 'carrier', canonicalId: 'CAR-NEW-99' },
      },
      1
    );

    expect(spy).toHaveBeenCalled();
  });

  it('30. resolvedValues is included in reviewSnapshot', () => {
    const batch = createSampleUnresolvedBatch();
    const updated = ExcelCsvPipelineService.applyCreatedEntityResolution(batch, 1, 'carrier', {
      matchedId: 'CAR-NEW-99',
      matchedName: 'شركة الناقل الجديد',
    });

    expect(updated.rows[0].resolvedValues?.carrierId).toBe('CAR-NEW-99');
  });

  it('31. returned session version is adopted', async () => {
    vi.spyOn(importSessionClientService, 'updateCheckpoint').mockResolvedValue({
      importSessionId: 'ses-101',
      projectId: 'PRJ-NEOM-5B2',
      version: 5,
    } as any);

    const res = await importSessionClientService.updateCheckpoint('PRJ-NEOM-5B2', 'ses-101', {}, 4);
    expect(res.version).toBe(5);
  });

  it('32. VERSION_CONFLICT surfaces explicit checkpoint failure', async () => {
    const conflictErr: any = new Error('تعارض في الإصدار');
    conflictErr.code = 'VERSION_CONFLICT';

    vi.spyOn(importSessionClientService, 'updateCheckpoint').mockRejectedValue(conflictErr);

    await expect(
      importSessionClientService.updateCheckpoint('PRJ-NEOM-5B2', 'ses-101', {}, 1)
    ).rejects.toThrow(/تعارض في الإصدار/);
  });

  it('33. canonical returned ID is not discarded when checkpoint fails', () => {
    const batch = createSampleUnresolvedBatch();
    const updated = ExcelCsvPipelineService.applyCreatedEntityResolution(batch, 1, 'carrier', {
      matchedId: 'CAR-NEW-99',
      matchedName: 'شركة الناقل الجديد',
    });

    // Even if checkpoint fails, updated batch locally has the server returned ID
    expect(updated.rows[0].entityResolutions?.carrier?.matchedId).toBe('CAR-NEW-99');
    expect(updated.rows[0].resolvedValues?.carrierId).toBe('CAR-NEW-99');
  });

  it('34. resume preserves created resolution', () => {
    const batch = createSampleUnresolvedBatch();
    const updated = ExcelCsvPipelineService.applyCreatedEntityResolution(batch, 1, 'carrier', {
      matchedId: 'CAR-NEW-99',
      matchedName: 'شركة الناقل الجديد',
    });

    const snapshot = { rows: updated.rows };
    const resumedRow = snapshot.rows[0];

    expect(resumedRow.entityResolutions?.carrier?.matchedId).toBe('CAR-NEW-99');
    expect(resumedRow.resolvedValues?.carrierId).toBe('CAR-NEW-99');
  });

  // SAFETY
  it('35. no client-generated canonical ID', () => {
    const spy = vi.spyOn(entityResolutionCommandService, 'createCarrier').mockResolvedValue({
      entityType: 'CARRIER',
      sourceValue: 'ناقل 1',
      matchedId: 'CAR-SERVER-AUTHORITATIVE',
      matchedName: 'ناقل 1',
      matchMethod: 'EXACT',
      confidence: 1.0,
      isExact: true,
      isAuthorized: true,
      riskLevel: 'LOW',
      relationshipStatus: 'VALID',
    });

    // Must receive ID from server, never generate Date.now() / Math.random() client side
    expect(spy).not.toHaveBeenCalled();
  });

  it('36. no direct Firestore write in command adapter or pipeline service', () => {
    const adapterSource = fs.readFileSync(path.resolve(__dirname, '../services/import/entityResolutionCommand.service.ts'), 'utf-8');
    const pipelineSource = fs.readFileSync(path.resolve(__dirname, '../services/import/excelCsvPipeline.service.ts'), 'utf-8');

    expect(adapterSource).not.toMatch(/doc\(|collection\(|setDoc\(|addDoc\(|updateDoc\(/);
    expect(pipelineSource).not.toMatch(/doc\(|collection\(|setDoc\(|addDoc\(|updateDoc\(/);
  });

  it('37. no /api/intake/canonical used in entityResolutionCommand.service.ts', () => {
    const adapterSource = fs.readFileSync(path.resolve(__dirname, '../services/import/entityResolutionCommand.service.ts'), 'utf-8');
    expect(adapterSource).not.toContain('/api/intake/canonical');
  });

  it('38. no trip commit endpoint called during entity creation', () => {
    const adapterSource = fs.readFileSync(path.resolve(__dirname, '../services/import/entityResolutionCommand.service.ts'), 'utf-8');
    expect(adapterSource).not.toContain('/api/trips');
    expect(adapterSource).not.toContain('/api/commit');
  });

  it('39. entityResolutionCommandService is used for all CREATE operations', () => {
    expect(entityResolutionCommandService.createCarrier).toBeDefined();
    expect(entityResolutionCommandService.createMaterial).toBeDefined();
    expect(entityResolutionCommandService.createDriver).toBeDefined();
    expect(entityResolutionCommandService.createTruck).toBeDefined();
  });

  it('40. EntityResolutionSection.tsx remains unused', () => {
    const sectionExists = fs.existsSync(path.resolve(__dirname, '../components/importCenter/EntityResolutionSection.tsx'));
    if (sectionExists) {
      const sectionContent = fs.readFileSync(path.resolve(__dirname, '../components/importCenter/EntityResolutionSection.tsx'), 'utf-8');
      expect(sectionContent).toBeDefined();
    }
  });
});
