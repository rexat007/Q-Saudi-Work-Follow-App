import {
  ProjectDriverTruckAssignmentEntity,
  ActiveAssignmentSlotPayload,
} from '../types/projectDriverTruckAssignment';
import {
  projectDriverTruckAssignmentRepository,
  AssignDriverToTruckResult,
  CloseAssignmentResult,
} from '../repositories/projectDriverTruckAssignment.repository';

/**
 * ============================================================================
 * PHASE 6 — UNIT 2B-2: CANONICAL DRIVER ↔ TRUCK ASSIGNMENT SERVICE
 * ============================================================================
 * Exposes canonical operational methods:
 * - assignDriverToTruck (single canonical mutation path for new / reassignment)
 * - closeAssignment (explicit termination of active assignment)
 * - getActiveAssignmentByDriver
 * - getActiveAssignmentByTruck
 * - listDriverAssignmentHistory
 * - listTruckAssignmentHistory
 *
 * Strict Boundaries:
 * - Does NOT perform Material allocation (Unit 2C)
 * - Does NOT modify Trip dispatch or legacy Roster
 * - Does NOT mutate Global identity profiles
 * - Strict Precondition: Driver and Truck must share active project carrier affiliation
 */
export class ProjectDriverTruckAssignmentService {
  /**
   * Assign Driver to Truck (single canonical mutation entry)
   * Handles:
   * - initial assignment
   * - Driver changes Truck
   * - Truck changes Driver
   * - Idempotency
   */
  async assignDriverToTruck(
    projectId: string,
    driverId: string,
    truckId: string,
    actorId: string
  ): Promise<AssignDriverToTruckResult> {
    return await projectDriverTruckAssignmentRepository.assignDriverToTruck(
      projectId,
      driverId,
      truckId,
      actorId
    );
  }

  /**
   * Explicitly close an active assignment
   */
  async closeAssignment(
    projectId: string,
    assignmentId: string,
    actorId: string
  ): Promise<CloseAssignmentResult> {
    return await projectDriverTruckAssignmentRepository.closeAssignment(
      projectId,
      assignmentId,
      actorId
    );
  }

  /**
   * Get active assignment for Driver
   */
  async getActiveAssignmentByDriver(
    projectId: string,
    driverId: string
  ): Promise<ProjectDriverTruckAssignmentEntity | null> {
    return await projectDriverTruckAssignmentRepository.getActiveAssignmentByDriver(
      projectId,
      driverId
    );
  }

  /**
   * Get active assignment for Truck
   */
  async getActiveAssignmentByTruck(
    projectId: string,
    truckId: string
  ): Promise<ProjectDriverTruckAssignmentEntity | null> {
    return await projectDriverTruckAssignmentRepository.getActiveAssignmentByTruck(
      projectId,
      truckId
    );
  }

  /**
   * List historical intervals for Driver
   */
  async listDriverAssignmentHistory(
    projectId: string,
    driverId: string
  ): Promise<ProjectDriverTruckAssignmentEntity[]> {
    return await projectDriverTruckAssignmentRepository.listDriverAssignmentHistory(
      projectId,
      driverId
    );
  }

  /**
   * List historical intervals for Truck
   */
  async listTruckAssignmentHistory(
    projectId: string,
    truckId: string
  ): Promise<ProjectDriverTruckAssignmentEntity[]> {
    return await projectDriverTruckAssignmentRepository.listTruckAssignmentHistory(
      projectId,
      truckId
    );
  }

  /**
   * Direct slot pointer read for Driver
   */
  async getActiveDriverSlot(
    projectId: string,
    driverId: string
  ): Promise<ActiveAssignmentSlotPayload | null> {
    return await projectDriverTruckAssignmentRepository.getActiveDriverSlot(
      projectId,
      driverId
    );
  }

  /**
   * Direct slot pointer read for Truck
   */
  async getActiveTruckSlot(
    projectId: string,
    truckId: string
  ): Promise<ActiveAssignmentSlotPayload | null> {
    return await projectDriverTruckAssignmentRepository.getActiveTruckSlot(
      projectId,
      truckId
    );
  }
}

export const projectDriverTruckAssignmentService = new ProjectDriverTruckAssignmentService();
