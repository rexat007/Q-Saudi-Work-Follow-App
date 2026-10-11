import * as fs from 'fs';
import * as path from 'path';
import { describe, it, expect } from 'vitest';
import { arTranslations } from '../locales/ar';
import { enTranslations } from '../locales/en';
import { urTranslations } from '../locales/ur';

describe('Block 70 Human Review Application Test Suite', () => {
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

  // Test 1: Exactly 33 ledger records
  it('BLOCK70-TEST-01: Authoritative Ledger Record Count: exactly 33 records', () => {
    expect(ledger.items).toHaveLength(33);
    expect(manifest.metadata.totalLedgerItems).toBe(33);
  });

  // Test 2: Decision breakdowns (29 REVISE, 2 FIX_SOURCE, 1 APPROVE, 1 KEEP_EXCEPTION)
  it('BLOCK70-TEST-02: Decision Breakdown Verification: 29 REVISE, 2 FIX_SOURCE, 1 APPROVE, 1 KEEP_EXCEPTION', () => {
    const revise = ledger.items.filter((i: any) => i.humanDecision === 'REVISE');
    const fixSource = ledger.items.filter((i: any) => i.humanDecision === 'FIX_SOURCE');
    const approve = ledger.items.filter((i: any) => i.humanDecision === 'APPROVE');
    const keepException = ledger.items.filter((i: any) => i.humanDecision === 'KEEP_EXCEPTION');

    expect(revise).toHaveLength(29);
    expect(fixSource).toHaveLength(2);
    expect(approve).toHaveLength(1);
    expect(keepException).toHaveLength(1);

    expect(manifest.summary.reviseApplied).toBe(29);
    expect(manifest.summary.fixSourceApplied).toBe(2);
    expect(manifest.summary.approveApplied).toBe(1);
    expect(manifest.summary.keepExceptionPreserved).toBe(1);
  });

  // Test 3: Exactly 32 unique changed locale keys at most, with KEEP_EXCEPTION unchanged & manifest integrity
  it('BLOCK70-TEST-03: Changed Locale Keys Count: exactly 32 unique modified keys, with KEEP_EXCEPTION unchanged', () => {
    expect(manifest.metadata.changedKeysCount).toBe(32);
    expect(manifest.metadata.unchangedExceptionCount).toBe(1);

    // Verify KEEP_EXCEPTION item has no language changed
    const keepExEntry = manifest.appliedEntries.find((e: any) => e.key === 'trips.labels.txt_761b23');
    expect(keepExEntry).toBeDefined();
    expect(keepExEntry.languageChanged).toHaveLength(0);

    // Manifest integrity preserved from former TEST-07
    expect(manifest.metadata.unauthorizedKeysCount).toBe(0);
    expect(manifest.metadata.unauthorizedFilesCount).toBe(0);
  });

  // Test 4: AR changed exactly 2 keys
  it('BLOCK70-TEST-04: Canonical Arabic Integrity: exactly 2 keys changed, zero others touched', () => {
    expect(manifest.metadata.changedArCount).toBe(2);
    const arChangedEntries = manifest.appliedEntries.filter((e: any) => e.languageChanged.includes('ar'));
    expect(arChangedEntries).toHaveLength(2);

    const arChangedKeys = arChangedEntries.map((e: any) => e.key).sort();
    const expectedArKeys = ['loading.labels.txt_73e4a3', 'projects.labels.settings'].sort();
    expect(arChangedKeys).toEqual(expectedArKeys);
  });

  // Test 5: EN changed exactly 32 keys
  it('BLOCK70-TEST-05: English Locale Updates: exactly 32 keys changed', () => {
    expect(manifest.metadata.changedEnCount).toBe(32);
    const enChangedEntries = manifest.appliedEntries.filter((e: any) => e.languageChanged.includes('en'));
    expect(enChangedEntries).toHaveLength(32);
  });

  // Test 6: UR changed exactly 32 keys
  it('BLOCK70-TEST-06: Urdu Locale Updates: exactly 32 keys changed', () => {
    expect(manifest.metadata.changedUrCount).toBe(32);
    const urChangedEntries = manifest.appliedEntries.filter((e: any) => e.languageChanged.includes('ur'));
    expect(urChangedEntries).toHaveLength(32);
  });

  // Test 8: Zero unauthorized pricing.* keys changed + Mandatory Regression Guards
  it('BLOCK70-TEST-08: Unauthorized Pricing Keys Protection & Mandatory Regression Guards', () => {
    const UNAUTHORIZED_PRICING_KEYS = [
      'pricing.labels.waiveException',
      'pricing.labels.txt_a72c4e',
      'pricing.labels.txt_ac1785',
      'pricing.labels.txt_001d84',
      'pricing.labels.txt_0c8dcf',
      'pricing.labels.txt_523ca0'
    ];

    for (const k of UNAUTHORIZED_PRICING_KEYS) {
      expect((arTranslations as any)[k]).toBeUndefined();
      expect((enTranslations as any)[k]).toBeUndefined();
      expect((urTranslations as any)[k]).toBeUndefined();
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
      expect(liveEn).toBe(expected.en);
      expect(liveUr).toBe(expected.ur);
    }
  });

  // Test 9: All protected tokens preserved
  it('BLOCK70-TEST-09: Protected Token Invariance: technical codes, units, numbers, and models preserved across EN and UR', () => {
    for (const item of ledger.items) {
      if (item.humanDecision !== 'REVISE' && item.humanDecision !== 'APPROVE') continue;
      const liveEn = (enTranslations as any)[item.key];
      const liveUr = (urTranslations as any)[item.key];

      for (const token of item.preservedProtectedTokens) {
        const clean = token.replace(/["\\]/g, '');
        expect(liveEn).toContain(clean);
        expect(liveUr).toContain(clean);
      }
    }
  });

  // Test 10: ${pricingResolutionResult.message} preserved exactly
  it('BLOCK70-TEST-10: Interpolation Parity: runtime variable ${pricingResolutionResult.message} preserved exactly', () => {
    const key = 'trips.status.failedPricing';
    const liveAr = (arTranslations as any)[key];
    const liveEn = (enTranslations as any)[key];
    const liveUr = (urTranslations as any)[key];

    const targetVar = '${pricingResolutionResult.message}';
    expect(liveAr).toContain(targetVar);
    expect(liveEn).toContain(targetVar);
    expect(liveUr).toContain(targetVar);

    expect(liveEn.startsWith('[Trip Start Blocked]:')).toBe(true);
    expect(liveUr.startsWith('[ٹرپ شروع کرنا ممنوع]:')).toBe(true);
  });

  // Test 12: Both FIX_SOURCE Arabic transitions are exact
  it('BLOCK70-TEST-12: FIX_SOURCE Arabic Transitions: redundant English parentheticals removed cleanly', () => {
    const item15 = (arTranslations as any)['loading.labels.txt_73e4a3'];
    const expected15 = 'التسوية التقديرية';
    expect(item15).toBe(expected15);

    const item32 = (arTranslations as any)['projects.labels.settings'];
    const expected32 = 'الإعدادات الافتراضية والامتثال النظامي';
    expect(item32).toBe(expected32);
  });

  // Test 13: All approved EN/UR values match the reconciled ledger exactly
  it('BLOCK70-TEST-13: Full Content Parity: all 33 items in live EN/UR match reconciled ledger decisions', () => {
    for (const item of ledger.items) {
      if (item.humanDecision === 'KEEP_EXCEPTION') {
        continue;
      }
      const liveEn = (enTranslations as any)[item.key];
      const liveUr = (urTranslations as any)[item.key];

      expect(liveEn).toBe(item.approvedEN);
      expect(liveUr).toBe(item.approvedUR);
    }
  });

  // Test 14: Anti-Defect Quality: Strictly 0 Arabic glyphs in updated English
  it('BLOCK70-TEST-14: Anti-Defect Quality: strictly 0 Arabic Unicode glyphs across all 32 updated English entries', () => {
    const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
    for (const item of ledger.items) {
      if (item.humanDecision === 'KEEP_EXCEPTION') continue;
      const liveEn = (enTranslations as any)[item.key];
      expect(arabicRegex.test(liveEn)).toBe(false);
    }
  });
});
