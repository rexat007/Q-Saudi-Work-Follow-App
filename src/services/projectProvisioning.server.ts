import { adminDb } from '../firebase/admin';
import * as crypto from 'crypto';
import { 
  normalizeCode, 
  normalizeArabicText, 
  normalizePhone 
} from '../utils/normalization';

/**
 * Generates an opaque, cryptographically robust system ID.
 */
function generateOpaqueGlobalId(prefix: 'DRV' | 'TRK' | 'CAR' | 'MAT'): string {
  const hex = crypto.randomBytes(16).toString('hex'); // 128 bits of entropy
  return `${prefix}-${hex}`;
}

/**
 * Computes standardized token representation for natural key lookups
 */
function computeNaturalKeyToken(entityType: 'DRIVER' | 'TRUCK' | 'CARRIER' | 'MATERIAL', rawKey: string): string {
  let cleaned = rawKey.trim();
  if (entityType === 'DRIVER') {
    cleaned = cleaned.replace(/[^0-9]/g, '');
  } else if (entityType === 'TRUCK') {
    cleaned = cleaned.replace(/\s+/g, '_');
  } else if (entityType === 'CARRIER') {
    cleaned = cleaned.replace(/[^0-9]/g, '');
  } else if (entityType === 'MATERIAL') {
    cleaned = normalizeCode(cleaned);
  }
  
  const token = Buffer.from(cleaned, 'utf-8').toString('base64').replace(/[/+=]/g, '_');
  return `${entityType}_${token}`;
}

