import {beforeEach,afterEach,describe,it,expect,vi} from 'vitest';
import {commandDatabase,accountProfile} from './helpers/commandDatabase';
import {setTestDbOverride} from '../firebase/admin';
import {ProjectWorkspaceInitialProjectionServer} from '../services/projectWorkspaceInitialProjection.server';
import {ProjectGoogleWorkspaceServer} from '../services/projectGoogleWorkspace.server';
import {markDirtyInTransaction,getState} from '../services/projectWorkspaceProjectionState.server';
import {GlobalIdentityGovernanceService} from '../services/globalIdentityAuthority.server';
import {ProjectProvisioningAdminService} from '../services/projectProvisioning.server';
import {MASTER_TABS} from '../services/projectWorkspaceMasterContract';
import {GLOBAL_IDENTITIES,normalizeNaturalKey} from '../utils/globalIdentityPolicy';
const actor={userId:'actor',role:'SUPER_ADMIN' as const,email:'actor@example.invalid',displayName:'Actor',assignedProjectIds:['P1','P2']};
function seed(){
 const data:Record<string,any>={'users/actor':accountProfile()};
 for(const p of ['P1','P2','P3'])data['projects/'+p]={projectId:p,nameAr:p,status:'SETUP',settings:{}};
 data['carriers/C']={carrierId:'C',commercialRegistrationNo:'1010123456',nameAr:'Carrier',status:'ACTIVE'};
 data['materials/M']={materialId:'M',code:'MAT',nameAr:'Material',unitOfMeasure:'TON',status:'ACTIVE'};
 data['drivers/D']={driverId:'D',nationalId:'1234567890',fullNameAr:'Driver',phone:'0500000000',status:'ACTIVE'};
 data['trucks/T']={truckId:'T',plate:'ا ب ج 1234',normalizedPlate:normalizeNaturalKey('TRUCK','ا ب ج 1234'),truckType:'TIPPER_32M3',status:'ACTIVE'};
 for(const kind of ['CARRIER','MATERIAL','DRIVER','TRUCK'] as const){const spec=GLOBAL_IDENTITIES[kind],id={CARRIER:'C',MATERIAL:'M',DRIVER:'D',TRUCK:'T'}[kind];data['projects/P1/'+spec.kind+'_memberships/'+id]={projectId:'P1',[spec.id]:id,status:'ACTIVE'};}
 data['projects/P2/carrier_memberships/C']={projectId:'P2',carrierId:'C',status:'SUSPENDED'};
 for(const [kind,id] of [['driver','D'],['truck','T']])data['projects/P1/'+kind+'_carrier_affiliations/'+id]={projectId:'P1',[kind+'Id']:id,carrierId:'C',status:'ACTIVE'};
 const interval={projectId:'P1',status:'ACTIVE',effectiveFrom:'2020-01-01T00:00:00Z',effectiveTo:null};
 data['projects/P1/driver_truck_assignments/A']={...interval,assignmentId:'A',driverId:'D',truckId:'T'};
 data['projects/P1/driver_active_assignments/D']={assignmentId:'A'};data['projects/P1/truck_active_assignments/T']={assignmentId:'A'};
 data['projects/P1/truck_material_allocations/L']={...interval,allocationId:'L',truckId:'T',materialId:'M'};data['projects/P1/truck_active_material_allocations/T']={allocationId:'L'};
 data['projects/P1/workspace_continuity/current']={projectId:'P1',state:'READY',workspaceState:'CONNECTED',binding:{projectId:'P1',spreadsheetId:'file',projectFolderId:'folder',destinationRootFolderId:'root',workspaceBlueprintVersion:'TEST-V1',googleSubject:'subject',provider:'GOOGLE'}};
 return data;
}
let x:ReturnType<typeof commandDatabase>;
const reader=new ProjectWorkspaceInitialProjectionServer();
beforeEach(()=>{x=commandDatabase(seed());setTestDbOverride(x.db)});
afterEach(()=>{vi.restoreAllMocks()});
const dirty=(tabs:string[])=>x.db.runTransaction((tx:any)=>markDirtyInTransaction(tx,'P1',tabs,'TEST_MUTATION',undefined,x.db));
function port(){return {subject:vi.fn(async()=> 'subject'),verifyBinding:vi.fn(async()=>({title:'Sheet'})),verify:vi.fn(async()=>{}),projectMasterTabs:vi.fn(async()=>{}),upsert:vi.fn(async()=>{}),validateTemplate:async()=>{},findCopies:async()=>[],createFolder:async()=> 'unused',copyTemplate:async()=> 'unused',initializeCopy:async()=>{}};}

