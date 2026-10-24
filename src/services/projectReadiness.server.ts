import { decodeProject, decodeGlobal, decodePersistence, decodeScopedProjection } from '../utils/persistenceBoundary';
import { adminDb } from '../firebase/admin';
import { ProjectReadinessReadContext } from './projectReadiness.context';
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

export class ProjectReadinessAdminReadContext implements ProjectReadinessReadContext {
  async getProject(projectId: string): Promise<ProjectEntity | null> {
    const snap = await adminDb.collection('projects').doc(projectId).get();
    return snap.exists ? (decodeProject<ProjectEntity>(snap.data(), projectId)) : null;
  }

  async listActiveMaterialMemberships(projectId: string): Promise<ProjectMaterialMembershipEntity[]> {
    const snap = await adminDb
      .collection('projects')
      .doc(projectId)
      .collection('material_memberships')
      .where('status', '==', 'ACTIVE')
      .get();
    return snap.docs.map((d: any) => decodeScopedProjection<ProjectMaterialMembershipEntity>(d.data(), 'materialId', d.id, projectId, ['ACTIVE', 'SUSPENDED', 'REMOVED']));
  }

  async listActiveCarrierMemberships(projectId: string): Promise<ProjectCarrierMembershipEntity[]> {
    const snap = await adminDb
      .collection('projects')
      .doc(projectId)
      .collection('carrier_memberships')
      .where('status', '==', 'ACTIVE')
      .get();
    return snap.docs.map((d: any) => decodeScopedProjection<ProjectCarrierMembershipEntity>(d.data(), 'carrierId', d.id, projectId, ['ACTIVE', 'SUSPENDED', 'REMOVED']));
  }

  async listActiveDriverMemberships(projectId: string): Promise<ProjectDriverMembershipEntity[]> {
    const snap = await adminDb
      .collection('projects')
      .doc(projectId)
      .collection('driver_memberships')
      .where('status', '==', 'ACTIVE')
      .get();
    return snap.docs.map((d: any) => decodeScopedProjection<ProjectDriverMembershipEntity>(d.data(), 'driverId', d.id, projectId, ['ACTIVE', 'SUSPENDED', 'REMOVED']));
  }

  async listActiveTruckMemberships(projectId: string): Promise<ProjectTruckMembershipEntity[]> {
    const snap = await adminDb
      .collection('projects')
      .doc(projectId)
      .collection('truck_memberships')
      .where('status', '==', 'ACTIVE')
      .get();
    return snap.docs.map((d: any) => decodeScopedProjection<ProjectTruckMembershipEntity>(d.data(), 'truckId', d.id, projectId, ['ACTIVE', 'SUSPENDED', 'REMOVED']));
  }

  async getDriverCarrierAffiliation(projectId: string, driverId: string): Promise<ProjectDriverCarrierAffiliationEntity | null> {
    const snap = await adminDb
      .collection('projects')
      .doc(projectId)
      .collection('driver_carrier_affiliations')
      .doc(driverId)
      .get();
    return snap.exists ? (decodeScopedProjection<ProjectDriverCarrierAffiliationEntity>(snap.data(), 'driverId', driverId, projectId, ['ACTIVE', 'INACTIVE'])) : null;
  }

  async getTruckCarrierAffiliation(projectId: string, truckId: string): Promise<ProjectTruckCarrierAffiliationEntity | null> {
    const snap = await adminDb
      .collection('projects')
      .doc(projectId)
      .collection('truck_carrier_affiliations')
      .doc(truckId)
      .get();
    return snap.exists ? (decodeScopedProjection<ProjectTruckCarrierAffiliationEntity>(snap.data(), 'truckId', truckId, projectId, ['ACTIVE', 'INACTIVE'])) : null;
  }

  async getActiveDriverAssignment(projectId: string, driverId: string): Promise<ProjectDriverTruckAssignmentEntity | null> {
    const slotSnap = await adminDb
      .collection('projects')
      .doc(projectId)
      .collection('driver_active_assignments')
      .doc(driverId)
      .get();
    if (!slotSnap.exists) return null;
    const slot = slotSnap.data();
    if (!slot || !slot.assignmentId) return null;

    const assignSnap = await adminDb
      .collection('projects')
      .doc(projectId)
      .collection('driver_truck_assignments')
      .doc(slot.assignmentId)
      .get();
    if (!assignSnap.exists) return null;
    const assignment = assignSnap.data();
    return assignment && assignment.status === 'ACTIVE'
      ? decodeScopedProjection<ProjectDriverTruckAssignmentEntity>(assignment, 'assignmentId', assignSnap.id, projectId, ['ACTIVE', 'CLOSED'])
      : null;
  }

  async getActiveTruckAssignment(projectId: string, truckId: string): Promise<ProjectDriverTruckAssignmentEntity | null> {
    const slotSnap = await adminDb
      .collection('projects')
      .doc(projectId)
      .collection('truck_active_assignments')
      .doc(truckId)
      .get();
    if (!slotSnap.exists) return null;
    const slot = slotSnap.data();
    if (!slot || !slot.assignmentId) return null;

    const assignSnap = await adminDb
      .collection('projects')
      .doc(projectId)
      .collection('driver_truck_assignments')
      .doc(slot.assignmentId)
      .get();
    if (!assignSnap.exists) return null;
    const assignment = assignSnap.data();
    return assignment && assignment.status === 'ACTIVE'
      ? decodeScopedProjection<ProjectDriverTruckAssignmentEntity>(assignment, 'assignmentId', assignSnap.id, projectId, ['ACTIVE', 'CLOSED'])
      : null;
  }

  async getActiveTruckAllocation(projectId: string, truckId: string): Promise<ProjectTruckMaterialAllocationEntity | null> {
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
    if (!allocSnap.exists) return null;
    const allocation = allocSnap.data();
    if (!allocation) return null;

    if (
      allocation.projectId !== projectId ||
      allocation.truckId !== truckId ||
      allocation.status !== 'ACTIVE' ||
      allocation.effectiveTo !== null
    ) {
      return null;
    }
    return decodeScopedProjection<ProjectTruckMaterialAllocationEntity>(allocation, 'allocationId', allocSnap.id, projectId, ['ACTIVE', 'CLOSED']);
  }

  async listPricingRules(projectId: string): Promise<PricingRuleEntity[]> {
    const snap = await adminDb
      .collection('projects')
      .doc(projectId)
      .collection('pricing_rules')
      .get();
    return snap.docs.map((d: any) => decodeScopedProjection<PricingRuleEntity>(d.data(), 'pricingRuleId', d.id, projectId));
  }
}