export class ProjectProvisioningAdminService {
  /**
   * Setup Project Material server-safely using adminDb
   */
  async setupProjectMaterial(projectId: string, materialData: any, context: { userId: string }): Promise<any> {
    if (!projectId) {
      throw new Error('INVALID_ARGUMENT: projectId is required');
    }
    if (!materialData || !materialData.code) {
      throw new Error('INVALID_ARGUMENT: material code is required');
    }

    const canonicalCode = normalizeCode(materialData.code);
    if (!canonicalCode || canonicalCode.length < 2) {
      throw new Error('INVALID_MATERIAL_CODE: Material code must be at least 2 characters');
    }

    // 1. Verify Project Exists
    const projectSnap = await adminDb.collection('projects').doc(projectId).get();
    if (!projectSnap.exists) {
      throw new Error(`PROJECT_NOT_FOUND: Project "${projectId}" does not exist.`);
    }

    // Resolving natural identity lookup token
    const lookupToken = computeNaturalKeyToken('MATERIAL', canonicalCode);
    const lookupRef = adminDb.collection('natural_identity_lookups').doc(lookupToken);

    // Perform fallback collection query outside the transaction to maintain clean transaction reads/writes
    let preTransactionMatchedId: string | null = null;
    const querySnap = await adminDb.collection('materials').where('code', '==', canonicalCode).get();
    if (!querySnap.empty) {
      preTransactionMatchedId = querySnap.docs[0].id;
    }

    const result = await adminDb.runTransaction(async (tx: any) => {
      // --- PHASE 1: ALL TRANSACTION READS (Occur BEFORE any transaction write) ---
      
      // Read 1: Read the natural identity lookup
      const lookupSnap = await tx.get(lookupRef);
      
      let materialId: string;
      let isNewGlobal = false;
      let mustRepairLookup = false;
      let globalMatRef = null;
      let globalMatSnap = null;

      if (lookupSnap.exists) {
        materialId = lookupSnap.data().systemId;
        globalMatRef = adminDb.collection('materials').doc(materialId);
        globalMatSnap = await tx.get(globalMatRef);
        
        // Safety: If lookup exists but points to a missing global document, fail closed!
        if (!globalMatSnap.exists) {
          throw new Error(`DANGLING_LOOKUP_DETECTED: Material lookup points to non-existent global material ID "${materialId}".`);
        }
      } else {
        // Lookup does not exist
        if (preTransactionMatchedId) {
          materialId = preTransactionMatchedId;
          globalMatRef = adminDb.collection('materials').doc(materialId);
          globalMatSnap = await tx.get(globalMatRef);
          
          if (!globalMatSnap.exists) {
            throw new Error(`DANGLING_LOOKUP_DETECTED: Fallback query points to non-existent global material ID "${materialId}".`);
          }
          mustRepairLookup = true;
        } else {
          // Genuinely new material
          materialId = generateOpaqueGlobalId('MAT');
          isNewGlobal = true;
        }
      }

      // Read 2: Read target Project Membership document
      const membershipDocRef = adminDb
        .collection('projects')
        .doc(projectId)
        .collection('material_memberships')
        .doc(materialId);

      const membershipSnap = await tx.get(membershipDocRef);

      // --- PHASE 2: VALIDATION & DECISION MAKING ---

      let membershipStatus = 'ACTIVE';
      let mustCreateMembership = false;

      if (membershipSnap.exists) {
        const currentMembership = membershipSnap.data();
        if (currentMembership.status !== 'ACTIVE') {
          throw new Error(
            `MEMBERSHIP_STATE_CONFLICT: Entity "${materialId}" is currently "${currentMembership.status}" in Project "${projectId}". Call setMembershipStatus('ACTIVE') to explicitly reactivate.`
          );
        } else {
          membershipStatus = currentMembership.status;
        }
      } else {
        mustCreateMembership = true;
      }

      // --- PHASE 3: ALL TRANSACTION WRITES ---

      if (isNewGlobal) {
        const globalMatData = {
          materialId,
          code: canonicalCode,
          nameAr: normalizeArabicText(materialData.nameAr || materialData.name || 'مادة جديدة'),
          nameEn: materialData.nameEn ? materialData.nameEn.trim() : undefined,
          unitOfMeasure: materialData.unitOfMeasure || 'TON',
          standardDensityTonPerM3: materialData.standardDensityTonPerM3 !== undefined ? Number(materialData.standardDensityTonPerM3) : undefined,
          maxAllowableMoisturePercent: materialData.maxAllowableMoisturePercent !== undefined ? Number(materialData.maxAllowableMoisturePercent) : undefined,
          status: materialData.status || 'ACTIVE',
          createdAt: new Date(),
          createdBy: context.userId,
          updatedAt: new Date(),
          updatedBy: context.userId,
        };

        const matDocRef = adminDb.collection('materials').doc(materialId);
        tx.set(matDocRef, globalMatData);
        tx.set(lookupRef, {
          entityType: 'MATERIAL',
          systemId: materialId,
          createdAt: new Date(),
          createdBy: context.userId,
        });
      } else if (mustRepairLookup) {
        tx.set(lookupRef, {
          entityType: 'MATERIAL',
          systemId: materialId,
          createdAt: new Date(),
          createdBy: context.userId,
        });
      }

      if (mustCreateMembership) {
        const newMembership = {
          projectId,
          materialId,
          status: 'ACTIVE',
          statusChangedAt: new Date(),
          createdAt: new Date(),
          createdBy: context.userId,
          updatedAt: new Date(),
          updatedBy: context.userId,
        };
        tx.set(membershipDocRef, newMembership);
      }

      return { materialId, membershipStatus };
    });

    return {
      projectId,
      materialId: result.materialId,
      membershipStatus: result.membershipStatus,
    };
  }

