import {it, expect} from 'vitest';
import {DriverTruckPipelineService as Pipeline} from '../services/import/driverTruckPipeline.service';
import {reconcileRosterResumeStage} from '../services/import/rosterResumeJourney';
import {bindRosterMaterial} from '../services/import/rosterMaterialBinding';
import {prepareDurableBatch} from '../services/import/durableSessionContract';
import {canAcceptRosterIntent} from '../services/import/rosterCanonicalIntent.service';
import {intentIssueKey} from '../components/import/RosterSemanticReview';
import {enTranslations} from '../locales/en';
import {arTranslations} from '../locales/ar';
import {urTranslations} from '../locales/ur';

function fixture() {
  const entity = (kind:string,id:string,naturalKey:string):any => ({kind,id,name:id,naturalKey,globalStatus:'ACTIVE',membershipStatus:'ACTIVE',eligible:true,affiliation:kind==='DRIVER'||kind==='TRUCK'?{carrierId:'C1',status:'ACTIVE'}:null,...(kind==='DRIVER'?{assignment:null}:kind==='TRUCK'?{assignment:null,allocation:null}:{})});
  const entities=[entity('CARRIER','C1','1010123456'),entity('MATERIAL','M1','WHEAT'),entity('DRIVER','D1','1234567890'),entity('TRUCK','T1','ABC123')];
  const context:any={projectId:'P1',userId:'actor',operationId:'O1',resolutionContext:{projectId:'P1',entities}};
  const raw:any={projectId:'P1',importBatchId:'B1',operationId:'O1',source:{sourceType:'CSV',sourceFileName:'same.csv'},metadata:{canonicalPrerequisites:[{projectId:'P1',key:'DRIVER:D1',action:'ENROLL',completed:true,rowNumbers:[1]}],bulkProgress:{completed:['D1']}},rows:[{rowNumber:1,status:'VALID',raw:{Driver:'D1'},canonical:{carrierId:'C1',driverName:'D1',driverIdentity:'1234567890',truckPlate:'ABC123'},validationIssues:[]}],issues:[],auditTrail:[]};
  const batch=Pipeline.revalidateRosterBatch(bindRosterMaterial(raw,entities[1]),context);
  expect(batch.metadata!.canonicalIntent!.blockers).toEqual([]);
  return {batch,context,entities};
}
it('historical Driver/Truck resume routes to Material while preserving all persisted identities, decisions, receipts and progress',()=>{
  const {batch,context}=fixture();delete batch.metadata!.batchMaterialBinding;
  const saved={importSessionId:'S1',source:{sourceRevisionId:'SRC',fingerprint:'fingerprint'},mapping:{mappingRevisionId:'MAP'},importBatch:prepareDurableBatch(batch)};
  const before=structuredClone(saved),fresh=Pipeline.revalidateRosterBatch(saved.importBatch,context);
  expect(reconcileRosterResumeStage('DRIVER_TRUCK_RESOLUTION',fresh)).toBe('MATERIAL_RESOLUTION');
  expect(saved).toEqual(before);expect(fresh.importBatchId).toBe('B1');expect(fresh.operationId).toBe('O1');
  for(const key of ['carrier','driver','truck'])expect(fresh.rows[0].entityResolutions![key].matchedId).toBe(batch.rows[0].entityResolutions![key].matchedId);
  expect(fresh.metadata!.canonicalPrerequisites).toEqual(batch.metadata!.canonicalPrerequisites);expect(fresh.metadata!.bulkProgress).toEqual(batch.metadata!.bulkProgress);
});
it.each([null,'SUSPENDED','REMOVED'])('fresh Driver membership %s routes to Driver/Truck with the exact actionable reason',membershipStatus=>{
  const {batch,context,entities}=fixture();entities[2].membershipStatus=membershipStatus;
  const fresh=Pipeline.revalidateRosterBatch(batch,context),code=membershipStatus===null?'MEMBERSHIP_MISSING':'MEMBERSHIP_STATE_CONFLICT';
  expect(reconcileRosterResumeStage('FINAL_REVIEW',fresh)).toBe('DRIVER_TRUCK_RESOLUTION');
  expect(fresh.metadata!.canonicalIntent!.blockers.map(b=>b.code)).toContain(code);
  expect(intentIssueKey(code)).toBe(membershipStatus===null?'import.resolution.missing':'import.resolution.membership');
  expect(fresh.metadata!.batchMaterialBinding).toEqual(batch.metadata!.batchMaterialBinding);
});
it.each(['driver','truck'])('fresh %s affiliation drift remains in Driver/Truck and blocks acceptance',kind=>{
  const {batch,context,entities}=fixture();entities.find(e=>e.kind===kind.toUpperCase())!.affiliation=null;
  const fresh=Pipeline.revalidateRosterBatch(batch,context);expect(reconcileRosterResumeStage('FINAL_REVIEW',fresh)).toBe('DRIVER_TRUCK_RESOLUTION');
  expect(fresh.metadata!.canonicalIntent!.blockers.map(b=>b.code)).toContain('AFFILIATION_CONFLICT');expect(canAcceptRosterIntent(fresh.metadata!.canonicalIntent!)).toBe(false);
});
it('Carrier invalidity takes precedence over simultaneous Material drift without changing either gate',()=>{
  const {batch,context,entities}=fixture();entities[0].membershipStatus='SUSPENDED';delete batch.metadata!.batchMaterialBinding;
  expect(reconcileRosterResumeStage('FINAL_REVIEW',Pipeline.revalidateRosterBatch(batch,context))).toBe('CARRIER_RESOLUTION');
});
it.each(['CARRIER_RESOLUTION','MATERIAL_RESOLUTION','DRIVER_TRUCK_RESOLUTION','FINAL_REVIEW'] as const)('fully valid fresh snapshot preserves legitimate saved %s without auto-advancing',stage=>{
  const {batch,context}=fixture(),fresh=Pipeline.revalidateRosterBatch(batch,context);expect(reconcileRosterResumeStage(stage,fresh)).toBe(stage);expect(canAcceptRosterIntent(fresh.metadata!.canonicalIntent!)).toBe(true);
});
it('global Material ineligibility invalidates a previously confirmed binding and routes back to Material',()=>{
  const {batch,context,entities}=fixture();entities[1].globalStatus='INACTIVE';const fresh=Pipeline.revalidateRosterBatch(batch,context);
  expect(reconcileRosterResumeStage('DRIVER_TRUCK_RESOLUTION',fresh)).toBe('MATERIAL_RESOLUTION');expect(canAcceptRosterIntent(fresh.metadata!.canonicalIntent!)).toBe(false);
});
it.each(['CROSS_ROW_DRIVER_TRUCK_CONFLICT','PREPARED_ENTITY_CONFLICT','RELATIONSHIP_CONTEXT_UNAVAILABLE','CANONICAL_INTEGRITY_ERROR'])('remaining canonical blocker %s returns Final Review to the responsible correction layer',code=>{
  const {batch}=fixture();const intent={...batch.metadata!.canonicalIntent!,blockers:[{code,rowNumbers:[1]}]};
  expect(reconcileRosterResumeStage('FINAL_REVIEW',batch,intent)).toBe('DRIVER_TRUCK_RESOLUTION');expect(canAcceptRosterIntent(intent)).toBe(false);
});
it('cross-row Material conflict routes to Material, while terminal execution presentation stays untouched',()=>{
  const {batch}=fixture();const intent={...batch.metadata!.canonicalIntent!,blockers:[{code:'CROSS_ROW_TRUCK_MATERIAL_CONFLICT',rowNumbers:[1,2]}]};
  expect(reconcileRosterResumeStage('FINAL_REVIEW',batch,intent)).toBe('MATERIAL_RESOLUTION');expect(reconcileRosterResumeStage('COMMIT_RESULT',batch,intent)).toBe('COMMIT_RESULT');
});
it.each([
  ['UNRESOLVED_MATERIAL','projects.batch4.material_rows_pending'],['MEMBERSHIP_MISSING','import.resolution.missing'],
  ['MEMBERSHIP_STATE_CONFLICT','import.resolution.membership'],['AFFILIATION_CONFLICT','import.resolution.affiliationConflict'],
  ['RELATIONSHIP_CONTEXT_UNAVAILABLE','import.resolution.context'],['CANONICAL_INTEGRITY_ERROR','import.resolution.integrity'],['CROSS_ROW_DRIVER_TRUCK_CONFLICT','intent.error.crossRow'],
])('blocker %s consumes its specific canonical presentation key across AR/EN/UR', (code,key)=>{
  expect(intentIssueKey(code)).toBe(key);for(const locale of [arTranslations,enTranslations,urTranslations])expect(typeof locale[key]==='string'&&locale[key].trim().length>0).toBe(true);
});
it('unknown raw errors remain bounded and never become a translated key or exposed message',()=>{expect(intentIssueKey('private provider response')).toBe('intent.error.canonical');});
