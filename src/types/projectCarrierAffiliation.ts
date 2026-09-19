import { BaseAuditedEntity } from './common';

/**
 * ============================================================================
 * PHASE 6 — UNIT 2B-1: PROJECT CARRIER FLEET AFFILIATION CONTRACTS
 * ============================================================================
 * Subcollection-based project carrier fleet affiliations for Driver and Truck.
 *
 * Core Concept:
 * "In Project P, which Carrier does Driver D / Truck T currently operate under?"
 *
 * Strict Architectural Boundaries:
 * - Document path:
 *     /projects/{projectId}/driver_carrier_affiliations/{driverId}
 *     /projects/{projectId}/truck_carrier_affiliations/{truckId}
 * - Document ID is the canonical entity ID (driverId or truckId).
 * - REDUNDANT_AFFILIATION_KEYS = ZERO: No redundant affiliationId or composite key.
 * - GLOBAL_PROFILE_DUPLICATION = ZERO: No copying of name, phone, plate, VIN, specs.
 * - GLOBAL_PII_DUPLICATION = ZERO: No nationalId, Iqama, personal contact info.
 * - MATERIAL_ID_IN_AFFILIATION = ABSENT: Material relationships belong to Unit 2C.
 * - CARRIER_MATERIAL_AUTHORIZATION = NOT_IMPLEMENTED: Derived from truck allocations later.
 * - DRIVER_TRUCK_ASSIGNMENT = NOT_IMPLEMENTED: Belongs to Unit 2B-2.
 */

export type AffiliationStatus = 'ACTIVE' | 'INACTIVE';

/**
 * Base Project Carrier Affiliation Contract
 * Contains only minimal proven fields.
 */
export interface BaseProjectCarrierAffiliationEntity extends BaseAuditedEntity {
  /** Enclosing Project ID */
  projectId: string;
  /** Canonical reference to active Project Carrier */
  carrierId: string;
  /** Operational affiliation status */
  status: AffiliationStatus;
}

/**
 * 1. Project Driver Carrier Affiliation
 * Document path: /projects/{projectId}/driver_carrier_affiliations/{driverId}
 */
export interface ProjectDriverCarrierAffiliationEntity extends BaseProjectCarrierAffiliationEntity {
  /** Canonical reference to root Global Driver */
  driverId: string;
}

/**
 * 2. Project Truck Carrier Affiliation
 * Document path: /projects/{projectId}/truck_carrier_affiliations/{truckId}
 */
export interface ProjectTruckCarrierAffiliationEntity extends BaseProjectCarrierAffiliationEntity {
  /** Canonical reference to root Global Truck */
  truckId: string;
}
