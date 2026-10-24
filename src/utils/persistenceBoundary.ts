import type { UserRole } from '../types/common';
import { ALLOWED_TRIP_TRANSITIONS } from '../validators/trip.validator';
import type { ProjectEntity } from '../types/entities';

export class PersistenceBoundaryError extends Error {
  readonly code = 'PERSISTENCE_BOUNDARY_INVALID';
  constructor(readonly field: string) { super(`PERSISTENCE_BOUNDARY_INVALID:${field}`); }
}
const roles = ['PROJECT_ADMIN', 'SUPER_ADMIN', 'SITE_SUPERVISOR', 'SUPERVISOR', 'DISPATCHER', 'FINANCE_AUDITOR', 'SCALE_OPERATOR', 'DRIVER', 'VIEWER'] satisfies UserRole[];

export function persistenceTime(value: unknown, field: string, output: 'date' | 'iso'): Date | string {
  let date: Date;
  if (value instanceof Date) date = new Date(value.getTime());
  else if (value && typeof value === 'object' && typeof (value as any).toDate === 'function') {
    let result: unknown;
    try { result = (value as any).toDate(); } catch { throw new PersistenceBoundaryError(field); }
    if (!(result instanceof Date)) throw new PersistenceBoundaryError(field);
    date = new Date(result.getTime());
  } else if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value)) {
    const [year, month, day] = value.slice(0, 10).split('-').map(Number);
    const end = new Date(0); end.setUTCFullYear(year, month, 0);
    if (month < 1 || month > 12 || day < 1 || day > end.getUTCDate()) throw new PersistenceBoundaryError(field);
    date = new Date(value);
  } else throw new PersistenceBoundaryError(field);
  if (!Number.isFinite(date.getTime())) throw new PersistenceBoundaryError(field);
  return output === 'iso' ? date.toISOString() : date;
}

type Boundary = {
  id?: [field: string, documentId: string];
  projectId?: string;
  required?: string[];
  arrays?: string[];
  enums?: Record<string, readonly string[]>;
  times?: Record<string, 'date' | 'iso'>;
};

// Critical representation validation, not a replacement for owning business validators.
export function decodePersistence<T>(raw: unknown, boundary: Boundary = {}): T {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new PersistenceBoundaryError('document');
  const prototype = Object.getPrototypeOf(raw);
  if (prototype && prototype.constructor?.name !== 'Object') throw new PersistenceBoundaryError('document');
  const data = { ...raw } as Record<string, any>;
  const string = (field: string) => {
    if (typeof data[field] !== 'string' || !data[field].trim()) throw new PersistenceBoundaryError(field);
  };
  for (const field of boundary.required || []) string(field);
  if (boundary.id) {
    const [field, id] = boundary.id;
    string(field);
    if (data[field] !== id) throw new PersistenceBoundaryError(field);
  }
  if (boundary.projectId !== undefined) {
    if (typeof data.projectId !== 'string' || data.projectId !== boundary.projectId) throw new PersistenceBoundaryError('projectId');
  }
  for (const field of boundary.arrays || []) {
    if (!Array.isArray(data[field]) || data[field].some((value: unknown) => typeof value !== 'string' || !value.trim())) throw new PersistenceBoundaryError(field);
  }
  for (const [field, values] of Object.entries(boundary.enums || {})) {
    if (data[field] !== undefined && !values.includes(data[field])) throw new PersistenceBoundaryError(field);
  }
  const times = boundary.times || { createdAt: 'date', updatedAt: 'date' };
  for (const [field, output] of Object.entries(times)) {
    if (data[field] !== undefined && data[field] !== null) data[field] = persistenceTime(data[field], field, output);
    else if (data[field] === null && (field === 'createdAt' || field === 'updatedAt')) throw new PersistenceBoundaryError(field);
  }
  return data as T;
}

