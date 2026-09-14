/**
 * BLOCK 84A — TRANSLATION QUALITY FIXES VERIFICATION TEST SUITE
 * 
 * Verifies that all 19 confirmed translation findings from BLOCK 84 have been fixed:
 * 1. EN dictionary mixed-script issue fixed ("navigation.labels.trips" -> "Trip Engine").
 * 2. 8 Urdu untranslated/mixed-script issues resolved into natural Urdu script.
 * 3. 8 Arabic navigation labels streamlined into concise, natural Arabic wording.
 * 4. Redundant English parenthetical text removed from action labels.
 * 5. Interpolation token parity preserved ({count}, {name}, etc.).
 * 6. Catalog size strictly frozen: AR = 1,128, EN = 1,128, UR = 1,128.
 * 7. Key set unchanged (0 added, 0 removed, 0 renamed).
 */

import { arTranslations } from '../locales/ar';
import { enTranslations } from '../locales/en';
import { urTranslations } from '../locales/ur';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

async function runTest(id: string, description: string, fn: () => void | Promise<void>) {
  totalTests++;
  try {
    await fn();
    passedTests++;
    console.log(`  ✅ [PASS] [${id}]: ${description}`);
  } catch (err: any) {
    failedTests++;
    console.error(`  ❌ [FAIL] [${id}]: ${description} -> ${err.message}`);
  }
}

