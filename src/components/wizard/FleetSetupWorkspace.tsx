import {CanonicalFleetIdentityEditor} from '../masterData/CanonicalFleetIdentityEditor';
import React, { useEffect, useRef, useState } from 'react';
import { useI18n } from '../../i18n';
import { canonicalProjectRead } from '../../services/projectReadTransport';
import { projectCanonicalRefreshService, type ProjectCanonicalRefreshSnapshot } from '../../services/projectCanonicalRefresh.service';
import { setupCommand, SetupMutationSession } from '../../services/setupOrchestration.service';
import { setupErrorKey } from '../../i18n/setupErrors';
import type { SetupFleetContext, SetupParticipant } from '../../types/setupFleet';
import { assignmentPreview, allocationPreview, eligibleAffiliatedParticipants, eligibleSetupParticipants } from '../../utils/setupFleetActions';
import { useProjectEditorLifetime } from './useProjectEditorLifetime';

type Action = { mode: 'DRIVER' | 'TRUCK' | 'AFFILIATION' | 'ASSIGNMENT' | 'ALLOCATION' | 'REACTIVATE'; entity?: SetupParticipant };
interface Props {
  projectId: string;
  mutable: boolean;
  revision?: number;
  isCurrent: () => boolean;
  apply: (snapshot: ProjectCanonicalRefreshSnapshot) => void;
}
const control = 'w-full rounded-lg border border-stone-700 bg-stone-950 px-3 py-2 text-sm text-white disabled:opacity-50';

