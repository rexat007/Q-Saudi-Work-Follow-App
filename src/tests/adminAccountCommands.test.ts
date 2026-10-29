import { beforeEach, describe, expect, it } from 'vitest';
import { AdminAccountServerService } from '../services/adminAccount.server';
import { PRINCIPAL_ROLES } from '../utils/principal';

const account = (id: string, role = 'VIEWER', status = 'ACTIVE') => ({ userId: id, email: `${id}@example.invalid`, role, status, isActive: status === 'ACTIVE', assignedProjectIds: [], createdBy: 'original', createdAt: new Date('2020-01-01') });
const principal = (id = 'admin', role = 'SUPER_ADMIN') => ({ userId: id, role, email: `${id}@example.invalid`, displayName: '' }) as any;
// Transaction model with staged writes and rollback; not a Firestore emulator.
function database() {
  const store: Record<string, any> = { 'users/admin': account('admin', 'SUPER_ADMIN'), 'users/other': account('other', 'SUPER_ADMIN'), 'users/target': account('target'), 'projects/P': { projectId: 'P', status:'SETUP' } };
  let queue = Promise.resolve(); let failAudit = false;
  const collection = (path: string) => ({ doc: (id: string) => ({ path: `${path}/${id}` }), where: (field: string, op: string, value: unknown) => ({ path, field, value, query: true }) });
  const db = { collection, runTransaction: (callback: any) => {
    const run = queue.then(async () => {
      const pending: (() => void)[] = [];
      const result = await callback({
        get: async (ref: any) => ref.query ? { docs: Object.entries(store).filter(([key, value]) => key.startsWith(ref.path + '/') && !key.slice(ref.path.length + 1).includes('/') && value[ref.field] === ref.value).map(([key, value]) => ({ id: key.split('/').at(-1), data: () => structuredClone(value) })) } : { exists: ref.path in store, data: () => structuredClone(store[ref.path]) },
        set: (ref: any, value: any) => { if (failAudit && ref.path.startsWith('audit_logs/')) throw Error('audit write failed'); pending.push(() => { store[ref.path] = structuredClone(value); }); },
        update: (ref: any, value: any) => pending.push(() => { store[ref.path] = { ...store[ref.path], ...structuredClone(value) }; }),
      });
      pending.forEach(write => write()); return result;
    });
    queue = run.then(() => {}, () => {}); return run;
  } };
  return { db, store, service: new AdminAccountServerService(db), failAudit: () => { failAudit = true; }, audits: () => Object.entries(store).filter(([key]) => key.startsWith('audit_logs/')).map(([, value]) => value) };
}
let x: ReturnType<typeof database>;
beforeEach(() => { x = database(); });
describe('Server administrative commands', () => {
  it('approves explicit role/projects with server actor and atomic audit', async () => {
    x.store['users/target'] = { ...account('target', 'VIEWER', 'PENDING_APPROVAL'), requestedRole: 'SUPER_ADMIN' };
    await x.service.execute('target', { command: 'approveAccount', approvedRole: 'DISPATCHER', assignedProjectIds: ['P'] }, principal());
    expect(x.store['users/target']).toMatchObject({ role: 'DISPATCHER', requestedRole: 'SUPER_ADMIN', status: 'ACTIVE', isActive: true, assignedProjectIds: ['P'], approvedBy: 'admin', createdBy: 'original' });
    expect(x.audits()).toHaveLength(1);
    expect(x.audits()[0]).toMatchObject({ projectId: 'SYSTEM', entityType: 'USER_ROLE', entityId: 'target', actor: { userId: 'admin', role: 'SUPER_ADMIN', email: 'admin@example.invalid' }, createdBy: 'admin', command: 'approveAccount' });
    expect(x.audits()[0].changes.before.status).toBe('PENDING_APPROVAL'); expect(x.audits()[0].changes.after.role).toBe('DISPATCHER');
    expect(x.audits()[0].createdAt).toEqual(x.store['users/target'].updatedAt);
  });
  it.each(['PROJECT_ADMIN', 'VIEWER', 'DRIVER'])('denies %s even with a privileged submitted context', async role => {
    x.store['users/admin'].role = role;
    await expect(x.service.execute('target', { command: 'suspendAccount' }, principal())).rejects.toHaveProperty('code', 'FORBIDDEN_ADMIN_ACTION'); expect(x.audits()).toHaveLength(0);
  });
  it('denies missing or unprivileged principal before mutation', async () => {
    for (const actor of [null, principal('admin', 'PROJECT_ADMIN')]) await expect(x.service.execute('target', { command: 'suspendAccount' }, actor)).rejects.toHaveProperty('code', 'FORBIDDEN_ADMIN_ACTION');
  });
  it.each([{ status: 'SUSPENDED' }, { isActive: false }, { userId: 'impostor' }])('reauthorizes current actor state %j inside the transaction', async patch => {
    Object.assign(x.store['users/admin'], patch);
    await expect(x.service.execute('target', { command: 'suspendAccount' }, principal())).rejects.toHaveProperty('code', 'FORBIDDEN_ADMIN_ACTION');
  });
  it.each(['role', 'status', 'isActive', 'assignedProjectIds', 'createdBy', 'updatedBy', 'userId', 'actor', 'projectId', 'email'])('rejects suspend overposting of %s', async field => {
    await expect(x.service.execute('target', { command: 'suspendAccount', [field]: 'spoof' }, principal())).rejects.toHaveProperty('code', 'INVALID_ADMIN_COMMAND'); expect(x.audits()).toHaveLength(0); expect(x.store['users/target'].status).toBe('ACTIVE');
  });
  it.each([null, {}, { command: 'unknown' }, { command: 'changeUserRole', newRole: 'SYSTEM' }, { command: 'approveAccount', approvedRole: 'VIEWER' }])('rejects invalid command %j', async command => {
    await expect(x.service.execute('target', command, principal())).rejects.toHaveProperty('code', 'INVALID_ADMIN_COMMAND');
  });
  it.each(['', '../admin', 'missing'])('validates target %s without using supplied email', async id => {
    await expect(x.service.execute(id, { command: 'suspendAccount' }, principal())).rejects.toHaveProperty('code', id === 'missing' ? 'TARGET_USER_NOT_FOUND' : 'INVALID_ADMIN_COMMAND');
  });
  it('rejects target identity mismatch', async () => {
    x.store['users/target'].userId = 'different'; await expect(x.service.execute('target', { command: 'suspendAccount' }, principal())).rejects.toHaveProperty('code', 'INVALID_ADMIN_COMMAND');
  });
  it.each([{ command: 'suspendAccount' }, { command: 'changeUserRole', newRole: 'VIEWER' }])('protects last viable admin from %j', async command => {
    delete x.store['users/other']; await expect(x.service.execute('admin', command, principal())).rejects.toHaveProperty('code', 'LAST_SUPER_ADMIN_PROTECTED'); expect(x.audits()).toHaveLength(0);
  });
  it('blocks all self-access changes even with another active admin', async () => {
    for (const command of [{ command: 'suspendAccount' }, { command: 'changeUserRole', newRole: 'VIEWER' }, { command: 'replaceAssignedProjects', assignedProjectIds: [] }]) await expect(x.service.execute('admin', command, principal())).rejects.toHaveProperty('code', 'SELF_ADMIN_ACTION_BLOCKED');
  });
  it('permits suspension of another admin while retaining one viable admin', async () => {
    await x.service.execute('other', { command: 'suspendAccount' }, principal()); expect(x.store['users/other'].isActive).toBe(false); expect(x.store['users/admin'].isActive).toBe(true);
  });
  it('serializes simultaneous cross-suspensions without losing all admins', async () => {
    const results = await Promise.allSettled([x.service.execute('other', { command: 'suspendAccount' }, principal()), x.service.execute('admin', { command: 'suspendAccount' }, principal('other'))]);
    expect(results.filter(value => value.status === 'fulfilled')).toHaveLength(1); expect(x.audits()).toHaveLength(1);
    expect(['admin', 'other'].filter(id => x.store[`users/${id}`].isActive)).toHaveLength(1);
  });
  it('rolls back user mutation and fence when audit cannot be written', async () => {
    const before = structuredClone(x.store['users/target']); x.failAudit(); await expect(x.service.execute('target', { command: 'suspendAccount' }, principal())).rejects.toThrow();
    expect(x.store['users/target']).toEqual(before); expect(x.store['system_state/admin_governance']).toBeUndefined(); expect(x.audits()).toHaveLength(0);
  });
  it.each([{ assignedProjectIds: ['P', 'P'] }, { assignedProjectIds: [''] }, { assignedProjectIds: ['missing'] }, { assignedProjectIds: [7] }, { assignedProjectIds: 'P' }])('rejects invalid, duplicate or nonexistent projects %j', async ({ assignedProjectIds }) => {
    await expect(x.service.execute('target', { command: 'replaceAssignedProjects', assignedProjectIds }, principal())).rejects.toHaveProperty('code', 'INVALID_ADMIN_COMMAND');
  });
  it.each(PRINCIPAL_ROLES)('accepts canonical role %s without widening vocabulary', async newRole => {
    await x.service.execute('target', { command: 'changeUserRole', newRole }, principal()); expect(x.store['users/target'].role).toBe(newRole);
  });
  it('preserves rejection reason and coherent reactivation', async () => {
    x.store['users/target'] = account('target', 'VIEWER', 'PENDING_APPROVAL');
    await x.service.execute('target', { command: 'rejectAccount', rejectionReason: 'Not eligible' }, principal()); expect(x.store['users/target']).toMatchObject({ status: 'REJECTED', isActive: false, rejectedBy: 'admin', rejectionReason: 'Not eligible' });
    await x.service.execute('target', { command: 'reactivateAccount' }, principal()); expect(x.store['users/target']).toMatchObject({ status: 'ACTIVE', isActive: true }); expect(x.audits()).toHaveLength(2);
  });
  it('rejects stale state without false-success audit', async () => {
    await expect(x.service.execute('target', { command: 'approveAccount', approvedRole: 'VIEWER', assignedProjectIds: [] }, principal())).rejects.toHaveProperty('code', 'ADMIN_UPDATE_CONFLICT'); expect(x.audits()).toHaveLength(0);
  });
});
