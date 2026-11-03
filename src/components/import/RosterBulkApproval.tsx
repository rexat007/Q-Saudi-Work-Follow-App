import React,{useState,useRef} from 'react';
import {useI18n} from '../../i18n';
import type {BulkRosterItem} from '../../services/import/rosterBulkResolution';
import {safeBulkItem} from '../../services/import/rosterBulkResolution';
export function RosterBulkApproval({items,onDiscover,onApprove,busy}:{items:BulkRosterItem[]|null;onDiscover:()=>Promise<void>;onApprove:()=>Promise<void>;busy:boolean}){
 const lock=useRef(false);const {t}=useI18n();const [pending,setPending]=useState(false);
 const run=async(action:()=>Promise<void>)=>{if(lock.current||pending||busy)return;lock.current=true;setPending(true);try{await action();}finally{lock.current=false;setPending(false);}};
 const safe=items?.filter(safeBulkItem)||[];
 const count=(states:string[])=>safe.filter(i=>states.includes(i.result!.state)).length;
 return <section className="rounded-xl border border-emerald-700 p-3 space-y-2" aria-label={t('import.bulk.title')}><h3>{t('import.bulk.title')}</h3>
 <button type="button" disabled={pending||busy} onClick={()=>void run(onDiscover)}>{t('import.bulk.discover')}</button>
 {items&&<><p>{t('import.bulk.summary',{ready:count(['GLOBAL_ACTIVE_AND_PROJECT_READY']),enroll:count(['GLOBAL_EXISTS_MEMBERSHIP_MISSING','GLOBAL_EXISTS_MEMBERSHIP_INACTIVE']),affiliate:count(['GLOBAL_EXISTS_AFFILIATION_MISSING','GLOBAL_EXISTS_AFFILIATION_INACTIVE']),prepare:count(['NOT_FOUND']),manual:items.length-safe.length})}</p><button type="button" disabled={pending||busy||safe.length===0} onClick={()=>void run(onApprove)}>{t('import.bulk.approve')}</button></>}
 {(pending||busy)&&<p role="status">{t('shared.status.loading')}</p>}</section>;
}
