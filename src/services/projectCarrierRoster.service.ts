import { projectCarrierRosterRepository } from '../repositories/projectCarrierRoster.repository';
import { ProjectCarrierRosterEntity } from '../types/entities';
import { AuthUserContext, ValidationResult } from '../types/common';
import { auditLogService } from './auditLog.service';

export class ProjectCarrierRosterService {
  /**
   * Validate a project carrier roster row entry.
   */
  validateRosterEntry(entry: Partial<ProjectCarrierRosterEntity>): ValidationResult {
    const errors = [];

    if (!entry.projectId || !entry.projectId.trim()) {
      errors.push({
        field: 'projectId',
        code: 'REQUIRED',
        messageAr: 'معرف المشروع مطلوب',
        messageEn: 'Project ID is required',
      });
    }

    if (!entry.carrierId || !entry.carrierId.trim()) {
      errors.push({
        field: 'carrierId',
        code: 'REQUIRED',
        messageAr: 'معرف الناقل مطلوب',
        messageEn: 'Carrier ID is required',
      });
    }

    if (!entry.driverName || entry.driverName.trim().length < 2) {
      errors.push({
        field: 'driverName',
        code: 'INVALID_LENGTH',
        messageAr: 'اسم السائق مطلوب ويجب ألا يقل عن حرفين',
        messageEn: 'Driver name must be at least 2 characters',
      });
    }

    if (!entry.plateNumber || !entry.plateNumber.trim()) {
      errors.push({
        field: 'plateNumber',
        code: 'REQUIRED',
        messageAr: 'رقم لوحة الشاحنة مطلوب',
        messageEn: 'Plate number is required',
      });
    }

    if (!entry.phone || !/^\+?[0-9]{10,15}$/.test(entry.phone)) {
      errors.push({
        field: 'phone',
        code: 'INVALID_FORMAT',
        messageAr: 'رقم الهاتف غير صالح',
        messageEn: 'Invalid phone format',
      });
    }

    if (!entry.materialId || !entry.materialId.trim()) {
      errors.push({
        field: 'materialId',
        code: 'REQUIRED',
        messageAr: 'معرف المادة مطلوب',
        messageEn: 'Material ID is required',
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Verify RBAC roles and project isolation membership.
   */
  private checkModificationAccess(projectId: string, context: AuthUserContext) {
    const isSuperAdmin = context.role === 'SUPER_ADMIN';
    const isProjectAdmin = context.role === 'PROJECT_ADMIN';
    
    if (!isSuperAdmin && !isProjectAdmin) {
      throw new Error('غير مصرح لك: تعديل سجلات التشغيل مقتصر فقط على مدير المشروع أو مدير النظام');
    }

    if (!isSuperAdmin && context.assignedProjectIds && !context.assignedProjectIds.includes(projectId)) {
      throw new Error(`عزل أمني: المستخدم (${context.userId}) غير مصرح له بتعديل بيانات المشروع (${projectId})`);
    }
  }

  private checkReadAccess(projectId: string, context: AuthUserContext) {
    const isSuperAdmin = context.role === 'SUPER_ADMIN';
    if (isSuperAdmin) return;

    if (context.assignedProjectIds && !context.assignedProjectIds.includes(projectId)) {
      throw new Error(`عزل أمني: المستخدم (${context.userId}) غير مصرح له بالوصول لبيانات المشروع (${projectId})`);
    }
  }

  async getRosterByProject(projectId: string, context: AuthUserContext): Promise<ProjectCarrierRosterEntity[]> {
    this.checkReadAccess(projectId, context);
    return projectCarrierRosterRepository.listByProject(projectId);
  }

  async getRosterEntry(projectId: string, rosterId: string, context: AuthUserContext): Promise<ProjectCarrierRosterEntity | null> {
    this.checkReadAccess(projectId, context);
    return projectCarrierRosterRepository.findById(projectId, rosterId);
  }

  async addRosterEntry(entry: Omit<ProjectCarrierRosterEntity, 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>, context: AuthUserContext): Promise<ProjectCarrierRosterEntity> {
    this.checkModificationAccess(entry.projectId, context);

    const validation = this.validateRosterEntry(entry);
    if (!validation.isValid) {
      throw new Error(`خطأ في التحقق من البيانات: ${validation.errors.map(e => e.messageAr).join(' | ')}`);
    }

    const newEntry: Omit<ProjectCarrierRosterEntity, 'createdAt' | 'updatedAt'> & { createdBy: string; updatedBy: string } = {
      ...entry,
      createdBy: context.userId,
      updatedBy: context.userId,
    };

    await projectCarrierRosterRepository.create(newEntry);

    await auditLogService.recordLog({
      projectId: entry.projectId,
      entityType: 'PROJECT',
      entityId: entry.rosterId,
      action: 'CREATE',
      after: newEntry,
    }, context);

    return newEntry as ProjectCarrierRosterEntity;
  }

  async updateRosterEntry(projectId: string, rosterId: string, updates: Partial<ProjectCarrierRosterEntity>, context: AuthUserContext): Promise<ProjectCarrierRosterEntity> {
    this.checkModificationAccess(projectId, context);

    const existing = await projectCarrierRosterRepository.findById(projectId, rosterId);
    if (!existing) {
      throw new Error('سجل التشغيل غير موجود');
    }

    const merged = { ...existing, ...updates, projectId, rosterId };
    const validation = this.validateRosterEntry(merged);
    if (!validation.isValid) {
      throw new Error(`خطأ في التحقق من البيانات: ${validation.errors.map(e => e.messageAr).join(' | ')}`);
    }

    await projectCarrierRosterRepository.update(projectId, rosterId, updates, context.userId);

    await auditLogService.recordLog({
      projectId,
      entityType: 'PROJECT',
      entityId: rosterId,
      action: 'UPDATE',
      before: existing,
      after: merged,
    }, context);

    return merged;
  }

  async deleteRosterEntry(projectId: string, rosterId: string, context: AuthUserContext): Promise<void> {
    this.checkModificationAccess(projectId, context);

    const existing = await projectCarrierRosterRepository.findById(projectId, rosterId);
    if (!existing) {
      throw new Error('سجل التشغيل غير موجود');
    }

    await projectCarrierRosterRepository.delete(projectId, rosterId);

    await auditLogService.recordLog({
      projectId,
      entityType: 'PROJECT',
      entityId: rosterId,
      action: 'DELETE',
      before: existing,
      after: {},
    }, context);
  }
}

export const projectCarrierRosterService = new ProjectCarrierRosterService();
