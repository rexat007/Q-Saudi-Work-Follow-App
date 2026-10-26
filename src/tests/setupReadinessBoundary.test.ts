import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { accountProfile, commandDatabase } from './helpers/commandDatabase';
import { setupParticipationFixture } from './helpers/setupParticipationFixture';
import { readSetupReadiness } from '../services/setupReadiness.server';
import { ProjectCommandsServerService } from '../services/projectCommands.server';
import { ProjectReadinessQueryService } from '../services/projectReadinessQuery.server';
import { ProjectActivationService } from '../services/projectActivation.service';
import { ProjectProvisioningAdminService } from '../services/projectProvisioning.server';
import { setTestDbOverride } from '../firebase/admin';
import { ProjectReadinessService } from '../services/projectReadiness.service';
const actor = { userId: 'actor', role: 'SUPER_ADMIN', email: 'actor@example.invalid' } as any;
const project = () => ({ projectId: 'P1', nameAr: 'Valid project', status: 'SETUP', settings: {} });
let x: ReturnType<typeof commandDatabase>, commands: ProjectCommandsServerService;
const setup = () => readSetupReadiness('P1', x.store['projects/P1'], x.db, ref => ref.get());
function truck() {
  x.store['trucks/T'] = { truckId: 'T', plate: 'AAA', normalizedPlate: 'AAA', status: 'ACTIVE' };
  x.store['projects/P1/truck_memberships/T'] = { projectId: 'P1', truckId: 'T', status: 'ACTIVE' };
}
function path() {
  truck();
  x.store['drivers/D'] = { driverId: 'D', fullNameAr: 'Driver', nationalId: '1234567890', status: 'ACTIVE' };
  x.store['projects/P1/driver_memberships/D'] = { projectId: 'P1', driverId: 'D', status: 'ACTIVE' };
  for (const [kind, id] of [['driver', 'D'], ['truck', 'T']]) x.store[`projects/P1/${kind}_carrier_affiliations/${id}`] = { projectId: 'P1', [kind + 'Id']: id, carrierId: 'SETUP_C', status: 'ACTIVE' };
  x.store['projects/P1/driver_truck_assignments/A'] = { projectId: 'P1', assignmentId: 'A', driverId: 'D', truckId: 'T', status: 'ACTIVE', effectiveFrom: '2020-01-01T00:00:00.000Z', effectiveTo: null };
  x.store['projects/P1/driver_active_assignments/D'] = { assignmentId: 'A' };
  x.store['projects/P1/truck_active_assignments/T'] = { assignmentId: 'A' };
  x.store['projects/P1/truck_material_allocations/L'] = { projectId: 'P1', allocationId: 'L', truckId: 'T', materialId: 'SETUP_M', status: 'ACTIVE', effectiveFrom: '2020-01-01T00:00:00.000Z', effectiveTo: null };
  x.store['projects/P1/truck_active_material_allocations/T'] = { allocationId: 'L' };
}
beforeEach(() => {
  x = commandDatabase({ ...setupParticipationFixture('P1'), 'users/actor': accountProfile('PROJECT_ADMIN'), 'projects/P1': project() });
  setTestDbOverride(x.db); commands = new ProjectCommandsServerService(x.db);
});
afterEach(() => vi.restoreAllMocks());
describe('P6-B2 canonical Setup completeness', () => {
  it('is ready with zero Drivers/Trucks, no pricing, no Google and empty legacy IDs', async () => {
    Object.assign(x.store['projects/P1'], { authorizedCarrierIds: [], authorizedMaterialIds: [] });
    const before = structuredClone(x.store), result = await setup();
    expect(result).toEqual({ evaluated: true, ready: true, ownerPhase: 'PHASE_6', blockers: [] }); expect(x.store).toEqual(before);
  });
  it.each(['CARRIER', 'MATERIAL'] as const)('%s must have usable canonical participation', async kind => {
    const id = kind === 'CARRIER' ? 'SETUP_C' : 'SETUP_M', base = kind.toLowerCase();
    delete x.store[`projects/P1/${base}_memberships/${id}`];
    const result = await setup(); expect(result.ready).toBe(false); expect(result.blockers.map(b => b.code)).toEqual([kind === 'CARRIER' ? 'NO_USABLE_CARRIER' : 'NO_USABLE_MATERIAL']);
    expect(result.blockers[0]).toMatchObject({ category: 'SETUP', ownerPhase: 'PHASE_6', recommendedAction: kind === 'CARRIER' ? 'OPEN_CARRIERS' : 'OPEN_MATERIALS' });
  });
  it.each(['SUSPENDED', 'REMOVED'])('%s Carrier/Material memberships do not satisfy usable counts', async status => {
    x.store['projects/P1/carrier_memberships/SETUP_C'].status = status; x.store['projects/P1/material_memberships/SETUP_M'].status = status;
    expect((await setup()).blockers.map(b => b.code)).toEqual(['NO_USABLE_CARRIER', 'NO_USABLE_MATERIAL']);
  });
  it.each([['carriers/SETUP_C', 'SUSPENDED', 'NO_USABLE_CARRIER'], ['materials/SETUP_M', 'INACTIVE', 'NO_USABLE_MATERIAL']])('ineligible only resource %s blocks Setup', async (key, status, code) => {
    x.store[key].status = status; expect((await setup()).blockers.map(b => b.code)).toEqual([code]);
  });
  it('uses the existing Foundation validator', async () => { x.store['projects/P1'].nameAr = 'x'; expect((await setup()).blockers.map(b => b.code)).toEqual(['SETUP_FOUNDATION_INCOMPLETE']); });
  it('Google provisioning failure does not change canonical Setup completeness', async () => {
    x.store['projects/P1'].settings = { googleDriveProvisioning: { enabled: true, status: 'FAILED' } };
    expect((await setup()).ready).toBe(true);
  });
  it('pricing date/rate conflicts do not enter the Setup evaluation', async () => {
    x.store['projects/P1/pricing_rules/INVALID'] = { pricingRuleId: 'INVALID', projectId: 'P1', effectiveFrom: 'invalid', baseRateSAR: -1, status: 'ACTIVE' };
    expect((await setup()).ready).toBe(true);
  });
  it('allows a Truck without Carrier, Driver or Material and a standalone suspended Driver', async () => {
    truck(); x.store['drivers/D'] = { driverId: 'D', nationalId: '1234567890', status: 'SUSPENDED' };
    x.store['projects/P1/driver_memberships/D'] = { projectId: 'P1', driverId: 'D', status: 'SUSPENDED' };
    expect((await setup()).ready).toBe(true);
  });
  it('allows an unallocated Truck with an existing valid Driver assignment', async () => {
    path(); delete x.store['projects/P1/truck_material_allocations/L']; delete x.store['projects/P1/truck_active_material_allocations/T']; expect((await setup()).ready).toBe(true);
  });
  it('does not poison Setup with historical Global ineligibility when usable required resources remain', async () => {
    path(); x.store['drivers/D'].status = 'SUSPENDED'; x.store['trucks/T'].status = 'MAINTENANCE'; expect((await setup()).ready).toBe(true);
  });
  it.each(['assignment', 'allocation', 'wrong-project', 'duplicate', 'affiliation', 'orphan'])('%s integrity defect blocks without repair', async defect => {
    path();
    if (defect === 'assignment') x.store['projects/P1/truck_active_assignments/T'].assignmentId = 'missing';
    if (defect === 'allocation') x.store['projects/P1/truck_active_material_allocations/T'].allocationId = 'missing';
    if (defect === 'wrong-project') x.store['projects/P1/driver_truck_assignments/A'].projectId = 'OTHER';
    if (defect === 'duplicate') x.store['projects/P1/driver_truck_assignments/A2'] = { ...x.store['projects/P1/driver_truck_assignments/A'], assignmentId: 'A2' };
    if (defect === 'affiliation') x.store['projects/P1/driver_carrier_affiliations/D'].projectId = 'OTHER';
    if (defect === 'orphan') { delete x.store['projects/P1/driver_memberships/D']; delete x.store['projects/P1/truck_memberships/T']; }
    const before = structuredClone(x.store), result = await setup();
    expect(result.ready).toBe(false); expect(result.blockers.some(b => b.code === 'SETUP_RELATIONSHIP_INTEGRITY_ERROR')).toBe(true);
    expect(new Set(result.blockers.map(b => `${b.code}/${b.entityId || ''}`)).size).toBe(result.blockers.length); expect(x.store).toEqual(before);
  });
  it('fails closed on an unavailable Setup reader without exposing private details', async () => {
    const result = await readSetupReadiness('P1', x.store['projects/P1'], x.db, async () => { throw Error('Firestore private/path'); });
    expect(result).toMatchObject({ evaluated: true, ready: false, blockers: [{ code: 'SETUP_READ_UNAVAILABLE', category: 'DATA_INTEGRITY' }] }); expect(JSON.stringify(result)).not.toContain('private/path');
  });
  it('does not count historical authorized IDs or Google links instead of participation', async () => {
    delete x.store['projects/P1/carrier_memberships/SETUP_C']; delete x.store['projects/P1/material_memberships/SETUP_M'];
    Object.assign(x.store['projects/P1'], { authorizedCarrierIds: ['SETUP_C'], authorizedMaterialIds: ['SETUP_M'], settings: { googleSpreadsheetId: 'sheet', googleDriveFolderId: 'folder' } });
    expect((await setup()).ready).toBe(false);
  });
});
describe('P6-B2 authoritative review gate and races', () => {
  it('allows Setup review without a complete operational path or pricing', async () => {
    const readiness = await new ProjectReadinessQueryService(x.db).read('P1', actor);
    expect(readiness).toMatchObject({ setup: { ready: true }, operational: { ready: false }, ready: false });
    await commands.transitionStatus('P1', 'READY_FOR_REVIEW', actor); expect(x.store['projects/P1'].status).toBe('READY_FOR_REVIEW');
  });
  it.each(['carrier', 'material', 'integrity'])('rechecks current %s state after stale-ready presentation', async changed => {
    expect((await setup()).ready).toBe(true);
    if (changed === 'carrier') x.store['projects/P1/carrier_memberships/SETUP_C'].status = 'SUSPENDED';
    if (changed === 'material') x.store['materials/SETUP_M'].status = 'INACTIVE';
    if (changed === 'integrity') { truck(); x.store['projects/P1/truck_active_assignments/T'] = { assignmentId: 'missing' }; }
    const before = structuredClone(x.store);
    await expect(commands.transitionStatus('P1', 'READY_FOR_REVIEW', actor)).rejects.toMatchObject({ code: 'PROJECT_SETUP_NOT_READY', status: 409, blockers: expect.any(Array) }); expect(x.store).toEqual(before);
  });
  it.each(['READY_FOR_REVIEW', 'APPROVED'])('return from %s remains legal even when Setup is incomplete', async status => {
    x.store['projects/P1'].status = status; delete x.store['projects/P1/carrier_memberships/SETUP_C'];
    await commands.transitionStatus('P1', 'SETUP', actor); expect(x.store['projects/P1'].status).toBe('SETUP');
  });
  it('keeps legal transition idempotency behavior unchanged', async () => {
    await commands.transitionStatus('P1', 'READY_FOR_REVIEW', actor);
    await expect(commands.transitionStatus('P1', 'READY_FOR_REVIEW', actor)).rejects.toMatchObject({ code: 'INVALID_PROJECT_TRANSITION' });
  });
  it('does not run Setup reads for APPROVED → READY_FOR_REVIEW', async () => {
    x.store['projects/P1'].status = 'APPROVED'; delete x.store['materials/SETUP_M'];
    await commands.transitionStatus('P1', 'READY_FOR_REVIEW', actor); expect(x.store['projects/P1'].status).toBe('READY_FOR_REVIEW');
  });
  it('readiness and review reject current scope removal despite stale SUPER_ADMIN claims', async () => {
    x.store['users/actor'].assignedProjectIds = [];
    await expect(new ProjectReadinessQueryService(x.db).read('P1', actor)).rejects.toMatchObject({ code: 'FORBIDDEN_PROJECT_ACCESS' });
    await expect(commands.transitionStatus('P1', 'READY_FOR_REVIEW', actor)).rejects.toMatchObject({ code: 'FORBIDDEN_PROJECT_ACCESS' });
  });
  it('reauthorizes after the coherent readiness transaction finishes', async () => {
    const db = { ...x.db, runTransaction: async (fn: any) => { const result = await x.db.runTransaction(fn); x.store['users/actor'].assignedProjectIds = []; return result; } };
    await expect(new ProjectReadinessQueryService(db).read('P1', actor)).rejects.toMatchObject({ code: 'FORBIDDEN_PROJECT_ACCESS' });
  });
  it('rolls back review state when its audit cannot commit', async () => {
    const before = structuredClone(x.store); x.failWrites('audit_logs/');
    await expect(commands.transitionStatus('P1', 'READY_FOR_REVIEW', actor)).rejects.toThrow('simulated write failure'); expect(x.store).toEqual(before);
  });
});
describe('P6-B2 separation and controlled functional journey', () => {
  it('activation rechecks Setup integrity outside the selected operational candidate at commit time', async () => {
    path(); x.store['projects/P1'].status = 'APPROVED';
    x.store['projects/P1/pricing_rules/PRICE'] = { pricingRuleId: 'PRICE', projectId: 'P1', carrierId: 'SETUP_C', materialId: 'SETUP_M', status: 'ACTIVE', effectiveFrom: '2000-01-01', effectiveTo: '3000-01-01' };
    const original = ProjectReadinessService.prototype.evaluateProjectReadiness;
    vi.spyOn(ProjectReadinessService.prototype, 'evaluateProjectReadiness').mockImplementation(async function(...args) {
      const result = await original.apply(this, args); expect(result.ready).toBe(true);
      x.store['projects/P1/truck_active_assignments/ORPHAN'] = { assignmentId: 'missing' }; return result;
    });
    await expect(new ProjectActivationService(x.db).activateProject('P1', actor)).rejects.toMatchObject({ code: 'PROJECT_SETUP_NOT_READY' });
    expect(x.store['projects/P1'].status).toBe('APPROVED');
  });
  it('a complete Fleet path without pricing is Setup-ready but not operationally ready', async () => {
    path(); const result = await new ProjectReadinessQueryService(x.db).read('P1', actor);
    expect(result.setup.ready).toBe(true); expect(result.operational.ready).toBe(false); expect(result.operational.blockers.map(b => b.code)).toContain('NO_APPLICABLE_PRICING');
  });
  it('operational prerequisites cannot override invalid Foundation Setup', async () => {
    path(); x.store['projects/P1'].status = 'APPROVED'; x.store['projects/P1'].nameAr = 'x';
    x.store['projects/P1/pricing_rules/PRICE'] = { pricingRuleId: 'PRICE', projectId: 'P1', carrierId: 'SETUP_C', materialId: 'SETUP_M', status: 'ACTIVE', effectiveFrom: '2000-01-01', effectiveTo: '3000-01-01' };
    const result = await new ProjectReadinessQueryService(x.db).read('P1', actor); expect(result.setup.ready).toBe(false); expect(result.operational.ready).toBe(true); expect(result.ready).toBe(false);
  });
  it('adds canonical Carrier and Material, submits review, and still cannot activate without operational readiness', async () => {
    for (const key of Object.keys(x.store)) if (!key.startsWith('users/') && key !== 'projects/P1') delete x.store[key];
    expect((await setup()).ready).toBe(false);
    const provisioning = new ProjectProvisioningAdminService();
    await provisioning.setupProjectCarrier('P1', { name: 'Legitimate test Carrier', commercialRegistrationNo: '1010123456' }, actor);
    await provisioning.setupProjectMaterial('P1', { name: 'Test Material', code: 'MAT' }, actor);
    expect((await setup()).ready).toBe(true);
    await commands.transitionStatus('P1', 'READY_FOR_REVIEW', actor); await commands.transitionStatus('P1', 'APPROVED', actor);
    await expect(new ProjectActivationService(x.db).activateProject('P1', actor)).rejects.toMatchObject({ code: 'PROJECT_NOT_READY' }); expect(x.store['projects/P1'].status).toBe('APPROVED');
  });
});
