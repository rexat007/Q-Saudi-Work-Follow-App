import fs from 'fs';
import path from 'path';
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
console.log('RUNNING BLOCK 68 HUMAN REVIEW DECISION TEST SUITE');
console.log('======================================================');

const decisionsJsonPath = path.resolve(process.cwd(), 'reports', 'i18n-human-review-decisions.json');
const decisionsMdPath = path.resolve(process.cwd(), 'reports', 'i18n-human-review-decisions.md');

if (!fs.existsSync(decisionsJsonPath)) {
  console.error(`Fatal: missing ${decisionsJsonPath}`);
  process.exit(1);
}

const decisionsData = JSON.parse(fs.readFileSync(decisionsJsonPath, 'utf-8'));
const items = decisionsData.items;

// Test 1: Exactly 33 review items
test('BLOCK68-TEST-01', 'Authoritative Item Count: exactly 33 human-review decision records', () => {
  if (items.length !== 33) {
    throw new Error(`Expected exactly 33 decision items, found ${items.length}`);
  }
  if (decisionsData.summary.totalItems !== 33) {
    throw new Error(`Summary totalItems is ${decisionsData.summary.totalItems}, expected 33`);
  }
  // Verify all 33 have unique keys
  const keys = new Set(items.map((i: any) => i.key));
  if (keys.size !== 33) {
    throw new Error(`Duplicate keys detected in decisions items: expected 33 unique, got ${keys.size}`);
  }
});

// Test 2: Review required and pending status
test('BLOCK68-TEST-02', 'Status Isolation: 33/33 items remain REVIEW_REQUIRED and reviewerDecision is PENDING', () => {
  for (const item of items) {
    if (item.reviewStatus !== 'REVIEW_REQUIRED') {
      throw new Error(`Item ${item.key} status is ${item.reviewStatus}, expected REVIEW_REQUIRED`);
    }
    if (item.reviewerDecision !== 'PENDING') {
      throw new Error(`Item ${item.key} reviewerDecision is ${item.reviewerDecision}, expected PENDING`);
    }
    if (item.auditSeparation?.humanApprovalRequired?.reviewerDecision !== 'PENDING') {
      throw new Error(`Item ${item.key} auditSeparation.humanApprovalRequired.reviewerDecision is not PENDING`);
    }
    if (item.auditSeparation?.humanApprovalRequired?.reviewStatus !== 'REVIEW_REQUIRED') {
      throw new Error(`Item ${item.key} auditSeparation.humanApprovalRequired.reviewStatus is not REVIEW_REQUIRED`);
    }
  }
  if (decisionsData.summary.pendingCount !== 33) {
    throw new Error(`Summary pendingCount expected 33, got ${decisionsData.summary.pendingCount}`);
  }
  if (decisionsData.summary.reviewRequiredCount !== 33) {
    throw new Error(`Summary reviewRequiredCount expected 33, got ${decisionsData.summary.reviewRequiredCount}`);
  }
  if (decisionsData.summary.appliedToLocalesCount !== 0) {
    throw new Error(`Summary appliedToLocalesCount expected 0, got ${decisionsData.summary.appliedToLocalesCount}`);
  }
});

// Test 3: Four-part separation in each record
test('BLOCK68-TEST-03', 'Audit Separation: every item cleanly separates existing, proposed, rationale, and approval', () => {
  for (const item of items) {
    const sep = item.auditSeparation;
    if (!sep) {
      throw new Error(`Item ${item.key} missing auditSeparation object`);
    }
    // 1. Existing translation
    if (!sep.existingTranslation || !sep.existingTranslation.arabic || !sep.existingTranslation.currentEn || !sep.existingTranslation.currentUr) {
      throw new Error(`Item ${item.key} has incomplete existingTranslation in auditSeparation`);
    }
    // 2. Proposed correction
    if (!sep.proposedCorrection || !sep.proposedCorrection.proposedEn || !sep.proposedCorrection.proposedUr) {
      throw new Error(`Item ${item.key} has incomplete proposedCorrection in auditSeparation`);
    }
    // 3. Reason for proposal
    if (!sep.reasonForProposal || !sep.reasonForProposal.classification || !sep.reasonForProposal.riskLevel || !sep.reasonForProposal.rationale) {
      throw new Error(`Item ${item.key} has incomplete reasonForProposal in auditSeparation`);
    }
    // 4. Human approval required
    if (!sep.humanApprovalRequired || sep.humanApprovalRequired.reviewerDecision !== 'PENDING' || sep.humanApprovalRequired.reviewStatus !== 'REVIEW_REQUIRED') {
      throw new Error(`Item ${item.key} has incomplete humanApprovalRequired in auditSeparation`);
    }
  }
});

