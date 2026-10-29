import { ProjectReadinessAdminReadContext } from '../services/projectReadiness.server';
import { globalDriverRepository, globalTruckRepository, globalCarrierRepository, globalMaterialRepository } from '../repositories/globalIdentity.repository';
import { projectDriverMembershipRepository } from '../repositories/projectMembership.repository';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { Timestamp as ClientTimestamp, getDoc, getDocs, setDoc } from 'firebase/firestore';
import { decodePersistence, decodeUser, decodeProject, decodeTrip, decodePricing, decodeMigration, decodeGlobal, decodeRelationship, decodeScopedProjection, persistenceTime, PersistenceBoundaryError } from '../utils/persistenceBoundary';
import { sanitizeUndefined } from '../utils/sanitize';
import { UserRepository } from '../repositories/user.repository';
import { ProjectRepository } from '../repositories/project.repository';
import { TripRepository } from '../repositories/trip.repository';
import { PricingRuleRepository } from '../repositories/pricingRule.repository';
import { createInMemoryAdminDb, setTestDbOverride, inMemoryAdminStore } from '../firebase/admin';
import { ServerTripPersistenceAdapter } from '../services/canonicalTripPersistence.server';
import { ImportSessionServerService } from '../services/importSession.server';
import { getState, markDirty } from '../services/projectWorkspaceProjectionState.server';
import { WorkspaceStorageBoundary } from '../../server/workspace.isolation';

vi.mock('../firebase/config', () => ({ db: {}, auth: { currentUser: { uid: 'u', email: 'u@example.invalid', getIdToken:async()=> 'TEST_TOKEN' } } }));
vi.mock('firebase/firestore', async original => ({
  ...await original<typeof import('firebase/firestore')>(),
  doc: vi.fn((...args: unknown[]) => ({ id: args.at(-1) })), collection: vi.fn(() => ({})), query: vi.fn(() => ({})), where: vi.fn(() => ({})), orderBy: vi.fn(() => ({})), limit: vi.fn(() => ({})),
  getDoc: vi.fn(), getDocs: vi.fn(), setDoc: vi.fn(async () => {}), updateDoc: vi.fn(async () => {}),
}));
const iso = '2026-10-24T00:00:00.000Z';
const user = () => ({ userId: 'u', role: 'VIEWER', assignedProjectIds: [], isActive: false, createdAt: iso, updatedAt: iso });
const migration = () => ({ migrationJobId: 'job', projectId: 'P', targetFolderId: 'target', targetProvider: 'SHARED_DRIVE', sourceProvider: 'MY_DRIVE', status: 'VALIDATING', startedAt: iso, copiedFileIds: [], fileIdMap: {} });
beforeEach(() => {
  vi.clearAllMocks();
  for (const key of Object.keys(inMemoryAdminStore)) delete inMemoryAdminStore[key];
  setTestDbOverride(createInMemoryAdminDb());
});

