import type {OperationalConfiguration,OperationalProfile,DriverIntakeMode,OperationalWeights,WeightBasis,OperationalTimeline,TripOperationalSnapshot,OperationalCheckpoint} from '../types/operationalProfile';
const invalid=():never=>{throw Object.assign(Error('OPERATIONAL_CONFIGURATION_INVALID'),{code:'OPERATIONAL_CONFIGURATION_INVALID'})};
const exact=(value:any,keys:string[])=>{if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).some(k=>!keys.includes(k)))invalid()};
const finite=(n:unknown,positive=false)=>typeof n==='number'&&Number.isFinite(n)&&(positive?n>0:n>=0);
const text=(s:unknown,max=256)=>typeof s==='string'&&s.trim().length>0&&s.length<=max;
const checkpoints:OperationalCheckpoint[]=['loadingStartedAt','loadingCompletedAt','departedAt','arrivedAt','unloadingStartedAt','unloadingCompletedAt'];
/** Sole capability validation/resolution authority. A profile enum is NEVER an input. */
export function validateOperationalConfiguration(raw:unknown):OperationalConfiguration {
 const c=raw as OperationalConfiguration;exact(c,['schemaVersion','loadingMeasurementMode','unloadingMeasurementMode','driverIntakeMode','routeConfiguration','shiftConfiguration','capacityEstimationPolicy','requiredCheckpoints']);
 if(c.schemaVersion!==1||![c.loadingMeasurementMode,c.unloadingMeasurementMode].every(v=>['WEIGHBRIDGE','NONE'].includes(v))||!['PRELOADED_ROSTER','ON_FIRST_OPERATION','MIXED'].includes(c.driverIntakeMode))invalid();
 const r=c.routeConfiguration;exact(r,['loadingLocation','unloadingLocation','distanceKm','expectedTravelMinutes','toleranceMinutes']);
 if(!text(r.loadingLocation)||!text(r.unloadingLocation)||['distanceKm','expectedTravelMinutes','toleranceMinutes'].some(k=>r[k]!==undefined&&!finite(r[k])))invalid();
 const s=c.shiftConfiguration;exact(s,['mode','shifts']);if(!['NONE','DAY_NIGHT','CUSTOM'].includes(s.mode))invalid();
 if(s.mode==='NONE'){if(s.shifts?.length)invalid();}else{
  if(!Array.isArray(s.shifts)||!s.shifts.length||s.shifts.length>24||(s.mode==='DAY_NIGHT'&&s.shifts.length!==2))invalid();
  const occupied=new Set<number>(),ids=new Set<string>();
  for(const shift of s.shifts){exact(shift,['id','nameAr','nameEn','startMinute','endMinute']);
   if(!text(shift.id,64)||ids.has(shift.id)||!text(shift.nameAr)||!text(shift.nameEn)||![shift.startMinute,shift.endMinute].every(v=>Number.isInteger(v)&&v>=0&&v<1440)||shift.startMinute===shift.endMinute)invalid();ids.add(shift.id);
   for(let m=shift.startMinute;m!==shift.endMinute;m=(m+1)%1440){if(occupied.has(m))invalid();occupied.add(m);}
  }
 }
 const p=c.capacityEstimationPolicy;exact(p,p?.mode==='PROJECT_STANDARD'?['mode','tonnes']:p?.mode==='MATERIAL_TRUCK_MATRIX'?['mode','entries']:['mode']);
 if(!['NONE','TRUCK_CAPACITY','PROJECT_STANDARD','MATERIAL_TRUCK_MATRIX'].includes(p.mode))invalid();
 if(p.mode==='PROJECT_STANDARD'&&!finite(p.tonnes,true))invalid();
 if(p.mode==='MATERIAL_TRUCK_MATRIX'){
  if(!Array.isArray(p.entries)||!p.entries.length||p.entries.length>1000)invalid();const seen=new Set<string>();
  for(const e of p.entries){exact(e,['truckType','materialId','tonnes']);const id=e.truckType+':'+e.materialId;if(!['TIPPER_32M3','TRAILER_24M','FLATBED','DUMPER'].includes(e.truckType)||!text(e.materialId,128)||!finite(e.tonnes,true)||seen.has(id))invalid();seen.add(id);}
 }
 if(c.requiredCheckpoints!==undefined&&(!Array.isArray(c.requiredCheckpoints)||new Set(c.requiredCheckpoints).size!==c.requiredCheckpoints.length||c.requiredCheckpoints.some(v=>!checkpoints.includes(v))))invalid();
 return structuredClone(c);
}
export function resolveOperationalProfile(c:Pick<OperationalConfiguration,'loadingMeasurementMode'|'unloadingMeasurementMode'>):OperationalProfile {
 if(![c.loadingMeasurementMode,c.unloadingMeasurementMode].every(v=>['WEIGHBRIDGE','NONE'].includes(v)))return invalid();
 return c.loadingMeasurementMode==='WEIGHBRIDGE'?(c.unloadingMeasurementMode==='WEIGHBRIDGE'?'DUAL_WEIGHBRIDGE':'LOADING_SCALE_ONLY'):(c.unloadingMeasurementMode==='WEIGHBRIDGE'?'UNLOADING_SCALE_ONLY':'NO_WEIGHBRIDGE');
}
export function resolveWeightPolicy(c:OperationalConfiguration){return {loadingMeasured:c.loadingMeasurementMode==='WEIGHBRIDGE',unloadingMeasured:c.unloadingMeasurementMode==='WEIGHBRIDGE',variance:resolveOperationalProfile(c)==='DUAL_WEIGHBRIDGE'};}
export function resolveRequiredTripFields(c:OperationalConfiguration){const w=resolveWeightPolicy(c);return {driver:c.driverIntakeMode==='PRELOADED_ROSTER',loadingWeight:w.loadingMeasured,unloadingWeight:w.unloadingMeasured,checkpoints:c.requiredCheckpoints||[]};}
export function resolveReadinessRequirements(c:OperationalConfiguration,driverMode:DriverIntakeMode=c.driverIntakeMode){return {configuration:true,preloadedRoster:driverMode==='PRELOADED_ROSTER',coherentDriverPath:driverMode==='PRELOADED_ROSTER',...resolveWeightPolicy(c)};}
export function resolveReportingCapabilities(c:OperationalConfiguration){const p=resolveWeightPolicy(c);return {trips:true,timePerformance:true,productivity:true,measuredLoading:p.loadingMeasured,measuredUnloading:p.unloadingMeasured,weightReconciliation:p.variance,estimatedProduction:c.capacityEstimationPolicy.mode!=='NONE'};}
export function estimatedCapacity(c:OperationalConfiguration,context:{truckCapacityKg?:number;truckType?:string;materialId?:string}):number|null {
 const p=c.capacityEstimationPolicy;
 if(p.mode==='NONE')return null;if(p.mode==='PROJECT_STANDARD')return p.tonnes;
 if(p.mode==='TRUCK_CAPACITY')return finite(context.truckCapacityKg,true)?context.truckCapacityKg!/1000:null;
 return p.entries.find(e=>e.truckType===context.truckType&&e.materialId===context.materialId)?.tonnes??null;
}
export function resolveOperationalWeights(c:OperationalConfiguration,input:{loadingMeasuredWeight?:number|null;unloadingMeasuredWeight?:number|null;estimatedCapacityTonnes?:number|null}):OperationalWeights {
 const p=resolveWeightPolicy(c);for(const v of [input.loadingMeasuredWeight,input.unloadingMeasuredWeight,input.estimatedCapacityTonnes])if(v!==null&&v!==undefined&&!finite(v,true))throw Error('OPERATIONAL_WEIGHT_INVALID');
 if(!p.loadingMeasured&&input.loadingMeasuredWeight!=null||!p.unloadingMeasured&&input.unloadingMeasuredWeight!=null)throw Error('UNSUPPORTED_MEASUREMENT');
 const l=input.loadingMeasuredWeight??null,u=input.unloadingMeasuredWeight??null,estimate=input.estimatedCapacityTonnes??null;
 const basis:WeightBasis=c.capacityEstimationPolicy.mode==='TRUCK_CAPACITY'?'ESTIMATED_TRUCK_CAPACITY':c.capacityEstimationPolicy.mode==='PROJECT_STANDARD'?'PROJECT_STANDARD':c.capacityEstimationPolicy.mode==='MATERIAL_TRUCK_MATRIX'?'ESTIMATED_MATERIAL_TRUCK_MATRIX':'UNAVAILABLE';
 const dual=p.loadingMeasured&&p.unloadingMeasured;
 return {loadingMeasuredWeight:l,unloadingMeasuredWeight:u,loadingEffectiveWeight:l??(!p.loadingMeasured&&u!==null?u:!p.loadingMeasured&&!p.unloadingMeasured?estimate:null),unloadingEffectiveWeight:u??(!p.unloadingMeasured&&l!==null?l:!p.loadingMeasured&&!p.unloadingMeasured?estimate:null),loadingWeightBasis:l!==null?'MEASURED':!p.loadingMeasured&&u!==null?'DERIVED_FROM_UNLOADING':!p.loadingMeasured&&!p.unloadingMeasured&&estimate!==null?basis:'UNAVAILABLE',unloadingWeightBasis:u!==null?'MEASURED':!p.unloadingMeasured&&l!==null?'DERIVED_FROM_LOADING':!p.loadingMeasured&&!p.unloadingMeasured&&estimate!==null?basis:'UNAVAILABLE',weightVariance:dual&&l!==null&&u!==null?u-l:null,weightVariancePercent:dual&&l!==null&&u!==null?(u-l)/l*100:null};
}
const instant=(value?:string)=>{if(!value)return null;const n=Date.parse(value);return /^\d{4}-\d\d-\d\dT.*(?:Z|[+-]\d\d:\d\d)$/.test(value)&&Number.isFinite(n)?n:null;};
export function resolveTimeMetrics(t:OperationalTimeline,c:OperationalConfiguration,now=new Date()){
 const duration=(a?:string,b?:string)=>{const x=instant(a),y=instant(b);return x!==null&&y!==null&&y>=x?(y-x)/60000:null;};
 const departure=instant(t.departedAt),arrival=instant(t.arrivedAt),expected=departure!==null&&c.routeConfiguration.expectedTravelMinutes!==undefined?departure+c.routeConfiguration.expectedTravelMinutes*60000:null;
 const tolerance=(c.routeConfiguration.toleranceMinutes||0)*60000;
 return {loadingDuration:duration(t.loadingStartedAt,t.loadingCompletedAt),dispatchDelay:duration(t.loadingCompletedAt,t.departedAt),travelDuration:duration(t.departedAt,t.arrivedAt),waitingDuration:duration(t.arrivedAt,t.unloadingStartedAt),unloadingDuration:duration(t.unloadingStartedAt,t.unloadingCompletedAt),totalCycleDuration:duration(t.loadingStartedAt,t.completedAt||t.unloadingCompletedAt),expectedArrivalAt:expected===null?null:new Date(expected).toISOString(),arrivalVariance:expected!==null&&arrival!==null?(arrival-expected)/60000:null,delayStatus:arrival!==null?(expected!==null&&arrival>expected+tolerance?'DELAYED':'ARRIVED'):expected===null||Boolean(t.completedAt||t.unloadingCompletedAt)?'UNKNOWN':now.getTime()>expected+tolerance?'DELAYED':now.getTime()>expected?'AT_RISK':'ON_TIME'};
}
export function snapshotOperationalConfiguration(c:OperationalConfiguration,version:number,driverId:string|null,context:Parameters<typeof estimatedCapacity>[1]):TripOperationalSnapshot {
 const configuration=validateOperationalConfiguration(c);return {schemaVersion:1,configuration,profile:resolveOperationalProfile(configuration),configurationVersion:version,estimatedCapacityTonnes:estimatedCapacity(configuration,context),driverAtDispatch:driverId};
}
export const OperationalProfileResolver={validate:validateOperationalConfiguration,resolveOperationalProfile,resolveWeightPolicy,resolveRequiredTripFields,resolveReadinessRequirements,resolveReportingCapabilities,resolveOperationalWeights,resolveTimeMetrics};
/** New capability-aware Trips only. Trips without a snapshot keep their legacy FSM. */
export function profileTransitionAllowed(current:string,target:string,snapshot:TripOperationalSnapshot,timeline:OperationalTimeline,weights:OperationalWeights):boolean {
 const c=snapshot.configuration,p=resolveWeightPolicy(c);
 const edges:Record<string,string[]>={DISPATCHED:['AT_ORIGIN','LOADING','CANCELLED',...(!p.loadingMeasured?['IN_TRANSIT']:[])],AT_ORIGIN:['LOADING','CANCELLED',...(!p.loadingMeasured?['IN_TRANSIT']:[])],LOADING:[...(p.loadingMeasured?['WEIGHED_ORIGIN']:['IN_TRANSIT']),'REJECTED'],WEIGHED_ORIGIN:['IN_TRANSIT','CANCELLED'],IN_TRANSIT:['AT_DESTINATION','REJECTED'],AT_DESTINATION:[...(p.unloadingMeasured?['WEIGHED_DESTINATION']:['OFFLOADED']),'REJECTED'],WEIGHED_DESTINATION:['OFFLOADED','REJECTED'],OFFLOADED:['COMPLETED']};
 if(!edges[current]?.includes(target))return false;
 if(target==='IN_TRANSIT'&&p.loadingMeasured&&weights.loadingMeasuredWeight===null)return false;
 if(['OFFLOADED','COMPLETED'].includes(target)&&p.unloadingMeasured&&weights.unloadingMeasuredWeight===null)return false;
 if(target==='IN_TRANSIT'&&(c.requiredCheckpoints||[]).some(k=>['loadingStartedAt','loadingCompletedAt'].includes(k)&&!timeline[k]))return false;
 if(target==='COMPLETED'&&(c.requiredCheckpoints||[]).some(k=>!timeline[k]))return false;
 return true;
}
