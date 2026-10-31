import type { sheets_v4 } from 'googleapis';
import { columnIndex } from './contract';
/** Opt-in only after reference/script review. Insertion INSIDE the final prepared formula row
 * lets Sheets adjust bounded report/named/chart references. Never copy operational cell values. */
export function formulaExpansionRequests(sheetId:number,endRowExclusive:number,additionalRows:number,formulaColumns:readonly string[]):sheets_v4.Schema$Request[] {
  if(!Number.isSafeInteger(sheetId)||!Number.isSafeInteger(endRowExclusive)||endRowExclusive<2||!Number.isSafeInteger(additionalRows)||additionalRows<1||additionalRows>1000)throw new Error('WORKSPACE_EXPANSION_INVALID');
  const start=endRowExclusive-1,seed=start+additionalRows;
  const source={sheetId,startRowIndex:seed,endRowIndex:seed+1};
  const destination={sheetId,startRowIndex:start,endRowIndex:seed};
  return [{insertDimension:{range:{sheetId,dimension:'ROWS',startIndex:start,endIndex:seed},inheritFromBefore:true}},
    {copyPaste:{source,destination,pasteType:'PASTE_FORMAT',pasteOrientation:'NORMAL'}},
    {copyPaste:{source,destination,pasteType:'PASTE_DATA_VALIDATION',pasteOrientation:'NORMAL'}},
    ...formulaColumns.map(column=>({copyPaste:{source:{...source,startColumnIndex:columnIndex(column),endColumnIndex:columnIndex(column)+1},destination:{...destination,startColumnIndex:columnIndex(column),endColumnIndex:columnIndex(column)+1},pasteType:'PASTE_FORMULA',pasteOrientation:'NORMAL'}} as sheets_v4.Schema$Request))];
}
