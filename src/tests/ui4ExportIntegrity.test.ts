import {afterEach, describe, expect, it, vi} from 'vitest';
import {createRequire} from 'node:module';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type {ReportDataset} from '../types/reports';
// Capture only the download boundary; all SheetJS serialization and parsing is real.
const xlsx = createRequire(import.meta.url)('xlsx') as typeof import('xlsx');
const capture = vi.hoisted(() => ({workbook: undefined as any, filename: ''}));
vi.mock('xlsx', async () => {
 const actual = createRequire(import.meta.url)('xlsx');
 return {...actual, writeFile: (wb: unknown, filename: string) => {capture.workbook=wb;capture.filename=filename;}};
});
import {reportsEngineService as engine} from '../services/reportsEngine.service';

function fixture(): ReportDataset {
 const dataset=engine.generateReport('DAILY_OPERATIONS',{projectId:'P1'},[]);
 dataset.titleAr='تقرير اختبار';
 dataset.columns=[{key:'id',labelAr:'الرحلة',labelEn:'Trip',format:'text'},{key:'text',labelAr:'نص',labelEn:'Text',format:'text'},{key:'empty',labelAr:'فارغ',labelEn:'Empty',format:'text'}];
 dataset.rows=[{id:'001',text:'الموقع الأول',empty:'',sourceType:'MANUAL',pricingSnapshotAt:'2026-11-01',destinationWeightSource:'DESTINATION_SCALE',settlementStatus:'Finalized'},
 {id:'002',text:'الموقع الثاني',empty:null,sourceType:'CSV',pricingSnapshotAt:'2026-11-02',destinationWeightSource:'ORIGIN_NET_ACCEPTED',settlementStatus:'Pending'}];
 return dataset;
}
// Independent CSV reader: SheetJS 0.18 normalizes CRLF even inside quoted CSV fields.
// Preserve every character here so parity detects line-ending changes, too.
function parseCSV(csv: string): string[][] {
 const result: string[][]=[];let row: string[]=[],value='',quoted=false;
 for(let i=1;i<csv.length;i++) {
  const ch=csv[i];
  if(ch==='"') {if(quoted&&csv[i+1]==='"'){value+='"';i++;}else quoted=!quoted;}
  else if(!quoted&&ch===','){row.push(value);value='';}
  else if(!quoted&&ch==='\r'&&csv[i+1]==='\n'){row.push(value);result.push(row);row=[];value='';i++;}
  else value+=ch;
 }
 expect(quoted).toBe(false);row.push(value);result.push(row);return result;
}
let artifactNumber=0;
function roundtrip(dataset:ReportDataset) {
 vi.stubGlobal('window',{});vi.stubGlobal('document',{});capture.workbook=undefined;
 engine.exportToXLSX(dataset);expect(capture.workbook).toBeDefined();
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ui4-rb1-'));
 try {
  const file=path.join(dir,'report.xlsx');fs.writeFileSync(file,xlsx.write(capture.workbook,{type:'buffer',bookType:'xlsx'}));
  expect(fs.readFileSync(file).subarray(0,2).toString()).toBe('PK');
  const wb=xlsx.readFile(file,{cellFormula:true});const ws=wb.Sheets[wb.SheetNames[0]];
  const csv=engine.exportDatasetToCSV(dataset);
  const csvRows=parseCSV(csv);
  const rows=xlsx.utils.sheet_to_json<string[]>(ws,{header:1,range:4,defval:'',raw:true});
  if(process.env.UI4_RB1_ARTIFACT_DIR) {
   const out=path.resolve(process.env.UI4_RB1_ARTIFACT_DIR);fs.mkdirSync(out,{recursive:true});
   const id=String(artifactNumber++).padStart(2,'0');fs.copyFileSync(file,path.join(out,id+'.xlsx'));
   fs.writeFileSync(path.join(out,id+'.csv'),csv);
   fs.writeFileSync(path.join(out,id+'.json'),JSON.stringify({rows,csvRows},null,2));
  }
  return {rows,csvRows,csv,ws,wb};
 } finally {fs.rmSync(dir,{recursive:true,force:true});}
}
afterEach(()=>vi.unstubAllGlobals());
describe('UI4-RB1 physical export integrity',()=>{
 for(const value of ['Origin\r\nGate A','Origin\nGate A','Origin\rGate A','ناقل، عربي, "مقتبس" و ""هروب""','=1+1','+SUM(A1:A2)','@SUM(A1:A2)','-1']) {
  it(`preserves two logical records and exact cells: ${JSON.stringify(value)}`,()=>{
   const d=fixture();d.rows.forEach(r=>r.text=value);const before=JSON.stringify(d);
   const {rows,csvRows,ws,csv}=roundtrip(d);
   expect(rows).toHaveLength(3);expect(rows).toEqual(csvRows);
   expect(rows.slice(1)).toEqual(d.rows.map(r=>[r.id,value,'',r.sourceType,r.pricingSnapshotAt,r.destinationWeightSource,r.settlementStatus]));
   expect(ws.B6.v).toBe(value);expect(ws.B7.v).toBe(value);expect(ws.B6.t).toBe('s');
   for(const cell of Object.values(ws))if(cell&&typeof cell==='object')expect(cell).not.toHaveProperty('f');
   expect(csv.startsWith('\uFEFF')).toBe(true);expect(JSON.stringify(d)).toBe(before);
  });
 }
 it('retains ordered traceability, metadata, RTL, widths and filename for ordinary reports',()=>{
  const {rows,csvRows,ws}=roundtrip(fixture());
  expect(rows).toEqual(csvRows);
  expect(rows[0]).toEqual(['الرحلة','نص','فارغ','مصدر العملية (Source Type)','تاريخ لقطة التسعير (Snapshot Date)','مصدر وزن المقصد (Dest Weight Source)','حالة التسوية (Settlement Status)']);
  expect(ws.A1.v).toBe('منظومة النقل اللوجستي - تقرير اختبار');expect(ws.A2.v).toMatch(/^تاريخ الإصدار:/);expect(ws.A3.v).toContain('SAR');expect(ws.A4).toBeUndefined();
  expect(capture.workbook.Sheets[capture.workbook.SheetNames[0]]['!views']).toEqual([{rightToLeft:true}]);
  expect(capture.workbook.Sheets[capture.workbook.SheetNames[0]]['!cols']).toEqual(Array(7).fill({wch:24}));
  expect(capture.filename).toMatch(/^تقرير_تقرير_اختبار_\d{4}-\d{2}-\d{2}\.xlsx$/);
 });
 it('escapes quotes and multiline headers as well as values',()=>{
  const d=fixture();d.columns[1].labelAr='نص, "عنوان"\r\nثان';
  const {rows,csvRows,csv}=roundtrip(d);expect(rows).toEqual(csvRows);expect(rows[0][1]).toBe(d.columns[1].labelAr);expect(csv).toContain('"نص, ""عنوان""\r\nثان"');
 });
 it('retains all supported legacy fallbacks without duplicating existing audit aliases',()=>{
  const d=fixture();d.rows=[{id:0,text:false,loadingDataSource:'API',snapshotDate:'2020-01-01',unloadDecision:'ACCEPT_ORIGIN_NET_AS_DESTINATION',isPending:true},{id:1,text:0,sourceTypeLabelAr:'مصدر',shiftDate:'2020-02-02',destinationWeightSourceLabelAr:'وزن',pricingStatusLabelAr:'حالة'}];
  let result=roundtrip(d);expect(result.rows).toEqual(result.csvRows);
  expect(result.rows.slice(1)).toEqual([['0','false','','API','2020-01-01','ORIGIN_NET_ACCEPTED','معلق التسوية (Pending)'],['1','0','','مصدر','2020-02-02','وزن','حالة']]);
  d.columns.push(...['sourceTypeLabelAr','snapshotDate','destinationWeightSourceLabelAr','pricingStatusLabelAr'].map(key=>({key,labelAr:key,labelEn:key,format:'text' as const})));
  result=roundtrip(d);expect(result.rows[0]).toHaveLength(7);expect(result.rows).toEqual(result.csvRows);
 });
 it('exports an empty dataset as headers with no report records',()=>{
  const d=fixture();d.rows=[];const {rows,csvRows}=roundtrip(d);expect(rows).toHaveLength(1);expect(rows).toEqual(csvRows);
 });
});
