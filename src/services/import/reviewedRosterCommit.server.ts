import { createHash, randomUUID } from 'node:crypto';
import { adminDb } from '../../firebase/admin';
import { decodePersistence } from '../../utils/persistenceBoundary';
import { GLOBAL_IDENTITIES, assertOperationallyEligible, normalizeNaturalKey, validGlobalId, GlobalIdentityError } from '../../utils/globalIdentityPolicy';
import { normalizeName, normalizePhone } from '../../utils/normalization';
import { sanitizeUndefined } from '../../utils/sanitize';
import { authorizeGlobalCommand, assertGlobalEntityExists, resolveGlobalNaturalIdentity, auditGlobalMutation } from '../globalIdentityAuthority.server';
import { driverCreationRecord, truckCreationRecord, newFleetIdentityId } from '../fleetIdentityCreation.server';
import { decodeParticipation, planMembership, planAffiliation, protectAffiliationAssignment, writeParticipationPlan } from '../projectParticipationAuthority.server';
import { planAssignment, planAllocation, writeTemporalPlan, writeTemporalClosures } from '../temporalRelationshipAuthority.server';
import { markDirtyInTransaction } from '../projectWorkspaceProjectionState.server';
import { ProjectFleetQueryService } from '../projectFleetQuery.server';
import { ImportSessionServerService } from '../importSession.server';
import { buildRosterCanonicalIntent } from './rosterCanonicalIntent.service';
import { ImportProjectContextAdapter } from './importProjectContext.adapter';
import type { IntentEntity, RosterCanonicalIntent } from '../../types/rosterCanonicalIntent';
import type { ReviewedRosterCommitReceipt, ReviewedRosterCommitResponse } from '../../types/importSession';

