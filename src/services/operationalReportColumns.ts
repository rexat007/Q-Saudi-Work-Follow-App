import type {OperationalConfiguration} from '../types/operationalProfile';
import {resolveOperationalProfile,resolveReportingCapabilities} from './operationalProfileResolver';
export const PROFILE_TRIP_COMMON_COLUMNS=['tripId','projectId','tripDate','carrierId','carrier','truckId','truck','driverId','driver','materialId','material','shift','loadingLocation','destination','loadingStartedAt','loadingCompletedAt','departedAt','expectedArrivalAt','arrivedAt','unloadingStartedAt','unloadingCompletedAt','completedAt','loadingDuration','dispatchDelay','travelDuration','arrivalVariance','waitingDuration','unloadingDuration','totalCycleDuration','truckIdleDuration','distanceKm','status','delayStatus','exception','lastEvent','elapsedMinutes'] as const;
export function profileTripColumns(c:OperationalConfiguration):string[]{
 const profile=resolveOperationalProfile(c),caps=resolveReportingCapabilities(c);
 return [...PROFILE_TRIP_COMMON_COLUMNS,...(caps.measuredLoading?['loadingMeasuredWeight']:[]),...(caps.measuredUnloading?['unloadingMeasuredWeight']:[]),...(profile!=='NO_WEIGHBRIDGE'||caps.estimatedProduction?['loadingEffectiveWeight','unloadingEffectiveWeight','loadingWeightBasis','unloadingWeightBasis']:[]),...(caps.weightReconciliation?['weightVariance','weightVariancePercent']:[])];
}
