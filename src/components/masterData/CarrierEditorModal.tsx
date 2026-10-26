import { resolutionErrorKey } from '../../i18n/importResolution';
import { useProjectEditorLifetime } from '../wizard/useProjectEditorLifetime';
import { setupErrorKey } from '../../i18n/setupErrors';
import { presentBatch4Message } from '../../i18n/batch4Messages';
import { useI18n } from '../../i18n';
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Truck, X, AlertCircle, Loader2 } from 'lucide-react';
import {
  carrierManagementClientService,
  CarrierCreateInput,
  CarrierCreationResult,
  CarrierUpdateInput,
  CarrierUpdateResult,
} from '../../services/carrierManagementClient.service';

export interface CarrierEditorModalProps {
  isCurrent?: () => boolean;
  open: boolean;
  projectId: string;
  mode?: 'CREATE' | 'EDIT';
  initialName?: string;
  initialCreateValues?: Partial<CarrierCreateInput>;
  initialCarrier?: {
    carrierId: string;
    name: string;
    commercialRegistrationNo?: string;
    transportLicenseNo?: string | null;
    contactPersonName?: string | null;
    contactPhone?: string | null;
    contactEmail?: string | null;
    contactPerson?: {
      name?: string;
      phone?: string;
      email?: string;
    } | null;
  } | null;
  onClose: () => void;
  beforeCreate?: (naturalKey: string) => Promise<boolean>;
  onCreated?: (result: CarrierCreationResult) => void | Promise<void>;
  onUpdated?: (result: CarrierUpdateResult) => void | Promise<void>;
  clientService?: {
    createProjectCarrier: (
      projectId: string,
      input: CarrierCreateInput,
      overrideToken?: string
    ) => Promise<CarrierCreationResult>;
    updateProjectCarrier?: (
      projectId: string,
      carrierId: string,
      input: CarrierUpdateInput,
      overrideToken?: string
    ) => Promise<CarrierUpdateResult>;
  };
  zIndexClass?: string;
}

