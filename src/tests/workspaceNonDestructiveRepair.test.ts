import {describe,it,expect} from 'vitest';
import {blueprintFixture} from './helpers/workspaceBlueprintFixture';
import {planWorkbookRepair} from '../services/googleWorkspaceBlueprint/repair';
const workbook=()=>{const b=blueprintFixture();return {properties:b.properties,sheets:structuredClone(b.sheets),namedRanges:structuredClone(b.namedRanges)};};
const valueWrites=(requests:any[])=>requests.filter(r=>r.updateCells?.fields.split(',').includes('userEnteredValue'));
describe('non-destructive approved workbook repair',()=>{
 it('is a no-op for healthy structure and accepts populated input rows',()=>{
  const w=workbook();w.sheets[0].data![0].rowData![1].values![0]={userEnteredValue:{stringValue:'000001'}};
  w.sheets[1].data![0].rowData![1].values![10]={userEnteredValue:{stringValue:'Operator decision'}};
  expect(planWorkbookRepair(blueprintFixture(),w)).toEqual({requests:[],drift:[],conflicts:[]});
 });
 it('adds a missing operational tab without resetting existing tabs',()=>{
  const w=workbook();w.sheets.splice(2,1);const p=planWorkbookRepair(blueprintFixture(),w);
  expect(p.requests.filter(r=>r.addSheet)).toHaveLength(1);expect(p.requests.some(r=>r.deleteSheet)).toBe(false);expect(p.drift).toContain('MISSING_TAB:Offload Operations Audit');
 });
 it('maps a different sheetId by canonical title in cells and named ranges',()=>{
  const w=workbook();w.sheets[0].properties!.sheetId=999;w.sheets[0].data![0].rowData![0].values![0]={};w.namedRanges=[];
  const p=planWorkbookRepair(blueprintFixture(),w);expect(p.requests.some(r=>r.addSheet)).toBe(false);
  expect(p.requests.find(r=>r.updateCells)?.updateCells?.start?.sheetId).toBe(999);
  expect(p.requests.find(r=>r.addNamedRange)?.addNamedRange?.namedRange?.range?.sheetId).toBe(999);
 });
 it('recognizes a renamed tab only with canonical identity and matching nontrivial headers',()=>{
  const w=workbook();w.sheets[0].properties!.title='Renamed loading';
  const p=planWorkbookRepair(blueprintFixture(),w);expect(p.requests).toContainEqual({updateSheetProperties:{properties:{sheetId:100,title:'Loading Register'},fields:'title'}});
  expect(p.requests.some(r=>r.addSheet)).toBe(false);
 });
 it('does not overwrite an unrelated tab colliding with a blueprint sheetId',()=>{
  const w=workbook();w.sheets[0].properties!.title='Operator notes';w.sheets[0].data![0].rowData![0].values![0]={userEnteredValue:{stringValue:'Private notes'}};
  const p=planWorkbookRepair(blueprintFixture(),w),created=p.requests.find(r=>r.addSheet)?.addSheet?.properties;
  expect(created?.title).toBe('Loading Register');expect(created?.sheetId).not.toBe(100);
  expect(p.requests.some(r=>r.deleteSheet?.sheetId===100)).toBe(false);
 });
 it('restores a missing header using only explicitly addressed value cells',()=>{
  const w=workbook();w.sheets[0].data![0].rowData![0].values![0]={};
  const writes=valueWrites(planWorkbookRepair(blueprintFixture(),w).requests);
  expect(writes).toHaveLength(1);expect(writes[0].updateCells.start).toMatchObject({rowIndex:0,columnIndex:0});expect(writes[0].updateCells.rows[0].values).toHaveLength(1);
 });
 it('restores an empty formula cell while leaving source/review values outside writes',()=>{
  const w=workbook();w.sheets[0].data![0].rowData![1].values![19]={};w.sheets[0].data![0].rowData![1].values![0]={userEnteredValue:{stringValue:'0001'}};
  const writes=valueWrites(planWorkbookRepair(blueprintFixture(),w).requests);
  expect(writes).toHaveLength(1);expect(writes[0].updateCells.start).toMatchObject({rowIndex:1,columnIndex:19});expect(writes[0].updateCells.rows[0].values[0].userEnteredValue).toEqual({formulaValue:'=S2-R2'});
 });
 it('preserves operator text occupying a formula cell and requires review',()=>{
  const w=workbook();w.sheets[0].data![0].rowData![1].values![19]={userEnteredValue:{stringValue:'Keep this note'}};
  const p=planWorkbookRepair(blueprintFixture(),w);expect(p.conflicts).toContain('Loading Register:2:20');expect(valueWrites(p.requests)).toEqual([]);
 });
 it.each(['validation','format','named range','protection','conditional format','chart'] as const)('repairs missing %s without clearing data',kind=>{
  const b=blueprintFixture(),w=workbook();
  if(kind==='validation')b.sheets[0].data![0].rowData![1].values![0]={dataValidation:{condition:{type:'TEXT_NOT_CONTAINS',values:[{userEnteredValue:'!'}]},strict:true}};
  if(kind==='format')w.sheets[0].data![0].rowData![0].values![0].userEnteredFormat={};
  if(kind==='named range')w.namedRanges=[];
  if(kind==='protection')b.sheets[0].protectedRanges=[{range:{sheetId:100,startRowIndex:0,endRowIndex:1},warningOnly:true}];
  if(kind==='conditional format')b.sheets[0].conditionalFormats=[{ranges:[{sheetId:100}],booleanRule:{condition:{type:'BLANK'},format:{textFormat:{bold:true}}}}];
  if(kind==='chart')b.sheets[6].charts=[{spec:{title:'Canonical chart',basicChart:{chartType:'COLUMN'}},position:{newSheet:false}}];
  w.sheets[0].data![0].rowData![1].values![0]={userEnteredValue:{stringValue:'Keep me'}};
  const p=planWorkbookRepair(b,w);expect(p.requests.length).toBeGreaterThan(0);expect(p.conflicts).toEqual([]);
  expect(p.requests.some(r=>(r.updateCells?.fields||'').includes('*'))).toBe(false);expect(JSON.stringify(p.requests)).not.toContain('Keep me');
 });
 it('preserves all extra master tabs and non-empty default sheets',()=>{
  const w=workbook();w.sheets.push({properties:{sheetId:600,title:'الناقلين'}},{properties:{sheetId:601,title:'Sheet1'},data:[{rowData:[{values:[{userEnteredValue:{stringValue:'User data'}}]}]}]});
  expect(planWorkbookRepair(blueprintFixture(),w).requests).toEqual([]);
 });
 it('removes only the provably empty default Sheet1 and never shrinks expanded grids',()=>{
  const w=workbook();w.sheets.push({properties:{sheetId:0,title:'Sheet1'}});w.sheets[0].properties!.gridProperties!.rowCount=1000;
  const p=planWorkbookRepair(blueprintFixture(),w);expect(p.requests).toEqual([{deleteSheet:{sheetId:0}}]);
 });
});
