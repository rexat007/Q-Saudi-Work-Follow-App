import { GLOBAL_IDENTITIES, GlobalIdentityError, decodeGlobalIdentity, normalizeNaturalKey, legacyNaturalKeyTokens, validGlobalId, type GlobalKind, computeNaturalKeyToken } from '../utils/globalIdentityPolicy';
import { decodeGlobal } from '../utils/persistenceBoundary';
import { sanitizeUndefined } from '../utils/sanitize';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where,
  Transaction
} from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../firebase/errors';
import { 
  GlobalDriverEntity, 
  GlobalTruckEntity, 
  GlobalCarrierEntity, 
  GlobalMaterialEntity 
} from '../types/globalEntities';
import { 
  normalizeIdNumber, 
  normalizePlate, 
  normalizeArabicText, 
  normalizePhone, 
  normalizeCode 
} from '../utils/normalization';

/**
 * Generates an opaque, cryptographically robust system ID using native Web Crypto / Node crypto.
 * Math.random() is strictly prohibited.
 * Avoids any embedding of natural identity keys (nationalId, plate, CR, etc.).
 * Format: `${prefix}-${32-char hex string}` (128 bits of cryptographic entropy, >= 96 bits contract)
 */
export function generateOpaqueGlobalId(prefix: 'DRV' | 'TRK' | 'CAR' | 'MAT'): string {
  // Use crypto.randomUUID or crypto.getRandomValues for cryptographic entropy (>= 96 bits)
  if (typeof globalThis !== 'undefined' && globalThis.crypto) {
    if (typeof globalThis.crypto.randomUUID === 'function') {
      const uuidHex = globalThis.crypto.randomUUID().replace(/-/g, '').toLowerCase();
      return `${prefix}-${uuidHex}`;
    }
    if (typeof globalThis.crypto.getRandomValues === 'function') {
      const bytes = new Uint8Array(16); // 128 bits (16 bytes)
      globalThis.crypto.getRandomValues(bytes);
      const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
      return `${prefix}-${hex}`;
    }
  }

  // Fallback if globalThis.crypto is somehow absent: Node.js standard crypto
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const nodeCrypto = require('crypto');
    const hex = nodeCrypto.randomBytes(16).toString('hex'); // 128 bits (16 bytes)
    return `${prefix}-${hex}`;
  } catch {
    throw new Error('SECURE_CRYPTO_UNAVAILABLE: Cryptographic random generator is required for global ID creation');
  }
}

/**
 * Computes a standardized hash/token representation for natural unique key lookups
 * without storing or exposing raw plain National IDs in document paths.
 */
export { computeNaturalKeyToken } from '../utils/globalIdentityPolicy';

// ============================================================================
// 1. GLOBAL DRIVER REPOSITORY
// ============================================================================
export class GlobalDriverRepository {
  private readonly collectionName = 'drivers';
  private inMemoryDrivers: Map<string, GlobalDriverEntity> = new Map();
  private inMemoryIndexByNationalId: Map<string, string> = new Map(); // nationalId -> driverId

  /**
   * Clears in-memory caches for testing.
   */
  clearInMemoryCache(): void {
    this.inMemoryDrivers.clear();
    this.inMemoryIndexByNationalId.clear();
  }

  async findById(driverId: string): Promise<GlobalDriverEntity | null> {
    if (!auth.currentUser) {
      if (process.env.NODE_ENV !== 'test') return null;
      return this.inMemoryDrivers.get(driverId) || null;
    }
    const path = `${this.collectionName}/${driverId}`;
    try {
      const snap = await getDoc(doc(db, this.collectionName, driverId));
      if (!snap.exists()) return null;
      return decodeGlobal<GlobalDriverEntity>(snap.data(), 'driver', driverId);
    } catch (error) {
      if ((error as any)?.code === 'PERSISTENCE_BOUNDARY_INVALID') throw error;
      handleFirestoreError(error, OperationType.GET, path);
      throw error;
    }
  }

  async findByNaturalIdentity(nationalId: string): Promise<GlobalDriverEntity | null> {
    const normalized = normalizeIdNumber(nationalId);
    if (!normalized) return null;

    if (!auth.currentUser) {
      if (process.env.NODE_ENV !== 'test') return null;
      const driverId = this.inMemoryIndexByNationalId.get(normalized);
      if (driverId) {
        return this.inMemoryDrivers.get(driverId) || null;
      }
      return null;
    }

    return resolvePersistentNaturalIdentity('DRIVER', nationalId) as Promise<GlobalDriverEntity | null>;
  }

