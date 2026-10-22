import { describe, expect, it } from 'vitest';
import * as ts from 'typescript';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const policyPath = resolve(root, 'src/utils/canonicalFleetRelationshipPolicy.ts');
const fixturePath = resolve(root, 'src/tests/__canonicalFleetPolicyTypeContract__.ts');

const imports = `
/// <reference types="node" />
import type { PureAssignment, PureAllocation } from '../utils/canonicalFleetRelationshipPolicy';
import type { ProjectDriverTruckAssignmentEntity } from '../types/projectDriverTruckAssignment';
import type { ProjectTruckMaterialAllocationEntity } from '../types/projectTruckMaterialAllocation';
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

describe('Canonical fleet relationship policy type authority', () => {
  it('exports aliases consuming only the canonical entity types through type-only imports', () => {
    const source = ts.createSourceFile(policyPath, readFileSync(policyPath, 'utf8'), ts.ScriptTarget.Latest, true);
    for (const [alias, canonical, modulePath] of [
      ['PureAssignment', 'ProjectDriverTruckAssignmentEntity', '../types/projectDriverTruckAssignment'],
      ['PureAllocation', 'ProjectTruckMaterialAllocationEntity', '../types/projectTruckMaterialAllocation'],
    ]) {
      const declarations = source.statements.filter(statement =>
        (ts.isTypeAliasDeclaration(statement) || ts.isInterfaceDeclaration(statement)) && statement.name.text === alias
      );
      expect(declarations).toHaveLength(1);
      const declaration = declarations[0];
      if (!ts.isTypeAliasDeclaration(declaration)) throw new Error(`${alias} must consume canonical authority`);
      expect(declaration.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)).toBe(true);
      expect(declaration.type.getText(source)).toBe(canonical);
      const canonicalImports = source.statements.filter(ts.isImportDeclaration).filter(statement =>
        ts.isStringLiteral(statement.moduleSpecifier) && statement.moduleSpecifier.text === modulePath
      );
      expect(canonicalImports).toHaveLength(1);
      const clause = canonicalImports[0].importClause;
      expect(clause?.isTypeOnly).toBe(true);
      const bindings = clause?.namedBindings;
      if (!bindings || !ts.isNamedImports(bindings)) throw new Error(`Missing canonical import for ${alias}`);
      expect(bindings.elements.map(element => element.name.text)).toEqual([canonical]);
    }
  });

  it('compiles exact nine-field, required, mutable contracts and bidirectional entity assignments', () => {
    expect(compileContract(`
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends
  (<T>() => T extends B ? 1 : 2) ? true : false;
type Assert<T extends true> = T;
type AssignmentShape = {
  assignmentId: string; projectId: string; driverId: string; truckId: string;
  status: 'ACTIVE' | 'CLOSED'; effectiveFrom: string; effectiveTo: string | null;
  createdAt: string; createdBy: string;
};
type AllocationShape = {
  allocationId: string; projectId: string; truckId: string; materialId: string;
  status: 'ACTIVE' | 'CLOSED'; effectiveFrom: string; effectiveTo: string | null;
  createdAt: string; createdBy: string;
};
type ExactAssignment = Assert<Equal<PureAssignment, AssignmentShape>>;
type ExactAllocation = Assert<Equal<PureAllocation, AllocationShape>>;
type CanonicalAssignment = Assert<Equal<PureAssignment, ProjectDriverTruckAssignmentEntity>>;
type CanonicalAllocation = Assert<Equal<PureAllocation, ProjectTruckMaterialAllocationEntity>>;
type AssignmentKeys = Assert<Equal<keyof PureAssignment, keyof AssignmentShape>>;
type AllocationKeys = Assert<Equal<keyof PureAllocation, keyof AllocationShape>>;
declare const assignment: PureAssignment;
declare const canonicalAssignment: ProjectDriverTruckAssignmentEntity;
declare const allocation: PureAllocation;
declare const canonicalAllocation: ProjectTruckMaterialAllocationEntity;
const toAssignmentEntity: ProjectDriverTruckAssignmentEntity = assignment;
const toAssignmentPolicy: PureAssignment = canonicalAssignment;
const toAllocationEntity: ProjectTruckMaterialAllocationEntity = allocation;
const toAllocationPolicy: PureAllocation = canonicalAllocation;
assignment.effectiveTo = null;
assignment.effectiveTo = '2026-01-01T00:00:00Z';
assignment.status = 'ACTIVE';
assignment.status = 'CLOSED';
allocation.effectiveTo = null;
allocation.effectiveTo = '2026-01-01T00:00:00Z';
allocation.status = 'ACTIVE';
allocation.status = 'CLOSED';
`)).toEqual([]);
  }, 30_000);

  it('rejects every missing required field, incompatible fields, extra fields and invalid status', () => {
    const cases: string[] = [];
    for (const [typeName, fields] of [
      ['PureAssignment', ['assignmentId', 'projectId', 'driverId', 'truckId', 'status', 'effectiveFrom', 'effectiveTo', 'createdAt', 'createdBy']],
      ['PureAllocation', ['allocationId', 'projectId', 'truckId', 'materialId', 'status', 'effectiveFrom', 'effectiveTo', 'createdAt', 'createdBy']],
    ] as const) {
      for (const field of fields) {
        cases.push(`
declare const missing${typeName}${field}: Omit<${typeName}, '${field}'>;
// @ts-expect-error Every field is required, including nullable effectiveTo.
const required${typeName}${field}: ${typeName} = missing${typeName}${field};
declare const wrong${typeName}${field}: Omit<${typeName}, '${field}'> & { ${field}: number };
// @ts-expect-error No field may widen to accept numeric values.
const incompatible${typeName}${field}: ${typeName} = wrong${typeName}${field};
`);
      }
      cases.push(`
declare const valid${typeName}: ${typeName};
// @ts-expect-error Status vocabulary excludes INACTIVE.
const invalidStatus${typeName}: ${typeName} = { ...valid${typeName}, status: 'INACTIVE' };
// @ts-expect-error Fresh literals cannot acquire unapproved fields.
const extra${typeName}: ${typeName} = { ...valid${typeName}, unexpectedField: 'extra' };
// @ts-expect-error effectiveTo is required and does not accept undefined under strict null checking.
const undefinedEnd${typeName}: ${typeName} = { ...valid${typeName}, effectiveTo: undefined };
`);
    }
    // An unused @ts-expect-error is itself a compiler diagnostic, so widening
    // any tested contract fails this test instead of silently accepting it.
    expect(compileContract(cases.join('\n'))).toEqual([]);
  }, 30_000);
});
