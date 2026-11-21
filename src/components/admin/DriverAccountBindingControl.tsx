import React,{useEffect,useRef,useState} from 'react';
import {useI18n} from '../../i18n';
import {listDriverIdentities,adminErrorKey,type AdminAccountCommand} from '../../services/adminAccountClient.service';
import type {UserEntity} from '../../types/entities';
export function DriverAccountBindingControl({target,isCurrent,disabled,onDecision}:{target:UserEntity;isCurrent:()=>boolean;disabled:boolean;onDecision:(command:AdminAccountCommand)=>Promise<void>}){
 const {t}=useI18n();const [drivers,setDrivers]=useState<Awaited<ReturnType<typeof listDriverIdentities>>>([]),[selection,setSelection]=useState(target.linkedDriverId||''),[state,setState]=useState<'loading'|'ready'|'error'>('loading'),[revision,setRevision]=useState(0),[error,setError]=useState('');
 const lock=useRef(false);
 useEffect(()=>{let active=true;setState('loading');setSelection(target.linkedDriverId||'');setError('');
  listDriverIdentities().then(next=>{if(active&&isCurrent()){setDrivers(next);setState('ready');}}).catch(e=>{if(active&&isCurrent()){setState('error');setError(adminErrorKey(e));}});
  return()=>{active=false;};
 },[target.userId,target.linkedDriverId,revision]);
 const update=async(unlink:boolean)=>{if(lock.current||disabled||state!=='ready'||!isCurrent())return;lock.current=true;try{await onDecision(unlink?{command:'unlinkDriverIdentity'}:{command:'linkDriverIdentity',linkedDriverId:selection});}finally{lock.current=false;}};
 return <section className="space-y-2 rounded-xl border p-3"><h4>{t('admin_console.driver_binding')}</h4><p><bdi>{target.linkedDriverId||t('admin_console.driver_not_linked')}</bdi></p>
  {state==='loading'&&<p role="status">{t('ui5.loading')}</p>}{error&&<p role="alert">{t(error)}</p>}{state==='error'&&<button disabled={disabled} onClick={()=>setRevision(n=>n+1)}>{t('ui5.reload')}</button>}
  <label>{t('admin_console.driver_choose')}<select aria-label={t('admin_console.driver_binding')} value={selection} disabled={disabled||state!=='ready'} onChange={e=>setSelection(e.target.value)}><option value="">{t('admin_console.driver_choose')}</option>{drivers.map(driver=><option key={driver.driverId} value={driver.driverId}>{driver.fullNameAr} — {driver.driverId}</option>)}</select></label>
  <button disabled={disabled||state!=='ready'||!selection} onClick={()=>void update(false)}>{t('admin_console.driver_link')}</button><button disabled={disabled||state!=='ready'||!target.linkedDriverId} onClick={()=>void update(true)}>{t('admin_console.driver_unlink')}</button>
 </section>;
}
