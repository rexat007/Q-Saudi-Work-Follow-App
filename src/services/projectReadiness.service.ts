import { Transaction } from 'firebase/firestore';
import { ProjectEntity } from '../types/entities';
import { ProjectReadinessReadContext } from './projectReadiness.context';

export interface ReadinessBlocker {
  code: string;
  message: string;
}

export interface ReadinessResult {
  projectId: string;
  ready: boolean;
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

export class ProjectReadinessService {
  async evaluateProjectReadiness(projectId: string, effectiveAt: Date, readContext: ProjectReadinessReadContext): Promise<ReadinessResult> {
    const project = await readContext.getProject(projectId);
    if (!project) throw new Error('المشروع غير موجود');
    
    const blockers: ReadinessBlocker[] = [];

    // 1. Material membership
    const materials = await readContext.listActiveMaterialMemberships(projectId);
    if (materials.length === 0) blockers.push({ code: 'NO_ACTIVE_MATERIAL', message: 'لا يوجد مواد نشطة' });

    // 2. Carrier membership
    const carriers = await readContext.listActiveCarrierMemberships(projectId);
    if (carriers.length === 0) blockers.push({ code: 'NO_ACTIVE_CARRIER', message: 'لا يوجد ناقلات نشطة' });

    // 3. Operational Path Check
    const completePath = await this.findCoherentOperationalPath(projectId, effectiveAt, readContext, materials, carriers);
    if (!completePath) {
      blockers.push({ code: 'NO_COMPLETE_OPERATIONAL_PATH', message: 'لا يوجد مسار تشغيلي مكتمل' });
    }

    return {
      projectId,
      ready: blockers.length === 0,
      evaluatedAt: effectiveAt.toISOString(),
      blockers,
      candidatePath: completePath || undefined,
    };
  }

  private async findCoherentOperationalPath(
    projectId: string, 
    effectiveAt: Date, 
    readContext: ProjectReadinessReadContext,
    materials?: { materialId: string; status: string }[],
    carriers?: { carrierId: string; status: string }[]
  ) {
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
        const validPricing = pricing.find(p => 
          p.projectId === projectId && 
          p.carrierId === carrierId && 
          p.materialId === allocation.materialId && 
          p.effectiveFrom && new Date(p.effectiveFrom) <= effectiveAt && 
          (!p.effectiveTo || new Date(p.effectiveTo) >= effectiveAt)
        );
        
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
    return null;
  }
}
