import { describe, expect, it } from 'vitest';
import * as ts from 'typescript';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const policyPath = resolve(root, 'src/utils/canonicalFleetRelationshipPolicy.ts');
const fixturePath = resolve(root, 'src/tests/__affiliationStatusVocabularyContract__.ts');
const imports = `
/// <reference types="node" />
import type { PureAffiliation, CanonicalFleetRelationshipPolicy } from '../utils/canonicalFleetRelationshipPolicy';
import type {
  AffiliationStatus, BaseProjectCarrierAffiliationEntity,
  ProjectDriverCarrierAffiliationEntity, ProjectTruckCarrierAffiliationEntity,
} from '../types/projectCarrierAffiliation';
type Result = ReturnType<typeof CanonicalFleetRelationshipPolicy.evaluateAffiliation>;
`;

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
  return ts.getPreEmitDiagnostics(program).map(d =>
    `${d.file?.fileName ?? 'compiler'}: TS${d.code}: ${ts.flattenDiagnosticMessageText(d.messageText, '\n')}`
  );
}

describe('Affiliation status vocabulary authority', () => {
  it('consumes the type-only canonical status at both policy boundaries and preserves the independent partial interface', () => {
    const source = ts.createSourceFile(policyPath, readFileSync(policyPath, 'utf8'), ts.ScriptTarget.Latest, true);
    const imports = source.statements.filter(ts.isImportDeclaration).filter(d =>
      ts.isStringLiteral(d.moduleSpecifier) && d.moduleSpecifier.text === '../types/projectCarrierAffiliation'
    );
    expect(imports).toHaveLength(1);
    expect(imports[0].importClause?.isTypeOnly).toBe(true);
    const bindings = imports[0].importClause?.namedBindings;
    if (!bindings || !ts.isNamedImports(bindings)) throw new Error('Missing canonical status import');
    expect(bindings.elements.map(e => [e.name.text, e.propertyName?.text])).toEqual([['AffiliationStatus', undefined]]);
    const definitions = source.statements.filter(d =>
      (ts.isInterfaceDeclaration(d) || ts.isTypeAliasDeclaration(d)) && d.name.text === 'PureAffiliation'
    );
    expect(definitions).toHaveLength(1);
    const affiliation = definitions[0];
    if (!ts.isInterfaceDeclaration(affiliation)) throw new Error('PureAffiliation must remain an independent interface');
    expect(affiliation.heritageClauses ?? []).toHaveLength(0);
    expect(affiliation.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)).toBe(true);
    const fields = affiliation.members.filter(ts.isPropertySignature);
    expect(fields.map(f => [f.name.getText(source), f.type?.getText(source), !!f.questionToken])).toEqual([
      ['projectId', 'string', false], ['carrierId', 'string', false], ['status', 'AffiliationStatus', false],
      // Pre-existing timestamp types remain untouched; only status is converged.
      ['createdAt', 'any', true], ['createdBy', 'string', true],
      ['updatedAt', 'any', true], ['updatedBy', 'string', true],
    ]);
    const policy = source.statements.filter(ts.isClassDeclaration).find(d => d.name?.text === 'CanonicalFleetRelationshipPolicy');
    const method = policy?.members.filter(ts.isMethodDeclaration).find(d => d.name.getText(source) === 'evaluateAffiliation');
    const result = method?.type;
    if (!result || !ts.isTypeLiteralNode(result)) throw new Error('Missing evaluation result contract');
    const status = result.members.filter(ts.isPropertySignature).filter(d => d.name.getText(source) === 'status');
    expect(status).toHaveLength(1);
    expect(status[0].type?.getText(source)).toBe('AffiliationStatus');
    expect(status[0].questionToken).toBeUndefined();
  });

  it('compiles exact shared status vocabulary, partial shape and unchanged required/optional fields', () => {
    expect(compileContract(`
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends
  (<T>() => T extends B ? 1 : 2) ? true : false;
type Assert<T extends true> = T;
type NotAny<T> = 0 extends (1 & T) ? false : true;
type Expected = 'ACTIVE' | 'INACTIVE';
type Vocabulary = Assert<Equal<AffiliationStatus, Expected>>;
type PolicyVocabulary = Assert<Equal<PureAffiliation['status'], AffiliationStatus>>;
type ResultVocabulary = Assert<Equal<Result['status'], AffiliationStatus>>;
type BaseVocabulary = Assert<Equal<BaseProjectCarrierAffiliationEntity['status'], AffiliationStatus>>;
type DriverVocabulary = Assert<Equal<ProjectDriverCarrierAffiliationEntity['status'], AffiliationStatus>>;
type TruckVocabulary = Assert<Equal<ProjectTruckCarrierAffiliationEntity['status'], AffiliationStatus>>;
type NoAnyPolicy = Assert<NotAny<PureAffiliation['status']>>;
type NoAnyResult = Assert<NotAny<Result['status']>>;
type NoAnyCanonical = Assert<NotAny<AffiliationStatus>>;
type NoAnyBase = Assert<NotAny<BaseProjectCarrierAffiliationEntity['status']>>;
type NoAnyDriver = Assert<NotAny<ProjectDriverCarrierAffiliationEntity['status']>>;
type NoAnyTruck = Assert<NotAny<ProjectTruckCarrierAffiliationEntity['status']>>;
type Keys = Assert<Equal<keyof PureAffiliation,
  'projectId' | 'carrierId' | 'status' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>>;
type OptionalKeys<T> = { [K in keyof T]-?: {} extends Pick<T, K> ? K : never }[keyof T];
type OptionalMetadata = Assert<Equal<OptionalKeys<PureAffiliation>, 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>>;
type Core = Assert<Equal<Pick<PureAffiliation, 'projectId' | 'carrierId' | 'status'>,
  { projectId: string; carrierId: string; status: Expected }>>;
type ResultShape = Assert<Equal<Result, {
  action: 'CREATE' | 'REACTIVATE' | 'REASSIGN' | 'IDEMPOTENT';
  status: Expected; carrierId: string;
}>>;
type CreatedBy = Assert<Equal<PureAffiliation['createdBy'], string | undefined>>;
type UpdatedBy = Assert<Equal<PureAffiliation['updatedBy'], string | undefined>>;
const values: AffiliationStatus[] = ['ACTIVE', 'INACTIVE'];
for (const status of values) {
  // No audit fields, entity identifiers or stored-entity inheritance required.
  const partial: PureAffiliation = { projectId: 'p', carrierId: 'c', status };
  const output: Result = { action: 'CREATE', carrierId: 'c', status };
  const fromPolicy: AffiliationStatus = partial.status;
  const fromResult: AffiliationStatus = output.status;
  const stored: Pick<ProjectDriverCarrierAffiliationEntity, 'status'> = { status: fromPolicy };
  const truck: Pick<ProjectTruckCarrierAffiliationEntity, 'status'> = { status: fromResult };
  partial.status = stored.status;
  output.status = truck.status;
  partial.createdBy = 'actor';
  partial.updatedBy = 'actor';
}
`)).toEqual([]);
  }, 30_000);

  it('rejects invalid, widened, nullable and omitted statuses and missing core policy fields', () => {
    const cases: string[] = [];
    for (const boundary of ['PureAffiliation', 'Result', 'BaseProjectCarrierAffiliationEntity',
      'ProjectDriverCarrierAffiliationEntity', 'ProjectTruckCarrierAffiliationEntity']) {
      for (const [label, value] of [
        ['invalid', "'CLOSED'"], ['case', "'active'"], ['null', 'null'],
        ['undefined', 'undefined'], ['number', '123'], ['object', '{}'],
      ]) {
        cases.push(`
// @ts-expect-error Status must reject ${label}.
const ${boundary}${label}: Pick<${boundary}, 'status'> = { status: ${value} };
`);
      }
      cases.push(`
declare const arbitrary${boundary}: string;
// @ts-expect-error Arbitrary strings cannot widen the canonical vocabulary.
const ${boundary}widened: Pick<${boundary}, 'status'> = { status: arbitrary${boundary} };
// @ts-expect-error Status remains required.
const ${boundary}omitted: Pick<${boundary}, 'status'> = {};
`);
    }
    for (const field of ['projectId', 'carrierId', 'status']) {
      cases.push(`
declare const missing${field}: Omit<PureAffiliation, '${field}'>;
// @ts-expect-error Each core policy field remains required.
const required${field}: PureAffiliation = missing${field};
`);
    }
    cases.push(`
declare const partial: PureAffiliation;
// @ts-expect-error A partial policy shape is not a stored driver affiliation.
const storedDriver: ProjectDriverCarrierAffiliationEntity = partial;
// @ts-expect-error A partial policy shape is not a stored truck affiliation.
const storedTruck: ProjectTruckCarrierAffiliationEntity = partial;
// @ts-expect-error Creator metadata remains optional string, not a number.
const wrongActor: PureAffiliation = { projectId: 'p', carrierId: 'c', status: 'ACTIVE', createdBy: 123 };
`);
    // Unused expect-error directives themselves fail the real compiler contract.
    expect(compileContract(cases.join('\n'))).toEqual([]);
  }, 30_000);
});
