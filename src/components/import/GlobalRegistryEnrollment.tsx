import React,{useState,useRef} from 'react';
import {useI18n} from '../../i18n';
import {discoverRosterIdentities} from '../../services/import/rosterBulkClient';
import {entityResolutionCommandService as commands} from '../../services/import/entityResolutionCommand.service';
import type {ImportResolutionEntity} from '../../types/importResolution';
import {resolutionErrorKey} from '../../i18n/importResolution';
export function GlobalRegistryEnrollment({projectId,kind,isCurrent,onChanged}:{projectId:string;kind:'CARRIER'|'MATERIAL';isCurrent:()=>boolean;onChanged:()=>Promise<void>}){
 const lock=useRef(false);const {t}=useI18n();const [natural,setNatural]=useState(''),[entity,setEntity]=useState<ImportResolutionEntity|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState<string|null>(null);
 const run=async(enroll=false)=>{if(lock.current||busy||!isCurrent())return;lock.current=true;setBusy(true);setError(null);try{
  if(!enroll){const [result]=await discoverRosterIdentities(projectId,[{key:kind,kind,naturalKey:natural}]);if(!isCurrent())return;
   if(result.entity&&result.entity.globalStatus==='ACTIVE'&&!result.entity.issue)setEntity(result.entity);else throw Error(result.state==='NOT_FOUND'?'GLOBAL_ENTITY_NOT_FOUND':'CANONICAL_INTEGRITY_ERROR');
  }else if(entity){const [proof]=await discoverRosterIdentities(projectId,[{key:kind,kind,naturalKey:natural}]);if(!isCurrent())return;const fresh=proof.entity;if(!fresh||fresh.id!==entity.id||fresh.globalStatus!=='ACTIVE'||fresh.issue)throw Error('CONTEXT_UNAVAILABLE');if(fresh.membershipStatus!=='ACTIVE')await commands.membership(projectId,kind,fresh.id,fresh.membershipStatus===null?'ENROLL':'REACTIVATE');if(isCurrent()){await onChanged();setEntity(null);}}
 }catch(e){if(isCurrent())setError(resolutionErrorKey(e));}finally{lock.current=false;if(isCurrent())setBusy(false);}};
 return <section className="rounded-xl border border-stone-700 p-3 space-y-2"><label>{t('import.registry.lookup')}<input value={natural} disabled={busy} onChange={e=>{setNatural(e.target.value);setEntity(null);}}/></label><button type="button" disabled={!natural||busy} onClick={()=>void run()}>{t('import.bulk.discover')}</button>{entity&&<p>{entity.name} · {entity.id}<button type="button" disabled={busy} onClick={()=>void run(true)}>{t(entity.membershipStatus==='ACTIVE'?'shared.actions.confirm':entity.membershipStatus===null?'import.resolution.enroll':'import.resolution.reactivate')}</button></p>}{error&&<p role="alert">{t(error)}</p>}</section>;
}
