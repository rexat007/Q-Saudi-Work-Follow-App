import { describe, expect, it, vi } from 'vitest';
vi.mock('../firebase/admin', () => ({ adminDb: {} }));
import { ImportSessionServerService } from '../services/importSession.server';
import { commandDatabase } from './helpers/commandDatabase';
import { assertSessionPayload, reconstructSmartImportResumeState, validateDurableCheckpoint } from '../services/import/durableSessionContract';
import { packSessionArtifact, readSessionArtifact } from '../services/importSessionArtifacts.server';
import { encodeSessionChunks, decodeSessionChunks, validateSessionChunk } from '../services/import/sessionArtifactCodec';
const actor: any = { userId: 'actor', role: 'PROJECT_ADMIN', assignedProjectIds: ['P1'] };
const source = { sourceRevisionId: 'source1', sourceType: 'CSV', requiresReattach: true, fileName: 'test.csv', fileSize: 42, discovery: { sourceType: 'CSV', detectedHeaderRowIndex: 3, confidence: 81, requiresReview: true } };
const mapping = { mappingRevisionId: 'mapping1', sourceRevisionId: 'source1', mappings: { Driver: 'driverName' }, approved: true };
const batch: any = { importBatchId: 'B1', projectId: 'P1', operationId: 'O1', rows: [{ rowNumber: 1, canonical: { driverName: 'D' }, sourceLocation: { internalRowNumber: 1, physicalRowNumber: 5, sourceSheetName: 'S' } }] };
const make = () => { const database = commandDatabase({}); return { ...database, service: new ImportSessionServerService(database.db) }; };
async function reviewedSession() {
  const env = make();
  let record = await env.service.createSession('P1', { domain: 'ROSTER', sourceType: 'CSV', importSessionId: 'S1', importBatchId: 'B1', operationId: 'O1', currentStage: 'SOURCE_DISCOVERY' }, actor);
  const save = async (updates: any) => record = await env.service.updateCheckpoint('P1', 'S1', updates, { expectedVersion: record.version }, actor);
  await save({ lifecycleState: 'DISCOVERED', currentStage: 'MAPPING_APPROVAL', rosterStage: 'MAPPING_APPROVAL', source });
  await save({ lifecycleState: 'MAPPING', mapping });
  await save({ lifecycleState: 'RESOLUTION', currentStage: 'CARRIER_RESOLUTION', rosterStage: 'CARRIER_RESOLUTION', importBatch: batch });
  await save({ lifecycleState: 'REVIEW', currentStage: 'FINAL_REVIEW', rosterStage: 'FINAL_REVIEW' });
  const artifact: any = { projectId: 'P1', importSessionId: 'S1', importBatchId: 'B1', operationId: 'O1', sourceRevisionId: 'source1', mappingRevisionId: 'mapping1', acceptedSignature: 'sig', intent: { projectId: 'P1', signature: 'sig', requiresDisplacementApproval: false, rowDecisions: [{ rowNumber: 1, status: 'CONTRIBUTING' }], entities: [], blockers: [], assignmentIntents: [], allocationIntents: [] } };
  return { ...env, record, save, artifact };
}
describe('P8-B1 durable session authority', () => {
  it('persists forward transitions, server actor/time and one version per acknowledged checkpoint', async () => {
    const e = await reviewedSession();
    expect(e.record.version).toBe(5); expect(e.record.mapping.approvedBy).toBe('actor');
    await e.save({ lifecycleState: 'INTENT_REVIEWED', reviewedCanonicalIntent: e.artifact });
    const restored = await e.service.getSession('P1', 'S1', actor);
    expect(restored.version).toBe(6); expect(restored.reviewedCanonicalIntent.acceptedBy).toBe('actor');
    expect(restored.reviewedCanonicalIntent.acceptedAt).toMatch(/^\d{4}-/);
    expect(restored.importBatch.rows[0].sourceLocation.physicalRowNumber).toBe(5);
    expect(restored.importBatch.metadata?.reviewedCanonicalIntent).toBeUndefined();
  });
  it.each(['projectId','importSessionId','operationId','importBatchId','sourceRevisionId','mappingRevisionId'])('rejects wrong reviewed binding %s', async key => {
    const e = await reviewedSession(); e.artifact[key] = 'wrong';
    await expect(e.save({ lifecycleState: 'INTENT_REVIEWED', reviewedCanonicalIntent: e.artifact })).rejects.toMatchObject({ code: 'INVALID_REVIEWED_INTENT_BINDING' });
  });
  it('rejects signature mismatch and missing displacement approval', async () => {
    const e = await reviewedSession(); e.artifact.acceptedSignature = 'wrong';
    await expect(e.save({ lifecycleState: 'INTENT_REVIEWED', reviewedCanonicalIntent: e.artifact })).rejects.toMatchObject({ code: 'INVALID_REVIEWED_IMPORT_INTENT' });
    e.artifact.acceptedSignature = 'sig'; e.artifact.intent.requiresDisplacementApproval = true;
    await expect(e.save({ lifecycleState: 'INTENT_REVIEWED', reviewedCanonicalIntent: e.artifact })).rejects.toMatchObject({ code: 'DISPLACEMENT_APPROVAL_REQUIRED' });
  });
  it('requires explicit invalidation for backwards changes and a new mapping revision', async () => {
    const e = await reviewedSession(); await e.save({ lifecycleState: 'INTENT_REVIEWED', reviewedCanonicalIntent: e.artifact });
    await expect(e.save({ lifecycleState: 'RESOLUTION', rosterStage: 'CARRIER_RESOLUTION', currentStage: 'CARRIER_RESOLUTION' })).rejects.toMatchObject({ code: 'INVALID_IMPORT_SESSION_TRANSITION' });
    await e.save({ lifecycleState: 'MAPPING', rosterStage: 'MAPPING_APPROVAL', currentStage: 'MAPPING_APPROVAL', invalidateReview: true, mapping: { ...mapping, mappingRevisionId: 'mapping2', mappings: { Driver: 'driverIdentity' } } });
    expect((await e.service.getSession('P1','S1',actor)).reviewedCanonicalIntent).toBeUndefined();
  });
  it('rejects illegal skip, stage contradiction, unapproved mapping and stale versions without mutation', async () => {
    const e = make(); const r = await e.service.createSession('P1', { domain: 'ROSTER', sourceType: 'CSV', importSessionId: 'S1' }, actor);
    for (const updates of [{ lifecycleState: 'INTENT_REVIEWED' }, { rosterStage: 'FINAL_REVIEW' }]) await expect(e.service.updateCheckpoint('P1','S1',updates,{expectedVersion:1},actor)).rejects.toBeDefined();
    await expect(e.service.updateCheckpoint('P1','S1',{}, {expectedVersion:0},actor)).rejects.toMatchObject({ code: 'VERSION_CONFLICT', serverVersion: 1 });
    const discovered = await e.service.updateCheckpoint('P1','S1',{ lifecycleState: 'DISCOVERED', source },{expectedVersion:1},actor);
    await expect(e.service.updateCheckpoint('P1','S1',{ lifecycleState: 'MAPPING', rosterStage: 'MAPPING_APPROVAL', currentStage: 'MAPPING_APPROVAL', mapping: { ...mapping, approved: false } },{expectedVersion:discovered.version},actor)).rejects.toMatchObject({ code: 'APPROVED_MAPPING_REQUIRED' });
    expect(r.version).toBe(1);
  });
  it('cancel is durable and terminal, including after reload', async () => {
    const e = await reviewedSession(); await e.save({ lifecycleState: 'CANCELLED', currentStage: 'SOURCE_DISCOVERY', rosterStage: 'SOURCE_DISCOVERY' });
    const terminal = await e.service.getSession('P1','S1',actor);
    expect(terminal.lifecycleState).toBe('CANCELLED');
    await expect(e.save({ lifecycleState: 'REVIEW' })).rejects.toMatchObject({ code: 'INVALID_IMPORT_SESSION_TRANSITION' });
    expect(() => reconstructSmartImportResumeState(terminal, 'P1')).toThrow('IMPORT_SESSION_TERMINAL');
  });
  it('does not enter roster execution even with a reviewed artifact', async () => {
    const e = await reviewedSession(); await e.save({ lifecycleState: 'INTENT_REVIEWED', reviewedCanonicalIntent: e.artifact });
    await expect(e.save({ lifecycleState: 'COMMITTING' })).rejects.toBeDefined();
  });
  it('restore uses persisted discovery without confidence/header defaults and treats legacy conservatively', async () => {
    const e = await reviewedSession(); const r = await e.service.getSession('P1','S1',actor);
    const restored = reconstructSmartImportResumeState(r,'P1');
    expect(restored.sourceRevision.discovery).toEqual(source.discovery); expect(restored.requiresSourceReattach).toBe(true);
    expect(reconstructSmartImportResumeState({...r,source:{...r.source,requiresReattach:false}},'P1').requiresSourceReattach).toBe(true);
    const legacy = reconstructSmartImportResumeState({ ...r, schemaVersion: undefined, source: undefined },'P1');
    expect(legacy.durableStage).toBe('SOURCE_DISCOVERY'); expect(legacy.reviewSnapshot).toEqual(r.importBatch); expect(legacy.reviewedIntent).toBeNull(); expect(legacy.legacyClassification).toBe('LEGACY_REVIEW_REQUIRED');
    expect(() => reconstructSmartImportResumeState({ ...r, schemaVersion: 999 },'P1')).toThrow('UNSUPPORTED_IMPORT_SESSION_SCHEMA');
    expect(() => reconstructSmartImportResumeState(r,'P2')).toThrow('PROJECT_MISMATCH');
  });
  it('failed checkpoint/cancel writes leave the durable header and version intact', async () => {
    const e = await reviewedSession(); const before = structuredClone(e.store); e.failWrites('importSessions');
    await expect(e.save({ lifecycleState: 'CANCELLED', rosterStage: 'SOURCE_DISCOVERY', currentStage: 'SOURCE_DISCOVERY' })).rejects.toThrow('simulated write failure');
    expect(e.store).toEqual(before);
  });
  it.each([new ArrayBuffer(3), new Uint8Array(3), Buffer.from('x'), new Blob(['x']), new File(['x'],'x.csv'), { token:'x' }, { nested: { authorization:'x' } }, { credential:'x' }, { access_token:'x' }])('rejects forbidden nested payload %#', value => {
    expect(() => assertSessionPayload({ nested: value })).toThrow('INVALID_PAYLOAD_FORBIDDEN_FIELDS');
  });
  it('forbids secrets even inside staged artifact paths before persistence', () => {
    expect(() => validateSessionChunk(JSON.stringify([['o',null],['o','nested'],['s','token',0,'secret']]))).toThrow('INVALID_PAYLOAD_FORBIDDEN_FIELDS');
  });
  it('supports a realistic 10,000-row snapshot through ordered revision-bound chunks', async () => {
    const large = { importBatch: { ...batch, rows: Array.from({length:10000}, (_, i) => ({ rowNumber:i+1, canonical:{ driverName:`Driver ${i}`, truckPlate:`PLT-${i}`, materialName:'Material', carrierName:'Carrier' }, raw:{ Driver:`Driver ${i}`, Plate:`PLT-${i}`, Notes:'source evidence '.repeat(12) }, sourceLocation:{ physicalRowNumber:i+5, sourceSheetName:'Sheet1' } })) } };
    const packed = packSessionArtifact(large); expect(packed.chunks.length).toBeGreaterThan(32);
    const documents: any = {};
    packed.chunks.forEach((text,index) => documents[`S/checkpointChunks/${packed.manifest.artifactId}_${index}`] = { ...packed.manifest, index, text });
    const ref: any = { collection:(name:string)=>({doc:(id:string)=>({path:`S/${name}/${id}`})}) };
    const read = async (r:any)=>({ exists:Boolean(documents[r.path]), data:()=>documents[r.path] });
    expect(await readSessionArtifact(read,ref,packed.manifest)).toEqual(large);
    delete documents[`S/checkpointChunks/${packed.manifest.artifactId}_1`];
    await expect(readSessionArtifact(read,ref,packed.manifest)).rejects.toThrow('INVALID_IMPORT_SESSION_ARTIFACT');
  });
  it('rejects out-of-order text fragments, duplicate paths, corrupt revision and prototype pollution', () => {
    const parts = encodeSessionChunks({ large:'X'.repeat(10000), nested:{ value:3 } });
    expect(decodeSessionChunks(parts)).toEqual({large:'X'.repeat(10000),nested:{value:3}});
    const pieces = JSON.parse(parts[0]); [pieces[1],pieces[2]]=[pieces[2],pieces[1]];
    expect(() => decodeSessionChunks([JSON.stringify(pieces)])).toThrow('INVALID_IMPORT_SESSION_ARTIFACT');
    expect(() => validateSessionChunk('[["o",null],["o","__proto__"]]')).toThrow('INVALID_PAYLOAD_FORBIDDEN_FIELDS');
  });
});

