import {useEffect,useRef} from 'react';
import type {AuthUserContext} from '../types/common';
import {clientWorkspaceService} from '../services/workspace.service';
const flights=new Set<string>(),fallbackLast=new Map<string,number>();
/** Local throttle is navigation metadata, never Project/grant/execution authority. */
function reserve(key:string,now:number){
 try{const name=`q-saudi:workspace-activity:${key}`,last=Number(sessionStorage.getItem(name));if(last>0&&last<=now&&now-last<60000)return false;sessionStorage.setItem(name,String(now));}catch{const last=fallbackLast.get(key);if(last!==undefined&&last<=now&&now-last<60000)return false;fallbackLast.set(key,now);}
 return true;
}
/** Activity requests one bounded server pass, without duplicate passes on remount. */
export function useUserActiveWorkspaceSync(context?:AuthUserContext){
 const last=useRef<{key:string;at:number}|null>(null);
 useEffect(()=>{
  if(!context||!['SUPER_ADMIN','PROJECT_ADMIN'].includes(context.role))return;
  const key=`${context.userId}:${context.role}`;let disposed=false;
  async function drain(){
   const now=Date.now();if(disposed||flights.has(key)||document.visibilityState==='hidden'||!navigator.onLine||last.current?.key===key&&now-last.current.at<60000||!reserve(key,now))return;
   flights.add(key);last.current={key,at:now};try{await clientWorkspaceService.requestUserActiveWorkspaceSync();}catch{/* Next genuine activity may retry after the bounded throttle. */}finally{flights.delete(key);}
  }
  const listener=()=>{void drain();};void drain();window.addEventListener('focus',listener);window.addEventListener('online',listener);document.addEventListener('visibilitychange',listener);
  return()=>{disposed=true;window.removeEventListener('focus',listener);window.removeEventListener('online',listener);document.removeEventListener('visibilitychange',listener);};
 },[context?.userId,context?.role]);
}
