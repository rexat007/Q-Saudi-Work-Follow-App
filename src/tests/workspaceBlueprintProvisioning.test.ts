import { describe,it,expect,vi } from 'vitest';
import { ProjectGoogleWorkspaceServer,workspaceOperation,GoogleWorkspaceCommandError,type GoogleBlueprintPort } from '../services/projectGoogleWorkspace.server';
import { blueprintFixture } from './helpers/workspaceBlueprintFixture';
import { activeWorkspaceBlueprint } from '../services/googleWorkspaceBlueprint/sabilHailV1';
function database(seed: Record<string, any>) {
  const records = new Map(Object.entries(structuredClone(seed)));
  const versions = new Map<string, number>();
  const commits: Array<{ path: string; value: any }> = [];
  const reads: string[] = [];
  const snapshot = (path: string) => ({ id: path.split('/').at(-1), exists: records.has(path), data: () => structuredClone(records.get(path)) });
  const ref = (path: string, collection = false, filter?: [string, any]): any => ({
    path, id:path.split('/').at(-1), collectionKind: collection,
    set: async (value:any) => { records.set(path,structuredClone(value)); versions.set(path,(versions.get(path)||0)+1); },
    collection: (name: string) => ref(`${path}/${name}`, true),
    doc: (id: string) => ref(`${path}/${id}`),
    where: (key: string, _op: string, value: any) => ref(path, true, [key, value]),
    get: async () => {
      reads.push(path);
      if (!collection) return snapshot(path);
      return { docs: [...records.keys()].filter(k => k.startsWith(path + '/') && !k.slice(path.length + 1).includes('/') && (!filter || records.get(k)[filter[0]] === filter[1])).map(snapshot) };
    },
  });
  const db = {
    collection: (name: string) => ref(name, true),
    runTransaction: vi.fn(async (operation: any) => {
      for (let attempt = 0; attempt < 30; attempt++) {
        const observed = new Map<string, number>();
        const writes: Array<{ reference: any; value: any; update: boolean }> = [];
        const result = await operation({
          get: async (reference: any) => {
            const value = await reference.get();
            if (reference.collectionKind) for (const doc of value.docs) observed.set(`${reference.path}/${doc.id}`, versions.get(`${reference.path}/${doc.id}`) || 0);
            else observed.set(reference.path, versions.get(reference.path) || 0);
            return value;
          },
          set: (reference: any, value: any) => writes.push({ reference, value: structuredClone(value), update: false }),
          update: (reference: any, value: any) => writes.push({ reference, value: structuredClone(value), update: true }),
        });
        if ([...observed].some(([key, version]) => (versions.get(key) || 0) !== version)) continue;
        for (const write of writes) {
          const hasUndefined=(value:any):boolean=>value===undefined||Boolean(value&&typeof value==='object'&&Object.values(value).some(hasUndefined));
          if(hasUndefined(write.value))throw Error('FIRESTORE_UNDEFINED_VALUE');
          const path = write.reference.path;
          if (write.update && !records.has(path)) throw Error('Missing update record');
          const value = write.update ? { ...records.get(path), ...write.value } : write.value;
          records.set(path, value);
          versions.set(path, (versions.get(path) || 0) + 1);
          commits.push({ path, value: structuredClone(value) });
        }
        return result;
      }
      throw Error('Transaction contention');
    }),
  };
  return { db, records, commits, reads };
}
const actor={userId:'admin',role:'PROJECT_ADMIN' as const,email:'',displayName:'',assignedProjectIds:['P1','P2']};
function fixture(){
 const project=(id:string)=>({projectId:id,nameAr:'Test project',nameEn:'Test',projectCode:id,status:'SETUP',settings:{},createdAt:'2026-10-31T00:00:00Z',updatedAt:'2026-10-31T00:00:00Z'});
 const data=database({'projects/P1':project('P1'),'projects/P2':project('P2'),'users/admin':{userId:'admin',role:'PROJECT_ADMIN',status:'ACTIVE',assignedProjectIds:['P1','P2']}});
 const resources:Array<{id:string;parentId:string;op:string;role:string}>=[];
 const forbidden=vi.fn(async()=>{throw new Error('LEGACY_COPY_FORBIDDEN')});
 const port={subject:vi.fn(async()=> 'subject'),accountLabel:()=> 'Test account',authorizeProvisioning:vi.fn(async()=>{throw new GoogleWorkspaceCommandError('SCOPE_DENIED:script.projects',403)}),authorizeBinding:vi.fn(async()=>{}),verifyBinding:vi.fn(async()=>({title:'Project sheet'})),verifyWorkbook:vi.fn(async()=>{}),validateDestination:vi.fn(async(_root:string,_project:string)=>{}),
 findResource:vi.fn(async(op:string,role:string)=>resources.filter(r=>r.op===op&&r.role===role)),
 createProjectFolder:vi.fn(async(_name:string,parentId:string,op:string)=>{const id='folder-'+op.slice(0,8);resources.push({id,parentId,op,role:'FOLDER'});return id}),
 createProjectSpreadsheet:vi.fn(async(_name:string,parentId:string,op:string)=>{const id='sheet-'+op.slice(0,8);resources.push({id,parentId,op,role:'SPREADSHEET'});return id}),
 applyBlueprint:vi.fn(async()=>{}),createBoundScript:vi.fn(async(file:string)=> 'script-'+file),installScript:vi.fn(async()=>{}),verifyGenerated:vi.fn(async()=>{}),verify:vi.fn(async()=>{}),upsert:vi.fn(async()=>{}),
 validateTemplate:forbidden,findCopies:forbidden,createFolder:forbidden,copyTemplate:forbidden,initializeCopy:forbidden} as unknown as GoogleBlueprintPort;
 const service=new ProjectGoogleWorkspaceServer(data.db,undefined,()=>blueprintFixture());
 const approve=(id='P1',root='root')=>service.approveDestination(id,root,actor,port);
 // Explicit fixture execution follows the binding-only step; the HTTP durable boundary is tested separately.
 const provision=async(id='P1',root='root')=>{const binding=await service.provision(id,root,actor,port);await service.initializeBound(id,actor,port);return binding;};
 return {...data,service,port,resources,approve,provision,forbidden};
}
describe('GWS1B versioned blueprint authority',()=>{
 it('records real initial projection success without conflating automation readiness',async()=>{
  const f=fixture();await f.approve();const b=await f.provision();await f.service.initialProjectionResult('P1',b.spreadsheetId,actor,null);
  expect(await f.service.status('P1',actor)).toMatchObject({state:'READY',workspaceState:'CONNECTED',automationState:'DEGRADED',lastSuccessfulSyncAt:expect.any(String)});
 });
 it('retains binding on initial projection failure and rejects acknowledgments for another file',async()=>{
  const f=fixture();await f.approve();const b=await f.provision();await f.service.initialProjectionResult('P1',b.spreadsheetId,actor,'SHEET_SYNC_FAILED');
  expect(await f.service.status('P1',actor)).toMatchObject({state:'SYNC_DEGRADED',binding:{spreadsheetId:b.spreadsheetId}});
  await expect(f.service.initialProjectionResult('P1','foreign-file',actor,null)).rejects.toThrow('WORKSPACE_BINDING_INVALID');
 });
 it('recovers the owner SCRIPT_REQUESTED shape using only persisted identities and preserves the uncertain automation evidence',async()=>{
  const f=fixture();await f.approve();const path='projects/P1/workspace_continuity/current';
  f.records.set(path,{projectId:'P1',destinationRootFolderId:'root',folderId:'existing-folder',fileId:'existing-file',googleSubject:'subject',workspaceBlueprintVersion:'TEST-V1',operationId:workspaceOperation('P1'),state:'FAILED',stage:'SCRIPT_REQUESTED',leaseUntil:0,lastSyncError:'WORKSPACE_RECOVERY_REQUIRED'});
  const receipt=structuredClone(f.records.get('projects/P1/workspace_destination/current'));
  const result=await f.service.resume('P1',actor,f.port);await f.service.initializeBound('P1',actor,f.port);
  expect(result).toMatchObject({projectFolderId:'existing-folder',spreadsheetId:'existing-file'});expect(result.scriptProjectId).toBeUndefined();
  expect(f.port.verifyBinding).toHaveBeenCalledWith('root','existing-folder','existing-file','TEST-V1');expect(f.port.verifyWorkbook).toHaveBeenCalled();
  expect(f.port.createProjectFolder).not.toHaveBeenCalled();expect(f.port.createProjectSpreadsheet).not.toHaveBeenCalled();expect(f.port.createBoundScript).not.toHaveBeenCalled();expect(f.port.applyBlueprint).not.toHaveBeenCalled();
  expect(f.records.get(path)).toMatchObject({state:'READY',workspaceState:'CONNECTED',automationState:'DEGRADED',automationStage:'SCRIPT_REQUESTED'});
  expect(f.records.get('projects/P1/workspace_destination/current')).toEqual(receipt);
  expect(f.commits.some(c=>c.value.action==='WORKSPACE_RECOVERY_REQUESTED')).toBe(true);
  await f.service.resume('P1',actor,f.port);expect(f.port.createProjectSpreadsheet).not.toHaveBeenCalled();
 });
 it('refuses a client replacement destination during partial recovery and preserves the receipt',async()=>{
  const f=fixture();await f.approve();vi.mocked(f.port.verifyBinding).mockRejectedValueOnce(Error('interrupted'));await expect(f.provision()).rejects.toThrow();
  await expect(f.provision('P1','replacement')).rejects.toThrow('DESTINATION_RECEIPT_REQUIRED');
  await f.service.resume('P1',actor,f.port);expect(f.port.createProjectFolder).toHaveBeenCalledOnce();expect(f.port.createProjectSpreadsheet).toHaveBeenCalledOnce();
  expect(f.records.get('projects/P1/workspace_destination/current').rootId).toBe('root');
 });
 it('keeps a binding recorded when the file becomes unavailable',async()=>{
  const f=fixture();await f.approve();await f.provision();vi.mocked(f.port.verifyBinding).mockRejectedValueOnce(new GoogleWorkspaceCommandError('BOUND_FILE_UNAVAILABLE',404));
  await expect(f.service.initializeBound('P1',actor,f.port)).rejects.toThrow('BOUND_FILE_UNAVAILABLE');
  const status=await f.service.status('P1',actor);expect(status.binding).not.toBeNull();expect(status.state).toBe('BOUND_FILE_UNAVAILABLE');expect(f.port.createProjectSpreadsheet).toHaveBeenCalledOnce();
 });
 it('preserves binding and automation independence after authorization loss',async()=>{
  const f=fixture();await f.approve();await f.provision();f.records.get('projects/P1/workspace_continuity/current').automationState='DEGRADED';
  expect(await f.service.status('P1',actor)).toMatchObject({workspaceState:'CONNECTED',automationState:'DEGRADED'});
  vi.mocked(f.port.verifyBinding).mockRejectedValueOnce(new GoogleWorkspaceCommandError('TOKEN_EXPIRED',401));await expect(f.service.initializeBound('P1',actor,f.port)).rejects.toThrow('TOKEN_EXPIRED');
  expect(await f.service.status('P1',actor)).toMatchObject({workspaceState:'CONNECTED',syncHealth:'AUTHORIZATION_REQUIRED',binding:{projectId:'P1'},automationState:'DEGRADED'});
 });
 it('uses the owner-local approved workbook and simple dispatcher as the production default',()=>{const b=activeWorkspaceBlueprint();expect(b.approved).toBe(true);expect(b.version).toBe('SABIL-HAIL-V1');expect(b.script?.triggerModel).toBe('SIMPLE_ONLY');expect(b.script?.files).toHaveLength(10);});
 it('creates one human-user folder/workbook and connects without requiring automation',async()=>{const f=fixture();await f.approve();const b=await f.provision();expect(b).toMatchObject({destinationRootFolderId:'root',projectFolderId:expect.stringMatching(/^folder-/),workspaceBlueprintVersion:'TEST-V1'});expect(b.projectFolderId).not.toBe('root');expect(f.resources).toHaveLength(2);expect(f.forbidden).not.toHaveBeenCalled();expect(f.records.get('projects/P1/workspace_continuity/current').state).toBe('READY');});
 it('reuses valid binding without another folder, workbook or script',async()=>{const f=fixture();await f.approve();const a=await f.provision(),b=await f.provision();expect(a.spreadsheetId).toBe(b.spreadsheetId);expect(f.resources).toHaveLength(2);expect(f.port.createBoundScript).not.toHaveBeenCalled();});
 it('concurrent provisioning has one active folder/workbook/script',async()=>{const f=fixture();await f.approve();const result=await Promise.allSettled([f.provision(),f.provision()]);expect(result.some(r=>r.status==='fulfilled')).toBe(true);expect(f.resources.filter(r=>r.role==='FOLDER')).toHaveLength(1);expect(f.resources.filter(r=>r.role==='SPREADSHEET')).toHaveLength(1);expect(f.port.createBoundScript).not.toHaveBeenCalled();});
 it('two Projects may share a destination parent without resource collisions',async()=>{const f=fixture();await f.approve('P1');await f.approve('P2');const a=await f.provision('P1'),b=await f.provision('P2');expect(a.destinationRootFolderId).toBe(b.destinationRootFolderId);expect(a.projectFolderId).not.toBe(b.projectFolderId);expect(a.spreadsheetId).not.toBe(b.spreadsheetId);});
 it('destination change after READY requires migration',async()=>{const f=fixture();await f.approve();await f.provision();await expect(f.provision('P1','other')).rejects.toThrow('EXPLICIT_MIGRATION_REQUIRED');expect(f.resources).toHaveLength(2);});
 it('selection approval cannot be replayed from A into B',async()=>{const f=fixture();await f.approve();await expect(f.provision('P2')).rejects.toThrow('DESTINATION_RECEIPT_REQUIRED');expect(f.resources).toHaveLength(0);});
 it('unassigned or inactive users cannot approve a destination',async()=>{const f=fixture();f.records.get('users/admin').assignedProjectIds=[];await expect(f.approve()).rejects.toThrow('FORBIDDEN_PROJECT_ACCESS');f.records.get('users/admin').status='SUSPENDED';await expect(f.approve()).rejects.toThrow('ACCOUNT_NOT_ACTIVE');expect(f.port.validateDestination).not.toHaveBeenCalled();});
 it('inaccessible/read-only destinations never cause external creation',async()=>{const f=fixture();vi.mocked(f.port.validateDestination).mockRejectedValueOnce(new Error('DESTINATION_NOT_WRITABLE'));await expect(f.approve()).rejects.toThrow('DESTINATION_NOT_WRITABLE');expect(f.resources).toHaveLength(0);});
 it('Google account change cannot consume an approved destination',async()=>{const f=fixture();await f.approve();vi.mocked(f.port.subject).mockResolvedValue('other');await expect(f.provision()).rejects.toThrow('DESTINATION_RECEIPT_REQUIRED');expect(f.resources).toHaveLength(0);});
 it.each(['folder','spreadsheet'])('lost %s creation response reconciles the same tagged artifact',async role=>{const f=fixture();await f.approve();const fn=vi.mocked(role==='folder'?f.port.createProjectFolder:f.port.createProjectSpreadsheet);const original=fn.getMockImplementation()!;fn.mockImplementationOnce(async(...args:any[])=>{await (original as any)(...args);throw Error('response lost')});await expect(f.provision()).rejects.toThrow();await f.provision();expect(f.resources).toHaveLength(2);expect(f.port.createProjectFolder).toHaveBeenCalledOnce();expect(f.port.createProjectSpreadsheet).toHaveBeenCalledOnce();});
 it.each(['authorizeProvisioning','verifyBinding','verifyWorkbook'] as const)('%s failure keeps the same external resources on retry',async stage=>{const f=fixture();await f.approve();vi.mocked(f.port[stage]).mockRejectedValueOnce(new Error('interrupted'));if(stage==='verifyBinding'){await expect(f.provision()).rejects.toThrow();expect(f.records.get('projects/P1/workspace_continuity/current').binding).toBeUndefined();}else{await f.provision();expect(await f.service.status('P1',actor)).toMatchObject({workspaceState:'CONNECTED',binding:{projectId:'P1'},...(stage==='verifyWorkbook'?{workbookHealth:'DEGRADED'}:{automationState:'DEGRADED'})});}await f.provision();expect(f.resources).toHaveLength(2);expect(f.port.createBoundScript).not.toHaveBeenCalled();});
 it('uncertain SCRIPT_REQUESTED does not block a verified binding or create a duplicate script',async()=>{const f=fixture();await f.approve();vi.mocked(f.port.verifyBinding).mockRejectedValueOnce(Error('interrupted'));await expect(f.provision()).rejects.toThrow();const state=f.records.get('projects/P1/workspace_continuity/current');state.stage='SCRIPT_REQUESTED';const b=await f.service.resume('P1',actor,f.port);expect(b.scriptProjectId).toBeUndefined();expect(f.port.createBoundScript).not.toHaveBeenCalled();expect(f.port.createProjectFolder).toHaveBeenCalledOnce();expect(f.port.createProjectSpreadsheet).toHaveBeenCalledOnce();expect((await f.service.status('P1',actor)).workspaceState).toBe('CONNECTED');});
 it('missing optional script does not prevent a valid workbook binding',async()=>{const f=fixture();const b=blueprintFixture();b.script=null;const service=new ProjectGoogleWorkspaceServer(f.db,undefined,()=>b);await service.approveDestination('P1','root',actor,f.port);await service.provision('P1','root',actor,f.port);await service.initializeBound('P1',actor,f.port);expect(f.records.get('projects/P1/workspace_continuity/current')).toMatchObject({state:'READY',automationState:'DEGRADED'});expect(f.port.createBoundScript).not.toHaveBeenCalled();});
 it('uninstalled automation trigger model cannot block or start automation during binding',async()=>{const f=fixture();const b=blueprintFixture();b.script!.triggerModel='INSTALLABLE';const service=new ProjectGoogleWorkspaceServer(f.db,undefined,()=>b);await service.approveDestination('P1','root',actor,f.port);await service.provision('P1','root',actor,f.port);expect(f.records.get('projects/P1/workspace_continuity/current').state).toBe('READY');expect(f.port.installScript).not.toHaveBeenCalled();});
 it('binding-write failure resumes the same verified script and workbook',async()=>{const f=fixture();await f.approve();const impl=f.db.runTransaction.getMockImplementation()!;let failed=false;f.db.runTransaction=vi.fn(async(fn:any)=>impl(async(tx:any)=>{const set=tx.set;tx.set=(r:any,v:any)=>{if(v.binding&&!failed){failed=true;throw Error('commit failed')}set(r,v)};return fn(tx)}));await expect(f.provision()).rejects.toThrow();await f.provision();expect(f.port.createProjectFolder).toHaveBeenCalledOnce();expect(f.port.createProjectSpreadsheet).toHaveBeenCalledOnce();expect(f.port.createBoundScript).not.toHaveBeenCalled();});
 it('existing version remains immutable when the software selects a future release',async()=>{const f=fixture();await f.approve();await f.provision();const next=new ProjectGoogleWorkspaceServer(f.db,undefined,()=>blueprintFixture('TEST-V2'));const old=await next.provision('P1','root',actor,f.port);expect(old.workspaceBlueprintVersion).toBe('TEST-V1');});
});
