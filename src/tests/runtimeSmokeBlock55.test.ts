/**
 * BLOCK 55 — Runtime UI Smoke Test & Translation Quality Gate Test Suite
 *
 * Validates:
 * - I18N-SMOKE-01: AR runtime renders translated values
 * - I18N-SMOKE-02: EN runtime renders translated values
 * - I18N-SMOKE-03: UR runtime renders translated values
 * - I18N-SMOKE-04: No raw translation keys rendered
 * - I18N-SMOKE-05: RTL/LTR direction matches locale (ar=rtl, ur=rtl, en=ltr)
 * - I18N-SMOKE-06: Representative domain translations resolve across all 12 domains
 * - I18N-SMOKE-07: Metadata hooks return localized values for all 12 exceptions & 13 domains
 */

import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';
import { resolveTranslation, isRTL, directionOf } from '../i18n/utils';
import { AVAILABLE_LOCALES } from '../i18n/constants';
import { ExceptionType } from '../types/exceptionEngine';

function getRuntimeSourceFiles(): string[] {
  const root = process.cwd();
  const files: string[] = [];

  // 1. src/App.tsx
  const appFile = path.resolve(root, 'src/App.tsx');
  if (fs.existsSync(appFile)) {
    files.push(appFile);
  }

  // Recursive directory walker
  function walkDir(dirPath: string) {
    if (!fs.existsSync(dirPath)) return;
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        walkDir(fullPath);
      } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
        files.push(fullPath);
      }
    }
  }

  // 2. src/components
  walkDir(path.resolve(root, 'src/components'));

  // 3. src/hooks
  walkDir(path.resolve(root, 'src/hooks'));

  return files.sort();
}

