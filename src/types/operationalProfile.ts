import type {GlobalTruckType} from './globalEntities';
export type MeasurementMode='WEIGHBRIDGE'|'NONE';
export type DriverIntakeMode='PRELOADED_ROSTER'|'ON_FIRST_OPERATION'|'MIXED';
export type OperationalProfile='DUAL_WEIGHBRIDGE'|'LOADING_SCALE_ONLY'|'UNLOADING_SCALE_ONLY'|'NO_WEIGHBRIDGE';
export type CapacityEstimationPolicy={mode:'NONE'}|{mode:'TRUCK_CAPACITY'}|{mode:'PROJECT_STANDARD';tonnes:number}|{mode:'MATERIAL_TRUCK_MATRIX';entries:Array<{truckType:GlobalTruckType;materialId:string;tonnes:number}>};
export type OperationalCheckpoint='loadingStartedAt'|'loadingCompletedAt'|'departedAt'|'arrivedAt'|'unloadingStartedAt'|'unloadingCompletedAt';
export interface OperationalConfiguration {
 schemaVersion:1;
 loadingMeasurementMode:MeasurementMode;unloadingMeasurementMode:MeasurementMode;driverIntakeMode:DriverIntakeMode;
 routeConfiguration:{loadingLocation:string;unloadingLocation:string;distanceKm?:number;expectedTravelMinutes?:number;toleranceMinutes?:number};
 shiftConfiguration:{mode:'NONE'|'DAY_NIGHT'|'CUSTOM';shifts?:Array<{id:string;nameAr:string;nameEn:string;startMinute:number;endMinute:number}>};
 capacityEstimationPolicy:CapacityEstimationPolicy;
 requiredCheckpoints?:OperationalCheckpoint[];
}
export type WeightBasis='MEASURED'|'DERIVED_FROM_LOADING'|'DERIVED_FROM_UNLOADING'|'ESTIMATED_TRUCK_CAPACITY'|'PROJECT_STANDARD'|'ESTIMATED_MATERIAL_TRUCK_MATRIX'|'UNAVAILABLE';
export interface OperationalWeights {
 loadingMeasuredWeight:number|null;unloadingMeasuredWeight:number|null;
 loadingEffectiveWeight:number|null;unloadingEffectiveWeight:number|null;
 loadingWeightBasis:WeightBasis;unloadingWeightBasis:WeightBasis;
 weightVariance:number|null;weightVariancePercent:number|null;
}
export type OperationalTimeline=Partial<Record<OperationalCheckpoint|'completedAt'|'expectedArrivalAt',string>>;
export interface TripOperationalSnapshot {schemaVersion:1;configuration:OperationalConfiguration;profile:OperationalProfile;configurationVersion:number;estimatedCapacityTonnes:number|null;driverAtDispatch:string|null}
