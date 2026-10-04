import { UnifiedImportBatch, ImportRow, ImportEntityResolutionInfo } from '../../types/unifiedImport';
import { normalizeName, normalizePlate } from '../../utils/normalization';

export type ReviewGroupEntityType = 'carrier' | 'material' | 'driver' | 'truck';

export type ReviewGroupStatus = 'AUTO_RESOLVED' | 'REVIEW_REQUIRED' | 'UNRESOLVED' | 'CONFLICT';

export interface RosterEntityReviewGroup {
  entityType: ReviewGroupEntityType;
  normalizedSourceKey: string;
  sourceValue: string;
  rowNumbers: number[];
  occurrenceCount: number;
  currentResolution?: ImportEntityResolutionInfo;
  candidates: any[];
  status: ReviewGroupStatus;
  matchedId?: string;
  matchedName?: string;
  recommendation?: string;
  riskLevel?: string;
  relationshipStatus?: string;
}

export interface DriverCreationDefaultsResult {
  driverName: string;
  residencyId: string;
  phone: string;
  carrierId?: string;
  hasConflict: boolean;
  conflicts: Record<string, string[]>;
}

export interface TruckCreationDefaultsResult {
  plateNumber: string;
  truckType: string;
  tareWeightKg?: number;
  maxGrossWeightKg?: number;
  carrierId?: string;
  hasConflict: boolean;
  conflicts: Record<string, string[]>;
}

export class RosterBatchReviewService {
  /**
   * Derives deterministic group key for a given row and entity type.
   * Enforces carrier-dependency context on driver and truck groups.
   */
  public static getGroupKey(row: ImportRow, entityType: ReviewGroupEntityType): string {
    const rawValue = this.extractSourceValue(row, entityType);
    if (!rawValue || rawValue === 'غير متوفر في المصدر') return '';

    const normValue = entityType === 'truck' ? normalizePlate(rawValue) : normalizeName(rawValue);
    if (!normValue) return '';

    if (entityType === 'carrier' || entityType === 'material') {
      return `${entityType}:${normValue}`;
    }

    // Driver and truck groups must preserve carrier context
    const carrierRes = row.entityResolutions?.carrier;
    const resolvedCarrierId = row.resolvedValues?.carrierId || carrierRes?.matchedId;
    const carrierContext = resolvedCarrierId || 'UNRESOLVED_CARRIER';

    return `${entityType}:${normValue}::carrier:${carrierContext}`;
  }

  /**
   * Derives unique entity review groups from an import batch without mutating rows.
   */
  public static getBatchReviewGroups(batch: UnifiedImportBatch): Record<ReviewGroupEntityType, RosterEntityReviewGroup[]> {
    const result: Record<ReviewGroupEntityType, RosterEntityReviewGroup[]> = {
      carrier: [],
      material: [],
      driver: [],
      truck: [],
    };

    if (!batch || !batch.rows) {
      return result;
    }

    const entityTypes: ReviewGroupEntityType[] = ['carrier', 'material', 'driver', 'truck'];

    entityTypes.forEach((entityType) => {
      const groupMap = new Map<string, RosterEntityReviewGroup>();

      batch.rows.forEach((row) => {
        const res = row.entityResolutions?.[entityType];
        const rawValue = this.extractSourceValue(row, entityType);
        if (!rawValue || rawValue === 'غير متوفر في المصدر') return;

        const groupKey = this.getGroupKey(row, entityType);
        if (!groupKey) return;

        if (!groupMap.has(groupKey)) {
          const groupStatus = this.determineGroupStatus(res);
          groupMap.set(groupKey, {
            entityType,
            normalizedSourceKey: groupKey,
            sourceValue: res?.sourceValue || res?.originalValue || rawValue,
            rowNumbers: [row.rowNumber],
            occurrenceCount: 1,
            currentResolution: res,
            candidates: res?.candidates || [],
            status: groupStatus,
            matchedId: res?.matchedId,
            matchedName: res?.matchedName,
            recommendation: res?.recommendation,
            riskLevel: res?.riskLevel,
            relationshipStatus: res?.relationshipStatus,
          });
        } else {
          const group = groupMap.get(groupKey)!;
          group.rowNumbers.push(row.rowNumber);
          group.occurrenceCount++;

          // Upgrade status if any row has unresolved / review required / conflict
          const rowStatus = this.determineGroupStatus(res);
          if (rowStatus === 'CONFLICT') {
            group.status = 'CONFLICT';
          } else if (rowStatus === 'UNRESOLVED' && group.status !== 'CONFLICT') {
            group.status = 'UNRESOLVED';
          } else if (rowStatus === 'REVIEW_REQUIRED' && group.status === 'AUTO_RESOLVED') {
            group.status = 'REVIEW_REQUIRED';
          }

          if (res?.candidates && res.candidates.length > group.candidates.length) {
            group.candidates = res.candidates;
          }
          if (res?.matchedId && !group.matchedId) {
            group.matchedId = res.matchedId;
            group.matchedName = res.matchedName;
          }
        }
      });

      result[entityType] = Array.from(groupMap.values());
    });

    return result;
  }

