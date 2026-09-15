import { projectRepository } from '../repositories/project.repository';
import { ProjectValidator } from '../validators/project.validator';
import { ProjectEntity } from '../types/entities';
import { AuthUserContext } from '../types/common';
import { auditLogService } from './auditLog.service';
import { ProjectNumberGenerator } from './projectNumberGenerator';

export class ProjectService {
  async getProject(projectId: string): Promise<ProjectEntity | null> {
    return projectRepository.findById(projectId);
  }

  async getAllProjects(context?: AuthUserContext): Promise<ProjectEntity[]> {
    const isSuperAdmin = context?.role === 'SUPER_ADMIN';
    return projectRepository.listAll(context?.assignedProjectIds, isSuperAdmin);
  }

  async createProject(
    payload: Omit<ProjectEntity, 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>,
    context: AuthUserContext
  ): Promise<ProjectEntity> {
    // 1. Authorization check
    if (context.role !== 'PROJECT_ADMIN' && context.role !== 'SUPER_ADMIN') {
      throw new Error('غير مصرح لك: إنشاء المشاريع مقتصر فقط على مديري المشاريع (PROJECT_ADMIN)');
    }

    // 2. Server-Authoritative Project Number & Code Generation
    const serverProjectNumber = await ProjectNumberGenerator.getNextProjectNumber();
    const serverProjectCode = `Q-PRJ-${String(serverProjectNumber).padStart(3, '0')}`;

    // 3. Stamping & Repositories (Server overrides/rejects any client-supplied identifiers)
    const newProject: Omit<ProjectEntity, 'createdAt' | 'updatedAt'> & { createdBy: string; updatedBy: string } = {
      ...payload,
      projectId: serverProjectCode,
      projectCode: serverProjectCode,
      projectNumber: serverProjectNumber,
      authorizedCarrierIds: payload.authorizedCarrierIds || [],
      authorizedMaterialIds: payload.authorizedMaterialIds || [],
      createdBy: context.userId,
      updatedBy: context.userId,
    };

    // 4. Domain Validation using server-generated/sanitized payload
    const validation = ProjectValidator.validate(newProject);
    if (!validation.isValid) {
      throw new Error(`خطأ في التحقق من صحة المشروع: ${validation.errors.map(e => e.messageAr).join(' | ')}`);
    }

    await projectRepository.create(newProject);

    // 5. Audit Log
    await auditLogService.recordLog({
      projectId: newProject.projectId,
      entityType: 'PROJECT',
      entityId: newProject.projectId,
      action: 'CREATE',
      after: newProject,
    }, context);

    return newProject as ProjectEntity;
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
