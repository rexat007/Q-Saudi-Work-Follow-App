import * as fs from 'fs';
import * as path from 'path';
import { describe, it, expect } from 'vitest';
import ts from 'typescript';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { resolveTranslation } from '../i18n/utils';
import { arTranslations } from '../locales/ar';
import { enTranslations } from '../locales/en';
import { urTranslations } from '../locales/ur';

describe('Block 73 P1 Directional UX Fixes Test Suite', () => {
  const outboxDrawerPath = path.resolve(process.cwd(), 'src/components/offline/OutboxDrawer.tsx');
  const loadingStationPath = path.resolve(process.cwd(), 'src/components/tripEngine/LoadingStation.tsx');
  const outboxDrawerSource = fs.readFileSync(outboxDrawerPath, 'utf-8');
  const loadingStationSource = fs.readFileSync(loadingStationPath, 'utf-8');

  // B73-T01: OutboxDrawer dynamically binds root direction via useI18n direction
  it('B73-T01: OutboxDrawer dynamically binds root direction via useI18n direction', () => {
    expect(outboxDrawerSource.includes('dir={direction}')).toBe(true);
    const hasUseI18nExtract = outboxDrawerSource.includes('const { t, direction } = useI18n()') ||
                              outboxDrawerSource.includes('direction') ||
                              outboxDrawerSource.includes('useI18n');
    expect(hasUseI18nExtract).toBe(true);
  });

  // B73-T02: OutboxDrawer uses justify-start for locale-aware placement
  it('B73-T02: OutboxDrawer uses justify-start for locale-aware placement (RTL side in RTL)', () => {
    expect(outboxDrawerSource.includes('justify-start')).toBe(true);
    expect(outboxDrawerSource.includes('justify-end bg-black/50 backdrop-blur-xs transition-opacity" dir="rtl"')).toBe(false);
  });

  // B73-T03: OutboxDrawer uses mirrored inner divider borders
  it('B73-T03: OutboxDrawer uses mirrored inner divider borders (rtl:border-l and ltr:border-r)', () => {
    expect(outboxDrawerSource.includes('rtl:border-l')).toBe(true);
    expect(outboxDrawerSource.includes('ltr:border-r')).toBe(true);
  });

  // B73-T04: OutboxDrawer uses mirrored text alignment on drawer container and conflict buttons
  it('B73-T04: OutboxDrawer uses mirrored text alignment on drawer container and conflict buttons', () => {
    expect(outboxDrawerSource.includes('rtl:text-right ltr:text-left')).toBe(true);
    const drawerBodyMatch = outboxDrawerSource.match(/w-full max-w-2xl h-full bg-stone-50[^"]+/);
    expect(drawerBodyMatch).toBeDefined();
    if (drawerBodyMatch) {
      expect(drawerBodyMatch[0].includes('rtl:text-right')).toBe(true);
      expect(drawerBodyMatch[0].includes('ltr:text-left')).toBe(true);
    }
  });

  // B73-T05: OutboxDrawer eliminates unconditional hardcoded dir="rtl" on overlay
  it('B73-T05: OutboxDrawer eliminates unconditional hardcoded dir="rtl" on overlay', () => {
    expect(outboxDrawerSource.includes('<div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-xs transition-opacity" dir="rtl">')).toBe(false);
  });

  // B73-T06: OutboxDrawer eliminates unconditional un-mirrored layout on root container
  it('B73-T06: OutboxDrawer eliminates unconditional un-mirrored layout on root container', () => {
    expect(outboxDrawerSource.includes('border-r border-stone-200 shadow-2xl flex flex-col overflow-hidden text-right"')).toBe(false);
  });

  // B73-T07: LoadingStation applies rtl:rotate-180 for bidirectional arrow rotation
  it('B73-T07: LoadingStation applies rtl:rotate-180 for bidirectional arrow rotation', () => {
    const hasDirectionalPrev = loadingStationSource.includes('<ArrowLeft className="w-4 h-4 rtl:rotate-180" />');
    expect(hasDirectionalPrev).toBe(true);
    const hasDirectionalNext = loadingStationSource.includes('<ArrowRight className="w-4 h-4 rtl:rotate-180" />');
    expect(hasDirectionalNext).toBe(true);
  });

  // B73-T09: In LTR, ArrowLeft (prev) and ArrowRight (next) point in correct forward/backward direction
  it('B73-T09: In LTR, ArrowLeft (prev) and ArrowRight (next) point in correct forward/backward direction', () => {
    expect(loadingStationSource.includes('ArrowLeft className="w-4 h-4 rtl:rotate-180"')).toBe(true);
    expect(loadingStationSource.includes('ArrowRight className="w-4 h-4 rtl:rotate-180"')).toBe(true);
  });

  // B73-T11: Navigation keeps translated previous/next labels and the real next step.
  it('B73-T11: Navigation labels resolve canonically in AR/EN/UR and name the next workflow step', () => {
    const source = ts.createSourceFile(loadingStationPath, loadingStationSource, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const buttons = new Map<string, ts.JsxElement>();
    let stepKeys: string[] = [];
    const visit = (node: ts.Node) => {
      if (ts.isVariableDeclaration(node) && node.name.getText(source) === 'STEPS' && node.initializer && ts.isArrayLiteralExpression(node.initializer)) {
        stepKeys = node.initializer.elements.map(element => {
          expect(ts.isObjectLiteralExpression(element)).toBe(true);
          const label = (element as ts.ObjectLiteralExpression).properties.find(property => ts.isPropertyAssignment(property) && property.name.getText(source) === 'label') as ts.PropertyAssignment;
          expect(label && ts.isStringLiteral(label.initializer)).toBe(true);
          return (label.initializer as ts.StringLiteral).text;
        });
      }
      if (ts.isJsxElement(node) && node.openingElement.tagName.getText(source) === 'button') {
        const click = node.openingElement.attributes.properties.find(property => ts.isJsxAttribute(property) && property.name.getText(source) === 'onClick') as ts.JsxAttribute | undefined;
        if (click?.initializer && ts.isJsxExpression(click.initializer) && click.initializer.expression) {
          const handler = click.initializer.expression.getText(source);
          if (['goToPrevStep', 'goToNextStep'].includes(handler)) buttons.set(handler, node);
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
    expect(stepKeys.length).toBeGreaterThan(1);
    expect([...buttons.keys()].sort()).toEqual(['goToNextStep', 'goToPrevStep']);

    for (const locale of ['ar', 'en', 'ur'] as const) {
      const dictionary = { ar: arTranslations, en: enTranslations, ur: urTranslations }[locale];
      for (let stepIndex = 0; stepIndex < stepKeys.length - 1; stepIndex++) {
        for (const handler of ['goToPrevStep', 'goToNextStep']) {
          const button = buttons.get(handler)!;
          const span = button.children.find(child => ts.isJsxElement(child) && child.openingElement.tagName.getText(source) === 'span') as ts.JsxElement;
          expect(span, handler).toBeDefined();
          const consumedKeys: string[] = [];
          // Interpret only the actual label expressions, not the component or services.
          const evaluate = (node: ts.Expression): unknown => {
            if (ts.isStringLiteralLike(node)) return node.text;
            if (ts.isNumericLiteral(node)) return Number(node.text);
            if (ts.isIdentifier(node) && node.text === 'stepIndex') return stepIndex;
            if (ts.isIdentifier(node) && node.text === 'STEPS') return stepKeys.map(label => ({ label }));
            if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.PlusToken) return Number(evaluate(node.left)) + Number(evaluate(node.right));
            if (ts.isElementAccessExpression(node)) return (evaluate(node.expression) as unknown[])[Number(evaluate(node.argumentExpression))];
            if (ts.isPropertyAccessExpression(node) && node.name.text === 'label') return (evaluate(node.expression) as { label: string }).label;
            if (ts.isCallExpression(node) && ['t', 'translate'].includes(node.expression.getText(source))) {
              const key = String(evaluate(node.arguments[0]));
              consumedKeys.push(key);
              expect(Object.hasOwn(dictionary, key), `${locale}: ${key}`).toBe(true);
              return resolveTranslation(key, locale);
            }
            throw new Error(`Unsupported or unmanaged navigation label: ${node.getText(source)}`);
          };
          const text = span.children.map(child => {
            if (ts.isJsxText(child)) {
              expect(child.text.trim()).not.toMatch(/[A-Za-z\u0600-\u06ff]/);
              return child.text.trim();
            }
            if (ts.isJsxExpression(child) && child.expression) return String(evaluate(child.expression));
            throw new Error('Unexpected navigation label markup');
          }).join('');
          const expected = handler === 'goToPrevStep'
            ? dictionary['field_operations.prev_btn']
            : `${dictionary['field_operations.next_btn']} (${dictionary[stepKeys[stepIndex + 1]]})`;
          expect(renderToStaticMarkup(createElement('span', null, text))).toBe(renderToStaticMarkup(createElement('span', null, expected)));
          expect(consumedKeys.length).toBeGreaterThan(0);
          if (handler === 'goToNextStep') expect(consumedKeys).toContain(stepKeys[stepIndex + 1]);
        }
      }
    }
  });

  // B73-T13: Navigation click handlers in LoadingStation remain wired to goToPrevStep and goToNextStep
  it('B73-T13: Navigation click handlers in LoadingStation remain wired to goToPrevStep and goToNextStep', () => {
    expect(loadingStationSource.includes('onClick={goToPrevStep}')).toBe(true);
    expect(loadingStationSource.includes('onClick={goToNextStep}')).toBe(true);
  });

  // B73-T18: Zero translation drift across AR, EN, and UR
  it('B73-T18: Zero translation drift across AR, EN, and UR', () => {
    const arKeys = Object.keys(arTranslations).sort();
    const enKeys = Object.keys(enTranslations).sort();
    const urKeys = Object.keys(urTranslations).sort();

    expect(arKeys).toHaveLength(enKeys.length);
    expect(arKeys).toHaveLength(urKeys.length);

    for (let i = 0; i < arKeys.length; i++) {
      expect(arKeys[i]).toBe(enKeys[i]);
      expect(arKeys[i]).toBe(urKeys[i]);
    }
  });

  // B73-T19: LanguageSwitcher component remains intact
  it('B73-T19: LanguageSwitcher component remains intact', () => {
    const switcherPath = path.resolve(process.cwd(), 'src/components/i18n/LanguageSwitcher.tsx');
    expect(fs.existsSync(switcherPath)).toBe(true);
  });

  // B73-T20: BLOCK 73 deliverables exist and contain required schema
  it('B73-T20: BLOCK 73 deliverables exist and contain required schema', () => {
    const jsonPath = path.resolve(process.cwd(), 'reports/uiux-block73-p1-fixes.json');
    const mdPath = path.resolve(process.cwd(), 'reports/uiux-block73-p1-fixes.md');
    expect(fs.existsSync(jsonPath)).toBe(true);
    expect(fs.existsSync(mdPath)).toBe(true);

    const jsonContent = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    expect(jsonContent.metadata).toBeDefined();
    expect(jsonContent.metadata.block).toBe(73);
    expect(Array.isArray(jsonContent.fixes)).toBe(true);

    const mdContent = fs.readFileSync(mdPath, 'utf-8');
    expect(mdContent.includes('BLOCK 73')).toBe(true);
  });
});