describe('Canonical persistence representations', () => {
  it.each([new Date(iso), Timestamp.fromDate(new Date(iso)), ClientTimestamp.fromDate(new Date(iso)), iso])('normalizes accepted timestamp representations without changing the instant %#', value => {
    expect(persistenceTime(value, 'createdAt', 'date')).toEqual(new Date(iso));
    expect(persistenceTime(value, 'updatedAt', 'iso')).toBe(iso);
    const raw = { ...user(), createdAt: value };
    expect(decodeUser<any>(raw, 'u').createdAt).toEqual(new Date(iso));
    expect(raw.createdAt).toBe(value);
  });
  it.each(['not-a-time', '2026-02-30T00:00:00Z', '2026-13-01T00:00:00Z', new Date(NaN), 123, {}, null, { toDate: () => 'not-a-date' }, { toDate: () => { throw Error('corrupt'); } }])('rejects malformed timestamps instead of inventing now %#', value => {
    expect(() => persistenceTime(value, 'createdAt', 'date')).toThrow('PERSISTENCE_BOUNDARY_INVALID:createdAt');
  });
  it.each([null, [], 'record', new Date(iso)])('rejects non-document values %#', raw => {
    expect(() => decodePersistence(raw)).toThrow(PersistenceBoundaryError);
  });
  it.each(['', '  ', 1, null, undefined])('rejects missing or malformed required identity %j', userId => {
    expect(() => decodeUser({ ...user(), userId }, 'u')).toThrow('PERSISTENCE_BOUNDARY_INVALID:userId');
  });
  it('rejects document/entity/project identity mismatches', () => {
    expect(() => decodeProject({ projectId: 'other' }, 'P')).toThrow(PersistenceBoundaryError);
    expect(() => decodeTrip({ tripId: 't', projectId: 'other' }, 't', 'P')).toThrow(PersistenceBoundaryError);
    expect(() => decodePricing({ pricingRuleId: 'other', projectId: 'P' }, 'r', 'P')).toThrow(PersistenceBoundaryError);
  });
  it.each(['SYSTEM', 'ADMIN', '', 1])('rejects noncanonical persisted role %j', role => {
    expect(() => decodeUser({ ...user(), role }, 'u')).toThrow('PERSISTENCE_BOUNDARY_INVALID:role');
  });
  it.each([undefined, {}, 'P', [1], ['']])('requires a valid assigned-project array %#', assignedProjectIds => {
    expect(() => decodeUser({ ...user(), assignedProjectIds }, 'u')).toThrow('PERSISTENCE_BOUNDARY_INVALID:assignedProjectIds');
  });
  it('validates canonical vocabularies without confusing context subsets', () => {
    expect(decodeProject<any>({ projectId: 'P', status: 'ACTIVE' }, 'P').status).toBe('ACTIVE');
    expect(() => decodeProject({ projectId: 'P', status: 'IN_PROGRESS' }, 'P')).toThrow(PersistenceBoundaryError);
    expect(() => decodeTrip({ tripId: 't', projectId: 'P', status: 'DELIVERED' }, 't', 'P')).toThrow(PersistenceBoundaryError);
    expect(() => decodeGlobal({ truckId: 't', truckType: 'ANY' }, 'truck', 't')).toThrow(PersistenceBoundaryError);
    expect(() => decodeGlobal({ materialId: 'm', unitOfMeasure: 'KG' }, 'material', 'm')).toThrow(PersistenceBoundaryError);
    expect(() => decodeRelationship({ driverId: 'd', projectId: 'P', status: 'REMOVED' }, 'driverId', 'd', 'P', ['ACTIVE', 'INACTIVE'])).toThrow(PersistenceBoundaryError);
  });
  it('preserves all nine canonical roles and rejects non-boolean activation metadata', () => {
    for (const role of ['PROJECT_ADMIN', 'SUPER_ADMIN', 'SITE_SUPERVISOR', 'SUPERVISOR', 'DISPATCHER', 'FINANCE_AUDITOR', 'SCALE_OPERATOR', 'DRIVER', 'VIEWER']) {
      expect(decodeUser<any>({ ...user(), role }, 'u').role).toBe(role);
    }
    expect(() => decodeUser({ ...user(), isActive: 'false' }, 'u')).toThrow(PersistenceBoundaryError);
  });
  it('preserves date-only commercial validity fields instead of treating them as event timestamps', () => {
    const data = { pricingRuleId: 'r', projectId: 'P', effectiveFrom: '2026-01-01', effectiveTo: '2026-12-31' };
    expect(decodePricing<any>(data, 'r', 'P').effectiveFrom).toBe('2026-01-01');
    expect(decodeScopedProjection<any>(data, 'pricingRuleId', 'r', 'P').effectiveTo).toBe('2026-12-31');
  });
  it('preserves nullable interval closure and normalizes ISO-boundary times', () => {
    const result = decodeRelationship<any>({ assignmentId: 'a', projectId: 'P', effectiveFrom: Timestamp.fromDate(new Date(iso)), effectiveTo: null }, 'assignmentId', 'a', 'P', ['ACTIVE', 'CLOSED']);
    expect(result.effectiveFrom).toBe(iso); expect(result.effectiveTo).toBeNull();
  });
  it('validates migration identity, status, lists, maps and native timestamps', () => {
    expect(decodeMigration<any>({ ...migration(), startedAt: Timestamp.fromDate(new Date(iso)) }, 'target').startedAt).toBe(iso);
    for (const patch of [{ projectId: '' }, { targetFolderId: 'other' }, { status: 'DONE' }, { copiedFileIds: {} }, { fileIdMap: [] }, { fileIdMap: new Date(iso) }, { startedAt: undefined }]) {
      expect(() => decodeMigration({ ...migration(), ...patch }, 'target')).toThrow(PersistenceBoundaryError);
    }
  });
});

