import { AuthUserContext } from '../types/common';
import { DriverTruckIntakePayload, DriverTruckIntakeResult } from './driverTruckIntake.service';
import { CanonicalFleetRelationshipPolicy, PureAffiliation, PureAssignment, PureAllocation } from '../utils/canonicalFleetRelationshipPolicy';

export class DriverTruckIntakeServer {
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

    const {
      carrierId,
      materialId,
      driverName,
      plateNumber,
      phone: rawPhone,
      residencyId,
      truckType,
      tareWeightKg,
      maxGrossWeightKg,
    } = payload;

    if (!carrierId || !carrierId.trim()) throw new Error('معرف الناقل مطلوب');
    if (!materialId || !materialId.trim()) throw new Error('معرف المادة مطلوب');
    if (!driverName || !driverName.trim()) throw new Error('اسم السائق مطلوب');
    if (!plateNumber || !plateNumber.trim()) throw new Error('رقم لوحة الشاحنة مطلوب');
    if (!residencyId || !residencyId.trim()) {
      throw new Error('رقم الهوية الوطنية أو الإقامة مطلوب وغير موجود');
    }

    // Node.js transaction logic using adminDb
    const { normalizeArabicText, normalizeName, normalizePlate, normalizePhone, normalizeIdNumber } = await import('../utils/normalization');
    const { computeNaturalKeyToken } = await import('../repositories/globalIdentity.repository');
    const { adminDb } = await import('../firebase/admin');

    const normName = normalizeName(driverName);
    const normPlate = normalizePlate(plateNumber);
    const phone = normalizePhone(rawPhone || '');
    const normIdNumber = normalizeIdNumber(residencyId);

    if (!normIdNumber || !/^[1-2][0-9]{9}$/.test(normIdNumber)) {
      throw new Error('رقم الهوية الوطنية أو الإقامة غير صالح. يجب أن يتكون من 10 خانات ويبدأ بـ 1 أو 2');
    }

    const lookupTokenDriver = computeNaturalKeyToken('DRIVER', normIdNumber);
    const lookupTokenTruck = computeNaturalKeyToken('TRUCK', normPlate);

    const nowIso = new Date().toISOString();
    const actorId = context.userId || 'system-server';

