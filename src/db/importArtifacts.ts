import {randomUUID,createHash} from 'node:crypto';
import type {UnitOfWork} from './unitOfWork.js';
import {IdentityProtection} from './identityProtection.js';
import {encodeSessionChunks,decodeSessionChunks} from '../services/import/sessionArtifactCodec';
import {GlobalIdentityError} from '../utils/globalIdentityPolicy';
import {assertSessionPayload} from '../services/import/durableSessionContract';
export const importFail=(code:string):never=>{throw new GlobalIdentityError(code,'',code.endsWith('_UNAVAILABLE')?503:409);};
export const sha=(bytes:string|Buffer)=>createHash('sha256').update(bytes).digest('hex');
export const IMPORT_ARTIFACT_BYTES=8_000_000;
export interface ImportSourceProvenance {sourceType:string;sourceRevisionId:string;metadata:Record<string,unknown>}
export interface ImportSourceReceipt {artifactId:string;contentSha256:string;sourceType:string;sourceRevisionId:string;provider:string;
  rowFormat?:'CSV_UTF8'|'XLSX';sheetName?:string;headerRowIndex?:number}
/** Bounded immutable-source port. Trusted SQL composition supplies the production backend. */
export interface ImportSourceStore {
  /** A real provider verifies remote ownership, format, header/sheet selection and immutable bytes before issuing this receipt. */
  put(uow:UnitOfWork,session:string,bytes:Buffer,provenance:ImportSourceProvenance):Promise<ImportSourceReceipt>;
  get(uow:UnitOfWork,session:string,id:string):Promise<Buffer>;
}
export class UnavailableImportSourceStore implements ImportSourceStore {
  async put():Promise<ImportSourceReceipt>{return importFail('SOURCE_STORAGE_UNAVAILABLE');}
  async get():Promise<Buffer>{return importFail('SOURCE_STORAGE_UNAVAILABLE');}
}
/** Durable encrypted SQL adapter is explicitly restricted to isolated tests.
 * A real provider must verify immutable bytes, scoped ownership and availability.
 */
