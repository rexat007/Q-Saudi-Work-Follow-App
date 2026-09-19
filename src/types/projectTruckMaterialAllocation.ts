/**
 * ============================================================================
 * PHASE 6 — UNIT 2C: TRUCK ↔ MATERIAL TEMPORAL ALLOCATION CONTRACTS
 * ============================================================================
 * Subcollection-based temporal operational allocation between Truck and Material.
 *
 * Core Concept:
 * "Which Project Material is Truck T currently allocated to haul?"
 *
 * Strict Architectural Boundaries:
 * - Historical allocations:
 *     /projects/{projectId}/truck_material_allocations/{allocationId}
 * - Active Truck Material slot:
 *     /projects/{projectId}/truck_active_material_allocations/{truckId}
 * - ONE ACTIVE MATERIAL PER TRUCK PER PROJECT (TRUCK_ACTIVE_MATERIAL_CARDINALITY = ONE)
 * - CONTINUOUS TEMPORAL INTERVAL: effectiveFrom, effectiveTo (null when ACTIVE)
 * - CARRIER_ID_IN_ALLOCATION = ABSENT: Canonically resolved via Unit 2B-1 affiliations.
 * - DRIVER_ID_IN_ALLOCATION = ABSENT: Governed by Unit 2B-2 assignments.
 * - PRICING_RULE_ID_IN_ALLOCATION = ABSENT: Governed independently by Pricing domain.
 * - PRICE_IN_ALLOCATION = ABSENT: No commercial rates stored.
 * - GLOBAL_PROFILE_DUPLICATION = ZERO: No truckPlate, materialName, materialCode.
 * - closedAt = ABSENT: effectiveTo serves as canonical close time.
 * - closedBy = ABSENT: Closure actor authority is owned by canonical auditService.
 * - ALLOCATION_ID_ENTROPY = 128_BITS (TMA-<32-char hex string>)
 */

export type AllocationStatus = 'ACTIVE' | 'CLOSED';

/**
 * Historical Truck ↔ Material Allocation Entity
 * Document path: /projects/{projectId}/truck_material_allocations/{allocationId}
 */
export interface ProjectTruckMaterialAllocationEntity {
  /** Unique opaque allocation ID: TMA-<32-char hex> (128 bits) */
  allocationId: string;
  /** Enclosing Project ID */
  projectId: string;
  /** Canonical reference to root Global Truck */
  truckId: string;
  /** Canonical reference to authorized Project Material */
  materialId: string;
  /** Operational lifecycle status: ACTIVE | CLOSED */
  status: AllocationStatus;
  /** Canonical start time (ISO 8601 UTC string representation) */
  effectiveFrom: string;
  /** Canonical close time (ISO 8601 UTC string representation; null when ACTIVE) */
  effectiveTo: string | null;
  /** Creation audit timestamp (ISO 8601 UTC string) */
  createdAt: string;
  /** Actor ID who authorized the allocation */
  createdBy: string;
}

/**
 * Minimal Active Slot Pointer Payload
 * Document path: /projects/{projectId}/truck_active_material_allocations/{truckId}
 */
export interface ActiveTruckMaterialSlotPayload {
  /** Pointer to currently active allocation */
  allocationId: string;
}

/**
 * Generator for opaque Allocation ID: TMA-<32-char hex string> (128 bits cryptographic entropy)
 */
export function generateOpaqueAllocationId(): string {
  if (typeof globalThis !== 'undefined' && globalThis.crypto) {
    if (typeof globalThis.crypto.randomUUID === 'function') {
      const uuidHex = globalThis.crypto.randomUUID().replace(/-/g, '').toLowerCase();
      return `TMA-${uuidHex}`;
    }
    if (typeof globalThis.crypto.getRandomValues === 'function') {
      const bytes = new Uint8Array(16); // 128 bits
      globalThis.crypto.getRandomValues(bytes);
      const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
      return `TMA-${hex}`;
    }
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const nodeCrypto = require('crypto');
    const hex = nodeCrypto.randomBytes(16).toString('hex');
    return `TMA-${hex}`;
  } catch {
    throw new Error('SECURE_CRYPTO_UNAVAILABLE: Cryptographic random generator is required for allocation ID creation');
  }
}
