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

export interface ProjectCanonicalRefreshExpectation {
  carrierId?: string;
  materialId?: string;
  carrierProfile?: ProjectCanonicalRefreshCarrierProfileExpectation;
}

export interface ProjectCanonicalRefreshSnapshot {
  materials: any[];
  carriers: any[];
  fleetRows: any[];
  relationshipContext: RelationshipContext;
}

export interface ProjectCanonicalRefreshOptions {
  expect?: ProjectCanonicalRefreshExpectation;
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

        // 1. Concurrently fetch canonical server read surfaces
        const [matRes, carRes, fleetRes] = await Promise.all([
          fetch(`/api/projects/${encodeURIComponent(cleanProjectId)}/materials`, { headers }),
          fetch(`/api/projects/${encodeURIComponent(cleanProjectId)}/carriers`, { headers }),
          fetch(`/api/projects/${encodeURIComponent(cleanProjectId)}/fleet-read-model`, { headers }),
        ]);

        // 2. HTTP Fail-Closed Checks
        if (!matRes.ok) {
          throw new Error(`CANONICAL_REFRESH_MATERIALS_FAILED: HTTP ${matRes.status}`);
        }
        if (!carRes.ok) {
          throw new Error(`CANONICAL_REFRESH_CARRIERS_FAILED: HTTP ${carRes.status}`);
        }
        if (!fleetRes.ok) {
          throw new Error(`CANONICAL_REFRESH_FLEET_FAILED: HTTP ${fleetRes.status}`);
        }

        const [matJson, carJson, fleetJson] = await Promise.all([
          matRes.json(),
          carRes.json(),
          fleetRes.json(),
        ]);

        const materials = Array.isArray(matJson.data) ? matJson.data : [];
        const carriers = Array.isArray(carJson.data) ? carJson.data : [];
        const fleetRows = Array.isArray(fleetJson.data?.rows) ? fleetJson.data.rows : [];

        // 3. Rebuild fresh RelationshipContext
        const relationshipContext = await canonicalRelationshipContextService.getProjectRelationshipContext(cleanProjectId);

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

        // Complete verified coherent snapshot
        return {
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
