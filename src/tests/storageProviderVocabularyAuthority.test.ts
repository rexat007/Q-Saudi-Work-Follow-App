import { describe, expect, it, vi } from 'vitest';
import * as ts from 'typescript';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ClientWorkspaceService } from '../services/workspace.service';

const root = process.cwd();
const fixturePath = resolve(root, 'src/tests/__storageProviderVocabularyContract__.ts');
const imports = `
/// <reference types="node" />
import type { ClientWorkspaceService } from '../services/workspace.service';
import type {
  StorageProviderType, ProjectStorageProfile, StorageHistoryRecord,
  MigrationJob, DestinationValidationResult,
} from '../types/workspace';
type DestinationProvider = Parameters<ClientWorkspaceService['validateDestinationFolder']>[2];
type MigrationInput = Parameters<ClientWorkspaceService['startStorageMigration']>[0];
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

describe('Storage provider canonical vocabulary authority', () => {
  it('consumes the canonical type-only import at both required service boundaries and existing consumers', () => {
    const file = 'src/services/workspace.service.ts';
    const source = ts.createSourceFile(file, readFileSync(resolve(root, file), 'utf8'), ts.ScriptTarget.Latest, true);
    const declarations = source.statements.filter(ts.isImportDeclaration).filter(d =>
      ts.isStringLiteral(d.moduleSpecifier) && d.moduleSpecifier.text === '../types/workspace'
    );
    const imports = declarations.flatMap(d => {
      const clause = d.importClause, bindings = clause?.namedBindings;
      return bindings && ts.isNamedImports(bindings)
        ? bindings.elements.filter(e => e.name.text === 'StorageProviderType').map(element => ({ clause, element }))
        : [];
    });
    expect(imports).toHaveLength(1);
    expect(imports[0].clause?.isTypeOnly || imports[0].element.isTypeOnly).toBe(true);
    expect(imports[0].element.propertyName?.text ?? imports[0].element.name.text).toBe('StorageProviderType');
    const service = source.statements.filter(ts.isClassDeclaration).find(d => d.name?.text === 'ClientWorkspaceService');
    if (!service) throw new Error('Missing ClientWorkspaceService');
    const destination = service.members.filter(ts.isMethodDeclaration).find(d => d.name.getText(source) === 'validateDestinationFolder');
    expect(destination?.parameters[2].type?.getText(source)).toBe('StorageProviderType');
    expect(destination?.parameters[2].questionToken).toBeUndefined();
    const migration = service.members.filter(ts.isMethodDeclaration).find(d => d.name.getText(source) === 'startStorageMigration');
    const input = migration?.parameters[0].type;
    if (!input || !ts.isTypeLiteralNode(input)) throw new Error('Missing migration input boundary');
    const fields = input.members.filter(ts.isPropertySignature).filter(d => d.name.getText(source) === 'targetProvider');
    expect(fields).toHaveLength(1);
    expect(fields[0].type?.getText(source)).toBe('StorageProviderType');
    expect(fields[0].questionToken).toBeUndefined();

    const authorityFile = 'src/types/workspace.ts';
    const authority = ts.createSourceFile(authorityFile, readFileSync(resolve(root, authorityFile), 'utf8'), ts.ScriptTarget.Latest, true);
    for (const [name, field] of [
      ['ProjectStorageProfile', 'storageProvider'], ['StorageHistoryRecord', 'provider'],
      ['MigrationJob', 'sourceProvider'], ['MigrationJob', 'targetProvider'],
      ['DestinationValidationResult', 'provider'],
    ]) {
      const definition = authority.statements.filter(ts.isInterfaceDeclaration).find(d => d.name.text === name);
      const member = definition?.members.filter(ts.isPropertySignature).find(d => d.name.getText(authority) === field);
      expect(member?.type?.getText(authority)).toBe('StorageProviderType');
      expect(member?.questionToken).toBeUndefined();
    }
  });

  it('compiles exact providers, both service targets and all five canonical consumer fields without widening', () => {
    expect(compileContract(`
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends
  (<T>() => T extends B ? 1 : 2) ? true : false;
