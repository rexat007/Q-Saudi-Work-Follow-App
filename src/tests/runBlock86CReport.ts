import { runFirestoreSourceOfTruthProjectSequence86CTests } from './firestoreSourceOfTruthProjectSequence86C.test';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  console.log('Running BLOCK 86C - Firestore Source of Truth & Project Sequencing Verification...');
  const suiteResult = await runFirestoreSourceOfTruthProjectSequence86CTests();

  const reportsDir = path.join(process.cwd(), 'reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  // 1. JSON Report
  const jsonPath = path.join(reportsDir, 'firestore-source-of-truth-block86C.json');
  fs.writeFileSync(jsonPath, JSON.stringify(suiteResult, null, 2), 'utf-8');
  console.log(`JSON Report generated at: ${jsonPath}`);

  // 2. Markdown Report
  const mdContent = `# BLOCK 86C — FIRESTORE SOURCE OF TRUTH & PROJECT SEQUENCING REPORT

**Timestamp:** ${suiteResult.timestamp}  
**Total Requirements Tested:** ${suiteResult.totalTests}  
**Passed:** ${suiteResult.passedTests}  
**Failed:** ${suiteResult.failedTests}  
**Overall Status:** ${suiteResult.allPassed ? '✅ PASSED (100% SUCCESS)' : '❌ FAILED'}

---

## Executive Summary

BLOCK 86C establishes Firestore as the single, authoritative runtime source of truth for all projects and master data (Carriers, Trucks, Drivers, Materials, Pricing Rules). Static fallbacks (\`DEFAULT_PROJECTS\`, \`DEFAULT_CARRIERS\`, \`DEFAULT_MATERIALS\`, etc.) have been completely removed from active runtime paths. Additionally, server-authoritative, concurrency-safe, sequential project numbering has been implemented using Firestore transactions on \`systemCounters/projectNumber\`.

---

## Detailed Test Verification Results

| # | Requirement / Test Name | Category | Status | Verification Summary |
|---|-------------------------|----------|--------|----------------------|
${suiteResult.results
  .map(
    (r) =>
      `| ${r.id} | ${r.name} | \`${r.category}\` | ${r.passed ? '✅ PASS' : '❌ FAIL'} | ${r.message} |`
  )
  .join('\n')}

---

## Architecture & Implementation Rules Applied

1. **Firestore Source of Truth:** All authenticated active users fetch Projects and Master Data directly from Firestore collections (\`projects\`, \`projects/{id}/carriers\`, \`projects/{id}/materials\`, etc.).
2. **Sequential Project Numbering:** Uses Firestore transaction on \`systemCounters/projectNumber\`. Client-supplied project numbers are strictly overridden.
3. **Empty Master Data Lists:** Newly created projects initialize with \`authorizedCarrierIds: []\` and \`authorizedMaterialIds: []\`. No synthetic demo data is injected.
4. **Field Operations Integration:** Dynamically loads active projects and project-scoped master data for loading/unloading/supervision.
5. **No Static Fallback:** Zero synthetic fallback to default master data objects when Firestore collections return 0 records. Clean empty states are rendered.

---

*Report generated automatically by Q-Saudi Work Follow Verification System.*
`;

  const mdPath = path.join(reportsDir, 'firestore-source-of-truth-block86C.md');
  fs.writeFileSync(mdPath, mdContent, 'utf-8');
  console.log(`Markdown Report generated at: ${mdPath}`);
}

main().catch((err) => {
  console.error('Report Generation Error:', err);
  process.exit(1);
});
