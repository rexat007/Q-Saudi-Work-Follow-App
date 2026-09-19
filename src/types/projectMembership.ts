import { Timestamp } from 'firebase/firestore';
import { BaseAuditedEntity } from './common';

/**
 * ============================================================================
 * PHASE 6 — UNIT 2A: PROJECT MEMBERSHIP CONTRACTS
 * ============================================================================
 * Subcollection-based project memberships for Driver, Truck, Carrier, and Material.
 *
 * Core Concept:
 * "Is Global Entity X part of / authorized for Project P?"
 *
 * Strict Architectural Boundaries:
 * - Membership document ID is the canonical Global Entity ID (driverId, truckId, carrierId, materialId).
 * - Membership path: /projects/{projectId}/{entityType}_memberships/{entityId}
 * - REDUNDANT_MEMBERSHIP_KEYS = ZERO: No redundant membershipId or duplicate entityId.
 * - GLOBAL_PROFILE_DUPLICATION = ZERO: No copying of nationalId, phone, name, plate, CR, code.
 * - CARRIER_ID_EMBEDDING = OMITTED: Membership represents project participation, not truck/driver-to-carrier assignment.
 * - ASSIGNMENTS & ROSTER = ZERO: Operational driver-truck / truck-material assignments are NOT part of membership.
 */

export type MembershipStatus = 'ACTIVE' | 'SUSPENDED' | 'REMOVED';

/**
 * Common Membership Base Contract
 * projectId is retained inside document for Firestore collection-group indexing / offline serialization.
 */
export interface BaseProjectMembershipEntity extends BaseAuditedEntity {
  /** Enclosing Project ID (proven requirement for collection-group queries & offline indexing) */
  projectId: string;
  /** Canonical operational participation status */
  status: MembershipStatus;
  /** Status transition timestamp metadata */
  statusChangedAt?: Timestamp | Date;
  /** Optional reason for status change (e.g. suspension or removal justification) */
  statusReason?: string;
}

/**
 * 1. Project Driver Membership
 * Document path: /projects/{projectId}/driver_memberships/{driverId}
 */
export interface ProjectDriverMembershipEntity extends BaseProjectMembershipEntity {
  /** Canonical reference to root Global Driver */
  driverId: string;
}

/**
 * 2. Project Truck Membership
 * Document path: /projects/{projectId}/truck_memberships/{truckId}
 */
export interface ProjectTruckMembershipEntity extends BaseProjectMembershipEntity {
  /** Canonical reference to root Global Truck */
  truckId: string;
}

/**
 * 3. Project Carrier Membership
 * Document path: /projects/{projectId}/carrier_memberships/{carrierId}
 */
export interface ProjectCarrierMembershipEntity extends BaseProjectMembershipEntity {
  /** Canonical reference to root Global Carrier */
  carrierId: string;
}

/**
 * 4. Project Material Membership
 * Document path: /projects/{projectId}/material_memberships/{materialId}
 */
export interface ProjectMaterialMembershipEntity extends BaseProjectMembershipEntity {
  /** Canonical reference to root Global Material */
  materialId: string;
}
