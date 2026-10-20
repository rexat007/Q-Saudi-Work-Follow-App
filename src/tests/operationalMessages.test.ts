import { describe, expect, it, vi } from 'vitest';
import fs from 'fs';
import ts from 'typescript';
import { operationalMessageTemplates, presentOperationalMessage } from '../i18n/operationalMessages';
import { resolveTranslation, interpolate } from '../i18n/utils';
import { dictionaries } from '../locales';

const known = 'قيمة الفارق الوزني (variance) مفقودة أو null.';
const key = 'operations.service.weight.variance_missing';
const fixtures = operationalMessageTemplates.map(entry => {
  const params: Record<string, string> = {};
  for (const match of entry.source.matchAll(/\{(\w+)\}/g)) {
    const nested = entry.key === 'operations.service.state.pricing_failed'
      ? 'لقطة التسعير (Pricing Snapshot) مفقودة في وثيقة الرحلة.'
      : entry.key === 'operations.service.state.transition_failed'
        ? 'لا يمكن بدء الرحلة بدون تسجيل وزن صافي موجب بالمصدر (netWeight > 0).'
        : 'الشاحنة (TRK-٠١) غير مسجلة بالنظام';
    params[match[1]] = entry.messageParams?.includes(match[1]) ? nested : `ID-${match[1]}-٠١۲`;
  }
  return { entry, params, message: interpolate(entry.source, params) };
});

