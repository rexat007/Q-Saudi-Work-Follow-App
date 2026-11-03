import type {AuthUserContext} from '../types/common';
/**
 * Retired: Client-driven automatic global workspace synchronization is retired.
 * Normal production client activity (mount, focus, online, visibilitychange) does NOT
 * trigger automatic POST /api/workspace/user-active-sync passes.
 * Synchronization is handled via Manual Project Sync and Scheduled Server Worker.
 */
export function useUserActiveWorkspaceSync(_context?:AuthUserContext){
 // Retired: Automatic client activity passes removed (AUTOMATIC_USER_ACTIVE_SYNC_POSTS = 0).
 return;
}

