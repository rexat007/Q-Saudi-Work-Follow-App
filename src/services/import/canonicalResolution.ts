import type { ImportResolutionEntity as Entity } from '../../types/importResolution';
import type { PipelineContext, ImportEntityResolutionInfo as Resolution, ImportRow } from '../../types/unifiedImport';
import { normalizeName, normalizeIdNumber, normalizePlate, normalizeCode } from '../../utils/normalization';
import { evaluateGlobalEligibility, normalizeNaturalKey } from '../../utils/globalIdentityPolicy';
export type ResolutionKey = 'carrier' | 'material' | 'driver' | 'truck';
const idKeys = { carrier:'carrierId', material:'materialId', driver:'driverId', truck:'truckId' } as const;
const indexKey=Symbol('roster-resolution-index');
type Lookup=Map<string,Entity[]>;
interface ResolutionIndex {groups:Record<ResolutionKey,Entity[]>;ids:Record<ResolutionKey,Lookup>;natural:Record<ResolutionKey,Lookup>;names:Record<ResolutionKey,Lookup>;validNatural:Record<ResolutionKey,Map<string,number>>;order:Map<Entity,number>}
const naturalValue=(key:ResolutionKey,value:string)=>key==='driver'||key==='carrier'?normalizeIdNumber(value):key==='truck'?normalizePlate(value):normalizeCode(value);
/** One immutable read snapshot per pass, never a cache surviving a canonical refresh. */
export function withCanonicalResolutionIndex(context:PipelineContext):PipelineContext {
 if(!context.resolutionContext)return context;
 const index:ResolutionIndex={groups:{} as ResolutionIndex['groups'],ids:{} as ResolutionIndex['ids'],natural:{} as ResolutionIndex['natural'],names:{} as ResolutionIndex['names'],validNatural:{} as ResolutionIndex['validNatural'],order:new Map()};
 const add=(map:Lookup,key:string,e:Entity)=>{const values=map.get(key)||[];values.push(e);map.set(key,values);};
 for(const key of ['carrier','material','driver','truck'] as ResolutionKey[]){
  const values=context.resolutionContext.entities.filter(e=>e.kind===key.toUpperCase());index.groups[key]=values;index.ids[key]=new Map();index.natural[key]=new Map();index.names[key]=new Map();index.validNatural[key]=new Map();
  for(const entity of values){index.order.set(entity,index.order.size);add(index.ids[key],entity.id,entity);for(const name of new Set([normalizeName(entity.name),...(entity.aliases||[]).map(normalizeName)]))add(index.names[key],name,entity);
   if(entity.naturalKey){add(index.natural[key],naturalValue(key,entity.naturalKey),entity);try{const value=normalizeNaturalKey(entity.kind,entity.naturalKey);index.validNatural[key].set(value,(index.validNatural[key].get(value)||0)+1);}catch{/* Existing resolution reports malformed identity; indexing never repairs it. */}}
  }
 }
 return Object.assign({...context},{[indexKey]:index});
}
const resolutionIndex=(context:PipelineContext)=>(context as PipelineContext & {[indexKey]?:ResolutionIndex})[indexKey];
export function resolutionEntities(context: PipelineContext, key: ResolutionKey): Entity[] {
  if (context.resolutionContext) {
    if (context.resolutionContext.projectId !== context.projectId) throw Error('PROJECT_CONTEXT_STALE');
    return resolutionIndex(context)?.groups[key] || context.resolutionContext.entities.filter(e=>e.kind===key.toUpperCase());
  }
  // Compatibility for pre-existing pure test/Trip contexts. Production import hosts require
  // the server's expanded context; this does not fetch or invent missing Global identities.
  const values = context.knownEntities?.[({carrier:'carriers',material:'materials',driver:'drivers',truck:'trucks'} as const)[key]] || [];
  return values.map((v:any)=>({kind:key.toUpperCase() as Entity['kind'],id:v[idKeys[key]],name:v.name||v.plate||v[idKeys[key]],naturalKey:key==='driver'?v.idNumber:key==='truck'?v.plate:key==='material'?v.code:v.commercialRegistrationNo,aliases:v.aliases,globalStatus:v.status||'ACTIVE',membershipStatus:'ACTIVE' as const,eligible:!v.status||v.status==='ACTIVE',canReactivate:false,affiliation:v.carrierId?{carrierId:v.carrierId,status:'ACTIVE' as const}:null}));
}
export function selectedResolution(entity: Entity, source: string, carrierId: string|undefined, context: PipelineContext): Resolution {
  const policy=evaluateGlobalEligibility(entity.kind,{status:entity.globalStatus});
  let reason=entity.issue?'CANONICAL_INTEGRITY_ERROR':!policy.CAN_USE_OPERATIONALLY?'GLOBAL_ENTITY_INELIGIBLE':entity.membershipStatus===null?'MEMBERSHIP_MISSING':entity.membershipStatus!=='ACTIVE'?'MEMBERSHIP_STATE_CONFLICT':undefined;
  if (!reason && (entity.kind==='DRIVER'||entity.kind==='TRUCK')) {
    if (!entity.affiliation || entity.affiliation.status!=='ACTIVE'|| !carrierId || entity.affiliation.carrierId!==carrierId) reason='AFFILIATION_CONFLICT';
    if (carrierId && !(resolutionIndex(context)?.ids.carrier.get(carrierId)||resolutionEntities(context,'carrier')).some(c=>c.id===carrierId&&c.membershipStatus==='ACTIVE'&&c.globalStatus==='ACTIVE'&&!c.issue)) reason='AFFILIATION_CONFLICT';
  }
  return {entityType:entity.kind,originalValue:source,sourceValue:source,matchedId:entity.id,matchedName:entity.name,entityId:entity.id,matchedValue:entity.name,confidence:1,isExact:true,isAuthorized:!reason,matchMethod:'EXACT',recommendation:reason?'REVIEW':'ACCEPT',riskLevel:reason?'CRITICAL':'LOW',relationshipStatus:reason?(reason==='AFFILIATION_CONFLICT'&&entity.kind==='DRIVER'?'DRIVER_CARRIER_CONFLICT':'RELATIONSHIP_CONFLICT'):'VALID',canonicalState:entity,resolutionReason:reason,decision:'REUSE_ACTIVE'};
}
export function resolveCanonicalRoster(row: Record<string,any>, context: PipelineContext, previous?: Record<string,Resolution>): Record<string,Resolution> {
  const result:Record<string,Resolution>={};
  for(const key of ['carrier','material','driver','truck'] as ResolutionKey[]){
    const source=String(key==='carrier'?row.carrierName||row.carrierId||row.commercialRegistrationNo||'':key==='material'?row.materialName||row.materialCode||row.materialId||'':key==='driver'?row.driverName||row.driverIdentity||'':row.truckPlate||'');
    if(!source && !(key==='material'&&row.materialId) && !(key==='carrier'&&row.carrierId))continue;
    const entities=resolutionEntities(context,key),old=previous?.[key],index=resolutionIndex(context);
    const natural=(v:string)=>key==='driver'?normalizeIdNumber(v):key==='truck'?normalizePlate(v):key==='material'?normalizeCode(v):normalizeIdNumber(v);
    const rawNatural=key==='driver'?row.driverIdentity:key==='truck'?row.truckPlate:key==='material'?row.materialCode:row.commercialRegistrationNo || (/^[0-9]{10}$/.test(normalizeIdNumber(source)) && /^[0-9٠-٩\s-]+$/.test(source) ? source : undefined);
    let candidates:Entity[]=[],reason:string|undefined,method:Resolution['matchMethod']='EXACT',evidenceConflict=false;
    const explicit=old?.decision==='SELECT_ALTERNATE'||old?.decision==='ACCEPT_CANDIDATE'||old?.decision==='REUSE_ACTIVE' ? old.matchedId : undefined;
    const exactId=key==='carrier'?row.carrierId||source:key==='material'?row.materialId:undefined;
    if(rawNatural){
      const matches=index?index.natural[key].get(natural(String(rawNatural)))||[]:entities.filter(e=>e.naturalKey&&natural(e.naturalKey)===natural(String(rawNatural)));
      if(matches.length>1) {candidates=matches;reason='CANONICAL_INTEGRITY_ERROR';}
      else candidates=matches;
      if(key==='material'&&row.materialName){
        const names=(index?index.names[key].get(normalizeName(row.materialName))||[]:entities).filter(e=>normalizeName(e.name)===normalizeName(row.materialName));
        if(reason!=='CANONICAL_INTEGRITY_ERROR' && names.length && (!matches.length||!names.some(e=>e.id===matches[0]?.id))){candidates=[...new Map([...matches,...names].map(e=>[e.id,e])).values()];reason='IDENTITY_AMBIGUITY';evidenceConflict=true;}
      }
    } else {
      candidates=exactId?(index?index.ids[key].get(exactId)||[]:entities.filter(e=>e.id===exactId)):[];
      if(!candidates.length&&source){candidates=index?[...new Set([...(index.names[key].get(normalizeName(source))||[]),...(key==='carrier'?(index.natural[key].get(natural(source))||[]).filter(e=>e.naturalKey===source):[])])].sort((a,b)=>index.order.get(a)!-index.order.get(b)!):entities.filter(e=>normalizeName(e.name)===normalizeName(source)||e.aliases?.some(a=>normalizeName(a)===normalizeName(source))||key==='carrier'&&e.naturalKey===source);method='NORMALIZED';}
      if(!candidates.length&&normalizeName(source)){candidates=entities.filter(e=>normalizeName(e.name).includes(normalizeName(source))||normalizeName(source).includes(normalizeName(e.name)));if(candidates.length){reason='IDENTITY_AMBIGUITY';method='FUZZY';}}
      if(candidates.length===1&&(key==='carrier'||key==='material')&&candidates[0].name===source)method='EXACT';
      if(candidates.length>1)reason='IDENTITY_AMBIGUITY';
    }
    if (explicit && rawNatural && reason !== 'CANONICAL_INTEGRITY_ERROR') {
      const selected = index?index.ids[key].get(explicit)?.[0]:entities.find(e => e.id === explicit);
      if (!selected?.naturalKey || natural(selected.naturalKey) !== natural(String(rawNatural))) {
        reason = 'IDENTITY_AMBIGUITY'; evidenceConflict = true;
      }
    }
    if(explicit&&reason!=='CANONICAL_INTEGRITY_ERROR'&&!evidenceConflict){
      const selected=index?index.ids[key].get(explicit)||[]:entities.filter(e=>e.id===explicit);
      if(selected.length===1){candidates=selected;reason=undefined;method='EXACT';}else reason='CANONICAL_INTEGRITY_ERROR';
    }
    if(old?.decision==='LEAVE_UNRESOLVED'&&reason!=='CANONICAL_INTEGRITY_ERROR'&&!evidenceConflict){
      result[key]={...old,matchedId:undefined,entityId:undefined,isAuthorized:false,recommendation:'REVIEW',resolutionReason:'UNRESOLVED'};continue;
    }
    if(candidates.length===1&&candidates[0].naturalKey){
      try {
        const selected=candidates[0], keyValue=normalizeNaturalKey(selected.kind,selected.naturalKey);
        if((index?index.validNatural[key].get(keyValue):entities.filter(e=>{try{return e.naturalKey&&normalizeNaturalKey(e.kind,e.naturalKey)===keyValue}catch{return false}}).length)!==1)reason='CANONICAL_INTEGRITY_ERROR';
      }catch{reason='CANONICAL_INTEGRITY_ERROR';}
    }
    if(candidates.length===1&&!reason){
      const resolved = selectedResolution(candidates[0],source,result.carrier?.matchedId,context);
      const suggestionOnly = !rawNatural && !explicit && candidates[0].id !== exactId;
      result[key]={...resolved,matchMethod:method,isExact:method==='EXACT',decision:old?.decision||'AUTO_RESOLVED', ...(suggestionOnly ? {recommendation:'REVIEW',riskLevel:resolved.resolutionReason ? resolved.riskLevel : 'MEDIUM'} : {})};
    }else if(old?.creationDisposition==='PREPARED_NEW'&&!candidates.length){result[key]=old;}
    else result[key]={entityType:key.toUpperCase() as Entity['kind'],originalValue:source,sourceValue:source,confidence:0,isExact:false,isAuthorized:false,matchMethod:candidates.length?method:'NONE',recommendation:'REVIEW',riskLevel:reason?'CRITICAL':'HIGH',relationshipStatus:reason==='CANONICAL_INTEGRITY_ERROR'?'RELATIONSHIP_CONFLICT':'VALID',ambiguous:Boolean(reason),resolutionReason:reason||'UNRESOLVED',candidates:candidates.map(e=>({candidateEntityId:e.id,candidateDisplayName:e.name,confidence:0,canonicalState:e}))};
  }
  if(result.driver?.canonicalState?.affiliation&&result.truck?.canonicalState?.affiliation&&result.driver.canonicalState.affiliation.carrierId!==result.truck.canonicalState.affiliation.carrierId){
    for(const key of ['driver','truck']) result[key]={...result[key],resolutionReason:'AFFILIATION_CONFLICT',relationshipStatus:key==='driver'?'DRIVER_CARRIER_CONFLICT':'RELATIONSHIP_CONFLICT',isAuthorized:false,recommendation:'REVIEW',riskLevel:'CRITICAL'};
  }
  return result;
}
export function revalidateCanonicalRow(row: ImportRow, context: PipelineContext, batchMaterialId?:string): ImportRow {
  if(!context.resolutionContext)return row;
  const value:any=row.canonical||row.mapped||{};
  const canonical={...value,carrierName:value.carrierName||value.carrier,materialName:value.materialName||value.materialType,truckPlate:value.truckPlate||value.truckNo};
  return {...row,entityResolutions:resolveCanonicalRoster(batchMaterialId&&!canonical.materialId&&!canonical.materialName&&!canonical.materialCode?{...canonical,materialId:batchMaterialId}:canonical,context,row.entityResolutions)};
}
