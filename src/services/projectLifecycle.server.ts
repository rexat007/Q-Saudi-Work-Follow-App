import { adminDb } from '../firebase/admin';
import { ProjectEntity, AuditLogEntity } from '../types/entities';
import { AuthUserContext } from '../types/common';
import { LEGAL_LIFECYCLE_TRANSITIONS } from './projectLifecycle.policy';
import { sanitizeUndefined } from '../utils/sanitize';

export interface LifecycleTransitionResult {
  success: boolean;
  projectId: string;
  previousStatus: ProjectEntity['status'];
  newStatus: ProjectEntity['status'];
  transitionedAt: string;
}

export class ProjectLifecycleServerService {
  /**
   * Authoritative server-side transition of a project's lifecycle status.
   * Executes atomically inside a single adminDb transaction with canonical audit logging.
   */
  async transitionStatus(
    projectId: string,
    targetStatus: ProjectEntity['status'],
    context: AuthUserContext,
    reason?: string
  ): Promise<LifecycleTransitionResult> {
    const uid = context?.userId || (context as any)?.uid;
    if (!context || !uid) {
      throw new Error('غير مصرح: يجب تسجيل الدخول لتغيير حالة دورة حياة المشروع');
    }

    if (!projectId || !projectId.trim()) {
      throw new Error('معرّف المشروع مطلوب');
    }

    // Role check: Only SUPER_ADMIN or PROJECT_ADMIN
    const userRole = context.role || (context as any)?.roles?.[0];
    const isSuperAdmin = userRole === 'SUPER_ADMIN' || ((context as any)?.roles && (context as any).roles.includes('SUPER_ADMIN'));
    const isProjectAdmin = (userRole === 'PROJECT_ADMIN' || ((context as any)?.roles && (context as any).roles.includes('PROJECT_ADMIN'))) &&
      (!context.assignedProjectIds || context.assignedProjectIds.includes(projectId));

    if (!isSuperAdmin && !isProjectAdmin) {
      throw new Error('غير مصرح: لا تملك الصلاحية لتغيير حالة حوكمة المشروع');
    }

    // Direct transition to ACTIVE is strictly forbidden here
    if (targetStatus === 'ACTIVE') {
      throw new Error('لا يمكن تنشيط المشروع عبر مسار الانتقال العادي. يجب استخدام مسار التنشيط الرسمي (ProjectActivationService)');
    }

    const projectRef = adminDb.collection('projects').doc(projectId);
    const now = new Date();
    const transitionedAt = now.toISOString();

    let previousStatus: ProjectEntity['status'] = 'SETUP';

    // Execute atomically inside an adminDb transaction
    await adminDb.runTransaction(async (transaction: any) => {
      // READ 1: Get Project Document
      const projectDoc = await transaction.get(projectRef);
      if (!projectDoc.exists) {
        throw new Error('المشروع غير موجود');
      }

      const projectData = projectDoc.data() as ProjectEntity;
      previousStatus = projectData.status;

      // Validate transition legality against canonical policy
      const allowed = LEGAL_LIFECYCLE_TRANSITIONS[previousStatus];
      if (!allowed || !allowed.includes(targetStatus)) {
        throw new Error(`انتقال غير صالح لحالة دورة حياة المشروع: لا يمكن الانتقال من ${previousStatus} إلى ${targetStatus}`);
      }

      // Prepare updated project snapshot
      const updatedProjectSnapshot: ProjectEntity = {
        ...projectData,
        status: targetStatus,
        updatedAt: now,
        updatedBy: uid,
      };

      // Prepare Canonical Audit Log
      const auditLogId = `AUDIT-LIFECYCLE-${projectId}-${Date.now()}`;
      const auditLogData: AuditLogEntity = {
        auditLogId,
        projectId,
        entityType: 'PROJECT',
        entityId: projectId,
        action: 'UPDATE',
        actor: {
          userId: uid,
          email: context.email || '',
          role: userRole,
          ipAddress: (context as any).ipAddress || undefined,
          userAgent: (context as any).userAgent || undefined,
        },
        changes: {
          before: sanitizeUndefined(projectData),
          after: sanitizeUndefined(updatedProjectSnapshot),
          deltaFields: ['status', 'updatedAt', 'updatedBy'],
        },
        correlationId: (context as any).correlationId || `CORR-${auditLogId}`,
        createdAt: now,
        createdBy: uid,
        updatedAt: now,
        updatedBy: uid,
      };

      const auditLogRef = adminDb.collection('audit_logs').doc(auditLogId);

      // ALL READS COMPLETED. WRITE ATOMICALLY:
      // WRITE 1: Update project document (status and audit metadata ONLY)
      transaction.update(projectRef, {
        status: targetStatus,
        updatedAt: now,
        updatedBy: uid,
      });

      // WRITE 2: Write canonical audit log
      transaction.set(auditLogRef, sanitizeUndefined(auditLogData));
    });

    return {
      success: true,
      projectId,
      previousStatus,
      newStatus: targetStatus,
      transitionedAt,
    };
  }
}

export const projectLifecycleServerService = new ProjectLifecycleServerService();
