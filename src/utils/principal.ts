import type { UserRole } from '../types/common';

export const PRINCIPAL_ROLES = ['PROJECT_ADMIN', 'SUPER_ADMIN', 'SITE_SUPERVISOR', 'SUPERVISOR', 'DISPATCHER', 'FINANCE_AUDITOR', 'SCALE_OPERATOR', 'DRIVER', 'VIEWER'] as const satisfies readonly UserRole[];
const statuses = ['ACTIVE', 'PENDING_APPROVAL', 'REJECTED', 'SUSPENDED'] as const;
export class PrincipalError extends Error {
  constructor(public code: 'INVALID_ACCOUNT_PROFILE' | 'ACCOUNT_NOT_ACTIVE', state?: string) { super(state ? `${code}:${state}` : code); }
}

/** Current account state, never token role/project claims, owns effective human access. */
export function validateAccountProfile(raw: unknown, uid: string) {
  const invalid = () => { throw new PrincipalError('INVALID_ACCOUNT_PROFILE'); };
  if (!uid || !uid.trim() || !raw || typeof raw !== 'object' || Array.isArray(raw)) return invalid();
  const data = raw as Record<string, unknown>;
  if (data.userId !== undefined && data.userId !== uid) return invalid();
  if (!PRINCIPAL_ROLES.includes(data.role as UserRole)) return invalid();
  if (!Array.isArray(data.assignedProjectIds) || !data.assignedProjectIds.every(id => typeof id === 'string' && id.trim().length > 0)) return invalid();
  if (data.isActive !== undefined && typeof data.isActive !== 'boolean') return invalid();
  if (data.linkedDriverId !== undefined && (typeof data.linkedDriverId !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(data.linkedDriverId))) return invalid();
  const status = data.status === undefined ? (data.isActive === true ? 'ACTIVE' : 'PENDING_APPROVAL') : data.status;
  if (!statuses.includes(status as typeof statuses[number])) return invalid();
  return { linkedDriverId: data.linkedDriverId as string | undefined, userId: uid, role: data.role as UserRole, assignedProjectIds: [...data.assignedProjectIds] as string[], status: status as typeof statuses[number], isActive: data.isActive };
}

export function buildPrincipal(raw: unknown, uid: string, identity: { email?: string; name?: string }) {
  const account = validateAccountProfile(raw, uid);
  if (account.status !== 'ACTIVE' || account.isActive === false) throw new PrincipalError('ACCOUNT_NOT_ACTIVE', account.status);
  const data = raw as Record<string, unknown>;
  return { ...(account.linkedDriverId ? { linkedDriverId: account.linkedDriverId } : {}), userId: uid, role: account.role, assignedProjectIds: account.assignedProjectIds,
    email: identity.email || (typeof data.email === 'string' ? data.email : ''),
    displayName: typeof data.fullName === 'string' ? data.fullName : identity.name || '' };
}
