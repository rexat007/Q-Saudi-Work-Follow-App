import { doc, runTransaction } from 'firebase/firestore';
import { db } from '../firebase/config';
import { projectRepository } from '../repositories/project.repository';
import { ProjectReadinessService } from './projectReadiness.service';
import { ProjectReadinessReadContext } from './projectReadiness.context';
import { auditLogService } from './auditLog.service';
import { AuthUserContext } from '../types/common';
import { ProjectEntity, PricingRuleEntity } from '../types/entities';
import { 
  ProjectMaterialMembershipEntity, 
  ProjectCarrierMembershipEntity, 
  ProjectDriverMembershipEntity, 
  ProjectTruckMembershipEntity 
} from '../types/projectMembership';
import { 
  ProjectDriverCarrierAffiliationEntity,
  ProjectTruckCarrierAffiliationEntity
} from '../types/projectCarrierAffiliation';
import { ProjectDriverTruckAssignmentEntity, ActiveAssignmentSlotPayload } from '../types/projectDriverTruckAssignment';
import { ProjectTruckMaterialAllocationEntity, ActiveTruckMaterialSlotPayload } from '../types/projectTruckMaterialAllocation';

import { 
  projectMaterialMembershipRepository,
  projectCarrierMembershipRepository,
  projectDriverMembershipRepository,
  projectTruckMembershipRepository,
} from '../repositories/projectMembership.repository';
import { 
  projectDriverCarrierAffiliationRepository,
  projectTruckCarrierAffiliationRepository,
} from '../repositories/projectCarrierAffiliation.repository';
import { projectDriverTruckAssignmentRepository } from '../repositories/projectDriverTruckAssignment.repository';
import { projectTruckMaterialAllocationRepository } from '../repositories/projectTruckMaterialAllocation.repository';
import { pricingRuleRepository } from '../repositories/pricingRule.repository';

export class NonTransactionReadContext implements ProjectReadinessReadContext {
  async getProject(projectId: string): Promise<ProjectEntity | null> {
    return await projectRepository.findById(projectId);
  }
  async listActiveMaterialMemberships(projectId: string): Promise<ProjectMaterialMembershipEntity[]> {
    return await projectMaterialMembershipRepository.listMemberships(projectId, 'ACTIVE');
  }
  async listActiveCarrierMemberships(projectId: string): Promise<ProjectCarrierMembershipEntity[]> {
    return await projectCarrierMembershipRepository.listMemberships(projectId, 'ACTIVE');
  }
  async listActiveDriverMemberships(projectId: string): Promise<ProjectDriverMembershipEntity[]> {
    return await projectDriverMembershipRepository.listMemberships(projectId, 'ACTIVE');
  }
  async listActiveTruckMemberships(projectId: string): Promise<ProjectTruckMembershipEntity[]> {
    return await projectTruckMembershipRepository.listMemberships(projectId, 'ACTIVE');
  }
  async getDriverCarrierAffiliation(projectId: string, driverId: string): Promise<ProjectDriverCarrierAffiliationEntity | null> {
    return await projectDriverCarrierAffiliationRepository.getAffiliation(projectId, driverId);
  }
  async getTruckCarrierAffiliation(projectId: string, truckId: string): Promise<ProjectTruckCarrierAffiliationEntity | null> {
    return await projectTruckCarrierAffiliationRepository.getAffiliation(projectId, truckId);
  }
  async getActiveDriverAssignment(projectId: string, driverId: string): Promise<ProjectDriverTruckAssignmentEntity | null> {
    const slot = await projectDriverTruckAssignmentRepository.getActiveDriverSlot(projectId, driverId);
    if (!slot || !slot.assignmentId) return null;
    const assignment = await projectDriverTruckAssignmentRepository.getAssignment(projectId, slot.assignmentId);
    return assignment && assignment.status === 'ACTIVE' ? assignment : null;
  }
  async getActiveTruckAssignment(projectId: string, truckId: string): Promise<ProjectDriverTruckAssignmentEntity | null> {
    const slot = await projectDriverTruckAssignmentRepository.getActiveTruckSlot(projectId, truckId);
    if (!slot || !slot.assignmentId) return null;
    const assignment = await projectDriverTruckAssignmentRepository.getAssignment(projectId, slot.assignmentId);
    return assignment && assignment.status === 'ACTIVE' ? assignment : null;
  }
  async getActiveTruckAllocation(projectId: string, truckId: string): Promise<ProjectTruckMaterialAllocationEntity | null> {
    const slot = await projectTruckMaterialAllocationRepository.getActiveSlot(projectId, truckId);
    if (!slot) return null;
    const allocation = await projectTruckMaterialAllocationRepository.getAllocation(projectId, slot.allocationId);
    if (!allocation) return null;
    if (allocation.projectId !== projectId || allocation.truckId !== truckId || allocation.status !== 'ACTIVE' || allocation.effectiveTo !== null) {
      return null;
    }
    return allocation;
  }
  async listPricingRules(projectId: string): Promise<PricingRuleEntity[]> {
    return await pricingRuleRepository.listByProject(projectId);
  }
}

