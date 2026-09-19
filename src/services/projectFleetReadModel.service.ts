/**
 * PHASE 6 — UNIT 2D: UNIFIED PROJECT FLEET / ROSTER READ-MODEL CONVERGENCE
 *
 * Pure read-composition service.
 * Zero business mutation authority.
 * Zero Firestore writes.
 * Zero legacy Roster fallback.
 *
 * Composes canonical Project Truck Memberships, Truck Carrier Affiliations,
 * Driver-Truck Assignments (via Truck active slot), and Truck-Material Allocations (via Truck active slot)
 * with trusted server-authorized Global Identity display fields.
 */

import {
  ProjectFleetRowDTO,
  ProjectFleetReadModelResponse,
  FleetIntegrityIssue,
} from '../types/projectFleetReadModel';

import { projectTruckMembershipRepository } from '../repositories/projectMembership.repository';
import { projectTruckCarrierAffiliationRepository } from '../repositories/projectCarrierAffiliation.repository';
import { projectDriverTruckAssignmentRepository } from '../repositories/projectDriverTruckAssignment.repository';
import { projectTruckMaterialAllocationRepository } from '../repositories/projectTruckMaterialAllocation.repository';
import {
  globalTruckRepository,
  globalCarrierRepository,
  globalDriverRepository,
  globalMaterialRepository,
} from '../repositories/globalIdentity.repository';

