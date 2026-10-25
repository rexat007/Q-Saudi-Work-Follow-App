import { auth } from '../firebase/config';
import type { UserRole } from '../types/common';
export type AdminAccountCommand =
  | { command: 'approveAccount'; approvedRole: UserRole; assignedProjectIds: string[] }
  | { command: 'rejectAccount'; rejectionReason: string }
  | { command: 'suspendAccount' | 'reactivateAccount' }
  | { command: 'changeUserRole'; newRole: UserRole }
  | { command: 'linkDriverIdentity'; linkedDriverId: string }
  | { command: 'unlinkDriverIdentity' }
  | { command: 'replaceAssignedProjects'; assignedProjectIds: string[] };
export const ADMIN_ERROR_KEYS = {
  DRIVER_IDENTITY_ALREADY_LINKED: 'admin_console.errors.driver_linked',
  FORBIDDEN_ADMIN_ACTION: 'admin_console.errors.forbidden',
  LAST_SUPER_ADMIN_PROTECTED: 'admin_console.errors.last_admin',
  SELF_ADMIN_ACTION_BLOCKED: 'admin_console.errors.self',
  TARGET_USER_NOT_FOUND: 'admin_console.errors.target_missing',
  INVALID_ADMIN_COMMAND: 'admin_console.errors.invalid',
  ADMIN_UPDATE_CONFLICT: 'admin_console.errors.conflict',
  ADMIN_UPDATE_FAILED: 'admin_console.errors.failed',
} as const;
export function adminErrorKey(error: unknown): string {
  const code = error && typeof error === 'object' ? (error as { code?: unknown }).code : undefined;
  return typeof code === 'string' && Object.hasOwn(ADMIN_ERROR_KEYS, code)
    ? ADMIN_ERROR_KEYS[code as keyof typeof ADMIN_ERROR_KEYS] : ADMIN_ERROR_KEYS.ADMIN_UPDATE_FAILED;
}
export async function executeAdminAccountCommand(userId: string, command: AdminAccountCommand) {
  if (!auth.currentUser) throw { code: 'FORBIDDEN_ADMIN_ACTION' };
  try {
    const token = await auth.currentUser.getIdToken();
    const response = await fetch(`/api/admin/users/${encodeURIComponent(userId)}/commands`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(command),
    });
    const result = await response.json();
    if (!response.ok || !result.success) throw { code: result.code };
    return result.user;
  } catch (error) {
    const key = adminErrorKey(error);
    const code = Object.keys(ADMIN_ERROR_KEYS).find(value => ADMIN_ERROR_KEYS[value as keyof typeof ADMIN_ERROR_KEYS] === key) || 'ADMIN_UPDATE_FAILED';
    throw { code };
  }
}

export async function listDriverIdentities(): Promise<{ driverId: string; fullNameAr: string; status: string }[]> {
  if (!auth.currentUser) throw { code: 'FORBIDDEN_ADMIN_ACTION' };
  const token = await auth.currentUser.getIdToken();
  const response = await fetch('/api/admin/driver-identities', { headers: { Authorization: `Bearer ${token}` } });
  const result = await response.json();
  if (!response.ok || !result.success) throw { code: result.code };
  return result.drivers;
}
