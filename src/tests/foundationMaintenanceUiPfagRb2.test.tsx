// @vitest-environment happy-dom
import React,{act} from 'react';
import {createRoot} from 'react-dom/client';
import {describe,it,expect,vi,beforeEach,afterEach} from 'vitest';
import {ProjectMaintenancePanel} from '../components/wizard/ProjectMaintenancePanel';
import {ProjectOperationalReadiness} from '../components/wizard/ProjectOperationalReadiness';
import {projectCanonicalRefreshService} from '../services/projectCanonicalRefresh.service';
import * as commands from '../services/setupOrchestration.service';
vi.mock('../i18n',()=>({useI18n:()=>({t:(k:string)=>k,direction:'ltr'})}));
vi.mock('../firebase/config',()=>({auth:{currentUser:{getIdToken:async()=> 'TOKEN'}},db:{}}));
(globalThis as any).IS_REACT_ACT_ENVIRONMENT=true;
let host:HTMLDivElement,root:ReturnType<typeof createRoot>;
beforeEach(()=>{host=document.createElement('div');document.body.append(host);root=createRoot(host);});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();vi.restoreAllMocks();vi.unstubAllGlobals();});
const project:any={projectId:'P1',status:'ACTIVE',nameAr:'Project one',nameEn:'Project',clientName:'Client',description:'',version:0};
const ready=(value:boolean)=>({operational:{ready:value,blockers:value?[]:[{code:'NO_USABLE_PRICING'}]}});
const button=(key:string)=>Array.from(host.querySelectorAll('button')).find(b=>b.textContent===key)!;
describe('PFAG-RB2 rendered maintenance/readiness contracts',()=>{
 it.each([true,false])('ACTIVE is displayed separately from operational readiness %s',async value=>{await act(async()=>root.render(<ProjectMaintenancePanel project={project} canManage isCurrent={()=>true} apply={vi.fn()} readiness={ready(value)}/>));expect(host.textContent).toContain('rb2.project_status: ACTIVE');expect(host.textContent).toContain(value?'readiness.ready':'readiness.notReady');expect(button('rb2.suspend')).toBeDefined();});
 it('unprivileged reader sees state but no mutation controls',async()=>{await act(async()=>root.render(<ProjectMaintenancePanel project={project} canManage={false} isCurrent={()=>true} apply={vi.fn()} readiness={ready(false)}/>));expect(host.querySelector('button')).toBeNull();expect(host.textContent).toContain('readiness.notReady');});
 it('confirmed suspension followed by failed refresh retries refresh only',async()=>{const command=vi.spyOn(commands,'setupCommand').mockResolvedValue({newStatus:'SUSPENDED'});const refresh=vi.spyOn(projectCanonicalRefreshService,'refresh').mockRejectedValueOnce(Error('REFRESH_INCOHERENT')).mockResolvedValue({project:{...project,status:'SUSPENDED'},materials:[],carriers:[],fleetRows:[],relationshipContext:{}} as any);const apply=vi.fn();await act(async()=>root.render(<ProjectMaintenancePanel project={project} canManage isCurrent={()=>true} apply={apply} readiness={ready(true)}/>));await act(async()=>button('rb2.suspend').click());expect(host.textContent).toContain('rb2.refresh_pending');expect(command).toHaveBeenCalledTimes(1);expect(apply).not.toHaveBeenCalled();await act(async()=>button('setup.retry').click());expect(command).toHaveBeenCalledTimes(1);expect(refresh).toHaveBeenCalledTimes(2);expect(apply).toHaveBeenCalledTimes(1);});
 it('failed reactivation shows canonical blockers and never applies ACTIVE',async()=>{vi.spyOn(commands,'setupCommand').mockRejectedValue({code:'PROJECT_NOT_READY',blockers:[{code:'NO_USABLE_PRICING'}]});const apply=vi.fn();await act(async()=>root.render(<ProjectMaintenancePanel project={{...project,status:'SUSPENDED'}} canManage isCurrent={()=>true} apply={apply} readiness={ready(false)}/>));await act(async()=>button('rb2.reactivate').click());expect(host.textContent).toContain('readiness.notReady');expect(apply).not.toHaveBeenCalled();expect(host.textContent).toContain('SUSPENDED');});
 it('late readiness response for A cannot overwrite B readiness',async()=>{let release!:Function;vi.stubGlobal('fetch',vi.fn((url:string)=>url.includes('/P1/')?new Promise(resolve=>{release=()=>resolve({ok:true,json:async()=>({projectId:'P1',projectStatus:'ACTIVE',...ready(true)})});}):Promise.resolve({ok:true,json:async()=>({projectId:'P2',projectStatus:'SUSPENDED',...ready(false)})})));await act(async()=>root.render(<ProjectOperationalReadiness projectId="P1" status="ACTIVE"/>));await act(async()=>root.render(<ProjectOperationalReadiness projectId="P2" status="SUSPENDED"/>));await act(async()=>release());expect(host.textContent).toContain('SUSPENDED');expect(host.textContent).toContain('readiness.notReady');expect(host.textContent).not.toContain('readiness.ready');});
});
