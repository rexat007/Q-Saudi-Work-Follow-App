import React,{useMemo,useState} from 'react';
import {useI18n} from '../../i18n';
import {CarrierEditorModal} from '../masterData/CarrierEditorModal';
import {MaterialEditorModal} from '../masterData/MaterialEditorModal';
import {CanonicalFleetIdentityEditor,type FleetIdentityInput} from '../masterData/CanonicalFleetIdentityEditor';
import {useProjectEditorLifetime} from '../wizard/useProjectEditorLifetime';
import {RosterBatchReviewService,type RosterEntityReviewGroup} from '../../services/import/rosterBatchReview.service';
import {contextualFleetDefaults,ContextualPrerequisiteReceipts,contextualReceiptKey,inspectContextualIdentity,refreshContextualPrerequisite} from '../../services/import/contextualCanonicalCreation.service';
import {entityResolutionCommandService} from '../../services/import/entityResolutionCommand.service';
import type {RelationshipContext} from '../../types/dataQuality';
import type {UnifiedImportBatch} from '../../types/unifiedImport';
import type {ProjectCanonicalRefreshSnapshot} from '../../services/projectCanonicalRefresh.service';
import {resolutionErrorKey} from '../../i18n/importResolution';
import type {GlobalKind} from '../../utils/globalIdentityPolicy';

