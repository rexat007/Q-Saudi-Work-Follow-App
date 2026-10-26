import type { ImportResolutionEntity as Entity } from '../../types/importResolution';
import type { PipelineContext, ImportEntityResolutionInfo as Resolution, ImportRow } from '../../types/unifiedImport';
import { normalizeName, normalizeIdNumber, normalizePlate, normalizeCode } from '../../utils/normalization';
import { evaluateGlobalEligibility, normalizeNaturalKey } from '../../utils/globalIdentityPolicy';
export type ResolutionKey = 'carrier' | 'material' | 'driver' | 'truck';
const idKeys = { carrier:'carrierId', material:'materialId', driver:'driverId', truck:'truckId' } as const;
export function resolutionEntities(context: PipelineContext, key: ResolutionKey): Entity[] {
  if (context.resolutionContext) {
    if (context.resolutionContext.projectId !== context.projectId) throw Error('PROJECT_CONTEXT_STALE');
    return context.resolutionContext.entities.filter(e=>e.kind===key.toUpperCase());
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
    if (carrierId && !resolutionEntities(context,'carrier').some(c=>c.id===carrierId&&c.membershipStatus==='ACTIVE'&&c.globalStatus==='ACTIVE'&&!c.issue)) reason='AFFILIATION_CONFLICT';
  }
  return {entityType:entity.kind,originalValue:source,sourceValue:source,matchedId:entity.id,matchedName:entity.name,entityId:entity.id,matchedValue:entity.name,confidence:1,isExact:true,isAuthorized:!reason,matchMethod:'EXACT',recommendation:reason?'REVIEW':'ACCEPT',riskLevel:reason?'CRITICAL':'LOW',relationshipStatus:reason?(reason==='AFFILIATION_CONFLICT'&&entity.kind==='DRIVER'?'DRIVER_CARRIER_CONFLICT':'RELATIONSHIP_CONFLICT'):'VALID',canonicalState:entity,resolutionReason:reason,decision:'REUSE_ACTIVE'};
}
export function resolveCanonicalRoster(row: Record<string,any>, context: PipelineContext, previous?: Record<string,Resolution>): Record<string,Resolution> {
  const result:Record<string,Resolution>={};
  for(const key of ['carrier','material','driver','truck'] as ResolutionKey[]){
    const source=String(key==='carrier'?row.carrierName||row.carrierId||'':key==='material'?row.materialName||row.materialCode||row.materialId||'':key==='driver'?row.driverName||row.driverIdentity||'':row.truckPlate||'');
    if(!source && !(key==='material'&&row.materialId) && !(key==='carrier'&&row.carrierId))continue;
    const entities=resolutionEntities(context,key),old=previous?.[key];
    const natural=(v:string)=>key==='driver'?normalizeIdNumber(v):key==='truck'?normalizePlate(v):key==='material'?normalizeCode(v):v.replace(/[^0-9]/g,'');
    const rawNatural=key==='driver'?row.driverIdentity:key==='truck'?row.truckPlate:key==='material'?row.materialCode:undefined;
    let candidates:Entity[]=[],reason:string|undefined,method:Resolution['matchMethod']='EXACT',evidenceConflict=false;
    const explicit=old?.decision==='SELECT_ALTERNATE'||old?.decision==='ACCEPT_CANDIDATE'||old?.decision==='REUSE_ACTIVE' ? old.matchedId : undefined;
    const exactId=key==='carrier'?row.carrierId||source:key==='material'?row.materialId:undefined;
    if(rawNatural){
      const matches=entities.filter(e=>e.naturalKey&&natural(e.naturalKey)===natural(String(rawNatural)));
      if(matches.length>1) {candidates=matches;reason='CANONICAL_INTEGRITY_ERROR';}
      else candidates=matches;
      if(key==='material'&&row.materialName){
        const names=entities.filter(e=>normalizeName(e.name)===normalizeName(row.materialName));
        if(names.length && (!matches.length||names.some(e=>e.id!==matches[0]?.id))){candidates=[...new Map([...matches,...names].map(e=>[e.id,e])).values()];reason='IDENTITY_AMBIGUITY';evidenceConflict=true;}
      }
    } else {
      candidates=exactId?entities.filter(e=>e.id===exactId):[];
      if(!candidates.length&&source){candidates=entities.filter(e=>normalizeName(e.name)===normalizeName(source)||e.aliases?.some(a=>normalizeName(a)===normalizeName(source))||key==='carrier'&&e.naturalKey===source);method='NORMALIZED';}
      if(!candidates.length&&normalizeName(source)){candidates=entities.filter(e=>normalizeName(e.name).includes(normalizeName(source))||normalizeName(source).includes(normalizeName(e.name)));if(candidates.length){reason='IDENTITY_AMBIGUITY';method='FUZZY';}}
      if(candidates.length===1&&(key==='carrier'||key==='material')&&candidates[0].name===source)method='EXACT';
      if(candidates.length>1)reason='IDENTITY_AMBIGUITY';
    }
    if(explicit&&reason!=='CANONICAL_INTEGRITY_ERROR'&&!evidenceConflict){
      const selected=entities.filter(e=>e.id===explicit);
      if(selected.length===1){candidates=selected;reason=undefined;}else reason='CANONICAL_INTEGRITY_ERROR';
    }
    if(old?.decision==='LEAVE_UNRESOLVED'){
      result[key]={...old,matchedId:undefined,entityId:undefined,isAuthorized:false,recommendation:'REVIEW',resolutionReason:'UNRESOLVED'};continue;
    }
    if(candidates.length===1&&candidates[0].naturalKey){
      try {
        const selected=candidates[0], keyValue=normalizeNaturalKey(selected.kind,selected.naturalKey);
        if(entities.filter(e=>{try{return e.naturalKey&&normalizeNaturalKey(e.kind,e.naturalKey)===keyValue}catch{return false}}).length!==1)reason='CANONICAL_INTEGRITY_ERROR';
      }catch{reason='CANONICAL_INTEGRITY_ERROR';}
    }
    if(candidates.length===1&&!reason){
      result[key]={...selectedResolution(candidates[0],source,result.carrier?.matchedId,context),matchMethod:method,isExact:method==='EXACT',decision:old?.decision||'AUTO_RESOLVED'};
    }else if(old?.creationDisposition==='PREPARED_NEW'&&!candidates.length){result[key]=old;}
    else result[key]={entityType:key.toUpperCase() as Entity['kind'],originalValue:source,sourceValue:source,confidence:0,isExact:false,isAuthorized:false,matchMethod:candidates.length?method:'NONE',recommendation:'REVIEW',riskLevel:reason?'CRITICAL':'HIGH',relationshipStatus:reason==='CANONICAL_INTEGRITY_ERROR'?'RELATIONSHIP_CONFLICT':'VALID',ambiguous:Boolean(reason),resolutionReason:reason||'UNRESOLVED',candidates:candidates.map(e=>({candidateEntityId:e.id,candidateDisplayName:e.name,confidence:0,canonicalState:e}))};
  }
  if(result.driver?.canonicalState?.affiliation&&result.truck?.canonicalState?.affiliation&&result.driver.canonicalState.affiliation.carrierId!==result.truck.canonicalState.affiliation.carrierId){
    for(const key of ['driver','truck']) result[key]={...result[key],resolutionReason:'AFFILIATION_CONFLICT',relationshipStatus:key==='driver'?'DRIVER_CARRIER_CONFLICT':'RELATIONSHIP_CONFLICT',isAuthorized:false,recommendation:'REVIEW',riskLevel:'CRITICAL'};
  }
  return result;
}
export function revalidateCanonicalRow(row: ImportRow, context: PipelineContext): ImportRow {
  if(!context.resolutionContext)return row;
  const value:any=row.canonical||row.mapped||{};
  const canonical={...value,carrierName:value.carrierName||value.carrier,materialName:value.materialName||value.materialType,truckPlate:value.truckPlate||value.truckNo};
  return {...row,entityResolutions:resolveCanonicalRoster(canonical,context,row.entityResolutions)};
}
