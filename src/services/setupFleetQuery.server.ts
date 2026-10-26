import { readCurrentAssignment, readCurrentAllocation } from '../utils/temporalRelationshipReads';
import { adminDb } from '../firebase/admin';
import { authorizeGlobalCommand, resolveGlobalNaturalIdentity } from './globalIdentityAuthority.server';
import { decodeParticipation } from './projectParticipationAuthority.server';
import { decodeFleetGlobal, isFleetRowDefect, projectFleetReadModelService } from './projectFleetReadModel.service';
import { ProjectFleetReadModelAdminReadContext } from './projectFleetReadModel.server';
import { GLOBAL_IDENTITIES, evaluateGlobalEligibility, type GlobalKind } from '../utils/globalIdentityPolicy';
import type { SetupFleetContext, SetupParticipant } from '../types/setupFleet';

/** Read-only composition of B1/B2 metadata and the B4 Fleet projection, for administrators. */
export class SetupFleetQuery {
  constructor(private db: any = adminDb) { }
  /** Read-only B1 resolution and B3 preview; never reserves an identity or changes a slot. */
  async previewIntake(projectId: string, input: { residencyId: string; plateNumber: string }, identity: { userId: string; email?: string }) {
    return this.db.runTransaction(async (tx: any) => {
      await authorizeGlobalCommand(tx, this.db, identity, projectId);
      const driver = await resolveGlobalNaturalIdentity(tx, this.db, 'DRIVER', input.residencyId);
      const truck = await resolveGlobalNaturalIdentity(tx, this.db, 'TRUCK', input.plateNumber);
      const at = new Date();
      const d = driver.id ? await readCurrentAssignment(tx, this.db, projectId, 'driverId', driver.id, at) : null;
      const tr = truck.id ? await readCurrentAssignment(tx, this.db, projectId, 'truckId', truck.id, at) : null;
      const allocation = truck.id ? await readCurrentAllocation(tx, this.db, projectId, truck.id, at) : null;
      return {
        projectId, driverId: driver.id, truckId: truck.id,
        assignments: [...new Map([d, tr].filter(Boolean).map(r => [r.assignmentId, { assignmentId: r.assignmentId, driverId: r.driverId, truckId: r.truckId }])).values()],
        allocation: allocation ? { allocationId: allocation.allocationId, materialId: allocation.materialId, truckId: allocation.truckId } : null
      };
    });
  }
  async read(projectId: string, identity: { userId: string; email?: string }): Promise<SetupFleetContext> {
    return this.db.runTransaction(async (tx: any) => {
      await authorizeGlobalCommand(tx, this.db, identity, projectId);
      return this.readProjection(projectId, ref => tx.get(ref));
    });
  }
  /** Internal composition: caller owns current-principal authorization and read consistency. */
  async readProjection(projectId: string, reader: (ref: any) => Promise<any>): Promise<SetupFleetContext> {
    const tx = { get: reader };
    const ctx = new ProjectFleetReadModelAdminReadContext(this.db, reader);
    const fleet = await projectFleetReadModelService.getProjectFleetReadModel(projectId, ctx);
    const groups = await Promise.all((Object.keys(GLOBAL_IDENTITIES) as GlobalKind[]).map(async kind => {
      const spec = GLOBAL_IDENTITIES[kind];
      const memberships = await tx.get(this.db.collection('projects').doc(projectId).collection(`${spec.kind}_memberships`));
      return Promise.all(memberships.docs.map(async (doc: any): Promise<SetupParticipant> => {
        const member = decodeParticipation(doc.data(), kind, projectId, doc.id);
        let global: any = null, affiliation: SetupParticipant['affiliation'] = null, issue: string | undefined;
        try {
          const snap = await tx.get(this.db.collection(spec.collection).doc(doc.id));
          if (snap.exists) global = decodeFleetGlobal(kind, snap.data(), doc.id);
          else issue = 'GLOBAL_ENTITY_MISSING';
        } catch (error) { if (!isFleetRowDefect(error)) throw error; issue = 'GLOBAL_ENTITY_INVALID'; }
        if (kind === 'DRIVER' || kind === 'TRUCK') {
          try {
            const snap = await tx.get(this.db.collection('projects').doc(projectId).collection(`${spec.kind}_carrier_affiliations`).doc(doc.id));
            if (snap.exists) {
              const value = decodeParticipation(snap.data(), kind, projectId, doc.id, true);
              affiliation = { carrierId: value.carrierId, status: value.status };
            }
          } catch (error) { if (!isFleetRowDefect(error)) throw error; issue = 'AFFILIATION_INTEGRITY_ERROR'; }
        }
        let assignment: SetupParticipant['assignment'] = null, allocation: SetupParticipant['allocation'] = null;
        if (kind === 'DRIVER' || kind === 'TRUCK') {
          try {
            const value = await readCurrentAssignment(tx, this.db, projectId, kind === 'DRIVER' ? 'driverId' : 'truckId', doc.id, new Date());
            if (value) assignment = { assignmentId: value.assignmentId, driverId: value.driverId, truckId: value.truckId };
          } catch (error) { if (!isFleetRowDefect(error)) throw error; issue = 'ASSIGNMENT_POINTER_INTEGRITY_ERROR'; }
        }
        if (kind === 'TRUCK') {
          try {
            const value = await readCurrentAllocation(tx, this.db, projectId, doc.id, new Date());
            if (value) allocation = { allocationId: value.allocationId, truckId: value.truckId, materialId: value.materialId };
          } catch (error) { if (!isFleetRowDefect(error)) throw error; issue = 'ALLOCATION_POINTER_CORRUPTION'; }
        }
        const policy = evaluateGlobalEligibility(kind, global);
        return {
          kind, id: doc.id, name: global?.fullNameAr || global?.plate || global?.normalizedPlate || global?.nameAr || global?.nameEn || doc.id,
          globalStatus: global?.status || null, membershipStatus: member.status,
          canReactivate: policy.CAN_REACTIVATE_MEMBERSHIP && !issue, assignment, allocation,
          eligible: policy.CAN_USE_OPERATIONALLY && member.status === 'ACTIVE' && !issue, affiliation, issue
        };
      }));
    }));
    return { projectId, participants: groups.flat().sort((a, b) => a.kind.localeCompare(b.kind) || a.id.localeCompare(b.id)), fleet };
  }
}
