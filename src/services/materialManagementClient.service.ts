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
}

export const materialManagementClientService = new MaterialManagementClientService();
