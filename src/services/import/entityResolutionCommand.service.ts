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
 * 
 * DRIVER and TRUCK Standalone Creation:
 * - Audited: POST /api/intake/canonical is a joint intake requiring carrierId, materialId, driverName, plateNumber, residencyId simultaneously.
 * - Single-entity create for DRIVER/TRUCK without counterpart mutations is NOT supported by current server routes.
 * - Rejects safely with PRECONDITION_BOUNDARY_CHANGE_REQUIRED.
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
    plateNumber: string;
    truckType?: string;
    tareWeightKg?: number;
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
   * Command D: createDriver (PRECONDITION_BLOCKED)
   * Audited: POST /api/intake/canonical requires joint carrierId + materialId + plateNumber + residencyId.
   * Single-entity DRIVER creation without counterpart mutations is not supported by current server routes.
   */
  public async createDriver(_params: CreateDriverParams): Promise<NormalizedEntityResolutionResult> {
    const err: any = new Error(
      'إنشاء السائق المنفرد غير مدعوم على الخادم بدون تسجيل الأسطول المشترك (POST /api/intake/canonical)'
    );
    err.code = 'PRECONDITION_BOUNDARY_CHANGE_REQUIRED';
    err.details = 'Requires standalone POST /api/projects/:projectId/setup-driver endpoint on server';
    throw err;
  }

  /**
   * Command D: createTruck (PRECONDITION_BLOCKED)
   * Audited: POST /api/intake/canonical requires joint carrierId + materialId + driverName + residencyId + plateNumber.
   * Single-entity TRUCK creation without counterpart mutations is not supported by current server routes.
   */
  public async createTruck(_params: CreateTruckParams): Promise<NormalizedEntityResolutionResult> {
    const err: any = new Error(
      'إنشاء الشاحنة المنفردة غير مدعوم على الخادم بدون تسجيل الأسطول المشترك (POST /api/intake/canonical)'
    );
    err.code = 'PRECONDITION_BOUNDARY_CHANGE_REQUIRED';
    err.details = 'Requires standalone POST /api/projects/:projectId/setup-truck endpoint on server';
    throw err;
  }
}

export const entityResolutionCommandService = new EntityResolutionCommandService();
