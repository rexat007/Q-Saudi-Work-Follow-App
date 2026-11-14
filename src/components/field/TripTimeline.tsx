import React from 'react';
import {useI18n} from '../../i18n';
import {tripTimeline,validTimelineInstant,checkpointKeys,type OperationalTripActionView} from '../../utils/tripTimelinePresentation';

/** Read-only canonical facts; no local command state advances a milestone. */
export function TripTimeline({trip,roles}:{trip:OperationalTripActionView;roles:readonly string[]}){
 const {t}=useI18n();if(!trip.operationalSnapshot)return null;
 const timeline=trip.operationalTimeline||{},c=trip.operationalSnapshot.configuration;
 return <section aria-label={t('ui2.timeline')} className="min-w-0 space-y-4" data-testid="ui2-timeline">
  <h4 className="text-lg font-bold">{t('ui2.timeline')}</h4><p className="text-sm text-stone-300">{t('ui2.confirmed_help')}</p>
  <ol className="grid min-w-0 gap-2 sm:grid-cols-2 lg:grid-cols-4">{tripTimeline(trip,roles).map(step=><li key={step.id} data-stage={step.id} data-state={step.state} aria-current={step.state==='current'?'step':undefined} className={`min-w-0 rounded-xl border p-3 text-sm ${step.state==='confirmed'?'border-emerald-700 bg-emerald-950/30':step.state==='current'?'border-sky-500 bg-sky-950/30':'border-stone-700 bg-stone-900'}`}>
   <span className="block font-semibold">{t(`ui2.stage.${step.id}`)}</span><span className="block text-stone-300">{t(`ui2.state.${step.state}`)}</span>{step.timestamp&&<time dateTime={step.timestamp} className="mt-1 block break-all text-xs"><bdi dir="ltr">{step.timestamp}</bdi></time>}
  </li>)}</ol>
  <details className="rounded-xl border border-stone-700 p-3 text-sm"><summary className="cursor-pointer font-semibold focus-visible:ring-2 focus-visible:ring-emerald-400">{t('ui2.checkpoints')}</summary><ul className="mt-3 space-y-2">{checkpointKeys.map(key=><li key={key}><span>{t(`ui2.checkpoint.${key}`)}</span> · {t(c.requiredCheckpoints?.includes(key)?'ui2.required':'ui2.optional')} · {t(validTimelineInstant(timeline[key])?'ui2.state.confirmed':'ui2.state.pending')}{validTimelineInstant(timeline[key])&&<time dateTime={timeline[key]} className="block text-xs"><bdi dir="ltr">{timeline[key]}</bdi></time>}</li>)}</ul></details>
 </section>;
}
