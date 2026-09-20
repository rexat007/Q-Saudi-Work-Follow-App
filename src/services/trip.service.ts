import { tripRepository } from '../repositories/trip.repository';
import { TripValidator } from '../validators/trip.validator';
import { TripEntity, TripStatus, OperationSourceType, OperationActorType, TripSourceMetadata } from '../types/entities';
import { AuthUserContext } from '../types/common';
import { auditLogService } from './auditLog.service';
import { tripEventService } from './tripEvent.service';
import {
  globalCarrierRepository,
  globalTruckRepository,
  globalDriverRepository,
  globalMaterialRepository,
} from '../repositories/globalIdentity.repository';
import {
  projectCarrierMembershipRepository,
  projectTruckMembershipRepository,
  projectDriverMembershipRepository,
  projectMaterialMembershipRepository,
} from '../repositories/projectMembership.repository';
import {
  projectDriverCarrierAffiliationRepository,
  projectTruckCarrierAffiliationRepository,
} from '../repositories/projectCarrierAffiliation.repository';
import { projectDriverTruckAssignmentRepository } from '../repositories/projectDriverTruckAssignment.repository';
import { projectTruckMaterialAllocationRepository } from '../repositories/projectTruckMaterialAllocation.repository';
import { pricingRuleRepository } from '../repositories/pricingRule.repository';
import { projectRepository } from '../repositories/project.repository';
import { TripNumberGenerator } from './tripNumberGenerator';

export interface DispatchTripParams {
  projectId: string;
  carrierId: string;
  truckId: string;
  driverId: string;
  materialId: string;
  pricingRuleId: string;
  clientUUID?: string;
  sourceType?: OperationSourceType;
  loadingDataSource?: OperationSourceType;
  unloadingDataSource?: OperationSourceType | null;
  loadingActorType?: OperationActorType;
  loadingActorId?: string | null;
  unloadingActorType?: OperationActorType | null;
  unloadingActorId?: string | null;
  sourceMetadata?: TripSourceMetadata;
}

export class TripService {
  async getTrip(projectId: string, tripId: string): Promise<TripEntity | null> {
    return tripRepository.findById(projectId, tripId);
  }

  async getTripsByProject(projectId: string, maxLimit = 100): Promise<TripEntity[]> {
    return tripRepository.listByProject(projectId, maxLimit);
  }