  /**
   * Setup Project Carrier server-safely using adminDb
   */
  async setupProjectCarrier(projectId: string, carrierData: any, context: { userId: string }): Promise<any> {
    if (!projectId) {
      throw new Error('INVALID_ARGUMENT: projectId is required');
    }
    if (!carrierData || !carrierData.commercialRegistrationNo) {
      throw new Error('INVALID_ARGUMENT: commercial registration number is required');
    }

    const crDigits = carrierData.commercialRegistrationNo.replace(/[^0-9]/g, '');
    if (!crDigits || crDigits.length !== 10) {
      throw new Error('INVALID_CR_NUMBER: Commercial Registration must be exactly 10 digits');
    }

    // 1. Verify Project Exists
    const projectSnap = await adminDb.collection('projects').doc(projectId).get();
    if (!projectSnap.exists) {
      throw new Error(`PROJECT_NOT_FOUND: Project "${projectId}" does not exist.`);
    }

    // Resolving natural identity lookup token
    const lookupToken = computeNaturalKeyToken('CARRIER', crDigits);
    const lookupRef = adminDb.collection('natural_identity_lookups').doc(lookupToken);

    // Perform fallback collection query outside the transaction to maintain clean transaction reads/writes
    let preTransactionMatchedId: string | null = null;
    const querySnap = await adminDb.collection('carriers').where('commercialRegistrationNo', '==', crDigits).get();
    if (!querySnap.empty) {
      preTransactionMatchedId = querySnap.docs[0].id;
    }

    const result = await adminDb.runTransaction(async (tx: any) => {
      // --- PHASE 1: ALL TRANSACTION READS (Occur BEFORE any transaction write) ---
      
      // Read 1: Read the natural identity lookup
      const lookupSnap = await tx.get(lookupRef);

      let carrierId: string;
      let isNewGlobal = false;
      let mustRepairLookup = false;
      let globalCarRef = null;
      let globalCarSnap = null;

      if (lookupSnap.exists) {
        carrierId = lookupSnap.data().systemId;
        globalCarRef = adminDb.collection('carriers').doc(carrierId);
        globalCarSnap = await tx.get(globalCarRef);

        // Safety: If lookup exists but points to a missing global document, fail closed!
        if (!globalCarSnap.exists) {
          throw new Error(`DANGLING_LOOKUP_DETECTED: Carrier lookup points to non-existent global carrier ID "${carrierId}".`);
        }
      } else {
        // Lookup does not exist
        if (preTransactionMatchedId) {
          carrierId = preTransactionMatchedId;
          globalCarRef = adminDb.collection('carriers').doc(carrierId);
          globalCarSnap = await tx.get(globalCarRef);

          if (!globalCarSnap.exists) {
            throw new Error(`DANGLING_LOOKUP_DETECTED: Fallback query points to non-existent global carrier ID "${carrierId}".`);
          }
          mustRepairLookup = true;
        } else {
          // Genuinely new carrier
          carrierId = generateOpaqueGlobalId('CAR');
          isNewGlobal = true;
        }
      }

      // Read 2: Read target Project Membership document
      const membershipDocRef = adminDb
        .collection('projects')
        .doc(projectId)
        .collection('carrier_memberships')
        .doc(carrierId);

      const membershipSnap = await tx.get(membershipDocRef);

      // --- PHASE 2: VALIDATION & DECISION MAKING ---

      let membershipStatus = 'ACTIVE';
      let mustCreateMembership = false;

      if (membershipSnap.exists) {
        const currentMembership = membershipSnap.data();
        if (currentMembership.status !== 'ACTIVE') {
          throw new Error(
            `MEMBERSHIP_STATE_CONFLICT: Entity "${carrierId}" is currently "${currentMembership.status}" in Project "${projectId}". Call setMembershipStatus('ACTIVE') to explicitly reactivate.`
          );
        } else {
          membershipStatus = currentMembership.status;
        }
      } else {
        mustCreateMembership = true;
      }

      // --- PHASE 3: ALL TRANSACTION WRITES ---

      if (isNewGlobal) {
        let contactPerson = undefined;
        if (carrierData.contactPerson) {
          contactPerson = {
            name: (carrierData.contactPerson.name || '').trim() || undefined,
            phone: carrierData.contactPerson.phone ? normalizePhone(carrierData.contactPerson.phone) : undefined,
            email: (carrierData.contactPerson.email || '').trim() || undefined,
          };
        } else if (carrierData.contactPersonName || carrierData.contactPhone || carrierData.contactEmail) {
          contactPerson = {
            name: (carrierData.contactPersonName || '').trim() || undefined,
            phone: carrierData.contactPhone ? normalizePhone(carrierData.contactPhone) : undefined,
            email: (carrierData.contactEmail || '').trim() || undefined,
          };
        }

        const globalCarData = {
          carrierId,
          nameAr: normalizeArabicText(carrierData.name || carrierData.nameAr || 'ناقل جديد'),
          commercialRegistrationNo: crDigits,
          transportLicenseNo: carrierData.transportLicenseNo ? carrierData.transportLicenseNo.trim() : undefined,
          vatNumber: carrierData.vatNumber ? carrierData.vatNumber.trim() : undefined,
          contactPerson,
          status: carrierData.status || 'ACTIVE',
          createdAt: new Date(),
          createdBy: context.userId,
          updatedAt: new Date(),
          updatedBy: context.userId,
        };

        const carDocRef = adminDb.collection('carriers').doc(carrierId);
        tx.set(carDocRef, globalCarData);
        tx.set(lookupRef, {
          entityType: 'CARRIER',
          systemId: carrierId,
          createdAt: new Date(),
          createdBy: context.userId,
        });
      } else if (mustRepairLookup) {
        tx.set(lookupRef, {
          entityType: 'CARRIER',
          systemId: carrierId,
          createdAt: new Date(),
          createdBy: context.userId,
        });
      }

      if (mustCreateMembership) {
        const newMembership = {
          projectId,
          carrierId,
          status: 'ACTIVE',
          statusChangedAt: new Date(),
          createdAt: new Date(),
          createdBy: context.userId,
          updatedAt: new Date(),
          updatedBy: context.userId,
        };
        tx.set(membershipDocRef, newMembership);
      }

      return { carrierId, membershipStatus };
    });

    return {
      projectId,
      carrierId: result.carrierId,
      membershipStatus: result.membershipStatus,
    };
  }

