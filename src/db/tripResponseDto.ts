/** Generic Trip API disclosure contract. Internal canonical objects are never wire DTOs. */
import type {TripOperationalSnapshot,OperationalWeights} from '../types/operationalProfile';
import {tripFail} from './tripContracts.js';

type Scalar=string|number|boolean|null;
type Fields=Record<string,Scalar>;
export interface TripFinancialDto extends Fields {version:number;isFinalized:boolean;}
export interface TripResponseDto {
 tripId:string;tripNumber:string;projectId:string;revision:number;status:string;
 carrierId:string;driverId:string|null;truckId:string;materialId:string;sourceType:string;
 weights:Fields;financials:TripFinancialDto;pricingSnapshot:Fields;
 operationalSnapshot:TripOperationalSnapshot|null;operationalWeights:OperationalWeights;
 operationalTimeline:Fields;timeMetrics:Fields;measurementIds:Record<string,Record<string,string>>;
 entitySnapshots:Record<string,Fields>;projectSnapshot:Fields;carrierSnapshot:Fields;
 driverSnapshot:Fields|null;truckSnapshot:Fields;materialSnapshot:Fields;
 source:Fields;sourceMetadata:Fields;
}
export interface TripEventResponseDto {id?:Scalar;seq?:Scalar;event_type?:Scalar;occurred_at?:Scalar;operation_id?:Scalar;resulting_state?:Scalar;payload:Record<string,unknown>;}
export interface TripWeightResponseDto { [key:string]:Scalar|Fields[]; }
const roles=new Set(['SUPER_ADMIN','PROJECT_ADMIN','DISPATCHER','SUPERVISOR','SITE_SUPERVISOR','SCALE_OPERATOR','DRIVER','FINANCE_AUDITOR','VIEWER']);
function authorize(role:string){if(!roles.has(role))tripFail('FORBIDDEN_TRIP_ACTION',403);}
/** Only named scalar fields can cross the boundary; no spread/copy of unknown descendants. */
function fields(value:unknown,keys:readonly string[]):Fields {
 const out:Fields={};if(!value||typeof value!=='object'||Array.isArray(value))return out;
 for(const key of keys){let v=(value as Record<string,unknown>)[key];if(v instanceof Date)v=v.toISOString();
  if(v===null||typeof v==='string'||typeof v==='boolean'||typeof v==='number'&&Number.isFinite(v))out[key]=v as Scalar;
 }return out;
}
const checkpoints=['loadingStartedAt','loadingCompletedAt','departedAt','arrivedAt','unloadingStartedAt','unloadingCompletedAt','completedAt','expectedArrivalAt'];
const sourceFields=['contract','sourceRevisionId','sourceSha','inventoryDigest','mappingDigest','correctionDigest','rowId','physicalRow','sourceType','importSessionId','importBatchId'];
const pricingFields=['pricingRuleId','projectId','carrierId','materialId','pricingType','rate','currency','effectiveFrom','effectiveTo','minimumBillableWeightKg','demurrageRatePerHourSAR','freeTimeHours','vatApplicable','vatRatePercent','agreedRate','pricingRuleVersion','termsRevisionId','isPending','status','settlementAmount','settlementBase'];
const financialFields=['settlementId','version','status','quantity_kg','quantity_basis','base_amount','demurrage','deductions','adjustment','subtotal','tax','final_amount','quoted_amount','currency','isFinalized','settlementAmount','reviewRequired','baseAmountSAR','demurrageAmountSAR','deductionsAmountSAR','subtotalSAR','vatAmountSAR','totalAmountSAR','quotedTotalAmountSAR'];
const displays:Record<string,string[]>={
 CARRIER:['carrierId','externalId','nameAr','companyNameAr','commercialRegistrationNo','vatNumber','transportLicenseNo','status'],
 DRIVER:['driverId','externalId','fullNameAr','status'],
 TRUCK:['truckId','externalId','plate','plateNumberAr','normalizedPlate','truckType','tareWeightKg','maxGrossWeightKg','legalPayloadLimitKg','status'],
 MATERIAL:['materialId','externalId','nameAr','nameEn','code','unitOfMeasure','standardDensityTonPerM3','maxAllowableMoisturePercent','status'],
};
function measurementIds(value:any){const out:Record<string,Record<string,string>>={};for(const side of ['origin','destination'])if(value?.[side])out[side]=fields(value[side],['TARE','GROSS','NET']) as Record<string,string>;return out;}
function configuration(c:any){if(!c)return null;const out:any=fields(c,['schemaVersion','loadingMeasurementMode','unloadingMeasurementMode','driverIntakeMode']);
 out.routeConfiguration=fields(c.routeConfiguration,['loadingLocation','unloadingLocation','distanceKm','expectedTravelMinutes','toleranceMinutes']);
 out.shiftConfiguration=fields(c.shiftConfiguration,['mode']);if(Array.isArray(c.shiftConfiguration?.shifts))out.shiftConfiguration.shifts=c.shiftConfiguration.shifts.slice(0,24).map((v:any)=>fields(v,['id','nameAr','nameEn','startMinute','endMinute']));
 out.capacityEstimationPolicy=fields(c.capacityEstimationPolicy,['mode','tonnes']);if(Array.isArray(c.capacityEstimationPolicy?.entries))out.capacityEstimationPolicy.entries=c.capacityEstimationPolicy.entries.slice(0,1000).map((v:any)=>fields(v,['truckType','materialId','tonnes']));
 if(Array.isArray(c.requiredCheckpoints))out.requiredCheckpoints=c.requiredCheckpoints.filter((v:any)=>checkpoints.includes(v)).slice(0,6);return out;
}
export function tripResponse(value:any,role:string):TripResponseDto {
 authorize(role);const out:any=fields(value,['tripId','tripNumber','projectId','carrierId','driverId','truckId','materialId','revision','version','status','createdAt','createdBy','updatedAt','updatedBy','pricedAt','pricingRuleId','clientUUID','sourceType','loadingActorId','loadingActorType','loadingDataSource','unloadingActorId','unloadingActorType','unloadingDataSource','hasExceptions','unloadDecision','lastObservedAt']);
 out.projectSnapshot=fields(value.projectSnapshot,['projectId','projectNumber','nameAr']);
 out.entitySnapshots={};for(const kind of Object.keys(displays)){if(value.entitySnapshots?.[kind])out.entitySnapshots[kind]=fields(value.entitySnapshots[kind],displays[kind]);const name=kind.toLowerCase()+'Snapshot';out[name]=value[name]==null?null:fields(value[name],displays[kind]);}
 out.weights=fields(value.weights,['originTareKg','originGrossKg','originNetKg','destinationTareKg','destinationGrossKg','destinationNetKg','originTicketNo','destinationTicketNo','varianceKg','billableWeightKg']);
 out.measurementIds=measurementIds(value.measurementIds);out.operationalTimeline=fields(value.operationalTimeline,checkpoints);
 out.operationalSnapshot=value.operationalSnapshot==null?null:{...fields(value.operationalSnapshot,['schemaVersion','profile','configurationVersion','estimatedCapacityTonnes','driverAtDispatch']),configuration:configuration(value.operationalSnapshot.configuration)};
 if(value.operationalWeights)out.operationalWeights=fields(value.operationalWeights,['loadingMeasuredWeight','unloadingMeasuredWeight','loadingEffectiveWeight','unloadingEffectiveWeight','loadingWeightBasis','unloadingWeightBasis','weightVariance','weightVariancePercent']);
 if(value.timeMetrics)out.timeMetrics=fields(value.timeMetrics,['loadingDuration','dispatchDelay','travelDuration','waitingDuration','unloadingDuration','totalCycleDuration','expectedArrivalAt','arrivalVariance','delayStatus']);
 out.source=fields(value.source,sourceFields);out.sourceMetadata=fields(value.sourceMetadata,[...sourceFields,'sourceRowId','legacyTripSerial','legacyStatus','sourceTicketId']);
 out.pricingSnapshot=fields(value.pricingSnapshot,pricingFields);out.financials=fields(value.financials,financialFields);return out;
}
/** Full command evidence is stored first. Both initial and cached wire results use this projection. */
export function tripCommandResponse<T>(value:T,role:string):T {
 authorize(role);const result:any=value,out:any=fields(result,['operationId','queries','transactionMs','created']);if(result.trip)out.trip=tripResponse(result.trip,role);return out as T;
}
const eventFields:Record<string,string[]>={
 DISPATCH_TRIP:[],RECORD_LOADING:['command'],ARRIVE_ORIGIN:['command'],START_LOADING:['command'],COMPLETE_LOADING:['checkpoint'],ASSOCIATE_DRIVER:['driverId'],RECORD_ORIGIN_WEIGHT:['command'],START_TRANSIT:['command'],RECORD_ARRIVAL:['command'],START_UNLOADING:['checkpoint'],RECORD_DESTINATION_WEIGHT:['command'],RECORD_DESTINATION_NET:['command'],ACCEPT_ORIGIN_NET:['command','unloadDecision'],COMPLETE_UNLOADING:['command'],COMPLETE_TRIP:['command'],CANCEL_TRIP:['command'],REPORT_EXCEPTION:['exceptionId','projectId','tripId','type','severity','status'],CORRECT_MEASUREMENT:[],SETTLE_PRICING:['settlementId'],REQUEST_ADJUSTMENT:['adjustmentId'],APPROVE_ADJUSTMENT:['adjustmentId','previousSettlementId'],DISPATCHED_IMPORTED:['historicalStatus'],
};
export function tripEventResponse(value:any,role:string):TripEventResponseDto {authorize(role);const out:any=fields(value,['id','seq','event_type','occurred_at','operation_id','resulting_state']),keys=Object.hasOwn(eventFields,value.event_type)?eventFields[value.event_type]:undefined;out.payload={};
 if(keys){out.payload=fields(value.payload,[...keys,'fromState','toState']);if(value.payload?.measurementIds)out.payload.measurementIds=fields(value.payload.measurementIds,['TARE','GROSS','NET']);
  if(value.event_type==='CORRECT_MEASUREMENT')out.payload.correction=fields(value.payload?.correction,['id','kg','type','previousId','previousKg']);
  if(value.event_type==='DISPATCHED_IMPORTED'){out.payload.source=fields(value.payload?.source,sourceFields);out.payload.observedTimes=fields(value.payload?.observedTimes,['loadTime','unloadTime','weighTime']);}
 }return out;
}
export function tripWeightResponse(value:any,role:string):TripWeightResponseDto {authorize(role);const out:TripWeightResponseDto=fields(value,['id','event_id','measurement_type','weight_kg','source_unit','source_type','source_file_hash','captured_at','observed_at','actor_id','authority_status','correction_of']);
 // Raw measurement text may contain localized numeric notation/units, never arbitrary narrative.
 if(typeof value.raw_value==='string'&&value.raw_value.length<=256&&/^[0-9٠-٩.,٫٬+\-\s]+(?:kg|كجم|كيلو|طن|tons?|KG|TON)?$/.test(value.raw_value))out.raw_value=value.raw_value;
 if(Array.isArray(value.source_correction))out.source_correction=value.source_correction.slice(0,1000).map((v:any)=>fields(v,['sourceRowId','field','mappingDigest','sourceRevisionId','approvedBy','approvedAt']));
 return out;
}
