import { beforeEach, describe, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ uid: 'u' as string | undefined, profile: {} as any, onRead: undefined as undefined | (() => void) }));
vi.mock('../firebase/config', () => ({ auth: { get currentUser() { return state.uid ? { uid: state.uid } : null; } }, db: {} }));
vi.mock('../repositories/user.repository', () => ({ userRepository: { findById: async () => { state.onRead?.(); return state.profile; } } }));
vi.mock('../services/offline/indexedDB.service', () => ({ indexedDBService: { getAll: async () => [{ projectId: 'P1', status: 'ACTIVE' }, { projectId: 'P2', status: 'ACTIVE' }, { projectId: 'P3', status: 'ARCHIVED' }] } }));
import { offlineCacheService } from '../services/offline/offlineCache.service';
beforeEach(() => { state.uid = 'u'; state.onRead = undefined; state.profile = { userId: 'u', role: 'PROJECT_ADMIN', assignedProjectIds: ['P1'], status: 'ACTIVE', isActive: true }; });
describe('Cached project selector applies current canonical account', () => {
  it('changes P1 to P2 without clearing shared storage', async () => {
    expect((await offlineCacheService.getProjects()).map(p => p.projectId)).toEqual(['P1']);
    state.profile.assignedProjectIds = ['P2']; expect((await offlineCacheService.getProjects()).map(p => p.projectId)).toEqual(['P2']);
  });
  it('empty scope does not expose cached projects', async () => { state.profile.assignedProjectIds = []; expect(await offlineCacheService.getProjects()).toEqual([]); });
  it('suspension preserves assignment but removes effective visibility', async () => { state.profile.status = 'SUSPENDED'; expect(await offlineCacheService.getProjects()).toEqual([]); expect(state.profile.assignedProjectIds).toEqual(['P1']); });
  it('SUPER_ADMIN retains global scope, separately from lifecycle filtering', async () => { state.profile.role = 'SUPER_ADMIN'; state.profile.assignedProjectIds = []; expect((await offlineCacheService.getProjects()).map(p => p.projectId)).toEqual(['P1', 'P2']); });
  it('signout yields no cached project authority', async () => { state.uid = undefined; expect(await offlineCacheService.getProjects()).toEqual([]); });
  it('an identity switch during the profile read cannot return the old account scope', async () => { state.onRead = () => { state.uid = 'other'; }; expect(await offlineCacheService.getProjects()).toEqual([]); });
});
