import type {WorkspaceWorkbookInspection} from './inspection';
import {operationalTabByTitle,assertOperationalTabOwnership} from '../operationalReportTabRegistry';
import {planOwnedOperationalTabs} from './operationalTabs';
import type { sheets_v4, script_v1 } from 'googleapis';
import { REQUIRED_GOOGLE_TABS, LOADING_HEADERS, OFFLOAD_HEADERS, LOADING_WRITABLE, OFFLOAD_WRITABLE } from '../projectGoogleSheetContract';
import {WORKSPACE_TABS} from '../../types/workspace';

export interface WorkspaceBlueprint {
  operationalTabOwnershipSchema?:1;
  templateId?:string;
  requiredTabs?:readonly string[];
  schemaVersion: 1;
  version: string;
  approved: boolean;
  properties: { locale: string; timeZone: string; defaultFormat?:sheets_v4.Schema$CellFormat; autoRecalc?:string; iterativeCalculationSettings?:sheets_v4.Schema$IterativeCalculationSettings; spreadsheetTheme?:sheets_v4.Schema$SpreadsheetTheme };
  sheets: sheets_v4.Schema$Sheet[];
  namedRanges: sheets_v4.Schema$NamedRange[];
  script: {
    version: string;
    files: script_v1.Schema$File[];
    functions: Array<{name:string;kind:'CUSTOM_FUNCTION'|'SIMPLE_TRIGGER'|'INSTALLABLE_TRIGGER'|'MENU_UI'|'VALIDATION_AUTOMATION'|'REPORT_REFRESH'|'OTHER'}>;
    requiredCustomFunctions: string[];
    triggerModel: 'SIMPLE_ONLY'|'NONE'|'INSTALLABLE'|'UNREVIEWED';
  } | null;
  capture: { complete:boolean; unaccounted:number; operationalRows:number; sourceReferenceIds:string[] };
}
export class BlueprintError extends Error { constructor(public code:string) { super(code); } }
const invalid=(code='WORKSPACE_BLUEPRINT_INVALID'):never=>{throw new BlueprintError(code)};
export const columnIndex=(column:string)=>[...column].reduce((n,c)=>n*26+c.charCodeAt(0)-64,0)-1;
export function cellEntries(sheet:sheets_v4.Schema$Sheet) {
  return (sheet.data||[]).flatMap(grid=>(grid.rowData||[]).flatMap((row,r)=>(row.values||[]).map((cell,c)=>({row:r+(grid.startRow||0),column:c+(grid.startColumn||0),cell}))));
}
export function assertBlueprint(blueprint:WorkspaceBlueprint,requireAutomation=true):void {
  if(!blueprint||!Array.isArray(blueprint.sheets)||!Array.isArray(blueprint.namedRanges)||!blueprint.capture||!Array.isArray(blueprint.capture.sourceReferenceIds))return invalid();
  if(requireAutomation&&!blueprint.script) return invalid('SCRIPT_SOURCE_CAPTURE_REQUIRED');
  if(!blueprint.approved || !blueprint.capture.complete || blueprint.capture.unaccounted || blueprint.capture.operationalRows || blueprint.capture.sourceReferenceIds.length || blueprint.schemaVersion!==1) return invalid('WORKSPACE_BLUEPRINT_CAPTURE_REQUIRED');
  if(!blueprint.version || blueprint.properties.timeZone!=='Asia/Riyadh' || !blueprint.properties.locale) return invalid();
  const names=blueprint.sheets.map(s=>s.properties?.title),ids=blueprint.sheets.map(s=>s.properties?.sheetId);
  const expected=blueprint.templateId?blueprint.requiredTabs:REQUIRED_GOOGLE_TABS;
  if(blueprint.templateId&&!['DUAL_WEIGHBRIDGE_V1','LOADING_SCALE_ONLY_V1','UNLOADING_SCALE_ONLY_V1','NO_WEIGHBRIDGE_V1'].includes(blueprint.templateId))return invalid();
  if(!expected?.length||expected.length>32||names.length!==expected.length||new Set(names).size!==names.length||new Set(ids).size!==ids.length||expected.some((name,i)=>names[i]!==name)) return invalid();
  for(const sheet of blueprint.sheets) {
    const p=sheet.properties;
    if(!p || !Number.isSafeInteger(p.sheetId) || !p.gridProperties?.rowCount || p.gridProperties.rowCount>50000 || !p.gridProperties.columnCount) return invalid();
    if(blueprint.operationalTabOwnershipSchema===1){const tabId=operationalTabByTitle(p.title!);if(tabId)assertOperationalTabOwnership(sheet,{tabId,templateId:blueprint.templateId!});}
    const tab=REQUIRED_GOOGLE_TABS.indexOf(p.title as typeof REQUIRED_GOOGLE_TABS[number]);
    if(tab>=0&&tab<2) {
      const headers=tab===0?LOADING_HEADERS:OFFLOAD_HEADERS;
      const inputs=(tab===0?LOADING_WRITABLE:[...OFFLOAD_WRITABLE,'J','K','L']).map(columnIndex);
      const cells=cellEntries(sheet);
      for(const [i,label] of headers.entries()) if(cells.find(c=>c.row===0&&c.column===i)?.cell.userEnteredValue?.stringValue!==label) return invalid();
      if(cells.some(c=>c.row>0&&inputs.includes(c.column)&&c.cell.userEnteredValue)) return invalid('BLUEPRINT_OPERATIONAL_DATA_FOUND');
    }
  }
  const scan=(value:unknown):void=>{if(typeof value==='string'&&/https?:\/\/|IMPORTRANGE\s*\(/i.test(value))return invalid('BLUEPRINT_EXTERNAL_REFERENCE');if(Array.isArray(value))value.forEach(scan);else if(value&&typeof value==='object')Object.values(value).forEach(scan);};
  scan(blueprint.sheets);
  const checkRanges=(value:unknown):void=>{
    if(Array.isArray(value)) {value.forEach(checkRanges);return;}
    if(!value||typeof value!=='object')return;
    for(const [key,item] of Object.entries(value)) {
      if((key==='sheetId'||key==='sourceSheetId')&&!ids.includes(item as number)) return invalid('BLUEPRINT_RANGE_TARGET_INVALID');
      checkRanges(item);
    }
  };
  checkRanges([blueprint.sheets,blueprint.namedRanges]);
  if(!requireAutomation)return;
  const script=blueprint.script;
  if(!script)return invalid('SCRIPT_SOURCE_CAPTURE_REQUIRED');
  if(!Array.isArray(script.files)||!Array.isArray(script.functions)||!Array.isArray(script.requiredCustomFunctions))return invalid();
  if(new Set(script.functions.map(f=>f.name)).size!==script.functions.length)return invalid('SCRIPT_FUNCTION_INVENTORY_INVALID');
  if(!script.version || !script.files.some(f=>f.name==='appsscript'&&f.type==='JSON') || !script.files.some(f=>f.type==='SERVER_JS')) return invalid('SCRIPT_SOURCE_CAPTURE_REQUIRED');
  if(script.triggerModel==='UNREVIEWED') return invalid('SCRIPT_TRIGGER_REVIEW_REQUIRED');
  // No invented support for installing trigger instances through projects.updateContent.
  if(script.triggerModel==='INSTALLABLE') return invalid('SCRIPT_TRIGGER_PROVISION_REQUIRED');
  const namesInSource=new Set(script.files.filter(f=>f.type==='SERVER_JS').flatMap(f=>[...(f.source||'').matchAll(/\bfunction\s+([A-Za-z_$][\w$]*)\s*\(/g)].map(m=>m[1])));
  if(script.functions.some(f=>!namesInSource.has(f.name)) || [...namesInSource].some(n=>!script.functions.some(f=>f.name===n)) || script.requiredCustomFunctions.some(n=>!namesInSource.has(n))) return invalid('SCRIPT_FUNCTION_INVENTORY_INVALID');
  let manifest:any;
  try { manifest=JSON.parse(script.files.find(f=>f.name==='appsscript')!.source||''); } catch { return invalid('SCRIPT_MANIFEST_INVALID'); }
  if(manifest.timeZone!==blueprint.properties.timeZone) return invalid('SCRIPT_MANIFEST_INVALID');
  if(manifest.oauthScopes?.includes('https://www.googleapis.com/auth/drive'))return invalid('SCRIPT_SCOPE_SECURITY_REVIEW_REQUIRED');
}

/** Review/capture requests use target-local sheet IDs, never the source workbook IDs. */
export function blueprintRequests(blueprint:WorkspaceBlueprint,current:WorkspaceWorkbookInspection|sheets_v4.Schema$Spreadsheet,bindingOnly=false):sheets_v4.Schema$Request[] {
  assertBlueprint(blueprint,!bindingOnly);
  if(blueprint.operationalTabOwnershipSchema===1)return planOwnedOperationalTabs(blueprint,current,legacy=>blueprintRequests(legacy,current,bindingOnly)).requests;
  const requests:sheets_v4.Schema$Request[]=[];
  const existing=current.sheets||[];
  for(const [index,sheet] of blueprint.sheets.entries()) {
    const properties={...sheet.properties,index};
    const actual=existing.find(s=>s.properties?.sheetId===properties.sheetId);
    if(!actual) requests.push({addSheet:{properties}});
    else if(actual.properties?.title!==properties.title) return invalid('WORKSPACE_STRUCTURE_INVALID');
    else requests.push({updateSheetProperties:{properties,fields:'title,index,gridProperties'}});
    for(const data of sheet.data||[]) {
      for(let offset=0;offset<(data.rowData?.length||0);) {
        const rows:sheets_v4.Schema$RowData[]=[];let bytes=0;
        while(offset+rows.length<data.rowData!.length&&rows.length<64) {
          const row=data.rowData![offset+rows.length],size=new TextEncoder().encode(JSON.stringify(row)).length;
          if(rows.length&&bytes+size>750000)break;
          if(size>750000)return invalid('WORKSPACE_BLUEPRINT_INVALID');
          rows.push(row);bytes+=size;
        }
        requests.push({updateCells:{start:{sheetId:properties.sheetId,rowIndex:(data.startRow||0)+offset,columnIndex:data.startColumn||0},rows,fields:'userEnteredValue,userEnteredFormat,dataValidation,textFormatRuns,pivotTable'}});
        offset+=rows.length;
      }
      for(const [dimension,metadata] of [['ROWS',data.rowMetadata],['COLUMNS',data.columnMetadata]] as const) {
        for(let offset=0;offset<(metadata?.length||0);) {
          const p=metadata![offset];let end=offset+1;
          while(end<metadata!.length&&JSON.stringify(metadata![end])===JSON.stringify(p))end++;
          if(p.pixelSize||p.hiddenByUser!==undefined)requests.push({updateDimensionProperties:{range:{sheetId:properties.sheetId,dimension,startIndex:(dimension==='ROWS'?(data.startRow||0):(data.startColumn||0))+offset,endIndex:(dimension==='ROWS'?(data.startRow||0):(data.startColumn||0))+end},properties:{pixelSize:p.pixelSize,hiddenByUser:p.hiddenByUser},fields:'pixelSize,hiddenByUser'}});
          offset=end;
        }
      }
    }
    for(const merge of sheet.merges||[]) if(!(actual?.merges||[]).some(m=>JSON.stringify(m)===JSON.stringify(merge))) requests.push({mergeCells:{range:merge,mergeType:'MERGE_ALL'}});
    for(let i=(actual?.conditionalFormats?.length||0)-1;i>=0;i--) requests.push({deleteConditionalFormatRule:{sheetId:properties.sheetId,index:i}});
    for(const [i,rule] of (sheet.conditionalFormats||[]).entries()) requests.push({addConditionalFormatRule:{rule,index:i}});
    for(const chart of sheet.charts||[]) {
      const found=actual?.charts?.find(c=>c.chartId===chart.chartId);
      if(found) {requests.push({updateChartSpec:{chartId:chart.chartId,spec:chart.spec}});if(chart.position)requests.push({updateEmbeddedObjectPosition:{objectId:chart.chartId,newPosition:chart.position,fields:'*'}});}
      else requests.push({addChart:{chart}});
    }
    for(const range of sheet.protectedRanges||[]) {
      if(!(actual?.protectedRanges||[]).some(r=>JSON.stringify(r.range)===JSON.stringify(range.range))) requests.push({addProtectedRange:{protectedRange:range}});
    }
    for(const dimension of ['rowGroups','columnGroups'] as const) for(const group of sheet[dimension]||[]) {
      const found=actual?.[dimension]?.some(g=>JSON.stringify(g.range)===JSON.stringify(group.range)&&g.depth===group.depth);
      if(!found)requests.push({addDimensionGroup:{range:group.range}});
      if(group.collapsed)requests.push({updateDimensionGroup:{dimensionGroup:group,fields:'collapsed'}});
    }
    if(sheet.basicFilter) requests.push({setBasicFilter:{filter:sheet.basicFilter}});
    for(const view of sheet.filterViews||[]) if(!(actual?.filterViews||[]).some(v=>v.title===view.title)) requests.push({addFilterView:{filter:view}});
    for(const banding of sheet.bandedRanges||[]) if(!(actual?.bandedRanges||[]).some(b=>b.bandedRangeId===banding.bandedRangeId)) requests.push({addBanding:{bandedRange:banding}});
  }
  for(const range of blueprint.namedRanges) {
    const found=current.namedRanges?.find(r=>r.name===range.name);
    if(found) {if(JSON.stringify(found.range)!==JSON.stringify(range.range))return invalid('WORKSPACE_STRUCTURE_INVALID');}
    else requests.push({addNamedRange:{namedRange:{name:range.name,range:range.range}}});
  }
  // Delete only Google's initial empty default sheet, in the same batch after adding required tabs.
  for(const extra of existing.filter(s=>!blueprint.sheets.some(b=>b.properties?.sheetId===s.properties?.sheetId))) {
    if('kind' in current)continue;
    if(extra.properties?.title!=='Sheet1'||cellEntries(extra).some(c=>c.cell.userEnteredValue)) return invalid('WORKSPACE_STRUCTURE_INVALID');
    requests.push({deleteSheet:{sheetId:extra.properties!.sheetId}});
  }
  return requests;
}
function subset(expected:any,actual:any,strictValue=false,key=''):boolean {
  if(expected===null||typeof expected!=='object')return expected===actual||(!strictValue&&actual===undefined&&(expected===false||expected===0||(key==='alpha'&&expected===1)));
  if(Array.isArray(expected))return Array.isArray(actual)&&expected.length===actual.length&&expected.every((v,i)=>subset(v,actual[i],strictValue));
  if(Object.keys(expected).length&&(!actual||typeof actual!=='object'))return false;
  return Object.entries(expected).every(([k,v])=>subset(v,actual?.[k],strictValue||k==='userEnteredValue',k));
}
export function* iterateBlueprintRequestBatches(requests:Iterable<sheets_v4.Schema$Request>):Generator<sheets_v4.Schema$Request[]> {
  let current:sheets_v4.Schema$Request[]=[],bytes=0;
  for(const request of requests) {
    const size=new TextEncoder().encode(JSON.stringify(request)).length;
    if(size>1000000)return invalid('WORKSPACE_BLUEPRINT_INVALID');
    if(current.length&&(current.length>=100||bytes+size>1000000)){yield current;current=[];bytes=0;}
    current.push(request);bytes+=size;
  }
  if(current.length)yield current;
}
export const blueprintRequestBatches=(requests:sheets_v4.Schema$Request[]):sheets_v4.Schema$Request[][]=>[...iterateBlueprintRequestBatches(requests)];
export function verifyBlueprintWorkbook(blueprint:WorkspaceBlueprint,actual:WorkspaceWorkbookInspection|sheets_v4.Schema$Spreadsheet,bindingOnly=false):void {
  assertBlueprint(blueprint,!bindingOnly);
  if(blueprint.operationalTabOwnershipSchema===1){
    const plan=planOwnedOperationalTabs(blueprint,actual);if(plan.requests.length)invalid('WORKSPACE_STRUCTURE_INVALID');return;
  }
  const projectionTitles=new Set((['DRIVERS','CARRIERS','MATERIALS','FLEET_ROSTER'] as const).map(key=>WORKSPACE_TABS[key].tabTitleAr));
  const sheets=bindingOnly?actual.sheets?.filter(sheet=>!projectionTitles.has(sheet.properties?.title||'')):actual.sheets;
  if(sheets?.length!==blueprint.sheets.length || !subset(blueprint.properties,actual.properties))return invalid('WORKSPACE_STRUCTURE_INVALID');
  for(const [i,sheet] of blueprint.sheets.entries()) {
    const target=sheets[i];
    if(target.properties?.title!==sheet.properties?.title || target.properties?.sheetId!==sheet.properties?.sheetId) return invalid('WORKSPACE_STRUCTURE_INVALID');
    if(!subset(sheet.properties?.gridProperties,target.properties?.gridProperties))return invalid('WORKSPACE_STRUCTURE_INVALID');
    const cells=cellEntries(target);
    const byCoordinate=new Map(cells.map(c=>[`${c.row}:${c.column}`,c.cell]));
    if(!bindingOnly&&cells.some(c=>c.cell.effectiveValue?.errorValue?.type==='NAME'||(blueprint.script!.requiredCustomFunctions.length>0&&c.cell.effectiveValue?.errorValue?.type==='LOADING')))return invalid('SCRIPT_FUNCTION_NOT_READY');
    for(const expected of cellEntries(sheet)) {
      const value=byCoordinate.get(`${expected.row}:${expected.column}`);
      if(!subset(expected.cell,value))return invalid('WORKSPACE_STRUCTURE_INVALID');
    }
    for(const property of ['merges','conditionalFormats','charts','protectedRanges','basicFilter','filterViews','bandedRanges','rowGroups','columnGroups'] as const) if(sheet[property]&&!subset(sheet[property],target[property])) return invalid('WORKSPACE_STRUCTURE_INVALID');
    for(const data of sheet.data||[]) {
      for(const [dimension,metadata] of [['rowMetadata',data.rowMetadata],['columnMetadata',data.columnMetadata]] as const) {
        for(const [offset,expected] of (metadata||[]).entries()) {
          const index=offset+(dimension==='rowMetadata'?(data.startRow||0):(data.startColumn||0));
          const grid=(target.data||[]).slice().reverse().find(g=>index>=(dimension==='rowMetadata'?(g.startRow||0):(g.startColumn||0))&&index<(dimension==='rowMetadata'?(g.startRow||0):(g.startColumn||0))+(g[dimension]?.length||0));
          const actualMetadata=grid?.[dimension]?.[index-(dimension==='rowMetadata'?(grid.startRow||0):(grid.startColumn||0))];
          if(Object.keys(expected).length&&!subset(expected,actualMetadata))return invalid('WORKSPACE_STRUCTURE_INVALID');
        }
      }
    }
    const legacyInputTab=REQUIRED_GOOGLE_TABS.indexOf(sheet.properties!.title as typeof REQUIRED_GOOGLE_TABS[number]);
    if(legacyInputTab>=0&&legacyInputTab<2) {
      const input=(legacyInputTab===0?LOADING_WRITABLE:[...OFFLOAD_WRITABLE,'J','K','L']).map(columnIndex);
      if(cells.some(c=>c.row>0&&input.includes(c.column)&&c.cell.userEnteredValue)) return invalid('BLUEPRINT_OPERATIONAL_DATA_FOUND');
    }
  }
  for(const range of blueprint.namedRanges) if(!actual.namedRanges?.some(r=>r.name===range.name&&subset(range.range,r.range)))return invalid('WORKSPACE_STRUCTURE_INVALID');
}
