import { CanonicalFleetIdentityEditor } from '../masterData/CanonicalFleetIdentityEditor';
import { contextualFleetDefaults, type ContextualPrerequisiteReceipts } from '../../services/import/contextualCanonicalCreation.service';
import { CanonicalResolutionDecision } from './CanonicalResolutionDecision';
import type { RelationshipContext } from '../../types/dataQuality';
import { presentBatch4Message } from '../../i18n/batch4Messages';
import { useI18n } from '../../i18n';
import React, { useMemo, useState } from 'react';
import { Users, Truck, Check, AlertCircle, AlertTriangle, Plus, X, UserCheck, ShieldCheck, ArrowLeft } from 'lucide-react';
import { UnifiedImportBatch } from '../../types/unifiedImport';
import { RosterBatchReviewService, RosterEntityReviewGroup } from '../../services/import/rosterBatchReview.service';

export interface ProjectDriverOption {
  driverId: string;
  name?: string;
  idNumber?: string;
  carrierId?: string;
  phone?: string;
  status?: string;
}

export interface ProjectTruckOption {
  truckId: string;
  plate?: string;
  carrierId?: string;
  truckType?: string;
  status?: string;
}

export interface NewDriverFormData {
  driverName: string;
  residencyId: string;
  phone?: string;
}

export interface NewTruckFormData {
  plateNumber: string;
  truckType?: string;
  tareWeightKg?: number;
  maxGrossWeightKg?: number;
}

export interface RosterDriverTruckResolutionLayerProps {
  receipts?: ContextualPrerequisiteReceipts;
  canManageParticipation?: boolean;
  canonicalContext?: RelationshipContext;
  onCanonicalVerified?: (group: RosterEntityReviewGroup, context: RelationshipContext, id: string, prerequisite?: string) => Promise<void>|void;
  isCurrent?: () => boolean;
  importBatch: UnifiedImportBatch;
  projectDrivers?: ProjectDriverOption[];
  projectTrucks?: ProjectTruckOption[];
  onAcceptCandidate: (group: RosterEntityReviewGroup, candidateEntityId: string) => Promise<void> | void;
  onSelectAlternate?: (group: RosterEntityReviewGroup, entityId: string) => Promise<void> | void;
  onCreateDriver: (group: RosterEntityReviewGroup, data: NewDriverFormData) => Promise<void> | void;
  onCreateTruck: (group: RosterEntityReviewGroup, data: NewTruckFormData) => Promise<void> | void;
  onClose?: () => void;
  isProcessing?: boolean;
  driverConvergenceError?: string | null;
  truckConvergenceError?: string | null;
  onRetryDriverConvergence?: () => Promise<void> | void;
  onRetryTruckConvergence?: () => Promise<void> | void;
  onContinueToFinalReview?: () => void;
  onCancelImport?: () => void;
  embeddedInWorkflowHost?: boolean;
}

/**
 * Extracts the carrier ID encoded in the group key (driver:...::carrier:<carrierId>)
 */
export function extractGroupCarrierContext(group: RosterEntityReviewGroup): string {
  if (group.normalizedSourceKey && group.normalizedSourceKey.includes('::carrier:')) {
    const parts = group.normalizedSourceKey.split('::carrier:');
    const cId = parts[1]?.trim();
    if (cId && cId !== 'UNRESOLVED_CARRIER') {
      return cId;
    }
  }
  return '';
}

