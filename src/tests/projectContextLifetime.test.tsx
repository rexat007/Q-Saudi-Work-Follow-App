// @vitest-environment happy-dom
import React, { act } from 'react';
import fs from 'fs';
import path from 'path';
import { canonicalBatch4Label } from './batch4I18nTestSupport';
import { dictionaries } from '../locales';
import { resolveTranslation } from '../i18n/utils';
import { createRoot } from 'react-dom/client';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PROJECT_SETUP_LAYERS, canEnterProjectSetupLayer, ProjectSetupLayer } from '../services/projectSetupWorkflow.service';
import { ProjectSetupWizard } from '../components/wizard/ProjectSetupWizard';
import { ProjectEntity, MaterialEntity, CarrierEntity, PricingRuleEntity } from '../types/entities';
import { AuthUserContext } from '../types/common';
import { projectService } from '../services/project.service';

// Mocks for i18n
vi.mock('../../i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    isRTL: false,
    locale: 'en',
    direction: 'ltr',
    setLocale: vi.fn(),
  })
}));

vi.mock('../i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    isRTL: false,
    locale: 'en',
    direction: 'ltr',
    setLocale: vi.fn(),
  })
}));

// Mocks for Firebase configuration to satisfy import references
vi.mock('../firebase/config', () => ({
  db: {},
  auth: {
    currentUser: {
      uid: 'USR-SA-WIZ',
      email: 'superadmin@qsaudi.com',
      displayName: 'Super Admin',
      role: 'SUPER_ADMIN' as const,
      assignedProjectIds: [],
      getIdToken: vi.fn().mockResolvedValue('mock-token'),
    }
  }
}));

vi.mock('../firebase/config', () => ({
  db: {},
  auth: {
    currentUser: {
      uid: 'USR-SA-WIZ',
      email: 'superadmin@qsaudi.com',
      displayName: 'Super Admin',
      role: 'SUPER_ADMIN' as const,
      assignedProjectIds: [],
      getIdToken: vi.fn().mockResolvedValue('mock-token'),
    }
  }
}));

// Mock repositories to prevent actual Firestore subscription calls
vi.mock('../repositories/project.repository', () => ({
  projectRepository: {
    subscribeToProjects: vi.fn(() => vi.fn()),
    listAll: vi.fn().mockResolvedValue([]),
    findById: vi.fn().mockResolvedValue(null),
    update: vi.fn().mockResolvedValue(undefined),
  }
}));

vi.mock('../repositories/material.repository', () => ({
  materialRepository: {}
}));

vi.mock('../repositories/carrier.repository', () => ({
  carrierRepository: {}
}));

vi.mock('../repositories/pricingRule.repository', () => ({
  pricingRuleRepository: {
    subscribeByProject: vi.fn(() => vi.fn()),
  }
}));

// Mock services to return mock project workspace/snapshots deterministically
vi.mock('../services/projectCanonicalRefresh.service', () => ({
  projectCanonicalRefreshService: {
    refresh: vi.fn().mockResolvedValue({
      materials: [],
      carriers: [],
      fleetRows: [],
      relationshipContext: {
        authorizedCarrierIds: [],
        authorizedMaterialIds: [],
        knownCarriers: [],
        knownMaterials: [],
        knownDrivers: [],
        knownTrucks: [],
      }
    }),
  }
}));

vi.mock('../services/workspace.service', () => ({
  clientWorkspaceService: {
    requestGoogleScopes: vi.fn().mockResolvedValue(undefined),
    provisionProjectDrive: vi.fn().mockResolvedValue({
      spreadsheetId: 'spread-123',
      projectFolderId: 'folder-123',
    }),
    syncInitialProjectWorkspace: vi.fn().mockResolvedValue(undefined),
  }
}));

const mockAuthContext: AuthUserContext = {
  userId: 'USR-SA-WIZ',
  email: 'superadmin@qsaudi.com',
  displayName: 'Super Admin',
  role: 'SUPER_ADMIN',
  assignedProjectIds: [],
};

const mockProject: ProjectEntity = {
  projectId: 'PRJ-RYD-101',
  projectCode: 'Q-PRJ-001',
  projectNumber: 1,
  nameAr: 'مشروع حفر الرياض',
  nameEn: 'Riyadh Excavation Project',
  clientName: 'أمانة منطقة الرياض',
  status: 'SETUP',
  startDate: '2026-10-01',
  location: {
    lat: 24.7136,
    lng: 46.6753,
    geoFenceRadiusMeters: 1000,
    addressAr: 'الرياض الملز',
  },
  settings: {
    currency: 'SAR',
    vatRatePercent: 15,
    zatcaTaxNumber: '310101010101013',
    googleDriveFolderId: 'folder-123',
    googleSpreadsheetId: 'spread-123',
    allowDriverSelfDispatch: false,
  },
  authorizedCarrierIds: [],
  authorizedMaterialIds: [],
  createdAt: new Date('2026-10-01T00:00:00.000Z'),
  createdBy: 'USR-SA-WIZ',
  updatedAt: new Date('2026-10-01T00:00:00.000Z'),
  updatedBy: 'USR-SA-WIZ',
};

