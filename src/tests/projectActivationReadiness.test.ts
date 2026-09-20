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
import { ProjectLifecycleService } from '../services/projectLifecycle.service';
import { projectService } from '../services/project.service';
import { AuthUserContext } from '../types/common';

let mockDatabase: Record<string, any> = {};

vi.mock('../firebase/config', () => ({
  db: {},
  auth: {
    currentUser: {
      uid: 'admin-1',
      email: 'admin@qsaudi.com',
      getIdToken: vi.fn().mockResolvedValue('mock-token')
    }
  }
}));

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
    getDoc: vi.fn(async (docRef: any) => {
      const path = docRef.path;
      const data = mockDatabase[path];
      return {
        exists: () => data !== undefined,
        data: () => data,
      };
    }),
    setDoc: vi.fn(async (docRef: any, data: any) => {
      mockDatabase[docRef.path] = data;
    }),
    updateDoc: vi.fn(async (docRef: any, data: any) => {
      mockDatabase[docRef.path] = { ...mockDatabase[docRef.path], ...data };
    }),
    serverTimestamp: vi.fn(() => new Date().toISOString()),
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
        update: vi.fn((docRef: any, data: any) => {
          mockDatabase[docRef.path] = { ...mockDatabase[docRef.path], ...data };
        }),
        set: vi.fn((docRef: any, data: any) => {
          mockDatabase[docRef.path] = data;
        }),
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
      status: 'APPROVED'
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
    mockDatabase['projects/test-proj'] = { projectId: 'test-proj', nameAr: 'Test Project', status: 'APPROVED' };
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

  it('Scenario A: Attempting activation from SETUP fails (must be APPROVED)', async () => {
    setupMocksForValidDiscovery();
    mockDatabase['projects/test-proj'].status = 'SETUP';
    vi.spyOn(NonTransactionReadContext.prototype, 'getProject').mockResolvedValue({
      projectId: 'test-proj',
      nameAr: 'Test Project',
      status: 'SETUP'
    } as ProjectEntity);

    await expect(activationService.activateProject('test-proj', userContext))
      .rejects.toThrow('لا يمكن تنشيط مشروع ما لم يكن في حالة معتمد (APPROVED)');
  });

  it('Scenario B: Attempting activation from READY_FOR_REVIEW fails (must be APPROVED)', async () => {
    setupMocksForValidDiscovery();
    mockDatabase['projects/test-proj'].status = 'READY_FOR_REVIEW';
    vi.spyOn(NonTransactionReadContext.prototype, 'getProject').mockResolvedValue({
      projectId: 'test-proj',
      nameAr: 'Test Project',
      status: 'READY_FOR_REVIEW'
    } as ProjectEntity);

    await expect(activationService.activateProject('test-proj', userContext))
      .rejects.toThrow('لا يمكن تنشيط مشروع ما لم يكن في حالة معتمد (APPROVED)');
  });

  it('Scenario C: Attempting activation without server readiness fails', async () => {
    setupMocksForValidDiscovery();
    vi.spyOn(NonTransactionReadContext.prototype, 'getActiveDriverAssignment').mockResolvedValue(null);

    await expect(activationService.activateProject('test-proj', userContext))
      .rejects.toThrow('المشروع غير جاهز للتنشيط');
  });

  it('Scenario D: Candidate discovered, then carrier membership changes/inactive -> activation rejected', async () => {
    setupMocksForValidDiscovery();
    mockDatabase['projects/test-proj/carrier_memberships/c1'].status = 'INACTIVE';

    await expect(activationService.activateProject('test-proj', userContext))
      .rejects.toThrow('فشل تنشيط المشروع: عضوية غير نشطة');
  });

  it('Scenario E: Candidate discovered, then material membership changes/inactive -> activation rejected', async () => {
    setupMocksForValidDiscovery();
    mockDatabase['projects/test-proj/material_memberships/m1'].status = 'INACTIVE';

    await expect(activationService.activateProject('test-proj', userContext))
      .rejects.toThrow('فشل تنشيط المشروع: عضوية غير نشطة');
  });

  it('Scenario F: Candidate discovered, then affiliation carrier mismatch -> activation rejected', async () => {
    setupMocksForValidDiscovery();
    mockDatabase['projects/test-proj/truck_carrier_affiliations/t1'].carrierId = 'c2';

    await expect(activationService.activateProject('test-proj', userContext))
      .rejects.toThrow('فشل تنشيط المشروع: انتساب غير نشط أو غير متطابق');
  });

  it('Scenario G: Candidate discovered, then pricing rule expires before transaction -> activation rejected', async () => {
    setupMocksForValidDiscovery();
    mockDatabase['projects/test-proj/pricing_rules/pr1'].effectiveTo = '2010-01-01';

    await expect(activationService.activateProject('test-proj', userContext))
      .rejects.toThrow('فشل تنشيط المشروع: قاعدة التسعير منتهية الصلاحية أو غير سارية');
  });

  it('Scenario H: Activation from APPROVED with coherent operational path succeeds and sets status to ACTIVE', async () => {
    setupMocksForValidDiscovery();

    await activationService.activateProject('test-proj', userContext);
    expect(mockDatabase['projects/test-proj'].status).toBe('ACTIVE');
    expect(mockDatabase['projects/test-proj'].updatedBy).toBe('admin-1');
  });
});

