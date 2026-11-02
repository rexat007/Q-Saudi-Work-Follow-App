// @vitest-environment happy-dom
import {beforeEach,afterEach,it,expect,vi} from 'vitest';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const f=vi.hoisted(()=>({fetch:vi.fn()}));
vi.mock('../firebase/config',()=>({auth:{currentUser:{uid:'actor',providerData:[{providerId:'google.com',uid:'subject'}],getIdToken:async()=> 'fixture-firebase'}},db:{}}));
vi.mock('../runtime/runtimeGeneration',()=>({CLIENT_BUILD_ID:'fixture',ensureRuntimeGeneration:async()=>{},assertRuntimeGeneration:()=>{}}));
vi.mock('../services/googleWorkspaceAuthorization',()=>({requestWorkspaceGoogleToken:vi.fn(),prepareWorkspaceGoogleAuthorization:async()=>{}}));
import {ClientWorkspaceService} from '../services/workspace.service';
import {WORKSPACE_OAUTH_CHANNEL as NAME,WORKSPACE_OAUTH_TIMEOUT_MS as TIMEOUT} from '../utils/workspaceOAuthCompletion';
const correlation='A'.repeat(32),another='B'.repeat(32),reply=(data:unknown)=>new Response(JSON.stringify(data),{headers:{'content-type':'application/json'}});
const status=(result='CONNECTED_VALID')=>({binding:{projectId:'P1',spreadsheetId:'file',revision:1},backgroundAuthorization:result==='REAUTHORIZATION_REQUIRED'?'NOT_CONNECTED':'CONNECTED',authorizationDiagnostic:{result,metadataOnly:true}});
const payload=(id=correlation)=>({type:'QSAUDI_WORKSPACE_OAUTH',projectId:'P1',correlationId:id,result:'CONNECTED'});
class Channel {
 static all:Channel[]=[];onmessage:((event:{data:any})=>void)|null=null;closed=false;
 constructor(readonly name:string){Channel.all.push(this);}
 postMessage(data:unknown){for(const peer of Channel.all)if(peer!==this&&!peer.closed&&peer.name===this.name)peer.onmessage?.({data});}
 close(){this.closed=true;this.onmessage=null;}
}
function emit(data:unknown){const c=new Channel(NAME);c.postMessage(data);c.close();}
function popup(){let reads=0;const p={location:{href:''},close:vi.fn(),get closed(){reads++;throw Error('COOP closed access prohibited');}};return {p,reads:()=>reads};}
beforeEach(()=>{vi.clearAllMocks();Channel.all=[];vi.stubGlobal('BroadcastChannel',Channel);vi.stubGlobal('fetch',f.fetch);f.fetch.mockImplementation(async(url:string)=>url.endsWith('/authorization')?reply({url:'https://accounts.google.com/consent',correlationId:correlation}):reply({data:status()}));});
afterEach(()=>{vi.restoreAllMocks();vi.unstubAllGlobals();vi.useRealTimers();});
const opened=async(p:ReturnType<typeof popup>['p'])=>vi.waitFor(()=>expect(p.location.href).toContain('accounts.google.com'));
it('BroadcastChannel succeeds with no opener even when popup.closed would throw; read-back precedes resolution',async()=>{
 const x=popup();vi.spyOn(window,'open').mockReturnValue(x.p as any);const client=new ClientWorkspaceService(),result=client.connectBackgroundAuthorization('P1',()=>true);await opened(x.p);emit(payload());await result;
 expect(x.reads()).toBe(0);expect(x.p.close).toHaveBeenCalledOnce();expect(Channel.all.every(c=>c.closed)).toBe(true);expect(f.fetch.mock.calls.map(c=>c[0])).toEqual(['/api/projects/P1/workspace/authorization','/api/projects/P1/workspace']);
});
it('wrong type/Project/correlation/result are ignored and duplicate channel/opener success causes one read-back',async()=>{
 const x=popup();vi.spyOn(window,'open').mockReturnValue(x.p as any);const result=new ClientWorkspaceService().connectBackgroundAuthorization('P1',()=>true);await opened(x.p);
 for(const change of [{type:'other'},{projectId:'P2'},{correlationId:another},{result:'UNKNOWN'}])emit({...payload(),...change});
 window.dispatchEvent(new MessageEvent('message',{origin:'https://foreign.example',source:x.p as any,data:payload()}));window.dispatchEvent(new MessageEvent('message',{origin:window.location.origin,source:null,data:payload()}));expect(f.fetch).toHaveBeenCalledOnce();
 emit(payload());emit(payload());window.dispatchEvent(new MessageEvent('message',{origin:window.location.origin,source:x.p as any,data:payload()}));await result;expect(f.fetch).toHaveBeenCalledTimes(2);expect(x.reads()).toBe(0);
});
it('correlated opener postMessage is a compatibility fallback when BroadcastChannel is unavailable',async()=>{
 vi.stubGlobal('BroadcastChannel',class{constructor(){throw Error('unsupported');}});const x=popup();vi.spyOn(window,'open').mockReturnValue(x.p as any);const result=new ClientWorkspaceService().connectBackgroundAuthorization('P1',()=>true);await opened(x.p);window.dispatchEvent(new MessageEvent('message',{origin:window.location.origin,source:x.p as any,data:payload()}));await result;expect(x.p.close).toHaveBeenCalledOnce();
});
it('correlated callback failure stops before status/execution and exposes only an allowlisted code',async()=>{
 const x=popup();vi.spyOn(window,'open').mockReturnValue(x.p as any);const result=new ClientWorkspaceService().connectBackgroundAuthorization('P1',()=>true).catch(e=>e);await opened(x.p);emit({...payload(),result:'AUTHORIZATION_FAILED',code:'private-provider-token',authorizationReason:'AUTH_REFRESH_REJECTED'});expect(await result).toHaveProperty('message','AUTH_REFRESH_REJECTED');expect(f.fetch).toHaveBeenCalledOnce();expect(Channel.all.every(c=>c.closed)).toBe(true);
});
it.each(['REAUTHORIZATION_REQUIRED','CONNECTED_VALID','AUTOMATION_SCOPE_REQUIRED'])('completion requires usable canonical read-back: %s',async diagnosis=>{
 const x=popup();vi.spyOn(window,'open').mockReturnValue(x.p as any);f.fetch.mockImplementation(async(url:string)=>url.endsWith('/authorization')?reply({url:'https://accounts.google.com/consent',correlationId:correlation}):reply({data:status(diagnosis)}));const result=new ClientWorkspaceService().connectBackgroundAuthorization('P1',()=>true).then(()=>null,e=>e);await opened(x.p);emit(payload());const value=await result;if(diagnosis==='REAUTHORIZATION_REQUIRED')expect(value).toHaveProperty('message','DURABLE_AUTHORIZATION_REQUIRED');else expect(value).toBeNull();expect(x.p.close).toHaveBeenCalledOnce();
});
it('timeout closes channel, removes the listener, aborts HTTP and attempts popup cleanup without closed polling',async()=>{
 vi.useFakeTimers();const x=popup(),add=vi.spyOn(window,'addEventListener'),remove=vi.spyOn(window,'removeEventListener');vi.spyOn(window,'open').mockReturnValue(x.p as any);const result=new ClientWorkspaceService().connectBackgroundAuthorization('P1',()=>true).catch(e=>e);await opened(x.p);await vi.advanceTimersByTimeAsync(TIMEOUT);expect(await result).toHaveProperty('message','GOOGLE_OFFLINE_AUTHORIZATION_FAILED');expect(x.reads()).toBe(0);expect(x.p.close).toHaveBeenCalledOnce();expect(Channel.all.every(c=>c.closed)).toBe(true);const callback=add.mock.calls.find(c=>c[0]==='message')![1];expect(remove).toHaveBeenCalledWith('message',callback);expect(f.fetch.mock.calls[0][1].signal.aborted).toBe(true);expect(vi.getTimerCount()).toBe(0);
});
it('Workspace intent invalidation cleans resources without consulting the popup across origins',async()=>{
 vi.useFakeTimers();let current=true;const x=popup();vi.spyOn(window,'open').mockReturnValue(x.p as any);const result=new ClientWorkspaceService().connectBackgroundAuthorization('P1',()=>current).catch(e=>e);await opened(x.p);current=false;await vi.advanceTimersByTimeAsync(500);expect(await result).toHaveProperty('message','WORKSPACE_IDENTITY_CHANGED');expect(Channel.all.every(c=>c.closed)).toBe(true);expect(x.reads()).toBe(0);expect(vi.getTimerCount()).toBe(0);
});
it('a second attempt cancels/cleans the first and never accepts its stale channel or opener message',async()=>{
 const a=popup(),b=popup();vi.spyOn(window,'open').mockReturnValueOnce(a.p as any).mockReturnValueOnce(b.p as any);let starts=0;f.fetch.mockImplementation(async(url:string)=>url.endsWith('/authorization')?reply({url:'https://accounts.google.com/consent',correlationId:++starts===1?correlation:another}):reply({data:status()}));const c=new ClientWorkspaceService(),first=c.connectBackgroundAuthorization('P1',()=>true).catch(e=>e);await opened(a.p);const second=c.connectBackgroundAuthorization('P1',()=>true);await opened(b.p);expect(await first).toHaveProperty('message','WORKSPACE_IDENTITY_CHANGED');emit(payload());window.dispatchEvent(new MessageEvent('message',{origin:window.location.origin,source:a.p as any,data:payload()}));expect(f.fetch).toHaveBeenCalledTimes(2);emit(payload(another));await second;expect(f.fetch).toHaveBeenCalledTimes(3);expect(a.p.close).toHaveBeenCalledOnce();expect(b.p.close).toHaveBeenCalledOnce();expect(Channel.all.every(c=>c.closed)).toBe(true);
});
it('the whole attempt deadline also cleans a stalled authorization HTTP request and forbids late navigation',async()=>{
 vi.useFakeTimers();let release!:(r:Response)=>void;f.fetch.mockImplementationOnce(()=>new Promise<Response>(r=>release=r));const x=popup();vi.spyOn(window,'open').mockReturnValue(x.p as any);const result=new ClientWorkspaceService().connectBackgroundAuthorization('P1',()=>true).catch(e=>e);await vi.waitFor(()=>expect(f.fetch).toHaveBeenCalledOnce());await vi.advanceTimersByTimeAsync(TIMEOUT);expect(await result).toHaveProperty('message','GOOGLE_OFFLINE_AUTHORIZATION_FAILED');release(reply({url:'https://accounts.google.com/consent',correlationId:correlation}));await vi.advanceTimersByTimeAsync(0);expect(x.p.location.href).toBe('');expect(Channel.all).toHaveLength(0);expect(vi.getTimerCount()).toBe(0);
});
it('a stalled canonical read-back cannot outlive the attempt deadline or claim authorization success',async()=>{
 vi.useFakeTimers();f.fetch.mockImplementation(async(url:string)=>url.endsWith('/authorization')?reply({url:'https://accounts.google.com/consent',correlationId:correlation}):new Promise(()=>{}));const x=popup();vi.spyOn(window,'open').mockReturnValue(x.p as any);const result=new ClientWorkspaceService().connectBackgroundAuthorization('P1',()=>true).catch(e=>e);await opened(x.p);emit(payload());await vi.waitFor(()=>expect(f.fetch).toHaveBeenCalledTimes(2));await vi.advanceTimersByTimeAsync(TIMEOUT);expect(await result).toHaveProperty('message','GOOGLE_OFFLINE_AUTHORIZATION_FAILED');expect(Channel.all.every(c=>c.closed)).toBe(true);expect(vi.getTimerCount()).toBe(0);
});
it('Workbox navigation matching excludes callback/query/slash and API, while preserving the normal offline app shell',async()=>{
 (globalThis as any).__WB_DISABLE_DEV_LOGS=true;const {NavigationRoute}=await import('workbox-routing/NavigationRoute.js');const config=readFileSync('vite.config.ts','utf8'),literal=config.match(/navigateFallbackDenylist:(\[[^\n]+\])/)!;expect(literal).not.toBeNull();const denylist=(vm.runInNewContext(literal[1]) as RegExp[]).map(r=>new RegExp(r.source,r.flags));const route=new NavigationRoute(async()=>new Response('app'),{denylist});
 for(const path of ['/workspace/google/callback','/workspace/google/callback?state=private&code=private','/workspace/google/callback/?error=access_denied','/api/projects/P1/workspace'])expect(route.match({url:new URL('https://app.example'+path),request:{mode:'navigate'}} as any)).toBe(false);
 for(const path of ['/','/projects/P1','/workspace/google/callbacks'])expect(route.match({url:new URL('https://app.example'+path),request:{mode:'navigate'}} as any)).toBe(true);
});
