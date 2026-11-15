import React from 'react';
import {useI18n} from '../../i18n';
import {ROSTER_STAGE_DEFINITIONS,type RosterSmartImportStage} from '../../services/import/rosterSmartImportWorkflow.service';
export interface RosterJourneyStatusProps {stage:RosterSmartImportStage;discovering?:boolean;processing?:boolean;committing?:boolean;recovering?:boolean;awaiting?:boolean;blocked?:boolean;receiptConfirmed?:boolean;sourceDetached?:boolean;sessionId?:string|null}
/** Read-only projection of the existing journey; entering COMMIT_RESULT is not a receipt. */
export function RosterJourneyStatus({stage,discovering,processing,committing,recovering,awaiting,blocked,receiptConfirmed,sourceDetached,sessionId}:RosterJourneyStatusProps){
 const {t}=useI18n();const index=ROSTER_STAGE_DEFINITIONS.findIndex(s=>s.stage===stage);
 const phase=receiptConfirmed?(blocked||processing||awaiting?'confirmed_refresh':'confirmed'):recovering||awaiting?'recovery':committing?'submitting':blocked?'blocked':discovering?'discovering':processing?'loading':sourceDetached?'reattach':stage==='COMMIT_RESULT'?'awaiting':'review';
 return <section aria-label={t('ui3.import.orientation')} className="min-w-0 space-y-2 rounded-xl border border-stone-700 bg-stone-950 p-3 text-sm leading-relaxed" data-testid="ui3-import-status" data-phase={phase}>
  <p className="font-semibold">{t('ui3.position',{current:index+1,total:ROSTER_STAGE_DEFINITIONS.length})}</p>
  <p role={phase==='blocked'?'alert':'status'} aria-live="polite" className={phase==='confirmed'?'text-emerald-300':phase==='blocked'?'text-rose-300':'text-stone-200'}>{t(`ui3.import.${phase}`)}</p>
  <p className="text-stone-300">{t(`ui3.stage.${stage}`)}</p>
  {sessionId&&<p className="break-all text-xs text-stone-400">{t('ui3.session')}: <bdi dir="ltr">{sessionId}</bdi></p>}
 </section>;
}
