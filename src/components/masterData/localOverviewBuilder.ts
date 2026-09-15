import { ProjectMasterDataOverview } from '../../types/masterData';
import { CarrierEntity, MaterialEntity, TruckEntity, DriverEntity } from '../../types/entities';
import { adminConsoleService } from '../../services/adminConsole.service';

export function buildLocalOverview(
  projectId: string,
  carriers: CarrierEntity[],
  materials: MaterialEntity[],
  trucks: TruckEntity[],
  drivers: DriverEntity[]
): ProjectMasterDataOverview {
  const project = adminConsoleService.getProjects().find(p => p.projectId === projectId);
  
  const authCarrierIds = project?.authorizedCarrierIds || carriers.map(c => c.carrierId);
  const authMaterialIds = project?.authorizedMaterialIds || materials.map(m => m.materialId);

  const authorizedCarriers = carriers.filter(
    c => authCarrierIds.includes(c.carrierId) && c.status === 'ACTIVE'
  );

  const authorizedMaterials = materials.filter(
    m => authMaterialIds.includes(m.materialId) && m.status === 'ACTIVE'
  );

  const authorizedCarrierIdSet = new Set(authorizedCarriers.map(c => c.carrierId));

  const authorizedTrucks = trucks.filter(
    t => authorizedCarrierIdSet.has(t.carrierId) && t.status === 'ACTIVE'
  );

  const authorizedDrivers = drivers.filter(
    d => authorizedCarrierIdSet.has(d.carrierId) && d.status === 'ACTIVE'
  );

  return {
    projectId,
    projectNameAr: project?.nameAr || '',
    authorizedCarriers,
    authorizedMaterials,
    authorizedTrucks,
    authorizedDrivers,
    allCarriers: carriers,
    allMaterials: materials,
    allTrucks: trucks,
    allDrivers: drivers,
  };
}
