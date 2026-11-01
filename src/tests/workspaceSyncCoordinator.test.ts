import {describe,it,expect,vi} from 'vitest';
import {commandDatabase,accountProfile} from './helpers/commandDatabase';
import {WorkspaceSyncCoordinator} from '../../server/workspaceSyncCoordinator';
import {ProjectGoogleWorkspaceServer,GoogleWorkspaceCommandError} from '../services/projectGoogleWorkspace.server';
import {setTestDbOverride} from '../firebase/admin';
import {markDirtyInTransaction,getState} from '../services/projectWorkspaceProjectionState.server';
const who={userId:'actor',role:'SUPER_ADMIN' as const,email:'',displayName:'',assignedProjectIds:[]};
const cp=(id:string)=>`projects/${id}/workspace_continuity/current`;
function setup(count=2){
 const records:Record<string,any>={'users/actor':accountProfile()};
 for(let i=1;i<=count;i++){const p=`P${i}`;records[`projects/${p}`]={projectId:p,status:'SETUP',nameAr:'Project',settings:{}};records[cp(p)]={projectId:p,state:'READY',backgroundAuthorization:'CONNECTED',backgroundAuthorizationId:'G'+p,workbookHealth:'HEALTHY',automationState:'READY',binding:{projectId:p,spreadsheetId:'sheet-'+p,googleSubject:'subject',revision:1,workspaceBlueprintVersion:'SABIL-HAIL-V1'}};records['workspace_google_authorizations/G'+p]={authorizationId:'G'+p,projectId:p,actorId:'actor',subject:'subject',spreadsheetId:'sheet-'+p,bindingRevision:1,status:'ACTIVE'};}
 const x=commandDatabase(records);setTestDbOverride(x.db);
 const access=vi.fn(async(projectId:string)=>({accessToken:'private-access',authorizationId:'G'+projectId,automation:true}));
 const ports:Record<string,any>={};const factory=vi.fn((_token:string,id:string)=>ports[id]||=( {subject:vi.fn(async()=> 'subject'),verifyBinding:vi.fn(async()=>({})),projectMasterTabs:vi.fn(async()=>{}),upsert:vi.fn(async()=>{})}));
 const coordinator=new WorkspaceSyncCoordinator({access} as any,x.db,factory);
 const dirty=(id:string)=>x.db.runTransaction((tx:any)=>markDirtyInTransaction(tx,id,['CARRIERS'],'TEST',undefined,x.db));
 return {...x,access,ports,factory,coordinator,dirty};
}
describe('server-owned global eligibility and failure isolation',()=>{
 it('ten accessible Projects cause exactly two provider executions with actual pending work',async()=>{
  const x=setup(10);await x.dirty('P1');await x.dirty('P2');for(const id of ['P6','P7']){x.store['workspace_google_authorizations/G'+id].status='AUTHORIZATION_REQUIRED';x.store[cp(id)].backgroundAuthorization='AUTHORIZATION_REQUIRED';}for(const id of ['P8','P9','P10'])delete x.store[cp(id)].binding;
  expect(await x.coordinator.runForActor(who)).toEqual({examined:10,eligible:2,attempted:2,delivered:2,skipped:8,deferred:0});expect(x.access.mock.calls.map(c=>c[0]).sort()).toEqual(['P1','P2']);expect(x.factory).toHaveBeenCalledTimes(2);
 });
 it.each(['no binding','no work','authorization','missing file','operator review','automation recovery','migration','Script upgrade'])('skips %s before refresh or provider access',async kind=>{
  const x=setup(1);if(kind!=='no work')await x.dirty('P1');const s=x.store[cp('P1')];
  if(kind==='no binding')delete s.binding;if(kind==='authorization')s.backgroundAuthorization='AUTHORIZATION_REQUIRED';if(kind==='missing file')s.state='BOUND_FILE_UNAVAILABLE';if(kind==='operator review')s.lastWorkbookError='WORKBOOK_OPERATOR_REVIEW_REQUIRED';if(kind==='automation recovery')s.lastAutomationError='AUTOMATION_RECOVERY_REQUIRED';if(kind==='migration')s.lastSyncError='WORKSPACE_TEMPLATE_MIGRATION_REQUIRED';if(kind==='Script upgrade'){s.scriptProjectId='known-script';s.binding.appsScriptBlueprintVersion='OLD';}
  const result=await x.coordinator.runForActor(who);expect(result).toMatchObject({attempted:0,skipped:1});expect(x.access).not.toHaveBeenCalled();expect(x.factory).not.toHaveBeenCalled();
 });
 it('another user grant is not discovered even for SUPER_ADMIN',async()=>{
  const x=setup();await x.dirty('P1');await x.dirty('P2');x.store['workspace_google_authorizations/GP1'].actorId='other';const r=await x.coordinator.runForActor(who);expect(r.examined).toBe(1);expect(x.access.mock.calls.map(c=>c[0])).toEqual(['P2']);
 });
 it('canonical Project authorization outranks stale caller roles or historical grants',async()=>{
  const x=setup();await x.dirty('P1');await x.dirty('P2');x.store['users/actor']={...accountProfile('PROJECT_ADMIN'),assignedProjectIds:['P2']};expect(await x.coordinator.runForActor(who)).toMatchObject({skipped:1,delivered:1});expect(x.access.mock.calls.map(c=>c[0])).toEqual(['P2']);
 });
 it.each(['projectId','subject','spreadsheetId','bindingRevision','pointer'])('revalidates canonical %s before acquiring Google credentials',async field=>{
  const x=setup(1);await x.dirty('P1');if(field==='pointer')x.store[cp('P1')].backgroundAuthorizationId='replacement';else x.store['workspace_google_authorizations/GP1'][field]=field==='bindingRevision'?99:'foreign';await x.coordinator.runForActor(who);expect(x.access).not.toHaveBeenCalled();
 });
 it('one Google 503 preserves pending work, releases its lease and continues the next Project',async()=>{
  const x=setup();await x.dirty('P1');await x.dirty('P2');x.factory('', 'P1').verifyBinding.mockRejectedValueOnce(new GoogleWorkspaceCommandError('GOOGLE_SERVICE_UNAVAILABLE',503));x.factory.mockClear();
  expect(await x.coordinator.runForActor(who)).toMatchObject({attempted:2,delivered:1,deferred:1});expect(x.store[cp('P1')]).toMatchObject({syncOwner:null,lastSyncError:'GOOGLE_SERVICE_UNAVAILABLE',binding:{spreadsheetId:'sheet-P1'}});expect(x.store['projects/P1/workspace_sync_outbox/MASTER_DATA'].status).toBe('PENDING');expect(x.store['projects/P2/workspace_sync_outbox/MASTER_DATA'].status).toBe('DELIVERED');
 });
 it('one credential rejection stays Project-scoped and cannot stop an eligible second Project',async()=>{
  const x=setup();await x.dirty('P1');await x.dirty('P2');x.access.mockRejectedValueOnce(new GoogleWorkspaceCommandError('AUTHORIZATION_REQUIRED',401));const result=await x.coordinator.runForActor(who);expect(result).toMatchObject({delivered:1,deferred:1});expect(x.store['projects/P1/workspace_sync_outbox/MASTER_DATA'].status).toBe('PENDING');
 });
 it('existing live leases defer without provider mutation or forced release',async()=>{
  const x=setup(1);await x.dirty('P1');x.store[cp('P1')].syncOwner='other';x.store[cp('P1')].syncLeaseExpiresAt=Date.now()+120000;expect(await x.coordinator.runForActor(who)).toMatchObject({skipped:1,attempted:0});expect(x.access).not.toHaveBeenCalled();expect(x.factory).not.toHaveBeenCalled();expect(x.store[cp('P1')].syncOwner).toBe('other');
 });
 it('an existing dirty marker reestablishes only its metadata outbox without a fabricated mutation revision',async()=>{
  const x=setup(1);await x.dirty('P1');const revision=(await getState('P1',x.db)).mutationRevision;delete x.store['projects/P1/workspace_sync_outbox/MASTER_DATA'];expect(await x.coordinator.runForActor(who)).toMatchObject({delivered:1});expect(x.store['projects/P1/workspace_sync_outbox/MASTER_DATA']).toMatchObject({status:'DELIVERED',revision});expect((await getState('P1',x.db)).mutationRevision).toBe(revision);
 });
 it('work disappearing after eligibility cannot trigger provider mutations',async()=>{
  const x=setup(1);await x.dirty('P1');x.access.mockImplementationOnce(async()=>{delete x.store['projects/P1/workspace_sync_outbox/MASTER_DATA'];delete x.store['projects/P1/workspace_projection_state/current'];return {accessToken:'private-access',authorizationId:'GP1',automation:true};});expect(await x.coordinator.runForActor(who)).toMatchObject({skipped:1,delivered:0});expect(x.ports.P1.verifyBinding).not.toHaveBeenCalled();
 });
 it('pending-only execution cannot automatically repair after maintenance state changes during refresh',async()=>{
  const x=setup(1);await x.dirty('P1');x.access.mockImplementationOnce(async()=>{x.store[cp('P1')].workbookHealth='REPAIR_REQUIRED';return {accessToken:'private-access',authorizationId:'GP1',automation:true};});await x.coordinator.runForActor(who);expect(x.ports.P1.verifyBinding).not.toHaveBeenCalled();expect(x.store['projects/P1/workspace_sync_outbox/MASTER_DATA'].status).toBe('PENDING');
 });
 it('bounded pages advance over no-work grants and reach later pending work without a Project scan',async()=>{
  const x=setup(5);await x.dirty('P5');const c=new WorkspaceSyncCoordinator({access:x.access} as any,x.db,x.factory,{candidates:2,attempts:1,milliseconds:25000});await c.runForActor(who);await c.runForActor(who);expect(x.access).not.toHaveBeenCalled();expect(await c.runForActor(who)).toMatchObject({delivered:1});expect(x.access).toHaveBeenCalledWith('P5',who);
 });
 it('one actor pass is serialized across concurrent HTTP requests',async()=>{
  const x=setup(1);await x.dirty('P1');let release!:(v:any)=>void;const pending=new Promise<any>(yes=>release=yes);x.access.mockReturnValueOnce(pending);const first=x.coordinator.runForActor(who);await vi.waitFor(()=>expect(x.access).toHaveBeenCalledOnce());expect(await x.coordinator.runForActor(who)).toEqual({examined:0,eligible:0,attempted:0,delivered:0,skipped:0,deferred:0});release({accessToken:'private-access',authorizationId:'GP1'});await first;expect(x.access).toHaveBeenCalledOnce();
 });
 it('manual Project retry retains its explicit repair/administration policy independently',async()=>{
  const x=setup(1);await x.dirty('P1');x.store[cp('P1')].workbookHealth='REPAIR_REQUIRED';expect(await x.coordinator.runForActor(who)).toMatchObject({skipped:1});await new ProjectGoogleWorkspaceServer(x.db).retrySync('P1',who,x.factory('explicit-browser','P1'));expect(x.store['projects/P1/workspace_sync_outbox/MASTER_DATA'].status).toBe('DELIVERED');
 });
});

 it('a canonically demoted non-administrator cannot discover or execute grants using stale SUPER_ADMIN claims',async()=>{
  const x=setup(1);await x.dirty('P1');x.store['users/actor'].role='VIEWER';expect(await x.coordinator.runForActor(who)).toEqual({examined:0,eligible:0,attempted:0,delivered:0,skipped:0,deferred:0});expect(x.access).not.toHaveBeenCalled();expect(x.factory).not.toHaveBeenCalled();
 });
 it('attempt bounds and durable continuation do not starve pending work on later grants',async()=>{
  const x=setup(5);for(const id of ['P1','P2','P3','P4','P5'])await x.dirty(id);expect(await x.coordinator.runForActor(who)).toMatchObject({attempted:3,delivered:3});expect(x.store['projects/P4/workspace_sync_outbox/MASTER_DATA'].status).toBe('PENDING');expect(await x.coordinator.runForActor(who)).toMatchObject({attempted:2,delivered:2});expect(x.access.mock.calls.map(c=>c[0])).toEqual(['P1','P2','P3','P4','P5']);
 });

 it('retains a Project authorization diagnosis already recorded by the canonical drain',async()=>{
  const x=setup();await x.dirty('P1');await x.dirty('P2');x.factory('', 'P1').subject.mockRejectedValueOnce(new GoogleWorkspaceCommandError('SCOPE_DENIED',403));
  expect(await x.coordinator.runForActor(who)).toMatchObject({deferred:1,delivered:1});expect(x.store[cp('P1')]).toMatchObject({state:'AUTHORIZATION_REQUIRED',lastSyncError:'SCOPE_DENIED',syncOwner:null});expect(x.store['workspace_google_authorizations/GP1'].status).toBe('ACTIVE');
 });
