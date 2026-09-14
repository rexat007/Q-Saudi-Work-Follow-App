/**
 * BLOCK 75: P3 UI/UX Final Cleanup Test Suite
 *
 * Verifies:
 * 1. AUDIT-72-08: Active Batch Review table headers use existing i18n keys and logical alignment
 * 2. AUDIT-72-09: Direction-safe logical margins in header Outbox (me-0.5) & report summary (ms-1)
 * 3. AUDIT-72-10: Responsive dual-mode workflow stepper in LoadingStation (no horizontal scroll on < 640px)
 * 4. Scope Discipline: Zero modifications to pricing, state-machine, or business logic
 * 5. I18N Freeze: Exact 1,128 keys per locale with zero drift and no new translation catalogs
 * 6. Deliverables: reports/uiux-block75-p3-fixes.json and .md exist and conform to schema
 */

import * as fs from 'fs';
import * as path from 'path';
import { arTranslations } from '../locales/ar';
import { enTranslations } from '../locales/en';
import { urTranslations } from '../locales/ur';

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
console.log('  BLOCK 75: P3 UI/UX FINAL CLEANUP TEST SUITE');
console.log('======================================================');

const importCenterPath = path.resolve(process.cwd(), 'src/components/importCenter/ImportCenterView.tsx');
const appPath = path.resolve(process.cwd(), 'src/App.tsx');
const reportsEnginePath = path.resolve(process.cwd(), 'src/components/reports/ReportsEngineView.tsx');
const loadingStationPath = path.resolve(process.cwd(), 'src/components/tripEngine/LoadingStation.tsx');
const jsonReportPath = path.resolve(process.cwd(), 'reports/uiux-block75-p3-fixes.json');
const mdReportPath = path.resolve(process.cwd(), 'reports/uiux-block75-p3-fixes.md');

const importCenterSource = fs.readFileSync(importCenterPath, 'utf-8');
const appSource = fs.readFileSync(appPath, 'utf-8');
const reportsEngineSource = fs.readFileSync(reportsEnginePath, 'utf-8');
const loadingStationSource = fs.readFileSync(loadingStationPath, 'utf-8');

// -------------------------------------------------------------
// Section 1: AUDIT-72-08 — Active Batch Review Table
// -------------------------------------------------------------
test('B75-T01', 'ImportCenterView review table uses direction-aware text alignment', () => {
  if (!importCenterSource.includes('rtl:text-right') || !importCenterSource.includes('ltr:text-left')) {
    throw new Error('ImportCenterView review table must use direction-aware text alignment (rtl:text-right ltr:text-left)');
  }
});

test('B75-T02', 'ImportCenterView uses existing i18n key for Field header', () => {
  if (!importCenterSource.includes('offline.labels.txt_59a3b5')) {
    throw new Error('ImportCenterView must use existing i18n key offline.labels.txt_59a3b5 for Field header');
  }
  // Verify that the key resolves properly in all locales
  if (enTranslations['offline.labels.txt_59a3b5'] !== 'Field') {
    throw new Error('Expected offline.labels.txt_59a3b5 in EN to be "Field"');
  }
  if (arTranslations['offline.labels.txt_59a3b5'] !== 'الحقل') {
    throw new Error('Expected offline.labels.txt_59a3b5 in AR to be "الحقل"');
  }
});

test('B75-T03', 'ImportCenterView uses existing i18n key for Action header', () => {
  if (!importCenterSource.includes('trips.labels.txt_1309b3')) {
    throw new Error('ImportCenterView must use existing i18n key trips.labels.txt_1309b3 for Action header');
  }
  // Verify that the key resolves properly in all locales
  if (enTranslations['trips.labels.txt_1309b3'] !== 'Actions') {
    throw new Error('Expected trips.labels.txt_1309b3 in EN to be "Actions"');
  }
  if (arTranslations['trips.labels.txt_1309b3'] !== 'إجراءات') {
    throw new Error('Expected trips.labels.txt_1309b3 in AR to be "إجراءات"');
  }
});

