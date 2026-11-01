import {vi} from 'vitest';
import type {sheets_v4} from 'googleapis';
/** Provider model: metadata never touches grids; grid reads must name a finite rectangle. */
export function workbookInspectionFixture(book:sheets_v4.Schema$Spreadsheet){
 const find=(id:number)=>{const s=book.sheets?.find(s=>s.properties?.sheetId===id);if(!s)throw Error('missing fixture sheet');return s;};
 const get=vi.fn(async(args:any)=>{
  const ranges=(args.ranges||[]).map((a:string)=>{const m=a.match(/^'((?:[^']|'')*)'!([A-Z]+)(\d+):([A-Z]+)(\d+)$/);if(!m)throw Error('bounded range required');const col=(s:string)=>[...s].reduce((n,c)=>n*26+c.charCodeAt(0)-64,0)-1;return {title:m[1].replace(/''/g,"'"),r:+m[3]-1,c:col(m[2]),er:+m[5],ec:col(m[4])+1};});
  if(args.includeGridData&&!ranges.length)throw Error('full workbook grid fetch prohibited');
  const result:any={properties:book.properties,namedRanges:book.namedRanges,sheets:[]};
  for(const sheet of book.sheets||[]){const selected=ranges.filter((r:any)=>r.title===sheet.properties?.title);if(ranges.length&&!selected.length)continue;
   const meta=Object.fromEntries(Object.keys(sheet).filter(k=>k!=='data').map(k=>[k,(sheet as any)[k]]));const out:any=structuredClone(meta);
   if(selected.some((r:any)=>r.er>(sheet.properties?.gridProperties?.rowCount??Infinity)||r.ec>(sheet.properties?.gridProperties?.columnCount??Infinity)))throw Error('range exceeds actual grid');
   if(args.includeGridData)out.data=selected.map((range:any)=>({startRow:range.r,startColumn:range.c,rowData:Array.from({length:range.er-range.r},(_,r)=>({values:Array.from({length:range.ec-range.c},(_,c)=>{for(const g of sheet.data||[]){const v=g.rowData?.[range.r+r-(g.startRow||0)]?.values?.[range.c+c-(g.startColumn||0)];if(v)return structuredClone(v);}return {};})})),rowMetadata:Array.from({length:range.er-range.r},(_,r)=>{for(const g of sheet.data||[])if(g.rowMetadata?.[range.r+r-(g.startRow||0)])return structuredClone(g.rowMetadata[range.r+r-(g.startRow||0)]);return {};}),columnMetadata:Array.from({length:range.ec-range.c},(_,c)=>{for(const g of sheet.data||[])if(g.columnMetadata?.[range.c+c-(g.startColumn||0)])return structuredClone(g.columnMetadata[range.c+c-(g.startColumn||0)]);return {};})}));
   result.sheets.push(out);
  }
  return {data:result};
 });
 const update=vi.fn(async({requestBody}:any)=>{
  for(const r of requestBody.requests){
   if(r.addSheet){book.sheets||=[];if(book.sheets.some(s=>s.properties?.sheetId===r.addSheet.properties.sheetId||s.properties?.title===r.addSheet.properties.title))throw Error('duplicate fixture sheet');book.sheets.push({properties:structuredClone(r.addSheet.properties),data:[{startRow:0,startColumn:0,rowData:[]}]});}
   else if(r.updateCells){const u=r.updateCells,s=find(u.start?.sheetId??u.range.sheetId);s.data||=[{startRow:0,startColumn:0,rowData:[]}];const g=s.data[0];g.rowData||=[];const sr=u.start?.rowIndex??u.range?.startRowIndex??0,sc=u.start?.columnIndex??u.range?.startColumnIndex??0;
    for(const [row,v] of (u.rows||[]).entries())for(const [c,value] of (v.values||[]).entries()){g.rowData[sr+row]||={values:[]};g.rowData[sr+row].values||=[];const at=g.rowData[sr+row].values![sc+c]||={};for(const key of u.fields.split(',')){if(value[key]===undefined)delete at[key];else at[key]=structuredClone(value[key]);}}
   }else if(r.updateSheetProperties){const p=r.updateSheetProperties.properties,s=find(p.sheetId);s.properties={...s.properties,...p,gridProperties:{...s.properties?.gridProperties,...p.gridProperties}};}
   else if(r.createDeveloperMetadata){const m=r.createDeveloperMetadata.developerMetadata,s=find(m.location.sheetId);(s.developerMetadata||=[]).push(structuredClone(m));}
   else if(r.addNamedRange){(book.namedRanges||=[]).push({...structuredClone(r.addNamedRange.namedRange),namedRangeId:'fixture-'+book.namedRanges!.length});}
   else if(r.updateNamedRange){const n=r.updateNamedRange.namedRange,old=book.namedRanges!.find(x=>x.namedRangeId===n.namedRangeId)!;Object.assign(old,n);}
   else if(r.updateSpreadsheetProperties)book.properties={...book.properties,...r.updateSpreadsheetProperties.properties};
   else if(r.mergeCells)(find(r.mergeCells.range.sheetId).merges||=[]).push(structuredClone(r.mergeCells.range));
   else if(r.addProtectedRange){const p=r.addProtectedRange.protectedRange;(find(p.range.sheetId).protectedRanges||=[]).push(structuredClone(p));}
   else if(r.addConditionalFormatRule){const p=r.addConditionalFormatRule;(find(p.rule.ranges[0].sheetId).conditionalFormats||=[]).splice(p.index,0,structuredClone(p.rule));}
   else if(r.addChart){const c=r.addChart.chart,id=c.spec?.basicChart?.domains?.[0]?.domain?.sourceRange?.sources?.[0]?.sheetId??c.position?.overlayPosition?.anchorCell?.sheetId;const s=id===undefined?book.sheets!.at(-1)!:find(id);(s.charts||=[]).push({...structuredClone(c),chartId:100+s.charts!.length});}
   else if(r.updateChartSpec){const c=book.sheets!.flatMap(s=>s.charts||[]).find(c=>c.chartId===r.updateChartSpec.chartId)!;c.spec=structuredClone(r.updateChartSpec.spec);}
   else if(r.setBasicFilter)find(r.setBasicFilter.filter.range.sheetId).basicFilter=structuredClone(r.setBasicFilter.filter);
   else if(r.addFilterView)(find(r.addFilterView.filter.range.sheetId).filterViews||=[]).push(structuredClone(r.addFilterView.filter));
   else if(r.addBanding)(find(r.addBanding.bandedRange.range.sheetId).bandedRanges||=[]).push(structuredClone(r.addBanding.bandedRange));
   else if(r.updateDimensionProperties){const d=r.updateDimensionProperties,s=find(d.range.sheetId);s.data||=[{startRow:0,startColumn:0}];const key=d.range.dimension==='ROWS'?'rowMetadata':'columnMetadata',g=s.data[0];g[key]||=[];for(let i=d.range.startIndex;i<d.range.endIndex;i++)g[key][i]={...g[key][i],...structuredClone(d.properties)};}
   else if(r.addDimensionGroup){const d=r.addDimensionGroup,key=d.range.dimension==='ROWS'?'rowGroups':'columnGroups';(find(d.range.sheetId)[key]||=[]).push({range:structuredClone(d.range),depth:1});}
   else throw Error('unexpected fixture mutation');
  }
  return {data:{}};
 });
 return {book,get,update};
}