describe('Write sanitation', () => {
  it('omits undefined object fields and preserves null, false, zero, empty arrays and SDK sentinels', () => {
    const sentinel = FieldValue.serverTimestamp();
    const date = new Date(iso);
    const input = { absent: undefined, explicit: null, enabled: false, zero: 0, empty: [], nested: { absent: undefined, valid: 'value' }, date, sentinel };
    const output = sanitizeUndefined(input);
    expect(Object.hasOwn(output, 'absent')).toBe(false);
    expect(output).toMatchObject({ explicit: null, enabled: false, zero: 0, empty: [], nested: { valid: 'value' } });
    expect(Object.hasOwn(output.nested, 'absent')).toBe(false);
    expect(output.date).toBe(date); expect(output.sentinel).toBe(sentinel);
    expect(sanitizeUndefined(undefined)).toBeUndefined();
  });
  it('rejects undefined array slots instead of inserting null or shifting indices', () => {
    expect(() => sanitizeUndefined([1, undefined, 3])).toThrow('undefined_array_element');
    expect(() => sanitizeUndefined(new Array(1))).toThrow('undefined_array_element');
    expect(sanitizeUndefined([0, false, null, []])).toEqual([0, false, null, []]);
  });
  it('preserves ordinary JSON keys without prototype mutation', () => {
    const output = sanitizeUndefined(JSON.parse('{"__proto__":{"kept":false},"nested":{"value":0}}'));
    expect(Object.getPrototypeOf(output)).toBe(Object.prototype);
    expect(Object.hasOwn(output, '__proto__')).toBe(true);
    expect(output.__proto__).toEqual({ kept: false });
  });
  it('cannot bypass sanitation with an own constructor property', () => {
    const output = sanitizeUndefined({ constructor: { name: 'Timestamp' }, nested: { omit: undefined } });
    expect(output.nested).toEqual({});
  });
});

