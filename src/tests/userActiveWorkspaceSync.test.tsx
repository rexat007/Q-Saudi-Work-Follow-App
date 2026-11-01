// @vitest-environment happy-dom
import React,{act,StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {describe,it,expect,vi,beforeEach,afterEach} from 'vitest';
const f=vi.hoisted(()=>({auth:{currentUser:null as any},fetch:vi.fn(),grant:vi.fn()}));
vi.mock('../firebase/config',()=>({auth:f.auth,db:{}}));
vi.mock('../runtime/runtimeGeneration',()=>({CLIENT_BUILD_ID:'fixture',ensureRuntimeGeneration:async()=>{},assertRuntimeGeneration:()=>{}}));
vi.mock('../services/googleWorkspaceAuthorization',()=>({prepareWorkspaceGoogleAuthorization:async()=>{},requestWorkspaceGoogleToken:f.grant}));
import {useUserActiveWorkspaceSync} from '../hooks/useUserActiveWorkspaceSync';
import {clientWorkspaceService} from '../services/workspace.service';
const user={userId:'actor',role:'SUPER_ADMIN' as const,assignedProjectIds:[],displayName:'',email:''};
let root:ReturnType<typeof createRoot>,host:HTMLDivElement;
const response=()=>new Response(JSON.stringify({success:true,examined:2,eligible:1,attempted:1,delivered:1,skipped:1,deferred:0}),{status:200,headers:{'content-type':'application/json'}});
function Hook({context=user}: {context?:typeof user|null}){useUserActiveWorkspaceSync(context||undefined);return null;}
beforeEach(()=>{vi.clearAllMocks();vi.useFakeTimers();vi.setSystemTime(new Date('2026-11-01T00:00:00Z'));(globalThis as any).IS_REACT_ACT_ENVIRONMENT=true;f.auth.currentUser={uid:'actor',getIdToken:async()=> 'fixture-firebase'};vi.stubGlobal('fetch',f.fetch);f.fetch.mockImplementation(async()=>response());host=document.createElement('div');document.body.append(host);root=createRoot(host);});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();clientWorkspaceService.setAccessToken(null);vi.unstubAllGlobals();vi.restoreAllMocks();vi.useRealTimers();});
const render=async(context:typeof user|null=user)=>{await act(async()=>root.render(<Hook context={context}/>));};
const event=async(name:string,target:Window|Document=window)=>{await act(async()=>target.dispatchEvent(new Event(name)));};
const advance=()=>vi.advanceTimersByTime(61000);
describe('one global Firebase-only activity request',()=>{
 it('initial authenticated readiness sends one global request even with many assigned Projects and a stale browser Google token',async()=>{
  clientWorkspaceService.setAccessToken('private-stale-google');await render({...user,assignedProjectIds:Array.from({length:10},(_,i)=>'P'+i)});
  expect(f.fetch).toHaveBeenCalledOnce();const [url,init]=f.fetch.mock.calls[0];expect(url).toBe('/api/workspace/user-active-sync');expect(init).toMatchObject({method:'POST',body:'{}'});expect(init.headers.Authorization).toBe('Bearer fixture-firebase');expect(init.headers['X-Google-Access-Token']).toBeUndefined();expect(JSON.stringify(init)).not.toContain('private-stale-google');expect(f.grant).not.toHaveBeenCalled();
 });
 it('focus/online/visible triggers are throttled to one pass per minute',async()=>{
  await render();await event('focus');await event('online');expect(f.fetch).toHaveBeenCalledOnce();advance();await event('focus');expect(f.fetch).toHaveBeenCalledTimes(2);advance();await event('online');expect(f.fetch).toHaveBeenCalledTimes(3);advance();await event('visibilitychange',document);expect(f.fetch).toHaveBeenCalledTimes(4);
 });
 it('pointer and keyboard interaction never trigger requests, even after throttle expiry',async()=>{
  await render();advance();await event('pointerdown');await event('keydown');expect(f.fetch).toHaveBeenCalledOnce();
 });
 it('Project-array/scope changes are not execution authority',async()=>{
  await render({...user,assignedProjectIds:['P1']});advance();await render({...user,assignedProjectIds:['P2','P3']});expect(f.fetch).toHaveBeenCalledOnce();await event('focus');expect(f.fetch).toHaveBeenCalledTimes(2);expect(f.fetch.mock.calls.every(c=>c[1].body==='{}')).toBe(true);
 });
 it('offline and hidden tabs do not invoke the coordinator',async()=>{
  const online=vi.spyOn(navigator,'onLine','get').mockReturnValue(false),visibility=vi.spyOn(document,'visibilityState','get').mockReturnValue('hidden');await render();await event('focus');expect(f.fetch).not.toHaveBeenCalled();online.mockReturnValue(true);visibility.mockReturnValue('visible');await event('visibilitychange',document);expect(f.fetch).toHaveBeenCalledOnce();
 });
 it('multiple activity events cannot overlap an in-flight pass',async()=>{
  let complete!:(r:Response)=>void;f.fetch.mockReturnValueOnce(new Promise<Response>(yes=>complete=yes));await render();advance();await event('focus');await event('online');expect(f.fetch).toHaveBeenCalledOnce();await act(async()=>complete(response()));advance();await event('focus');expect(f.fetch).toHaveBeenCalledTimes(2);
 });
 it('logout removes listeners and later activity cannot start another pass',async()=>{
  await render();await render(null);advance();await event('focus');await event('online');await event('visibilitychange',document);expect(f.fetch).toHaveBeenCalledOnce();
 });
 it('non-administrative roles never invoke automatic Workspace execution',async()=>{
  await render({...user,role:'DISPATCHER' as any});await event('focus');expect(f.fetch).not.toHaveBeenCalled();
 });
 it('StrictMode preserves one initial request without duplicate effects',async()=>{
  await act(async()=>root.render(<StrictMode><Hook/></StrictMode>));expect(f.fetch).toHaveBeenCalledOnce();
 });
 it('host errors remain bounded and do not retrigger continuously or request Google consent',async()=>{
  f.fetch.mockResolvedValueOnce(new Response('',{status:503}));await render();await event('focus');expect(f.fetch).toHaveBeenCalledOnce();advance();await event('focus');expect(f.fetch).toHaveBeenCalledTimes(2);expect(f.grant).not.toHaveBeenCalled();
 });
});
