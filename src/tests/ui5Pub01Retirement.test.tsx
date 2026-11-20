// @vitest-environment happy-dom
import React, {act} from 'react';
import {createRoot, type Root} from 'react-dom/client';
import {beforeEach, afterEach, it, expect, vi} from 'vitest';

const f=vi.hoisted(()=>({uid:'actor',role:'SUPER_ADMIN',status:'ACTIVE',authority:'AVAILABLE',scope:['P1','P2'],
 token:vi.fn(),http:vi.fn(),read:vi.fn(),users:vi.fn(),remote:[] as any[],ack:null as null|Promise<void>}));
vi.mock('../firebase/config',()=>({auth:{get currentUser(){return {uid:f.uid,getIdToken:()=>f.token()};}},db:{}}));
vi.mock('../firebase/authContext',()=>({useAuth:()=>({user:{uid:f.uid},userProfile:{userId:f.uid,role:f.role,status:f.status,isActive:f.status==='ACTIVE',assignedProjectIds:f.scope},profileAuthority:f.authority,isProfileLoading:false})}));
vi.mock('../repositories/user.repository',()=>({userRepository:{listAll:()=>f.users(),findByIdFromServer:(id:string)=>f.read(id)}}));
vi.mock('../repositories/project.repository',()=>({projectRepository:{listAll:async()=>[{projectId:'P1',nameAr:'One'},{projectId:'P2',nameAr:'Two'}]}}));
vi.mock('../services/auditLog.service',()=>({auditLogService:{getRecentAuditLogs:async()=>[]}}));
// The production command client, token await, response parsing and orchestrator are NOT replaced.
vi.mock('../services/adminAccountClient.service',async original=>({...await original<any>(),listDriverIdentities:async()=>[{driverId:'D1',fullNameAr:'Synthetic driver',status:'ACTIVE'}]}));
vi.mock('../i18n',()=>({useI18n:()=>({t:(key:string)=>key,direction:'ltr',locale:'en'})}));
import {AdminConsoleView} from '../components/admin/AdminConsoleView';
(globalThis as any).IS_REACT_ACT_ENVIRONMENT=true;
const clone=<T,>(v:T):T=>structuredClone(v);
const deferred=<T,>()=>{let resolve!:(v:T)=>void,reject!:(e:unknown)=>void;const promise=new Promise<T>((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};
let host:HTMLDivElement,root:Root;
const render=()=>act(async()=>root.render(<AdminConsoleView/>));
const button=(name:string)=>Array.from(document.querySelectorAll<HTMLButtonElement>('button')).find(b=>b.textContent===name)!;
const click=async(name:string)=>{expect(button(name),name).toBeDefined();await act(async()=>button(name).click());};
const select=async(id='B')=>act(async()=>host.querySelector<HTMLButtonElement>(`[data-review-user="${id}"]`)!.click());
const change=async(element:HTMLSelectElement|HTMLTextAreaElement,value:string)=>act(async()=>{
 const proto=element instanceof HTMLSelectElement?HTMLSelectElement.prototype:HTMLTextAreaElement.prototype;
 Object.getOwnPropertyDescriptor(proto,'value')!.set!.call(element,value);
 element.dispatchEvent(new Event(element instanceof HTMLSelectElement?'change':'input',{bubbles:true}));
});
const commands=()=>f.http.mock.calls.map(([url,init])=>({target:decodeURIComponent(String(url).split('/')[4]),...JSON.parse(init.body)}));
const sequence=async()=>{
 await select();await change(host.querySelector<HTMLSelectElement>('select[aria-label="admin_console.role_assignment"]')!,'DRIVER');
 const label=Array.from(host.querySelectorAll('label')).find(l=>l.textContent?.includes('Two'))!;
 await act(async()=>label.querySelector<HTMLInputElement>('input')!.click());await click('admin_console.save_matrix');
};
const roundTrip=async(kind:string)=>{
 const old={uid:f.uid,role:f.role,status:f.status,authority:f.authority,scope:f.scope};
 if(kind==='actor')f.uid='other';else if(kind==='role')f.role='PROJECT_ADMIN';else if(kind==='authority')f.authority='UNAVAILABLE_TRANSIENT';else if(kind==='status')f.status='SUSPENDED';else f.scope=['P2'];
 await render();Object.assign(f,old);await render();
};
const noStale=()=>{
 expect(document.querySelector('[data-decision-status]')).toBeNull();
 expect(document.querySelector('[role="dialog"]')).toBeNull();
 expect(host.textContent).not.toContain('ui5.pending');
 expect(host.querySelector('[data-selected-user]')).toBeNull();
};
beforeEach(()=>{
 Object.assign(f,{uid:'actor',role:'SUPER_ADMIN',status:'ACTIVE',authority:'AVAILABLE',scope:['P1','P2'],ack:null});
 for(const mock of [f.token,f.http,f.read,f.users])mock.mockReset();f.token.mockResolvedValue('synthetic');
 f.remote=[{userId:'A',fullName:'Pending Alice',email:'alice@example.invalid',role:'VIEWER',requestedRole:'SUPERVISOR',assignedProjectIds:['P1'],status:'PENDING_APPROVAL',isActive:false},
 {userId:'B',fullName:'Active Bob',email:'bob@example.invalid',role:'VIEWER',assignedProjectIds:['P1'],status:'ACTIVE',isActive:true}];
 f.users.mockImplementation(async()=>clone(f.remote));f.read.mockImplementation(async(id:string)=>clone(f.remote.find(u=>u.userId===id)||null));
 f.http.mockImplementation(async(url:string,init:RequestInit)=>{
  const id=decodeURIComponent(url.split('/')[4]),c=JSON.parse(String(init.body)),row=f.remote.find(u=>u.userId===id);
  switch(c.command){
   case 'changeUserRole':row.role=c.newRole;if(c.newRole!=='DRIVER')delete row.linkedDriverId;break;
   case 'replaceAssignedProjects':row.assignedProjectIds=c.assignedProjectIds;break;
   case 'approveAccount':Object.assign(row,{role:c.approvedRole,assignedProjectIds:c.assignedProjectIds,status:'ACTIVE',isActive:true});break;
   case 'rejectAccount':Object.assign(row,{status:'REJECTED',isActive:false,rejectionReason:c.rejectionReason.trim()});break;
   case 'suspendAccount':Object.assign(row,{status:'SUSPENDED',isActive:false});break;
   case 'reactivateAccount':Object.assign(row,{status:'ACTIVE',isActive:true});break;
   case 'linkDriverIdentity':row.linkedDriverId=c.linkedDriverId;break;
   case 'unlinkDriverIdentity':delete row.linkedDriverId;
  }
  if(f.ack)await f.ack;
  return {ok:true,json:async()=>({success:true,user:{userId:id}})};
 });
 vi.stubGlobal('fetch',f.http);host=document.createElement('div');document.body.append(host);root=createRoot(host);
});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();vi.unstubAllGlobals();});

