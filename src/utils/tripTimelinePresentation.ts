import type {TripOperationalSnapshot,OperationalTimeline,OperationalCheckpoint} from '../types/operationalProfile';
import type {UserRole} from '../types/common';
import {canExecuteTripCommand,type TripCommandName} from '../types/tripCommands';
import {profileTransitionAllowed,resolveOperationalWeights} from '../services/operationalProfileResolver';

export interface OperationalTripActionView {
 tripId:string;revision?:number;status:string;driverId?:string|null;truckId?:string;carrierId?:string;
 driverSnapshot?:{fullNameAr:string}|null;
 weights:{originNetKg?:number|string|null;destinationNetKg?:number|string|null};financials:{isFinalized:boolean};
 operationalSnapshot?:TripOperationalSnapshot|null;operationalTimeline?:OperationalTimeline;
}
export const operationalActions:ReadonlyArray<readonly [TripCommandName,string]>=[
 ['ARRIVE_ORIGIN','AT_ORIGIN'],['START_LOADING','LOADING'],['RECORD_ORIGIN_WEIGHT','WEIGHED_ORIGIN'],
 ['START_TRANSIT','IN_TRANSIT'],['RECORD_ARRIVAL','AT_DESTINATION'],['RECORD_DESTINATION_WEIGHT','WEIGHED_DESTINATION'],
 ['COMPLETE_UNLOADING','OFFLOADED'],['COMPLETE_TRIP','COMPLETED']];
export const checkpointKeys:OperationalCheckpoint[]=['loadingStartedAt','loadingCompletedAt','departedAt','arrivedAt','unloadingStartedAt','unloadingCompletedAt'];
export const validTimelineInstant=(s:unknown):s is string=>typeof s==='string'&&/^\d{4}-\d\d-\d\dT.*(?:Z|[+-]\d\d:\d\d)$/.test(s)&&Number.isFinite(Date.parse(s));
export function operationalActionPresentation(trip:OperationalTripActionView,roles:readonly string[]){
 const snapshot=trip.operationalSnapshot,timeline=trip.operationalTimeline||{};
 const can=(name:TripCommandName)=>roles.some(role=>canExecuteTripCommand(role as UserRole,name));
 const terminal=['COMPLETED','CANCELLED','REJECTED'].includes(trip.status)||trip.financials.isFinalized;
 const missing=(snapshot?.configuration.requiredCheckpoints||[]).filter(k=>!validTimelineInstant(timeline[k]));
 try{
  if(!snapshot)return {allowed:[] as TripCommandName[],possible:[] as TripCommandName[],missing,invalid:true,terminal};
  const weights=resolveOperationalWeights(snapshot.configuration,{loadingMeasuredWeight:trip.weights.originNetKg==null?null:Number(trip.weights.originNetKg)/1000,
   unloadingMeasuredWeight:trip.weights.destinationNetKg==null?null:Number(trip.weights.destinationNetKg)/1000,estimatedCapacityTonnes:snapshot.estimatedCapacityTonnes});
  const possible:TripCommandName[]=terminal?[]:operationalActions.filter(([,status])=>profileTransitionAllowed(trip.status,status,snapshot,timeline,weights)).map(([name])=>name);
  // These checkpoint commands retain their server-supported windows; no new ordering is imposed.
  if(!terminal&&['LOADING','WEIGHED_ORIGIN'].includes(trip.status)&&!timeline.loadingCompletedAt)possible.push('COMPLETE_LOADING');
  if(!terminal&&['AT_DESTINATION','WEIGHED_DESTINATION'].includes(trip.status)&&!timeline.unloadingStartedAt)possible.push('START_UNLOADING');
  return {possible,allowed:possible.filter(can),missing,invalid:false,terminal};
 }catch{return {allowed:[] as TripCommandName[],possible:[] as TripCommandName[],missing,invalid:true,terminal};}
}
export type TimelineState='confirmed'|'current'|'next'|'pending'|'not_recorded';
export function tripTimeline(trip:OperationalTripActionView,roles:readonly string[]){
 const timeline=trip.operationalTimeline||{},view=operationalActionPresentation(trip,roles);
 const definitions:Array<{id:string;status:string[];point?:keyof OperationalTimeline;commands:TripCommandName[]}>=[
  {id:'dispatch',status:[],commands:[]},
  {id:'origin',status:['AT_ORIGIN'],commands:['ARRIVE_ORIGIN']},
  {id:'loading',status:['LOADING','WEIGHED_ORIGIN'],point:'loadingCompletedAt',commands:['START_LOADING','COMPLETE_LOADING','RECORD_ORIGIN_WEIGHT']},
  {id:'transit',status:['IN_TRANSIT'],point:'arrivedAt',commands:['START_TRANSIT']},
  {id:'destination',status:['AT_DESTINATION','WEIGHED_DESTINATION'],point:'arrivedAt',commands:['RECORD_ARRIVAL','RECORD_DESTINATION_WEIGHT']},
  {id:'unloading',status:['OFFLOADED'],point:'unloadingCompletedAt',commands:['START_UNLOADING','COMPLETE_UNLOADING']},
  {id:'completion',status:['COMPLETED'],point:'completedAt',commands:['COMPLETE_TRIP']}];
 const stage=definitions.findIndex(d=>d.status.includes(trip.status));
 return definitions.map((d,i)=>{
  const timestamp=d.point&&validTimelineInstant(timeline[d.point])?timeline[d.point]:undefined;
  // Do not infer a visited origin/loading checkpoint from a later status: the policy permits bypass.
  const confirmed=d.id==='dispatch'||Boolean(timestamp)||d.id==='origin'&&trip.status==='AT_ORIGIN'||d.id==='completion'&&trip.status==='COMPLETED';
  const state:TimelineState=confirmed?'confirmed':i===stage?'current':d.commands.some(c=>view.allowed.includes(c))?'next':i<stage?'not_recorded':'pending';
  return {id:d.id,state,timestamp};
 });
}
export function validMeasurement(tare:string,gross:string){
 return tare.trim()!==''&&gross.trim()!==''&&Number.isFinite(Number(tare))&&Number.isFinite(Number(gross))&&Number(tare)>=0&&Number(gross)>Number(tare);
}
export const validExistingDriverId=(s:string)=>/^[a-zA-Z0-9_-]{1,128}$/.test(s)&&s!=='ALL';
