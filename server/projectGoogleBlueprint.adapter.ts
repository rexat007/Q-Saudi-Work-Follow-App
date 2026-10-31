import {formulaExpansionRequests} from '../src/services/googleWorkspaceBlueprint/expansion';
import {LOADING_WRITABLE,OFFLOAD_WRITABLE,LOADING_FORMULAS,OFFLOAD_FORMULAS} from '../src/services/projectGoogleSheetContract';
import { google } from 'googleapis';
import { projectGoogleTemplatePort } from './projectGoogleTemplate.adapter';
import { WorkspaceStorageBoundary } from './workspace.isolation';
import { GoogleWorkspaceCommandError, gwsFail, workspaceOperation, type GoogleBlueprintPort } from '../src/services/projectGoogleWorkspace.server';
import { blueprintRequests, blueprintRequestBatches, verifyBlueprintWorkbook, type WorkspaceBlueprint } from '../src/services/googleWorkspaceBlueprint/contract';

/** Human-user OAuth only. No hidden template access, service account, refresh token or files.copy. */
export function projectGoogleBlueprintPort(token:string,projectId:string):GoogleBlueprintPort {
  const base=projectGoogleTemplatePort(token),operation=workspaceOperation(projectId);
  const auth=new google.auth.OAuth2();auth.setCredentials({access_token:token});
  const drive=google.drive({version:'v3',auth}),sheets=google.sheets({version:'v4',auth}),script=google.script({version:'v1',auth});
  const guarded=async<T>(code:string,run:()=>Promise<T>):Promise<T>=>{
    try{return await run();}catch(error){
      if(error instanceof GoogleWorkspaceCommandError)throw error;
      const e=error as {code?:number;status?:number;response?:{status?:number}};
      const status=e.response?.status||e.status||e.code;
      return gwsFail(status===401?'TOKEN_EXPIRED':status===403?'SCOPE_DENIED':code,status===401?401:status===403?403:502);
    }
  };
  const owned=async(fileId:string,version?:string)=>{
    const file=await drive.files.get({fileId,fields:'id,trashed,mimeType,appProperties,parents',supportsAllDrives:true});
    if(file.data.trashed||file.data.mimeType!=='application/vnd.google-apps.spreadsheet')return gwsFail('PROJECT_WORKSPACE_FILE_MISSING');
    if(file.data.appProperties?.qSaudiWorkspaceOperation!==operation||file.data.appProperties?.resourceRole!=='SPREADSHEET'||(version&&file.data.appProperties?.workspaceBlueprintVersion!==version))return gwsFail('WORKSPACE_EXTERNAL_BINDING_INVALID',403);
    await new WorkspaceStorageBoundary().assertCanonicalStorage({projectId,settings:{googleSpreadsheetId:fileId,googleDriveFolderId:file.data.parents?.[0]}});
    return file.data;
  };
  const tagged=(role:string,version:string)=>({qSaudiWorkspaceOperation:operation,projectId,resourceRole:role,workspaceBlueprintVersion:version});
  const scriptParent=async(scriptId:string,version?:string)=>{
    const project=await script.projects.get({scriptId});
    if(!project.data.parentId)return gwsFail('WORKSPACE_STRUCTURE_INVALID');
    await owned(project.data.parentId,version);return project.data.parentId;
  };
  const normalizedFiles=(files:Array<{name?:string|null;type?:string|null;source?:string|null}>)=>files.map(({name,type,source})=>({name,type,source:String(source||'').replace(/\r\n/g,'\n').trimEnd()})).sort((a,b)=>String(a.name).localeCompare(String(b.name)));
  /** First provisioning validates only the Picker-granted folder. Migration's ancestry
   * proof is a separate contract: drive.file does not grant unselected ancestors. */
  const validateInitialWorkspaceDestination=async(folderId:string,id:string)=>{
    if(id!==projectId)return gwsFail('FORBIDDEN_PROJECT_ACCESS',403);
    let selectedId:string;
    try {selectedId=await new WorkspaceStorageBoundary().eligibleDestination(projectId,folderId);}
    catch(error){
      const e=error as {code?:string;statusCode?:number};
      const registryCodes=['INVALID_STORAGE_RESOURCE_ID','CURRENT_STORAGE_DESTINATION','STORAGE_TARGET_CONFLICT','PROJECT_NOT_FOUND','PROJECT_REGISTRY_MISMATCH','PERSISTENCE_BOUNDARY_INVALID'];
      if(e.code&&registryCodes.includes(e.code))return gwsFail(e.code,e.statusCode||409);
      return gwsFail('WORKSPACE_REGISTRY_ACCESS_FAILED',503);
    }
    await guarded('DESTINATION_ACCESS_FAILED',async()=>{
      const info=await drive.files.get({fileId:selectedId,fields:'id,mimeType,trashed,driveId,capabilities(canAddChildren)',supportsAllDrives:true});
      if(info.data.trashed||info.data.mimeType!=='application/vnd.google-apps.folder')return gwsFail('DESTINATION_FOLDER_INVALID',400);
      if(info.data.capabilities?.canAddChildren!==true)return gwsFail('DESTINATION_NOT_WRITABLE',403);
    });
  };
  return {...base,
    async upsert(fileId,input){
      try {await base.upsert(fileId,input);return;}catch(error){
        if((error as {code?:string}).code!=='TEMPLATE_FORMULA_CAPACITY_EXHAUSTED')throw error;
      }
      await guarded('WORKSPACE_EXPANSION_FAILED',async()=>{
        await owned(fileId);
        const snapshot=await sheets.spreadsheets.get({spreadsheetId:fileId,includeGridData:true});
        const columns=(c:string)=>[...c].reduce((n,v)=>n*26+v.charCodeAt(0)-64,0)-1;
        const requests=[];
        for(const title of ['Loading Register','Offload Data']){
          if(title==='Offload Data' && ![input.arrivalAt,input.offloadCompleteAt,input.warehouseWeightTonnes,input.receiptNo].some(v=>v!==undefined))continue;
          const sheet=snapshot.data.sheets?.find(s=>s.properties?.title===title);
          if(!sheet?.properties?.gridProperties?.rowCount)return gwsFail('WORKSPACE_STRUCTURE_INVALID');
          const allowed=title==='Loading Register'?LOADING_WRITABLE:[...OFFLOAD_WRITABLE,'J','K','L'];
          const cells=new Map((sheet.data||[]).flatMap(g=>(g.rowData||[]).flatMap((row,r)=>(row.values||[]).map((cell,c)=>[`${r+(g.startRow||0)}:${c+(g.startColumn||0)}`,cell] as const))));
          let empty=false;
          for(let row=1;row<sheet.properties.gridProperties.rowCount;row++)if(allowed.every(c=>!cells.get(`${row}:${columns(c)}`)?.userEnteredValue)){empty=true;break;}
          if(!empty)requests.push(...formulaExpansionRequests(sheet.properties.sheetId!,sheet.properties.gridProperties.rowCount,200,title==='Loading Register'?LOADING_FORMULAS:OFFLOAD_FORMULAS));
        }
        if(!requests.length)return gwsFail('WORKSPACE_EXPANSION_RECONCILIATION_REQUIRED');
        await sheets.spreadsheets.batchUpdate({spreadsheetId:fileId,requestBody:{requests}});
        await base.upsert(fileId,input);
      });
    },
    async authorizeProvisioning(){await guarded('AUTHORIZATION_REQUIRED',async()=>{
      const info=await auth.getTokenInfo(token);
      if(!['https://www.googleapis.com/auth/drive.file','https://www.googleapis.com/auth/spreadsheets','https://www.googleapis.com/auth/script.projects'].every(s=>info.scopes.includes(s)))return gwsFail('SCOPE_DENIED',403);
    });},
    validateDestination:validateInitialWorkspaceDestination,
    async findResource(op,role){return guarded('WORKSPACE_RECOVERY_REQUIRED',async()=>{
      if(op!==operation)return gwsFail('WORKSPACE_EXTERNAL_BINDING_INVALID');
      const result=await drive.files.list({q:`trashed = false and appProperties has { key='qSaudiWorkspaceOperation' and value='${operation}' } and appProperties has { key='resourceRole' and value='${role}' }`,fields:'files(id,parents,appProperties),nextPageToken',pageSize:100,supportsAllDrives:true,includeItemsFromAllDrives:true});
      if(result.data.nextPageToken)return gwsFail('WORKSPACE_RECOVERY_REQUIRED');
      return (result.data.files||[]).map(f=>({id:f.id!,parentId:f.parents?.[0]||''}));
    });},
    async createProjectFolder(name,parentId,op,version){return guarded('PROJECT_FOLDER_CREATION_FAILED',async()=>{
      if(op!==operation)return gwsFail('WORKSPACE_EXTERNAL_BINDING_INVALID');
      const result=await drive.files.create({requestBody:{name,mimeType:'application/vnd.google-apps.folder',parents:[parentId],appProperties:tagged('FOLDER',version)},fields:'id',supportsAllDrives:true});
      return result.data.id||gwsFail('PROJECT_FOLDER_CREATION_FAILED');
    });},
    async createProjectSpreadsheet(name,folderId,op,version){return guarded('SPREADSHEET_GENERATION_FAILED',async()=>{
      if(op!==operation)return gwsFail('WORKSPACE_EXTERNAL_BINDING_INVALID');
      // Native Sheets file + parent/operation marker are created atomically by Drive. A separate
      // Sheets.create + tagging call would leave an unrecoverable untagged-file crash window.
      const result=await drive.files.create({requestBody:{name,mimeType:'application/vnd.google-apps.spreadsheet',parents:[folderId],appProperties:tagged('SPREADSHEET',version)},fields:'id',supportsAllDrives:true});
      return result.data.id||gwsFail('SPREADSHEET_GENERATION_FAILED');
    });},
    async applyBlueprint(fileId,blueprint){await guarded('SPREADSHEET_GENERATION_FAILED',async()=>{
      await owned(fileId,blueprint.version);
      const snapshot=await sheets.spreadsheets.get({spreadsheetId:fileId,includeGridData:true});
      const requests=blueprintRequests(blueprint,snapshot.data);
      for(const batch of blueprintRequestBatches(requests))await sheets.spreadsheets.batchUpdate({spreadsheetId:fileId,requestBody:{requests:batch}});
      await sheets.spreadsheets.batchUpdate({spreadsheetId:fileId,requestBody:{requests:[{updateSpreadsheetProperties:{properties:blueprint.properties,fields:Object.keys(blueprint.properties).join(',')}}]}});
    });},
    async createBoundScript(fileId){return guarded('SCRIPT_PROJECT_CREATION_FAILED',async()=>{
      await owned(fileId);
      const result=await script.projects.create({requestBody:{title:`Project ${projectId} automation`,parentId:fileId}});
      return result.data.scriptId||gwsFail('SCRIPT_PROJECT_CREATION_FAILED');
    });},
    async installScript(scriptId,blueprint){await guarded('SCRIPT_CONTENT_INSTALL_FAILED',async()=>{
      await scriptParent(scriptId,blueprint.version);
      await script.projects.updateContent({scriptId,requestBody:{files:blueprint.script!.files}});
    });},
    async verifyGenerated(fileId,scriptId,blueprint){await guarded('WORKSPACE_STRUCTURE_INVALID',async()=>{
      await owned(fileId,blueprint.version);if(await scriptParent(scriptId,blueprint.version)!==fileId)return gwsFail('WORKSPACE_STRUCTURE_INVALID');
      const workbook=await sheets.spreadsheets.get({spreadsheetId:fileId,includeGridData:true});verifyBlueprintWorkbook(blueprint,workbook.data);
      const content=await script.projects.getContent({scriptId});
      if(JSON.stringify(normalizedFiles(content.data.files||[]))!==JSON.stringify(normalizedFiles(blueprint.script!.files)))return gwsFail('SCRIPT_CONTENT_INSTALL_FAILED');
    });},
  };
}
