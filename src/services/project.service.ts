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
    // 1. Domain Validation
    const validation = ProjectValidator.validate(payload);
    if (!validation.isValid) {
      throw new Error(`خطأ في التحقق من صحة المشروع: ${validation.errors.map(e => e.messageAr).join(' | ')}`);
    }

    // 2. Authorization check
    if (context.role !== 'PROJECT_ADMIN' && context.role !== 'SUPER_ADMIN') {
      throw new Error('غير مصرح لك: إنشاء المشاريع مقتصر فقط على مديري المشاريع (PROJECT_ADMIN)');
    }

    // 3. Server-Authoritative Project Number Generation
    const serverProjectNumber = await ProjectNumberGenerator.getNextProjectNumber();

    // 4. Stamping & Repositories (Server overrides any client-supplied projectNumber)
    const newProject: Omit<ProjectEntity, 'createdAt' | 'updatedAt'> & { createdBy: string; updatedBy: string } = {
      ...payload,
      projectNumber: serverProjectNumber,
      authorizedCarrierIds: payload.authorizedCarrierIds || [],
      authorizedMaterialIds: payload.authorizedMaterialIds || [],
      createdBy: context.userId,
      updatedBy: context.userId,
    };

    await projectRepository.create(newProject);

    // 5. Audit Log
    await auditLogService.recordLog({
      projectId: payload.projectId,
      entityType: 'PROJECT',
      entityId: payload.projectId,
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

    const merged = { ...existing, ...updates, projectId };
    const validation = ProjectValidator.validate(merged);
    if (!validation.isValid) {
      throw new Error(`خطأ في التحقق: ${validation.errors.map(e => e.messageAr).join(' | ')}`);
    }

    await projectRepository.update(projectId, updates, context.userId);

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
