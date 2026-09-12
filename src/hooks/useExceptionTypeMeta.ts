/**
 * BLOCK 52 — UI Presentation Metadata Hook: Exception Types
 *
 * Provides reactive, locale-aware presentation labels and descriptions
 * for all 12 Exception Types while preserving:
 * - Domain enum integrity (ExceptionType)
 * - Severity classifications (ExceptionSeverity)
 * - Pure presentation metadata (zero business logic / calculations)
 * - Safe memoization on `t` resolver
 */

import { useMemo } from 'react';
import { useI18n } from '../i18n';
import { ExceptionType, ExceptionSeverity } from '../types/exceptionEngine';

export interface LocalizedExceptionTypeMeta {
  label: string;
  description: string;
  defaultSeverity: ExceptionSeverity;
}

export function useExceptionTypeMeta(): Record<ExceptionType, LocalizedExceptionTypeMeta> {
  const { t } = useI18n();

  return useMemo<Record<ExceptionType, LocalizedExceptionTypeMeta>>(() => ({
    WEIGHT_VARIANCE: {
      label: t('exceptions.labels.weight'),
      description: t('exceptions.labels.truckTrip'),
      defaultSeverity: 'HIGH',
    },
    TRUCK_CARRIER_CONFLICT: {
      label: t('exceptions.labels.truck'),
      description: t('exceptions.labels.truckTrip'),
      defaultSeverity: 'BLOCKING',
    },
    DRIVER_CARRIER_CONFLICT: {
      label: t('exceptions.labels.driver'),
      description: t('exceptions.labels.driver'),
      defaultSeverity: 'HIGH',
    },
    MATERIAL_NOT_ALLOWED: {
      label: t('exceptions.labels.materialMaterials'),
      description: t('exceptions.labels.materialMaterials'),
      defaultSeverity: 'BLOCKING',
    },
    CARRIER_NOT_ALLOWED: {
      label: t('exceptions.status.carrierProjectPending'),
      description: t('exceptions.status.carrierProjectPending'),
      defaultSeverity: 'BLOCKING',
    },
    AMBIGUOUS_TRIP: {
      label: t('exceptions.labels.ambiguous'),
      description: t('exceptions.labels.ambiguous'),
      defaultSeverity: 'MEDIUM',
    },
    DUPLICATE_TRIP: {
      label: t('exceptions.labels.duplicate'),
      description: t('exceptions.labels.duplicate'),
      defaultSeverity: 'HIGH',
    },
    INVALID_WEIGHT: {
      label: t('exceptions.labels.invalidWeight'),
      description: t('exceptions.labels.invalidWeight'),
      defaultSeverity: 'BLOCKING',
    },
    MISSING_PRICING: {
      label: t('exceptions.labels.materialCarrier'),
      description: t('exceptions.labels.materialCarrier'),
      defaultSeverity: 'HIGH',
    },
    PRICING_CONFLICT: {
      label: t('exceptions.labels.trip'),
      description: t('exceptions.labels.trip'),
      defaultSeverity: 'HIGH',
    },
    SYNC_FAILURE: {
      label: t('exceptions.labels.uploadWeighbridge'),
      description: t('exceptions.labels.uploadWeighbridge'),
      defaultSeverity: 'MEDIUM',
    },
    VERSION_CONFLICT: {
      label: t('exceptions.labels.refreshTrip'),
      description: t('exceptions.labels.refreshTrip'),
      defaultSeverity: 'HIGH',
    },
  }), [t]);
}
