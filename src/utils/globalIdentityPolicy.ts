import { decodeGlobal } from './persistenceBoundary';
import { normalizeIdNumber, normalizePlate, normalizeCode } from './normalization';
export type GlobalKind = 'DRIVER' | 'TRUCK' | 'CARRIER' | 'MATERIAL';
export const GLOBAL_IDENTITIES = {
  DRIVER: { collection: 'drivers', kind: 'driver', id: 'driverId', natural: 'nationalId', statuses: ['ACTIVE', 'SUSPENDED', 'INACTIVE'] },
  TRUCK: { collection: 'trucks', kind: 'truck', id: 'truckId', natural: 'normalizedPlate', statuses: ['ACTIVE', 'MAINTENANCE', 'INACTIVE'] },
  CARRIER: { collection: 'carriers', kind: 'carrier', id: 'carrierId', natural: 'commercialRegistrationNo', statuses: ['ACTIVE', 'SUSPENDED', 'INACTIVE'] },
  MATERIAL: { collection: 'materials', kind: 'material', id: 'materialId', natural: 'code', statuses: ['ACTIVE', 'INACTIVE'] },
} as const;
export class GlobalIdentityError extends Error {
  constructor(public code: string, detail = '', public status = 409) { super(`${code}${detail ? ': ' + detail : ''}`); }
}
export const validGlobalId = (value: unknown): value is string => typeof value === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(value) && value !== 'ALL';
export function normalizeNaturalKey(kind: GlobalKind, raw: unknown): string {
  if (typeof raw !== 'string' || !Object.hasOwn(GLOBAL_IDENTITIES, kind)) throw new GlobalIdentityError('INVALID_NATURAL_KEY');
  const key = kind === 'DRIVER' ? normalizeIdNumber(raw) : kind === 'TRUCK' ? normalizePlate(raw) : kind === 'CARRIER' ? raw.replace(/[^0-9]/g, '') : normalizeCode(raw);
  if (!key || (kind === 'DRIVER' && !/^[12][0-9]{9}$/.test(key)) || (kind === 'CARRIER' && !/^[0-9]{10}$/.test(key)) || (kind === 'MATERIAL' && key.length < 2) || new TextEncoder().encode(key).length > 700) throw new GlobalIdentityError('INVALID_NATURAL_KEY');
  return key;
}
/** Injective UTF-8 hexadecimal codec. Security never depends on token secrecy. */
export function computeNaturalKeyToken(kind: GlobalKind, raw: string): string {
  const bytes = new TextEncoder().encode(normalizeNaturalKey(kind, raw));
  return `${kind}_V2_${Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')}`;
}
function base64(bytes: Uint8Array): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'; let result = '';
  for (let i = 0;i < bytes.length;i += 3) { const n = (bytes[i] << 16) | ((bytes[i + 1] || 0) << 8) | (bytes[i + 2] || 0); result += alphabet[(n >>> 18) & 63] + alphabet[(n >>> 12) & 63] + (i + 1 < bytes.length ? alphabet[(n >>> 6) & 63] : '=') + (i + 2 < bytes.length ? alphabet[n & 63] : '='); }
  return result.replace(/[/+=]/g, '_');
}
/** Read-only historical compatibility. Only V2 is written/reserved by current commands. */
export function legacyNaturalKeyTokens(kind: GlobalKind, raw: string): string[] {
  let key = normalizeNaturalKey(kind, raw); if (kind === 'TRUCK') key = key.replace(/\s+/g, '_');
  return [...new Set([`${kind}_${base64(new TextEncoder().encode(key))}`, `${kind}_${base64(new TextEncoder().encode(encodeURIComponent(key)))}`, `${kind}_${encodeURIComponent(key).replace(/%/g, '_')}`])];
}
export function evaluateGlobalEligibility(kind: GlobalKind, entity: { status?: unknown } | null | undefined) {
  const valid = Boolean(entity && Object.hasOwn(GLOBAL_IDENTITIES, kind) && (GLOBAL_IDENTITIES[kind].statuses as readonly unknown[]).includes(entity.status));
  const eligible = valid && entity!.status === 'ACTIVE';
  return { CAN_ENROLL: eligible, CAN_REACTIVATE_MEMBERSHIP: eligible, CAN_USE_OPERATIONALLY: eligible, MEMBERSHIP_RECORD_MAY_REMAIN: valid };
}
export function assertCanEnroll(kind: GlobalKind, entity: { status?: unknown } | null | undefined) {
  if (!evaluateGlobalEligibility(kind, entity).CAN_ENROLL) throw new GlobalIdentityError('GLOBAL_ENTITY_INELIGIBLE', kind);
}
export function assertCanReactivateMembership(kind: GlobalKind, entity: { status?: unknown } | null | undefined) {
  if (!evaluateGlobalEligibility(kind, entity).CAN_REACTIVATE_MEMBERSHIP) throw new GlobalIdentityError('GLOBAL_ENTITY_INELIGIBLE', kind);
}
export function assertOperationallyEligible(kind: GlobalKind, entity: { status?: unknown } | null | undefined) {
  if (!evaluateGlobalEligibility(kind, entity).CAN_USE_OPERATIONALLY) throw new GlobalIdentityError('GLOBAL_ENTITY_INELIGIBLE', kind);
}

/** Critical persisted identity/status/key/time representation shared by both transports. */
export function decodeGlobalIdentity(kind: GlobalKind, raw: unknown, id: string): Record<string, any> {
  const spec = GLOBAL_IDENTITIES[kind];
  if (!validGlobalId(id)) throw new GlobalIdentityError('IDENTITY_LOOKUP_INTEGRITY_ERROR', 'invalid target ID');
  const value = decodeGlobal<Record<string, any>>(raw, spec.kind, id);
  if (!(spec.statuses as readonly unknown[]).includes(value.status)) throw new GlobalIdentityError('PERSISTENCE_BOUNDARY_INVALID', 'status');
  normalizeNaturalKey(kind, value[spec.natural]);
  return value;
}
