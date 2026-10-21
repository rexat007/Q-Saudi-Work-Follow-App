import { describe, expect, it } from 'vitest';
import { dictionaries } from '../locales';
import { resolveTranslation } from '../i18n/utils';
import { batch4MessageTemplates, presentBatch4Message } from '../i18n/batch4Messages';
import {
  batch4FieldLabel, batch4LayerLabel, batch4RosterStageLabel, batch4ConflictFieldLabel,
  batch4DiagnosticText, batch4ArchitectureText, batch4RelationText, batch4ReferenceText,
} from '../i18n/batch4Presentation';
import { PROJECT_SETUP_LAYERS } from '../services/projectSetupWorkflow.service';
import { ROSTER_STAGE_DEFINITIONS } from '../services/import/rosterSmartImportWorkflow.service';

const locales = ['ar', 'en', 'ur'] as const;
const translator = (locale: typeof locales[number]) => (key: string, params?: Record<string, string | number>) =>
  resolveTranslation(key, locale, params);
const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map(match => match[1]).sort();

describe('Batch 4 presentation boundaries', () => {
  it('resolves every closed message key with matching interpolation contracts in AR, EN and UR', () => {
    for (const key of new Set(batch4MessageTemplates.map(entry => entry.key))) {
      for (const locale of locales) {
        expect(dictionaries[locale][key]?.trim().length, `${locale}: ${key}`).toBeGreaterThan(0);
        expect(placeholders(dictionaries[locale][key]), key).toEqual(placeholders(dictionaries.ar[key]));
      }
    }
  });

  it('localizes exact service messages and their English aliases without altering the service input', () => {
    const input = Object.freeze({ message: 'معرف المشروع مطلوب', code: 'PROJECT_REQUIRED', projectId: 'PRJ-001' });
    for (const locale of locales) {
      expect(presentBatch4Message(input.message, translator(locale))).toBe(translator(locale)('batch4.service.project_id_required'));
      expect(presentBatch4Message('Project identifier is required', translator(locale))).toBe(translator(locale)('batch4.service.project_id_required'));
    }
    expect(input).toEqual({ message: 'معرف المشروع مطلوب', code: 'PROJECT_REQUIRED', projectId: 'PRJ-001' });
  });

  it('preserves arbitrary business text, punctuation and braces inside a recognized parameter', () => {
    const name = 'شركة ألف {value1} | A & B';
    const source = `الناقل (${name}) غير مسجل في السجلات المعتمدة للمشروع.`;
    for (const locale of locales) {
      expect(presentBatch4Message(source, translator(locale))).toBe(translator(locale)('batch4.service.carrier_not_registered', { value0: name }));
    }
  });

  it('passes through unknown, partial and ambiguously parameterized messages', () => {
    const source = batch4MessageTemplates.find(entry => entry.key === 'batch4.service.truck_carrier_conflict' && entry.source.startsWith('تعارض'))!.source;
    const [a, b, c, d] = source.split(/\{value\d+\}/);
    const ambiguous = a + 'first' + b + 'second' + c + 'inside' + b + 'other' + c + 'last' + d;
    for (const locale of locales) {
      for (const message of ['External server detail: شركة ألف', 'معرف المشروع مطلوب EXTRA', ambiguous]) {
        expect(presentBatch4Message(message, translator(locale))).toBe(message);
      }
    }
  });

  it('translates known nested workspace errors while preserving unknown diagnostic details', () => {
    for (const locale of locales) {
      const t = translator(locale);
      expect(presentBatch4Message('فشل تحديث وإسقاط البيانات في جدول البيانات: المشروع غير موجود', t)).toBe(
        t('batch4.service.workspace_projection_failed', { value0: t('batch4.service.project_not_found') }),
      );
      const detail = 'HTTP 502 / upstream request xyz';
      expect(presentBatch4Message(`فشل تحديث وإسقاط البيانات في جدول البيانات: ${detail}`, t)).toBe(
        t('batch4.service.workspace_projection_failed', { value0: detail }),
      );
    }
  });

  it('translates only the explicitly joined intake-validation family', () => {
    for (const locale of locales) {
      const t = translator(locale);
      const source = 'خطأ في فحص الملف: الملف فارغ (0 بايت) ولا يحتوي على أي بيانات | نوع وسائط الملف (text/html) لا يتطابق مع ملفات CSV المعتمدة';
      expect(presentBatch4Message(source, t)).toBe(t('batch4.service.file_validation_failed', {
        value0: t('batch4.service.file_empty') + ' | ' + t('batch4.service.csv_mime_invalid', { value0: 'text/html' }),
      }));
      expect(presentBatch4Message('Unknown | الملف فارغ (0 بايت) ولا يحتوي على أي بيانات', t)).toBe('Unknown | الملف فارغ (0 بايت) ولا يحتوي على أي بيانات');
    }
  });

  it('relocalizes an existing visible error when the selected locale changes', () => {
    const savedError = translator('en')('projects.batch4.project_name_minimum');
    expect(presentBatch4Message(savedError, translator('ur'))).toBe(translator('ur')('projects.batch4.project_name_minimum'));
    expect(presentBatch4Message(savedError, translator('ar'))).toBe(translator('ar')('projects.batch4.project_name_minimum'));
    const recoveryPrefix = 'DRIVER_CANONICAL_CONVERGENCE_NOT_PROVEN: ';
    expect(presentBatch4Message(recoveryPrefix + translator('ar')('entityResolution.messages.created_refresh_failed'), translator('ur'))).toBe(
      recoveryPrefix + translator('ur')('entityResolution.messages.created_refresh_failed'),
    );
  });

  it('localizes setup and roster metadata without changing layer identities, order or source metadata', () => {
    const before = JSON.stringify({ layers: PROJECT_SETUP_LAYERS, stages: ROSTER_STAGE_DEFINITIONS });
    for (const locale of locales) {
      const consumed: string[] = [];
      const t = (key: string) => { consumed.push(key); return translator(locale)(key); };
      for (const layer of PROJECT_SETUP_LAYERS) expect(batch4LayerLabel(t, layer.id, '__unmapped__')).not.toBe('__unmapped__');
      for (const stage of ROSTER_STAGE_DEFINITIONS) expect(batch4RosterStageLabel(t, stage.stage, '__unmapped__')).not.toBe('__unmapped__');
      for (const key of consumed) expect(dictionaries[locale][key]?.trim().length, key).toBeGreaterThan(0);
      expect(batch4LayerLabel(t, 'ACCESS', '')).toBe(t('projects.batch4.layer_access'));
      expect(batch4LayerLabel(t, 'FUTURE_LAYER', 'original')).toBe('original');
    }
    expect(JSON.stringify({ layers: PROJECT_SETUP_LAYERS, stages: ROSTER_STAGE_DEFINITIONS })).toBe(before);
  });

  it('preserves field IDs and weight units while translating the corresponding UI labels', () => {
    for (const locale of locales) {
      const t = translator(locale);
      expect(batch4FieldLabel(t, 'driverName', '')).toBe(t('entityResolution.labels.driver_name'));
      expect(batch4FieldLabel(t, 'tareWeight', '')).toBe(`${t('field_operations.tare_weight_ticket')} (${t('shared.units.kg')})`);
      expect(batch4FieldLabel(t, 'maxGrossWeightKg', '')).toContain(t('shared.units.kg'));
      expect(batch4FieldLabel(t, 'unknown_source_field', 'Original source header')).toBe('Original source header');
      for (const id of ['__proto__', 'constructor', 'toString']) {
        expect(batch4FieldLabel(t, id, 'Original source header')).toBe('Original source header');
        expect(batch4LayerLabel(t, id, 'Original layer')).toBe('Original layer');
        expect(batch4DiagnosticText(t, id, 'titleAr', 'Original evidence')).toBe('Original evidence');
        expect(batch4RelationText(t, 'Project', id, 'Original field')).toBe('Original field');
      }
      expect(batch4ConflictFieldLabel(t, 'رقم اللوحة')).toBe(t('analytics.column.plate_number'));
      expect(batch4ConflictFieldLabel(t, 'custom source header')).toBe('custom source header');
    }
  });

  it('localizes diagnostic and system-tool metadata by stable IDs with unknown passthrough', () => {
    for (const locale of locales) {
      const consumed: string[] = [];
      const t = (key: string) => { consumed.push(key); return translator(locale)(key); };
      for (const label of [
        batch4DiagnosticText(t, 'SEC-RBAC-01', 'titleAr', '__unmapped__'),
        batch4ArchitectureText(t, 'trips', 'nameAr', '__unmapped__'),
        batch4RelationText(t, 'Project', 'shortDescAr', '__unmapped__'),
        batch4ReferenceText(t, 'architecture', 'titleAr', '__unmapped__'),
      ]) expect(label).not.toBe('__unmapped__');
      for (const key of consumed) expect(dictionaries[locale][key]?.trim().length, key).toBeGreaterThan(0);
      expect(batch4DiagnosticText(t, 'EXTERNAL_CASE', 'titleAr', 'Original evidence')).toBe('Original evidence');
      expect(batch4ReferenceText(t, 'external', 'content', '# Original reference')).toBe('# Original reference');
    }
  });
});

