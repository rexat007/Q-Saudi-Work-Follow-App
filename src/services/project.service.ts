import { projectRepository } from '../repositories/project.repository';
import { ProjectValidator } from '../validators/project.validator';
import { ProjectEntity } from '../types/entities';
import { AuthUserContext } from '../types/common';
import { auditLogService } from './auditLog.service';
import { ProjectNumberGenerator } from './projectNumberGenerator';
import { sanitizeUndefined } from '../utils/sanitize';
import { auth } from '../firebase/config';

export class ProjectService {
  private idempotencyMap = new Map<string, ProjectEntity>();

  public clearIdempotencyCache(): void {
    this.idempotencyMap.clear();
  }

  async getProject(projectId: string): Promise<ProjectEntity | null> {
    return projectRepository.findById(projectId);
  }

  async getAllProjects(context?: AuthUserContext): Promise<ProjectEntity[]> {
    const isSuperAdmin = context?.role === 'SUPER_ADMIN';
    return projectRepository.listAll(context?.assignedProjectIds, isSuperAdmin);
  }

  async createProject(
    payload: Omit<ProjectEntity, 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'> & { operationId?: string },
    context: AuthUserContext & { operationId?: string }
  ): Promise<ProjectEntity> {
    // 1. Authorization check
    if (context.role !== 'SUPER_ADMIN') {
      const error: any = new Error('غير مصرح لك: إنشاء المشاريع مقتصر فقط على مدير النظام (SUPER_ADMIN)');
      error.status = 403;
      error.code = 'FORBIDDEN_ROLE_ACCESS';
      throw error;
    }

    const user = typeof window !== 'undefined' ? auth.currentUser : null;
    if (typeof window !== 'undefined' && user) {
      // Browser client path
      const token = await user.getIdToken();
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...payload,
          operationId: payload.operationId || context.operationId,
        }),
      });

      if (!res.ok) {
        const json = await res.json();
        const error: any = new Error(json.error || 'فشلت عملية إنشاء المشروع');
        error.status = res.status;
        error.code = json.code || 'HTTP_ERROR';
        throw error;
      }

      const json = await res.json();
      return json.data;
    }

    // Server-side / test path (direct Firestore Admin transaction)
    const {
      projectId: clientProjectId,
      projectCode: clientProjectCode,
      projectNumber: clientProjectNumber,
      createdAt: clientCreatedAt,
      updatedAt: clientUpdatedAt,
      createdBy: clientCreatedBy,
      updatedBy: clientUpdatedBy,
      ...filteredPayload
    } = payload as any;

    const operationId = payload.operationId || context.operationId;

    // Server-side status checks
    const status = filteredPayload.status || 'SETUP';
    if (status === 'ACTIVE') {
      const error: any = new Error('لا يمكن تنشيط المشروع مباشرة عند الإنشاء');
      error.status = 400;
      error.code = 'BAD_REQUEST';
      throw error;
    }

    const { ProjectValidator } = await import('../validators/project.validator');
    const { sanitizeUndefined } = await import('../utils/sanitize');

    const normalizedInput = sanitizeUndefined({
      ...filteredPayload,
      status,
      authorizedCarrierIds: filteredPayload.authorizedCarrierIds || [],
      authorizedMaterialIds: filteredPayload.authorizedMaterialIds || [],
    });

    const candidateForValidation = {
      ...normalizedInput,
      projectId: 'Q-PRJ-TEMP-VALIDATION', // Valid ID pattern to test non-ID business fields
    };

    const validation = ProjectValidator.validate(candidateForValidation);
    if (!validation.isValid) {
      const errMsg = `خطأ في التحقق من صحة المشروع: ${validation.errors.map(e => e.messageAr).join(' | ')}`;
      const error: any = new Error(errMsg);
      error.status = 400;
      error.code = 'VALIDATION_ERROR';
      error.errors = validation.errors;
      throw error;
    }

    const adminModulePath = '../firebase/admin';
    const { adminDb } = await import(/* @vite-ignore */ adminModulePath);

    return await adminDb.runTransaction(async (transaction: any) => {
      // Check server persistent idempotency
      if (operationId) {
        const queryRef = adminDb.collection('projects').where('operationId', '==', operationId);
        const existingProjectsByOp = await transaction.get(queryRef);
        if (existingProjectsByOp.docs && existingProjectsByOp.docs.length > 0) {
          return existingProjectsByOp.docs[0].data() as ProjectEntity;
        }
      }

      // Concurrency-safe project number allocation
      const counterRef = adminDb.collection('systemCounters').doc('projectNumber');
      const counterSnap = await transaction.get(counterRef);

      let nextNumber = 1;
      if (counterSnap.exists) {
        const data = counterSnap.data();
        nextNumber = typeof data.nextNumber === 'number' ? data.nextNumber : 1;
      } else {
        // Bootstrap counter safely from existing projects if present
        const projectsSnap = await transaction.get(adminDb.collection('projects'));
        let maxExisting = 0;
        projectsSnap.docs.forEach((d: any) => {
          const data = d.data();
          if (data && typeof data.projectNumber === 'number') {
            maxExisting = Math.max(maxExisting, data.projectNumber);
          }
        });
        nextNumber = maxExisting > 0 ? maxExisting + 1 : 1;
      }

      const allocatedNumber = nextNumber;
      const serverProjectCode = `Q-PRJ-${String(allocatedNumber).padStart(3, '0')}`;
      const serverProjectId = serverProjectCode;

      // Ensure no collision with existing project ID
      const projectDocRef = adminDb.collection('projects').doc(serverProjectId);
      const projectSnap = await transaction.get(projectDocRef);
      if (projectSnap.exists) {
        throw new Error(`PROJECT_COLLISION_DETECTED: Project ${serverProjectId} already exists.`);
      }

      const newProject = sanitizeUndefined({
        ...normalizedInput,
        projectId: serverProjectId,
        projectCode: serverProjectCode,
        projectNumber: allocatedNumber,
        operationId: operationId || null,
        createdBy: context.userId,
        updatedBy: context.userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Write the project document
      transaction.set(projectDocRef, newProject);

      // Advance/update the counter
      transaction.set(counterRef, {
        nextNumber: allocatedNumber + 1,
        updatedAt: new Date(),
      });

      // Audit Log write (fully atomic inside transaction)
      const auditLogId = `AUD-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const deltaFields = Object.keys(newProject);
      const logEntry = {
        auditLogId,
        projectId: serverProjectId,
        entityType: 'PROJECT',
        entityId: serverProjectId,
        action: 'CREATE',
        actor: {
          userId: context.userId,
          email: context.email,
          role: context.role,
          ipAddress: context.ipAddress || 'server',
          userAgent: context.userAgent || 'server-api',
        },
        changes: {
          before: null,
          after: newProject,
          deltaFields,
        },
        correlationId: `CORR-${Date.now()}`,
        createdBy: context.userId,
        updatedBy: context.userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      transaction.set(adminDb.collection('audit_logs').doc(auditLogId), logEntry);

      return newProject as ProjectEntity;
    });
  }

  async updateProject(
    projectId: string,
    updates: Partial<ProjectEntity>,
    context: AuthUserContext
  ): Promise<void> {
    if (context.role !== 'PROJECT_ADMIN' && context.role !== 'SUPER_ADMIN') {
      throw new Error('غير مصرح لك بتعديل بيانات المشروع');
    }

    const existing = await projectRepository.findById(projectId);
    if (!existing) {
      throw new Error('المشروع غير موجود');
    }

    // Ensure projectCode and projectNumber are immutable
    const { projectCode, projectNumber, ...sanitizedUpdates } = updates;
    
    // GUARD: Prevent lifecycle/governance status mutation via generic update
    if (sanitizedUpdates.status !== undefined && sanitizedUpdates.status !== existing.status) {
      if (sanitizedUpdates.status === 'ACTIVE') {
        throw new Error('لا يمكن تنشيط المشروع عبر تحديث عام. يرجى استخدام عملية التنشيط الرسمية.');
      }
      throw new Error('لا يمكن تعديل حالة دورة حياة المشروع عبر التحديث العام. يرجى استخدام عملية انتقال الحوكمة المعتمدة.');
    }

    const merged = { ...existing, ...sanitizedUpdates, projectId };
    
    const validation = ProjectValidator.validate(merged);
    if (!validation.isValid) {
      throw new Error(`خطأ في التحقق: ${validation.errors.map(e => e.messageAr).join(' | ')}`);
    }

    await projectRepository.update(projectId, sanitizedUpdates, context.userId);

    await auditLogService.recordLog({
      projectId,
      entityType: 'PROJECT',
      entityId: projectId,
      action: 'UPDATE',
      before: existing,
      after: merged,
    }, context);
  }

  async deleteProject(projectId: string, context: AuthUserContext): Promise<void> {
    if (context.role !== 'SUPER_ADMIN' && context.role !== 'PROJECT_ADMIN') {
      throw new Error('غير مصرح لك بحذف المشروع');
    }
    const existing = await projectRepository.findById(projectId);
    if (!existing) {
      throw new Error('المشروع غير موجود');
    }
    await projectRepository.delete(projectId);
    await auditLogService.recordLog({
      projectId,
      entityType: 'PROJECT',
      entityId: projectId,
      action: 'DELETE',
      before: existing,
      after: null,
    }, context);
  }

  subscribeToProjects(onData: (projects: ProjectEntity[]) => void) {
    return projectRepository.subscribeToProjects(onData);
  }
}

export const projectService = new ProjectService();
