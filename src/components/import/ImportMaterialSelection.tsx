import React,{useState,useRef} from 'react';
import {useI18n} from '../../i18n';
import type {ImportResolutionEntity} from '../../types/importResolution';
import {discoverRosterIdentities} from '../../services/import/rosterBulkClient';
import {entityResolutionCommandService as commands} from '../../services/import/entityResolutionCommand.service';
import {resolutionErrorKey} from '../../i18n/importResolution';
export function ImportMaterialSelection({projectId,materials,onConfirm,onCreate,busy,isCurrent}:{projectId:string;materials:ImportResolutionEntity[];onConfirm:(id:string)=>Promise<void>;onCreate:()=>void;busy:boolean;isCurrent:()=>boolean}){
 const lock=useRef(false);const {t}=useI18n(),active=materials.filter(e=>e.kind==='MATERIAL'&&e.globalStatus==='ACTIVE'&&e.membershipStatus==='ACTIVE'&&e.eligible&&!e.issue);
 const [selected,setSelected]=useState(active.length===1?active[0].id:''),[code,setCode]=useState(''),[pending,setPending]=useState(false),[error,setError]=useState<string|null>(null);
 const [found,setFound]=useState<ImportResolutionEntity|null>(null);
 const run=async(action:()=>Promise<void>)=>{if(lock.current||busy||pending||!isCurrent())return;lock.current=true;setPending(true);setError(null);try{await action();}catch(e){setError(resolutionErrorKey(e));}finally{lock.current=false;setPending(false);}};
 return <section className="p-4 rounded-xl border border-amber-600 space-y-3"><p>{t('import.material.missing')}</p>
 <select aria-label={t('setup.material')} disabled={pending||busy} value={selected} onChange={e=>setSelected(e.target.value)}><option value="">{t('setup.choose')}</option>{active.map(m=><option key={m.id} value={m.id}>{m.name} · {m.id}</option>)}</select>
 <button type="button" disabled={!selected||pending||busy} onClick={()=>void run(()=>onConfirm(selected))}>{t('import.material.confirm')}</button>
 <label>{t('import.material.code')}<input value={code} disabled={pending||busy} onChange={e=>{setCode(e.target.value);setFound(null);}}/></label>
 <button type="button" disabled={!code||pending||busy} onClick={()=>void run(async()=>{const [r]=await discoverRosterIdentities(projectId,[{key:'material',kind:'MATERIAL',naturalKey:code}]);if(!isCurrent())return;if(r.entity&&r.entity.globalStatus==='ACTIVE'&&!r.entity.issue){setFound(r.entity);}else if(r.state==='NOT_FOUND')onCreate();else throw Error('CANONICAL_INTEGRITY_ERROR');})}>{t('import.bulk.discover')}</button>
 {found&&<div>{found.name} · {found.id}<button type="button" disabled={pending||busy} onClick={()=>void run(async()=>{if(!isCurrent())return;const [proof]=await discoverRosterIdentities(projectId,[{key:'material',kind:'MATERIAL',naturalKey:code}]);if(!isCurrent())return;const entity=proof.entity;if(!entity||entity.id!==found.id||entity.globalStatus!=='ACTIVE'||entity.issue)throw Error('CONTEXT_UNAVAILABLE');if(entity.membershipStatus!=='ACTIVE')await commands.membership(projectId,'MATERIAL',entity.id,entity.membershipStatus===null?'ENROLL':'REACTIVATE');if(isCurrent())await onConfirm(entity.id);})}>{t('import.material.confirm')}</button></div>}
 {error&&<p role="alert">{t(error)}</p>}</section>;
}
