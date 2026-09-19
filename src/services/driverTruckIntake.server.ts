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

    const actorId = context.userId ? context.userId.trim() : '';
    if (!actorId) {
      throw new Error('UNAUTHENTICATED_ACTOR: Authenticated context must provide a valid user ID.');
    }

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

    return await adminDb.runTransaction(async (transaction) => {
      // ----------------------------------------------------
      // PHASE 1: NATURAL IDENTITY RESOLUTION & PREVENT DUPLICATES
      // ----------------------------------------------------
      let driverId: string | null = null;
      let shouldReserveLookupDriver = false;

      const lookupRefDriver = adminDb.collection('natural_identity_lookups').doc(lookupTokenDriver);
      const lookupSnapDriver = await transaction.get(lookupRefDriver);

      if (lookupSnapDriver.exists) {
        driverId = lookupSnapDriver.data()?.systemId;
        const driverRef = adminDb.collection('drivers').doc(driverId!);
        const driverSnap = await transaction.get(driverRef);

        if (!driverSnap.exists) {
          throw new Error('IDENTITY_LOOKUP_INTEGRITY_ERROR: Natural lookup exists for driver but Global Driver document is missing.');
        }

        const actualNationalId = driverSnap.data()?.nationalId;
        if (actualNationalId !== normIdNumber) {
          throw new Error('IDENTITY_LOOKUP_INTEGRITY_ERROR: Natural lookup exists for driver but National ID does not match.');
        }
      } else {
        // Fallback: query canonical collection for exact natural key
        const matchingDriversQuery = adminDb.collection('drivers').where('nationalId', '==', normIdNumber);
        const matchingDriversSnap = await transaction.get(matchingDriversQuery);

        if (matchingDriversSnap.size === 1) {
          driverId = matchingDriversSnap.docs[0].id;
          shouldReserveLookupDriver = true;
        } else if (matchingDriversSnap.size > 1) {
          throw new Error('IDENTITY_LOOKUP_INTEGRITY_ERROR: Multiple global driver entities match exact natural key.');
        }
      }

      let truckId: string | null = null;
      let shouldReserveLookupTruck = false;

      const lookupRefTruck = adminDb.collection('natural_identity_lookups').doc(lookupTokenTruck);
      const lookupSnapTruck = await transaction.get(lookupRefTruck);

      if (lookupSnapTruck.exists) {
        truckId = lookupSnapTruck.data()?.systemId;
        const truckRef = adminDb.collection('trucks').doc(truckId!);
        const truckSnap = await transaction.get(truckRef);

        if (!truckSnap.exists) {
          throw new Error('IDENTITY_LOOKUP_INTEGRITY_ERROR: Natural lookup exists for truck but Global Truck document is missing.');
        }

        const actualNormalizedPlate = truckSnap.data()?.normalizedPlate;
        if (actualNormalizedPlate !== normPlate) {
          throw new Error('IDENTITY_LOOKUP_INTEGRITY_ERROR: Natural lookup exists for truck but normalized plate does not match.');
        }
      } else {
        // Fallback: query canonical collection for exact natural key
        const matchingTrucksQuery = adminDb.collection('trucks').where('normalizedPlate', '==', normPlate);
        const matchingTrucksSnap = await transaction.get(matchingTrucksQuery);

        if (matchingTrucksSnap.size === 1) {
          truckId = matchingTrucksSnap.docs[0].id;
          shouldReserveLookupTruck = true;
        } else if (matchingTrucksSnap.size > 1) {
          throw new Error('IDENTITY_LOOKUP_INTEGRITY_ERROR: Multiple global truck entities match exact natural key.');
        }
      }

      // ----------------------------------------------------
      // PHASE 2: ACCESS PROJECT-LEVEL MEMBERSHIPS & CARRIER
      // ----------------------------------------------------
      const carrierMemRef = adminDb.collection('projects').doc(projectId).collection('carrier_memberships').doc(carrierId);
      const materialMemRef = adminDb.collection('projects').doc(projectId).collection('material_memberships').doc(materialId);

      const [carrierMemSnap, materialMemSnap] = await Promise.all([
        transaction.get(carrierMemRef),
        transaction.get(materialMemRef),
      ]);

      if (!carrierMemSnap.exists || carrierMemSnap.data()?.status !== 'ACTIVE') {
        throw new Error(`CARRIER_NOT_ACTIVE_IN_PROJECT: Carrier ${carrierId} is not active in project ${projectId}`);
      }
      if (!materialMemSnap.exists || materialMemSnap.data()?.status !== 'ACTIVE') {
        throw new Error(`MATERIAL_NOT_ACTIVE_IN_PROJECT: Material ${materialId} is not active in project ${projectId}`);
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
      if (currentTruckSlot?.assignmentId) {
        if (currentTruckSlot.assignmentId === currentDriverSlot?.assignmentId) {
          tAssign = dAssign;
        } else {
          const tAssignRef = adminDb.collection('projects').doc(projectId).collection('driver_truck_assignments').doc(currentTruckSlot.assignmentId);
          const snap = await transaction.get(tAssignRef);
          if (snap.exists) tAssign = snap.data() as PureAssignment;
        }
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

      // ----------------------------------------------------
      // PHASE 3: ONE-SIDED EXISTING IDENTITY VALIDATIONS
      // ----------------------------------------------------
      if (driverId) {
        CanonicalFleetRelationshipPolicy.validateDriverAssignmentSlot(
          driverId,
          currentDriverSlot,
          dAssign,
          projectId
        );
      }

      if (truckId) {
        CanonicalFleetRelationshipPolicy.validateTruckAssignmentSlot(
          truckId,
          currentTruckSlot,
          tAssign,
          projectId
        );
      }

      CanonicalFleetRelationshipPolicy.validateAllocationPointers(
        projectId,
        truckId || '',
        currentTruckAllocSlot,
        tAlloc
      );

      // ----------------------------------------------------
      // PHASE 4: EVALUATE TRANSITION DECISIONS
      // ----------------------------------------------------
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

      // ----------------------------------------------------
      // PHASE 5: EXECUTE WRITES
      // ----------------------------------------------------
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

      // 1. Create Driver if completely missing
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
          entityType: 'DRIVER',
          systemId: driverId,
          createdAt: nowIso,
          createdBy: actorId,
        });
      } else if (shouldReserveLookupDriver) {
        // Reserve the missing lookup document
        transaction.set(lookupRefDriver, {
          entityType: 'DRIVER',
          systemId: driverId,
          createdAt: nowIso,
          createdBy: actorId,
        });
      }

      // 2. Create Truck if completely missing
      if (!truckId) {
        const hashHex = require('crypto').randomBytes(16).toString('hex');
        truckId = `TRK-${hashHex}`;

        const newTruckData: any = {
          truckId,
          plate: plateNumber.trim(),
          normalizedPlate: normPlate,
          status: 'ACTIVE',
          createdAt: nowIso,
          createdBy: actorId,
          updatedAt: nowIso,
          updatedBy: actorId,
        };

        if (truckType && truckType.trim()) {
          newTruckData.truckType = truckType.trim();
        }

        const validTare = typeof tareWeightKg === 'number' && tareWeightKg > 0;
        const validGross = typeof maxGrossWeightKg === 'number' && maxGrossWeightKg > 0;

        if (validTare) {
          newTruckData.tareWeightKg = tareWeightKg;
        }
        if (validGross) {
          newTruckData.maxGrossWeightKg = maxGrossWeightKg;
        }
        if (validTare && validGross && maxGrossWeightKg! > tareWeightKg!) {
          newTruckData.legalPayloadLimitKg = maxGrossWeightKg! - tareWeightKg!;
        }

        const newTruckRef = adminDb.collection('trucks').doc(truckId);
        transaction.set(newTruckRef, newTruckData);

        transaction.set(lookupRefTruck, {
          entityType: 'TRUCK',
          systemId: truckId,
          createdAt: nowIso,
          createdBy: actorId,
        });
      } else if (shouldReserveLookupTruck) {
        // Reserve the missing lookup document
        transaction.set(lookupRefTruck, {
          entityType: 'TRUCK',
          systemId: truckId,
          createdAt: nowIso,
          createdBy: actorId,
        });
      }

      // Refresh references with guaranteed non-null system IDs
      const finalDriverMemRef = adminDb.collection('projects').doc(projectId).collection('driver_memberships').doc(driverId);
      const finalTruckMemRef = adminDb.collection('projects').doc(projectId).collection('truck_memberships').doc(truckId);
      const finalDriverAffilRef = adminDb.collection('projects').doc(projectId).collection('driver_carrier_affiliations').doc(driverId);
      const finalTruckAffilRef = adminDb.collection('projects').doc(projectId).collection('truck_carrier_affiliations').doc(truckId);

      const finalDriverSlotRef = adminDb.collection('projects').doc(projectId).collection('driver_active_assignments').doc(driverId);
      const finalTruckSlotRef = adminDb.collection('projects').doc(projectId).collection('truck_active_assignments').doc(truckId);
      const finalTruckAllocSlotRef = adminDb.collection('projects').doc(projectId).collection('truck_active_material_allocations').doc(truckId);

      // 3. Memberships setup
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

      // 4. Set Driver Affiliation
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

      // 5. Set Truck Affiliation
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

      // 6. Write Assignments
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

      // 7. Write Allocations
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
