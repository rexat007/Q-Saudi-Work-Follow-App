import {randomUUID} from 'node:crypto';
import {SqlCanonicalAuthority,type Scope} from './canonicalAuthority.js';
import type {SqlAuthorityDependencies} from './canonicalAuthority.js';
import type {UnitOfWork} from './unitOfWork.js';
import type {CanonicalIdentityRepository} from './canonicalIdentityRepository.js';
import {identitySpec} from './canonicalIdentityRepository.js';
import {IdentityProtection} from './identityProtection.js';
import {TemporalRelationshipRepository} from './temporalRelationshipRepository.js';
import {ImportArtifacts,UnavailableImportSourceStore,importFail,sha,type ImportSourceStore} from './importArtifacts.js';
import {sqlImportContext,assertPreparedProfile,preparedIdentityInput} from './importCanonicalContext.js';
import {validateDurableCheckpoint,prepareDurableBatch,assertSessionPayload} from '../services/import/durableSessionContract';
import {buildRosterCanonicalIntent} from '../services/import/rosterCanonicalIntent.service';
import {ImportProjectContextAdapter} from '../services/import/importProjectContext.adapter';
import {executionDigest,prepareExecutionGroups,validateRecoveryScope,scopedExecutionBatch} from '../services/import/rosterExecutionPlan.server';
import type {ImportExecutionGroup} from '../types/importExecution';
import {GlobalIdentityError} from '../utils/globalIdentityPolicy';
import {BoundedImportSourceRowVerifier,bindSourceRows,sourceMapping,mappedSource,ROSTER_FIELDS,type SourceCorrection} from './importSourceRows.js';

