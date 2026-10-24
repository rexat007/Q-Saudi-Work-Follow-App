import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { google } from 'googleapis';
import { setTestDbOverride } from '../firebase/admin';
import { app } from '../../server/app';
import { serverWorkspaceService } from '../../server/workspace.service';
import { WorkspaceStorageBoundary, strictWorkspaceProject, workspaceError } from '../../server/workspace.isolation';
import type { MigrationJob } from '../types/workspace';

// Optimistic document-version transactions, without a mutex or in-memory reservation lock.
// This simulates Firestore conflict/retry semantics; it is not a live emulator assertion.
function database(seed: Record<string, any>) {
  const records = new Map(Object.entries(structuredClone(seed)));
  const versions = new Map<string, number>();
  const commits: Array<{ path: string; value: any }> = [];
  const reads: string[] = [];
  const snapshot = (path: string) => ({ id: path.split('/').at(-1), exists: records.has(path), data: () => structuredClone(records.get(path)) });
  const ref = (path: string, collection = false, filter?: [string, any]): any => ({
    path, collectionKind: collection,
    collection: (name: string) => ref(`${path}/${name}`, true),
    doc: (id: string) => ref(`${path}/${id}`),
    where: (key: string, _op: string, value: any) => ref(path, true, [key, value]),
    get: async () => {
      reads.push(path);
      if (!collection) return snapshot(path);
      return { docs: [...records.keys()].filter(k => k.startsWith(path + '/') && !k.slice(path.length + 1).includes('/') && (!filter || records.get(k)[filter[0]] === filter[1])).map(snapshot) };
    },
  });
  const db = {
    collection: (name: string) => ref(name, true),
    runTransaction: vi.fn(async (operation: any) => {
      for (let attempt = 0; attempt < 30; attempt++) {
        const observed = new Map<string, number>();
        const writes: Array<{ reference: any; value: any; update: boolean }> = [];
        const result = await operation({
          get: async (reference: any) => {
            const value = await reference.get();
            if (reference.collectionKind) for (const doc of value.docs) observed.set(`${reference.path}/${doc.id}`, versions.get(`${reference.path}/${doc.id}`) || 0);
            else observed.set(reference.path, versions.get(reference.path) || 0);
            return value;
          },
          set: (reference: any, value: any) => writes.push({ reference, value: structuredClone(value), update: false }),
          update: (reference: any, value: any) => writes.push({ reference, value: structuredClone(value), update: true }),
        });
        if ([...observed].some(([key, version]) => (versions.get(key) || 0) !== version)) continue;
        for (const write of writes) {
          const path = write.reference.path;
          if (write.update && !records.has(path)) throw Error('Missing update record');
          const value = write.update ? { ...records.get(path), ...write.value } : write.value;
          records.set(path, value);
          versions.set(path, (versions.get(path) || 0) + 1);
          commits.push({ path, value: structuredClone(value) });
        }
        return result;
      }
      throw Error('Transaction contention');
    }),
  };
  return { db, records, commits, reads };
}
const project = (id: string) => ({ projectId: id, nameAr: id, projectCode: id, settings: { googleDriveFolderId: `folder_${id}`, googleSpreadsheetId: `sheet_${id}`, storageProfile: { currentStorageFolderId: `folder_${id}`, currentSpreadsheetId: `sheet_${id}`, previousStorageFolderId: `old_${id}` } } });
const seed = () => ({ 'projects/A': project('A'), 'projects/B': project('B') });
const job = (projectId = 'A', migrationJobId = 'job_A'): MigrationJob => ({ migrationJobId, projectId, sourceProvider: 'MY_DRIVE', targetProvider: 'SHARED_DRIVE', targetFolderId: 'new_target', status: 'VALIDATING', copiedFileIds: [], fileIdMap: {}, startedAt: '2026-10-24T00:00:00Z' });
const request = (path = '/sync/trips', body: any = { projectId: 'A' }) => ({ path, body, query: {}, params: {}, headers: { 'x-google-access-token': 'isolated-token' }, user: { userId: 'u', role: 'PROJECT_ADMIN', assignedProjectIds: ['A'] } }) as any;
function response() {
  const res: any = { locals: {}, statusCode: 200 };
  res.status = vi.fn((code: number) => { res.statusCode = code; return res; });
  res.json = vi.fn((data: any) => { res.payload = data; return res; });
  return res;
}
const stack = (app as any)._router.stack;
const boundaries = stack.filter((layer: any) => !layer.route && String(layer.regexp).includes('workspace')).map((layer: any) => layer.handle);
async function guard(req: any) {
  const res = response();
  for (const handle of boundaries) {
    const next = vi.fn();
    await handle(req, res, next);
    if (!next.mock.calls.length) return { req, res, passed: false };
  }
  return { req, res, passed: true };
}
async function route(path: string, req: any, res: any) {
  const layer = stack.find((layer: any) => layer.route?.path === `/api/workspace${path}`);
  expect(layer).toBeDefined();
  for (const item of layer.route.stack) {
    const next = vi.fn();
    await item.handle(req, res, next);
    if (!next.mock.calls.length) break;
  }
}
let fixture: ReturnType<typeof database>;
beforeEach(() => { fixture = database(seed()); setTestDbOverride(fixture.db); });
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); });

