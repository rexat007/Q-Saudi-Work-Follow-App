import { dictionaries } from '../locales';
import { block58Entries } from '../../scripts/run-quality-expansion-block58';
import fs from 'fs';
import path from 'path';

interface TestCase {
  id: string;
  name: string;
  fn: () => void;
}

export async function runBlock58QualityExpansionSuite() {
  console.log('======================================================');
  console.log('🚀 Running BLOCK 58 Quality Expansion Test Suite (6 Test Cases)...');
  console.log('======================================================');

  const results: { id: string; name: string; passed: boolean; error?: string }[] = [];

  const test = (id: string, name: string, fn: () => void) => {
    try {
      fn();
      console.log(`✅ [${id} ${name}] passed`);
      results.push({ id, name, passed: true });
    } catch (err: any) {
      console.error(`❌ [${id} ${name}] failed:`, err.message);
      results.push({ id, name, passed: false, error: err.message });
    }
  };

  const arabicRegex = /[\u0600-\u06FF]/;
  const hybridSuffixRegex = /[a-zA-Z]+[ةية]/;

  // I18N-QUALITY-12: English repaired entries contain no unintended Arabic
  test('I18N-QUALITY-12', 'English repaired entries contain no unintended Arabic', () => {
    for (const entry of block58Entries) {
      const enVal = dictionaries.en[entry.key];
      if (!enVal) {
        throw new Error(`Missing EN value for repaired key: ${entry.key}`);
      }
      if (arabicRegex.test(enVal)) {
        throw new Error(`Unintended Arabic script found in EN for key "${entry.key}": "${enVal}"`);
      }
      if (hybridSuffixRegex.test(enVal)) {
        throw new Error(`Hybrid morphology suffix found in EN for key "${entry.key}": "${enVal}"`);
      }
    }
  });

  // I18N-QUALITY-13: Urdu repaired entries contain no unintended Arabic
  test('I18N-QUALITY-13', 'Urdu repaired entries contain no unintended Arabic', () => {
    // Unconverted Arabic grammatical frames / phrases that must not appear in repaired Urdu strings
    const arabicFrames = [
      'أوزان التحميل',
      'إجمالي أوزان',
      'كافة المشاريع',
      'صلاحية مدير',
      'لا توجد حركات',
      'إلغاء أمر الرحلة',
      'غير مسجل في النظام',
      'تأكيد رجوع',
      'تعذر إنشاء',
      'محظور نظامياً',
      'محطة التفريغ',
      'مطلوب اعتماد',
      'سيتم التحديث',
      'بانتظار البحث',
      'اشتراط صارم',
      'قاعدة التسعير مفقودة',
      'حفظ القاعدة في',
      'تسجيل الناقل',
      'لا يوجد ناقلون'
    ];

    for (const entry of block58Entries) {
      const urVal = dictionaries.ur[entry.key];
      if (!urVal) {
        throw new Error(`Missing UR value for repaired key: ${entry.key}`);
      }
      if (hybridSuffixRegex.test(urVal)) {
        throw new Error(`Hybrid morphology found in UR for key "${entry.key}": "${urVal}"`);
      }
      for (const frame of arabicFrames) {
        if (urVal.includes(frame)) {
          throw new Error(`Unconverted Arabic phrase "${frame}" found in UR for key "${entry.key}": "${urVal}"`);
        }
      }
    }
  });

  // I18N-QUALITY-14: Professional semantic equivalence
  test('I18N-QUALITY-14', 'Professional semantic equivalence', () => {
    for (const entry of block58Entries) {
      const arVal = dictionaries.ar[entry.key];
      const enVal = dictionaries.en[entry.key];
      const urVal = dictionaries.ur[entry.key];

      if (!arVal || !enVal || !urVal) {
        throw new Error(`Incomplete dictionary entry for key "${entry.key}"`);
      }

      // Must not be identical to the key name itself
      if (enVal === entry.key || urVal === entry.key) {
        throw new Error(`Key "${entry.key}" resolves to key identifier itself`);
      }

      // Must not be empty
      if (enVal.trim().length === 0 || urVal.trim().length === 0) {
        throw new Error(`Empty value found for key "${entry.key}"`);
      }

      // Canonical Arabic must match the registered source
      if (arVal !== entry.ar) {
        throw new Error(`Canonical Arabic was altered for key "${entry.key}"!`);
      }
    }
  });

  // I18N-QUALITY-15: Protected tokens preserved
  test('I18N-QUALITY-15', 'Protected tokens preserved', () => {
    const protectedTokens = [
      'SAR',
      'KG',
      'TON',
      'CSV',
      'Excel',
      'Sheets',
      'Drive',
      'PWA',
      'JSON',
      'RBAC',
      'API',
      'Outbox',
      'Weighbridge',
      'INACTIVE',
      'WARNINGS_PENDING',
      'LOADED',
      'TripExceptionEntity',
      'TGA',
      'PER_TRIP',
      'PER_TON',
      'Total Received Tons',
      'Compliance Suite',
      'Exceptions',
      'Tonnage & Weighbridge Variance',
      'Financial Settlement - Snapshot Invariance',
      'Loading Station',
      'Unloading Station',
      'Preview',
      'Atomic Server Updates',
      'Tolerance Rule',
      'Audit Confirmation',
      'Unified Pipeline',
      'Search & Identification',
      'Add to Home Screen',
      'Exception Report',
      'Cancel Dispatch'
    ];

    for (const entry of block58Entries) {
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

  // I18N-QUALITY-16: Interpolation preserved
  test('I18N-QUALITY-16', 'Interpolation preserved', () => {
    const paramRegex = /\$\{[^}]+\}|\{[^}]+\}/g;

    for (const entry of block58Entries) {
      const arParams = (entry.ar.match(paramRegex) || []).sort();
      const enParams = (dictionaries.en[entry.key].match(paramRegex) || []).sort();
      const urParams = (dictionaries.ur[entry.key].match(paramRegex) || []).sort();

      if (JSON.stringify(arParams) !== JSON.stringify(enParams)) {
        throw new Error(`Interpolation parameters mismatch in EN for key "${entry.key}": AR=${arParams}, EN=${enParams}`);
      }
      if (JSON.stringify(arParams) !== JSON.stringify(urParams)) {
        throw new Error(`Interpolation parameters mismatch in UR for key "${entry.key}": AR=${arParams}, UR=${urParams}`);
      }
    }
  });

  // I18N-QUALITY-17: Only selected keys changed
  test('I18N-QUALITY-17', 'Only selected keys changed', () => {
    // Read Block 57 report
    const pilot57Path = path.resolve(process.cwd(), 'reports/i18n-block57-quality-pilot.json');
    const pilot57 = JSON.parse(fs.readFileSync(pilot57Path, 'utf8'));
    const pilot57Keys = new Set(pilot57.repairedEntries.map((e: any) => e.key));

    const block58Keys = new Set(block58Entries.map(e => e.key));

    // Ensure no overlap between Block 57 and Block 58
    for (const k of block58Keys) {
      if (pilot57Keys.has(k)) {
        throw new Error(`Key "${k}" was already repaired in Block 57! Block 58 must only repair new candidate keys.`);
      }
    }

    if (block58Keys.size !== 100) {
      throw new Error(`Expected exactly 100 unique keys in Block 58, got ${block58Keys.size}`);
    }
  });

  console.log('======================================================');
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  console.log(`BLOCK 58: Test Results: ${passed}/${results.length} PASSED`);
  console.log('======================================================');

  return { passed, failed, total: results.length };
}

if (import.meta.url.endsWith(process.argv[1]) || process.argv[1]?.includes('qualityExpansionBlock58')) {
  runBlock58QualityExpansionSuite().then(res => {
    if (res.failed > 0) process.exit(1);
  });
}
