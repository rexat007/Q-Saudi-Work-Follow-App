import {iterateBlueprintRequestBatches} from '../src/services/googleWorkspaceBlueprint/contract';
import {boundedA1,WORKBOOK_READ_LIMITS as L} from '../src/services/googleWorkspaceBlueprint/inspection';
import type {sheets_v4} from 'googleapis';
import {OperationalReportTabRegistry,operationalTabIds,operationalTabMetadata,assertOperationalTabOwnership,OperationalTabError,type OperationalTabOwnership} from '../src/services/operationalReportTabRegistry';
const fail=():never=>{throw new OperationalTabError('PROFILE_REPORT_TAB_CONFLICT');};
const scalar=(cell?:sheets_v4.Schema$CellData):unknown=>{const v=cell?.effectiveValue||cell?.userEnteredValue;return v?.stringValue??v?.numberValue??v?.boolValue??'';};
function cell(value:unknown):sheets_v4.Schema$CellData {
 if(value===null||value===undefined||value==='')return {};
 if(typeof value==='string')return {userEnteredValue:{stringValue:value}};
 if(typeof value==='number'&&Number.isFinite(value))return {userEnteredValue:{numberValue:value}};
 if(typeof value==='boolean')return {userEnteredValue:{boolValue:value}};return fail();
}
/** Metadata/one bounded owned range; only primary keys and row coordinates survive a page. */
export async function projectOwnedOperationalTable(sheets:sheets_v4.Sheets,spreadsheetId:string,ownership:OperationalTabOwnership,primaryKey:string,records:Record<string,unknown>[],columns:readonly string[],snapshot:boolean,preserveUnmapped=false){
 const title=OperationalReportTabRegistry[ownership.tabId]?.title;
 if(ownership.tabId==='AUDIT'&&(snapshot||records.length))fail();
 if(!title||!columns.includes(primaryKey)||new Set(columns).size!==columns.length||records.length>50000)fail();
 const meta=await sheets.spreadsheets.get({spreadsheetId,includeGridData:false,fields:'sheets(properties,developerMetadata,merges)'},{maxContentLength:L.metadataBytes});
 const candidates=(meta.data.sheets||[]).filter(s=>s.properties?.title===title);if(candidates.length>1)fail();let target=candidates[0];
 if(target)assertOperationalTabOwnership(target,ownership);
 else{
  const used=new Set((meta.data.sheets||[]).map(s=>s.properties?.sheetId));let sheetId=20000+operationalTabIds.indexOf(ownership.tabId);while(used.has(sheetId))sheetId++;
  const properties={sheetId,title,gridProperties:{rowCount:Math.max(200,records.length+1),columnCount:Math.max(26,columns.length),frozenRowCount:1}};
  await sheets.spreadsheets.batchUpdate({spreadsheetId,requestBody:{requests:[{addSheet:{properties}},{createDeveloperMetadata:{developerMetadata:operationalTabMetadata(ownership,sheetId)}},{updateCells:{start:{sheetId,rowIndex:0,columnIndex:0},rows:[{values:columns.map(cell)}],fields:'userEnteredValue'}}]}});
  target={properties,developerMetadata:[operationalTabMetadata(ownership,sheetId)]};
 }
 if(target.merges?.length)fail();const sheetId=target.properties!.sheetId!,grid=target.properties!.gridProperties;
 const rowCount=grid?.rowCount||200,columnCount=grid?.columnCount||Math.max(26,columns.length);
 if(columnCount>1024||rowCount>200000)fail();
 const read=async(row:number,col:number,rows:number,cols:number,visit:(r:number,c:number,value:sheets_v4.Schema$CellData)=>void)=>{
  const response=await sheets.spreadsheets.get({spreadsheetId,includeGridData:true,ranges:[boundedA1(title,row,col,rows,cols)],fields:'sheets(properties(sheetId,title),developerMetadata,merges,data(startRow,startColumn,rowData(values(userEnteredValue,effectiveValue,note))))'},{maxContentLength:L.responseBytes});
  const found=(response.data.sheets||[]).filter(s=>s.properties?.sheetId===sheetId&&s.properties?.title===title);if(found.length!==1)throw new OperationalTabError('PROFILE_REPORT_TAB_OWNERSHIP_INVALID');assertOperationalTabOwnership(found[0],ownership);if(found[0].merges?.length)fail();
  for(const g of found[0].data||[]){const sr=g.startRow||0,sc=g.startColumn||0;for(let r=Math.max(row,sr);r<Math.min(row+rows,sr+(g.rowData?.length||0));r++)for(let c=col;c<col+cols;c++){const value=g.rowData?.[r-sr]?.values?.[c-sc];if(value)visit(r,c,value);}}
 };
 const headers:string[]=[];
 for(let col=0;col<columnCount;col+=L.columns)await read(0,col,1,Math.min(L.columns,columnCount-col),(_r,c,value)=>headers[c]=String(scalar(value)));
 for(let i=0;i<headers.length;i++)headers[i]||='';while(headers.at(-1)==='')headers.pop();
 const previousHeaders=[...headers];if(headers.filter(h=>h===primaryKey).length>1||columns.some(h=>headers.filter(v=>v===h).length>1))fail();for(const name of columns)if(!headers.includes(name))headers.push(name);
 const pk=headers.indexOf(primaryKey),existing=new Map<string,number>();let lastRow=0;
 if(ownership.tabId!=='AUDIT')for(let row=1;row<rowCount;row+=L.rows)for(let col=0;col<columnCount;col+=L.columns)await read(row,col,Math.min(L.rows,rowCount-row),Math.min(L.columns,columnCount-col),(r,c,value)=>{
  if(value.userEnteredValue||value.effectiveValue||value.note)lastRow=Math.max(lastRow,r);
  if(c!==pk)return;const key=String(scalar(value)??'').trim();if(!key)return;if(key.length>256||existing.size>=50000)fail();if(preserveUnmapped&&existing.has(key))fail();existing.set(key,r);
 });
 const seen=new Set<string>();for(const record of records){const key=String(record[primaryKey]??'').trim();if(!key||key.length>256||seen.has(key))fail();seen.add(key);}
 const newCount=records.filter(r=>!existing.has(String(r[primaryKey]).trim())).length,maxRows=snapshot?Math.max(lastRow+1,records.length+1):lastRow+1+newCount;
 if(maxRows>200000||headers.length>1024)fail();
 function* requests():Generator<sheets_v4.Schema$Request>{
  if(rowCount<maxRows||columnCount<headers.length)yield {updateSheetProperties:{properties:{sheetId,gridProperties:{rowCount:Math.max(rowCount,maxRows),columnCount:Math.max(columnCount,headers.length)}},fields:'gridProperties.rowCount,gridProperties.columnCount'}};
  for(let i=0;i<headers.length;i++)if(previousHeaders[i]!==headers[i])yield {updateCells:{start:{sheetId,rowIndex:0,columnIndex:i},rows:[{values:[cell(headers[i])]}],fields:'userEnteredValue'}};
  if(snapshot){const body=Math.max(lastRow,records.length);for(const column of columns){const index=headers.indexOf(column);for(let offset=0;offset<body;offset+=512){const length=Math.min(512,body-offset);yield {updateCells:{range:{sheetId,startRowIndex:offset+1,endRowIndex:offset+length+1,startColumnIndex:index,endColumnIndex:index+1},rows:Array.from({length},(_,i)=>({values:[cell(records[offset+i]?.[column])]})),fields:'userEnteredValue'}};}}}
  else{let next=lastRow+1;for(const record of records){const key=String(record[primaryKey]).trim(),row=existing.get(key)??next++;
   for(let i=0;i<headers.length;){const writes=(c:number)=>columns.includes(headers[c])&&(!preserveUnmapped||Object.hasOwn(record,headers[c]));if(!writes(i)){i++;continue;}const start=i,values:sheets_v4.Schema$CellData[]=[];while(i<headers.length&&writes(i))values.push(cell(record[headers[i++]]));yield {updateCells:{start:{sheetId,rowIndex:row,columnIndex:start},rows:[{values}],fields:'userEnteredValue'}};}
  }}
 }
 for(const batch of iterateBlueprintRequestBatches(requests()))await sheets.spreadsheets.batchUpdate({spreadsheetId,requestBody:{requests:batch}});
 return {inserted:newCount,updated:records.length-newCount,deleted:snapshot?[...existing.keys()].filter(k=>!seen.has(k)).length:0};
}
