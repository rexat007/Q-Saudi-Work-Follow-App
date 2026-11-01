import {describe,it,expect,vi,afterEach} from 'vitest';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {commandDatabase,accountProfile} from './helpers/commandDatabase';
import {setTestDbOverride} from '../firebase/admin';
import {WorkspaceGoogleOfflineAuthorization,sealWorkspaceSecret,openWorkspaceSecret,workspaceOfflineConfig,AUTHORIZATIONS,type OfflineConfig} from '../services/workspaceGoogleOfflineAuthorization.server';
import {ProjectGoogleWorkspaceServer,GoogleWorkspaceCommandError} from '../services/projectGoogleWorkspace.server';
import {markDirtyInTransaction,getState} from '../services/projectWorkspaceProjectionState.server';
import {runWorkspaceSyncWorker} from '../../server/workspaceSyncWorker';
import {REQUIRED_WORKSPACE_SCOPES} from '../utils/googleWorkspaceScopes';
const config:OfflineConfig={clientId:'fixture-client',clientSecret:'fixture-secret',redirectUri:'https://fixture.example/workspace/google/callback',key:Buffer.alloc(32,7),keyVersion:'v1'};
const who={userId:'actor',role:'SUPER_ADMIN' as const,email:'',displayName:'',assignedProjectIds:[]};
const path='projects/P1/workspace_continuity/current';
function setup(){
 const x=commandDatabase({'users/actor':accountProfile(),'projects/P1':{projectId:'P1',nameAr:'Project',status:'SETUP',settings:{}},[path]:{projectId:'P1',state:'READY',workbookHealth:'HEALTHY',automationState:'READY',binding:{projectId:'P1',spreadsheetId:'file',projectFolderId:'folder',destinationRootFolderId:'root',googleSubject:'subject',revision:1,workspaceBlueprintVersion:'SABIL-HAIL-V1'}}});setTestDbOverride(x.db);
 const provider={authorizationUrl:vi.fn((o:any)=>`https://accounts.google.com/o/oauth2/v2/auth?state=${o.state}&code_challenge=${o.challenge}`),exchange:vi.fn(async()=>({refreshToken:'fixture-private-refresh',subject:'subject',scopes:[...REQUIRED_WORKSPACE_SCOPES]})),refresh:vi.fn(async()=>({accessToken:'fixture-private-access',subject:'subject',scopes:[...REQUIRED_WORKSPACE_SCOPES]})),revoke:vi.fn(async()=>{})};
 const subject=vi.fn(async()=> 'subject'),authorization=new WorkspaceGoogleOfflineAuthorization(()=>provider,x.db,()=>config,subject);
 const port={subject:vi.fn(async()=> 'subject'),verifyBinding:vi.fn(async()=>({title:'Sheet'})),projectMasterTabs:vi.fn(async()=>{}),upsert:vi.fn(async()=>{})};
 const authorize=async()=>{const start=await authorization.begin('P1',who,true),state=new URL(start.url).searchParams.get('state')!;await authorization.callback(state,'fixture-code',start.browser);return {state,start};};
 const dirty=()=>x.db.runTransaction((tx:any)=>markDirtyInTransaction(tx,'P1',['CARRIERS'],'TEST',undefined,x.db));
 return {...x,provider,subject,authorization,port,authorize,dirty};
}
afterEach(()=>vi.unstubAllEnvs());
describe('server-only offline Google authorization',()=>{
 it('requests PKCE with a one-use browser-bound transaction and encrypts the verifier',async()=>{
  const x=setup(),start=await x.authorization.begin('P1',who,false),options=x.provider.authorizationUrl.mock.calls[0][0];
  expect(options.challenge).toMatch(/^[\w-]{43}$/);expect(options.nonce).toMatch(/^[\w-]{43}$/);expect(options.scopes).not.toContain(REQUIRED_WORKSPACE_SCOPES[2]);
  const transaction=Object.values(x.store).find((v:any)=>v.browserHash) as any;
  expect(transaction.browserHash).not.toBe(start.browser);expect(transaction.verifier.ciphertext).toBeTruthy();expect(transaction.expiresAt).toBeGreaterThan(Date.now());
 });
 it('saves only authenticated ciphertext separately from business documents and returns no token',async()=>{
  const x=setup();const {start,state}=await x.authorize(),id=x.store[path].backgroundAuthorizationId,grant=x.store[AUTHORIZATIONS+'/'+id];
  expect(grant.secret.version).toBe('v1');expect(openWorkspaceSecret(grant.secret,`workspace:P1:subject:${id}`,config)).toBe('fixture-private-refresh');
  expect(JSON.stringify(x.store)).not.toContain('fixture-private-refresh');expect(JSON.stringify(x.store[path])).not.toContain('ciphertext');
  expect(x.store[path].backgroundAuthorization).toBe('CONNECTED');expect(start.url).not.toContain('fixture-private');
  await expect(x.authorization.callback(state,'fixture-code',start.browser)).rejects.toThrow('GOOGLE_OAUTH_TRANSACTION_INVALID');expect(x.provider.exchange).toHaveBeenCalledOnce();
 });
 it.each(['cookie','expiry','state','project binding','subject','scope'] as const)('fails closed for invalid %s without storing a refresh credential',async kind=>{
  const x=setup(),start=await x.authorization.begin('P1',who,true);let state=new URL(start.url).searchParams.get('state')!,cookie=start.browser;
  const transaction=Object.values(x.store).find((v:any)=>v.browserHash) as any;
  if(kind==='cookie')cookie='wrong';if(kind==='expiry')transaction.expiresAt=0;if(kind==='state')state='invalid';
  if(kind==='project binding')x.store[path].binding.spreadsheetId='foreign';
  if(kind==='subject')x.provider.exchange.mockResolvedValueOnce({refreshToken:'fixture-private-refresh',subject:'other',scopes:[...REQUIRED_WORKSPACE_SCOPES]});
  if(kind==='scope')x.provider.exchange.mockResolvedValueOnce({refreshToken:'fixture-private-refresh',subject:'subject',scopes:[]});
  await expect(x.authorization.callback(state,'fixture-code',cookie)).rejects.toThrow();expect(Object.keys(x.store).some(p=>p.startsWith(AUTHORIZATIONS+'/'))).toBe(false);
 });
 it('rechecks current Project authorization before callback and worker refresh',async()=>{
  const x=setup(),start=await x.authorization.begin('P1',who,true),state=new URL(start.url).searchParams.get('state')!;
  x.store['users/actor'].status='SUSPENDED';await expect(x.authorization.callback(state,'fixture-code',start.browser)).rejects.toThrow();expect(x.provider.exchange).not.toHaveBeenCalled();
 });
 it('rejects Google subject changes at begin and during refresh',async()=>{
  const x=setup();x.subject.mockResolvedValueOnce('foreign');await expect(x.authorization.begin('P1',who,true)).rejects.toThrow('WORKSPACE_GOOGLE_ACCOUNT_MISMATCH');
  await x.authorize();x.provider.refresh.mockResolvedValueOnce({accessToken:'fixture-private-access',subject:'foreign',scopes:[...REQUIRED_WORKSPACE_SCOPES]});await expect(x.authorization.access('P1',who)).rejects.toThrow('AUTHORIZATION_REQUIRED');
  expect(x.store[path].binding.spreadsheetId).toBe('file');
 });
 it('revokes locally even when Google is unavailable and never returns the credential',async()=>{
  const x=setup();await x.authorize();x.provider.revoke.mockRejectedValueOnce(Error('provider offline'));
  expect(await x.authorization.revoke('P1',who)).toEqual({revoked:true});const grant=x.store[AUTHORIZATIONS+'/'+x.store[path].backgroundAuthorizationId];
  expect(grant).toMatchObject({status:'REVOKED',secret:null});expect(await new ProjectGoogleWorkspaceServer(x.db).status('P1',who)).toMatchObject({workspaceState:'CONNECTED',syncHealth:'AUTHORIZATION_REQUIRED',binding:{spreadsheetId:'file'}});
 });
 it('authenticates ciphertext with Project, subject and authorization identity',()=>{
  const sealed=sealWorkspaceSecret('fixture-private-refresh','workspace:P1:subject:a',config);
  expect(()=>openWorkspaceSecret(sealed,'workspace:P2:subject:a',config)).toThrow('GOOGLE_CREDENTIAL_UNAVAILABLE');
  expect(()=>openWorkspaceSecret({...sealed,tag:Buffer.alloc(16).toString('base64')},'workspace:P1:subject:a',config)).toThrow('GOOGLE_CREDENTIAL_UNAVAILABLE');
  expect(sealWorkspaceSecret('same','same',config).nonce).not.toBe(sealWorkspaceSecret('same','same',config).nonce);
 });
 it('keeps credentials under default-deny rules and never reflects callback secrets',()=>{
  const rules=fs.readFileSync('firestore.rules','utf8');expect(rules).toContain('match /{document=**}');expect(rules).toContain('allow read, write: if false');expect(rules).not.toContain('match /workspace_google_authorizations');
  const route=fs.readFileSync('server/workspaceGoogleOAuth.routes.ts','utf8');expect(route).toContain("res.cookie");expect(route).toContain('httpOnly:true');expect(route).toContain("frame-ancestors 'none'");expect(route).not.toContain('console.');
 });
 it.each(['client','secret','redirect','key'] as const)('rejects missing or malformed %s configuration without leaking values',kind=>{
  vi.stubEnv('GOOGLE_WORKSPACE_CLIENT_ID',kind==='client'?'':'fixture-client');vi.stubEnv('GOOGLE_WORKSPACE_CLIENT_SECRET',kind==='secret'?'':'fixture-secret');vi.stubEnv('GOOGLE_WORKSPACE_REDIRECT_URI',kind==='redirect'?'https://foreign.example/wrong':'https://fixture.example/workspace/google/callback');vi.stubEnv('GOOGLE_WORKSPACE_CREDENTIAL_KEY',kind==='key'?'bad-key':config.key.toString('base64'));
  expect(()=>workspaceOfflineConfig()).toThrow('GOOGLE_OFFLINE_CONFIGURATION_REQUIRED');
 });
});
describe('browser-absent canonical worker using the existing drain',()=>{
 it('accepts usable binding/sync authorization even when optional Script scope is declined',async()=>{
  const x=setup();x.provider.exchange.mockResolvedValueOnce({refreshToken:'fixture-private-refresh',subject:'subject',scopes:REQUIRED_WORKSPACE_SCOPES.slice(0,2)});x.provider.refresh.mockResolvedValueOnce({accessToken:'fixture-private-access',subject:'subject',scopes:REQUIRED_WORKSPACE_SCOPES.slice(0,2)});await x.authorize();
  const grant=x.store[AUTHORIZATIONS+'/'+x.store[path].backgroundAuthorizationId];expect(grant.status).toBe('ACTIVE');expect(grant.scopes).not.toContain(REQUIRED_WORKSPACE_SCOPES[2]);expect(x.store[path].binding.spreadsheetId).toBe('file');
 });
 it('refreshes a secure grant, rereads Firestore and delivers/acknowledges with no browser token',async()=>{
  const x=setup();await x.authorize();await x.dirty();const factory=vi.fn(()=>x.port);
  const result=await runWorkspaceSyncWorker(x.db,x.authorization,factory as any,()=>config);
  expect(result).toEqual({examined:1,delivered:1,deferred:0});expect(factory).toHaveBeenCalledWith('fixture-private-access','P1');expect(x.port.projectMasterTabs).toHaveBeenCalledWith('file',expect.objectContaining({projectId:'P1'}),['CARRIERS']);
  expect(x.store['projects/P1/workspace_sync_outbox/MASTER_DATA'].status).toBe('DELIVERED');expect((await getState('P1',x.db)).dirtyTabs).toEqual([]);expect(x.provider.refresh).toHaveBeenCalledWith('fixture-private-refresh');
 });
 it.each(['401','403 scope','429','503','network'] as const)('preserves binding and pending data on %s while classifying authorization precisely',async kind=>{
  const x=setup();await x.authorize();await x.dirty();
  if(kind==='401')x.provider.refresh.mockRejectedValueOnce(new GoogleWorkspaceCommandError('AUTHORIZATION_REQUIRED',401));
  else if(kind==='403 scope')x.provider.refresh.mockResolvedValueOnce({accessToken:'fixture-private-access',subject:'subject',scopes:[]});
  else x.provider.refresh.mockRejectedValueOnce(Error(kind));
  const result=await runWorkspaceSyncWorker(x.db,x.authorization,(()=>x.port) as any,()=>config);expect(result.deferred).toBe(1);expect(x.port.projectMasterTabs).not.toHaveBeenCalled();
  const s=await new ProjectGoogleWorkspaceServer(x.db).status('P1',who);expect(s).toMatchObject({workspaceState:'CONNECTED',pendingSyncCount:1,syncHealth:['401','403 scope'].includes(kind)?'AUTHORIZATION_REQUIRED':'DEGRADED'});
 });
 it('retains pending work and marks degraded after a generic Sheets 403',async()=>{
  const x=setup();await x.authorize();await x.dirty();x.port.projectMasterTabs.mockRejectedValueOnce({response:{status:403}});
  await runWorkspaceSyncWorker(x.db,x.authorization,(()=>x.port) as any,()=>config);expect(x.store[path]).toMatchObject({state:'SYNC_DEGRADED',binding:{spreadsheetId:'file'}});expect(x.store[path].lastSyncError).not.toContain('SCOPE_DENIED');expect(x.store['projects/P1/workspace_sync_outbox/MASTER_DATA'].status).toBe('PENDING');
 });
 it('keeps an unavailable file distinct and never replaces its recorded binding',async()=>{
  const x=setup();await x.authorize();await x.dirty();x.port.verifyBinding.mockRejectedValueOnce(new GoogleWorkspaceCommandError('BOUND_FILE_UNAVAILABLE',404));
  await runWorkspaceSyncWorker(x.db,x.authorization,(()=>x.port) as any,()=>config);
  expect(x.store[path]).toMatchObject({state:'BOUND_FILE_UNAVAILABLE',binding:{spreadsheetId:'file'}});expect(x.port.projectMasterTabs).not.toHaveBeenCalled();expect(x.store['projects/P1/workspace_sync_outbox/MASTER_DATA'].status).toBe('PENDING');
 });
 it('does not acknowledge after lease expiry and the next worker safely reclaims unfinished work',async()=>{
  const x=setup();await x.authorize();await x.dirty();x.port.projectMasterTabs.mockImplementationOnce(async()=>{x.store[path].syncLeaseExpiresAt=Date.now()-1;});
  await runWorkspaceSyncWorker(x.db,x.authorization,(()=>x.port) as any,()=>config);expect(x.store['projects/P1/workspace_sync_outbox/MASTER_DATA'].status).toBe('PENDING');expect((await getState('P1',x.db)).dirtyTabs).toEqual(['CARRIERS']);
  await runWorkspaceSyncWorker(x.db,x.authorization,(()=>x.port) as any,()=>config);expect(x.store['projects/P1/workspace_sync_outbox/MASTER_DATA'].status).toBe('DELIVERED');expect(x.port.projectMasterTabs).toHaveBeenCalledTimes(2);
 });
 it('fences authorization revocation during delivery before acknowledgment',async()=>{
  const x=setup();await x.authorize();await x.dirty();x.port.projectMasterTabs.mockImplementationOnce(async()=>{x.store[AUTHORIZATIONS+'/'+x.store[path].backgroundAuthorizationId].status='REVOKED';});
  await runWorkspaceSyncWorker(x.db,x.authorization,(()=>x.port) as any,()=>config);
  expect(x.store['projects/P1/workspace_sync_outbox/MASTER_DATA'].status).toBe('PENDING');expect((await getState('P1',x.db)).dirtyTabs).toEqual(['CARRIERS']);
 });
 it('does not write for a foreign Project or a replaced canonical grant',async()=>{
  const x=setup();await x.authorize();await x.dirty();x.provider.refresh.mockClear();x.store[AUTHORIZATIONS+'/'+x.store[path].backgroundAuthorizationId].projectId='P2';
  await runWorkspaceSyncWorker(x.db,x.authorization,(()=>x.port) as any,()=>config);expect(x.provider.refresh).not.toHaveBeenCalled();expect(x.port.projectMasterTabs).not.toHaveBeenCalled();
 });
 it('has a fail-closed standalone scheduling entry without a public unauthenticated trigger',()=>{
  const script=fs.readFileSync('scripts/run-workspace-sync-worker.ts','utf8');expect(script).toContain('runWorkspaceSyncWorker');expect(script).not.toContain('accessToken');
  expect(fs.readFileSync('server/app.ts','utf8')).not.toMatch(/app\.post\([^\n]*worker/);
 });
});


describe('user-active durable refresh bounded failures',()=>{
 it.each([['GOOGLE_NETWORK_ERROR',502],['GOOGLE_SERVICE_UNAVAILABLE',503],['GOOGLE_RATE_LIMITED',429],['SCOPE_DENIED',403]] as const)('preserves %s and its HTTP meaning without revoking a transiently unavailable grant',async(code,status)=>{
  const x=setup();await x.authorize();await x.dirty();
  x.provider.refresh.mockRejectedValueOnce(new GoogleWorkspaceCommandError(code,status));
  await expect(x.authorization.access('P1',who)).rejects.toMatchObject(code==='SCOPE_DENIED'?{code:'AUTHORIZATION_REQUIRED',authorizationReason:'AUTH_BINDING_SCOPE_MISSING'}:{code,status,message:code});
  expect(x.store[path]).toMatchObject({backgroundAuthorization:code==='SCOPE_DENIED'?'AUTHORIZATION_REQUIRED':'CONNECTED',binding:{spreadsheetId:'file'}});
  expect(x.store[AUTHORIZATIONS+'/'+x.store[path].backgroundAuthorizationId].status).toBe(code==='SCOPE_DENIED'?'AUTHORIZATION_REQUIRED':'ACTIVE');
  expect(x.store['projects/P1/workspace_sync_outbox/MASTER_DATA'].status).toBe('PENDING');
 });
});
