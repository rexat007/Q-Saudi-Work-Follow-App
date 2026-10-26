import type { GlobalKind } from '../utils/globalIdentityPolicy';
import type { ProjectFleetReadModelResponse } from './projectFleetReadModel';

/** Ephemeral administrative participation projection; never persisted. */
export interface SetupParticipant {
  kind: GlobalKind;
  id: string;
  name: string;
  naturalKey?: string;
  aliases?: string[];
  globalStatus: string | null;
  membershipStatus: 'ACTIVE' | 'SUSPENDED' | 'REMOVED';
  canReactivate: boolean;
  eligible: boolean;
  affiliation: { carrierId: string; status: 'ACTIVE' | 'INACTIVE' } | null;
  assignment?: { assignmentId: string; driverId: string; truckId: string } | null;
  allocation?: { allocationId: string; truckId: string; materialId: string } | null;
  issue?: string;
}
export interface SetupFleetContext {
  projectId: string;
  participants: SetupParticipant[];
  fleet: ProjectFleetReadModelResponse;
}
