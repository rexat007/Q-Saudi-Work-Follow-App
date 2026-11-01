import {afterEach,beforeEach,describe,it,expect,vi} from 'vitest';
import {blueprintFixture} from './helpers/workspaceBlueprintFixture';
const f=vi.hoisted(()=>({files:vi.fn(),create:vi.fn(),sheets:vi.fn(),batch:vi.fn(),scriptCreate:vi.fn(),scriptGet:vi.fn(),install:vi.fn(),content:vi.fn()}));
vi.mock('googleapis',()=>({google:{
 auth:{OAuth2:class{setCredentials(){}getTokenInfo(){return Promise.resolve({scopes:['https://www.googleapis.com/auth/spreadsheets','https://www.googleapis.com/auth/drive.file','https://www.googleapis.com/auth/script.projects']})}}},
 oauth2:()=>({userinfo:{get:async()=>({data:{id:'fixture-subject'}})}}),
 drive:()=>({files:{get:f.files,create:f.create}}),
 sheets:()=>({spreadsheets:{get:f.sheets,batchUpdate:f.batch}}),
 script:()=>({projects:{create:f.scriptCreate,get:f.scriptGet,updateContent:f.install,getContent:f.content}}),
}}));
vi.mock('../../server/workspace.isolation',()=>({WorkspaceStorageBoundary:class{
 eligibleDestination=async()=> 'root';assertCanonicalStorage=async()=>{};
}}));
import {projectGoogleBlueprintPort} from '../../server/projectGoogleBlueprint.adapter';
import {ProjectGoogleWorkspaceServer,workspaceOperation} from '../services/projectGoogleWorkspace.server';
import {classifyWorkspaceGenerationFailure,workspaceGenerationDiagnosticCode} from '../utils/workspaceGenerationDiagnostics';

const path='projects/P1/workspace_continuity/current';
const actor={userId:'admin',role:'SUPER_ADMIN' as const,email:'',displayName:'',assignedProjectIds:[]};
function fixture(){
 const records=new Map<string,any>([
  ['projects/P1',{projectId:'P1',nameAr:'Fixture',projectCode:'P1',status:'SETUP',settings:{}}],
  ['users/admin',{userId:'admin',role:'SUPER_ADMIN',status:'ACTIVE',assignedProjectIds:[]}],
 ]);
 const options={failBindingOnce:false};
 const ref=(path:string):any=>({path,id:path.split('/').at(-1),doc:(id:string)=>ref(path+'/'+id),collection:(name:string)=>ref(path+'/'+name),where:()=>ref(path),get:async()=>({exists:records.has(path),data:()=>structuredClone(records.get(path)),docs:[...records].filter(([key])=>key.startsWith(path+'/')&&!key.slice(path.length+1).includes('/')).map(([key,value])=>({id:key.split('/').at(-1),data:()=>structuredClone(value)}))})});
 const db:any={collection:(name:string)=>ref(name),runTransaction:async(fn:any)=>{
  const writes:Array<[string,any]>=[];
  const result=await fn({get:(r:any)=>r.get(),set:(r:any,value:any)=>{
   if(value.binding&&options.failBindingOnce){options.failBindingOnce=false;throw Error('private binding failure')}
   writes.push([r.path,value]);
  },update:(r:any,value:any)=>writes.push([r.path,{...records.get(r.path),...value}])});
  for(const [path,value] of writes)records.set(path,structuredClone(value));return result;
 }};
 const service=new ProjectGoogleWorkspaceServer(db,undefined,()=>blueprintFixture());
 const port=projectGoogleBlueprintPort('private-access-token','P1');
 // This suite isolates generation/provider diagnostics from projection HTTP I/O.
 port.projectMasterTabs=vi.fn(async()=>{});port.authorizeProvisioning=vi.fn(async()=>{throw new Error('optional grant absent')});
 return {records,options,port,approve:()=>service.approveDestination('P1','root',actor,port),provision:()=>service.provision('P1','root',actor,port)};
}
function provider(reason?:string){return {
 response:{status:403,data:{error:{code:403,message:'private user@example.test subject token',status:'PERMISSION_DENIED',
  details:reason?[{'@type':'type.googleapis.com/google.rpc.ErrorInfo',reason,metadata:{service:'script.googleapis.com',consumer:'private-subject'}}]:[]}}},
 config:{url:'https://script.googleapis.com/v1/projects?key=private-api-key',headers:{authorization:'Bearer private-access-token'}},
 access_token:'private-access-token',id_token:'private-id-token',code:'private-auth-code',client_secret:'private-client-secret',email:'user@example.test',subject:'private-subject',
};}
beforeEach(()=>{
 vi.resetAllMocks();
 f.files.mockImplementation(async({fileId}:any)=>({data:fileId==='root'?{mimeType:'application/vnd.google-apps.folder',capabilities:{canAddChildren:true}}:{name:'Project sheet',mimeType:fileId==='folder'?'application/vnd.google-apps.folder':'application/vnd.google-apps.spreadsheet',parents:[fileId==='folder'?'root':'folder'],appProperties:{projectId:'P1',qSaudiWorkspaceOperation:workspaceOperation('P1'),resourceRole:fileId==='folder'?'FOLDER':'SPREADSHEET',workspaceBlueprintVersion:'TEST-V1'}}}));
 f.create.mockImplementation(async({requestBody}:any)=>({data:{id:requestBody.mimeType==='application/vnd.google-apps.folder'?'folder':'file'}}));
 f.sheets.mockResolvedValue({data:blueprintFixture()});f.batch.mockResolvedValue({});
 f.scriptCreate.mockResolvedValue({data:{scriptId:'script'}});f.scriptGet.mockResolvedValue({data:{parentId:'file'}});
 f.install.mockResolvedValue({});f.content.mockResolvedValue({data:{files:blueprintFixture().script!.files}});
});
afterEach(()=>{vi.restoreAllMocks()});

