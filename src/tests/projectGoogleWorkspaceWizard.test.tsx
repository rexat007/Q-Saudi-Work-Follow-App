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

const status=(id:string)=>({state:'READY',binding:{projectId:id,spreadsheetId:'sheet-'+id,spreadsheetUrl:'https://docs.google.com/spreadsheets/d/sheet-'+id+'/edit',googleAccountLabel:'fixture-account'},pendingSyncCount:2,lastSuccessfulSyncAt:'2026-10-31T00:00:00Z',lastSyncError:null});
beforeEach(()=>{vi.mocked(clientWorkspaceService.getGoogleWorkspaceStatus).mockImplementation(async id=>status(id) as any)});
describe('PFAG-GWS1 actual Project Setup Wizard — controlled DOM',()=>{
 it('renders continuity purpose, account, sync status and one workbook-open action',async()=>{
   await render(mockProject.projectId);await click('projects.batch4.layer_workspace');
   expect(container.textContent).toContain('gws.purpose');expect(container.textContent).toContain('fixture-account');expect(container.textContent).toContain('gws.pending: 2');
   const links=[...container.querySelectorAll('a')].filter(a=>a.textContent==='gws.open');expect(links).toHaveLength(1);expect(links[0].href).toContain('sheet-'+mockProject.projectId);
 });
 it('surfaces actionable popup guidance without asserting an unseen Google error',async()=>{
   vi.mocked(clientWorkspaceService.requestGoogleScopes).mockRejectedValueOnce(new Error('POPUP_CLOSED'));
   await render(mockProject.projectId);await click('projects.batch4.layer_workspace');await click('projects.labels.update_workspace_sync');
   expect(container.textContent).toContain('gws.popup_closed');expect(clientWorkspaceService.provisionProjectDrive).not.toHaveBeenCalled();
 });
 it('late A continuity status never overwrites current B',async()=>{
   const a=deferred<any>();vi.mocked(clientWorkspaceService.getGoogleWorkspaceStatus).mockImplementation(id=>id===mockProject.projectId?a.promise:Promise.resolve({...status(id),binding:{...status(id).binding,googleAccountLabel:'ACCOUNT-B'}} as any));
   await render(mockProject.projectId);await render(B.projectId);await click('projects.batch4.layer_workspace');await act(async()=>a.resolve({...status(mockProject.projectId),binding:{...status(mockProject.projectId).binding,googleAccountLabel:'ACCOUNT-A'}}));expect(container.textContent).toContain('ACCOUNT-B');expect(container.textContent).not.toContain('ACCOUNT-A');
 });
});
