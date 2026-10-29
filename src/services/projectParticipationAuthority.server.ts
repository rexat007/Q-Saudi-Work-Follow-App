import { randomUUID } from 'node:crypto';
import { adminDb } from '../firebase/admin';
import { decodePersistence, decodeScopedProjection, PersistenceBoundaryError } from '../utils/persistenceBoundary';
import { sanitizeUndefined } from '../utils/sanitize';
import { GLOBAL_IDENTITIES, GlobalIdentityError, validGlobalId, assertCanEnroll, assertCanReactivateMembership, assertOperationallyEligible, type GlobalKind } from '../utils/globalIdentityPolicy';
import { authorizeGlobalCommand, assertGlobalEntityExists } from './globalIdentityAuthority.server';

export type MembershipCommand = 'ENROLL' | 'SUSPEND' | 'REMOVE' | 'REACTIVATE';
export type AffiliationCommand = 'SET_AFFILIATION' | 'REACTIVATE_AFFILIATION' | 'REASSIGN' | 'INACTIVATE';
type Actor = Awaited<ReturnType<typeof authorizeGlobalCommand>>;
type Plan = { closedRelationships?:{kind:string;id:string}[]; kind: GlobalKind; projectId: string; entityId: string; category: 'MEMBERSHIP' | 'AFFILIATION'; command: string; before: any; after: any; changed: boolean; actor: Actor };
const membershipFields = ['projectId', 'status', 'statusChangedAt', 'statusReason', 'createdAt', 'createdBy', 'updatedAt', 'updatedBy'];
const affiliationFields = ['projectId', 'carrierId', 'status', 'statusChangedAt', 'createdAt', 'createdBy', 'updatedAt', 'updatedBy'];
const fail = (code: string): never => { throw new GlobalIdentityError(code); };
const canonicalFields = (record: any, fields: string[]) => Object.fromEntries(fields.filter(field => record[field] !== undefined).map(field => [field, record[field]]));
function scope(kind: GlobalKind, projectId: string, entityId: string) {
  if (!Object.hasOwn(GLOBAL_IDENTITIES, kind) || !validGlobalId(projectId) || !validGlobalId(entityId)) fail('INVALID_PARTICIPATION_COMMAND');
}
/** Validate the persisted representation; old optional audit stamps are not fabricated. */
export function decodeParticipation(raw: any, kind: GlobalKind, projectId: string, entityId: string, affiliation = false) {
  scope(kind, projectId, entityId);
  const id = GLOBAL_IDENTITIES[kind].id;
  const record = decodePersistence<Record<string, any>>(raw, {
    id: [id, entityId], projectId, required: ['status'],
    enums: { status: affiliation ? ['ACTIVE', 'INACTIVE'] : ['ACTIVE', 'SUSPENDED', 'REMOVED'] },
    times: { createdAt: 'date', updatedAt: 'date', statusChangedAt: 'date' },
  });
  for (const field of ['createdBy', 'updatedBy']) if (record[field] !== undefined && !validGlobalId(record[field])) throw new PersistenceBoundaryError(field);
  if (record.statusChangedAt === null) throw new PersistenceBoundaryError('statusChangedAt');
  if (record.statusReason !== undefined && typeof record.statusReason !== 'string') throw new PersistenceBoundaryError('statusReason');
  if (affiliation && !validGlobalId(record.carrierId)) throw new PersistenceBoundaryError('carrierId');
  return record;
}
export function planMembership(input: { kind: GlobalKind; projectId: string; entityId: string; before: any; global?: any; actor: Actor; command: MembershipCommand; reason?: string }): Plan {
  const { kind, projectId, entityId, global, actor, command, reason } = input;
  scope(kind, projectId, entityId);
  if (!['ENROLL', 'SUSPEND', 'REMOVE', 'REACTIVATE'].includes(command) || (reason !== undefined && (typeof reason !== 'string' || reason.length > 2000))) fail('INVALID_PARTICIPATION_COMMAND');
  const before = input.before == null ? null : decodeParticipation(input.before, kind, projectId, entityId);
  if (command === 'ENROLL') assertCanEnroll(kind, global);
  if (command === 'REACTIVATE') assertCanReactivateMembership(kind, global);
  const status = command === 'SUSPEND' ? 'SUSPENDED' : command === 'REMOVE' ? 'REMOVED' : 'ACTIVE';
  if (!before && command !== 'ENROLL') fail('MEMBERSHIP_NOT_FOUND');
  if (before && command === 'ENROLL' && before.status !== 'ACTIVE') fail('MEMBERSHIP_STATE_CONFLICT');
  if (before && before.status === status) return { ...input, category: 'MEMBERSHIP', before, after: before, changed: false };
  if (before && command === 'SUSPEND' && before.status !== 'ACTIVE') fail('INVALID_STATE_TRANSITION');
  const now = new Date(), idKey = GLOBAL_IDENTITIES[kind].id;
  const after = sanitizeUndefined({
    ...(before ? canonicalFields(input.before, [...membershipFields, idKey]) : { projectId, [idKey]: entityId, createdAt: now, createdBy: actor.userId }),
    status, statusChangedAt: now, updatedAt: now, updatedBy: actor.userId,
    ...(reason !== undefined ? { statusReason: reason } : {}),
  });
  decodeParticipation(after, kind, projectId, entityId);
  return { kind, projectId, entityId, category: 'MEMBERSHIP', command, before, after, changed: true, actor };
}
export function planAffiliation(input: { kind: 'DRIVER' | 'TRUCK'; projectId: string; entityId: string; carrierId: string; before: any; entityMembership: any; carrierMembership: any; global?: any; carrierGlobal?: any; command: AffiliationCommand; actor: Actor }): Plan {
  const { kind, projectId, entityId, carrierId, actor, command } = input;
  scope(kind, projectId, entityId);
  if (!['DRIVER', 'TRUCK'].includes(kind) || !validGlobalId(carrierId) || !['SET_AFFILIATION', 'REACTIVATE_AFFILIATION', 'REASSIGN', 'INACTIVATE'].includes(command)) fail('INVALID_PARTICIPATION_COMMAND');
  const before = input.before == null ? null : decodeParticipation(input.before, kind, projectId, entityId, true);
  if (command !== 'INACTIVATE') {
    assertOperationallyEligible(kind, input.global);
    assertOperationallyEligible('CARRIER', input.carrierGlobal);
    if (!input.entityMembership || decodeParticipation(input.entityMembership, kind, projectId, entityId).status !== 'ACTIVE') fail('ENTITY_MEMBERSHIP_NOT_ACTIVE');
    if (!input.carrierMembership || decodeParticipation(input.carrierMembership, 'CARRIER', projectId, carrierId).status !== 'ACTIVE') fail('CARRIER_NOT_ACTIVE_IN_PROJECT');
  }
  if (!before && command !== 'SET_AFFILIATION') fail('AFFILIATION_NOT_FOUND');
  if (before && command !== 'REASSIGN' && before.carrierId !== carrierId) fail(`${kind}_CARRIER_AFFILIATION_CONFLICT`);
  if (before && (command === 'SET_AFFILIATION' || (command === 'REASSIGN' && before.carrierId === carrierId)) && before.status !== 'ACTIVE') fail('AFFILIATION_STATE_CONFLICT');
  const status = command === 'INACTIVATE' ? 'INACTIVE' : 'ACTIVE';
  if (before && before.carrierId === carrierId && before.status === status) return { ...input, category: 'AFFILIATION', before, after: before, changed: false };
  const now = new Date(), idKey = GLOBAL_IDENTITIES[kind].id;
  const after = {
    ...(before ? canonicalFields(input.before, [...affiliationFields, idKey]) : { projectId, [idKey]: entityId, createdAt: now, createdBy: actor.userId }),
    carrierId, status, statusChangedAt: now, updatedAt: now, updatedBy: actor.userId,
  };
  decodeParticipation(after, kind, projectId, entityId, true);
  return { kind, projectId, entityId, category: 'AFFILIATION', command, before, after, changed: true, actor };
}
/** Read-only dependency guard. B2 never closes or rewrites temporal relationships/slots. */
export async function protectAffiliationAssignment(tx: any, db: any, plan: Plan) {
  if (!plan.changed) return;
  const { kind, projectId, entityId, after } = plan;
  const spec = GLOBAL_IDENTITIES[kind], base = db.collection('projects').doc(projectId);
  const slot = await tx.get(base.collection(`${spec.kind}_active_assignments`).doc(entityId));
  const matches = await tx.get(base.collection('driver_truck_assignments').where(spec.id, '==', entityId));
  const assignments = new Map<string, any>();
  for (const doc of matches.docs) {
    if (doc.data()?.status === 'ACTIVE') assignments.set(doc.id, decodeScopedProjection<any>(doc.data(), 'assignmentId', doc.id, projectId, ['ACTIVE', 'CLOSED']));
  }
  if (slot.exists) {
    const pointer = slot.data();
    if (!validGlobalId(pointer?.assignmentId) || (pointer.projectId !== undefined && pointer.projectId !== projectId)) fail('P5_B3_RELATIONSHIP_DEPENDENCY');
    const doc = await tx.get(base.collection('driver_truck_assignments').doc(pointer.assignmentId));
    if (!doc.exists) fail('P5_B3_RELATIONSHIP_DEPENDENCY');
    const assignment = decodeScopedProjection<any>(doc.data(), 'assignmentId', doc.id, projectId, ['ACTIVE', 'CLOSED']);
    if (assignment.status !== 'ACTIVE' || assignment[spec.id] !== entityId) fail('P5_B3_RELATIONSHIP_DEPENDENCY');
    assignments.set(doc.id, assignment);
  }
  if (assignments.size > 1) fail('P5_B3_RELATIONSHIP_DEPENDENCY');
  for (const assignment of assignments.values()) {
    if (assignment[spec.id] !== entityId || after.status !== 'ACTIVE') fail('P5_B3_RELATIONSHIP_DEPENDENCY');
    const counterpartKind = kind === 'DRIVER' ? 'TRUCK' : 'DRIVER', counterpartSpec = GLOBAL_IDENTITIES[counterpartKind];
    const counterpartId = assignment[counterpartSpec.id];
    if (!validGlobalId(counterpartId)) fail('P5_B3_RELATIONSHIP_DEPENDENCY');
    const counterpart = await tx.get(base.collection(`${counterpartSpec.kind}_carrier_affiliations`).doc(counterpartId));
    if (!counterpart.exists) fail('P5_B3_RELATIONSHIP_DEPENDENCY');
    const record = decodeParticipation(counterpart.data(), counterpartKind, projectId, counterpartId, true);
    if (record.status !== 'ACTIVE' || record.carrierId !== after.carrierId) fail('P5_B3_RELATIONSHIP_DEPENDENCY');
  }
}
export function writeParticipationPlan(tx: any, db: any, plan: Plan) {
  if (!plan.changed) return;
  const { kind, projectId, entityId, category, before, after, actor, command } = plan;
  const spec = GLOBAL_IDENTITIES[kind], collection = `${spec.kind}_${category === 'MEMBERSHIP' ? 'memberships' : 'carrier_affiliations'}`;
  tx.set(db.collection('projects').doc(projectId).collection(collection).doc(entityId), after);
  const auditLogId = `AUD-PARTICIPATION-${randomUUID()}`, now = new Date();
  tx.set(db.collection('audit_logs').doc(auditLogId), sanitizeUndefined({
    auditLogId, projectId, entityType: kind, entityId, action: before ? 'UPDATE' : 'CREATE', command,
    actor: { userId: actor.userId, email: actor.email, role: actor.role },
    changes: { before, after, closedRelationships:plan.closedRelationships, previousStatus: before?.status ?? null, newStatus: after.status, previousCarrierId: before?.carrierId, newCarrierId: after.carrierId, reason: after.statusReason },
    createdAt: now, updatedAt: now, createdBy: actor.userId, updatedBy: actor.userId,
  }));
}
/** The public command boundary accepts identifiers, command and optional reason only. */
export class ProjectParticipationAuthority {
  constructor(private database?: any) { }
  async membership(projectId: string, input: { kind: GlobalKind; entityId: string; command: MembershipCommand; reason?: string }, authenticated: { userId: string; email?: string }) {
    if (!input || Object.keys(input).some(k => !['kind', 'entityId', 'command', 'reason'].includes(k))) fail('INVALID_PARTICIPATION_COMMAND');
    scope(input.kind, projectId, input.entityId);
    const db = this.database || adminDb;
    return db.runTransaction(async (tx: any) => {
      const actor = await authorizeGlobalCommand(tx, db, authenticated, projectId, false, ['SUSPEND','REMOVE'].includes(input.command)?'CONSISTENCY_CLEANUP':'NEW_OPERATION');
      const spec = GLOBAL_IDENTITIES[input.kind];
      const snap = await tx.get(db.collection('projects').doc(projectId).collection(`${spec.kind}_memberships`).doc(input.entityId));
      const global = input.command === 'ENROLL' || input.command === 'REACTIVATE' ? await assertGlobalEntityExists(tx, db, input.kind, input.entityId) : undefined;
      const plan = planMembership({ ...input, projectId, before: snap.exists ? snap.data() : null, global, actor });
      const {planMembershipConsequences,writeMembershipConsequences}=await import('./membershipConsequences.server');
      const consequences=['SUSPEND','REMOVE'].includes(input.command) ? await planMembershipConsequences(tx,db,projectId,input.kind,input.entityId,actor,input.command,input.reason):{plans:[],at:new Date()};
      plan.closedRelationships=consequences.plans.map(v=>({kind:v.kind,id:v.record[v.kind==='ASSIGNMENT'?'assignmentId':'allocationId']}));
      await writeMembershipConsequences(tx,db,projectId,consequences,input.kind,plan.changed);
      writeParticipationPlan(tx, db, plan);
      return { membership: plan.after, idempotent: !plan.changed&&!consequences.plans.length, closedRelationships:plan.closedRelationships };
    });
  }
  async affiliation(projectId: string, input: { kind: 'DRIVER' | 'TRUCK'; entityId: string; carrierId: string; command: AffiliationCommand }, authenticated: { userId: string; email?: string }) {
    if (!input || Object.keys(input).some(k => !['kind', 'entityId', 'carrierId', 'command'].includes(k))) fail('INVALID_PARTICIPATION_COMMAND');
    scope(input.kind, projectId, input.entityId);
    if (!['DRIVER', 'TRUCK'].includes(input.kind) || !validGlobalId(input.carrierId)) fail('INVALID_PARTICIPATION_COMMAND');
    const db = this.database || adminDb;
    return db.runTransaction(async (tx: any) => {
      const actor = await authorizeGlobalCommand(tx, db, authenticated, projectId, false, input.command==='INACTIVATE'?'CONSISTENCY_CLEANUP':'NEW_OPERATION');
      const base = db.collection('projects').doc(projectId), spec = GLOBAL_IDENTITIES[input.kind];
      const snap = await tx.get(base.collection(`${spec.kind}_carrier_affiliations`).doc(input.entityId));
      let global: any, carrierGlobal: any, entityMembership: any, carrierMembership: any;
      if (input.command !== 'INACTIVATE') {
        global = await assertGlobalEntityExists(tx, db, input.kind, input.entityId);
        carrierGlobal = await assertGlobalEntityExists(tx, db, 'CARRIER', input.carrierId);
        const entity = await tx.get(base.collection(`${spec.kind}_memberships`).doc(input.entityId));
        const carrier = await tx.get(base.collection('carrier_memberships').doc(input.carrierId));
        entityMembership = entity.exists ? entity.data() : null; carrierMembership = carrier.exists ? carrier.data() : null;
      }
      const plan = planAffiliation({ ...input, projectId, before: snap.exists ? snap.data() : null, global, carrierGlobal, entityMembership, carrierMembership, actor });
      await protectAffiliationAssignment(tx, db, plan);
      writeParticipationPlan(tx, db, plan);
      return { affiliation: plan.after, idempotent: !plan.changed };
    });
  }
}
