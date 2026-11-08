import type {SourceInventory} from './importSourceRows.js';
import {ExcelCsvNormalizer} from '../services/import/normalizer.service';
import {stableExecution} from '../services/import/rosterExecutionPlan.server';
import {sha,importFail} from './importArtifacts.js';
export const TRIP_SOURCE_FIELDS=['carrier','truckNo','driver','material','ticketId','tripSerial','shiftDate','tareWeight','grossWeight','netWeight','destNetWeight','weighTime','loadTime','unloadTime','legacyStatus','sourceUnit'];
const same=(a:any,b:any)=>stableExecution(a)===stableExecution(b);
export function tripMapping(cp:any,inventory:SourceInventory){
 const m=cp.mapping;if(m?.approved!==true||typeof m.mappingRevisionId!=='string'||!m.mappingRevisionId||m.mappingRevisionId.length>128||!m.mappings||typeof m.mappings!=='object'||Array.isArray(m.mappings)||Object.keys(m.mappings).length>256||m.sourceRevisionId!==cp.source.sourceRevisionId||!m.mappingRevisionId||!m.approvedBy||!m.approvedAt)importFail('APPROVED_MAPPING_REQUIRED');
 const seen=new Set<string>();for(const [key,target] of Object.entries(m.mappings||{})){
  if(!inventory.headers.includes(key)||typeof target!=='string'||target!=='unmapped'&&!TRIP_SOURCE_FIELDS.includes(target))importFail('SOURCE_MAPPING_MISMATCH');
  if(target!=='unmapped'){if(seen.has(target as string))importFail('SOURCE_MAPPING_MISMATCH');seen.add(target as string);}
 }
 if(!seen.has('truckNo')&&!seen.has('ticketId'))importFail('SOURCE_MAPPING_MISMATCH');
 return sha(stableExecution({source:cp.source.sourceRevisionId,columns:inventory.columnsDigest,mapping:m}));
}
export function normalizedTripCell(value:any,field:string){
 // Keep source decimal text exact; the generic browser normalizer returns JS numbers.
 if(['tareWeight','grossWeight','netWeight','destNetWeight'].includes(field)){
  if(value===null||value===undefined)return null;
  const original=ExcelCsvNormalizer.convertArabicNumerals(String(value).trim());if(!original||['-','n/a','null'].includes(original.toLowerCase()))return null;
  let clean=original.replace(/(?:kg|كجم|كيلو|طن|tons|ton|sar|ريال)/gi,'').trim();
  if(clean.includes(',')&&clean.includes('.'))clean=clean.replace(/,/g,'');
  else if(clean.includes(',')){const parts=clean.split(',');clean=parts.length===2&&parts[1].length<=3&&!parts[1].includes('000')?parts.join('.'):clean.replace(/,/g,'');}
  return clean.replace(/\s+/g,'');
 }
 if(['ticketId','tripSerial','truckNo','carrier','driver','material','sourceUnit','legacyStatus'].includes(field))return ExcelCsvNormalizer.convertArabicNumerals(String(value??'').trim().replace(/\s+/g,' '))||null;
 if(['weighTime','loadTime','unloadTime'].includes(field))return String(value??'').trim()||null;
 return ExcelCsvNormalizer.normalizeValue(value,field);
}
export function bindTripSourceRows(cp:any,inventory:SourceInventory){
 const mappingDigest=tripMapping(cp,inventory),batch=cp.tripBatch;
 if(!Array.isArray(batch?.rows)||batch.rows.length!==inventory.rows.length)importFail('SOURCE_ROW_INVENTORY_MISMATCH');
 const corrections=cp.tripCorrections||[];if(!Array.isArray(corrections)||corrections.length>1000)importFail('SOURCE_CORRECTION_INVALID');
 const indexed=new Map<string,any>();for(const c of corrections){const key=c.sourceRowId+'/'+c.field;if(indexed.has(key)||!TRIP_SOURCE_FIELDS.includes(c.field)||c.mappingDigest!==mappingDigest||c.sourceRevisionId!==cp.source.sourceRevisionId||!c.approvedBy||!c.reason)importFail('SOURCE_CORRECTION_INVALID');indexed.set(key,c);}
 return batch.rows.map((r:any,i:number)=>{
  const source=inventory.rows[i];if(r.rowNumber!==source.ordinal||r.sourceRowId&&r.sourceRowId!==source.id||!same(r.raw,source.raw))importFail('SOURCE_ROW_VALUE_MISMATCH');
  if(!['ACCEPT','REJECT'].includes(r.decision))importFail('TRIP_ROW_REVIEW_REQUIRED');
  const canonical:any={};for(const [key,target] of Object.entries(cp.mapping.mappings) as [string,string][]){if(target==='unmapped')continue;canonical[target]=normalizedTripCell(source.raw[key],target);}
  const originalCanonical=structuredClone(canonical),originalCells=Object.fromEntries(Object.entries(cp.mapping.mappings).filter(([,target])=>target!=='unmapped').map(([key,target])=>[target,source.raw[key]]));
  for(const field of TRIP_SOURCE_FIELDS){const correction=indexed.get(source.id+'/'+field);if(correction){if(!same(correction.originalValue,canonical[field]??null))importFail('SOURCE_CORRECTION_INVALID');canonical[field]=correction.correctedValue;}}
  if(r.canonical&&!same(r.canonical,canonical))importFail('SOURCE_CANONICAL_CORRECTION_REQUIRED');
  const resolved=r.resolved||{};if(Object.keys(resolved).some(k=>!['carrierId','driverId','truckId','materialId','pricingRuleId','pricingMode'].includes(k)))importFail('INVALID_TRIP_IMPORT_DECISION');
  return {...r,sourceRowId:source.id,canonical,originalCanonical,originalCells,sourceProof:{contract:'SQL_TRIP_ROWS_V1',sourceRevisionId:cp.source.sourceRevisionId,sourceSha:cp.source.fingerprint,inventoryDigest:inventory.digest,mappingDigest,correctionDigest:sha(stableExecution(corrections)),rowId:source.id,physicalRow:source.physicalRow}};
 });
}
export function tripRowPayload(row:any){
 const c=row.canonical;return {payload:{...row.resolved,pricingMode:row.resolved.pricingRuleId?'RESOLVED':'PENDING'},
  operationalData:Object.fromEntries(Object.entries({shiftDate:c.shiftDate,ticketId:c.ticketId,tripSerial:c.tripSerial,tareWeightKg:c.tareWeight,grossWeightKg:c.grossWeight,netWeightKg:c.netWeight,destinationNetWeightKg:c.destNetWeight,weighTime:c.weighTime,loadTime:c.loadTime,unloadTime:c.unloadTime,legacyStatus:c.legacyStatus}).filter(([,v])=>v!==null&&v!==undefined&&v!==''))};
}
