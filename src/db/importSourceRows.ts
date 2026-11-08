import {inflateRawSync} from 'node:zlib';
import {CsvImportParser} from '../services/import/csvParser.service';
import {ExcelImportParser} from '../services/import/excelParser.service';
import {DriverTruckImportNormalizer} from '../services/import/rosterValueNormalizer';
import {normalizeName,normalizePhone,normalizeIdNumber,normalizePlate} from '../utils/normalization';
import {stableExecution} from '../services/import/rosterExecutionPlan.server';
import {sha,importFail} from './importArtifacts.js';
import type {DriverTruckCanonicalMappingTarget} from '../services/import/driverTruckImport';

export const SOURCE_ROW_CONTRACT='SQL_SOURCE_ROWS_V1';
export const ROSTER_FIELDS=['driverName','driverPhone','driverIdentity','truckPlate','truckType','carrierName','materialName','materialCode','tareWeightKg','maxGrossWeightKg'] as const;
export interface SourceRow {id:string;ordinal:number;physicalRow:number;raw:Record<string,string>}
export interface SourceInventory {contract:string;digest:string;headers:string[];columnsDigest:string;sourceType:string;sheetName?:string;rows:SourceRow[]}
export interface ImportSourceRowVerifier {read(bytes:Buffer,source:any):SourceInventory}
const same=(a:unknown,b:unknown)=>stableExecution(a)===stableExecution(b);

/** Vet XLSX ZIP expansion before the retained workbook parser allocates XML.
 * ZIP64, encrypted/unsupported compression, malformed offsets and large expansion
 * fail closed. No files are extracted; each deflate stream has a hard output cap.
 */
function boundedXlsx(bytes:Buffer){
  if(bytes.readUInt32LE(0)!==0x04034b50)importFail('SOURCE_FORMAT_UNSUPPORTED');
  let end=-1;for(let p=bytes.length-22;p>=Math.max(0,bytes.length-65557);p--){if(bytes.readUInt32LE(p)===0x06054b50){end=p;break;}}
  if(end<0||bytes.readUInt16LE(end+4)||bytes.readUInt16LE(end+6))importFail('SOURCE_FORMAT_UNSUPPORTED');
  const count=bytes.readUInt16LE(end+10),offset=bytes.readUInt32LE(end+16),size=bytes.readUInt32LE(end+12);
  if(!count||count>256||offset+size!==end||bytes.readUInt16LE(end+8)!==count||end+22+bytes.readUInt16LE(end+20)!==bytes.length)importFail('SOURCE_PARSE_LIMIT');
  let p=offset,total=0;const names=new Set<string>(),ranges:[number,number][]=[];
  for(let i=0;i<count;i++){
    if(p+46>end||bytes.readUInt32LE(p)!==0x02014b50)importFail('SOURCE_FORMAT_UNSUPPORTED');
    const flags=bytes.readUInt16LE(p+8),method=bytes.readUInt16LE(p+10),packed=bytes.readUInt32LE(p+20),expanded=bytes.readUInt32LE(p+24);
    const n=bytes.readUInt16LE(p+28),extra=bytes.readUInt16LE(p+30),comment=bytes.readUInt16LE(p+32),local=bytes.readUInt32LE(p+42);
    if(flags&~(0x800|8)||![0,8].includes(method)||expanded>8_000_000||p+46+n+extra+comment>end||local+30>offset)importFail('SOURCE_PARSE_LIMIT');
    const name=bytes.subarray(p+46,p+46+n).toString('utf8');
    if(!n||n>256||names.has(name)||name.includes('..')||name.includes('\\')||name.startsWith('/'))importFail('SOURCE_FORMAT_UNSUPPORTED');names.add(name);
    if(bytes.readUInt32LE(local)!==0x04034b50||bytes.readUInt16LE(local+8)!==method||bytes.readUInt16LE(local+6)!==flags)importFail('SOURCE_FORMAT_UNSUPPORTED');
    const ln=bytes.readUInt16LE(local+26),le=bytes.readUInt16LE(local+28),start=local+30+ln+le;
    if(start+packed>offset||!bytes.subarray(local+30,local+30+ln).equals(bytes.subarray(p+46,p+46+n)))importFail('SOURCE_FORMAT_UNSUPPORTED');
    let dataEnd=start+packed;
    if(flags&8){
      const descriptor=dataEnd+(bytes.readUInt32LE(dataEnd)===0x08074b50?4:0);
      if(descriptor+12>offset||bytes.readUInt32LE(descriptor)!==bytes.readUInt32LE(p+16)
        ||bytes.readUInt32LE(descriptor+4)!==packed||bytes.readUInt32LE(descriptor+8)!==expanded)importFail('SOURCE_FORMAT_UNSUPPORTED');dataEnd=descriptor+12;
    }else if(bytes.readUInt32LE(local+18)!==packed||bytes.readUInt32LE(local+22)!==expanded||bytes.readUInt32LE(local+14)!==bytes.readUInt32LE(p+16))importFail('SOURCE_FORMAT_UNSUPPORTED');
    if(ranges.some(([a,b])=>local<b&&dataEnd>a))importFail('SOURCE_FORMAT_UNSUPPORTED');ranges.push([local,dataEnd]);
    const raw=method===0?bytes.subarray(start,start+packed):inflateRawSync(bytes.subarray(start,start+packed),{maxOutputLength:8_000_000-total});
    total+=raw.length;if(raw.length!==expanded||total>8_000_000)importFail('SOURCE_PARSE_LIMIT');p+=46+n+extra+comment;
  }
  if(p!==end||!names.has('[Content_Types].xml')||!names.has('xl/workbook.xml'))importFail('SOURCE_FORMAT_UNSUPPORTED');
}