export function FleetSetupWorkspace({ projectId, mutable, revision, isCurrent, apply }: Props) {
  const { t, direction } = useI18n();
  const life = useProjectEditorLifetime(projectId, true, isCurrent);
  const latestRead = useRef<symbol | null>(null);
  const [context, setContext] = useState<SetupFleetContext | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'DRIVER' | 'TRUCK' | 'PARTICIPATION'>('TRUCK');
  const [action, setAction] = useState<Action | null>(null);
  const editorContext = useRef<SetupFleetContext | null>(null);
  const openAction = (next: Action) => { if (context) editorContext.current = context; setAction(next); };
  const load = async () => {
    const request = life.capture(), readId = Symbol('setup-read'); latestRead.current = readId; setError(false); setLoading(true);
    try { const data = await canonicalProjectRead<SetupFleetContext>(projectId, 'setup-context'); if (life.isCurrent(request) && latestRead.current === readId) setContext(data); }
    catch { if (life.isCurrent(request) && latestRead.current === readId) { setContext(null); setError(true); } }
    finally { if (life.isCurrent(request) && latestRead.current === readId) setLoading(false); }
  };
  useEffect(() => { void load(); }, [projectId, revision]);

  const participants = (context?.participants || []).filter(p => tab === 'PARTICIPATION' ? p.kind === 'CARRIER' || p.kind === 'MATERIAL' : p.kind === tab);
  const name = (id: string | null | undefined) => context?.participants.find(p => p.id === id)?.name || id || '—';
  return <section dir={direction} aria-label={t('setup.fleet')} className="min-w-0 space-y-4 rounded-xl border border-stone-800 p-3 sm:p-5">
    {!context ? <div role={error ? 'alert' : 'status'}>{t(error ? 'setup.errors.read' : 'shared.status.loading')}{error && !action && <button onClick={() => void load()}>{t('setup.retry')}</button>}</div> : <>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h3 className="font-bold">{t('setup.fleet')}</h3>
      {mutable && !loading && <div className="flex flex-wrap gap-2">{(['DRIVER', 'TRUCK'] as const).map(mode => <button key={mode} className="rounded-lg bg-amber-700 px-3 py-2" onClick={() => openAction({ mode })}>{t(`setup.add.${mode}`)}</button>)}</div>}
    </div>
    <div role="tablist" className="flex flex-wrap gap-2">{(['DRIVER', 'TRUCK', 'PARTICIPATION'] as const).map(value => <button key={value} role="tab" aria-selected={tab === value} onClick={() => setTab(value)} className="rounded-lg border border-stone-700 px-3 py-2">{t(`setup.tab.${value}`)}</button>)}</div>
    {loading && <p role="status">{t('shared.status.loading')}</p>}
    <p className="text-xs text-stone-400">{t('setup.closure.tableScrollHint')}</p>
    <div role="tabpanel" className="min-w-0 overflow-x-auto">
      <table className="w-full min-w-[48rem] text-start text-xs"><thead><tr>{['identity', 'global', 'membership', 'carrier', 'current', 'state', 'actions'].map(key => <th key={key} className="p-2 text-start">{t(`setup.${key}`)}</th>)}</tr></thead>
        <tbody>{participants.map(p => {
          const row = context.fleet.rows.find(r => r.truckId === p.id);
          const integrity = Boolean(p.issue || row?.classification === 'INTEGRITY_ERROR');
          return <tr key={`${p.kind}/${p.id}`} className="border-t border-stone-800">
            <td className="p-2"><div>{p.name}</div><small className="break-all">{p.id}</small></td>
            <td className="p-2">{t(`setup.status.${p.globalStatus || 'MISSING'}`)}</td>
            <td className="p-2">{t(`setup.status.${p.membershipStatus}`)}</td>
            <td className="p-2">{name(p.affiliation?.carrierId)}{p.affiliation && <small className="block">{t(`setup.status.${p.affiliation.status}`)}</small>}</td>
            <td className="p-2">{p.kind === 'DRIVER' ? name(p.assignment?.truckId) : p.kind === 'TRUCK' ? <>{name(p.assignment?.driverId)}<br />{name(p.allocation?.materialId)}</> : '—'}</td>
            <td className="p-2"><span className={`inline-block rounded-full border px-2 py-1 ${integrity ? 'border-rose-700 text-rose-300' : row?.classification === 'OPERATIONAL' ? 'border-emerald-700 text-emerald-300' : !p.eligible || row?.classification === 'INELIGIBLE' ? 'border-stone-500 text-stone-300' : 'border-amber-700 text-amber-300'}`}>{t(`setup.state.${integrity ? 'INTEGRITY_ERROR' : row?.classification || (p.eligible ? 'PARTIAL' : 'INELIGIBLE')}`)}</span>
              {(!p.eligible || integrity) && <p>{t(integrity ? 'setup.errors.integrity' : 'setup.errors.ineligible')}</p>}
              {row && <><small className="block">{t('setup.assignment')}: {t(row.assignmentEligible ? 'setup.usable' : 'setup.unavailable')}</small><small className="block">{t('setup.allocation')}: {t(row.allocationEligible ? 'setup.usable' : 'setup.unavailable')}</small>
                {[...new Set(row.integrityIssues.map(issue => issue.category))].filter(category => category !== 'INTEGRITY' && category !== 'ELIGIBILITY').map((category, index) => <small className="block" key={index}>{t('setup.partial')}</small>)}</>}
            </td>
            <td className="p-2">{mutable && !loading && !integrity && <select aria-label={`${t('setup.actions')} ${p.name}`} value="" className={control} onChange={e => { if (e.target.value) openAction({ mode: e.target.value as Action['mode'], entity: p }); }}>
              <option value="">{t('setup.manage')}</option>
              {p.membershipStatus !== 'ACTIVE' && <option value="REACTIVATE" disabled={!p.canReactivate}>{t('setup.reactivate')}</option>}
              {(p.kind === 'DRIVER' || p.kind === 'TRUCK') && <><option value="AFFILIATION">{t('setup.manageCarrier')}</option><option value="ASSIGNMENT">{t('setup.manageAssignment')}</option></>}
              {p.kind === 'TRUCK' && <option value="ALLOCATION">{t('setup.manageAllocation')}</option>}
            </select>}</td>
          </tr>;
        })}</tbody></table>
      {!loading && !participants.length && <p className="p-4">{t('setup.empty')}</p>}
    </div>
    </>}
    {action && editorContext.current && <FleetCommandEditor key={`${action.mode}/${action.entity?.id || 'new'}`} projectId={projectId} context={context || editorContext.current} action={action} readAvailable={Boolean(context) && !loading} isCurrent={isCurrent}
      onClose={() => setAction(null)} onDependency={() => openAction({ mode: 'ASSIGNMENT', entity: action.entity })}
      refresh={async () => {
        const request = life.capture(), readId = Symbol('setup-refresh'); latestRead.current = readId;
        try {
          const [snapshot, next] = await Promise.all([projectCanonicalRefreshService.refresh(projectId), canonicalProjectRead<SetupFleetContext>(projectId, 'setup-context')]);
          if (life.isCurrent(request) && latestRead.current === readId) { setContext(next); setLoading(false); setError(false); apply(snapshot); }
          return snapshot;
        } catch (error) {
          if (life.isCurrent(request) && latestRead.current === readId) { setContext(null); setLoading(false); setError(true); }
          throw error;
        }
      }} />}
  </section>;
}

