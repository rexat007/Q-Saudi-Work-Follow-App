import type { AuthUserContext } from '../types/common';

// Cached data and filter sentinels never confer authority.
export function hasProjectScope(context: Pick<AuthUserContext, 'role' | 'assignedProjectIds'> | undefined, projectId: string): boolean {
  if (!context || !projectId || projectId === 'ALL') return false;
  return context.role === 'SUPER_ADMIN' || Boolean(context.assignedProjectIds?.includes(projectId));
}
export function filterProjectScope<T extends { projectId: string }>(items: T[], context: Pick<AuthUserContext, 'role' | 'assignedProjectIds'> | undefined): T[] {
  return items.filter(item => hasProjectScope(context, item.projectId));
}
