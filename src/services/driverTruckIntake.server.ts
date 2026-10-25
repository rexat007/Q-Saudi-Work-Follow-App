import { planMembership, planAffiliation, protectAffiliationAssignment, writeParticipationPlan, decodeParticipation } from './projectParticipationAuthority.server';
import { resolveGlobalNaturalIdentity, authorizeGlobalCommand, assertGlobalEntityExists, decodeAuthoritativeGlobal, auditGlobalMutation } from './globalIdentityAuthority.server';
import { assertCanEnroll, assertOperationallyEligible } from '../utils/globalIdentityPolicy';
import crypto from 'crypto';
import { AuthUserContext } from '../types/common';
import { DriverTruckIntakePayload, DriverTruckIntakeResult } from './driverTruckIntake.service';
import { CanonicalFleetRelationshipPolicy, PureAssignment, PureAllocation } from '../utils/canonicalFleetRelationshipPolicy';
import { markDirtyInTransaction } from './projectWorkspaceProjectionState.server';
import { WorkspaceSheetTab } from '../types/workspace';

export interface CreateStandaloneDriverPayload {
  projectId: string;
  carrierId: string;
  driverName: string;
  residencyId: string;
  phone?: string;
}

export interface CreateStandaloneDriverResult {
  projectId: string;
  driverId: string;
  carrierId: string;
  identityStatus: 'CREATED' | 'EXISTING';
  membershipStatus: 'CREATED' | 'EXISTING';
  affiliationStatus: 'CREATED' | 'EXISTING';
}

export interface CreateStandaloneTruckPayload {
  projectId: string;
  carrierId: string;
  plateNumber: string;
  truckType?: string;
  tareWeightKg?: number;
  maxGrossWeightKg?: number;
}

export interface CreateStandaloneTruckResult {
  projectId: string;
  truckId: string;
  carrierId: string;
  identityStatus: 'CREATED' | 'EXISTING';
  membershipStatus: 'CREATED' | 'EXISTING';
  affiliationStatus: 'CREATED' | 'EXISTING';
}

