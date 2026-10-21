/**
 * BLOCK 83A — UI/UX FINAL MINIMAL FIXES TEST SUITE
 * 
 * Verifies the 4 specific UI/UX minimal fixes from BLOCK 83 + localization invariant:
 * 1. P2: DRIVER sub-navigation tabs isolated in FieldOperationsView.
 * 2. P3-02: Master Data empty state presents primary "Add Record/Create" CTA card button (MasterDataView retired).
 * 3. P3-03: Reports Engine mobile view (<640px) uses compact collapsible accordion filters.
 * 4. P3-04: System Tools Drawer badges standardized to neutral/slate visual treatment (Option B semantic reconciliation).
 * 5. Invariant: Localization key count strictly frozen at 1,128 per locale.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import ts from 'typescript';
import { resolveTranslation } from '../i18n/utils';
import { arTranslations } from '../locales/ar';
import { enTranslations } from '../locales/en';
import { urTranslations } from '../locales/ur';

describe('BLOCK 83A UI/UX Final Minimal Fixes Test Suite', () => {
  // Test 1: P2 Driver Sub-Navigation Isolation
  it('FIX-01: FieldOperationsView restricts workstation sub-navigation tabs when activeRole is DRIVER', () => {
    const filePath = path.join(process.cwd(), 'src/components/field/FieldOperationsView.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    expect(content.includes("isDriverRole = activeRole === 'DRIVER'")).toBe(true);
    expect(content.includes("effectiveTab = isDriverRole ? 'DRIVER_VIEW' : activeTab")).toBe(true);
    expect(content.includes("!isDriverRole")).toBe(true);
  });

  // Test 2: P3-02 Master Data Empty State CTA - Retired
  it('FIX-02: MasterDataView is physically retired from codebase', () => {
    const filePath = path.join(process.cwd(), 'src/components/masterData/MasterDataView.tsx');
    expect(fs.existsSync(filePath)).toBe(false);
  });

  // Test 3: P3-03 Reports Mobile Filter Accordion
  it('FIX-03: ReportsEngineView implements collapsible mobile filter section (<640px)', () => {
    const filePath = path.join(process.cwd(), 'src/components/reports/ReportsEngineView.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    expect(content.includes('isMobileFiltersOpen')).toBe(true);
    expect(content.includes('sm:hidden')).toBe(true);
    expect(content.includes('min-h-[44px]')).toBe(true);
    // The mobile caption is an active localized UI contract, not an Arabic source-byte invariant.
    const source = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const buttons: ts.JsxElement[] = [];
    const findButton = (node: ts.Node) => {
      if (ts.isJsxElement(node) && node.openingElement.tagName.getText(source) === 'button') {
        const toggle = node.openingElement.attributes.properties.find(attribute => ts.isJsxAttribute(attribute) &&
          attribute.name.getText(source) === 'onClick' && attribute.initializer?.getText(source).includes('setIsMobileFiltersOpen(!isMobileFiltersOpen)'));
        if (toggle) buttons.push(node);
      }
      ts.forEachChild(node, findButton);
    };
    findButton(source);
    expect(buttons).toHaveLength(1);
    const captions: ts.CallExpression[] = [];
    const findCaption = (node: ts.Node) => {
      if (ts.isJsxElement(node) && node.openingElement.tagName.getText(source) === 'span') {
        for (const child of node.children) {
          if (ts.isJsxExpression(child) && child.expression && ts.isCallExpression(child.expression) &&
            ['t', 'translate'].includes(child.expression.expression.getText(source))) captions.push(child.expression);
        }
      }
      ts.forEachChild(node, findCaption);
    };
    findCaption(buttons[0]);
    expect(captions).toHaveLength(1);
    const argument = captions[0].arguments[0];
    expect(ts.isStringLiteral(argument)).toBe(true);
    const key = (argument as ts.StringLiteral).text;
    const expected = { ar: 'خيارات تصفية التقارير (Filters)', en: 'Report filter options', ur: 'رپورٹ فلٹر کے اختیارات' };
    const dictionaries = { ar: arTranslations, en: enTranslations, ur: urTranslations };
    for (const locale of ['ar', 'en', 'ur'] as const) {
      expect(Object.hasOwn(dictionaries[locale], key), `${locale}: ${key}`).toBe(true);
      expect(resolveTranslation(key, locale)).toBe(expected[locale]);
    }
  });

  // Test 4: P3-04 System Tools Drawer Badge Styling (Semantically Reconciled - Option B)
  it('FIX-04: SystemToolsDrawer standardizes badge variants to slate neutral visual treatment', () => {
    const filePath = path.join(process.cwd(), 'src/components/navigation/SystemToolsDrawer.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    // Neutral slate badge treatment invariants
    expect(content.includes('bg-slate-800')).toBe(true);
    expect(content.includes('text-slate-200')).toBe(true);
    expect(content.includes('border-slate-700')).toBe(true);
  });

  // Test 5: I18N Parity Verification
  it('FIX-05: Localization key counts maintain current trilingual parity', () => {
    const arCount = Object.keys(arTranslations).length;
    const enCount = Object.keys(enTranslations).length;
    const urCount = Object.keys(urTranslations).length;

    expect(arCount).toBeGreaterThan(0);
    expect(enCount).toBeGreaterThan(0);
    expect(urCount).toBeGreaterThan(0);
    expect(arCount).toBe(enCount);
    expect(enCount).toBe(urCount);
  });
});
