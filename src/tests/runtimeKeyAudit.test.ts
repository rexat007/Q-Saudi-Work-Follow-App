/**
 * BLOCK 53 / BLOCK 54C — Runtime Translation Path Audit & Unresolved-Key Verification
 *
 * Test cases:
 * - I18N-RUNTIME-01: Referenced key resolves in ar
 * - I18N-RUNTIME-02: Referenced key resolves in en
 * - I18N-RUNTIME-03: Referenced key resolves in ur
 * - I18N-RUNTIME-04: Missing key cannot silently render as an unintended production value
 * - I18N-RUNTIME-05: txt_* keys do not render literally when valid
 * - I18N-RUNTIME-06: Foundation fallback remains intact
 * - I18N-RUNTIME-07: Interpolation keys remain resolvable
 * - I18N-RUNTIME-08: All referenced keys resolve in AR
 * - I18N-RUNTIME-09: All referenced keys resolve in EN
 * - I18N-RUNTIME-10: All referenced keys resolve in UR
 * - I18N-RUNTIME-11: No referenced key resolves to itself
 * - I18N-RUNTIME-12: All metadata-hook keys resolve
 * - I18N-RUNTIME-13: Referenced language key sets are identical
 * - I18N-RUNTIME-14: Interpolation parity remains valid
 * - I18N-RUNTIME-15: Protected tokens remain valid
 * - I18N-RUNTIME-16: No duplicate locale keys
 */

import fs from 'fs';
import path from 'path';
import { resolveTranslation } from '../i18n/utils';
import { dictionaries } from '../locales';

export interface TestCaseResult {
  id: string;
  name: string;
  passed: boolean;
  message?: string;
}