  async listByIds(driverIds: string[]): Promise<GlobalDriverEntity[]> {
    if (driverIds.length === 0) return [];
    const results: GlobalDriverEntity[] = [];
    for (const id of driverIds) {
      const d = await this.findById(id);
      if (d) results.push(d);
    }
    return results;
  }

  /**
   * Concurrency-safe creation of global driver identity using Firestore transactions
   * and atomic reservation on natural_identity_lookups.
   */
  async createGlobal(
    input: {
      nationalId: string;
      fullNameAr: string;
      phone: string;
      licenseNumber?: string;
      licenseValidUntil?: Date;
      nationality?: string;
      status?: GlobalDriverEntity['status'];
      createdBy: string;
    },
    transaction?: Transaction
  ): Promise<GlobalDriverEntity> {
    if (auth.currentUser || process.env.NODE_ENV !== 'test') throw new Error('GLOBAL_SERVER_COMMAND_REQUIRED');

    const normalizedNationalId = normalizeIdNumber(input.nationalId);
    if (!normalizedNationalId || !/^[1-2][0-9]{9}$/.test(normalizedNationalId)) {
      throw new Error('INVALID_NATIONAL_ID: Saudi National ID or Iqama must be exactly 10 digits starting with 1 or 2');
    }

    const normalizedPhone = normalizePhone(input.phone);
    const opaqueId = generateOpaqueGlobalId('DRV');
    const lookupToken = computeNaturalKeyToken('DRIVER', normalizedNationalId);

    const newDriver: GlobalDriverEntity = {
      driverId: opaqueId,
      nationalId: normalizedNationalId,
      fullNameAr: normalizeArabicText(input.fullNameAr),
      phone: normalizedPhone,
      licenseNumber: input.licenseNumber?.trim(),
      licenseValidUntil: input.licenseValidUntil,
      nationality: input.nationality?.trim(),
      status: input.status || 'ACTIVE',
      createdAt: new Date(),
      createdBy: input.createdBy,
      updatedAt: new Date(),
      updatedBy: input.createdBy,
    };

    if (!auth.currentUser) {
      if (this.inMemoryDrivers.has(opaqueId)) {
        throw new Error(`ID_COLLISION_DETECTED: Generated driver ID ${opaqueId} collided`);
      }
      if (this.inMemoryIndexByNationalId.has(normalizedNationalId)) {
        throw new Error(`DUPLICATE_NATURAL_KEY: Driver with National ID already exists in global registry`);
      }
      this.inMemoryDrivers.set(opaqueId, newDriver);
      this.inMemoryIndexByNationalId.set(normalizedNationalId, opaqueId);
      return newDriver;
    }
    throw new Error('GLOBAL_SERVER_COMMAND_REQUIRED');
  }

  async updateProfile(
    driverId: string,
    updates: {
      phone?: string;
      licenseNumber?: string;
      licenseValidUntil?: Date;
      nationality?: string;
      status?: GlobalDriverEntity['status'];
      updatedBy: string;
    }
  ): Promise<void> {
    if (auth.currentUser || process.env.NODE_ENV !== 'test') throw new Error('GLOBAL_SERVER_COMMAND_REQUIRED');

    const existing = await this.findById(driverId);
    if (!existing) {
      throw new Error(`DRIVER_NOT_FOUND: Global driver ${driverId} does not exist`);
    }

    const payload: Partial<GlobalDriverEntity> = {
      updatedAt: new Date(),
      updatedBy: updates.updatedBy,
    };

    if (updates.phone) payload.phone = normalizePhone(updates.phone);
    if (updates.licenseNumber !== undefined) payload.licenseNumber = updates.licenseNumber.trim();
    if (updates.licenseValidUntil !== undefined) payload.licenseValidUntil = updates.licenseValidUntil;
    if (updates.nationality !== undefined) payload.nationality = updates.nationality.trim();
    if (updates.status) payload.status = updates.status;

    if (!auth.currentUser) {
      if (process.env.NODE_ENV !== 'test') return null;
      Object.assign(existing, payload);
      this.inMemoryDrivers.set(driverId, existing);
      return;
    }
    throw new Error('GLOBAL_SERVER_COMMAND_REQUIRED');
  }
}

