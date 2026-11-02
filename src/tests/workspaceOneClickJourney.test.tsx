// @vitest-environment happy-dom
import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { it, expect, vi, afterEach } from 'vitest';
vi.mock('../services/workspace.service', () => ({ clientWorkspaceService: {} }));
import { WorkspaceEnsurePanel } from '../components/wizard/WorkspaceEnsurePanel';
import { runWorkspaceEnsureJourney, type WorkspaceEnsureClient } from '../utils/workspaceEnsureJourney';
import type { WorkspaceEnsureStatus } from '../types/workspaceProvisioning';
const state = (state: WorkspaceEnsureStatus['state'], action: WorkspaceEnsureStatus['actionRequired'] = null): WorkspaceEnsureStatus => ({ state, operationId: 'operation', phase: state === 'READY' ? 'READY' : 'AUTHORIZATION', completed: state === 'READY' ? ['AUTHORIZATION', 'BINDING', 'WORKBOOK', 'MASTER_DATA', 'SCRIPT', 'FINAL_VERIFY'] : [], actionRequired: action, retryable: false, canResume: false });
function client() { return { ensureWorkspace: vi.fn<WorkspaceEnsureClient['ensureWorkspace']>(), observeWorkspaceProvisioning: vi.fn(async () => state('NOT_CONFIGURED')), connectBackgroundAuthorization: vi.fn(async () => { }), requestGoogleScopes: vi.fn(async () => 'picker-only'), selectProjectWorkspaceDestination: vi.fn(async () => 'root') }; }
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
let root: Root | undefined;
afterEach(async () => { if (root)
    await act(async () => root!.unmount()); root = undefined; document.body.innerHTML = ''; });
it('one normal product click automatically continues through consent and destination to strict READY', async () => {
    const c = { ...client(), prepareEnsureInteraction: vi.fn(() => finish) };
    const finish = vi.fn();
    c.ensureWorkspace.mockResolvedValueOnce(state('ACTION_REQUIRED', 'GOOGLE_AUTHORIZATION')).mockResolvedValueOnce(state('ACTION_REQUIRED', 'DESTINATION')).mockResolvedValueOnce(state('READY'));
    const box = document.createElement('div');
    document.body.append(box);
    root = createRoot(box);
    const ready = vi.fn();
    await act(async () => root!.render(<WorkspaceEnsurePanel projectId="P1" service={c} t={k => k} onReady={ready}/>));
    expect(box.querySelectorAll('button')).toHaveLength(1);
    expect(box.querySelector('input')).toBeNull();
    await act(async () => box.querySelector('button')!.click());
    expect(c.connectBackgroundAuthorization).toHaveBeenCalledWith('P1', expect.any(Function), 'operation');
    expect(c.selectProjectWorkspaceDestination).toHaveBeenCalledWith('P1');
    expect(c.ensureWorkspace).toHaveBeenCalledTimes(3);
    expect(ready).toHaveBeenCalledOnce();
    expect(c.prepareEnsureInteraction).toHaveBeenCalledOnce();
    expect(finish).toHaveBeenCalledOnce();
    expect(box.textContent).toContain('gws.one.ready');
    expect(box.textContent).not.toContain('SCRIPT_ID');
    expect(box.querySelectorAll('button')).toHaveLength(1);
});
it('an expired durable operation resumes on remount without another manual initialize click', async () => { const c = client(); c.observeWorkspaceProvisioning.mockResolvedValue({ ...state('PREPARING'), canResume: true }); c.ensureWorkspace.mockResolvedValue(state('READY')); const box = document.createElement('div'); root = createRoot(box); await act(async () => root!.render(<WorkspaceEnsurePanel projectId="P1" service={c} t={k => k}/>)); expect(c.ensureWorkspace).toHaveBeenCalledOnce(); expect(c.connectBackgroundAuthorization).not.toHaveBeenCalled(); expect(box.textContent).toContain('gws.one.ready'); });
it('uncertain external creation shows administrator review without a normal retry or Script ID form', async () => { const c = client(); c.observeWorkspaceProvisioning.mockResolvedValue({ ...state('ATTENTION_REQUIRED'), diagnostic: 'SCRIPT_CREATE_IDENTITY_UNCERTAIN' }); const box = document.createElement('div'); root = createRoot(box); await act(async () => root!.render(<WorkspaceEnsurePanel projectId="P1" service={c} t={k => k}/>)); expect(box.textContent).toContain('gws.one.attention_required'); expect(box.textContent).not.toContain('SCRIPT_CREATE_IDENTITY_UNCERTAIN'); expect(box.querySelectorAll('input,button')).toHaveLength(0); });
it('a second caller observes the active operation and never interprets PREPARING as a 409 error', async () => { const c = client(); c.ensureWorkspace.mockResolvedValue(state('PREPARING')); c.observeWorkspaceProvisioning.mockResolvedValue(state('READY')); const progress = vi.fn(); await runWorkspaceEnsureJourney('P1', c, () => true, progress, async () => { }); expect(c.ensureWorkspace).toHaveBeenCalledOnce(); expect(progress).toHaveBeenLastCalledWith(state('READY')); });
it('a lost ensure response joins durable progress rather than starting a new resource sequence', async () => { const c = client(); c.ensureWorkspace.mockRejectedValueOnce(Error('HOST_SERVICE_UNAVAILABLE')); c.observeWorkspaceProvisioning.mockResolvedValueOnce(state('PREPARING')).mockResolvedValue(state('READY')); expect((await runWorkspaceEnsureJourney('P1', c, () => true, vi.fn(), async () => { })).state).toBe('READY'); expect(c.ensureWorkspace).toHaveBeenCalledOnce(); });
it('a Project switch fences callback continuation and cannot start ensure for the old Project again', async () => { const c = client(); c.ensureWorkspace.mockResolvedValue(state('ACTION_REQUIRED', 'GOOGLE_AUTHORIZATION')); let current = true; c.connectBackgroundAuthorization.mockImplementation(async () => { current = false; }); await expect(runWorkspaceEnsureJourney('P1', c, () => current, vi.fn(), async () => { })).rejects.toThrow('WORKSPACE_IDENTITY_CHANGED'); expect(c.ensureWorkspace).toHaveBeenCalledOnce(); expect(c.selectProjectWorkspaceDestination).not.toHaveBeenCalled(); });
it('failed consent stops the journey without silently retrying permission or executing phases', async () => { const c = client(); c.ensureWorkspace.mockResolvedValue(state('ACTION_REQUIRED', 'GOOGLE_AUTHORIZATION')); c.connectBackgroundAuthorization.mockRejectedValueOnce(Error('AUTHORIZATION_DENIED')); await expect(runWorkspaceEnsureJourney('P1', c, () => true, vi.fn(), async () => { })).rejects.toThrow('AUTHORIZATION_DENIED'); expect(c.ensureWorkspace).toHaveBeenCalledOnce(); expect(c.connectBackgroundAuthorization).toHaveBeenCalledOnce(); });

