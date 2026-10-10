import { describe, it, expect } from 'vitest';
import { dictionaries } from '../locales';
import { block59Entries } from '../../scripts/run-quality-expansion-block59';

describe('BLOCK 59 — Quality Expansion Verification', () => {
  const arabicRegex = /[\u0600-\u06FF]/;
  const hybridSuffixRegex = /[a-zA-Z]+[ةية]/;

  // I18N-QUALITY-18: Dynamic cohort integrity
  it('I18N-QUALITY-18: Dynamic cohort integrity', () => {
    expect(block59Entries.length, 'Expected non-empty cohort in block59Entries').toBeGreaterThan(0);
    const keys = block59Entries.map(e => e.key);
    const uniqueKeys = new Set(keys);
    expect(uniqueKeys.size, 'Expected all keys in block59Entries to be internally unique').toBe(keys.length);
  });

  // I18N-QUALITY-19: English repaired entries contain zero Arabic characters
  it('I18N-QUALITY-19: English repaired entries contain zero Arabic characters', () => {
    for (const entry of block59Entries) {
      const enVal = dictionaries.en[entry.key];
      expect(enVal, `Missing EN value for key "${entry.key}"`).toBeDefined();
      expect(typeof enVal, `EN value for key "${entry.key}" must be a string`).toBe('string');
      expect(enVal.trim().length, `Empty value found in EN for key "${entry.key}"`).toBeGreaterThan(0);
      expect(arabicRegex.test(enVal), `Unintended Arabic script found in EN for key "${entry.key}": "${enVal}"`).toBe(false);
      expect(hybridSuffixRegex.test(enVal), `Hybrid morphology found in EN for key "${entry.key}": "${enVal}"`).toBe(false);
    }
  });

  // I18N-QUALITY-20: Urdu repaired entries contain natural syntax and no unconverted Arabic phrases
  it('I18N-QUALITY-20: Urdu repaired entries contain natural syntax and no unconverted Arabic phrases', () => {
    const unconvertedArabicPhrases = [
      'أوزان التحميل',
      'إجمالي أوزان',
      'إعادة Synchronization',
      'إظهار طريقة التسعير',
      'يُحظر المضي التلقائي',
      'تنبيه غامض',
      'قواعد Verification',
      'ساري وقت',
      'تم تعليق أو',
      'جاري تهيئة'
    ];

    for (const entry of block59Entries) {
      const urVal = dictionaries.ur[entry.key];
      expect(urVal, `Missing UR value for key "${entry.key}"`).toBeDefined();
      expect(typeof urVal, `UR value for key "${entry.key}" must be a string`).toBe('string');
      expect(urVal.trim().length, `Empty value found in UR for key "${entry.key}"`).toBeGreaterThan(0);
      expect(hybridSuffixRegex.test(urVal), `Hybrid morphology found in UR for key "${entry.key}": "${urVal}"`).toBe(false);
      for (const phrase of unconvertedArabicPhrases) {
        expect(urVal.includes(phrase), `Unconverted Arabic phrase "${phrase}" found in UR for key "${entry.key}": "${urVal}"`).toBe(false);
      }
    }
  });

  // I18N-QUALITY-21: Canonical Arabic presence and validity
  it('I18N-QUALITY-21: Canonical Arabic presence and validity', () => {
    for (const entry of block59Entries) {
      const arVal = dictionaries.ar[entry.key];
      expect(arVal, `Missing canonical AR value for key "${entry.key}"`).toBeDefined();
      expect(typeof arVal, `AR value for key "${entry.key}" must be a string`).toBe('string');
      expect(arVal.trim().length, `Empty value found in AR for key "${entry.key}"`).toBeGreaterThan(0);
    }
  });

  // I18N-QUALITY-22: Category C fallbacks completely replaced with target language translations
  it('I18N-QUALITY-22: Category C fallbacks completely replaced with target language translations', () => {
    const catCEntries = block59Entries.filter(e => e.category === 'C');
    for (const entry of catCEntries) {
      const arVal = dictionaries.ar[entry.key];
      const enVal = dictionaries.en[entry.key];
      const urVal = dictionaries.ur[entry.key];

      expect(enVal, `Category C fallback to Arabic remains in EN for key "${entry.key}"`).not.toBe(arVal);
      expect(urVal, `Category C fallback to Arabic remains in UR for key "${entry.key}"`).not.toBe(arVal);
      expect(enVal, `Key resolves to key identifier itself in EN for "${entry.key}"`).not.toBe(entry.key);
      expect(urVal, `Key resolves to key identifier itself in UR for "${entry.key}"`).not.toBe(entry.key);
    }
  });

  // I18N-QUALITY-24: Protected tokens preserved in both EN and UR
  it('I18N-QUALITY-24: Protected tokens preserved in both EN and UR', () => {
    const protectedTokens = [
      'SAR', 'KG', 'TON', 'M3', 'TRIP', 'Idempotency', 'Anti-LWW', 'Upsert', 'Blind Append',
      'Google Drive', 'Google Sheets', 'Firestore', 'Google',
      'DUPLICATE_OPERATION', 'TRIP_ALREADY_COMPLETED', 'PRICING_CHANGED', 'INACTIVE',
      'RETURNED', 'RETURN_REQUESTED', 'DRAFT', 'COMPLETED',
      'truckId', 'tripId', 'PRJ-NEOM-001', 'settlementBase'
    ];

    for (const entry of block59Entries) {
      const arVal = dictionaries.ar[entry.key];
      const enVal = dictionaries.en[entry.key];
      const urVal = dictionaries.ur[entry.key];

      for (const token of protectedTokens) {
        if (arVal.includes(token)) {
          expect(enVal.includes(token), `Protected token "${token}" missing from EN for key "${entry.key}": "${enVal}"`).toBe(true);
          expect(urVal.includes(token), `Protected token "${token}" missing from UR for key "${entry.key}": "${urVal}"`).toBe(true);
        }
      }
    }
  });

  // I18N-QUALITY-25: Interpolation parameters parity across AR, EN, and UR
  it('I18N-QUALITY-25: Interpolation parameters parity across AR, EN, and UR', () => {
    const paramRegex = /\$\{[^}]+\}|\{[^}]+\}/g;

    for (const entry of block59Entries) {
      const arParams = (dictionaries.ar[entry.key].match(paramRegex) || []).sort();
      const enParams = (dictionaries.en[entry.key].match(paramRegex) || []).sort();
      const urParams = (dictionaries.ur[entry.key].match(paramRegex) || []).sort();

      expect(enParams, `Interpolation mismatch in EN for key "${entry.key}"`).toEqual(arParams);
      expect(urParams, `Interpolation mismatch in UR for key "${entry.key}"`).toEqual(arParams);
    }
  });
});