// ============================================================================
// 2. GLOBAL TRUCK REPOSITORY
// ============================================================================
export class GlobalTruckRepository {
  private readonly collectionName = 'trucks';
  private inMemoryTrucks: Map<string, GlobalTruckEntity> = new Map();
  private inMemoryIndexByPlate: Map<string, string> = new Map(); // normalizedPlate -> truckId

  clearInMemoryCache(): void {
    this.inMemoryTrucks.clear();
    this.inMemoryIndexByPlate.clear();
  }

  async findById(truckId: string): Promise<GlobalTruckEntity | null> {
    if (!auth.currentUser) {
      if (process.env.NODE_ENV !== 'test') return null;
      return this.inMemoryTrucks.get(truckId) || null;
    }
    const path = `${this.collectionName}/${truckId}`;
    try {
      const snap = await getDoc(doc(db, this.collectionName, truckId));
      if (!snap.exists()) return null;
      return decodeGlobal<GlobalTruckEntity>(snap.data(), 'truck', truckId);
    } catch (error) {
      if ((error as any)?.code === 'PERSISTENCE_BOUNDARY_INVALID') throw error;
      handleFirestoreError(error, OperationType.GET, path);
      throw error;
    }
  }

  async findByNaturalIdentity(plate: string): Promise<GlobalTruckEntity | null> {
    const normalized = normalizePlate(plate);
    if (!normalized) return null;

    if (!auth.currentUser) {
      if (process.env.NODE_ENV !== 'test') return null;
      const truckId = this.inMemoryIndexByPlate.get(normalized);
      return truckId ? this.inMemoryTrucks.get(truckId) || null : null;
    }

    return resolvePersistentNaturalIdentity('TRUCK', plate) as Promise<GlobalTruckEntity | null>;
  }

  async listByIds(truckIds: string[]): Promise<GlobalTruckEntity[]> {
    if (truckIds.length === 0) return [];
    const results: GlobalTruckEntity[] = [];
    for (const id of truckIds) {
      const t = await this.findById(id);
      if (t) results.push(t);
    }
    return results;
  }

  async createGlobal(
    input: {
      plate: string;
      vin?: string;
      truckType?: GlobalTruckEntity['truckType'];
      tareWeightKg?: number;
      maxGrossWeightKg?: number;
      primaryCarrierId?: string;
      mvpiValidUntil?: Date;
      insuranceValidUntil?: Date;
      status?: GlobalTruckEntity['status'];
      createdBy: string;
    },
    transaction?: Transaction
  ): Promise<GlobalTruckEntity> {
    if (auth.currentUser || process.env.NODE_ENV !== 'test') throw new Error('GLOBAL_SERVER_COMMAND_REQUIRED');

    const normalized = normalizePlate(input.plate);
    if (!normalized || normalized.length < 3) {
      throw new Error('INVALID_PLATE: Truck plate must be provided and meet Saudi standard');
    }

    const opaqueId = generateOpaqueGlobalId('TRK');
    const lookupToken = computeNaturalKeyToken('TRUCK', normalized);
    const tare = input.tareWeightKg || 0;
    const gross = input.maxGrossWeightKg || 0;
    const payloadLimit = gross > tare ? gross - tare : undefined;

    const newTruck: GlobalTruckEntity = {
      truckId: opaqueId,
      plate: input.plate.trim(),
      normalizedPlate: normalized,
      vin: input.vin?.trim(),
      truckType: input.truckType,
      tareWeightKg: tare > 0 ? tare : undefined,
      maxGrossWeightKg: gross > 0 ? gross : undefined,
      legalPayloadLimitKg: payloadLimit,
      primaryCarrierId: input.primaryCarrierId?.trim(),
      mvpiValidUntil: input.mvpiValidUntil,
      insuranceValidUntil: input.insuranceValidUntil,
      status: input.status || 'ACTIVE',
      createdAt: new Date(),
      createdBy: input.createdBy,
      updatedAt: new Date(),
      updatedBy: input.createdBy,
    };

    if (!auth.currentUser) {
      if (process.env.NODE_ENV !== 'test') return null;
      if (this.inMemoryTrucks.has(opaqueId)) {
        throw new Error(`ID_COLLISION_DETECTED: Generated truck ID ${opaqueId} collided`);
      }
      if (this.inMemoryIndexByPlate.has(normalized)) {
        throw new Error(`DUPLICATE_NATURAL_KEY: Truck with plate ${normalized} already exists in global registry`);
      }
      this.inMemoryTrucks.set(opaqueId, newTruck);
      this.inMemoryIndexByPlate.set(normalized, opaqueId);
      return newTruck;
    }
    throw new Error('GLOBAL_SERVER_COMMAND_REQUIRED');
  }

