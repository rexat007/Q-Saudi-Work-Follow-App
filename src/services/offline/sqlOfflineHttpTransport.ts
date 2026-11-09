import {commandIdentity,offlineFail,type OfflineCommand,type OfflineContext,type OfflineReceipt,type OfflineTransport} from '../../types/sqlOffline';
/** Deliberately not instantiated by production. Tokens are obtained per request, never persisted. */
export class SqlOfflineHttpTransport implements OfflineTransport {
 constructor(private readonly identity:()=>{uid:string;getIdToken():Promise<string>}|null,private readonly fetcher:typeof fetch=(input,init)=>fetch(input,init),private readonly base=''){}
 private async request(scope:{principal:string;companyId:string;projectId:string},path:string,signal:AbortSignal,body?:unknown,epoch?:{backendEpoch:string;epochRevision:number}){
  const actor=this.identity();if(!actor||actor.uid!==scope.principal)throw Object.assign(Error('AUTH_REQUIRED'),{status:401,code:'AUTH_REQUIRED'});
  const token=await actor.getIdToken();if(this.identity()?.uid!==actor.uid||signal.aborted)offlineFail('OFFLINE_SCOPE_CHANGED');
  const abort=new AbortController(),cancel=()=>abort.abort();signal.addEventListener('abort',cancel,{once:true});const timeout=setTimeout(cancel,10000);
  try{const response=await this.fetcher(this.base+`/api/v2/projects/${encodeURIComponent(scope.projectId)}`+path,{method:body===undefined?'GET':'POST',signal:abort.signal,cache:'no-store',headers:{Authorization:'Bearer '+token,'X-Company-Id':scope.companyId,...(body===undefined?{}:{'Content-Type':'application/json'}),...(epoch?{'X-Backend-Epoch':epoch.backendEpoch,'X-Backend-Epoch-Revision':String(epoch.epochRevision)}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})});
   if(this.identity()?.uid!==actor.uid||signal.aborted)offlineFail('OFFLINE_SCOPE_CHANGED');let value:any;try{value=await response.json();}catch(error){if(response.ok)throw error;value={};}if(!response.ok){const supplied=value?.error?.code||value?.code,code=/^[A-Z_]{1,80}$/.test(supplied||'')?supplied:'HTTP_UNAVAILABLE',raw=response.headers.get('Retry-After');let retryAfterMs=0;if(raw){retryAfterMs=/^\d+$/.test(raw)?Number(raw)*1000:Math.max(0,Date.parse(raw)-Date.now());}throw Object.assign(Error(code),{code,status:response.status,retryAfterMs});}return value;
  }finally{clearTimeout(timeout);signal.removeEventListener('abort',cancel);}
 }
 context(scope:{principal:string;companyId:string;projectId:string},signal:AbortSignal):Promise<OfflineContext>{return this.request(scope,'/offline/context',signal);}
 receipt(op:OfflineCommand,signal:AbortSignal):Promise<OfflineReceipt>{return this.request(op.identity,'/offline/receipt',signal,commandIdentity(op),op.identity);}
 async send(op:OfflineCommand,signal:AbortSignal):Promise<OfflineReceipt>{
  if(op.authority==='TRIP')await this.request(op.identity,'/trips/commands',signal,op.envelope,op.identity);
  else{const p=op.envelope.payload;await this.request(op.identity,`/imports/${encodeURIComponent(String(p.sessionId))}/executions/${encodeURIComponent(String(p.operationId))}/advance`,signal,{requestId:op.operationId,expectedVersion:p.expectedVersion},op.identity);}
  // A 200 response is not the receipt binding. Use the authenticated durable proof.
  return this.receipt(op,signal);
 }
}
