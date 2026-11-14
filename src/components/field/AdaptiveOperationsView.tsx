import React,{useEffect,useMemo,useRef,useState} from 'react';
import type {ProjectEntity,TripEntity,PricingRuleEntity} from '../../types/entities';
import type {AuthUserContext} from '../../types/common';
import type {ProjectFleetReadModelResponse} from '../../types/projectFleetReadModel';
import {canonicalProjectRead} from '../../services/projectReadTransport';
import {tripRepository} from '../../repositories/trip.repository';
import {pricingRuleRepository} from '../../repositories/pricingRule.repository';
import {PricingService,canonicalPricingRule} from '../../services/pricing.service';
import {durableTripCommand,pendingTripOperations,recoverTripOperation} from '../../services/durableTripCommandClient.service';
import {outboxService} from '../../services/offline/outbox.service';
import type {OutboxOperation} from '../../types/offline';
import {canExecuteTripCommand,type TripCommandName} from '../../types/tripCommands';
import {resolveRequiredTripFields} from '../../services/operationalProfileResolver';
import {profileTripRow} from '../../services/operationalReporting';
import {tripCommandErrorKey} from '../../i18n/tripCommandErrors';
import {fleetEntryBlocker,tripEntryTarget} from '../../utils/tripEntryPresentation';
import {TripEntryNotice,tripEntryControl,tripEntryAction} from './TripEntryNotice';
import {useI18n} from '../../i18n';
import {OperationalTripActions} from './OperationalTripActions';

