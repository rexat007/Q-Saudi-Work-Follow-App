import React,{useState} from 'react';
import {useI18n} from '../../i18n';
export const IMPORT_GROUP_PAGE_SIZE=40;
/** Presentation window only: counters, readiness and commands still consume ALL groups/rows. */
export function useImportGroupPage<T>(groups:T[]) {
 const {t}=useI18n(),[requestedPage,setPage]=useState(0),last=Math.max(0,Math.ceil(groups.length/IMPORT_GROUP_PAGE_SIZE)-1),page=Math.min(requestedPage,last);
 const start=page*IMPORT_GROUP_PAGE_SIZE,visible=groups.slice(start,start+IMPORT_GROUP_PAGE_SIZE);
 const pager=groups.length>IMPORT_GROUP_PAGE_SIZE?<nav aria-label={t('import.assurance.page',{from:start+1,to:start+visible.length,total:groups.length})} className="flex flex-wrap items-center gap-3 p-2 bg-stone-950/60 rounded-xl border border-stone-850">
  <button type="button" disabled={page===0} onClick={()=>setPage(page-1)} className="px-3 py-1.5 rounded-lg border border-stone-700 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold disabled:opacity-40 disabled:hover:bg-stone-800 transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500">{t('import.assurance.previous')}</button>
  <span role="status" className="text-xs font-mono text-stone-300 px-1">{t('import.assurance.page',{from:start+1,to:start+visible.length,total:groups.length})}</span>
  <button type="button" disabled={page===last} onClick={()=>setPage(page+1)} className="px-3 py-1.5 rounded-lg border border-stone-700 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold disabled:opacity-40 disabled:hover:bg-stone-800 transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500">{t('import.assurance.next')}</button>
 </nav>:null;
 return {visible,pager};
}
