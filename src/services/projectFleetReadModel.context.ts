import { ProjectTruckMembershipEntity } from '../types/projectMembership';
import {
  ProjectTruckCarrierAffiliationEntity,
  ProjectDriverCarrierAffiliationEntity,
} from '../types/projectCarrierAffiliation';
import {
  ActiveAssignmentSlotPayload,
  ProjectDriverTruckAssignmentEntity,
} from '../types/projectDriverTruckAssignment';
import { ProjectTruckMaterialAllocationEntity } from '../types/projectTruckMaterialAllocation';
import {
  GlobalDriverEntity,
  GlobalTruckEntity,
  GlobalCarrierEntity,
  GlobalMaterialEntity,
} from '../types/globalEntities';

import { projectTruckMembershipRepository } from '../repositories/projectMembership.repository';
import {
  projectTruckCarrierAffiliationRepository,
  projectDriverCarrierAffiliationRepository,
} from '../repositories/projectCarrierAffiliation.repository';
import { projectDriverTruckAssignmentRepository } from '../repositories/projectDriverTruckAssignment.repository';
import { projectTruckMaterialAllocationRepository } from '../repositories/projectTruckMaterialAllocation.repository';
import {
  globalTruckRepository,
  globalCarrierRepository,
  globalDriverRepository,
  globalMaterialRepository,
} from '../repositories/globalIdentity.repository';

export interface ProjectFleetReadModelReadContext {
  listActiveTruckMemberships(projectId: string): Promise<ProjectTruckMembershipEntity[]>;
  getTruckCarrierAffiliation(projectId: string, truckId: string): Promise<ProjectTruckCarrierAffiliationEntity | null>;
  getActiveTruckSlot(projectId: string, truckId: string): Promise<ActiveAssignmentSlotPayload | null>;
  getDriverTruckAssignment(projectId: string, assignmentId: string): Promise<ProjectDriverTruckAssignmentEntity | null>;
  getDriverCarrierAffiliation(projectId: string, driverId: string): Promise<ProjectDriverCarrierAffiliationEntity | null>;
  getActiveAllocationByTruck(projectId: string, truckId: string): Promise<ProjectTruckMaterialAllocationEntity | null>;
  getGlobalTruck(truckId: string): Promise<GlobalTruckEntity | null>;
  getGlobalCarrier(carrierId: string): Promise<GlobalCarrierEntity | null>;
  getGlobalDriver(driverId: string): Promise<GlobalDriverEntity | null>;
  getGlobalMaterial(materialId: string): Promise<GlobalMaterialEntity | null>;
}

export class DefaultProjectFleetReadModelReadContext implements ProjectFleetReadModelReadContext {
  async listActiveTruckMemberships(projectId: string): Promise<ProjectTruckMembershipEntity[]> {
    return await projectTruckMembershipRepository.listMemberships(projectId, 'ACTIVE');
  }

  async getTruckCarrierAffiliation(projectId: string, truckId: string): Promise<ProjectTruckCarrierAffiliationEntity | null> {
    return await projectTruckCarrierAffiliationRepository.getAffiliation(projectId, truckId);
  }

  async getActiveTruckSlot(projectId: string, truckId: string): Promise<ActiveAssignmentSlotPayload | null> {
    return await projectDriverTruckAssignmentRepository.getActiveTruckSlot(projectId, truckId);
  }

  async getDriverTruckAssignment(projectId: string, assignmentId: string): Promise<ProjectDriverTruckAssignmentEntity | null> {
    return await projectDriverTruckAssignmentRepository.getAssignment(projectId, assignmentId);
  }

  async getDriverCarrierAffiliation(projectId: string, driverId: string): Promise<ProjectDriverCarrierAffiliationEntity | null> {
    return await projectDriverCarrierAffiliationRepository.getAffiliation(projectId, driverId);
  }

  async getActiveAllocationByTruck(projectId: string, truckId: string): Promise<ProjectTruckMaterialAllocationEntity | null> {
    return await projectTruckMaterialAllocationRepository.getActiveAllocationByTruck(projectId, truckId);
  }

  async getGlobalTruck(truckId: string): Promise<GlobalTruckEntity | null> {
    return await globalTruckRepository.findById(truckId);
  }

  async getGlobalCarrier(carrierId: string): Promise<GlobalCarrierEntity | null> {
    return await globalCarrierRepository.findById(carrierId);
  }

  async getGlobalDriver(driverId: string): Promise<GlobalDriverEntity | null> {
    return await globalDriverRepository.findById(driverId);
  }

  async getGlobalMaterial(materialId: string): Promise<GlobalMaterialEntity | null> {
    return await globalMaterialRepository.findById(materialId);
  }
}
