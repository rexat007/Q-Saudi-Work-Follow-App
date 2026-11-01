import {authorizeBoundWorkspaceExecution} from '../../utils/workspaceAuthorization';
import {workspaceDestinationMessageKey} from '../../utils/googleWorkspaceErrors';
import React,{useState,useEffect,useRef} from 'react';
import {clientWorkspaceService} from '../../services/workspace.service';
import {useI18n} from '../../i18n';
export function WorkspaceAutomationRecovery({projectId,onRecovered}:{projectId:string;onRecovered:()=>void}){
 const alive=useRef(true);useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[projectId]);
 const {t}=useI18n(),[id,setId]=useState(''),[busy,setBusy]=useState(false),[failureKey,setFailureKey]=useState<string|null>(null);
 return <div className="border rounded p-3 space-y-2"><p>{t('op.recovery_help')}</p><label>{t('op.script_id')}<input value={id} disabled={busy} onChange={e=>setId(e.target.value)} className="bg-stone-900 block w-full"/></label><button type="button" disabled={busy||!id.trim()} onClick={async()=>{setBusy(true);setFailureKey(null);try{await authorizeBoundWorkspaceExecution(projectId,clientWorkspaceService,()=>alive.current);if(!alive.current)return;await clientWorkspaceService.recoverWorkspaceAutomation(projectId,id.trim());if(alive.current){onRecovered();setId('');}}catch(error){if(alive.current)setFailureKey(workspaceDestinationMessageKey(error instanceof Error?error.message:'')||'op.recovery_failed');}finally{if(alive.current)setBusy(false);}}}>{t('op.recover')}</button>{failureKey&&<p role="alert">{t(failureKey)}</p>}</div>;
}
