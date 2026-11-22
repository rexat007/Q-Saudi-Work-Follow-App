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

const truth={en:'requiring review or recovery',ar:'تحتاج مراجعة أو استرداد',ur:'جائزہ یا بازیابی درکار'};
const terminal={en:'failed',ar:'فشلت',ur:'ناکام'};
const ack={tripId:'T1',tripSerial:'ACK-1',committedAt:'2026-11-22T00:00:00.000Z'};
for(const lang of ['ar','en','ur'] as Locale[]) {
 for(const kind of ['unknown','failed','conflict','success','mixed','zero'])it(`${lang}: truthful ${kind} batch keeps original counters and individual outcomes`,async()=>{
  locale=lang;const unknown={...op('AWAITING_RECEIPT'),operationId:'unknown',errorReason:'RECEIPT_REQUIRED'};const failed={...op('FAILED'),operationId:'failed',errorReason:'Owned validation failure'};const synced={...op('SYNCED'),operationId:'synced',serverAck:ack};const conflict={...op('CONFLICT'),operationId:'conflict',errorReason:'Owned version conflict',conflictDetails:{messageAr:'Owned conflict'}};
  const counts=Object.freeze(kind==='success'?{processedCount:2,syncedCount:2,failedCount:0,conflictCount:0}:kind==='zero'?{processedCount:0,syncedCount:0,failedCount:0,conflictCount:0}:kind==='mixed'?{processedCount:4,syncedCount:1,failedCount:2,conflictCount:1}:kind==='conflict'?{processedCount:1,syncedCount:0,failedCount:0,conflictCount:1}:{processedCount:1,syncedCount:0,failedCount:1,conflictCount:0});
  f.ops=kind==='unknown'?[unknown]:kind==='failed'?[failed]:kind==='conflict'?[conflict]:kind==='success'?[synced,{...synced,operationId:'synced2'}]:kind==='mixed'?[synced,unknown,failed,conflict]:[];const before=structuredClone(f.ops);f.sync.mockResolvedValue(counts);await render();await click('residual.ui.synchronize_now');
  expect(f.sync).toHaveBeenCalledTimes(1);expect(f.sync).toHaveBeenCalledWith(false);expect(f.ops).toEqual(before);
  if(kind==='zero'){expect(notices.some(x=>x.type==='SUCCESS')).toBe(false);expect(host.textContent).toContain(tr('ui6.zero_processed'));return;}
  const message=notices.at(-1)?.message as string;expect(message).toContain(`${truth[lang]} ${counts.failedCount}`);expect(message).not.toContain(`${terminal[lang]} ${counts.failedCount}`);expect(message).toContain(resolveTranslation('ui6.batch_counts',locale,{processed:counts.processedCount,synced:counts.syncedCount,failed:counts.failedCount,conflicts:counts.conflictCount}));expect(counts.failedCount).toBe(kind==='mixed'?2:kind==='unknown'||kind==='failed'?1:0);
  expect(notices.at(-1)?.type).toBe(kind==='success'?'SUCCESS':'ERROR');
  if(kind==='unknown'||kind==='mixed'){const card=host.querySelector('[data-ui6-operation="unknown"]')!;expect(card.textContent).toContain(tr('ui6.help_awaiting_receipt'));expect(card.querySelector('[data-ui6-confirmed]')).toBeNull();expect(card.querySelector('.bg-rose-50')).toBeNull();expect(message).toContain(tr('ui6.batch_review'));}
  if(kind==='failed'||kind==='mixed')expect(host.querySelector('[data-ui6-diagnostic="FAILED"]')?.getAttribute('role')).toBe('alert');
  if(kind==='conflict'||kind==='mixed')expect(host.querySelector('[data-ui6-diagnostic="CONFLICT"]')?.textContent).toContain(tr('ui6.status_conflict'));
 });
}
it.each([true,false])('retry online=%s keeps retry then optional queue sync with no extra invocation',async online=>{f.online=online;f.ops=[{...op('AWAITING_RECEIPT'),errorReason:'RECEIPT_REQUIRED'}];const calls:string[]=[];f.retry.mockImplementation(async()=>{calls.push('retry')});f.sync.mockImplementation(async()=>{calls.push('sync');return {processedCount:0,syncedCount:0,failedCount:0,conflictCount:0}});await render();await click(online?'ui6.retry_online':'ui6.retry_offline');expect(calls).toEqual(online?['retry','sync']:['retry']);expect(f.retry).toHaveBeenCalledTimes(1);expect(f.sync).toHaveBeenCalledTimes(online?1:0)});
