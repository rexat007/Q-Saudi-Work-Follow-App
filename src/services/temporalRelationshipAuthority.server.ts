import { randomUUID } from 'node:crypto';
import { adminDb } from '../firebase/admin';
import { authorizeGlobalCommand, assertGlobalEntityExists } from './globalIdentityAuthority.server';
import { decodeParticipation } from './projectParticipationAuthority.server';
import { assertOperationallyEligible, validGlobalId, GlobalIdentityError } from '../utils/globalIdentityPolicy';
import { TEMPORAL, decodeTemporal, isCurrentTemporal, assignmentSlotsAgree, type TemporalKind } from '../utils/temporalRelationshipPolicy';
import { markDirtyInTransaction } from './projectWorkspaceProjectionState.server';
import { sanitizeUndefined } from '../utils/sanitize';
type Actor = Awaited<ReturnType<typeof authorizeGlobalCommand>>;
export type TemporalPlan = { kind: TemporalKind; projectId: string; command: string; actor: Actor; before: any[]; record: any; changed: boolean; reason?: string };
const integrity = (kind: TemporalKind): never => { throw new GlobalIdentityError(kind === 'ASSIGNMENT' ? 'ASSIGNMENT_POINTER_INTEGRITY_ERROR' : 'ALLOCATION_POINTER_CORRUPTION'); };
const fail = (code: string): never => { throw new GlobalIdentityError(code); };
const base = (db: any, p: string) => db.collection('projects').doc(p);
function slotValue(snapshot: any, projectId: string, ownerField: string, ownerId: string, key: string, kind: TemporalKind) {
  if (!snapshot.exists) return null;
  const data = snapshot.data();
  if (!validGlobalId(data?.[key]) || (data.projectId !== undefined && data.projectId !== projectId) || (data[ownerField] !== undefined && data[ownerField] !== ownerId)) integrity(kind);
  return data;
}
function checkedTemporal(kind: TemporalKind, raw: unknown, id: string, p: string) {
  try { return decodeTemporal(kind, raw, id, p); } catch { return integrity(kind); }
}
async function activeHistory(tx: any, db: any, p: string, kind: TemporalKind, field: string, id: string, at: Date) {
  const spec = TEMPORAL[kind], snap = await tx.get(base(db, p).collection(spec.collection).where(field, '==', id));
  const result = snap.docs.filter((d: any) => d.data()?.status === 'ACTIVE').map((d: any) => checkedTemporal(kind, d.data(), d.id, p));
  if (result.length > 1 || result.some((r: any) => !isCurrentTemporal(r, at))) integrity(kind);
  return result;
}
/** Validate slots AND history, including the displaced counterpart. Never repair in a normal command. */
export async function readCurrentAssignment(tx: any, db: any, p: string, field: 'driverId' | 'truckId', id: string, at: Date) {
  const root = base(db, p), collection = field === 'driverId' ? 'driver_active_assignments' : 'truck_active_assignments';
  const slot = slotValue(await tx.get(root.collection(collection).doc(id)), p, field, id, 'assignmentId', 'ASSIGNMENT');
  const history = await activeHistory(tx, db, p, 'ASSIGNMENT', field, id, at);
  if (!slot) { if (history.length) integrity('ASSIGNMENT'); return null; }
  const snap = await tx.get(root.collection('driver_truck_assignments').doc(slot.assignmentId));
  if (!snap.exists) integrity('ASSIGNMENT');
  const record = checkedTemporal('ASSIGNMENT', snap.data(), slot.assignmentId, p);
  if (record[field] !== id || !isCurrentTemporal(record, at) || history.length !== 1 || history[0].assignmentId !== record.assignmentId) integrity('ASSIGNMENT');
  const driverSlot = slotValue(await tx.get(root.collection('driver_active_assignments').doc(record.driverId)), p, 'driverId', record.driverId, 'assignmentId', 'ASSIGNMENT');
  const truckSlot = slotValue(await tx.get(root.collection('truck_active_assignments').doc(record.truckId)), p, 'truckId', record.truckId, 'assignmentId', 'ASSIGNMENT');
  if (!assignmentSlotsAgree(record, driverSlot, truckSlot)) integrity('ASSIGNMENT');
  const otherField = field === 'driverId' ? 'truckId' : 'driverId';
  const other = await activeHistory(tx, db, p, 'ASSIGNMENT', otherField, record[otherField], at);
  if (other.length !== 1 || other[0].assignmentId !== record.assignmentId) integrity('ASSIGNMENT');
  return record;
}
export async function readCurrentAllocation(tx: any, db: any, p: string, truckId: string, at: Date) {
  const root = base(db, p), slot = slotValue(await tx.get(root.collection('truck_active_material_allocations').doc(truckId)), p, 'truckId', truckId, 'allocationId', 'ALLOCATION');
  const history = await activeHistory(tx, db, p, 'ALLOCATION', 'truckId', truckId, at);
  if (!slot) { if (history.length) integrity('ALLOCATION'); return null; }
  const snap = await tx.get(root.collection('truck_material_allocations').doc(slot.allocationId));
  if (!snap.exists) integrity('ALLOCATION');
  const record = checkedTemporal('ALLOCATION', snap.data(), slot.allocationId, p);
  if (record.truckId !== truckId || !isCurrentTemporal(record, at) || history.length !== 1 || history[0].allocationId !== record.allocationId) integrity('ALLOCATION');
  return record;
}
export function assertAssignmentParticipation(p: string, driverId: string, truckId: string, context: any) {
  for (const [kind, id, global, membership, affiliation] of [['DRIVER', driverId, context.driverGlobal, context.driverMembership, context.driverAffiliation], ['TRUCK', truckId, context.truckGlobal, context.truckMembership, context.truckAffiliation]] as const) {
    assertOperationallyEligible(kind, global);
    if (!membership || decodeParticipation(membership, kind, p, id).status !== 'ACTIVE' || !affiliation || decodeParticipation(affiliation, kind, p, id, true).status !== 'ACTIVE') fail('TEMPORAL_PARTICIPATION_INACTIVE');
  }
  if (context.driverAffiliation.carrierId !== context.truckAffiliation.carrierId) fail('CARRIER_MISMATCH');
  const carrierId = context.truckAffiliation.carrierId;
  assertOperationallyEligible('CARRIER', context.carrierGlobal);
  if (!context.carrierMembership || decodeParticipation(context.carrierMembership, 'CARRIER', p, carrierId).status !== 'ACTIVE') fail('TEMPORAL_PARTICIPATION_INACTIVE');
}
export function assertAllocationParticipation(p: string, truckId: string, materialId: string, context: any) {
  assertOperationallyEligible('TRUCK', context.truckGlobal); assertOperationallyEligible('MATERIAL', context.materialGlobal);
  if (!context.truckMembership || decodeParticipation(context.truckMembership, 'TRUCK', p, truckId).status !== 'ACTIVE' || !context.materialMembership || decodeParticipation(context.materialMembership, 'MATERIAL', p, materialId).status !== 'ACTIVE' || !context.truckAffiliation || decodeParticipation(context.truckAffiliation, 'TRUCK', p, truckId, true).status !== 'ACTIVE') fail('TEMPORAL_PARTICIPATION_INACTIVE');
}
export async function planAssignment(tx: any, db: any, p: string, driverId: string, truckId: string, command: 'ASSIGN' | 'REASSIGN', actor: Actor, at: Date, context: any, reason?: string): Promise<TemporalPlan> {
  assertAssignmentParticipation(p, driverId, truckId, context);
  const d = await readCurrentAssignment(tx, db, p, 'driverId', driverId, at), t = await readCurrentAssignment(tx, db, p, 'truckId', truckId, at);
  const before = [...new Map([d, t].filter(Boolean).map(r => [r.assignmentId, r])).values()];
  if (d && t && d.assignmentId === t.assignmentId) return { kind: 'ASSIGNMENT', projectId: p, command, actor, before, record: d, changed: false, reason };
  if (command === 'ASSIGN' && before.length) fail('ASSIGNMENT_STATE_CONFLICT');
  // Established counterpart-release semantics: foundation test 26 and shared intake close both displaced pairs.
  const now = at.toISOString(), record = { assignmentId: `ASN-${randomUUID().replace(/-/g, '')}`, projectId: p, driverId, truckId, status: 'ACTIVE', effectiveFrom: now, effectiveTo: null, createdAt: now, createdBy: actor.userId, updatedAt: now, updatedBy: actor.userId };
  return { kind: 'ASSIGNMENT', projectId: p, command, actor, before, record, changed: true, reason };
}
export async function planAllocation(tx: any, db: any, p: string, truckId: string, materialId: string, command: 'ALLOCATE' | 'REALLOCATE', actor: Actor, at: Date, context: any, reason?: string): Promise<TemporalPlan> {
  assertAllocationParticipation(p, truckId, materialId, context);
  const old = await readCurrentAllocation(tx, db, p, truckId, at), before = old ? [old] : [];
  if (old?.materialId === materialId) return { kind: 'ALLOCATION', projectId: p, command, actor, before, record: old, changed: false, reason };
  if (command === 'ALLOCATE' && old) fail('ALLOCATION_STATE_CONFLICT');
  const now = at.toISOString(), record = { allocationId: `TMA-${randomUUID().replace(/-/g, '')}`, projectId: p, truckId, materialId, status: 'ACTIVE', effectiveFrom: now, effectiveTo: null, createdAt: now, createdBy: actor.userId, updatedAt: now, updatedBy: actor.userId };
  return { kind: 'ALLOCATION', projectId: p, command, actor, before, record, changed: true, reason };
}
export function writeTemporalPlan(tx: any, db: any, plan: TemporalPlan, at: Date) {
  if (!plan.changed) return;
  const { kind, projectId, actor, before, record, command, reason } = plan, spec = TEMPORAL[kind], root = base(db, projectId), now = at.toISOString();
  for (const old of before) {
    tx.update(root.collection(spec.collection).doc(old[spec.id]), { status: 'CLOSED', effectiveTo: now, updatedAt: now, updatedBy: actor.userId });
    if (kind === 'ASSIGNMENT') { tx.delete(root.collection('driver_active_assignments').doc(old.driverId)); tx.delete(root.collection('truck_active_assignments').doc(old.truckId)); }
    else tx.delete(root.collection('truck_active_material_allocations').doc(old.truckId));
  }
  if (command !== 'CLOSE') {
    tx.set(root.collection(spec.collection).doc(record[spec.id]), record);
    if (kind === 'ASSIGNMENT') { tx.set(root.collection('driver_active_assignments').doc(record.driverId), { assignmentId: record.assignmentId }); tx.set(root.collection('truck_active_assignments').doc(record.truckId), { assignmentId: record.assignmentId }); }
    else tx.set(root.collection('truck_active_material_allocations').doc(record.truckId), { allocationId: record.allocationId });
  }
  const auditLogId = `AUD-TEMPORAL-${randomUUID()}`;
  tx.set(db.collection('audit_logs').doc(auditLogId), sanitizeUndefined({ auditLogId, projectId, entityType: 'TRUCK', entityId: record.truckId, command, action: before.length ? 'UPDATE' : 'CREATE', actor: { userId: actor.userId, role: actor.role, email: actor.email }, changes: { before, after: record, oldAssignmentIds: kind === 'ASSIGNMENT' ? before.map(r => r.assignmentId) : undefined, newAssignmentId: kind === 'ASSIGNMENT' && command !== 'CLOSE' ? record.assignmentId : undefined, driverId: record.driverId, oldTruckIds: kind === 'ASSIGNMENT' ? before.map(r => r.truckId) : undefined, newTruckId: record.truckId, oldAllocationId: kind === 'ALLOCATION' ? before[0]?.allocationId : undefined, newAllocationId: kind === 'ALLOCATION' && command !== 'CLOSE' ? record.allocationId : undefined, oldMaterialId: kind === 'ALLOCATION' ? before[0]?.materialId : undefined, newMaterialId: record.materialId, reason }, createdAt: now, updatedAt: now, createdBy: actor.userId, updatedBy: actor.userId }));
}
async function participation(tx: any, db: any, p: string, driverId: string | undefined, truckId: string, materialId?: string) {
  const root = base(db, p), read = async (collection: string, id: string) => { const s = await tx.get(root.collection(collection).doc(id)); return s.exists ? s.data() : null; };
  const truckGlobal = await assertGlobalEntityExists(tx, db, 'TRUCK', truckId), truckMembership = await read('truck_memberships', truckId), truckAffiliation = await read('truck_carrier_affiliations', truckId);
  const result: any = { truckGlobal, truckMembership, truckAffiliation };
  if (driverId) {
    result.driverGlobal = await assertGlobalEntityExists(tx, db, 'DRIVER', driverId); result.driverMembership = await read('driver_memberships', driverId); result.driverAffiliation = await read('driver_carrier_affiliations', driverId);
    const carrierId = truckAffiliation?.carrierId; if (!validGlobalId(carrierId)) fail('TEMPORAL_PARTICIPATION_INACTIVE');
    result.carrierGlobal = await assertGlobalEntityExists(tx, db, 'CARRIER', carrierId); result.carrierMembership = await read('carrier_memberships', carrierId);
  }
  if (materialId) { result.materialGlobal = await assertGlobalEntityExists(tx, db, 'MATERIAL', materialId); result.materialMembership = await read('material_memberships', materialId); }
  return result;
}
/** Explicit temporal commands only. Global/member suspension never cascades here;
 * CLOSE remains available for authorized cleanup after eligibility is lost.
 * Phase 6 orchestrates workflows; Phase 10 owns historical trip-time reconstruction. */
