import { describe, it, expect, vi } from 'vitest';
import { ProjectGoogleWorkspaceServer, continuityRef, syncOutboxRef, workspaceOperation, GoogleWorkspaceCommandError } from '../services/projectGoogleWorkspace.server';
import type { GoogleTemplatePort } from '../services/projectGoogleWorkspace.server';
import { sourceCells, writableCells, LOADING_WRITABLE, OFFLOAD_WRITABLE, sheetCorrelation, type OperationalSheetInput } from '../services/projectGoogleSheetContract';
import { enqueueTripGoogleProjection } from '../services/projectGoogleSheetEvent.server';
import { classifyGoogleWorkspaceError } from '../utils/googleWorkspaceErrors';
function database(seed: Record<string, any>) {
  const records = new Map(Object.entries(structuredClone(seed)));
  const versions = new Map<string, number>();
  const commits: Array<{ path: string; value: any }> = [];
  const reads: string[] = [];
  const snapshot = (path: string) => ({ id: path.split('/').at(-1), exists: records.has(path), data: () => structuredClone(records.get(path)) });
  const ref = (path: string, collection = false, filter?: [string, any]): any => ({
    path, collectionKind: collection,
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
const who={userId:'admin',email:'',displayName:'',role:'PROJECT_ADMIN' as const,assignedProjectIds:['P1']};
const project=(id:string)=>({projectId:id,nameAr:'Project',nameEn:'Project',status:'SETUP',settings:{},createdAt:'2026-10-31T00:00:00Z',updatedAt:'2026-10-31T00:00:00Z'});
function fixture(){
 const data=database({'projects/P1':project('P1'),'projects/P2':project('P2'),'users/admin':{userId:'admin',role:'PROJECT_ADMIN',assignedProjectIds:['P1'],status:'ACTIVE'}});
 const port={subject:vi.fn(async()=> 'google-1'),validateTemplate:vi.fn(async()=>{}),findCopies:vi.fn(async()=>[]),createFolder:vi.fn(async()=> 'folder-1'),copyTemplate:vi.fn(async()=> 'file-1'),verify:vi.fn(async()=>{}),initializeCopy:vi.fn(async()=>{}),upsert:vi.fn(async(_file:string,_input:OperationalSheetInput)=>{})} satisfies GoogleTemplatePort;
 const service=new ProjectGoogleWorkspaceServer(data.db,()=>({id:'template-v1',version:'V1'}));
 return {...data,port,service};
}
const input={projectId:'P1',tripId:'trip-1',ticketId:'001',ticketSeries:'abc',weightUnit:'kg' as const,tare:16000,gross:42000,carrierLabel:'Carrier',materialLabel:'Wheat',truckPlate:'ABC',firstWeighbridgeAt:'2026-10-31T07:00:00Z'};
const statePath='projects/P1/workspace_continuity/current';
describe('PFAG-GWS1 provisioning',()=>{
 it('copies once and atomically binds canonical project + template + audit',async()=>{const f=fixture();const b=await f.service.provisionLegacyForTests('P1',who,f.port);expect(b.templateVersion).toBe('V1');expect(f.port.copyTemplate).toHaveBeenCalledTimes(1);expect(f.records.get('projects/P1').settings.googleSpreadsheetId).toBe('file-1');expect([...f.records.values()].some(x=>x.action==='WORKSPACE_BOUND')).toBe(true);});
 it('retries success without another copy or clearing data',async()=>{const f=fixture();await f.service.provisionLegacyForTests('P1',who,f.port);await f.service.provisionLegacyForTests('P1',who,f.port);expect(f.port.copyTemplate).toHaveBeenCalledTimes(1);expect(f.port.initializeCopy).toHaveBeenCalledTimes(1);});
 it('concurrent provisioners create only one workbook',async()=>{const f=fixture();const r=await Promise.allSettled([f.service.provisionLegacyForTests('P1',who,f.port),f.service.provisionLegacyForTests('P1',who,f.port)]);expect(r.filter(x=>x.status==='fulfilled')).toHaveLength(1);expect(f.port.copyTemplate).toHaveBeenCalledTimes(1);});
 it('reconciles lost copy response through external operation receipt',async()=>{const f=fixture();f.port.copyTemplate.mockRejectedValueOnce(new Error('response lost'));await expect(f.service.provisionLegacyForTests('P1',who,f.port)).rejects.toThrow('PROVISIONING_FAILED');f.port.findCopies.mockResolvedValueOnce([{id:'file-1',folderId:'folder-1'}] as never);const b=await f.service.provisionLegacyForTests('P1',who,f.port);expect(b.spreadsheetId).toBe('file-1');expect(f.port.copyTemplate).toHaveBeenCalledTimes(1);});
 it('never recopies an ambiguous outcome even if Drive search is empty',async()=>{const f=fixture();f.port.copyTemplate.mockRejectedValueOnce(new Error('lost'));await expect(f.service.provisionLegacyForTests('P1',who,f.port)).rejects.toThrow();await expect(f.service.provisionLegacyForTests('P1',who,f.port)).rejects.toThrow('WORKSPACE_COPY_OUTCOME_UNCONFIRMED');expect(f.port.copyTemplate).toHaveBeenCalledTimes(1);});
 it('binding write failure recovers same external file',async()=>{const f=fixture();const tx=f.db.runTransaction.getMockImplementation()!;let failed=false;f.db.runTransaction=vi.fn(async(fn:any)=>tx(async(t:any)=>{const set=t.set;t.set=(r:any,v:any)=>{if(v.binding&&!failed){failed=true;throw Error('binding write unavailable')}set(r,v)};return fn(t)}));await expect(f.service.provisionLegacyForTests('P1',who,f.port)).rejects.toThrow();await f.service.provisionLegacyForTests('P1',who,f.port);expect(f.port.copyTemplate).toHaveBeenCalledTimes(1);});
 it.each(['TEMPLATE_NOT_FOUND','TEMPLATE_ACCESS_DENIED','TEMPLATE_STRUCTURE_INVALID'])('%s fails closed without a copy',async(code)=>{const f=fixture();f.port.validateTemplate.mockRejectedValueOnce(new GoogleWorkspaceCommandError(code));await expect(f.service.provisionLegacyForTests('P1',who,f.port)).rejects.toThrow(code);expect(f.port.copyTemplate).not.toHaveBeenCalled();expect(f.records.get(statePath).binding).toBeUndefined();});
 it('invalid copied structure never becomes READY',async()=>{const f=fixture();f.port.verify.mockRejectedValueOnce(new GoogleWorkspaceCommandError('TEMPLATE_STRUCTURE_INVALID'));await expect(f.service.provisionLegacyForTests('P1',who,f.port)).rejects.toThrow('TEMPLATE_STRUCTURE_INVALID');expect(f.records.get(statePath).binding).toBeUndefined();});
 it('denies another project before Google access',async()=>{const f=fixture();await expect(f.service.provisionLegacyForTests('P2',who,f.port)).rejects.toThrow('FORBIDDEN_PROJECT_ACCESS');expect(f.port.subject).not.toHaveBeenCalled();});
 it('denies suspended current principal',async()=>{const f=fixture();f.records.get('users/admin').status='SUSPENDED';await expect(f.service.provisionLegacyForTests('P1',who,f.port)).rejects.toThrow('ACCOUNT_NOT_ACTIVE');});
 it('missing bound file never triggers replacement',async()=>{const f=fixture();await f.service.provisionLegacyForTests('P1',who,f.port);f.port.verify.mockRejectedValueOnce(new GoogleWorkspaceCommandError('PROJECT_WORKSPACE_FILE_MISSING'));await expect(f.service.provisionLegacyForTests('P1',who,f.port)).rejects.toThrow('PROJECT_WORKSPACE_FILE_MISSING');expect(f.port.copyTemplate).toHaveBeenCalledTimes(1);});
 it('account switching requires explicit migration',async()=>{const f=fixture();await f.service.provisionLegacyForTests('P1',who,f.port);f.port.subject.mockResolvedValueOnce('google-2');await expect(f.service.provisionLegacyForTests('P1',who,f.port)).rejects.toThrow('WORKSPACE_ACCOUNT_CHANGE_REQUIRES_EXPLICIT_MIGRATION');expect(f.port.copyTemplate).toHaveBeenCalledTimes(1);});
 it('template changes affect only future projects',async()=>{const f=fixture();const a=await f.service.provisionLegacyForTests('P1',who,f.port);const next=new ProjectGoogleWorkspaceServer(f.db,()=>({id:'template-v2',version:'V2'}));expect((await next.provisionLegacyForTests('P1',who,f.port)).templateVersion).toBe('V1');f.records.get('users/admin').assignedProjectIds.push('P2');expect((await next.provisionLegacyForTests('P2',who,f.port)).templateVersion).toBe('V2');expect(a.templateId).toBe('template-v1');});
 it('public status never returns token-bearing internal fields',async()=>{const f=fixture();await f.service.provisionLegacyForTests('P1',who,f.port);f.records.get(statePath).access_token='SECRET';f.records.get(statePath).binding.refresh_token='SECRET';expect(JSON.stringify(await f.service.status('P1',who))).not.toContain('SECRET');expect(JSON.stringify(f.commits)).not.toContain('SECRET');});
});
describe('PFAG-GWS1 input contract',()=>{
 it('protects Net Weight T and all derived/formula columns',()=>{const x=sourceCells(input);expect(x.loading.R).toBe(16000);expect(x.loading.S).toBe(42000);expect(x.loading.Q).toBe('kg');expect(x.loading).not.toHaveProperty('T');expect(()=>writableCells({T:26000},LOADING_WRITABLE)).toThrow('SHEET_COLUMN_NOT_WRITABLE');});
 it('correlation is source + ticket, independent of canonical trip ID',()=>{expect(sheetCorrelation(input)).toBe('ABC|001');expect(sheetCorrelation(input)).not.toBe(input.tripId);});
 it('needs no driver and projects carrier/material/plate labels',()=>{const x=sourceCells(input);expect(x.loading).toMatchObject({E:'Carrier',F:'ABC',P:'Wheat'});expect(x.loading).not.toHaveProperty('driverId');});
 it('offload kg-to-tonne is explicit and formula H stays protected',()=>{const x=sourceCells({...input,warehouseWeightTonnes:26,arrivalAt:'2026-10-31T10:00:00Z'});expect(x.offload.D).toBe(26);expect(x.offload.G).toBe('ABC|001');expect(x.offload).not.toHaveProperty('H');expect(x.hasOffload).toBe(true);});
 it('undefined does not mutate; only remarks can explicitly clear',()=>{expect(writableCells({F:null,B:undefined},OFFLOAD_WRITABLE)).toEqual([['F','']]);expect(()=>writableCells({B:null},OFFLOAD_WRITABLE)).toThrow('SHEET_CLEAR_NOT_ALLOWED');});
 it('timestamps are numeric workbook serials, never invented dates',()=>{expect(sourceCells(input).loading.B).toBeCloseTo(46326+10/24,6);expect(sourceCells({...input,firstWeighbridgeAt:undefined}).loading.B).toBeUndefined();expect(()=>sourceCells({...input,firstWeighbridgeAt:'yesterday'})).toThrow('SHEET_TIMESTAMP_INVALID');});
 it.each(['TON','KG','lbs'])('rejects ambiguous unit %s',unit=>{expect(()=>sourceCells({...input,weightUnit:unit as any})).toThrow('SHEET_WEIGHT_UNIT_INVALID')});
});
describe('PFAG-GWS1 durable retry',()=>{
 async function ready(){const f=fixture();await f.service.provisionLegacyForTests('P1',who,f.port);const ref=syncOutboxRef(f.db,'P1').doc('event-1');f.records.set(ref.path,{projectId:'P1',tripId:'trip-1',input,revision:1,status:'PENDING'});return f;}
 it('Google failure leaves canonical data and pending event intact, retry converges',async()=>{const f=await ready();f.records.set('projects/P1/trips/trip-1',{tripId:'trip-1'});f.port.upsert.mockRejectedValueOnce(new Error('offline'));await expect(f.service.retrySync('P1',who,f.port)).rejects.toThrow('SHEET_SYNC_FAILED');expect(f.records.get('projects/P1/trips/trip-1')).toEqual({tripId:'trip-1'});expect((await f.service.status('P1',who)).pendingSyncCount).toBe(1);await f.service.retrySync('P1',who,f.port);expect((await f.service.status('P1',who)).pendingSyncCount).toBe(0);});
 it('delivered event is not redelivered on retry',async()=>{const f=await ready();await f.service.retrySync('P1',who,f.port);await f.service.retrySync('P1',who,f.port);expect(f.port.upsert).toHaveBeenCalledTimes(1);});
 it('revision changed in-flight remains pending for latest-state convergence',async()=>{const f=await ready();f.port.upsert.mockImplementationOnce(async()=>{const e=f.records.get('projects/P1/workspace_sync_outbox/event-1');e.revision=2;e.input={...input,gross:43000}});await f.service.retrySync('P1',who,f.port);expect((await f.service.status('P1',who)).pendingSyncCount).toBe(1);await f.service.retrySync('P1',who,f.port);expect(f.port.upsert.mock.calls.at(-1)?.[1].gross).toBe(43000);});
 it('cross-project event is never written',async()=>{const f=await ready();f.records.get('projects/P1/workspace_sync_outbox/event-1').input={...input,projectId:'P2'};await expect(f.service.retrySync('P1',who,f.port)).rejects.toThrow('WORKSPACE_EVENT_SCOPE_INVALID');expect(f.port.upsert).not.toHaveBeenCalled();});
 it('coalesces canonical snapshots monotonically, with explicit mapping debt',async()=>{const f=fixture();const trip={tripId:'t',projectId:'P1',weights:{},sourceMetadata:{}} as any;await enqueueTripGoogleProjection(f.db,trip);await enqueueTripGoogleProjection(f.db,trip);const events=await syncOutboxRef(f.db,'P1').get();expect(events.docs).toHaveLength(1);expect(events.docs[0].data()).toMatchObject({revision:2,mappingRequired:true,status:'PENDING'});});
});
describe('PFAG-GWS1 OAuth evidence',()=>{
 it.each([['access_denied','AUTHORIZATION_DENIED'],['auth/popup-closed-by-user','POPUP_CLOSED'],['scope_denied','SCOPE_DENIED'],['token_expired','TOKEN_EXPIRED'],['network-request-failed','NETWORK_ERROR'],['app has not completed verification; not verified','OAUTH_APP_CONFIGURATION_BLOCK']])('%s -> %s',(code,expected)=>expect(classifyGoogleWorkspaceError({code})).toBe(expected));
});
