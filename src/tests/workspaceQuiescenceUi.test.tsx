// @vitest-environment happy-dom
import React,{act} from 'react';
import {createRoot, type Root} from 'react-dom/client';
import {it,expect,vi,beforeEach,afterEach} from 'vitest';
const f=vi.hoisted(()=>({activity:vi.fn(async()=>{})}));
vi.mock('../services/workspace.service',()=>({clientWorkspaceService:{requestUserActiveWorkspaceSync:f.activity}}));
import {WorkspaceEnsurePanel} from '../components/wizard/WorkspaceEnsurePanel';
import {useUserActiveWorkspaceSync} from '../hooks/useUserActiveWorkspaceSync';
import {runWorkspaceEnsureJourney} from '../utils/workspaceEnsureJourney';
import {rememberWorkspaceContinuation} from '../runtime/workspaceProvisioningResume';
const user={userId:'quiet-actor',role:'SUPER_ADMIN',assignedProjectIds:[],email:'',displayName:''} as const;
const status=(state:string,canResume=false)=>({state,operationId:'a'.repeat(64),phase:state==='READY'?'READY':'WORKBOOK',completed:state==='READY'?['READY']:[],canResume,retryable:false,actionRequired:null} as any);
let host:HTMLDivElement,root:Root;
beforeEach(()=>{sessionStorage.clear();vi.clearAllMocks();vi.useFakeTimers();vi.setSystemTime(new Date('2026-11-03'));(globalThis as any).IS_REACT_ACT_ENVIRONMENT=true;host=document.createElement('div');document.body.append(host);root=createRoot(host);});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();vi.restoreAllMocks();vi.useRealTimers();});
const client=()=>({observeWorkspaceProvisioning:vi.fn(async()=>status('READY')),ensureWorkspace:vi.fn(async()=>status('READY')),connectBackgroundAuthorization:vi.fn(async()=>{})});
function Harness({port}:{port:ReturnType<typeof client>}){useUserActiveWorkspaceSync(user as any);return <WorkspaceEnsurePanel projectId="P1" actorId={user.userId} service={port} t={key=>key}/>;}
it('READY remains quiescent across timer intervals, focus/online/visibility, rerender and real remount',async()=>{
 const port=client();rememberWorkspaceContinuation(user.userId,'P1','a'.repeat(64));await act(async()=>root.render(<Harness port={port}/>));await act(async()=>vi.advanceTimersByTimeAsync(300000));for(const event of ['focus','online'])await act(async()=>window.dispatchEvent(new Event(event)));await act(async()=>document.dispatchEvent(new Event('visibilitychange')));await act(async()=>root.render(<Harness port={port}/>));await act(async()=>root.unmount());root=createRoot(host);await act(async()=>root.render(<Harness port={port}/>));expect(port.ensureWorkspace).not.toHaveBeenCalled();expect(port.connectBackgroundAuthorization).not.toHaveBeenCalled();expect(f.activity).not.toHaveBeenCalled();expect(host.textContent).toContain('gws.one.ready');
});
it('unchanged PREPARING/canResume cannot trigger recursive POST or restart after remount',async()=>{
 const port=client();port.observeWorkspaceProvisioning.mockResolvedValue(status('PREPARING',true));port.ensureWorkspace.mockResolvedValue(status('PREPARING',true));await act(async()=>root.render(<Harness port={port}/>));expect(port.ensureWorkspace).toHaveBeenCalledOnce();await act(async()=>vi.advanceTimersByTimeAsync(300000));await act(async()=>root.unmount());root=createRoot(host);await act(async()=>root.render(<Harness port={port}/>));expect(port.ensureWorkspace).toHaveBeenCalledOnce();await act(async()=>host.querySelector('button')!.click());expect(port.ensureWorkspace).toHaveBeenCalledTimes(2);
});
it('active observation is serialized, read-only and stops at READY',async()=>{
 const port=client();let resolve!:(value:any)=>void;port.observeWorkspaceProvisioning.mockImplementationOnce(()=>new Promise(r=>resolve=r));await act(async()=>root.render(<Harness port={port}/>));await act(async()=>vi.advanceTimersByTimeAsync(10000));expect(port.observeWorkspaceProvisioning).toHaveBeenCalledOnce();await act(async()=>resolve(status('PREPARING')));await act(async()=>vi.advanceTimersByTimeAsync(2000));expect(port.observeWorkspaceProvisioning).toHaveBeenCalledTimes(2);await act(async()=>vi.advanceTimersByTimeAsync(300000));expect(port.observeWorkspaceProvisioning).toHaveBeenCalledTimes(2);expect(port.ensureWorkspace).not.toHaveBeenCalled();
});
it('newly observed interrupted ownership resumes once; another resumable response requires action',async()=>{const port=client();port.ensureWorkspace.mockResolvedValueOnce(status('PREPARING')).mockResolvedValue(status('PREPARING',true));port.observeWorkspaceProvisioning.mockResolvedValue(status('PREPARING',true));const wait=vi.fn(async()=>{});const value=await runWorkspaceEnsureJourney('P1',port,()=>true,()=>{},wait);expect(value.state).toBe('PREPARING');expect(port.ensureWorkspace).toHaveBeenCalledTimes(2);expect(wait).toHaveBeenCalledOnce();});
it('real hook remounts share the minute throttle rather than restarting an activity pass',async()=>{const port=client();await act(async()=>root.render(<Harness port={port}/>));for(let n=0;n<6;n++){await act(async()=>root.unmount());root=createRoot(host);await act(async()=>root.render(<Harness port={port}/>));}expect(f.activity).not.toHaveBeenCalled();await act(async()=>vi.advanceTimersByTimeAsync(61000));await act(async()=>window.dispatchEvent(new Event('online')));expect(f.activity).not.toHaveBeenCalled();});