/** Explicit trusted adapters: CSV, XLSX and provider-attested CSV/XLSX snapshots.
 * Remote source identifiers are never fetched here; only immutable receipt bytes.
 */
export class BoundedImportSourceRowVerifier implements ImportSourceRowVerifier {
  read(bytes:Buffer,source:any):SourceInventory{
    try{
      if(!bytes.length||bytes.length>2_000_000)importFail('SOURCE_PARSE_LIMIT');
      const receipt=source.providerSnapshot;
      const format=source.sourceType==='CSV'?'CSV_UTF8':source.sourceType==='EXCEL'?'XLSX':receipt?.rowFormat;
      if(!['CSV','EXCEL','GOOGLE_SHEETS','GOOGLE_DRIVE'].includes(source.sourceType)||!['CSV_UTF8','XLSX'].includes(format))importFail('SOURCE_VERIFICATION_UNAVAILABLE');
      const headerRowIndex=receipt?.headerRowIndex??0;
      if(!Number.isInteger(headerRowIndex)||headerRowIndex<0||headerRowIndex>100)importFail('SOURCE_HEADER_INVALID');
      const sheetName=receipt?.sheetName;
      if(source.sourceType==='GOOGLE_SHEETS'&&(!sheetName||sheetName!==source.remote?.sheetTitle))importFail('SOURCE_SELECTION_REQUIRED');
      if(format==='XLSX'&&(typeof sheetName!=='string'||!sheetName))importFail('SOURCE_SELECTION_REQUIRED');
      const descriptor={sourceType:source.sourceType,importBatchId:'source-proof',sourceSheetName:sheetName};
      const parsed=format==='CSV_UTF8'?new CsvImportParser().parse(descriptor,new TextDecoder('utf-8',{fatal:true}).decode(bytes),{roster:true,headerRowIndex}):
        (boundedXlsx(bytes),new ExcelImportParser().parse(descriptor,bytes,{roster:true,headerRowIndex,sheetName}));
      if(!parsed.rows.length||!parsed.headers.length||parsed.headers.some(h=>['__proto__','constructor','prototype'].includes(h)))importFail('SOURCE_HEADER_INVALID');
      const columnsDigest=sha(stableExecution({format,sheetName,headerRowIndex,headers:parsed.headers})),hash=sha(bytes);
      const rows=parsed.rows.map((value,index)=>{
        const physicalRow=value._sourceRowIndex,raw=Object.fromEntries(parsed.headers.map(h=>[h,String(value[h]??'')]));
        if(!Number.isSafeInteger(physicalRow)||physicalRow<1||Object.values(raw).some(v=>v.length>8192))importFail('SOURCE_PARSE_LIMIT');
        return {ordinal:index+1,physicalRow,raw,id:sha(stableExecution([SOURCE_ROW_CONTRACT,hash,source.sourceRevisionId,columnsDigest,physicalRow,raw]))};
      });
      return {contract:SOURCE_ROW_CONTRACT,sourceType:source.sourceType,sheetName,headers:parsed.headers,columnsDigest,rows,
        digest:sha(stableExecution({contract:SOURCE_ROW_CONTRACT,hash,revision:source.sourceRevisionId,columnsDigest,rows:rows.map(r=>r.id)}))};
    }catch(error:any){if(error?.code&&/^SOURCE_/.test(error.code))throw error;importFail('SOURCE_PARSE_INVALID');}
  }
}