export function decodeProject<T>(raw: unknown, id: string): T {
  return decodePersistence<T>(raw, { id: ['projectId', id], enums: { status: ['DRAFT', 'SETUP', 'READY_FOR_REVIEW', 'APPROVED', 'ACTIVE', 'SUSPENDED', 'ARCHIVED', 'PLANNING'] satisfies ProjectEntity['status'][] } });
}
export function decodeUser<T>(raw: unknown, id: string): T {
  const data = decodePersistence<Record<string, any>>(raw, { id: ['userId', id], required: ['role'], arrays: ['assignedProjectIds'], enums: { role: roles, requestedRole: roles, status: ['PENDING_APPROVAL', 'ACTIVE', 'REJECTED', 'SUSPENDED'] } });
  if (data.isActive !== undefined && typeof data.isActive !== 'boolean') throw new PersistenceBoundaryError('isActive');
  return data as T;
}
export function decodeTrip<T>(raw: unknown, id: string, projectId: string): T {
  return decodePersistence<T>(raw, { id: ['tripId', id], projectId, enums: { status: Object.keys(ALLOWED_TRIP_TRANSITIONS) } });
}
export function decodePricing<T>(raw: unknown, id: string, projectId: string): T {
  return decodePersistence<T>(raw, { id: ['pricingRuleId', id], projectId, enums: { pricingModel: ['PER_TON', 'PER_TRIP', 'PER_KM', 'FLAT_RATE'], status: ['ACTIVE', 'INACTIVE'] } });
}

export function decodeMigration<T>(raw: unknown, targetFolderId: string): T {
  const data = decodePersistence<Record<string, any>>(raw, {
    id: ['targetFolderId', targetFolderId], required: ['migrationJobId', 'projectId', 'status', 'sourceProvider', 'targetProvider'], arrays: ['copiedFileIds'],
    enums: { sourceProvider: ['MY_DRIVE', 'SHARED_DRIVE'], targetProvider: ['MY_DRIVE', 'SHARED_DRIVE'], status: ['IDLE', 'REQUESTED', 'VALIDATING', 'COPYING', 'VERIFYING', 'READY_TO_SWITCH', 'SWITCHED', 'FAILED', 'ROLLBACK_REQUIRED'] },
    times: { startedAt: 'iso', updatedAt: 'iso' },
  });
  if (typeof data.startedAt !== 'string') throw new PersistenceBoundaryError('startedAt');
  if (!data.fileIdMap || typeof data.fileIdMap !== 'object' || Array.isArray(data.fileIdMap) || (Object.getPrototypeOf(data.fileIdMap)?.constructor?.name !== 'Object' && Object.getPrototypeOf(data.fileIdMap) !== null) || Object.values(data.fileIdMap).some(v => typeof v !== 'string' || !v.trim())) throw new PersistenceBoundaryError('fileIdMap');
  return data as T;
}

export function decodeGlobal<T>(raw: unknown, kind: 'driver' | 'truck' | 'carrier' | 'material', id: string): T {
  return decodePersistence<T>(raw, {
    id: [`${kind}Id`, id],
    enums: {
      status: kind === 'truck' ? ['ACTIVE', 'MAINTENANCE', 'INACTIVE'] : kind === 'material' ? ['ACTIVE', 'INACTIVE'] : ['ACTIVE', 'SUSPENDED', 'INACTIVE'],
      ...(kind === 'truck' ? { truckType: ['TIPPER_32M3', 'TRAILER_24M', 'FLATBED', 'DUMPER'] } : {}),
      ...(kind === 'material' ? { unitOfMeasure: ['TON', 'M3', 'TRIP'] } : {}),
    },
    times: { createdAt: 'date', updatedAt: 'date', licenseValidUntil: 'date', mvpiValidUntil: 'date', insuranceValidUntil: 'date' },
  });
}

export function decodeRelationship<T>(raw: unknown, idField: string, id: string, projectId: string, status: readonly string[]): T {
  return decodePersistence<T>(raw, {
    id: [idField, id], projectId, enums: { status },
    times: { createdAt: 'date', updatedAt: 'date', effectiveFrom: 'iso', effectiveTo: 'iso' },
  });
}

// Existing read projections may omit redundant projectId; the Firestore path supplies scope.
// When the payload carries it, it must agree. No missing identity or historical time is invented.
export function decodeScopedProjection<T>(raw: unknown, idField: string, id: string, projectId: string, status?: readonly string[]): T {
  const hasProject = raw && typeof raw === 'object' && Object.prototype.hasOwnProperty.call(raw, 'projectId');
  return decodePersistence<T>(raw, {
    id: [idField, id], ...(hasProject ? { projectId } : {}), enums: status ? { status } : {},
    times: idField === 'assignmentId' || idField === 'allocationId'
      ? { createdAt: 'date', updatedAt: 'date', effectiveFrom: 'iso', effectiveTo: 'iso' }
      : { createdAt: 'date', updatedAt: 'date' },
  });
}
