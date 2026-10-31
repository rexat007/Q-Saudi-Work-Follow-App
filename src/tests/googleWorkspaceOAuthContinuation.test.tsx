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
    getGoogleWorkspaceStatus: vi.fn(),
    selectProjectWorkspaceDestination: vi.fn().mockResolvedValue('destination-root'),
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
const ready = (projectId: string, value = false) => ({ ok: true, json: async () => ({ projectId, ready: value, lifecycle: { ready: value, blockers: [] }, setup: { evaluated: true, ready: value, ownerPhase: 'PHASE_6', blockers: [] }, operational: { ready: value, blockers: [] }, blockers: [], candidatePath: null }) });
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


const status=(id:string,bound=false)=>({state:bound?'READY':'NOT_CONNECTED',binding:bound?{projectId:id,spreadsheetId:'new-sheet',spreadsheetUrl:'https://docs.google.com/spreadsheets/d/new-sheet/edit',googleAccountLabel:'SAME-ACCOUNT'}:null,pendingSyncCount:0,lastSuccessfulSyncAt:null,lastSyncError:null});
const unbound={...mockProject,settings:{...mockProject.settings,googleDriveFolderId:undefined,googleSpreadsheetId:undefined}};
beforeEach(()=>{vi.mocked(clientWorkspaceService.getGoogleWorkspaceStatus).mockImplementation(async id=>status(id) as any);vi.mocked(clientWorkspaceService.selectProjectWorkspaceDestination).mockResolvedValue('destination-root');vi.mocked(clientWorkspaceService.requestGoogleScopes).mockResolvedValue('fixture');});
describe('GWS-LIVE-01A actual Wizard context and continuation',()=>{
 it('keeps Project/WORKSPACE through Google success and a same-identity profile snapshot refresh',async()=>{
   const oauth=deferred<string>();vi.mocked(clientWorkspaceService.requestGoogleScopes).mockReturnValueOnce(oauth.promise);
   let bound=false;vi.mocked(clientWorkspaceService.getGoogleWorkspaceStatus).mockImplementation(async id=>status(id,bound) as any);
   vi.mocked(clientWorkspaceService.provisionProjectDrive).mockImplementationOnce(async()=>{bound=true;return {spreadsheetId:'new-sheet',projectFolderId:'new-folder'} as any});
   await render(unbound.projectId,[unbound]);await click('projects.batch4.layer_workspace');
   await click('projects.labels.initialize_workspace_sync');
   // A new profile object with the same UID/role/scope is not a new Project session.
   await render(unbound.projectId,[unbound],{...mockAuthContext,assignedProjectIds:[...mockAuthContext.assignedProjectIds!]});
   await act(async()=>oauth.resolve('fixture'));
   expect(clientWorkspaceService.selectProjectWorkspaceDestination).toHaveBeenCalledWith(unbound.projectId);
   expect(clientWorkspaceService.provisionProjectDrive).toHaveBeenCalledOnce();
   expect(container.textContent).toContain('gws.ready');expect(container.textContent).toContain('SAME-ACCOUNT');
   expect(container.querySelector('a')?.href).toContain('new-sheet');
 });
 it('fences late A authorization before Picker/provision when selection genuinely changes to B',async()=>{
   const oauth=deferred<string>();vi.mocked(clientWorkspaceService.requestGoogleScopes).mockReturnValueOnce(oauth.promise);
   await render(unbound.projectId,[unbound,B]);await click('projects.batch4.layer_workspace');await click('projects.labels.initialize_workspace_sync');await render(B.projectId,[unbound,B]);await act(async()=>oauth.resolve('fixture'));
   expect(clientWorkspaceService.selectProjectWorkspaceDestination).not.toHaveBeenCalled();expect(clientWorkspaceService.provisionProjectDrive).not.toHaveBeenCalled();expect(container.textContent).not.toContain('projects.batch4.workspace_sync_status');
 });
 it.each(['GOOGLE_PICKER_CONFIGURATION_REQUIRED','WORKSPACE_BLUEPRINT_INVALID','DESTINATION_FOLDER_INVALID','NETWORK_ERROR'])('retains exact %s on the same Workspace layer',async code=>{
   vi.mocked(clientWorkspaceService.selectProjectWorkspaceDestination).mockRejectedValueOnce(new Error(code));
   await render(unbound.projectId,[unbound]);await click('projects.batch4.layer_workspace');await click('projects.labels.initialize_workspace_sync');
   expect(container.textContent).toContain('gws.purpose');expect(container.textContent).toContain(code);expect(clientWorkspaceService.provisionProjectDrive).not.toHaveBeenCalled();
 });
 it('durable READY binding overrides a Project prop with absent compatibility IDs',async()=>{
   vi.mocked(clientWorkspaceService.getGoogleWorkspaceStatus).mockResolvedValue(status(unbound.projectId,true) as any);
   await render(unbound.projectId,[unbound]);await click('projects.batch4.layer_workspace');expect(container.textContent).toContain('gws.ready');await click('projects.labels.update_workspace_sync');
   expect(clientWorkspaceService.provisionProjectDrive).not.toHaveBeenCalled();expect(clientWorkspaceService.selectProjectWorkspaceDestination).not.toHaveBeenCalled();expect(clientWorkspaceService.syncInitialProjectWorkspace).toHaveBeenCalledWith(unbound.projectId,'new-sheet');
 });
 it('does not treat a failed status read as absence and create a workbook',async()=>{
   vi.mocked(clientWorkspaceService.getGoogleWorkspaceStatus).mockRejectedValue(new Error('NETWORK_ERROR'));
   await render(unbound.projectId,[unbound]);await click('projects.batch4.layer_workspace');await click('projects.labels.initialize_workspace_sync');expect(clientWorkspaceService.provisionProjectDrive).not.toHaveBeenCalled();expect(clientWorkspaceService.selectProjectWorkspaceDestination).not.toHaveBeenCalled();expect(container.textContent).toContain('NETWORK_ERROR');
 });
});
