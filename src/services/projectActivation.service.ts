import { adminDb } from '../firebase/admin';
import { ProjectReadinessService } from './projectReadiness.service';
import { ProjectReadinessAdminReadContext } from './projectReadiness.server';
import { AuthUserContext } from '../types/common';
import { ProjectEntity, PricingRuleEntity, AuditLogEntity } from '../types/entities';
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
import { sanitizeUndefined } from '../utils/sanitize';

export class NonTransactionReadContext extends ProjectReadinessAdminReadContext {}

export class ProjectActivationService {
  private readinessService = new ProjectReadinessService();

  /**
   * Authoritative server-side project activation capability.
   * Discovers candidate operational path via ProjectReadinessService + ProjectReadinessAdminReadContext,
   * then revalidates all 13 invariants and atomically transitions status to ACTIVE and writes canonical AuditLogEntity
   * inside a single adminDb.runTransaction.
   */
  async activateProject(projectId: string, context: AuthUserContext): Promise<void> {
    const uid = context?.userId || (context as any)?.uid;
    if (!context || !uid) {
      throw new Error('غير مصرح لك بتنشيط المشروع');
    }

    if (!projectId || !projectId.trim()) {
      throw new Error('معرّف المشروع مطلوب');
    }

    // Role check: Only SUPER_ADMIN or PROJECT_ADMIN
    const userRole = context.role || (context as any)?.roles?.[0];
    const isSuperAdmin = userRole === 'SUPER_ADMIN' || ((context as any)?.roles && (context as any).roles.includes('SUPER_ADMIN'));
    const isProjectAdmin = (userRole === 'PROJECT_ADMIN' || ((context as any)?.roles && (context as any).roles.includes('PROJECT_ADMIN'))) &&
      (!context.assignedProjectIds || context.assignedProjectIds.includes(projectId));

    if (!isSuperAdmin && !isProjectAdmin) {
      throw new Error('غير مصرح لك بتنشيط المشروع');
    }

    const projectRef = adminDb.collection('projects').doc(projectId);

    // 1. Preflight status check using Admin DB to guarantee early idempotent success
    const preflightProjectDoc = await projectRef.get();
    if (!preflightProjectDoc.exists) {
      throw new Error('المشروع غير موجود');
    }

    const preflightProject = preflightProjectDoc.data() as ProjectEntity;

    // Early idempotent success: Already ACTIVE projects return immediately without readiness checks or writes
    if (preflightProject.status === 'ACTIVE') {
      return;
    }

    // Source status precondition: must be APPROVED
    if (preflightProject.status !== 'APPROVED') {
      throw new Error('لا يمكن تنشيط مشروع ما لم يكن في حالة معتمد (APPROVED)');
    }

    // 2. Evaluate readiness using server-safe Admin read context
    const discoveryContext = new NonTransactionReadContext();
    const effectiveAt = new Date();
    const readiness = await this.readinessService.evaluateProjectReadiness(projectId, effectiveAt, discoveryContext);

    if (!readiness.ready || !readiness.candidatePath) {
      throw new Error(`المشروع غير جاهز للتنشيط: ${readiness.blockers.map(b => b.message).join(' | ')}`);
    }

    const path = readiness.candidatePath;
    const { driverId, truckId, carrierId, materialId, pricingRuleId, assignmentId, allocationId } = path;

    const driverMemRef = adminDb.collection('projects').doc(projectId).collection('driver_memberships').doc(driverId);
    const truckMemRef = adminDb.collection('projects').doc(projectId).collection('truck_memberships').doc(truckId);
    const carrierMemRef = adminDb.collection('projects').doc(projectId).collection('carrier_memberships').doc(carrierId);
    const materialMemRef = adminDb.collection('projects').doc(projectId).collection('material_memberships').doc(materialId);

    const driverAffilRef = adminDb.collection('projects').doc(projectId).collection('driver_carrier_affiliations').doc(driverId);
    const truckAffilRef = adminDb.collection('projects').doc(projectId).collection('truck_carrier_affiliations').doc(truckId);

    const driverActiveRef = adminDb.collection('projects').doc(projectId).collection('driver_active_assignments').doc(driverId);
    const truckActiveRef = adminDb.collection('projects').doc(projectId).collection('truck_active_assignments').doc(truckId);
    const assignmentRef = adminDb.collection('projects').doc(projectId).collection('driver_truck_assignments').doc(assignmentId);

    const truckActiveAllocRef = adminDb.collection('projects').doc(projectId).collection('truck_active_material_allocations').doc(truckId);
    const allocationRef = adminDb.collection('projects').doc(projectId).collection('truck_material_allocations').doc(allocationId);

    const pricingRuleRef = adminDb.collection('projects').doc(projectId).collection('pricing_rules').doc(pricingRuleId);

    // 2. Transactional revalidation & atomic update + audit
    await adminDb.runTransaction(async (transaction: any) => {
      // READ 1: Get Project Document
      const projectDoc = await transaction.get(projectRef);
      if (!projectDoc.exists) {
        throw new Error('المشروع غير موجود');
      }

      const project = projectDoc.data() as ProjectEntity;

      // Idempotent success if already ACTIVE
      if (project.status === 'ACTIVE') {
        return;
      }

      // Must be APPROVED
      if (project.status !== 'APPROVED') {
        throw new Error('لا يمكن تنشيط مشروع ما لم يكن في حالة معتمد (APPROVED)');
      }

      // Transactional gets for all operational path documents
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
        pricingRuleSnap,
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
        transaction.get(pricingRuleRef),
      ]);

      // Existence checks
      if (
        !driverMemSnap.exists || !truckMemSnap.exists || !carrierMemSnap.exists || !materialMemSnap.exists ||
        !driverAffilSnap.exists || !truckAffilSnap.exists || !driverActiveSnap.exists || !truckActiveSnap.exists ||
        !assignmentSnap.exists || !truckActiveAllocSnap.exists || !allocationSnap.exists || !pricingRuleSnap.exists
      ) {
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

      // 1. Memberships must be ACTIVE
      if (driverMem.status !== 'ACTIVE' || truckMem.status !== 'ACTIVE' || carrierMem.status !== 'ACTIVE' || materialMem.status !== 'ACTIVE') {
        throw new Error('فشل تنشيط المشروع: عضوية غير نشطة');
      }

      // 2. Affiliations must be ACTIVE and match candidate carrierId
      if (driverAffil.status !== 'ACTIVE' || driverAffil.carrierId !== carrierId ||
          truckAffil.status !== 'ACTIVE' || truckAffil.carrierId !== carrierId) {
        throw new Error('فشل تنشيط المشروع: انتساب غير نشط أو غير متطابق');
      }

      // 3. Active assignments pointers must match candidate assignmentId
      if (driverActive.assignmentId !== assignmentId || truckActive.assignmentId !== assignmentId) {
        throw new Error('فشل تنشيط المشروع: مؤشر التعيين النشط غير متطابق');
      }

      // 4. Assignment details must match and be ACTIVE
      if (assignment.status !== 'ACTIVE' || assignment.driverId !== driverId || assignment.truckId !== truckId) {
        throw new Error('فشل تنشيط المشروع: تفاصيل التعيين غير متطابقة أو غير نشطة');
      }

      // 5. Active allocation pointer must match candidate allocationId
      if (truckActiveAlloc.allocationId !== allocationId) {
        throw new Error('فشل تنشيط المشروع: مؤشر التخصيص النشط غير متطابق');
      }

      // 6. Allocation details must match, be ACTIVE and effectiveTo must be null
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

      // ALL READS & VALIDATIONS COMPLETE.
      const now = new Date();

      // Prepare updated project snapshot
      const updatedProjectSnapshot: ProjectEntity = {
        ...project,
        status: 'ACTIVE',
        updatedAt: now,
        updatedBy: uid,
      };

      // Prepare Canonical Audit Log
      const auditLogId = `AUDIT-ACTIVATION-${projectId}-${Date.now()}`;
      const auditLogData: AuditLogEntity = {
        auditLogId,
        projectId,
        entityType: 'PROJECT',
        entityId: projectId,
        action: 'UPDATE',
        actor: {
          userId: uid,
          email: context.email || '',
          role: userRole,
          ipAddress: (context as any).ipAddress || undefined,
          userAgent: (context as any).userAgent || undefined,
        },
        changes: {
          before: sanitizeUndefined(project),
          after: sanitizeUndefined(updatedProjectSnapshot),
          deltaFields: ['status', 'updatedAt', 'updatedBy'],
        },
        correlationId: (context as any).correlationId || `CORR-${auditLogId}`,
        createdAt: now,
        createdBy: uid,
        updatedAt: now,
        updatedBy: uid,
      };

      const auditLogRef = adminDb.collection('audit_logs').doc(auditLogId);

      // WRITE 1: Update project status & audit metadata
      transaction.update(projectRef, {
        status: 'ACTIVE',
        updatedAt: now,
        updatedBy: uid,
      });

      // WRITE 2: Write canonical audit log
      transaction.set(auditLogRef, sanitizeUndefined(auditLogData));
    });
  }
}

export const projectActivationService = new ProjectActivationService();