describe('Workspace strict identity and active-resource binding', () => {
  it.each(['/provision', '/sync/trips', '/sync/initial', '/sync/sheets', '/upload', '/drive/files', '/validate-destination', '/migrate/start', '/archive/download', '/resolve-file'])('requires explicit project identity on %s', async path => {
    const result = await guard(request(path, {}));
    expect(result.res.statusCode).toBe(400);
    expect(result.res.payload.code).toBe('PROJECT_ID_REQUIRED');
    expect(fixture.reads).toEqual([]);
  });
  it.each(['/sync/trips/', '/SYNC/TRIPS', '/sync/trips///'])('does not bypass identity checks via Express-compatible route spelling %s', async path => {
    const result = await guard(request(path, {}));
    expect(result.res.payload.code).toBe('PROJECT_ID_REQUIRED');
    expect(fixture.reads).toEqual([]);
  });
  it.each(['', ' A ', 'A/B', ['A'], { id: 'A' }, 1])('rejects malformed project identity %j', value => {
    const next = vi.fn(), res = response();
    strictWorkspaceProject(request('/sync/trips', { projectId: value }), res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.payload.code).toBe('INVALID_PROJECT_ID');
  });
  it('rejects conflicting identities instead of prioritizing one', async () => {
    const req = request(); req.query.projectId = 'B';
    expect((await guard(req)).res.payload.code).toBe('CONFLICTING_PROJECT_ID');
    req.query = {}; req.body.project = { projectId: 'B' };
    expect((await guard(req)).res.payload.code).toBe('CONFLICTING_PROJECT_ID');
  });
  it('rejects unauthorized and unauthenticated users before registry lookup', async () => {
    expect((await guard(request('/sync/trips', { projectId: 'B' }))).res.statusCode).toBe(403);
    const req = request(); delete req.user;
    expect((await guard(req)).res.statusCode).toBe(401);
    expect(fixture.reads).toEqual([]);
  });
  it('binds canonical spreadsheet before sync and preserves provider failures', async () => {
    const call = vi.spyOn(serverWorkspaceService, 'upsertTabRecords').mockRejectedValue(workspaceError('PROVIDER_TOKEN_REJECTED', 401));
    const mismatch = await guard(request('/sync/trips', { projectId: 'A', spreadsheetId: 'sheet_B', trips: [] }));
    expect(mismatch.res.statusCode).toBe(403); expect(call).not.toHaveBeenCalled();
    const valid = await guard(request('/sync/trips', { projectId: 'A', spreadsheetId: 'sheet_A', trips: [] }));
    expect(valid.passed).toBe(true);
    await route('/sync/trips', valid.req, valid.res);
    expect(call.mock.calls[0][0]).toBe('sheet_A');
    expect(valid.res.statusCode).toBe(401);
    expect(valid.res.payload.code).toBe('PROVIDER_TOKEN_REJECTED');
  });
  it('preserves missing Google OAuth rejection in production after project binding', async () => {
    const call = vi.spyOn(serverWorkspaceService, 'upsertTabRecords');
    vi.stubEnv('NODE_ENV', 'production');
    const req = request('/sync/trips', { projectId: 'A', spreadsheetId: 'sheet_A', trips: [] }); req.headers = {};
    const valid = await guard(req); expect(valid.passed).toBe(true);
    await route('/sync/trips', req, valid.res);
    expect(valid.res.statusCode).toBe(401); expect(valid.res.payload.code).toBe('GOOGLE_ACCESS_TOKEN_REQUIRED');
    expect(call).not.toHaveBeenCalled();
  });
  it('denies cross-project source IDs even for SUPER_ADMIN', async () => {
    const req = request('/migrate/start', { projectId: 'A', targetFolderId: 'unclaimed', sourceFolderId: 'folder_B' }); req.user.role = 'SUPER_ADMIN';
    expect((await guard(req)).res.payload.code).toBe('STORAGE_RESOURCE_MISMATCH');
  });
  it('rejects registry alias collisions rather than trusting a substituted root', async () => {
    fixture.records.get('projects/A').settings.storageProfile.currentStorageFolderId = 'folder_B';
    expect((await guard(request())).res.payload.code).toBe('STORAGE_REGISTRY_CONFLICT');
  });
  it('requires ancestry proof for upload and project folder listing', async () => {
    const proof = vi.spyOn(serverWorkspaceService, 'assertProjectFolderResource').mockRejectedValue(workspaceError('STORAGE_RESOURCE_NOT_BOUND', 403));
    const result = await guard(request('/upload', { projectId: 'A', subfolderId: 'child_B' }));
    expect(result.res.statusCode).toBe(403);
    expect(proof).toHaveBeenCalledWith('child_B', ['folder_A'], 'isolated-token', expect.arrayContaining(['folder_B', 'old_B']));
  });
  it('does not let SUPER_ADMIN bypass a foreign destination collision', async () => {
    const provider = vi.spyOn(serverWorkspaceService, 'validateDestinationFolder');
    const req = request('/validate-destination', { projectId: 'A', targetFolderId: 'folder_B' }); req.user.role = 'SUPER_ADMIN';
    const result = await guard(req);
    expect(result.res.payload.code).toBe('STORAGE_TARGET_CONFLICT');
    expect(provider).not.toHaveBeenCalled();
  });
  it('validates an unclaimed destination without reserving it', async () => {
    const provider = vi.spyOn(serverWorkspaceService, 'validateDestinationFolder').mockResolvedValue({ valid: true, folderId: 'new_target', folderName: 'new', provider: 'SHARED_DRIVE' });
    const result = await guard(request('/validate-destination', { projectId: 'A', targetFolderId: 'new_target', targetProvider: 'SHARED_DRIVE' }));
    expect(result.passed).toBe(true);
    await route('/validate-destination', result.req, result.res);
    expect(result.res.payload.success).toBe(true);
    expect(provider.mock.calls[0][3]).toBe('folder_A');
    expect(fixture.commits).toEqual([]);
  });
  it('uses persisted migration file maps rather than client history', async () => {
    fixture.records.set('workspace_migration_jobs/new_target', { ...job(), fileIdMap: { old_file: 'canonical_file' } });
    const result = await guard(request('/resolve-file', { projectId: 'A', fileId: 'old_file', historyRecords: [{ fileIdMap: { old_file: 'forged_file' } }] }));
    await route('/resolve-file', result.req, result.res);
    expect(result.res.payload.data.resolvedFileId).toBe('canonical_file');
  });
});

