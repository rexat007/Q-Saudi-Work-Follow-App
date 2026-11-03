import React,{useState,useRef} from 'react';
import {useI18n} from '../../i18n';
import {resolutionErrorKey} from '../../i18n/importResolution';
import type {BulkRosterItem} from '../../services/import/rosterBulkResolution';
import {safeBulkItem} from '../../services/import/rosterBulkResolution';
export function RosterBulkApproval({items,onDiscover,onApprove,busy}:{items:BulkRosterItem[]|null;onDiscover:()=>Promise<void>;onApprove:()=>Promise<void>;busy:boolean}){
 const lock=useRef(false);const {t}=useI18n();const [pending,setPending]=useState(false),[error,setError]=useState<string|null>(null);
 const run=async(action:()=>Promise<void>)=>{if(lock.current||pending||busy)return;lock.current=true;setPending(true);setError(null);try{await action();}catch(e){setError(resolutionErrorKey(e));}finally{lock.current=false;setPending(false);}};
 const safe=items?.filter(safeBulkItem)||[];
 const count=(states:string[])=>safe.filter(i=>states.includes(i.result!.state)).length;
 return <section aria-busy={pending||busy} className="rounded-xl border border-emerald-700 bg-stone-950 text-stone-300 p-3 space-y-3 min-w-0 break-words" aria-label={t('import.bulk.title')}><h3 className="text-sm font-semibold text-white">{t('import.bulk.title')}</h3>
 <button className="rounded-lg border border-stone-600 bg-stone-800 text-stone-100 px-3 py-2 w-full sm:w-auto whitespace-normal break-words hover:bg-stone-700 disabled:bg-stone-800 disabled:text-stone-400 disabled:border-stone-700 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950" type="button" disabled={pending||busy} onClick={()=>void run(onDiscover)}>{t('import.bulk.discover')}</button>
 {items&&<><p className="text-sm text-stone-300 break-words">{t('import.bulk.summary',{ready:count(['GLOBAL_ACTIVE_AND_PROJECT_READY']),enroll:count(['GLOBAL_EXISTS_MEMBERSHIP_MISSING','GLOBAL_EXISTS_MEMBERSHIP_INACTIVE']),affiliate:count(['GLOBAL_EXISTS_AFFILIATION_MISSING','GLOBAL_EXISTS_AFFILIATION_INACTIVE']),prepare:count(['NOT_FOUND']),manual:items.length-safe.length})}</p><button className="rounded-lg border border-emerald-400 bg-emerald-400 text-stone-950 font-semibold px-3 py-2 w-full sm:w-auto whitespace-normal break-words hover:bg-emerald-300 disabled:bg-stone-800 disabled:text-stone-400 disabled:border-stone-700 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950" type="button" disabled={pending||busy||safe.length===0} onClick={()=>void run(onApprove)}>{t('import.bulk.approve')}</button></>}
 {(pending||busy)&&<p role="status" className="text-sm text-amber-300">{t('shared.status.loading')}</p>}
 {error&&<p role="alert" className="rounded-lg border border-rose-700 bg-rose-950/30 p-3 text-sm text-rose-300">{t(error)}</p>}</section>;
}
