import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { setTestDbOverride } from '../firebase/admin';
import { DriverTruckIntakeServer } from '../services/driverTruckIntake.server';
import { ProjectProvisioningAdminService } from '../services/projectProvisioning.server';
import { ProjectActivationService } from '../services/projectActivation.service';
import { ProjectReadinessAdminReadContext } from '../services/projectReadiness.server';
import { ProjectReadinessService } from '../services/projectReadiness.service';
import { GlobalIdentityGovernanceService, resolveGlobalNaturalIdentity } from '../services/globalIdentityAuthority.server';
import { GLOBAL_IDENTITIES, computeNaturalKeyToken, legacyNaturalKeyTokens, normalizeNaturalKey, evaluateGlobalEligibility, assertCanEnroll, assertCanReactivateMembership, assertOperationallyEligible, type GlobalKind } from '../utils/globalIdentityPolicy';
import { commandDatabase, accountProfile } from './helpers/commandDatabase';
const actor = { userId: 'actor', role: 'SUPER_ADMIN', email: 'actor@example.invalid' } as any;
const kinds = ['DRIVER', 'TRUCK', 'CARRIER', 'MATERIAL'] as const;
const keys = { DRIVER: '1234567890', TRUCK: 'ا ب ج 1234', CARRIER: '1010123456', MATERIAL: 'SUB_BASE' };
const ids = { DRIVER: 'D', TRUCK: 'T', CARRIER: 'C', MATERIAL: 'M' };
function initial() {
  const data: Record<string, any> = { 'users/actor': accountProfile(), 'projects/P1': { projectId: 'P1', nameAr: 'مشروع الاختبار', status: 'APPROVED' } };
  for (const kind of kinds) {
    const spec = GLOBAL_IDENTITIES[kind], id = ids[kind];
    data[`${spec.collection}/${id}`] = { [spec.id]: id, [spec.natural]: normalizeNaturalKey(kind, keys[kind]), status: 'ACTIVE', ...(kind === 'TRUCK' ? { plate: 'ا ب ج 1234' } : {}), ...(kind === 'MATERIAL' ? { unitOfMeasure: 'TON', nameAr: 'مادة اختبار' } : {}), ...(kind === 'CARRIER' ? { nameAr: 'ناقل اختبار' } : {}) };
    data[`projects/P1/${spec.kind}_memberships/${id}`] = { projectId: 'P1', [spec.id]: id, status: 'ACTIVE' };
  }
  for (const [kind, id] of [['driver', 'D'], ['truck', 'T']]) data[`projects/P1/${kind}_carrier_affiliations/${id}`] = { projectId: 'P1', [`${kind}Id`]: id, carrierId: 'C', status: 'ACTIVE' };
  const interval = { projectId: 'P1', status: 'ACTIVE', effectiveFrom: '2020-01-01T00:00:00.000Z', effectiveTo: null };
  data['projects/P1/driver_truck_assignments/ASN'] = { ...interval, assignmentId: 'ASN', driverId: 'D', truckId: 'T' };
  data['projects/P1/driver_active_assignments/D'] = { assignmentId: 'ASN' }; data['projects/P1/truck_active_assignments/T'] = { assignmentId: 'ASN' };
  data['projects/P1/truck_material_allocations/ALC'] = { ...interval, allocationId: 'ALC', truckId: 'T', materialId: 'M' };
  data['projects/P1/truck_active_material_allocations/T'] = { allocationId: 'ALC' };
  data['projects/P1/pricing_rules/PRICE'] = { projectId: 'P1', pricingRuleId: 'PRICE', carrierId: 'C', materialId: 'M', status: 'ACTIVE', effectiveFrom: '2020-01-01', effectiveTo: null };
  return data;
}
let x: ReturnType<typeof commandDatabase>;
const intake = new DriverTruckIntakeServer(), provisioning = new ProjectProvisioningAdminService();
const resolve = (kind: GlobalKind, key = keys[kind]) => x.db.runTransaction((tx: any) => resolveGlobalNaturalIdentity(tx, x.db, kind, key));
const enroll = (kind: GlobalKind, key = keys[kind]) => kind === 'DRIVER' ? intake.createStandaloneDriver({ projectId: 'P1', carrierId: 'C', driverName: 'سائق اختبار', residencyId: key }, actor) : kind === 'TRUCK' ? intake.createStandaloneTruck({ projectId: 'P1', carrierId: 'C', plateNumber: key }, actor) : kind === 'CARRIER' ? provisioning.setupProjectCarrier('P1', { name: 'ناقل اختبار', commercialRegistrationNo: key }, actor) : provisioning.setupProjectMaterial('P1', { name: 'مادة اختبار', code: key, unitOfMeasure: 'TON' }, actor);
const audits = () => Object.entries(x.store).filter(([p]) => p.startsWith('audit_logs/'));
beforeEach(() => { x = commandDatabase(initial()); setTestDbOverride(x.db); });
afterEach(() => vi.restoreAllMocks());
describe('P5-B1 natural identity authority', () => {
  it.each(kinds)('%s reuses normalized identity through current server path', async kind => {
    const first: any = await enroll(kind), second: any = await enroll(kind); const id = GLOBAL_IDENTITIES[kind].id;
    expect(first[id]).toBe(ids[kind]); expect(second[id]).toBe(ids[kind]);
    expect(Object.keys(x.store).filter(p => p.startsWith(GLOBAL_IDENTITIES[kind].collection + '/'))).toHaveLength(1);
  });
  it.each(kinds)('%s concurrent new-key creation allocates only once', async kind => {
    const spec = GLOBAL_IDENTITIES[kind]; delete x.store[`${spec.collection}/${ids[kind]}`];
    // Carrier is a prerequisite for Driver/Truck setup, not for Carrier creation itself.
    const values: any[] = await Promise.all([enroll(kind), enroll(kind), enroll(kind)]);
    expect(new Set(values.map(v => v[spec.id])).size).toBe(1); expect(Object.keys(x.store).filter(p => p.startsWith(spec.collection + '/'))).toHaveLength(1);
    const lookup = x.store['natural_identity_lookups/' + computeNaturalKeyToken(kind, keys[kind])]; expect(lookup.entityType).toBe(kind);
  });
  it.each(kinds)('%s verifies lookup type, target and natural identity', async kind => {
    const token = 'natural_identity_lookups/' + computeNaturalKeyToken(kind, keys[kind]);
    for (const record of [{ entityType: 'WRONG', systemId: ids[kind] }, { entityType: kind, systemId: '../bad' }, { entityType: kind, systemId: 'missing' }]) {
      x.store[token] = record; await expect(resolve(kind)).rejects.toHaveProperty('code', 'IDENTITY_LOOKUP_INTEGRITY_ERROR');
    }
    x.store[token] = { entityType: kind, systemId: ids[kind] }; x.store[GLOBAL_IDENTITIES[kind].collection + '/' + ids[kind]][GLOBAL_IDENTITIES[kind].natural] = kind === 'DRIVER' ? '2234567890' : kind === 'CARRIER' ? '2010123456' : kind === 'TRUCK' ? 'OTHER1234' : 'OTHER';
    await expect(resolve(kind)).rejects.toHaveProperty('code', 'IDENTITY_LOOKUP_INTEGRITY_ERROR');
  });
  it.each(kinds)('%s rejects multiple exact query results', async kind => {
    const spec = GLOBAL_IDENTITIES[kind]; x.store[`${spec.collection}/SECOND`] = { ...x.store[`${spec.collection}/${ids[kind]}`], [spec.id]: 'SECOND' };
    await expect(resolve(kind)).rejects.toHaveProperty('code', 'DUPLICATE_NATURAL_KEY');
  });
  it.each(kinds)('%s supports bounded legacy reads and rejects legacy/canonical conflict', async kind => {
    const canonical = 'natural_identity_lookups/' + computeNaturalKeyToken(kind, keys[kind]); const legacy = 'natural_identity_lookups/' + legacyNaturalKeyTokens(kind, keys[kind])[0];
    x.store[legacy] = { entityType: kind, systemId: ids[kind] }; expect((await resolve(kind)).id).toBe(ids[kind]);
    await enroll(kind); expect(x.store[canonical].systemId).toBe(ids[kind]);
    const spec = GLOBAL_IDENTITIES[kind]; x.store[`${spec.collection}/SECOND`] = { ...x.store[`${spec.collection}/${ids[kind]}`], [spec.id]: 'SECOND' }; x.store[canonical] = { entityType: kind, systemId: 'SECOND' };
    await expect(resolve(kind)).rejects.toHaveProperty('code', 'IDENTITY_LOOKUP_INTEGRITY_ERROR');
  });
  it('Unicode token is exactly UTF-8 hex and independent of Buffer/btoa availability', () => {
    const normalized = normalizeNaturalKey('TRUCK', keys.TRUCK); const expected = 'TRUCK_V2_' + Buffer.from(normalized, 'utf8').toString('hex');
    expect(computeNaturalKeyToken('TRUCK', keys.TRUCK)).toBe(expected);
    vi.stubGlobal('Buffer', undefined); vi.stubGlobal('btoa', undefined);
    try { expect(computeNaturalKeyToken('TRUCK', keys.TRUCK)).toBe(expected); expect(expected).toMatch(/^[A-Z0-9_]+[a-f0-9]+$/); } finally { vi.unstubAllGlobals(); }
  });
  it.each(kinds)('%s rejects malformed persisted target ID/status', async kind => {
    const spec = GLOBAL_IDENTITIES[kind]; x.store[`${spec.collection}/${ids[kind]}`][spec.id] = 'wrong'; await expect(resolve(kind)).rejects.toHaveProperty('code', 'PERSISTENCE_BOUNDARY_INVALID');
    x.store[`${spec.collection}/${ids[kind]}`][spec.id] = ids[kind]; x.store[`${spec.collection}/${ids[kind]}`].status = 'INVALID'; await expect(resolve(kind)).rejects.toHaveProperty('code', 'PERSISTENCE_BOUNDARY_INVALID');
  });
});
describe('P5-B1 eligibility and history', () => {
  for (const kind of kinds) for (const status of GLOBAL_IDENTITIES[kind].statuses) it(`${kind} ${status} policy`, async () => {
    const active = status === 'ACTIVE', entity = { status }; expect(evaluateGlobalEligibility(kind, entity)).toEqual({ CAN_ENROLL: active, CAN_REACTIVATE_MEMBERSHIP: active, CAN_USE_OPERATIONALLY: active, MEMBERSHIP_RECORD_MAY_REMAIN: true });
    for (const assertion of [assertCanEnroll, assertCanReactivateMembership, assertOperationallyEligible]) if (active) expect(() => assertion(kind, entity)).not.toThrow(); else expect(() => assertion(kind, entity)).toThrow('GLOBAL_ENTITY_INELIGIBLE');
    if (!active) {
const snapshot = structuredClone(x.store); x.store[`${GLOBAL_IDENTITIES[kind].collection}/${ids[kind]}`].status = status;
      const reads = new ProjectReadinessAdminReadContext(x.db), result = await new ProjectReadinessService().evaluateProjectReadiness('P1', new Date(), reads);
      expect(result.lifecycle.ready).toBe(true); expect(result.ready).toBe(false); expect(result.blockers.some(b => b.code.startsWith('GLOBAL_'))).toBe(true);
      await expect(new ProjectActivationService(x.db).activateProject('P1', actor)).rejects.toThrow();
      for (const [key, value] of Object.entries(snapshot)) if (key.startsWith('projects/')) expect(x.store[key]).toEqual(value);
    }
  });
  it.each(kinds)('%s ineligible entity cannot be reused/enrolled', async kind => {
    x.store[`${GLOBAL_IDENTITIES[kind].collection}/${ids[kind]}`].status = kind === 'TRUCK' ? 'MAINTENANCE' : 'INACTIVE'; await expect(enroll(kind)).rejects.toHaveProperty('code', 'GLOBAL_ENTITY_INELIGIBLE');
  });
});
describe('P5-B1 mutation authority and atomic audit', () => {
  it.each([{ role: 'VIEWER' }, { role: 'PROJECT_ADMIN', assignedProjectIds: [] }, { status: 'SUSPENDED' }, { isActive: false }])('current account overrides stale SUPER_ADMIN %j', async patch => {
    Object.assign(x.store['users/actor'], patch); await expect(enroll('MATERIAL', 'NEW')).rejects.toThrow(); expect(x.store['materials/M'].status).toBe('ACTIVE');
  });
  it('PROJECT_ADMIN may perform legal scoped creation but cannot rewrite shared profiles', async () => {
    x.store['users/actor'].role = 'PROJECT_ADMIN'; await enroll('MATERIAL', 'NEW');
    await expect(provisioning.updateProjectMaterial('P1', 'M', { name: 'اسم جديد' }, actor)).rejects.toHaveProperty('code', 'FORBIDDEN_GLOBAL_COMMAND');
    await expect(provisioning.updateProjectCarrier('P1', 'C', { name: 'اسم ناقل جديد' }, actor)).rejects.toHaveProperty('code', 'FORBIDDEN_GLOBAL_COMMAND');
  });
  it('SUPER_ADMIN profile update preserves natural key and audits atomically', async () => {
    const before = structuredClone(x.store['carriers/C']); await provisioning.updateProjectCarrier('P1', 'C', { name: 'ناقل محدث' }, actor);
    expect(x.store['carriers/C'].commercialRegistrationNo).toBe(before.commercialRegistrationNo); expect(audits().at(-1)![1]).toMatchObject({ scope: 'GLOBAL', actor: { userId: 'actor', role: 'SUPER_ADMIN' }, changes: { before, after: { nameAr: 'ناقل محدث' } } });
  });
  it.each([['MATERIAL', 'M', 'code', 'OTHER'], ['CARRIER', 'C', 'commercialRegistrationNo', '9999999999']] as const)('rejects ordinary natural-key mutation %s', async (kind, id, key, value) => {
    const update = kind === 'MATERIAL' ? provisioning.updateProjectMaterial('P1', id, { [key]: value }, actor) : provisioning.updateProjectCarrier('P1', id, { [key]: value }, actor); await expect(update).rejects.toThrow('IMMUTABLE');
  });
  it.each(kinds)('%s status mutation keeps all Project history intact', async kind => {
    const before = structuredClone(x.store), service = new GlobalIdentityGovernanceService(x.db); await service.setStatus(kind, ids[kind], kind === 'TRUCK' ? 'MAINTENANCE' : 'INACTIVE', actor);
    for (const [key, value] of Object.entries(before)) if (key.startsWith('projects/')) expect(x.store[key]).toEqual(value);
    expect(audits().at(-1)![1].actor.role).toBe('SUPER_ADMIN');
    x.store['users/actor'].role = 'PROJECT_ADMIN'; await expect(service.setStatus(kind, ids[kind], 'ACTIVE', actor)).rejects.toHaveProperty('code', 'FORBIDDEN_GLOBAL_COMMAND');
  });
  it.each(['audit_logs/', 'materials/'])('creation failure at %s leaves no identity/reservation/audit', async failed => {
    const before = structuredClone(x.store); x.failWrites(failed); await expect(enroll('MATERIAL', 'NEW')).rejects.toThrow(); expect(x.store).toEqual(before);
  });
  it('profile/status audit failure rolls back the mutation', async () => {
    const before = structuredClone(x.store); x.failWrites('audit_logs/'); await expect(provisioning.updateProjectCarrier('P1', 'C', { name: 'ناقل محدث' }, actor)).rejects.toThrow();
    await expect(new GlobalIdentityGovernanceService(x.db).setStatus('DRIVER', 'D', 'SUSPENDED', actor)).rejects.toThrow(); expect(x.store).toEqual(before);
  });
  it('denies global root writes while preserving temporal relationship rules', () => {
    const rules = readFileSync('firestore.rules', 'utf8'); for (const spec of Object.values(GLOBAL_IDENTITIES)) {
      const block = rules.slice(rules.indexOf(`\n    match /${spec.collection}/{${spec.id}} {`)).split('\n    }')[0]; expect(block).toContain('allow create, update: if false;'); expect(block).toContain('allow delete: if false;'); expect(block).toContain('allow get, list:');
    }
    const block = rules.slice(rules.indexOf('match /natural_identity_lookups/{token} {')).split('\n    }')[0]; expect(block).toContain('allow create, update, delete: if false;');
    for (const collection of ['driver_memberships', 'truck_memberships', 'carrier_memberships', 'material_memberships']) {
      const membership = rules.slice(rules.indexOf(`match /${collection}/`)).split('\n      }')[0];
      expect(membership).toContain('allow create, update, delete: if false;');
      expect(membership).toContain('allow get, list:');
    }
    const temporal = rules.slice(rules.indexOf('match /driver_truck_assignments/')).split('\n      }')[0];
    expect(temporal).toContain('allow create, update, delete: if false;');
    expect(temporal).toContain('allow get, list:');
  });
});