describe('Batch 4 pricing tool presentation', () => {
  it('translates settlement explanations without calculating or changing any recorded factor', () => {
    const source = 'تسعيرة مقطوعة بالرد: 120 SAR × 2 رد = 240 SAR';
    for (const locale of locales) {
      const t = translator(locale);
      expect(presentBatch4Message(source, t)).toBe(t('batch4.pricing_service.per_trip_formula', {
        value0: '120', value1: 'SAR', value2: '2', value3: '240', value4: 'SAR',
      }));
    }
  });

  it('localizes the pricing validator join and preserves arbitrary external joins', () => {
    const source = 'معرّف قاعدة التسعير مطلوب | رمز العملة غير صالح أو مفقود';
    for (const locale of locales) {
      const t = translator(locale);
      expect(presentBatch4Message(source, t)).toBe(t('batch4.pricing_service.rule_id_required') + ' | ' + t('batch4.pricing_service.currency_invalid'));
      expect(presentBatch4Message('Unrecognized response | original detail', t)).toBe('Unrecognized response | original detail');
      const oldWarning = translator('ar')('batch4.pricing.overlap_warning', { detail: 'Original diagnostic' });
      expect(presentBatch4Message(oldWarning, t)).toBe(t('batch4.pricing.overlap_warning', { detail: 'Original diagnostic' }));
    }
  });

  it('localizes the pricing matrix cases by stable case ID, including the current extended case family', () => {
    for (const locale of locales) {
      const t = translator(locale);
      expect(batch4DiagnosticText(t, 'PR-01', 'titleAr', '__unmapped__')).toBe(t('batch4.diagnostics.pr_01.titleAr'));
      expect(batch4DiagnosticText(t, 'PR-46', 'titleAr', '__unmapped__')).toBe(t('batch4.diagnostics.pr_46.titleAr'));
    }
  });
});