describe('Firebase canonical master snapshots',()=>{
 it('joins current project participation and temporal authorities without invented data',async()=>{
  const s=await reader.buildCanonicalProjection('P1',x.db);
  expect(s.drivers[0]).toMatchObject({driverId:'D',projectId:'P1',fullNameAr:'Driver',idNumber:'1234567890',assignedTruckId:'T',carrierId:'C',membershipStatus:'ACTIVE'});
  expect(s.fleetRows[0]).toMatchObject({truckId:'T',driverId:'D',materialId:'M',carrierId:'C',truckType:'TIPPER_32M3'});
  expect(s.materials[0].standardDensityTonPerM3).toBeUndefined();expect(s.drivers[0].licenseNumber).toBe('');
  expect(s.carriers).toHaveLength(1);expect(s.materials).toHaveLength(1);
 });
 it('keeps suspended/removed participation visible and never exports another project membership',async()=>{
  x.store['projects/P1/driver_memberships/D'].status='REMOVED';x.store['projects/P1/carrier_memberships/C'].status='SUSPENDED';
  const p1=await reader.buildCanonicalProjection('P1',x.db),p2=await reader.buildCanonicalProjection('P2',x.db);
  expect(p1.drivers[0].membershipStatus).toBe('REMOVED');expect(p1.carriers[0].membershipStatus).toBe('SUSPENDED');
  expect(p2.drivers).toEqual([]);expect(p2.materials).toEqual([]);expect(p2.fleetRows).toEqual([]);expect(p2.carriers[0].projectId).toBe('P2');
 });
 it('represents an empty project with four empty canonical datasets and retained header contracts',async()=>{
  const s=await reader.buildCanonicalProjection('P3',x.db);expect([s.drivers,s.carriers,s.materials,s.fleetRows]).toEqual([[],[],[],[]]);
  expect(MASTER_TABS).toHaveLength(4);for(const tab of MASTER_TABS)expect(tab.columns).toContain(tab.primaryKey);
 });
});

describe('one durable projection outbox and canonical delivery',()=>{
 it('queues only metadata atomically and delivers current data rather than queued/client rows',async()=>{
  await dirty(['DRIVERS']);const path='projects/P1/workspace_sync_outbox/MASTER_DATA';
  expect(x.store[path]).toMatchObject({kind:'MASTER_DATA',revision:1,dirtyTabs:['DRIVERS'],status:'PENDING'});expect(x.store[path].input).toBeUndefined();
  x.store['drivers/D'].fullNameAr='Current canonical name';x.store[path].input={projectId:'P2',fullNameAr:'untrusted row'};
  const google=port(),service=new ProjectGoogleWorkspaceServer(x.db);await service.retrySync('P1',actor,google);
  const call=google.projectMasterTabs.mock.calls[0] as unknown as [string,any,string[]];expect(call[0]).toBe('file');expect(call[1].drivers[0].fullNameAr).toBe('Current canonical name');expect(call[2]).toEqual(['DRIVERS']);
  expect(x.store[path].status).toBe('DELIVERED');expect((await getState('P1',x.db)).dirtyTabs).toEqual([]);expect(google.upsert).not.toHaveBeenCalled();
  await service.retrySync('P1',actor,google);expect(google.projectMasterTabs).toHaveBeenCalledOnce();
 });
 it('keeps binding and durable work when a provider write fails',async()=>{
  await dirty(['CARRIERS']);const google=port();google.projectMasterTabs.mockRejectedValueOnce(Error('provider interruption'));
  await expect(new ProjectGoogleWorkspaceServer(x.db).retrySync('P1',actor,google)).rejects.toThrow('SHEET_SYNC_FAILED');
  expect(x.store['projects/P1/workspace_sync_outbox/MASTER_DATA'].status).toBe('PENDING');
  expect(x.store['projects/P1/workspace_continuity/current']).toMatchObject({state:'SYNC_DEGRADED',binding:{spreadsheetId:'file'}});
 });
 it('does not acknowledge a newer mutation arriving during Google delivery',async()=>{
  await dirty(['DRIVERS']);const google=port();google.projectMasterTabs.mockImplementationOnce(async()=>{await dirty(['MATERIALS'])});
  const service=new ProjectGoogleWorkspaceServer(x.db);await expect(service.retrySync('P1',actor,google)).rejects.toThrow();
  expect(x.store['projects/P1/workspace_sync_outbox/MASTER_DATA']).toMatchObject({status:'PENDING',revision:2});
  expect((await getState('P1',x.db)).dirtyTabs).toEqual(['DRIVERS','MATERIALS']);
  await service.retrySync('P1',actor,google);expect(x.store['projects/P1/workspace_sync_outbox/MASTER_DATA'].status).toBe('DELIVERED');
 });
 it('cannot clear dirty state or acknowledge work after losing execution ownership',async()=>{
  await dirty(['DRIVERS']);const google=port();google.projectMasterTabs.mockImplementationOnce(async()=>{x.store['projects/P1/workspace_continuity/current'].syncOwner='another-owner'});
  await expect(new ProjectGoogleWorkspaceServer(x.db).retrySync('P1',actor,google)).rejects.toThrow('WORKSPACE_EXECUTION_FENCED');
  expect((await getState('P1',x.db)).dirtyTabs).toEqual(['DRIVERS']);expect(x.store['projects/P1/workspace_sync_outbox/MASTER_DATA'].status).toBe('PENDING');expect(x.store['projects/P1/workspace_continuity/current'].syncOwner).toBe('another-owner');
 });
 it('rejects foreign project event scope before any Sheet write',async()=>{
  await dirty(['DRIVERS']);x.store['projects/P1/workspace_sync_outbox/MASTER_DATA'].projectId='P2';const google=port();
  await expect(new ProjectGoogleWorkspaceServer(x.db).retrySync('P1',actor,google)).rejects.toThrow('WORKSPACE_EVENT_SCOPE_INVALID');expect(google.projectMasterTabs).not.toHaveBeenCalled();
 });
 it('rolls canonical mutation back if atomic outbox persistence fails',async()=>{
  x.failWrites('workspace_sync_outbox');await expect(x.db.runTransaction(async(tx:any)=>{await markDirtyInTransaction(tx,'P1',['DRIVERS'],'MUTATION',undefined,x.db);tx.update(x.db.collection('drivers').doc('D'),{fullNameAr:'not committed'})})).rejects.toThrow();
  expect(x.store['drivers/D'].fullNameAr).toBe('Driver');expect(x.store['projects/P1/workspace_projection_state/current']).toBeUndefined();
 });
});

