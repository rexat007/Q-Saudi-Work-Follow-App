import {beforeEach,afterEach,describe,it,expect,vi} from 'vitest';
import {blueprintFixture} from './helpers/workspaceBlueprintFixture';
const f=vi.hoisted(()=>({get:vi.fn(),create:vi.fn(),batch:vi.fn(),scriptCreate:vi.fn()}));
vi.mock('googleapis',()=>({google:{auth:{OAuth2:class{setCredentials(){}getTokenInfo(){return Promise.resolve({scopes:['https://www.googleapis.com/auth/drive.file','https://www.googleapis.com/auth/spreadsheets','https://www.googleapis.com/auth/script.projects']})}}},oauth2:()=>({userinfo:{get:async()=>({data:{id:'g',email:'fixture'}})}}),drive:()=>({files:{get:f.get,create:f.create}}),sheets:()=>({spreadsheets:{get:async()=>({data:{properties:blueprintFixture().properties,sheets:blueprintFixture().sheets,namedRanges:blueprintFixture().namedRanges}}),batchUpdate:f.batch}}),script:()=>({projects:{create:f.scriptCreate,get:async()=>({data:{parentId:'generated-sheet'}}),updateContent:async()=>({}),getContent:async()=>({data:{files:blueprintFixture().script!.files}})}})}}));
import {setTestDbOverride} from '../firebase/admin';
import {projectGoogleBlueprintPort} from '../../server/projectGoogleBlueprint.adapter';
import {serverWorkspaceService} from '../../server/workspace.service';
import {ProjectGoogleWorkspaceServer,workspaceOperation} from '../services/projectGoogleWorkspace.server';
const actor={userId:'u',role:'SUPER_ADMIN' as const,assignedProjectIds:[],email:'',displayName:''};
function database(){
 const records=new Map<string,any>([['projects/P1',{projectId:'P1',nameAr:'Project',projectCode:'P1',status:'SETUP',settings:{}}],['users/u',{userId:'u',role:'SUPER_ADMIN',status:'ACTIVE',assignedProjectIds:[]}]]);
 const ref=(path:string):any=>({id:path.split('/').at(-1),path,collection:(n:string)=>ref(path+'/'+n),where:()=>ref(path),doc:(id:string)=>ref(path+'/'+id),get:async()=>({id:path.split('/').at(-1),exists:records.has(path),data:()=>structuredClone(records.get(path)),docs:[...records].filter(([k])=>k.startsWith(path+'/')&&!k.slice(path.length+1).includes('/')).map(([k,v])=>({id:k.split('/').at(-1),data:()=>structuredClone(v)}))})});
 const db:any={collection:(n:string)=>ref(n),runTransaction:async(fn:any)=>{const writes:any[]=[];const result=await fn({get:(r:any)=>r.get(),set:(r:any,v:any)=>writes.push([r.path,v]),update:(r:any,v:any)=>writes.push([r.path,{...records.get(r.path),...v}])});for(const [p,v] of writes)records.set(p,structuredClone(v));return result;}};
 return {records,db};
}
let d:ReturnType<typeof database>;
beforeEach(()=>{
 vi.clearAllMocks();d=database();setTestDbOverride(d.db);
 // Destination-policy tests do not simulate master-data HTTP reconciliation.
 vi.spyOn(serverWorkspaceService,'reconcileTabSnapshot').mockResolvedValue({processedCount:0,insertedCount:0,updatedCount:0,deletedCount:0,durationMs:0} as any);
 f.get.mockImplementation(async({fileId,fields}:any)=>{
  if(fileId==='selected')return {data:fields==='parents'?{parents:['ungranted-parent']}:{id:fileId,mimeType:'application/vnd.google-apps.folder',trashed:false,capabilities:{canAddChildren:true},parents:['ungranted-parent']}};
  if(fileId==='generated-folder')return {data:{mimeType:'application/vnd.google-apps.folder',parents:['selected'],appProperties:{projectId:'P1',qSaudiWorkspaceOperation:workspaceOperation('P1'),resourceRole:'FOLDER',workspaceBlueprintVersion:'TEST-V1'}}};
  if(fileId==='generated-sheet')return {data:{id:fileId,mimeType:'application/vnd.google-apps.spreadsheet',parents:['generated-folder'],appProperties:{projectId:'P1',qSaudiWorkspaceOperation:workspaceOperation('P1'),resourceRole:'SPREADSHEET',workspaceBlueprintVersion:'TEST-V1'}}};
  throw Object.assign(Error('Unavailable parent under drive.file'),{response:{status:404}});
 });
 f.create.mockImplementation(async({requestBody}:any)=>({data:{id:requestBody.mimeType==='application/vnd.google-apps.folder'?'generated-folder':'generated-sheet'}}));
 f.batch.mockResolvedValue({});f.scriptCreate.mockResolvedValue({data:{scriptId:'generated-script'}});
});
afterEach(()=>{setTestDbOverride(null);vi.restoreAllMocks()});
const port=()=>projectGoogleBlueprintPort('fixture-not-real','P1');
const service=()=>new ProjectGoogleWorkspaceServer(d.db,undefined,()=>blueprintFixture());
describe('initial destination under the actual narrow-scope validator and registry',()=>{
 it.each([403,404])('accepts the granted writable folder without reading its inaccessible %s parent',async status=>{
  const implementation=f.get.getMockImplementation()!;f.get.mockImplementation(async(args:any)=>{if(args.fileId==='ungranted-parent')throw Object.assign(Error('not granted'),{response:{status}});return implementation(args)});
  await expect(port().validateDestination('selected','P1')).resolves.toBeUndefined();expect(f.get).toHaveBeenCalledTimes(1);expect(f.get.mock.calls[0][0].fileId).toBe('selected');expect(f.create).not.toHaveBeenCalled();
 });
 it('keeps the stronger migration ancestry check and its rejection unchanged',async()=>{const result=await serverWorkspaceService.validateDestinationFolder('P1','selected','MY_DRIVE',undefined,undefined,'fixture-not-real');expect(result.valid).toBe(false);expect(f.get.mock.calls.some(c=>c[0].fileId==='ungranted-parent')).toBe(true);});
 it('accepts writable Shared Drive folders without ownership or parent privileges',async()=>{f.get.mockResolvedValueOnce({data:{id:'selected',mimeType:'application/vnd.google-apps.folder',trashed:false,driveId:'shared',capabilities:{canAddChildren:true,canEdit:false},parents:['hidden']}});await port().validateDestination('selected','P1');expect(f.get).toHaveBeenCalledTimes(1);});
 it.each([false,undefined,'true'])('rejects canAddChildren=%s before any external creation',async canAddChildren=>{f.get.mockResolvedValue({data:{mimeType:'application/vnd.google-apps.folder',capabilities:{canAddChildren}}});await expect(service().approveDestination('P1','selected',actor,port())).rejects.toThrow('DESTINATION_NOT_WRITABLE');expect(f.create).not.toHaveBeenCalled();expect(f.scriptCreate).not.toHaveBeenCalled();});
 it.each([{mimeType:'text/plain'},{mimeType:'application/vnd.google-apps.folder',trashed:true}])('rejects nonfolder/trashed selection',async data=>{f.get.mockResolvedValueOnce({data});await expect(port().validateDestination('selected','P1')).rejects.toThrow('DESTINATION_FOLDER_INVALID');});
 it('rejects malformed ID without making a Drive call',async()=>{await expect(port().validateDestination('bad/id','P1')).rejects.toMatchObject({code:'INVALID_STORAGE_RESOURCE_ID'});expect(f.get).not.toHaveBeenCalled();});
 it('preserves CURRENT_STORAGE_DESTINATION for own canonical folder',async()=>{d.records.get('projects/P1').settings.googleDriveFolderId='selected';await expect(port().validateDestination('selected','P1')).rejects.toMatchObject({code:'CURRENT_STORAGE_DESTINATION'});expect(f.get).not.toHaveBeenCalled();});
 it('preserves STORAGE_TARGET_CONFLICT for another Project folder and creates nothing',async()=>{d.records.set('projects/P2',{projectId:'P2',settings:{googleDriveFolderId:'selected'}});await expect(service().approveDestination('P1','selected',actor,port())).rejects.toMatchObject({code:'STORAGE_TARGET_CONFLICT'});expect(f.create).not.toHaveBeenCalled();expect(f.get).not.toHaveBeenCalled();});
 it('preserves foreign migration reservations',async()=>{d.records.set('workspace_migration_jobs/selected',{projectId:'P2',targetFolderId:'selected'});await expect(port().validateDestination('selected','P1')).rejects.toMatchObject({code:'STORAGE_TARGET_CONFLICT'});expect(f.get).not.toHaveBeenCalled();});
 it.each([[401,'TOKEN_EXPIRED'],[403,'GOOGLE_PERMISSION_DENIED'],[404,'PROJECT_WORKSPACE_FILE_MISSING'],[500,'GOOGLE_SERVICE_UNAVAILABLE']])('preserves sanitized Drive HTTP%s as %s',async(status,code)=>{f.get.mockRejectedValueOnce(Object.assign(Error('private provider details'),{response:{status}}));await expect(port().validateDestination('selected','P1')).rejects.toMatchObject({code});expect(f.create).not.toHaveBeenCalled();});
 it('reports registry unavailability separately and does not call Google',async()=>{d.db.collection=()=>{throw Error('registry transport unavailable')};await expect(port().validateDestination('selected','P1')).rejects.toMatchObject({code:'WORKSPACE_REGISTRY_ACCESS_FAILED',status:503});expect(f.get).not.toHaveBeenCalled();expect(f.create).not.toHaveBeenCalled();});
 it('rejects Project mismatch before querying Google or registry',async()=>{await expect(port().validateDestination('selected','P2')).rejects.toMatchObject({code:'FORBIDDEN_PROJECT_ACCESS'});expect(f.get).not.toHaveBeenCalled();});
 it('persists the picker destination approval and completes provisioning with inaccessible parents',async()=>{const s=service(),p=port();await s.approveDestination('P1','selected',actor,p);expect(d.records.get('projects/P1/workspace_destination/current')).toMatchObject({projectId:'P1',rootId:'selected',subject:'g',actorId:'u'});const binding=await s.provision('P1','selected',actor,p);expect(binding).toMatchObject({destinationRootFolderId:'selected',projectFolderId:'generated-folder',spreadsheetId:'generated-sheet'});expect(d.records.get('projects/P1/workspace_continuity/current').state).toBe('READY');expect(f.get.mock.calls.filter(c=>c[0].fileId==='selected'&&c[0].fields.includes('capabilities'))).toHaveLength(2);expect(f.get.mock.calls.some(c=>c[0].fileId==='ungranted-parent')).toBe(false);expect(f.create).toHaveBeenCalledTimes(2);});
 it('revalidates destination before creation even after a prior approval',async()=>{const s=service(),p=port();await s.approveDestination('P1','selected',actor,p);f.get.mockResolvedValue({data:{mimeType:'application/vnd.google-apps.folder',capabilities:{canAddChildren:false}}});await expect(s.provision('P1','selected',actor,p)).rejects.toThrow('DESTINATION_NOT_WRITABLE');expect(f.create).not.toHaveBeenCalled();});
});
