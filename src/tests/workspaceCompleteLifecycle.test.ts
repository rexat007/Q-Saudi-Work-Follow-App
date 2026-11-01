import {describe,it,expect,vi} from 'vitest';
import {commandDatabase,accountProfile} from './helpers/commandDatabase';
import {blueprintFixture} from './helpers/workspaceBlueprintFixture';
import {setTestDbOverride} from '../firebase/admin';
import {ProjectGoogleWorkspaceServer,GoogleWorkspaceCommandError,workspaceOperation,type GoogleBlueprintPort} from '../services/projectGoogleWorkspace.server';
const who={userId:'actor',role:'SUPER_ADMIN' as const,email:'',displayName:'',assignedProjectIds:[]};
const path='projects/P1/workspace_continuity/current';
function setup(automation=false){
 const x=commandDatabase({'users/actor':accountProfile(),'projects/P1':{projectId:'P1',nameAr:'Project',status:'SETUP',settings:{}}});setTestDbOverride(x.db);
 const p={subject:vi.fn(async()=> 'subject'),authorizeBinding:vi.fn(async()=>{}),authorizeProvisioning:vi.fn(async()=>{if(!automation)throw new GoogleWorkspaceCommandError('SCOPE_DENIED:script.projects',403)}),validateDestination:vi.fn(async()=>{}),findResource:vi.fn(async()=>[]),createProjectFolder:vi.fn(async()=> 'folder'),createProjectSpreadsheet:vi.fn(async()=> 'file'),verifyBinding:vi.fn(async()=>({title:'Project Sheet'})),verifyWorkbook:vi.fn(async()=>{}),repairWorkbook:vi.fn(async()=>({repaired:true,conflicts:[] as string[]})),applyBlueprint:vi.fn(async()=>{}),createBoundScript:vi.fn(async()=> 'script'),installScript:vi.fn(async()=>{}),verifyAutomation:vi.fn(async()=>{}),projectMasterTabs:vi.fn(async()=>{}),upsert:vi.fn(async()=>{})};
 const service=new ProjectGoogleWorkspaceServer(x.db,undefined,()=>blueprintFixture());
 return {...x,p,service,approve:()=>service.approveDestination('P1','root',who,p as unknown as GoogleBlueprintPort),provision:()=>service.provision('P1','root',who,p as unknown as GoogleBlueprintPort)};
}
describe('complete Workspace lifecycle with independent health models',()=>{
 it('persists binding before repair, connects without Script and immediately projects Firestore data',async()=>{
  const x=setup();await x.approve();x.p.repairWorkbook.mockImplementationOnce(async()=>{expect(x.store[path].binding.spreadsheetId).toBe('file');expect(x.store[path].workspaceState).toBe('CONNECTED');return {repaired:true,conflicts:[]}});
  await x.provision();expect(await x.service.status('P1',who)).toMatchObject({workspaceState:'CONNECTED',workbookHealth:'HEALTHY',syncHealth:'HEALTHY',automationState:'DEGRADED',pendingSyncCount:0});
  expect(x.p.projectMasterTabs).toHaveBeenCalledOnce();expect(x.p.createBoundScript).not.toHaveBeenCalled();expect(x.store[path].binding.scriptProjectId).toBeUndefined();
 });
 it('never loses valid binding because repair fails, while master projection still runs',async()=>{
  const x=setup();await x.approve();x.p.repairWorkbook.mockRejectedValueOnce(Error('structure differs'));await x.provision();
  expect(await x.service.status('P1',who)).toMatchObject({binding:{spreadsheetId:'file'},workspaceState:'CONNECTED',workbookHealth:'DEGRADED',syncHealth:'HEALTHY'});expect(x.p.projectMasterTabs).toHaveBeenCalledOnce();
 });
 it('recovers Q-PRJ-007-shaped SCRIPT_REQUESTED evidence with zero new folder/Sheet creates',async()=>{
  const x=setup(true);await x.approve();x.store[path]={projectId:'P1',folderId:'folder',fileId:'file',destinationRootFolderId:'root',googleSubject:'subject',workspaceBlueprintVersion:'TEST-V1',operationId:workspaceOperation('P1'),stage:'SCRIPT_REQUESTED',state:'FAILED',leaseUntil:0};
  x.p.validateDestination.mockRejectedValueOnce(new GoogleWorkspaceCommandError('DESTINATION_NOT_WRITABLE',403));
  await x.service.resume('P1',who,x.p as unknown as GoogleBlueprintPort);
  expect(x.p.createProjectFolder).not.toHaveBeenCalled();expect(x.p.createProjectSpreadsheet).not.toHaveBeenCalled();expect(x.p.createBoundScript).not.toHaveBeenCalled();expect(x.p.projectMasterTabs).toHaveBeenCalledOnce();
  expect(x.p.validateDestination).toHaveBeenCalledOnce();expect(x.p.verifyBinding).toHaveBeenCalledWith('root','folder','file','TEST-V1');
  expect(await x.service.status('P1',who)).toMatchObject({workspaceState:'CONNECTED',automationState:'DEGRADED',workbookHealth:'HEALTHY'});expect(x.store[path].lastAutomationError).toBe('AUTOMATION_RECOVERY_REQUIRED');
 });
 it('installs and verifies approved automation only after binding with explicit Script authorization',async()=>{
  const x=setup(true);await x.approve();x.p.createBoundScript.mockImplementationOnce(async()=>{expect(x.store[path].binding.spreadsheetId).toBe('file');return 'script'});await x.provision();
  expect(x.p.installScript).toHaveBeenCalledWith('script',expect.objectContaining({version:'TEST-V1'}));expect(x.p.verifyAutomation).toHaveBeenCalledOnce();
  expect(await x.service.status('P1',who)).toMatchObject({automationState:'READY',workspaceState:'CONNECTED',syncHealth:'HEALTHY'});
 });
 it('never repeats uncertain Script create, and does not stop initial projection',async()=>{
  const x=setup(true);await x.approve();x.p.createBoundScript.mockRejectedValueOnce(Error('response lost'));await x.provision();await x.service.initializeBound('P1',who,x.p as unknown as GoogleBlueprintPort);
  expect(x.p.createBoundScript).toHaveBeenCalledOnce();expect(x.p.createProjectSpreadsheet).toHaveBeenCalledOnce();expect(x.p.projectMasterTabs).toHaveBeenCalled();expect(await x.service.status('P1',who)).toMatchObject({workspaceState:'CONNECTED',automationState:'DEGRADED'});
 });
 it('preserves binding, canonical records and pending work after provider failure',async()=>{
  const x=setup();await x.approve();x.p.projectMasterTabs.mockRejectedValueOnce(Error('503'));await x.provision();
  expect(await x.service.status('P1',who)).toMatchObject({workspaceState:'CONNECTED',syncHealth:'DEGRADED',pendingSyncCount:1});expect(x.store['projects/P1'].status).toBe('SETUP');expect(x.store['projects/P1/workspace_sync_outbox/MASTER_DATA'].status).toBe('PENDING');
 });
 it('rejects concurrent delivery and reclaims only an expired lease',async()=>{
  const x=setup();await x.approve();await x.provision();x.store[path].syncOwner='crashed';x.store[path].syncLeaseExpiresAt=Date.now()+60000;
  await expect(x.service.retrySync('P1',who,x.p as any)).rejects.toThrow('WORKSPACE_SYNC_IN_PROGRESS');expect(x.store[path].syncOwner).toBe('crashed');
  x.store[path].syncLeaseExpiresAt=Date.now()-1;await x.service.retrySync('P1',who,x.p as any);expect(x.store[path].syncOwner).toBeNull();
 });
 it('quarantines legacy permanent owners before assigning a recoverable expiry',async()=>{
  const x=setup();await x.approve();await x.provision();x.store[path].syncOwner='legacy';delete x.store[path].syncLeaseExpiresAt;
  await expect(x.service.retrySync('P1',who,x.p as any)).rejects.toThrow('WORKSPACE_SYNC_IN_PROGRESS');expect(x.store[path].syncLeaseExpiresAt).toBeGreaterThan(Date.now());expect(x.store[path].syncOwner).toBe('legacy');
 });
 it('cannot acknowledge an old delivery after canonical binding revision changes',async()=>{
  const x=setup();await x.approve();x.p.projectMasterTabs.mockImplementationOnce(async()=>{x.store[path].binding.revision++;});await x.provision();
  expect(x.store['projects/P1/workspace_sync_outbox/MASTER_DATA'].status).toBe('PENDING');expect(x.store['projects/P1/workspace_projection_state/current'].dirtyTabs).toHaveLength(4);
 });
});
