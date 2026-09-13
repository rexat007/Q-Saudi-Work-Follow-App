import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { arTranslations } from '../locales/ar';
import { enTranslations } from '../locales/en';
import { urTranslations } from '../locales/ur';

// Test runner helper
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function test(id: string, description: string, fn: () => void) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`PASS: [${id}] ${description}`);
  } catch (error: any) {
    failedTests++;
    console.error(`FAIL: [${id}] ${description}`);
    console.error(`  Error: ${error.message}`);
  }
}

console.log('======================================================');
console.log('  BLOCK 70: HUMAN REVIEW APPLICATION TEST SUITE');
console.log('======================================================');

// Load authoritative ledger
const ledgerPath = path.resolve(process.cwd(), 'reports/i18n-human-approved-decisions-reconciled.json');
if (!fs.existsSync(ledgerPath)) {
  throw new Error(`Authoritative reconciled ledger not found at ${ledgerPath}`);
}
const ledger = JSON.parse(fs.readFileSync(ledgerPath, 'utf8'));

// Load application manifest
const manifestPath = path.resolve(process.cwd(), 'reports/i18n-block70-corrected-application.json');
if (!fs.existsSync(manifestPath)) {
  throw new Error(`Application manifest not found at ${manifestPath}`);
}
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

// Assertion 1: Exactly 33 ledger records
test('BLOCK70-TEST-01', 'Authoritative Ledger Record Count: exactly 33 records', () => {
  if (ledger.items.length !== 33) {
    throw new Error(`Expected exactly 33 ledger items, found ${ledger.items.length}`);
  }
  if (manifest.metadata.totalLedgerItems !== 33) {
    throw new Error(`Manifest totalLedgerItems is ${manifest.metadata.totalLedgerItems}`);
  }
});

// Assertion 2-5: Decision breakdowns (29 REVISE, 2 FIX_SOURCE, 1 APPROVE, 1 KEEP_EXCEPTION)
test('BLOCK70-TEST-02', 'Decision Breakdown Verification: 29 REVISE, 2 FIX_SOURCE, 1 APPROVE, 1 KEEP_EXCEPTION', () => {
  const revise = ledger.items.filter((i: any) => i.humanDecision === 'REVISE');
  const fixSource = ledger.items.filter((i: any) => i.humanDecision === 'FIX_SOURCE');
  const approve = ledger.items.filter((i: any) => i.humanDecision === 'APPROVE');
  const keepException = ledger.items.filter((i: any) => i.humanDecision === 'KEEP_EXCEPTION');

  if (revise.length !== 29) throw new Error(`Expected 29 REVISE, found ${revise.length}`);
  if (fixSource.length !== 2) throw new Error(`Expected 2 FIX_SOURCE, found ${fixSource.length}`);
  if (approve.length !== 1) throw new Error(`Expected 1 APPROVE, found ${approve.length}`);
  if (keepException.length !== 1) throw new Error(`Expected 1 KEEP_EXCEPTION, found ${keepException.length}`);

  if (manifest.summary.reviseApplied !== 29) throw new Error(`Manifest reviseApplied mismatch`);
  if (manifest.summary.fixSourceApplied !== 2) throw new Error(`Manifest fixSourceApplied mismatch`);
  if (manifest.summary.approveApplied !== 1) throw new Error(`Manifest approveApplied mismatch`);
  if (manifest.summary.keepExceptionPreserved !== 1) throw new Error(`Manifest keepExceptionPreserved mismatch`);
});

// Assertion 6: Exactly 32 unique changed locale keys at most, with KEEP_EXCEPTION unchanged
test('BLOCK70-TEST-03', 'Changed Locale Keys Count: exactly 32 unique modified keys, with KEEP_EXCEPTION unchanged', () => {
  if (manifest.metadata.changedKeysCount !== 32) {
    throw new Error(`Expected exactly 32 changed keys, got ${manifest.metadata.changedKeysCount}`);
  }
  if (manifest.metadata.unchangedExceptionCount !== 1) {
    throw new Error(`Expected exactly 1 unchanged exception count, got ${manifest.metadata.unchangedExceptionCount}`);
  }

  // Verify KEEP_EXCEPTION item has no language changed
  const keepExEntry = manifest.appliedEntries.find((e: any) => e.key === 'trips.labels.txt_761b23');
  if (!keepExEntry) throw new Error('trips.labels.txt_761b23 missing from manifest');
  if (keepExEntry.languageChanged.length !== 0) {
    throw new Error(`KEEP_EXCEPTION key trips.labels.txt_761b23 has languages changed: ${keepExEntry.languageChanged}`);
  }
});

