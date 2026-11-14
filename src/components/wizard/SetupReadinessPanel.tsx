import React from 'react';
import { useI18n } from '../../i18n';
import { readinessBlockerKey, type EvaluatedReadinessView } from '../../i18n/readinessPresentation';
import type { SetupRecommendedAction } from '../../types/setupReadiness';

export function SetupReadinessPanel({ result, onAction, canAct=true, busy=false }: { result: EvaluatedReadinessView; onAction: (action: SetupRecommendedAction) => void; canAct?:boolean; busy?:boolean }) {
  const { t } = useI18n();
  return <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
    {(['lifecycle', 'setup', 'operational'] as const).map(dimension => <section key={dimension} aria-label={t(`readiness.${dimension}`)} className="space-y-3 rounded-xl border border-stone-700 bg-stone-950 p-4">
      <h3 className="font-bold">{t(`readiness.${dimension}`)}</h3><p className="text-sm leading-relaxed text-stone-300">{t(`ui3.dimension.${dimension}`)}</p>
      <p className={!busy&&result[dimension].ready ? 'text-emerald-400' : 'text-amber-300'}>{t(busy ? 'ui3.pending' : result[dimension].ready ? 'readiness.ready' : 'readiness.notReady')}</p>
      {result[dimension].blockers.map((blocker, index) => <div key={`${blocker.code}/${blocker.entityId || index}`} className="space-y-2 border-t border-stone-800 pt-3 text-sm leading-relaxed">
        <p>{t(readinessBlockerKey(blocker.code))}</p>
        {blocker.entityId && <p className="break-all font-mono"><bdi dir="ltr">{blocker.entityId}</bdi></p>}
        {dimension === 'setup' && blocker.recommendedAction && <button type="button" disabled={busy||!canAct&&blocker.recommendedAction!=='RETRY_READINESS'} className="min-h-11 rounded-lg border border-stone-600 px-3 py-2 focus-visible:ring-2 focus-visible:ring-emerald-400 disabled:opacity-50" onClick={() => {if(!busy&&(canAct||blocker.recommendedAction==='RETRY_READINESS'))onAction(blocker.recommendedAction!);}}>{t(`readiness.action.${blocker.recommendedAction}`)}</button>}
      </div>)}
      {dimension==='setup'&&!canAct&&result[dimension].blockers.some(b=>b.recommendedAction&&b.recommendedAction!=='RETRY_READINESS')&&<p className="text-sm text-stone-300">{t('ui3.authorized_handoff')}</p>}
    </section>)}
  </div>;
}
