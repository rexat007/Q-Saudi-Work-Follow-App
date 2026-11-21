import { presentBatch4Message } from '../../i18n/batch4Messages';
import { batch4ConflictValueLabel } from '../../i18n/batch4Presentation';
import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import {useAuth} from '../../firebase/authContext';
import {auth} from '../../firebase/config';
import {hasOutboxAck, outboxStatusLabels, outboxStatusHelp} from './outboxPresentation';
import { 
  X, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Database, 
  Layers, 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  RotateCw, 
  Trash2, 
  HardDrive, 
  Server,
  Smartphone,
  ChevronDown,
  ChevronUp,
  Info,
  ShieldAlert,
  Scale,
  Lock,
  Play,
  FileCode,
  ShieldCheck
} from 'lucide-react';
import { outboxService } from '../../services/offline/outbox.service';
import { offlineCacheService } from '../../services/offline/offlineCache.service';
import { conflictResolutionService } from '../../services/offline/conflictResolution.service';
import { ConflictResolutionModal } from './ConflictResolutionModal';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { OutboxOperation, OutboxStatus, CacheStoreMetadata, OutboxStats } from '../../types/offline';
import { ConflictRecord, ConflictType } from '../../types/conflict';
import { useI18n } from '../../i18n';


interface OutboxDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNotification?: (notif: { type: 'SUCCESS' | 'ERROR' | 'SECURITY'; message: string }) => void;
}

type Capture = () => () => boolean;
type ReadState<T> = {state: 'loading' | 'ready' | 'error'; data?: T; observedAt?: string};
function useSourceRead<T>(reader: () => Promise<T>, capture: Capture) {
  const [view, setView] = useState<ReadState<T>>({state: 'loading'});
  const sequence = useRef(0), read = useRef(reader);
  read.current = reader;
  const load = useCallback(async () => {
    const current = capture(), request = ++sequence.current;
    if (!current()) return;
    setView(old => ({...old, state: 'loading'}));
    try {
      const data = await read.current();
      if (current() && request === sequence.current) setView({state: 'ready', data, observedAt: new Date().toISOString()});
    } catch {
      if (current() && request === sequence.current) setView(old => ({...old, state: 'error'}));
    }
  }, [capture]);
  return {view, load};
}

export const OutboxDrawer: React.FC<OutboxDrawerProps> = props => {
  const context = useAuth();
  const key = JSON.stringify([context.user?.uid, context.profileAuthority, context.isProfileLoading,
    context.userProfile?.role, context.userProfile?.status, context.userProfile?.isActive,
    [...(context.userProfile?.assignedProjectIds || [])].sort()]);
  const scope = useRef({key, generation: 0});
  if (scope.current.key !== key) scope.current = {key, generation: scope.current.generation + 1};
  const authorization = scope.current;
  const isCurrent = useCallback(() => scope.current === authorization, [authorization]);
  // A closed drawer owns no reads. Each actor/context and reopen gets a fresh lifetime.
  return props.isOpen && context.user ? <OutboxWorkspace {...props} key={authorization.generation}
    actorId={context.user.uid} contextCurrent={isCurrent}/> : null;
};

