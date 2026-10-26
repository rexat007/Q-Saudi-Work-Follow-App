import type { GlobalKind } from '../utils/globalIdentityPolicy';
export interface ImportResolutionEntity {
  kind: GlobalKind; id: string; name: string; naturalKey?: string; aliases?: string[];
  globalStatus: string | null; membershipStatus: 'ACTIVE' | 'SUSPENDED' | 'REMOVED' | null;
  eligible: boolean; canReactivate: boolean;
  affiliation: { carrierId: string; status: 'ACTIVE' | 'INACTIVE' } | null;
  assignment?: { assignmentId: string; driverId: string; truckId: string } | null;
  allocation?: { allocationId: string; truckId: string; materialId: string } | null;
  issue?: string;
}
export interface ImportResolutionContext {
  lookup?: { kind: GlobalKind; naturalKey: string; matchedId: string|null };
  projectId: string; entities: ImportResolutionEntity[];
  activeDriverByTruck?: Record<string, string>; activeMaterialByTruck?: Record<string, string>;
}
export interface ImportResolutionReadOptions { resolution?: boolean; kind?: GlobalKind; naturalKey?: string }
