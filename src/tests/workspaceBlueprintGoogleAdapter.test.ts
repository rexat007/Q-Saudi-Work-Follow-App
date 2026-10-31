import {beforeEach,describe,it,expect,vi} from 'vitest';
import {blueprintFixture} from './helpers/workspaceBlueprintFixture';
const f=vi.hoisted(()=>({fileGet:vi.fn(),fileCreate:vi.fn(),fileList:vi.fn(),copy:vi.fn(),sheetGet:vi.fn(),batch:vi.fn(),scriptCreate:vi.fn(),scriptGet:vi.fn(),scriptInstall:vi.fn(),scriptContent:vi.fn(),token:vi.fn(),user:vi.fn(),destination:vi.fn(),eligible:vi.fn(),registry:vi.fn(),valueGet:vi.fn(),valueBatch:vi.fn()}));
vi.mock('googleapis',()=>({google:{auth:{OAuth2:class{setCredentials(){}getTokenInfo(){return f.token()}}},drive:()=>({files:{get:f.fileGet,create:f.fileCreate,list:f.fileList,copy:f.copy}}),sheets:()=>({spreadsheets:{get:f.sheetGet,batchUpdate:f.batch,values:{get:f.valueGet,batchUpdate:f.valueBatch}}}),script:()=>({projects:{create:f.scriptCreate,get:f.scriptGet,updateContent:f.scriptInstall,getContent:f.scriptContent}}),oauth2:()=>({userinfo:{get:f.user}})}}));
vi.mock('../../server/workspace.service',()=>({serverWorkspaceService:{validateDestinationFolder:f.destination}}));
vi.mock('../../server/workspace.isolation',()=>({WorkspaceStorageBoundary:class{eligibleDestination=f.eligible;assertCanonicalStorage=f.registry}}));
import {projectGoogleBlueprintPort} from '../../server/projectGoogleBlueprint.adapter';
import {workspaceOperation} from '../services/projectGoogleWorkspace.server';
beforeEach(()=>{
 vi.clearAllMocks();const b=blueprintFixture();
 f.token.mockResolvedValue({scopes:['https://www.googleapis.com/auth/drive.file','https://www.googleapis.com/auth/spreadsheets','https://www.googleapis.com/auth/script.projects']});
 f.fileGet.mockImplementation(async({fileId}:any)=>({data:fileId==='root'?{mimeType:'application/vnd.google-apps.folder',capabilities:{canAddChildren:true}}:{mimeType:'application/vnd.google-apps.spreadsheet',appProperties:{qSaudiWorkspaceOperation:workspaceOperation('P1'),resourceRole:'SPREADSHEET',workspaceBlueprintVersion:'TEST-V1'}}}));
 f.destination.mockResolvedValue({valid:true});f.eligible.mockResolvedValue('root');f.fileCreate.mockResolvedValue({data:{id:'created'}});
 f.sheetGet.mockResolvedValue({data:{properties:b.properties,sheets:b.sheets,namedRanges:b.namedRanges}});
 f.scriptGet.mockResolvedValue({data:{parentId:'file'}});f.scriptCreate.mockResolvedValue({data:{scriptId:'script'}});f.scriptContent.mockResolvedValue({data:{files:b.script!.files}});
});
describe('GWS1B Google native generation API boundary',()=>{
 it('creates a tagged native spreadsheet under the Project folder without files.copy',async()=>{const p=projectGoogleBlueprintPort('fixture','P1');await p.createProjectSpreadsheet('Project name','folder',workspaceOperation('P1'),'TEST-V1');expect(f.fileCreate).toHaveBeenCalledWith(expect.objectContaining({requestBody:expect.objectContaining({mimeType:'application/vnd.google-apps.spreadsheet',parents:['folder'],appProperties:expect.objectContaining({resourceRole:'SPREADSHEET',workspaceBlueprintVersion:'TEST-V1'})})}));expect(f.copy).not.toHaveBeenCalled()});
 it('requires script.projects for generation while preserving the narrow Drive scope',async()=>{const p=projectGoogleBlueprintPort('fixture','P1');await p.authorizeProvisioning();f.token.mockResolvedValueOnce({scopes:['https://www.googleapis.com/auth/drive.file','https://www.googleapis.com/auth/spreadsheets']});await expect(p.authorizeProvisioning()).rejects.toThrow('SCOPE_DENIED')});
 it('reuses canonical destination permission/isolation checks and rejects non-folders',async()=>{const p=projectGoogleBlueprintPort('fixture','P1');await p.validateDestination('root','P1');expect(f.destination).toHaveBeenCalledWith('P1','root','MY_DRIVE',undefined,undefined,'fixture');f.fileGet.mockResolvedValueOnce({data:{mimeType:'application/vnd.google-apps.spreadsheet'}});await expect(p.validateDestination('root','P1')).rejects.toThrow('DESTINATION_FOLDER_INVALID')});
 it('creates a container-bound script with the generated spreadsheet parent',async()=>{await projectGoogleBlueprintPort('fixture','P1').createBoundScript('file');expect(f.scriptCreate).toHaveBeenCalledWith({requestBody:{title:'Project P1 automation',parentId:'file'}})});
 it('installs exactly the versioned script files and manifest',async()=>{const b=blueprintFixture();await projectGoogleBlueprintPort('fixture','P1').installScript('script',b);expect(f.scriptInstall).toHaveBeenCalledWith({scriptId:'script',requestBody:{files:b.script!.files}})});
 it('cross-Project external markers prevent workbook mutation',async()=>{const p=projectGoogleBlueprintPort('fixture','P2');await expect(p.applyBlueprint('file',blueprintFixture())).rejects.toThrow('WORKSPACE_EXTERNAL_BINDING_INVALID');expect(f.batch).not.toHaveBeenCalled()});
 it('verifies sheet structure and actual script content before READY',async()=>{const p=projectGoogleBlueprintPort('fixture','P1');await p.verifyGenerated('file','script',blueprintFixture());f.scriptContent.mockResolvedValueOnce({data:{files:[]}});await expect(p.verifyGenerated('file','script',blueprintFixture())).rejects.toThrow('SCRIPT_CONTENT_INSTALL_FAILED')});
 it('rejects a script bound to another workbook',async()=>{f.scriptGet.mockResolvedValueOnce({data:{parentId:'other'}});await expect(projectGoogleBlueprintPort('fixture','P1').verifyGenerated('file','script',blueprintFixture())).rejects.toThrow('WORKSPACE_STRUCTURE_INVALID')});
});