  /**
   * Helper to determine group resolution status safely.
   * Enforces strict safety rules for AUTO_RESOLVED status.
   */
  public static determineGroupStatus(res?: ImportEntityResolutionInfo): ReviewGroupStatus {
    if (!res) return 'UNRESOLVED';

    const relStatus = res.relationshipStatus || 'VALID';
    const isConflict =
      relStatus === 'CONFLICT' ||
      relStatus === 'DRIVER_CARRIER_CONFLICT' ||
      relStatus === 'RELATIONSHIP_CONFLICT' ||
      relStatus === 'TRUCK_MATCHED_CARRIER_UNKNOWN' ||
      relStatus === 'MATERIAL_PROJECT_CONFLICT' ||
      res.riskLevel === 'CRITICAL';

    if (isConflict) {
      return 'CONFLICT';
    }

    if (!res.matchedId) {
      return 'UNRESOLVED';
    }

    if (res.recommendation === 'REJECT') {
      return 'UNRESOLVED';
    }

    if (
      res.recommendation === 'REVIEW' ||
      res.recommendation === 'FUZZY' ||
      res.matchMethod === 'FUZZY' ||
      res.matchMethod === 'AMBIGUOUS' ||
      res.ambiguous === true
    ) {
      return 'REVIEW_REQUIRED';
    }

    // Safety checks for AUTO_RESOLVED
    const isSafeMethod =
      res.matchMethod === 'EXACT' ||
      res.matchMethod === 'NORMALIZED' ||
      res.matchMethod === 'ALIAS' ||
      res.matchMethod === 'HUMAN_ACCEPTED' ||
      res.matchMethod === 'MANUAL';
    const isSafeRelationship = relStatus === 'VALID' || relStatus === 'NOT_APPLICABLE' || !relStatus;
    const isSafeRisk = res.riskLevel !== 'HIGH' && res.riskLevel !== 'CRITICAL';
    const isSafeRecommendation = res.recommendation === 'ACCEPT';
    const isAuthorized = res.isAuthorized !== false;
    const notAmbiguous = res.ambiguous !== true;

    if (
      res.matchedId &&
      isSafeRecommendation &&
      isSafeMethod &&
      isSafeRelationship &&
      isSafeRisk &&
      isAuthorized &&
      notAmbiguous
    ) {
      return 'AUTO_RESOLVED';
    }

    return 'REVIEW_REQUIRED';
  }

  /**
   * Extracts source value from row for a given entity type following priority chain
   */
  public static extractSourceValue(row: ImportRow, entityType: ReviewGroupEntityType): string {
    const res = row.entityResolutions?.[entityType];
    if (res?.sourceValue) return res.sourceValue;
    if (res?.originalValue) return res.originalValue;

    const canonical = row.canonical || {};
    const mapped = row.mapped || {};
    const raw = row.raw || {};

    if (entityType === 'carrier') {
      return canonical.carrierName || mapped.carrier || raw.carrier || raw['الناقل'] || '';
    }
    if (entityType === 'material') {
      return canonical.materialName || canonical.materialCode || mapped.materialType || mapped.materialName || raw.material || raw['المادة'] || '';
    }
    if (entityType === 'driver') {
      return canonical.driverName || mapped.driverName || raw.driverName || raw['اسم السائق'] || '';
    }
    if (entityType === 'truck') {
      return canonical.truckPlate || mapped.truckNo || mapped.truckPlate || raw.plate || raw['رقم اللوحة'] || '';
    }

    return '';
  }

