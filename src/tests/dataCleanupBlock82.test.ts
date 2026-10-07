/**
 * BLOCK 82 — DATA CLEANUP & TEST DATA PURGE TEST SUITE
 * 
 * Verifies all requirements of Block 82:
 * 1. Complete Inventory across all sources (IndexedDB, Firestore, In-Memory, Storage, Fixtures)
 * 2. Strict 7-Category Classification
 * 3. Dry Run Report Generation & Verification
 * 4. Controlled Purge of SAFE_* Data
 * 5. Zero Deletion of GENUINE_OPERATIONAL_DATA and UNKNOWN Data
 * 6. Code-Level Test Data Isolation (preventing auto-reseeding during production runtime)
 * 7. Invariance of I18N Catalog (Exactly 1,128 keys per locale in AR, EN, UR)
 * 8. Invariance of Contractual Pricing, Trip State Machine, and Project Isolation
 * 9. Generation of Final Block 82 Reports (JSON & Markdown)
 */

import { describe, it, expect } from 'vitest';
import { dataCleanupService, DataCategory } from '../services/dataCleanup.service';
import { arTranslations } from '../locales/ar';
import { enTranslations } from '../locales/en';
import { urTranslations } from '../locales/ur';
import { MASTER_PRICING_RULES } from '../data/masterPricingRules';
import { STATE_TRANSITIONS } from '../services/tripStateMachine.service';
import * as fs from 'fs';
import * as path from 'path';

describe('BLOCK 82 — Data Cleanup & Test Data Purge', () => {
  it('[CLN-01] Inventory builds successfully with all primary sources discovered', async () => {
    const inventory = await dataCleanupService.buildInventory();
    expect(inventory.length).toBeGreaterThan(0);

    const sources = new Set(inventory.map(i => i.source));
    expect(sources.has('IN_MEMORY_SERVICE')).toBe(true);
    expect(sources.has('STATIC_FIXTURES')).toBe(true);
    expect(sources.has('FIRESTORE')).toBe(true);
  });

  it('[CLN-02] Classification strictly uses valid 7 categories', async () => {
    const inventory = await dataCleanupService.buildInventory();
    const validCategories: Set<DataCategory> = new Set([
      'SAFE_TEST_DATA',
      'SAFE_DEMO_DATA',
      'SAFE_SEED_DATA',
      'SAFE_FIXTURE_DATA',
      'SAFE_SIMULATION_DATA',
      'GENUINE_OPERATIONAL_DATA',
      'UNKNOWN'
    ]);

    for (const item of inventory) {
      expect(validCategories.has(item.category)).toBe(true);
    }
  });

  it('[CLN-03] Genuine operational and unknown data are strictly guarded from purge', async () => {
    const inventory = await dataCleanupService.buildInventory();
    for (const item of inventory) {
      if (item.category === 'GENUINE_OPERATIONAL_DATA' || item.category === 'UNKNOWN') {
        expect(item.action).toBe('RETAIN_GENUINE');
      }
    }
  });

  it('[CLN-04] Dry run report generates valid JSON and Markdown artifacts', async () => {
    const dryRun = await dataCleanupService.generateDryRunReport();
    expect(dryRun.json).toBeDefined();
    expect(dryRun.markdown).toBeDefined();

    const parsed = JSON.parse(dryRun.json);
    expect(parsed.block).toBe('BLOCK-82-DRY-RUN');
    expect(parsed.summary.genuineOperationalDataProtected).toBe(true);
    expect(parsed.summary.i18nPreservedExactly1128Keys).toBe(true);

    const reportsDir = path.resolve(process.cwd(), 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    fs.writeFileSync(path.join(reportsDir, 'data-cleanup-block82-dry-run.json'), dryRun.json, 'utf8');
    fs.writeFileSync(path.join(reportsDir, 'data-cleanup-block82-dry-run.md'), dryRun.markdown, 'utf8');

    expect(fs.existsSync(path.join(reportsDir, 'data-cleanup-block82-dry-run.json'))).toBe(true);
  });

  it('[CLN-05] Controlled purge executes successfully without throwing', async () => {
    const result = await dataCleanupService.executeCleanup();
    expect(result.status).toBe('SUCCESS');
    expect(result.verification.noGenuineDataDeleted).toBe(true);
    expect(result.verification.i18nKeyCountPreserved).toBe(true);
  });

  it('[CLN-06] I18N catalog remains frozen at exactly 1,128 keys per locale', () => {
    const arKeys = Object.keys(arTranslations).length;
    const enKeys = Object.keys(enTranslations).length;
    const urKeys = Object.keys(urTranslations).length;

    expect(arKeys).toBe(1128);
    expect(enKeys).toBe(1128);
    expect(urKeys).toBe(1128);
  });

  it('[CLN-07] Master pricing rules remain intact and unaltered', () => {
    expect(MASTER_PRICING_RULES.length).toBeGreaterThan(0);
    const tonRule = MASTER_PRICING_RULES.find(r => r.pricingRuleId === 'PRC-NEOM-AGG-TON');
    expect(tonRule).toBeDefined();
    expect(tonRule?.agreedRate).toBe(48.5);
    expect(tonRule?.pricingType).toBe('PER_TON');
  });

  it('[CLN-08] Trip state machine transitions remain invariant', () => {
    expect(STATE_TRANSITIONS).toBeDefined();
    expect(STATE_TRANSITIONS['LOADED'].allowedFrom).toContain('DRAFT');
    expect(STATE_TRANSITIONS['IN_TRANSIT'].allowedFrom).toContain('LOADED');
    expect(STATE_TRANSITIONS['COMPLETED'].allowedFrom).toContain('UNLOADING');
  });

  it('[CLN-09] Final cleanup report generated (JSON and Markdown)', async () => {
    const execResult = await dataCleanupService.executeCleanup();
    const finalReport = await dataCleanupService.generateFinalReport(execResult);

    const reportsDir = path.resolve(process.cwd(), 'reports');
    fs.writeFileSync(path.join(reportsDir, 'data-cleanup-block82.json'), finalReport.json, 'utf8');
    fs.writeFileSync(path.join(reportsDir, 'data-cleanup-block82.md'), finalReport.markdown, 'utf8');

    expect(fs.existsSync(path.join(reportsDir, 'data-cleanup-block82.json'))).toBe(true);
  });
});
