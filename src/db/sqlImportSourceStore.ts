import {GlobalIdentityError} from '../utils/globalIdentityPolicy';
import {ImportArtifacts,sha,type ImportSourceStore,type ImportSourceProvenance,type ImportSourceReceipt} from './importArtifacts';
import {BoundedImportSourceRowVerifier} from './importSourceRows';
import {IdentityProtection,stableValue} from './identityProtection';
import type {UnitOfWork} from './unitOfWork';

const PROVIDER='POSTGRES_ENCRYPTED_CHUNKS_V1';
const fail=(code:string,status=409):never=>{throw new GlobalIdentityError(code,'',status);};
const digest=(value:unknown)=>sha(JSON.stringify(stableValue(value)));
const provenanceMac=(value:unknown)=>new IdentityProtection().digest('immutable-import-source',stableValue(value)).toString('hex');
/** Production provider for U05's existing bounded encrypted artifact backend.
 * No test-mode escape, external staging, public URL, second store or cloud credential.
 * The enclosing U05 transaction commits source, chunks, checkpoint and command receipt together.
 */
export class SqlImmutableImportSourceStore implements ImportSourceStore {
 private async scoped<T>(u:UnitOfWork,session:string,work:()=>Promise<T>):Promise<T>{
  try{
   if(!u.context.companyId||!u.context.projectId||!u.context.actorId)fail('SOURCE_ACCESS_DENIED',403);
   await u.query('SELECT * FROM qsa_authorize_canonical_command(false)');
   const row=(await u.query('SELECT id FROM import_sessions WHERE company_id=$1 AND project_id=$2 AND id=$3 FOR UPDATE',[u.context.companyId,u.context.projectId,session])).rows[0];
   if(!row)fail('SOURCE_ARTIFACT_NOT_FOUND',404);
   return await work();
  }catch(e:any){if(e instanceof GlobalIdentityError||e?.code==='42501')throw e;fail('SOURCE_STORAGE_UNAVAILABLE',503);}
 }
 private selection(proof:ImportSourceProvenance){
  if(!['CSV','EXCEL'].includes(proof.sourceType))fail('SOURCE_FORMAT_UNSUPPORTED',422);
  if(!/^[A-Za-z0-9_-]{1,128}$/.test(proof.sourceRevisionId))fail('SOURCE_REVISION_REQUIRED',422);
  const m=proof.metadata;
  if(!m||Object.keys(m).some(k=>!['fileName','mimeType','sheetName','headerRowIndex'].includes(k)))fail('SOURCE_METADATA_INVALID',422);
  if(typeof m.fileName!=='string'||!m.fileName||m.fileName.length>255||/[\\/\x00-\x1f]/.test(m.fileName))fail('SOURCE_METADATA_INVALID',422);
  const excel=proof.sourceType==='EXCEL',extension=excel?/\.xlsx$/i:/\.csv$/i;
  if(!extension.test(String(m.fileName))||typeof m.mimeType!=='string'||!(excel?['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/octet-stream']:['text/csv','application/csv','text/plain','application/octet-stream']).includes(m.mimeType))fail('SOURCE_FORMAT_UNSUPPORTED',422);
  const headerRowIndex=m.headerRowIndex??0;
  if(!Number.isSafeInteger(headerRowIndex)||Number(headerRowIndex)<0||Number(headerRowIndex)>100)fail('SOURCE_HEADER_INVALID',422);
  if(excel&&(typeof m.sheetName!=='string'||!m.sheetName||m.sheetName.length>255))fail('SOURCE_SELECTION_REQUIRED',422);
  if(!excel&&m.sheetName!==undefined)fail('SOURCE_SELECTION_REQUIRED',422);
  return {rowFormat:(excel?'XLSX':'CSV_UTF8') as 'XLSX'|'CSV_UTF8',headerRowIndex:Number(headerRowIndex),...(excel?{sheetName:String(m.sheetName)}:{})};
 }
 async put(u:UnitOfWork,session:string,bytes:Buffer,provenance:ImportSourceProvenance):Promise<ImportSourceReceipt>{return this.scoped(u,session,async()=>{
  if(!Buffer.isBuffer(bytes)||!bytes.length||bytes.length>2_000_000)fail('SOURCE_SIZE_LIMIT',413);
  const selection=this.selection(provenance),contentSha256=sha(bytes),binding={schemaVersion:1,provider:PROVIDER,companyId:u.context.companyId,projectId:u.context.projectId,sessionId:session,revision:provenance.sourceRevisionId,sourceType:provenance.sourceType,contentSha256,selection,metadataDigest:digest(provenance.metadata),uploadedBy:u.context.actorId};
  // Validate the retained parser contract before any source artifact is staged.
  new BoundedImportSourceRowVerifier().read(bytes,{sourceType:provenance.sourceType,sourceRevisionId:provenance.sourceRevisionId,providerSnapshot:selection});
  const previous=(await u.query("SELECT id,manifest FROM import_source_artifacts WHERE company_id=$1 AND project_id=$2 AND session_id=$3 AND artifact_kind='SOURCE' AND manifest->'sourceProof'->>'revision'=$4 LIMIT 2",[u.context.companyId,u.context.projectId,session,provenance.sourceRevisionId])).rows;
  let artifactId:string;
  if(previous.length){
   if(previous.length!==1||previous[0].manifest.sourceProof.bindingDigest!==provenanceMac(binding))fail('IMMUTABLE_SOURCE_REVISION');
   artifactId=previous[0].id;if(sha(await this.bytes(u,session,artifactId))!==contentSha256)fail('SOURCE_ARTIFACT_CORRUPT');
  }else artifactId=await new ImportArtifacts(u).write(session,'SOURCE',{base64:bytes.toString('base64')},{...binding,bindingDigest:provenanceMac(binding)});
  return {artifactId,contentSha256,sourceType:provenance.sourceType,sourceRevisionId:provenance.sourceRevisionId,provider:PROVIDER,...selection};
 });}
 private async bytes(u:UnitOfWork,session:string,id:string){
  const header=(await u.query("SELECT object_uri,manifest FROM import_source_artifacts WHERE company_id=$1 AND project_id=$2 AND session_id=$3 AND id=$4 AND artifact_kind='SOURCE'",[u.context.companyId,u.context.projectId,session,id])).rows[0];
  if(!header)fail('SOURCE_ARTIFACT_NOT_FOUND',404);
  const proof=header.manifest?.sourceProof;
  if(!proof||proof.provider!==PROVIDER||proof.companyId!==u.context.companyId||proof.projectId!==u.context.projectId||proof.sessionId!==session||header.object_uri!==`sql-source-v1://${id}`)fail('SOURCE_PROVENANCE_UNVERIFIED');
  const {bindingDigest,...binding}=proof;
  if(!binding.uploadedBy||bindingDigest!==provenanceMac(binding))fail('SOURCE_ARTIFACT_CORRUPT');
  const value=await new ImportArtifacts(u).read(session,id,'SOURCE');
  if(typeof value.base64!=='string')fail('SOURCE_ARTIFACT_CORRUPT');
  const bytes=Buffer.from(value.base64,'base64');
  if(!bytes.length||bytes.length>2_000_000||bytes.toString('base64')!==value.base64||sha(bytes)!==proof.contentSha256)fail('SOURCE_ARTIFACT_CORRUPT');
  return bytes;
 }
 async get(u:UnitOfWork,session:string,id:string){return this.scoped(u,session,()=>this.bytes(u,session,id));}
}