  /**
   * Returns active row exceptions requiring human attention.
   * Includes non-rejected, non-committed rows with blocking errors, requires_review, warning, or duplicate status.
   */
  public static getRowExceptions(batch: UnifiedImportBatch): ImportRow[] {
    if (!batch || !batch.rows) return [];
    return batch.rows.filter((row) => {
      // Explicitly exclude REJECTED and COMMITTED rows
      if (row.status === 'REJECTED' || row.status === 'COMMITTED') {
        return false;
      }

      const hasBlocking = row.validationIssues?.some((i) => i.severity === 'BLOCKING' || i.blocking);
      const isError = row.status === 'ERROR' || row.reviewStatus === 'error';
      const isRequiresReview = row.reviewStatus === 'requires_review';
      const isWarning = row.status === 'WARNING';
      const isDuplicate = Boolean(row.duplicateInfo?.isDuplicate);

      return hasBlocking || isError || isRequiresReview || isWarning || isDuplicate;
    });
  }

  /**
   * Derives smart creation defaults for Driver creation forms from source rows belonging to exact group key.
   * Applies deterministic consensus rules across group rows.
   */
  public static deriveDriverCreationDefaults(
    batch: UnifiedImportBatch,
    group: RosterEntityReviewGroup
  ): DriverCreationDefaultsResult {
    if (!batch || !batch.rows || !group) {
      return {
        driverName: group?.sourceValue || '',
        residencyId: '',
        phone: '',
        hasConflict: false,
        conflicts: {},
      };
    }

    const matchingRows = batch.rows.filter((row) => {
      if (group.rowNumbers && group.rowNumbers.includes(row.rowNumber)) return true;
      return this.getGroupKey(row, 'driver') === group.normalizedSourceKey;
    });

    const driverNames = new Set<string>();
    const residencyIds = new Set<string>();
    const phones = new Set<string>();
    const carrierIds = new Set<string>();

    matchingRows.forEach((row) => {
      const canonical = row.canonical || {};
      const mapped = row.mapped || {};
      const raw = row.raw || {};
      const resolved = row.resolvedValues || {};

      const nameVal = (
        canonical.driverName ||
        mapped.driverName ||
        resolved.driverName ||
        raw.driverName ||
        raw['اسم السائق'] ||
        group.sourceValue ||
        ''
      ).toString().trim();
      if (nameVal) driverNames.add(nameVal);

      const residencyVal = (
        canonical.driverIdentity ||
        canonical.driverIdNumber ||
        canonical.residencyId ||
        canonical.idNumber ||
        canonical.nationalId ||
        mapped.driverIdentity ||
        mapped.driverIdNumber ||
        mapped.residencyId ||
        mapped.idNumber ||
        resolved.driverIdentity ||
        resolved.residencyId ||
        raw.driverIdentity ||
        raw.residencyId ||
        raw['رقم الهوية'] ||
        raw['الإقامة'] ||
        raw['رقم الإقامة'] ||
        ''
      ).toString().trim();
      if (residencyVal) residencyIds.add(residencyVal);

      const phoneVal = (
        canonical.driverPhone ||
        canonical.phone ||
        mapped.driverPhone ||
        mapped.phone ||
        resolved.driverPhone ||
        resolved.phone ||
        raw.driverPhone ||
        raw.phone ||
        raw['رقم الجوال'] ||
        raw['الجوال'] ||
        raw['الهاتف'] ||
        ''
      ).toString().trim();
      if (phoneVal) phones.add(phoneVal);

      const carrierVal = (
        group.currentResolution?.entityId ||
        group.currentResolution?.matchedId ||
        resolved.carrierId ||
        row.entityResolutions?.carrier?.matchedId ||
        row.entityResolutions?.carrier?.entityId ||
        ''
      ).toString().trim();
      if (carrierVal) carrierIds.add(carrierVal);
    });

    const conflicts: Record<string, string[]> = {};
    let hasConflict = false;

    if (driverNames.size > 1) {
      hasConflict = true;
      conflicts['اسم السائق'] = Array.from(driverNames);
    }
    if (residencyIds.size > 1) {
      hasConflict = true;
      conflicts['رقم الهوية/الإقامة'] = Array.from(residencyIds);
    }
    if (phones.size > 1) {
      hasConflict = true;
      conflicts['رقم الجوال'] = Array.from(phones);
    }

    const driverName = driverNames.size === 1 ? Array.from(driverNames)[0] : (group.sourceValue || '');
    const residencyId = residencyIds.size === 1 ? Array.from(residencyIds)[0] : '';
    const phone = phones.size === 1 ? Array.from(phones)[0] : '';
    const carrierId = carrierIds.size >= 1 ? Array.from(carrierIds)[0] : undefined;

    return {
      driverName,
      residencyId,
      phone,
      carrierId,
      hasConflict,
      conflicts,
    };
  }

