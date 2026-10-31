import type { WorkspaceBlueprint } from './contract';
import workbook from './localWorkbook.json';
import scriptFiles from './scriptSource.json';
/** Owner local reference SHA256 7cdcf333cf24cf835c7d146ec63e3c1150d5b4629d0a86d15b2fa0f3fc7eb643.
 * XLSX authoring only; runtime reads this compiled, sanitized RLE/style-deduplicated asset.
 * Script manifest reconstructed from actual service requirements, not exported from Google. */
export const WORKSPACE_BLUEPRINT_VERSION = 'SABIL-HAIL-V1';
const expand=(runs:any[])=>runs.flatMap(([count,item])=>Array.from({length:count},()=>item));
const sheets=workbook.sheets.map((sheet:any)=>({...sheet,data:sheet.data.map((data:any)=>({
  startRow:data.startRow,startColumn:data.startColumn,
  rowMetadata:expand(data.rowMetadataRle),columnMetadata:expand(data.columnMetadataRle),
  rowData:expand(data.rowDataRle).map((row:any)=>({values:row.values.map(({styleRef,...cell}:any)=>({...cell,...(styleRef!==undefined?{userEnteredFormat:workbook.formatPool[styleRef]}:{})}))})),
}))}));
const classify=(name:string):NonNullable<WorkspaceBlueprint['script']>['functions'][number]['kind']=>
  ['onOpen','onEdit'].includes(name)?'SIMPLE_TRIGGER':
  /refresh|calculateCarrier/.test(name)?'REPORT_REFRESH':
  /install|applyOffload|reconcile|WorkflowEdited|SelectionEdited/.test(name)?'VALIDATION_AUTOMATION':
  ['registerTruckArrival','inspectArrivalTicket','addTruckOperationsMenu'].includes(name)?'MENU_UI':'OTHER';
export const approvedSabilHailV1:WorkspaceBlueprint={
  schemaVersion:1,version:WORKSPACE_BLUEPRINT_VERSION,approved:true,
  properties:workbook.properties,sheets,namedRanges:workbook.namedRanges,capture:workbook.capture,
  script:{version:WORKSPACE_BLUEPRINT_VERSION,files:scriptFiles,triggerModel:'SIMPLE_ONLY',requiredCustomFunctions:[],
    functions:[...new Set(scriptFiles.filter(f=>f.type==='SERVER_JS').flatMap(f=>[...f.source.matchAll(/\bfunction\s+([A-Za-z_$][\w$]*)\s*\(/g)].map(m=>m[1])))].sort().map(name=>({name,kind:classify(name)}))},
};
export function activeWorkspaceBlueprint():WorkspaceBlueprint {return approvedSabilHailV1;}
