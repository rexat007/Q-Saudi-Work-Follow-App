import React, {useRef, useState, useEffect} from 'react';
import {ImportOverlay} from './ImportOverlay';
import {useI18n} from '../../i18n';

/** A confirmation belongs to its host lifetime. Unmount resolves it as rejection. */
export function useImportConfirmation(owner: string) {
  const [message,setMessage]=useState<{owner:string;text:string}|null>(null), pending=useRef<((answer:boolean)=>void)|null>(null);
  const finish=(answer:boolean)=>{const resolve=pending.current; pending.current=null; setMessage(null); resolve?.(answer);};
  useEffect(()=>()=>{pending.current?.(false);pending.current=null;},[owner]);
  const ask=(text:string)=>new Promise<boolean>(resolve=>{pending.current?.(false);pending.current=resolve;setMessage({owner,text});});
  return {ask,dialog:message?.owner===owner ? <ImportConfirmation message={message.text} onAnswer={finish}/> : null};
}
export function ImportConfirmation({message,onAnswer}:{message:string;onAnswer:(value:boolean)=>void}) {
  const {t}=useI18n();
  return <ImportOverlay level="CONFIRMATION" label={t('shared.actions.confirm')} onDismiss={()=>onAnswer(false)}><section className="w-full max-w-lg max-h-[90dvh] overflow-y-auto rounded-2xl bg-stone-900 border border-stone-800 text-stone-100 p-5 space-y-4 break-words shadow-2xl"><p className="text-sm text-stone-200 font-medium leading-relaxed">{message}</p><div className="flex flex-wrap gap-3 justify-end pt-2 border-t border-stone-800"><button type="button" onClick={()=>onAnswer(false)} className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white font-bold text-xs transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-stone-400">{t('shared.actions.cancel')}</button><button type="button" onClick={()=>onAnswer(true)} className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs transition-colors shadow-md shadow-amber-950/50 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-400">{t('shared.actions.confirm')}</button></div></section></ImportOverlay>;
}