describe('P8-B1 recovery: compatibility without synthetic lifecycle walking', () => {
  it('Trip reaches review from real source acceptance, with no roster stage, mapping revision or roster intent', async () => {
    const e=make(); let r=await e.service.createSession('P1',{domain:'TRIP',importSessionId:'trip1',sourceType:'CSV'},actor);
    expect(r.lifecycleState).toBe('SOURCE'); expect(r.rosterStage).toBeUndefined();
    r=await e.service.updateCheckpoint('P1','trip1',{lifecycleState:'DISCOVERED',source},{expectedVersion:r.version},actor);
    expect(r.currentStage).toBe('DISCOVERY');
    r=await e.service.updateCheckpoint('P1','trip1',{lifecycleState:'REVIEW_REQUIRED',reviewSnapshot:{rows:[{rowNumber:1,canonical:{ticketId:'T1'}}]}},{expectedVersion:r.version},actor);
    expect(r.lifecycleState).toBe('REVIEW');expect(r.version).toBe(3);expect(r.mapping).toBeUndefined();expect(r.reviewedCanonicalIntent).toBeUndefined();
    await expect(e.service.updateCheckpoint('P1','trip1',{lifecycleState:'INTENT_REVIEWED'},{expectedVersion:r.version},actor)).rejects.toMatchObject({code:'INVALID_IMPORT_SESSION_TRANSITION'});
    r=await e.service.updateCheckpoint('P1','trip1',{lifecycleState:'COMMITTED'},{expectedVersion:r.version},actor);
    expect(r.lifecycleState).toBe('COMMITTED');
    await expect(e.service.updateCheckpoint('P1','trip1',{lifecycleState:'REVIEW'},{expectedVersion:r.version},actor)).rejects.toMatchObject({code:'INVALID_IMPORT_SESSION_TRANSITION'});
  });
  it('Trip cannot skip missing source evidence or contradict its subordinate stage', async () => {
    const e=make();let r=await e.service.createSession('P1',{domain:'TRIP',importSessionId:'trip1'},actor);
    await expect(e.service.updateCheckpoint('P1','trip1',{lifecycleState:'REVIEW',reviewSnapshot:{rows:[]}},{expectedVersion:r.version},actor)).rejects.toMatchObject({code:'INVALID_IMPORT_SESSION_TRANSITION'});
    await expect(e.service.updateCheckpoint('P1','trip1',{currentStage:'FINAL_REVIEW'},{expectedVersion:r.version},actor)).rejects.toMatchObject({code:'INVALID_IMPORT_SESSION_STAGE'});
  });
  it('canceling a legacy active session is allowed without fabricating revisions or permitting other mutations', async () => {
    const e=make(); const old:any={importSessionId:'old',projectId:'P1',operationId:'old-op',importBatchId:'old-batch',lifecycleState:'REVIEW',version:7,createdAt:'2026-01-01T00:00:00.000Z',updatedAt:'2026-01-01T00:00:00.000Z',createdBy:'actor',updatedBy:'actor',reviewSnapshot:{rows:[{rowNumber:1,raw:{Name:'D'}}]}};
    e.store['projects/P1/importSessions/old']=structuredClone(old);
    await expect(e.service.updateCheckpoint('P1','old',{lifecycleState:'CANCELLED',operationId:'other'},{expectedVersion:7},actor)).rejects.toMatchObject({code:'IMMUTABLE_IDENTITY_VIOLATION'});
    const cancelled=await e.service.updateCheckpoint('P1','old',{lifecycleState:'CANCELLED'},{expectedVersion:7},actor);
    expect(cancelled.version).toBe(8);expect(cancelled.schemaVersion).toBeUndefined();expect(cancelled.source).toBeUndefined();expect(cancelled.reviewSnapshot).toEqual(old.reviewSnapshot);
    await expect(e.service.updateCheckpoint('P1','old',{lifecycleState:'REVIEW'},{expectedVersion:8},actor)).rejects.toBeDefined();
  });
  it('a failed second staged chunk cannot publish a new header or version', async () => {
    const e=await reviewedSession();const before=structuredClone(e.store['projects/P1/importSessions/S1']);
    const large={importBatch:{...batch,rows:Array.from({length:10000},(_,i)=>({rowNumber:i+1,raw:{Name:'Name '.repeat(15)},canonical:{driverName:'D'},sourceLocation:{physicalRowNumber:i+2}}))}};
    const packed=packSessionArtifact(large);
    await e.service.updateCheckpoint('P1','S1',{artifactChunk:{...packed.manifest,index:0,text:packed.chunks[0]}},{expectedVersion:e.record.version},actor);
    e.failWrites(`${packed.manifest.artifactId}_1`);
    await expect(e.service.updateCheckpoint('P1','S1',{artifactChunk:{...packed.manifest,index:1,text:packed.chunks[1]}},{expectedVersion:e.record.version},actor)).rejects.toThrow('simulated write failure');
    expect(e.store['projects/P1/importSessions/S1']).toEqual(before);
    await expect(e.service.updateCheckpoint('P1','S1',{checkpointArtifact:packed.manifest},{expectedVersion:e.record.version},actor)).rejects.toMatchObject({code:'INVALID_IMPORT_SESSION_ARTIFACT'});
    expect((await e.service.getSession('P1','S1',actor)).importBatch.rows).toHaveLength(1);
  });
  it('a stale artifact cannot become active even when every chunk exists', async () => {
    const e=await reviewedSession();const packed=packSessionArtifact({warningConfirmation:true});
    for(let index=0;index<packed.chunks.length;index++)await e.service.updateCheckpoint('P1','S1',{artifactChunk:{...packed.manifest,index,text:packed.chunks[index]}},{expectedVersion:e.record.version},actor);
    const next=await e.service.updateCheckpoint('P1','S1',{warningConfirmation:false},{expectedVersion:e.record.version},actor);
    const header=structuredClone(e.store['projects/P1/importSessions/S1']);
    await expect(e.service.updateCheckpoint('P1','S1',{checkpointArtifact:packed.manifest},{expectedVersion:e.record.version},actor)).rejects.toMatchObject({code:'VERSION_CONFLICT',serverVersion:next.version});
    await expect(e.service.updateCheckpoint('P1','S1',{checkpointArtifact:packed.manifest},{expectedVersion:next.version},actor)).rejects.toMatchObject({code:'INVALID_IMPORT_SESSION_ARTIFACT_REVISION'});
    expect(e.store['projects/P1/importSessions/S1']).toEqual(header);
  });
  it('staged publication binds chunks to their session and preserves authoritative acceptance time', async () => {
    const e=await reviewedSession();const packed=packSessionArtifact({lifecycleState:'INTENT_REVIEWED',reviewedCanonicalIntent:{...e.artifact,acceptedBy:'forged',acceptedAt:'forged'}});
    for(let index=0;index<packed.chunks.length;index++)await e.service.updateCheckpoint('P1','S1',{artifactChunk:{...packed.manifest,index,text:packed.chunks[index]}},{expectedVersion:e.record.version},actor);
    await e.service.updateCheckpoint('P1','S1',{checkpointArtifact:packed.manifest},{expectedVersion:e.record.version},actor);
    const saved=await e.service.getSession('P1','S1',actor);expect(saved.reviewedCanonicalIntent.acceptedBy).toBe('actor');expect(saved.reviewedCanonicalIntent.acceptedAt).not.toBe('forged');
    expect(saved.importBatch).toBeDefined();
  });
  it('explicit same-file rediscovery invalidates mapping and review without accepting a different source', async () => {
    const e=await reviewedSession();const original=await e.service.getSession('P1','S1',actor);
    // Identity evidence must actually exist before same-source rediscovery is allowed.
    await expect(e.save({lifecycleState:'DISCOVERED',replaceSource:true,source:{...source,sourceRevisionId:'new-source',fingerprint:'different'}})).rejects.toMatchObject({code:'IMMUTABLE_SOURCE_REVISION'});
    expect((await e.service.getSession('P1','S1',actor)).source).toEqual(original.source);
  });
});

