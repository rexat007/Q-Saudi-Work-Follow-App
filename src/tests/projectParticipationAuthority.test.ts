import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { setTestDbOverride } from '../firebase/admin';
import { ProjectParticipationAuthority, planMembership } from '../services/projectParticipationAuthority.server';
import { DriverTruckIntakeServer } from '../services/driverTruckIntake.server';
import { GLOBAL_IDENTITIES, type GlobalKind } from '../utils/globalIdentityPolicy';
import { commandDatabase, accountProfile } from './helpers/commandDatabase';
const kinds = ['DRIVER', 'TRUCK', 'CARRIER', 'MATERIAL'] as const;
const actor = { userId: 'actor', role: 'SUPER_ADMIN', email: 'actor@example.invalid' } as any;
const createdAt = '2020-01-01T00:00:00.000Z';
const ids = { DRIVER: 'D', TRUCK: 'T', CARRIER: 'C1', MATERIAL: 'M' };
const globals = {
  DRIVER: { driverId: 'D', nationalId: '1234567890', status: 'ACTIVE' },
  TRUCK: { truckId: 'T', normalizedPlate: 'ا ب ج 1234', plate: 'ا ب ج 1234', status: 'ACTIVE' },
  CARRIER: { carrierId: 'C1', commercialRegistrationNo: '1010123456', status: 'ACTIVE' },
  MATERIAL: { materialId: 'M', code: 'SAND', status: 'ACTIVE' },
};
const memberPath = (kind: GlobalKind) => `projects/P1/${GLOBAL_IDENTITIES[kind].kind}_memberships/${ids[kind]}`;
const affilPath = (kind: 'DRIVER' | 'TRUCK') => `projects/P1/${GLOBAL_IDENTITIES[kind].kind}_carrier_affiliations/${ids[kind]}`;
const membership = (kind: GlobalKind, status = 'ACTIVE') => ({ projectId: 'P1', [GLOBAL_IDENTITIES[kind].id]: ids[kind], status, createdAt, createdBy: 'original', updatedAt: createdAt, updatedBy: 'original', statusChangedAt: createdAt, statusReason: 'original reason' });
const affiliation = (kind: 'DRIVER' | 'TRUCK', status = 'ACTIVE', carrierId = 'C1') => ({ projectId: 'P1', [GLOBAL_IDENTITIES[kind].id]: ids[kind], carrierId, status, createdAt, createdBy: 'original', updatedAt: createdAt, updatedBy: 'original' });
function initial() {
  const result: Record<string, any> = { 'users/actor': accountProfile(), 'projects/P1': { projectId: 'P1', status: 'APPROVED' } };
  for (const kind of kinds) result[`${GLOBAL_IDENTITIES[kind].collection}/${ids[kind]}`] = globals[kind];
  result['carriers/C2'] = { carrierId: 'C2', commercialRegistrationNo: '2010123456', status: 'ACTIVE' };
  result['carriers/C3'] = { carrierId: 'C3', commercialRegistrationNo: '3010123456', status: 'ACTIVE' };
  for (const kind of kinds) result[memberPath(kind)] = membership(kind);
  for (const carrierId of ['C2', 'C3']) result[`projects/P1/carrier_memberships/${carrierId}`] = { ...membership('CARRIER'), carrierId };
  return result;
}
let x: ReturnType<typeof commandDatabase>, service: ProjectParticipationAuthority;
beforeEach(() => { x = commandDatabase(initial()); setTestDbOverride(x.db); service = new ProjectParticipationAuthority(x.db); });
afterEach(() => vi.restoreAllMocks());
const run = (kind: GlobalKind, command: any, reason?: string) => service.membership('P1', { kind, entityId: ids[kind], command, ...(reason !== undefined ? { reason } : {}) }, actor);
const affiliate = (kind: 'DRIVER' | 'TRUCK', command: any, carrierId = 'C1') => service.affiliation('P1', { kind, entityId: ids[kind], carrierId, command }, actor);
const audits = () => Object.entries(x.store).filter(([path]) => path.startsWith('audit_logs/')).map(([, value]) => value);
function activeAssignment() {
  x.store['projects/P1/driver_truck_assignments/A'] = { assignmentId: 'A', projectId: 'P1', driverId: 'D', truckId: 'T', status: 'ACTIVE', effectiveFrom: createdAt, effectiveTo: null };
  x.store['projects/P1/driver_active_assignments/D'] = { assignmentId: 'A' };
  x.store['projects/P1/truck_active_assignments/T'] = { assignmentId: 'A' };
  x.store[affilPath('DRIVER')] = affiliation('DRIVER'); x.store[affilPath('TRUCK')] = affiliation('TRUCK');
}
describe('P5-B2 canonical membership lifecycle and audit', () => {
  for (const kind of kinds) {
    it(`${kind} enroll missing -> ACTIVE; concurrent enroll is idempotent`, async () => {
      delete x.store[memberPath(kind)];
      const result = await Promise.all([run(kind, 'ENROLL'), run(kind, 'ENROLL'), run(kind, 'ENROLL')]);
      expect(result.map(r => r.idempotent)).toEqual([false, true, true]);
      expect(x.store[memberPath(kind)]).toMatchObject({ projectId: 'P1', [GLOBAL_IDENTITIES[kind].id]: ids[kind], status: 'ACTIVE', createdBy: 'actor', updatedBy: 'actor' });
      expect(audits()).toHaveLength(1); expect(audits()[0]).toMatchObject({ command: 'ENROLL', entityType: kind, entityId: ids[kind], changes: { previousStatus: null, newStatus: 'ACTIVE' } });
    });
    it(`${kind} enroll ACTIVE is a strict no-op`, async () => {
      const before = structuredClone(x.store); expect((await run(kind, 'ENROLL')).idempotent).toBe(true); expect(x.store).toEqual(before);
    });
    for (const status of ['SUSPENDED', 'REMOVED']) {
      it(`${kind} enroll ${status} conflicts without mutation`, async () => {
        x.store[memberPath(kind)].status = status; const before = structuredClone(x.store);
        await expect(run(kind, 'ENROLL')).rejects.toThrow('MEMBERSHIP_STATE_CONFLICT'); expect(x.store).toEqual(before);
      });
      it(`${kind} explicit concurrent reactivation ${status} preserves provenance and reason`, async () => {
        x.store[memberPath(kind)].status = status;
        const result = await Promise.all([run(kind, 'REACTIVATE', 'approved return'), run(kind, 'REACTIVATE', 'approved return')]);
        expect(result.map(r => r.idempotent)).toEqual([false, true]);
        const record = x.store[memberPath(kind)]; expect(record.createdAt).toBe(createdAt); expect(record.createdBy).toBe('original');
        expect(record.updatedAt).toBeInstanceOf(Date); expect(record.statusChangedAt).toEqual(record.updatedAt); expect(record.updatedBy).toBe('actor'); expect(record.statusReason).toBe('approved return');
        expect(audits()).toHaveLength(1); expect(audits()[0]).toMatchObject({ command: 'REACTIVATE', actor: { userId: 'actor', role: 'SUPER_ADMIN' }, changes: { previousStatus: status, newStatus: 'ACTIVE', reason: 'approved return', before: { statusReason: 'original reason' } } });
      });
    }
    for (const [status, command, expected] of [['ACTIVE', 'SUSPEND', 'SUSPENDED'], ['ACTIVE', 'REMOVE', 'REMOVED'], ['SUSPENDED', 'REMOVE', 'REMOVED']]) {
      it(`${kind} ${status} ${command} -> ${expected} without history cascades`, async () => {
        x.store[memberPath(kind)].status = status; x.store['projects/P1/driver_truck_assignments/HISTORY'] = { untouched: true };
        const before = structuredClone(x.store); await run(kind, command, 'governance'); expect(x.store[memberPath(kind)].status).toBe(expected);
        for (const [path, value] of Object.entries(before)) if (path !== memberPath(kind)) expect(x.store[path]).toEqual(value);
        expect(audits()).toHaveLength(1);
      });
    }
    it(`${kind} REMOVED cannot SUSPEND; unknown command and missing membership fail closed`, async () => {
      x.store[memberPath(kind)].status = 'REMOVED'; await expect(run(kind, 'SUSPEND')).rejects.toThrow('INVALID_STATE_TRANSITION');
      await expect(run(kind, 'DELETE')).rejects.toThrow('INVALID_PARTICIPATION_COMMAND'); delete x.store[memberPath(kind)]; await expect(run(kind, 'REACTIVATE')).rejects.toThrow('MEMBERSHIP_NOT_FOUND');
    });
    it(`${kind} global ineligibility blocks enroll/reactivate but permits reduce commands`, async () => {
      x.store[`${GLOBAL_IDENTITIES[kind].collection}/${ids[kind]}`].status = kind === 'TRUCK' ? 'MAINTENANCE' : 'INACTIVE';
      await expect(run(kind, 'ENROLL')).rejects.toThrow('GLOBAL_ENTITY_INELIGIBLE'); x.store[memberPath(kind)].status = 'SUSPENDED';
      await expect(run(kind, 'REACTIVATE')).rejects.toThrow('GLOBAL_ENTITY_INELIGIBLE'); x.store[memberPath(kind)].status = 'ACTIVE';
      await run(kind, 'SUSPEND'); await run(kind, 'REMOVE'); expect(x.store[memberPath(kind)].status).toBe('REMOVED');
    });
    it(`${kind} same-state suspend/remove are audited only once`, async () => {
      await run(kind, 'SUSPEND'); expect((await run(kind, 'SUSPEND')).idempotent).toBe(true); await run(kind, 'REMOVE'); expect((await run(kind, 'REMOVE')).idempotent).toBe(true); expect(audits()).toHaveLength(2);
    });
    it(`${kind} audit failure rolls back membership mutation`, async () => {
      const before = structuredClone(x.store); x.failWrites('audit_logs/'); await expect(run(kind, 'SUSPEND')).rejects.toThrow('simulated write failure'); expect(x.store).toEqual(before);
    });
    it(`${kind} malformed persisted identity/scope/status/time/actor is rejected`, async () => {
      const original = membership(kind);
      for (const patch of [{ [GLOBAL_IDENTITIES[kind].id]: 'OTHER' }, { projectId: 'P2' }, { status: 'BAD' }, { statusChangedAt: 'yesterday' }, { createdBy: '../bad' }, { updatedAt: null }]) {
        x.store[memberPath(kind)] = { ...original, ...patch }; await expect(run(kind, 'REMOVE')).rejects.toThrow('PERSISTENCE_BOUNDARY_INVALID');
      }
    });
  }
  it('rejects metadata/profile injection; new records contain only canonical fields', async () => {
    await expect(service.membership('P1', { kind: 'DRIVER', entityId: 'D', command: 'ENROLL', metadata: { status: 'ACTIVE' } } as any, actor)).rejects.toThrow('INVALID_PARTICIPATION_COMMAND');
    delete x.store[memberPath('DRIVER')]; await run('DRIVER', 'ENROLL'); expect(Object.keys(x.store[memberPath('DRIVER')]).sort()).toEqual(['projectId', 'driverId', 'status', 'statusChangedAt', 'createdAt', 'createdBy', 'updatedAt', 'updatedBy'].sort());
  });
});
describe('P5-B2 Driver and Truck carrier affiliation authority', () => {
  for (const kind of ['DRIVER', 'TRUCK'] as const) {
    it(`${kind} creates missing affiliation and same-carrier ACTIVE is idempotent`, async () => {
      const result = await affiliate(kind, 'SET_AFFILIATION'); expect(result.affiliation).toMatchObject({ carrierId: 'C1', status: 'ACTIVE' });
      const before = structuredClone(x.store); expect((await affiliate(kind, 'SET_AFFILIATION')).idempotent).toBe(true); expect(x.store).toEqual(before);
      expect(audits()).toHaveLength(1); expect(audits()[0].command).toBe('SET_AFFILIATION');
    });
    it(`${kind} INACTIVE requires explicit reactivation preserving original creation`, async () => {
      x.store[affilPath(kind)] = affiliation(kind, 'INACTIVE'); await expect(affiliate(kind, 'SET_AFFILIATION')).rejects.toThrow('AFFILIATION_STATE_CONFLICT');
      await affiliate(kind, 'REACTIVATE_AFFILIATION'); expect(x.store[affilPath(kind)]).toMatchObject({ status: 'ACTIVE', createdBy: 'original', createdAt, updatedBy: 'actor' });
    });
    for (const condition of ['carrier global', 'entity global', 'carrier membership', 'entity membership']) it(`${kind} requires ${condition} eligibility`, async () => {
      const path = condition === 'carrier global' ? 'carriers/C1' : condition === 'entity global' ? `${GLOBAL_IDENTITIES[kind].collection}/${ids[kind]}` : condition === 'carrier membership' ? memberPath('CARRIER') : memberPath(kind);
      x.store[path].status = condition.includes('membership') ? 'SUSPENDED' : 'INACTIVE'; const before = structuredClone(x.store);
      await expect(affiliate(kind, 'SET_AFFILIATION')).rejects.toThrow(); expect(x.store).toEqual(before);
    });
    it(`${kind} changing C1 -> C2 requires explicit REASSIGN`, async () => {
      x.store[affilPath(kind)] = affiliation(kind); await expect(affiliate(kind, 'SET_AFFILIATION', 'C2')).rejects.toThrow(`${kind}_CARRIER_AFFILIATION_CONFLICT`);
      await affiliate(kind, 'REASSIGN', 'C2'); expect(x.store[affilPath(kind)]).toMatchObject({ carrierId: 'C2', createdBy: 'original' });
      expect(audits()[0]).toMatchObject({ command: 'REASSIGN', changes: { previousCarrierId: 'C1', newCarrierId: 'C2', previousStatus: 'ACTIVE', newStatus: 'ACTIVE' } });
    });
    it(`${kind} inactivation without dependent assignment preserves membership/global`, async () => {
      x.store[affilPath(kind)] = affiliation(kind); const before = structuredClone(x.store); await affiliate(kind, 'INACTIVATE');
      expect(x.store[affilPath(kind)].status).toBe('INACTIVE'); for (const [path, value] of Object.entries(before)) if (path !== affilPath(kind)) expect(x.store[path]).toEqual(value);
    });
    it(`${kind} active assignment blocks inactivation and carrier mismatch without touching temporal data`, async () => {
      activeAssignment(); const before = structuredClone(x.store);
      await expect(affiliate(kind, 'INACTIVATE')).rejects.toThrow('P5_B3_RELATIONSHIP_DEPENDENCY');
      await expect(affiliate(kind, 'REASSIGN', 'C2')).rejects.toThrow('P5_B3_RELATIONSHIP_DEPENDENCY'); expect(x.store).toEqual(before);
    });
    it(`${kind} protects active assignments even when the slot is absent`, async () => {
      activeAssignment(); delete x.store[`projects/P1/${GLOBAL_IDENTITIES[kind].kind}_active_assignments/${ids[kind]}`];
      await expect(affiliate(kind, 'REASSIGN', 'C2')).rejects.toThrow('P5_B3_RELATIONSHIP_DEPENDENCY');
    });
    it(`${kind} audit failure rolls back affiliation and concurrent commands have one current record`, async () => {
      const before = structuredClone(x.store); x.failWrites('audit_logs/'); await expect(affiliate(kind, 'SET_AFFILIATION')).rejects.toThrow(); expect(x.store).toEqual(before);
      x.failWrites(''); await Promise.all([affiliate(kind, 'SET_AFFILIATION'), affiliate(kind, 'SET_AFFILIATION')]); expect(audits()).toHaveLength(1);
      await Promise.all([affiliate(kind, 'REASSIGN', 'C2'), affiliate(kind, 'REASSIGN', 'C3')]); expect(x.store[affilPath(kind)].carrierId).toBe('C3');
      expect(audits()).toHaveLength(3); expect(audits()[2].changes.previousCarrierId).toBe('C2');
    });
  }
  it('standalone intake cannot silently change an INACTIVE old carrier to another carrier', async () => {
    x.store[affilPath('DRIVER')] = affiliation('DRIVER', 'INACTIVE');
    await expect(new DriverTruckIntakeServer().createStandaloneDriver({ projectId: 'P1', carrierId: 'C2', driverName: 'سائق', residencyId: '1234567890' }, actor)).rejects.toThrow('DRIVER_CARRIER_AFFILIATION_CONFLICT');
  });
});
describe('P5-B2 current principal and server-only rules', () => {
  for (const patch of [{ role: 'VIEWER' }, { role: 'PROJECT_ADMIN', assignedProjectIds: [] }, { status: 'SUSPENDED' }, { status: 'REJECTED' }, { isActive: false }]) it(`denies stale token via current account ${JSON.stringify(patch)}`, async () => {
    Object.assign(x.store['users/actor'], patch); const before = structuredClone(x.store);
    await expect(run('DRIVER', 'SUSPEND')).rejects.toThrow(); await expect(affiliate('TRUCK', 'SET_AFFILIATION')).rejects.toThrow(); expect(x.store).toEqual(before);
  });
  it('assigned PROJECT_ADMIN succeeds and audit role is the current role, not token SUPER_ADMIN', async () => {
    x.store['users/actor'].role = 'PROJECT_ADMIN'; await run('DRIVER', 'SUSPEND'); await affiliate('TRUCK', 'SET_AFFILIATION'); expect(audits().every(a => a.actor.role === 'PROJECT_ADMIN')).toBe(true);
  });
  it('participation and temporal browser write boundaries are closed with scoped reads', () => {
    const current = readFileSync('firestore.rules', 'utf8');
    const block = (source: string, name: string) => source.slice(source.indexOf(`      match /${name}/`)).split('\n      }')[0];
    for (const name of ['driver_memberships', 'truck_memberships', 'carrier_memberships', 'material_memberships', 'driver_carrier_affiliations', 'truck_carrier_affiliations']) {
      expect(block(current, name)).toContain('allow create, update, delete: if false;'); expect(block(current, name)).toContain('allow get, list: if isSignedIn() && isValidId(projectId) && isProjectMember(projectId);');
    }
    for (const name of ['driver_truck_assignments', 'truck_material_allocations', 'driver_active_assignments', 'truck_active_assignments', 'truck_active_material_allocations']) {
      expect(block(current, name)).toContain('allow create, update, delete: if false;');
      expect(block(current, name)).toContain('allow get, list: if isSignedIn() && isValidId(projectId) && isProjectMember(projectId);');
    }
  });
});

