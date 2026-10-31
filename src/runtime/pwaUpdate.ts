import {registerSW} from 'virtual:pwa-register';
import {CLIENT_BUILD_ID,ensureRuntimeGeneration,setRuntimeUpdater,createReloadOnce} from './runtimeGeneration';
export function startRuntimeGeneration(){
 if(typeof window==='undefined')return;
 const reloadOnce=createReloadOnce({getItem:key=>window.sessionStorage.getItem(key),setItem:(key,value)=>window.sessionStorage.setItem(key,value)},()=>window.location.reload());
 let registration:ServiceWorkerRegistration|undefined,pending:Promise<void>|null=null;
 const workerBuild=(worker:ServiceWorker|null|undefined)=>new Promise<string|null>(resolve=>{
  if(!worker)return resolve(null);const channel=new MessageChannel();const timer=setTimeout(()=>{channel.port1.close();resolve(null)},350);
  channel.port1.onmessage=e=>{clearTimeout(timer);channel.port1.close();resolve(e.data?.buildId||null)};
  try{worker.postMessage({type:'GET_WORKER_BUILD'},[channel.port2])}catch{clearTimeout(timer);channel.port1.close();resolve(null)}
 });
 // Install this before registration: worker migration recognizes modern tabs and lets
 // this supported registerSW callback + per-target session guard own their reload.
 navigator.serviceWorker?.addEventListener('message',e=>{if(e.data?.type==='REQUEST_CLIENT_BUILD')e.ports?.[0]?.postMessage({buildId:CLIENT_BUILD_ID})});
 const update=registerSW({immediate:true,onRegisteredSW:(_url,r)=>{registration=r;},onNeedReload:()=>{void ensureRuntimeGeneration().catch(()=>{});},onNeedRefresh:()=>{void ensureRuntimeGeneration().catch(()=>{});}});
 setRuntimeUpdater(target=>{
  if(pending)return pending;
  pending=(async()=>{
   if(!('serviceWorker' in navigator)){reloadOnce(target);return;}
   registration ||= await navigator.serviceWorker.getRegistration();
   if(!registration){reloadOnce(target);return;}
   try{await registration.update();await update(true);}catch{return;}
   registration.waiting?.postMessage({type:'SKIP_WAITING'}); // supported Workbox message
   for(let i=0;i<20;i++){
    if(await workerBuild(navigator.serviceWorker.controller)===target){reloadOnce(target);return;}
    await new Promise(r=>setTimeout(r,250));
   }
   // Never reload into a controller whose generation has not been confirmed.
  })().finally(()=>{pending=null});return pending;
 });
 const check=()=>{void ensureRuntimeGeneration().catch(()=>{});};
 window.addEventListener('online',check);window.addEventListener('focus',check);
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')check();});
 window.setInterval(check,30000);check();
 console.debug('[runtime] client build',CLIENT_BUILD_ID);
}
