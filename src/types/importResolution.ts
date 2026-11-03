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

export type BulkIdentityState='GLOBAL_ACTIVE_AND_PROJECT_READY'|'GLOBAL_EXISTS_MEMBERSHIP_MISSING'|'GLOBAL_EXISTS_MEMBERSHIP_INACTIVE'|'GLOBAL_EXISTS_AFFILIATION_MISSING'|'GLOBAL_EXISTS_AFFILIATION_INACTIVE'|'GLOBAL_EXISTS_WRONG_CARRIER'|'GLOBAL_INELIGIBLE'|'GLOBAL_AMBIGUOUS'|'NOT_FOUND'|'SOURCE_CONFLICT';
export interface BulkIdentityQuery {key:string;kind:GlobalKind;naturalKey:string;carrierId?:string;expectedPeerId?:string;materialId?:string}
export interface BulkIdentityResult extends BulkIdentityQuery {state:BulkIdentityState;entity?:ImportResolutionEntity;carrier?:ImportResolutionEntity}
