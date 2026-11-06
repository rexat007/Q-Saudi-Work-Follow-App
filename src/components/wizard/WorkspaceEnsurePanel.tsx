import {readWorkspaceContinuation,clearWorkspaceContinuation,claimWorkspaceAutomaticResume} from '../../runtime/workspaceProvisioningResume';
import {CLIENT_BUILD_ID} from '../../runtime/runtimeGeneration';
import React, { useEffect, useRef, useState } from 'react';
import { clientWorkspaceService } from '../../services/workspace.service';
import { runWorkspaceEnsureJourney, type WorkspaceEnsureClient } from '../../utils/workspaceEnsureJourney';
import type { WorkspaceEnsureStatus } from '../../types/workspaceProvisioning';
interface Props {actorId?:string;projectId:string;t:(key:string)=>string;onReady?:()=>void;service?:WorkspaceEnsureClient}
const progressKeys={AUTHORIZATION:'gws.one.phase_authorization',BINDING:'gws.one.phase_binding',WORKBOOK:'gws.one.phase_workbook',MASTER_DATA:'gws.one.phase_master_data',SCRIPT:'gws.one.phase_script',FINAL_VERIFY:'gws.one.phase_final_verify'};
const stateKey={NOT_CONFIGURED:'gws.one.not_configured',PREPARING:'gws.one.preparing',ACTION_REQUIRED:'gws.one.action_required',READY:'gws.one.ready',ATTENTION_REQUIRED:'gws.one.attention_required'};
// Module-level owner-aware lock map to prevent multiple panels from polling the same project simultaneously
const activeProjectObservationOwners = new Map<string, symbol>();

