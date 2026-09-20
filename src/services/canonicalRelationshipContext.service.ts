/**
 * CANONICAL RELATIONSHIP CONTEXT SERVICE
 * 
 * Phase 6 Canonical Relationship Context Read Authority.
 * 
 * Target Authority:
 * Global Identity + Project Membership + Carrier Affiliation + Active Assignment + Active Allocation
 *        ↓
 * Canonical Project Relationship Context Adapter (This Service)
 *        ↓
 * LoadingOperatorView & ImportCenterView
 * 
 * Invariants:
 * 1. Carrier eligibility: ACTIVE ProjectCarrierMembership (+ GlobalCarrier name).
 * 2. Material eligibility: ACTIVE ProjectMaterialMembership (+ GlobalMaterial name & code).
 * 3. Driver eligibility: ACTIVE ProjectDriverMembership (+ GlobalDriver name/phone/nationalId).
 * 4. Truck eligibility: ACTIVE ProjectTruckMembership (+ GlobalTruck plate).
 * 5. Driver Carrier: canonical active ProjectDriverCarrierAffiliation (validated against active carrier memberships).
 * 6. Truck Carrier: canonical active ProjectTruckCarrierAffiliation (validated against active carrier memberships).
 * 7. Driver↔Truck active assignment & Truck↔Material active allocation: sourced from Unified Project Fleet Read Model.
 * 8. Zero legacy repository usage (no driverRepository, truckRepository, carrierRepository, materialRepository).
 * 9. Fail-closed on dangling or incoherent relationships.
 */

import { RelationshipContext } from '../types/dataQuality';
import {
  projectCarrierMembershipRepository,
  projectMaterialMembershipRepository,
  projectDriverMembershipRepository,
  projectTruckMembershipRepository,
} from '../repositories/projectMembership.repository';
import {
  projectDriverCarrierAffiliationRepository,
  projectTruckCarrierAffiliationRepository,
} from '../repositories/projectCarrierAffiliation.repository';
import {
  globalCarrierRepository,
  globalMaterialRepository,
  globalDriverRepository,
  globalTruckRepository,
} from '../repositories/globalIdentity.repository';
import { projectFleetReadModelService } from './projectFleetReadModel.service';

