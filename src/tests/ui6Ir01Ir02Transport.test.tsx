// @vitest-environment happy-dom
import React,{act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {createServer,type Server} from 'node:http';
import {beforeEach,afterEach,it,expect,vi} from 'vitest';
const f=vi.hoisted(()=>({uid:'actor'}));
vi.mock('../firebase/config',()=>({auth:{get currentUser(){return f.uid?{uid:f.uid,getIdToken:async()=>'owned-'+f.uid}:null}},db:{}}));
vi.mock('../firebase/authContext',()=>({useAuth:()=>({user:{uid:f.uid},profileAuthority:'AVAILABLE',userProfile:{role:'PROJECT_ADMIN',status:'ACTIVE'},isProfileLoading:false})}));
// Only the unrelated master-data provider read is isolated. The queue, persistence,
// network status, HTTP command/receipt transport and server command engine are real.
vi.mock('../services/offline/offlineCache.service',()=>({offlineCacheService:{getCacheMetadata:async()=>[]}}));
import {OutboxDrawer} from '../components/offline/OutboxDrawer';
import {I18nProvider,resolveTranslation,type Locale} from '../i18n';
import {hasOutboxAck} from '../components/offline/outboxPresentation';
import fs from 'node:fs';import path from 'node:path';
import {outboxService} from '../services/offline/outbox.service';
import {indexedDBService} from '../services/offline/indexedDB.service';
import {TripCommandsServerService} from '../services/tripCommands.server';
import {buildPrincipal} from '../utils/principal';
import {accountProfile,commandDatabase} from './helpers/commandDatabase';
(globalThis as any).IS_REACT_ACT_ENVIRONMENT=true;
const nativeFetch=globalThis.fetch.bind(globalThis);
let server:Server,host:HTMLDivElement,root:Root,base:string,drop:boolean,store:Record<string,any>,requests:string[],notices:any[];
const pending=new Set<Promise<Response>>();
let lang:Locale='en';const tr=(k:string)=>resolveTranslation(k,lang);
const evidence=(kind:string,data:any)=>{if(process.env.UI6_IR_EVIDENCE)fs.writeFileSync(path.join(process.env.UI6_IR_EVIDENCE,process.env.UI6_IR_RUN_LABEL+'-'+kind+'.json'),JSON.stringify(data,null,2))};
const mount=async(locale:Locale='en')=>{lang=locale;await act(async()=>root.render(<I18nProvider key={locale} initialLocale={locale}><OutboxDrawer isOpen onClose={()=>{}} onNotification={x=>notices.push(x)}/></I18nProvider>));await settle()};
const settle=()=>act(async()=>{for(let n=0;n<8;n++){await Promise.allSettled([...pending]);await new Promise<void>(r=>setImmediate(r))}});
const click=async(key:string)=>{const b=Array.from(host.querySelectorAll<HTMLButtonElement>('button')).find(x=>x.textContent?.trim()===tr(key));expect(b,key).toBeDefined();await act(async()=>b!.click());await settle()};
beforeEach(async()=>{
 f.uid='actor';drop=false;requests=[];notices=[];pending.clear();
 for(const name of ['outbox','trips','conflicts'])await indexedDBService.clear(name);
 const fixture=commandDatabase({'users/actor':accountProfile('PROJECT_ADMIN'),'drivers/DRV-A':{driverId:'DRV-A',status:'ACTIVE'},'projects/P1/trips/T1':{tripId:'T1',tripNumber:'OWNED-1',projectId:'P1',driverId:'DRV-A',status:'IN_TRANSIT',weights:{originNetKg:20000},financials:{isFinalized:false},pricingSnapshot:{agreedRate:10},updatedBy:'original'}});
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
 await mount();
});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();vi.unstubAllGlobals();vi.restoreAllMocks();await new Promise<void>(r=>server.close(()=>r()))});