describe('P5-B1 existing operational consumers', () => {
  it.each(kinds)('%s eligibility is enforced by canonical context without changing membership history', async kind => {
    const memberships = await import('../repositories/projectMembership.repository');
    const globals = await import('../repositories/globalIdentity.repository');
    const affiliations = await import('../repositories/projectCarrierAffiliation.repository');
    const { projectFleetReadModelService } = await import('../services/projectFleetReadModel.service');
    const { CanonicalRelationshipContextService } = await import('../services/canonicalRelationshipContext.service');
    const originals: any[] = [];
    for (const current of kinds) {
      const spec = GLOBAL_IDENTITIES[current], title = spec.kind[0].toUpperCase() + spec.kind.slice(1);
      const membership = { projectId: 'P1', [spec.id]: ids[current], status: 'ACTIVE' };
      originals.push(membership);
      vi.spyOn((memberships as any)[`project${title}MembershipRepository`], 'listMemberships').mockResolvedValue([membership]);
      const global = { ...x.store[`${spec.collection}/${ids[current]}`] };
      if (current === kind) global.status = current === 'TRUCK' ? 'MAINTENANCE' : 'INACTIVE';
      vi.spyOn((globals as any)[`global${title}Repository`], current === 'CARRIER' || current === 'MATERIAL' ? 'listByIds' : 'findById').mockResolvedValue(current === 'CARRIER' || current === 'MATERIAL' ? [global] : global);
    }
    vi.spyOn(affiliations.projectDriverCarrierAffiliationRepository, 'getAffiliation').mockResolvedValue(x.store['projects/P1/driver_carrier_affiliations/D']);
    vi.spyOn(affiliations.projectTruckCarrierAffiliationRepository, 'getAffiliation').mockResolvedValue(x.store['projects/P1/truck_carrier_affiliations/T']);
    vi.spyOn(projectFleetReadModelService, 'getProjectFleetReadModel').mockResolvedValue({ rows: [{ truckId: 'T', driverId: 'D', materialId: 'M' }] } as any);
    const snapshot = structuredClone(originals);
    const context = await new CanonicalRelationshipContextService().getProjectRelationshipContext('P1');
    const property = `known${GLOBAL_IDENTITIES[kind].kind[0].toUpperCase() + GLOBAL_IDENTITIES[kind].kind.slice(1)}s`;
    expect((context as any)[property]).toEqual([]);
    if (kind === 'CARRIER') expect(context.authorizedCarrierIds).toEqual([]);
    if (kind === 'MATERIAL') expect(context.authorizedMaterialIds).toEqual([]);
    if (kind === 'DRIVER' || kind === 'TRUCK') expect(context.activeDriverByTruck).toEqual({});
    if (kind === 'MATERIAL' || kind === 'TRUCK') expect(context.activeMaterialByTruck).toEqual({});
    expect(originals).toEqual(snapshot);
  });
  it.each(kinds)('%s ineligibility blocks the existing Trip validator before operational writes', async kind => {
    const { TripService } = await import('../services/trip.service');
    const persistence: any = { projectRepository: { findById: async () => ({ status: 'ACTIVE' }) } };
    const history = structuredClone(x.store);
    for (const current of kinds) {
      const spec = GLOBAL_IDENTITIES[current], title = spec.kind[0].toUpperCase() + spec.kind.slice(1);
      persistence[`global${title}Repository`] = { findById: async () => ({ ...x.store[`${spec.collection}/${ids[current]}`], status: current === kind ? (current === 'TRUCK' ? 'MAINTENANCE' : 'INACTIVE') : 'ACTIVE' }) };
      persistence[`project${title}MembershipRepository`] = { getMembership: async () => ({ status: 'ACTIVE' }) };
    }
    persistence.projectDriverCarrierAffiliationRepository = persistence.projectTruckCarrierAffiliationRepository = { getAffiliation: async () => ({ status: 'ACTIVE', carrierId: 'C' }) };
    persistence.projectDriverTruckAssignmentRepository = { getActiveAssignmentByDriver: async () => ({ truckId: 'T' }), getActiveAssignmentByTruck: async () => ({ driverId: 'D' }) };
    persistence.projectTruckMaterialAllocationRepository = { getActiveAllocationByTruck: async () => ({ materialId: 'M' }) };
    await expect((new TripService(persistence) as any).validateCanonicalTripEntities('P1', 'C', 'T', 'D', 'M')).rejects.toThrow(/غير نشط|غير مصرح/);
    expect(x.store).toEqual(history);
  });
});
