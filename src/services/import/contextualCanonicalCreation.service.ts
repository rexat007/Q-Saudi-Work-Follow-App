import type { RelationshipContext } from '../../types/dataQuality';
import { RosterBatchReviewService, type RosterEntityReviewGroup } from './rosterBatchReview.service';
import { canonicalRelationshipContextService } from '../canonicalRelationshipContext.service';
import { projectCanonicalRefreshService } from '../projectCanonicalRefresh.service';
import type { UnifiedImportBatch } from '../../types/unifiedImport';
import { normalizeNaturalKey, type GlobalKind } from '../../utils/globalIdentityPolicy';

export type ContextualAction = 'REUSE_ACTIVE'|'CREATE_NEW'|'ENROLL_EXISTING'|'REACTIVATE_MEMBERSHIP'|'SET_AFFILIATION'|'REACTIVATE_AFFILIATION'|'SELECT_CANDIDATE'|'LEAVE_UNRESOLVED'|'NO_PERMISSION'|'BLOCKED_BY_INTEGRITY';
export function contextualAction(group: RosterEntityReviewGroup, canMutate: boolean, carrierId?: string): ContextualAction {
  const r=group.currentResolution,e=r?.canonicalState;
  if(r?.resolutionReason==='CANONICAL_INTEGRITY_ERROR'||e?.issue)return 'BLOCKED_BY_INTEGRITY';
  if(r?.ambiguous||group.candidates.length>1)return 'SELECT_CANDIDATE';
  if(!e&&(r?.matchedId||group.matchedId))return 'SELECT_CANDIDATE';
  if(!e) return group.candidates.length?'SELECT_CANDIDATE':canMutate?'CREATE_NEW':'NO_PERMISSION';
  if(e.globalStatus!=='ACTIVE')return 'LEAVE_UNRESOLVED';
  const action = e.membershipStatus===null?'ENROLL_EXISTING':e.membershipStatus!=='ACTIVE'?'REACTIVATE_MEMBERSHIP':
    (e.kind==='DRIVER'||e.kind==='TRUCK') ? !carrierId?'LEAVE_UNRESOLVED':!e.affiliation?'SET_AFFILIATION':e.affiliation.carrierId!==carrierId?'LEAVE_UNRESOLVED':e.affiliation.status==='INACTIVE'?'REACTIVATE_AFFILIATION':'REUSE_ACTIVE':'REUSE_ACTIVE';
  return action!=='REUSE_ACTIVE'&&action!=='LEAVE_UNRESOLVED'&&!canMutate?'NO_PERMISSION':action;
}

/** Working host receipt only. No persistence, replay journal or Phase-8 lifecycle. */
export class ContextualPrerequisiteReceipts {
  private receipts=new Map<string,{result:unknown;converged:boolean}>();
  private busy=new Set<string>();
  hasPending(key:string){const receipt=this.receipts.get(key);return Boolean(receipt&&!receipt.converged);}
  pending(key:string){const receipt=this.receipts.get(key);return receipt&&!receipt.converged?receipt.result:undefined;}
  record(key:string,result:unknown){if(!this.receipts.has(key))this.receipts.set(key,{result,converged:false});}
  async converge<T>(key:string,command:()=>Promise<T>,refresh:(result:T)=>Promise<void>,isCurrent:()=>boolean){
    if(this.busy.has(key)||!isCurrent())return false;
    this.busy.add(key);
    try {
      let receipt=this.receipts.get(key);
      if(!receipt){const result=await command();if(!isCurrent())return false;this.record(key,result);receipt=this.receipts.get(key)!;}
      await refresh(receipt.result as T);
      if(!isCurrent())return false;
      receipt.converged=true;return true;
    }finally{this.busy.delete(key);}
  }
}
export function contextualReceiptKey(projectId:string,batchId:string,group:Pick<RosterEntityReviewGroup,'normalizedSourceKey'>,action:string){return JSON.stringify([projectId,batchId,group.normalizedSourceKey,action]);}
export async function inspectContextualIdentity(projectId:string,kind:GlobalKind,natural:string,isCurrent:()=>boolean){
  if(!isCurrent())throw Error('PROJECT_CONTEXT_STALE');
  const naturalKey=normalizeNaturalKey(kind,natural);
  const context=await canonicalRelationshipContextService.getProjectRelationshipContext(projectId,{resolution:true,kind,naturalKey});
  if(!isCurrent())throw Error('PROJECT_CONTEXT_STALE');
  const lookup=context.importResolution?.lookup;
  if(context.projectId!==projectId||context.importResolution?.projectId!==projectId||!lookup||lookup.kind!==kind||lookup.naturalKey!==naturalKey)throw Error('CONTEXT_UNAVAILABLE');
  const targets=context.importResolution.entities.filter(e=>{
    if(e.kind!==kind)return false;
    if(e.id===lookup.matchedId)return true;
    try{return e.naturalKey&&normalizeNaturalKey(kind,e.naturalKey)===naturalKey;}catch{return false;}
  });
  if(targets.length>1||targets.some(e=>e.issue)||targets.length&&!lookup.matchedId)throw Error('CANONICAL_INTEGRITY_ERROR');
  if(lookup.matchedId&&targets.length!==1)throw Error('CONTEXT_UNAVAILABLE');
  return {context,id:lookup.matchedId};
}
export async function refreshContextualPrerequisite(projectId:string,kind:GlobalKind,id:string,isCurrent:()=>boolean){
  const expect=kind==='CARRIER'?{carrierId:id}:kind==='MATERIAL'?{materialId:id}:{};
  const snapshot=await projectCanonicalRefreshService.refresh(projectId,{expect});
  if(!isCurrent())throw Error('PROJECT_CONTEXT_STALE');
  const context=await canonicalRelationshipContextService.getProjectRelationshipContext(projectId,{resolution:true});
  if(!isCurrent())throw Error('PROJECT_CONTEXT_STALE');
  const entity=context.importResolution?.entities.find(e=>e.kind===kind&&e.id===id);
  if(context.projectId!==projectId||context.importResolution?.projectId!==projectId||!entity||entity.issue||entity.globalStatus!=='ACTIVE'||entity.membershipStatus!=='ACTIVE')throw Error('CONTEXT_UNAVAILABLE');
  return {context,snapshot,entity};
}

/** Source suggestions only: an identity number is not evidence of a person's name. */
export function contextualFleetDefaults(batch:UnifiedImportBatch,group:RosterEntityReviewGroup){
 if(group.entityType==='truck')return RosterBatchReviewService.deriveTruckCreationDefaults(batch,group);
 const defaults=RosterBatchReviewService.deriveDriverCreationDefaults(batch,group);
 if(/^[0-9٠-٩\s]+$/.test(defaults.driverName)&&!batch.rows.some(row=>group.rowNumbers.includes(row.rowNumber)&&row.status!=='REJECTED'&&(row.canonical?.driverName||row.mapped?.driverName||row.raw?.driverName||row.raw?.['اسم السائق'])))defaults.driverName='';
 return defaults;
}
