import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
const state = vi.hoisted(() => ({ auth: { currentUser: null as any } }));
vi.mock('../firebase/config', () => ({ auth: state.auth, db: {} }));
import { projectFleetReadModelService } from '../services/projectFleetReadModel.service';
import { canonicalRelationshipContextService } from '../services/canonicalRelationshipContext.service';
import { projectProvisioningService } from '../services/projectProvisioning.service';
import { globalTruckRepository } from '../repositories/globalIdentity.repository';
import { projectTruckMembershipRepository } from '../repositories/projectMembership.repository';
import { canonicalProjectRead } from '../services/projectReadTransport';
beforeEach(() => { vi.stubEnv('NODE_ENV', 'production'); state.auth.currentUser = { getIdToken: async () => 'TOKEN' }; });
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.restoreAllMocks(); });
describe('P5-B4 production projection transport', () => {
  it('Fleet and RelationshipContext use scoped server endpoints without browser Global/membership reads', async () => {
    const global = vi.spyOn(globalTruckRepository, 'findById').mockRejectedValue(new Error('DIRECT_GLOBAL_READ'));
    const membership = vi.spyOn(projectTruckMembershipRepository, 'listMemberships').mockRejectedValue(new Error('DIRECT_MEMBERSHIP_READ'));
    const fetch = vi.fn(async (url: string) => ({ ok: true, json: async () => ({ success: true, data: url.endsWith('fleet-read-model') ? { projectId: 'P1', rows: [], truckCount: 0, generatedAt: 'now' } : { projectId: 'P1', knownDrivers: [], activeDriverByTruck: {} } }) })); vi.stubGlobal('fetch', fetch);
    expect((await projectFleetReadModelService.getProjectFleetReadModel('P1')).rows).toEqual([]);
    expect((await canonicalRelationshipContextService.getProjectRelationshipContext('P1')).activeDriverByTruck).toEqual({});
    expect(fetch).toHaveBeenCalledWith('/api/projects/P1/fleet-read-model', { headers: { Authorization: 'Bearer TOKEN' } }); expect(fetch).toHaveBeenCalledWith('/api/projects/P1/relationship-context', { headers: { Authorization: 'Bearer TOKEN' } });
    expect(global).not.toHaveBeenCalled(); expect(membership).not.toHaveBeenCalled();
  });
  it('active Carrier/Material list consumers use canonical server transport', async () => {
    const fetch = vi.fn(async () => ({ ok: true, json: async () => ({ success: true, data: [] }) })); vi.stubGlobal('fetch', fetch);
    await projectProvisioningService.listProjectCarriers('P1'); await projectProvisioningService.listProjectMaterials('P1');
    expect(fetch).toHaveBeenCalledWith('/api/projects/P1/carriers', expect.anything()); expect(fetch).toHaveBeenCalledWith('/api/projects/P1/materials', expect.anything());
  });
  it('removed access, invalid response, wrong Project and unauthenticated state fail without fallback', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 403 }))); await expect(projectFleetReadModelService.getProjectFleetReadModel('P1')).rejects.toThrow('403');
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ success: true, data: { projectId: 'P2', rows: [] } }) }))); await expect(canonicalProjectRead('P1', 'fleet-read-model')).rejects.toThrow('SCOPE_MISMATCH');
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ success: false }) }))); await expect(canonicalProjectRead('P1', 'fleet-read-model')).rejects.toThrow('INVALID');
    state.auth.currentUser = null; await expect(canonicalProjectRead('P1', 'fleet-read-model')).rejects.toThrow('UNAUTHENTICATED');
  });
});

describe('P5-B4 refresh mapping coherence', () => {
  it('refresh rejects a contradictory relationship mapping rather than repairing independently read surfaces', async () => {
    const { ProjectCanonicalRefreshService } = await import('../services/projectCanonicalRefresh.service');
    vi.spyOn(canonicalRelationshipContextService, 'getProjectRelationshipContext').mockResolvedValue({ projectId: 'P1', authorizedCarrierIds: ['C1'], authorizedMaterialIds: ['M1'], knownCarriers: [], knownMaterials: [{ materialId: 'M1', name: 'M', code: 'M', status: 'ACTIVE' }], knownTrucks: [{ truckId: 'T1', plate: 'T', carrierId: 'C1', status: 'ACTIVE' }], knownDrivers: [{ driverId: 'D1', name: 'D', carrierId: 'C1', status: 'ACTIVE' }], activeDriverByTruck: { T1: 'STALE' }, activeMaterialByTruck: { T1: 'STALE' } });
    vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,json:async()=>({success:true,data:{projectId:'P1',consistency:'SERVER_TRANSACTION_SNAPSHOT',project:{projectId:'P1'},setup:{projectId:'P1',participants:[]},readiness:{projectId:'P1'},materials:[],carriers:[],fleetRows:[{projectId:'P1',truckId:'T1',driverId:'D1',materialId:'M1',assignmentEligible:true,allocationEligible:true}],relationshipContext:{projectId:'P1',authorizedCarrierIds:[],authorizedMaterialIds:[],knownCarriers:[],knownMaterials:[],activeDriverByTruck:{T1:'STALE'},activeMaterialByTruck:{T1:'STALE'}}}})})));
    await expect(new ProjectCanonicalRefreshService().refresh('P1',{overrideToken:'TOKEN',maxAttempts:1})).rejects.toThrow('REFRESH_INCOHERENT');
  });
});
