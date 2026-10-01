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

export interface ImportedTripOperationalData {
  shiftDate?: string;
  ticketId?: string;
  tareWeightKg?: number;
  grossWeightKg?: number;
  netWeightKg?: number;
  destinationNetWeightKg?: number;
  weighTime?: string;
  loadTime?: string;
  unloadTime?: string;
  legacyStatus?: string;
  tripSerial?: number | string;
  note?: string;
}

export interface ImportedTripDispatchParams {
  projectId: string;
  carrierId: string;
  truckId: string;
  driverId: string;
  materialId: string;
  pricingRuleId?: string | null;
  pricingMode?: 'RESOLVED' | 'PENDING';
  clientUUID?: string;
  sourceType?: OperationSourceType;
  loadingDataSource?: OperationSourceType;
  unloadingDataSource?: OperationSourceType | null;
  loadingActorType?: OperationActorType;
  loadingActorId?: string | null;
  unloadingActorType?: OperationActorType | null;
  unloadingActorId?: string | null;
  sourceMetadata?: TripSourceMetadata;
  operationalData?: ImportedTripOperationalData;
}

export interface TripPersistenceContext {
  tripRepository: {
    findById(projectId: string, tripId: string): Promise<TripEntity | null>;
    listByProject(projectId: string, maxLimit?: number): Promise<TripEntity[]>;
    create(trip: Omit<TripEntity, 'createdAt' | 'updatedAt'> & { createdBy: string; updatedBy: string }): Promise<void>;
    update(projectId: string, tripId: string, updates: Partial<TripEntity>, updatedBy: string): Promise<void>;
  };
  projectRepository: {
    findById(projectId: string): Promise<any>;
  };
  globalCarrierRepository: {
    findById(carrierId: string): Promise<any>;
  };
  globalTruckRepository: {
    findById(truckId: string): Promise<any>;
  };
  globalDriverRepository: {
    findById(driverId: string): Promise<any>;
  };
  globalMaterialRepository: {
    findById(materialId: string): Promise<any>;
  };
  projectCarrierMembershipRepository: {
    getMembership(projectId: string, carrierId: string): Promise<any>;
  };
  projectTruckMembershipRepository: {
    getMembership(projectId: string, truckId: string): Promise<any>;
  };
  projectDriverMembershipRepository: {
    getMembership(projectId: string, driverId: string): Promise<any>;
  };
  projectMaterialMembershipRepository: {
    getMembership(projectId: string, materialId: string): Promise<any>;
  };
  projectDriverCarrierAffiliationRepository: {
    getAffiliation(projectId: string, driverId: string): Promise<any>;
  };
  projectTruckCarrierAffiliationRepository: {
    getAffiliation(projectId: string, truckId: string): Promise<any>;
  };
  projectDriverTruckAssignmentRepository: {
    getActiveAssignmentByDriver(projectId: string, driverId: string): Promise<any>;
    getActiveAssignmentByTruck(projectId: string, truckId: string): Promise<any>;
  };
  projectTruckMaterialAllocationRepository: {
    getActiveAllocationByTruck(projectId: string, truckId: string): Promise<any>;
  };
  pricingRuleRepository: {
    findById(projectId: string, pricingRuleId: string): Promise<any>;
  };
  tripNumberGenerator: {
    getNextTripNumber(projectId: string, projectNumberVal?: number): Promise<string>;
  };
  tripEventService: {
    recordEvent(payload: any, context: AuthUserContext): Promise<any>;
  };
  auditLogService: {
    recordLog(params: any, context: AuthUserContext): Promise<any>;
  };
}

export class TripService {
  private persistence: TripPersistenceContext;

