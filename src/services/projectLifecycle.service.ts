import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { ProjectEntity } from '../types/entities';
import { AuthUserContext } from '../types/common';
import { AuditLogService } from './auditLog.service';
import { ProjectRepository } from '../repositories/project.repository';

export type GovernanceProjectStatus = 'SETUP' | 'READY_FOR_REVIEW' | 'APPROVED';

export interface LifecycleTransitionResult {
  success: boolean;
  projectId: string;
  previousStatus: ProjectEntity['status'];
  newStatus: ProjectEntity['status'];
  transitionedAt: string;
}

export class ProjectLifecycleService {
  private projectRepository = new ProjectRepository();
  private auditLogService = new AuditLogService();

  /**
   * Legal governance transitions:
   * SETUP -> READY_FOR_REVIEW
   * READY_FOR_REVIEW -> SETUP
   * READY_FOR_REVIEW -> APPROVED
   * APPROVED -> READY_FOR_REVIEW
   * APPROVED -> SETUP
   * 
   * Note: ACTIVE is exclusively reached via ProjectActivationService.
   */
  private readonly legalTransitions: Record<string, string[]> = {
    SETUP: ['READY_FOR_REVIEW'],
    READY_FOR_REVIEW: ['APPROVED', 'SETUP'],
    APPROVED: ['READY_FOR_REVIEW', 'SETUP'],
  };

  /**
   * Transitions a project's lifecycle status following canonical governance rules.
   */
  async transitionStatus(
    projectId: string,
    targetStatus: ProjectEntity['status'],
    context: AuthUserContext,
    reason?: string
  ): Promise<LifecycleTransitionResult> {
    const uid = context.userId || (context as any).uid;
    if (!context || !uid) {
      throw new Error('غير مصرح: يجب تسجيل الدخول لتغيير حالة دورة حياة المشروع');
    }

    // Role check: Only SUPER_ADMIN or PROJECT_ADMIN can transition lifecycle
    const userRole = context.role || (context as any).roles?.[0];
    const isSuperAdmin = userRole === 'SUPER_ADMIN' || ((context as any).roles && (context as any).roles.includes('SUPER_ADMIN'));
    const isProjectAdmin = (userRole === 'PROJECT_ADMIN' || ((context as any).roles && (context as any).roles.includes('PROJECT_ADMIN'))) && (context.assignedProjectIds?.includes(projectId) ?? true);
    if (!isSuperAdmin && !isProjectAdmin) {
      throw new Error('غير مصرح: لا تملك الصلاحية لتغيير حالة حوكمة المشروع');
    }

    // Direct transition to ACTIVE is strictly forbidden here
    if (targetStatus === 'ACTIVE') {
      throw new Error('لا يمكن تنشيط المشروع عبر مسار الانتقال العادي. يجب استخدام مسار التنشيط الرسمي (ProjectActivationService)');
    }

    const project = await this.projectRepository.findById(projectId);
    if (!project) {
      throw new Error('المشروع غير موجود');
    }

    const currentStatus = project.status;

    // Check if transition is legal
    const allowed = this.legalTransitions[currentStatus];
    if (!allowed || !allowed.includes(targetStatus)) {
      throw new Error(`انتقال غير صالح لحالة دورة حياة المشروع: لا يمكن الانتقال من ${currentStatus} إلى ${targetStatus}`);
    }

    // Perform the status update
    const projectRef = doc(db, 'projects', projectId);
    await updateDoc(projectRef, {
      status: targetStatus,
      updatedAt: serverTimestamp(),
      updatedBy: uid,
    });

    // Record audit log
    await this.auditLogService.recordLog(
      {
        projectId,
        entityType: 'PROJECT',
        entityId: projectId,
        action: 'UPDATE',
        before: project,
        after: {
          ...project,
          status: targetStatus,
        },
      },
      context
    );

    return {
      success: true,
      projectId,
      previousStatus: currentStatus,
      newStatus: targetStatus,
      transitionedAt: new Date().toISOString(),
    };
  }
}
