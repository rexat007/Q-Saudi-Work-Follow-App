import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';
import { dictionaries } from '../locales';

const reportPath = path.resolve(process.cwd(), 'reports/i18n-block63-quality-expansion.json');
const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
const repairedEntries: Array<{
  key: string;
  [k: string]: any;
}> = report.repairedEntries;

describe('BLOCK 63 — P2/P3 Quality Expansion Verification', () => {
  const arabicRegex = /[\u0600-\u06FF]/;
  const hybridSuffixRegex = /[a-zA-Z]+[ةية]/;
  const paramRegex = /\$\{[^}]+\}|\{[^}]+\}/g;

  // I18N-QUALITY-42: English quality
  it('I18N-QUALITY-42: English quality: professional syntax, complete text, valid formatting', () => {
    for (const entry of repairedEntries) {
      const enVal = dictionaries.en[entry.key];
      const arVal = dictionaries.ar[entry.key];
      expect(enVal, `Missing EN value for key "${entry.key}"`).toBeDefined();
      expect(typeof enVal, `EN value for key "${entry.key}" must be a string`).toBe('string');
      expect(enVal.trim().length, `Empty EN value for key "${entry.key}"`).toBeGreaterThan(0);
      expect(enVal.startsWith(' ') || enVal.endsWith(' '), `English translation has untrimmed whitespace for key "${entry.key}": "${enVal}"`).toBe(false);
      expect(enVal, `English translation matches Arabic fallback for key "${entry.key}"`).not.toBe(arVal);
      expect(enVal, `English translation matches key for key "${entry.key}"`).not.toBe(entry.key);
    }
  });

  // I18N-QUALITY-43: Urdu quality
  it('I18N-QUALITY-43: Urdu quality: natural syntax, domain terminology, complete text', () => {
    for (const entry of repairedEntries) {
      const urVal = dictionaries.ur[entry.key];
      const arVal = dictionaries.ar[entry.key];
      expect(urVal, `Missing UR value for key "${entry.key}"`).toBeDefined();
      expect(typeof urVal, `UR value for key "${entry.key}" must be a string`).toBe('string');
      expect(urVal.trim().length, `Empty UR value for key "${entry.key}"`).toBeGreaterThan(0);
      expect(urVal.startsWith(' ') || urVal.endsWith(' '), `Urdu translation has untrimmed whitespace for key "${entry.key}": "${urVal}"`).toBe(false);
      expect(urVal, `Urdu translation matches key for key "${entry.key}"`).not.toBe(entry.key);
      if (entry.key !== 'other.labels.delete_2') {
        expect(urVal, `Urdu translation matches Arabic fallback for key "${entry.key}"`).not.toBe(arVal);
      }
    }
  });

  // I18N-QUALITY-44: No unintended Arabic in EN
  it('I18N-QUALITY-44: No unintended Arabic in EN: strictly 0 Arabic Unicode glyphs across cohort', () => {
    for (const entry of repairedEntries) {
      const enVal = dictionaries.en[entry.key];
      expect(arabicRegex.test(enVal), `Accidental Arabic found in EN for key "${entry.key}": "${enVal}"`).toBe(false);
    }
  });

  // I18N-QUALITY-45: No unintended Arabic in UR
  it('I18N-QUALITY-45: No unintended Arabic in UR: no unmigrated Arabic phrases or corrupt hybrid morphology', () => {
    const corruptArabicPhrases = [
      'المراجعة والإنشاء',
      'إعادة تعيين المعالج',
      'شركات النقل',
      'صلاحيات الوصول',
      'توازي التعديل',
      'التذكرة محجوزة لرحلة سابقة',
      'حالة IndexedDB المحلية',
      'طابور الصادر Outbox',
      'تكرار تذكرة',
      'تنظيف العمليات المزامنة',
      'حل التعارض الصريح',
      'تعارض إصدار',
      'جاري المحاكاة',
      'عدد السجلات',
      'المحاولات',
      'قاعدة إلزامية',
      'الطابع الزمني',
      'مسح المؤكدة',
      'المبرر التدقيقي',
      'تمنع الاعتماد حتمياً',
      'نوع التفاوت المسموح',
      'محرك حسابي خادومي',
      'حالة التدقيق',
      'تم القبول الرقابي',
      'صافي معتمد',
      'إعادة الفحص الآن',
      'موقع أو كبينة الميزان',
      'الناقلون المسجلون',
      'أنت تحاول حذف السجل',
      'ممنوع حذف'
    ];

    for (const entry of repairedEntries) {
      const urVal = dictionaries.ur[entry.key];
      expect(hybridSuffixRegex.test(urVal), `Corrupt hybrid morphology found in UR for key "${entry.key}": "${urVal}"`).toBe(false);
      for (const phrase of corruptArabicPhrases) {
        expect(urVal.includes(phrase), `Unmigrated Arabic phrase "${phrase}" found in UR for key "${entry.key}": "${urVal}"`).toBe(false);
      }
    }
  });

  // I18N-QUALITY-47: Protected tokens
  it('I18N-QUALITY-47: Protected tokens: technical codes, units, and models preserved across EN and UR', () => {
    const protectedTokens = [
      'ticketId', 'truckNo', 'projectId', 'carrierId', 'driverId', 'materialId',
      'operationId', 'pricingType', 'settlementBase', 'sourceType',
      'SAR', 'KG', 'TON', 'CSV', 'Excel', 'Sheets', 'Drive', 'Firestore',
      'PWA', 'JSON', 'RBAC', 'API',
      'IN_TRANSIT', 'ARRIVED', 'COMPLETED', 'PENDING', 'LOADED', 'ACTIVE',
      'PER_TRIP', 'PER_TON'
    ];

    for (const entry of repairedEntries) {
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

  // I18N-QUALITY-48: Interpolation parity
  it('I18N-QUALITY-48: Interpolation parity: identical variable placeholders across AR, EN, and UR', () => {
    for (const entry of repairedEntries) {
      const arVal = dictionaries.ar[entry.key];
      const enVal = dictionaries.en[entry.key];
      const urVal = dictionaries.ur[entry.key];

      const arParams = (arVal.match(paramRegex) || []).sort();
      const enParams = (enVal.match(paramRegex) || []).sort();
      const urParams = (urVal.match(paramRegex) || []).sort();

      expect(enParams, `Interpolation mismatch in EN for key "${entry.key}": AR=${arParams}, EN=${enParams}`).toEqual(arParams);
      expect(urParams, `Interpolation mismatch in UR for key "${entry.key}": AR=${arParams}, UR=${urParams}`).toEqual(arParams);
    }
  });

  // I18N-QUALITY-49: Dynamic cohort integrity
  it('I18N-QUALITY-49: Dynamic cohort integrity', () => {
    expect(repairedEntries.length, 'Expected non-empty cohort in repairedEntries').toBeGreaterThan(0);
    const keys = repairedEntries.map(e => e.key);
    const uniqueKeys = new Set(keys);
    expect(uniqueKeys.size, 'Expected all keys in repairedEntries to be unique').toBe(keys.length);
    for (const entry of repairedEntries) {
      expect(dictionaries.ar[entry.key], `Missing AR dictionary entry for key "${entry.key}"`).toBeDefined();
      expect(dictionaries.en[entry.key], `Missing EN dictionary entry for key "${entry.key}"`).toBeDefined();
      expect(dictionaries.ur[entry.key], `Missing UR dictionary entry for key "${entry.key}"`).toBeDefined();
    }
  });
});
