import { RelationshipContext } from '../types/dataQuality';
import { adminConsoleService } from '../services/adminConsole.service';
import { CarrierEntity, DriverEntity, TruckEntity, MaterialEntity } from '../types/entities';

export interface MasterDataRelationshipInput {
  projectId: string;
  carriers: CarrierEntity[];
  drivers: DriverEntity[];
  trucks: TruckEntity[];
  materials: MaterialEntity[];
}

/**
 * Pure canonical relationship builder for project-scoped master data.
 * Performs zero side-effects, zero repository calls, zero adminConsoleService calls,
 * and enforces strict project scope with no ID-as-label substitution.
 */
export function buildRelationshipContextFromCanonical(
  input: MasterDataRelationshipInput
): RelationshipContext {
  if (!input || !input.projectId || input.projectId.trim() === '' || input.projectId === 'ALL') {
    throw new Error('projectId must be a valid project identifier and cannot be empty or ALL');
  }

  const carriers = input.carriers || [];
  const drivers = input.drivers || [];
  const trucks = input.trucks || [];
  const materials = input.materials || [];

  return {
    projectId: input.projectId,
    authorizedCarrierIds: carriers.map(c => c.carrierId),
    authorizedMaterialIds: materials.map(m => m.materialId),
    knownCarriers: carriers.map(c => ({
      carrierId: c.carrierId,
      name: c.name ?? c.companyNameAr ?? '',
      status: c.status,
    })),
    knownTrucks: trucks.map(t => ({
      truckId: t.truckId,
      plate: t.plate ?? t.plateNumberAr ?? '',
      carrierId: t.carrierId,
      status: t.status,
    })),
    knownDrivers: drivers.map(d => ({
      driverId: d.driverId,
      name: d.name ?? d.fullNameAr ?? '',
      phone: d.phone,
      idNumber: d.idNumber ?? d.nationalOrIqamaId,
      carrierId: d.carrierId,
      status: d.status,
    })),
    knownMaterials: materials.map(m => ({
      materialId: m.materialId,
      name: m.name ?? m.nameAr ?? '',
      code: m.code ?? '',
      status: m.status,
    })),
  };
}

/**
 * @deprecated Non-production legacy helper retained only for diagnostic/test compatibility. Production code must use canonical project-scoped repositories or buildRelationshipContextFromCanonical(...).
 */
export function buildRelationshipContext(projectId: string): RelationshipContext {
  const project = adminConsoleService.getProjects().find(p => p.projectId === projectId);
  return {
    projectId: projectId || 'ALL',
    authorizedCarrierIds: project?.authorizedCarrierIds || [],
    authorizedMaterialIds: project?.authorizedMaterialIds || [],
    knownCarriers: adminConsoleService.getCarriers().map(c => ({
      carrierId: c.carrierId,
      name: c.name,
      status: c.status
    })),
    knownTrucks: adminConsoleService.getTrucks().map(t => ({
      truckId: t.truckId,
      plate: t.plate,
      carrierId: t.carrierId,
      status: t.status
    })),
    knownDrivers: adminConsoleService.getDrivers().map(d => ({
      driverId: d.driverId,
      name: d.name,
      phone: d.phone,
      idNumber: d.idNumber,
      carrierId: d.carrierId,
      status: d.status
    })),
    knownMaterials: adminConsoleService.getMaterials().map(m => ({
      materialId: m.materialId,
      name: m.name,
      code: m.code || '',
      status: m.status
    }))
  };
}