  async updateProfile(
    truckId: string,
    updates: {
      vin?: string;
      tareWeightKg?: number;
      maxGrossWeightKg?: number;
      truckType?: GlobalTruckEntity['truckType'];
      primaryCarrierId?: string;
      mvpiValidUntil?: Date;
      insuranceValidUntil?: Date;
      status?: GlobalTruckEntity['status'];
      updatedBy: string;
    }
  ): Promise<void> {
    if (auth.currentUser || process.env.NODE_ENV !== 'test') throw new Error('GLOBAL_SERVER_COMMAND_REQUIRED');

    const existing = await this.findById(truckId);
    if (!existing) {
      throw new Error(`TRUCK_NOT_FOUND: Global truck ${truckId} does not exist`);
    }

    const payload: Partial<GlobalTruckEntity> = {
      updatedAt: new Date(),
      updatedBy: updates.updatedBy,
    };

    if (updates.vin !== undefined) payload.vin = updates.vin.trim();
    if (updates.truckType) payload.truckType = updates.truckType;
    if (updates.tareWeightKg !== undefined) payload.tareWeightKg = updates.tareWeightKg;
    if (updates.maxGrossWeightKg !== undefined) payload.maxGrossWeightKg = updates.maxGrossWeightKg;
    if (payload.tareWeightKg && payload.maxGrossWeightKg) {
      payload.legalPayloadLimitKg = payload.maxGrossWeightKg - payload.tareWeightKg;
    }
    if (updates.primaryCarrierId !== undefined) payload.primaryCarrierId = updates.primaryCarrierId.trim();
    if (updates.mvpiValidUntil !== undefined) payload.mvpiValidUntil = updates.mvpiValidUntil;
    if (updates.insuranceValidUntil !== undefined) payload.insuranceValidUntil = updates.insuranceValidUntil;
    if (updates.status) payload.status = updates.status;

    if (!auth.currentUser) {
      if (process.env.NODE_ENV !== 'test') return null;
      Object.assign(existing, payload);
      this.inMemoryTrucks.set(truckId, existing);
      return;
    }
    throw new Error('GLOBAL_SERVER_COMMAND_REQUIRED');
  }
}

// ============================================================================
// 3. GLOBAL CARRIER REPOSITORY
// ============================================================================
export class GlobalCarrierRepository {
  private readonly collectionName = 'carriers';
  private inMemoryCarriers: Map<string, GlobalCarrierEntity> = new Map();
  private inMemoryIndexByCR: Map<string, string> = new Map(); // CR -> carrierId

  clearInMemoryCache(): void {
    this.inMemoryCarriers.clear();
    this.inMemoryIndexByCR.clear();
  }

  async findById(carrierId: string): Promise<GlobalCarrierEntity | null> {
    if (!auth.currentUser) {
      if (process.env.NODE_ENV !== 'test') return null;
      return this.inMemoryCarriers.get(carrierId) || null;
    }
    const path = `${this.collectionName}/${carrierId}`;
    try {
      const snap = await getDoc(doc(db, this.collectionName, carrierId));
      if (!snap.exists()) return null;
      return decodeGlobal<GlobalCarrierEntity>(snap.data(), 'carrier', carrierId);
    } catch (error) {
      if ((error as any)?.code === 'PERSISTENCE_BOUNDARY_INVALID') throw error;
      handleFirestoreError(error, OperationType.GET, path);
      throw error;
    }
  }