import { ProjectContextLifetime } from '../utils/projectContextLifetime';
import { projectCanonicalRefreshService } from '../services/projectCanonicalRefresh.service';
import { clientWorkspaceService } from '../services/workspace.service';
import { importSessionClientService } from '../services/importSessionClient.service';
import { executeProjectWorkspaceSyncOrchestration } from '../components/wizard/ProjectSetupWizard';
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
function uiKey(key: string) { return key; }
function deferred<T = any>() { let resolve!: (value: T) => void, reject!: (error: unknown) => void; const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; }
const B = { ...mockProject, projectId: 'PROJECT-B', nameAr: 'مشروع باء', clientName: 'Client B' };
const snapshot = (name: string) => ({ materials: [{ materialId: name, nameAr: name, name: name, unitOfMeasure: 'TON', status: 'ACTIVE' }], carriers: [], fleetRows: [], relationshipContext: { authorizedCarrierIds: [], authorizedMaterialIds: [], knownCarriers: [], knownMaterials: [], knownDrivers: [], knownTrucks: [] } });
const ready = (projectId: string, value = false) => ({ ok: true, json: async () => ({ projectId, ready: value, blockers: [], candidatePath: null }) });
let container: HTMLDivElement, root: ReturnType<typeof createRoot>;
let selection = vi.fn<(projectId: string | null) => void>();
async function render(id: string | null, projects = [mockProject, B], context = mockAuthContext) {
  await act(async () => root.render(<ProjectSetupWizard projects={projects} authContext={context} selectedProjectId={id || undefined} onSelectProject={selection} />));
}
async function click(key: string) { const button = Array.from(container.querySelectorAll('button')).find(b => b.textContent?.includes(uiKey(key))) as HTMLButtonElement; expect(button, key).toBeDefined(); await act(async () => button.click()); return button; }
async function editName(value: string) {
  await click('projects.batch4.edit_data');
  const input = container.querySelector('input[value="' + (value.startsWith('B') ? B.nameAr : mockProject.nameAr) + '"]') as HTMLInputElement;
  expect(input).not.toBeNull();
  await act(async () => { Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!.call(input, value); input.dispatchEvent(new Event('change', { bubbles: true })); });
}
beforeEach(() => {
  container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); selection = vi.fn<(projectId: string | null) => void>();
  vi.mocked(projectCanonicalRefreshService.refresh).mockResolvedValue(snapshot('default') as any);
  vi.stubGlobal('fetch', vi.fn(async (url: string) => ready(url.includes('PROJECT-B') ? B.projectId : mockProject.projectId)));
  vi.stubGlobal('alert', vi.fn());
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.clearAllMocks(); });
describe('P4-B2 shared lifetime primitive', () => {
  it('invalidates A → empty → A and scope changes, even for the same project ID', () => {
    const life = new ProjectContextLifetime(); life.enter('A', 'user/scope'); const a = life.capture();
    life.enter(null, 'user/scope'); expect(life.isCurrent(a)).toBe(false); life.enter('A', 'user/scope'); expect(life.isCurrent(a)).toBe(false);
    const renewed = life.capture(); expect(life.isCurrent(renewed, 'B')).toBe(false); life.enter('A', 'changed scope'); expect(life.isCurrent(renewed)).toBe(false);
    const current = life.capture(); life.dispose(); expect(life.isCurrent(current)).toBe(false);
  });
});
describe('P4-B2 rendered Wizard races', () => {
  it('loads B before late A and never exposes the old A dataset', async () => {
    const a = deferred(), b = deferred(); vi.mocked(projectCanonicalRefreshService.refresh).mockImplementation(id => id === mockProject.projectId ? a.promise : b.promise);
    await render(mockProject.projectId); await render(B.projectId);
    await act(async () => b.resolve(snapshot('MATERIAL-B'))); await act(async () => a.resolve(snapshot('MATERIAL-A')));
    await click('projects.batch4.layer_materials');
    expect(container.textContent).toContain('MATERIAL-B'); expect(container.textContent).not.toContain('MATERIAL-A');
  });
  it('discards an A error after selection is emptied', async () => {
    const a = deferred(); vi.mocked(projectCanonicalRefreshService.refresh).mockReturnValue(a.promise);
    await render(mockProject.projectId); await render(null, []);
    await act(async () => a.reject(new Error('STALE-A-ERROR')));
    expect(container.textContent).not.toContain('STALE-A-ERROR'); expect(container.querySelector('input[value="' + mockProject.clientName + '"]')).toBeNull(); expect(selection).not.toHaveBeenCalledWith(mockProject.projectId);
  });
  it('discards successful A load after deselection and cannot authorize a later B layer', async () => {
    const a = deferred(); vi.mocked(projectCanonicalRefreshService.refresh).mockReturnValueOnce(a.promise);
    await render(mockProject.projectId); await render(null, []); await act(async () => a.resolve(snapshot('MATERIAL-A')));
    await render(B.projectId, [B]); await click('projects.batch4.layer_materials'); expect(container.textContent).not.toContain('MATERIAL-A');
  });
  it('keeps B save busy/draft when A save and fallback refresh finish late', async () => {
    const a = deferred<void>(), b = deferred<void>(); vi.spyOn(projectService, 'updateProject').mockImplementation(id => id === mockProject.projectId ? a.promise : b.promise); const refresh = vi.spyOn(projectService, 'getProject').mockResolvedValue(null);
    await render(mockProject.projectId); await editName('A modified'); await click('shared.actions.save');
    await render(B.projectId); await editName('B modified'); await click('shared.actions.save');
    await act(async () => a.resolve());
    expect(refresh).not.toHaveBeenCalledWith(mockProject.projectId); expect(container.textContent).not.toContain('projects.messages.changes_saved');
    expect(container.querySelector('input[value="B modified"]')).not.toBeNull();
    const save = Array.from(container.querySelectorAll('button')).find(b => b.textContent?.includes(uiKey('shared.actions.save'))) as HTMLButtonElement; expect(save.disabled).toBe(true);
    await act(async () => b.resolve()); expect(container.textContent).toContain('projects.messages.changes_saved');
  });
  it('does not let an abandoned creation hijack selection or recreate its bridge', async () => {
    const creation = deferred(); vi.spyOn(projectService, 'createProject').mockReturnValue(creation.promise);
    await render(null, []); await click('navigation.labels.provision_new_project');
    const form = container.querySelector('form')!; expect(form).not.toBeNull(); await act(async () => form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
    await render(B.projectId, [B]); await act(async () => creation.resolve({ ...mockProject, projectId: 'CREATED-A' }));
    expect(selection).not.toHaveBeenCalledWith('CREATED-A'); expect(container.querySelector('input[value="Client B"]')).not.toBeNull();
  });
  it('keeps B readiness loading/result when A readiness settles late', async () => {
    const a = deferred(), b = deferred(); vi.stubGlobal('fetch', vi.fn((url: string) => url.includes(B.projectId) ? b.promise : a.promise));
    await render(mockProject.projectId); await render(B.projectId); await act(async () => a.resolve(ready(mockProject.projectId, true)));
    await click('projects.batch4.layer_activation'); expect(container.textContent).toContain('projects.batch4.readiness_checking'); expect(container.textContent).not.toContain('projects.batch4.readiness_satisfied');
    await act(async () => b.resolve(ready(B.projectId, false)));
    expect(container.textContent).not.toContain(mockProject.projectId + '-READY');
    // Loading must finish for B rather than being invalidated by the canonical-load effect order.
    expect(container.textContent).not.toContain(uiKey('projects.batch4.readiness_checking'));
  });
  it.each([['SETUP', '/lifecycle-transition', 'projects.batch4.submit_review'], ['APPROVED', '/activate', 'projects.batch4.activate_operations']])('ignores %s command completion and its alert after switching to B', async (status, endpoint, action) => {
    const transition = deferred(); vi.stubGlobal('fetch', vi.fn((url: string) => url.endsWith(endpoint) ? transition.promise : Promise.resolve(ready(url.includes(B.projectId) ? B.projectId : mockProject.projectId, true))));
    await render(mockProject.projectId, [{ ...mockProject, status: status as any }, B]); await click('projects.batch4.layer_activation'); await click(action);
    await render(B.projectId); await act(async () => transition.resolve({ ok: true, json: async () => ({ success: true }) })); expect(alert).not.toHaveBeenCalled(); expect(container.querySelector('input[value="Client B"]')).not.toBeNull();
  });
  it('ignores a late Foundation refresh fallback and preserves the new B draft', async () => {
    const refresh = deferred(); vi.spyOn(projectService, 'updateProject').mockResolvedValue(); vi.spyOn(projectService, 'getProject').mockReturnValue(refresh.promise);
    await render(mockProject.projectId); await editName('A modified'); await click('shared.actions.save');
    await render(B.projectId); await editName('B modified'); await act(async () => refresh.resolve(null));
    expect(container.querySelector('input[value="B modified"]')).not.toBeNull(); expect(container.textContent).not.toContain('projects.messages.changes_saved');
  });
  it('retires the current creation bridge on canonical arrival and cannot retain it after removal', async () => {
    const created = { ...mockProject, projectId: 'CREATED', nameAr: 'Created bridge' };
    vi.spyOn(projectService, 'createProject').mockResolvedValue(created);
    await render(null, []); await click('navigation.labels.provision_new_project');
    await act(async () => container.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
    expect(selection).toHaveBeenCalledWith('CREATED'); expect(container.querySelector('input[value="Created bridge"]')).not.toBeNull();
    await render('CREATED', [{ ...created, nameAr: 'Canonical name' }]);
    expect(container.querySelector('input[value="Canonical name"]')).not.toBeNull();
    await render('CREATED', []); expect(selection).toHaveBeenLastCalledWith(null); expect(container.querySelector('input[value="Created bridge"]')).toBeNull();
  });
  it('retains the operationId when the same creation payload is retried', async () => {
    const create = vi.spyOn(projectService, 'createProject').mockRejectedValueOnce(new Error('Network lost')).mockResolvedValue({ ...mockProject, projectId: 'CREATED' });
    await render(null, []); await click('navigation.labels.provision_new_project');
    const submit = async () => { await act(async () => container.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))); };
    await submit(); await submit(); expect(create).toHaveBeenCalledTimes(2);
    expect(create.mock.calls[0][0].operationId).toBe(create.mock.calls[1][0].operationId); expect(selection).toHaveBeenCalledWith('CREATED');
  });
  it('does not leak a pending import-session restoration failure from A into B', async () => {
    const pending = deferred();
    vi.spyOn(importSessionClientService, 'listResumableSessions').mockReturnValueOnce(pending.promise).mockResolvedValue([]);
    const withCarrier = { ...snapshot('material'), carriers: [{ carrierId: 'carrier', name: 'Carrier', nameAr: 'Carrier', status: 'ACTIVE' }] };
    vi.mocked(projectCanonicalRefreshService.refresh).mockResolvedValue(withCarrier as any);
    await render(mockProject.projectId); await click('projects.batch4.layer_roster');
    expect(importSessionClientService.listResumableSessions).toHaveBeenCalledWith(mockProject.projectId);
    await render(B.projectId); await click('projects.batch4.layer_roster');
    await act(async () => pending.reject(new Error('STALE-IMPORT-A')));
    expect(importSessionClientService.listResumableSessions).toHaveBeenCalledWith(B.projectId);
    expect(container.textContent).not.toContain('STALE-IMPORT-A'); expect(container.textContent).not.toContain('مشروع حفر الرياض');
  });
  it('removes scope and never restores A from a late load', async () => {
    const a = deferred(); vi.mocked(projectCanonicalRefreshService.refresh).mockReturnValueOnce(a.promise);
    const scoped = { ...mockAuthContext, role: 'PROJECT_ADMIN', assignedProjectIds: [mockProject.projectId, B.projectId] } as AuthUserContext;
    await render(mockProject.projectId, [mockProject, B], scoped);
    await render(mockProject.projectId, [B], { ...scoped, assignedProjectIds: [B.projectId] });
    await act(async () => a.resolve(snapshot('MATERIAL-A'))); expect(selection).toHaveBeenCalledWith(B.projectId); expect(container.querySelector('input[value="Client B"]')).not.toBeNull();
  });
});
describe('P4-B2 Workspace completion ownership', () => {
  it.each(['resolve', 'reject'] as const)('discards stale Workspace %s notice/finally without clearing B busy state', async outcome => {
    const life = new ProjectContextLifetime(); life.enter('A', 'owner'); const captured = life.capture(); const done = deferred(); let busy = false; let notice: any = null;
    const running = executeProjectWorkspaceSyncOrchestration({ project: mockProject, isSyncingGoogle: false, setIsSyncingGoogle: value => { busy = value; }, setSyncNotice: value => { notice = value; }, isCurrent: () => life.isCurrent(captured, 'A'), workspaceService: { requestGoogleScopes: async () => {}, syncInitialProjectWorkspace: () => done.promise } as any });
    await Promise.resolve(); life.enter('B', 'owner'); busy = true; notice = { text: 'B pending' };
    if (outcome === 'resolve') done.resolve({}); else done.reject(new Error('A failure')); await running;
    expect(busy).toBe(true); expect(notice).toEqual({ text: 'B pending' });
  });
});