type Assert<T extends true> = T;
type NotAny<T> = 0 extends (1 & T) ? false : true;
type Expected = 'MY_DRIVE' | 'SHARED_DRIVE';
type Vocabulary = Assert<Equal<StorageProviderType, Expected>>;
type Destination = Assert<Equal<DestinationProvider, StorageProviderType>>;
type Migration = Assert<Equal<Pick<MigrationInput, 'targetProvider'>, { targetProvider: StorageProviderType }>>;
type CanonicalNotAny = Assert<NotAny<StorageProviderType>>;
type DestinationNotAny = Assert<NotAny<DestinationProvider>>;
type MigrationNotAny = Assert<NotAny<MigrationInput['targetProvider']>>;
type Profile = Assert<Equal<ProjectStorageProfile['storageProvider'], StorageProviderType>>;
type History = Assert<Equal<StorageHistoryRecord['provider'], StorageProviderType>>;
type JobSource = Assert<Equal<MigrationJob['sourceProvider'], StorageProviderType>>;
type JobTarget = Assert<Equal<MigrationJob['targetProvider'], StorageProviderType>>;
type Validation = Assert<Equal<DestinationValidationResult['provider'], StorageProviderType>>;
const providers: StorageProviderType[] = ['MY_DRIVE', 'SHARED_DRIVE'];
declare const client: ClientWorkspaceService;
for (const provider of providers) {
  const destination: DestinationProvider = provider;
  const params: MigrationInput = {
    projectId: 'p', projectCode: 'P', projectNameAr: 'Project',
    sourceFolderId: 'source', sourceSpreadsheetId: 'sheet', targetFolderId: 'target',
    targetProvider: provider,
  };
  const validation: Promise<DestinationValidationResult> = client.validateDestinationFolder('p', 'target', provider);
  const migration: Promise<{ success: boolean; job: MigrationJob }> = client.startStorageMigration(params);
  const back: StorageProviderType = params.targetProvider;
  const profile: Pick<ProjectStorageProfile, 'storageProvider'> = { storageProvider: back };
  const history: Pick<StorageHistoryRecord, 'provider'> = { provider: destination };
  const job: Pick<MigrationJob, 'sourceProvider' | 'targetProvider'> = { sourceProvider: provider, targetProvider: back };
  const result: Pick<DestinationValidationResult, 'provider'> = { provider: back };
  params.targetProvider = provider;
}
`)).toEqual([]);
  }, 60_000);

  it('rejects invalid, arbitrary, nullable and omitted providers at both required service boundaries', () => {
    const cases: string[] = [];
    for (const [label, value] of [
      ['invalid', "'LOCAL_DRIVE'"], ['wrongCase', "'my_drive'"], ['null', 'null'],
      ['undefined', 'undefined'], ['number', '123'], ['object', '{}'],
    ]) {
      cases.push(`
// @ts-expect-error Canonical vocabulary must reject ${label}.
const canonical${label}: StorageProviderType = ${value};
// @ts-expect-error Destination provider must reject ${label}.
const destination${label}: DestinationProvider = ${value};
// @ts-expect-error Migration provider must reject ${label}.
const migration${label}: Pick<MigrationInput, 'targetProvider'> = { targetProvider: ${value} };
`);
    }
    cases.push(`
declare const arbitrary: string;
// @ts-expect-error Canonical provider must not widen.
const canonicalWidened: StorageProviderType = arbitrary;
// @ts-expect-error Destination provider must not widen.
const destinationWidened: DestinationProvider = arbitrary;
// @ts-expect-error Migration provider must not widen.
const migrationWidened: Pick<MigrationInput, 'targetProvider'> = { targetProvider: arbitrary };
// @ts-expect-error Migration provider remains required.
const missing: Pick<MigrationInput, 'targetProvider'> = {};
declare const client: ClientWorkspaceService;
// @ts-expect-error Destination validation still requires its provider argument.
client.validateDestinationFolder('p', 'folder');
`);
    expect(compileContract(cases.join('\n'))).toEqual([]);
  }, 60_000);

  it('preserves destination and migration POST endpoints and exact serialized payloads for both providers', async () => {
    const client = new ClientWorkspaceService();
    const headers = { 'Content-Type': 'application/json', Authorization: 'Bearer test-token' };
    const headerSpy = vi.spyOn(client, 'getWorkspaceHeaders').mockResolvedValue(headers);
    const fetchMock = vi.fn<typeof fetch>();
    vi.stubGlobal('fetch', fetchMock);
    try {
      for (const provider of ['MY_DRIVE', 'SHARED_DRIVE'] as const) {
        const sharedDriveId = provider === 'SHARED_DRIVE' ? 'shared-drive' : undefined;
        const validation = { valid: true, folderId: 'target', folderName: 'Target', provider, sharedDriveId };
        fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ data: validation }), { status: 200 }));
        const result = await client.validateDestinationFolder('p', 'target', provider, 'current', sharedDriveId);
        expect(result).toEqual(JSON.parse(JSON.stringify(validation)));
        expect(fetchMock).toHaveBeenLastCalledWith('http://localhost:3000/api/workspace/validate-destination', {
          method: 'POST', headers,
          body: JSON.stringify({ projectId: 'p', targetFolderId: 'target', targetProvider: provider, currentFolderId: 'current', sharedDriveId }),
        });
        const params = {
          projectId: 'p', projectCode: 'P', projectNameAr: 'Project',
          sourceFolderId: 'source', sourceSpreadsheetId: 'sheet', targetFolderId: 'target',
          targetProvider: provider, sharedDriveId: sharedDriveId ?? null,
        };
        const job = {
          migrationJobId: 'job', projectId: 'p', sourceProvider: 'MY_DRIVE',
          targetProvider: provider, targetFolderId: 'target', status: 'REQUESTED',
          copiedFileIds: [], fileIdMap: {}, startedAt: '2026-10-23T00:00:00Z',
        };
        fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ success: true, job }), { status: 200 }));
        expect(await client.startStorageMigration(params)).toEqual({ success: true, job });
        expect(fetchMock).toHaveBeenLastCalledWith('http://localhost:3000/api/workspace/migrate/start', {
          method: 'POST', headers, body: JSON.stringify(params),
        });
        expect(headerSpy).toHaveBeenLastCalledWith({ 'Content-Type': 'application/json' }, true);
      }
      expect(fetchMock).toHaveBeenCalledTimes(4);
    } finally {
      vi.restoreAllMocks();
      vi.unstubAllGlobals();
    }
  });
});
