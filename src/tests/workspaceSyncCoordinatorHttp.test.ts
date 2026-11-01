import {describe,it,expect,vi,beforeEach,afterEach} from 'vitest';
import express from 'express';
import http from 'node:http';
import type {AddressInfo} from 'node:net';
import {registerUserActiveWorkspaceSync} from '../../server/workspaceSyncCoordinator.routes';
import {WorkspaceSyncCoordinator} from '../../server/workspaceSyncCoordinator';
import {GoogleWorkspaceCommandError} from '../services/projectGoogleWorkspace.server';
import {commandDatabase,accountProfile} from './helpers/commandDatabase';
import {markDirtyInTransaction} from '../services/projectWorkspaceProjectionState.server';
import {setTestDbOverride} from '../firebase/admin';
const who={userId:'actor',role:'SUPER_ADMIN' as const,assignedProjectIds:[],email:'',displayName:''};
let server:http.Server;const pass={examined:3,eligible:1,attempted:1,delivered:1,skipped:2,deferred:0};let run=vi.fn();
const request=(body:any={},authorized=true,extra:Record<string,string>={})=>new Promise<{status:number;body:string;headers:http.IncomingHttpHeaders}>((resolve,reject)=>{const r=http.request({host:'127.0.0.1',port:(server.address() as AddressInfo).port,path:'/api/workspace/user-active-sync',method:'POST',headers:{'Content-Type':'application/json',...(authorized?{Authorization:'Bearer fixture-firebase'}:{}),...extra}},res=>{let body='';res.on('data',c=>body+=c);res.on('end',()=>resolve({status:res.statusCode!,body,headers:res.headers}));});r.on('error',reject);r.end(JSON.stringify(body));});
beforeEach(async()=>{run=vi.fn(async()=>pass);const app=express();app.use(express.json());app.use((req:any,_res,next)=>{if(req.headers.authorization==='Bearer fixture-firebase')req.user=who;next();});registerUserActiveWorkspaceSync(app,{runForActor:u=>run(u)});await new Promise<void>((yes,no)=>{server=app.listen(0,'127.0.0.1',yes);server.once('error',no)});});
afterEach(async()=>{if(server.listening)await new Promise<void>((yes,no)=>server.close(e=>e?no(e):yes()));});
describe('application-global coordinator transport',()=>{
 it('returns only bounded counts with no Project request identity, Google credentials or private diagnostics',async()=>{const r=await request();expect(r.status).toBe(200);expect(JSON.parse(r.body)).toEqual({success:true,...pass});expect(run).toHaveBeenCalledWith(who);expect(r.headers['cache-control']).toBe('no-store');});
 it('Firebase authentication failure remains global 401',async()=>{expect((await request({},false)).status).toBe(401);expect(run).not.toHaveBeenCalled();});
 it.each([{projectId:'P1'},{projectIds:['P1','P2']},['P1']])('rejects client execution scope %j',async body=>{expect((await request(body)).status).toBe(400);expect(run).not.toHaveBeenCalled();});
 it('rejects unnecessary Google browser credentials without invoking discovery',async()=>{expect((await request({},true,{'X-Google-Access-Token':'private-stale-google'})).status).toBe(400);expect(run).not.toHaveBeenCalled();});
 it('a real Project Google authorization failure is HTTP 200 and does not stop the second Project',async()=>{
  const records:Record<string,any>={'users/actor':accountProfile()};for(const id of ['P1','P2']){records['projects/'+id]={projectId:id,status:'SETUP',settings:{}};records[`projects/${id}/workspace_continuity/current`]={projectId:id,state:'READY',backgroundAuthorization:'CONNECTED',backgroundAuthorizationId:'G'+id,workbookHealth:'HEALTHY',automationState:'READY',binding:{projectId:id,spreadsheetId:'sheet-'+id,googleSubject:'subject',revision:1,workspaceBlueprintVersion:'SABIL-HAIL-V1'}};records['workspace_google_authorizations/G'+id]={projectId:id,actorId:'actor',status:'ACTIVE',subject:'subject',spreadsheetId:'sheet-'+id,bindingRevision:1};}
  const x=commandDatabase(records);setTestDbOverride(x.db);for(const id of ['P1','P2'])await x.db.runTransaction((tx:any)=>markDirtyInTransaction(tx,id,['CARRIERS'],'TEST',undefined,x.db));
  const access=vi.fn(async(id:string)=>{if(id==='P1')throw new GoogleWorkspaceCommandError('AUTHORIZATION_REQUIRED',401);return {accessToken:'private-access',authorizationId:'GP2',automation:true};});
  const coordinator=new WorkspaceSyncCoordinator({access} as any,x.db,()=>({subject:async()=> 'subject',verifyBinding:async()=>({}),projectMasterTabs:async()=>{},upsert:async()=>{}}) as any);run.mockImplementation(u=>coordinator.runForActor(u));
  const r=await request();expect(r.status).toBe(200);expect(JSON.parse(r.body)).toMatchObject({success:true,attempted:2,delivered:1,deferred:1});expect(r.body).not.toMatch(/P1|P2|private|AUTHORIZATION_REQUIRED|subject|scriptId/);expect(x.store['projects/P1/workspace_sync_outbox/MASTER_DATA'].status).toBe('PENDING');expect(x.store['projects/P2/workspace_sync_outbox/MASTER_DATA'].status).toBe('DELIVERED');
 });
 it('unexpected pass failure is a bounded availability error, never a Google global 401 or raw payload',async()=>{run.mockRejectedValueOnce(Object.assign(Error('private-token private-email'),{code:'AUTHORIZATION_REQUIRED',status:401}));const r=await request();expect(r.status).toBe(503);expect(JSON.parse(r.body)).toEqual({success:false,code:'WORKSPACE_COORDINATOR_UNAVAILABLE'});});
});