export class TemporalRelationshipAuthority {
  constructor(private database?: any, private clock: () => Date = () => new Date()) { }
  async execute(kind: TemporalKind, p: string, input: any, authenticated: { userId: string; email?: string }) {
    const spec = TEMPORAL[kind];
    if (!spec || !input || !validGlobalId(p) || Object.keys(input).some(k => !['command', ...spec.fields, spec.id, 'reason'].includes(k as any)) || (input.reason !== undefined && (typeof input.reason !== 'string' || input.reason.length > 2000)) || ![kind === 'ASSIGNMENT' ? 'ASSIGN' : 'ALLOCATE', kind === 'ASSIGNMENT' ? 'REASSIGN' : 'REALLOCATE', 'CLOSE'].includes(input.command)) fail('INVALID_TEMPORAL_COMMAND');
    if (input.command === 'CLOSE' ? !validGlobalId(input[spec.id]) || spec.fields.some(f => input[f] !== undefined) : spec.fields.some(f => !validGlobalId(input[f])) || input[spec.id] !== undefined) fail('INVALID_TEMPORAL_COMMAND');
    const db = this.database || adminDb;
    return db.runTransaction(async (tx: any) => {
      const actor = await authorizeGlobalCommand(tx, db, authenticated, p); let plan: TemporalPlan;
      if (input.command === 'CLOSE') {
        const snap = await tx.get(base(db, p).collection(spec.collection).doc(input[spec.id])); if (!snap.exists) fail('TEMPORAL_RELATIONSHIP_NOT_FOUND');
        const record = decodeTemporal(kind, snap.data(), input[spec.id], p), at = this.clock();
        const current = kind === 'ASSIGNMENT' ? await readCurrentAssignment(tx, db, p, 'driverId', record.driverId, at) : await readCurrentAllocation(tx, db, p, record.truckId, at);
        if (kind === 'ASSIGNMENT') await readCurrentAssignment(tx, db, p, 'truckId', record.truckId, at);
        if (record.status === 'ACTIVE' && current?.[spec.id] !== record[spec.id]) integrity(kind);
        plan = { kind, projectId: p, command: 'CLOSE', actor, before: [record], record: record.status === 'CLOSED' ? record : { ...record, status: 'CLOSED', effectiveTo: at.toISOString(), updatedAt: at.toISOString(), updatedBy: actor.userId }, changed: record.status !== 'CLOSED', reason: input.reason };
        if (plan.changed) { await markDirtyInTransaction(tx, p, ['FLEET_ROSTER'], 'TEMPORAL_CLOSE', at.toISOString(), db); writeTemporalPlan(tx, db, plan, at); }
      } else {
        const context = await participation(tx, db, p, kind === 'ASSIGNMENT' ? input.driverId : undefined, input.truckId, input.materialId), at = this.clock();
        plan = kind === 'ASSIGNMENT' ? await planAssignment(tx, db, p, input.driverId, input.truckId, input.command, actor, at, context, input.reason) : await planAllocation(tx, db, p, input.truckId, input.materialId, input.command, actor, at, context, input.reason);
        if (plan.changed) { await markDirtyInTransaction(tx, p, ['FLEET_ROSTER'], 'TEMPORAL_' + input.command, at.toISOString(), db); writeTemporalPlan(tx, db, plan, at); }
      }
      return { relationship: plan.record, idempotent: !plan.changed, closedIds: plan.changed ? plan.before.map(r => r[spec.id]) : [] };
    });
  }
}
