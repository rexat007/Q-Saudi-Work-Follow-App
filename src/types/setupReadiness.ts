export type SetupRecommendedAction = 'OPEN_FOUNDATION' | 'OPEN_CARRIERS' | 'OPEN_MATERIALS' | 'OPEN_ROSTER' | 'RETRY_READINESS';
export interface SetupReadinessBlocker {
  category: 'SETUP' | 'DATA_INTEGRITY';
  ownerPhase: 'PHASE_6';
  code: 'SETUP_FOUNDATION_INCOMPLETE' | 'NO_USABLE_CARRIER' | 'NO_USABLE_MATERIAL' | 'SETUP_RELATIONSHIP_INTEGRITY_ERROR' | 'SETUP_READ_UNAVAILABLE';
  message: string;
  entityId?: string;
  recommendedAction?: SetupRecommendedAction;
}
export interface SetupReadinessResult {
  evaluated: true;
  ready: boolean;
  ownerPhase: 'PHASE_6';
  blockers: SetupReadinessBlocker[];
}
