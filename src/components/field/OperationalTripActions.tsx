import React,{useEffect,useId,useRef,useState} from 'react';
import {useI18n} from '../../i18n';
import {canExecuteTripCommand,type TripCommandName} from '../../types/tripCommands';
import type {UserRole} from '../../types/common';
import type {OutboxOperation} from '../../types/offline';
import {operationalActionPresentation,validMeasurement,validExistingDriverId,type OperationalTripActionView} from '../../utils/tripTimelinePresentation';
import {TripEntryNotice,tripEntryAction,tripEntryControl} from './TripEntryNotice';
import {TripTimeline} from './TripTimeline';
export type {OperationalTripActionView} from '../../utils/tripTimelinePresentation';
export interface DriverChoice {id:string;name:string}
export function OperationalTripActions({trip,roles,busy,onCommand,draft,driverOptions=[]}: {trip:OperationalTripActionView;roles:readonly string[];busy:boolean;draft?:OutboxOperation;driverOptions?:readonly DriverChoice[];onCommand:(name:TripCommandName,payload:Record<string,unknown>)=>Promise<unknown>}){
 const {t}=useI18n(),id=useId(),lock=useRef(false);
 const [tare,setTare]=useState(''),[gross,setGross]=useState(''),[ticket,setTicket]=useState(''),[driver,setDriver]=useState(''),[sending,setSending]=useState(false),[failure,setFailure]=useState(false);
 useEffect(()=>{setTare('');setGross('');setTicket('');setDriver('');setFailure(false);},[trip.tripId,trip.status]);
 useEffect(()=>{if(!draft)return;const data=draft.payload.payload||{};setTare(String(data.originTareKg??data.destinationTareKg??''));setGross(String(data.originGrossKg??data.destinationGrossKg??''));setTicket(String(data.originTicketNo??data.destinationTicketNo??''));setDriver(String(data.driverId??''));},[draft?.operationId]);
 if(!trip.operationalSnapshot)return null;
 const view=operationalActionPresentation(trip,roles),c=trip.operationalSnapshot.configuration;
 const can=(name:TripCommandName)=>roles.some(role=>canExecuteTripCommand(role as UserRole,name));
 const frozen=busy||sending||Boolean(draft),measurement=view.allowed.find(n=>n==='RECORD_ORIGIN_WEIGHT'||n==='RECORD_DESTINATION_WEIGHT');
 const valid=validMeasurement(tare,gross),associate=!trip.driverId&&!view.terminal&&!view.invalid&&can('ASSOCIATE_DRIVER');
 async function command(name:TripCommandName,payload:Record<string,unknown>={}){
  if(lock.current||frozen)return;lock.current=true;setSending(true);setFailure(false);
  try{const result=await onCommand(name,payload);if(result!==undefined){setTare('');setGross('');setTicket('');setDriver('');}}
  catch{setFailure(true);}finally{lock.current=false;setSending(false);}
 }
 const notice=view.invalid?'ui2.invalid':view.terminal?'ui2.terminal':view.allowed.length>1?'ui2.choices':view.allowed.length===1?'ui2.next_action':view.possible.length?'ui2.permission_blocked':view.missing.length?'ui2.checkpoint_blocked':'ui2.no_action';
 return <div className="min-w-0 space-y-5" aria-busy={sending}>
  <TripTimeline trip={trip} roles={roles}/>
  <section aria-label={t('ui2.next_action')} className="space-y-4 rounded-xl border border-stone-700 p-4">
   <h4 className="text-lg font-bold">{t('ui2.next_action')}</h4><TripEntryNotice id={id+'-action-help'}>{t(notice)}{view.missing.length>0&&<p>{t('ui2.missing')}: {view.missing.map(k=>t(`ui2.checkpoint.${k}`)).join(' · ')}</p>}</TripEntryNotice>
   {(sending||busy||draft)&&<TripEntryNotice>{t(sending?'ui2.submitting':draft?'ui2.awaiting':'ui2.read_or_operation_pending')}</TripEntryNotice>}
   {failure&&<TripEntryNotice tone="error">{t('ui2.failed')}</TripEntryNotice>}
   {measurement&&<fieldset disabled={frozen} className="space-y-3"><legend className="font-semibold">{t(measurement==='RECORD_ORIGIN_WEIGHT'?'ui2.origin_measurement':'ui2.destination_measurement')}</legend><p className="text-sm text-stone-300">{t('ui2.measurement_help')}</p>
    <div className="grid gap-3 sm:grid-cols-3">{([['tare',tare,setTare],['gross',gross,setGross],['ticket',ticket,setTicket]] as const).map(([key,value,setter])=><div key={key}><label htmlFor={id+key} className="mb-1 block text-sm">{t(`op.${key}`)}</label><input id={id+key} data-measurement={key} className={tripEntryControl} disabled={frozen} type={key==='ticket'?'text':'number'} min={key==='ticket'?undefined:0} step={key==='ticket'?undefined:'any'} inputMode={key==='ticket'?'text':'decimal'} dir="ltr" value={value} aria-invalid={key!=='ticket'&&Boolean(tare||gross)&&!valid} aria-describedby={id+'-weight-help'} onChange={e=>setter(e.target.value)}/></div>)}</div>
    <p id={id+'-weight-help'} role="status" className="text-sm text-stone-300">{t(valid?'ui2.weight_ready':'ui2.weight_invalid')}</p>
   </fieldset>}
   <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">{view.allowed.map(name=><button key={name} type="button" data-trip-command={name} data-primary={view.allowed.length===1?'true':'false'} className={`${tripEntryAction} ${view.allowed.length===1?'bg-emerald-700 text-white':''}`} aria-describedby={id+'-action-help'} disabled={frozen||(name.includes('WEIGHT')&&!valid)} onClick={()=>void command(name,name==='RECORD_ORIGIN_WEIGHT'?{originTareKg:Number(tare),originGrossKg:Number(gross),originTicketNo:ticket}:name==='RECORD_DESTINATION_WEIGHT'?{destinationTareKg:Number(tare),destinationGrossKg:Number(gross),destinationTicketNo:ticket}:{})}>{t(`op.${name}`)}</button>)}</div>
   <ul className="space-y-2 text-sm text-stone-300">{(['loading','unloading'] as const).map(side=><li key={side}>{t(`ui2.${side}_measurement`)}: {t(c[side==='loading'?'loadingMeasurementMode':'unloadingMeasurementMode']==='NONE'?'ui2.not_applicable':'ui2.measurement_required')}</li>)}</ul>
  </section>
  <section aria-label={t('op.driver')} className="space-y-3 rounded-xl border border-stone-700 p-4"><h4 className="font-bold">{t('ui2.driver_association')}</h4><p className="text-sm text-stone-300">{t(`ui2.intake.${c.driverIntakeMode}`)}</p>
   {trip.driverId?<TripEntryNotice tone="success">{t('ui2.driver_confirmed')}: {trip.driverSnapshot?.fullNameAr||t('ui1.name_unavailable')} <bdi dir="ltr">{trip.driverId}</bdi></TripEntryNotice>:<><TripEntryNotice>{t(associate?'ui2.driver_help':'ui2.driver_restricted')}</TripEntryNotice>{associate&&<>
    {driverOptions.length>0&&<div><label htmlFor={id+'-driver-choice'} className="mb-1 block text-sm">{t('ui2.driver_choice')}</label><select id={id+'-driver-choice'} className={tripEntryControl} disabled={frozen} value={driverOptions.some(d=>d.id===driver)?driver:''} onChange={e=>setDriver(e.target.value)}><option value="">{t('op.choose')}</option>{driverOptions.map(d=><option key={d.id} value={d.id}>{d.name||t('ui1.name_unavailable')} · {d.id}</option>)}</select></div>}
    <div><label htmlFor={id+'-driver'} className="mb-1 block text-sm">{t('ui2.driver_id')}</label><input id={id+'-driver'} data-driver-id className={tripEntryControl} disabled={frozen} dir="ltr" value={driver} maxLength={128} aria-describedby={id+'-driver-help'} aria-invalid={Boolean(driver)&&!validExistingDriverId(driver)} onChange={e=>setDriver(e.target.value)}/><p id={id+'-driver-help'} className="mt-2 text-sm text-stone-300">{t('ui2.driver_id_help')}</p></div>
    <button className={tripEntryAction} data-trip-command="ASSOCIATE_DRIVER" type="button" disabled={frozen||!validExistingDriverId(driver)} onClick={()=>void command('ASSOCIATE_DRIVER',{driverId:driver})}>{t('op.ASSOCIATE_DRIVER')}</button>
   </>}</>}
  </section>
 </div>;
}
