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
  beginCommand?: () => (() => void) | null;
  receipts?: ContextualPrerequisiteReceipts; receiptScope?: string;
  projectId: string; context: RelationshipContext; group: RosterEntityReviewGroup;
  onSelect: (id: string) => Promise<void>|void; onCreate: () => void;
  onVerified: (context: RelationshipContext, id: string, prerequisite?: string) => Promise<void>|void;
  isCurrent: () => boolean; canMutate?: boolean; carrierId?: string; disabled?: boolean;
}
export function CanonicalResolutionDecision({projectId,context,group,onSelect,onCreate,onVerified,isCurrent,carrierId,disabled,canMutate=true,receipts,receiptScope='working',beginCommand}:CanonicalDecisionProps){
  const lock=useRef(false);
  const [query,setQuery]=useState('');
  const {t}=useI18n();const [selected,setSelected]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState<string|null>(null);
  const localReceipts=useRef(new ContextualPrerequisiteReceipts()).current;
  const ledger=receipts||localReceipts, life=useProjectEditorLifetime(projectId,true,isCurrent);
  const entity=context.importResolution?.entities.find(e=>e.kind===group.entityType.toUpperCase()&&e.id===(group.matchedId||group.currentResolution?.matchedId||group.currentResolution?.canonicalState?.id)),reason=group.currentResolution?.resolutionReason;
  const options=context.importResolution?.entities.filter(e=>e.kind===group.entityType.toUpperCase())||[];
  const candidates=[...new Map([...options,...group.candidates.map(c=>c.canonicalState).filter(Boolean)].map(e=>[e.id,e])).values()];
  const search=query.trim().toLocaleLowerCase();
  const filtered=candidates.filter(e=>!search||`${e.name} ${e.id} ${e.naturalKey||''}`.toLocaleLowerCase().includes(search));
  const visibleCandidates=filtered.slice(0,100);
  const chosen=candidates.find(e=>e.id===selected);if(chosen&&!visibleCandidates.includes(chosen))visibleCandidates.push(chosen);
  const state=contextualAction(entity?{...group,currentResolution:{...group.currentResolution!,canonicalState:entity}}:group,canMutate,carrierId);
  const action=state==='ENROLL_EXISTING'?'ENROLL':state==='REACTIVATE_MEMBERSHIP'?'REACTIVATE':state==='SET_AFFILIATION'?'SET_AFFILIATION':state==='REACTIVATE_AFFILIATION'?'REACTIVATE_AFFILIATION':null;
  const key=contextualReceiptKey(projectId,receiptScope,{normalizedSourceKey:entity?`${entity.kind}:${entity.id}`:group.normalizedSourceKey},action||'NONE');
  const committed=ledger.hasPending(key);
  const choose=Boolean(selected&&state!=='BLOCKED_BY_INTEGRITY');
  const create=state==='CREATE_NEW'&&!selected;
  const run=async()=>{
    if(lock.current||busy||disabled||!isCurrent()||state==='BLOCKED_BY_INTEGRITY'||(!choose&&!canMutate))return;
    const release=beginCommand?.(); if(beginCommand&&!release)return; lock.current=true;
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
    finally{lock.current=false;release?.();if(current())setBusy(false);}
  };
  const currentName=(id:string)=>context.importResolution?.entities.find(e=>e.id===id)?.name||id;
  return <div className="space-y-2 rounded-xl border border-stone-700 bg-stone-900 p-3 text-xs text-stone-200">
    {state==='LEAVE_UNRESOLVED'&&!reason&&<p className="text-amber-300/90 text-xs">{t(entity?.globalStatus!=='ACTIVE'?'import.resolution.ineligible':entity?.affiliation?'import.resolution.affiliationConflict':'import.resolution.context')}</p>}
    {state==='NO_PERMISSION'&&<p className="text-amber-400 text-xs font-semibold">{t('import.context.noPermission')}</p>}
    {reason&&reason!=='UNRESOLVED'&&<p className="text-rose-400 text-xs font-semibold">{t(resolutionErrorKey({code:reason}))}</p>}
    {entity&&<div className="space-y-1 text-xs"><p className="font-bold text-white">{entity.name} · <span className="font-mono text-stone-400">{entity.id}</span></p><p className="text-stone-400">{t('setup.global')}: <span className="text-stone-300">{t(`setup.status.${entity.globalStatus||'MISSING'}`)}</span> · {t('setup.membership')}: <span className="text-stone-300">{entity.membershipStatus?t(`setup.status.${entity.membershipStatus}`):t('import.resolution.missing')}</span></p>
      {entity.affiliation&&<p className="text-stone-400">{t('setup.carrier')}: <span className="text-stone-300">{currentName(entity.affiliation.carrierId)}</span> · <span className="text-stone-300">{t(`setup.status.${entity.affiliation.status}`)}</span></p>}
      {entity.assignment&&<p className="text-stone-400">{t('setup.assignment')}: <span className="text-stone-300">{currentName(entity.assignment.driverId)} → {currentName(entity.assignment.truckId)}</span></p>}
      {entity.allocation&&<p className="text-stone-400">{t('setup.allocation')}: <span className="text-stone-300">{currentName(entity.allocation.materialId)}</span></p>}
    </div>}
    {!committed&&candidates.length>100&&<label className="block text-xs font-bold text-stone-300 space-y-1">{t('import.assurance.search')}<input type="search" value={query} onChange={e=>setQuery(e.target.value)} className="w-full min-w-0 bg-stone-950 border border-stone-700 text-stone-100 placeholder:text-stone-500 rounded-lg p-2 text-xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500"/><small className="text-[10px] text-stone-400 font-mono block">{t('import.assurance.options',{count:visibleCandidates.length})}</small></label>}
    {!committed&&candidates.length>0&&<select aria-label={t('import.resolution.candidate')} className="w-full min-w-0 rounded-lg border border-stone-700 bg-stone-950 text-stone-100 p-2 text-xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500 disabled:opacity-40 disabled:text-stone-400" value={selected} disabled={busy||disabled||state==='BLOCKED_BY_INTEGRITY'} onChange={e=>setSelected(e.target.value)}><option value="" className="bg-stone-900 text-stone-300">{t('setup.choose')}</option>{visibleCandidates.map(e=><option key={e.id} value={e.id} className="bg-stone-900 text-stone-100">{e.name} · {e.id}</option>)}</select>}
    {(choose||create||action||committed)&&<button type="button" disabled={busy||disabled||(!choose&&!canMutate)} className="w-full sm:w-auto rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold px-4 py-2 text-xs disabled:bg-stone-800 disabled:text-stone-400 disabled:opacity-50 transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-400 break-words" onClick={()=>void run()}>{t(busy?'shared.status.loading':committed?'setup.retry':choose?(selected===entity?.id?'entityResolution.labels.accept_suggested_match':'entityResolution.labels.choose_alternative'):create?'import.resolution.identify':action==='ENROLL'?'import.resolution.enroll':action==='REACTIVATE'?'import.resolution.reactivate':'import.resolution.affiliation')}</button>}
    {error&&<p role="alert" className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs font-mono">{t(error)}</p>}
  </div>;
}