describe('Batch-2 operational message presentation adapter', () => {
  it('routes an exact known message to its canonical key', () => {
    const t = vi.fn(() => 'localized');
    expect(presentOperationalMessage(known, t)).toBe('localized');
    expect(t).toHaveBeenCalledExactlyOnceWith(key, {});
  });

  for (const locale of ['ar', 'en', 'ur'] as const) {
    it(`resolves every registered message/template in ${locale} with all parameters preserved`, () => {
      const t = (key: string, params?: Record<string, string | number>) => resolveTranslation(key, locale, params);
      for (const { entry, params, message } of fixtures) {
        const expectedParams = { ...params };
        for (const name of entry.messageParams ?? []) {
          const nestedKey = entry.key === 'operations.service.state.pricing_failed'
            ? 'operations.service.state.snapshot_missing'
            : entry.key === 'operations.service.state.transition_failed'
              ? 'operations.service.state.origin_weight_required'
              : 'operations.service.validation.truck_missing';
          expectedParams[name] = t(nestedKey, { value0: 'TRK-٠١' });
        }
        const expected = t(entry.key, expectedParams);
        expect(dictionaries[locale][entry.key], entry.key).toBeTruthy();
        expect(presentOperationalMessage(message, t), entry.key).toBe(expected);
        for (const [name, value] of Object.entries(params)) {
          if (!entry.messageParams?.includes(name)) expect(expected, entry.key).toContain(value);
        }
        if (locale === 'ar') expect(expected, entry.key).toBe(message);
      }
      const translated = presentOperationalMessage(known, t);
      if (locale === 'ar') expect(translated).toContain('مفقودة');
      if (locale === 'en') expect(translated).toBe('Weight variance (variance) is missing or null.');
      if (locale === 'ur') expect(translated).toBe('وزن کا فرق (variance) موجود نہیں یا null ہے۔');
    });
  }

  it('leaves unknown, partial, altered, and near-match messages byte-for-byte unchanged', () => {
    const t = (key: string, params?: Record<string, string | number>) => resolveTranslation(key, 'en', params);
    for (const message of ['', 'Firebase: permission-denied', 'رسالة غير معروفة', known + ' extra', 'prefix ' + known,
      known.slice(0, -1), known.replace('variance', 'varianceX'), known + '\n']) {
      expect(presentOperationalMessage(message, t)).toBe(message);
    }
  });

  it('preserves identifiers, names, weights, formatting and interpolation-like business data', () => {
    const cases = [
      ['الشاحنة () غير مسجلة بالنظام', 'Truck () is not registered in the system'],
      ['تعذر إنشاء الرحلة لانتهاك قواعد التحقق المعمارية: الشاحنة (TRK-99) غير مسجلة بالنظام', 'Trip creation rejected by validation rules: Truck (TRK-99) is not registered in the system'],
      ['الشاحنة (PRJ-01/شاحنة-۱۲{value0}$) غير مسجلة بالنظام', 'Truck (PRJ-01/شاحنة-۱۲{value0}$) is not registered in the system'],
      ['الوزن القائم (31,000.500 كجم) يجب أن يكون أكبر من وزن الفارغ (۳۲٬۰۰۰ كجم)', 'Gross weight (31,000.500 kg) must exceed tare weight (۳۲٬۰۰۰ kg)'],
      ['تم العثور على الرحلة برقم تذكرة الميزان (ticketId: TK-00001)', 'Trip found by weighbridge ticket (ticketId: TK-00001)'],
      ['الناقل (شركة النقل أ) ليس ضمن الناقلين المصرح لهم بالمشروع (PRJ-٠١)', 'Carrier (شركة النقل أ) is not authorized for project (PRJ-٠١)'],
    ];
    for (const [message, expected] of cases) {
      expect(presentOperationalMessage(message, (key, params) => resolveTranslation(key, 'en', params))).toBe(expected);
    }
  });

  it('localizes complete known error lists and wrappers; unknown nested errors fail closed', () => {
    const t = (key: string, params?: Record<string, string | number>) => resolveTranslation(key, 'en', params);
    const second = 'قاعدة التفاوت (ToleranceRule) مفقودة أو غير محددة.';
    const list = known + ' | ' + second;
    expect(presentOperationalMessage(list, t)).toBe(t(key) + ' | ' + t('operations.service.weight.tolerance_missing'));
    const stateList = 'لا يمكن بدء الرحلة بدون تسجيل وزن صافي موجب بالمصدر (netWeight > 0). | يجب كتابة سبب توضيحي صريح ومبرر (5 أحرف على الأقل) للانتقال إلى حالة [EXCEPTION].';
    const stateExpected = t('operations.service.state.origin_weight_required') + ' | ' + t('operations.service.state.reason_required', { value0: 'EXCEPTION' });
    const prefix = '[خطأ في محرك الحالات المركزي]: فشل الانتقال إلى [IN_TRANSIT] - ';
    expect(presentOperationalMessage(prefix + stateList, t)).toBe('[Central state machine error]: transition to [IN_TRANSIT] failed - ' + stateExpected);
    for (const message of [known + ' | unknown', prefix + 'unknown', prefix + known + ' | unknown', known + ' | ' + known,
      known + ' | ' + 'الرحلة (TRP-1) غير موجودة', prefix + known,
      'تعذر إنشاء الرحلة لانتهاك قواعد التحقق المعمارية: ' + known]) {
      expect(presentOperationalMessage(message, t)).toBe(message);
    }
  });

  it('rejects ambiguous parameter extraction instead of guessing', () => {
    const message = 'الوزن القائم (1 كجم) يجب أن يكون أكبر من وزن الفارغ (2 كجم) يجب أن يكون أكبر من وزن الفارغ (3 كجم)';
    expect(presentOperationalMessage(message, (key, params) => resolveTranslation(key, 'en', params))).toBe(message);
  });

  it('never mutates a frozen service result and has no service/API/storage dependencies', () => {
    const result = Object.freeze({ messageAr: known, status: 'EXCEPTION', errorCode: 'VARIANCE', weight: 123 });
    const snapshot = JSON.stringify(result);
    presentOperationalMessage(result.messageAr, (key, params) => resolveTranslation(key, 'en', params));
    expect(JSON.stringify(result)).toBe(snapshot);
    const source = ts.createSourceFile('adapter.ts', fs.readFileSync('src/i18n/operationalMessages.ts', 'utf8'), ts.ScriptTarget.Latest, true);
    expect(source.statements.filter(ts.isImportDeclaration)).toHaveLength(0);
    expect(source.getText()).not.toMatch(/fetch\(|localStorage|indexedDB|firestore|firebase/);
  });

  it('keeps the registry unique and grounded in current service literals/templates', () => {
    expect(new Set(operationalMessageTemplates.map(entry => entry.key)).size).toBe(operationalMessageTemplates.length);
    expect(new Set(operationalMessageTemplates.map(entry => entry.source)).size).toBe(operationalMessageTemplates.length);
    const observed = new Set<string>();
    for (const file of ['src/services/weightEngine.service.ts', 'src/services/tripEngine.service.ts',
      'src/services/tripStateMachine.service.ts', 'src/services/offline/offlineCache.service.ts',
      'src/services/offline/outbox.service.ts', 'src/services/trip.service.ts', 'src/validators/trip.validator.ts', 'server/app.ts', 'server/security.middleware.ts']) {
      const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
      const visit = (node: ts.Node) => {
        if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) observed.add(node.text);
        if (ts.isTemplateExpression(node)) {
          observed.add(node.head.text + node.templateSpans.map((span, index) => `{value${index}}${span.literal.text}`).join(''));
          return;
        }
        ts.forEachChild(node, visit);
      };
      visit(source);
    }
    for (const entry of operationalMessageTemplates) expect(observed.has(entry.source), entry.key).toBe(true);
  });
});
