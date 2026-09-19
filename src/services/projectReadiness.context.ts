import { Transaction } from 'firebase/firestore';
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
import { ProjectDriverTruckAssignmentEntity } from '../types/projectDriverTruckAssignment';
import { ProjectTruckMaterialAllocationEntity } from '../types/projectTruckMaterialAllocation';
import { projectRepository } from '../repositories/project.repository';
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

export interface ProjectReadinessReadContext {
  getProject(projectId: string): Promise<ProjectEntity | null>;
  listActiveMaterialMemberships(projectId: string): Promise<ProjectMaterialMembershipEntity[]>;
  listActiveCarrierMemberships(projectId: string): Promise<ProjectCarrierMembershipEntity[]>;
  listActiveDriverMemberships(projectId: string): Promise<ProjectDriverMembershipEntity[]>;
  listActiveTruckMemberships(projectId: string): Promise<ProjectTruckMembershipEntity[]>;
  getDriverCarrierAffiliation(projectId: string, driverId: string): Promise<ProjectDriverCarrierAffiliationEntity | null>;
  getTruckCarrierAffiliation(projectId: string, truckId: string): Promise<ProjectTruckCarrierAffiliationEntity | null>;
  getActiveDriverAssignment(projectId: string, driverId: string): Promise<ProjectDriverTruckAssignmentEntity | null>;
  getActiveTruckAssignment(projectId: string, truckId: string): Promise<ProjectDriverTruckAssignmentEntity | null>;
  getActiveTruckAllocation(projectId: string, truckId: string): Promise<ProjectTruckMaterialAllocationEntity | null>;
  listPricingRules(projectId: string): Promise<PricingRuleEntity[]>;
}

export class TransactionReadContext implements ProjectReadinessReadContext {
  constructor(private transaction: Transaction) {}

  async getProject(projectId: string): Promise<ProjectEntity | null> {
    return await projectRepository.findByIdInTransaction(projectId, this.transaction);
  }

  async listActiveMaterialMemberships(projectId: string): Promise<ProjectMaterialMembershipEntity[]> {
    const all = await projectMaterialMembershipRepository.listMemberships(projectId, 'ACTIVE', this.transaction);
    return all;
  }

  async listActiveCarrierMemberships(projectId: string): Promise<ProjectCarrierMembershipEntity[]> {
    const all = await projectCarrierMembershipRepository.listMemberships(projectId, 'ACTIVE', this.transaction);
    return all;
  }

  async listActiveDriverMemberships(projectId: string): Promise<ProjectDriverMembershipEntity[]> {
    const all = await projectDriverMembershipRepository.listMemberships(projectId, 'ACTIVE', this.transaction);
    return all;
  }

  async listActiveTruckMemberships(projectId: string): Promise<ProjectTruckMembershipEntity[]> {
    const all = await projectTruckMembershipRepository.listMemberships(projectId, 'ACTIVE', this.transaction);
    return all;
  }

  async getDriverCarrierAffiliation(projectId: string, driverId: string): Promise<ProjectDriverCarrierAffiliationEntity | null> {
    return await projectDriverCarrierAffiliationRepository.getAffiliation(projectId, driverId, this.transaction);
  }

  async getTruckCarrierAffiliation(projectId: string, truckId: string): Promise<ProjectTruckCarrierAffiliationEntity | null> {
    return await projectTruckCarrierAffiliationRepository.getAffiliation(projectId, truckId, this.transaction);
  }

  async getActiveDriverAssignment(projectId: string, driverId: string): Promise<ProjectDriverTruckAssignmentEntity | null> {
    const slot = await projectDriverTruckAssignmentRepository.getActiveDriverSlot(projectId, driverId, this.transaction);
    if (!slot || !slot.assignmentId) return null;
    const assignment = await projectDriverTruckAssignmentRepository.getAssignment(projectId, slot.assignmentId, this.transaction);
    return assignment && assignment.status === 'ACTIVE' ? assignment : null;
  }

  async getActiveTruckAssignment(projectId: string, truckId: string): Promise<ProjectDriverTruckAssignmentEntity | null> {
    const slot = await projectDriverTruckAssignmentRepository.getActiveTruckSlot(projectId, truckId, this.transaction);
    if (!slot || !slot.assignmentId) return null;
    const assignment = await projectDriverTruckAssignmentRepository.getAssignment(projectId, slot.assignmentId, this.transaction);
    return assignment && assignment.status === 'ACTIVE' ? assignment : null;
  }

  async getActiveTruckAllocation(projectId: string, truckId: string): Promise<ProjectTruckMaterialAllocationEntity | null> {
    const slot = await projectTruckMaterialAllocationRepository.getActiveSlot(projectId, truckId, this.transaction);
    if (!slot) return null;
    
    const allocation = await projectTruckMaterialAllocationRepository.getAllocation(projectId, slot.allocationId, this.transaction);
    if (!allocation) return null;
    
    if (allocation.projectId !== projectId || allocation.truckId !== truckId || allocation.status !== 'ACTIVE' || allocation.effectiveTo !== null) {
      return null;
    }
    
    return allocation;
  }

  async listPricingRules(projectId: string): Promise<PricingRuleEntity[]> {
    return await pricingRuleRepository.listByProjectInTransaction(projectId, this.transaction);
  }
}
