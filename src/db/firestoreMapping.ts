/**
 * Read-Only Firestore-to-PostgreSQL Source Mapping & Inventory Framework
 * Architecture Authority: ARCH-R1 / Revision 1.2, Sections 7, 12, 17
 * Scope: AR2-U01 Read-only mapping schema, legacy identifier tracking, zero production mutations
 */

export interface FirestorePathDescriptor {
  pattern: string;
  targetTable: string;
  entityKind: string;
  scope: 'COMPANY' | 'PROJECT';
  legacyIdField: string;
  naturalKeyDescription: string;
}

export const FIRESTORE_TO_POSTGRES_MAPPINGS: readonly FirestorePathDescriptor[] = Object.freeze([
  {
    pattern: 'users/{uid}',
    targetTable: 'users',
    entityKind: 'USER',
    scope: 'COMPANY',
    legacyIdField: 'uid',
    naturalKeyDescription: 'Firebase UID'
  },
  {
    pattern: 'projects/{projectId}',
    targetTable: 'projects',
    entityKind: 'PROJECT',
    scope: 'COMPANY',
    legacyIdField: 'projectId',
    naturalKeyDescription: 'Project external ID (e.g. Q-PRJ-011)'
  },
  {
    pattern: 'projects/{projectId}/carriers/{carrierId}',
    targetTable: 'carriers',
    entityKind: 'CARRIER',
    scope: 'COMPANY',
    legacyIdField: 'carrierId',
    naturalKeyDescription: 'Normalized carrier commercial registration or company-unique external ID'
  },
  {
    pattern: 'projects/{projectId}/materials/{materialId}',
    targetTable: 'materials',
    entityKind: 'MATERIAL',
    scope: 'COMPANY',
    legacyIdField: 'materialId',
    naturalKeyDescription: 'Normalized material code (e.g. BASE_COARSE_AGG)'
  },
  {
    pattern: 'projects/{projectId}/drivers/{driverId}',
    targetTable: 'drivers',
    entityKind: 'DRIVER',
    scope: 'COMPANY',
    legacyIdField: 'driverId',
    naturalKeyDescription: 'HMAC of normalized national/residency ID (Iqama)'
  },
  {
    pattern: 'projects/{projectId}/trucks/{truckId}',
    targetTable: 'trucks',
    entityKind: 'TRUCK',
    scope: 'COMPANY',
    legacyIdField: 'truckId',
    naturalKeyDescription: 'Normalized license plate string'
  },
  {
    pattern: 'projects/{projectId}/driverTruckAssignments/{assignmentId}',
    targetTable: 'driver_truck_assignments',
    entityKind: 'DRIVER_TRUCK_ASSIGNMENT',
    scope: 'PROJECT',
    legacyIdField: 'assignmentId',
    naturalKeyDescription: 'Temporal pairing of driver and truck within valid period'
  },
  {
    pattern: 'projects/{projectId}/truckMaterialAllocations/{allocationId}',
    targetTable: 'truck_material_allocations',
    entityKind: 'TRUCK_MATERIAL_ALLOCATION',
    scope: 'PROJECT',
    legacyIdField: 'allocationId',
    naturalKeyDescription: 'Temporal pairing of truck and material within valid period'
  },
  {
    pattern: 'projects/{projectId}/driverCarrierAffiliations/{affiliationId}',
    targetTable: 'driver_carrier_affiliations',
    entityKind: 'DRIVER_CARRIER_AFFILIATION',
    scope: 'PROJECT',
    legacyIdField: 'affiliationId',
    naturalKeyDescription: 'Temporal affiliation between driver and carrier'
  },
  {
    pattern: 'projects/{projectId}/truckCarrierAffiliations/{affiliationId}',
    targetTable: 'truck_carrier_affiliations',
    entityKind: 'TRUCK_CARRIER_AFFILIATION',
    scope: 'PROJECT',
    legacyIdField: 'affiliationId',
    naturalKeyDescription: 'Temporal affiliation between truck and carrier'
  },
  {
    pattern: 'projects/{projectId}/pricingRules/{ruleId}',
    targetTable: 'pricing_rules',
    entityKind: 'PRICING_RULE',
    scope: 'PROJECT',
    legacyIdField: 'ruleId',
    naturalKeyDescription: 'Project-carrier-material tariff rule version'
  },
  {
    pattern: 'projects/{projectId}/trips/{tripId}',
    targetTable: 'trips',
    entityKind: 'TRIP',
    scope: 'PROJECT',
    legacyIdField: 'tripId',
    naturalKeyDescription: 'Sequential trip number per project'
  },
  {
    pattern: 'projects/{projectId}/importSessions/{sessionId}',
    targetTable: 'import_sessions',
    entityKind: 'IMPORT_SESSION',
    scope: 'PROJECT',
    legacyIdField: 'sessionId',
    naturalKeyDescription: 'Durable Smart Import session external ID with source hash and signature'
  },
  {
    pattern: 'projects/{projectId}/workspace/binding',
    targetTable: 'workspace_bindings',
    entityKind: 'WORKSPACE_BINDING',
    scope: 'PROJECT',
    legacyIdField: 'projectId',
    naturalKeyDescription: 'Google Drive and Sheets resource bindings'
  }
]);

export interface ParsedFirestorePath {
  matchedPattern: string;
  targetTable: string;
  entityKind: string;
  scope: 'COMPANY' | 'PROJECT';
  extractedIds: Record<string, string>;
}

/**
 * Identify canonical PostgreSQL destination for a given Firestore path
 * Read-only parser; zero external network operations
 */
export function resolveFirestorePath(path: string): ParsedFirestorePath | null {
  const normalized = path.replace(/^\/+|\/+$/g, '');
  const segments = normalized.split('/');

  for (const mapping of FIRESTORE_TO_POSTGRES_MAPPINGS) {
    const patternSegments = mapping.pattern.split('/');
    if (patternSegments.length !== segments.length) {
      continue;
    }

    let match = true;
    const extractedIds: Record<string, string> = {};

    for (let i = 0; i < patternSegments.length; i++) {
      const p = patternSegments[i];
      const s = segments[i];

      if (p.startsWith('{') && p.endsWith('}')) {
        const paramName = p.slice(1, -1);
        extractedIds[paramName] = s;
      } else if (p !== s) {
        match = false;
        break;
      }
    }

    if (match) {
      return {
        matchedPattern: mapping.pattern,
        targetTable: mapping.targetTable,
        entityKind: mapping.entityKind,
        scope: mapping.scope,
        extractedIds
      };
    }
  }

  return null;
}
