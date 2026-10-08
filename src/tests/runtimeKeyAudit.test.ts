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
import { describe, it, expect } from 'vitest';
import { resolveTranslation } from '../i18n/utils';
import { dictionaries } from '../locales';

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
  const referencedKeySet = new Set<string>();
  const keyRegex = /\b(?:t|translate)\(\s*['"]([^'"\s)]+)['"]/g;

  for (const filePath of files) {
    const content = fs.readFileSync(filePath, 'utf8');
    let match;
    while ((match = keyRegex.exec(content)) !== null) {
      referencedKeySet.add(match[1]);
    }
  }
  return Array.from(referencedKeySet).sort();
}

describe('BLOCK 53 / BLOCK 54C — Runtime Key Audit Test Suite', () => {
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

  // All valid txt_* keys in AR dictionary
  const validTxtKeys = Object.keys(dictionaries.ar).filter(k => k.includes('txt_'));

  // I18N-RUNTIME-01: Referenced key resolves in ar
  it('I18N-RUNTIME-01: Referenced key resolves in ar', () => {
    for (const key of sampleValidKeys) {
      const resolved = resolveTranslation(key, 'ar');
      expect(resolved).toBeDefined();
      expect(resolved).not.toBe(key);
      expect(typeof resolved).toBe('string');
      expect(resolved.trim()).not.toBe('');
    }
  });

  // I18N-RUNTIME-02: Referenced key resolves in en
  it('I18N-RUNTIME-02: Referenced key resolves in en', () => {
    for (const key of sampleValidKeys) {
      const resolved = resolveTranslation(key, 'en');
      expect(resolved).toBeDefined();
      expect(resolved).not.toBe(key);
      expect(typeof resolved).toBe('string');
      expect(resolved.trim()).not.toBe('');
    }
  });

  // I18N-RUNTIME-03: Referenced key resolves in ur
  it('I18N-RUNTIME-03: Referenced key resolves in ur', () => {
    for (const key of sampleValidKeys) {
      const resolved = resolveTranslation(key, 'ur');
      expect(resolved).toBeDefined();
      expect(resolved).not.toBe(key);
      expect(typeof resolved).toBe('string');
      expect(resolved.trim()).not.toBe('');
    }
  });

  // I18N-RUNTIME-04: Missing key cannot silently render as an unintended production value
  it('I18N-RUNTIME-04: Missing key cannot silently render as an unintended production value', () => {
    const nonexistentKey = 'nonexistent.domain.fake_key_audit_test';
    const origWarn = console.warn;
    let warned = false;
    console.warn = () => { warned = true; };

    try {
      const result = resolveTranslation(nonexistentKey, 'ar');
      expect(result).toBe(nonexistentKey);
      if (process.env.NODE_ENV !== 'production') {
        expect(warned).toBe(true);
      }
    } finally {
      console.warn = origWarn;
    }
  });

  // I18N-RUNTIME-05: txt_* keys do not render literally when valid
  it('I18N-RUNTIME-05: txt_* keys do not render literally when valid', () => {
    expect(validTxtKeys.length).toBeGreaterThanOrEqual(40);
    for (const key of validTxtKeys) {
      const ar = resolveTranslation(key, 'ar');
      const en = resolveTranslation(key, 'en');
      const ur = resolveTranslation(key, 'ur');

      expect(ar).not.toBe(key);
      expect(en).not.toBe(key);
      expect(ur).not.toBe(key);
    }
  });

  // I18N-RUNTIME-06: Foundation fallback remains intact
  it('I18N-RUNTIME-06: Foundation fallback remains intact', () => {
    const mockDicts = {
      ar: { 'test.fallback.key': 'النص العربي الأساسي' },
      en: {},
      ur: {},
    } as any;

    const enFallback = resolveTranslation('test.fallback.key', 'en', undefined, mockDicts);
    expect(enFallback).toBe('النص العربي الأساسي');

    const urFallback = resolveTranslation('test.fallback.key', 'ur', undefined, mockDicts);
    expect(urFallback).toBe('النص العربي الأساسي');
  });

  // I18N-RUNTIME-07: Interpolation keys remain resolvable
  it('I18N-RUNTIME-07: Interpolation keys remain resolvable', () => {
    const interpolatedAr = resolveTranslation('example.count', 'ar', { count: 42 });
    expect(interpolatedAr).toContain('42');

    const interpolatedEn = resolveTranslation('example.count', 'en', { count: 99 });
    expect(interpolatedEn).toContain('99');

    const interpolatedUr = resolveTranslation('example.count', 'ur', { count: 123 });
    expect(interpolatedUr).toContain('123');
  });

  // I18N-RUNTIME-08: All referenced keys resolve in AR
  it('I18N-RUNTIME-08: All referenced keys resolve in AR', () => {
    const refKeys = getReferencedKeys();
    expect(refKeys.length).toBeGreaterThan(0);
    for (const key of refKeys) {
      const res = resolveTranslation(key, 'ar');
      expect(typeof res).toBe('string');
      expect(res.trim()).not.toBe('');
      expect(res).not.toBe(key);
    }
  });

  // I18N-RUNTIME-09: All referenced keys resolve in EN
  it('I18N-RUNTIME-09: All referenced keys resolve in EN', () => {
    const refKeys = getReferencedKeys();
    expect(refKeys.length).toBeGreaterThan(0);
    for (const key of refKeys) {
      const res = resolveTranslation(key, 'en');
      expect(typeof res).toBe('string');
      expect(res.trim()).not.toBe('');
      expect(res).not.toBe(key);
    }
  });

  // I18N-RUNTIME-10: All referenced keys resolve in UR
  it('I18N-RUNTIME-10: All referenced keys resolve in UR', () => {
    const refKeys = getReferencedKeys();
    expect(refKeys.length).toBeGreaterThan(0);
    for (const key of refKeys) {
      const res = resolveTranslation(key, 'ur');
      expect(typeof res).toBe('string');
      expect(res.trim()).not.toBe('');
      expect(res).not.toBe(key);
    }
  });

  // I18N-RUNTIME-11: No referenced key resolves to itself
  it('I18N-RUNTIME-11: No referenced key resolves to itself', () => {
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
    expect(selfResolving).toEqual([]);
  });

  // I18N-RUNTIME-12: All metadata-hook keys resolve
  it('I18N-RUNTIME-12: All metadata-hook keys resolve', () => {
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
    expect(hookKeys.size).toBeGreaterThan(0);
    for (const hk of hookKeys) {
      for (const loc of ['ar', 'en', 'ur'] as const) {
        const res = resolveTranslation(hk, loc);
        expect(res).toBeDefined();
        expect(res.trim()).not.toBe('');
        expect(res).not.toBe(hk);
      }
    }
  });

  // I18N-RUNTIME-13: Referenced language key sets are identical
  it('I18N-RUNTIME-13: Referenced language key sets are identical', () => {
    const refKeys = getReferencedKeys();
    for (const key of refKeys) {
      const inAr = key in dictionaries.ar;
      const inEn = key in dictionaries.en;
      const inUr = key in dictionaries.ur;
      expect(inAr).toBe(true);
      expect(inEn).toBe(true);
      expect(inUr).toBe(true);
    }
    // Also verify overall dictionary key parity
    const arKeys = Object.keys(dictionaries.ar).sort();
    const enKeys = Object.keys(dictionaries.en).sort();
    const urKeys = Object.keys(dictionaries.ur).sort();
    expect(arKeys.join(',')).toBe(enKeys.join(','));
    expect(arKeys.join(',')).toBe(urKeys.join(','));
  });

  // I18N-RUNTIME-14: Interpolation parity remains valid
  it('I18N-RUNTIME-14: Interpolation parity remains valid', () => {
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

      expect(arP).toEqual(enP);
      expect(arP).toEqual(urP);
    }
  });

  // I18N-RUNTIME-15: Protected tokens remain valid
  it('I18N-RUNTIME-15: Protected tokens remain valid', () => {
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

        if (inAr) {
          expect(inEn).toBe(true);
          expect(inUr).toBe(true);
        }
      }
    }
  });

  // I18N-RUNTIME-16: No duplicate locale keys
  it('I18N-RUNTIME-16: No duplicate locale keys', () => {
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
      expect(dups).toEqual([]);
    }
  });
});
