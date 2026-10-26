import { beforeEach, describe, expect, it } from 'vitest';
import { accountProfile, commandDatabase } from './helpers/commandDatabase';
import { setTestDbOverride } from '../firebase/admin';
import { SetupFleetQuery } from '../services/setupFleetQuery.server';
import { driverTruckIntakeServer } from '../services/driverTruckIntake.server';
import { ProjectParticipationAuthority } from '../services/projectParticipationAuthority.server';
import { TemporalRelationshipAuthority } from '../services/temporalRelationshipAuthority.server';
const actor = { userId: 'actor', email: 'a@example.invalid' } as any;
function initial() {
  const data: Record<string, any> = { 'users/actor': accountProfile('PROJECT_ADMIN'), 'projects/P1': { projectId: 'P1', status: 'SETUP' } };
  const profiles: Record<string, any> = {
    driver: { driverId: 'D1', nationalId: '1234567890', fullNameAr: 'Driver' },
    truck: { truckId: 'T1', normalizedPlate: 'AAA', plate: 'AAA' },
    carrier: { carrierId: 'C1', commercialRegistrationNo: '1010123456', nameAr: 'Carrier' },
    material: { materialId: 'M1', code: 'SAND', nameAr: 'Sand' },
  };
  for (const [kind, profile] of Object.entries(profiles)) {
    const id = profile[kind + 'Id']; data[`${kind}s/${id}`] = { ...profile, status: 'ACTIVE' };
    data[`projects/P1/${kind}_memberships/${id}`] = { projectId: 'P1', [kind + 'Id']: id, status: 'ACTIVE', createdAt: new Date('2020-01-01'), createdBy: 'creator' };
    if (kind === 'driver' || kind === 'truck') data[`projects/P1/${kind}_carrier_affiliations/${id}`] = { projectId: 'P1', [kind + 'Id']: id, carrierId: 'C1', status: 'ACTIVE' };
  }
  return data;
}
let x: ReturnType<typeof commandDatabase>, query: SetupFleetQuery;
beforeEach(() => { x = commandDatabase(initial()); setTestDbOverride(x.db); query = new SetupFleetQuery(x.db); });
describe('P6-B1 administrative canonical read', () => {
  it('preserves standalone drivers, partial trucks and all membership states without writes', async () => {
    x.store['projects/P1/driver_memberships/D1'].status = 'REMOVED';
    const before = structuredClone(x.store), result = await query.read('P1', actor);
    expect(result.participants.find(p => p.id === 'D1')).toMatchObject({ membershipStatus: 'REMOVED', globalStatus: 'ACTIVE', canReactivate: true, eligible: false, assignment: null });
    expect(result.fleet.rows[0]).toMatchObject({ truckId: 'T1', driverId: null, materialId: null, classification: 'PARTIAL' });
    expect(x.store).toEqual(before);
  });
  it.each([['driver', 'D1', 'SUSPENDED'], ['truck', 'T1', 'MAINTENANCE'], ['carrier', 'C1', 'INACTIVE'], ['material', 'M1', 'INACTIVE']])('%s ineligibility stays visible without allowing reactivation/use', async (kind, id, status) => {
    x.store[`${kind}s/${id}`].status = status; const result = await query.read('P1', actor);
    expect(result.participants.find(p => p.id === id)).toMatchObject({ globalStatus: status, eligible: false, canReactivate: false });
    if (kind === 'truck') expect(result.fleet.rows).toHaveLength(1);
  });
  it('marks malformed Global display data without returning it', async () => {
    x.store['drivers/D1'].fullNameAr = { hidden: 'SECRET' };
    const result = await query.read('P1', actor); expect(result.participants.find(p => p.id === 'D1')).toMatchObject({ issue: 'GLOBAL_ENTITY_INVALID', eligible: false }); expect(JSON.stringify(result)).not.toContain('SECRET');
  });
  it.each(['VIEWER', 'DRIVER'])('does not expose administrative setup context to %s', async role => {
    x.store['users/actor'].role = role; await expect(query.read('P1', actor)).rejects.toMatchObject({ code: 'FORBIDDEN_GLOBAL_COMMAND' });
  });
  it('rejects a currently revoked scope', async () => { x.store['users/actor'].assignedProjectIds = []; await expect(query.read('P1', actor)).rejects.toMatchObject({ code: 'FORBIDDEN_GLOBAL_COMMAND' }); });
  it('uses natural-identity resolution for an intake preview without creating lookups or relationships', async () => {
    const before = structuredClone(x.store), preview = await query.previewIntake('P1', { residencyId: '1234567890', plateNumber: 'AAA' }, actor);
    expect(preview).toMatchObject({ driverId: 'D1', truckId: 'T1', assignments: [], allocation: null }); expect(x.store).toEqual(before);
  });
  it('surfaces slot corruption and performs no repair', async () => {
    x.store['projects/P1/truck_active_assignments/T1'] = { assignmentId: 'missing' };
    const before = structuredClone(x.store), result = await query.read('P1', actor);
    expect(result.participants.find(p => p.id === 'T1')?.issue).toBe('ASSIGNMENT_POINTER_INTEGRITY_ERROR');
    expect(result.fleet.rows[0].classification).toBe('INTEGRITY_ERROR'); expect(x.store).toEqual(before);
  });
});
describe('P6-B1 existing command integration', () => {
  it('completes incremental create → assign → allocate → reread through existing authorities', async () => {
    const driver = await driverTruckIntakeServer.createStandaloneDriver({ projectId: 'P1', carrierId: 'C1', driverName: 'New Driver', residencyId: '2234567890' }, actor);
    const truck = await driverTruckIntakeServer.createStandaloneTruck({ projectId: 'P1', carrierId: 'C1', plateNumber: 'BBB' }, actor);
    expect(driver.identityStatus).toBe('CREATED'); expect(truck.identityStatus).toBe('CREATED');
    expect(Object.keys(x.store).filter(p => /assignments|allocations/.test(p))).toEqual([]);
    const partial = await query.read('P1', actor);
    expect(partial.participants.find(p => p.id === driver.driverId)).toMatchObject({ membershipStatus: 'ACTIVE', assignment: null });
    expect(partial.fleet.rows.find(p => p.truckId === truck.truckId)?.classification).toBe('PARTIAL');
    const commands = new TemporalRelationshipAuthority(x.db);
    await commands.execute('ASSIGNMENT', 'P1', { command: 'ASSIGN', driverId: driver.driverId, truckId: truck.truckId }, actor);
    await commands.execute('ALLOCATION', 'P1', { command: 'ALLOCATE', truckId: truck.truckId, materialId: 'M1' }, actor);
    expect((await new SetupFleetQuery(x.db).read('P1', actor)).fleet.rows.find(p => p.truckId === truck.truckId)).toMatchObject({ driverId: driver.driverId, materialId: 'M1', classification: 'OPERATIONAL' });
  });
  it('guides affiliation changes through explicit temporal CLOSE without a hidden cascade', async () => {
    x.store['carriers/C2'] = { carrierId: 'C2', commercialRegistrationNo: '1010123457', status: 'ACTIVE' };
    x.store['projects/P1/carrier_memberships/C2'] = { projectId: 'P1', carrierId: 'C2', status: 'ACTIVE' };
    const temporal = new TemporalRelationshipAuthority(x.db), participation = new ProjectParticipationAuthority(x.db);
    const a = await temporal.execute('ASSIGNMENT', 'P1', { command: 'ASSIGN', driverId: 'D1', truckId: 'T1' }, actor);
    const before = structuredClone(x.store);
    await expect(participation.affiliation('P1', { kind: 'DRIVER', entityId: 'D1', carrierId: 'C2', command: 'REASSIGN' }, actor)).rejects.toMatchObject({ code: 'P5_B3_RELATIONSHIP_DEPENDENCY' });
    expect(x.store).toEqual(before);
    await temporal.execute('ASSIGNMENT', 'P1', { command: 'CLOSE', assignmentId: a.relationship.assignmentId }, actor);
    await participation.affiliation('P1', { kind: 'DRIVER', entityId: 'D1', carrierId: 'C2', command: 'REASSIGN' }, actor);
    expect((await query.read('P1', actor)).participants.find(p => p.id === 'D1')).toMatchObject({ assignment: null, affiliation: { carrierId: 'C2', status: 'ACTIVE' } });
    expect(x.store[`projects/P1/driver_truck_assignments/${a.relationship.assignmentId}`].status).toBe('CLOSED');
  });
  it.each(['DRIVER', 'TRUCK'] as const)('standalone %s reuse creates no temporal relationship or slot', async kind => {
    const result = kind === 'DRIVER' ? await driverTruckIntakeServer.createStandaloneDriver({ projectId: 'P1', carrierId: 'C1', driverName: 'Driver', residencyId: '1234567890' }, actor) : await driverTruckIntakeServer.createStandaloneTruck({ projectId: 'P1', carrierId: 'C1', plateNumber: 'AAA' }, actor);
    expect(result).toMatchObject({ identityStatus: 'EXISTING' });
    expect(Object.keys(x.store).filter(p => /assignments|allocations/.test(p))).toEqual([]);
  });
  it('requires explicit reactivation and preserves creation provenance', async () => {
    x.store['projects/P1/driver_memberships/D1'].status = 'REMOVED';
    await expect(driverTruckIntakeServer.createStandaloneDriver({ projectId: 'P1', carrierId: 'C1', driverName: 'Driver', residencyId: '1234567890' }, actor)).rejects.toThrow('MEMBERSHIP_STATE_CONFLICT');
    await new ProjectParticipationAuthority(x.db).membership('P1', { kind: 'DRIVER', entityId: 'D1', command: 'REACTIVATE' }, actor);
    expect(x.store['projects/P1/driver_memberships/D1']).toMatchObject({ status: 'ACTIVE', createdBy: 'creator', createdAt: new Date('2020-01-01') });
  });
  it('assigns, allocates and closes through B3; administrative reads expose the exact current IDs', async () => {
    const commands = new TemporalRelationshipAuthority(x.db);
    const a = await commands.execute('ASSIGNMENT', 'P1', { command: 'ASSIGN', driverId: 'D1', truckId: 'T1' }, actor);
    await commands.execute('ASSIGNMENT', 'P1', { command: 'ASSIGN', driverId: 'D1', truckId: 'T1' }, actor);
    const l = await commands.execute('ALLOCATION', 'P1', { command: 'ALLOCATE', truckId: 'T1', materialId: 'M1' }, actor);
    const read = await query.read('P1', actor);
    expect(read.participants.find(p => p.id === 'D1')?.assignment?.assignmentId).toBe(a.relationship.assignmentId);
    expect(read.fleet.rows[0]).toMatchObject({ assignmentId: a.relationship.assignmentId, allocationId: l.relationship.allocationId, classification: 'OPERATIONAL' });
    expect(Object.keys(x.store).filter(p => /\/driver_truck_assignments\//.test(p))).toHaveLength(1);
    await commands.execute('ASSIGNMENT', 'P1', { command: 'CLOSE', assignmentId: a.relationship.assignmentId }, actor);
    await commands.execute('ALLOCATION', 'P1', { command: 'CLOSE', allocationId: l.relationship.allocationId }, actor);
    expect((await query.read('P1', actor)).fleet.rows[0]).toMatchObject({ assignmentId: null, allocationId: null, classification: 'PARTIAL' });
  });
});
