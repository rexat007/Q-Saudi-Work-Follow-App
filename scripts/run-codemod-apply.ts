/**
 * BLOCK 48 — CLI Entry Point for Complete Remaining SAFE i18n Migration
 *
 * Usage:
 *   npx tsx scripts/run-codemod-apply.ts
 *   npx tsx scripts/run-codemod-apply.ts --batch-size 350 --block 48
 */

import { CodemodEngine } from '../src/i18n/codemod/codemod.runner';

async function main() {
  const args = process.argv.slice(2);
  let batchSize: number | undefined;
  let categories: string[] | undefined;
  let targetFiles: string[] | undefined;
  let blockNumber = 48;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--batch-size' && args[i + 1]) {
      batchSize = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === '--categories' && args[i + 1]) {
      categories = args[i + 1].split(',');
      i++;
    } else if (args[i] === '--target-files' && args[i + 1]) {
      targetFiles = args[i + 1].split(',');
      i++;
    } else if (args[i] === '--block' && args[i + 1]) {
      blockNumber = parseInt(args[i + 1], 10);
      i++;
    }
  }

  console.log('================================================================');
  console.log(` BLOCK ${blockNumber}: Complete Remaining SAFE i18n Migration`);
  console.log('================================================================');

  const engine = new CodemodEngine();

  const defaultCats = [
    'offline',
    'other',
    'masterData',
    'wizard',
    'shared',
    'admin',
    'importCenter',
    'pricing',
    'dashboard',
    'projects',
    'carriers',
    'trucks',
    'drivers',
    'materials',
    'trips',
    'loading',
    'unloading',
    'weighbridge',
  ];

  console.log('Applying remaining SAFE batch transformations with atomic verification...');
  const result = await engine.runApplyBatch({
    batchSize: batchSize || (blockNumber === 48 ? 350 : blockNumber === 47 ? 500 : 300),
    preferredCategories: categories || defaultCats,
    targetFiles,
    blockNumber,
  });

  console.log('\n--- BATCH APPLICATION COMPLETED ---');
  console.log(`Total Candidates Applied:   ${result.appliedCount}`);
  console.log(`Files Modified:             ${result.filesModified.length}`);
  result.filesModified.forEach((f) => console.log(`  - ${f}`));
  console.log(`\nArtifacts Generated:`);
  console.log(`  - ${result.manifestPath}`);
  console.log(`  - ${result.diffPath}`);
  console.log(`  - ${result.summaryPath}`);
  console.log('================================================================');
}

main().catch((err) => {
  console.error('Fatal error applying codemod batch:', err);
  process.exit(1);
});

