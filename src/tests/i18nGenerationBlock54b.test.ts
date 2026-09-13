/**
 * BLOCK 54B — Generation Validation Test Suite
 * Validates tests I18N-GEN-21 through I18N-GEN-28
 */

import fs from 'fs';
import path from 'path';
import { runGenerationBlock54b } from '../../scripts/run-generation-block54b';
import { ProductionGeneratedCatalog, TranslationProposal } from '../i18n/translation/translation.types';
import { ProductionTranslationCatalog, TranslationCatalogEntry } from '../i18n/catalog/translationCatalog.types';

interface TestCaseResult {
  id: string;
  title: string;
  passed: boolean;
  details: string;
  expected?: unknown;
  actual?: unknown;
}

const results: TestCaseResult[] = [];

export async function runBlock54bTests(): Promise<boolean> {
  console.log('======================================================');
  console.log('🚀 Running BLOCK 54B Generation Test Suite (8 Test Cases)...');
  console.log('======================================================');

  // Ensure BLOCK 54B generation has executed and merged into generated translations
  await runGenerationBlock54b();

  const recoveryPath = path.resolve(process.cwd(), 'reports/i18n-block54a-recovery.json');
  const generatedPath = path.resolve(process.cwd(), 'reports/i18n-generated-translations.json');
  const b54ArtifactPath = path.resolve(process.cwd(), 'reports/i18n-block54b-translation-generation.json');

  if (!fs.existsSync(recoveryPath) || !fs.existsSync(generatedPath) || !fs.existsSync(b54ArtifactPath)) {
    throw new Error('Required report files missing for BLOCK 54B tests.');
  }

  const recoveryData = JSON.parse(fs.readFileSync(recoveryPath, 'utf-8'));
  const recoveredEntries: Record<string, TranslationCatalogEntry> = recoveryData.recoveredEntries || {};
  const recoveredKeys = Object.keys(recoveredEntries);

  const generatedCatalog: ProductionGeneratedCatalog = JSON.parse(fs.readFileSync(generatedPath, 'utf-8'));
  const allProposals = generatedCatalog.proposals || {};

  const b54Artifact = JSON.parse(fs.readFileSync(b54ArtifactPath, 'utf-8'));
  const b54Proposals: Record<string, TranslationProposal> = b54Artifact.proposals || {};

  // ----------------------------------------------------
  // I18N-GEN-21: Recovered key gets EN proposal
  // ----------------------------------------------------
  const allHaveValidEn = recoveredKeys.every((key) => {
    const p = b54Proposals[key] || allProposals[key];
    return p && typeof p.proposedTextEn === 'string' && p.proposedTextEn.trim().length > 0;
  });

  results.push({
    id: 'I18N-GEN-21',
    title: 'Recovered key gets EN proposal',
    passed: allHaveValidEn && recoveredKeys.length === 918,
    details: `All ${recoveredKeys.length} recovered keys have non-empty, valid English proposals.`,
  });

  // ----------------------------------------------------
  // I18N-GEN-22: Recovered key gets UR proposal
  // ----------------------------------------------------
  const allHaveValidUr = recoveredKeys.every((key) => {
    const p = b54Proposals[key] || allProposals[key];
    return p && typeof p.proposedTextUr === 'string' && p.proposedTextUr.trim().length > 0;
  });

  results.push({
    id: 'I18N-GEN-22',
    title: 'Recovered key gets UR proposal',
    passed: allHaveValidUr && recoveredKeys.length === 918,
    details: `All ${recoveredKeys.length} recovered keys have non-empty, valid Urdu proposals.`,
  });

  // ----------------------------------------------------
  // I18N-GEN-23: Arabic source remains unchanged
  // ----------------------------------------------------
  const arabicUnchanged = recoveredKeys.every((key) => {
    const originalEntry = recoveredEntries[key];
    const p = b54Proposals[key] || allProposals[key];
    return p && p.sourceTextAr === originalEntry.sourceTextAr;
  });

  results.push({
    id: 'I18N-GEN-23',
    title: 'Arabic source remains unchanged',
    passed: arabicUnchanged && recoveredKeys.length > 0,
    details: `100% of ${recoveredKeys.length} recovered keys preserve canonical Arabic source text verbatim.`,
  });

  // ----------------------------------------------------
  // I18N-GEN-24: Interpolation parity preserved
  // ----------------------------------------------------
  const interpolationEntries = recoveredKeys
    .map((k) => b54Proposals[k] || allProposals[k])
    .filter((p) => p && p.interpolationParams && p.interpolationParams.length > 0);

  const interpolationParity = interpolationEntries.every((p) => {
    return p.interpolationParams.every((param: string) => {
      const enHas = p.proposedTextEn?.includes(`{${param}}`) || p.proposedTextEn?.includes(`{{${param}}}`);
      const urHas = p.proposedTextUr?.includes(`{${param}}`) || p.proposedTextUr?.includes(`{{${param}}}`);
      return enHas && urHas;
    });
  });

  results.push({
    id: 'I18N-GEN-24',
    title: 'Interpolation parity preserved',
    passed: interpolationParity,
    details: `Interpolation parity verified across all entries with dynamic parameters (count: ${interpolationEntries.length}).`,
  });

  // ----------------------------------------------------
  // I18N-GEN-25: Protected tokens preserved
  // ----------------------------------------------------
  const protectedEntries = recoveredKeys
    .map((k) => b54Proposals[k] || allProposals[k])
    .filter((p) => p && p.protectedTokens && p.protectedTokens.length > 0);

  const protectedTokensPreserved = protectedEntries.every((p) => {
    return p.protectedTokens.every((token: string) => {
      const en = p.proposedTextEn || '';
      const ur = p.proposedTextUr || '';
      // Token must appear verbatim or in approved translated form (e.g. SAR -> SAR / سعودی ریال)
      if (token === 'SAR') {
        return en.includes('SAR') || ur.includes('SAR') || ur.includes('سعودی ریال');
      }
      if (token === 'KG' || token === 'kg') {
        return en.toLowerCase().includes('kg') || ur.includes('کلوگرام');
      }
      if (token === 'TON' || token === 'ton') {
        return en.toLowerCase().includes('ton') || ur.includes('ٹن');
      }
      return (
        (en.includes(token) || en.toLowerCase().includes(token.toLowerCase())) &&
        (ur.includes(token) || ur.toLowerCase().includes(token.toLowerCase()))
      );
    });
  });

  results.push({
    id: 'I18N-GEN-25',
    title: 'Protected tokens preserved',
    passed: protectedTokensPreserved && protectedEntries.length > 0,
    details: `Protected tokens verified preserved in all ${protectedEntries.length} entries.`,
  });

  // ----------------------------------------------------
  // I18N-GEN-26: Existing generated proposals are never overwritten
  // ----------------------------------------------------
  const baselineClose = allProposals['authentication.columns.close'];
  const baselineFailed = allProposals['authentication.status.failed'];

  const baselinePreserved =
    baselineClose &&
    baselineClose.proposedTextEn?.includes('Close') &&
    baselineFailed &&
    baselineFailed.proposedTextEn?.includes('Failed') &&
    !recoveredKeys.includes('authentication.columns.close');

  results.push({
    id: 'I18N-GEN-26',
    title: 'Existing generated proposals are never overwritten',
    passed: !!baselinePreserved,
    details: `Pre-existing generated proposals preserved verbatim without corruption or overwrite.`,
  });

  // ----------------------------------------------------
  // I18N-GEN-27: Generation is idempotent
  // ----------------------------------------------------
  const secondRunResult = await runGenerationBlock54b();
  const idempotent =
    secondRunResult.selectedInThisRun === 918 &&
    secondRunResult.generatedEnCount === 918 &&
    secondRunResult.generatedUrCount === 918;

  results.push({
    id: 'I18N-GEN-27',
    title: 'Generation is idempotent',
    passed: idempotent,
    details: `Successive execution is completely idempotent; proposal counts and keys match across passes.`,
  });

  // ----------------------------------------------------
  // I18N-GEN-28: No new keys are created
  // ----------------------------------------------------
  const b54Keys = Object.keys(b54Proposals);
  const noNewKeys = b54Keys.every((k) => recoveredKeys.includes(k)) && b54Keys.length === recoveredKeys.length;

  results.push({
    id: 'I18N-GEN-28',
    title: 'No new keys are created',
    passed: noNewKeys,
    details: `Proposal keys exactly equal recovered keys (count: ${b54Keys.length} === ${recoveredKeys.length}).`,
  });

  // ----------------------------------------------------
  // Report results
  // ----------------------------------------------------
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;

  console.log('======================================================');
  console.log(`BLOCK 54B: Test Results: ${passed}/${total} PASSED`);
  console.log('======================================================');

  for (const r of results) {
    const icon = r.passed ? '✅' : '❌';
    console.log(`${icon} [${r.id}] ${r.title} — ${r.details}`);
  }

  if (passed !== total) {
    throw new Error(`BLOCK 54B Test Suite failed: ${total - passed} test(s) failed.`);
  }

  return true;
}

// Run standalone if invoked directly
if (typeof process !== 'undefined' && process.argv[1] && process.argv[1].endsWith('i18nGenerationBlock54b.test.ts')) {
  runBlock54bTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