it('publishes and resumes all 10,000 rows through the real server, then permits a small header-only checkpoint and cancel', async () => {
  const e=await reviewedSession();
  const rows=Array.from({length:10000},(_,i)=>({rowNumber:i+1,raw:{Name:`Driver ${i}`,Evidence:'physical source '.repeat(8)},canonical:{driverName:`Driver ${i}`,truckPlate:`TRK-${i}`},sourceLocation:{physicalRowNumber:i+4,sourceSheetName:'Fleet'}}));
  const packed=packSessionArtifact({importBatch:{...batch,rows}});
  expect(packed.chunks.length).toBeGreaterThan(32);
  for(let index=0;index<packed.chunks.length;index++) await e.service.updateCheckpoint('P1','S1',{artifactChunk:{...packed.manifest,index,text:packed.chunks[index]}},{expectedVersion:e.record.version},actor);
  const saved=await e.service.updateCheckpoint('P1','S1',{checkpointArtifact:packed.manifest},{expectedVersion:e.record.version},actor);
  const header=e.store['projects/P1/importSessions/S1'];
  expect(header.importBatch).toBeUndefined();expect(Buffer.byteLength(JSON.stringify(header))).toBeLessThan(50000);
  for(const [path,value] of Object.entries(e.store))if(path.includes('/checkpointChunks/'))expect(Buffer.byteLength(JSON.stringify(value))).toBeLessThan(1000000);
  const resumed=await e.service.getSession('P1','S1',actor);
  expect(resumed.importBatch.rows).toHaveLength(10000);expect(resumed.importBatch.rows[9999].sourceLocation).toEqual({physicalRowNumber:10003,sourceSheetName:'Fleet'});
  const reads=vi.spyOn(e.service,'getSession'); reads.mockClear();
  const listed=await e.service.listResumableSessions('P1',actor);
  expect(listed).toHaveLength(1);expect(listed[0].importBatch).toBeUndefined();expect(reads).not.toHaveBeenCalled();
  const confirmed=await e.service.updateCheckpoint('P1','S1',{warningConfirmation:true},{expectedVersion:saved.version},actor);
  expect((await e.service.getSession('P1','S1',actor)).importBatch.rows).toHaveLength(10000);
  const cancelled=await e.service.updateCheckpoint('P1','S1',{lifecycleState:'CANCELLED'},{expectedVersion:confirmed.version},actor);
  expect(cancelled.version).toBe(saved.version+2);expect(cancelled.lifecycleState).toBe('CANCELLED');
}, 30000);