export const CarrierEditorModal: React.FC<CarrierEditorModalProps> = ({
  open,
  projectId,
  isCurrent: ownerIsCurrent,
  mode = 'CREATE',
  initialName = '',
  initialCreateValues,
  initialCarrier = null,
  onClose,
  onCreated, beforeCreate,
  onUpdated,
  clientService = carrierManagementClientService,
  zIndexClass = 'z-50',
}) => {
  const { t, direction } = useI18n();
  const editor = useProjectEditorLifetime(projectId, open, ownerIsCurrent);
  const submitLock = useRef(false);
  const isEditMode = mode === 'EDIT';

  const [name, setName] = useState('');
  const [commercialRegistrationNo, setCommercialRegistrationNo] = useState('');
  const [transportLicenseNo, setTransportLicenseNo] = useState('');
  const [contactPersonName, setContactPersonName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Stored results for mutation-succeeded / refresh-failed recovery
  const [createdCarrierResult, setCreatedCarrierResult] = useState<CarrierCreationResult | null>(null);
  const [updatedCarrierResult, setUpdatedCarrierResult] = useState<CarrierUpdateResult | null>(null);
  const [refreshFailed, setRefreshFailed] = useState(false);

  // Synchronize form when opened or initial values change
  useEffect(() => {
    if (open) {
      submitLock.current = false;
      if (isEditMode && initialCarrier) {
        setName(initialCarrier.name || '');
        setCommercialRegistrationNo(initialCarrier.commercialRegistrationNo || '');
        setTransportLicenseNo(initialCarrier.transportLicenseNo || '');
        setContactPersonName(
          initialCarrier.contactPersonName || initialCarrier.contactPerson?.name || ''
        );
        setContactPhone(
          initialCarrier.contactPhone || initialCarrier.contactPerson?.phone || ''
        );
        setContactEmail(
          initialCarrier.contactEmail || initialCarrier.contactPerson?.email || ''
        );
      } else {
        setName(initialCreateValues?.name || initialName || initialCarrier?.name || '');
        setCommercialRegistrationNo(initialCreateValues?.commercialRegistrationNo || '');
        setTransportLicenseNo(initialCreateValues?.transportLicenseNo || '');
        setContactPersonName(initialCreateValues?.contactPersonName || '');
        setContactPhone(initialCreateValues?.contactPhone || '');
        setContactEmail(initialCreateValues?.contactEmail || '');
      }

      setFieldErrors({});
      setSubmitError(null);
      setIsSubmitting(false);
      setCreatedCarrierResult(null);
      setUpdatedCarrierResult(null);
      setRefreshFailed(false);
    }
  }, [open, projectId, isEditMode, initialCarrier, initialName, JSON.stringify(initialCreateValues)]);

  if (!open) return null;

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    const trimmedName = name.trim();
    if (!trimmedName) {
      errors.name = t('entityResolution.messages.carrier_name_required');
    } else if (trimmedName.length < 3) {
      errors.name = t('entityResolution.messages.carrier_name_min_length');
    }

    // In CREATE mode, CR is strictly validated. In EDIT mode, CR is read-only.
    if (!isEditMode) {
      const trimmedCr = commercialRegistrationNo.trim();
      const crDigits = trimmedCr.replace(/[^0-9]/g, '');
      if (!trimmedCr) {
        errors.commercialRegistrationNo = t('entityResolution.messages.carrier_registration_required');
      } else if (crDigits.length !== 10 || crDigits !== trimmedCr) {
        errors.commercialRegistrationNo = t('entityResolution.messages.carrier_registration_length');
      }
    }

    if (contactPhone.trim()) {
      const cleanPhone = contactPhone.trim().replace(/[\s-]/g, '');
      if (!/^\+?[0-9]{9,15}$/.test(cleanPhone)) {
        errors.contactPhone = t('entityResolution.messages.phone_invalid');
      }
    }

    if (contactEmail.trim()) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail.trim())) {
        errors.contactEmail = t('entityResolution.messages.email_invalid');
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || submitLock.current) return;
    const request = editor.capture();
    if (!editor.isCurrent(request)) return;
    setSubmitError(null);

    if (refreshFailed) {
      await handleRetryRefresh();
          if (!editor.isCurrent(request)) return;
      return;
    }

    if (!validate()) {
      return;
    }

    submitLock.current = true;
    setIsSubmitting(true);

    if (!isEditMode) {
      // CREATE MODE
      let result = createdCarrierResult;

      if (!result) {
        try {
          if (beforeCreate && !(await beforeCreate(commercialRegistrationNo.trim()))) {
            if (!editor.isCurrent(request)) return;
            submitLock.current = false; setIsSubmitting(false); return;
          }
          if (!editor.isCurrent(request)) return;
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
          if (!editor.isCurrent(request)) return;
          setCreatedCarrierResult(result);
        } catch (err: any) {
          if (!editor.isCurrent(request)) return;
          setSubmitError(t(beforeCreate ? resolutionErrorKey(err) : setupErrorKey(err)));
          submitLock.current = false; setIsSubmitting(false);
          return;
        }
      }

      // Authoritative post-mutation canonical refresh barrier
      try {
        if (onCreated) {
          await onCreated(result);
          if (!editor.isCurrent(request)) return;
        }
        onClose();
      } catch (refreshErr: any) {
          if (!editor.isCurrent(request)) return;
        setRefreshFailed(true);
        setSubmitError(
          t('entityResolution.messages.carrier_saved_refresh_failed')
        );
      } finally {
        if (!editor.isCurrent(request)) return;
        submitLock.current = false; setIsSubmitting(false);
      }
    } else {
      // EDIT MODE
      let result = updatedCarrierResult;

      if (!result) {
        try {
          const payload: CarrierUpdateInput = {
            name: name.trim(),
            transportLicenseNo: transportLicenseNo.trim() ? transportLicenseNo.trim() : null,
            contactPersonName: contactPersonName.trim() ? contactPersonName.trim() : null,
            contactPhone: contactPhone.trim() ? contactPhone.trim() : null,
            contactEmail: contactEmail.trim() ? contactEmail.trim() : null,
          };

          const targetCarrierId = initialCarrier?.carrierId || '';
          const updater =
            clientService.updateProjectCarrier ||
            carrierManagementClientService.updateProjectCarrier.bind(carrierManagementClientService);

          result = await updater(projectId, targetCarrierId, payload);
          if (!editor.isCurrent(request)) return;
          setUpdatedCarrierResult(result);
        } catch (err: any) {
          if (!editor.isCurrent(request)) return;
          setSubmitError(t(beforeCreate ? resolutionErrorKey(err) : setupErrorKey(err)));
          submitLock.current = false; setIsSubmitting(false);
          return;
        }
      }

      // Authoritative post-mutation canonical refresh barrier
      try {
        if (onUpdated) {
          await onUpdated(result);
          if (!editor.isCurrent(request)) return;
        }
        onClose();
      } catch (refreshErr: any) {
          if (!editor.isCurrent(request)) return;
        setRefreshFailed(true);
        setSubmitError(
          t('entityResolution.messages.carrier_updated_refresh_failed')
        );
      } finally {
        if (!editor.isCurrent(request)) return;
        submitLock.current = false; setIsSubmitting(false);
      }
    }
  };

  const handleRetryRefresh = async () => {
    if (isSubmitting || submitLock.current) return;
    const request = editor.capture();
    if (!editor.isCurrent(request)) return;
    submitLock.current = true;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      if (isEditMode) {
        if (updatedCarrierResult && onUpdated) {
          await onUpdated(updatedCarrierResult);
          if (!editor.isCurrent(request)) return;
          onClose();
        }
      } else {
        if (createdCarrierResult && onCreated) {
          await onCreated(createdCarrierResult);
          if (!editor.isCurrent(request)) return;
          onClose();
        }
      }
    } catch (refreshErr: any) {
          if (!editor.isCurrent(request)) return;
      setRefreshFailed(true);
      setSubmitError(
        isEditMode
          ? t('entityResolution.messages.carrier_updated_refresh_failed')
          : t('entityResolution.messages.carrier_saved_refresh_failed')
      );
    } finally {
        if (!editor.isCurrent(request)) return;
      submitLock.current = false; setIsSubmitting(false);
    }
  };

  const modalContent = (
    <div
      className={`fixed inset-0 bg-stone-950/80 backdrop-blur-xs ${zIndexClass} flex items-center justify-center p-4 animate-in fade-in duration-200`}
      dir={direction}
    >
      <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-stone-800 bg-stone-950 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-500">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">
                {isEditMode ? t('entityResolution.labels.edit_carrier') : t('projects.labels.add_carrier')}
              </h3>
              <p className="text-[11px] text-stone-400">
                {isEditMode
                  ? t('entityResolution.labels.carrier_edit_description')
                  : t('entityResolution.labels.carrier_create_description')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 text-stone-400 hover:text-white hover:bg-stone-800 rounded-lg transition-colors"
            aria-label={t('shared.actions.close')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          {submitError && (
            <div className="p-3 bg-rose-950/60 border border-rose-800/80 rounded-xl text-rose-200 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{presentBatch4Message(submitError, t)}</div>
            </div>
          )}

          {!isEditMode && (
            <div className="p-3 bg-amber-950/30 border border-amber-800/40 rounded-xl text-[11px] text-amber-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>{t('entityResolution.messages.master_data_survives_cancel', { entity: t('legacyMigration.labels.carrier_2') })}</span>
            </div>
          )}

          {/* Required Fields Section */}
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-stone-300 font-bold block">
                {t('entityResolution.labels.carrier_company_name')} <span className="text-amber-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('entityResolution.labels.carrier_name_example')}
                disabled={isSubmitting || refreshFailed}
                className={`w-full bg-stone-950 border ${
                  fieldErrors.name
                    ? 'border-rose-500 focus:border-rose-500'
                    : 'border-stone-800 focus:border-amber-500'
                } text-white px-3 py-2 rounded-xl focus:outline-hidden transition-colors text-xs disabled:opacity-60`}
              />
              {fieldErrors.name && (
                <p className="text-[11px] text-rose-400 font-semibold">{presentBatch4Message(fieldErrors.name, t)}</p>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-stone-300 font-bold block">
                  {t('entityResolution.labels.commercial_registration')} <span className="text-amber-500">*</span>
                </label>
                {isEditMode && (
                  <span className="text-[10px] text-stone-500 font-mono">
                    {t('entityResolution.labels.carrier_identity_immutable')}
                  </span>
                )}
              </div>
              <input
                type="text"
                maxLength={10}
                value={commercialRegistrationNo}
                onChange={(e) => setCommercialRegistrationNo(e.target.value)}
                placeholder={t('entityResolution.labels.registration_example')}
                disabled={isSubmitting || refreshFailed || isEditMode}
                className={`w-full bg-stone-950 border font-mono ${
                  fieldErrors.commercialRegistrationNo
                    ? 'border-rose-500 focus:border-rose-500'
                    : 'border-stone-800 focus:border-amber-500'
                } text-white px-3 py-2 rounded-xl focus:outline-hidden transition-colors text-xs disabled:opacity-60 disabled:bg-stone-950/40`}
              />
              {fieldErrors.commercialRegistrationNo && (
                <p className="text-[11px] text-rose-400 font-semibold">
                  {presentBatch4Message(fieldErrors.commercialRegistrationNo, t)}
                </p>
              )}
            </div>
          </div>

          {/* Optional Fields Divider */}
          <div className="pt-2 border-t border-stone-800/80">
            <p className="text-[11px] text-stone-500 font-bold mb-3">{t('entityResolution.labels.optional_operational_details')}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-stone-400 font-medium block">{t('entityResolution.labels.transport_license_tga')}</label>
                <input
                  type="text"
                  value={transportLicenseNo}
                  onChange={(e) => setTransportLicenseNo(e.target.value)}
                  placeholder={t('entityResolution.labels.license_number')}
                  disabled={isSubmitting || refreshFailed}
                  className="w-full bg-stone-950 border border-stone-800 focus:border-amber-500 text-white px-3 py-2 rounded-xl focus:outline-hidden transition-colors font-mono text-xs disabled:opacity-60"
                />
              </div>

              <div className="space-y-1">
                <label className="text-stone-400 font-medium block">{t('entityResolution.labels.operations_contact')}</label>
                <input
                  type="text"
                  value={contactPersonName}
                  onChange={(e) => setContactPersonName(e.target.value)}
                  placeholder={t('entityResolution.labels.contact_person_name')}
                  disabled={isSubmitting || refreshFailed}
                  className="w-full bg-stone-950 border border-stone-800 focus:border-amber-500 text-white px-3 py-2 rounded-xl focus:outline-hidden transition-colors text-xs disabled:opacity-60"
                />
              </div>

              <div className="space-y-1">
                <label className="text-stone-400 font-medium block">{t('entityResolution.labels.phone_number')}</label>
                <input
                  type="text"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder={t('entityResolution.labels.phone_example')}
                  disabled={isSubmitting || refreshFailed}
                  className={`w-full bg-stone-950 border font-mono ${
                    fieldErrors.contactPhone
                      ? 'border-rose-500 focus:border-rose-500'
                      : 'border-stone-800 focus:border-amber-500'
                  } text-white px-3 py-2 rounded-xl focus:outline-hidden transition-colors text-xs disabled:opacity-60`}
                />
                {fieldErrors.contactPhone && (
                  <p className="text-[11px] text-rose-400 font-semibold">{presentBatch4Message(fieldErrors.contactPhone, t)}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-stone-400 font-medium block">{t('admin_console.col_email')}</label>
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
                  <p className="text-[11px] text-rose-400 font-semibold">{presentBatch4Message(fieldErrors.contactEmail, t)}</p>
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
              {t('shared.actions.cancel')}
            </button>
            {refreshFailed ? (
              <button
                type="button"
                onClick={handleRetryRefresh}
                disabled={isSubmitting}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-amber-950/40 transition-colors"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{t('entityResolution.labels.refresh_data')}</span>
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-amber-950/40 transition-colors"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{isEditMode ? t('shared.actions.save') : t('entityResolution.labels.save_approve_carrier')}</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};
