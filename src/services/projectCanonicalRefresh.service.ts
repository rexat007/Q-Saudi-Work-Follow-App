import { relationshipContextFromFleet } from '../utils/relationshipContextProjection';
import { auth } from '../firebase/config';
import { canonicalRelationshipContextService } from './canonicalRelationshipContext.service';
import { RelationshipContext } from '../types/dataQuality';
import { normalizePhone } from '../utils/normalization';

export interface ProjectCanonicalRefreshCarrierProfileExpectation {
  carrierId: string;
  name?: string;
  transportLicenseNo?: string | null;
  contactPersonName?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
}

export interface ProjectCanonicalRefreshMaterialProfileExpectation {
  materialId: string;
  name?: string;
  code?: string;
  unitOfMeasure?: string;
  standardDensityTonPerM3?: number | null;
}

export interface ProjectCanonicalRefreshExpectation {
  carrierId?: string;
  materialId?: string;
  carrierProfile?: ProjectCanonicalRefreshCarrierProfileExpectation;
  materialProfile?: ProjectCanonicalRefreshMaterialProfileExpectation;
}

export interface ProjectCanonicalRefreshSnapshot {
  pricingRules?: any[];
  project?: any;
  setup?: import('../types/setupFleet').SetupFleetContext;
  readiness?: any;
  materials: any[];
  carriers: any[];
  fleetRows: any[];
  relationshipContext: RelationshipContext;
}

export interface ProjectCanonicalRefreshOptions {
  expect?: ProjectCanonicalRefreshExpectation;
  isCurrent?: () => boolean;
  overrideToken?: string;
  maxAttempts?: number;
  delayMs?: number;
}

export class ProjectCanonicalRefreshService {
  /**
   * Authoritative canonical refresh barrier.
   * Reads fresh project materials, carriers, and fleet read model,
   * rebuilds RelationshipContext, verifies expected entity visibility/profile convergence,
   * and returns a coherent atomic snapshot.
   */
  async refresh(
    projectId: string,
    options?: ProjectCanonicalRefreshOptions
  ): Promise<ProjectCanonicalRefreshSnapshot> {
    if (!projectId || !projectId.trim() || projectId.trim() === 'ALL') {
      throw new Error('INVALID_ARGUMENT: projectId must be a valid non-empty string');
    }

    const cleanProjectId = projectId.trim();
    const token = options?.overrideToken || (await auth.currentUser?.getIdToken());
    if (!token) {
      throw new Error('UNAUTHENTICATED: User must be signed in to perform canonical refresh');
    }

    const maxAttempts = options?.maxAttempts ?? 3;
    const delayMs = options?.delayMs ?? 150;
    const expect = options?.expect;

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        };

