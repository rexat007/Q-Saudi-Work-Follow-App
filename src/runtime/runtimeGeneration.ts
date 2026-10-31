declare const __APP_BUILD_ID__:string;
export const CLIENT_BUILD_ID=typeof __APP_BUILD_ID__==='string'?__APP_BUILD_ID__:'UNVERSIONED';
export type RuntimeVersion={buildId:string;workspaceContract:string};
export function createRuntimeGeneration(clientId:string,fetchVersion:()=>Promise<RuntimeVersion>,update:(target:string)=>Promise<unknown>,now=()=>Date.now()){
 let verifiedAt=0,verified=false;
 let pending:Promise<void>|null=null;
 async function check(){
  if(pending)return pending;
  pending=(async()=>{
   let server:RuntimeVersion;
   try {server=await fetchVersion();}catch{verified=false;throw new Error('APP_VERSION_UNAVAILABLE');}
   if(!server?.buildId||server.buildId==='UNAVAILABLE'){verified=false;throw new Error('APP_VERSION_UNAVAILABLE');}
   if(clientId==='UNVERSIONED'||server.buildId!==clientId||server.workspaceContract!=='GWS1B'){
    verified=false;void update(server.buildId).catch(()=>{});throw new Error('APP_UPDATE_REQUIRED');
   }
   verified=true;verifiedAt=now();
  })().finally(()=>{pending=null});return pending;
 }
 function assert(){if(!verified||now()-verifiedAt>90000){void check().catch(()=>{});throw new Error('APP_UPDATE_REQUIRED');}}
 return {check,assert};
}
let requestUpdate:(target:string)=>Promise<unknown>=async()=>{};
export function setRuntimeUpdater(update:typeof requestUpdate){requestUpdate=update;}
const generation=createRuntimeGeneration(CLIENT_BUILD_ID,async()=>{
 const response=await fetch('/api/runtime-version',{cache:'no-store',credentials:'same-origin',signal:AbortSignal.timeout(5000)});
 if(!response.ok)throw Error('APP_VERSION_UNAVAILABLE');return response.json();
},target=>requestUpdate(target));
export const ensureRuntimeGeneration=generation.check;
/** Synchronous validated snapshot keeps the OAuth popup in the original click gesture.
 * Preparation/startup checks and online/30s checks refresh it; every later command rechecks. */
export const assertRuntimeGeneration=generation.assert;
export function createReloadOnce(storage:Pick<Storage,'getItem'|'setItem'>,reload:()=>void,now=()=>Date.now()){
 return (target:string)=>{
  const key='q-saudi:runtime-reload';
  try {
   const raw=storage.getItem(key);let attempts:Array<{id:string;at:number}>=[];
   if(raw){try{const value=JSON.parse(raw);if(Array.isArray(value))attempts=value.filter(x=>typeof x?.id==='string'&&typeof x?.at==='number').slice(-16);}catch{attempts=[{id:raw,at:now()}];}}
   // Remember several targets: a rolling deployment alternating A/B must not loop.
   if(attempts.some(a=>a.id===target)||attempts.filter(a=>now()-a.at<600000).length>=3)return false;
   storage.setItem(key,JSON.stringify([...attempts,{id:target,at:now()}].slice(-16)));
  }catch{return false;}
  reload();return true;
 };
}
