import { decodeProject, persistenceTime } from '../utils/persistenceBoundary';
import { ProjectValidator } from '../validators/project.validator';
import { canEvaluateProjectActivation } from './projectMutability.policy';
import type { AuthUserContext } from '../types/common';
import { ProjectEntity } from '../types/entities';
import type { ProjectReadinessReadContext } from './projectReadiness.context';

export type ReadinessCategory = 'LIFECYCLE' | 'SETUP' | 'RELATIONSHIP' | 'PRICING' | 'AUTHORITY' | 'DATA_INTEGRITY';
export interface ReadinessBlocker {
  category: ReadinessCategory;
  ownerPhase: 'PHASE_4' | 'PHASE_5' | 'PHASE_6' | 'PHASE_9';
  code: string;
  message: string;
}

export interface ReadinessResult {
  projectId: string;
  ready: boolean;
  lifecycle: LifecycleReadiness;
  operational: { ready: boolean; blockers: ReadinessBlocker[] };
  setup: { evaluated: false; ownerPhase: 'PHASE_6' };
  evaluatedAt: string;
  blockers: ReadinessBlocker[];
  candidatePath?: {
    driverId: string;
    truckId: string;
    carrierId: string;
    materialId: string;
    pricingRuleId: string;
    assignmentId: string;
    allocationId: string;
  };
}

export type CandidatePath = NonNullable<ReadinessResult['candidatePath']>;
export interface LifecycleReadiness { ready: boolean; state: 'ELIGIBLE' | 'ALREADY_ACTIVE' | 'INELIGIBLE'; blockers: ReadinessBlocker[] }
export function validReadinessId(value: unknown): value is string {
  return typeof value === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(value) && value !== 'ALL';
}
export function validateCandidateIds(path: CandidatePath) {
  if (!path || ['driverId', 'truckId', 'carrierId', 'materialId', 'assignmentId', 'allocationId', 'pricingRuleId'].some(key => !validReadinessId(path[key as keyof CandidatePath]))) throw Object.assign(new Error('PERSISTENCE_BOUNDARY_INVALID:candidatePath'), { code: 'PERSISTENCE_BOUNDARY_INVALID' });
}
export function lifecycleReadiness(project: ProjectEntity, projectId: string, actor?: AuthUserContext): LifecycleReadiness {
  const canonical = decodeProject<ProjectEntity>(project, projectId);
  const blockers: ReadinessBlocker[] = [];
  if (typeof canonical.nameAr !== 'string' || !ProjectValidator.validate(canonical).isValid) blockers.push({ category: 'DATA_INTEGRITY', ownerPhase: 'PHASE_4', code: 'PROJECT_VALIDATION_FAILED', message: 'بيانات المشروع غير مكتملة' });
  if (actor && actor.role !== 'SUPER_ADMIN' && (actor.role !== 'PROJECT_ADMIN' || !actor.assignedProjectIds?.includes(projectId))) blockers.push({ category: 'AUTHORITY', ownerPhase: 'PHASE_4', code: 'FORBIDDEN_PROJECT_ACTIVATION', message: 'غير مصرح لك بتنشيط المشروع' });
  const state = canonical.status === 'ACTIVE' ? 'ALREADY_ACTIVE' : canEvaluateProjectActivation(canonical.status) ? 'ELIGIBLE' : 'INELIGIBLE';
  if (state !== 'ELIGIBLE') blockers.push({ category: 'LIFECYCLE', ownerPhase: 'PHASE_4', code: state === 'ALREADY_ACTIVE' ? 'PROJECT_ALREADY_ACTIVE' : 'PROJECT_NOT_APPROVED', message: state === 'ALREADY_ACTIVE' ? 'ACTIVE' : 'لا يمكن تنشيط مشروع ما لم يكن في حالة معتمد (APPROVED)' });
  return { ready: blockers.length === 0, state, blockers };
}
/** Preserve the current Pricing status fallback; do not treat malformed dates as applicable. */
export function applicableReadinessPricing(rule: any, projectId: string, carrierId: string, materialId: string, at: Date) {
  const status = rule.status || (rule.isActive === true ? 'ACTIVE' : 'INACTIVE');
  const instant = (value: unknown): Date | null => {
    try {
      if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
        const date = new Date(value);
        return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? date : null;
      }
      return persistenceTime(value, 'pricingEffectiveTime', 'date') as Date;
    } catch { return null; }
  };
  const hasEnd = rule.effectiveTo !== undefined && rule.effectiveTo !== null && rule.effectiveTo !== '';
  const from = instant(rule.effectiveFrom), to = hasEnd ? instant(rule.effectiveTo) : null;
  return Boolean(from && (!hasEnd || to)) && status === 'ACTIVE' && rule.projectId === projectId && rule.carrierId === carrierId && rule.materialId === materialId && from! <= at && (!to || (Number.isFinite(to.getTime()) && to >= at));
}

