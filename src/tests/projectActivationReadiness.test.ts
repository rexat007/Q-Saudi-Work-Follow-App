import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProjectReadinessService, ReadinessResult } from '../services/projectReadiness.service';
import { ProjectReadinessReadContext } from '../services/projectReadiness.context';
import { ProjectEntity, PricingRuleEntity } from '../types/entities';
import { 
  ProjectMaterialMembershipEntity, 
  ProjectCarrierMembershipEntity, 
  ProjectDriverMembershipEntity, 
  ProjectTruckMembershipEntity 
} from '../types/projectMembership';
import { 
  ProjectDriverCarrierAffiliationEntity,
  ProjectTruckCarrierAffiliationEntity
} from '../types/projectCarrierAffiliation';
import { ProjectDriverTruckAssignmentEntity, ActiveAssignmentSlotPayload } from '../types/projectDriverTruckAssignment';
import { ProjectTruckMaterialAllocationEntity, ActiveTruckMaterialSlotPayload } from '../types/projectTruckMaterialAllocation';
import { ProjectActivationService, NonTransactionReadContext } from '../services/projectActivation.service';
import { AuthUserContext } from '../types/common';

let mockDatabase: Record<string, any> = {};

vi.mock('firebase/firestore', async (importOriginal) => {
  const original = await importOriginal<typeof import('firebase/firestore')>();
  return {
    ...original,
    doc: vi.fn((_db, ...parts) => {
      return {
        id: parts[parts.length - 1],
        path: parts.join('/'),
        type: 'document'
      };
    }),
    runTransaction: vi.fn(async (_db, callback) => {
      const transactionMock = {
        get: vi.fn(async (docRef: any) => {
          const path = docRef.path;
          const data = mockDatabase[path];
          return {
            exists: () => data !== undefined,
            data: () => data,
          };
        }),
        update: vi.fn((_docRef, _data) => {}),
      };
      return await callback(transactionMock);
    }),
  };
});

class MockReadContext implements ProjectReadinessReadContext {
  public project: ProjectEntity | null = null;
  public materialMemberships: ProjectMaterialMembershipEntity[] = [];
  public carrierMemberships: ProjectCarrierMembershipEntity[] = [];
  public driverMemberships: ProjectDriverMembershipEntity[] = [];
  public truckMemberships: ProjectTruckMembershipEntity[] = [];
  public driverAffiliations: Record<string, ProjectDriverCarrierAffiliationEntity> = {};
  public truckAffiliations: Record<string, ProjectTruckCarrierAffiliationEntity> = {};
  public driverAssignments: Record<string, ProjectDriverTruckAssignmentEntity> = {};
  public truckAssignments: Record<string, ProjectDriverTruckAssignmentEntity> = {};
  public truckAllocations: Record<string, ProjectTruckMaterialAllocationEntity> = {};
  public pricingRules: PricingRuleEntity[] = [];

  async getProject(projectId: string): Promise<ProjectEntity | null> { return this.project; }
  async listActiveMaterialMemberships(projectId: string): Promise<ProjectMaterialMembershipEntity[]> { return this.materialMemberships.filter(m => m.status === 'ACTIVE'); }
  async listActiveCarrierMemberships(projectId: string): Promise<ProjectCarrierMembershipEntity[]> { return this.carrierMemberships.filter(c => c.status === 'ACTIVE'); }
  async listActiveDriverMemberships(projectId: string): Promise<ProjectDriverMembershipEntity[]> { return this.driverMemberships.filter(d => d.status === 'ACTIVE'); }
  async listActiveTruckMemberships(projectId: string): Promise<ProjectTruckMembershipEntity[]> { return this.truckMemberships.filter(t => t.status === 'ACTIVE'); }
  async getDriverCarrierAffiliation(projectId: string, driverId: string): Promise<ProjectDriverCarrierAffiliationEntity | null> { return this.driverAffiliations[driverId] || null; }
  async getTruckCarrierAffiliation(projectId: string, truckId: string): Promise<ProjectTruckCarrierAffiliationEntity | null> { return this.truckAffiliations[truckId] || null; }
  async getActiveDriverAssignment(projectId: string, driverId: string): Promise<ProjectDriverTruckAssignmentEntity | null> { return this.driverAssignments[driverId] || null; }
  async getActiveTruckAssignment(projectId: string, truckId: string): Promise<ProjectDriverTruckAssignmentEntity | null> { return this.truckAssignments[truckId] || null; }
  async getActiveTruckAllocation(projectId: string, truckId: string): Promise<ProjectTruckMaterialAllocationEntity | null> { return this.truckAllocations[truckId] || null; }
  async listPricingRules(projectId: string): Promise<PricingRuleEntity[]> { return this.pricingRules; }
}

