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

export type OperationalChangeDomain =
  | 'MEASUREMENT_PROFILE'
  | 'DRIVER_INTAKE'
  | 'ROUTE'
  | 'SHIFT_WINDOWS'
  | 'CAPACITY_ESTIMATION'
  | 'REQUIRED_CHECKPOINTS';

export type AssessmentDecision = 'NO_CHANGE' | 'SAFE_APPLY' | 'REVIEW_REQUIRED' | 'BLOCKED';

export type WorkspaceImpactClass =
  | 'NONE'
  | 'REFRESH_REQUIRED'
  | 'IN_PLACE_MAINTENANCE_REQUIRED'
  | 'PARTIAL_WORKSPACE_RECOVERY_REQUIRED'
  | 'CROSS_PROFILE_MIGRATION_REQUIRED'
  | 'LEGACY_WORKSPACE_FROZEN';

export type HistoricalImpactClass =
  | 'NONE'
  | 'FUTURE_ONLY_SNAPSHOT_SAFE'
  | 'HISTORICAL_PROFILE_MIGRATION_REQUIRED';

export interface OperationalImpactAssessment {
  projectId: string;
  projectVersion: number;
  currentProfile: OperationalProfile | null;
  proposedProfile: OperationalProfile;
  changedDomains: OperationalChangeDomain[];
  hasTrips: boolean;
  workspaceState: 'NONE' | 'CONNECTED' | 'PARTIAL' | 'BUSY';
  workspaceImpact: WorkspaceImpactClass;
  historicalImpact: HistoricalImpactClass;
  decision: AssessmentDecision;
  reasons: string[];
  assessmentSignature: string;
}

export interface ConfigureOperationsInput {
  configuration: OperationalConfiguration;
  expectedVersion: number;
  acknowledgeLegacyDualCompatibility?: boolean;
  assessmentSignature?: string;
}