export class ProjectReadinessService {
  async evaluateProjectReadiness(projectId: string, effectiveAt: Date, readContext: ProjectReadinessReadContext, actor?: AuthUserContext, additionalBlockers: ReadinessBlocker[] = []): Promise<ReadinessResult> {
    const project = await readContext.getProject(projectId);
    if (!project) throw new Error('المشروع غير موجود');
    
    const blockers: ReadinessBlocker[] = [];

    const lifecycle = lifecycleReadiness(project, projectId, actor);

    // 1. Material membership
    const materials = await readContext.listActiveMaterialMemberships(projectId);
    if (materials.length === 0) blockers.push({ category: 'RELATIONSHIP', ownerPhase: 'PHASE_5', code: 'NO_ACTIVE_MATERIAL', message: 'لا يوجد مواد نشطة' });

    // 2. Carrier membership
    const carriers = await readContext.listActiveCarrierMemberships(projectId);
    if (carriers.length === 0) blockers.push({ category: 'RELATIONSHIP', ownerPhase: 'PHASE_5', code: 'NO_ACTIVE_CARRIER', message: 'لا يوجد ناقلات نشطة' });

    // 3. Operational Path Check
    let completePath = await this.findCoherentOperationalPath(projectId, effectiveAt, readContext, materials, carriers, blockers);
    if (completePath) {
      validateCandidateIds(completePath);
      if (readContext.revalidateCandidatePath) {
        const revalidation = await readContext.revalidateCandidatePath(projectId, completePath, effectiveAt);
        blockers.push(...revalidation);
        if (revalidation.length) completePath = null;
      }
    }
    if (!completePath) {
      blockers.push({ category: 'RELATIONSHIP', ownerPhase: 'PHASE_5', code: 'NO_COMPLETE_OPERATIONAL_PATH', message: 'لا يوجد مسار تشغيلي مكتمل' });
    }

    return {
      projectId,
      ready: lifecycle.ready && blockers.length === 0 && additionalBlockers.length === 0,
      lifecycle, operational: { ready: blockers.length === 0, blockers }, setup: { evaluated: false, ownerPhase: 'PHASE_6' },
      evaluatedAt: effectiveAt.toISOString(),
      blockers: [...lifecycle.blockers, ...blockers, ...additionalBlockers],
      candidatePath: completePath || undefined,
    };
  }

  private async findCoherentOperationalPath(
    projectId: string, 
    effectiveAt: Date, 
    readContext: ProjectReadinessReadContext,
    materials?: { materialId: string; status: string }[],
    carriers?: { carrierId: string; status: string }[],
    blockers?: ReadinessBlocker[]
  ) {
    let missingPricing = false;
    // 1. Get all memberships
    const drivers = await readContext.listActiveDriverMemberships(projectId);
    const trucks = await readContext.listActiveTruckMemberships(projectId);
    
    // 2. Coherence Logic
    for (const driver of drivers) {
      for (const truck of trucks) {
        const assignment = await readContext.getActiveDriverAssignment(projectId, driver.driverId);
        if (!assignment || assignment.truckId !== truck.truckId || assignment.status !== 'ACTIVE') continue;

        const driverAffil = await readContext.getDriverCarrierAffiliation(projectId, driver.driverId);
        const truckAffil = await readContext.getTruckCarrierAffiliation(projectId, truck.truckId);
        
        if (!driverAffil || driverAffil.status !== 'ACTIVE' || !truckAffil || truckAffil.status !== 'ACTIVE' || driverAffil.carrierId !== truckAffil.carrierId) continue;
        const carrierId = driverAffil.carrierId;

        // Ensure operational carrier has an active project membership
        if (carriers && !carriers.some(c => c.carrierId === carrierId && c.status === 'ACTIVE')) continue;

        const allocation = await readContext.getActiveTruckAllocation(projectId, truck.truckId);
        if (!allocation || allocation.status !== 'ACTIVE' || allocation.truckId !== truck.truckId) continue;

        // Ensure allocated material has an active project membership
        if (materials && !materials.some(m => m.materialId === allocation.materialId && m.status === 'ACTIVE')) continue;

        // Verify pricing for this path
        const pricing = await readContext.listPricingRules(projectId);
        const validPricing = pricing.find(p => applicableReadinessPricing(p, projectId, carrierId, allocation.materialId, effectiveAt));
        if (!validPricing) missingPricing = true;
        if (validPricing) {
          return {
            driverId: driver.driverId,
            truckId: truck.truckId,
            carrierId,
            materialId: allocation.materialId,
            pricingRuleId: validPricing.pricingRuleId,
            assignmentId: assignment.assignmentId,
            allocationId: allocation.allocationId,
          };
        }
      }
    }
    if (missingPricing) blockers?.push({ category: 'PRICING', ownerPhase: 'PHASE_9', code: 'NO_APPLICABLE_PRICING', message: 'فشل تنشيط المشروع: قاعدة التسعير منتهية الصلاحية أو غير سارية' });
    return null;
  }
}