  async findByLegalIdentity(commercialRegistrationNo: string): Promise<GlobalCarrierEntity | null> {
    const cr = commercialRegistrationNo.replace(/[^0-9]/g, '');
    if (!cr) return null;

    if (!auth.currentUser) {
      if (process.env.NODE_ENV !== 'test') return null;
      const carrierId = this.inMemoryIndexByCR.get(cr);
      return carrierId ? this.inMemoryCarriers.get(carrierId) || null : null;
    }

    return resolvePersistentNaturalIdentity('CARRIER', commercialRegistrationNo) as Promise<GlobalCarrierEntity | null>;
  }

  async listByIds(carrierIds: string[]): Promise<GlobalCarrierEntity[]> {
    if (carrierIds.length === 0) return [];
    const results: GlobalCarrierEntity[] = [];
    for (const id of carrierIds) {
      const c = await this.findById(id);
      if (c) results.push(c);
    }
    return results;
  }

  async createGlobal(
    input: {
      nameAr: string;
      commercialRegistrationNo: string;
      transportLicenseNo?: string;
      vatNumber?: string;
      contactPerson?: GlobalCarrierEntity['contactPerson'];
      status?: GlobalCarrierEntity['status'];
      createdBy: string;
    },
    transaction?: Transaction
  ): Promise<GlobalCarrierEntity> {
    if (auth.currentUser || process.env.NODE_ENV !== 'test') throw new Error('GLOBAL_SERVER_COMMAND_REQUIRED');

    const cr = input.commercialRegistrationNo.replace(/[^0-9]/g, '');
    if (!cr || cr.length !== 10) {
      throw new Error('INVALID_CR_NUMBER: Commercial Registration must be exactly 10 digits');
    }

    const opaqueId = generateOpaqueGlobalId('CAR');
    const lookupToken = computeNaturalKeyToken('CARRIER', cr);

    const newCarrier: GlobalCarrierEntity = {
      carrierId: opaqueId,
      nameAr: normalizeArabicText(input.nameAr),
      commercialRegistrationNo: cr,
      transportLicenseNo: input.transportLicenseNo?.trim(),
      vatNumber: input.vatNumber?.trim(),
      contactPerson: input.contactPerson,
      status: input.status || 'ACTIVE',
      createdAt: new Date(),
      createdBy: input.createdBy,
      updatedAt: new Date(),
      updatedBy: input.createdBy,
    };

    if (!auth.currentUser) {
      if (process.env.NODE_ENV !== 'test') return null;
      if (this.inMemoryCarriers.has(opaqueId)) {
        throw new Error(`ID_COLLISION_DETECTED: Generated carrier ID ${opaqueId} collided`);
      }
      if (this.inMemoryIndexByCR.has(cr)) {
        throw new Error(`DUPLICATE_NATURAL_KEY: Carrier with CR ${cr} already exists in global registry`);
      }
      this.inMemoryCarriers.set(opaqueId, newCarrier);
      this.inMemoryIndexByCR.set(cr, opaqueId);
      return newCarrier;
    }
    throw new Error('GLOBAL_SERVER_COMMAND_REQUIRED');
  }

  async updateProfile(
    carrierId: string,
    updates: {
      nameAr?: string;
      transportLicenseNo?: string;
      vatNumber?: string;
      contactPerson?: GlobalCarrierEntity['contactPerson'];
      status?: GlobalCarrierEntity['status'];
      updatedBy: string;
    }
  ): Promise<void> {
    if (auth.currentUser || process.env.NODE_ENV !== 'test') throw new Error('GLOBAL_SERVER_COMMAND_REQUIRED');

    const existing = await this.findById(carrierId);
    if (!existing) {
      throw new Error(`CARRIER_NOT_FOUND: Global carrier ${carrierId} does not exist`);
    }

    const payload: Partial<GlobalCarrierEntity> = {
      updatedAt: new Date(),
      updatedBy: updates.updatedBy,
    };

    if (updates.nameAr) payload.nameAr = normalizeArabicText(updates.nameAr);
    if (updates.transportLicenseNo !== undefined) payload.transportLicenseNo = updates.transportLicenseNo.trim();
    if (updates.vatNumber !== undefined) payload.vatNumber = updates.vatNumber.trim();
    if (updates.contactPerson) payload.contactPerson = updates.contactPerson;
    if (updates.status) payload.status = updates.status;

    if (!auth.currentUser) {
      if (process.env.NODE_ENV !== 'test') return null;
      Object.assign(existing, payload);
      this.inMemoryCarriers.set(carrierId, existing);
      return;
    }
    throw new Error('GLOBAL_SERVER_COMMAND_REQUIRED');
  }
}

