import React from 'react';
import {useI18n} from '../../i18n';
import {PROJECT_SETUP_LAYERS,type ProjectSetupLayer} from '../../services/projectSetupWorkflow.service';
import {readinessBlockerKey,type EvaluatedReadinessView} from '../../i18n/readinessPresentation';
/** Orientation only. Position is never a readiness percentage or permission to advance. */
export function SetupJourneySummary({current,projectId,statusLabel,result,pending=false,unavailable=false,accessVisible=true}:{current:ProjectSetupLayer;projectId?:string;statusLabel:string;result?:EvaluatedReadinessView|null;pending?:boolean;unavailable?:boolean;accessVisible?:boolean}){
 const {t}=useI18n();const layers=PROJECT_SETUP_LAYERS.filter(l=>l.id!=='ACCESS'||accessVisible),position=layers.findIndex(l=>l.id===current);
 const verified=!pending&&!unavailable&&result?.projectId===projectId?result:null;
 return <section aria-label={t('ui3.setup.title')} className="min-w-0 space-y-3 rounded-xl border border-stone-700 bg-stone-950 p-3 text-sm leading-relaxed" data-testid="ui3-setup-progress">
  <h3 className="font-bold text-white">{t('ui3.setup.title')}</h3><p>{position>=0?t('ui3.position',{current:position+1,total:layers.length}):t('ui3.pending')}</p><p className="text-stone-300">{t('ui3.position_help')}</p>
  <p>{t('rb2.project_status')}: <strong>{statusLabel}</strong></p>
  <dl className="grid min-w-0 grid-cols-3 gap-2">{(['lifecycle','setup','operational'] as const).map(key=><div key={key} className="min-w-0 rounded-lg border border-stone-800 p-2"><dt className="break-words text-xs text-stone-300">{t(`readiness.${key}`)}</dt><dd className={`mt-1 break-words text-xs font-semibold ${verified?.[key].ready?'text-emerald-300':'text-amber-200'}`}>{t(verified?verified[key].ready?'ui3.confirmed':verified[key].blockers[0]?readinessBlockerKey(verified[key].blockers[0].code):'readiness.notReady':unavailable?'readiness.unavailable':'ui3.pending')}</dd></div>)}</dl>
  <p className="text-xs text-stone-300">{t('readiness.separation')}</p>
 </section>;
}
