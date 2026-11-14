// @vitest-environment happy-dom
import React,{act} from 'react';
import {createRoot} from 'react-dom/client';
import {beforeEach,afterEach,it,expect,vi} from 'vitest';
import {OperationalTripActions} from '../components/field/OperationalTripActions';
import {tripTimeline,operationalActionPresentation,validMeasurement,validExistingDriverId,type OperationalTripActionView} from '../utils/tripTimelinePresentation';
import {snapshotOperationalConfiguration} from '../services/operationalProfileResolver';
import {dictionaries} from '../locales';
vi.mock('../i18n',()=>({useI18n:()=>({t:(key:string)=>key,direction:'rtl'})}));
const roles=['PROJECT_ADMIN'];
function trip(profile='NO_WEIGHBRIDGE',status='DISPATCHED',intake='MIXED'):OperationalTripActionView{
 const c:any={schemaVersion:1,loadingMeasurementMode:['DUAL_WEIGHBRIDGE','LOADING_SCALE_ONLY'].includes(profile)?'WEIGHBRIDGE':'NONE',unloadingMeasurementMode:['DUAL_WEIGHBRIDGE','UNLOADING_SCALE_ONLY'].includes(profile)?'WEIGHBRIDGE':'NONE',driverIntakeMode:intake,routeConfiguration:{loadingLocation:'A',unloadingLocation:'B'},shiftConfiguration:{mode:'NONE'},capacityEstimationPolicy:{mode:'NONE'},requiredCheckpoints:[]};
 return {tripId:'T',driverId:null,status,weights:{},financials:{isFinalized:false},operationalSnapshot:snapshotOperationalConfiguration(c,1,null,{}),operationalTimeline:{}};
}
let host:HTMLDivElement,root:ReturnType<typeof createRoot>;
beforeEach(()=>{(globalThis as any).IS_REACT_ACT_ENVIRONMENT=true;host=document.createElement('div');document.body.append(host);root=createRoot(host);});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();});
async function render(value=trip(),props:any={}){await act(async()=>root.render(<OperationalTripActions trip={value} roles={roles} busy={false} onCommand={async()=>undefined} {...props}/>));}
const button=(command:string)=>host.querySelector<HTMLButtonElement>(`[data-trip-command="${command}"]`);
async function change(selector:string,value:string){await act(async()=>{const e=host.querySelector<HTMLInputElement>(selector)!;Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')!.set!.call(e,value);e.dispatchEvent(new Event('input',{bubbles:true}));});}
const profiles=['DUAL_WEIGHBRIDGE','LOADING_SCALE_ONLY','UNLOADING_SCALE_ONLY','NO_WEIGHBRIDGE'];
it.each(profiles)('%s renders origin measurement only when snapshot requires it',async profile=>{const v=trip(profile,'LOADING');await render(v);const measured=['DUAL_WEIGHBRIDGE','LOADING_SCALE_ONLY'].includes(profile);expect(Boolean(button('RECORD_ORIGIN_WEIGHT'))).toBe(measured);expect(host.querySelectorAll('[data-measurement]')).toHaveLength(measured?3:0);if(!measured)expect(button('START_TRANSIT')).not.toBeNull();});
it.each(profiles)('%s renders destination measurement only when snapshot requires it',async profile=>{await render(trip(profile,'AT_DESTINATION'));const measured=['DUAL_WEIGHBRIDGE','UNLOADING_SCALE_ONLY'].includes(profile);expect(Boolean(button('RECORD_DESTINATION_WEIGHT'))).toBe(measured);expect(host.querySelectorAll('[data-measurement]')).toHaveLength(measured?3:0);if(!measured)expect(button('COMPLETE_UNLOADING')).not.toBeNull();});
it.each(['PRELOADED_ROSTER','ON_FIRST_OPERATION','MIXED'])('%s shows guided explicit driver association and keeps payload unchanged',async intake=>{const send=vi.fn(async()=>undefined);await render(trip('NO_WEIGHBRIDGE','DISPATCHED',intake),{onCommand:send});expect(host.textContent).toContain('ui2.intake.'+intake);expect(button('ASSOCIATE_DRIVER')!.disabled).toBe(true);await change('[data-driver-id]','Driver Name');expect(button('ASSOCIATE_DRIVER')!.disabled).toBe(true);await change('[data-driver-id]','DRV-123');await act(async()=>button('ASSOCIATE_DRIVER')!.click());expect(send).toHaveBeenCalledExactlyOnceWith('ASSOCIATE_DRIVER',{driverId:'DRV-123'});expect(host.textContent).not.toContain('ui2.driver_confirmed');});
it('uses authorized fleet options without inventing identity from name',async()=>{const send=vi.fn(async()=>undefined);await render(trip(),{driverOptions:[{id:'CANONICAL-D',name:'Known Driver'}],onCommand:send});const s=host.querySelector('select')!;expect(s.textContent).toContain('Known Driver');await act(async()=>{s.value='CANONICAL-D';s.dispatchEvent(new Event('change',{bubbles:true}));});await act(async()=>button('ASSOCIATE_DRIVER')!.click());expect(send).toHaveBeenCalledWith('ASSOCIATE_DRIVER',{driverId:'CANONICAL-D'});});
it('retains accepted driver details and hides association controls',async()=>{await render({...trip(),driverId:'D',driverSnapshot:{fullNameAr:'Confirmed Driver'}});expect(host.textContent).toContain('Confirmed Driver');expect(host.querySelector('bdi[dir="ltr"]')!.textContent).toBe('D');expect(button('ASSOCIATE_DRIVER')).toBeNull();});
it.each(['VIEWER','DRIVER','SCALE_OPERATOR'])('%s cannot associate a driver',async role=>{await render(trip(),{roles:[role]});expect(button('ASSOCIATE_DRIVER')).toBeNull();expect(host.textContent).toContain('ui2.driver_restricted');});
it('canonical timestamps alone confirm checkpoint milestones; a later state does not invent skipped origin/loading',()=>{const v=trip('NO_WEIGHBRIDGE','IN_TRANSIT');const stages=tripTimeline(v,roles);expect(stages.find(s=>s.id==='origin')!.state).toBe('not_recorded');expect(stages.find(s=>s.id==='loading')!.state).toBe('not_recorded');expect(stages.find(s=>s.id==='transit')!.state).toBe('current');expect(stages.every(s=>s.timestamp===undefined)).toBe(true);v.operationalTimeline={loadingCompletedAt:'2026-11-14T01:00:00Z'};expect(tripTimeline(v,roles).find(s=>s.id==='loading')).toMatchObject({state:'confirmed',timestamp:'2026-11-14T01:00:00Z'});});
it('does not invent a completion timestamp from canonical COMPLETED status',()=>{const s=tripTimeline(trip('NO_WEIGHBRIDGE','COMPLETED'),roles).find(s=>s.id==='completion')!;expect(s).toEqual({id:'completion',state:'confirmed',timestamp:undefined});});
it('required loading confirmations restrict departure through the existing policy',async()=>{const v=trip('NO_WEIGHBRIDGE','LOADING');v.operationalSnapshot!.configuration.requiredCheckpoints=['loadingStartedAt','loadingCompletedAt'];await render(v);expect(button('START_TRANSIT')).toBeNull();expect(button('COMPLETE_LOADING')).not.toBeNull();expect(host.textContent).toContain('ui2.missing');v.operationalTimeline={loadingStartedAt:'2026-11-14T00:00:00Z',loadingCompletedAt:'2026-11-14T00:01:00Z'};await render({...v});expect(button('START_TRANSIT')).not.toBeNull();});
it('missing required unloading checkpoint blocks completion and explains administrator review',async()=>{const v=trip('NO_WEIGHBRIDGE','OFFLOADED');v.operationalSnapshot!.configuration.requiredCheckpoints=['unloadingStartedAt'];await render(v);expect(button('COMPLETE_TRIP')).toBeNull();expect(host.textContent).toContain('ui2.checkpoint_blocked');expect(host.textContent).toContain('ui2.checkpoint.unloadingStartedAt');});
it('multiple legal origin choices never claim a single mandatory route',async()=>{await render(trip());expect(host.querySelectorAll('[data-primary="true"]')).toHaveLength(0);expect(host.textContent).toContain('ui2.choices');expect(button('ARRIVE_ORIGIN')).not.toBeNull();expect(button('START_LOADING')).not.toBeNull();expect(button('START_TRANSIT')).not.toBeNull();});
it('a driver has one dominant arrival action only in transit',async()=>{await render(trip('NO_WEIGHBRIDGE','IN_TRANSIT'),{roles:['DRIVER']});expect(button('RECORD_ARRIVAL')!.dataset.primary).toBe('true');expect(host.querySelectorAll('[data-primary="true"]')).toHaveLength(1);});
it('does not impose loading completion before weight or unloading start before weight when optional',async()=>{await render(trip('DUAL_WEIGHBRIDGE','LOADING'));expect(button('COMPLETE_LOADING')).not.toBeNull();expect(button('RECORD_ORIGIN_WEIGHT')).not.toBeNull();expect(host.textContent).toContain('ui2.choices');await render(trip('DUAL_WEIGHBRIDGE','AT_DESTINATION'));expect(button('START_UNLOADING')).not.toBeNull();expect(button('RECORD_DESTINATION_WEIGHT')).not.toBeNull();});
it.each(['CANCELLED','REJECTED','COMPLETED'])('%s has no progression or association',async status=>{await render(trip('NO_WEIGHBRIDGE',status));expect(host.querySelectorAll('[data-trip-command]')).toHaveLength(0);expect(host.textContent).toContain('ui2.terminal');});
it('financial finalization blocks all operational actions',()=>{const v=trip();v.financials.isFinalized=true;expect(operationalActionPresentation(v,roles).allowed).toEqual([]);});
it('malformed measurement facts fail closed instead of crashing or showing an eligible action',async()=>{const v=trip('DUAL_WEIGHBRIDGE','WEIGHED_ORIGIN');v.weights.originNetKg='NaN';await render(v);expect(host.textContent).toContain('ui2.invalid');expect(host.querySelectorAll('[data-primary="true"]')).toHaveLength(0);});
it.each([['','1'],['-1','2'],['1','1'],['2','1'],['1','Infinity'],['NaN','2'],['0','0']])('rejects invalid tare %s / gross %s before submission',(a,b)=>expect(validMeasurement(a,b)).toBe(false));
it.each([['0','1'],['10000.5','30000.75']])('accepts finite tare %s / gross %s',(a,b)=>expect(validMeasurement(a,b)).toBe(true));
it.each(['origin','destination'])('%s form labels kg, validates values and preserves command payload',async side=>{const send=vi.fn(async()=>undefined);await render(trip('DUAL_WEIGHBRIDGE',side==='origin'?'LOADING':'AT_DESTINATION'),{onCommand:send});const name=side==='origin'?'RECORD_ORIGIN_WEIGHT':'RECORD_DESTINATION_WEIGHT';expect(button(name)!.disabled).toBe(true);expect(host.querySelector('legend')!.textContent).toBe(`ui2.${side}_measurement`);await change('[data-measurement="tare"]','-1');await change('[data-measurement="gross"]','2');expect(button(name)!.disabled).toBe(true);await change('[data-measurement="tare"]','0');await change('[data-measurement="gross"]','30000.75');await change('[data-measurement="ticket"]','0012');expect(host.querySelector('label')!.textContent).toBe('op.tare');await act(async()=>button(name)!.click());expect(send).toHaveBeenCalledExactlyOnceWith(name,{[side+'TareKg']:0,[side+'GrossKg']:30000.75,[side+'TicketNo']:'0012'});});
it('a click is submitting, not a confirmed milestone, and local duplicate clicks are fenced',async()=>{let finish!:(v:unknown)=>void;const send=vi.fn(()=>new Promise(r=>finish=r));await render(trip('NO_WEIGHBRIDGE','IN_TRANSIT'),{onCommand:send});const before=host.querySelector('[data-testid="ui2-timeline"]')!.innerHTML;await act(async()=>{button('RECORD_ARRIVAL')!.click();button('RECORD_ARRIVAL')!.click();});expect(send).toHaveBeenCalledOnce();expect(host.textContent).toContain('ui2.submitting');expect(host.querySelector('[data-testid="ui2-timeline"]')!.innerHTML).toBe(before);await act(async()=>finish(undefined));expect(host.querySelector('[data-testid="ui2-timeline"]')!.innerHTML).toBe(before);});
it('pending original receipt restores frozen inputs and prevents replacement intent',async()=>{const send=vi.fn();const draft:any={operationId:'ORIGINAL',payload:{payload:{originTareKg:10000,originGrossKg:30000,originTicketNo:'0012'}}};await render(trip('DUAL_WEIGHBRIDGE','LOADING'),{draft,onCommand:send});expect(host.textContent).toContain('ui2.awaiting');expect(host.querySelector<HTMLInputElement>('[data-measurement="ticket"]')!.value).toBe('0012');expect(Array.from(host.querySelectorAll('input,button,select')).every(e=>(e as HTMLInputElement).disabled)).toBe(true);expect(send).not.toHaveBeenCalled();});
it('read unavailable freezes inputs and commands without erasing confirmed timeline',async()=>{await render(trip('NO_WEIGHBRIDGE','IN_TRANSIT'),{busy:true});expect(button('RECORD_ARRIVAL')!.disabled).toBe(true);expect(host.textContent).toContain('ui2.read_or_operation_pending');expect(host.querySelector('[data-stage="transit"]')!.getAttribute('data-state')).toBe('current');});
it('rejected command is a safe error, never optimistic completion',async()=>{await render(trip('NO_WEIGHBRIDGE','IN_TRANSIT'),{onCommand:async()=>{throw Error('private-details');}});await act(async()=>button('RECORD_ARRIVAL')!.click());expect(host.querySelector('[role="alert"]')!.textContent).toContain('ui2.failed');expect(host.textContent).not.toContain('private-details');expect(host.querySelector('[data-stage="destination"]')!.getAttribute('data-state')).not.toBe('confirmed');});
it('existing-ID validation cannot infer driver from a name',()=>{expect(validExistingDriverId('Driver Name')).toBe(false);expect(validExistingDriverId('ALL')).toBe(false);expect(validExistingDriverId('سائق')).toBe(false);expect(validExistingDriverId('DRV-123')).toBe(true);});
it('AR/EN/UR UI2 catalogs have complete nonempty parity',()=>{const keys=Object.keys(dictionaries.en).filter(k=>k.startsWith('ui2.'));expect(keys.length).toBeGreaterThan(40);for(const locale of ['ar','en','ur'] as const){expect(Object.keys(dictionaries[locale]).filter(k=>k.startsWith('ui2.')).sort()).toEqual(keys.sort());for(const k of keys)expect(dictionaries[locale][k]?.trim()).toBeTruthy();}});

it.each([
 ['SCALE_OPERATOR','DISPATCHED',['START_LOADING']],
 ['SCALE_OPERATOR','LOADING',['RECORD_ORIGIN_WEIGHT']],
 ['SCALE_OPERATOR','IN_TRANSIT',['RECORD_ARRIVAL']],
 ['DRIVER','IN_TRANSIT',['RECORD_ARRIVAL']],
 ['DRIVER','OFFLOADED',[]],
 ['DISPATCHER','OFFLOADED',[]],
 ['PROJECT_ADMIN','OFFLOADED',['COMPLETE_TRIP']],
 ['VIEWER','LOADING',[]]
] as const)('%s at %s sees only its permitted next actions',(role,status,expected)=>{const value=trip('DUAL_WEIGHBRIDGE',status);if(status==='OFFLOADED')value.weights={originNetKg:20000,destinationNetKg:20000};expect(operationalActionPresentation(value,[role]).allowed).toEqual(expected);});

// Timeline truthfulness: dispatch is not evidence of origin arrival.
it.each(profiles)('%s DISPATCHED confirms dispatch without claiming current or completed origin',profile=>{
 const steps=tripTimeline(trip(profile),roles);
 expect(steps.find(s=>s.id==='dispatch')).toEqual({id:'dispatch',state:'confirmed',timestamp:undefined});
 expect(steps.find(s=>s.id==='origin')).toEqual({id:'origin',state:'next',timestamp:undefined});
 expect(steps.filter(s=>s.state==='current')).toEqual([]);
 expect(steps.every(s=>s.timestamp===undefined)).toBe(true);
 expect(steps.find(s=>s.id==='completion')!.state).toBe('pending');
});
it.each(profiles)('%s dispatched choices remain legitimate alternatives without invented arrival',async profile=>{
 await render(trip(profile));
 expect(host.querySelector('[data-stage="origin"]')!.getAttribute('data-state')).toBe('next');
 expect(host.querySelector('[data-stage="origin"]')!.hasAttribute('aria-current')).toBe(false);
 expect(button('ARRIVE_ORIGIN')).not.toBeNull();expect(button('START_LOADING')).not.toBeNull();
 const direct=['UNLOADING_SCALE_ONLY','NO_WEIGHBRIDGE'].includes(profile);
 expect(Boolean(button('START_TRANSIT'))).toBe(direct);
 expect(host.querySelector('[data-stage="transit"]')!.getAttribute('data-state')).toBe(direct?'next':'pending');
 expect(host.textContent).toContain('ui2.choices');expect(host.querySelectorAll('[data-primary="true"]')).toHaveLength(0);
});
it.each(['UNLOADING_SCALE_ONLY','NO_WEIGHBRIDGE'])('%s direct transit preserves unrecorded optional origin/loading',profile=>{
 const value=trip(profile,'IN_TRANSIT');value.operationalTimeline={departedAt:'2026-11-14T00:00:00Z'};
 const steps=tripTimeline(value,roles);
 expect(steps.find(s=>s.id==='origin')).toEqual({id:'origin',state:'not_recorded',timestamp:undefined});
 expect(steps.find(s=>s.id==='loading')).toEqual({id:'loading',state:'not_recorded',timestamp:undefined});
 expect(steps.find(s=>s.id==='transit')!.state).toBe('current');
 expect(steps.find(s=>s.id==='dispatch')!.state).toBe('confirmed');
});
it.each(profiles)('%s canonical AT_ORIGIN remains confirmed without an invented arrival timestamp',profile=>{
 const steps=tripTimeline(trip(profile,'AT_ORIGIN'),roles);
 expect(steps.find(s=>s.id==='origin')).toEqual({id:'origin',state:'confirmed',timestamp:undefined});
 expect(steps.find(s=>s.id==='dispatch')!.state).toBe('confirmed');
 expect(steps.find(s=>s.id==='loading')!.state).toBe('next');
});
it.each(profiles)('%s actual loading status retains current and pending stage semantics',profile=>{
 const steps=tripTimeline(trip(profile,'LOADING'),roles);
 expect(steps.find(s=>s.id==='loading')!.state).toBe('current');
 expect(steps.find(s=>s.id==='origin')!.state).toBe('not_recorded');
 expect(steps.find(s=>s.id==='completion')!.state).toBe('pending');
});
it.each(profiles)('%s confirmed completion retains recorded facts and optional bypass truthfulness',profile=>{
 const value=trip(profile,'COMPLETED');value.operationalTimeline={completedAt:'2026-11-14T01:00:00Z'};
 const steps=tripTimeline(value,roles);
 expect(steps.find(s=>s.id==='completion')).toEqual({id:'completion',state:'confirmed',timestamp:'2026-11-14T01:00:00Z'});
 expect(steps.find(s=>s.id==='origin')!.state).toBe('not_recorded');
 expect(steps.find(s=>s.id==='dispatch')!.state).toBe('confirmed');
});
it('Origin is pending rather than next when this role cannot ARRIVE_ORIGIN',()=>{
 const steps=tripTimeline(trip(),['SCALE_OPERATOR']);
 expect(steps.find(s=>s.id==='origin')).toEqual({id:'origin',state:'pending',timestamp:undefined});
 expect(steps.find(s=>s.id==='loading')!.state).toBe('next');
});
