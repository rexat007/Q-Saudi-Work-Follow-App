import { 
  ImportRow, 
  ImportIssue, 
  ImportEntityResolutionInfo, 
  UnifiedImportBatch, 
  ImportResult, 
  PipelineContext 
} from '../../types/unifiedImport';
import { auth } from '../../firebase/config';
import { 
  normalizeName, 
  normalizePhone, 
  normalizeIdNumber, 
  normalizePlate 
} from '../../utils/normalization';

const getApiBase = () => (typeof window !== 'undefined' ? '' : 'http://localhost:3000');

export interface CanonicalDriverTruckRow {
  driverName?: string;
  driverPhone?: string;
  driverIdentity?: string; // idNumber / nationalOrIqamaId
  truckPlate?: string;     // plate
  truckType?: 'TIPPER_32M3' | 'TRAILER_24M' | 'FLATBED' | 'DUMPER' | string;
  carrierName?: string;
  carrierId?: string;
  materialName?: string;
  materialId?: string;
  materialCode?: string;
  tareWeightKg?: number;
  maxGrossWeightKg?: number;
  [key: string]: any;
}

/**
 * Driver & Truck Import Pipeline Stage Implementations
 */

export class DriverTruckImportNormalizer {
  public normalize(raw: Record<string, any>, rowNumber: number): CanonicalDriverTruckRow {
    const canonical: CanonicalDriverTruckRow = { _rowNumber: rowNumber };

    // Standardize mapping by reading both English and Arabic common keys
    const name = raw.driverName || raw['اسم السائق'] || raw['السائق'] || raw.driver_name || raw.driver || '';
    const phone = raw.driverPhone || raw.phone || raw['رقم الهاتف'] || raw['الهاتف'] || raw['رقم الجوال'] || raw['الجوال'] || raw.driver_phone || raw.phone_number || '';
    const identity = raw.driverIdentity || raw.idNumber || raw.identity || raw['رقم الهوية'] || raw['الهوية'] || raw['رقم الإقامة'] || raw.national_id || raw.residency_id || raw.identity_id || '';
    const plate = raw.truckPlate || raw.plate || raw.truckNo || raw['رقم اللوحة'] || raw['اللوحة'] || raw.truck_plate || raw.plate_number || '';
    const type = raw.truckType || raw.type || raw['نوع الشاحنة'] || raw['نوع المركبة'] || raw.truck_type || '';
    const carrier = raw.carrierName || raw.carrier || raw['الناقل'] || raw['شركة النقل'] || raw.carrier_name || raw.carrierId || '';

    // Material normalization from explicit conventional keys
    const material = raw.materialName || raw.material || raw['المادة'] || raw['اسم المادة'] || raw.material_name || raw.materialId || raw.materialCode || '';

    canonical.driverName = typeof name === 'string' ? name.trim() : String(name || '');
    canonical.driverPhone = typeof phone === 'string' ? normalizePhone(phone) : normalizePhone(String(phone || ''));
    canonical.driverIdentity = typeof identity === 'string' ? normalizeIdNumber(identity) : normalizeIdNumber(String(identity || ''));
    canonical.truckPlate = typeof plate === 'string' ? normalizePlate(plate) : normalizePlate(String(plate || ''));
    canonical.truckType = typeof type === 'string' ? type.trim() : String(type || '');
    canonical.carrierName = typeof carrier === 'string' ? carrier.trim() : String(carrier || '');

    if (material) {
      canonical.materialName = typeof material === 'string' ? material.trim() : String(material || '');
    }
    if (raw.materialId) {
      canonical.materialId = typeof raw.materialId === 'string' ? raw.materialId.trim() : String(raw.materialId || '');
    }
    if (raw.materialCode) {
      canonical.materialCode = typeof raw.materialCode === 'string' ? raw.materialCode.trim() : String(raw.materialCode || '');
    }

    if (raw.tareWeightKg !== undefined) canonical.tareWeightKg = Number(raw.tareWeightKg);
    if (raw.maxGrossWeightKg !== undefined) canonical.maxGrossWeightKg = Number(raw.maxGrossWeightKg);

    return canonical;
  }
}

