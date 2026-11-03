// @vitest-environment happy-dom
import React,{act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {it,expect,vi,beforeEach,afterEach} from 'vitest';
import type {ImportSessionRecord} from '../types/importSession';
import {ProjectSetupWizard} from '../components/wizard/ProjectSetupWizard';
import {importSessionClientService as client} from '../services/importSessionClient.service';
import {ImportSessionServerService} from '../services/importSession.server';
import {RosterExecutionServer} from '../services/import/rosterExecution.server';
import {ProjectFleetQueryService} from '../services/projectFleetQuery.server';
import {projectCanonicalRefreshService} from '../services/projectCanonicalRefresh.service';
import {canonicalRelationshipContextService} from '../services/canonicalRelationshipContext.service';
import {commandDatabase,accountProfile} from './helpers/commandDatabase';
import {GLOBAL_IDENTITIES} from '../utils/globalIdentityPolicy';
vi.mock('../firebase/config',()=>({auth:{currentUser:{uid:'actor',getIdToken:async()=> 'fixture'}},db:{}}));
vi.mock('../firebase/admin',()=>({adminDb:{}}));
vi.mock('../i18n',()=>({useI18n:()=>({t:(key:string)=>key,direction:'ltr',locale:'en'})}));
vi.mock('../repositories/pricingRule.repository',()=>({pricingRuleRepository:{subscribeByProject:vi.fn(()=>vi.fn())}}));
(globalThis as any).IS_REACT_ACT_ENVIRONMENT=true;
const actor:any={userId:'actor',role:'SUPER_ADMIN',assignedProjectIds:['P1','P2']};
const project:any={projectId:'P1',projectCode:'P1',projectNumber:1,nameAr:'Fixture',nameEn:'Fixture',clientName:'Client',status:'SETUP',settings:{},location:{},version:1};
let host:HTMLDivElement,root:Root,env:ReturnType<typeof commandDatabase>,sessions:ImportSessionServerService,execution:RosterExecutionServer;
let failCheckpoint=false,source='Carrier,Registration,Driver,Identity,Truck\nC1,1010123456,Driver,1234567890,ABC123';
function seed(){const s:Record<string,any>={'users/actor':accountProfile(),'projects/P1':project};for(const [kind,id,name,natural] of [['CARRIER','C1','Carrier','1010123456'],['MATERIAL','M1','Wheat','WHEAT'],['DRIVER','D1','Driver','1234567890'],['TRUCK','T1','ABC123','ABC123']] as const){const spec=GLOBAL_IDENTITIES[kind];s[`${spec.collection}/${id}`]={[spec.id]:id,[spec.natural]:natural,status:'ACTIVE',...(kind==='DRIVER'?{fullNameAr:name,phone:''}:kind==='TRUCK'?{plate:name}:{nameAr:name})};s[`projects/P1/${spec.kind}_memberships/${id}`]={[spec.id]:id,projectId:'P1',status:'ACTIVE'};if(kind==='DRIVER'||kind==='TRUCK')s[`projects/P1/${spec.kind}_carrier_affiliations/${id}`]={[spec.id]:id,projectId:'P1',carrierId:'C1',status:'ACTIVE'};}return s;}
beforeEach(()=>{
 host=document.createElement('div');document.body.append(host);root=createRoot(host);env=commandDatabase(seed());sessions=new ImportSessionServerService(env.db);execution=new RosterExecutionServer(env.db,1);failCheckpoint=false;
 const query=new ProjectFleetQueryService(env.db);
 vi.spyOn(canonicalRelationshipContextService,'getProjectRelationshipContext').mockImplementation(p=>query.context(p,actor,{resolution:true}));
 vi.spyOn(projectCanonicalRefreshService,'refresh').mockImplementation(async p=>({project,setup:{projectId:p,participants:[],fleet:{rows:[]}} as any,materials:[],carriers:[],fleetRows:[],relationshipContext:await query.context(p,actor,{resolution:true})}));
 vi.spyOn(client,'listResumableSessions').mockImplementation(async()=>Object.keys(env.store).filter(p=>/^projects\/P1\/importSessions\/[^/]+$/.test(p)).map(p=>structuredClone(env.store[p])));
 vi.spyOn(client,'createSession').mockImplementation((p,payload)=>sessions.createSession(p,payload,actor));
 vi.spyOn(client,'getSession').mockImplementation(async(p,s)=>await sessions.getSession(p,s,actor) as ImportSessionRecord);
 vi.spyOn(client,'updateCheckpoint').mockImplementation((p,s,updates,v)=>{if(failCheckpoint){failCheckpoint=false;return Promise.reject(Error('offline'));}return sessions.updateCheckpoint(p,s,updates,{expectedVersion:v},actor);});
 vi.spyOn(client,'commitReviewedIntent').mockImplementation((p,s,v)=>execution.requestCommit(p,s,{expectedVersion:v},actor));
 vi.spyOn(client,'getExecutionStatus').mockImplementation((p,s)=>execution.status(p,s,actor));
 vi.spyOn(client,'retryExecution').mockImplementation((p,s,v)=>execution.advance(p,s,v,actor));
 vi.spyOn(client,'cancelExecution').mockImplementation((p,s,v)=>execution.cancel(p,s,v,actor));
 vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,json:async()=>({success:true,data:{projectId:'P1',participants:[],fleet:{rows:[]}},ready:false,blockers:[]})})));
 vi.stubGlobal('FileReader',class{onload:any;onerror:any;onabort:any;readAsArrayBuffer(){queueMicrotask(()=>this.onload?.({target:{result:new TextEncoder().encode(source).buffer}}));}});
 vi.stubGlobal('alert',vi.fn(()=>{throw Error('native alert forbidden');}));vi.stubGlobal('confirm',vi.fn(()=>{throw Error('native confirm forbidden');}));
});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();vi.restoreAllMocks();vi.unstubAllGlobals();});
const button=(key:string)=>Array.from(document.querySelectorAll<HTMLButtonElement>('button')).find(b=>b.textContent?.trim()===key)!;
async function click(key:string){const b=button(key);if(!b)throw Error('Missing '+key+'; buttons='+Array.from(document.querySelectorAll('button')).map(b=>b.textContent).join('|'));if(b.disabled)throw Error('Disabled '+key);await act(async()=>{b.click();});}
async function open(){await act(async()=>root.render(<ProjectSetupWizard selectedProjectId="P1" projects={[project]} authContext={actor}/>));await act(async()=>{Array.from(host.querySelectorAll('button')).find(b=>b.textContent?.includes('projects.batch4.layer_roster'))!.click();});await click('projects.batch4.import_file');}
async function upload(){const input=document.querySelector<HTMLInputElement>('input[type=file]')!;Object.defineProperty(input,'files',{configurable:true,value:[new File(['fixture'],'roster.csv')]});await act(async()=>input.dispatchEvent(new Event('change',{bubbles:true})));}
const saved=()=>Object.entries(env.store).find(([p])=>/^projects\/P1\/importSessions\/[^/]+$/.test(p))![1];
async function mapping(){await open();await upload();await act(async()=>{await vi.waitFor(()=>expect(saved().lifecycleState).toBe('DISCOVERED'));});const selects=Array.from(document.querySelectorAll<HTMLSelectElement>('table select'));const targets=['carrierName','unmapped','driverName','driverIdentity','truckPlate'];for(let n=0;n<targets.length;n++)await act(async()=>{selects[n].value=targets[n];selects[n].dispatchEvent(new Event('change',{bubbles:true}));});await click('projects.labels.approve_mapping_analyze_log');}
async function review(){await mapping();expect(saved().rosterStage).toBe('CARRIER_RESOLUTION');await click('entityResolution.labels.continue_material_review');expect(saved().rosterStage).toBe('MATERIAL_RESOLUTION');expect(button('entityResolution.labels.continue_driver_truck_review')).toBeUndefined();await click('import.material.confirm');expect((await sessions.getSession('P1',saved().importSessionId,actor) as any).importBatch.metadata.batchMaterialBinding).toEqual({materialId:'M1',provenance:'PROJECT_IMPORT_SELECTION',confirmed:true});await click('entityResolution.labels.continue_driver_truck_review');expect(saved().rosterStage).toBe('DRIVER_TRUCK_RESOLUTION');await click('entityResolution.labels.continue_final_review');expect(saved().rosterStage).toBe('FINAL_REVIEW');}
it('actual Wizard → parser → durable checkpoints → reviewed server executor → terminal result completes once',async()=>{
 await review();await click('intent.accept');expect(saved().lifecycleState).toBe('INTENT_REVIEWED');const commit=button('entityResolution.labels.approve_commit_import');expect(commit).toBeDefined();await act(async()=>{commit.click();commit.click();});expect(client.commitReviewedIntent).toHaveBeenCalledOnce();expect(saved().lifecycleState).toBe('COMMITTED');expect(document.body.textContent).toContain('import.recovery.COMPLETED');expect(saved().rosterStage).toBe('COMMIT_RESULT');expect(window.alert).not.toHaveBeenCalled();expect(window.confirm).not.toHaveBeenCalled();await click('entityResolution.labels.finish_import');expect(document.querySelector('[data-import-overlay]')).toBeNull();expect(env.store['drivers/D1']).toBeDefined();expect(Object.keys(env.store).filter(p=>p.includes('/receipts/'))).toHaveLength(1);expect(Object.entries(env.store).some(([p,v])=>p.includes('/truck_material_allocations/')&&v.materialId==='M1'&&v.truckId==='T1')).toBe(true);
});
it('failed stage checkpoint stays on the old stage with actionable retry and no stuck busy owner',async()=>{await mapping();failCheckpoint=true;await click('entityResolution.labels.continue_material_review');expect(saved().rosterStage).toBe('CARRIER_RESOLUTION');expect(document.body.textContent).toContain('projects.batch4.checkpoint_persistence_failed');expect(button('shared.error_boundary.retry').disabled).toBe(false);await click('shared.error_boundary.retry');expect(saved().rosterStage).toBe('MATERIAL_RESOLUTION');expect(button('entityResolution.labels.continue_driver_truck_review')).toBeUndefined();await click('import.material.confirm');expect(button('entityResolution.labels.continue_driver_truck_review').disabled).toBe(false);});
it('owned cancellation requires confirmation and server ACK before local clearing',async()=>{await mapping();await click('entityResolution.labels.cancel_import');expect(document.querySelector('[data-import-overlay="CONFIRMATION"]')).not.toBeNull();expect(saved().lifecycleState).toBe('RESOLUTION');await click('shared.actions.cancel');expect(saved().lifecycleState).toBe('RESOLUTION');await click('entityResolution.labels.cancel_import');await click('shared.actions.confirm');expect(saved().lifecycleState).toBe('CANCELLED');expect(document.querySelector('[data-import-overlay]')).toBeNull();});
it('checkpoint ACK followed by failed canonical readback retries reads without replaying that checkpoint',async()=>{
 await mapping();failCheckpoint=true;await click('entityResolution.labels.continue_material_review');
 vi.mocked(canonicalRelationshipContextService.getProjectRelationshipContext).mockRejectedValueOnce(Error('offline'));
 await click('shared.error_boundary.retry');expect(saved().rosterStage).toBe('MATERIAL_RESOLUTION');const writes=vi.mocked(client.updateCheckpoint).mock.calls.length;
 expect(button('shared.error_boundary.retry')).toBeDefined();await click('shared.error_boundary.retry');expect(client.updateCheckpoint).toHaveBeenCalledTimes(writes);expect(button('entityResolution.labels.continue_driver_truck_review')).toBeUndefined();await click('import.material.confirm');expect(button('entityResolution.labels.continue_driver_truck_review').disabled).toBe(false);
});
it('failed cancellation preserves the session and offers exact-command retry before clearing',async()=>{
 await mapping();failCheckpoint=true;await click('entityResolution.labels.cancel_import');await click('shared.actions.confirm');expect(saved().lifecycleState).toBe('RESOLUTION');expect(document.querySelector('[data-import-overlay="WORKFLOW"]')).not.toBeNull();await click('shared.error_boundary.retry');expect(saved().lifecycleState).toBe('CANCELLED');expect(document.querySelector('[data-import-overlay]')).toBeNull();
});
it('actual remount restores the durable resolution stage without source bytes or a changed reviewed meaning',async()=>{
 await mapping();const before=structuredClone(saved());await act(async()=>root.unmount());root=createRoot(host);
 await act(async()=>root.render(<ProjectSetupWizard selectedProjectId="P1" projects={[project]} authContext={actor}/>));await act(async()=>Array.from(host.querySelectorAll('button')).find(b=>b.textContent?.includes('projects.batch4.layer_roster'))!.click());
 expect(document.querySelector('[data-import-overlay="WORKFLOW"]')).not.toBeNull();expect(button('entityResolution.labels.continue_material_review')).toBeDefined();expect(saved()).toEqual(before);expect(client.createSession).toHaveBeenCalledOnce();
});
it('incomplete coherent Fleet context reports a bounded read failure rather than a parent revision reload loop',async()=>{
 vi.mocked(projectCanonicalRefreshService.refresh).mockImplementation(async()=>({materials:[],carriers:[],fleetRows:[],relationshipContext:{} as any}));
 await open();expect(vi.mocked(projectCanonicalRefreshService.refresh).mock.calls.length).toBeLessThan(10);expect(document.body.textContent).toContain('setup.errors.read');expect(document.querySelector('[data-import-overlay="WORKFLOW"]')).not.toBeNull();
});
it('checkpoint version conflict fences writes and exposes explicit authoritative reload',async()=>{
 await mapping();const before=structuredClone(saved());vi.mocked(client.updateCheckpoint).mockRejectedValueOnce(Object.assign(Error('VERSION_CONFLICT'),{code:'VERSION_CONFLICT'}));await click('entityResolution.labels.continue_material_review');expect(saved()).toEqual(before);expect(document.body.textContent).toContain('projects.batch4.import_version_conflict');expect(button('shared.error_boundary.reload')).toBeDefined();expect(button('entityResolution.labels.approve_commit_import')).toBeUndefined();
});
it('pending stage completion cannot overwrite a confirmed cancellation',async()=>{
 await mapping();let resolve!:(value:any)=>void;vi.mocked(client.updateCheckpoint).mockReturnValueOnce(new Promise(r=>resolve=r));
 await click('entityResolution.labels.continue_material_review');const close=document.querySelector<HTMLButtonElement>('[data-import-overlay="WORKFLOW"] button')!;await act(async()=>close.click());await click('shared.actions.confirm');expect(saved().lifecycleState).toBe('CANCELLED');
 await act(async()=>resolve({...saved(),lifecycleState:'RESOLUTION',rosterStage:'MATERIAL_RESOLUTION'}));expect(saved().lifecycleState).toBe('CANCELLED');expect(document.querySelector('[data-import-overlay]')).toBeNull();
});
it('network authority retirement and reconnect retain the same durable session, material selection and stage',async()=>{
 await review();const id=saved().importSessionId,count=Object.keys(env.store).filter(p=>/^projects\/P1\/importSessions\/[^/]+$/.test(p)).length;
 await act(async()=>window.dispatchEvent(new CustomEvent('auth-authority-change',{detail:'UNAVAILABLE_TRANSIENT'})));
 expect(document.querySelector('[data-import-overlay="WORKFLOW"]')).not.toBeNull();
 await act(async()=>window.dispatchEvent(new CustomEvent('auth-authority-change',{detail:'AVAILABLE'})));
 expect(saved().importSessionId).toBe(id);expect(saved().rosterStage).toBe('FINAL_REVIEW');expect(Object.keys(env.store).filter(p=>/^projects\/P1\/importSessions\/[^/]+$/.test(p))).toHaveLength(count);
 const hydrated=await sessions.getSession('P1',id,actor) as any;expect(hydrated.importBatch.metadata.batchMaterialBinding.materialId).toBe('M1');expect(client.commitReviewedIntent).not.toHaveBeenCalled();expect(button('intent.accept').disabled).toBe(false);
});
it('late checkpoint response after authority interruption cannot leave busy UI or overwrite reconnect truth',async()=>{
 await mapping();let release!:()=>void;const update=vi.mocked(client.updateCheckpoint).getMockImplementation()!;
 vi.mocked(client.updateCheckpoint).mockImplementationOnce(async(...args:any[])=>{const saved=await (update as any)(...args);await new Promise<void>(r=>release=r);return saved;});
 await act(async()=>{button('entityResolution.labels.continue_material_review').click();await vi.waitFor(()=>expect(release).toBeTypeOf('function'));});
 const id=saved().importSessionId;await act(async()=>window.dispatchEvent(new CustomEvent('auth-authority-change',{detail:'UNAVAILABLE_TRANSIENT'})));
 await act(async()=>{release();});await act(async()=>window.dispatchEvent(new CustomEvent('auth-authority-change',{detail:'AVAILABLE'})));
 expect(saved().importSessionId).toBe(id);expect(saved().rosterStage).toBe('MATERIAL_RESOLUTION');expect(button('import.material.confirm').disabled).toBe(false);expect(client.createSession).toHaveBeenCalledOnce();
});
it('lost successful checkpoint reply is adopted on reconnect without replay or a permanently pending commit gate',async()=>{
 await mapping();const update=vi.mocked(client.updateCheckpoint).getMockImplementation()!;
 vi.mocked(client.updateCheckpoint).mockImplementationOnce(async(...args:any[])=>{await (update as any)(...args);throw Error('network response lost');});
 await click('entityResolution.labels.continue_material_review');expect(saved().rosterStage).toBe('MATERIAL_RESOLUTION');
 await act(async()=>window.dispatchEvent(new CustomEvent('auth-authority-change',{detail:'UNAVAILABLE_TRANSIENT'})));
 await act(async()=>window.dispatchEvent(new CustomEvent('auth-authority-change',{detail:'AVAILABLE'})));
 expect(saved().rosterStage).toBe('MATERIAL_RESOLUTION');await click('import.material.confirm');await click('entityResolution.labels.continue_driver_truck_review');await click('entityResolution.labels.continue_final_review');await click('intent.accept');await click('entityResolution.labels.approve_commit_import');expect(client.commitReviewedIntent).toHaveBeenCalledOnce();expect(saved().lifecycleState).toBe('COMMITTED');
});
it('legacy resumed Driver/Truck stage without Material can return to explicit selection without replacing the session or completed identities',async()=>{
 await mapping();const id=saved().importSessionId;await sessions.updateCheckpoint('P1',id,{lifecycleState:'RESOLUTION',rosterStage:'MATERIAL_RESOLUTION',currentStage:'MATERIAL_RESOLUTION'},{expectedVersion:saved().version},actor);await sessions.updateCheckpoint('P1',id,{lifecycleState:'RESOLUTION',rosterStage:'DRIVER_TRUCK_RESOLUTION',currentStage:'DRIVER_TRUCK_RESOLUTION'},{expectedVersion:saved().version},actor);
 await act(async()=>root.unmount());root=createRoot(host);await act(async()=>root.render(<ProjectSetupWizard selectedProjectId="P1" projects={[project]} authContext={actor}/>));
 await act(async()=>{Array.from(host.querySelectorAll('button')).find(b=>b.textContent?.includes('projects.batch4.layer_roster'))!.click();});expect(saved().rosterStage).toBe('DRIVER_TRUCK_RESOLUTION');await click('entityResolution.labels.continue_material_review');expect(saved().importSessionId).toBe(id);expect(saved().rosterStage).toBe('MATERIAL_RESOLUTION');await click('import.material.confirm');await click('entityResolution.labels.continue_driver_truck_review');expect(saved().importSessionId).toBe(id);expect(saved().rosterStage).toBe('DRIVER_TRUCK_RESOLUTION');expect(client.createSession).toHaveBeenCalledOnce();
});
