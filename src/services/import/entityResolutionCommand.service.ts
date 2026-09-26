/**
 * Entity Resolution Command Adapter (Unit 5A)
 * 
 * Provides production client command execution for interactive entity resolution decisions
 * converging directly on canonical server mutation paths.
 * 
 * Supported Entity Types: CARRIER, MATERIAL, DRIVER, TRUCK
 * 
 * Canonical Server Routes Reused:
 * - Carrier Setup: POST /api/projects/:projectId/setup-carrier
 * - Material Setup: POST /api/projects/:projectId/setup-material
 * - Standalone Driver Setup: POST /api/projects/:projectId/setup-driver
 * - Standalone Truck Setup: POST /api/projects/:projectId/setup-truck
 */

import { auth } from '../../firebase/config';

export type EntityType = 'CARRIER' | 'MATERIAL' | 'DRIVER' | 'TRUCK';

export interface NormalizedEntityResolutionResult {
  entityType: EntityType;
  sourceValue: string;
  matchedId: string;
  matchedName: string;
  matchMethod: 'EXACT' | 'NORMALIZED' | 'ALIAS' | 'FUZZY' | 'NONE' | string;
  confidence: number;
  isExact: boolean;
  isAuthorized: boolean;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  relationshipStatus: 'VALID' | string;
}

export interface SelectExistingParams {
  projectId: string;
  entityType: EntityType;
  entityId: string;
  displayName: string;
  sourceValue: string;
}

export interface CreateCarrierParams {
  projectId: string;
  sourceValue: string;
  carrierData: {
    nameAr: string;
    commercialRegistrationNo: string;
    transportLicenseNo?: string;
    [key: string]: any;
  };
}

export interface CreateMaterialParams {
  projectId: string;
  sourceValue: string;
  materialData: {
    code: string;
    nameAr: string;
    unitOfMeasure?: string;
    standardDensityTonPerM3?: number;
    [key: string]: any;
  };
}

export interface CreateDriverParams {
  projectId: string;
  sourceValue: string;
  driverData: {
    carrierId: string;
    driverName: string;
    residencyId: string;
    phone?: string;
    [key: string]: any;
  };
}

export interface CreateTruckParams {
  projectId: string;
  sourceValue: string;
  truckData: {
    carrierId: string;
    plateNumber: string;
    truckType?: string;
    tareWeightKg?: number;
    maxGrossWeightKg?: number;
    [key: string]: any;
  };
}

export class EntityResolutionCommandService {
  /**
   * Helper to retrieve Firebase Bearer Token or throw UNAUTHENTICATED
   */
  private async getAuthBearerToken(): Promise<string> {
    const user = auth.currentUser;
    if (!user) {
      const err: any = new Error('المستخدم غير موثق');
      err.code = 'UNAUTHENTICATED';
      throw err;
    }
    const token = await user.getIdToken();
    return `Bearer ${token}`;
  }

  /**
   * Command A: selectExisting
   * Returns a normalized resolution result for an existing canonical entity.
   * Performs ZERO server mutation fetch calls.
   */
  public selectExisting(params: SelectExistingParams): NormalizedEntityResolutionResult {
    if (!params.projectId || !params.projectId.trim()) {
      const err: any = new Error('معرف المشروع مطلوب');
      err.code = 'PROJECT_ID_REQUIRED';
      throw err;
    }

    if (!params.entityId || !params.entityId.trim()) {
      const err: any = new Error('معرف الكيان المستهدف مطلوب');
      err.code = 'ENTITY_ID_REQUIRED';
      throw err;
    }

    if (!params.entityType) {
      const err: any = new Error('نوع الكيان مطلوب');
      err.code = 'ENTITY_TYPE_REQUIRED';
      throw err;
    }

    return {
      entityType: params.entityType,
      sourceValue: params.sourceValue || params.displayName,
      matchedId: params.entityId,
      matchedName: params.displayName || params.entityId,
      matchMethod: 'EXACT',
      confidence: 1.0,
      isExact: true,
      isAuthorized: true,
      riskLevel: 'LOW',
      relationshipStatus: 'VALID',
    };
  }

