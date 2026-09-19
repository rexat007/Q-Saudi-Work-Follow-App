import {
  ProjectDriverCarrierAffiliationEntity,
  ProjectTruckCarrierAffiliationEntity,
  AffiliationStatus,
} from '../types/projectCarrierAffiliation';
import {
  projectDriverCarrierAffiliationRepository,
  projectTruckCarrierAffiliationRepository,
  SetAffiliationResult,
  AffiliationAuditActor,
} from '../repositories/projectCarrierAffiliation.repository';

/**
 * ============================================================================
 * PHASE 6 — UNIT 2B-1: PROJECT CARRIER FLEET AFFILIATION SERVICE
 * ============================================================================
 * Canonical domain service orchestrating Driver-Carrier and Truck-Carrier affiliations.
 *
 * Exposes:
 * - Driver/Truck affiliation setters and status managers
 * - Carrier fleet listing
 * - Future Unit 2B-2 precondition helper: verifySameCarrierAffiliation(projectId, driverId, truckId)
 *
 * Strict Boundaries:
 * - Does NOT perform Driver-Truck pairing (Unit 2B-2)
 * - Does NOT perform Truck-Material allocation (Unit 2C)
 * - Does NOT dual-write to legacy entities or mutate global records
 */
export class ProjectCarrierFleetAffiliationService {
  /**
   * Set or reassign Driver Carrier affiliation in project
   */
  async setDriverCarrierAffiliation(
    projectId: string,
    driverId: string,
    carrierId: string,
    actorId: string,
    actorContext?: AffiliationAuditActor
  ): Promise<SetAffiliationResult<ProjectDriverCarrierAffiliationEntity>> {
    return await projectDriverCarrierAffiliationRepository.setAffiliation(
      projectId,
      driverId,
      carrierId,
      actorId,
      undefined,
      actorContext
    );
  }

  /**
   * Set or reassign Truck Carrier affiliation in project
   */
  async setTruckCarrierAffiliation(
    projectId: string,
    truckId: string,
    carrierId: string,
    actorId: string,
    actorContext?: AffiliationAuditActor
  ): Promise<SetAffiliationResult<ProjectTruckCarrierAffiliationEntity>> {
    return await projectTruckCarrierAffiliationRepository.setAffiliation(
      projectId,
      truckId,
      carrierId,
      actorId,
      undefined,
      actorContext
    );
  }

  /**
   * Set Driver Affiliation Status (ACTIVE / INACTIVE)
   */
  async setDriverAffiliationStatus(
    projectId: string,
    driverId: string,
    status: AffiliationStatus,
    actorId: string,
    actorContext?: AffiliationAuditActor
  ): Promise<ProjectDriverCarrierAffiliationEntity> {
    return await projectDriverCarrierAffiliationRepository.setAffiliationStatus(
      projectId,
      driverId,
      status,
      actorId,
      actorContext
    );
  }

  /**
   * Set Truck Affiliation Status (ACTIVE / INACTIVE)
   */
  async setTruckAffiliationStatus(
    projectId: string,
    truckId: string,
    status: AffiliationStatus,
    actorId: string,
    actorContext?: AffiliationAuditActor
  ): Promise<ProjectTruckCarrierAffiliationEntity> {
    return await projectTruckCarrierAffiliationRepository.setAffiliationStatus(
      projectId,
      truckId,
      status,
      actorId,
      actorContext
    );
  }

  /**
   * Get active Driver affiliation
   */
  async getDriverAffiliation(projectId: string, driverId: string): Promise<ProjectDriverCarrierAffiliationEntity | null> {
    return await projectDriverCarrierAffiliationRepository.getAffiliation(projectId, driverId);
  }

  /**
   * Get active Truck affiliation
   */
  async getTruckAffiliation(projectId: string, truckId: string): Promise<ProjectTruckCarrierAffiliationEntity | null> {
    return await projectTruckCarrierAffiliationRepository.getAffiliation(projectId, truckId);
  }

  /**
   * List all Drivers affiliated with a Carrier in a Project
   */
  async listDriversByCarrier(projectId: string, carrierId: string): Promise<ProjectDriverCarrierAffiliationEntity[]> {
    return await projectDriverCarrierAffiliationRepository.listAffiliationsByCarrier(projectId, carrierId);
  }

  /**
   * List all Trucks affiliated with a Carrier in a Project
   */
  async listTrucksByCarrier(projectId: string, carrierId: string): Promise<ProjectTruckCarrierAffiliationEntity[]> {
    return await projectTruckCarrierAffiliationRepository.listAffiliationsByCarrier(projectId, carrierId);
  }

  /**
   * Precondition Checker for upcoming Unit 2B-2 (Driver-Truck Assignment):
   * Validates:
   * 1. Driver has ACTIVE Carrier affiliation in Project
   * 2. Truck has ACTIVE Carrier affiliation in Project
   * 3. Both belong to the EXACT SAME Carrier
   */
  async verifySameCarrierAffiliation(
    projectId: string,
    driverId: string,
    truckId: string
  ): Promise<{ valid: boolean; carrierId?: string; reason?: string }> {
    const driverAffil = await this.getDriverAffiliation(projectId, driverId);
    if (!driverAffil || driverAffil.status !== 'ACTIVE') {
      return {
        valid: false,
        reason: `Driver ${driverId} does not have an ACTIVE carrier affiliation in project ${projectId}`,
      };
    }

    const truckAffil = await this.getTruckAffiliation(projectId, truckId);
    if (!truckAffil || truckAffil.status !== 'ACTIVE') {
      return {
        valid: false,
        reason: `Truck ${truckId} does not have an ACTIVE carrier affiliation in project ${projectId}`,
      };
    }

    if (driverAffil.carrierId !== truckAffil.carrierId) {
      return {
        valid: false,
        reason: `Carrier mismatch: Driver belongs to ${driverAffil.carrierId} while Truck belongs to ${truckAffil.carrierId}`,
      };
    }

    return {
      valid: true,
      carrierId: driverAffil.carrierId,
    };
  }
}

export const projectCarrierFleetAffiliationService = new ProjectCarrierFleetAffiliationService();