export class DriverTruckImportMapper {
  public map(canonical: CanonicalDriverTruckRow, rowNumber: number): CanonicalDriverTruckRow {
    return {
      ...canonical,
      _mappedRowNumber: rowNumber,
    };
  }
}

export class DriverTruckImportEntityResolver {
  public async resolveEntities(
    mapped: CanonicalDriverTruckRow,
    _rowNumber: number,
    context: PipelineContext
  ): Promise<Record<string, ImportEntityResolutionInfo>> {
    const resolutions: Record<string, ImportEntityResolutionInfo> = {};

    // 1. Resolve Carrier strictly from row input (No fallback to carriers[0])
    const targetCarrierName = mapped.carrierName || mapped.carrierId || '';

    let carrierId: string | undefined = undefined;
    let matchedCarrierName: string | undefined = undefined;
    let carrierMatched = false;

    if (targetCarrierName) {
      const normalizedImportCarrier = normalizeName(targetCarrierName);
      const matched = context.knownEntities?.carriers?.find(
        (c) =>
          c.carrierId.toLowerCase() === targetCarrierName.toLowerCase() ||
          normalizeName(c.name) === normalizedImportCarrier ||
          c.aliases?.some((a) => normalizeName(a) === normalizedImportCarrier)
      );

      if (matched) {
        carrierId = matched.carrierId;
        matchedCarrierName = matched.name;
        carrierMatched = true;
      } else if (context.knownEntities?.carrierIds) {
        const idMatch = context.knownEntities.carrierIds.find(
          (id) => id.toLowerCase() === targetCarrierName.toLowerCase()
        );
        if (idMatch) {
          carrierId = idMatch;
          matchedCarrierName = idMatch;
          carrierMatched = true;
        }
      }
    }

    resolutions.carrier = {
      entityType: 'CARRIER',
      originalValue: targetCarrierName,
      matchedId: carrierId,
      matchedName: matchedCarrierName,
      confidence: carrierMatched ? 100 : 0,
      isExact: carrierMatched,
      isAuthorized: Boolean(carrierId),
      riskLevel: carrierId ? 'LOW' : 'CRITICAL',
    };

    // 2. Resolve Material strictly from row input (No fallback to materials[0] or GENERAL)
    const targetMaterial = mapped.materialName || mapped.materialId || mapped.materialCode || '';
    let materialId: string | undefined = undefined;
    let matchedMaterialName: string | undefined = undefined;
    let materialMatched = false;

    if (targetMaterial) {
      const normMaterial = normalizeName(targetMaterial);
      const matchedMat = context.knownEntities?.materials?.find(
        (m) =>
          m.materialId.toLowerCase() === targetMaterial.toLowerCase() ||
          normalizeName(m.name) === normMaterial ||
          (m.code && m.code.toLowerCase() === targetMaterial.toLowerCase()) ||
          (m.code && normalizeName(m.code) === normMaterial)
      );

      if (matchedMat) {
        materialId = matchedMat.materialId;
        matchedMaterialName = matchedMat.name;
        materialMatched = true;
      } else if (context.knownEntities?.materialCodes) {
        const codeMatch = context.knownEntities.materialCodes.find(
          (c) => c.toLowerCase() === targetMaterial.toLowerCase()
        );
        if (codeMatch) {
          materialId = codeMatch;
          matchedMaterialName = codeMatch;
          materialMatched = true;
        }
      }
    }

    resolutions.material = {
      entityType: 'MATERIAL',
      originalValue: targetMaterial,
      matchedId: materialId,
      matchedName: matchedMaterialName,
      confidence: materialMatched ? 100 : 0,
      isExact: materialMatched,
      isAuthorized: Boolean(materialId),
      riskLevel: materialId ? 'LOW' : 'CRITICAL',
    };

    // 2. Resolve Driver (using Exact identity search or Normalized name search)
    if (mapped.driverName) {
      const importId = mapped.driverIdentity || '';
      const normName = normalizeName(mapped.driverName);

      let foundDriver: any = null;
      let matchMethod: 'EXACT' | 'NORMALIZED' | 'FUZZY' | 'NONE' = 'NONE';
      let confidence = 0;

      // Try EXACT match by ID number first
      if (importId) {
        foundDriver = context.knownEntities?.drivers?.find((d) => d.idNumber === importId || d.driverId === importId);
        if (foundDriver) {
          matchMethod = 'EXACT';
          confidence = 100;
        }
      }

      // Try NORMALIZED match by name
      if (!foundDriver) {
        foundDriver = context.knownEntities?.drivers?.find((d) => normalizeName(d.name) === normName);
        if (foundDriver) {
          matchMethod = 'NORMALIZED';
          confidence = 90;
        }
      }

      // Try FUZZY match by partial name (simple inclusion check)
      if (!foundDriver) {
        foundDriver = context.knownEntities?.drivers?.find((d) => normalizeName(d.name).includes(normName) || normName.includes(normalizeName(d.name)));
        if (foundDriver) {
          matchMethod = 'FUZZY';
          confidence = 75;
        }
      }

      let relationshipStatus: ImportEntityResolutionInfo['relationshipStatus'] = 'VALID';
      let riskLevel: ImportEntityResolutionInfo['riskLevel'] = 'LOW';
      let conflictDetails = '';

      if (foundDriver) {
        // Verify driver belongs to resolved/selected carrier
        if (carrierId && foundDriver.carrierId !== carrierId) {
          relationshipStatus = 'DRIVER_CARRIER_CONFLICT';
          riskLevel = 'CRITICAL';
          conflictDetails = `السائق مسجل مسبقاً للناقل [${foundDriver.carrierId}] بينما الاستيراد الحالي للناقل [${carrierId}]`;
        }
      }

      resolutions.driver = {
        entityType: 'DRIVER',
        originalValue: mapped.driverName,
        matchedId: foundDriver?.driverId,
        matchedName: foundDriver?.name,
        confidence,
        isExact: matchMethod === 'EXACT',
        matchMethod,
        relationshipStatus,
        riskLevel,
        conflictDetails,
        isAuthorized: foundDriver ? relationshipStatus === 'VALID' : true,
      };
    }

    // 3. Resolve Truck (using plate number)
    if (mapped.truckPlate) {
      const normPlate = normalizePlate(mapped.truckPlate);

      let foundTruck: any = null;
      let matchMethod: 'EXACT' | 'NORMALIZED' | 'NONE' = 'NONE';
      let confidence = 0;

      // Exact/Normalized match on plate
      foundTruck = context.knownEntities?.trucks?.find(
        (t) => normalizePlate(t.plate) === normPlate || t.truckId === normPlate
      );

      if (foundTruck) {
        matchMethod = 'EXACT';
        confidence = 100;
      }

      let relationshipStatus: ImportEntityResolutionInfo['relationshipStatus'] = 'VALID';
      let riskLevel: ImportEntityResolutionInfo['riskLevel'] = 'LOW';
      let conflictDetails = '';

      if (foundTruck) {
        // Verify truck belongs to resolved/selected carrier
        if (carrierId && foundTruck.carrierId !== carrierId) {
          relationshipStatus = 'RELATIONSHIP_CONFLICT'; // Carrier/Truck conflict
          riskLevel = 'CRITICAL';
          conflictDetails = `الشاحنة مسجلة مسبقاً للناقل [${foundTruck.carrierId}] بينما الاستيراد الحالي للناقل [${carrierId}]`;
        }
      }

      resolutions.truck = {
        entityType: 'TRUCK',
        originalValue: mapped.truckPlate,
        matchedId: foundTruck?.truckId,
        matchedName: foundTruck?.plate,
        confidence,
        isExact: matchMethod === 'EXACT',
        matchMethod,
        relationshipStatus,
        riskLevel,
        conflictDetails,
        isAuthorized: foundTruck ? relationshipStatus === 'VALID' : true,
      };
    }

    return resolutions;
  }
}