export function sourceMapping(checkpoint:any,inventory:SourceInventory){
  const mapping=checkpoint.mapping;
  if(!mapping?.approved||mapping.sourceRevisionId!==checkpoint.source?.sourceRevisionId||!mapping.mappingRevisionId)importFail('APPROVED_MAPPING_REQUIRED');
  const targets=new Set<string>();
  for(const [key,target] of Object.entries(mapping.mappings||{})){
    if(!inventory.headers.includes(key)||typeof target!=='string'||target!=='unmapped'&&!ROSTER_FIELDS.includes(target as any))importFail('SOURCE_MAPPING_MISMATCH');
    if(target!=='unmapped'){if(targets.has(target as string))importFail('SOURCE_MAPPING_MISMATCH');targets.add(target as string);}
  }
  if(!targets.has('carrierName')||!['driverName','driverIdentity','truckPlate'].some(k=>targets.has(k)))importFail('SOURCE_MAPPING_MISMATCH');
  return sha(stableExecution({revision:mapping.mappingRevisionId,sourceRevisionId:mapping.sourceRevisionId,columns:inventory.columnsDigest,mappings:mapping.mappings,
    approvedBy:mapping.approvedBy,approvedAt:mapping.approvedAt}));
}
export function mappedSource(row:SourceRow,mappings:Record<string,string>){
  const value=new DriverTruckImportNormalizer(mappings as Record<string,DriverTruckCanonicalMappingTarget>).normalize({...row.raw,_sourceRowIndex:row.physicalRow},row.ordinal);
  delete value._raw;return value;
}
export interface SourceCorrection {sourceRowId:string;field:string;originalValue:unknown;correctedValue:unknown;reason:string;
  approvedBy:string;approvedAt:string;sourceRevisionId:string;mappingRevisionId:string;mappingDigest:string}

function preparedFromSource(row:any,canonical:any){
  if(row.status==='REJECTED'||row.status==='COMMITTED')return;
  if(canonical._invalidNumericFields?.length)importFail('SOURCE_VALUE_CORRECTION_REQUIRED');
  const driver=row.entityResolutions?.driver,truck=row.entityResolutions?.truck;
  if(driver?.creationDisposition==='PREPARED_NEW'){
    const p=driver.preparedDriverPlan;
    if(!p||normalizeName(p.driverName||'')!==normalizeName(canonical.driverName||'')||normalizeIdNumber(p.residencyId||'')!==canonical.driverIdentity
      ||normalizePhone(p.phone||'')!==canonical.driverPhone)importFail('SOURCE_PREPARATION_MISMATCH');
  }
  if(truck?.creationDisposition==='PREPARED_NEW'){
    const p=truck.preparedTruckPlan;
    if(!p||normalizePlate(p.plateNumber||'')!==canonical.truckPlate||String(p.truckType||'').trim()!==canonical.truckType
      ||['tareWeightKg','maxGrossWeightKg'].some(k=>p[k]!==canonical[k]))importFail('SOURCE_PREPARATION_MISMATCH');
  }
}

