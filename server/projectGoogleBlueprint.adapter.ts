import {classifyGoogleProviderFailure} from './workspaceGoogleErrors';
import {OperationalReportTabRegistry,OperationalTabError,operationalTabHeaders} from '../src/services/operationalReportTabRegistry';
import {formulaExpansionRequests} from '../src/services/googleWorkspaceBlueprint/expansion';
import {LOADING_WRITABLE,OFFLOAD_WRITABLE,LOADING_FORMULAS,OFFLOAD_FORMULAS} from '../src/services/projectGoogleSheetContract';
import { google } from 'googleapis';
import {missingWorkspaceScopes, missingWorkspaceBindingScopes, workspaceScopeDeniedCode} from '../src/utils/googleWorkspaceScopes';
import { projectGoogleTemplatePort } from './projectGoogleTemplate.adapter';
import {serverWorkspaceService} from './workspace.service';
import {MASTER_TABS,masterTabTitle} from '../src/services/projectWorkspaceMasterContract';
import {planWorkbookRepair} from '../src/services/googleWorkspaceBlueprint/repair';
import {configureWorkspaceGoogleTransport} from './workspaceGoogleTransport';
import {profileTripRow,operationalReportTables} from '../src/services/operationalReporting';
import {resolveWorkspaceTemplate,PROFILE_REVIEW_HEADERS} from '../src/services/workspaceTemplateRegistry';
import {assertBlueprint} from '../src/services/googleWorkspaceBlueprint/contract';
import { WorkspaceStorageBoundary } from './workspace.isolation';
import { GoogleWorkspaceCommandError, gwsFail, workspaceOperation, withWorkspaceGenerationDiagnostic, type GoogleBlueprintPort } from '../src/services/projectGoogleWorkspace.server';
import { blueprintRequests, blueprintRequestBatches, verifyBlueprintWorkbook, type WorkspaceBlueprint } from '../src/services/googleWorkspaceBlueprint/contract';

