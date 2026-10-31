import {markDirtyInTransaction} from './projectWorkspaceProjectionState.server';
import {GLOBAL_IDENTITIES,validGlobalId, type GlobalKind} from '../utils/globalIdentityPolicy';
/** Shared global identities may participate in multiple Projects, including inactive
 * memberships. All reads precede all writes; no Google calls or business mutations. */
export async function invalidateGlobalWorkspaceProjection(tx:any,db:any,kind:GlobalKind,id:string,reason:string,timestamp=new Date().toISOString()) {
  const spec=GLOBAL_IDENTITIES[kind],projects=await tx.get(db.collection('projects'));
  const tabs=kind==='CARRIER'?['CARRIERS','DRIVERS','FLEET_ROSTER']:kind==='MATERIAL'?['MATERIALS','FLEET_ROSTER']:['DRIVERS','FLEET_ROSTER'];
  const writes:Array<[any,any]>=[];
  const buffered={get:(ref:any)=>tx.get(ref),set:(ref:any,value:any)=>writes.push([ref,value])};
  for(const project of projects.docs){
    if(!validGlobalId(project.id))continue;
    const membership=await tx.get(db.collection('projects').doc(project.id).collection(spec.kind+'_memberships').doc(id));
    if(!membership.exists)continue;
    // The canonical document path is enough to invalidate. Representation/business
    // validation belongs to the existing projection reader, not global mutation policy.
    await markDirtyInTransaction(buffered,project.id,tabs,reason,timestamp,db);
  }
  for(const [ref,value] of writes)tx.set(ref,value);
}
