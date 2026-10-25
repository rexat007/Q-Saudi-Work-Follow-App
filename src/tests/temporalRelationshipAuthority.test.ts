import { beforeEach, describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { commandDatabase, accountProfile } from './helpers/commandDatabase';
import { setTestDbOverride } from '../firebase/admin';
import { TemporalRelationshipAuthority } from '../services/temporalRelationshipAuthority.server';
import { ProjectParticipationAuthority } from '../services/projectParticipationAuthority.server';
import { DriverTruckIntakeServer } from '../services/driverTruckIntake.server';
import { ServerTripPersistenceAdapter } from '../services/canonicalTripPersistence.server';
import { isCurrentTemporal } from '../utils/temporalRelationshipPolicy';
const actor = { userId: 'actor', role: 'SUPER_ADMIN', email: 'actor@example.invalid' } as any;
let x: ReturnType<typeof commandDatabase>, service: TemporalRelationshipAuthority, at: Date;
function initial() {
  const result: Record<string, any> = { 'users/actor': accountProfile(), 'projects/P1': { projectId: 'P1', status: 'APPROVED' } };
  for (const [collection, idKey, ids, extra] of [
    ['drivers', 'driverId', ['D1', 'D2'], { nationalId: '1234567890' }], ['trucks', 'truckId', ['T1', 'T2'], { normalizedPlate: 'ا ب ج 1234', plate: 'ا ب ج 1234' }],
    ['carriers', 'carrierId', ['C1', 'C2'], { commercialRegistrationNo: '1010123456' }], ['materials', 'materialId', ['M1', 'M2'], { code: 'SAND' }],
  ] as const) for (const id of ids) {
    result[`${collection}/${id}`] = { [idKey]: id, status: 'ACTIVE', ...extra };
    result[`projects/P1/${collection.slice(0, -1)}_memberships/${id}`] = { projectId: 'P1', [idKey]: id, status: 'ACTIVE' };
    if (collection === 'drivers' || collection === 'trucks') result[`projects/P1/${collection.slice(0, -1)}_carrier_affiliations/${id}`] = { projectId: 'P1', [idKey]: id, carrierId: 'C1', status: 'ACTIVE' };
  }
  return result;
}
beforeEach(() => { x = commandDatabase(initial()); setTestDbOverride(x.db); at = new Date('2026-10-25T00:00:00.000Z'); service = new TemporalRelationshipAuthority(x.db, () => at); });
const assignment = (command = 'ASSIGN', driverId = 'D1', truckId = 'T1') => service.execute('ASSIGNMENT', 'P1', { command, driverId, truckId }, actor);
const allocation = (command = 'ALLOCATE', truckId = 'T1', materialId = 'M1') => service.execute('ALLOCATION', 'P1', { command, truckId, materialId }, actor);
const close = (kind: 'ASSIGNMENT' | 'ALLOCATION', id: string) => service.execute(kind, 'P1', { command: 'CLOSE', [kind === 'ASSIGNMENT' ? 'assignmentId' : 'allocationId']: id }, actor);
const rows = (name: string) => Object.entries(x.store).filter(([p]) => p.startsWith(`projects/P1/${name}/`)).map(([, v]) => v);
const audits = () => Object.entries(x.store).filter(([p]) => p.startsWith('audit_logs/')).map(([, v]) => v);
const advance = () => { at = new Date(at.getTime() + 1000); };
describe('P5-B3 assignment authority', () => {
  it('creates one opaque history record, agreeing slots, atomic audit and workspace dirty state', async () => {
    const r = await assignment(); expect(r.relationship.assignmentId).toMatch(/^ASN-[a-f0-9]{32}$/); expect(r.relationship).toMatchObject({ status: 'ACTIVE', effectiveFrom: at.toISOString(), effectiveTo: null });
    expect(x.store['projects/P1/driver_active_assignments/D1']).toEqual({ assignmentId: r.relationship.assignmentId }); expect(x.store['projects/P1/truck_active_assignments/T1']).toEqual({ assignmentId: r.relationship.assignmentId });
    expect(audits()).toHaveLength(1); expect(audits()[0]).toMatchObject({ command: 'ASSIGN', actor: { role: 'SUPER_ADMIN' }, changes: { newAssignmentId: r.relationship.assignmentId, driverId: 'D1', newTruckId: 'T1' } });
    expect(x.store['projects/P1/workspace_projection_state/current'].dirtyTabs).toContain('FLEET_ROSTER');
    const before = structuredClone(x.store); expect((await assignment()).idempotent).toBe(true); expect(x.store).toEqual(before);
  });
  it('explicit reassign closes the displaced record and frees the counterpart slot', async () => {
    const first = await assignment(); advance(); await expect(assignment('ASSIGN', 'D1', 'T2')).rejects.toThrow('ASSIGNMENT_STATE_CONFLICT');
    const second = await assignment('REASSIGN', 'D1', 'T2'); expect(second.closedIds).toEqual([first.relationship.assignmentId]); expect(rows('driver_truck_assignments').filter(r => r.status === 'ACTIVE')).toHaveLength(1);
    expect(x.store[`projects/P1/driver_truck_assignments/${first.relationship.assignmentId}`]).toMatchObject({ status: 'CLOSED', effectiveTo: at.toISOString() }); expect(x.store['projects/P1/truck_active_assignments/T1']).toBeUndefined();
  });
  it('preserves the established two-displaced-pair semantics, releasing D2 and T1', async () => {
    await assignment(); await assignment('ASSIGN', 'D2', 'T2'); advance(); const result = await assignment('REASSIGN', 'D1', 'T2');
    expect(result.closedIds).toHaveLength(2); expect(rows('driver_truck_assignments').filter(r => r.status === 'CLOSED')).toHaveLength(2);
    expect(x.store['projects/P1/driver_active_assignments/D2']).toBeUndefined(); expect(x.store['projects/P1/truck_active_assignments/T1']).toBeUndefined();
    expect(x.store['projects/P1/driver_active_assignments/D1'].assignmentId).toBe(x.store['projects/P1/truck_active_assignments/T2'].assignmentId); expect(audits()).toHaveLength(3);
  });
  it('close retains history, removes both slots, and repeated close is a no-op even after global suspension', async () => {
    const r = await assignment(); advance(); x.store['drivers/D1'].status = 'SUSPENDED'; await close('ASSIGNMENT', r.relationship.assignmentId);
    expect(rows('driver_truck_assignments')[0]).toMatchObject({ status: 'CLOSED', effectiveTo: at.toISOString(), createdAt: r.relationship.createdAt });
    expect(rows('driver_active_assignments')).toEqual([]); expect(rows('truck_active_assignments')).toEqual([]);
    const before = structuredClone(x.store); expect((await close('ASSIGNMENT', r.relationship.assignmentId)).idempotent).toBe(true); expect(x.store).toEqual(before);
  });
  for (const [path, status] of [['drivers/D1', 'SUSPENDED'], ['trucks/T1', 'MAINTENANCE'], ['carriers/C1', 'INACTIVE'], ['projects/P1/driver_memberships/D1', 'SUSPENDED'], ['projects/P1/truck_memberships/T1', 'REMOVED'], ['projects/P1/carrier_memberships/C1', 'SUSPENDED'], ['projects/P1/driver_carrier_affiliations/D1', 'INACTIVE'], ['projects/P1/truck_carrier_affiliations/T1', 'INACTIVE']]) it(`rejects ${path} ${status} without writes`, async () => {
    x.store[path].status = status; const before = structuredClone(x.store); await expect(assignment()).rejects.toThrow(); expect(x.store).toEqual(before);
  });
  it('rejects carrier mismatch using Project affiliations rather than global primaryCarrierId', async () => {
    x.store['projects/P1/driver_carrier_affiliations/D1'].carrierId = 'C2'; x.store['trucks/T1'].primaryCarrierId = 'C2'; await expect(assignment()).rejects.toThrow('CARRIER_MISMATCH');
  });
  for (const defect of ['missing driver target', 'missing truck target', 'closed slot', 'different slots', 'wrong entity', 'wrong project', 'multiple driver', 'multiple truck', 'no driver slot', 'no truck slot', 'wrong slot owner', 'future interval', 'missing end']) it(`fails closed for assignment corruption: ${defect}`, async () => {
    const r = await assignment(), id = r.relationship.assignmentId, key = `projects/P1/driver_truck_assignments/${id}`, raw = x.store[key];
    if (defect === 'missing driver target') x.store['projects/P1/driver_active_assignments/D1'].assignmentId = 'MISSING';
    if (defect === 'missing truck target') x.store['projects/P1/truck_active_assignments/T1'].assignmentId = 'MISSING';
    if (defect === 'closed slot') { raw.status = 'CLOSED'; raw.effectiveTo = at.toISOString(); }
    if (defect === 'different slots') { x.store['projects/P1/driver_truck_assignments/OTHER'] = { ...raw, assignmentId: 'OTHER', driverId: 'D2' }; x.store['projects/P1/truck_active_assignments/T1'].assignmentId = 'OTHER'; }
    if (defect === 'wrong entity') raw.driverId = 'D2';
    if (defect === 'wrong project') raw.projectId = 'P2';
    if (defect === 'multiple driver' || defect === 'multiple truck') x.store['projects/P1/driver_truck_assignments/OTHER'] = { ...raw, assignmentId: 'OTHER', ...(defect === 'multiple driver' ? { truckId: 'T2' } : { driverId: 'D2' }) };
    if (defect === 'no driver slot') delete x.store['projects/P1/driver_active_assignments/D1'];
    if (defect === 'no truck slot') delete x.store['projects/P1/truck_active_assignments/T1'];
    if (defect === 'wrong slot owner') x.store['projects/P1/driver_active_assignments/D1'].driverId = 'D2';
    if (defect === 'future interval') raw.effectiveFrom = '2099-01-01T00:00:00.000Z';
    if (defect === 'missing end') delete raw.effectiveTo;
    const before = structuredClone(x.store); await expect(assignment('REASSIGN')).rejects.toThrow('ASSIGNMENT_POINTER_INTEGRITY_ERROR'); expect(x.store).toEqual(before);
  });
});
describe('P5-B3 allocation authority', () => {
  it('allocates independently of Driver assignment, idempotently, then reallocates and closes with retained history', async () => {
    const first = await allocation(); expect(first.relationship.allocationId).toMatch(/^TMA-[a-f0-9]{32}$/); const before = structuredClone(x.store); expect((await allocation()).idempotent).toBe(true); expect(x.store).toEqual(before);
    advance(); await expect(allocation('ALLOCATE', 'T1', 'M2')).rejects.toThrow('ALLOCATION_STATE_CONFLICT'); const second = await allocation('REALLOCATE', 'T1', 'M2'); expect(second.closedIds).toEqual([first.relationship.allocationId]);
    expect(x.store[`projects/P1/truck_material_allocations/${first.relationship.allocationId}`]).toMatchObject({ status: 'CLOSED', effectiveTo: at.toISOString() }); expect(x.store['projects/P1/truck_active_material_allocations/T1'].allocationId).toBe(second.relationship.allocationId);
    advance(); await close('ALLOCATION', second.relationship.allocationId); expect(rows('truck_active_material_allocations')).toEqual([]); expect(rows('truck_material_allocations')).toHaveLength(2); expect((await close('ALLOCATION', second.relationship.allocationId)).idempotent).toBe(true); expect(audits()).toHaveLength(3);
  });
  for (const [path, status] of [['trucks/T1', 'MAINTENANCE'], ['materials/M1', 'INACTIVE'], ['projects/P1/truck_memberships/T1', 'REMOVED'], ['projects/P1/material_memberships/M1', 'SUSPENDED'], ['projects/P1/truck_carrier_affiliations/T1', 'INACTIVE']]) it(`allocation rejects ${path} ${status}`, async () => { x.store[path].status = status; const before = structuredClone(x.store); await expect(allocation()).rejects.toThrow(); expect(x.store).toEqual(before); });
  for (const defect of ['missing target', 'closed slot', 'wrong truck', 'wrong project', 'duplicate active', 'missing slot', 'slot disagreement']) it(`allocation rejects ${defect} without repair`, async () => {
    const r = await allocation(), id = r.relationship.allocationId, key = `projects/P1/truck_material_allocations/${id}`, raw = x.store[key];
    if (defect === 'missing target' || defect === 'slot disagreement') x.store['projects/P1/truck_active_material_allocations/T1'].allocationId = 'MISSING';
    if (defect === 'closed slot') { raw.status = 'CLOSED'; raw.effectiveTo = at.toISOString(); }
    if (defect === 'wrong truck') raw.truckId = 'T2'; if (defect === 'wrong project') raw.projectId = 'P2';
    if (defect === 'duplicate active') x.store['projects/P1/truck_material_allocations/OTHER'] = { ...raw, allocationId: 'OTHER' };
    if (defect === 'missing slot') delete x.store['projects/P1/truck_active_material_allocations/T1'];
    const before = structuredClone(x.store); await expect(allocation('REALLOCATE')).rejects.toThrow('ALLOCATION_POINTER_CORRUPTION'); expect(x.store).toEqual(before);
  });
});
describe('P5-B3 current authority, atomicity, concurrency and handoff', () => {
  for (const patch of [{ role: 'VIEWER' }, { role: 'PROJECT_ADMIN', assignedProjectIds: [] }, { status: 'SUSPENDED' }, { isActive: false }]) it(`current profile wins over token ${JSON.stringify(patch)}`, async () => { Object.assign(x.store['users/actor'], patch); const before = structuredClone(x.store); await expect(assignment()).rejects.toThrow(); await expect(allocation()).rejects.toThrow(); expect(x.store).toEqual(before); });
  it('assigned PROJECT_ADMIN succeeds and the audit records its current role', async () => { x.store['users/actor'].role = 'PROJECT_ADMIN'; await assignment(); await allocation(); expect(audits().every(a => a.actor.role === 'PROJECT_ADMIN')).toBe(true); });
  for (const [kind, failure] of [['ASSIGNMENT', 'audit_logs/'], ['ASSIGNMENT', 'driver_active_assignments/'], ['ASSIGNMENT', 'truck_active_assignments/'], ['ALLOCATION', 'audit_logs/'], ['ALLOCATION', 'truck_active_material_allocations/']]) it(`${kind} ${failure} failure rolls back history, slots, dirty state and audit`, async () => { const before = structuredClone(x.store); x.failWrites(failure); await expect(kind === 'ASSIGNMENT' ? assignment() : allocation()).rejects.toThrow('simulated write failure'); expect(x.store).toEqual(before); });
  it('concurrent same-pair ASSIGN creates one active record and audit; competing ASSIGN conflicts', async () => {
    const result = await Promise.all([assignment(), assignment(), assignment()]); expect(result.filter(r => !r.idempotent)).toHaveLength(1); expect(audits()).toHaveLength(1);
    const conflict = await Promise.allSettled([assignment('ASSIGN', 'D1', 'T2'), assignment('ASSIGN', 'D2', 'T1')]); expect(conflict.every(r => r.status === 'rejected')).toBe(true); expect(rows('driver_truck_assignments')).toHaveLength(1);
  });
  it('concurrent REALLOCATE and repeated CLOSE cannot leave dual-active state', async () => {
    await allocation(); advance(); await Promise.all([allocation('REALLOCATE', 'T1', 'M2'), allocation('REALLOCATE', 'T1', 'M1')]); const active = rows('truck_material_allocations').filter(r => r.status === 'ACTIVE'); expect(active).toHaveLength(1);
    advance(); await Promise.all([close('ALLOCATION', active[0].allocationId), close('ALLOCATION', active[0].allocationId)]); expect(rows('truck_material_allocations').every(r => r.status === 'CLOSED')).toBe(true); expect(audits()).toHaveLength(4);
  });
  it('B2 affiliation protection remains until explicit temporal closure', async () => {
    const r = await assignment(), participation = new ProjectParticipationAuthority(x.db);
    await expect(participation.affiliation('P1', { kind: 'DRIVER', entityId: 'D1', carrierId: 'C2', command: 'REASSIGN' }, actor)).rejects.toThrow('P5_B3_RELATIONSHIP_DEPENDENCY');
    advance(); await close('ASSIGNMENT', r.relationship.assignmentId); await participation.affiliation('P1', { kind: 'DRIVER', entityId: 'D1', carrierId: 'C2', command: 'REASSIGN' }, actor);
  });
  it('rejects client-controlled time/status/actor/slot and unknown commands', async () => {
    for (const patch of [{ status: 'ACTIVE' }, { effectiveFrom: '2020-01-01' }, { effectiveTo: null }, { actor }, { slotId: 'S' }, { createdAt: 'now' }, { command: 'PATCH' }]) await expect(service.execute('ASSIGNMENT', 'P1', { command: 'ASSIGN', driverId: 'D1', truckId: 'T1', ...patch }, actor)).rejects.toThrow('INVALID_TEMPORAL_COMMAND');
  });
  it('server Trip adapter uses the canonical material slot and fails closed when it disappears', async () => {
    const r = await allocation(), adapter = new ServerTripPersistenceAdapter(x.db); expect((await adapter.projectTruckMaterialAllocationRepository.getActiveAllocationByTruck('P1', 'T1'))?.allocationId).toBe(r.relationship.allocationId);
    delete x.store['projects/P1/truck_active_material_allocations/T1']; await expect(adapter.projectTruckMaterialAllocationRepository.getActiveAllocationByTruck('P1', 'T1')).rejects.toThrow('ALLOCATION_POINTER_CORRUPTION');
  });
  it('shared current interval predicate excludes future and closed history without reconstructing old trip-time ownership', () => { expect(isCurrentTemporal({ status: 'ACTIVE', effectiveFrom: '2020-01-01T00:00:00.000Z', effectiveTo: null }, at)).toBe(true); expect(isCurrentTemporal({ status: 'ACTIVE', effectiveFrom: '2099-01-01T00:00:00.000Z', effectiveTo: null }, at)).toBe(false); expect(isCurrentTemporal({ status: 'CLOSED', effectiveFrom: '2020-01-01T00:00:00.000Z', effectiveTo: at.toISOString() }, at)).toBe(false); });
  it('all five temporal client-write rule blocks deny writes and preserve scoped reads', () => { const rules = readFileSync('firestore.rules', 'utf8'); for (const name of ['driver_truck_assignments', 'driver_active_assignments', 'truck_active_assignments', 'truck_material_allocations', 'truck_active_material_allocations']) { const block = rules.slice(rules.indexOf(`      match /${name}/`)).split('\n      }')[0]; expect(block).toContain('allow create, update, delete: if false;'); expect(block).toContain('allow get, list: if isSignedIn() && isValidId(projectId) && isProjectMember(projectId);'); } });
});

describe('P5-B3 composite graph and standalone boundaries', () => {
  const payload = { projectId: 'P1', carrierId: 'C1', materialId: 'M1', driverName: 'سائق جديد', residencyId: '1234567899', plateNumber: 'ا ب ج 1234' };
  it('allocation integrity failure leaves no partial new identity, membership, affiliation or assignment', async () => {
    delete x.store['trucks/T2']; x.store['projects/P1/truck_active_material_allocations/T1'] = { allocationId: 'MISSING' };
    const before = structuredClone(x.store); await expect(new DriverTruckIntakeServer().processSharedIntake(payload, actor)).rejects.toThrow('ALLOCATION_POINTER_CORRUPTION'); expect(x.store).toEqual(before);
  });
  it('late allocation slot failure rolls back the entire shared-intake graph', async () => {
    delete x.store['trucks/T2']; const before = structuredClone(x.store); x.failWrites('truck_active_material_allocations/');
    await expect(new DriverTruckIntakeServer().processSharedIntake(payload, actor)).rejects.toThrow('simulated write failure'); expect(x.store).toEqual(before);
  });
  it('standalone identity/membership/affiliation setup does not create temporal records', async () => {
    delete x.store['drivers/D2']; delete x.store['trucks/T2']; const intake = new DriverTruckIntakeServer();
    await intake.createStandaloneDriver({ projectId: 'P1', carrierId: 'C1', driverName: 'سائق', residencyId: '1234567890' }, actor);
    await intake.createStandaloneTruck({ projectId: 'P1', carrierId: 'C1', plateNumber: 'ا ب ج 1234' }, actor);
    expect(rows('driver_truck_assignments')).toEqual([]); expect(rows('truck_material_allocations')).toEqual([]); expect(rows('driver_active_assignments')).toEqual([]); expect(rows('truck_active_material_allocations')).toEqual([]);
  });
});

describe('P5-B3 fresh competing transactions and displaced rollback', () => {
  it('fresh competing ASSIGN transactions elect one pair without dual-active history', async () => {
    const results = await Promise.allSettled([assignment('ASSIGN', 'D1', 'T1'), assignment('ASSIGN', 'D1', 'T2')]);
    expect(results.filter(r => r.status === 'fulfilled')).toHaveLength(1); expect(results.filter(r => r.status === 'rejected')).toHaveLength(1);
    expect(rows('driver_truck_assignments').filter(r => r.status === 'ACTIVE')).toHaveLength(1); expect(audits()).toHaveLength(1);
  });
  it('late reassign audit failure restores displaced history and counterpart slots exactly', async () => {
    await assignment(); await assignment('ASSIGN', 'D2', 'T2'); advance(); const before = structuredClone(x.store); x.failWrites('audit_logs/');
    await expect(assignment('REASSIGN', 'D1', 'T2')).rejects.toThrow('simulated write failure'); expect(x.store).toEqual(before);
  });
});
