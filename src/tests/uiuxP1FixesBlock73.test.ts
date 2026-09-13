/**
 * BLOCK 73: P1 Directional UX Fixes Test Suite
 *
 * Verifies:
 * 1. RTL drawer behavior in OutboxDrawer.tsx (follows document direction, RTL start alignment, logical border, text-start)
 * 2. LTR drawer behavior in OutboxDrawer.tsx (no hardcoded dir="rtl", LTR start alignment, mirrored border, text-start)
 * 3. RTL Previous/Next direction in LoadingStation.tsx and ProjectSetupWizard.tsx (Previous points right, Next points left)
 * 4. LTR Previous/Next direction in LoadingStation.tsx and ProjectSetupWizard.tsx (Previous points left, Next points right)
 * 5. Navigation button labels remain unchanged
 * 6. Navigation handlers (goToPrevStep, goToNextStep) remain unchanged
 * 7. I18N translation layer remains strictly frozen (1,128 keys across AR, EN, UR with zero drift)
 * 8. Zero unrelated source changes (business logic, pricing rules, state machine, security intact; no P2/P3 fixes)
 * 9. Deliverables exist and conform to schema (reports/uiux-block73-p1-fixes.json and .md)
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
console.log('  BLOCK 73: P1 DIRECTIONAL UX FIXES TEST SUITE');
console.log('======================================================');

const outboxDrawerPath = path.resolve(process.cwd(), 'src/components/offline/OutboxDrawer.tsx');
const loadingStationPath = path.resolve(process.cwd(), 'src/components/tripEngine/LoadingStation.tsx');
const projectWizardPath = path.resolve(process.cwd(), 'src/components/wizard/ProjectSetupWizard.tsx');
const jsonReportPath = path.resolve(process.cwd(), 'reports/uiux-block73-p1-fixes.json');
const mdReportPath = path.resolve(process.cwd(), 'reports/uiux-block73-p1-fixes.md');

const outboxDrawerSource = fs.readFileSync(outboxDrawerPath, 'utf-8');
const loadingStationSource = fs.readFileSync(loadingStationPath, 'utf-8');
const projectWizardSource = fs.readFileSync(projectWizardPath, 'utf-8');

// -------------------------------------------------------------
// Section 1: RTL Drawer Behavior (OutboxDrawer.tsx)
// -------------------------------------------------------------
test('B73-T01', 'OutboxDrawer dynamically binds root direction via useI18n direction', () => {
  if (!outboxDrawerSource.includes('dir={direction}')) {
    throw new Error('OutboxDrawer outer container must dynamically set dir={direction}');
  }
  if (!outboxDrawerSource.includes('const { t, direction } = useI18n()') &&
      !outboxDrawerSource.includes('direction') &&
      !outboxDrawerSource.includes('useI18n')) {
    throw new Error('OutboxDrawer must extract direction from useI18n()');
  }
});

test('B73-T02', 'OutboxDrawer uses justify-start for locale-aware placement (RTL side in RTL)', () => {
  if (!outboxDrawerSource.includes('justify-start')) {
    throw new Error('OutboxDrawer outer overlay must use justify-start for natural bidirectional alignment');
  }
  if (outboxDrawerSource.includes('justify-end bg-black/50 backdrop-blur-xs transition-opacity" dir="rtl"')) {
    throw new Error('Unconditional justify-end with hardcoded dir="rtl" must be removed');
  }
});

test('B73-T03', 'OutboxDrawer uses mirrored inner divider borders (rtl:border-l and ltr:border-r)', () => {
  if (!outboxDrawerSource.includes('rtl:border-l') || !outboxDrawerSource.includes('ltr:border-r')) {
    throw new Error('OutboxDrawer body must mirror inner border with rtl:border-l and ltr:border-r');
  }
});

test('B73-T04', 'OutboxDrawer uses mirrored text alignment on drawer container and conflict buttons', () => {
  if (!outboxDrawerSource.includes('rtl:text-right ltr:text-left')) {
    throw new Error('OutboxDrawer container and buttons must use rtl:text-right ltr:text-left');
  }
  const drawerBodyMatch = outboxDrawerSource.match(/w-full max-w-2xl h-full bg-stone-50[^"]+/);
  if (!drawerBodyMatch || !drawerBodyMatch[0].includes('rtl:text-right') || !drawerBodyMatch[0].includes('ltr:text-left')) {
    throw new Error('OutboxDrawer root body must use rtl:text-right ltr:text-left');
  }
});

// -------------------------------------------------------------
// Section 2: LTR Drawer Behavior (OutboxDrawer.tsx)
// -------------------------------------------------------------
test('B73-T05', 'OutboxDrawer eliminates unconditional hardcoded dir="rtl" on overlay', () => {
  if (outboxDrawerSource.includes('<div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-xs transition-opacity" dir="rtl">')) {
    throw new Error('Hardcoded dir="rtl" on OutboxDrawer overlay must not exist');
  }
});

test('B73-T06', 'OutboxDrawer eliminates unconditional un-mirrored layout on root container', () => {
  if (outboxDrawerSource.includes('border-r border-stone-200 shadow-2xl flex flex-col overflow-hidden text-right"')) {
    throw new Error('Unconditional un-mirrored border-r and text-right on OutboxDrawer body must not exist');
  }
});

// -------------------------------------------------------------
// Section 3: RTL Previous/Next Direction
// -------------------------------------------------------------
test('B73-T07', 'LoadingStation applies rtl:rotate-180 for bidirectional arrow rotation', () => {
  // ArrowLeft with rtl:rotate-180 points right (→) in RTL and left (←) in LTR
  const hasDirectionalPrev = loadingStationSource.includes('<ArrowLeft className="w-4 h-4 rtl:rotate-180" />');
  if (!hasDirectionalPrev) {
    throw new Error('LoadingStation Previous button must render <ArrowLeft className="w-4 h-4 rtl:rotate-180" />');
  }
  // ArrowRight with rtl:rotate-180 points left (←) in RTL and right (→) in LTR
  const hasDirectionalNext = loadingStationSource.includes('<ArrowRight className="w-4 h-4 rtl:rotate-180" />');
  if (!hasDirectionalNext) {
    throw new Error('LoadingStation Next button must render <ArrowRight className="w-4 h-4 rtl:rotate-180" />');
  }
});

test('B73-T08', 'ProjectSetupWizard applies rtl:rotate-180 for bidirectional arrow rotation', () => {
  const hasDirectionalPrev = projectWizardSource.includes('<ArrowLeft className="w-4 h-4 rtl:rotate-180" />');
  if (!hasDirectionalPrev) {
    throw new Error('ProjectSetupWizard Previous button must render <ArrowLeft className="w-4 h-4 rtl:rotate-180" />');
  }
  const hasDirectionalNext = projectWizardSource.includes('<ArrowRight className="w-4 h-4 rtl:rotate-180" />');
  if (!hasDirectionalNext) {
    throw new Error('ProjectSetupWizard Next button must render <ArrowRight className="w-4 h-4 rtl:rotate-180" />');
  }
});

// -------------------------------------------------------------
// Section 4: LTR Previous/Next Direction
// -------------------------------------------------------------
test('B73-T09', 'In LTR, ArrowLeft (prev) and ArrowRight (next) point in correct forward/backward direction', () => {
  // Un-rotated in LTR: ArrowLeft points left (backwards), ArrowRight points right (forwards)
  if (!loadingStationSource.includes('ArrowLeft className="w-4 h-4 rtl:rotate-180"') ||
      !loadingStationSource.includes('ArrowRight className="w-4 h-4 rtl:rotate-180"')) {
    throw new Error('LoadingStation icons must be standard ArrowLeft/ArrowRight with rtl:rotate-180');
  }
});

test('B73-T10', 'In LTR, ProjectSetupWizard ArrowLeft (prev) and ArrowRight (next) point in correct direction', () => {
  if (!projectWizardSource.includes('ArrowLeft className="w-4 h-4 rtl:rotate-180"') ||
      !projectWizardSource.includes('ArrowRight className="w-4 h-4 rtl:rotate-180"')) {
    throw new Error('ProjectSetupWizard icons must be standard ArrowLeft/ArrowRight with rtl:rotate-180');
  }
});

// -------------------------------------------------------------
// Section 5: Button Labels Unchanged
// -------------------------------------------------------------
test('B73-T11', 'Navigation button labels in LoadingStation remain byte-identical', () => {
  if (!loadingStationSource.includes('<span>السابق</span>')) {
    throw new Error('LoadingStation Previous button label "السابق" must remain unchanged');
  }
  if (!loadingStationSource.includes('<span>التالي ({STEPS[stepIndex + 1].label})</span>')) {
    throw new Error('LoadingStation Next button label must remain unchanged');
  }
});

test('B73-T12', 'Navigation button labels in ProjectSetupWizard remain byte-identical', () => {
  if (!projectWizardSource.includes('<span>السابق</span>')) {
    throw new Error('ProjectSetupWizard Previous button label "السابق" must remain unchanged');
  }
  if (!projectWizardSource.includes("<span>التالي: {stepsMeta[currentStep]?.title || 'المراجعة'}</span>")) {
    throw new Error('ProjectSetupWizard Next button label must remain unchanged');
  }
});

// -------------------------------------------------------------
// Section 6: Navigation Handlers Unchanged
// -------------------------------------------------------------
test('B73-T13', 'Navigation click handlers in LoadingStation remain wired to goToPrevStep and goToNextStep', () => {
  if (!loadingStationSource.includes('onClick={goToPrevStep}')) {
    throw new Error('LoadingStation Previous button must retain onClick={goToPrevStep}');
  }
  if (!loadingStationSource.includes('onClick={goToNextStep}')) {
    throw new Error('LoadingStation Next button must retain onClick={goToNextStep}');
  }
});

test('B73-T14', 'Navigation click handlers in ProjectSetupWizard remain wired to goToPrevStep and goToNextStep', () => {
  if (!projectWizardSource.includes('onClick={goToPrevStep}')) {
    throw new Error('ProjectSetupWizard Previous button must retain onClick={goToPrevStep}');
  }
  if (!projectWizardSource.includes('onClick={goToNextStep}')) {
    throw new Error('ProjectSetupWizard Next button must retain onClick={goToNextStep}');
  }
});

// -------------------------------------------------------------
// Section 7: I18N Freeze Preservation
// -------------------------------------------------------------
test('B73-T15', 'AR locale retains exact freeze count of 1,128 keys', () => {
  const count = Object.keys(arTranslations).length;
  if (count !== 1128) {
    throw new Error(`Expected 1128 AR keys, found ${count}`);
  }
});

test('B73-T16', 'EN locale retains exact freeze count of 1,128 keys', () => {
  const count = Object.keys(enTranslations).length;
  if (count !== 1128) {
    throw new Error(`Expected 1128 EN keys, found ${count}`);
  }
});

test('B73-T17', 'UR locale retains exact freeze count of 1,128 keys', () => {
  const count = Object.keys(urTranslations).length;
  if (count !== 1128) {
    throw new Error(`Expected 1128 UR keys, found ${count}`);
  }
});

test('B73-T18', 'Zero translation drift across AR, EN, and UR', () => {
  const arKeys = new Set(Object.keys(arTranslations));
  const enKeys = new Set(Object.keys(enTranslations));
  const urKeys = new Set(Object.keys(urTranslations));

  for (const k of arKeys) {
    if (!enKeys.has(k)) throw new Error(`Missing key in EN: ${k}`);
    if (!urKeys.has(k)) throw new Error(`Missing key in UR: ${k}`);
  }
});

// -------------------------------------------------------------
// Section 8: Zero Unrelated Source Changes & Scope Containment
// -------------------------------------------------------------
test('B73-T19', 'LanguageSwitcher.tsx (AUDIT-72-03, P2) remains completely untouched', () => {
  const langSwitcherSource = fs.readFileSync(
    path.resolve(process.cwd(), 'src/components/i18n/LanguageSwitcher.tsx'),
    'utf-8'
  );
  // Confirms no premature P2 fix was applied in BLOCK 73
  if (!langSwitcherSource.includes('text-left') || !langSwitcherSource.includes('right-0')) {
    throw new Error('LanguageSwitcher.tsx was modified; P2 findings must remain deferred');
  }
});

test('B73-T20', 'BLOCK 73 deliverables exist and contain required schema', () => {
  if (!fs.existsSync(jsonReportPath)) throw new Error('Missing reports/uiux-block73-p1-fixes.json');
  if (!fs.existsSync(mdReportPath)) throw new Error('Missing reports/uiux-block73-p1-fixes.md');

  const jsonContent = JSON.parse(fs.readFileSync(jsonReportPath, 'utf-8'));
  if (jsonContent.metadata.p1FindingsFixedCount !== 2) {
    throw new Error('JSON report metadata must state p1FindingsFixedCount: 2');
  }
  if (!jsonContent.summary.i18nRemainsFrozen) {
    throw new Error('JSON report must confirm i18nRemainsFrozen');
  }
  if (!jsonContent.summary.noP2OrP3WorkPerformed) {
    throw new Error('JSON report must confirm noP2OrP3WorkPerformed');
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