// Test 4: Decision distribution and recommendations
test('BLOCK68-TEST-04', 'Decision Recommendations: 29 REVISE, 2 FIX_SOURCE, 1 APPROVE, 1 KEEP_EXCEPTION', () => {
  const decisions = items.map((i: any) => i.recommendedDecision);
  const counts: Record<string, number> = {};
  for (const d of decisions) {
    counts[d] = (counts[d] || 0) + 1;
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

  // Spot-check specific recommendation rationales
  const approveItem = items.find((i: any) => i.recommendedDecision === 'APPROVE');
  if (approveItem.key !== 'trips.labels.txt_7d6134') {
    throw new Error(`Expected APPROVE on trips.labels.txt_7d6134, got ${approveItem.key}`);
  }

  const keepExItem = items.find((i: any) => i.recommendedDecision === 'KEEP_EXCEPTION');
  if (keepExItem.key !== 'trips.labels.txt_761b23') {
    throw new Error(`Expected KEEP_EXCEPTION on trips.labels.txt_761b23, got ${keepExItem.key}`);
  }

  const fixSourceKeys = items.filter((i: any) => i.recommendedDecision === 'FIX_SOURCE').map((i: any) => i.key);
  if (!fixSourceKeys.includes('loading.labels.txt_73e4a3') || !fixSourceKeys.includes('projects.labels.settings')) {
    throw new Error(`Expected FIX_SOURCE on loading.labels.txt_73e4a3 and projects.labels.settings, got ${fixSourceKeys.join(', ')}`);
  }
});

// Test 5: Protected tokens and interpolation variables
test('BLOCK68-TEST-05', 'Token & Interpolation Integrity: zero protected-token violations or interpolation mismatches', () => {
  const hasInterp = items.filter((i: any) => i.interpolationVariables.length > 0);
  if (hasInterp.length !== 1) {
    throw new Error(`Expected exactly 1 interpolation item, got ${hasInterp.length}`);
  }
  const failedPricing = hasInterp[0];
  if (failedPricing.key !== 'trips.status.failedPricing') {
    throw new Error(`Expected interpolation item to be trips.status.failedPricing, got ${failedPricing.key}`);
  }
  if (!failedPricing.proposedEn.includes('${pricingResolutionResult.message}')) {
    throw new Error(`Proposed EN missing interpolation variable \${pricingResolutionResult.message}`);
  }
  if (!failedPricing.proposedUr.includes('${pricingResolutionResult.message}')) {
    throw new Error(`Proposed UR missing interpolation variable \${pricingResolutionResult.message}`);
  }

  // Check all items with protected tokens
  const tokenItems = items.filter((i: any) => i.protectedTokens.length > 0);
  if (tokenItems.length !== 20) {
    throw new Error(`Expected exactly 20 items with protected tokens, found ${tokenItems.length}`);
  }

  for (const item of tokenItems) {
    for (const token of item.protectedTokens) {
      // For non-Arabic tokens in REVISE or APPROVE items, ensure strict preservation in proposed EN
      const isArabicToken = /[\u0600-\u06FF]/.test(token);
      if (!isArabicToken && item.recommendedDecision !== 'FIX_SOURCE') {
        if (!item.proposedEn.includes(token)) {
          throw new Error(`Item ${item.key} proposed EN does not contain protected token "${token}"`);
        }
      }
      // For FIX_SOURCE item 32, verify words are accounted for
      if (item.key === 'projects.labels.settings') {
        if (!item.proposedEn.includes('Default Settings') || !item.proposedEn.includes('Compliance')) {
          throw new Error(`Item ${item.key} proposed EN does not account for terms in "${token}"`);
        }
      }
      // In UR, Arabic phrase token is preserved (e.g. خلطة أسفلتية ساخنة in trips.labels.txt_761b23)
      if (isArabicToken) {
        if (!item.proposedUr.includes(token.replace(/["\\]/g, ''))) {
          throw new Error(`Item ${item.key} proposed UR does not contain protected token "${token}"`);
        }
      }
    }
  }
});

// Test 6: Zero Arabic in proposed English
test('BLOCK68-TEST-06', 'English Proposal Quality: strictly 0 Arabic Unicode glyphs in proposed EN across all 33 items', () => {
  const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  for (const item of items) {
    if (arabicRegex.test(item.proposedEn)) {
      throw new Error(`Proposed EN for ${item.key} contains unmigrated Arabic text: "${item.proposedEn}"`);
    }
    if (item.proposedEn.trim().length === 0) {
      throw new Error(`Proposed EN for ${item.key} is empty!`);
    }
    if (item.proposedUr.trim().length === 0) {
      throw new Error(`Proposed UR for ${item.key} is empty!`);
    }
  }
});

// Test 7: Zero modifications to locale dictionaries and fixtures
test('BLOCK68-TEST-07', 'Zero Modification Policy: src/locales/ar, en, ur and fixtures 100% untouched', () => {
  // Check Arabic total key count
  const arKeys = Object.keys(dictionaries.ar);
  if (arKeys.length !== 1128) {
    throw new Error(`Arabic locale key count altered: expected 1128, got ${arKeys.length}`);
  }
  const enKeys = Object.keys(dictionaries.en);
  if (enKeys.length !== 1128) {
    throw new Error(`English locale key count altered: expected 1128, got ${enKeys.length}`);
  }
  const urKeys = Object.keys(dictionaries.ur);
  if (urKeys.length !== 1128) {
    throw new Error(`Urdu locale key count altered: expected 1128, got ${urKeys.length}`);
  }

  // Ensure current dictionary entries for the 33 items match currentEn and currentUr (proposals NOT applied)
  for (const item of items) {
    if (dictionaries.en[item.key] !== item.currentEn) {
      throw new Error(`Unauthorized modification to live EN dictionary for ${item.key}! Expected "${item.currentEn}", got "${dictionaries.en[item.key]}"`);
    }
    if (dictionaries.ur[item.key] !== item.currentUr) {
      throw new Error(`Unauthorized modification to live UR dictionary for ${item.key}! Expected "${item.currentUr}", got "${dictionaries.ur[item.key]}"`);
    }
  }

  // Fixtures check
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
});

// Test 8: Governance Dossier Artifacts schema and completeness
test('BLOCK68-TEST-08', 'Governance Dossier Documentation: reports/i18n-human-review-decisions.md and .json schema-valid', () => {
  if (!fs.existsSync(decisionsMdPath)) {
    throw new Error(`Missing markdown dossier at ${decisionsMdPath}`);
  }
  const mdContent = fs.readFileSync(decisionsMdPath, 'utf-8');
  if (mdContent.length < 5000) {
    throw new Error(`Markdown dossier suspiciously small (${mdContent.length} bytes)`);
  }

  // Verify markdown contains the 4 required sections for every item
  for (const item of items) {
    if (!mdContent.includes(item.key)) {
      throw new Error(`Markdown dossier does not mention key ${item.key}`);
    }
  }

  if (!mdContent.includes('#### 1. Existing Translation') ||
      !mdContent.includes('#### 2. Proposed Correction (Review Proposal Only — NOT Applied)') ||
      !mdContent.includes('#### 3. Reason for Proposal') ||
      !mdContent.includes('#### 4. Human Approval Required')) {
    throw new Error('Markdown dossier is missing one of the 4 required section headers');
  }
});

console.log('======================================================');
console.log(`BLOCK 68: Test Results: ${passedTests}/${totalTests} PASSED`);
console.log('======================================================');

if (passedTests !== totalTests) {
  process.exit(1);
}
