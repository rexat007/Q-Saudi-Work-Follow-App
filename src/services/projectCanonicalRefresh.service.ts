import { auth } from '../firebase/config';
import { canonicalRelationshipContextService } from './canonicalRelationshipContext.service';
import { RelationshipContext } from '../types/dataQuality';

export interface ProjectCanonicalRefreshExpectation {
  carrierId?: string;
  materialId?: string;
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
   * rebuilds RelationshipContext, verifies expected entity visibility,
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

        // Complete verified coherent snapshot
        return {
          materials,
          carriers,
          fleetRows,
          relationshipContext,
        };
      } catch (err: any) {
        lastError = err;
        // If HTTP fail-closed error, don't necessarily retry if it's an unrecoverable HTTP error
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
