// @vitest-environment happy-dom
import React,{act} from 'react';
import {createRoot, type Root} from 'react-dom/client';
import {afterEach,beforeEach,describe,it,expect,vi} from 'vitest';
import {I18nProvider} from '../i18n';
import {enTranslations as tr} from '../locales/en';
import {ContextualCanonicalCreation,contextualPrefill} from '../components/import/ContextualCanonicalCreation';
import {CanonicalResolutionDecision} from '../components/import/CanonicalResolutionDecision';
import {CanonicalFleetIdentityEditor} from '../components/masterData/CanonicalFleetIdentityEditor';
import {ContextualPrerequisiteReceipts,contextualAction,contextualReceiptKey} from '../services/import/contextualCanonicalCreation.service';
import {canonicalRelationshipContextService as reads} from '../services/canonicalRelationshipContext.service';
import {projectCanonicalRefreshService as refresh} from '../services/projectCanonicalRefresh.service';
import {carrierManagementClientService as carriers} from '../services/carrierManagementClient.service';
import {materialManagementClientService as materials} from '../services/materialManagementClient.service';
import {entityResolutionCommandService as commands} from '../services/import/entityResolutionCommand.service';
import {RosterBatchReviewService as Review} from '../services/import/rosterBatchReview.service';
import {DriverTruckPipelineService as Pipeline} from '../services/import/driverTruckPipeline.service';
import {applyOperationalGroupChoice} from '../services/import/importResolutionWorkflow';
import {buildRosterCanonicalIntent} from '../services/import/rosterCanonicalIntent.service';
import type {ImportResolutionEntity as Entity} from '../types/importResolution';
import type {UnifiedImportBatch, ImportRow} from '../types/unifiedImport';
import fs from 'node:fs';
vi.mock('../firebase/config',()=>({auth:{currentUser:{getIdToken:async()=> 'token'}},db:{}}));
(globalThis as any).IS_REACT_ACT_ENVIRONMENT=true;
const entity=(kind:Entity['kind'],id='NEW',extra:Partial<Entity>={}):Entity=>({kind,id,name:kind==='CARRIER'?'Missing carrier':kind==='MATERIAL'?'Missing material':'Participant',naturalKey:kind==='CARRIER'?'1010123456':kind==='MATERIAL'?'MAT-NEW':kind==='DRIVER'?'1234567890':'ABC 123',globalStatus:'ACTIVE',membershipStatus:'ACTIVE',eligible:true,canReactivate:true,affiliation:kind==='DRIVER'||kind==='TRUCK'?{carrierId:'C0',status:'ACTIVE'}:null,assignment:null,allocation:null,...extra});
function context(es:Entity[]=[]):any{return {projectId:'P1',importResolution:{projectId:'P1',entities:[entity('CARRIER','C0',{name:'Known carrier',naturalKey:'1010123457'}),...es]},knownCarriers:[],knownMaterials:[],knownDrivers:[],knownTrucks:[]};}
function row(n=1,kind='carrier'):ImportRow{return {rowNumber:n,canonical:kind==='carrier'?{carrierName:'Missing carrier'}:kind==='material'?{materialName:'Missing material'}:kind==='driver'?{driverName:'Participant',driverIdentity:'1234567890'}:{truckPlate:'ABC 123'},raw:{original:'kept'},mapped:{},status:'PENDING',reviewStatus:'requires_review',validationIssues:[]};}
function batch(kind='carrier',count=1):UnifiedImportBatch{return {projectId:'P1',importBatchId:'B',operationId:'OP',source:{sourceType:'CSV',importBatchId:'B',sourceFileName:'source.csv',sourceSheetName:'Original'},rows:Array.from({length:count},(_,i)=>row(i+1,kind)),issues:[],currentStage:'REVIEW',commitStatus:'AWAITING_REVIEW',validationStatus:'PENDING',totalRows:count,validRows:0,errorRows:0,warningRows:0,requiresReviewRows:count,committedRows:0,createdBy:'U',createdAt:'now',auditTrail:[]};}
function group(kind='carrier'){const b=batch(kind);return Review.getBatchReviewGroups(b)[kind][0];}
let root:Root,container:HTMLDivElement,ledger:ContextualPrerequisiteReceipts;
const close=vi.fn(),verified=vi.fn();
async function render(node:React.ReactNode){await act(async()=>root.render(<I18nProvider initialLocale="en">{node}</I18nProvider>));}
async function change(e:HTMLInputElement|HTMLSelectElement,value:string){await act(async()=>{Object.getOwnPropertyDescriptor(e instanceof HTMLSelectElement?HTMLSelectElement.prototype:HTMLInputElement.prototype,'value')!.set!.call(e,value);e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));});}
const button=(label:string)=>Array.from(document.querySelectorAll('button')).find(b=>b.textContent===tr[label])!;
async function click(label:string){await act(async()=>button(label).click());}
async function submit(){await act(async()=>document.querySelector('form')!.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));}
const naturalInput=(kind:string)=>document.querySelector<HTMLInputElement>(`input[placeholder="${tr[kind==='carrier'?'entityResolution.labels.registration_example':'entityResolution.labels.material_code_example']}"]`)!;
async function creation(kind='carrier',props:any={}){const b=batch(kind),g=group(kind);await render(<ContextualCanonicalCreation key={`${props.projectId||'P1'}:${kind}`} projectId="P1" batch={b} group={g} context={context()} receipts={ledger} isCurrent={()=>true} canMutate onClose={close} onVerified={verified} {...props}/>);return {b,g};}
beforeEach(()=>{container=document.createElement('div');document.body.append(container);root=createRoot(container);ledger=new ContextualPrerequisiteReceipts();close.mockReset();verified.mockReset();
 vi.spyOn(reads,'getProjectRelationshipContext').mockImplementation(async(p,options)=>options?.naturalKey?{...context(),importResolution:{...context().importResolution,lookup:{kind:options.kind,naturalKey:options.naturalKey,matchedId:null}}}:context([entity('CARRIER'),entity('MATERIAL'),entity('DRIVER'),entity('TRUCK')]));
 vi.spyOn(refresh,'refresh').mockResolvedValue({materials:[],carriers:[],fleetRows:[],relationshipContext:context()});
 vi.spyOn(carriers,'createProjectCarrier').mockResolvedValue({success:true,projectId:'P1',carrierId:'NEW',membershipStatus:'ACTIVE'});
 vi.spyOn(materials,'createProjectMaterial').mockResolvedValue({success:true,projectId:'P1',materialId:'NEW',membershipStatus:'ACTIVE'});
 vi.spyOn(commands,'membership').mockResolvedValue({});vi.spyOn(commands,'affiliation').mockResolvedValue({});
});
afterEach(async()=>{await act(async()=>root.unmount());document.body.innerHTML='';localStorage.clear();vi.restoreAllMocks();});
describe('SI-CG2 contextual action state',()=>{
 it.each(['CARRIER','MATERIAL','DRIVER','TRUCK'] as const)('%s separates membership states from creation',kind=>{
  for(const [status,expected] of [[null,'ENROLL_EXISTING'],['SUSPENDED','REACTIVATE_MEMBERSHIP'],['REMOVED','REACTIVATE_MEMBERSHIP'],['ACTIVE','REUSE_ACTIVE']] as const){const g={...group(kind.toLowerCase()),currentResolution:{canonicalState:entity(kind,'E',{membershipStatus:status})}} as any;expect(contextualAction(g,true,'C0')).toBe(expected);if(status!=='ACTIVE')expect(contextualAction(g,false,'C0')).toBe('NO_PERMISSION');}
 });
 it.each(['DRIVER','TRUCK'] as const)('%s separates missing, inactive and conflicting Carrier affiliation',kind=>{
  const g={...group(kind.toLowerCase()),currentResolution:{canonicalState:entity(kind)}} as any;
  g.currentResolution.canonicalState.affiliation=null;expect(contextualAction(g,true,'C0')).toBe('SET_AFFILIATION');
  g.currentResolution.canonicalState.affiliation={carrierId:'C0',status:'INACTIVE'};expect(contextualAction(g,true,'C0')).toBe('REACTIVATE_AFFILIATION');
  g.currentResolution.canonicalState.affiliation={carrierId:'OTHER',status:'ACTIVE'};expect(contextualAction(g,true,'C0')).toBe('LEAVE_UNRESOLVED');
 });
 it.each(['CARRIER','MATERIAL','DRIVER','TRUCK'] as const)('%s ineligibility, ambiguity and integrity never offer create',kind=>{
  const g={...group(kind.toLowerCase()),currentResolution:{canonicalState:entity(kind,'E',{globalStatus:'INACTIVE'})}} as any;expect(contextualAction(g,true,'C0')).toBe('LEAVE_UNRESOLVED');
  g.currentResolution={ambiguous:true};expect(contextualAction(g,true)).toBe('SELECT_CANDIDATE');g.currentResolution={resolutionReason:'CANONICAL_INTEGRITY_ERROR'};expect(contextualAction(g,true)).toBe('BLOCKED_BY_INTEGRITY');
 });
});
describe('SI-CG2 actual canonical editor reuse',()=>{
 it.each(['carrier','material'])('%s retains factual defaults and cancel performs no mutation',async kind=>{
  const b=batch(kind);b.rows[0].canonical![kind==='carrier'?'commercialRegistrationNo':'materialCode']=kind==='carrier'?'1010123456':'MAT-NEW';const g=Review.getBatchReviewGroups(b)[kind][0];const saved=structuredClone(b);
  await creation(kind,{batch:b,group:g});expect(naturalInput(kind).value).toBe(kind==='carrier'?'1010123456':'MAT-NEW');expect(document.body.textContent).toContain(tr[kind==='carrier'?'projects.labels.add_carrier':'entityResolution.labels.add_material']);await click('shared.actions.cancel');expect(close).toHaveBeenCalledOnce();expect(verified).not.toHaveBeenCalled();expect(carriers.createProjectCarrier).not.toHaveBeenCalled();expect(materials.createProjectMaterial).not.toHaveBeenCalled();expect(b).toEqual(saved);
 });
 it.each(['carrier','material'])('%s missing natural identity remains empty until user supplies it',async kind=>{await creation(kind);expect(naturalInput(kind).value).toBe('');await submit();expect(carriers.createProjectCarrier).not.toHaveBeenCalled();expect(materials.createProjectMaterial).not.toHaveBeenCalled();expect(close).not.toHaveBeenCalled();});
 it.each(['carrier','material'])('%s create is explicit, refreshes canonical state and returns to the same group',async kind=>{
  const {b}=await creation(kind);const saved=structuredClone(b);await change(naturalInput(kind),kind==='carrier'?'1010123456':'MAT-NEW');await submit();
  expect(kind==='carrier'?carriers.createProjectCarrier:materials.createProjectMaterial).toHaveBeenCalledTimes(1);expect(refresh.refresh).toHaveBeenCalledWith('P1',{expect:kind==='carrier'?{carrierId:'NEW'}:{materialId:'NEW'}});expect(verified).toHaveBeenCalledWith(expect.objectContaining({projectId:'P1'}),'NEW','CREATE',expect.any(Object));expect(close).toHaveBeenCalled();expect(b).toEqual(saved);
 });
 it.each(['carrier','material'])('%s success/refresh failure survives close/reopen and retries reads only',async kind=>{
  vi.mocked(refresh.refresh).mockRejectedValueOnce(Error('offline'));await creation(kind);await change(naturalInput(kind),kind==='carrier'?'1010123456':'MAT-NEW');await submit();
  expect(document.body.textContent).toContain(tr['import.resolution.refresh']);expect(close).not.toHaveBeenCalled();await click('shared.actions.close');await render(<div/>);await creation(kind);expect(document.querySelector('form')).toBeNull();await click('setup.retry');
  expect(kind==='carrier'?carriers.createProjectCarrier:materials.createProjectMaterial).toHaveBeenCalledTimes(1);expect(refresh.refresh).toHaveBeenCalledTimes(2);expect(verified).toHaveBeenCalledOnce();
 });
 it.each(['carrier','material'])('%s command failure preserves suggested inputs and batch',async kind=>{
  vi.mocked(kind==='carrier'?carriers.createProjectCarrier:materials.createProjectMaterial).mockRejectedValueOnce(Error('FORBIDDEN'));
  const {b}=await creation(kind);const saved=structuredClone(b);await change(naturalInput(kind),kind==='carrier'?'1010123456':'MAT-NEW');await submit();expect(naturalInput(kind).value).toBe(kind==='carrier'?'1010123456':'MAT-NEW');expect(verified).not.toHaveBeenCalled();expect(close).not.toHaveBeenCalled();expect(refresh.refresh).not.toHaveBeenCalled();expect(b).toEqual(saved);
 });
 it.each(['carrier','material'])('%s existing Global lookup bypasses create and returns its state for participation resolution',async kind=>{
  vi.mocked(reads.getProjectRelationshipContext).mockImplementation(async(p,o)=>({...context([entity(kind.toUpperCase() as Entity['kind'],'EXISTING',{membershipStatus:null})]),importResolution:{...context([entity(kind.toUpperCase() as Entity['kind'],'EXISTING',{membershipStatus:null})]).importResolution,lookup:{kind:o!.kind,naturalKey:o!.naturalKey,matchedId:'EXISTING'}}}));
  await creation(kind);await change(naturalInput(kind),kind==='carrier'?'1010123456':'MAT-NEW');await submit();expect(verified).toHaveBeenCalledWith(expect.any(Object),'EXISTING');expect(carriers.createProjectCarrier).not.toHaveBeenCalled();expect(materials.createProjectMaterial).not.toHaveBeenCalled();
 });
 it('an unrelated canonical integrity issue does not prevent a proven-new natural identity',async()=>{
  vi.mocked(reads.getProjectRelationshipContext).mockImplementation(async(p,o)=>o?.naturalKey?{...context(),importResolution:{...context().importResolution,entities:[entity('CARRIER','OTHER',{naturalKey:'1010123457',issue:'UNRELATED_INTEGRITY_ERROR'})],lookup:{kind:o.kind,naturalKey:o.naturalKey,matchedId:null}}}:context([entity('CARRIER')]));
  await creation();await change(naturalInput('carrier'),'1010123456');await submit();expect(carriers.createProjectCarrier).toHaveBeenCalledTimes(1);expect(verified).toHaveBeenCalled();
 });
 it.each(['carrier','material'])('%s no permission exposes no usable creation form',async kind=>{await creation(kind,{canMutate:false});expect(document.querySelector('form')).toBeNull();expect(document.body.textContent).toContain(tr['import.context.noPermission']);expect(carriers.createProjectCarrier).not.toHaveBeenCalled();});
 it.each(['carrier','material'])('%s late A command cannot apply to B',async kind=>{
  let resolve!:(v:any)=>void;const pending=new Promise<any>(r=>resolve=r);vi.mocked(kind==='carrier'?carriers.createProjectCarrier:materials.createProjectMaterial).mockReturnValueOnce(pending);
  await creation(kind);await change(naturalInput(kind),kind==='carrier'?'1010123456':'MAT-NEW');await submit();await creation(kind,{projectId:'P2',batch:{...batch(kind),projectId:'P2',importBatchId:'B2'},context:{...context(),projectId:'P2'}});
  await act(async()=>resolve({success:true,projectId:'P1',carrierId:'NEW',materialId:'NEW',membershipStatus:'ACTIVE'}));expect(verified).not.toHaveBeenCalled();expect(close).not.toHaveBeenCalled();expect(refresh.refresh).not.toHaveBeenCalled();
 });
});
describe('SI-CG2 canonical membership and affiliation mutation recovery',()=>{
 it.each(['CARRIER','MATERIAL','DRIVER','TRUCK'] as const)('%s enrollment retries refresh without repeating the command',async kind=>{
  const e=entity(kind,'E',{membershipStatus:null}),g={...group(kind.toLowerCase()),currentResolution:{canonicalState:e},matchedId:e.id};
  vi.mocked(refresh.refresh).mockRejectedValueOnce(Error('offline'));vi.mocked(reads.getProjectRelationshipContext).mockResolvedValue(context([entity(kind,'E')]));
  await render(<CanonicalResolutionDecision receipts={ledger} receiptScope="B" projectId="P1" context={context([e])} group={g} carrierId="C0" isCurrent={()=>true} onCreate={vi.fn()} onSelect={vi.fn()} onVerified={verified}/>);
  await click('import.resolution.enroll');expect(commands.membership).toHaveBeenCalledWith('P1',kind,'E','ENROLL');expect(verified).not.toHaveBeenCalled();await click('setup.retry');expect(commands.membership).toHaveBeenCalledTimes(1);expect(verified).toHaveBeenCalledWith(expect.any(Object),'E','ENROLL');
 });
 it.each(['DRIVER','TRUCK'] as const)('%s explicit affiliation retries only refresh',async kind=>{
  const e=entity(kind,'E',{affiliation:null}),g={...group(kind.toLowerCase()),currentResolution:{canonicalState:e},matchedId:e.id};vi.mocked(refresh.refresh).mockRejectedValueOnce(Error('offline'));vi.mocked(reads.getProjectRelationshipContext).mockResolvedValue(context([entity(kind,'E')]));
  await render(<CanonicalResolutionDecision receipts={ledger} projectId="P1" context={context([e])} group={g} carrierId="C0" isCurrent={()=>true} onCreate={vi.fn()} onSelect={vi.fn()} onVerified={verified}/>);
  await click('import.resolution.affiliation');await click('setup.retry');expect(commands.affiliation).toHaveBeenCalledTimes(1);expect(commands.affiliation).toHaveBeenCalledWith('P1',kind,'E','C0','SET_AFFILIATION');expect(verified).toHaveBeenCalledWith(expect.any(Object),'E','AFFILIATE');
 });
 it.each(['CARRIER','MATERIAL','DRIVER','TRUCK'] as const)('%s suspended/removed membership uses explicit REACTIVATE, never Create',async kind=>{
  const e=entity(kind,'E',{membershipStatus:'REMOVED'}),g={...group(kind.toLowerCase()),currentResolution:{canonicalState:e},matchedId:e.id};
  vi.mocked(reads.getProjectRelationshipContext).mockResolvedValue(context([entity(kind,'E')]));
  await render(<CanonicalResolutionDecision receipts={ledger} projectId="P1" context={context([e])} group={g} carrierId="C0" isCurrent={()=>true} onCreate={close} onSelect={vi.fn()} onVerified={verified}/>);
  await click('import.resolution.reactivate');expect(commands.membership).toHaveBeenCalledWith('P1',kind,'E','REACTIVATE');expect(close).not.toHaveBeenCalled();expect(carriers.createProjectCarrier).not.toHaveBeenCalled();expect(materials.createProjectMaterial).not.toHaveBeenCalled();
 });
 it.each(['DRIVER','TRUCK'] as const)('%s inactive same-Carrier affiliation reactivates explicitly',async kind=>{
  const e=entity(kind,'E',{affiliation:{carrierId:'C0',status:'INACTIVE'}}),g={...group(kind.toLowerCase()),currentResolution:{canonicalState:e},matchedId:e.id};
  vi.mocked(reads.getProjectRelationshipContext).mockResolvedValue(context([entity(kind,'E')]));await render(<CanonicalResolutionDecision receipts={ledger} projectId="P1" context={context([e])} group={g} carrierId="C0" isCurrent={()=>true} onCreate={close} onSelect={vi.fn()} onVerified={verified}/>);
  await click('import.resolution.affiliation');expect(commands.affiliation).toHaveBeenCalledWith('P1',kind,'E','C0','REACTIVATE_AFFILIATION');expect(close).not.toHaveBeenCalled();
 });
 it('a unique suggested canonical identity can be accepted without a membership mutation',async()=>{
  const e=entity('MATERIAL','E'),g={...group('material'),currentResolution:{canonicalState:e,recommendation:'REVIEW' as const},matchedId:e.id};const selected=vi.fn();
  await render(<CanonicalResolutionDecision projectId="P1" context={context([e])} group={g} isCurrent={()=>true} onCreate={close} onSelect={selected} onVerified={verified}/>);
  await change(document.querySelector('select')!,'E');await click('entityResolution.labels.accept_suggested_match');expect(selected).toHaveBeenCalledWith('E');expect(commands.membership).not.toHaveBeenCalled();expect(close).not.toHaveBeenCalled();
 });
 it.each(['CARRIER','MATERIAL','DRIVER','TRUCK'] as const)('%s late membership command acknowledgement cannot apply to Project B',async kind=>{
  let resolve!:(value:any)=>void;const deferred=new Promise<any>(r=>resolve=r);vi.mocked(commands.membership).mockReturnValueOnce(deferred);
  const e=entity(kind,'E',{membershipStatus:null}),g={...group(kind.toLowerCase()),currentResolution:{canonicalState:e},matchedId:e.id};
  const props={receipts:ledger,receiptScope:'B',context:context([e]),group:g,carrierId:'C0',isCurrent:()=>true,onCreate:close,onSelect:vi.fn(),onVerified:verified};
  await render(<CanonicalResolutionDecision key="P1" projectId="P1" {...props}/>);await click('import.resolution.enroll');
  await render(<CanonicalResolutionDecision key="P2" {...props} projectId="P2" context={{...context([e]),projectId:'P2'}}/>);
  await act(async()=>resolve({}));expect(verified).not.toHaveBeenCalled();expect(refresh.refresh).not.toHaveBeenCalled();expect(commands.membership).toHaveBeenCalledTimes(1);
 });
 it.each(['DRIVER','TRUCK'] as const)('%s late affiliation refresh cannot apply to Project B',async kind=>{
  let resolve!:(value:any)=>void;const deferred=new Promise<any>(r=>resolve=r);vi.mocked(refresh.refresh).mockReturnValueOnce(deferred);
  const e=entity(kind,'E',{affiliation:null}),g={...group(kind.toLowerCase()),currentResolution:{canonicalState:e},matchedId:e.id};
  const props={receipts:ledger,context:context([e]),group:g,carrierId:'C0',isCurrent:()=>true,onCreate:close,onSelect:vi.fn(),onVerified:verified};
  await render(<CanonicalResolutionDecision key="P1" projectId="P1" {...props}/>);await click('import.resolution.affiliation');
  await render(<CanonicalResolutionDecision key="P2" {...props} projectId="P2" context={{...context([e]),projectId:'P2'}}/>);
  await act(async()=>resolve({materials:[],carriers:[],fleetRows:[],relationshipContext:context([e])}));expect(verified).not.toHaveBeenCalled();expect(commands.affiliation).toHaveBeenCalledTimes(1);
 });
 it.each(['carrier','material','driver','truck'] as const)('%s operational contextual choice retains missing participation and converges after enrollment',kind=>{
  const b=batch(kind),r=b.rows[0];if(kind==='driver'||kind==='truck')r.canonical={...r.canonical,carrierName:'C0'};r.entityResolutions={[kind]:{entityType:kind.toUpperCase() as Entity['kind'],originalValue:'Unknown',sourceValue:'Unknown',confidence:0,isExact:false,recommendation:'REVIEW'}};
  const g=Review.getBatchReviewGroups(b)[kind][0];const e=entity(kind.toUpperCase() as Entity['kind'],'E',{membershipStatus:null});const ctx:any={projectId:'P1',userId:'U',operationId:'OP',resolutionContext:context([e]).importResolution};
  let updated=applyOperationalGroupChoice(b,g,'E',ctx,'U');expect(updated.rows[0].entityResolutions![kind].resolutionReason).toBe('MEMBERSHIP_MISSING');expect(Review.getBatchReviewGroups(updated)[kind][0].status).toBe('CONFLICT');
  e.membershipStatus='ACTIVE';if(kind==='driver'||kind==='truck')updated.rows[0].entityResolutions!.carrier={entityType:'CARRIER',originalValue:'Known carrier',matchedId:'C0',confidence:1,isExact:true,recommendation:'ACCEPT'};
  const nextGroup=Review.getBatchReviewGroups(updated)[kind][0];updated=applyOperationalGroupChoice(updated,nextGroup,'E',ctx,'U');expect(updated.rows[0].entityResolutions![kind].resolutionReason).toBeUndefined();expect(updated.rows[0].raw).toEqual(r.raw);
 });
 it('a pending membership receipt follows the canonical target across source-group re-entry',async()=>{
  const e=entity('CARRIER','E',{membershipStatus:null}),g={...group(),currentResolution:{canonicalState:e},matchedId:e.id};vi.mocked(refresh.refresh).mockRejectedValueOnce(Error('offline'));vi.mocked(reads.getProjectRelationshipContext).mockResolvedValue(context([entity('CARRIER','E')]));
  const props={receipts:ledger,receiptScope:'B',projectId:'P1',context:context([e]),isCurrent:()=>true,onCreate:close,onSelect:vi.fn(),onVerified:verified};
  await render(<CanonicalResolutionDecision key="first" {...props} group={g}/>);await click('import.resolution.enroll');
  await render(<CanonicalResolutionDecision key="second" {...props} group={{...g,normalizedSourceKey:'carrier:other-source-name'}}/>);await click('setup.retry');expect(commands.membership).toHaveBeenCalledTimes(1);expect(verified).toHaveBeenCalledWith(expect.any(Object),'E','ENROLL');
 });
 it('integrity corruption exposes neither create nor alternate escape',async()=>{
  const g={...group(),currentResolution:{resolutionReason:'CANONICAL_INTEGRITY_ERROR'}};
  await render(<CanonicalResolutionDecision projectId="P1" context={context()} group={g} isCurrent={()=>true} onCreate={close} onSelect={verified} onVerified={vi.fn()}/>);
  const select=document.querySelector('select')!;expect(select.disabled).toBe(true);expect(document.querySelector('button')).toBeNull();expect(close).not.toHaveBeenCalled();
 });
});
describe('SI-CG2 canonical Fleet preparation and boundaries',()=>{
 it.each(['DRIVER','TRUCK'] as const)('%s shared editor prepares only after natural identity validation with no automatic command',async kind=>{
  const prepared=vi.fn(async()=>{});await render(<CanonicalFleetIdentityEditor projectId="P1" kind={kind} carriers={[{id:'C0',name:'Known carrier'}]} initialValues={{carrierId:'C0'}} planned isCurrent={()=>true} onClose={close} onSubmit={prepared}/>);
  expect(prepared).not.toHaveBeenCalled();await submit();expect(prepared).not.toHaveBeenCalled();await change(document.querySelector<HTMLInputElement>(`input[name="${kind==='DRIVER'?'residencyId':'plateNumber'}"]`)!,kind==='DRIVER'?'1234567890':'ABC 123');if(kind==='DRIVER')await change(document.querySelector<HTMLInputElement>('input[name="driverName"]')!,'Driver');await submit();expect(prepared).toHaveBeenCalledOnce();expect(document.body.textContent).toContain(tr['import.context.planned']);expect(commands.membership).not.toHaveBeenCalled();expect(commands.affiliation).not.toHaveBeenCalled();
 });
 it('retired form has zero production references; all three hosts invoke one adapter',()=>{
  expect(fs.existsSync('src/components/import/CanonicalCreationForm.tsx')).toBe(false);
  for(const host of ['wizard/ProjectSetupWizard','importCenter/ExcelCsvImportSection','importCenter/GoogleSheetsImportSection']){const source=fs.readFileSync(`src/components/${host}.tsx`,'utf8');expect(source).toContain('<ContextualCanonicalCreation');expect(source).not.toContain('CanonicalCreationForm');}
  const source=fs.readFileSync('src/components/import/ContextualCanonicalCreation.tsx','utf8');expect(source).not.toMatch(/assignment-commands|allocation-commands|runTransaction|setDoc|addDoc/);
 });
 it('receipt keys isolate project, batch and exact semantic group',()=>{
  const g=group();const keys=[contextualReceiptKey('P1','B',g,'CREATE'),contextualReceiptKey('P2','B',g,'CREATE'),contextualReceiptKey('P1','B2',g,'CREATE'),contextualReceiptKey('P1','B',{...g,normalizedSourceKey:'other'},'CREATE')];expect(new Set(keys).size).toBe(4);
 });
 it('source defaults are suggestions only and contradictory source natural keys are never synthesized',()=>{
  const b=batch('material',2);b.rows[0].canonical!.materialCode='A';b.rows[1].canonical!.materialCode='B';const g=group('material');g.normalizedSourceKey='unavailable';const before=structuredClone(b);expect(contextualPrefill(b,g).code).toBeUndefined();expect(b).toEqual(before);
 });
 it('one canonical Carrier decision propagates to 300 occurrences without reparsing or source loss',()=>{
  const b=batch('carrier',300);b.rows.forEach(r=>r.entityResolutions={carrier:{entityType:'CARRIER',originalValue:'Missing carrier',confidence:0,isExact:false,recommendation:'REVIEW',resolutionReason:'UNRESOLVED'}});const g=Review.getBatchReviewGroups(b).carrier[0],before=structuredClone(b.source);const ctx:any={projectId:'P1',userId:'U',operationId:'OP',resolutionContext:context([entity('CARRIER')]).importResolution};
  const updated=Pipeline.applyGroupedEntityResolutionDecision(b,'carrier',g.normalizedSourceKey,'SELECT_ALTERNATE',{selectedEntityId:'NEW'},ctx,'U');expect(updated.rows.every(r=>r.entityResolutions?.carrier.matchedId==='NEW')).toBe(true);expect(updated.source).toEqual(before);expect(updated.rows.map(r=>r.raw)).toEqual(b.rows.map(r=>r.raw));
  updated.metadata={...updated.metadata,canonicalPrerequisites:[{projectId:'P1',key:'CARRIER:NEW',action:'CREATE',completed:true}]};const intent=buildRosterCanonicalIntent(updated,ctx);expect(intent.entityConsequences.filter(c=>c.action==='CREATE')).toEqual([expect.objectContaining({completed:true,rowNumbers:Array.from({length:300},(_,i)=>i+1)})]);expect(intent.assignmentIntents).toEqual([]);expect(intent.allocationIntents).toEqual([]);
 });
 it('one Material choice resolves 300 matching occurrences without allocation side effects',()=>{
  const b=batch('material',300);b.rows.forEach(r=>r.entityResolutions={material:{entityType:'MATERIAL',originalValue:'Missing material',confidence:0,isExact:false,recommendation:'REVIEW',resolutionReason:'UNRESOLVED'}});
  const g=Review.getBatchReviewGroups(b).material[0];const ctx:any={projectId:'P1',userId:'U',operationId:'OP',resolutionContext:context([entity('MATERIAL')]).importResolution,knownEntities:{materials:[{materialId:'NEW',name:'Missing material'}]}};
  const updated=Pipeline.applyGroupedEntityResolutionDecision(b,'material',g.normalizedSourceKey,'SELECT_ALTERNATE',{selectedEntityId:'NEW'},ctx,'U');expect(updated.rows.every(r=>r.entityResolutions?.material.matchedId==='NEW')).toBe(true);expect(updated.source).toEqual(b.source);expect(updated.rows.map(r=>r.raw)).toEqual(b.rows.map(r=>r.raw));expect(buildRosterCanonicalIntent(updated,ctx).allocationIntents).toEqual([]);
 });

 it('completed canonical prerequisites remain visible after source rows are excluded, with no pending temporal work',()=>{
  const b=batch();b.rows[0].status='REJECTED';b.metadata={canonicalPrerequisites:[{projectId:'P1',key:'CARRIER:NEW',action:'CREATE',completed:true,rowNumbers:[1]}]};
  const intent=buildRosterCanonicalIntent(b,{projectId:'P1',userId:'U',operationId:'OP',resolutionContext:context([entity('CARRIER')]).importResolution});
  expect(intent.entityConsequences).toEqual([{key:'CARRIER:NEW',action:'CREATE',completed:true,rowNumbers:[1]}]);expect(intent.entities.find(e=>e.key==='NEW')?.label).toBe('Missing carrier');expect(intent.rowDecisions[0].status).toBe('EXCLUDED');expect(intent.assignmentIntents).toEqual([]);expect(intent.allocationIntents).toEqual([]);
 });

});