type Props={project:ProjectEntity;authContext:AuthUserContext;onManageRoster?:()=>void};
type ReadState='LOADING'|'READY'|'ERROR'|'DENIED';
/** Remount before painting a different principal/project; in-flight callbacks are also fenced. */
export function AdaptiveOperationsView(props:Props){
 const scope=JSON.stringify([props.project.projectId,props.project.status,props.project.operationalConfiguration,props.authContext.userId,props.authContext.role,props.authContext.linkedDriverId,[...(props.authContext.assignedProjectIds||[])].sort()]);
 return <TripEntryWorkspace key={scope} {...props}/>;
}
function TripEntryWorkspace({project,authContext,onManageRoster}:Props){
 const {t,direction}=useI18n();
 const [trips,setTrips]=useState<TripEntity[]>([]),[fleet,setFleet]=useState<ProjectFleetReadModelResponse|null>(null),[rules,setRules]=useState<PricingRuleEntity[]>([]);
 const [truck,setTruck]=useState(''),[selected,setSelected]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const [fleetState,setFleetState]=useState<ReadState>('LOADING'),[pricingState,setPricingState]=useState<ReadState>('LOADING'),[tripState,setTripState]=useState<ReadState>('LOADING'),[pendingState,setPendingState]=useState<ReadState>('LOADING');
 const [pendingOperations,setPendingOperations]=useState<OutboxOperation[]>([]),[revision,setRevision]=useState(0);
 const [confirmation,setConfirmation]=useState<{tripId:string;operationId:string}|null>(null);
 const alive=useRef(true),submitting=useRef(false),selectedRef=useRef(selected),refreshPending=useRef<()=>Promise<void>>(async()=>{});
 selectedRef.current=selected;
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 useEffect(()=>{
  let active=true,read=0,pricingRead=0;
  setFleet(null);setFleetState('LOADING');setPricingState('LOADING');setTripState('LOADING');setPendingState('LOADING');
  const classify=(e:unknown):ReadState=>{const code=String((e as any)?.code||(e as Error)?.message||'');return code.startsWith('FORBIDDEN')||['UNAUTHENTICATED','ACCOUNT_NOT_ACTIVE','INVALID_ACCOUNT_PROFILE'].includes(code)?'DENIED':'ERROR';};
  const loadPending=async()=>{const generation=++read;try{const operations=await pendingTripOperations(project.projectId,authContext.userId);if(!active||generation!==read)return;setPendingOperations(operations);setPendingState('READY');
    const first=operations[0];if(first?.payload.tripId)setSelected(first.payload.tripId);else if(first?.payload.payload?.truckId)setTruck(first.payload.payload.truckId);
    if(!first&&!selectedRef.current){const ack=(await outboxService.getOperations()).filter(op=>op.projectId===project.projectId&&op.userId===authContext.userId&&op.operationType==='TRIP_COMMAND'&&op.status==='SYNCED'&&op.serverAck?.canonicalTrip).sort((a,b)=>b.createdAt.localeCompare(a.createdAt))[0];
     if(active&&generation===read&&ack?.serverAck?.canonicalTrip?.projectId===project.projectId){const value=ack.serverAck.canonicalTrip;setTrips(old=>old.some(v=>v.tripId===value.tripId)?old:[...old,value]);setSelected(value.tripId);if(ack.payload.command==='DISPATCH_TRIP')setConfirmation({tripId:value.tripId,operationId:ack.operationId});}}
   }catch(e){if(active&&generation===read)setPendingState(classify(e));}};
  refreshPending.current=loadPending;
  const stopOutbox=outboxService.subscribe(()=>{void loadPending();});void loadPending();
  void canonicalProjectRead<ProjectFleetReadModelResponse>(project.projectId,'fleet-read-model').then(data=>{if(!active)return;if(data.projectId!==project.projectId||!Array.isArray(data.rows))throw Error('INVALID_FLEET_READ');setFleet(data);setFleetState('READY');}).catch(e=>{if(active){setFleet(null);setFleetState(classify(e));}});
  const loadPricing=async()=>{const generation=++pricingRead;setPricingState('LOADING');try{const data=await pricingRuleRepository.listByProject(project.projectId);if(active&&generation===pricingRead){setRules(data);setPricingState('READY');}}catch(e){if(active&&generation===pricingRead){setRules([]);setPricingState(classify(e));}}};
  void loadPricing();window.addEventListener('pricing-rules-updated',loadPricing);
  const unsubTrips=tripRepository.subscribeByProject(project.projectId,data=>{if(active){setTrips(old=>data.filter(value=>value.projectId===project.projectId).map(value=>{const prior=old.find(v=>v.tripId===value.tripId);return prior&&(prior.version??0)>(value.version??0)?prior:value;}));setTripState('READY');}},()=>{if(active)setTripState('ERROR');});
  return()=>{active=false;read++;pricingRead++;stopOutbox();unsubTrips();window.removeEventListener('pricing-rules-updated',loadPricing);};
 },[project.projectId,authContext.userId,revision]);
 const required=project.operationalConfiguration?resolveRequiredTripFields(project.operationalConfiguration):null;
 const row=fleet?.rows.find(r=>r.truckId===truck),trip=trips.find(v=>v.tripId===selected&&v.operationalSnapshot&&(authContext.role!=='DRIVER'||v.driverId===authContext.linkedDriverId));
 const rule=useMemo(()=>row?new PricingService().resolvePricingRuleFromList(rules.map(canonicalPricingRule),{projectId:project.projectId,carrierId:row.carrierId,materialId:row.materialId,tripDate:new Date().toISOString()}):null,[rules,row,project.projectId]);
 const canDispatch=canExecuteTripCommand(authContext.role,'DISPATCH_TRIP') && (authContext.role==='SUPER_ADMIN'||Boolean(authContext.assignedProjectIds?.includes(project.projectId)));
 const blockers:string[]=[];
 if(project.status!=='ACTIVE')blockers.push('ui1.block.active');
 if(!required)blockers.push('ui1.block.configuration');
 if(!canDispatch)blockers.push('ui1.block.permission');
 for(const [kind,state] of [['fleet',fleetState],['pricing',pricingState],['pending',pendingState]] as const){if(state!=='READY')blockers.push(`ui1.block.${kind}_${state.toLowerCase()}`);}
 if(fleetState==='READY'){if(!fleet?.rows.length)blockers.push('ui1.block.fleet_empty');else{const reason=fleetEntryBlocker(row,required?.driver||false);if(reason)blockers.push(reason);}}
 if(row&&pricingState==='READY'&&!rule?.rule)blockers.push(rule?.status==='AMBIGUOUS'?'ui1.block.pricing_ambiguous':'ui1.block.pricing');
 if(pendingOperations.length)blockers.push('ui1.block.pending');
 const confirmedTrip=confirmation&&trips.find(v=>v.tripId===confirmation.tripId);
 function applyTrip(value:TripEntity,operationId:string,isDispatch:boolean){
  if(!value?.tripId||!value.status||!operationId||value.projectId!==project.projectId)throw Error('ACK_SCOPE_MISMATCH');
  setTrips(old=>{const previous=old.find(v=>v.tripId===value.tripId);return previous&&(previous.version??0)>(value.version??0)?old:[...old.filter(v=>v.tripId!==value.tripId),value];});setSelected(value.tripId);
  if(isDispatch)setConfirmation({tripId:value.tripId,operationId});
 }
 function explain(e:any){const code=e?.code||e?.message||'';return ['TRIP_REVISION_CONFLICT','TRIP_STATE_CONFLICT'].includes(code)?'ui1.error.revision':['OUTBOX_INTENT_CONFLICT','OUTBOX_OPERATION_CONFLICT','TRIP_COMMAND_CONFLICT'].includes(code)?'ui1.error.conflict':code==='RECEIPT_REQUIRED'?'ui1.awaiting':tripCommandErrorKey(code)||'ui1.error.failed';}
 async function command(name:TripCommandName,payload:Record<string,unknown>={},id?:string){
  if(submitting.current||name==='DISPATCH_TRIP'&&blockers.length)return;
  submitting.current=true;setBusy(true);setError('');if(name==='DISPATCH_TRIP')setConfirmation(null);
  try{const result=await durableTripCommand(project.projectId,authContext.userId,name,payload,id,id?trip?.version:0);if(!alive.current)return;applyTrip(result.trip,result.operationId,name==='DISPATCH_TRIP');return result;}
  catch(e){if(alive.current)setError(explain(e));}finally{if(alive.current){await refreshPending.current();if(alive.current)setBusy(false);}submitting.current=false;}
 }
 async function recover(operation:OutboxOperation){
  if(submitting.current)return;submitting.current=true;setBusy(true);setError('');
  try{const result=await recoverTripOperation(operation,authContext.userId);if(alive.current)applyTrip(result.trip,result.operationId,operation.payload.command==='DISPATCH_TRIP');}
  catch(e){if(alive.current)setError(explain(e));}finally{if(alive.current){await refreshPending.current();if(alive.current)setBusy(false);}submitting.current=false;}
 }
 let delayStatus='UNKNOWN';try{if(trip)delayStatus=String(profileTripRow(trip).delayStatus);}catch{/* Invalid canonical facts are explained by the action panel; never synthesize metrics. */}
 const canManage=Boolean(onManageRoster&&tripEntryTarget(authContext,project,'FLEET'));
 return <section dir={direction} className="min-w-0 space-y-5 rounded-2xl border border-stone-700 bg-stone-950 p-4 sm:p-6 text-stone-100 leading-relaxed" aria-label={t('ui1.title')}>
  <header className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-xl font-bold">{t('ui1.title')}</h2><p className="text-sm text-stone-300">{project.nameAr} · {t('ui1.help')}</p><p className="text-sm text-stone-300">{t('rb2.project_status')}: {project.status==='ACTIVE'?t('setup.status.ACTIVE'):<bdi dir="ltr">{project.status}</bdi>}</p></div>
   {canManage?<button className={tripEntryAction} type="button" onClick={onManageRoster}>{t('op.manage_roster')}</button>:<p className="text-sm text-stone-400">{t('ui1.manage_handoff')}</p>}
  </header>
  {pendingOperations.length>0&&<TripEntryNotice id="ui1-recovery"><div data-testid="adaptive-receipt-recovery"><h3 className="font-bold">{t(pendingOperations.some(op=>op.payload.command==='DISPATCH_TRIP')?'ui1.awaiting':'offline.recovery.awaiting_receipt')}</h3><p>{t('ui1.recovery_help')}</p>{pendingOperations.map(op=><div key={op.operationId} className="mt-3 flex flex-wrap items-center gap-3"><bdi dir="ltr" className="break-all text-xs">{op.operationId}</bdi><button className={tripEntryAction} type="button" disabled={busy} onClick={()=>void recover(op)}>{t('ui1.recover')}</button></div>)}</div></TripEntryNotice>}
  {error&&<TripEntryNotice tone="error">{t(error)}</TripEntryNotice>}
  {confirmedTrip&&<TripEntryNotice tone="success"><div data-testid="ui1-confirmation"><h3 className="font-bold">{t('ui1.confirmed')}</h3><p>{t(confirmedTrip.tripNumber?'ui1.trip_number':'ui1.canonical_id')}: <bdi dir="ltr">{confirmedTrip.tripNumber||confirmedTrip.tripId}</bdi></p><p>{t('op.truck')}: {confirmedTrip.truckSnapshot?.plateNumberAr||t('ui1.name_unavailable')} · {t('op.driver')}: {confirmedTrip.driverSnapshot?.fullNameAr||t('op.driver_unknown')}</p><p>{t('ui1.current_status')}: {t(`op.${confirmedTrip.status}`)}</p><p>{t('ui1.confirmation_help')}</p><button className={tripEntryAction} type="button" onClick={()=>{setSelected(confirmedTrip.tripId);document.getElementById('ui1-current-trip')?.focus();}}>{t('ui1.continue')}</button></div></TripEntryNotice>}
  <section aria-labelledby="ui1-new-title" className="space-y-4 rounded-xl border border-stone-700 p-4"><h3 id="ui1-new-title" className="text-lg font-bold">{t('ui1.new_trip')}</h3><p className="text-sm text-stone-300">{t('ui1.dispatch_help')}</p>
   <div className="block space-y-2"><label htmlFor="ui1-truck"><span>{t('op.truck')}</span></label><select id="ui1-truck" className={tripEntryControl} value={truck} disabled={!canDispatch||busy||pendingOperations.length>0||fleetState!=='READY'} onChange={e=>setTruck(e.target.value)}><option value="">{t('op.choose')}</option>{fleet?.rows.map(r=><option key={r.truckId} value={r.truckId}>{r.plateNumber||t('ui1.name_unavailable')} · {r.carrierName||t('ui1.name_unavailable')}{fleetEntryBlocker(r,required?.driver||false)?` — ${t(fleetEntryBlocker(r,required?.driver||false)!)}`:''}</option>)}</select></div>
   {row&&<dl className="grid gap-3 sm:grid-cols-2">{[['op.truck',row.plateNumber,row.truckId],['ui1.carrier',row.carrierName,row.carrierId],['ui1.material',row.materialName,row.materialId],['op.driver',row.driverName,row.driverId]].map(([label,name,id])=><div key={label} className="min-w-0 rounded-lg bg-stone-900 p-3"><dt className="text-sm text-stone-400">{t(label!)}</dt><dd className="font-semibold break-words">{name||t('ui1.name_unavailable')}</dd>{id&&<dd className="text-xs text-stone-400 break-all"><bdi dir="ltr">{id}</bdi></dd>}</div>)}</dl>}
   {!required?.driver&&required&&<p className="text-sm text-stone-300">{t('ui1.driver_deferred')}</p>}
   <div id="ui1-blockers" role="status" className="text-sm">{blockers.length?<ul className="list-disc space-y-2 ps-5">{blockers.map(key=><li key={key}>{t(key)}</li>)}</ul>:<p className="text-emerald-300">{t('ui1.ready')}</p>}</div>
   {['ERROR','DENIED'].some(s=>[fleetState,pricingState,pendingState].includes(s as ReadState))&&<button className={tripEntryAction} type="button" disabled={busy} onClick={()=>setRevision(v=>v+1)}>{t('ui1.reload')}</button>}
   <button type="button" data-trip-command="DISPATCH_TRIP" aria-describedby="ui1-blockers" disabled={busy||blockers.length>0} className={`${tripEntryAction} w-full bg-emerald-700 text-white sm:w-auto`} onClick={()=>{if(row&&rule?.rule)void command('DISPATCH_TRIP',{truckId:row.truckId,carrierId:row.carrierId,materialId:row.materialId,driverId:row.driverId||null,pricingRuleId:rule.rule.pricingRuleId});}}>{t(busy?'ui1.submitting':'ui1.dispatch')}</button>
  </section>
  <section id="ui1-current-trip" tabIndex={-1} aria-labelledby="ui1-follow-title" className="space-y-4 rounded-xl border border-stone-700 p-4 focus-visible:ring-2 focus-visible:ring-emerald-400"><h3 id="ui1-follow-title" className="text-lg font-bold">{t('ui1.follow_trip')}</h3><p className="text-sm text-stone-300">{t('ui1.follow_help')}</p>
   {tripState==='LOADING'?<TripEntryNotice>{t('ui1.trips_loading')}</TripEntryNotice>:tripState==='ERROR'?<TripEntryNotice tone="error">{t('ui1.trips_error')} <button className={tripEntryAction} type="button" onClick={()=>setRevision(v=>v+1)}>{t('ui1.reload')}</button></TripEntryNotice>:!trips.filter(r=>r.operationalSnapshot).length&&<TripEntryNotice>{t('ui1.trips_empty')}</TripEntryNotice>}
   <div className="block space-y-2"><label htmlFor="ui1-trip"><span>{t('op.trip')}</span></label><select id="ui1-trip" className={tripEntryControl} value={selected} disabled={busy||tripState!=='READY'} onChange={e=>setSelected(e.target.value)}><option value="">{t('op.choose')}</option>{trips.filter(r=>r.operationalSnapshot&&(authContext.role!=='DRIVER'||r.driverId===authContext.linkedDriverId)).map(r=><option key={r.tripId} value={r.tripId}>{r.tripNumber||`${t('ui1.canonical_id')}: ${r.tripId}`} · {r.truckSnapshot?.plateNumberAr||t('ui1.name_unavailable')} · {t(`op.${r.status}`)}</option>)}</select></div>
   {trip&&<><p>{t('ui1.current_status')}: <strong>{t(`op.${trip.status}`)}</strong> · {t('op.driver')}: {trip.driverSnapshot?.fullNameAr||t('op.driver_unknown')}</p><p>{t('op.delayStatus')}: {t(`op.${delayStatus}`)}</p><OperationalTripActions key={trip.tripId} trip={trip} roles={[authContext.role]} busy={busy||tripState!=='READY'||project.status!=='ACTIVE'||pendingState!=='READY'||pendingOperations.length>0} driverOptions={fleetState==='READY'?Array.from(new Map((fleet?.rows||[]).filter(r=>r.projectId===project.projectId&&r.truckId===trip.truckId&&r.carrierId===trip.carrierId&&r.driverId).map(r=>[r.driverId!,{id:r.driverId!,name:r.driverName||''}])).values()):[]} draft={pendingOperations.find(op=>op.payload.tripId===trip.tripId)} onCommand={(name,payload)=>command(name,payload,trip.tripId)}/></>}
  </section>
 </section>;
}

export {OperationalTripActions} from './OperationalTripActions';
export type {OperationalTripActionView} from './OperationalTripActions';
