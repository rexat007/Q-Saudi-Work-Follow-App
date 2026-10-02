import { auth } from '../firebase/config';

export interface MaterialCreateInput {
  name: string;
  code: string;
  unitOfMeasure?: 'TON' | 'M3' | 'TRIP';
  standardDensityTonPerM3?: number;
}

export interface MaterialCreationResult {
  success: boolean;
  projectId: string;
  materialId: string;
  membershipStatus: string;
  error?: string;
}

export interface MaterialUpdateInput {
  name?: string;
  unitOfMeasure?: 'TON' | 'M3' | 'TRIP';
  standardDensityTonPerM3?: number | null;
}

export interface MaterialUpdateResult {
  success: boolean;
  projectId: string;
  materialId: string;
  material: {
    materialId: string;
    name: string;
    code: string;
    unitOfMeasure: string;
    standardDensityTonPerM3?: number | null;
  };
  error?: string;
}

export class MaterialManagementClientService {
  /**
   * Dispatches server-authoritative project material setup command:
   * POST /api/projects/:projectId/setup-material
   */
  public async createProjectMaterial(
    projectId: string,
    input: MaterialCreateInput,
    overrideToken?: string
  ): Promise<MaterialCreationResult> {
    if (!projectId || !projectId.trim()) {
      throw new Error('INVALID_ARGUMENT: projectId is required');
    }

    const trimmedName = (input.name || '').trim();
    if (!trimmedName || trimmedName.length < 2) {
      throw new Error('INVALID_NAME: Material name must be at least 2 characters');
    }

    const trimmedCode = (input.code || '').trim().toUpperCase();
    if (!trimmedCode || trimmedCode.length < 2) {
      throw new Error('INVALID_MATERIAL_CODE: Material code must be at least 2 characters');
    }

    const unitOfMeasure = input.unitOfMeasure || 'TON';
    if (!['TON', 'M3', 'TRIP'].includes(unitOfMeasure)) {
      throw new Error('INVALID_UNIT_OF_MEASURE: unitOfMeasure must be TON, M3, or TRIP');
    }

    const standardDensityTonPerM3 =
      input.standardDensityTonPerM3 !== undefined && input.standardDensityTonPerM3 !== null
        ? Number(input.standardDensityTonPerM3)
        : 1.6;

    const token = overrideToken || (await auth.currentUser?.getIdToken());
    if (!token) {
      throw new Error('UNAUTHENTICATED: User must be signed in to create project material');
    }

    const materialData: Record<string, any> = {
      name: trimmedName,
      code: trimmedCode,
      unitOfMeasure,
      standardDensityTonPerM3,
    };

    const response = await fetch(`/api/projects/${encodeURIComponent(projectId.trim())}/setup-material`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ materialData }),
    });

    let json: any;
    try {
      json = await response.json();
    } catch {
      throw new Error(`فشل الاتصال بالخادم HTTP ${response.status}`);
    }

    if (!response.ok || !json.success) {
      throw new Error(json.error || `فشل إنشاء المادة (${response.status})`);
    }

    return {
      success: true,
      projectId: json.projectId || projectId,
      materialId: json.materialId,
      membershipStatus: json.membershipStatus || 'ACTIVE',
    };
  }

  /**
   * Dispatches server-authoritative project material update command:
   * PATCH /api/projects/:projectId/materials/:materialId
   */
  public async updateProjectMaterial(
    projectId: string,
    materialId: string,
    input: MaterialUpdateInput,
    overrideToken?: string
  ): Promise<MaterialUpdateResult> {
    if (!projectId || !projectId.trim()) {
      throw new Error('INVALID_ARGUMENT: projectId is required');
    }
    if (!materialId || !materialId.trim()) {
      throw new Error('INVALID_ARGUMENT: materialId is required');
    }

    const materialData: Record<string, any> = {};

    if (input.name !== undefined) {
      const trimmedName = input.name.trim();
      if (!trimmedName || trimmedName.length < 2) {
        throw new Error('INVALID_NAME: Material name must be at least 2 characters');
      }
      materialData.name = trimmedName;
    }

    if (input.unitOfMeasure !== undefined) {
      if (!['TON', 'M3', 'TRIP'].includes(input.unitOfMeasure)) {
        throw new Error('INVALID_UNIT_OF_MEASURE: unitOfMeasure must be TON, M3, or TRIP');
      }
      materialData.unitOfMeasure = input.unitOfMeasure;
    }

    if (input.standardDensityTonPerM3 !== undefined) {
      if (input.standardDensityTonPerM3 === null) {
        materialData.standardDensityTonPerM3 = null;
      } else {
        const num = Number(input.standardDensityTonPerM3);
        if (isNaN(num) || !isFinite(num) || num <= 0) {
          throw new Error('INVALID_MATERIAL_DENSITY: standardDensityTonPerM3 must be a positive finite number');
        }
        materialData.standardDensityTonPerM3 = num;
      }
    }

    const token = overrideToken || (await auth.currentUser?.getIdToken());
    if (!token) {
      throw new Error('UNAUTHENTICATED: User must be signed in to update project material');
    }

    const response = await fetch(
      `/api/projects/${encodeURIComponent(projectId.trim())}/materials/${encodeURIComponent(materialId.trim())}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ materialData }),
      }
    );

    let json: any;
    try {
      json = await response.json();
    } catch {
      throw new Error(`فشل الاتصال بالخادم HTTP ${response.status}`);
    }

    if (!response.ok || !json.success) {
      throw new Error(json.error || `فشل تعديل المادة (${response.status})`);
    }

    return {
      success: true,
      projectId: json.projectId || projectId,
      materialId: json.materialId,
      material: json.material,
    };
  }
}

export const materialManagementClientService = new MaterialManagementClientService();
