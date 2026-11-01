// @vitest-environment happy-dom
import React,{act} from 'react';
import {createRoot} from 'react-dom/client';
import {beforeEach,afterEach,describe,it,expect,vi} from 'vitest';
const f=vi.hoisted(()=>({configure:vi.fn(),send:vi.fn(),drain:vi.fn(),recover:vi.fn(),authorize:vi.fn()}));
vi.mock('../i18n',()=>({useI18n:()=>({t:(key:string)=>key,isRTL:false})}));
vi.mock('../services/project.service',()=>({projectService:{configureOperations:f.configure}}));
vi.mock('../services/workspace.service',()=>({clientWorkspaceService:{drainPendingWorkspace:f.drain,requestGoogleScopes:f.authorize,recoverWorkspaceAutomation:f.recover}}));
vi.mock('../services/tripCommandClient.service',()=>({sendTripCommand:f.send}));
vi.mock('../repositories/trip.repository',()=>({tripRepository:{subscribeByProject:(_p:string,cb:Function)=>{cb([]);return()=>{};}}}));
vi.mock('../repositories/pricingRule.repository',()=>({pricingRuleRepository:{subscribeByProject:(_p:string,cb:Function)=>{cb([{pricingRuleId:'R',projectId:'P1',carrierId:'C',materialId:'M',pricingModel:'PER_TRIP',baseRateSAR:10,status:'ACTIVE',effectiveFrom:'2020-01-01',effectiveTo:'2099-01-01'}]);return()=>{};}}}));
vi.mock('../services/projectReadTransport',()=>({canonicalProjectRead:async()=>({projectId:'P1',rows:[{truckId:'T',plateNumber:'Truck',carrierId:'C',carrierName:'Carrier',driverId:null,materialId:'M'}]})}));
import {OperationalConfigurationForm} from '../components/wizard/OperationalConfigurationForm';
import {AdaptiveOperationsView} from '../components/field/AdaptiveOperationsView';
import {WorkspaceAutomationRecovery} from '../components/wizard/WorkspaceAutomationRecovery';
import {useUserActiveWorkspaceSync} from '../hooks/useUserActiveWorkspaceSync';
import {operationConfig,operationActor} from './helpers/operationalProfileFixture';
let host:HTMLDivElement,root:ReturnType<typeof createRoot>;
const project=()=>({projectId:'P1',version:1,nameAr:'Project',status:'SETUP',operationalConfiguration:operationConfig()}) as any;
beforeEach(()=>{vi.clearAllMocks();(globalThis as any).IS_REACT_ACT_ENVIRONMENT=true;host=document.createElement('div');document.body.append(host);root=createRoot(host);f.configure.mockResolvedValue(undefined);f.send.mockResolvedValue({success:true});f.drain.mockResolvedValue(undefined);f.recover.mockResolvedValue({});f.authorize.mockResolvedValue('fixture');});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();vi.useRealTimers();});
const click=async(label:string)=>{const btn=Array.from(host.querySelectorAll('button')).find(e=>e.textContent===label)!;expect(btn).toBeDefined();await act(async()=>btn.click());};
const change=async(element:HTMLSelectElement|HTMLInputElement,value:string)=>{await act(async()=>{const setter=Object.getOwnPropertyDescriptor(element instanceof HTMLSelectElement?HTMLSelectElement.prototype:HTMLInputElement.prototype,'value')!.set!;setter.call(element,value);element.dispatchEvent(new Event(element instanceof HTMLSelectElement?'change':'input',{bubbles:true}));});};
describe('adaptive project UX uses protected authorities',()=>{
 it('saves independent capabilities and owner intake choice through versioned Project command',async()=>{await act(async()=>root.render(<OperationalConfigurationForm project={project()} canEdit/>));const selects=host.querySelectorAll('select');await change(selects[0],'NONE');await change(selects[1],'WEIGHBRIDGE');await change(selects[2],'ON_FIRST_OPERATION');await click('op.save');expect(f.configure).toHaveBeenCalledWith('P1',expect.objectContaining({loadingMeasurementMode:'NONE',unloadingMeasurementMode:'WEIGHBRIDGE',driverIntakeMode:'ON_FIRST_OPERATION'}),1,false);});
 it('does not grant editing authority through the form',async()=>{await act(async()=>root.render(<OperationalConfigurationForm project={project()} canEdit={false}/>));expect(Array.from(host.querySelectorAll('input,select,button')).every(e=>(e as HTMLInputElement).disabled)).toBe(true);});
 it('dispatches canonical first-operation fleet with null Driver, never a fake identity',async()=>{await act(async()=>root.render(<AdaptiveOperationsView project={project()} authContext={operationActor}/>));await change(host.querySelector('select')!,'T');await click('op.DISPATCH_TRIP');expect(f.send).toHaveBeenCalledWith('P1','DISPATCH_TRIP',{truckId:'T',carrierId:'C',materialId:'M',driverId:null,pricingRuleId:'R'},expect.any(String),undefined);expect(host.textContent).toContain('op.driver_unknown');});
 it('preloaded intake cannot dispatch a driverless fleet row',async()=>{const p=project();p.operationalConfiguration.driverIntakeMode='PRELOADED_ROSTER';await act(async()=>root.render(<AdaptiveOperationsView project={p} authContext={operationActor}/>));expect(host.querySelector('option[value="T"]')).toBeNull();expect((Array.from(host.querySelectorAll('button')).find(e=>e.textContent==='op.DISPATCH_TRIP') as HTMLButtonElement).disabled).toBe(true);});
 it('explicit Script recovery sends supplied ID only after requesting automation authorization',async()=>{const done=vi.fn();await act(async()=>root.render(<WorkspaceAutomationRecovery projectId="P1" onRecovered={done}/>));await change(host.querySelector('input')!,'existing-script');await click('op.recover');expect(f.authorize).toHaveBeenCalledWith(true);expect(f.recover).toHaveBeenCalledWith('P1','existing-script');expect(done).toHaveBeenCalledOnce();});
});
describe('owner-approved user-active synchronization',()=>{
 function Hook({role='PROJECT_ADMIN',ids=['P1']}:{role?:string;ids?:string[]}){useUserActiveWorkspaceSync([project()],{...operationActor,role,assignedProjectIds:ids});return null;}
 it('requests canonical drain on activity with throttle, no scheduled worker, and cleans up on scope removal',async()=>{vi.useFakeTimers();vi.setSystemTime(new Date('2026-11-01T00:00:00Z'));await act(async()=>root.render(<Hook/>));expect(f.drain).toHaveBeenCalledWith('P1');await act(async()=>window.dispatchEvent(new Event('focus')));expect(f.drain).toHaveBeenCalledTimes(1);vi.advanceTimersByTime(61000);await act(async()=>window.dispatchEvent(new Event('pointerdown')));expect(f.drain).toHaveBeenCalledTimes(2);await act(async()=>root.render(<Hook ids={[]}/>));vi.advanceTimersByTime(61000);await act(async()=>window.dispatchEvent(new Event('focus')));expect(f.drain).toHaveBeenCalledTimes(2);});
 it('operational role cannot gain Google administrator delivery authority',async()=>{await act(async()=>root.render(<Hook role="DISPATCHER"/>));expect(f.drain).not.toHaveBeenCalled();});
});

it('automation recovery with connected durable authority does not request a browser token',async()=>{const done=vi.fn();await act(async()=>root.render(<WorkspaceAutomationRecovery projectId="P1" durableAuthorization onRecovered={done}/>));await change(host.querySelector('input')!,'existing-script');await click('op.recover');expect(f.authorize).not.toHaveBeenCalled();expect(f.recover).toHaveBeenCalledWith('P1','existing-script');expect(done).toHaveBeenCalledOnce();});
