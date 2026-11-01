import { ProjectValidator } from '../validators/project.validator';
import type { ProjectEntity } from '../types/entities';
import type { SetupFleetContext } from '../types/setupFleet';
import type { SetupReadinessBlocker, SetupReadinessResult } from '../types/setupReadiness';
import {validateOperationalConfiguration,resolveReadinessRequirements} from '../services/operationalProfileResolver';

export function unavailableSetupReadiness(): SetupReadinessResult {
  return { evaluated: true, ready: false, ownerPhase: 'PHASE_6', blockers: [{ category: 'DATA_INTEGRITY', ownerPhase: 'PHASE_6', code: 'SETUP_READ_UNAVAILABLE', message: 'Setup data could not be verified.', recommendedAction: 'RETRY_READINESS' }] };
}
/** Completeness consumes canonical projections; no pricing, workspace or minimum Fleet population. */
export function evaluateSetupReadiness(project: ProjectEntity, context: SetupFleetContext, integrity: SetupReadinessBlocker[] = []): SetupReadinessResult {
  if (context.projectId !== project.projectId || context.fleet.projectId !== project.projectId) return unavailableSetupReadiness();
  const blockers: SetupReadinessBlocker[] = [...integrity];
  const add = (code: SetupReadinessBlocker['code'], message: string, recommendedAction: SetupReadinessBlocker['recommendedAction'], entityId?: string) => blockers.push({ category: code === 'SETUP_RELATIONSHIP_INTEGRITY_ERROR' ? 'DATA_INTEGRITY' : 'SETUP', ownerPhase: 'PHASE_6', code, message, recommendedAction, ...(entityId ? { entityId } : {}) });
  if (!ProjectValidator.validate(project).isValid) add('SETUP_FOUNDATION_INCOMPLETE', 'Project foundation is incomplete.', 'OPEN_FOUNDATION');
  const requiresRoster=!project.operationalConfiguration||resolveReadinessRequirements(validateOperationalConfiguration(project.operationalConfiguration)).preloadedRoster;
  if(project.operationalConfigurationRequired&&!project.operationalConfiguration)add('SETUP_FOUNDATION_INCOMPLETE','OPERATIONAL_CONFIGURATION_REQUIRED','OPEN_FOUNDATION');
  if (requiresRoster&&!context.participants.some(p => p.kind === 'CARRIER' && p.eligible && p.membershipStatus === 'ACTIVE')) add('NO_USABLE_CARRIER', 'No usable project carrier.', 'OPEN_CARRIERS');
  if (!context.participants.some(p => p.kind === 'MATERIAL' && p.eligible && p.membershipStatus === 'ACTIVE')) add('NO_USABLE_MATERIAL', 'No usable project material.', 'OPEN_MATERIALS');
  for (const p of context.participants) if (p.issue) add('SETUP_RELATIONSHIP_INTEGRITY_ERROR', 'Canonical setup data requires administrative review.', 'OPEN_ROSTER', p.id);
  for (const row of context.fleet.rows) if (row.classification === 'INTEGRITY_ERROR' || row.integrityIssues.some(i => i.category === 'INTEGRITY')) add('SETUP_RELATIONSHIP_INTEGRITY_ERROR', 'Canonical setup data requires administrative review.', 'OPEN_ROSTER', row.truckId);
  const unique = [...new Map(blockers.map(b => [`${b.code}/${b.entityId || ''}`, b])).values()];
  return { evaluated: true, ready: unique.length === 0, ownerPhase: 'PHASE_6', blockers: unique };
}