describe('Destination conflict and transactional migration reservation', () => {
  it.each(['folder_A', 'folder_B', 'old_B'])('rejects current or foreign current/historical destination %s', async target => {
    await expect(new WorkspaceStorageBoundary(fixture.db).eligibleDestination('A', target)).rejects.toHaveProperty('code', target === 'folder_A' ? 'CURRENT_STORAGE_DESTINATION' : 'STORAGE_TARGET_CONFLICT');
  });
  it.each(['VALIDATING', 'READY_TO_SWITCH', 'FAILED', 'SWITCHED'])('rejects another project migration ownership in status %s', async status => {
    fixture.records.set('workspace_migration_jobs/new_target', { ...job('B'), status });
    await expect(new WorkspaceStorageBoundary(fixture.db).eligibleDestination('A', 'new_target')).rejects.toHaveProperty('code', 'STORAGE_TARGET_CONFLICT');
  });
  it('accepts unclaimed destination preflight without persisting a claim', async () => {
    expect(await new WorkspaceStorageBoundary(fixture.db).eligibleDestination('A', ' new_target ')).toBe('new_target');
    expect(fixture.commits).toEqual([]);
  });
  it('returns the same job idempotently and rejects different active or terminal job IDs without overwriting', async () => {
    const boundary = new WorkspaceStorageBoundary(fixture.db);
    expect((await boundary.reserve(job())).created).toBe(true);
    expect((await boundary.reserve(job())).created).toBe(false);
    await expect(boundary.reserve(job('A', 'other'))).rejects.toHaveProperty('code', 'MIGRATION_ALREADY_ACTIVE');
    await boundary.save({ ...job(), status: 'FAILED' });
    await expect(boundary.reserve(job('A', 'other'))).rejects.toHaveProperty('code', 'MIGRATION_HISTORY_PROTECTED');
    expect(fixture.records.get('workspace_migration_jobs/new_target').migrationJobId).toBe('job_A');
  });
  it('uses the normalized folder document as a shared optimistic transaction boundary across projects', async () => {
    const a = new WorkspaceStorageBoundary(fixture.db), b = new WorkspaceStorageBoundary(fixture.db);
    const results = await Promise.allSettled([a.reserve(job('A', 'job_A')), b.reserve(job('B', 'job_B'))]);
    expect(results.filter(r => r.status === 'fulfilled')).toHaveLength(1);
    const failed = results.find(r => r.status === 'rejected') as PromiseRejectedResult;
    expect(failed.reason.code).toBe('STORAGE_TARGET_CONFLICT');
    expect(fixture.commits).toHaveLength(1);
    expect(fixture.commits[0].path).toBe('workspace_migration_jobs/new_target');
    expect(fixture.db.runTransaction).toHaveBeenCalledTimes(2);
  });
  it('persists reservation and COPYING before provider mutation, then records truthful failure', async () => {
    vi.spyOn(serverWorkspaceService, 'validateDestinationFolder').mockResolvedValue({ valid: true, folderId: 'new_target', folderName: 'test', provider: 'SHARED_DRIVE' });
    const copy = vi.fn(async () => {
      const persisted = fixture.records.get('workspace_migration_jobs/new_target');
      expect(persisted.projectId).toBe('A'); expect(persisted.status).toBe('COPYING');
      throw new Error('isolated provider failure');
    });
    vi.spyOn(google, 'drive').mockReturnValue({ files: { create: copy } } as any);
    vi.spyOn(google, 'sheets').mockReturnValue({} as any);
    const result = await serverWorkspaceService.executeStorageMigration({ projectId: 'A', projectCode: 'A', projectNameAr: 'A', sourceFolderId: 'folder_A', sourceSpreadsheetId: 'sheet_A', targetFolderId: 'new_target', targetProvider: 'SHARED_DRIVE', migrationJobId: 'job_A' }, 'mock-provider-token');
    expect(result.status).toBe('FAILED'); expect(copy).toHaveBeenCalledTimes(1);
    expect(fixture.commits.map(c => c.value.status)).toEqual(['VALIDATING', 'COPYING', 'FAILED']);
    expect(fixture.records.get('workspace_migration_jobs/new_target').errorDetails).toContain('isolated provider failure');
  });
  it('allows exactly one of two concurrent migration-start attempts to reach copy', async () => {
    vi.spyOn(serverWorkspaceService, 'validateDestinationFolder').mockResolvedValue({ valid: true, folderId: 'new_target', folderName: 'test', provider: 'SHARED_DRIVE' });
    const copy = vi.fn(async () => { throw Error('safe copy failure'); });
    vi.spyOn(google, 'drive').mockReturnValue({ files: { create: copy } } as any);
    vi.spyOn(google, 'sheets').mockReturnValue({} as any);
    const start = (id: string) => serverWorkspaceService.executeStorageMigration({ projectId: id, projectCode: id, projectNameAr: id, sourceFolderId: `folder_${id}`, sourceSpreadsheetId: `sheet_${id}`, targetFolderId: 'new_target', targetProvider: 'SHARED_DRIVE', migrationJobId: `job_${id}` }, 'mock-token');
    const results = await Promise.allSettled([start('A'), start('B')]);
    expect(results.filter(r => r.status === 'fulfilled')).toHaveLength(1);
    expect((results.find(r => r.status === 'rejected') as PromiseRejectedResult).reason.code).toBe('STORAGE_TARGET_CONFLICT');
    expect(copy).toHaveBeenCalledTimes(1);
  });
  it('never copies or creates a reservation when provider validation rejects the destination', async () => {
    vi.spyOn(serverWorkspaceService, 'validateDestinationFolder').mockResolvedValue({ valid: false, folderId: 'new_target', folderName: '', provider: 'SHARED_DRIVE', error: 'provider rejection' });
    const drive = vi.spyOn(google, 'drive');
    const result = await serverWorkspaceService.executeStorageMigration({ projectId: 'A', projectCode: 'A', projectNameAr: 'A', sourceFolderId: 'folder_A', sourceSpreadsheetId: 'sheet_A', targetFolderId: 'new_target', targetProvider: 'SHARED_DRIVE' });
    expect(result.status).toBe('FAILED'); expect(drive).not.toHaveBeenCalled(); expect(fixture.commits).toEqual([]);
  });
});

