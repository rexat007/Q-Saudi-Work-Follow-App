import { describe, expect, it } from 'vitest';
import * as ts from 'typescript';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const fixturePath = resolve(root, 'src/tests/__truckTypeBoundaryContract__.ts');
const imports = `
/// <reference types="node" />
import type { GlobalTruckType } from '../types/globalEntities';
import type { DriverTruckIntakePayload } from '../services/driverTruckIntake.service';
import type { TruckEntity } from '../types/entities';
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
  return ts.getPreEmitDiagnostics(program).map(d =>
    `${d.file?.fileName ?? 'compiler'}: TS${d.code}: ${ts.flattenDiagnosticMessageText(d.messageText, '\n')}`
  );
}

describe('Truck type vocabulary authority across input and stored boundaries', () => {
  it('consumes GlobalTruckType through type-only imports at both optional, mutable boundaries', () => {
    for (const [file, typeName, modulePath] of [
      ['src/services/driverTruckIntake.service.ts', 'DriverTruckIntakePayload', '../types/globalEntities'],
      ['src/types/entities.ts', 'TruckEntity', './globalEntities'],
    ]) {
      const source = ts.createSourceFile(file, readFileSync(resolve(root, file), 'utf8'), ts.ScriptTarget.Latest, true);
      const definition = source.statements.filter(ts.isInterfaceDeclaration).find(d => d.name.text === typeName);
      if (!definition) throw new Error(`Missing exported boundary ${typeName}`);
      expect(definition.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)).toBe(true);
      const fields = definition.members.filter(ts.isPropertySignature).filter(m => m.name.getText(source) === 'truckType');
      expect(fields).toHaveLength(1);
      expect(fields[0].type?.getText(source)).toBe('GlobalTruckType');
      expect(fields[0].questionToken?.kind).toBe(ts.SyntaxKind.QuestionToken);
      expect(fields[0].modifiers?.some(m => m.kind === ts.SyntaxKind.ReadonlyKeyword) ?? false).toBe(false);
      const declarations = source.statements.filter(ts.isImportDeclaration).filter(d =>
        ts.isStringLiteral(d.moduleSpecifier) && d.moduleSpecifier.text === modulePath
      );
      const truckImports = declarations.flatMap(declaration => {
        const clause = declaration.importClause;
        const bindings = clause?.namedBindings;
        if (!bindings || !ts.isNamedImports(bindings)) return [];
        return bindings.elements
          .filter(element => element.name.text === 'GlobalTruckType')
          .map(element => ({ clause, element }));
      });
      expect(truckImports).toHaveLength(1);
      expect(truckImports[0].clause?.isTypeOnly).toBe(true);
      expect(truckImports[0].element.propertyName?.text ?? truckImports[0].element.name.text).toBe('GlobalTruckType');
    }
  });

  it('compiles the exact four values, optional omission, undefined and mutable fields without widening', () => {
    expect(compileContract(`
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends
  (<T>() => T extends B ? 1 : 2) ? true : false;
type Assert<T extends true> = T;
type NotAny<T> = 0 extends (1 & T) ? false : true;
type Expected = 'TIPPER_32M3' | 'TRAILER_24M' | 'FLATBED' | 'DUMPER';
type Vocabulary = Assert<Equal<GlobalTruckType, Expected>>;
type IntakeField = Pick<DriverTruckIntakePayload, 'truckType'>;
type StoredField = Pick<TruckEntity, 'truckType'>;
type ExactIntake = Assert<Equal<IntakeField, { truckType?: Expected }>>;
type ExactStored = Assert<Equal<StoredField, { truckType?: Expected }>>;
type IntakeNotAny = Assert<NotAny<DriverTruckIntakePayload['truckType']>>;
type StoredNotAny = Assert<NotAny<TruckEntity['truckType']>>;
const omittedIntake: IntakeField = {};
const omittedStored: StoredField = {};
const undefinedIntake: IntakeField = { truckType: undefined };
const undefinedStored: StoredField = { truckType: undefined };
const validValues: GlobalTruckType[] = ['TIPPER_32M3', 'TRAILER_24M', 'FLATBED', 'DUMPER'];
for (const value of validValues) {
  const intake: IntakeField = { truckType: value };
  const stored: StoredField = { truckType: value };
  const backFromIntake: GlobalTruckType | undefined = intake.truckType;
  const backFromStored: GlobalTruckType | undefined = stored.truckType;
  omittedIntake.truckType = value;
  omittedStored.truckType = value;
}
`)).toEqual([]);
  }, 30_000);

  it('rejects extra values, arbitrary strings, altered casing, null and incompatible field types', () => {
    const cases: string[] = [];
    for (const typeName of ['DriverTruckIntakePayload', 'TruckEntity']) {
      for (const [label, value] of [
        ['extraValue', "'UNKNOWN_TRUCK'"],
        ['wrongCase', "'dumper'"],
        ['nullValue', 'null'],
        ['numericValue', '123'],
        ['objectValue', '{}'],
      ]) {
        cases.push(`
// @ts-expect-error The boundary accepts only the four canonical values, not ${label}.
const ${typeName}${label}: Pick<${typeName}, 'truckType'> = { truckType: ${value} };
`);
      }
      cases.push(`
declare const arbitrary${typeName}: string;
// @ts-expect-error The field must not widen to arbitrary string.
const widened${typeName}: Pick<${typeName}, 'truckType'> = { truckType: arbitrary${typeName} };
`);
    }
    // Unused expect-error directives produce diagnostics, so accepting an invalid
    // case fails verification rather than hiding accidental contract widening.
    expect(compileContract(cases.join('\n'))).toEqual([]);
  }, 30_000);
});
