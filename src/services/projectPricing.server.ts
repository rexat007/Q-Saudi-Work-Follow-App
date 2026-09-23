import { adminDb } from '../firebase/admin';
import { PricingRuleValidator } from '../validators/pricingRule.validator';
import { PricingRuleEntity, AuditLogEntity } from '../types/entities';
import { AuthUserContext } from '../types/common';
import { PricingRule } from '../types/pricing';
import { sanitizeUndefined } from '../utils/sanitize';

export class ProjectPricingServerService {
  async createPricingRule(
    projectId: string,
    payload: any,
    context: AuthUserContext
  ): Promise<PricingRuleEntity> {
    // 1. Authorize role (Auditor or Admin)
    if (!context || !['PROJECT_ADMIN', 'FINANCE_AUDITOR', 'SUPER_ADMIN'].includes(context.role)) {
      throw new Error('غير مصرح لك بإنشاء أو تعديل قواعد التسعير (مقتصر على الإدارة والمدقق المالي)');
    }

    if (!projectId || !projectId.trim()) {
      throw new Error('معرّف المشروع مطلوب');
    }

    // 2. Validate Payload (Project ID must match authoritative URL projectId)
    const candidateRate = payload.baseRateSAR !== undefined ? payload.baseRateSAR : payload.rate;
    const candidateModel = payload.pricingModel || payload.pricingType;

    const ruleData: any = {
      ...payload,
      projectId, // URL parameter is strictly authoritative
      pricingModel: candidateModel,
      baseRateSAR: candidateRate !== undefined ? Number(candidateRate) : undefined,
    };

    // Clean carrier and material IDs if wildcard / ALL passed
    if (ruleData.carrierId === 'ALL' || ruleData.carrierId === '*') {
      ruleData.carrierId = undefined;
    }
    const isSpecificMaterial = ruleData.materialId && ruleData.materialId !== 'ALL' && ruleData.materialId !== 'ALL_MATERIALS';
    const normalizedMaterialId = isSpecificMaterial ? ruleData.materialId : undefined;
    ruleData.materialId = normalizedMaterialId;

    const validation = PricingRuleValidator.validate(ruleData);
    if (!validation.isValid) {
      throw new Error(`خطأ في مصفوفة التسعير: ${validation.errors.map(e => e.messageAr).join(' | ')}`);
    }

    const pricingRuleId = ruleData.pricingRuleId;
    const now = new Date();

    const ruleName = ruleData.name && ruleData.name.trim()
      ? ruleData.name.trim()
      : `تعرفة ${ruleData.carrierId} - ${ruleData.pricingModel} (${ruleData.baseRateSAR} ريال)`;

    // 3. Prepare Canonical PricingRuleEntity (ONLY canonical fields, NO alternate storage fields)
    const newRule: PricingRuleEntity = {
      pricingRuleId,
      projectId,
      carrierId: ruleData.carrierId,
      materialId: normalizedMaterialId,
      name: ruleName,
      pricingModel: ruleData.pricingModel,
      baseRateSAR: Number(ruleData.baseRateSAR),
      currency: ruleData.currency || 'SAR',
      effectiveFrom: ruleData.effectiveFrom,
      effectiveTo: ruleData.effectiveTo || undefined,
      notes: ruleData.notes ? ruleData.notes.trim() : undefined,
      minimumBillableWeightKg: ruleData.minimumBillableWeightKg !== undefined ? Number(ruleData.minimumBillableWeightKg) : undefined,
      demurrageRatePerHourSAR: ruleData.demurrageRatePerHourSAR !== undefined ? Number(ruleData.demurrageRatePerHourSAR) : 50,
      freeTimeHours: ruleData.freeTimeHours !== undefined ? Number(ruleData.freeTimeHours) : 2,
      vatApplicable: ruleData.vatApplicable !== undefined ? Boolean(ruleData.vatApplicable) : true,
      status: 'ACTIVE',
      isActive: true,
      createdAt: now,
      createdBy: context.userId,
      updatedAt: now,
      updatedBy: context.userId,
    };

    const sanitizedRule = sanitizeUndefined(newRule);

    // 4. Prepare Canonical AuditLogEntity
    const auditLogId = `AUDIT-PRICING-${pricingRuleId}-${Date.now()}`;
    const auditLogData: AuditLogEntity = {
      auditLogId,
      projectId,
      entityType: 'PRICING_RULE',
      entityId: pricingRuleId,
      action: 'CREATE',
      actor: {
        userId: context.userId,
        email: context.email || '',
        role: context.role,
        ipAddress: (context as any).ipAddress || undefined,
        userAgent: (context as any).userAgent || undefined,
      },
      changes: {
        before: null,
        after: sanitizedRule,
        deltaFields: Object.keys(sanitizedRule),
      },
      correlationId: (context as any).correlationId || `CORR-${auditLogId}`,
      createdAt: now,
      createdBy: context.userId,
      updatedAt: now,
      updatedBy: context.userId,
    };

    const sanitizedAuditLog = sanitizeUndefined(auditLogData);

    // Document References
    const projectRef = adminDb.collection('projects').doc(projectId);
    const carrierRef = adminDb.collection('projects').doc(projectId).collection('carrier_memberships').doc(ruleData.carrierId);
    const materialRef = normalizedMaterialId
      ? adminDb.collection('projects').doc(projectId).collection('material_memberships').doc(normalizedMaterialId)
      : null;
    const ruleDocRef = adminDb.collection('projects').doc(projectId).collection('pricing_rules').doc(pricingRuleId);
    const existingRulesColRef = adminDb.collection('projects').doc(projectId).collection('pricing_rules');
    const auditLogRef = adminDb.collection('audit_logs').doc(auditLogId);

    // 5. Atomic Execution in a Single Transaction (ALL READS BEFORE ANY WRITES)
    await adminDb.runTransaction(async (transaction: any) => {
      // READ 1: Validate Project Exists
      const projectDoc = await transaction.get(projectRef);
      if (!projectDoc.exists) {
        throw new Error(`المشروع غير موجود: ${projectId}`);
      }

      // READ 2: Validate Carrier Membership in projects/{projectId}/carrier_memberships/{carrierId}
      const carrierDoc = await transaction.get(carrierRef);
      if (!carrierDoc.exists || carrierDoc.data()?.status !== 'ACTIVE') {
        throw new Error('الناقل غير موجود في المشروع أو غير نشط');
      }

      // READ 3: Validate Material Membership in projects/{projectId}/material_memberships/{materialId} (if specific)
      if (materialRef) {
        const materialDoc = await transaction.get(materialRef);
        if (!materialDoc.exists || materialDoc.data()?.status !== 'ACTIVE') {
          throw new Error('المادة غير موجودة في المشروع أو غير نشطة');
        }
      }

      // READ 4: Check ID Collision (fail closed, never overwrite)
      const ruleDoc = await transaction.get(ruleDocRef);
      if (ruleDoc.exists) {
        throw new Error('معرّف قاعدة التسعير موجود مسبقًا. لا يمكن الكتابة فوق قاعدة موجودة.');
      }

      // READ 5: Read Existing Pricing Rules for Overlap Decision
      const existingRulesSnapshot = await transaction.get(existingRulesColRef);
      const existingRules: PricingRuleEntity[] = (existingRulesSnapshot.docs || []).map((d: any) => d.data() as PricingRuleEntity);

      // Validate Overlap using PricingRuleValidator.checkOverlap
      const mappedExistingRules: PricingRule[] = existingRules.map((r: any) => ({
        ...r,
        pricingType: r.pricingType || (r.pricingModel === 'PER_TRIP' ? 'PER_TRIP' : 'PER_TON'),
        rate: r.rate !== undefined ? r.rate : r.baseRateSAR,
        effectiveFrom: r.effectiveFrom,
        effectiveTo: r.effectiveTo,
        status: r.status || (r.isActive ? 'ACTIVE' : 'INACTIVE'),
      }));

      const mappedCandidate: Partial<PricingRule> = {
        ...sanitizedRule,
        pricingType: sanitizedRule.pricingModel === 'PER_TRIP' ? 'PER_TRIP' : 'PER_TON',
        rate: sanitizedRule.baseRateSAR,
        effectiveFrom: sanitizedRule.effectiveFrom,
        effectiveTo: sanitizedRule.effectiveTo,
        status: 'ACTIVE',
      };

      const overlapCheck = PricingRuleValidator.checkOverlap(mappedCandidate, mappedExistingRules);
      if (overlapCheck.hasOverlap) {
        throw new Error(overlapCheck.reasonAr || 'يوجد تداخل زمني مع قاعدة تسعير سارية');
      }

      // ALL READS COMPLETED. WRITE ATOMICALLY:
      // WRITE 1: Pricing Rule
      transaction.set(ruleDocRef, sanitizedRule);

      // WRITE 2: Canonical Audit Log
      transaction.set(auditLogRef, sanitizedAuditLog);
    });

    return sanitizedRule;
  }
}

export const projectPricingServerService = new ProjectPricingServerService();