describe('Provider resource proof', () => {
  it('proves a project child through read-only parent traversal and rejects a foreign child', async () => {
    const get = vi.fn(async ({ fileId }: any) => ({ data: { parents: fileId === 'child_A' ? ['folder_A'] : [] } }));
    vi.spyOn(google, 'drive').mockReturnValue({ files: { get } } as any);
    await expect(serverWorkspaceService.assertProjectFolderResource('child_A', ['folder_A'], 'token')).resolves.toBeUndefined();
    await expect(serverWorkspaceService.assertProjectFolderResource('child_B', ['folder_A'], 'token')).rejects.toHaveProperty('code', 'STORAGE_RESOURCE_NOT_BOUND');
    expect(get.mock.calls.every(([options]) => options.fields === 'parents' && options.supportsAllDrives)).toBe(true);
  });
  it('does not cross a foreign project root nested beneath an allowed ancestor', async () => {
    const get = vi.fn(async () => ({ data: { parents: ['folder_B'] } }));
    vi.spyOn(google, 'drive').mockReturnValue({ files: { get } } as any);
    await expect(serverWorkspaceService.assertProjectFolderResource('nested_child', ['folder_A'], 'token', ['folder_B'])).rejects.toHaveProperty('code', 'STORAGE_TARGET_CONFLICT');
    expect(get).toHaveBeenCalledTimes(1);
  });
  it('does not pretend unknown ancestry is valid without provider authorization', async () => {
    await expect(serverWorkspaceService.assertProjectFolderResource('child_A', ['folder_A'])).rejects.toHaveProperty('code', 'STORAGE_RESOURCE_NOT_BOUND');
  });
  it.each([
    ['MY_DRIVE', 'drive_X', undefined, true, false],
    ['SHARED_DRIVE', 'drive_X', 'drive_Y', true, false],
    ['SHARED_DRIVE', 'drive_X', 'drive_X', false, false],
    ['SHARED_DRIVE', 'drive_X', 'drive_X', true, true],
    ['MY_DRIVE', undefined, undefined, true, true],
  ] as const)('preserves writable-folder and provider/shared-drive validation %s %s %s %s', async (provider, driveId, requestedDrive, writable, valid) => {
    vi.spyOn(google, 'drive').mockReturnValue({ files: { get: vi.fn(async () => ({ data: { id: 'new_target', name: 'new', mimeType: 'application/vnd.google-apps.folder', driveId, capabilities: { canAddChildren: writable } } })) } } as any);
    const result = await serverWorkspaceService.validateDestinationFolder('A', 'new_target', provider, 'folder_A', requestedDrive, 'token');
    expect(result.valid).toBe(valid);
  });
  it('does not begin copying when reservation persistence fails', async () => {
    vi.spyOn(serverWorkspaceService, 'validateDestinationFolder').mockResolvedValue({ valid: true, folderId: 'new_target', folderName: 'new', provider: 'SHARED_DRIVE' });
    fixture.db.runTransaction.mockRejectedValue(new Error('transaction unavailable'));
    const drive = vi.spyOn(google, 'drive');
    await expect(serverWorkspaceService.executeStorageMigration({ projectId: 'A', projectCode: 'A', projectNameAr: 'A', sourceFolderId: 'folder_A', sourceSpreadsheetId: 'sheet_A', targetFolderId: 'new_target', targetProvider: 'SHARED_DRIVE' }, 'token')).rejects.toThrow('transaction unavailable');
    expect(drive).not.toHaveBeenCalled();
    expect(fixture.commits).toEqual([]);
  });
});

