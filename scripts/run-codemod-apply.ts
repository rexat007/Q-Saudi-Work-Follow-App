/**
 * BLOCK 46 — CLI Entry Point for Controlled i18n Migration: SAFE Batch Application
 *
 * Usage:
 *   npx tsx scripts/run-codemod-apply.ts
 *   npx tsx scripts/run-codemod-apply.ts --batch-size 300 --categories shared,navigation,authentication,dashboard,projects
 */

import { CodemodEngine } from '../src/i18n/codemod/codemod.runner';

async function main() {
  console.log('================================================================');
  console.log(' BLOCK 46: Controlled i18n Migration (SAFE BATCH EXPANSION)    ');
  console.log('================================================================');

  const args = process.argv.slice(2);
  let batchSize: number | undefined;
  let categories: string[] | undefined;
  let targetFiles: string[] | undefined;
  let blockNumber = 46;

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

  const engine = new CodemodEngine();

  console.log('Applying SAFE batch transformations with atomic verification...');
  const result = await engine.runApplyBatch({
    batchSize: batchSize || 300,
    preferredCategories: categories || ['shared', 'navigation', 'authentication', 'dashboard', 'projects'],
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

