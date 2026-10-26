// @vitest-environment happy-dom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ProjectSetupWizard } from '../components/wizard/ProjectSetupWizard';
import { projectCanonicalRefreshService } from '../services/projectCanonicalRefresh.service';
import { projectService } from '../services/project.service';
vi.mock('../i18n', () => ({ useI18n: () => ({ t: (key: string) => key, direction: 'ltr', isRTL: false, locale: 'en' }) }));
vi.mock('../firebase/config', () => ({ db: {}, auth: { currentUser: { getIdToken: async () => 'token' } } }));
vi.mock('../repositories/project.repository', () => ({ projectRepository: { findById: vi.fn(), subscribeToProjects: vi.fn(() => vi.fn()) } }));
vi.mock('../repositories/pricingRule.repository', () => ({ pricingRuleRepository: { subscribeByProject: vi.fn(() => vi.fn()) } }));
vi.mock('../services/projectCanonicalRefresh.service', () => ({ projectCanonicalRefreshService: { refresh: vi.fn() } }));
vi.mock('../services/importSessionClient.service', () => ({ importSessionClientService: { listResumableSessions: vi.fn(async () => []) } }));
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
const project = { projectId: 'P1', projectCode: 'P1', projectNumber: 1, nameAr: 'Example Project', clientName: 'Client', status: 'SETUP', settings: {}, location: { addressAr: 'Address' }, authorizedCarrierIds: [], authorizedMaterialIds: [] } as any;
const auth = { userId: 'actor', role: 'SUPER_ADMIN', assignedProjectIds: ['P1'], email: 'actor@example.invalid' } as any;
const snapshot = () => ({ materials: [{ materialId: 'M1', name: 'Canonical Material', code: 'MAT', isActive: true }], carriers: [{ carrierId: 'C1', name: 'Canonical Carrier', isActive: true }], fleetRows: [], relationshipContext: { projectId: 'P1', knownDrivers: [], knownTrucks: [], knownCarriers: [{ carrierId: 'C1' }], knownMaterials: [{ materialId: 'M1' }], authorizedCarrierIds: ['C1'], authorizedMaterialIds: ['M1'] } }) as any;
let container: HTMLDivElement, root: ReturnType<typeof createRoot>;
let preview: any;
const response = (data: any) => ({ ok: true, status: 200, json: async () => data });
beforeEach(() => {
  container = document.createElement('div'); document.body.append(container); root = createRoot(container);
  vi.mocked(projectCanonicalRefreshService.refresh).mockResolvedValue(snapshot());
  preview = { projectId: 'P1', driverId: null, truckId: null, assignments: [], allocation: null };
  vi.stubGlobal('fetch', vi.fn(async (url: string) => url.endsWith('/intake-preview') ? response({ success: true, data: preview }) : url.endsWith('/setup-context') ? response({ success: true, data: { projectId: 'P1', participants: [], fleet: { projectId: 'P1', rows: [], truckCount: 0 } } }) : response({ success: true, data: {}, ready: false, blockers: [], projectId: 'P1' })));
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.clearAllMocks(); });
async function render(role = 'SUPER_ADMIN') { await act(async () => root.render(<ProjectSetupWizard projects={[project]} authContext={{ ...auth, role } as any} selectedProjectId="P1" />)); }
async function click(text: string) { const b = Array.from(container.querySelectorAll('button')).find(b => b.textContent?.trim() === text); expect(b, text).toBeDefined(); await act(async () => b!.click()); }
async function change(element: HTMLInputElement | HTMLSelectElement, value: string) { await act(async () => { Object.getOwnPropertyDescriptor(element instanceof HTMLSelectElement ? window.HTMLSelectElement.prototype : window.HTMLInputElement.prototype, 'value')!.set!.call(element, value); element.dispatchEvent(new Event('change', { bubbles: true })); }); }
async function openManual() {
  await render(); const roster = Array.from(container.querySelectorAll('button')).find(b => b.textContent?.includes('projects.batch4.layer_roster'))!;
  await act(async () => roster.click()); await click('projects.batch4.manual_add');
  const form = container.querySelector('form')!; const fields = Array.from(form.querySelectorAll('input'));
  await change(fields[0], 'Driver Example'); await change(fields[1], '0500000000'); await change(fields[2], 'AAA'); await change(fields[3], '1234567890');
  const selects = form.querySelectorAll('select'); await change(selects[0], 'C1'); await change(selects[1], 'M1'); return form;
}
async function submit(form: HTMLFormElement) { await act(async () => form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))); }
const intakeCalls = () => vi.mocked(fetch).mock.calls.filter(([url]) => url === '/api/intake/canonical');
describe('P6-B1 manual intake continuity', () => {
  it('uses the canonical Material name and full refresh before resetting the form', async () => {
    const form = await openManual(); expect(form.textContent).toContain('Canonical Material'); await submit(form);
    expect(intakeCalls()).toHaveLength(1); expect(projectCanonicalRefreshService.refresh).toHaveBeenCalledTimes(2); expect(container.querySelector('form')).toBeNull();
  });
  it('retains successful intake and retries refresh without another preview or command', async () => {
    const form = await openManual(); vi.mocked(projectCanonicalRefreshService.refresh).mockRejectedValueOnce(Error('down'));
    await submit(form); expect(form.textContent).toContain('setup.errors.refresh'); expect(form.querySelector('fieldset')!.disabled).toBe(true); expect(container.querySelector('form')).toBe(form);
    await submit(form); expect(intakeCalls()).toHaveLength(1); expect(vi.mocked(fetch).mock.calls.filter(([url]) => String(url).endsWith('/intake-preview'))).toHaveLength(1); expect(container.querySelector('form')).toBeNull();
  });
  it('blocks double submit while the command is in flight', async () => {
    const form = await openManual(); const existing = vi.mocked(fetch).getMockImplementation()!;
    let finish!: (value: any) => void; const pending = new Promise<any>(resolve => finish = resolve);
    vi.mocked(fetch).mockImplementation(((url: string, init: any) => url === '/api/intake/canonical' ? pending : existing(url, init)) as any);
    await act(async () => { form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); });
    expect(intakeCalls()).toHaveLength(1); await act(async () => finish(response({ success: true, data: {} })));
  });
  it('previews displaced IDs and requires explicit confirmation before composite intake', async () => {
    const form = await openManual(); preview = { ...preview, driverId: 'D1', truckId: 'T1', assignments: [{ assignmentId: 'OLD', driverId: 'D1', truckId: 'T2' }], allocation: { materialId: 'M2' } };
    await submit(form); expect(intakeCalls()).toHaveLength(0); expect(form.textContent).toContain('D1 → T2'); expect(form.textContent).toContain('M2 → M1');
    await act(async () => form.querySelector<HTMLInputElement>('input[type=checkbox]')!.click()); await submit(form); expect(intakeCalls()).toHaveLength(1);
  });
  it('fails closed when no reliable intake preview is available', async () => {
    const form = await openManual(), existing = vi.mocked(fetch).getMockImplementation()!;
    vi.mocked(fetch).mockImplementation(((url: string, init: any) => url.endsWith('/intake-preview') ? Promise.resolve({ ok: false, status: 503, json: async () => ({ code: 'SETUP_PREVIEW_UNAVAILABLE', error: 'private/path' }) }) : existing(url, init)) as any);
    await submit(form); expect(intakeCalls()).toHaveLength(0); expect(form.textContent).toContain('setup.useExplicit'); expect(form.textContent).not.toContain('private/path');
  });
});
describe('P6-B1 Foundation and Global governance presentation', () => {
  it('Foundation refresh failure keeps a receipt; retry never repeats the Project command', async () => {
    const command = vi.spyOn(projectService, 'updateProject').mockResolvedValue();
    vi.spyOn(projectService, 'getProject').mockRejectedValueOnce(Error('read failed')).mockResolvedValue({ ...project, nameAr: 'Changed project' });
    await render(); await click('projects.batch4.edit_data'); await change(container.querySelector<HTMLInputElement>('input[value="Example Project"]')!, 'Changed project');
    await click('shared.actions.save'); expect(container.textContent).toContain('setup.errors.refresh'); expect(container.textContent).not.toContain('projects.messages.changes_saved');
    await click('setup.retry'); expect(command).toHaveBeenCalledTimes(1); expect(container.textContent).toContain('projects.messages.changes_saved');
  });
  it.each(['SUPER_ADMIN', 'PROJECT_ADMIN'])('%s sees only its authorized Global profile controls', async role => {
    await render(role); const material = Array.from(container.querySelectorAll('button')).find(b => b.textContent?.includes('projects.batch4.layer_materials'))!;
    await act(async () => material.click()); expect(container.textContent).toContain('projects.batch4.add_material');
    const edits = () => Array.from(container.querySelectorAll('button')).filter(b => b.textContent?.trim() === 'shared.actions.edit');
    expect(edits()).toHaveLength(role === 'SUPER_ADMIN' ? 1 : 0);
    const carrier = Array.from(container.querySelectorAll('button')).find(b => b.textContent?.includes('projects.batch4.layer_carriers'))!;
    await act(async () => carrier.click()); expect(container.textContent).toContain('projects.labels.add_carrier'); expect(edits()).toHaveLength(role === 'SUPER_ADMIN' ? 1 : 0);
  });
});
