import crypto from 'node:crypto';
import { normalizeArabicText, normalizeIdNumber, normalizePhone, normalizePlate } from '../utils/normalization';
import { decodeAuthoritativeGlobal } from './globalIdentityAuthority.server';
/** The same opaque IDs and canonical creation records used by shared intake and setup. */
export const newFleetIdentityId = (kind: 'DRIVER' | 'TRUCK') => `${kind === 'DRIVER' ? 'DRV' : 'TRK'}-${crypto.randomBytes(16).toString('hex')}`;
export function driverCreationRecord(id: string, plan: {driverName: string; residencyId: string; phone?: string}, actor: string, at: string) {
  const record = {driverId:id,nationalId:normalizeIdNumber(plan.residencyId),fullNameAr:normalizeArabicText(plan.driverName),phone:normalizePhone(plan.phone || ''),status:'ACTIVE',createdAt:at,createdBy:actor,updatedAt:at,updatedBy:actor};
  decodeAuthoritativeGlobal('DRIVER',record,id); return record;
}
export function truckCreationRecord(id: string, plan: {plateNumber: string; truckType?: string; tareWeightKg?: number; maxGrossWeightKg?: number}, actor: string, at: string, coerce = true) {
  const record: Record<string, any> = {truckId:id,plate:plan.plateNumber.trim(),normalizedPlate:normalizePlate(plan.plateNumber),status:'ACTIVE',createdAt:at,createdBy:actor,updatedAt:at,updatedBy:actor};
  if (plan.truckType?.trim()) record.truckType=plan.truckType.trim();
  const tare = coerce ? Number(plan.tareWeightKg) : plan.tareWeightKg, gross = coerce ? Number(plan.maxGrossWeightKg) : plan.maxGrossWeightKg;
  if(typeof tare==='number' && tare>0) record.tareWeightKg=tare;
  if(typeof gross==='number' && gross>0) record.maxGrossWeightKg=gross;
  if(typeof tare==='number' && typeof gross==='number' && gross>tare && (coerce || tare>0 && gross>0)) record.legalPayloadLimitKg=gross-tare;
  decodeAuthoritativeGlobal('TRUCK',record,id); return record;
}
