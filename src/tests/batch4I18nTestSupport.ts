import { expect } from 'vitest';
import ts from 'typescript';
import { dictionaries } from '../locales';
import { resolveTranslation } from '../i18n/utils';

export function canonicalBatch4Label(key: string, params?: Record<string, string | number>): string {
  const placeholders = (value: string) => [...value.matchAll(/\{(\w+)\}/g)].map(match => match[1]).sort();
  for (const locale of ['ar', 'en', 'ur'] as const) {
    expect(dictionaries[locale][key]?.trim().length, `${locale}: ${key}`).toBeGreaterThan(0);
    expect(placeholders(dictionaries[locale][key]), `${locale}: ${key}`).toEqual(placeholders(dictionaries.ar[key]));
    expect(resolveTranslation(key, locale, params), `${locale}: ${key}`).not.toBe(key);
  }
  return resolveTranslation(key, 'ar', params);
}

export function expectCanonicalBatch4Source(source: string, key: string): void {
  canonicalBatch4Label(key);
  const ast = ts.createSourceFile('subject.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let consumed = false;
  const visit = (node: ts.Node) => {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 't'
      && node.arguments[0] && ts.isStringLiteral(node.arguments[0]) && node.arguments[0].text === key) consumed = true;
    ts.forEachChild(node, visit);
  };
  visit(ast);
  expect(consumed, `Source consumes canonical UI key ${key}`).toBe(true);
}
