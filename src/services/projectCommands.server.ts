import { readSetupReadiness } from './setupReadiness.server';
import type { SetupReadinessBlocker } from '../types/setupReadiness';
import { createHash, randomUUID } from 'node:crypto';
import { adminDb } from '../firebase/admin';
import { buildPrincipal } from '../utils/principal';
import { decodeProject } from '../utils/persistenceBoundary';
import { sanitizeUndefined } from '../utils/sanitize';
import { ProjectValidator } from '../validators/project.validator';
import { LEGAL_LIFECYCLE_TRANSITIONS } from './projectLifecycle.policy';
import { canEditProjectFoundation, FOUNDATION_FIELDS, FOUNDATION_SETTINGS } from './projectMutability.policy';
import type { ProjectEntity } from '../types/entities';
import type { AuthUserContext } from '../types/common';

export class ProjectCommandError extends Error {
  constructor(public code: string, public status = 400, message = code, public blockers?: SetupReadinessBlocker[]) { super(message); }
}
const fail = (code: string, status = 400, message?: string): never => { throw new ProjectCommandError(code, status, message); };
const validId = (value: unknown): value is string => typeof value === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(value) && value !== 'ALL';
function exact(value: any, fields: readonly string[]) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(key => !fields.includes(key))) fail('INVALID_PROJECT_COMMAND');
}
function stable(value: any): any {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])]));
  return value;
}
function validateFoundation(patch: any) {
  exact(patch, FOUNDATION_FIELDS);
  for (const key of ['nameAr', 'nameEn', 'clientName', 'description', 'startDate', 'endDate']) {
    if (patch[key] !== undefined && typeof patch[key] !== 'string') fail('INVALID_PROJECT_COMMAND');
  }
  for (const key of ['startDate', 'endDate']) if (patch[key]) {
    const date = new Date(patch[key]);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(patch[key]) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== patch[key]) fail('INVALID_PROJECT_COMMAND');
  }
  if (patch.location !== undefined) {
    exact(patch.location, ['lat', 'lng', 'geoFenceRadiusMeters', 'addressAr']);
    const l = patch.location;
    if (typeof l.addressAr !== 'string' || !Number.isFinite(l.lat) || Math.abs(l.lat) > 90 || !Number.isFinite(l.lng) || Math.abs(l.lng) > 180 || !Number.isFinite(l.geoFenceRadiusMeters) || l.geoFenceRadiusMeters <= 0) fail('INVALID_PROJECT_COMMAND');
  }
  if (patch.settings !== undefined) {
    exact(patch.settings, FOUNDATION_SETTINGS);
    if (patch.settings.zatcaTaxNumber !== undefined && typeof patch.settings.zatcaTaxNumber !== 'string') fail('INVALID_PROJECT_COMMAND');
    if (patch.settings.vatRatePercent !== undefined && (!Number.isFinite(patch.settings.vatRatePercent) || patch.settings.vatRatePercent < 0 || patch.settings.vatRatePercent > 100)) fail('INVALID_PROJECT_COMMAND');
    if (patch.settings.currency !== undefined && typeof patch.settings.currency !== 'string') fail('INVALID_PROJECT_COMMAND');
  }
}
function validateProject(project: ProjectEntity) {
  const validation = ProjectValidator.validate(project);
  if (!validation.isValid) fail('VALIDATION_ERROR', 400, `خطأ في التحقق من صحة المشروع: ${validation.errors.map(error => error.messageAr).join(' | ')}`);
}