  constructor(persistence?: Partial<TripPersistenceContext>) {
    this.persistence = {
      tripRepository: persistence?.tripRepository || tripRepository,
      projectRepository: persistence?.projectRepository || projectRepository,
      globalCarrierRepository: persistence?.globalCarrierRepository || globalCarrierRepository,
      globalTruckRepository: persistence?.globalTruckRepository || globalTruckRepository,
      globalDriverRepository: persistence?.globalDriverRepository || globalDriverRepository,
      globalMaterialRepository: persistence?.globalMaterialRepository || globalMaterialRepository,
      projectCarrierMembershipRepository: persistence?.projectCarrierMembershipRepository || projectCarrierMembershipRepository,
      projectTruckMembershipRepository: persistence?.projectTruckMembershipRepository || projectTruckMembershipRepository,
      projectDriverMembershipRepository: persistence?.projectDriverMembershipRepository || projectDriverMembershipRepository,
      projectMaterialMembershipRepository: persistence?.projectMaterialMembershipRepository || projectMaterialMembershipRepository,
      projectDriverCarrierAffiliationRepository: persistence?.projectDriverCarrierAffiliationRepository || projectDriverCarrierAffiliationRepository,
      projectTruckCarrierAffiliationRepository: persistence?.projectTruckCarrierAffiliationRepository || projectTruckCarrierAffiliationRepository,
      projectDriverTruckAssignmentRepository: persistence?.projectDriverTruckAssignmentRepository || projectDriverTruckAssignmentRepository,
      projectTruckMaterialAllocationRepository: persistence?.projectTruckMaterialAllocationRepository || projectTruckMaterialAllocationRepository,
      pricingRuleRepository: persistence?.pricingRuleRepository || pricingRuleRepository,
      tripNumberGenerator: persistence?.tripNumberGenerator || TripNumberGenerator,
      tripEventService: persistence?.tripEventService || tripEventService,
      auditLogService: persistence?.auditLogService || auditLogService,
    };
  }

  async getTrip(projectId: string, tripId: string): Promise<TripEntity | null> {
    return this.persistence.tripRepository.findById(projectId, tripId);
  }

  async getTripsByProject(projectId: string, maxLimit = 100): Promise<TripEntity[]> {
    return this.persistence.tripRepository.listByProject(projectId, maxLimit);
  }

  /**
   * Helper: Validates canonical project status, memberships, global identities, carrier affiliations,
   * temporal assignments, and material allocations. Shared between manual dispatch and imported trip creation.
   */
  private async validateCanonicalTripEntities(
    cleanProjectId: string,
    carrierId: string,
    truckId: string,
    driverId: string,
    materialId: string
  ) {
    const project = await this.persistence.projectRepository.findById(cleanProjectId);
    if (!project) {
      throw new Error('المشروع غير موجود أو غير صالح');
    }
    if (project.status === 'ARCHIVED' || project.status === 'SUSPENDED') {
      throw new Error(`حالة المشروع (${project.status}) لا تسمح بترحيل رحلات تشغيلية`);
    }

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
    ] = await Promise.all([
      this.persistence.globalCarrierRepository.findById(carrierId),
      this.persistence.projectCarrierMembershipRepository.getMembership(cleanProjectId, carrierId),
      this.persistence.globalMaterialRepository.findById(materialId),
      this.persistence.projectMaterialMembershipRepository.getMembership(cleanProjectId, materialId),
      this.persistence.globalDriverRepository.findById(driverId),
      this.persistence.projectDriverMembershipRepository.getMembership(cleanProjectId, driverId),
      this.persistence.globalTruckRepository.findById(truckId),
      this.persistence.projectTruckMembershipRepository.getMembership(cleanProjectId, truckId),
      this.persistence.projectDriverCarrierAffiliationRepository.getAffiliation(cleanProjectId, driverId),
      this.persistence.projectTruckCarrierAffiliationRepository.getAffiliation(cleanProjectId, truckId),
      this.persistence.projectDriverTruckAssignmentRepository.getActiveAssignmentByDriver(cleanProjectId, driverId),
      this.persistence.projectDriverTruckAssignmentRepository.getActiveAssignmentByTruck(cleanProjectId, truckId),
      this.persistence.projectTruckMaterialAllocationRepository.getActiveAllocationByTruck(cleanProjectId, truckId),
    ]);

