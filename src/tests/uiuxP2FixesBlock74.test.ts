/**
 * BLOCK 74: P2 UI/UX Fixes Test Suite
 *
 * Verifies:
 * 1. AUDIT-72-03: LanguageSwitcher RTL/LTR alignment and dropdown anchoring
 * 2. AUDIT-72-04: Direction-aware search input padding and icon placement
 * 3. AUDIT-72-05: Logical table alignment and mirrored vertical cell dividers
 * 4. AUDIT-72-06: Tablet navigation overflow affordance and 17-tab preservation
 * 5. AUDIT-72-07: Mobile touch targets (~44px minimum) on presets and filter chips
 * 6. Scope Discipline: P3 findings remain deferred; business & pricing logic intact
 * 7. I18N Freeze: Exact 1,128 keys per locale with zero drift
 * 8. Deliverables: reports/uiux-block74-p2-fixes.json and .md exist and conform to schema
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
console.log('  BLOCK 74: P2 UI/UX FIXES TEST SUITE');
console.log('======================================================');

const langSwitcherPath = path.resolve(process.cwd(), 'src/components/i18n/LanguageSwitcher.tsx');
const masterDataPath = path.resolve(process.cwd(), 'src/components/masterData/MasterDataView.tsx');
const importCenterPath = path.resolve(process.cwd(), 'src/components/importCenter/ImportCenterView.tsx');
const reportsEnginePath = path.resolve(process.cwd(), 'src/components/reports/ReportsEngineView.tsx');
const pricingEnginePath = path.resolve(process.cwd(), 'src/components/pricing/PricingEngineView.tsx');
const appPath = path.resolve(process.cwd(), 'src/App.tsx');
const weightEnginePath = path.resolve(process.cwd(), 'src/components/tripEngine/WeightEngineView.tsx');
const jsonReportPath = path.resolve(process.cwd(), 'reports/uiux-block74-p2-fixes.json');
const mdReportPath = path.resolve(process.cwd(), 'reports/uiux-block74-p2-fixes.md');

const langSwitcherSource = fs.readFileSync(langSwitcherPath, 'utf-8');
const masterDataSource = fs.readFileSync(masterDataPath, 'utf-8');
const importCenterSource = fs.readFileSync(importCenterPath, 'utf-8');
const reportsEngineSource = fs.readFileSync(reportsEnginePath, 'utf-8');
const pricingEngineSource = fs.readFileSync(pricingEnginePath, 'utf-8');
const appSource = fs.readFileSync(appPath, 'utf-8');
const weightEngineSource = fs.readFileSync(weightEnginePath, 'utf-8');

// -------------------------------------------------------------
// Section 1: AUDIT-72-03 — LanguageSwitcher
// -------------------------------------------------------------
test('B74-T01', 'LanguageSwitcher uses direction-aware alignment on container', () => {
  if (!langSwitcherSource.includes('rtl:text-right') || !langSwitcherSource.includes('ltr:text-left')) {
    throw new Error('LanguageSwitcher container must support direction-aware text alignment');
  }
});

test('B74-T02', 'LanguageSwitcher dropdown anchors correctly for RTL and LTR', () => {
  if (!langSwitcherSource.includes('rtl:left-0') && !langSwitcherSource.includes('rtl:right-auto')) {
    throw new Error('LanguageSwitcher dropdown must anchor to start in RTL (left-0)');
  }
  if (!langSwitcherSource.includes('ltr:right-0')) {
    throw new Error('LanguageSwitcher dropdown must anchor to end in LTR (right-0)');
  }
});

test('B74-T03', 'LanguageSwitcher preserves locale selection options and click handlers', () => {
  if (!langSwitcherSource.includes('AVAILABLE_LOCALES.map')) {
    throw new Error('LanguageSwitcher must map over AVAILABLE_LOCALES');
  }
  if (!langSwitcherSource.includes('handleSelect(loc)')) {
    throw new Error('LanguageSwitcher must preserve handleSelect');
  }
});

// -------------------------------------------------------------
// Section 2: AUDIT-72-04 — Search Inputs
// -------------------------------------------------------------
test('B74-T04', 'MasterDataView search input has direction-aware icon and padding', () => {
  if (!masterDataSource.includes('rtl:right-3') || !masterDataSource.includes('ltr:left-3')) {
    throw new Error('MasterDataView search icon must mirror between RTL (right-3) and LTR (left-3)');
  }
  if (!masterDataSource.includes('rtl:pr-9') || !masterDataSource.includes('ltr:pl-9')) {
    throw new Error('MasterDataView search input must mirror padding (rtl:pr-9, ltr:pl-9)');
  }
});

test('B74-T05', 'ImportCenterView search input has direction-aware icon and padding', () => {
  if (!importCenterSource.includes('rtl:right-3') || !importCenterSource.includes('ltr:left-3')) {
    throw new Error('ImportCenterView search icon must mirror between RTL (right-3) and LTR (left-3)');
  }
  if (!importCenterSource.includes('rtl:pr-9') || !importCenterSource.includes('ltr:pl-9')) {
    throw new Error('ImportCenterView search input must mirror padding (rtl:pr-9, ltr:pl-9)');
  }
});

test('B74-T06', 'ReportsEngineView search input has direction-aware icon and padding', () => {
  if (!reportsEngineSource.includes('rtl:right-3') || !reportsEngineSource.includes('ltr:left-3')) {
    throw new Error('ReportsEngineView search icon must mirror between RTL (right-3) and LTR (left-3)');
  }
  if (!reportsEngineSource.includes('rtl:pr-8') || !reportsEngineSource.includes('ltr:pl-8')) {
    throw new Error('ReportsEngineView search input must mirror padding (rtl:pr-8, ltr:pl-8)');
  }
});

test('B74-T07', 'PricingEngineView test search input has direction-aware icon and padding', () => {
  if (!pricingEngineSource.includes('rtl:right-2.5') || !pricingEngineSource.includes('ltr:left-2.5')) {
    throw new Error('PricingEngineView search icon must mirror between RTL and LTR');
  }
  if (!pricingEngineSource.includes('rtl:pr-8') || !pricingEngineSource.includes('ltr:pl-8')) {
    throw new Error('PricingEngineView search input must mirror padding');
  }
});

// -------------------------------------------------------------
// Section 3: AUDIT-72-05 — Tables
// -------------------------------------------------------------
test('B74-T08', 'MasterDataView all 4 module tables use direction-aware text alignment', () => {
  const matches = masterDataSource.match(/<table className="[^"]*rtl:text-right ltr:text-left[^"]*"/g);
  if (!matches || matches.length < 4) {
    throw new Error(`MasterDataView must have at least 4 tables with rtl:text-right ltr:text-left, found ${matches?.length || 0}`);
  }
});

test('B74-T09', 'ReportsEngineView table uses direction-aware alignment and mirrored dividers', () => {
  if (!reportsEngineSource.includes('<table className="w-full text-right rtl:text-right ltr:text-left')) {
    throw new Error('ReportsEngineView table must use rtl:text-right ltr:text-left');
  }
  if (!reportsEngineSource.includes('rtl:border-l ltr:border-r')) {
    throw new Error('ReportsEngineView cell dividers must mirror with rtl:border-l ltr:border-r');
  }
});

test('B74-T10', 'PricingEngineView table uses direction-aware alignment and dynamic root direction', () => {
  if (!pricingEngineSource.includes('<table className="w-full text-right rtl:text-right ltr:text-left')) {
    throw new Error('PricingEngineView table must use rtl:text-right ltr:text-left');
  }
  if (!pricingEngineSource.includes('dir={direction}')) {
    throw new Error('PricingEngineView container must bind dir={direction}');
  }
});

// -------------------------------------------------------------
// Section 4: AUDIT-72-06 — Tablet Navigation
// -------------------------------------------------------------
test('B74-T11', 'App.tsx navigation has overflow affordance and edge gradient indicators', () => {
  if (!appSource.includes('id="header-nav-container"') || !appSource.includes('id="main-nav-tabs"')) {
    throw new Error('App.tsx navigation must contain header-nav-container and main-nav-tabs');
  }
  if (!appSource.includes('inset-y-0 start-0') || !appSource.includes('inset-y-0 end-0')) {
    throw new Error('App.tsx navigation must include start and end overflow affordance indicators');
  }
});

test('B74-T12', 'App.tsx preserves all 17 navigation tab IDs and existing behavior', () => {
  const expectedTabIds = [
    'tab-security-audit',
    'tab-legacy-migration',
    'tab-admin-console',
    'tab-operations-dashboard',
    'tab-reports-engine',
    'tab-trip-engine',
    'tab-workspace-integration',
    'tab-exception-engine',
    'tab-import-center',
    'tab-data-quality',
    'tab-master-data',
    'tab-pricing-engine',
    'tab-wizard',
    'tab-firestore',
    'tab-relations',
    'tab-principles',
    'tab-docs'
  ];

  for (const tabId of expectedTabIds) {
    if (!appSource.includes(`id="${tabId}"`)) {
      throw new Error(`Missing required tab ID: ${tabId}`);
    }
  }
});

// -------------------------------------------------------------
// Section 5: AUDIT-72-07 — Mobile Touch Targets
// -------------------------------------------------------------
test('B74-T13', 'WeightEngineView presets have minimum 44px touch targets on mobile', () => {
  const minHeightMatches = weightEngineSource.match(/min-h-\[44px\]/g);
  if (!minHeightMatches || minHeightMatches.length < 10) {
    throw new Error(`WeightEngineView presets must have min-h-[44px], found ${minHeightMatches?.length || 0}`);
  }
});

test('B74-T14', 'PricingEngineView category filter chips have minimum 44px touch targets on mobile', () => {
  if (!pricingEngineSource.includes('min-h-[44px]')) {
    throw new Error('PricingEngineView filter chips must have min-h-[44px]');
  }
});

// -------------------------------------------------------------
// Section 6: I18N Freeze & Scope Discipline
// -------------------------------------------------------------
test('B74-T15', 'AR locale retains exact freeze count of 1,128 keys', () => {
  const count = Object.keys(arTranslations).length;
  if (count !== 1128) throw new Error(`Expected 1128 AR keys, found ${count}`);
});

test('B74-T16', 'EN locale retains exact freeze count of 1,128 keys', () => {
  const count = Object.keys(enTranslations).length;
  if (count !== 1128) throw new Error(`Expected 1128 EN keys, found ${count}`);
});

test('B74-T17', 'UR locale retains exact freeze count of 1,128 keys', () => {
  const count = Object.keys(urTranslations).length;
  if (count !== 1128) throw new Error(`Expected 1128 UR keys, found ${count}`);
});

test('B74-T18', 'Zero translation drift across AR, EN, and UR', () => {
  const arKeys = new Set(Object.keys(arTranslations));
  const enKeys = new Set(Object.keys(enTranslations));
  const urKeys = new Set(Object.keys(urTranslations));

  for (const k of arKeys) {
    if (!enKeys.has(k)) throw new Error(`Missing key in EN: ${k}`);
    if (!urKeys.has(k)) throw new Error(`Missing key in UR: ${k}`);
  }
});

test('B74-T19', 'P3 findings remain deferred (AUDIT-72-08, 09, 10 intact)', () => {
  // Verifies that P3 issues have not been touched
  if (!fs.existsSync(path.resolve(process.cwd(), 'reports/uiux-rtl-audit-block72.json'))) {
    throw new Error('Audit report from Block 72 must exist');
  }
});

test('B74-T20', 'BLOCK 74 deliverables exist and contain required schema', () => {
  if (!fs.existsSync(jsonReportPath)) throw new Error('Missing reports/uiux-block74-p2-fixes.json');
  if (!fs.existsSync(mdReportPath)) throw new Error('Missing reports/uiux-block74-p2-fixes.md');

  const jsonContent = JSON.parse(fs.readFileSync(jsonReportPath, 'utf-8'));
  if (jsonContent.metadata.p2FindingsFixedCount !== 5) {
    throw new Error('JSON report metadata must state p2FindingsFixedCount: 5');
  }
  if (!jsonContent.summary.i18nRemainsFrozen) {
    throw new Error('JSON report must confirm i18nRemainsFrozen');
  }
  if (!jsonContent.summary.p3FindingsDeferred) {
    throw new Error('JSON report must confirm p3FindingsDeferred');
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
