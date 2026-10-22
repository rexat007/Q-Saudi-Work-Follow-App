import { describe, expect, it } from 'vitest';
import * as ts from 'typescript';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const fixturePath = resolve(root, 'src/tests/__settlementAdjustmentTypeContract__.ts');
const imports = `
/// <reference types="node" />
import type { SettlementAdjustmentService } from '../services/settlementAdjustment.service';
import type { SettlementAdjustmentType, SettlementAdjustmentEntity } from '../types/entities';
type Input = Parameters<SettlementAdjustmentService['requestAdjustment']>[0];
`;

// Resolve real production definitions in a virtual compiler fixture. Nothing is
// emitted or written; strict null checking strengthens the unchanged project config.
function compileContract(source: string): string[] {
  const config = ts.readConfigFile(resolve(root, 'tsconfig.json'), ts.sys.readFile);
  if (config.error) throw new Error(ts.flattenDiagnosticMessageText(config.error.messageText, '\n'));
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root);
  if (parsed.errors.length) {
    throw new Error(parsed.errors.map(d => ts.flattenDiagnosticMessageText(d.messageText, '\n')).join('\n'));
  }
  const options = { ...parsed.options, strictNullChecks: true, noEmit: true };
  const host = ts.createCompilerHost(options);
  const readSource = host.getSourceFile.bind(host);
  host.getSourceFile = (fileName, languageVersion, onError, shouldCreateNewSourceFile) =>
    resolve(fileName) === fixturePath
      ? ts.createSourceFile(fileName, imports + source, languageVersion, true)
      : readSource(fileName, languageVersion, onError, shouldCreateNewSourceFile);
  const program = ts.createProgram([fixturePath], options, host);
  // Check the fixture against real imported types. Strengthened null checking
  // is scoped to this contract, not unrelated transitive repository bodies.
  const fixture = program.getSourceFile(fixturePath);
  if (!fixture) throw new Error('Compiler did not load the contract fixture');
  return [
    ...program.getOptionsDiagnostics(), ...program.getGlobalDiagnostics(),
    ...program.getSyntacticDiagnostics(fixture), ...program.getSemanticDiagnostics(fixture),
  ].map(d =>
    `${d.file?.fileName ?? 'compiler'}: TS${d.code}: ${ts.flattenDiagnosticMessageText(d.messageText, '\n')}`
  );
}

describe('Settlement adjustment canonical type authority', () => {
  it('uses the canonical type-only import at the required request boundary', () => {
    const file = 'src/services/settlementAdjustment.service.ts';
    const source = ts.createSourceFile(file, readFileSync(resolve(root, file), 'utf8'), ts.ScriptTarget.Latest, true);
    const imports = source.statements.filter(ts.isImportDeclaration).filter(d =>
      ts.isStringLiteral(d.moduleSpecifier) && d.moduleSpecifier.text === '../types/entities'
    );
    expect(imports.some(d => {
      const bindings = d.importClause?.namedBindings;
      return d.importClause?.isTypeOnly && bindings && ts.isNamedImports(bindings) &&
        bindings.elements.some(e => e.name.text === 'SettlementAdjustmentType');
    })).toBe(true);
    const service = source.statements.filter(ts.isClassDeclaration).find(d => d.name?.text === 'SettlementAdjustmentService');
    const method = service?.members.filter(ts.isMethodDeclaration).find(d => d.name.getText(source) === 'requestAdjustment');
    const input = method?.parameters[0].type;
    if (!input || !ts.isTypeLiteralNode(input)) throw new Error('Missing request input boundary');
    const fields = input.members.filter(ts.isPropertySignature).filter(d => d.name.getText(source) === 'adjustmentType');
    expect(fields).toHaveLength(1);
    expect(fields[0].type?.getText(source)).toBe('SettlementAdjustmentType');
    expect(fields[0].questionToken).toBeUndefined();
  });

  it('compiles the exact vocabulary, full request shape and required mutable stored field', () => {
    expect(compileContract(`
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends
  (<T>() => T extends B ? 1 : 2) ? true : false;
type Assert<T extends true> = T;
type NotAny<T> = 0 extends (1 & T) ? false : true;
type Expected = 'RATE' | 'AMOUNT' | 'DEDUCTION' | 'OTHER';
type Vocabulary = Assert<Equal<SettlementAdjustmentType, Expected>>;
type ExactRequest = Assert<Equal<Input, {
  projectId: string; tripId: string; adjustmentType: Expected;
  amountOrRateAdjustment: number; reason: string;
}>>;
type Stored = Assert<Equal<Pick<SettlementAdjustmentEntity, 'adjustmentType'>, { adjustmentType: Expected }>>;
type InputNotAny = Assert<NotAny<Input['adjustmentType']>>;
type StoredNotAny = Assert<NotAny<SettlementAdjustmentEntity['adjustmentType']>>;
declare const service: SettlementAdjustmentService;
declare const context: Parameters<SettlementAdjustmentService['requestAdjustment']>[1];
declare let stored: Pick<SettlementAdjustmentEntity, 'adjustmentType'>;
const values: SettlementAdjustmentType[] = ['RATE', 'AMOUNT', 'DEDUCTION', 'OTHER'];
for (const value of values) {
  const input: Input = { projectId: 'p', tripId: 't', adjustmentType: value, amountOrRateAdjustment: 1, reason: 'r' };
  const result: Promise<SettlementAdjustmentEntity> = service.requestAdjustment(input, context);
  const canonical: SettlementAdjustmentType = input.adjustmentType;
  stored.adjustmentType = canonical;
  input.adjustmentType = stored.adjustmentType;
}
`)).toEqual([]);
  }, 30_000);

  it('rejects invalid values, widened strings, omission, null and undefined', () => {
    const cases: string[] = [];
    for (const typeName of ['Input', 'SettlementAdjustmentEntity']) {
      for (const [label, value] of [
        ['invalid', "'UNKNOWN_ADJUSTMENT'"], ['case', "'rate'"], ['null', 'null'],
        ['undefined', 'undefined'], ['number', '123'], ['object', '{}'],
      ]) {
        cases.push(`
// @ts-expect-error The boundary must reject ${label}.
const ${typeName}${label}: Pick<${typeName}, 'adjustmentType'> = { adjustmentType: ${value} };
`);
      }
      cases.push(`
// @ts-expect-error adjustmentType remains required.
const ${typeName}omitted: Pick<${typeName}, 'adjustmentType'> = {};
declare const arbitrary${typeName}: string;
// @ts-expect-error Arbitrary strings are not canonical adjustment values.
const ${typeName}widened: Pick<${typeName}, 'adjustmentType'> = { adjustmentType: arbitrary${typeName} };
`);
    }
    // An unused expect-error is a compiler error, so accidental widening fails.
    expect(compileContract(cases.join('\n'))).toEqual([]);
  }, 30_000);
});
