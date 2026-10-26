import { setupParticipationFixture } from './helpers/setupParticipationFixture';
import { beforeEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { ProjectCommandsServerService } from '../services/projectCommands.server';
import { commandDatabase, accountProfile } from './helpers/commandDatabase';
import { decodeProject } from '../utils/persistenceBoundary';
import { canEditProjectFoundation, canEvaluateProjectActivation } from '../services/projectMutability.policy';

const actor = { userId: 'actor', role: 'VIEWER', email: 'actor@example.invalid' } as any;
const foundation = () => ({ nameAr: 'مشروع اختبار', nameEn: 'Test', clientName: 'Client', location: { lat: 24, lng: 46, geoFenceRadiusMeters: 1000, addressAr: '' }, settings: { zatcaTaxNumber: '', vatRatePercent: 15, currency: 'SAR' } });
const project = (status = 'SETUP') => ({ ...foundation(), projectId: 'P1', projectCode: 'Q-PRJ-050', projectNumber: 50, status, settings: { ...foundation().settings, googleDriveFolderId: 'folder', googleSpreadsheetId: 'sheet', allowDriverSelfDispatch: false }, createdBy: 'original', createdAt: new Date('2025-01-01'), updatedAt: new Date('2025-01-01') });
let x: ReturnType<typeof commandDatabase>, service: ProjectCommandsServerService;
const create = (patch: any = {}) => service.createProject({ ...foundation(), operationId: 'OP-1', ...patch }, actor);
const audits = () => Object.entries(x.store).filter(([key]) => key.startsWith('audit_logs/'));
beforeEach(() => {
  x = commandDatabase({ ...setupParticipationFixture('P1'), 'users/actor': accountProfile(), 'projects/P1': project() });
  service = new ProjectCommandsServerService(x.db);
});
describe('P4-B1 canonical Project commands', () => {
  it('creates SETUP with server identity and actor despite spoofed context and metadata', async () => {
    const created = await create({ projectId: 'ATTACK', projectCode: 'ATTACK', projectNumber: 999, createdBy: 'spoof', createdAt: 'bad', updatedBy: 'spoof', updatedAt: 'bad' });
    expect(created).toMatchObject({ projectId: 'Q-PRJ-051', projectCode: 'Q-PRJ-051', projectNumber: 51, status: 'SETUP', createdBy: 'actor', updatedBy: 'actor' });
    expect(created.createdAt).toBeInstanceOf(Date);
    expect(audits()[0][1]).toMatchObject({ actor: { userId: 'actor', role: 'SUPER_ADMIN' }, command: 'CREATE_PROJECT' });
  });
  it.each(['DRAFT', 'PLANNING', 'READY_FOR_REVIEW', 'APPROVED', 'ACTIVE', 'SUSPENDED', 'ARCHIVED', 'UNKNOWN', null])('rejects creation status %s without allocating', async status => {
    await expect(create({ status })).rejects.toHaveProperty('code', 'INVALID_PROJECT_INITIAL_STATE');
    expect(x.store['systemCounters/projectNumber']).toBeUndefined(); expect(audits()).toHaveLength(0);
  });
  it.each(['PROJECT_ADMIN', 'DRIVER', 'VIEWER', 'SITE_SUPERVISOR'])('denies creation by current %s despite SUPER_ADMIN claim', async role => {
    x.store['users/actor'].role = role;
    await expect(create()).rejects.toHaveProperty('code', 'FORBIDDEN_PROJECT_ACCESS');
  });
  it.each([null, { role: 'SUPER_ADMIN', assignedProjectIds: [], status: 'SUSPENDED' }, { role: 'SUPER_ADMIN', assignedProjectIds: 'P1', status: 'ACTIVE' }])('fails closed on absent/ineligible current account %j', async profile => {
    x.store['users/actor'] = profile;
    await expect(create()).rejects.toThrow(); expect(audits()).toHaveLength(0);
  });
  it('replays the committed result across service restart and canonical key order', async () => {
    const first = await create(); service = new ProjectCommandsServerService(x.db);
    x.store[`projects/${first.projectId}`].nameEn = 'Later edit';
    const replay = await create({ settings: { currency: 'SAR', vatRatePercent: 15, zatcaTaxNumber: '' } });
    expect(replay).toEqual(first); expect(x.store['systemCounters/projectNumber'].nextNumber).toBe(52); expect(audits()).toHaveLength(1);
  });
  it('rejects a changed request with the same operation', async () => {
    await create(); await expect(create({ nameEn: 'Different' })).rejects.toHaveProperty('code', 'PROJECT_COMMAND_CONFLICT'); expect(audits()).toHaveLength(1);
  });
  it('allocates once for concurrent identical requests', async () => {
    const results = await Promise.all(Array.from({ length: 12 }, () => create()));
    expect(new Set(results.map(value => value.projectId)).size).toBe(1); expect(audits()).toHaveLength(1); expect(x.store['systemCounters/projectNumber'].nextNumber).toBe(52);
  });
  it('namespaces the durable command by actor', async () => {
    const first = await create(); x.store['users/second'] = { ...accountProfile(), userId: 'second' };
    const second = await service.createProject({ ...foundation(), operationId: 'OP-1' }, { ...actor, userId: 'second' });
    expect(second.projectId).not.toBe(first.projectId); expect(audits()).toHaveLength(2);
  });
  it('reauthorizes a replay after account demotion', async () => {
    await create(); x.store['users/actor'].role = 'VIEWER'; await expect(create()).rejects.toHaveProperty('code', 'FORBIDDEN_PROJECT_ACCESS');
  });
  it.each([undefined, '', '../op', 123])('requires a bounded operationId %s', async operationId => {
    await expect(create({ operationId })).rejects.toHaveProperty('code', 'INVALID_PROJECT_OPERATION_ID');
  });
  it.each([{}, { nextNumber: null }, { nextNumber: '1' }, { nextNumber: 0 }, { nextNumber: -1 }, { nextNumber: 1.5 }, { nextNumber: NaN }, { nextNumber: Infinity }, { nextNumber: Number.MAX_SAFE_INTEGER }])('rejects corrupt existing counter %j without reset', async counter => {
    x.store['systemCounters/projectNumber'] = counter;
    await expect(create()).rejects.toHaveProperty('code', 'PROJECT_COUNTER_INVALID'); expect(audits()).toHaveLength(0);
  });
  it('bootstraps absent counter from numeric metadata and historical document code', async () => {
    x.store['projects/Q-PRJ-090'] = { projectId: 'Q-PRJ-090', status: 'DRAFT' };
    expect((await create()).projectId).toBe('Q-PRJ-091');
  });
  it('starts at one only for a genuinely empty collection and absent counter', async () => {
    delete x.store['projects/P1']; expect((await create()).projectNumber).toBe(1);
  });
  it('rejects corrupt bootstrap metadata', async () => {
    x.store['projects/P1'].projectNumber = '50'; await expect(create()).rejects.toHaveProperty('code', 'PROJECT_COUNTER_INVALID');
  });
  it('fails closed on an allocated ID collision', async () => {
    x.store['systemCounters/projectNumber'] = { nextNumber: 50 }; x.store['projects/Q-PRJ-050'] = project();
    await expect(create()).rejects.toHaveProperty('code', 'PROJECT_COLLISION_DETECTED'); expect(audits()).toHaveLength(0);
  });
  it('validates before allocation without requiring operational relationships', async () => {
    await expect(create({ nameAr: 'أ' })).rejects.toHaveProperty('code', 'VALIDATION_ERROR'); expect(x.store['systemCounters/projectNumber']).toBeUndefined();
    expect((await create()).authorizedCarrierIds).toEqual([]);
  });
  it.each(['SETUP', 'READY_FOR_REVIEW', 'APPROVED'])('permits bounded Foundation edits in %s and preserves identity and Workspace', async status => {
    x.store['projects/P1'].status = status; x.store['users/actor'] = accountProfile('PROJECT_ADMIN');
    const before = structuredClone(x.store['projects/P1']);
    await service.updateFoundation('P1', { nameAr: 'مشروع محدث', settings: { zatcaTaxNumber: '300000000000003' } }, actor);
    const updated = x.store['projects/P1'];
    expect(updated).toMatchObject({ projectId: 'P1', projectCode: before.projectCode, projectNumber: 50, createdBy: 'original', status, nameAr: 'مشروع محدث' });
    expect(updated.createdAt).toEqual(before.createdAt);
    expect(updated.settings).toEqual({ ...before.settings, zatcaTaxNumber: '300000000000003' });
    expect(audits()).toHaveLength(1); expect(audits()[0][1].changes.before).toEqual(before);
  });
  it.each(['projectId', 'projectCode', 'projectNumber', 'createdAt', 'createdBy', 'updatedAt', 'updatedBy', 'status', 'authorizedCarrierIds'])('rejects Foundation overposting %s', async field => {
    await expect(service.updateFoundation('P1', { [field]: 'spoof' }, actor)).rejects.toHaveProperty('code', 'INVALID_PROJECT_COMMAND'); expect(audits()).toHaveLength(0);
  });
  it.each(['googleDriveFolderId', 'googleSpreadsheetId', 'googleDriveProvisioning', 'storageProfile', 'allowDriverSelfDispatch', 'requireTareOnExit', 'maxToleranceKg'])('rejects non-Foundation settings %s', async field => {
    await expect(service.updateFoundation('P1', { settings: { [field]: 'spoof' } }, actor)).rejects.toHaveProperty('code', 'INVALID_PROJECT_COMMAND');
  });
  it.each(['ACTIVE', 'SUSPENDED', 'ARCHIVED', 'DRAFT', 'PLANNING'])('locks Foundation for persisted %s while keeping it readable', async status => {
    x.store['projects/P1'].status = status;
    expect(decodeProject<any>(x.store['projects/P1'], 'P1').status).toBe(status);
    await expect(service.updateFoundation('P1', { nameEn: 'Changed' }, actor)).rejects.toHaveProperty('code', 'PROJECT_FOUNDATION_LOCKED'); expect(audits()).toHaveLength(0);
    expect(canEditProjectFoundation(status as any)).toBe(false);
  });
  it.each(['DRIVER', 'VIEWER', 'FINANCE_AUDITOR'])('denies Foundation and lifecycle to current %s', async role => {
    x.store['users/actor'].role = role;
    await expect(service.updateFoundation('P1', { nameEn: 'Changed' }, actor)).rejects.toHaveProperty('code', 'FORBIDDEN_PROJECT_ACCESS');
    await expect(service.transitionStatus('P1', 'READY_FOR_REVIEW', actor)).rejects.toHaveProperty('code', 'FORBIDDEN_PROJECT_ACCESS');
  });
  it('requires current assignment, ignoring stale client scope', async () => {
    x.store['users/actor'] = { ...accountProfile('PROJECT_ADMIN'), assignedProjectIds: [] };
    await expect(service.updateFoundation('P1', { nameEn: 'Changed' }, { ...actor, role: 'SUPER_ADMIN', assignedProjectIds: ['P1'] })).rejects.toHaveProperty('code', 'FORBIDDEN_PROJECT_ACCESS');
    await expect(service.transitionStatus('P1', 'READY_FOR_REVIEW', actor)).rejects.toHaveProperty('code', 'FORBIDDEN_PROJECT_ACCESS');
  });
  it.each([['SETUP', 'READY_FOR_REVIEW'], ['READY_FOR_REVIEW', 'APPROVED'], ['READY_FOR_REVIEW', 'SETUP'], ['APPROVED', 'READY_FOR_REVIEW'], ['APPROVED', 'SETUP']])('commits legal %s → %s with audit', async (source, target) => {
    x.store['projects/P1'].status = source;
    const result = await service.transitionStatus('P1', target as any, actor, 'Review reason');
    expect(result).toMatchObject({ previousStatus: source, newStatus: target }); expect(x.store['projects/P1'].status).toBe(target);
    expect(audits()[0][1]).toMatchObject({ reason: 'Review reason', command: 'TRANSITION_PROJECT_LIFECYCLE' });
  });
  it.each(['DRAFT', 'PLANNING', 'SUSPENDED', 'ARCHIVED', 'ACTIVE'])('creates no new transitions from %s', async status => {
    x.store['projects/P1'].status = status;
    await expect(service.transitionStatus('P1', 'SETUP', actor)).rejects.toHaveProperty('code', 'INVALID_PROJECT_TRANSITION'); expect(audits()).toHaveLength(0);
  });
  it.each(['SETUP', 'READY_FOR_REVIEW', 'APPROVED', 'ACTIVE'])('never produces ACTIVE from %s through governance', async status => {
    x.store['projects/P1'].status = status;
    await expect(service.transitionStatus('P1', 'ACTIVE', actor)).rejects.toHaveProperty('code', 'INVALID_PROJECT_TRANSITION');
    expect(canEvaluateProjectActivation(status as any)).toBe(status === 'APPROVED');
  });
  it('rejects stale/illegal transition using persisted source state', async () => {
    x.store['projects/P1'].status = 'APPROVED'; await expect(service.transitionStatus('P1', 'APPROVED', actor)).rejects.toHaveProperty('code', 'INVALID_PROJECT_TRANSITION');
  });
  it.each(['CREATE', 'UPDATE', 'TRANSITION', 'WORKSPACE'])('rolls back %s when audit fails', async command => {
    const before = structuredClone(x.store); x.failWrites('audit_logs/');
    const run = command === 'CREATE' ? create() : command === 'UPDATE' ? service.updateFoundation('P1', { nameEn: 'Changed' }, actor) : command === 'TRANSITION' ? service.transitionStatus('P1', 'READY_FOR_REVIEW', actor) : service.recordWorkspaceLink('P1', { projectFolderId: 'new-folder', spreadsheetId: 'new-sheet', projectFolderName: 'Workspace' }, actor);
    await expect(run).rejects.toThrow('simulated write failure'); expect(x.store).toEqual(before);
  });
  it('leaves no audit or ledger on Project write failure', async () => {
    x.failWrites('projects/'); await expect(create()).rejects.toThrow(); expect(audits()).toHaveLength(0); expect(x.store['systemCounters/projectNumber']).toBeUndefined();
    expect(Object.keys(x.store).filter(key => key.startsWith('project_commands/'))).toHaveLength(0);
  });
  it('patches server Workspace identifiers against current settings without losing Foundation edits', async () => {
    x.store['projects/P1'].settings.currency = 'USD';
    await service.recordWorkspaceLink('P1', { projectFolderId: 'new-folder', spreadsheetId: 'new-sheet', projectFolderName: 'Workspace' }, actor);
    expect(x.store['projects/P1'].settings).toMatchObject({ currency: 'USD', vatRatePercent: 15, googleDriveFolderId: 'new-folder', googleSpreadsheetId: 'new-sheet' }); expect(audits()).toHaveLength(1);
  });
  it('rejects malformed persisted identity before mutation', async () => {
    x.store['projects/P1'].projectId = 'P2'; await expect(service.updateFoundation('P1', { nameEn: 'Changed' }, actor)).rejects.toHaveProperty('code', 'PERSISTENCE_BOUNDARY_INVALID');
  });
  it('closes browser root writes and keeps reads; retires repository mutations', () => {
    const rules = readFileSync('firestore.rules', 'utf8');
    const root = rules.slice(rules.indexOf('match /projects/{projectId} {'), rules.indexOf('// Carriers subcollection'));
    for (const operation of ['create', 'update', 'delete']) expect(root).toContain(`allow ${operation}: if false;`);
    expect(root).toContain('allow get:'); expect(root).toContain('allow list:');
    const repo = readFileSync('src/repositories/project.repository.ts', 'utf8');
    expect(repo).not.toMatch(/\b(?:setDoc|updateDoc|deleteDoc)\s*\(/); expect(repo).not.toContain('transaction.update(');
    expect(readFileSync('src/services/workspace.service.ts', 'utf8')).not.toContain('projectRepository.update(');
    const client = readFileSync('src/services/project.service.ts', 'utf8');
    expect(client).toContain('/foundation'); expect(client).not.toContain('projectRepository.update(');
  });
});