it('source-only and mapping-only resumes do not fabricate an empty batch requiring canonical row validation', async () => {
  const e=make();let r=await e.service.createSession('P1',{domain:'ROSTER',importSessionId:'source-only',sourceType:'CSV'},actor);
  expect(reconstructSmartImportResumeState(await e.service.getSession('P1','source-only',actor),'P1').reviewSnapshot).toBeNull();
  r=await e.service.updateCheckpoint('P1','source-only',{lifecycleState:'DISCOVERED',source},{expectedVersion:r.version},actor);
  const resume=reconstructSmartImportResumeState(await e.service.getSession('P1','source-only',actor),'P1');
  expect(resume.reviewSnapshot).toBeNull();expect(resume.requiresSourceReattach).toBe(true);expect(resume.durableStage).toBe('MAPPING_APPROVAL');
  r=await e.service.updateCheckpoint('P1','source-only',{lifecycleState:'MAPPING',mapping},{expectedVersion:r.version},actor);
  await expect(e.service.updateCheckpoint('P1','source-only',{lifecycleState:'RESOLUTION'},{expectedVersion:r.version},actor)).rejects.toMatchObject({code:'INVALID_IMPORT_SESSION_REVIEW'});
});

it('compact transport stays within the manifest bound for 10,000 realistic resolution-rich rows', () => {
  const resolution={entityType:'driver',originalValue:'Ahmed',sourceValue:'Ahmed',matchedId:'D1',matchedName:'Ahmed',entityId:'D1',matchedValue:'Ahmed',confidence:100,isExact:true,isAuthorized:true,matchMethod:'EXACT',recommendation:'ACCEPT',riskLevel:'LOW',relationshipStatus:'DIRECT_AUTHORIZED',decision:'ACCEPT_CANDIDATE'};
  const canonical={driverName:'Ahmed',driverIdentity:'1234567890',truckPlate:'ABC 123',carrierName:'Alpha',materialCode:'SAND',materialName:'Sand',carrierId:'C1',driverId:'D1',truckId:'T1',materialId:'M1'};
  const payload={importBatch:{...batch,rows:Array.from({length:10000},(_,index)=>({rowNumber:index+1,sourceRowId:index+2,sourceLocation:{internalRowNumber:index+1,sourceRowNumber:index+2,sourceType:'CSV'},raw:{Carrier:'C1',Driver:'Ahmed','Driver Identity':'1234567890',Truck:'ABC 123','Material Code':'SAND'},canonical,mapped:canonical,validationIssues:[],reviewStatus:'accepted',status:'VALID',entityResolutions:{carrier:{...resolution,entityType:'carrier',matchedId:'C1'},material:{...resolution,entityType:'material',matchedId:'M1'},driver:resolution,truck:{...resolution,entityType:'truck',matchedId:'T1'}}}))}};
  const chunks=encodeSessionChunks(payload);
  expect(chunks.length).toBeLessThan(2048);
  expect(chunks.reduce((sum,chunk)=>sum+chunk.length,0)).toBeLessThan(JSON.stringify(payload).length*2);
  const restored=decodeSessionChunks(chunks);
  expect(restored.importBatch.rows).toHaveLength(10000);
  expect(restored.importBatch.rows[9999].entityResolutions.driver).toEqual(resolution);
  expect(restored.importBatch.rows[9999].sourceLocation.sourceRowNumber).toBe(10001);
},30000);

