import React, { useMemo, useState } from 'react';
import { Layers, Check, AlertCircle, AlertTriangle, Plus, X, UserCheck, ShieldCheck, ChevronLeft } from 'lucide-react';
import { UnifiedImportBatch } from '../../types/unifiedImport';
import { RosterBatchReviewService, RosterEntityReviewGroup } from '../../services/import/rosterBatchReview.service';

export interface ProjectMaterialOption {
  materialId: string;
  name?: string;
  nameAr?: string;
  nameEn?: string;
  code?: string;
}

export interface RosterMaterialResolutionLayerProps {
  importBatch: UnifiedImportBatch;
  projectMaterials?: ProjectMaterialOption[];
  onAcceptCandidate: (group: RosterEntityReviewGroup, candidateEntityId: string) => Promise<void> | void;
  onSelectAlternate?: (group: RosterEntityReviewGroup, materialId: string) => Promise<void> | void;
  onCreateMaterial: (group: RosterEntityReviewGroup) => void;
  onContinueToDriverTruck?: () => void;
  onCancelImport?: () => void;
  onClose?: () => void;
  isProcessing?: boolean;
  embeddedInWorkflowHost?: boolean;
}

export const checkMaterialResolutionReadiness = (batch: UnifiedImportBatch): boolean => {
  if (!batch || !batch.rows) return false;
  const groups = RosterBatchReviewService.getBatchReviewGroups(batch);
  const materialGroups = groups.material || [];
  if (materialGroups.length === 0) return false;

  const hasUnresolvedGroups = materialGroups.some(
    (g) => g.status === 'REVIEW_REQUIRED' || g.status === 'UNRESOLVED' || g.status === 'CONFLICT'
  );
  if (hasUnresolvedGroups) return false;

  const activeRows = batch.rows.filter((r) => r.status !== 'REJECTED');
  if (activeRows.length === 0) return false;

  const hasMissingOrUnresolvedRow = activeRows.some((r) => {
    const materialRes = r.entityResolutions?.material;
    return !materialRes?.matchedId || materialRes.status === 'UNRESOLVED' || materialRes.status === 'CONFLICT';
  });
  if (hasMissingOrUnresolvedRow) return false;

  const issues = batch.issues || [];
  const hasMaterialBlockingIssue = issues.some(
    (iss) => (iss.severity === 'BLOCKING' || iss.blocking) &&
      (iss.field === 'materialId' || iss.field === 'materialName' || iss.code === 'UNRESOLVED_MATERIAL' || String(iss.code).startsWith('MATERIAL_'))
  );
  if (hasMaterialBlockingIssue) return false;

  return true;
};

