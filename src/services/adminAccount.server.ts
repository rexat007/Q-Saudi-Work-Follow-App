import {assertFoundationMutation} from './projectMutability.policy';
import {decodeProject} from '../utils/persistenceBoundary';
import { decodeGlobal } from '../utils/persistenceBoundary';
import { FieldValue } from 'firebase-admin/firestore';
import { randomUUID } from 'node:crypto';
import { adminDb } from '../firebase/admin';
import { buildPrincipal, validateAccountProfile, PRINCIPAL_ROLES } from '../utils/principal';
import type { AuthUserContext, UserRole } from '../types/common';
import { sanitizeUndefined } from '../utils/sanitize';

export class AdminCommandError extends Error {
  constructor(public code: string) { super(code); }
}
const deny = (code: string): never => { throw new AdminCommandError(code); };
const validId = (value: unknown): value is string => typeof value === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(value);
const role = (value: unknown): UserRole => PRINCIPAL_ROLES.includes(value as UserRole) ? value as UserRole : deny('INVALID_ADMIN_COMMAND');
const projects = (value: unknown): string[] => {
  if (!Array.isArray(value) || !value.every(validId) || new Set(value).size !== value.length) return deny('INVALID_ADMIN_COMMAND');
  return value;
};
const inputs: Record<string, string[]> = {
  approveAccount: ['approvedRole', 'assignedProjectIds'], rejectAccount: ['rejectionReason'],
  suspendAccount: [], reactivateAccount: [], changeUserRole: ['newRole'], replaceAssignedProjects: ['assignedProjectIds'], linkDriverIdentity: ['linkedDriverId'], unlinkDriverIdentity: [],
};
function parse(raw: unknown): Record<string, any> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return deny('INVALID_ADMIN_COMMAND');
  const input = raw as Record<string, any>;
  if (!Object.hasOwn(inputs, input.command) || Object.keys(input).some(key => key !== 'command' && !inputs[input.command].includes(key)) || inputs[input.command].some(key => !Object.hasOwn(input, key))) return deny('INVALID_ADMIN_COMMAND');
  if (input.command === 'approveAccount') { role(input.approvedRole); projects(input.assignedProjectIds); }
  if (input.command === 'linkDriverIdentity' && !validId(input.linkedDriverId)) return deny('INVALID_ADMIN_COMMAND');
  if (input.command === 'changeUserRole') role(input.newRole);
  if (input.command === 'replaceAssignedProjects') projects(input.assignedProjectIds);
  if (input.command === 'rejectAccount' && (typeof input.rejectionReason !== 'string' || !input.rejectionReason.trim() || input.rejectionReason.length > 2000)) return deny('INVALID_ADMIN_COMMAND');
  return input;
}
const administrativeValues = (data: Record<string, any>) => sanitizeUndefined({ linkedDriverId: data.linkedDriverId, role: data.role, status: data.status, isActive: data.isActive, assignedProjectIds: data.assignedProjectIds, requestedRole: data.requestedRole, approvedBy: data.approvedBy, approvedAt: data.approvedAt, rejectedBy: data.rejectedBy, rejectedAt: data.rejectedAt, rejectionReason: data.rejectionReason });

