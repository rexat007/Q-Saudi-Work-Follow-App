import React,{useEffect,useMemo,useRef,useState} from 'react';
import type {ProjectEntity,TripEntity} from '../../types/entities';
import type {AuthUserContext} from '../../types/common';
import type {ProjectFleetReadModelResponse} from '../../types/projectFleetReadModel';
import {canonicalProjectRead} from '../../services/projectReadTransport';
import {tripRepository} from '../../repositories/trip.repository';
import {pricingRuleRepository} from '../../repositories/pricingRule.repository';
import {PricingService} from '../../services/pricing.service';
import {sendTripCommand} from '../../services/tripCommandClient.service';
import {canExecuteTripCommand,type TripCommandName} from '../../types/tripCommands';
import {profileTransitionAllowed,resolveOperationalWeights,resolveRequiredTripFields} from '../../services/operationalProfileResolver';
import {profileTripRow} from '../../services/operationalReporting';
import {useI18n} from '../../i18n';
export function AdaptiveOperationsView({project,authContext,onManageRoster}:{project:ProjectEntity;authContext:AuthUserContext;onManageRoster?:()=>void}){
 const {t}=useI18n(),[trips,setTrips]=useState<TripEntity[]>([]),[fleet,setFleet]=useState<ProjectFleetReadModelResponse|null>(null),[rules,setRules]=useState<any[]>([]),[truck,setTruck]=useState(''),[selected,setSelected]=useState(''),[tare,setTare]=useState(''),[gross,setGross]=useState(''),[ticket,setTicket]=useState(''),[driver,setDriver]=useState(''),[busy,setBusy]=useState(false),[failed,setFailed]=useState(false);
 const pending=useRef<{key:string;id:string}|null>(null),currentScope=useRef('');currentScope.current=project.projectId+'|'+authContext.userId;
  useEffect(() => {
    let active = true; setFleet(null); setTrips([]); setTruck(''); setSelected(''); setDriver(''); setRules([]); pending.current = null;
    
    // Fleet is read-only inventory, keep one-shot
    void canonicalProjectRead<ProjectFleetReadModelResponse>(project.projectId, 'fleet-read-model').then(data => {
      if (active) setFleet(data);
    }).catch(() => { if (active) setFailed(true); });

    // Trips require live operational visibility
    const unsubTrips = tripRepository.subscribeByProject(project.projectId, data => {
      if (active) setTrips(data);
    }, () => { if (active) setFailed(true); });

    // Pricing rules should refresh on mutation
    const unsubRules = pricingRuleRepository.subscribeByProject(project.projectId, data => {
      if (active) setRules(data.map(r => ({ ...r, pricingType: r.pricingModel, rate: r.baseRateSAR })));
    });

    return () => { active = false; unsubTrips(); unsubRules(); };
  }, [project.projectId, authContext.userId]);
 const row=fleet?.rows.find(r=>r.truckId===truck),trip=trips.find(v=>v.tripId===selected&&v.operationalSnapshot),config=project.operationalConfiguration!,required=resolveRequiredTripFields(config);
 const rule=useMemo(()=>row?new PricingService().resolvePricingRuleFromList(rules,{projectId:project.projectId,carrierId:row.carrierId,materialId:row.materialId,tripDate:new Date().toISOString()}):null,[rules,row,project.projectId]);
 async function command(name:TripCommandName,payload:Record<string,unknown>={},id?:string){const scope=currentScope.current,key=JSON.stringify([scope,name,payload,id]);if(pending.current?.key!==key)pending.current={key,id:crypto.randomUUID()};setBusy(true);setFailed(false);try{const result=await sendTripCommand(project.projectId,name,payload,pending.current.id,id);if(currentScope.current!==scope)return;pending.current=null;if(result.trip){setTrips(old=>[...old.filter(v=>v.tripId!==result.trip.tripId),result.trip]);setSelected(result.trip.tripId);}setTare('');setGross('');setTicket('');return result;}catch{if(currentScope.current===scope)setFailed(true);}finally{if(currentScope.current===scope)setBusy(false);}}
 return <section className="space-y-4 rounded-xl border border-stone-700 p-4"><h2>{t('op.operations')}</h2><p>{t('op.canonical_intake_help')}</p>{onManageRoster&&<button type="button" onClick={onManageRoster}>{t('op.manage_roster')}</button>}
 {canExecuteTripCommand(authContext.role,'DISPATCH_TRIP')&&<div className="flex flex-wrap gap-3"><label>{t('op.truck')}<select value={truck} onChange={e=>setTruck(e.target.value)} className="bg-stone-900 block"><option value="">{t('op.choose')}</option>{fleet?.rows.filter(r=>r.carrierId&&r.materialId&&(!required.driver||r.driverId)).map(r=><option key={r.truckId} value={r.truckId}>{r.plateNumber||r.truckId} · {r.carrierName} · {r.driverName||t('op.driver_unknown')}</option>)}</select></label><button type="button" disabled={busy||!row||!(rule as any)?.rule} onClick={()=>{if(row&&(rule as any)?.rule)void command('DISPATCH_TRIP',{truckId:row.truckId,carrierId:row.carrierId,materialId:row.materialId,driverId:row.driverId||null,pricingRuleId:(rule as any).rule.pricingRuleId});}}>{t('op.DISPATCH_TRIP')}</button></div>}
 <label>{t('op.trip')}<select className="bg-stone-900 block w-full" value={selected} onChange={e=>{setSelected(e.target.value);setTare('');setGross('');}}><option value="">{t('op.choose')}</option>{trips.filter(r=>r.operationalSnapshot&&(authContext.role!=='DRIVER'||r.driverId===authContext.linkedDriverId)).map(r=><option key={r.tripId} value={r.tripId}>{r.tripNumber||r.tripId} · {r.truckSnapshot?.plateNumberAr} · {t(`op.${r.status}`)}</option>)}</select></label>
 {trip&&<><div>{t('op.driver')}: {trip.driverSnapshot?.fullNameAr||t('op.driver_unknown')}</div><div>{t('op.delayStatus')}: {t(`op.${String(profileTripRow(trip).delayStatus)}`)}</div>
 <OperationalTripActions key={trip.tripId} trip={trip} roles={[authContext.role]} busy={busy} onCommand={(name,payload)=>command(name,payload,trip.tripId)}/></>}
 {failed&&<p role="alert">{t('op.operation_failed')}</p>}</section>;
}

