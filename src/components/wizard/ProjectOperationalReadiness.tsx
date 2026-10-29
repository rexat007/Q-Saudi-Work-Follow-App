import React,{useEffect,useState} from 'react';
import {auth} from '../../firebase/config';
import {useI18n} from '../../i18n';
import {readinessBlockerKey} from '../../i18n/readinessPresentation';
/** Status and current readiness are different facts; presentation never changes lifecycle. */
export function ProjectOperationalReadiness({projectId,status,scopeKey=''}:{projectId:string;status?:string;scopeKey?:string}){
 const {t}=useI18n(),[state,setState]=useState<{projectId:string;scope:string;data:any}|null>(null);
 useEffect(()=>{let current=true;setState(null);if(!projectId||projectId==='ALL')return;
 (async()=>{try{const token=await auth.currentUser?.getIdToken();if(!token)throw Error('UNAUTHENTICATED');const response=await fetch(`/api/projects/${encodeURIComponent(projectId)}/readiness`,{headers:{Authorization:`Bearer ${token}`}});if(!response.ok)throw Error('READINESS_UNAVAILABLE');const data=await response.json();if(data.projectId!==projectId||!data.operational||typeof data.projectStatus!=='string'||!Array.isArray(data.operational.blockers))throw Error('READINESS_UNAVAILABLE');if(current)setState({projectId,scope:scopeKey,data});}catch{if(current)setState({projectId,scope:scopeKey,data:null});}})();return()=>{current=false;};
 },[projectId,scopeKey,status]);
 if(!projectId||projectId==='ALL')return null;
 const value=state?.projectId===projectId&&state.scope===scopeKey?state.data:null;
 return <section className="rounded border border-stone-600 p-3" aria-label={t('rb2.operational_readiness')}><p>{t('rb2.project_status')}: {value?.projectStatus||status||'—'}</p><p role="status">{t('rb2.operational_readiness')}: {t(!value?'readiness.unavailable':value.operational.ready?'readiness.ready':'readiness.notReady')}</p>{value?.operational.blockers.map((b:any,i:number)=><p key={i}>{t(readinessBlockerKey(b.code))}</p>)}</section>;
}
