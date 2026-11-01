import {describe,it,expect,vi} from 'vitest';
import {commandDatabase,accountProfile} from './helpers/commandDatabase';
import {WorkspaceGoogleOfflineAuthorization,AUTHORIZATIONS,type OfflineConfig} from '../services/workspaceGoogleOfflineAuthorization.server';
import {GoogleWorkspaceCommandError} from '../services/projectGoogleWorkspace.server';
import {REQUIRED_WORKSPACE_SCOPES,BINDING_WORKSPACE_SCOPES} from '../utils/googleWorkspaceScopes';
import {workspaceAuthorizationMessageKey} from '../utils/workspaceAuthorization';
const config:OfflineConfig={clientId:'fixture-client',clientSecret:'fixture-secret',redirectUri:'https://fixture.example/workspace/google/callback',key:Buffer.alloc(32,7),keyVersion:'v1'};
const who={userId:'actor',role:'SUPER_ADMIN' as const,email:'',displayName:'',assignedProjectIds:['P1']};
const path='projects/P1/workspace_continuity/current';
function setup(){
 const x=commandDatabase({'users/actor':accountProfile(),'projects/P1':{projectId:'P1',status:'SETUP',settings:{}},[path]:{projectId:'P1',state:'READY',binding:{projectId:'P1',spreadsheetId:'file',googleSubject:'subject',revision:1}}});
 const provider={authorizationUrl:vi.fn((o:any)=>`https://accounts.google.com?state=${o.state}`),exchange:vi.fn(async()=>({refreshToken:'private-refresh',subject:'subject',scopes:[...REQUIRED_WORKSPACE_SCOPES]})),refresh:vi.fn(async()=>({accessToken:'private-access',subject:'subject',scopes:[...REQUIRED_WORKSPACE_SCOPES]})),revoke:vi.fn(async()=>{})};
 const subject=vi.fn(async()=> 'subject'),authorization=new WorkspaceGoogleOfflineAuthorization(()=>provider,x.db,()=>config,subject);
 const begin=async()=>{const b=await authorization.begin('P1',who,true);return {state:new URL(b.url).searchParams.get('state')!,browser:b.browser};};
 const complete=({state,browser}:Awaited<ReturnType<typeof begin>>)=>authorization.callback(state,'private-code',browser);
 const authorize=async()=>{await complete(await begin());return x.store[path].backgroundAuthorizationId as string;};
 return {...x,provider,subject,authorization,begin,complete,authorize,grant:(id:string)=>x.store[AUTHORIZATIONS+'/'+id]};
}
function deferred<T>(){let resolve!:(v:T)=>void,reject!:(e:unknown)=>void;const promise=new Promise<T>((a,b)=>{resolve=a;reject=b;});return {resolve,reject,promise};}
const refreshed={accessToken:'private-access',subject:'subject',scopes:[...REQUIRED_WORKSPACE_SCOPES]};
describe('durable candidate acceptance and atomic replacement',()=>{
 it('never publishes CONNECTED until the encrypted candidate passes the same refresh authority',async()=>{
  const x=setup(),pending=await x.begin(),refresh=deferred<typeof refreshed>();x.provider.refresh.mockReturnValueOnce(refresh.promise);
  const result=x.complete(pending).catch(e=>e);await vi.waitFor(()=>expect(x.provider.refresh).toHaveBeenCalledOnce());
  const candidates=Object.entries(x.store).filter(([p])=>p.startsWith(AUTHORIZATIONS+'/'));expect(candidates).toHaveLength(1);expect(candidates[0][1].status).toBe('PENDING_VALIDATION');
  expect(x.store[path].backgroundAuthorization).toBeUndefined();expect(x.store[path].backgroundAuthorizationId).toBeUndefined();expect(JSON.stringify(x.store)).not.toContain('private-refresh');
  refresh.reject(new GoogleWorkspaceCommandError('GOOGLE_SERVICE_UNAVAILABLE',503));expect(await result).toMatchObject({code:'GOOGLE_SERVICE_UNAVAILABLE'});
  expect(Object.keys(x.store).some(p=>p.startsWith(AUTHORIZATIONS+'/'))).toBe(false);expect(x.store[path].backgroundAuthorization).not.toBe('CONNECTED');
 });
 it('failed replacement preserves the previous ACTIVE grant, pointer, secret and continuity exactly',async()=>{
  const x=setup(),old=await x.authorize(),before=structuredClone(x.store[path]),grant=structuredClone(x.grant(old));
  x.provider.refresh.mockRejectedValueOnce(new GoogleWorkspaceCommandError('AUTHORIZATION_REQUIRED',401));
  await expect(x.complete(await x.begin())).rejects.toMatchObject({authorizationReason:'AUTH_REFRESH_REJECTED'});
  expect(x.grant(old)).toEqual(grant);expect(x.store[path]).toEqual(before);expect(Object.keys(x.store).filter(p=>p.startsWith(AUTHORIZATIONS+'/'))).toHaveLength(1);
  expect(await x.authorization.access('P1',who)).toMatchObject({authorizationId:old});
 });
 it('successful replacement promotes only the validated candidate and supersedes the old grant atomically',async()=>{
  const x=setup(),old=await x.authorize(),id=await x.authorize();expect(id).not.toBe(old);
  expect(x.grant(old)).toMatchObject({status:'SUPERSEDED',secret:null});expect(x.grant(id)).toMatchObject({status:'ACTIVE',automationAuthorized:true});expect(x.grant(id).refreshValidatedAt).toBeGreaterThan(0);
  expect(x.store[path]).toMatchObject({backgroundAuthorization:'CONNECTED',backgroundAuthorizationId:id,authorizationVersion:2});expect(x.provider.refresh).toHaveBeenCalledTimes(2);
 });
 it('replacement does not interrupt execution using the existing canonical grant during validation',async()=>{
  const x=setup(),old=await x.authorize(),refresh=deferred<typeof refreshed>();x.provider.refresh.mockReturnValueOnce(refresh.promise);
  const pending=x.complete(await x.begin());await vi.waitFor(()=>expect(x.provider.refresh).toHaveBeenCalledTimes(2));
  expect(await x.authorization.access('P1',who)).toMatchObject({authorizationId:old});refresh.resolve(refreshed);await pending;expect(x.grant(old).status).toBe('SUPERSEDED');
 });
 it('revocation while a candidate validates fences activation, including first authorization with no previous grant',async()=>{
  const x=setup(),refresh=deferred<typeof refreshed>();x.provider.refresh.mockReturnValueOnce(refresh.promise);
  const pending=x.complete(await x.begin()).catch(e=>e);await vi.waitFor(()=>expect(x.provider.refresh).toHaveBeenCalledOnce());
  await x.authorization.revoke('P1',who);refresh.resolve(refreshed);expect(await pending).toMatchObject({code:'WORKSPACE_EXECUTION_FENCED'});expect(x.store[path].backgroundAuthorization).toBe('AUTHORIZATION_REQUIRED');
  expect(Object.keys(x.store).some(p=>p.startsWith(AUTHORIZATIONS+'/'))).toBe(false);
 });
 it('concurrent validated callbacks cannot replace a grant accepted after their consent transaction began',async()=>{
  const x=setup(),a=await x.begin(),b=await x.begin();await x.complete(a);const accepted=x.store[path].backgroundAuthorizationId;
  await expect(x.complete(b)).rejects.toMatchObject({code:'WORKSPACE_EXECUTION_FENCED'});expect(x.store[path].backgroundAuthorizationId).toBe(accepted);expect(x.grant(accepted).status).toBe('ACTIVE');
 });
});
describe('specific authoritative authorization causes',()=>{
 const cases=['id','document','status','actor','project','subject','spreadsheet','revision','provider subject','refresh subject','binding scope'] as const;
 const reasons=['AUTH_GRANT_MISSING','AUTH_GRANT_MISSING','AUTH_GRANT_NOT_ACTIVE','AUTH_ACTOR_MISMATCH','AUTH_PROJECT_MISMATCH','AUTH_SUBJECT_MISMATCH','AUTH_SPREADSHEET_MISMATCH','AUTH_BINDING_REVISION_MISMATCH','AUTH_PROVIDER_SUBJECT_CHANGED','AUTH_REFRESH_SUBJECT_MISMATCH','AUTH_BINDING_SCOPE_MISSING'];
 it.each(cases)('diagnoses %s without credential/PII exposure or a browser fallback',async kind=>{
  const x=setup(),id=await x.authorize(),g=x.grant(id),expected=reasons[cases.indexOf(kind)];
  if(kind==='id')delete x.store[path].backgroundAuthorizationId;if(kind==='document')delete x.store[AUTHORIZATIONS+'/'+id];if(kind==='status')g.status='REVOKED';
  if(kind==='actor')g.actorId='other';if(kind==='project')g.projectId='other';if(kind==='subject')g.subject='foreign';if(kind==='spreadsheet')g.spreadsheetId='foreign';if(kind==='revision')g.bindingRevision=99;
  if(kind==='provider subject')x.subject.mockResolvedValue('foreign');if(kind==='refresh subject')x.provider.refresh.mockResolvedValueOnce({...refreshed,subject:'foreign'});if(kind==='binding scope')x.provider.refresh.mockResolvedValueOnce({...refreshed,scopes:[]});
  const error=await x.authorization.access('P1',who).catch(e=>e);expect(error).toMatchObject({code:'AUTHORIZATION_REQUIRED',authorizationReason:expected});
  const diagnosis=await x.authorization.diagnoseWorkspaceAuthorization('P1',who);expect(diagnosis.reason).toBe(expected);if(kind==='refresh subject')expect(diagnosis.result).toBe('REAUTHORIZATION_REQUIRED');expect(JSON.stringify(diagnosis)).not.toMatch(/private-|foreign|ciphertext|actorId|subject|spreadsheetId/);
  const audits=Object.entries(x.store).filter(([p])=>p.includes('/audit_logs/')).map(([,v])=>v);expect(audits.some(v=>v.details.reason===expected)).toBe(true);
  if(kind==='actor')expect(x.grant(id).status).toBe('ACTIVE');if(kind==='status')expect(x.grant(id).status).toBe('REVOKED');
 });
 it('invalid_grant produces AUTH_REFRESH_REJECTED rather than hiding the reason or echoing provider data',async()=>{
  const x=setup(),id=await x.authorize();x.provider.refresh.mockRejectedValueOnce({response:{status:400,data:{error:'invalid_grant',email:'private-email',refresh_token:'private-refresh'}}});
  const error=await x.authorization.access('P1',who).catch(e=>e);expect(error).toMatchObject({code:'AUTHORIZATION_REQUIRED',authorizationReason:'AUTH_REFRESH_REJECTED'});expect(JSON.stringify(error)).not.toContain('private-');expect(x.grant(id)).toMatchObject({status:'AUTHORIZATION_REQUIRED',lastFailureReason:'AUTH_REFRESH_REJECTED'});
 });
 it.each(['GOOGLE_SERVICE_UNAVAILABLE','GOOGLE_NETWORK_ERROR','GOOGLE_RATE_LIMITED','GOOGLE_QUOTA_EXCEEDED'])('transient %s preserves the grant and recovers without consent',async code=>{
  const x=setup(),id=await x.authorize();x.provider.refresh.mockRejectedValueOnce(new GoogleWorkspaceCommandError(code,code==='GOOGLE_NETWORK_ERROR'?502:code==='GOOGLE_SERVICE_UNAVAILABLE'?503:429));
  await expect(x.authorization.access('P1',who)).rejects.toMatchObject({code});expect(x.grant(id).status).toBe('ACTIVE');expect(x.store[path].backgroundAuthorization).toBe('CONNECTED');
  expect(await x.authorization.diagnoseWorkspaceAuthorization('P1',who)).toMatchObject({result:'PROVIDER_TEMPORARILY_UNAVAILABLE',providerCode:code});
  await x.authorization.access('P1',who);expect(await x.authorization.diagnoseWorkspaceAuthorization('P1',who)).toMatchObject({result:'CONNECTED_VALID'});expect(x.provider.exchange).toHaveBeenCalledOnce();
 });
 it('optional automation permission is recorded without invalidating usable binding/sync authorization',async()=>{
  const x=setup();x.provider.refresh.mockResolvedValue({...refreshed,scopes:[...BINDING_WORKSPACE_SCOPES]});const id=await x.authorize();
  expect(x.grant(id)).toMatchObject({status:'ACTIVE',automationRequested:true,automationAuthorized:false});expect(await x.authorization.access('P1',who)).toMatchObject({authorizationId:id,automation:false});
  expect(await x.authorization.diagnoseWorkspaceAuthorization('P1',who)).toMatchObject({result:'AUTOMATION_SCOPE_REQUIRED',reason:'AUTH_AUTOMATION_SCOPE_MISSING'});expect(x.store[path].backgroundAuthorization).toBe('CONNECTED');
  x.grant(id).status='REVOKED';expect(await x.authorization.diagnoseWorkspaceAuthorization('P1',who)).toMatchObject({result:'REAUTHORIZATION_REQUIRED',reason:'AUTH_GRANT_NOT_ACTIVE'});
 });
 it('diagnosis reads only safe metadata: no configuration, decryption or Google refresh is needed',async()=>{
  const x=setup();await x.authorize();x.provider.refresh.mockClear();const auth=new WorkspaceGoogleOfflineAuthorization(()=>{throw Error('must not call provider')},x.db,()=>{throw Error('must not read secrets')},x.subject);
  expect(await auth.diagnoseWorkspaceAuthorization('P1',who)).toEqual({result:'CONNECTED_VALID',metadataOnly:true});expect(x.provider.refresh).not.toHaveBeenCalled();
 });
 it.each(['spreadsheetId','googleSubject','revision'] as const)('true binding identity change %s fences the previously accepted grant',async field=>{
  const x=setup(),id=await x.authorize();x.store[path].binding[field]=field==='revision'?2:'foreign';await expect(x.authorization.access('P1',who)).rejects.toMatchObject({code:'AUTHORIZATION_REQUIRED'});expect(x.grant(id).status).toBe('AUTHORIZATION_REQUIRED');
 });
 it('revocation during an in-flight refresh cannot return an execution token',async()=>{
  const x=setup();await x.authorize();const refresh=deferred<typeof refreshed>();x.provider.refresh.mockReturnValueOnce(refresh.promise);const access=x.authorization.access('P1',who).catch(e=>e);await vi.waitFor(()=>expect(x.provider.refresh).toHaveBeenCalledTimes(2));await x.authorization.revoke('P1',who);refresh.resolve(refreshed);expect(await access).toMatchObject({code:'AUTHORIZATION_REQUIRED',authorizationReason:'AUTH_GRANT_NOT_ACTIVE'});
 });
 it('UI guidance distinguishes reauthorization, binding/account review, optional automation and transient availability',()=>{
  const keys=['REAUTHORIZATION_REQUIRED','GRANT_BINDING_STALE','ACCOUNT_MISMATCH','AUTOMATION_SCOPE_REQUIRED','PROVIDER_TEMPORARILY_UNAVAILABLE'].map(result=>workspaceAuthorizationMessageKey({result:result as any,metadataOnly:true}));expect(new Set(keys).size).toBe(5);expect(keys.every(Boolean)).toBe(true);
 });
});

 it('a corrupt foreign-Project pointer cannot let replacement or revocation mutate another Project credential',async()=>{
  const x=setup(),foreign=await x.authorize();x.grant(foreign).projectId='P2';const preserved=structuredClone(x.grant(foreign));
  const replacement=await x.authorize();expect(x.grant(foreign)).toEqual(preserved);expect(x.grant(replacement).status).toBe('ACTIVE');
  x.store[path].backgroundAuthorizationId=foreign;await x.authorization.revoke('P1',who);expect(x.grant(foreign)).toEqual(preserved);expect(x.provider.revoke).not.toHaveBeenCalled();
 });

 it('recovers a lost activation transaction acknowledgment from the durable validated grant',async()=>{
  const x=setup(),run=x.db.runTransaction;let lost=false;
  x.db.runTransaction=async(callback:Function)=>{const result=await run(callback),id=x.store[path].backgroundAuthorizationId;if(!lost&&id&&x.grant(id)?.status==='ACTIVE'){lost=true;throw Error('simulated lost transaction acknowledgment');}return result;};
  expect(await x.complete(await x.begin())).toEqual({projectId:'P1',result:'CONNECTED'});expect(x.provider.exchange).toHaveBeenCalledOnce();expect(x.provider.refresh).toHaveBeenCalledOnce();expect(x.grant(x.store[path].backgroundAuthorizationId).status).toBe('ACTIVE');
  expect(Object.entries(x.store).filter(([p])=>p.includes('/audit_logs/')).map(([,v])=>v.action)).not.toContain('GOOGLE_AUTH_VALIDATION_FAILED');
 });
