// @vitest-environment happy-dom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FleetCommandEditor, FleetSetupWorkspace } from '../components/wizard/FleetSetupWorkspace';
import { CarrierEditorModal } from '../components/masterData/CarrierEditorModal';
import { MaterialEditorModal } from '../components/masterData/MaterialEditorModal';
import { assignmentPreview, allocationPreview, eligibleAffiliatedParticipants } from '../utils/setupFleetActions';
import type { SetupFleetContext, SetupParticipant } from '../types/setupFleet';
vi.mock('../i18n', () => ({ useI18n: () => ({ t: (key: string) => key, direction: 'ltr', isRTL: false }) }));
vi.mock('../firebase/config', () => ({ auth: { currentUser: { getIdToken: async () => 'token' } }, db: {} }));
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
function participant(kind: SetupParticipant['kind'], id: string): SetupParticipant {
  return {
    kind, id, name: id, globalStatus: 'ACTIVE', membershipStatus: 'ACTIVE', eligible: true, canReactivate: true,
    affiliation: kind === 'DRIVER' || kind === 'TRUCK' ? { carrierId: 'C1', status: 'ACTIVE' } : null
  };
}
function initial(): SetupFleetContext {
  return {
    projectId: 'P1', participants: [participant('CARRIER', 'C1'), participant('CARRIER', 'C2'), participant('MATERIAL', 'M1'), participant('MATERIAL', 'M2'), participant('DRIVER', 'D1'), participant('DRIVER', 'D2'), participant('TRUCK', 'T1'), participant('TRUCK', 'T2')],
    fleet: { projectId: 'P1', truckCount: 1, generatedAt: new Date().toISOString(), rows: [{ projectId: 'P1', truckId: 'T1', plateNumber: 'AAA', truckType: 'STANDARD', carrierId: 'C1', carrierName: 'C1', driverId: null, driverName: null, materialId: null, materialName: null, assignmentStatus: 'UNASSIGNED_DRIVER', allocationStatus: 'UNALLOCATED_MATERIAL', classification: 'PARTIAL', assignmentEligible: false, allocationEligible: false, integrityIssues: [{ code: 'UNASSIGNED_DRIVER', category: 'PARTIAL', message: 'not a UI message' }] }] }
  };
}
let container: HTMLDivElement, root: ReturnType<typeof createRoot>, ctx: SetupFleetContext;
const snapshot = { materials: [], carriers: [], fleetRows: [], relationshipContext: {} } as any;
const ok = () => ({ ok: true, status: 200, json: async () => ({ success: true, data: { driverId: 'D1' } }) });
const deferred = () => { let resolve!: (x: any) => void; const promise = new Promise<any>(done => resolve = done); return { promise, resolve }; };
beforeEach(() => { container = document.createElement('div'); document.body.append(container); root = createRoot(container); ctx = initial(); vi.stubGlobal('fetch', vi.fn(async () => ok())); });
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });
async function renderEditor(mode: any, id?: string, props: any = {}, projectId = 'P1') {
  const callbacks = { onClose: vi.fn(), onDependency: vi.fn(), refresh: vi.fn(async () => snapshot), ...props };
  await act(async () => root.render(<FleetCommandEditor key={projectId} projectId={projectId} context={ctx} action={{ mode, entity: ctx.participants.find(p => p.id === id) }} isCurrent={() => true} {...callbacks} />));
  return callbacks;
}
async function change(element: HTMLInputElement | HTMLSelectElement, value: string) {
  await act(async () => { Object.getOwnPropertyDescriptor(element instanceof HTMLSelectElement ? window.HTMLSelectElement.prototype : window.HTMLInputElement.prototype, 'value')!.set!.call(element, value); element.dispatchEvent(new Event('change', { bubbles: true })); });
}
async function submit() { await act(async () => { document.body.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); }); }
const selects = () => Array.from(document.body.querySelectorAll('select'));
const inputs = () => Array.from(document.body.querySelectorAll<HTMLInputElement>('input:not([type=checkbox])'));
const body = () => JSON.parse(vi.mocked(fetch).mock.calls.at(-1)![1]!.body as string);
describe('P6-B1 selector and command intent', () => {
  it('chooses ASSIGN/ALLOCATE for empty relationships and preserves matching idempotent intent', () => {
    expect(assignmentPreview(ctx, 'D1', 'T1')).toMatchObject({ command: 'ASSIGN', affected: [] });
    const same = { assignmentId: 'A', driverId: 'D1', truckId: 'T1' };
    ctx.participants.find(p => p.id === 'D1')!.assignment = same; ctx.participants.find(p => p.id === 'T1')!.assignment = same;
    expect(assignmentPreview(ctx, 'D1', 'T1')?.command).toBe('ASSIGN'); expect(allocationPreview(ctx, 'T1', 'M1')?.command).toBe('ALLOCATE');
  });
  it('excludes ineligible, inactive and mismatched affiliations from new assignment', () => {
    ctx.participants.find(p => p.id === 'D1')!.eligible = false;
    ctx.participants.find(p => p.id === 'D2')!.affiliation = { carrierId: 'C2', status: 'ACTIVE' };
    expect(eligibleAffiliatedParticipants(ctx, 'DRIVER').map(p => p.id)).toEqual(['D2']);
    expect(assignmentPreview(ctx, 'D2', 'T1')).toBeNull();
    ctx.participants.find(p => p.id === 'T1')!.affiliation!.status = 'INACTIVE'; expect(allocationPreview(ctx, 'T1', 'M1')).toBeNull();
  });
  it.each(['DRIVER', 'TRUCK'])('%s create/reuse submits only the standalone endpoint', async mode => {
    await renderEditor(mode); if (mode === 'DRIVER') await change(inputs()[0], 'Driver');
    await change(document.body.querySelector<HTMLInputElement>(`input[name="${mode==='DRIVER'?'residencyId':'plateNumber'}"]`)!, mode === 'DRIVER' ? '1234567890' : 'AAA'); await change(selects()[0], 'C1'); await submit();
    expect(fetch).toHaveBeenCalledTimes(1); expect(vi.mocked(fetch).mock.calls[0][0]).toContain(`/setup-${mode.toLowerCase()}`);
    expect(JSON.stringify(body())).not.toMatch(/assignment|allocation|materialId/);
  });
  it('identity creation with an unavailable read context retries reads without mutation or closing', async()=>{
    const cb=await renderEditor('DRIVER',undefined,{readAvailable:false});expect(inputs().every(input=>input.disabled)).toBe(true);await submit();expect(fetch).not.toHaveBeenCalled();expect(cb.refresh).toHaveBeenCalledOnce();expect(cb.onClose).not.toHaveBeenCalled();
  });
  it('does not repeat a standalone command when canonical refresh fails', async () => {
    const refresh = vi.fn().mockRejectedValueOnce(Error('network')).mockResolvedValue(snapshot), cb = await renderEditor('DRIVER', undefined, { refresh });
    await change(inputs()[0], 'Driver'); await change(inputs()[1], '1234567890'); await change(selects()[0], 'C1'); await submit();
    expect(document.body.textContent).toContain('import.resolution.refresh'); expect(cb.onClose).not.toHaveBeenCalled(); expect(inputs()[0].disabled).toBe(true);
    await submit(); expect(fetch).toHaveBeenCalledTimes(1); expect(refresh).toHaveBeenCalledTimes(2); expect(cb.onClose).toHaveBeenCalledTimes(1);
  });
  it('requires confirmation and previews all displaced assignments before REASSIGN', async () => {
    ctx.participants.find(p => p.id === 'D1')!.assignment = { assignmentId: 'OLD', driverId: 'D1', truckId: 'T2' };
    await renderEditor('ASSIGNMENT', 'T1'); await change(selects()[0], 'D1'); await submit(); expect(fetch).not.toHaveBeenCalled();
    expect(document.body.textContent).toContain('D1 → T2'); expect(document.body.textContent).toContain('D1 → T1');
    await act(async () => document.body.querySelector<HTMLInputElement>('input[type=checkbox]')!.click()); await submit();
    expect(body()).toEqual({ command: 'REASSIGN', driverId: 'D1', truckId: 'T1' });
  });
  it('uses CLOSE with the current assignment ID without deleting history', async () => {
    ctx.participants.find(p => p.id === 'T1')!.assignment = { assignmentId: 'A', driverId: 'D1', truckId: 'T1' };
    await renderEditor('ASSIGNMENT', 'T1'); await act(async () => document.body.querySelector<HTMLInputElement>('input[type=checkbox]')!.click()); await submit();
    expect(body()).toEqual({ command: 'CLOSE', assignmentId: 'A' });
  });
  it('requires explicit REALLOCATE confirmation and excludes inactive materials', async () => {
    ctx.participants.find(p => p.id === 'T1')!.allocation = { allocationId: 'L', truckId: 'T1', materialId: 'M1' };
    ctx.participants.find(p => p.id === 'M1')!.eligible = false;
    await renderEditor('ALLOCATION', 'T1'); expect(Array.from(selects()[1].options).map(o => o.value)).not.toContain('M1');
    await change(selects()[1], 'M2'); await submit(); expect(fetch).not.toHaveBeenCalled();
    expect(document.body.textContent).toContain('M1 → M2');
    await act(async () => document.body.querySelectorAll<HTMLInputElement>('input[type=checkbox]')[1].click()); await submit();
    expect(body()).toEqual({ command: 'REALLOCATE', truckId: 'T1', materialId: 'M2' });
  });
  it('closes allocation using only its canonical ID', async () => {
    ctx.participants.find(p => p.id === 'T1')!.allocation = { allocationId: 'L', truckId: 'T1', materialId: 'M1' };
    await renderEditor('ALLOCATION', 'T1'); await act(async () => document.body.querySelector<HTMLInputElement>('input[type=checkbox]')!.click()); await submit(); expect(body()).toEqual({ command: 'CLOSE', allocationId: 'L' });
  });
  it.each(['D1', 'T1'])('%s affiliation reassignment is explicit and dependency error guides without cascading', async id => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 409, json: async () => ({ success: false, code: 'P5_B3_RELATIONSHIP_DEPENDENCY', error: 'private stack' }) })));
    const cb = await renderEditor('AFFILIATION', id); await change(selects()[0], 'C2'); await submit(); expect(fetch).not.toHaveBeenCalled();
    await act(async () => document.body.querySelectorAll<HTMLInputElement>('input[type=checkbox]')[1].click()); await submit();
    expect(body()).toMatchObject({ command: 'REASSIGN', entityId: id }); expect(fetch).toHaveBeenCalledTimes(1);
    expect(document.body.textContent).toContain('setup.errors.dependency'); expect(document.body.textContent).not.toContain('private stack');
    await act(async () => Array.from(document.body.querySelectorAll('button')).find(b => b.textContent === 'setup.manageAssignment')!.click()); expect(cb.onDependency).toHaveBeenCalledTimes(1);
  });
  it('reactivates an eligible removed membership explicitly', async () => {
    ctx.participants.find(p => p.id === 'D1')!.membershipStatus = 'REMOVED'; await renderEditor('REACTIVATE', 'D1'); await submit();
    expect(body()).toEqual({ kind: 'DRIVER', entityId: 'D1', command: 'REACTIVATE' });
  });
  it('does not reactivate an ineligible global', async () => {
    Object.assign(ctx.participants.find(p => p.id === 'T1')!, { membershipStatus: 'REMOVED', globalStatus: 'MAINTENANCE', canReactivate: false, eligible: false });
    await renderEditor('REACTIVATE', 'T1'); await submit(); expect(fetch).not.toHaveBeenCalled(); expect(document.body.textContent).toContain('setup.status.MAINTENANCE');
  });
});
describe('P6-B1 rendered state and editor races', () => {
  it('retires displayed participation when a subsequent authorized read fails closed', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ success: true, data: ctx }) })));
    const props = { projectId: 'P1', mutable: true, isCurrent: () => true, apply: vi.fn() };
    await act(async () => root.render(<FleetSetupWorkspace {...props} revision={1} />));
    expect(document.body.textContent).toContain('T1');
    vi.mocked(fetch).mockResolvedValue({ ok: false, status: 403 } as any);
    await act(async () => root.render(<FleetSetupWorkspace {...props} revision={2} />));
    expect(document.body.textContent).not.toContain('T1'); expect(document.body.textContent).toContain('setup.errors.read'); expect(document.body.querySelector('select')).toBeNull();
  });
  it.each(['Carrier', 'Material'] as const)('late %s refresh cannot close a B modal', async kind => {
    const pending = deferred(), onClose = vi.fn(), onCreated = vi.fn(() => pending.promise);
    const service: any = kind === 'Carrier' ? { createProjectCarrier: vi.fn(async () => ({ carrierId: 'C1' })) } : { createProjectMaterial: vi.fn(async () => ({ materialId: 'M1' })) };
    const Modal = kind === 'Carrier' ? CarrierEditorModal : MaterialEditorModal;
    await act(async () => root.render(<Modal open projectId="P1" onClose={onClose} onCreated={onCreated} clientService={service} />));
    await change(document.querySelector<HTMLInputElement>(`input[placeholder="entityResolution.labels.${kind.toLowerCase()}_name_example"]`)!, 'Example');
    await change(document.querySelector<HTMLInputElement>(`input[placeholder="entityResolution.labels.${kind === 'Carrier' ? 'registration_example' : 'material_code_example'}"]`)!, kind === 'Carrier' ? '1010123456' : 'SAND');
    await act(async () => document.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
    expect(onCreated).toHaveBeenCalledTimes(1);
    await act(async () => root.render(<Modal open projectId="P2" onClose={onClose} onCreated={onCreated} clientService={service} />));
    await act(async () => pending.resolve(undefined)); expect(onClose).not.toHaveBeenCalled();
    expect(document.querySelector<HTMLInputElement>(`input[placeholder="entityResolution.labels.${kind.toLowerCase()}_name_example"]`)!.disabled).toBe(false);
  });
  it.each(['PARTIAL', 'INELIGIBLE', 'INTEGRITY_ERROR', 'OPERATIONAL'] as const)('renders %s separately while keeping the Truck row', async classification => {
    ctx.fleet.rows[0].classification = classification;
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ success: true, data: ctx }) })));
    await act(async () => root.render(<FleetSetupWorkspace projectId="P1" mutable isCurrent={() => true} apply={vi.fn()} />));
    expect(document.body.textContent).toContain(`setup.state.${classification}`); expect(document.body.textContent).toContain('T1');
    expect(document.body.textContent).toContain('setup.unavailable'); expect(document.body.textContent).not.toContain('not a UI message');
    if (classification === 'INTEGRITY_ERROR') expect(document.body.querySelector('select[aria-label="setup.actions T1"]')).toBeNull();
  });
  it.each(['DRIVER', 'TRUCK', 'ASSIGNMENT'] as const)('late %s response cannot close or mutate a B editor', async mode => {
    const pending = deferred(), onClose = vi.fn(), refresh = vi.fn(async () => snapshot);
    vi.stubGlobal('fetch', vi.fn(() => pending.promise));
    await renderEditor(mode, mode === 'ASSIGNMENT' ? 'T1' : undefined, { onClose, refresh });
    if (mode === 'DRIVER') await change(inputs()[0], 'Driver');
    if (mode !== 'ASSIGNMENT') { await change(document.body.querySelector<HTMLInputElement>(`input[name="${mode==='DRIVER'?'residencyId':'plateNumber'}"]`)!, mode === 'DRIVER' ? '1234567890' : 'AAA'); await change(selects()[0], 'C1'); }
    else await change(selects()[0], 'D1');
    await submit(); await renderEditor('TRUCK', undefined, { onClose, refresh }, 'P2');
    await act(async () => pending.resolve(ok()));
    expect(onClose).not.toHaveBeenCalled(); expect(refresh).not.toHaveBeenCalled(); expect(inputs()[0].disabled).toBe(false); expect(document.body.textContent).not.toContain('import.resolution.refresh');
  });
  it.each(['Carrier', 'Material'] as const)('late %s command cannot affect the reused B modal', async kind => {
    const pending = deferred(), onClose = vi.fn(), onCreated = vi.fn();
    const service: any = kind === 'Carrier' ? { createProjectCarrier: vi.fn(() => pending.promise) } : { createProjectMaterial: vi.fn(() => pending.promise) };
    const Modal = kind === 'Carrier' ? CarrierEditorModal : MaterialEditorModal;
    await act(async () => root.render(<Modal open projectId="P1" onClose={onClose} onCreated={onCreated} clientService={service} />));
    const name = document.querySelector<HTMLInputElement>(`input[placeholder="entityResolution.labels.${kind.toLowerCase()}_name_example"]`)!;
    const natural = document.querySelector<HTMLInputElement>(`input[placeholder="entityResolution.labels.${kind === 'Carrier' ? 'registration_example' : 'material_code_example'}"]`)!;
    await change(name, 'Example'); await change(natural, kind === 'Carrier' ? '1010123456' : 'SAND');
    await act(async () => document.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
    await act(async () => root.render(<Modal open projectId="P2" onClose={onClose} onCreated={onCreated} clientService={service} />));
    await act(async () => pending.resolve({ success: true, projectId: 'P1', carrierId: 'C1', materialId: 'M1' }));
    expect(onClose).not.toHaveBeenCalled(); expect(onCreated).not.toHaveBeenCalled();
    expect(document.querySelector<HTMLInputElement>(`input[placeholder="entityResolution.labels.${kind.toLowerCase()}_name_example"]`)!.disabled).toBe(false);
  });
});