  /**
   * List Project Materials server-safely using adminDb (only returns active project setup data)
   */
  async listProjectMaterials(projectId: string): Promise<any[]> {
    if (!projectId) return [];
    
    const membershipsSnap = await adminDb
      .collection('projects')
      .doc(projectId)
      .collection('material_memberships')
      .get();

    const memberships = membershipsSnap.docs.map((doc: any) => doc.data());
    const activeMemberships = memberships.filter((m: any) => m.status === 'ACTIVE');
    if (activeMemberships.length === 0) return [];

    const materialIds = activeMemberships.map((m: any) => m.materialId);
    
    const globalMaterials: any[] = [];
    for (const materialId of materialIds) {
      const docSnap = await adminDb.collection('materials').doc(materialId).get();
      if (docSnap.exists) {
        globalMaterials.push(docSnap.data());
      }
    }

    return activeMemberships.map((m: any) => {
      const g = globalMaterials.find((g: any) => g.materialId === m.materialId);
      return {
        materialId: m.materialId,
        name: g?.nameAr || 'غير معروف',
        code: g?.code || '—',
        unitOfMeasure: g?.unitOfMeasure || 'TON',
        membershipStatus: m.status,
        status: m.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE',
        isActive: m.status === 'ACTIVE',
      };
    });
  }

  /**
   * List Project Carriers server-safely using adminDb (only returns active project setup data)
   */
  async listProjectCarriers(projectId: string): Promise<any[]> {
    if (!projectId) return [];

    const membershipsSnap = await adminDb
      .collection('projects')
      .doc(projectId)
      .collection('carrier_memberships')
      .get();

    const memberships = membershipsSnap.docs.map((doc: any) => doc.data());
    const activeMemberships = memberships.filter((m: any) => m.status === 'ACTIVE');
    if (activeMemberships.length === 0) return [];

    const carrierIds = activeMemberships.map((m: any) => m.carrierId);

    const globalCarriers: any[] = [];
    for (const carrierId of carrierIds) {
      const docSnap = await adminDb.collection('carriers').doc(carrierId).get();
      if (docSnap.exists) {
        globalCarriers.push(docSnap.data());
      }
    }

    return activeMemberships.map((m: any) => {
      const g = globalCarriers.find((g: any) => g.carrierId === m.carrierId);
      return {
        carrierId: m.carrierId,
        name: g?.nameAr || 'غير معروف',
        commercialRegistrationNo: g?.commercialRegistrationNo || '—',
        transportLicenseNo: g?.transportLicenseNo || `TGA-${m.carrierId}`,
        contactPerson: g?.contactPerson || { name: 'Operations', phone: '—', email: '—' },
        membershipStatus: m.status,
        status: m.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE',
        isActive: m.status === 'ACTIVE',
      };
    });
  }
}
