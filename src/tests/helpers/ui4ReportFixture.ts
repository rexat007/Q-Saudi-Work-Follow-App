import type {OperationalConfiguration,MeasurementMode} from '../../types/operationalProfile';
// Browser-safe synthetic configuration; no server command/mock database import.
export function reportConfig(loading:MeasurementMode='NONE',unloading:MeasurementMode='NONE'):OperationalConfiguration{return {schemaVersion:1,loadingMeasurementMode:loading,unloadingMeasurementMode:unloading,driverIntakeMode:'ON_FIRST_OPERATION',routeConfiguration:{loadingLocation:'Origin',unloadingLocation:'Destination',expectedTravelMinutes:60,toleranceMinutes:10},capacityEstimationPolicy:{mode:'NONE'},shiftConfiguration:{mode:'NONE'}};}
import {snapshotOperationalConfiguration} from '../../services/operationalProfileResolver';
import type {TripEntity} from '../../types/entities';
export const reportNow='2026-11-01T12:00:00.000Z';
export function reportTrips(loading:'WEIGHBRIDGE'|'NONE'='WEIGHBRIDGE',unloading:'WEIGHBRIDGE'|'NONE'='WEIGHBRIDGE',projectId='P1'):TripEntity[]{
 const c=reportConfig(loading,unloading);c.routeConfiguration.expectedTravelMinutes=60;c.routeConfiguration.toleranceMinutes=10;
 return ['COMPLETED','IN_TRANSIT','AT_ORIGIN'].map((status,i)=>({tripId:'T'+i,projectId,projectCode:projectId,tripSerial:'S'+i,tripDate:'2026-11-01',carrierId:'C'+i,truckId:'TR'+i,driverId:'D'+i,materialId:'M'+i,status,sourceType:'MANUAL',createdAt:'2026-11-01T08:00:00Z',updatedAt:'2026-11-01T10:00:00Z',createdBy:'actor',updatedBy:'actor',version:1,
  carrierSnapshot:{companyNameAr:'ناقل معتمد '+i},truckSnapshot:{plateNumberAr:'أ ب ج '+i},driverSnapshot:{fullNameAr:'سائق معتمد '+i},materialSnapshot:{nameAr:'مادة '+i},projectSnapshot:{projectId,nameAr:'مشروع محفوظ',zatcaTaxNumber:'300000000000003'},
  weights:{originNetKg:loading==='WEIGHBRIDGE'?20000:null,destinationNetKg:unloading==='WEIGHBRIDGE'?19000:null},
  pricingSnapshot:{pricingType:'PER_TRIP',agreedRate:100,currency:'SAR',settlementBase:'PER_TRIP',settlementAmount:100,pricingRuleId:'R',pricingSnapshotAt:'2026-11-01T08:00:00Z',isPending:false},financials:{isFinalized:true,currency:'SAR',grossAmountSAR:100,adjustmentsSAR:0,exceptionDeductionsSAR:0,demurrageAmountSAR:0,finalAmountSAR:100},
  operationalSnapshot:snapshotOperationalConfiguration(c,1,null,{}),operationalTimeline:i===0?{departedAt:'2026-11-01T08:00:00Z',arrivedAt:'2026-11-01T09:10:00Z',completedAt:'2026-11-01T09:30:00Z'}:i===1?{departedAt:'2026-11-01T08:00:00Z',expectedArrivalAt:'2026-11-01T09:00:00Z'}:{arrivedAtOriginAt:'2026-11-01T10:00:00Z'},hasExceptions:i===1,activeExceptionCount:i===1?1:0
 } as unknown as TripEntity));
}
