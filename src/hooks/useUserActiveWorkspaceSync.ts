import {useEffect,useRef} from 'react';
import type {AuthUserContext} from '../types/common';
import {clientWorkspaceService} from '../services/workspace.service';
/** Activity requests one bounded server pass. Projects/grants/work are never client authority. */
export function useUserActiveWorkspaceSync(context?:AuthUserContext){
 const flight=useRef(false),last=useRef<{key:string;at:number}|null>(null),wake=useRef<(()=>void)|null>(null);
 useEffect(()=>{
  if(!context||!['SUPER_ADMIN','PROJECT_ADMIN'].includes(context.role))return;
  const key=`${context.userId}:${context.role}`;let disposed=false;
  async function drain(){
   if(disposed||flight.current||document.visibilityState==='hidden'||!navigator.onLine||last.current?.key===key&&Date.now()-last.current.at<60000)return;
   flight.current=true;last.current={key,at:Date.now()};
   try{await clientWorkspaceService.requestUserActiveWorkspaceSync();}catch{/* Bounded host failures wait for the next activity; Project failures remain server state. */}
   finally{flight.current=false;if(disposed)wake.current?.();}
  }
  const listener=()=>{void drain();};wake.current=listener;void drain();
  window.addEventListener('focus',listener);window.addEventListener('online',listener);document.addEventListener('visibilitychange',listener);
  return()=>{disposed=true;if(wake.current===listener)wake.current=null;window.removeEventListener('focus',listener);window.removeEventListener('online',listener);document.removeEventListener('visibilitychange',listener);};
 },[context?.userId,context?.role]);
}
