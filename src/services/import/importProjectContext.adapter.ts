/**
 * Canonical Import Project Context Adapter
 * BETA 2 — SMART IMPORT FOUNDATION (UNIT 1)
 *
 * PURE FUNCTIONAL ADAPTER:
 * - No React hooks or components
 * - No Firebase / Firestore direct reads or writes
 * - No network calls or mutation
 *
 * Converts canonical RelationshipContext (from canonicalRelationshipContextService)
 * into PipelineContext.knownEntities shape required by unified import pipelines,
 * preserving canonical IDs, affiliations, and strict tenant isolation.
 */

import { RelationshipContext } from '../../types/dataQuality';
import { PipelineContext } from '../../types/unifiedImport';

export type PipelineKnownEntities = NonNullable<PipelineContext['knownEntities']>;

export interface CreatePipelineContextOptions {
  relContext?: RelationshipContext | null;
  projectId: string;
  userId: string;
  userName?: string;
  role?: string;
  operationId?: string;
  idempotencyKey?: string;
  allowWarningsCommit?: boolean;
  warningConfirmationNotes?: string;
  profile?: 'STANDARD' | 'WEIGHBRIDGE' | string;
  existingKeys?: Set<string>;
  pricingRules?: Record<string, any>;
}

export class ImportProjectContextAdapter {
  /**
   * Pure adapter that transforms canonical RelationshipContext into PipelineKnownEntities.
   * If relContext is null or invalid, returns a fail-closed empty knownEntities structure.
   */
  public static toPipelineKnownEntities(relContext: RelationshipContext | null | undefined): PipelineKnownEntities {
    if (!relContext || !relContext.projectId) {
      return {
        carrierIds: [],
        truckPlates: [],
        driverIds: [],
        materialCodes: [],
        truckCarrierMap: {},
        driverCarrierMap: {},
        carriers: [],
        trucks: [],
        drivers: [],
        materials: [],
        projectCarriers: [],
        projectMaterials: [],
        approvedAliases: {},
      };
    }

    const {
      projectId,
      authorizedCarrierIds = [],
      authorizedMaterialIds = [],
      knownCarriers = [],
      knownTrucks = [],
      knownDrivers = [],
      knownMaterials = [],
    } = relContext;

    // Filter to active entities
    const activeCarriers = knownCarriers.filter((c) => c.status === 'ACTIVE');
    const activeTrucks = knownTrucks.filter((t) => t.status === 'ACTIVE');
    const activeDrivers = knownDrivers.filter((d) => d.status === 'ACTIVE');
    const activeMaterials = knownMaterials.filter((m) => m.status === 'ACTIVE');

    // Mapped primitive arrays (preserving exact canonical IDs)
    const carrierIds: string[] = activeCarriers.map((c) => c.carrierId);
    const truckPlates: string[] = activeTrucks.map((t) => t.plate);
    const driverIds: string[] = activeDrivers.map((d) => d.driverId);
    const materialCodes: string[] = activeMaterials.map((m) => m.code || m.materialId);

    // Mapped affiliations
    const truckCarrierMap: Record<string, string> = {};
    for (const t of activeTrucks) {
      if (t.plate && t.carrierId) {
        truckCarrierMap[t.plate] = t.carrierId;
      }
    }

    const driverCarrierMap: Record<string, string> = {};
    for (const d of activeDrivers) {
      if (d.driverId && d.carrierId) {
        driverCarrierMap[d.driverId] = d.carrierId;
      }
    }

    // Extended entities matching PipelineKnownEntities contracts
    const carriers = activeCarriers.map((c) => ({
      carrierId: c.carrierId,
      name: c.name,
      projectId,
      status: c.status,
    }));

    const trucks = activeTrucks.map((t) => ({
      truckId: t.truckId,
      plate: t.plate,
      carrierId: t.carrierId,
      projectId,
      status: t.status,
    }));

    const drivers = activeDrivers.map((d) => ({
      driverId: d.driverId,
      name: d.name,
      idNumber: d.idNumber,
      carrierId: d.carrierId,
      phone: d.phone,
      projectId,
      status: d.status,
    }));

    const materials = activeMaterials.map((m) => ({
      materialId: m.materialId,
      name: m.name,
      code: m.code,
      projectId,
      status: m.status,
    }));

    const projectCarriers = authorizedCarrierIds.length > 0
      ? authorizedCarrierIds
      : carrierIds;

    const projectMaterials = authorizedMaterialIds.length > 0
      ? authorizedMaterialIds
      : materialCodes;

    return {
      carrierIds,
      truckPlates,
      driverIds,
      materialCodes,
      truckCarrierMap,
      driverCarrierMap,
      carriers,
      trucks,
      drivers,
      materials,
      projectCarriers,
      projectMaterials,
      approvedAliases: {},
    };
  }

  /**
   * Builds a complete, robust PipelineContext for import operations
   * from canonical RelationshipContext with fail-closed defaults.
   */
  public static createPipelineContext(options: CreatePipelineContextOptions): PipelineContext {
    const {
      relContext,
      projectId,
      userId,
      userName,
      role,
      operationId = `OP-IMP-${Date.now()}`,
      idempotencyKey,
      allowWarningsCommit = false,
      warningConfirmationNotes,
      profile,
      existingKeys,
      pricingRules,
    } = options;

    const knownEntities = this.toPipelineKnownEntities(relContext);

    return {
      projectId: (relContext && relContext.projectId) || projectId,
      userId,
      userName,
      role,
      operationId,
      idempotencyKey,
      allowWarningsCommit,
      warningConfirmationNotes,
      profile,
      existingKeys: existingKeys || new Set<string>(),
      knownEntities,
      pricingRules,
    };
  }
}