describe('ProjectLifecycleService Governance & Audit Tests', () => {
  let lifecycleService: ProjectLifecycleService;
  let userContext: AuthUserContext;

  beforeEach(() => {
    lifecycleService = new ProjectLifecycleService();
    userContext = {
      userId: 'admin-1',
      email: 'admin@qsaudi.com',
      displayName: 'Admin User',
      role: 'SUPER_ADMIN',
    };
    mockDatabase = {};
    vi.restoreAllMocks();
  });

  it('Scenario I: Lifecycle transition SETUP -> READY_FOR_REVIEW succeeds with audit log', async () => {
    mockDatabase['projects/test-proj'] = {
      projectId: 'test-proj',
      nameAr: 'Test Project',
      status: 'SETUP'
    };

    const res = await lifecycleService.transitionStatus('test-proj', 'READY_FOR_REVIEW', userContext, 'Ready for audit');
    expect(res.success).toBe(true);
    expect(res.previousStatus).toBe('SETUP');
    expect(res.newStatus).toBe('READY_FOR_REVIEW');
    expect(mockDatabase['projects/test-proj'].status).toBe('READY_FOR_REVIEW');

    // Verify audit log created
    const auditKeys = Object.keys(mockDatabase).filter(k => k.startsWith('audit_logs/'));
    expect(auditKeys.length).toBeGreaterThan(0);
    const auditEntry = mockDatabase[auditKeys[0]];
    expect(auditEntry.projectId).toBe('test-proj');
    expect(auditEntry.action).toBe('UPDATE');
  });

  it('Scenario J: Lifecycle transition READY_FOR_REVIEW -> APPROVED succeeds with audit log', async () => {
    mockDatabase['projects/test-proj'] = {
      projectId: 'test-proj',
      nameAr: 'Test Project',
      status: 'READY_FOR_REVIEW'
    };

    const res = await lifecycleService.transitionStatus('test-proj', 'APPROVED', userContext, 'Approved by compliance');
    expect(res.success).toBe(true);
    expect(res.newStatus).toBe('APPROVED');
    expect(mockDatabase['projects/test-proj'].status).toBe('APPROVED');
  });

  it('Scenario K: Lifecycle transition READY_FOR_REVIEW -> SETUP (rejection) succeeds with valid reason', async () => {
    mockDatabase['projects/test-proj'] = {
      projectId: 'test-proj',
      nameAr: 'Test Project',
      status: 'READY_FOR_REVIEW'
    };

    const res = await lifecycleService.transitionStatus('test-proj', 'SETUP', userContext, 'Missing weighbridge calibration certificate');
    expect(res.success).toBe(true);
    expect(res.newStatus).toBe('SETUP');
    expect(mockDatabase['projects/test-proj'].status).toBe('SETUP');
  });

  it('Scenario L: Invalid lifecycle transitions are rejected', async () => {
    mockDatabase['projects/test-proj'] = {
      projectId: 'test-proj',
      nameAr: 'Test Project',
      status: 'SETUP'
    };

    // 1. SETUP -> APPROVED (skipping READY_FOR_REVIEW) is forbidden
    await expect(lifecycleService.transitionStatus('test-proj', 'APPROVED', userContext))
      .rejects.toThrow('انتقال غير صالح لحالة دورة حياة المشروع');

    // 2. Transition directly to ACTIVE via lifecycle service is strictly forbidden
    await expect(lifecycleService.transitionStatus('test-proj', 'ACTIVE', userContext))
      .rejects.toThrow('لا يمكن تنشيط المشروع عبر مسار الانتقال العادي');
  });

  it('Scenario M: Direct status mutation via projectService.updateProject is blocked and fails', async () => {
    mockDatabase['projects/test-proj'] = {
      projectId: 'test-proj',
      nameAr: 'Test Project',
      status: 'SETUP'
    };

    await expect(projectService.updateProject('test-proj', { status: 'APPROVED' as any }, userContext))
      .rejects.toThrow('لا يمكن تعديل حالة دورة حياة المشروع عبر التحديث العام');
  });
});
