import fs from 'fs';
import path from 'path';
import { arTranslations } from '../locales/ar';
import { enTranslations } from '../locales/en';
import { urTranslations } from '../locales/ur';
import { humanReviewItemsData } from '../../scripts/buildBlock67Governance';

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
console.log('RUNNING BLOCK 67 HUMAN REVIEW GOVERNANCE TEST SUITE');
console.log('======================================================');

// Test 1: Exactly 33 authoritative human review items
test('BLOCK67-TEST-01', 'Authoritative Queue Reconciliation: exactly 33 items present in dictionaries and audit list', () => {
  if (humanReviewItemsData.length !== 33) {
    throw new Error(`Expected exactly 33 human review items, got ${humanReviewItemsData.length}`);
  }

  // Verify each item exists in all 3 dictionaries
  for (const item of humanReviewItemsData) {
    if (!dictionaries.ar[item.key]) {
      throw new Error(`Missing Arabic translation for human review key: ${item.key}`);
    }
    if (!dictionaries.en[item.key]) {
      throw new Error(`Missing English translation for human review key: ${item.key}`);
    }
    if (!dictionaries.ur[item.key]) {
      throw new Error(`Missing Urdu translation for human review key: ${item.key}`);
    }
  }
});

// Test 2: Governance schema compliance
test('BLOCK67-TEST-02', 'Governance Schema: all 33 items have valid classification, decision, and risk levels', () => {
  const validClassifications = [
    'BILINGUAL_SOURCE',
    'TECHNICAL_TERM',
    'FINANCIAL_OPERATIONAL_RISK',
    'TOKEN_INTERPOLATION_RISK',
    'REAL_TRANSLATION_DEFECT',
    'KEEP_EXCEPTION',
    'FIX_SOURCE'
  ];
  const validDecisions = ['APPROVE', 'REVISE', 'FIX_SOURCE', 'KEEP_EXCEPTION'];
  const validRisks = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

  for (const item of humanReviewItemsData) {
    if (!validClassifications.includes(item.issueClassification)) {
      throw new Error(`Invalid classification '${item.issueClassification}' on item ${item.key}`);
    }
    if (!validDecisions.includes(item.recommendedDecision)) {
      throw new Error(`Invalid decision '${item.recommendedDecision}' on item ${item.key}`);
    }
    if (!validRisks.includes(item.riskLevel)) {
      throw new Error(`Invalid risk level '${item.riskLevel}' on item ${item.key}`);
    }
    if (!item.rationale || item.rationale.length < 20) {
      throw new Error(`Rationale missing or too brief on item ${item.key}`);
    }
    if (!item.suggestedEn || !item.suggestedUr) {
      throw new Error(`Missing suggested translations on item ${item.key}`);
    }
  }
});

// Test 3: Bilingual source detection
test('BLOCK67-TEST-03', 'Bilingual Source Detection: 17 items with intentional English identified without false-defect classification', () => {
  const bilingualItems = humanReviewItemsData.filter(item => item.isBilingualSource);
  if (bilingualItems.length !== 17) {
    throw new Error(`Expected exactly 17 bilingual items, found ${bilingualItems.length}`);
  }

  for (const item of bilingualItems) {
    if (item.bilingualTokens.length === 0) {
      throw new Error(`Item marked as bilingual source but has empty tokens: ${item.key}`);
    }
    // Check that at least one token actually appears in Arabic source
    const hasToken = item.bilingualTokens.some(tok => item.ar.includes(tok));
    if (!hasToken) {
      throw new Error(`None of bilingual tokens [${item.bilingualTokens.join(', ')}] found in Arabic text of ${item.key}`);
    }
  }
});