describe('Repository and server adoption', () => {
  it('decodes trip-number lookup results through the canonical boundary', async () => {
    vi.mocked(getDocs).mockResolvedValue({ empty: false, docs: [{ id: 't', data: () => ({ tripId: 't', projectId: 'P', createdAt: Timestamp.fromDate(new Date(iso)) }) }] } as any);
    expect((await new TripRepository().findByTripNumber('P', '001'))?.createdAt).toEqual(new Date(iso));
  });
  it.each([{ tripId: 'other', projectId: 'P' }, { tripId: 't', projectId: 'other' }])('rejects invalid trip-number lookup identity/scope %j', async record => {
    vi.mocked(getDocs).mockResolvedValue({ empty: false, docs: [{ id: 't', data: () => record }] } as any);
    await expect(new TripRepository().findByTripNumber('P', '001')).rejects.toHaveProperty('code', 'PERSISTENCE_BOUNDARY_INVALID');
  });
  it.each([{}, { projectId: 'P' }])('decodes legacy pricing without inventing missing fields %j', async scope => {
    const record = { pricingRuleId: 'r', ...scope, effectiveFrom: '2026-01-01', effectiveTo: '2026-12-31', createdAt: Timestamp.fromDate(new Date(iso)), legacyValue: 0 };
    inMemoryAdminStore['projects/P/pricingRules/r'] = record;
    const result = await new ServerTripPersistenceAdapter().pricingRuleRepository.findById('P', 'r');
    expect(result).toEqual({ ...record, createdAt: new Date(iso) });
    expect(Object.hasOwn(result, 'projectId')).toBe(Object.hasOwn(scope, 'projectId'));
    expect(Object.hasOwn(result, 'updatedAt')).toBe(false);
  });
  it.each([{ pricingRuleId: 'other' }, { projectId: 'other' }, { createdAt: 'corrupt' }, { updatedAt: 'corrupt' }])('rejects malformed legacy pricing identity/scope/audit time %j', async patch => {
    inMemoryAdminStore['projects/P/pricingRules/r'] = { pricingRuleId: 'r', ...patch };
    await expect(new ServerTripPersistenceAdapter().pricingRuleRepository.findById('P', 'r')).rejects.toHaveProperty('code', 'PERSISTENCE_BOUNDARY_INVALID');
  });
  it('decodes actual project/user/trip/pricing repository read results', async () => {
    const read = vi.mocked(getDoc);
    read.mockResolvedValue({ exists: () => true, id: 'u', data: user } as any);
    expect((await new UserRepository().findById('u'))?.createdAt).toEqual(new Date(iso));
    read.mockResolvedValue({ exists: () => true, id: 'P', data: () => ({ projectId: 'P', createdAt: iso }) } as any);
    expect((await new ProjectRepository().findById('P'))?.createdAt).toEqual(new Date(iso));
    read.mockResolvedValue({ exists: () => true, id: 't', data: () => ({ tripId: 't', projectId: 'P', createdAt: iso }) } as any);
    expect((await new TripRepository().findById('P', 't'))?.createdAt).toEqual(new Date(iso));
    read.mockResolvedValue({ exists: () => true, id: 'r', data: () => ({ pricingRuleId: 'r', projectId: 'P', createdAt: iso }) } as any);
    const http = vi.spyOn(globalThis,'fetch').mockResolvedValueOnce({ok:true,json:async()=>({success:true,data:[{pricingRuleId:'r',projectId:'P',createdAt:iso}]})} as any);
    try {
      expect((await new PricingRuleRepository().findById('P', 'r'))?.createdAt).toEqual(new Date(iso));
      expect(http).toHaveBeenCalledWith('/api/projects/P/pricing-rules',expect.objectContaining({method:'GET',headers:expect.objectContaining({Authorization:'Bearer TEST_TOKEN'})}));
    } finally { http.mockRestore(); }
  });
  it.each([
    [globalDriverRepository, 'driverId'], [globalTruckRepository, 'truckId'],
    [globalCarrierRepository, 'carrierId'], [globalMaterialRepository, 'materialId'],
  ] as const)('validates live global identity repository reads %#', async (repository, field) => {
    vi.mocked(getDoc).mockResolvedValue({ exists: () => true, id: 'id', data: () => ({ [field]: 'id', createdAt: iso }) } as any);
    expect((await repository.findById('id'))?.createdAt).toEqual(new Date(iso));
    vi.mocked(getDoc).mockResolvedValue({ exists: () => true, id: 'id', data: () => ({ [field]: 'other' }) } as any);
    await expect(repository.findById('id')).rejects.toHaveProperty('code', 'PERSISTENCE_BOUNDARY_INVALID');
  });
  it('keeps path-scoped legacy membership projection compatibility but rejects invalid identity/status', async () => {
    vi.mocked(getDoc).mockResolvedValue({ exists: () => true, id: 'd', data: () => ({ driverId: 'd', status: 'ACTIVE' }) } as any);
    expect((await projectDriverMembershipRepository.getMembership('P', 'd'))?.driverId).toBe('d');
    vi.mocked(getDoc).mockResolvedValue({ exists: () => true, id: 'd', data: () => ({ driverId: 'd', status: 'INVALID' }) } as any);
    await expect(projectDriverMembershipRepository.getMembership('P', 'd')).rejects.toHaveProperty('code', 'PERSISTENCE_BOUNDARY_INVALID');
  });
  it('rejects malformed list data rather than delivering cast entities', async () => {
    vi.mocked(getDocs).mockResolvedValue({ docs: [{ id: 'u', data: () => ({ ...user(), role: 'INVALID' }) }] } as any);
    await expect(new UserRepository().listAll()).rejects.toHaveProperty('code', 'PERSISTENCE_BOUNDARY_INVALID');
  });
  it('sanitizes user repository writes while preserving inactive/empty membership', async () => {
    await new UserRepository().create({ ...user(), requestedRole: undefined, metadata: { optional: undefined, explicit: null } } as any);
    const payload = vi.mocked(setDoc).mock.calls[0][1] as any;
    expect(Object.hasOwn(payload, 'requestedRole')).toBe(false);
    expect(payload.isActive).toBe(false); expect(payload.assignedProjectIds).toEqual([]); expect(payload.metadata).toEqual({ explicit: null });
  });
  it('decodes and sanitizes the real Admin trip adapter boundary', async () => {
    inMemoryAdminStore['projects/P/trips/t'] = { tripId: 't', projectId: 'P', createdAt: Timestamp.fromDate(new Date(iso)) };
    const adapter = new ServerTripPersistenceAdapter();
    expect((await adapter.tripRepository.findById('P', 't'))?.createdAt).toEqual(new Date(iso));
    await adapter.tripRepository.update('P', 't', { metadata: { optional: undefined, explicit: null } } as any, 'u');
    expect(inMemoryAdminStore['projects/P/trips/t'].metadata).toEqual({ explicit: null });
    inMemoryAdminStore['projects/P/trips/t'].projectId = 'other';
    await expect(adapter.tripRepository.findById('P', 't')).rejects.toHaveProperty('code', 'PERSISTENCE_BOUNDARY_INVALID');
  });
  it('normalizes persisted projection timestamps and rejects corruption without fabricating history', async () => {
    const key = 'projects/P/workspace_projection_state/current';
    inMemoryAdminStore[key] = { projectId: 'P', updatedAt: Timestamp.fromDate(new Date(iso)), dirtySince: null, dirtyTabs: [], lastSuccessfulProjectionTabs: [] };
    expect((await getState('P')).updatedAt).toBe(iso);
    inMemoryAdminStore[key].updatedAt = 'corrupt';
    await expect(getState('P')).rejects.toHaveProperty('code', 'PERSISTENCE_BOUNDARY_INVALID');
    await expect(markDirty('P', ['DRIVERS'])).rejects.toHaveProperty('code', 'PERSISTENCE_BOUNDARY_INVALID');
  });
  it('normalizes import-session ISO transport times and omits undefined checkpoint metadata', async () => {
    const service = new ImportSessionServerService(createInMemoryAdminDb());
    const context = { userId: 'u', role: 'PROJECT_ADMIN', assignedProjectIds: ['P'] } as any;
    await service.createSession('P', { importSessionId: 's', sourceMetadata: { absent: undefined, explicit: null } }, context);
    const key = 'projects/P/importSessions/s';
    expect(inMemoryAdminStore[key].sourceMetadata).toEqual({ explicit: null });
    inMemoryAdminStore[key].createdAt = Timestamp.fromDate(new Date(iso));
    expect((await service.getSession('P', 's', context)).createdAt).toBe(iso);
    inMemoryAdminStore[key].updatedAt = 'corrupt';
    await expect(service.getSession('P', 's', context)).rejects.toHaveProperty('code', 'PERSISTENCE_BOUNDARY_INVALID');
    inMemoryAdminStore[key] = null;
    await expect(service.getSession('P', 's', context)).rejects.toHaveProperty('code', 'PERSISTENCE_BOUNDARY_INVALID');
  });
  it('keeps valid reservation behavior but rejects malformed persisted migration jobs', async () => {
    inMemoryAdminStore['projects/P'] = { projectId: 'P' };
    inMemoryAdminStore['workspace_migration_jobs/target'] = { ...migration(), status: 'BROKEN' };
    await expect(new WorkspaceStorageBoundary().jobs('P')).rejects.toHaveProperty('code', 'PERSISTENCE_BOUNDARY_INVALID');
  });
});