export class ProjectActivationService {
  private readinessService = new ProjectReadinessService();

  async activateProject(projectId: string, context: AuthUserContext): Promise<void> {
    if (context.role !== 'PROJECT_ADMIN' && context.role !== 'SUPER_ADMIN') {
        throw new Error('غير مصرح لك بتنشيط المشروع');
    }

    // 1. Candidate Discovery (OUTSIDE the transaction)
    const discoveryContext = new NonTransactionReadContext();
    const effectiveAt = new Date();
    const readiness = await this.readinessService.evaluateProjectReadiness(projectId, effectiveAt, discoveryContext);
    if (!readiness.ready || !readiness.candidatePath) {
        throw new Error(`المشروع غير جاهز للتنشيط: ${readiness.blockers.map(b => b.message).join(' | ')}`);
    }

    const path = readiness.candidatePath;
    let originalProject: ProjectEntity | null = null;

    // 2. Transactional validation and status update
    await runTransaction(db, async (transaction) => {
        // A. Transactional Project Read
        const project = await projectRepository.findByIdInTransaction(projectId, transaction);
        if (!project) throw new Error('المشروع غير موجود');
        if (project.status === 'ACTIVE') return; // Idempotent success

        originalProject = project;

        // B. Verify source status
        if (project.status !== 'SETUP') {
          throw new Error('لا يمكن تنشيط مشروع غير موجود في حالة الإعداد');
        }

        const { driverId, truckId, carrierId, materialId, pricingRuleId, assignmentId, allocationId } = path;

        // Construct exact DocumentReferences
        const driverMemRef = doc(db, 'projects', projectId, 'driver_memberships', driverId);
        const truckMemRef = doc(db, 'projects', projectId, 'truck_memberships', truckId);
        const carrierMemRef = doc(db, 'projects', projectId, 'carrier_memberships', carrierId);
        const materialMemRef = doc(db, 'projects', projectId, 'material_memberships', materialId);
        
        const driverAffilRef = doc(db, 'projects', projectId, 'driver_carrier_affiliations', driverId);
        const truckAffilRef = doc(db, 'projects', projectId, 'truck_carrier_affiliations', truckId);
        
        const driverActiveRef = doc(db, 'projects', projectId, 'driver_active_assignments', driverId);
        const truckActiveRef = doc(db, 'projects', projectId, 'truck_active_assignments', truckId);
        const assignmentRef = doc(db, 'projects', projectId, 'driver_truck_assignments', assignmentId);
        
        const truckActiveAllocRef = doc(db, 'projects', projectId, 'truck_active_material_allocations', truckId);
        const allocationRef = doc(db, 'projects', projectId, 'truck_material_allocations', allocationId);
        
        const pricingRuleRef = doc(db, 'projects', projectId, 'pricing_rules', pricingRuleId);

        // Transactional Gets
        const [
          driverMemSnap,
          truckMemSnap,
          carrierMemSnap,
          materialMemSnap,
          driverAffilSnap,
          truckAffilSnap,
          driverActiveSnap,
          truckActiveSnap,
          assignmentSnap,
          truckActiveAllocSnap,
          allocationSnap,
          pricingRuleSnap
        ] = await Promise.all([
          transaction.get(driverMemRef),
          transaction.get(truckMemRef),
          transaction.get(carrierMemRef),
          transaction.get(materialMemRef),
          transaction.get(driverAffilRef),
          transaction.get(truckAffilRef),
          transaction.get(driverActiveRef),
          transaction.get(truckActiveRef),
          transaction.get(assignmentRef),
          transaction.get(truckActiveAllocRef),
          transaction.get(allocationRef),
          transaction.get(pricingRuleRef)
        ]);

        // Existence checks
        if (!driverMemSnap.exists() || !truckMemSnap.exists() || !carrierMemSnap.exists() || !materialMemSnap.exists() ||
            !driverAffilSnap.exists() || !truckAffilSnap.exists() || !driverActiveSnap.exists() || !truckActiveSnap.exists() ||
            !assignmentSnap.exists() || !truckActiveAllocSnap.exists() || !allocationSnap.exists() || !pricingRuleSnap.exists()) {
          throw new Error('فشلت مطابقة مستندات المسار التشغيلي: مستند مفقود');
        }

        const driverMem = driverMemSnap.data() as ProjectDriverMembershipEntity;
        const truckMem = truckMemSnap.data() as ProjectTruckMembershipEntity;
        const carrierMem = carrierMemSnap.data() as ProjectCarrierMembershipEntity;
        const materialMem = materialMemSnap.data() as ProjectMaterialMembershipEntity;
        
        const driverAffil = driverAffilSnap.data() as ProjectDriverCarrierAffiliationEntity;
        const truckAffil = truckAffilSnap.data() as ProjectTruckCarrierAffiliationEntity;
        
        const driverActive = driverActiveSnap.data() as ActiveAssignmentSlotPayload;
        const truckActive = truckActiveSnap.data() as ActiveAssignmentSlotPayload;
        const assignment = assignmentSnap.data() as ProjectDriverTruckAssignmentEntity;
        
        const truckActiveAlloc = truckActiveAllocSnap.data() as ActiveTruckMaterialSlotPayload;
        const allocation = allocationSnap.data() as ProjectTruckMaterialAllocationEntity;
        
        const pricingRule = pricingRuleSnap.data() as PricingRuleEntity;

        // Validations
        // 1. Memberships must be ACTIVE
        if (driverMem.status !== 'ACTIVE' || truckMem.status !== 'ACTIVE' || carrierMem.status !== 'ACTIVE' || materialMem.status !== 'ACTIVE') {
          throw new Error('فشل تنشيط المشروع: عضوية غير نشطة');
        }

        // 2. Affiliations must be ACTIVE and match the carrier
        if (driverAffil.status !== 'ACTIVE' || driverAffil.carrierId !== carrierId ||
            truckAffil.status !== 'ACTIVE' || truckAffil.carrierId !== carrierId) {
          throw new Error('فشل تنشيط المشروع: انتساب غير نشط أو غير متطابق');
        }

        // 3. Active assignments pointers must be coherent
        if (driverActive.assignmentId !== assignmentId || truckActive.assignmentId !== assignmentId) {
          throw new Error('فشل تنشيط المشروع: مؤشر التعيين النشط غير متطابق');
        }

        // 4. Assignment details must match
        if (assignment.status !== 'ACTIVE' || assignment.driverId !== driverId || assignment.truckId !== truckId) {
          throw new Error('فشل تنشيط المشروع: تفاصيل التعيين غير متطابقة أو غير نشطة');
        }

        // 5. Active allocation pointer must be coherent
        if (truckActiveAlloc.allocationId !== allocationId) {
          throw new Error('فشل تنشيط المشروع: مؤشر التخصيص النشط غير متطابق');
        }

        // 6. Allocation details must match
        if (allocation.status !== 'ACTIVE' || allocation.truckId !== truckId || allocation.materialId !== materialId || allocation.effectiveTo !== null) {
          throw new Error('فشل تنشيط المشروع: تفاصيل التخصيص غير متطابقة أو غير نشطة');
        }

        // 7. PricingRule validations
        if (pricingRule.projectId !== projectId || pricingRule.carrierId !== carrierId || pricingRule.materialId !== materialId) {
          throw new Error('فشل تنشيط المشروع: قاعدة التسعير غير متوافقة');
        }
        
        const ruleEffectiveFrom = pricingRule.effectiveFrom ? new Date(pricingRule.effectiveFrom) : null;
        const ruleEffectiveTo = pricingRule.effectiveTo ? new Date(pricingRule.effectiveTo) : null;
        if (!ruleEffectiveFrom || ruleEffectiveFrom > effectiveAt || (ruleEffectiveTo && ruleEffectiveTo < effectiveAt)) {
          throw new Error('فشل تنشيط المشروع: قاعدة التسعير منتهية الصلاحية أو غير سارية');
        }

        // 5. Status transition (All validation succeeded, mark as ACTIVE)
        await projectRepository.updateInTransaction(projectId, { status: 'ACTIVE' }, context.userId, transaction);
    });

    // 5. Audit log registered AFTER transaction commit
    if (originalProject) {
        await auditLogService.recordLog({
            projectId,
            entityType: 'PROJECT',
            entityId: projectId,
            action: 'UPDATE',
            before: originalProject,
            after: { ...originalProject, status: 'ACTIVE' },
        }, context);
    }
  }
}

export const projectActivationService = new ProjectActivationService();
