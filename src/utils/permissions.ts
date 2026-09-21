import { UserEntity } from '../types/entities';
import { UserRole } from '../types/common';

/**
 * Checks if a user profile has administrative permission to edit project-level data,
 * carriers, roster, pricing, or settings for a specific project.
 *
 * Rules:
 * 1. SUPER_ADMIN has full administrative authority for all projects.
 * 2. PROJECT_ADMIN has administrative authority ONLY IF assigned to the specified projectId.
 * 3. VIEWER, DRIVER, SUPERVISOR, SCALE_OPERATOR, etc. are strictly read-only / non-administrative.
 */
export function canEditProject(userProfile: UserEntity | null, projectId: string): boolean {
  if (!userProfile) return false;
  if (userProfile.role === 'SUPER_ADMIN') {
    return true;
  }
  if (userProfile.role === 'PROJECT_ADMIN') {
    if (!projectId) return false;
    return Boolean(userProfile.assignedProjectIds?.includes(projectId));
  }
  return false;
}

/**
 * Checks if a user has administrative status across system or project.
 */
export function hasAdminRole(userProfile: UserEntity | null): boolean {
  if (!userProfile) return false;
  return (
    userProfile.role === 'SUPER_ADMIN' ||
    userProfile.role === 'PROJECT_ADMIN'
  );
}

/**
 * Determines effective role based on authenticated Firestore profile.
 */
export function getEffectiveRole(userProfile: UserEntity | null, fallbackRole: UserRole = 'VIEWER'): UserRole {
  if (!userProfile) return fallbackRole;
  return userProfile.role || fallbackRole;
}
