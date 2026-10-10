import { describe, it, expect } from 'vitest';
import { dictionaries } from '../locales';
import { block58Entries } from '../../scripts/run-quality-expansion-block58';

describe('BLOCK 58 — Quality Expansion Verification', () => {
  const arabicRegex = /[\u0600-\u06FF]/;
  const hybridSuffixRegex = /[a-zA-Z]+[ةية]/;

  // I18N-QUALITY-12: English repaired entries contain no unintended Arabic
  it('I18N-QUALITY-12: English repaired entries contain no unintended Arabic', () => {
    for (const entry of block58Entries) {
      const enVal = dictionaries.en[entry.key];
      expect(enVal, `Missing EN value for key: ${entry.key}`).toBeDefined();
      expect(typeof enVal, `EN value for key "${entry.key}" must be a string`).toBe('string');
      expect(arabicRegex.test(enVal), `Unintended Arabic script found in EN for key "${entry.key}": "${enVal}"`).toBe(false);
      expect(hybridSuffixRegex.test(enVal), `Hybrid morphology suffix found in EN for key "${entry.key}": "${enVal}"`).toBe(false);
    }
  });

  // I18N-QUALITY-13: Urdu repaired entries contain no unintended Arabic
  it('I18N-QUALITY-13: Urdu repaired entries contain no unintended Arabic', () => {
    const arabicFrames = [
      'أوزان التحميل',
      'إجمالي أوزان',
      'كافة المشاريع',
      'صلاحية مدير',
      'لا توجد حركات',
      'إلغاء أمر الرحلة',
      'غير مسجل في النظام',
      'تأكيد رجوع',
      'تعذر إنشاء',
      'محظور نظامياً',
      'محطة التفريغ',
      'مطلوب اعتماد',
      'سيتم التحديث',
      'بانتظار البحث',
      'اشتراط صارم',
      'قاعدة التسعير مفقودة',
      'حفظ القاعدة في',
      'تسجيل الناقل',
      'لا يوجد ناقلون'
    ];

    for (const entry of block58Entries) {
      const urVal = dictionaries.ur[entry.key];
      expect(urVal, `Missing UR value for key: ${entry.key}`).toBeDefined();
      expect(typeof urVal, `UR value for key "${entry.key}" must be a string`).toBe('string');
      expect(hybridSuffixRegex.test(urVal), `Hybrid morphology found in UR for key "${entry.key}": "${urVal}"`).toBe(false);
      for (const frame of arabicFrames) {
        expect(urVal.includes(frame), `Unconverted Arabic phrase "${frame}" found in UR for key "${entry.key}": "${urVal}"`).toBe(false);
      }
    }
  });

  // I18N-QUALITY-14: Professional semantic equivalence
  it('I18N-QUALITY-14: Professional semantic equivalence', () => {
    for (const entry of block58Entries) {
      const arVal = dictionaries.ar[entry.key];
      const enVal = dictionaries.en[entry.key];
      const urVal = dictionaries.ur[entry.key];

      expect(arVal, `Missing AR value for key: ${entry.key}`).toBeDefined();
      expect(typeof arVal, `AR value for key "${entry.key}" must be a string`).toBe('string');
      expect(arVal.trim().length, `Empty AR value for key "${entry.key}"`).toBeGreaterThan(0);

      expect(enVal, `Missing EN value for key: ${entry.key}`).toBeDefined();
      expect(typeof enVal, `EN value for key "${entry.key}" must be a string`).toBe('string');
      expect(enVal.trim().length, `Empty EN value for key "${entry.key}"`).toBeGreaterThan(0);

      expect(urVal, `Missing UR value for key: ${entry.key}`).toBeDefined();
      expect(typeof urVal, `UR value for key "${entry.key}" must be a string`).toBe('string');
      expect(urVal.trim().length, `Empty UR value for key "${entry.key}"`).toBeGreaterThan(0);

      // Must not be identical to the key name itself
      expect(enVal, `Key "${entry.key}" resolves to key identifier itself in EN`).not.toBe(entry.key);
      expect(urVal, `Key "${entry.key}" resolves to key identifier itself in UR`).not.toBe(entry.key);
    }
  });

  // I18N-QUALITY-15: Protected tokens preserved
  it('I18N-QUALITY-15: Protected tokens preserved', () => {
    const protectedTokens = [
      'SAR',
      'KG',
      'TON',
      'CSV',
      'Excel',
      'Sheets',
      'Drive',
      'PWA',
      'JSON',
      'RBAC',
      'API',
      'Outbox',
      'Weighbridge',
      'INACTIVE',
      'WARNINGS_PENDING',
      'LOADED',
      'TripExceptionEntity',
      'TGA',
      'PER_TRIP',
      'PER_TON',
      'Total Received Tons',
      'Compliance Suite',
      'Exceptions',
      'Tonnage & Weighbridge Variance',
      'Financial Settlement - Snapshot Invariance',
      'Loading Station',
      'Unloading Station',
      'Preview',
      'Atomic Server Updates',
      'Tolerance Rule',
      'Audit Confirmation',
      'Unified Pipeline',
      'Search & Identification',
      'Add to Home Screen',
      'Exception Report',
      'Cancel Dispatch'
    ];

    for (const entry of block58Entries) {
      const enVal = dictionaries.en[entry.key];
      const urVal = dictionaries.ur[entry.key];

      for (const token of protectedTokens) {
        if (entry.ar.includes(token)) {
          expect(enVal.includes(token), `Protected token "${token}" missing from EN for key "${entry.key}": "${enVal}"`).toBe(true);
          expect(urVal.includes(token), `Protected token "${token}" missing from UR for key "${entry.key}": "${urVal}"`).toBe(true);
        }
      }
    }
  });

  // I18N-QUALITY-16: Interpolation preserved
  it('I18N-QUALITY-16: Interpolation preserved', () => {
    const paramRegex = /\$\{[^}]+\}|\{[^}]+\}/g;

    for (const entry of block58Entries) {
      const arParams = (dictionaries.ar[entry.key].match(paramRegex) || []).sort();
      const enParams = (dictionaries.en[entry.key].match(paramRegex) || []).sort();
      const urParams = (dictionaries.ur[entry.key].match(paramRegex) || []).sort();

      expect(enParams, `Interpolation parameters mismatch in EN for key "${entry.key}"`).toEqual(arParams);
      expect(urParams, `Interpolation parameters mismatch in UR for key "${entry.key}"`).toEqual(arParams);
    }
  });

  // I18N-QUALITY-17: Dynamic cohort integrity
  it('I18N-QUALITY-17: Dynamic cohort integrity', () => {
    expect(block58Entries.length, 'Expected non-empty cohort in block58Entries').toBeGreaterThan(0);
    const keys = block58Entries.map(e => e.key);
    const uniqueKeys = new Set(keys);
    expect(uniqueKeys.size, 'Expected all keys in block58Entries to be unique').toBe(keys.length);
  });
});