export const RosterDriverTruckResolutionLayer: React.FC<RosterDriverTruckResolutionLayerProps> = ({
  importBatch, canManageParticipation = true, receipts, canonicalContext, onCanonicalVerified, isCurrent = () => true,
  projectDrivers = [],
  projectTrucks = [],
  onAcceptCandidate,
  onSelectAlternate,
  onCreateDriver,
  onCreateTruck,
  onClose,
  isProcessing = false,
  driverConvergenceError,
  truckConvergenceError,
  onRetryDriverConvergence,
  onRetryTruckConvergence,
  onContinueToFinalReview,
  onCancelImport,
  embeddedInWorkflowHost = false,
}) => {
  const { t } = useI18n();
  const [selectedAlternateDriver, setSelectedAlternateDriver] = useState<Record<string, string>>({});
  const [selectedAlternateTruck, setSelectedAlternateTruck] = useState<Record<string, string>>({});

  const [creatingDriverGroup,setCreatingDriverGroup]=useState<RosterEntityReviewGroup|null>(null);
  const [creatingTruckGroup,setCreatingTruckGroup]=useState<RosterEntityReviewGroup|null>(null);
  const reviewGroups = useMemo(() => {
    return RosterBatchReviewService.getBatchReviewGroups(importBatch);
  }, [importBatch]);

  // C4: STRICT DRIVER & TRUCK SCOPE
  const driverGroups: RosterEntityReviewGroup[] = reviewGroups.driver || [];
  const truckGroups: RosterEntityReviewGroup[] = reviewGroups.truck || [];

  const unresolvedDriverCount = useMemo(() => {
    return driverGroups.filter(
      (g) => g.status === 'REVIEW_REQUIRED' || g.status === 'UNRESOLVED' || g.status === 'CONFLICT'
    ).length;
  }, [driverGroups]);

  const unresolvedTruckCount = useMemo(() => {
    return truckGroups.filter(
      (g) => g.status === 'REVIEW_REQUIRED' || g.status === 'UNRESOLVED' || g.status === 'CONFLICT'
    ).length;
  }, [truckGroups]);

  const resolvedDriverCount = driverGroups.length - unresolvedDriverCount;
  const resolvedTruckCount = truckGroups.length - unresolvedTruckCount;

  const totalGroups = driverGroups.length + truckGroups.length;
  const totalUnresolved = unresolvedDriverCount + unresolvedTruckCount;
  const isDriverLayerComplete = driverGroups.length > 0 ? unresolvedDriverCount === 0 : true;
  const isTruckLayerComplete = truckGroups.length > 0 ? unresolvedTruckCount === 0 : true;
  const isLayerComplete = (totalGroups > 0 || Boolean(canonicalContext)) && totalUnresolved === 0;

  const handleOpenDriverCreation=(group:RosterEntityReviewGroup)=>setCreatingDriverGroup(group);
  const handleOpenTruckCreation=(group:RosterEntityReviewGroup)=>setCreatingTruckGroup(group);
  const handleCloseDriverModal=()=>setCreatingDriverGroup(null);
  const handleCloseTruckModal=()=>setCreatingTruckGroup(null);
  const creatingGroup=creatingDriverGroup||creatingTruckGroup;
  const defaults=creatingGroup?contextualFleetDefaults(importBatch,creatingGroup):undefined;
  const creationCarriers=(canonicalContext?.importResolution?.entities||[]).filter(e=>e.kind==='CARRIER'&&e.membershipStatus==='ACTIVE'&&e.globalStatus==='ACTIVE'&&!e.issue);
  const panelContent = (
    <>
      <div className={`bg-stone-900 border border-stone-800 rounded-2xl w-full overflow-hidden flex flex-col ${embeddedInWorkflowHost ? 'flex-1 min-h-0' : 'max-w-4xl shadow-2xl max-h-[90vh]'}`}>
      {/* Header */}
      <div className="p-5 border-b border-stone-800 bg-stone-950 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <span>{t('entityResolution.labels.driver_truck_review_title')}</span>
              <span className="text-[10px] font-mono bg-stone-800 px-2 py-0.5 rounded-full text-amber-400">
                  {t('entityResolution.labels.stage_progress', { stage: 5, total: 7 })}
                </span>
              </h3>
              <p className="text-[11px] text-stone-400">
                {t('entityResolution.labels.driver_truck_review_description')}
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-6 overflow-y-auto flex-1 text-xs text-stone-300">
          {/* Summary Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-stone-950 p-3.5 rounded-xl border border-stone-850 text-center font-bold">
            <div>
              <span className="block text-stone-500 text-[10px]">{t('entityResolution.labels.driver_groups')}</span>
              <span className="text-base font-mono text-white">
                {driverGroups.length} <span className="text-[10px] text-emerald-400 font-normal">{t('entityResolution.labels.resolved_count', { count: resolvedDriverCount })}</span>
              </span>
            </div>
            <div className={unresolvedDriverCount > 0 ? 'text-amber-400' : 'text-stone-500'}>
              <span className="block text-stone-500 text-[10px]">{t('entityResolution.labels.drivers_pending_resolution')}</span>
              <span className="text-base font-mono">{unresolvedDriverCount}</span>
            </div>
            <div>
              <span className="block text-stone-500 text-[10px]">{t('entityResolution.labels.truck_groups')}</span>
              <span className="text-base font-mono text-white">
                {truckGroups.length} <span className="text-[10px] text-emerald-400 font-normal">{t('entityResolution.labels.resolved_count', { count: resolvedTruckCount })}</span>
              </span>
            </div>
            <div className={unresolvedTruckCount > 0 ? 'text-amber-400' : 'text-stone-500'}>
              <span className="block text-stone-500 text-[10px]">{t('entityResolution.labels.trucks_pending_resolution')}</span>
              <span className="text-base font-mono">{unresolvedTruckCount}</span>
            </div>
          </div>

          {/* Driver Convergence Recovery Banner */}
          {driverConvergenceError && (
            <div className="bg-amber-950/40 border border-amber-800/60 p-3.5 rounded-xl flex items-center justify-between gap-3 text-amber-200">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                <div className="text-xs">
                  <span className="font-bold block">{t('entityResolution.messages.created_refresh_failed')}</span>
                  <span className="text-[11px] text-amber-300/80">{presentBatch4Message(driverConvergenceError, t)}</span>
                </div>
              </div>
              {onRetryDriverConvergence && (
                <button
                  type="button"
                  onClick={onRetryDriverConvergence}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold text-xs transition-colors shrink-0"
                >
                  {t('entityResolution.labels.refresh_data')}
                </button>
              )}
            </div>
          )}

          {/* Truck Convergence Recovery Banner */}
          {truckConvergenceError && (
            <div className="bg-amber-950/40 border border-amber-800/60 p-3.5 rounded-xl flex items-center justify-between gap-3 text-amber-200">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                <div className="text-xs">
                  <span className="font-bold block">{t('entityResolution.messages.created_refresh_failed')}</span>
                  <span className="text-[11px] text-amber-300/80">{presentBatch4Message(truckConvergenceError, t)}</span>
                </div>
              </div>
              {onRetryTruckConvergence && (
                <button
                  type="button"
                  onClick={onRetryTruckConvergence}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold text-xs transition-colors shrink-0"
                >
                  {t('entityResolution.labels.refresh_data')}
                </button>
              )}
            </div>
          )}

          {/* Completion Notice Banner */}
          {isLayerComplete && (
            <div className="bg-emerald-950/40 border border-emerald-800/60 p-3.5 rounded-xl flex items-center gap-3 text-emerald-200">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <div className="text-xs">
                <span className="font-bold block">
                  {t('entityResolution.messages.drivers_trucks_resolved', { drivers: resolvedDriverCount, trucks: resolvedTruckCount })}</span>
                <span className="text-[11px] text-emerald-300/80">
                  {t('entityResolution.messages.final_review_next_stage')}
                </span>
              </div>
            </div>
          )}

          {/* Zero Driver/Truck Empty State */}
          {totalGroups === 0 && (
            <div className="text-center py-8 text-stone-500 space-y-1">
              <p className="text-xs">{t('entityResolution.labels.no_driver_truck_data')}</p>
              <p className="text-[10px] text-rose-400">
                {t('entityResolution.labels.driver_or_truck_required')}
              </p>
            </div>
          )}

          {/* SECTION A: DRIVERS */}
          {driverGroups.length > 0 && (
            <div className="space-y-3">
              <div className="flex justify-between items-center text-[11px] font-bold text-stone-400 border-b border-stone-800 pb-1.5">
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-white">{t('entityResolution.labels.driver_review_section')}</span>
                </div>
                <span className="text-[10px] font-mono">{t('entityResolution.labels.unique_items_count', { count: driverGroups.length })}</span>
              </div>

              <div className="space-y-3">
                {driverGroups.map((group) => {
                  const isResolved = group.status === 'AUTO_RESOLVED';
                  const isConflict = group.status === 'CONFLICT';
                  const isReviewRequired = group.status === 'REVIEW_REQUIRED';
                  const carrierContext = extractGroupCarrierContext(group);

                  // Filter alternate drivers to same carrier context
                  const availableAlternateDrivers = carrierContext
                    ? projectDrivers.filter((d) => d.carrierId === carrierContext)
                    : [];

                  return (
                    <div
                      key={group.normalizedSourceKey}
                      className="bg-stone-950 border border-stone-850 p-3.5 rounded-xl space-y-2.5 transition-all hover:border-stone-800"
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-white font-black text-xs">{group.sourceValue}</span>
                            <span className="text-[10px] text-stone-400 font-mono bg-stone-900 px-2 py-0.5 rounded-md border border-stone-850">
                              {t('operations.carrier')} {carrierContext ? carrierContext : t('shared.labels.unspecified')}
                            </span>
                            <span className="text-[10px] text-stone-500 font-mono bg-stone-900 px-2 py-0.5 rounded-md border border-stone-850">
                              {t('entityResolution.labels.duplicate_rows', { count: group.occurrenceCount })} ({t('entityResolution.labels.row_numbers', { rows: group.rowNumbers.slice(0, 4).join(', ') })}{group.rowNumbers.length > 4 ? '...' : ''})</span>
                          </div>

                          {group.matchedName && (
                            <div className="text-emerald-400 text-[10px] flex items-center gap-1 font-mono font-bold">
                              <Check className="w-3 h-3" />
                              <span>{t('entityResolution.labels.matched_to_prefix')} {group.matchedName} ({group.matchedId})</span>
                            </div>
                          )}

                          {isConflict && group.currentResolution?.conflictDetails && (
                            <div className="text-rose-400 text-[10px] flex items-center gap-1">
                              <AlertCircle className="w-3 h-3 shrink-0" />
                              <span>{group.currentResolution.conflictDetails}</span>
                            </div>
                          )}
                        </div>

                        {/* Status Badges */}
                        <div>
                          {isResolved ? (
                            <span className="px-2.5 py-1 bg-emerald-950 text-emerald-400 rounded-lg text-[10px] font-bold border border-emerald-800 flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              <span>{t('entityResolution.labels.matched_approved')}</span>
                            </span>
                          ) : isConflict ? (
                            <span className="px-2.5 py-1 bg-rose-950 text-rose-300 rounded-lg text-[10px] font-bold border border-rose-800 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              <span>{t('entityResolution.labels.assignment_conflict')}</span>
                            </span>
                          ) : isReviewRequired ? (
                            <span className="px-2.5 py-1 bg-amber-950 text-amber-300 rounded-lg text-[10px] font-bold border border-amber-800 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              <span>{t('entityResolution.labels.review_selection_required')}</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 bg-rose-950/70 text-rose-300 rounded-lg text-[10px] font-bold border border-rose-855 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              <span>{t('entityResolution.labels.unmatched')}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {canonicalContext&&onCanonicalVerified&&<CanonicalResolutionDecision receipts={receipts} receiptScope={importBatch.importBatchId} canMutate={canManageParticipation} projectId={importBatch.projectId} context={canonicalContext} group={group} carrierId={extractGroupCarrierContext(group)} isCurrent={isCurrent} disabled={isProcessing} onSelect={id=>onSelectAlternate?.(group,id)} onCreate={()=>handleOpenDriverCreation(group)} onVerified={(ctx,id,prerequisite)=>onCanonicalVerified(group,ctx,id,prerequisite)}/>}
                      {/* Action Controls for Unresolved Driver Groups */}
                      {!canonicalContext && !isResolved && (
                        <div className="pt-2 border-t border-stone-900 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {/* Candidate Acceptance */}
                            {group.candidates && group.candidates.length > 0 && (
                              group.candidates.map((cand: any) => (
                                <button
                                  key={cand.candidateEntityId}
                                  type="button"
                                  disabled={isProcessing}
                                  onClick={() => onAcceptCandidate(group, cand.candidateEntityId)}
                                  className="px-2.5 py-1 bg-stone-850 hover:bg-amber-600 hover:text-white text-stone-200 rounded-lg text-[10px] font-bold transition-colors disabled:opacity-50 flex items-center gap-1"
                                >
                                  <UserCheck className="w-3 h-3 text-amber-400" />
                                  <span>{t('entityResolution.labels.accept_suggested_match')}: {cand.candidateDisplayName || cand.candidateNameAr || cand.candidateEntityId}</span>
                                </button>
                              ))
                            )}

                            {/* Alternate Driver Dropdown (Strictly filtered by carrier) */}
                            {availableAlternateDrivers.length > 0 && onSelectAlternate && (
                              <div className="flex items-center gap-1">
                                <select
                                  value={selectedAlternateDriver[group.normalizedSourceKey] || ''}
                                  onChange={(e) =>
                                    setSelectedAlternateDriver((prev) => ({
                                      ...prev,
                                      [group.normalizedSourceKey]: e.target.value,
                                    }))
                                  }
                                  className="bg-stone-900 border border-stone-800 text-stone-300 px-2 py-1 rounded-lg text-[10px] focus:outline-hidden"
                                >
                                  <option value="">{t('entityResolution.labels.select_carrier_driver')}</option>
                                  {availableAlternateDrivers.map((d) => (
                                    <option key={d.driverId} value={d.driverId}>
                                      {d.name || d.driverId} ({d.idNumber || d.driverId})
                                    </option>
                                  ))}
                                </select>
                                {selectedAlternateDriver[group.normalizedSourceKey] && (
                                  <button
                                    type="button"
                                    disabled={isProcessing}
                                    onClick={() =>
                                      onSelectAlternate(
                                        group,
                                        selectedAlternateDriver[group.normalizedSourceKey]
                                      )
                                    }
                                    className="px-2 py-1 bg-stone-800 hover:bg-emerald-600 hover:text-white text-emerald-400 rounded-lg text-[10px] font-bold transition-colors disabled:opacity-50"
                                  >
                                    {t('entityResolution.labels.choose_alternative')}
                                  </button>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Create Driver Action */}
                          {carrierContext ? (
                            <button
                              type="button"
                              disabled={isProcessing || !canManageParticipation}
                              onClick={() => handleOpenDriverCreation(group)}
                              className="px-3 py-1 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-lg text-[10px] font-black transition-colors flex items-center gap-1.5 shadow-sm shadow-amber-950/50"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>{t('entityResolution.labels.create_driver')}</span>
                            </button>
                          ) : (
                            <span className="text-[10px] text-stone-500 italic">
                              {t('entityResolution.labels.select_carrier_before_create')}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SECTION B: TRUCKS */}
          {truckGroups.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center text-[11px] font-bold text-stone-400 border-b border-stone-800 pb-1.5">
                <div className="flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-white">{t('entityResolution.labels.truck_review_section')}</span>
                </div>
                <span className="text-[10px] font-mono">{t('entityResolution.labels.unique_items_count', { count: truckGroups.length })}</span>
              </div>

              <div className="space-y-3">
                {truckGroups.map((group) => {
                  const isResolved = group.status === 'AUTO_RESOLVED';
                  const isConflict = group.status === 'CONFLICT';
                  const isReviewRequired = group.status === 'REVIEW_REQUIRED';
                  const carrierContext = extractGroupCarrierContext(group);

                  // Filter alternate trucks to same carrier context
                  const availableAlternateTrucks = carrierContext
                    ? projectTrucks.filter((t) => t.carrierId === carrierContext)
                    : [];

                  return (
                    <div
                      key={group.normalizedSourceKey}
                      className="bg-stone-950 border border-stone-850 p-3.5 rounded-xl space-y-2.5 transition-all hover:border-stone-800"
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-white font-black text-xs">{group.sourceValue}</span>
                            <span className="text-[10px] text-stone-400 font-mono bg-stone-900 px-2 py-0.5 rounded-md border border-stone-850">
                              {t('operations.carrier')} {carrierContext ? carrierContext : t('shared.labels.unspecified')}
                            </span>
                            <span className="text-[10px] text-stone-500 font-mono bg-stone-900 px-2 py-0.5 rounded-md border border-stone-850">
                              {t('entityResolution.labels.duplicate_rows', { count: group.occurrenceCount })} ({t('entityResolution.labels.row_numbers', { rows: group.rowNumbers.slice(0, 4).join(', ') })}{group.rowNumbers.length > 4 ? '...' : ''})</span>
                          </div>

                          {group.matchedName && (
                            <div className="text-emerald-400 text-[10px] flex items-center gap-1 font-mono font-bold">
                              <Check className="w-3 h-3" />
                              <span>{t('entityResolution.labels.matched_to_prefix')} {group.matchedName} ({group.matchedId})</span>
                            </div>
                          )}

                          {isConflict && group.currentResolution?.conflictDetails && (
                            <div className="text-rose-400 text-[10px] flex items-center gap-1">
                              <AlertCircle className="w-3 h-3 shrink-0" />
                              <span>{group.currentResolution.conflictDetails}</span>
                            </div>
                          )}
                        </div>

                        {/* Status Badges */}
                        <div>
                          {isResolved ? (
                            <span className="px-2.5 py-1 bg-emerald-950 text-emerald-400 rounded-lg text-[10px] font-bold border border-emerald-800 flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              <span>{t('entityResolution.labels.matched_approved')}</span>
                            </span>
                          ) : isConflict ? (
                            <span className="px-2.5 py-1 bg-rose-950 text-rose-300 rounded-lg text-[10px] font-bold border border-rose-800 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              <span>{t('entityResolution.labels.assignment_conflict')}</span>
                            </span>
                          ) : isReviewRequired ? (
                            <span className="px-2.5 py-1 bg-amber-950 text-amber-300 rounded-lg text-[10px] font-bold border border-amber-800 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              <span>{t('entityResolution.labels.review_selection_required')}</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 bg-rose-950/70 text-rose-300 rounded-lg text-[10px] font-bold border border-rose-850 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              <span>{t('entityResolution.labels.unmatched')}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {canonicalContext&&onCanonicalVerified&&<CanonicalResolutionDecision receipts={receipts} receiptScope={importBatch.importBatchId} canMutate={canManageParticipation} projectId={importBatch.projectId} context={canonicalContext} group={group} carrierId={extractGroupCarrierContext(group)} isCurrent={isCurrent} disabled={isProcessing} onSelect={id=>onSelectAlternate?.(group,id)} onCreate={()=>handleOpenTruckCreation(group)} onVerified={(ctx,id,prerequisite)=>onCanonicalVerified(group,ctx,id,prerequisite)}/>}
                      {/* Action Controls for Unresolved Truck Groups */}
                      {!canonicalContext && !isResolved && (
                        <div className="pt-2 border-t border-stone-900 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {/* Candidate Acceptance */}
                            {group.candidates && group.candidates.length > 0 && (
                              group.candidates.map((cand: any) => (
                                <button
                                  key={cand.candidateEntityId}
                                  type="button"
                                  disabled={isProcessing}
                                  onClick={() => onAcceptCandidate(group, cand.candidateEntityId)}
                                  className="px-2.5 py-1 bg-stone-850 hover:bg-amber-600 hover:text-white text-stone-200 rounded-lg text-[10px] font-bold transition-colors disabled:opacity-50 flex items-center gap-1"
                                >
                                  <UserCheck className="w-3 h-3 text-amber-400" />
                                  <span>{t('entityResolution.labels.accept_suggested_match')}: {cand.candidateDisplayName || cand.candidateNameAr || cand.candidateEntityId}</span>
                                </button>
                              ))
                            )}

                            {/* Alternate Truck Dropdown (Strictly filtered by carrier) */}
                            {availableAlternateTrucks.length > 0 && onSelectAlternate && (
                              <div className="flex items-center gap-1">
                                <select
                                  value={selectedAlternateTruck[group.normalizedSourceKey] || ''}
                                  onChange={(e) =>
                                    setSelectedAlternateTruck((prev) => ({
                                      ...prev,
                                      [group.normalizedSourceKey]: e.target.value,
                                    }))
                                  }
                                  className="bg-stone-900 border border-stone-800 text-stone-300 px-2 py-1 rounded-lg text-[10px] focus:outline-hidden"
                                >
                                  <option value="">{t('entityResolution.labels.select_carrier_truck')}</option>
                                  {availableAlternateTrucks.map((t) => (
                                    <option key={t.truckId} value={t.truckId}>
                                      {t.plate || t.truckId} ({t.truckType || t.truckId})
                                    </option>
                                  ))}
                                </select>
                                {selectedAlternateTruck[group.normalizedSourceKey] && (
                                  <button
                                    type="button"
                                    disabled={isProcessing}
                                    onClick={() =>
                                      onSelectAlternate(
                                        group,
                                        selectedAlternateTruck[group.normalizedSourceKey]
                                      )
                                    }
                                    className="px-2 py-1 bg-stone-800 hover:bg-emerald-600 hover:text-white text-emerald-400 rounded-lg text-[10px] font-bold transition-colors disabled:opacity-50"
                                  >
                                    {t('entityResolution.labels.choose_alternative')}
                                  </button>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Create Truck Action */}
                          {carrierContext ? (
                            <button
                              type="button"
                              disabled={isProcessing || !canManageParticipation}
                              onClick={() => handleOpenTruckCreation(group)}
                              className="px-3 py-1 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-lg text-[10px] font-black transition-colors flex items-center gap-1.5 shadow-sm shadow-amber-950/50"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>{t('entityResolution.labels.create_truck')}</span>
                            </button>
                          ) : (
                            <span className="text-[10px] text-stone-500 italic">
                              {t('entityResolution.labels.select_carrier_before_create')}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-800 bg-stone-950 flex flex-wrap sm:flex-nowrap justify-between items-center gap-3 shrink-0">
          <div className="text-[11px] text-stone-400 font-medium shrink-0">
            {isLayerComplete ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>{t('entityResolution.messages.drivers_trucks_resolved', { drivers: resolvedDriverCount, trucks: resolvedTruckCount })}</span>
              </span>
            ) : (
              <span className="text-amber-400 font-bold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{t('entityResolution.labels.unresolved_groups_remaining', { count: totalUnresolved })}</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {onCancelImport ? (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(t('entityResolution.messages.confirm_cancel_import'))) {
                    onCancelImport();
                  }
                }}
                disabled={isProcessing}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold rounded-xl text-xs transition-colors shrink-0"
              >
                {t('entityResolution.labels.cancel_import')}
              </button>
            ) : onClose ? (
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold rounded-xl text-xs transition-colors shrink-0"
              >
                {t('shared.actions.close')}
              </button>
            ) : null}

            {onContinueToFinalReview && (
              <button
                type="button"
                onClick={onContinueToFinalReview}
                disabled={!isLayerComplete || isProcessing || Boolean(driverConvergenceError) || Boolean(truckConvergenceError)}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white font-black rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-amber-950/50 transition-colors shrink-0"
              >
                <span>{t('entityResolution.labels.continue_final_review')}</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {creatingGroup && defaults && <CanonicalFleetIdentityEditor key={`${importBatch.projectId}:${importBatch.importBatchId}:${creatingGroup.normalizedSourceKey}`} projectId={importBatch.projectId} kind={creatingDriverGroup?'DRIVER':'TRUCK'} initialValues={defaults} conflicts={defaults.conflicts} carriers={creationCarriers} lockCarrier planned isCurrent={isCurrent} onClose={()=>{handleCloseDriverModal();handleCloseTruckModal();}} onSubmit={async data=>{if(!canManageParticipation)throw Error('FORBIDDEN');if(creatingDriverGroup)await onCreateDriver(creatingDriverGroup,data);else if(creatingTruckGroup)await onCreateTruck(creatingTruckGroup,data);}}/>}
    </>
  );

  if (embeddedInWorkflowHost) {
    return panelContent;
  }

  return (
    <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      {panelContent}
    </div>
  );
};
