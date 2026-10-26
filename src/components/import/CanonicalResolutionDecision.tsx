import React, { useRef, useState } from 'react';
import { useI18n } from '../../i18n';
import type { RelationshipContext } from '../../types/dataQuality';
import type { RosterEntityReviewGroup } from '../../services/import/rosterBatchReview.service';
import { canonicalRelationshipContextService } from '../../services/canonicalRelationshipContext.service';
import { entityResolutionCommandService } from '../../services/import/entityResolutionCommand.service';
import { SetupMutationSession } from '../../services/setupOrchestration.service';
import { resolutionErrorKey } from '../../i18n/importResolution';
export interface CanonicalDecisionProps {
  projectId: string; context: RelationshipContext; group: RosterEntityReviewGroup;
  onSelect: (id: string) => Promise<void>|void; onCreate: () => void;
  onVerified: (context: RelationshipContext, id: string, prerequisite?: string) => Promise<void>|void;
  isCurrent: () => boolean; canMutate?: boolean; carrierId?: string; disabled?: boolean;
}
export function CanonicalResolutionDecision({projectId,context,group,onSelect,onCreate,onVerified,isCurrent,carrierId,disabled,canMutate=true}:CanonicalDecisionProps){
  const {t}=useI18n();const [selected,setSelected]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState<string|null>(null);
  const session=useRef(new SetupMutationSession()).current;
  const entity=group.currentResolution?.canonicalState,reason=group.currentResolution?.resolutionReason;
  const options=context.importResolution?.entities.filter(e=>e.kind===group.entityType.toUpperCase())||[];
  const candidates=[...new Map([...options,...group.candidates.map(c=>c.canonicalState).filter(Boolean)].map(e=>[e.id,e])).values()];
  const action=entity?.globalStatus!=='ACTIVE'||entity?.issue?null:entity.membershipStatus===null?'ENROLL':entity.membershipStatus!=='ACTIVE'?'REACTIVATE':(entity.kind==='DRIVER'||entity.kind==='TRUCK')&&!entity.affiliation&&carrierId?'SET_AFFILIATION':entity.affiliation?.status==='INACTIVE'&&entity.affiliation.carrierId===carrierId?'REACTIVATE_AFFILIATION':null;
  const choose=Boolean(selected&&selected!==entity?.id);
  const create=!entity&&!group.candidates.length&&!selected&&reason!=='CANONICAL_INTEGRITY_ERROR';
  const run=async()=>{
    if(busy||disabled||!isCurrent()||(!choose&&!canMutate))return;
    setBusy(true);setError(null);
    try{
      if(choose){await onSelect(selected);return;}
      if(create){onCreate();return;}
      if(!entity||!action)return;
      let refreshed:RelationshipContext|undefined;
      const ok=await session.run(projectId,async()=>{
        await canonicalRelationshipContextService.getProjectRelationshipContext(projectId,{resolution:true});
        if(!isCurrent())throw Error('PROJECT_CONTEXT_STALE');
        return action==='ENROLL'||action==='REACTIVATE'?entityResolutionCommandService.membership(projectId,entity.kind,entity.id,action):entityResolutionCommandService.affiliation(projectId,entity.kind as 'DRIVER'|'TRUCK',entity.id,carrierId!,action);
      },isCurrent,()=>{},async()=>{
        refreshed=await canonicalRelationshipContextService.getProjectRelationshipContext(projectId,{resolution:true});
        const confirmed=refreshed.importResolution?.entities.find(e=>e.kind===entity.kind&&e.id===entity.id);
        if(!confirmed||confirmed.globalStatus!=='ACTIVE'||confirmed.membershipStatus!=='ACTIVE'||confirmed.issue)throw Error('CONTEXT_UNAVAILABLE');
        if((action==='SET_AFFILIATION'||action==='REACTIVATE_AFFILIATION')&&(confirmed.affiliation?.status!=='ACTIVE'||confirmed.affiliation.carrierId!==carrierId))throw Error('CONTEXT_UNAVAILABLE');
        return {materials:[],carriers:[],fleetRows:[],relationshipContext:refreshed};
      });
      if(ok&&isCurrent()&&refreshed){await onVerified(refreshed,entity.id,action === 'SET_AFFILIATION' ? 'AFFILIATE' : action);if(isCurrent())session.resetCompleted();}
    }catch(e){if(isCurrent())setError(session.committed?'import.resolution.refresh':resolutionErrorKey(e));}
    finally{if(isCurrent())setBusy(false);}
  };
  const currentName=(id:string)=>context.importResolution?.entities.find(e=>e.id===id)?.name||id;
  return <div className="space-y-2 rounded-lg border border-stone-700 bg-stone-900 p-3 text-xs text-stone-100">
    {reason&&reason!=='UNRESOLVED'&&<p>{t(resolutionErrorKey({code:reason}))}</p>}
    {entity&&<div><p>{entity.name} · {entity.id}</p><p>{t('setup.global')}: {t(`setup.status.${entity.globalStatus||'MISSING'}`)} · {t('setup.membership')}: {entity.membershipStatus?t(`setup.status.${entity.membershipStatus}`):t('import.resolution.missing')}</p>
      {entity.affiliation&&<p>{t('setup.carrier')}: {currentName(entity.affiliation.carrierId)} · {t(`setup.status.${entity.affiliation.status}`)}</p>}
      {entity.assignment&&<p>{t('setup.assignment')}: {currentName(entity.assignment.driverId)} → {currentName(entity.assignment.truckId)}</p>}
      {entity.allocation&&<p>{t('setup.allocation')}: {currentName(entity.allocation.materialId)}</p>}
    </div>}
    {!session.committed&&candidates.length>0&&<select aria-label={t('import.resolution.candidate')} className="w-full min-w-0 rounded border border-stone-700 bg-stone-950 p-2" value={selected} disabled={busy||disabled} onChange={e=>setSelected(e.target.value)}><option value="">{t('setup.choose')}</option>{candidates.map(e=><option key={e.id} value={e.id}>{e.name} · {e.id}</option>)}</select>}
    {(choose||create||action||session.committed)&&<button type="button" disabled={busy||disabled||(!choose&&!canMutate)} className="rounded bg-amber-700 px-3 py-2 disabled:opacity-50" onClick={()=>void run()}>{t(busy?'shared.status.loading':session.committed?'setup.retry':choose?'entityResolution.labels.choose_alternative':create?'import.resolution.identify':action==='ENROLL'?'import.resolution.enroll':action==='REACTIVATE'?'import.resolution.reactivate':'import.resolution.affiliation')}</button>}
    {error&&<p role="alert">{t(error)}</p>}
  </div>;
}
