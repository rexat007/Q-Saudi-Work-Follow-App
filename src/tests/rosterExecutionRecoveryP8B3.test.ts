import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeEach, describe, it, expect, vi } from 'vitest';
vi.mock('../firebase/admin', () => ({ adminDb: {} }));
import { commandDatabase, accountProfile } from './helpers/commandDatabase';
import { RosterExecutionServer } from '../services/import/rosterExecution.server';
import { ReviewedRosterCommitServer } from '../services/import/reviewedRosterCommit.server';
import { ImportSessionServerService } from '../services/importSession.server';
import { ProjectFleetQueryService } from '../services/projectFleetQuery.server';
import { TemporalRelationshipAuthority } from '../services/temporalRelationshipAuthority.server';
import { buildRosterCanonicalIntent } from '../services/import/rosterCanonicalIntent.service';
import { ImportProjectContextAdapter } from '../services/import/importProjectContext.adapter';
import { prepareDurableBatch } from '../services/import/durableSessionContract';
import { GLOBAL_IDENTITIES } from '../utils/globalIdentityPolicy';
const actor = { userId: 'actor', email: 'actor@example.invalid' };
let e: ReturnType<typeof commandDatabase>, service: RosterExecutionServer;
const root = 'projects/P1/', path = root + 'importSessions/S1';
function seed() {
  const s: Record<string, any> = { 'users/actor': accountProfile(), 'projects/P1': { projectId: 'P1', status: 'APPROVED' } };
  for (const [kind, id, name, natural] of [['CARRIER', 'C1', 'Carrier', '1010123456'], ['MATERIAL', 'M1', 'Sand', 'SAND'], ['MATERIAL', 'M2', 'Stone', 'STONE'], ['DRIVER', 'D1', 'Driver', '1234567890'], ['DRIVER', 'D2', 'Other', '1234567891'], ['TRUCK', 'T1', 'ABC123', 'ABC123'], ['TRUCK', 'T2', 'ABC124', 'ABC124']] as const) {
    const spec = GLOBAL_IDENTITIES[kind];
    s[`${spec.collection}/${id}`] = { [spec.id]: id, [spec.natural]: natural, status: 'ACTIVE', ...(kind === 'DRIVER' ? { fullNameAr: name, phone: '' } : kind === 'TRUCK' ? { plate: name } : { nameAr: name }) };
    s[`${root}${spec.kind}_memberships/${id}`] = { [spec.id]: id, projectId: 'P1', status: 'ACTIVE' };
    if (kind === 'DRIVER' || kind === 'TRUCK')
      s[`${root}${spec.kind}_carrier_affiliations/${id}`] = { [spec.id]: id, projectId: 'P1', carrierId: 'C1', status: 'ACTIVE' };
  }
  return s;
}
function row(n = 1): any { return { rowNumber: n, status: 'VALID', reviewStatus: 'accepted', raw: { Driver: 'Driver' }, canonical: { carrierName: 'Carrier', driverName: 'Driver', truckPlate: 'ABC123', materialName: 'Sand' }, validationIssues: [], entityResolutions: Object.fromEntries(Object.entries({ carrier: 'C1', driver: 'D1', truck: 'T1', material: 'M1' }).map(([k, id]) => [k, { entityType: k.toUpperCase(), originalValue: id, matchedId: id, isAuthorized: true, recommendation: 'ACCEPT', confidence: 1, isExact: true }])) }; }
function batch(rows: any[]): any { return { projectId: 'P1', importBatchId: 'B1', operationId: 'O1', rows, source: { sourceType: 'CSV', importBatchId: 'B1' }, metadata: {}, issues: [], currentStage: 'REVIEW', warningConfirmation: { confirmed: true } }; }
function prepared(r: any, kind: 'driver' | 'truck') { r.entityResolutions[kind] = { entityType: kind.toUpperCase(), originalValue: 'New', recommendation: 'ACCEPT', creationDisposition: 'PREPARED_NEW', isAuthorized: true, confidence: 1, isExact: false, ...(kind === 'driver' ? { preparedDriverPlan: { driverName: 'New Driver', residencyId: '1234567899', phone: '', carrierId: 'C1' } } : { preparedTruckPlan: { plateNumber: 'NEW123', carrierId: 'C1' } }) }; return r; }
async function review(rows = [row()]) {
  const b = prepareDurableBatch(batch(rows));
  const ctx = await new ProjectFleetQueryService(e.db).context('P1', actor, { resolution: true });
  const intent = buildRosterCanonicalIntent(b, ImportProjectContextAdapter.createPipelineContext({ relContext: ctx, projectId: 'P1', userId: 'actor', role: 'SUPER_ADMIN', operationId: 'O1' }));
  expect(intent.blockers).toEqual([]);
  const r = { projectId: 'P1', importSessionId: 'S1', operationId: 'O1', importBatchId: 'B1', sourceRevisionId: 'src', mappingRevisionId: 'map', intent, acceptedSignature: intent.signature, displacementApprovedSignature: intent.requiresDisplacementApproval ? intent.signature : undefined };
  e.store[path] = { schemaVersion: 2, domain: 'ROSTER', projectId: 'P1', importSessionId: 'S1', operationId: 'O1', importBatchId: 'B1', sourceType: 'CSV', lifecycleState: 'INTENT_REVIEWED', currentStage: 'FINAL_REVIEW', rosterStage: 'FINAL_REVIEW', source: { sourceRevisionId: 'src', sourceType: 'CSV', requiresReattach: true }, mapping: { mappingRevisionId: 'map', sourceRevisionId: 'src', approved: true, mappings: { Driver: 'driverName' } }, version: 6, createdAt: '2026-10-27T00:00:00.000Z', updatedAt: '2026-10-27T00:00:00.000Z', createdBy: 'actor', updatedBy: 'actor', warningConfirmation: true, importBatch: b, reviewedCanonicalIntent: r };
  return r;
}
function twoRows() { const second = row(2); second.entityResolutions.driver.matchedId = 'D2'; second.entityResolutions.truck.matchedId = 'T2'; second.entityResolutions.material.matchedId = 'M2'; return [row(), second]; }
const start = () => service.start('P1', 'S1', 6, actor);
const status = () => service.status('P1', 'S1', actor);
const run = (v: number) => service.advance('P1', 'S1', v, actor);
const canonical = () => Object.fromEntries(Object.entries(e.store).filter(([p]) => !p.includes('/importExecutions/') && !p.includes('/importSessions/')));
beforeEach(() => { e = commandDatabase(seed()); service = new RosterExecutionServer(e.db, 1); });
describe('P8-B3 durable execution recovery', () => {
  it('duplicate commit converges to one receipt without replay', async () => { await review(); const a = await service.requestCommit('P1', 'S1', { expectedVersion: 6 }, actor), before = structuredClone(e.store); const b = await service.requestCommit('P1', 'S1', { expectedVersion: 6 }, actor); expect(a.lifecycleState).toBe('COMMITTED'); expect(b.receipt).toEqual(a.receipt); expect(e.store).toEqual(before); });
  it('operation identity cannot be rebound to another reviewed session', async () => { await review(); await start(); e.store[root + 'importSessions/S2'] = { ...structuredClone(e.store[path]), importSessionId: 'S2' }; const before = structuredClone(e.store); await expect(service.start('P1', 'S2', 6, actor)).rejects.toThrow('EXECUTION_BINDING_MISMATCH'); expect(e.store).toEqual(before); });
  it('changed intent under the same operation fails closed', async () => { await review(); await start(); e.store[path].reviewedCanonicalIntent.intent.signature = 'different'; await expect(status()).rejects.toThrow('EXECUTION_BINDING_MISMATCH'); await expect(run(1)).rejects.toThrow('EXECUTION_BINDING_MISMATCH'); });
  it('simultaneous commit attempts converge without duplicate canonical effects', async () => { await review(); const attempts = await Promise.all([service.requestCommit('P1', 'S1', { expectedVersion: 6 }, actor), service.requestCommit('P1', 'S1', { expectedVersion: 6 }, actor)]); const saved = await status(); expect(saved.operation.state).toBe('COMPLETED'); expect(saved.completed).toHaveLength(1); expect(Object.keys(e.store).filter(p => p.includes('/driver_truck_assignments/'))).toHaveLength(1); expect(attempts.every(r => r.lifecycleState === 'COMMITTED' || r.lifecycleState === 'EXECUTING')).toBe(true); });
  it('stale operation version cannot advance or cancel', async () => { await review(twoRows()); const a = await start(); await run(a.operation.version); const before = structuredClone(e.store); await expect(run(a.operation.version)).rejects.toThrow('EXECUTION_VERSION_CONFLICT'); await expect(service.cancel('P1', 'S1', a.operation.version, actor)).rejects.toThrow('EXECUTION_VERSION_CONFLICT'); expect(e.store).toEqual(before); });
  it('partial progress and each successful consequence receipt survive a new service instance', async () => { await review(twoRows()); const a = await start(), partial = await run(a.operation.version); expect(partial.operation.state).toBe('PARTIAL'); expect(partial.completed).toHaveLength(1); expect(partial.remaining).toHaveLength(1); const saved = new RosterExecutionServer(e.db, 1); const recovered = await saved.status('P1', 'S1', actor); expect(recovered).toEqual(partial); const before = canonical(); const result = await saved.advance('P1', 'S1', recovered.operation.version, actor); expect(result.operation.state).toBe('COMPLETED'); expect(result.completed).toHaveLength(2); for (const [p, v] of Object.entries(before))
    if (p.includes('/driver_truck_assignments/') || p.includes('/truck_material_allocations/'))
      expect(e.store[p]).toEqual(v); });
  it('lost response is recovered by durable status and does not replay a completed group', async () => { await review(twoRows()); await start(); await run(1); const initial = await status(); const first = initial.completed[0], before = canonical(); service = new RosterExecutionServer(e.db, 1); await run(initial.operation.version); expect((await status()).completed.find(r => r.groupId === first.groupId)).toEqual(first); for (const [p, v] of Object.entries(before))
    if (p.includes('/driver_truck_assignments/'))
      expect(e.store[p]).toEqual(v); });
  it('an unfinished assignment/allocation already satisfied externally converges without another relationship write', async () => { await review(); await start(); const temporal = new TemporalRelationshipAuthority(e.db); await temporal.execute('ASSIGNMENT', 'P1', { command: 'ASSIGN', driverId: 'D1', truckId: 'T1' }, actor); await temporal.execute('ALLOCATION', 'P1', { command: 'ALLOCATE', truckId: 'T1', materialId: 'M1' }, actor); const before = canonical(), result = await run(1); expect(result.operation.state).toBe('COMPLETED'); expect(result.completed[0].consequences.every(c => c.outcome === 'SATISFIED')).toBe(true); for (const [p, v] of Object.entries(before))
    if (p.includes('/driver_truck_assignments/') || p.includes('/truck_material_allocations/'))
      expect(e.store[p]).toEqual(v); });
  it('broader current displacement stops continuation with durable REVIEW_REQUIRED', async () => { await review(); await start(); await new TemporalRelationshipAuthority(e.db).execute('ASSIGNMENT', 'P1', { command: 'ASSIGN', driverId: 'D1', truckId: 'T2' }, actor); const before = canonical(), result = await run(1); expect(result.operation.state).toBe('REVIEW_REQUIRED'); expect(result.reviewRequired).toBe(true); expect(result.operation.failure?.retryable).toBe(false); expect(canonical()).toEqual(before); await expect(run(result.operation.version)).rejects.toThrow('EXECUTION_NOT_RETRYABLE'); });
  it('cancelling partial execution preserves completed receipts and stops remaining work without rollback', async () => { await review(twoRows()); await start(); const partial = await run(1), before = canonical(); const result = await service.cancel('P1', 'S1', partial.operation.version, actor); expect(result.operation.state).toBe('CANCELLED'); expect(result.completed).toEqual(partial.completed); expect(result.remaining).toHaveLength(1); expect(canonical()).toEqual(before); expect(result.operation.cancellation?.acknowledgedAt).toBeTruthy(); await expect(run(result.operation.version)).rejects.toThrow('EXECUTION_NOT_RETRYABLE'); const retry = await service.requestCommit('P1', 'S1', { expectedVersion: 6 }, actor); expect(retry.lifecycleState).toBe('CANCELLED'); expect(canonical()).toEqual(before); });
  it.each(['status', 'advance', 'cancel'] as const)('current permission revocation blocks %s', async (action) => { await review(); await start(); e.store['users/actor'] = accountProfile('VIEWER'); const before = structuredClone(e.store); await expect(action === 'status' ? status() : action === 'advance' ? run(1) : service.cancel('P1', 'S1', 1, actor)).rejects.toThrow('FORBIDDEN_GLOBAL_COMMAND'); expect(e.store).toEqual(before); });
  it.each(['status', 'advance', 'cancel'] as const)('project A cannot %s project B session', async (action) => { await review(); await start(); e.store['projects/P2'] = { projectId: 'P2', status: 'APPROVED' }; const before = structuredClone(e.store); await expect(action === 'status' ? service.status('P2', 'S1', actor) : action === 'advance' ? service.advance('P2', 'S1', 1, actor) : service.cancel('P2', 'S1', 1, actor)).rejects.toThrow(); expect(e.store).toEqual(before); });
  it('normal PATCH and B2 direct execution cannot bypass a managed operation', async () => { await review(); await start(); const before = structuredClone(e.store); await expect(new ImportSessionServerService(e.db).updateCheckpoint('P1', 'S1', { lifecycleState: 'CANCELLED' }, { expectedVersion: 6 }, { ...actor, role: 'SUPER_ADMIN' } as any)).rejects.toThrow('IMPORT_EXECUTION_MANAGED'); await expect(new ReviewedRosterCommitServer(e.db).commit('P1', 'S1', { expectedVersion: 6 }, actor)).rejects.toThrow('IMPORT_EXECUTION_MANAGED'); expect(e.store).toEqual(before); });
  it('canonical write failure leaves the group unfinished and receipt absent; retry performs only that group', async () => { await review(twoRows()); await start(); const partial = await run(1); e.failWrites('driver_active_assignments'); const failed = await run(partial.operation.version); expect(failed.operation.state).toBe('PARTIAL'); expect(failed.completed).toEqual(partial.completed); expect(failed.operation.failure?.retryable).toBe(true); e.failWrites(''); const completed = await run(failed.operation.version); expect(completed.operation.state).toBe('COMPLETED'); expect(completed.completed).toHaveLength(2); });
  it('prepared identity, memberships, affiliations and relationship share atomic receipts', async () => { await review([prepared(prepared(row(), 'driver'), 'truck')]); await start(); const result = await run(1); expect(result.operation.state).toBe('COMPLETED'); expect(result.completed[0].consequences.filter(c => c.action === 'MATERIALIZE')).toHaveLength(2); for (const c of result.completed[0].consequences)
    expect(c.proof.groupId).toBe(result.completed[0].groupId); expect(Object.values(result.completed[0].result.preparedIdentityMap)).toHaveLength(2); });
  it('new fence invalidates a paused old worker before it can publish', async () => { await review(); await start(); const real = e.db.runTransaction.bind(e.db); let release!: () => void, entered!: () => void; const held = new Promise<void>(r => release = r), seen = new Promise<void>(r => entered = r); let pause = true; e.db.runTransaction = async (callback: any) => { if (pause) {
    pause = false;
    const claim = await real(callback);
    entered();
    await held;
    return claim;
  } return real(callback); }; const old = run(1); await seen; const executing = await status(); expect(executing.operation.state).toBe('EXECUTING'); const takeover = await run(executing.operation.version); release(); await old; expect((await status()).operation.state).toBe('COMPLETED'); expect((await status()).completed).toHaveLength(1); expect(takeover.operation.fence).toBe(2); });
  it('cancellation fences a paused executing worker and creates no canonical effects', async () => { await review(); await start(); const real = e.db.runTransaction.bind(e.db); let release!: () => void, entered!: () => void; const held = new Promise<void>(r => release = r), seen = new Promise<void>(r => entered = r); let pause = true; e.db.runTransaction = async (callback: any) => { if (pause) {
    pause = false;
    const claim = await real(callback);
    entered();
    await held;
    return claim;
  } return real(callback); }; const old = run(1); await seen; const executing = await status(), before = canonical(); await service.cancel('P1', 'S1', executing.operation.version, actor); release(); await old; expect(canonical()).toEqual(before); expect((await status()).completed).toEqual([]); });
  it('serialized persistence reload into a different database instance retains receipt authority', async () => {
    await review(twoRows());
    await start();
    const partial = await run(1);
    const dir = mkdtempSync(join(tmpdir(), 'p8b3-restart-'));
    try {
      writeFileSync(join(dir, 'state.json'), JSON.stringify(e.store));
      e = commandDatabase(JSON.parse(readFileSync(join(dir, 'state.json'), 'utf8')));
      service = new RosterExecutionServer(e.db, 1);
      const recovered = await status();
      expect(recovered.completed).toEqual(partial.completed);
      const completed = await run(recovered.operation.version);
      expect(completed.operation.state).toBe('COMPLETED');
      expect(completed.completed).toHaveLength(2);
    }
    finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
  it('a prepared identity created concurrently with its intended relationships is not duplicated on recovery', async () => {
    await review([prepared(prepared(row(), 'driver'), 'truck')]);
    await start();
    const { driverTruckIntakeServer } = await import('../services/driverTruckIntake.server');
    const admin = await import('../firebase/admin');
    // Use existing authority, with the same injected database as the server, rather than manufacturing receipts.
    const original = (admin as any).adminDb;
    Object.assign(original, e.db);
    const d = await driverTruckIntakeServer.createStandaloneDriver({ projectId: 'P1', carrierId: 'C1', driverName: 'New Driver', residencyId: '1234567899', phone: '' }, { ...actor, role: 'SUPER_ADMIN' } as any);
    const t = await driverTruckIntakeServer.createStandaloneTruck({ projectId: 'P1', carrierId: 'C1', plateNumber: 'NEW123' }, { ...actor, role: 'SUPER_ADMIN' } as any);
    await new TemporalRelationshipAuthority(e.db).execute('ASSIGNMENT', 'P1', { command: 'ASSIGN', driverId: d.driverId, truckId: t.truckId }, actor);
    await new TemporalRelationshipAuthority(e.db).execute('ALLOCATION', 'P1', { command: 'ALLOCATE', truckId: t.truckId, materialId: 'M1' }, actor);
    const before = canonical(), result = await run(1);
    expect(result.operation.state).toBe('COMPLETED');
    expect(result.completed[0].result.resultSummary.createdIdentities).toBe(0);
    expect(result.completed[0].consequences.every(c => c.outcome === 'SATISFIED')).toBe(true);
    for (const [p, v] of Object.entries(before))
      if (p.includes('/driver_truck_assignments/') || p.includes('/truck_material_allocations/'))
        expect(e.store[p]).toEqual(v);
  });
  it('an approved displacement already performed by another actor converges without closing a different relationship', async () => {
    const temporal = new TemporalRelationshipAuthority(e.db);
    await temporal.execute('ASSIGNMENT', 'P1', { command: 'ASSIGN', driverId: 'D1', truckId: 'T2' }, actor);
    await review();
    await start();
    await temporal.execute('ASSIGNMENT', 'P1', { command: 'REASSIGN', driverId: 'D1', truckId: 'T1' }, actor);
    const before = canonical(), result = await run(1);
    expect(result.operation.state).toBe('COMPLETED');
    for (const [p, v] of Object.entries(before))
      if (p.includes('/driver_truck_assignments/'))
        expect(e.store[p]).toEqual(v);
  });
  it('normal commit cannot restart a terminal completed operation with a changed binding', async () => { await review(); await service.requestCommit('P1', 'S1', { expectedVersion: 6 }, actor); const before = canonical(); await expect(service.requestCommit('P1', 'S1', { expectedVersion: 6, operationId: 'DIFFERENT' }, actor)).rejects.toThrow('INVALID_REVIEWED_INTENT_BINDING'); expect(canonical()).toEqual(before); });
  it('server rejects a stale session version before publishing an operation', async () => { await review(); await expect(service.start('P1', 'S1', 5, actor)).rejects.toThrow('VERSION_CONFLICT'); expect(Object.keys(e.store).some(p => p.includes('/importExecutions/'))).toBe(false); });
  it('receipt write failure rolls back all canonical mutations in its invariant group', async () => { await review([prepared(prepared(row(), 'driver'), 'truck')]); await start(); const before = canonical(); e.failWrites('/receipts/'); const failed = await run(1); expect(failed.operation.state).toBe('PARTIAL'); expect(failed.completed).toEqual([]); expect(canonical()).toEqual(before); e.failWrites(''); const done = await run(failed.operation.version); expect(done.operation.state).toBe('COMPLETED'); expect(done.completed).toHaveLength(1); });
  it('execute entry point denies a revoked principal even when an operation already exists', async () => { await review(); await start(); e.store['users/actor'] = accountProfile('VIEWER'); await expect(service.requestCommit('P1', 'S1', { expectedVersion: 6 }, actor)).rejects.toThrow('FORBIDDEN_GLOBAL_COMMAND'); });
  it('attributes receipts to exact kind even when canonical Driver and Truck IDs have the same text', async () => {
    await review([prepared(prepared(row(), 'driver'), 'truck')]); await start();
    e.store['drivers/SHARED'] = {driverId:'SHARED',nationalId:'1234567899',fullNameAr:'New Driver',phone:'',status:'ACTIVE'};
    e.store['trucks/SHARED'] = {truckId:'SHARED',normalizedPlate:'NEW123',plate:'NEW123',status:'ACTIVE'};
    e.store[root+'driver_memberships/SHARED'] = {projectId:'P1',driverId:'SHARED',status:'ACTIVE'};
    e.store[root+'driver_carrier_affiliations/SHARED'] = {projectId:'P1',driverId:'SHARED',carrierId:'C1',status:'ACTIVE'};
    const done = await run(1); expect(done.operation.state).toBe('COMPLETED');
    const receipts = done.completed[0].consequences;
    expect(receipts.find(c=>c.kind==='DRIVER' && c.action==='ENROLL')?.outcome).toBe('SATISFIED');
    expect(receipts.find(c=>c.kind==='TRUCK' && c.action==='ENROLL')?.outcome).toBe('MUTATED');
    expect(receipts.find(c=>c.kind==='DRIVER' && c.action==='AFFILIATE')?.outcome).toBe('SATISFIED');
    expect(receipts.find(c=>c.kind==='TRUCK' && c.action==='AFFILIATE')?.outcome).toBe('MUTATED');
  });
  it('lost server transaction acknowledgment preserves a completed group without reporting it failed', async () => {
    await review(twoRows()); await start();
    const real = e.db.runTransaction.bind(e.db); let loseAck = true;
    const completedCount = () => Object.values(e.store).find((v:any)=>v.executionKey && v.state)?.completedGroups || 0;
    e.db.runTransaction = async (callback:any) => {
      const before = completedCount(), result = await real(callback);
      if(loseAck && completedCount() > before) {loseAck = false; throw Object.assign(Error('lost commit acknowledgment'),{code:'UNAVAILABLE'});}
      return result;
    };
    const partial = await run(1); expect(partial.operation.state).toBe('PARTIAL');
    expect(partial.completed).toHaveLength(1); expect(partial.operation.failure).toBeNull();
    const prior = structuredClone(partial.completed[0]);
    const done = await run(partial.operation.version); expect(done.operation.state).toBe('COMPLETED');
    expect(done.completed.find(r=>r.groupId===prior.groupId)).toEqual(prior);
  });

});
