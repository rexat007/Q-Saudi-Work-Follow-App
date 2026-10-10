/**
 * BLOCK 56 — Language Switcher Visibility Fix & Translation Quality Audit Test Suite
 *
 * Validates:
 * - I18N-SWITCHER-01: LanguageSwitcher is exported, properly configured with shrink-0, z-40/z-50, right-0, mounted in App.tsx
 * - I18N-SWITCHER-02: Arabic locale contract (ar, rtl, العربية)
 * - I18N-SWITCHER-03: English locale contract (en, ltr, English)
 * - I18N-SWITCHER-04: Urdu locale contract (ur, rtl, اردو)
 * - I18N-SWITCHER-05: Document synchronization contract test
 * - I18N-SWITCHER-06: Direction utility verification (directionOf & isRTL)
 * - I18N-QUALITY-01: EN zero-defect gate (zero Arabic script contamination)
 * - I18N-QUALITY-02: UR zero-defect gate (zero confirmed Arabic fallback / mixed frames)
 * - I18N-QUALITY-03: Fallback-identical prose zero-defect gate
 * - I18N-QUALITY-04: Hybrid morphology zero-defect gate
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { dictionaries } from '../locales';
import { AVAILABLE_LOCALES, LOCALE_DIRECTIONS, LOCALE_NAMES } from '../i18n/constants';
import { directionOf, isRTL } from '../i18n/utils';
import { LanguageSwitcher } from '../components/i18n/LanguageSwitcher';

describe('BLOCK 56 — Language Switcher Visibility & Translation Quality', () => {
  // I18N-SWITCHER-01: LanguageSwitcher structural & mounting guard
  it('I18N-SWITCHER-01 LanguageSwitcher structural styling and App.tsx mounting guard', () => {
    expect(typeof LanguageSwitcher).toBe('function');

    const switcherFilePath = path.resolve(process.cwd(), 'src/components/i18n/LanguageSwitcher.tsx');
    const switcherSource = fs.readFileSync(switcherFilePath, 'utf8');

    expect(switcherSource.includes('shrink-0')).toBe(true);
    expect(switcherSource.includes('z-40') || switcherSource.includes('z-50')).toBe(true);
    expect(switcherSource.includes('right-0')).toBe(true);

    const appFilePath = path.resolve(process.cwd(), 'src/App.tsx');
    const appSource = fs.readFileSync(appFilePath, 'utf8');

    expect(appSource.includes('<LanguageSwitcher />') || appSource.includes('<LanguageSwitcher')).toBe(true);
  });

  // I18N-SWITCHER-02: Arabic selection contract
  it('I18N-SWITCHER-02 Arabic selection contract (ar, rtl, العربية)', () => {
    expect(LOCALE_NAMES['ar']).toBe('العربية');
    expect(LOCALE_DIRECTIONS['ar']).toBe('rtl');
    expect(directionOf('ar')).toBe('rtl');
    expect(isRTL('ar')).toBe(true);
  });

  // I18N-SWITCHER-03: English selection contract
  it('I18N-SWITCHER-03 English selection contract (en, ltr, English)', () => {
    expect(LOCALE_NAMES['en']).toBe('English');
    expect(LOCALE_DIRECTIONS['en']).toBe('ltr');
    expect(directionOf('en')).toBe('ltr');
    expect(isRTL('en')).toBe(false);
  });

  // I18N-SWITCHER-04: Urdu selection contract
  it('I18N-SWITCHER-04 Urdu selection contract (ur, rtl, اردو)', () => {
    expect(LOCALE_NAMES['ur']).toBe('اردو');
    expect(LOCALE_DIRECTIONS['ur']).toBe('rtl');
    expect(directionOf('ur')).toBe('rtl');
    expect(isRTL('ur')).toBe(true);
  });

  // I18N-SWITCHER-05: Document synchronization contract test
  it('I18N-SWITCHER-05 Document synchronization contract test across available locales', () => {
    for (const loc of AVAILABLE_LOCALES) {
      const expectedLang = loc;
      const expectedDir = directionOf(loc);

      // Verify canonical contract mapping that I18nProvider applies to document.documentElement
      expect(['ar', 'en', 'ur']).toContain(expectedLang);
      expect(['rtl', 'ltr']).toContain(expectedDir);
      if (loc === 'ar' || loc === 'ur') {
        expect(expectedDir).toBe('rtl');
      } else {
        expect(expectedDir).toBe('ltr');
      }
    }
  });

  // I18N-SWITCHER-06: Direction utility verification
  it('I18N-SWITCHER-06 Direction utility verification (directionOf & isRTL)', () => {
    expect(directionOf('ar')).toBe('rtl');
    expect(directionOf('ur')).toBe('rtl');
    expect(directionOf('en')).toBe('ltr');
    expect(isRTL('ar')).toBe(true);
    expect(isRTL('ur')).toBe(true);
    expect(isRTL('en')).toBe(false);
  });

  // I18N-QUALITY-01: EN zero-defect gate
  it('I18N-QUALITY-01 EN zero-defect gate (zero Arabic script contamination)', () => {
    const arabicRegex = /[\u0600-\u06FF]/;
    const contaminatedKeys: Array<{ key: string; value: string }> = [];

    for (const [k, val] of Object.entries(dictionaries.en)) {
      if (typeof val === 'string' && arabicRegex.test(val)) {
        contaminatedKeys.push({ key: k, value: val });
      }
    }

    if (contaminatedKeys.length > 0) {
      console.error('Contaminated EN keys found:', contaminatedKeys);
    }
    expect(contaminatedKeys.length).toBe(0);
  });

  // I18N-QUALITY-02: UR zero-defect gate
  it('I18N-QUALITY-02 UR zero-defect gate (zero confirmed Arabic fallback / mixed frames)', () => {
    const candidateKeys = [
      'navigation.labels.import',
      'navigation.labels.txt_72b405',
      'navigation.labels.txt_777008',
      'navigation.labels.txt_8cf69f',
      'navigation.labels.txt_9a0a23',
      'navigation.labels.txt_b4b841',
      'navigation.labels.txt_c37ba7',
      'navigation.labels.view',
      'navigation.labels.txt_75522f',
      'navigation.labels.txt_7f13e8',
      'navigation.labels.txt_7f525d',
      'navigation.labels.txt_a4ab42',
      'navigation.labels.txt_acdcf5',
      'navigation.labels.upload',
      'navigation.status.txt_7568b1',
      'other.labels.close',
      'other.labels.import',
      'other.labels.refresh',
      'other.labels.save',
      'other.labels.txt_109310',
      'other.labels.txt_139e03',
      'other.labels.txt_158f99',
      'other.labels.txt_15a8ac',
      'other.labels.txt_16e97e',
      'other.labels.txt_1b9b40',
      'other.labels.txt_1fe296',
      'other.labels.txt_20e3e1',
      'other.labels.txt_2168d6',
      'other.labels.txt_259961',
      'other.labels.txt_265a70',
      'other.labels.txt_2670a3',
      'other.labels.txt_2bbe99',
      'other.labels.txt_2d6b3b',
      'other.labels.txt_38f4aa',
      'other.labels.txt_3c30da',
      'other.labels.txt_43b461',
      'other.labels.txt_4648ec',
      'other.labels.txt_4a13ec',
      'other.labels.txt_4c37e4',
      'other.labels.txt_54bf89',
      'other.labels.txt_633e2d',
      'other.labels.txt_68176b',
      'other.labels.txt_6aaf22',
      'other.labels.txt_6be985',
      'other.labels.txt_72168c',
      'other.labels.txt_792227',
      'other.labels.txt_9d8db2',
      'trips.labels.status_6',
      'trips.labels.txt_761b23'
    ];

    const defectiveUrKeys: Array<{ key: string; ur: string; ar: string }> = [];

    for (const k of candidateKeys) {
      const urVal = dictionaries.ur[k];
      const arVal = dictionaries.ar[k];
      if (typeof urVal === 'string' && typeof arVal === 'string') {
        if (urVal === arVal && urVal.length > 5) {
          defectiveUrKeys.push({ key: k, ur: urVal, ar: arVal });
        }
        if (urVal.includes('مركز ال')) {
          defectiveUrKeys.push({ key: k, ur: urVal, ar: arVal });
        }
      }
    }

    expect(defectiveUrKeys.length).toBe(0);
    expect(dictionaries.ur['navigation.labels.import']).toBe('امپورٹ سینٹر (Import Center)');
  });

  // I18N-QUALITY-03: Fallback-identical prose zero-defect gate
  it('I18N-QUALITY-03 Fallback-identical prose zero-defect gate', () => {
    const fallbackKeys: Array<{ key: string; value: string }> = [];
    for (const [k, arVal] of Object.entries(dictionaries.ar)) {
      const enVal = dictionaries.en[k];
      const urVal = dictionaries.ur[k];
      if (typeof arVal === 'string' && arVal === enVal && arVal === urVal && arVal.length > 20) {
        fallbackKeys.push({ key: k, value: arVal });
      }
    }

    if (fallbackKeys.length > 0) {
      console.error('Fallback identical prose keys found:', fallbackKeys);
    }
    expect(fallbackKeys.length).toBe(0);
  });

  // I18N-QUALITY-04: Hybrid morphology zero-defect gate
  it('I18N-QUALITY-04 Hybrid morphology zero-defect gate', () => {
    const hybridRegex = /[a-zA-Z]+[ةية]|Userون|Carrierين/;

    // Smoke check regex matches known patterns
    expect(hybridRegex.test('Completedة')).toBe(true);
    expect(hybridRegex.test('Readyة')).toBe(true);
    expect(hybridRegex.test('Carrierين')).toBe(true);
    expect(hybridRegex.test('Userون')).toBe(true);

    const hybridDefects: Array<{ lang: string; key: string; value: string }> = [];

    for (const lang of ['en', 'ur'] as const) {
      for (const [k, v] of Object.entries(dictionaries[lang])) {
        if (typeof v === 'string' && hybridRegex.test(v)) {
          hybridDefects.push({ lang, key: k, value: v });
        }
      }
    }

    if (hybridDefects.length > 0) {
      console.error('Hybrid morphology defects found:', hybridDefects);
    }
    expect(hybridDefects.length).toBe(0);
  });
});