        if(options?.isCurrent && !options.isCurrent())throw Object.assign(Error('REFRESH_STALE_GENERATION'),{code:'REFRESH_STALE_GENERATION'});
        const response=await fetch(`/api/projects/${encodeURIComponent(cleanProjectId)}/foundation-snapshot`,{headers});
        if(!response.ok)throw Error(`CANONICAL_REFRESH_FAILED: HTTP ${response.status}`);
        const json=await response.json(),payload=json.data;
        if(!json.success || payload?.projectId!==cleanProjectId || payload.consistency!=='SERVER_TRANSACTION_SNAPSHOT' || payload.project?.projectId!==cleanProjectId || payload.setup?.projectId!==cleanProjectId || !payload.readiness || !Array.isArray(payload.materials)||!Array.isArray(payload.carriers)||!Array.isArray(payload.fleetRows))throw Object.assign(Error('REFRESH_INCOHERENT: CANONICAL_REFRESH_NOT_CONVERGED'),{code:'REFRESH_INCOHERENT'});
        const {materials,carriers,fleetRows,relationshipContext}=payload;
        if(relationshipContext?.projectId!==cleanProjectId)throw Object.assign(Error('REFRESH_INCOHERENT: CANONICAL_REFRESH_NOT_CONVERGED'),{code:'REFRESH_INCOHERENT'});
        const sameIds=(left:string[],right:string[])=>JSON.stringify([...left].sort())===JSON.stringify([...right].sort());
        if(!sameIds(carriers.filter((x:any)=>x.isActive!==false&&x.status!=='INACTIVE').map((x:any)=>x.carrierId),relationshipContext.authorizedCarrierIds||[]) || !sameIds(materials.filter((x:any)=>x.isActive!==false&&x.status!=='INACTIVE').map((x:any)=>x.materialId),relationshipContext.authorizedMaterialIds||[]))throw Object.assign(Error('REFRESH_INCOHERENT: CANONICAL_REFRESH_NOT_CONVERGED'),{code:'REFRESH_INCOHERENT'});
        const projected=relationshipContextFromFleet(cleanProjectId,{projectId:cleanProjectId,rows:fleetRows} as any,{...relationshipContext,knownDrivers:relationshipContext.knownDrivers||[],knownTrucks:relationshipContext.knownTrucks||[],knownMaterials:relationshipContext.knownMaterials||[]});
        const sameMap=(a:any,b:any)=>JSON.stringify(Object.entries(a||{}).sort())===JSON.stringify(Object.entries(b||{}).sort());
        if(!sameMap(projected.activeDriverByTruck,relationshipContext.activeDriverByTruck)||!sameMap(projected.activeMaterialByTruck,relationshipContext.activeMaterialByTruck))throw Object.assign(Error('REFRESH_INCOHERENT: CANONICAL_REFRESH_NOT_CONVERGED'),{code:'REFRESH_INCOHERENT'});
        for(const [items,known,id] of [[carriers,relationshipContext.knownCarriers,'carrierId'],[materials,relationshipContext.knownMaterials,'materialId']] as any){
          for(const item of items.filter((x:any)=>x.isActive!==false&&x.status!=='INACTIVE')){if(!known?.some((k:any)=>k[id]===item[id]&&k.name===item.name))throw Object.assign(Error('REFRESH_INCOHERENT: CANONICAL_REFRESH_NOT_CONVERGED'),{code:'REFRESH_INCOHERENT'});}
        }
        if(options?.isCurrent && !options.isCurrent())throw Object.assign(Error('REFRESH_STALE_GENERATION'),{code:'REFRESH_STALE_GENERATION'});

        // 4. Expected Entity Convergence Checks
        if (expect?.carrierId) {
          const expectedCarrierId = expect.carrierId;
          const inCarriersList = carriers.some((c: any) => c.carrierId === expectedCarrierId);
          const inAuthCarriers = (relationshipContext.authorizedCarrierIds || []).includes(expectedCarrierId);
          const inKnownCarriers = (relationshipContext.knownCarriers || []).some(
            (c: any) => c.carrierId === expectedCarrierId
          );

          if (!inCarriersList || !inAuthCarriers || !inKnownCarriers) {
            throw new Error(
              `CANONICAL_REFRESH_NOT_CONVERGED: Carrier "${expectedCarrierId}" not visible across canonical surfaces (list=${inCarriersList}, auth=${inAuthCarriers}, known=${inKnownCarriers})`
            );
          }
        }

        if (expect?.materialId) {
          const expectedMaterialId = expect.materialId;
          const inMaterialsList = materials.some((m: any) => m.materialId === expectedMaterialId);
          const inAuthMaterials = (relationshipContext.authorizedMaterialIds || []).includes(expectedMaterialId);
          const inKnownMaterials = (relationshipContext.knownMaterials || []).some(
            (m: any) => m.materialId === expectedMaterialId
          );

          if (!inMaterialsList || !inAuthMaterials || !inKnownMaterials) {
            throw new Error(
              `CANONICAL_REFRESH_NOT_CONVERGED: Material "${expectedMaterialId}" not visible across canonical surfaces (list=${inMaterialsList}, auth=${inAuthMaterials}, known=${inKnownMaterials})`
            );
          }
        }

