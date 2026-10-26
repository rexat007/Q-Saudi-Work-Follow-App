import { resolveCanonicalRoster } from './canonicalResolution';
import { RosterSourceError } from './rosterSourceContract';
import { ExcelCsvNormalizer } from './normalizer.service';
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
  normalizePlate,
  normalizeCode
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

export type DriverTruckCanonicalMappingTarget =
  | 'driverName'
  | 'driverPhone'
  | 'driverIdentity'
  | 'truckPlate'
  | 'truckType'
  | 'carrierName'
  | 'materialName'
  | 'materialCode'
  | 'tareWeightKg'
  | 'maxGrossWeightKg';

export interface RosterCanonicalFieldOption {
  value: DriverTruckCanonicalMappingTarget | 'unmapped';
  labelAr: string;
  labelEn: string;
}

export const ROSTER_CANONICAL_FIELD_OPTIONS: RosterCanonicalFieldOption[] = [
  { value: 'unmapped', labelAr: 'تجاهل / غير مرتبط', labelEn: 'Ignore / Unmapped' },
  { value: 'driverName', labelAr: 'اسم السائق', labelEn: 'Driver Name' },
  { value: 'driverPhone', labelAr: 'رقم الجوال', labelEn: 'Driver Phone' },
  { value: 'driverIdentity', labelAr: 'رقم الهوية / الإقامة', labelEn: 'Driver Identity / Iqama' },
  { value: 'truckPlate', labelAr: 'رقم اللوحة', labelEn: 'Truck Plate' },
  { value: 'truckType', labelAr: 'نوع الشاحنة', labelEn: 'Truck Type' },
  { value: 'carrierName', labelAr: 'اسم الناقل', labelEn: 'Carrier' },
  { value: 'materialName', labelAr: 'اسم المادة', labelEn: 'Material' },
  { value: 'materialCode', labelAr: 'كود المادة', labelEn: 'Material Code' },
  { value: 'tareWeightKg', labelAr: 'الوزن الفارغ (كجم)', labelEn: 'Tare Weight (kg)' },
  { value: 'maxGrossWeightKg', labelAr: 'الوزن الإجمالي الأقصى (كجم)', labelEn: 'Maximum Gross Weight (kg)' },
];

export function validateRosterMapping(headers: string[], mappings: Record<string, DriverTruckCanonicalMappingTarget | 'unmapped'>): string | null {
  const targets = new Set<string>();
  for (const [key, target] of Object.entries(mappings)) {
    if (target === 'unmapped') continue;
    if (!headers.includes(key) || !ROSTER_CANONICAL_FIELD_OPTIONS.some(o => o.value === target)) return 'MAPPING_SOURCE';
    if (targets.has(target)) return 'MAPPING_DUPLICATE';
    targets.add(target);
  }
  return targets.has('carrierName') && (targets.has('driverName') || targets.has('driverIdentity') || targets.has('truckPlate')) ? null : 'MAPPING_REQUIRED';
}

export function translateDiscoveryToRosterTarget(
  canonicalField?: string
): DriverTruckCanonicalMappingTarget | 'unmapped' {
  if (!canonicalField || String(canonicalField).startsWith('unmapped_')) {
    return 'unmapped';
  }
  switch (canonicalField) {
    case 'driverName':
      return 'driverName';
    case 'driverPhone':
      return 'driverPhone';
    case 'driverIdentity':
      return 'driverIdentity';
    case 'truckNo':
    case 'truckPlate':
      return 'truckPlate';
    case 'truckType':
      return 'truckType';
    case 'carrier':
    case 'carrierName':
      return 'carrierName';
    case 'materialType':
    case 'materialName':
      return 'materialName';
    case 'materialCode':
      return 'materialCode';
    case 'tareWeight':
    case 'tareWeightKg':
      return 'tareWeightKg';
    case 'grossWeight':
    case 'maxGrossWeightKg':
      return 'maxGrossWeightKg';
    default:
      return 'unmapped';
  }
}

