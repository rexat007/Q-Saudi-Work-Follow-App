import {
  ProjectTruckMaterialAllocationEntity,
  ActiveTruckMaterialSlotPayload,
} from '../types/projectTruckMaterialAllocation';
import {
  projectTruckMaterialAllocationRepository,
  AllocateTruckToMaterialResult,
  CloseTruckMaterialAllocationResult,
} from '../repositories/projectTruckMaterialAllocation.repository';

/**
 * ============================================================================
 * PHASE 6 — UNIT 2C: CANONICAL TRUCK ↔ MATERIAL ALLOCATION SERVICE
 * ============================================================================
 * Exposes canonical operational methods:
 * - allocateTruckToMaterial (single canonical mutation path for initial allocation, idempotency, and reallocation)
 * - closeTruckMaterialAllocation (explicit termination of active allocation)
 * - getActiveAllocationByTruck (resolves active allocation via deterministic slot pointer)
 * - listTruckMaterialHistory (descending historical intervals for a truck)
 * - getAllocation (direct lookup by allocationId)
 *
 * Strict Boundaries:
 * - Does NOT modify Pricing Rules, rates, or pricing resolution
 * - Does NOT modify Trip dispatch or legacy Roster
 * - Does NOT mutate Global identity profiles
 * - Strict Preconditions:
 *     1. Truck Membership is ACTIVE
 *     2. Truck Carrier Affiliation is ACTIVE
 *     3. Project Material Membership is ACTIVE
 * - Does NOT create Carrier-Material authorization records
 * - No Driver ownership of materials
 */
export class ProjectTruckMaterialAllocationService {
  /**
   * Allocate Truck to Material (single canonical mutation entry)
   * Handles:
   * - initial allocation
   * - idempotent repeat
   * - Material reallocation (closes old, creates new, updates slot pointer)
   */
  async allocateTruckToMaterial(
    projectId: string,
    truckId: string,
    materialId: string,
    actorId: string
  ): Promise<AllocateTruckToMaterialResult> {
    return await projectTruckMaterialAllocationRepository.allocateTruckToMaterial(
      projectId,
      truckId,
      materialId,
      actorId
    );
  }

  /**
   * Explicitly close an active allocation
   */
  async closeTruckMaterialAllocation(
    projectId: string,
    allocationId: string,
    actorId: string
  ): Promise<CloseTruckMaterialAllocationResult> {
    return await projectTruckMaterialAllocationRepository.closeTruckMaterialAllocation(
      projectId,
      allocationId,
      actorId
    );
  }

  /**
   * Get active allocation for Truck (via deterministic slot pointer)
   */
  async getActiveAllocationByTruck(
    projectId: string,
    truckId: string
  ): Promise<ProjectTruckMaterialAllocationEntity | null> {
    return await projectTruckMaterialAllocationRepository.getActiveAllocationByTruck(
      projectId,
      truckId
    );
  }

  /**
   * List historical intervals for Truck (descending by effectiveFrom)
   */
  async listTruckMaterialHistory(
    projectId: string,
    truckId: string
  ): Promise<ProjectTruckMaterialAllocationEntity[]> {
    return await projectTruckMaterialAllocationRepository.listTruckMaterialHistory(
      projectId,
      truckId
    );
  }

  /**
   * Get allocation by ID
   */
  async getAllocation(
    projectId: string,
    allocationId: string
  ): Promise<ProjectTruckMaterialAllocationEntity | null> {
    return await projectTruckMaterialAllocationRepository.getAllocation(
      projectId,
      allocationId
    );
  }
}

export const projectTruckMaterialAllocationService =
  new ProjectTruckMaterialAllocationService();
