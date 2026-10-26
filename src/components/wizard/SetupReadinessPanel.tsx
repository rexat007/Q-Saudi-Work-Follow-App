import React from 'react';
import { useI18n } from '../../i18n';
import { readinessBlockerKey, type EvaluatedReadinessView } from '../../i18n/readinessPresentation';
import type { SetupRecommendedAction } from '../../types/setupReadiness';

export function SetupReadinessPanel({ result, onAction }: { result: EvaluatedReadinessView; onAction: (action: SetupRecommendedAction) => void }) {
  const { t } = useI18n();
  return <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
    {(['lifecycle', 'setup', 'operational'] as const).map(dimension => <section key={dimension} aria-label={t(`readiness.${dimension}`)} className="space-y-3 rounded-xl border border-stone-700 bg-stone-950 p-4">
      <h3 className="font-bold">{t(`readiness.${dimension}`)}</h3>
      <p className={result[dimension].ready ? 'text-emerald-400' : 'text-amber-300'}>{t(result[dimension].ready ? 'readiness.ready' : 'readiness.notReady')}</p>
      {result[dimension].blockers.map((blocker, index) => <div key={`${blocker.code}/${blocker.entityId || index}`} className="space-y-2 border-t border-stone-800 pt-2 text-xs">
        <p>{t(readinessBlockerKey(blocker.code))}</p>
        {blocker.entityId && <p className="break-all font-mono">{blocker.entityId}</p>}
        {dimension === 'setup' && blocker.recommendedAction && <button className="rounded-lg border border-stone-700 px-3 py-2" onClick={() => onAction(blocker.recommendedAction!)}>{t(`readiness.action.${blocker.recommendedAction}`)}</button>}
      </div>)}
    </section>)}
  </div>;
}