it('actual React primary action drives the real durable engine, refresh grant, resource receipts and manifest to READY', async () => {
    const { workspaceEnsureFixture } = await import('./helpers/workspaceEnsureFixture');
    const { operationActor } = await import('./helpers/operationalProfileFixture');
    const x = workspaceEnsureFixture();
    const service: WorkspaceEnsureClient = {
        ensureWorkspace: async () => x.run(),
        observeWorkspaceProvisioning: async () => x.engine().observe('P1', operationActor),
        connectBackgroundAuthorization: async (id, current, operationId) => {
            expect(id).toBe('P1'); expect(current()).toBe(true);
            expect(operationId).toBe(x.store['projects/P1/workspace_continuity/current'].ensureOperation.operationId);
            await x.grant();
        },
        requestGoogleScopes: async () => undefined,
        selectProjectWorkspaceDestination: async () => {
            x.port.setDeliveryFence(async () => {});
            await x.service().approveDestination('P1', 'root', operationActor, x.port as any);
            return 'root';
        }
    };
    const box = document.createElement('div'); root = createRoot(box); const ready = vi.fn();
    await act(async () => root!.render(<WorkspaceEnsurePanel projectId="P1" service={service} t={key => key} onReady={ready}/>));
    await act(async () => { box.querySelector('button')!.click(); await vi.waitFor(() => expect(ready).toHaveBeenCalledOnce(), {timeout:5000}); });
    expect(box.textContent).toContain('gws.one.ready'); expect(ready).toHaveBeenCalledOnce();
    expect(x.resources).toHaveLength(2); expect(x.scripts.size).toBe(1); expect(x.workbook.book.sheets).toHaveLength(13);
    expect(box.querySelector('input')).toBeNull(); expect(box.querySelectorAll('button')).toHaveLength(1);
});