export function FleetCommandEditor({ projectId, context, action, isCurrent, onClose, onDependency, refresh, readAvailable = true }: {
  projectId: string; context: SetupFleetContext; action: Action; isCurrent: () => boolean; onClose: () => void; onDependency: () => void;
  refresh: () => Promise<ProjectCanonicalRefreshSnapshot>; readAvailable?: boolean;
}) {
  const { t, direction } = useI18n();
  const life = useProjectEditorLifetime(projectId, true, isCurrent);
  const session = useRef(new SetupMutationSession()).current;
  const [busy, setBusy] = useState(false), [error, setError] = useState<string | null>(null);
  const [carrierId, setCarrierId] = useState(action.entity?.affiliation?.carrierId || '');
  const [driverId, setDriverId] = useState(action.entity?.kind === 'DRIVER' ? action.entity.id : action.entity?.assignment?.driverId || '');
  const [truckId, setTruckId] = useState(action.entity?.kind === 'TRUCK' ? action.entity.id : action.entity?.assignment?.truckId || '');
  const [materialId, setMaterialId] = useState(action.entity?.allocation?.materialId || '');
  const [close, setClose] = useState(false), [confirmed, setConfirmed] = useState('');
  const { mode, entity } = action;
  const carriers = eligibleSetupParticipants(context, 'CARRIER');
  const drivers = eligibleAffiliatedParticipants(context, 'DRIVER');
  const trucks = eligibleAffiliatedParticipants(context, 'TRUCK');
  const selectedDriver = drivers.find(d => d.id === driverId);
  const assignment = assignmentPreview(context, driverId, truckId);
  const allocation = allocationPreview(context, truckId, materialId);
  const currentAssignment = entity?.assignment;
  const currentAllocation = entity?.allocation;
  const affiliationCommand = close ? 'INACTIVATE' : !entity?.affiliation ? 'SET_AFFILIATION' : entity.affiliation.carrierId !== carrierId ? 'REASSIGN' : entity.affiliation.status === 'INACTIVE' ? 'REACTIVATE_AFFILIATION' : 'SET_AFFILIATION';
  const replacing = !close && (mode === 'ASSIGNMENT' && assignment?.command === 'REASSIGN' || mode === 'ALLOCATION' && allocation?.command === 'REALLOCATE' || mode === 'AFFILIATION' && affiliationCommand === 'REASSIGN');
  const confirmationSignature = JSON.stringify({ driverId, truckId, materialId, carrierId, affected: assignment?.affected, allocation: allocation?.current, affiliation: entity?.affiliation });
  const confirmationValid = confirmed === confirmationSignature;
  const valid = mode === 'REACTIVATE' ? Boolean(entity?.canReactivate && entity.membershipStatus !== 'ACTIVE') :
      mode === 'AFFILIATION' ? close ? Boolean(entity?.affiliation) : Boolean(entity?.eligible && carriers.some(c => c.id === carrierId)) :
        mode === 'ASSIGNMENT' ? close ? Boolean(currentAssignment) : Boolean(assignment) : close ? Boolean(currentAllocation) : Boolean(allocation);
  const display = (id?: string) => context.participants.find(p => p.id === id)?.name || id || '—';
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (session.busy || !isCurrent() || !session.committed && readAvailable && (!valid || replacing && !confirmationValid)) return;
    const request = life.capture(); const current = () => life.isCurrent(request);
    setBusy(true); setError(null);
    try {
      if (!readAvailable && !session.committed) { await refresh(); return; }
      const ok = await session.run(projectId, () => {
        if (mode === 'REACTIVATE') return setupCommand(projectId, 'membership-commands', { kind: entity!.kind, entityId: entity!.id, command: 'REACTIVATE' });
        if (mode === 'AFFILIATION') return setupCommand(projectId, 'affiliation-commands', { kind: entity!.kind, entityId: entity!.id, carrierId: close ? entity!.affiliation!.carrierId : carrierId, command: affiliationCommand });
        if (mode === 'ASSIGNMENT') return setupCommand(projectId, 'assignment-commands', close ? { command: 'CLOSE', assignmentId: currentAssignment!.assignmentId } : { command: assignment!.command, driverId, truckId });
        return setupCommand(projectId, 'allocation-commands', close ? { command: 'CLOSE', allocationId: currentAllocation!.allocationId } : { command: allocation!.command, truckId, materialId });
      }, current, () => { }, refresh);
      if (ok && current()) onClose();
    } catch (err: any) { if (current()) setError(session.committed ? 'setup.errors.refresh' : !readAvailable ? 'setup.errors.read' : setupErrorKey(err)); }
    finally { if (current()) setBusy(false); }
  };
  const select = (label: string, value: string, change: (v: string) => void, options: SetupParticipant[]) => <label className="block space-y-1">{t(label)}<select required className={control} value={value} disabled={busy || session.committed || !readAvailable} onChange={e => { change(e.target.value); setConfirmed(''); }}><option value="">{t('setup.choose')}</option>{options.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>;
  if(mode==='DRIVER'||mode==='TRUCK')return <CanonicalFleetIdentityEditor projectId={projectId} kind={mode} carriers={carriers} isCurrent={isCurrent} onClose={onClose} readAvailable={readAvailable} committed={session.committed} onSubmit={async data=>{
    if(!readAvailable&&!session.committed){await refresh();return false;}
    const request=life.capture(),current=()=>life.isCurrent(request);setBusy(true);
    try{const ok=await session.run(projectId,()=>mode==='DRIVER'?setupCommand(projectId,'setup-driver',{driverData:{driverName:data.driverName,residencyId:data.residencyId,carrierId:data.carrierId,...(data.phone?{phone:data.phone}:{})}}):setupCommand(projectId,'setup-truck',{truckData:{plateNumber:data.plateNumber,carrierId:data.carrierId,...(data.truckType?{truckType:data.truckType}:{}),...(data.tareWeightKg!==undefined?{tareWeightKg:data.tareWeightKg}:{}),...(data.maxGrossWeightKg!==undefined?{maxGrossWeightKg:data.maxGrossWeightKg}:{})}}),current,()=>{},refresh);if(!ok)throw Error('PROJECT_CONTEXT_STALE');}
    catch(e){if(session.committed)throw Error('MUTATION_REFRESH_PENDING');throw e;}finally{if(current())setBusy(false);}
  }}/>;
  return <div dir={direction} className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-stone-950/80 p-4" role="dialog" aria-modal="true" aria-label={t(`setup.editor.${mode}`)}>
    <form onSubmit={submit} className="max-h-[90vh] w-full max-w-xl space-y-4 overflow-y-auto rounded-2xl border border-stone-700 bg-stone-900 p-4 sm:p-6">
      <h3 className="font-bold">{t(`setup.editor.${mode}`)} {entity?.name}</h3>

      {mode === 'REACTIVATE' && <p>{entity?.id} · {t(`setup.status.${entity?.membershipStatus}`)} · {t(`setup.status.${entity?.globalStatus || 'MISSING'}`)}</p>}
      {mode === 'AFFILIATION' && <><p>{t('setup.current')}: {display(entity?.affiliation?.carrierId)}</p>{!close && select('setup.carrier', carrierId, setCarrierId, carriers)}</>}
      {mode === 'ASSIGNMENT' && <><p>{t('setup.current')}: {display(currentAssignment?.driverId)} → {display(currentAssignment?.truckId)}</p>{!close && <>{select('setup.driver', driverId, setDriverId, drivers)}{select('setup.truck', truckId, setTruckId, trucks.filter(p => !selectedDriver || p.affiliation?.carrierId === selectedDriver.affiliation?.carrierId))}</>}</>}
      {mode === 'ALLOCATION' && <><p>{t('setup.current')}: {display(currentAllocation?.materialId)}</p>{!close && <>{select('setup.truck', truckId, setTruckId, trucks)}{select('setup.material', materialId, setMaterialId, eligibleSetupParticipants(context, 'MATERIAL'))}</>}</>}
      {((mode === 'ASSIGNMENT' && currentAssignment) || (mode === 'ALLOCATION' && currentAllocation) || (mode === 'AFFILIATION' && entity?.affiliation?.status === 'ACTIVE')) && <label className="flex gap-2"><input type="checkbox" checked={close} disabled={busy || session.committed || !readAvailable} onChange={e => { setClose(e.target.checked); setConfirmed(''); }} />{t(mode === 'AFFILIATION' ? 'setup.inactivate' : 'setup.closeRelationship')}</label>}
      {replacing && <div className="space-y-2 rounded-lg border border-amber-700 p-3"><p>{t('setup.displacement')}</p>
        {mode === 'ASSIGNMENT' && assignment?.affected.map(r => <p key={r.assignmentId}>{display(r.driverId)} → {display(r.truckId)}</p>)}
        <p>{t('setup.requested')}: {mode === 'ASSIGNMENT' ? `${display(driverId)} → ${display(truckId)}` : mode === 'ALLOCATION' ? `${display(currentAllocation?.materialId)} → ${display(materialId)}` : `${display(entity?.affiliation?.carrierId)} → ${display(carrierId)}`}</p>
        <label className="flex gap-2"><input type="checkbox" checked={confirmationValid} disabled={busy || session.committed || !readAvailable} onChange={e => setConfirmed(e.target.checked ? confirmationSignature : '')} />{t('setup.confirmDisplacement')}</label>
      </div>}
      {error && <div role="alert"><p>{t(error)}</p>{error === 'setup.errors.dependency' && <button type="button" onClick={onDependency}>{t('setup.manageAssignment')}</button>}</div>}
      <div className="flex flex-wrap justify-end gap-3"><button type="button" disabled={busy} onClick={onClose}>{t('shared.actions.cancel')}</button><button className="rounded-lg bg-amber-700 px-4 py-2 disabled:opacity-50" disabled={busy || readAvailable && !session.committed && (!valid || replacing && !confirmationValid)}>{t(busy ? 'shared.status.loading' : session.committed || !readAvailable ? 'setup.retry' : 'shared.actions.confirm')}</button></div>
    </form>
  </div>;
}
