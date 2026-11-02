import type {WorkspaceWorkbookInspection} from './inspection';
import type {sheets_v4} from 'googleapis';
import type {WorkspaceBlueprint} from './contract';
import {OperationalReportTabRegistry,operationalTabIds,operationalTabByTitle,operationalTabMetadata,assertOperationalTabOwnership,OperationalTabError} from '../operationalReportTabRegistry';
const header=(sheet:sheets_v4.Schema$Sheet)=>sheet.data?.find(g=>(g.startRow||0)===0)?.rowData?.[0]?.values||[];
/** Bounded preserve-and-reproject migration. Old tabs are never claimed, renamed or deleted. */
export function planOwnedOperationalTabs(blueprint:WorkspaceBlueprint,current:WorkspaceWorkbookInspection|sheets_v4.Schema$Spreadsheet,createLegacy?:(blueprint:WorkspaceBlueprint)=>sheets_v4.Schema$Request[]) {
 const requests:sheets_v4.Schema$Request[]=[],drift:string[]=[],conflicts:string[]=[];
 if(blueprint.version.endsWith('_FRESH_V2')&&(current.properties?.locale!==blueprint.properties.locale||current.properties?.timeZone!==blueprint.properties.timeZone)){requests.push({updateSpreadsheetProperties:{properties:{locale:blueprint.properties.locale,timeZone:blueprint.properties.timeZone},fields:'locale,timeZone'}});drift.push('PROFILE_PROPERTIES');}
 const existing=current.sheets||[],used=new Set(existing.map(s=>s.properties?.sheetId));
 const pristine=('kind' in current?current.freshDefaultEmpty||existing.length===0:true)&&existing.every(s=>s.properties?.title==='Sheet1'&&!s.charts?.length&&!s.merges?.length&&!s.protectedRanges?.length&&!s.developerMetadata?.length&&!(s.data||[]).some(g=>(g.rowData||[]).some(r=>(r.values||[]).some(c=>c.userEnteredValue||c.note))));
 const legacy=blueprint.sheets.filter(s=>!operationalTabByTitle(s.properties?.title||''));
 // A positively empty newly created workbook still receives the unchanged Dual legacy foundation.
 // Existing/partial workbooks never enter this branch; no legacy repair/rename is attempted.
 if(pristine&&legacy.length&&createLegacy&&!blueprint.version.endsWith('_FRESH_V2')){
  const definition={...blueprint,operationalTabOwnershipSchema:undefined,templateId:undefined,requiredTabs:undefined,sheets:legacy};
  requests.push(...createLegacy(definition).filter(r=>!r.deleteSheet));
  for(const sheet of legacy)used.add(sheet.properties?.sheetId);
  drift.push('MISSING_LEGACY_FOUNDATION');
 }
 if(blueprint.version.endsWith('_FRESH_V2')){
  const masters=legacy.filter(s=>(s.developerMetadata||[]).some(m=>m.metadataKey==='qsaudi.workspace.master'));
  for(const expected of masters){const marker=expected.developerMetadata![0],owned=existing.filter(s=>(s.developerMetadata||[]).some(m=>m.metadataKey===marker.metadataKey&&m.metadataValue===marker.metadataValue));const named=existing.filter(s=>s.properties?.title===expected.properties?.title);
   if(owned.length>1||!owned.length&&named.length||owned.length&&named.some(s=>s.properties?.sheetId!==owned[0].properties?.sheetId))throw new OperationalTabError('PROFILE_REPORT_TAB_CONFLICT');
   if(owned.length&&(owned[0].developerMetadata||[]).filter(m=>m.metadataKey===marker.metadataKey&&m.metadataValue===marker.metadataValue&&m.visibility==='DOCUMENT'&&m.location?.sheetId===owned[0].properties?.sheetId).length!==1)throw new OperationalTabError('PROFILE_REPORT_TAB_OWNERSHIP_INVALID');
   if(owned.length){if(owned[0].properties?.title!==expected.properties?.title){requests.push({updateSheetProperties:{properties:{sheetId:owned[0].properties!.sheetId,title:expected.properties!.title},fields:'title'}});drift.push('MASTER_TITLE');}continue;}
   let id=expected.properties!.sheetId!;while(used.has(id))id++;used.add(id);
   requests.push({addSheet:{properties:{...expected.properties,sheetId:id}}},{createDeveloperMetadata:{developerMetadata:{...marker,location:{sheetId:id}}}});
   for(const data of expected.data||[])if(data.rowData?.length)requests.push({updateCells:{start:{sheetId:id,rowIndex:0,columnIndex:0},rows:data.rowData,fields:'userEnteredValue'}});drift.push('MISSING_MASTER');
  }
 }
 for(const expected of blueprint.sheets){
  const title=expected.properties!.title!,tabId=operationalTabByTitle(title);if(!tabId)continue;
  const ownership={tabId,templateId:blueprint.templateId!};
  const expectedMarker=JSON.stringify({owner:'QSAUDI_OPERATIONAL_PROFILE',schema:1,templateId:ownership.templateId,tabId});
  const owned=existing.filter(s=>(s.developerMetadata||[]).some(m=>m.metadataKey==='qsaudi.operational.tab'&&m.metadataValue===expectedMarker));
  const named=existing.filter(s=>s.properties?.title===title);
  if(owned.length>1||owned.length&&named.some(s=>s.properties?.sheetId!==owned[0].properties?.sheetId))throw new OperationalTabError('PROFILE_REPORT_TAB_CONFLICT');
  const found=owned.length?owned:named;
  if(found.length>1)throw new OperationalTabError('PROFILE_REPORT_TAB_CONFLICT');
  if(found.length){
   assertOperationalTabOwnership({...found[0],properties:{...found[0].properties,title}},ownership);
   if(found[0].properties?.title!==title){requests.push({updateSheetProperties:{properties:{sheetId:found[0].properties!.sheetId,title},fields:'title'}});drift.push('OWNED_TITLE:'+tabId);}
   if(found[0].merges?.length)throw new OperationalTabError('PROFILE_REPORT_TAB_CONFLICT');
   continue; // Canonical table delivery handles headers; repair never realigns user columns.
  }
  let id=expected.properties!.sheetId!;while(used.has(id))id++;used.add(id);
  requests.push({addSheet:{properties:{...expected.properties,sheetId:id}}},{createDeveloperMetadata:{developerMetadata:operationalTabMetadata(ownership,id)}});
  for(const data of expected.data||[])if(data.rowData?.length)requests.push({updateCells:{start:{sheetId:id,rowIndex:data.startRow||0,columnIndex:data.startColumn||0},rows:data.rowData,fields:'userEnteredValue,userEnteredFormat,dataValidation'}});
  for(const range of expected.protectedRanges||[])requests.push({addProtectedRange:{protectedRange:{...range,range:{...range.range,sheetId:id},unprotectedRanges:range.unprotectedRanges?.map(r=>({...r,sheetId:id}))}}});
  drift.push('MISSING_OWNED_TAB:'+tabId);
 }
 // Bound resource/version verification happens before this planner. Exact old headers and
 // absence of custom content identify compatible previous layouts, never permission to claim them.
 const preservedPreviousTabs=operationalTabIds.flatMap(tabId=>{
  const definition=OperationalReportTabRegistry[tabId];if(tabId==='DASHBOARD')return [];
  const expected=blueprint.sheets.find(s=>s.properties?.title===definition.title),expectedHeaders=expected?header(expected).map(c=>c.userEnteredValue?.stringValue):[];
  return existing.filter(s=>s.properties?.title===definition.previousTitle).map(sheet=>{
   const actualHeaders=header(sheet).map(c=>c.userEnteredValue?.stringValue);
   const plain=!sheet.merges?.length&&!sheet.charts?.length&&!sheet.protectedRanges?.length&&!sheet.developerMetadata?.length&&!(sheet.data||[]).some(g=>(g.rowData||[]).some((r,i)=>(r.values||[]).some((c,index)=>c.note||c.userEnteredValue?.formulaValue||c.pivotTable||c.textFormatRuns?.length||c.dataValidation||((i+(g.startRow||0))>0&&c.userEnteredFormat)||index>=expectedHeaders.length&&c.userEnteredValue)));
   const compatible=!('kind' in current)&&expectedHeaders.length>0&&JSON.stringify(actualHeaders)===JSON.stringify(expectedHeaders)&&plain;
   return {sheetId:sheet.properties!.sheetId!,disposition:compatible?'PRESERVED_PREVIOUS_ENGINE_LAYOUT':'PRESERVED_UNPROVEN'};
  });
 });
 if(blueprint.version.endsWith('_FRESH_V2')&&pristine)for(const sheet of existing)if(sheet.properties?.title==='Sheet1')requests.push({deleteSheet:{sheetId:sheet.properties.sheetId}});
 return {requests,drift,conflicts,preservedPreviousTabs};
}