/** One serialized read observer; automatic resume is once per durable progress/build. */
export function WorkspaceEnsurePanel({projectId,actorId='',t,onReady,service=clientWorkspaceService}:Props){
 const [status,setStatus]=useState<WorkspaceEnsureStatus|null>(null),[busy,setBusy]=useState(false),[failure,setFailure]=useState(false);
 const [quotaExhausted,setQuotaExhausted]=useState(false);
 const [syncState,setSyncState]=useState<'IDLE'|'SYNCING'|'SUCCESS'|'FAILURE'>('IDLE');
 const active=useRef(0),running=useRef(false),observing=useRef(false),generationBlocked=useRef(false),ready=useRef(onReady),timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined),transport=useRef<AbortController|undefined>(undefined),interaction=useRef<(()=>void)|undefined>(undefined);
 ready.current=onReady;
 useEffect(()=>{
  const generation=++active.current;
  const ownerToken=Symbol('panel-owner');
  let polls=0;running.current=false;observing.current=false;generationBlocked.current=false;setBusy(false);setFailure(false);setQuotaExhausted(false);setSyncState('IDLE');setStatus(null);
  const observe=async()=>{
   if(generationBlocked.current||running.current||observing.current||active.current!==generation)return;
   const currentOwner=activeProjectObservationOwners.get(projectId);
   if(currentOwner && currentOwner!==ownerToken)return;
   observing.current=true;
   activeProjectObservationOwners.set(projectId,ownerToken);
   try{
    const controller=new AbortController();transport.current=controller;
    const value=await service.observeWorkspaceProvisioning(projectId,controller.signal);if(active.current!==generation||running.current)return;
    setStatus(value);
    setQuotaExhausted(false);
    if(value.state==='READY'){clearWorkspaceContinuation(actorId,projectId);return;}
    const saved=readWorkspaceContinuation(actorId),resuming=saved?.projectId===projectId&&(!saved.operationId||saved.operationId===value.operationId);
    if((value.state==='PREPARING'&&value.canResume||resuming&&value.state==='NOT_CONFIGURED')&&claimWorkspaceAutomaticResume(actorId,projectId,value,CLIENT_BUILD_ID)){void run(generation);return;}
    if(value.state==='PREPARING'&&!value.canResume){
     if(++polls<20){
      const delay=Math.min(2000*Math.pow(1.3,polls-1),15000);
      timer.current=setTimeout(()=>void observe(),delay);
     }else setFailure(true);
    }
   }catch(err:any){
    if(active.current===generation){
     const isQuota=err?.code==='FIRESTORE_QUOTA_EXHAUSTED'||err?.status===503||err?.code===8||err?.code==='RESOURCE_EXHAUSTED'||/RESOURCE_EXHAUSTED|quota/i.test(err?.message||'');
     if(isQuota){
      setQuotaExhausted(true);
      clearTimeout(timer.current);
     }
     setFailure(true);
    }
   }finally{
    observing.current=false;
    if(activeProjectObservationOwners.get(projectId)===ownerToken){
     activeProjectObservationOwners.delete(projectId);
    }
   }
  };
  if(typeof service.observeWorkspaceProvisioning==='function')void observe();
  return()=>{
   active.current++;
   clearTimeout(timer.current);
   transport.current?.abort();
   interaction.current?.();
   interaction.current=undefined;
   observing.current=false;
   if(activeProjectObservationOwners.get(projectId)===ownerToken){
    activeProjectObservationOwners.delete(projectId);
   }
   if(!generationBlocked.current)clearWorkspaceContinuation(actorId,projectId);
  };
 },[projectId,actorId,service]);
 const run=async(generation=active.current,human=false)=>{
  if(running.current||generationBlocked.current)return;running.current=true;clearTimeout(timer.current);transport.current?.abort();
  if(human)setQuotaExhausted(false);
  const finish=human&&(!status||status.state==='NOT_CONFIGURED'||status.actionRequired==='GOOGLE_AUTHORIZATION'||status.actionRequired==='GOOGLE_AUTOMATION_PERMISSION')?service.prepareEnsureInteraction?.():undefined;
  interaction.current=finish;setBusy(true);setFailure(false);const controller=new AbortController();transport.current=controller;
  try{
   const port:WorkspaceEnsureClient={ensureWorkspace:(id,current)=>service.ensureWorkspace(id,current),observeWorkspaceProvisioning:id=>service.observeWorkspaceProvisioning(id,controller.signal),connectBackgroundAuthorization:(...args)=>service.connectBackgroundAuthorization(...args)};
   const result=await runWorkspaceEnsureJourney(projectId,port,()=>active.current===generation,value=>{setStatus(value);setFailure(false);});
   if(active.current===generation&&result.state==='READY'){clearWorkspaceContinuation(actorId,projectId);ready.current?.();}
  }catch(error:any){
   if(error instanceof Error&&error.message==='APP_UPDATE_REQUIRED')generationBlocked.current=true;
   if(active.current===generation){
    const isQuota=error?.code==='FIRESTORE_QUOTA_EXHAUSTED'||error?.status===503||error?.code===8||error?.code==='RESOURCE_EXHAUSTED'||/RESOURCE_EXHAUSTED|quota/i.test(error?.message||'');
    if(isQuota)setQuotaExhausted(true);
    setFailure(true);
   }
  }
  finally{controller.abort();finish?.();if(interaction.current===finish)interaction.current=undefined;if(active.current===generation){setBusy(false);running.current=false;}}
 };
 const handleManualSync=async()=>{
  if(syncState==='SYNCING'||busy||generationBlocked.current)return;
  setSyncState('SYNCING');
  try{
   const clientPort=service as any;
   if(typeof clientPort.drainPendingWorkspace==='function'){
    await clientPort.drainPendingWorkspace(projectId);
   }else{
    await clientWorkspaceService.drainPendingWorkspace(projectId);
   }
   setSyncState('SUCCESS');
  }catch{
   setSyncState('FAILURE');
  }
 };
 if(typeof service.ensureWorkspace!=='function')return null;
 return <section className="rounded-xl border border-stone-700 p-4 space-y-3" aria-busy={busy||syncState==='SYNCING'}>
 <p role="status" aria-live="polite">{quotaExhausted?(t('gws.one.quota_exhausted')||'تم تجاوز حصة العمليات مؤقتاً، يرجى إعادة المحاولة لاحقاً'):t(busy?'gws.one.preparing':failure?'gws.one.attention_required':stateKey[status?.state||'NOT_CONFIGURED'])}</p>
 {syncState==='SUCCESS'&&<p role="status" aria-live="polite" className="text-emerald-400 text-sm font-semibold">{t('gws.one.sync_complete')}</p>}
 {syncState==='FAILURE'&&<p role="status" aria-live="polite" className="text-rose-400 text-sm font-semibold">{t('gws.one.sync_failed')}</p>}
 {status&&<ol aria-label={t('gws.one.progress')}>{(Object.keys(progressKeys) as (keyof typeof progressKeys)[]).map(phase=><li key={phase}>{status.completed.includes(phase)?'✓ ':''}{t(progressKeys[phase])}</li>)}</ol>}
 <div className="flex flex-wrap gap-2">
  {(!status||status.state!=='ATTENTION_REQUIRED'||status.canResume||quotaExhausted)&&<button type="button" onClick={()=>void run(active.current,true)} disabled={busy||syncState==='SYNCING'||generationBlocked.current} className="bg-amber-600 hover:bg-amber-500 disabled:opacity-50 rounded-xl px-4 py-2 font-bold">{t(status?.state==='READY'?'gws.one.verify':'gws.one.prepare')}</button>}
  {status?.state==='READY'&&<button type="button" onClick={()=>void handleManualSync()} disabled={syncState==='SYNCING'||busy||generationBlocked.current} className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-xl px-4 py-2 font-bold">{t('gws.one.sync')}</button>}
 </div>
 </section>;
}