// Assertion 7: AR changed exactly 2 keys
test('BLOCK70-TEST-04', 'Canonical Arabic Integrity: exactly 2 keys changed, zero others touched', () => {
  if (manifest.metadata.changedArCount !== 2) {
    throw new Error(`Expected exactly 2 AR changed entries, found ${manifest.metadata.changedArCount}`);
  }
  const arChangedEntries = manifest.appliedEntries.filter((e: any) => e.languageChanged.includes('ar'));
  if (arChangedEntries.length !== 2) {
    throw new Error(`Expected 2 applied entries with AR changed, found ${arChangedEntries.length}`);
  }
  const arChangedKeys = arChangedEntries.map((e: any) => e.key).sort();
  const expectedArKeys = ['loading.labels.txt_73e4a3', 'projects.labels.settings'].sort();
  if (JSON.stringify(arChangedKeys) !== JSON.stringify(expectedArKeys)) {
    throw new Error(`AR changed keys mismatch! Expected ${expectedArKeys.join(', ')}, got ${arChangedKeys.join(', ')}`);
  }
});

// Assertion 8: EN changed exactly 32 keys
test('BLOCK70-TEST-05', 'English Locale Updates: exactly 32 keys changed', () => {
  if (manifest.metadata.changedEnCount !== 32) {
    throw new Error(`Expected exactly 32 EN changed entries, found ${manifest.metadata.changedEnCount}`);
  }
  const enChangedEntries = manifest.appliedEntries.filter((e: any) => e.languageChanged.includes('en'));
  if (enChangedEntries.length !== 32) {
    throw new Error(`Expected 32 applied entries with EN changed, found ${enChangedEntries.length}`);
  }
});

// Assertion 9: UR changed exactly 32 keys
test('BLOCK70-TEST-06', 'Urdu Locale Updates: exactly 32 keys changed', () => {
  if (manifest.metadata.changedUrCount !== 32) {
    throw new Error(`Expected exactly 32 UR changed entries, found ${manifest.metadata.changedUrCount}`);
  }
  const urChangedEntries = manifest.appliedEntries.filter((e: any) => e.languageChanged.includes('ur'));
  if (urChangedEntries.length !== 32) {
    throw new Error(`Expected 32 applied entries with UR changed, found ${urChangedEntries.length}`);
  }
});

// Assertion 10: Zero unauthorized locale keys changed
test('BLOCK70-TEST-07', 'Zero Unauthorized Locale Keys Changed: key count invariant in all locales', () => {
  const arKeys = Object.keys(arTranslations);
  const enKeys = Object.keys(enTranslations);
  const urKeys = Object.keys(urTranslations);

  if (arKeys.length !== 1128) throw new Error(`AR key count altered: ${arKeys.length} (expected 1128)`);
  if (enKeys.length !== 1128) throw new Error(`EN key count altered: ${enKeys.length} (expected 1128)`);
  if (urKeys.length !== 1128) throw new Error(`UR key count altered: ${urKeys.length} (expected 1128)`);

  if (manifest.metadata.unauthorizedKeysCount !== 0) {
    throw new Error(`Manifest unauthorizedKeysCount is ${manifest.metadata.unauthorizedKeysCount}`);
  }
  if (manifest.metadata.unauthorizedFilesCount !== 0) {
    throw new Error(`Manifest unauthorizedFilesCount is ${manifest.metadata.unauthorizedFilesCount}`);
  }
});