export class AdminAccountServerService {
  constructor(private db: any = adminDb) {}
  async listDriverIdentities(principal: AuthUserContext) {
    const snap = await this.db.collection('users').doc(principal.userId).get();
    const actor = buildPrincipal(snap.exists ? snap.data() : null, principal.userId, { email: principal.email });
    if (actor.role !== 'SUPER_ADMIN') return deny('FORBIDDEN_ADMIN_ACTION');
    const drivers = await this.db.collection('drivers').get();
    return drivers.docs.map((doc: any) => {
      const data = decodeGlobal<any>(doc.data(), 'driver', doc.id);
      if (data.driverId !== doc.id) return deny('INVALID_ADMIN_COMMAND');
      return { driverId: doc.id, fullNameAr: data.fullNameAr || doc.id, status: data.status };
    });
  }
  async execute(targetUserId: string, raw: unknown, principal: AuthUserContext) {
    if (!principal || principal.role !== 'SUPER_ADMIN' || !validId(principal.userId)) return deny('FORBIDDEN_ADMIN_ACTION');
    if (!validId(targetUserId)) return deny('INVALID_ADMIN_COMMAND');
    const input = parse(raw);
    const auditLogId = `AUD-ADMIN-${randomUUID()}`;
    return this.db.runTransaction(async (tx: any) => {
      // A shared transaction fence serializes destructive decisions, including query phantoms.
      const fence = this.db.collection('system_state').doc('admin_governance');
      const actorRef = this.db.collection('users').doc(principal.userId);
      const targetRef = this.db.collection('users').doc(targetUserId);
      const fenceSnap = await tx.get(fence);
      const actorSnap = await tx.get(actorRef);
      let actor: ReturnType<typeof buildPrincipal>;
      try {
        if (!actorSnap.exists) return deny('FORBIDDEN_ADMIN_ACTION');
        actor = buildPrincipal(actorSnap.data(), principal.userId, { email: principal.email, name: principal.displayName });
        if (actor.role !== 'SUPER_ADMIN') return deny('FORBIDDEN_ADMIN_ACTION');
      } catch { return deny('FORBIDDEN_ADMIN_ACTION'); }
      const targetSnap = await tx.get(targetRef);
      if (!targetSnap.exists) return deny('TARGET_USER_NOT_FOUND');
      const before = targetSnap.data();
      let target: ReturnType<typeof validateAccountProfile>;
      try {
        target = validateAccountProfile(before, targetUserId);
        if (before.userId !== targetUserId) return deny('INVALID_ADMIN_COMMAND');
      } catch { return deny('INVALID_ADMIN_COMMAND'); }
      const admins = await tx.get(this.db.collection('users').where('role', '==', 'SUPER_ADMIN'));
      const viable = admins.docs.filter((doc: any) => {
        try { return buildPrincipal(doc.data(), doc.id, {}).role === 'SUPER_ADMIN'; } catch { return false; }
      });
      const assigned = input.assignedProjectIds as string[] | undefined;
      if (assigned) for (const id of assigned) {
        const project=await tx.get(this.db.collection('projects').doc(id));if(!project.exists)return deny('INVALID_ADMIN_COMMAND');
        if(!target.assignedProjectIds.includes(id))assertFoundationMutation(decodeProject<any>(project.data(),id).status,'NEW_OPERATION');
      }
      if (input.command === 'linkDriverIdentity') {
        if (target.role !== 'DRIVER') return deny('INVALID_ADMIN_COMMAND');
        const driver = await tx.get(this.db.collection('drivers').doc(input.linkedDriverId));
        if (!driver.exists || driver.data()?.driverId !== input.linkedDriverId) return deny('INVALID_ADMIN_COMMAND');
        decodeGlobal(driver.data(), 'driver', driver.id);
        const owners = await tx.get(this.db.collection('users').where('linkedDriverId', '==', input.linkedDriverId));
        if (owners.docs.some((doc: any) => doc.id !== targetUserId)) return deny('DRIVER_IDENTITY_ALREADY_LINKED');
      }
      const now = new Date();
      let patch: Record<string, any>;
      switch (input.command) {
        case 'approveAccount':
          if (target.status !== 'PENDING_APPROVAL') return deny('ADMIN_UPDATE_CONFLICT');
          patch = { role: input.approvedRole, assignedProjectIds: assigned, status: 'ACTIVE', isActive: true, approvedBy: actor.userId, approvedAt: now.toISOString() }; break;
        case 'rejectAccount':
          if (target.status !== 'PENDING_APPROVAL') return deny('ADMIN_UPDATE_CONFLICT');
          patch = { status: 'REJECTED', isActive: false, rejectionReason: input.rejectionReason.trim(), rejectedBy: actor.userId, rejectedAt: now.toISOString() }; break;
        case 'suspendAccount':
          if (target.status !== 'ACTIVE' || target.isActive === false) return deny('ADMIN_UPDATE_CONFLICT');
          patch = { status: 'SUSPENDED', isActive: false }; break;
        case 'reactivateAccount':
          if (!['SUSPENDED', 'REJECTED'].includes(target.status)) return deny('ADMIN_UPDATE_CONFLICT');
          patch = { status: 'ACTIVE', isActive: true }; break;
        case 'changeUserRole': patch = { role: input.newRole }; break;
        case 'linkDriverIdentity': patch = { linkedDriverId: input.linkedDriverId }; break;
        case 'unlinkDriverIdentity': patch = {}; break;
        case 'replaceAssignedProjects': patch = { assignedProjectIds: assigned }; break;
        default: return deny('INVALID_ADMIN_COMMAND');
      }
      const clearLink = input.command === 'unlinkDriverIdentity' || (input.command === 'changeUserRole' && input.newRole !== 'DRIVER') || (input.command === 'approveAccount' && input.approvedRole !== 'DRIVER');
      const after = { ...before, ...patch, updatedBy: actor.userId, updatedAt: now };
      if (clearLink) delete after.linkedDriverId;
      const losesAdmin = target.role === 'SUPER_ADMIN' && target.status === 'ACTIVE' && target.isActive !== false && (after.role !== 'SUPER_ADMIN' || after.status !== 'ACTIVE' || after.isActive === false);
      if (losesAdmin && viable.length <= 1) return deny('LAST_SUPER_ADMIN_PROTECTED');
      // Conservative self-policy: no effective-access mutation of one's own account.
      if (targetUserId === actor.userId) return deny('SELF_ADMIN_ACTION_BLOCKED');
      const oldValues = administrativeValues(before), newValues = administrativeValues(after);
      const event = { auditLogId, projectId: 'SYSTEM', entityType: 'USER_ROLE', entityId: targetUserId,
        action: ['suspendAccount', 'reactivateAccount', 'rejectAccount'].includes(input.command) ? 'FORCE_STATUS_CHANGE' : 'UPDATE',
        actor: { userId: actor.userId, role: actor.role, email: actor.email },
        changes: { before: oldValues, after: newValues, deltaFields: [...Object.keys(patch), ...(clearLink && before.linkedDriverId !== undefined ? ['linkedDriverId'] : [])] },
        correlationId: auditLogId, command: input.command,
        createdAt: now, updatedAt: now, createdBy: actor.userId, updatedBy: actor.userId };
      const revision = fenceSnap.exists ? fenceSnap.data()?.revision : 0;
      if (!Number.isSafeInteger(revision) || revision < 0) return deny('ADMIN_UPDATE_CONFLICT');
      tx.update(targetRef, sanitizeUndefined({ ...patch, ...(clearLink ? { linkedDriverId: FieldValue.delete() } : {}), updatedBy: actor.userId, updatedAt: now }));
      tx.set(this.db.collection('audit_logs').doc(auditLogId), sanitizeUndefined(event));
      tx.set(fence, { revision: revision + 1 });
      return { userId: targetUserId, ...newValues };
    });
  }
}