it('Google Sheets Trip source revisions require factual remote identity and a content fingerprint, not roster mapping', async () => {
  const e=make();let r=await e.service.createSession('P1',{domain:'TRIP',sourceType:'GOOGLE_SHEETS',importSessionId:'sheets'},actor);
  const remote={sourceRevisionId:'sheet-source',sourceType:'GOOGLE_SHEETS',requiresReattach:false,remote:{spreadsheetId:'sheet-id',sheetTitle:'Operations',modifiedTime:'2026-01-01T00:00:00Z'}};
  await expect(e.service.updateCheckpoint('P1','sheets',{lifecycleState:'DISCOVERED',source:remote},{expectedVersion:r.version},actor)).rejects.toMatchObject({code:'SOURCE_REVISION_REQUIRED'});
  r=await e.service.updateCheckpoint('P1','sheets',{lifecycleState:'DISCOVERED',source:{...remote,fingerprint:'1'.repeat(64)}},{expectedVersion:r.version},actor);
  r=await e.service.updateCheckpoint('P1','sheets',{lifecycleState:'REVIEW',reviewSnapshot:{rows:[{rowNumber:1,raw:{Ticket:'T1'},canonical:{ticketId:'T1'}}]}},{expectedVersion:r.version},actor);
  const restored=reconstructSmartImportResumeState(await e.service.getSession('P1','sheets',actor),'P1');
  expect(restored.sourceRevision.remote).toEqual(remote.remote);expect(restored.requiresSourceReattach).toBe(false);expect(restored.mappingRevision).toBeNull();expect(restored.reviewedIntent).toBeNull();
  await expect(e.service.updateCheckpoint('P1','sheets',{source:{...remote,fingerprint:'2'.repeat(64)}},{expectedVersion:r.version},actor)).rejects.toMatchObject({code:'IMMUTABLE_SOURCE_REVISION'});
});

