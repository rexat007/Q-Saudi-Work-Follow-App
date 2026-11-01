import {snapshotOperationalConfiguration,resolveOperationalWeights,resolveTimeMetrics,profileTransitionAllowed,validateOperationalConfiguration} from './operationalProfileResolver';
import { commercialTotals, PricingService } from './pricing.service';
import { isCurrentTemporal, assignmentSlotsAgree } from '../utils/temporalRelationshipPolicy';
import { evaluateGlobalEligibility } from '../utils/globalIdentityPolicy';
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
  driverId: string | null;
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
  driverId: string | null;
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
    resolve?(projectId:string,carrierId:string,materialId:string,date:string,requestedId?:string):Promise<any>;
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

    const configuration=project.operationalConfiguration?validateOperationalConfiguration(project.operationalConfiguration):null;
    const optionalDriver=configuration&&configuration.driverIntakeMode!=='PRELOADED_ROSTER'&&!driverId;
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
      optionalDriver?Promise.resolve(null):this.persistence.globalDriverRepository.findById(driverId),
      optionalDriver?Promise.resolve(null):this.persistence.projectDriverMembershipRepository.getMembership(cleanProjectId, driverId),
      this.persistence.globalTruckRepository.findById(truckId),
      this.persistence.projectTruckMembershipRepository.getMembership(cleanProjectId, truckId),
      optionalDriver?Promise.resolve(null):this.persistence.projectDriverCarrierAffiliationRepository.getAffiliation(cleanProjectId, driverId),
      this.persistence.projectTruckCarrierAffiliationRepository.getAffiliation(cleanProjectId, truckId),
      optionalDriver?Promise.resolve(null):this.persistence.projectDriverTruckAssignmentRepository.getActiveAssignmentByDriver(cleanProjectId, driverId),
      this.persistence.projectDriverTruckAssignmentRepository.getActiveAssignmentByTruck(cleanProjectId, truckId),
      this.persistence.projectTruckMaterialAllocationRepository.getActiveAllocationByTruck(cleanProjectId, truckId),
    ]);

    if (!carrierGlobal || !evaluateGlobalEligibility('CARRIER', carrierGlobal).CAN_USE_OPERATIONALLY) {
      throw new Error('الناقل المحدد غير موجود في الهوية الموحدة أو غير نشط (INACTIVE)');
    }
    if (!carrierMembership || carrierMembership.status !== 'ACTIVE') {
      throw new Error(`الناقل (${carrierId}) ليس لديه عضوية نشطة (ACTIVE) في هذا المشروع`);
    }

    if (!materialGlobal || !evaluateGlobalEligibility('MATERIAL', materialGlobal).CAN_USE_OPERATIONALLY) {
      throw new Error('المادة المحددة غير موجودة في الهوية الموحدة أو غير نشطة (INACTIVE)');
    }
    if (!materialMembership || materialMembership.status !== 'ACTIVE') {
      throw new Error(`المادة (${materialId}) ليس لديها عضوية نشطة (ACTIVE) في هذا المشروع`);
    }

    if (!optionalDriver&&(!driverGlobal || !evaluateGlobalEligibility('DRIVER', driverGlobal).CAN_USE_OPERATIONALLY)) {
      throw new Error('السائق المحدد غير موجود في الهوية الموحدة أو غير نشط (INACTIVE)');
    }
    if (!optionalDriver&&(!driverMembership || driverMembership.status !== 'ACTIVE')) {
      throw new Error(`السائق (${driverId}) ليس لديه عضوية نشطة (ACTIVE) في هذا المشروع`);
    }

    if (!truckGlobal || !evaluateGlobalEligibility('TRUCK', truckGlobal).CAN_USE_OPERATIONALLY) {
      throw new Error('الشاحنة المحددة غير موجودة في الهوية الموحدة أو غير مصرح لها بالعمل (INACTIVE)');
    }
    if (!truckMembership || truckMembership.status !== 'ACTIVE') {
      throw new Error(`الشاحنة (${truckId}) ليس لديها عضوية نشطة (ACTIVE) في هذا المشروع`);
    }

    if(!optionalDriver){
    if (!driverAssignment || !driverAssignment.truckId || !truckAssignment || !truckAssignment.driverId) {
      throw new Error(`لا يوجد تعيين تشغيلي نشط (Driver ↔ Truck) بين السائق (${driverId}) والشاحنة (${truckId})`);
    }
    if (driverAssignment.truckId !== truckId || truckAssignment.driverId !== driverId) {
      throw new Error(`تعارض في التعيين التشغيلي: السائق (${driverId}) معين للشاحنة (${driverAssignment.truckId}) بينما الشاحنة (${truckId}) معينة للسائق (${truckAssignment.driverId})`);
    }

    if (!isCurrentTemporal(driverAssignment, new Date()) || !isCurrentTemporal(truckAssignment, new Date()) || !assignmentSlotsAgree(driverAssignment, driverAssignment, truckAssignment) || driverAssignment.driverId !== driverId || truckAssignment.truckId !== truckId) throw new Error('ASSIGNMENT_POINTER_INTEGRITY_ERROR');

    if (!driverAffiliation || driverAffiliation.status !== 'ACTIVE') {
      throw new Error(`السائق (${driverId}) ليس لديه تبعية نشطة لناقل (Carrier Affiliation) في هذا المشروع`);
    }
    if (driverAffiliation.carrierId !== carrierId) {
      throw new Error(`السائق المحدد (${driverId}) تابع للناقل (${driverAffiliation.carrierId}) وليس للناقل المختار (${carrierId}) [العلاقة: Driver → Carrier]`);
    }

    }
    else if(truckAssignment)throw new Error('CANONICAL_ASSIGNED_DRIVER_REQUIRED');
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

    if (!isCurrentTemporal(truckMaterialAllocation, new Date())) throw new Error('ALLOCATION_POINTER_CORRUPTION');

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
    const configuredProject=await this.persistence.projectRepository.findById(params.projectId.trim());
    const configuredIntake=configuredProject?.operationalConfiguration?validateOperationalConfiguration(configuredProject.operationalConfiguration).driverIntakeMode:null;
    if ((!params.driverId || typeof params.driverId !== 'string' || !params.driverId.trim())&&(!configuredIntake||configuredIntake==='PRELOADED_ROSTER')) {
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

    const pricingRule = this.persistence.pricingRuleRepository.resolve
      ? await this.persistence.pricingRuleRepository.resolve(cleanProjectId,params.carrierId,params.materialId,new Date().toISOString(),params.pricingRuleId)
      : await this.persistence.pricingRuleRepository.findById(cleanProjectId, params.pricingRuleId);

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
      driverId: params.driverId||null,
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
      driverSnapshot: driverGlobal?{
        driverId: driverGlobal.driverId,
        fullNameAr: driverGlobal.fullNameAr || '',
        nationalOrIqamaId: driverGlobal.nationalId || (driverGlobal as any).nationalOrIqamaId || '',
        phone: driverGlobal.phone || '',
      }:null,
      materialSnapshot: {
        materialId: materialGlobal.materialId,
        code: materialGlobal.code || '',
        nameAr: materialGlobal.nameAr || '',
        unitOfMeasure: materialGlobal.unitOfMeasure || 'TON',
      },
      pricingSnapshot: {
        pricingRuleId: pricingRule.pricingRuleId,
        pricingRuleVersion: pricingRule.version || 1,
        effectiveFrom: pricingRule.effectiveFrom,
        effectiveTo: pricingRule.effectiveTo || null,
        materialId: params.materialId,
        minimumBillableWeightKg: pricingRule.minimumBillableWeightKg,
        demurrageRatePerHourSAR: pricingRule.demurrageRatePerHourSAR,
        freeTimeHours: pricingRule.freeTimeHours,
        pricingType,
        agreedRate,
        currency: (pricingRule as any).currency || 'SAR',
        settlementBase: pricingType === 'PER_TRIP' ? 1 : 0,
        settlementAmount: pricingType === 'PER_TRIP' ? agreedRate : 0,
        pricingSnapshotAt: new Date().toISOString(),
        pricingModel: pricingRule.pricingModel || pricingType,
        baseRateSAR: agreedRate,
        vatApplicable: pricingRule.vatApplicable,
        vatRatePercent: pricingRule.vatRatePercent ?? 15,
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

      weights: project.operationalConfiguration?{}:{originTareKg:truckGlobal.tareWeightKg||0},
      ...(project.operationalConfiguration?{operationalSnapshot:snapshotOperationalConfiguration(project.operationalConfiguration,project.version||0,params.driverId||null,{truckCapacityKg:truckGlobal.legalPayloadLimitKg,truckType:truckGlobal.truckType,materialId:params.materialId}),operationalTimeline:{}}:{}),

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

    if(newTrip.operationalSnapshot)newTrip.operationalWeights=resolveOperationalWeights(newTrip.operationalSnapshot.configuration,{estimatedCapacityTonnes:newTrip.operationalSnapshot.estimatedCapacityTonnes});
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
    const operational=existing.operationalSnapshot;
    const priorWeights=operational?resolveOperationalWeights(operational.configuration,{loadingMeasuredWeight:existing.weights.originNetKg==null?null:existing.weights.originNetKg/1000,unloadingMeasuredWeight:existing.weights.destinationNetKg==null?null:existing.weights.destinationNetKg/1000,estimatedCapacityTonnes:operational.estimatedCapacityTonnes}):null;
    const transitionCheck = operational?{isValid:profileTransitionAllowed(existing.status,targetStatus,operational,existing.operationalTimeline||{},priorWeights!),errors:[{messageAr:'OPERATIONAL_CHECKPOINT_REQUIRED'}]}:TripValidator.validateStatusTransition(existing.status, targetStatus);
    if (!transitionCheck.isValid) {
      throw new Error(transitionCheck.errors[0].messageAr);
    }

    const updates: Partial<TripEntity> = {
      status: targetStatus,
    };

    if(operational&&payload.unloadDecision==='ACCEPT_ORIGIN_NET_AS_DESTINATION')throw new Error('DERIVED_WEIGHT_IS_NOT_A_MEASUREMENT');
    // If capturing origin weighbridge
    if (targetStatus === 'WEIGHED_ORIGIN' && typeof payload.originTareKg==='number' && typeof payload.originGrossKg==='number') {
      const originNetKg = payload.originGrossKg - payload.originTareKg;
      updates.weights = {
        ...existing.weights,
        originTareKg: payload.originTareKg,
        originGrossKg: payload.originGrossKg,
        originNetKg,
        originTicketNo: payload.originTicketNo,
      };
    }

    // Destination business commands permit either measured gross/tare or an
    // explicit net-only reading. Never fabricate gross/tare from a net entry.
    if (targetStatus === 'WEIGHED_DESTINATION') {
      const measured = typeof payload.destinationTareKg === 'number' && typeof payload.destinationGrossKg === 'number';
      const destinationNetKg = measured ? payload.destinationGrossKg - payload.destinationTareKg : payload.destinationNetKg;
      if (!Number.isFinite(destinationNetKg) || destinationNetKg <= 0) throw new Error('INVALID_DESTINATION_WEIGHT');
      updates.weights = {
        ...existing.weights,
        ...(measured ? { destinationTareKg: payload.destinationTareKg, destinationGrossKg: payload.destinationGrossKg } : {}),
        destinationNetKg,
        destinationTicketNo: payload.destinationTicketNo,
        billableWeightKg: destinationNetKg,
        ...(!operational||operational.profile==='DUAL_WEIGHBRIDGE'?{varianceKg:destinationNetKg-(existing.weights.originNetKg||0)}:{}),
      };
      updates.unloadingDataSource = 'MANUAL'; // measurements entered by the authenticated operator
      updates.unloadingActorType = 'USER'; updates.unloadingActorId = context.userId;
      if (payload.unloadDecision === 'ACCEPT_ORIGIN_NET_AS_DESTINATION') (updates as any).unloadDecision = payload.unloadDecision;
    }
    if (targetStatus === 'AT_DESTINATION') (updates as any).arrivalTime = new Date().toISOString();
    if (targetStatus === 'WEIGHED_ORIGIN') (updates as any).loadTime = new Date().toISOString();
    if (targetStatus === 'OFFLOADED') (updates as any).unloadTime = new Date().toISOString();

    if(operational){
      const now=new Date().toISOString(),timeline={...existing.operationalTimeline};
      const point=({LOADING:'loadingStartedAt',WEIGHED_ORIGIN:'loadingCompletedAt',IN_TRANSIT:'departedAt',AT_DESTINATION:'arrivedAt',OFFLOADED:'unloadingCompletedAt',COMPLETED:'completedAt'} as const)[targetStatus];
      if(point&&!timeline[point])timeline[point]=now;
      const metrics=resolveTimeMetrics(timeline,operational.configuration);if(metrics.expectedArrivalAt)timeline.expectedArrivalAt=metrics.expectedArrivalAt;
      updates.operationalTimeline=timeline;
      const weights={...existing.weights,...updates.weights};updates.operationalWeights=resolveOperationalWeights(operational.configuration,{loadingMeasuredWeight:weights.originNetKg==null?null:weights.originNetKg/1000,unloadingMeasuredWeight:weights.destinationNetKg==null?null:weights.destinationNetKg/1000,estimatedCapacityTonnes:operational.estimatedCapacityTonnes});
    }
    // If completing trip: calculate server financials automatically
    if (targetStatus === 'COMPLETED') {
      const billableWeightKg = updates.weights?.billableWeightKg || existing.weights.billableWeightKg || existing.weights.originNetKg || 0;
      const billableTons = billableWeightKg / 1000;
      const rate = existing.pricingSnapshot.agreedRate ?? existing.pricingSnapshot.baseRateSAR ?? 0;
      const pricingType = existing.pricingSnapshot.pricingType ?? (existing.pricingSnapshot.pricingModel === 'PER_TRIP' ? 'PER_TRIP' : 'PER_TON');
      
      let baseAmount = 0;
      let settlementBase = 0;
      let operationalSettlement:ReturnType<PricingService['calculateSettlement']>|undefined;

      if (existing.pricingSnapshot.pricingType !== 'LEGACY_UNRESOLVED') {
        const calculation = new PricingService().calculateSettlement({pricingRule:{...existing.pricingSnapshot,pricingType,rate} as any,netWeightKg:operational&&billableWeightKg===0?undefined:billableWeightKg,allowMissingWeight:true});
        settlementBase=calculation.settlementBase; baseAmount=calculation.settlementAmount;if(operational)operationalSettlement=calculation;
      } else {
        // Preserve the explicit legacy pending marker and its existing completion representation.
        settlementBase=1; baseAmount=rate;
      }


      updates.pricingSnapshot = {
        ...existing.pricingSnapshot,
        ...(operationalSettlement?operationalSettlement.snapshot:{}),
        settlementBase,
        settlementAmount: baseAmount,
      };

      const demurrage = payload.demurrageAmountSAR || 0;
      const deductions = payload.deductionsAmountSAR || 0;
      const totals=commercialTotals(baseAmount,existing.pricingSnapshot,demurrage,deductions);

      updates.financials = {
        baseAmountSAR: Math.round(baseAmount * 100) / 100,
        demurrageAmountSAR: demurrage,
        deductionsAmountSAR: deductions,
        ...totals,
        currency: 'SAR',
        isFinalized: operationalSettlement?.isPending ? false : true,
        ...(operationalSettlement?.isPending ? {} : {finalizedAt: new Date()}),
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

  async recordOperationalCheckpoint(projectId:string,tripId:string,checkpoint:'loadingCompletedAt'|'unloadingStartedAt',context:AuthUserContext):Promise<TripEntity> {
    const trip=await this.persistence.tripRepository.findById(projectId,tripId);
    if(!trip?.operationalSnapshot||trip.financials.isFinalized||!(checkpoint==='loadingCompletedAt'?['LOADING','WEIGHED_ORIGIN']:['AT_DESTINATION','WEIGHED_DESTINATION']).includes(trip.status))throw Error('OPERATIONAL_CHECKPOINT_INVALID');
    if(trip.operationalTimeline?.[checkpoint])return trip;
    const now=new Date().toISOString(),updates={operationalTimeline:{...trip.operationalTimeline,[checkpoint]:now}};
    await this.persistence.tripRepository.update(projectId,tripId,updates,context.userId);
    await this.persistence.tripEventService.recordEvent({eventId:`EVT-${tripId}-${checkpoint}`,tripId,projectId,eventType:'EVENT_OPERATIONAL_CHECKPOINT',statusResulting:trip.status,deviceTimestamp:now,payload:{checkpoint},idempotencyKey:`CHECKPOINT-${tripId}-${checkpoint}`},context);
    return {...trip,...updates};
  }
  async associateOperationalDriver(projectId:string,tripId:string,driverId:string,context:AuthUserContext):Promise<TripEntity> {
    const trip=await this.persistence.tripRepository.findById(projectId,tripId);
    if(!trip?.operationalSnapshot||trip.driverId||trip.financials.isFinalized||['COMPLETED','CANCELLED','REJECTED'].includes(trip.status))throw Error('DRIVER_ASSOCIATION_NOT_ALLOWED');
    const {driverGlobal}=await this.validateCanonicalTripEntities(projectId,trip.carrierId,trip.truckId,driverId,trip.materialId);
    const updates={driverId,driverSnapshot:{driverId,fullNameAr:driverGlobal.fullNameAr||'',nationalOrIqamaId:driverGlobal.nationalId||'',phone:driverGlobal.phone||''}};
    await this.persistence.tripRepository.update(projectId,tripId,updates,context.userId);
    await this.persistence.auditLogService.recordLog({projectId,entityType:'TRIP',entityId:tripId,action:'UPDATE',before:trip,after:{...trip,...updates}},context);
    await this.persistence.tripEventService.recordEvent({eventId:`EVT-${tripId}-DRIVER`,tripId,projectId,eventType:'EVENT_DRIVER_ASSOCIATED',statusResulting:trip.status,deviceTimestamp:new Date().toISOString(),payload:{driverId},idempotencyKey:`DRIVER-${tripId}`},context);
    return {...trip,...updates};
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
    const configuredProject=await this.persistence.projectRepository.findById(params.projectId.trim());
    const configuredIntake=configuredProject?.operationalConfiguration?validateOperationalConfiguration(configuredProject.operationalConfiguration).driverIntakeMode:null;
    if ((!params.driverId || typeof params.driverId !== 'string' || !params.driverId.trim())&&(!configuredIntake||configuredIntake==='PRELOADED_ROSTER')) {
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
    if (params.pricingRuleId && !['UNRESOLVED_PENDING','PENDING'].includes(params.pricingRuleId)) {
      pricingRule = this.persistence.pricingRuleRepository.resolve
        ? await this.persistence.pricingRuleRepository.resolve(cleanProjectId,params.carrierId,params.materialId,params.operationalData?.shiftDate || new Date().toISOString(),params.pricingRuleId)
        : await this.persistence.pricingRuleRepository.findById(cleanProjectId,params.pricingRuleId);
      if (!pricingRule) throw Error('MISSING_PRICING');
      if (pricingRule.projectId !== cleanProjectId || pricingRule.carrierId !== params.carrierId || pricingRule.materialId && !['ALL','ALL_MATERIALS','GENERAL',params.materialId].includes(pricingRule.materialId)) throw Error('PRICING_SELECTION_MISMATCH');
    } else if(params.pricingMode==='RESOLVED') throw Error('MISSING_PRICING');

    const opData = params.operationalData || {};
    if(project.operationalConfiguration){const c=project.operationalConfiguration;if(c.loadingMeasurementMode==='NONE'&&[opData.tareWeightKg,opData.grossWeightKg,opData.netWeightKg].some(v=>v!==undefined)||c.unloadingMeasurementMode==='NONE'&&opData.destinationNetWeightKg!==undefined)throw Error('UNSUPPORTED_MEASUREMENT');}
    let pricingSnapshot: any;
    let financials: any;
    let finalPricingRuleId: string;

    if (pricingRule && (pricingRule.status !== undefined ? pricingRule.status === 'ACTIVE' : pricingRule.isActive === true)) {
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
        pricingRuleVersion: pricingRule.version || 1,
        effectiveFrom: pricingRule.effectiveFrom,
        effectiveTo: pricingRule.effectiveTo || null,
        materialId: params.materialId,
        minimumBillableWeightKg: pricingRule.minimumBillableWeightKg,
        demurrageRatePerHourSAR: pricingRule.demurrageRatePerHourSAR,
        freeTimeHours: pricingRule.freeTimeHours,
        vatApplicable: pricingRule.vatApplicable,
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

    if (pricingRule) {
      const calculation = new PricingService().calculateSettlement({pricingRule:{...pricingRule,pricingType:pricingRule.pricingType || pricingRule.pricingModel,rate:pricingRule.baseRateSAR ?? pricingRule.rate},netWeightKg:opData.destinationNetWeightKg ?? originNet,allowMissingWeight:true});
      pricingSnapshot={...pricingSnapshot,...calculation.snapshot,vatApplicable:pricingRule.vatApplicable,vatRatePercent:pricingRule.vatRatePercent ?? 15};
      financials={...financials,baseAmountSAR:calculation.settlementAmount,...commercialTotals(calculation.settlementAmount,pricingSnapshot)};
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
    const driverSnapshot = driverGlobal?{
      driverId: driverGlobal.driverId,
      fullNameAr: driverGlobal.fullNameAr || driverGlobal.name || '',
      nationalOrIqamaId: driverGlobal.idNumber || (driverGlobal as any).nationalOrIqamaId || '',
      phone: driverGlobal.phone || '',
    }:null;
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
      driverId: params.driverId||null,
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
      ...(project.operationalConfiguration?{operationalSnapshot:snapshotOperationalConfiguration(project.operationalConfiguration,project.version||0,params.driverId||null,{truckCapacityKg:truckGlobal.legalPayloadLimitKg,truckType:truckGlobal.truckType,materialId:params.materialId}),operationalTimeline:{...(opData.loadTime?{loadingCompletedAt:opData.loadTime}:{}),...(opData.unloadTime?{unloadingCompletedAt:opData.unloadTime}:{})}}:{}),
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

    if(newTrip.operationalSnapshot){
      const snapshot=newTrip.operationalSnapshot,c=snapshot.configuration;
      if(newTrip.pricingSnapshot.isPending)newTrip.financials.isFinalized=false;
      newTrip.operationalWeights=resolveOperationalWeights(c,{loadingMeasuredWeight:originNet==null?null:originNet/1000,unloadingMeasuredWeight:opData.destinationNetWeightKg==null?null:opData.destinationNetWeightKg/1000,estimatedCapacityTonnes:snapshot.estimatedCapacityTonnes});
      if(mappedStatus==='COMPLETED'&&((c.loadingMeasurementMode==='WEIGHBRIDGE'&&newTrip.operationalWeights.loadingMeasuredWeight===null)||(c.unloadingMeasurementMode==='WEIGHBRIDGE'&&newTrip.operationalWeights.unloadingMeasuredWeight===null)||(c.requiredCheckpoints||[]).some(k=>!newTrip.operationalTimeline?.[k])))throw Error('OPERATIONAL_CHECKPOINT_REQUIRED');
    }

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
