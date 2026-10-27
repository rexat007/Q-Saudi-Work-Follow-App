import React, { useRef, useState } from 'react';
import { useI18n } from '../../i18n';
import type { RelationshipContext } from '../../types/dataQuality';
import type { RosterEntityReviewGroup } from '../../services/import/rosterBatchReview.service';
import { canonicalRelationshipContextService } from '../../services/canonicalRelationshipContext.service';
import { entityResolutionCommandService } from '../../services/import/entityResolutionCommand.service';
import { ContextualPrerequisiteReceipts, contextualAction, contextualReceiptKey, refreshContextualPrerequisite } from '../../services/import/contextualCanonicalCreation.service';
import { useProjectEditorLifetime } from '../wizard/useProjectEditorLifetime';
import { resolutionErrorKey } from '../../i18n/importResolution';
export interface CanonicalDecisionProps {
  receipts?: ContextualPrerequisiteReceipts; receiptScope?: string;
  projectId: string; context: RelationshipContext; group: RosterEntityReviewGroup;
  onSelect: (id: string) => Promise<void>|void; onCreate: () => void;
  onVerified: (context: RelationshipContext, id: string, prerequisite?: string) => Promise<void>|void;
  isCurrent: () => boolean; canMutate?: boolean; carrierId?: string; disabled?: boolean;
}
export function CanonicalResolutionDecision({projectId,context,group,onSelect,onCreate,onVerified,isCurrent,carrierId,disabled,canMutate=true,receipts,receiptScope='working'}:CanonicalDecisionProps){
  const {t}=useI18n();const [selected,setSelected]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState<string|null>(null);
  const localReceipts=useRef(new ContextualPrerequisiteReceipts()).current;
  const ledger=receipts||localReceipts, life=useProjectEditorLifetime(projectId,true,isCurrent);
  const entity=context.importResolution?.entities.find(e=>e.kind===group.entityType.toUpperCase()&&e.id===(group.matchedId||group.currentResolution?.matchedId||group.currentResolution?.canonicalState?.id)),reason=group.currentResolution?.resolutionReason;
  const options=context.importResolution?.entities.filter(e=>e.kind===group.entityType.toUpperCase())||[];
  const candidates=[...new Map([...options,...group.candidates.map(c=>c.canonicalState).filter(Boolean)].map(e=>[e.id,e])).values()];
  const state=contextualAction(entity?{...group,currentResolution:{...group.currentResolution!,canonicalState:entity}}:group,canMutate,carrierId);
  const action=state==='ENROLL_EXISTING'?'ENROLL':state==='REACTIVATE_MEMBERSHIP'?'REACTIVATE':state==='SET_AFFILIATION'?'SET_AFFILIATION':state==='REACTIVATE_AFFILIATION'?'REACTIVATE_AFFILIATION':null;
  const key=contextualReceiptKey(projectId,receiptScope,{normalizedSourceKey:entity?`${entity.kind}:${entity.id}`:group.normalizedSourceKey},action||'NONE');
  const committed=ledger.hasPending(key);
  const choose=Boolean(selected&&state!=='BLOCKED_BY_INTEGRITY');
  const create=state==='CREATE_NEW'&&!selected;
  const run=async()=>{
    if(busy||disabled||!isCurrent()||state==='BLOCKED_BY_INTEGRITY'||(!choose&&!canMutate))return;
    const request=life.capture(),current=()=>life.isCurrent(request);
    setBusy(true);setError(null);
    try{
      if(choose){await onSelect(selected);return;}
      if(create){onCreate();return;}
      if(!entity||!action)return;
      await ledger.converge(key,async()=>{
        await canonicalRelationshipContextService.getProjectRelationshipContext(projectId,{resolution:true});
        if(!current())throw Error('PROJECT_CONTEXT_STALE');
        return action==='ENROLL'||action==='REACTIVATE'?entityResolutionCommandService.membership(projectId,entity.kind,entity.id,action):entityResolutionCommandService.affiliation(projectId,entity.kind as 'DRIVER'|'TRUCK',entity.id,carrierId!,action);
      },async()=>{
        const {context:fresh,entity:confirmed}=await refreshContextualPrerequisite(projectId,entity.kind,entity.id,current);
        if((action==='SET_AFFILIATION'||action==='REACTIVATE_AFFILIATION')&&(confirmed.affiliation?.status!=='ACTIVE'||confirmed.affiliation.carrierId!==carrierId))throw Error('CONTEXT_UNAVAILABLE');
        if(current())await onVerified(fresh,entity.id,action==='SET_AFFILIATION'?'AFFILIATE':action);
      },current);
    }catch(e){if(current())setError(ledger.hasPending(key)?'import.resolution.refresh':resolutionErrorKey(e));}
    finally{if(current())setBusy(false);}
  };
  const currentName=(id:string)=>context.importResolution?.entities.find(e=>e.id===id)?.name||id;
  return <div className="space-y-2 rounded-lg border border-stone-700 bg-stone-900 p-3 text-xs text-stone-100">
    {state==='LEAVE_UNRESOLVED'&&!reason&&<p>{t(entity?.globalStatus!=='ACTIVE'?'import.resolution.ineligible':entity?.affiliation?'import.resolution.affiliationConflict':'import.resolution.context')}</p>}
    {state==='NO_PERMISSION'&&<p>{t('import.context.noPermission')}</p>}
    {reason&&reason!=='UNRESOLVED'&&<p>{t(resolutionErrorKey({code:reason}))}</p>}
    {entity&&<div><p>{entity.name} · {entity.id}</p><p>{t('setup.global')}: {t(`setup.status.${entity.globalStatus||'MISSING'}`)} · {t('setup.membership')}: {entity.membershipStatus?t(`setup.status.${entity.membershipStatus}`):t('import.resolution.missing')}</p>
      {entity.affiliation&&<p>{t('setup.carrier')}: {currentName(entity.affiliation.carrierId)} · {t(`setup.status.${entity.affiliation.status}`)}</p>}
      {entity.assignment&&<p>{t('setup.assignment')}: {currentName(entity.assignment.driverId)} → {currentName(entity.assignment.truckId)}</p>}
      {entity.allocation&&<p>{t('setup.allocation')}: {currentName(entity.allocation.materialId)}</p>}
    </div>}
    {!committed&&candidates.length>0&&<select aria-label={t('import.resolution.candidate')} className="w-full min-w-0 rounded border border-stone-700 bg-stone-950 p-2" value={selected} disabled={busy||disabled||state==='BLOCKED_BY_INTEGRITY'} onChange={e=>setSelected(e.target.value)}><option value="">{t('setup.choose')}</option>{candidates.map(e=><option key={e.id} value={e.id}>{e.name} · {e.id}</option>)}</select>}
    {(choose||create||action||committed)&&<button type="button" disabled={busy||disabled||(!choose&&!canMutate)} className="rounded bg-amber-700 px-3 py-2 disabled:opacity-50" onClick={()=>void run()}>{t(busy?'shared.status.loading':committed?'setup.retry':choose?(selected===entity?.id?'entityResolution.labels.accept_suggested_match':'entityResolution.labels.choose_alternative'):create?'import.resolution.identify':action==='ENROLL'?'import.resolution.enroll':action==='REACTIVATE'?'import.resolution.reactivate':'import.resolution.affiliation')}</button>}
    {error&&<p role="alert">{t(error)}</p>}
  </div>;
}
