// @vitest-environment happy-dom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SetupReadinessPanel } from '../components/wizard/SetupReadinessPanel';
import { ProjectSetupWizard } from '../components/wizard/ProjectSetupWizard';
import { isEvaluatedReadiness, readinessBlockerKey } from '../i18n/readinessPresentation';
import { dictionaries } from '../locales';
import { projectService } from '../services/project.service';
vi.mock('../i18n', () => ({ useI18n: () => ({ t: (key: string) => key, direction: 'ltr', locale: 'en', isRTL: false }) }));
vi.mock('../firebase/config', () => ({ db: {}, auth: { currentUser: { getIdToken: async () => 'token' } } }));
vi.mock('../repositories/project.repository', () => ({ projectRepository: { findById: vi.fn(), subscribeToProjects: vi.fn(() => vi.fn()) } }));
vi.mock('../repositories/pricingRule.repository', () => ({ pricingRuleRepository: { subscribeByProject: vi.fn(() => vi.fn()) } }));
vi.mock('../services/projectCanonicalRefresh.service', () => ({ projectCanonicalRefreshService: { refresh: vi.fn(async () => ({ materials: [], carriers: [], fleetRows: [], relationshipContext: {} })) } }));
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
const project = { projectId: 'P1', projectCode: 'P1', projectNumber: 1, nameAr: 'Example project', clientName: 'Client', status: 'SETUP', settings: {}, location: { addressAr: 'Address' } } as any;
const auth = { userId: 'actor', role: 'SUPER_ADMIN', assignedProjectIds: ['P1'] } as any;
const result = (projectId = 'P1', ready = true) => ({ projectId, ready: false, lifecycle: { ready: false, blockers: [{ code: 'PROJECT_NOT_APPROVED', message: 'raw English must not leak' }] }, setup: { evaluated: true, ready, ownerPhase: 'PHASE_6', blockers: ready ? [] : [{ code: 'NO_USABLE_CARRIER', entityId: 'B_ONLY', recommendedAction: 'OPEN_CARRIERS' }] }, operational: { ready: false, blockers: [{ code: 'NO_APPLICABLE_PRICING', message: '/private/Firebase/path' }] }, blockers: [] });
const response = (data: any) => ({ ok: true, status: 200, json: async () => data });
let container: HTMLDivElement, root: ReturnType<typeof createRoot>, current: any;
beforeEach(() => {
  container = document.createElement('div'); document.body.append(container); root = createRoot(container); current = result();
  vi.stubGlobal('fetch', vi.fn(async () => response(current))); vi.stubGlobal('alert', vi.fn());
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
async function render(status = 'SETUP', id = 'P1') { await act(async () => root.render(<ProjectSetupWizard projects={[{ ...project, status }, { ...project, projectId: 'P2', nameAr: 'Project B', status }]} authContext={auth} selectedProjectId={id} />)); }
async function click(key: string) { const button = Array.from(container.querySelectorAll('button')).find(b => b.textContent?.includes(key)); expect(button, key).toBeDefined(); await act(async () => button!.click()); }
const button = (key: string) => Array.from(container.querySelectorAll('button')).find(b => b.textContent?.includes(key)) as HTMLButtonElement;
describe('P6-B2 translated readiness dimensions', () => {
  it('shows Lifecycle / Setup / Operational separately without server prose', async () => {
    const action = vi.fn(); await act(async () => root.render(<SetupReadinessPanel result={result('P1', false) as any} onAction={action} />));
    const setup = container.querySelector('section[aria-label="readiness.setup"]')!;
    expect(container.querySelectorAll('section')).toHaveLength(3); expect(setup.textContent).toContain('readiness.carrier');
    expect(setup.textContent).not.toContain('readiness.pricing'); expect(container.textContent).not.toContain('raw English'); expect(container.textContent).not.toContain('/private/');
    await click('readiness.action.OPEN_CARRIERS'); expect(action).toHaveBeenCalledExactlyOnceWith('OPEN_CARRIERS');
  });
  it.each(['SETUP_FOUNDATION_INCOMPLETE', 'NO_USABLE_CARRIER', 'NO_USABLE_MATERIAL', 'SETUP_RELATIONSHIP_INTEGRITY_ERROR', 'SETUP_READ_UNAVAILABLE', 'NO_APPLICABLE_PRICING', 'NO_COMPLETE_OPERATIONAL_PATH'])('%s resolves in all three locales', code => {
    for (const dictionary of Object.values(dictionaries)) expect(dictionary[readinessBlockerKey(code)]?.trim().length).toBeGreaterThan(5);
  });
  it('rejects a deferred/absent/mismatched Setup contract and treats unknown errors safely', () => {
    expect(isEvaluatedReadiness(result(), 'P1')).toBe(true);
    expect(isEvaluatedReadiness({ ...result(), setup: { evaluated: false } }, 'P1')).toBe(false);
    expect(isEvaluatedReadiness(result(), 'P2')).toBe(false);
    expect(readinessBlockerKey('Firebase:/private/path')).toBe('readiness.changed');
    expect(isEvaluatedReadiness({ ...result(), setup: { ...result().setup, blockers: [{ code: 'X', entityId: '/private/path' }] } }, 'P1')).toBe(false);
  });
});
describe('P6-B2 rendered review and activation gates', () => {
  it('permits Submit Review with Setup ready even without pricing or a complete operational path', async () => {
    await render(); await click('projects.batch4.layer_activation'); expect(button('projects.batch4.submit_review').disabled).toBe(false);
    expect(container.textContent).toContain('readiness.pricing'); expect(container.textContent).not.toContain('projects.batch4.check_workspace');
  });
  it('keeps Submit Review disabled when Setup is incomplete even if operational prerequisites are ready', async () => {
    current = result('P1', false); current.operational.ready = true; current.operational.blockers = [];
    await render(); await click('projects.batch4.layer_activation'); expect(button('projects.batch4.submit_review').disabled).toBe(true);
    await click('readiness.action.OPEN_CARRIERS'); expect(container.textContent).toContain('projects.batch4.project_approved_carriers');
  });
  it('keeps activation disabled when Setup is ready but operation/pricing is not', async () => {
    current.lifecycle = { ready: true, blockers: [] }; await render('APPROVED'); await click('projects.batch4.layer_activation'); expect(button('projects.batch4.activate_operations').disabled).toBe(true);
  });
  it('requires all three server dimensions before activation can be offered', async () => {
    current.ready = true; current.lifecycle = { ready: true, blockers: [] }; current.operational = { ready: true, blockers: [] };
    await render('APPROVED'); await click('projects.batch4.layer_activation'); expect(button('projects.batch4.activate_operations').disabled).toBe(false);
  });
  it('blocks review during Foundation mutation and saved-but-unrefreshed state', async () => {
    let finish!: () => void; const pending = new Promise<void>(resolve => finish = resolve);
    vi.spyOn(projectService, 'updateProject').mockReturnValue(pending); vi.spyOn(projectService, 'getProject').mockRejectedValue(Error('down'));
    await render(); await click('projects.batch4.edit_data');
    const input = container.querySelector<HTMLInputElement>('input[value="Example project"]')!;
    await act(async () => { Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!.call(input, 'Changed project'); input.dispatchEvent(new Event('change', { bubbles: true })); });
    await click('shared.actions.save'); await click('projects.batch4.layer_activation'); expect(button('projects.batch4.submit_review').disabled).toBe(true);
    await act(async () => finish()); expect(button('projects.batch4.submit_review').disabled).toBe(true);
  });
  it('discards late A readiness and keeps B blockers and button state', async () => {
    let finish!: (v: any) => void; const a = new Promise(resolve => finish = resolve);
    vi.stubGlobal('fetch', vi.fn((url: string) => url.includes('/P1/') ? a : Promise.resolve(response(result('P2', false)))));
    await render(); await render('SETUP', 'P2'); await click('projects.batch4.layer_activation');
    await act(async () => finish(response(result('P1', true))));
    expect(button('projects.batch4.submit_review').disabled).toBe(true); expect(container.textContent).toContain('B_ONLY');
  });
  it('retires stale-ready UI on a current access failure', async () => {
    await render(); await click('projects.batch4.layer_activation'); expect(button('projects.batch4.submit_review').disabled).toBe(false);
    vi.mocked(fetch).mockResolvedValue({ ok: false, status: 403, json: async () => ({ code: 'FORBIDDEN_PROJECT_ACCESS', error: 'private' }) } as any);
    await click('projects.batch4.refresh_readiness'); expect(button('projects.batch4.submit_review').disabled).toBe(true); expect(container.textContent).not.toContain('private');
  });
  it('handles direct server review rejection with a translated message and refreshes blockers', async () => {
    const existing = vi.mocked(fetch).getMockImplementation()!;
    vi.mocked(fetch).mockImplementation(((url: string, init: any) => url.endsWith('/lifecycle-transition') ? (current = result('P1', false), Promise.resolve({ ok: false, json: async () => ({ code: 'PROJECT_SETUP_NOT_READY', error: 'technical persistence details' }) })) : existing(url, init)) as any);
    await render(); await click('projects.batch4.layer_activation'); await click('projects.batch4.submit_review');
    expect(alert).toHaveBeenCalledExactlyOnceWith('readiness.reviewBlocked');
    expect(button('projects.batch4.submit_review').disabled).toBe(true);
  });
});