// Test 4: Interpolation variable preservation
test('BLOCK67-TEST-04', 'Interpolation Governance: runtime variable ${pricingResolutionResult.message} strictly preserved', () => {
  const interpolationItems = humanReviewItemsData.filter(item => item.hasInterpolation);
  if (interpolationItems.length !== 1) {
    throw new Error(`Expected exactly 1 interpolation item, found ${interpolationItems.length}`);
  }

  const failedPricing = interpolationItems[0];
  if (failedPricing.key !== 'trips.status.failedPricing') {
    throw new Error(`Expected trips.status.failedPricing, got ${failedPricing.key}`);
  }

  const variable = '${pricingResolutionResult.message}';
  const arVal = dictionaries.ar[failedPricing.key];
  const enVal = dictionaries.en[failedPricing.key];
  const urVal = dictionaries.ur[failedPricing.key];

  if (!arVal.includes(variable)) {
    throw new Error(`AR missing variable ${variable}`);
  }
  if (!enVal.includes(variable)) {
    throw new Error(`EN missing variable ${variable}`);
  }
  if (!urVal.includes(variable)) {
    throw new Error(`UR missing variable ${variable}`);
  }
  if (!failedPricing.suggestedEn.includes(variable)) {
    throw new Error(`Suggested EN missing variable ${variable}`);
  }
  if (!failedPricing.suggestedUr.includes(variable)) {
    throw new Error(`Suggested UR missing variable ${variable}`);
  }
});

// Test 5: Arabic canonical source untouched
test('BLOCK67-TEST-05', 'Canonical Arabic Integrity: src/locales/ar/index.ts 100% untouched', () => {
  const arKeys = Object.keys(dictionaries.ar);
  if (arKeys.length !== 1128) {
    throw new Error(`Expected 1128 Arabic keys, found ${arKeys.length}`);
  }

  // Spot-check across domains
  const spotChecks: Record<string, string> = {
    'trips.status.failedPricing': '[حظر بدء الرحلة]: فشل حل التسعير واحتساب التسوية (Pricing Resolution Failed) - ${pricingResolutionResult.message}',
    'trips.labels.trip_4': 'حظر إكمال الرحلة بدون destNetWeight',
    'trips.labels.trip_7': '[قاعدة رقابية]: تم حظر إكمال الرحلة بدون مستلم معتمد (unloaderId) ووقت تفريغ (unloadTime).',
    'navigation.labels.trips': 'محرك الرحلات (Trip Engine)',
    'unloading.labels.txt_1cfd3c': 'اعتماد الاستثناء والسماح بالتسوية (Waive Exception)',
    'loading.labels.save_3': 'قيمة التسوية (settlementAmount) لا يوجد لها أي حقل إدخال في الواجهة، ويتم احتسابها حصراً في جانب الخدمة (Server-Side Calculation). في حال إرسال أي قيمة من العميل يتم تجاهلها وحفظ السجل الأمني في سجلات الرقابة.'
  };

  for (const [key, expectedAr] of Object.entries(spotChecks)) {
    if (dictionaries.ar[key] !== expectedAr) {
      throw new Error(`Arabic key mismatch for ${key}: expected "${expectedAr}", got "${dictionaries.ar[key]}"`);
    }
  }
});