const queueException=()=>outboxService.queueOperation({operationId:'owned-exception',projectId:'P1',userId:'actor',operationType:'REPORT_EXCEPTION',payload:{tripId:'T1',exceptionId:'EX-1',type:'ROUTE_DEVIATION',severity:'MEDIUM',descriptionAr:'استثناء اختباري مملوك',descriptionEn:'Owned synthetic exception'}});
const queueArrival=(id='owned-arrival')=>outboxService.queueOperation({operationId:id,projectId:'P1',userId:'actor',operationType:'TRIP_COMMAND',payload:{tripId:'T1',command:'RECORD_ARRIVAL',payload:{}}});
it('IR01: actual successful REPORT_EXCEPTION is acknowledged without invented trip ACK identifiers',async()=>{
 await queueException();await settle();expect(requests).toHaveLength(0);await click('residual.ui.synchronize_now');
 const item=(await outboxService.getOperations())[0];expect(item.status).toBe('SYNCED');expect(store['projects/P1/trips/T1/exceptions/EX-1']).toBeDefined();expect(item.serverAck?.committedAt).toBeDefined();expect(item.serverAck?.tripId).toBeUndefined();expect(item.serverAck?.tripSerial).toBeUndefined();
 evidence('IR01-exception',{operation:item,requests,canonicalException:store['projects/P1/trips/T1/exceptions/EX-1'],rendered:host.innerHTML});
 expect(hasOutboxAck(item)).toBe(true);expect(host.querySelector('[data-ui6-confirmed]')).not.toBeNull();expect(host.textContent).not.toContain(tr('ui6.no_ack'));expect(host.querySelector('[data-ui6-confirmed]')?.textContent).not.toContain('{number}');expect(requests).toHaveLength(1);
});
it('IR01: a real trip ACK and exception ACK do not deadlock existing Clear Synced or delete server truth',async()=>{
 await queueArrival();await queueException();await settle();await click('residual.ui.synchronize_now');const items=await outboxService.getOperations();expect(items).toHaveLength(2);expect(items.every(x=>x.status==='SYNCED')).toBe(true);
 const clear=Array.from(host.querySelectorAll<HTMLButtonElement>('button')).find(x=>x.textContent?.trim()===tr('offline.labels.txt_8b427e'))!;
 evidence('IR01-clear',{items,clearExists:Boolean(clear),clearDisabled:clear?.disabled,requests,rendered:host.innerHTML});
 expect(clear).toBeDefined();expect(clear.disabled).toBe(false);const serverBefore=structuredClone(store),callsBefore=[...requests];await act(async()=>clear.click());await settle();expect(await outboxService.getOperations()).toEqual([]);expect(store).toEqual(serverBefore);expect(requests).toEqual(callsBefore);expect(requests.filter(x=>!x.endsWith('/receipt'))).toHaveLength(2);
});
for(const locale of ['ar','en','ur'] as Locale[])it(`IR02 ${locale}: actual committed command with lost ACK is unconfirmed and batch counter is not called definitively failed`,async()=>{
 await mount(locale);await queueArrival();await settle();drop=true;const sync=vi.spyOn(outboxService,'syncAll'),retry=vi.spyOn(outboxService,'retryOperation');await click('residual.ui.synchronize_now');
 const item=(await outboxService.getOperations())[0];expect(item.status).toBe('AWAITING_RECEIPT');expect(item.errorReason).toBe('RECEIPT_REQUIRED');expect(store['projects/P1/trips/T1'].status).toBe('AT_DESTINATION');const counts=await sync.mock.results[0].value;expect(counts).toEqual({processedCount:1,syncedCount:0,failedCount:1,conflictCount:0});const message=notices.at(-1)?.message as string;
 evidence('IR02-'+locale,{operation:item,counts,message,requests,canonicalTripStatus:store['projects/P1/trips/T1'].status,rendered:host.innerHTML});
 const terminal={en:'failed 1',ar:'فشلت 1',ur:'ناکام 1'};const truthful={en:'requiring review or recovery 1',ar:'تحتاج مراجعة أو استرداد 1',ur:'جائزہ یا بازیابی درکار 1'};
 expect(message).not.toContain(terminal[locale]);expect(message).toContain(truthful[locale]);expect(host.querySelector('[data-ui6-confirmed]')).toBeNull();expect(notices.some(x=>x.type==='SUCCESS')).toBe(false);
 await click('ui6.retry_online');expect(retry).toHaveBeenCalledTimes(1);expect(sync).toHaveBeenCalledTimes(2);expect(retry.mock.invocationCallOrder[0]).toBeLessThan(sync.mock.invocationCallOrder[1]);expect(requests.filter(x=>!x.endsWith('/receipt'))).toHaveLength(1);expect(requests.filter(x=>x.endsWith('/receipt'))).toHaveLength(1);expect((await outboxService.getOperations())[0].status).toBe('SYNCED');
 sync.mockRestore();retry.mockRestore();
});
