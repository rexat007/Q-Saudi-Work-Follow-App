import {randomUUID} from 'node:crypto';
import {SqlImportAuthority} from './importAuthority.js';
import {SqlTripAuthority} from './tripAuthority.js';
import type {Scope,SqlAuthorityDependencies} from './canonicalAuthority.js';
import type {UnitOfWork} from './unitOfWork.js';
import type {CanonicalIdentityRepository} from './canonicalIdentityRepository.js';
import {IdentityProtection} from './identityProtection.js';
import {importFail,sha,type ImportSourceStore} from './importArtifacts.js';
import {bindTripSourceRows,tripMapping,tripRowPayload,normalizedTripCell,TRIP_SOURCE_FIELDS} from './tripImportSourceRows.js';
import {executionDigest} from '../services/import/rosterExecutionPlan.server';
import {validateDurableCheckpoint} from '../services/import/durableSessionContract';
import {exactTrip,decimal,SQL_TRIP_EPOCH} from './tripContracts.js';
import {canExecuteTripCommand} from '../types/tripCommands';
interface Command {sessionId:string;requestId:string;expectedVersion:number}
const opId=(value:string)=>{const h=sha(value);return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20,32)}`;};
/** Existing U05 artifacts, journal, fences, receipt pages and recovery; no production mount. */
export class SqlTripImportAuthority extends SqlImportAuthority {
 private trips:SqlTripAuthority;
 constructor(deps:SqlAuthorityDependencies & {sourceStore?:ImportSourceStore}={}){super(deps);this.trips=new SqlTripAuthority(deps);}
 protected async authorize(uow:UnitOfWork){const actor=(await uow.query('SELECT * FROM qsa_authorize_trip_command()')).rows[0];if(!canExecuteTripCommand(actor.commercial_role,'IMPORT_TRIP'))importFail('FORBIDDEN_TRIP_ACTION');await uow.query("SELECT set_config('app.company_timezone',$1,true)",[actor.company_timezone]);return actor;}
 private async tripHeader(uow:UnitOfWork,id:string){const row=await this.header(uow,id),cp=await this.checkpointValue(uow,row);if(cp.domain!=='TRIP')importFail('INVALID_IMPORT_SESSION_DOMAIN');return {row,cp};}
 async tripCheckpoint(token:string,scope:Scope,r:Command & {mapping:any;rows:any[]}){
  exactTrip(r,['sessionId','requestId','expectedVersion','mapping','rows']);exactTrip(r.mapping,['mappingRevisionId','sourceRevisionId','mappings','approved']);
  if(!Array.isArray(r.rows)||r.rows.length>10000||Buffer.byteLength(JSON.stringify(r))>8000000)importFail('IMPORT_ARTIFACT_LIMIT');
  return this.run(token,scope,r,'TRIP_CHECKPOINT',r,async(uow,_ids,crypto)=>{
   const {row,cp}=await this.tripHeader(uow,r.sessionId);this.checkVersion(row,r.expectedVersion);if(!['DISCOVERED','MAPPING','RESOLUTION','REVIEW'].includes(row.state))importFail('TRIP_REVIEW_RESTART_REQUIRED');
   if((await uow.query('SELECT 1 FROM import_executions WHERE company_id=$1 AND project_id=$2 AND session_id=$3',[uow.context.companyId,uow.context.projectId,row.id])).rowCount)importFail('TRIP_REVIEW_RESTART_REQUIRED');
   const at=new Date().toISOString(),inventory=await this.verifySource(uow,row,cp),next={...cp,version:Number(row.version)+1,lifecycleState:'REVIEW',currentStage:'REVIEW',invalidateReview:true,
    mapping:{...r.mapping,approvedBy:r.mapping.mappingRevisionId===cp.mapping?.mappingRevisionId?cp.mapping.approvedBy:uow.context.actorId,approvedAt:r.mapping.mappingRevisionId===cp.mapping?.mappingRevisionId?cp.mapping.approvedAt:at},tripBatch:{rows:structuredClone(r.rows)}};
   delete next.reviewedTripIntent;if(next.mapping.mappingRevisionId!==cp.mapping?.mappingRevisionId)delete next.tripCorrections;tripMapping(next,inventory);next.tripBatch.rows=bindTripSourceRows(next,inventory);next.tripBatch.rows=next.tripBatch.rows.map((v:any)=>{const {canonical,...rest}=v;return rest;});
   next.reviewSnapshot={rows:next.tripBatch.rows};validateDurableCheckpoint(cp,next,uow.context.actorId,at);await this.saveCheckpoint(uow,row,next,uow.context.actorId);await this.consequence(uow,crypto,'IMPORT_SESSION',r.sessionId,r.requestId,'TRIP_SOURCE_CHECKPOINT',null,{inventory:inventory.digest},next.version);return {version:next.version};
  });
 }
 private async rowData(uow:UnitOfWork,row:any,cp?:any){
  const data=tripRowPayload(row),unit=row.canonical.sourceUnit||'KG';if(!['KG','TON'].includes(unit))importFail('INVALID_WEIGHT_UNIT');
  for(const key of ['tareWeightKg','grossWeightKg','netWeightKg','destinationNetWeightKg'])if(data.operationalData[key]!=null)data.operationalData[key]=(await uow.query("SELECT ($1::numeric*CASE WHEN $2='TON' THEN 1000 ELSE 1 END)::numeric(18,3) AS kg",[decimal(data.operationalData[key],unit==='TON'?6:3),unit])).rows[0].kg;
  for(const key of ['weighTime','loadTime','unloadTime'])if(data.operationalData[key]){
   const raw=String(data.operationalData[key]);if(/^\d{2}:\d{2}(?::\d{2})?$/.test(raw)&&data.operationalData.shiftDate){const v=(await uow.query("SELECT (($1::date+$2::time) AT TIME ZONE current_setting('app.company_timezone')) AS at",[data.operationalData.shiftDate,raw])).rows[0];data.operationalData[key]=new Date(v.at).toISOString();}
   else if(/^\d{4}-\d\d-\d\dT.*(?:Z|[+-]\d\d:\d\d)$/.test(raw)&&Number.isFinite(Date.parse(raw)))data.operationalData[key]=new Date(raw).toISOString();else importFail('SOURCE_TIMESTAMP_CONTEXT_REQUIRED');
  }
  if(!data.operationalData.shiftDate&&cp?.reviewedTripIntent?.acceptedAt)data.operationalData.pricingDecisionAt=cp.reviewedTripIntent.acceptedAt;
  const op=data.operationalData;for(const key of ['weighTime','loadTime','unloadTime'])if(op[key]&&Date.parse(String(op[key]))>Date.now()+1000)importFail('INCONSISTENT_MEASUREMENT_TIME');
  if(op.unloadTime&&['weighTime','loadTime'].some(k=>op[k]&&Date.parse(String(op[k]))>Date.parse(String(op.unloadTime))))importFail('INCONSISTENT_MEASUREMENT_TIME');
  return data;
 }
 private async tripFacts(uow:UnitOfWork,ids:CanonicalIdentityRepository,row:any,cp:any){
  const inventory=await this.verifySource(uow,row,cp),rows=bindTripSourceRows(cp,inventory),proofs:any[]=[];let count=0;const tickets=new Set<string>();
  for(const r of rows){if(r.decision==='REJECT')continue;if(++count>500)importFail('IMPORT_GROUP_BUDGET');const data=await this.rowData(uow,r,cp);
   if(r.canonical.ticketId){const key=String(r.canonical.ticketId);if(tickets.has(key))importFail('DUPLICATE_SOURCE_TICKET');tickets.add(key);}
   proofs.push({sourceRowId:r.sourceRowId,facts:await this.trips.reviewImportWithin(uow,ids,data.payload,data.operationalData)});
  }
  const signature=executionDigest({contract:'SQL_REVIEWED_TRIP_IMPORT_V1',project:cp.projectId,session:cp.importSessionId,operation:cp.operationId,batch:cp.importBatchId,rows,proofs});return {rows,signature,inventory};
 }
 async tripPreview(token:string,scope:Scope,sessionId:string){return this.scoped(token,scope,false,async(uow,_crypto,ids)=>{const {row,cp}=await this.tripHeader(uow,sessionId);if(row.state!=='REVIEW')importFail('IMPORT_REVIEW_STAGE_REQUIRED');const facts=await this.tripFacts(uow,ids,row,cp);return {reviewedSignature:facts.signature,rows:facts.rows,version:Number(row.version)};});}
 async tripReview(token:string,scope:Scope,r:Command & {reviewedSignature:string}){exactTrip(r,['sessionId','requestId','expectedVersion','reviewedSignature']);return this.run(token,scope,r,'TRIP_REVIEW',r,async(uow,ids,crypto)=>{
  const {row,cp}=await this.tripHeader(uow,r.sessionId);this.checkVersion(row,r.expectedVersion);if(row.state!=='REVIEW')importFail('IMPORT_REVIEW_STAGE_REQUIRED');const facts=await this.tripFacts(uow,ids,row,cp);if(facts.signature!==r.reviewedSignature)importFail('REVIEWED_INTENT_STALE');
  const next={...cp,version:Number(row.version)+1,reviewedTripIntent:{signature:facts.signature,acceptedAt:new Date().toISOString(),acceptedBy:uow.context.actorId}};await this.saveCheckpoint(uow,row,next,uow.context.actorId);await this.consequence(uow,crypto,'IMPORT_SESSION',r.sessionId,r.requestId,'TRIP_INTENT_REVIEWED',null,{signature:facts.signature},next.version);return {version:next.version};
 });}
 async tripCorrect(token:string,scope:Scope,r:Command & {corrections:any[]}){exactTrip(r,['sessionId','requestId','expectedVersion','corrections']);if(!Array.isArray(r.corrections)||!r.corrections.length||r.corrections.length>100)importFail('SOURCE_CORRECTION_INVALID');return this.run(token,scope,r,'TRIP_CORRECTION',r,async(uow,_ids,crypto)=>{
  const {row,cp}=await this.tripHeader(uow,r.sessionId);this.checkVersion(row,r.expectedVersion);if(row.state!=='REVIEW')importFail('TRIP_REVIEW_RESTART_REQUIRED');
  const inventory=await this.verifySource(uow,row,cp),mappingDigest=tripMapping(cp,inventory);bindTripSourceRows(cp,inventory);const records=new Map((cp.tripCorrections||[]).map((c:any)=>[c.sourceRowId+'/'+c.field,c])),seen=new Set<string>();
  for(const c of r.corrections){if(seen.has(c.sourceRowId+'/'+c.field))importFail('SOURCE_CORRECTION_INVALID');seen.add(c.sourceRowId+'/'+c.field);exactTrip(c,['sourceRowId','field','originalValue','correctedValue','reason']);const source=inventory.rows.find(v=>v.id===c.sourceRowId),header=Object.keys(cp.mapping.mappings).find(k=>cp.mapping.mappings[k]===c.field);
   if(!source||!header||!TRIP_SOURCE_FIELDS.includes(c.field)||typeof c.reason!=='string'||!c.reason.trim()||c.reason.length>500||!['string','number'].includes(typeof c.correctedValue)||String(c.correctedValue).length>8192)importFail('SOURCE_CORRECTION_INVALID');
   const original=normalizedTripCell(source.raw[header],c.field);if(JSON.stringify(original)!==JSON.stringify(normalizedTripCell(c.originalValue,c.field)))importFail('SOURCE_CORRECTION_INVALID');records.set(c.sourceRowId+'/'+c.field,{...c,originalValue:original,correctedValue:normalizedTripCell(c.correctedValue,c.field),mappingDigest,sourceRevisionId:cp.source.sourceRevisionId,approvedBy:uow.context.actorId,approvedAt:new Date().toISOString()});
  }
  const next={...cp,tripBatch:structuredClone(cp.tripBatch),version:Number(row.version)+1,tripCorrections:[...records.values()]};for(const c of r.corrections){const field=({carrier:'carrierId',driver:'driverId',truckNo:'truckId',material:'materialId'} as any)[c.field];if(field){const row=next.tripBatch.rows.find((v:any)=>v.sourceRowId===c.sourceRowId);delete row.resolved[field];if(['carrierId','materialId'].includes(field))delete row.resolved.pricingRuleId;}}delete next.reviewedTripIntent;bindTripSourceRows(next,inventory);await this.saveCheckpoint(uow,row,next,uow.context.actorId);await this.consequence(uow,crypto,'IMPORT_SESSION',r.sessionId,r.requestId,'TRIP_CORRECTIONS_APPROVED',null,{digest:executionDigest(next.tripCorrections)},next.version);return {version:next.version};
 });}
 async tripStart(token:string,scope:Scope,r:Command & {operationId:string;reviewedSignature:string}){exactTrip(r,['sessionId','requestId','expectedVersion','operationId','reviewedSignature']);await this.run(token,scope,r,'TRIP_START',r,async(uow,ids,crypto)=>{
  const {row,cp}=await this.tripHeader(uow,r.sessionId);if(row.operation_id!==r.operationId)importFail('INVALID_REVIEWED_INTENT_BINDING');
  const old=(await uow.query('SELECT * FROM import_executions WHERE company_id=$1 AND project_id=$2 AND session_id=$3',[uow.context.companyId,uow.context.projectId,row.id])).rows[0];
  if(old){if(old.failure_code==='U06_TRIP_AUTHORITY_REQUIRED')importFail('TRIP_REVIEW_RESTART_REQUIRED');if(old.reviewed_signature!==r.reviewedSignature||Number(old.request_version)!==r.expectedVersion)importFail('EXECUTION_BINDING_CONFLICT');return {started:true};}
  this.checkVersion(row,r.expectedVersion);if(row.state!=='REVIEW'||cp.reviewedTripIntent?.signature!==r.reviewedSignature||row.reviewed_signature!==r.reviewedSignature)importFail('SERVER_REVIEW_REQUIRED');
  const facts=await this.tripFacts(uow,ids,row,cp);if(facts.signature!==r.reviewedSignature)importFail('REVIEWED_INTENT_STALE');const accepted=facts.rows.filter((v:any)=>v.decision==='ACCEPT');if(!accepted.length)importFail('IMPORT_GROUP_BUDGET');const binding=this.binding(uow,crypto,row,r.reviewedSignature);
  await uow.query(`INSERT INTO import_executions(company_id,project_id,session_id,operation_id,binding_hash,reviewed_signature,state,version,fence,request_version,group_count,created_by,updated_by) VALUES($1,$2,$3,$4,$5,$6,'READY',1,0,$7,$8,$9,$9)`,[uow.context.companyId,uow.context.projectId,row.id,r.operationId,binding,r.reviewedSignature,r.expectedVersion,accepted.length,uow.context.actorId]);
  for(const source of accepted){const key=executionDigest([binding,source.sourceRowId]),plan={domain:'TRIP',rows:[source.rowNumber],sourceRowId:source.sourceRowId,reviewedSignature:facts.signature};await uow.query(`INSERT INTO import_execution_groups(id,company_id,project_id,session_id,operation_id,group_key,state,fence,version,plan_encrypted,plan_hash) VALUES($1,$2,$3,$4,$5,$6,'READY',0,1,$7,$8)`,[randomUUID(),uow.context.companyId,uow.context.projectId,row.id,r.operationId,key,crypto.seal(plan,this.aad(uow,row.id,r.operationId,key,'plan')),executionDigest(plan)]);}
  await uow.query("UPDATE import_sessions SET state='COMMITTING',version=version+1,updated_by=$1,updated_at=clock_timestamp() WHERE company_id=$2 AND project_id=$3 AND id=$4",[uow.context.actorId,uow.context.companyId,uow.context.projectId,row.id]);await this.consequence(uow,crypto,'IMPORT_SESSION',r.sessionId,r.requestId,'TRIP_IMPORT_STARTED',null,{groups:accepted.length},1);return {started:true};
 });return (await this.status(token,scope,r.sessionId,r.operationId)).operation;}
 async commitNext(token:string,scope:Scope,r:{sessionId:string;operationId:string;groupId:string;fence:number;bindingHash:string}){
  exactTrip(r,['sessionId','operationId','groupId','fence','bindingHash']);if(!/^[a-f0-9]{64}$/.test(r.bindingHash)||!/^[a-f0-9]{64}$/.test(r.groupId)||!Number.isSafeInteger(r.fence)||r.fence<1)importFail('INVALID_IMPORT_COMMAND');
  return this.command(token,{...scope,operationId:opId(r.bindingHash+'/'+r.groupId)},{type:'TRIP_IMPORT_GROUP',...r},false,async(uow,ids,crypto)=>{
   const {row,cp}=await this.tripHeader(uow,r.sessionId),op=await this.operation(uow,row.id,r.operationId);
   if(op.state!=='EXECUTING'||Number(op.fence)!==r.fence)importFail('EXECUTION_FENCE_STALE');if(op.binding_hash!==r.bindingHash||op.binding_hash!==this.binding(uow,crypto,row,op.reviewed_signature))importFail('EXECUTION_BINDING_CONFLICT');
   const g=(await uow.query('SELECT * FROM import_execution_groups WHERE company_id=$1 AND project_id=$2 AND session_id=$3 AND operation_id=$4 AND group_key=$5 FOR UPDATE',[uow.context.companyId,uow.context.projectId,row.id,r.operationId,r.groupId])).rows[0];if(!g||g.state!=='READY')importFail('IMPORT_GROUP_NOT_PENDING');
   const plan=crypto.open<any>(g.plan_encrypted,this.aad(uow,row.id,r.operationId,r.groupId,'plan'));if(executionDigest(plan)!==g.plan_hash||plan.domain!=='TRIP')importFail('IMPORT_PLAN_CORRUPT');
   const facts=await this.tripFacts(uow,ids,row,cp);if(facts.signature!==op.reviewed_signature||plan.reviewedSignature!==facts.signature)importFail('REVIEWED_INTENT_STALE');const source=facts.rows.find((v:any)=>v.sourceRowId===plan.sourceRowId);if(!source||source.decision!=='ACCEPT')importFail('SOURCE_ROW_INVENTORY_MISMATCH');
   const data=await this.rowData(uow,source,cp);data.operationalData.rawDestinationNetValue=source.canonical.destNetWeight;const result=await this.trips.executeReviewedWithin(uow,ids,crypto,{operationId:opId(r.bindingHash+'/'+r.groupId),expectedRevision:0,backendEpoch:this.trips.backendFence()?.backendEpoch||SQL_TRIP_EPOCH,payloadSchemaVersion:1,command:'IMPORT_TRIP',payload:data.payload},
    {sourceCorrections:(cp.tripCorrections||[]).filter((c:any)=>c.sourceRowId===source.sourceRowId),originalCells:source.originalCells,originalUnit:source.originalCanonical.sourceUnit||'KG',sourceRowKey:executionDigest([cp.source.fingerprint,cp.source.rowInventory.columnsDigest,source.sourceProof.physicalRow]),source:{...source.sourceProof,sourceType:cp.sourceType,sourceFileName:cp.source.fileName??null,importSessionId:r.sessionId,importBatchId:cp.importBatchId},historical:data.operationalData,measurement:{sourceType:cp.sourceType,sourceRef:cp.source.providerSnapshot.artifactId,sourceFileHash:cp.source.fingerprint,sourceEventKey:source.sourceRowId,unit:source.canonical.sourceUnit||'KG',rawTare:source.canonical.tareWeight,rawGross:source.canonical.grossWeight,rawNet:source.canonical.netWeight,...(data.operationalData.weighTime?{capturedAt:String(data.operationalData.weighTime)}:{})}});
   const receipt={projectId:cp.projectId,importSessionId:r.sessionId,operationId:r.operationId,groupId:r.groupId,bindingHash:r.bindingHash,fence:r.fence,reviewedSignature:facts.signature,sourceRevisionId:cp.source.sourceRevisionId,mappingRevisionId:cp.mapping.mappingRevisionId,sourceRowId:source.sourceRowId,sourceProof:source.sourceProof,resultSummary:{tripId:result.trip.tripId,tripNumber:result.trip.tripNumber,contributingRows:1},committedAt:new Date().toISOString(),committedBy:uow.context.actorId};
   await uow.query('INSERT INTO import_execution_receipts(id,company_id,project_id,session_id,operation_id,group_key,result_hash,committed_at,receipt_encrypted,binding_hash,fence) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)',[randomUUID(),uow.context.companyId,uow.context.projectId,row.id,r.operationId,r.groupId,executionDigest(receipt),receipt.committedAt,crypto.seal(receipt,this.aad(uow,row.id,r.operationId,r.groupId,'receipt')),r.bindingHash,r.fence]);
   await uow.query("UPDATE import_execution_groups SET state='COMMITTED',fence=$1,version=version+1 WHERE company_id=$2 AND project_id=$3 AND id=$4",[r.fence,uow.context.companyId,uow.context.projectId,g.id]);const complete=Number(op.completed_groups)+1===Number(op.group_count);
   await uow.query('UPDATE import_executions SET completed_groups=completed_groups+1,state=$1,version=version+1,failure_code=NULL,updated_by=$2 WHERE company_id=$3 AND project_id=$4 AND session_id=$5 AND operation_id=$6',[complete?'COMPLETED':'PARTIAL',uow.context.actorId,uow.context.companyId,uow.context.projectId,row.id,r.operationId]);
   await uow.query('UPDATE import_sessions SET state=$1,version=version+1,fence=$2,updated_by=$3 WHERE company_id=$4 AND project_id=$5 AND id=$6',[complete?'COMMITTED':'COMMITTING',r.fence,uow.context.actorId,uow.context.companyId,uow.context.projectId,row.id]);await this.consequence(uow,crypto,'IMPORT_SESSION',r.sessionId,opId(r.bindingHash+'/'+r.groupId),'TRIP_IMPORT_GROUP_COMMITTED',null,{tripId:result.trip.tripId},Number(op.version)+1);return {receipt,queries:result.queries};
  });
 }
}
