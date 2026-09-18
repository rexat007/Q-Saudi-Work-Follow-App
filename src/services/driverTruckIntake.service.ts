import { runTransaction, Transaction } from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { driverRepository } from '../repositories/driver.repository';
import { truckRepository } from '../repositories/truck.repository';
import { projectCarrierRosterRepository } from '../repositories/projectCarrierRoster.repository';
import { DriverEntity, TruckEntity, ProjectCarrierRosterEntity } from '../types/entities';
import { AuthUserContext } from '../types/common';
import { auditLogService } from './auditLog.service';
import { normalizeName, normalizePlate, normalizePhone, normalizeIdNumber } from '../utils/normalization';

export interface DriverTruckIntakePayload {
  projectId: string;
  carrierId: string;
  materialId: string;
  driverName: string;
  plateNumber: string;
  phone?: string;
  residencyId?: string;
  truckType?: 'TIPPER_32M3' | 'TRAILER_24M' | 'FLATBED' | 'DUMPER';
  tareWeightKg?: number;
  maxGrossWeightKg?: number;
  rosterId?: string;
}

export interface DriverTruckIntakeResult {
  roster: ProjectCarrierRosterEntity;
  driver: DriverEntity;
  truck: TruckEntity;
}

export class DriverTruckIntakeService {
  /**
   * Verify RBAC roles and project isolation membership.
   */
  private checkModificationAccess(projectId: string, context: AuthUserContext) {
    const isSuperAdmin = context.role === 'SUPER_ADMIN';
    const isProjectAdmin = context.role === 'PROJECT_ADMIN';
    
    if (!isSuperAdmin && !isProjectAdmin) {
      throw new Error('غير مصرح لك: تسجيل السائقين والشاحنات مقتصر على مدير المشروع أو مدير النظام');
    }

    if (!isSuperAdmin && context.assignedProjectIds && !context.assignedProjectIds.includes(projectId)) {
      throw new Error(`عزل أمني: المستخدم (${context.userId}) غير مصرح له بالتعديل على بيانات المشروع (${projectId})`);
    }
  }