    if (!carrierGlobal || (carrierGlobal.status !== undefined && carrierGlobal.status !== 'ACTIVE')) {
      throw new Error('الناقل المحدد غير موجود في الهوية الموحدة أو غير نشط (INACTIVE)');
    }
    if (!carrierMembership || carrierMembership.status !== 'ACTIVE') {
      throw new Error(`الناقل (${carrierId}) ليس لديه عضوية نشطة (ACTIVE) في هذا المشروع`);
    }

    if (!materialGlobal || (materialGlobal.status !== undefined && materialGlobal.status !== 'ACTIVE')) {
      throw new Error('المادة المحددة غير موجودة في الهوية الموحدة أو غير نشطة (INACTIVE)');
    }
    if (!materialMembership || materialMembership.status !== 'ACTIVE') {
      throw new Error(`المادة (${materialId}) ليس لديها عضوية نشطة (ACTIVE) في هذا المشروع`);
    }

    if (!driverGlobal || (driverGlobal.status !== undefined && driverGlobal.status !== 'ACTIVE')) {
      throw new Error('السائق المحدد غير موجود في الهوية الموحدة أو غير نشط (INACTIVE)');
    }
    if (!driverMembership || driverMembership.status !== 'ACTIVE') {
      throw new Error(`السائق (${driverId}) ليس لديه عضوية نشطة (ACTIVE) في هذا المشروع`);
    }

    if (!truckGlobal || (truckGlobal.status !== undefined && truckGlobal.status !== 'ACTIVE')) {
      throw new Error('الشاحنة المحددة غير موجودة في الهوية الموحدة أو غير مصرح لها بالعمل (INACTIVE)');
    }
    if (!truckMembership || truckMembership.status !== 'ACTIVE') {
      throw new Error(`الشاحنة (${truckId}) ليس لديها عضوية نشطة (ACTIVE) في هذا المشروع`);
    }

    if (!driverAssignment || !driverAssignment.truckId || !truckAssignment || !truckAssignment.driverId) {
      throw new Error(`لا يوجد تعيين تشغيلي نشط (Driver ↔ Truck) بين السائق (${driverId}) والشاحنة (${truckId})`);
    }
    if (driverAssignment.truckId !== truckId || truckAssignment.driverId !== driverId) {
      throw new Error(`تعارض في التعيين التشغيلي: السائق (${driverId}) معين للشاحنة (${driverAssignment.truckId}) بينما الشاحنة (${truckId}) معينة للسائق (${truckAssignment.driverId})`);
    }

    if (!driverAffiliation || driverAffiliation.status !== 'ACTIVE') {
      throw new Error(`السائق (${driverId}) ليس لديه تبعية نشطة لناقل (Carrier Affiliation) في هذا المشروع`);
    }
    if (driverAffiliation.carrierId !== carrierId) {
      throw new Error(`السائق المحدد (${driverId}) تابع للناقل (${driverAffiliation.carrierId}) وليس للناقل المختار (${carrierId}) [العلاقة: Driver → Carrier]`);
    }

    if (!truckAffiliation || truckAffiliation.status !== 'ACTIVE') {
      throw new Error(`الشاحنة (${truckId}) ليس لديها تبعية نشطة لناقل (Carrier Affiliation) في هذا المشروع`);
    }
    if (truckAffiliation.carrierId !== carrierId) {
      throw new Error(`الشاحنة المحددة (${truckId}) تابعة للناقل (${truckAffiliation.carrierId}) وليس للناقل المختار (${carrierId}) [العلاقة: Truck → Carrier]`);
    }

    if (!truckMaterialAllocation || !truckMaterialAllocation.materialId) {
      throw new Error(`لا يوجد تخصيص مادة نشط (Truck ↔ Material) للشاحنة (${truckId})`);
    }
    if (truckMaterialAllocation.materialId !== materialId) {
      throw new Error(`الشاحنة (${truckId}) مخصصة للمادة (${truckMaterialAllocation.materialId}) وليس للمادة المختارة (${materialId}) [العلاقة: Truck ↔ Material]`);
    }

    return {
      project,
      carrierGlobal,
      materialGlobal,
      driverGlobal,
      truckGlobal,
    };
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

