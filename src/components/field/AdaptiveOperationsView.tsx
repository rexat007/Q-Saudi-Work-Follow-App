import React,{useEffect,useMemo,useRef,useState} from 'react';
import type {ProjectEntity,TripEntity} from '../../types/entities';
import type {AuthUserContext} from '../../types/common';
import type {ProjectFleetReadModelResponse} from '../../types/projectFleetReadModel';
import {canonicalProjectRead} from '../../services/projectReadTransport';
import {tripRepository} from '../../repositories/trip.repository';
import {pricingRuleRepository} from '../../repositories/pricingRule.repository';
import {PricingService} from '../../services/pricing.service';
import {durableTripCommand,pendingTripOperations,recoverTripOperation} from '../../services/durableTripCommandClient.service';
import {outboxService} from '../../services/offline/outbox.service';
import type {OutboxOperation} from '../../types/offline';
import {canExecuteTripCommand,type TripCommandName} from '../../types/tripCommands';
import {profileTransitionAllowed,resolveOperationalWeights,resolveRequiredTripFields} from '../../services/operationalProfileResolver';
import {profileTripRow} from '../../services/operationalReporting';
import {useI18n} from '../../i18n';
export function AdaptiveOperationsView({project,authContext,onManageRoster}:{project:ProjectEntity;authContext:AuthUserContext;onManageRoster?:()=>void}){
 const {t}=useI18n(),[trips,setTrips]=useState<TripEntity[]>([]),[fleet,setFleet]=useState<ProjectFleetReadModelResponse|null>(null),[rules,setRules]=useState<any[]>([]),[truck,setTruck]=useState(''),[selected,setSelected]=useState(''),[tare,setTare]=useState(''),[gross,setGross]=useState(''),[ticket,setTicket]=useState(''),[driver,setDriver]=useState(''),[busy,setBusy]=useState(false),[failed,setFailed]=useState(false);
 const [pendingOperations,setPendingOperations]=useState<OutboxOperation[]>([]);
 const selectedRef=useRef(selected);selectedRef.current=selected;
 const scopeKey=JSON.stringify([project.projectId,authContext.userId,authContext.role,authContext.linkedDriverId,[...(authContext.assignedProjectIds||[])].sort()]);
 const currentScope=useRef(scopeKey);currentScope.current=scopeKey;
  useEffect(() => {
    let active = true,pendingRead=0;const scope=scopeKey;setFleet(null);setTrips([]);setTruck('');setSelected('');setDriver('');setRules([]);setFailed(false);setPendingOperations([]);
    const loadPending=async()=>{const read=++pendingRead;const operations=await pendingTripOperations(project.projectId,authContext.userId);if(!active||currentScope.current!==scope||read!==pendingRead)return;setPendingOperations(operations);if(operations[0]){if(operations[0].payload.tripId)setSelected(operations[0].payload.tripId);else if(operations[0].payload.payload?.truckId)setTruck(operations[0].payload.payload.truckId);}else if(!selectedRef.current){const ack=(await outboxService.getOperations()).find(op=>op.projectId===project.projectId&&op.userId===authContext.userId&&op.operationType==='TRIP_COMMAND'&&op.status==='SYNCED'&&op.serverAck?.tripId);if(active&&currentScope.current===scope&&read===pendingRead&&ack?.serverAck?.tripId)setSelected(ack.serverAck.tripId);}};
    const stopOutbox=outboxService.subscribe(()=>{void loadPending().catch(()=>{if(active&&currentScope.current===scope)setFailed(true);});});void loadPending().catch(()=>{if(active&&currentScope.current===scope)setFailed(true);});
    
    // Fleet is read-only inventory, keep one-shot
    void canonicalProjectRead<ProjectFleetReadModelResponse>(project.projectId, 'fleet-read-model').then(data => {
      if (active&&currentScope.current===scope) setFleet(data);
    }).catch(() => { if (active) setFailed(true); });

    // Trips require live operational visibility
    const unsubTrips = tripRepository.subscribeByProject(project.projectId, data => {
      if (active&&currentScope.current===scope) setTrips(data);
    }, () => { if (active) setFailed(true); });

    // Pricing rules should refresh on mutation
    const unsubRules = pricingRuleRepository.subscribeByProject(project.projectId, data => {
      if (active&&currentScope.current===scope) setRules(data.map(r => ({ ...r, pricingType: r.pricingModel, rate: r.baseRateSAR })));
    });

    return () => { active = false; unsubTrips(); unsubRules(); stopOutbox(); };
  }, [scopeKey]);
 const row=fleet?.rows.find(r=>r.truckId===truck),trip=trips.find(v=>v.tripId===selected&&v.operationalSnapshot),config=project.operationalConfiguration!,required=resolveRequiredTripFields(config);
 const rule=useMemo(()=>row?new PricingService().resolvePricingRuleFromList(rules,{projectId:project.projectId,carrierId:row.carrierId,materialId:row.materialId,tripDate:new Date().toISOString()}):null,[rules,row,project.projectId]);
 const applyTrip=(value:TripEntity)=>{setTrips(old=>{const previous=old.find(v=>v.tripId===value.tripId);return previous&&(previous.version??0)>(value.version??0)?old:[...old.filter(v=>v.tripId!==value.tripId),value];});setSelected(value.tripId);};
 async function command(name:TripCommandName,payload:Record<string,unknown>={},id?:string){
  const scope=currentScope.current;setBusy(true);setFailed(false);
  try{const result=await durableTripCommand(project.projectId,authContext.userId,name,payload,id,id?trip?.version:0);if(currentScope.current!==scope)return;applyTrip(result.trip);setTare('');setGross('');setTicket('');return result;}
  catch{if(currentScope.current===scope)setFailed(true);}finally{if(currentScope.current===scope)setBusy(false);}
 }
 async function recover(){const operation=pendingOperations[0];if(!operation)return;const scope=currentScope.current;setBusy(true);setFailed(false);try{const result=await recoverTripOperation(operation,authContext.userId);if(currentScope.current===scope)applyTrip(result.trip);}catch{if(currentScope.current===scope)setFailed(true);}finally{if(currentScope.current===scope)setBusy(false);}}

 return <section className="space-y-4 rounded-xl border border-stone-700 p-4"><h2>{t('op.operations')}</h2><p>{t('op.canonical_intake_help')}</p>{onManageRoster&&<button type="button" onClick={onManageRoster}>{t('op.manage_roster')}</button>}
 {pendingOperations.length>0&&<div role="status" data-testid="adaptive-receipt-recovery"><p>{t('offline.recovery.awaiting_receipt')}</p><button type="button" disabled={busy} onClick={()=>void recover()}>{t('shared.error_boundary.retry')}</button></div>}
 {canExecuteTripCommand(authContext.role,'DISPATCH_TRIP')&&<div className="flex flex-wrap gap-3"><label>{t('op.truck')}<select value={truck} onChange={e=>setTruck(e.target.value)} className="bg-stone-900 block"><option value="">{t('op.choose')}</option>{fleet?.rows.filter(r=>r.carrierId&&r.materialId&&(!required.driver||r.driverId)).map(r=><option key={r.truckId} value={r.truckId}>{r.plateNumber||r.truckId} · {r.carrierName} · {r.driverName||t('op.driver_unknown')}</option>)}</select></label><button type="button" data-trip-command="DISPATCH_TRIP" disabled={busy||pendingOperations.length>0||!row||!(rule as any)?.rule} onClick={()=>{if(row&&(rule as any)?.rule)void command('DISPATCH_TRIP',{truckId:row.truckId,carrierId:row.carrierId,materialId:row.materialId,driverId:row.driverId||null,pricingRuleId:(rule as any).rule.pricingRuleId});}}>{t('op.DISPATCH_TRIP')}</button></div>}
 <label>{t('op.trip')}<select className="bg-stone-900 block w-full" value={selected} onChange={e=>{setSelected(e.target.value);setTare('');setGross('');}}><option value="">{t('op.choose')}</option>{trips.filter(r=>r.operationalSnapshot&&(authContext.role!=='DRIVER'||r.driverId===authContext.linkedDriverId)).map(r=><option key={r.tripId} value={r.tripId}>{r.tripNumber||r.tripId} · {r.truckSnapshot?.plateNumberAr} · {t(`op.${r.status}`)}</option>)}</select></label>
 {trip&&<><div>{t('op.driver')}: {trip.driverSnapshot?.fullNameAr||t('op.driver_unknown')}</div><div>{t('op.delayStatus')}: {t(`op.${String(profileTripRow(trip).delayStatus)}`)}</div>
 <OperationalTripActions key={trip.tripId} trip={trip} roles={[authContext.role]} busy={busy||pendingOperations.length>0} draft={pendingOperations.find(op=>op.payload.tripId===trip.tripId)} onCommand={(name,payload)=>command(name,payload,trip.tripId)}/></>}
 {failed&&<p role="alert">{t('op.operation_failed')}</p>}</section>;
}

