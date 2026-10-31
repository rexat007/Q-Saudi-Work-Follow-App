import type { WorkspaceBlueprint } from '../../services/googleWorkspaceBlueprint/contract';
import { LOADING_HEADERS,OFFLOAD_HEADERS,REQUIRED_GOOGLE_TABS,LOADING_FORMULAS,OFFLOAD_FORMULAS } from '../../services/projectGoogleSheetContract';
import { columnIndex } from '../../services/googleWorkspaceBlueprint/contract';
/** Synthetic structural fixture ONLY. Never imported by runtime blueprint selection. */
export function blueprintFixture(version='TEST-V1'):WorkspaceBlueprint {
  const sheets=REQUIRED_GOOGLE_TABS.map((title,index)=>{
    const headers=index===0?LOADING_HEADERS:index===1?OFFLOAD_HEADERS:[title];
    const values=Array.from({length:index<2?29:1},()=>({} as any));
    for(const column of index===0?LOADING_FORMULAS:index===1?OFFLOAD_FORMULAS:[])values[columnIndex(column)]={userEnteredValue:{formulaValue:'=0'}};
    if(index===0)values[19]={userEnteredValue:{formulaValue:'=S2-R2'}};
    return {properties:{sheetId:100+index,title,index,gridProperties:{rowCount:10,columnCount:29,frozenRowCount:1}},data:[{startRow:0,startColumn:0,rowData:[{values:headers.map(stringValue=>({userEnteredValue:{stringValue},userEnteredFormat:{textFormat:{bold:true}}}))},{values}]}]};
  });
  return {schemaVersion:1,version,approved:true,properties:{locale:'en_US',timeZone:'Asia/Riyadh'},sheets,namedRanges:[{name:'InputWeights',range:{sheetId:100,startRowIndex:1,endRowIndex:10,startColumnIndex:17,endColumnIndex:19}}],
    script:{version:'TEST-SCRIPT-V1',files:[{name:'appsscript',type:'JSON',source:JSON.stringify({timeZone:'Asia/Riyadh',runtimeVersion:'V8'})},{name:'Code',type:'SERVER_JS',source:'function onOpen() {}'}],functions:[{name:'onOpen',kind:'SIMPLE_TRIGGER'}],requiredCustomFunctions:[],triggerModel:'SIMPLE_ONLY'},capture:{complete:true,unaccounted:0,operationalRows:0,sourceReferenceIds:[]}};
}
