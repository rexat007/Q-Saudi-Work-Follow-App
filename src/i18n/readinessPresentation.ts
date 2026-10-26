import type { SetupRecommendedAction } from '../types/setupReadiness';
export interface ReadinessSection { ready: boolean; blockers: { code: string; entityId?: string; recommendedAction?: SetupRecommendedAction }[] }
export interface EvaluatedReadinessView {
  projectId: string;
  ready: boolean;
  lifecycle: ReadinessSection;
  setup: ReadinessSection & { evaluated: true; ownerPhase: 'PHASE_6' };
  operational: ReadinessSection;
}
export function isEvaluatedReadiness(value: any, projectId: string): value is EvaluatedReadinessView {
  return value?.projectId === projectId && typeof value.ready === 'boolean' && value.setup?.evaluated === true && value.setup.ownerPhase === 'PHASE_6' &&
    ['lifecycle', 'setup', 'operational'].every(key => typeof value[key]?.ready === 'boolean' && Array.isArray(value[key]?.blockers) && value[key].blockers.every((b: any) => typeof b?.code === 'string' && (b.entityId === undefined || typeof b.entityId === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(b.entityId)) && (b.recommendedAction === undefined || ['OPEN_FOUNDATION', 'OPEN_CARRIERS', 'OPEN_MATERIALS', 'OPEN_ROSTER', 'RETRY_READINESS'].includes(b.recommendedAction))));
}
/** Closed mapping: persisted details and server prose never become translated business decisions. */
export function readinessBlockerKey(code: string): string {
  switch (code) {
    case 'SETUP_FOUNDATION_INCOMPLETE': case 'PROJECT_VALIDATION_FAILED': return 'readiness.foundation';
    case 'NO_USABLE_CARRIER': case 'NO_ACTIVE_CARRIER': return 'readiness.carrier';
    case 'NO_USABLE_MATERIAL': case 'NO_ACTIVE_MATERIAL': return 'readiness.material';
    case 'SETUP_RELATIONSHIP_INTEGRITY_ERROR': case 'PERSISTENCE_BOUNDARY_INVALID': return 'readiness.integrity';
    case 'SETUP_READ_UNAVAILABLE': return 'readiness.unavailable';
    case 'PROJECT_NOT_APPROVED': return 'readiness.notApproved';
    case 'PROJECT_ALREADY_ACTIVE': return 'readiness.alreadyActive';
    case 'FORBIDDEN_PROJECT_ACTIVATION': return 'setup.errors.denied';
    case 'NO_COMPLETE_OPERATIONAL_PATH': return 'readiness.noPath';
    case 'NO_APPLICABLE_PRICING': return 'readiness.pricing';
    default: return 'readiness.changed';
  }
}