export class DriverTruckImportValidator {
  public validateRow(row: ImportRow<any, CanonicalDriverTruckRow>, context: PipelineContext): ImportIssue[] {
    const issues: ImportIssue[] = [];
    const canonical = row.canonical || row.raw || {};

    const isDriverRow = Boolean(canonical.driverName);
    const isTruckRow = Boolean(canonical.truckPlate);

    if (!isDriverRow && !isTruckRow) {
      issues.push({
        issueId: `ISSUE-${row.rowNumber}-EMPTY`,
        row: row.rowNumber,
        field: 'driverName',
        code: 'EMPTY_ROW_DATA',
        severity: 'BLOCKING',
        message: 'الصف فارغ، لا يحتوي على بيانات سائق أو شاحنة.',
        messageAr: 'الصف فارغ، لا يحتوي على بيانات سائق أو شاحنة.',
        resolvable: false,
        blocking: true,
      });
      return issues;
    }

    // A. Driver Validation
    if (isDriverRow) {
      if (!canonical.driverName || canonical.driverName.trim() === '') {
        issues.push({
          issueId: `ISSUE-${row.rowNumber}-DRV-NAME`,
          row: row.rowNumber,
          field: 'driverName',
          code: 'MISSING_DRIVER_NAME',
          severity: 'BLOCKING',
          message: 'اسم السائق مطلوب ومفقود.',
          messageAr: 'اسم السائق مطلوب ومفقود.',
          resolvable: false,
          blocking: true,
        });
      }

      if (canonical.driverIdentity && canonical.driverIdentity.length !== 10) {
        issues.push({
          issueId: `ISSUE-${row.rowNumber}-DRV-ID-LEN`,
          row: row.rowNumber,
          field: 'driverIdentity',
          code: 'INVALID_ID_FORMAT',
          severity: 'BLOCKING',
          message: 'رقم الهوية أو الإقامة يجب أن يتكون من 10 أرقام.',
          messageAr: 'رقم الهوية أو الإقامة يجب أن يتكون من 10 أرقام.',
          resolvable: false,
          blocking: true,
        });
      }
    }

    // B. Truck Validation
    if (isTruckRow) {
      if (!canonical.truckPlate || canonical.truckPlate.trim() === '') {
        issues.push({
          issueId: `ISSUE-${row.rowNumber}-TRK-PLATE`,
          row: row.rowNumber,
          field: 'truckPlate',
          code: 'MISSING_PLATE',
          severity: 'BLOCKING',
          message: 'رقم لوحة الشاحنة مطلوب ومفقود.',
          messageAr: 'رقم لوحة الشاحنة مطلوب ومفقود.',
          resolvable: false,
          blocking: true,
        });
      }
    }

    // C. Carrier Unresolved or Conflict
    const carrierRes = row.entityResolutions?.carrier;
    if (!carrierRes || !carrierRes.matchedId) {
      issues.push({
        issueId: `ISSUE-${row.rowNumber}-CARRIER-UNRESOLVED`,
        row: row.rowNumber,
        field: 'carrierName',
        code: 'UNRESOLVED_CARRIER',
        severity: 'BLOCKING',
        message: 'الناقل غير معرّف أو غير مصرح به في هذا المشروع.',
        messageAr: 'الناقل غير معرّف أو غير مصرح به في هذا المشروع.',
        resolvable: false,
        blocking: true,
      });
    }

    // D. Driver Carrier Conflict
    const driverRes = row.entityResolutions?.driver;
    if (driverRes?.relationshipStatus === 'DRIVER_CARRIER_CONFLICT') {
      issues.push({
        issueId: `ISSUE-${row.rowNumber}-DRV-CAR-CONFLICT`,
        row: row.rowNumber,
        field: 'driverName',
        code: 'DRIVER_CARRIER_CONFLICT',
        severity: 'BLOCKING',
        message: driverRes.conflictDetails || 'تعارض في علاقة السائق بالناقل.',
        messageAr: driverRes.conflictDetails || 'تعارض في علاقة السائق بالناقل.',
        resolvable: false,
        blocking: true,
      });
    }

    // E. Truck Carrier Conflict
    const truckRes = row.entityResolutions?.truck;
    if (truckRes?.relationshipStatus === 'RELATIONSHIP_CONFLICT') {
      issues.push({
        issueId: `ISSUE-${row.rowNumber}-TRK-CAR-CONFLICT`,
        row: row.rowNumber,
        field: 'truckPlate',
        code: 'RELATIONSHIP_CONFLICT',
        severity: 'BLOCKING',
        message: truckRes.conflictDetails || 'تعارض في علاقة الشاحنة بالناقل.',
        messageAr: truckRes.conflictDetails || 'تعارض في علاقة الشاحنة بالناقل.',
        resolvable: false,
        blocking: true,
      });
    }

    // F. Material Scope Validation
    if (canonical.materialName || canonical.materialId) {
      const matName = normalizeName(String(canonical.materialName || ''));
      const matId = String(canonical.materialId || '');
      const knownMaterials = context.knownEntities?.materials || [];
      const matchedMat = knownMaterials.find(
        (m) => normalizeName(m.name) === matName || m.code === matId || m.materialId === matId
      );
      if (!matchedMat && knownMaterials.length > 0) {
        issues.push({
          issueId: `ISSUE-${row.rowNumber}-MAT-UNKNOWN`,
          row: row.rowNumber,
          field: 'materialName',
          code: 'UNRESOLVED_MATERIAL',
          severity: 'BLOCKING',
          message: `المادة غير معرّفة في المشروع [${canonical.materialName || canonical.materialId}]`,
          messageAr: `المادة غير معرّفة في المشروع [${canonical.materialName || canonical.materialId}]`,
          resolvable: false,
          blocking: true,
        });
      }
    }

    return issues;
  }
}

