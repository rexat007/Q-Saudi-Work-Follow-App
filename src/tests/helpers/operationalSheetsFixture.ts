import {vi} from 'vitest';
import type {sheets_v4} from 'googleapis';
export function operationalSheetsFixture(initial:sheets_v4.Schema$Spreadsheet={sheets:[]}) {
 const book=structuredClone(initial),requests:sheets_v4.Schema$Request[][]=[];
 const find=(id:number)=>{const sheet=book.sheets!.find(s=>s.properties?.sheetId===id);if(!sheet)throw Error('unknown numeric sheet ID');return sheet;};
 const apply=(request:sheets_v4.Schema$Request)=>{
  if(request.addSheet){const properties=request.addSheet.properties!;if(book.sheets!.some(s=>s.properties?.sheetId===properties.sheetId||s.properties?.title===properties.title))throw Error('duplicate sheet');book.sheets!.push({properties:structuredClone(properties),data:[{rowData:[]}]});}
  else if(request.createDeveloperMetadata){const metadata=request.createDeveloperMetadata.developerMetadata!,sheet=find(metadata.location!.sheetId!);(sheet.developerMetadata||=[]).push(structuredClone(metadata));}
  else if(request.updateCells){const update=request.updateCells,id=update.start?.sheetId??update.range?.sheetId!,sheet=find(id);sheet.data||=[{rowData:[]}];const grid=sheet.data[0];grid.rowData||=[];const startRow=update.start?.rowIndex??update.range?.startRowIndex??0,startCol=update.start?.columnIndex??update.range?.startColumnIndex??0;
   for(const [r,row] of (update.rows||[]).entries())for(const [c,value] of (row.values||[]).entries()){const at=startRow+r;grid.rowData[at]||={values:[]};grid.rowData[at].values||=[];const target=grid.rowData[at].values![startCol+c]||={};for(const field of (update.fields||'').split(',')){if(value[field]===undefined)delete target[field];else target[field]=structuredClone(value[field]);}}
  }else if(request.updateSheetProperties){const p=request.updateSheetProperties.properties!,sheet=find(p.sheetId!);if(request.updateSheetProperties.fields?.includes('title'))throw Error('unexpected tab rename');sheet.properties!.gridProperties={...sheet.properties!.gridProperties,...p.gridProperties};}
  else if(request.addProtectedRange){const range=request.addProtectedRange.protectedRange!,sheet=find(range.range!.sheetId!);(sheet.protectedRanges||=[]).push(structuredClone(range));}
  else throw Error('unexpected destructive or unrelated request');
 };
 const api={spreadsheets:{get:vi.fn(async(args:any)=>{const copy=structuredClone(book);if(args.ranges){const title=args.ranges[0].match(/^'((?:[^']|'')*)'!/)[1].replace(/''/g,"'");copy.sheets=copy.sheets!.filter(s=>s.properties?.title===title);}if(!args.includeGridData)copy.sheets=copy.sheets!.map(({properties,developerMetadata})=>({properties,developerMetadata}));return {data:copy};}),batchUpdate:vi.fn(async({requestBody}:any)=>{const before=structuredClone(book);try{for(const request of requestBody.requests)apply(request);}catch(error){Object.assign(book,before);throw error;}requests.push(structuredClone(requestBody.requests));return {data:{replies:[]}};})}};
 return {book,requests,api};
}
export function fixtureSheet(id:number,title:string,values:unknown[][],extras:Partial<sheets_v4.Schema$Sheet>={}):sheets_v4.Schema$Sheet {
 return {properties:{sheetId:id,title,gridProperties:{rowCount:200,columnCount:60}},data:[{rowData:values.map(row=>({values:row.map(value=>({userEnteredValue:typeof value==='number'?{numberValue:value}:{stringValue:String(value)}}))}))}],...extras};
}
