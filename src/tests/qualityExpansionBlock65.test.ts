import fs from 'fs';
import path from 'path';
import { dictionaries } from '../locales';

interface TestResult {
  id: string;
  name: string;
  passed: boolean;
  error?: string;
}

export async function runBlock65QualityTestSuite(): Promise<{ passed: number; failed: number; total: number }> {
  console.log('======================================================');
  console.log('RUNNING BLOCK 65 P3/P4 TRANSLATION EXPANSION TEST SUITE');
  console.log('======================================================');

  const reportPath = path.resolve(process.cwd(), 'reports/i18n-block65-quality-expansion.json');
  if (!fs.existsSync(reportPath)) {
    throw new Error('Report reports/i18n-block65-quality-expansion.json does not exist. Run execution first.');
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

  // I18N-QUALITY-58: Professional English
  test('I18N-QUALITY-58', 'Professional English: complete text, valid formatting, no artificial tags or Arabic fallback', () => {
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

  // I18N-QUALITY-59: Professional Urdu
  test('I18N-QUALITY-59', 'Professional Urdu: natural syntax, domain terminology, complete text, no artificial tags', () => {
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

  // I18N-QUALITY-60: No unintended Arabic in EN
  test('I18N-QUALITY-60', 'No unintended Arabic in EN: strictly 0 Arabic Unicode glyphs across all 150 entries', () => {
    for (const entry of repairedEntries) {
      const enVal = dictionaries.en[entry.key];
      if (arabicRegex.test(enVal)) {
        throw new Error(`Accidental Arabic found in EN for key "${entry.key}": "${enVal}"`);
      }
    }
  });

  // I18N-QUALITY-61: No unintended Arabic in UR
  test('I18N-QUALITY-61', 'No unintended Arabic in UR: no unmigrated Arabic phrases or corrupt hybrid morphology', () => {
    const corruptArabicPhrases = [
      'المجلد الجذري للمشروع',
      'إسقاط متزامن للعرض والمراجعة',
      'اعتماد آمن',
      'مخاطر حرجة',
      'فحص التطابق التام',
      'الناقل غير معتمد',
      'رفض أمني',
      'التحقق الفوري',
      'المصدر غير معدل',
      'بها أخطاء مانعة',
      'تعارضات حسابية',
      'لوحة جديدة',
      'غير مقيد',
      'إجمالي الأسطر',
      'مقترحات للمراجعة'
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

  // I18N-QUALITY-62: Semantic equivalence
  test('I18N-QUALITY-62', 'Semantic equivalence: complete meaning preserved, review status maintained as REVIEW_REQUIRED', () => {
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

  // I18N-QUALITY-63: Protected tokens
  test('I18N-QUALITY-63', 'Protected tokens: technical codes, units, and models preserved across EN and UR', () => {
    const protectedTokens = [
      'tripId', 'Google Drive', 'Google Sheets', 'Firestore', 'Source of Truth',
      'SSOT', 'Zero-Trust ABAC', 'RBAC', 'FSM', 'LM-01', 'LM-50', 'LEGACY_UNRESOLVED',
      'Audit Log', 'FUZZY', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'BLOCKING',
      'OPEN', 'REJECTED', 'REVIEW', 'RESOLVED', 'KG', 'TON'
    ];

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

  // I18N-QUALITY-64: Interpolation parity
  test('I18N-QUALITY-64', 'Interpolation parity: identical variable placeholders across AR, EN, and UR', () => {
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

  // I18N-QUALITY-65: Exact selected-key boundary
  test('I18N-QUALITY-65', 'Exact selected-key boundary: exactly 112 Category B, 38 Category C, 0 human-review items', () => {
    if (repairedEntries.length !== 150) {
      throw new Error(`Expected exactly 150 repaired entries, found ${repairedEntries.length}`);
    }

    const countB = repairedEntries.filter(e => e.category === 'B').length;
    const countC = repairedEntries.filter(e => e.category === 'C').length;

    if (countB !== 112) {
      throw new Error(`Expected 112 Category B entries, got ${countB}`);
    }
    if (countC !== 38) {
      throw new Error(`Expected 38 Category C entries, got ${countC}`);
    }

    // Verify none of the 33 human review items were modified
    const planPath = path.resolve(process.cwd(), 'reports/i18n-block60-quality-plan.json');
    const plan = JSON.parse(fs.readFileSync(planPath, 'utf8'));
    const hrKeys = new Set(plan.humanReviewQueue.map((x: any) => x.key));

    for (const entry of repairedEntries) {
      if (hrKeys.has(entry.key)) {
        throw new Error(`Human review key "${entry.key}" was modified in Block 65!`);
      }
    }

    // Verify no collisions with Block 57, Block 58, Block 59, Block 61, Block 62, Block 63, Block 64
    const b57Path = path.resolve(process.cwd(), 'reports/i18n-block57-quality-pilot.json');
    const b58Path = path.resolve(process.cwd(), 'reports/i18n-block58-quality-expansion.json');
    const b59Path = path.resolve(process.cwd(), 'reports/i18n-block59-quality-expansion.json');
    const b61Path = path.resolve(process.cwd(), 'reports/i18n-block61-p1-translation.json');
    const b62Path = path.resolve(process.cwd(), 'reports/i18n-block62-quality-expansion.json');
    const b63Path = path.resolve(process.cwd(), 'reports/i18n-block63-quality-expansion.json');
    const b64Path = path.resolve(process.cwd(), 'reports/i18n-block64-quality-expansion.json');

    const b57Keys = new Set(JSON.parse(fs.readFileSync(b57Path, 'utf8')).repairedEntries.map((e: any) => e.key));
    const b58Keys = new Set(JSON.parse(fs.readFileSync(b58Path, 'utf8')).repairedEntries.map((e: any) => e.key));
    const b59Keys = new Set(JSON.parse(fs.readFileSync(b59Path, 'utf8')).repairedEntries.map((e: any) => e.key));
    const b61Keys = new Set(JSON.parse(fs.readFileSync(b61Path, 'utf8')).repairedEntries.map((e: any) => e.key));
    const b62Keys = new Set(JSON.parse(fs.readFileSync(b62Path, 'utf8')).repairedEntries.map((e: any) => e.key));
    const b63Keys = new Set(JSON.parse(fs.readFileSync(b63Path, 'utf8')).repairedEntries.map((e: any) => e.key));
    const b64Keys = new Set(JSON.parse(fs.readFileSync(b64Path, 'utf8')).repairedEntries.map((e: any) => e.key));

    for (const entry of repairedEntries) {
      if (b57Keys.has(entry.key)) {
        throw new Error(`Key "${entry.key}" collides with Block 57 repairs!`);
      }
      if (b58Keys.has(entry.key)) {
        throw new Error(`Key "${entry.key}" collides with Block 58 repairs!`);
      }
      if (b59Keys.has(entry.key)) {
        throw new Error(`Key "${entry.key}" collides with Block 59 repairs!`);
      }
      if (b61Keys.has(entry.key)) {
        throw new Error(`Key "${entry.key}" collides with Block 61 repairs!`);
      }
      if (b62Keys.has(entry.key)) {
        throw new Error(`Key "${entry.key}" collides with Block 62 repairs!`);
      }
      if (b63Keys.has(entry.key)) {
        throw new Error(`Key "${entry.key}" collides with Block 63 repairs!`);
      }
      if (b64Keys.has(entry.key)) {
        throw new Error(`Key "${entry.key}" collides with Block 64 repairs!`);
      }
    }
  });

  console.log('======================================================');
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  console.log(`BLOCK 65: Test Results: ${passed}/${results.length} PASSED`);
  console.log('======================================================');
  return { passed, failed, total: results.length };
}

if (import.meta.url.endsWith(process.argv[1]) || process.argv[1]?.includes('qualityExpansionBlock65')) {
  runBlock65QualityTestSuite().then(res => {
    if (res.failed > 0) process.exit(1);
  });
}