/** Human-user OAuth only. No hidden template access, service account, refresh token or files.copy. */
export function projectGoogleBlueprintPort(token:string,projectId:string):GoogleBlueprintPort {
  let deliveryFence:()=>Promise<void>=async()=>{};
  const base=projectGoogleTemplatePort(token,()=>deliveryFence()),operation=workspaceOperation(projectId);
  const auth=new google.auth.OAuth2();auth.setCredentials({access_token:token});
  configureWorkspaceGoogleTransport(auth,()=>deliveryFence());
  const drive=google.drive({version:'v3',auth}),sheets=google.sheets({version:'v4',auth}),script=google.script({version:'v1',auth});
  const guarded=async<T>(code:string,run:()=>Promise<T>):Promise<T>=>{
    try{return await run();}catch(error){
      if(error instanceof GoogleWorkspaceCommandError)throw error;
      if(error instanceof OperationalTabError)return gwsFail(error.code,409);
      const failure=classifyGoogleProviderFailure(error);return gwsFail(failure.code,failure.status);
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
    async projectProfileReports(fileId,report){
      if(report.rows.some(row=>row.projectId!==projectId)||!report.configuration)return gwsFail('WORKSPACE_EVENT_SCOPE_INVALID',403);
      await guarded('PROFILE_REPORT_SYNC_FAILED',()=>owned(fileId));
      const template=resolveWorkspaceTemplate(report.configuration),templateId=template.templateId;
      // Migration rehydrates the new owned register even when old V1 outbox events were delivered.
      await guarded(OperationalReportTabRegistry.TRIPS.failureCode,()=>serverWorkspaceService.upsertTabRecords(fileId,OperationalReportTabRegistry.TRIPS.title,'tripId',report.rows,[...template.headers,...PROFILE_REVIEW_HEADERS],token,'RAW',()=>deliveryFence(),true,{tabId:'TRIPS',templateId}));
      // Audit is append-only local review evidence; never snapshot-clear it.
      await guarded(OperationalReportTabRegistry.AUDIT.failureCode,()=>serverWorkspaceService.upsertTabRecords(fileId,OperationalReportTabRegistry.AUDIT.title,'Trip ID',[],operationalTabHeaders('AUDIT'),token,'RAW',()=>deliveryFence(),true,{tabId:'AUDIT',templateId}));
      for(const table of operationalReportTables(report))await guarded(OperationalReportTabRegistry[table.tabId].failureCode,()=>serverWorkspaceService.reconcileTabSnapshot(fileId,table.title,table.key,table.rows,table.columns,token,'RAW',()=>deliveryFence(),{tabId:table.tabId,templateId}));
    },
    async projectProfileTrip(fileId,trip,blueprint){await guarded(OperationalReportTabRegistry.TRIPS.failureCode,async()=>{
      if(trip.projectId!==projectId||!trip.operationalSnapshot)return gwsFail('WORKSPACE_EVENT_SCOPE_INVALID',403);
      const template=resolveWorkspaceTemplate(trip.operationalSnapshot.configuration);
      if(blueprint.templateId&&blueprint.templateId!==template.templateId)return gwsFail('WORKSPACE_TEMPLATE_MIGRATION_REQUIRED');
      await owned(fileId);const row=profileTripRow(trip);
      await serverWorkspaceService.upsertTabRecords(fileId,OperationalReportTabRegistry.TRIPS.title,'tripId',[row],[...template.headers,...PROFILE_REVIEW_HEADERS],token,'RAW',()=>deliveryFence(),true,{tabId:'TRIPS',templateId:template.templateId});
    });},
    async verifyScriptParent(fileId,scriptId,version){await withWorkspaceGenerationDiagnostic('VERIFY_SCRIPT_CONTENT',async()=>{if(await scriptParent(scriptId,version)!==fileId)return gwsFail('WORKSPACE_EXTERNAL_BINDING_INVALID',403);});},
    setDeliveryFence(check){deliveryFence=check;},
    async repairWorkbook(fileId,blueprint){return withWorkspaceGenerationDiagnostic('VERIFY_WORKBOOK',async()=>{
      await owned(fileId,blueprint.version);
      const before=await sheets.spreadsheets.get({spreadsheetId:fileId,includeGridData:true});
      const plan=planWorkbookRepair(blueprint,before.data);
      for(const requests of blueprintRequestBatches(plan.requests))await withWorkspaceGenerationDiagnostic('APPLY_BLUEPRINT',()=>sheets.spreadsheets.batchUpdate({spreadsheetId:fileId,requestBody:{requests}}));
      const after=await sheets.spreadsheets.get({spreadsheetId:fileId,includeGridData:true});
      const remaining=planWorkbookRepair(blueprint,after.data);
      return {repaired:plan.requests.length>0,conflicts:[...remaining.conflicts,...(remaining.requests.length?['WORKBOOK_REPAIR_INCOMPLETE']:[])]};
    });},
    async verifyAutomation(fileId,scriptId,blueprint){await withWorkspaceGenerationDiagnostic('VERIFY_SCRIPT_CONTENT',async()=>{
      assertBlueprint(blueprint,true);if(await scriptParent(scriptId,blueprint.version)!==fileId)return gwsFail('WORKSPACE_STRUCTURE_INVALID');
      const content=await script.projects.getContent({scriptId});
      if(JSON.stringify(normalizedFiles(content.data.files||[]))!==JSON.stringify(normalizedFiles(blueprint.script!.files)))return gwsFail('SCRIPT_CONTENT_INSTALL_FAILED');
    });},
    async projectMasterTabs(fileId,snapshot,tabs){await guarded('MASTER_DATA_SYNC_FAILED',async()=>{
      if(snapshot.projectId!==projectId)return gwsFail('WORKSPACE_EVENT_SCOPE_INVALID',403);
      if(!tabs.length||tabs.some(tab=>!MASTER_TABS.some(spec=>spec.key===tab)))return gwsFail('WORKSPACE_EVENT_SCOPE_INVALID',403);
      for(const spec of MASTER_TABS.filter(spec=>tabs.includes(spec.key))){
        const rows=snapshot[spec.source];const ids=new Set<string>();
        for(const row of rows){const id=row[spec.primaryKey];if(row.projectId!==projectId||typeof id!=='string'||!id||ids.has(id))return gwsFail('WORKSPACE_EVENT_SCOPE_INVALID',403);ids.add(id);}
      }
      await owned(fileId);
      for(const spec of MASTER_TABS.filter(spec=>tabs.includes(spec.key)))await serverWorkspaceService.reconcileTabSnapshot(fileId,masterTabTitle(spec.key),spec.primaryKey,snapshot[spec.source],spec.columns,token,'RAW',()=>deliveryFence());
    });},
    async authorizeBinding(){await guarded('AUTHORIZATION_REQUIRED',async()=>{
      const info=await auth.getTokenInfo(token),missing=missingWorkspaceBindingScopes(info.scopes);
      if(missing.length)return gwsFail(workspaceScopeDeniedCode(missing),403);
    });},
    async verifyBinding(rootId,folderId,fileId,version){return guarded('BOUND_FILE_UNAVAILABLE',async()=>{
      const root=await drive.files.get({fileId:rootId,fields:'mimeType,trashed',supportsAllDrives:true});
      const folder=await drive.files.get({fileId:folderId,fields:'mimeType,trashed,parents,appProperties',supportsAllDrives:true});
      const file=await drive.files.get({fileId,fields:'name,mimeType,trashed,parents,appProperties',supportsAllDrives:true});
      if(root.data.trashed||root.data.mimeType!=='application/vnd.google-apps.folder'||folder.data.trashed||folder.data.mimeType!=='application/vnd.google-apps.folder'||file.data.trashed||file.data.mimeType!=='application/vnd.google-apps.spreadsheet')return gwsFail('BOUND_FILE_UNAVAILABLE',404);
      if(!folder.data.parents?.includes(rootId)||!file.data.parents?.includes(folderId))return gwsFail('BOUND_FILE_UNAVAILABLE',409);
      for(const [info,role] of [[folder.data,'FOLDER'],[file.data,'SPREADSHEET']] as const){
        if(info.appProperties?.projectId!==projectId||info.appProperties?.qSaudiWorkspaceOperation!==operation||info.appProperties?.resourceRole!==role||info.appProperties?.workspaceBlueprintVersion!==version)return gwsFail('WORKSPACE_EXTERNAL_BINDING_INVALID',403);
      }
      await new WorkspaceStorageBoundary().assertCanonicalStorage({projectId,settings:{googleSpreadsheetId:fileId,googleDriveFolderId:folderId}});
      return {title:file.data.name||''};
    });},
    async verifyWorkbook(fileId,blueprint){await withWorkspaceGenerationDiagnostic('VERIFY_WORKBOOK',async()=>{
      await owned(fileId,blueprint.version);const workbook=await sheets.spreadsheets.get({spreadsheetId:fileId,includeGridData:true});verifyBlueprintWorkbook(blueprint,workbook.data,true);
    });},
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
      const missingScopes=missingWorkspaceScopes(info.scopes);
      if(missingScopes.length)return gwsFail(Array.isArray(info.scopes) ? workspaceScopeDeniedCode(missingScopes) : 'SCOPE_DENIED',403);
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
    async applyBlueprint(fileId,blueprint){await withWorkspaceGenerationDiagnostic('APPLY_BLUEPRINT',async()=>{
      await owned(fileId,blueprint.version);
      const snapshot=await sheets.spreadsheets.get({spreadsheetId:fileId,includeGridData:true});
      const requests=blueprintRequests(blueprint,snapshot.data,true);
      for(const batch of blueprintRequestBatches(requests))await sheets.spreadsheets.batchUpdate({spreadsheetId:fileId,requestBody:{requests:batch}});
      await sheets.spreadsheets.batchUpdate({spreadsheetId:fileId,requestBody:{requests:[{updateSpreadsheetProperties:{properties:blueprint.properties,fields:Object.keys(blueprint.properties).join(',')}}]}});
    });},
    async createBoundScript(fileId){return withWorkspaceGenerationDiagnostic('CREATE_BOUND_SCRIPT',async()=>{
      await owned(fileId);
      const result=await script.projects.create({requestBody:{title:`Project ${projectId} automation`,parentId:fileId}});
      return result.data.scriptId||gwsFail('SCRIPT_PROJECT_CREATION_FAILED');
    });},
    async installScript(scriptId,blueprint){await withWorkspaceGenerationDiagnostic('INSTALL_SCRIPT_CONTENT',async()=>{
      await scriptParent(scriptId,blueprint.version);
      await script.projects.updateContent({scriptId,requestBody:{files:blueprint.script!.files}});
    });},
    async verifyGenerated(fileId,scriptId,blueprint){
      await withWorkspaceGenerationDiagnostic('VERIFY_WORKBOOK',()=>owned(fileId,blueprint.version));
      await withWorkspaceGenerationDiagnostic('VERIFY_SCRIPT_CONTENT',async()=>{if(await scriptParent(scriptId,blueprint.version)!==fileId)return gwsFail('WORKSPACE_STRUCTURE_INVALID');});
      await withWorkspaceGenerationDiagnostic('VERIFY_WORKBOOK',async()=>{
        const workbook=await sheets.spreadsheets.get({spreadsheetId:fileId,includeGridData:true});verifyBlueprintWorkbook(blueprint,workbook.data);
      });
      await withWorkspaceGenerationDiagnostic('VERIFY_SCRIPT_CONTENT',async()=>{
        const content=await script.projects.getContent({scriptId});
        if(JSON.stringify(normalizedFiles(content.data.files||[]))!==JSON.stringify(normalizedFiles(blueprint.script!.files)))return gwsFail('SCRIPT_CONTENT_INSTALL_FAILED');
      });
    },
  };
}