  /**
   * Canonical Project Driver & Truck Intake Workflow with Atomic Transaction Boundary.
   * Conceptually:
   * PROJECT -> SHARED INTAKE -> NORMALIZE -> TRANSACTION (RESOLVE DRIVER & TRUCK -> CREATE/REUSE GLOBAL ENTITIES -> CREATE/UPDATE ROSTER) -> COMMIT -> AUDIT
   */
  async processSharedIntake(
    payload: DriverTruckIntakePayload,
    context: AuthUserContext
  ): Promise<DriverTruckIntakeResult> {
    const projectId = payload.projectId ? payload.projectId.trim() : '';
    if (!projectId) {
      throw new Error('معرف المشروع مطلوب');
    }

    this.checkModificationAccess(projectId, context);

    const carrierId = payload.carrierId ? payload.carrierId.trim() : '';
    if (!carrierId) {
      throw new Error('معرف الناقل مطلوب (العلاقة: Driver/Truck → Carrier)');
    }

    const materialId = payload.materialId ? payload.materialId.trim() : '';
    if (!materialId) {
      throw new Error('معرف المادة المعتمَدة مطلوب');
    }

    const rawDriverName = payload.driverName ? payload.driverName.trim() : '';
    if (!rawDriverName || rawDriverName.length < 2) {
      throw new Error('اسم السائق مطلوب ويجب ألا يقل عن حرفين');
    }

    const rawPlate = payload.plateNumber ? payload.plateNumber.trim() : '';
    if (!rawPlate) {
      throw new Error('رقم لوحة الشاحنة مطلوب');
    }

    const normName = normalizeName(rawDriverName);
    const normPlate = normalizePlate(rawPlate);
    const phone = normalizePhone(payload.phone || '');
    const normIdNumber = normalizeIdNumber(payload.residencyId || '');

    // Queue audit actions to record after successful transaction commit
    let auditActions: Array<() => Promise<void>> = [];

    const executeTransactionalIntake = async (transaction?: Transaction): Promise<DriverTruckIntakeResult> => {
      auditActions = [];

      // READ PHASE (Must occur before writes according to Firestore transaction rules)
      const existingTrucks = await truckRepository.listByProject(projectId);
      const existingDrivers = await driverRepository.listByProject(projectId);
      const existingRosters = await projectCarrierRosterRepository.listByProject(projectId);

      // 1. Resolve or Create Global Truck Entity
      let resolvedTruck = existingTrucks.find(
        (t) => t.normalizedPlate === normPlate || t.plate === rawPlate
      );

      let createdNewTruck = false;
      let newTruckPayload: (Omit<TruckEntity, 'createdAt' | 'updatedAt'> & { createdBy: string; updatedBy: string }) | undefined;

      if (!resolvedTruck) {
        const truckId = `TRK-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;
        const tareWeightKg = payload.tareWeightKg || 14000;
        const maxGrossWeightKg = payload.maxGrossWeightKg || 45000;

        newTruckPayload = {
          truckId,
          projectId,
          carrierId,
          plate: rawPlate.toUpperCase(),
          normalizedPlate: normPlate,
          plateNumberAr: rawPlate,
          truckType: payload.truckType || 'TIPPER_32M3',
          status: 'ACTIVE',
          isActive: true,
          tareWeightKg,
          maxGrossWeightKg,
          legalPayloadLimitKg: Math.max(0, maxGrossWeightKg - tareWeightKg),
          createdBy: context.userId,
          updatedBy: context.userId,
        };

        await truckRepository.create(newTruckPayload, transaction);
        resolvedTruck = newTruckPayload as TruckEntity;
        createdNewTruck = true;
      }

      // 2. Resolve or Create Global Driver Entity
      let resolvedDriver = existingDrivers.find(
        (d) =>
          (normIdNumber && (d.idNumber === normIdNumber || d.nationalOrIqamaId === normIdNumber)) ||
          d.normalizedName === normName
      );

      let createdNewDriver = false;
      let newDriverPayload: (Omit<DriverEntity, 'createdAt' | 'updatedAt'> & { createdBy: string; updatedBy: string }) | undefined;

      if (!resolvedDriver) {
        const driverId = `DRV-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;

        newDriverPayload = {
          driverId,
          projectId,
          carrierId,
          name: rawDriverName,
          normalizedName: normName,
          fullNameAr: rawDriverName,
          phone,
          idNumber: normIdNumber,
          nationalOrIqamaId: normIdNumber,
          status: 'ACTIVE',
          isActive: true,
          currentAssignedTruckId: resolvedTruck.truckId,
          createdBy: context.userId,
          updatedBy: context.userId,
        };

        await driverRepository.create(newDriverPayload, transaction);
        resolvedDriver = newDriverPayload as DriverEntity;
        createdNewDriver = true;
      } else {
        if (resolvedDriver.currentAssignedTruckId !== resolvedTruck.truckId) {
          await driverRepository.update(projectId, resolvedDriver.driverId, {
            currentAssignedTruckId: resolvedTruck.truckId,
          }, context.userId, transaction);
          resolvedDriver.currentAssignedTruckId = resolvedTruck.truckId;
        }
      }

      // 3. Create or Update Project Carrier Roster Record
      let existingRoster = existingRosters.find(
        (r) =>
          (payload.rosterId && r.rosterId === payload.rosterId) ||
          (r.globalDriverId && r.globalDriverId === resolvedDriver!.driverId && r.plateNumber === rawPlate.toUpperCase()) ||
          (normalizeName(r.driverName) === normName && normalizePlate(r.plateNumber) === normPlate)
      );

      let finalRoster: ProjectCarrierRosterEntity;

      if (existingRoster) {
        const updates: Partial<ProjectCarrierRosterEntity> = {
          carrierId,
          materialId,
          driverName: rawDriverName,
          plateNumber: rawPlate.toUpperCase(),
          phone: phone || existingRoster.phone,
          residencyId: normIdNumber || existingRoster.residencyId,
          globalDriverId: resolvedDriver.driverId,
          status: 'ACTIVE',
        };

        await projectCarrierRosterRepository.update(projectId, existingRoster.rosterId, updates, context.userId, transaction);
        finalRoster = { ...existingRoster, ...updates };

        const prevRoster = existingRoster;
        const updatedRoster = finalRoster;
        auditActions.push(async () => {
          await auditLogService.recordLog({
            projectId,
            entityType: 'PROJECT',
            entityId: prevRoster.rosterId,
            action: 'UPDATE',
            before: prevRoster,
            after: updatedRoster,
          }, context);
        });
      } else {
        const rosterId = payload.rosterId || `RST-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;
        const newRosterPayload: Omit<ProjectCarrierRosterEntity, 'createdAt' | 'updatedAt'> & { createdBy: string; updatedBy: string } = {
          rosterId,
          projectId,
          carrierId,
          materialId,
          driverName: rawDriverName,
          plateNumber: rawPlate.toUpperCase(),
          phone,
          residencyId: normIdNumber,
          globalDriverId: resolvedDriver.driverId,
          status: 'ACTIVE',
          createdBy: context.userId,
          updatedBy: context.userId,
        };

        await projectCarrierRosterRepository.create(newRosterPayload, transaction);
        finalRoster = newRosterPayload as ProjectCarrierRosterEntity;

        const createdRoster = newRosterPayload;
        auditActions.push(async () => {
          await auditLogService.recordLog({
            projectId,
            entityType: 'PROJECT',
            entityId: rosterId,
            action: 'CREATE',
            after: createdRoster,
          }, context);
        });
      }

      if (createdNewTruck && newTruckPayload) {
        const trkPayload = newTruckPayload;
        auditActions.push(async () => {
          await auditLogService.recordLog({
            projectId,
            entityType: 'TRUCK',
            entityId: trkPayload.truckId,
            action: 'CREATE',
            after: trkPayload,
          }, context);
        });
      }

      if (createdNewDriver && newDriverPayload) {
        const drvPayload = newDriverPayload;
        auditActions.push(async () => {
          await auditLogService.recordLog({
            projectId,
            entityType: 'DRIVER' as any,
            entityId: drvPayload.driverId,
            action: 'CREATE',
            after: drvPayload,
          }, context);
        });
      }

      return {
        roster: finalRoster,
        driver: resolvedDriver,
        truck: resolvedTruck,
      };
    };

    // ATOMIC TRANSACTION EXECUTION BOUNDARY
    let result: DriverTruckIntakeResult;
    if (auth.currentUser) {
      result = await runTransaction(db, async (transaction) => {
        return await executeTransactionalIntake(transaction);
      });
    } else {
      result = await executeTransactionalIntake();
    }

    // POST-TRANSACTION AUDIT LOGGING
    for (const auditAction of auditActions) {
      try {
        await auditAction();
      } catch (e) {
        console.warn('[DriverTruckIntakeService] Non-blocking audit logging warning:', e);
      }
    }

    return result;
  }
}

export const driverTruckIntakeService = new DriverTruckIntakeService();
