import {SqlGovernanceHttpClient} from './sqlGovernanceClient.service';
import type {SqlIdentityPort} from '../types/sqlUi';
/** Versioned SQL transport only. Commercial authorization is never taken from identity. */
export class SqlUiClient {
 readonly governance:SqlGovernanceHttpClient;private generation=0;private abort=new AbortController();
 invalidate(){this.generation++;this.abort.abort();this.abort=new AbortController();}
 constructor(readonly identity:SqlIdentityPort,readonly epoch:Readonly<{backendEpoch:string;epochRevision:number}>,private readonly fetcher:typeof fetch=(u,i)=>fetch(u,i)){
  this.governance=new SqlGovernanceHttpClient(()=>identity.current(),()=>epoch,(u,i)=>fetcher(u,{...i,signal:AbortSignal.any([this.abort.signal,...(i?.signal?[i.signal]:[])])}),()=>this.generation);
 }
 async request<T=any>(company:string,path:string,signal:AbortSignal,body?:unknown):Promise<T>{
  if(!path.startsWith('/api/v2/'))throw Error('SQL_PATH_REQUIRED');const generation=this.generation,actor=this.identity.current();if(!actor)throw Error('AUTH_REQUIRED');
  const token=await actor.getIdToken();if(signal.aborted||this.identity.current()!==actor||generation!==this.generation)throw Error('AUTH_CONTEXT_CHANGED');
  const abort=new AbortController(),cancel=()=>abort.abort();signal.addEventListener('abort',cancel,{once:true});const timeout=setTimeout(cancel,10000);
  try{const response=await this.fetcher(path,{method:body===undefined?'GET':'POST',signal:abort.signal,cache:'no-store',headers:{Authorization:'Bearer '+token,'X-Company-Id':company,'X-Backend-Epoch':this.epoch.backendEpoch,'X-Backend-Epoch-Revision':String(this.epoch.epochRevision),...(body===undefined?{}:{'Content-Type':'application/json'})},...(body===undefined?{}:{body:JSON.stringify(body)})});
   const value=await response.json();if(signal.aborted||this.identity.current()!==actor||generation!==this.generation)throw Error('AUTH_CONTEXT_CHANGED');if(!response.ok)throw Object.assign(Error(value?.error?.code||value?.code||'SQL_AUTHORITY_UNAVAILABLE'),{code:value?.error?.code||value?.code||'SQL_AUTHORITY_UNAVAILABLE',status:response.status});return value;
  }finally{clearTimeout(timeout);signal.removeEventListener('abort',cancel);}
 }
}
