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

    if (
      res.candidates &&
      res.candidates.length > 0 &&
      (res.recommendation === 'REVIEW' || res.recommendation === 'FUZZY' || res.matchMethod === 'FUZZY' || res.matchMethod === 'AMBIGUOUS' || !res.matchedId)
    ) {
      return 'REVIEW_REQUIRED';
    }

    if (!res.matchedId) {
      return 'UNRESOLVED';
    }

    // Safety checks for AUTO_RESOLVED
    const isSafeMethod = res.matchMethod === 'EXACT' || res.matchMethod === 'NORMALIZED' || res.matchMethod === 'ALIAS';
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

    if (res.matchMethod === 'FUZZY' || res.recommendation === 'REVIEW') {
      return 'REVIEW_REQUIRED';
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
   * Returns row-level blocking exceptions only (excluding auto-resolved rows)
   */
  public static getRowExceptions(batch: UnifiedImportBatch): ImportRow[] {
    if (!batch || !batch.rows) return [];
    return batch.rows.filter((row) => {
      const hasBlocking = row.validationIssues?.some((i) => i.severity === 'BLOCKING' || i.blocking);
      const isError = row.status === 'ERROR' || row.reviewStatus === 'error';
      return hasBlocking || isError;
    });
  }
}