    return await adminDb.runTransaction(async (transaction) => {
      // ----------------------------------------------------
      // PHASE 1: ALL READS FIRST
      // ----------------------------------------------------
      const lookupRefDriver = adminDb.collection('natural_identity_lookups').doc(lookupTokenDriver);
      const lookupRefTruck = adminDb.collection('natural_identity_lookups').doc(lookupTokenTruck);
      const carrierMemRef = adminDb.collection('projects').doc(projectId).collection('carrier_memberships').doc(carrierId);
      const materialMemRef = adminDb.collection('projects').doc(projectId).collection('material_memberships').doc(materialId);

      const [lookupSnapDriver, lookupSnapTruck, carrierMemSnap, materialMemSnap] = await Promise.all([
        transaction.get(lookupRefDriver),
        transaction.get(lookupRefTruck),
        transaction.get(carrierMemRef),
        transaction.get(materialMemRef),
      ]);

      if (!carrierMemSnap.exists || carrierMemSnap.data()?.status !== 'ACTIVE') {
        throw new Error(`CARRIER_NOT_ACTIVE_IN_PROJECT: Carrier ${carrierId} is not active in project ${projectId}`);
      }
      if (!materialMemSnap.exists || materialMemSnap.data()?.status !== 'ACTIVE') {
        throw new Error(`MATERIAL_NOT_ACTIVE_IN_PROJECT: Material ${materialId} is not active in project ${projectId}`);
      }

      let driverId = lookupSnapDriver.exists ? lookupSnapDriver.data()?.systemId : null;
      let truckId = lookupSnapTruck.exists ? lookupSnapTruck.data()?.systemId : null;

      const driverRef = driverId ? adminDb.collection('drivers').doc(driverId) : null;
      const truckRef = truckId ? adminDb.collection('trucks').doc(truckId) : null;

      // GET GLOBAL SNAPS
      const driverSnap = driverRef ? await transaction.get(driverRef) : null;
      const truckSnap = truckRef ? await transaction.get(truckRef) : null;

      // NATURAL IDENTITY LOOKUP INTEGRITY CHECK
      if (lookupSnapDriver.exists && (!driverSnap || !driverSnap.exists)) {
        throw new Error('IDENTITY_LOOKUP_INTEGRITY_ERROR: Natural lookup exists for driver but Global Driver document is missing.');
      }
      if (lookupSnapTruck.exists && (!truckSnap || !truckSnap.exists)) {
        throw new Error('IDENTITY_LOOKUP_INTEGRITY_ERROR: Natural lookup exists for truck but Global Truck document is missing.');
      }

      const driverMemRef = driverId ? adminDb.collection('projects').doc(projectId).collection('driver_memberships').doc(driverId) : null;
      const truckMemRef = truckId ? adminDb.collection('projects').doc(projectId).collection('truck_memberships').doc(truckId) : null;
      const driverAffilRef = driverId ? adminDb.collection('projects').doc(projectId).collection('driver_carrier_affiliations').doc(driverId) : null;
      const truckAffilRef = truckId ? adminDb.collection('projects').doc(projectId).collection('truck_carrier_affiliations').doc(truckId) : null;

      const driverSlotRef = driverId ? adminDb.collection('projects').doc(projectId).collection('driver_active_assignments').doc(driverId) : null;
      const truckSlotRef = truckId ? adminDb.collection('projects').doc(projectId).collection('truck_active_assignments').doc(truckId) : null;
      const truckAllocSlotRef = truckId ? adminDb.collection('projects').doc(projectId).collection('truck_active_material_allocations').doc(truckId) : null;

      const driverMemSnap = driverMemRef ? await transaction.get(driverMemRef) : null;
      const truckMemSnap = truckMemRef ? await transaction.get(truckMemRef) : null;
      const driverAffilSnap = driverAffilRef ? await transaction.get(driverAffilRef) : null;
      const truckAffilSnap = truckAffilRef ? await transaction.get(truckAffilRef) : null;

      const driverSlotSnap = driverSlotRef ? await transaction.get(driverSlotRef) : null;
      const truckSlotSnap = truckSlotRef ? await transaction.get(truckSlotRef) : null;
      const truckAllocSlotSnap = truckAllocSlotRef ? await transaction.get(truckAllocSlotRef) : null;

      const currentDriverSlot = driverSlotSnap && driverSlotSnap.exists ? (driverSlotSnap.data() as { assignmentId: string }) : null;
      const currentTruckSlot = truckSlotSnap && truckSlotSnap.exists ? (truckSlotSnap.data() as { assignmentId: string }) : null;
      const currentTruckAllocSlot = truckAllocSlotSnap && truckAllocSlotSnap.exists ? (truckAllocSlotSnap.data() as { allocationId: string }) : null;

      let dAssign: PureAssignment | null = null;
      let tAssign: PureAssignment | null = null;
      let tAlloc: PureAllocation | null = null;

      if (currentDriverSlot?.assignmentId) {
        const dAssignRef = adminDb.collection('projects').doc(projectId).collection('driver_truck_assignments').doc(currentDriverSlot.assignmentId);
        const snap = await transaction.get(dAssignRef);
        if (snap.exists) dAssign = snap.data() as PureAssignment;
      }
      if (currentTruckSlot?.assignmentId && currentTruckSlot.assignmentId !== currentDriverSlot?.assignmentId) {
        const tAssignRef = adminDb.collection('projects').doc(projectId).collection('driver_truck_assignments').doc(currentTruckSlot.assignmentId);
        const snap = await transaction.get(tAssignRef);
        if (snap.exists) tAssign = snap.data() as PureAssignment;
      }
      if (currentTruckAllocSlot?.allocationId) {
        const tAllocRef = adminDb.collection('projects').doc(projectId).collection('truck_material_allocations').doc(currentTruckAllocSlot.allocationId);
        const snap = await transaction.get(tAllocRef);
        if (snap.exists) tAlloc = snap.data() as PureAllocation;
      }

      let counterpartTruckSlotSnap: any = null;
      let counterpartTruckSlotRef: any = null;
      if (dAssign && dAssign.status === 'ACTIVE' && dAssign.truckId !== truckId) {
        counterpartTruckSlotRef = adminDb.collection('projects').doc(projectId).collection('truck_active_assignments').doc(dAssign.truckId);
        counterpartTruckSlotSnap = await transaction.get(counterpartTruckSlotRef);
      }

      let counterpartDriverSlotSnap: any = null;
      let counterpartDriverSlotRef: any = null;
      if (tAssign && tAssign.status === 'ACTIVE' && tAssign.driverId !== driverId) {
        counterpartDriverSlotRef = adminDb.collection('projects').doc(projectId).collection('driver_active_assignments').doc(tAssign.driverId);
        counterpartDriverSlotSnap = await transaction.get(counterpartDriverSlotRef);
      }

      // =================================--------------------
      // EVALUATE RELATIONSHIPS VIA PURE CANONICAL POLICY
      // =================================--------------------
      const driverAffilExisting = driverAffilSnap && driverAffilSnap.exists ? (driverAffilSnap.data() as PureAffiliation) : null;
      const driverAffilDecision = CanonicalFleetRelationshipPolicy.evaluateAffiliation(
        { projectId, entityId: driverId || '', carrierId, entityType: 'driver' },
        driverAffilExisting,
        true // isIntake = true
      );

      const truckAffilExisting = truckAffilSnap && truckAffilSnap.exists ? (truckAffilSnap.data() as PureAffiliation) : null;
      const truckAffilDecision = CanonicalFleetRelationshipPolicy.evaluateAffiliation(
        { projectId, entityId: truckId || '', carrierId, entityType: 'truck' },
        truckAffilExisting,
        true // isIntake = true
      );

      if (driverId && truckId) {
        CanonicalFleetRelationshipPolicy.validateAssignmentPointers(
          driverId,
          truckId,
          currentDriverSlot,
          currentTruckSlot,
          dAssign,
          tAssign
        );
      }

      CanonicalFleetRelationshipPolicy.validateAllocationPointers(
        projectId,
        truckId || '',
        currentTruckAllocSlot,
        tAlloc
      );

      // ----------------------------------------------------
      // PHASE 2: ALL WRITES
      // ----------------------------------------------------
      // Secure local transaction audit creator helper
      const createAuditLog = (
        auditLogId: string,
        entityType: string,
        entityId: string,
        action: string,
        changes: any,
        correlationId: string
      ) => {
        const auditLogRef = adminDb.collection('audit_logs').doc(auditLogId);
        transaction.set(auditLogRef, {
          auditLogId,
          projectId,
          entityType,
          entityId,
          action,
          actor: {
            userId: actorId,
            email: context.email || 'system@q-saudi.com',
            role: context.role || 'PROJECT_ADMIN',
          },
          changes,
          correlationId,
          createdBy: actorId,
          updatedBy: actorId,
          createdAt: nowIso,
          updatedAt: nowIso,
        });
      };

      if (!driverId) {
        const hashHex = require('crypto').randomBytes(16).toString('hex');
        driverId = `DRV-${hashHex}`;
        const newDriverRef = adminDb.collection('drivers').doc(driverId);
        transaction.set(newDriverRef, {
          driverId,
          nationalId: normIdNumber,
          fullNameAr: normalizeArabicText(driverName),
          phone,
          status: 'ACTIVE',
          createdAt: nowIso,
          createdBy: actorId,
          updatedAt: nowIso,
          updatedBy: actorId,
        });

        transaction.set(lookupRefDriver, {
          systemId: driverId,
          entityType: 'DRIVER',
          createdAt: nowIso,
        });
      }

      if (!truckId) {
        const hashHex = require('crypto').randomBytes(16).toString('hex');
        truckId = `TRK-${hashHex}`;
        const tare = tareWeightKg || 14000;
        const gross = maxGrossWeightKg || 45000;
        const legalPayloadLimit = gross > tare ? gross - tare : undefined;

        const newTruckRef = adminDb.collection('trucks').doc(truckId);
        transaction.set(newTruckRef, {
          truckId,
          plate: plateNumber.trim(),
          normalizedPlate: normPlate,
          truckType: truckType || 'TIPPER_32M3',
          tareWeightKg: tare,
          maxGrossWeightKg: gross,
          legalPayloadLimitKg: legalPayloadLimit,
          status: 'ACTIVE',
          createdAt: nowIso,
          createdBy: actorId,
          updatedAt: nowIso,
          updatedBy: actorId,
        });

        transaction.set(lookupRefTruck, {
          systemId: truckId,
          entityType: 'TRUCK',
          createdAt: nowIso,
        });
      }

      const finalDriverMemRef = adminDb.collection('projects').doc(projectId).collection('driver_memberships').doc(driverId);
      const finalTruckMemRef = adminDb.collection('projects').doc(projectId).collection('truck_memberships').doc(truckId);
      const finalDriverAffilRef = adminDb.collection('projects').doc(projectId).collection('driver_carrier_affiliations').doc(driverId);
      const finalTruckAffilRef = adminDb.collection('projects').doc(projectId).collection('truck_carrier_affiliations').doc(truckId);

      const finalDriverSlotRef = adminDb.collection('projects').doc(projectId).collection('driver_active_assignments').doc(driverId);
      const finalTruckSlotRef = adminDb.collection('projects').doc(projectId).collection('truck_active_assignments').doc(truckId);
      const finalTruckAllocSlotRef = adminDb.collection('projects').doc(projectId).collection('truck_active_material_allocations').doc(truckId);

      if (!driverMemSnap || !driverMemSnap.exists) {
        transaction.set(finalDriverMemRef, {
          projectId,
          driverId,
          status: 'ACTIVE',
          statusChangedAt: nowIso,
          createdAt: nowIso,
          updatedAt: nowIso,
          createdBy: actorId,
          updatedBy: actorId,
        });
      } else if (driverMemSnap.data()?.status !== 'ACTIVE') {
        throw new Error(`MEMBERSHIP_STATE_CONFLICT: Entity "${driverId}" is currently "${driverMemSnap.data()?.status}" in Project "${projectId}".`);
      }

      if (!truckMemSnap || !truckMemSnap.exists) {
        transaction.set(finalTruckMemRef, {
          projectId,
          truckId,
          status: 'ACTIVE',
          statusChangedAt: nowIso,
          createdAt: nowIso,
          updatedAt: nowIso,
          createdBy: actorId,
          updatedBy: actorId,
        });
      } else if (truckMemSnap.data()?.status !== 'ACTIVE') {
        throw new Error(`MEMBERSHIP_STATE_CONFLICT: Entity "${truckId}" is currently "${truckMemSnap.data()?.status}" in Project "${projectId}".`);
      }

      // Write Driver Affiliation changes
      if (driverAffilDecision.action === 'CREATE') {
        transaction.set(finalDriverAffilRef, {
          projectId,
          driverId,
          carrierId,
          status: 'ACTIVE',
          statusChangedAt: nowIso,
          createdAt: nowIso,
          createdBy: actorId,
          updatedAt: nowIso,
          updatedBy: actorId,
        });
        createAuditLog(
          `AUD-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          'CARRIER',
          driverId,
          'CREATE',
          {
            before: null,
            after: { carrierId, status: 'ACTIVE', eventCode: 'DRIVER_CARRIER_AFFILIATION_SET' },
            deltaFields: ['carrierId', 'status', 'updatedAt', 'updatedBy'],
          },
          `AFFIL-${projectId}-${driverId}`
        );
      } else if (driverAffilDecision.action === 'REACTIVATE' || driverAffilDecision.action === 'REASSIGN') {
        transaction.update(finalDriverAffilRef, {
          status: 'ACTIVE',
          statusChangedAt: nowIso,
          updatedAt: nowIso,
          updatedBy: actorId,
        });
        createAuditLog(
          `AUD-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          'CARRIER',
          driverId,
          'UPDATE',
          {
            before: driverAffilExisting ? { carrierId: driverAffilExisting.carrierId, status: driverAffilExisting.status } : null,
            after: { carrierId, status: 'ACTIVE', eventCode: 'DRIVER_CARRIER_AFFILIATION_CHANGED' },
            deltaFields: ['carrierId', 'status', 'updatedAt', 'updatedBy'],
          },
          `AFFIL-${projectId}-${driverId}`
        );
      }

      // Write Truck Affiliation changes
      if (truckAffilDecision.action === 'CREATE') {
        transaction.set(finalTruckAffilRef, {
          projectId,
          truckId,
          carrierId,
          status: 'ACTIVE',
          statusChangedAt: nowIso,
          createdAt: nowIso,
          createdBy: actorId,
          updatedAt: nowIso,
          updatedBy: actorId,
        });
        createAuditLog(
          `AUD-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          'TRUCK',
          truckId,
          'CREATE',
          {
            before: null,
            after: { carrierId, status: 'ACTIVE', eventCode: 'TRUCK_CARRIER_AFFILIATION_SET' },
            deltaFields: ['carrierId', 'status', 'updatedAt', 'updatedBy'],
          },
          `AFFIL-${projectId}-${truckId}`
        );
      } else if (truckAffilDecision.action === 'REACTIVATE' || truckAffilDecision.action === 'REASSIGN') {
        transaction.update(finalTruckAffilRef, {
          status: 'ACTIVE',
          statusChangedAt: nowIso,
          updatedAt: nowIso,
          updatedBy: actorId,
        });
        createAuditLog(
          `AUD-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          'TRUCK',
          truckId,
          'UPDATE',
          {
            before: truckAffilExisting ? { carrierId: truckAffilExisting.carrierId, status: truckAffilExisting.status } : null,
            after: { carrierId, status: 'ACTIVE', eventCode: 'TRUCK_CARRIER_AFFILIATION_CHANGED' },
            deltaFields: ['carrierId', 'status', 'updatedAt', 'updatedBy'],
          },
          `AFFIL-${projectId}-${truckId}`
        );
      }

      // Write Assignments
      let finalAssignmentId = '';
      if (
        CanonicalFleetRelationshipPolicy.isAssignmentIdempotent(
          driverId,
          truckId,
          currentDriverSlot,
          currentTruckSlot,
          dAssign
        )
      ) {
        finalAssignmentId = currentDriverSlot!.assignmentId;
      } else {
        const closedAssignments: string[] = [];

        if (dAssign && dAssign.status === 'ACTIVE') {
          const oldDAssignRef = adminDb.collection('projects').doc(projectId).collection('driver_truck_assignments').doc(dAssign.assignmentId);
          transaction.update(oldDAssignRef, {
            status: 'CLOSED',
            effectiveTo: nowIso,
          });
          closedAssignments.push(dAssign.assignmentId);

          if (counterpartTruckSlotRef && counterpartTruckSlotSnap?.exists && counterpartTruckSlotSnap.data()?.assignmentId === dAssign.assignmentId) {
            transaction.delete(counterpartTruckSlotRef);
          }
        }

        if (tAssign && tAssign.status === 'ACTIVE') {
          const oldTAssignRef = adminDb.collection('projects').doc(projectId).collection('driver_truck_assignments').doc(tAssign.assignmentId);
          transaction.update(oldTAssignRef, {
            status: 'CLOSED',
            effectiveTo: nowIso,
          });
          closedAssignments.push(tAssign.assignmentId);

          if (counterpartDriverSlotRef && counterpartDriverSlotSnap?.exists && counterpartDriverSlotSnap.data()?.assignmentId === tAssign.assignmentId) {
            transaction.delete(counterpartDriverSlotRef);
          }
        }

        const hashHex = require('crypto').randomBytes(16).toString('hex');
        finalAssignmentId = `ASN-${hashHex}`;
        const newAssignRef = adminDb.collection('projects').doc(projectId).collection('driver_truck_assignments').doc(finalAssignmentId);
        transaction.set(newAssignRef, {
          assignmentId: finalAssignmentId,
          projectId,
          driverId,
          truckId,
          status: 'ACTIVE',
          effectiveFrom: nowIso,
          effectiveTo: null,
          createdAt: nowIso,
          createdBy: actorId,
        });

        transaction.set(finalDriverSlotRef, { assignmentId: finalAssignmentId });
        transaction.set(finalTruckSlotRef, { assignmentId: finalAssignmentId });

        createAuditLog(
          `AUD-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          'TRUCK',
          truckId,
          closedAssignments.length > 0 ? 'UPDATE' : 'CREATE',
          {
            before: { closedAssignments },
            after: { assignmentId: finalAssignmentId, driverId, truckId, status: 'ACTIVE', carrierId },
            deltaFields: ['status', 'driverId', 'truckId'],
          },
          `ASN-${projectId}-${finalAssignmentId}`
        );
      }

      // Write Allocations
      let finalAllocationId = '';
      if (tAlloc && tAlloc.status === 'ACTIVE' && tAlloc.materialId === materialId) {
        finalAllocationId = tAlloc.allocationId;
      } else {
        const reallocated = !!tAlloc && tAlloc.status === 'ACTIVE';
        if (tAlloc && tAlloc.status === 'ACTIVE') {
          const oldAllocRef = adminDb.collection('projects').doc(projectId).collection('truck_material_allocations').doc(tAlloc.allocationId);
          transaction.update(oldAllocRef, {
            status: 'CLOSED',
            effectiveTo: nowIso,
          });
        }

        const hashHex = require('crypto').randomBytes(16).toString('hex');
        finalAllocationId = `TMA-${hashHex}`;
        const newAllocRef = adminDb.collection('projects').doc(projectId).collection('truck_material_allocations').doc(finalAllocationId);
        transaction.set(newAllocRef, {
          allocationId: finalAllocationId,
          projectId,
          truckId,
          materialId,
          status: 'ACTIVE',
          effectiveFrom: nowIso,
          effectiveTo: null,
          createdAt: nowIso,
          createdBy: actorId,
        });

        transaction.set(finalTruckAllocSlotRef, { allocationId: finalAllocationId });

        createAuditLog(
          `AUD-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          'TRUCK',
          truckId,
          reallocated ? 'UPDATE' : 'CREATE',
          {
            before: tAlloc && tAlloc.status === 'ACTIVE' ? { allocationId: tAlloc.allocationId, materialId: tAlloc.materialId } : {},
            after: { allocationId: finalAllocationId, truckId, materialId, status: 'ACTIVE' },
            deltaFields: ['allocationId', 'truckId', 'materialId', 'status'],
          },
          `TMA-${projectId}-${finalAllocationId}`
        );
      }

      return {
        projectId,
        driverId,
        truckId,
        carrierId,
        materialId,
        driverMembershipStatus: 'ACTIVE',
        truckMembershipStatus: 'ACTIVE',
        driverCarrierAffiliationStatus: 'ACTIVE',
        truckCarrierAffiliationStatus: 'ACTIVE',
        assignmentId: finalAssignmentId,
        allocationId: finalAllocationId,
        driver: {
          driverId,
          name: driverName,
          idNumber: normIdNumber,
        },
        truck: {
          truckId,
          plate: plateNumber,
        },
      };
    });
  }
}

export const driverTruckIntakeServer = new DriverTruckIntakeServer();