export interface OperationalTripActionView {tripId:string;revision?:number;status:string;driverId?:string|null;weights:{originNetKg?:number|string|null;destinationNetKg?:number|string|null};financials:{isFinalized:boolean};operationalSnapshot?:import('../../types/operationalProfile').TripOperationalSnapshot|null;operationalTimeline?:import('../../types/operationalProfile').OperationalTimeline}
/** Existing operational controls, pure presentation. Neither data provider nor backend selection lives here. */
export function OperationalTripActions({trip,roles,busy,onCommand}:{trip:OperationalTripActionView;roles:readonly string[];busy:boolean;onCommand:(name:TripCommandName,payload:Record<string,unknown>)=>Promise<unknown>}){
 const {t}=useI18n(),[tare,setTare]=useState(''),[gross,setGross]=useState(''),[ticket,setTicket]=useState(''),[driver,setDriver]=useState('');
 if(!trip.operationalSnapshot)return null;
 const can=(name:TripCommandName)=>roles.some(role=>canExecuteTripCommand(role as import('../../types/common').UserRole,name));
 const command=async(name:TripCommandName,payload:Record<string,unknown>={},_id?:string)=>{const result=await onCommand(name,payload);if(result!==undefined){setTare('');setGross('');setTicket('');}return result;};
 const candidates: Array<[TripCommandName,string]>=[['ARRIVE_ORIGIN','AT_ORIGIN'],['START_LOADING','LOADING'],['RECORD_ORIGIN_WEIGHT','WEIGHED_ORIGIN'],['START_TRANSIT','IN_TRANSIT'],['RECORD_ARRIVAL','AT_DESTINATION'],['RECORD_DESTINATION_WEIGHT','WEIGHED_DESTINATION'],['COMPLETE_UNLOADING','OFFLOADED'],['COMPLETE_TRIP','COMPLETED']];
 const weights=trip?resolveOperationalWeights(trip.operationalSnapshot!.configuration,{loadingMeasuredWeight:trip.weights.originNetKg==null?null:Number(trip.weights.originNetKg)/1000,unloadingMeasuredWeight:trip.weights.destinationNetKg==null?null:Number(trip.weights.destinationNetKg)/1000,estimatedCapacityTonnes:trip.operationalSnapshot!.estimatedCapacityTonnes}):null;
 const allowed=candidates.filter(([commandName,status])=>trip&&can(commandName)&&profileTransitionAllowed(trip.status,status,trip.operationalSnapshot!,trip.operationalTimeline||{},weights!));
 const measurement=allowed.some(([c])=>c==='RECORD_ORIGIN_WEIGHT'||c==='RECORD_DESTINATION_WEIGHT');
 return <div className="space-y-4"> {measurement&&<div className="flex gap-3">{[['tare',tare,setTare],['gross',gross,setGross],['ticket',ticket,setTicket]].map(([key,value,setter])=><label key={key as string}>{t(`op.${key}`)}<input className="bg-stone-900 block" type={key==='ticket'?'text':'number'} min="0" value={value as string} onChange={e=>(setter as (v:string)=>void)(e.target.value)}/></label>)}</div>}
 <div className="flex flex-wrap gap-3">{allowed.map(([name])=><button data-trip-command={name} type="button" key={name} disabled={busy||(name.includes('WEIGHT')&&(!tare||!gross||Number(gross)<=Number(tare)))} onClick={()=>void command(name,name==='RECORD_ORIGIN_WEIGHT'?{originTareKg:Number(tare),originGrossKg:Number(gross),originTicketNo:ticket}:name==='RECORD_DESTINATION_WEIGHT'?{destinationTareKg:Number(tare),destinationGrossKg:Number(gross),destinationTicketNo:ticket}:{},trip.tripId)}>{t(`op.${name}`)}</button>)}
 {can('COMPLETE_LOADING')&&trip.status==='LOADING'&&!trip.operationalTimeline?.loadingCompletedAt&&<button type="button" disabled={busy} onClick={()=>void command('COMPLETE_LOADING',{},trip.tripId)}>{t('op.COMPLETE_LOADING')}</button>}
 {can('START_UNLOADING')&&['AT_DESTINATION','WEIGHED_DESTINATION'].includes(trip.status)&&!trip.operationalTimeline?.unloadingStartedAt&&<button type="button" disabled={busy} onClick={()=>void command('START_UNLOADING',{},trip.tripId)}>{t('op.START_UNLOADING')}</button>}</div>
 {!trip.driverId&&!trip.financials.isFinalized&&can('ASSOCIATE_DRIVER')&&<div><label>{t('op.associate_help')}<input className="bg-stone-900" value={driver} onChange={e=>setDriver(e.target.value)}/></label><button type="button" disabled={busy||!driver} onClick={()=>void command('ASSOCIATE_DRIVER',{driverId:driver},trip.tripId)}>{t('op.ASSOCIATE_DRIVER')}</button></div>} </div>;
}