/**
 * Driver & Truck Import Pipeline Stage Implementations
 * Conforms to Unit 3 Roster Convergence architecture
 */

export class DriverTruckImportNormalizer {
  public customMappings?: Record<string, DriverTruckCanonicalMappingTarget>;

  constructor(customMappings?: Record<string, DriverTruckCanonicalMappingTarget>) {
    this.customMappings = customMappings;
  }

  public normalize(
    raw: Record<string, any>,
    rowNumber: number,
    _context?: any,
    runtimeCustomMappings?: Record<string, DriverTruckCanonicalMappingTarget>
  ): CanonicalDriverTruckRow {
    const canonical: CanonicalDriverTruckRow = { _rowNumber: rowNumber };
    canonical._raw = raw; // Preserve extra fields in source metadata without leaking into entity payload

    const numeric = (value: unknown, field: 'tareWeightKg' | 'maxGrossWeightKg') => {
      if (value === undefined || value === null || String(value).trim() === '') return;
      const text = ExcelCsvNormalizer.convertArabicNumerals(String(value).replace(/٬/g, ''));
      const grouped = text.replace(/^[+-]?\d{1,3}(?:,\d{3})+(?:\.\d+)?(?=\s*(?:kg|كجم|كيلو|طن|tons?)?\s*$)/i, match => match.replace(/,/g, ''));
      const parsed = /[0-9]/.test(grouped) && /^[0-9\s,.+\-]+(?:kg|كجم|كيلو|طن|tons?)?$/i.test(grouped.trim()) ? ExcelCsvNormalizer.parseFlexibleNumber(grouped) : null;
      if (parsed === null || !Number.isFinite(parsed)) {
        (canonical._invalidNumericFields ||= []).push(field);
      } else canonical[field] = parsed;
    };
    const effectiveMappings = runtimeCustomMappings || this.customMappings;

    if (effectiveMappings && Object.keys(effectiveMappings).length > 0) {
      // Manual approved mappings take precedence deterministically
      const mapped: Partial<Record<DriverTruckCanonicalMappingTarget, any>> = {};

      const seen = new Set<string>();
      for (const [rawHeader, targetField] of Object.entries(effectiveMappings)) {
        if (targetField && targetField !== ('unmapped' as any) && raw[rawHeader] !== undefined && raw[rawHeader] !== null) {
          if (seen.has(targetField)) throw new RosterSourceError('MAPPING_DUPLICATE');
          seen.add(targetField);
          mapped[targetField] = raw[rawHeader];
        }
      }

      // Explicit target extraction only - unmapped / extra fields in raw do not leak into canonical payload fields
      canonical.driverName = mapped.driverName !== undefined ? String(mapped.driverName).trim() : '';
      canonical.driverPhone = mapped.driverPhone !== undefined ? normalizePhone(String(mapped.driverPhone)) : '';
      canonical.driverIdentity = mapped.driverIdentity !== undefined ? normalizeIdNumber(String(mapped.driverIdentity)) : '';
      canonical.truckPlate = mapped.truckPlate !== undefined ? normalizePlate(String(mapped.truckPlate)) : '';
      canonical.truckType = mapped.truckType !== undefined ? String(mapped.truckType).trim() : '';
      canonical.carrierName = mapped.carrierName !== undefined ? String(mapped.carrierName).trim() : '';
      canonical.materialName = mapped.materialName !== undefined ? String(mapped.materialName).trim() : '';
      canonical.materialCode = mapped.materialCode !== undefined ? normalizeCode(String(mapped.materialCode)) : '';

      numeric(mapped.tareWeightKg, 'tareWeightKg');
      numeric(mapped.maxGrossWeightKg, 'maxGrossWeightKg');
    } else {
      // Use shared ExcelCsvColumnMapper logic to identify fields (backward-compatible fallback)
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
      canonical.carrierName = mapped.carrier ? String(mapped.carrier).trim() : (mapped.carrierName ? String(mapped.carrierName).trim() : '');
      
      // Map materialType (from shared mapper) to materialName (roster canonical)
      const matVal = mapped.materialType || mapped.materialName || '';
      canonical.materialName = matVal ? String(matVal).trim() : '';
      
      canonical.materialCode = mapped.materialCode ? normalizeCode(String(mapped.materialCode)) : '';

      numeric(raw.tareWeightKg, 'tareWeightKg');
      numeric(raw.maxGrossWeightKg, 'maxGrossWeightKg');
    }
    
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
    return resolveCanonicalRoster(mapped, context);
  }
}

