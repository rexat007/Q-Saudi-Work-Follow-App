import {workspaceProjectionProvider,cellBatch} from './workspaceProjectionProvider';
import {projectionRequest} from '../../../server/workspaceProjectionDelivery';
import { beforeAll, vi } from 'vitest';
// Compile the real lazy server dependency in suite bootstrap, preserving module initialization order.
beforeAll(async () => { await import('../../services/projectWorkspaceInitialProjection.server'); });
import type { OperationalConfiguration } from '../../types/operationalProfile';
import { operationGraph, operationConfig, operationActor } from './operationalProfileFixture';
import { setTestDbOverride } from '../../firebase/admin';
import { ProjectGoogleWorkspaceServer, GoogleWorkspaceCommandError } from '../../services/projectGoogleWorkspace.server';
import { WorkspaceProvisioningOrchestrator } from '../../services/workspaceProvisioning.server';
import { WorkspaceGoogleOfflineAuthorization } from '../../services/workspaceGoogleOfflineAuthorization.server';
import { REQUIRED_WORKSPACE_SCOPES } from '../../utils/googleWorkspaceScopes';
import { workbookInspectionFixture } from './workbookInspectionFixture';
import { planWorkbookRepair } from '../../services/googleWorkspaceBlueprint/repair';
import { verifyBlueprintWorkbook, type WorkspaceBlueprint } from '../../services/googleWorkspaceBlueprint/contract';
export const ensurePath = 'projects/P1/workspace_continuity/current';
export function workspaceEnsureFixture(configuration: OperationalConfiguration = operationConfig()) {
    const x = operationGraph(configuration, true);
    x.store['projects/P1'].status = 'SETUP';
    setTestDbOverride(x.db);
    const resources: Array<{
        id: string;
        parentId: string;
        role: string;
    }> = [], scripts = new Map<string, {
        parentId: string;
        blueprint?: WorkspaceBlueprint;
    }>();
    const workbook = workbookInspectionFixture({ properties: { locale: 'en_US', timeZone: 'Asia/Riyadh' }, sheets: [] }), provider = { authorizationUrl: vi.fn((o: any) => `https://accounts.google.com?state=${o.state}`), exchange: vi.fn(async () => ({ refreshToken: 'fixture-refresh', subject: 'subject', scopes: [...REQUIRED_WORKSPACE_SCOPES] })), refresh: vi.fn(async () => ({ accessToken: 'fixture-access', subject: 'subject', scopes: [...REQUIRED_WORKSPACE_SCOPES] })), revoke: vi.fn(async () => { }) };
    const managedFolders=new Map<string,{role:string;key:string;parentId:string|null}>();
    const transport=workspaceProjectionProvider();
    let fence = async () => { };
    const project=async(file:string,value:unknown)=>{await fence();await projectionRequest(cellBatch(file,JSON.stringify(value)),transport.send);};
    const port = {
      findManagedFolders:vi.fn(async(key:string,role:string)=>{await fence();return [...managedFolders].filter(([,v])=>v.key===key&&v.role===role).map(([id])=>({id}));}),
      createManagedFolder:vi.fn(async(_name:string,parentId:string|null,key:string,role:string)=>{await fence();const id=role==='WORKSPACE_ROOT'?'app-root':'root';managedFolders.set(id,{role,key,parentId});return id;}),
      verifyManagedFolder:vi.fn(async(id:string,key:string,role:string,parentId:string|null)=>{await fence();const f=managedFolders.get(id);if(!f||f.key!==key||f.role!==role||f.parentId!==parentId)throw new GoogleWorkspaceCommandError('WORKSPACE_ROOT_IDENTITY_CONFLICT');}),
      setDeliveryFence: (check: () => Promise<void>) => { fence = check; }, subject: vi.fn(async () => 'subject'), authorizeBinding: vi.fn(async () => { }), authorizeProvisioning: vi.fn(async () => { }), validateDestination: vi.fn(async () => { }), findResource: vi.fn(async (_op: string, role: string) => resources.filter(r => r.role === role)), createProjectFolder: vi.fn(async (_name: string, parentId: string) => { await fence(); resources.push({ id: 'folder', parentId, role: 'FOLDER' }); return 'folder'; }), createProjectSpreadsheet: vi.fn(async (_name: string, parentId: string) => { await fence(); resources.push({ id: 'sheet', parentId, role: 'SPREADSHEET' }); return 'sheet'; }), verifyBinding: vi.fn(async () => { await fence(); return { title: 'Canonical Project' }; }), verifyWorkbook: vi.fn(async (_id: string, b: WorkspaceBlueprint) => { await fence(); verifyBlueprintWorkbook(b, workbook.book); }), repairWorkbook: vi.fn(async (_id: string, b: WorkspaceBlueprint) => { await fence(); const plan = planWorkbookRepair(b, workbook.book); await workbook.update({ requestBody: { requests: plan.requests } }); return { repaired: plan.requests.length > 0, conflicts: plan.conflicts }; }), createBoundScript: vi.fn(async (parentId: string) => { await fence(); scripts.set('script', { parentId }); return 'script'; }), installScript: vi.fn(async (id: string, b: WorkspaceBlueprint) => { await fence(); scripts.get(id)!.blueprint = structuredClone(b); }), verifyAutomation: vi.fn(async (parentId: string, id: string, b: WorkspaceBlueprint) => { await fence(); const script = scripts.get(id); if (script?.parentId !== parentId)
            throw new GoogleWorkspaceCommandError('SCRIPT_PARENT_PROOF_REQUIRED'); if (JSON.stringify(script.blueprint?.script) !== JSON.stringify(b.script))
            throw new GoogleWorkspaceCommandError('SCRIPT_CONTENT_INSTALL_FAILED'); }), verifyScriptParent: vi.fn(async (parentId: string, id: string) => { if (scripts.get(id)?.parentId !== parentId)
            throw new GoogleWorkspaceCommandError('SCRIPT_PARENT_PROOF_REQUIRED'); }), projectMasterTabs: vi.fn(project), projectProfileReports: vi.fn(project) };
    const authorization = new WorkspaceGoogleOfflineAuthorization(() => provider, x.db, () => ({ clientId: 'fixture', clientSecret: 'fixture-secret', redirectUri: 'https://fixture.example/workspace/google/callback', key: Buffer.alloc(32, 1), keyVersion: 'v1' }), async () => 'subject');
    const service = () => new ProjectGoogleWorkspaceServer(x.db), engine = () => new WorkspaceProvisioningOrchestrator(x.db, service(), authorization, () => ({ ...port }) as any);
    const grant = async () => { const begin = await authorization.begin('P1', operationActor, true, x.store[ensurePath].ensureOperation.operationId); await authorization.callback(new URL(begin.url).searchParams.get('state')!, 'fixture-code', begin.browser); };
    const prepare = async () => { await engine().ensure('P1', operationActor); await grant(); };
    // Production constructs a fresh adapter per request; an ensure lease must not leak into a later report command.
    const manualPort=()=>({...port,verifyBinding:vi.fn(async(root:string,folder:string,file:string)=>{if(!resources.some(r=>r.id===folder&&r.parentId===root&&r.role==='FOLDER')||!resources.some(r=>r.id===file&&r.parentId===folder&&r.role==='SPREADSHEET'))throw new GoogleWorkspaceCommandError('WORKSPACE_EXTERNAL_BINDING_INVALID');return {title:'Canonical Project'};}),projectProfileReports:vi.fn(async(file:string,report:unknown)=>{await projectionRequest(cellBatch(file,JSON.stringify(report)),transport.send);})});
    return { ...x, manualPort, transport, managedFolders, resources, scripts, port, provider, workbook, authorization, service, engine, grant, prepare, run: () => engine().ensure('P1', operationActor) };
}
