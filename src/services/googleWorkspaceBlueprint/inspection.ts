import type {sheets_v4} from 'googleapis';
/** Canonical snapshots only; never the provider's full workbook/grid response. */
export interface WorkspaceWorkbookInspection {
 kind:'BOUNDED_WORKBOOK_INSPECTION';
 properties?:sheets_v4.Schema$SpreadsheetProperties;
 sheets:sheets_v4.Schema$Sheet[];
 namedRanges?:sheets_v4.Schema$NamedRange[];
 freshDefaultEmpty:boolean;
 metrics:{sheetCount:number;inspectedRangeCount:number;inspectedCellCount:number};
}
export const WORKBOOK_READ_LIMITS={rows:128,columns:32,ranges:4096,cells:200000,sheets:128,responseBytes:2*1024*1024,metadataBytes:4*1024*1024} as const;
export function columnLetter(index:number):string {let n=index+1,s='';do{s=String.fromCharCode(65+(n-1)%26)+s;n=Math.floor((n-1)/26);}while(n);return s;}
export function boundedA1(title:string,row:number,column:number,rows:number,columns:number):string {
 if(!Number.isSafeInteger(row)||row<0||!Number.isSafeInteger(column)||column<0||rows<1||rows>WORKBOOK_READ_LIMITS.rows||columns<1||columns>WORKBOOK_READ_LIMITS.columns)throw Error('WORKSPACE_STRUCTURE_INVALID');
 return `'${title.replace(/'/g,"''")}'!${columnLetter(column)}${row+1}:${columnLetter(column+columns-1)}${row+rows}`;
}

export type WorkspaceInitializationStage='VERIFY_BINDING'|'INSPECT_WORKBOOK_METADATA'|'INSPECT_CANONICAL_RANGES'|'PLAN_REPAIR'|'APPLY_REPAIR'|'VERIFY_REPAIR'|'VERIFY_AUTOMATION';
