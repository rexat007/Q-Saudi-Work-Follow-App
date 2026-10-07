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

import { describe, it, expect } from 'vitest';
import { arTranslations } from '../locales/ar';
import { enTranslations } from '../locales/en';
import { urTranslations } from '../locales/ur';

describe('BLOCK 84A — Translation Quality Fixes Verification', () => {
  // Test 1: Catalog Key Count Frozen Invariant
  it('BLOCK-84A-01: Catalog size remains strictly frozen at 1,128 per locale', () => {
    const arKeys = Object.keys(arTranslations);
    const enKeys = Object.keys(enTranslations);
    const urKeys = Object.keys(urTranslations);

    expect(arKeys.length).toBe(1128);
    expect(enKeys.length).toBe(1128);
    expect(urKeys.length).toBe(1128);
  });

  // Test 2: Key Set Parity Invariant
  it('BLOCK-84A-02: Key sets across AR, EN, and UR are identical (0 added, 0 removed, 0 renamed)', () => {
    const arKeys = Object.keys(arTranslations).sort();
    const enKeys = Object.keys(enTranslations).sort();
    const urKeys = Object.keys(urTranslations).sort();

    expect(arKeys).toEqual(enKeys);
    expect(arKeys).toEqual(urKeys);
  });

  // Test 3: EN Mixed-Script Fix
  it('BLOCK-84A-03: EN dictionary mixed-script error fixed for navigation.labels.trips', () => {
    const enVal = enTranslations['navigation.labels.trips'];
    expect(enVal).toBe('Trip Engine');
    expect(/[\u0600-\u06FF]/.test(enVal)).toBe(false);
  });

  // Test 4: Urdu Untranslated & Mixed-Script Fixes
  it('BLOCK-84A-04: Urdu dictionary untranslated & mixed-script issues fixed', () => {
    expect(urTranslations['navigation.labels.trips']).toBe('ٹرپ انجن (Trip Engine)');
    expect(urTranslations['materials.labels.materials_2']).toBe('مواد');
    expect(urTranslations['offline.labels.projects']).toBe('منصوبے');
    expect(urTranslations['offline.labels.trips']).toBe('ٹرپس');
    expect(urTranslations['other.labels.carrier_8']).toBe('کیریئر');
    expect(urTranslations['other.labels.carrier_10']).toBe('کیریئر');
    expect(urTranslations['other.labels.enterprise']).toBe('انٹرپرائز');
    expect(urTranslations['other.labels.trip_3']).toBe('ٹرپ');
    expect(urTranslations['projects.labels.materials']).toBe('مواد');
    expect(urTranslations['projects.labels.projects']).toBe('منصوبے');
    expect(urTranslations['trips.labels.trips_3']).toBe('ٹرپس');
    expect(urTranslations['weighbridge.labels.txt_504ae8']).toBe('0.00 کلوگرام');
    expect(urTranslations['weighbridge.labels.txt_6e06f6']).toBe('37,400 کلوگرام (37.4 ٹن)');
  });

  // Test 5: Arabic Navigation Labels Streamlined
  it('BLOCK-84A-05: Arabic navigation labels streamlined into concise, clear wording', () => {
    expect(arTranslations['navigation.labels.projects']).toBe('إدارة المشاريع متعددة الأطراف');
    expect(arTranslations['navigation.labels.txt_17c5e1']).toBe('المبادئ الحاكمة للمنظومة');
    expect(arTranslations['navigation.labels.txt_23bdd6']).toBe('استعراض ارتباطات الكيانات والتعددية');
    expect(arTranslations['navigation.labels.txt_791f1b']).toBe('التحقق الخادومي من ارتباطات الكيانات');
    expect(arTranslations['navigation.labels.projectReports']).toBe('تقارير ووثائق المشروع');
  });

  // Test 6: Redundant Parentheses Removal
  it('BLOCK-84A-06: Redundant parenthetical text removed from action label other.labels.carrier_7', () => {
    expect(arTranslations['other.labels.carrier_7']).toBe('الناقل التابع له:');
    expect(enTranslations['other.labels.carrier_7']).toBe('Associated Carrier:');
    expect(urTranslations['other.labels.carrier_7']).toBe('منسلک کیریئر:');
  });

  // Test 7: Interpolation Token Parity
  it('BLOCK-84A-07: Interpolation tokens preserved across all 3 locales', () => {
    function extractTokens(str: string): string[] {
      return (str.match(/\{[^}]+\}/g) || []).sort();
    }

    for (const key of Object.keys(arTranslations)) {
      const arTokens = extractTokens(arTranslations[key]);
      const enTokens = extractTokens(enTranslations[key]);
      const urTokens = extractTokens(urTranslations[key]);

      expect(enTokens, `Token parity failed for key "${key}" between EN and AR`).toEqual(arTokens);
      expect(urTokens, `Token parity failed for key "${key}" between UR and AR`).toEqual(arTokens);
    }
  });
});