/** Recompute all evidence. Cached row proofs never authorize a row or correction. */
export function bindSourceRows(checkpoint:any,inventory:SourceInventory,options:{rebuildCanonical?:boolean;checkPrepared?:boolean}={}){
  const batch=checkpoint.importBatch,mappingDigest=sourceMapping(checkpoint,inventory);
  if(!batch||batch.source?.sourceType!==inventory.sourceType||!Array.isArray(batch.rows)||batch.rows.length!==inventory.rows.length)importFail('SOURCE_ROW_INVENTORY_MISMATCH');
  const corrections:SourceCorrection[]=checkpoint.sourceCorrections||[];
  if(!Array.isArray(corrections)||corrections.length>1000)importFail('SOURCE_CORRECTION_INVALID');
  const indexed=new Map<string,SourceCorrection>(),ids=new Set(inventory.rows.map(r=>r.id));
  for(const c of corrections){
    const key=c.sourceRowId+'/'+c.field;
    if(!ids.has(c.sourceRowId)||!ROSTER_FIELDS.includes(c.field as any)||indexed.has(key)||!c.approvedBy||!c.approvedAt||!c.reason
      ||c.mappingRevisionId!==checkpoint.mapping.mappingRevisionId||c.mappingDigest!==mappingDigest||c.sourceRevisionId!==checkpoint.source.sourceRevisionId)importFail('SOURCE_CORRECTION_INVALID');
    indexed.set(key,c);
  }
  const correctionDigest=sha(stableExecution(corrections));
  const rows=batch.rows.map((row:any,index:number)=>{
    const source=inventory.rows[index];
    if(row.rowNumber!==source.ordinal||row.sourceRowId!==undefined&&row.sourceRowId!==source.id||!row.raw||typeof row.raw!=='object')importFail('SOURCE_ROW_IDENTITY_MISMATCH');
    const raw=Object.fromEntries(Object.entries(row.raw).filter(([key])=>!['_sourceProof','_sourceRowIndex'].includes(key)));
    if(!same(raw,source.raw)||row.raw._sourceRowIndex!==undefined&&row.raw._sourceRowIndex!==source.physicalRow)importFail('SOURCE_ROW_VALUE_MISMATCH');
    const location={sourceType:inventory.sourceType,...(inventory.sheetName?{sourceSheetName:inventory.sheetName}:{}),sourceRowNumber:source.physicalRow,internalRowNumber:source.ordinal};
    if(row.sourceLocation!==undefined&&!same(row.sourceLocation,location))importFail('SOURCE_ROW_IDENTITY_MISMATCH');
    const canonical:Record<string,any>=mappedSource(source,checkpoint.mapping.mappings);
    for(const field of ROSTER_FIELDS){const c=indexed.get(source.id+'/'+field);if(c){
      if(!same(c.originalValue,canonical[field]??null))importFail('SOURCE_CORRECTION_INVALID');
      if(c.correctedValue===null&&['tareWeightKg','maxGrossWeightKg'].includes(field))delete canonical[field];else canonical[field]=c.correctedValue;
      if(canonical._invalidNumericFields)canonical._invalidNumericFields=canonical._invalidNumericFields.filter((v:string)=>v!==field);
    }}
    if(!options.rebuildCanonical)for(const [key,value] of Object.entries(row.canonical||{})){
      if(['_raw','_rowNumber','_sourceRowIndex','_invalidNumericFields'].includes(key))continue;
      if(!ROSTER_FIELDS.includes(key as any)||!same(value,canonical[key]))importFail('SOURCE_CANONICAL_CORRECTION_REQUIRED');
    }
    if(options.checkPrepared)preparedFromSource(row,canonical);
    return {...row,canonical,sourceLocation:location,sourceRowId:source.id,
      raw:{...source.raw,_sourceRowIndex:source.physicalRow,_sourceProof:{contract:SOURCE_ROW_CONTRACT,sourceRevisionId:checkpoint.source.sourceRevisionId,
        contentSha256:checkpoint.source.fingerprint,inventoryDigest:inventory.digest,columnsDigest:inventory.columnsDigest,mappingDigest,correctionDigest,rowId:source.id}}};
  });
  return {...batch,rows};
}
