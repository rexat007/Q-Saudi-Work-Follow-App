import fs from 'fs';
import path from 'path';
import { dictionaries } from '../locales';
import { block59Entries } from '../../scripts/run-quality-expansion-block59';

interface TestResult {
  id: string;
  name: string;
  passed: boolean;
  error?: string;
}

export async function runBlock59QualityExpansionSuite(): Promise<{ passed: number; failed: number; total: number }> {
  console.log('======================================================');
  console.log('RUNNING BLOCK 59 QUALITY EXPANSION TEST SUITE');
  console.log('======================================================');

  const results: TestResult[] = [];
  const arabicRegex = /[\u0600-\u06FF]/;
  const hybridSuffixRegex = /[a-zA-Z]+[ةية]/;

  function test(id: string, name: string, fn: () => void) {
    try {
      fn();
      results.push({ id, name, passed: true });
      console.log(`  ✅ [PASS] ${id}: ${name}`);
    } catch (err: any) {
      results.push({ id, name, passed: false, error: err.message });
      console.error(`  ❌ [FAIL] ${id}: ${name} -> ${err.message}`);
    }
  }

  // I18N-QUALITY-18: Exactly 150 entries repaired in Block 59 (100 Cat C + 50 Cat B)
  test('I18N-QUALITY-18', 'Exactly 150 entries repaired (100 Category C + 50 Category B)', () => {
    if (block59Entries.length !== 150) {
      throw new Error(`Expected 150 entries in Block 59, got ${block59Entries.length}`);
    }
    const catC = block59Entries.filter(e => e.category === 'C');
    const catB = block59Entries.filter(e => e.category === 'B');
    if (catC.length !== 100) {
      throw new Error(`Expected 100 Category C entries, got ${catC.length}`);
    }
    if (catB.length !== 50) {
      throw new Error(`Expected 50 Category B entries, got ${catB.length}`);
    }
    // Verify priority domain constraint
    const priorityDomains = new Set([
      'dashboard', 'trips', 'loading', 'unloading', 'weighbridge', 'projects', 'offline', 'shared'
    ]);
    for (const e of block59Entries) {
      if (!priorityDomains.has(e.domain)) {
        throw new Error(`Entry "${e.key}" has non-priority domain "${e.domain}"`);
      }
    }
  });

  // I18N-QUALITY-19: English repaired entries contain zero Arabic characters
  test('I18N-QUALITY-19', 'English repaired entries contain zero Arabic characters', () => {
    for (const entry of block59Entries) {
      const enVal = dictionaries.en[entry.key];
      if (arabicRegex.test(enVal)) {
        throw new Error(`Unintended Arabic script found in EN for key "${entry.key}": "${enVal}"`);
      }
      if (hybridSuffixRegex.test(enVal)) {
        throw new Error(`Hybrid morphology found in EN for key "${entry.key}": "${enVal}"`);
      }
      if (!enVal.trim()) {
        throw new Error(`Empty value found in EN for key "${entry.key}"`);
      }
    }
  });

  // I18N-QUALITY-20: Urdu repaired entries contain natural syntax and no unconverted Arabic phrases
  test('I18N-QUALITY-20', 'Urdu repaired entries contain natural syntax and no unconverted Arabic phrases', () => {
    const unconvertedArabicPhrases = [
      'أوزان التحميل',
      'إجمالي أوزان',
      'إعادة Synchronization',
      'إظهار طريقة التسعير',
      'يُحظر المضي التلقائي',
      'تنبيه غامض',
      'قواعد Verification',
      'ساري وقت',
      'تم تعليق أو',
      'جاري تهيئة'
    ];

    for (const entry of block59Entries) {
      const urVal = dictionaries.ur[entry.key];
      if (!urVal.trim()) {
        throw new Error(`Empty value found in UR for key "${entry.key}"`);
      }
      if (hybridSuffixRegex.test(urVal)) {
        throw new Error(`Hybrid morphology found in UR for key "${entry.key}": "${urVal}"`);
      }
      for (const phrase of unconvertedArabicPhrases) {
        if (urVal.includes(phrase)) {
          throw new Error(`Unconverted Arabic phrase "${phrase}" found in UR for key "${entry.key}": "${urVal}"`);
        }
      }
    }
  });

  // I18N-QUALITY-21: Arabic source strictly unaltered
  test('I18N-QUALITY-21', 'Arabic source strictly unaltered', () => {
    for (const entry of block59Entries) {
      const arVal = dictionaries.ar[entry.key];
      if (arVal !== entry.ar) {
        throw new Error(`Canonical Arabic altered for key "${entry.key}": expected "${entry.ar}", got "${arVal}"`);
      }
    }
  });

  // I18N-QUALITY-22: Category C fallbacks completely replaced
  test('I18N-QUALITY-22', 'Category C fallbacks completely replaced with target language translations', () => {
    const catCEntries = block59Entries.filter(e => e.category === 'C');
    for (const entry of catCEntries) {
      const enVal = dictionaries.en[entry.key];
      const urVal = dictionaries.ur[entry.key];
      if (enVal === entry.ar) {
        throw new Error(`Category C fallback remains in EN for key "${entry.key}"`);
      }
      if (urVal === entry.ar) {
        throw new Error(`Category C fallback remains in UR for key "${entry.key}"`);
      }
      if (enVal === entry.key || urVal === entry.key) {
        throw new Error(`Key resolves to key identifier itself for "${entry.key}"`);
      }
    }
  });

  // I18N-QUALITY-23: Category B mixed-language defects eliminated
  test('I18N-QUALITY-23', 'Category B mixed-language defects eliminated from EN and UR', () => {
    const catBEntries = block59Entries.filter(e => e.category === 'B');
    for (const entry of catBEntries) {
      const enVal = dictionaries.en[entry.key];
      const urVal = dictionaries.ur[entry.key];
      if (arabicRegex.test(enVal)) {
        throw new Error(`Arabic script still present in Category B EN for key "${entry.key}": "${enVal}"`);
      }
      if (enVal === entry.oldEn) {
        throw new Error(`Category B EN translation was not updated for key "${entry.key}"`);
      }
      if (urVal === entry.oldUr) {
        throw new Error(`Category B UR translation was not updated for key "${entry.key}"`);
      }
    }
  });

  // I18N-QUALITY-24: Protected tokens preserved
  test('I18N-QUALITY-24', 'Protected tokens preserved in both EN and UR', () => {
    const protectedTokens = [
      'SAR', 'KG', 'TON', 'M3', 'TRIP', 'Idempotency', 'Anti-LWW', 'Upsert', 'Blind Append',
      'Google Drive', 'Google Sheets', 'Firestore', 'Google',
      'DUPLICATE_OPERATION', 'TRIP_ALREADY_COMPLETED', 'PRICING_CHANGED', 'INACTIVE',
      'RETURNED', 'RETURN_REQUESTED', 'DRAFT', 'COMPLETED',
      'truckId', 'tripId', 'PRJ-NEOM-001', 'settlementBase'
    ];

    for (const entry of block59Entries) {
      const enVal = dictionaries.en[entry.key];
      const urVal = dictionaries.ur[entry.key];
      for (const token of protectedTokens) {
        if (entry.ar.includes(token)) {
          if (!enVal.includes(token)) {
            throw new Error(`Protected token "${token}" missing from EN for key "${entry.key}": "${enVal}"`);
          }
          if (!urVal.includes(token)) {
            throw new Error(`Protected token "${token}" missing from UR for key "${entry.key}": "${urVal}"`);
          }
        }
      }
    }
  });

  // I18N-QUALITY-25: Interpolation parameters and unique non-colliding scope
  test('I18N-QUALITY-25', 'Interpolation preserved and no key collisions with Blocks 57/58', () => {
    const paramRegex = /\$\{[^}]+\}|\{[^}]+\}/g;
    for (const entry of block59Entries) {
      const arParams = (entry.ar.match(paramRegex) || []).sort();
      const enParams = (dictionaries.en[entry.key].match(paramRegex) || []).sort();
      const urParams = (dictionaries.ur[entry.key].match(paramRegex) || []).sort();
      if (JSON.stringify(arParams) !== JSON.stringify(enParams)) {
        throw new Error(`Interpolation mismatch in EN for key "${entry.key}": AR=${arParams}, EN=${enParams}`);
      }
      if (JSON.stringify(arParams) !== JSON.stringify(urParams)) {
        throw new Error(`Interpolation mismatch in UR for key "${entry.key}": AR=${arParams}, UR=${urParams}`);
      }
    }

    // No collision check
    const b57Path = path.resolve(process.cwd(), 'reports/i18n-block57-quality-pilot.json');
    const b58Path = path.resolve(process.cwd(), 'reports/i18n-block58-quality-expansion.json');
    const b57 = JSON.parse(fs.readFileSync(b57Path, 'utf8'));
    const b58 = JSON.parse(fs.readFileSync(b58Path, 'utf8'));

    const priorKeys = new Set([
      ...b57.repairedEntries.map((e: any) => e.key),
      ...b58.repairedEntries.map((e: any) => e.key)
    ]);

    for (const entry of block59Entries) {
      if (priorKeys.has(entry.key)) {
        throw new Error(`Key "${entry.key}" collides with earlier Block 57/58 repairs!`);
      }
    }
  });

  console.log('======================================================');
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  console.log(`BLOCK 59: Test Results: ${passed}/${results.length} PASSED`);
  console.log('======================================================');
  return { passed, failed, total: results.length };
}

if (import.meta.url.endsWith(process.argv[1]) || process.argv[1]?.includes('qualityExpansionBlock59')) {
  runBlock59QualityExpansionSuite().then(res => {
    if (res.failed > 0) process.exit(1);
  });
}
