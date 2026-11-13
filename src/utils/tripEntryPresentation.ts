import type {AuthUserContext} from '../types/common';
import type {ProjectEntity} from '../types/entities';
import type {ProjectFleetRowDTO} from '../types/projectFleetReadModel';
import {navigationService} from '../services/navigation.service';
import {canPresentProjectAction} from './permissions';

/** Navigation presentation only; server commands still reauthorize every action. */
export function tripEntryTarget(actor: AuthUserContext | undefined, project: ProjectEntity | undefined, intent: 'OPERATIONS' | 'FLEET') {
  if (!actor?.userId || !project?.projectId || project.projectId === 'ALL') return null;
  const scoped = actor.role === 'SUPER_ADMIN' || actor.assignedProjectIds?.includes(project.projectId);
  if (!scoped) return null;
  if (intent === 'OPERATIONS') return project.status === 'ACTIVE' && navigationService.isTabAuthorizedForRole('FIELD_OPERATIONS', actor.role)
    ? {tab: 'FIELD_OPERATIONS' as const, projectId: project.projectId} : null;
  return canPresentProjectAction(actor, project.projectId) && navigationService.isTabAuthorizedForRole('WIZARD', actor.role)
    ? {tab: 'WIZARD' as const, projectId: project.projectId, layer: 'ROSTER' as const} : null;
}

/** Explains existing read-model eligibility, without resolving identities locally. */
export function fleetEntryBlocker(row: ProjectFleetRowDTO | undefined, driverRequired: boolean): string | null {
  if (!row) return 'ui1.block.selection';
  if (!row.carrierId) return 'ui1.block.carrier';
  if (!row.materialId) return 'ui1.block.material';
  if (driverRequired && !row.driverId) return 'ui1.block.driver';
  const issues = row.integrityIssues || [];
  if (['INELIGIBLE', 'INTEGRITY_ERROR'].includes(row.classification || '') ||
      issues.some(issue => driverRequired || issue.code !== 'UNASSIGNED_DRIVER')) return 'ui1.block.ineligible';
  return null;
}

/** Explicit new-project entry; selection clearing is never reused for fleet repair. */
export function newProjectEntryTarget(actor: AuthUserContext | undefined) {
  return actor?.userId && navigationService.isTabAuthorizedForRole('WIZARD', actor.role)
    ? {tab:'WIZARD' as const, projectId:''} : null;
}
