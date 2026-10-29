import {canonicalPricingRule} from './pricing.service';
import {GLOBAL_IDENTITIES, GlobalIdentityError, validGlobalId} from '../utils/globalIdentityPolicy';
import {readCurrentAssignment, readCurrentAllocation} from '../utils/temporalRelationshipReads';
import {writeTemporalPlan, type TemporalPlan} from './temporalRelationshipAuthority.server';
import {markDirtyInTransaction} from './projectWorkspaceProjectionState.server';

// Reads/plans are separate from writes so the parent membership command remains one transaction.
export const MEMBERSHIP_CONSEQUENCE_LIMIT=50;
export async function planMembershipConsequences(tx:any,db:any,p:string,kind:keyof typeof GLOBAL_IDENTITIES,id:string,actor:any,command:string,reason?:string){
  const root=db.collection('projects').doc(p),at=new Date(),plans:TemporalPlan[]=[];
  const reject=(dependencies:Record<string,number>)=>{throw Object.assign(new GlobalIdentityError('DEPENDENT_RELATIONSHIPS_ACTIVE'),{dependencies});};
  const active=(snap:any)=>snap.docs.filter((d:any)=>d.data()?.status==='ACTIVE');
  if(kind==='CARRIER'){
    const driverRecords=await tx.get(root.collection('driver_carrier_affiliations').where('carrierId','==',id)),truckRecords=await tx.get(root.collection('truck_carrier_affiliations').where('carrierId','==',id));
    const drivers=active(driverRecords),trucks=active(truckRecords);
    // Historical inactive affiliations still identify affected active temporal dependencies.
    const d=new Set(driverRecords.docs.map((v:any)=>v.id)),t=new Set(truckRecords.docs.map((v:any)=>v.id));
    const assignments=active(await tx.get(root.collection('driver_truck_assignments'))).filter((v:any)=>d.has(v.data().driverId)||t.has(v.data().truckId));
    const allocations=active(await tx.get(root.collection('truck_material_allocations'))).filter((v:any)=>t.has(v.data().truckId));
    const pricing=(await tx.get(root.collection('pricing_rules').where('carrierId','==',id))).docs.filter((d:any)=>canonicalPricingRule(d.data()).status==='ACTIVE');
    const dependencies={driverAffiliations:drivers.length,truckAffiliations:trucks.length,assignments:assignments.length,allocations:allocations.length,pricingRules:pricing.length};
    if(Object.values(dependencies).some(Boolean))reject(dependencies);
    return {plans,at};
  }
  const close=(type:'ASSIGNMENT'|'ALLOCATION',record:any)=>{
    if(record && !plans.some(v=>v.kind===type&&v.record[type==='ASSIGNMENT'?'assignmentId':'allocationId']===record[type==='ASSIGNMENT'?'assignmentId':'allocationId']))plans.push({parentMembership:{kind,entityId:id,command},kind:type,projectId:p,command:'CLOSE',actor,before:[record],record:{...record,status:'CLOSED',effectiveTo:at.toISOString(),updatedAt:at.toISOString(),updatedBy:actor.userId},changed:true,reason});
  };
  if(kind==='DRIVER'||kind==='TRUCK')close('ASSIGNMENT',await readCurrentAssignment(tx,db,p,kind==='DRIVER'?'driverId':'truckId',id,at));
  if(kind==='TRUCK')close('ALLOCATION',await readCurrentAllocation(tx,db,p,id,at));
  if(kind==='MATERIAL'){
    const records=active(await tx.get(root.collection('truck_material_allocations').where('materialId','==',id)));
    if(records.length>MEMBERSHIP_CONSEQUENCE_LIMIT)reject({allocations:records.length});
    for(const doc of records){const old=doc.data();if(!validGlobalId(old.truckId))throw new GlobalIdentityError('ALLOCATION_POINTER_CORRUPTION');const record=await readCurrentAllocation(tx,db,p,old.truckId,at);if(!record||record.allocationId!==doc.id)throw new GlobalIdentityError('ALLOCATION_POINTER_CORRUPTION');close('ALLOCATION',record);}
  }
  return {plans,at};
}
export async function writeMembershipConsequences(tx:any,db:any,p:string,result:Awaited<ReturnType<typeof planMembershipConsequences>>,kind:keyof typeof GLOBAL_IDENTITIES,parentChanged:boolean){
  if(!result.plans.length&&!parentChanged)return;
  // This helper performs the final read before any temporal or parent membership writes.
  const tabs=kind==='CARRIER'?['CARRIERS']:kind==='MATERIAL'?['MATERIALS']:['FLEET_ROSTER'];if(result.plans.length&&!tabs.includes('FLEET_ROSTER'))tabs.push('FLEET_ROSTER');
  await markDirtyInTransaction(tx,p,tabs,'MEMBERSHIP_CONSEQUENCES',result.at.toISOString(),db);
  for(const plan of result.plans)writeTemporalPlan(tx,db,plan,result.at);
}
