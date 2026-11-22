// @vitest-environment happy-dom
import React, {act} from 'react';
import {createRoot, type Root} from 'react-dom/client';
import {beforeEach, afterEach, it, expect, vi} from 'vitest';
import {I18nProvider, resolveTranslation, type Locale} from '../i18n';
const f=vi.hoisted(()=>({uid:'A',online:true,ops:[] as any[],reads:vi.fn(),stats:vi.fn(),cache:vi.fn(),conflicts:vi.fn(),sync:vi.fn(),retry:vi.fn(),clear:vi.fn(),refresh:vi.fn(),toggle:vi.fn(),listeners:new Set<()=>void>()}));
vi.mock('../firebase/config',()=>({auth:{get currentUser(){return f.uid?{uid:f.uid}:null}},db:{}}));
vi.mock('../firebase/authContext',()=>({useAuth:()=>({user:f.uid?{uid:f.uid}:null,profileAuthority:'AVAILABLE',userProfile:{role:'DRIVER',status:'ACTIVE'},isProfileLoading:false})}));
vi.mock('../hooks/useOnlineStatus',()=>({useOnlineStatus:()=>({isOnline:f.online,isSimulatedOffline:false,toggleSimulatedOffline:f.toggle})}));
vi.mock('../services/offline/outbox.service',()=>({outboxService:{getOperations:()=>f.reads(),getStats:()=>f.stats(),getDeviceId:()=> 'owned-device',subscribe:(cb:()=>void)=>{f.listeners.add(cb);return()=>f.listeners.delete(cb)},syncAll:(...a:any[])=>f.sync(...a),retryOperation:(id:string)=>f.retry(id),clearSynced:()=>f.clear()}}));
vi.mock('../services/offline/offlineCache.service',()=>({offlineCacheService:{getCacheMetadata:()=>f.cache(),refreshCacheWithBump:()=>f.refresh()}}));
vi.mock('../services/offline/conflictResolution.service',()=>({conflictResolutionService:{getConflicts:()=>f.conflicts(),subscribe:()=>()=>{},detectConflict:()=>null}}));
import {OutboxDrawer} from '../components/offline/OutboxDrawer';
(globalThis as any).IS_REACT_ACT_ENVIRONMENT=true;
let host:HTMLDivElement,root:Root;let notices:any[]=[];let locale:Locale='en';
const tr=(key:string)=>resolveTranslation(key,locale);
const deferred=()=>{let resolve!:(x:any)=>void;let reject!:(e:any)=>void;const promise=new Promise<any>((a,b)=>{resolve=a;reject=b});return {promise,resolve,reject}};
const op=(status='PENDING',id='owned-A')=>({operationId:id,projectId:'P1',userId:f.uid,deviceId:'owned-device',operationType:'TRIP_COMMAND',status,payload:{tripId:'T1'},createdAt:'2026-11-21T00:00:00Z',retryCount:0});
const settle=()=>act(async()=>{for(let n=0;n<5;n++)await Promise.resolve()});
const render=async(open=true)=>{await act(async()=>root.render(<I18nProvider initialLocale={locale}><OutboxDrawer isOpen={open} onClose={()=>{void render(false)}} onNotification={n=>notices.push(n)}/></I18nProvider>));await settle()};
const button=(key:string,scope:ParentNode=host)=>Array.from(scope.querySelectorAll<HTMLButtonElement>('button')).find(x=>x.textContent?.trim()===tr(key)||x.getAttribute('aria-label')===tr(key));
const click=async(key:string,scope:ParentNode=host)=>{const b=button(key,scope);expect(b,key).toBeDefined();await act(async()=>b!.click());await settle()};
const source=(id:string)=>host.querySelector(`[data-ui6-source="${id}"]`)!;
beforeEach(()=>{f.uid='A';f.online=true;f.ops=[];notices=[];locale='en';f.listeners.clear();for(const mock of [f.reads,f.stats,f.cache,f.conflicts,f.sync,f.retry,f.clear,f.refresh,f.toggle])mock.mockReset();f.reads.mockImplementation(async()=>structuredClone(f.ops));f.stats.mockResolvedValue({total:0,pending:0,sending:0,synced:0,failed:0,conflict:0});f.cache.mockResolvedValue([]);f.conflicts.mockResolvedValue([]);f.sync.mockResolvedValue({processedCount:0,syncedCount:0,failedCount:0,conflictCount:0});f.retry.mockResolvedValue(undefined);f.clear.mockResolvedValue(undefined);f.refresh.mockResolvedValue({newVersion:2});host=document.createElement('div');document.body.append(host);root=createRoot(host)});
afterEach(async()=>{await act(async()=>root.unmount());host.remove()});

