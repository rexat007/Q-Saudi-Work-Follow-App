import { auth } from '../firebase/config';

export interface CarrierCreateInput {
  name: string;
  commercialRegistrationNo: string;
  transportLicenseNo?: string;
  contactPersonName?: string;
  contactPhone?: string;
  contactEmail?: string;
}

export interface CarrierCreationResult {
  success: boolean;
  projectId: string;
  carrierId: string;
  membershipStatus: string;
  error?: string;
}

export interface CarrierUpdateInput {
  name?: string;
  transportLicenseNo?: string | null;
  contactPersonName?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
}

export interface CarrierUpdateResult {
  success: boolean;
  projectId: string;
  carrierId: string;
  carrier: {
    carrierId: string;
    name: string;
    commercialRegistrationNo: string;
    transportLicenseNo?: string | null;
    contactPerson?: {
      name?: string;
      phone?: string;
      email?: string;
    } | null;
  };
  error?: string;
}

export class CarrierManagementClientService {
  /**
   * Dispatches server-authoritative project carrier setup command:
   * POST /api/projects/:projectId/setup-carrier
   */
  public async createProjectCarrier(
    projectId: string,
    input: CarrierCreateInput,
    overrideToken?: string
  ): Promise<CarrierCreationResult> {
    if (!projectId || !projectId.trim()) {
      throw new Error('INVALID_ARGUMENT: projectId is required');
    }

    const trimmedName = (input.name || '').trim();
    if (!trimmedName || trimmedName.length < 3) {
      throw new Error('INVALID_NAME: Carrier name must be at least 3 characters');
    }

    const crDigits = (input.commercialRegistrationNo || '').replace(/[^0-9]/g, '');
    if (!crDigits || crDigits.length !== 10) {
      throw new Error('INVALID_CR_NUMBER: Commercial Registration must be exactly 10 digits');
    }

    const token = overrideToken || (await auth.currentUser?.getIdToken());
    if (!token) {
      throw new Error('UNAUTHENTICATED: User must be signed in to create project carrier');
    }

    // Build payload cleanly without undefined or fabricated optional fields
    const carrierData: Record<string, any> = {
      name: trimmedName,
      commercialRegistrationNo: crDigits,
    };

    if (input.transportLicenseNo && input.transportLicenseNo.trim()) {
      carrierData.transportLicenseNo = input.transportLicenseNo.trim();
    }
    if (input.contactPersonName && input.contactPersonName.trim()) {
      carrierData.contactPersonName = input.contactPersonName.trim();
    }
    if (input.contactPhone && input.contactPhone.trim()) {
      carrierData.contactPhone = input.contactPhone.trim();
    }
    if (input.contactEmail && input.contactEmail.trim()) {
      carrierData.contactEmail = input.contactEmail.trim();
    }

    const response = await fetch(`/api/projects/${encodeURIComponent(projectId.trim())}/setup-carrier`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ carrierData }),
    });

    let json: any;
    try {
      json = await response.json();
    } catch {
      throw new Error(`فشل الاتصال بالخادم HTTP ${response.status}`);
    }

    if (!response.ok || !json.success) {
      throw new Error(json.error || `فشل إنشاء الناقل (${response.status})`);
    }

    return {
      success: true,
      projectId: json.projectId || projectId,
      carrierId: json.carrierId,
      membershipStatus: json.membershipStatus || 'ACTIVE',
    };
  }

  /**
   * Dispatches server-authoritative project carrier update command:
   * PATCH /api/projects/:projectId/carriers/:carrierId
   */
  public async updateProjectCarrier(
    projectId: string,
    carrierId: string,
    input: CarrierUpdateInput,
    overrideToken?: string
  ): Promise<CarrierUpdateResult> {
    if (!projectId || !projectId.trim()) {
      throw new Error('INVALID_ARGUMENT: projectId is required');
    }
    if (!carrierId || !carrierId.trim()) {
      throw new Error('INVALID_ARGUMENT: carrierId is required');
    }

    const token = overrideToken || (await auth.currentUser?.getIdToken());
    if (!token) {
      throw new Error('UNAUTHENTICATED: User must be signed in to update project carrier');
    }

    const carrierData: Record<string, any> = {};
    if (input.name !== undefined) {
      const trimmedName = input.name.trim();
      if (!trimmedName || trimmedName.length < 3) {
        throw new Error('INVALID_CARRIER_NAME: Carrier name must be at least 3 characters');
      }
      carrierData.name = trimmedName;
    }
    if (input.transportLicenseNo !== undefined) {
      carrierData.transportLicenseNo =
        input.transportLicenseNo && input.transportLicenseNo.trim()
          ? input.transportLicenseNo.trim()
          : null;
    }
    if (input.contactPersonName !== undefined) {
      carrierData.contactPersonName =
        input.contactPersonName && input.contactPersonName.trim()
          ? input.contactPersonName.trim()
          : null;
    }
    if (input.contactPhone !== undefined) {
      carrierData.contactPhone =
        input.contactPhone && input.contactPhone.trim()
          ? input.contactPhone.trim()
          : null;
    }
    if (input.contactEmail !== undefined) {
      carrierData.contactEmail =
        input.contactEmail && input.contactEmail.trim()
          ? input.contactEmail.trim()
          : null;
    }

    const response = await fetch(
      `/api/projects/${encodeURIComponent(projectId.trim())}/carriers/${encodeURIComponent(carrierId.trim())}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ carrierData }),
      }
    );

    let json: any;
    try {
      json = await response.json();
    } catch {
      throw new Error(`فشل الاتصال بالخادم HTTP ${response.status}`);
    }

    if (!response.ok || !json.success) {
      throw new Error(json.error || `فشل تعديل بيانات الناقل (${response.status})`);
    }

    return {
      success: true,
      projectId: json.projectId || projectId,
      carrierId: json.carrierId || carrierId,
      carrier: json.carrier,
    };
  }
}

export const carrierManagementClientService = new CarrierManagementClientService();