        // A2: Detailed Carrier Profile Convergence Check
        if (expect?.carrierProfile) {
          const profileExpect = expect.carrierProfile;
          const targetCarrierId = profileExpect.carrierId;

          const carrierItem = carriers.find((c: any) => c.carrierId === targetCarrierId);
          const inAuthCarriers = (relationshipContext.authorizedCarrierIds || []).includes(targetCarrierId);
          const knownCarrierItem = (relationshipContext.knownCarriers || []).find(
            (c: any) => c.carrierId === targetCarrierId
          );

          if (!carrierItem || !inAuthCarriers || !knownCarrierItem) {
            throw new Error(
              `CANONICAL_REFRESH_NOT_CONVERGED: Carrier "${targetCarrierId}" not visible across canonical surfaces (list=${!!carrierItem}, auth=${inAuthCarriers}, known=${!!knownCarrierItem})`
            );
          }

          // Verify updated name across carriers list and relationshipContext.knownCarriers
          if (profileExpect.name !== undefined) {
            const expName = profileExpect.name.trim();
            if (carrierItem.name !== expName) {
              throw new Error(
                `CANONICAL_REFRESH_NOT_CONVERGED: Carrier name mismatch in carriers list (expected "${expName}", got "${carrierItem.name}")`
              );
            }
            if (knownCarrierItem.name !== expName) {
              throw new Error(
                `CANONICAL_REFRESH_NOT_CONVERGED: Carrier name mismatch in knownCarriers (expected "${expName}", got "${knownCarrierItem.name}")`
              );
            }
          }

          // Verify transportLicenseNo
          if (profileExpect.transportLicenseNo !== undefined) {
            const expLic = profileExpect.transportLicenseNo ? profileExpect.transportLicenseNo.trim() : null;
            const actualLic = carrierItem.transportLicenseNo || null;
            if (expLic !== actualLic) {
              throw new Error(
                `CANONICAL_REFRESH_NOT_CONVERGED: Carrier transportLicenseNo mismatch (expected "${expLic}", got "${actualLic}")`
              );
            }
          }

          // Verify contactPersonName
          if (profileExpect.contactPersonName !== undefined) {
            const expName = profileExpect.contactPersonName ? profileExpect.contactPersonName.trim() : null;
            const actualName = carrierItem.contactPerson?.name || carrierItem.contactPersonName || null;
            if (expName !== actualName) {
              throw new Error(
                `CANONICAL_REFRESH_NOT_CONVERGED: Carrier contactPersonName mismatch (expected "${expName}", got "${actualName}")`
              );
            }
          }

          // Verify contactPhone
          if (profileExpect.contactPhone !== undefined) {
            const expPhone = profileExpect.contactPhone ? normalizePhone(profileExpect.contactPhone) : null;
            const rawActualPhone = carrierItem.contactPerson?.phone || carrierItem.contactPhone || null;
            const actualPhone = rawActualPhone ? normalizePhone(rawActualPhone) : null;
            if (expPhone !== actualPhone) {
              throw new Error(
                `CANONICAL_REFRESH_NOT_CONVERGED: Carrier contactPhone mismatch (expected "${expPhone}", got "${actualPhone}")`
              );
            }
          }

          // Verify contactEmail
          if (profileExpect.contactEmail !== undefined) {
            const expEmail = profileExpect.contactEmail ? profileExpect.contactEmail.trim().toLowerCase() : null;
            const rawActualEmail = carrierItem.contactPerson?.email || carrierItem.contactEmail || null;
            const actualEmail = rawActualEmail ? rawActualEmail.trim().toLowerCase() : null;
            if (expEmail !== actualEmail) {
              throw new Error(
                `CANONICAL_REFRESH_NOT_CONVERGED: Carrier contactEmail mismatch (expected "${expEmail}", got "${actualEmail}")`
              );
            }
          }
        }

