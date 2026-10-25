import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { ProjectActivationService } from '../services/projectActivation.service';
import { ProjectReadinessAdminReadContext } from '../services/projectReadiness.server';
import { ProjectReadinessService, lifecycleReadiness, validateCandidateIds, type CandidatePath } from '../services/projectReadiness.service';
import { commandDatabase, accountProfile } from './helpers/commandDatabase';

const identity = { userId: 'actor', role: 'VIEWER', email: 'current@example.invalid' } as any;
const path: CandidatePath = { driverId: 'D', truckId: 'T', carrierId: 'C', materialId: 'M', assignmentId: 'ASN', allocationId: 'ALC', pricingRuleId: 'PRICE' };
const baseProject = () => ({ projectId: 'P1', nameAr: 'مشروع الاختبار', nameEn: 'Test', clientName: 'Client', status: 'APPROVED', settings: { zatcaTaxNumber: '', vatRatePercent: 15, allowDriverSelfDispatch: false } });
const prefix = 'projects/P1/';
function fixtures() {
  const store: Record<string, any> = { 'users/actor': accountProfile(), 'projects/P1': baseProject() };
  for (const [kind, id] of [['driver','D'],['truck','T'],['carrier','C'],['material','M']]) {
    store[`${prefix}${kind}_memberships/${id}`] = { projectId: 'P1', [`${kind}Id`]: id, status: 'ACTIVE' };
    store[`${kind}s/${id}`] = { [`${kind}Id`]: id, status: 'ACTIVE' };
  }
  for (const [kind, id] of [['driver','D'],['truck','T']]) {
    store[`${prefix}${kind}_carrier_affiliations/${id}`] = { projectId: 'P1', [`${kind}Id`]: id, carrierId: 'C', status: 'ACTIVE' };
    store[`${prefix}${kind}_active_assignments/${id}`] = { assignmentId: 'ASN' };
  }
  const interval = { projectId: 'P1', status: 'ACTIVE', effectiveFrom: '2020-01-01T00:00:00.000Z', effectiveTo: null };
  store[prefix + 'driver_truck_assignments/ASN'] = { ...interval, assignmentId: 'ASN', driverId: 'D', truckId: 'T' };
  store[prefix + 'truck_material_allocations/ALC'] = { ...interval, allocationId: 'ALC', truckId: 'T', materialId: 'M' };
  store[prefix + 'truck_active_material_allocations/T'] = { allocationId: 'ALC' };
  store[prefix + 'pricing_rules/PRICE'] = { projectId: 'P1', pricingRuleId: 'PRICE', carrierId: 'C', materialId: 'M', status: 'ACTIVE', isActive: true, effectiveFrom: '2020-01-01', effectiveTo: '2099-01-01' };
  return store;
}
let x: ReturnType<typeof commandDatabase>, service: ProjectActivationService;
const audits = () => Object.entries(x.store).filter(([key]) => key.startsWith('audit_logs/'));
beforeEach(() => { x = commandDatabase(fixtures()); service = new ProjectActivationService(x.db); });
afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers(); });
function afterDiscovery(change: () => void, candidate?: CandidatePath) {
  const original = ProjectReadinessService.prototype.evaluateProjectReadiness;
  vi.spyOn(ProjectReadinessService.prototype, 'evaluateProjectReadiness').mockImplementation(async function (...args) {
    const result = await original.apply(this, args); expect(result.ready).toBe(true); change(); return candidate ? { ...result, candidatePath: candidate } : result;
  });
}
describe('P4-B3 lifecycle and categorized readiness', () => {
  it('APPROVED Project is lifecycle-ready without any operational data', async () => {
    expect(lifecycleReadiness(baseProject() as any, 'P1', { ...identity, role: 'SUPER_ADMIN' })).toMatchObject({ ready: true, state: 'ELIGIBLE', blockers: [] });
    for (const key of Object.keys(x.store)) if (key !== 'projects/P1' && key !== 'users/actor') delete x.store[key];
    const result = await new ProjectReadinessService().evaluateProjectReadiness('P1', new Date(), new ProjectReadinessAdminReadContext(x.db));
    expect(result.lifecycle.ready).toBe(true); expect(result.operational.ready).toBe(false); expect(result.ready).toBe(false);
    expect(result.blockers.every(blocker => blocker.category === 'RELATIONSHIP' && blocker.ownerPhase === 'PHASE_5')).toBe(true); expect(result.setup).toEqual({ evaluated: false, ownerPhase: 'PHASE_6' });
  });
  it.each(['SETUP','READY_FOR_REVIEW','DRAFT','PLANNING','SUSPENDED','ARCHIVED'])('%s is not activation lifecycle-ready', status => {
    expect(lifecycleReadiness({ ...baseProject(), status } as any, 'P1')).toMatchObject({ ready: false, state: 'INELIGIBLE', blockers: [expect.objectContaining({ code: 'PROJECT_NOT_APPROVED', category: 'LIFECYCLE' })] });
  });
  it('ACTIVE is a distinct state, not current operational readiness', () => {
    expect(lifecycleReadiness({ ...baseProject(), status: 'ACTIVE' } as any, 'P1')).toMatchObject({ ready: false, state: 'ALREADY_ACTIVE' });
  });
  it('categorizes invalid Project validation and lack of activation authority', () => {
    const result = lifecycleReadiness({ ...baseProject(), nameAr: 'أ' } as any, 'P1', { ...identity, role: 'VIEWER', assignedProjectIds: ['P1'] });
    expect(result.blockers.map(blocker => blocker.category)).toEqual(['DATA_INTEGRITY', 'AUTHORITY']);
  });
  it('fails closed on corrupt persisted Project identity and timestamps', async () => {
    x.store['projects/P1'].projectId = 'P2'; await expect(service.activateProject('P1', identity)).rejects.toHaveProperty('code', 'PERSISTENCE_BOUNDARY_INVALID');
    x.store['projects/P1'] = { ...baseProject(), updatedAt: 'invalid' }; await expect(service.activateProject('P1', identity)).rejects.toHaveProperty('code', 'PERSISTENCE_BOUNDARY_INVALID'); expect(audits()).toHaveLength(0);
  });
  it('lets a future Setup contribution block activation readiness without changing lifecycle', async () => {
    const result = await new ProjectReadinessService().evaluateProjectReadiness('P1', new Date(), new ProjectReadinessAdminReadContext(x.db), undefined, [{ code: 'SETUP_PENDING', category: 'SETUP', ownerPhase: 'PHASE_6', message: 'pending' }]);
    expect(result.lifecycle.ready).toBe(true); expect(result.operational.ready).toBe(true); expect(result.ready).toBe(false); expect(result.blockers[0].category).toBe('SETUP');
  });
});
describe('P4-B3 transactional activation authority', () => {
  it.each(['SUPER_ADMIN', 'PROJECT_ADMIN'])('uses current %s despite stale VIEWER context', async role => {
    x.store['users/actor'].role = role; await service.activateProject('P1', identity);
    expect(x.store['projects/P1'].status).toBe('ACTIVE'); expect(audits()).toHaveLength(1); expect(audits()[0][1].actor).toMatchObject({ userId: 'actor', role });
  });
  it.each([{ role: 'VIEWER' }, { role: 'PROJECT_ADMIN', assignedProjectIds: [] }, { status: 'SUSPENDED' }, { isActive: false }])('reauthorizes transaction after discovery change %j', async patch => {
    afterDiscovery(() => Object.assign(x.store['users/actor'], patch)); await expect(service.activateProject('P1', { ...identity, role: 'SUPER_ADMIN' })).rejects.toThrow(); expect(x.store['projects/P1'].status).toBe('APPROVED'); expect(audits()).toHaveLength(0);
  });
  it('uses the current role in the activation audit after an authorized role change', async () => {
    afterDiscovery(() => { x.store['users/actor'].role = 'PROJECT_ADMIN'; }); await service.activateProject('P1', identity); expect(audits()[0][1].actor.role).toBe('PROJECT_ADMIN');
  });
  it.each(['SETUP','READY_FOR_REVIEW','SUSPENDED','ARCHIVED','DRAFT','PLANNING'])('rejects transaction-time %s even after valid discovery', async status => {
    afterDiscovery(() => { x.store['projects/P1'].status = status; }); await expect(service.activateProject('P1', identity)).rejects.toHaveProperty('code', 'PROJECT_NOT_APPROVED'); expect(audits()).toHaveLength(0);
  });
  it.each([
    ['driver_memberships/D', 'projectId', 'P2'], ['driver_memberships/D','driverId','WRONG'],
    ['truck_memberships/T','truckId','WRONG'], ['carrier_memberships/C','carrierId','WRONG'], ['material_memberships/M','materialId','WRONG'],
    ['driver_truck_assignments/ASN','assignmentId','OTHER'], ['driver_truck_assignments/ASN','projectId','P2'],
    ['truck_material_allocations/ALC','allocationId','OTHER'], ['truck_material_allocations/ALC','projectId','P2'],
    ['truck_carrier_affiliations/T','projectId','P2'], ['pricing_rules/PRICE','projectId','P2'],
  ])('rejects transaction identity mismatch %s.%s', async (document, field, value) => {
    afterDiscovery(() => { x.store[prefix + document][field] = value; }); await expect(service.activateProject('P1', identity)).rejects.toHaveProperty('code', 'PERSISTENCE_BOUNDARY_INVALID'); expect(audits()).toHaveLength(0);
  });
  it.each([
    ['driver_memberships/D','status','SUSPENDED'], ['driver_carrier_affiliations/D','carrierId','OTHER'],
    ['driver_active_assignments/D','assignmentId','OTHER'], ['truck_active_assignments/T','assignmentId','OTHER'],
    ['driver_truck_assignments/ASN','truckId','OTHER'], ['truck_material_allocations/ALC','materialId','OTHER'],
    ['truck_active_material_allocations/T','allocationId','OTHER'], ['driver_truck_assignments/ASN','effectiveFrom','2099-01-01T00:00:00.000Z'],
  ])('rejects changed operational candidate %s.%s', async (document, field, value) => {
    afterDiscovery(() => { x.store[prefix + document][field] = value; }); await expect(service.activateProject('P1', identity)).rejects.toHaveProperty('code', 'PROJECT_NOT_READY'); expect(audits()).toHaveLength(0);
  });
  it.each(Object.keys(path))('rejects malformed discovery %s before path use', async key => {
    afterDiscovery(() => {}, { ...path, [key]: '../invalid/path' }); await expect(service.activateProject('P1', identity)).rejects.toHaveProperty('code', 'PERSISTENCE_BOUNDARY_INVALID'); expect(audits()).toHaveLength(0);
  });
  it.each(['drivers/D','trucks/T','carriers/C','materials/M'])('rechecks global existence and structural identity %s', async key => {
    afterDiscovery(() => { delete x.store[key]; }); await expect(service.activateProject('P1', identity)).rejects.toHaveProperty('code', 'PROJECT_NOT_READY'); expect(audits()).toHaveLength(0);
  });
  it('rejects global identity mismatch without defining new global status eligibility', async () => {
    afterDiscovery(() => { x.store['drivers/D'].driverId = 'OTHER'; }); await expect(service.activateProject('P1', identity)).rejects.toHaveProperty('code', 'PERSISTENCE_BOUNDARY_INVALID');
  });
  it.each([{ status: 'INACTIVE' }, { effectiveFrom: '2099-01-01' }, { effectiveTo: '2020-01-01' }, { effectiveFrom: 'malformed' }, { effectiveFrom: null }, { effectiveFrom: 0 }, { effectiveFrom: '2026-02-30' }])('rejects transaction pricing %j', async patch => {
    afterDiscovery(() => Object.assign(x.store[prefix + 'pricing_rules/PRICE'], patch)); await expect(service.activateProject('P1', identity)).rejects.toHaveProperty('code', 'PROJECT_NOT_READY'); expect(audits()).toHaveLength(0);
  });
  it('uses transaction-time effective dates rather than the discovery clock', async () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
    x.store[prefix + 'pricing_rules/PRICE'].effectiveTo = '2026-01-01T00:00:01.000Z';
    afterDiscovery(() => { vi.setSystemTime(new Date('2026-01-01T00:00:02.000Z')); });
    await expect(service.activateProject('P1', identity)).rejects.toHaveProperty('code', 'PROJECT_NOT_READY'); expect(audits()).toHaveLength(0);
  });
  it.each(['', 'ALL', 'x/y', null])('rejects empty/noncanonical candidate ID %s', value => {
    expect(() => validateCandidateIds({ ...path, driverId: value } as any)).toThrow('PERSISTENCE_BOUNDARY_INVALID');
  });
  it('keeps readiness reads available to scoped viewers without granting activation authority', async () => {
    x.store['users/actor'].role = 'VIEWER'; const reads = new ProjectReadinessAdminReadContext(x.db);
    const actor = await reads.currentPrincipal('P1', identity);
    const result = await new ProjectReadinessService().evaluateProjectReadiness('P1', new Date(), reads, actor);
    expect(result.ready).toBe(false); expect(result.blockers).toContainEqual(expect.objectContaining({ category: 'AUTHORITY' }));
    x.store['users/actor'].assignedProjectIds = [];
    await expect(reads.currentPrincipal('P1', identity)).rejects.toHaveProperty('code', 'FORBIDDEN_PROJECT_ACCESS');
  });
  it('allows the existing isActive fallback when status is absent', async () => {
    delete x.store[prefix + 'pricing_rules/PRICE'].status; x.store[prefix + 'pricing_rules/PRICE'].effectiveTo = ''; await service.activateProject('P1', identity); expect(x.store['projects/P1'].status).toBe('ACTIVE');
  });
  it('does not treat a malformed effective date as applicable pricing', async () => {
    x.store[prefix + 'pricing_rules/PRICE'].effectiveFrom = 'bad'; await expect(service.activateProject('P1', identity)).rejects.toHaveProperty('code', 'PROJECT_NOT_READY');
  });
  it.each(['audit_logs/', 'projects/P1'])('rolls back activation if writing %s fails', async target => {
    const before = structuredClone(x.store); x.failWrites(target); await expect(service.activateProject('P1', identity)).rejects.toThrow('simulated write failure'); expect(x.store).toEqual(before); expect(audits()).toHaveLength(0);
  });
  it('makes concurrent activation and authorized repeats idempotent with one audit', async () => {
    await Promise.all([service.activateProject('P1', identity), service.activateProject('P1', identity)]); await service.activateProject('P1', identity);
    expect(x.store['projects/P1'].status).toBe('ACTIVE'); expect(audits()).toHaveLength(1);
    expect(audits()[0][1].changes).toMatchObject({ before: { status: 'APPROVED' }, after: { status: 'ACTIVE' } });
  });
  it('denies already-ACTIVE repeat after current account loses scope', async () => {
    await service.activateProject('P1', identity); x.store['users/actor'] = { ...accountProfile('PROJECT_ADMIN'), assignedProjectIds: [] };
    await expect(service.activateProject('P1', identity)).rejects.toHaveProperty('code', 'FORBIDDEN_PROJECT_ACCESS'); expect(audits()).toHaveLength(1);
  });
  it('keeps direct client status mutation denied and generic governance separate', () => {
    const rules = readFileSync('firestore.rules','utf8'); const root = rules.slice(rules.indexOf('match /projects/{projectId} {'), rules.indexOf('// Carriers subcollection'));
    expect(root).toContain('allow update: if false;'); const commands = readFileSync('src/services/projectCommands.server.ts','utf8'); expect(commands).toContain("if (targetStatus === 'ACTIVE') fail");
  });
});