import {hasOutboxAck} from '../components/offline/outboxPresentation';
import type {OutboxOperation} from '../types/offline';
// Shapes mirror the unchanged persisted ACK contracts; real HTTP/server evidence is separate.
const exceptionMessage='تم تسجيل الاستثناء التشغيلي بنجاح خادومياً (ACK Confirmed)';
const when='2026-11-22T00:00:00.000Z';
const tripAck={tripId:'T1',tripSerial:'ACK-1',committedAt:when};
const exceptionAck={committedAt:when,messageAr:exceptionMessage};
const record=(type:string,ack:any,status='SYNCED')=>({...op(status),operationType:type,payload:{tripId:'T1',exceptionId:'EX-1'},serverAck:ack}) as OutboxOperation;
const rows:{name:string;operation:OutboxOperation;confirmed:boolean}[]=[];
for(const type of ['TRIP_COMMAND','CREATE_TRIP_LOADING','UPDATE_TRIP_STATUS','RECORD_RECEIPT']) {
 rows.push({name:`${type}: genuine persisted trip ACK`,operation:record(type,tripAck),confirmed:true});
 for(const [name,bad] of [['absent',undefined],['trip only',{tripId:'T1'}],['number only',{tripSerial:'ACK-1'}],['blank identities',{tripId:' ',tripSerial:' '}]])rows.push({name:`${type}: rejects ${name}`,operation:record(type,bad),confirmed:false});
 rows.push({name:`${type}: receipt-unknown never confirmed`,operation:record(type,tripAck,'AWAITING_RECEIPT'),confirmed:false});
}
rows.push({name:'REPORT_EXCEPTION: genuine recorded exception ACK without trip identifiers',operation:record('REPORT_EXCEPTION',exceptionAck),confirmed:true});
for(const [name,bad] of [['absent',undefined],['timestamp only',{committedAt:when}],['message only',{messageAr:exceptionMessage}],['unrecognized marker',{committedAt:when,messageAr:'Invented acknowledgement'}],['invalid time',{committedAt:'not-a-date',messageAr:exceptionMessage}],['trip identifiers without exception proof',tripAck]])rows.push({name:`REPORT_EXCEPTION: rejects ${name}`,operation:record('REPORT_EXCEPTION',bad),confirmed:false});
for(const missing of ['tripId','exceptionId']){const value=record('REPORT_EXCEPTION',exceptionAck);delete value.payload[missing];rows.push({name:`REPORT_EXCEPTION: missing queued ${missing} is insufficient`,operation:value,confirmed:false});}
rows.push({name:'REPORT_EXCEPTION: uncertain status cannot borrow a recorded ACK',operation:record('REPORT_EXCEPTION',exceptionAck,'AWAITING_RECEIPT'),confirmed:false});
rows.push({name:'Unknown operation type cannot borrow trip proof',operation:record('INVENTED_KIND',tripAck),confirmed:false});
it.each(rows)('$name',async({operation,confirmed})=>{const before=structuredClone(operation);f.ops=[operation];expect(hasOutboxAck(operation)).toBe(confirmed);await render();const card=host.querySelector('[data-ui6-operation="owned-A"]')!;expect(Boolean(card.querySelector('[data-ui6-confirmed]'))).toBe(confirmed);if(!confirmed&&operation.status==='SYNCED')expect(card.textContent).toContain(tr('ui6.no_ack'));expect(f.ops[0]).toEqual(before);expect(f.sync).not.toHaveBeenCalled();expect(f.clear).not.toHaveBeenCalled()});
it.each(['ar','en','ur'] as Locale[])('%s: actual exception confirmation has no invented trip number',async lang=>{locale=lang;f.ops=[record('REPORT_EXCEPTION',exceptionAck)];await render();const panel=host.querySelector('[data-ui6-confirmed]');expect(panel).not.toBeNull();expect(panel?.textContent).toContain(tr('residual.messages.operational_exception_recorded_on_the_server_ack_confirmed'));expect(panel?.textContent).not.toContain('{number}');expect(panel?.textContent).not.toContain('undefined');expect(panel?.textContent).not.toContain(tr('ui6.no_ack'));expect(button('offline.labels.txt_8b427e')?.disabled).toBe(false)});
it('valid trip and exception records do not deadlock Clear Synced; an uncertain row remains intact',async()=>{const uncertain={...record('REPORT_EXCEPTION',undefined,'AWAITING_RECEIPT'),operationId:'uncertain',errorReason:'RECEIPT_REQUIRED',retryCount:2};f.ops=[{...record('TRIP_COMMAND',tripAck),operationId:'trip'},{...record('REPORT_EXCEPTION',exceptionAck),operationId:'exception'},uncertain];f.clear.mockImplementation(async()=>{f.ops=f.ops.filter(x=>x.status!=='SYNCED')});await render();expect(button('offline.labels.txt_8b427e')?.disabled).toBe(false);await click('offline.labels.txt_8b427e');expect(f.clear).toHaveBeenCalledTimes(1);expect(f.ops).toEqual([uncertain]);expect(f.sync).not.toHaveBeenCalled();expect(f.retry).not.toHaveBeenCalled()});
it('an insufficiently acknowledged synchronized exception still fences global Clear Synced',async()=>{f.ops=[{...record('TRIP_COMMAND',tripAck),operationId:'trip'},{...record('REPORT_EXCEPTION',{committedAt:when}),operationId:'exception'}];await render();expect(button('offline.labels.txt_8b427e')?.disabled).toBe(true);expect(f.clear).not.toHaveBeenCalled()});
