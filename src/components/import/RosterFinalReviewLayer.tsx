import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  X,
  ShieldCheck,
  AlertCircle,
  FileText,
  Users,
  Truck,
  Box,
  Building2,
  Lock,
  RefreshCw,
} from 'lucide-react';
import { UnifiedImportBatch } from '../../types/import';
import { RosterBatchReviewService } from '../../services/import/rosterBatchReview.service';

export interface RosterFinalReviewLayerProps {
  importBatch: UnifiedImportBatch;
  onCommit: () => Promise<void>;
  isCommitting?: boolean;
  commitError?: string | null;
  onClose?: () => void;
}

export const classifyFinalReviewBlocker = (batch: UnifiedImportBatch): 'CARRIER' | 'MATERIAL' | 'DRIVER_TRUCK' => {
  const batchGroups = RosterBatchReviewService.getBatchReviewGroups(batch);
  const issues = batch.issues || [];
  const rows = batch.rows || [];
  const activeRows = rows.filter((r) => r.status !== 'REJECTED');

  // Check Carrier
  const unresolvedCarriers = (batchGroups.carrier || []).some(
    (g) => g.status === 'REVIEW_REQUIRED' || g.status === 'UNRESOLVED' || g.status === 'CONFLICT'
  );
  const carrierIssues = issues.some(
    (iss) => (iss.severity === 'BLOCKING' || iss.blocking) &&
      iss.code !== 'DRIVER_CARRIER_CONFLICT' &&
      (iss.field === 'carrierId' || iss.code === 'UNRESOLVED_CARRIER' || String(iss.code).startsWith('CARRIER_'))
  );
  const carrierRowBlock = activeRows.some(
    (r) => !r.entityResolutions?.carrier?.matchedId ||
      r.entityResolutions?.carrier?.status === 'UNRESOLVED' ||
      r.entityResolutions?.carrier?.status === 'CONFLICT' ||
      r.entityResolutions?.carrier?.status === 'REVIEW_REQUIRED'
  );

  if (unresolvedCarriers || carrierIssues || carrierRowBlock) {
    return 'CARRIER';
  }

  // Check Material
  const unresolvedMaterials = (batchGroups.material || []).some(
    (g) => g.status === 'REVIEW_REQUIRED' || g.status === 'UNRESOLVED' || g.status === 'CONFLICT'
  );
  const materialIssues = issues.some(
    (iss) => (iss.severity === 'BLOCKING' || iss.blocking) &&
      (iss.field === 'materialId' || String(iss.code).includes('MATERIAL'))
  );
  const materialRowBlock = activeRows.some(
    (r) => !r.entityResolutions?.material?.matchedId ||
      r.entityResolutions?.material?.status === 'UNRESOLVED' ||
      r.entityResolutions?.material?.status === 'CONFLICT' ||
      r.entityResolutions?.material?.status === 'REVIEW_REQUIRED'
  );

  if (unresolvedMaterials || materialIssues || materialRowBlock) {
    return 'MATERIAL';
  }

  return 'DRIVER_TRUCK';
};