// Assertion 11: Zero unauthorized pricing.* keys changed + Mandatory Regression Guards
test('BLOCK70-TEST-08', 'Unauthorized Pricing Keys Protection & Mandatory Regression Guards', () => {
  const UNAUTHORIZED_PRICING_KEYS = [
    'pricing.labels.waiveException',
    'pricing.labels.txt_a72c4e',
    'pricing.labels.txt_ac1785',
    'pricing.labels.txt_001d84',
    'pricing.labels.txt_0c8dcf',
    'pricing.labels.txt_523ca0'
  ];

  for (const k of UNAUTHORIZED_PRICING_KEYS) {
    if ((arTranslations as any)[k] !== undefined) {
      throw new Error(`Unauthorized pricing key "${k}" exists in AR!`);
    }
    if ((enTranslations as any)[k] !== undefined) {
      throw new Error(`Unauthorized pricing key "${k}" exists in EN!`);
    }
    if ((urTranslations as any)[k] !== undefined) {
      throw new Error(`Unauthorized pricing key "${k}" exists in UR!`);
    }
  }

  // Assert 6 mandatory regression guard mappings
  const REGRESSION_MAPPINGS: Record<string, { en: string; ur: string }> = {
    'unloading.labels.txt_1cfd3c': {
      en: 'Approve Exception & Authorize Settlement (Waive Exception)',
      ur: 'استثناء کی منظوری اور تصفیہ کی اجازت (Waive Exception)'
    },
    'unloading.labels.txt_5f0c9f': {
      en: '4️⃣ Single License Plate Prohibited (PROHIBITED)',
      ur: '4️⃣ سنگل لائسنس پلیٹ ممنوع (PROHIBITED)'
    },
    'weighbridge.labels.txt_35a0be': {
      en: 'Precise calculation of financial settlement by ton or trip requiring net > 0, returning null on missing data',
      ur: 'ٹن یا ٹرپ کے لحاظ سے مالی تصفیے کا درست حساب، جس کے لیے net > 0 ضروری ہے، اور ڈیٹا غائب ہونے پر null واپس کیا جائے گا۔'
    },
    'weighbridge.labels.txt_407887': {
      en: 'Audit calculation functions, validation criteria, prohibit replacing missing values with zero, and evaluate variance (NORMAL / WARNING / EXCEPTION)',
      ur: 'حسابی فنکشنز اور تصدیقی معیارات کی جانچ، گمشدہ ڈیٹا کو صفر سے تبدیل کرنے کی ممانعت، اور فرق کا جائزہ (NORMAL / WARNING / EXCEPTION)'
    },
    'offline.labels.txt_402c63': {
      en: 'Amount & Settlement:',
      ur: 'رقم اور تصفیہ:'
    },
    'loading.labels.save_3': {
      en: 'The settlement amount (settlementAmount) has no input field in the interface and is calculated exclusively server-side (Server-Side Calculation). Any client-submitted value is ignored and logged in regulatory audit trails.',
      ur: 'تصفیے کی رقم (settlementAmount) کے لیے انٹرفیس میں کوئی ان پٹ فیلڈ نہیں ہے، اور اس کا حساب مکمل طور پر سرور پر (Server-Side Calculation) کیا جاتا ہے۔ کلائنٹ کی طرف سے بھیجی گئی کسی بھی رقم کو نظر انداز کر کے اسے ریگولیٹری آڈٹ لاگز میں محفوظ کیا جاتا ہے۔'
    }
  };

  for (const [key, expected] of Object.entries(REGRESSION_MAPPINGS)) {
    const liveEn = (enTranslations as any)[key];
    const liveUr = (urTranslations as any)[key];
    if (liveEn !== expected.en) {
      throw new Error(`Regression guard EN mismatch for ${key}! Expected "${expected.en}", got "${liveEn}"`);
    }
    if (liveUr !== expected.ur) {
      throw new Error(`Regression guard UR mismatch for ${key}! Expected "${expected.ur}", got "${liveUr}"`);
    }
  }
});

