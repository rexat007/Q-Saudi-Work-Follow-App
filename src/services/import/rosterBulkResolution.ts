import type {BulkIdentityQuery,BulkIdentityResult} from '../../types/importResolution';
import type {UnifiedImportBatch,ImportRow} from '../../types/unifiedImport';
import {RosterBatchReviewService as Review} from './rosterBatchReview.service';
import {normalizeNaturalKey} from '../../utils/globalIdentityPolicy';
import {selectedResolution} from './canonicalResolution';
export interface BulkRosterItem {query:BulkIdentityQuery;rows:number[];plan?:Record<string,any>;conflict:boolean;prepareConflict?:boolean;result?:BulkIdentityResult}
export function rosterBulkItems(batch:UnifiedImportBatch,kinds:('driver'|'truck'|'carrier'|'material')[]=['driver','truck']):BulkRosterItem[]{
 const groups=Review.getBatchReviewGroups(batch),byNumber=new Map(batch.rows.map(r=>[r.rowNumber,r]));const items:BulkRosterItem[]=[];
 for(const kind of kinds)for(const g of groups[kind]){
  const rows=g.rowNumbers.map(n=>byNumber.get(n)!).filter(r=>r&&r.status!=='REJECTED'&&r.status!=='COMMITTED');if(!rows.length)continue;
  const carrierIds=new Set(rows.map(r=>r.entityResolutions?.carrier?.matchedId).filter(Boolean));
  const carrierId=carrierIds.size===1?[...carrierIds][0]:undefined;
  let natural='',plan:Record<string,any>|undefined,conflict=false,prepareConflict=false;
  if(kind==='driver'||kind==='truck'){
   const defaults=kind==='driver'?Review.deriveDriverCreationDefaults({...batch,rows},g):Review.deriveTruckCreationDefaults({...batch,rows},g);
   const {hasConflict,conflicts,...values}=defaults;plan={...values,carrierId};prepareConflict=hasConflict;conflict=!carrierId;
   natural=String(kind==='driver'?(values as any).residencyId:(values as any).plateNumber);
  }else{const values=new Set(rows.map(r=>String(kind==='carrier'?r.canonical?.commercialRegistrationNo||r.mapped?.commercialRegistrationNo||g.sourceValue:r.canonical?.materialCode||r.mapped?.materialCode||'')).filter(Boolean));natural=values.size===1?[...values][0]:'';conflict=values.size!==1;}
  try{natural=normalizeNaturalKey(kind.toUpperCase() as BulkIdentityQuery['kind'],natural);}catch{conflict=true;}
  if(kind==='driver'&&(!plan?.driverName?.trim()||/^[0-9٠-٩\s]+$/.test(plan.driverName)))prepareConflict=true;
  if(natural.length>120||`${kind}:${g.normalizedSourceKey}`.length>500)conflict=true;
  items.push({query:{key:`${kind}:${g.normalizedSourceKey}`,kind:kind.toUpperCase() as BulkIdentityQuery['kind'],naturalKey:natural,carrierId},rows:g.rowNumbers,plan,conflict,prepareConflict});
 }
 const carriers=new Map<string,Set<string>>();for(const i of items){const key=`${i.query.kind}:${i.query.naturalKey}`;if(i.query.carrierId){const set=carriers.get(key)||new Set();set.add(i.query.carrierId);carriers.set(key,set);}}
 for(const i of items)if((carriers.get(`${i.query.kind}:${i.query.naturalKey}`)?.size||0)>1)i.conflict=true;
 return items;
}
/** Identity approval never approves temporal displacement; those groups stay individually reviewable. */
export function fenceBulkDisplacements(batch:UnifiedImportBatch,items:BulkRosterItem[]):BulkRosterItem[]{
 const rows=new Map(batch.rows.map(r=>[r.rowNumber,r])),perRow=new Map<string,BulkRosterItem>();
 for(const i of items)for(const n of i.rows)perRow.set(`${i.query.kind}:${n}`,i);
 return items.map(i=>{
  if(i.query.kind!=='DRIVER'&&i.query.kind!=='TRUCK')return i;
  const peerKind=i.query.kind==='DRIVER'?'TRUCK':'DRIVER',peerKey=peerKind.toLowerCase(),targets=new Set<string>(),materials=new Set<string>();
  for(const n of i.rows){const row=rows.get(n);if(!row)continue;const peer=perRow.get(`${peerKind}:${n}`);
   if(peer)targets.add(peer.result?.entity?.id||row.entityResolutions?.[peerKey]?.matchedId||'');
   const material=row.entityResolutions?.material?.matchedId||batch.metadata?.batchMaterialBinding?.materialId;if(material)materials.add(material);
  }
  const query={...i.query,...(targets.size===1?{expectedPeerId:[...targets][0]}:{}),...(materials.size===1?{materialId:[...materials][0]}:{})};
  const entity=i.result?.entity,assignment=entity?.assignment,allocation=entity?.allocation;
  const conflict=i.conflict||targets.size>1||materials.size>1||Boolean(assignment&&query.expectedPeerId!==undefined&&assignment[i.query.kind==='DRIVER'?'truckId':'driverId']!==query.expectedPeerId)||Boolean(i.query.kind==='TRUCK'&&allocation&&query.materialId&&allocation.materialId!==query.materialId);
  return {...i,query,conflict};
 });
}
export const safeBulkItem=(i:BulkRosterItem)=>!i.conflict&&Boolean(i.result)&&!['GLOBAL_AMBIGUOUS','GLOBAL_EXISTS_WRONG_CARRIER','GLOBAL_INELIGIBLE','SOURCE_CONFLICT'].includes(i.result!.state)&&(i.result!.state!=='NOT_FOUND'||Boolean(i.plan&&!i.prepareConflict&&(i.query.kind==='DRIVER'||i.query.kind==='TRUCK')));
export function applyBulkRosterChoices(batch:UnifiedImportBatch,items:BulkRosterItem[]):UnifiedImportBatch{
 const choices=new Map<number,Record<string,any>>();
 for(const i of items){if(!safeBulkItem(i))continue;const kind=i.query.kind.toLowerCase(),entity=i.result!.entity;
  let value:any;
  if(i.result!.state==='NOT_FOUND'){
   const {carrierId}=i.query,plan=i.plan!;
   value={entityType:i.query.kind,originalValue:i.query.naturalKey,sourceValue:i.query.naturalKey,isAuthorized:true,recommendation:'ACCEPT',confidence:1,isExact:false,creationDisposition:'PREPARED_NEW',decision:'CREATE_NEW',...(kind==='driver'?{preparedDriverPlan:{driverName:plan.driverName,residencyId:i.query.naturalKey,phone:plan.phone||undefined,carrierId}}:{preparedTruckPlan:{plateNumber:i.query.naturalKey,truckType:plan.truckType||undefined,tareWeightKg:plan.tareWeightKg,maxGrossWeightKg:plan.maxGrossWeightKg,carrierId}})};
  }else{if(i.result!.state!=='GLOBAL_ACTIVE_AND_PROJECT_READY'||!entity)throw Error('CONTEXT_UNAVAILABLE');value={...selectedResolution(entity,i.query.naturalKey,i.query.carrierId,{projectId:batch.projectId,resolutionContext:{projectId:batch.projectId,entities:[entity,...(i.result!.carrier?[i.result!.carrier]:[])]}} as any),decision:'SELECT_ALTERNATE'};}
  for(const n of i.rows)choices.set(n,{...choices.get(n),[kind]:value});
 }
 const rows:ImportRow[]=batch.rows.map(r=>choices.has(r.rowNumber)?{...r,entityResolutions:{...r.entityResolutions,...choices.get(r.rowNumber)}}:r);
 return {...batch,rows,metadata:{...batch.metadata,reviewedCanonicalIntent:undefined,bulkProgress:{operationId:batch.operationId,keys:[...new Set([...(batch.metadata?.bulkProgress?.keys||[]),...items.filter(safeBulkItem).map(i=>i.query.key)])]}}};
}
/** Canonical commands are idempotent; a failed/lost reply is never replayed without fresh discovery. */
export async function executeBulkRoster(batch:UnifiedImportBatch,items:BulkRosterItem[],deps:{discover(queries:BulkIdentityQuery[]):Promise<BulkIdentityResult[]>;membership(kind:BulkIdentityQuery['kind'],id:string,command:'ENROLL'|'REACTIVATE'):Promise<unknown>;affiliation(kind:'DRIVER'|'TRUCK',id:string,carrierId:string,command:'SET_AFFILIATION'|'REACTIVATE_AFFILIATION'):Promise<unknown>;checkpoint(batch:UnifiedImportBatch):Promise<void>;current():boolean}){
 let working=batch;const safe=items.filter(safeBulkItem);
 for(let offset=0;offset<safe.length;offset+=50){
  if(!deps.current())throw Error('PROJECT_CONTEXT_STALE');
  const chunk=safe.slice(offset,offset+50),fresh=await deps.discover(chunk.map(i=>i.query));
  const values=new Map(fresh.map(r=>[r.key,r]));
  for(let at=0;at<chunk.length;at+=4){const settled=await Promise.allSettled(chunk.slice(at,at+4).map(async i=>{
   if(!deps.current())throw Error('PROJECT_CONTEXT_STALE');const result=values.get(i.query.key);if(!result)throw Error('CONTEXT_UNAVAILABLE');i={...i,result};if(!safeBulkItem(i))throw Error('PROJECT_CONTEXT_STALE');
   const e=result.entity;if(!e)return;
   if(e.membershipStatus!=='ACTIVE')await deps.membership(e.kind,e.id,e.membershipStatus===null?'ENROLL':'REACTIVATE');
   if(!deps.current())throw Error('PROJECT_CONTEXT_STALE');
   if((e.kind==='DRIVER'||e.kind==='TRUCK')&&(!e.affiliation||e.affiliation.status!=='ACTIVE'))await deps.affiliation(e.kind,e.id,i.query.carrierId!,e.affiliation?'REACTIVATE_AFFILIATION':'SET_AFFILIATION');
  }));const failed=settled.find(r=>r.status==='rejected');if(failed?.status==='rejected')throw failed.reason;}
  if(!deps.current())throw Error('PROJECT_CONTEXT_STALE');
  const proven=await deps.discover(chunk.map(i=>i.query)),proof=new Map(proven.map(r=>[r.key,r]));
  const approved=chunk.map(i=>({...i,result:proof.get(i.query.key)}));
  if(approved.some(i=>!safeBulkItem(i)))throw Error('PROJECT_CONTEXT_STALE');
  working=applyBulkRosterChoices(working,approved);await deps.checkpoint(working);
 }
 return working;
}
