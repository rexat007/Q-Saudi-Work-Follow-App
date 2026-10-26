import type { GlobalKind } from '../utils/globalIdentityPolicy';

/** Working review contract only; prepared keys are never persisted canonical IDs. */
export interface IntentEntity {
  key: string;
  kind: GlobalKind;
  label: string;
  prepared: boolean;
  carrierId?: string;
  plan?: Record<string, unknown>;
  rowNumbers: number[];
}
export interface IntentIssue {
  code: string;
  rowNumbers: number[];
}
export interface AssignmentIntent {
  driverId: string;
  truckId: string;
  action: 'NO_CHANGE' | 'ASSIGN' | 'REASSIGN';
  displaced: { assignmentId: string; driverId: string; truckId: string }[];
  rowNumbers: number[];
}
export interface AllocationIntent {
  truckId: string;
  materialId: string;
  action: 'NO_CHANGE' | 'ALLOCATE' | 'REALLOCATE';
  displaced: { allocationId: string; truckId: string; materialId: string } | null;
  rowNumbers: number[];
}
export interface RosterCanonicalIntent {
  projectId: string;
  rowDecisions: { rowNumber: number; status: 'CONTRIBUTING' | 'EXCLUDED' | 'BLOCKED'; entities: Partial<Record<'carrier' | 'driver' | 'truck' | 'material', string>> }[];
  entities: IntentEntity[];
  assignmentIntents: AssignmentIntent[];
  allocationIntents: AllocationIntent[];
  entityConsequences: { key: string; action: 'REUSE' | 'PREPARE_NEW' | 'ENROLL' | 'REACTIVATE' | 'AFFILIATE' | 'REACTIVATE_AFFILIATION'; completed: boolean; rowNumbers: number[] }[];
  blockers: IntentIssue[];
  warnings: IntentIssue[];
  requiresDisplacementApproval: boolean;
  signature: string;
}
export interface ReviewedCanonicalIntent {
  intent: RosterCanonicalIntent;
  acceptedSignature: string;
  displacementApprovedSignature?: string;
}