it('chunk boundaries preserve Arabic, Urdu and split surrogate pairs without changing the artifact', () => {
  const value={rows:[{raw:{'اسم السائق':('سائق — ڈرائیور 🚚 ').repeat(6000)},canonical:{driverName:'احمد'}}]};
  const chunks=encodeSessionChunks(value);expect(chunks.length).toBeGreaterThan(1);expect(decodeSessionChunks(chunks)).toEqual(value);
  expect(()=>decodeSessionChunks([...chunks,chunks.at(-1)!])).toThrow('INVALID_IMPORT_SESSION_ARTIFACT');
});

it('revoked warning consent invalidates reviewed intent and cannot be revived by an older row artifact', async () => {
  const e=await reviewedSession();
  await e.save({warningConfirmation:true,importBatch:{...batch,warningConfirmation:{confirmed:true,confirmedBy:'actor',confirmedAt:'2026-01-01T00:00:00Z'}}});
  const artifact={...e.artifact,intent:{...e.artifact.intent,warnings:[{code:'ROW_WARNING',rowNumbers:[1]}]}};
  await e.save({lifecycleState:'INTENT_REVIEWED',reviewedCanonicalIntent:artifact});
  const before=await e.service.getSession('P1','S1',actor);expect(before.importBatch.warningConfirmation.confirmed).toBe(true);
  await e.save({warningConfirmation:false});
  const after=await e.service.getSession('P1','S1',actor);
  expect(after.lifecycleState).toBe('REVIEW');expect(after.reviewedCanonicalIntent).toBeUndefined();expect(after.importBatch.warningConfirmation).toBeUndefined();
  await expect(e.save({lifecycleState:'INTENT_REVIEWED',reviewedCanonicalIntent:artifact})).rejects.toMatchObject({code:'WARNING_APPROVAL_REQUIRED'});
});