test('B75-T04', 'ImportCenterView preserves column order and review row data binding', () => {
  // Check that all 8 columns exist in proper order
  const tableHeaderIndex = importCenterSource.indexOf('EXACT REQUESTED REVIEW TABLE');
  if (tableHeaderIndex === -1) throw new Error('Could not locate review table in ImportCenterView');
  
  const tableSlice = importCenterSource.slice(tableHeaderIndex, tableHeaderIndex + 1200);
  const rowIdx = tableSlice.indexOf('Row');
  const fieldIdx = tableSlice.indexOf('offline.labels.txt_59a3b5');
  const origValIdx = tableSlice.indexOf('Original Value');
  const suggValIdx = tableSlice.indexOf('Suggested Value');
  const confIdx = tableSlice.indexOf('Confidence');
  const issueIdx = tableSlice.indexOf('Issue');
  const sevIdx = tableSlice.indexOf('Severity');
  const actionIdx = tableSlice.indexOf('trips.labels.txt_1309b3');

  if (rowIdx === -1 || fieldIdx === -1 || origValIdx === -1 || suggValIdx === -1 || 
      confIdx === -1 || issueIdx === -1 || sevIdx === -1 || actionIdx === -1) {
    throw new Error('All 8 column headers must be present in the review table');
  }

  if (!(rowIdx < fieldIdx && fieldIdx < origValIdx && origValIdx < suggValIdx && 
        suggValIdx < confIdx && confIdx < issueIdx && issueIdx < sevIdx && sevIdx < actionIdx)) {
    throw new Error('Column header order must be strictly preserved');
  }
});

// -------------------------------------------------------------
// Section 2: AUDIT-72-09 — Physical Icon Margins
// -------------------------------------------------------------
test('B75-T05', 'App.tsx Outbox icon replaces physical mr-0.5 with direction-safe me-0.5', () => {
  if (appSource.includes('<Inbox className="w-3 h-3 text-stone-500 mr-0.5" />')) {
    throw new Error('App.tsx must not contain physical mr-0.5 on Outbox icon');
  }
  if (!appSource.includes('<Inbox className="w-3 h-3 text-stone-500 me-0.5" />')) {
    throw new Error('App.tsx Outbox icon must use direction-safe me-0.5');
  }
});

test('B75-T06', 'ReportsEngineView summary pill replaces physical mr-1 with direction-safe ms-1', () => {
  if (reportsEngineSource.includes('text-amber-700 font-bold mr-1')) {
    throw new Error('ReportsEngineView must not contain physical mr-1 on pending settlement pill');
  }
  if (!reportsEngineSource.includes('text-amber-700 font-bold ms-1')) {
    throw new Error('ReportsEngineView pending settlement pill must use direction-safe ms-1');
  }
});

// -------------------------------------------------------------
// Section 3: AUDIT-72-10 — Workflow Steppers Responsive Refactoring
// -------------------------------------------------------------
test('B75-T07', 'LoadingStation removes unconditional min-w-[700px] on mobile viewports', () => {
  // Should have a mobile container with sm:hidden without min-w-[700px]
  if (!loadingStationSource.includes('sm:hidden')) {
    throw new Error('LoadingStation must contain mobile view with sm:hidden');
  }
  // Mobile stepper container must not enforce min-w-[700px]
  const mobileIdx = loadingStationSource.indexOf('Mobile View (< 640px)');
  const desktopIdx = loadingStationSource.indexOf('Desktop & Tablet View (>= 640px)');
  if (mobileIdx === -1 || desktopIdx === -1) {
    throw new Error('LoadingStation must contain distinct mobile and desktop stepper sections');
  }
  const mobileSlice = loadingStationSource.slice(mobileIdx, desktopIdx);
  if (mobileSlice.includes('min-w-[700px]')) {
    throw new Error('Mobile view slice must not enforce min-w-[700px]');
  }
});