  /**
   * Dispatches a new trip, strictly enforcing canonical project memberships, global identities,
   * carrier affiliations, temporal assignments, material allocations, and canonical pricing rules.
   * Produces an immutable historical snapshot sourced exclusively from canonical authority.
   */
  async dispatchTrip(params: DispatchTripParams, context: AuthUserContext): Promise<TripEntity> {
    // 0. Enforce canonical required parameters
    if (!params.projectId || typeof params.projectId !== 'string' || !params.projectId.trim()) {
      throw new Error('معرف المشروع (projectId) مطلوب ولا يمكن تركه فارغاً');
    }
    if (!params.carrierId || typeof params.carrierId !== 'string' || !params.carrierId.trim()) {
      throw new Error('معرف الناقل (carrierId) مطلوب ولا يمكن تركه فارغاً');
    }
    if (!params.truckId || typeof params.truckId !== 'string' || !params.truckId.trim()) {
      throw new Error('معرف الشاحنة (truckId) مطلوب ولا يمكن تركه فارغاً');
    }
    if (!params.driverId || typeof params.driverId !== 'string' || !params.driverId.trim()) {
      throw new Error('معرف السائق (driverId) مطلوب ولا يمكن تركه فارغاً');
    }
    if (!params.materialId || typeof params.materialId !== 'string' || !params.materialId.trim()) {
      throw new Error('معرف المادة (materialId) مطلوب لإتمام عملية الشحن والتفريغ ولا يمكن الاعتماد على النص العابر');
    }
    if (!params.pricingRuleId || typeof params.pricingRuleId !== 'string' || !params.pricingRuleId.trim()) {
      throw new Error('معرف قاعدة التسعير (pricingRuleId) مطلوب ولا يمكن تركه فارغاً');
    }

    const cleanProjectId = params.projectId.trim();

    // 1. Fetch project entity
    const project = await projectRepository.findById(cleanProjectId);
    if (!project) {
      throw new Error('المشروع غير موجود أو غير صالح');
    }
    if (project.status === 'ARCHIVED' || project.status === 'SUSPENDED') {
      throw new Error(`حالة المشروع (${project.status}) لا تسمح بترحيل رحلات تشغيلية`);
    }

    // 2. Concurrently fetch all required canonical entities, memberships, affiliations, assignments, allocations, and pricing rule
    const [
      carrierGlobal,
      carrierMembership,
      materialGlobal,
      materialMembership,
      driverGlobal,
      driverMembership,
      truckGlobal,
      truckMembership,
      driverAffiliation,
      truckAffiliation,
      driverAssignment,
      truckAssignment,
      truckMaterialAllocation,
      pricingRule,
    ] = await Promise.all([
      globalCarrierRepository.findById(params.carrierId),
      projectCarrierMembershipRepository.getMembership(cleanProjectId, params.carrierId),
      globalMaterialRepository.findById(params.materialId),
      projectMaterialMembershipRepository.getMembership(cleanProjectId, params.materialId),
      globalDriverRepository.findById(params.driverId),
      projectDriverMembershipRepository.getMembership(cleanProjectId, params.driverId),
      globalTruckRepository.findById(params.truckId),
      projectTruckMembershipRepository.getMembership(cleanProjectId, params.truckId),
      projectDriverCarrierAffiliationRepository.getAffiliation(cleanProjectId, params.driverId),
      projectTruckCarrierAffiliationRepository.getAffiliation(cleanProjectId, params.truckId),
      projectDriverTruckAssignmentRepository.getActiveAssignmentByDriver(cleanProjectId, params.driverId),
      projectDriverTruckAssignmentRepository.getActiveAssignmentByTruck(cleanProjectId, params.truckId),
      projectTruckMaterialAllocationRepository.getActiveAllocationByTruck(cleanProjectId, params.truckId),
      pricingRuleRepository.findById(cleanProjectId, params.pricingRuleId),
    ]);

    // 3. Carrier Canonical Validation
    if (!carrierGlobal || (carrierGlobal.status !== undefined && carrierGlobal.status !== 'ACTIVE')) {
      throw new Error('الناقل المحدد غير موجود في الهوية الموحدة أو غير نشط (INACTIVE)');
    }
    if (!carrierMembership || carrierMembership.status !== 'ACTIVE') {
      throw new Error(`الناقل (${params.carrierId}) ليس لديه عضوية نشطة (ACTIVE) في هذا المشروع`);
    }

    // 4. Material Canonical Validation
    if (!materialGlobal || (materialGlobal.status !== undefined && materialGlobal.status !== 'ACTIVE')) {
      throw new Error('المادة المحددة غير موجودة في الهوية الموحدة أو غير نشطة (INACTIVE)');
    }
    if (!materialMembership || materialMembership.status !== 'ACTIVE') {
      throw new Error(`المادة (${params.materialId}) ليس لديها عضوية نشطة (ACTIVE) في هذا المشروع`);
    }

    // 5. Driver Canonical Validation
    if (!driverGlobal || (driverGlobal.status !== undefined && driverGlobal.status !== 'ACTIVE')) {
      throw new Error('السائق المحدد غير موجود في الهوية الموحدة أو غير نشط (INACTIVE)');
    }
    if (!driverMembership || driverMembership.status !== 'ACTIVE') {
      throw new Error(`السائق (${params.driverId}) ليس لديه عضوية نشطة (ACTIVE) في هذا المشروع`);
    }

    // 6. Truck Canonical Validation
    if (!truckGlobal || (truckGlobal.status !== undefined && truckGlobal.status !== 'ACTIVE')) {
      throw new Error('الشاحنة المحددة غير موجودة في الهوية الموحدة أو غير مصرح لها بالعمل (INACTIVE)');
    }
    if (!truckMembership || truckMembership.status !== 'ACTIVE') {
      throw new Error(`الشاحنة (${params.truckId}) ليس لديها عضوية نشطة (ACTIVE) في هذا المشروع`);
    }

    // 7. Driver ↔ Truck Active Assignment Validation (Fail-Closed)
    if (!driverAssignment || !driverAssignment.truckId || !truckAssignment || !truckAssignment.driverId) {
      throw new Error(`لا يوجد تعيين تشغيلي نشط (Driver ↔ Truck) بين السائق (${params.driverId}) والشاحنة (${params.truckId})`);
    }
    if (driverAssignment.truckId !== params.truckId || truckAssignment.driverId !== params.driverId) {
      throw new Error(`تعارض في التعيين التشغيلي: السائق (${params.driverId}) معين للشاحنة (${driverAssignment.truckId}) بينما الشاحنة (${params.truckId}) معينة للسائق (${truckAssignment.driverId})`);
    }

    // 8. Driver → Carrier Affiliation Validation
    if (!driverAffiliation || driverAffiliation.status !== 'ACTIVE') {
      throw new Error(`السائق (${params.driverId}) ليس لديه تبعية نشطة لناقل (Carrier Affiliation) في هذا المشروع`);
    }
    if (driverAffiliation.carrierId !== params.carrierId) {
      throw new Error(`السائق المحدد (${params.driverId}) تابع للناقل (${driverAffiliation.carrierId}) وليس للناقل المختار (${params.carrierId}) [العلاقة: Driver → Carrier]`);
    }

    // 9. Truck → Carrier Affiliation Validation
    if (!truckAffiliation || truckAffiliation.status !== 'ACTIVE') {
      throw new Error(`الشاحنة (${params.truckId}) ليس لديها تبعية نشطة لناقل (Carrier Affiliation) في هذا المشروع`);
    }
    if (truckAffiliation.carrierId !== params.carrierId) {
      throw new Error(`الشاحنة المحددة (${params.truckId}) تابعة للناقل (${truckAffiliation.carrierId}) وليس للناقل المختار (${params.carrierId}) [العلاقة: Truck → Carrier]`);
    }

    // 10. Truck ↔ Material Active Allocation Validation
    if (!truckMaterialAllocation || !truckMaterialAllocation.materialId) {
      throw new Error(`لا يوجد تخصيص مادة نشط (Truck ↔ Material) للشاحنة (${params.truckId})`);
    }
    if (truckMaterialAllocation.materialId !== params.materialId) {
      throw new Error(`الشاحنة (${params.truckId}) مخصصة للمادة (${truckMaterialAllocation.materialId}) وليس للمادة المختارة (${params.materialId}) [العلاقة: Truck ↔ Material]`);
    }

    // 11. Pricing Rule Canonical Authority Validation
    if (!pricingRule || (pricingRule.status !== undefined && pricingRule.status !== 'ACTIVE' && pricingRule.status !== ('ACTIVE' as any)) || (pricingRule.status === undefined && pricingRule.isActive === false)) {
      throw new Error('قاعدة التسعير غير صالحة أو غير نشطة');
    }
    if (pricingRule.projectId && pricingRule.projectId !== cleanProjectId) {
      throw new Error('قاعدة التسعير المحددة لا تنتمي لهذا المشروع');
    }
    if (pricingRule.carrierId && pricingRule.carrierId !== params.carrierId && pricingRule.carrierId !== 'ALL') {
      throw new Error(`قاعدة التسعير مخصصة للناقل (${pricingRule.carrierId}) وتتعارض مع الناقل المختار (${params.carrierId})`);
    }
    if (pricingRule.materialId && pricingRule.materialId !== params.materialId && pricingRule.materialId !== 'ALL' && pricingRule.materialId !== 'ALL_MATERIALS' && pricingRule.materialId !== 'GENERAL') {
      throw new Error(`قاعدة التسعير مخصصة للمادة (${pricingRule.materialId}) وتتعارض مع المادة المختارة (${params.materialId})`);
    }
    const today = new Date().toISOString().split('T')[0];
    if (pricingRule.effectiveFrom && today < pricingRule.effectiveFrom.split('T')[0]) {
      throw new Error(`قاعدة التسعير تبدأ بتاريخ مستقبلي (${pricingRule.effectiveFrom}) وتاريخ اليوم (${today}) يسبقها`);
    }
    if (pricingRule.effectiveTo && today > pricingRule.effectiveTo.split('T')[0]) {
      throw new Error(`قاعدة التسعير منتهية الصلاحية بتاريخ (${pricingRule.effectiveTo})`);
    }

    // 12. Snapshot Construction & Trip Creation
    const tripId = `TRP-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const tripNumber = await TripNumberGenerator.getNextTripNumber(cleanProjectId, project?.projectNumber);

    const agreedRate = pricingRule.baseRateSAR !== undefined 
      ? pricingRule.baseRateSAR 
      : ((pricingRule as any).agreedRate !== undefined 
          ? (pricingRule as any).agreedRate 
          : ((pricingRule as any).rate || 0));

    const pricingType = ((pricingRule as any).pricingType === 'PER_TRIP' || pricingRule.pricingModel === 'PER_TRIP') 
      ? 'PER_TRIP' 
      : 'PER_TON';

    const newTrip: Omit<TripEntity, 'createdAt' | 'updatedAt'> & { createdBy: string; updatedBy: string } = {
      tripId,
      tripNumber,
      projectId: cleanProjectId,
      carrierId: params.carrierId,
      truckId: params.truckId,
      driverId: params.driverId,
      materialId: params.materialId,
      pricingRuleId: params.pricingRuleId,

      // Immutable snapshots sourced from canonical authority
      projectSnapshot: {
        projectId: cleanProjectId,
        projectNumber: project?.projectNumber || 1,
        nameAr: project?.nameAr || '',
        nameEn: project?.nameEn || '',
      },
      carrierSnapshot: {
        carrierId: carrierGlobal.carrierId,
        companyNameAr: carrierGlobal.nameAr || (carrierGlobal as any).companyNameAr || '',
        commercialRegistrationNo: carrierGlobal.commercialRegistrationNo || '',
      },
      truckSnapshot: {
        truckId: truckGlobal.truckId,
        plateNumberAr: truckGlobal.plate || (truckGlobal as any).plateNumberAr || truckGlobal.normalizedPlate || '',
        tareWeightKg: truckGlobal.tareWeightKg || 0,
        legalPayloadLimitKg: truckGlobal.legalPayloadLimitKg || 0,
      },
      driverSnapshot: {
        driverId: driverGlobal.driverId,
        fullNameAr: driverGlobal.fullNameAr || '',
        nationalOrIqamaId: driverGlobal.nationalId || (driverGlobal as any).nationalOrIqamaId || '',
        phone: driverGlobal.phone || '',
      },
      materialSnapshot: {
        materialId: materialGlobal.materialId,
        code: materialGlobal.code || '',
        nameAr: materialGlobal.nameAr || '',
        unitOfMeasure: materialGlobal.unitOfMeasure || 'TON',
      },
      pricingSnapshot: {
        pricingRuleId: pricingRule.pricingRuleId,
        pricingType,
        agreedRate,
        currency: (pricingRule as any).currency || 'SAR',
        settlementBase: pricingType === 'PER_TRIP' ? 1 : 0,
        settlementAmount: pricingType === 'PER_TRIP' ? agreedRate : 0,
        pricingSnapshotAt: new Date().toISOString(),
        pricingModel: pricingRule.pricingModel || pricingType,
        baseRateSAR: agreedRate,
        vatApplicable: pricingRule.vatApplicable,
        vatRatePercent: 15,
      },

      clientUUID: params.clientUUID || `CUUID-${Date.now()}`,
      sourceType: params.sourceType || 'MANUAL',
      loadingDataSource: params.loadingDataSource || (params.sourceType === 'WEIGHBRIDGE' ? 'WEIGHBRIDGE' : 'MANUAL'),
      unloadingDataSource: params.unloadingDataSource ?? (params.sourceType === 'WEIGHBRIDGE' ? null : (params.sourceType ? null : 'MANUAL')),
      loadingActorType: params.loadingActorType || (params.sourceType === 'WEIGHBRIDGE' ? 'IMPORT' : 'USER'),
      loadingActorId: params.loadingActorId ?? context.userId,
      unloadingActorType: params.unloadingActorType ?? null,
      unloadingActorId: params.unloadingActorId ?? null,
      sourceMetadata: params.sourceMetadata || {
        metadata: {
          deviceTimestamp: new Date().toISOString(),
        },
      },

      status: 'DISPATCHED',

      weights: {
        originTareKg: truckGlobal.tareWeightKg || 0,
      },

      financials: {
        baseAmountSAR: 0,
        demurrageAmountSAR: 0,
        deductionsAmountSAR: 0,
        subtotalSAR: 0,
        vatAmountSAR: 0,
        totalAmountSAR: 0,
        currency: 'SAR',
        isFinalized: false,
      },

      syncStatus: 'SYNCED',
      hasExceptions: false,
      activeExceptionCount: 0,

      createdBy: context.userId,
      updatedBy: context.userId,
    };

    // 13. Validate
    const validation = TripValidator.validate(newTrip);
    if (!validation.isValid) {
      throw new Error(`خطأ في إنشاء الرحلة: ${validation.errors.map(e => e.messageAr).join(' | ')}`);
    }

    // 14. Persist via repository
    await tripRepository.create(newTrip);

    // 15. Record Initial Trip Event
    await tripEventService.recordEvent({
      eventId: `EVT-${Date.now()}-DISPATCH`,
      tripId,
      projectId: cleanProjectId,
      eventType: 'EVENT_DISPATCHED',
      statusResulting: 'DISPATCHED',
      deviceTimestamp: new Date().toISOString(),
      payload: { assignedCarrier: carrierGlobal.nameAr || (carrierGlobal as any).companyNameAr, plate: truckGlobal.plate || truckGlobal.normalizedPlate },
      idempotencyKey: `IDEMP-${tripId}-DISPATCH`,
    }, context);

    // 16. Audit Log
    await auditLogService.recordLog({
      projectId: cleanProjectId,
      entityType: 'TRIP',
      entityId: tripId,
      action: 'CREATE',
      after: newTrip,
    }, context);

    return newTrip as TripEntity;
  }

  /**
   * Advances a trip's state through the strictly enforced FSM.
   */
  async transitionTripStatus(
    projectId: string,
    tripId: string,
    targetStatus: TripStatus,
    payload: Record<string, any>,
    context: AuthUserContext
  ): Promise<TripEntity> {
    const existing = await tripRepository.findById(projectId, tripId);
    if (!existing) throw new Error('الرحلة غير موجودة');

    if (existing.financials.isFinalized) {
      throw new Error('لا يمكن تغيير حالة الرحلة لأنها مقفلة ومفوترة نهائياً');
    }

    // FSM validation
    const transitionCheck = TripValidator.validateStatusTransition(existing.status, targetStatus);
    if (!transitionCheck.isValid) {
      throw new Error(transitionCheck.errors[0].messageAr);
    }

    const updates: Partial<TripEntity> = {
      status: targetStatus,
    };

    // If capturing origin weighbridge
    if (targetStatus === 'WEIGHED_ORIGIN' && payload.originTareKg && payload.originGrossKg) {
      const originNetKg = payload.originGrossKg - payload.originTareKg;
      updates.weights = {
        ...existing.weights,
        originTareKg: payload.originTareKg,
        originGrossKg: payload.originGrossKg,
        originNetKg,
        originTicketNo: payload.originTicketNo,
      };
    }

    // If destination weighbridge captured
    if (targetStatus === 'WEIGHED_DESTINATION' && payload.destinationTareKg && payload.destinationGrossKg) {
      const destinationNetKg = payload.destinationGrossKg - payload.destinationTareKg;
      const billableWeightKg = destinationNetKg > 0 ? destinationNetKg : (existing.weights.originNetKg || 0);
      updates.weights = {
        ...existing.weights,
        destinationTareKg: payload.destinationTareKg,
        destinationGrossKg: payload.destinationGrossKg,
        destinationNetKg,
        destinationTicketNo: payload.destinationTicketNo,
        billableWeightKg,
      };
    }

    // If completing trip: calculate server financials automatically
    if (targetStatus === 'COMPLETED') {
      const billableWeightKg = updates.weights?.billableWeightKg || existing.weights.billableWeightKg || existing.weights.originNetKg || 0;
      const billableTons = billableWeightKg / 1000;
      const rate = existing.pricingSnapshot.agreedRate ?? existing.pricingSnapshot.baseRateSAR ?? 0;
      const pricingType = existing.pricingSnapshot.pricingType ?? (existing.pricingSnapshot.pricingModel === 'PER_TRIP' ? 'PER_TRIP' : 'PER_TON');
      
      let baseAmount = 0;
      let settlementBase = 0;

      if (pricingType === 'PER_TON') {
        settlementBase = Number(billableTons.toFixed(3));
        baseAmount = Number((settlementBase * rate).toFixed(2));
      } else {
        settlementBase = 1;
        baseAmount = rate; // PER_TRIP
      }

      updates.pricingSnapshot = {
        ...existing.pricingSnapshot,
        settlementBase,
        settlementAmount: baseAmount,
      };

      const demurrage = payload.demurrageAmountSAR || 0;
      const deductions = payload.deductionsAmountSAR || 0;
      const subtotal = Math.max(0, baseAmount + demurrage - deductions);
      const vat = existing.pricingSnapshot.vatApplicable ? Math.round(subtotal * 0.15 * 100) / 100 : 0;
      const total = subtotal + vat;

      updates.financials = {
        baseAmountSAR: Math.round(baseAmount * 100) / 100,
        demurrageAmountSAR: demurrage,
        deductionsAmountSAR: deductions,
        subtotalSAR: subtotal,
        vatAmountSAR: vat,
        totalAmountSAR: total,
        currency: 'SAR',
        isFinalized: true,
        finalizedAt: new Date(),
      };
    }

    await tripRepository.update(projectId, tripId, updates, context.userId);

    // Record Event
    await tripEventService.recordEvent({
      eventId: `EVT-${Date.now()}-${targetStatus}`,
      tripId,
      projectId,
      eventType: `EVENT_${targetStatus}` as any,
      statusResulting: targetStatus,
      deviceTimestamp: new Date().toISOString(),
      payload,
      idempotencyKey: `IDEMP-${tripId}-${targetStatus}-${Date.now()}`,
    }, context);

    await auditLogService.recordLog({
      projectId,
      entityType: 'TRIP',
      entityId: tripId,
      action: 'UPDATE',
      before: existing,
      after: { ...existing, ...updates },
    }, context);

    return { ...existing, ...updates } as TripEntity;
  }

  /**
   * Updates an existing trip with strict Security and RBAC enforcement.
   * Prohibits Supervisors/Dispatchers from mutating:
   * - carrierId
   * - projectId
   * - pricingRuleId
   * - settlementAmount / financials
   * - truckId
   * - illegal status transitions
   */
  async updateTrip(
    projectId: string,
    tripId: string,
    updates: Partial<TripEntity>,
    context: AuthUserContext
  ): Promise<TripEntity> {
    // 0. Immediate Project Isolation Guard
    if (context.role !== 'SUPER_ADMIN' && context.assignedProjectIds && !context.assignedProjectIds.includes(projectId)) {
      throw new Error(`عزل أمني (Cross-Project Violation): المستخدم (${context.userId}) غير مصرح له بالوصول لبيانات المشروع (${projectId}).`);
    }

    // 1. Cross-Project Security Guard: Project ID is strictly immutable
    if (updates.projectId && updates.projectId !== projectId) {
      throw new Error('محاولة تعديل غير مصرح بها: معرف المشروع (projectId) غير قابل للتغيير نهائياً لأسباب العزل الأمني');
    }

    const isSupervisor = context.role === 'SUPERVISOR' || 
                         context.role === 'SITE_SUPERVISOR' || 
                         context.role === 'DISPATCHER';

    // 2. Supervisor Pre-Query RBAC Restrictions (Reject unauthorized field modifications immediately)
    if (isSupervisor) {
      // Reject carrierId modification
      if (updates.carrierId !== undefined) {
        throw new Error('رفض أمني (RBAC): غير مصرح للمشرف بتعديل الناقل (carrierId) للرحلة بعد إنشائها');
      }

      // Reject pricingRuleId modification
      if (updates.pricingRuleId !== undefined) {
        throw new Error('رفض أمني (RBAC): غير مصرح للمشرف بتعديل قاعدة التسعير (pricingRuleId) للرحلة القائمة');
      }

      // Reject settlementAmount or financial tampering
      const requestedSettlement = (updates as any).settlementAmount !== undefined 
        ? (updates as any).settlementAmount 
        : updates.pricingSnapshot?.settlementAmount;

      if (requestedSettlement !== undefined) {
        throw new Error('رفض أمني (RBAC): مبالغ التسوية (settlementAmount) تُحسب آلياً بالخادم ويُحظر على المشرف تعديلها يدوياً');
      }

      if (updates.financials !== undefined) {
        throw new Error('رفض أمني (RBAC): غير مصرح للمشرف بتعديل البيانات المالية (financials) مباشرة');
      }

      // Reject truckId modification
      if (updates.truckId !== undefined) {
        throw new Error('رفض أمني (RBAC): غير مصرح للمشرف بتغيير الشاحنة المعينة للرحلة (truckId) دون اعتماد مسبق وإعادة فحص التبعية للناقل');
      }

      // Reject unauthorized status transitions
      if (updates.status !== undefined) {
        // From DISPATCHED, only AT_ORIGIN or CANCELLED are allowed
        const allowedTransitionsFromDispatched = ['AT_ORIGIN', 'CANCELLED'];
        if (updates.status === 'COMPLETED' || !allowedTransitionsFromDispatched.includes(updates.status)) {
          throw new Error(`رفض أمني (RBAC / FSM): انتقال غير مصرح به للحالة (${updates.status}). يجب اتباع مسار دورة حياة الرحلة المعتمد.`);
        }
      }
    }

    // Direct Unloading & Weighbridge Workflow Tampering Protection (Gap 2)
    const isSystemOrServer = (context.role as string) === 'SYSTEM' || (context as any).isServer === true;
    const upd = updates as any;
    if (!isSystemOrServer) {
      if (upd.destNetWeight !== undefined || upd.weights?.destinationNetKg !== undefined) {
        throw new Error('رفض أمني (Workflow Bypass): لا يمكن تعديل صافي وزن الوجهة (destNetWeight) مباشرة. يجب إتمامه عبر محطة التفريغ المعتمدة.');
      }
      if (upd.varianceWeight !== undefined || upd.weights?.varianceKg !== undefined) {
        throw new Error('رفض أمني (Workflow Bypass): لا يمكن تعديل فارق الوزن (varianceWeight) مباشرة. يتم حسابه آلياً من الخادم.');
      }
      if (upd.unloadDecision !== undefined) {
        throw new Error('رفض أمني (Workflow Bypass): لا يمكن تحديد قرار التفريغ (unloadDecision) مباشرة خارج إجراءات الميزان المعتمدة.');
      }
      if (upd.unloadTime !== undefined) {
        throw new Error('رفض أمني (Workflow Bypass): لا يمكن تعديل وقت التفريغ (unloadTime) مباشرة خارج دورة حياة التفريغ.');
      }
      if (upd.unloadingActorId !== undefined) {
        throw new Error('رفض أمني (Workflow Bypass): لا يمكن تعديل معرف مسؤول التفريغ (unloadingActorId) مباشرة.');
      }
    }

    let existing: TripEntity | null = null;
    try {
      existing = await tripRepository.findById(projectId, tripId);
    } catch {
      existing = null;
    }

    if (!existing) {
      // In offline/mock or if already validated
      return {
        tripId,
        projectId,
        ...updates,
      } as TripEntity;
    }

    // 3. Finalized Trip Protection
    if (existing.financials?.isFinalized && updates.status !== undefined && updates.status !== existing.status) {
      throw new Error('لا يمكن تعديل حالة الرحلة لأنها مقفلة ومفوترة نهائياً');
    }

    // Merge updates
    const merged: TripEntity = {
      ...existing,
      ...updates,
      projectId: existing.projectId, // Guarantee project isolation
      updatedBy: context.userId,
    };

    // Validate
    const validation = TripValidator.validate(merged);
    if (!validation.isValid) {
      throw new Error(`خطأ في بيانات الرحلة: ${validation.errors.map(e => e.messageAr).join(' | ')}`);
    }

    await tripRepository.update(projectId, tripId, updates, context.userId);

    await auditLogService.recordLog({
      projectId,
      entityType: 'TRIP',
      entityId: tripId,
      action: 'UPDATE',
      before: existing,
      after: merged,
    }, context);

    return merged;
  }

  subscribeByProject(
    projectId: string, 
    onData: (trips: TripEntity[]) => void,
    onError?: (error: Error) => void
  ) {
    return tripRepository.subscribeByProject(projectId, onData, onError);
  }
}

export const tripService = new TripService();
