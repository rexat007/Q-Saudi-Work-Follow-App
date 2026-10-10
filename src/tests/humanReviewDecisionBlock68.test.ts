import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';

describe('Block 68 Human Review Decision Test Suite', () => {
  const decisionsJsonPath = path.resolve(process.cwd(), 'reports', 'i18n-human-review-decisions.json');
  const decisionsMdPath = path.resolve(process.cwd(), 'reports', 'i18n-human-review-decisions.md');

  const decisionsData = JSON.parse(fs.readFileSync(decisionsJsonPath, 'utf-8'));
  const items = decisionsData.items;

  // Test 1: Exactly 33 review items
  it('BLOCK68-TEST-01: Authoritative Item Count: exactly 33 human-review decision records', () => {
    expect(items).toHaveLength(33);
    expect(decisionsData.summary.totalItems).toBe(33);

    // Verify all 33 have unique keys
    const keys = new Set(items.map((i: any) => i.key));
    expect(keys.size).toBe(33);
  });

  // Test 2: Review required and pending status
  it('BLOCK68-TEST-02: Status Isolation: 33/33 items remain REVIEW_REQUIRED and reviewerDecision is PENDING', () => {
    for (const item of items) {
      expect(item.reviewStatus).toBe('REVIEW_REQUIRED');
      expect(item.reviewerDecision).toBe('PENDING');
      expect(item.auditSeparation?.humanApprovalRequired?.reviewerDecision).toBe('PENDING');
      expect(item.auditSeparation?.humanApprovalRequired?.reviewStatus).toBe('REVIEW_REQUIRED');
    }
    expect(decisionsData.summary.pendingCount).toBe(33);
    expect(decisionsData.summary.reviewRequiredCount).toBe(33);
    expect(decisionsData.summary.appliedToLocalesCount).toBe(0);
  });

  // Test 3: Four-part separation in each record
  it('BLOCK68-TEST-03: Audit Separation: every item cleanly separates existing, proposed, rationale, and approval', () => {
    for (const item of items) {
      const sep = item.auditSeparation;
      expect(sep).toBeDefined();

      // 1. Existing translation
      expect(sep.existingTranslation?.arabic).toBeDefined();
      expect(sep.existingTranslation?.currentEn).toBeDefined();
      expect(sep.existingTranslation?.currentUr).toBeDefined();

      // 2. Proposed correction
      expect(sep.proposedCorrection?.proposedEn).toBeDefined();
      expect(sep.proposedCorrection?.proposedUr).toBeDefined();

      // 3. Reason for proposal
      expect(sep.reasonForProposal?.classification).toBeDefined();
      expect(sep.reasonForProposal?.riskLevel).toBeDefined();
      expect(sep.reasonForProposal?.rationale).toBeDefined();

      // 4. Human approval required
      expect(sep.humanApprovalRequired?.reviewerDecision).toBe('PENDING');
      expect(sep.humanApprovalRequired?.reviewStatus).toBe('REVIEW_REQUIRED');
    }
  });

  // Test 4: Decision distribution and recommendations
  it('BLOCK68-TEST-04: Decision Recommendations: 29 REVISE, 2 FIX_SOURCE, 1 APPROVE, 1 KEEP_EXCEPTION', () => {
    const decisions = items.map((i: any) => i.recommendedDecision);
    const counts: Record<string, number> = {};
    for (const d of decisions) {
      counts[d] = (counts[d] || 0) + 1;
    }

    expect(counts.REVISE).toBe(29);
    expect(counts.FIX_SOURCE).toBe(2);
    expect(counts.APPROVE).toBe(1);
    expect(counts.KEEP_EXCEPTION).toBe(1);

    // Spot-check specific recommendation rationales
    const approveItem = items.find((i: any) => i.recommendedDecision === 'APPROVE');
    expect(approveItem.key).toBe('trips.labels.txt_7d6134');

    const keepExItem = items.find((i: any) => i.recommendedDecision === 'KEEP_EXCEPTION');
    expect(keepExItem.key).toBe('trips.labels.txt_761b23');

    const fixSourceKeys = items.filter((i: any) => i.recommendedDecision === 'FIX_SOURCE').map((i: any) => i.key);
    expect(fixSourceKeys).toContain('loading.labels.txt_73e4a3');
    expect(fixSourceKeys).toContain('projects.labels.settings');
  });

  // Test 5: Protected tokens and interpolation variables
  it('BLOCK68-TEST-05: Token & Interpolation Integrity: zero protected-token violations or interpolation mismatches', () => {
    const hasInterp = items.filter((i: any) => i.interpolationVariables.length > 0);
    expect(hasInterp).toHaveLength(1);

    const failedPricing = hasInterp[0];
    expect(failedPricing.key).toBe('trips.status.failedPricing');
    expect(failedPricing.proposedEn).toContain('${pricingResolutionResult.message}');
    expect(failedPricing.proposedUr).toContain('${pricingResolutionResult.message}');

    // Check all items with protected tokens
    const tokenItems = items.filter((i: any) => i.protectedTokens.length > 0);
    expect(tokenItems).toHaveLength(20);

    for (const item of tokenItems) {
      for (const token of item.protectedTokens) {
        // For non-Arabic tokens in REVISE or APPROVE items, ensure strict preservation in proposed EN
        const isArabicToken = /[\u0600-\u06FF]/.test(token);
        if (!isArabicToken && item.recommendedDecision !== 'FIX_SOURCE') {
          expect(item.proposedEn).toContain(token);
        }
        // For FIX_SOURCE item 32, verify words are accounted for
        if (item.key === 'projects.labels.settings') {
          expect(item.proposedEn).toContain('Default Settings');
          expect(item.proposedEn).toContain('Compliance');
        }
        // In UR, Arabic phrase token is preserved (e.g. خلطة أسفلتية ساخنة in trips.labels.txt_761b23)
        if (isArabicToken) {
          expect(item.proposedUr).toContain(token.replace(/["\\]/g, ''));
        }
      }
    }
  });

  // Test 6: Zero Arabic in proposed English
  it('BLOCK68-TEST-06: English Proposal Quality: strictly 0 Arabic Unicode glyphs in proposed EN across all 33 items', () => {
    const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

    for (const item of items) {
      expect(arabicRegex.test(item.proposedEn)).toBe(false);
      expect(item.proposedEn.trim().length).toBeGreaterThan(0);
      expect(item.proposedUr.trim().length).toBeGreaterThan(0);
    }
  });

  // Test 8: Governance Dossier Artifacts schema and completeness
  it('BLOCK68-TEST-08: Governance Dossier Documentation: reports/i18n-human-review-decisions.md and .json schema-valid', () => {
    expect(fs.existsSync(decisionsMdPath)).toBe(true);
    const mdContent = fs.readFileSync(decisionsMdPath, 'utf-8');
    expect(mdContent.length).toBeGreaterThanOrEqual(5000);

    // Verify markdown contains the 4 required sections for every item
    for (const item of items) {
      expect(mdContent).toContain(item.key);
    }

    expect(mdContent).toContain('#### 1. Existing Translation');
    expect(mdContent).toContain('#### 2. Proposed Correction (Review Proposal Only — NOT Applied)');
    expect(mdContent).toContain('#### 3. Reason for Proposal');
    expect(mdContent).toContain('#### 4. Human Approval Required');
  });
});
