import type { sheets_v4, script_v1 } from 'googleapis';
import type { WorkspaceBlueprint } from './contract';
import { columnIndex } from './contract';
import { LOADING_HEADERS, OFFLOAD_HEADERS, LOADING_WRITABLE, OFFLOAD_WRITABLE } from '../projectGoogleSheetContract';
export interface CapturePolicy {
  version:string;
  scriptVersion:string;
  /** Explicit author-reviewed cell coordinates, not entire report/data rows. */
  staticCells:Record<string,string[]>;
  expectedStaticValues?:Record<string,string|number|boolean>;
  functions:NonNullable<WorkspaceBlueprint['script']>['functions'];
  requiredCustomFunctions:string[];
  triggerModel:NonNullable<WorkspaceBlueprint['script']>['triggerModel'];
  protectionPolicy?:'OWNER_ONLY'|'WARNING_ONLY';
}
function letter(column:number):string { let out='';for(let n=column+1;n>0;n=Math.floor((n-1)/26))out=String.fromCharCode(65+(n-1)%26)+out;return out; }
export function captureWorkspaceBlueprint(reference:sheets_v4.Schema$Spreadsheet,files:script_v1.Schema$File[]|null,policy:CapturePolicy) {
  const sorted=[...(reference.sheets||[])].sort((a,b)=>(a.properties?.index||0)-(b.properties?.index||0));
  const ids=new Map(sorted.map((s,i)=>[s.properties?.sheetId,100+i]));
  let removed=0,unaccounted=0,formulaCount=0,validationCount=0;
  const removedRows=new Set<string>(),unknownCells:string[]=[];
  const sourceId=reference.spreadsheetId||'';
  const remap=(value:any):any=>{
    if(Array.isArray(value))return value.map(remap);
    if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,(key==='sheetId'||key==='sourceSheetId')?(ids.has(item as number)?ids.get(item as number):(()=>{throw new Error('BLUEPRINT_RANGE_TARGET_INVALID')})()):remap(item)]));
    if(typeof value==='string'&&sourceId&&value.includes(sourceId)) throw new Error('BLUEPRINT_SOURCE_REFERENCE_REVIEW_REQUIRED');
    return value;
  };
  const sheets=sorted.map((sheet,index)=>{
    const title=sheet.properties?.title||'';
    for(const key of ['slicers','developerMetadata','tables'] as const)if((sheet as any)[key]?.length)unaccounted++;
    const operational=title==='Loading Register'||title==='Offload Data';
    const input=(title==='Loading Register'?LOADING_WRITABLE:[...OFFLOAD_WRITABLE,'J','K','L']).map(columnIndex);
    const expectedHeaders=title==='Loading Register'?LOADING_HEADERS:OFFLOAD_HEADERS;
    const data=(sheet.data||[]).slice().sort((a,b)=>(a.startRow||0)-(b.startRow||0)||(a.startColumn||0)-(b.startColumn||0)).map(grid=>({
      startRow:grid.startRow||0,startColumn:grid.startColumn||0,
      columnMetadata:(grid.columnMetadata||[]).map(p=>({...(p.pixelSize?{pixelSize:p.pixelSize}:{}),...(p.hiddenByUser?{hiddenByUser:true}:{})})),
      rowMetadata:(grid.rowMetadata||[]).map(p=>({...(p.pixelSize?{pixelSize:p.pixelSize}:{}),...(p.hiddenByUser?{hiddenByUser:true}:{})})),
      rowData:(grid.rowData||[]).map((row,r)=>({values:(row.values||[]).map((cell,c)=>{
        const rowIndex=(grid.startRow||0)+r,column=(grid.startColumn||0)+c,address=letter(column)+(rowIndex+1);
        const value=cell.userEnteredValue;
        const result:sheets_v4.Schema$CellData={};
        for(const key of ['userEnteredFormat','dataValidation','textFormatRuns','pivotTable'] as const) if(cell[key]) (result as any)[key]=cell[key];
        if(cell.dataValidation)validationCount++;
        if(value?.formulaValue) {result.userEnteredValue=value;formulaCount++;}
        else if(value) {
          if(operational&&rowIndex>0&&input.includes(column)) {removed++;removedRows.add(title+':'+rowIndex);}
          else if((operational&&rowIndex===0&&value.stringValue===expectedHeaders[column])||(policy.staticCells[title]?.includes(address)&&policy.expectedStaticValues?.[title+'!'+address]===(value.stringValue??value.numberValue??value.boolValue))) result.userEnteredValue=value;
          else {unaccounted++;unknownCells.push(title+'!'+address);}
        }
        if(cell.dataSourceFormula||cell.dataSourceTable)unaccounted++;
        if(!result.userEnteredValue?.stringValue)delete result.textFormatRuns;
        return result;
      })})),
    }));
    const protections=(sheet.protectedRanges||[]).map(r=>{
      const {protectedRangeId,editors,requestingUserCanEdit,...rest}=r;
      if(editors&&!policy.protectionPolicy)unaccounted++;
      return {...rest,...(policy.protectionPolicy==='WARNING_ONLY'?{warningOnly:true}:{})};
    });
    const filters=(sheet.filterViews||[]).map((v,i)=>{const {filterViewId,...rest}=v;return {...rest,filterViewId:10000+index*100+i};});
    const charts=(sheet.charts||[]).slice().sort((a,b)=>(a.chartId||0)-(b.chartId||0)).map((chart,i)=>({...chart,chartId:10000+index*100+i}));
    const bandedRanges=(sheet.bandedRanges||[]).slice().sort((a,b)=>(a.bandedRangeId||0)-(b.bandedRangeId||0)).map((range,i)=>({...range,bandedRangeId:10000+index*100+i}));
    return remap({properties:{...sheet.properties,index},data,
      ...(sheet.merges?.length?{merges:sheet.merges}:{}),...(sheet.conditionalFormats?.length?{conditionalFormats:sheet.conditionalFormats}:{}),
      ...(charts.length?{charts}:{}),...(protections.length?{protectedRanges:protections}:{}),...(sheet.basicFilter?{basicFilter:sheet.basicFilter}:{}),
      ...(filters.length?{filterViews:filters}:{}),...(bandedRanges.length?{bandedRanges}:{}),
      ...(sheet.rowGroups?.length?{rowGroups:sheet.rowGroups}:{}),...(sheet.columnGroups?.length?{columnGroups:sheet.columnGroups}:{}),
    }) as sheets_v4.Schema$Sheet;
  });
  const scriptFiles=files?.map(({name,type,source})=>({name,type,source})).sort((a,b)=>(a.name||'')<(b.name||'')?-1:(a.name||'')>(b.name||'')?1:0)||null;
  const functionNames=new Set((scriptFiles||[]).filter(f=>f.type==='SERVER_JS').flatMap(f=>[...(f.source||'').matchAll(/\bfunction\s+([A-Za-z_$][\w$]*)\s*\(/g)].map(m=>m[1])));
  const unclassifiedFunctions=[...functionNames].filter(name=>!policy.functions.some(f=>f.name===name));
  unaccounted+=unclassifiedFunctions.length;
  const contents=JSON.stringify(scriptFiles);
  if((sourceId&&contents.includes(sourceId))||/-----BEGIN .*PRIVATE KEY|AIza[\w-]{25,}|(?:access_token|refresh_token|client_secret)\s*[=:]\s*["'][^"']+["']/i.test(contents)) throw new Error('SCRIPT_SOURCE_SECURITY_REVIEW_REQUIRED');
  if(reference.dataSources?.length||reference.dataSourceSchedules?.length||reference.developerMetadata?.length)unaccounted++;
  const blueprint:WorkspaceBlueprint={schemaVersion:1,version:policy.version,approved:false,
    properties:{...(reference.properties?.spreadsheetTheme?{spreadsheetTheme:reference.properties.spreadsheetTheme}:{}),locale:reference.properties?.locale||'',timeZone:reference.properties?.timeZone||'',...(reference.properties?.defaultFormat?{defaultFormat:reference.properties.defaultFormat}:{}),...(reference.properties?.autoRecalc?{autoRecalc:reference.properties.autoRecalc}:{}),...(reference.properties?.iterativeCalculationSettings?{iterativeCalculationSettings:reference.properties.iterativeCalculationSettings}:{})},sheets,
    namedRanges:(reference.namedRanges||[]).slice().sort((a,b)=>(a.name||'')<(b.name||'')?-1:(a.name||'')>(b.name||'')?1:0).map(({name,range})=>({name,range:remap(range)})),
    script:scriptFiles?{version:policy.scriptVersion,files:scriptFiles,functions:policy.functions,requiredCustomFunctions:policy.requiredCustomFunctions,triggerModel:policy.triggerModel}:null,
    capture:{complete:unaccounted===0,unaccounted,operationalRows:0,sourceReferenceIds:[]}};
  return {blueprint,report:{referenceSheets:sheets.map(s=>s.properties?.title),formulaCount,namedRangeCount:blueprint.namedRanges.length,validationCount,
    conditionalFormatCount:sheets.reduce((n,s)=>n+(s.conditionalFormats?.length||0),0),chartCount:sheets.reduce((n,s)=>n+(s.charts?.length||0),0),mergeCount:sheets.reduce((n,s)=>n+(s.merges?.length||0),0),
    scriptFileCount:scriptFiles?.length??null,scriptFunctionCount:scriptFiles?functionNames.size:null,unclassifiedFunctions,operationalInputCellsRemoved:removed,operationalInputRowsRemoved:removedRows.size,unaccounted,unknownCells}};
}

/** Stable serialization for review diffs; array ordering remains semantically significant. */
export function canonicalBlueprintJson(value:unknown):string {
  const stable=(v:any):any=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,stable(v[k])])):v;
  return JSON.stringify(stable(value),null,2)+'\n';
}