describe('generated formula capacity recovery',()=>{
 const input={projectId:'P1',tripId:'t',ticketId:'new',ticketSeries:'S',weightUnit:'tonne' as const};
 const full=[['Ticket ID'],['old',undefined,undefined,undefined,undefined,undefined,undefined,undefined,undefined,undefined,undefined,undefined,undefined,undefined,'S']];
 function capacity(){
  f.valueGet.mockResolvedValueOnce({data:{values:full}}).mockResolvedValue({data:{values:[...full,[]]}});
  f.valueBatch.mockResolvedValue({data:{}});
  f.sheetGet.mockResolvedValue({data:{sheets:[{properties:{sheetId:100,title:'Loading Register',gridProperties:{rowCount:2}},data:[{rowData:[{}, {values:[{userEnteredValue:{stringValue:'old'}}]}]}]}]}});
 }
 it('expands only a full generated sheet and retries RAW input writes without copying human values',async()=>{capacity();await projectGoogleBlueprintPort('fixture','P1').upsert('file',input);const requests=f.batch.mock.calls[0][0].requestBody.requests;expect(requests[0].insertDimension.range).toMatchObject({sheetId:100,startIndex:1,endIndex:201});expect(requests.filter((r:any)=>r.copyPaste?.pasteType==='PASTE_FORMULA')).toHaveLength(19);expect(JSON.stringify(requests)).not.toContain('PASTE_NORMAL');expect(f.valueBatch).toHaveBeenCalledWith(expect.objectContaining({requestBody:expect.objectContaining({valueInputOption:'RAW'})}));});
 it('a lost expansion response retries existing capacity without issuing a second insert',async()=>{capacity();f.batch.mockRejectedValueOnce(Error('lost response'));const p=projectGoogleBlueprintPort('fixture','P1');await expect(p.upsert('file',input)).rejects.toThrow('WORKSPACE_EXPANSION_FAILED');await p.upsert('file',input);expect(f.batch).toHaveBeenCalledTimes(1);});
});