  /**
   * Command B: createCarrier
   * Calls server endpoint POST /api/projects/:projectId/setup-carrier
   */
  public async createCarrier(params: CreateCarrierParams): Promise<NormalizedEntityResolutionResult> {
    if (!params.projectId || !params.projectId.trim()) {
      const err: any = new Error('معرف المشروع مطلوب');
      err.code = 'PROJECT_ID_REQUIRED';
      throw err;
    }

    if (!params.carrierData || !params.carrierData.commercialRegistrationNo) {
      const err: any = new Error('رقم السجل التجاري للناقل مطلوب');
      err.code = 'INVALID_CARRIER_DATA';
      throw err;
    }

    const authHeader = await this.getAuthBearerToken();

    const response = await fetch(`/api/projects/${encodeURIComponent(params.projectId)}/setup-carrier`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify({ carrierData: params.carrierData }),
    });

    const resJson = await response.json().catch(() => null);

    if (!response.ok || !resJson?.success) {
      const err: any = new Error(resJson?.error || 'فشلت عملية إنشاء الناقل على الخادم');
      err.code = resJson?.code || 'CARRIER_CREATE_FAILED';
      throw err;
    }

    const carrierId = resJson.carrierId || resJson.data?.carrierId || resJson.carrier?.carrierId;
    if (!carrierId) {
      const err: any = new Error('لم يتضمن رد الخادم معرف الناقل المعتمد (carrierId)');
      err.code = 'CANONICAL_ID_MISSING';
      throw err;
    }

