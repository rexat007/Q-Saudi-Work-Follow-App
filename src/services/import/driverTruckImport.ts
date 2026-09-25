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

import { ExcelCsvColumnMapper } from './columnMapper.service';

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
 * Conforms to Unit 3 Roster Convergence architecture
 */

export class DriverTruckImportNormalizer {
  public normalize(raw: Record<string, any>, rowNumber: number): CanonicalDriverTruckRow {
    const canonical: CanonicalDriverTruckRow = { _rowNumber: rowNumber };
    canonical._raw = raw; // Preserve extra fields in source metadata without leaking into entity payload

    // Use shared ExcelCsvColumnMapper logic to identify fields
    const headers = Object.keys(raw);
    const mappings = ExcelCsvColumnMapper.mapHeaders(headers);
    
    const mapped: any = {};
    for (const [rawHeader, match] of Object.entries(mappings)) {
      if (match && match.confidence >= 0.70 && !match.isAmbiguous) {
        mapped[match.canonicalField] = raw[rawHeader];
      }
    }

    // Normalize canonical field values
    canonical.driverName = mapped.driverName ? String(mapped.driverName).trim() : '';
    canonical.driverPhone = mapped.driverPhone ? normalizePhone(String(mapped.driverPhone)) : '';
    canonical.driverIdentity = mapped.driverIdentity ? normalizeIdNumber(String(mapped.driverIdentity)) : '';
    
    // Map truckNo (from shared mapper) to truckPlate (roster canonical)
    const plateVal = mapped.truckNo || mapped.truckPlate || '';
    canonical.truckPlate = plateVal ? normalizePlate(String(plateVal)) : '';
    
    canonical.truckType = mapped.truckType ? String(mapped.truckType).trim() : '';
    canonical.carrierName = mapped.carrier ? String(mapped.carrier).trim() : '';
    
    // Map materialType (from shared mapper) to materialName (roster canonical)
    const matVal = mapped.materialType || mapped.materialName || '';
    canonical.materialName = matVal ? String(matVal).trim() : '';
    
    canonical.materialCode = mapped.materialCode ? String(mapped.materialCode).trim() : '';

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

    // 1. Resolve Carrier strictly from row input (matchedId required)
    const targetCarrierName = mapped.carrierName || '';

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
    // Material code may only be used to locate canonical entity, never assigned directly as matchedId
    const targetMaterial = mapped.materialName || mapped.materialCode || '';
    let materialId: string | undefined = undefined;
    let matchedMaterialName: string | undefined = undefined;
    let materialMatched = false;

    if (targetMaterial) {
      const normMaterial = normalizeName(targetMaterial);
      const matchedMat = context.knownEntities?.materials?.find(
        (m) =>
          normalizeName(m.name) === normMaterial ||
          (m.code && normalizeName(m.code) === normMaterial)
      );

      if (matchedMat) {
        materialId = matchedMat.materialId; // ALWAYS use canonical ID
        matchedMaterialName = matchedMat.name;
        materialMatched = true;
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

    // 3. Resolve Driver (using Exact identity search or Normalized unique name search)
    if (mapped.driverName) {
      const importId = mapped.driverIdentity || '';
      const normName = normalizeName(mapped.driverName);

      let foundDriver: any = null;
      let matchMethod: 'EXACT' | 'NORMALIZED' | 'FUZZY' | 'NONE' = 'NONE';
      let confidence = 0;
      let fuzzyCandidate: any = null;

      // Try EXACT match by ID number first
      if (importId) {
        foundDriver = context.knownEntities?.drivers?.find((d) => d.idNumber === importId || d.driverId === importId);
        if (foundDriver) {
          matchMethod = 'EXACT';
          confidence = 100;
        }
      }

      // Try NORMALIZED unique match by name
      if (!foundDriver) {
        const normalizedMatches = context.knownEntities?.drivers?.filter((d) => normalizeName(d.name) === normName) || [];
        if (normalizedMatches.length === 1) {
          foundDriver = normalizedMatches[0];
          matchMethod = 'NORMALIZED';
          confidence = 90;
        } else if (normalizedMatches.length > 1) {
          // Multiple candidates -> ambiguous, requires review
          matchMethod = 'FUZZY';
          confidence = 60;
          fuzzyCandidate = normalizedMatches[0];
        }
      }

      // Try FUZZY match by partial name (simple inclusion check)
      if (!foundDriver && matchMethod !== 'FUZZY') {
        const fuzzyMatches = context.knownEntities?.drivers?.filter((d) => 
          normalizeName(d.name).includes(normName) || normName.includes(normalizeName(d.name))
        ) || [];
        if (fuzzyMatches.length > 0) {
          matchMethod = 'FUZZY';
          confidence = fuzzyMatches.length === 1 ? 75 : 60;
          fuzzyCandidate = fuzzyMatches[0];
          // Store as candidate, do NOT set foundDriver to resolve matchedId
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
      } else if (matchMethod === 'FUZZY') {
        riskLevel = 'HIGH';
      }

      resolutions.driver = {
        entityType: 'DRIVER',
        originalValue: mapped.driverName,
        matchedId: foundDriver?.driverId, // Undefined for fuzzy / ambiguous ambiguity
        matchedName: foundDriver?.name || fuzzyCandidate?.name,
        confidence,
        isExact: matchMethod === 'EXACT',
        matchMethod,
        relationshipStatus,
        riskLevel,
        conflictDetails,
        isAuthorized: foundDriver ? relationshipStatus === 'VALID' : true,
      };
    }

    // 4. Resolve Truck (using plate number)
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

    // F. Material Scope Validation (Fail-Closed)
    const materialRes = row.entityResolutions?.material;
    const hasMaterialInput = Boolean(canonical.materialName || canonical.materialId || canonical.materialCode);

    if (!hasMaterialInput || !materialRes || !materialRes.matchedId || !materialRes.isAuthorized) {
      issues.push({
        issueId: `ISSUE-${row.rowNumber}-MAT-UNRESOLVED`,
        row: row.rowNumber,
        field: 'materialName',
        code: 'UNRESOLVED_MATERIAL',
        severity: 'BLOCKING',
        message: 'المادة غير معرّفة أو غير مصرح بها في هذا المشروع.',
        messageAr: 'المادة غير معرّفة أو غير مصرح بها في هذا المشروع.',
        resolvable: false,
        blocking: true,
      });
    } else {
      const matName = normalizeName(String(canonical.materialName || canonical.materialCode || canonical.materialId || ''));
      const matId = String(materialRes.matchedId);
      const knownMaterials = context.knownEntities?.materials || [];
      const matchedMat = knownMaterials.find(
        (m) => m.materialId === matId || normalizeName(m.name) === matName || (m.code && m.code.toLowerCase() === matName.toLowerCase())
      );
      if (!matchedMat) {
        issues.push({
          issueId: `ISSUE-${row.rowNumber}-MAT-UNKNOWN`,
          row: row.rowNumber,
          field: 'materialName',
          code: 'UNRESOLVED_MATERIAL',
          severity: 'BLOCKING',
          message: `المادة غير معرّفة في المشروع [${canonical.materialName || canonical.materialId || canonical.materialCode}]`,
          messageAr: `المادة غير معرّفة في المشروع [${canonical.materialName || canonical.materialId || canonical.materialCode}]`,
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
    const seenPlates = new Map<string, ImportRow>();
    const seenDriverIds = new Map<string, ImportRow>();

    return rows.map((row) => {
      const canonical = row.canonical || row.raw || {};
      const validationIssues = [...row.validationIssues];

      // Plate Duplicates Check
      if (canonical.truckPlate) {
        const normPlate = normalizePlate(canonical.truckPlate);

        // Internal Batch duplicate check
        if (seenPlates.has(normPlate)) {
          const existingRow = seenPlates.get(normPlate);
          const existingCanonical = existingRow?.canonical || existingRow?.raw || {};
          const isConflict = Boolean(
            (existingCanonical.driverIdentity && canonical.driverIdentity && existingCanonical.driverIdentity !== canonical.driverIdentity) ||
            (existingCanonical.carrierName && canonical.carrierName && normalizeName(existingCanonical.carrierName) !== normalizeName(canonical.carrierName))
          );

          validationIssues.push({
            issueId: `ISSUE-${row.rowNumber}-DUP-TRK-BATCH`,
            row: row.rowNumber,
            field: 'truckPlate',
            code: isConflict ? 'PLATE_CONFLICT' : 'SAME_ENTITY_DUPLICATE',
            severity: isConflict ? 'BLOCKING' : 'WARNING',
            message: isConflict ? `تعارض في بيانات الشاحنة: لوحة مكررة ببيانات مختلفة` : `لوحة مكررة في الملف: ${canonical.truckPlate}`,
            messageAr: isConflict ? `تعارض في بيانات الشاحنة: لوحة مكررة ببيانات مختلفة` : `لوحة مكررة في الملف: ${canonical.truckPlate}`,
            resolvable: false,
            blocking: isConflict,
          });
        } else {
          seenPlates.set(normPlate, row);
        }

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
          const existingRow = seenDriverIds.get(normId);
          const existingCanonical = existingRow?.canonical || existingRow?.raw || {};
          const isConflict = Boolean(
            existingCanonical.driverName && canonical.driverName &&
            normalizeName(existingCanonical.driverName) !== normalizeName(canonical.driverName)
          );
          
          validationIssues.push({
            issueId: `ISSUE-${row.rowNumber}-DUP-DRV-BATCH`,
            row: row.rowNumber,
            field: 'driverIdentity',
            code: isConflict ? 'IDENTITY_CONFLICT' : 'SAME_ENTITY_DUPLICATE',
            severity: isConflict ? 'BLOCKING' : 'WARNING',
            message: isConflict ? `تعارض في بيانات السائق: هوية مكررة ببيانات مختلفة` : `هوية السائق مكررة في الملف: ${canonical.driverIdentity}`,
            messageAr: isConflict ? `تعارض في بيانات السائق: هوية مكررة ببيانات مختلفة` : `هوية السائق مكررة في الملف: ${canonical.driverIdentity}`,
            resolvable: false,
            blocking: isConflict,
          });
        } else {
          seenDriverIds.set(normId, row);
        }

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

      const hasBlocking = validationIssues.some(i => i.severity === 'BLOCKING' || i.blocking);
      const hasWarning = validationIssues.some(i => i.severity === 'WARNING');

      const reviewStatus = hasBlocking ? 'error' : hasWarning ? 'requires_review' : 'accepted';
      const status = hasBlocking ? 'ERROR' : hasWarning ? 'WARNING' : 'VALID';

      return {
        ...row,
        validationIssues,
        reviewStatus,
        status,
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
      const carrierId = row.entityResolutions?.carrier?.matchedId;
      const materialId = row.entityResolutions?.material?.matchedId || (canonical as any).materialId || context.knownEntities?.materials?.[0]?.materialId || 'MAT-DEFAULT';

      // Strict fail-closed: require row.entityResolutions?.carrier?.matchedId, no fallback to canonical.carrierId
      if (!carrierId) {
        failedRowsCount++;
        importErrors.push({
          issueId: `ISSUE-${row.rowNumber}-CARRIER-MISSING`,
          row: row.rowNumber,
          field: 'carrierName',
          code: 'MISSING_CARRIER_ID',
          severity: 'BLOCKING',
          message: 'فشل الاستيراد لعدم تحديد معرف الناقل المعتمد.',
          messageAr: 'فشل الاستيراد لعدم تحديد معرف الناقل المعتمد.',
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
