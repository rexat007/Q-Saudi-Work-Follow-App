import { readSetupReadiness } from './setupReadiness.server';
import { isCurrentTemporal, assignmentSlotsAgree } from '../utils/temporalRelationshipPolicy';
import { evaluateGlobalEligibility } from '../utils/globalIdentityPolicy';
import { buildPrincipal } from '../utils/principal';
import type { AuthUserContext } from '../types/common';
import { validateCandidateIds, validReadinessId, applicableReadinessPricing, readinessPricing, type CandidatePath, type ReadinessBlocker } from './projectReadiness.service';
import { decodeProject, decodeGlobal, decodePersistence, decodeScopedProjection, decodeRelationship, decodePricing, PersistenceBoundaryError } from '../utils/persistenceBoundary';
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
  constructor(private database?: any, private reader?: (reference: any) => Promise<any>) {}
  private get db() { return this.database || adminDb; }
  private get(reference: any) { return this.reader ? this.reader(reference) : reference.get(); }
  getSetupReadiness(projectId: string, project: ProjectEntity) {
    return readSetupReadiness(projectId, project, this.db, ref => this.get(ref));
  }
  async currentPrincipal(projectId: string, authenticated: AuthUserContext, activation = false) {
    if (!validReadinessId(projectId) || !validReadinessId(authenticated?.userId)) throw Object.assign(new Error('غير مصرح لك بتنشيط المشروع'), { code: 'FORBIDDEN_PROJECT_ACCESS', status: 403 });
    const account = await this.get(this.db.collection('users').doc(authenticated.userId));
    const actor = buildPrincipal(account.exists ? account.data() : null, authenticated.userId, { email: authenticated.email });
    if (actor.role !== 'SUPER_ADMIN' && (!actor.assignedProjectIds.includes(projectId) || (activation && actor.role !== 'PROJECT_ADMIN'))) throw Object.assign(new Error('غير مصرح لك بتنشيط المشروع'), { code: 'FORBIDDEN_PROJECT_ACCESS', status: 403 });
    return actor;
  }

  /** Discovery and transaction use this same candidate predicate. The reader selects consistency. */
  async revalidateCandidatePath(projectId: string, path: CandidatePath, at: Date | (() => Date)): Promise<ReadinessBlocker[]> {
    validateCandidateIds(path);
    if (!validReadinessId(projectId)) throw new PersistenceBoundaryError('projectId');
    const { driverId, truckId, carrierId, materialId, assignmentId, allocationId, pricingRuleId } = path;
    const base = this.db.collection('projects').doc(projectId);
    const specs: [string, string, string, readonly string[]][] = [
      ['driver_memberships', driverId, 'driverId', ['ACTIVE', 'SUSPENDED', 'REMOVED']],
      ['truck_memberships', truckId, 'truckId', ['ACTIVE', 'SUSPENDED', 'REMOVED']],
      ['carrier_memberships', carrierId, 'carrierId', ['ACTIVE', 'SUSPENDED', 'REMOVED']],
      ['material_memberships', materialId, 'materialId', ['ACTIVE', 'SUSPENDED', 'REMOVED']],
      ['driver_carrier_affiliations', driverId, 'driverId', ['ACTIVE', 'INACTIVE']],
      ['truck_carrier_affiliations', truckId, 'truckId', ['ACTIVE', 'INACTIVE']],
      ['driver_truck_assignments', assignmentId, 'assignmentId', ['ACTIVE', 'CLOSED']],
      ['truck_material_allocations', allocationId, 'allocationId', ['ACTIVE', 'CLOSED']],
    ];
    const refs = specs.map(([collection, id]) => base.collection(collection).doc(id));
    refs.push(base.collection('driver_active_assignments').doc(driverId), base.collection('truck_active_assignments').doc(truckId), base.collection('truck_active_material_allocations').doc(truckId), base.collection('pricing_rules').doc(pricingRuleId));
    const globalSpecs = [['drivers', 'driver', driverId], ['trucks', 'truck', truckId], ['carriers', 'carrier', carrierId], ['materials', 'material', materialId]] as const;
    const snapshots = await Promise.all([...refs, ...globalSpecs.map(([collection, , id]) => this.db.collection(collection).doc(id))].map(ref => this.get(ref)));
    if (snapshots.some(snap => !snap.exists)) return [{ category: 'RELATIONSHIP', ownerPhase: 'PHASE_5', code: 'CANDIDATE_DOCUMENT_MISSING', message: 'فشلت مطابقة مستندات المسار التشغيلي: مستند مفقود' }];
    const evaluatedAt = typeof at === 'function' ? at() : at;
    const records = specs.map(([, id, field, statuses], index) => decodeRelationship<any>(snapshots[index].data(), field, id, projectId, statuses));
    const [driver, truck, carrier, material, driverAffil, truckAffil, assignment, allocation] = records;
    const slot = (index: number, field: string, expected: string, ownerField: string, ownerId: string) => {
      const data = decodePersistence<any>(snapshots[index].data(), { required: [field] });
      if (!validReadinessId(data[field])) throw new PersistenceBoundaryError(field);
      if (data.projectId !== undefined && data.projectId !== projectId) throw new PersistenceBoundaryError('projectId');
      if (data[ownerField] !== undefined && data[ownerField] !== ownerId) throw new PersistenceBoundaryError(ownerField);
      return data[field] === expected;
    };
    const slotsMatch = [slot(8, 'assignmentId', assignmentId, 'driverId', driverId), slot(9, 'assignmentId', assignmentId, 'truckId', truckId), slot(10, 'allocationId', allocationId, 'truckId', truckId)].every(Boolean);
    const pricing = decodePricing<any>(snapshots[11].data(), pricingRuleId, projectId);
    const ineligible = globalSpecs.filter(([, kind, id], index) => !evaluateGlobalEligibility(kind.toUpperCase() as import('../utils/globalIdentityPolicy').GlobalKind, decodeGlobal<any>(snapshots[index + 12].data(), kind, id)).CAN_USE_OPERATIONALLY);
    const started = (record: any) => isCurrentTemporal(record, evaluatedAt);
    const blockers: ReadinessBlocker[] = ineligible.map(([, kind]) => ({ category: 'RELATIONSHIP', ownerPhase: 'PHASE_5', code: `GLOBAL_${kind.toUpperCase()}_INELIGIBLE`, message: 'لا يوجد مسار تشغيلي مكتمل' }));
    const relationship = (valid: boolean, code: string, message: string) => { if (!valid) blockers.push({ category: 'RELATIONSHIP', ownerPhase: 'PHASE_5', code, message }); };
    relationship([driver, truck, carrier, material].every(record => record.status === 'ACTIVE'), 'CANDIDATE_MEMBERSHIP_INACTIVE', 'فشل تنشيط المشروع: عضوية غير نشطة');
    relationship(driverAffil.status === 'ACTIVE' && truckAffil.status === 'ACTIVE' && driverAffil.carrierId === carrierId && truckAffil.carrierId === carrierId, 'CANDIDATE_AFFILIATION_CHANGED', 'فشل تنشيط المشروع: انتساب غير نشط أو غير متطابق');
    relationship(slotsMatch && assignmentSlotsAgree(assignment, snapshots[8].data(), snapshots[9].data()), 'CANDIDATE_SLOT_CHANGED', 'فشل تنشيط المشروع: مؤشر التعيين النشط غير متطابق');
    relationship(assignment.status === 'ACTIVE' && assignment.driverId === driverId && assignment.truckId === truckId && started(assignment), 'CANDIDATE_ASSIGNMENT_CHANGED', 'فشل تنشيط المشروع: تفاصيل التعيين غير متطابقة أو غير نشطة');
    relationship(allocation.status === 'ACTIVE' && allocation.truckId === truckId && allocation.materialId === materialId && started(allocation), 'CANDIDATE_ALLOCATION_CHANGED', 'فشل تنشيط المشروع: تفاصيل التخصيص غير متطابقة أو غير نشطة');
    const currentRules = await this.get(base.collection('pricing_rules'));
    const priceSelection = readinessPricing(currentRules.docs.map((d:any)=>decodePricing<any>(d.data(),d.id,projectId)),projectId,carrierId,materialId,evaluatedAt);
    if (priceSelection.status !== 'RESOLVED' || priceSelection.selectedRule?.pricingRuleId !== pricingRuleId) blockers.push({ category: 'PRICING', ownerPhase: 'PHASE_9', code: 'NO_APPLICABLE_PRICING', message: 'فشل تنشيط المشروع: قاعدة التسعير منتهية الصلاحية أو غير سارية' });
    return blockers;
  }

  async getProject(projectId: string): Promise<ProjectEntity | null> {
    const snap = await this.get(this.db.collection('projects').doc(projectId));
    return snap.exists ? (decodeProject<ProjectEntity>(snap.data(), projectId)) : null;
  }

  async listActiveMaterialMemberships(projectId: string): Promise<ProjectMaterialMembershipEntity[]> {
    const snap = await this.get(this.db
      .collection('projects')
      .doc(projectId)
      .collection('material_memberships')
      .where('status', '==', 'ACTIVE')
      );
    return snap.docs.map((d: any) => decodeScopedProjection<ProjectMaterialMembershipEntity>(d.data(), 'materialId', d.id, projectId, ['ACTIVE', 'SUSPENDED', 'REMOVED']));
  }

  async listActiveCarrierMemberships(projectId: string): Promise<ProjectCarrierMembershipEntity[]> {
    const snap = await this.get(this.db
      .collection('projects')
      .doc(projectId)
      .collection('carrier_memberships')
      .where('status', '==', 'ACTIVE')
      );
    return snap.docs.map((d: any) => decodeScopedProjection<ProjectCarrierMembershipEntity>(d.data(), 'carrierId', d.id, projectId, ['ACTIVE', 'SUSPENDED', 'REMOVED']));
  }

  async listActiveDriverMemberships(projectId: string): Promise<ProjectDriverMembershipEntity[]> {
    const snap = await this.get(this.db
      .collection('projects')
      .doc(projectId)
      .collection('driver_memberships')
      .where('status', '==', 'ACTIVE')
      );
    return snap.docs.map((d: any) => decodeScopedProjection<ProjectDriverMembershipEntity>(d.data(), 'driverId', d.id, projectId, ['ACTIVE', 'SUSPENDED', 'REMOVED']));
  }

  async listActiveTruckMemberships(projectId: string): Promise<ProjectTruckMembershipEntity[]> {
    const snap = await this.get(this.db
      .collection('projects')
      .doc(projectId)
      .collection('truck_memberships')
      .where('status', '==', 'ACTIVE')
      );
    return snap.docs.map((d: any) => decodeScopedProjection<ProjectTruckMembershipEntity>(d.data(), 'truckId', d.id, projectId, ['ACTIVE', 'SUSPENDED', 'REMOVED']));
  }

  async getDriverCarrierAffiliation(projectId: string, driverId: string): Promise<ProjectDriverCarrierAffiliationEntity | null> {
    const snap = await this.get(this.db
      .collection('projects')
      .doc(projectId)
      .collection('driver_carrier_affiliations')
      .doc(driverId)
      );
    return snap.exists ? (decodeScopedProjection<ProjectDriverCarrierAffiliationEntity>(snap.data(), 'driverId', driverId, projectId, ['ACTIVE', 'INACTIVE'])) : null;
  }

  async getTruckCarrierAffiliation(projectId: string, truckId: string): Promise<ProjectTruckCarrierAffiliationEntity | null> {
    const snap = await this.get(this.db
      .collection('projects')
      .doc(projectId)
      .collection('truck_carrier_affiliations')
      .doc(truckId)
      );
    return snap.exists ? (decodeScopedProjection<ProjectTruckCarrierAffiliationEntity>(snap.data(), 'truckId', truckId, projectId, ['ACTIVE', 'INACTIVE'])) : null;
  }

  async getActiveDriverAssignment(projectId: string, driverId: string): Promise<ProjectDriverTruckAssignmentEntity | null> {
    const slotSnap = await this.get(this.db
      .collection('projects')
      .doc(projectId)
      .collection('driver_active_assignments')
      .doc(driverId)
      );
    if (!slotSnap.exists) return null;
    const slot = slotSnap.data();
    if (!slot || !slot.assignmentId) return null;
    if (!validReadinessId(slot.assignmentId)) throw new PersistenceBoundaryError('assignmentId');

    const assignSnap = await this.get(this.db
      .collection('projects')
      .doc(projectId)
      .collection('driver_truck_assignments')
      .doc(slot.assignmentId)
      );
    if (!assignSnap.exists) return null;
    const assignment = assignSnap.data();
    return assignment && assignment.status === 'ACTIVE'
      ? decodeScopedProjection<ProjectDriverTruckAssignmentEntity>(assignment, 'assignmentId', assignSnap.id, projectId, ['ACTIVE', 'CLOSED'])
      : null;
  }

  async getActiveTruckAssignment(projectId: string, truckId: string): Promise<ProjectDriverTruckAssignmentEntity | null> {
    const slotSnap = await this.get(this.db
      .collection('projects')
      .doc(projectId)
      .collection('truck_active_assignments')
      .doc(truckId)
      );
    if (!slotSnap.exists) return null;
    const slot = slotSnap.data();
    if (!slot || !slot.assignmentId) return null;
    if (!validReadinessId(slot.assignmentId)) throw new PersistenceBoundaryError('assignmentId');

    const assignSnap = await this.get(this.db
      .collection('projects')
      .doc(projectId)
      .collection('driver_truck_assignments')
      .doc(slot.assignmentId)
      );
    if (!assignSnap.exists) return null;
    const assignment = assignSnap.data();
    return assignment && assignment.status === 'ACTIVE'
      ? decodeScopedProjection<ProjectDriverTruckAssignmentEntity>(assignment, 'assignmentId', assignSnap.id, projectId, ['ACTIVE', 'CLOSED'])
      : null;
  }

  async getActiveTruckAllocation(projectId: string, truckId: string): Promise<ProjectTruckMaterialAllocationEntity | null> {
    const slotSnap = await this.get(this.db
      .collection('projects')
      .doc(projectId)
      .collection('truck_active_material_allocations')
      .doc(truckId)
      );
    if (!slotSnap.exists) return null;
    const slot = slotSnap.data();
    if (!slot || !slot.allocationId) return null;
    if (!validReadinessId(slot.allocationId)) throw new PersistenceBoundaryError('allocationId');

    const allocSnap = await this.get(this.db
      .collection('projects')
      .doc(projectId)
      .collection('truck_material_allocations')
      .doc(slot.allocationId)
      );
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
    const snap = await this.get(this.db
      .collection('projects')
      .doc(projectId)
      .collection('pricing_rules')
      );
    return snap.docs.map((d: any) => decodePricing<PricingRuleEntity>(d.data(), d.id, projectId));
  }
}