export class ProjectFleetReadModelService {
  /**
   * Compose canonical Project Fleet Read Model for a given project.
   * Execution must be performed in trusted server context where access to
   * Global Identity display fields is authorized.
   */
  async getProjectFleetReadModel(projectId: string): Promise<ProjectFleetReadModelResponse> {
    if (!projectId || !projectId.trim()) {
      throw new Error('INVALID_ARGUMENT: projectId is required');
    }

    const cleanProjectId = projectId.trim();

    // 1. Fetch all ACTIVE Truck memberships in this project
    const activeTruckMemberships = await projectTruckMembershipRepository.listMemberships(
      cleanProjectId,
      'ACTIVE'
    );

    if (activeTruckMemberships.length === 0) {
      return {
        projectId: cleanProjectId,
        truckCount: 0,
        rows: [],
        generatedAt: new Date().toISOString(),
      };
    }

    // 2. Resolve relationships per active truck
    interface InterimTruckData {
      truckId: string;
      carrierId: string;
      carrierMismatch: boolean;
      driverId: string | null;
      materialId: string | null;
      integrityIssues: FleetIntegrityIssue[];
    }

    const interimData: InterimTruckData[] = [];

    // Unique IDs for global display hydration
    const uniqueTruckIds = new Set<string>();
    const uniqueCarrierIds = new Set<string>();
    const uniqueDriverIds = new Set<string>();
    const uniqueMaterialIds = new Set<string>();

    for (const tm of activeTruckMemberships) {
      const truckId = tm.truckId;
      uniqueTruckIds.add(truckId);

      const issues: FleetIntegrityIssue[] = [];

      // Resolve Truck Carrier Affiliation (Unit 2B-1)
      const truckAffiliation = await projectTruckCarrierAffiliationRepository.getAffiliation(
        cleanProjectId,
        truckId
      );

      let carrierId = '';
      if (!truckAffiliation || truckAffiliation.status !== 'ACTIVE' || !truckAffiliation.carrierId) {
        issues.push({
          code: 'MISSING_CARRIER_AFFILIATION',
          message: `Truck ${truckId} has no active carrier affiliation in project ${cleanProjectId}`,
        });
      } else {
        carrierId = truckAffiliation.carrierId;
        uniqueCarrierIds.add(carrierId);
      }

      // Resolve Active Driver Assignment (Unit 2B-2 via truck active slot)
      let driverId: string | null = null;
      try {
        const truckSlot = await projectDriverTruckAssignmentRepository.getActiveTruckSlot(
          cleanProjectId,
          truckId
        );

        if (truckSlot) {
          if (!truckSlot.assignmentId) {
            issues.push({
              code: 'INVALID_DRIVER_ASSIGNMENT_POINTER',
              message: `Active assignment slot for truck ${truckId} has missing assignmentId`,
            });
          } else {
            const assignment = await projectDriverTruckAssignmentRepository.getAssignment(
              cleanProjectId,
              truckSlot.assignmentId
            );

            if (!assignment || assignment.status !== 'ACTIVE' || !assignment.driverId) {
              issues.push({
                code: 'INVALID_DRIVER_ASSIGNMENT_POINTER',
                message: `Active assignment slot for truck ${truckId} points to non-existent or inactive assignment ${truckSlot.assignmentId}`,
              });
            } else {
              driverId = assignment.driverId;
              uniqueDriverIds.add(driverId);

              // Check carrier alignment if carrierId was established
              if (assignment.carrierId && carrierId && assignment.carrierId !== carrierId) {
                issues.push({
                  code: 'CARRIER_MISMATCH',
                  message: `Assigned driver ${driverId} carrier (${assignment.carrierId}) mismatches truck carrier (${carrierId})`,
                });
              }
            }
          }
        }
      } catch (err: any) {
        issues.push({
          code: 'INVALID_DRIVER_ASSIGNMENT_POINTER',
          message: err.message || `Error resolving active driver assignment for truck ${truckId}`,
        });
      }

      // Resolve Active Material Allocation (Unit 2C via truck active slot)
      let materialId: string | null = null;
      try {
        const activeAllocation = await projectTruckMaterialAllocationRepository.getActiveAllocationByTruck(
          cleanProjectId,
          truckId
        );

        if (activeAllocation) {
          if (activeAllocation.status === 'ACTIVE' && activeAllocation.materialId) {
            materialId = activeAllocation.materialId;
            uniqueMaterialIds.add(materialId);
          } else {
            issues.push({
              code: 'INVALID_MATERIAL_ALLOCATION_POINTER',
              message: `Active allocation slot for truck ${truckId} points to non-active or invalid allocation`,
            });
          }
        }
      } catch (err: any) {
        issues.push({
          code: 'INVALID_MATERIAL_ALLOCATION_POINTER',
          message: err.message || `Error resolving active material allocation for truck ${truckId}`,
        });
      }

      interimData.push({
        truckId,
        carrierId,
        carrierMismatch: issues.some((i) => i.code === 'CARRIER_MISMATCH'),
        driverId,
        materialId,
        integrityIssues: issues,
      });
    }

    // 3. Hydrate Global Display Identities (In parallel via Promise.all)
    const truckMap = new Map<string, { plate: string; truckType: string }>();
    const carrierMap = new Map<string, string>();
    const driverMap = new Map<string, string>();
    const materialMap = new Map<string, string>();

    await Promise.all([
      // Trucks
      ...Array.from(uniqueTruckIds).map(async (tId) => {
        const entity = await globalTruckRepository.findById(tId);
        if (entity) {
          truckMap.set(tId, {
            plate: entity.plate || entity.normalizedPlate || tId,
            truckType: entity.truckType || 'STANDARD',
          });
        }
      }),
      // Carriers
      ...Array.from(uniqueCarrierIds).map(async (cId) => {
        const entity = await globalCarrierRepository.findById(cId);
        if (entity) {
          carrierMap.set(cId, entity.nameAr || entity.nameEn || cId);
        }
      }),
      // Drivers
      ...Array.from(uniqueDriverIds).map(async (dId) => {
        const entity = await globalDriverRepository.findById(dId);
        if (entity) {
          driverMap.set(dId, entity.fullNameAr || entity.fullNameEn || dId);
        }
      }),
      // Materials
      ...Array.from(uniqueMaterialIds).map(async (mId) => {
        const entity = await globalMaterialRepository.findById(mId);
        if (entity) {
          materialMap.set(mId, entity.nameAr || entity.nameEn || mId);
        }
      }),
    ]);

    // 4. Construct Final Read Model Rows (Truck-Centric, PII-Minimized)
    const rows: ProjectFleetRowDTO[] = interimData.map((item) => {
      const truckMeta = truckMap.get(item.truckId) || { plate: item.truckId, truckType: 'STANDARD' };
      const carrierName = carrierMap.get(item.carrierId) || (item.carrierId ? item.carrierId : 'غير محدد');
      const driverName = item.driverId ? (driverMap.get(item.driverId) || item.driverId) : null;
      const materialName = item.materialId ? (materialMap.get(item.materialId) || item.materialId) : null;

      return {
        projectId: cleanProjectId,
        truckId: item.truckId,
        plateNumber: truckMeta.plate,
        truckType: truckMeta.truckType,

        carrierId: item.carrierId,
        carrierName,

        driverId: item.driverId,
        driverName,

        materialId: item.materialId,
        materialName,

        assignmentStatus: item.driverId ? 'ASSIGNMENT_ACTIVE' : 'UNASSIGNED_DRIVER',
        allocationStatus: item.materialId ? 'ALLOCATION_ACTIVE' : 'UNALLOCATED_MATERIAL',

        integrityIssues: item.integrityIssues,
      };
    });

    return {
      projectId: cleanProjectId,
      truckCount: rows.length,
      rows,
      generatedAt: new Date().toISOString(),
    };
  }
}

export const projectFleetReadModelService = new ProjectFleetReadModelService();
