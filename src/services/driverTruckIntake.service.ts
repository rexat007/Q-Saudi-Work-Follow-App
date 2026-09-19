import { runTransaction, Transaction } from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { driverRepository } from '../repositories/driver.repository';
import { truckRepository } from '../repositories/truck.repository';
import {
  projectDriverMembershipRepository,
  projectTruckMembershipRepository,
} from '../repositories/projectMembership.repository';
import {
  projectDriverCarrierAffiliationRepository,
  projectTruckCarrierAffiliationRepository,
} from '../repositories/projectCarrierAffiliation.repository';
import { projectDriverTruckAssignmentRepository } from '../repositories/projectDriverTruckAssignment.repository';
import { projectTruckMaterialAllocationRepository } from '../repositories/projectTruckMaterialAllocation.repository';
import { DriverEntity, TruckEntity } from '../types/entities';
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
  // rosterId is explicitly removed from canonical intake requirements
}

export interface DriverTruckIntakeResult {
  projectId: string;
  driverId: string;
  truckId: string;
  carrierId: string;
  materialId: string;
  driverMembershipStatus: string;
  truckMembershipStatus: string;
  driverCarrierAffiliationStatus: string;
  truckCarrierAffiliationStatus: string;
  assignmentId: string;
  allocationId: string;
}

export class DriverTruckIntakeService {
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
    const materialId = payload.materialId ? payload.materialId.trim() : '';
    const rawDriverName = payload.driverName ? payload.driverName.trim() : '';
    const rawPlate = payload.plateNumber ? payload.plateNumber.trim() : '';

    const normName = normalizeName(rawDriverName);
    const normPlate = normalizePlate(rawPlate);
    const phone = normalizePhone(payload.phone || '');
    const normIdNumber = normalizeIdNumber(payload.residencyId || '');

    // 1. Resolve Global Identities (Outside Transaction)
    // Unit 1 natural-key resolution
    const existingTrucks = await truckRepository.listByProject(projectId);
    const existingDrivers = await driverRepository.listByProject(projectId);

    let resolvedTruck = existingTrucks.find(
      (t) => t.normalizedPlate === normPlate || t.plate === rawPlate
    );
    if (!resolvedTruck) {
        // Create Truck (Unit 1)
        const truckId = `TRK-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;
        resolvedTruck = { truckId, plate: rawPlate.toUpperCase(), normalizedPlate: normPlate } as TruckEntity;
        await truckRepository.create({ ...resolvedTruck, projectId, carrierId, createdBy: context.userId, updatedBy: context.userId });
    }

    let resolvedDriver = existingDrivers.find(
      (d) => (normIdNumber && (d.idNumber === normIdNumber || d.nationalOrIqamaId === normIdNumber)) || d.normalizedName === normName
    );
    if (!resolvedDriver) {
        // Create Driver (Unit 1)
        const driverId = `DRV-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;
        resolvedDriver = { driverId, name: rawDriverName, normalizedName: normName } as DriverEntity;
        await driverRepository.create({ ...resolvedDriver, projectId, carrierId, createdBy: context.userId, updatedBy: context.userId });
    }

    // 2. Canonical Relationship Mutation Transaction (Unit 2A/B/C)
    return await runTransaction(db, async (transaction) => {
        // Membership
        const driverMem = await projectDriverMembershipRepository.attachMember(projectId, resolvedDriver!.driverId, context.userId, undefined, transaction);
        const truckMem = await projectTruckMembershipRepository.attachMember(projectId, resolvedTruck!.truckId, context.userId, undefined, transaction);
        
        // Affiliations
        const driverAffil = await projectDriverCarrierAffiliationRepository.createAffiliation(projectId, resolvedDriver!.driverId, carrierId, context.userId, transaction);
        const truckAffil = await projectTruckCarrierAffiliationRepository.createAffiliation(projectId, resolvedTruck!.truckId, carrierId, context.userId, transaction);
        
        // Assignment
        const assignResult = await projectDriverTruckAssignmentRepository.assignDriverToTruck(projectId, resolvedDriver!.driverId, resolvedTruck!.truckId, context.userId);
        
        // Allocation
        const allocResult = await projectTruckMaterialAllocationRepository.allocateTruckToMaterial(projectId, resolvedTruck!.truckId, materialId, context.userId);
        
        return {
            projectId,
            driverId: resolvedDriver!.driverId,
            truckId: resolvedTruck!.truckId,
            carrierId,
            materialId,
            driverMembershipStatus: driverMem.status,
            truckMembershipStatus: truckMem.status,
            driverCarrierAffiliationStatus: driverAffil.status,
            truckCarrierAffiliationStatus: truckAffil.status,
            assignmentId: assignResult.assignment.assignmentId,
            allocationId: allocResult.allocationId
        };
    });
  }
}

export const driverTruckIntakeService = new DriverTruckIntakeService();
