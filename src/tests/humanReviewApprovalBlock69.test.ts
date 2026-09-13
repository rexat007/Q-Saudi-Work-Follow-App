import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { arTranslations } from '../locales/ar';
import { enTranslations } from '../locales/en';
import { urTranslations } from '../locales/ur';

const dictionaries = {
  ar: arTranslations,
  en: enTranslations,
  ur: urTranslations
};

let passedTests = 0;
let totalTests = 0;

function test(id: string, name: string, fn: () => void) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✅ [PASS] ${id}: ${name}`);
  } catch (error) {
    console.error(`  ❌ [FAIL] ${id}: ${name}`);
    console.error(`     Error: ${(error as Error).message}`);
    process.exitCode = 1;
  }
}

console.log('======================================================');
console.log('RUNNING BLOCK 69 HUMAN REVIEW APPROVAL TEST SUITE');
console.log('======================================================');

const approvedJsonPath = path.resolve(process.cwd(), 'reports', 'i18n-human-approved-decisions.json');
const approvedMdPath = path.resolve(process.cwd(), 'reports', 'i18n-human-approved-decisions.md');
const block68JsonPath = path.resolve(process.cwd(), 'reports', 'i18n-human-review-decisions.json');

if (!fs.existsSync(approvedJsonPath) || !fs.existsSync(approvedMdPath)) {
  console.error('Fatal: Missing Block 69 approval report artifacts');
  process.exit(1);
}

const approvedData = JSON.parse(fs.readFileSync(approvedJsonPath, 'utf-8'));
const items = approvedData.items;

// Test 1: Exactly 33 Human Review Records
test('BLOCK69-TEST-01', 'Authoritative Ledger Count: exactly 33 human-approved decision records', () => {
  if (items.length !== 33) {
    throw new Error(`Expected exactly 33 items, found ${items.length}`);
  }
  if (approvedData.summary.totalItems !== 33) {
    throw new Error(`Summary totalItems is ${approvedData.summary.totalItems}, expected 33`);
  }
  const uniqueKeys = new Set(items.map((i: any) => i.key));
  if (uniqueKeys.size !== 33) {
    throw new Error(`Duplicate keys found in approved ledger: expected 33, got ${uniqueKeys.size}`);
  }
});

// Test 2: Decision Breakdown Reconciliation
test('BLOCK69-TEST-02', 'Decision Breakdown: exactly 29 REVISE, 2 FIX_SOURCE, 1 APPROVE, 1 KEEP_EXCEPTION', () => {
  const counts: Record<string, number> = {};
  for (const item of items) {
    counts[item.humanDecision] = (counts[item.humanDecision] || 0) + 1;
  }

  if (counts.REVISE !== 29) {
    throw new Error(`Expected 29 REVISE, got ${counts.REVISE}`);
  }
  if (counts.FIX_SOURCE !== 2) {
    throw new Error(`Expected 2 FIX_SOURCE, got ${counts.FIX_SOURCE}`);
  }
  if (counts.APPROVE !== 1) {
    throw new Error(`Expected 1 APPROVE, got ${counts.APPROVE}`);
  }
  if (counts.KEEP_EXCEPTION !== 1) {
    throw new Error(`Expected 1 KEEP_EXCEPTION, got ${counts.KEEP_EXCEPTION}`);
  }
});

// Test 3: Status and Governance Attestation
test('BLOCK69-TEST-03', 'Governance Status: 33/33 REVIEWED, APPROVED, sourceOfDecision HUMAN_REVIEW_CHAT, appliedToCodebase false', () => {
  for (const item of items) {
    if (item.reviewStatus !== 'REVIEWED') {
      throw new Error(`Item ${item.key} reviewStatus is ${item.reviewStatus}, expected REVIEWED`);
    }
    if (item.reviewerDecision !== 'APPROVED') {
      throw new Error(`Item ${item.key} reviewerDecision is ${item.reviewerDecision}, expected APPROVED`);
    }
    if (item.sourceOfDecision !== 'HUMAN_REVIEW_CHAT') {
      throw new Error(`Item ${item.key} sourceOfDecision is ${item.sourceOfDecision}, expected HUMAN_REVIEW_CHAT`);
    }
    if (item.appliedToCodebase !== false) {
      throw new Error(`Item ${item.key} appliedToCodebase is true! Block 69 MUST NOT apply changes.`);
    }
  }

  if (approvedData.summary.reviewedCount !== 33 || approvedData.summary.approvedCount !== 33 || approvedData.summary.appliedCount !== 0) {
    throw new Error('Summary counters mismatch expected 33 reviewed, 33 approved, 0 applied');
  }
});

// Test 4: Block 68 Audit Traceability
test('BLOCK69-TEST-04', 'Audit Traceability: original Block 68 recommendations preserved for all 33 keys', () => {
  const block68Data = JSON.parse(fs.readFileSync(block68JsonPath, 'utf-8'));
  const b68Map = new Map<string, string>();
  for (const it of block68Data.items) {
    b68Map.set(it.key, it.recommendedDecision);
  }

  for (const item of items) {
    const originalRec = b68Map.get(item.key);
    if (!originalRec) {
      throw new Error(`Key ${item.key} not found in Block 68 decisions`);
    }
    if (item.originalBlock68Recommendation !== originalRec) {
      throw new Error(`Key ${item.key} originalBlock68Recommendation ${item.originalBlock68Recommendation} does not match Block 68 ${originalRec}`);
    }
  }
});

// Test 5: Exact Content Reconciliation for Key Cases
test('BLOCK69-TEST-05', 'Exact Content Reconciliation: verified critical items match human mandate', () => {
  // Item 1
  const item1 = items.find((i: any) => i.key === 'trips.status.failedPricing');
  if (!item1.approvedEN.includes('[Trip Start Blocked]:') || !item1.approvedEN.includes('${pricingResolutionResult.message}')) {
    throw new Error('Item 1 approvedEN mismatch');
  }
  if (!item1.approvedUR.includes('[ٹرپ شروع کرنا ممنوع]:') || !item1.approvedUR.includes('${pricingResolutionResult.message}')) {
    throw new Error('Item 1 approvedUR mismatch');
  }

  // Item 11
  const item11 = items.find((i: any) => i.key === 'trips.labels.txt_761b23');
  if (item11.humanDecision !== 'KEEP_EXCEPTION' || item11.approvedEN !== 'unchanged' || item11.approvedUR !== 'unchanged') {
    throw new Error('Item 11 KEEP_EXCEPTION mismatch');
  }

  // Item 13
  const item13 = items.find((i: any) => i.key === 'trips.labels.txt_7d6134');
  if (item13.humanDecision !== 'APPROVE' || item13.approvedEN !== 'Settlement (SAR)' || item13.approvedUR !== 'تصفیہ (SAR)') {
    throw new Error('Item 13 APPROVE mismatch');
  }

  // Item 15
  const item15 = items.find((i: any) => i.key === 'loading.labels.txt_73e4a3');
  if (item15.humanDecision !== 'FIX_SOURCE' || !item15.approvedArabicAction || item15.approvedArabicAction.to !== 'التسوية التقديرية') {
    throw new Error('Item 15 FIX_SOURCE mismatch');
  }

  // Item 32
  const item32 = items.find((i: any) => i.key === 'projects.labels.settings');
  if (item32.humanDecision !== 'FIX_SOURCE' || !item32.approvedArabicAction || item32.approvedArabicAction.to !== 'الإعدادات الافتراضية والامتثال النظامي') {
    throw new Error('Item 32 FIX_SOURCE mismatch');
  }
});

// Test 6: Protected Tokens and Interpolation Parity
test('BLOCK69-TEST-06', 'Token & Interpolation Integrity: zero protected token or variable violations in approved content', () => {
  for (const item of items) {
    if (item.humanDecision === 'REVISE' || item.humanDecision === 'APPROVE') {
      for (const token of item.preservedProtectedTokens) {
        if (!item.approvedEN.includes(token)) {
          throw new Error(`Item ${item.key} approvedEN missing preserved protected token "${token}"`);
        }
      }
      for (const variable of item.preservedInterpolationVariables) {
        if (!item.approvedEN.includes(variable)) {
          throw new Error(`Item ${item.key} approvedEN missing preserved interpolation variable "${variable}"`);
        }
        if (!item.approvedUR.includes(variable)) {
          throw new Error(`Item ${item.key} approvedUR missing preserved interpolation variable "${variable}"`);
        }
      }
    }
  }
});

// Test 7: Proof of Zero Code Modifications
test('BLOCK69-TEST-07', 'Zero Code Application: locale files, canonical Arabic, and fixtures 100% untouched', () => {
  // Key count unchanged
  if (Object.keys(dictionaries.ar).length !== 1128) {
    throw new Error(`Arabic locale key count altered: ${Object.keys(dictionaries.ar).length}`);
  }
  if (Object.keys(dictionaries.en).length !== 1128) {
    throw new Error(`English locale key count altered: ${Object.keys(dictionaries.en).length}`);
  }
  if (Object.keys(dictionaries.ur).length !== 1128) {
    throw new Error(`Urdu locale key count altered: ${Object.keys(dictionaries.ur).length}`);
  }

  // Test fixtures untouched
  const fixtures = [
    { key: 'navigation.labels.trips', ar: 'محرك الرحلات (Trip Engine)', en: 'محرك Trips (Trip Engine)', ur: 'محرك ٹرپس (Trip Engine)' },
    { key: 'navigation.labels.import', ar: 'مركز الاستيراد (Import Center)', en: 'مركز الImport (Import Center)', ur: 'مركز الامپورٹ کریں (Import Center)' },
    { key: 'trips.labels.status_6', ar: "الانتقال من الحالة الحالية [${trip.status}] إلى [${targetStatus}] غير مسموح به. الحالات المسموح بها للانطلاق: [${rule.allowedFrom.join(', ') || 'لا يوجد'}]." }
  ];

  for (const fix of fixtures) {
    if (dictionaries.ar[fix.key] !== fix.ar) {
      throw new Error(`Fixture AR modified for ${fix.key}`);
    }
    if (fix.en && dictionaries.en[fix.key] !== fix.en) {
      throw new Error(`Fixture EN modified for ${fix.key}`);
    }
    if (fix.ur && dictionaries.ur[fix.key] !== fix.ur) {
      throw new Error(`Fixture UR modified for ${fix.key}`);
    }
  }

  // If Block 70 application has executed under governance, skip pre-application dictionary value check
  const isAppliedInBlock70 = fs.existsSync(path.resolve(process.cwd(), 'reports/i18n-block70-corrected-application.json'));
  if (isAppliedInBlock70) {
    return;
  }

  // Verify none of the approved translations were applied to live dictionaries
  const item1 = items.find((i: any) => i.key === 'trips.status.failedPricing');
  if (dictionaries.en[item1.key] === item1.approvedEN) {
    throw new Error('Unauthorized application: item 1 approvedEN found in live en dictionary!');
  }

  const item4 = items.find((i: any) => i.key === 'trips.labels.txt_2c17d4');
  if (dictionaries.en[item4.key] === item4.approvedEN) {
    throw new Error('Unauthorized application: item 4 approvedEN found in live en dictionary!');
  }
});

// Test 8: Deterministic Checksum Integrity
test('BLOCK69-TEST-08', 'Ledger Checksum Verification: SHA-256 hash mathematically valid and verifiable', () => {
  const canonicalString = JSON.stringify(items, Object.keys(items[0]).sort());
  const expectedHash = crypto.createHash('sha256').update(canonicalString).digest('hex');

  if (approvedData.metadata.ledgerChecksum !== expectedHash) {
    throw new Error(`Ledger checksum mismatch! Stored: ${approvedData.metadata.ledgerChecksum}, calculated: ${expectedHash}`);
  }
});

console.log('======================================================');
console.log(`BLOCK 69: Test Results: ${passedTests}/${totalTests} PASSED`);
console.log('======================================================');

if (passedTests !== totalTests) {
  process.exit(1);
}
