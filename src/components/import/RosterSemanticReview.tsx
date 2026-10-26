import React, { useState } from 'react';
import { useI18n } from '../../i18n';
import type { RosterCanonicalIntent } from '../../types/rosterCanonicalIntent';
import { canAcceptRosterIntent } from '../../services/import/rosterCanonicalIntent.service';

export interface RosterSemanticReviewProps {
  intent: RosterCanonicalIntent;
  onAccept: (signature: string, displacementSignature?: string) => Promise<void>;
  onBack?: () => void;
  busy?: boolean;
  error?: string | null;
}
/** Render the builder's output, never derive relationship consequences independently. */
export function RosterSemanticReview({ intent, onAccept, onBack, busy = false, error }: RosterSemanticReviewProps) {
  const { t } = useI18n();
  const [approved, setApproved] = useState<string>();
  const label = (kind: string, key: string) => intent.entities.find(e => e.kind === kind && e.key === key)?.label || key;
  const rows = (values: number[]) => {
    const locations = (intent.sourceRows || []).filter(row => values.includes(row.internalRowNumber) && row.sourceRowNumber !== undefined);
    return <span className="text-xs text-stone-400 break-words">{t('intent.rows')}: {values.join(', ')}{locations.length > 0 && <> · {t('intent.sourceRows')}: {locations.map(row => `${row.sourceSheetName ? `${row.sourceSheetName}: ` : ''}${row.sourceRowNumber}`).join(', ')}</>}</span>;
  };
  const action = (value: string) => t(`intent.action.${value}`);
  const ready = canAcceptRosterIntent(intent, approved);
  const counts = ['PREPARE_NEW', 'REUSE', 'ASSIGN', 'REASSIGN', 'ALLOCATE', 'REALLOCATE', 'NO_CHANGE'].map(action => ({ action, count: intent.entityConsequences.filter(c => c.action === action).length + intent.assignmentIntents.filter(a => a.action === action).length + intent.allocationIntents.filter(a => a.action === action).length })).filter(item => item.count > 0);
  return <section className="space-y-4 rounded-2xl border border-stone-700 bg-stone-900 p-4 text-stone-100 min-w-0" aria-label={t('intent.title')}>
    <h3 className="text-lg font-bold">{t('intent.title')}</h3>
    <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {(['read', 'contributing', 'excluded', 'blocked'] as const).map((key, index) => <div key={key}><dt>{t(`intent.count.${key}`)}</dt><dd className="font-bold">{index === 0 ? intent.rowDecisions.length : intent.rowDecisions.filter(r => r.status === ['', 'CONTRIBUTING', 'EXCLUDED', 'BLOCKED'][index]).length}</dd></div>)}
    </dl>
    <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3">{counts.map(item => <div key={item.action}><dt>{action(item.action)}</dt><dd className="font-bold">{item.count}</dd></div>)}</dl>
    <div className="grid sm:grid-cols-2 gap-3">
      <section><h4 className="font-bold">{t('intent.identities')}</h4>{intent.entityConsequences.map((c, i) => {
        const e = intent.entities.find(e => `${e.kind}:${e.key}` === c.key)!;
        return <div key={`${c.key}:${c.action}:${i}`} className="p-3 border-b border-stone-700 break-words"><span className="font-semibold">{e.label}</span> · {action(c.action)}{e.prepared && <span> · {t(`intent.new.${e.kind}`)}</span>}<p>{rows(c.rowNumbers)}{c.completed && <> · {t('intent.completed')}</>}</p></div>;
      })}</section>
      <section><h4 className="font-bold">{t('intent.relationships')}</h4>
        {intent.assignmentIntents.map(a => <article key={`assignment:${a.driverId}:${a.truckId}`} className="p-3 border-b border-stone-700 break-words">
          <p className="font-semibold">{action(a.action)}</p><p>{t('intent.driver')}: {label('DRIVER', a.driverId)}</p><p>{t('intent.truck')}: {label('TRUCK', a.truckId)}</p>{rows(a.rowNumbers)}
          {a.displaced.map(d => <p key={d.assignmentId} className="mt-2 text-amber-300">{t('intent.displaced')}: {t('intent.driver')} {label('DRIVER', d.driverId)}; {t('intent.truck')} {label('TRUCK', d.truckId)}</p>)}
        </article>)}
        {intent.allocationIntents.map(a => <article key={`allocation:${a.truckId}:${a.materialId}`} className="p-3 border-b border-stone-700 break-words">
          <p className="font-semibold">{action(a.action)}</p><p>{t('intent.truck')}: {label('TRUCK', a.truckId)}</p><p>{t('intent.material')}: {label('MATERIAL', a.materialId)}</p>{rows(a.rowNumbers)}
          {a.displaced && <p className="mt-2 text-amber-300">{t('intent.currentMaterial')}: {label('MATERIAL', a.displaced.materialId)}</p>}
        </article>)}
      </section>
    </div>
    {intent.blockers.length > 0 && <div role="alert" className="rounded-xl border border-rose-700 p-3"><h4>{t('intent.blockers')}</h4>{intent.blockers.map((b, i) => <p key={i}>{t(intentIssueKey(b.code))} · {rows(b.rowNumbers)}</p>)}</div>}
    {intent.requiresDisplacementApproval && <label className="flex items-start gap-2 p-3 border border-amber-600 rounded-xl"><input type="checkbox" checked={approved === intent.signature} disabled={busy || intent.blockers.length > 0} onChange={e => setApproved(e.target.checked ? intent.signature : undefined)} /><span>{t('intent.confirm')}</span></label>}
    {error && <p role="alert">{t(intentIssueKey(error))}</p>}
    <p className="text-xs text-stone-400">{t('intent.handoff')}</p>
    <div className="flex flex-wrap gap-2 justify-end">
      {onBack && <button type="button" disabled={busy} onClick={onBack} className="rounded-xl bg-stone-700 px-4 py-2">{t('entityResolution.labels.return_to_correction')}</button>}
      <button type="button" disabled={busy || !ready} onClick={() => void onAccept(intent.signature, approved)} className="rounded-xl bg-amber-600 px-4 py-2 disabled:opacity-40">{t('intent.accept')}</button>
    </div>
  </section>;
}
export function intentIssueKey(code: string): string {
  if (code.startsWith('CROSS_ROW_')) return 'intent.error.crossRow';
  if (code === 'PREPARED_ENTITY_CONFLICT') return 'intent.error.prepared';
  if (code === 'DISPLACEMENT_APPROVAL_REQUIRED') return 'intent.confirm';
  if (code === 'RELATIONSHIP_CONTEXT_STALE') return 'intent.error.stale';
  if (code === 'PHASE8_REVIEWED_INTENT_HANDOFF_REQUIRED') return 'intent.handoff';
  if (code === 'WARNING_APPROVAL_REQUIRED') return 'entityResolution.messages.awaiting_warning_acceptance';
  return 'intent.error.canonical';
}
