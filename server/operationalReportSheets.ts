import {blueprintRequestBatches} from '../src/services/googleWorkspaceBlueprint/contract';
import type {sheets_v4} from 'googleapis';
import {OperationalReportTabRegistry,operationalTabIds,operationalTabMetadata,assertOperationalTabOwnership,OperationalTabError,type OperationalTabOwnership} from '../src/services/operationalReportTabRegistry';
const fail=():never=>{throw new OperationalTabError('PROFILE_REPORT_TAB_CONFLICT');};
const scalar=(cell?:sheets_v4.Schema$CellData):unknown=>{const v=cell?.effectiveValue||cell?.userEnteredValue;return v?.stringValue??v?.numberValue??v?.boolValue??'';};
function cell(value:unknown):sheets_v4.Schema$CellData {
 if(value===null||value===undefined||value==='')return {};
 if(typeof value==='string')return {userEnteredValue:{stringValue:value}}; // '=' stays literal, never a formula.
 if(typeof value==='number'&&Number.isFinite(value))return {userEnteredValue:{numberValue:value}};
 if(typeof value==='boolean')return {userEnteredValue:{boolValue:value}};
 return fail();
}
/** All mutations target proven numeric sheet IDs, never an A1 title that could be replaced. */
export async function projectOwnedOperationalTable(sheets:sheets_v4.Sheets,spreadsheetId:string,ownership:OperationalTabOwnership,primaryKey:string,records:Record<string,unknown>[],columns:readonly string[],snapshot:boolean,preserveUnmapped=false) {
 const title=OperationalReportTabRegistry[ownership.tabId]?.title;
 if(ownership.tabId==='AUDIT'&&(snapshot||records.length))fail();
 if(!title||!columns.includes(primaryKey)||new Set(columns).size!==columns.length)fail();
 const meta=await sheets.spreadsheets.get({spreadsheetId,fields:'sheets(properties,developerMetadata)'});
 const candidates=(meta.data.sheets||[]).filter(s=>s.properties?.title===title);if(candidates.length>1)fail();
 let target=candidates[0];
 if(target)assertOperationalTabOwnership(target,ownership);
 else {
  const used=new Set((meta.data.sheets||[]).map(s=>s.properties?.sheetId));let sheetId=20000+operationalTabIds.indexOf(ownership.tabId);while(used.has(sheetId))sheetId++;
  const properties={sheetId,title,gridProperties:{rowCount:Math.max(200,records.length+1),columnCount:Math.max(26,columns.length),frozenRowCount:1}};
  // Atomic creation + marker + header. A lost response can safely discover the owned tab on retry.
  await sheets.spreadsheets.batchUpdate({spreadsheetId,requestBody:{requests:[{addSheet:{properties}},{createDeveloperMetadata:{developerMetadata:operationalTabMetadata(ownership,sheetId)}},{updateCells:{start:{sheetId,rowIndex:0,columnIndex:0},rows:[{values:columns.map(cell)}],fields:'userEnteredValue'}}]}});
  target={properties,developerMetadata:[operationalTabMetadata(ownership,sheetId)]};
 }
 const sheetId=target.properties!.sheetId!;
 const read=await sheets.spreadsheets.get({spreadsheetId,includeGridData:true,ranges:["'"+title.replace(/'/g,"''")+"'!A:ZZ"]});
 const matches=(read.data.sheets||[]).filter(s=>s.properties?.sheetId===sheetId);
 if(matches.length!==1)throw new OperationalTabError('PROFILE_REPORT_TAB_OWNERSHIP_INVALID');
 const actual=matches[0];assertOperationalTabOwnership(actual,ownership);if(actual.merges?.length)fail();
 const rows:sheets_v4.Schema$RowData[]=[];
 for(const grid of actual.data||[])for(const [r,row] of (grid.rowData||[]).entries()){
  const index=r+(grid.startRow||0);rows[index]||={values:[]};for(const [c,value] of (row.values||[]).entries())rows[index].values![c+(grid.startColumn||0)]=value;
 }
 const headers=(rows[0]?.values||[]).map(c=>String(scalar(c)));while(headers.at(-1)==='')headers.pop();
 if(headers.filter(h=>h===primaryKey).length>1||columns.some(h=>headers.filter(v=>v===h).length>1))fail();
 for(const name of columns)if(!headers.includes(name))headers.push(name);
 const pk=headers.indexOf(primaryKey),existing=new Map<string,number>();
 for(let i=1;i<rows.length;i++){const raw=scalar(rows[i]?.values?.[pk]),key=String(raw??'').trim();if(!key)continue;if(preserveUnmapped&&ownership.tabId!=='AUDIT'&&existing.has(key))fail();existing.set(key,i);}
 const seen=new Set<string>();for(const record of records){const key=String(record[primaryKey]??'').trim();if(!key||seen.has(key))fail();seen.add(key);}
 const requests:sheets_v4.Schema$Request[]=[],grid=actual.properties?.gridProperties;
 const maxRows=snapshot?Math.max(rows.length,records.length+1):Math.max(rows.length,1)+records.filter(r=>!existing.has(String(r[primaryKey]).trim())).length;
 if((grid?.rowCount||0)<maxRows||(grid?.columnCount||0)<headers.length)requests.push({updateSheetProperties:{properties:{sheetId,gridProperties:{rowCount:Math.max(grid?.rowCount||0,maxRows),columnCount:Math.max(grid?.columnCount||0,headers.length)}},fields:'gridProperties.rowCount,gridProperties.columnCount'}});
 const headerValues=(rows[0]?.values||[]).map(c=>String(scalar(c)));for(let i=0;i<headers.length;i++)if(headerValues[i]!==headers[i])requests.push({updateCells:{start:{sheetId,rowIndex:0,columnIndex:i},rows:[{values:[cell(headers[i])]}],fields:'userEnteredValue'}});
 let next=Math.max(rows.length,1),inserted=0,updated=0;
 if(snapshot){
  const body=Math.max(rows.length-1,records.length);
  for(const column of columns){const index=headers.indexOf(column);for(let offset=0;offset<body;offset+=512){const length=Math.min(512,body-offset);requests.push({updateCells:{range:{sheetId,startRowIndex:offset+1,endRowIndex:offset+length+1,startColumnIndex:index,endColumnIndex:index+1},rows:Array.from({length},(_,i)=>({values:[cell(records[offset+i]?.[column])]})),fields:'userEnteredValue'}});}}
  inserted=records.filter(r=>!existing.has(String(r[primaryKey]).trim())).length;updated=records.length-inserted;
 }else for(const record of records){const key=String(record[primaryKey]).trim(),row=existing.get(key)??next++;if(existing.has(key))updated++;else inserted++;
  for(let index=0;index<headers.length;){
   const writes=(i:number)=>columns.includes(headers[i])&&(!preserveUnmapped||Object.hasOwn(record,headers[i]));
   if(!writes(index)){index++;continue;}
   const start=index,values:sheets_v4.Schema$CellData[]=[];while(index<headers.length&&writes(index))values.push(cell(record[headers[index++]]));
   requests.push({updateCells:{start:{sheetId,rowIndex:row,columnIndex:start},rows:[{values}],fields:'userEnteredValue'}});
  }
 }
 // Each bounded batch is atomic and replayable; numeric identity prevents title redirection.
 for(const batch of blueprintRequestBatches(requests))await sheets.spreadsheets.batchUpdate({spreadsheetId,requestBody:{requests:batch}});
 return {inserted,updated,deleted:snapshot?[...existing.keys()].filter(k=>!seen.has(k)).length:0};
}
