import type {OperationalConfiguration,DriverIntakeMode,MeasurementMode} from '../../types/operationalProfile';
import {accountProfile,commandDatabase} from './commandDatabase';
export const profileCases=[['WEIGHBRIDGE','WEIGHBRIDGE','DUAL_WEIGHBRIDGE'],['WEIGHBRIDGE','NONE','LOADING_SCALE_ONLY'],['NONE','WEIGHBRIDGE','UNLOADING_SCALE_ONLY'],['NONE','NONE','NO_WEIGHBRIDGE']] as const;
export const driverModes=['PRELOADED_ROSTER','ON_FIRST_OPERATION','MIXED'] as const;
export function operationConfig(loading:MeasurementMode='NONE',unloading:MeasurementMode='NONE',driverIntakeMode:DriverIntakeMode='ON_FIRST_OPERATION'):OperationalConfiguration{return {schemaVersion:1,loadingMeasurementMode:loading,unloadingMeasurementMode:unloading,driverIntakeMode,routeConfiguration:{loadingLocation:'Origin',unloadingLocation:'Destination',expectedTravelMinutes:60,toleranceMinutes:10},capacityEstimationPolicy:{mode:'NONE'},shiftConfiguration:{mode:'NONE'}};}
export const operationActor={userId:'actor',role:'SUPER_ADMIN',displayName:'',email:'',assignedProjectIds:['P1']} as any;
export function operationGraph(config:OperationalConfiguration,knownDriver=true){
 const store:Record<string,any>={'users/actor':accountProfile(),'projects/P1':{projectId:'P1',nameAr:'Valid project',nameEn:'Project',status:'APPROVED',version:1,settings:{},operationalConfiguration:config}};
 for(const [kind,id] of [['carrier','C'],['truck','T'],['material','M'],...(knownDriver?[['driver','D']]:[])]){store[`${kind}s/${id}`]={[kind+'Id']:id,status:'ACTIVE',...(kind==='material'?{nameAr:'Material',unitOfMeasure:'TON'}:kind==='truck'?{plate:'ABC',tareWeightKg:10000,legalPayloadLimitKg:25000,truckType:'DUMPER'}:kind==='driver'?{fullNameAr:'Driver',nationalId:'1234567890'}:{nameAr:'Carrier'})};store[`projects/P1/${kind}_memberships/${id}`]={projectId:'P1',[kind+'Id']:id,status:'ACTIVE'};}
 for(const [kind,id] of [['truck','T'],...(knownDriver?[['driver','D']]:[])])store[`projects/P1/${kind}_carrier_affiliations/${id}`]={projectId:'P1',[kind+'Id']:id,carrierId:'C',status:'ACTIVE'};
 const interval={projectId:'P1',status:'ACTIVE',effectiveFrom:'2020-01-01T00:00:00Z',effectiveTo:null};
 if(knownDriver){store['projects/P1/driver_truck_assignments/A']={...interval,assignmentId:'A',driverId:'D',truckId:'T'};for(const [kind,id] of [['driver','D'],['truck','T']])store[`projects/P1/${kind}_active_assignments/${id}`]={assignmentId:'A'};}
 store['projects/P1/truck_material_allocations/L']={...interval,allocationId:'L',truckId:'T',materialId:'M'};
 store['projects/P1/truck_active_material_allocations/T']={allocationId:'L'};
 store['projects/P1/pricing_rules/R']={projectId:'P1',pricingRuleId:'R',carrierId:'C',materialId:'M',status:'ACTIVE',pricingModel:'PER_TRIP',baseRateSAR:10,effectiveFrom:'2020-01-01',effectiveTo:'2099-01-01'};
 return commandDatabase(store);
}