const OutboxWorkspace: React.FC<OutboxDrawerProps & {actorId: string; contextCurrent: () => boolean}> = ({
  isOpen, onClose, onNotification, actorId, contextCurrent,
}) => {
  const { t, direction, locale } = useI18n();
  const { isOnline, isSimulatedOffline, toggleSimulatedOffline } = useOnlineStatus();
  const lifetime = useRef({retired: false}), dialog = useRef<HTMLDivElement>(null);
  const actionLock = useRef(false);
  const [feedback, setFeedback] = useState('');
  const capture = useCallback(() => {
    const lease = lifetime.current;
    return () => !lease.retired && lifetime.current === lease && contextCurrent() && auth.currentUser?.uid === actorId;
  }, [actorId, contextCurrent]);
  useLayoutEffect(() => {
    const lease = {retired: false}; lifetime.current = lease;
    const previous = document.activeElement as HTMLElement | null;
    dialog.current?.querySelector<HTMLButtonElement>('button')?.focus();
    return () => {lease.retired = true; if (previous?.isConnected) previous.focus();};
  }, []);
  const operationRead = useSourceRead(() => outboxService.getOperations(), capture);
  const statsRead = useSourceRead(() => outboxService.getStats(), capture);
  const cacheRead = useSourceRead(() => offlineCacheService.getCacheMetadata(), capture);
  const conflictRead = useSourceRead(() => conflictResolutionService.getConflicts(), capture);
  const operations = (operationRead.view.data || []).filter(op => op.userId === actorId);
  const stats = statsRead.view.data || {total: 0, pending: 0, sending: 0, synced: 0, failed: 0, conflict: 0};
  const cacheMeta = cacheRead.view.data || [];
  const conflicts = conflictRead.view.data || [];
  const operationsReady = operationRead.view.state === 'ready';
  const conflictsReady = conflictRead.view.state === 'ready';
  const [activeTab, setActiveTab] = useState<'OUTBOX' | 'CONFLICTS' | 'CACHE'>('OUTBOX');
  const [statusFilter, setStatusFilter] = useState<OutboxStatus | 'ALL'>('ALL');
  const [selectedConflict, setSelectedConflict] = useState<ConflictRecord | null>(null);
  const [isConflictModalOpen, setIsConflictModalOpen] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isRefreshingCache, setIsRefreshingCache] = useState<boolean>(false);
  const [expandedOpId, setExpandedOpId] = useState<string | null>(null);
  const loadData = useCallback(() => {
    const operationsLoaded = operationRead.load();
    void statsRead.load(); void cacheRead.load(); void conflictRead.load();
    // Auxiliary providers cannot hold an otherwise completed queue action open.
    return operationsLoaded;
  }, [operationRead.load, statsRead.load, cacheRead.load, conflictRead.load]);
  useEffect(() => {
    void loadData();
    let live = true, scheduled = false;
    const changed = () => {
      if (scheduled || !live) return;
      scheduled = true;
      queueMicrotask(() => {scheduled = false; if (live) void loadData();});
    };
    const unsubOutbox = outboxService.subscribe(changed);
    const unsubConflicts = conflictResolutionService.subscribe(changed);
    return () => {live = false; unsubOutbox(); unsubConflicts();};
  }, [loadData]);

  const publish = (current: () => boolean, message: string, type?: 'SUCCESS' | 'ERROR') => {
    if (!current()) return;
    setFeedback(message);
    if (type) onNotification?.({type, message});
  };
  // Local busy admission does not replace the unchanged service/server authorization.
  const runAction = async (work: (current: () => boolean) => Promise<void>) => {
    const current = capture();
    if (!current() || actionLock.current) return;
    actionLock.current = true; setIsSyncing(true); setFeedback('');
    try { await work(current); }
    catch { publish(current, t('ui6.action_unknown'), 'ERROR'); }
    finally { if (current()) {actionLock.current = false; setIsSyncing(false);} }
  };
  const sync = async (current: () => boolean) => {
    if (!current()) return;
    const res = await outboxService.syncAll(isSimulatedOffline);
    if (!current()) return;
    await loadData();
    if (!res.processedCount) publish(current, t('ui6.zero_processed'));
    else if (res.failedCount || res.conflictCount || res.syncedCount !== res.processedCount)
      publish(current, t('ui6.batch_review') + ' ' + t('ui6.batch_counts', {processed: res.processedCount, synced: res.syncedCount, failed: res.failedCount, conflicts: res.conflictCount}), 'ERROR');
    else publish(current, t('ui6.batch_counts', {processed: res.processedCount, synced: res.syncedCount, failed: res.failedCount, conflicts: res.conflictCount}), 'SUCCESS');
  };
  const handleSyncAll = () => {
    if (!operationsReady || !isOnline) return;
    return runAction(sync);
  };
  const handleRetryOp = (opId: string) => {
    if (!operationsReady || !operations.some(op => op.operationId === opId && op.userId === actorId)) return;
    return runAction(async current => {
      await outboxService.retryOperation(opId);
      if (!current()) return;
      if (isOnline) await sync(current);
      else {await loadData(); publish(current, t('ui6.prepared'));}
    });
  };
  const handleClearSynced = () => {
    if (!operationsReady || !operations.some(hasOutboxAck) || operations.some(op => op.status === 'SYNCED' && !hasOutboxAck(op))) return;
    return runAction(async current => {await outboxService.clearSynced(); if (!current()) return; await loadData(); publish(current, t('ui6.cleared'));});
  };
  const handleRefreshCache = () => {
    if (cacheRead.view.state !== 'ready') return;
    return runAction(async current => {
      setIsRefreshingCache(true);
      try {
        const res = await offlineCacheService.refreshCacheWithBump();
        if (!current()) return;
        await loadData(); publish(current, t('ui6.cache_refreshed', {version: res.newVersion}));
      } finally {if (current()) setIsRefreshingCache(false);}
    });
  };
  const sourceView = (id: string, name: string, source: {view: ReadState<unknown>; load: () => Promise<void>}) => (
    <section data-ui6-source={id} data-read-state={source.view.state} aria-label={name} className="rounded-lg border border-stone-300 p-3 min-w-0 space-y-1">
      <strong>{name}</strong>
      <p role={source.view.state === 'error' ? 'alert' : 'status'}>{source.view.state === 'loading' ? t('ui6.loading') : source.view.state === 'error' ? t('ui6.read_error') : t('ui6.loaded')}</p>
      {source.view.data !== undefined && source.view.state !== 'ready' && <p>{t('ui6.stale')}</p>}
      {source.view.observedAt && <p>{t('ui6.observed')} <bdi dir="ltr">{new Date(source.view.observedAt).toLocaleString(locale)}</bdi></p>}
      <button type="button" className="rounded border px-3 py-2" onClick={() => void source.load()}>{t('ui6.refresh')}</button>
    </section>
  );

  const handleOpenConflictForOp = async (op: OutboxOperation) => {
    const current = capture();
    if (!current() || !operationsReady || !conflictsReady || op.userId !== actorId) return;
    const confId = op.conflictDetails?.conflictId;
    let found = conflicts.find(c => c.conflictId === confId || c.operationId === op.operationId);
    if (!found) {
      // If not yet saved in memory, detect or build it
      const detected = conflictResolutionService.detectConflict(op);
      if (detected) {
        found = detected;
      }
    }
    if (found && current()) {
      setSelectedConflict(found);
      setIsConflictModalOpen(true);
    }
  };

  const handleOpenConflictModal = (conflict: ConflictRecord) => {
    if (!capture()() || !conflictsReady) return;
    setSelectedConflict(conflict);
    setIsConflictModalOpen(true);
  };

  const filteredOps = operations.filter(op => {
    if (statusFilter === 'ALL') return true;
    return op.status === statusFilter;
  });

  const getStatusBadge = (status: OutboxStatus) => (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-bold ${status === 'AWAITING_RECEIPT' ? 'bg-amber-50 text-amber-950 border-amber-300' : 'bg-stone-100 text-stone-800 border-stone-300'}`}>
      {status === 'SENDING' ? <RotateCw className="w-3 h-3 animate-spin"/> : <Info className="w-3 h-3"/>}
      {t(outboxStatusLabels[status])}
    </span>
  );
  const keyDown = (event: React.KeyboardEvent) => {
    if (isConflictModalOpen) return; // Existing resolution modal owns its own interaction.
    if (event.key === 'Escape') {event.preventDefault(); onClose();}
    if (event.key !== 'Tab') return;
    const nodes = Array.from(dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled),select:not(:disabled),input:not(:disabled),[tabindex="0"]') || []);
    const first = nodes[0], last = nodes[nodes.length - 1];
    if (event.shiftKey && document.activeElement === first) {event.preventDefault(); last?.focus();}
    else if (!event.shiftKey && document.activeElement === last) {event.preventDefault(); first?.focus();}
  };

  const STORE_LABELS: Record<string, string> = {
    projects: t('offline.labels.projects'),
    carriers: t('offline.labels.txt_262349'),
    materials: t("other.labels.materials_5"),
    trucks: t("entityResolution.labels.trucks"),
    drivers: t('offline.labels.txt_499f33'),
    pricingRules: t('offline.labels.pricing'),
  };

  return (
    <div ref={dialog} role="dialog" aria-modal="true" aria-labelledby="ui6-title" onKeyDown={keyDown} className="fixed inset-0 z-50 flex items-center justify-start bg-black/50 backdrop-blur-xs transition-opacity" dir={direction}>
      <div className="w-full max-w-2xl h-full bg-stone-50 border-r rtl:border-l ltr:border-r border-stone-200 shadow-2xl flex flex-col overflow-hidden min-w-0 text-start">
        
        {/* Header */}
        <div className="bg-white border-b border-stone-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-900">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 id="ui6-title" className="text-base font-bold text-stone-900">{t("offline.labels.txt_5542eb")}</h2>
              <p className="text-xs text-stone-500">{t("offline.labels.txt_140117")}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label={t("shared.actions.close")}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-4 py-2 text-xs bg-amber-50 text-amber-950">{t('ui6.connectivity_help')}</div>
        {feedback && <p role="status" className="p-3 text-sm border-b break-words" data-ui6-feedback>{feedback}</p>}
        {/* Network State & Offline Simulation Banner */}
        <div className="bg-stone-900 text-white px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            {isOnline ? (
              <span className="flex items-center gap-1.5 font-bold text-emerald-400">
                <Wifi className="w-4 h-4" />
                <span>{t("offline.labels.txt_3f37a7")}</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 font-bold text-amber-400">
                <WifiOff className="w-4 h-4" />
                <span>{t("offline.labels.txt_74ecba")}</span>
              </span>
            )}
            <span className="text-stone-400">|</span>
            <span className="text-stone-300 font-mono text-[11px] flex items-center gap-1">
              <Smartphone className="w-3.5 h-3.5 text-stone-400" />
              <span>{t("residual.ui.device_label")}{outboxService.getDeviceId()}</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-stone-300 text-[11px]">{t("offline.labels.txt_31f297")}</span>
            <button
              onClick={() => {if (capture()()) toggleSimulatedOffline();}}
              title={t("ui6.simulation_help")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                isSimulatedOffline
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700'
              }`}
            >
              {isSimulatedOffline ? t("residual.ui.stop_offline_simulation") : t("residual.ui.start_offline_simulation")}
            </button>
          </div>
        </div>
        <p className="bg-stone-100 px-4 py-2 text-xs">{t('ui6.simulation_help')}</p>

        <details className="bg-white px-4 py-2 text-xs max-h-[35vh] overflow-y-auto shrink-0"><summary>{t('ui6.source_availability')}</summary>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 py-2">
            {sourceView('operations', t('ui6.operations_source'), operationRead)}
            {sourceView('stats', t('ui6.stats_source'), statsRead)}
            {sourceView('conflicts', t('ui6.conflicts_source'), conflictRead)}
            {sourceView('cache', t('ui6.cache_source'), cacheRead)}
          </div>
        </details>
        {/* Tab Selection */}
        <div className="flex border-b border-stone-200 bg-white px-6 pt-2 gap-2">
          <button
            onClick={() => setActiveTab('OUTBOX')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'OUTBOX'
                ? 'border-amber-600 text-amber-900'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>{t("offline.labels.txt_66c55e")}</span>
            {statsRead.view.state === 'ready' && stats.pending > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-900 text-[10px]">
                {stats.pending}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('CONFLICTS')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'CONFLICTS'
                ? 'border-purple-600 text-purple-950'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-purple-600" />
            <span>{t("offline.labels.txt_47ad3c")}</span>
            {conflicts.filter(c => c.status === 'OPEN').length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-purple-600 text-white text-[10px] animate-pulse">
                {conflicts.filter(c => c.status === 'OPEN').length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('CACHE')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'CACHE'
                ? 'border-amber-600 text-amber-900'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>{t("offline.labels.txt_519208")}</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-4 break-words">
          {activeTab === 'OUTBOX' && (
            <div className="space-y-4">
              <p className="text-xs">{t('ui6.sync_help')}</p>
              {operationRead.view.state !== 'ready' && <p role="status">{operationRead.view.state === 'loading' ? t('ui6.loading') : t('ui6.read_error')} {operationRead.view.data !== undefined ? t('ui6.stale') : ''}</p>}
              {/* Quick Actions & Stats Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-stone-600">{t("offline.labels.filter")}</span>
                  {(['ALL', 'PENDING', 'SENDING', 'AWAITING_RECEIPT', 'SYNCED', 'FAILED', 'CONFLICT'] as const).map(st => (
                    <button
                      key={st}
                      aria-label={st === 'ALL' ? t('admin_console.filter_all') : t(outboxStatusLabels[st])}
                      onClick={() => setStatusFilter(st)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                        statusFilter === st
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-stone-100 hover:bg-stone-200 text-stone-600'
                      }`}
                    >
                      {st === 'ALL' ? t('admin_console.filter_all') : t(outboxStatusLabels[st])} {statsRead.view.state === 'ready' ? `(${st === 'ALL' ? stats.total : stats[st.toLowerCase() as keyof OutboxStats] || 0})` : '—'}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  {operations.some(hasOutboxAck) && (
                    <button
                      onClick={handleClearSynced}
                      disabled={!operationsReady || isSyncing || operations.some(op => op.status === "SYNCED" && !hasOutboxAck(op))}
                      className="px-2.5 py-1.5 rounded-lg border border-stone-300 hover:bg-stone-100 text-stone-700 text-xs font-medium flex items-center gap-1 transition-colors"
                      title={t("ui6.clear_help")}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{t("offline.labels.txt_8b427e")}</span>
                    </button>
                  )}
                  <button
                    onClick={handleSyncAll}
                    disabled={isSyncing || !isOnline || !operationsReady}
                    className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                  >
                    <RotateCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? t("residual.ui.synchronizing") : t("residual.ui.synchronize_now")}</span>
                  </button>
                </div>
              </div>

              <p className="text-xs">{t('ui6.retry_help')} {t('ui6.clear_help')}</p>
              {/* Operations Cards List */}
              {filteredOps.length === 0 && operationsReady ? (
                <div className="bg-white rounded-xl border border-dashed border-stone-300 p-8 text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                  <p className="text-sm font-bold text-stone-800">{t(operations.length === 0 ? 'ui6.empty' : 'ui6.filtered_empty')}</p>
                  <p className="text-xs text-stone-500">
                    {t("ui6.empty_help")}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredOps.map(op => {
                    const isExpanded = expandedOpId === op.operationId;
                    return (
                      <div
                        key={op.operationId}
                        data-ui6-operation={op.operationId}
                        className="bg-white rounded-xl border border-stone-200 shadow-2xs hover:border-amber-300 transition-all p-4 space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-2.5">
                          <div className="flex items-center gap-2">
                            {getStatusBadge(op.status)}<p className="text-xs">{t(outboxStatusHelp[op.status])}</p><bdi dir="ltr" className="text-xs break-all">{op.operationId}</bdi>
                            <span className="font-mono text-xs font-bold text-stone-800">{op.operationId}</span>
                            <span className="text-stone-300">|</span>
                            <span className="text-xs text-stone-600 font-medium">{t("residual.ui.operation_type_label")}{op.operationType}</span>
                          </div>

                          <div className="flex items-center gap-2 text-xs text-stone-500">
                            <Clock className="w-3.5 h-3.5" />
                            <bdi dir="ltr">{new Date(op.createdAt).toLocaleTimeString(locale)} - {new Date(op.createdAt).toLocaleDateString(locale)}</bdi>
                          </div>
                        </div>

                        {/* Summary Details */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-stone-50 p-2.5 rounded-lg border border-stone-200/60">
                          <div>
                            <span className="text-stone-500 block text-[10px]">{t("operations.trip_number")}</span>
                            <span className="font-mono font-bold text-stone-900">{op.payload?.tripSerial || op.payload?.tripId || t("weighbridge.labels.txt_68c5e6")}</span>
                          </div>
                          <div>
                            <span className="text-stone-500 block text-[10px]">{t("field_operations.net_weight_label")}</span>
                            <span className="font-bold text-stone-900">
                              {op.payload?.grossWeight && op.payload?.tareWeight 
                                ? `${(op.payload.grossWeight - op.payload.tareWeight).toLocaleString()} ${t("shared.units.kg")}`
                                : t("weighbridge.labels.txt_68c5e6")}
                            </span>
                          </div>
                          <div>
                            <span className="text-stone-500 block text-[10px]">{t("offline.labels.txt_402c63")}</span>
                            {op.payload?.pricingSnapshot?.isPending || op.payload?.pricingStatus === 'PENDING' || op.payload?.pricingRuleId === 'UNRESOLVED_PENDING' ? (
                              <span className="inline-flex items-center gap-1 font-bold text-amber-800 bg-amber-100/70 px-1.5 py-0.5 rounded text-[11px] border border-amber-300">
                                <AlertTriangle className="w-3 h-3 text-amber-600" />
                                <span>{t("residual.ui.pending_settlement")}</span>
                              </span>
                            ) : (
                              <span className="font-bold text-amber-900">
                                {op.payload?.settlementAmount !== undefined ? `${op.payload.settlementAmount.toLocaleString()} ${t("shared.units.sar")}` : t("weighbridge.labels.txt_68c5e6")}
                              </span>
                            )}
                          </div>
                          <div>
                            <span className="text-stone-500 block text-[10px]">{t("offline.labels.txt_6526c5")}</span>
                            <span className="font-bold text-stone-900">{t("residual.ui.attempt_count", { count: op.retryCount })}</span>
                          </div>
                        </div>

                        {/* Pending Pricing Alert */}
                        {(op.payload?.pricingSnapshot?.isPending || op.payload?.pricingStatus === 'PENDING' || op.payload?.pricingRuleId === 'UNRESOLVED_PENDING') && (
                          <div className="text-xs bg-amber-50 border border-amber-300 rounded-lg p-2.5 text-amber-950 flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                              <div className="font-bold">{t("offline.status.pending_2")}</div>
                              <div className="text-[11px] text-amber-900 mt-0.5 leading-relaxed">
                                {t("residual.ui.pending_contract_settlement_notice")}</div>
                            </div>
                          </div>
                        )}

                        {op.status === 'SYNCED' && !hasOutboxAck(op) && <p className="text-xs text-amber-950">{t('ui6.no_ack')}</p>}
                        {/* Feedback / Error / ACK */}
                        {hasOutboxAck(op) && (
                          <div data-ui6-confirmed className="text-xs bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 text-emerald-900 flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            <div>
                              <div className="font-bold">{t("offline.labels.txt_292ade")}</div>
                              <div>{presentBatch4Message(op.serverAck!.messageAr || '', t)} {t("residual.ui.server_trip_number", { number: op.serverAck!.tripSerial })}</div>
                            </div>
                          </div>
                        )}

                        {op.errorReason && (op.status === 'AWAITING_RECEIPT' || op.status === 'FAILED' || op.status === 'CONFLICT') && (
                          <div data-ui6-diagnostic={op.status} role={op.status === 'FAILED' ? 'alert' : 'status'} className={`text-xs border rounded-lg p-2.5 flex items-start gap-2 ${op.status === 'AWAITING_RECEIPT' ? 'bg-amber-50 border-amber-200 text-amber-950' : op.status === 'CONFLICT' ? 'bg-purple-50 border-purple-200 text-purple-900' : 'bg-rose-50 border-rose-200 text-rose-900'}`}>
                            {op.status === 'AWAITING_RECEIPT' ? <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" /> : op.status === 'CONFLICT' ? <ShieldAlert className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />}
                            <div>
                              <div className="font-bold">{t(op.status === 'AWAITING_RECEIPT' ? 'ui6.status_awaiting_receipt' : op.status === 'CONFLICT' ? 'ui6.status_conflict' : 'ui6.status_failed')}</div>
                              <div>{op.status === 'AWAITING_RECEIPT' && op.errorReason === 'RECEIPT_REQUIRED' ? t('offline.recovery.awaiting_receipt') : presentBatch4Message(op.errorReason, t)}</div>
                            </div>
                          </div>
                        )}

                        {op.conflictDetails && (
                          <div className="text-xs bg-purple-50 border border-purple-200 rounded-lg p-2.5 text-purple-900 flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                            <div>
                              <div className="font-bold">{t("offline.labels.details")}</div>
                              <div>{presentBatch4Message(op.conflictDetails.messageAr, t)}</div>
                            </div>
                          </div>
                        )}

                        {/* Expandable Payload & Retry Actions */}
                        <div className="flex items-center justify-between pt-1">
                          <button
                            onClick={() => setExpandedOpId(isExpanded ? null : op.operationId)}
                            className="text-xs text-stone-600 hover:text-stone-900 flex items-center gap-1 font-medium"
                          >
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            <span>{isExpanded ? t("residual.ui.hide_payload") : t("residual.ui.show_payload")}</span>
                          </button>

                          <div className="flex items-center gap-2">
                            {op.status === 'CONFLICT' && (
                              <button
                                disabled={!operationsReady || !conflictsReady || isSyncing}
                                onClick={() => handleOpenConflictForOp(op)}
                                className="px-3.5 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
                              >
                                <ShieldAlert className="w-3.5 h-3.5" />
                                <span>{t("offline.labels.txt_46be08")}</span>
                              </button>
                            )}

                            {(op.status === 'FAILED' || op.status === 'CONFLICT' || op.status === 'AWAITING_RECEIPT') && (
                              <button
                                disabled={!operationsReady || isSyncing}
                                title={t("ui6.retry_help")}
                                onClick={() => handleRetryOp(op.operationId)}
                                className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-900 text-stone-200 text-xs font-bold flex items-center gap-1 shadow-2xs transition-colors"
                              >
                                <RotateCw className="w-3 h-3" />
                                <span>{t(isOnline ? "ui6.retry_online" : "ui6.retry_offline")}</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="mt-2 p-3 bg-stone-900 text-stone-200 rounded-lg text-xs font-mono overflow-x-auto max-h-48 text-left" dir="ltr">
                            <pre>{JSON.stringify(op.payload, null, 2)}</pre>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'CONFLICTS' && (
            <div className="space-y-4">{sourceView('conflicts-panel', t('ui6.conflicts_source'), conflictRead)}
              {/* Mandatory Anti-LWW Rules & Pricing Invariance Banner */}
              <div className="bg-stone-900 text-white p-4.5 rounded-xl border border-stone-800 space-y-2 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                    <ShieldAlert className="w-4 h-4" />
                    <span>{t("offline.labels.txt_21781d")}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-stone-800 text-purple-300 border border-purple-500/30">
                    {t("residual.ui.strict_audit_trail")}</span>
                </div>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] text-stone-300 pt-1">
                  <li className="flex items-start gap-1.5">
                    <span className="text-amber-400 font-bold">•</span>
                    <span><strong>{t("offline.labels.txt_44754a")}</strong> {t("offline.labels.txt_5753f6")}</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span><strong>{t("offline.labels.txt_197045")}</strong> {t("residual.ui.binding_snapshot")}</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-purple-400 font-bold">•</span>
                    <span><strong>{t("offline.labels.save")}</strong> {t("offline.labels.save_2")}</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-blue-400 font-bold">•</span>
                    <span><strong>{t("offline.labels.txt_6aae4c")}</strong> {t("residual.ui.future_rates_only")}</span>
                  </li>
                </ul>
              </div>

              {/* Conflicts List */}
              {conflicts.length === 0 && conflictsReady ? (
                <div className="bg-white rounded-xl border border-stone-200 p-8 text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-stone-800">{t("offline.status.txt_60598f")}</h4>
                  <p className="text-xs text-stone-500 max-w-md mx-auto">
                    {t("offline.labels.txt_10b6c4")}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {conflicts.map(conf => {
                    const isOpen = conf.status === 'OPEN';
                    return (
                      <div
                        key={conf.conflictId}
                        className={`bg-white rounded-xl border p-4.5 space-y-3 shadow-2xs transition-all ${
                          isOpen ? 'border-amber-300 ring-1 ring-amber-100' : 'border-stone-200 bg-stone-50/40'
                        }`}
                      >
                        {/* Header */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${
                                isOpen 
                                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                                  : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                              }`}>
                                {isOpen ? t("residual.ui.conflict_open") : t("residual.ui.conflict_resolved")}
                              </span>
                              <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-stone-100 text-stone-700">
                                {conf.conflictType}
                              </span>
                              <span className="text-[11px] font-mono text-stone-400">
                                {conf.conflictId}
                              </span>
                            </div>
                            <h4 className="text-xs font-bold text-stone-900 pt-0.5">{presentBatch4Message(conf.titleAr, t)}</h4>
                            <p className="text-xs text-stone-600 leading-relaxed">{presentBatch4Message(conf.descriptionAr, t)}</p>
                          </div>

                          {isOpen && (
                            <button
                              disabled={!conflictsReady || isSyncing}
                              onClick={() => handleOpenConflictModal(conf)}
                              className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
                            >
                              <ShieldAlert className="w-4 h-4" />
                              <span>{t("offline.labels.txt_46be08")}</span>
                            </button>
                          )}
                        </div>

                        {/* Pricing Invariance Highlight */}
                        {conf.pricingProtection && (
                          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <Lock className="w-4 h-4 text-emerald-700 shrink-0" />
                              <div>
                                <span className="font-bold text-emerald-950">{t("offline.labels.txt_6aaee2")}</span>
                                <span className="text-emerald-900">
                                  {t("residual.ui.snapshot_rate_label")}{conf.pricingProtection.snapshotRate} {t("shared.units.sar") + " | " + t("residual.ui.server_rate_label")}{conf.pricingProtection.serverCurrentRate} {t("shared.units.sar")}</span>
                              </div>
                            </div>
                            <span className="px-2 py-0.5 rounded bg-emerald-200/80 text-emerald-900 font-bold text-[10px]">
                              {t("residual.ui.contractually_protected_rate")}</span>
                          </div>
                        )}

                        {/* Diff Fields Mini View */}
                        <div className="bg-stone-50 rounded-lg p-2.5 border border-stone-200 text-xs">
                          <div className="text-[11px] font-bold text-stone-700 mb-1">{t("offline.labels.txt_231b48")}</div>
                          <div className="space-y-1">
                            {conf.diffFields.map((d, i) => (
                              <div key={i} className="flex items-center justify-between text-[11px] bg-white p-1.5 px-2.5 rounded border border-stone-200">
                                <span className="font-bold text-stone-800">{presentBatch4Message(d.fieldLabelAr, t)} ({d.field})</span>
                                <div className="flex items-center gap-2 font-mono">
                                  <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                    {t("offline.labels.txt_24195a")}{String(d.localValue)}
                                  </span>
                                  <span className="text-stone-400">↔</span>
                                  <span className="text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                                    {t("offline.labels.txt_69531e")}{batch4ConflictValueLabel(t, d.field, d.serverValue)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Resolution Summary if RESOLVED */}
                        {conf.status === 'RESOLVED' && conf.resolution && (
                          <div className="bg-emerald-50/70 border border-emerald-200 rounded-lg p-3 text-xs space-y-1">
                            <div className="flex items-center justify-between font-bold text-emerald-950">
                              <span className="flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                                <span>{t("residual.ui.approved_decision_label")}{conf.resolution.strategy}</span>
                              </span>
                              <span className="text-[10px] text-emerald-800">
                                {t("operations.by")}{conf.resolution.resolvedBy}
                              </span>
                            </div>
                            <div className="text-[11px] text-emerald-900">
                              <strong>{t("offline.labels.txt_a9b605")}</strong> {conf.resolution.justification}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'CACHE' && (
            <div className="space-y-4">{sourceView('cache-panel', t('ui6.cache_source'), cacheRead)}<p className="text-xs">{t('ui6.cache_help')}</p>
              <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-xs font-bold text-stone-900">{t("offline.labels.txt_6fc0d8")}</h3>
                  <p className="text-xs text-stone-500">
                    {t("residual.ui.cache_consistency_notice")}</p>
                </div>
                <button
                  onClick={handleRefreshCache}
                  disabled={isRefreshingCache || isSyncing || cacheRead.view.state !== "ready"}
                  className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-900 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingCache ? 'animate-spin' : ''}`} />
                  <span>{isRefreshingCache ? t("entityResolution.labels.refreshing") : t("residual.ui.refresh_cache")}</span>
                </button>
              </div>

              {/* Cache Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {cacheMeta.map(meta => (
                  <div
                    key={meta.storeName}
                    className="bg-white rounded-xl border border-stone-200 p-4 shadow-2xs space-y-2 hover:border-amber-300 transition-colors"
                  >
                    <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                      <span className="font-bold text-stone-900 text-xs">
                        {STORE_LABELS[meta.storeName] || meta.storeName}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-mono text-[10px] font-bold">
                        v{meta.version}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-stone-400 block text-[10px]">{t("offline.labels.txt_6464df")}</span>
                        <span className="font-bold text-stone-800">{meta.recordCount + " " + t("analytics.ui.records")}</span>
                      </div>
                      <div>
                        <span className="text-stone-400 block text-[10px]">{t("offline.labels.txt_7490af")}</span>
                        <span className="font-mono text-stone-700 text-[10px]">
                          {new Date(meta.timestamp).toLocaleTimeString(locale)}
                        </span>
                      </div>
                    </div>

                    <div className="text-[10px] text-stone-400 pt-1 border-t border-stone-50 flex items-center justify-between">
                      <span>{t("residual.ui.storage_source_label")}{meta.lastSyncedBy || 'SYSTEM'}</span>
                      <span className="text-emerald-700 font-medium">{t("offline.labels.txt_41cc14")}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Offline Rule Compliance Notice */}
              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 space-y-2">
                <div className="flex items-center gap-1.5 font-bold">
                  <Info className="w-4 h-4 text-amber-700" />
                  <span>{t("offline.labels.txt_9a78d6")}</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-amber-800 pr-2">
                  <li>{t("offline.labels.txt_539bb6")}</li>
                  <li><strong>{t("offline.labels.txt_66cc97")}</strong> {t("offline.labels.createTripPricing")}</li>
                  <li>{t("offline.labels.txt_5cde42")}</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-stone-200 px-6 py-3 flex items-center justify-between">
          <span className="text-xs text-stone-500">
            {t('ui6.local_view_only')}
          </span>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-stone-300 hover:bg-stone-100 text-stone-700 text-xs font-bold transition-colors"
          >
            {t("shared.actions.close")}</button>
        </div>

        {/* Explicit Conflict Resolution Modal */}
        {conflictsReady && <ConflictResolutionModal
          isOpen={isConflictModalOpen}
          conflict={selectedConflict}
          onClose={() => {
            setIsConflictModalOpen(false);
            setSelectedConflict(null);
          }}
          onResolved={(confId, msg) => {
            if (!capture()()) return;
            onNotification?.({
              type: 'SUCCESS',
              message: msg,
            });
            if (capture()()) void loadData();
          }}
        />}

      </div>
    </div>
  );
};