interface SessionCommand {sessionId:string;requestId:string;expectedVersion:number}
const uuid=(v:unknown):v is string=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
const external=(v:unknown):v is string=>typeof v==='string'&&/^[A-Za-z0-9_-]{1,128}$/.test(v);
const strict=(value:object,allowed:string[])=>{if(!value||Object.keys(value).some(k=>!allowed.includes(k)))importFail('INVALID_IMPORT_COMMAND');};
const version=(v:number,min=1)=>{if(!Number.isSafeInteger(v)||v<min)importFail('IMPORT_VERSION_REQUIRED');};
const groupOperation=(binding:string,key:string)=>{const h=sha(binding+'/'+key);return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20,32)}`;};
export const SQL_IMPORT_LIMITS={sourceBytes:2_000_000,checkpointBytes:8_000_000,rows:10000,reviewEntities:1024,groups:500,
  groupRows:10000,groupEntities:16,groupConsequences:64,groupBytes:1_000_000,groupQueries:1200,reviewQueries:12000,statusLimit:50} as const;
export class SqlImportAuthority extends SqlCanonicalAuthority {
  private readonly sources:ImportSourceStore;
  private readonly sourceRows=new BoundedImportSourceRowVerifier();
  constructor(deps:SqlAuthorityDependencies & {sourceStore?:ImportSourceStore}={}){super(deps);this.sources=deps.sourceStore||new UnavailableImportSourceStore();}
  protected async scoped<T>(token:string,scope:Scope,governance:boolean,
    work:(uow:UnitOfWork,crypto:IdentityProtection,ids:CanonicalIdentityRepository)=>Promise<T>):Promise<T>{
    try{return await super.scoped(token,scope,governance,work);}catch(error:any){
      if(error instanceof GlobalIdentityError||['AuthenticationError','AuthorizationError'].includes(error?.name)||error?.code==='PROJECT_LIFECYCLE_MUTATION_DENIED')throw error;
      return importFail('IMPORT_AUTHORITY_UNAVAILABLE');
    }
  }
  private temporal(uow:UnitOfWork,ids:CanonicalIdentityRepository,crypto:IdentityProtection,operation:string){
    return new TemporalRelationshipRepository(uow,ids,this.actorRoles.get(uow)!,operation,
      (kind,id,action,before,after,revision,metadata)=>this.consequence(uow,crypto,kind,id,operation,action,before,after,revision,metadata));
  }
  private budget(uow:UnitOfWork,limit:number){const original=uow.query.bind(uow);let count=0;
    uow.query=((...args:any[])=>{if(++count>limit)importFail('IMPORT_QUERY_BUDGET');return (original as any)(...args);}) as typeof uow.query;
    return ()=>count;
  }
  private run<T>(token:string,scope:Scope,r:SessionCommand,action:string,payload:unknown,
    work:(uow:UnitOfWork,ids:CanonicalIdentityRepository,crypto:IdentityProtection)=>Promise<T>){
    if(!external(r.sessionId)||!uuid(r.requestId))importFail('INVALID_IMPORT_COMMAND');version(r.expectedVersion,action==='CREATE'?0:1);
    return this.command(token,{...scope,operationId:r.requestId},{type:'IMPORT_'+action,session:r.sessionId,payload},false,async(uow,ids,crypto)=>{
      this.budget(uow,SQL_IMPORT_LIMITS.reviewQueries);
      try{return await work(uow,ids,crypto);}catch(error:any){if(error?.code===error?.message&&/^[A-Z_]+$/.test(error.code))importFail(error.code);throw error;}
    });
  }
  private async header(uow:UnitOfWork,sessionId:string){
    const row=(await uow.query(`SELECT * FROM import_sessions WHERE company_id=$1 AND project_id=$2 AND external_id=$3 FOR UPDATE`,
      [uow.context.companyId,uow.context.projectId,sessionId])).rows[0];
    if(!row)importFail('IMPORT_SESSION_NOT_FOUND');
    if(row.schema_version!==2||!uuid(row.operation_id)||!row.checkpoint_artifact)importFail('IMPORT_LEGACY_RECONCILIATION_REQUIRED');
    version(Number(row.version));version(Number(row.fence),0);return row;
  }
  private async checkpointValue(uow:UnitOfWork,row:any){
    const value=await new ImportArtifacts(uow).read(row.id,row.checkpoint_artifact,'CHECKPOINT');
    if(value.projectId!==row.project_external||value.importSessionId!==row.external_id||value.operationId!==row.operation_id||value.importBatchId!==row.batch_external_id) {
      // Project external ID is verified independently of caller-provided checkpoint data.
      const p=(await uow.query('SELECT external_id FROM projects WHERE company_id=$1 AND id=$2',[uow.context.companyId,uow.context.projectId])).rows[0];
      if(value.projectId!==p?.external_id||value.importSessionId!==row.external_id||value.operationId!==row.operation_id||value.importBatchId!==row.batch_external_id)importFail('INVALID_REVIEWED_INTENT_BINDING');
    }
    return value;
  }
  private checkVersion(row:any,expected:number){if(Number(row.version)!==expected)importFail('IMPORT_VERSION_CONFLICT');}
  private async verifySource(uow:UnitOfWork,row:any,checkpoint:any){
    if(!row.source_artifact||!checkpoint.source?.sourceRevisionId||checkpoint.source.fingerprint!==row.source_hash)importFail('SOURCE_REVISION_REQUIRED');
    const receipt=checkpoint.source.providerSnapshot;
    if(!receipt||receipt.artifactId!==row.source_artifact||receipt.contentSha256!==row.source_hash
      ||receipt.sourceType!==checkpoint.sourceType||receipt.sourceRevisionId!==checkpoint.source.sourceRevisionId||!receipt.provider)importFail('SOURCE_PROVENANCE_REQUIRED');
    const bytes=await this.sources.get(uow,row.id,row.source_artifact);
    if(sha(bytes)!==row.source_hash)importFail('SOURCE_HASH_MISMATCH');
    const inventory=this.sourceRows.read(bytes,checkpoint.source);
    if(!checkpoint.source.rowInventory||checkpoint.source.rowInventory.digest!==inventory.digest
      ||checkpoint.source.rowInventory.rowCount!==inventory.rows.length||checkpoint.source.rowInventory.columnsDigest!==inventory.columnsDigest)importFail('SOURCE_ROW_PROVENANCE_REQUIRED');
    return inventory;
  }
  private async saveCheckpoint(uow:UnitOfWork,row:any,next:any,actor:string,source?:{id:string;hash:string}){
    const artifact=await new ImportArtifacts(uow).write(row.id,'CHECKPOINT',next);
    await uow.query(`UPDATE import_sessions SET checkpoint_artifact=$1,state=$2,version=version+1,updated_by=$3,updated_at=clock_timestamp(),reviewed_signature=$4
      ,source_artifact=coalesce($8::uuid,source_artifact),source_hash=coalesce($9,source_hash)
      WHERE company_id=$5 AND project_id=$6 AND id=$7`,[artifact,next.lifecycleState,actor,next.reviewedCanonicalIntent?executionDigest(next.reviewedCanonicalIntent.intent.signature):null,
      uow.context.companyId,uow.context.projectId,row.id,source?.id||null,source?.hash||null]);
  }
  async createSession(token:string,scope:Scope,r:SessionCommand & {operationId:string;importBatchId:string;sourceType:string;domain?:'ROSTER'|'TRIP'}){
    strict(r,['sessionId','requestId','expectedVersion','operationId','importBatchId','sourceType','domain']);
    if(r.expectedVersion!==0||!uuid(r.operationId)||!external(r.importBatchId)||!['CSV','EXCEL','GOOGLE_SHEETS','GOOGLE_DRIVE'].includes(r.sourceType))importFail('INVALID_IMPORT_COMMAND');
    return this.run(token,scope,r,'CREATE',r,async(uow,_ids,crypto)=>{
      await this.lifecycle(uow,false);
      const projectExternal=(await uow.query('SELECT external_id FROM projects WHERE company_id=$1 AND id=$2',[uow.context.companyId,uow.context.projectId])).rows[0].external_id;
      const id=randomUUID(),at=new Date().toISOString(),value={schemaVersion:2,domain:r.domain||'ROSTER',projectId:projectExternal,
        importSessionId:r.sessionId,operationId:r.operationId,importBatchId:r.importBatchId,sourceType:r.sourceType,
        lifecycleState:'SOURCE',currentStage:r.domain==='TRIP'?'SOURCE':'SOURCE_DISCOVERY',rosterStage:'SOURCE_DISCOVERY',version:1,
        createdAt:at,updatedAt:at,createdBy:uow.context.actorId,updatedBy:uow.context.actorId};
      validateDurableCheckpoint(null,value,uow.context.actorId,at);
      await uow.query(`INSERT INTO import_sessions(id,company_id,project_id,external_id,state,version,source_hash,schema_version,operation_id,batch_external_id,checkpoint_artifact,created_by,updated_by)
        VALUES($1,$2,$3,$4,'SOURCE',0,'',2,$5,$6,NULL,$7,$7)`,[id,uow.context.companyId,uow.context.projectId,r.sessionId,r.operationId,r.importBatchId,uow.context.actorId]);
      const artifact=await new ImportArtifacts(uow).write(id,'CHECKPOINT',value);
      await uow.query('UPDATE import_sessions SET checkpoint_artifact=$1,version=1 WHERE company_id=$2 AND project_id=$3 AND id=$4',
        [artifact,uow.context.companyId,uow.context.projectId,id]);
      await this.consequence(uow,crypto,'IMPORT_SESSION',r.sessionId,r.requestId,'IMPORT_SESSION_CREATED',null,{version:1},1);
      return {sessionId:r.sessionId,version:1,lifecycleState:'SOURCE'};
    });
  }
  async attachSource(token:string,scope:Scope,r:SessionCommand & {sourceRevisionId:string;contentSha256:string;sourceType:string;metadata:Record<string,unknown>},bytes:Buffer){
    strict(r,['sessionId','requestId','expectedVersion','sourceRevisionId','contentSha256','sourceType','metadata']);
    assertSessionPayload(r.metadata);
    if(!external(r.sourceRevisionId)||!Buffer.isBuffer(bytes)||!bytes.length||bytes.length>SQL_IMPORT_LIMITS.sourceBytes||sha(bytes)!==r.contentSha256)importFail('SOURCE_HASH_MISMATCH');
    return this.run(token,scope,r,'SOURCE',{...r,verifiedHash:sha(bytes)},async(uow,_ids,crypto)=>{
      const row=await this.header(uow,r.sessionId);this.checkVersion(row,r.expectedVersion);
      if(!['SOURCE','DISCOVERED','MAPPING','RESOLUTION','REVIEW','INTENT_REVIEWED'].includes(row.state))importFail('IMPORT_SESSION_TERMINAL');
      const previous=await this.checkpointValue(uow,row);
      if(r.sourceType!==previous.sourceType||row.source_artifact&&row.source_hash!==r.contentSha256)importFail('IMMUTABLE_SOURCE_REVISION');
      if((await uow.query('SELECT 1 FROM import_executions WHERE company_id=$1 AND project_id=$2 AND session_id=$3',[uow.context.companyId,uow.context.projectId,row.id])).rowCount)importFail('IMPORT_EXECUTION_MANAGED');
      if(r.sourceType==='GOOGLE_SHEETS'&&(!r.metadata.spreadsheetId||!r.metadata.sheetTitle))importFail('SOURCE_REVISION_REQUIRED');
      const receipt=await this.sources.put(uow,row.id,bytes,{sourceType:r.sourceType,sourceRevisionId:r.sourceRevisionId,metadata:r.metadata}),at=new Date().toISOString();
      if(!uuid(receipt.artifactId)||receipt.contentSha256!==r.contentSha256||receipt.sourceType!==r.sourceType||receipt.sourceRevisionId!==r.sourceRevisionId||!receipt.provider)importFail('SOURCE_PROVENANCE_REQUIRED');
      const id=receipt.artifactId;
      const next={...previous,lifecycleState:'DISCOVERED',rosterStage:'SOURCE_DISCOVERY',currentStage:previous.domain==='TRIP'?'DISCOVERY':'SOURCE_DISCOVERY',version:Number(row.version)+1,replaceSource:Boolean(row.source_artifact),
        source:{sourceRevisionId:r.sourceRevisionId,sourceType:r.sourceType,fingerprint:r.contentSha256,requiresReattach:r.sourceType!=='GOOGLE_SHEETS',providerSnapshot:receipt,
          fileName:r.metadata.fileName,fileSize:bytes.length,mimeType:r.metadata.mimeType,
          ...(r.sourceType==='GOOGLE_SHEETS'?{remote:{spreadsheetId:r.metadata.spreadsheetId,sheetTitle:r.metadata.sheetTitle,modifiedTime:r.metadata.modifiedTime}}:{})}};
      const inventory=this.sourceRows.read(bytes,next.source);
      (next.source as any).rowInventory={contract:inventory.contract,digest:inventory.digest,columnsDigest:inventory.columnsDigest,rowCount:inventory.rows.length};
      // A new source revision has no authority to reuse an earlier mapping or corrections.
      for(const key of ['mapping','importBatch','reviewSnapshot','sourceCorrections','reviewedCanonicalIntent'])delete (next as any)[key];
      validateDurableCheckpoint(previous,next,uow.context.actorId,at);
      await this.saveCheckpoint(uow,row,next,uow.context.actorId,{id,hash:r.contentSha256});
      await this.consequence(uow,crypto,'IMPORT_SESSION',r.sessionId,r.requestId,'IMPORT_SOURCE_ATTACHED',null,{sha:r.contentSha256},Number(row.version)+1);
      return {sessionId:r.sessionId,version:Number(row.version)+1,lifecycleState:'DISCOVERED'};
    });
  }
  async checkpoint(token:string,scope:Scope,r:SessionCommand & {patch:Record<string,any>}){
    strict(r,['sessionId','requestId','expectedVersion','patch']);
    strict(r.patch,['lifecycleState','rosterStage','currentStage','mapping','importBatch','reviewSnapshot','warningConfirmation','invalidateReview']);
    assertSessionPayload(r.patch);if(Buffer.byteLength(JSON.stringify(r.patch))>SQL_IMPORT_LIMITS.checkpointBytes)importFail('IMPORT_ARTIFACT_LIMIT');
    if(r.patch.lifecycleState==='INTENT_REVIEWED')importFail('SERVER_REVIEW_REQUIRED');
    return this.run(token,scope,r,'CHECKPOINT',r,async(uow,_ids,crypto)=>{
      const row=await this.header(uow,r.sessionId);this.checkVersion(row,r.expectedVersion);
      if((await uow.query('SELECT 1 FROM import_executions WHERE company_id=$1 AND project_id=$2 AND session_id=$3',[uow.context.companyId,uow.context.projectId,row.id])).rowCount)importFail('IMPORT_EXECUTION_MANAGED');
      const previous=await this.checkpointValue(uow,row),at=new Date().toISOString(),next={...previous,...structuredClone(r.patch),version:Number(row.version)+1,updatedAt:at,updatedBy:uow.context.actorId};
      if(next.importBatch){next.importBatch=prepareDurableBatch(next.importBatch);
        const rows=next.importBatch.rows;if(!Array.isArray(rows)||rows.length>10000||new Set(rows.map((v:any)=>v.rowNumber)).size!==rows.length||rows.some((v:any)=>!Number.isSafeInteger(v.rowNumber)||v.rowNumber<1))importFail('INVALID_IMPORT_SESSION_BATCH');}
      validateDurableCheckpoint(previous,next,uow.context.actorId,at);
      if(next.mapping&&next.source){
        const inventory=await this.verifySource(uow,row,next);sourceMapping(next,inventory);
        if(next.mapping.mappingRevisionId!==previous.mapping?.mappingRevisionId)delete next.sourceCorrections;
        if(next.importBatch)next.importBatch=bindSourceRows(next,inventory);
      }
      await this.saveCheckpoint(uow,row,next,uow.context.actorId);
      await this.consequence(uow,crypto,'IMPORT_SESSION',r.sessionId,r.requestId,'IMPORT_CHECKPOINT',null,{version:next.version},next.version);
      return {sessionId:r.sessionId,version:next.version,lifecycleState:next.lifecycleState};
    });
  }
  async readCheckpoint(token:string,scope:Scope,sessionId:string){return this.scoped(token,scope,false,async uow=>{
    const row=await this.header(uow,sessionId),checkpoint=await this.checkpointValue(uow,row);
    return {...checkpoint,version:Number(row.version),lifecycleState:row.state};
  });}
  async correctRows(token:string,scope:Scope,r:SessionCommand & {corrections:{sourceRowId:string;field:string;originalValue:unknown;correctedValue:string|number|null;reason:string}[]}){
    strict(r,['sessionId','requestId','expectedVersion','corrections']);assertSessionPayload(r.corrections);
    if(!Array.isArray(r.corrections)||!r.corrections.length||r.corrections.length>100)importFail('SOURCE_CORRECTION_INVALID');
    return this.run(token,scope,r,'SOURCE_CORRECTION',r,async(uow,_ids,crypto)=>{
      const row=await this.header(uow,r.sessionId);this.checkVersion(row,r.expectedVersion);
      if(!['RESOLUTION','REVIEW','INTENT_REVIEWED'].includes(row.state))importFail('IMPORT_REVIEW_STAGE_REQUIRED');
      if((await uow.query('SELECT 1 FROM import_executions WHERE company_id=$1 AND project_id=$2 AND session_id=$3',[uow.context.companyId,uow.context.projectId,row.id])).rowCount)importFail('IMPORT_EXECUTION_MANAGED');
      const previous=await this.checkpointValue(uow,row),inventory=await this.verifySource(uow,row,previous),mappingDigest=sourceMapping(previous,inventory);
      previous.importBatch=bindSourceRows(previous,inventory);
      const records=new Map<string,SourceCorrection>((previous.sourceCorrections||[]).map((c:SourceCorrection)=>[c.sourceRowId+'/'+c.field,c]));
      const seen=new Set<string>(),at=new Date().toISOString(),affected=new Map<string,Set<string>>();
      for(const c of r.corrections){
        strict(c,['sourceRowId','field','originalValue','correctedValue','reason']);
        if(!ROSTER_FIELDS.includes(c.field as any)||typeof c.reason!=='string'||!c.reason.trim()||c.reason.length>500
          ||c.correctedValue!==null&&!['string','number'].includes(typeof c.correctedValue)||String(c.correctedValue??'').length>8192)importFail('SOURCE_CORRECTION_INVALID');
        const key=c.sourceRowId+'/'+c.field,source=inventory.rows.find(v=>v.id===c.sourceRowId);
        if(!source||seen.has(key))importFail('SOURCE_CORRECTION_INVALID');seen.add(key);
        const original=mappedSource(source,previous.mapping.mappings)[c.field]??null;
        if(c.originalValue!==original)importFail('SOURCE_CORRECTION_INVALID');
        const corrected=mappedSource({...source,raw:{Correction:String(c.correctedValue??'')}},{Correction:c.field});
        if(corrected._invalidNumericFields?.length)importFail('SOURCE_CORRECTION_INVALID');
        records.set(key,{sourceRowId:c.sourceRowId,field:c.field,originalValue:original,correctedValue:corrected[c.field]??null,reason:c.reason.trim(),
          sourceRevisionId:previous.source.sourceRevisionId,mappingRevisionId:previous.mapping.mappingRevisionId,mappingDigest,approvedBy:uow.context.actorId,approvedAt:at});
        const family=c.field.startsWith('driver')?'driver':c.field.startsWith('material')?'material':c.field==='carrierName'?'carrier':'truck';
        if(!affected.has(source.id))affected.set(source.id,new Set());affected.get(source.id)!.add(family);
      }
      const next={...previous,sourceCorrections:[...records.values()].sort((a,b)=>(a.sourceRowId+'/'+a.field).localeCompare(b.sourceRowId+'/'+b.field)),
        lifecycleState:row.state==='INTENT_REVIEWED'?'REVIEW':row.state,version:Number(row.version)+1,invalidateReview:true,updatedAt:at,updatedBy:uow.context.actorId};
      next.importBatch=bindSourceRows(next,inventory,{rebuildCanonical:true});
      for(const value of next.importBatch.rows)for(const family of affected.get(value.sourceRowId)||[])if(value.entityResolutions)delete value.entityResolutions[family];
      validateDurableCheckpoint(previous,next,uow.context.actorId,at);await this.saveCheckpoint(uow,row,next,uow.context.actorId);
      await this.consequence(uow,crypto,'IMPORT_SESSION',r.sessionId,r.requestId,'IMPORT_SOURCE_CORRECTIONS_APPROVED',null,
        {correctionDigest:executionDigest(next.sourceCorrections),count:r.corrections.length},next.version);
      return {sessionId:r.sessionId,version:next.version,lifecycleState:next.lifecycleState};
    });
  }
  private async facts(uow:UnitOfWork,ids:CanonicalIdentityRepository,crypto:IdentityProtection,row:any,checkpoint:any,batch=checkpoint.importBatch){
    const inventory=await this.verifySource(uow,row,checkpoint);
    if(!checkpoint.mapping?.approved||checkpoint.mapping.sourceRevisionId!==checkpoint.source?.sourceRevisionId||!batch?.rows
      ||batch.source?.sourceType!==checkpoint.sourceType)importFail('INVALID_REVIEWED_INTENT_BINDING');
    const verified=bindSourceRows(checkpoint,inventory,{checkPrepared:true});
    // Verify the complete source inventory even when executing one sealed group.
    batch=batch===checkpoint.importBatch?verified:scopedExecutionBatch(verified,batch.rows.map((r:any)=>r.rowNumber));
    const current=await sqlImportContext(uow,ids,this.temporal(uow,ids,crypto,row.operation_id),batch);
    const actor={userId:uow.context.actorId,role:this.actorRoles.get(uow)!};
    const context=ImportProjectContextAdapter.createPipelineContext({relContext:current as any,projectId:batch.projectId,userId:actor.userId,role:actor.role,operationId:row.operation_id});
    const intent=buildRosterCanonicalIntent(batch,context);return {batch,current,actor,intent};
  }
  async preview(token:string,scope:Scope,sessionId:string){return this.scoped(token,scope,false,async(uow,crypto,ids)=>{
    this.budget(uow,SQL_IMPORT_LIMITS.reviewQueries);const row=await this.header(uow,sessionId);
    if(row.state!=='REVIEW')importFail('IMPORT_REVIEW_STAGE_REQUIRED');const cp=await this.checkpointValue(uow,row);
    if(cp.domain==='TRIP')importFail('U06_TRIP_AUTHORITY_REQUIRED');
    const {intent}=await this.facts(uow,ids,crypto,row,cp);return {intent,reviewedSignature:executionDigest(intent.signature),version:Number(row.version)};
  });}
  async review(token:string,scope:Scope,r:SessionCommand & {reviewedSignature:string;displacementApprovedSignature?:string;warningConfirmation?:boolean}){
    strict(r,['sessionId','requestId','expectedVersion','reviewedSignature','displacementApprovedSignature','warningConfirmation']);
    return this.run(token,scope,r,'REVIEW',r,async(uow,ids,crypto)=>{
      const row=await this.header(uow,r.sessionId);this.checkVersion(row,r.expectedVersion);if(row.state!=='REVIEW')importFail('IMPORT_REVIEW_STAGE_REQUIRED');
      const cp=await this.checkpointValue(uow,row);if(cp.domain==='TRIP')importFail('U06_TRIP_AUTHORITY_REQUIRED');
      const {intent}=await this.facts(uow,ids,crypto,row,cp);
      if(intent.blockers.length||!intent.rowDecisions.some(d=>d.status==='CONTRIBUTING')||executionDigest(intent.signature)!==r.reviewedSignature)importFail('REVIEWED_INTENT_STALE');
      if(intent.requiresDisplacementApproval&&r.displacementApprovedSignature!==r.reviewedSignature)importFail('DISPLACEMENT_APPROVAL_REQUIRED');
      if(intent.warnings.length&&r.warningConfirmation!==true)importFail('WARNING_APPROVAL_REQUIRED');
      const at=new Date().toISOString(),next={...cp,version:Number(row.version)+1,lifecycleState:'INTENT_REVIEWED',warningConfirmation:r.warningConfirmation===true,
        reviewedCanonicalIntent:{projectId:cp.projectId,importSessionId:cp.importSessionId,operationId:cp.operationId,importBatchId:cp.importBatchId,
          sourceRevisionId:cp.source.sourceRevisionId,mappingRevisionId:cp.mapping.mappingRevisionId,intent,acceptedSignature:intent.signature,
          ...(intent.requiresDisplacementApproval?{displacementApprovedSignature:intent.signature}:{})}};
      validateDurableCheckpoint(cp,next,uow.context.actorId,at);await this.saveCheckpoint(uow,row,next,uow.context.actorId);
      for(const decision of intent.rowDecisions)await uow.query(`INSERT INTO import_row_decisions(id,company_id,project_id,session_id,source_row_key,decision,resolved_ids,review_version,decision_encrypted)
        VALUES($1,$2,$3,$4,$5,$6,'{}',$7,$8)`,[randomUUID(),uow.context.companyId,uow.context.projectId,row.id,executionDigest([row.source_hash,decision.rowNumber]),decision.status,next.version,
          crypto.seal(decision,`${row.id}/decision/${next.version}/${decision.rowNumber}`)]);
      await this.consequence(uow,crypto,'IMPORT_SESSION',r.sessionId,r.requestId,'IMPORT_INTENT_REVIEWED',null,{signature:r.reviewedSignature},next.version);
      return {sessionId:r.sessionId,version:next.version,reviewedSignature:r.reviewedSignature};
    });
  }
  private binding(uow:UnitOfWork,crypto:IdentityProtection,row:any,signature:string){return crypto.digest('import-binding',[
    uow.context.companyId,uow.context.projectId,row.id,row.operation_id,row.checkpoint_artifact,row.source_hash,signature]).toString('hex');}
  private aad(uow:UnitOfWork,session:string,operation:string,key:string,kind:string){return `${uow.context.companyId}/${uow.context.projectId}/import/${session}/${operation}/${key}/${kind}`;}
  private async operation(uow:UnitOfWork,session:string,operation:string){
    if(!uuid(operation))importFail('INVALID_IMPORT_COMMAND');
    const row=(await uow.query(`SELECT * FROM import_executions WHERE company_id=$1 AND project_id=$2 AND session_id=$3 AND operation_id=$4 FOR UPDATE`,
      [uow.context.companyId,uow.context.projectId,session,operation])).rows[0];
    if(!row)importFail('IMPORT_EXECUTION_NOT_FOUND');return row;
  }
  private operationDto(row:any){version(Number(row.version));version(Number(row.fence),0);return {operationId:row.operation_id,state:row.state,version:Number(row.version),fence:Number(row.fence),
    groupCount:row.group_count,completedGroups:row.completed_groups,remainingGroups:row.group_count-row.completed_groups,
    failure:row.failure_code?{code:row.failure_code,retryable:row.state==='PARTIAL',reviewRequired:row.state==='REVIEW_REQUIRED'}:null};}
  async start(token:string,scope:Scope,r:SessionCommand & {operationId:string;reviewedSignature?:string}){
    strict(r,['sessionId','requestId','expectedVersion','operationId','reviewedSignature']);
    return this.run(token,scope,r,'START',r,async(uow,ids,crypto)=>{
      await this.lifecycle(uow,false);
      const row=await this.header(uow,r.sessionId);if(row.operation_id!==r.operationId)importFail('INVALID_REVIEWED_INTENT_BINDING');
      const binding=this.binding(uow,crypto,row,r.reviewedSignature||'U06_PENDING');
      const old=(await uow.query('SELECT * FROM import_executions WHERE company_id=$1 AND project_id=$2 AND session_id=$3 FOR UPDATE',
        [uow.context.companyId,uow.context.projectId,row.id])).rows[0];
      if(old){if(old.operation_id!==r.operationId||old.binding_hash!==binding||old.reviewed_signature!==(r.reviewedSignature||null)||Number(old.request_version)!==r.expectedVersion)importFail('EXECUTION_BINDING_CONFLICT');return this.operationDto(old);}
      this.checkVersion(row,r.expectedVersion);
      const cp=await this.checkpointValue(uow,row);
      if(cp.domain==='TRIP'){
        if(row.state!=='REVIEW'||r.reviewedSignature!==undefined)importFail('U06_TRIP_AUTHORITY_REQUIRED');
        await this.verifySource(uow,row,cp);
        const op=(await uow.query(`INSERT INTO import_executions(company_id,project_id,session_id,operation_id,binding_hash,reviewed_signature,state,version,fence,request_version,group_count,failure_code,created_by,updated_by)
          VALUES($1,$2,$3,$4,$5,NULL,'REVIEW_REQUIRED',1,0,$6,0,'U06_TRIP_AUTHORITY_REQUIRED',$7,$7) RETURNING *`,
          [uow.context.companyId,uow.context.projectId,row.id,r.operationId,binding,r.expectedVersion,uow.context.actorId])).rows[0];
        await uow.query(`UPDATE import_sessions SET state='FAILED_RECOVERABLE',version=version+1,updated_by=$1,updated_at=clock_timestamp() WHERE company_id=$2 AND project_id=$3 AND id=$4`,
          [uow.context.actorId,uow.context.companyId,uow.context.projectId,row.id]);
        await this.consequence(uow,crypto,'IMPORT_SESSION',r.sessionId,r.requestId,'IMPORT_DEPENDENCY_BLOCKED',null,{dependency:'AR2_U06'},1);
        return this.operationDto(op);
      }
      if(row.state!=='INTENT_REVIEWED'||row.reviewed_signature!==r.reviewedSignature||cp.reviewedCanonicalIntent?.acceptedSignature!==cp.reviewedCanonicalIntent?.intent?.signature)importFail('INVALID_REVIEWED_INTENT_BINDING');
      const facts=await this.facts(uow,ids,crypto,row,cp);
      if(executionDigest(facts.intent.signature)!==r.reviewedSignature)importFail('REVIEWED_INTENT_STALE');
      const groups=prepareExecutionGroups({...facts,reviewed:cp.reviewedCanonicalIntent},binding);
      if(!groups.length||groups.length>SQL_IMPORT_LIMITS.groups)importFail('IMPORT_GROUP_BUDGET');
      for(const group of groups)if(group.rows.length>SQL_IMPORT_LIMITS.groupRows||group.plan.entities.length>SQL_IMPORT_LIMITS.groupEntities
        ||group.consequences.length>SQL_IMPORT_LIMITS.groupConsequences||Buffer.byteLength(JSON.stringify(group))>SQL_IMPORT_LIMITS.groupBytes)importFail('IMPORT_GROUP_BUDGET');
      const op=(await uow.query(`INSERT INTO import_executions(company_id,project_id,session_id,operation_id,binding_hash,reviewed_signature,state,version,fence,request_version,group_count,created_by,updated_by)
        VALUES($1,$2,$3,$4,$5,$6,'READY',1,0,$7,$8,$9,$9) RETURNING *`,[uow.context.companyId,uow.context.projectId,row.id,r.operationId,binding,r.reviewedSignature,r.expectedVersion,groups.length,uow.context.actorId])).rows[0];
      for(const group of groups)await uow.query(`INSERT INTO import_execution_groups(id,company_id,project_id,session_id,operation_id,group_key,state,fence,version,plan_encrypted,plan_hash)
        VALUES($1,$2,$3,$4,$5,$6,'READY',0,1,$7,$8)`,[randomUUID(),uow.context.companyId,uow.context.projectId,row.id,r.operationId,group.id,
          crypto.seal(group,this.aad(uow,row.id,r.operationId,group.id,'plan')),executionDigest(group)]);
      await uow.query(`UPDATE import_sessions SET state='COMMITTING',version=version+1,updated_at=clock_timestamp(),updated_by=$1 WHERE company_id=$2 AND project_id=$3 AND id=$4`,
        [uow.context.actorId,uow.context.companyId,uow.context.projectId,row.id]);
      await this.consequence(uow,crypto,'IMPORT_SESSION',r.sessionId,r.requestId,'IMPORT_EXECUTION_STARTED',null,{binding,groups:groups.length},1);
      return this.operationDto(op);
    }).then(async()=> (await this.status(token,scope,r.sessionId,r.operationId,1)).operation);
  }
  async acquire(token:string,scope:Scope,r:SessionCommand & {operationId:string}){
    strict(r,['sessionId','requestId','expectedVersion','operationId']);
    return this.run(token,scope,r,'FENCE',r,async(uow,_ids,crypto)=>{
      await this.lifecycle(uow,false);const session=await this.header(uow,r.sessionId),op=await this.operation(uow,session.id,r.operationId);
      this.checkVersion(op,r.expectedVersion);if(!['READY','EXECUTING','PARTIAL'].includes(op.state))importFail('EXECUTION_NOT_RETRYABLE');
      const after=(await uow.query(`UPDATE import_executions SET state='EXECUTING',fence=fence+1,version=version+1,updated_by=$1,updated_at=clock_timestamp()
        WHERE company_id=$2 AND project_id=$3 AND session_id=$4 AND operation_id=$5 RETURNING *`,[uow.context.actorId,uow.context.companyId,uow.context.projectId,session.id,r.operationId])).rows[0];
      const group=(await uow.query(`SELECT group_key FROM import_execution_groups WHERE company_id=$1 AND project_id=$2 AND session_id=$3 AND operation_id=$4 AND state='READY' ORDER BY group_key LIMIT 1`,
        [uow.context.companyId,uow.context.projectId,session.id,r.operationId])).rows[0];
      if(!group)importFail('IMPORT_JOURNAL_INCONSISTENT');
      await this.consequence(uow,crypto,'IMPORT_SESSION',r.sessionId,r.requestId,'IMPORT_FENCE_ACQUIRED',null,{fence:Number(after.fence)},Number(after.version));
      return {...this.operationDto(after),groupId:group.group_key,bindingHash:after.binding_hash};
    });
  }
  /** Internal group command accepts only durable group identity, never a plan/write callback. */
  async commitNext(token:string,scope:Scope,r:{sessionId:string;operationId:string;groupId:string;fence:number;bindingHash:string}){
    strict(r,['sessionId','operationId','groupId','fence','bindingHash']);
    if(!external(r.sessionId)||!uuid(r.operationId)||!/^[0-9a-f]{64}$/.test(r.groupId)||!/^[0-9a-f]{64}$/.test(r.bindingHash))importFail('INVALID_IMPORT_COMMAND');version(r.fence);
    const requestId=groupOperation(r.bindingHash,r.groupId);
    return this.command(token,{...scope,operationId:requestId},{type:'IMPORT_GROUP',sessionId:r.sessionId,operationId:r.operationId,groupId:r.groupId,bindingHash:r.bindingHash},false,async(uow,ids,crypto)=>{
      const queries=this.budget(uow,SQL_IMPORT_LIMITS.groupQueries);await this.lifecycle(uow,false);
      const session=await this.header(uow,r.sessionId),op=await this.operation(uow,session.id,r.operationId);
      if(Number(op.fence)!==r.fence||op.state!=='EXECUTING')importFail('EXECUTION_FENCE_STALE');
      if(op.binding_hash!==r.bindingHash||op.binding_hash!==this.binding(uow,crypto,session,op.reviewed_signature))importFail('EXECUTION_BINDING_CONFLICT');
      const g=(await uow.query(`SELECT * FROM import_execution_groups WHERE company_id=$1 AND project_id=$2 AND session_id=$3 AND operation_id=$4 AND group_key=$5 FOR UPDATE`,
        [uow.context.companyId,uow.context.projectId,session.id,r.operationId,r.groupId])).rows[0];
      if(!g||g.state!=='READY')importFail('IMPORT_GROUP_NOT_PENDING');
      const group=crypto.open<ImportExecutionGroup>(g.plan_encrypted,this.aad(uow,session.id,r.operationId,r.groupId,'plan'));
      if(group.id!==r.groupId||executionDigest(group)!==g.plan_hash)importFail('IMPORT_PLAN_CORRUPT');
      const cp=await this.checkpointValue(uow,session),batch=scopedExecutionBatch(cp.importBatch,group.rows),facts=await this.facts(uow,ids,crypto,session,cp,batch);
      // The retained validator canonicalizes rebuilt entity order before comparing.
      // Displaced counterparts are appended by the builder; normalize the stored
      // comparison view too, while preserving the sealed original plan/group ID.
      validateRecoveryScope({...group,plan:{...group.plan,entities:[...group.plan.entities].sort((a:any,b:any)=>`${a.kind}:${a.key}`.localeCompare(`${b.kind}:${b.key}`))}},facts.intent,facts.current);
      const temporal=this.temporal(uow,ids,crypto,requestId),idMap:Record<string,string>={},canonicalEntities:{kind:string;id:string}[]=[];
      let createdIdentities=0,reusedConcurrentIdentities=0;
      for(const entity of group.plan.entities){
        if(entity.prepared){
          if(!['DRIVER','TRUCK'].includes(entity.kind)||!entity.plan||!entity.carrierId)importFail('PREPARED_ENTITY_CONFLICT');
          const kind=entity.kind as 'DRIVER'|'TRUCK',plan=entity.plan;
          const result=await this.createWithin(uow,ids,crypto,{...scope,operationId:requestId,...preparedIdentityInput(kind,plan)});
          assertPreparedProfile(kind,plan,result.identity);idMap[entity.key]=result.identity.externalId;
          if(result.created)createdIdentities++;else reusedConcurrentIdentities++;
          const spec=identitySpec(kind),m=(await uow.query(`SELECT revision FROM ${spec.member} WHERE company_id=$1 AND project_id=$2 AND ${spec.field}=$3`,
            [uow.context.companyId,uow.context.projectId,result.identity.id])).rows[0];
          await this.membershipWithin(uow,ids,crypto,{...scope,operationId:requestId,kind,entityId:result.identity.externalId,command:'ENROLL',expectedRevision:Number(m?.revision||0)});
          await temporal.affiliation(kind,result.identity.externalId,entity.carrierId,'SET_AFFILIATION');
        }
        canonicalEntities.push({kind:entity.kind,id:idMap[entity.key]||entity.key});
      }
      const assignments:any[]=[],allocations:any[]=[];
      for(const a of group.plan.assignmentIntents){const result=await temporal.assignment(idMap[a.driverId]||a.driverId,idMap[a.truckId]||a.truckId,a.action==='REASSIGN'?'REASSIGN':'ASSIGN');
        assignments.push({assignmentId:result.relationship.assignmentId,driverId:result.relationship.driverId,truckId:result.relationship.truckId,action:result.idempotent?'NO_CHANGE':a.action});}
      for(const a of group.plan.allocationIntents){const result=await temporal.allocation(idMap[a.truckId]||a.truckId,a.materialId,a.action==='REALLOCATE'?'REALLOCATE':'ALLOCATE');
        allocations.push({allocationId:result.relationship.allocationId,truckId:result.relationship.truckId,materialId:result.relationship.materialId,action:result.idempotent?'NO_CHANGE':a.action});}
      const at=(await uow.query('SELECT clock_timestamp()::text AS at')).rows[0].at;
      const receipt={projectId:cp.projectId,importSessionId:r.sessionId,operationId:r.operationId,groupId:r.groupId,bindingHash:op.binding_hash,fence:r.fence,
        reviewedSignature:op.reviewed_signature,sourceRevisionId:cp.source.sourceRevisionId,mappingRevisionId:cp.mapping.mappingRevisionId,
        importBatchId:cp.importBatchId,requestVersion:Number(op.request_version),committedVersion:Number(session.version)+1,committedAt:at,committedBy:uow.context.actorId,
        preparedIdentityMap:idMap,resultSummary:{canonicalEntities,contributingRows:group.rows.length,createdIdentities,reusedConcurrentIdentities,assignments,allocations}};
      if(Buffer.byteLength(JSON.stringify(receipt))>SQL_IMPORT_LIMITS.groupBytes)importFail('IMPORT_RECEIPT_BUDGET');
      await uow.query(`INSERT INTO import_execution_receipts(id,company_id,project_id,session_id,operation_id,group_key,result_hash,committed_at,receipt_encrypted,binding_hash,fence)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,[randomUUID(),uow.context.companyId,uow.context.projectId,session.id,r.operationId,r.groupId,executionDigest(receipt),at,
          crypto.seal(receipt,this.aad(uow,session.id,r.operationId,r.groupId,'receipt')),op.binding_hash,r.fence]);
      await uow.query(`UPDATE import_execution_groups SET state='COMMITTED',fence=$1,version=version+1 WHERE company_id=$2 AND project_id=$3 AND id=$4`,[r.fence,uow.context.companyId,uow.context.projectId,g.id]);
      const complete=op.completed_groups+1===op.group_count;
      await uow.query(`UPDATE import_executions SET completed_groups=completed_groups+1,state=$1,version=version+1,failure_code=NULL,updated_by=$2,updated_at=$3
        WHERE company_id=$4 AND project_id=$5 AND session_id=$6 AND operation_id=$7`,[complete?'COMPLETED':'PARTIAL',uow.context.actorId,at,uow.context.companyId,uow.context.projectId,session.id,r.operationId]);
      await uow.query(`UPDATE import_sessions SET state=$1,version=version+1,fence=$2,updated_by=$3,updated_at=$4 WHERE company_id=$5 AND project_id=$6 AND id=$7`,
        [complete?'COMMITTED':'COMMITTING',r.fence,uow.context.actorId,at,uow.context.companyId,uow.context.projectId,session.id]);
      await this.consequence(uow,crypto,'IMPORT_SESSION',r.sessionId,requestId,'IMPORT_GROUP_COMMITTED',null,{group:r.groupId,resultHash:executionDigest(receipt)},Number(op.version)+1);
      return {receipt,queries:queries()+1}; // Includes the enclosing idempotency-result UPDATE.
    });
  }
  async advance(token:string,scope:Scope,r:SessionCommand & {operationId:string}){
    const fence=await this.acquire(token,scope,r);
    try{await this.commitNext(token,scope,{sessionId:r.sessionId,operationId:r.operationId,groupId:fence.groupId,fence:fence.fence,bindingHash:fence.bindingHash});}
    catch(error:any){
      if(error.code==='EXECUTION_FENCE_STALE')return this.status(token,scope,r.sessionId,r.operationId);
      // A lost acknowledgment cannot override committed receipt truth.
      await this.scoped(token,scope,false,async(uow,crypto)=>{
        const session=await this.header(uow,r.sessionId),op=await this.operation(uow,session.id,r.operationId);
        if(Number(op.fence)!==fence.fence||op.state==='COMPLETED'||op.state==='CANCELLED')return;
        const committed=(await uow.query(`SELECT 1 FROM import_execution_receipts WHERE company_id=$1 AND project_id=$2 AND session_id=$3 AND operation_id=$4 AND group_key=$5`,
          [uow.context.companyId,uow.context.projectId,session.id,r.operationId,fence.groupId])).rowCount;
        if(committed)return;
        const code=typeof error.code==='string'&&/^[A-Z_]+$/.test(error.code)?error.code:'IMPORT_INFRASTRUCTURE_UNAVAILABLE';
        const retryable=error.status===503||['CANONICAL_CONCURRENCY_RETRY','SQL_AUTHORITY_UNAVAILABLE'].includes(code);
        await uow.query(`UPDATE import_executions SET state=$1,version=version+1,failure_code=$2,updated_by=$3,updated_at=clock_timestamp()
          WHERE company_id=$4 AND project_id=$5 AND session_id=$6 AND operation_id=$7`,[retryable?'PARTIAL':'REVIEW_REQUIRED',code,uow.context.actorId,uow.context.companyId,uow.context.projectId,session.id,r.operationId]);
        await uow.query(`UPDATE import_sessions SET state='FAILED_RECOVERABLE',version=version+1,updated_by=$1,updated_at=clock_timestamp() WHERE company_id=$2 AND project_id=$3 AND id=$4`,
          [uow.context.actorId,uow.context.companyId,uow.context.projectId,session.id]);
        await this.consequence(uow,crypto,'IMPORT_SESSION',r.sessionId,r.requestId,'IMPORT_EXECUTION_INTERRUPTED',null,{code,retryable},Number(op.version)+1);
      });
    }
    return this.status(token,scope,r.sessionId,r.operationId);
  }
  async cancel(token:string,scope:Scope,r:SessionCommand & {operationId:string}){
    strict(r,['sessionId','requestId','expectedVersion','operationId']);
    return this.run(token,scope,r,'CANCEL',r,async(uow,_ids,crypto)=>{
      const session=await this.header(uow,r.sessionId),op=await this.operation(uow,session.id,r.operationId);
      if(op.state==='CANCELLED')return this.operationDto(op);this.checkVersion(op,r.expectedVersion);if(op.state==='COMPLETED')importFail('EXECUTION_ALREADY_COMPLETED');
      const after=(await uow.query(`UPDATE import_executions SET state='CANCELLED',version=version+1,fence=fence+1,updated_by=$1,updated_at=clock_timestamp()
        WHERE company_id=$2 AND project_id=$3 AND session_id=$4 AND operation_id=$5 RETURNING *`,[uow.context.actorId,uow.context.companyId,uow.context.projectId,session.id,r.operationId])).rows[0];
      await uow.query(`UPDATE import_sessions SET state='CANCELLED',version=version+1,fence=$1,updated_by=$2,updated_at=clock_timestamp() WHERE company_id=$3 AND project_id=$4 AND id=$5`,
        [after.fence,uow.context.actorId,uow.context.companyId,uow.context.projectId,session.id]);
      await this.consequence(uow,crypto,'IMPORT_SESSION',r.sessionId,r.requestId,'IMPORT_EXECUTION_CANCELLED',null,{fence:Number(after.fence)},Number(after.version));
      return this.operationDto(after);
    });
  }
  async status(token:string,scope:Scope,sessionId:string,operationId:string,limit=50,cursor?:string){
    if(!external(sessionId)||!uuid(operationId)||!Number.isInteger(limit)||limit<1||limit>50)importFail('INVALID_IMPORT_COMMAND');
    return this.scoped(token,scope,false,async(uow,crypto)=>{
      const session=await this.header(uow,sessionId),op=await this.operation(uow,session.id,operationId);
      const proof=(await uow.query(`SELECT count(*)::int AS total,count(*) FILTER(WHERE state='COMMITTED')::int AS committed,
        count(*) FILTER(WHERE state='READY')::int AS pending,
        (SELECT count(*)::int FROM import_execution_receipts WHERE company_id=$1 AND project_id=$2 AND session_id=$3 AND operation_id=$4) AS receipts
        FROM import_execution_groups WHERE company_id=$1 AND project_id=$2 AND session_id=$3 AND operation_id=$4`,
        [uow.context.companyId,uow.context.projectId,session.id,operationId])).rows[0];
      if(proof.total!==op.group_count||proof.committed!==op.completed_groups||proof.receipts!==op.completed_groups
        ||proof.committed+proof.pending!==proof.total||op.state==='COMPLETED'&&op.completed_groups!==op.group_count)importFail('IMPORT_JOURNAL_INCONSISTENT');
      let after='';const cursorScope=JSON.stringify([uow.context.companyId,uow.context.projectId,uow.context.actorId,session.id,operationId,op.version,limit]);
      if(cursor){try{const decoded=crypto.open<{after:string}>(cursor,cursorScope);if(!/^[0-9a-f]{64}$/.test(decoded.after))throw Error();after=decoded.after;}catch{importFail('INVALID_IMPORT_STATUS_CURSOR');}}
      const rows=(await uow.query(`SELECT group_key,result_hash,receipt_encrypted FROM import_execution_receipts WHERE company_id=$1 AND project_id=$2 AND session_id=$3 AND operation_id=$4 AND group_key>$5 ORDER BY group_key LIMIT $6`,
        [uow.context.companyId,uow.context.projectId,session.id,operationId,after,limit+1])).rows;
      const receipts=rows.slice(0,limit).map(r=>{const value=crypto.open<any>(r.receipt_encrypted,this.aad(uow,session.id,operationId,r.group_key,'receipt'));
        if(executionDigest(value)!==r.result_hash)importFail('IMPORT_RECEIPT_CORRUPT');
        return {groupId:r.group_key,resultHash:r.result_hash,committedAt:value.committedAt,resultSummary:value.resultSummary};});
      const remaining=(await uow.query(`SELECT group_key FROM import_execution_groups WHERE company_id=$1 AND project_id=$2 AND session_id=$3 AND operation_id=$4 AND state='READY' ORDER BY group_key LIMIT $5`,
        [uow.context.companyId,uow.context.projectId,session.id,operationId,limit])).rows.map(r=>({groupId:r.group_key}));
      return {sessionId,lifecycleState:session.state,operation:this.operationDto(op),receipts,remaining,
        nextCursor:rows.length>limit?crypto.seal({after:rows[limit-1].group_key},cursorScope):null,hasMore:rows.length>limit,
        retryAllowed:['READY','PARTIAL','EXECUTING'].includes(op.state),reviewRequired:op.state==='REVIEW_REQUIRED',fullSnapshot:false};
    });
  }
}