describe('actual Google adapter + durable generation stage diagnostics',()=>{
 it('preserves CONNECTED and stage diagnostics on a generic blueprint repair 403 without duplicate artifacts',async()=>{
  const x=fixture();await x.approve();const workbook=blueprintFixture();workbook.sheets[0].data![0].rowData![0].values![0]={};f.sheets.mockResolvedValueOnce({data:workbook});f.batch.mockRejectedValueOnce({response:{status:403}});
  await x.provision();
  expect(x.records.get(path)).toMatchObject({stage:'BOUND',folderId:'folder',fileId:'file',workspaceState:'CONNECTED',workbookHealth:'DEGRADED',lastWorkbookError:'APPLY_BLUEPRINT:BLUEPRINT_APPLY_FAILED',lastGenerationDiagnostic:{operation:'APPLY_BLUEPRINT',httpStatus:403,providerReason:'UNRECOGNIZED'}});
  expect(f.scriptCreate).not.toHaveBeenCalled();await x.provision();expect(f.create).toHaveBeenCalledTimes(2);expect(f.scriptCreate).not.toHaveBeenCalled();expect(x.records.get(path)).toMatchObject({state:'READY',workspaceState:'CONNECTED',stage:'BOUND',lastGenerationDiagnostic:null});
 });
 it('diagnoses optional Script creation denial while SCRIPT_REQUESTED recovery still binds the same Sheet',async()=>{
  const x=fixture();await x.approve();x.records.set(path,{projectId:'P1',destinationRootFolderId:'root',folderId:'folder',fileId:'file',operationId:workspaceOperation('P1'),googleSubject:'fixture-subject',workspaceBlueprintVersion:'TEST-V1',stage:'SCRIPT_REQUESTED',state:'FAILED',leaseUntil:0});
  f.scriptCreate.mockRejectedValueOnce(provider('SERVICE_DISABLED'));
  await expect(x.port.createBoundScript('file')).rejects.toMatchObject({code:'CREATE_BOUND_SCRIPT:API_ACCESS_DISABLED',diagnostic:{operation:'CREATE_BOUND_SCRIPT',service:'script.googleapis.com',httpStatus:403,providerReason:'SERVICE_DISABLED'}});
  await x.provision();await x.provision();
  expect(x.records.get(path)).toMatchObject({stage:'BOUND',state:'READY',workspaceState:'CONNECTED',automationStage:'SCRIPT_REQUESTED',automationState:'DEGRADED'});
  expect(x.records.get(path).binding.scriptProjectId).toBeUndefined();expect(f.scriptCreate).toHaveBeenCalledOnce();expect(f.create).not.toHaveBeenCalled();expect(f.install).not.toHaveBeenCalled();
 });
 it('optional content installation preserves its denial stage and retries the same Script without disrupting binding',async()=>{
  const x=fixture();await x.approve();await x.provision();f.install.mockRejectedValueOnce(provider());
  await expect(x.port.installScript('script',blueprintFixture())).rejects.toMatchObject({code:'INSTALL_SCRIPT_CONTENT:PERMISSION_DENIED'});
  expect(x.records.get(path)).toMatchObject({state:'READY',workspaceState:'CONNECTED',binding:{spreadsheetId:'file'}});
  await x.port.installScript('script',blueprintFixture());expect(f.install.mock.calls.map(call=>call[0].scriptId)).toEqual(['script','script']);
  expect(f.create).toHaveBeenCalledTimes(2);expect(f.scriptCreate).not.toHaveBeenCalled();
 });
 it.each(['workbook','script'] as const)('preserves optional %s verification stage without invalidating the Sheet binding',async kind=>{
  const x=fixture();await x.approve();await x.provision();
  if(kind==='workbook')f.sheets.mockRejectedValueOnce(provider());else f.content.mockRejectedValueOnce(provider());
  const code=kind==='workbook'?'VERIFY_WORKBOOK:PERMISSION_DENIED':'VERIFY_SCRIPT_CONTENT:PERMISSION_DENIED';
  await expect(x.port.verifyGenerated('file','script',blueprintFixture())).rejects.toMatchObject({code});
  expect(x.records.get(path)).toMatchObject({stage:'BOUND',state:'READY',binding:{spreadsheetId:'file'}});
  await x.port.verifyGenerated('file','script',blueprintFixture());expect(f.create).toHaveBeenCalledTimes(2);expect(f.scriptCreate).not.toHaveBeenCalled();
 });
 it('preserves optional structural/content verification errors without making Script a binding requirement',async()=>{
  const x=fixture();await x.approve();await x.provision();f.content.mockResolvedValueOnce({data:{files:[]}});
  await expect(x.port.verifyGenerated('file','script',blueprintFixture())).rejects.toMatchObject({code:'VERIFY_SCRIPT_CONTENT:SCRIPT_CONTENT_INSTALL_FAILED'});
  expect(x.records.get(path)).toMatchObject({stage:'BOUND',state:'READY',workspaceState:'CONNECTED'});
 });
 it('retains SCRIPT_FUNCTION_NOT_READY for strict optional automation verification',async()=>{
  const x=fixture();await x.approve();await x.provision();const workbook=blueprintFixture();
  workbook.sheets[0].data![0].rowData![1].values![0].effectiveValue={errorValue:{type:'NAME'}};
  f.sheets.mockResolvedValueOnce({data:workbook});
  await expect(x.port.verifyGenerated('file','script',blueprintFixture())).rejects.toMatchObject({code:'VERIFY_WORKBOOK:SCRIPT_FUNCTION_NOT_READY'});
  expect(x.records.get(path)).toMatchObject({stage:'BOUND',state:'READY'});
 });
 it('identifies binding persistence failure before structure repair without creating replacements',async()=>{
  const x=fixture();await x.approve();x.options.failBindingOnce=true;
  await expect(x.provision()).rejects.toMatchObject({code:'PERSIST_BINDING:WORKSPACE_BINDING_PERSIST_FAILED'});
  expect(x.records.get(path)).toMatchObject({stage:'SPREADSHEET_CREATED',lastGenerationDiagnostic:{operation:'PERSIST_BINDING'}});
  await x.provision();expect(f.create).toHaveBeenCalledTimes(2);expect(f.scriptCreate).not.toHaveBeenCalled();
 });
 it.each(['insufficientPermissions','insufficient_scope','ACCESS_TOKEN_SCOPE_INSUFFICIENT'])('requires explicit %s provider evidence for scope denial',async reason=>{
  const x=fixture();await x.approve();f.batch.mockRejectedValueOnce(provider(reason));
  await expect(x.port.applyBlueprint('file',blueprintFixture())).rejects.toMatchObject({code:'APPLY_BLUEPRINT:SCOPE_DENIED',diagnostic:{providerReason:reason}});
 });
 it('publishes and persists only closed metadata, without secrets or provider messages',async()=>{
  const log=vi.spyOn(console,'log'),warn=vi.spyOn(console,'warn'),err=vi.spyOn(console,'error');
  const x=fixture();await x.approve();const workbook=blueprintFixture();workbook.sheets[0].data![0].rowData![0].values![0]={};f.sheets.mockResolvedValueOnce({data:workbook});f.batch.mockRejectedValueOnce(provider('SERVICE_DISABLED'));
  await x.provision();const failure={message:x.records.get(path).lastWorkbookError,code:x.records.get(path).lastWorkbookError,diagnostic:x.records.get(path).lastGenerationDiagnostic};
  const publicPayload={error:failure.message,code:failure.code,diagnostic:failure.diagnostic};
  expect(publicPayload.code).toBe('APPLY_BLUEPRINT:API_ACCESS_DISABLED');
  expect(Object.keys(publicPayload.diagnostic).sort()).toEqual(['category','httpStatus','operation','providerReason','service']);
  expect(JSON.stringify(publicPayload)).not.toMatch(/private-|user@example|Bearer|authorization|client_secret|access_token|id_token/);
  expect(JSON.stringify(x.records.get(path).lastGenerationDiagnostic)).toBe(JSON.stringify(publicPayload.diagnostic));
  expect(log).not.toHaveBeenCalled();expect(warn).not.toHaveBeenCalled();expect(err).not.toHaveBeenCalled();
 });
});

