import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { describe, it, expect } from 'vitest';

describe('Block 69 Human Review Approval Test Suite', () => {
  const approvedJsonPath = path.resolve(process.cwd(), 'reports', 'i18n-human-approved-decisions.json');
  const approvedMdPath = path.resolve(process.cwd(), 'reports', 'i18n-human-approved-decisions.md');
  const block68JsonPath = path.resolve(process.cwd(), 'reports', 'i18n-human-review-decisions.json');

  if (!fs.existsSync(approvedJsonPath) || !fs.existsSync(approvedMdPath)) {
    throw new Error('Fatal: Missing Block 69 approval report artifacts');
  }

  const approvedData = JSON.parse(fs.readFileSync(approvedJsonPath, 'utf-8'));
  const items = approvedData.items;

  // Test 1: Exactly 33 Human Review Records
  it('BLOCK69-TEST-01: Authoritative Ledger Count: exactly 33 human-approved decision records', () => {
    expect(items).toHaveLength(33);
    expect(approvedData.summary.totalItems).toBe(33);

    const uniqueKeys = new Set(items.map((i: any) => i.key));
    expect(uniqueKeys.size).toBe(33);
  });

  // Test 2: Decision Breakdown Reconciliation
  it('BLOCK69-TEST-02: Decision Breakdown: exactly 29 REVISE, 2 FIX_SOURCE, 1 APPROVE, 1 KEEP_EXCEPTION', () => {
    const counts: Record<string, number> = {};
    for (const item of items) {
      counts[item.humanDecision] = (counts[item.humanDecision] || 0) + 1;
    }

    expect(counts.REVISE).toBe(29);
    expect(counts.FIX_SOURCE).toBe(2);
    expect(counts.APPROVE).toBe(1);
    expect(counts.KEEP_EXCEPTION).toBe(1);
  });

  // Test 3: Status and Governance Attestation
  it('BLOCK69-TEST-03: Governance Status: 33/33 REVIEWED, APPROVED, sourceOfDecision HUMAN_REVIEW_CHAT, appliedToCodebase false', () => {
    for (const item of items) {
      expect(item.reviewStatus).toBe('REVIEWED');
      expect(item.reviewerDecision).toBe('APPROVED');
      expect(item.sourceOfDecision).toBe('HUMAN_REVIEW_CHAT');
      expect(item.appliedToCodebase).toBe(false);
    }

    expect(approvedData.summary.reviewedCount).toBe(33);
    expect(approvedData.summary.approvedCount).toBe(33);
    expect(approvedData.summary.appliedCount).toBe(0);
  });

  // Test 4: Block 68 Audit Traceability
  it('BLOCK69-TEST-04: Audit Traceability: original Block 68 recommendations preserved for all 33 keys', () => {
    const block68Data = JSON.parse(fs.readFileSync(block68JsonPath, 'utf-8'));
    const b68Map = new Map<string, string>();
    for (const it of block68Data.items) {
      b68Map.set(it.key, it.recommendedDecision);
    }

    for (const item of items) {
      const originalRec = b68Map.get(item.key);
      expect(originalRec).toBeDefined();
      expect(item.originalBlock68Recommendation).toBe(originalRec);
    }
  });

  // Test 5: Exact Content Reconciliation for Key Cases
  it('BLOCK69-TEST-05: Exact Content Reconciliation: verified critical items match human mandate', () => {
    // Item 1
    const item1 = items.find((i: any) => i.key === 'trips.status.failedPricing');
    expect(item1.approvedEN).toContain('[Trip Start Blocked]:');
    expect(item1.approvedEN).toContain('${pricingResolutionResult.message}');
    expect(item1.approvedUR).toContain('[ٹرپ شروع کرنا ممنوع]:');
    expect(item1.approvedUR).toContain('${pricingResolutionResult.message}');

    // Item 11
    const item11 = items.find((i: any) => i.key === 'trips.labels.txt_761b23');
    expect(item11.humanDecision).toBe('KEEP_EXCEPTION');
    expect(item11.approvedEN).toBe('unchanged');
    expect(item11.approvedUR).toBe('unchanged');

    // Item 13
    const item13 = items.find((i: any) => i.key === 'trips.labels.txt_7d6134');
    expect(item13.humanDecision).toBe('APPROVE');
    expect(item13.approvedEN).toBe('Settlement (SAR)');
    expect(item13.approvedUR).toBe('تصفیہ (SAR)');

    // Item 15
    const item15 = items.find((i: any) => i.key === 'loading.labels.txt_73e4a3');
    expect(item15.humanDecision).toBe('FIX_SOURCE');
    expect(item15.approvedArabicAction).toBeDefined();
    expect(item15.approvedArabicAction.to).toBe('التسوية التقديرية');

    // Item 32
    const item32 = items.find((i: any) => i.key === 'projects.labels.settings');
    expect(item32.humanDecision).toBe('FIX_SOURCE');
    expect(item32.approvedArabicAction).toBeDefined();
    expect(item32.approvedArabicAction.to).toBe('الإعدادات الافتراضية والامتثال النظامي');
  });

  // Test 6: Protected Tokens and Interpolation Parity
  it('BLOCK69-TEST-06: Token & Interpolation Integrity: zero protected token or variable violations in approved content', () => {
    for (const item of items) {
      if (item.humanDecision === 'REVISE' || item.humanDecision === 'APPROVE') {
        for (const token of item.preservedProtectedTokens) {
          expect(item.approvedEN).toContain(token);
        }
        for (const variable of item.preservedInterpolationVariables) {
          expect(item.approvedEN).toContain(variable);
          expect(item.approvedUR).toContain(variable);
        }
      }
    }
  });

  // Test 8: Deterministic Checksum Integrity
  it('BLOCK69-TEST-08: Ledger Checksum Verification: SHA-256 hash mathematically valid and verifiable', () => {
    const canonicalString = JSON.stringify(items, Object.keys(items[0]).sort());
    const expectedHash = crypto.createHash('sha256').update(canonicalString).digest('hex');

    expect(approvedData.metadata.ledgerChecksum).toBe(expectedHash);
  });
});
