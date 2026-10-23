import { describe, expect, it } from 'vitest';
import * as ts from 'typescript';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const fixturePath = resolve(root, 'src/tests/__globalMaterialUomContract__.ts');
const imports = `
/// <reference types="node" />
import { useState } from 'react';
import type { GlobalMaterialUom } from '../types/globalEntities';
import type { MaterialEntity } from '../types/entities';
import type { UnitOfMeasure } from '../types/wizard';
import type { MaterialCreateInput, MaterialUpdateInput, MaterialUpdateResult } from '../services/materialManagementClient.service';
import type { MaterialEditorModalProps } from '../components/masterData/MaterialEditorModal';
`;

function parse(file: string): ts.SourceFile {
  return ts.createSourceFile(file, readFileSync(resolve(root, file), 'utf8'), ts.ScriptTarget.Latest, true,
    file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
}

function stateCall(): ts.CallExpression {
  const source = parse('src/components/masterData/MaterialEditorModal.tsx');
  let result: ts.CallExpression | undefined;
  function visit(node: ts.Node): void {
    if (ts.isVariableDeclaration(node) && ts.isArrayBindingPattern(node.name) &&
        node.name.elements[0]?.getText(source) === 'unitOfMeasure' &&
        node.initializer && ts.isCallExpression(node.initializer)) result = node.initializer;
    ts.forEachChild(node, visit);
  }
  visit(source);
  if (!result) throw new Error('Missing actual unitOfMeasure state declaration');
  return result;
}

// Compile a virtual fixture against the real production modules. Nothing is emitted
// or written to disk; strict null checking strengthens the repository configuration.
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
  // Scope strengthened null checking to the input contract fixture. Imported
  // implementation bodies retain the repository's separate full lint gate.
  const fixture = program.getSourceFile(fixturePath);
  if (!fixture) throw new Error('Compiler did not load the contract fixture');
  return [
    ...program.getOptionsDiagnostics(), ...program.getGlobalDiagnostics(),
    ...program.getSyntacticDiagnostics(fixture), ...program.getSemanticDiagnostics(fixture),
  ].map(d =>
    `${d.file?.fileName ?? 'compiler'}: TS${d.code}: ${ts.flattenDiagnosticMessageText(d.messageText, '\n')}`
  );
}