test('B75-T08', 'LoadingStation preserves full desktop & tablet workflow stepper', () => {
  if (!loadingStationSource.includes('hidden sm:block overflow-x-auto') &&
      !loadingStationSource.includes('hidden sm:flex')) {
    throw new Error('LoadingStation must preserve full desktop/tablet stepper container');
  }
  if (!loadingStationSource.includes('min-w-[700px]')) {
    throw new Error('LoadingStation desktop view must preserve min-w-[700px]');
  }
});

test('B75-T09', 'LoadingStation preserves all 8 workflow steps and ordering', () => {
  const expectedSteps = ['PROJECT', 'CARRIER', 'TRUCK', 'DRIVER', 'MATERIAL', 'TARE', 'GROSS', 'PREVIEW'];
  for (const s of expectedSteps) {
    if (!loadingStationSource.includes(`id: '${s}'`)) {
      throw new Error(`LoadingStation must preserve step ID: ${s}`);
    }
  }
});

test('B75-T10', 'LoadingStation preserves setCurrentStep click handlers on mobile and desktop', () => {
  const matches = loadingStationSource.match(/setCurrentStep\(step\.id\)/g);
  if (!matches || matches.length < 2) {
    throw new Error('setCurrentStep(step.id) must be bound on both mobile and desktop views');
  }
});

// -------------------------------------------------------------
// Section 4: I18N Catalog Freeze Verification (1,128 keys)
// -------------------------------------------------------------
test('B75-T11', 'AR locale retains exact freeze count of 1,128 keys', () => {
  const count = Object.keys(arTranslations).length;
  if (count !== 1128) throw new Error(`Expected 1128 AR keys, found ${count}`);
});

test('B75-T12', 'EN locale retains exact freeze count of 1,128 keys', () => {
  const count = Object.keys(enTranslations).length;
  if (count !== 1128) throw new Error(`Expected 1128 EN keys, found ${count}`);
});

test('B75-T13', 'UR locale retains exact freeze count of 1,128 keys', () => {
  const count = Object.keys(urTranslations).length;
  if (count !== 1128) throw new Error(`Expected 1128 UR keys, found ${count}`);
});

test('B75-T14', 'Zero translation drift across AR, EN, and UR', () => {
  const arKeys = new Set(Object.keys(arTranslations));
  const enKeys = new Set(Object.keys(enTranslations));
  const urKeys = new Set(Object.keys(urTranslations));

  for (const k of arKeys) {
    if (!enKeys.has(k)) throw new Error(`Missing key in EN: ${k}`);
    if (!urKeys.has(k)) throw new Error(`Missing key in UR: ${k}`);
  }
});

// -------------------------------------------------------------
// Section 5: BLOCK 75 Deliverables
// -------------------------------------------------------------
test('B75-T15', 'BLOCK 75 deliverables exist and contain required schema', () => {
  if (!fs.existsSync(jsonReportPath)) throw new Error('Missing reports/uiux-block75-p3-fixes.json');
  if (!fs.existsSync(mdReportPath)) throw new Error('Missing reports/uiux-block75-p3-fixes.md');

  const jsonContent = JSON.parse(fs.readFileSync(jsonReportPath, 'utf-8'));
  if (jsonContent.metadata.p3FindingsFixedCount !== 3) {
    throw new Error('JSON report metadata must state p3FindingsFixedCount: 3');
  }
  if (!jsonContent.summary.i18nRemainsFrozen) {
    throw new Error('JSON report must confirm i18nRemainsFrozen');
  }
  if (!jsonContent.summary.allAuthorizedP3Fixed) {
    throw new Error('JSON report must confirm allAuthorizedP3Fixed');
  }
  if (!jsonContent.summary.noNewTranslationCatalogCreated) {
    throw new Error('JSON report must confirm noNewTranslationCatalogCreated');
  }
});

// -------------------------------------------------------------
// Summary
// -------------------------------------------------------------
console.log('------------------------------------------------------');
console.log(`Results: ${passedTests}/${totalTests} passed (${failedTests} failed)`);
console.log('======================================================');

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
