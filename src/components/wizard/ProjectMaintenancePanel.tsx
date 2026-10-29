import React,{useRef,useState} from 'react';
import {useI18n} from '../../i18n';
import {SetupMutationSession,setupCommand} from '../../services/setupOrchestration.service';
import {projectCanonicalRefreshService,type ProjectCanonicalRefreshSnapshot} from '../../services/projectCanonicalRefresh.service';
import {setupErrorKey} from '../../i18n/setupErrors';
import {readinessBlockerKey} from '../../i18n/readinessPresentation';
import type {ProjectEntity} from '../../types/entities';
export function ProjectMaintenancePanel({project,canManage,isCurrent,apply,readiness}:{project:ProjectEntity;canManage:boolean;isCurrent:()=>boolean;apply:(s:ProjectCanonicalRefreshSnapshot)=>void;readiness:any}){
 const {t}=useI18n(),session=useRef(new SetupMutationSession()).current,receipt=useRef<any>(null),draftVersion=useRef((project as any).version||0);
 const [editing,setEditing]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState<string|null>(null),[blockers,setBlockers]=useState<any[]>([]);
 const [values,setValues]=useState(()=>({nameAr:project.nameAr,nameEn:project.nameEn||'',clientName:project.clientName,description:project.description||''}));
 const run=async(action:'PROFILE'|'SUSPEND'|'REACTIVATE')=>{if(!isCurrent())return;setBusy(true);setError(null);setBlockers([]);
 try{const ok=await session.run(project.projectId,async()=>{const result=await setupCommand(project.projectId,action==='PROFILE'?'foundation':action==='SUSPEND'?'lifecycle-transition':'reactivate',action==='PROFILE'?{updates:values,expectedVersion:draftVersion.current}:action==='SUSPEND'?{targetStatus:'SUSPENDED'}:{});receipt.current={action,result};return result;},isCurrent,apply,async()=>{
 const s=await projectCanonicalRefreshService.refresh(project.projectId,{isCurrent});
 const a=receipt.current.action;if(a==='PROFILE'&&Object.entries(values).some(([k,v])=>s.project?.[k]!==v)||a==='SUSPEND'&&s.project?.status!=='SUSPENDED'||a==='REACTIVATE'&&s.project?.status!=='ACTIVE')throw Object.assign(Error('REFRESH_INCOHERENT'),{code:'REFRESH_INCOHERENT'});return s;
 });if(ok&&isCurrent()){session.resetCompleted();setEditing(false);receipt.current=null;}}
 catch(e:any){if(isCurrent()){setError(session.committed?'rb2.refresh_pending':setupErrorKey(e));setBlockers(e.blockers||[]);}}
 finally{if(isCurrent())setBusy(false);}
 };
 return <section className="space-y-2 rounded border border-stone-700 p-3" aria-label={t('rb2.maintenance')}>
 <p>{t('rb2.project_status')}: {project.status}</p><p role="status">{t('rb2.operational_readiness')}: {t(!readiness?'readiness.unavailable':readiness.operational?.ready?'readiness.ready':'readiness.notReady')}</p>
 {readiness?.operational?.blockers?.map((b:any,i:number)=><p key={i}>{t(readinessBlockerKey(b.code))}</p>)}
 {canManage&&<div className="flex flex-wrap gap-3">{project.status==='ACTIVE'&&<><button disabled={busy||session.committed} onClick={()=>{draftVersion.current=(project as any).version||0;setValues({nameAr:project.nameAr,nameEn:project.nameEn||'',clientName:project.clientName,description:project.description||''});setEditing(v=>!v);}}>{t('rb2.maintenance')}</button><button disabled={busy||session.committed} onClick={()=>void run('SUSPEND')}>{t('rb2.suspend')}</button></>}{project.status==='SUSPENDED'&&<button disabled={busy||session.committed} onClick={()=>void run('REACTIVATE')}>{t('rb2.reactivate')}</button>}</div>}
 {editing&&canManage&&<form className="space-y-2" onSubmit={e=>{e.preventDefault();void run('PROFILE');}}>{Object.keys(values).map(k=><label key={k} className="block">{t(`rb2.field.${k}`)}<input className="block w-full bg-stone-950 p-2" value={values[k as keyof typeof values]} disabled={busy||session.committed} onChange={e=>setValues(v=>({...v,[k]:e.target.value}))}/></label>)}<button disabled={busy||session.committed}>{t('shared.actions.confirm')}</button></form>}
 {error&&<p role="alert">{t(error)}</p>}{blockers.map((b,i)=><p key={i}>{t(readinessBlockerKey(b.code))}</p>)}
 {session.committed&&<button disabled={busy} onClick={()=>void run(receipt.current.action)}>{t('setup.retry')}</button>}
 </section>;
}
