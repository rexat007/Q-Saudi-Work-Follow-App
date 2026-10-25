import type { RelationshipContext } from '../types/dataQuality';
import type { ProjectFleetReadModelResponse } from '../types/projectFleetReadModel';
/** Mappings come exclusively from canonical Fleet rows, never repository guesses. */
export function relationshipContextFromFleet(projectId: string, fleet: ProjectFleetReadModelResponse, masters: Omit<RelationshipContext, 'projectId' | 'activeDriverByTruck' | 'activeMaterialByTruck'>): RelationshipContext {
  const activeDriverByTruck: Record<string, string> = {}, activeMaterialByTruck: Record<string, string> = {};
  for (const row of fleet.rows) {
    if (row.projectId !== projectId) throw new Error('CANONICAL_FLEET_PROJECT_MISMATCH');
    if (row.assignmentEligible && row.driverId && masters.knownTrucks.some(t => t.truckId === row.truckId) && masters.knownDrivers.some(d => d.driverId === row.driverId)) activeDriverByTruck[row.truckId] = row.driverId;
    if (row.allocationEligible && row.materialId && masters.knownTrucks.some(t => t.truckId === row.truckId) && masters.knownMaterials.some(m => m.materialId === row.materialId)) activeMaterialByTruck[row.truckId] = row.materialId;
  }
  return { projectId, ...masters, activeDriverByTruck, activeMaterialByTruck };
}
