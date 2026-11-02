import { describe, it, expect, vi } from 'vitest';
import { workspaceEnsureFixture, ensurePath } from './helpers/workspaceEnsureFixture';
import { operationConfig, profileCases, driverModes, operationActor } from './helpers/operationalProfileFixture';
import { workspaceTabManifest, FRESH_DUAL_LEGACY_DISPOSITION } from '../services/workspaceTabManifest';
import { GoogleWorkspaceCommandError } from '../services/projectGoogleWorkspace.server';
const matrix = profileCases.flatMap(([l, u, p]) => driverModes.map(d => ({ l, u, p, d })));
describe('GWS-ONE clean Project acceptance matrix', () => {
    it.each(matrix)('$p / $d creates exactly one owned resource set and converges on repeat', async ({ l, u, d }) => {
        const c = operationConfig(l, u, d), x = workspaceEnsureFixture(c);
        expect(await x.run()).toMatchObject({ state: 'ACTION_REQUIRED', actionRequired: 'GOOGLE_AUTHORIZATION' });
        await x.grant();
        expect(await x.run()).toMatchObject({ state: 'ACTION_REQUIRED', actionRequired: 'DESTINATION' });
        const initial = await x.run({ destinationRootFolderId: 'root' });
        expect(initial, JSON.stringify({ initial, state: x.store[ensurePath] })).toMatchObject({ state: 'READY', phase: 'READY' });
        const binding = structuredClone(x.store[ensurePath].binding), manifest = workspaceTabManifest(c);
        expect(x.resources).toHaveLength(2);
        expect(x.scripts.size).toBe(1);
        expect(x.workbook.book.sheets).toHaveLength(manifest.length);
        expect(new Set(x.workbook.book.sheets!.map(s => s.properties!.title)).size).toBe(manifest.length);
        for (const spec of manifest)
            expect(x.workbook.book.sheets!.find(s => s.properties?.title === spec.title)?.developerMetadata).toEqual(expect.arrayContaining([expect.objectContaining(spec.ownership)]));
        expect(x.port.projectMasterTabs).toHaveBeenCalledWith('sheet', expect.objectContaining({ projectId: 'P1', drivers: expect.arrayContaining([expect.objectContaining({ driverId: 'D' })]), materials: expect.arrayContaining([expect.objectContaining({ materialId: 'M' })]) }), expect.arrayContaining(['DRIVERS', 'CARRIERS', 'MATERIALS', 'FLEET_ROSTER']));
        for (let n = 0; n < 20; n++)
            expect((await x.run()).state).toBe('READY');
        expect(x.store[ensurePath].binding).toEqual(binding);
        expect(x.port.createProjectFolder).toHaveBeenCalledOnce();
        expect(x.port.createProjectSpreadsheet).toHaveBeenCalledOnce();
        expect(x.port.createBoundScript).toHaveBeenCalledOnce();
        expect(x.port.installScript).toHaveBeenCalledOnce();
        expect(x.store[ensurePath].ensureOperation.completed).toContain('FINAL_VERIFY');
        expect(x.store[ensurePath].ensureOperation.leaseOwner).toBeNull();
    });
    it('fresh Dual manifest intentionally excludes all seven historical compatibility tabs', () => { expect(Object.values(FRESH_DUAL_LEGACY_DISPOSITION)).toHaveLength(7); expect(Object.values(FRESH_DUAL_LEGACY_DISPOSITION).every(v => v === 'LEGACY_COMPATIBILITY_ONLY')).toBe(true); const names = workspaceTabManifest(operationConfig('WEIGHBRIDGE', 'WEIGHBRIDGE')).map(t => t.title); expect(names).toHaveLength(13); for (const old of Object.keys(FRESH_DUAL_LEGACY_DISPOSITION))
        expect(names).not.toContain(old); });
});
describe('durable lifecycle concurrency and recovery', () => {
    it('double clicks join one operation without a 409 and without creating resources twice', async () => { const x = workspaceEnsureFixture(); await x.prepare(); let entered!: () => void, release!: () => void; const inside = new Promise<void>(r => entered = r), wait = new Promise<void>(r => release = r); x.port.createProjectFolder.mockImplementationOnce(async (_name, parentId) => { entered(); await wait; x.resources.push({ id: 'folder', parentId, role: 'FOLDER' }); return 'folder'; }); const first = x.run({ destinationRootFolderId: 'root' }); await inside; expect(await x.run()).toMatchObject({ state: 'PREPARING', canResume: false }); release(); expect((await first).state).toBe('READY'); expect(x.resources).toHaveLength(2); });
    it.each(['FOLDER', 'SPREADSHEET'])('recovers a lost %s create response using the same tagged resource', async (role) => { const x = workspaceEnsureFixture(); await x.prepare(); const fn = role === 'FOLDER' ? x.port.createProjectFolder : x.port.createProjectSpreadsheet, original = fn.getMockImplementation()!; fn.mockImplementationOnce(async (...args) => { await original(...args); throw new GoogleWorkspaceCommandError('GOOGLE_NETWORK_ERROR', 502); }); expect((await x.run({ destinationRootFolderId: 'root' })).state).toBe('ATTENTION_REQUIRED'); expect((await x.run()).state).toBe('READY'); expect(x.resources).toHaveLength(2); expect(x.port.createProjectFolder).toHaveBeenCalledOnce(); expect(x.port.createProjectSpreadsheet).toHaveBeenCalledOnce(); });
    it('ambiguous Script success never creates again, never fakes READY and isolates its resources', async () => { const x = workspaceEnsureFixture(); await x.prepare(); x.port.createBoundScript.mockImplementationOnce(async (parentId) => { expect(x.store[ensurePath]).toMatchObject({ automationStage: 'SCRIPT_CREATE_INTENT', automationCreationAllowed: false }); x.scripts.set('provider-only', { parentId }); throw new GoogleWorkspaceCommandError('GOOGLE_NETWORK_ERROR', 502); }); const s = await x.run({ destinationRootFolderId: 'root' }); expect(s).toMatchObject({ state: 'ATTENTION_REQUIRED', diagnostic: 'SCRIPT_CREATE_IDENTITY_UNCERTAIN', canResume: false }); expect((await x.run()).state).toBe('ATTENTION_REQUIRED'); expect(x.port.createBoundScript).toHaveBeenCalledOnce(); expect(x.scripts.size).toBe(1); expect(x.resources).toHaveLength(2); expect(x.store[ensurePath].automationCreationAllowed).toBe(false); });
    it.each(['before-install', 'after-install', 'verify'])('resumes %s after Script identity is durably recorded', async (point) => { const x = workspaceEnsureFixture(); await x.prepare(); if (point === 'before-install')
        x.port.installScript.mockRejectedValueOnce(new GoogleWorkspaceCommandError('GOOGLE_SERVICE_UNAVAILABLE', 503)); if (point === 'after-install') {
        const original = x.port.installScript.getMockImplementation()!;
        x.port.installScript.mockImplementationOnce(async (...args) => { await original(...args); throw new GoogleWorkspaceCommandError('GOOGLE_NETWORK_ERROR', 502); });
    } if (point === 'verify')
        x.port.verifyAutomation.mockRejectedValueOnce(new GoogleWorkspaceCommandError('GOOGLE_SERVICE_UNAVAILABLE', 503)); expect((await x.run({ destinationRootFolderId: 'root' })).state).toBe('ATTENTION_REQUIRED'); expect(x.store[ensurePath].scriptProjectId).toBe('script'); expect((await x.run()).state).toBe('READY'); expect(x.port.createBoundScript).toHaveBeenCalledOnce(); });
    it('expired process lease resumes durable binding; a live lease is observed rather than stolen', async () => { const x = workspaceEnsureFixture(); await x.prepare(); expect((await x.run({ destinationRootFolderId: 'root' })).state).toBe('READY'); const op = x.store[ensurePath].ensureOperation; Object.assign(op, { status: 'PREPARING', leaseOwner: 'dead-process', leaseExpiresAt: Date.now() + 60000 }); expect((await x.run()).state).toBe('PREPARING'); op.leaseExpiresAt = Date.now() - 1; expect((await x.run()).state).toBe('READY'); expect(x.resources).toHaveLength(2); expect(x.scripts.size).toBe(1); });
    it('foreign known Script permission failure blocks replacement and never creates another Script', async () => { const x = workspaceEnsureFixture(); await x.prepare(); await x.run({ destinationRootFolderId: 'root' }); x.port.verifyAutomation.mockRejectedValueOnce(new GoogleWorkspaceCommandError('GOOGLE_PERMISSION_DENIED', 403)); expect(await x.run()).toMatchObject({ state: 'ATTENTION_REQUIRED', diagnostic: 'GOOGLE_PERMISSION_DENIED', retryable: false }); expect(x.port.createBoundScript).toHaveBeenCalledOnce(); });
});
describe('operation security and restart checkpoints', () => {
    it('a fresh operation-bound durable grant promotes atomically to the same canonical binding', async () => { const x = workspaceEnsureFixture(); await x.prepare(); const id = x.store[ensurePath].backgroundAuthorizationId; expect(x.store['workspace_google_authorizations/' + id]).toMatchObject({ spreadsheetId: '', bindingRevision: 0, status: 'ACTIVE' }); expect((await x.run({ destinationRootFolderId: 'root' })).state).toBe('READY'); expect(x.store['workspace_google_authorizations/' + id]).toMatchObject({ spreadsheetId: 'sheet', bindingRevision: 1, status: 'ACTIVE' }); expect(JSON.stringify(await x.engine().observe('P1', operationActor))).not.toMatch(/fixture-access|fixture-refresh|subject|actor/); });
    it('consent cannot attach to another or replaced provisioning operation', async () => { const x = workspaceEnsureFixture(); await x.run(); await expect(x.authorization.begin('P1', operationActor, true, 'other-operation')).rejects.toHaveProperty('code', 'WORKSPACE_EXECUTION_FENCED'); const b = await x.authorization.begin('P1', operationActor, true, x.store[ensurePath].ensureOperation.operationId); x.store[ensurePath].ensureOperation.operationId = 'replaced'; await expect(x.authorization.callback(new URL(b.url).searchParams.get('state')!, 'fixture-code', b.browser)).rejects.toHaveProperty('code', 'WORKSPACE_EXECUTION_FENCED'); expect(x.provider.exchange).not.toHaveBeenCalled(); });
    it('revocation before provisioning prevents all provider resource creates', async () => { const x = workspaceEnsureFixture(); await x.prepare(); x.store['workspace_google_authorizations/' + x.store[ensurePath].backgroundAuthorizationId].status = 'REVOKED'; expect(await x.run({ destinationRootFolderId: 'root' })).toMatchObject({ state: 'ACTION_REQUIRED', actionRequired: 'GOOGLE_AUTHORIZATION' }); expect(x.resources).toHaveLength(0); expect(x.port.createBoundScript).not.toHaveBeenCalled(); });
    it('current Project authority is enforced for ensure and observation', async () => { const x = workspaceEnsureFixture(); x.store['users/actor'].role = 'DRIVER'; await expect(x.run()).rejects.toHaveProperty('code', 'FORBIDDEN_PROJECT_ACCESS'); await expect(x.engine().observe('P1', operationActor)).rejects.toHaveProperty('code', 'FORBIDDEN_PROJECT_ACCESS'); expect(x.resources).toHaveLength(0); });
    it('a failure before Script create intent leaves one safe later creation attempt', async () => { const x = workspaceEnsureFixture(); await x.prepare(); x.port.authorizeProvisioning.mockRejectedValueOnce(new GoogleWorkspaceCommandError('GOOGLE_SERVICE_UNAVAILABLE', 503)); expect((await x.run({ destinationRootFolderId: 'root' })).state).toBe('ATTENTION_REQUIRED'); expect(x.port.createBoundScript).not.toHaveBeenCalled(); expect(x.store[ensurePath].automationCreationAllowed).toBe(true); expect((await x.run()).state).toBe('READY'); expect(x.port.createBoundScript).toHaveBeenCalledOnce(); });
    it('advanced recovery requires parent proof and rejects another Project identity claim', async () => { const x = workspaceEnsureFixture(); await x.prepare(); await x.run({ destinationRootFolderId: 'root' }); const grant = x.store[ensurePath].backgroundAuthorizationId; delete x.store[ensurePath].binding.scriptProjectId; delete x.store[ensurePath].scriptProjectId; x.scripts.set('foreign', { parentId: 'other-sheet' }); await expect(x.service().forExecutionAuthorization(grant).recoverAutomation('P1', 'foreign', operationActor, { ...x.port } as any)).rejects.toHaveProperty('code', 'SCRIPT_PARENT_PROOF_REQUIRED'); x.store['workspace_script_identities/script'] = { projectId: 'P2' }; await expect(x.service().forExecutionAuthorization(grant).recoverAutomation('P1', 'script', operationActor, { ...x.port } as any)).rejects.toHaveProperty('code', 'SCRIPT_IDENTITY_CONFLICT'); });
    it.each(['folder-identity', 'spreadsheet-identity', 'binding', 'script-identity'])('restarts at %s after expiry and fences the paused old process', async (point) => {
        const x = workspaceEnsureFixture();
        await x.prepare();
        const original = x.db.runTransaction.bind(x.db);
        let paused = false, entered!: () => void, release!: () => void;
        const at = new Promise<void>(r => entered = r), wait = new Promise<void>(r => release = r);
        x.db.runTransaction = async (fn: Function) => { const result = await original(fn), s = x.store[ensurePath]; const match = point === 'folder-identity' ? s?.folderId && !s?.fileId : point === 'spreadsheet-identity' ? s?.fileId && !s?.binding : point === 'binding' ? s?.binding && s.workbookHealth === 'REPAIR_REQUIRED' : s?.scriptProjectId && s.automationStage === 'SCRIPT_IDENTITY_RECORDED'; if (!paused && match) {
            paused = true;
            entered();
            await wait;
        } return result; };
        const first = x.run({ destinationRootFolderId: 'root' }).catch(error => error);
        await at;
        const s = x.store[ensurePath];
        s.ensureOperation.leaseExpiresAt = 0;
        s.leaseUntil = 0;
        s.syncLeaseExpiresAt = 0;
        const resumed = await x.run();
        expect(resumed.state).toBe('READY');
        release();
        await first;
        expect((await x.engine().observe('P1', operationActor)).state).toBe('READY');
        expect(x.resources).toHaveLength(2);
        expect(x.scripts.size).toBe(1);
        expect(x.port.createProjectFolder).toHaveBeenCalledOnce();
        expect(x.port.createProjectSpreadsheet).toHaveBeenCalledOnce();
        expect(x.port.createBoundScript).toHaveBeenCalledOnce();
    });
});
describe('phase failure resume and strict READY proof', () => {
    it.each(['destination', 'binding', 'workbook', 'master-data', 'reports', 'script-verification', 'final-verification', 'grant-refresh'])('same command resumes a temporary failure at %s without duplicate resources', async (phase) => {
        const x = workspaceEnsureFixture();
        await x.prepare();
        const error = new GoogleWorkspaceCommandError('GOOGLE_SERVICE_UNAVAILABLE', 503);
        if (phase === 'destination')
            x.port.validateDestination.mockRejectedValueOnce(error);
        if (phase === 'binding')
            x.port.verifyBinding.mockRejectedValueOnce(error);
        if (phase === 'workbook')
            x.port.repairWorkbook.mockRejectedValueOnce(error);
        if (phase === 'master-data')
            x.port.projectMasterTabs.mockRejectedValueOnce(error);
        if (phase === 'reports')
            x.port.projectProfileReports.mockRejectedValueOnce(error);
        if (phase === 'script-verification')
            x.port.verifyAutomation.mockRejectedValueOnce(error);
        if (phase === 'final-verification')
            x.port.verifyWorkbook.mockRejectedValueOnce(error);
        if (phase === 'grant-refresh')
            x.provider.refresh.mockRejectedValueOnce(error);
        expect((await x.run({ destinationRootFolderId: 'root' })).state).toBe('ATTENTION_REQUIRED');
        expect((await x.run({ destinationRootFolderId: 'root' })).state).toBe('READY');
        expect(x.resources).toHaveLength(2);
        expect(x.scripts.size).toBe(1);
        expect(x.port.createProjectFolder).toHaveBeenCalledOnce();
        expect(x.port.createProjectSpreadsheet).toHaveBeenCalledOnce();
        expect(x.port.createBoundScript).toHaveBeenCalledOnce();
    });
    it('observed READY requires current authorization and clean pending canonical state', async () => { const x = workspaceEnsureFixture(); await x.prepare(); await x.run({ destinationRootFolderId: 'root' }); x.store['projects/P1/workspace_sync_outbox/new'] = { projectId: 'P1', status: 'PENDING', revision: 1 }; expect((await x.engine().observe('P1', operationActor)).state).toBe('ATTENTION_REQUIRED'); delete x.store['projects/P1/workspace_sync_outbox/new']; x.store['workspace_google_authorizations/' + x.store[ensurePath].backgroundAuthorizationId].status = 'REVOKED'; expect((await x.engine().observe('P1', operationActor)).state).toBe('ATTENTION_REQUIRED'); expect(x.resources).toHaveLength(2); });
    it('untrusted provider messages never cross the public product-state diagnostic boundary', async () => { const x = workspaceEnsureFixture(); await x.prepare(); x.port.verifyBinding.mockRejectedValueOnce(Error('provider body: secret-token private@example.invalid customer values')); const s = await x.run({ destinationRootFolderId: 'root' }); expect(s.state).toBe('ATTENTION_REQUIRED'); expect(JSON.stringify(s)).not.toMatch(/secret-token|private@|customer values|provider body/); expect(x.scripts.size).toBe(0); });
});
it('a genuinely empty fresh Project provisions neutral profile surfaces without fabricated master rows', async () => { const x = workspaceEnsureFixture(); for (const key of Object.keys(x.store))
    if (key !== 'users/actor' && key !== 'projects/P1')
        delete x.store[key]; await x.prepare(); expect((await x.run({ destinationRootFolderId: 'root' })).state).toBe('READY'); expect(x.port.projectMasterTabs).toHaveBeenCalledWith('sheet', expect.objectContaining({ drivers: [], carriers: [], materials: [], fleetRows: [] }), expect.any(Array)); expect(x.resources).toHaveLength(2); expect(x.scripts.size).toBe(1); expect(x.workbook.book.sheets).toHaveLength(13); });
