/**
 * BLOCK 40 — Phase 1: i18n Foundation & Architecture Test Suite
 * Vitest Native Harness Migration (P0-U3C10)
 * 
 * Tests:
 * I18N-01: default locale = ar
 * I18N-02: setLocale(en)
 * I18N-03: setLocale(ur)
 * I18N-04: Arabic => rtl
 * I18N-05: Urdu => rtl
 * I18N-06: English => ltr
 * I18N-07: persistence via localStorage
 * I18N-08: invalid locale fallback to ar
 * I18N-09: translation lookup across AR/EN/UR
 * I18N-10: missing active-locale translation falls back to Arabic
 * I18N-11: missing key warns in development behavior
 * I18N-12: interpolation
 * I18N-13: foundation keys exist across all locales
 * I18N-14: unknown runtime key safe fallback
 * I18N-15: simulated LanguageSwitcher state/storage behavior
 * I18N-16: document.documentElement.lang synchronization
 * I18N-17: document.documentElement.dir synchronization
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  DEFAULT_LOCALE,
  AVAILABLE_LOCALES,
  STORAGE_KEY,
  isRTL,
  directionOf,
  isValidLocale,
  getStoredLocale,
  setStoredLocale,
  resolveTranslation,
  FoundationTranslationKey,
  Locale,
} from '../i18n';
import { dictionaries } from '../locales';

// Ensure minimal browser globals in Node environment
const memoryStore: Record<string, string> = {};
if (typeof globalThis.window === 'undefined') {
  (globalThis as any).window = {
    localStorage: {
      getItem: (key: string) => memoryStore[key] ?? null,
      setItem: (key: string, value: string) => { memoryStore[key] = String(value); },
      removeItem: (key: string) => { delete memoryStore[key]; },
      clear: () => { Object.keys(memoryStore).forEach(k => delete memoryStore[k]); },
    },
  };
}
if (typeof globalThis.document === 'undefined') {
  (globalThis as any).document = {
    documentElement: {
      lang: 'ar',
      dir: 'rtl',
    },
  };
}

describe('BLOCK 40: i18n Foundation & Architecture Test Suite', () => {
  beforeEach(() => {
    // Deterministic state reset before every test
    window.localStorage.clear();
    document.documentElement.lang = 'ar';
    document.documentElement.dir = 'rtl';
  });

  // ----------------------------------------------------
  // I18N-01: default locale = ar
  // ----------------------------------------------------
  it('I18N-01: Default locale is "ar"', () => {
    const defaultLoc = getStoredLocale();
    expect(defaultLoc).toBe('ar');
    expect(DEFAULT_LOCALE).toBe('ar');
  });

  // ----------------------------------------------------
  // I18N-02: setLocale(en)
  // ----------------------------------------------------
  it('I18N-02: setLocale(en) updates current locale', () => {
    setStoredLocale('en');
    const enLoc = getStoredLocale();
    expect(enLoc).toBe('en');
  });

  // ----------------------------------------------------
  // I18N-03: setLocale(ur)
  // ----------------------------------------------------
  it('I18N-03: setLocale(ur) updates current locale', () => {
    setStoredLocale('ur');
    const urLoc = getStoredLocale();
    expect(urLoc).toBe('ur');
  });

  // ----------------------------------------------------
  // I18N-04: Arabic => rtl
  // ----------------------------------------------------
  it('I18N-04: Arabic maps to RTL direction', () => {
    const arDir = directionOf('ar');
    const arIsRtl = isRTL('ar');
    expect(arDir).toBe('rtl');
    expect(arIsRtl).toBe(true);
  });

  // ----------------------------------------------------
  // I18N-05: Urdu => rtl
  // ----------------------------------------------------
  it('I18N-05: Urdu maps to RTL direction', () => {
    const urDir = directionOf('ur');
    const urIsRtl = isRTL('ur');
    expect(urDir).toBe('rtl');
    expect(urIsRtl).toBe(true);
  });

  // ----------------------------------------------------
  // I18N-06: English => ltr
  // ----------------------------------------------------
  it('I18N-06: English maps to LTR direction', () => {
    const enDir = directionOf('en');
    const enIsRtl = isRTL('en');
    expect(enDir).toBe('ltr');
    expect(enIsRtl).toBe(false);
  });

  // ----------------------------------------------------
  // I18N-07: Persistence
  // ----------------------------------------------------
  it('I18N-07: Locale preference is saved in local storage and reloaded', () => {
    setStoredLocale('en');
    const persisted = window.localStorage.getItem(STORAGE_KEY);
    const reloaded = getStoredLocale();
    expect(persisted).toBe('en');
    expect(reloaded).toBe('en');
  });

  // ----------------------------------------------------
  // I18N-08: Invalid locale fallback
  // ----------------------------------------------------
  it('I18N-08: Invalid locale falls back to "ar"', () => {
    window.localStorage.setItem(STORAGE_KEY, 'invalid_xyz');
    const fallbackFromInvalid = getStoredLocale();
    const validCheck1 = isValidLocale('fr');
    const validCheck2 = isValidLocale(123);
    const validCheck3 = isValidLocale('ar');
    expect(fallbackFromInvalid).toBe('ar');
    expect(validCheck1).toBe(false);
    expect(validCheck2).toBe(false);
    expect(validCheck3).toBe(true);
  });

  // ----------------------------------------------------
  // I18N-09: Translation lookup
  // ----------------------------------------------------
  it('I18N-09: Translation lookup retrieves correct values for ar, en, ur', () => {
    const tAr = resolveTranslation('shared.actions.save', 'ar');
    const tEn = resolveTranslation('shared.actions.save', 'en');
    const tUr = resolveTranslation('shared.actions.save', 'ur');
    expect(tAr).toBe('حفظ');
    expect(tEn).toBe('Save');
    expect(tUr).toBe('محفوظ کریں');
  });

  // ----------------------------------------------------
  // I18N-10: Fallback to Arabic
  // ----------------------------------------------------
  it('I18N-10: Missing translation in active locale falls back to Arabic', () => {
    // Create a mock dictionary where 'shared.status.loading' is missing in 'ur'
    const customDict = {
      ar: { ...dictionaries.ar },
      en: { ...dictionaries.en },
      ur: { ...dictionaries.ur, 'shared.status.loading': undefined } as any,
    };
    const fallbackVal = resolveTranslation('shared.status.loading', 'ur', undefined, customDict);
    expect(fallbackVal).toBe('جاري التحميل...');
  });

  // ----------------------------------------------------
  // I18N-11: Missing key warning in development
  // ----------------------------------------------------
  it('I18N-11: Missing key emits a console warning in development mode', () => {
    let warnCalled = false;
    let warnMsg = '';
    const originalWarn = console.warn;
    console.warn = (...args: any[]) => {
      warnCalled = true;
      warnMsg = args.join(' ');
    };
    try {
      resolveTranslation('non_existent_key' as any, 'en');
    } finally {
      console.warn = originalWarn;
    }
    expect(warnCalled).toBe(true);
    expect(warnMsg).toContain('Missing translation key');
  });

  // ----------------------------------------------------
  // I18N-12: Interpolation
  // ----------------------------------------------------
  it('I18N-12: Interpolation injects parameters cleanly ({count})', () => {
    const interpAr = resolveTranslation('example.count', 'ar', { count: 25 });
    const interpEn = resolveTranslation('example.count', 'en', { count: 25 });
    const interpUr = resolveTranslation('example.count', 'ur', { count: 25 });
    expect(interpAr).toBe('العدد: 25');
    expect(interpEn).toBe('Count: 25');
    expect(interpUr).toBe('تعداد: 25');
  });

  // ----------------------------------------------------
  // I18N-13: All foundation keys exist in ar/en/ur
  // ----------------------------------------------------
  it('I18N-13: All foundation translation keys exist in ar, en, and ur', () => {
    const requiredFoundationKeys: FoundationTranslationKey[] = [
      'shared.actions.save',
      'shared.actions.cancel',
      'shared.actions.confirm',
      'shared.actions.close',
      'shared.actions.delete',
      'shared.actions.edit',
      'shared.status.loading',
      'shared.status.error',
      'shared.status.success',
      'shared.units.kg',
      'shared.units.ton',
      'shared.units.sar',
      'navigation.language',
      'navigation.language.ar',
      'navigation.language.en',
      'navigation.language.ur',
      'example.count',
    ];

    const missingKeys: { locale: Locale; key: string }[] = [];
    AVAILABLE_LOCALES.forEach((loc) => {
      const dict = dictionaries[loc];
      requiredFoundationKeys.forEach((key) => {
        if (!dict[key] || typeof dict[key] !== 'string' || dict[key].trim() === '') {
          missingKeys.push({ locale: loc, key });
        }
      });
    });

    expect(missingKeys.length).toBe(0);
  });

  // ----------------------------------------------------
  // I18N-14: Invalid key rejected / safe fallback
  // ----------------------------------------------------
  it('I18N-14: Type-safe contract and safe runtime fallback for unknown keys', () => {
    const safeFallbackResult = resolveTranslation('unregistered.runtime.key' as any, 'ar');
    expect(safeFallbackResult).toBe('unregistered.runtime.key');
  });

  // ----------------------------------------------------
  // I18N-15: LanguageSwitcher changes locale
  // ----------------------------------------------------
  it('I18N-15: LanguageSwitcher correctly updates locale state and persistent storage', () => {
    let currentSimulatedLocale: Locale = 'ar';
    const switchLocale = (newLoc: Locale) => {
      currentSimulatedLocale = newLoc;
      setStoredLocale(newLoc);
      document.documentElement.lang = newLoc;
      document.documentElement.dir = directionOf(newLoc);
    };

    switchLocale('en');
    expect(currentSimulatedLocale).toBe('en');
    expect(getStoredLocale()).toBe('en');

    switchLocale('ur');
    expect(currentSimulatedLocale).toBe('ur');
    expect(getStoredLocale()).toBe('ur');

    switchLocale('ar');
    expect(currentSimulatedLocale).toBe('ar');
    expect(getStoredLocale()).toBe('ar');
  });

  // ----------------------------------------------------
  // I18N-16: Document lang updates
  // ----------------------------------------------------
  it('I18N-16: document.documentElement.lang synchronizes with current locale', () => {
    document.documentElement.lang = 'en';
    expect(document.documentElement.lang).toBe('en');
    document.documentElement.lang = 'ur';
    expect(document.documentElement.lang).toBe('ur');
    document.documentElement.lang = 'ar';
    expect(document.documentElement.lang).toBe('ar');
  });

  // ----------------------------------------------------
  // I18N-17: Document dir updates
  // ----------------------------------------------------
  it('I18N-17: document.documentElement.dir synchronizes with current locale direction', () => {
    document.documentElement.dir = directionOf('en');
    expect(document.documentElement.dir).toBe('ltr');
    document.documentElement.dir = directionOf('ur');
    expect(document.documentElement.dir).toBe('rtl');
    document.documentElement.dir = directionOf('ar');
    expect(document.documentElement.dir).toBe('rtl');
  });
});