  /**
   * Derives smart creation defaults for Truck creation forms from source rows belonging to exact group key.
   * Applies deterministic consensus rules across group rows.
   */
  public static deriveTruckCreationDefaults(
    batch: UnifiedImportBatch,
    group: RosterEntityReviewGroup
  ): TruckCreationDefaultsResult {
    if (!batch || !batch.rows || !group) {
      return {
        plateNumber: group?.sourceValue || '',
        truckType: '',
        hasConflict: false,
        conflicts: {},
      };
    }

    const matchingRows = batch.rows.filter((row) => {
      if (group.rowNumbers && group.rowNumbers.includes(row.rowNumber)) return true;
      return this.getGroupKey(row, 'truck') === group.normalizedSourceKey;
    });

    const plateNumbers = new Set<string>();
    const truckTypes = new Set<string>();
    const tareWeights = new Set<number>();
    const maxGrossWeights = new Set<number>();
    const carrierIds = new Set<string>();

    matchingRows.forEach((row) => {
      const canonical = row.canonical || {};
      const mapped = row.mapped || {};
      const raw = row.raw || {};
      const resolved = row.resolvedValues || {};

      const plateVal = (
        canonical.truckPlate ||
        canonical.plateNumber ||
        canonical.truckNo ||
        mapped.truckPlate ||
        mapped.truckNo ||
        mapped.plateNumber ||
        resolved.truckPlate ||
        raw.plate ||
        raw['رقم اللوحة'] ||
        group.sourceValue ||
        ''
      ).toString().trim();
      if (plateVal) plateNumbers.add(plateVal);

      const typeVal = (
        canonical.truckType ||
        canonical.type ||
        mapped.truckType ||
        mapped.type ||
        resolved.truckType ||
        raw.truckType ||
        raw['نوع الشاحنة'] ||
        raw['نوع المركبة'] ||
        ''
      ).toString().trim();
      if (typeVal) truckTypes.add(typeVal);

      const tare = canonical.tareWeightKg ?? canonical.tareWeight ?? mapped.tareWeightKg ?? mapped.tareWeight ?? resolved.tareWeightKg;
      if (tare !== undefined && tare !== null && !isNaN(Number(tare)) && Number(tare) > 0) {
        tareWeights.add(Number(tare));
      }

      const gross = canonical.maxGrossWeightKg ?? canonical.maxGrossWeight ?? mapped.maxGrossWeightKg ?? mapped.maxGrossWeight ?? resolved.maxGrossWeightKg;
      if (gross !== undefined && gross !== null && !isNaN(Number(gross)) && Number(gross) > 0) {
        maxGrossWeights.add(Number(gross));
      }

      const carrierVal = (
        group.currentResolution?.entityId ||
        group.currentResolution?.matchedId ||
        resolved.carrierId ||
        row.entityResolutions?.carrier?.matchedId ||
        row.entityResolutions?.carrier?.entityId ||
        ''
      ).toString().trim();
      if (carrierVal) carrierIds.add(carrierVal);
    });

    const conflicts: Record<string, string[]> = {};
    let hasConflict = false;

    if (plateNumbers.size > 1) {
      hasConflict = true;
      conflicts['رقم اللوحة'] = Array.from(plateNumbers);
    }
    if (truckTypes.size > 1) {
      hasConflict = true;
      conflicts['نوع الشاحنة'] = Array.from(truckTypes);
    }
    if (tareWeights.size > 1) {
      hasConflict = true;
      conflicts['الوزن الفارغ'] = Array.from(tareWeights).map(String);
    }
    if (maxGrossWeights.size > 1) {
      hasConflict = true;
      conflicts['الوزن الأقصى'] = Array.from(maxGrossWeights).map(String);
    }

    const plateNumber = plateNumbers.size === 1 ? Array.from(plateNumbers)[0] : (group.sourceValue || '');
    const truckType = truckTypes.size === 1 ? Array.from(truckTypes)[0] : '';
    const tareWeightKg = tareWeights.size === 1 ? Array.from(tareWeights)[0] : undefined;
    const maxGrossWeightKg = maxGrossWeights.size === 1 ? Array.from(maxGrossWeights)[0] : undefined;
    const carrierId = carrierIds.size >= 1 ? Array.from(carrierIds)[0] : undefined;

    return {
      plateNumber,
      truckType,
      tareWeightKg,
      maxGrossWeightKg,
      carrierId,
      hasConflict,
      conflicts,
    };
  }
}
