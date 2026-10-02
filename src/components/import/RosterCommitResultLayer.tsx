import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  X,
  AlertCircle,
  Clock,
  Database,
} from 'lucide-react';
import { UnifiedImportBatch, ImportResult } from '../../types/import';

export interface RosterCommitResultLayerProps {
  importBatch: UnifiedImportBatch;
  commitResult: ImportResult;
  onFinish?: () => void;
  onClose?: () => void;
}

export const RosterCommitResultLayer: React.FC<RosterCommitResultLayerProps> = ({
  importBatch,
  commitResult,
  onFinish,
  onClose,
}) => {
  const committedRows = commitResult.committedRows || 0;
  const failedRows = commitResult.failedRows || 0;
  const totalRows = commitResult.totalRows || 0;
  const skippedRows = commitResult.skippedRows || 0;
  const committedEntityIds = commitResult.committedEntityIds || [];
  const issues = commitResult.issues || [];

  // Outcome Classification according to C5 Contract:
  // FULL SUCCESS: failedRows === 0 && committedRows > 0
  // PARTIAL: committedRows > 0 && failedRows > 0
  // FAILURE: committedRows === 0 && failedRows > 0
  // ZERO/INVALID: committedRows === 0 && failedRows === 0
  const isFullSuccess = failedRows === 0 && committedRows > 0;
  const isPartial = committedRows > 0 && failedRows > 0;
  const isFailure = committedRows === 0 && failedRows > 0;

  let outcomeTitleAr = 'لم يتم تنفيذ أي تغييرات';
  let outcomeDescAr = 'لم تتأثر بيانات الأسطول والتشغيل في هذا الاستيراد.';
  let bannerBgClass = 'bg-stone-900 border-stone-800 text-stone-300';

  if (isFullSuccess) {
    outcomeTitleAr = 'تم تنفيذ الاستيراد بنجاح';
    outcomeDescAr = 'تم شحن واعتماد جميع سجلات التشغيل المحددة بجهوزية تامة داخل المشروع.';
    bannerBgClass = 'bg-emerald-950/50 border-emerald-800/60 text-emerald-200';
  } else if (isPartial) {
    outcomeTitleAr = 'تم تنفيذ جزء من الاستيراد مع وجود صفوف فاشلة';
    outcomeDescAr = 'تم اعتماد بعض السجلات بنجاح بينما فشلت بعض السجلات الأخرى أثناء عملية الحقن.';
    bannerBgClass = 'bg-amber-950/50 border-amber-800/60 text-amber-200';
  } else if (isFailure) {
    outcomeTitleAr = 'فشل تنفيذ الاستيراد';
    outcomeDescAr = 'لم يتم حفظ أي سجل في المشروع بسبب خطأ أثناء عملية التنفيذ.';
    bannerBgClass = 'bg-rose-950/50 border-rose-800/60 text-rose-200';
  }

  return (
    <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-stone-800 bg-stone-950 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <span>نتيجة تنفيذ الاستيراد (Commit Result Layer)</span>
                <span className="text-[10px] font-mono bg-stone-800 px-2 py-0.5 rounded-full text-amber-400">
                  المرحلة 7 من 7
                </span>
              </h3>
              <p className="text-[11px] text-stone-400">
                تقرير شامل وموثوق عن نتيجة اعتماد ودفع بيانات سجل التشغيل
              </p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors"
              title="إغلاق النافذة"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-6 overflow-y-auto flex-1 text-xs text-stone-300">
          {/* Main Banner */}
          <div className={`p-4 rounded-xl border flex items-center gap-3.5 ${bannerBgClass}`}>
            {isFullSuccess ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
            ) : isPartial ? (
              <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0" />
            ) : (
              <AlertCircle className="w-6 h-6 text-rose-400 shrink-0" />
            )}
            <div>
              <h4 className="text-base font-black">{outcomeTitleAr}</h4>
              <p className="text-xs opacity-90">{outcomeDescAr}</p>
            </div>
          </div>

          {/* Stats Summary Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-stone-950 p-4 rounded-xl border border-stone-850 text-center font-bold">
            <div>
              <span className="block text-stone-500 text-[10px]">إجمالي السجلات</span>
              <span className="text-base font-mono text-white">{totalRows}</span>
            </div>
            <div>
              <span className="block text-stone-500 text-[10px]">الصفوف الناجحة</span>
              <span className="text-base font-mono text-emerald-400">{committedRows}</span>
            </div>
            <div>
              <span className="block text-stone-500 text-[10px]">الصفوف الفاشلة</span>
              <span className={`text-base font-mono ${failedRows > 0 ? 'text-rose-400' : 'text-stone-500'}`}>
                {failedRows}
              </span>
            </div>
            <div>
              <span className="block text-stone-500 text-[10px]">الصفوف المتخطاة</span>
              <span className="text-base font-mono text-stone-400">{skippedRows}</span>
            </div>
            <div>
              <span className="block text-stone-500 text-[10px]">السجلات المنشأة/المحدثة</span>
              <span className="text-base font-mono text-cyan-400">{committedEntityIds.length}</span>
            </div>
          </div>

          {/* Audit Timestamp & Batch Reference */}
          <div className="bg-stone-950/60 p-3 rounded-xl border border-stone-850 flex flex-wrap justify-between items-center text-[11px] font-mono text-stone-400">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-stone-500" />
              <span>تاريخ ووقت التنفيذ: {commitResult.executedAt ? new Date(commitResult.executedAt).toLocaleString('ar-SA') : '—'}</span>
            </div>
            <div>
              <span>معرف الدفعة: {importBatch.importBatchId}</span>
            </div>
          </div>

          {/* Issues / Error Log */}
          {issues.length > 0 && (
            <div className="space-y-2">
              <h5 className="text-xs font-bold text-stone-300 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>ملاحظات وأخطاء التنفيذ ({issues.length})</span>
              </h5>
              <div className="max-h-[180px] overflow-y-auto border border-stone-800 rounded-xl bg-stone-950 p-3 space-y-2 text-[11px] font-mono">
                {issues.map((iss, idx) => (
                  <div
                    key={iss.issueId || idx}
                    className={`p-2 rounded-lg border ${
                      iss.severity === 'BLOCKING' || iss.blocking
                        ? 'bg-rose-950/30 border-rose-900/50 text-rose-300'
                        : 'bg-amber-950/30 border-amber-900/50 text-amber-300'
                    }`}
                  >
                    <span className="font-bold">الصف #{iss.row || 'عام'}: </span>
                    <span>{iss.messageAr || iss.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-stone-800 bg-stone-950 flex justify-between items-center shrink-0">
          <div className="text-[11px] font-bold text-stone-400">
            <span>عملية استيراد مكتملة</span>
          </div>

          <div className="flex items-center gap-2">
            {onClose && !isFullSuccess && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold rounded-xl text-xs transition-colors"
              >
                إغلاق ومعاينة النتيجة
              </button>
            )}

            {isFullSuccess && onFinish && (
              <button
                type="button"
                onClick={onFinish}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-950/50 transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>إنهاء الاستيراد</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