describe('closed provider classification and UI formatting',()=>{
 it('does not derive scope failure from a bare 403 or untrusted message text',()=>{
  const failure=classifyWorkspaceGenerationFailure({response:{status:403,data:{error:{message:'insufficient_scope private-email'}}}},'CREATE_BOUND_SCRIPT');
  expect(failure.code).toBe('CREATE_BOUND_SCRIPT:SCRIPT_PROJECT_CREATION_FAILED');
 });
 it('recognizes legacy Google reason arrays and sanitizes unknown service/reason fields',()=>{
  expect(classifyWorkspaceGenerationFailure({response:{status:403,data:{error:{errors:[{reason:'accessNotConfigured'}]}}}},'CREATE_BOUND_SCRIPT').code).toBe('CREATE_BOUND_SCRIPT:API_ACCESS_DISABLED');
  const failure=classifyWorkspaceGenerationFailure({response:{status:403,data:{error:{details:[{reason:'private-reason',metadata:{service:'private-service'}}]}}},config:{url:'https://private-host/path?token=private-token'}},'INSTALL_SCRIPT_CONTENT');
  expect(failure.diagnostic).toMatchObject({providerReason:'UNRECOGNIZED',service:'UNKNOWN'});expect(JSON.stringify(failure)).not.toContain('private-');
 });
 it('retains a real expired-token status as bounded metadata',()=>{
  expect(classifyWorkspaceGenerationFailure({response:{status:401}},'VERIFY_WORKBOOK')).toMatchObject({code:'VERIFY_WORKBOOK:TOKEN_EXPIRED',diagnostic:{httpStatus:401}});
 });
 it('extracts only known stage/category pairs from contextual UI errors',()=>{
  expect(workspaceGenerationDiagnosticCode('Context: CREATE_BOUND_SCRIPT:API_ACCESS_DISABLED')).toBe('CREATE_BOUND_SCRIPT:API_ACCESS_DISABLED');
  expect(workspaceGenerationDiagnosticCode('CREATE_BOUND_SCRIPT:private-token')).toBeNull();expect(workspaceGenerationDiagnosticCode('PRIVATE_STAGE:PERMISSION_DENIED')).toBeNull();
 });
});