export class DriverTruckImportDuplicateChecker {
  public checkDuplicates(rows: ImportRow[], context: PipelineContext): ImportRow[] {
    const seenPlates = new Set<string>();
    const seenDriverIds = new Set<string>();

    return rows.map((row) => {
      const canonical = row.canonical || row.raw || {};
      const validationIssues = [...row.validationIssues];

      // Plate Duplicates Check
      if (canonical.truckPlate) {
        const normPlate = normalizePlate(canonical.truckPlate);

        // Internal Batch duplicate check
        if (seenPlates.has(normPlate)) {
          validationIssues.push({
            issueId: `ISSUE-${row.rowNumber}-DUP-TRK-BATCH`,
            row: row.rowNumber,
            field: 'truckPlate',
            code: 'DUPLICATE_PLATE',
            severity: 'BLOCKING',
            message: `لوحة مكررة في الملف: ${canonical.truckPlate}`,
            messageAr: `لوحة مكررة في الملف: ${canonical.truckPlate}`,
            resolvable: false,
            blocking: true,
          });
        }
        seenPlates.add(normPlate);

        // Firestore database duplicate check
        const dbDup = context.knownEntities?.trucks?.some(
          (t) => normalizePlate(t.plate) === normPlate && !row.entityResolutions?.truck?.matchedId
        );
        if (dbDup) {
          validationIssues.push({
            issueId: `ISSUE-${row.rowNumber}-DUP-TRK-DB`,
            row: row.rowNumber,
            field: 'truckPlate',
            code: 'DUPLICATE_PLATE',
            severity: 'BLOCKING',
            message: `الشاحنة مسجلة مسبقاً في قاعدة البيانات برقم اللوحة: ${canonical.truckPlate}`,
            messageAr: `الشاحنة مسجلة مسبقاً في قاعدة البيانات برقم اللوحة: ${canonical.truckPlate}`,
            resolvable: false,
            blocking: true,
          });
        }
      }

      // Driver Identity Duplicates Check
      if (canonical.driverIdentity) {
        const normId = normalizeIdNumber(canonical.driverIdentity);

        // Internal Batch duplicate check
        if (seenDriverIds.has(normId)) {
          validationIssues.push({
            issueId: `ISSUE-${row.rowNumber}-DUP-DRV-BATCH`,
            row: row.rowNumber,
            field: 'driverIdentity',
            code: 'DUPLICATE_DRIVER',
            severity: 'BLOCKING',
            message: `هوية السائق مكررة في الملف: ${canonical.driverIdentity}`,
            messageAr: `هوية السائق مكررة في الملف: ${canonical.driverIdentity}`,
            resolvable: false,
            blocking: true,
          });
        }
        seenDriverIds.add(normId);

        // Firestore database duplicate check
        const dbDup = context.knownEntities?.drivers?.some(
          (d) => d.idNumber === normId && !row.entityResolutions?.driver?.matchedId
        );
        if (dbDup) {
          validationIssues.push({
            issueId: `ISSUE-${row.rowNumber}-DUP-DRV-DB`,
            row: row.rowNumber,
            field: 'driverIdentity',
            code: 'DUPLICATE_DRIVER',
            severity: 'BLOCKING',
            message: `السائق مسجل مسبقاً في قاعدة البيانات برقم الهوية: ${canonical.driverIdentity}`,
            messageAr: `السائق مسجل مسبقاً في قاعدة البيانات برقم الهوية: ${canonical.driverIdentity}`,
            resolvable: false,
            blocking: true,
          });
        }
      }

      const reviewStatus = validationIssues.length > 0 ? 'error' : 'accepted';

      return {
        ...row,
        validationIssues,
        reviewStatus,
        status: validationIssues.length > 0 ? 'ERROR' : 'VALID',
      };
    });
  }
}

