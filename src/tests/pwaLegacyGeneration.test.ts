import {describe,it,expect,vi} from 'vitest';
import vm from 'node:vm';
import {pwaGenerationScript} from '../../tooling/pwaGeneration';
function worker({active=true,online=true,aware=false,server='new'}={}){
 const listeners:any={},navigate=vi.fn(async()=>{}),fetch=vi.fn(async()=>{if(!online)throw Error('offline');return {ok:true,json:async()=>({buildId:server,workspaceContract:'GWS1B'})}});
 const page={id:'tab',url:'https://app.test/',navigate,postMessage:(_d:any,ports:any[])=>{if(aware)ports[0].postMessage({buildId:'old'})}};
 class Channel {port1:any={close(){},onmessage:null};port2={postMessage:(data:any)=>this.port1.onmessage?.({data})};}
 const c=vm.createContext({self:{registration:{active:active?{}:null},location:{origin:'https://app.test'},clients:{matchAll:async()=>[page]},addEventListener:(name:string,fn:any)=>listeners[name]=fn},URL,AbortController,fetch,MessageChannel:Channel,setTimeout:(fn:any,ms:number)=>setTimeout(fn,ms===750?1:ms),clearTimeout,Set});
 vm.runInContext(pwaGenerationScript('new'),c);const fire=async(name:string,extra:any={})=>{let task:Promise<any>|undefined;listeners[name]({...extra,waitUntil:(p:Promise<any>)=>task=p});await task;};return {listeners,navigate,fetch,fire};
}
describe('Workbox legacy-generation activation hook',()=>{
 it('new deployment migrates an unaware old controlled tab once',async()=>{const w=worker();await w.fire('activate');await w.fire('activate');expect(w.navigate).toHaveBeenCalledTimes(1);expect(w.fetch).toHaveBeenCalledWith('/api/runtime-version',expect.objectContaining({cache:'no-store'}));});
 it('activation completes even when navigation waits for the worker to become active',async()=>{const w=worker();w.navigate.mockImplementation(()=>new Promise(()=>{}));const done=await Promise.race([w.fire('activate').then(()=>true),new Promise(r=>setTimeout(()=>r(false),100))]);expect(done).toBe(true);});
 it('first install does not force navigation',async()=>{const w=worker({active:false});await w.fire('activate');expect(w.navigate).not.toHaveBeenCalled();});
 it('modern tabs own their guarded registerSW reload',async()=>{const w=worker({aware:true});await w.fire('activate');expect(w.navigate).not.toHaveBeenCalled();});
 it('offline activation preserves the current app shell',async()=>{const w=worker({online:false});await w.fire('activate');expect(w.navigate).not.toHaveBeenCalled();});
 it('server/artifact mismatch never navigates into the wrong generation',async()=>{const w=worker({server:'another'});await w.fire('activate');expect(w.navigate).not.toHaveBeenCalled();});
 it('a surviving legacy call can converge after activation without replaying provisioning',async()=>{const w=worker({active:false});await w.fire('fetch',{request:{url:'https://app.test/api/projects/P1/workspace/template',method:'GET'},clientId:'tab'});expect(w.navigate).toHaveBeenCalledTimes(1);expect(w.fetch).toHaveBeenCalledTimes(1);});
 it('ordinary Workspace/API requests do not cause legacy navigation',async()=>{const w=worker();await w.fire('fetch',{request:{url:'https://app.test/api/projects/P1/workspace',method:'GET'}});expect(w.fetch).not.toHaveBeenCalled();expect(w.navigate).not.toHaveBeenCalled();});
 it('worker build handshake exposes only generation metadata',()=>{const w=worker(),post=vi.fn();w.listeners.message({data:{type:'GET_WORKER_BUILD'},ports:[{postMessage:post}]});expect(post).toHaveBeenCalledWith({buildId:'new'});});
});
