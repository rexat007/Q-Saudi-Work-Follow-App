import {open,lstat,realpath} from 'node:fs/promises';
import {isAbsolute,resolve} from 'node:path';
import {createPublicKey,verify as verifySignature,type KeyObject} from 'node:crypto';
import {readinessDigest,validateManifest,type RuntimeManifest,type ReadinessSource} from './runtimeReconciliation';
import {RUNTIME_INVENTORY_TABLES,type RuntimeInventoryTable} from './runtimeInventory';
import {stableValue} from './identityProtection';
import {sha} from './importArtifacts';
import {GlobalIdentityError} from '../utils/globalIdentityPolicy';

export interface FrozenSourceRecord {path:string;category:RuntimeInventoryTable;content:string}
export interface FrozenExportDocument {schemaVersion:1;sourceKind:RuntimeManifest['sourceKind'];ownerId:string;sourceId:string;generationId:string;watermark:string;companyId:string;projectId:string;records:FrozenSourceRecord[];coverage:Record<RuntimeInventoryTable,{complete:true;count:number}>;exceptions:string[];pendingCommands:Array<{id:string;state:string}>}
export interface FrozenMappingApproval {schemaVersion:1;approverId:string;approvalId:string;sourceDigest:string;active:true;approvedAt:string;expiresAt:string;schema:RuntimeManifest['schema'];mappings:Array<{sourcePath:string;sourceDigest:string;targets:Array<{table:RuntimeInventoryTable;key:string;canonicalJson:string}>}>}
export interface FrozenSourceHead {schemaVersion:1;ownerId:string;sourceId:string;generationId:string;watermark:string;sourceDigest:string;mappingApprovalId:string;active:true;issuedAt:string;expiresAt:string}
export interface FrozenExportOptions {sourcePath:string;mappingPath:string;headPath:string;ownerId:string;sourceId:string;mappingApproverId:string;ownerPublicKey:string;mappingPublicKey:string;companyId:string;projectId:string;now?:()=>number}
const fail=(code='SOURCE_APPROVAL_UNVERIFIED'):never=>{throw new GlobalIdentityError(code,'',409);};
const exact=(v:any,keys:string[])=>{if(!v||typeof v!=='object'||Array.isArray(v)||Object.keys(v).length!==keys.length||Object.keys(v).some(k=>!keys.includes(k)))fail();};
const label=(v:unknown,max=128):v is string=>typeof v==='string'&&v.length>0&&v.length<=max&&!/[\x00-\x1f]/.test(v);
const live=(start:unknown,end:unknown,now:number)=>typeof start==='string'&&typeof end==='string'&&Number.isFinite(Date.parse(start))&&Number.isFinite(Date.parse(end))&&Date.parse(start)<=now&&Date.parse(end)>now;
/** Trusted server configuration only. Read-only IO, independent Ed25519 approvals.
 * This adapter never reads SQL destination rows to manufacture its source oracle.
 * Mapped canonical JSON is independently approved export data, not browser input.
 */
