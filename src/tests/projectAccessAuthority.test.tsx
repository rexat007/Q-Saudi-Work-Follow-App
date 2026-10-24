// @vitest-environment happy-dom
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { UserEntity } from '../types/entities';
const state = vi.hoisted(() => ({ profile: {} as any, users: [] as any[], receive: undefined as undefined | ((users: any[]) => void), query: vi.fn(), command: vi.fn(), audits: [] as any[] }));
vi.mock('../firebase/authContext', () => ({ useAuth: () => ({ user: { uid: 'admin' }, userProfile: state.profile }) }));
vi.mock('../i18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }));
vi.mock('../repositories/user.repository', () => ({ userRepository: {
  subscribeToProjectUsers: (projectId: string, receive: (users: any[]) => void, fail: Function, all: boolean) => {
    state.query(projectId, all); state.receive = receive; receive(state.users); return () => { state.receive = undefined; };
  }, findById: async (id: string) => state.users.find(u => u.userId === id),
} }));
vi.mock('../services/adminAccountClient.service', () => ({ adminErrorKey: () => 'admin_console.errors.failed', executeAdminAccountCommand: async (id: string, command: any) => {
  state.command(id, command); const user = state.users.find(u => u.userId === id);
  user.assignedProjectIds = command.assignedProjectIds; state.audits.push({ id, command }); state.receive?.([...state.users]); return user;
} }));
import { ProjectAccessView, hasEffectiveProjectAccess } from '../components/wizard/ProjectAccessView';
const member = (userId: string, ids = ['P1'], status = 'ACTIVE') => ({ userId, fullName: userId, email: `${userId}@example.invalid`, role: 'PROJECT_ADMIN', assignedProjectIds: ids, status, isActive: status === 'ACTIVE' });
let root: Root, host: HTMLDivElement;
async function render(id = 'P1') { await act(async () => { root.render(<ProjectAccessView projectId={id} />); }); }
beforeEach(() => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  state.profile = { ...member('admin'), role: 'SUPER_ADMIN' }; state.users = [member('target'), member('suspended', ['P1'], 'SUSPENDED'), member('candidate', ['P2'])];
  state.audits = []; state.query.mockClear(); state.command.mockClear();
  host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host);
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); });
describe('Canonical project access presentation and commands', () => {
  it('PROJECT_ADMIN sees assigned users and eligibility without mutation controls', async () => {
    state.profile.role = 'PROJECT_ADMIN'; await render();
    expect(state.query).toHaveBeenCalledWith('P1', false);
    expect(host.textContent).toContain('target@example.invalid'); expect(host.textContent).toContain('suspended@example.invalid');
    expect(host.textContent).toContain('project_access.assigned'); expect(host.textContent).toContain('project_access.inactive');
    expect(host.querySelector('button')).toBeNull(); expect(host.querySelector('select')).toBeNull(); expect(state.command).not.toHaveBeenCalled();
  });
  it('SUPER_ADMIN removes one project through the existing command preserving other projects', async () => {
    state.users[0].assignedProjectIds = ['P1', 'P2']; await render();
    const remove = host.querySelector('tbody tr button') as HTMLButtonElement;
    await act(async () => { remove.click(); });
    expect(state.command).toHaveBeenCalledWith('target', { command: 'replaceAssignedProjects', assignedProjectIds: ['P2'] });
    expect(state.users[0].assignedProjectIds).toEqual(['P2']); expect(state.audits).toHaveLength(1);
    expect(host.querySelector('tbody')?.textContent).not.toContain('target@example.invalid');
  });
  it('SUPER_ADMIN adds through the same canonical replacement and observes its snapshot', async () => {
    await render(); const select = host.querySelector('select')!;
    await act(async () => { select.value = 'candidate'; select.dispatchEvent(new Event('change', { bubbles: true })); });
    const add = [...host.querySelectorAll('button')].find(button => button.textContent === 'project_access.add')!;
    await act(async () => { add.click(); });
    expect(state.command).toHaveBeenCalledWith('candidate', { command: 'replaceAssignedProjects', assignedProjectIds: ['P1', 'P2'] });
    expect(state.audits).toHaveLength(1); expect(host.querySelector('tbody')?.textContent).toContain('candidate@example.invalid');
  });
  it('Admin Console-style canonical snapshot changes immediately update ACCESS', async () => {
    state.profile.role = 'PROJECT_ADMIN'; await render();
    await act(async () => { state.users[2].assignedProjectIds = ['P1']; state.receive?.([...state.users]); });
    expect(host.querySelector('tbody')?.textContent).toContain('candidate@example.invalid');
    await act(async () => { state.users[2].assignedProjectIds = []; state.receive?.([...state.users]); });
    expect(host.querySelector('tbody')?.textContent).not.toContain('candidate@example.invalid');
  });
  it('revoking viewer scope hides previous members without a new sign-in', async () => {
    state.profile.role = 'PROJECT_ADMIN'; await render(); state.profile = { ...state.profile, assignedProjectIds: [] }; await render();
    expect(host.textContent).not.toContain('target@example.invalid'); expect(host.querySelector('table')).toBeNull();
  });
  it('assignment and account eligibility are independent', () => {
    expect(hasEffectiveProjectAccess(member('u') as UserEntity, 'P1')).toBe(true);
    expect(hasEffectiveProjectAccess(member('u', ['P1'], 'SUSPENDED') as UserEntity, 'P1')).toBe(false);
    expect(hasEffectiveProjectAccess(member('u', []) as UserEntity, 'P1')).toBe(false);
    expect(hasEffectiveProjectAccess({ ...member('u'), isActive: false } as UserEntity, 'P1')).toBe(false);
  });
});

describe('Project access locale boundary', () => {
  it('every access label resolves in AR/EN/UR without a second language authority', async () => {
    const { arTranslations } = await import('../locales/ar');
    const { enTranslations } = await import('../locales/en');
    const { urTranslations } = await import('../locales/ur');
    const keys = Object.keys(enTranslations).filter(key => key.startsWith('project_access.'));
    expect(keys).toHaveLength(13);
    for (const dictionary of [arTranslations, enTranslations, urTranslations]) {
      expect(Object.keys(dictionary).filter(key => key.startsWith('project_access.')).sort()).toEqual([...keys].sort());
      for (const key of keys) expect(dictionary[key]?.trim().length, key).toBeGreaterThan(0);
    }
  });
});
