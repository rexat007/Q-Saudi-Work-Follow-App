import type {sheets_v4} from 'googleapis';
import {WORKBOOK_READ_LIMITS as L,boundedA1,type WorkspaceWorkbookInspection} from '../src/services/googleWorkspaceBlueprint/inspection';
import type {WorkspaceBlueprint} from '../src/services/googleWorkspaceBlueprint/contract';
import {gwsFail} from '../src/services/projectGoogleWorkspace.server';
export const WORKBOOK_METADATA_FIELDS='spreadsheetId,properties,sheets(properties,developerMetadata,merges,protectedRanges,conditionalFormats,charts,basicFilter,filterViews,bandedRanges,rowGroups,columnGroups),namedRanges';
const CELL_FIELDS='sheets(properties(sheetId,title),developerMetadata,merges,data(startRow,startColumn,rowData(values(userEnteredValue,userEnteredFormat,dataValidation,textFormatRuns,pivotTable,note,effectiveValue)),rowMetadata,columnMetadata))';
const structural=(s:sheets_v4.Schema$Sheet):sheets_v4.Schema$Sheet=>({properties:s.properties,developerMetadata:s.developerMetadata,merges:s.merges,protectedRanges:s.protectedRanges,conditionalFormats:s.conditionalFormats,charts:s.charts,basicFilter:s.basicFilter,filterViews:s.filterViews,bandedRanges:s.bandedRanges,rowGroups:s.rowGroups,columnGroups:s.columnGroups,data:[]});
export interface InspectionRange {row:number;column:number;rows:number;columns:number}
export type WorkbookInspectionStage='INSPECT_WORKBOOK_METADATA'|'INSPECT_CANONICAL_RANGES';
/** Metadata + one capped provider range at a time; retained cells depend only on blueprint extents. */
export async function inspectWorkspaceWorkbook(sheets:sheets_v4.Sheets,spreadsheetId:string,blueprint:WorkspaceBlueprint,
 previous?:WorkspaceWorkbookInspection,affected?:Map<number,InspectionRange[]>,stage:(s:WorkbookInspectionStage)=>Promise<void>=async()=>{}):Promise<WorkspaceWorkbookInspection>{
 await stage('INSPECT_WORKBOOK_METADATA');
 const response=await sheets.spreadsheets.get({spreadsheetId,includeGridData:false,fields:WORKBOOK_METADATA_FIELDS},{maxContentLength:L.metadataBytes});
 if((response.data.sheets?.length||0)>L.sheets)return gwsFail('WORKSPACE_STRUCTURE_INVALID');
 const out:WorkspaceWorkbookInspection={kind:'BOUNDED_WORKBOOK_INSPECTION',properties:response.data.properties,namedRanges:response.data.namedRanges,sheets:(response.data.sheets||[]).map(structural),freshDefaultEmpty:false,metrics:{sheetCount:response.data.sheets?.length||0,inspectedRangeCount:0,inspectedCellCount:0}};
 await stage('INSPECT_CANONICAL_RANGES');
 const read=async(target:sheets_v4.Schema$Sheet,row:number,col:number,rows:number,columns:number)=>{
  // A damaged short grid is repairable; never ask Google for cells beyond its current bounds.
  rows=Math.min(rows,Math.max(0,(target.properties?.gridProperties?.rowCount??row+rows)-row));
  columns=Math.min(columns,Math.max(0,(target.properties?.gridProperties?.columnCount??col+columns)-col));
  if(!rows||!columns)return [];
  if(++out.metrics.inspectedRangeCount>L.ranges||(out.metrics.inspectedCellCount+=rows*columns)>L.cells)return gwsFail('WORKSPACE_STRUCTURE_INVALID');
  const r=await sheets.spreadsheets.get({spreadsheetId,includeGridData:true,ranges:[boundedA1(target.properties!.title!,row,col,rows,columns)],fields:CELL_FIELDS},{maxContentLength:L.responseBytes});
  const found=(r.data.sheets||[]).filter(s=>s.properties?.sheetId===target.properties?.sheetId&&s.properties?.title===target.properties?.title);if(found.length!==1)return gwsFail('WORKSPACE_STRUCTURE_INVALID');
  const blocks:sheets_v4.Schema$GridData[]=[];
  for(const grid of found[0].data||[]){const sr=grid.startRow||0,sc=grid.startColumn||0,start=Math.max(row,sr),end=Math.min(row+rows,sr+(Math.max(grid.rowData?.length||0,grid.rowMetadata?.length||0)));
   const block:sheets_v4.Schema$GridData={startRow:start,startColumn:col,rowData:[],rowMetadata:[],columnMetadata:[]};
   for(let ri=start;ri<end;ri++){const source=grid.rowData?.[ri-sr];block.rowData!.push({values:Array.from({length:columns},(_,c)=>source?.values?.[col+c-sc]||{})});block.rowMetadata!.push(grid.rowMetadata?.[ri-sr]||{});}
   for(let c=col;c<col+columns;c++)block.columnMetadata!.push(grid.columnMetadata?.[c-sc]||{});
   blocks.push(block);
  }
  return blocks;
 };
 const onlyDefault=out.sheets.length===1&&out.sheets[0].properties?.title==='Sheet1';
 if(onlyDefault){const s=out.sheets[0],p=s.properties?.gridProperties,rows=p?.rowCount||1000,cols=p?.columnCount||26;
  if(rows*cols<=26000&&!s.merges?.length&&!s.charts?.length&&!s.protectedRanges?.length&&!s.developerMetadata?.length){let empty=true;
   for(let row=0;row<rows&&empty;row+=L.rows)for(let col=0;col<cols&&empty;col+=L.columns){const blocks=await read(s,row,col,Math.min(L.rows,rows-row),Math.min(L.columns,cols-col));empty=!blocks.some(g=>g.rowData?.some(r=>r.values?.some(c=>c.userEnteredValue||c.note)));}
   out.freshDefaultEmpty=empty;
  }
 }
 for(const expected of blueprint.sheets){
  const title=expected.properties!.title!;
  // Preserved legacy/profile history is structural evidence only. Headers are the delivery writer's concern.
  if(blueprint.operationalTabOwnershipSchema===1)continue;
  let target=out.sheets.find(s=>s.properties?.title===title);
  if(!target)target=out.sheets.find(s=>s.properties?.sheetId===expected.properties?.sheetId);
  if(!target)continue;
  const prior=previous?.sheets.find(s=>s.properties?.sheetId===target!.properties?.sheetId);
  if(prior&&affected){
   target.data=[...(prior.data||[])];
   for(const range of affected.get(target.properties!.sheetId!)||[])for(let r=0;r<range.rows;r+=L.rows)for(let c=0;c<range.columns;c+=L.columns)target.data.push(...await read(target,range.row+r,range.column+c,Math.min(L.rows,range.rows-r),Math.min(L.columns,range.columns-c)));
   continue;
  }
  for(const data of expected.data||[]){const rows=Math.max(data.rowData?.length||0,data.rowMetadata?.length||0,data.columnMetadata?.length?1:0),cols=Math.max(data.columnMetadata?.length||0,...(data.rowData||[]).map(r=>r.values?.length||0));
   if(!rows||!cols)continue;
   for(let r=0;r<rows;r+=L.rows)for(let c=0;c<cols;c+=L.columns)target.data!.push(...await read(target,(data.startRow||0)+r,(data.startColumn||0)+c,Math.min(L.rows,rows-r),Math.min(L.columns,cols-c)));
  }
 }
 return out;
}
