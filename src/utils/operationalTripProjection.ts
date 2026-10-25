import { reportsEngineService } from '../services/reportsEngine.service';
// Reuse the existing canonical-to-presentation mapping at the cache boundary.
// Preserve canonical fields as well; this projection never authorizes a write.
export function operationalTripProjection(trip: any) {
  return trip?.weights ? { ...trip, ...reportsEngineService.adaptTripEntityToRecord(trip) } : trip;
}
