export interface AffiliationInput {
  projectId: string;
  entityId: string;
  carrierId: string;
  entityType: 'driver' | 'truck';
}

export interface PureAffiliation {
  projectId: string;
  carrierId: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt?: any;
  createdBy?: string;
  updatedAt?: any;
  updatedBy?: string;
}

export interface PureAssignment {
  assignmentId: string;
  projectId: string;
  driverId: string;
  truckId: string;
  status: 'ACTIVE' | 'CLOSED';
  effectiveFrom: string;
  effectiveTo: string | null;
  createdAt: string;
  createdBy: string;
}

export interface PureAllocation {
  allocationId: string;
  projectId: string;
  truckId: string;
  materialId: string;
  status: 'ACTIVE' | 'CLOSED';
  effectiveFrom: string;
  effectiveTo: string | null;
  createdAt: string;
  createdBy: string;
}

export class CanonicalFleetRelationshipPolicy {
  /**
   * Evaluates the carrier affiliation transition logic according to canonical rules.
   */
  static evaluateAffiliation(
    input: AffiliationInput,
    existing: PureAffiliation | null,
    isIntake: boolean = false
  ): {
    action: 'CREATE' | 'REACTIVATE' | 'REASSIGN' | 'IDEMPOTENT';
    status: 'ACTIVE' | 'INACTIVE';
    carrierId: string;
  } {
    const { projectId, entityId, carrierId, entityType } = input;

    if (!existing) {
      return { action: 'CREATE', status: 'ACTIVE', carrierId };
    }

    // Integrity / Reassignment conflict check
    if (existing.carrierId !== carrierId) {
      if (isIntake) {
        throw new Error(
          `CARRIER_REASSIGNMENT_CONFLICT: ${
            entityType === 'driver' ? 'Driver' : 'Truck'
          } is already affiliated with Carrier ${existing.carrierId} in Project ${projectId}. Silently reassigning is blocked.`
        );
      }
      return { action: 'REASSIGN', status: 'ACTIVE', carrierId };
    }

    if (existing.status === 'ACTIVE') {
      return { action: 'IDEMPOTENT', status: 'ACTIVE', carrierId };
    }

    // Status is INACTIVE on the SAME carrier -> Must REACTIVATE
    return { action: 'REACTIVATE', status: 'ACTIVE', carrierId };
  }

  /**
   * Validates Assignment Pointer Integrity
   */
  static validateAssignmentPointers(
    driverId: string,
    truckId: string,
    currentDriverSlot: { assignmentId: string } | null,
    currentTruckSlot: { assignmentId: string } | null,
    resolvedDriverAssign: PureAssignment | null,
    resolvedTruckAssign: PureAssignment | null
  ): void {
    if (currentDriverSlot && resolvedDriverAssign) {
      if (resolvedDriverAssign.driverId !== driverId) {
        throw new Error(
          `ASSIGNMENT_POINTER_INTEGRITY_ERROR: Driver slot points to assignment ${resolvedDriverAssign.assignmentId} with mismatched driverId ${resolvedDriverAssign.driverId}`
        );
      }
    }
    if (currentTruckSlot && resolvedTruckAssign) {
      if (resolvedTruckAssign.truckId !== truckId) {
        throw new Error(
          `ASSIGNMENT_POINTER_INTEGRITY_ERROR: Truck slot points to assignment ${resolvedTruckAssign.assignmentId} with mismatched truckId ${resolvedTruckAssign.truckId}`
        );
      }
    }
  }

  /**
   * Checks if an assignment is idempotent
   */
  static isAssignmentIdempotent(
    driverId: string,
    truckId: string,
    currentDriverSlot: { assignmentId: string } | null,
    currentTruckSlot: { assignmentId: string } | null,
    resolvedDriverAssign: PureAssignment | null
  ): boolean {
    if (
      currentDriverSlot &&
      currentTruckSlot &&
      currentDriverSlot.assignmentId === currentTruckSlot.assignmentId &&
      resolvedDriverAssign &&
      resolvedDriverAssign.status === 'ACTIVE' &&
      resolvedDriverAssign.driverId === driverId &&
      resolvedDriverAssign.truckId === truckId
    ) {
      return true;
    }
    return false;
  }

  /**
   * Validates Allocation Pointer Integrity
   */
  static validateAllocationPointers(
    projectId: string,
    truckId: string,
    currentSlot: { allocationId: string } | null,
    resolvedAllocation: PureAllocation | null
  ): void {
    if (!currentSlot) return;

    if (!resolvedAllocation) {
      throw new Error(
        `ALLOCATION_POINTER_CORRUPTION: Active slot points to non-existent allocation ${currentSlot.allocationId}`
      );
    }
    if (resolvedAllocation.projectId !== projectId || resolvedAllocation.truckId !== truckId) {
      throw new Error(
        `ALLOCATION_POINTER_CORRUPTION: Active slot points to allocation ${resolvedAllocation.allocationId} with mismatched truck or project`
      );
    }
    if (resolvedAllocation.status !== 'ACTIVE' || resolvedAllocation.effectiveTo !== null) {
      throw new Error(
        `ALLOCATION_POINTER_CORRUPTION: Active slot points to inactive or closed allocation ${resolvedAllocation.allocationId}`
      );
    }
  }
}