describe('shared global entity invalidation',()=>{
 it('does not turn a malformed legacy Project document ID into work for another namespace',async()=>{
  x.store['projects/ P4 ']={projectId:' P4 ',status:'SETUP'};x.store['projects/ P4 /carrier_memberships/C']={projectId:' P4 ',carrierId:'C',status:'ACTIVE'};
  await new GlobalIdentityGovernanceService(x.db).setStatus('CARRIER','C','INACTIVE',actor);
  expect(x.store['projects/P4/workspace_sync_outbox/MASTER_DATA']).toBeUndefined();expect(x.store['projects/P4/workspace_projection_state/current']).toBeUndefined();
 });
 it.each([
  ['CARRIER','C','carriers','carrierId','CARRIERS'],['MATERIAL','M','materials','materialId','MATERIALS'],['DRIVER','D','drivers','driverId','DRIVERS'],['TRUCK','T','fleetRows','truckId','FLEET_ROSTER'],
 ] as const)('%s canonical mutation reaches only its Project master projection and preserves operational history',async(kind,id,source,idField,tab)=>{
  const history={tripId:'historical',projectId:'P1',driverSnapshot:{fullNameAr:'Event-time name'},pricingSnapshot:{agreedRate:100}};x.store['projects/P1/trips/historical']=structuredClone(history);
  const next=GLOBAL_IDENTITIES[kind].statuses.find(status=>status!=='ACTIVE')!;await new GlobalIdentityGovernanceService(x.db).setStatus(kind,id,next,actor);
  const google=port();await new ProjectGoogleWorkspaceServer(x.db).retrySync('P1',actor,google);
  const call=google.projectMasterTabs.mock.calls[0] as unknown as [string,any,string[]];expect(call[2]).toContain(tab);expect(call[1][source].find((row:any)=>row[idField]===id)).toMatchObject({projectId:'P1',status:next});
  expect(x.store['projects/P1/trips/historical']).toEqual(history);
 });
 it('fans global status changes out to each participating Project, including suspended membership',async()=>{
  await new GlobalIdentityGovernanceService(x.db).setStatus('CARRIER','C','INACTIVE',actor);
  for(const p of ['P1','P2'])expect(x.store['projects/'+p+'/workspace_sync_outbox/MASTER_DATA']).toMatchObject({projectId:p,status:'PENDING',dirtyTabs:['DRIVERS','CARRIERS','FLEET_ROSTER']});
  expect(x.store['projects/P3/workspace_sync_outbox/MASTER_DATA']).toBeUndefined();
 });
 it('fans current carrier profile updates out without copying any business rows into the queue',async()=>{
  await new ProjectProvisioningAdminService().updateProjectCarrier('P1','C',{name:'Updated Carrier'},actor);
  expect(x.store['projects/P2/workspace_sync_outbox/MASTER_DATA']).toMatchObject({projectId:'P2',status:'PENDING'});
  const data=await reader.buildCanonicalProjection('P1',x.db);expect(data.carriers[0].companyNameAr).toBe('Updated Carrier');
 });
});
