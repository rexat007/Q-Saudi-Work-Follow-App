import {useImportGroupPage} from './ImportGroupPage';
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
  const identities=new Map(intent.entities.map(e=>[`${e.kind}:${e.key}`,e]));
  const label = (kind: string, key: string) => identities.get(`${kind}:${key}`)?.label || key;
  const identityPage=useImportGroupPage(intent.entityConsequences), assignmentPage=useImportGroupPage(intent.assignmentIntents), allocationPage=useImportGroupPage(intent.allocationIntents);
  const rows = (values: number[]) => {
    const included=new Set(values);
    const locations = (intent.sourceRows || []).filter(row => included.has(row.internalRowNumber) && row.sourceRowNumber !== undefined);
    return <span className="text-xs text-stone-400 break-words">{t('intent.rows')}: {values.join(', ')}{locations.length > 0 && <> · {t('intent.sourceRows')}: {locations.map(row => `${row.sourceSheetName ? `${row.sourceSheetName}: ` : ''}${row.sourceRowNumber}`).join(', ')}</>}</span>;
  };
  const action = (value: string) => t(`intent.action.${value}`);
  const ready = canAcceptRosterIntent(intent, approved);
  const counts = ['PREPARE_NEW', 'REUSE', 'ASSIGN', 'REASSIGN', 'ALLOCATE', 'REALLOCATE', 'NO_CHANGE'].map(action => ({ action, count: intent.entityConsequences.filter(c => c.action === action).length + intent.assignmentIntents.filter(a => a.action === action).length + intent.allocationIntents.filter(a => a.action === action).length })).filter(item => item.count > 0);
  return <section className="space-y-4 rounded-2xl border border-stone-700 bg-stone-900 p-4 text-stone-100 min-w-0" aria-label={t('intent.title')}>
    <h3 className="text-lg font-bold">{t('intent.title')}</h3>
    <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-stone-950/80 p-3 rounded-xl border border-stone-850">
      {(['read', 'contributing', 'excluded', 'blocked'] as const).map((key, index) => <div key={key} className="space-y-0.5"><dt className="text-stone-400 text-xs font-medium">{t(`intent.count.${key}`)}</dt><dd className="font-mono text-base font-bold text-white">{index === 0 ? intent.rowDecisions.length : intent.rowDecisions.filter(r => r.status === ['', 'CONTRIBUTING', 'EXCLUDED', 'BLOCKED'][index]).length}</dd></div>)}
    </dl>
    <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-stone-950/80 p-3 rounded-xl border border-stone-850">{counts.map(item => <div key={item.action} className="space-y-0.5"><dt className="text-stone-400 text-xs font-medium">{action(item.action)}</dt><dd className="font-mono text-base font-bold text-amber-400">{item.count}</dd></div>)}</dl>
    <div className="grid sm:grid-cols-2 gap-3">
      <section className="space-y-2"><h4 className="font-bold text-stone-200 text-sm">{t('intent.identities')}</h4>{identityPage.pager}{identityPage.visible.map((c, i) => {
        const e = identities.get(c.key)!;
        return <div key={`${c.key}:${c.action}:${i}`} className="p-3 border-b border-stone-800 break-words hover:bg-stone-850/40 rounded-lg transition-colors"><span className="font-semibold text-white">{e.label}</span> <span className="text-stone-400">· {action(c.action)}</span>{e.prepared && <span className="text-amber-400 font-medium"> · {t(`intent.new.${e.kind}`)}</span>}<p className="mt-1">{rows(c.rowNumbers)}{c.completed && <span className="text-emerald-400 font-medium"> · {t('intent.completed')}</span>}</p></div>;
      })}</section>
      <section className="space-y-2"><h4 className="font-bold text-stone-200 text-sm">{t('intent.relationships')}</h4>
        {assignmentPage.pager}{assignmentPage.visible.map(a => <article key={`assignment:${a.driverId}:${a.truckId}`} className="p-3 border-b border-stone-800 break-words hover:bg-stone-850/40 rounded-lg transition-colors">
          <p className="font-semibold text-amber-400">{action(a.action)}</p><p className="text-stone-300">{t('intent.driver')}: <span className="text-white font-mono">{label('DRIVER', a.driverId)}</span></p><p className="text-stone-300">{t('intent.truck')}: <span className="text-white font-mono">{label('TRUCK', a.truckId)}</span></p>{rows(a.rowNumbers)}
          {a.displaced.map(d => <p key={d.assignmentId} className="mt-2 text-amber-300 font-mono text-xs">{t('intent.displaced')}: {t('intent.driver')} {label('DRIVER', d.driverId)}; {t('intent.truck')} {label('TRUCK', d.truckId)}</p>)}
        </article>)}
        {allocationPage.pager}{allocationPage.visible.map(a => <article key={`allocation:${a.truckId}:${a.materialId}`} className="p-3 border-b border-stone-800 break-words hover:bg-stone-850/40 rounded-lg transition-colors">
          <p className="font-semibold text-amber-400">{action(a.action)}</p><p className="text-stone-300">{t('intent.truck')}: <span className="text-white font-mono">{label('TRUCK', a.truckId)}</span></p><p className="text-stone-300">{t('intent.material')}: <span className="text-white font-mono">{label('MATERIAL', a.materialId)}</span></p>{rows(a.rowNumbers)}
          {a.displaced && <p key={a.displaced.allocationId} className="mt-2 text-amber-300 font-mono text-xs">{t('intent.currentMaterial')}: {label('MATERIAL', a.displaced.materialId)}</p>}
        </article>)}
      </section>
    </div>
    {intent.blockers.length > 0 && <div role="alert" className="rounded-xl border border-rose-800/80 bg-rose-950/40 p-4 space-y-2 text-rose-300 text-xs"><h4 className="font-bold text-rose-200 text-sm">{t('intent.blockers')}</h4>{intent.blockers.map((b, i) => <p key={i} className="font-mono">{t(intentIssueKey(b.code))} · {rows(b.rowNumbers)}</p>)}</div>}
    {intent.requiresDisplacementApproval && <label className="flex items-start gap-2.5 p-3.5 border border-amber-600/70 bg-amber-950/30 rounded-xl cursor-pointer text-amber-200 text-xs font-medium"><input type="checkbox" checked={approved === intent.signature} disabled={busy || intent.blockers.length > 0} onChange={e => setApproved(e.target.checked ? intent.signature : undefined)} className="w-4 h-4 rounded-sm border-amber-600 bg-stone-900 text-amber-500 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500 mt-0.5" /><span>{t('intent.confirm')}</span></label>}
    {error && <p role="alert" className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs font-mono">{t(intentIssueKey(error))}</p>}
    <p className="text-xs text-stone-400">{t('intent.handoff')}</p>
    <div className="flex flex-wrap gap-2 justify-end pt-2 border-t border-stone-800">
      {onBack && <button type="button" disabled={busy} onClick={onBack} className="rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white px-4 py-2 text-xs font-bold transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-stone-400">{t('entityResolution.labels.return_to_correction')}</button>}
      <button type="button" disabled={busy || !ready} onClick={() => void onAccept(intent.signature, approved)} className="rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black px-5 py-2 text-xs disabled:bg-stone-800 disabled:text-stone-400 disabled:opacity-40 transition-colors shadow-md shadow-amber-950/50 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-400">{t('intent.accept')}</button>
    </div>
  </section>;
}
export function intentIssueKey(code: string): string {
  const specific: Record<string, string> = {
    UNRESOLVED_MATERIAL: 'projects.batch4.material_rows_pending',
    MEMBERSHIP_MISSING: 'import.resolution.missing',
    MEMBERSHIP_STATE_CONFLICT: 'import.resolution.membership',
    AFFILIATION_CONFLICT: 'import.resolution.affiliationConflict',
    RELATIONSHIP_CONTEXT_UNAVAILABLE: 'import.resolution.context',
    CANONICAL_INTEGRITY_ERROR: 'import.resolution.integrity',
  };
  if (Object.hasOwn(specific, code)) return specific[code];
  if (code.startsWith('CROSS_ROW_')) return 'intent.error.crossRow';
  if (code === 'PREPARED_ENTITY_CONFLICT') return 'intent.error.prepared';
  if (code === 'DISPLACEMENT_APPROVAL_REQUIRED') return 'intent.confirm';
  if (code === 'RELATIONSHIP_CONTEXT_STALE') return 'intent.error.stale';
  if (code === 'PHASE8_REVIEWED_INTENT_HANDOFF_REQUIRED') return 'intent.handoff';
  if (code === 'WARNING_APPROVAL_REQUIRED') return 'entityResolution.messages.awaiting_warning_acceptance';
  return 'intent.error.canonical';
}
