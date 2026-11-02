// @vitest-environment happy-dom
import React,{act,useState} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {beforeEach,afterEach,it,expect,vi} from 'vitest';
import {ImportOverlay,IMPORT_OVERLAY_LEVEL} from '../components/import/ImportOverlay';
import {ContextualCanonicalCreation} from '../components/import/ContextualCanonicalCreation';
import {useImportConfirmation} from '../components/import/ImportConfirmation';
import {ContextualPrerequisiteReceipts} from '../services/import/contextualCanonicalCreation.service';
import {RosterBatchReviewService} from '../services/import/rosterBatchReview.service';
import {canonicalRelationshipContextService} from '../services/canonicalRelationshipContext.service';
import {projectCanonicalRefreshService} from '../services/projectCanonicalRefresh.service';
import {carrierManagementClientService} from '../services/carrierManagementClient.service';
import {materialManagementClientService} from '../services/materialManagementClient.service';
import {entityResolutionCommandService} from '../services/import/entityResolutionCommand.service';
import {CanonicalResolutionDecision} from '../components/import/CanonicalResolutionDecision';
import {RosterCarrierResolutionLayer} from '../components/import/RosterCarrierResolutionLayer';
vi.mock('../firebase/config',()=>({auth:{currentUser:{getIdToken:async()=> 'fixture'}},db:{}}));
vi.mock('../i18n',()=>({useI18n:()=>({t:(key:string)=>key,direction:'rtl'})}));
(globalThis as any).IS_REACT_ACT_ENVIRONMENT=true;
let root:Root,host:HTMLDivElement,ledger:ContextualPrerequisiteReceipts;
let verified=vi.fn<(...args:any[])=>void>(),create=vi.fn<()=>void>();
const kinds=['carrier','material','driver','truck'] as const;
type Kind=typeof kinds[number];
const entity=(kind:string,id='NEW'):any=>({kind,id,name:'Canonical',naturalKey:kind==='CARRIER'?'1010123456':kind==='MATERIAL'?'MAT-NEW':kind==='DRIVER'?'1234567890':'ABC123',globalStatus:'ACTIVE',membershipStatus:'ACTIVE',eligible:true,affiliation:kind==='DRIVER'||kind==='TRUCK'?{carrierId:'C0',status:'ACTIVE'}:null,assignment:null,allocation:null});
const context=():any=>({projectId:'P1',knownCarriers:[],knownDrivers:[],knownTrucks:[],knownMaterials:[],importResolution:{projectId:'P1',entities:[entity('CARRIER','C0'),...kinds.map(k=>entity(k.toUpperCase()))]}});
const batch=(kind:Kind):any=>({projectId:'P1',importBatchId:'B1',operationId:'O1',source:{sourceType:'CSV'},rows:[{rowNumber:1,status:'PENDING',reviewStatus:'requires_review',validationIssues:[],raw:{source:'preserved'},canonical:kind==='carrier'?{carrierName:'New carrier',commercialRegistrationNo:'1010123456'}:kind==='material'?{materialName:'New material',materialCode:'MAT-NEW'}:kind==='driver'?{driverName:'Driver',driverIdentity:'1234567890'}:{truckPlate:'ABC123'},entityResolutions:{carrier:{matchedId:'C0'}}}],issues:[]});
function Host({kind='carrier',stage='resolution',project='P1'}:{kind?:Kind;stage?:string;project?:string}) {
 const [child,setChild]=useState(false),[open,setOpen]=useState(true);
 const confirmation=useImportConfirmation(`${project}:${stage}`), b=batch(kind),group=RosterBatchReviewService.getBatchReviewGroups(b)[kind][0];
 return <><button id="outside">outside</button>{open&&<ImportOverlay level="WORKFLOW" label="workflow" onDismiss={()=>setOpen(false)}><section><button id="open-child" onClick={()=>setChild(true)}>open child</button><button id="parent-action" onClick={verified}>parent action</button><button onClick={()=>void confirmation.ask('cancel import?').then(ok=>{if(ok)setOpen(false);})}>cancel workflow</button>{confirmation.dialog}{child&&stage==='resolution'&&<ContextualCanonicalCreation key={`${project}:${stage}`} projectId={project} batch={b} group={group} context={context()} receipts={ledger} canMutate isCurrent={()=>open&&project==='P1'} onClose={()=>setChild(false)} onVerified={verified}/>}</section></ImportOverlay>}</>;
}
const render=async(node:React.ReactNode)=>act(async()=>root.render(node));
const click=async(selector:string)=>act(async()=>{document.querySelector<HTMLButtonElement>(selector)!.click();});
const top=()=>document.querySelector<HTMLElement>('[data-import-overlay="EDITOR"]')!;
const submit=async()=>act(async()=>{document.querySelector('form')!.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));});
beforeEach(()=>{
 host=document.createElement('div');document.body.append(host);root=createRoot(host);ledger=new ContextualPrerequisiteReceipts();verified=vi.fn<(...args:any[])=>void>();create=vi.fn<()=>void>();
 vi.spyOn(canonicalRelationshipContextService,'getProjectRelationshipContext').mockImplementation(async(_p,options)=>{const c=context();if(options?.naturalKey)c.importResolution={...c.importResolution,entities:[],lookup:{kind:options.kind,naturalKey:options.naturalKey,matchedId:null}};return c;});
 vi.spyOn(projectCanonicalRefreshService,'refresh').mockResolvedValue({materials:[],carriers:[],fleetRows:[],relationshipContext:context()});
 vi.spyOn(carrierManagementClientService,'createProjectCarrier').mockImplementation(async()=>{create();return {success:true,projectId:'P1',carrierId:'NEW',membershipStatus:'ACTIVE'};});
 vi.spyOn(materialManagementClientService,'createProjectMaterial').mockImplementation(async()=>{create();return {success:true,projectId:'P1',materialId:'NEW',membershipStatus:'ACTIVE'};});
 vi.spyOn(entityResolutionCommandService,'createDriver').mockImplementation(async()=>{create();return {matchedId:'NEW'} as any;});
 vi.spyOn(entityResolutionCommandService,'createTruck').mockImplementation(async()=>{create();return {matchedId:'NEW'} as any;});
});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();vi.restoreAllMocks();document.body.innerHTML='';});
it.each(kinds)('parent + real %s editor owns stacking, focus, pointer and close without cancelling the workflow',async kind=>{
 await render(<Host kind={kind}/>);await click('#open-child');const parent=document.querySelector<HTMLElement>('[data-import-overlay="WORKFLOW"]')!,child=top();
 expect(child.parentElement).toBe(document.body);expect(Number(child.style.zIndex)).toBeGreaterThan(Number(parent.style.zIndex));expect(parent.inert).toBe(true);expect(parent.getAttribute('aria-hidden')).toBe('true');expect(child.contains(document.activeElement)).toBe(true);expect(document.body.style.overflow).toBe('hidden');expect(child.dir).toBe('rtl');
 await click('#parent-action');expect(verified).not.toHaveBeenCalled();
 await act(async()=>document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true})));
 expect(top()).toBeNull();expect(parent.inert).toBe(false);expect(document.activeElement?.id).toBe('open-child');expect(parent.isConnected).toBe(true);expect(create).not.toHaveBeenCalled();
});
it.each(kinds)('%s create → pending/readback failure → retry stays portalled and never repeats creation',async kind=>{
 vi.mocked(projectCanonicalRefreshService.refresh).mockRejectedValueOnce(Error('offline'));
 await render(<Host kind={kind}/>);await click('#open-child');await submit();
 expect(create).toHaveBeenCalledOnce();expect(top().parentElement).toBe(document.body);expect(top().textContent).toContain('import.resolution.refresh');expect(document.querySelector('form')).toBeNull();expect(document.querySelector<HTMLElement>('[data-import-overlay="WORKFLOW"]')!.inert).toBe(true);
 await act(async()=>{Array.from(top().querySelectorAll('button')).find(b=>b.textContent==='setup.retry')!.click();});
 expect(create).toHaveBeenCalledOnce();expect(verified).toHaveBeenCalledOnce();expect(top()).toBeNull();expect(document.querySelector('[data-import-overlay="WORKFLOW"]')).not.toBeNull();
});
it.each(kinds)('%s can dismiss a pending mutation without cancelling the import or applying a late result',async kind=>{
 let resolve!:(value:any)=>void;const pending=new Promise<any>(r=>resolve=r);
 if(kind==='carrier')vi.mocked(carrierManagementClientService.createProjectCarrier).mockReturnValueOnce(pending);
 else if(kind==='material')vi.mocked(materialManagementClientService.createProjectMaterial).mockReturnValueOnce(pending);
 else vi.mocked(kind==='driver'?entityResolutionCommandService.createDriver:entityResolutionCommandService.createTruck).mockReturnValueOnce(pending);
 await render(<Host kind={kind}/>);await click('#open-child');await submit();expect(top().getAttribute('aria-busy')).toBe('true');
 await act(async()=>document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true})));
 expect(top()).toBeNull();expect(document.querySelector('[data-import-overlay="WORKFLOW"]')).not.toBeNull();
 await act(async()=>resolve({success:true,projectId:'P1',carrierId:'NEW',materialId:'NEW',matchedId:'NEW'}));expect(verified).not.toHaveBeenCalled();expect(document.querySelector('[data-import-overlay="WORKFLOW"]')).not.toBeNull();
});
it.each(kinds)('%s lost create response rechecks natural identity before any retry, with zero duplicate create',async kind=>{
 let committed=false;
 const mutation=kind==='carrier'?carrierManagementClientService.createProjectCarrier:kind==='material'?materialManagementClientService.createProjectMaterial:kind==='driver'?entityResolutionCommandService.createDriver:entityResolutionCommandService.createTruck;
 vi.mocked(mutation).mockImplementationOnce(async()=>{create();committed=true;throw Error('network response lost');});
 vi.mocked(canonicalRelationshipContextService.getProjectRelationshipContext).mockImplementation(async(_p,options)=>{const c=context();if(options?.naturalKey)c.importResolution={...c.importResolution,entities:committed?[entity(kind.toUpperCase())]:[],lookup:{kind:options.kind,naturalKey:options.naturalKey,matchedId:committed?'NEW':null}};return c;});
 await render(<Host kind={kind}/>);await click('#open-child');await submit();expect(create).toHaveBeenCalledOnce();expect(verified).not.toHaveBeenCalled();expect(document.querySelector('form')).not.toBeNull();
 await submit();expect(mutation).toHaveBeenCalledOnce();expect(verified).toHaveBeenCalledOnce();expect(top()).toBeNull();
});
it.each(['stage','project','reset'])('%s ownership change destroys child/recovery and rejects late completion',async change=>{
 let resolve!:(value:any)=>void;vi.mocked(projectCanonicalRefreshService.refresh).mockReturnValueOnce(new Promise(r=>resolve=r));
 await render(<Host/>);await click('#open-child');await submit();expect(top()).not.toBeNull();
 await render(change==='reset'?<div/>:<Host key={change} stage={change==='stage'?'next':'resolution'} project={change==='project'?'P2':'P1'}/>);
 await act(async()=>resolve({materials:[],carriers:[],fleetRows:[],relationshipContext:context()}));expect(verified).not.toHaveBeenCalled();expect(top()).toBeNull();
});
it('only the top modal owns Tab/Escape; closing the child does not close the import',async()=>{
 await render(<Host/>);await click('#open-child');const child=top(),buttons=child.querySelectorAll<HTMLElement>('button'),last=buttons[buttons.length-1];last.focus();
 await act(async()=>document.dispatchEvent(new KeyboardEvent('keydown',{key:'Tab',bubbles:true,cancelable:true})));expect(child.contains(document.activeElement)).toBe(true);
 await act(async()=>document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true})));expect(document.querySelectorAll('[role="dialog"]')).toHaveLength(1);expect(document.body.style.overflow).toBe('hidden');
 await render(<div/>);expect(document.body.style.overflow).toBe('');expect(host.inert).toBe(false);
});
it('owned confirmation preserves rejection and only confirmed cancellation closes the workflow',async()=>{
 await render(<Host/>);const cancel=()=>Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='cancel workflow')!;
 await act(async()=>cancel().click());const confirmation=document.querySelector<HTMLElement>('[data-import-overlay="CONFIRMATION"]')!;expect(Number(confirmation.style.zIndex)).toBe(IMPORT_OVERLAY_LEVEL.CONFIRMATION);
 await act(async()=>Array.from(confirmation.querySelectorAll('button')).find(b=>b.textContent==='shared.actions.cancel')!.click());expect(document.querySelector('[data-import-overlay="WORKFLOW"]')).not.toBeNull();
 await act(async()=>cancel().click());await act(async()=>Array.from(document.querySelectorAll('[data-import-overlay="CONFIRMATION"] button')).find(b=>b.textContent==='shared.actions.confirm')!.dispatchEvent(new MouseEvent('click',{bubbles:true})));expect(document.querySelector('[role="dialog"]')).toBeNull();expect(document.body.style.overflow).toBe('');
});
it.each([360,768,1440])('viewport %i retains bounded scrollable editors and reachable actions structurally',async width=>{
 vi.stubGlobal('innerWidth',width);await render(<Host kind="driver"/>);await click('#open-child');expect(top().className).toContain('overflow-y-auto');const form=top().querySelector('form')!;expect(form.className).toContain('max-h-');expect(form.className).toContain('overflow-y-auto');expect(form.querySelector('button[type="button"]')).not.toBeNull();expect(form.querySelectorAll('button')).toHaveLength(2);vi.unstubAllGlobals();
});
it('large canonical alternate lists stay bounded while an identity beyond the initial window remains selectable',async()=>{
 const c=context();c.importResolution.entities=Array.from({length:5000},(_,i)=>({...entity('CARRIER',`C${i}`),name:`Carrier ${i}`,naturalKey:String(1000000000+i)}));
 const b=batch('carrier'),g=RosterBatchReviewService.getBatchReviewGroups(b).carrier[0],select=vi.fn();
 await render(<CanonicalResolutionDecision projectId="P1" context={c} group={g} isCurrent={()=>true} onSelect={select} onVerified={verified} onCreate={vi.fn()}/>);
 expect(document.querySelectorAll('option').length).toBeLessThanOrEqual(102);const search=document.querySelector<HTMLInputElement>('input[type=search]')!;
 await act(async()=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')!.set!.call(search,'C4999');search.dispatchEvent(new Event('input',{bubbles:true}));});
 const choice=document.querySelector<HTMLSelectElement>('select')!;expect(Array.from(choice.options).some(o=>o.value==='C4999')).toBe(true);await act(async()=>{choice.value='C4999';choice.dispatchEvent(new Event('change',{bubbles:true}));});await act(async()=>document.querySelector('button')!.click());expect(select).toHaveBeenCalledWith('C4999');
});
it('group pagination limits DOM rows, preserves full progress/readiness and reaches the final group',async()=>{
 const b=batch('carrier');b.rows=Array.from({length:120},(_,i)=>({...b.rows[0],rowNumber:i+1,canonical:{carrierName:`Carrier ${i}`,commercialRegistrationNo:String(1000000000+i)},entityResolutions:{carrier:{...entity('CARRIER',`C${i}`),entityType:'CARRIER',originalValue:`Carrier ${i}`,sourceValue:`Carrier ${i}`,confidence:0,isExact:false,recommendation:'REVIEW'}}}));
 await render(<RosterCarrierResolutionLayer importBatch={b} embeddedInWorkflowHost onAcceptCandidate={vi.fn()} onCreateCarrier={vi.fn()} onContinueToMaterials={vi.fn()}/>);
 expect(document.querySelectorAll('nav')).toHaveLength(1);expect(document.body.textContent).toContain('Carrier 0');expect(document.body.textContent).not.toContain('Carrier 119');
 const next=()=>Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='import.assurance.next')!;await act(async()=>next().click());await act(async()=>next().click());expect(document.body.textContent).toContain('Carrier 119');expect(next().disabled).toBe(true);expect(RosterBatchReviewService.getBatchReviewGroups(b).carrier).toHaveLength(120);
});
