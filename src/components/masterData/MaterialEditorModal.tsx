import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Layers, X, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import {
  materialManagementClientService,
  MaterialCreateInput,
  MaterialCreationResult,
  MaterialUpdateInput,
  MaterialUpdateResult,
} from '../../services/materialManagementClient.service';

export interface MaterialEditorModalProps {
  open: boolean;
  projectId: string;
  mode?: 'CREATE' | 'EDIT';
  initialName?: string;
  initialMaterial?: {
    materialId: string;
    name: string;
    code: string;
    unitOfMeasure?: string;
    standardDensityTonPerM3?: number | null;
  } | null;
  onClose: () => void;
  onCreated?: (result: MaterialCreationResult) => void | Promise<void>;
  onUpdated?: (result: MaterialUpdateResult) => void | Promise<void>;
  clientService?: {
    createProjectMaterial: (
      projectId: string,
      input: MaterialCreateInput,
      overrideToken?: string
    ) => Promise<MaterialCreationResult>;
    updateProjectMaterial?: (
      projectId: string,
      materialId: string,
      input: MaterialUpdateInput,
      overrideToken?: string
    ) => Promise<MaterialUpdateResult>;
  };
  zIndexClass?: string;
}

export const MaterialEditorModal: React.FC<MaterialEditorModalProps> = ({
  open,
  projectId,
  mode = 'CREATE',
  initialName = '',
  initialMaterial = null,
  onClose,
  onCreated,
  onUpdated,
  clientService = materialManagementClientService,
  zIndexClass = 'z-50',
}) => {
  const isEditMode = mode === 'EDIT';

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [unitOfMeasure, setUnitOfMeasure] = useState<'TON' | 'M3' | 'TRIP'>('TON');
  const [standardDensityTonPerM3, setStandardDensityTonPerM3] = useState<number>(1.6);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Stored results for mutation-succeeded / refresh-failed recovery barrier
  const [createdMaterialResult, setCreatedMaterialResult] = useState<MaterialCreationResult | null>(null);
  const [updatedMaterialResult, setUpdatedMaterialResult] = useState<MaterialUpdateResult | null>(null);
  const [refreshFailed, setRefreshFailed] = useState(false);

  // Reset or pre-populate form when modal opens
  useEffect(() => {
    if (open) {
      if (isEditMode && initialMaterial) {
        setName(initialMaterial.name || '');
        setCode(initialMaterial.code || '');
        setUnitOfMeasure(
          (initialMaterial.unitOfMeasure === 'M3' || initialMaterial.unitOfMeasure === 'TRIP'
            ? initialMaterial.unitOfMeasure
            : 'TON') as 'TON' | 'M3' | 'TRIP'
        );
        setStandardDensityTonPerM3(
          initialMaterial.standardDensityTonPerM3 !== undefined && initialMaterial.standardDensityTonPerM3 !== null
            ? Number(initialMaterial.standardDensityTonPerM3)
            : 1.6
        );
      } else {
        setName(initialName || initialMaterial?.name || '');
        setCode('');
        setUnitOfMeasure('TON');
        setStandardDensityTonPerM3(1.6);
      }

      setFieldErrors({});
      setSubmitError(null);
      setIsSubmitting(false);
      setCreatedMaterialResult(null);
      setUpdatedMaterialResult(null);
      setRefreshFailed(false);
    }
  }, [open, isEditMode, initialMaterial, initialName]);

  if (!open) return null;

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    const trimmedName = name.trim();
    if (!trimmedName) {
      errors.name = 'اسم المادة مطلوب';
    } else if (trimmedName.length < 2) {
      errors.name = 'اسم المادة يجب أن يتكون من حرفين على الأقل';
    }

    if (!isEditMode) {
      const trimmedCode = code.trim();
      if (!trimmedCode) {
        errors.code = 'رمز المادة (Code) مطلوب';
      } else if (trimmedCode.length < 2) {
        errors.code = 'رمز المادة يجب أن يتكون من حرفين على الأقل';
      }
    }

    if (!['TON', 'M3', 'TRIP'].includes(unitOfMeasure)) {
      errors.unitOfMeasure = 'وحدة القياس غير صالحة';
    }

    if (standardDensityTonPerM3 !== undefined && standardDensityTonPerM3 !== null) {
      const num = Number(standardDensityTonPerM3);
      if (isNaN(num) || !isFinite(num) || num <= 0) {
        errors.standardDensityTonPerM3 = 'الكثافة يجب أن تكون رقماً موجباً صحيحاً';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    // If mutation already succeeded previously and we are in refresh-failed state, retry refresh directly
    if (refreshFailed) {
      await handleRetryRefresh();
      return;
    }

    if (!validate()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    if (!isEditMode) {
      // CREATE MODE
      let result = createdMaterialResult;

      if (!result) {
        try {
          const payload: MaterialCreateInput = {
            name: name.trim(),
            code: code.trim().toUpperCase(),
            unitOfMeasure,
            standardDensityTonPerM3: Number(standardDensityTonPerM3) || 1.6,
          };

          const creator =
            clientService.createProjectMaterial ||
            materialManagementClientService.createProjectMaterial.bind(materialManagementClientService);

          result = await creator(projectId, payload);
          setCreatedMaterialResult(result);
        } catch (err: any) {
          setSubmitError(err.message || 'حدث خطأ أثناء إنشاء المادة');
          setIsSubmitting(false);
          return;
        }
      }

      // Authoritative post-mutation canonical refresh barrier
      try {
        if (onCreated) {
          await onCreated(result);
        }
        onClose();
      } catch (refreshErr: any) {
        setRefreshFailed(true);
        setSubmitError(
          'تم حفظ المادة بنجاح، لكن تعذر تحديث بيانات المشروع فوراً. أعد محاولة تحديث البيانات قبل متابعة العمل.'
        );
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // EDIT MODE
      let result = updatedMaterialResult;

      if (!result) {
        try {
          const payload: MaterialUpdateInput = {
            name: name.trim(),
            unitOfMeasure,
            standardDensityTonPerM3: Number(standardDensityTonPerM3) || 1.6,
          };

          const targetMaterialId = initialMaterial?.materialId || '';
          const updater =
            clientService.updateProjectMaterial ||
            materialManagementClientService.updateProjectMaterial.bind(materialManagementClientService);

          result = await updater(projectId, targetMaterialId, payload);
          setUpdatedMaterialResult(result);
        } catch (err: any) {
          setSubmitError(err.message || 'حدث خطأ أثناء تعديل بيانات المادة');
          setIsSubmitting(false);
          return;
        }
      }

      // Authoritative post-mutation canonical refresh barrier
      try {
        if (onUpdated) {
          await onUpdated(result);
        }
        onClose();
      } catch (refreshErr: any) {
        setRefreshFailed(true);
        setSubmitError(
          'تم حفظ تعديلات المادة بنجاح، لكن تعذر تحديث بيانات المشروع فوراً. أعد محاولة تحديث البيانات قبل متابعة العمل.'
        );
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleRetryRefresh = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      if (isEditMode) {
        if (updatedMaterialResult && onUpdated) {
          await onUpdated(updatedMaterialResult);
          onClose();
        }
      } else {
        if (createdMaterialResult && onCreated) {
          await onCreated(createdMaterialResult);
          onClose();
        }
      }
    } catch (refreshErr: any) {
      setRefreshFailed(true);
      setSubmitError(
        isEditMode
          ? 'تم حفظ تعديلات المادة بنجاح، لكن تعذر تحديث بيانات المشروع فوراً. أعد محاولة تحديث البيانات قبل متابعة العمل.'
          : 'تم حفظ المادة بنجاح، لكن تعذر تحديث بيانات المشروع فوراً. أعد محاولة تحديث البيانات قبل متابعة العمل.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalContent = (
    <div
      className={`fixed inset-0 ${zIndexClass} flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="material-modal-title"
    >
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col text-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 id="material-modal-title" className="text-lg font-bold text-white">
                {isEditMode ? 'تعديل بيانات المادة المصرح بها' : 'إضافة مادة جديدة للمشروع'}
              </h2>
              <p className="text-xs text-slate-400">
                {isEditMode
                  ? 'تحديث مواصفات المادة في السجل الموحد للمشروع'
                  : 'تسجيل مادة معتمدة وحفظها في السجل الموحد للمشروع'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
            aria-label="إغلاق النافذة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {submitError && (
            <div
              className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                refreshFailed
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}
            >
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1 flex-1">
                <p className="font-semibold">{refreshFailed ? 'تنبيه تحديث البيانات' : 'خطأ في العملية'}</p>
                <p>{submitError}</p>
              </div>
            </div>
          )}

          {/* Material Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              اسم المادة <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (fieldErrors.name) {
                  setFieldErrors((prev) => {
                    const next = { ...prev };
                    delete next.name;
                    return next;
                  });
                }
              }}
              disabled={isSubmitting || (isEditMode ? updatedMaterialResult !== null && refreshFailed : createdMaterialResult !== null && refreshFailed)}
              placeholder="مثال: بحص 10 مم، رمل أحمر، دفان"
              className={`w-full px-3.5 py-2.5 bg-slate-950/60 border rounded-xl text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 transition-colors ${
                fieldErrors.name
                  ? 'border-rose-500 focus:ring-rose-500/30'
                  : 'border-slate-700 focus:ring-amber-500/40 focus:border-amber-500'
              } disabled:opacity-50`}
            />
            {fieldErrors.name && (
              <p className="mt-1 text-xs text-rose-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {fieldErrors.name}
              </p>
            )}
          </div>

          {/* Material Code */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              رمز المادة (Code) <span className="text-rose-400">*</span>
              {isEditMode && (
                <span className="text-[11px] text-stone-500 font-normal mr-2">
                  (رمز الهوية ثابت وغير قابل للتعديل)
                </span>
              )}
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                if (fieldErrors.code) {
                  setFieldErrors((prev) => {
                    const next = { ...prev };
                    delete next.code;
                    return next;
                  });
                }
              }}
              disabled={isEditMode || isSubmitting || (createdMaterialResult !== null && refreshFailed)}
              placeholder="مثال: AGG-10MM, SAND-RED, GABC"
              className={`w-full px-3.5 py-2.5 bg-slate-950/60 border rounded-xl text-sm text-white font-mono placeholder-slate-500 focus:outline-hidden focus:ring-2 transition-colors uppercase ${
                isEditMode
                  ? 'bg-slate-900/80 text-stone-400 border-slate-800 cursor-not-allowed'
                  : fieldErrors.code
                  ? 'border-rose-500 focus:ring-rose-500/30'
                  : 'border-slate-700 focus:ring-amber-500/40 focus:border-amber-500'
              } disabled:opacity-50`}
            />
            {fieldErrors.code && (
              <p className="mt-1 text-xs text-rose-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {fieldErrors.code}
              </p>
            )}
          </div>

          {/* Unit of Measure & Standard Density */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                وحدة القياس <span className="text-rose-400">*</span>
              </label>
              <select
                value={unitOfMeasure}
                onChange={(e) => setUnitOfMeasure(e.target.value as 'TON' | 'M3' | 'TRIP')}
                disabled={isSubmitting || (isEditMode ? updatedMaterialResult !== null && refreshFailed : createdMaterialResult !== null && refreshFailed)}
                className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-700 rounded-xl text-sm text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 disabled:opacity-50 transition-colors"
              >
                <option value="TON">طن (TON) - بالوزن</option>
                <option value="M3">متر مكعب (M3) - بالحجم</option>
                <option value="TRIP">رد / نقلة (TRIP) - بالحمولة</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                الكثافة الافتراضية (طن/م³)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.1"
                max="10"
                value={standardDensityTonPerM3}
                onChange={(e) => setStandardDensityTonPerM3(parseFloat(e.target.value) || 1.6)}
                disabled={isSubmitting || (isEditMode ? updatedMaterialResult !== null && refreshFailed : createdMaterialResult !== null && refreshFailed)}
                placeholder="1.6"
                className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-700 rounded-xl text-sm text-white font-mono placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 disabled:opacity-50 transition-colors"
              />
            </div>
          </div>

          {/* Modal Footer / Actions */}
          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors disabled:opacity-50"
            >
              إلغاء
            </button>

            {refreshFailed && (isEditMode ? updatedMaterialResult : createdMaterialResult) ? (
              <button
                type="button"
                onClick={handleRetryRefresh}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors flex items-center gap-1.5 disabled:opacity-50 shadow-md shadow-amber-500/10"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    جاري التحديث...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    إعادة تحديث البيانات
                  </>
                )}
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors flex items-center gap-1.5 disabled:opacity-50 shadow-md shadow-amber-500/10"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <Layers className="w-3.5 h-3.5" />
                    {isEditMode ? 'حفظ التعديلات' : 'حفظ المادة'}
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};