export class IsolatedSqlImportSourceStore implements ImportSourceStore {
  constructor(){if(process.env.NODE_ENV!=='test'||process.env.QSA_TEST_DATABASE_ISOLATED!=='1')throw Error('ISOLATED_SOURCE_ADAPTER_REQUIRED');}
  async put(uow:UnitOfWork,session:string,bytes:Buffer,proof:ImportSourceProvenance):Promise<ImportSourceReceipt>{
    if(!bytes.length||bytes.length>2_000_000)importFail('SOURCE_SIZE_LIMIT');
    const artifactId=await new ImportArtifacts(uow).write(session,'SOURCE',{base64:bytes.toString('base64')});
    const rowFormat=proof.sourceType==='CSV'?'CSV_UTF8':proof.sourceType==='EXCEL'?'XLSX':proof.metadata.rowFormat;
    if(rowFormat!=='CSV_UTF8'&&rowFormat!=='XLSX')importFail('SOURCE_VERIFICATION_UNAVAILABLE');
    return {artifactId,contentSha256:sha(bytes),sourceType:proof.sourceType,sourceRevisionId:proof.sourceRevisionId,provider:'ISOLATED_SQL_TEST',
      rowFormat:rowFormat as 'CSV_UTF8'|'XLSX',sheetName:proof.sourceType==='GOOGLE_SHEETS'?String(proof.metadata.sheetTitle):typeof proof.metadata.sheetName==='string'?proof.metadata.sheetName:undefined,
      headerRowIndex:proof.metadata.headerRowIndex===undefined?0:Number(proof.metadata.headerRowIndex)};
  }
  async get(uow:UnitOfWork,session:string,id:string){
    const value=await new ImportArtifacts(uow).read(session,id,'SOURCE');
    if(typeof value.base64!=='string')importFail('SOURCE_ARTIFACT_CORRUPT');
    const bytes=Buffer.from(value.base64,'base64');if(!bytes.length||bytes.length>2_000_000)importFail('SOURCE_SIZE_LIMIT');return bytes;
  }
}
export class ImportArtifacts {
  private readonly crypto=new IdentityProtection();
  constructor(private readonly uow:UnitOfWork){}
  private aad(session:string,id:string,index:number){return `${this.uow.context.companyId}/${this.uow.context.projectId}/import/${session}/${id}/${index}`;}
  async write(session:string,kind:'SOURCE'|'CHECKPOINT',value:unknown,sourceProof?:Record<string,unknown>){
    assertSessionPayload(value);if(Buffer.byteLength(JSON.stringify(value))>IMPORT_ARTIFACT_BYTES)importFail('IMPORT_ARTIFACT_LIMIT');
    const chunks=encodeSessionChunks(value),length=chunks.reduce((n,c)=>n+Buffer.byteLength(c),0);
    if(chunks.length>256||length>IMPORT_ARTIFACT_BYTES)importFail('IMPORT_ARTIFACT_LIMIT');
    const id=randomUUID(),digest=sha(chunks.join(''));
    await this.uow.query(`INSERT INTO import_source_artifacts(id,company_id,project_id,session_id,artifact_kind,content_sha256,object_uri,manifest,byte_length)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`,[id,this.uow.context.companyId,this.uow.context.projectId,session,kind,digest,
      kind==='SOURCE'?(sourceProof?`sql-source-v1://${id}`:`isolated-sql://${id}`):`sql-checkpoint://${id}`,{count:chunks.length,digest,...(sourceProof?{sourceProof}:{})},length]);
    for(let index=0;index<chunks.length;index++)await this.uow.query(`INSERT INTO import_artifact_chunks
      (company_id,project_id,session_id,artifact_id,chunk_index,content_sha256,content_encrypted) VALUES($1,$2,$3,$4,$5,$6,$7)`,
      [this.uow.context.companyId,this.uow.context.projectId,session,id,index,sha(chunks[index]),this.crypto.seal(chunks[index],this.aad(session,id,index))]);
    return id;
  }
  async read(session:string,id:string,kind:'SOURCE'|'CHECKPOINT'){
    const scope=[this.uow.context.companyId,this.uow.context.projectId,session,id];
    const header=(await this.uow.query(`SELECT * FROM import_source_artifacts WHERE company_id=$1 AND project_id=$2 AND session_id=$3 AND id=$4`,scope)).rows[0];
    if(!header||header.artifact_kind!==kind||!Number.isInteger(header.manifest?.count)||header.manifest.count<1||header.manifest.count>256
      ||Number(header.byte_length)<1||Number(header.byte_length)>IMPORT_ARTIFACT_BYTES)importFail('IMPORT_ARTIFACT_INVALID');
    const sizes=(await this.uow.query(`SELECT count(*)::int AS count,sum(octet_length(content_encrypted)) AS bytes FROM import_artifact_chunks
      WHERE company_id=$1 AND project_id=$2 AND session_id=$3 AND artifact_id=$4`,scope)).rows[0];
    if(sizes.count!==header.manifest.count)importFail('IMPORT_ARTIFACT_INCOMPLETE');
    if(Number(sizes.bytes)>IMPORT_ARTIFACT_BYTES*1.5+header.manifest.count*512)importFail('IMPORT_ARTIFACT_LIMIT');
    const rows=(await this.uow.query(`SELECT chunk_index,content_sha256,content_encrypted FROM import_artifact_chunks
      WHERE company_id=$1 AND project_id=$2 AND session_id=$3 AND artifact_id=$4 ORDER BY chunk_index LIMIT 257`,scope)).rows;
    if(rows.length!==header.manifest.count)importFail('IMPORT_ARTIFACT_INCOMPLETE');
    const chunks=rows.map((r,index)=>{
      if(r.chunk_index!==index)importFail('IMPORT_ARTIFACT_INCOMPLETE');
      const text=this.crypto.open<string>(r.content_encrypted,this.aad(session,id,index));if(sha(text)!==r.content_sha256)importFail('IMPORT_ARTIFACT_CORRUPT');return text;
    });
    if(chunks.reduce((n,c)=>n+Buffer.byteLength(c),0)!==Number(header.byte_length)||sha(chunks.join(''))!==header.content_sha256||header.content_sha256!==header.manifest.digest)importFail('IMPORT_ARTIFACT_CORRUPT');
    return decodeSessionChunks(chunks);
  }
}
