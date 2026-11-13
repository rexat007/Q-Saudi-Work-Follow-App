import {randomUUID} from 'node:crypto';
import {initializeApp,deleteApp} from 'firebase-admin/app';
import {getFirestore} from 'firebase-admin/firestore';
import {buildPrincipal} from '../../utils/principal';
export function operationalDocuments(projectId='P1',actorId='actor') {
  const docs:Record<string,any>={
    ['users/'+actorId]:{userId:actorId,fullName:'Synthetic operator',email:'operator@example.invalid',role:'PROJECT_ADMIN',assignedProjectIds:[projectId],status:'ACTIVE',isActive:true},
    ['projects/'+projectId]:{projectId,projectNumber:1,nameAr:'مشروع اختباري',nameEn:'Synthetic project',status:'ACTIVE'},
    'carriers/CAR':{carrierId:'CAR',nameAr:'ناقل محفوظ',status:'ACTIVE'},
    'materials/MAT':{materialId:'MAT',nameAr:'مادة محفوظة',unitOfMeasure:'TON',status:'ACTIVE'},
    'trucks/TRK':{truckId:'TRK',plate:'ABC123',status:'ACTIVE',tareWeightKg:10000},
    'drivers/DRV':{driverId:'DRV',fullNameAr:'سائق محفوظ',nationalId:'1234567890',status:'ACTIVE'},
  };
  const base='projects/'+projectId+'/';
  for(const [kind,id] of [['carrier','CAR'],['material','MAT'],['truck','TRK'],['driver','DRV']])docs[base+kind+'_memberships/'+id]={[kind+'Id']:id,projectId,status:'ACTIVE'};
  for(const [kind,id] of [['truck','TRK'],['driver','DRV']])docs[base+kind+'_carrier_affiliations/'+id]={[kind+'Id']:id,projectId,carrierId:'CAR',status:'ACTIVE'};
  docs[base+'driver_truck_assignments/ASG']={assignmentId:'ASG',projectId,driverId:'DRV',truckId:'TRK',status:'ACTIVE',effectiveFrom:'2020-01-01T00:00:00Z',effectiveTo:null};
  for(const [kind,id] of [['driver','DRV'],['truck','TRK']])docs[base+kind+'_active_assignments/'+id]={[kind+'Id']:id,projectId,assignmentId:'ASG'};
  docs[base+'truck_material_allocations/ALC']={allocationId:'ALC',projectId,truckId:'TRK',materialId:'MAT',status:'ACTIVE',effectiveFrom:'2020-01-01T00:00:00Z',effectiveTo:null};
  docs[base+'truck_active_material_allocations/TRK']={projectId,truckId:'TRK',allocationId:'ALC'};
  docs[base+'pricing_rules/PRICE']={pricingRuleId:'PRICE',projectId,carrierId:'CAR',materialId:'MAT',status:'ACTIVE',pricingType:'PER_TON',pricingModel:'PER_TON',baseRateSAR:12.5,rate:12.5,currency:'SAR',effectiveFrom:'2020-01-01',vatApplicable:true,vatRatePercent:15};
  return docs;
}
export const fleetPayload={carrierId:'CAR',materialId:'MAT',truckId:'TRK',driverId:'DRV',pricingRuleId:'PRICE'};
export async function emulatorFixture(){
  if(process.env.FIRESTORE_EMULATOR_HOST!=='127.0.0.1:8085')throw Error('EXPLICIT_LOCAL_FIRESTORE_REQUIRED');
  const app=initializeApp({projectId:'demo-convergence2'},'c2-'+randomUUID());
  const raw=getFirestore(app),projectId='P'+randomUUID().replaceAll('-',''),actorId='A'+randomUUID().replaceAll('-','');
  const docs=operationalDocuments(projectId,actorId),batch=raw.batch();for(const [path,data] of Object.entries(docs))batch.set(raw.doc(path),data);await batch.commit();
  const actor=buildPrincipal(docs['users/'+actorId],actorId,{});
  return {raw,db:raw,actor,projectId,actorId,close:async()=>{
    // Only documents created for this unique fixture, on the asserted emulator.
    await raw.recursiveDelete(raw.collection('projects').doc(projectId));await raw.doc('users/'+actorId).delete();await raw.doc('systemCounters/tripNumber_'+projectId).delete();await deleteApp(app);
  }};
}
