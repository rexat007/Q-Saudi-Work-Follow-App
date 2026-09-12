/**
 * BLOCK 53 — Runtime Translation Path Audit & Unresolved-Key Verification
 *
 * Test cases:
 * - I18N-RUNTIME-01: Referenced key resolves in ar
 * - I18N-RUNTIME-02: Referenced key resolves in en
 * - I18N-RUNTIME-03: Referenced key resolves in ur
 * - I18N-RUNTIME-04: Missing key cannot silently render as an unintended production value
 * - I18N-RUNTIME-05: txt_* keys do not render literally when valid
 * - I18N-RUNTIME-06: Foundation fallback remains intact
 * - I18N-RUNTIME-07: Interpolation keys remain resolvable
 */

import { resolveTranslation } from '../i18n/utils';
import { dictionaries } from '../locales';

export interface TestCaseResult {
  id: string;
  name: string;
  passed: boolean;
  message?: string;
}

export async function runRuntimeKeyAuditTests(): Promise<{ passed: number; failed: number; total: number }> {
  const results: TestCaseResult[] = [];

  function test(id: string, name: string, fn: () => void) {
    try {
      fn();
      results.push({ id, name, passed: true });
      console.log(`✅ [${id}] ${name}`);
    } catch (err: any) {
      results.push({ id, name, passed: false, message: err?.message || String(err) });
      console.error(`❌ [${id}] ${name}:`, err?.message || err);
    }
  }

  console.log('======================================================');
  console.log('🚀 Running BLOCK 53 Runtime Key Audit Test Suite...');
  console.log('======================================================');

  // Representative set of valid referenced keys in runtime dictionaries
  const sampleValidKeys = [
    'navigation.labels.projects',
    'navigation.labels.reports',
    'navigation.labels.trips',
    'navigation.labels.import',
    'navigation.labels.pricing',
    'offline.labels.pricing',
    'shared.actions.save',
    'shared.actions.edit',
    'shared.actions.delete',
    'trips.labels.txt_304e68',
    'trips.labels.txt_226b89',
    'weighbridge.messages.txt_5d74e2',
  ];

  // All 42 valid txt_* keys
  const validTxtKeys = Object.keys(dictionaries.ar).filter(k => k.includes('txt_'));

  // I18N-RUNTIME-01: Referenced key resolves in ar
  test('I18N-RUNTIME-01', 'Referenced key resolves in ar', () => {
    for (const key of sampleValidKeys) {
      const resolved = resolveTranslation(key, 'ar');
      if (!resolved || resolved === key) {
        throw new Error(`Key "${key}" failed to resolve in AR; got "${resolved}"`);
      }
      if (typeof resolved !== 'string' || resolved.trim() === '') {
        throw new Error(`Key "${key}" resolved to empty string in AR`);
      }
    }
  });

  // I18N-RUNTIME-02: Referenced key resolves in en
  test('I18N-RUNTIME-02', 'Referenced key resolves in en', () => {
    for (const key of sampleValidKeys) {
      const resolved = resolveTranslation(key, 'en');
      if (!resolved || resolved === key) {
        throw new Error(`Key "${key}" failed to resolve in EN; got "${resolved}"`);
      }
      if (typeof resolved !== 'string' || resolved.trim() === '') {
        throw new Error(`Key "${key}" resolved to empty string in EN`);
      }
    }
  });

  // I18N-RUNTIME-03: Referenced key resolves in ur
  test('I18N-RUNTIME-03', 'Referenced key resolves in ur', () => {
    for (const key of sampleValidKeys) {
      const resolved = resolveTranslation(key, 'ur');
      if (!resolved || resolved === key) {
        throw new Error(`Key "${key}" failed to resolve in UR; got "${resolved}"`);
      }
      if (typeof resolved !== 'string' || resolved.trim() === '') {
        throw new Error(`Key "${key}" resolved to empty string in UR`);
      }
    }
  });

  // I18N-RUNTIME-04: Missing key cannot silently render as an unintended production value
  test('I18N-RUNTIME-04', 'Missing key cannot silently render as an unintended production value', () => {
    const nonexistentKey = 'nonexistent.domain.fake_key_audit_test';
    // Suppress console.warn during deliberate missing key test
    const origWarn = console.warn;
    let warned = false;
    console.warn = () => { warned = true; };

    try {
      const result = resolveTranslation(nonexistentKey, 'ar');
      // Must return key itself so developers and audits can detect unmapped keys (no silent mock values)
      if (result !== nonexistentKey) {
        throw new Error(`Expected missing key to return itself for detection, but got: "${result}"`);
      }
      if (!warned && process.env.NODE_ENV !== 'production') {
        throw new Error('Expected console.warn to trigger for missing key');
      }
    } finally {
      console.warn = origWarn;
    }
  });

  // I18N-RUNTIME-05: txt_* keys do not render literally when valid
  test('I18N-RUNTIME-05', 'txt_* keys do not render literally when valid', () => {
    if (validTxtKeys.length < 40) {
      throw new Error(`Expected at least 40 valid txt_* keys in runtime dictionaries, found ${validTxtKeys.length}`);
    }
    for (const key of validTxtKeys) {
      const ar = resolveTranslation(key, 'ar');
      const en = resolveTranslation(key, 'en');
      const ur = resolveTranslation(key, 'ur');

      if (ar === key) {
        throw new Error(`Valid txt_* key "${key}" rendered literally in AR`);
      }
      if (en === key) {
        throw new Error(`Valid txt_* key "${key}" rendered literally in EN`);
      }
      if (ur === key) {
        throw new Error(`Valid txt_* key "${key}" rendered literally in UR`);
      }
    }
  });

  // I18N-RUNTIME-06: Foundation fallback remains intact
  test('I18N-RUNTIME-06', 'Foundation fallback remains intact', () => {
    const mockDicts = {
      ar: { 'test.fallback.key': 'النص العربي الأساسي' },
      en: {},
      ur: {},
    } as any;

    const enFallback = resolveTranslation('test.fallback.key', 'en', undefined, mockDicts);
    if (enFallback !== 'النص العربي الأساسي') {
      throw new Error(`Expected fallback to AR "النص العربي الأساسي", but got: "${enFallback}"`);
    }

    const urFallback = resolveTranslation('test.fallback.key', 'ur', undefined, mockDicts);
    if (urFallback !== 'النص العربي الأساسي') {
      throw new Error(`Expected fallback to AR "النص العربي الأساسي", but got: "${urFallback}"`);
    }
  });

  // I18N-RUNTIME-07: Interpolation keys remain resolvable
  test('I18N-RUNTIME-07', 'Interpolation keys remain resolvable', () => {
    const interpolatedAr = resolveTranslation('example.count', 'ar', { count: 42 });
    if (!interpolatedAr.includes('42')) {
      throw new Error(`Expected interpolation of 42 in AR, got "${interpolatedAr}"`);
    }

    const interpolatedEn = resolveTranslation('example.count', 'en', { count: 99 });
    if (!interpolatedEn.includes('99')) {
      throw new Error(`Expected interpolation of 99 in EN, got "${interpolatedEn}"`);
    }

    const interpolatedUr = resolveTranslation('example.count', 'ur', { count: 123 });
    if (!interpolatedUr.includes('123')) {
      throw new Error(`Expected interpolation of 123 in UR, got "${interpolatedUr}"`);
    }
  });

  console.log('======================================================');
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  console.log(`BLOCK 53 Test Results: ${passed}/${results.length} PASSED`);
  console.log('======================================================');

  if (failed > 0) {
    throw new Error(`${failed} tests failed in BLOCK 53 test suite`);
  }

  return { passed, failed, total: results.length };
}

// Execute directly if run via CLI
runRuntimeKeyAuditTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
