import {GlobalIdentityError} from '../utils/globalIdentityPolicy';
import {randomUUID} from 'node:crypto';
import {SqlCanonicalAuthority,type Scope,type SqlAuthorityDependencies} from './canonicalAuthority';
import {RUNTIME_INVENTORY_TABLES} from './runtimeInventory';
import {readinessDigest,validateManifest,type ReadinessSource} from './runtimeReconciliation';
const fail=(code:string):never=>{throw new GlobalIdentityError(code,'',409);};
/** Durable read-only comparison of existing history. Never repairs/migrates domain rows. */
export class SqlRuntimeReadinessAuthority extends SqlCanonicalAuthority {
 constructor(deps:SqlAuthorityDependencies,private readonly source:ReadinessSource){super(deps);}
 private async evidence(scope:Scope){const m=validateManifest(await this.source.read());if(m.companyId!==scope.companyId||m.projectId!==scope.projectId||!await this.source.verify(m))fail('SOURCE_APPROVAL_UNVERIFIED');return m;}
 async start(token:string,scope:Scope){const m=await this.evidence(scope);return this.scoped(token,scope,true,async uow=>{
  const schema=(await uow.query('SELECT * FROM qsa_readiness_schema()')).rows;
  if(readinessDigest(schema)!==readinessDigest(m.schema))fail('SCHEMA_COVERAGE_MISMATCH');
  if(Number((await uow.query('SELECT qsa_readiness_pending_receipts() AS count')).rows[0].count)!==0)fail('PENDING_RECEIPTS');
  const revisions={scopes:(await uow.query('SELECT qsa_readiness_revisions() AS value')).rows[0].value,epoch:(await uow.query('SELECT * FROM qsa_read_runtime_state()')).rows[0]},id=randomUUID();
  await uow.query(`INSERT INTO runtime_readiness_runs(id,company_id,project_id,actor_id,manifest_digest,source_watermark,target_revisions,state) VALUES($1,$2,$3,$4,$5,$6,$7,'RUNNING')`,[id,uow.context.companyId,uow.context.projectId,uow.context.actorId,readinessDigest(m),m.sourceWatermark,revisions]);return {runId:id,state:'RUNNING',productionCutoverAuthorized:false};
 });}
 async advance(token:string,scope:Scope,runId:string,requestId:string,expectedVersion:number){
  if(![runId,requestId].every(v=>/^[0-9a-f-]{36}$/.test(v))||!Number.isSafeInteger(expectedVersion)||expectedVersion<1)fail('INVALID_READINESS_REQUEST');
  const m=await this.evidence(scope);return this.scoped(token,scope,true,async uow=>{
   const row=(await uow.query('SELECT * FROM runtime_readiness_runs WHERE id=$1 AND company_id=$2 AND project_id=$3 FOR UPDATE',[runId,uow.context.companyId,uow.context.projectId])).rows[0];
   if(!row||row.actor_id!==uow.context.actorId)fail('READINESS_RUN_NOT_FOUND');
   const revisions={scopes:(await uow.query('SELECT qsa_readiness_revisions() AS value')).rows[0].value,epoch:(await uow.query('SELECT * FROM qsa_read_runtime_state()')).rows[0]};
   const changed=row.manifest_digest!==readinessDigest(m)||readinessDigest(row.target_revisions)!==readinessDigest(revisions);
   if(changed){await uow.query("UPDATE runtime_readiness_runs SET state='BLOCKED',last_error_code='RECONCILIATION_BOUNDARY_CHANGED' WHERE id=$1",[runId]);return {state:'BLOCKED',code:'RECONCILIATION_BOUNDARY_CHANGED',productionCutoverAuthorized:false};}
   const requestDigest=readinessDigest([runId,expectedVersion]),previous=(await uow.query('SELECT request_digest,result FROM runtime_readiness_pages WHERE run_id=$1 AND request_id=$2',[runId,requestId])).rows[0];
   if(previous){if(previous.request_digest!==requestDigest)fail('IDEMPOTENCY_PAYLOAD_MISMATCH');return previous.result;}
   if(row.state!=='RUNNING'||Number(row.version)!==expectedVersion)fail('READINESS_VERSION_CONFLICT');
   const table=RUNTIME_INVENTORY_TABLES[row.table_position],expected=m.tables[table].filter(r=>!row.after_key||r.key>row.after_key).slice(0,50);
   const actual=(await uow.query('SELECT * FROM qsa_readiness_inventory($1,$2,50)',[table,row.after_key])).rows.map(r=>({key:r.row_key,digest:r.row_digest}));
   const matches=readinessDigest(expected)===readinessDigest(actual),complete=actual.length<50,position=Number(row.table_position)+(complete?1:0),state=!matches?'BLOCKED':position===RUNTIME_INVENTORY_TABLES.length?'VERIFIED':'RUNNING',version=Number(row.version)+1;
   const result={runId,state,version,verifiedRows:Number(row.verified_rows)+(matches?actual.length:0),table,sourceKind:m.sourceKind,dataReconciliationReady:state==='VERIFIED'&&m.sourceKind==='APPROVED_FROZEN_EXPORT',productionCutoverAuthorized:false,...(!matches?{code:'INVENTORY_MISMATCH'}:{})};
   await uow.query('UPDATE runtime_readiness_runs SET state=$2,version=$3,table_position=$4,after_key=$5,verified_rows=$6,last_error_code=$7 WHERE id=$1',[runId,state,version,position,complete?null:actual.at(-1)?.key,result.verifiedRows,matches?null:'INVENTORY_MISMATCH']);
   await uow.query('INSERT INTO runtime_readiness_pages(id,company_id,project_id,run_id,request_id,request_digest,result) VALUES($1,$2,$3,$4,$5,$6,$7)',[randomUUID(),uow.context.companyId,uow.context.projectId,runId,requestId,requestDigest,result]);return result;
  });
 }
}
