import {describe,it,expect} from 'vitest';
import {createHash} from 'node:crypto';
import provenance from '../services/googleWorkspaceBlueprint/provenance.json';
import {activeWorkspaceBlueprint} from '../services/googleWorkspaceBlueprint/sabilHailV1';
import {assertBlueprint,blueprintRequests,verifyBlueprintWorkbook,cellEntries,blueprintRequestBatches} from '../services/googleWorkspaceBlueprint/contract';
import {canonicalBlueprintJson} from '../services/googleWorkspaceBlueprint/capture';
const b=activeWorkspaceBlueprint();
const at=(tab:string,row:number,col:number)=>cellEntries(b.sheets.find(s=>s.properties!.title===tab)!).find(c=>c.row===row-1&&c.column===col-1)?.cell;
/** Interprets the generated Google mutation requests into a fresh target, rather than
 * accepting the source asset as the round-trip result. No formula engine / live claim. */
function generated(){
 const target:any={properties:structuredClone(b.properties),sheets:[],namedRanges:[]};
 for(const r of blueprintRequests(b,{sheets:[]})){
  if(r.addSheet)target.sheets.push({properties:structuredClone(r.addSheet.properties),data:[{rowData:[],rowMetadata:[],columnMetadata:[]}],merges:[],conditionalFormats:[]});
  else if(r.updateCells){const q=r.updateCells,s=target.sheets.find((s:any)=>s.properties.sheetId===q.start!.sheetId),d=s.data[0];for(const [i,row] of q.rows!.entries())d.rowData[q.start!.rowIndex!+i]=structuredClone(row);}
  else if(r.updateDimensionProperties){const q=r.updateDimensionProperties,s=target.sheets.find((s:any)=>s.properties.sheetId===q.range!.sheetId),field=q.range!.dimension==='ROWS'?'rowMetadata':'columnMetadata';for(let i=q.range!.startIndex!;i<q.range!.endIndex!;i++)s.data[0][field][i]=structuredClone(q.properties);}
  else if(r.mergeCells)target.sheets.find((s:any)=>s.properties.sheetId===r.mergeCells!.range!.sheetId).merges.push(structuredClone(r.mergeCells.range));
  else if(r.addConditionalFormatRule){const q=r.addConditionalFormatRule;target.sheets.find((s:any)=>s.properties.sheetId===q.rule!.ranges![0].sheetId).conditionalFormats.splice(q.index,0,structuredClone(q.rule));}
  else if(r.setBasicFilter)target.sheets.find((s:any)=>s.properties.sheetId===r.setBasicFilter!.filter!.range!.sheetId).basicFilter=structuredClone(r.setBasicFilter.filter);
  else if(r.addBanding){const s=target.sheets.find((s:any)=>s.properties.sheetId===r.addBanding!.bandedRange!.range!.sheetId);(s.bandedRanges||=[]).push(structuredClone(r.addBanding.bandedRange));}
  else if(r.addNamedRange)target.namedRanges.push(structuredClone(r.addNamedRange.namedRange));
  else throw Error('Unhandled generated request '+Object.keys(r));
 }
 return target;
}
describe('real local SABIL source release',()=>{
 it('is approved with seven real sheets and ten actual script/manifest files',()=>{expect(()=>assertBlueprint(b)).not.toThrow();expect(b.sheets).toHaveLength(7);expect(b.sheets.reduce((n,s)=>n+(s.bandedRanges?.length||0),0)).toBe(3);expect(b.script!.files).toHaveLength(10);expect(b.script!.functions.filter(f=>f.kind==='SIMPLE_TRIGGER').map(f=>f.name)).toEqual(['onEdit','onOpen']);});
 it('round trips all generated structural requests through an independent target',()=>{const target=generated();expect(()=>verifyBlueprintWorkbook(b,target)).not.toThrow();target.sheets[0].data[0].rowData[1].values[19].userEnteredValue.formulaValue='=0';expect(()=>verifyBlueprintWorkbook(b,target)).toThrow('WORKSPACE_STRUCTURE_INVALID');});
 it('seeds exactly 297 usable rows in both input sheets without historical inputs',()=>{for(const sheet of b.sheets.slice(0,2)){expect(sheet.properties!.gridProperties!.rowCount).toBe(298);const fs=cellEntries(sheet).filter(c=>c.cell.userEnteredValue?.formulaValue);expect(new Set(fs.map(c=>c.row)).size).toBe(297);expect(Math.max(...fs.map(c=>c.row))).toBe(297);}expect(at('Loading Register',2,17)?.userEnteredValue).toBeUndefined();});
 it('preserves formula ownership/correlation and removes Excel namespace plus bounded source lookups',()=>{expect(at('Loading Register',2,20)?.userEnteredValue?.formulaValue).toBe('=S2-R2');expect(at('Offload Data',2,8)?.userEnteredValue?.formulaValue).toBe('=B2');expect(at('Loading Register',298,14)?.userEnteredValue?.formulaValue).toContain('UPPER(TRIM(O298))');expect(at('Loading Register',2,8)?.userEnteredValue?.formulaValue).toContain('XLOOKUP');expect(JSON.stringify(b)).not.toMatch(/_xlfn\.|IMPORTRANGE|https:\/\/docs.google.com/);});
 it('initializes report totals to zero and removes historical report controls/timestamps',()=>{expect(at('Carrier Report Viewer',8,1)?.userEnteredValue).toEqual({numberValue:0});expect(at('Carrier Report Viewer',11,1)?.userEnteredValue).toBeUndefined();expect(at('Carrier Report Viewer',3,2)?.userEnteredValue).toBeUndefined();expect(at('Daily Summary',3,2)?.userEnteredValue).toBeUndefined();expect(at('Offload Operations Audit',2,2)?.userEnteredValue).toBeUndefined();expect(at('Dashboard',5,21)?.userEnteredValue).toEqual({numberValue:0});expect(at('Dashboard',11,21)?.userEnteredValue).toBeUndefined();expect(JSON.stringify(b)).not.toMatch(/Q AL-DREES|Q AL-HABBAS|19277\.98|13006\.73/);});
 it('retains reviewed validation and zero installable trigger dependency',()=>{expect(at('Offload Data',2,10)?.dataValidation?.condition?.values?.map(v=>v.userEnteredValue)).toEqual(['Ali Hadi','Abbass Abdelhalim']);expect(b.script!.files.find(f=>f.type==='JSON')!.source).not.toMatch(/script\.scriptapp|\/auth\/drive|external_request/);expect(b.script!.triggerModel).toBe('SIMPLE_ONLY');});
 it('batches large real assets within API request limits',()=>{const batches=blueprintRequestBatches(blueprintRequests(b,{sheets:[]}));expect(batches.length).toBeGreaterThan(1);for(const batch of batches){expect(batch.length).toBeLessThanOrEqual(100);expect(Buffer.byteLength(JSON.stringify(batch))).toBeLessThan(1100000);}});
 it('has deterministic normalized source digests',()=>{const hash=(v:unknown)=>createHash('sha256').update(canonicalBlueprintJson(v)).digest('hex');expect(hash(b)).toBe(hash(structuredClone(b)));expect(hash(b)).toBe(provenance.workspaceBlueprintSha256);expect(hash(b.script!.files)).toBe(provenance.appsScriptBlueprintSha256);});
});
