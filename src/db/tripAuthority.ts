import {tripResponse,tripCommandResponse,tripEventResponse,tripWeightResponse} from './tripResponseDto.js';
/** AR2-U06 isolated SQL command authority. No production route mount. */
import {randomUUID,createHash} from 'node:crypto';
import {SqlCanonicalAuthority,type Scope,type SqlAuthorityDependencies} from './canonicalAuthority.js';
import type {UnitOfWork} from './unitOfWork.js';
import type {CanonicalIdentityRepository} from './canonicalIdentityRepository.js';
import {identitySpec} from './canonicalIdentityRepository.js';
import {IdentityProtection,stableValue} from './identityProtection.js';
import {TRIP_COMMANDS,canExecuteTripCommand,type TripCommandName} from '../types/tripCommands';
import {ALLOWED_TRIP_TRANSITIONS} from '../validators/trip.validator';
import {ExceptionValidator} from '../validators/exception.validator';
import {snapshotOperationalConfiguration,resolveOperationalWeights,resolveTimeMetrics,profileTransitionAllowed} from '../services/operationalProfileResolver';
import {TripPricingRepository} from './tripPricingRepository.js';
import {TripSettlementRepository} from './tripSettlementRepository.js';
import {TripMeasurementRepository,type TripMeasurementVerifier,type MeasurementEvidence} from './tripMeasurementRepository.js';
import {tripFail,tripId,exactTrip,tripEnvelope,decimal,type SqlTripEnvelope} from './tripContracts.js';
const extra:Record<string,{roles:string[];fields:string[]}>= {
 SETTLE_PRICING:{roles:['SUPER_ADMIN','PROJECT_ADMIN','FINANCE_AUDITOR'],fields:['reason','pricingRuleId','billableWaitingHours']},
 CORRECT_MEASUREMENT:{roles:['SUPER_ADMIN','PROJECT_ADMIN','SCALE_OPERATOR','SUPERVISOR','SITE_SUPERVISOR'],fields:['measurementId','rawValue','unit','reason']},
 REQUEST_ADJUSTMENT:{roles:['SUPER_ADMIN','PROJECT_ADMIN','FINANCE_AUDITOR','DISPATCHER','SUPERVISOR','SITE_SUPERVISOR'],fields:['adjustmentId','adjustmentType','amountOrRateAdjustment','reason']},
 APPROVE_ADJUSTMENT:{roles:['SUPER_ADMIN','PROJECT_ADMIN','FINANCE_AUDITOR'],fields:['adjustmentId']},
};
const terminal=(s:string)=>['COMPLETED','CANCELLED','REJECTED'].includes(s);
export class SqlTripAuthority extends SqlCanonicalAuthority {
 private links=new WeakMap<UnitOfWork,string|null>();
 constructor(deps:SqlAuthorityDependencies & {measurementVerifier?:TripMeasurementVerifier}={}){super(deps);this.verifier=deps.measurementVerifier;}
 private readonly verifier?:TripMeasurementVerifier;
 protected async authorize(uow:UnitOfWork){const a=(await uow.query('SELECT * FROM qsa_authorize_trip_command()')).rows[0];this.links.set(uow,a.linked_driver_id);await uow.query("SELECT set_config('app.company_timezone',$1,true)",[a.company_timezone]);return a;}
 private aad(uow:UnitOfWork,id:string){return `${uow.context.companyId}/${uow.context.projectId}/trip/${id}`;}
 protected async header(uow:UnitOfWork,id:string){if(!tripId(id))tripFail('TRIP_NOT_FOUND');const row=(await uow.query('SELECT * FROM trips WHERE company_id=$1 AND project_id=$2 AND external_id=$3 FOR UPDATE',[uow.context.companyId,uow.context.projectId,id])).rows[0];if(!row)tripFail('TRIP_NOT_FOUND');if(!Number.isSafeInteger(Number(row.version))||Number(row.version)<1)tripFail('TRIP_REVISION_UNVERIFIED');if(row.authority_schema!==1||!row.projection_encrypted)tripFail('TRIP_LEGACY_RECONCILIATION_REQUIRED');return row;}
 protected doc(uow:UnitOfWork,crypto:IdentityProtection,row:any){const doc=crypto.open<any>(row.projection_encrypted,this.aad(uow,row.id));if(doc.tripId!==row.external_id||doc.revision!==Number(row.version)||doc.status!==row.state)tripFail('TRIP_PROJECTION_UNVERIFIED');return doc;}
 protected async ownership(uow:UnitOfWork,row:any){if(this.actorRoles.get(uow)!=='DRIVER')return;const linked=this.links.get(uow);if(!linked||row?.driver_id!==linked)tripFail('FORBIDDEN_DRIVER_OWNERSHIP',403);
  const d=(await uow.query("SELECT status FROM drivers WHERE company_id=$1 AND id=$2",[uow.context.companyId,linked])).rows[0];if(d?.status!=='ACTIVE')tripFail('FORBIDDEN_DRIVER_OWNERSHIP',403);
 }
 protected allowed(uow:UnitOfWork,command:string){const role=this.actorRoles.get(uow)!;if(extra[command]? !extra[command].roles.includes(role):!Object.hasOwn(TRIP_COMMANDS,command)||!canExecuteTripCommand(role as any,command as TripCommandName))tripFail('FORBIDDEN_TRIP_ACTION',403);}
 private async receiptCommand<T>(token:string,scope:Scope,r:SqlTripEnvelope,run:(uow:UnitOfWork,ids:CanonicalIdentityRepository,crypto:IdentityProtection)=>Promise<T>){
  return this.scoped(token,scope,false,async(uow,crypto,ids)=>{
   this.allowed(uow,r.command);if(r.payload.tripId)await this.ownership(uow,await this.header(uow,r.payload.tripId));
   const hash=crypto.digest('command',stableValue([uow.context.companyId,uow.context.projectId,uow.context.actorId,r])).toString('hex'),aad=`${uow.context.companyId}/${uow.context.projectId}/receipt/${r.operationId}`;
   const old=(await uow.query('SELECT * FROM idempotency_receipts WHERE company_id=$1 AND project_id=$2 AND operation_id=$3 FOR UPDATE',[uow.context.companyId,uow.context.projectId,r.operationId])).rows[0];
   if(old){if(old.actor_id!==uow.context.actorId||old.request_hash!==hash)tripFail('IDEMPOTENCY_PAYLOAD_MISMATCH');if(old.state!=='COMMITTED'||!old.result_encrypted)tripFail('IDEMPOTENCY_STATE_CONFLICT');const value:any=crypto.open<T>(old.result_encrypted,aad);if(value.trip?.tripId){const latest=await this.header(uow,value.trip.tripId);await this.ownership(uow,latest);value.trip=this.doc(uow,crypto,latest);}return tripCommandResponse(value,this.actorRoles.get(uow)!);}
   await uow.checkOrAcquireIdempotency(r.operationId,hash);await uow.query("SELECT set_config('app.operation_id',$1,true)",[r.operationId]);
   const result=JSON.parse(JSON.stringify(await run(uow,ids,crypto))) as T;await uow.query("UPDATE idempotency_receipts SET state='COMMITTED',result_encrypted=$4 WHERE company_id=$1 AND project_id=$2 AND operation_id=$3",[uow.context.companyId,uow.context.projectId,r.operationId,crypto.seal(result,aad)]);return tripCommandResponse(result,this.actorRoles.get(uow)!);
  });
 }
 async execute(token:string,scope:Scope,r:SqlTripEnvelope){
  tripEnvelope(r);const creation=['DISPATCH_TRIP','RECORD_LOADING','IMPORT_TRIP'].includes(r.command),policy=(TRIP_COMMANDS as any)[r.command]||extra[r.command];if(!policy)tripFail('INVALID_TRIP_COMMAND');
  exactTrip(r.payload,[...policy.fields,...(!creation?['tripId']:[]),...(['RECORD_LOADING','RECORD_ORIGIN_WEIGHT','RECORD_DESTINATION_WEIGHT','RECORD_DESTINATION_NET'].includes(r.command)?['measurementEvidence']:[])]);
  if(creation?r.expectedRevision!==0:!tripId(r.payload.tripId))tripFail('TRIP_REVISION_CONFLICT');
  if(r.command==='IMPORT_TRIP')tripFail('REVIEWED_TRIP_SOURCE_REQUIRED');
  return this.receiptCommand(token,scope,r,(uow,ids,crypto)=>this.executeWithin(uow,ids,crypto,r));
 }
 /** Internal composition only: caller owns authenticated, scoped transaction + receipt. */
 async executeWithin(uow:UnitOfWork,ids:CanonicalIdentityRepository,crypto:IdentityProtection,r:SqlTripEnvelope,trusted?:{source:unknown;measurement?:MeasurementEvidence;historical?:any;sourceRowKey?:string}){
  const started=performance.now();let queryCount=0;const query=uow.query.bind(uow);uow.query=((...args:any[])=>{if(++queryCount>180)tripFail('TRIP_QUERY_BUDGET');return (query as any)(...args);}) as typeof uow.query;
  try{
   const project=(await uow.query('SELECT * FROM projects WHERE company_id=$1 AND id=$2',[uow.context.companyId,uow.context.projectId])).rows[0];if(['ARCHIVED','SUSPENDED'].includes(project.status))tripFail('PROJECT_OPERATIONAL_STATUS_DENIED');
   const creation=['DISPATCH_TRIP','RECORD_LOADING','IMPORT_TRIP'].includes(r.command),p=r.payload,now=new Date((await uow.query('SELECT clock_timestamp() AS at')).rows[0].at).toISOString();
   let row:any,doc:any,initialEvent:string|undefined;
   if(creation){
    if(r.expectedRevision!==0)tripFail('TRIP_REVISION_CONFLICT');if(r.command==='IMPORT_TRIP'&&!trusted)tripFail('REVIEWED_TRIP_SOURCE_REQUIRED');
    const refs=await this.references(uow,ids,p,project.operational_configuration?.driverIntakeMode||'PRELOADED_ROSTER');
    const counter=(await uow.query('SELECT next_number FROM trip_number_counters WHERE company_id=$1 AND project_id=$2 FOR UPDATE',[uow.context.companyId,uow.context.projectId])).rows[0];
    if(!counter){if((await uow.query('SELECT 1 FROM trips WHERE company_id=$1 AND project_id=$2 LIMIT 1',[uow.context.companyId,uow.context.projectId])).rowCount)tripFail('TRIP_NUMBER_RECONCILIATION_REQUIRED');await uow.query('INSERT INTO trip_number_counters(company_id,project_id,next_number) VALUES($1,$2,1)',[uow.context.companyId,uow.context.projectId]);}
    const n=(await uow.query('UPDATE trip_number_counters SET next_number=next_number+1 WHERE company_id=$1 AND project_id=$2 RETURNING next_number-1 AS n',[uow.context.companyId,uow.context.projectId])).rows[0].n;
    const id=randomUUID(),external='TRP-'+id,number=`${project.project_number?`Q-PRJ-${String(project.project_number).padStart(4,'0')}`:project.external_id}-TRP-${String(n).padStart(5,'0')}`;
    const pricedAt=trusted?.historical?.shiftDate||trusted?.historical?.pricingDecisionAt||now;
    const pending=r.command==='IMPORT_TRIP'&&(!p.pricingRuleId||['PENDING','UNRESOLVED_PENDING'].includes(p.pricingRuleId));
    const pricing=pending?null:await new TripPricingRepository(uow,ids).resolve(p.carrierId,p.materialId,pricedAt,p.pricingRuleId);
    const snapshot=project.operational_configuration?snapshotOperationalConfiguration(project.operational_configuration,Number(project.version),p.driverId||null,{truckCapacityKg:refs.TRUCK.view.legalPayloadLimitKg,truckType:refs.TRUCK.view.truckType,materialId:p.materialId}):null;
    doc={tripId:external,tripNumber:number,projectId:project.external_id,carrierId:p.carrierId,driverId:p.driverId||null,truckId:p.truckId,materialId:p.materialId,revision:0,status:'DISPATCHED',createdAt:now,createdBy:uow.context.actorId,pricedAt,
     operationalSnapshot:snapshot,operationalTimeline:{},weights:{},measurementIds:{},source:trusted?.source||{sourceType:'MANUAL'},sourceType:(trusted?.source as any)?.sourceType||'MANUAL',sourceMetadata:trusted?{...(trusted.source as any),sourceRowId:(trusted.source as any)?.rowId,legacyTripSerial:trusted.historical?.tripSerial??null,legacyStatus:trusted.historical?.legacyStatus??null,sourceTicketId:trusted.historical?.ticketId??null}:{},entitySnapshots:Object.fromEntries(Object.entries(refs).map(([k,v]:any)=>[k,v.view])),
     pricingRuleId:pricing?.terms.pricingRuleId??null,clientUUID:r.operationId,projectSnapshot:{projectId:project.external_id,projectNumber:project.project_number??null,nameAr:project.name},carrierSnapshot:{...refs.CARRIER.view,companyNameAr:refs.CARRIER.view.nameAr},truckSnapshot:{...refs.TRUCK.view,plateNumberAr:refs.TRUCK.view.plate},driverSnapshot:refs.DRIVER?.view??null,materialSnapshot:refs.MATERIAL.view,loadingActorId:uow.context.actorId,loadingActorType:trusted?'IMPORT':'USER',loadingDataSource:(trusted?.source as any)?.sourceType||'MANUAL',unloadingActorId:null,unloadingActorType:null,unloadingDataSource:null,pricingSnapshot:pricing?{...pricing.terms,agreedRate:pricing.terms.rate,pricingRuleVersion:Number(pricing.row.version),termsRevisionId:pricing.revision.id,isPending:pricing.terms.pricingType==='PER_TON'}:{pricingRuleId:null,status:'UNRESOLVED_PENDING',isPending:true},financials:{isFinalized:false,settlementAmount:null}};
    await uow.query(`INSERT INTO trips(id,company_id,project_id,external_id,trip_number,carrier_id,driver_id,truck_id,material_id,state,version,authority_schema,created_by,updated_by,operational_snapshot,source_row_key,source_ticket_hmac)
     VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,'DISPATCHED',0,1,$10,$10,$11,$12,$13)`,[id,uow.context.companyId,uow.context.projectId,external,number,refs.CARRIER.row.id,refs.DRIVER?.row.id||null,refs.TRUCK.row.id,refs.MATERIAL.row.id,uow.context.actorId,snapshot,trusted?.sourceRowKey||null,(trusted?.historical?.ticketId||p.originTicketNo)?crypto.digest('trip-source-ticket',[uow.context.companyId,uow.context.projectId,String(trusted?.historical?.ticketId||p.originTicketNo).trim()]):null]);
    row={id,external_id:external,state:'DISPATCHED',version:0,driver_id:refs.DRIVER?.row.id||null};
    await new TripSettlementRepository(uow).freeze(id,pricedAt,pricing);
    if(r.command==='IMPORT_TRIP')initialEvent=await this.importFacts(uow,crypto,ids,row,doc,r,trusted!,now);else initialEvent=await this.event(uow,crypto,row,doc,r,'DISPATCH_TRIP',{},now);
    if(r.command==='RECORD_LOADING')for(const edge of ['AT_ORIGIN','LOADING','WEIGHED_ORIGIN','IN_TRANSIT'])await this.transition(uow,crypto,ids,row,doc,r,edge,now);
   }else{
    row=await this.header(uow,p.tripId);doc=this.doc(uow,crypto,row);if(Number(row.version)!==r.expectedRevision)tripFail('TRIP_REVISION_CONFLICT');
    await this.ownership(uow,row);
    if(r.command!=='ASSOCIATE_DRIVER')await this.references(uow,ids,doc,doc.operationalSnapshot?.configuration.driverIntakeMode||'PRELOADED_ROSTER');
    if(r.command==='ASSOCIATE_DRIVER'){
     if(!doc.operationalSnapshot||doc.driverId||terminal(doc.status)||doc.financials.isFinalized)tripFail('DRIVER_ASSOCIATION_NOT_ALLOWED');
     const refs=await this.references(uow,ids,{...doc,driverId:p.driverId},doc.operationalSnapshot.configuration.driverIntakeMode);doc.driverId=p.driverId;doc.entitySnapshots.DRIVER=refs.DRIVER.view;
     await uow.query('UPDATE trips SET driver_id=$1,version=version WHERE company_id=$2 AND project_id=$3 AND id=$4',[refs.DRIVER.row.id,uow.context.companyId,uow.context.projectId,row.id]);await this.event(uow,crypto,row,doc,r,r.command,{driverId:p.driverId},now);
    }else if(['COMPLETE_LOADING','START_UNLOADING'].includes(r.command)){
     const point=r.command==='COMPLETE_LOADING'?'loadingCompletedAt':'unloadingStartedAt',states=r.command==='COMPLETE_LOADING'?['LOADING','WEIGHED_ORIGIN']:['AT_DESTINATION','WEIGHED_DESTINATION'];
     if(!doc.operationalSnapshot||!states.includes(doc.status)||doc.financials.isFinalized)tripFail('OPERATIONAL_CHECKPOINT_INVALID');if(!doc.operationalTimeline[point]){doc.operationalTimeline[point]=now;await this.event(uow,crypto,row,doc,r,r.command,{checkpoint:point},now);}
    }else if(r.command==='REPORT_EXCEPTION'){
     const e:any={exceptionId:p.exceptionId,projectId:doc.projectId,tripId:doc.tripId,type:p.type||'ROUTE_DEVIATION',severity:p.severity||'MEDIUM',status:'OPEN'};if(!ExceptionValidator.validate(e).isValid)tripFail('INVALID_EXCEPTION');
     const reason=p.descriptionAr||p.descriptionEn||'Operational exception';if(typeof reason!=='string'||reason.length>2000)tripFail('INVALID_EXCEPTION');await uow.query('INSERT INTO exceptions(id,company_id,project_id,trip_id,reason,status) VALUES($1,$2,$3,$4,$5,$6)',[randomUUID(),uow.context.companyId,uow.context.projectId,row.id,reason,'OPEN']);doc.hasExceptions=true;await this.event(uow,crypto,row,doc,r,r.command,e,now);
    }else if(r.command==='SETTLE_PRICING')await this.settle(uow,crypto,ids,row,doc,r,now);
    else if(r.command==='CORRECT_MEASUREMENT'){
     const event=randomUUID(),correction=await new TripMeasurementRepository(uow).correct(row.id,event,p,now),side=correction.type.startsWith('ORIGIN')?'origin':'destination',kind=correction.type.split('_')[1];
     if(doc.measurementIds[side]?.[kind]!==correction.previousId)tripFail('MEASUREMENT_CORRECTION_STALE');
     doc.weights[side+({NET:'NetKg',TARE:'TareKg',GROSS:'GrossKg'}[kind])]=correction.kg;doc.measurementIds[side][kind]=correction.id;
     if(kind!=='NET'){const tare=doc.weights[side+'TareKg'],gross=doc.weights[side+'GrossKg'];const net=(await uow.query('SELECT ($1::numeric-$2::numeric)::numeric(18,3) AS net',[gross,tare])).rows[0].net;if(Number(net)<=0)tripFail('INVALID_GROSS_LESS_THAN_TARE');doc.weights[side+'NetKg']=net;doc.measurementIds[side].NET=await new TripMeasurementRepository(uow).derivedCorrection(row.id,event,doc.measurementIds[side].NET,net,p.reason,now);}
     if(doc.financials.isFinalized)doc.financials.reviewRequired=true;await this.event(uow,crypto,row,doc,r,r.command,{correction},now,event);
    }else if(r.command==='REQUEST_ADJUSTMENT'||r.command==='APPROVE_ADJUSTMENT')await this.adjust(uow,crypto,row,doc,r,now);
    else{const target=(TRIP_COMMANDS as any)[r.command]?.target;if(!target)tripFail('INVALID_TRIP_COMMAND');await this.transition(uow,crypto,ids,row,doc,r,target,now);}
   }
   return {trip:doc,operationId:r.operationId,queries:queryCount,transactionMs:performance.now()-started,...(initialEvent?{created:true}:{})};
  }catch(error:any){if(error.code==='23505'&&['trip_source_row_once','trip_source_ticket_once','trip_weight_source_event','trip_weight_ticket_identity'].includes(error.constraint))tripFail('DUPLICATE_SOURCE_EVENT');if(error.code==='22003')tripFail('COMMERCIAL_NUMERIC_LIMIT');throw error;}finally{uow.query=query;}
 }
 private async references(uow:UnitOfWork,ids:CanonicalIdentityRepository,p:any,driverMode:string){
  const result:any={};for(const kind of ['CARRIER','DRIVER','MATERIAL','TRUCK'] as const){const key=kind.toLowerCase()+'Id';if(kind==='DRIVER'&&!p[key]&&driverMode!=='PRELOADED_ROSTER')continue;
   if(!tripId(p[key]))tripFail('CANONICAL_REFERENCE_REQUIRED');const row=await ids.get(kind,p[key],true),spec=identitySpec(kind),member=(await uow.query(`SELECT status FROM ${spec.member} WHERE company_id=$1 AND project_id=$2 AND ${spec.field}=$3 AND valid_period @> clock_timestamp() FOR SHARE`,[uow.context.companyId,uow.context.projectId,row.id])).rows[0];
   if(row.status!=='ACTIVE'||member?.status!=='ACTIVE')tripFail('CANONICAL_PARTICIPATION_REQUIRED');result[kind]={row,view:ids.toIdentity(kind,row)};
  }
  const scope=[uow.context.companyId,uow.context.projectId],truck=result.TRUCK.row.id,driver=result.DRIVER?.row.id;
  for(const kind of ['DRIVER','TRUCK'] as const){if(!result[kind])continue;const field=kind.toLowerCase()+'_id',table=kind.toLowerCase()+'_carrier_affiliations';
   const a=(await uow.query(`SELECT carrier_id FROM ${table} WHERE company_id=$1 AND project_id=$2 AND ${field}=$3 AND record_status='ACCEPTED' AND voided_at IS NULL AND valid_period @> clock_timestamp() FOR SHARE`,[...scope,result[kind].row.id])).rows[0];if(a?.carrier_id!==result.CARRIER.row.id)tripFail('CANONICAL_AFFILIATION_REQUIRED');}
  const a=(await uow.query("SELECT driver_id,truck_id FROM driver_truck_assignments WHERE company_id=$1 AND project_id=$2 AND (truck_id=$3 OR driver_id=$4) AND record_status='ACCEPTED' AND voided_at IS NULL AND valid_period @> clock_timestamp() FOR SHARE",[...scope,truck,driver||null])).rows;
  if(driver?(a.length!==1||a[0].driver_id!==driver||a[0].truck_id!==truck):a.length>0)tripFail(driver?'CANONICAL_ASSIGNMENT_REQUIRED':'CANONICAL_ASSIGNED_DRIVER_REQUIRED');
  const m=(await uow.query("SELECT material_id FROM truck_material_allocations WHERE company_id=$1 AND project_id=$2 AND truck_id=$3 AND record_status='ACCEPTED' AND voided_at IS NULL AND valid_period @> clock_timestamp() FOR SHARE",[...scope,truck])).rows[0];if(m?.material_id!==result.MATERIAL.row.id)tripFail('CANONICAL_ALLOCATION_REQUIRED');return result;
 }
 private operational(doc:any){const snap=doc.operationalSnapshot;return snap?resolveOperationalWeights(snap.configuration,{loadingMeasuredWeight:doc.weights.originNetKg==null?null:Number(doc.weights.originNetKg)/1000,unloadingMeasuredWeight:doc.weights.destinationNetKg==null?null:Number(doc.weights.destinationNetKg)/1000,estimatedCapacityTonnes:snap.estimatedCapacityTonnes}):null;}
 private async transition(uow:UnitOfWork,crypto:IdentityProtection,ids:CanonicalIdentityRepository,row:any,doc:any,r:SqlTripEnvelope,target:string,now:string,trusted?:MeasurementEvidence){
  if(doc.financials.isFinalized||terminal(doc.status))tripFail('TRIP_TERMINAL');
  const snap=doc.operationalSnapshot,allowed=snap?profileTransitionAllowed(doc.status,target,snap,doc.operationalTimeline,this.operational(doc)!):(ALLOWED_TRIP_TRANSITIONS as any)[doc.status]?.includes(target);if(!allowed)tripFail('INVALID_TRIP_TRANSITION');
  const event=randomUUID(),payload:any={command:r.command};
  if(['WEIGHED_ORIGIN','WEIGHED_DESTINATION'].includes(target)){
   if(r.command==='ACCEPT_ORIGIN_NET'){
    if(snap)tripFail('DERIVED_WEIGHT_IS_NOT_A_MEASUREMENT');if(!doc.weights.originNetKg)tripFail('INVALID_DESTINATION_WEIGHT');doc.weights.destinationNetKg=doc.weights.originNetKg;doc.unloadDecision='ACCEPT_ORIGIN_NET_AS_DESTINATION';payload.unloadDecision=doc.unloadDecision;
   }else{const side=target==='WEIGHED_ORIGIN'?'origin':'destination';if(snap&&snap.configuration[side==='origin'?'loadingMeasurementMode':'unloadingMeasurementMode']!=='WEIGHBRIDGE')tripFail('UNSUPPORTED_MEASUREMENT');
    if(r.payload[side+'TicketNo'])await uow.query('UPDATE trips SET source_ticket_hmac=$1 WHERE company_id=$2 AND project_id=$3 AND id=$4 AND source_ticket_hmac IS NULL',[crypto.digest('trip-source-ticket',[uow.context.companyId,uow.context.projectId,String(r.payload[side+'TicketNo']).trim()]),uow.context.companyId,uow.context.projectId,row.id]);const prepared=await new TripMeasurementRepository(uow,this.verifier).prepare(side,r.payload,r.operationId,now,doc.operationalTimeline[side==='origin'?'loadingStartedAt':'arrivedAt']||doc.lastObservedAt||doc.createdAt,trusted);doc.measurementIds[side]=await new TripMeasurementRepository(uow).append(row.id,event,prepared);for(const reading of prepared.readings)doc.weights[side+({TARE:'TareKg',GROSS:'GrossKg',NET:'NetKg'}[reading.kind])]=reading.kg;doc.lastObservedAt=prepared.evidence.capturedAt;if(r.payload[side+'TicketNo']?.trim())doc.weights[side+'TicketNo']=r.payload[side+'TicketNo'].trim();payload.measurementIds=doc.measurementIds[side];}
  }
  if(doc.weights.originNetKg!=null&&doc.weights.destinationNetKg!=null&&(!snap||snap.profile==='DUAL_WEIGHBRIDGE'))doc.weights.varianceKg=(await uow.query('SELECT ($1::numeric-$2::numeric)::numeric(18,3) AS variance',[doc.weights.destinationNetKg,doc.weights.originNetKg])).rows[0].variance;
  doc.status=target;const point=({LOADING:'loadingStartedAt',WEIGHED_ORIGIN:'loadingCompletedAt',IN_TRANSIT:'departedAt',AT_DESTINATION:'arrivedAt',OFFLOADED:'unloadingCompletedAt',COMPLETED:'completedAt'} as any)[target];if(point)doc.operationalTimeline[point]=now;
  if(snap){doc.operationalWeights=this.operational(doc);doc.timeMetrics=resolveTimeMetrics(doc.operationalTimeline,snap.configuration,new Date(now));}
  if(target==='COMPLETED')await this.settlementForEvent(uow,ids,row,doc,r,event,'Operational completion');
  if(['WEIGHED_DESTINATION','OFFLOADED'].includes(target)){doc.unloadingActorId=uow.context.actorId;doc.unloadingActorType='USER';doc.unloadingDataSource='MANUAL';}
  if(target==='OFFLOADED')await uow.query('INSERT INTO receipts(id,company_id,project_id,trip_id,receipt_type,quantity_kg,received_at,actor_id,source_ref,event_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',[randomUUID(),uow.context.companyId,uow.context.projectId,row.id,'UNLOADING',doc.weights.destinationNetKg??null,now,uow.context.actorId,doc.unloadDecision||null,event]);
  await this.event(uow,crypto,row,doc,r,r.command,payload,now,event);
 }
 private async event(uow:UnitOfWork,crypto:IdentityProtection,row:any,doc:any,r:SqlTripEnvelope,type:string,payload:any,now:string,id=randomUUID()){
  const before=row.state;doc.revision=Number(row.version)+1;doc.version=doc.revision;doc.updatedAt=now;doc.updatedBy=uow.context.actorId;doc.weights.billableWeightKg=doc.weights.destinationNetKg??doc.weights.originNetKg??null;
  if(doc.financials.base_amount!==undefined)Object.assign(doc.financials,{baseAmountSAR:doc.financials.base_amount,demurrageAmountSAR:doc.financials.demurrage,deductionsAmountSAR:doc.financials.deductions,subtotalSAR:doc.financials.subtotal,vatAmountSAR:doc.financials.tax,totalAmountSAR:doc.financials.final_amount,quotedTotalAmountSAR:doc.financials.quoted_amount??null});const sealed=crypto.seal(doc,this.aad(uow,row.id));
  await uow.query(`INSERT INTO trip_events(id,company_id,project_id,trip_id,seq,event_type,occurred_at,operation_id,payload,resulting_state,actor_id,payload_schema_version,projection_digest)
   VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,1,$12)`,[id,uow.context.companyId,uow.context.projectId,row.id,doc.revision,type,now,r.operationId,{...payload,fromState:before,toState:doc.status},doc.status,uow.context.actorId,createHash('md5').update(sealed).digest('hex')]);
  await uow.query('UPDATE trips SET state=$1,version=$2,projection_encrypted=$3,last_event_at=$4,updated_at=clock_timestamp(),updated_by=$5 WHERE company_id=$6 AND project_id=$7 AND id=$8',[doc.status,doc.revision,sealed,now,uow.context.actorId,uow.context.companyId,uow.context.projectId,row.id]);row.state=doc.status;row.version=doc.revision;
  await this.consequence(uow,crypto,'TRIP',doc.tripId,r.operationId,'TRIP_'+type,{status:before},{status:doc.status,eventId:id},doc.revision);return id;
 }
 private async settlementForEvent(uow:UnitOfWork,ids:CanonicalIdentityRepository,row:any,doc:any,r:SqlTripEnvelope,event:string,reason:string){
  const repo=new TripSettlementRepository(uow),snapshot=await repo.frozen(row.id),last=await repo.latest(row.id);
  let terms=last?.evidence?.frozenTerms||snapshot.frozen_terms,revision=last?.terms_revision_id||snapshot.terms_revision_id,termsVersion=last?.evidence?.pricingRuleVersion??snapshot.pricing_rule_version;
  if(!terms&&r.command==='SETTLE_PRICING'){const resolved=await new TripPricingRepository(uow,ids).resolve(doc.carrierId,doc.materialId,doc.pricedAt,r.payload.pricingRuleId);terms=resolved.terms;revision=resolved.revision.id;termsVersion=Number(resolved.row.version);}
  const quantity=doc.weights.destinationNetKg??doc.weights.originNetKg??null;
  const approvedWaiting=r.payload.billableWaitingHours??last?.evidence?.billableWaitingHours??null;const result:any=await repo.calculate(terms,quantity,approvedWaiting===null?'0':decimal(approvedWaiting,4,true));if(result.status==='FINAL'&&doc.status!=='COMPLETED'){result.status='PROVISIONAL';result.quoted_amount=result.final_amount;result.final_amount=null;}
  const settlement=await repo.append(row.id,event,snapshot,result,terms,revision,reason,{pricingRuleVersion:termsVersion,quantityBasis:quantity===null?'UNAVAILABLE':doc.weights.destinationNetKg!==undefined?(doc.unloadDecision?'EXPLICIT_ORIGIN_ACCEPTANCE':'DESTINATION_MEASUREMENT'):'ORIGIN_MEASUREMENT',billableWaitingHours:approvedWaiting,demurrageDecision:approvedWaiting===null?'NO_CLAIM':'APPROVED_BILLABLE_HOURS',freeTimeHours:terms?.freeTimeHours??null});
  doc.financials={...settlement,currency:terms?.currency??null,isFinalized:result.status==='FINAL'};doc.pricingRuleId=terms?.pricingRuleId??null;doc.pricingSnapshot={...doc.pricingSnapshot,...(terms||{}),status:terms?'RESOLVED':'UNRESOLVED_PENDING',agreedRate:terms?.rate??null,termsRevisionId:revision??null,pricingRuleVersion:termsVersion==null?null:Number(termsVersion),isPending:result.status.startsWith('PENDING'),settlementAmount:result.base_amount,settlementBase:result.quantity_basis};
 }
 private async settle(uow:UnitOfWork,crypto:IdentityProtection,ids:CanonicalIdentityRepository,row:any,doc:any,r:SqlTripEnvelope,now:string){
  if(doc.status!=='COMPLETED'||typeof r.payload.reason!=='string'||!r.payload.reason.trim()||r.payload.reason.length>1000)tripFail('SETTLEMENT_NOT_ALLOWED');const event=randomUUID();await this.settlementForEvent(uow,ids,row,doc,r,event,r.payload.reason);await this.event(uow,crypto,row,doc,r,r.command,{settlementId:doc.financials.settlementId,reason:r.payload.reason},now,event);
 }
 private async adjust(uow:UnitOfWork,crypto:IdentityProtection,row:any,doc:any,r:SqlTripEnvelope,now:string){
  const p=r.payload;if(!tripId(p.adjustmentId))tripFail('INVALID_ADJUSTMENT');
  if(r.command==='REQUEST_ADJUSTMENT'){
   if(!['RATE','AMOUNT','OTHER','DEDUCTION'].includes(p.adjustmentType)||typeof p.reason!=='string'||!p.reason.trim()||p.reason.length>1000)tripFail('INVALID_ADJUSTMENT');const amount=decimal(p.amountOrRateAdjustment,p.adjustmentType==='RATE'?4:2,true,true),event=randomUUID();
   await uow.query(`INSERT INTO operational_adjustments(id,company_id,project_id,trip_id,external_id,adjustment_type,amount,reason,resolved_by,status,request_encrypted,event_id,rate_adjustment) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,'REQUEST',$10,$11,$12)`,[randomUUID(),uow.context.companyId,uow.context.projectId,row.id,p.adjustmentId,p.adjustmentType,p.adjustmentType==='RATE'?null:amount,p.reason,uow.context.actorId,crypto.seal({amount,reason:p.reason,requestedBy:uow.context.actorId},this.aad(uow,row.id)+'/adjustment/'+p.adjustmentId),event,p.adjustmentType==='RATE'?amount:null]);await this.event(uow,crypto,row,doc,r,r.command,{adjustmentId:p.adjustmentId},now,event);
  }else{
   if(doc.status!=='COMPLETED'||!doc.financials.isFinalized)tripFail('ADJUSTMENT_REQUIRES_SETTLEMENT');const scope=[uow.context.companyId,uow.context.projectId,row.id],adj=(await uow.query("SELECT * FROM operational_adjustments WHERE company_id=$1 AND project_id=$2 AND trip_id=$3 AND external_id=$4 FOR UPDATE",[...scope,p.adjustmentId])).rows[0];if(!adj||!['REQUEST','REVIEW'].includes(adj.status))tripFail('ADJUSTMENT_ALREADY_PROCESSED');
   const event=randomUUID();await uow.query("UPDATE operational_adjustments SET status='APPLIED',resolved_by=$1,event_id=$2 WHERE company_id=$3 AND project_id=$4 AND id=$5",[uow.context.actorId,event,uow.context.companyId,uow.context.projectId,adj.id]);
   const repo=new TripSettlementRepository(uow),snapshot=await repo.frozen(row.id),last=await repo.latest(row.id),terms=last.evidence.frozenTerms;
   const total=(await uow.query(`SELECT coalesce(round(sum(CASE adjustment_type WHEN 'RATE' THEN rate_adjustment*CASE WHEN $4='PER_TON' THEN $5::numeric ELSE 1 END WHEN 'DEDUCTION' THEN -amount ELSE amount END),2),0)::numeric(18,2) AS amount FROM operational_adjustments WHERE company_id=$1 AND project_id=$2 AND trip_id=$3 AND status='APPLIED'`,[...scope,terms.pricingType,last.quantity_basis])).rows[0].amount;
   const result=await repo.calculate(terms,last.quantity_kg,last.evidence.billableWaitingHours||'0',last.deductions||'0',total);doc.financials={...(await repo.append(row.id,event,snapshot,result,terms,last.terms_revision_id,'Approved adjustment: '+adj.reason,{...last.evidence,adjustmentId:p.adjustmentId})),currency:terms.currency,isFinalized:true};await this.event(uow,crypto,row,doc,r,r.command,{adjustmentId:p.adjustmentId,previousSettlementId:last.id},now,event);
  }
 }
 /** Server-only seam from the authenticated U05 durable import transaction. */
 async reviewImportWithin(uow:UnitOfWork,ids:CanonicalIdentityRepository,payload:any,op:any){
  const project=(await uow.query('SELECT * FROM projects WHERE company_id=$1 AND id=$2',[uow.context.companyId,uow.context.projectId])).rows[0];
  const refs=await this.references(uow,ids,payload,project.operational_configuration?.driverIntakeMode||'PRELOADED_ROSTER');
  const pricing=payload.pricingRuleId?await new TripPricingRepository(uow,ids).resolve(payload.carrierId,payload.materialId,op.shiftDate||op.pricingDecisionAt||new Date().toISOString(),payload.pricingRuleId):null;
  return {references:Object.fromEntries(Object.entries(refs).map(([k,v]:any)=>[k,{id:v.row.id,revision:Number(v.row.revision)}])),configuration:project.operational_configuration,termsRevision:pricing?.revision.id||null};
 }
 async executeReviewedWithin(uow:UnitOfWork,ids:CanonicalIdentityRepository,crypto:IdentityProtection,r:SqlTripEnvelope,trusted:{source:unknown;historical:any;measurement:MeasurementEvidence;sourceCorrections?:any[];originalCells?:any;originalUnit?:string;sourceRowKey?:string}){
  const actor=(await uow.query('SELECT * FROM qsa_authorize_trip_command()')).rows[0];if(!canExecuteTripCommand(actor.commercial_role,'IMPORT_TRIP'))tripFail('FORBIDDEN_TRIP_ACTION',403);
  this.actorRoles.set(uow,actor.commercial_role);try{return await this.executeWithin(uow,ids,crypto,r,trusted);}finally{this.actorRoles.delete(uow);}
 }
 private async importFacts(uow:UnitOfWork,crypto:IdentityProtection,ids:CanonicalIdentityRepository,row:any,doc:any,r:SqlTripEnvelope,trusted:any,now:string){
  // IMPORT_TRIP is historical aggregate creation, as in dispatchImportedTrip;
  // it is not a live transition or a fabricated chain of unobserved events.
  const op=trusted.historical||{},event=randomUUID(),evidence=new TripMeasurementRepository(uow);
  for(const side of ['origin','destination'] as const){
   const input=side==='origin'?{originTareKg:op.tareWeightKg,originGrossKg:op.grossWeightKg,originNetKg:op.netWeightKg,originTicketNo:op.ticketId}:{destinationNetKg:op.destinationNetWeightKg};
   if(side==='origin'?(op.tareWeightKg==null||op.grossWeightKg==null)&&op.netWeightKg==null:op.destinationNetWeightKg==null)continue;
   if(doc.operationalSnapshot&&doc.operationalSnapshot.configuration[side==='origin'?'loadingMeasurementMode':'unloadingMeasurementMode']!=='WEIGHBRIDGE')tripFail('UNSUPPORTED_MEASUREMENT');
   const prepared=await evidence.prepare(side,input,r.operationId,now,undefined,{...trusted.measurement,...(side==='destination'?{rawNet:op.rawDestinationNetValue??op.destinationNetWeightKg,...(op.unloadTime?{capturedAt:op.unloadTime}:{})}:{}),sourceEventKey:trusted.measurement.sourceEventKey+'/'+side});
   for(const reading of prepared.readings){
    const field=side==='destination'?'destNetWeight':({TARE:'tareWeight',GROSS:'grossWeight',NET:'netWeight'}[reading.kind]);
    reading.raw=reading.authority==='DERIVED'?`${trusted.originalCells?.grossWeight} - ${trusted.originalCells?.tareWeight}`:String(trusted.originalCells?.[field]??reading.raw);
    const corrections=(trusted.sourceCorrections||[]).filter((c:any)=>c.field==='sourceUnit'||c.field===(side==='origin'?'weighTime':'unloadTime')||c.field===field||reading.kind==='NET'&&['tareWeight','grossWeight'].includes(c.field));
    if(corrections.length){reading.sourceCorrection=corrections;reading.authority=reading.kind==='NET'&&corrections.some((c:any)=>c.field!==field)?'DERIVED_FROM_APPROVED_CORRECTION':'APPROVED_SOURCE_CORRECTION';reading.raw=trusted.originalCells?.[field]??`${trusted.originalCells?.grossWeight} - ${trusted.originalCells?.tareWeight}`;}
   }
   if((trusted.sourceCorrections||[]).some((c:any)=>c.field==='sourceUnit'))prepared.evidence.unit=trusted.originalUnit;doc.measurementIds[side]=await evidence.append(row.id,event,prepared);for(const v of prepared.readings)doc.weights[side+({TARE:'TareKg',GROSS:'GrossKg',NET:'NetKg'}[v.kind])]=v.kg;
  }
  if(doc.weights.destinationNetKg!=null){doc.unloadingActorId=uow.context.actorId;doc.unloadingActorType='IMPORT';doc.unloadingDataSource=(trusted.source as any)?.sourceType??null;}
  if(op.ticketId&&doc.weights.originNetKg!=null)doc.weights.originTicketNo=op.ticketId;
  const requested=String(op.legacyStatus||'').toUpperCase().trim(),map:Record<string,string>={COMPLETED:'COMPLETED',DELIVERED:'COMPLETED',OFFLOADED:'COMPLETED',WEIGHED_ORIGIN:'WEIGHED_ORIGIN',ORIGIN_WEIGHED:'WEIGHED_ORIGIN',WEIGHED:'WEIGHED_ORIGIN',IN_TRANSIT:'IN_TRANSIT',LOADING:'LOADING',DISPATCHED:'DISPATCHED',DRAFT:'DRAFT',REJECTED:'REJECTED',CANCELLED:'CANCELLED'};
  doc.status=map[requested]||(doc.weights.destinationNetKg!=null?'COMPLETED':doc.weights.originNetKg!=null?'WEIGHED_ORIGIN':'DISPATCHED');
  if(doc.status==='COMPLETED'&&doc.weights.destinationNetKg==null&&(!doc.operationalSnapshot||doc.operationalSnapshot.configuration.unloadingMeasurementMode==='WEIGHBRIDGE'))tripFail('HISTORICAL_COMPLETION_EVIDENCE_REQUIRED');
  if(op.loadTime)doc.operationalTimeline.loadingCompletedAt=op.loadTime;if(op.unloadTime)doc.operationalTimeline.unloadingCompletedAt=op.unloadTime;
  if(doc.operationalSnapshot){const c=doc.operationalSnapshot.configuration;doc.operationalWeights=this.operational(doc);if(doc.status==='COMPLETED'&&(c.loadingMeasurementMode==='WEIGHBRIDGE'&&doc.weights.originNetKg==null||c.unloadingMeasurementMode==='WEIGHBRIDGE'&&doc.weights.destinationNetKg==null||(c.requiredCheckpoints||[]).some((k:string)=>!doc.operationalTimeline[k])))tripFail('OPERATIONAL_CHECKPOINT_REQUIRED');doc.timeMetrics=resolveTimeMetrics(doc.operationalTimeline,c,new Date(now));}
  if(doc.weights.originNetKg!=null&&doc.weights.destinationNetKg!=null&&(!doc.operationalSnapshot||doc.operationalSnapshot.profile==='DUAL_WEIGHBRIDGE'))doc.weights.varianceKg=(await uow.query('SELECT ($1::numeric-$2::numeric)::numeric(18,3) AS variance',[doc.weights.destinationNetKg,doc.weights.originNetKg])).rows[0].variance;
  await this.settlementForEvent(uow,ids,row,doc,r,event,'Reviewed historical Trip intake');if(doc.status!=='COMPLETED')doc.financials.isFinalized=false;
  return this.event(uow,crypto,row,doc,r,'DISPATCHED_IMPORTED',{source:trusted.source,historicalStatus:op.legacyStatus??null,observedTimes:{loadTime:op.loadTime??null,unloadTime:op.unloadTime??null,weighTime:op.weighTime??null}},now,event);
 }
 async read(token:string,scope:Scope,id:string,after=0,limit=50){if(!Number.isSafeInteger(after)||after<0||!Number.isInteger(limit)||limit<1||limit>50)tripFail('INVALID_TRIP_PAGE');return this.scoped(token,scope,false,async(uow,crypto)=>{const row=await this.header(uow,id);await this.ownership(uow,row);const events=(await uow.query('SELECT id,seq,event_type,occurred_at,operation_id,payload,resulting_state FROM trip_events WHERE company_id=$1 AND project_id=$2 AND trip_id=$3 AND seq>$4 ORDER BY seq LIMIT $5',[uow.context.companyId,uow.context.projectId,row.id,after,limit+1])).rows;return {trip:tripResponse(this.doc(uow,crypto,row),this.actorRoles.get(uow)!),events:events.slice(0,limit).map(e=>tripEventResponse(e,this.actorRoles.get(uow)!)),hasMore:events.length>limit,fullSnapshot:false};});}
 async measurements(token:string,scope:Scope,id:string,after:string|null=null,limit=50){
  if(after!==null&&!/^[0-9a-f-]{36}$/i.test(after)||!Number.isInteger(limit)||limit<1||limit>50)tripFail('INVALID_TRIP_PAGE');
  return this.scoped(token,scope,false,async(uow)=>{const row=await this.header(uow,id);await this.ownership(uow,row);const records=(await uow.query('SELECT id,event_id,measurement_type,weight_kg,raw_value,source_unit,source_ref,source_type,source_file_hash,source_event_key,captured_at,observed_at,actor_id,authority_status,correction_of,correction_reason,source_correction FROM trip_weight_records WHERE company_id=$1 AND project_id=$2 AND trip_id=$3 AND ($4::uuid IS NULL OR id>$4::uuid) ORDER BY id LIMIT $5',[uow.context.companyId,uow.context.projectId,row.id,after,limit+1])).rows;return {records:records.slice(0,limit).map(v=>tripWeightResponse(v,this.actorRoles.get(uow)!)),hasMore:records.length>limit,fullSnapshot:false};});
 }
 async receipt(token:string,scope:Scope,operationId:string){
  if(!/^[0-9a-f-]{36}$/i.test(operationId))tripFail('INVALID_OPERATION_ID');return this.scoped(token,scope,false,async(uow,crypto)=>{const r=(await uow.query("SELECT actor_id,result_encrypted,state FROM idempotency_receipts WHERE company_id=$1 AND project_id=$2 AND operation_id=$3",[uow.context.companyId,uow.context.projectId,operationId])).rows[0];if(!r||r.actor_id!==uow.context.actorId||r.state!=='COMMITTED')tripFail('TRIP_RECEIPT_NOT_FOUND');const result=crypto.open<any>(r.result_encrypted,`${uow.context.companyId}/${uow.context.projectId}/receipt/${operationId}`);if(!result.trip?.tripId)tripFail('TRIP_RECEIPT_NOT_FOUND');const row=await this.header(uow,result.trip.tripId);await this.ownership(uow,row);return {operationId,trip:tripResponse(this.doc(uow,crypto,row),this.actorRoles.get(uow)!),committed:true};});
 }
 async savePricing(token:string,scope:Scope,r:SqlTripEnvelope){tripEnvelope(r);if(!r.payload?.rule||typeof r.payload.rule!=='object'||Array.isArray(r.payload.rule)||(r.payload.ruleId?r.payload.rule.expectedVersion!==r.expectedRevision:r.expectedRevision!==0))tripFail('PRICING_VERSION_CONFLICT');if(r.command!=='SAVE_PRICING_RULE')tripFail('INVALID_PRICING_COMMAND');exactTrip(r.payload,['ruleId','rule']);return this.scoped(token,scope,false,async(uow,crypto,ids)=>{
  if(!['SUPER_ADMIN','PROJECT_ADMIN','FINANCE_AUDITOR'].includes(this.actorRoles.get(uow)!))tripFail('FORBIDDEN_PRICING_ACTION',403);
  // Existing command infrastructure owns payload fencing and atomic audit/outbox.
  const hash=crypto.digest('command',stableValue(r)).toString('hex'),aad=`${uow.context.companyId}/${uow.context.projectId}/receipt/${r.operationId}`;
  const old=(await uow.query('SELECT actor_id,request_hash,result_encrypted FROM idempotency_receipts WHERE company_id=$1 AND project_id=$2 AND operation_id=$3 FOR UPDATE',[uow.context.companyId,uow.context.projectId,r.operationId])).rows[0];if(old){if(old.actor_id!==uow.context.actorId||old.request_hash!==hash)tripFail('IDEMPOTENCY_PAYLOAD_MISMATCH');return crypto.open<any>(old.result_encrypted,aad);}
  await uow.checkOrAcquireIdempotency(r.operationId,hash);
  const result=JSON.parse(JSON.stringify(await new TripPricingRepository(uow,ids).save(r.payload.rule,uow.context.actorId,r.payload.ruleId)));if(result.parentRuleId)await this.consequence(uow,crypto,'PRICING_RULE',result.parentRuleId,r.operationId,'PRICING_RULE_SUPERSEDED',{version:result.predecessorVersion-1},{version:result.predecessorVersion,successorRuleId:result.pricingRuleId,effectiveFrom:result.terms.effectiveFrom},result.predecessorVersion);await this.consequence(uow,crypto,'PRICING_RULE',result.pricingRuleId,r.operationId,'PRICING_RULE_SAVED',null,{version:result.version,termsRevisionId:result.termsRevisionId},result.version);
  await uow.query("UPDATE idempotency_receipts SET state='COMMITTED',result_encrypted=$4 WHERE company_id=$1 AND project_id=$2 AND operation_id=$3",[uow.context.companyId,uow.context.projectId,r.operationId,crypto.seal(result,aad)]);return result;
 });}
}
