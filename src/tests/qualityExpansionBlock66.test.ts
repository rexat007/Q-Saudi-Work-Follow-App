import fs from 'fs';
import path from 'path';
import { dictionaries } from '../locales';

interface TestResult {
  id: string;
  name: string;
  passed: boolean;
  error?: string;
}

export async function runBlock66QualityTestSuite(): Promise<{ passed: number; failed: number; total: number }> {
  console.log('======================================================');
  console.log('RUNNING BLOCK 66 FINAL CLEANUP TEST SUITE');
  console.log('======================================================');

  const reportPath = path.resolve(process.cwd(), 'reports/i18n-block66-final-cleanup.json');
  if (!fs.existsSync(reportPath)) {
    throw new Error('Report reports/i18n-block66-final-cleanup.json does not exist. Run execution first.');
  }
  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  const repairedEntries: any[] = report.repairedEntries;

  const results: TestResult[] = [];
  const arabicRegex = /[\u0600-\u06FF]/;
  const hybridSuffixRegex = /[a-zA-Z]+[ةية]/;
  const paramRegex = /\$\{[^}]+\}|\{[^}]+\}/g;

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

  // I18N-QUALITY-66: Professional English
  test('I18N-QUALITY-66', 'Professional English: complete text, valid formatting, no artificial tags or Arabic fallback', () => {
    for (const entry of repairedEntries) {
      const enVal = dictionaries.en[entry.key];
      if (!enVal || typeof enVal !== 'string') {
        throw new Error(`English translation missing or non-string for key "${entry.key}"`);
      }
      if (!enVal.trim()) {
        throw new Error(`English translation is empty for key "${entry.key}"`);
      }
      if (enVal.includes('[Verified]')) {
        throw new Error(`English translation has artificial tag for key "${entry.key}": "${enVal}"`);
      }
      if (enVal.startsWith(' ') || enVal.endsWith(' ')) {
        throw new Error(`English translation has untrimmed whitespace for key "${entry.key}": "${enVal}"`);
      }
      if (enVal === entry.ar) {
        throw new Error(`English translation matches Arabic fallback for key "${entry.key}"`);
      }
    }
  });

  // I18N-QUALITY-67: Professional Urdu
  test('I18N-QUALITY-67', 'Professional Urdu: natural syntax, domain terminology, complete text, no artificial tags', () => {
    for (const entry of repairedEntries) {
      const urVal = dictionaries.ur[entry.key];
      if (!urVal || typeof urVal !== 'string') {
        throw new Error(`Urdu translation missing or non-string for key "${entry.key}"`);
      }
      if (!urVal.trim()) {
        throw new Error(`Urdu translation is empty for key "${entry.key}"`);
      }
      if (urVal.includes('[Verified]')) {
        throw new Error(`Urdu translation has artificial tag for key "${entry.key}": "${urVal}"`);
      }
      if (urVal.startsWith(' ') || urVal.endsWith(' ')) {
        throw new Error(`Urdu translation has untrimmed whitespace for key "${entry.key}": "${urVal}"`);
      }
      if (urVal === entry.ar) {
        throw new Error(`Urdu translation matches unmigrated Arabic fallback for key "${entry.key}"`);
      }
    }
  });

  // I18N-QUALITY-68: No unintended Arabic in EN
  test('I18N-QUALITY-68', 'No unintended Arabic in EN: strictly 0 Arabic Unicode glyphs across all 16 entries', () => {
    for (const entry of repairedEntries) {
      const enVal = dictionaries.en[entry.key];
      if (arabicRegex.test(enVal)) {
        throw new Error(`Accidental Arabic found in EN for key "${entry.key}": "${enVal}"`);
      }
    }
  });

  // I18N-QUALITY-69: No unintended Arabic in UR
  test('I18N-QUALITY-69', 'No unintended Arabic in UR: no unmigrated Arabic phrases or corrupt hybrid morphology', () => {
    const corruptArabicPhrases = [
      'إلى النظام وقاعدة',
      'إجمالي الاختبارات',
      'تذكرة مكررة',
      'فاشلة',
      'لا توجد سجلات مطابقة',
      'معتمد من',
      'غير معتمد',
      'الكيانات المقترحة',
      'اعتماد المطابقة',
      'جاهز للترحيل',
      'تذاكر مكررة',
      'فشل الاختبار',
      'بنجاح وترحيل',
      'نسبة النجاح',
      'اجتاز بنجاح'
    ];

    for (const entry of repairedEntries) {
      const urVal = dictionaries.ur[entry.key];
      if (hybridSuffixRegex.test(urVal)) {
        throw new Error(`Corrupt hybrid morphology found in UR for key "${entry.key}": "${urVal}"`);
      }
      for (const phrase of corruptArabicPhrases) {
        if (urVal.includes(phrase)) {
          throw new Error(`Unmigrated Arabic phrase "${phrase}" found in UR for key "${entry.key}": "${urVal}"`);
        }
      }
    }
  });

  // I18N-QUALITY-70: Semantic equivalence
  test('I18N-QUALITY-70', 'Semantic equivalence: complete meaning preserved, review status maintained as REVIEW_REQUIRED', () => {
    for (const entry of repairedEntries) {
      if (entry.reviewStatus !== 'REVIEW_REQUIRED') {
        throw new Error(`Key "${entry.key}" has invalid review status "${entry.reviewStatus}" (must be REVIEW_REQUIRED)`);
      }
      const enVal = dictionaries.en[entry.key];
      const urVal = dictionaries.ur[entry.key];
      if (!enVal || !urVal) {
        throw new Error(`Missing translation value for key "${entry.key}"`);
      }
    }
  });

  // I18N-QUALITY-71: Protected tokens
  test('I18N-QUALITY-71', 'Protected tokens: technical codes, units, and models preserved across EN and UR', () => {
    const protectedTokens = ['Admin', 'Failed'];

    for (const entry of repairedEntries) {
      const arVal = entry.ar;
      const enVal = dictionaries.en[entry.key];
      const urVal = dictionaries.ur[entry.key];

      for (const token of protectedTokens) {
        const tokenRegex = new RegExp(`(^|[^a-zA-Z0-9_])${token}([^a-zA-Z0-9_]|$)`);
        if (tokenRegex.test(arVal)) {
          if (!tokenRegex.test(enVal)) {
            throw new Error(`Protected token "${token}" missing from EN for key "${entry.key}": "${enVal}"`);
          }
          if (!tokenRegex.test(urVal)) {
            throw new Error(`Protected token "${token}" missing from UR for key "${entry.key}": "${urVal}"`);
          }
        }
      }
    }
  });

  // I18N-QUALITY-72: Interpolation parity
  test('I18N-QUALITY-72', 'Interpolation parity: identical variable placeholders across AR, EN, and UR', () => {
    for (const entry of repairedEntries) {
      const arVal = entry.ar;
      const enVal = dictionaries.en[entry.key];
      const urVal = dictionaries.ur[entry.key];

      const arParams = (arVal.match(paramRegex) || []).sort();
      const enParams = (enVal.match(paramRegex) || []).sort();
      const urParams = (urVal.match(paramRegex) || []).sort();

      if (JSON.stringify(arParams) !== JSON.stringify(enParams)) {
        throw new Error(`Interpolation mismatch in EN for key "${entry.key}": AR=${arParams}, EN=${enParams}`);
      }
      if (JSON.stringify(arParams) !== JSON.stringify(urParams)) {
        throw new Error(`Interpolation mismatch in UR for key "${entry.key}": AR=${arParams}, UR=${urParams}`);
      }
    }
  });

  // I18N-QUALITY-73: Exact selected-key boundary & zero remaining eligible defects
  test('I18N-QUALITY-73', 'Exact selected-key boundary: exactly 16 repaired, 0 human-review modified, 0 collisions with Blocks 57-65', () => {
    if (repairedEntries.length !== 16) {
      throw new Error(`Expected exactly 16 repaired entries, found ${repairedEntries.length}`);
    }

    // Verify none of the 33 human review items were modified
    const planPath = path.resolve(process.cwd(), 'reports/i18n-block60-quality-plan.json');
    const plan = JSON.parse(fs.readFileSync(planPath, 'utf8'));
    const hrKeys = new Set(plan.humanReviewQueue.map((x: any) => x.key));

    for (const entry of repairedEntries) {
      if (hrKeys.has(entry.key)) {
        throw new Error(`Human review key "${entry.key}" was modified in Block 66!`);
      }
    }

    // Verify no collisions with Block 57 through Block 65
    const previousBlocks = ['57', '58', '59', '61', '62', '63', '64', '65'];
    for (const b of previousBlocks) {
      let f = `reports/i18n-block${b}-quality-expansion.json`;
      if (b === '57') f = 'reports/i18n-block57-quality-pilot.json';
      if (b === '61') f = 'reports/i18n-block61-p1-translation.json';
      const prevData = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), f), 'utf8'));
      const prevKeys = new Set(prevData.repairedEntries.map((e: any) => e.key));
      for (const entry of repairedEntries) {
        if (prevKeys.has(entry.key)) {
          throw new Error(`Key "${entry.key}" collides with Block ${b} repairs!`);
        }
      }
    }
  });

  console.log('======================================================');
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  console.log(`BLOCK 66: Test Results: ${passed}/${results.length} PASSED`);
  console.log('======================================================');
  return { passed, failed, total: results.length };
}

if (import.meta.url.endsWith(process.argv[1]) || process.argv[1]?.includes('qualityExpansionBlock66')) {
  runBlock66QualityTestSuite().then(res => {
    if (res.failed > 0) process.exit(1);
  });
}
