import { Timestamp } from 'firebase/firestore';
import { BaseAuditedEntity } from './common';

/**
 * ============================================================================
 * PHASE 6 — UNIT 1: GLOBAL IDENTITY CONTRACTS
 * ============================================================================
 * Canonical root global identity entities for Driver, Truck, Carrier, and Material.
 * 
 * CORE CONTRACT:
 * ONE REAL ENTITY -> ONE GLOBAL SYSTEM IDENTITY -> MANY PROJECT MEMBERSHIPS
 * 
 * Strict architectural boundaries:
 * - System IDs (driverId, truckId, carrierId, materialId) are OPAQUE and system-generated.
 * - Natural identity keys (nationalId, normalizedPlate, commercialRegistrationNo, code)
 *   are stored as separate attributes and NEVER concatenated or derived directly as the primary ID.
 * - Global entities do NOT own projectId, project-specific assignments, or project pricing.
 */

// ==========================================
// 1. GLOBAL DRIVER ENTITY
// ==========================================
export interface GlobalDriverEntity extends BaseAuditedEntity {
  /** Opaque immutable system primary key (e.g. DRV-7k9p2m4x) */
  driverId: string;
  /** Normalized Saudi National ID or Iqama (10 digits) - Protected Natural Key */
  nationalId: string;
  /** Canonical full Arabic name */
  fullNameAr: string;
  /** Normalized mobile contact (+9665xxxxxxxx or 05xxxxxxxx) - Mutable profile */
  phone: string;
  /** Official driver license number */
  licenseNumber?: string;
  /** Driver license expiration */
  licenseValidUntil?: Timestamp | Date;
  /** Driver nationality (e.g. SA, EG, PK, IN) */
  nationality?: string;
  /** Global status across all fleet operations */
  status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
}

// ==========================================
// 2. GLOBAL TRUCK ENTITY
// ==========================================
export type GlobalTruckType = 'TIPPER_32M3' | 'TRAILER_24M' | 'FLATBED' | 'DUMPER';

export interface GlobalTruckEntity extends BaseAuditedEntity {
  /** Opaque immutable system primary key (e.g. TRK-3v8n5x2q) */
  truckId: string;
  /** Display plate as registered */
  plate: string;
  /** Normalized alphanumeric plate string (e.g. 'ا ب ج 1234') - Natural Key */
  normalizedPlate: string;
  /** Vehicle Identification Number / Chassis number (optional secondary verification) */
  vin?: string;
  /** Physical vehicle body classification */
  truckType?: GlobalTruckType;
  /** Calibrated base empty tare weight in kilograms */
  tareWeightKg?: number;
  /** Maximum legal manufacturer gross vehicle weight in kilograms */
  maxGrossWeightKg?: number;
  /** Legal maximum payload limit in kilograms (maxGrossWeight - tareWeight) */
  legalPayloadLimitKg?: number;
  /** Primary owning registered carrier ID (global master reference) */
  primaryCarrierId?: string;
  /** Periodic motor vehicle inspection (MVPI) validity */
  mvpiValidUntil?: Timestamp | Date;
  /** Vehicle insurance validity */
  insuranceValidUntil?: Timestamp | Date;
  /** Global operational fleet status */
  status: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE';
}

// ==========================================
// 3. GLOBAL CARRIER ENTITY
// ==========================================
export interface GlobalCarrierEntity extends BaseAuditedEntity {
  /** Opaque immutable system primary key (e.g. CAR-9d4m1z7p) */
  carrierId: string;
  /** Canonical registered commercial name in Arabic */
  nameAr: string;
  /** Commercial Registration number (10 digits) - Natural Key */
  commercialRegistrationNo: string;
  /** Transport General Authority (TGA) enterprise license number */
  transportLicenseNo?: string;
  /** Tax / VAT registration identification number (15 digits) */
  vatNumber?: string;
  /** Corporate official point of contact */
  contactPerson?: {
    name: string;
    phone: string;
    email: string;
  };
  /** Global corporate operational status */
  status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
}

// ==========================================
// 4. GLOBAL MATERIAL ENTITY
// ==========================================
export type GlobalMaterialUom = 'TON' | 'M3' | 'TRIP';

export interface GlobalMaterialEntity extends BaseAuditedEntity {
  /** Opaque immutable system primary key (e.g. MAT-5c2w8y1k) */
  materialId: string;
  /** Canonical standard material code (e.g. 'AGG_3_4', 'SUB_BASE') - Natural Key */
  code: string;
  /** Canonical display name in Arabic */
  nameAr: string;
  /** Canonical display name in English */
  nameEn?: string;
  /** Standard catalog unit of measure */
  unitOfMeasure: GlobalMaterialUom;
  /** Nominal material physical density (ton per cubic meter) */
  standardDensityTonPerM3?: number;
  /** Quality specification: maximum allowable moisture percentage */
  maxAllowableMoisturePercent?: number;
  /** Global catalog status */
  status: 'ACTIVE' | 'INACTIVE';
}

// ==========================================
// 5. NATURAL IDENTITY LOOKUP RECORD
// ==========================================
export interface NaturalIdentityLookup {
  entityType: 'DRIVER' | 'TRUCK' | 'CARRIER' | 'MATERIAL';
  naturalKeyHash: string;
  systemId: string;
  createdAt: Timestamp | Date;
  createdBy: string;
}