    return {
      entityType: 'CARRIER',
      sourceValue: params.sourceValue || params.carrierData.nameAr,
      matchedId: carrierId,
      matchedName: params.carrierData.nameAr || carrierId,
      matchMethod: 'EXACT',
      confidence: 1.0,
      isExact: true,
      isAuthorized: true,
      riskLevel: 'LOW',
      relationshipStatus: 'VALID',
    };
  }

  /**
   * Command C: createMaterial
   * Calls server endpoint POST /api/projects/:projectId/setup-material
   */
  public async createMaterial(params: CreateMaterialParams): Promise<NormalizedEntityResolutionResult> {
    if (!params.projectId || !params.projectId.trim()) {
      const err: any = new Error('معرف المشروع مطلوب');
      err.code = 'PROJECT_ID_REQUIRED';
      throw err;
    }

    if (!params.materialData || !params.materialData.code) {
      const err: any = new Error('رمز المادة (code) مطلوب');
      err.code = 'INVALID_MATERIAL_DATA';
      throw err;
    }

    const authHeader = await this.getAuthBearerToken();

    const response = await fetch(`/api/projects/${encodeURIComponent(params.projectId)}/setup-material`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify({ materialData: params.materialData }),
    });

    const resJson = await response.json().catch(() => null);

    if (!response.ok || !resJson?.success) {
      const err: any = new Error(resJson?.error || 'فشلت عملية إنشاء المادة على الخادم');
      err.code = resJson?.code || 'MATERIAL_CREATE_FAILED';
      throw err;
    }

    const materialId = resJson.materialId || resJson.data?.materialId || resJson.material?.materialId;
    if (!materialId) {
      const err: any = new Error('لم يتضمن رد الخادم معرف المادة المعتمد (materialId)');
      err.code = 'CANONICAL_ID_MISSING';
      throw err;
    }

    return {
      entityType: 'MATERIAL',
      sourceValue: params.sourceValue || params.materialData.nameAr || params.materialData.code,
      matchedId: materialId,
      matchedName: params.materialData.nameAr || params.materialData.code || materialId,
      matchMethod: 'EXACT',
      confidence: 1.0,
      isExact: true,
      isAuthorized: true,
      riskLevel: 'LOW',
      relationshipStatus: 'VALID',
    };
  }

  /**
   * Command D: createDriver
   * Calls server endpoint POST /api/projects/:projectId/setup-driver
   */
  public async createDriver(params: CreateDriverParams): Promise<NormalizedEntityResolutionResult> {
    if (!params.projectId || !params.projectId.trim()) {
      const err: any = new Error('معرف المشروع مطلوب');
      err.code = 'PROJECT_ID_REQUIRED';
      throw err;
    }

    if (!params.driverData) {
      const err: any = new Error('بيانات السائق (driverData) مطلوبة');
      err.code = 'INVALID_DRIVER_DATA';
      throw err;
    }

    if (!params.driverData.carrierId || !params.driverData.carrierId.trim()) {
      const err: any = new Error('معرف الناقل (carrierId) مطلوب للسائق');
      err.code = 'CARRIER_ID_REQUIRED';
      throw err;
    }

    if (!params.driverData.driverName || !params.driverData.driverName.trim()) {
      const err: any = new Error('اسم السائق (driverName) مطلوب');
      err.code = 'DRIVER_NAME_REQUIRED';
      throw err;
    }

    if (!params.driverData.residencyId || !params.driverData.residencyId.trim()) {
      const err: any = new Error('رقم الهوية الوطنية أو الإقامة (residencyId) مطلوب');
      err.code = 'RESIDENCY_ID_REQUIRED';
      throw err;
    }

    const authHeader = await this.getAuthBearerToken();

    const response = await fetch(`/api/projects/${encodeURIComponent(params.projectId)}/setup-driver`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify({
        driverData: {
          carrierId: params.driverData.carrierId,
          driverName: params.driverData.driverName,
          residencyId: params.driverData.residencyId,
          ...(params.driverData.phone ? { phone: params.driverData.phone } : {}),
        },
      }),
    });

    const resJson = await response.json().catch(() => null);

    if (!response.ok || !resJson?.success) {
      const err: any = new Error(resJson?.error || 'فشلت عملية إنشاء السائق على الخادم');
      err.code = resJson?.code || 'DRIVER_CREATE_FAILED';
      throw err;
    }

    const driverId = resJson.driverId || resJson.data?.driverId;
    if (!driverId) {
      const err: any = new Error('لم يتضمن رد الخادم معرف السائق المعتمد (driverId)');
      err.code = 'CANONICAL_ID_MISSING';
      throw err;
    }

    return {
      entityType: 'DRIVER',
      sourceValue: params.sourceValue || params.driverData.driverName,
      matchedId: driverId,
      matchedName: params.driverData.driverName || driverId,
      matchMethod: 'EXACT',
      confidence: 1.0,
      isExact: true,
      isAuthorized: true,
      riskLevel: 'LOW',
      relationshipStatus: 'VALID',
    };
  }

  /**
   * Command E: createTruck
   * Calls server endpoint POST /api/projects/:projectId/setup-truck
   */
  public async createTruck(params: CreateTruckParams): Promise<NormalizedEntityResolutionResult> {
    if (!params.projectId || !params.projectId.trim()) {
      const err: any = new Error('معرف المشروع مطلوب');
      err.code = 'PROJECT_ID_REQUIRED';
      throw err;
    }

    if (!params.truckData) {
      const err: any = new Error('بيانات الشاحنة (truckData) مطلوبة');
      err.code = 'INVALID_TRUCK_DATA';
      throw err;
    }

    if (!params.truckData.carrierId || !params.truckData.carrierId.trim()) {
      const err: any = new Error('معرف الناقل (carrierId) مطلوب للشاحنة');
      err.code = 'CARRIER_ID_REQUIRED';
      throw err;
    }

    if (!params.truckData.plateNumber || !params.truckData.plateNumber.trim()) {
      const err: any = new Error('رقم لوحة الشاحنة (plateNumber) مطلوب');
      err.code = 'PLATE_NUMBER_REQUIRED';
      throw err;
    }

    const authHeader = await this.getAuthBearerToken();

    const response = await fetch(`/api/projects/${encodeURIComponent(params.projectId)}/setup-truck`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify({
        truckData: {
          carrierId: params.truckData.carrierId,
          plateNumber: params.truckData.plateNumber,
          ...(params.truckData.truckType ? { truckType: params.truckData.truckType } : {}),
          ...(params.truckData.tareWeightKg !== undefined ? { tareWeightKg: params.truckData.tareWeightKg } : {}),
          ...(params.truckData.maxGrossWeightKg !== undefined ? { maxGrossWeightKg: params.truckData.maxGrossWeightKg } : {}),
        },
      }),
    });

    const resJson = await response.json().catch(() => null);

    if (!response.ok || !resJson?.success) {
      const err: any = new Error(resJson?.error || 'فشلت عملية إنشاء الشاحنة على الخادم');
      err.code = resJson?.code || 'TRUCK_CREATE_FAILED';
      throw err;
    }

    const truckId = resJson.truckId || resJson.data?.truckId;
    if (!truckId) {
      const err: any = new Error('لم يتضمن رد الخادم معرف الشاحنة المعتمد (truckId)');
      err.code = 'CANONICAL_ID_MISSING';
      throw err;
    }

    return {
      entityType: 'TRUCK',
      sourceValue: params.sourceValue || params.truckData.plateNumber,
      matchedId: truckId,
      matchedName: params.truckData.plateNumber || truckId,
      matchMethod: 'EXACT',
      confidence: 1.0,
      isExact: true,
      isAuthorized: true,
      riskLevel: 'LOW',
      relationshipStatus: 'VALID',
    };
  }
}

export const entityResolutionCommandService = new EntityResolutionCommandService();
