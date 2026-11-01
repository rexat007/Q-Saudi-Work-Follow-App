import {createHash} from 'node:crypto';
import {inspectWorkspaceWorkbook,type InspectionRange} from './workspaceWorkbookInspection';
import {boundedA1,WORKBOOK_READ_LIMITS as READ_LIMITS,type WorkspaceInitializationStage} from '../src/services/googleWorkspaceBlueprint/inspection';
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
import { iterateBlueprintRequestBatches, verifyBlueprintWorkbook, type WorkspaceBlueprint } from '../src/services/googleWorkspaceBlueprint/contract';

/** Human-user OAuth only. No hidden template access, service account, refresh token or files.copy. */
export function projectGoogleBlueprintPort(token:string,projectId:string):GoogleBlueprintPort {
  let deliveryFence:()=>Promise<void>=async()=>{};
  let observe:(stage:WorkspaceInitializationStage,metrics?:Record<string,number>)=>Promise<void>=async()=>{};
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
  const scriptMatches=(actual:Array<{name?:string|null;type?:string|null;source?:string|null}>,expected:NonNullable<WorkspaceBlueprint['script']>['files'])=>{
    if(actual.length!==expected.length||actual.length>100)return false;
    const fingerprints=(files:typeof actual)=>files.map(f=>({name:f.name,type:f.type,hash:createHash('sha256').update(String(f.source||'').replace(/\r\n/g,'\n').trimEnd()).digest('hex')})).sort((a,b)=>String(a.name).localeCompare(String(b.name)));
    const left=fingerprints(actual),right=fingerprints(expected);return new Set(left.map(f=>f.name)).size===left.length&&left.every((f,i)=>f.name===right[i].name&&f.type===right[i].type&&f.hash===right[i].hash);
  };
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
    setInitializationObserver(observer){observe=observer|| (async()=>{});},
    async repairWorkbook(fileId,blueprint){return withWorkspaceGenerationDiagnostic('VERIFY_WORKBOOK',async()=>{
      await owned(fileId,blueprint.version);
      let inspection=await inspectWorkspaceWorkbook(sheets,fileId,blueprint,undefined,undefined,stage=>observe(stage));
      await observe('PLAN_REPAIR',inspection.metrics);const plan=planWorkbookRepair(blueprint,inspection),count=plan.requests.length;
      const affected=new Map<number,InspectionRange[]>();
      const add=(id:number,range:InspectionRange)=>affected.set(id,[...(affected.get(id)||[]),range]);
      for(const request of plan.requests){const u=request.updateCells,d=request.updateDimensionProperties;
        if(u){const start=u.start||u.range!,rows=u.rows?.length||1,columns=Math.max(1,...(u.rows||[]).map(r=>r.values?.length||0));add(start.sheetId!,{row:'rowIndex' in start?start.rowIndex||0:(start as any).startRowIndex||0,column:'columnIndex' in start?start.columnIndex||0:(start as any).startColumnIndex||0,rows,columns});}
        if(d?.range){const r=d.range;add(r.sheetId!,{row:r.dimension==='ROWS'?r.startIndex||0:0,column:r.dimension==='COLUMNS'?r.startIndex||0:0,rows:r.dimension==='ROWS'?(r.endIndex||1)-(r.startIndex||0):1,columns:r.dimension==='COLUMNS'?(r.endIndex||1)-(r.startIndex||0):1});}
      }
      let batchCount=0;
      for(const requests of iterateBlueprintRequestBatches(plan.requests)){await observe('APPLY_REPAIR',{repairRequestCount:count,batchCount:++batchCount});await withWorkspaceGenerationDiagnostic('APPLY_BLUEPRINT',()=>sheets.spreadsheets.batchUpdate({spreadsheetId:fileId,requestBody:{requests}}));}
      if(count){
        // Reuse unchanged canonical evidence; only changed cell/dimension ranges are read again.
        const after=await inspectWorkspaceWorkbook(sheets,fileId,blueprint,inspection,affected,stage=>observe(stage));inspection=after;
      }
      await observe('VERIFY_REPAIR',{...inspection.metrics,repairRequestCount:count,batchCount});
      const remaining=planWorkbookRepair(blueprint,inspection);
      return {repaired:count>0,conflicts:[...remaining.conflicts,...(remaining.requests.length?['WORKBOOK_REPAIR_INCOMPLETE']:[])]};
    });},
    async verifyAutomation(fileId,scriptId,blueprint){await withWorkspaceGenerationDiagnostic('VERIFY_SCRIPT_CONTENT',async()=>{
      assertBlueprint(blueprint,true);if(await scriptParent(scriptId,blueprint.version)!==fileId)return gwsFail('WORKSPACE_STRUCTURE_INVALID');
      const content=await script.projects.getContent({scriptId});
      if(!scriptMatches(content.data.files||[],blueprint.script!.files))return gwsFail('SCRIPT_CONTENT_INSTALL_FAILED');
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
      await owned(fileId,blueprint.version);const workbook=await inspectWorkspaceWorkbook(sheets,fileId,blueprint);verifyBlueprintWorkbook(blueprint,workbook,true);
    });},
    async upsert(fileId,input){
      try {await base.upsert(fileId,input);return;}catch(error){
        if((error as {code?:string}).code!=='TEMPLATE_FORMULA_CAPACITY_EXHAUSTED')throw error;
      }
      await guarded('WORKSPACE_EXPANSION_FAILED',async()=>{
        await owned(fileId);
        const snapshot=await sheets.spreadsheets.get({spreadsheetId:fileId,includeGridData:false,fields:'sheets.properties'},{maxContentLength:READ_LIMITS.metadataBytes});
        const columns=(c:string)=>[...c].reduce((n,v)=>n*26+v.charCodeAt(0)-64,0)-1;
        const requests=[];
        for(const title of ['Loading Register','Offload Data']){
          if(title==='Offload Data' && ![input.arrivalAt,input.offloadCompleteAt,input.warehouseWeightTonnes,input.receiptNo].some(v=>v!==undefined))continue;
          const sheet=snapshot.data.sheets?.find(s=>s.properties?.title===title);
          if(!sheet?.properties?.gridProperties?.rowCount)return gwsFail('WORKSPACE_STRUCTURE_INVALID');
          const allowed=title==='Loading Register'?LOADING_WRITABLE:[...OFFLOAD_WRITABLE,'J','K','L'];
          let empty=false;
          for(let start=1;start<sheet.properties.gridProperties.rowCount&&!empty;start+=READ_LIMITS.rows){
            const rows=Math.min(READ_LIMITS.rows,sheet.properties.gridProperties.rowCount-start);
            const result=await sheets.spreadsheets.values.get({spreadsheetId:fileId,range:boundedA1(title,start,0,rows,29),valueRenderOption:'FORMULA'},{maxContentLength:READ_LIMITS.responseBytes});
            for(let row=0;row<rows;row++)if(allowed.every(c=>result.data.values?.[row]?.[columns(c)]===undefined||result.data.values?.[row]?.[columns(c)]==='')){empty=true;break;}
          }
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
      const inspection=await inspectWorkspaceWorkbook(sheets,fileId,blueprint),plan=planWorkbookRepair(blueprint,inspection);
      if(plan.conflicts.length)return gwsFail('WORKSPACE_STRUCTURE_INVALID');
      for(const requests of iterateBlueprintRequestBatches(plan.requests))await sheets.spreadsheets.batchUpdate({spreadsheetId:fileId,requestBody:{requests}});
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
        const workbook=await inspectWorkspaceWorkbook(sheets,fileId,blueprint);verifyBlueprintWorkbook(blueprint,workbook);
      });
      await withWorkspaceGenerationDiagnostic('VERIFY_SCRIPT_CONTENT',async()=>{
        const content=await script.projects.getContent({scriptId});
        if(!scriptMatches(content.data.files||[],blueprint.script!.files))return gwsFail('SCRIPT_CONTENT_INSTALL_FAILED');
      });
    },
  };
}