export const RosterFinalReviewLayer: React.FC<RosterFinalReviewLayerProps> = ({
  importBatch,
  onCommit,
  isCommitting = false,
  commitError = null,
  onClose,
}) => {
  const rows = importBatch.rows || [];
  const activeRows = rows.filter((r) => r.status !== 'REJECTED');
  const totalRows = rows.length;

  const batchGroups = RosterBatchReviewService.getBatchReviewGroups(importBatch);
  const issues = importBatch.issues || [];

  const blockerType = classifyFinalReviewBlocker(importBatch);

  // Group stats
  const carrierGroups = batchGroups.carrier || [];
  const materialGroups = batchGroups.material || [];
  const driverGroups = batchGroups.driver || [];
  const truckGroups = batchGroups.truck || [];

  const unresolvedCarrierCount = carrierGroups.filter(
    (g) => g.status === 'REVIEW_REQUIRED' || g.status === 'UNRESOLVED' || g.status === 'CONFLICT'
  ).length;
  const unresolvedMaterialCount = materialGroups.filter(
    (g) => g.status === 'REVIEW_REQUIRED' || g.status === 'UNRESOLVED' || g.status === 'CONFLICT'
  ).length;
  const unresolvedDriverCount = driverGroups.filter(
    (g) => g.status === 'REVIEW_REQUIRED' || g.status === 'UNRESOLVED' || g.status === 'CONFLICT'
  ).length;
  const unresolvedTruckCount = truckGroups.filter(
    (g) => g.status === 'REVIEW_REQUIRED' || g.status === 'UNRESOLVED' || g.status === 'CONFLICT'
  ).length;

  const unresolvedGroupCount =
    unresolvedCarrierCount + unresolvedMaterialCount + unresolvedDriverCount + unresolvedTruckCount;

  // Inspect rows directly for readiness
  const blockedRows = activeRows.filter((r) => {
    const isErrorStatus = r.status === 'ERROR' || r.reviewStatus === 'requires_review' || r.reviewStatus === 'error';
    const missingCarrier = !r.entityResolutions?.carrier?.matchedId;
    const missingMaterial = !r.entityResolutions?.material?.matchedId;
    const missingDriver = Boolean(r.raw?.driverName || r.canonical?.driverName) && !r.entityResolutions?.driver?.matchedId;
    const missingTruck = Boolean(r.raw?.truckPlate || r.canonical?.truckPlate) && !r.entityResolutions?.truck?.matchedId;

    return isErrorStatus || missingCarrier || missingMaterial || missingDriver || missingTruck;
  });

  const blockingIssues = issues.filter((iss) => iss.severity === 'BLOCKING' || iss.blocking);
  const warningRows = activeRows.filter((r) => r.status === 'WARNING');
  const rejectedRows = rows.filter((r) => r.status === 'REJECTED');
  const alreadyCommittedRows = rows.filter((r) => r.status === 'COMMITTED');

  const readyRowsCount = activeRows.length - blockedRows.length;
  const isReadyToCommit =
    activeRows.length > 0 &&
    blockedRows.length === 0 &&
    unresolvedGroupCount === 0 &&
    blockingIssues.length === 0;

  return (
    <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-5xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-stone-800 bg-stone-950 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <span>المراجعة النهائية والاعتماد (Final Review & Commit Layer)</span>
                <span className="text-[10px] font-mono bg-stone-800 px-2 py-0.5 rounded-full text-amber-400">
                  المرحلة 6 من 7
                </span>
              </h3>
              <p className="text-[11px] text-stone-400">
                فحص ومراجعة السجلات المعتمدة قبل الحقن والتنفيذ النهائي في المشروع
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-6 overflow-y-auto flex-1 text-xs text-stone-300">
          {/* Readiness Banner */}
          {isReadyToCommit ? (
            <div className="bg-emerald-950/40 border border-emerald-800/60 p-4 rounded-xl flex items-center justify-between gap-3 text-emerald-200">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <span className="font-bold block text-sm text-emerald-300">
                    الدفعة جاهزة تماماً للاعتماد والتنفيذ ({readyRowsCount} من أصل {totalRows} سجل)
                  </span>
                  <span className="text-xs text-emerald-300/80">
                    تم حسم الناقلين، المواد، السائقين، والشاحنات بنجاح. يمكن الآن تنفيذ الاستيراد.
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-rose-950/40 border border-rose-800/60 p-4 rounded-xl flex items-center justify-between gap-3 text-rose-200">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                <div>
                  <span className="font-bold block text-sm text-rose-300">
                    الدفعة غير جاهزة للاعتماد (توجد {blockedRows.length} صفوف محجوبة / {unresolvedGroupCount} عناصر غير محسومة)
                  </span>
                  <span className="text-xs text-rose-300/80">
                    {blockerType === 'CARRIER'
                      ? 'تغيّر أو تعذر اعتماد بيانات الناقل بعد المراجعة النهائية. لأن بيانات السائقين والشاحنات مرتبطة بالناقل، يجب إعادة تحليل جلسة الاستيراد.'
                      : 'يجب معالجة الكيانات المعلقة والصفوف غير المطابقة قبل البدء بإنشاء السجلات في المشروع.'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {commitError && (
            <div className="bg-rose-950/60 border border-rose-800 p-3.5 rounded-xl text-rose-200 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{commitError}</span>
            </div>
          )}

          {/* Overall Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 bg-stone-950 p-3.5 rounded-xl border border-stone-850 text-center font-bold">
            <div>
              <span className="block text-stone-500 text-[10px]">إجمالي السجلات</span>
              <span className="text-sm font-mono text-white">{totalRows}</span>
            </div>
            <div>
              <span className="block text-stone-500 text-[10px]">جاهزة للاعتماد</span>
              <span className="text-sm font-mono text-emerald-400">{readyRowsCount}</span>
            </div>
            <div>
              <span className="block text-stone-500 text-[10px]">صفوف بها تنبيهات</span>
              <span className="text-sm font-mono text-amber-400">{warningRows.length}</span>
            </div>
            <div>
              <span className="block text-stone-500 text-[10px]">صفوف محجوبة/أخطاء</span>
              <span className="text-sm font-mono text-rose-400">{blockedRows.length}</span>
            </div>
            <div>
              <span className="block text-stone-500 text-[10px]">صفوف مستبعدة</span>
              <span className="text-sm font-mono text-stone-400">{rejectedRows.length}</span>
            </div>
            <div>
              <span className="block text-stone-500 text-[10px]">معتمدة سابقاً</span>
              <span className="text-sm font-mono text-cyan-400">{alreadyCommittedRows.length}</span>
            </div>
            <div>
              <span className="block text-stone-500 text-[10px]">عناصر معلقة</span>
              <span className={`text-sm font-mono ${unresolvedGroupCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {unresolvedGroupCount}
              </span>
            </div>
          </div>

          {/* Resolutions Summary Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Carrier Summary */}
            <div className="bg-stone-950/80 p-3.5 rounded-xl border border-stone-850 space-y-1">
              <div className="flex justify-between items-center text-stone-400 font-bold text-[11px]">
                <span className="flex items-center gap-1.5 text-white">
                  <Building2 className="w-3.5 h-3.5 text-amber-500" />
                  <span>الناقلون (Carriers)</span>
                </span>
                <span className="font-mono text-[10px]">{carrierGroups.length} مجموعات</span>
              </div>
              <p className="text-[11px] font-mono text-stone-300">
                حسم المجموعات: {carrierGroups.length - unresolvedCarrierCount} / {carrierGroups.length}
              </p>
              {unresolvedCarrierCount > 0 ? (
                <p className="text-[10px] text-rose-400 font-bold">يوجد {unresolvedCarrierCount} ناقل غير محسوم</p>
              ) : (
                <p className="text-[10px] text-emerald-400 font-semibold">مكتمل ومستقر</p>
              )}
            </div>

            {/* Material Summary */}
            <div className="bg-stone-950/80 p-3.5 rounded-xl border border-stone-850 space-y-1">
              <div className="flex justify-between items-center text-stone-400 font-bold text-[11px]">
                <span className="flex items-center gap-1.5 text-white">
                  <Box className="w-3.5 h-3.5 text-amber-500" />
                  <span>المواد (Materials)</span>
                </span>
                <span className="font-mono text-[10px]">{materialGroups.length} مجموعات</span>
              </div>
              <p className="text-[11px] font-mono text-stone-300">
                حسم المجموعات: {materialGroups.length - unresolvedMaterialCount} / {materialGroups.length}
              </p>
              {unresolvedMaterialCount > 0 ? (
                <p className="text-[10px] text-rose-400 font-bold">يوجد {unresolvedMaterialCount} مادة غير محسومة</p>
              ) : (
                <p className="text-[10px] text-emerald-400 font-semibold">مكتمل ومستقر</p>
              )}
            </div>

            {/* Driver Summary */}
            <div className="bg-stone-950/80 p-3.5 rounded-xl border border-stone-850 space-y-1">
              <div className="flex justify-between items-center text-stone-400 font-bold text-[11px]">
                <span className="flex items-center gap-1.5 text-white">
                  <Users className="w-3.5 h-3.5 text-amber-500" />
                  <span>السائقون (Drivers)</span>
                </span>
                <span className="font-mono text-[10px]">{driverGroups.length} مجموعات</span>
              </div>
              <p className="text-[11px] font-mono text-stone-300">
                حسم المجموعات: {driverGroups.length - unresolvedDriverCount} / {driverGroups.length}
              </p>
              {unresolvedDriverCount > 0 ? (
                <p className="text-[10px] text-rose-400 font-bold">يوجد {unresolvedDriverCount} سائق غير محسوم</p>
              ) : (
                <p className="text-[10px] text-emerald-400 font-semibold">مكتمل ومستقر</p>
              )}
            </div>

            {/* Truck Summary */}
            <div className="bg-stone-950/80 p-3.5 rounded-xl border border-stone-850 space-y-1">
              <div className="flex justify-between items-center text-stone-400 font-bold text-[11px]">
                <span className="flex items-center gap-1.5 text-white">
                  <Truck className="w-3.5 h-3.5 text-amber-500" />
                  <span>الشاحنات (Trucks)</span>
                </span>
                <span className="font-mono text-[10px]">{truckGroups.length} مجموعات</span>
              </div>
              <p className="text-[11px] font-mono text-stone-300">
                حسم المجموعات: {truckGroups.length - unresolvedTruckCount} / {truckGroups.length}
              </p>
              {unresolvedTruckCount > 0 ? (
                <p className="text-[10px] text-rose-400 font-bold">يوجد {unresolvedTruckCount} شاحنة غير محسومة</p>
              ) : (
                <p className="text-[10px] text-emerald-400 font-semibold">مكتمل ومستقر</p>
              )}
            </div>
          </div>

          {/* Row Preview Table */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-stone-400 font-bold border-b border-stone-800 pb-2">
              <span className="text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-500" />
                <span>معاينة القيم القياسية المحسومة للسجلات ({rows.length} سجل)</span>
              </span>
            </div>

            <div className="overflow-x-auto max-h-[260px] overflow-y-auto border border-stone-850 rounded-xl bg-stone-950">
              <table className="w-full text-right text-xs">
                <thead className="sticky top-0 bg-stone-900 border-b border-stone-800 text-stone-400 font-bold text-[11px]">
                  <tr>
                    <th className="p-2.5">الصف</th>
                    <th className="p-2.5">الناقل المعتمد</th>
                    <th className="p-2.5">المادة المعتمدة</th>
                    <th className="p-2.5">اسم السائق</th>
                    <th className="p-2.5">رقم اللوحة</th>
                    <th className="p-2.5 text-center">حالة الجاهزية</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-850">
                  {rows.map((row) => {
                    const carrierName =
                      row.entityResolutions?.carrier?.matchedName ||
                      row.canonical?.carrierName ||
                      row.raw?.carrierName ||
                      '—';
                    const materialName =
                      row.entityResolutions?.material?.matchedName ||
                      row.canonical?.materialName ||
                      row.raw?.materialName ||
                      '—';
                    const driverName =
                      row.entityResolutions?.driver?.matchedName ||
                      row.canonical?.driverName ||
                      row.raw?.driverName ||
                      '—';
                    const plateNumber =
                      row.entityResolutions?.truck?.matchedName ||
                      row.canonical?.truckPlate ||
                      row.raw?.truckPlate ||
                      '—';

                    const isRejected = row.status === 'REJECTED';
                    const isCommitted = row.status === 'COMMITTED';
                    const isWarning = row.status === 'WARNING';
                    const isBlocked =
                      row.status === 'ERROR' ||
                      row.reviewStatus === 'requires_review' ||
                      row.reviewStatus === 'error' ||
                      !row.entityResolutions?.carrier?.matchedId ||
                      !row.entityResolutions?.material?.matchedId;

                    return (
                      <tr key={row.rowNumber} className="hover:bg-stone-900/50 font-medium">
                        <td className="p-2.5 font-mono text-stone-400">#{row.rowNumber}</td>
                        <td className="p-2.5 text-stone-200">{carrierName}</td>
                        <td className="p-2.5 text-stone-200">{materialName}</td>
                        <td className="p-2.5 text-stone-200">{driverName}</td>
                        <td className="p-2.5 font-mono text-stone-200">{plateNumber}</td>
                        <td className="p-2.5 text-center">
                          {isRejected ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-stone-800 text-stone-500 font-bold">
                              مستبعد
                            </span>
                          ) : isCommitted ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-cyan-950 text-cyan-400 border border-cyan-800/40 font-bold">
                              معتمد سابقاً
                            </span>
                          ) : isBlocked ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-950 text-rose-300 border border-rose-800/40 font-bold">
                              محجوب / غير مكتمل
                            </span>
                          ) : isWarning ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-950 text-amber-300 border border-amber-800/40 font-bold">
                              جاهز مع تنبيه
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800/40 font-bold">
                              جاهز للاعتماد
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-stone-800 bg-stone-950 flex justify-between items-center shrink-0">
          <div className="text-[11px] font-bold">
            {isReadyToCommit ? (
              <span className="text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>جاهز للاعتماد عبر البوابة الموحدة للبيانات</span>
              </span>
            ) : (
              <span className="text-rose-400 flex items-center gap-1.5">
                <Lock className="w-4 h-4" />
                <span>الاعتماد مغلق حتى حسم السجلات المحجوبة</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                disabled={isCommitting}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold rounded-xl text-xs transition-colors"
              >
                {blockerType === 'CARRIER' ? 'إعادة بدء الاستيراد' : 'العودة لمعالجة البيانات'}
              </button>
            )}

            <button
              type="button"
              onClick={onCommit}
              disabled={!isReadyToCommit || isCommitting}
              className="px-6 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white font-black rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-amber-950/50 transition-colors"
            >
              {isCommitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>جاري الاعتماد والتنفيذ...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>اعتماد وتنفيذ الاستيراد</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
