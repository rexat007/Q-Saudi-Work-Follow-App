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
  return <ImportOverlay level="CONFIRMATION" label={t('shared.actions.confirm')} onDismiss={()=>onAnswer(false)}><section className="w-full max-w-lg max-h-[90dvh] overflow-y-auto rounded-xl bg-stone-900 text-stone-100 p-4 space-y-4 break-words"><p>{message}</p><div className="flex flex-wrap gap-3"><button type="button" onClick={()=>onAnswer(false)}>{t('shared.actions.cancel')}</button><button type="button" onClick={()=>onAnswer(true)}>{t('shared.actions.confirm')}</button></div></section></ImportOverlay>;
}
