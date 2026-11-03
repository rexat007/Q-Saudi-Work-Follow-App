import {adminDb} from '../../firebase/admin';
import {authorizeGlobalCommand,resolveGlobalNaturalIdentity,assertGlobalEntityExists} from '../globalIdentityAuthority.server';
import {decodeParticipation} from '../projectParticipationAuthority.server';
import {readCurrentAssignment,readCurrentAllocation} from '../../utils/temporalRelationshipReads';
import {isFleetRowDefect} from '../projectFleetReadModel.service';
import {GLOBAL_IDENTITIES,evaluateGlobalEligibility,normalizeNaturalKey,validGlobalId,GlobalIdentityError} from '../../utils/globalIdentityPolicy';
import type {BulkIdentityQuery,BulkIdentityResult,BulkIdentityState} from '../../types/importResolution';

export function classifyBulkIdentity(entity: BulkIdentityResult['entity'],carrierId?:string):BulkIdentityState {
 if(!entity)return 'NOT_FOUND';
 if(entity.issue)return 'GLOBAL_AMBIGUOUS';
 if(entity.globalStatus!=='ACTIVE')return 'GLOBAL_INELIGIBLE';
 if((entity.kind==='DRIVER'||entity.kind==='TRUCK')&&entity.affiliation&&entity.affiliation.carrierId!==carrierId)return 'GLOBAL_EXISTS_WRONG_CARRIER';
 if(entity.membershipStatus===null)return 'GLOBAL_EXISTS_MEMBERSHIP_MISSING';
 if(entity.membershipStatus!=='ACTIVE')return entity.canReactivate?'GLOBAL_EXISTS_MEMBERSHIP_INACTIVE':'GLOBAL_INELIGIBLE';
 if(entity.kind==='DRIVER'||entity.kind==='TRUCK'){
  if(!carrierId)return 'SOURCE_CONFLICT';
  if(!entity.affiliation)return 'GLOBAL_EXISTS_AFFILIATION_MISSING';
  if(entity.affiliation.status!=='ACTIVE')return 'GLOBAL_EXISTS_AFFILIATION_INACTIVE';
 }
 return 'GLOBAL_ACTIVE_AND_PROJECT_READY';
}
/** Read-only, bounded unique natural-key discovery. No catalog enumeration or identity creation. */
export class RosterBulkDiscoveryServer {
 constructor(private db:any=adminDb){}
 async discover(projectId:string,input:BulkIdentityQuery[],actor:{userId:string;email?:string}){
  if(!Array.isArray(input)||input.length>100||input.some(q=>!q||!Object.hasOwn(GLOBAL_IDENTITIES,q.kind)||typeof q.key!=='string'||q.key.length>500||typeof q.naturalKey!=='string'||q.naturalKey.length>120||[q.carrierId,q.expectedPeerId,q.materialId].some(v=>v!==undefined&&(typeof v!=='string'||v.length>128))))throw new GlobalIdentityError('INVALID_BULK_DISCOVERY');
  return this.db.runTransaction(async(tx:any)=>{
   await authorizeGlobalCommand(tx,this.db,actor,projectId);
   const projections=new Map<string,Promise<NonNullable<BulkIdentityResult['entity']>>>();
   const projectIdentity=(kind:BulkIdentityQuery['kind'],id:string,value:any)=>{
    const key=`${kind}:${id}`;
    if(!projections.has(key))projections.set(key,(async()=>{
     const spec=GLOBAL_IDENTITIES[kind],root=this.db.collection('projects').doc(projectId),policy=evaluateGlobalEligibility(kind,value);
     const entity:NonNullable<BulkIdentityResult['entity']>={kind,id,name:value.fullNameAr||value.nameAr||value.nameEn||value.plate||id,naturalKey:value[spec.natural],globalStatus:value.status,membershipStatus:null,eligible:false,canReactivate:policy.CAN_REACTIVATE_MEMBERSHIP,affiliation:null,assignment:null,allocation:null};
     try{
      const membership=await tx.get(root.collection(`${spec.kind}_memberships`).doc(id));
      if(membership.exists)entity.membershipStatus=decodeParticipation(membership.data(),kind,projectId,id).status;
      if(kind==='DRIVER'||kind==='TRUCK'){
       const affiliation=await tx.get(root.collection(`${spec.kind}_carrier_affiliations`).doc(id));
       if(affiliation.exists){const data=decodeParticipation(affiliation.data(),kind,projectId,id,true);entity.affiliation={carrierId:data.carrierId,status:data.status};}
       const assignment=await readCurrentAssignment(tx,this.db,projectId,kind==='DRIVER'?'driverId':'truckId',id,new Date());
       if(assignment)entity.assignment={assignmentId:assignment.assignmentId,driverId:assignment.driverId,truckId:assignment.truckId};
       if(kind==='TRUCK'){const allocation=await readCurrentAllocation(tx,this.db,projectId,id,new Date());if(allocation)entity.allocation={allocationId:allocation.allocationId,truckId:allocation.truckId,materialId:allocation.materialId};}
      }
      entity.eligible=policy.CAN_USE_OPERATIONALLY&&entity.membershipStatus==='ACTIVE';
     }catch(error){if(!isFleetRowDefect(error))throw error;entity.issue='CANONICAL_INTEGRITY_ERROR';}
     return entity;
    })());
    return projections.get(key)!;
   };
   const carrierProof=new Map<string,Promise<BulkIdentityResult['entity']>>();
   const readCarrier=(id:string)=>{
    if(!validGlobalId(id))return Promise.resolve(undefined);
    if(!carrierProof.has(id))carrierProof.set(id,(async()=>{
     try{return await projectIdentity('CARRIER',id,await assertGlobalEntityExists(tx,this.db,'CARRIER',id));}
     catch(error:any){if(error.code==='GLOBAL_ENTITY_NOT_FOUND'||isFleetRowDefect(error))return undefined;throw error;}
    })());return carrierProof.get(id)!;
   };
   const found=new Map<string,Promise<any>>();
   const results:BulkIdentityResult[]=[];
   // Four identity groups in flight at most; transaction is bounded by the 100-key request limit.
   for(let offset=0;offset<input.length;offset+=4){
    results.push(...await Promise.all(input.slice(offset,offset+4).map(async q=>{
     try{
      const naturalKey=normalizeNaturalKey(q.kind,q.naturalKey),key=`${q.kind}:${naturalKey}`;
      if(!found.has(key))found.set(key,resolveGlobalNaturalIdentity(tx,this.db,q.kind,naturalKey));
      const match=await found.get(key);let entity:BulkIdentityResult['entity'];
      if(match.id)entity=await projectIdentity(q.kind,match.id,match.entity);
      const carrier=q.carrierId?await readCarrier(q.carrierId):undefined;
      const carrierReady=carrier&&carrier.globalStatus==='ACTIVE'&&carrier.membershipStatus==='ACTIVE'&&carrier.eligible&&!carrier.issue;
      const temporalConflict=entity?.assignment&&q.expectedPeerId!==undefined&&entity.assignment[q.kind==='DRIVER'?'truckId':'driverId']!==q.expectedPeerId||q.kind==='TRUCK'&&entity?.allocation&&q.materialId&&entity.allocation.materialId!==q.materialId;
      const state=((q.kind==='DRIVER'||q.kind==='TRUCK')&&!carrierReady||temporalConflict)?'SOURCE_CONFLICT':classifyBulkIdentity(entity,q.carrierId);
      return {...q,naturalKey,entity,carrier,state};
     }catch(error:any){
      if(['INVALID_NATURAL_KEY','DUPLICATE_NATURAL_KEY','IDENTITY_LOOKUP_INTEGRITY_ERROR','PERSISTENCE_BOUNDARY_INVALID'].includes(error.code))return {...q,state:error.code==='INVALID_NATURAL_KEY'?'SOURCE_CONFLICT':'GLOBAL_AMBIGUOUS'} as BulkIdentityResult;
      throw error;
     }
    })));
   }
   return {projectId,results};
  });
 }
}
