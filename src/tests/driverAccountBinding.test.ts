import { describe, expect, it } from 'vitest';
import { AdminAccountServerService } from '../services/adminAccount.server';
import { buildPrincipal } from '../utils/principal';
import { decodeUser } from '../utils/persistenceBoundary';
import { commandDatabase, accountProfile } from './helpers/commandDatabase';
const actor = () => buildPrincipal(accountProfile(), 'actor', {});
function fixture() { const database = commandDatabase({ 'users/actor': accountProfile(), 'users/A': { ...accountProfile('DRIVER'), userId: 'A' }, 'users/B': { ...accountProfile('DRIVER'), userId: 'B' }, 'drivers/DRV-A': { driverId: 'DRV-A', status: 'ACTIVE' } }); return { ...database, service: new AdminAccountServerService(database.db) }; }
describe('Driver account binding under existing admin governance', () => {
  it('links a real driver and atomically records canonical before/after audit and fence', async () => {
    const x = fixture(); await x.service.execute('A', { command: 'linkDriverIdentity', linkedDriverId: 'DRV-A' }, actor());
    expect(x.store['users/A'].linkedDriverId).toBe('DRV-A'); expect(x.store['system_state/admin_governance'].revision).toBe(1);
    const audit = Object.entries(x.store).find(([path]) => path.startsWith('audit_logs/'))![1];
    expect(audit.changes.after.linkedDriverId).toBe('DRV-A'); expect(audit.actor.userId).toBe('actor');
  });
  it('serializes competing links and rejects duplicate ownership', async () => {
    const x = fixture(); const result = await Promise.allSettled(['A', 'B'].map(id => x.service.execute(id, { command: 'linkDriverIdentity', linkedDriverId: 'DRV-A' }, actor())));
    expect(result.filter(value => value.status === 'fulfilled')).toHaveLength(1);
    expect((result.find(value => value.status === 'rejected') as PromiseRejectedResult).reason.code).toBe('DRIVER_IDENTITY_ALREADY_LINKED');
  });
  it('unlinks and audits removal without creating another reference', async () => {
    const x = fixture(); x.store['users/A'].linkedDriverId = 'DRV-A'; await x.service.execute('A', { command: 'unlinkDriverIdentity' }, actor());
    expect(x.store['users/A']).not.toHaveProperty('linkedDriverId'); expect(x.store['drivers/DRV-A']).not.toHaveProperty('authUserId');
    const audit = Object.entries(x.store).find(([path]) => path.startsWith('audit_logs/'))![1]; expect(audit.changes.before.linkedDriverId).toBe('DRV-A'); expect(audit.changes.after).not.toHaveProperty('linkedDriverId');
  });
  it('role change clears binding in the same transaction', async () => {
    const x = fixture(); x.store['users/A'].linkedDriverId = 'DRV-A'; await x.service.execute('A', { command: 'changeUserRole', newRole: 'VIEWER' }, actor()); expect(x.store['users/A']).toMatchObject({ role: 'VIEWER' }); expect(x.store['users/A']).not.toHaveProperty('linkedDriverId');
  });
  it('suspension preserves binding and reactivation does not manufacture a new one', async () => {
    const x = fixture(); x.store['users/A'].linkedDriverId = 'DRV-A'; await x.service.execute('A', { command: 'suspendAccount' }, actor()); expect(x.store['users/A'].linkedDriverId).toBe('DRV-A'); await x.service.execute('A', { command: 'reactivateAccount' }, actor()); expect(x.store['users/A'].linkedDriverId).toBe('DRV-A');
  });
  it.each(['missing', 'mismatched'])('rejects %s canonical driver identity', async mode => {
    const x = fixture(); if (mode === 'missing') delete x.store['drivers/DRV-A']; else x.store['drivers/DRV-A'].driverId = 'DRV-B';
    await expect(x.service.execute('A', { command: 'linkDriverIdentity', linkedDriverId: 'DRV-A' }, actor())).rejects.toHaveProperty('code', 'INVALID_ADMIN_COMMAND'); expect(x.store['users/A']).not.toHaveProperty('linkedDriverId');
  });
  it('rejecting a pending DRIVER preserves the established link', async () => {
    const x = fixture(); Object.assign(x.store['users/A'], { status: 'PENDING_APPROVAL', isActive: false, linkedDriverId: 'DRV-A' });
    await x.service.execute('A', { command: 'rejectAccount', rejectionReason: 'Owner decision' }, actor());
    expect(x.store['users/A']).toMatchObject({ status: 'REJECTED', linkedDriverId: 'DRV-A' });
  });
  it('current PROJECT_ADMIN cannot link despite stale SUPER_ADMIN request context', async () => { const x = fixture(); x.store['users/actor'].role = 'PROJECT_ADMIN'; await expect(x.service.execute('A', { command: 'linkDriverIdentity', linkedDriverId: 'DRV-A' }, actor())).rejects.toHaveProperty('code', 'FORBIDDEN_ADMIN_ACTION'); });
  it('audit failure rolls back account and fence writes', async () => { const x = fixture(); x.failWrites('audit_logs/'); await expect(x.service.execute('A', { command: 'linkDriverIdentity', linkedDriverId: 'DRV-A' }, actor())).rejects.toThrow(); expect(x.store['users/A']).not.toHaveProperty('linkedDriverId'); expect(x.store['system_state/admin_governance']).toBeUndefined(); });
  it('binding derives only from profile and malformed persisted bindings fail closed', () => {
    expect(buildPrincipal(accountProfile('DRIVER', 'DRV-A'), 'actor', {}).linkedDriverId).toBe('DRV-A');
    expect(buildPrincipal(accountProfile('DRIVER'), 'actor', { linkedDriverId: 'spoofed-token-value' } as any)).not.toHaveProperty('linkedDriverId');
    for (const linkedDriverId of ['', 'bad/id', null, 4]) { expect(() => buildPrincipal({ ...accountProfile(), linkedDriverId }, 'actor', {})).toThrow(); expect(() => decodeUser({ ...accountProfile(), linkedDriverId }, 'actor')).toThrow(); }
  });
});
