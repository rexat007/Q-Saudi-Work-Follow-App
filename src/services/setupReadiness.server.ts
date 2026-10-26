import { SetupFleetQuery } from './setupFleetQuery.server';
import { evaluateSetupReadiness, unavailableSetupReadiness } from '../utils/setupReadiness';
import { decodeParticipation } from './projectParticipationAuthority.server';
import { decodeTemporal, isCurrentTemporal } from '../utils/temporalRelationshipPolicy';
import type { ProjectEntity } from '../types/entities';
import type { SetupReadinessBlocker, SetupReadinessResult } from '../types/setupReadiness';

/** Uses the caller's reader, so review/activation can evaluate all Setup reads in their write transaction. */
export async function readSetupReadiness(projectId: string, project: ProjectEntity, db: any, reader: (ref: any) => Promise<any>): Promise<SetupReadinessResult> {
  try {
    const context = await new SetupFleetQuery(db).readProjection(projectId, reader);
    const root = db.collection('projects').doc(projectId), integrity: SetupReadinessBlocker[] = [];
    const issue = (id?: string) => integrity.push({ category: 'DATA_INTEGRITY', ownerPhase: 'PHASE_6', code: 'SETUP_RELATIONSHIP_INTEGRITY_ERROR', message: 'Canonical setup data requires administrative review.', entityId: id, recommendedAction: 'OPEN_ROSTER' });
    const participant = (kind: string, id: string) => context.participants.find(p => p.kind === kind && p.id === id);
    // Scan existing relationships too: orphan slots/history/affiliations cannot be hidden by membership-based lists.
    for (const kind of ['DRIVER', 'TRUCK'] as const) {
      const records = await reader(root.collection(`${kind.toLowerCase()}_carrier_affiliations`));
      for (const doc of records.docs) {
        try {
          const value = decodeParticipation(doc.data(), kind, projectId, doc.id, true);
          if (!participant(kind, doc.id) || !participant('CARRIER', value.carrierId)) issue(doc.id);
        } catch { issue(doc.id); }
      }
    }
    for (const kind of ['ASSIGNMENT', 'ALLOCATION'] as const) {
      const records = await reader(root.collection(kind === 'ASSIGNMENT' ? 'driver_truck_assignments' : 'truck_material_allocations').where('status', '==', 'ACTIVE'));
      for (const doc of records.docs) {
        try {
          const record = decodeTemporal(kind, doc.data(), doc.id, projectId), truck = participant('TRUCK', record.truckId);
          if (!truck || !isCurrentTemporal(record, new Date()) || truck.affiliation?.status !== 'ACTIVE') { issue(record.truckId || doc.id); continue; }
          if (kind === 'ASSIGNMENT') {
            const driver = participant('DRIVER', record.driverId);
            if (!driver || driver.affiliation?.status !== 'ACTIVE' || driver.affiliation.carrierId !== truck.affiliation.carrierId || truck.assignment?.assignmentId !== doc.id || driver.assignment?.assignmentId !== doc.id) issue(record.truckId);
          } else if (!participant('MATERIAL', record.materialId) || truck.allocation?.allocationId !== doc.id) issue(record.truckId);
        } catch { issue(doc.id); }
      }
    }
    // Orphan active slots may exist even without their owners' memberships or history.
    for (const [collection, kind] of [['driver_active_assignments', 'DRIVER'], ['truck_active_assignments', 'TRUCK'], ['truck_active_material_allocations', 'TRUCK']] as const) {
      const slots = await reader(root.collection(collection));
      for (const doc of slots.docs) if (!participant(kind, doc.id)) issue(doc.id);
    }
    return evaluateSetupReadiness(project, context, integrity);
  } catch { return unavailableSetupReadiness(); }
}
