import { RelationshipContext } from '../types/dataQuality';
import { adminConsoleService } from '../services/adminConsole.service';

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
