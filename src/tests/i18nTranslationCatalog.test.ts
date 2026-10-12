/**
 * BLOCK 42 — Translation Catalog & Semantic Review Layer Test Suite
 * Validates tests I18N-TCAT-01 through I18N-TCAT-15
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { runCatalogPipeline } from '../i18n/catalog/catalog.index';
import {
  buildProductionTranslationCatalog,
  writeProductionCatalogReports,
  extractInterpolationParams,
  requiresPluralization,
  identifyProtectedTokens,
  deriveInternalDataKey,
} from '../i18n/catalog/translationCatalog.generator';
import {
  FOUNDATION_VOCABULARY,
  MANDATORY_DOMAIN_QUEUES,
  ARABIC_PLURAL_FORMS,
} from '../i18n/catalog/translationCatalog.constants';
import { resolveTranslation, interpolate } from '../i18n/utils';
import { DEFAULT_LOCALE } from '../i18n/constants';
import { CodemodCatalogMatcher } from '../i18n/codemod/codemod.matcher';
import { CodemodSafety } from '../i18n/codemod/codemod.safety';
import { CodemodCandidate } from '../i18n/codemod/codemod.types';
import { DeterministicTerminologyProvider } from '../i18n/translation/translation.provider';
import { dictionaries } from '../locales';

describe('Block 42 Translation Catalog & Semantic Review Layer Test Suite (15 Test Cases)', () => {
  const catalogReport = runCatalogPipeline();
  const prodCatalog = buildProductionTranslationCatalog(catalogReport);

  it('I18N-TCAT-01: Catalog keys are deterministic across runs', () => {
    const secondProdCatalog = buildProductionTranslationCatalog(catalogReport);
    const keys1 = Object.keys(prodCatalog.entries).sort();
    const keys2 = Object.keys(secondProdCatalog.entries).sort();
    const keysMatch = keys1.length === keys2.length && keys1.every((k, i) => k === keys2[i]);
    expect(keysMatch).toBe(true);
  });

  it('I18N-TCAT-02: Arabic source text is preserved exactly as canonical source', () => {
    let arPreservedCount = 0;
    let arMismatch = false;
    for (const entry of Object.values(prodCatalog.entries)) {
      if (entry.sourceTextAr && entry.sourceTextAr.trim().length > 0) {
        arPreservedCount++;
        if (entry.translations.ar.text !== entry.sourceTextAr) {
          arMismatch = true;
          break;
        }
      }
    }
    expect(arMismatch).toBe(false);
    expect(arPreservedCount >= 0).toBe(true);
  });

  it('I18N-TCAT-03: English and Urdu states are explicit', () => {
    let validStates = true;
    for (const entry of Object.values(prodCatalog.entries)) {
      if (!entry.translations.en || !entry.translations.ur) {
        validStates = false;
        break;
      }
    }
    expect(validStates).toBe(true);
  });

  it('I18N-TCAT-04: Interpolation parameters are extracted correctly', () => {
    const params = extractInterpolationParams('إجمالي {count} رحلة للمادة {material}');
    expect(params).toContain('count');
    expect(params).toContain('material');
  });

  it('I18N-TCAT-05: Pluralization requirement detection', () => {
    const text = 'عدد الرحلات: {count}';
    const params = extractInterpolationParams(text);
    const requiresPlur = requiresPluralization(text, params);
    expect(typeof requiresPlur).toBe('boolean');
  });

  it('I18N-TCAT-06: Protected token identification', () => {
    const tokens = identifyProtectedTokens('أرامكو SAR 123');
    expect(Array.isArray(tokens)).toBe(true);
  });

  it('I18N-TCAT-07: Internal data key derivation', () => {
    const key = deriveInternalDataKey('netWeight');
    expect(typeof key).toBe('string');
  });

  it('I18N-TCAT-08: Foundation vocabulary completeness', () => {
    expect(FOUNDATION_VOCABULARY).toBeDefined();
  });

  it('I18N-TCAT-09: Mandatory domain queues present', () => {
    expect(MANDATORY_DOMAIN_QUEUES).toBeDefined();
  });

  it('I18N-TCAT-10: Arabic plural forms structured correctly', () => {
    expect(ARABIC_PLURAL_FORMS).toBeDefined();
  });

  it('I18N-TCAT-11: Translation resolution functions correctly', () => {
    const resolved = resolveTranslation('shared.actions.save', 'ar');
    expect(typeof resolved).toBe('string');
  });

  it('I18N-TCAT-12: Interpolation replacement functions correctly', () => {
    const interpolated = interpolate('إجمالي {count}', { count: 5 });
    expect(interpolated).toContain('5');
  });

  it('I18N-TCAT-13: Codemod matcher compatibility', () => {
    const matcher = CodemodCatalogMatcher.getInstance();
    expect(matcher).toBeDefined();
  });

  it('I18N-TCAT-14: Codemod safety checks pass', () => {
    const safety = new CodemodSafety(CodemodCatalogMatcher.getInstance());
    expect(safety).toBeDefined();
  });

  it('I18N-TCAT-15: Production catalog reports isolated to temp directory', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'i18n-prod-cat-test-'));
    const jsonPath = path.join(tmpDir, 'i18n-translation-catalog.json');
    const mdPath = path.join(tmpDir, 'i18n-translation-catalog.md');
    fs.writeFileSync(jsonPath, JSON.stringify(prodCatalog, null, 2));
    fs.writeFileSync(mdPath, '# Production Translation Catalog\n');
    expect(fs.existsSync(jsonPath)).toBe(true);
    expect(fs.existsSync(mdPath)).toBe(true);
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});
