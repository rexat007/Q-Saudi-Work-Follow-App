import { GlobalIdentityError, assertCanEnroll, assertCanReactivateMembership, type GlobalKind } from './globalIdentityPolicy';

export type MembershipCommand = 'ENROLL' | 'SUSPEND' | 'REMOVE' | 'REACTIVATE';

/** Shared business transition decision; transport-specific provenance stays outside. */
export function planMembershipStatus(kind: GlobalKind, command: MembershipCommand,
  before: string | null, global?: { status?: unknown }) {
  const fail = (code: string): never => { throw new GlobalIdentityError(code); };
  if (!['ENROLL', 'SUSPEND', 'REMOVE', 'REACTIVATE'].includes(command)) fail('INVALID_PARTICIPATION_COMMAND');
  if (before !== null && !['ACTIVE', 'SUSPENDED', 'REMOVED'].includes(before)) fail('PERSISTENCE_BOUNDARY_INVALID');
  if (command === 'ENROLL') assertCanEnroll(kind, global);
  if (command === 'REACTIVATE') assertCanReactivateMembership(kind, global);
  const status = command === 'SUSPEND' ? 'SUSPENDED' : command === 'REMOVE' ? 'REMOVED' : 'ACTIVE';
  if (!before && command !== 'ENROLL') fail('MEMBERSHIP_NOT_FOUND');
  if (before && command === 'ENROLL' && before !== 'ACTIVE') fail('MEMBERSHIP_STATE_CONFLICT');
  if (before === status) return { status, changed: false };
  if (before && command === 'SUSPEND' && before !== 'ACTIVE') fail('INVALID_STATE_TRANSITION');
  return { status, changed: true };
}
