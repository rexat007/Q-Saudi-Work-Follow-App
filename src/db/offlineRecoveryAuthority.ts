import {createHash} from 'node:crypto';
import {SqlTripAuthority} from './tripAuthority';
import {stableValue} from './identityProtection';
import {tripResponse} from './tripResponseDto';
import {GlobalIdentityError} from '../utils/globalIdentityPolicy';
import {commandIdentity,stableJson,validateOfflineEnvelope,uuid,type OfflineCommand,type OfflineContext,type OfflineReceipt} from '../types/sqlOffline';
import type {Scope} from './canonicalAuthority';
const fail=(code:string,status=409):never=>{throw new GlobalIdentityError(code,'',status);};
/** Authenticated read-only recovery capabilities. No production mount or business effects. */
export class SqlOfflineRecoveryAuthority extends SqlTripAuthority {
 async context(token:string,scope:Scope):Promise<OfflineContext>{const actor=await this.authenticated(token,scope.companyId);return this.scoped(token,scope,false,async uow=>{
  if(actor.userId!==uow.context.actorId)fail('OFFLINE_SCOPE_CHANGED',403);const e=(await uow.query('SELECT * FROM qsa_read_offline_epoch()')).rows[0];if(e.canonical_store!=='postgres')fail('SQL_OFFLINE_INACTIVE');
  return {principal:actor.firebaseUid,companyId:scope.companyId,projectId:scope.projectId,canonicalStore:'postgres',backendEpoch:e.backend_epoch,epochRevision:Number(e.epoch_revision)};
 });}
 async recoverTrip(token:string,scope:Scope,body:any):Promise<OfflineReceipt>{
  if(!body||Object.keys(body).some(k=>!['identity','operationId','authority','envelope'].includes(k))||!body.identity||Object.keys(body.identity).some(k=>!['principal','companyId','projectId','deviceId','backendEpoch','epochRevision'].includes(k))||body.authority!=='TRIP'||body.operationId!==body.envelope?.operationId||!uuid(body.identity.deviceId))fail('INVALID_OFFLINE_COMMAND');
  validateOfflineEnvelope('TRIP',body.envelope);const actor=await this.authenticated(token,scope.companyId);
  if(body.identity.principal!==actor.firebaseUid||body.identity.companyId!==scope.companyId||body.identity.projectId!==scope.projectId||body.identity.backendEpoch!==body.envelope.backendEpoch)fail('OFFLINE_SCOPE_CHANGED',403);
  return this.scoped(token,scope,false,async(uow,crypto)=>{
   if(actor.userId!==uow.context.actorId)fail('OFFLINE_SCOPE_CHANGED',403);await uow.query('SELECT qsa_assert_offline_epoch($1,$2)',[body.identity.backendEpoch,body.identity.epochRevision]);this.allowed(uow,body.envelope.command);
   if(body.envelope.payload.tripId)await this.ownership(uow,await this.header(uow,body.envelope.payload.tripId));
   const digest=crypto.digest('command',stableValue([uow.context.companyId,uow.context.projectId,uow.context.actorId,body.envelope])).toString('hex');
   const row=(await uow.query('SELECT * FROM idempotency_receipts WHERE company_id=$1 AND project_id=$2 AND operation_id=$3 FOR UPDATE',[uow.context.companyId,uow.context.projectId,body.operationId])).rows[0];
   const proof:any={...body.identity,operationId:body.operationId,requestDigest:createHash('sha256').update(stableJson(commandIdentity(body))).digest('hex'),state:row?'IN_PROGRESS':'NOT_COMMITTED'};
   if(!row)return proof;if(row.actor_id!==uow.context.actorId||row.request_hash!==digest)fail('IDEMPOTENCY_PAYLOAD_MISMATCH');
   if(row.state!=='COMMITTED')return proof;if(!row.result_encrypted)fail('RECEIPT_RESULT_UNVERIFIED');const value=crypto.open<any>(row.result_encrypted,`${uow.context.companyId}/${uow.context.projectId}/receipt/${body.operationId}`);
   if(!value.trip?.tripId)fail('RECEIPT_RESULT_UNVERIFIED');const trip=await this.header(uow,value.trip.tripId);await this.ownership(uow,trip);return {...proof,state:'COMMITTED',reference:body.operationId,trip:tripResponse(this.doc(uow,crypto,trip),this.actorRoles.get(uow)!)};
  });
 }
 async canonicalReceipt(token:string,scope:Scope,payload:any,fence:{backendEpoch:string;epochRevision:number}){
  const allowed=['type','companyId','projectId','operationId','kind','entityId','command','expectedRevision','reason','carrierId','driverId','truckId','assignmentId','allocationId','materialId'];
  if(!payload||!['MEMBERSHIP','AFFILIATION','ASSIGNMENT','ALLOCATION'].includes(payload.type)||Object.keys(payload).some(k=>!allowed.includes(k))||!uuid(payload.operationId)||payload.companyId!==scope.companyId||payload.projectId!==scope.projectId||Buffer.byteLength(JSON.stringify(payload))>16384)fail('INVALID_RECEIPT_REFERENCE');
  const actor=await this.authenticated(token,scope.companyId);return this.scoped(token,scope,false,async(uow,crypto)=>{
   await uow.query('SELECT qsa_assert_offline_epoch($1,$2)',[fence.backendEpoch,fence.epochRevision]);await uow.query('SELECT * FROM qsa_authorize_canonical_command(false)');const hash=crypto.digest('command',stableValue([uow.context.companyId,uow.context.projectId,uow.context.actorId,payload])).toString('hex');
   const r=(await uow.query('SELECT actor_id,request_hash,state FROM idempotency_receipts WHERE company_id=$1 AND project_id=$2 AND operation_id=$3 FOR UPDATE',[uow.context.companyId,uow.context.projectId,payload.operationId])).rows[0];if(r&&(r.actor_id!==uow.context.actorId||r.request_hash!==hash))fail('IDEMPOTENCY_PAYLOAD_MISMATCH');
   return {operationId:payload.operationId,principal:actor.firebaseUid,companyId:scope.companyId,projectId:scope.projectId,state:r?.state==='COMMITTED'?'COMMITTED':r?'IN_PROGRESS':'NOT_COMMITTED'};
  });
 }
}
