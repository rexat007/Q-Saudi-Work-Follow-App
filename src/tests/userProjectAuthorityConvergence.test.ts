import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getDocs, onSnapshot } from 'firebase/firestore';
import { projectRepository } from '../repositories/project.repository';
import { filterProjectScope, hasProjectScope } from '../utils/projectScope';

const state = vi.hoisted(() => ({ ids: [] as string[], snapshots: [] as { receive: Function; fail: Function; unsub: ReturnType<typeof vi.fn> }[] }));
vi.mock('../firebase/config', () => ({ auth: { currentUser: { uid: 'u' } }, db: {} }));
vi.mock('firebase/firestore', async original => ({
  ...await original<typeof import('firebase/firestore')>(),
  documentId: () => '__name__', collection: () => ({}),
  where: (field: string, op: string, value: string[]) => ({ field, op, value }),
  query: (collection: unknown, filter: unknown) => ({ collection, filter }),
  getDocs: vi.fn(async (q: any) => snap(q.filter?.value || state.ids)),
  onSnapshot: vi.fn((q: any, receive: Function, fail: Function) => {
    const unsub = vi.fn(); state.snapshots.push({ receive, fail, unsub }); receive(snap(q.filter?.value || state.ids)); return unsub;
  }),
}));
function snap(ids: string[]) { return { docs: ids.map(id => ({ id, data: () => ({ projectId: id }) })) }; }
beforeEach(() => { vi.clearAllMocks(); state.ids = ['P1', 'P2']; state.snapshots = []; });
describe('Document identity scoped project reads', () => {
  it('missing authority and empty authority never issue global reads', async () => {
    expect(await projectRepository.listAll()).toEqual([]);
    expect(await projectRepository.listAll([], false)).toEqual([]);
    const receive = vi.fn(); projectRepository.subscribeToProjects(receive);
    expect(receive).toHaveBeenLastCalledWith([]); expect(getDocs).not.toHaveBeenCalled(); expect(onSnapshot).not.toHaveBeenCalled();
  });
  it.each([1, 30, 31, 65])('returns all %i authorized IDs using bounded document-ID queries', async count => {
    const ids = Array.from({ length: count }, (_, i) => `P${String(i).padStart(3, '0')}`);
    const result = await projectRepository.listAll([...ids, ids[0]], false);
    expect(result.map(p => p.projectId)).toEqual(ids);
    expect(getDocs).toHaveBeenCalledTimes(Math.ceil(count / 30));
    for (const [q] of vi.mocked(getDocs).mock.calls as any) { expect(q.filter.field).toBe('__name__'); expect(q.filter.value.length).toBeLessThanOrEqual(30); }
  });
  it('global collection reads require explicit SUPER_ADMIN', async () => {
    expect(await projectRepository.listAll([], true)).toHaveLength(2);
    expect((vi.mocked(getDocs).mock.calls[0][0] as any).filter).toBeUndefined();
  });
  it('combines every subscription chunk and ignores late callbacks after cleanup', () => {
    const ids = Array.from({ length: 65 }, (_, i) => `P${i}`); const receive = vi.fn();
    const stop = projectRepository.subscribeToProjects(receive, vi.fn(), ids, false);
    expect(receive.mock.lastCall?.[0]).toHaveLength(65); expect(onSnapshot).toHaveBeenCalledTimes(3);
    stop(); const calls = receive.mock.calls.length;
    state.snapshots[0].receive(snap(['revoked'])); expect(receive).toHaveBeenCalledTimes(calls);
    for (const listener of state.snapshots) expect(listener.unsub).toHaveBeenCalledOnce();
  });
  it('clears data on subscription error and cannot resurrect it from another chunk', () => {
    const receive = vi.fn(), fail = vi.fn();
    projectRepository.subscribeToProjects(receive, fail, Array.from({ length: 31 }, (_, i) => `P${i}`), false);
    const error = new Error('permission-denied'); state.snapshots[0].fail(error);
    expect(receive).toHaveBeenLastCalledWith([]); expect(fail).toHaveBeenCalledWith(error);
    state.snapshots[1].receive(snap(['P30'])); expect(receive).toHaveBeenLastCalledWith([]);
  });
});
describe('Cached operational records do not confer authority', () => {
  const trips = [{ projectId: 'P1', driverId: 'u' }, { projectId: 'P2', driverId: 'u' }];
  it('reconciles P1 to P2 and then empty scope without deleting shared data', () => {
    expect(filterProjectScope(trips, { role: 'DRIVER', assignedProjectIds: ['P1'] })).toEqual([trips[0]]);
    expect(filterProjectScope(trips, { role: 'DRIVER', assignedProjectIds: ['P2'] })).toEqual([trips[1]]);
    expect(filterProjectScope(trips, { role: 'DRIVER', assignedProjectIds: [] })).toEqual([]); expect(trips).toHaveLength(2);
  });
  it('ordinary ALL sentinel never grants global access', () => {
    expect(filterProjectScope(trips, { role: 'PROJECT_ADMIN', assignedProjectIds: ['ALL'] })).toEqual([]);
    expect(hasProjectScope({ role: 'SUPER_ADMIN' }, 'ALL')).toBe(false);
    expect(filterProjectScope(trips, { role: 'SUPER_ADMIN' })).toEqual(trips);
  });
});
