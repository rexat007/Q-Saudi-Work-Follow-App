import {assertFoundationMutation, type FoundationMutationClass} from './projectMutability.policy';
import {decodeProject} from '../utils/persistenceBoundary';
import { randomUUID } from 'node:crypto';
import { adminDb } from '../firebase/admin';
import { buildPrincipal } from '../utils/principal';
import { sanitizeUndefined } from '../utils/sanitize';
import { GLOBAL_IDENTITIES, decodeGlobalIdentity, GlobalIdentityError, normalizeNaturalKey, computeNaturalKeyToken, legacyNaturalKeyTokens, validGlobalId, type GlobalKind } from '../utils/globalIdentityPolicy';

export const decodeAuthoritativeGlobal = decodeGlobalIdentity;
export async function assertGlobalEntityExists(tx: any, db: any, kind: GlobalKind, id: string) {
  if (!validGlobalId(id)) throw new GlobalIdentityError('IDENTITY_LOOKUP_INTEGRITY_ERROR');
  const snap = await tx.get(db.collection(GLOBAL_IDENTITIES[kind].collection).doc(id));
  if (!snap.exists) throw new GlobalIdentityError('GLOBAL_ENTITY_NOT_FOUND', kind);
  return decodeAuthoritativeGlobal(kind, snap.data(), id);
}
/** Reads only: caller reserves canonicalRef in its existing write phase after all command reads. */
export async function resolveGlobalNaturalIdentity(tx: any, db: any, kind: GlobalKind, raw: string) {
  const spec = GLOBAL_IDENTITIES[kind], key = normalizeNaturalKey(kind, raw);
  const canonicalRef = db.collection('natural_identity_lookups').doc(computeNaturalKeyToken(kind, key));
  const tokens = [computeNaturalKeyToken(kind, key), ...legacyNaturalKeyTokens(kind, key)];
  const lookups = await Promise.all(tokens.map(token => tx.get(db.collection('natural_identity_lookups').doc(token))));
  let entity: Record<string, any> | null = null, id: string | null = null;
  for (const lookup of lookups) if (lookup.exists) {
    const data = lookup.data();
    if (data?.entityType !== kind || !validGlobalId(data?.systemId)) throw new GlobalIdentityError('IDENTITY_LOOKUP_INTEGRITY_ERROR', 'lookup type/target');
    let target: Record<string, any>;
    try { target = await assertGlobalEntityExists(tx, db, kind, data.systemId); }
    catch (error: any) { throw new GlobalIdentityError('IDENTITY_LOOKUP_INTEGRITY_ERROR', error.code); }
    if (normalizeNaturalKey(kind, target[spec.natural]) !== key || (id && id !== data.systemId)) throw new GlobalIdentityError('IDENTITY_LOOKUP_INTEGRITY_ERROR', 'natural key or legacy conflict');
    id = data.systemId; entity = target;
  }
  const matches = await tx.get(db.collection(spec.collection).where(spec.natural, '==', key));
  if (matches.docs.length > 1) throw new GlobalIdentityError('DUPLICATE_NATURAL_KEY', kind);
  if (matches.docs.length === 1) {
    const match = matches.docs[0];
    if (id && id !== match.id) throw new GlobalIdentityError('IDENTITY_LOOKUP_INTEGRITY_ERROR', 'query/lookup conflict');
    entity = decodeAuthoritativeGlobal(kind, match.data(), match.id); id = match.id;
    if (normalizeNaturalKey(kind, entity[spec.natural]) !== key) throw new GlobalIdentityError('IDENTITY_LOOKUP_INTEGRITY_ERROR');
  }
  return { id, entity, canonicalRef, mustReserve: !lookups[0].exists };
}
export async function authorizeGlobalCommand(tx: any, db: any, authenticated: { userId: string; email?: string }, projectId?: string, globalGovernance = false, mutationClass?:FoundationMutationClass) {
  if (!validGlobalId(authenticated?.userId) || (projectId !== undefined && !validGlobalId(projectId))) throw new GlobalIdentityError('FORBIDDEN_GLOBAL_COMMAND', '', 403);
  const account = await tx.get(db.collection('users').doc(authenticated.userId));
  const actor = buildPrincipal(account.exists ? account.data() : null, authenticated.userId, { email: authenticated.email });
  if (actor.role !== 'SUPER_ADMIN' && (globalGovernance || actor.role !== 'PROJECT_ADMIN' || !projectId || !actor.assignedProjectIds.includes(projectId))) throw new GlobalIdentityError('FORBIDDEN_GLOBAL_COMMAND', '', 403);
  if(projectId){const project=await tx.get(db.collection('projects').doc(projectId));if(!project.exists)throw new GlobalIdentityError('PROJECT_NOT_FOUND');if(mutationClass)assertFoundationMutation(decodeProject<any>(project.data(),projectId).status,mutationClass);}
  return actor;
}
export function auditGlobalMutation(tx: any, db: any, kind: GlobalKind, id: string, actor: ReturnType<typeof buildPrincipal>, before: any, after: any, projectId?: string) {
  const auditLogId = `AUD-GLOBAL-${randomUUID()}`, now = new Date();
  tx.set(db.collection('audit_logs').doc(auditLogId), sanitizeUndefined({ auditLogId, scope: 'GLOBAL', projectId, entityType: kind, entityId: id, action: before ? 'UPDATE' : 'CREATE', actor: { userId: actor.userId, email: actor.email, role: actor.role }, changes: { before, after }, naturalKey: after[GLOBAL_IDENTITIES[kind].natural], createdAt: now, updatedAt: now, createdBy: actor.userId, updatedBy: actor.userId }));
}
/** Internal governance capability. No new UI or generic profile-patch API. */
export class GlobalIdentityGovernanceService {
  constructor(private database?: any) { }
  async setStatus(kind: GlobalKind, id: string, status: string, authenticated: { userId: string; email?: string }) {
    if (!Object.hasOwn(GLOBAL_IDENTITIES, kind) || !(GLOBAL_IDENTITIES[kind].statuses as readonly string[]).includes(status)) throw new GlobalIdentityError('INVALID_GLOBAL_STATUS');
    const db = this.database || adminDb;
    return db.runTransaction(async (tx: any) => {
      const actor = await authorizeGlobalCommand(tx, db, authenticated, undefined, true);
      const before = await assertGlobalEntityExists(tx, db, kind, id);
      if (before.status === status) return before;
      const after = { ...before, status, updatedAt: new Date(), updatedBy: actor.userId };
      tx.update(db.collection(GLOBAL_IDENTITIES[kind].collection).doc(id), { status, updatedAt: after.updatedAt, updatedBy: actor.userId });
      auditGlobalMutation(tx, db, kind, id, actor, before, after);
      return after;
    });
  }
}
