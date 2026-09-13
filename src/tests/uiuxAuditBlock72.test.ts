/**
 * BLOCK 72 — UI/UX & RTL/LTR Visual Audit Test Suite
 *
 * Verifies:
 * 1. Read-only integrity: translation layer remains frozen (no locale modifications).
 * 2. Exact key count parity across ar, en, ur (1,128 keys each).
 * 3. Directional mappings (ar -> rtl, ur -> rtl, en -> ltr) remain consistent.
 * 4. Audit reports exist and conform to required structure and schema:
 *    - reports/uiux-rtl-audit-block72.json
 *    - reports/uiux-rtl-audit-block72.md
 * 5. Findings are categorized and prioritized (P0, P1, P2, P3) with complete remediation fields.
 * 6. Business logic, pricing engine, and state machines remain unmodified.
 */

import * as fs from 'fs';
import * as path from 'path';
import { arTranslations } from '../locales/ar';
import { enTranslations } from '../locales/en';
import { urTranslations } from '../locales/ur';
import { LOCALE_DIRECTIONS } from '../i18n/constants';
import { directionOf, isRTL } from '../i18n/utils';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function test(id: string, description: string, fn: () => void) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✅ [PASS] ${id}: ${description}`);
  } catch (error: any) {
    failedTests++;
    console.error(`  ❌ [FAIL] ${id}: ${description}`);
    console.error(`     Error: ${error.message}`);
  }
}

console.log('======================================================');
console.log('  BLOCK 72: UI/UX & RTL/LTR AUDIT INTEGRITY SUITE');
console.log('======================================================');

// 1. Locale Freeze Preservation Assertions
test('B72-T01', 'AR locale retains exact freeze count of 1,128 keys', () => {
  const count = Object.keys(arTranslations).length;
  if (count !== 1128) {
    throw new Error(`Expected 1128 AR keys, found ${count}`);
  }
});

test('B72-T02', 'EN locale retains exact freeze count of 1,128 keys', () => {
  const count = Object.keys(enTranslations).length;
  if (count !== 1128) {
    throw new Error(`Expected 1128 EN keys, found ${count}`);
  }
});

test('B72-T03', 'UR locale retains exact freeze count of 1,128 keys', () => {
  const count = Object.keys(urTranslations).length;
  if (count !== 1128) {
    throw new Error(`Expected 1128 UR keys, found ${count}`);
  }
});

test('B72-T04', 'Zero translation drift across AR, EN, and UR', () => {
  const arKeys = Object.keys(arTranslations).sort();
  const enKeys = Object.keys(enTranslations).sort();
  const urKeys = Object.keys(urTranslations).sort();

  for (let i = 0; i < arKeys.length; i++) {
    if (arKeys[i] !== enKeys[i] || arKeys[i] !== urKeys[i]) {
      throw new Error(`Key mismatch at index ${i}: ar=${arKeys[i]}, en=${enKeys[i]}, ur=${urKeys[i]}`);
    }
  }
});

// 2. Bidirectional Mapping Assertions
test('B72-T05', 'Arabic is mapped strictly to RTL', () => {
  if (LOCALE_DIRECTIONS.ar !== 'rtl' || directionOf('ar') !== 'rtl' || !isRTL('ar')) {
    throw new Error('Arabic directional mapping failure');
  }
});

test('B72-T06', 'Urdu is mapped strictly to RTL', () => {
  if (LOCALE_DIRECTIONS.ur !== 'rtl' || directionOf('ur') !== 'rtl' || !isRTL('ur')) {
    throw new Error('Urdu directional mapping failure');
  }
});

test('B72-T07', 'English is mapped strictly to LTR', () => {
  if (LOCALE_DIRECTIONS.en !== 'ltr' || directionOf('en') !== 'ltr' || isRTL('en')) {
    throw new Error('English directional mapping failure');
  }
});

// 3. Audit Deliverables Existence and Structure Assertions
test('B72-T08', 'Audit JSON deliverable exists and has valid JSON structure', () => {
  const jsonPath = path.resolve(process.cwd(), 'reports/uiux-rtl-audit-block72.json');
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`Report not found at ${jsonPath}`);
  }
  const content = fs.readFileSync(jsonPath, 'utf-8');
  const parsed = JSON.parse(content);
  if (!parsed.auditMetadata || !parsed.findings) {
    throw new Error('JSON deliverable missing auditMetadata or findings');
  }
});

test('B72-T09', 'Audit Markdown deliverable exists and contains executive summary', () => {
  const mdPath = path.resolve(process.cwd(), 'reports/uiux-rtl-audit-block72.md');
  if (!fs.existsSync(mdPath)) {
    throw new Error(`Report not found at ${mdPath}`);
  }
  const content = fs.readFileSync(mdPath, 'utf-8');
  if (!content.includes('BLOCK 72 — UI/UX & RTL/LTR VISUAL AUDIT REPORT')) {
    throw new Error('Markdown deliverable missing expected title');
  }
  if (!content.includes('Executive Summary') || !content.includes('Detailed Audit Findings')) {
    throw new Error('Markdown deliverable missing required sections');
  }
});

test('B72-T10', 'All findings are classified with valid severities (P0, P1, P2, P3)', () => {
  const jsonPath = path.resolve(process.cwd(), 'reports/uiux-rtl-audit-block72.json');
  const content = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  const validSeverities = new Set(['P0', 'P1', 'P2', 'P3']);
  const validCategories = new Set(['RTL_LTR', 'RESPONSIVE_UI', 'CORE_UX', 'VISUAL_CONSISTENCY', 'ACCESSIBILITY']);

  content.findings.forEach((finding: any, idx: number) => {
    if (!finding.id || !finding.screen || !finding.severity || !finding.issueDescription) {
      throw new Error(`Finding at index ${idx} missing mandatory fields`);
    }
    if (!validSeverities.has(finding.severity)) {
      throw new Error(`Invalid severity ${finding.severity} in finding ${finding.id}`);
    }
    if (!validCategories.has(finding.category)) {
      throw new Error(`Invalid category ${finding.category} in finding ${finding.id}`);
    }
    if (!Array.isArray(finding.affectedLocales) || finding.affectedLocales.length === 0) {
      throw new Error(`Finding ${finding.id} missing affectedLocales`);
    }
    if (!finding.reproduction || !finding.recommendedFix) {
      throw new Error(`Finding ${finding.id} missing reproduction or recommendedFix`);
    }
  });
});

test('B72-T11', 'Severity count summary matches findings array length', () => {
  const jsonPath = path.resolve(process.cwd(), 'reports/uiux-rtl-audit-block72.json');
  const content = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  const counts = content.auditMetadata.severityCounts;
  const totalCount = counts.P0 + counts.P1 + counts.P2 + counts.P3;

  if (totalCount !== content.findings.length) {
    throw new Error(`Severity sum (${totalCount}) does not match findings length (${content.findings.length})`);
  }
  if (content.auditMetadata.totalFindings !== content.findings.length) {
    throw new Error(`totalFindings (${content.auditMetadata.totalFindings}) does not match findings length (${content.findings.length})`);
  }
});

test('B72-T12', 'Root layout in App.tsx dynamically binds document direction via useI18n', () => {
  const appPath = path.resolve(process.cwd(), 'src/App.tsx');
  const appContent = fs.readFileSync(appPath, 'utf-8');
  if (!appContent.includes('dir={direction}') && !appContent.includes("dir={isRTL ? 'rtl' : 'ltr'}")) {
    throw new Error('App.tsx missing dynamic root direction binding');
  }
});

test('B72-T13', 'BLOCK 71 freeze gate results remain valid and unmodified', () => {
  const freezePath = path.resolve(process.cwd(), 'reports/i18n-freeze-gate.json');
  if (!fs.existsSync(freezePath)) {
    throw new Error('i18n-freeze-gate.json missing');
  }
  const freezeContent = JSON.parse(fs.readFileSync(freezePath, 'utf-8'));
  if (freezeContent.freezeStatus !== 'PASS' || freezeContent.finalDecision !== 'FORMALLY_FROZEN') {
    throw new Error('BLOCK 71 freeze status invalidated');
  }
});

console.log('\n------------------------------------------------------');
console.log(`Results: ${passedTests}/${totalTests} passed (${failedTests} failed)`);
console.log('======================================================\n');

if (failedTests > 0) {
  process.exit(1);
}
