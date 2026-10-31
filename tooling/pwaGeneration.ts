/** Supported generateSW importScripts lifecycle hook. Only navigates legacy pages which
 * cannot answer the modern handshake. No cache/auth/outbox clearing or Google requests. */
export function pwaGenerationScript(buildId:string):string {return `
const GENERATION=${JSON.stringify(buildId)};
const HAD_ACTIVE_WORKER=!!self.registration.active;
const migrated=new Set();
self.addEventListener('message',e=>{if(e.data?.type==='GET_WORKER_BUILD')e.ports?.[0]?.postMessage({buildId:GENERATION});});
async function migrateLegacy(clientId){
 try {
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),4000);
  let response;try{response=await fetch('/api/runtime-version',{cache:'no-store',signal:controller.signal});}finally{clearTimeout(timer);}
  if(!response.ok)return;const version=await response.json();
  if(version.buildId!==GENERATION||version.workspaceContract!=='GWS1B')return;
  const pages=await self.clients.matchAll({type:'window',includeUncontrolled:true});
  await Promise.all(pages.map(async page=>{
   if((clientId&&page.id!==clientId)||migrated.has(page.id)||new URL(page.url).origin!==self.location.origin)return;
   const aware=await new Promise(resolve=>{
    const channel=new MessageChannel();const timer=setTimeout(()=>{channel.port1.close();resolve(false);},750);
    channel.port1.onmessage=e=>{clearTimeout(timer);channel.port1.close();resolve(typeof e.data?.buildId==='string');};
    try{page.postMessage({type:'REQUEST_CLIENT_BUILD'},[channel.port2]);}catch{clearTimeout(timer);resolve(false);}
   });
   // Do not await navigation inside activate.waitUntil: navigation itself may wait
   // for activation, creating a lifecycle deadlock. Record before dispatching once.
   if(!aware){migrated.add(page.id);page.navigate(page.url).catch(()=>migrated.delete(page.id));}
  }));
 }catch{/* offline / update failure keeps current app shell usable */}
}
self.addEventListener('activate',event=>{if(HAD_ACTIVE_WORKER)event.waitUntil(migrateLegacy());});
// A legacy tab surviving an offline activation can converge on its next retired call.
// The original request still reaches the server's 410 defense; never reinterpret it as setup.
self.addEventListener('fetch',event=>{
 const u=new URL(event.request.url);
 if(event.request.method==='GET'&&u.origin===self.location.origin&&/^\\/api\\/projects\\/[^/]+\\/workspace\\/template$/.test(u.pathname))event.waitUntil(migrateLegacy(event.clientId));
});
`}
