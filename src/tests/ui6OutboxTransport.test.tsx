// @vitest-environment happy-dom
import React,{act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {createServer,type Server} from 'node:http';
import {beforeEach,afterEach,it,expect,vi} from 'vitest';
const f=vi.hoisted(()=>({uid:'actor'}));
vi.mock('../firebase/config',()=>({auth:{get currentUser(){return f.uid?{uid:f.uid,getIdToken:async()=>'owned-'+f.uid}:null}},db:{}}));
vi.mock('../firebase/authContext',()=>({useAuth:()=>({user:{uid:f.uid},profileAuthority:'AVAILABLE',userProfile:{role:'DRIVER',status:'ACTIVE'},isProfileLoading:false})}));
// Only the unrelated master-data provider read is isolated. The queue, persistence,
// network status, HTTP command/receipt transport and server command engine are real.
vi.mock('../services/offline/offlineCache.service',()=>({offlineCacheService:{getCacheMetadata:async()=>[]}}));
import {OutboxDrawer} from '../components/offline/OutboxDrawer';
import {I18nProvider,resolveTranslation} from '../i18n';
import {outboxService} from '../services/offline/outbox.service';
import {indexedDBService} from '../services/offline/indexedDB.service';
import {TripCommandsServerService} from '../services/tripCommands.server';
import {buildPrincipal} from '../utils/principal';
import {accountProfile,commandDatabase} from './helpers/commandDatabase';
(globalThis as any).IS_REACT_ACT_ENVIRONMENT=true;
const nativeFetch=globalThis.fetch.bind(globalThis);
let server:Server,host:HTMLDivElement,root:Root,base:string,drop:boolean,store:Record<string,any>,requests:string[],notices:any[];
const pending=new Set<Promise<Response>>();
const tr=(k:string)=>resolveTranslation(k,'en');
const settle=()=>act(async()=>{for(let n=0;n<8;n++){await Promise.allSettled([...pending]);await new Promise<void>(r=>setImmediate(r))}});
const click=async(key:string)=>{const b=Array.from(host.querySelectorAll<HTMLButtonElement>('button')).find(x=>x.textContent?.trim()===tr(key));expect(b,key).toBeDefined();await act(async()=>b!.click());await settle()};
beforeEach(async()=>{
 f.uid='actor';drop=false;requests=[];notices=[];pending.clear();
 for(const name of ['outbox','trips','conflicts'])await indexedDBService.clear(name);
 const fixture=commandDatabase({'users/actor':accountProfile('DRIVER','DRV-A'),'drivers/DRV-A':{driverId:'DRV-A',status:'ACTIVE'},'projects/P1/trips/T1':{tripId:'T1',tripNumber:'OWNED-1',projectId:'P1',driverId:'DRV-A',status:'IN_TRANSIT',weights:{originNetKg:20000},financials:{isFinalized:false},pricingSnapshot:{agreedRate:10},updatedBy:'original'}});
 store=fixture.store;const service=new TripCommandsServerService(fixture.db);
 server=createServer(async(req,res)=>{
  res.setHeader('Access-Control-Allow-Origin','*');res.setHeader('Access-Control-Allow-Headers','Authorization,Content-Type');res.setHeader('Access-Control-Allow-Methods','POST,OPTIONS');
  if(req.method==='OPTIONS'){res.writeHead(204);res.end();return;}
  expect(req.headers.authorization).toBe('Bearer owned-actor');requests.push(req.url!);
  let body='';for await(const chunk of req)body+=chunk;const receipt=req.url!.endsWith('/receipt');
  try{
   const actor=buildPrincipal(store['users/actor'],'actor',{}),result=await (receipt?service.receipt('P1',JSON.parse(body),actor):service.execute('P1',JSON.parse(body),actor));
   if(drop&&!receipt){drop=false;res.destroy();return;}
   res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({success:true,...result}));
  }catch(err:any){res.writeHead(403,{'Content-Type':'application/json'});res.end(JSON.stringify({success:false,code:err.code||err.message}));}
 });
 await new Promise<void>(r=>server.listen(0,'127.0.0.1',r));base='http://127.0.0.1:'+(server.address() as any).port;
 vi.stubGlobal('fetch',(input:RequestInfo|URL,init?:RequestInit)=>{const p=nativeFetch(new URL(String(input),base),init);pending.add(p);p.then(()=>pending.delete(p),()=>pending.delete(p));return p});
 host=document.createElement('div');document.body.append(host);root=createRoot(host);
 await outboxService.queueOperation({operationId:'original-arrival',projectId:'P1',userId:'actor',operationType:'UPDATE_TRIP_STATUS',payload:{tripId:'T1',status:'AT_DESTINATION'}});
 await act(async()=>root.render(<I18nProvider initialLocale="en"><OutboxDrawer isOpen onClose={()=>{}} onNotification={x=>notices.push(x)}/></I18nProvider>));await settle();
});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();vi.unstubAllGlobals();await new Promise<void>(r=>server.close(()=>r()))});
it('reading the actual queue sends no command; confirmed display requires a real server ACK',async()=>{
 expect(requests).toEqual([]);await click('residual.ui.synchronize_now');
 expect(requests.filter(x=>!x.endsWith('/receipt'))).toHaveLength(1);
 expect(store['projects/P1/trips/T1'].status).toBe('AT_DESTINATION');
 expect((await outboxService.getOperations())[0]).toMatchObject({operationId:'original-arrival',status:'SYNCED'});
 expect(host.querySelector('[data-ui6-confirmed]')).not.toBeNull();
});
it('a committed command with lost HTTP ACK remains uncertain; retry recovers original receipt without duplicate command',async()=>{
 drop=true;await click('residual.ui.synchronize_now');
 expect((await outboxService.getOperations())[0].status).toBe('AWAITING_RECEIPT');
 expect(host.textContent).toContain(tr('ui6.help_awaiting_receipt'));
 expect(host.querySelector('[data-ui6-confirmed]')).toBeNull();expect(notices.some(x=>x.type==='SUCCESS')).toBe(false);
 await click('ui6.retry_online');
 expect(requests.filter(x=>!x.endsWith('/receipt'))).toHaveLength(1);expect(requests.filter(x=>x.endsWith('/receipt'))).toHaveLength(1);
 expect((await outboxService.getOperations())[0]).toMatchObject({operationId:'original-arrival',status:'SYNCED'});
 expect(host.querySelector('[data-ui6-confirmed]')).not.toBeNull();
});
it('current canonical role revocation prevents delivery and false acknowledgement',async()=>{
 store['users/actor'].role='VIEWER';await click('residual.ui.synchronize_now');
 expect(requests).toHaveLength(1);expect(store['projects/P1/trips/T1'].status).toBe('IN_TRANSIT');
 expect((await outboxService.getOperations())[0].status).toBe('FAILED');
 expect(host.querySelector('[data-ui6-confirmed]')).toBeNull();expect(notices.some(x=>x.type==='SUCCESS')).toBe(false);
});
