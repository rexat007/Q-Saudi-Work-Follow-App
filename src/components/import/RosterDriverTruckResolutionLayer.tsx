import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
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
  importBatch,
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
  const [selectedAlternateDriver, setSelectedAlternateDriver] = useState<Record<string, string>>({});
  const [selectedAlternateTruck, setSelectedAlternateTruck] = useState<Record<string, string>>({});

  // Subform modal states (replaces legacy dialogs)
  const [creatingDriverGroup, setCreatingDriverGroup] = useState<RosterEntityReviewGroup | null>(null);
  const [driverFormData, setDriverFormData] = useState<NewDriverFormData>({ driverName: '', residencyId: '', phone: '' });
  const [driverFormError, setDriverFormError] = useState<string | null>(null);

  const [creatingTruckGroup, setCreatingTruckGroup] = useState<RosterEntityReviewGroup | null>(null);
  const [truckFormData, setTruckFormData] = useState<NewTruckFormData>({ plateNumber: '', truckType: '' });
  const [truckFormError, setTruckFormError] = useState<string | null>(null);

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
  const isLayerComplete = totalGroups > 0 && totalUnresolved === 0;

  // Open Driver Creation subform
  const handleOpenDriverCreation = (group: RosterEntityReviewGroup) => {
    setCreatingDriverGroup(group);
    setDriverFormData({
      driverName: group.sourceValue || '',
      residencyId: '',
      phone: '',
    });
    setDriverFormError(null);
  };

  // Submit Driver Creation
  const handleSubmitDriverCreation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!creatingDriverGroup) return;

    if (!driverFormData.driverName.trim()) {
      setDriverFormError('اسم السائق مطلوب');
      return;
    }
    if (!driverFormData.residencyId.trim() || driverFormData.residencyId.trim().length !== 10) {
      setDriverFormError('رقم الهوية الوطنية أو الإقامة يجب أن يتكون من 10 أرقام');
      return;
    }

    try {
      await onCreateDriver(creatingDriverGroup, driverFormData);
      setCreatingDriverGroup(null);
      setDriverFormData({ driverName: '', residencyId: '', phone: '' });
      setDriverFormError(null);
    } catch (err: any) {
      setDriverFormError(err.message || 'فشلت عملية إنشاء السائق');
    }
  };

  // Open Truck Creation subform
  const handleOpenTruckCreation = (group: RosterEntityReviewGroup) => {
    setCreatingTruckGroup(group);
    setTruckFormData({
      plateNumber: group.sourceValue || '',
      truckType: '',
    });
    setTruckFormError(null);
  };

  // Submit Truck Creation
  const handleSubmitTruckCreation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!creatingTruckGroup) return;

    if (!truckFormData.plateNumber.trim()) {
      setTruckFormError('رقم لوحة الشاحنة مطلوب');
      return;
    }

    try {
      await onCreateTruck(creatingTruckGroup, truckFormData);
      setCreatingTruckGroup(null);
      setTruckFormData({ plateNumber: '', truckType: '' });
      setTruckFormError(null);
    } catch (err: any) {
      setTruckFormError(err.message || 'فشلت عملية إنشاء الشاحنة');
    }
  };

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
              <span>مراجعة وحسم السائقين والشاحنات (Driver & Truck Resolution Layer)</span>
              <span className="text-[10px] font-mono bg-stone-800 px-2 py-0.5 rounded-full text-amber-400">
                  المرحلة 5 من 7
                </span>
              </h3>
              <p className="text-[11px] text-stone-400">
                مطابقة وتعيين السائقين والشاحنات وربطهم بالناقلين المصرح بهم قبل المراجعة النهائية
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-6 overflow-y-auto flex-1 text-xs text-stone-300">
          {/* Summary Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-stone-950 p-3.5 rounded-xl border border-stone-850 text-center font-bold">
            <div>
              <span className="block text-stone-500 text-[10px]">مجموعات السائقين</span>
              <span className="text-base font-mono text-white">
                {driverGroups.length} <span className="text-[10px] text-emerald-400 font-normal">({resolvedDriverCount} محسوم)</span>
              </span>
            </div>
            <div className={unresolvedDriverCount > 0 ? 'text-amber-400' : 'text-stone-500'}>
              <span className="block text-stone-500 text-[10px]">سائقون بانتظار الحسم</span>
              <span className="text-base font-mono">{unresolvedDriverCount}</span>
            </div>
            <div>
              <span className="block text-stone-500 text-[10px]">مجموعات الشاحنات</span>
              <span className="text-base font-mono text-white">
                {truckGroups.length} <span className="text-[10px] text-emerald-400 font-normal">({resolvedTruckCount} محسوم)</span>
              </span>
            </div>
            <div className={unresolvedTruckCount > 0 ? 'text-amber-400' : 'text-stone-500'}>
              <span className="block text-stone-500 text-[10px]">شاحنات بانتظار الحسم</span>
              <span className="text-base font-mono">{unresolvedTruckCount}</span>
            </div>
          </div>

          {/* Driver Convergence Recovery Banner */}
          {driverConvergenceError && (
            <div className="bg-amber-950/40 border border-amber-800/60 p-3.5 rounded-xl flex items-center justify-between gap-3 text-amber-200">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                <div className="text-xs">
                  <span className="font-bold block">تم إنشاء السجل بنجاح، لكن تعذر تحديث البيانات الموثوقة.</span>
                  <span className="text-[11px] text-amber-300/80">{driverConvergenceError}</span>
                </div>
              </div>
              {onRetryDriverConvergence && (
                <button
                  type="button"
                  onClick={onRetryDriverConvergence}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold text-xs transition-colors shrink-0"
                >
                  إعادة تحديث البيانات
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
                  <span className="font-bold block">تم إنشاء السجل بنجاح، لكن تعذر تحديث البيانات الموثوقة.</span>
                  <span className="text-[11px] text-amber-300/80">{truckConvergenceError}</span>
                </div>
              </div>
              {onRetryTruckConvergence && (
                <button
                  type="button"
                  onClick={onRetryTruckConvergence}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold text-xs transition-colors shrink-0"
                >
                  إعادة تحديث البيانات
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
                  تم حسم السائقين والشاحنات بنجاح ({resolvedDriverCount} سائقين، {resolvedTruckCount} شاحنات معتمدة)
                </span>
                <span className="text-[11px] text-emerald-300/80">
                  المرحلة التالية هي المراجعة النهائية (C5)
                </span>
              </div>
            </div>
          )}

          {/* Zero Driver/Truck Empty State */}
          {totalGroups === 0 && (
            <div className="text-center py-8 text-stone-500 space-y-1">
              <p className="text-xs">لم يتم اكتشاف أي بيانات للسائقين أو الشاحنات في ملف الاستيراد.</p>
              <p className="text-[10px] text-rose-400">
                يجب توفر بيانات سائق أو شاحنة واحدة على الأقل لكل سجل تشغيل قبل المتابعة.
              </p>
            </div>
          )}

          {/* SECTION A: DRIVERS */}
          {driverGroups.length > 0 && (
            <div className="space-y-3">
              <div className="flex justify-between items-center text-[11px] font-bold text-stone-400 border-b border-stone-800 pb-1.5">
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-white">أولاً: مراجعة وحسم السائقين (Drivers)</span>
                </div>
                <span className="text-[10px] font-mono">({driverGroups.length} مجموعات فريدة)</span>
              </div>

              <div className="space-y-3">
                {driverGroups.map((group) => {
                  const isResolved = group.status === 'AUTO_RESOLVED' || Boolean(group.matchedId);
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
                              الناقل: {carrierContext ? carrierContext : 'غير محدد'}
                            </span>
                            <span className="text-[10px] text-stone-500 font-mono bg-stone-900 px-2 py-0.5 rounded-md border border-stone-850">
                              تكرار: {group.occurrenceCount} صفوف (الصفوف: #{group.rowNumbers.slice(0, 4).join(', ')}
                              {group.rowNumbers.length > 4 ? '...' : ''})
                            </span>
                          </div>

                          {group.matchedName && (
                            <div className="text-emerald-400 text-[10px] flex items-center gap-1 font-mono font-bold">
                              <Check className="w-3 h-3" />
                              <span>مطابق لـ: {group.matchedName} ({group.matchedId})</span>
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
                              <span>مطابق ومعتمد</span>
                            </span>
                          ) : isConflict ? (
                            <span className="px-2.5 py-1 bg-rose-950 text-rose-300 rounded-lg text-[10px] font-bold border border-rose-800 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              <span>تعارض في التعيين</span>
                            </span>
                          ) : isReviewRequired ? (
                            <span className="px-2.5 py-1 bg-amber-950 text-amber-300 rounded-lg text-[10px] font-bold border border-amber-800 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              <span>يتطلب تدقيق واختيار</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 bg-rose-950/70 text-rose-300 rounded-lg text-[10px] font-bold border border-rose-855 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              <span>سائق غير معرّف</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action Controls for Unresolved Driver Groups */}
                      {!isResolved && (
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
                                  <span>اعتماد: {cand.candidateDisplayName || cand.candidateNameAr || cand.candidateEntityId}</span>
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
                                  <option value="">اختيار سائق معتمد للناقل...</option>
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
                                    تعيين
                                  </button>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Create Driver Action */}
                          {carrierContext ? (
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() => handleOpenDriverCreation(group)}
                              className="px-3 py-1 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-lg text-[10px] font-black transition-colors flex items-center gap-1.5 shadow-sm shadow-amber-950/50"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>إنشاء سائق جديد</span>
                            </button>
                          ) : (
                            <span className="text-[10px] text-stone-500 italic">
                              (يتطلب تحديد الناقل أولاً للإنشاء)
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
                  <span className="text-white">ثانياً: مراجعة وحسم الشاحنات (Trucks)</span>
                </div>
                <span className="text-[10px] font-mono">({truckGroups.length} مجموعات فريدة)</span>
              </div>

              <div className="space-y-3">
                {truckGroups.map((group) => {
                  const isResolved = group.status === 'AUTO_RESOLVED' || Boolean(group.matchedId);
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
                              الناقل: {carrierContext ? carrierContext : 'غير محدد'}
                            </span>
                            <span className="text-[10px] text-stone-500 font-mono bg-stone-900 px-2 py-0.5 rounded-md border border-stone-850">
                              تكرار: {group.occurrenceCount} صفوف (الصفوف: #{group.rowNumbers.slice(0, 4).join(', ')}
                              {group.rowNumbers.length > 4 ? '...' : ''})
                            </span>
                          </div>

                          {group.matchedName && (
                            <div className="text-emerald-400 text-[10px] flex items-center gap-1 font-mono font-bold">
                              <Check className="w-3 h-3" />
                              <span>مطابق لـ: {group.matchedName} ({group.matchedId})</span>
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
                              <span>مطابق ومعتمد</span>
                            </span>
                          ) : isConflict ? (
                            <span className="px-2.5 py-1 bg-rose-950 text-rose-300 rounded-lg text-[10px] font-bold border border-rose-800 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              <span>تعارض في التعيين</span>
                            </span>
                          ) : isReviewRequired ? (
                            <span className="px-2.5 py-1 bg-amber-950 text-amber-300 rounded-lg text-[10px] font-bold border border-amber-800 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              <span>يتطلب تدقيق واختيار</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 bg-rose-950/70 text-rose-300 rounded-lg text-[10px] font-bold border border-rose-850 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              <span>شاحنة غير معرّفة</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action Controls for Unresolved Truck Groups */}
                      {!isResolved && (
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
                                  <span>اعتماد: {cand.candidateDisplayName || cand.candidateNameAr || cand.candidateEntityId}</span>
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
                                  <option value="">اختيار شاحنة معتمدة للناقل...</option>
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
                                    تعيين
                                  </button>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Create Truck Action */}
                          {carrierContext ? (
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() => handleOpenTruckCreation(group)}
                              className="px-3 py-1 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-lg text-[10px] font-black transition-colors flex items-center gap-1.5 shadow-sm shadow-amber-950/50"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>إنشاء شاحنة جديدة</span>
                            </button>
                          ) : (
                            <span className="text-[10px] text-stone-500 italic">
                              (يتطلب تحديد الناقل أولاً للإنشاء)
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
                <span>اكتملت مراجعة السائقين والشاحنات لهذا الملف</span>
              </span>
            ) : (
              <span className="text-amber-400 font-bold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>متبقي {totalUnresolved} عنصر (سائق/شاحنة) غير محسوم</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {onCancelImport ? (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('سيتم إلغاء جلسة الاستيراد الحالية وفقدان القرارات غير المنفذة. هل تريد المتابعة؟')) {
                    onCancelImport();
                  }
                }}
                disabled={isProcessing}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold rounded-xl text-xs transition-colors shrink-0"
              >
                إلغاء الاستيراد
              </button>
            ) : onClose ? (
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold rounded-xl text-xs transition-colors shrink-0"
              >
                إغلاق
              </button>
            ) : null}

            {onContinueToFinalReview && (
              <button
                type="button"
                onClick={onContinueToFinalReview}
                disabled={!isLayerComplete || isProcessing || Boolean(driverConvergenceError) || Boolean(truckConvergenceError)}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white font-black rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-amber-950/50 transition-colors shrink-0"
              >
                <span>متابعة إلى المراجعة النهائية</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* COMPACT MODAL: CREATE DRIVER (NO PROMPT) */}
      {creatingDriverGroup && (() => {
        const modalContent = (
          <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-xs z-60 flex items-center justify-center p-4">
            <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-5 space-y-4">
              <div className="flex justify-between items-center border-b border-stone-800 pb-3">
                <h4 className="text-sm font-black text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-500" />
                  <span>إنشاء سائق جديد للناقل</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setCreatingDriverGroup(null)}
                  className="text-stone-400 hover:text-white p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {driverFormError && (
                <div className="bg-rose-950/70 border border-rose-800 p-2.5 rounded-xl text-[11px] text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{driverFormError}</span>
                </div>
              )}

              <form onSubmit={handleSubmitDriverCreation} className="space-y-3 text-xs">
                <div>
                  <label className="block text-stone-400 mb-1 font-bold">الناقل التابع له (محدد تلقائياً):</label>
                  <input
                    type="text"
                    disabled
                    value={extractGroupCarrierContext(creatingDriverGroup) || 'غير محدد'}
                    className="w-full bg-stone-950 border border-stone-800 text-stone-400 px-3 py-2 rounded-xl text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-stone-400 mb-1 font-bold">اسم السائق (كامل):</label>
                  <input
                    type="text"
                    required
                    value={driverFormData.driverName}
                    onChange={(e) => setDriverFormData({ ...driverFormData, driverName: e.target.value })}
                    placeholder="مثال: سالم علي القحطاني"
                    className="w-full bg-stone-950 border border-stone-800 text-stone-200 px-3 py-2 rounded-xl text-xs focus:outline-hidden focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-stone-400 mb-1 font-bold">رقم الهوية الوطنية / الإقامة (10 أرقام):</label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    value={driverFormData.residencyId}
                    onChange={(e) => setDriverFormData({ ...driverFormData, residencyId: e.target.value.replace(/\D/g, '') })}
                    placeholder="مثال: 1023456789 أو 2023456789"
                    className="w-full bg-stone-950 border border-stone-800 text-stone-200 px-3 py-2 rounded-xl text-xs font-mono focus:outline-hidden focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-stone-400 mb-1 font-bold">رقم الجوال (اختياري):</label>
                  <input
                    type="text"
                    value={driverFormData.phone || ''}
                    onChange={(e) => setDriverFormData({ ...driverFormData, phone: e.target.value })}
                    placeholder="مثال: 0501234567"
                    className="w-full bg-stone-950 border border-stone-800 text-stone-200 px-3 py-2 rounded-xl text-xs font-mono focus:outline-hidden focus:border-amber-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-stone-800">
                  <button
                    type="button"
                    onClick={() => setCreatingDriverGroup(null)}
                    disabled={isProcessing}
                    className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold rounded-xl text-xs transition-colors"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="px-5 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-black rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-amber-950/40 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>حفظ وإنشاء السائق</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
        return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
      })()}

      {/* COMPACT MODAL: CREATE TRUCK (NO PROMPT) */}
      {creatingTruckGroup && (() => {
        const modalContent = (
          <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-xs z-60 flex items-center justify-center p-4">
            <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-5 space-y-4">
              <div className="flex justify-between items-center border-b border-stone-800 pb-3">
                <h4 className="text-sm font-black text-white flex items-center gap-2">
                  <Truck className="w-4 h-4 text-amber-500" />
                  <span>إنشاء شاحنة جديدة للناقل</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setCreatingTruckGroup(null)}
                  className="text-stone-400 hover:text-white p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {truckFormError && (
                <div className="bg-rose-950/70 border border-rose-800 p-2.5 rounded-xl text-[11px] text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{truckFormError}</span>
                </div>
              )}

              <form onSubmit={handleSubmitTruckCreation} className="space-y-3 text-xs">
                <div>
                  <label className="block text-stone-400 mb-1 font-bold">الناقل التابع له (محدد تلقائياً):</label>
                  <input
                    type="text"
                    disabled
                    value={extractGroupCarrierContext(creatingTruckGroup) || 'غير محدد'}
                    className="w-full bg-stone-950 border border-stone-800 text-stone-400 px-3 py-2 rounded-xl text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-stone-400 mb-1 font-bold">رقم لوحة الشاحنة:</label>
                  <input
                    type="text"
                    required
                    value={truckFormData.plateNumber}
                    onChange={(e) => setTruckFormData({ ...truckFormData, plateNumber: e.target.value })}
                    placeholder="مثال: أ ب ج 1234"
                    className="w-full bg-stone-950 border border-stone-800 text-stone-200 px-3 py-2 rounded-xl text-xs font-mono focus:outline-hidden focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-stone-400 mb-1 font-bold">نوع الشاحنة / الهيكل (اختياري):</label>
                  <input
                    type="text"
                    value={truckFormData.truckType || ''}
                    onChange={(e) => setTruckFormData({ ...truckFormData, truckType: e.target.value })}
                    placeholder="مثال: قلاب، تريلا، سطحة"
                    className="w-full bg-stone-950 border border-stone-800 text-stone-200 px-3 py-2 rounded-xl text-xs focus:outline-hidden focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-stone-400 mb-1 font-bold">الوزن الفارغ كجم (اختياري):</label>
                    <input
                      type="number"
                      value={truckFormData.tareWeightKg || ''}
                      onChange={(e) => setTruckFormData({ ...truckFormData, tareWeightKg: e.target.value ? Number(e.target.value) : undefined })}
                      placeholder="مثال: 14000"
                      className="w-full bg-stone-950 border border-stone-800 text-stone-200 px-3 py-2 rounded-xl text-xs font-mono focus:outline-hidden focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-400 mb-1 font-bold">الوزن الأقصى كجم (اختياري):</label>
                    <input
                      type="number"
                      value={truckFormData.maxGrossWeightKg || ''}
                      onChange={(e) => setTruckFormData({ ...truckFormData, maxGrossWeightKg: e.target.value ? Number(e.target.value) : undefined })}
                      placeholder="مثال: 45000"
                      className="w-full bg-stone-950 border border-stone-800 text-stone-200 px-3 py-2 rounded-xl text-xs font-mono focus:outline-hidden focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-stone-800">
                  <button
                    type="button"
                    onClick={() => setCreatingTruckGroup(null)}
                    disabled={isProcessing}
                    className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold rounded-xl text-xs transition-colors"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="px-5 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-black rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-amber-950/40 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>حفظ وإنشاء الشاحنة</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
        return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
      })()}
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
