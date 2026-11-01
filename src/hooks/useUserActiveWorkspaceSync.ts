import {useEffect} from 'react';
import type {ProjectEntity} from '../types/entities';
import type {AuthUserContext} from '../types/common';
import {clientWorkspaceService} from '../services/workspace.service';
/** Request-driven only. No popup, client rows, worker or new authorization authority. */
export function useUserActiveWorkspaceSync(projects:ProjectEntity[],context?:AuthUserContext){
 const scope=JSON.stringify(projects.filter(p=>context?.role==='SUPER_ADMIN'||context?.assignedProjectIds?.includes(p.projectId)).map(p=>p.projectId).sort());
 useEffect(()=>{
  if(!context||!['SUPER_ADMIN','PROJECT_ADMIN'].includes(context.role))return;
  let disposed=false,running=false,last=0;
  async function drain(){if(disposed||running||document.visibilityState==='hidden'||!navigator.onLine||Date.now()-last<60000)return;running=true;last=Date.now();try{for(const id of JSON.parse(scope)){if(disposed)break;await clientWorkspaceService.drainPendingWorkspace(id).catch(()=>{/* Deferred authorization/lease/network remains visible through canonical Workspace status. */});}}finally{running=false;}}
  void drain();const listener=()=>{void drain();};
  window.addEventListener('focus',listener);window.addEventListener('online',listener);window.addEventListener('pointerdown',listener);window.addEventListener('keydown',listener);document.addEventListener('visibilitychange',listener);
  return()=>{disposed=true;window.removeEventListener('focus',listener);window.removeEventListener('online',listener);window.removeEventListener('pointerdown',listener);window.removeEventListener('keydown',listener);document.removeEventListener('visibilitychange',listener);};
 },[scope,context?.userId,context?.role]);
}