describe('P5-B2 shared intake and standalone integration', () => {
  const intake = new DriverTruckIntakeServer();
  const standalone = (kind: 'DRIVER' | 'TRUCK') => kind === 'DRIVER'
    ? intake.createStandaloneDriver({ projectId: 'P1', carrierId: 'C1', driverName: 'سائق', residencyId: '1234567890' }, actor)
    : intake.createStandaloneTruck({ projectId: 'P1', carrierId: 'C1', plateNumber: 'ا ب ج 1234' }, actor);
  for (const kind of ['DRIVER', 'TRUCK'] as const) {
    for (const status of ['SUSPENDED', 'REMOVED']) it(`${kind} standalone ${status} membership requires explicit REACTIVATE without rewriting provenance`, async () => {
      x.store[memberPath(kind)].status = status; const before = structuredClone(x.store);
      await expect(standalone(kind)).rejects.toThrow('MEMBERSHIP_STATE_CONFLICT'); expect(x.store).toEqual(before);
      await run(kind, 'REACTIVATE'); const result = await standalone(kind);
      expect(result.membershipStatus).toBe('EXISTING'); expect(x.store[memberPath(kind)]).toMatchObject({ createdBy: 'original', createdAt });
    });
    it(`${kind} standalone audit failure rolls back initial membership and affiliation together`, async () => {
      delete x.store[memberPath(kind)]; const before = structuredClone(x.store); x.failWrites('AUD-PARTICIPATION-');
      await expect(standalone(kind)).rejects.toThrow('simulated write failure'); expect(x.store).toEqual(before);
    });
  }
  it('shared intake participation audit failure rolls back the whole composite', async () => {
    delete x.store[memberPath('DRIVER')]; delete x.store[memberPath('TRUCK')]; const before = structuredClone(x.store); x.failWrites('AUD-PARTICIPATION-');
    await expect(intake.processSharedIntake({ projectId: 'P1', carrierId: 'C1', materialId: 'M', driverName: 'سائق', residencyId: '1234567890', plateNumber: 'ا ب ج 1234' }, actor)).rejects.toThrow('simulated write failure'); expect(x.store).toEqual(before);
  });
  it('HTTP command endpoints preserve existing project/admin middleware and call the server authority', () => {
    const app = readFileSync('server/app.ts', 'utf8');
    for (const command of ['membership', 'affiliation']) {
      const start = app.indexOf(`app.post('/api/projects/:projectId/${command}-commands'`), route = app.slice(start, app.indexOf('\n});', start));
      expect(route).toContain('enforceProjectIsolation, enforceAdminOnly'); expect(route).toContain(`new ProjectParticipationAuthority().${command}(req.params.projectId, req.body, (req as any).user)`);
    }
  });
});

describe('P5-B2 creation provenance representation', () => {
  it('preserves a persisted Firestore Timestamp without rewriting its representation on reactivation', async () => {
    const { Timestamp } = await import('firebase-admin/firestore');
    const timestamp = Timestamp.fromDate(new Date(createdAt));
    const before = { ...membership('DRIVER', 'SUSPENDED'), createdAt: timestamp };
    const plan = planMembership({ kind: 'DRIVER', projectId: 'P1', entityId: 'D', command: 'REACTIVATE', before, global: globals.DRIVER, actor: { ...accountProfile(), email: 'actor@example.invalid', displayName: 'Actor' } as any });
    expect(plan.after.createdAt).toBe(timestamp); expect(plan.after.createdBy).toBe('original'); expect(plan.after.updatedBy).toBe('actor');
  });
});