for(const kind of ['role','actor','authority','status','projects']){
 it(`${kind} A-B-A during token await sends zero HTTP commands`,async()=>{
  await render();const pending=deferred<string>();f.token.mockReturnValueOnce(pending.promise);await sequence();
  expect(commands()).toEqual([]);await roundTrip(kind);await act(async()=>pending.resolve('old-token'));
  expect(commands()).toEqual([]);expect(f.read).not.toHaveBeenCalled();noStale();
  // New current work has a new lease and is usable; the old project draft did not survive.
  await select();expect(host.querySelector<HTMLSelectElement>('select[aria-label="admin_console.role_assignment"]')!.value).toBe('VIEWER');
  expect(button('admin_console.save_matrix').disabled).toBe(false);
 });
 it(`${kind} A-B-A during server readback sends zero subsequent project HTTP commands`,async()=>{
  await render();const pending=deferred<any>();f.read.mockReturnValueOnce(pending.promise);await sequence();
  expect(commands().map(c=>c.command)).toEqual(['changeUserRole']);await roundTrip(kind);
  await act(async()=>pending.resolve(clone(f.remote[1])));
  expect(commands().filter(c=>c.command==='replaceAssignedProjects')).toHaveLength(0);
  expect(commands().map(c=>c.command)).toEqual(['changeUserRole']);noStale();
  expect(f.remote[1]).toMatchObject({role:'DRIVER',assignedProjectIds:['P1']});
 });
}
for(const kind of ['role','actor'])it(`${kind} A-B-A during transmitted ACK never sends step two or fabricates cancellation`,async()=>{
 await render();const pending=deferred<void>();f.ack=pending.promise;await sequence();
 expect(commands().map(c=>c.command)).toEqual(['changeUserRole']);await roundTrip(kind);
 await act(async()=>pending.resolve());expect(commands().map(c=>c.command)).toEqual(['changeUserRole']);
 expect(f.read).not.toHaveBeenCalled();expect(f.remote[1].role).toBe('DRIVER');noStale();
});
for(const phase of ['token','readback'])it(`target X-Y-X during ${phase} never revives the old operation`,async()=>{
 await render();const token=deferred<string>(),read=deferred<any>();
 if(phase==='token')f.token.mockReturnValueOnce(token.promise);else f.read.mockReturnValueOnce(read.promise);
 await sequence();const before=commands().length;
 await click('admin_console.tab_users');await select('A');await click('admin_console.tab_users');await select('B');
 await act(async()=>{if(phase==='token')token.resolve('old');else read.resolve(clone(f.remote[1]));});
 expect(commands()).toHaveLength(before);expect(commands().filter(c=>c.command==='replaceAssignedProjects')).toHaveLength(0);
 expect(document.querySelector('[data-decision-status]')).toBeNull();
 // The retired read must not replace the retained pre-command view with its late result.
 expect(host.querySelector<HTMLSelectElement>('select[aria-label="admin_console.role_assignment"]')!.value).toBe('VIEWER');
 expect(f.remote[1].role).toBe(phase==='token'?'VIEWER':'DRIVER');
 expect(button('admin_console.save_matrix').disabled).toBe(false);
});
for(const phase of ['token','ack','readback'])it(`unmount/remount permanently retires ${phase} work`,async()=>{
 await render();const token=deferred<string>(),ack=deferred<void>(),read=deferred<any>();
 if(phase==='token')f.token.mockReturnValueOnce(token.promise);else if(phase==='ack')f.ack=ack.promise;else f.read.mockReturnValueOnce(read.promise);
 await sequence();const before=commands().length;
 await act(async()=>root.unmount());root=createRoot(host);await render();
 await act(async()=>{if(phase==='token')token.resolve('old');else if(phase==='ack')ack.resolve();else read.resolve(clone(f.remote[1]));});
 expect(commands()).toHaveLength(before);expect(commands().filter(c=>c.command==='replaceAssignedProjects')).toHaveLength(0);noStale();
});
it('uninterrupted real client runs role/read/project/read once each and blocks duplicate clicks',async()=>{
 await render();const token=deferred<string>();f.token.mockReturnValueOnce(token.promise);await sequence();
 await act(async()=>{button('admin_console.save_matrix').click();button('admin_console.save_matrix').click();});
 expect(f.token).toHaveBeenCalledTimes(1);expect(commands()).toEqual([]);
 await act(async()=>token.resolve('current-token'));
 expect(commands().map(c=>c.command)).toEqual(['changeUserRole','replaceAssignedProjects']);
 expect(commands().map(c=>c.target)).toEqual(['B','B']);expect(f.read).toHaveBeenCalledTimes(2);
 expect(document.querySelector('[data-decision-status="confirmed"]')).not.toBeNull();
 expect(f.remote[1]).toMatchObject({role:'DRIVER',assignedProjectIds:['P1','P2']});
});
for(const command of ['approveAccount','rejectAccount','suspendAccount','reactivateAccount','linkDriverIdentity','unlinkDriverIdentity'])it(`${command}: retired token cannot reach the HTTP command boundary`,async()=>{
 if(command==='reactivateAccount')f.remote[1].status='SUSPENDED';
 if(command.includes('DriverIdentity'))Object.assign(f.remote[1],{role:'DRIVER',linkedDriverId:command==='unlinkDriverIdentity'?'D1':undefined});
 await render();const pending=deferred<string>();f.token.mockReturnValueOnce(pending.promise);
 if(command==='approveAccount'){await click('admin_console.btn_approve');await click('admin_console.approve_activate_user');}
 else if(command==='rejectAccount'){await click('admin_console.btn_reject');await change(document.querySelector<HTMLTextAreaElement>('textarea')!,'Synthetic reason');await click('admin_console.confirm_reject_account');}
 else if(command==='suspendAccount')await click('admin_console.btn_suspend');
 else if(command==='reactivateAccount')await click('admin_console.btn_reactivate');
 else {await select();if(command==='linkDriverIdentity')await change(host.querySelector<HTMLSelectElement>('select[aria-label="admin_console.driver_binding"]')!,'D1');await click(command==='linkDriverIdentity'?'admin_console.driver_link':'admin_console.driver_unlink');}
 expect(commands()).toEqual([]);await roundTrip('role');await act(async()=>pending.resolve('old'));
 expect(commands()).toEqual([]);expect(f.read).not.toHaveBeenCalled();noStale();
});
it('a late transport error after retirement publishes neither warning nor uncertain state',async()=>{
 await render();const pending=deferred<void>();f.ack=pending.promise;await sequence();await roundTrip('role');
 await act(async()=>pending.reject(Error('synthetic unknown transmitted outcome')));
 expect(commands().map(c=>c.command)).toEqual(['changeUserRole']);noStale();expect(host.textContent).not.toContain('admin_console.errors.failed');
});
it('late source reads cannot overwrite the restored authorization generation',async()=>{
 const pending=deferred<any[]>();f.users.mockReturnValueOnce(pending.promise);await render();await roundTrip('role');
 await act(async()=>pending.resolve([{...f.remote[1],fullName:'STALE_SOURCE'}]));
 expect(host.textContent).not.toContain('STALE_SOURCE');expect(host.textContent).toContain('Pending Alice');expect(commands()).toEqual([]);
});
it('StrictMode effect replay creates a fresh live lease without reviving the cleaned-up effect',async()=>{
 const pending=deferred<any[]>();f.users.mockReturnValueOnce(pending.promise);
 await act(async()=>root.render(<React.StrictMode><AdminConsoleView/></React.StrictMode>));
 await act(async()=>pending.resolve([{...f.remote[1],fullName:'RETIRED_STRICT_EFFECT'}]));
 expect(host.textContent).not.toContain('RETIRED_STRICT_EFFECT');await sequence();
 expect(commands().map(c=>c.command)).toEqual(['changeUserRole','replaceAssignedProjects']);
 expect(document.querySelector('[data-decision-status="confirmed"]')).not.toBeNull();
});
