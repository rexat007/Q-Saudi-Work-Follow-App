import {classifyGoogleProviderFailure} from './workspaceGoogleErrors';
import { google } from 'googleapis';
import {configureWorkspaceGoogleTransport} from './workspaceGoogleTransport';
import type { GoogleTemplatePort } from '../src/services/projectGoogleWorkspace.server';
import { gwsFail, GoogleWorkspaceCommandError } from '../src/services/projectGoogleWorkspace.server';
import { REQUIRED_GOOGLE_TABS, LOADING_HEADERS, OFFLOAD_HEADERS, LOADING_WRITABLE, OFFLOAD_WRITABLE, sourceCells, writableCells, type OperationalSheetInput } from '../src/services/projectGoogleSheetContract';

export function projectGoogleTemplatePort(token:string,beforeRequest:()=>Promise<void>=async()=>{}):GoogleTemplatePort {
  if(!token?.trim()||token.startsWith('mock_')) return gwsFail('AUTHORIZATION_REQUIRED',401);
  const auth=new google.auth.OAuth2();auth.setCredentials({access_token:token});
  configureWorkspaceGoogleTransport(auth,beforeRequest);
  let accountLabel = '';
  const drive=google.drive({version:'v3',auth}),sheets=google.sheets({version:'v4',auth});
  const guarded=async<T>(context:string,run:()=>Promise<T>):Promise<T>=>{
    try{return await run();}catch(e){if(e instanceof GoogleWorkspaceCommandError) throw e;const failure=classifyGoogleProviderFailure(e);return gwsFail(failure.code,failure.status);}
  };
  const verify=async(fileId:string,operationId?:string)=>{
    await guarded('FILE',async()=>{
      const file=await drive.files.get({fileId,fields:'id,mimeType,trashed,appProperties',supportsAllDrives:true});
      if(file.data.trashed) return gwsFail('PROJECT_WORKSPACE_FILE_MISSING',404);
      if(file.data.mimeType!=='application/vnd.google-apps.spreadsheet') return gwsFail('TEMPLATE_STRUCTURE_INVALID');
      if(operationId&&file.data.appProperties?.qSaudiWorkspaceOperation!==operationId) return gwsFail('WORKSPACE_EXTERNAL_BINDING_INVALID',403);
      const doc=await sheets.spreadsheets.get({spreadsheetId:fileId,fields:'sheets.properties.title,properties.timeZone'});
      if(doc.data.properties?.timeZone!=='Asia/Riyadh') return gwsFail('TEMPLATE_TIMEZONE_INVALID');
      const names=doc.data.sheets?.map(s=>s.properties?.title)||[];
      if(REQUIRED_GOOGLE_TABS.some(t=>!names.includes(t))) return gwsFail('TEMPLATE_STRUCTURE_INVALID');
      const headers=await sheets.spreadsheets.values.batchGet({spreadsheetId:fileId,ranges:["'Loading Register'!A1:AC1","'Offload Data'!A1:Q1"]});
      for(const [i,expected] of [LOADING_HEADERS,OFFLOAD_HEADERS].entries()) {
        const actual=headers.data.valueRanges?.[i]?.values?.[0]||[];
        if(expected.some((v,j)=>actual[j]!==v)) return gwsFail('TEMPLATE_STRUCTURE_INVALID');
      }
    });
  };
  const readGrid=async(fileId:string,tab:string)=> {
    const data=await sheets.spreadsheets.values.get({spreadsheetId:fileId,range:`'${tab}'!A1:AC`,valueRenderOption:'FORMULA'});
    return data.data.values||[];
  };
  const columnIndex=(column:string)=>[...column].reduce((n,c)=>n*26+c.charCodeAt(0)-64,0)-1;
  const rowFor=(rows:unknown[][],key:string,tab:string)=>{
    const matches:number[]=[];let empty=0;
    for(let i=1;i<rows.length;i++) {
      const row=rows[i];
      const rowKey=tab==='Loading Register'?(row[0]!==undefined&&row[14]!==undefined?`${String(row[14]).trim().toUpperCase()}|${String(row[0]).trim()}`:''):String(row[6]||'');
      if(rowKey===key) matches.push(i+1);
      // Formula-filled rows are available. Never reuse a partially entered operator row.
      const inputs=tab==='Loading Register'?LOADING_WRITABLE:[...OFFLOAD_WRITABLE,'J','K','L'];
      if(!empty&&inputs.every(c=>row[columnIndex(c)]===undefined||row[columnIndex(c)]==='')) empty=i+1;
    }
    if(matches.length>1) return gwsFail('SHEET_DUPLICATE_CORRELATION_KEY');
    if(matches.length===1) return matches[0];
    if(!empty) return gwsFail('TEMPLATE_FORMULA_CAPACITY_EXHAUSTED');
    return empty;
  };
  return {
    async subject(){return guarded('AUTH',async()=>{
      const info=await auth.getTokenInfo(token);
      if(!['https://www.googleapis.com/auth/drive.file','https://www.googleapis.com/auth/spreadsheets'].every(scope=>info.scopes.includes(scope))) return gwsFail('SCOPE_DENIED',403);
      const me=await google.oauth2({version:'v2',auth}).userinfo.get();
      accountLabel=me.data.email||me.data.id||'';
      return me.data.id||gwsFail('GOOGLE_SUBJECT_REQUIRED',401);
    });},
    accountLabel:()=>accountLabel,
    async validateTemplate(id){
      try { await verify(id); } catch(e) {
        const code=(e as {code?:string}).code;
        if(code==='PROJECT_WORKSPACE_FILE_MISSING') return gwsFail('TEMPLATE_NOT_FOUND',404);
        if(code==='SCOPE_DENIED'||code==='GOOGLE_PERMISSION_DENIED') return gwsFail('TEMPLATE_ACCESS_DENIED',403);
        throw e;
      }
    },
    async findCopies(operationId){return guarded('FILE',async()=>{
      const result=await drive.files.list({q:`trashed = false and appProperties has { key='qSaudiWorkspaceOperation' and value='${operationId}' } and mimeType='application/vnd.google-apps.spreadsheet'`,fields:'files(id,parents),nextPageToken',pageSize:100,supportsAllDrives:true,includeItemsFromAllDrives:true});
      if(result.data.nextPageToken) return gwsFail('WORKSPACE_DUPLICATE_EXTERNAL_FILES');
      return (result.data.files||[]).map(f=>({id:f.id!,folderId:f.parents?.[0]||''}));
    });},
    async createFolder(name,operationId){return guarded('FILE',async()=>{
      const result=await drive.files.create({requestBody:{name,mimeType:'application/vnd.google-apps.folder',appProperties:{qSaudiWorkspaceOperation:operationId},...(process.env.GOOGLE_PROJECTS_ROOT_FOLDER_ID?{parents:[process.env.GOOGLE_PROJECTS_ROOT_FOLDER_ID]}:{})},fields:'id',supportsAllDrives:true});
      return result.data.id||gwsFail('GOOGLE_FILE_ID_MISSING');
    });},
    async copyTemplate(templateId,name,folderId,operationId){return guarded('TEMPLATE',async()=>{
      const result=await drive.files.copy({fileId:templateId,requestBody:{name,parents:[folderId],appProperties:{qSaudiWorkspaceOperation:operationId}},fields:'id',supportsAllDrives:true});
      return result.data.id||gwsFail('GOOGLE_FILE_ID_MISSING');
    });},
    verify,
    async initializeCopy(fileId){await guarded('FILE',async()=>{
      // Remove copied fixture inputs only, before binding is exposed. Retain formulas, formatting,
      // named ranges and scripts. Review inputs are cleared on NEW copies, never in normal sync.
      for (const [tab,allowed] of [['Loading Register',LOADING_WRITABLE],['Offload Data',[...OFFLOAD_WRITABLE,'J','K','L']]] as Array<[string,readonly string[]]>) {
        const rows=await readGrid(fileId,tab);
        for(const row of rows.slice(1)) for(const column of allowed) {
          const value=row[columnIndex(column)];
          if(typeof value==='string'&&value.startsWith('=')) return gwsFail('SHEET_FORMULA_PROTECTION');
        }
      }
      const ranges=[...LOADING_WRITABLE.map(c=>`'Loading Register'!${c}2:${c}`),...[...OFFLOAD_WRITABLE,'J','K','L'].map(c=>`'Offload Data'!${c}2:${c}`)];
      await sheets.spreadsheets.values.batchClear({spreadsheetId:fileId,requestBody:{ranges}});
    });},
    async upsert(fileId:string,input:OperationalSheetInput){await guarded('FILE',async()=>{
      const mapped=sourceCells(input);
      const requests:Array<{range:string;values:(string|number)[][]}>=[];
      for(const [tab,cells,allow] of [['Loading Register',mapped.loading,LOADING_WRITABLE],...(mapped.hasOffload?[['Offload Data',mapped.offload,OFFLOAD_WRITABLE]]:[])] as Array<[string,Record<string,any>,readonly string[]]>) {
        const grid=await readGrid(fileId,tab),row=rowFor(grid,mapped.key,tab);
        for(const [column,value] of writableCells(cells,allow)) {
          const previous=grid[row-1]?.[columnIndex(column)];
          if(typeof previous==='string'&&previous.startsWith('=')) return gwsFail('SHEET_FORMULA_PROTECTION');
          requests.push({range:`'${tab}'!${column}${row}`,values:[[value as string|number]]});
        }
      }
      await sheets.spreadsheets.values.batchUpdate({spreadsheetId:fileId,requestBody:{valueInputOption:'RAW',data:requests}});
    });},
  };
}
