import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
const rules = readFileSync('firestore.rules', 'utf8');
const users = rules.slice(rules.indexOf('match /users/{userId}'), rules.indexOf('// 3. Global Audit Logs'));
const audit = rules.slice(rules.indexOf('match /audit_logs/{auditLogId}'), rules.indexOf('// 4. Global Identity'));
describe('Administrative rules source contract (not emulator execution)', () => {
  it('denies direct account mutation to all clients, including project admins', () => { expect(users).toContain('allow update: if false;'); expect(users).toContain('allow delete: if false;'); });
  it('preserves safe self-request creation and administrative/self reads', () => { expect(users).toContain('isSafeAccountRequest(userId)'); expect(users).toContain('request.auth.uid == userId || isAdminConsoleReader()'); expect(users).toContain('allow list: if isAdminConsoleReader()'); });
  it('does not permit privileged account creation directly from clients', () => { const create = users.slice(users.indexOf('allow create:'), users.indexOf('allow update:')); expect(create).not.toContain('isSuperAdmin()'); });
  it('makes account-governance audit server-only while preserving bounded domain appends', () => {
    expect(audit).toContain("incoming().entityType != 'USER_ROLE'"); expect(audit).toContain('allow create: if isUserActive()');
    for (const binding of ['incoming().actor.userId == request.auth.uid', 'incoming().actor.role == currentUser().role', 'incoming().actor.email == request.auth.token.email', 'incoming().createdBy == request.auth.uid', 'incoming().updatedBy == request.auth.uid', 'isProjectMember(incoming().projectId)']) expect(audit).toContain(binding);
    expect(audit).not.toContain('incoming().actor.userId == request.auth.uid ||'); expect(audit).toContain('allow update, delete: if false;');
  });
  it('routes commands under global auth with sanitized errors and no arbitrary patch endpoint', () => {
    const source = readFileSync('server/app.ts', 'utf8'); const start = source.indexOf("app.post('/api/admin/users/:userId/commands'"); const route = source.slice(start, source.indexOf('// ----------------------------------------------------', start));
    expect(source.indexOf("app.use('/api', authenticateUser)")).toBeLessThan(start); expect(route).toContain('req.params.userId, req.body, req.user'); expect(route).not.toContain('error.message'); expect(route).toContain('res.status(status).json({ success: false, code })');
  });
});