export class ApprovedFrozenExportSource implements ReadinessSource {
 private readonly owner:KeyObject;private readonly mapper:KeyObject;private readonly options:FrozenExportOptions;
 constructor(options:FrozenExportOptions){
  this.options=Object.freeze({...options});
  try{this.owner=createPublicKey(options.ownerPublicKey);this.mapper=createPublicKey(options.mappingPublicKey);
   if(this.owner.asymmetricKeyType!=='ed25519'||this.mapper.asymmetricKeyType!=='ed25519'||this.owner.export({format:'der',type:'spki'}).equals(this.mapper.export({format:'der',type:'spki'}))||options.ownerId===options.mappingApproverId)fail();
   if(![options.ownerId,options.mappingApproverId,options.sourceId,options.companyId,options.projectId].every(v=>label(v)))fail();
   if(![options.sourcePath,options.mappingPath,options.headPath].every(p=>isAbsolute(p)))fail();
  }catch{fail('APPROVED_SOURCE_CONFIGURATION_REQUIRED');}
 }
 private async signed<T>(path:string,key:KeyObject):Promise<T>{
  try{
   // Explicit trusted filenames, no browser URLs, provider lookup or path guessing.
   const before=await lstat(path);if(!before.isFile()||before.isSymbolicLink()||before.size<1||before.size>16_000_000||(process.platform==='win32'?resolve(await realpath(path)).toLowerCase()!==resolve(path).toLowerCase():resolve(await realpath(path))!==resolve(path)))fail();
   const file=await open(path,'r');let parts:Buffer[]=[],length=0;
   try{for(;;){const part=Buffer.alloc(Math.min(65536,16_000_001-length)),n=await file.read(part);if(!n.bytesRead)break;length+=n.bytesRead;if(length>16_000_000)fail('SOURCE_EXPORT_LIMIT');parts.push(part.subarray(0,n.bytesRead));}const after=await file.stat();if(after.size!==before.size||after.mtimeMs!==before.mtimeMs||length!==before.size)fail('SOURCE_EXPORT_CHANGED');}finally{await file.close();}
   const envelope=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(Buffer.concat(parts)));exact(envelope,['payload','signature']);
   if(typeof envelope.signature!=='string'||!/^[A-Za-z0-9_-]{86}$/.test(envelope.signature))fail();
   const signature=Buffer.from(envelope.signature,'base64url');if(signature.toString('base64url')!==envelope.signature||!verifySignature(null,Buffer.from(JSON.stringify(stableValue(envelope.payload))),key,signature))fail();
   return envelope.payload;
  }catch(e:any){if(e instanceof GlobalIdentityError)throw e;fail('SOURCE_EXPORT_UNAVAILABLE');}
 }
 async read():Promise<RuntimeManifest>{
  const o=this.options,source=await this.signed<FrozenExportDocument>(o.sourcePath,this.owner),mapping=await this.signed<FrozenMappingApproval>(o.mappingPath,this.mapper),head=await this.signed<FrozenSourceHead>(o.headPath,this.owner),now=o.now?.()??Date.now();
  exact(source,['schemaVersion','sourceKind','ownerId','sourceId','generationId','watermark','companyId','projectId','records','coverage','exceptions','pendingCommands']);
  exact(mapping,['schemaVersion','approverId','approvalId','sourceDigest','active','approvedAt','expiresAt','schema','mappings']);
  exact(head,['schemaVersion','ownerId','sourceId','generationId','watermark','sourceDigest','mappingApprovalId','active','issuedAt','expiresAt']);
  const sourceDigest=readinessDigest(source);
  if(source.schemaVersion!==1||mapping.schemaVersion!==1||head.schemaVersion!==1||source.ownerId!==o.ownerId||head.ownerId!==o.ownerId||source.sourceId!==o.sourceId||head.sourceId!==o.sourceId||mapping.approverId!==o.mappingApproverId||source.companyId!==o.companyId||source.projectId!==o.projectId||!label(source.generationId)||!label(source.watermark)||!label(mapping.approvalId)||head.generationId!==source.generationId||head.watermark!==source.watermark||head.sourceDigest!==sourceDigest||mapping.sourceDigest!==sourceDigest||head.mappingApprovalId!==mapping.approvalId||head.active!==true||mapping.active!==true||!live(head.issuedAt,head.expiresAt,now)||!live(mapping.approvedAt,mapping.expiresAt,now))fail();
  if(!Array.isArray(source.records)||source.records.length>100000||!Array.isArray(mapping.mappings)||mapping.mappings.length!==source.records.length||!source.coverage||Object.keys(source.coverage).length!==RUNTIME_INVENTORY_TABLES.length||!Array.isArray(source.exceptions)||!Array.isArray(source.pendingCommands))fail('INCOMPLETE_RECONCILIATION_EVIDENCE');
  const sourceRows=new Map<string,FrozenSourceRecord>(),counts=new Map<string,number>(),tables=Object.fromEntries(RUNTIME_INVENTORY_TABLES.map(t=>[t,[]])) as unknown as RuntimeManifest['tables'],mapped=new Set<string>(),targetRows=new Map<string,string>();
  for(const row of source.records){exact(row,['path','category','content']);if(!label(row.path,2048)||!RUNTIME_INVENTORY_TABLES.includes(row.category)||sourceRows.has(row.path)||typeof row.content!=='string'||Buffer.byteLength(row.content)>262144)fail('INCOMPLETE_RECONCILIATION_EVIDENCE');sourceRows.set(row.path,row);counts.set(row.category,(counts.get(row.category)||0)+1);}
  for(const table of RUNTIME_INVENTORY_TABLES){const c=source.coverage[table];exact(c,['complete','count']);if(c.complete!==true||!Number.isSafeInteger(c.count)||c.count!==(counts.get(table)||0))fail('INCOMPLETE_RECONCILIATION_EVIDENCE');}
  for(const entry of mapping.mappings){exact(entry,['sourcePath','sourceDigest','targets']);const raw=sourceRows.get(entry.sourcePath);if(!raw||mapped.has(entry.sourcePath)||entry.sourceDigest!==sha(raw.content)||!Array.isArray(entry.targets)||!entry.targets.length||entry.targets.length>64)fail('SOURCE_MAPPING_UNVERIFIED');mapped.add(entry.sourcePath);
   for(const target of entry.targets){exact(target,['table','key','canonicalJson']);if(!RUNTIME_INVENTORY_TABLES.includes(target.table)||!label(target.key,2048)||typeof target.canonicalJson!=='string'||Buffer.byteLength(target.canonicalJson)>1_000_000)fail('SOURCE_MAPPING_UNVERIFIED');
    try{const value=JSON.parse(target.canonicalJson);if(!value||typeof value!=='object'||Array.isArray(value))fail('SOURCE_MAPPING_UNVERIFIED');}catch{fail('SOURCE_MAPPING_UNVERIFIED');}
    // Hash exact approved canonical bytes: never parse/re-encode historical money/weights.
    const id=target.table+'/'+target.key,hash=sha(target.canonicalJson),previous=targetRows.get(id);if(previous&&previous!==hash)fail('SOURCE_MAPPING_CONFLICT');if(!previous){targetRows.set(id,hash);tables[target.table].push({key:target.key,digest:hash});}
   }
  }
  if(mapped.size!==sourceRows.size)fail('SOURCE_MAPPING_UNVERIFIED');
  for(const table of RUNTIME_INVENTORY_TABLES)tables[table].sort((a,b)=>a.key<b.key?-1:a.key>b.key?1:0);
  let pending=0;for(const command of source.pendingCommands){exact(command,['id','state']);if(!label(command.id)||!['COMMITTED','UNKNOWN','LEGACY_UNORDERED','NOT_COMMITTED'].includes(command.state))fail('INCOMPLETE_RECONCILIATION_EVIDENCE');if(command.state!=='COMMITTED')pending++;}
  return validateManifest({schemaVersion:1,sourceKind:source.sourceKind,sourceWatermark:readinessDigest([source.ownerId,source.sourceId,source.generationId,source.watermark,sourceDigest,readinessDigest(head),sha(this.owner.export({format:'der',type:'spki'})),sha(this.mapper.export({format:'der',type:'spki'}))]),mappingApproval:mapping.approvalId+':'+readinessDigest(mapping),companyId:source.companyId,projectId:source.projectId,schema:mapping.schema,tables,exceptions:source.exceptions,pendingCommands:pending});
 }
 async verify(manifest:RuntimeManifest){try{return readinessDigest(await this.read())===readinessDigest(manifest);}catch{return false;}}
}
