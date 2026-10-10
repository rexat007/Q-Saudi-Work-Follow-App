import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { describe, it, expect } from 'vitest';

// Authoritative final human decisions from the review conversation
const expectedHumanDecisions: Record<string, {
  decision: 'APPROVE' | 'REVISE' | 'KEEP_EXCEPTION' | 'FIX_SOURCE';
  en: string;
  ur: string;
  arFrom?: string;
  arTo?: string;
  protectedTokens?: string[];
  interpolationVariables?: string[];
}> = {
  'trips.status.failedPricing': {
    decision: 'REVISE',
    en: '[Trip Start Blocked]: Pricing resolution and settlement calculation failed (Pricing Resolution Failed) - ${pricingResolutionResult.message}',
    ur: '[ٹرپ شروع کرنا ممنوع]: قیمت کے تعین اور تصفیے کے حساب میں ناکامی ہوئی (Pricing Resolution Failed) - ${pricingResolutionResult.message}',
    protectedTokens: ['${pricingResolutionResult.message}', 'Pricing Resolution Failed'],
    interpolationVariables: ['${pricingResolutionResult.message}']
  },
  'trips.labels.trip_4': {
    decision: 'REVISE',
    en: 'Trip completion blocked without destNetWeight',
    ur: 'destNetWeight کے بغیر ٹرپ کی تکمیل ممنوع ہے',
    protectedTokens: ['destNetWeight']
  },
  'trips.labels.trip_7': {
    decision: 'REVISE',
    en: '[Regulatory Rule]: Trip completion blocked without an authorized unloader (unloaderId) and unloading timestamp (unloadTime).',
    ur: '[نگرانی کا اصول]: مجاز وصول کنندہ (unloaderId) اور ان لوڈنگ وقت (unloadTime) کے بغیر ٹرپ مکمل کرنا ممنوع ہے۔',
    protectedTokens: ['unloaderId', 'unloadTime']
  },
  'trips.labels.txt_2c17d4': {
    decision: 'REVISE',
    en: 'Completion prohibited without recipient identity and unloading timestamp',
    ur: 'وصول کنندہ کی شناخت اور ان لوڈنگ کے وقت کے بغیر تکمیل ممنوع ہے۔'
  },
  'trips.labels.txt_2cd3f8': {
    decision: 'REVISE',
    en: 'Regulatory Enforcement Verification Matrix (Negative Stress Tests)',
    ur: 'ریگولیٹری نفاذ کی تصدیقی میٹرکس (Negative Stress Tests)',
    protectedTokens: ['Negative Stress Tests']
  },
  'trips.labels.txt_37b15d': {
    decision: 'REVISE',
    en: 'Completion prohibited if discrepancy cannot be accurately calculated',
    ur: 'اگر فرق کا درست حساب نہ ہو سکے تو تکمیل ممنوع ہے۔'
  },
  'trips.labels.txt_3a0ff7': {
    decision: 'REVISE',
    en: 'Settlement Amount Due:',
    ur: 'قابلِ ادائیگی تصفیے کی رقم:'
  },
  'trips.labels.txt_5f22c5': {
    decision: 'REVISE',
    en: 'Full lifecycle transition governance: verifying rank and project, mandatory weights, recipient, and arrival time, with server-side calculation of variance and settlement.',
    ur: 'لائف سائیکل کے تمام مراحل کی مکمل نگرانی: رینک اور پروجیکٹ کی تصدیق، لازمی وزن، وصول کنندہ اور آمد کا وقت، اور سرور پر فرق اور تصفیے کا حساب۔'
  },
  'trips.labels.txt_622420': {
    decision: 'REVISE',
    en: 'Server-side verification of the six rules, with automated weight calculation and settlement.',
    ur: 'چھ قواعد کی سرور پر تصدیق، اور وزن و تصفیے کا خودکار حساب۔'
  },
  'trips.labels.txt_701a0c': {
    decision: 'REVISE',
    en: 'Skipping mandatory operational stages is prohibited',
    ur: 'لازمی آپریشنل مراحل کو چھوڑنا ممنوع ہے'
  },
  'trips.labels.txt_761b23': {
    decision: 'KEEP_EXCEPTION',
    en: 'unchanged',
    ur: 'unchanged',
    protectedTokens: ['"خلطة أسفلتية ساخنة"']
  },
  'trips.labels.txt_7d5bc8': {
    decision: 'REVISE',
    en: 'Total Calculated Settlement',
    ur: 'کل محسوب شدہ تصفیہ'
  },
  'trips.labels.txt_7d6134': {
    decision: 'APPROVE',
    en: 'Settlement (SAR)',
    ur: 'تصفیہ (SAR)',
    protectedTokens: ['SAR']
  },
  'loading.labels.txt_57f8de': {
    decision: 'REVISE',
    en: 'Approved Settlement:',
    ur: 'منظور شدہ تصفیہ:'
  },
  'loading.labels.txt_73e4a3': {
    decision: 'FIX_SOURCE',
    en: 'Estimated Settlement',
    ur: 'تخمینی تصفیہ',
    arFrom: 'التسوية التقديرية (Settlement)',
    arTo: 'التسوية التقديرية',
    protectedTokens: ['Settlement']
  },
  'unloading.labels.txt_1cfd3c': {
    decision: 'REVISE',
    en: 'Approve Exception & Authorize Settlement (Waive Exception)',
    ur: 'استثناء کی منظوری اور تصفیہ کی اجازت (Waive Exception)',
    protectedTokens: ['Waive Exception']
  },
  'unloading.labels.txt_5f0c9f': {
    decision: 'REVISE',
    en: '4️⃣ Single License Plate Prohibited (PROHIBITED)',
    ur: '4️⃣ سنگل لائسنس پلیٹ ممنوع (PROHIBITED)',
    protectedTokens: ['PROHIBITED']
  },
  'weighbridge.labels.txt_35a0be': {
    decision: 'REVISE',
    en: 'Precise calculation of financial settlement by ton or trip requiring net > 0, returning null on missing data',
    ur: 'ٹن یا ٹرپ کے لحاظ سے مالی تصفیے کا درست حساب، جس کے لیے net > 0 ضروری ہے، اور ڈیٹا غائب ہونے پر null واپس کیا جائے گا۔',
    protectedTokens: ['net > 0', 'null']
  },
  'weighbridge.labels.txt_407887': {
    decision: 'REVISE',
    en: 'Audit calculation functions, validation criteria, prohibit replacing missing values with zero, and evaluate variance (NORMAL / WARNING / EXCEPTION)',
    ur: 'حسابی فنکشنز اور تصدیقی معیارات کی جانچ، گمشدہ ڈیٹا کو صفر سے تبدیل کرنے کی ممانعت، اور فرق کا جائزہ (NORMAL / WARNING / EXCEPTION)',
    protectedTokens: ['NORMAL', 'WARNING', 'EXCEPTION']
  },
  'offline.labels.txt_402c63': {
    decision: 'REVISE',
    en: 'Amount & Settlement:',
    ur: 'رقم اور تصفیہ:'
  },
  'loading.labels.save_3': {
    decision: 'REVISE',
    en: 'The settlement amount (settlementAmount) has no input field in the interface and is calculated exclusively server-side (Server-Side Calculation). Any client-submitted value is ignored and logged in regulatory audit trails.',
    ur: 'تصفیے کی رقم (settlementAmount) کے لیے انٹرفیس میں کوئی ان پٹ فیلڈ نہیں ہے، اور اس کا حساب مکمل طور پر سرور پر (Server-Side Calculation) کیا جاتا ہے۔ کلائنٹ کی طرف سے بھیجی گئی کسی بھی رقم کو نظر انداز کر کے اسے ریگولیٹری آڈٹ لاگز میں محفوظ کیا جاتا ہے۔',
    protectedTokens: ['settlementAmount', 'Server-Side Calculation']
  },
  'unloading.labels.txt_186f77': {
    decision: 'REVISE',
    en: 'Automated Compliance Report for Unloading Station Requirements (Unloading Station Tests)',
    ur: 'ان لوڈنگ اسٹیشن کے تقاضوں کی خودکار تعمیلی رپورٹ (Unloading Station Tests)',
    protectedTokens: ['Unloading Station Tests']
  },
  'unloading.labels.txt_1bec3a': {
    decision: 'REVISE',
    en: 'Automated Compliance Check (7 Requirements)',
    ur: 'خودکار تعمیلی جانچ (7 شرائط)'
  },
  'unloading.labels.txt_68980a': {
    decision: 'REVISE',
    en: 'Regulatory Security Block (BLOCKED)',
    ur: 'نگرانی کا سیکیورٹی بلاک (BLOCKED)',
    protectedTokens: ['BLOCKED']
  },
  'offline.labels.createTripPricing': {
    decision: 'REVISE',
    en: 'Offline Trip Creation Prohibited: Pricing data is not available locally in browser storage (IndexedDB). No trip may be created without an approved pricing calculation.',
    ur: 'آف لائن ٹرپ بنانا ممنوع ہے: قیمتوں کا ڈیٹا براؤزر کے مقامی اسٹوریج (IndexedDB) میں دستیاب نہیں ہے۔ منظور شدہ قیمت کے حساب کے بغیر کوئی ٹرپ بنانے کی اجازت نہیں ہے۔',
    protectedTokens: ['IndexedDB']
  },
  'navigation.labels.txt_2f3fde': {
    decision: 'REVISE',
    en: 'Settlement Due',
    ur: 'واجب الادا تصفیہ'
  },
  'entityResolution.labels.importEdit': {
    decision: 'REVISE',
    en: 'Executes prior to approving any import file (Import) or modifying reference data (Master Data). Prevents erroneous automatic merges (Auto-Merge) and prohibits regulatory conflicts.',
    ur: 'کسی بھی امپورٹ فائل (Import) کی منظوری یا ماسٹر ڈیٹا (Master Data) میں ترمیم سے پہلے چلتا ہے۔ غلط خودکار انضمام (Auto-Merge) کو روکتا ہے اور تنظیمی تنازعات کو روکتا ہے۔',
    protectedTokens: ['Import', 'Master Data', 'Auto-Merge']
  },
  'entityResolution.labels.txt_2b8f60': {
    decision: 'REVISE',
    en: 'Record excluded and blocked from entry.',
    ur: 'ریکارڈ کو اندراج سے خارج اور بلاک کر دیا گیا ہے۔'
  },
  'projects.labels.txt_6757e5': {
    decision: 'REVISE',
    en: 'Value Added Tax Rate % (VAT)',
    ur: 'ویلیو ایڈڈ ٹیکس کی شرح % (VAT)',
    protectedTokens: ['VAT', '%']
  },
  'offline.labels.txt_305c29': {
    decision: 'REVISE',
    en: 'Dependency reconciliation and matching with server master data',
    ur: 'سرور کے بنیادی ڈیٹا کے ساتھ وابستگیوں کی مطابقت اور تصفیہ'
  },
  'exceptions.labels.driver': {
    decision: 'REVISE',
    en: 'Driver sponsorship does not match the contracted carrier, with no valid Ajeer permit',
    ur: 'ڈرائیور کی کفالت معاہدہ شدہ کیریئر سے مماثل نہیں ہے اور کوئی درست Ajeer اجازت نامہ موجود نہیں ہے۔',
    protectedTokens: ['Ajeer']
  },
  'projects.labels.settings': {
    decision: 'FIX_SOURCE',
    en: 'Default Settings & Regulatory Compliance',
    ur: 'طے شدہ ترتیبات اور ضابطہ جاتی تعمیل',
    arFrom: 'الإعدادات الافتراضية والامتثال النظامي (Default Settings & Compliance)',
    arTo: 'الإعدادات الافتراضية والامتثال النظامي',
    protectedTokens: ['Default Settings & Compliance']
  },
  'navigation.labels.pricing_2': {
    decision: 'REVISE',
    en: 'Based on trip contractual pricing snapshots',
    ur: 'معاہداتی ٹرپ قیمتوں کے اسنیپ شاٹس پر مبنی'
  }
};

