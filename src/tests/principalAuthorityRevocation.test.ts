import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authenticateUser, enforceProjectIsolation, enforceRole } from '../../server/security.middleware';
import { setTestAuthOverride, setTestDbOverride, createInMemoryAdminDb, inMemoryAdminStore } from '../firebase/admin';
import { buildPrincipal, validateAccountProfile, PRINCIPAL_ROLES } from '../utils/principal';

const profile = () => ({ userId: 'u', role: 'PROJECT_ADMIN', status: 'ACTIVE', isActive: true, assignedProjectIds: ['A'] });
const verify = vi.fn();
async function request(path = '/projects/A', method = 'GET', originalUrl = `/api${path}`) {
  const req: any = { method, path, originalUrl, headers: { authorization: 'Bearer token' }, params: { projectId: 'A' }, body: {}, query: {} };
  const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() };
  const next = vi.fn();
  await authenticateUser(req, res, next);
  return { req, res, next };
}
beforeEach(() => {
  verify.mockReset().mockResolvedValue({ uid: 'u', email: 'u@example.invalid', email_verified: true, role: 'SUPER_ADMIN', assignedProjectIds: ['A', 'removed'] });
  setTestAuthOverride({ verifyIdToken: verify });
  for (const key of Object.keys(inMemoryAdminStore)) delete inMemoryAdminStore[key];
  setTestDbOverride(createInMemoryAdminDb());
  inMemoryAdminStore['users/u'] = profile();
});
describe('P3-B1 current principal authority', () => {
  it('uses verified identity and current profile, ignoring stale token privileges', async () => {
    const { req, next } = await request();
    expect(verify).toHaveBeenCalledWith('token', true);
    expect(next).toHaveBeenCalledOnce();
    expect(req.user).toMatchObject({ userId: 'u', role: 'PROJECT_ADMIN', assignedProjectIds: ['A'] });
  });
  it.each(['auth/id-token-revoked', 'auth/user-disabled', 'auth/id-token-expired', 'auth/argument-error'])('fails closed on Firebase %s without leaking details', async code => {
    verify.mockRejectedValue({ code, message: 'sensitive diagnostic' });
    const { res, next } = await request();
    expect(next).not.toHaveBeenCalled(); expect(res.status).toHaveBeenCalledWith(401);
    expect(JSON.stringify(res.json.mock.calls)).not.toContain('sensitive diagnostic');
    expect(res.json.mock.calls[0][0].code).toBe(({ 'auth/id-token-revoked': 'TOKEN_REVOKED', 'auth/user-disabled': 'IDENTITY_DISABLED', 'auth/id-token-expired': 'TOKEN_EXPIRED' } as Record<string, string>)[code] || 'INVALID_TOKEN');
  });
  it('denies administrative action after current profile role downgrade despite SUPER_ADMIN claims', async () => {
    inMemoryAdminStore['users/u'] = { ...profile(), role: 'VIEWER' };
    const { req } = await request();
    const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn() }; const next = vi.fn();
    enforceRole(['PROJECT_ADMIN'])(req, res, next);
    expect(next).not.toHaveBeenCalled(); expect(res.status).toHaveBeenCalledWith(403);
  });
  it('accepts current active SUPER_ADMIN despite an unprivileged token role', async () => {
    verify.mockResolvedValue({ uid: 'u', role: 'VIEWER' });
    inMemoryAdminStore['users/u'] = { ...profile(), role: 'SUPER_ADMIN' };
    const { req, next } = await request(); expect(next).toHaveBeenCalledOnce(); expect(req.user.role).toBe('SUPER_ADMIN');
  });
  it('rejects missing verified UID', async () => {
    verify.mockResolvedValue({ uid: '' }); const { res, next } = await request();
    expect(next).not.toHaveBeenCalled(); expect(res.status).toHaveBeenCalledWith(401);
  });
  it.each(['/projects/A', '/projects/bootstrap', '/auth/bootstrap/extra', '/auth/bootstrap?other'])('does not admit missing accounts through noncanonical path %s', async path => {
    delete inMemoryAdminStore['users/u']; const { next, res } = await request(path, 'POST');
    expect(next).not.toHaveBeenCalled(); expect(res.json.mock.calls[0][0].code).toBe('USER_NOT_FOUND');
  });
  it('does not admit a missing account via bootstrap in a query string', async () => {
    delete inMemoryAdminStore['users/u'];
    const result = await request('/projects/A', 'GET', '/api/projects/A?bootstrap=1'); expect(result.next).not.toHaveBeenCalled();
  });
  it.each(['/auth/bootstrap', '/api/auth/bootstrap'])('permits only verified missing-user bootstrap at POST %s', async path => {
    delete inMemoryAdminStore['users/u']; const { req, next } = await request(path, 'POST');
    expect(next).toHaveBeenCalledOnce(); expect(req.user).toMatchObject({ role: 'VIEWER', assignedProjectIds: [] });
  });
  it.each([false, undefined])('rejects unverified bootstrap email %j', async email_verified => {
    delete inMemoryAdminStore['users/u']; verify.mockResolvedValue({ uid: 'u', email: 'u@example.invalid', email_verified });
    expect((await request('/auth/bootstrap', 'POST')).next).not.toHaveBeenCalled();
  });
  it('does not bootstrap via GET', async () => {
    delete inMemoryAdminStore['users/u']; expect((await request('/auth/bootstrap')).next).not.toHaveBeenCalled();
  });
  it.each([{ userId: 'other' }, { role: 'ADMIN' }, { role: undefined }, { assignedProjectIds: undefined }, { assignedProjectIds: [''] }, { assignedProjectIds: [7] }, { assignedProjectIds: 'A' }, { status: 'UNKNOWN' }, { status: null }, { isActive: 'true' }])('rejects malformed canonical profile %j', async patch => {
    inMemoryAdminStore['users/u'] = { ...profile(), ...patch };
    const { next, res } = await request(); expect(next).not.toHaveBeenCalled();
    expect(res.json.mock.calls[0][0].code).toBe('INVALID_ACCOUNT_PROFILE');
  });
  it.each(['SUSPENDED', 'REJECTED', 'PENDING_APPROVAL'])('rejects %s despite token claims', async status => {
    inMemoryAdminStore['users/u'] = { ...profile(), status }; expect((await request()).next).not.toHaveBeenCalled();
  });
  it('rejects explicit inactivity even with ACTIVE status', async () => {
    inMemoryAdminStore['users/u'] = { ...profile(), isActive: false }; expect((await request()).next).not.toHaveBeenCalled();
  });
  it('preserves legacy status fallback and missing redundant userId', () => {
    expect(buildPrincipal({ role: 'VIEWER', assignedProjectIds: [], isActive: true }, 'u', {}).userId).toBe('u');
    expect(() => buildPrincipal({ role: 'VIEWER', assignedProjectIds: [] }, 'u', {})).toThrow('ACCOUNT_NOT_ACTIVE');
  });
  it.each(PRINCIPAL_ROLES)('preserves canonical role %s', role => {
    expect(validateAccountProfile({ ...profile(), role }, 'u').role).toBe(role);
  });
  it('denies a removed project through downstream isolation and allows current assignment', async () => {
    const { req } = await request(); const next = vi.fn();
    const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    enforceProjectIsolation(req, res, next); expect(next).toHaveBeenCalledOnce();
    req.params.projectId = 'removed'; next.mockClear(); enforceProjectIsolation(req, res, next);
    expect(next).not.toHaveBeenCalled(); expect(res.status).toHaveBeenCalledWith(403);
  });
});
