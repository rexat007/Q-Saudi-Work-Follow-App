import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';
import { arTranslations } from '../locales/ar';
import { enTranslations } from '../locales/en';
import { urTranslations } from '../locales/ur';
import { humanReviewItemsData } from '../../scripts/buildBlock67Governance';

const dictionaries = {
  ar: arTranslations,
  en: enTranslations,
  ur: urTranslations
};

describe('Block 67 Human Review Governance Test Suite', () => {
  // Test 1: Exactly 33 authoritative human review items
  it('BLOCK67-TEST-01: Authoritative Queue Reconciliation: exactly 33 items present in dictionaries and audit list', () => {
    expect(humanReviewItemsData).toHaveLength(33);

    // Verify each item exists in all 3 dictionaries
    for (const item of humanReviewItemsData) {
      expect(dictionaries.ar[item.key]).toBeDefined();
      expect(dictionaries.ar[item.key].trim().length).toBeGreaterThan(0);
      expect(dictionaries.en[item.key]).toBeDefined();
      expect(dictionaries.en[item.key].trim().length).toBeGreaterThan(0);
      expect(dictionaries.ur[item.key]).toBeDefined();
      expect(dictionaries.ur[item.key].trim().length).toBeGreaterThan(0);
    }
  });

  // Test 2: Governance schema compliance
  it('BLOCK67-TEST-02: Governance Schema: all 33 items have valid classification, decision, and risk levels', () => {
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
      expect(validClassifications).toContain(item.issueClassification);
      expect(validDecisions).toContain(item.recommendedDecision);
      expect(validRisks).toContain(item.riskLevel);
      expect(item.rationale).toBeDefined();
      expect(item.rationale.length).toBeGreaterThanOrEqual(20);
      expect(item.suggestedEn).toBeDefined();
      expect(item.suggestedEn.trim().length).toBeGreaterThan(0);
      expect(item.suggestedUr).toBeDefined();
      expect(item.suggestedUr.trim().length).toBeGreaterThan(0);
    }
  });

  // Test 3: Bilingual source detection
  it('BLOCK67-TEST-03: Bilingual Source Detection: 17 items with intentional English identified without false-defect classification', () => {
    const bilingualItems = humanReviewItemsData.filter((item) => item.isBilingualSource);
    expect(bilingualItems).toHaveLength(17);

    for (const item of bilingualItems) {
      expect(item.bilingualTokens.length).toBeGreaterThan(0);
      const hasToken = item.bilingualTokens.some((tok) => item.ar.includes(tok));
      expect(hasToken).toBe(true);
    }
  });

  // Test 4: Interpolation variable preservation
  it('BLOCK67-TEST-04: Interpolation Governance: runtime variable ${pricingResolutionResult.message} strictly preserved', () => {
    const interpolationItems = humanReviewItemsData.filter((item) => item.hasInterpolation);
    expect(interpolationItems).toHaveLength(1);

    const failedPricing = interpolationItems[0];
    expect(failedPricing.key).toBe('trips.status.failedPricing');

    const variable = '${pricingResolutionResult.message}';
    const arVal = dictionaries.ar[failedPricing.key];
    const enVal = dictionaries.en[failedPricing.key];
    const urVal = dictionaries.ur[failedPricing.key];

    expect(arVal).toContain(variable);
    expect(enVal).toContain(variable);
    expect(urVal).toContain(variable);
    expect(failedPricing.suggestedEn).toContain(variable);
    expect(failedPricing.suggestedUr).toContain(variable);
  });

  // Test 5: Arabic canonical source untouched
  it('BLOCK67-TEST-05: Canonical Arabic Integrity: verified canonical reference keys preserved in src/locales/ar/index.ts', () => {
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
      expect(dictionaries.ar[key]).toBe(expectedAr);
    }
  });

  // Test 8: Audit reports exist and are valid
  it('BLOCK67-TEST-08: Audit Documentation: all 4 report files present and schema-valid', () => {
    const reportsDir = path.resolve(process.cwd(), 'reports');
    const requiredReports = [
      'i18n-human-review-queue.json',
      'i18n-human-review-queue.md',
      'i18n-governance-audit.json',
      'i18n-governance-audit.md'
    ];

    for (const rep of requiredReports) {
      const fullPath = path.join(reportsDir, rep);
      expect(fs.existsSync(fullPath)).toBe(true);
      const stat = fs.statSync(fullPath);
      expect(stat.size).toBeGreaterThanOrEqual(500);
    }

    // Validate JSON schema
    const queueJson = fs.readFileSync(path.join(reportsDir, 'i18n-human-review-queue.json'), 'utf-8');
    const queueData = JSON.parse(queueJson);
    expect(queueData.items).toHaveLength(33);
    expect(queueData.summary.bilingualSourceCount).toBe(17);
    expect(queueData.summary.remainingEligibleDefects).toBe(0);
  });
});
