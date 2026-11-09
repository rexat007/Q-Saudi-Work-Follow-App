import React,{createContext,useContext,useEffect,type ReactNode} from 'react';
import {installRuntimeClient,type RuntimeClientComposition} from '../services/runtimeClient.service';
const RuntimeContext=createContext<RuntimeClientComposition|null>(null);
/** Production root supplies no composition. A trusted future root must supply all capabilities. */
export function RuntimeCompositionProvider({composition,children}:{composition:RuntimeClientComposition|null;children:ReactNode}){
 useEffect(()=>composition?installRuntimeClient(composition):undefined,[composition]);
 return <RuntimeContext.Provider value={composition}>{children}</RuntimeContext.Provider>;
}
export const useRuntimeComposition=()=>useContext(RuntimeContext);
export function useRuntimeProject(principal:string|null,projectId:string,authorized:boolean){
 const runtime=useRuntimeComposition();useEffect(()=>{if(!runtime)return;let cancelled=false;
  if(!authorized||!principal||principal!==runtime.principal()||!projectId){void runtime.coordinator.exit();return;}
  void runtime.coordinator.enter(runtime.companyId,projectId).catch(()=>{if(!cancelled)void runtime.coordinator.exit();});
  const online=()=>{if(!cancelled)void runtime.coordinator.wake();};window.addEventListener('online',online);
  return()=>{cancelled=true;window.removeEventListener('online',online);void runtime.coordinator.exit();};
 },[runtime,principal,projectId,authorized]);return runtime;
}