export const ATOMIC_IMPORT_WRITE_LIMIT = 400;
export const ATOMIC_IMPORT_BYTES_LIMIT = 8_000_000;
const fail = (code: string): never => { throw new GlobalIdentityError(code); };
const digest = (s: string) => createHash('sha256').update(s).digest('hex');
const stable = (v: any): string => Array.isArray(v) ? `[${v.map(stable).join(',')}]` : v && typeof v === 'object' ? `{${Object.keys(v).filter(k=>v[k]!==undefined).sort().map(k=>JSON.stringify(k)+':'+stable(v[k])).join(',')}}` : JSON.stringify(v);
const same = (a: any,b: any) => stable(a)===stable(b);
/** Buffers the EXISTING authorities' writes. No nested transaction, copied business policy or read-after-write. */
function writePlan(tx: any) {
  const operations: {method:'set'|'update'|'delete';ref:any;data?:any;options?:any}[]=[];
  const staged = {get:(ref:any)=>tx.get(ref),set:(ref:any,data:any,options?:any)=>operations.push({method:'set',ref,data,options}),update:(ref:any,data:any)=>operations.push({method:'update',ref,data}),delete:(ref:any)=>operations.push({method:'delete',ref})};
  return {staged, publish() {
    let bytes=0;
    for(const op of operations) {const size=Buffer.byteLength(JSON.stringify(op.data) || '')+Buffer.byteLength(op.ref.path || '')+256;if(size>900_000)fail('IMPORT_COMMIT_TOO_LARGE_FOR_ATOMIC_EXECUTION');bytes+=size;}
    if(operations.length>ATOMIC_IMPORT_WRITE_LIMIT||bytes>ATOMIC_IMPORT_BYTES_LIMIT)fail('IMPORT_COMMIT_TOO_LARGE_FOR_ATOMIC_EXECUTION');
    for(const op of operations) {if(op.method==='delete')tx.delete(op.ref);else if(op.method==='update')tx.update(op.ref,op.data);else if(op.options)tx.set(op.ref,op.data,op.options);else tx.set(op.ref,op.data);}
    return operations.length;
  }};
}
/** Bounded orchestration only. Existing identity, participation and temporal authorities own policy. */
export class ReviewedRosterCommitServer {
  constructor(private db: any = adminDb, private refresh?: (p:string,actor:{userId:string;email?:string})=>Promise<any>) {}
  async commit(projectId:string, importSessionId:string, request:{expectedVersion:number;operationId?:string;reviewedSignature?:string}, authenticated:{userId:string;email?:string}):Promise<ReviewedRosterCommitResponse> {
    if(!validGlobalId(projectId)||!validGlobalId(importSessionId)||!request||Object.keys(request).some(k=>!['expectedVersion','operationId','reviewedSignature'].includes(k))||!Number.isSafeInteger(request.expectedVersion)||request.expectedVersion<1)fail('INVALID_REVIEWED_COMMIT_COMMAND');
    const db=this.db,ref=db.collection('projects').doc(projectId).collection('importSessions').doc(importSessionId);
    const receipt:ReviewedRosterCommitReceipt=await db.runTransaction(async(tx:any)=>{
      const actor=await authorizeGlobalCommand(tx,db,authenticated,projectId);
      const snap=await tx.get(ref);if(!snap.exists)fail('IMPORT_SESSION_NOT_FOUND');
      const header=decodePersistence<any>(snap.data(),{id:['importSessionId',importSessionId],projectId,times:{createdAt:'iso',updatedAt:'iso'}});
      if(header.schemaVersion!==2||header.domain!=='ROSTER')fail('INVALID_REVIEWED_COMMIT_SESSION');
      if(header.lifecycleState!=='INTENT_REVIEWED'&&header.lifecycleState!=='COMMITTED')fail('INVALID_REVIEWED_COMMIT_SESSION');
      if(header.lifecycleState==='INTENT_REVIEWED'&&header.version!==request.expectedVersion)throw Object.assign(new GlobalIdentityError('VERSION_CONFLICT'),{serverVersion:header.version});
      const artifacts=await new ImportSessionServerService(db).hydrateSnapshots((r:any)=>tx.get(r),ref,header);
      const reviewed=artifacts.reviewedCanonicalIntent||header.reviewedCanonicalIntent;
      const batch=artifacts.importBatch||header.importBatch;
      if(header.hasReviewedIntent===false||!reviewed||!batch||!Array.isArray(batch.rows)||batch.rows.length>10000)fail('INVALID_REVIEWED_INTENT_BINDING');
      for(const key of ['projectId','importSessionId','operationId','importBatchId'])if(reviewed[key]!==header[key])fail('INVALID_REVIEWED_INTENT_BINDING');
      if(batch.projectId!==projectId||batch.importBatchId!==header.importBatchId||batch.operationId!==header.operationId||reviewed.intent?.projectId!==projectId||reviewed.sourceRevisionId!==header.source?.sourceRevisionId||reviewed.mappingRevisionId!==header.mapping?.mappingRevisionId||header.mapping?.sourceRevisionId!==header.source?.sourceRevisionId||header.mapping?.approved!==true)fail('INVALID_REVIEWED_INTENT_BINDING');
      const intent:RosterCanonicalIntent=reviewed.intent;
      if(!intent.signature||reviewed.acceptedSignature!==intent.signature||!Array.isArray(intent.blockers)||intent.blockers.length||!intent.rowDecisions?.some(r=>r.status==='CONTRIBUTING')||intent.rowDecisions.some(r=>r.status==='BLOCKED'))fail('INVALID_REVIEWED_IMPORT_INTENT');
      if(intent.requiresDisplacementApproval&&reviewed.displacementApprovedSignature!==intent.signature)fail('DISPLACEMENT_APPROVAL_REQUIRED');
      if(intent.warnings?.length&&header.warningConfirmation!==true)fail('WARNING_APPROVAL_REQUIRED');
      const signature=digest(intent.signature);
      if(request.operationId!==undefined&&request.operationId!==header.operationId||request.reviewedSignature!==undefined&&request.reviewedSignature!==signature)fail('INVALID_REVIEWED_INTENT_BINDING');
      if(header.lifecycleState==='COMMITTED') {
        const old:ReviewedRosterCommitReceipt=header.commitReceipt;
        if(!old||old.operationId!==header.operationId||old.reviewedSignature!==signature||old.requestVersion!==request.expectedVersion||old.importSessionId!==importSessionId||old.projectId!==projectId||old.committedVersion!==header.version)fail('INVALID_REVIEWED_COMMIT_RETRY');
        return old;
      }
      const query=new ProjectFleetQueryService(db);
      const current=await query.contextInTransaction(tx,projectId,authenticated,actor,{resolution:true});
      const prepared=intent.entities.filter(e=>e.prepared);
      // Materialization races are proved against reviewed fields, then omitted ONLY from the pre-materialization builder view.
      const raced=new Set<string>();const identities=new Map<string,any>();const idMap:Record<string,string>={};
      const at=new Date(), now=at.toISOString(), root=db.collection('projects').doc(projectId);
      for(const entity of prepared) {
        if(!['DRIVER','TRUCK'].includes(entity.kind)||!entity.plan||!entity.carrierId)fail('PREPARED_ENTITY_CONFLICT');
        const kind=entity.kind as 'DRIVER'|'TRUCK',plan=entity.plan as any;
        const allowed=kind==='DRIVER'?['driverName','residencyId','phone','carrierId']:['plateNumber','truckType','tareWeightKg','maxGrossWeightKg','carrierId'];
        if(Object.keys(plan).some(k=>!allowed.includes(k))||plan.carrierId!==entity.carrierId||kind==='DRIVER'&&!(typeof plan.driverName==='string'&&plan.driverName.trim()))fail('PREPARED_ENTITY_CONFLICT');
        const natural=normalizeNaturalKey(kind,kind==='DRIVER'?plan.residencyId:plan.plateNumber);
        if(entity.key!==`prepared:${kind.toLowerCase()}:${natural}`)fail('PREPARED_ENTITY_CONFLICT');
        const resolved=await resolveGlobalNaturalIdentity(tx,db,kind,natural), id=resolved.id||newFleetIdentityId(kind);
        const proposed=kind==='DRIVER'?driverCreationRecord(id,plan,actor.userId,now):truckCreationRecord(id,plan,actor.userId,now);
        if(resolved.entity) {
          assertOperationallyEligible(kind,resolved.entity);
          if(kind==='DRIVER'?(normalizeName(resolved.entity.fullNameAr||'')!==normalizeName(proposed.fullNameAr)||normalizePhone(resolved.entity.phone||'')!==proposed.phone):['truckType','tareWeightKg','maxGrossWeightKg','legalPayloadLimitKg'].some(k=>proposed[k]!==undefined&&resolved.entity![k]!==proposed[k]))fail('PREPARED_ENTITY_CONFLICT');
          raced.add(`${kind}:${id}`);
        }
        if(identities.has(`${kind}:${entity.key}`))fail('PREPARED_ENTITY_CONFLICT');
        idMap[entity.key]=id;identities.set(`${kind}:${entity.key}`,{kind,id,global:resolved.entity||proposed,resolved,newRecord:resolved.id?null:proposed});
      }
      const proofContext={...current,importResolution:{...current.importResolution!,entities:current.importResolution!.entities.filter(e=>!raced.has(`${e.kind}:${e.id}`))}};
      const pipeline=ImportProjectContextAdapter.createPipelineContext({relContext:proofContext,projectId,userId:actor.userId,role:actor.role,operationId:header.operationId});
      const rebuilt=buildRosterCanonicalIntent(batch,pipeline);
      if(rebuilt.signature!==reviewed.acceptedSignature||!same(rebuilt,intent))fail('REVIEWED_INTENT_STALE');
      const participating=new Map<string,any>(),membershipPlans:any[]=[],affiliationPlans:any[]=[],temporalPlans:any[]=[];
      const canonicalId=(key:string)=>idMap[key]||key;
      for(const entity of intent.entities) {
        const spec=GLOBAL_IDENTITIES[entity.kind];if(!spec)fail('INVALID_REVIEWED_IMPORT_INTENT');
        const id=canonicalId(entity.key), info=identities.get(`${entity.kind}:${entity.key}`);
        const global=info?.global||await assertGlobalEntityExists(tx,db,entity.kind,id);assertOperationallyEligible(entity.kind,global);
        const mem=await tx.get(root.collection(`${spec.kind}_memberships`).doc(id));
        let membership=mem.exists?mem.data():null;
        if(entity.prepared) {const plan=planMembership({kind:entity.kind,projectId,entityId:id,before:membership,global,actor,command:'ENROLL'});membershipPlans.push(plan);membership=plan.after;}
        else if(!membership||decodeParticipation(membership,entity.kind,projectId,id).status!=='ACTIVE')fail('REVIEWED_INTENT_STALE');
        participating.set(`${entity.kind}:${id}`,{global,membership,entity});
      }
      for(const entity of intent.entities.filter(e=>e.kind==='DRIVER'||e.kind==='TRUCK')) {
        const kind=entity.kind as 'DRIVER'|'TRUCK',id=canonicalId(entity.key),spec=GLOBAL_IDENTITIES[kind],item=participating.get(`${kind}:${id}`);
        const snap=await tx.get(root.collection(`${spec.kind}_carrier_affiliations`).doc(id));let affiliation=snap.exists?snap.data():null;
        if(entity.prepared) {
          const carrier=participating.get(`CARRIER:${entity.carrierId}`);if(!carrier)fail('REVIEWED_INTENT_STALE');
          const plan=planAffiliation({kind,projectId,entityId:id,carrierId:entity.carrierId!,before:affiliation,entityMembership:item.membership,carrierMembership:carrier.membership,global:item.global,carrierGlobal:carrier.global,command:'SET_AFFILIATION',actor});
          await protectAffiliationAssignment(tx,db,plan);affiliationPlans.push(plan);affiliation=plan.after;
        } else {
          // Displaced counterpart entities have no row participation; still prove their existing affiliation.
          if(!affiliation||decodeParticipation(affiliation,kind,projectId,id,true).status!=='ACTIVE'||entity.carrierId&&affiliation.carrierId!==entity.carrierId)fail('REVIEWED_INTENT_STALE');
        }
        item.affiliation=affiliation;
      }
      // Completed prerequisites are evidence, never commands. The builder re-proves their existence; participation above re-proves their state.
      if(intent.entityConsequences.some(c=>c.action!=='PREPARE_NEW'&&!c.completed)||intent.entityConsequences.some(c=>c.action==='PREPARE_NEW'&&!prepared.some(e=>c.key===`${e.kind}:${e.key}`)))fail('INVALID_REVIEWED_IMPORT_INTENT');
      for(const consequence of intent.assignmentIntents) {
        const driverId=canonicalId(consequence.driverId),truckId=canonicalId(consequence.truckId),d=participating.get(`DRIVER:${driverId}`),t=participating.get(`TRUCK:${truckId}`),c=participating.get(`CARRIER:${t?.affiliation?.carrierId}`);
        if(!d||!t||!c)fail('REVIEWED_INTENT_STALE');
        const plan=await planAssignment(tx,db,projectId,driverId,truckId,consequence.action==='REASSIGN'?'REASSIGN':'ASSIGN',actor,at,{driverGlobal:d.global,truckGlobal:t.global,driverMembership:d.membership,truckMembership:t.membership,driverAffiliation:d.affiliation,truckAffiliation:t.affiliation,carrierGlobal:c.global,carrierMembership:c.membership});
        if((consequence.action==='NO_CHANGE')!==!plan.changed||consequence.action==='REASSIGN'&&!same(plan.before.map(r=>({assignmentId:r.assignmentId,driverId:r.driverId,truckId:r.truckId})).sort((a,b)=>a.assignmentId.localeCompare(b.assignmentId)),consequence.displaced))fail('REVIEWED_INTENT_STALE');
        temporalPlans.push(plan);
      }
      for(const consequence of intent.allocationIntents) {
        const truckId=canonicalId(consequence.truckId),t=participating.get(`TRUCK:${truckId}`),m=participating.get(`MATERIAL:${consequence.materialId}`);if(!t||!m)fail('REVIEWED_INTENT_STALE');
        const plan=await planAllocation(tx,db,projectId,truckId,consequence.materialId,consequence.action==='REALLOCATE'?'REALLOCATE':'ALLOCATE',actor,at,{truckGlobal:t.global,materialGlobal:m.global,truckMembership:t.membership,materialMembership:m.membership,truckAffiliation:t.affiliation});
        if((consequence.action==='NO_CHANGE')!==!plan.changed||consequence.action==='REALLOCATE'&&!same(plan.before.map(r=>({allocationId:r.allocationId,truckId:r.truckId,materialId:r.materialId})),[consequence.displaced]))fail('REVIEWED_INTENT_STALE');
        temporalPlans.push(plan);
      }
      const writes=writePlan(tx),w=writes.staged;
      for(const info of identities.values()) {
        if(info.newRecord) {w.set(db.collection(GLOBAL_IDENTITIES[info.kind as 'DRIVER'|'TRUCK'].collection).doc(info.id),info.newRecord);auditGlobalMutation(w,db,info.kind,info.id,actor,null,info.newRecord,projectId);}
        if(info.resolved.mustReserve)w.set(info.resolved.canonicalRef,{entityType:info.kind,systemId:info.id,createdAt:now,createdBy:actor.userId});
      }
      for(const plan of [...membershipPlans,...affiliationPlans])writeParticipationPlan(w,db,plan);
      for(const plan of temporalPlans)writeTemporalClosures(w,db,plan,at);
      for(const plan of temporalPlans)writeTemporalPlan(w,db,plan,at,false);
      if([...membershipPlans,...affiliationPlans,...temporalPlans].some(p=>p.changed)||[...identities.values()].some(i=>i.newRecord))await markDirtyInTransaction(w,projectId,[...([...identities.values()].some(i=>i.kind==='DRIVER'&&i.newRecord)||membershipPlans.some(p=>p.kind==='DRIVER'&&p.changed)?['DRIVERS']:[]),'FLEET_ROSTER'],'REVIEWED_ROSTER_COMMIT',now,db);
      const receipt:ReviewedRosterCommitReceipt={projectId,importSessionId,operationId:header.operationId,importBatchId:header.importBatchId,sourceRevisionId:reviewed.sourceRevisionId,mappingRevisionId:reviewed.mappingRevisionId,reviewedSignature:signature,signatureEncoding:'SHA256',requestVersion:request.expectedVersion,committedVersion:header.version+1,committedAt:now,committedBy:actor.userId,preparedIdentityMap:idMap,resultSummary:{canonicalEntities:[...participating.entries()].map(([key,value])=>({kind:key.split(':')[0],id:key.split(':')[1],...(value.affiliation?{carrierId:value.affiliation.carrierId}:{})})),contributingRows:intent.rowDecisions.filter(r=>r.status==='CONTRIBUTING').length,createdIdentities:[...identities.values()].filter(i=>i.newRecord).length,reusedConcurrentIdentities:[...identities.values()].filter(i=>!i.newRecord).length,assignments:temporalPlans.filter(p=>p.kind==='ASSIGNMENT').map(p=>({action:p.changed?p.command:'NO_CHANGE',assignmentId:p.record.assignmentId,driverId:p.record.driverId,truckId:p.record.truckId})),allocations:temporalPlans.filter(p=>p.kind==='ALLOCATION').map(p=>({action:p.changed?p.command:'NO_CHANGE',allocationId:p.record.allocationId,truckId:p.record.truckId,materialId:p.record.materialId}))}};
      w.update(ref,{lifecycleState:'COMMITTED',currentStage:'COMMIT_RESULT',rosterStage:'COMMIT_RESULT',version:receipt.committedVersion,updatedAt:now,updatedBy:actor.userId,commitReceipt:receipt});
      const auditLogId=`AUD-IMPORT-${randomUUID()}`;w.set(db.collection('audit_logs').doc(auditLogId),sanitizeUndefined({auditLogId,projectId,entityType:'IMPORT_SESSION',entityId:importSessionId,action:'COMMIT_REVIEWED_INTENT',actor:{userId:actor.userId,role:actor.role,email:actor.email},changes:{operationId:header.operationId,importBatchId:header.importBatchId,sourceRevisionId:reviewed.sourceRevisionId,mappingRevisionId:reviewed.mappingRevisionId,reviewedSignature:signature,preparedIdentityMap:idMap},createdAt:now,updatedAt:now,createdBy:actor.userId,updatedBy:actor.userId}));
      writes.publish();return receipt;
    });
    // Commit truth is already durable. A later read failure must never trigger business replay.
    try {
      const context=await (this.refresh?this.refresh(projectId,authenticated):new ProjectFleetQueryService(db).context(projectId,authenticated,{resolution:true}));
      const entities=context.importResolution?.entities||[];
      for(const expected of receipt.resultSummary.canonicalEntities)if(!entities.some((e:any)=>e.kind===expected.kind&&e.id===expected.id&&e.eligible&&e.membershipStatus==='ACTIVE'&&(!expected.carrierId||e.affiliation?.status==='ACTIVE'&&e.affiliation.carrierId===expected.carrierId)))throw Error('CANONICAL_PROOF_PENDING');
      for(const a of receipt.resultSummary.assignments)if(!entities.some((e:any)=>e.kind==='DRIVER'&&e.id===a.driverId&&e.assignment?.assignmentId===a.assignmentId&&e.assignment?.truckId===a.truckId))throw Error('CANONICAL_PROOF_PENDING');
      for(const a of receipt.resultSummary.allocations)if(!entities.some((e:any)=>e.kind==='TRUCK'&&e.id===a.truckId&&e.allocation?.allocationId===a.allocationId&&e.allocation?.materialId===a.materialId))throw Error('CANONICAL_PROOF_PENDING');
      return {lifecycleState:'COMMITTED',receipt,canonicalRefresh:'VERIFIED'};
    } catch {return {lifecycleState:'COMMITTED',receipt,canonicalRefresh:'PENDING',code:'COMMIT_SUCCEEDED_CANONICAL_REFRESH_PENDING'};}
  }
}