function getReferencedKeys(): string[] {
  const auditPath = path.resolve(process.cwd(), 'reports/i18n-block53-runtime-audit.json');
  const audit = JSON.parse(fs.readFileSync(auditPath, 'utf8'));
  const auditFiles: string[] = audit.componentCoverage.files.map((f: any) => f.file);

  const referencedKeySet = new Set<string>();
  const keyRegex = /\b(?:t|translate)\(\s*['"]([^'"\s)]+)['"]/g;

  for (const file of auditFiles) {
    const filePath = path.resolve(process.cwd(), file);
    const content = fs.readFileSync(filePath, 'utf8');
    let match;
    while ((match = keyRegex.exec(content)) !== null) {
      referencedKeySet.add(match[1]);
    }
  }
  return Array.from(referencedKeySet).sort();
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

  // I18N-RUNTIME-08: All referenced keys resolve in AR
  test('I18N-RUNTIME-08', 'All referenced keys resolve in AR', () => {
    const refKeys = getReferencedKeys();
    if (refKeys.length !== 1115) {
      throw new Error(`Expected 1115 referenced keys, found ${refKeys.length}`);
    }
    for (const key of refKeys) {
      const res = resolveTranslation(key, 'ar');
      if (!res || typeof res !== 'string' || res.trim() === '') {
        throw new Error(`Key "${key}" failed to resolve or is empty in AR`);
      }
      if (res === key) {
        throw new Error(`Key "${key}" unresolved in AR (returned literal key)`);
      }
    }
  });

  // I18N-RUNTIME-09: All referenced keys resolve in EN
  test('I18N-RUNTIME-09', 'All referenced keys resolve in EN', () => {
    const refKeys = getReferencedKeys();
    for (const key of refKeys) {
      const res = resolveTranslation(key, 'en');
      if (!res || typeof res !== 'string' || res.trim() === '') {
        throw new Error(`Key "${key}" failed to resolve or is empty in EN`);
      }
      if (res === key) {
        throw new Error(`Key "${key}" unresolved in EN (returned literal key)`);
      }
    }
  });

  // I18N-RUNTIME-10: All referenced keys resolve in UR
  test('I18N-RUNTIME-10', 'All referenced keys resolve in UR', () => {
    const refKeys = getReferencedKeys();
    for (const key of refKeys) {
      const res = resolveTranslation(key, 'ur');
      if (!res || typeof res !== 'string' || res.trim() === '') {
        throw new Error(`Key "${key}" failed to resolve or is empty in UR`);
      }
      if (res === key) {
        throw new Error(`Key "${key}" unresolved in UR (returned literal key)`);
      }
    }
  });

  // I18N-RUNTIME-11: No referenced key resolves to itself
  test('I18N-RUNTIME-11', 'No referenced key resolves to itself', () => {
    const refKeys = getReferencedKeys();
    const selfResolving: Array<{ key: string; locale: string }> = [];
    for (const locale of ['ar', 'en', 'ur'] as const) {
      for (const key of refKeys) {
        const res = resolveTranslation(key, locale);
        if (res === key) {
          selfResolving.push({ key, locale });
        }
      }
    }
    if (selfResolving.length > 0) {
      throw new Error(`Found ${selfResolving.length} self-resolving keys: ${JSON.stringify(selfResolving.slice(0, 5))}`);
    }
  });

  // I18N-RUNTIME-12: All metadata-hook keys resolve
  test('I18N-RUNTIME-12', 'All metadata-hook keys resolve', () => {
    const hookFiles = [
      'src/hooks/useExceptionTypeMeta.ts',
      'src/hooks/useDomainMeta.ts',
    ];
    const hookKeys = new Set<string>();
    const r = /\b(?:t|translate)\(\s*['"]([^'"\s)]+)['"]/g;
    for (const hf of hookFiles) {
      const c = fs.readFileSync(path.resolve(process.cwd(), hf), 'utf8');
      let m;
      while ((m = r.exec(c)) !== null) {
        hookKeys.add(m[1]);
      }
    }
    if (hookKeys.size === 0) {
      throw new Error('No metadata hook keys found');
    }
    for (const hk of hookKeys) {
      for (const loc of ['ar', 'en', 'ur'] as const) {
        const res = resolveTranslation(hk, loc);
        if (!res || res.trim() === '' || res === hk) {
          throw new Error(`Metadata hook key "${hk}" failed to resolve in ${loc} (got: "${res}")`);
        }
      }
    }
  });

  // I18N-RUNTIME-13: Referenced language key sets are identical
  test('I18N-RUNTIME-13', 'Referenced language key sets are identical', () => {
    const refKeys = getReferencedKeys();
    for (const key of refKeys) {
      const inAr = key in dictionaries.ar;
      const inEn = key in dictionaries.en;
      const inUr = key in dictionaries.ur;
      if (!inAr || !inEn || !inUr) {
        throw new Error(`Key "${key}" parity mismatch: AR=${inAr}, EN=${inEn}, UR=${inUr}`);
      }
    }
    // Also verify overall dictionary key parity
    const arKeys = Object.keys(dictionaries.ar).sort();
    const enKeys = Object.keys(dictionaries.en).sort();
    const urKeys = Object.keys(dictionaries.ur).sort();
    if (arKeys.join(',') !== enKeys.join(',') || arKeys.join(',') !== urKeys.join(',')) {
      throw new Error(`Dictionary key set parity mismatch between locales: AR count=${arKeys.length}, EN count=${enKeys.length}, UR count=${urKeys.length}`);
    }
  });

  // I18N-RUNTIME-14: Interpolation parity remains valid
  test('I18N-RUNTIME-14', 'Interpolation parity remains valid', () => {
    const refKeys = getReferencedKeys();
    const extractParams = (str: string): string[] => {
      if (!str) return [];
      const matches = str.match(/\{([a-zA-Z0-9_]+)\}/g) || [];
      return matches.map(m => m.slice(1, -1)).sort();
    };

    for (const key of refKeys) {
      const arVal = resolveTranslation(key, 'ar');
      const enVal = resolveTranslation(key, 'en');
      const urVal = resolveTranslation(key, 'ur');

      const arP = extractParams(arVal);
      const enP = extractParams(enVal);
      const urP = extractParams(urVal);

      if (arP.join(',') !== enP.join(',') || arP.join(',') !== urP.join(',')) {
        throw new Error(`Interpolation mismatch on key "${key}": AR=[${arP}], EN=[${enP}], UR=[${urP}]`);
      }
    }
  });

  // I18N-RUNTIME-15: Protected tokens remain valid
  test('I18N-RUNTIME-15', 'Protected tokens remain valid', () => {
    const refKeys = getReferencedKeys();
    const protectedTokens = [
      'ticketId', 'truckNo', 'projectId', 'carrierId', 'driverId', 'materialId',
      'operationId', 'pricingType', 'settlementBase', 'sourceType', 'status',
      'SAR', 'KG', 'TON'
    ];

    for (const key of refKeys) {
      const arVal = resolveTranslation(key, 'ar');
      const enVal = resolveTranslation(key, 'en');
      const urVal = resolveTranslation(key, 'ur');

      for (const token of protectedTokens) {
        const inAr = arVal.includes(token);
        const inEn = enVal.includes(token);
        const inUr = urVal.includes(token);

        if (inAr && (!inEn || !inUr)) {
          throw new Error(`Protected token "${token}" in AR missing in EN/UR for key "${key}": AR="${arVal}", EN="${enVal}", UR="${urVal}"`);
        }
      }
    }
  });

  // I18N-RUNTIME-16: No duplicate locale keys
  test('I18N-RUNTIME-16', 'No duplicate locale keys', () => {
    const localeFiles = ['src/locales/ar/index.ts', 'src/locales/en/index.ts', 'src/locales/ur/index.ts'];
    for (const file of localeFiles) {
      const content = fs.readFileSync(path.resolve(process.cwd(), file), 'utf8');
      const lines = content.split('\n');
      const seen = new Set<string>();
      const dups: string[] = [];
      for (const line of lines) {
        const m = line.match(/^\s*['"]([^'"]+)['"]\s*:/);
        if (m) {
          const k = m[1];
          if (seen.has(k)) {
            dups.push(k);
          }
          seen.add(k);
        }
      }
      if (dups.length > 0) {
        throw new Error(`Duplicate keys found in ${file}: ${dups.join(', ')}`);
      }
    }
  });

  console.log('======================================================');
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  console.log(`BLOCK 53/54C Test Results: ${passed}/${results.length} PASSED`);
  console.log('======================================================');

  if (failed > 0) {
    throw new Error(`${failed} tests failed in BLOCK 53/54C test suite`);
  }

  return { passed, failed, total: results.length };
}

// Execute directly if run via CLI
runRuntimeKeyAuditTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