describe('Provider-only source exemptions', () => {
  it.each([
    ['/drive/files/:fileId/content', 'getDriveFileContent', { buffer: Buffer.from('source'), fileName: 'source.csv', mimeType: 'text/csv', size: 6 }],
    ['/sheets/spreadsheets', 'listProjectSpreadsheets', { spreadsheets: [], totalCount: 0, projectId: 'external' }],
    ['/sheets/:spreadsheetId/metadata', 'getSpreadsheetMetadata', { spreadsheetId: 'external_sheet', sheets: [] }],
    ['/sheets/:spreadsheetId/values', 'getSpreadsheetValues', { values: [['external']] }],
  ] as const)('retains %s without a project-storage or reservation requirement', async (path, method, payload) => {
    const call = vi.spyOn(serverWorkspaceService as any, method).mockResolvedValue(payload);
    const req = request(path, {}); req.params = { fileId: 'external_file', spreadsheetId: 'external_sheet' };
    const result = await guard(req); expect(result.passed).toBe(true);
    await route(path, req, result.res);
    expect(result.res.statusCode).toBe(200); expect(call).toHaveBeenCalledTimes(1); expect(fixture.reads).toEqual([]);
  });
  it('uses Firestore transactions in production and leaves legacy global isolation behavior intact', () => {
    const helper = readFileSync('server/workspace.isolation.ts', 'utf8');
    expect(helper).toContain("collection('workspace_migration_jobs').doc(target)");
    expect(helper).toContain('this.db.runTransaction(');
    expect(helper).toContain('transaction.set(ref,');
    const legacy = readFileSync('server/security.middleware.ts', 'utf8');
    expect(legacy).toContain('if (!requestedProjectId) {\n    return next();');
  });
});