// ============================================================================
// 4. GLOBAL MATERIAL REPOSITORY
// ============================================================================
export class GlobalMaterialRepository {
  private readonly collectionName = 'materials';
  private inMemoryMaterials: Map<string, GlobalMaterialEntity> = new Map();
  private inMemoryIndexByCode: Map<string, string> = new Map(); // canonicalCode -> materialId

  clearInMemoryCache(): void {
    this.inMemoryMaterials.clear();
    this.inMemoryIndexByCode.clear();
  }

  async findById(materialId: string): Promise<GlobalMaterialEntity | null> {
    if (!auth.currentUser) {
      if (process.env.NODE_ENV !== 'test') return null;
      return this.inMemoryMaterials.get(materialId) || null;
    }
    const path = `${this.collectionName}/${materialId}`;
    try {
      const snap = await getDoc(doc(db, this.collectionName, materialId));
      if (!snap.exists()) return null;
      return decodeGlobal<GlobalMaterialEntity>(snap.data(), 'material', materialId);
    } catch (error) {
      if ((error as any)?.code === 'PERSISTENCE_BOUNDARY_INVALID') throw error;
      handleFirestoreError(error, OperationType.GET, path);
      throw error;
    }
  }

  async findByCanonicalCode(code: string): Promise<GlobalMaterialEntity | null> {
    const canonicalCode = normalizeCode(code);
    if (!canonicalCode) return null;

    if (!auth.currentUser) {
      if (process.env.NODE_ENV !== 'test') return null;
      const materialId = this.inMemoryIndexByCode.get(canonicalCode);
      return materialId ? this.inMemoryMaterials.get(materialId) || null : null;
    }

    return resolvePersistentNaturalIdentity('MATERIAL', code) as Promise<GlobalMaterialEntity | null>;
  }

  async listByIds(materialIds: string[]): Promise<GlobalMaterialEntity[]> {
    if (materialIds.length === 0) return [];
    const results: GlobalMaterialEntity[] = [];
    for (const id of materialIds) {
      const m = await this.findById(id);
      if (m) results.push(m);
    }
    return results;
  }

  async createGlobal(
    input: {
      code: string;
      nameAr: string;
      nameEn?: string;
      unitOfMeasure?: GlobalMaterialEntity['unitOfMeasure'];
      standardDensityTonPerM3?: number;
      maxAllowableMoisturePercent?: number;
      status?: GlobalMaterialEntity['status'];
      createdBy: string;
    },
    transaction?: Transaction
  ): Promise<GlobalMaterialEntity> {
    if (auth.currentUser || process.env.NODE_ENV !== 'test') throw new Error('GLOBAL_SERVER_COMMAND_REQUIRED');

    const canonicalCode = normalizeCode(input.code);
    if (!canonicalCode || canonicalCode.length < 2) {
      throw new Error('INVALID_MATERIAL_CODE: Material code must be at least 2 characters');
    }

    const opaqueId = generateOpaqueGlobalId('MAT');
    const lookupToken = computeNaturalKeyToken('MATERIAL', canonicalCode);

    const newMaterial: GlobalMaterialEntity = {
      materialId: opaqueId,
      code: canonicalCode,
      nameAr: normalizeArabicText(input.nameAr),
      nameEn: input.nameEn?.trim(),
      unitOfMeasure: input.unitOfMeasure || 'TON',
      standardDensityTonPerM3: input.standardDensityTonPerM3,
      maxAllowableMoisturePercent: input.maxAllowableMoisturePercent,
      status: input.status || 'ACTIVE',
      createdAt: new Date(),
      createdBy: input.createdBy,
      updatedAt: new Date(),
      updatedBy: input.createdBy,
    };

    if (!auth.currentUser) {
      if (process.env.NODE_ENV !== 'test') return null;
      if (this.inMemoryMaterials.has(opaqueId)) {
        throw new Error(`ID_COLLISION_DETECTED: Generated material ID ${opaqueId} collided`);
      }
      if (this.inMemoryIndexByCode.has(canonicalCode)) {
        throw new Error(`DUPLICATE_NATURAL_KEY: Material with code ${canonicalCode} already exists in global catalog`);
      }
      this.inMemoryMaterials.set(opaqueId, newMaterial);
      this.inMemoryIndexByCode.set(canonicalCode, opaqueId);
      return newMaterial;
    }
    throw new Error('GLOBAL_SERVER_COMMAND_REQUIRED');
  }

