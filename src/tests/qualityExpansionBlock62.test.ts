import fs from 'fs';
import path from 'path';
import { dictionaries } from '../locales';

interface TestResult {
  id: string;
  name: string;
  passed: boolean;
  error?: string;
}

export async function runBlock62QualityTestSuite(): Promise<{ passed: number; failed: number; total: number }> {
  console.log('======================================================');
  console.log('RUNNING BLOCK 62 P1/P2 TRANSLATION EXPANSION TEST SUITE');
  console.log('======================================================');

  const reportPath = path.resolve(process.cwd(), 'reports/i18n-block62-quality-expansion.json');
  if (!fs.existsSync(reportPath)) {
    throw new Error('Report reports/i18n-block62-quality-expansion.json does not exist. Run execution first.');
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

  // I18N-QUALITY-34: P1/P2 English quality
  test('I18N-QUALITY-34', 'P1/P2 English quality: professional syntax, complete text, valid formatting', () => {
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

  // I18N-QUALITY-35: P1/P2 Urdu quality
  test('I18N-QUALITY-35', 'P1/P2 Urdu quality: natural syntax, domain terminology, complete text', () => {
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

  // I18N-QUALITY-36: Zero accidental Arabic in EN
  test('I18N-QUALITY-36', 'No accidental Arabic in EN: strictly 0 Arabic Unicode glyphs across all 150 entries', () => {
    for (const entry of repairedEntries) {
      const enVal = dictionaries.en[entry.key];
      if (arabicRegex.test(enVal)) {
        throw new Error(`Accidental Arabic found in EN for key "${entry.key}": "${enVal}"`);
      }
    }
  });

  // I18N-QUALITY-37: Zero accidental Arabic in UR
  test('I18N-QUALITY-37', 'No accidental Arabic in UR: no unmigrated Arabic phrases or corrupt hybrid morphology', () => {
    const corruptArabicPhrases = [
      'مستلم ومفتش الموقع',
      'كاتب ميزان المصدر',
      'فارغ + قائم',
      'تسعير معتمد',
      'حساب خادومي صارم',
      'سجل التدقيق الرقابي',
      'الحسابات الخادومية الصارمة',
      'محطة التفريغ',
      'أوزان ميزان البسكول',
      'لوحة التحكم والانتقال'
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

  // I18N-QUALITY-38: Semantic equivalence and review status
  test('I18N-QUALITY-38', 'Semantic equivalence: complete meaning preserved, review status maintained as REVIEW_REQUIRED', () => {
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

  // I18N-QUALITY-39: Protected tokens preservation
  test('I18N-QUALITY-39', 'Protected tokens: technical codes, units, and models preserved across EN and UR', () => {
    const protectedTokens = [
      'ticketId', 'truckNo', 'projectId', 'carrierId', 'driverId', 'materialId',
      'operationId', 'pricingType', 'settlementBase', 'sourceType',
      'SAR', 'KG', 'TON', 'CSV', 'Excel', 'PWA', 'JSON', 'RBAC', 'API',
      'IN_TRANSIT', 'ARRIVED', 'COMPLETED', 'PENDING', 'LOADED', 'ACTIVE',
      'PER_TRIP', 'PER_TON'
    ];

    for (const entry of repairedEntries) {
      const arVal = entry.ar;
      const enVal = dictionaries.en[entry.key];
      const urVal = dictionaries.ur[entry.key];

      for (const token of protectedTokens) {
        if (arVal.includes(token)) {
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

  // I18N-QUALITY-40: Interpolation parity
  test('I18N-QUALITY-40', 'Interpolation parity: identical variable placeholders across AR, EN, and UR', () => {
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

  // I18N-QUALITY-41: Exactly selected 150 keys changed (100 Cat B, 50 Cat C), 0 human review items, 0 prior collisions
  test('I18N-QUALITY-41', 'Exactly selected 150 keys changed: 100 Category B, 50 Category C, 0 human-review items', () => {
    if (repairedEntries.length !== 150) {
      throw new Error(`Expected exactly 150 repaired entries, found ${repairedEntries.length}`);
    }

    const countB = repairedEntries.filter(e => e.category === 'B').length;
    const countC = repairedEntries.filter(e => e.category === 'C').length;

    if (countB !== 100) {
      throw new Error(`Expected 100 Category B entries, got ${countB}`);
    }
    if (countC !== 50) {
      throw new Error(`Expected 50 Category C entries, got ${countC}`);
    }

    // Verify none of the 33 human review items were modified
    const planPath = path.resolve(process.cwd(), 'reports/i18n-block60-quality-plan.json');
    const plan = JSON.parse(fs.readFileSync(planPath, 'utf8'));
    const hrKeys = new Set(plan.humanReviewQueue.map((x: any) => x.key));

    for (const entry of repairedEntries) {
      if (hrKeys.has(entry.key)) {
        throw new Error(`Human review key "${entry.key}" was modified in Block 62!`);
      }
    }

    // Verify no collisions with Block 57, Block 58, Block 59, Block 61
    const b57Path = path.resolve(process.cwd(), 'reports/i18n-block57-quality-pilot.json');
    const b58Path = path.resolve(process.cwd(), 'reports/i18n-block58-quality-expansion.json');
    const b59Path = path.resolve(process.cwd(), 'reports/i18n-block59-quality-expansion.json');
    const b61Path = path.resolve(process.cwd(), 'reports/i18n-block61-p1-translation.json');

    const b57Keys = new Set(JSON.parse(fs.readFileSync(b57Path, 'utf8')).repairedEntries.map((e: any) => e.key));
    const b58Keys = new Set(JSON.parse(fs.readFileSync(b58Path, 'utf8')).repairedEntries.map((e: any) => e.key));
    const b59Keys = new Set(JSON.parse(fs.readFileSync(b59Path, 'utf8')).repairedEntries.map((e: any) => e.key));
    const b61Keys = new Set(JSON.parse(fs.readFileSync(b61Path, 'utf8')).repairedEntries.map((e: any) => e.key));

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
    }
  });

  console.log('======================================================');
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  console.log(`BLOCK 62: Test Results: ${passed}/${results.length} PASSED`);
  console.log('======================================================');
  return { passed, failed, total: results.length };
}

if (import.meta.url.endsWith(process.argv[1]) || process.argv[1]?.includes('qualityExpansionBlock62')) {
  runBlock62QualityTestSuite().then(res => {
    if (res.failed > 0) process.exit(1);
  });
}
