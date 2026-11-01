// @vitest-environment happy-dom
import {beforeEach,afterEach,describe,it,expect,vi} from 'vitest';
const f=vi.hoisted(()=>({fetch:vi.fn(),grant:vi.fn(),auth:{currentUser:{uid:'actor',providerData:[{providerId:'google.com',uid:'subject'}],getIdToken:async()=> 'fixture-firebase'}}}));
vi.mock('../firebase/config',()=>({auth:f.auth,db:{}}));
vi.mock('../runtime/runtimeGeneration',()=>({CLIENT_BUILD_ID:'fixture',ensureRuntimeGeneration:async()=>{},assertRuntimeGeneration:()=>{}}));
vi.mock('../services/googleWorkspaceAuthorization',()=>({requestWorkspaceGoogleToken:f.grant,prepareWorkspaceGoogleAuthorization:async()=>{}}));
import {ClientWorkspaceService} from '../services/workspace.service';
import {authorizeBoundWorkspaceExecution} from '../utils/workspaceAuthorization';
import {resolveWorkspaceExecutionToken} from '../../server/workspaceExecutionToken';
import type {ProjectGoogleStatus} from '../types/projectGoogleWorkspace';
import {readFileSync} from 'node:fs';
const status=(valid=false,result=valid?'CONNECTED_VALID':'REAUTHORIZATION_REQUIRED'):ProjectGoogleStatus=>({state:'READY',binding:{projectId:'P1',spreadsheetId:'file',revision:1} as any,backgroundAuthorization:valid?'CONNECTED':'NOT_CONNECTED',authorizationDiagnostic:{result:result as any,...(!valid?{reason:'AUTH_GRANT_MISSING' as const}:{}),metadataOnly:true},pendingSyncCount:0,lastSyncError:null,lastSuccessfulSyncAt:null});
const reply=(data:unknown)=>new Response(JSON.stringify({success:true,data}),{headers:{'content-type':'application/json'}});
beforeEach(()=>{vi.clearAllMocks();vi.stubGlobal('fetch',f.fetch);f.grant.mockResolvedValue('fixture-browser');});
afterEach(()=>{vi.restoreAllMocks();vi.unstubAllGlobals();});
describe('canonical bound authorization policy',()=>{
 it('missing grant routes only to durable consent and verifies canonical status before execution',async()=>{
  const port={getGoogleWorkspaceStatus:vi.fn().mockResolvedValueOnce(status()).mockResolvedValueOnce(status(true)),connectBackgroundAuthorization:vi.fn(async()=>{})};
  expect(await authorizeBoundWorkspaceExecution('P1',port,()=>true)).toMatchObject({backgroundAuthorization:'CONNECTED'});expect(port.connectBackgroundAuthorization).toHaveBeenCalledWith('P1',expect.any(Function));expect(port.getGoogleWorkspaceStatus).toHaveBeenCalledTimes(2);
 });
 it.each(['AUTH_GRANT_MISSING','AUTH_GRANT_NOT_ACTIVE','REAUTHORIZATION_REQUIRED'])('popup completion cannot authorize execution when read-back says %s',async reason=>{
  const after=status();after.authorizationDiagnostic={result:'REAUTHORIZATION_REQUIRED',reason:reason==='REAUTHORIZATION_REQUIRED'?undefined:reason as any,metadataOnly:true};
  const port={getGoogleWorkspaceStatus:vi.fn().mockResolvedValueOnce(status()).mockResolvedValueOnce(after),connectBackgroundAuthorization:vi.fn(async()=>{})};
  await expect(authorizeBoundWorkspaceExecution('P1',port,()=>true)).rejects.toThrow('DURABLE_AUTHORIZATION_REQUIRED');
 });
 it('failed durable consent stops immediately without another provider authority',async()=>{const read=vi.fn(async()=>status()),connect=vi.fn(async()=>{throw Error('POPUP_CLOSED')});await expect(authorizeBoundWorkspaceExecution('P1',{getGoogleWorkspaceStatus:read,connectBackgroundAuthorization:connect},()=>true)).rejects.toThrow('POPUP_CLOSED');expect(read).toHaveBeenCalledOnce();expect(f.grant).not.toHaveBeenCalled();});
 it.each(['CONNECTED_VALID','AUTOMATION_SCOPE_REQUIRED','PROVIDER_TEMPORARILY_UNAVAILABLE'])('usable durable state %s never requests consent again',async result=>{const port={getGoogleWorkspaceStatus:vi.fn(async()=>status(true,result)),connectBackgroundAuthorization:vi.fn()};await authorizeBoundWorkspaceExecution('P1',port,()=>true);expect(port.connectBackgroundAuthorization).not.toHaveBeenCalled();});
 it('stale automation-upgrade presentation cannot force new consent when canonical permission is already valid',async()=>{const port={getGoogleWorkspaceStatus:vi.fn(async()=>status(true)),connectBackgroundAuthorization:vi.fn()};await authorizeBoundWorkspaceExecution('P1',port,()=>true,true);expect(port.connectBackgroundAuthorization).not.toHaveBeenCalled();});
 it('a Project switch during canonical read prevents consent and execution',async()=>{let current=true;const port={getGoogleWorkspaceStatus:vi.fn(async()=>{current=false;return status();}),connectBackgroundAuthorization:vi.fn()};await expect(authorizeBoundWorkspaceExecution('P1',port,()=>current)).rejects.toThrow('WORKSPACE_IDENTITY_CHANGED');expect(port.connectBackgroundAuthorization).not.toHaveBeenCalled();});
 it('binding changes during consent are fenced even if the new grant is valid',async()=>{const after=status(true);after.binding!.spreadsheetId='another';const port={getGoogleWorkspaceStatus:vi.fn().mockResolvedValueOnce(status()).mockResolvedValueOnce(after),connectBackgroundAuthorization:vi.fn(async()=>{})};await expect(authorizeBoundWorkspaceExecution('P1',port,()=>true)).rejects.toThrow('WORKSPACE_IDENTITY_CHANGED');});
});
describe('actual client callback read-back and Firebase-only bound commands',()=>{
 function popup(){const p={closed:false,location:{href:''},close:vi.fn()};vi.spyOn(window,'open').mockReturnValue(p as any);return p;}
 function complete(p:unknown){window.dispatchEvent(new MessageEvent('message',{origin:window.location.origin,source:p as any,data:{type:'QSAUDI_WORKSPACE_OAUTH',projectId:'P1',result:'CONNECTED'}}));}
 it.each([false,true])('popup CONNECTED is accepted only if canonical read-back is usable: %s',async valid=>{
  const p=popup(),client=new ClientWorkspaceService();client.setAccessToken('stale-browser');f.fetch.mockImplementation(async(url:string)=>url.endsWith('/authorization')?new Response(JSON.stringify({url:'https://accounts.google.com/consent'}),{headers:{'content-type':'application/json'}}):reply(status(valid)));
  const pending=client.connectBackgroundAuthorization('P1',()=>true).then(()=>null,e=>e);await vi.waitFor(()=>expect(p.location.href).toContain('accounts.google.com'));complete(p);const result=await pending;
  if(valid){expect(result).toBeNull();expect(client.getAccessToken()).toBeNull();}else expect(result).toHaveProperty('message','DURABLE_AUTHORIZATION_REQUIRED');
  expect(f.fetch.mock.calls.map(c=>c[0])).toEqual(['/api/projects/P1/workspace/authorization','/api/projects/P1/workspace']);for(const [,options] of f.fetch.mock.calls)expect(options.headers['X-Google-Access-Token']).toBeUndefined();expect(p.close).toHaveBeenCalled();expect(f.grant).not.toHaveBeenCalled();
 });
 it('one durable consent supports initialize/retry/global sync and reopening without browser credentials or repeated consent',async()=>{
  const p=popup(),client=new ClientWorkspaceService();let connected=false;client.setAccessToken('provisioning-only');
  f.fetch.mockImplementation(async(url:string)=>url.endsWith('/authorization')?new Response(JSON.stringify({url:'https://accounts.google.com/consent'}),{headers:{'content-type':'application/json'}}):reply(status(connected)));
  const start=authorizeBoundWorkspaceExecution('P1',client,()=>true);await vi.waitFor(()=>expect(p.location.href).toContain('accounts.google.com'));connected=true;complete(p);await start;
  for(let i=0;i<2;i++){await authorizeBoundWorkspaceExecution('P1',client,()=>true);await client.initializeWorkspace('P1');await client.drainPendingWorkspace('P1');await client.requestUserActiveWorkspaceSync();await client.getGoogleWorkspaceStatus('P1');}
  expect(window.open).toHaveBeenCalledOnce();expect(f.grant).not.toHaveBeenCalled();for(const [,options] of f.fetch.mock.calls)expect(options.headers).toMatchObject({Authorization:'Bearer fixture-firebase'});expect(f.fetch.mock.calls.every(([,o])=>!o.headers['X-Google-Access-Token'])).toBe(true);
 });
 it('all bound execution/metadata/recovery methods omit even a still-cached browser token',async()=>{const c=new ClientWorkspaceService();c.setAccessToken('not-for-execution');f.fetch.mockImplementation(async()=>reply(status(true)));await c.getGoogleWorkspaceStatus('P1');await c.initializeWorkspace('P1');await c.drainPendingWorkspace('P1');await c.recoverWorkspaceAutomation('P1','script');await c.syncInitialProjectWorkspace('P1','file');for(const [,o] of f.fetch.mock.calls)expect(o.headers['X-Google-Access-Token']).toBeUndefined();expect(f.grant).not.toHaveBeenCalled();});
 it('unbound Picker/provisioning retain their explicit browser credential',async()=>{const c=new ClientWorkspaceService();await c.requestGoogleScopes();f.fetch.mockResolvedValue(reply({spreadsheetId:'file',projectFolderId:'folder'}));await c.provisionProjectDrive({projectId:'P1'} as any,'root');expect(f.grant).toHaveBeenCalledOnce();expect(f.fetch.mock.calls[0][1].headers['X-Google-Access-Token']).toBe('fixture-browser');});
});
describe('server entry-point defense',()=>{
 it.each(['initialize','retry-sync','automation/recover','legacy initial projection'])('%s cannot bypass the durable authority using a browser header',async()=>{
  let headerReads=0;const access=vi.fn(),provider=vi.fn(),headers={get 'x-google-access-token'(){headerReads++;return 'must-not-reach-google';}};
  const command=async()=>{const grant=await resolveWorkspaceExecutionToken('P1',{} as any,{headers},{status:async()=>({backgroundAuthorization:'NOT_CONNECTED'}),access});provider(grant.accessToken);};
  await expect(command()).rejects.toHaveProperty('code','AUTHORIZATION_REQUIRED');expect(headerReads).toBe(0);expect(access).not.toHaveBeenCalled();expect(provider).not.toHaveBeenCalled();
 });
 it('all bound HTTP routes, including the compatibility projection route, consume the strict resolver',()=>{const source=readFileSync('server/app.ts','utf8');for(const endpoint of ['/workspace/initialize','/workspace/retry-sync','/workspace/automation/recover']){const start=source.indexOf("app.post('/api/projects/:projectId"+endpoint+"'");expect(start).toBeGreaterThan(0);const body=source.slice(start,source.indexOf('\n});',start));expect(body).toContain('resolveWorkspaceExecutionToken(');expect(body).not.toContain('getGoogleAccessToken(');}const start=source.indexOf("app.use('/api/workspace/sync/initial'");expect(source.slice(start,source.indexOf('\n});',start))).toContain('resolveWorkspaceExecutionToken(');});
});