export function contextualPrefill(batch:UnifiedImportBatch,group:RosterEntityReviewGroup){
 const rows=batch.rows.filter(r=>r.status!=='REJECTED'&&RosterBatchReviewService.getGroupKey(r,group.entityType)===group.normalizedSourceKey);
 const consensus=(field:string)=>{const values=[...new Set(rows.map(r=>r.canonical?.[field]??r.mapped?.[field]??r.raw?.[field]).filter(v=>v!==undefined&&v!==null&&v!==''))];return values.length===1?values[0]:undefined;};
 const sourceName=consensus(group.entityType==='material'?'materialName':'carrierName')||consensus(group.entityType==='material'?'materialType':'carrier');
 const natural=consensus(group.entityType==='material'?'materialCode':'commercialRegistrationNo');
 return {name:sourceName||(natural?'':group.sourceValue),commercialRegistrationNo:consensus('commercialRegistrationNo'),transportLicenseNo:consensus('transportLicenseNo'),contactPersonName:consensus('contactPersonName'),contactPhone:consensus('contactPhone'),contactEmail:consensus('contactEmail'),code:consensus('materialCode'),unitOfMeasure:consensus('unitOfMeasure'),standardDensityTonPerM3:consensus('standardDensityTonPerM3')};
}
interface Receipt {kind:GlobalKind;entityId:string}
export function ContextualCanonicalCreation({projectId,batch,group,context,receipts,isCurrent,onClose,onVerified,canMutate,onPrepare}:{
 projectId:string;batch:UnifiedImportBatch;group:RosterEntityReviewGroup;context:RelationshipContext;receipts:ContextualPrerequisiteReceipts;isCurrent:()=>boolean;onClose:()=>void;canMutate:boolean;
 onVerified:(fresh:RelationshipContext,id:string,prerequisite?:string,snapshot?:ProjectCanonicalRefreshSnapshot)=>Promise<void>|void;
 onPrepare?:(data:FleetIdentityInput)=>Promise<void>;
}){
 const {t}=useI18n(),life=useProjectEditorLifetime(projectId,true,isCurrent);
 const scope=contextualReceiptKey(projectId,batch.importBatchId,group,'CREATE');
 const [pending,setPending]=useState<Receipt|undefined>(()=>receipts.pending(scope) as Receipt|undefined),[busy,setBusy]=useState(false),[error,setError]=useState<string|null>(null);
 const kind=group.entityType.toUpperCase() as GlobalKind;
 const prefill=useMemo(()=>contextualPrefill(batch,group),[batch,group.normalizedSourceKey]);
 const converge=async(receipt:Receipt)=>{
  const request=life.capture(),current=()=>life.isCurrent(request);if(!current())return;
  receipts.record(scope,receipt);setPending(receipt);setBusy(true);setError(null);
  try{await receipts.converge(scope,async()=>receipt,async(value:Receipt)=>{
   const {context:fresh,snapshot}=await refreshContextualPrerequisite(projectId,value.kind,value.entityId,current);
   if(current())await onVerified(fresh,value.entityId,'CREATE',snapshot);
  },current);if(current())onClose();}
  catch(e){if(current())setError('import.resolution.refresh');throw e;}finally{if(current())setBusy(false);}
 };
 const beforeCreate=async(natural:string)=>{
  if(!canMutate)throw Error('FORBIDDEN');if(group.currentResolution?.ambiguous||group.currentResolution?.resolutionReason==='CANONICAL_INTEGRITY_ERROR')throw Error('CANONICAL_INTEGRITY_ERROR');
  const request=life.capture(),current=()=>life.isCurrent(request);
  const lookup=await inspectContextualIdentity(projectId,kind,natural,current);
  if(lookup.id){await onVerified(lookup.context,lookup.id);if(current())onClose();return false;}return current();
 };
 if(!canMutate)return <p>{t('import.context.noPermission')}</p>;
 if(pending)return <div role="dialog" aria-modal="true" aria-label={t('setup.retry')} className="fixed inset-0 z-60 flex items-center justify-center bg-stone-950/80 p-4"><div className="w-full max-w-lg rounded-xl bg-stone-900 p-4 text-stone-100 space-y-3"><p>{t('import.resolution.refresh')}</p>{error&&<p role="alert">{t(error)}</p>}<button disabled={busy} onClick={()=>void converge(pending).catch(()=>{})}>{t('setup.retry')}</button><button disabled={busy} onClick={onClose}>{t('shared.actions.close')}</button></div></div>;
 if(kind==='CARRIER')return <CarrierEditorModal open mode="CREATE" projectId={projectId} zIndexClass="z-60" initialName={prefill.name} initialCreateValues={prefill} isCurrent={isCurrent} beforeCreate={beforeCreate} onClose={onClose} onCreated={async result=>{if(!result.success||result.projectId!==projectId)throw Error('CONTEXT_UNAVAILABLE');await converge({kind,entityId:result.carrierId});}}/>;
 if(kind==='MATERIAL')return <MaterialEditorModal open mode="CREATE" projectId={projectId} zIndexClass="z-60" initialName={prefill.name} initialCreateValues={prefill} isCurrent={isCurrent} beforeCreate={beforeCreate} onClose={onClose} onCreated={async result=>{if(!result.success||result.projectId!==projectId)throw Error('CONTEXT_UNAVAILABLE');await converge({kind,entityId:result.materialId});}}/>;
 const defaults=contextualFleetDefaults(batch,group);
 const carriers=(context.importResolution?.entities||[]).filter(e=>e.kind==='CARRIER'&&e.globalStatus==='ACTIVE'&&e.membershipStatus==='ACTIVE'&&!e.issue);
 return <CanonicalFleetIdentityEditor projectId={projectId} kind={kind as 'DRIVER'|'TRUCK'} initialValues={defaults} conflicts={defaults.conflicts} carriers={carriers} isCurrent={isCurrent} onClose={onClose} planned={Boolean(onPrepare)} onSubmit={async data=>{
  const request=life.capture(),current=()=>life.isCurrent(request);
  if(!(await beforeCreate(kind==='DRIVER'?data.residencyId:data.plateNumber))||!current())return false;
  if(onPrepare){await onPrepare(data);return;}
  const result=kind==='DRIVER'?await entityResolutionCommandService.createDriver({projectId,sourceValue:group.sourceValue,driverData:data}):await entityResolutionCommandService.createTruck({projectId,sourceValue:group.sourceValue,truckData:data});
  if(current())await converge({kind,entityId:result.matchedId});
 }}/>;
}
