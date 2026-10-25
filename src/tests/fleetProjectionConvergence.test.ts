import { beforeEach, describe, expect, it } from 'vitest';
import { setTestDbOverride } from '../firebase/admin';
import { commandDatabase, accountProfile } from './helpers/commandDatabase';
import { ProjectFleetQueryService } from '../services/projectFleetQuery.server';
import { ProjectFleetReadModelAdminReadContext } from '../services/projectFleetReadModel.server';
import { projectFleetReadModelService } from '../services/projectFleetReadModel.service';
import { ProjectWorkspaceInitialProjectionServer } from '../services/projectWorkspaceInitialProjection.server';
import { ProjectProvisioningAdminService } from '../services/projectProvisioning.server';
import { CanonicalSnapshotServerService } from '../services/canonicalSnapshot.server';
import { readFileSync } from 'node:fs';
const actor = { userId: 'actor', role: 'SUPER_ADMIN', email: 'actor@example.invalid' } as any;
function initial() {
  const result: Record<string, any> = {
    'users/actor': accountProfile('VIEWER'), 'projects/P1': { projectId: 'P1', status: 'ACTIVE' },
    'trucks/T1': { truckId: 'T1', plate: 'AAA', normalizedPlate: 'AAA', status: 'ACTIVE', tareWeightKg: 14000, legalPayloadLimitKg: 30000 },
    'trucks/T2': { truckId: 'T2', plate: 'ZZZ', normalizedPlate: 'ZZZ', status: 'ACTIVE' },
    'drivers/D1': { driverId: 'D1', fullNameAr: 'سائق معين', nationalId: '1234567890', phone: '0500000000', status: 'ACTIVE' },
    'drivers/D2': { driverId: 'D2', fullNameAr: 'سائق مستقل', nationalId: '2234567890', phone: '0500000001', status: 'ACTIVE' },
    'carriers/C1': { carrierId: 'C1', nameAr: 'ناقل', commercialRegistrationNo: '1010123456', status: 'ACTIVE' },
    'materials/M1': { materialId: 'M1', code: 'SAND', nameAr: 'رمل', unitOfMeasure: 'TON', status: 'ACTIVE' },
  };
  for (const [kind, ids] of [['truck', ['T1', 'T2']], ['driver', ['D1', 'D2']], ['carrier', ['C1']], ['material', ['M1']]] as const) for (const id of ids) result[`projects/P1/${kind}_memberships/${id}`] = { projectId: 'P1', [kind + 'Id']: id, status: 'ACTIVE' };
  for (const [kind, id] of [['driver', 'D1'], ['truck', 'T1']]) result[`projects/P1/${kind}_carrier_affiliations/${id}`] = { projectId: 'P1', [kind + 'Id']: id, carrierId: 'C1', status: 'ACTIVE' };
  result['projects/P1/driver_truck_assignments/A'] = { assignmentId: 'A', projectId: 'P1', driverId: 'D1', truckId: 'T1', status: 'ACTIVE', effectiveFrom: '2020-01-01T00:00:00.000Z', effectiveTo: null };
  result['projects/P1/driver_active_assignments/D1'] = { assignmentId: 'A' }; result['projects/P1/truck_active_assignments/T1'] = { assignmentId: 'A' };
  result['projects/P1/truck_material_allocations/L'] = { allocationId: 'L', projectId: 'P1', truckId: 'T1', materialId: 'M1', status: 'ACTIVE', effectiveFrom: '2020-01-01T00:00:00.000Z', effectiveTo: null };
  result['projects/P1/truck_active_material_allocations/T1'] = { allocationId: 'L' };
  return result;
}
let x: ReturnType<typeof commandDatabase>, query: ProjectFleetQueryService;
beforeEach(() => { x = commandDatabase(initial()); setTestDbOverride(x.db); query = new ProjectFleetQueryService(x.db); });
const fleet = () => query.fleet('P1', actor);
const first = async () => (await fleet()).rows.find(r => r.truckId === 'T1')!;
const removeAssignment = () => { delete x.store['projects/P1/driver_truck_assignments/A']; delete x.store['projects/P1/driver_active_assignments/D1']; delete x.store['projects/P1/truck_active_assignments/T1']; };
const removeAllocation = () => { delete x.store['projects/P1/truck_material_allocations/L']; delete x.store['projects/P1/truck_active_material_allocations/T1']; };
describe('P5-B4 truck-centric visibility and effective eligibility', () => {
  it('keeps standalone trucks and complete rows, deterministically, without PII or writes', async () => {
    const before = structuredClone(x.store), result = await fleet(); expect(result.rows.map(r => r.truckId)).toEqual(['T1', 'T2']); expect(result.rows[0].classification).toBe('OPERATIONAL'); expect(result.rows[1].classification).toBe('PARTIAL');
    expect(result.rows[1]).toMatchObject({ assignmentStatus: 'UNASSIGNED_DRIVER', allocationStatus: 'UNALLOCATED_MATERIAL', driverId: null, materialId: null });
    const json = JSON.stringify(result); for (const field of ['phone', 'nationalId', 'licenseNumber', 'rate', 'pricingRuleId']) expect(json).not.toContain(`"${field}"`); expect(x.store).toEqual(before);
  });
  for (const state of ['truck only', 'carrier only', 'driver only', 'material only']) it(`preserves legal partial ${state} without integrity corruption`, async () => {
    if (state !== 'driver only') removeAssignment(); if (state !== 'material only') removeAllocation(); if (state === 'truck only') delete x.store['projects/P1/truck_carrier_affiliations/T1'];
    const row = await first(); expect(row.classification).toBe('PARTIAL'); expect(row.integrityIssues.every(i => i.category === 'PARTIAL')).toBe(true);
    if (state === 'driver only') expect(row.assignmentEligible).toBe(true); if (state === 'material only') expect(row.allocationEligible).toBe(true);
  });
  for (const [kind, id, status] of [['trucks', 'T1', 'MAINTENANCE'], ['drivers', 'D1', 'SUSPENDED'], ['carriers', 'C1', 'INACTIVE'], ['materials', 'M1', 'INACTIVE']]) it(`${kind} ${status} preserves participation/history and is not operationally clean`, async () => {
    x.store[`${kind}/${id}`].status = status; const before = structuredClone(x.store), row = await first(); expect(row.classification).toBe('INELIGIBLE'); expect(row.integrityIssues.some(i => i.code === 'GLOBAL_ENTITY_INELIGIBLE')).toBe(true); expect(x.store).toEqual(before);
    const context = await query.context('P1', actor); if (kind === 'trucks' || kind === 'drivers' || kind === 'carriers') expect(context.activeDriverByTruck).toEqual({}); if (kind === 'trucks' || kind === 'materials' || kind === 'carriers') expect(context.activeMaterialByTruck).toEqual({});
  });
  for (const defect of ['missing global', 'malformed global']) it(`${defect} remains an explicit row without poisoning another truck`, async () => {
    if (defect === 'missing global') delete x.store['trucks/T1']; else x.store['trucks/T1'].truckId = 'WRONG';
    const row = await first(); expect(row.truckId).toBe('T1'); expect(row.classification).toBe('INTEGRITY_ERROR'); expect(row.integrityIssues.some(i => i.code === (defect === 'missing global' ? 'GLOBAL_ENTITY_MISSING' : 'GLOBAL_ENTITY_INVALID'))).toBe(true); expect((await fleet()).rows).toHaveLength(2);
  });
});
describe('P5-B4 B3 temporal truth reused by projection', () => {
  for (const defect of ['missing target', 'closed', 'future', 'driver slot mismatch', 'wrong project', 'wrong truck', 'duplicate active', 'missing truck slot']) it(`assignment ${defect} becomes a row-level integrity issue`, async () => {
    const raw = x.store['projects/P1/driver_truck_assignments/A'];
    if (defect === 'missing target') delete x.store['projects/P1/driver_truck_assignments/A'];
    if (defect === 'closed') { raw.status = 'CLOSED'; raw.effectiveTo = '2021-01-01T00:00:00.000Z'; }
    if (defect === 'future') raw.effectiveFrom = '2099-01-01T00:00:00.000Z';
    if (defect === 'driver slot mismatch') x.store['projects/P1/driver_active_assignments/D1'].assignmentId = 'OTHER';
    if (defect === 'wrong project') raw.projectId = 'P2'; if (defect === 'wrong truck') raw.truckId = 'T2';
    if (defect === 'duplicate active') x.store['projects/P1/driver_truck_assignments/OTHER'] = { ...raw, assignmentId: 'OTHER' };
    if (defect === 'missing truck slot') delete x.store['projects/P1/truck_active_assignments/T1'];
    const before = structuredClone(x.store), row = await first(); expect(row.integrityIssues.some(i => i.code === 'INVALID_DRIVER_ASSIGNMENT_POINTER' && i.category === 'INTEGRITY')).toBe(true); expect(row.assignmentEligible).toBe(false); expect(x.store).toEqual(before); expect((await fleet()).rows).toHaveLength(2);
  });
  for (const defect of ['missing target', 'closed', 'future', 'wrong truck', 'wrong project', 'duplicate active', 'missing slot']) it(`allocation ${defect} remains explicit without repair`, async () => {
    const raw = x.store['projects/P1/truck_material_allocations/L'];
    if (defect === 'missing target') delete x.store['projects/P1/truck_material_allocations/L']; if (defect === 'closed') { raw.status = 'CLOSED'; raw.effectiveTo = '2021-01-01T00:00:00.000Z'; }
    if (defect === 'future') raw.effectiveFrom = '2099-01-01T00:00:00.000Z'; if (defect === 'wrong truck') raw.truckId = 'T2'; if (defect === 'wrong project') raw.projectId = 'P2';
    if (defect === 'duplicate active') x.store['projects/P1/truck_material_allocations/OTHER'] = { ...raw, allocationId: 'OTHER' }; if (defect === 'missing slot') delete x.store['projects/P1/truck_active_material_allocations/T1'];
    const row = await first(); expect(row.integrityIssues.some(i => i.code === 'INVALID_MATERIAL_ALLOCATION_POINTER' && i.category === 'INTEGRITY')).toBe(true); expect(row.allocationEligible).toBe(false);
  });
  for (const defect of ['driver inactive affiliation', 'carrier mismatch', 'carrier membership inactive', 'affiliation scope corrupt']) it(`${defect} cannot produce clean usable mappings`, async () => {
    if (defect === 'driver inactive affiliation') x.store['projects/P1/driver_carrier_affiliations/D1'].status = 'INACTIVE';
    if (defect === 'carrier mismatch') x.store['projects/P1/driver_carrier_affiliations/D1'].carrierId = 'C2';
    if (defect === 'carrier membership inactive') x.store['projects/P1/carrier_memberships/C1'].status = 'SUSPENDED';
    if (defect === 'affiliation scope corrupt') x.store['projects/P1/truck_carrier_affiliations/T1'].projectId = 'P2';
    const row = await first(); expect(row.classification).not.toBe('OPERATIONAL'); expect(row.assignmentEligible).toBe(false); expect((await query.context('P1', actor)).activeDriverByTruck).toEqual({});
  });
});
describe('P5-B4 masters, workspace, snapshot and access', () => {
  it('context uses Fleet only for mappings while preserving unassigned eligible masters', async () => {
    const context = await query.context('P1', actor); expect(context.activeDriverByTruck).toEqual({ T1: 'D1' }); expect(context.activeMaterialByTruck).toEqual({ T1: 'M1' }); expect(context.knownDrivers.some(d => d.driverId === 'D2')).toBe(true); expect(context.knownTrucks.some(t => t.truckId === 'T2')).toBe(true);
    removeAssignment(); expect((await query.context('P1', actor)).activeDriverByTruck).toEqual({});
  });
  it('workspace retains standalone masters/Truck rows and separates participation from effective status', async () => {
    x.store['materials/M1'].status = 'INACTIVE'; x.store['carriers/C1'].status = 'INACTIVE'; x.store['drivers/D1'].status = 'SUSPENDED';
    const snapshot = await new ProjectWorkspaceInitialProjectionServer().buildInitialProjection('P1'); expect(snapshot.drivers.map(d => d.driverId).sort()).toEqual(['D1', 'D2']); expect(snapshot.fleetRows).toHaveLength(2);
    expect(snapshot.drivers.every(d => d.membershipStatus === 'ACTIVE' && d.status === 'INACTIVE')).toBe(true); expect(snapshot.materials[0]).toMatchObject({ status: 'INACTIVE', membershipStatus: 'ACTIVE' }); expect(snapshot.carriers[0]).toMatchObject({ status: 'INACTIVE', membershipStatus: 'ACTIVE' });
  });
  it('Carrier/Material projection uses decoded participation, eligibility and authoritative absence', async () => {
    const provisioning = new ProjectProvisioningAdminService(); x.store['materials/M1'].status = 'INACTIVE'; expect((await provisioning.listProjectMaterials('P1'))[0]).toMatchObject({ materialId: 'M1', membershipStatus: 'ACTIVE', status: 'INACTIVE', isActive: false });
    delete x.store['materials/M1']; expect((await provisioning.listProjectMaterials('P1'))[0]).toMatchObject({ status: 'INACTIVE', projectionIssue: 'GLOBAL_ENTITY_MISSING' });
  });
  for (const patch of [{ assignedProjectIds: [] }, { status: 'SUSPENDED' }, { isActive: false }]) it(`current access overrides stale token ${JSON.stringify(patch)}`, async () => { Object.assign(x.store['users/actor'], patch); await expect(fleet()).rejects.toThrow('FORBIDDEN_PROJECT_ACCESS'); await expect(query.context('P1', actor)).rejects.toThrow('FORBIDDEN_PROJECT_ACCESS'); });
  it('SUPER_ADMIN may read globally; ordinary assigned VIEWER cannot cross Projects', async () => { await fleet(); x.store['projects/P2'] = { projectId: 'P2', status: 'ACTIVE' }; await expect(query.fleet('P2', actor)).rejects.toThrow('FORBIDDEN_PROJECT_ACCESS'); x.store['users/actor'].role = 'SUPER_ADMIN'; expect((await query.fleet('P2', actor)).rows).toEqual([]); });
  it('network/persistence system errors fail the request instead of becoming clean empty Fleet', async () => {
    const ctx = new ProjectFleetReadModelAdminReadContext(x.db, async () => { throw new Error('UNAVAILABLE'); }); await expect(projectFleetReadModelService.getProjectFleetReadModel('P1', ctx)).rejects.toThrow('UNAVAILABLE');
  });
  for (const defect of ['inactive affiliation', 'global ineligible', 'temporal mismatch']) it(`current canonical snapshot rejects ${defect}`, async () => {
    if (defect === 'inactive affiliation') x.store['projects/P1/driver_carrier_affiliations/D1'].status = 'INACTIVE'; if (defect === 'global ineligible') x.store['drivers/D1'].status = 'SUSPENDED'; if (defect === 'temporal mismatch') removeAssignment();
    await expect(new CanonicalSnapshotServerService().getTripCanonicalSnapshot('P1', { driverId: 'D1', truckId: 'T1', carrierId: 'C1', materialId: 'M1' }, actor)).rejects.toThrow();
  });
  it('valid current canonical snapshot agrees with Fleet without adding historical inference', async () => { const snapshot = await new CanonicalSnapshotServerService().getTripCanonicalSnapshot('P1', { driverId: 'D1', truckId: 'T1', carrierId: 'C1', materialId: 'M1' }, actor); expect(snapshot.driverSnapshot.driverId).toBe((await first()).driverId); });
  it('production Fleet endpoint reuses current-profile query authority and exposes only Fleet DTO', () => { const app = readFileSync('server/app.ts', 'utf8'); const start = app.indexOf("app.get('/api/projects/:projectId/fleet-read-model'"); const route = app.slice(start, app.indexOf('\n});', start)); expect(route).toContain('enforceProjectIsolation'); expect(route).toContain('ProjectFleetQueryService().fleet'); expect(route).not.toContain('getGlobal'); });
});

describe('P5-B4 read-only projection boundaries', () => {
  it('malformed profile objects cannot leak hidden data through display string fields', async () => {
    x.store['trucks/T1'].plate = { nationalId: 'SECRET' }; const result = await fleet(); const row = result.rows.find(r => r.truckId === 'T1')!;
    expect(row.classification).toBe('INTEGRITY_ERROR'); expect(row.plateNumber).toBe('T1'); expect(JSON.stringify(result)).not.toContain('SECRET');
  });
  it('context, workspace, masters and current snapshot perform no business or audit writes', async () => {
    const before = structuredClone(x.store); await query.context('P1', actor); await new ProjectWorkspaceInitialProjectionServer().buildInitialProjection('P1');
    await new ProjectProvisioningAdminService().listProjectMaterials('P1'); await new CanonicalSnapshotServerService().getTripCanonicalSnapshot('P1', { driverId: 'D1', truckId: 'T1', carrierId: 'C1', materialId: 'M1' }, actor);
    expect(x.store).toEqual(before);
  });
});
