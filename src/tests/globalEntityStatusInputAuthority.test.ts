import { describe, expect, it } from 'vitest';
import * as ts from 'typescript';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const repositoryPath = resolve(root, 'src/repositories/globalIdentity.repository.ts');
const fixturePath = resolve(root, 'src/tests/__globalEntityStatusInputContract__.ts');
const imports = `
/// <reference types="node" />
import type {
  GlobalDriverRepository, GlobalTruckRepository, GlobalCarrierRepository, GlobalMaterialRepository,
} from '../repositories/globalIdentity.repository';
import type {
  GlobalDriverEntity, GlobalTruckEntity, GlobalCarrierEntity, GlobalMaterialEntity,
} from '../types/globalEntities';
type DriverCreate = Parameters<GlobalDriverRepository['createGlobal']>[0];
type DriverUpdate = Parameters<GlobalDriverRepository['updateProfile']>[1];
type TruckCreate = Parameters<GlobalTruckRepository['createGlobal']>[0];
type TruckUpdate = Parameters<GlobalTruckRepository['updateProfile']>[1];
type CarrierCreate = Parameters<GlobalCarrierRepository['createGlobal']>[0];
type CarrierUpdate = Parameters<GlobalCarrierRepository['updateProfile']>[1];
type MaterialCreate = Parameters<GlobalMaterialRepository['createGlobal']>[0];
type MaterialUpdate = Parameters<GlobalMaterialRepository['updateCatalog']>[1];
`;
const entities = [
  { name: 'Driver', values: ['ACTIVE', 'SUSPENDED', 'INACTIVE'], rejected: ['MAINTENANCE'] },
  { name: 'Truck', values: ['ACTIVE', 'MAINTENANCE', 'INACTIVE'], rejected: ['SUSPENDED'] },
  { name: 'Carrier', values: ['ACTIVE', 'SUSPENDED', 'INACTIVE'], rejected: ['MAINTENANCE'] },
  { name: 'Material', values: ['ACTIVE', 'INACTIVE'], rejected: ['SUSPENDED', 'MAINTENANCE'] },
];

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

describe('Entity-local global status input authority', () => {
  it('uses the matching entity indexed status type at all eight optional create/update boundaries', () => {
    const source = ts.createSourceFile(repositoryPath, readFileSync(repositoryPath, 'utf8'), ts.ScriptTarget.Latest, true);
    const classes = source.statements.filter(ts.isClassDeclaration);
    let verified = 0;
    for (const { name } of entities) {
      const repository = classes.find(d => d.name?.text === `Global${name}Repository`);
      if (!repository) throw new Error(`Missing ${name} repository`);
      for (const [methodName, parameterIndex] of [
        ['createGlobal', 0], [name === 'Material' ? 'updateCatalog' : 'updateProfile', 1],
      ] as const) {
        const method = repository.members.filter(ts.isMethodDeclaration).find(d => d.name.getText(source) === methodName);
        const input = method?.parameters[parameterIndex].type;
        if (!input || !ts.isTypeLiteralNode(input)) throw new Error(`Missing ${name}.${methodName} input`);
        const fields = input.members.filter(ts.isPropertySignature).filter(d => d.name.getText(source) === 'status');
        expect(fields).toHaveLength(1);
        expect(fields[0].questionToken?.kind).toBe(ts.SyntaxKind.QuestionToken);
        const type = fields[0].type;
        if (!type || !ts.isIndexedAccessTypeNode(type)) throw new Error('Status must directly consume its entity authority');
        expect(type.objectType.getText(source)).toBe(`Global${name}Entity`);
        expect(type.indexType.getText(source)).toBe("'status'");
        verified++;
      }
    }
    expect(verified).toBe(8);
    // Direct references above prevent a shared vocabulary from replacing any boundary.
    expect(source.statements.filter(d =>
      (ts.isTypeAliasDeclaration(d) || ts.isInterfaceDeclaration(d)) && d.name.text === 'GlobalEntityStatus'
    )).toHaveLength(0);
  });

  it('compiles each exact entity vocabulary, both input boundaries, omission and undefined without widening', () => {
    const cases = [`
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends
  (<T>() => T extends B ? 1 : 2) ? true : false;
type Assert<T extends true> = T;
type NotAny<T> = 0 extends (1 & T) ? false : true;
`];
    for (const { name, values } of entities) {
      const vocabulary = values.map(v => `'${v}'`).join(' | ');
      cases.push(`
type ${name}Expected = ${vocabulary};
type ${name}Canonical = Assert<Equal<Global${name}Entity['status'], ${name}Expected>>;
type ${name}CanonicalNotAny = Assert<NotAny<Global${name}Entity['status']>>;
`);
      for (const operation of ['Create', 'Update']) {
        const boundary = name + operation;
        cases.push(`
type ${boundary}Field = Assert<Equal<Pick<${boundary}, 'status'>, { status?: Global${name}Entity['status'] }>>;
type ${boundary}NotAny = Assert<NotAny<${boundary}['status']>>;
const ${boundary}omitted: Pick<${boundary}, 'status'> = {};
const ${boundary}undefined: Pick<${boundary}, 'status'> = { status: undefined };
`);
        for (const value of values) {
          cases.push(`
const ${boundary}${value}: Pick<${boundary}, 'status'> = { status: '${value}' };
const ${boundary}${value}Canonical: Global${name}Entity['status'] | undefined = ${boundary}${value}.status;
${boundary}omitted.status = '${value}';
`);
        }
      }
    }
    expect(compileContract(cases.join('\n'))).toEqual([]);
  }, 30_000);

  it('rejects cross-entity statuses, invalid literals, arbitrary strings, null and incompatible values at every boundary', () => {
    const cases: string[] = [];
    for (const { name, rejected } of entities) {
      for (const operation of ['Create', 'Update']) {
        const boundary = name + operation;
        for (const [label, value] of [
          ...rejected.map(v => [v, `'${v}'`]),
          ['invalid', "'UNKNOWN_STATUS'"], ['wrongCase', "'active'"],
          ['null', 'null'], ['number', '123'], ['object', '{}'],
        ]) {
          cases.push(`
// @ts-expect-error ${boundary} must reject ${label}.
const ${boundary}${label}: Pick<${boundary}, 'status'> = { status: ${value} };
`);
        }
        cases.push(`
declare const arbitrary${boundary}: string;
// @ts-expect-error Input status must not widen to arbitrary string.
const ${boundary}widened: Pick<${boundary}, 'status'> = { status: arbitrary${boundary} };
`);
      }
    }
    // Unused expect-error directives fail the compiler contract if an invalid
    // value starts being accepted by either create or update.
    expect(compileContract(cases.join('\n'))).toEqual([]);
  }, 30_000);
});