    const { project, carrierGlobal, materialGlobal, driverGlobal, truckGlobal } =
      await this.validateCanonicalTripEntities(cleanProjectId, params.carrierId, params.truckId, params.driverId, params.materialId);

    const pricingRule = await this.persistence.pricingRuleRepository.findById(cleanProjectId, params.pricingRuleId);

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
    const tripNumber = await this.persistence.tripNumberGenerator.getNextTripNumber(cleanProjectId, project?.projectNumber);

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
    await this.persistence.tripRepository.create(newTrip);

    // 15. Record Initial Trip Event
    await this.persistence.tripEventService.recordEvent({
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
    await this.persistence.auditLogService.recordLog({
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
    const existing = await this.persistence.tripRepository.findById(projectId, tripId);
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

    await this.persistence.tripRepository.update(projectId, tripId, updates, context.userId);

    // Record Event
    await this.persistence.tripEventService.recordEvent({
      eventId: `EVT-${Date.now()}-${targetStatus}`,
      tripId,
      projectId,
      eventType: `EVENT_${targetStatus}` as any,
      statusResulting: targetStatus,
      deviceTimestamp: new Date().toISOString(),
      payload,
      idempotencyKey: `IDEMP-${tripId}-${targetStatus}-${Date.now()}`,
    }, context);

    await this.persistence.auditLogService.recordLog({
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
      existing = await this.persistence.tripRepository.findById(projectId, tripId);
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

    await this.persistence.tripRepository.update(projectId, tripId, updates, context.userId);

    await this.persistence.auditLogService.recordLog({
      projectId,
      entityType: 'TRIP',
      entityId: tripId,
      action: 'UPDATE',
      before: existing,
      after: merged,
    }, context);

    return merged;
  }

  /**
   * Dispatches an imported trip authoritatively using server canonical entity validation,
   * project memberships, affiliations, allocations, server trip number generation,
   * and server snapshot construction, preserving source operational weights, metadata, and ticket data.
   */
  async dispatchImportedTrip(params: ImportedTripDispatchParams, context: AuthUserContext): Promise<TripEntity> {
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

    const cleanProjectId = params.projectId.trim();

    // 1. Shared canonical entity, membership, affiliation, assignment & allocation validation
    const { project, carrierGlobal, materialGlobal, driverGlobal, truckGlobal } =
      await this.validateCanonicalTripEntities(cleanProjectId, params.carrierId, params.truckId, params.driverId, params.materialId);

    // 2. Pricing Resolution Authority
    let pricingRule: any = null;
    if (params.pricingRuleId && params.pricingRuleId !== 'UNRESOLVED_PENDING' && params.pricingRuleId !== 'PENDING') {
      try {
        pricingRule = await this.persistence.pricingRuleRepository.findById(cleanProjectId, params.pricingRuleId);
      } catch {
        pricingRule = null;
      }
    }

    const opData = params.operationalData || {};
    let pricingSnapshot: any;
    let financials: any;
    let finalPricingRuleId: string;

    if (pricingRule && (pricingRule.status === 'ACTIVE' || pricingRule.isActive !== false)) {
      finalPricingRuleId = pricingRule.pricingRuleId;
      const rate = pricingRule.baseRateSAR !== undefined 
        ? pricingRule.baseRateSAR 
        : ((pricingRule as any).agreedRate !== undefined 
            ? (pricingRule as any).agreedRate 
            : ((pricingRule as any).rate || 0));

      const pType = ((pricingRule as any).pricingType === 'PER_TRIP' || pricingRule.pricingModel === 'PER_TRIP') 
        ? 'PER_TRIP' 
        : 'PER_TON';

      pricingSnapshot = {
        pricingRuleId: pricingRule.pricingRuleId,
        pricingType: pType,
        agreedRate: rate,
        currency: pricingRule.currency || 'SAR',
        settlementBase: rate,
        settlementAmount: rate,
        pricingSnapshotAt: new Date().toISOString(),
      };
      financials = {
        baseAmountSAR: rate,
        vatAmountSAR: pricingRule.vatApplicable ? rate * ((pricingRule.vatRatePercent || 15) / 100) : 0,
        totalAmountSAR: pricingRule.vatApplicable ? rate * (1 + (pricingRule.vatRatePercent || 15) / 100) : rate,
        currency: pricingRule.currency || 'SAR',
        ratePerUnit: rate,
        pricingType: pType,
      };
    } else {
      // Pending pricing mode preserved explicitly
      finalPricingRuleId = 'UNRESOLVED_PENDING';
      pricingSnapshot = {
        pricingRuleId: 'UNRESOLVED_PENDING',
        pricingType: 'LEGACY_UNRESOLVED',
        agreedRate: 0,
        currency: 'SAR',
        settlementBase: 0,
        settlementAmount: 0,
        pricingSnapshotAt: new Date().toISOString(),
      };
      financials = {
        baseAmountSAR: 0,
        vatAmountSAR: 0,
        totalAmountSAR: 0,
        currency: 'SAR',
        ratePerUnit: 0,
        pricingType: 'LEGACY_UNRESOLVED',
      };
    }

    // 3. Operational Weights Invariant Handling
    let originTare = opData.tareWeightKg;
    let originGross = opData.grossWeightKg;
    let originNet = opData.netWeightKg;

    if (typeof originGross === 'number' && typeof originTare === 'number' && originGross >= originTare) {
      const computedNet = originGross - originTare;
      if (typeof originNet === 'number' && originNet > 0 && Math.abs(originNet - computedNet) > 0.01) {
        originNet = computedNet;
      } else if (typeof originNet !== 'number') {
        originNet = computedNet;
      }
    }

    // 4. Status Mapping
    let mappedStatus: TripStatus | null = null;
    if (opData.legacyStatus) {
      const s = String(opData.legacyStatus).toUpperCase().trim();
      if (s === 'COMPLETED' || s === 'DELIVERED' || s === 'OFFLOADED') {
        mappedStatus = 'COMPLETED';
      } else if (s === 'WEIGHED_ORIGIN' || s === 'ORIGIN_WEIGHED' || s === 'WEIGHED') {
        mappedStatus = 'WEIGHED_ORIGIN';
      } else if (s === 'IN_TRANSIT') {
        mappedStatus = 'IN_TRANSIT';
      } else if (s === 'LOADING') {
        mappedStatus = 'LOADING';
      } else if (s === 'DISPATCHED' || s === 'DRAFT' || s === 'REJECTED' || s === 'CANCELLED') {
        mappedStatus = s as TripStatus;
      }
    }

    if (!mappedStatus) {
      if (typeof opData.destinationNetWeightKg === 'number' && opData.destinationNetWeightKg > 0) {
        mappedStatus = 'COMPLETED';
      } else if (typeof originNet === 'number' && originNet > 0) {
        mappedStatus = 'WEIGHED_ORIGIN';
      } else {
        mappedStatus = 'DISPATCHED';
      }
    }

    // 5. Server-Authoritative Identity & Numbering
    const tripId = `TRP-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const tripNumber = await this.persistence.tripNumberGenerator.getNextTripNumber(cleanProjectId, project?.projectNumber);

    // 6. Build Server-Authoritative Canonical Entity Snapshots
    const carrierSnapshot = {
      carrierId: carrierGlobal.carrierId,
      companyNameAr: carrierGlobal.nameAr || (carrierGlobal as any).companyNameAr || carrierGlobal.name || '',
      commercialRegistrationNo: carrierGlobal.commercialRegistrationNo || '',
    };
    const truckSnapshot = {
      truckId: truckGlobal.truckId,
      plateNumberAr: truckGlobal.plate || (truckGlobal as any).plateNumberAr || truckGlobal.normalizedPlate || '',
      tareWeightKg: truckGlobal.tareWeightKg || 0,
      legalPayloadLimitKg: truckGlobal.legalPayloadLimitKg || 0,
    };
    const driverSnapshot = {
      driverId: driverGlobal.driverId,
      fullNameAr: driverGlobal.fullNameAr || driverGlobal.name || '',
      nationalOrIqamaId: driverGlobal.idNumber || (driverGlobal as any).nationalOrIqamaId || '',
      phone: driverGlobal.phone || '',
    };
    const materialSnapshot = {
      materialId: materialGlobal.materialId,
      code: materialGlobal.code || '',
      nameAr: materialGlobal.nameAr || materialGlobal.name || '',
      unitOfMeasure: materialGlobal.unitOfMeasure || 'TON',
    };

    const sourceType = params.sourceType || 'EXCEL';
    const sourceMetadata: TripSourceMetadata = {
      ...(params.sourceMetadata || {}),
      importBatchId: params.sourceMetadata?.importBatchId,
      sourceFileName: params.sourceMetadata?.sourceFileName,
      sourceSheetName: params.sourceMetadata?.sourceSheetName,
      sourceRowId: params.sourceMetadata?.sourceRowId,
      legacyTripSerial: opData.tripSerial || params.sourceMetadata?.legacyTripSerial,
      legacyStatus: opData.legacyStatus || params.sourceMetadata?.legacyStatus,
    };

    const newTrip: TripEntity = {
      tripId,
      tripNumber,
      projectId: cleanProjectId,
      carrierId: params.carrierId,
      truckId: params.truckId,
      driverId: params.driverId,
      materialId: params.materialId,
      pricingRuleId: finalPricingRuleId,
      clientUUID: params.clientUUID,
      sourceType,
      loadingDataSource: params.loadingDataSource || sourceType,
      unloadingDataSource: params.unloadingDataSource || null,
      loadingActorType: params.loadingActorType || 'IMPORT',
      loadingActorId: params.loadingActorId || context.userId,
      unloadingActorType: params.unloadingActorType || null,
      unloadingActorId: params.unloadingActorId || null,
      sourceMetadata,
      projectSnapshot: {
        projectId: cleanProjectId,
        projectNumber: project?.projectNumber || 1,
        nameAr: project?.nameAr || '',
        nameEn: project?.nameEn || '',
      },
      carrierSnapshot,
      truckSnapshot,
      driverSnapshot,
      materialSnapshot,
      pricingSnapshot,
      status: mappedStatus,
      weights: {
        originTareKg: originTare,
        originGrossKg: originGross,
        originNetKg: originNet,
        originTicketNo: opData.ticketId,
        destinationNetKg: opData.destinationNetWeightKg,
        billableWeightKg: opData.destinationNetWeightKg || originNet || 0,
      },
      financials,
      createdBy: context.userId,
      updatedBy: context.userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.persistence.tripRepository.create(newTrip);

    try {
      await this.persistence.tripEventService.recordEvent(
        {
          tripId: newTrip.tripId,
          projectId: newTrip.projectId,
          eventType: 'DISPATCHED_IMPORTED',
          actorId: context.userId,
          actorType: 'IMPORT',
          payload: {
            tripNumber: newTrip.tripNumber,
            sourceType: newTrip.sourceType,
            importBatchId: sourceMetadata.importBatchId,
            sourceRowId: sourceMetadata.sourceRowId,
          },
        },
        context
      );
    } catch (err) {
      console.warn('TripEvent creation warning for imported trip:', err);
    }

    try {
      await this.persistence.auditLogService.recordLog(
        {
          projectId: newTrip.projectId,
          action: 'DISPATCH_IMPORTED_TRIP',
          resourceType: 'TRIP',
          resourceId: newTrip.tripId,
          details: {
            tripNumber: newTrip.tripNumber,
            carrierId: newTrip.carrierId,
            truckId: newTrip.truckId,
            driverId: newTrip.driverId,
            materialId: newTrip.materialId,
            pricingRuleId: newTrip.pricingRuleId,
            sourceType: newTrip.sourceType,
            importBatchId: sourceMetadata.importBatchId,
          },
        },
        context
      );
    } catch (err) {
      console.warn('AuditLog creation warning for imported trip:', err);
    }

    return newTrip;
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
