import React, { useState, useEffect } from 'react';
import { Truck, X, AlertCircle, Loader2 } from 'lucide-react';
import {
  carrierManagementClientService,
  CarrierCreateInput,
  CarrierCreationResult,
} from '../../services/carrierManagementClient.service';

export interface CarrierEditorModalProps {
  open: boolean;
  projectId: string;
  initialName?: string;
  onClose: () => void;
  onCreated: (result: CarrierCreationResult) => void | Promise<void>;
  clientService?: {
    createProjectCarrier: (
      projectId: string,
      input: CarrierCreateInput,
      overrideToken?: string
    ) => Promise<CarrierCreationResult>;
  };
}

export const CarrierEditorModal: React.FC<CarrierEditorModalProps> = ({
  open,
  projectId,
  initialName = '',
  onClose,
  onCreated,
  clientService = carrierManagementClientService,
}) => {
  const [name, setName] = useState('');
  const [commercialRegistrationNo, setCommercialRegistrationNo] = useState('');
  const [transportLicenseNo, setTransportLicenseNo] = useState('');
  const [contactPersonName, setContactPersonName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // A1.1: State for mutation-succeeded / refresh-failed distinction & non-duplicating retry
  const [createdCarrierResult, setCreatedCarrierResult] = useState<CarrierCreationResult | null>(null);
  const [refreshFailed, setRefreshFailed] = useState(false);

  // Synchronize form when opened or initialName changes
  useEffect(() => {
    if (open) {
      setName(initialName || '');
      setCommercialRegistrationNo('');
      setTransportLicenseNo('');
      setContactPersonName('');
      setContactPhone('');
      setContactEmail('');
      setFieldErrors({});
      setSubmitError(null);
      setIsSubmitting(false);
      setCreatedCarrierResult(null);
      setRefreshFailed(false);
    }
  }, [open, initialName]);

  if (!open) return null;

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    const trimmedName = name.trim();
    if (!trimmedName) {
      errors.name = 'اسم الناقل / الشركة مطلوب';
    } else if (trimmedName.length < 3) {
      errors.name = 'اسم الناقل يجب أن يتكون من 3 أحرف على الأقل';
    }

    const trimmedCr = commercialRegistrationNo.trim();
    const crDigits = trimmedCr.replace(/[^0-9]/g, '');
    if (!trimmedCr) {
      errors.commercialRegistrationNo = 'رقم السجل التجاري (CR) مطلوب';
    } else if (crDigits.length !== 10 || crDigits !== trimmedCr) {
      errors.commercialRegistrationNo = 'رقم السجل التجاري يجب أن يتكون من 10 أرقام بالضبط';
    }

    if (contactPhone.trim()) {
      const cleanPhone = contactPhone.trim().replace(/[\s-]/g, '');
      if (!/^\+?[0-9]{9,15}$/.test(cleanPhone)) {
        errors.contactPhone = 'رقم الهاتف غير صحيح (يجب أن يتكون من 9 إلى 15 رقماً)';
      }
    }

    if (contactEmail.trim()) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail.trim())) {
        errors.contactEmail = 'صيغة البريد الإلكتروني غير صحيحة';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (refreshFailed && createdCarrierResult) {
      await handleRetryRefresh();
      return;
    }

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    let result = createdCarrierResult;

    if (!result) {
      try {
        const payload: CarrierCreateInput = {
          name: name.trim(),
          commercialRegistrationNo: commercialRegistrationNo.trim(),
        };

        if (transportLicenseNo.trim()) {
          payload.transportLicenseNo = transportLicenseNo.trim();
        }
        if (contactPersonName.trim()) {
          payload.contactPersonName = contactPersonName.trim();
        }
        if (contactPhone.trim()) {
          payload.contactPhone = contactPhone.trim();
        }
        if (contactEmail.trim()) {
          payload.contactEmail = contactEmail.trim();
        }

        result = await clientService.createProjectCarrier(projectId, payload);
        setCreatedCarrierResult(result);
      } catch (err: any) {
        setSubmitError(err.message || 'حدث خطأ أثناء حفظ الناقل');
        setIsSubmitting(false);
        return;
      }
    }

    // Authoritative post-mutation canonical refresh barrier
    try {
      await onCreated(result);
      onClose();
    } catch (refreshErr: any) {
      setRefreshFailed(true);
      setSubmitError(
        'تم حفظ الناقل بنجاح، لكن تعذر تحديث بيانات المشروع فوراً. أعد محاولة تحديث البيانات قبل متابعة العمل.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetryRefresh = async () => {
    if (!createdCarrierResult) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await onCreated(createdCarrierResult);
      onClose();
    } catch (refreshErr: any) {
      setRefreshFailed(true);
      setSubmitError(
        'تم حفظ الناقل بنجاح، لكن تعذر تحديث بيانات المشروع فوراً. أعد محاولة تحديث البيانات قبل متابعة العمل.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-stone-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      dir="rtl"
    >
      <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-stone-800 bg-stone-950 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-500">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">إضافة ناقل للمشروع</h3>
              <p className="text-[11px] text-stone-400">تسجيل واعتماد شريك نقل رسمي للمشروع</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 text-stone-400 hover:text-white hover:bg-stone-800 rounded-lg transition-colors"
            aria-label="إغلاق النافذة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          {submitError && (
            <div className="p-3 bg-rose-950/60 border border-rose-800/80 rounded-xl text-rose-200 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{submitError}</div>
            </div>
          )}

          {/* Required Fields Section */}
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-stone-300 font-bold block">
                اسم الناقل / الشركة <span className="text-amber-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: شركة اليمامة للمقاولات والنقل"
                disabled={isSubmitting || refreshFailed}
                className={`w-full bg-stone-950 border ${
                  fieldErrors.name ? 'border-rose-500 focus:border-rose-500' : 'border-stone-800 focus:border-amber-500'
                } text-white px-3 py-2 rounded-xl focus:outline-hidden transition-colors text-xs disabled:opacity-60`}
              />
              {fieldErrors.name && (
                <p className="text-[11px] text-rose-400 font-semibold">{fieldErrors.name}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-stone-300 font-bold block">
                السجل التجاري (CR) <span className="text-amber-500">*</span>
              </label>
              <input
                type="text"
                maxLength={10}
                value={commercialRegistrationNo}
                onChange={(e) => setCommercialRegistrationNo(e.target.value)}
                placeholder="10 أرقام (مثال: 1010123456)"
                disabled={isSubmitting || refreshFailed}
                className={`w-full bg-stone-950 border font-mono ${
                  fieldErrors.commercialRegistrationNo
                    ? 'border-rose-500 focus:border-rose-500'
                    : 'border-stone-800 focus:border-amber-500'
                } text-white px-3 py-2 rounded-xl focus:outline-hidden transition-colors text-xs disabled:opacity-60`}
              />
              {fieldErrors.commercialRegistrationNo && (
                <p className="text-[11px] text-rose-400 font-semibold">{fieldErrors.commercialRegistrationNo}</p>
              )}
            </div>
          </div>

          {/* Optional Fields Divider */}
          <div className="pt-2 border-t border-stone-800/80">
            <p className="text-[11px] text-stone-500 font-bold mb-3">بيانات تشغيلية إضافية (اختيارية)</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-stone-400 font-medium block">رقم ترخيص النقل (TGA)</label>
                <input
                  type="text"
                  value={transportLicenseNo}
                  onChange={(e) => setTransportLicenseNo(e.target.value)}
                  placeholder="رقم الترخيص"
                  disabled={isSubmitting || refreshFailed}
                  className="w-full bg-stone-950 border border-stone-800 focus:border-amber-500 text-white px-3 py-2 rounded-xl focus:outline-hidden transition-colors font-mono text-xs disabled:opacity-60"
                />
              </div>

              <div className="space-y-1">
                <label className="text-stone-400 font-medium block">المسؤول التشغيلي</label>
                <input
                  type="text"
                  value={contactPersonName}
                  onChange={(e) => setContactPersonName(e.target.value)}
                  placeholder="اسم الشخص المسؤول"
                  disabled={isSubmitting || refreshFailed}
                  className="w-full bg-stone-950 border border-stone-800 focus:border-amber-500 text-white px-3 py-2 rounded-xl focus:outline-hidden transition-colors text-xs disabled:opacity-60"
                />
              </div>

              <div className="space-y-1">
                <label className="text-stone-400 font-medium block">رقم الهاتف</label>
                <input
                  type="text"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="05xxxxxxxx أو +966..."
                  disabled={isSubmitting || refreshFailed}
                  className={`w-full bg-stone-950 border font-mono ${
                    fieldErrors.contactPhone
                      ? 'border-rose-500 focus:border-rose-500'
                      : 'border-stone-800 focus:border-amber-500'
                  } text-white px-3 py-2 rounded-xl focus:outline-hidden transition-colors text-xs disabled:opacity-60`}
                />
                {fieldErrors.contactPhone && (
                  <p className="text-[11px] text-rose-400 font-semibold">{fieldErrors.contactPhone}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-stone-400 font-medium block">البريد الإلكتروني</label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="name@company.com"
                  disabled={isSubmitting || refreshFailed}
                  className={`w-full bg-stone-950 border ${
                    fieldErrors.contactEmail
                      ? 'border-rose-500 focus:border-rose-500'
                      : 'border-stone-800 focus:border-amber-500'
                  } text-white px-3 py-2 rounded-xl focus:outline-hidden transition-colors text-xs disabled:opacity-60`}
                />
                {fieldErrors.contactEmail && (
                  <p className="text-[11px] text-rose-400 font-semibold">{fieldErrors.contactEmail}</p>
                )}
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex justify-end gap-2.5 pt-4 border-t border-stone-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold rounded-xl text-xs transition-colors"
            >
              إلغاء
            </button>
            {refreshFailed ? (
              <button
                type="button"
                onClick={handleRetryRefresh}
                disabled={isSubmitting}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-amber-950/40 transition-colors"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>إعادة تحديث البيانات</span>
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-amber-950/40 transition-colors"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>حفظ واعتماد الناقل</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