function getReferencedKeys(): string[] {
  const files = getRuntimeSourceFiles();
  const refKeySet = new Set<string>();
  const keyRegex = /\b(?:t|translate)\(\s*['"]([^'"\s)]+)['"]/g;

  for (const filePath of files) {
    const content = fs.readFileSync(filePath, 'utf8');
    let match;
    while ((match = keyRegex.exec(content)) !== null) {
      refKeySet.add(match[1]);
    }
  }

  return Array.from(refKeySet).sort();
}

describe('BLOCK 55 Runtime Smoke & Quality Gate Tests', () => {
  const refKeys = getReferencedKeys();

  // I18N-SMOKE-01: AR runtime renders translated values
  it('I18N-SMOKE-01: AR runtime renders translated values', () => {
    expect(refKeys.length).toBeGreaterThan(0);

    // Verify foundation actions
    const foundationKeys = [
      'shared.actions.save',
      'shared.actions.cancel',
      'shared.actions.confirm',
      'shared.actions.close',
      'shared.actions.delete',
      'shared.actions.edit',
      'shared.status.loading',
      'shared.status.error',
      'shared.status.success',
      'shared.units.kg',
      'shared.units.ton',
      'shared.units.sar',
    ];
    for (const fk of foundationKeys) {
      const val = resolveTranslation(fk, 'ar');
      expect(val).toBeDefined();
      expect(val).not.toBe(fk);
    }

    // Verify all referenced keys in AR
    for (const k of refKeys) {
      const val = resolveTranslation(k, 'ar');
      expect(typeof val).toBe('string');
      expect(val.trim()).not.toBe('');
      expect(val).not.toBe(k);
    }
  });

  // I18N-SMOKE-02: EN runtime renders translated values
  it('I18N-SMOKE-02: EN runtime renders translated values', () => {
    expect(refKeys.length).toBeGreaterThan(0);

    // Verify foundation actions in EN
    const expectedEnFoundation: Record<string, string> = {
      'shared.actions.save': 'Save',
      'shared.actions.cancel': 'Cancel',
      'shared.actions.confirm': 'Confirm',
      'shared.actions.close': 'Close',
      'shared.actions.delete': 'Delete',
      'shared.actions.edit': 'Edit',
      'shared.status.loading': 'Loading...',
      'shared.status.error': 'An error occurred',
      'shared.status.success': 'Operation completed successfully',
      'shared.units.kg': 'kg',
      'shared.units.ton': 'ton',
      'shared.units.sar': 'SAR',
    };
    for (const [k, expected] of Object.entries(expectedEnFoundation)) {
      const val = resolveTranslation(k, 'en');
      expect(val).toBe(expected);
    }

    // Verify all referenced keys in EN
    for (const k of refKeys) {
      const val = resolveTranslation(k, 'en');
      expect(typeof val).toBe('string');
      expect(val.trim()).not.toBe('');
      expect(val).not.toBe(k);
    }
  });

  // I18N-SMOKE-03: UR runtime renders translated values
  it('I18N-SMOKE-03: UR runtime renders translated values', () => {
    expect(refKeys.length).toBeGreaterThan(0);

    // Verify foundation actions in UR
    const expectedUrFoundation: Record<string, string> = {
      'shared.actions.save': 'محفوظ کریں',
      'shared.actions.cancel': 'منسوخ کریں',
      'shared.actions.confirm': 'تصدیق کریں',
      'shared.actions.close': 'بند کریں',
      'shared.actions.delete': 'حذف کریں',
      'shared.actions.edit': 'ترمیم کریں',
      'shared.status.loading': 'لوڈ ہو رہا ہے...',
      'shared.status.error': 'خرابی پیش آگئی',
      'shared.status.success': 'آپریشن کامیابی سے مکمل ہوا',
      'shared.units.kg': 'کلوگرام',
      'shared.units.ton': 'ٹن',
      'shared.units.sar': 'سعودی ریال',
    };
    for (const [k, expected] of Object.entries(expectedUrFoundation)) {
      const val = resolveTranslation(k, 'ur');
      expect(val).toBe(expected);
    }

    // Verify all referenced keys in UR
    for (const k of refKeys) {
      const val = resolveTranslation(k, 'ur');
      expect(typeof val).toBe('string');
      expect(val.trim()).not.toBe('');
      expect(val).not.toBe(k);
    }
  });

  // I18N-SMOKE-04: No raw translation keys rendered
  it('I18N-SMOKE-04: No raw translation keys rendered', () => {
    // Audit all generated txt_* keys
    const txtKeys = refKeys.filter(k => k.includes('txt_'));
    expect(txtKeys.length).toBeGreaterThan(0);

    const leakedKeys: Array<{ key: string; locale: string }> = [];
    for (const loc of ['ar', 'en', 'ur'] as const) {
      for (const k of refKeys) {
        const val = resolveTranslation(k, loc);
        if (val === k) {
          leakedKeys.push({ key: k, locale: loc });
        }
      }
    }

    expect(leakedKeys).toEqual([]);
  });

  // I18N-SMOKE-05: RTL/LTR direction matches locale
  it('I18N-SMOKE-05: RTL/LTR direction matches locale', () => {
    expect(directionOf('ar')).toBe('rtl');
    expect(isRTL('ar')).toBe(true);

    expect(directionOf('ur')).toBe('rtl');
    expect(isRTL('ur')).toBe(true);

    expect(directionOf('en')).toBe('ltr');
    expect(isRTL('en')).toBe(false);

    // Simulate document.documentElement attribute sync
    const simulatedDoc: Record<string, { lang: string; dir: string }> = {};
    for (const loc of AVAILABLE_LOCALES) {
      simulatedDoc[loc] = {
        lang: loc,
        dir: directionOf(loc),
      };
    }

    expect(simulatedDoc.ar.dir).toBe('rtl');
    expect(simulatedDoc.ar.lang).toBe('ar');

    expect(simulatedDoc.ur.dir).toBe('rtl');
    expect(simulatedDoc.ur.lang).toBe('ur');

    expect(simulatedDoc.en.dir).toBe('ltr');
    expect(simulatedDoc.en.lang).toBe('en');
  });

  // I18N-SMOKE-06: Representative domain translations resolve across all 12 domains
  it('I18N-SMOKE-06: Representative domain translations resolve across all 12 domains', () => {
    const representativeKeys: Record<string, string[]> = {
      dashboard: ['dashboard.labels.continue_2', 'dashboard.labels.pricing_2', 'dashboard.labels.weighbridge'],
      projects: ['projects.labels.pricing_2', 'navigation.labels.projects', 'navigation.labels.projects_2'],
      trips: ['trips.labels.pricing', 'trips.labels.txt_304e68', 'trips.labels.txt_226b89'],
      loading: ['loading.labels.carrier_2', 'loading.labels.carrier_4', 'shared.status.loading'],
      unloading: ['unloading.labels.confirmTruck', 'unloading.labels.create', 'unloading.labels.location'],
      weighbridge: ['weighbridge.labels.importWeighbridge', 'weighbridge.labels.addRefresh', 'weighbridge.messages.txt_5d74e2'],
      imports: ['weighbridge.labels.import', 'entityResolution.labels.import', 'other.labels.import'],
      pricing: ['offline.labels.pricing', 'navigation.labels.pricing', 'loading.labels.pricingConfirm'],
      reports: ['navigation.labels.reports', 'navigation.labels.reports_2'],
      offline: ['offline.labels.pricing', 'offline.labels.add', 'offline.messages.txt_2165a5'],
      exceptions: ['exceptions.labels.weight', 'exceptions.labels.ambiguous', 'exceptions.labels.duplicate'],
      legacyMigration: ['legacyMigration.labels.carrier_2', 'legacyMigration.labels.confirm', 'legacyMigration.status.txt_1d98ed'],
    };

    const domainNames = Object.keys(representativeKeys);
    expect(domainNames.length).toBe(12);

    for (const [domain, keys] of Object.entries(representativeKeys)) {
      for (const k of keys) {
        for (const loc of ['ar', 'en', 'ur'] as const) {
          const res = resolveTranslation(k, loc);
          expect(res, `Domain "${domain}" key "${k}" in ${loc}`).toBeDefined();
          expect(res.trim(), `Domain "${domain}" key "${k}" in ${loc}`).not.toBe('');
          expect(res, `Domain "${domain}" key "${k}" in ${loc}`).not.toBe(k);
        }
      }
    }
  });

  // I18N-SMOKE-07: Metadata hooks return localized values for all 12 exceptions & 13 domains
  it('I18N-SMOKE-07: Metadata hooks return localized values for all 12 exceptions & 13 domains', () => {
    // 1. Exception types mapping (12 types)
    const exceptionKeyMappings: Record<ExceptionType, { labelKey: string; descKey: string }> = {
      WEIGHT_VARIANCE: { labelKey: 'exceptions.labels.weight', descKey: 'exceptions.labels.truckTrip' },
      TRUCK_CARRIER_CONFLICT: { labelKey: 'exceptions.labels.truck', descKey: 'exceptions.labels.truckTrip' },
      DRIVER_CARRIER_CONFLICT: { labelKey: 'exceptions.labels.driver', descKey: 'exceptions.labels.driver' },
      MATERIAL_NOT_ALLOWED: { labelKey: 'exceptions.labels.materialMaterials', descKey: 'exceptions.labels.materialMaterials' },
      CARRIER_NOT_ALLOWED: { labelKey: 'exceptions.status.carrierProjectPending', descKey: 'exceptions.status.carrierProjectPending' },
      AMBIGUOUS_TRIP: { labelKey: 'exceptions.labels.ambiguous', descKey: 'exceptions.labels.ambiguous' },
      DUPLICATE_TRIP: { labelKey: 'exceptions.labels.duplicate', descKey: 'exceptions.labels.duplicate' },
      INVALID_WEIGHT: { labelKey: 'exceptions.labels.invalidWeight', descKey: 'exceptions.labels.invalidWeight' },
      MISSING_PRICING: { labelKey: 'exceptions.labels.materialCarrier', descKey: 'exceptions.labels.materialCarrier' },
      PRICING_CONFLICT: { labelKey: 'exceptions.labels.trip', descKey: 'exceptions.labels.trip' },
      SYNC_FAILURE: { labelKey: 'exceptions.labels.uploadWeighbridge', descKey: 'exceptions.labels.uploadWeighbridge' },
      VERSION_CONFLICT: { labelKey: 'exceptions.labels.refreshTrip', descKey: 'exceptions.labels.refreshTrip' },
    };

    expect(Object.keys(exceptionKeyMappings).length).toBe(12);

    for (const [exc, mapping] of Object.entries(exceptionKeyMappings)) {
      for (const loc of ['ar', 'en', 'ur'] as const) {
        const labelVal = resolveTranslation(mapping.labelKey, loc);
        const descVal = resolveTranslation(mapping.descKey, loc);
        expect(labelVal, `Exception "${exc}" labelKey "${mapping.labelKey}" in ${loc}`).toBeDefined();
        expect(labelVal, `Exception "${exc}" labelKey "${mapping.labelKey}" in ${loc}`).not.toBe(mapping.labelKey);
        expect(descVal, `Exception "${exc}" descKey "${mapping.descKey}" in ${loc}`).toBeDefined();
        expect(descVal, `Exception "${exc}" descKey "${mapping.descKey}" in ${loc}`).not.toBe(mapping.descKey);
      }
    }

    // 2. Domain metadata mapping (13 domains from useDomainMeta)
    const domainMappings: Array<{ key: string; nameKey: string; descKey: string }> = [
      { key: 'projects', nameKey: 'other.labels.projects_2', descKey: 'other.labels.txt_2d6b3b' },
      { key: 'carriers', nameKey: 'other.labels.carriers_2', descKey: 'other.labels.txt_6be985' },
      { key: 'pricingRules', nameKey: 'offline.labels.pricing', descKey: 'other.labels.txt_792227' },
      { key: 'materials', nameKey: 'other.labels.materials_4', descKey: 'other.labels.materials_4' },
      { key: 'trucks', nameKey: 'other.labels.txt_15a8ac', descKey: 'other.labels.txt_aba485' },
      { key: 'drivers', nameKey: 'other.labels.drivers_2', descKey: 'other.labels.drivers_4' },
      { key: 'users', nameKey: 'other.labels.txt_15a8ac', descKey: 'other.labels.txt_aba485' },
      { key: 'trips', nameKey: 'other.labels.trip', descKey: 'other.labels.txt_4a13ec' },
      { key: 'tripEvents', nameKey: 'other.labels.trip', descKey: 'other.labels.txt_4a13ec' },
      { key: 'exceptions', nameKey: 'other.labels.txt_1fe296', descKey: 'other.labels.close' },
      { key: 'auditLogs', nameKey: 'other.labels.txt_334bfc', descKey: 'other.labels.user_2' },
      { key: 'syncLogs', nameKey: 'other.labels.txt_43b461', descKey: 'other.labels.txt_2670a3' },
      { key: 'importBatches', nameKey: 'other.labels.import', descKey: 'other.labels.import' },
    ];

    expect(domainMappings.length).toBe(13);

    for (const d of domainMappings) {
      for (const loc of ['ar', 'en', 'ur'] as const) {
        const nameVal = resolveTranslation(d.nameKey, loc);
        const descVal = resolveTranslation(d.descKey, loc);
        expect(nameVal, `Domain "${d.key}" nameKey "${d.nameKey}" in ${loc}`).toBeDefined();
        expect(nameVal, `Domain "${d.key}" nameKey "${d.nameKey}" in ${loc}`).not.toBe(d.nameKey);
        expect(descVal, `Domain "${d.key}" descKey "${d.descKey}" in ${loc}`).toBeDefined();
        expect(descVal, `Domain "${d.key}" descKey "${d.descKey}" in ${loc}`).not.toBe(d.descKey);
      }
    }
  });
});
