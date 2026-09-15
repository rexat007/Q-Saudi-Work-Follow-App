import { projectRepository } from '../repositories/project.repository';
import { ProjectValidator } from '../validators/project.validator';
import { ProjectEntity } from '../types/entities';
import { AuthUserContext } from '../types/common';
import { auditLogService } from './auditLog.service';
import { ProjectNumberGenerator } from './projectNumberGenerator';
import { sanitizeUndefined } from '../utils/sanitize';

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
    if (context.role !== 'PROJECT_ADMIN' && context.role !== 'SUPER_ADMIN') {
      throw new Error('غير مصرح لك: إنشاء المشاريع مقتصر فقط على مديري المشاريع (PROJECT_ADMIN)');
    }

    // 2. Idempotency Check
    const operationId = payload.operationId || context.operationId;
    if (operationId && this.idempotencyMap.has(operationId)) {
      return this.idempotencyMap.get(operationId)!;
    }

    // 3. Normalize & Sanitize Input BEFORE number allocation
    const status = payload.status || 'SETUP';
    const normalizedInput = sanitizeUndefined({
      ...payload,
      status,
      authorizedCarrierIds: payload.authorizedCarrierIds || [],
      authorizedMaterialIds: payload.authorizedMaterialIds || [],
    });

    // 4. Validate Business Fields BEFORE allocating sequence number
    const candidateForValidation: Partial<ProjectEntity> = {
      ...normalizedInput,
      projectId: 'Q-PRJ-TEMP-VALIDATION', // Valid ID pattern to test non-ID business fields
    };

    const validation = ProjectValidator.validate(candidateForValidation);
    if (!validation.isValid) {
      throw new Error(`خطأ في التحقق من صحة المشروع: ${validation.errors.map(e => e.messageAr).join(' | ')}`);
    }

    // 5. Server-Authoritative Project Number & Code Generation (Only reached if validation passes)
    const serverProjectNumber = await ProjectNumberGenerator.getNextProjectNumber();
    const serverProjectCode = `Q-PRJ-${String(serverProjectNumber).padStart(3, '0')}`;

    // 6. Stamping & Storage (Server overrides any client-supplied projectCode/projectNumber)
    const newProject: Omit<ProjectEntity, 'createdAt' | 'updatedAt'> & { createdBy: string; updatedBy: string } = {
      ...normalizedInput,
      projectId: serverProjectCode,
      projectCode: serverProjectCode,
      projectNumber: serverProjectNumber,
      createdBy: context.userId,
      updatedBy: context.userId,
    };

    const sanitizedNewProject = sanitizeUndefined(newProject);

    await projectRepository.create(sanitizedNewProject as any);

    // 7. Audit Log
    await auditLogService.recordLog({
      projectId: serverProjectCode,
      entityType: 'PROJECT',
      entityId: serverProjectCode,
      action: 'CREATE',
      after: sanitizedNewProject,
    }, context);

    const finalProject = sanitizedNewProject as ProjectEntity;

    if (operationId) {
      this.idempotencyMap.set(operationId, finalProject);
    }

    return finalProject;
  }

  async updateProject(
    projectId: string,
    updates: Partial<ProjectEntity>,
    context: AuthUserContext
  ): Promise<void> {
    if (context.role !== 'PROJECT_ADMIN') {
      throw new Error('غير مصرح لك بتعديل بيانات المشروع');
    }

    const existing = await projectRepository.findById(projectId);
    if (!existing) {
      throw new Error('المشروع غير موجود');
    }

    // Ensure projectCode and projectNumber are immutable
    const { projectCode, projectNumber, ...sanitizedUpdates } = updates;
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
