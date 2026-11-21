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

const noOldFailure=(card:Element)=>{expect(card.querySelector('.bg-rose-50,.text-rose-900,.text-rose-600')).toBeNull();expect(Array.from(card.querySelectorAll('.font-bold')).map(x=>x.textContent?.trim())).not.toContain(tr('legacyMigration.status.failed_2'));};
// Controlled source reads only: this is real-component presentation coverage.
// The unchanged original three-case audit owns the real engine/HTTP transaction boundary.
for(const lang of ['ar','en','ur'] as Locale[]) {
 for(const diagnostic of ['RECEIPT_REQUIRED','Owned diagnostic: connection closed before response']) {
  it(`${lang}: AWAITING_RECEIPT ${diagnostic} is cautionary, never a failure or delivery confirmation`,async()=>{
   locale=lang;const record={...op('AWAITING_RECEIPT'),errorReason:diagnostic};f.ops=[record];const before=structuredClone(record);await render();
   const card=host.querySelector('[data-ui6-operation="owned-A"]')!;
   const panel=card.querySelector('[data-ui6-diagnostic="AWAITING_RECEIPT"]')!;
   expect(panel).not.toBeNull();expect(panel.getAttribute('role')).toBe('status');
   expect(panel.textContent).toContain(tr('ui6.status_awaiting_receipt'));
   expect(card.textContent).toContain(tr('ui6.help_awaiting_receipt'));
   if(diagnostic!=='RECEIPT_REQUIRED')expect(panel.textContent).toContain(diagnostic);
   const headings=Array.from(card.querySelectorAll('.font-bold')).map(x=>x.textContent?.trim());
   for(const label of [tr('legacyMigration.status.failed_2'),tr('ui6.status_failed'),'Failed','Test Failed'])expect(headings).not.toContain(label);
   expect(card.querySelector('.bg-rose-50,.text-rose-900,.text-rose-600,.animate-spin')).toBeNull();
   expect(card.querySelector('[data-ui6-confirmed]')).toBeNull();expect(f.ops[0]).toEqual(before);
   expect(f.sync).not.toHaveBeenCalled();expect(f.retry).not.toHaveBeenCalled();
  });
 }
 it(`${lang}: FAILED retains a localized failure diagnostic`,async()=>{
  locale=lang;f.ops=[{...op('FAILED'),errorReason:'Owned validation failure'}];await render();
  const panel=host.querySelector('[data-ui6-diagnostic="FAILED"]');expect(panel?.getAttribute('role')).toBe('alert');
  expect(panel?.textContent).toContain(tr('ui6.status_failed'));expect(panel?.textContent).toContain('Owned validation failure');
  expect(panel?.classList.contains('bg-rose-50')).toBe(true);expect(host.querySelector('[data-ui6-confirmed]')).toBeNull();
 });
 it(`${lang}: CONFLICT keeps distinct diagnostics and resolution entry`,async()=>{
  locale=lang;f.ops=[{...op('CONFLICT'),errorReason:'Owned version conflict',conflictDetails:{messageAr:'Owned conflict evidence',conflictType:'VERSION_CONFLICT'}}];await render();
  const panel=host.querySelector('[data-ui6-diagnostic="CONFLICT"]');expect(panel?.textContent).toContain(tr('ui6.status_conflict'));
  expect(panel?.textContent).toContain('Owned version conflict');expect(panel?.classList.contains('bg-purple-50')).toBe(true);
  expect(host.textContent).toContain('Owned conflict evidence');expect(button('offline.labels.txt_46be08')).toBeDefined();
  expect(panel?.textContent).not.toContain(tr('ui6.status_awaiting_receipt'));expect(f.retry).not.toHaveBeenCalled();
 });
 it(`${lang}: SENDING does not turn a retained old diagnostic into current failure or receipt`,async()=>{
  locale=lang;f.ops=[{...op('SENDING'),errorReason:'Owned old failure'}];await render();
  const card=host.querySelector('[data-ui6-operation="owned-A"]')!;expect(card.querySelector('[data-ui6-diagnostic]')).toBeNull();
  noOldFailure(card);expect(card.textContent).toContain(tr('ui6.status_sending'));expect(card.querySelector('.animate-spin')).not.toBeNull();expect(card.querySelector('[data-ui6-confirmed]')).toBeNull();
 });
 it(`${lang}: PENDING does not display an obsolete failure panel`,async()=>{
  locale=lang;f.ops=[{...op(),errorReason:'Owned old failure'}];await render();expect(host.querySelector('[data-ui6-diagnostic]')).toBeNull();noOldFailure(host.querySelector('[data-ui6-operation]')!);expect(host.textContent).toContain(tr('ui6.help_pending'));
 });
 it(`${lang}: SYNCED with existing ACK confirms only its recorded evidence`,async()=>{
  locale=lang;f.ops=[{...op('SYNCED'),errorReason:'Owned old failure',serverAck:{tripId:'T1',tripSerial:'ACK-PUB01',committedAt:'2026-11-21T00:01:00Z'}}];await render();
  expect(host.querySelector('[data-ui6-confirmed]')?.textContent).toContain('ACK-PUB01');expect(host.querySelector('[data-ui6-diagnostic]')).toBeNull();noOldFailure(host.querySelector('[data-ui6-operation]')!);
 });
 it(`${lang}: SYNCED without sufficient ACK stays unconfirmed`,async()=>{
  locale=lang;f.ops=[{...op('SYNCED'),errorReason:'Owned old failure',serverAck:{tripId:'T1'}}];await render();
  expect(host.querySelector('[data-ui6-confirmed]')).toBeNull();expect(host.textContent).toContain(tr('ui6.no_ack'));expect(host.querySelector('[data-ui6-diagnostic]')).toBeNull();noOldFailure(host.querySelector('[data-ui6-operation]')!);
 });
}
it.each([true,false])('receipt retry preserves existing online=%s invocation order',async online=>{
 f.online=online;f.ops=[{...op('AWAITING_RECEIPT'),errorReason:'RECEIPT_REQUIRED'}];const order:string[]=[];
 f.retry.mockImplementation(async()=>{order.push('retry')});f.sync.mockImplementation(async()=>{order.push('sync');return {processedCount:0,syncedCount:0,failedCount:0,conflictCount:0}});
 await render();await click(online?'ui6.retry_online':'ui6.retry_offline');expect(order).toEqual(online?['retry','sync']:['retry']);expect(f.retry).toHaveBeenCalledWith('owned-A');
});
