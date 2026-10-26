import { randomUUID } from 'node:crypto';
import { adminDb } from '../firebase/admin';
import { ProjectReadinessService, lifecycleReadiness, validateCandidateIds, type CandidatePath } from './projectReadiness.service';
import { ProjectReadinessAdminReadContext } from './projectReadiness.server';
import type { AuthUserContext } from '../types/common';
import { sanitizeUndefined } from '../utils/sanitize';

export class NonTransactionReadContext extends ProjectReadinessAdminReadContext {}
export class ProjectActivationError extends Error {
  constructor(public code: string, message: string, public status = 409) { super(message); }
}

export class ProjectActivationService {
  private readinessService = new ProjectReadinessService();
  constructor(private database?: any) {}
  private get db() { return this.database || adminDb; }

  async activateProject(projectId: string, authenticated: AuthUserContext): Promise<void> {
    // Even an idempotent repeat reauthorizes against current account and Project state.
    const preflight = await this.db.runTransaction(async (tx: any) => {
      const reads = new ProjectReadinessAdminReadContext(this.db, ref => tx.get(ref));
      const actor = await reads.currentPrincipal(projectId, authenticated, true);
      const project = await reads.getProject(projectId);
      if (!project) throw new ProjectActivationError('PROJECT_NOT_FOUND', 'المشروع غير موجود', 404);
      const lifecycle = lifecycleReadiness(project, projectId, actor);
      if (lifecycle.blockers.some(blocker => blocker.category === 'DATA_INTEGRITY')) throw new ProjectActivationError('PROJECT_VALIDATION_FAILED', 'بيانات المشروع غير مكتملة');
      if (lifecycle.state !== 'ALREADY_ACTIVE' && !lifecycle.ready) throw new ProjectActivationError('PROJECT_NOT_APPROVED', 'لا يمكن تنشيط مشروع ما لم يكن في حالة معتمد (APPROVED)');
      return { project, actor };
    });
    if (preflight.project.status === 'ACTIVE') return; // Idempotency, not proof of operational readiness.

    // Discovery selects a candidate only. No candidate document is trusted at commit time.
    let readiness;
    try {
      readiness = await this.readinessService.evaluateProjectReadiness(projectId, new Date(), new NonTransactionReadContext(this.db), preflight.actor);
    } catch (error: any) {
      if (error.code === 'PERSISTENCE_BOUNDARY_INVALID') throw new ProjectActivationError(error.code, `المشروع غير جاهز للتنشيط: ${error.message}`, 400);
      throw error;
    }
    if (!readiness.ready || !readiness.candidatePath) throw new ProjectActivationError('PROJECT_NOT_READY', `المشروع غير جاهز للتنشيط: ${readiness.blockers.map(blocker => blocker.message).join(' | ')}`);
    const path: CandidatePath = readiness.candidatePath;
    validateCandidateIds(path); // Must precede construction of any candidate refs.

    await this.db.runTransaction(async (tx: any) => {
      const reads = new ProjectReadinessAdminReadContext(this.db, ref => tx.get(ref));
      const actor = await reads.currentPrincipal(projectId, authenticated, true);
      const project = await reads.getProject(projectId);
      if (!project) throw new ProjectActivationError('PROJECT_NOT_FOUND', 'المشروع غير موجود', 404);
      const lifecycle = lifecycleReadiness(project, projectId, actor);
      if (lifecycle.blockers.some(blocker => blocker.category === 'DATA_INTEGRITY')) throw new ProjectActivationError('PROJECT_VALIDATION_FAILED', 'بيانات المشروع غير مكتملة');
      if (lifecycle.state === 'ALREADY_ACTIVE') return;
      if (!lifecycle.ready) throw new ProjectActivationError('PROJECT_NOT_APPROVED', 'لا يمكن تنشيط مشروع ما لم يكن في حالة معتمد (APPROVED)');
      // Re-read the full selected path and globals with the transaction's snapshot.
      const blockers = await reads.revalidateCandidatePath(projectId, path, () => new Date());
      if (blockers.length) throw new ProjectActivationError('PROJECT_NOT_READY', `المشروع غير جاهز للتنشيط: ${blockers.map(blocker => blocker.message).join(' | ')}`);
      const setup = await reads.getSetupReadiness(projectId, project);
      if (!setup.ready) throw new ProjectActivationError('PROJECT_SETUP_NOT_READY', 'Project setup is incomplete.');
      const now = new Date(), auditLogId = `AUDIT-ACTIVATION-${projectId}-${randomUUID()}`;
      const update = { status: 'ACTIVE' as const, updatedAt: now, updatedBy: actor.userId };
      const audit = sanitizeUndefined({
        auditLogId, projectId, entityType: 'PROJECT', entityId: projectId, action: 'UPDATE',
        actor: { userId: actor.userId, email: actor.email, role: actor.role },
        changes: { before: project, after: { ...project, ...update }, deltaFields: ['status', 'updatedAt', 'updatedBy'] },
        correlationId: auditLogId, createdAt: now, updatedAt: now, createdBy: actor.userId, updatedBy: actor.userId,
      });
      tx.update(this.db.collection('projects').doc(projectId), update);
      tx.set(this.db.collection('audit_logs').doc(auditLogId), audit);
    });
  }
}
export const projectActivationService = new ProjectActivationService();