export class DriverTruckImportValidator {
  public validateRow(row: ImportRow<any, CanonicalDriverTruckRow>, context: PipelineContext): ImportIssue[] {
    const issues: ImportIssue[] = [];
    const canonical = row.canonical || row.raw || {};

    for (const field of canonical._invalidNumericFields || []) {
      issues.push({ issueId: `ISSUE-${row.rowNumber}-${field}`, row: row.rowNumber, field,
        code: 'INVALID_ROSTER_WEIGHT', severity: 'BLOCKING', message: 'INVALID_ROSTER_WEIGHT',
        resolvable: false, blocking: true });
    }

    const isDriverRow = Boolean(canonical.driverName || canonical.driverIdentity);
    const isTruckRow = Boolean(canonical.truckPlate);

    if (!isDriverRow && !isTruckRow && !(context.resolutionContext && (canonical.carrierName || canonical.carrierId || canonical.materialName || canonical.materialId || canonical.materialCode))) {
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
      if ((!canonical.driverName || canonical.driverName.trim() === '') && !row.entityResolutions?.driver?.matchedId) {
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
    if ((!carrierRes || !carrierRes.matchedId) && (!context.resolutionContext || isDriverRow || isTruckRow || canonical.carrierName || canonical.carrierId)) {
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

    for (const [key, resolution] of Object.entries(row.entityResolutions || {})) {
      if (resolution.resolutionReason && resolution.resolutionReason !== 'UNRESOLVED') issues.push({ issueId: `RES-${row.rowNumber}-${key}`, row: row.rowNumber, field:key, code:resolution.resolutionReason, severity:'BLOCKING', message:resolution.resolutionReason, blocking:true, resolvable:true });
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

    if (hasMaterialInput && (!materialRes || !materialRes.matchedId || !materialRes.isAuthorized)) {
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
    } else if (hasMaterialInput && materialRes?.matchedId) {
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
      if (context.resolutionContext && (row.status === 'REJECTED' || row.status === 'COMMITTED')) return row;
      const validationIssues = (row.validationIssues || []).filter(i => !context.resolutionContext || !/^ISSUE-.*-DUP-(TRK|DRV)-(BATCH|DB)$/.test(i.issueId));

      // Plate Duplicates Check
      if (canonical.truckPlate) {
        const normPlate = context.resolutionContext && row.entityResolutions?.truck?.matchedId || normalizePlate(canonical.truckPlate);

        // Internal Batch duplicate check
        if (seenPlates.has(normPlate)) {
          const existingRow = seenPlates.get(normPlate);
          const existingCanonical = existingRow?.canonical || existingRow?.raw || {};
          const isConflict = Boolean(
            (!(context.resolutionContext && row.entityResolutions?.driver?.matchedId && row.entityResolutions.driver.matchedId === existingRow?.entityResolutions?.driver?.matchedId) && existingCanonical.driverIdentity && canonical.driverIdentity && existingCanonical.driverIdentity !== canonical.driverIdentity) ||
            (!(context.resolutionContext && row.entityResolutions?.carrier?.matchedId && row.entityResolutions.carrier.matchedId === existingRow?.entityResolutions?.carrier?.matchedId) && existingCanonical.carrierName && canonical.carrierName && normalizeName(existingCanonical.carrierName) !== normalizeName(canonical.carrierName))
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
        const normId = context.resolutionContext && row.entityResolutions?.driver?.matchedId || normalizeIdNumber(canonical.driverIdentity);

        // Internal Batch duplicate check
        if (seenDriverIds.has(normId)) {
          const existingRow = seenDriverIds.get(normId);
          const existingCanonical = existingRow?.canonical || existingRow?.raw || {};
          const isConflict = Boolean(
            !(context.resolutionContext && row.entityResolutions?.driver?.matchedId && row.entityResolutions.driver.matchedId === existingRow?.entityResolutions?.driver?.matchedId) &&
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
    // P7-B3 handoff is review-only. The legacy endpoint infers identities/relations from raw rows.
    // Phase 8 must consume reviewedCanonicalIntent transactionally before this guard can be lifted.
    if (context.resolutionContext || batch.metadata?.reviewedCanonicalIntent || batch.metadata?.canonicalIntent) throw Error('PHASE8_REVIEWED_INTENT_HANDOFF_REQUIRED');
    const activeRows = batch.rows.filter((r) => r.status !== 'REJECTED' && r.reviewStatus !== 'error');
    const committedIds: string[] = [];
    const importErrors: ImportIssue[] = [];
    let failedRowsCount = 0;

    const token = await auth.currentUser?.getIdToken();

    for (const row of activeRows) {
      const canonical = row.canonical || row.raw || {};
      const carrierId = row.entityResolutions?.carrier?.matchedId;
      const materialId = row.entityResolutions?.material?.matchedId;

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

      // Strict fail-closed: require row.entityResolutions?.material?.matchedId, no fallback
      if (!materialId) {
        failedRowsCount++;
        importErrors.push({
          issueId: `ISSUE-${row.rowNumber}-MATERIAL-MISSING`,
          row: row.rowNumber,
          field: 'materialName',
          code: 'MISSING_MATERIAL_ID',
          severity: 'BLOCKING',
          message: 'فشل الاستيراد لعدم تحديد معرف المادة المعتمد.',
          messageAr: 'فشل الاستيراد لعدم تحديد معرف المادة المعتمد.',
          resolvable: false,
          blocking: true,
        });
        continue;
      }

      // Use prepared plans where available, otherwise canonical/raw
      const driverRes = row.entityResolutions?.driver;
      const truckRes = row.entityResolutions?.truck;
      const driverPlan = driverRes?.preparedDriverPlan;
      const truckPlan = truckRes?.preparedTruckPlan;

      // Idempotency check: if row already succeeded in prior partial commit
      if (row.status === 'COMMITTED') {
        committedIds.push(`COM-EXISTING-${row.rowNumber}`);
        continue;
      }

      const driverName = (driverPlan?.driverName || canonical.driverName || '').trim();
      const plateNumber = (truckPlan?.plateNumber || canonical.truckPlate || '').trim().toUpperCase();
      const phone = (driverPlan?.phone || canonical.driverPhone || '').trim();
      const residencyId = (driverPlan?.residencyId || canonical.driverIdentity || '').trim();
      const truckType = (truckPlan?.truckType || canonical.truckType || '').trim();
      const tareWeightKg = truckPlan?.tareWeightKg ?? canonical.tareWeightKg;
      const maxGrossWeightKg = truckPlan?.maxGrossWeightKg ?? canonical.maxGrossWeightKg;

      const payload = {
        projectId: batch.projectId,
        carrierId: carrierId,
        materialId: materialId,
        driverName,
        plateNumber,
        phone: phone || undefined,
        residencyId: residencyId || undefined,
        truckType: truckType || undefined,
        tareWeightKg: tareWeightKg || undefined,
        maxGrossWeightKg: maxGrossWeightKg || undefined,
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
        row.status = 'COMMITTED';
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

    const totalActive = activeRows.length;
    const isFullSuccess = totalActive > 0 && failedRowsCount === 0;

    return {
      importBatchId: batch.importBatchId,
      projectId: batch.projectId,
      operationId: context.operationId,
      sourceType: batch.source.sourceType,
      success: isFullSuccess,
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
