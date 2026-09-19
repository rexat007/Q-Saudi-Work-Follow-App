import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where,
  runTransaction,
  serverTimestamp,
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
export function computeNaturalKeyToken(entityType: 'DRIVER' | 'TRUCK' | 'CARRIER' | 'MATERIAL', rawKey: string): string {
  let cleaned = rawKey.trim();
  if (entityType === 'DRIVER') {
    cleaned = normalizeIdNumber(cleaned);
  } else if (entityType === 'TRUCK') {
    cleaned = normalizePlate(cleaned).replace(/\s+/g, '_');
  } else if (entityType === 'CARRIER') {
    cleaned = cleaned.replace(/[^0-9]/g, '');
  } else if (entityType === 'MATERIAL') {
    cleaned = normalizeCode(cleaned);
  }
  
  // Safe deterministic token supporting Unicode Arabic text and ASCII
  let token: string;
  try {
    if (typeof Buffer !== 'undefined') {
      token = Buffer.from(cleaned, 'utf-8').toString('base64').replace(/[/+=]/g, '_');
    } else if (typeof btoa === 'function') {
      token = btoa(encodeURIComponent(cleaned)).replace(/[/+=]/g, '_');
    } else {
      token = encodeURIComponent(cleaned).replace(/%/g, '_');
    }
  } catch {
    token = encodeURIComponent(cleaned).replace(/%/g, '_');
  }
  return `${entityType}_${token}`;
}

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
      return this.inMemoryDrivers.get(driverId) || null;
    }
    const path = `${this.collectionName}/${driverId}`;
    try {
      const snap = await getDoc(doc(db, this.collectionName, driverId));
      if (!snap.exists()) return this.inMemoryDrivers.get(driverId) || null;
      return snap.data() as GlobalDriverEntity;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return this.inMemoryDrivers.get(driverId) || null;
    }
  }

  async findByNaturalIdentity(nationalId: string): Promise<GlobalDriverEntity | null> {
    const normalized = normalizeIdNumber(nationalId);
    if (!normalized) return null;

    if (!auth.currentUser) {
      const driverId = this.inMemoryIndexByNationalId.get(normalized);
      if (driverId) {
        return this.inMemoryDrivers.get(driverId) || null;
      }
      return null;
    }

    try {
      // First check direct natural key lookup index document to achieve O(1) concurrency safety
      const lookupToken = computeNaturalKeyToken('DRIVER', normalized);
      const lookupRef = doc(db, 'natural_identity_lookups', lookupToken);
      const lookupSnap = await getDoc(lookupRef);
      
      if (lookupSnap.exists()) {
        const targetId = lookupSnap.data().systemId;
        return this.findById(targetId);
      }

      // Fallback query on canonical collection
      const q = query(collection(db, this.collectionName), where('nationalId', '==', normalized));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs[0].data() as GlobalDriverEntity;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, this.collectionName);
      const driverId = this.inMemoryIndexByNationalId.get(normalized);
      return driverId ? this.inMemoryDrivers.get(driverId) || null : null;
    }
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
      status?: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
      createdBy: string;
    },
    transaction?: Transaction
  ): Promise<GlobalDriverEntity> {
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

    const executeWithTx = async (tx: Transaction) => {
      const driverRef = doc(db, this.collectionName, opaqueId);
      const driverSnap = await tx.get(driverRef);
      if (driverSnap.exists()) {
        throw new Error(`ID_COLLISION_DETECTED: Generated driver ID ${opaqueId} already exists`);
      }

      const lookupRef = doc(db, 'natural_identity_lookups', lookupToken);
      const lookupSnap = await tx.get(lookupRef);
      if (lookupSnap.exists()) {
        throw new Error(`DUPLICATE_NATURAL_KEY: Driver with National ID already exists in global registry`);
      }

      tx.set(driverRef, {
        ...newDriver,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      tx.set(lookupRef, {
        entityType: 'DRIVER',
        systemId: opaqueId,
        createdAt: serverTimestamp(),
        createdBy: input.createdBy,
      });
    };

    if (transaction) {
      await executeWithTx(transaction);
    } else {
      await runTransaction(db, executeWithTx);
    }

    this.inMemoryDrivers.set(opaqueId, newDriver);
    this.inMemoryIndexByNationalId.set(normalizedNationalId, opaqueId);
    return newDriver;
  }

  async updateProfile(
    driverId: string,
    updates: {
      phone?: string;
      licenseNumber?: string;
      licenseValidUntil?: Date;
      nationality?: string;
      status?: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
      updatedBy: string;
    }
  ): Promise<void> {
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
      Object.assign(existing, payload);
      this.inMemoryDrivers.set(driverId, existing);
      return;
    }

    try {
      const driverRef = doc(db, this.collectionName, driverId);
      await updateDoc(driverRef, {
        ...payload,
        updatedAt: serverTimestamp(),
      });
      Object.assign(existing, payload);
      this.inMemoryDrivers.set(driverId, existing);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${this.collectionName}/${driverId}`);
      throw error;
    }
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
      return this.inMemoryTrucks.get(truckId) || null;
    }
    const path = `${this.collectionName}/${truckId}`;
    try {
      const snap = await getDoc(doc(db, this.collectionName, truckId));
      if (!snap.exists()) return this.inMemoryTrucks.get(truckId) || null;
      return snap.data() as GlobalTruckEntity;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return this.inMemoryTrucks.get(truckId) || null;
    }
  }

  async findByNaturalIdentity(plate: string): Promise<GlobalTruckEntity | null> {
    const normalized = normalizePlate(plate);
    if (!normalized) return null;

    if (!auth.currentUser) {
      const truckId = this.inMemoryIndexByPlate.get(normalized);
      return truckId ? this.inMemoryTrucks.get(truckId) || null : null;
    }

    try {
      const lookupToken = computeNaturalKeyToken('TRUCK', normalized);
      const lookupRef = doc(db, 'natural_identity_lookups', lookupToken);
      const lookupSnap = await getDoc(lookupRef);

      if (lookupSnap.exists()) {
        const targetId = lookupSnap.data().systemId;
        return this.findById(targetId);
      }

      const q = query(collection(db, this.collectionName), where('normalizedPlate', '==', normalized));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs[0].data() as GlobalTruckEntity;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, this.collectionName);
      const truckId = this.inMemoryIndexByPlate.get(normalized);
      return truckId ? this.inMemoryTrucks.get(truckId) || null : null;
    }
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
      status?: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE';
      createdBy: string;
    },
    transaction?: Transaction
  ): Promise<GlobalTruckEntity> {
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

    const executeWithTx = async (tx: Transaction) => {
      const truckRef = doc(db, this.collectionName, opaqueId);
      const truckSnap = await tx.get(truckRef);
      if (truckSnap.exists()) {
        throw new Error(`ID_COLLISION_DETECTED: Generated truck ID ${opaqueId} already exists`);
      }

      const lookupRef = doc(db, 'natural_identity_lookups', lookupToken);
      const lookupSnap = await tx.get(lookupRef);
      if (lookupSnap.exists()) {
        throw new Error(`DUPLICATE_NATURAL_KEY: Truck with plate ${normalized} already exists in global registry`);
      }

      tx.set(truckRef, {
        ...newTruck,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      tx.set(lookupRef, {
        entityType: 'TRUCK',
        systemId: opaqueId,
        createdAt: serverTimestamp(),
        createdBy: input.createdBy,
      });
    };

    if (transaction) {
      await executeWithTx(transaction);
    } else {
      await runTransaction(db, executeWithTx);
    }

    this.inMemoryTrucks.set(opaqueId, newTruck);
    this.inMemoryIndexByPlate.set(normalized, opaqueId);
    return newTruck;
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
      status?: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE';
      updatedBy: string;
    }
  ): Promise<void> {
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
      Object.assign(existing, payload);
      this.inMemoryTrucks.set(truckId, existing);
      return;
    }

    try {
      const truckRef = doc(db, this.collectionName, truckId);
      await updateDoc(truckRef, {
        ...payload,
        updatedAt: serverTimestamp(),
      });
      Object.assign(existing, payload);
      this.inMemoryTrucks.set(truckId, existing);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${this.collectionName}/${truckId}`);
      throw error;
    }
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
      return this.inMemoryCarriers.get(carrierId) || null;
    }
    const path = `${this.collectionName}/${carrierId}`;
    try {
      const snap = await getDoc(doc(db, this.collectionName, carrierId));
      if (!snap.exists()) return this.inMemoryCarriers.get(carrierId) || null;
      return snap.data() as GlobalCarrierEntity;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return this.inMemoryCarriers.get(carrierId) || null;
    }
  }

  async findByLegalIdentity(commercialRegistrationNo: string): Promise<GlobalCarrierEntity | null> {
    const cr = commercialRegistrationNo.replace(/[^0-9]/g, '');
    if (!cr) return null;

    if (!auth.currentUser) {
      const carrierId = this.inMemoryIndexByCR.get(cr);
      return carrierId ? this.inMemoryCarriers.get(carrierId) || null : null;
    }

    try {
      const lookupToken = computeNaturalKeyToken('CARRIER', cr);
      const lookupRef = doc(db, 'natural_identity_lookups', lookupToken);
      const lookupSnap = await getDoc(lookupRef);

      if (lookupSnap.exists()) {
        const targetId = lookupSnap.data().systemId;
        return this.findById(targetId);
      }

      const q = query(collection(db, this.collectionName), where('commercialRegistrationNo', '==', cr));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs[0].data() as GlobalCarrierEntity;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, this.collectionName);
      const carrierId = this.inMemoryIndexByCR.get(cr);
      return carrierId ? this.inMemoryCarriers.get(carrierId) || null : null;
    }
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
      status?: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
      createdBy: string;
    },
    transaction?: Transaction
  ): Promise<GlobalCarrierEntity> {
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

    const executeWithTx = async (tx: Transaction) => {
      const carrierRef = doc(db, this.collectionName, opaqueId);
      const carrierSnap = await tx.get(carrierRef);
      if (carrierSnap.exists()) {
        throw new Error(`ID_COLLISION_DETECTED: Generated carrier ID ${opaqueId} already exists`);
      }

      const lookupRef = doc(db, 'natural_identity_lookups', lookupToken);
      const lookupSnap = await tx.get(lookupRef);
      if (lookupSnap.exists()) {
        throw new Error(`DUPLICATE_NATURAL_KEY: Carrier with CR ${cr} already exists in global registry`);
      }
      tx.set(carrierRef, {
        ...newCarrier,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      tx.set(lookupRef, {
        entityType: 'CARRIER',
        systemId: opaqueId,
        createdAt: serverTimestamp(),
        createdBy: input.createdBy,
      });
    };

    if (transaction) {
      await executeWithTx(transaction);
    } else {
      await runTransaction(db, executeWithTx);
    }

    this.inMemoryCarriers.set(opaqueId, newCarrier);
    this.inMemoryIndexByCR.set(cr, opaqueId);
    return newCarrier;
  }

  async updateProfile(
    carrierId: string,
    updates: {
      nameAr?: string;
      transportLicenseNo?: string;
      vatNumber?: string;
      contactPerson?: GlobalCarrierEntity['contactPerson'];
      status?: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
      updatedBy: string;
    }
  ): Promise<void> {
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
      Object.assign(existing, payload);
      this.inMemoryCarriers.set(carrierId, existing);
      return;
    }

    try {
      const carrierRef = doc(db, this.collectionName, carrierId);
      await updateDoc(carrierRef, {
        ...payload,
        updatedAt: serverTimestamp(),
      });
      Object.assign(existing, payload);
      this.inMemoryCarriers.set(carrierId, existing);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${this.collectionName}/${carrierId}`);
      throw error;
    }
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
      return this.inMemoryMaterials.get(materialId) || null;
    }
    const path = `${this.collectionName}/${materialId}`;
    try {
      const snap = await getDoc(doc(db, this.collectionName, materialId));
      if (!snap.exists()) return this.inMemoryMaterials.get(materialId) || null;
      return snap.data() as GlobalMaterialEntity;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return this.inMemoryMaterials.get(materialId) || null;
    }
  }

  async findByCanonicalCode(code: string): Promise<GlobalMaterialEntity | null> {
    const canonicalCode = normalizeCode(code);
    if (!canonicalCode) return null;

    if (!auth.currentUser) {
      const materialId = this.inMemoryIndexByCode.get(canonicalCode);
      return materialId ? this.inMemoryMaterials.get(materialId) || null : null;
    }

    try {
      const lookupToken = computeNaturalKeyToken('MATERIAL', canonicalCode);
      const lookupRef = doc(db, 'natural_identity_lookups', lookupToken);
      const lookupSnap = await getDoc(lookupRef);

      if (lookupSnap.exists()) {
        const targetId = lookupSnap.data().systemId;
        return this.findById(targetId);
      }

      const q = query(collection(db, this.collectionName), where('code', '==', canonicalCode));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs[0].data() as GlobalMaterialEntity;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, this.collectionName);
      const materialId = this.inMemoryIndexByCode.get(canonicalCode);
      return materialId ? this.inMemoryMaterials.get(materialId) || null : null;
    }
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
      status?: 'ACTIVE' | 'INACTIVE';
      createdBy: string;
    },
    transaction?: Transaction
  ): Promise<GlobalMaterialEntity> {
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

    const executeWithTx = async (tx: Transaction) => {
      const matRef = doc(db, this.collectionName, opaqueId);
      const matSnap = await tx.get(matRef);
      if (matSnap.exists()) {
        throw new Error(`ID_COLLISION_DETECTED: Generated material ID ${opaqueId} already exists`);
      }

      const lookupRef = doc(db, 'natural_identity_lookups', lookupToken);
      const lookupSnap = await tx.get(lookupRef);
      if (lookupSnap.exists()) {
        throw new Error(`DUPLICATE_NATURAL_KEY: Material with code ${canonicalCode} already exists in global catalog`);
      }
      tx.set(matRef, {
        ...newMaterial,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      tx.set(lookupRef, {
        entityType: 'MATERIAL',
        systemId: opaqueId,
        createdAt: serverTimestamp(),
        createdBy: input.createdBy,
      });
    };

    if (transaction) {
      await executeWithTx(transaction);
    } else {
      await runTransaction(db, executeWithTx);
    }

    this.inMemoryMaterials.set(opaqueId, newMaterial);
    this.inMemoryIndexByCode.set(canonicalCode, opaqueId);
    return newMaterial;
  }

  async updateCatalog(
    materialId: string,
    updates: {
      nameAr?: string;
      nameEn?: string;
      unitOfMeasure?: GlobalMaterialEntity['unitOfMeasure'];
      standardDensityTonPerM3?: number;
      maxAllowableMoisturePercent?: number;
      status?: 'ACTIVE' | 'INACTIVE';
      updatedBy: string;
    }
  ): Promise<void> {
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
      Object.assign(existing, payload);
      this.inMemoryMaterials.set(materialId, existing);
      return;
    }

    try {
      const matRef = doc(db, this.collectionName, materialId);
      await updateDoc(matRef, {
        ...payload,
        updatedAt: serverTimestamp(),
      });
      Object.assign(existing, payload);
      this.inMemoryMaterials.set(materialId, existing);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${this.collectionName}/${materialId}`);
      throw error;
    }
  }
}

// Singletons for global identity authority
export const globalDriverRepository = new GlobalDriverRepository();
export const globalTruckRepository = new GlobalTruckRepository();
export const globalCarrierRepository = new GlobalCarrierRepository();
export const globalMaterialRepository = new GlobalMaterialRepository();
