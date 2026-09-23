import { adminDb } from '../firebase/admin';
import { ProjectFleetReadModelReadContext } from './projectFleetReadModel.context';
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

export class ProjectFleetReadModelAdminReadContext implements ProjectFleetReadModelReadContext {
  async listActiveTruckMemberships(projectId: string): Promise<ProjectTruckMembershipEntity[]> {
    const snap = await adminDb
      .collection('projects')
      .doc(projectId)
      .collection('truck_memberships')
      .where('status', '==', 'ACTIVE')
      .get();
    return snap.docs.map((doc: any) => doc.data() as ProjectTruckMembershipEntity);
  }

  async getTruckCarrierAffiliation(projectId: string, truckId: string): Promise<ProjectTruckCarrierAffiliationEntity | null> {
    const snap = await adminDb
      .collection('projects')
      .doc(projectId)
      .collection('truck_carrier_affiliations')
      .doc(truckId)
      .get();
    return snap.exists ? (snap.data() as ProjectTruckCarrierAffiliationEntity) : null;
  }

  async getActiveTruckSlot(projectId: string, truckId: string): Promise<ActiveAssignmentSlotPayload | null> {
    const snap = await adminDb
      .collection('projects')
      .doc(projectId)
      .collection('truck_active_assignments')
      .doc(truckId)
      .get();
    return snap.exists ? (snap.data() as ActiveAssignmentSlotPayload) : null;
  }

  async getDriverTruckAssignment(projectId: string, assignmentId: string): Promise<ProjectDriverTruckAssignmentEntity | null> {
    const snap = await adminDb
      .collection('projects')
      .doc(projectId)
      .collection('driver_truck_assignments')
      .doc(assignmentId)
      .get();
    return snap.exists ? (snap.data() as ProjectDriverTruckAssignmentEntity) : null;
  }

  async getDriverCarrierAffiliation(projectId: string, driverId: string): Promise<ProjectDriverCarrierAffiliationEntity | null> {
    const snap = await adminDb
      .collection('projects')
      .doc(projectId)
      .collection('driver_carrier_affiliations')
      .doc(driverId)
      .get();
    return snap.exists ? (snap.data() as ProjectDriverCarrierAffiliationEntity) : null;
  }

  async getActiveAllocationByTruck(projectId: string, truckId: string): Promise<ProjectTruckMaterialAllocationEntity | null> {
    const slotSnap = await adminDb
      .collection('projects')
      .doc(projectId)
      .collection('truck_active_material_allocations')
      .doc(truckId)
      .get();
    if (!slotSnap.exists) return null;
    const slot = slotSnap.data();
    if (!slot || !slot.allocationId) return null;

    const allocSnap = await adminDb
      .collection('projects')
      .doc(projectId)
      .collection('truck_material_allocations')
      .doc(slot.allocationId)
      .get();
    if (!allocSnap.exists) {
      throw new Error(
        `ALLOCATION_POINTER_CORRUPTION: Active slot points to non-existent allocation ${slot.allocationId} for truck ${truckId}`
      );
    }
    const allocation = allocSnap.data() as ProjectTruckMaterialAllocationEntity;
    if (allocation.projectId !== projectId || allocation.truckId !== truckId) {
      throw new Error(
        `ALLOCATION_POINTER_CORRUPTION: Active slot points to allocation ${slot.allocationId} with mismatched truck or project`
      );
    }
    if (allocation.status !== 'ACTIVE' || allocation.effectiveTo !== null) {
      throw new Error(
        `ALLOCATION_POINTER_CORRUPTION: Active slot points to inactive or closed allocation ${slot.allocationId}`
      );
    }
    return allocation;
  }

  async getGlobalTruck(truckId: string): Promise<GlobalTruckEntity | null> {
    const snap = await adminDb.collection('trucks').doc(truckId).get();
    return snap.exists ? (snap.data() as GlobalTruckEntity) : null;
  }

  async getGlobalCarrier(carrierId: string): Promise<GlobalCarrierEntity | null> {
    const snap = await adminDb.collection('carriers').doc(carrierId).get();
    return snap.exists ? (snap.data() as GlobalCarrierEntity) : null;
  }

  async getGlobalDriver(driverId: string): Promise<GlobalDriverEntity | null> {
    const snap = await adminDb.collection('drivers').doc(driverId).get();
    return snap.exists ? (snap.data() as GlobalDriverEntity) : null;
  }

  async getGlobalMaterial(materialId: string): Promise<GlobalMaterialEntity | null> {
    const snap = await adminDb.collection('materials').doc(materialId).get();
    return snap.exists ? (snap.data() as GlobalMaterialEntity) : null;
  }
}
