import React,{useState,useEffect,useRef} from 'react';
import {clientWorkspaceService} from '../../services/workspace.service';
import {useI18n} from '../../i18n';
export function WorkspaceAutomationRecovery({projectId,onRecovered}:{projectId:string;onRecovered:()=>void}){
 const alive=useRef(true);useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[projectId]);
 const {t}=useI18n(),[id,setId]=useState(''),[busy,setBusy]=useState(false),[failed,setFailed]=useState(false);
 return <div className="border rounded p-3 space-y-2"><p>{t('op.recovery_help')}</p><label>{t('op.script_id')}<input value={id} disabled={busy} onChange={e=>setId(e.target.value)} className="bg-stone-900 block w-full"/></label><button type="button" disabled={busy||!id.trim()} onClick={async()=>{setBusy(true);setFailed(false);try{await clientWorkspaceService.requestGoogleScopes(true);if(!alive.current)return;await clientWorkspaceService.recoverWorkspaceAutomation(projectId,id.trim());if(alive.current){onRecovered();setId('');}}catch{if(alive.current)setFailed(true);}finally{if(alive.current)setBusy(false);}}}>{t('op.recover')}</button>{failed&&<p role="alert">{t('op.recovery_failed')}</p>}</div>;
}