// Assertion 12: All protected tokens preserved
test('BLOCK70-TEST-09', 'Protected Token Invariance: technical codes, units, numbers, and models preserved across EN and UR', () => {
  for (const item of ledger.items) {
    if (item.humanDecision !== 'REVISE' && item.humanDecision !== 'APPROVE') continue;
    const liveEn = (enTranslations as any)[item.key];
    const liveUr = (urTranslations as any)[item.key];

    for (const token of item.preservedProtectedTokens) {
      const clean = token.replace(/["\\]/g, '');
      if (!liveEn.includes(clean)) {
        throw new Error(`Protected token "${token}" missing from live EN for ${item.key}: "${liveEn}"`);
      }
      if (!liveUr.includes(clean)) {
        throw new Error(`Protected token "${token}" missing from live UR for ${item.key}: "${liveUr}"`);
      }
    }
  }
});

// Assertion 13: ${pricingResolutionResult.message} preserved exactly
test('BLOCK70-TEST-10', 'Interpolation Parity: runtime variable ${pricingResolutionResult.message} preserved exactly', () => {
  const key = 'trips.status.failedPricing';
  const liveAr = (arTranslations as any)[key];
  const liveEn = (enTranslations as any)[key];
  const liveUr = (urTranslations as any)[key];

  const targetVar = '${pricingResolutionResult.message}';
  if (!liveAr.includes(targetVar)) throw new Error(`Missing ${targetVar} in AR`);
  if (!liveEn.includes(targetVar)) throw new Error(`Missing ${targetVar} in EN: "${liveEn}"`);
  if (!liveUr.includes(targetVar)) throw new Error(`Missing ${targetVar} in UR: "${liveUr}"`);

  if (!liveEn.startsWith('[Trip Start Blocked]:')) {
    throw new Error(`Live EN prefix mismatch: "${liveEn}"`);
  }
  if (!liveUr.startsWith('[ٹرپ شروع کرنا ممنوع]:')) {
    throw new Error(`Live UR prefix mismatch: "${liveUr}"`);
  }
});

// Assertion 14: trips.labels.txt_761b23 remains byte-identical
test('BLOCK70-TEST-11', 'KEEP_EXCEPTION Invariance: trips.labels.txt_761b23 remains byte-identical across all dictionaries', () => {
  const key = 'trips.labels.txt_761b23';
  const expectedValue = 'محاولة توريد "خلطة أسفلتية ساخنة" في مشروع مخصص لنقل الردميات والركام. حظر فوري.';

  const liveAr = (arTranslations as any)[key];
  const liveEn = (enTranslations as any)[key];
  const liveUr = (urTranslations as any)[key];

  if (liveAr !== expectedValue) throw new Error(`AR mismatch for ${key}: expected "${expectedValue}", got "${liveAr}"`);
  if (liveEn !== expectedValue) throw new Error(`EN mismatch for ${key}: expected "${expectedValue}", got "${liveEn}"`);
  if (liveUr !== expectedValue) throw new Error(`UR mismatch for ${key}: expected "${expectedValue}", got "${liveUr}"`);
  if (liveAr !== liveEn || liveAr !== liveUr) throw new Error(`Cross-locale parity mismatch for KEEP_EXCEPTION ${key}`);
});

// Assertion 15: Both FIX_SOURCE Arabic transitions are exact
test('BLOCK70-TEST-12', 'FIX_SOURCE Arabic Transitions: redundant English parentheticals removed cleanly', () => {
  const item15 = (arTranslations as any)['loading.labels.txt_73e4a3'];
  const expected15 = 'التسوية التقديرية';
  if (item15 !== expected15) {
    throw new Error(`loading.labels.txt_73e4a3 in AR: expected "${expected15}", got "${item15}"`);
  }

  const item32 = (arTranslations as any)['projects.labels.settings'];
  const expected32 = 'الإعدادات الافتراضية والامتثال النظامي';
  if (item32 !== expected32) {
    throw new Error(`projects.labels.settings in AR: expected "${expected32}", got "${item32}"`);
  }
});

// Assertion 16: All approved EN/UR values match the reconciled ledger exactly
test('BLOCK70-TEST-13', 'Full Content Parity: all 33 items in live EN/UR match reconciled ledger decisions', () => {
  for (const item of ledger.items) {
    if (item.humanDecision === 'KEEP_EXCEPTION') {
      continue;
    }
    const liveEn = (enTranslations as any)[item.key];
    const liveUr = (urTranslations as any)[item.key];

    if (liveEn !== item.approvedEN) {
      throw new Error(`Live EN for ${item.key} does not match approvedEN!\nExpected: "${item.approvedEN}"\nGot:      "${liveEn}"`);
    }
    if (liveUr !== item.approvedUR) {
      throw new Error(`Live UR for ${item.key} does not match approvedUR!\nExpected: "${item.approvedUR}"\nGot:      "${liveUr}"`);
    }
  }
});

// Anti-Defect Quality: Strictly 0 Arabic glyphs in updated English
test('BLOCK70-TEST-14', 'Anti-Defect Quality: strictly 0 Arabic Unicode glyphs across all 32 updated English entries', () => {
  const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  for (const item of ledger.items) {
    if (item.humanDecision === 'KEEP_EXCEPTION') continue;
    const liveEn = (enTranslations as any)[item.key];
    if (arabicRegex.test(liveEn)) {
      throw new Error(`Updated EN key "${item.key}" contains forbidden Arabic glyphs: "${liveEn}"`);
    }
  }
});

console.log('------------------------------------------------------');
console.log(`Total tests: ${totalTests} | Passed: ${passedTests} | Failed: ${failedTests}`);
console.log('------------------------------------------------------');

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('BLOCK 70: ALL HUMAN REVIEW APPLICATION TESTS PASSED SUCCESSFULLY.');
}
