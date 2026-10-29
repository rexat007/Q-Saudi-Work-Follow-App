import type {ProjectCanonicalRefreshSnapshot} from './projectCanonicalRefresh.service';
/** Compares a confirmed canonical receipt with a coherent read. It does not decide business eligibility. */
export function assertSetupReceiptConverged(projectId:string,surface:string,input:any,result:any,snapshot:ProjectCanonicalRefreshSnapshot){
 const fail=():never=>{throw Object.assign(Error('REFRESH_INCOHERENT: receipt no longer matches current canonical state'),{code:'REFRESH_INCOHERENT'});};
 const setup=snapshot.setup;if(!setup||setup.projectId!==projectId)fail();
 const participants=setup!.participants;
 const participant=(kind:string,id:string)=>participants.find(p=>p.kind===kind&&p.id===id);
 const activeId=(kind:string,id:string)=>participants.some(p=>kind==='ASSIGNMENT'?p.assignment?.assignmentId===id:p.allocation?.allocationId===id);
 if(surface==='membership-commands'){
  const p=participant(input.kind,input.entityId);if(!p||!result?.membership||p.membershipStatus!==result.membership.status)fail();
  for(const closed of result.closedRelationships||[])if(activeId(closed.kind,closed.id))fail();
 }else if(surface==='affiliation-commands'){
  const p=participant(input.kind,input.entityId),r=result?.affiliation;
  if(!p||!r||p.affiliation?.status!==r.status||p.affiliation?.carrierId!==r.carrierId)fail();
 }else if(surface==='assignment-commands'||surface==='allocation-commands'){
  const r=result?.relationship,assignment=surface==='assignment-commands',id=r?.[assignment?'assignmentId':'allocationId'];if(!r||!id||r.projectId!==undefined&&r.projectId!==projectId)fail();
  if(r.status==='CLOSED'){if(activeId(assignment?'ASSIGNMENT':'ALLOCATION',id))fail();}
  else if(assignment){const p=participant('TRUCK',r.truckId),d=participant('DRIVER',r.driverId);if(p?.assignment?.assignmentId!==id||d?.assignment?.assignmentId!==id||snapshot.relationshipContext.activeDriverByTruck?.[r.truckId]!==r.driverId)fail();}
  else {const p=participant('TRUCK',r.truckId);if(p?.allocation?.allocationId!==id||snapshot.relationshipContext.activeMaterialByTruck?.[r.truckId]!==r.materialId)fail();}
 }else if(surface==='setup-driver'||surface==='setup-truck'){
  const driver=surface==='setup-driver',p=participant(driver?'DRIVER':'TRUCK',result?.[driver?'driverId':'truckId']);
  if(!p||p.membershipStatus!=='ACTIVE'||p.affiliation?.status!=='ACTIVE'||p.affiliation.carrierId!==result.carrierId)fail();
 }else fail();
}