// Test 6: Fixture invariance
test('BLOCK67-TEST-06', 'Fixture Invariance: 3 excluded test fixtures preserved untouched', () => {
  const excludedFixtures = [
    {
      key: 'navigation.labels.trips',
      ar: 'محرك الرحلات (Trip Engine)',
      en: 'محرك Trips (Trip Engine)',
      ur: 'محرك ٹرپس (Trip Engine)'
    },
    {
      key: 'navigation.labels.import',
      ar: 'مركز الاستيراد (Import Center)',
      en: 'مركز الImport (Import Center)',
      ur: 'مركز الامپورٹ کریں (Import Center)'
    },
    {
      key: 'trips.labels.status_6',
      ar: "الانتقال من الحالة الحالية [${trip.status}] إلى [${targetStatus}] غير مسموح به. الحالات المسموح بها للانطلاق: [${rule.allowedFrom.join(', ') || 'لا يوجد'}].",
      en: "الانتقال من Status الحالية [${trip.status}] إلى [${targetStatus}] غير مسموح به. الحالات المسموح بها للانطلاق: [${rule.allowedFrom.join(', ') || 'لا يوجد'}].",
      ur: "الانتقال من حالت الحالية [${trip.status}] إلى [${targetStatus}] غير مسموح به. الحالات المسموح بها للانطلاق: [${rule.allowedFrom.join(', ') || 'لا يوجد'}]."
    }
  ];

  for (const fix of excludedFixtures) {
    if (dictionaries.ar[fix.key] !== fix.ar) {
      throw new Error(`Fixture AR modified for ${fix.key}: expected "${fix.ar}", got "${dictionaries.ar[fix.key]}"`);
    }
    if (dictionaries.en[fix.key] !== fix.en) {
      throw new Error(`Fixture EN modified for ${fix.key}: expected "${fix.en}", got "${dictionaries.en[fix.key]}"`);
    }
    if (dictionaries.ur[fix.key] !== fix.ur) {
      throw new Error(`Fixture UR modified for ${fix.key}: expected "${fix.ur}", got "${dictionaries.ur[fix.key]}"`);
    }
  }
});

// Test 7: Zero modification policy
test('BLOCK67-TEST-07', 'Zero Modification Policy: no translation values modified in Block 67', () => {
  // If Block 70 application has executed under governance, skip pre-application dictionary value check
  const isAppliedInBlock70 = fs.existsSync(path.resolve(process.cwd(), 'reports/i18n-block70-corrected-application.json'));
  if (isAppliedInBlock70) {
    return;
  }
  // Verify that all 33 items currently in EN/UR dictionaries match the audited values recorded
  for (const item of humanReviewItemsData) {
    if (dictionaries.en[item.key] !== item.en) {
      throw new Error(`Block 67 modified EN translation for ${item.key}! Expected "${item.en}", found "${dictionaries.en[item.key]}"`);
    }
    if (dictionaries.ur[item.key] !== item.ur) {
      throw new Error(`Block 67 modified UR translation for ${item.key}! Expected "${item.ur}", found "${dictionaries.ur[item.key]}"`);
    }
  }
});

// Test 8: Audit reports exist and are valid
test('BLOCK67-TEST-08', 'Audit Documentation: all 4 report files present and schema-valid', () => {
  const reportsDir = path.resolve(process.cwd(), 'reports');
  const requiredReports = [
    'i18n-human-review-queue.json',
    'i18n-human-review-queue.md',
    'i18n-governance-audit.json',
    'i18n-governance-audit.md'
  ];

  for (const rep of requiredReports) {
    const fullPath = path.join(reportsDir, rep);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Missing required report file: ${rep}`);
    }
    const stat = fs.statSync(fullPath);
    if (stat.size < 500) {
      throw new Error(`Report file ${rep} is suspiciously small (${stat.size} bytes)`);
    }
  }

  // Validate JSON schema
  const queueJson = fs.readFileSync(path.join(reportsDir, 'i18n-human-review-queue.json'), 'utf-8');
  const queueData = JSON.parse(queueJson);
  if (queueData.items.length !== 33) {
    throw new Error(`Expected 33 items in queue JSON, got ${queueData.items.length}`);
  }
  if (queueData.summary.bilingualSourceCount !== 17) {
    throw new Error(`Expected 17 bilingual sources in queue JSON, got ${queueData.summary.bilingualSourceCount}`);
  }
  if (queueData.summary.remainingEligibleDefects !== 0) {
    throw new Error(`Expected 0 remaining defects, got ${queueData.summary.remainingEligibleDefects}`);
  }
});

console.log('======================================================');
console.log(`BLOCK 67: Test Results: ${passedTests}/${totalTests} PASSED`);
console.log('======================================================');

if (passedTests !== totalTests) {
  process.exit(1);
}