describe('ProjectReadinessService Behavioral Test Suite', () => {
  let readinessService: ProjectReadinessService;
  let mockContext: MockReadContext;

  beforeEach(() => {
    readinessService = new ProjectReadinessService();
    mockContext = new MockReadContext();
    mockContext.project = { projectId: 'test-proj', nameAr: 'Test', status: 'SETUP' } as ProjectEntity;
  });

  // Helpers
  const setupValidPath = () => {
    mockContext.materialMemberships = [{ materialId: 'm1', status: 'ACTIVE' } as any];
    mockContext.carrierMemberships = [{ carrierId: 'c1', status: 'ACTIVE' } as any];
    mockContext.driverMemberships = [{ driverId: 'd1', status: 'ACTIVE' } as any];
    mockContext.truckMemberships = [{ truckId: 't1', status: 'ACTIVE' } as any];
    mockContext.driverAffiliations = { d1: { carrierId: 'c1', status: 'ACTIVE' } as any };
    mockContext.truckAffiliations = { t1: { carrierId: 'c1', status: 'ACTIVE' } as any };
    mockContext.driverAssignments = { d1: { truckId: 't1', status: 'ACTIVE', assignmentId: 'a1' } as any };
    mockContext.truckAllocations = { t1: { truckId: 't1', materialId: 'm1', status: 'ACTIVE', allocationId: 'al1' } as any };
    mockContext.pricingRules = [{ projectId: 'test-proj', carrierId: 'c1', materialId: 'm1', effectiveFrom: '2000-01-01', effectiveTo: '3000-01-01' } as any];
  };

  it('M01 — no active material', async () => { setupValidPath(); mockContext.materialMemberships = []; const r = await readinessService.evaluateProjectReadiness('test-proj', new Date(), mockContext); expect(r.blockers.some(b => b.code === 'NO_ACTIVE_MATERIAL')).toBe(true); });
  it('M02 — inactive material', async () => { setupValidPath(); mockContext.materialMemberships = [{ materialId: 'm1', status: 'INACTIVE' } as any]; const r = await readinessService.evaluateProjectReadiness('test-proj', new Date(), mockContext); expect(r.ready).toBe(false); });
  it('M03 — no material membership', async () => { setupValidPath(); mockContext.materialMemberships = []; const r = await readinessService.evaluateProjectReadiness('test-proj', new Date(), mockContext); expect(r.ready).toBe(false); });

  it('C01 — no active carrier', async () => { setupValidPath(); mockContext.carrierMemberships = []; const r = await readinessService.evaluateProjectReadiness('test-proj', new Date(), mockContext); expect(r.blockers.some(b => b.code === 'NO_ACTIVE_CARRIER')).toBe(true); });
  it('C02 — inactive carrier', async () => { setupValidPath(); mockContext.carrierMemberships = [{ carrierId: 'c1', status: 'INACTIVE' } as any]; const r = await readinessService.evaluateProjectReadiness('test-proj', new Date(), mockContext); expect(r.ready).toBe(false); });
  it('C03 — no carrier membership', async () => { setupValidPath(); mockContext.carrierMemberships = []; const r = await readinessService.evaluateProjectReadiness('test-proj', new Date(), mockContext); expect(r.ready).toBe(false); });

  it('P01 — no driver/truck graph', async () => { setupValidPath(); mockContext.driverAssignments = {}; const r = await readinessService.evaluateProjectReadiness('test-proj', new Date(), mockContext); expect(r.blockers.some(b => b.code === 'NO_COMPLETE_OPERATIONAL_PATH')).toBe(true); });
  it('P02 — driver membership absent', async () => { setupValidPath(); mockContext.driverMemberships = []; const r = await readinessService.evaluateProjectReadiness('test-proj', new Date(), mockContext); expect(r.ready).toBe(false); });
  it('P03 — truck membership absent', async () => { setupValidPath(); mockContext.truckMemberships = []; const r = await readinessService.evaluateProjectReadiness('test-proj', new Date(), mockContext); expect(r.ready).toBe(false); });
  it('P04 — driver affiliation absent', async () => { setupValidPath(); mockContext.driverAffiliations = {}; const r = await readinessService.evaluateProjectReadiness('test-proj', new Date(), mockContext); expect(r.ready).toBe(false); });
  it('P05 — truck affiliation absent', async () => { setupValidPath(); mockContext.truckAffiliations = {}; const r = await readinessService.evaluateProjectReadiness('test-proj', new Date(), mockContext); expect(r.ready).toBe(false); });
  it('P06 — different carriers', async () => { setupValidPath(); mockContext.truckAffiliations = { t1: { carrierId: 'c2', status: 'ACTIVE' } as any }; const r = await readinessService.evaluateProjectReadiness('test-proj', new Date(), mockContext); expect(r.ready).toBe(false); });
  it('P07 — active assignment absent', async () => { setupValidPath(); mockContext.driverAssignments = {}; const r = await readinessService.evaluateProjectReadiness('test-proj', new Date(), mockContext); expect(r.ready).toBe(false); });
  it('P08 — active allocation absent', async () => { setupValidPath(); mockContext.truckAllocations = {}; const r = await readinessService.evaluateProjectReadiness('test-proj', new Date(), mockContext); expect(r.ready).toBe(false); });
  it('P09 — allocation wrong material', async () => { setupValidPath(); mockContext.truckAllocations = { t1: { truckId: 't1', materialId: 'm2', status: 'ACTIVE', allocationId: 'al1' } as any }; const r = await readinessService.evaluateProjectReadiness('test-proj', new Date(), mockContext); expect(r.ready).toBe(false); });
  it('P10 — operational carrier lacks active project membership', async () => { setupValidPath(); mockContext.carrierMemberships = []; const r = await readinessService.evaluateProjectReadiness('test-proj', new Date(), mockContext); expect(r.ready).toBe(false); });

  it('R01 — pricing wrong carrier', async () => { setupValidPath(); mockContext.pricingRules = [{ carrierId: 'c2', materialId: 'm1' } as any]; const r = await readinessService.evaluateProjectReadiness('test-proj', new Date(), mockContext); expect(r.ready).toBe(false); });
  it('R02 — pricing wrong material', async () => { setupValidPath(); mockContext.pricingRules = [{ carrierId: 'c1', materialId: 'm2' } as any]; const r = await readinessService.evaluateProjectReadiness('test-proj', new Date(), mockContext); expect(r.ready).toBe(false); });
  it('R03 — pricing mismatch', async () => { setupValidPath(); mockContext.truckAllocations = { t1: { truckId: 't2', materialId: 'm1', status: 'ACTIVE', allocationId: 'al1' } as any }; const r = await readinessService.evaluateProjectReadiness('test-proj', new Date(), mockContext); expect(r.ready).toBe(false); });

  it('PR01 — zero pricing', async () => { setupValidPath(); mockContext.pricingRules = []; const r = await readinessService.evaluateProjectReadiness('test-proj', new Date(), mockContext); expect(r.ready).toBe(false); });
  it('PR02 — pricing wrong carrier', async () => { setupValidPath(); mockContext.pricingRules = [{ carrierId: 'c2', materialId: 'm1' } as any]; const r = await readinessService.evaluateProjectReadiness('test-proj', new Date(), mockContext); expect(r.ready).toBe(false); });
  it('PR03 — pricing wrong material', async () => { setupValidPath(); mockContext.pricingRules = [{ carrierId: 'c1', materialId: 'm2' } as any]; const r = await readinessService.evaluateProjectReadiness('test-proj', new Date(), mockContext); expect(r.ready).toBe(false); });
  it('PR04 — pricing project wrong', async () => { setupValidPath(); /* Pricing rule project is implicit */ const r = await readinessService.evaluateProjectReadiness('other-proj', new Date(), mockContext); expect(r.ready).toBe(false); });
  it('PR05 — pricing effective future', async () => { setupValidPath(); mockContext.pricingRules = [{ projectId: 'test-proj', carrierId: 'c1', materialId: 'm1', effectiveFrom: '3000-01-01' } as any]; const r = await readinessService.evaluateProjectReadiness('test-proj', new Date(2025, 1, 1), mockContext); expect(r.ready).toBe(false); });
  it('PR06 — pricing expired', async () => { setupValidPath(); mockContext.pricingRules = [{ projectId: 'test-proj', carrierId: 'c1', materialId: 'm1', effectiveFrom: '2000-01-01', effectiveTo: '2020-01-01' } as any]; const r = await readinessService.evaluateProjectReadiness('test-proj', new Date(2025, 1, 1), mockContext); expect(r.ready).toBe(false); });
  it('PR07 — pricing exact match', async () => { setupValidPath(); const r = await readinessService.evaluateProjectReadiness('test-proj', new Date(2010, 1, 1), mockContext); expect(r.ready).toBe(true); });

  it('V01 — one valid path', async () => { setupValidPath(); const r = await readinessService.evaluateProjectReadiness('test-proj', new Date(2010, 1, 1), mockContext); expect(r.ready).toBe(true); });
  it('DTO01 — successful result contract', async () => { setupValidPath(); const r = await readinessService.evaluateProjectReadiness('test-proj', new Date(2010, 1, 1), mockContext); expect(r.projectId).toBe('test-proj'); expect(r.ready).toBe(true); expect(r.evaluatedAt).toBeDefined(); });
});

