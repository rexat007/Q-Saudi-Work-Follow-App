// @vitest-environment happy-dom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FleetCommandEditor, FleetSetupWorkspace } from '../components/wizard/FleetSetupWorkspace';
import { projectCanonicalRefreshService } from '../services/projectCanonicalRefresh.service';
import type { SetupFleetContext, SetupParticipant } from '../types/setupFleet';
const language = vi.hoisted(() => ({ direction: 'ltr' }));
vi.mock('../i18n', () => ({ useI18n: () => ({ t: (k: string) => k, direction: language.direction }) }));
vi.mock('../firebase/config', () => ({ db: {}, auth: { currentUser: { getIdToken: async () => 'fixture-token' } } }));
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
const p = (kind: SetupParticipant['kind'], id: string): SetupParticipant => ({ kind, id, name: `Readable ${id}`, globalStatus: 'ACTIVE', membershipStatus: 'ACTIVE', eligible: true, canReactivate: true, affiliation: kind === 'DRIVER' || kind === 'TRUCK' ? { carrierId: 'C', status: 'ACTIVE' } : null });
function context(): SetupFleetContext {
  return { projectId: 'P1', participants: [p('CARRIER', 'C'), p('MATERIAL', 'M'), p('DRIVER', 'D'), p('TRUCK', 'T')], fleet: { projectId: 'P1', truckCount: 0, generatedAt: '', rows: [] } };
}
let container: HTMLDivElement, root: ReturnType<typeof createRoot>;
beforeEach(() => { container = document.createElement('div'); document.body.append(container); root = createRoot(container); language.direction = 'ltr'; });
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });
async function select(element: HTMLSelectElement, value: string) { await act(async () => { element.value = value; element.dispatchEvent(new Event('change', { bubbles: true })); }); }
async function submit() { await act(async () => container.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))); }
describe('P6-B3 recovery and host continuity', () => {
  it.each(['REACTIVATE', 'AFFILIATION', 'ASSIGNMENT', 'ALLOCATION'] as const)('%s retains its command receipt across failed refresh', async mode => {
    const ctx = context(), entity = ctx.participants.find(p => p.id === (mode === 'REACTIVATE' || mode === 'AFFILIATION' ? 'D' : 'T'))!;
    if (mode === 'REACTIVATE') entity.membershipStatus = 'REMOVED';
    if (mode === 'AFFILIATION') entity.affiliation = null;
    const refresh = vi.fn().mockRejectedValueOnce(Error('controlled read failure')).mockResolvedValue({}), close = vi.fn();
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ success: true, data: {} }) })));
    await act(async () => root.render(<FleetCommandEditor projectId="P1" context={ctx} action={{ mode, entity }} isCurrent={() => true} refresh={refresh} onClose={close} onDependency={vi.fn()} />));
    if (mode === 'AFFILIATION') await select(container.querySelector('select')!, 'C');
    if (mode === 'ASSIGNMENT') await select(container.querySelector('select')!, 'D');
    if (mode === 'ALLOCATION') await select(container.querySelectorAll('select')[1], 'M');
    await submit(); expect(fetch).toHaveBeenCalledTimes(1); expect(close).not.toHaveBeenCalled(); expect(container.textContent).toContain('setup.errors.refresh');
    await submit(); expect(fetch).toHaveBeenCalledTimes(1); expect(refresh).toHaveBeenCalledTimes(2); expect(close).toHaveBeenCalledTimes(1);
  });
  it('keeps a committed editor mounted after host refresh failure and retries reads without repeating the command', async () => {
    let fail = false, commands = 0;
    const ctx = context(); ctx.participants.find(p => p.id === 'T')!.membershipStatus = 'REMOVED';
    vi.spyOn(projectCanonicalRefreshService, 'refresh').mockResolvedValue({ materials: [], carriers: [], fleetRows: [], relationshipContext: {} } as any);
    vi.stubGlobal('fetch', vi.fn(async (_url: string, options?: RequestInit) => {
      if (options?.method === 'POST') { commands++; fail = true; return { ok: true, json: async () => ({ success: true, data: {} }) }; }
      if (fail) throw Error('controlled read failure');
      return { ok: true, json: async () => ({ success: true, data: ctx }) };
    }));
    await act(async () => root.render(<FleetSetupWorkspace projectId="P1" mutable isCurrent={() => true} apply={vi.fn()} />));
    await select(container.querySelector('select[aria-label="setup.actions Readable T"]')!, 'REACTIVATE');
    await submit();
    expect(commands).toBe(1); expect(container.querySelector('[role=dialog]')).not.toBeNull();
    expect(container.textContent).toContain('setup.errors.refresh'); expect(container.querySelector('table')).toBeNull();
    fail = false; await submit();
    expect(commands).toBe(1); expect(container.querySelector('[role=dialog]')).toBeNull(); expect(container.querySelector('table')).not.toBeNull();
  });
  it('rehydrates the same Fleet host after a canonical revision, without showing empty while loading', async () => {
    const first = context(); first.participants = [];
    let finish!: (v: any) => void; const next = new Promise(resolve => finish = resolve);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, data: first }) }).mockReturnValueOnce(next));
    const props = { projectId: 'P1', mutable: true, isCurrent: () => true, apply: vi.fn() };
    await act(async () => root.render(<FleetSetupWorkspace {...props} revision={1} />)); expect(container.textContent).toContain('setup.empty');
    await act(async () => root.render(<FleetSetupWorkspace {...props} revision={2} />));
    expect(container.textContent).toContain('shared.status.loading'); expect(container.textContent).not.toContain('setup.empty'); expect(container.querySelector('select')).toBeNull();
    await act(async () => finish({ ok: true, json: async () => ({ success: true, data: context() }) }));
    expect(container.textContent).toContain('Readable T'); expect(container.textContent).not.toContain('shared.status.loading');
  });
  it.each(['ltr', 'rtl'])('Fleet and its editor respect %s direction without changing command semantics', async direction => {
    language.direction = direction;
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ success: true, data: context() }) })));
    await act(async () => root.render(<FleetSetupWorkspace projectId="P1" mutable isCurrent={() => true} apply={vi.fn()} />));
    expect(container.querySelector('section')?.dir).toBe(direction);
    await act(async () => Array.from(container.querySelectorAll('button')).find(b => b.textContent === 'setup.add.DRIVER')!.click());
    expect(container.querySelector<HTMLElement>('[role=dialog]')?.dir).toBe(direction);
  });
});