/** All Project commands reauthorize inside the transaction. Caller supplies identity only. */
export class ProjectCommandsServerService {
  constructor(private database?: any) {}
  private get db() { return this.database || adminDb; }
  private async actor(tx: any, authenticated: AuthUserContext, projectId?: string, creation = false) {
    if (!validId(authenticated?.userId)) return fail('FORBIDDEN_PROJECT_ACCESS', 403);
    const snap = await tx.get(this.db.collection('users').doc(authenticated.userId));
    const actor = buildPrincipal(snap.exists ? snap.data() : null, authenticated.userId, { email: authenticated.email });
    if (actor.role !== 'SUPER_ADMIN' && (creation || actor.role !== 'PROJECT_ADMIN' || !projectId || !actor.assignedProjectIds.includes(projectId))) {
      fail('FORBIDDEN_PROJECT_ACCESS', 403, 'غير مصرح: لا تملك الصلاحية لتغيير حالة حوكمة المشروع');
    }
    return actor;
  }
  private audit(tx: any, projectId: string, actor: ReturnType<typeof buildPrincipal>, before: any, after: any, command: string, reason?: string) {
    const auditLogId = `AUDIT-${command === 'TRANSITION_PROJECT_LIFECYCLE' ? 'LIFECYCLE-' : ''}${projectId}-${randomUUID()}`;
    const now = new Date();
    tx.set(this.db.collection('audit_logs').doc(auditLogId), sanitizeUndefined({
      auditLogId, projectId, entityType: 'PROJECT', entityId: projectId, action: before ? 'UPDATE' : 'CREATE', command,
      actor: { userId: actor.userId, role: actor.role, email: actor.email },
      changes: { before, after, deltaFields: Object.keys(after).filter(key => JSON.stringify(before?.[key]) !== JSON.stringify(after[key])) },
      reason, correlationId: auditLogId, createdAt: now, updatedAt: now, createdBy: actor.userId, updatedBy: actor.userId,
    }));
  }
  async createProject(raw: any, authenticated: AuthUserContext): Promise<ProjectEntity> {
    exact(raw, [...FOUNDATION_FIELDS, 'projectId', 'projectCode', 'projectNumber', 'createdAt', 'createdBy', 'updatedAt', 'updatedBy', 'status', 'authorizedCarrierIds', 'authorizedMaterialIds', 'operationId']);
    if (raw.status !== undefined && raw.status !== 'SETUP') fail('INVALID_PROJECT_INITIAL_STATE');
    if (typeof raw.operationId !== 'string' || !/^[a-zA-Z0-9_.:-]{1,256}$/.test(raw.operationId)) fail('INVALID_PROJECT_OPERATION_ID');
    // Empty historical relationship arrays are accepted for caller compatibility, never populated here.
    for (const key of ['authorizedCarrierIds', 'authorizedMaterialIds']) if (raw[key] !== undefined && (!Array.isArray(raw[key]) || raw[key].length)) fail('INVALID_PROJECT_COMMAND');
    const foundation: any = Object.fromEntries(FOUNDATION_FIELDS.filter(key => raw[key] !== undefined).map(key => [key, raw[key]]));
    const settings = raw.settings || {};
    exact(settings, [...FOUNDATION_SETTINGS, 'requireTareOnExit', 'maxToleranceKg', 'allowDriverSelfDispatch', 'googleDriveProvisioning']);
    // Existing creation defaults are fixed, not an operational-settings mutation API.
    for (const [key, value] of Object.entries({ requireTareOnExit: true, maxToleranceKg: 500, allowDriverSelfDispatch: false })) if (settings[key] !== undefined && settings[key] !== value) fail('INVALID_PROJECT_COMMAND');
    if (settings.googleDriveProvisioning !== undefined) {
      exact(settings.googleDriveProvisioning, ['enabled', 'rootFolderName', 'spreadsheetTitle', 'status']);
      const intent = settings.googleDriveProvisioning;
      if (typeof intent.enabled !== 'boolean' || (intent.status !== undefined && intent.status !== 'PENDING') || ['rootFolderName', 'spreadsheetTitle'].some(key => intent[key] !== undefined && typeof intent[key] !== 'string')) fail('INVALID_PROJECT_COMMAND');
    }
    foundation.settings = Object.fromEntries(FOUNDATION_SETTINGS.filter(key => settings[key] !== undefined).map(key => [key, settings[key]]));
    validateFoundation(foundation);
    if (typeof foundation.nameEn !== 'string' || typeof foundation.clientName !== 'string' || !foundation.location || typeof foundation.settings.zatcaTaxNumber !== 'string' || typeof foundation.settings.vatRatePercent !== 'number') fail('INVALID_PROJECT_COMMAND');
    const normalized: any = sanitizeUndefined({ ...foundation, status: 'SETUP', authorizedCarrierIds: [], authorizedMaterialIds: [], settings: { ...foundation.settings, requireTareOnExit: true, maxToleranceKg: 500, allowDriverSelfDispatch: false, ...(settings.googleDriveProvisioning ? { googleDriveProvisioning: settings.googleDriveProvisioning } : {}) } });
    validateProject({ ...normalized, projectId: 'Q-PRJ-VALIDATION' });
    const fingerprint = createHash('sha256').update(JSON.stringify(stable(normalized))).digest('hex');
    return this.db.runTransaction(async (tx: any) => {
      const actor = await this.actor(tx, authenticated, undefined, true);
      const ledgerRef = this.db.collection('project_commands').doc(createHash('sha256').update(JSON.stringify([actor.userId, raw.operationId])).digest('hex'));
      const previous = await tx.get(ledgerRef);
      if (previous.exists) {
        const entry = previous.data();
        if (entry.actorId !== actor.userId || entry.operationId !== raw.operationId || entry.fingerprint !== fingerprint || entry.command !== 'CREATE_PROJECT' || !validId(entry.projectId)) fail('PROJECT_COMMAND_CONFLICT', 409);
        // Return the committed command result, even if the project has since changed.
        return decodeProject<ProjectEntity>(entry.result, entry.projectId);
      }
      const counterRef = this.db.collection('systemCounters').doc('projectNumber');
      const counter = await tx.get(counterRef);
      let number: number;
      if (counter.exists) number = counter.data()?.nextNumber;
      else {
        const projects = await tx.get(this.db.collection('projects'));
        let max = 0;
        for (const doc of projects.docs) {
          const value = doc.data().projectNumber;
          if (value !== undefined) {
            if (!Number.isSafeInteger(value) || value < 1) fail('PROJECT_COUNTER_INVALID');
            max = Math.max(max, value);
          }
          // Do not collide with a recognized historical code lacking numeric metadata.
          const match = /^Q-PRJ-(\d+)$/.exec(doc.id);
          if (match) {
            const parsed = Number(match[1]);
            if (!Number.isSafeInteger(parsed) || parsed < 1) fail('PROJECT_COUNTER_INVALID');
            max = Math.max(max, parsed);
          }
        }
        number = max + 1;
      }
      if (!Number.isSafeInteger(number) || number < 1 || !Number.isSafeInteger(number + 1)) fail('PROJECT_COUNTER_INVALID');
      const projectId = `Q-PRJ-${String(number).padStart(3, '0')}`;
      const ref = this.db.collection('projects').doc(projectId);
      if ((await tx.get(ref)).exists) fail('PROJECT_COLLISION_DETECTED', 409);
      const now = new Date();
      const project = { ...normalized, projectId, projectCode: projectId, projectNumber: number, createdAt: now, updatedAt: now, createdBy: actor.userId, updatedBy: actor.userId } as ProjectEntity;
      tx.set(ref, project);
      tx.set(counterRef, { nextNumber: number + 1, updatedAt: now });
      this.audit(tx, projectId, actor, null, project, 'CREATE_PROJECT');
      tx.set(ledgerRef, { command: 'CREATE_PROJECT', actorId: actor.userId, operationId: raw.operationId, fingerprint, projectId, result: project, createdAt: now });
      return project;
    });
  }
  async updateFoundation(projectId: string, patch: any, authenticated: AuthUserContext) {
    if (!validId(projectId)) fail('INVALID_PROJECT_COMMAND');
    validateFoundation(patch);
    if (!Object.keys(patch).length) fail('INVALID_PROJECT_COMMAND');
    return this.db.runTransaction(async (tx: any) => {
      const actor = await this.actor(tx, authenticated, projectId);
      const ref = this.db.collection('projects').doc(projectId), snap = await tx.get(ref);
      if (!snap.exists) fail('PROJECT_NOT_FOUND', 404, 'المشروع غير موجود');
      const project = decodeProject<ProjectEntity>(snap.data(), projectId);
      if (!canEditProjectFoundation(project.status)) fail('PROJECT_FOUNDATION_LOCKED', 409);
      const after = { ...project, ...patch, settings: { ...project.settings, ...patch.settings }, updatedAt: new Date(), updatedBy: actor.userId };
      validateProject(after);
      tx.update(ref, sanitizeUndefined({ ...patch, settings: after.settings, updatedAt: after.updatedAt, updatedBy: actor.userId }));
      this.audit(tx, projectId, actor, project, after, 'UPDATE_PROJECT_FOUNDATION');
      return after;
    });
  }
  async transitionStatus(projectId: string, targetStatus: ProjectEntity['status'], authenticated: AuthUserContext, reason?: string) {
    if (!validId(projectId) || (reason !== undefined && typeof reason !== 'string')) fail('INVALID_PROJECT_COMMAND');
    return this.db.runTransaction(async (tx: any) => {
      const actor = await this.actor(tx, authenticated, projectId);
      const ref = this.db.collection('projects').doc(projectId), snap = await tx.get(ref);
      if (!snap.exists) fail('PROJECT_NOT_FOUND', 404, 'المشروع غير موجود');
      const project = decodeProject<ProjectEntity>(snap.data(), projectId);
      if (targetStatus === 'ACTIVE') fail('INVALID_PROJECT_TRANSITION', 400, 'لا يمكن تنشيط المشروع عبر مسار الانتقال العادي. يجب استخدام مسار التنشيط الرسمي (ProjectActivationService)');
      if (!Object.hasOwn(LEGAL_LIFECYCLE_TRANSITIONS, project.status) || !LEGAL_LIFECYCLE_TRANSITIONS[project.status].includes(targetStatus)) fail('INVALID_PROJECT_TRANSITION', 409, `انتقال غير صالح لحالة دورة حياة المشروع: لا يمكن الانتقال من ${project.status} إلى ${targetStatus}`);
      if (project.status === 'SETUP' && targetStatus === 'READY_FOR_REVIEW') {
        const setup = await readSetupReadiness(projectId, project, this.db, ref => tx.get(ref));
        if (!setup.ready) throw new ProjectCommandError('PROJECT_SETUP_NOT_READY', 409, 'Project setup is incomplete.', setup.blockers);
      }
      const now = new Date(), after = { ...project, status: targetStatus, updatedAt: now, updatedBy: actor.userId };
      tx.update(ref, { status: targetStatus, updatedAt: now, updatedBy: actor.userId });
      this.audit(tx, projectId, actor, project, after, 'TRANSITION_PROJECT_LIFECYCLE', reason);
      return { success: true, projectId, previousStatus: project.status, newStatus: targetStatus, transitionedAt: now.toISOString() };
    });
  }
  /** Internal capability: accepts identifiers returned by server provisioning, never a client settings snapshot. */
  async recordWorkspaceLink(projectId: string, structure: { projectFolderId: string; spreadsheetId: string; projectFolderName: string }, authenticated: AuthUserContext) {
    if (!validId(projectId) || [structure.projectFolderId, structure.spreadsheetId, structure.projectFolderName].some(value => typeof value !== 'string' || !value.trim())) fail('INVALID_PROJECT_COMMAND');
    return this.db.runTransaction(async (tx: any) => {
      const actor = await this.actor(tx, authenticated, projectId);
      const ref = this.db.collection('projects').doc(projectId), snap = await tx.get(ref);
      if (!snap.exists) fail('PROJECT_NOT_FOUND', 404);
      const project = decodeProject<ProjectEntity>(snap.data(), projectId);
      const settings = { ...project.settings, googleDriveFolderId: structure.projectFolderId, googleSpreadsheetId: structure.spreadsheetId, googleDriveProvisioning: { ...project.settings?.googleDriveProvisioning, enabled: true, rootFolderName: structure.projectFolderName, spreadsheetTitle: structure.projectFolderName, status: 'PROVISIONED' as const } };
      const after = { ...project, settings, updatedAt: new Date(), updatedBy: actor.userId };
      tx.update(ref, { settings, updatedAt: after.updatedAt, updatedBy: actor.userId });
      this.audit(tx, projectId, actor, project, after, 'RECORD_WORKSPACE_LINK');
      return after;
    });
  }
}
export const projectCommandsServerService = new ProjectCommandsServerService();
