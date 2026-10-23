import { describe, expect, it } from 'vitest';
import * as ts from 'typescript';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { UserValidator } from '../validators/user.validator';

const root = process.cwd();
const fixturePath = resolve(root, 'src/tests/__userEntityRoleContract__.ts');
const roles = [
  'PROJECT_ADMIN', 'SUPER_ADMIN', 'SITE_SUPERVISOR', 'SUPERVISOR', 'DISPATCHER',
  'FINANCE_AUDITOR', 'SCALE_OPERATOR', 'DRIVER', 'VIEWER',
] as const;
const imports = `
/// <reference types="node" />
import type { UserRole } from '../types/common';
import type { UserEntity } from '../types/entities';
import type { UserRole as WizardRole } from '../types/wizard';
import type { AuthenticatedUser } from '../../server/security.middleware';
`;

function parse(file: string): ts.SourceFile {
  return ts.createSourceFile(file, readFileSync(resolve(root, file), 'utf8'), ts.ScriptTarget.Latest, true);
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

describe('User entity canonical role vocabulary authority', () => {
  it('imports the canonical symbol as a type and consumes it at both unchanged entity fields', () => {
    const source = parse('src/types/entities.ts');
    const declarations = source.statements.filter(ts.isImportDeclaration).filter(d =>
      ts.isStringLiteral(d.moduleSpecifier) && d.moduleSpecifier.text === './common'
    );
    const imports = declarations.flatMap(d => {
      const clause = d.importClause, bindings = clause?.namedBindings;
      return bindings && ts.isNamedImports(bindings)
        ? bindings.elements.filter(e => e.name.text === 'UserRole').map(element => ({ clause, element }))
        : [];
    });
    expect(imports).toHaveLength(1);
    expect(imports[0].clause?.isTypeOnly || imports[0].element.isTypeOnly).toBe(true);
    expect(imports[0].element.propertyName?.text ?? imports[0].element.name.text).toBe('UserRole');
    const entity = source.statements.filter(ts.isInterfaceDeclaration).find(d => d.name.text === 'UserEntity');
    if (!entity) throw new Error('Missing UserEntity');
    for (const field of ['role', 'requestedRole']) {
      const definitions = entity.members.filter(ts.isPropertySignature).filter(d => d.name.getText(source) === field);
      expect(definitions).toHaveLength(1);
      expect(definitions[0].type?.getText(source)).toBe('UserRole');
      expect(!!definitions[0].questionToken).toBe(field === 'requestedRole');
    }
  });

  it('compiles all nine roles, exact required/optional fields and the distinct excluded type boundaries', () => {
    const cases = [`
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends
  (<T>() => T extends B ? 1 : 2) ? true : false;
type Assert<T extends true> = T;
type NotAny<T> = 0 extends (1 & T) ? false : true;
type Expected = ${roles.map(role => `'${role}'`).join(' | ')};
type Canonical = Assert<Equal<UserRole, Expected>>;
type RequiredRole = Assert<Equal<Pick<UserEntity, 'role'>, { role: UserRole }>>;
type OptionalRequestedRole = Assert<Equal<Pick<UserEntity, 'requestedRole'>, { requestedRole?: UserRole }>>;
type CanonicalNotAny = Assert<NotAny<UserRole>>;
type RoleNotAny = Assert<NotAny<UserEntity['role']>>;
type RequestedNotAny = Assert<NotAny<UserEntity['requestedRole']>>;
type WizardSubset = Assert<Equal<WizardRole, 'PROJECT_ADMIN' | 'DISPATCHER' | 'FINANCE_AUDITOR' | 'VIEWER'>>;
type ServerVocabulary = Assert<Equal<AuthenticatedUser['role'], Expected>>;
const omitted: Pick<UserEntity, 'requestedRole'> = {};
const undefinedRequest: Pick<UserEntity, 'requestedRole'> = { requestedRole: undefined };
`];
    for (const role of roles) {
      cases.push(`
const canonical${role}: UserRole = '${role}';
const entity${role}: Pick<UserEntity, 'role' | 'requestedRole'> = { role: canonical${role}, requestedRole: canonical${role} };
const back${role}: UserRole = entity${role}.role;
const requested${role}: UserRole | undefined = entity${role}.requestedRole;
omitted.requestedRole = canonical${role};
`);
    }
    expect(compileContract(cases.join('\n'))).toEqual([]);
  }, 60_000);

  it('rejects invalid and widened roles, null and required-role omission without weakening canonical checks', () => {
    const cases: string[] = [];
    for (const field of ['role', 'requestedRole']) {
      for (const [label, value] of [
        ['invalid', "'OWNER'"], ['wrongCase', "'viewer'"], ['null', 'null'],
        ['number', '123'], ['object', '{}'],
      ]) {
        cases.push(`
// @ts-expect-error ${field} must reject ${label}.
const ${field}${label}: Pick<UserEntity, '${field}'> = { ${field}: ${value} };
`);
      }
      cases.push(`
declare const arbitrary${field}: string;
// @ts-expect-error Exact role fields cannot widen to arbitrary string.
const widened${field}: Pick<UserEntity, '${field}'> = { ${field}: arbitrary${field} };
`);
    }
    cases.push(`
// @ts-expect-error Canonical roles reject unregistered values.
const invalidCanonical: UserRole = 'OWNER';
// @ts-expect-error role remains required.
const missingRole: Pick<UserEntity, 'role'> = {};
// @ts-expect-error role remains non-nullable and does not accept undefined.
const undefinedRole: Pick<UserEntity, 'role'> = { role: undefined };
// @ts-expect-error Wizard context remains intentionally narrower than canonical roles.
const excludedWizard: WizardRole = 'SUPER_ADMIN';
`);
    // Unused expect-error directives themselves fail the real compiler contract.
    expect(compileContract(cases.join('\n'))).toEqual([]);
  }, 60_000);

  it('preserves the excluded wizard subset, validator acceptance behavior and server context declaration', () => {
    const wizard = parse('src/types/wizard.ts');
    const subset = wizard.statements.filter(ts.isTypeAliasDeclaration).find(d => d.name.text === 'UserRole');
    if (!subset || !ts.isUnionTypeNode(subset.type)) throw new Error('Wizard role subset must remain independent');
    expect(subset.type.types.map(t => t.getText(wizard))).toEqual([
      "'PROJECT_ADMIN'", "'DISPATCHER'", "'FINANCE_AUDITOR'", "'VIEWER'",
    ]);
    const server = parse('server/security.middleware.ts');
    const context = server.statements.filter(ts.isInterfaceDeclaration).find(d => d.name.text === 'AuthenticatedUser');
    const field = context?.members.filter(ts.isPropertySignature).find(d => d.name.getText(server) === 'role');
    if (!field?.type || !ts.isUnionTypeNode(field.type)) throw new Error('Server context remains outside this convergence');
    expect(field.type.types.map(t => t.getText(server))).toEqual(roles.map(role => `'${role}'`));
    expect(field.questionToken).toBeUndefined();
    const accepted = new Set(['PROJECT_ADMIN', 'DISPATCHER', 'FINANCE_AUDITOR', 'DRIVER', 'VIEWER']);
    for (const role of roles) {
      const result = UserValidator.validate({ userId: 'role-contract', email: 'role@example.com', role });
      expect(result.isValid).toBe(accepted.has(role));
      expect(result.errors.filter(e => e.field === 'role').map(e => e.code)).toEqual(
        accepted.has(role) ? [] : ['INVALID_ROLE']
      );
    }
  });
});
