import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import fs from 'fs';
import ts from 'typescript';
import { I18nProvider } from '../i18n';
import { resolveTranslation } from '../i18n/utils';
import { analyticsTextKeys, presentAnalyticsText, presentReportCell } from '../i18n/analyticsPresentation';
import { OPERATIONAL_REPORTS_METADATA, PRICING_REPORTS_METADATA } from '../types/reports';
import { reportsEngineService } from '../services/reportsEngine.service';
import { PrintableReportModal } from '../components/reports/PrintableReportModal';
import { WidgetFilterBar } from '../components/dashboard/WidgetFilterBar';
import { OperationsDashboardView } from '../components/dashboard/OperationsDashboardView';
import { dictionaries } from '../locales';
import type { DashboardFilterParams } from '../types/dashboard';

const metadata = [...Object.values(OPERATIONAL_REPORTS_METADATA), ...Object.values(PRICING_REPORTS_METADATA)];
const filters: DashboardFilterParams = { projectId: 'ALL', shiftDateFrom: '', shiftDateTo: '', carrierId: 'ALL', materialId: 'ALL', pricingType: 'ALL' };
const titleByLocale = { ar: 'العمليات اليومية', en: 'Daily operations', ur: 'روزانہ کے عملی امور' };
const tFor = (locale: 'ar' | 'en' | 'ur') => (key: string, params?: Record<string, string | number>) => resolveTranslation(key, locale, params);
const render = (locale: 'ar' | 'en' | 'ur', child: React.ReactNode) => renderToStaticMarkup(React.createElement(I18nProvider, { initialLocale: locale, children: child }));

describe('Dashboard and Reports localization boundaries', () => {
  for (const locale of ['ar', 'en', 'ur'] as const) {
    it(`${locale}: covers every current report title, description, column and note without changing its dataset`, () => {
      const t = tFor(locale);
      for (const meta of metadata) {
        const dataset = reportsEngineService.generateReport(meta.type, filters, [], []);
        const snapshot = JSON.stringify(dataset);
        const labels = [meta.titleAr, meta.descriptionAr, ...dataset.columns.map(c => c.labelAr)];
        if (dataset.notes) labels.push(dataset.notes);
        for (const label of labels) {
          const key = analyticsTextKeys[label];
          expect(key, `${meta.type}: ${label}`).toBeTruthy();
          expect(dictionaries[locale][key]?.trim(), key).toBeTruthy();
          const actual = presentAnalyticsText(label, t);
          expect(actual).toBe(t(key));
          if (locale === 'en') expect(actual).not.toMatch(/[\u0600-\u06ff]/);
          if (locale === 'ur' && label.length > 15) expect(actual).not.toBe(label);
        }
        render(locale, React.createElement(PrintableReportModal, { dataset, onClose: () => {} }));
        expect(JSON.stringify(dataset)).toBe(snapshot);
      }
    });

    it(`${locale}: actual SSR print, filter and dashboard auth surfaces consume the active locale`, () => {
      const dataset = reportsEngineService.generateReport('DAILY_OPERATIONS', filters, [], []);
      const print = render(locale, React.createElement(PrintableReportModal, { dataset, onClose: () => {} }));
      expect(print).toContain(titleByLocale[locale]);
      expect(print).toContain(`dir="${locale === 'en' ? 'ltr' : 'rtl'}"`);
      const widget = render(locale, React.createElement(WidgetFilterBar, {
        filters, onFilterChange: () => {}, authorizedProjects: [],
        userProfile: { userId: 'U-1', userNameAr: 'مستخدم', roleTitleAr: 'AUDITOR', role: 'AUDITOR', authorizedProjectIds: [], isRestricted: true },
      }));
      expect(widget).toContain(locale === 'en' ? 'Pricing Type' : locale === 'ur' ? 'قیمت کی قسم' : 'نوع التسعير');
      const dashboard = render(locale, React.createElement(OperationsDashboardView));
      expect(dashboard).toContain(locale === 'en' ? 'Authentication Required' : locale === 'ur' ? 'لاگ ان' : 'تسجيل الدخول');
    });
  }

  it('preserves business names, descriptions, IDs, canonical status codes, currencies and numeric values', () => {
    const t = tFor('en');
    for (const column of ['projectName', 'carrierName', 'driverName', 'materialName', 'truckPlate', 'description', 'resolutionNote', 'rejectionReason', 'status', 'currency', 'tripSerial', 'supervisors']) {
      for (const value of ['العمليات اليومية', 'مطابق (ضمن النطاق المسموح)', 'شركة النقل أ', 'COMPLETED', 'SAR', '001,234.500']) {
        expect(presentReportCell(column, value, t)).toBe(value);
      }
    }
    expect(presentReportCell('totalTrips', 123, t)).toBe('123');
    expect(presentReportCell('classification', 'مطابق (ضمن النطاق المسموح)', t)).toBe('Compliant (within allowed limits)');
    expect(presentReportCell('classification', 'unexpected classification', t)).toBe('unexpected classification');
    expect(presentReportCell('constructor', 'unknown', t)).toBe('unknown');
  });

  it('translates only the three explicit computed text templates and the shift label; preserves raw parameters', () => {
    const t = tFor('en');
    expect(presentReportCell('pricingSplit', '٠١ طن / 0002 رد', t)).toBe('٠١ tons / 0002 trips');
    expect(presentReportCell('modelsSplit', '٣ بالطن | 004 بالرد', t)).toBe('٣ per ton | 004 per trip');
    expect(presentReportCell('formulaCheck', '31.000 طن × 8.50 = 263.500', t)).toBe('31.000 tons × 8.50 = 263.500');
    expect(presentReportCell('shiftName', '2026-10-21 - الوردية الليلية (22:00 - 06:00)', t)).toBe('2026-10-21 - Night shift (22:00 - 06:00)');
    for (const [column, value] of [['formulaCheck', 'prefix 31.000 tons × 8.50 = 263.500'], ['pricingSplit', '1 طن / 2 رد suffix'], ['pricingSplit', '1 طن / 2 طن / 3 رد'], ['shiftName', '2026-10-21 - unknown']]) {
      expect(presentReportCell(column, value, t)).toBe(value);
    }
  });

  it('stores localized error identifiers and resolves the same state in all three locales without adding subscription dependencies', () => {
    const file = 'src/components/reports/ReportsEngineView.tsx';
    const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const keys: string[] = [];
    const visit = (node: ts.Node) => {
      if (ts.isCallExpression(node) && node.expression.getText(source) === 'setDataError' && node.arguments[0] && ts.isStringLiteral(node.arguments[0])) keys.push(node.arguments[0].text);
      if (ts.isCallExpression(node) && node.expression.getText(source) === 'useEffect') expect(node.arguments[1]?.getText(source)).not.toMatch(/translate|locale/);
      if (ts.isCallExpression(node) && ['reportsEngineService.exportToCSV', 'reportsEngineService.exportToXLSX'].includes(node.expression.getText(source))) expect(node.arguments[0].getText(source)).toBe('currentDataset');
      ts.forEachChild(node, visit);
    };
    visit(source);
    expect(new Set(keys).size).toBe(3);
    for (const key of keys) {
      const values = (['ar', 'en', 'ur'] as const).map(locale => tFor(locale)(key));
      expect(new Set(values).size).toBe(3);
      expect(values[1]).not.toMatch(/[\u0600-\u06ff]/);
    }
  });
});
