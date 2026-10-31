import {WORKSPACE_TABS} from '../types/workspace';
export const MASTER_TABS = [
  {key:'DRIVERS',source:'drivers',primaryKey:'driverId',columns:['driverId','projectId','fullNameAr','idNumber','phone','licenseNumber','licenseValidUntil','carrierId','carrierName','assignedTruckId','status','membershipStatus','lastSyncedAt']},
  {key:'CARRIERS',source:'carriers',primaryKey:'carrierId',columns:['carrierId','projectId','companyNameAr','commercialRegistrationNo','transportLicenseNo','contactPhone','status','membershipStatus','lastSyncedAt']},
  {key:'MATERIALS',source:'materials',primaryKey:'materialId',columns:['materialId','projectId','nameAr','code','unitOfMeasure','standardDensityTonPerM3','status','membershipStatus','lastSyncedAt']},
  {key:'FLEET_ROSTER',source:'fleetRows',primaryKey:'truckId',columns:['truckId','projectId','plateNumber','truckType','carrierId','carrierName','driverId','driverName','materialId','materialName','mvpiValidUntil','insuranceValidUntil','status','membershipStatus','lastSyncedAt']},
] as const;
export const isMasterTab=(tab:string)=>MASTER_TABS.some(spec=>spec.key===tab);
export const masterTabTitle=(key:typeof MASTER_TABS[number]['key'])=>WORKSPACE_TABS[key].tabTitleAr;
export interface CanonicalWorkspaceMasterProjection {
  projectId:string;
  drivers:Record<string,any>[];
  carriers:Record<string,any>[];
  materials:Record<string,any>[];
  fleetRows:Record<string,any>[];
}
