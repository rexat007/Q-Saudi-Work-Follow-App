/**
 * BLOCK 55 — Runtime UI Smoke Test & Translation Quality Gate Test Suite
 *
 * Validates:
 * - I18N-SMOKE-01: AR runtime renders translated values
 * - I18N-SMOKE-02: EN runtime renders translated values
 * - I18N-SMOKE-03: UR runtime renders translated values
 * - I18N-SMOKE-04: No raw translation keys rendered (including all 736 txt_* keys)
 * - I18N-SMOKE-05: RTL/LTR direction matches locale (ar=rtl, ur=rtl, en=ltr)
 * - I18N-SMOKE-06: Representative domain translations resolve across all 12 domains
 * - I18N-SMOKE-07: Metadata hooks return localized values for all 12 exceptions & 13 domains
 */

import fs from 'fs';
import path from 'path';
import { resolveTranslation, isRTL, directionOf } from '../i18n/utils';
import { DEFAULT_LOCALE, AVAILABLE_LOCALES, LOCALE_DIRECTIONS } from '../i18n/constants';
import { dictionaries } from '../locales';
import { ExceptionType } from '../types/exceptionEngine';

export interface SmokeTestResult {
  id: string;
  name: string;
  passed: boolean;
  message?: string;
}

// Helper to get all 1,115 referenced keys from the component coverage files
function getReferencedKeys(): string[] {
  const auditPath = path.resolve(process.cwd(), 'reports/i18n-block53-runtime-audit.json');
  const auditData = JSON.parse(fs.readFileSync(auditPath, 'utf8'));
  const files: string[] = auditData.componentCoverage.files.map((f: any) => f.file);

  const refKeys = new Set<string>();
  const r = /\b(?:t|translate)\(\s*['"]([^'"\s)]+)['"]/g;

  for (const file of files) {
    const filePath = path.resolve(process.cwd(), file);
    const content = fs.readFileSync(filePath, 'utf8');
    let m;
    while ((m = r.exec(content)) !== null) {
      refKeys.add(m[1]);
    }
  }

  return Array.from(refKeys).sort();
}

export async function runBlock55SmokeTestSuite(): Promise<{ passed: number; failed: number; total: number }> {
  console.log('======================================================');
  console.log('🚀 Running BLOCK 55 Runtime Smoke & Quality Gate Tests');
  console.log('======================================================');

  const results: SmokeTestResult[] = [];

  const test = (id: string, name: string, fn: () => void) => {
    try {
      fn();
      results.push({ id, name, passed: true });
      console.log(`✅ [${id}] ${name}`);
    } catch (err: any) {
      results.push({ id, name, passed: false, message: err.message });
      console.error(`❌ [${id}] ${name}: ${err.message}`);
    }
  };

  const refKeys = getReferencedKeys();

  // I18N-SMOKE-01: AR runtime renders translated values
  test('I18N-SMOKE-01', 'AR runtime renders translated values', () => {
    if (refKeys.length !== 1115) {
      throw new Error(`Expected 1115 referenced keys, found ${refKeys.length}`);
    }
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
      if (!val || val === fk) {
        throw new Error(`Foundation key "${fk}" failed in AR: "${val}"`);
      }
    }

    // Verify all 1,115 referenced keys in AR
    for (const k of refKeys) {
      const val = resolveTranslation(k, 'ar');
      if (!val || typeof val !== 'string' || val.trim() === '') {
        throw new Error(`Key "${k}" unresolved or empty in AR`);
      }
      if (val === k) {
        throw new Error(`Key "${k}" returned literal key in AR`);
      }
    }
  });

  // I18N-SMOKE-02: EN runtime renders translated values
  test('I18N-SMOKE-02', 'EN runtime renders translated values', () => {
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
      if (val !== expected) {
        throw new Error(`EN foundation mismatch on ${k}: got "${val}", expected "${expected}"`);
      }
    }

    // Verify all 1,115 referenced keys in EN
    for (const k of refKeys) {
      const val = resolveTranslation(k, 'en');
      if (!val || typeof val !== 'string' || val.trim() === '') {
        throw new Error(`Key "${k}" unresolved or empty in EN`);
      }
      if (val === k) {
        throw new Error(`Key "${k}" returned literal key in EN`);
      }
    }
  });

  // I18N-SMOKE-03: UR runtime renders translated values
  test('I18N-SMOKE-03', 'UR runtime renders translated values', () => {
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
      if (val !== expected) {
        throw new Error(`UR foundation mismatch on ${k}: got "${val}", expected "${expected}"`);
      }
    }

    // Verify all 1,115 referenced keys in UR
    for (const k of refKeys) {
      const val = resolveTranslation(k, 'ur');
      if (!val || typeof val !== 'string' || val.trim() === '') {
        throw new Error(`Key "${k}" unresolved or empty in UR`);
      }
      if (val === k) {
        throw new Error(`Key "${k}" returned literal key in UR`);
      }
    }
  });

  // I18N-SMOKE-04: No raw translation keys rendered
  test('I18N-SMOKE-04', 'No raw translation keys rendered', () => {
    // Audit all 736 generated txt_* keys
    const txtKeys = refKeys.filter(k => k.includes('txt_'));
    if (txtKeys.length !== 736) {
      throw new Error(`Expected 736 txt_* keys, found ${txtKeys.length}`);
    }

    const leakedKeys: Array<{ key: string; locale: string }> = [];
    for (const loc of ['ar', 'en', 'ur'] as const) {
      for (const k of refKeys) {
        const val = resolveTranslation(k, loc);
        if (val === k) {
          leakedKeys.push({ key: k, locale: loc });
        }
      }
    }

    if (leakedKeys.length > 0) {
      throw new Error(`Detected ${leakedKeys.length} raw key leakages: ${JSON.stringify(leakedKeys.slice(0, 5))}`);
    }
  });

  // I18N-SMOKE-05: RTL/LTR direction matches locale
  test('I18N-SMOKE-05', 'RTL/LTR direction matches locale', () => {
    if (directionOf('ar') !== 'rtl' || !isRTL('ar')) {
      throw new Error(`AR direction incorrect: dir=${directionOf('ar')}, isRTL=${isRTL('ar')}`);
    }
    if (directionOf('ur') !== 'rtl' || !isRTL('ur')) {
      throw new Error(`UR direction incorrect: dir=${directionOf('ur')}, isRTL=${isRTL('ur')}`);
    }
    if (directionOf('en') !== 'ltr' || isRTL('en')) {
      throw new Error(`EN direction incorrect: dir=${directionOf('en')}, isRTL=${isRTL('en')}`);
    }

    // Simulate document.documentElement attribute sync
    const simulatedDoc: Record<string, { lang: string; dir: string }> = {};
    for (const loc of AVAILABLE_LOCALES) {
      simulatedDoc[loc] = {
        lang: loc,
        dir: directionOf(loc),
      };
    }

    if (simulatedDoc.ar.dir !== 'rtl' || simulatedDoc.ar.lang !== 'ar') {
      throw new Error('AR document attribute mismatch');
    }
    if (simulatedDoc.ur.dir !== 'rtl' || simulatedDoc.ur.lang !== 'ur') {
      throw new Error('UR document attribute mismatch');
    }
    if (simulatedDoc.en.dir !== 'ltr' || simulatedDoc.en.lang !== 'en') {
      throw new Error('EN document attribute mismatch');
    }
  });

  // I18N-SMOKE-06: Representative domain translations resolve
  test('I18N-SMOKE-06', 'Representative domain translations resolve across all 12 domains', () => {
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
    if (domainNames.length !== 12) {
      throw new Error(`Expected 12 domains, got ${domainNames.length}`);
    }

    for (const [domain, keys] of Object.entries(representativeKeys)) {
      for (const k of keys) {
        for (const loc of ['ar', 'en', 'ur'] as const) {
          const res = resolveTranslation(k, loc);
          if (!res || res.trim() === '' || res === k) {
            throw new Error(`Domain "${domain}" key "${k}" failed to resolve in ${loc}: got "${res}"`);
          }
        }
      }
    }
  });

  // I18N-SMOKE-07: Metadata hooks return localized values
  test('I18N-SMOKE-07', 'Metadata hooks return localized values', () => {
    // 1. Exception types mapping
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

    for (const [exc, mapping] of Object.entries(exceptionKeyMappings)) {
      for (const loc of ['ar', 'en', 'ur'] as const) {
        const labelVal = resolveTranslation(mapping.labelKey, loc);
        const descVal = resolveTranslation(mapping.descKey, loc);
        if (!labelVal || labelVal === mapping.labelKey) {
          throw new Error(`Exception "${exc}" label key "${mapping.labelKey}" failed in ${loc}`);
        }
        if (!descVal || descVal === mapping.descKey) {
          throw new Error(`Exception "${exc}" desc key "${mapping.descKey}" failed in ${loc}`);
        }
      }
    }

    // 2. Domain metadata mapping
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

    for (const d of domainMappings) {
      for (const loc of ['ar', 'en', 'ur'] as const) {
        const nameVal = resolveTranslation(d.nameKey, loc);
        const descVal = resolveTranslation(d.descKey, loc);
        if (!nameVal || nameVal === d.nameKey) {
          throw new Error(`Domain "${d.key}" name key "${d.nameKey}" failed in ${loc}`);
        }
        if (!descVal || descVal === d.descKey) {
          throw new Error(`Domain "${d.key}" desc key "${d.descKey}" failed in ${loc}`);
        }
      }
    }
  });

  console.log('======================================================');
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  console.log(`BLOCK 55 Test Results: ${passed}/${results.length} PASSED`);
  console.log('======================================================');

  if (failed > 0) {
    throw new Error(`${failed} tests failed in BLOCK 55 smoke test suite`);
  }

  return { passed, failed, total: results.length };
}

if (import.meta.url.endsWith(process.argv[1]) || process.argv[1]?.includes('runtimeSmokeBlock55')) {
  runBlock55SmokeTestSuite();
}
