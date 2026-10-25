import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
const user = vi.hoisted(() => ({ currentUser: { getIdToken: vi.fn(async () => 'current-token') } as any }));
vi.mock('../firebase/config', () => ({ auth: user, db: {} }));
vi.mock('../repositories/project.repository', () => ({ projectRepository: { findById: vi.fn(), listAll: vi.fn(), subscribeToProjects: vi.fn() } }));
import { ProjectService } from '../services/project.service';
const context = { userId: 'client', role: 'VIEWER' } as any;
const service = new ProjectService();
beforeEach(() => { user.currentUser = { getIdToken: vi.fn(async () => 'current-token') }; });
afterEach(() => vi.unstubAllGlobals());
describe('P4-B1 Project client transport', () => {
  it('sends Foundation patch and token to its server command, without client role authorization', async () => {
    const fetcher = vi.fn(async () => ({ ok: true, json: async () => ({ data: {} }) })); vi.stubGlobal('fetch', fetcher);
    const updates = { nameEn: 'Updated', settings: { zatcaTaxNumber: '' } } as any;
    await service.updateProject('P1', updates, context);
    expect(fetcher).toHaveBeenCalledWith('/api/projects/P1/foundation', expect.objectContaining({ method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer current-token' }, body: JSON.stringify({ updates }) }));
  });
  it('keeps a supplied creation operationId across a transport retry', async () => {
    const fetcher = vi.fn().mockRejectedValueOnce(new Error('Network lost')).mockResolvedValue({ ok: true, json: async () => ({ data: { projectId: 'Q-PRJ-001', status: 'SETUP' } }) });
    vi.stubGlobal('fetch', fetcher);
    const payload = { operationId: 'creation-1', nameAr: 'مشروع اختبار' } as any;
    await expect(service.createProject(payload, context)).rejects.toThrow('Network lost');
    expect(await service.createProject(payload, context)).toMatchObject({ status: 'SETUP' });
    expect(fetcher.mock.calls[0][1].body).toBe(fetcher.mock.calls[1][1].body);
  });
  it('preserves stable server conflict errors', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 409, json: async () => ({ code: 'PROJECT_COMMAND_CONFLICT', error: 'PROJECT_COMMAND_CONFLICT' }) })));
    await expect(service.createProject({ operationId: 'OP' } as any, context)).rejects.toMatchObject({ code: 'PROJECT_COMMAND_CONFLICT', status: 409 });
  });
  it('fails closed without an authenticated token', async () => {
    user.currentUser = null; const fetcher = vi.fn(); vi.stubGlobal('fetch', fetcher);
    await expect(service.updateProject('P1', { nameEn: 'Changed' }, context)).rejects.toThrow('UNAUTHENTICATED'); expect(fetcher).not.toHaveBeenCalled();
  });
  it('does not expose deletion as a browser capability', async () => {
    const fetcher = vi.fn(); vi.stubGlobal('fetch', fetcher); await expect(service.deleteProject('P1', context)).rejects.toThrow('PROJECT_DELETE_NOT_SUPPORTED'); expect(fetcher).not.toHaveBeenCalled();
  });
  it('Wizard owns the creation retry key and sends only Foundation-owned settings on save', () => {
    const wizard = readFileSync('src/components/wizard/ProjectSetupWizard.tsx', 'utf8');
    expect(wizard).toContain('creationCommandRef.current.fingerprint !== fingerprint');
    expect(wizard).toContain('operationId: creationCommandRef.current.operationId');
    const save = wizard.slice(wizard.indexOf('const handleSaveFoundation'), wizard.indexOf('// Canonical Server Readiness'));
    expect(save).toContain('zatcaTaxNumber: foundationDraft.zatcaTaxNumber.trim()');
    const patch = save.slice(save.indexOf('const updates:'), save.indexOf('await projectService.updateProject'));
    expect(patch).not.toContain('...project.settings'); expect(patch).not.toContain('googleSpreadsheetId');
  });
});