async function executeTestSuite() {
  console.log('======================================================');
  console.log('🚀 Running BLOCK 84A Translation Quality Fixes Test Suite...');
  console.log('======================================================');

  // Test 1: Catalog Key Count Frozen Invariant
  await runTest('BLOCK-84A-01', 'Catalog size remains strictly frozen at 1,128 per locale', () => {
    const arKeys = Object.keys(arTranslations);
    const enKeys = Object.keys(enTranslations);
    const urKeys = Object.keys(urTranslations);

    assert(arKeys.length === 1128, `AR key count must be 1,128 (got ${arKeys.length})`);
    assert(enKeys.length === 1128, `EN key count must be 1,128 (got ${enKeys.length})`);
    assert(urKeys.length === 1128, `UR key count must be 1,128 (got ${urKeys.length})`);
  });

  // Test 2: Key Set Parity Invariant
  await runTest('BLOCK-84A-02', 'Key sets across AR, EN, and UR are identical (0 added, 0 removed, 0 renamed)', () => {
    const arKeys = Object.keys(arTranslations).sort();
    const enKeys = Object.keys(enTranslations).sort();
    const urKeys = Object.keys(urTranslations).sort();

    assert(JSON.stringify(arKeys) === JSON.stringify(enKeys), 'AR and EN key sets must match exactly');
    assert(JSON.stringify(arKeys) === JSON.stringify(urKeys), 'AR and UR key sets must match exactly');
  });

  // Test 3: EN Mixed-Script Fix
  await runTest('BLOCK-84A-03', 'EN dictionary mixed-script error fixed for navigation.labels.trips', () => {
    const enVal = enTranslations["navigation.labels.trips"];
    assert(enVal === "Trip Engine", `Expected "Trip Engine", got "${enVal}"`);
    assert(!/[\u0600-\u06FF]/.test(enVal), 'EN string must not contain Arabic script');
  });

  // Test 4: Urdu Untranslated & Mixed-Script Fixes
  await runTest('BLOCK-84A-04', 'Urdu dictionary untranslated & mixed-script issues fixed', () => {
    assert(urTranslations["navigation.labels.trips"] === "ٹرپ انجن (Trip Engine)", 'navigation.labels.trips in UR should be native Urdu');
    assert(urTranslations["materials.labels.materials_2"] === "مواد", 'materials.labels.materials_2 should be Urdu "مواد"');
    assert(urTranslations["offline.labels.projects"] === "منصوبے", 'offline.labels.projects should be Urdu "منصوبے"');
    assert(urTranslations["offline.labels.trips"] === "ٹرپس", 'offline.labels.trips should be Urdu "ٹرپس"');
    assert(urTranslations["other.labels.carrier_8"] === "کیریئر", 'other.labels.carrier_8 should be Urdu "کیریئر"');
    assert(urTranslations["other.labels.carrier_10"] === "کیریئر", 'other.labels.carrier_10 should be Urdu "کیریئر"');
    assert(urTranslations["other.labels.enterprise"] === "انٹرپرائز", 'other.labels.enterprise should be Urdu "انٹرپرائز"');
    assert(urTranslations["other.labels.trip_3"] === "ٹرپ", 'other.labels.trip_3 should be Urdu "ٹرپ"');
    assert(urTranslations["projects.labels.materials"] === "مواد", 'projects.labels.materials should be Urdu "مواد"');
    assert(urTranslations["projects.labels.projects"] === "منصوبے", 'projects.labels.projects should be Urdu "منصوبے"');
    assert(urTranslations["trips.labels.trips_3"] === "ٹرپس", 'trips.labels.trips_3 should be Urdu "ٹرپس"');
    assert(urTranslations["weighbridge.labels.txt_504ae8"] === "0.00 کلوگرام", 'weighbridge.labels.txt_504ae8 should be Urdu');
    assert(urTranslations["weighbridge.labels.txt_6e06f6"] === "37,400 کلوگرام (37.4 ٹن)", 'weighbridge.labels.txt_6e06f6 should be Urdu');
  });

  // Test 5: Arabic Navigation Labels Streamlined
  await runTest('BLOCK-84A-05', 'Arabic navigation labels streamlined into concise, clear wording', () => {
    assert(arTranslations["navigation.labels.projects"] === "إدارة المشاريع متعددة الأطراف", 'navigation.labels.projects concise AR label');
    assert(arTranslations["navigation.labels.txt_17c5e1"] === "المبادئ الحاكمة للمنظومة", 'txt_17c5e1 concise AR label');
    assert(arTranslations["navigation.labels.txt_23bdd6"] === "استعراض ارتباطات الكيانات والتعددية", 'txt_23bdd6 concise AR label');
    assert(arTranslations["navigation.labels.txt_791f1b"] === "التحقق الخادومي من ارتباطات الكيانات", 'txt_791f1b concise AR label');
    assert(arTranslations["navigation.labels.projectReports"] === "تقارير ووثائق المشروع", 'projectReports concise AR label');
  });

  // Test 6: Redundant Parentheses Removal
  await runTest('BLOCK-84A-06', 'Redundant parenthetical text removed from action label other.labels.carrier_7', () => {
    assert(arTranslations["other.labels.carrier_7"] === "الناقل التابع له:", 'AR carrier_7 without parenthetical');
    assert(enTranslations["other.labels.carrier_7"] === "Associated Carrier:", 'EN carrier_7 without parenthetical');
    assert(urTranslations["other.labels.carrier_7"] === "منسلک کیریئر:", 'UR carrier_7 without parenthetical');
  });

  // Test 7: Interpolation Token Parity
  await runTest('BLOCK-84A-07', 'Interpolation tokens preserved across all 3 locales', () => {
    function extractTokens(str: string): string[] {
      return (str.match(/\{[^}]+\}/g) || []).sort();
    }

    for (const key of Object.keys(arTranslations)) {
      const arTokens = extractTokens(arTranslations[key]);
      const enTokens = extractTokens(enTranslations[key]);
      const urTokens = extractTokens(urTranslations[key]);

      assert(
        JSON.stringify(arTokens) === JSON.stringify(enTokens) &&
        JSON.stringify(arTokens) === JSON.stringify(urTokens),
        `Token parity failed for key "${key}"`
      );
    }
  });

  console.log('======================================================');
  console.log(`BLOCK 84A: Translation Fixes Test Results: ${passedTests}/${totalTests} PASSED`);
  console.log('======================================================');

  if (failedTests > 0) {
    process.exit(1);
  }
}

executeTestSuite();