export class DriverTruckIntakeServer {
  private checkModificationAccess(projectId: string, context: AuthUserContext) {
    if (!context?.userId?.trim()) throw new Error('UNAUTHENTICATED_ACTOR');
    if (!projectId) throw new Error('FORBIDDEN_GLOBAL_COMMAND');
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
    const { adminDb } = await import('../firebase/admin');

    const normName = normalizeName(driverName);
    const normPlate = normalizePlate(plateNumber);
    const phone = normalizePhone(rawPhone || '');
    const normIdNumber = normalizeIdNumber(residencyId);

    if (!normIdNumber || !/^[1-2][0-9]{9}$/.test(normIdNumber)) {
      throw new Error('رقم الهوية الوطنية أو الإقامة غير صالح. يجب أن يتكون من 10 خانات ويبدأ بـ 1 أو 2');
    }


    const nowIso = new Date().toISOString();

    const authenticated = context;
    return await adminDb.runTransaction(async (transaction) => {
      const context = await authorizeGlobalCommand(transaction, adminDb, authenticated, projectId);
      const carrierGlobal = await assertGlobalEntityExists(transaction, adminDb, 'CARRIER', carrierId);
      assertOperationallyEligible('CARRIER', carrierGlobal);
      // ----------------------------------------------------
      // PHASE 1: NATURAL IDENTITY RESOLUTION & PREVENT DUPLICATES
      // ----------------------------------------------------
      const resolvedDriver = await resolveGlobalNaturalIdentity(transaction, adminDb, 'DRIVER', normIdNumber);
      const resolvedTruck = await resolveGlobalNaturalIdentity(transaction, adminDb, 'TRUCK', normPlate);
      const driverId = resolvedDriver.id || `DRV-${crypto.randomBytes(16).toString('hex')}`;
      const truckId = resolvedTruck.id || `TRK-${crypto.randomBytes(16).toString('hex')}`;
      const lookupRefDriver = resolvedDriver.canonicalRef, lookupRefTruck = resolvedTruck.canonicalRef;
      const shouldReserveLookupDriver = resolvedDriver.mustReserve, shouldReserveLookupTruck = resolvedTruck.mustReserve;
      if (resolvedDriver.entity) assertCanEnroll('DRIVER', resolvedDriver.entity);
      if (resolvedTruck.entity) assertCanEnroll('TRUCK', resolvedTruck.entity);
      assertOperationallyEligible('MATERIAL', await assertGlobalEntityExists(transaction, adminDb, 'MATERIAL', materialId));

      // ----------------------------------------------------
      // PHASE 2: ACCESS PROJECT-LEVEL MEMBERSHIPS & CARRIER
      // ----------------------------------------------------
      const carrierMemRef = adminDb.collection('projects').doc(projectId).collection('carrier_memberships').doc(carrierId);
      const materialMemRef = adminDb.collection('projects').doc(projectId).collection('material_memberships').doc(materialId);

      const [carrierMemSnap, materialMemSnap] = await Promise.all([
        transaction.get(carrierMemRef),
        transaction.get(materialMemRef),
      ]);

      if (!carrierMemSnap.exists || decodeParticipation(carrierMemSnap.data(), 'CARRIER', projectId, carrierId).status !== 'ACTIVE') {
        throw new Error(`CARRIER_NOT_ACTIVE_IN_PROJECT: Carrier ${carrierId} is not active in project ${projectId}`);
      }
      if (!materialMemSnap.exists || decodeParticipation(materialMemSnap.data(), 'MATERIAL', projectId, materialId).status !== 'ACTIVE') {
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
      const driverMembershipPlan = planMembership({ kind: 'DRIVER', projectId, entityId: driverId, before: driverMemSnap?.exists ? driverMemSnap.data() : null, global: resolvedDriver.entity || { status: 'ACTIVE' }, actor: context, command: 'ENROLL' });
      const driverAffiliationPlan = planAffiliation({ kind: 'DRIVER', projectId, entityId: driverId, carrierId, before: driverAffilSnap?.exists ? driverAffilSnap.data() : null, entityMembership: driverMembershipPlan.after, carrierMembership: carrierMemSnap.data(), global: resolvedDriver.entity || { status: 'ACTIVE' }, carrierGlobal, actor: context, command: 'SET_AFFILIATION' });
      await protectAffiliationAssignment(transaction, adminDb, driverAffiliationPlan);
      const truckMembershipPlan = planMembership({ kind: 'TRUCK', projectId, entityId: truckId, before: truckMemSnap?.exists ? truckMemSnap.data() : null, global: resolvedTruck.entity || { status: 'ACTIVE' }, actor: context, command: 'ENROLL' });
      const truckAffiliationPlan = planAffiliation({ kind: 'TRUCK', projectId, entityId: truckId, carrierId, before: truckAffilSnap?.exists ? truckAffilSnap.data() : null, entityMembership: truckMembershipPlan.after, carrierMembership: carrierMemSnap.data(), global: resolvedTruck.entity || { status: 'ACTIVE' }, carrierGlobal, actor: context, command: 'SET_AFFILIATION' });
      await protectAffiliationAssignment(transaction, adminDb, truckAffiliationPlan);

      // Evaluate assignment decision
      const isAssignmentIdempotent = CanonicalFleetRelationshipPolicy.isAssignmentIdempotent(
        driverId,
        truckId,
        currentDriverSlot,
        currentTruckSlot,
        dAssign
      );

      // Evaluate allocation decision
      const isAllocationIdempotent = !!(tAlloc && tAlloc.status === 'ACTIVE' && tAlloc.materialId === materialId);

      // Evaluate Workspace projection invalidation domains
      const isNewDriver = !resolvedDriver.id;
      const isNewDriverMem = !driverMemSnap || !driverMemSnap.exists;
      const isNewTruck = !resolvedTruck.id;
      const isNewTruckMem = !truckMemSnap || !truckMemSnap.exists;

      const isDriverAffilChanged = driverAffiliationPlan.changed;

      const isTruckAffilChanged = truckAffiliationPlan.changed;

      const isAssignmentChanged = !isAssignmentIdempotent;
      const isAllocationChanged = !isAllocationIdempotent;

      const intakeDirtyTabs: WorkspaceSheetTab[] = [];
      if (isNewDriver || isNewDriverMem) {
        intakeDirtyTabs.push('DRIVERS');
      }
      if (
        isNewTruck ||
        isNewTruckMem ||
        isDriverAffilChanged ||
        isTruckAffilChanged ||
        isAssignmentChanged ||
        isAllocationChanged
      ) {
        intakeDirtyTabs.push('FLEET_ROSTER');
      }

      if (intakeDirtyTabs.length > 0) {
        await markDirtyInTransaction(
          transaction,
          projectId,
          intakeDirtyTabs,
          'CANONICAL_SHARED_INTAKE_CHANGED'
        );
      }

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
      if (!resolvedDriver.id) {
        const newDriverRef = adminDb.collection('drivers').doc(driverId);
        const newDriverData = {
          driverId,
          nationalId: normIdNumber,
          fullNameAr: normalizeArabicText(driverName),
          phone,
          status: 'ACTIVE',
          createdAt: nowIso,
          createdBy: actorId,
          updatedAt: nowIso,
          updatedBy: actorId,
        };
        decodeAuthoritativeGlobal('DRIVER', newDriverData, driverId);
        transaction.set(newDriverRef, newDriverData);
        auditGlobalMutation(transaction, adminDb, 'DRIVER', driverId, context, null, newDriverData, projectId);

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
      if (!resolvedTruck.id) {

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
        decodeAuthoritativeGlobal('TRUCK', newTruckData, truckId);
        transaction.set(newTruckRef, newTruckData);
        auditGlobalMutation(transaction, adminDb, 'TRUCK', truckId, context, null, newTruckData, projectId);

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

      // Temporal slot writes retain the existing shared-intake semantics.

      const finalDriverSlotRef = adminDb.collection('projects').doc(projectId).collection('driver_active_assignments').doc(driverId);
      const finalTruckSlotRef = adminDb.collection('projects').doc(projectId).collection('truck_active_assignments').doc(truckId);
      const finalTruckAllocSlotRef = adminDb.collection('projects').doc(projectId).collection('truck_active_material_allocations').doc(truckId);

      // Shared participation plans own state and atomic audits.
      for (const plan of [driverMembershipPlan, truckMembershipPlan, driverAffiliationPlan, truckAffiliationPlan]) writeParticipationPlan(transaction, adminDb, plan);

      // 6. Write Assignments
      let finalAssignmentId = '';
      if (isAssignmentIdempotent) {
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

        const hashHex = crypto.randomBytes(16).toString('hex');
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
      if (isAllocationIdempotent) {
        finalAllocationId = tAlloc!.allocationId;
      } else {
        const reallocated = !!tAlloc && tAlloc.status === 'ACTIVE';
        if (tAlloc && tAlloc.status === 'ACTIVE') {
          const oldAllocRef = adminDb.collection('projects').doc(projectId).collection('truck_material_allocations').doc(tAlloc.allocationId);
          transaction.update(oldAllocRef, {
            status: 'CLOSED',
            effectiveTo: nowIso,
          });
        }

        const hashHex = crypto.randomBytes(16).toString('hex');
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

  async createStandaloneDriver(
    payload: CreateStandaloneDriverPayload,
    context: AuthUserContext
  ): Promise<CreateStandaloneDriverResult> {
    const projectId = payload.projectId ? payload.projectId.trim() : '';
    if (!projectId) {
      throw new Error('معرف المشروع مطلوب');
    }

    this.checkModificationAccess(projectId, context);

    const actorId = context.userId ? context.userId.trim() : '';
    if (!actorId) {
      throw new Error('UNAUTHENTICATED_ACTOR: Authenticated context must provide a valid user ID.');
    }

    const { carrierId, driverName, residencyId, phone: rawPhone } = payload;

    if (!carrierId || !carrierId.trim()) throw new Error('معرف الناقل مطلوب');
    if (!driverName || !driverName.trim()) throw new Error('اسم السائق مطلوب');
    if (!residencyId || !residencyId.trim()) {
      throw new Error('رقم الهوية الوطنية أو الإقامة مطلوب وغير موجود');
    }

    const { normalizeArabicText, normalizeName, normalizePhone, normalizeIdNumber } = await import('../utils/normalization');
    const { adminDb } = await import('../firebase/admin');

    const phone = normalizePhone(rawPhone || '');
    const normIdNumber = normalizeIdNumber(residencyId);

    if (!normIdNumber || !/^[1-2][0-9]{9}$/.test(normIdNumber)) {
      throw new Error('رقم الهوية الوطنية أو الإقامة غير صالح. يجب أن يتكون من 10 خانات ويبدأ بـ 1 أو 2');
    }

    const nowIso = new Date().toISOString();

    const authenticated = context;
    return await adminDb.runTransaction(async (transaction) => {
      const context = await authorizeGlobalCommand(transaction, adminDb, authenticated, projectId);
      const carrierGlobal = await assertGlobalEntityExists(transaction, adminDb, 'CARRIER', carrierId);
      assertOperationallyEligible('CARRIER', carrierGlobal);
      const resolvedDriver = await resolveGlobalNaturalIdentity(transaction, adminDb, 'DRIVER', normIdNumber);
      const driverId = resolvedDriver.id || `DRV-${crypto.randomBytes(16).toString('hex')}`;
      const lookupRefDriver = resolvedDriver.canonicalRef;
      const shouldReserveLookupDriver = resolvedDriver.mustReserve;
      const identityStatus: 'CREATED' | 'EXISTING' = resolvedDriver.id ? 'EXISTING' : 'CREATED';
      if (resolvedDriver.entity) assertCanEnroll('DRIVER', resolvedDriver.entity);

      const carrierMemRef = adminDb.collection('projects').doc(projectId).collection('carrier_memberships').doc(carrierId);
      const carrierMemSnap = await transaction.get(carrierMemRef);

      if (!carrierMemSnap.exists || decodeParticipation(carrierMemSnap.data(), 'CARRIER', projectId, carrierId).status !== 'ACTIVE') {
        throw new Error(`CARRIER_NOT_ACTIVE_IN_PROJECT: Carrier ${carrierId} is not active in project ${projectId}`);
      }

      const driverMemRef = driverId ? adminDb.collection('projects').doc(projectId).collection('driver_memberships').doc(driverId) : null;
      const driverAffilRef = driverId ? adminDb.collection('projects').doc(projectId).collection('driver_carrier_affiliations').doc(driverId) : null;

      const driverMemSnap = driverMemRef ? await transaction.get(driverMemRef) : null;
      const driverAffilSnap = driverAffilRef ? await transaction.get(driverAffilRef) : null;

      const driverMembershipPlan = planMembership({ kind: 'DRIVER', projectId, entityId: driverId, before: driverMemSnap?.exists ? driverMemSnap.data() : null, global: resolvedDriver.entity || { status: 'ACTIVE' }, actor: context, command: 'ENROLL' });
      const driverAffiliationPlan = planAffiliation({ kind: 'DRIVER', projectId, entityId: driverId, carrierId, before: driverAffilSnap?.exists ? driverAffilSnap.data() : null, entityMembership: driverMembershipPlan.after, carrierMembership: carrierMemSnap.data(), global: resolvedDriver.entity || { status: 'ACTIVE' }, carrierGlobal, actor: context, command: 'SET_AFFILIATION' });
      await protectAffiliationAssignment(transaction, adminDb, driverAffiliationPlan);
      const membershipStatus = driverMembershipPlan.changed ? 'CREATED' : 'EXISTING';
      const affiliationStatus = driverAffiliationPlan.changed ? 'CREATED' : 'EXISTING';

      if (identityStatus === 'CREATED' || membershipStatus === 'CREATED') {
        await markDirtyInTransaction(
          transaction,
          projectId,
          ['DRIVERS'],
          'PROJECT_DRIVER_SETUP_CHANGED'
        );
      }

      if (!resolvedDriver.id) {
        const newDriverRef = adminDb.collection('drivers').doc(driverId);
        const newDriverData = {
          driverId,
          nationalId: normIdNumber,
          fullNameAr: normalizeArabicText(driverName),
          phone,
          status: 'ACTIVE',
          createdAt: nowIso,
          createdBy: actorId,
          updatedAt: nowIso,
          updatedBy: actorId,
        };
        decodeAuthoritativeGlobal('DRIVER', newDriverData, driverId);
        transaction.set(newDriverRef, newDriverData);

        transaction.set(lookupRefDriver, {
          entityType: 'DRIVER',
          systemId: driverId,
          createdAt: nowIso,
          createdBy: actorId,
        });
      } else if (shouldReserveLookupDriver) {
        transaction.set(lookupRefDriver, {
          entityType: 'DRIVER',
          systemId: driverId,
          createdAt: nowIso,
          createdBy: actorId,
        });
      }

      writeParticipationPlan(transaction, adminDb, driverMembershipPlan);
      writeParticipationPlan(transaction, adminDb, driverAffiliationPlan);

      if (identityStatus === 'CREATED') {
        const auditLogId = `AUD-${Date.now()}-DRV-${driverId}`;
        const auditLogRef = adminDb.collection('audit_logs').doc(auditLogId);
        transaction.set(auditLogRef, {
          auditLogId,
          projectId,
          entityType: 'DRIVER',
          entityId: driverId,
          action: 'CREATE',
          actor: { userId: actorId, email: context.email || 'system@q-saudi.com', role: context.role || 'PROJECT_ADMIN' },
          changes: { driverId, nationalId: normIdNumber, fullNameAr: normalizeArabicText(driverName) },
          correlationId: `DRV-STANDALONE-${projectId}-${driverId}`,
          createdBy: actorId,
          updatedBy: actorId,
          createdAt: nowIso,
          updatedAt: nowIso,
        });
      }

      return {
        projectId,
        driverId,
        carrierId,
        identityStatus,
        membershipStatus,
        affiliationStatus,
      };
    });
  }

  async createStandaloneTruck(
    payload: CreateStandaloneTruckPayload,
    context: AuthUserContext
  ): Promise<CreateStandaloneTruckResult> {
    const projectId = payload.projectId ? payload.projectId.trim() : '';
    if (!projectId) {
      throw new Error('معرف المشروع مطلوب');
    }

    this.checkModificationAccess(projectId, context);

    const actorId = context.userId ? context.userId.trim() : '';
    if (!actorId) {
      throw new Error('UNAUTHENTICATED_ACTOR: Authenticated context must provide a valid user ID.');
    }

    const { carrierId, plateNumber, truckType, tareWeightKg, maxGrossWeightKg } = payload;

    if (!carrierId || !carrierId.trim()) throw new Error('معرف الناقل مطلوب');
    if (!plateNumber || !plateNumber.trim()) throw new Error('رقم لوحة الشاحنة مطلوب');

    const { normalizePlate } = await import('../utils/normalization');
    const { adminDb } = await import('../firebase/admin');

    const normPlate = normalizePlate(plateNumber);
    const nowIso = new Date().toISOString();

    const authenticated = context;
    return await adminDb.runTransaction(async (transaction) => {
      const context = await authorizeGlobalCommand(transaction, adminDb, authenticated, projectId);
      const carrierGlobal = await assertGlobalEntityExists(transaction, adminDb, 'CARRIER', carrierId);
      assertOperationallyEligible('CARRIER', carrierGlobal);
      const resolvedTruck = await resolveGlobalNaturalIdentity(transaction, adminDb, 'TRUCK', normPlate);
      const truckId = resolvedTruck.id || `TRK-${crypto.randomBytes(16).toString('hex')}`;
      const lookupRefTruck = resolvedTruck.canonicalRef;
      const shouldReserveLookupTruck = resolvedTruck.mustReserve;
      const identityStatus: 'CREATED' | 'EXISTING' = resolvedTruck.id ? 'EXISTING' : 'CREATED';
      if (resolvedTruck.entity) assertCanEnroll('TRUCK', resolvedTruck.entity);

      const carrierMemRef = adminDb.collection('projects').doc(projectId).collection('carrier_memberships').doc(carrierId);
      const carrierMemSnap = await transaction.get(carrierMemRef);

      if (!carrierMemSnap.exists || decodeParticipation(carrierMemSnap.data(), 'CARRIER', projectId, carrierId).status !== 'ACTIVE') {
        throw new Error(`CARRIER_NOT_ACTIVE_IN_PROJECT: Carrier ${carrierId} is not active in project ${projectId}`);
      }

      const truckMemRef = truckId ? adminDb.collection('projects').doc(projectId).collection('truck_memberships').doc(truckId) : null;
      const truckAffilRef = truckId ? adminDb.collection('projects').doc(projectId).collection('truck_carrier_affiliations').doc(truckId) : null;

      const truckMemSnap = truckMemRef ? await transaction.get(truckMemRef) : null;
      const truckAffilSnap = truckAffilRef ? await transaction.get(truckAffilRef) : null;

      const truckMembershipPlan = planMembership({ kind: 'TRUCK', projectId, entityId: truckId, before: truckMemSnap?.exists ? truckMemSnap.data() : null, global: resolvedTruck.entity || { status: 'ACTIVE' }, actor: context, command: 'ENROLL' });
      const truckAffiliationPlan = planAffiliation({ kind: 'TRUCK', projectId, entityId: truckId, carrierId, before: truckAffilSnap?.exists ? truckAffilSnap.data() : null, entityMembership: truckMembershipPlan.after, carrierMembership: carrierMemSnap.data(), global: resolvedTruck.entity || { status: 'ACTIVE' }, carrierGlobal, actor: context, command: 'SET_AFFILIATION' });
      await protectAffiliationAssignment(transaction, adminDb, truckAffiliationPlan);
      const membershipStatus = truckMembershipPlan.changed ? 'CREATED' : 'EXISTING';
      const affiliationStatus = truckAffiliationPlan.changed ? 'CREATED' : 'EXISTING';

      if (identityStatus === 'CREATED' || membershipStatus === 'CREATED' || affiliationStatus === 'CREATED') {
        await markDirtyInTransaction(
          transaction,
          projectId,
          ['FLEET_ROSTER'],
          'PROJECT_TRUCK_SETUP_CHANGED'
        );
      }

      if (!resolvedTruck.id) {

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
        if (tareWeightKg !== undefined && Number(tareWeightKg) > 0) {
          newTruckData.tareWeightKg = Number(tareWeightKg);
        }
        if (maxGrossWeightKg !== undefined && Number(maxGrossWeightKg) > 0) {
          newTruckData.maxGrossWeightKg = Number(maxGrossWeightKg);
        }
        if (tareWeightKg !== undefined && maxGrossWeightKg !== undefined && Number(maxGrossWeightKg) > Number(tareWeightKg)) {
          newTruckData.legalPayloadLimitKg = Number(maxGrossWeightKg) - Number(tareWeightKg);
        }

        const newTruckRef = adminDb.collection('trucks').doc(truckId);
        decodeAuthoritativeGlobal('TRUCK', newTruckData, truckId);
        transaction.set(newTruckRef, newTruckData);

        transaction.set(lookupRefTruck, {
          entityType: 'TRUCK',
          systemId: truckId,
          createdAt: nowIso,
          createdBy: actorId,
        });
      } else if (shouldReserveLookupTruck) {
        transaction.set(lookupRefTruck, {
          entityType: 'TRUCK',
          systemId: truckId,
          createdAt: nowIso,
          createdBy: actorId,
        });
      }

      writeParticipationPlan(transaction, adminDb, truckMembershipPlan);
      writeParticipationPlan(transaction, adminDb, truckAffiliationPlan);

      if (identityStatus === 'CREATED') {
        const auditLogId = `AUD-${Date.now()}-TRK-${truckId}`;
        const auditLogRef = adminDb.collection('audit_logs').doc(auditLogId);
        transaction.set(auditLogRef, {
          auditLogId,
          projectId,
          entityType: 'TRUCK',
          entityId: truckId,
          action: 'CREATE',
          actor: { userId: actorId, email: context.email || 'system@q-saudi.com', role: context.role || 'PROJECT_ADMIN' },
          changes: { truckId, plate: plateNumber.trim(), normalizedPlate: normPlate },
          correlationId: `TRK-STANDALONE-${projectId}-${truckId}`,
          createdBy: actorId,
          updatedBy: actorId,
          createdAt: nowIso,
          updatedAt: nowIso,
        });
      }

      return {
        projectId,
        truckId,
        carrierId,
        identityStatus,
        membershipStatus,
        affiliationStatus,
      };
    });
  }
}

export const driverTruckIntakeServer = new DriverTruckIntakeServer();