export interface OperationalTripActionView {tripId:string;revision?:number;status:string;driverId?:string|null;weights:{originNetKg?:number|string|null;destinationNetKg?:number|string|null};financials:{isFinalized:boolean};operationalSnapshot?:import('../../types/operationalProfile').TripOperationalSnapshot|null;operationalTimeline?:import('../../types/operationalProfile').OperationalTimeline}
/** Existing operational controls, pure presentation. Neither data provider nor backend selection lives here. */
export function OperationalTripActions({trip,roles,busy,onCommand,draft}:{trip:OperationalTripActionView;roles:readonly string[];busy:boolean;draft?:OutboxOperation;onCommand:(name:TripCommandName,payload:Record<string,unknown>)=>Promise<unknown>}){
 const {t}=useI18n(),[tare,setTare]=useState(''),[gross,setGross]=useState(''),[ticket,setTicket]=useState(''),[driver,setDriver]=useState('');
 useEffect(()=>{if(!draft)return;const data=draft.payload.payload||{};setTare(String(data.originTareKg??data.destinationTareKg??''));setGross(String(data.originGrossKg??data.destinationGrossKg??''));setTicket(String(data.originTicketNo??data.destinationTicketNo??''));},[draft?.operationId]);
 if(!trip.operationalSnapshot)return null;
 const can=(name:TripCommandName)=>roles.some(role=>canExecuteTripCommand(role as import('../../types/common').UserRole,name));
 const command=async(name:TripCommandName,payload:Record<string,unknown>={},_id?:string)=>{const result=await onCommand(name,payload);if(result!==undefined){setTare('');setGross('');setTicket('');}return result;};
 const candidates: Array<[TripCommandName,string]>=[['ARRIVE_ORIGIN','AT_ORIGIN'],['START_LOADING','LOADING'],['RECORD_ORIGIN_WEIGHT','WEIGHED_ORIGIN'],['START_TRANSIT','IN_TRANSIT'],['RECORD_ARRIVAL','AT_DESTINATION'],['RECORD_DESTINATION_WEIGHT','WEIGHED_DESTINATION'],['COMPLETE_UNLOADING','OFFLOADED'],['COMPLETE_TRIP','COMPLETED']];
 const weights=trip?resolveOperationalWeights(trip.operationalSnapshot!.configuration,{loadingMeasuredWeight:trip.weights.originNetKg==null?null:Number(trip.weights.originNetKg)/1000,unloadingMeasuredWeight:trip.weights.destinationNetKg==null?null:Number(trip.weights.destinationNetKg)/1000,estimatedCapacityTonnes:trip.operationalSnapshot!.estimatedCapacityTonnes}):null;
 const allowed=candidates.filter(([commandName,status])=>trip&&can(commandName)&&profileTransitionAllowed(trip.status,status,trip.operationalSnapshot!,trip.operationalTimeline||{},weights!));
 const measurement=allowed.some(([c])=>c==='RECORD_ORIGIN_WEIGHT'||c==='RECORD_DESTINATION_WEIGHT');
 return <div className="space-y-4"> {measurement&&<div className="flex gap-3">{[['tare',tare,setTare],['gross',gross,setGross],['ticket',ticket,setTicket]].map(([key,value,setter])=><label key={key as string}>{t(`op.${key}`)}<input className="bg-stone-900 block" disabled={busy} type={key==='ticket'?'text':'number'} min="0" value={value as string} onChange={e=>(setter as (v:string)=>void)(e.target.value)}/></label>)}</div>}
 <div className="flex flex-wrap gap-3">{allowed.map(([name])=><button data-trip-command={name} type="button" key={name} disabled={busy||(name.includes('WEIGHT')&&(!tare||!gross||Number(gross)<=Number(tare)))} onClick={()=>void command(name,name==='RECORD_ORIGIN_WEIGHT'?{originTareKg:Number(tare),originGrossKg:Number(gross),originTicketNo:ticket}:name==='RECORD_DESTINATION_WEIGHT'?{destinationTareKg:Number(tare),destinationGrossKg:Number(gross),destinationTicketNo:ticket}:{},trip.tripId)}>{t(`op.${name}`)}</button>)}
 {can('COMPLETE_LOADING')&&trip.status==='LOADING'&&!trip.operationalTimeline?.loadingCompletedAt&&<button type="button" disabled={busy} onClick={()=>void command('COMPLETE_LOADING',{},trip.tripId)}>{t('op.COMPLETE_LOADING')}</button>}
 {can('START_UNLOADING')&&['AT_DESTINATION','WEIGHED_DESTINATION'].includes(trip.status)&&!trip.operationalTimeline?.unloadingStartedAt&&<button type="button" disabled={busy} onClick={()=>void command('START_UNLOADING',{},trip.tripId)}>{t('op.START_UNLOADING')}</button>}</div>
 {!trip.driverId&&!trip.financials.isFinalized&&can('ASSOCIATE_DRIVER')&&<div><label>{t('op.associate_help')}<input className="bg-stone-900" value={driver} onChange={e=>setDriver(e.target.value)}/></label><button type="button" disabled={busy||!driver} onClick={()=>void command('ASSOCIATE_DRIVER',{driverId:driver},trip.tripId)}>{t('op.ASSOCIATE_DRIVER')}</button></div>} </div>;
}
