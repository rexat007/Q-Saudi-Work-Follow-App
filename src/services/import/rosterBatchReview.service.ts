import { UnifiedImportBatch, ImportRow, ImportEntityResolutionInfo } from '../../types/unifiedImport';
import { normalizeName } from '../../utils/normalization';

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

        const normKey = normalizeName(rawValue) || rawValue.trim().toUpperCase();
        if (!normKey) return;

        if (!groupMap.has(normKey)) {
          const groupStatus = this.determineGroupStatus(res);
          groupMap.set(normKey, {
            entityType,
            normalizedSourceKey: normKey,
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
          const group = groupMap.get(normKey)!;
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

          // Keep candidates if present
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
   * Helper to determine group resolution status safely
   */
  public static determineGroupStatus(res?: ImportEntityResolutionInfo): ReviewGroupStatus {
    if (!res) return 'UNRESOLVED';

    if (
      res.relationshipStatus === 'CONFLICT' ||
      res.relationshipStatus === 'DRIVER_CARRIER_CONFLICT' ||
      res.riskLevel === 'CRITICAL'
    ) {
      return 'CONFLICT';
    }

    if (
      res.matchedId &&
      (res.recommendation === 'ACCEPT' || res.isExact || res.confidence === 100) &&
      res.relationshipStatus !== 'DRIVER_CARRIER_CONFLICT' &&
      res.isAuthorized !== false
    ) {
      return 'AUTO_RESOLVED';
    }

    if (
      res.candidates &&
      res.candidates.length > 0 &&
      (res.recommendation === 'REVIEW' || res.recommendation === 'FUZZY' || !res.matchedId)
    ) {
      return 'REVIEW_REQUIRED';
    }

    if (!res.matchedId) {
      return 'UNRESOLVED';
    }

    return 'AUTO_RESOLVED';
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
      const isRequiresReview = row.reviewStatus === 'requires_review' || row.reviewStatus === 'error' || row.status === 'ERROR' || row.status === 'WARNING';
      return hasBlocking || isRequiresReview;
    });
  }
}