        // B2: Detailed Material Profile Convergence Check
        if (expect?.materialProfile) {
          const profileExpect = expect.materialProfile;
          const targetMaterialId = profileExpect.materialId;

          const materialItem = materials.find((m: any) => m.materialId === targetMaterialId);
          const inAuthMaterials = (relationshipContext.authorizedMaterialIds || []).includes(targetMaterialId);
          const knownMaterialItem = (relationshipContext.knownMaterials || []).find(
            (m: any) => m.materialId === targetMaterialId
          );

          if (!materialItem || !inAuthMaterials || !knownMaterialItem) {
            throw new Error(
              `CANONICAL_REFRESH_NOT_CONVERGED: Material "${targetMaterialId}" not visible across canonical surfaces (list=${!!materialItem}, auth=${inAuthMaterials}, known=${!!knownMaterialItem})`
            );
          }

          // Verify updated name across materials list and relationshipContext.knownMaterials
          if (profileExpect.name !== undefined) {
            const expName = profileExpect.name.trim();
            if (materialItem.name !== expName && materialItem.nameAr !== expName) {
              throw new Error(
                `CANONICAL_REFRESH_NOT_CONVERGED: Material name mismatch in materials list (expected "${expName}", got "${materialItem.name}")`
              );
            }
            if (knownMaterialItem.name !== expName && (knownMaterialItem as any).nameAr !== expName) {
              throw new Error(
                `CANONICAL_REFRESH_NOT_CONVERGED: Material name mismatch in knownMaterials (expected "${expName}", got "${knownMaterialItem.name}")`
              );
            }
          }

          // Verify immutable code
          if (profileExpect.code !== undefined) {
            const expCode = profileExpect.code.trim().toUpperCase();
            const actualCode = (materialItem.code || '').trim().toUpperCase();
            if (expCode !== actualCode) {
              throw new Error(
                `CANONICAL_REFRESH_NOT_CONVERGED: Material code mismatch (expected "${expCode}", got "${actualCode}")`
              );
            }
          }

          // Verify unitOfMeasure
          if (profileExpect.unitOfMeasure !== undefined) {
            const expUnit = profileExpect.unitOfMeasure.trim().toUpperCase();
            const actualUnit = (materialItem.unitOfMeasure || '').trim().toUpperCase();
            if (expUnit !== actualUnit) {
              throw new Error(
                `CANONICAL_REFRESH_NOT_CONVERGED: Material unitOfMeasure mismatch (expected "${expUnit}", got "${actualUnit}")`
              );
            }
          }

          // Verify standardDensityTonPerM3
          if (profileExpect.standardDensityTonPerM3 !== undefined) {
            const expDensity = profileExpect.standardDensityTonPerM3 !== null ? Number(profileExpect.standardDensityTonPerM3) : null;
            const actualDensity = materialItem.standardDensityTonPerM3 !== undefined && materialItem.standardDensityTonPerM3 !== null
              ? Number(materialItem.standardDensityTonPerM3)
              : null;
            if (expDensity !== actualDensity) {
              throw new Error(
                `CANONICAL_REFRESH_NOT_CONVERGED: Material standardDensityTonPerM3 mismatch (expected "${expDensity}", got "${actualDensity}")`
              );
            }
          }
        }

        // Complete verified coherent snapshot
        return {
          pricingRules:payload.pricingRules, project:payload.project, setup:payload.setup, readiness:payload.readiness,
          materials,
          carriers,
          fleetRows,
          relationshipContext,
        };
      } catch (err: any) {
        lastError = err;
        if (attempt < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }
    }

    throw (
      lastError ||
      new Error(
        'CANONICAL_REFRESH_NOT_CONVERGED: Canonical refresh did not converge within bounded attempts'
      )
    );
  }
}

export const projectCanonicalRefreshService = new ProjectCanonicalRefreshService();