export const RosterMaterialResolutionLayer: React.FC<RosterMaterialResolutionLayerProps> = ({
  importBatch,
  projectMaterials = [],
  onAcceptCandidate,
  onSelectAlternate,
  onCreateMaterial,
  onContinueToDriverTruck,
  onCancelImport,
  onClose,
  isProcessing = false,
  embeddedInWorkflowHost = false,
}) => {
  const [selectedAlternateMaterial, setSelectedAlternateMaterial] = useState<Record<string, string>>({});

  const reviewGroups = useMemo(() => {
    return RosterBatchReviewService.getBatchReviewGroups(importBatch);
  }, [importBatch]);

  // C3: STRICT MATERIAL-ONLY SCOPE
  const materialGroups: RosterEntityReviewGroup[] = reviewGroups.material || [];

  const unresolvedCount = useMemo(() => {
    return materialGroups.filter(
      (g) => g.status === 'REVIEW_REQUIRED' || g.status === 'UNRESOLVED' || g.status === 'CONFLICT'
    ).length;
  }, [materialGroups]);

  const resolvedCount = materialGroups.length - unresolvedCount;
  const isMaterialLayerComplete =
    materialGroups.length > 0 && unresolvedCount === 0 && checkMaterialResolutionReadiness(importBatch);

  const panelContent = (
    <div className={`bg-stone-900 border border-stone-800 rounded-2xl w-full overflow-hidden flex flex-col ${embeddedInWorkflowHost ? 'flex-1 min-h-0' : 'max-w-3xl shadow-2xl max-h-[85vh]'}`}>
      {/* Header */}
      <div className="p-5 border-b border-stone-800 bg-stone-950 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <span>مراجعة وحسم المواد (Material Resolution Layer)</span>
              <span className="text-[10px] font-mono bg-stone-800 px-2 py-0.5 rounded-full text-amber-400">
                المرحلة 4 من 7
              </span>
            </h3>
            <p className="text-[11px] text-stone-400">
              مطابقة وتعيين المواد المصرح بها للمشروع قبل الانتقال لطبقة السائقين والشاحنات
            </p>
          </div>
        </div>
      </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs text-stone-300">
          {/* Summary Stats Banner */}
          <div className="grid grid-cols-3 gap-3 bg-stone-950 p-3 rounded-xl border border-stone-850 text-center font-bold">
            <div>
              <span className="block text-stone-500 text-[10px]">مجموعات المواد المصدرية</span>
              <span className="text-base font-mono text-white">{materialGroups.length}</span>
            </div>
            <div className="text-emerald-400">
              <span className="block text-stone-500 text-[10px]">مواد محسومة ومعتمدة</span>
              <span className="text-base font-mono">{resolvedCount}</span>
            </div>
            <div className={unresolvedCount > 0 ? 'text-amber-400' : 'text-stone-500'}>
              <span className="block text-stone-500 text-[10px]">بحاجة لحسم أو إنشاء</span>
              <span className="text-base font-mono">{unresolvedCount}</span>
            </div>
          </div>

          {/* Completion Notice Banner */}
          {isMaterialLayerComplete && (
            <div className="bg-emerald-950/40 border border-emerald-800/60 p-3.5 rounded-xl flex items-center justify-between gap-3 text-emerald-200">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                <div className="text-xs">
                  <span className="font-bold block">تم حسم جميع المواد بنجاح ({materialGroups.length} مجموعات مواد معتمدة)</span>
                  <span className="text-[11px] text-emerald-300/80">طبقة السائقين والشاحنات ستُفتح في المرحلة التالية (C4)</span>
                </div>
              </div>
              {onContinueToDriverTruck && (
                <button
                  type="button"
                  onClick={onContinueToDriverTruck}
                  disabled={isProcessing}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-emerald-950/50 transition-colors shrink-0"
                >
                  <span>متابعة إلى مراجعة السائقين والشاحنات</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* Material Groups List */}
          {materialGroups.length === 0 ? (
            <div className="text-center py-8 text-stone-500 space-y-1">
              <p className="text-xs">لم يتم اكتشاف بيانات مواد قابلة للحسم في ملف الاستيراد.</p>
              <p className="text-[10px] text-rose-400">المادة مطلوبة لكل سجل تشغيل. راجع ربط عمود المادة أو بيانات المصدر قبل المتابعة.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between items-center text-[11px] font-bold text-stone-400 px-1">
                <span>قائمة مجموعات المواد المصدرية:</span>
                <span className="text-[10px] font-mono">({materialGroups.length} عناصر فريدة)</span>
              </div>

              {materialGroups.map((group) => {
                const isResolved = group.status === 'AUTO_RESOLVED' || Boolean(group.matchedId);
                const isConflict = group.status === 'CONFLICT';
                const isReviewRequired = group.status === 'REVIEW_REQUIRED';

                return (
                  <div
                    key={group.normalizedSourceKey}
                    className="bg-stone-950 border border-stone-850 p-3.5 rounded-xl space-y-2.5 transition-all hover:border-stone-800"
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-black text-xs">{group.sourceValue}</span>
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
                            <span>غير معرّفة في المشروع</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Controls for Unresolved / Review Groups */}
                    {!isResolved && (
                      <div className="pt-2 border-t border-stone-900 flex flex-wrap items-center justify-between gap-2">
                        {/* Candidates and Alternate Picker */}
                        <div className="flex items-center gap-1.5 flex-wrap">
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
                                <span>اعتماد: {cand.candidateDisplayName || cand.candidateNameAr}</span>
                              </button>
                            ))
                          )}

                          {/* Alternate existing project material dropdown if available */}
                          {projectMaterials.length > 0 && onSelectAlternate && (
                            <div className="flex items-center gap-1">
                              <select
                                value={selectedAlternateMaterial[group.normalizedSourceKey] || ''}
                                onChange={(e) =>
                                  setSelectedAlternateMaterial((prev) => ({
                                    ...prev,
                                    [group.normalizedSourceKey]: e.target.value,
                                  }))
                                }
                                className="bg-stone-900 border border-stone-800 text-stone-300 px-2 py-1 rounded-lg text-[10px] focus:outline-hidden"
                              >
                                <option value="">اختيار مادة معتمدة أخرى...</option>
                                {projectMaterials.map((pm) => (
                                  <option key={pm.materialId} value={pm.materialId}>
                                    {pm.nameAr || pm.name || pm.nameEn} ({pm.code || pm.materialId})
                                  </option>
                                ))}
                              </select>
                              {selectedAlternateMaterial[group.normalizedSourceKey] && (
                                <button
                                  type="button"
                                  disabled={isProcessing}
                                  onClick={() =>
                                    onSelectAlternate(
                                      group,
                                      selectedAlternateMaterial[group.normalizedSourceKey]
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

                        {/* Create Missing Material Action */}
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => onCreateMaterial(group)}
                          className="px-3 py-1 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-lg text-[10px] font-black transition-colors flex items-center gap-1.5 shadow-sm shadow-amber-950/50"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>إنشاء مادة جديدة</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-800 bg-stone-950 flex flex-wrap sm:flex-nowrap justify-between items-center gap-3 shrink-0">
          <div className="text-[11px] text-stone-400 font-medium shrink-0">
            {isMaterialLayerComplete ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>اكتملت مراجعة المواد لهذا الملف</span>
              </span>
            ) : (
              <span className="text-amber-400 font-bold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>متبقي {unresolvedCount} مادة غير محسومة</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {isMaterialLayerComplete && onContinueToDriverTruck && (
              <button
                type="button"
                onClick={onContinueToDriverTruck}
                disabled={isProcessing}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-black rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-amber-950/40 transition-colors shrink-0"
              >
                <span>متابعة إلى مراجعة السائقين والشاحنات</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
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
          </div>
        </div>
      </div>
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
