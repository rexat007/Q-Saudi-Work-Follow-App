import type {BoundedProjectPage} from '../../types/boundedProjectReads';
import {SqlOfflineStore,type SqlSession} from './sqlOfflineStore';
import {causalResource,commandDigest,commandIdentity,epochKey,sqlScope,uuid,validateOfflineEnvelope,offlineFail,type OfflineCommand,type OfflineContext,type OfflineEnvelope,type OfflineReceipt,type OfflineTransport,type SqlQueueStatus} from '../../types/sqlOffline';
const runnable=new Set<SqlQueueStatus>(['PENDING','SENDING','AWAITING_RECEIPT','RETRYABLE_FAILURE']);
const MAX_SENDS=3,MAX_RECOVERY=3,LEASE_MS=15000;
const fields=(v:any,keys:string[])=>Object.fromEntries(keys.filter(k=>v?.[k]===null||['string','number','boolean'].includes(typeof v?.[k])).map(k=>[k,v[k]]));
export function safeOfflineProjection(trip:any){return fields(trip,['tripId','tripNumber','projectId','revision','status','carrierId','driverId','truckId','materialId','sourceType']);}
/** Inactive composition seam: no constructor I/O, timers, Firebase selection or Google calls. */
export class SqlOfflineCoordinator {
 private generation=0;private session:SqlSession|null=null;private abort=new AbortController();private running:Promise<number>|null=null;
 private readonly tab=crypto.randomUUID();private inventories=new Map<string,{session:SqlSession;kind:string;revision:string;next:string|null;ids:string[]}>();
 constructor(readonly store:SqlOfflineStore,readonly transport:OfflineTransport,readonly principal:()=>string|null,readonly now:()=>number=Date.now){}
 private invalidate(){this.generation++;this.abort.abort();this.abort=new AbortController();this.session=null;this.inventories.clear();}
 async enter(companyId:string,projectId:string){this.invalidate();const generation=this.generation,principal=this.principal();if(!principal)offlineFail('AUTH_REQUIRED');
  const deviceId=await this.store.device(),context=await this.transport.context({principal,companyId,projectId},this.abort.signal);
  if(generation!==this.generation||this.principal()!==principal)offlineFail('OFFLINE_SCOPE_CHANGED');this.validateContext(context,{principal,companyId,projectId});
  if(!await this.store.epoch(epochKey(context),context))offlineFail('BACKEND_EPOCH_REGRESSION');
  const principalRevision=await this.store.principalRevision(principal);const session:SqlSession={scope:{principal:context.principal,companyId:context.companyId,projectId:context.projectId,backendEpoch:context.backendEpoch,epochRevision:context.epochRevision,deviceId},principalRevision,current:()=>generation===this.generation&&this.principal()===principal&&this.session===session};
  if(generation!==this.generation||this.principal()!==principal)offlineFail('OFFLINE_SCOPE_CHANGED');this.session=session;await this.store.fenceEpoch(session);return structuredClone(session.scope);
 }
 private validateContext(c:OfflineContext,s:{principal:string;companyId:string;projectId:string}){if(c.canonicalStore!=='postgres'||c.principal!==s.principal||c.companyId!==s.companyId||c.projectId!==s.projectId||!Number.isSafeInteger(c.epochRevision)||c.epochRevision<1||!c.backendEpoch)offlineFail('OFFLINE_CONTEXT_UNVERIFIED');}
 async exit(){const principal=this.session?.scope.principal;this.invalidate();if(principal)await this.store.revoke(principal);}
 dispose(){this.invalidate();}
 private active(){if(!this.session?.current())offlineFail('OFFLINE_SCOPE_CHANGED');return this.session;}
 async list(){return this.session?.current()?this.store.list(this.session):[];}
 async cache(){return this.session?.current()?this.store.cache(this.session):[];}
 async enqueue(authority:OfflineCommand['authority'],command:string,payload:Record<string,unknown>,expectedRevision=0,operationId=crypto.randomUUID()){
  const session=this.active();const envelope:OfflineEnvelope={operationId,command,payload:structuredClone(payload),expectedRevision,backendEpoch:session.scope.backendEpoch,payloadSchemaVersion:1};validateOfflineEnvelope(authority,envelope);causalResource({authority,envelope,operationId});
  const key=JSON.stringify([sqlScope(session.scope),operationId]),core={identity:session.scope,authority,envelope,operationId},requestDigest=await commandDigest(core);
  if(!session.current())offlineFail('OFFLINE_SCOPE_CHANGED');let existing:OfflineCommand|undefined;
  await this.store.change(session,key,old=>{if(old){existing=old;if(old.requestDigest!==requestDigest)offlineFail('IDEMPOTENCY_PAYLOAD_MISMATCH');return undefined;}const record:OfflineCommand={...core,key,scope:sqlScope(session.scope),owner:JSON.stringify([session.scope.principal,session.scope.companyId,session.scope.projectId,session.scope.deviceId]),principal:session.scope.principal,createdAt:new Date(this.now()).toISOString(),requestDigest,status:'PENDING',version:1,attempts:0,recoveries:0,nextAttemptAt:0};existing=record;return record;});
  if(!existing)offlineFail('OFFLINE_PERSISTENCE_FAILED');return structuredClone(existing);
 }
 async recover(operationId:string){const s=this.active(),op=(await this.store.list(s)).find(v=>v.operationId===operationId);if(!op)return false;return this.store.change(s,op.key,old=>old?.status==='REVIEW_REQUIRED'&&['TRANSPORT_UNCERTAIN','RECEIPT_IN_PROGRESS','RECEIPT_PENDING','HTTP_UNAVAILABLE','RECEIPT_UNAVAILABLE'].includes(old.errorCode||'')?{...old,status:'AWAITING_RECEIPT',recoveries:0,nextAttemptAt:0,version:old.version+1,lease:undefined}:undefined);}
 async cancel(operationId:string){const s=this.active(),op=(await this.store.list(s)).find(o=>o.operationId===operationId);if(!op)return false;return this.store.change(s,op.key,old=>old&&old.attempts===0&&['PENDING','QUARANTINED_SCOPE'].includes(old.status)?{...old,status:'CANCELLED',version:old.version+1}:undefined);}
 async resume(operationId:string){const s=this.active(),op=(await this.store.list(s)).find(o=>o.operationId===operationId);if(!op)return false;return this.store.change(s,op.key,old=>old?.status==='QUARANTINED_SCOPE'?{...old,status:old.attempts?'AWAITING_RECEIPT':'PENDING',version:old.version+1,nextAttemptAt:0,lease:undefined}:undefined);}
 wake(){if(this.running)return this.running;const run=this.drain();this.running=run;void run.finally(()=>{if(this.running===run)this.running=null;}).catch(()=>{});return run;}
 private async drain(){const session=this.session;if(!session?.current())return 0;const all=await this.store.pending(session),pending=all.sort((a,b)=>Number(a.submissionOrder)-Number(b.submissionOrder)).filter(v=>runnable.has(v.status)&&v.nextAttemptAt<=this.now()&&(!v.lease||v.lease.until<=this.now()));if(!pending.length)return 0;
  let context:OfflineContext;try{context=await this.transport.context(session.scope,this.abort.signal);this.validateContext(context,session.scope);}catch(error:any){if(session.current())for(const op of pending)await this.fail(session,op,undefined,error);if([401,403].includes(error?.status))await this.exit();return 0;}
  if(!session.current())return 0;
  if(context.backendEpoch!==session.scope.backendEpoch||context.epochRevision!==session.scope.epochRevision){if(context.epochRevision>session.scope.epochRevision&&await this.store.epoch(epochKey(context),context)){const next={...session,scope:{...session.scope,backendEpoch:context.backendEpoch,epochRevision:context.epochRevision}};await this.store.fenceEpoch(next);}else for(const op of pending)await this.fail(session,op,undefined,{status:409,code:'BACKEND_EPOCH_MISMATCH'});return 0;}
  let count=0;
  for(const entry of pending.slice(0,100)){if(!session.current())break;
   if(await commandDigest(entry)!==entry.requestDigest){await this.fail(session,entry,undefined,{status:422,code:'IMMUTABLE_PAYLOAD_INVALID'});continue;}
   let claimed:OfflineCommand|undefined;
   await this.store.change(session,entry.key,old=>{if(!old||!runnable.has(old.status)||old.nextAttemptAt>this.now()||old.lease&&old.lease.until>this.now())return undefined;
    if(old.recoveries>=MAX_RECOVERY||old.attempts>=MAX_SENDS&&old.status==='PENDING')return {...old,status:'REVIEW_REQUIRED',errorCode:'RETRY_BUDGET_EXHAUSTED',version:old.version+1};
    claimed={...old,status:old.attempts?'AWAITING_RECEIPT':'SENDING',version:old.version+1,attempts:old.attempts||1,recoveries:old.attempts?old.recoveries+1:old.recoveries,lease:{owner:this.tab,fence:(old.lease?.fence||0)+1,until:this.now()+LEASE_MS}};return claimed;},undefined,true);
   if(!claimed||!session.current())continue;count++;
   try{
    let receipt:OfflineReceipt;
    if(entry.attempts||entry.status==='SENDING'||entry.status==='AWAITING_RECEIPT'){
     receipt=await this.transport.receipt(claimed,this.abort.signal);if(!session.current())continue;this.validateReceipt(claimed,receipt);
     if(receipt.state==='COMMITTED'){await this.ack(session,claimed,receipt);continue;}
     if(receipt.state==='IN_PROGRESS'){await this.fail(session,claimed,claimed.lease!.fence,{status:503,code:'RECEIPT_IN_PROGRESS'});continue;}
     if(claimed.attempts>=MAX_SENDS){await this.fail(session,claimed,claimed.lease!.fence,{status:422,code:'RETRY_BUDGET_EXHAUSTED'});continue;}
     let resend:OfflineCommand|undefined;await this.store.change(session,claimed.key,old=>{if(!this.owns(old,claimed!))return undefined;resend={...old!,attempts:old!.attempts+1,status:'SENDING',version:old!.version+1};return resend;},undefined,true);if(!resend||!session.current())continue;claimed=resend;
    }
    receipt=await this.transport.send(claimed,this.abort.signal);if(!session.current())continue;this.validateReceipt(claimed,receipt);
    if(receipt.state==='COMMITTED')await this.ack(session,claimed,receipt);else await this.fail(session,claimed,claimed.lease!.fence,{status:503,code:'RECEIPT_PENDING'});
   }catch(error:any){if(session.current())await this.fail(session,claimed,claimed.lease?.fence,error);if([401,403].includes(error?.status)){await this.exit();break;}}
  }return count;
 }
 private owns(old:OfflineCommand|undefined,claimed:OfflineCommand){return old&&runnable.has(old.status)&&old.lease?.owner===this.tab&&old.lease.fence===claimed.lease?.fence;}
 private validateReceipt(op:OfflineCommand,r:OfflineReceipt){if(!r||!['COMMITTED','NOT_COMMITTED','IN_PROGRESS'].includes(r.state)||r.operationId!==op.operationId||r.requestDigest!==op.requestDigest||r.principal!==op.identity.principal||r.companyId!==op.identity.companyId||r.projectId!==op.identity.projectId||r.deviceId!==op.identity.deviceId||r.backendEpoch!==op.identity.backendEpoch||r.epochRevision!==op.identity.epochRevision)offlineFail('RECEIPT_BINDING_MISMATCH');}
 private async ack(session:SqlSession,op:OfflineCommand,receipt:OfflineReceipt){const data=receipt.trip?safeOfflineProjection(receipt.trip):undefined;await this.store.change(session,op.key,old=>this.owns(old,op)?{...old!,status:'SYNCED',version:old!.version+1,receipt:fields(receipt,['state','operationId','principal','companyId','projectId','deviceId','backendEpoch','epochRevision','requestDigest','reference']) as unknown as OfflineReceipt,lease:undefined,errorCode:undefined}:undefined,data&&typeof data.tripId==='string'&&Number.isSafeInteger(data.revision)?{id:data.tripId,revision:Number(data.revision),data:{...data,id:data.tripId}}:undefined);}
 private async fail(session:SqlSession,op:OfflineCommand,fence:number|undefined,error:any){const code=typeof error?.code==='string'?error.code:'TRANSPORT_UNCERTAIN',http=Number(error?.status||0);
  const status:SqlQueueStatus=code.includes('EPOCH')?'QUARANTINED_EPOCH':http===401?'QUARANTINED_SCOPE':http===403||http===422||code==='RECEIPT_BINDING_MISMATCH'?'REVIEW_REQUIRED':http===409?'CONFLICT':'AWAITING_RECEIPT';
  await this.store.change(session,op.key,old=>{if(!old||!runnable.has(old.status)||fence===undefined&&old.lease&&old.lease.until>this.now()||fence!==undefined&&(old.lease?.owner!==this.tab||old.lease?.fence!==fence))return undefined;
   const attempts=old.recoveries+(fence===undefined?1:0),final=attempts>=MAX_RECOVERY&&status==='AWAITING_RECEIPT'?'REVIEW_REQUIRED':status;
   return {...old,status:final,errorCode:code,version:old.version+1,recoveries:attempts,nextAttemptAt:this.now()+Math.max(Math.min(30000,1000*2**Math.min(5,old.attempts+attempts)),Number(error?.retryAfterMs)||0),lease:old.lease?{...old.lease,until:0}:undefined};});
 }
 beginInventory(kind:string,revision:string){const session=this.active();if(!/^[A-Z_]{1,30}$/.test(kind)||!/^\d+$/.test(revision))offlineFail('INVALID_CACHE_PAGE');const ticket=crypto.randomUUID();this.inventories.set(ticket,{session,kind,revision,next:null,ids:[]});return ticket;}
 /** Existing U04 pages are always partial, including the final page. */
 async acceptBoundedPage(ticket:string,identity:OfflineContext,page:BoundedProjectPage,cursor:string|null=null){
  const inventory=this.inventories.get(ticket);if(!inventory||!inventory.session.current())return false;
  if(page.projectExternalId!==inventory.session.scope.projectId||page.meta.backendEpoch!==identity.backendEpoch||page.fullSnapshot!==false)offlineFail('INCOMPLETE_CACHE_INVENTORY');
  return this.acceptPage(ticket,{identity,kind:page.kind,sourceRevision:page.sourceRevision,cursor,nextCursor:page.nextCursor,hasMore:page.hasMore,fullSnapshot:false,items:page.items.map(item=>({...item,id:item.entityId}))});
 }
 async acceptPage(ticket:string,page:{identity:OfflineContext;sourceRevision:string;kind:string;cursor:string|null;nextCursor:string|null;hasMore:boolean;fullSnapshot:boolean;completeThrough?:string;items:Array<Record<string,unknown>>}){
  const inventory=this.inventories.get(ticket);if(!inventory||!inventory.session.current())return false;const {session,kind,revision}=inventory;
  this.validateContext(page.identity,session.scope);if(page.identity.backendEpoch!==session.scope.backendEpoch||page.identity.epochRevision!==session.scope.epochRevision||page.kind!==kind||page.sourceRevision!==revision||page.cursor!==inventory.next||page.items.length>50||page.hasMore!==Boolean(page.nextCursor)||page.fullSnapshot&&(page.hasMore||page.completeThrough!==revision))offlineFail('INCOMPLETE_CACHE_INVENTORY');
  const items=page.items.map(v=>{if(typeof v.id!=='string'||inventory.ids.includes(v.id))offlineFail('INVALID_CACHE_PAGE');return {id:v.id,data:fields(v,['id','kind','membershipStatus','globalStatus','integrity','assignmentId','allocationId','status','revision','nameAr','nameEn','plate','truckId','driverId','carrierId','materialId','tripId','tripNumber'])};});if(new Set(items.map(v=>v.id)).size!==items.length)offlineFail('INVALID_CACHE_PAGE');
  const ids=[...inventory.ids,...items.map(v=>v.id)];const accepted=await this.store.putPage(session,kind,revision,items);if(accepted){inventory.ids=ids;inventory.next=page.nextCursor;if(!page.hasMore)this.inventories.delete(ticket);}return accepted;
 }
 bindOnline(target:Pick<Window,'addEventListener'|'removeEventListener'>){const wake=()=>{void this.wake().catch(()=>{});};target.addEventListener('online',wake);return ()=>target.removeEventListener('online',wake);}
}
