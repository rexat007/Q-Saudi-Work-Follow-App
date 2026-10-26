import type { SetupFleetContext, SetupParticipant } from '../types/setupFleet';

/** Selector guidance only. B1/B2/B3 revalidate every command on the server. */
export function eligibleSetupParticipants(context: SetupFleetContext, kind: SetupParticipant['kind']) {
  return context.participants.filter(p => p.kind === kind && p.eligible && !p.issue);
}
export function eligibleAffiliatedParticipants(context: SetupFleetContext, kind: 'DRIVER' | 'TRUCK') {
  const carriers = new Set(eligibleSetupParticipants(context, 'CARRIER').map(p => p.id));
  return eligibleSetupParticipants(context, kind).filter(p => p.affiliation?.status === 'ACTIVE' && carriers.has(p.affiliation.carrierId));
}
export function assignmentPreview(context: SetupFleetContext, driverId: string, truckId: string) {
  const driver = eligibleAffiliatedParticipants(context, 'DRIVER').find(p => p.id === driverId);
  const truck = eligibleAffiliatedParticipants(context, 'TRUCK').find(p => p.id === truckId);
  if (!driver || !truck || driver.affiliation!.carrierId !== truck.affiliation!.carrierId) return null;
  const affected = [...new Map([driver.assignment, truck.assignment].filter(Boolean).map(r => [r!.assignmentId, r!])).values()];
  const unchanged = affected.length === 1 && affected[0].driverId === driverId && affected[0].truckId === truckId;
  return { command: affected.length && !unchanged ? 'REASSIGN' : 'ASSIGN', affected, driverId, truckId };
}
export function allocationPreview(context: SetupFleetContext, truckId: string, materialId: string) {
  const truck = eligibleAffiliatedParticipants(context, 'TRUCK').find(p => p.id === truckId);
  const material = eligibleSetupParticipants(context, 'MATERIAL').find(p => p.id === materialId);
  if (!truck || !material) return null;
  return { command: truck.allocation && truck.allocation.materialId !== materialId ? 'REALLOCATE' : 'ALLOCATE', current: truck.allocation, truckId, materialId };
}