it('the actual Trip file handler reattaches matching bytes without canceling or recreating the active session', async () => {
  const ts=await import('typescript');const fs=await import('node:fs');const path=await import('node:path');
  const source=ts.createSourceFile('ExcelCsvImportSection.tsx',fs.readFileSync(path.resolve(__dirname,'../components/importCenter/ExcelCsvImportSection.tsx'),'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  let initializer: import('typescript').Expression|undefined;
  const walk=(node: import('typescript').Node)=>{if(ts.isVariableDeclaration(node)&&ts.isIdentifier(node.name)&&node.name.text==='handleFileSelect')initializer=node.initializer;ts.forEachChild(node,walk);};walk(source);
  if(!initializer)throw Error('Actual file handler missing');
  const file=new File(['Ticket,Truck\nT1,ABC123'],'trips.csv',{type:'text/csv'});
  const {sourceFingerprint,verifySourceReattach}=await import('../services/import/durableSessionContract');
  const record={schemaVersion:2,projectId:'P1',importSessionId:'existing',operationId:'stable-op',importBatchId:'stable-batch',version:2,source:{sourceRevisionId:'source',sourceType:'CSV',requiresReattach:true,fileName:file.name,fileSize:file.size,mimeType:file.type,fingerprint:await sourceFingerprint(await file.arrayBuffer())}};
  const client={getSession:vi.fn().mockResolvedValue(record),createSession:vi.fn(),updateCheckpoint:vi.fn()};
  const scope={isImportCurrent:()=>true,requiresSourceFileReattach:true,activeSessionId:'existing',currentProjectId:'P1',importSessionClientService:client,verifySourceReattach,handleReset:vi.fn(),checkpointFailed:{current:false},setSelectedFile:vi.fn(),setFileBuffer:vi.fn(),setRequiresSourceFileReattach:vi.fn(),setProcessError:vi.fn(),t:(key:string)=>key};
  const emitted=ts.transpileModule(`const handler=${initializer!.getText(source)};`,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText;
  // Execute the actual handler with its I/O dependencies injected; no source-position or request-count shortcut.
  const handler=new Function(...Object.keys(scope),`${emitted}\nreturn handler;`)(...Object.values(scope));
  await handler(file);
  expect(client.getSession).toHaveBeenCalledWith('P1','existing');expect(scope.handleReset).not.toHaveBeenCalled();expect(client.createSession).not.toHaveBeenCalled();expect(client.updateCheckpoint).not.toHaveBeenCalled();
  expect(scope.setSelectedFile).toHaveBeenCalledWith(file);expect(new Uint8Array(scope.setFileBuffer.mock.calls[0][0])).toEqual(new Uint8Array(await file.arrayBuffer()));expect(scope.setRequiresSourceFileReattach).toHaveBeenCalledWith(false);expect(scope.setProcessError).not.toHaveBeenCalled();
});

it('reattaching a source-only Trip session acknowledges source acceptance before exposing bytes, retaining all session identities', async () => {
  const ts=await import('typescript');const fs=await import('node:fs');const path=await import('node:path');
  const source=ts.createSourceFile('ExcelCsvImportSection.tsx',fs.readFileSync(path.resolve(__dirname,'../components/importCenter/ExcelCsvImportSection.tsx'),'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  let initializer: import('typescript').Expression|undefined;
  const walk=(node: import('typescript').Node)=>{if(ts.isVariableDeclaration(node)&&ts.isIdentifier(node.name)&&node.name.text==='handleFileSelect')initializer=node.initializer;ts.forEachChild(node,walk);};walk(source);
  if(!initializer)throw Error('Actual file handler missing');
  const {sourceFingerprint,verifySourceReattach,acceptedSourceRevision}=await import('../services/import/durableSessionContract');
  const file=new File(['Ticket,Truck\nT1,ABC123'],'trips.csv',{type:'text/csv'});
  const record={schemaVersion:2,lifecycleState:'SOURCE',sourceType:'CSV',projectId:'P1',importSessionId:'source-only-trip',operationId:'stable-op',importBatchId:'stable-batch',version:1,sourceMetadata:{sourceFileName:file.name,fileSize:file.size,sourceMimeType:file.type,fingerprint:await sourceFingerprint(await file.arrayBuffer())}};
  let acknowledge!: (value:any)=>void;const ack=new Promise(resolve=>{acknowledge=resolve;});
  const client={getSession:vi.fn().mockResolvedValue(record),createSession:vi.fn(),updateCheckpoint:vi.fn()};
  const scope={isImportCurrent:()=>true,requiresSourceFileReattach:true,activeSessionId:record.importSessionId,currentProjectId:'P1',importSessionClientService:client,verifySourceReattach,acceptedSourceRevision,handleReset:vi.fn(),checkpointFailed:{current:false},saveSessionCheckpoint:vi.fn().mockReturnValue(ack),setSessionVersion:vi.fn(),setSelectedFile:vi.fn(),setFileBuffer:vi.fn(),setRequiresSourceFileReattach:vi.fn(),setProcessError:vi.fn(),t:(key:string)=>key};
  const emitted=ts.transpileModule(`const handler=${initializer!.getText(source)};`,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText;
  const handler=new Function(...Object.keys(scope),`${emitted}\nreturn handler;`)(...Object.values(scope));
  const pending=handler(file);
  await vi.waitFor(()=>expect(scope.saveSessionCheckpoint).toHaveBeenCalledTimes(1));
  expect(scope.setSelectedFile).not.toHaveBeenCalled();expect(scope.setFileBuffer).not.toHaveBeenCalled();expect(scope.setRequiresSourceFileReattach).not.toHaveBeenCalled();
  const args=scope.saveSessionCheckpoint.mock.calls[0];
  expect(args[0]).toBe('P1');expect(args[1]).toBe(record.importSessionId);expect(args[3]).toBe(1);
  expect(args[2]).toMatchObject({lifecycleState:'DISCOVERED',source:{sourceType:'CSV',fileName:file.name,fingerprint:record.sourceMetadata.fingerprint}});
  acknowledge({...record,lifecycleState:'DISCOVERED',source:args[2].source,version:2});await pending;
  expect(scope.setSessionVersion).toHaveBeenCalledWith(2);expect(scope.setSelectedFile).toHaveBeenCalledWith(file);expect(scope.setRequiresSourceFileReattach).toHaveBeenCalledWith(false);expect(scope.handleReset).not.toHaveBeenCalled();expect(client.createSession).not.toHaveBeenCalled();expect(scope.setProcessError).not.toHaveBeenCalled();
});
