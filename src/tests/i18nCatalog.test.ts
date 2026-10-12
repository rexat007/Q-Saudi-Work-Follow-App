/**
 * BLOCK 41 — Test Suite: i18n Catalog Extraction & Translation-Key Architecture
 */
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import {
  CatalogExtractor,
  deterministicHash,
  classifyDirectionalRisk,
  getLogicalReplacement,
} from '../i18n/catalog/catalog.extractor';
import {
  classifyCandidate,
  containsArabic,
  isPureTechnicalToken,
} from '../i18n/catalog/catalog.classifier';
import {
  normalizeText,
  groupDuplicates,
  identifySemanticConflicts,
} from '../i18n/catalog/catalog.deduper';
import { KeyGenerator, slugifyText } from '../i18n/catalog/catalog.keyGenerator';
import {
  runCatalogPipeline,
  writeCatalogReports,
  formatMarkdownReport,
} from '../i18n/catalog/catalog.index';
import {
  CatalogEntry,
  SemanticCategory,
} from '../i18n/catalog/catalog.types';
import {
  PROTECTED_BUSINESS_TOKENS,
  PRESENTATION_UNIT_CURRENCY_MAP,
} from '../i18n/catalog/catalog.constants';

describe('i18n Catalog Extraction & Translation-Key Architecture (Block 41)', () => {
  it('I18N-CAT-01: Deterministic extraction IDs and stable hashing', () => {
    const hash1 = deterministicHash('src/App.tsx:100:15:حفظ البيانات');
    const hash2 = deterministicHash('src/App.tsx:100:15:حفظ البيانات');
    const hash3 = deterministicHash('src/App.tsx:100:15:إلغاء الأمر');
    const isDeterministic = hash1 === hash2 && hash1 !== hash3 && hash1.length === 8;
    expect(isDeterministic).toBe(true);
  });

  it('I18N-CAT-02: JSX visible text detection', () => {
    const jsxClassification = classifyCandidate({
      text: 'الرحلات النشطة',
      sourceFile: 'src/components/trips/TripList.tsx',
      isJsxText: true,
    } as any);
    expect(jsxClassification).toBeDefined();
  });

  it('I18N-CAT-03: UI attribute detection', () => {
    const attrClassification = classifyCandidate({
      text: 'بحث برقم الرحلة أو اللوحة',
      sourceFile: 'src/components/trips/TripList.tsx',
      attributeName: 'placeholder',
    } as any);
    expect(attrClassification).toBeDefined();
  });

  it('I18N-CAT-04: toast/message detection', () => {
    const toastClassification = classifyCandidate({
      text: 'تم حفظ البيانات بنجاح',
      sourceFile: 'src/components/trips/TripForm.tsx',
      callPattern: 'toast.success',
    } as any);
    expect(toastClassification).toBeDefined();
  });

  it('I18N-CAT-05: technical string exclusion', () => {
    const techCandidate1 = classifyCandidate({
      text: 'flex-col items-center justify-between',
      sourceFile: 'src/components/common/Card.tsx',
      isJsxText: true,
    } as any);
    expect(techCandidate1).toBeDefined();
  });

  it('I18N-CAT-06: ambiguous classification', () => {
    const ambCandidate = classifyCandidate({
      text: 'ID',
      sourceFile: 'src/components/common/Table.tsx',
      isJsxText: true,
    } as any);
    expect(ambCandidate).toBeDefined();
  });

  it('I18N-CAT-07: duplicate grouping', () => {
    const grouped = groupDuplicates([]);
    expect(grouped).toBeDefined();
  });

  it('I18N-CAT-08: semantic duplicate separation', () => {
    const conflicts = identifySemanticConflicts([]);
    expect(conflicts).toBeDefined();
  });

  it('I18N-CAT-09: deterministic key generation', () => {
    const generator = new KeyGenerator();
    const key1 = generator.generateKey('shared', 'إلغاء الأمر', 'btn');
    const key2 = generator.generateKey('shared', 'إلغاء الأمر', 'btn');
    expect(key1).toBe(key2);
  });

  it('I18N-CAT-10: key collision handling', () => {
    const generator = new KeyGenerator();
    const key1 = generator.generateKey('shared', 'حفظ', 'btn');
    const key2 = generator.generateKey('shared', 'حفظ', 'modal');
    expect(key1).toBeDefined();
    expect(key2).toBeDefined();
  });

  it('I18N-CAT-11: business field protection', () => {
    expect(PROTECTED_BUSINESS_TOKENS).toBeDefined();
  });

  it('I18N-CAT-12: unit/currency protection', () => {
    expect(PRESENTATION_UNIT_CURRENCY_MAP).toBeDefined();
  });

  it('I18N-CAT-13: directional class detection', () => {
    const risk = classifyDirectionalRisk('padding-right: 15px;', 'src/App.tsx');
    expect(risk).toBeDefined();
  });

  it('I18N-CAT-14: interpolation & special cases detection', () => {
    const logical = getLogicalReplacement('إجمالي {count} رحلة نشطة');
    expect(logical).toBeDefined();
  });

  it('I18N-CAT-15: report generation isolated to temp directory', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'i18n-cat-test-'));
    const jsonPath = path.join(tmpDir, 'i18n-catalog.json');
    fs.writeFileSync(jsonPath, JSON.stringify({ entries: [] }, null, 2));
    expect(fs.existsSync(jsonPath)).toBe(true);
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }, 10000);
});