describe.each(['driver', 'truck'] as const)('Readiness %s assignment boundary', kind => {
  const read = () => {
    const context = new ProjectReadinessAdminReadContext();
    return kind === 'driver' ? context.getActiveDriverAssignment('P', 'd') : context.getActiveTruckAssignment('P', 't');
  };
  const seed = (patch: Record<string, unknown> = {}) => {
    inMemoryAdminStore[`projects/P/${kind}_active_assignments/${kind === 'driver' ? 'd' : 't'}`] = { assignmentId: 'a' };
    inMemoryAdminStore['projects/P/driver_truck_assignments/a'] = { assignmentId: 'a', projectId: 'P', status: 'ACTIVE', createdAt: Timestamp.fromDate(new Date(iso)), effectiveFrom: iso, effectiveTo: null, ...patch };
  };
  it('decodes valid ACTIVE assignment audit/interval representations', async () => {
    seed();
    expect(await read()).toMatchObject({ assignmentId: 'a', projectId: 'P', status: 'ACTIVE', createdAt: new Date(iso), effectiveFrom: iso, effectiveTo: null });
  });
  it.each([{ assignmentId: 'other' }, { projectId: 'other' }, { createdAt: 'corrupt' }])('rejects malformed returned assignment %j', async patch => {
    seed(patch);
    await expect(read()).rejects.toHaveProperty('code', 'PERSISTENCE_BOUNDARY_INVALID');
  });
  it('preserves null for missing slot or assignment', async () => {
    expect(await read()).toBeNull();
    seed();
    delete inMemoryAdminStore['projects/P/driver_truck_assignments/a'];
    expect(await read()).toBeNull();
  });
  it.each(['CLOSED', 'INVALID'])('preserves null for non-ACTIVE status %s', async status => {
    seed({ status });
    expect(await read()).toBeNull();
  });
});
