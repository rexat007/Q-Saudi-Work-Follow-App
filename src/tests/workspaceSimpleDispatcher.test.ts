import {describe,it,expect,vi} from 'vitest';
import vm from 'node:vm';
import {activeWorkspaceBlueprint} from '../services/googleWorkspaceBlueprint/sabilHailV1';
const scripts=activeWorkspaceBlueprint().script!.files.filter(f=>f.type==='SERVER_JS').map(f=>f.source).join('\n');
function context(){
 const c:any=vm.createContext({Date,console:{log:vi.fn(),warn:vi.fn(),error:vi.fn()},LockService:{getDocumentLock:()=>({tryLock:()=>true,releaseLock:vi.fn()})}});
 vm.runInContext(scripts,c);return c;
}
function event(name:string,row=2,col=2,rows=1,cols=1,lastRow=298){
 const parent={getSheetByName:()=>({getLastRow:()=>lastRow})};const sheet={getName:()=>name,getParent:()=>parent};
 return {range:{getSheet:()=>sheet,getRow:()=>row,getColumn:()=>col,getNumRows:()=>rows,getNumColumns:()=>cols}};
}
function routed(){const c=context(),calls:string[]=[];for(const n of ['sabilReviewWorkflowEdited','refreshCarrierReportViewer','offloadAuditRefresh_','refreshCarrierDailyReport','refreshOffloadDashboardSummary']) c[n]=vi.fn(()=>calls.push(n));return {c,calls};}
describe('actual SABIL simple dispatcher',()=>{
 it.each([[3],[4],[5]])('viewer B%s refreshes only viewer',row=>{const {c,calls}=routed();c.onEdit(event('Carrier Report Viewer',row,2));expect(calls).toEqual(['refreshCarrierReportViewer']);});
 it('Loading operational edit runs audit then ledger then dependent dashboard once',()=>{const {c,calls}=routed();c.onEdit(event('Loading Register'));expect(calls).toEqual(['offloadAuditRefresh_','refreshCarrierDailyReport','refreshOffloadDashboardSummary']);expect(c.refreshCarrierDailyReport).toHaveBeenCalledWith({maxOutputRows:5000});});
 it('Offload input and reviewer edit preserve review-first ordering',()=>{for(const col of [2,10]){const {c,calls}=routed();c.onEdit(event('Offload Data',2,col));expect(calls).toEqual(['sabilReviewWorkflowEdited','offloadAuditRefresh_','refreshCarrierDailyReport','refreshOffloadDashboardSummary']);}});
 it('irrelevant sheets, headers, formula columns and viewer controls outside B3:B5 do no work',()=>{for(const e of [event('Dashboard'),event('Loading Register',1,1),event('Loading Register',3,20),event('Offload Data',2,13),event('Carrier Report Viewer',7,2),event('Carrier Report Viewer',4,3)]){const {c,calls}=routed();c.onEdit(e);expect(calls).toEqual([]);}});
 it('multi-cell edits do not invent reviewer decisions but do refresh affected reports',()=>{const {c,calls}=routed();c.onEdit(event('Offload Data',2,2,5,10));expect(calls).toEqual(['offloadAuditRefresh_','refreshCarrierDailyReport','refreshOffloadDashboardSummary']);});
 it('failed audit prevents stale dashboard refresh without undoing source edit',()=>{const {c,calls}=routed();c.offloadAuditRefresh_=()=>{throw Error('offline')};c.onEdit(event('Loading Register'));expect(calls).toEqual(['refreshCarrierDailyReport']);expect(c.console.error).toHaveBeenCalled();});
 it('ledger failure does not hide successful audit/dashboard refresh',()=>{const {c,calls}=routed();c.refreshCarrierDailyReport=()=>{throw Error('output limit')};c.onEdit(event('Loading Register'));expect(calls).toEqual(['offloadAuditRefresh_','refreshOffloadDashboardSummary']);});
 it('oversized automatic input stops reporting; manual commands remain available',()=>{const {c,calls}=routed();c.onEdit(event('Loading Register',2,2,1,1,2001));expect(calls).toEqual([]);expect(c.console.warn).toHaveBeenCalled();});
 it('busy lock performs no overlapping work',()=>{const {c,calls}=routed();c.LockService.getDocumentLock=()=>({tryLock:()=>false});c.onEdit(event('Loading Register'));expect(calls).toEqual([]);});
 it('onOpen creates only the original two menus',()=>{const c=context(),names:string[]=[];c.SpreadsheetApp={getUi:()=>({createMenu:(n:string)=>{names.push(n);return {addItem(){return this},addToUi(){}}}})};c.onOpen();expect(names).toEqual(['Carrier Reports','Truck Operations']);});
 it('contains no trigger management or forbidden authorization service',()=>{expect(scripts).not.toMatch(/ScriptApp\.(newTrigger|getProjectTriggers|deleteTrigger)|DriveApp|UrlFetchApp|openById\(|openByUrl\(/);expect(activeWorkspaceBlueprint().script?.triggerModel).toBe('SIMPLE_ONLY');});
});
function reviewRow(values:Record<number,any>){
 const c=context();const notes:string[]=[];const sheet:any={getName:()=> 'Offload Data',getRange:(_r:number,col:number)=>({getDisplayValue:()=>String(values[col]??''),getValue:()=>values[col]??'',setValue:(v:any)=>{values[col]=v;return sheet.getRange(2,col)},clearContent:()=>{delete values[col]},setNote:(n:string)=>notes.push(n),clearNote:()=>{},setNumberFormat:()=>{}})};
 c.SpreadsheetApp={getActiveSpreadsheet:()=>({toast:vi.fn()})};const edit=(col:number)=>c.sabilReviewWorkflowEdited({range:{getSheet:()=>sheet,getRow:()=>2,getColumn:()=>col,getNumRows:()=>1,getNumColumns:()=>1}});return {edit,notes};
}
describe('unchanged canonical review behavior through normal handler',()=>{
 it('unreviewed linked input edit becomes Hold without timestamps',()=>{const v:any={7:'SERIES|001'};reviewRow(v).edit(2);expect(v[12]).toBe('Hold');expect(v[11]).toBeUndefined();});
 it('valid reviewer selection records Approved and timestamp',()=>{const v:any={7:'S|1',10:'Ali Hadi',2:new Date('2026-10-31T08:00:00Z'),8:new Date('2026-10-31T09:00:00Z'),3:new Date('2026-10-31T10:00:00Z'),4:25,5:'Destination',9:'R1',17:'Ready',15:new Date('2026-10-31T07:00:00Z'),16:25};reviewRow(v).edit(10);expect(v[12]).toBe('Approved');expect(v[11]).toBeInstanceOf(Date);});
 it('invalid chronology blocks approval with reason and clears reviewer',()=>{const v:any={7:'S|1',10:'Ali Hadi',12:'Hold'};const r=reviewRow(v);r.edit(10);expect(v[12]).toBe('Hold');expect(v[10]).toBeUndefined();expect(v[11]).toBeUndefined();expect(r.notes.join()).toContain('Missing or invalid timestamps');});
 it('unknown reviewer cannot approve',()=>{const v:any={7:'S|1',10:'Other'};reviewRow(v).edit(10);expect(v[10]).toBeUndefined();expect(v[12]).not.toBe('Approved');});
});
function memorySheet(name:string,initial:any[][]=[]){
 const cells=new Map<string,any>();initial.forEach((r,i)=>r.forEach((v,j)=>cells.set(`${i+1}:${j+1}`,v)));
 const sheet:any={getName:()=>name,getLastRow:()=>Math.max(1,...[...cells.entries()].filter(([,v])=>v!=='').map(([k])=>+k.split(':')[0])),getMaxRows:()=>298,getMaxColumns:()=>29,getFilter:()=>null,clear:()=>{cells.clear();return sheet},setFrozenRows:()=>{},setRowHeight:()=>{},setColumnWidth:()=>{}};
 sheet.getRange=(a:any,b?:number,nr=1,nc=1)=>{let row:number,col:number;
  if(typeof a==='string'){const m=a.match(/^([A-Z]+)(\d+)(?::([A-Z]+)(\d+))?$/)!;const cn=(s:string)=>[...s].reduce((n,c)=>n*26+c.charCodeAt(0)-64,0);row=+m[2];col=cn(m[1]);nr=m[4]?+m[4]-row+1:1;nc=m[3]?cn(m[3])-col+1:1;}else{row=a;col=b!;}
  const read=()=>Array.from({length:nr},(_,i)=>Array.from({length:nc},(_,j)=>cells.get(`${row+i}:${col+j}`)??''));
  const range:any={getValues:read,getDisplayValues:()=>read().map(r=>r.map(v=>String(v))),getValue:()=>read()[0][0],getDisplayValue:()=>String(read()[0][0]),getFormulas:()=>read().map(r=>r.map(()=>'')),setValues:(v:any[][])=>{v.forEach((r,i)=>r.forEach((x,j)=>cells.set(`${row+i}:${col+j}`,x)));return range},setValue:(v:any)=>{cells.set(`${row}:${col}`,v);return range},clearContent:()=>{for(let i=0;i<nr;i++)for(let j=0;j<nc;j++)cells.delete(`${row+i}:${col+j}`);return range},isPartOfMerge:()=>false};
  for(const n of ['breakApart','merge','clearFormat','setFontColor','setFontWeight','setFontSize','setBackground','setNumberFormat','setWrap','createFilter','clearDataValidations','setDataValidation'])range[n]=()=>range;
  return range;
 };sheet.getDataRange=()=>sheet.getRange(1,1,sheet.getLastRow(),29);return {sheet,cells};
}
it('actual empty-source audit, ledger, viewer and dashboard refreshes preserve source cells and produce zero reports',()=>{
 const c=context();const tabs=Object.fromEntries(['Loading Register','Offload Data','Offload Operations Audit','Carrier Daily Report','Carrier Report Viewer','Dashboard'].map(n=>[n,memorySheet(n)]));
 const before=[...tabs['Loading Register'].cells];
 const ss={getSheetByName:(n:string)=>tabs[n]?.sheet,getSpreadsheetTimeZone:()=> 'Asia/Riyadh'};
 c.SpreadsheetApp={getActiveSpreadsheet:()=>ss,newDataValidation:()=>({requireValueInList(){return this},setAllowInvalid(){return this},build:()=>({})})};c.Utilities={formatDate:()=> '2026-10-31'};
 const result=c.offloadAuditRefresh_();expect(result.reviewed).toBe(0);expect(result.exceptions).toBe(0);
 c.refreshCarrierDailyReport();c.refreshCarrierReportViewer();
 expect(c.refreshOffloadDashboardSummary().reviewed).toBe(0);expect(tabs['Dashboard'].sheet.getRange('U5').getValue()).toBe(0);expect(tabs['Carrier Report Viewer'].sheet.getRange('A8').getValue()).toBe(0);
 expect([...tabs['Loading Register'].cells]).toEqual(before);expect([...tabs['Offload Data'].cells]).toEqual([]);
});
