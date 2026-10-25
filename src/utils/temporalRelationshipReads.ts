import { GlobalIdentityError, validGlobalId } from './globalIdentityPolicy';
import { TEMPORAL, decodeTemporal, isCurrentTemporal, assignmentSlotsAgree, type TemporalKind } from './temporalRelationshipPolicy';
const integrity = (kind: TemporalKind): never => { throw new GlobalIdentityError(kind === 'ASSIGNMENT' ? 'ASSIGNMENT_POINTER_INTEGRITY_ERROR' : 'ALLOCATION_POINTER_CORRUPTION'); };
const base = (db: any, p: string) => db.collection('projects').doc(p);
function slotValue(snapshot: any, projectId: string, ownerField: string, ownerId: string, key: string, kind: TemporalKind) {
  if (!snapshot.exists) return null;
  const data = snapshot.data();
  if (!validGlobalId(data?.[key]) || (data.projectId !== undefined && data.projectId !== projectId) || (data[ownerField] !== undefined && data[ownerField] !== ownerId)) integrity(kind);
  return data;
}
function checkedTemporal(kind: TemporalKind, raw: unknown, id: string, p: string) {
  try { return decodeTemporal(kind, raw, id, p); } catch { return integrity(kind); }
}
async function activeHistory(tx: any, db: any, p: string, kind: TemporalKind, field: string, id: string, at: Date) {
  const spec = TEMPORAL[kind], snap = await tx.get(base(db, p).collection(spec.collection).where(field, '==', id));
  const result = snap.docs.filter((d: any) => d.data()?.status === 'ACTIVE').map((d: any) => checkedTemporal(kind, d.data(), d.id, p));
  if (result.length > 1 || result.some((r: any) => !isCurrentTemporal(r, at))) integrity(kind);
  return result;
}
/** Validate slots AND history, including the displaced counterpart. Never repair in a normal command. */
export async function readCurrentAssignment(tx: any, db: any, p: string, field: 'driverId' | 'truckId', id: string, at: Date) {
  const root = base(db, p), collection = field === 'driverId' ? 'driver_active_assignments' : 'truck_active_assignments';
  const slot = slotValue(await tx.get(root.collection(collection).doc(id)), p, field, id, 'assignmentId', 'ASSIGNMENT');
  const history = await activeHistory(tx, db, p, 'ASSIGNMENT', field, id, at);
  if (!slot) { if (history.length) integrity('ASSIGNMENT'); return null; }
  const snap = await tx.get(root.collection('driver_truck_assignments').doc(slot.assignmentId));
  if (!snap.exists) integrity('ASSIGNMENT');
  const record = checkedTemporal('ASSIGNMENT', snap.data(), slot.assignmentId, p);
  if (record[field] !== id || !isCurrentTemporal(record, at) || history.length !== 1 || history[0].assignmentId !== record.assignmentId) integrity('ASSIGNMENT');
  const driverSlot = slotValue(await tx.get(root.collection('driver_active_assignments').doc(record.driverId)), p, 'driverId', record.driverId, 'assignmentId', 'ASSIGNMENT');
  const truckSlot = slotValue(await tx.get(root.collection('truck_active_assignments').doc(record.truckId)), p, 'truckId', record.truckId, 'assignmentId', 'ASSIGNMENT');
  if (!assignmentSlotsAgree(record, driverSlot, truckSlot)) integrity('ASSIGNMENT');
  const otherField = field === 'driverId' ? 'truckId' : 'driverId';
  const other = await activeHistory(tx, db, p, 'ASSIGNMENT', otherField, record[otherField], at);
  if (other.length !== 1 || other[0].assignmentId !== record.assignmentId) integrity('ASSIGNMENT');
  return record;
}
export async function readCurrentAllocation(tx: any, db: any, p: string, truckId: string, at: Date) {
  const root = base(db, p), slot = slotValue(await tx.get(root.collection('truck_active_material_allocations').doc(truckId)), p, 'truckId', truckId, 'allocationId', 'ALLOCATION');
  const history = await activeHistory(tx, db, p, 'ALLOCATION', 'truckId', truckId, at);
  if (!slot) { if (history.length) integrity('ALLOCATION'); return null; }
  const snap = await tx.get(root.collection('truck_material_allocations').doc(slot.allocationId));
  if (!snap.exists) integrity('ALLOCATION');
  const record = checkedTemporal('ALLOCATION', snap.data(), slot.allocationId, p);
  if (record.truckId !== truckId || !isCurrentTemporal(record, at) || history.length !== 1 || history[0].allocationId !== record.allocationId) integrity('ALLOCATION');
  return record;
}