describe('Block 69A Human Review Reconciliation Test Suite', () => {
  const reconciledJsonPath = path.resolve(process.cwd(), 'reports/i18n-human-approved-decisions-reconciled.json');
  const reconciledMdPath = path.resolve(process.cwd(), 'reports/i18n-human-approved-decisions-reconciled.md');
  const block68JsonPath = path.resolve(process.cwd(), 'reports/i18n-human-review-decisions.json');

  if (!fs.existsSync(reconciledJsonPath)) {
    throw new Error(`Reconciled ledger file missing: ${reconciledJsonPath}`);
  }
  if (!fs.existsSync(reconciledMdPath)) {
    throw new Error(`Reconciled markdown dossier missing: ${reconciledMdPath}`);
  }

  const reconciledData = JSON.parse(fs.readFileSync(reconciledJsonPath, 'utf-8'));
  const items: any[] = reconciledData.items;

  // Test 1: Exactly 33 records in reconciled ledger
  it('BLOCK69A-TEST-01: Reconciled Ledger Cardinality: Exactly 33 records and metadata consistency', () => {
    expect(items).toHaveLength(33);
    expect(reconciledData.metadata.totalItems).toBe(33);
    expect(reconciledData.summary.totalItems).toBe(33);

    const keys = new Set(items.map((i) => i.key));
    expect(keys.size).toBe(33);
  });

  // Test 2: Exact decision counts 29 REVISE, 2 FIX_SOURCE, 1 APPROVE, 1 KEEP_EXCEPTION
  it('BLOCK69A-TEST-02: Decision Counts Verification: 29 REVISE, 2 FIX_SOURCE, 1 APPROVE, 1 KEEP_EXCEPTION', () => {
    const counts = {
      REVISE: items.filter((i) => i.humanDecision === 'REVISE').length,
      FIX_SOURCE: items.filter((i) => i.humanDecision === 'FIX_SOURCE').length,
      APPROVE: items.filter((i) => i.humanDecision === 'APPROVE').length,
      KEEP_EXCEPTION: items.filter((i) => i.humanDecision === 'KEEP_EXCEPTION').length
    };

    expect(counts.REVISE).toBe(29);
    expect(counts.FIX_SOURCE).toBe(2);
    expect(counts.APPROVE).toBe(1);
    expect(counts.KEEP_EXCEPTION).toBe(1);

    const summaryCounts = reconciledData.summary.decisionCounts;
    expect(summaryCounts.REVISE).toBe(29);
    expect(summaryCounts.FIX_SOURCE).toBe(2);
    expect(summaryCounts.APPROVE).toBe(1);
    expect(summaryCounts.KEEP_EXCEPTION).toBe(1);
  });

  // Test 3: Exact approved EN/UR values across all 33 records
  it('BLOCK69A-TEST-03: Exact Approved EN/UR Wording Verification across all 33 records', () => {
    items.forEach((item) => {
      const expected = expectedHumanDecisions[item.key];
      expect(expected).toBeDefined();
      expect(item.humanDecision).toBe(expected.decision);
      expect(item.approvedEN).toBe(expected.en);
      expect(item.approvedUR).toBe(expected.ur);
    });
  });

  // Test 4: Exact FIX_SOURCE Arabic transitions verified
  it('BLOCK69A-TEST-04: Exact FIX_SOURCE Arabic Transitions: Item 15 and Item 32 parenthetical removals verified', () => {
    const fixSourceItems = items.filter((i) => i.humanDecision === 'FIX_SOURCE');
    expect(fixSourceItems).toHaveLength(2);

    // Item 15: loading.labels.txt_73e4a3
    const item15 = items.find((i) => i.key === 'loading.labels.txt_73e4a3');
    expect(item15).toBeDefined();
    expect(item15.approvedArabicAction).toBeDefined();
    expect(item15.approvedArabicAction.action).toBe('REMOVE_REDUNDANT_ENGLISH_PARENTHETICAL');
    expect(item15.approvedArabicAction.from).toBe('التسوية التقديرية (Settlement)');
    expect(item15.approvedArabicAction.to).toBe('التسوية التقديرية');

    // Item 32: projects.labels.settings
    const item32 = items.find((i) => i.key === 'projects.labels.settings');
    expect(item32).toBeDefined();
    expect(item32.approvedArabicAction).toBeDefined();
    expect(item32.approvedArabicAction.action).toBe('REMOVE_REDUNDANT_ENGLISH_PARENTHETICAL');
    expect(item32.approvedArabicAction.from).toBe('الإعدادات الافتراضية والامتثال النظامي (Default Settings & Compliance)');
    expect(item32.approvedArabicAction.to).toBe('الإعدادات الافتراضية والامتثال النظامي');
  });

  // Test 5: KEEP_EXCEPTION and APPROVE exact validation
  it('BLOCK69A-TEST-05: KEEP_EXCEPTION & APPROVE Handlers: trips.labels.txt_761b23 and trips.labels.txt_7d6134', () => {
    // KEEP_EXCEPTION: trips.labels.txt_761b23
    const keepItem = items.find((i) => i.key === 'trips.labels.txt_761b23');
    expect(keepItem).toBeDefined();
    expect(keepItem.humanDecision).toBe('KEEP_EXCEPTION');
    expect(keepItem.approvedEN).toBe('unchanged');
    expect(keepItem.approvedUR).toBe('unchanged');
    expect(keepItem.approvedArabicAction).toBeNull();

    // APPROVE: trips.labels.txt_7d6134
    const approveItem = items.find((i) => i.key === 'trips.labels.txt_7d6134');
    expect(approveItem).toBeDefined();
    expect(approveItem.humanDecision).toBe('APPROVE');
    expect(approveItem.approvedEN).toBe('Settlement (SAR)');
    expect(approveItem.approvedUR).toBe('تصفیہ (SAR)');
    expect(approveItem.preservedProtectedTokens).toContain('SAR');
  });

  // Test 6: Protected tokens & Interpolation variables integrity
  it('BLOCK69A-TEST-06: Protected Tokens & Interpolation Integrity: zero dropped or corrupted tokens', () => {
    items.forEach((item) => {
      // Check interpolation
      if (item.preservedInterpolationVariables.length > 0) {
        item.preservedInterpolationVariables.forEach((v: string) => {
          expect(item.approvedEN).toContain(v);
          expect(item.approvedUR).toContain(v);
        });
      }

      // Check protected tokens for REVISE and APPROVE
      if (item.humanDecision === 'REVISE' || item.humanDecision === 'APPROVE') {
        item.preservedProtectedTokens.forEach((token: string) => {
          expect(item.approvedEN).toContain(token);
        });
      }
    });

    // Verify trips.status.failedPricing specifically
    const failedPricing = items.find((i) => i.key === 'trips.status.failedPricing');
    expect(failedPricing.preservedInterpolationVariables).toContain('${pricingResolutionResult.message}');
  });

  // Test 7: Original Block 68 traceability preserved
  it('BLOCK69A-TEST-07: Block 68 Traceability: 100% preservation of Block 68 recommendations & classifications', () => {
    const block68Data = JSON.parse(fs.readFileSync(block68JsonPath, 'utf-8'));
    const b68Map = new Map<string, any>();
    for (const b68Item of block68Data.items) {
      b68Map.set(b68Item.key, b68Item);
    }

    items.forEach((item) => {
      const b68 = b68Map.get(item.key);
      expect(b68).toBeDefined();
      expect(item.originalBlock68Recommendation).toBe(b68.recommendedDecision);
      expect(item.originalClassification).toBe(b68.classification);
    });
  });

  // Test 8: Governance status & attestation
  it('BLOCK69A-TEST-08: Governance Attestation: Status, reviewer decision, and source of decision', () => {
    items.forEach((item) => {
      expect(item.reviewStatus).toBe('REVIEWED');
      expect(item.reviewerDecision).toBe('APPROVED');
      expect(item.sourceOfDecision).toBe('HUMAN_REVIEW_CHAT');
      expect(item.appliedToCodebase).toBe(false);
    });

    expect(reconciledData.metadata.governanceStatus).toBe('HUMAN_DECISIONS_RECONCILED_ZERO_CODE_APPLICATION');
    expect(reconciledData.metadata.appliedToCodebase).toBe(false);
  });

  // Test 10: Deterministic Checksum Verification
  it('BLOCK69A-TEST-10: Deterministic Checksum Integrity: SHA-256 hash mathematically verified and matches generated ledger', () => {
    const canonicalString = JSON.stringify(items, Object.keys(items[0]).sort());
    const expectedHash = crypto.createHash('sha256').update(canonicalString).digest('hex');

    expect(reconciledData.metadata.ledgerChecksum).toBe(expectedHash);
  });
});