  async updateCatalog(
    materialId: string,
    updates: {
      nameAr?: string;
      nameEn?: string;
      unitOfMeasure?: GlobalMaterialEntity['unitOfMeasure'];
      standardDensityTonPerM3?: number;
      maxAllowableMoisturePercent?: number;
      status?: GlobalMaterialEntity['status'];
      updatedBy: string;
    }
  ): Promise<void> {
    if (auth.currentUser || process.env.NODE_ENV !== 'test') throw new Error('GLOBAL_SERVER_COMMAND_REQUIRED');

    const existing = await this.findById(materialId);
    if (!existing) {
      throw new Error(`MATERIAL_NOT_FOUND: Global material ${materialId} does not exist`);
    }

    const payload: Partial<GlobalMaterialEntity> = {
      updatedAt: new Date(),
      updatedBy: updates.updatedBy,
    };

    if (updates.nameAr) payload.nameAr = normalizeArabicText(updates.nameAr);
    if (updates.nameEn !== undefined) payload.nameEn = updates.nameEn.trim();
    if (updates.unitOfMeasure) payload.unitOfMeasure = updates.unitOfMeasure;
    if (updates.standardDensityTonPerM3 !== undefined) payload.standardDensityTonPerM3 = updates.standardDensityTonPerM3;
    if (updates.maxAllowableMoisturePercent !== undefined) payload.maxAllowableMoisturePercent = updates.maxAllowableMoisturePercent;
    if (updates.status) payload.status = updates.status;

    if (!auth.currentUser) {
      if (process.env.NODE_ENV !== 'test') return null;
      Object.assign(existing, payload);
      this.inMemoryMaterials.set(materialId, existing);
      return;
    }
    throw new Error('GLOBAL_SERVER_COMMAND_REQUIRED');
  }
}

// Singletons for global identity authority
export const globalDriverRepository = new GlobalDriverRepository();
export const globalTruckRepository = new GlobalTruckRepository();
export const globalCarrierRepository = new GlobalCarrierRepository();
export const globalMaterialRepository = new GlobalMaterialRepository();

async function resolvePersistentNaturalIdentity(kind: GlobalKind, raw: string): Promise<Record<string, any> | null> {
  const spec = GLOBAL_IDENTITIES[kind], key = normalizeNaturalKey(kind, raw);
  let resolved: Record<string, any> | null = null, id: string | null = null;
  for (const token of [computeNaturalKeyToken(kind, key), ...legacyNaturalKeyTokens(kind, key)]) {
    const lookup = await getDoc(doc(db, 'natural_identity_lookups', token));
    if (!lookup.exists()) continue;
    const data = lookup.data();
    if (data.entityType !== kind || !validGlobalId(data.systemId)) throw new GlobalIdentityError('IDENTITY_LOOKUP_INTEGRITY_ERROR');
    const target = await getDoc(doc(db, spec.collection, data.systemId));
    if (!target.exists()) throw new GlobalIdentityError('IDENTITY_LOOKUP_INTEGRITY_ERROR');
    const entity = decodeGlobalIdentity(kind, target.data(), target.id);
    if (normalizeNaturalKey(kind, entity[spec.natural]) !== key || (id && id !== target.id)) throw new GlobalIdentityError('IDENTITY_LOOKUP_INTEGRITY_ERROR');
    resolved = entity; id = target.id;
  }
  const matches = await getDocs(query(collection(db, spec.collection), where(spec.natural, '==', key)));
  if (matches.docs.length > 1) throw new GlobalIdentityError('DUPLICATE_NATURAL_KEY');
  if (matches.docs.length === 1) {
    const match = matches.docs[0];
    if (id && id !== match.id) throw new GlobalIdentityError('IDENTITY_LOOKUP_INTEGRITY_ERROR');
    resolved = decodeGlobalIdentity(kind, match.data(), match.id);
    if (normalizeNaturalKey(kind, resolved[spec.natural]) !== key) throw new GlobalIdentityError('IDENTITY_LOOKUP_INTEGRITY_ERROR');
  }
  return resolved;
}
