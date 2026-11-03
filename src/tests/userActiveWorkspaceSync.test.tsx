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
beforeEach(()=>{sessionStorage.clear();vi.clearAllMocks();vi.useFakeTimers();vi.setSystemTime(new Date('2026-11-01T00:00:00Z'));(globalThis as any).IS_REACT_ACT_ENVIRONMENT=true;f.auth.currentUser={uid:'actor',getIdToken:async()=> 'fixture-firebase'};vi.stubGlobal('fetch',f.fetch);f.fetch.mockImplementation(async()=>response());host=document.createElement('div');document.body.append(host);root=createRoot(host);});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();clientWorkspaceService.setAccessToken(null);vi.unstubAllGlobals();vi.restoreAllMocks();vi.useRealTimers();});
const render=async(context:typeof user|null=user)=>{await act(async()=>root.render(<Hook context={context}/>));};
const event=async(name:string,target:Window|Document=window)=>{await act(async()=>target.dispatchEvent(new Event(name)));};
const advance=()=>vi.advanceTimersByTime(61000);

describe('Client Trigger Retirement (USER_ACTIVE_GLOBAL_SYNC = RETIRED)',()=>{
 it('initial authenticated readiness generates 0 automatic global workspace sync requests',async()=>{
  clientWorkspaceService.setAccessToken('private-stale-google');await render({...user,assignedProjectIds:Array.from({length:10},(_,i)=>'P'+i)});
  expect(f.fetch).not.toHaveBeenCalled();
 });
 it('focus/online/visible triggers generate 0 automatic sync requests',async()=>{
  await render();await event('focus');await event('online');expect(f.fetch).not.toHaveBeenCalled();advance();await event('focus');expect(f.fetch).not.toHaveBeenCalled();advance();await event('online');expect(f.fetch).not.toHaveBeenCalled();advance();await event('visibilitychange',document);expect(f.fetch).not.toHaveBeenCalled();
 });
 it('pointer and keyboard interaction generate 0 automatic sync requests',async()=>{
  await render();advance();await event('pointerdown');await event('keydown');expect(f.fetch).not.toHaveBeenCalled();
 });
 it('Project-array/scope changes generate 0 automatic sync requests',async()=>{
  await render({...user,assignedProjectIds:['P1']});advance();await render({...user,assignedProjectIds:['P2','P3']});expect(f.fetch).not.toHaveBeenCalled();await event('focus');expect(f.fetch).not.toHaveBeenCalled();
 });
 it('offline and hidden tabs do not invoke fetch requests',async()=>{
  const online=vi.spyOn(navigator,'onLine','get').mockReturnValue(false),visibility=vi.spyOn(document,'visibilityState','get').mockReturnValue('hidden');await render();await event('focus');expect(f.fetch).not.toHaveBeenCalled();online.mockReturnValue(true);visibility.mockReturnValue('visible');await event('visibilitychange',document);expect(f.fetch).not.toHaveBeenCalled();
 });
 it('multiple activity events generate 0 automatic sync requests',async()=>{
  await render();advance();await event('focus');await event('online');expect(f.fetch).not.toHaveBeenCalled();advance();await event('focus');expect(f.fetch).not.toHaveBeenCalled();
 });
 it('logout removes listeners and activity generates 0 requests',async()=>{
  await render();await render(null);advance();await event('focus');await event('online');await event('visibilitychange',document);expect(f.fetch).not.toHaveBeenCalled();
 });
 it('non-administrative roles generate 0 requests',async()=>{
  await render({...user,role:'DISPATCHER' as any});await event('focus');expect(f.fetch).not.toHaveBeenCalled();
 });
 it('StrictMode preserves 0 requests without duplicate effects',async()=>{
  await act(async()=>root.render(<StrictMode><Hook/></StrictMode>));expect(f.fetch).not.toHaveBeenCalled();
 });
 it('AUTOMATIC_USER_ACTIVE_SYNC_POSTS is strictly 0 across user session lifetime',async()=>{
  await render();advance();await event('focus');expect(f.fetch).not.toHaveBeenCalled();
 });
});
