/**
 * BLOCK 52 — UI Presentation Metadata Hook: Firestore Domains
 *
 * Provides reactive, locale-aware presentation labels and descriptions
 * for the 13 Firestore Architecture Domains while preserving:
 * - Domain identifier integrity (key)
 * - Separation from technical repository/validator metadata
 * - Safe memoization on `t` resolver
 * - Zero business calculations or state machine logic
 */

import { useMemo } from 'react';
import { useI18n } from '../i18n';

export interface LocalizedDomainMeta {
  key: string;
  name: string;
  description: string;
}

export function useDomainMeta(): {
  domains: LocalizedDomainMeta[];
  domainMap: Record<string, LocalizedDomainMeta>;
} {
  const { t } = useI18n();

  return useMemo(() => {
    const list: LocalizedDomainMeta[] = [
      {
        key: 'projects',
        name: t('other.labels.projects_2'),
        description: t('other.labels.txt_2d6b3b'),
      },
      {
        key: 'carriers',
        name: t('other.labels.carriers_2'),
        description: t('other.labels.txt_6be985'),
      },
      {
        key: 'pricingRules',
        name: t('offline.labels.pricing'),
        description: t('other.labels.txt_792227'),
      },
      {
        key: 'materials',
        name: t('other.labels.materials_4'),
        description: t('other.labels.materials_4'),
      },
      {
        key: 'trucks',
        name: t('other.labels.txt_15a8ac'),
        description: t('other.labels.txt_aba485'),
      },
      {
        key: 'drivers',
        name: t('other.labels.drivers_2'),
        description: t('other.labels.drivers_4'),
      },
      {
        key: 'users',
        name: t('other.labels.txt_15a8ac'),
        description: t('other.labels.txt_aba485'),
      },
      {
        key: 'trips',
        name: t('other.labels.trip'),
        description: t('other.labels.txt_4a13ec'),
      },
      {
        key: 'tripEvents',
        name: t('other.labels.trip'),
        description: t('other.labels.txt_4a13ec'),
      },
      {
        key: 'exceptions',
        name: t('other.labels.txt_1fe296'),
        description: t('other.labels.close'),
      },
      {
        key: 'auditLogs',
        name: t('other.labels.txt_334bfc'),
        description: t('other.labels.user_2'),
      },
      {
        key: 'syncLogs',
        name: t('other.labels.txt_43b461'),
        description: t('other.labels.txt_2670a3'),
      },
      {
        key: 'importBatches',
        name: t('other.labels.import'),
        description: t('other.labels.import'),
      },
    ];

    const map: Record<string, LocalizedDomainMeta> = {};
    for (const item of list) {
      map[item.key] = item;
    }

    return { domains: list, domainMap: map };
  }, [t]);
}