export class DriverTruckImportCommitter {
  public async commit(batch: UnifiedImportBatch, context: PipelineContext): Promise<ImportResult> {
    const activeRows = batch.rows.filter((r) => r.status !== 'REJECTED' && r.reviewStatus !== 'error');
    const committedIds: string[] = [];
    const importErrors: ImportIssue[] = [];
    let failedRowsCount = 0;

    const token = await auth.currentUser?.getIdToken();

    for (const row of activeRows) {
      const canonical = row.canonical || row.raw || {};
      const carrierId = row.entityResolutions?.carrier?.matchedId || canonical.carrierId;
      const materialId = row.entityResolutions?.material?.matchedId || canonical.materialId || canonical.materialCode;

      if (!carrierId) {
        failedRowsCount++;
        importErrors.push({
          issueId: `ISSUE-${row.rowNumber}-CARRIER-MISSING`,
          row: row.rowNumber,
          field: 'carrierName',
          code: 'MISSING_CARRIER_ID',
          severity: 'BLOCKING',
          message: 'فشل الاستيراد لعدم تحديد معرف الناقل.',
          messageAr: 'فشل الاستيراد لعدم تحديد معرف الناقل.',
          resolvable: false,
          blocking: true,
        });
        continue;
      }

      // Convert canonical import row keys to canonical intake payload
      const payload = {
        projectId: batch.projectId,
        carrierId: carrierId,
        materialId: materialId,
        driverName: (canonical.driverName || '').trim(),
        plateNumber: (canonical.truckPlate || '').trim().toUpperCase(),
        phone: (canonical.driverPhone || '').trim() || undefined,
        residencyId: (canonical.driverIdentity || '').trim() || undefined,
      };

      try {
        const response = await fetch(`${getApiBase()}/api/intake/canonical`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `HTTP ${response.status}`);
        }

        const resData = await response.json();
        if (resData.affiliationId) {
          committedIds.push(resData.affiliationId);
        } else if (resData.assignmentId) {
          committedIds.push(resData.assignmentId);
        } else {
          committedIds.push(`COM-${row.rowNumber}-${Date.now()}`);
        }
      } catch (err: any) {
        console.error('Import Row commitment failed:', err);
        failedRowsCount++;
        importErrors.push({
          issueId: `ISSUE-${row.rowNumber}-INTAKE-FAIL`,
          row: row.rowNumber,
          field: 'driverName',
          code: 'CANONICAL_INTAKE_FAILED',
          severity: 'BLOCKING',
          message: `فشل الحفظ عبر البوابة الموحدة: ${err.message || 'خطأ غير معروف'}`,
          messageAr: `فشل الحفظ عبر البوابة الموحدة: ${err.message || 'خطأ غير معروف'}`,
          resolvable: false,
          blocking: true,
        });
      }
    }

    return {
      importBatchId: batch.importBatchId,
      projectId: batch.projectId,
      operationId: context.operationId,
      sourceType: batch.source.sourceType,
      success: failedRowsCount < activeRows.length,
      totalRows: batch.totalRows,
      committedRows: activeRows.length - failedRowsCount,
      skippedRows: (batch.totalRows - activeRows.length) + failedRowsCount,
      failedRows: failedRowsCount,
      issues: [...(batch.issues || []), ...importErrors],
      committedEntityIds: committedIds,
      executedAt: new Date().toISOString(),
    };
  }
}
