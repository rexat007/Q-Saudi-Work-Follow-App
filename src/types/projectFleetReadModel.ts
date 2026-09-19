/**
 * PHASE 6 — UNIT 2D: UNIFIED PROJECT FLEET / ROSTER READ-MODEL CONVERGENCE
 * 
 * Defines the canonical, non-authoritative, ephemeral, truck-centric read projection
 * for Project Fleet and Roster displays.
 */

export type FleetAssignmentStatus = 'ASSIGNMENT_ACTIVE' | 'UNASSIGNED_DRIVER';
export type FleetAllocationStatus = 'ALLOCATION_ACTIVE' | 'UNALLOCATED_MATERIAL';

export type FleetIntegrityIssueCode =
  | 'MISSING_CARRIER_AFFILIATION'
  | 'CARRIER_MISMATCH'
  | 'INVALID_DRIVER_ASSIGNMENT_POINTER'
  | 'INVALID_MATERIAL_ALLOCATION_POINTER';

export interface FleetIntegrityIssue {
  code: FleetIntegrityIssueCode;
  message: string;
}

/**
 * Canonical Project Fleet Row DTO (Truck-Centric)
 * Minimum necessary projection strictly adhering to PII minimization.
 * Excludes: driverPhone, nationalId, residencyId/Iqama, price, rate, pricingRuleId, rosterId.
 */
export interface ProjectFleetRowDTO {
  projectId: string;
  truckId: string;
  plateNumber: string;
  truckType: string;

  carrierId: string;
  carrierName: string;

  driverId: string | null;
  driverName: string | null;

  materialId: string | null;
  materialName: string | null;

  assignmentStatus: FleetAssignmentStatus;
  allocationStatus: FleetAllocationStatus;

  integrityIssues: FleetIntegrityIssue[];
}

/**
 * Response shape for the Project Fleet Read Model
 */
export interface ProjectFleetReadModelResponse {
  projectId: string;
  truckCount: number;
  rows: ProjectFleetRowDTO[];
  generatedAt: string;
}
