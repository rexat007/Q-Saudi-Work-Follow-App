import { readCurrentAssignment, readCurrentAllocation } from '../utils/temporalRelationshipReads';
import { projectCarrierMembershipRepository, projectDriverMembershipRepository, projectMaterialMembershipRepository } from '../repositories/projectMembership.repository';
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
  getCurrentAssignment?(projectId: string, truckId: string, at: Date): Promise<ProjectDriverTruckAssignmentEntity | null>;
  getMembership?(kind: 'DRIVER' | 'TRUCK' | 'CARRIER' | 'MATERIAL', projectId: string, id: string): Promise<any>;

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
  constructor() { if (process.env.NODE_ENV !== 'test') throw new Error('CANONICAL_FLEET_SERVER_REQUIRED'); }
  getMembership(kind: 'DRIVER' | 'TRUCK' | 'CARRIER' | 'MATERIAL', projectId: string, id: string) {
    return { DRIVER: projectDriverMembershipRepository, TRUCK: projectTruckMembershipRepository, CARRIER: projectCarrierMembershipRepository, MATERIAL: projectMaterialMembershipRepository }[kind].getMembership(projectId, id);
  }
  // TEST_ONLY virtual read transport, using exactly the B3 reader and no mutations.
  private compatibilityDatabase(projectId: string): any {
    const ref = (path: string, field?: string, value?: string): any => ({ path, id: path.split('/').at(-1), collection: (name: string) => ref(path + '/' + name), doc: (id: string) => ref(path + '/' + id), where: (f: string, _op: string, v: string) => ref(path, f, v), get: async () => {
      const parts = path.split('/'), collection = parts[2], id = parts[3];
      if (!id) {
        const records = collection === 'driver_truck_assignments' ? await (field === 'driverId' ? projectDriverTruckAssignmentRepository.listDriverAssignmentHistory(projectId, value!) : projectDriverTruckAssignmentRepository.listTruckAssignmentHistory(projectId, value!)) : await projectTruckMaterialAllocationRepository.listTruckMaterialHistory(projectId, value!);
        return { docs: records.map((data: any) => ({ id: data.assignmentId || data.allocationId, data: () => data })) };
      }
      const data = collection === 'driver_active_assignments' ? await projectDriverTruckAssignmentRepository.getActiveDriverSlot(projectId, id) : collection === 'truck_active_assignments' ? await projectDriverTruckAssignmentRepository.getActiveTruckSlot(projectId, id) : collection === 'driver_truck_assignments' ? await projectDriverTruckAssignmentRepository.getAssignment(projectId, id) : collection === 'truck_active_material_allocations' ? await projectTruckMaterialAllocationRepository.getActiveSlot(projectId, id) : await projectTruckMaterialAllocationRepository.getAllocation(projectId, id);
      return { id, exists: data !== null, data: () => data };
    } });
    return { collection: (name: string) => ref(name) };
  }
  getCurrentAssignment(projectId: string, truckId: string, at: Date) { return readCurrentAssignment({ get: (r: any) => r.get() }, this.compatibilityDatabase(projectId), projectId, 'truckId', truckId, at); }

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
    return readCurrentAllocation({ get: (r: any) => r.get() }, this.compatibilityDatabase(projectId), projectId, truckId, new Date());
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
