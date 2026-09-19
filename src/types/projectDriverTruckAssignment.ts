/**
 * ============================================================================
 * PHASE 6 — UNIT 2B-2: DRIVER ↔ TRUCK TEMPORAL ASSIGNMENT CONTRACTS
 * ============================================================================
 * Subcollection-based temporal operational assignments between Driver and Truck.
 *
 * Core Concept:
 * "During this operational interval in Project P, Driver D operates Truck T."
 *
 * Strict Architectural Boundaries:
 * - Historical assignments:
 *     /projects/{projectId}/driver_truck_assignments/{assignmentId}
 * - Active Driver slot:
 *     /projects/{projectId}/driver_active_assignments/{driverId}
 * - Active Truck slot:
 *     /projects/{projectId}/truck_active_assignments/{truckId}
 * - ONE ACTIVE TRUCK PER DRIVER, ONE ACTIVE DRIVER PER TRUCK
 * - CONTINUOUS TEMPORAL INTERVAL: effectiveFrom, effectiveTo (null when ACTIVE)
 * - CARRIER_ID_IN_ASSIGNMENT = ABSENT: Canonically resolved via Unit 2B-1 affiliations.
 * - MATERIAL_ID_IN_ASSIGNMENT = ABSENT: Governed by Unit 2C.
 * - GLOBAL_PROFILE_DUPLICATION = ZERO: No driverName, phone, nationalId, plate, specs.
 * - closedAt = ABSENT: effectiveTo serves as canonical close time.
 * - closedBy = ABSENT: Closure actor authority is owned by canonical auditService.
 * - ASSIGNMENT_ID_ENTROPY = 128_BITS (ASN-<32-char hex string>)
 */

export type AssignmentStatus = 'ACTIVE' | 'CLOSED';

/**
 * Historical Driver ↔ Truck Assignment Entity
 * Document path: /projects/{projectId}/driver_truck_assignments/{assignmentId}
 */
export interface ProjectDriverTruckAssignmentEntity {
  /** Unique opaque assignment ID: ASN-<32-char hex> */
  assignmentId: string;
  /** Enclosing Project ID */
  projectId: string;
  /** Canonical reference to root Global Driver */
  driverId: string;
  /** Canonical reference to root Global Truck */
  truckId: string;
  /** Operational lifecycle status: ACTIVE | CLOSED */
  status: AssignmentStatus;
  /** Canonical start time (ISO 8601 string or Timestamp string representation) */
  effectiveFrom: string;
  /** Canonical close time (ISO 8601 string or Timestamp string representation; null when ACTIVE) */
  effectiveTo: string | null;
  /** Creation audit timestamp */
  createdAt: string;
  /** Actor ID who created the assignment */
  createdBy: string;
}

/**
 * Minimal Active Slot Pointer Payload
 * Document paths:
 *   /projects/{projectId}/driver_active_assignments/{driverId}
 *   /projects/{projectId}/truck_active_assignments/{truckId}
 */
export interface ActiveAssignmentSlotPayload {
  /** Pointer to currently active assignment */
  assignmentId: string;
}
