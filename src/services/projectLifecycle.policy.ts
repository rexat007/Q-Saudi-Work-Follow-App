import { ProjectEntity } from '../types/entities';

export type GovernanceProjectStatus = 'SETUP' | 'READY_FOR_REVIEW' | 'APPROVED';

/**
 * Legal governance transitions:
 * SETUP -> READY_FOR_REVIEW
 * READY_FOR_REVIEW -> APPROVED
 * READY_FOR_REVIEW -> SETUP
 * APPROVED -> READY_FOR_REVIEW
 * APPROVED -> SETUP
 * 
 * Note: ACTIVE is exclusively reached via ProjectActivationService.
 */
export const LEGAL_LIFECYCLE_TRANSITIONS: Record<string, ProjectEntity['status'][]> = {
  SETUP: ['READY_FOR_REVIEW'],
  READY_FOR_REVIEW: ['APPROVED', 'SETUP'],
  APPROVED: ['READY_FOR_REVIEW', 'SETUP'],
};

export function isValidLifecycleTransition(
  currentStatus: ProjectEntity['status'],
  targetStatus: ProjectEntity['status']
): boolean {
  const allowed = LEGAL_LIFECYCLE_TRANSITIONS[currentStatus];
  return !!allowed && allowed.includes(targetStatus);
}
