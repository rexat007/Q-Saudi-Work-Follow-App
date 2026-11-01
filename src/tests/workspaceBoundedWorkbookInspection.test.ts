import {describe,it,expect,vi,beforeEach} from 'vitest';
const f=vi.hoisted(()=>({api:null as any,drive:vi.fn(),create:vi.fn(),scriptGet:vi.fn(),content:vi.fn(),install:vi.fn()}));
vi.mock('googleapis',()=>({google:{auth:{OAuth2:class{setCredentials(){}async getTokenInfo(){return {scopes:['https://www.googleapis.com/auth/drive.file','https://www.googleapis.com/auth/spreadsheets','https://www.googleapis.com/auth/script.projects']}}}},drive:()=>({files:{get:f.drive,create:f.create}}),sheets:()=>f.api,script:()=>({projects:{get:f.scriptGet,getContent:f.content,updateContent:f.install,create:f.create}}),oauth2:()=>({userinfo:{get:async()=>({data:{id:'subject'}})}})}}));
vi.mock('../../server/workspace.isolation',async original=>({...await original<any>(),WorkspaceStorageBoundary:class{async assertCanonicalStorage(){}}}));
import {projectGoogleBlueprintPort} from '../../server/projectGoogleBlueprint.adapter';
import {inspectWorkspaceWorkbook} from '../../server/workspaceWorkbookInspection';
import {WORKBOOK_READ_LIMITS as L} from '../services/googleWorkspaceBlueprint/inspection';
import {iterateBlueprintRequestBatches,blueprintRequestBatches} from '../services/googleWorkspaceBlueprint/contract';
import {planWorkbookRepair} from '../services/googleWorkspaceBlueprint/repair';
import {ProjectGoogleWorkspaceServer,workspaceOperation} from '../services/projectGoogleWorkspace.server';
import {resolveWorkspaceTemplate} from '../services/workspaceTemplateRegistry';
import {operationConfig,operationGraph,operationActor} from './helpers/operationalProfileFixture';
import {workbookInspectionFixture} from './helpers/workbookInspectionFixture';
import {blueprintFixture} from './helpers/workspaceBlueprintFixture';
import {setTestDbOverride} from '../firebase/admin';
import {markDirtyInTransaction} from '../services/projectWorkspaceProjectionState.server';
const path='projects/P1/workspace_continuity/current';
beforeEach(()=>{vi.resetAllMocks();f.drive.mockImplementation(async({fileId}:any)=>({data:{mimeType:fileId==='file'?'application/vnd.google-apps.spreadsheet':'application/vnd.google-apps.folder',parents:[fileId==='file'?'folder':'root'],appProperties:{projectId:'P1',qSaudiWorkspaceOperation:workspaceOperation('P1'),resourceRole:fileId==='file'?'SPREADSHEET':'FOLDER',workspaceBlueprintVersion:fileId==='test-file'?'TEST-V1':'SABIL-HAIL-V1'}}}));f.scriptGet.mockResolvedValue({data:{parentId:'file'}});});
function range(text:string){const m=text.match(/^'((?:[^']|'')*)'!([A-Z]+)(\d+):([A-Z]+)(\d+)$/);expect(m).not.toBeNull();const col=(s:string)=>[...s].reduce((n,c)=>n*26+c.charCodeAt(0)-64,0);return {title:m![1].replace(/''/g,"'"),rows:+m![5]-+m![3]+1,columns:col(m![4])-col(m![2])+1};}
function assertBounded(calls:any[]){for(const [args,options] of calls){expect(options?.maxContentLength).toBeGreaterThan(0);expect(options.maxContentLength).toBeLessThanOrEqual(L.metadataBytes);if(args.includeGridData){expect(args.ranges).toHaveLength(1);const r=range(args.ranges[0]);expect(r.rows).toBeLessThanOrEqual(L.rows);expect(r.columns).toBeLessThanOrEqual(L.columns);}else{expect(args.fields).toBeTruthy();expect(args.fields).not.toContain('rowData');}}}
function setupLarge(){
 const config=operationConfig('WEIGHBRIDGE','WEIGHBRIDGE'),blueprint=resolveWorkspaceTemplate(config).blueprint;let legacyReads=0;
 const titles=['Loading Register','Offload Data','Offload Operations Audit','Daily Summary','Carrier Report Viewer','Carrier Daily Report','Dashboard',...Array.from({length:8},(_,i)=>'Historical '+i)];
 const sheets=titles.map((title,i)=>{const sheet:any={properties:{sheetId:i+1,title,gridProperties:{rowCount:2000000,columnCount:1000}},merges:[{sheetId:i+1,startRowIndex:0,endRowIndex:2,startColumnIndex:0,endColumnIndex:3}]};Object.defineProperty(sheet,'data',{enumerable:true,get(){legacyReads++;throw Error('legacy grid must not be materialized');}});return sheet;});
 const fixture=workbookInspectionFixture({properties:blueprint.properties,sheets});f.api={spreadsheets:{get:fixture.get,batchUpdate:fixture.update}};
 const x=operationGraph(config,false);setTestDbOverride(x.db);x.store['projects/P1'].status='SETUP';const binding={projectId:'P1',spreadsheetId:'file',projectFolderId:'folder',destinationRootFolderId:'root',googleSubject:'subject',revision:1,workspaceBlueprintVersion:'SABIL-HAIL-V1',appsScriptBlueprintVersion:blueprint.script!.version,scriptProjectId:'existing-script'};
 x.store[path]={projectId:'P1',binding,state:'READY',backgroundAuthorization:'CONNECTED',backgroundAuthorizationId:'G',workbookHealth:'REPAIR_REQUIRED',scriptProjectId:'existing-script'};x.store['workspace_google_authorizations/G']={projectId:'P1',actorId:'actor',subject:'subject',spreadsheetId:'file',bindingRevision:1,status:'ACTIVE'};
 f.content.mockResolvedValue({data:{files:blueprint.script!.files}});
 const service=new ProjectGoogleWorkspaceServer(x.db).forExecutionAuthorization('G'),port=projectGoogleBlueprintPort('fixture-token','P1');
 // Structural acceptance is separate from master-row transport; keep real owned Ops projection/Script checks.
 port.projectMasterTabs=vi.fn(async()=>{});return {...x,fixture,service,port,binding,legacyReads:()=>legacyReads};
}
describe('bounded metadata and canonical inspection contracts',()=>{
 it('normalizes only bounded canonical evidence and never retains extra historical grids',async()=>{
  const b=blueprintFixture(),book={properties:b.properties,sheets:structuredClone(b.sheets),namedRanges:structuredClone(b.namedRanges)};book.sheets[0].properties!.gridProperties!.rowCount=2000000;
  const provider=workbookInspectionFixture(book),api={spreadsheets:{get:provider.get}} as any,inspection=await inspectWorkspaceWorkbook(api,'file',b);
  expect(inspection.kind).toBe('BOUNDED_WORKBOOK_INSPECTION');expect(inspection.metrics.inspectedCellCount).toBeLessThan(1000);expect(planWorkbookRepair(b,inspection)).toMatchObject({requests:[],conflicts:[]});assertBounded(provider.get.mock.calls);
 });
 it('a single header repair rechecks precisely that cell and metadata, then becomes a no-op',async()=>{
  const b=blueprintFixture(),book={properties:b.properties,sheets:structuredClone(b.sheets),namedRanges:structuredClone(b.namedRanges)};book.sheets[0].data![0].rowData![0].values![0]={};const provider=workbookInspectionFixture(book);f.api={spreadsheets:{get:provider.get,batchUpdate:provider.update}};
  f.drive.mockResolvedValue({data:{mimeType:'application/vnd.google-apps.spreadsheet',parents:['folder'],appProperties:{qSaudiWorkspaceOperation:workspaceOperation('P1'),resourceRole:'SPREADSHEET',workspaceBlueprintVersion:'TEST-V1'}}});
  const port=projectGoogleBlueprintPort('fixture-token','P1');expect(await port.repairWorkbook!('file',b)).toEqual({repaired:true,conflicts:[]});const afterWrites=provider.get.mock.invocationCallOrder.map((order,i)=>({order,call:provider.get.mock.calls[i][0]})).filter(v=>v.order>provider.update.mock.invocationCallOrder[0]&&v.call.includeGridData);expect(afterWrites.map(v=>v.call.ranges)).toEqual([["'Loading Register'!A1:A1"]]);
  const writes=provider.update.mock.calls.length;expect(await port.repairWorkbook!('file',b)).toEqual({repaired:false,conflicts:[]});expect(provider.update).toHaveBeenCalledTimes(writes);assertBounded(provider.get.mock.calls);
 });
 it('short damaged grids are expanded before reading repaired cells beyond their old dimensions',async()=>{
  const b=blueprintFixture(),book={properties:b.properties,sheets:structuredClone(b.sheets),namedRanges:structuredClone(b.namedRanges)};
  book.sheets[0].properties!.gridProperties={rowCount:1,columnCount:2};book.sheets[0].data![0].rowData=[{values:book.sheets[0].data![0].rowData![0].values!.slice(0,2)}];
  const provider=workbookInspectionFixture(book);f.api={spreadsheets:{get:provider.get,batchUpdate:provider.update}};f.drive.mockResolvedValue({data:{mimeType:'application/vnd.google-apps.spreadsheet',appProperties:{qSaudiWorkspaceOperation:workspaceOperation('P1'),resourceRole:'SPREADSHEET',workspaceBlueprintVersion:b.version}}});
  expect(await projectGoogleBlueprintPort('fixture-token','P1').repairWorkbook!('file',b)).toEqual({repaired:true,conflicts:[]});expect(provider.get.mock.calls[1][0].ranges).toEqual(["'Loading Register'!A1:B1"]);assertBounded(provider.get.mock.calls);
 });
 it('dimension metadata repair re-reads changed dimension evidence and converges without a second write',async()=>{
  const b=blueprintFixture();b.sheets[0].data![0].rowMetadata=[{pixelSize:35},{pixelSize:40}];b.sheets[0].data![0].columnMetadata=[{pixelSize:170}];
  const book={properties:b.properties,sheets:structuredClone(b.sheets),namedRanges:structuredClone(b.namedRanges)};book.sheets[0].data![0].rowMetadata![1]={pixelSize:20};
  const provider=workbookInspectionFixture(book);f.api={spreadsheets:{get:provider.get,batchUpdate:provider.update}};f.drive.mockResolvedValue({data:{mimeType:'application/vnd.google-apps.spreadsheet',appProperties:{qSaudiWorkspaceOperation:workspaceOperation('P1'),resourceRole:'SPREADSHEET',workspaceBlueprintVersion:b.version}}});
  const port=projectGoogleBlueprintPort('fixture-token','P1');expect(await port.repairWorkbook!('file',b)).toEqual({repaired:true,conflicts:[]});expect(provider.update.mock.calls.flatMap(c=>c[0].requestBody.requests)).toEqual([expect.objectContaining({updateDimensionProperties:expect.objectContaining({range:expect.objectContaining({startIndex:1,endIndex:2,dimension:'ROWS'})})})]);
  const writes=provider.update.mock.calls.length;expect(await port.repairWorkbook!('file',b)).toEqual({repaired:false,conflicts:[]});expect(provider.update).toHaveBeenCalledTimes(writes);assertBounded(provider.get.mock.calls);
 });
 it('metadata-only extras, including an unproven default tab, cannot be deleted or treated as empty',async()=>{
  const b=blueprintFixture(),book={properties:b.properties,sheets:[...structuredClone(b.sheets),{properties:{sheetId:0,title:'Sheet1',gridProperties:{rowCount:2000000,columnCount:1000}}}],namedRanges:b.namedRanges};const provider=workbookInspectionFixture(book);const model=await inspectWorkspaceWorkbook({spreadsheets:{get:provider.get}} as any,'file',b);expect(planWorkbookRepair(b,model).requests.some(r=>r.deleteSheet)).toBe(false);expect(provider.get.mock.calls.filter(c=>c[0].includeGridData).every(c=>!c[0].ranges[0].startsWith("'Sheet1'!"))).toBe(true);
 });
 it('oversized structural inventories fail closed before any grid read',async()=>{
  const b=blueprintFixture(),get=vi.fn(async()=>({data:{sheets:Array.from({length:L.sheets+1},(_,i)=>({properties:{sheetId:i,title:'Tab '+i}}))}}));await expect(inspectWorkspaceWorkbook({spreadsheets:{get}} as any,'file',b)).rejects.toHaveProperty('code','WORKSPACE_STRUCTURE_INVALID');expect(get).toHaveBeenCalledOnce();
 });
 it('a ranged response with a different numeric sheet identity cannot become repair evidence',async()=>{
  const b=blueprintFixture(),provider=workbookInspectionFixture({properties:b.properties,sheets:b.sheets,namedRanges:b.namedRanges});const get=vi.fn(async(args:any)=>{const response=await provider.get(args);if(args.includeGridData)response.data.sheets[0].properties.sheetId=999;return response;});await expect(inspectWorkspaceWorkbook({spreadsheets:{get}} as any,'file',b)).rejects.toHaveProperty('code','WORKSPACE_STRUCTURE_INVALID');
 });
 it('request batches stream and honor count/byte ceilings without consuming the whole iterator first',()=>{
  let produced=0;function* source(){for(let i=0;i<250;i++){produced++;yield {updateCells:{start:{sheetId:1,rowIndex:i,columnIndex:0},rows:[{values:[{userEnteredValue:{stringValue:'x'}}]}],fields:'userEnteredValue'}};}}
  const batches=iterateBlueprintRequestBatches(source()),first=batches.next();expect(first.value).toHaveLength(100);expect(produced).toBeLessThan(250);for(const batch of [first.value,...batches]){expect(batch.length).toBeLessThanOrEqual(100);expect(Buffer.byteLength(JSON.stringify(batch))).toBeLessThanOrEqual(1000002);}expect(()=>blueprintRequestBatches([{updateCells:{rows:[{values:[{userEnteredValue:{stringValue:'x'.repeat(1000001)}}]}]}}])).toThrow('WORKSPACE_BLUEPRINT_INVALID');
 });
});
describe('large legacy workbook actual initialization without whole-grid materialization',()=>{
 it('repairs the same 24-tab workbook, preserves legacy Dashboard and Script identity, and is idempotent',async()=>{
  const x=setupLarge(),stages:string[]=[];const run=x.db.runTransaction;x.db.runTransaction=async(fn:Function)=>{const result=await run(fn),stage=x.store[path]?.lastInitializationStage;if(stage&&stages.at(-1)!==stage)stages.push(stage);return result;};
  await x.service.initializeBound('P1',operationActor,x.port);expect(x.legacyReads()).toBe(0);expect(x.fixture.book.sheets).toHaveLength(24);expect(x.store[path]).toMatchObject({binding:x.binding,workbookHealth:'HEALTHY',automationState:'READY',syncOwner:null});expect(f.create).not.toHaveBeenCalled();expect(f.install).not.toHaveBeenCalled();assertBounded(x.fixture.get.mock.calls);
  expect(stages).toEqual(expect.arrayContaining(['VERIFY_BINDING','INSPECT_WORKBOOK_METADATA','INSPECT_CANONICAL_RANGES','PLAN_REPAIR','APPLY_REPAIR','VERIFY_REPAIR','VERIFY_AUTOMATION']));const created=x.fixture.update.mock.calls.flatMap(c=>c[0].requestBody.requests).filter(r=>r.addSheet).length;
  await x.service.initializeBound('P1',operationActor,x.port);expect(x.store[path].lastInitializationMetrics.repairRequestCount).toBe(0);expect(x.fixture.update.mock.calls.flatMap(c=>c[0].requestBody.requests).filter(r=>r.addSheet)).toHaveLength(created);expect(x.legacyReads()).toBe(0);expect(x.fixture.update.mock.calls.flatMap(c=>c[0].requestBody.requests).some(r=>r.deleteSheet||r.updateCells?.start?.sheetId===7||r.updateCells?.range?.sheetId===7)).toBe(false);
 });
 it.each(['metadata','write'])('a bounded %s failure keeps the process/binding/pending work and releases the owned lease',async stage=>{
  const x=setupLarge();await x.db.runTransaction((tx:any)=>markDirtyInTransaction(tx,'P1',['CARRIERS'],'TEST',undefined,x.db));
  if(stage==='metadata')x.fixture.get.mockRejectedValueOnce({response:{status:503}});
  if(stage==='write')x.fixture.update.mockRejectedValueOnce({response:{status:503}});
  await x.service.initializeBound('P1',operationActor,x.port);expect(x.store[path]).toMatchObject({binding:x.binding,workbookHealth:'DEGRADED',syncOwner:null,state:'SYNC_DEGRADED'});expect(x.store['projects/P1/workspace_sync_outbox/MASTER_DATA'].status).toBe('PENDING');expect(f.create).not.toHaveBeenCalled();expect(f.scriptGet).not.toHaveBeenCalled();expect(x.port.projectMasterTabs).not.toHaveBeenCalled();expect(x.legacyReads()).toBe(0);
  await x.service.initializeBound('P1',operationActor,x.port);expect(x.store[path].workbookHealth).toBe('HEALTHY');
 });
 it('a canonical range response-size failure leaves pending work intact and a later bounded retry recovers',async()=>{
  const x=setupLarge(),b=blueprintFixture();delete x.store['projects/P1'].operationalConfiguration;
  x.store[path].binding={...x.binding,workspaceBlueprintVersion:b.version,appsScriptBlueprintVersion:b.script!.version};
  const binding=structuredClone(x.store[path].binding),provider=workbookInspectionFixture({properties:b.properties,sheets:structuredClone(b.sheets),namedRanges:structuredClone(b.namedRanges)});let failRange=true;
  const get=vi.fn(async(args:any,options:any)=>{if(args.includeGridData&&failRange){failRange=false;throw Object.assign(Error('response exceeds size budget'),{type:'max-size'});}return provider.get(args);});
  f.api={spreadsheets:{get,batchUpdate:provider.update}};f.drive.mockResolvedValue({data:{mimeType:'application/vnd.google-apps.spreadsheet',appProperties:{qSaudiWorkspaceOperation:workspaceOperation('P1'),resourceRole:'SPREADSHEET',workspaceBlueprintVersion:b.version}}});f.content.mockResolvedValue({data:{files:b.script!.files}});
  const service=new ProjectGoogleWorkspaceServer(x.db,undefined,()=>b).forExecutionAuthorization('G'),port=projectGoogleBlueprintPort('fixture-token','P1');port.verifyBinding=vi.fn(async()=>({title:'Project Sheet'}));port.projectMasterTabs=vi.fn(async()=>{});
  await x.db.runTransaction((tx:any)=>markDirtyInTransaction(tx,'P1',['CARRIERS'],'TEST',undefined,x.db));
  await service.initializeBound('P1',operationActor,port);expect(get.mock.calls.some(([args])=>args.includeGridData)).toBe(true);expect(x.store[path]).toMatchObject({binding,workbookHealth:'DEGRADED',syncOwner:null,lastInitializationStage:'INSPECT_CANONICAL_RANGES'});expect(x.store['projects/P1/workspace_sync_outbox/MASTER_DATA'].status).toBe('PENDING');expect(port.projectMasterTabs).not.toHaveBeenCalled();expect(f.create).not.toHaveBeenCalled();
  await service.initializeBound('P1',operationActor,port);expect(x.store[path].workbookHealth).toBe('HEALTHY');assertBounded(get.mock.calls);
 });
 it('Script fingerprints retain exact name/type/content checks and normalize only existing newline/trailing-space equivalence',async()=>{
  const b=blueprintFixture(),port=projectGoogleBlueprintPort('fixture-token','P1');
  f.drive.mockResolvedValue({data:{mimeType:'application/vnd.google-apps.spreadsheet',appProperties:{qSaudiWorkspaceOperation:workspaceOperation('P1'),resourceRole:'SPREADSHEET',workspaceBlueprintVersion:b.version}}});
  f.content.mockResolvedValue({data:{files:[...b.script!.files].reverse().map(v=>({...v,source:v.source!.replace(/\n/g,'\r\n')+'\n'}))}});await expect(port.verifyAutomation!('file','script',b)).resolves.toBeUndefined();
  for(const files of [b.script!.files.slice(1),b.script!.files.map((v,i)=>i?{...v,type:'HTML'}:v),b.script!.files.map((v,i)=>i?{...v,source:v.source+' changed'}:v),b.script!.files.map((v,i)=>i?{...v,name:'other'}:v)]){f.content.mockResolvedValueOnce({data:{files}});await expect(port.verifyAutomation!('file','script',b)).rejects.toHaveProperty('code','VERIFY_SCRIPT_CONTENT:SCRIPT_CONTENT_INSTALL_FAILED');}
 });
 it('owned report reads address only finite Ops ranges, never legacy history or open columns',async()=>{const x=setupLarge();await x.service.initializeBound('P1',operationActor,x.port);for(const [args] of x.fixture.get.mock.calls)if(args.includeGridData)expect(range(args.ranges[0]).title).toMatch(/^Ops /);expect(x.legacyReads()).toBe(0);});
});
