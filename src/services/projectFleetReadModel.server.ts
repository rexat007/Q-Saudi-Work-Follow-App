import { decodeGlobal, decodePersistence, decodeScopedProjection } from '../utils/persistenceBoundary';
import { adminDb } from '../firebase/admin';
import { readCurrentAssignment, readCurrentAllocation } from '../utils/temporalRelationshipReads';
import { GLOBAL_IDENTITIES, type GlobalKind } from '../utils/globalIdentityPolicy';
import type { ProjectFleetReadModelReadContext } from './projectFleetReadModel.context';
/** Per-request authoritative reader. No writes and no cache surviving a projection. */
export class ProjectFleetReadModelAdminReadContext implements ProjectFleetReadModelReadContext {
  constructor(private database: any = adminDb, private reader?: (ref: any) => Promise<any>) {}
  private get(ref: any) { return this.reader ? this.reader(ref) : ref.get(); }
  private root(p: string) { return this.database.collection('projects').doc(p); }
  async listActiveMemberships(kind: GlobalKind, p: string): Promise<any[]> {
    const spec = GLOBAL_IDENTITIES[kind], snap = await this.get(this.root(p).collection(`${spec.kind}_memberships`).where('status', '==', 'ACTIVE'));
    return snap.docs.map((d: any) => decodeScopedProjection<any>(d.data(), spec.id, d.id, p, ['ACTIVE', 'SUSPENDED', 'REMOVED'])).filter((membership: any) => membership.status === 'ACTIVE');
  }
  listActiveTruckMemberships(p: string) { return this.listActiveMemberships('TRUCK', p); }
  async getMembership(kind: GlobalKind, p: string, id: string): Promise<any> {
    const spec = GLOBAL_IDENTITIES[kind], snap = await this.get(this.root(p).collection(`${spec.kind}_memberships`).doc(id));
    return snap.exists ? decodeScopedProjection(snap.data(), spec.id, id, p, ['ACTIVE', 'SUSPENDED', 'REMOVED']) : null;
  }
  private async affiliation(kind: 'driver' | 'truck', p: string, id: string): Promise<any> {
    const snap = await this.get(this.root(p).collection(`${kind}_carrier_affiliations`).doc(id));
    return snap.exists ? decodeScopedProjection(snap.data(), `${kind}Id`, id, p, ['ACTIVE', 'INACTIVE']) : null;
  }
  getTruckCarrierAffiliation(p: string, id: string) { return this.affiliation('truck', p, id); }
  getDriverCarrierAffiliation(p: string, id: string) { return this.affiliation('driver', p, id); }
  async getActiveTruckSlot(p: string, id: string): Promise<any> {
    const snap = await this.get(this.root(p).collection('truck_active_assignments').doc(id));
    return snap.exists ? decodePersistence(snap.data(), { required: ['assignmentId'] }) : null;
  }
  async getDriverTruckAssignment(p: string, id: string): Promise<any> {
    const snap = await this.get(this.root(p).collection('driver_truck_assignments').doc(id));
    return snap.exists ? decodeScopedProjection(snap.data(), 'assignmentId', id, p, ['ACTIVE', 'CLOSED']) : null;
  }
  getCurrentAssignment(p: string, truckId: string, at: Date) { return readCurrentAssignment({ get: (ref: any) => this.get(ref) }, this.database, p, 'truckId', truckId, at); }
  getActiveAllocationByTruck(p: string, truckId: string) { return readCurrentAllocation({ get: (ref: any) => this.get(ref) }, this.database, p, truckId, new Date()); }
  private async global(kind: GlobalKind, id: string): Promise<any> {
    const spec = GLOBAL_IDENTITIES[kind], snap = await this.get(this.database.collection(spec.collection).doc(id));
    return snap.exists ? decodeGlobal(snap.data(), spec.kind, id) : null;
  }
  getGlobalTruck(id: string) { return this.global('TRUCK', id); }
  getGlobalCarrier(id: string) { return this.global('CARRIER', id); }
  getGlobalDriver(id: string) { return this.global('DRIVER', id); }
  getGlobalMaterial(id: string) { return this.global('MATERIAL', id); }
}
