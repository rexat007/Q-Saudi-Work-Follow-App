import { describe, it, expect, vi } from 'vitest';
import * as XLSX from 'xlsx';
import { RosterBatchReviewService as Review } from '../services/import/rosterBatchReview.service';
import { DriverTruckPipelineService as Pipeline } from '../services/import/driverTruckPipeline.service';
import { resolveCanonicalRoster } from '../services/import/canonicalResolution';
import { validateRosterMapping } from '../services/import/driverTruckImport';
import { buildRosterCanonicalIntent as build } from '../services/import/rosterCanonicalIntent.service';
import { UnifiedImportPipelineService } from '../services/import/unifiedImportPipeline.service';
import { GoogleSheetsImportParser } from '../services/import/googleSheetsParser.service';
import type { ImportRow, PipelineContext, UnifiedImportBatch } from '../types/unifiedImport';
import type { ImportResolutionEntity as Entity } from '../types/importResolution';
vi.mock('../firebase/config', () => ({ auth: { currentUser: null }, db: {} }));
function entity(kind: Entity['kind'], id: string, name: string, naturalKey: string): Entity {
  return { kind, id, name, naturalKey, globalStatus: 'ACTIVE', membershipStatus: 'ACTIVE', eligible: true, canReactivate: true, affiliation: kind === 'DRIVER' || kind === 'TRUCK' ? { carrierId: 'C1', status: 'ACTIVE' } : null, assignment: null, allocation: null };
}
const entities = () => [entity('CARRIER','C1','Carrier','1010123456'),entity('MATERIAL','M1','Sand','SAND-1'),entity('MATERIAL','M2','Sand','SAND-2'),entity('DRIVER','D1','Driver','1234567890'),entity('DRIVER','D2','Driver','2234567890'),entity('TRUCK','T1','ABC 123','ABC 123'),entity('TRUCK','T2','XYZ 456','XYZ 456')];
function context(es = entities()): PipelineContext { return { projectId: 'P1', userId: 'U', operationId: 'OP', resolutionContext: { projectId: 'P1', entities: es }, knownEntities: { materials: es.filter(e=>e.kind==='MATERIAL').map(e=>({materialId:e.id,name:e.name,code:e.naturalKey})) } }; }
function row(n = 1, canonical: Record<string, unknown> = {}): ImportRow { return { rowNumber: n, raw: structuredClone(canonical), canonical, mapped: {...canonical}, validationIssues: [], status: 'VALID', reviewStatus: 'accepted' }; }
function batch(rows: ImportRow[]): UnifiedImportBatch { return { projectId:'P1',importBatchId:'B',operationId:'OP',source:{sourceType:'CSV',importBatchId:'B'},rows,issues:[],currentStage:'REVIEW',commitStatus:'AWAITING_REVIEW',validationStatus:'PASSED',totalRows:rows.length,validRows:rows.length,errorRows:0,warningRows:0,requiresReviewRows:0,committedRows:0,createdBy:'U',createdAt:'2026-01-01',auditTrail:[] }; }
const source = { carrierName:'C1', driverIdentity:'1234567890', truckPlate:'ABC 123', materialCode:'SAND-1', materialName:'Sand' };
const keyCases = [
  ['carrier','commercialRegistrationNo','1010123456','1010123457','carrierName'],
  ['material','materialCode','SAND-1','SAND-2','materialName'],
  ['driver','driverIdentity','1234567890','2234567890','driverName'],
  ['truck','truckPlate','ABC 123','XYZ 456','truckName'],
] as const;
describe('SI-CG1 semantic identity grouping', () => {
  for (const [kind,field,a,b,label] of keyCases) {
    it(`${kind}: equal natural identities group; different identities never merge by name`,()=>{
      const rows=[row(1,{[field]:a,[label]:'Same'}),row(2,{[field]:a,[label]:'Same'}),row(3,{[field]:b,[label]:'Same'})];
      const groups=Review.getBatchReviewGroups(batch(rows))[kind]; expect(groups).toHaveLength(2); expect(groups[0].rowNumbers).toEqual([1,2]); expect(groups[1].rowNumbers).toEqual([3]);
    });
    it(`${kind}: rejected occurrence preserves history but adds no active evidence`,()=>{
      const active=row(1,{[field]:a,[label]:'Same'}), rejected={...row(2,{[field]:b,[label]:'Same'}),status:'REJECTED' as const};
      const input=batch([active,rejected]),copy=structuredClone(input), groups=Review.getBatchReviewGroups(input)[kind];
      expect(groups).toHaveLength(1);expect(groups[0].rowNumbers).toEqual([1]);expect(groups[0].occurrenceCount).toBe(1);expect(input).toEqual(copy);expect(Review.getGroupKey(rejected,kind)).toBe('');
    });
    it(`${kind}: selected canonical identity groups without names, but does not erase natural differences`,()=>{
      const rows=[row(1,{[label]:'One'}),row(2,{[label]:'Two'})];
      for (const r of rows) r.entityResolutions={[kind]:{entityType:kind.toUpperCase() as Entity['kind'],originalValue:'x',matchedId:'ID',confidence:1,isExact:true,recommendation:'ACCEPT',decision:'SELECT_ALTERNATE'}};
      expect(Review.getBatchReviewGroups(batch(rows))[kind]).toHaveLength(1);
      rows[0].canonical![field]=a;rows[1].canonical![field]=b;
      expect(Review.getBatchReviewGroups(batch(rows))[kind]).toHaveLength(2);
    });
  }
  it('unresolved Carrier problems remain distinct in Driver/Truck affiliation context',()=>{
    for(const kind of ['driver','truck'] as const){
      const a=row(1,{carrierName:'Alpha',driverIdentity:'1234567890',truckPlate:'ABC 123'}),b=row(2,{...a.canonical,carrierName:'Beta'});
      expect(Review.getGroupKey(a,kind)).not.toBe(Review.getGroupKey(b,kind));
    }
  });
  it('canonical ID-only resolutions remain visible as review groups',()=>{
    const r=row();r.entityResolutions={carrier:{entityType:'CARRIER',originalValue:'',matchedId:'C1',confidence:1,isExact:true,decision:'SELECT_ALTERNATE',recommendation:'ACCEPT'}};
    expect(Review.getBatchReviewGroups(batch([r])).carrier[0].normalizedSourceKey).toBe('carrier:canonical:C1');
  });
  it('normalizes code, CR, national identity and plate formatting deterministically',()=>{
    for(const [kind,field,a,b] of [['carrier','commercialRegistrationNo','١٠١٠١٢٣٤٥٦','1010123456'],['material','materialCode',' sand 1 ','SAND-1'],['driver','driverIdentity','١٢٣٤٥٦٧٨٩٠','1234567890'],['truck','truckPlate','أ ب ج ١٢٣٤','ا ب ج 1234']] as const) expect(Review.getGroupKey(row(1,{[field]:a}),kind)).toBe(Review.getGroupKey(row(2,{[field]:b}),kind));
  });
  it('different selected Material IDs do not collapse under one name',()=>{
    const rows=[row(1,{materialName:'Sand'}),row(2,{materialName:'Sand'})];
    rows.forEach((r,i)=>r.entityResolutions={material:{entityType:'MATERIAL',originalValue:'Sand',matchedId:`M${i+1}`,confidence:1,isExact:true,decision:'SELECT_ALTERNATE',recommendation:'ACCEPT'}});
    expect(Review.getBatchReviewGroups(batch(rows)).material).toHaveLength(2);
  });
  it('propagates only the current exact group, preserves rejected and stronger other identity, then recomputes',()=>{
    const rows=[row(1,source),row(2,source),row(3,{...source,materialCode:'SAND-2'}),{...row(4,source),status:'REJECTED' as const}];
    rows.forEach(r=>r.entityResolutions=resolveCanonicalRoster(r.canonical!,context())); const input=batch(rows), raw=structuredClone(rows.map(r=>r.raw));
    const changed=Pipeline.applyGroupedEntityResolutionDecision(input,'material',Review.getGroupKey(rows[0],'material'),'SELECT_ALTERNATE',{selectedEntityId:'M1'},context(),'U');
    expect(changed.rows.slice(0,2).map(r=>r.entityResolutions?.material.decision)).toEqual(['SELECT_ALTERNATE','SELECT_ALTERNATE']);expect(changed.rows[2].entityResolutions?.material.matchedId).toBe('M2');expect(changed.rows[3]).toEqual(rows[3]);expect(changed.rows.map(r=>r.raw)).toEqual(raw);expect(Review.getBatchReviewGroups(changed).material.map(g=>g.rowNumbers)).toEqual([[1,2],[3]]);
  });
  it('stale group rowNumbers cannot contribute creation defaults after identity divergence',()=>{
    const a=row(1,{driverName:'One',driverIdentity:'1234567890'}),b=row(2,{driverName:'Two',driverIdentity:'2234567890'});
    const group=Review.getBatchReviewGroups(batch([a])).driver[0];group.rowNumbers.push(2);
    expect(Review.deriveDriverCreationDefaults(batch([a,b]),group).residencyId).toBe('1234567890');
  });
  it('prepared plans with equal natural identity and contradictory attributes remain conflicts',()=>{
    const rows=[row(1,{driverName:'New',driverIdentity:'3234567890'}),row(2,{driverName:'New',driverIdentity:'3234567890'})];
    rows.forEach((r,i)=>r.entityResolutions={driver:{entityType:'DRIVER',originalValue:'New',confidence:1,isExact:false,recommendation:'ACCEPT',creationDisposition:'PREPARED_NEW',preparedDriverPlan:{driverName:'New',residencyId:'3234567890',carrierId:'C1',phone:i?'0509999999':'0501111111'}}});
    expect(Review.getBatchReviewGroups(batch(rows)).driver[0].status).toBe('CONFLICT');expect(build(batch(rows),context()).blockers.some(b=>b.code==='PREPARED_ENTITY_CONFLICT')).toBe(true);
  });
});
describe('SI-CG1 evidence precedence',()=>{
  it('unique Material code outranks shared name and fuzzy assistance',()=>{const r=resolveCanonicalRoster(source,context()).material;expect(r.matchedId).toBe('M1');expect(r.recommendation).toBe('ACCEPT');expect(r.resolutionReason).toBeUndefined()});
  it('contradictory Material name is blocked until explicit working-source correction, raw retained',()=>{
    const es=entities();es.find(e=>e.id==='M2')!.name='Clay';const ctx=context(es);const r=row(1,{...source,materialName:'Clay'});const raw=structuredClone(r.raw);
    r.entityResolutions=resolveCanonicalRoster(r.canonical!,ctx);expect(r.entityResolutions.material.resolutionReason).toBe('IDENTITY_AMBIGUITY');
    r.entityResolutions.material={...r.entityResolutions.material,decision:'SELECT_ALTERNATE',matchedId:'M2'};expect(resolveCanonicalRoster(r.canonical!,ctx,r.entityResolutions).material.matchedId).toBeUndefined();
    r.canonical={...r.canonical,materialCode:'SAND-2'};expect(resolveCanonicalRoster(r.canonical,ctx,r.entityResolutions).material.matchedId).toBe('M2');expect(r.raw).toEqual(raw);
  });
  it.each(['material','driver','truck'] as const)('%s alternate cannot erase unchanged natural identity',key=>{
    const id={material:'M2',driver:'D2',truck:'T2'}[key],r=resolveCanonicalRoster(source,context());r[key]={...r[key],matchedId:id,decision:'SELECT_ALTERNATE'};
    const next=resolveCanonicalRoster(source,context(),r)[key];expect(next.matchedId).toBeUndefined();expect(next.resolutionReason).toBe('IDENTITY_AMBIGUITY');expect(next.isAuthorized).toBe(false);
  });
  it.each(['CARRIER','MATERIAL','DRIVER','TRUCK'] as const)('%s duplicate natural identity cannot be hidden by name or explicit choice',kind=>{
    const es=entities(),a=es.find(e=>e.kind===kind)!;es.push({...a,id:'DUP',name:'Other'});const key=kind.toLowerCase();const value={...source,commercialRegistrationNo:'1010123456'};
    const r=resolveCanonicalRoster(value,context(es));expect(r[key].resolutionReason).toBe('CANONICAL_INTEGRITY_ERROR');r[key]={...r[key],matchedId:a.id,decision:'SELECT_ALTERNATE'};expect(resolveCanonicalRoster(value,context(es),r)[key].resolutionReason).toBe('CANONICAL_INTEGRITY_ERROR');
  });
  it.each(['carrier','material','driver'] as const)('%s unique name is a review suggestion, not automatic authority',key=>{
    const value={carrierName:'Carrier',materialName:'Sand',driverName:'Driver'};const es=entities().filter(e=>!['M2','D2'].includes(e.id));const r=resolveCanonicalRoster(value,context(es))[key];expect(r.matchedId).toBeDefined();expect(r.recommendation).toBe('REVIEW');expect(Review.determineGroupStatus(r)).toBe('REVIEW_REQUIRED');
  });
  it('leave-unresolved cannot conceal duplicate natural identity corruption or permit creation',()=>{
    const es=entities();es.push({...es.find(e=>e.id==='M1')!,id:'DUP'});
    const prior=resolveCanonicalRoster(source,context(es));
    prior.material={...prior.material,decision:'LEAVE_UNRESOLVED',candidates:[]};
    const r=resolveCanonicalRoster(source,context(es),prior).material;
    expect(r.resolutionReason).toBe('CANONICAL_INTEGRITY_ERROR');expect(r.candidates).toHaveLength(2);expect(r.matchedId).toBeUndefined();
  });
  it('fuzzy is only a candidate',()=>{const r=resolveCanonicalRoster({carrierName:'Carr'},context()).carrier;expect(r.matchedId).toBeUndefined();expect(r.matchMethod).toBe('FUZZY');expect(r.recommendation).toBe('REVIEW')});
  it.each(['INACTIVE','SUSPENDED','REMOVED','MEMBERSHIP_MISSING','AFFILIATION'] as const)('natural match does not waive %s',mode=>{
    const es=entities(),d=es.find(e=>e.id==='D1')!;if(mode==='INACTIVE')d.globalStatus='INACTIVE';else if(mode==='MEMBERSHIP_MISSING')d.membershipStatus=null;else if(mode==='AFFILIATION')d.affiliation={carrierId:'C2',status:'ACTIVE'};else d.membershipStatus=mode;
    const r=resolveCanonicalRoster(source,context(es)).driver;expect(r.matchedId).toBe('D1');expect(r.isAuthorized).toBe(false);expect(r.resolutionReason).toBeDefined();
  });
});
describe('SI-CG1 partial mapping and source provenance',()=>{
  it.each([{Carrier:'carrierName',ID:'driverIdentity'},{Carrier:'carrierName',Name:'driverName',ID:'driverIdentity'},{Carrier:'carrierName',Plate:'truckPlate'},{Carrier:'carrierName',ID:'driverIdentity',Plate:'truckPlate'}] as const)('accepts participation-only mapping %j',mapping=>expect(validateRosterMapping(Object.keys(mapping),mapping)).toBeNull());
  it('still requires Carrier plus a participant dimension',()=>{expect(validateRosterMapping(['ID'],{ID:'driverIdentity'})).toBe('MAPPING_REQUIRED');expect(validateRosterMapping(['Carrier','Material'],{Carrier:'carrierName',Material:'materialCode'})).toBe('MAPPING_REQUIRED')});
  it('absent Material yields no group, default, allocation or close',async()=>{
    const csv='Carrier,ID,Plate\nC1,1234567890,ABC 123';const result=await Pipeline.processFileToReview(csv,'r.csv',csv.length,undefined,context(),{headerRowIndex:0,customMappings:{Carrier:'carrierName',ID:'driverIdentity',Plate:'truckPlate'}});
    expect(result.rows[0].status).toBe('VALID');expect(Review.getBatchReviewGroups(result).material).toEqual([]);expect(result.rows[0].canonical?.materialName).toBe('');expect(result.rows[0].entityResolutions?.material).toBeUndefined();const intent=build(result,context());expect(intent.blockers).toEqual([]);expect(intent.assignmentIntents).toHaveLength(1);expect(intent.allocationIntents).toEqual([]);expect(JSON.stringify(intent)).not.toContain('CLOSE');
  });
  it.each(['csv','xls','xlsx'] as const)('%s actual source row 6 survives parser, grouping, intent, blockers and exclusions',async type=>{
    const grid=[['metadata'],['metadata'],['metadata'],['metadata'],['Carrier','ID','Plate','Material'],['C1','1234567890','ABC 123','SAND-1']];
    let input:string|ArrayBuffer;if(type==='csv')input=grid.map(r=>r.join(',')).join('\n');else{const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(grid),'Roster');input=XLSX.write(wb,{type:'array',bookType:type});}
    const result=await Pipeline.processFileToReview(input,`r.${type}`,typeof input==='string'?input.length:input.byteLength,undefined,context(),{sheetName:type==='csv'?undefined:'Roster',headerRowIndex:4,customMappings:{Carrier:'carrierName',ID:'driverIdentity',Plate:'truckPlate',Material:'materialCode'}});
    const r=result.rows[0];expect(r.raw._sourceRowIndex).toBe(6);expect(r.rowNumber).toBe(1);expect(r.sourceLocation).toMatchObject({sourceRowNumber:6,internalRowNumber:1,sourceType:type==='csv'?'CSV':'EXCEL'});
    expect(Review.getBatchReviewGroups(result).material[0].sourceRows[0]).toEqual(r.sourceLocation);const intent=build(result,context());expect(intent.assignmentIntents[0].rowNumbers).toEqual([1]);expect(intent.allocationIntents[0].rowNumbers).toEqual([1]);expect(intent.sourceRows.find(s=>s.internalRowNumber===1)?.sourceRowNumber).toBe(6);
    const blocked=Pipeline.revalidateRosterBatch({...result,rows:[{...r,canonical:{...r.canonical,materialCode:'UNKNOWN'}}]},context());expect(blocked.rows[0].validationIssues[0].sourceLocation?.sourceRowNumber).toBe(6);expect(build(blocked,context()).blockers[0].rowNumbers).toContain(1);expect(build(blocked,context()).sourceRows[0].sourceRowNumber).toBe(6);
    const excluded=build({...result,rows:[{...r,status:'REJECTED'}]},context());expect(excluded.rowDecisions[0].status).toBe('EXCLUDED');expect(excluded.sourceRows[0].sourceRowNumber).toBe(6);expect(excluded.assignmentIntents).toEqual([]);
  });
  it.each(['xls','xlsx'] as const)('%s leading empty worksheet range retains its real row offset',async type=>{
    const wb=XLSX.utils.book_new();const ws=XLSX.utils.aoa_to_sheet([[],[],[],[],['Carrier','ID'],['C1','1234567890']]);
    XLSX.utils.book_append_sheet(wb,ws,'Offset');const input=XLSX.write(wb,{type:'array',bookType:type});
    const b=await Pipeline.processFileToReview(input,`offset.${type}`,input.byteLength,undefined,context(),{sheetName:'Offset',headerRowIndex:0,customMappings:{Carrier:'carrierName',ID:'driverIdentity'}});
    expect(b.rows[0].sourceLocation).toMatchObject({sourceRowNumber:6,internalRowNumber:1,sourceSheetName:'Offset'});
  });
  it('CSV blank and quoted physical lines do not renumber source locations',async()=>{
    const csv='metadata\n\nCarrier,ID,Note\nC1,1234567890,"first\nsecond"\n\nC1,2234567890,last';
    const b=await Pipeline.processFileToReview(csv,'r.csv',csv.length,undefined,context(),{headerRowIndex:1,customMappings:{Carrier:'carrierName',ID:'driverIdentity'}});
    expect(b.rows.map(r=>r.sourceLocation?.sourceRowNumber)).toEqual([4,7]);expect(b.rows.map(r=>r.rowNumber)).toEqual([1,2]);
  });
  it('shared Google Sheets parser location survives without introducing a roster flow',async()=>{
    const source={sourceType:'GOOGLE_SHEETS' as const,importBatchId:'GS'},parser=new GoogleSheetsImportParser();const input={sheetName:'Selected',values:[['meta'],['meta'],['meta'],['meta'],['Carrier'],['C1']]};
    expect(parser.parse(source,input,{headerRowIndex:4}).rows[0]._sourceRowIndex).toBe(6);const pipeline=new UnifiedImportPipelineService({parser});const b=await pipeline.processThroughReview(pipeline.createBatch(source,context()),input,context(),{headerRowIndex:4});expect(b.rows[0].sourceLocation).toEqual({sourceType:'GOOGLE_SHEETS',sourceSheetName:'Selected',sourceRowNumber:6,internalRowNumber:1});
  });
  it('unknown parser position is not fabricated from internal row number',()=>{const intent=build(batch([row(1)]),context());expect(intent.sourceRows[0]).toEqual({sourceType:'CSV',internalRowNumber:1,sourceSheetName:undefined});expect(intent.sourceRows[0].sourceRowNumber).toBeUndefined()});
  it('factual source location changes invalidate the local reviewed signature',()=>{
    const r=row(1,source);r.entityResolutions=resolveCanonicalRoster(source,context());
    r.sourceLocation={sourceType:'CSV',internalRowNumber:1,sourceRowNumber:6};
    const old=build(batch([r]),context()).signature;
    r.sourceLocation={...r.sourceLocation,sourceRowNumber:7};
    expect(build(batch([r]),context()).signature).not.toBe(old);
  });

});