describe('Global material UOM canonical vocabulary authority', () => {
  it('consumes the canonical type through type-only imports at all seven exact duplicate sites', () => {
    for (const [file, modulePath, interfaces] of [
      ['src/types/entities.ts', './globalEntities', ['MaterialEntity']],
      ['src/types/wizard.ts', './globalEntities', []],
      ['src/services/materialManagementClient.service.ts', '../types/globalEntities', ['MaterialCreateInput', 'MaterialUpdateInput']],
      ['src/components/masterData/MaterialEditorModal.tsx', '../../types/globalEntities', []],
    ] as const) {
      const source = parse(file);
      const imports = source.statements.filter(ts.isImportDeclaration).filter(d =>
        ts.isStringLiteral(d.moduleSpecifier) && d.moduleSpecifier.text === modulePath
      );
      const canonical = imports.flatMap(d => {
        const clause = d.importClause, bindings = clause?.namedBindings;
        return bindings && ts.isNamedImports(bindings)
          ? bindings.elements.filter(e => e.name.text === 'GlobalMaterialUom').map(element => ({ clause, element }))
          : [];
      });
      expect(canonical).toHaveLength(1);
      expect(canonical[0].clause?.isTypeOnly).toBe(true);
      expect(canonical[0].element.propertyName?.text ?? canonical[0].element.name.text).toBe('GlobalMaterialUom');
      for (const name of interfaces) {
        const definition = source.statements.filter(ts.isInterfaceDeclaration).find(d => d.name.text === name);
        if (!definition) throw new Error(`Missing ${name}`);
        const fields = definition.members.filter(ts.isPropertySignature).filter(f => f.name.getText(source) === 'unitOfMeasure');
        expect(fields).toHaveLength(1);
        expect(fields[0].type?.getText(source)).toBe('GlobalMaterialUom');
        expect(fields[0].questionToken?.kind).toBe(ts.SyntaxKind.QuestionToken);
      }
      if (file === 'src/types/wizard.ts') {
        const alias = source.statements.filter(ts.isTypeAliasDeclaration).find(d => d.name.text === 'UnitOfMeasure');
        expect(alias?.type.getText(source)).toBe('GlobalMaterialUom');
        expect(alias?.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)).toBe(true);
      }
    }
    const modal = parse('src/components/masterData/MaterialEditorModal.tsx');
    const call = stateCall();
    expect(call.expression.getText()).toBe('useState');
    expect(call.typeArguments?.map(t => t.getText())).toEqual(['GlobalMaterialUom']);
    expect(call.arguments.map(a => a.getText())).toEqual(["'TON'"]);
    const casts: ts.AsExpression[] = [];
    function visit(node: ts.Node): void {
      if (ts.isAsExpression(node) && node.type.getText(modal) === 'GlobalMaterialUom') casts.push(node);
      ts.forEachChild(node, visit);
    }
    visit(modal);
    expect(casts).toHaveLength(2);
    expect(casts.some(c => c.expression.getText(modal).includes('initialMaterial.unitOfMeasure'))).toBe(true);
    expect(casts.some(c => c.expression.getText(modal) === 'e.target.value')).toBe(true);
  });

  it('compiles the exact vocabulary, public alias, optional boundaries, actual React state initializer and broader outputs', () => {
    const cases = [`
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends
  (<T>() => T extends B ? 1 : 2) ? true : false;
type Assert<T extends true> = T;
type NotAny<T> = 0 extends (1 & T) ? false : true;
type Expected = 'TON' | 'M3' | 'TRIP';
type Vocabulary = Assert<Equal<GlobalMaterialUom, Expected>>;
type Wizard = Assert<Equal<UnitOfMeasure, GlobalMaterialUom>>;
type CanonicalNotAny = Assert<NotAny<GlobalMaterialUom>>;
type WizardNotAny = Assert<NotAny<UnitOfMeasure>>;
type BroadOutput = Assert<Equal<MaterialUpdateResult['material']['unitOfMeasure'], string>>;
type BroadInitialInput = Assert<Equal<NonNullable<MaterialEditorModalProps['initialMaterial']>['unitOfMeasure'], string | undefined>>;
// This call is extracted from production, not independently copied.
const [state, setState] = ${stateCall().getText()};
type State = Assert<Equal<typeof state, GlobalMaterialUom>>;
type StateNotAny = Assert<NotAny<typeof state>>;
const canonicalValues: GlobalMaterialUom[] = ['TON', 'M3', 'TRIP'];
const wizardValues: UnitOfMeasure[] = ['TON', 'M3', 'TRIP'];
setState('TON');
setState('M3');
setState('TRIP');
`];
    for (const boundary of ['MaterialEntity', 'MaterialCreateInput', 'MaterialUpdateInput']) {
      cases.push(`
type ${boundary}Field = Assert<Equal<Pick<${boundary}, 'unitOfMeasure'>, { unitOfMeasure?: GlobalMaterialUom }>>;
type ${boundary}NotAny = Assert<NotAny<${boundary}['unitOfMeasure']>>;
const ${boundary}omitted: Pick<${boundary}, 'unitOfMeasure'> = {};
const ${boundary}undefined: Pick<${boundary}, 'unitOfMeasure'> = { unitOfMeasure: undefined };
`);
      for (const value of ['TON', 'M3', 'TRIP']) {
        cases.push(`
const ${boundary}${value}: Pick<${boundary}, 'unitOfMeasure'> = { unitOfMeasure: '${value}' };
${boundary}omitted.unitOfMeasure = '${value}';
const ${boundary}${value}Canonical: GlobalMaterialUom | undefined = ${boundary}${value}.unitOfMeasure;
`);
      }
    }
    expect(compileContract(cases.join('\n'))).toEqual([]);
  }, 60_000);

  it('rejects invalid values, arbitrary strings, null and incompatible values at all exact boundaries', () => {
    const cases: string[] = [];
    for (const boundary of ['GlobalMaterialUom', 'UnitOfMeasure', 'MaterialEntity', 'MaterialCreateInput', 'MaterialUpdateInput']) {
      const isField = !['GlobalMaterialUom', 'UnitOfMeasure'].includes(boundary);
      for (const [label, value] of [
        ['invalid', "'KG'"], ['case', "'ton'"], ['null', 'null'], ['number', '123'], ['object', '{}'],
      ]) {
        const type = isField ? `Pick<${boundary}, 'unitOfMeasure'>` : boundary;
        const input = isField ? `{ unitOfMeasure: ${value} }` : value;
        cases.push(`
// @ts-expect-error ${boundary} must reject ${label}.
const ${boundary}${label}: ${type} = ${input};
`);
      }
      cases.push(`
declare const arbitrary${boundary}: string;
// @ts-expect-error No exact vocabulary boundary may widen to arbitrary string.
const ${boundary}widened: ${isField ? `Pick<${boundary}, 'unitOfMeasure'>` : boundary} = ${isField ? `{ unitOfMeasure: arbitrary${boundary} }` : `arbitrary${boundary}`};
`);
    }
    cases.push(`
const [state, setState] = ${stateCall().getText()};
// @ts-expect-error The actual state contract rejects noncanonical UOM.
setState('KG');
// @ts-expect-error The actual state contract is non-nullable.
setState(null);
declare const arbitraryState: string;
// @ts-expect-error The actual state must not widen to arbitrary string.
setState(arbitraryState);
`);
    // Unused expect-error directives themselves fail the compiler contract.
    expect(compileContract(cases.join('\n'))).toEqual([]);
  }, 60_000);
});
