


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

import { rosterResumeJourney, RosterJourneyLifetime, verifyRosterRemoteSource } from '../services/import/rosterResumeJourney';
import { sourceFingerprint, verifySourceReattach } from '../services/import/durableSessionContract';
import { DriverTruckPipelineService } from '../services/import/driverTruckPipeline.service';

describe('P8-B4 durable Roster resume journey', () => {
  it('restores the exact persisted resolution stage without requiring source bytes', async () => {
    await review(); const r = e.store[path]; r.lifecycleState='RESOLUTION'; r.rosterStage='DRIVER_TRUCK_RESOLUTION'; delete r.reviewedCanonicalIntent;
    const before=structuredClone(r), journey=rosterResumeJourney(r,'P1');
    expect(journey.stage).toBe('DRIVER_TRUCK_RESOLUTION'); expect(journey.requiresSourceReattach).toBe(false); expect(r).toEqual(before);
  });
  it('source checkpoint has no fabricated metadata and requires explicit file reattach', async () => {
    await review();const r=e.store[path];r.lifecycleState='DISCOVERED';r.rosterStage='MAPPING_APPROVAL';delete r.importBatch;delete r.source.discovery;
    const j=rosterResumeJourney(r,'P1');expect(j.requiresSourceReattach).toBe(true);expect(j.facts!.sourceRevision!.discovery).toBeUndefined();expect(j.facts!.reviewSnapshot).toBeNull();
  });
  it('reattaches exact bytes and metadata, rejects changed bytes/name, preserves session/mapping/review', async () => {
    await review();const r=e.store[path];const file=new File(['Carrier,Driver\nC1,D1'],'roster.csv',{type:'text/csv'});
    r.source={...r.source,fileName:file.name,fileSize:file.size,mimeType:file.type,fingerprint:await sourceFingerprint(await file.arrayBuffer())};
    const before=structuredClone(r);expect(await verifySourceReattach(r.source,file)).toBe(true);
    expect(await verifySourceReattach(r.source,new File(['Carrier,Driver\nC1,D2'],file.name,{type:file.type}))).toBe(false);
    expect(await verifySourceReattach(r.source,new File([await file.arrayBuffer()],'wrong.csv',{type:file.type}))).toBe(false);expect(r).toEqual(before);
  });
  it('managed execution must be read before any raw-row review restoration', async () => {
    await review();await start();expect(()=>rosterResumeJourney(e.store[path],'P1')).toThrow('EXECUTION_STATUS_REQUIRED');
    const op=await status();expect(rosterResumeJourney(e.store[path],'P1',op).stage).toBe('COMMIT_RESULT');
  });
  it('lost response reopens completed receipts without file or replay', async () => {
    await review();await service.requestCommit('P1','S1',{expectedVersion:6},actor);const before=structuredClone(e.store);
    const fresh=new RosterExecutionServer(e.db), saved=await fresh.status('P1','S1',actor);
    const j=rosterResumeJourney(e.store[path],'P1',saved);expect(j.requiresSourceReattach).toBe(false);expect(saved.operation.state).toBe('COMPLETED');expect(saved.retryAllowed).toBe(false);expect(saved.completed.length).toBe(1);expect(e.store).toEqual(before);
  });
  it('partial reopening preserves completed receipts and retry changes only unfinished groups', async () => {
    await review(twoRows());const a=await start();const partial=await run(a.operation.version);expect(partial.operation.state).toBe('PARTIAL');
    const saved=await new RosterExecutionServer(e.db,1).status('P1','S1',actor), receipt=structuredClone(saved.completed);
    expect(saved.completed).toHaveLength(1);expect(saved.remaining).toHaveLength(1);expect(rosterResumeJourney(e.store[path],'P1',saved).requiresSourceReattach).toBe(false);
    const done=await run(saved.operation.version);expect(done.operation.state).toBe('COMPLETED');expect(done.completed).toEqual(expect.arrayContaining(receipt));expect(done.remaining).toEqual([]);
  });
  it('cancelled operation reopens with effects retained and cannot restart through normal commit', async () => {
    await review(twoRows());const a=await start();const partial=await run(a.operation.version);const cancelled=await service.cancel('P1','S1',partial.operation.version,actor), before=structuredClone(e.store);
    expect(cancelled.operation.state).toBe('CANCELLED');expect(cancelled.completed).toHaveLength(1);expect(cancelled.retryAllowed).toBe(false);expect(rosterResumeJourney(e.store[path],'P1',cancelled).requiresSourceReattach).toBe(false);
    await service.requestCommit('P1','S1',{expectedVersion:6},actor);expect(e.store).toEqual(before);
  });
  it('review-required reopen never regenerates broader intent or exposes retry', async () => {
    await review();const a=await start();e.store['drivers/D1'].status='INACTIVE';const blocked=await run(a.operation.version);
    expect(blocked.operation.state).toBe('REVIEW_REQUIRED');expect(blocked.retryAllowed).toBe(false);expect(rosterResumeJourney(e.store[path],'P1',blocked).stage).toBe('COMMIT_RESULT');expect(blocked.completed).toEqual([]);
  });
  it('rejects cross-project or cross-session status bindings', async () => {
    await review();const a=await start();expect(()=>rosterResumeJourney(e.store[path],'P2',a)).toThrow('PROJECT_MISMATCH');
    expect(()=>rosterResumeJourney({...e.store[path],importSessionId:'S2'},'P1',a)).toThrow('EXECUTION_BINDING_MISMATCH');
    e.store['users/actor'].role='PROJECT_ADMIN';e.store['users/actor'].assignedProjectIds=['P2'];await expect(status()).rejects.toThrow();
  });
  it('terminal Roster results are discoverable only through the explicit opt-in; Trip remains excluded', async () => {
    await review();await service.requestCommit('P1','S1',{expectedVersion:6},actor);const sessions=new ImportSessionServerService(e.db),ctx={...accountProfile(),userId:'actor'} as any;
    expect(await sessions.listResumableSessions('P1',ctx)).toEqual([]);
    const recovered=await sessions.listResumableSessions('P1',ctx,true);expect(recovered.map((r:any)=>r.importSessionId)).toEqual(['S1']);
    e.store[root+'importSessions/TRIP']={...e.store[path],importSessionId:'TRIP',domain:'TRIP'};expect((await sessions.listResumableSessions('P1',ctx,true)).map((r:any)=>r.importSessionId)).toEqual(['S1']);
  });
  it('session lifetime fences same-project replacement and A→B→A', () => {
    const life=new RosterJourneyLifetime(), a=life.enter();expect(life.current(a)).toBe(true);life.invalidate();const b=life.enter();expect(life.current(a)).toBe(false);expect(life.current(b)).toBe(true);
  });
  it('remote reattach binds exact spreadsheet, tab and values revision', async () => {
    const remote={spreadsheetId:'sheet-id',sheetTitle:'Roster',values:[['Driver'],['D1']]};
    const fingerprint=await verifyRosterRemoteSource('sheet-id','Roster',remote);
    const previous={sourceType:'GOOGLE_SHEETS',sourceRevisionId:'src',requiresReattach:false,remote:{spreadsheetId:'sheet-id',sheetTitle:'Roster'},fingerprint};
    expect(await verifyRosterRemoteSource('sheet-id','Roster',remote,previous)).toBe(fingerprint);
    await expect(verifyRosterRemoteSource('sheet-id','Roster',{...remote,values:[['Driver'],['D2']]},previous)).rejects.toThrow('IMMUTABLE_SOURCE_REVISION');
    await expect(verifyRosterRemoteSource('other','Roster',remote,previous)).rejects.toThrow('SOURCE_REVISION_REQUIRED');
    await expect(verifyRosterRemoteSource('sheet-id','Other',{...remote,sheetTitle:'Other'},previous)).rejects.toThrow('IMMUTABLE_SOURCE_REVISION');
  });
  it('Google Sheets and CSV adapters share the same Roster resolution core and stable batch identity', async () => {
    const rel=await new ProjectFleetQueryService(e.db).context('P1',actor,{resolution:true});
    const ctx=ImportProjectContextAdapter.createPipelineContext({relContext:rel,projectId:'P1',userId:'actor',role:'SUPER_ADMIN',operationId:'O1'});
    const values=[['Carrier','Driver','Driver Identity','Truck','Material Code'],['Carrier','Driver','1234567890','ABC123','SAND']];
    const options={importBatchId:'B1',sheetName:'Roster',headerRowIndex:0,customMappings:{Carrier:'carrierName',Driver:'driverName','Driver Identity':'driverIdentity',Truck:'truckPlate','Material Code':'materialCode'}} as any;
    const local=await DriverTruckPipelineService.processFileToReview(values.map(r=>r.join(',')).join('\n'),'roster.csv',100,'text/csv',ctx,options);
    const remote=await DriverTruckPipelineService.processSheetsToReview(values,{sourceType:'GOOGLE_SHEETS',sourceFileId:'sheet-id',sourceSheetName:'Roster',importBatchId:'B1'},ctx,options);
    expect(remote.importBatchId).toBe('B1');expect(remote.operationId).toBe(local.operationId);expect(remote.rows.map(r=>r.canonical)).toEqual(local.rows.map(r=>r.canonical));expect(remote.source.sourceType).toBe('GOOGLE_SHEETS');
    expect(remote.rows[0].entityResolutions).toEqual(local.rows[0].entityResolutions);
  });
  it('legacy atomic completion reopens from its real receipt without inventing a B3 journal', async () => {
    await review();await new ReviewedRosterCommitServer(e.db).commit('P1','S1',{expectedVersion:6},actor);const j=rosterResumeJourney(e.store[path],'P1');expect(j.stage).toBe('COMMIT_RESULT');expect(j.requiresSourceReattach).toBe(false);expect(j.execution).toBeNull();
  });
});