export class CanonicalRelationshipContextService {
  /**
   * Asynchronously retrieves the canonical RelationshipContext for a specified project.
   * Throws if projectId is invalid, empty, or ALL.
   */
  async getProjectRelationshipContext(projectId: string): Promise<RelationshipContext> {
    if (!projectId || !projectId.trim() || projectId.trim() === 'ALL') {
      throw new Error('INVALID_PROJECT_ID: projectId must be a valid non-empty project identifier and cannot be ALL');
    }

    const cleanProjectId = projectId.trim();

    // 1. Concurrently fetch all active project memberships and unified fleet read model
    const [
      carrierMemberships,
      materialMemberships,
      driverMemberships,
      truckMemberships,
      fleetReadModel,
    ] = await Promise.all([
      projectCarrierMembershipRepository.listMemberships(cleanProjectId, 'ACTIVE'),
      projectMaterialMembershipRepository.listMemberships(cleanProjectId, 'ACTIVE'),
      projectDriverMembershipRepository.listMemberships(cleanProjectId, 'ACTIVE'),
      projectTruckMembershipRepository.listMemberships(cleanProjectId, 'ACTIVE'),
      projectFleetReadModelService.getProjectFleetReadModel(cleanProjectId),
    ]);

    // 2. Active Authorized IDs (Strict active membership authority)
    const authorizedCarrierIds = carrierMemberships.map(m => m.carrierId);
    const authorizedMaterialIds = materialMemberships.map(m => m.materialId);
    const activeDriverIds = driverMemberships.map(m => m.driverId);
    const activeTruckIds = truckMemberships.map(m => m.truckId);

    const authorizedCarrierSet = new Set(authorizedCarrierIds);

    // 3. Hydrate Global Identities & Affiliations in parallel
    const [
      globalCarriers,
      globalMaterials,
      driverAffiliationsAndGlobals,
      truckAffiliationsAndGlobals,
    ] = await Promise.all([
      // Carriers
      globalCarrierRepository.listByIds(authorizedCarrierIds),
      // Materials
      globalMaterialRepository.listByIds(authorizedMaterialIds),
      // Drivers: fetch affiliation + global identity
      Promise.all(
        activeDriverIds.map(async (driverId) => {
          const [affil, globalEntity] = await Promise.all([
            projectDriverCarrierAffiliationRepository.getAffiliation(cleanProjectId, driverId),
            globalDriverRepository.findById(driverId),
          ]);
          return { driverId, affil, globalEntity };
        })
      ),
      // Trucks: fetch affiliation + global identity
      Promise.all(
        activeTruckIds.map(async (truckId) => {
          const [affil, globalEntity] = await Promise.all([
            projectTruckCarrierAffiliationRepository.getAffiliation(cleanProjectId, truckId),
            globalTruckRepository.findById(truckId),
          ]);
          return { truckId, affil, globalEntity };
        })
      ),
    ]);

    // 4. Construct Known Carriers
    const carrierMap = new Map(globalCarriers.map(c => [c.carrierId, c]));
    const knownCarriers = authorizedCarrierIds.map(cId => {
      const gCarrier = carrierMap.get(cId);
      return {
        carrierId: cId,
        name: gCarrier?.nameAr || cId,
        status: 'ACTIVE' as const,
      };
    });

    // 5. Construct Known Materials
    const materialMap = new Map(globalMaterials.map(m => [m.materialId, m]));
    const knownMaterials = authorizedMaterialIds.map(mId => {
      const gMat = materialMap.get(mId);
      return {
        materialId: mId,
        name: gMat?.nameAr || gMat?.nameEn || mId,
        code: gMat?.code || '',
        status: 'ACTIVE' as const,
      };
    });

    // 6. Construct Known Drivers
    const knownDrivers = driverAffiliationsAndGlobals.map(({ driverId, affil, globalEntity }) => {
      let affiliatedCarrierId = '';
      if (affil && affil.status === 'ACTIVE' && affil.carrierId && authorizedCarrierSet.has(affil.carrierId)) {
        affiliatedCarrierId = affil.carrierId;
      }
      return {
        driverId,
        name: globalEntity?.fullNameAr || driverId,
        phone: globalEntity?.phone,
        idNumber: globalEntity?.nationalId,
        carrierId: affiliatedCarrierId,
        status: 'ACTIVE' as const,
      };
    });

    // 7. Construct Known Trucks
    const knownTrucks = truckAffiliationsAndGlobals.map(({ truckId, affil, globalEntity }) => {
      let affiliatedCarrierId = '';
      if (affil && affil.status === 'ACTIVE' && affil.carrierId && authorizedCarrierSet.has(affil.carrierId)) {
        affiliatedCarrierId = affil.carrierId;
      }
      return {
        truckId,
        plate: globalEntity?.plate || globalEntity?.normalizedPlate || truckId,
        carrierId: affiliatedCarrierId,
        status: 'ACTIVE' as const,
      };
    });

    // 8. Construct Active Driver Assignment & Material Allocation mapping from Fleet Read Model
    const activeDriverByTruck: Record<string, string> = {};
    const activeMaterialByTruck: Record<string, string> = {};

    if (fleetReadModel && Array.isArray(fleetReadModel.rows)) {
      for (const row of fleetReadModel.rows) {
        if (row.driverId) {
          activeDriverByTruck[row.truckId] = row.driverId;
        }
        if (row.materialId) {
          activeMaterialByTruck[row.truckId] = row.materialId;
        }
      }
    }

    return {
      projectId: cleanProjectId,
      authorizedCarrierIds,
      authorizedMaterialIds,
      knownCarriers,
      knownTrucks,
      knownDrivers,
      knownMaterials,
      activeDriverByTruck,
      activeMaterialByTruck,
    };
  }
}

export const canonicalRelationshipContextService = new CanonicalRelationshipContextService();
