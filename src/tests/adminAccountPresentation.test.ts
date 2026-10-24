import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
const state = vi.hoisted(() => ({ role: 'PROJECT_ADMIN', section: 'USERS', status: 'PENDING_APPROVAL', arrays: 0, nulls: 0, targetId: 'target' }));
const target = () => ({ userId: state.targetId, fullName: 'Target Employee', email: 'target@example.invalid', role: 'VIEWER', status: state.status, assignedProjectIds: ['P'] });
vi.mock('react', async original => {
  const actual = await original<typeof import('react')>();
  return { ...actual, useState: (initial: unknown) => {
    let value = initial;
    if (initial === 'USERS') value = state.section;
    if (Array.isArray(initial)) { const index = state.arrays++; if (index === 0) value = [target()]; if (index === 2) value = [{ projectId: 'P', nameAr: 'Project' }]; }
    if (initial === null && state.nulls++ === 1) value = target();
    return actual.useState(value);
  } };
});
vi.mock('../firebase/config', () => ({ auth: { currentUser: { getIdToken: async () => 'test-token' } }, db: {} }));
vi.mock('../firebase/authContext', () => ({ useAuth: () => ({ user: { uid: 'admin', email: 'admin@example.invalid' }, userProfile: { userId: 'admin', role: state.role, status: 'ACTIVE', isActive: true, assignedProjectIds: ['P'] } }) }));
vi.mock('../i18n', () => ({ useI18n: () => ({ t: (key: string) => key, direction: 'ltr', locale: 'en' }) }));
import { AdminConsoleView } from '../components/admin/AdminConsoleView';
import { adminErrorKey, ADMIN_ERROR_KEYS, executeAdminAccountCommand } from '../services/adminAccountClient.service';
function render(role: string, section = 'USERS', status = 'PENDING_APPROVAL', targetId = 'target') {
  Object.assign(state, { role, section, status, targetId, arrays: 0, nulls: 0 });
  return renderToStaticMarkup(React.createElement(AdminConsoleView));
}
afterEach(() => vi.unstubAllGlobals());
describe('Admin Console governance presentation', () => {
  it.each(['PENDING_APPROVAL', 'ACTIVE', 'SUSPENDED', 'REJECTED'])('PROJECT_ADMIN reads %s accounts without lifecycle mutation controls', status => {
    const html = render('PROJECT_ADMIN', 'USERS', status);
    expect(html).toContain('Target Employee');
    for (const key of ['btn_approve', 'btn_reject', 'btn_suspend', 'btn_reactivate']) expect(html).not.toContain(`admin_console.${key}`);
  });
  it('PROJECT_ADMIN sees account security values without role/project editors or save control', () => {
    const html = render('PROJECT_ADMIN', 'SECURITY_ACCESS');
    expect(html).toContain('navigation.roles.viewer'); expect(html).toContain('P');
    expect(html).not.toContain('admin_console.save_matrix'); expect(html).not.toContain('admin_console.role_assignment_description'); expect(html).not.toContain('type="checkbox"');
  });
  it.each([['PENDING_APPROVAL', 'btn_approve'], ['ACTIVE', 'btn_suspend'], ['SUSPENDED', 'btn_reactivate']])('SUPER_ADMIN keeps %s lifecycle action', (status, action) => {
    expect(render('SUPER_ADMIN', 'USERS', status)).toContain(`admin_console.${action}`);
  });
  it('does not render self-access mutation controls even for SUPER_ADMIN', () => {
    expect(render('SUPER_ADMIN', 'USERS', 'ACTIVE', 'admin')).not.toContain('admin_console.btn_suspend');
    expect(render('SUPER_ADMIN', 'SECURITY_ACCESS', 'ACTIVE', 'admin')).not.toContain('admin_console.save_matrix');
  });
  it('SUPER_ADMIN keeps role/project editors and one permissions-save action', () => {
    const html = render('SUPER_ADMIN', 'SECURITY_ACCESS'); expect(html).toContain('admin_console.save_matrix'); expect(html).toContain('type="checkbox"'); expect(html).toContain('admin_console.role_assignment_description');
  });
  it('wires only explicit server commands and canonical data refresh', () => {
    const source = readFileSync('src/components/admin/AdminConsoleView.tsx', 'utf8');
    for (const command of ['approveAccount', 'rejectAccount', 'suspendAccount', 'reactivateAccount', 'changeUserRole', 'replaceAssignedProjects']) expect(source).toContain(`command: '${command}'`);
    expect(source).not.toContain('userRepository.update('); expect(source).not.toContain('auditLogService.recordLog(');
    expect(source).toContain('await refreshTarget('); expect(source).toContain('if (!canManageUsers');
  });
  it.each(['Missing or insufficient permissions', 'authInfo', 'operationType', 'projects/secret/firestore/path', 'token'])('does not expose raw error %s', message => {
    expect(adminErrorKey({ message, authInfo: { token: 'secret' }, operationType: 'update' })).toBe('admin_console.errors.failed');
    expect(adminErrorKey({ code: 'FORBIDDEN_ADMIN_ACTION', message })).toBe('admin_console.errors.forbidden');
  });
  it('client sends only the explicit command and uses authenticated token', async () => {
    const request = vi.fn(async () => ({ ok: true, json: async () => ({ success: true, user: { userId: 'target' } }) })); vi.stubGlobal('fetch', request);
    expect(await executeAdminAccountCommand('target', { command: 'suspendAccount' })).toEqual({ userId: 'target' });
    expect(request).toHaveBeenCalledWith('/api/admin/users/target/commands', expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer test-token' }), body: JSON.stringify({ command: 'suspendAccount' }) }));
  });
  it('discards raw backend authorization details before errors reach a banner', async () => {
    vi.stubGlobal('fetch', async () => ({ ok: false, json: async () => ({ success: false, code: 'FORBIDDEN_ADMIN_ACTION', error: 'Missing or insufficient permissions: authInfo operationType projects/private/path', token: 'secret' }) }));
    await expect(executeAdminAccountCommand('target', { command: 'suspendAccount' })).rejects.toEqual({ code: 'FORBIDDEN_ADMIN_ACTION' });
  });
  it('discards network and non-JSON technical errors', async () => {
    vi.stubGlobal('fetch', async () => { throw Error('Firestore path authInfo operationType secret'); });
    await expect(executeAdminAccountCommand('target', { command: 'suspendAccount' })).rejects.toEqual({ code: 'ADMIN_UPDATE_FAILED' });
  });
  it('uses only localized allowlisted errors in banners', async () => {
    const source = readFileSync('src/components/admin/AdminConsoleView.tsx', 'utf8');
    expect(source).not.toContain('error.message'); expect(source).toContain("showBanner(t(adminErrorKey(error)), 'warning')");
    const [{ arTranslations }, { enTranslations }, { urTranslations }] = await Promise.all([import('../locales/ar'), import('../locales/en'), import('../locales/ur')]);
    for (const key of Object.values(ADMIN_ERROR_KEYS)) for (const dictionary of [arTranslations, enTranslations, urTranslations]) expect(dictionary[key]).toEqual(expect.stringMatching(/\S/));
  });
});