describe('ProjectActivationService Transaction Consistency Tests', () => {
  let activationService: ProjectActivationService;
  let userContext: AuthUserContext;

  beforeEach(() => {
    activationService = new ProjectActivationService();
    userContext = {
      userId: 'admin-1',
      email: 'admin@qsaudi.com',
      role: 'PROJECT_ADMIN',
    } as AuthUserContext;

    // Reset mockDatabase
    mockDatabase = {};

    // Clear spy on NonTransactionReadContext
    vi.restoreAllMocks();
  });

  const setupMocksForValidDiscovery = () => {
    // 1. Spies on NonTransactionReadContext prototype to discover the candidate successfully
    vi.spyOn(NonTransactionReadContext.prototype, 'getProject').mockResolvedValue({
      projectId: 'test-proj',
      nameAr: 'Test Project',
      status: 'SETUP'
    } as ProjectEntity);

    vi.spyOn(NonTransactionReadContext.prototype, 'listActiveMaterialMemberships').mockResolvedValue([
      { materialId: 'm1', status: 'ACTIVE' } as ProjectMaterialMembershipEntity
    ]);

    vi.spyOn(NonTransactionReadContext.prototype, 'listActiveCarrierMemberships').mockResolvedValue([
      { carrierId: 'c1', status: 'ACTIVE' } as ProjectCarrierMembershipEntity
    ]);

    vi.spyOn(NonTransactionReadContext.prototype, 'listActiveDriverMemberships').mockResolvedValue([
      { driverId: 'd1', status: 'ACTIVE' } as ProjectDriverMembershipEntity
    ]);

    vi.spyOn(NonTransactionReadContext.prototype, 'listActiveTruckMemberships').mockResolvedValue([
      { truckId: 't1', status: 'ACTIVE' } as ProjectTruckMembershipEntity
    ]);

    vi.spyOn(NonTransactionReadContext.prototype, 'getDriverCarrierAffiliation').mockResolvedValue({
      driverId: 'd1',
      carrierId: 'c1',
      status: 'ACTIVE'
    } as ProjectDriverCarrierAffiliationEntity);

    vi.spyOn(NonTransactionReadContext.prototype, 'getTruckCarrierAffiliation').mockResolvedValue({
      truckId: 't1',
      carrierId: 'c1',
      status: 'ACTIVE'
    } as ProjectTruckCarrierAffiliationEntity);

    vi.spyOn(NonTransactionReadContext.prototype, 'getActiveDriverAssignment').mockResolvedValue({
      assignmentId: 'a1',
      driverId: 'd1',
      truckId: 't1',
      status: 'ACTIVE'
    } as ProjectDriverTruckAssignmentEntity);

    vi.spyOn(NonTransactionReadContext.prototype, 'getActiveTruckAssignment').mockResolvedValue({
      assignmentId: 'a1',
      driverId: 'd1',
      truckId: 't1',
      status: 'ACTIVE'
    } as ProjectDriverTruckAssignmentEntity);

    vi.spyOn(NonTransactionReadContext.prototype, 'getActiveTruckAllocation').mockResolvedValue({
      allocationId: 'al1',
      projectId: 'test-proj',
      truckId: 't1',
      materialId: 'm1',
      status: 'ACTIVE',
      effectiveFrom: '2020-01-01',
      effectiveTo: null
    } as ProjectTruckMaterialAllocationEntity);

    vi.spyOn(NonTransactionReadContext.prototype, 'listPricingRules').mockResolvedValue([
      {
        pricingRuleId: 'pr1',
        projectId: 'test-proj',
        carrierId: 'c1',
        materialId: 'm1',
        effectiveFrom: '2000-01-01',
        effectiveTo: '3000-01-01'
      } as PricingRuleEntity
    ]);

    // 2. Populate mockDatabase for transaction re-read matching candidate EXACTLY
    mockDatabase['projects/test-proj'] = { projectId: 'test-proj', nameAr: 'Test Project', status: 'SETUP' };
    mockDatabase['projects/test-proj/driver_memberships/d1'] = { driverId: 'd1', status: 'ACTIVE' };
    mockDatabase['projects/test-proj/truck_memberships/t1'] = { truckId: 't1', status: 'ACTIVE' };
    mockDatabase['projects/test-proj/carrier_memberships/c1'] = { carrierId: 'c1', status: 'ACTIVE' };
    mockDatabase['projects/test-proj/material_memberships/m1'] = { materialId: 'm1', status: 'ACTIVE' };
    mockDatabase['projects/test-proj/driver_carrier_affiliations/d1'] = { driverId: 'd1', carrierId: 'c1', status: 'ACTIVE' };
    mockDatabase['projects/test-proj/truck_carrier_affiliations/t1'] = { truckId: 't1', carrierId: 'c1', status: 'ACTIVE' };
    mockDatabase['projects/test-proj/driver_active_assignments/d1'] = { assignmentId: 'a1' };
    mockDatabase['projects/test-proj/truck_active_assignments/t1'] = { assignmentId: 'a1' };
    mockDatabase['projects/test-proj/driver_truck_assignments/a1'] = { assignmentId: 'a1', driverId: 'd1', truckId: 't1', status: 'ACTIVE' };
    mockDatabase['projects/test-proj/truck_active_material_allocations/t1'] = { allocationId: 'al1' };
    mockDatabase['projects/test-proj/truck_material_allocations/al1'] = { allocationId: 'al1', projectId: 'test-proj', truckId: 't1', materialId: 'm1', status: 'ACTIVE', effectiveTo: null };
    mockDatabase['projects/test-proj/pricing_rules/pr1'] = { pricingRuleId: 'pr1', projectId: 'test-proj', carrierId: 'c1', materialId: 'm1', effectiveFrom: '2000-01-01', effectiveTo: '3000-01-01' };
  };

  it('A. candidate discovered as ready, then membership changes before transaction -> activation rejected', async () => {
    setupMocksForValidDiscovery();
    // Simulate membership becomes INACTIVE after discovery but before transaction
    mockDatabase['projects/test-proj/driver_memberships/d1'].status = 'INACTIVE';

    await expect(activationService.activateProject('test-proj', userContext))
      .rejects.toThrow('فشل تنشيط المشروع: عضوية غير نشطة');
  });

  it('B. assignment changes before transaction -> activation rejected', async () => {
    setupMocksForValidDiscovery();
    // Simulate assignment is changed or deactivated
    mockDatabase['projects/test-proj/driver_truck_assignments/a1'].status = 'INACTIVE';

    await expect(activationService.activateProject('test-proj', userContext))
      .rejects.toThrow('فشل تنشيط المشروع: تفاصيل التعيين غير متطابقة أو غير نشطة');
  });

  it('C. allocation changes before transaction -> activation rejected', async () => {
    setupMocksForValidDiscovery();
    // Simulate allocation closed
    mockDatabase['projects/test-proj/truck_material_allocations/al1'].status = 'CLOSED';

    await expect(activationService.activateProject('test-proj', userContext))
      .rejects.toThrow('فشل تنشيط المشروع: تفاصيل التخصيص غير متطابقة أو غير نشطة');
  });

  it('D. PricingRule changes/expires before transaction -> activation rejected', async () => {
    setupMocksForValidDiscovery();
    // Simulate PricingRule expired
    mockDatabase['projects/test-proj/pricing_rules/pr1'].effectiveTo = '2010-01-01'; // Expired relative to current date (e.g. 2026)

    await expect(activationService.activateProject('test-proj', userContext))
      .rejects.toThrow('فشل تنشيط المشروع: قاعدة التسعير منتهية الصلاحية أو غير سارية');
  });

  it('E. unchanged candidate -> activation succeeds', async () => {
    setupMocksForValidDiscovery();

    await expect(activationService.activateProject('test-proj', userContext))
      .resolves.not.toThrow();
  });
});
