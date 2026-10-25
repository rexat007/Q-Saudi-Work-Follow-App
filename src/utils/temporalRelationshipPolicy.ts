import { decodeScopedProjection, PersistenceBoundaryError, persistenceTime } from './persistenceBoundary';
import { validGlobalId } from './globalIdentityPolicy';
export type TemporalKind = 'ASSIGNMENT' | 'ALLOCATION';
export const TEMPORAL = {
  ASSIGNMENT: { collection: 'driver_truck_assignments', id: 'assignmentId', fields: ['driverId', 'truckId'] },
  ALLOCATION: { collection: 'truck_material_allocations', id: 'allocationId', fields: ['truckId', 'materialId'] },
} as const;
/** Current truth only; historical trip-time reconstruction remains Phase 10. */
export function isCurrentTemporal(record: any, at: Date): boolean {
  try { return record?.status === 'ACTIVE' && record.effectiveTo === null && (persistenceTime(record.effectiveFrom, 'effectiveFrom', 'date') as Date) <= at; }
  catch { return false; }
}
export function decodeTemporal(kind: TemporalKind, raw: unknown, id: string, projectId: string) {
  const spec = TEMPORAL[kind];
  const value = decodeScopedProjection<any>(raw, spec.id, id, projectId, ['ACTIVE', 'CLOSED']);
  if (!validGlobalId(id) || !['ACTIVE', 'CLOSED'].includes(value.status) || spec.fields.some(field => !validGlobalId(value[field]))) throw new PersistenceBoundaryError('temporalIdentity');
  const from = persistenceTime(value.effectiveFrom, 'effectiveFrom', 'date') as Date;
  if (value.status === 'ACTIVE' ? value.effectiveTo !== null : value.effectiveTo == null || (persistenceTime(value.effectiveTo, 'effectiveTo', 'date') as Date) < from) throw new PersistenceBoundaryError('effectiveTo');
  return value;
}
export function assignmentSlotsAgree(record: any, driverSlot: any, truckSlot: any) {
  return Boolean(record && validGlobalId(record.assignmentId) && driverSlot?.assignmentId === record.assignmentId && truckSlot?.assignmentId === record.assignmentId);
}
