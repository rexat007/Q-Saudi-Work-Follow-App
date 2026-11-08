import type {UnitOfWork} from './unitOfWork.js';
import {CanonicalIdentityRepository,identitySpec,canonicalProfile} from './canonicalIdentityRepository.js';
import {TemporalRelationshipRepository} from './temporalRelationshipRepository.js';
import {GLOBAL_IDENTITIES,type GlobalKind,normalizeNaturalKey} from '../utils/globalIdentityPolicy';
import {normalizeName,normalizePhone} from '../utils/normalization';
import type {ImportResolutionEntity} from '../types/importResolution';
import {importFail} from './importArtifacts.js';

export function preparedIdentityInput(kind:'DRIVER'|'TRUCK',plan:any){
  const allowed=kind==='DRIVER'?['driverName','residencyId','phone','carrierId']:['plateNumber','truckType','tareWeightKg','maxGrossWeightKg','carrierId'];
  if(!plan||Object.keys(plan).some(k=>!allowed.includes(k)))importFail('PREPARED_ENTITY_CONFLICT');
  const input={kind,naturalKey:kind==='DRIVER'?plan.residencyId:plan.plateNumber,
    profile:kind==='DRIVER'?{fullNameAr:plan.driverName,phone:plan.phone||''}:Object.fromEntries(['truckType','tareWeightKg','maxGrossWeightKg'].filter(k=>plan[k]!==undefined).map(k=>[k,plan[k]]))};
  canonicalProfile(input);return input;
}
export function assertPreparedProfile(kind:'DRIVER'|'TRUCK',plan:any,identity:any){
  preparedIdentityInput(kind,plan);
  if(identity.status!=='ACTIVE')importFail('PREPARED_ENTITY_CONFLICT');
  if(kind==='DRIVER'?(normalizeName(identity.fullNameAr||'')!==normalizeName(plan.driverName||'')
    ||normalizePhone(identity.phone||'')!==normalizePhone(plan.phone||'')):
    ['truckType','tareWeightKg','maxGrossWeightKg'].some(key=>plan[key]!==undefined&&identity[key]!==plan[key]))importFail('PREPARED_ENTITY_CONFLICT');
}
/** Targeted proof cache: once per distinct referenced identity, never once per row.
 * Displaced counterpart proofs are added to the same bounded closure of references.
 */
export async function sqlImportContext(uow:UnitOfWork,identities:CanonicalIdentityRepository,
  temporal:TemporalRelationshipRepository,batch:any,maxEntities=1024){
  const pending=new Map<string,{kind:GlobalKind;id:string}>(),found=new Map<string,ImportResolutionEntity>();
  const add=(kind:GlobalKind,id:string)=>{if(!Object.hasOwn(GLOBAL_IDENTITIES,kind)||typeof id!=='string')importFail('INVALID_IMPORT_REFERENCE');
    const key=`${kind}:${id}`;if(!found.has(key))pending.set(key,{kind,id});if(found.size+pending.size>maxEntities)importFail('IMPORT_ENTITY_BUDGET');};
  const prepared=new Map<string,{kind:'DRIVER'|'TRUCK';plan:any}>();
  for(const row of batch.rows){
    if(row.status==='REJECTED'||row.status==='COMMITTED')continue;
    for(const [field,resolution] of Object.entries(row.entityResolutions||{}) as [string,any][]){
      const kind=field.toUpperCase() as GlobalKind;
      if(resolution?.matchedId)add(kind,resolution.matchedId);
      if(resolution?.creationDisposition==='PREPARED_NEW'&&(kind==='DRIVER'||kind==='TRUCK')){
        const plan=kind==='DRIVER'?resolution.preparedDriverPlan:resolution.preparedTruckPlan;
        if(!plan)importFail('PREPARED_ENTITY_CONFLICT');
        preparedIdentityInput(kind,plan);
        const natural=normalizeNaturalKey(kind,kind==='DRIVER'?plan.residencyId:plan.plateNumber);
        prepared.set(`${kind}:${natural}`,{kind,plan});
      }
    }
  }
  for(const receipt of batch.metadata?.canonicalPrerequisites||[]){const [kind,id]=String(receipt.key).split(':');if(id)add(kind as GlobalKind,id);}
  // A compatible concurrent materialization may satisfy the approved prepared
  // identity. Do not expose it as a different review algorithm to the pure builder.
  if(prepared.size+pending.size>maxEntities)importFail('IMPORT_ENTITY_BUDGET');
  for(const {kind,plan} of prepared.values()){
    const identity=await identities.resolve(kind,kind==='DRIVER'?plan.residencyId:plan.plateNumber);
    if(identity)assertPreparedProfile(kind,plan,identity);
  }
  while(pending.size){
    const key=[...pending.keys()].sort()[0],{kind,id}=pending.get(key)!;pending.delete(key);
    if(found.has(key))continue;
    const row=await identities.get(kind,id,true),identity=identities.toIdentity(kind,row),spec=identitySpec(kind);
    const membership=(await uow.query(`SELECT status FROM ${spec.member} WHERE company_id=$1 AND project_id=$2 AND ${spec.field}=$3
      AND valid_period @> clock_timestamp() FOR SHARE`,[uow.context.companyId,uow.context.projectId,row.id])).rows[0];
    const e:ImportResolutionEntity={kind,id:identity.externalId,name:identity.fullNameAr||identity.nameAr||identity.nameEn||identity.plate||identity.externalId,
      naturalKey:identity[GLOBAL_IDENTITIES[kind].natural],globalStatus:identity.status,membershipStatus:membership?.status||null,
      eligible:identity.status==='ACTIVE'&&membership?.status==='ACTIVE',canReactivate:false,affiliation:null};
    found.set(key,e);
    if(kind==='DRIVER'||kind==='TRUCK'){
      const field=kind==='DRIVER'?'driver_id':'truck_id',affKind=kind==='DRIVER'?'DRIVER_AFFILIATION':'TRUCK_AFFILIATION';
      const aff=await temporal.current(affKind,field,row.id);
      e.affiliation=aff?{carrierId:await temporal.external('CARRIER',aff.carrier_id),status:'ACTIVE'}:null;
      const a=await temporal.current('ASSIGNMENT',field,row.id);
      if(a){const dto=await temporal.dto('ASSIGNMENT',a);e.assignment={assignmentId:dto.assignmentId,driverId:dto.driverId,truckId:dto.truckId};
        add('DRIVER',dto.driverId);add('TRUCK',dto.truckId);}else e.assignment=null;
      if(kind==='TRUCK'){
        const allocation=await temporal.current('ALLOCATION','truck_id',row.id);
        if(allocation){const dto=await temporal.dto('ALLOCATION',allocation);e.allocation={allocationId:dto.allocationId,truckId:dto.truckId,materialId:dto.materialId};add('MATERIAL',dto.materialId);}else e.allocation=null;
      }
    }
  }
  return {projectId:batch.projectId,importResolution:{projectId:batch.projectId,entities:[...found.values()].sort((a,b)=>`${a.kind}:${a.id}`.localeCompare(`${b.kind}:${b.id}`))}};
}
