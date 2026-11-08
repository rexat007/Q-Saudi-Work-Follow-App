import { GlobalIdentityError, validGlobalId } from '../utils/globalIdentityPolicy';
import type { CarrierAffiliationCommand } from '../utils/carrierAffiliationPolicy';
import { SqlCanonicalAuthority, type CommandScope, type Scope } from './canonicalAuthority.js';
import { TemporalRelationshipRepository, RELATIONSHIPS, type SqlRelationshipKind } from './temporalRelationshipRepository.js';

interface AffiliationMutation extends CommandScope {
  kind:'DRIVER'|'TRUCK';entityId:string;carrierId:string;command:CarrierAffiliationCommand;reason?:string;
}
interface AssignmentMutation extends CommandScope {
  command:'ASSIGN'|'REASSIGN'|'CLOSE';driverId?:string;truckId?:string;assignmentId?:string;reason?:string;
}
interface AllocationMutation extends CommandScope {
  command:'ALLOCATE'|'REALLOCATE'|'CLOSE';truckId?:string;materialId?:string;allocationId?:string;reason?:string;
}
const fail=():never=>{throw new GlobalIdentityError('INVALID_TEMPORAL_COMMAND');};
function shape(input:object,allowed:string[]) {
  if(!input||Object.keys(input).some(key=>!['companyId','projectId','operationId','reason',...allowed].includes(key))) fail();
  const reason=(input as any).reason;
  if(reason!==undefined&&(typeof reason!=='string'||reason.length>2000)) fail();
}

/** U03 extends the published U02 auth/UoW/receipt boundary; no route activation. */
export class SqlTemporalAuthority extends SqlCanonicalAuthority {
  async affiliation(token:string,input:AffiliationMutation) {
    shape(input,['kind','entityId','carrierId','command']);
    if(!['DRIVER','TRUCK'].includes(input.kind)||!validGlobalId(input.entityId)||!validGlobalId(input.carrierId)
      ||!['SET_AFFILIATION','REACTIVATE_AFFILIATION','REASSIGN','INACTIVATE'].includes(input.command)) fail();
    return this.command(token,input,{type:'AFFILIATION',...input},false,async(uow,identities,protection)=>{
      await this.lifecycle(uow,input.command==='INACTIVATE');
      const repository=new TemporalRelationshipRepository(uow,identities,this.actorRoles.get(uow)!,input.operationId,
        (kind,id,action,before,after,version,metadata)=>this.consequence(uow,protection,kind,id,input.operationId,action,before,after,version,metadata));
      return repository.affiliation(input.kind,input.entityId,input.carrierId,input.command,input.reason);
    });
  }

  async assignment(token:string,input:AssignmentMutation) {
    shape(input,['command','driverId','truckId','assignmentId']);
    if(!['ASSIGN','REASSIGN','CLOSE'].includes(input.command)) fail();
    if(input.command==='CLOSE'?!validGlobalId(input.assignmentId)||input.driverId!==undefined||input.truckId!==undefined
      :!validGlobalId(input.driverId)||!validGlobalId(input.truckId)||input.assignmentId!==undefined) fail();
    return this.command(token,input,{type:'ASSIGNMENT',...input},false,async(uow,identities,protection)=>{
      await this.lifecycle(uow,input.command==='CLOSE');
      const repository=new TemporalRelationshipRepository(uow,identities,this.actorRoles.get(uow)!,input.operationId,
        (kind,id,action,before,after,version,metadata)=>this.consequence(uow,protection,kind,id,input.operationId,action,before,after,version,metadata));
      return input.command==='CLOSE'?repository.closeExplicit('ASSIGNMENT',input.assignmentId!,input.reason)
        :repository.assignment(input.driverId!,input.truckId!,input.command,input.reason);
    });
  }

  async allocation(token:string,input:AllocationMutation) {
    shape(input,['command','truckId','materialId','allocationId']);
    if(!['ALLOCATE','REALLOCATE','CLOSE'].includes(input.command)) fail();
    if(input.command==='CLOSE'?!validGlobalId(input.allocationId)||input.truckId!==undefined||input.materialId!==undefined
      :!validGlobalId(input.truckId)||!validGlobalId(input.materialId)||input.allocationId!==undefined) fail();
    return this.command(token,input,{type:'ALLOCATION',...input},false,async(uow,identities,protection)=>{
      await this.lifecycle(uow,input.command==='CLOSE');
      const repository=new TemporalRelationshipRepository(uow,identities,this.actorRoles.get(uow)!,input.operationId,
        (kind,id,action,before,after,version,metadata)=>this.consequence(uow,protection,kind,id,input.operationId,action,before,after,version,metadata));
      return input.command==='CLOSE'?repository.closeExplicit('ALLOCATION',input.allocationId!,input.reason)
        :repository.allocation(input.truckId!,input.materialId!,input.command,input.reason);
    });
  }

  async history<K extends SqlRelationshipKind>(token:string,scope:Scope,kind:K,field:'driverId'|'truckId'|'carrierId'|'materialId',entityId:string,limit=50) {
    if(!Object.hasOwn(RELATIONSHIPS,kind)) fail();
    const sqlField={driverId:'driver_id',truckId:'truck_id',carrierId:'carrier_id',materialId:'material_id'}[field];
    if(!sqlField) fail();
    return this.scoped(token,scope,false,(uow,_protection,identities)=>new TemporalRelationshipRepository(
      uow,identities,this.actorRoles.get(uow)!,'',async()=>{}).history(kind,sqlField,entityId,limit));
  }

  async historyPage<K extends SqlRelationshipKind>(token:string,scope:Scope,kind:K,field:'driverId'|'truckId'|'carrierId'|'materialId',entityId:string,limit=50,cursor?:string) {
    if(!Object.hasOwn(RELATIONSHIPS,kind)) fail();
    const sqlField={driverId:'driver_id',truckId:'truck_id',carrierId:'carrier_id',materialId:'material_id'}[field];
    if(!sqlField) fail();
    return this.scoped(token,scope,false,(uow,_protection,identities)=>new TemporalRelationshipRepository(
      uow,identities,this.actorRoles.get(uow)!,'',async()=>{}).historyPage(kind,sqlField,entityId,limit,cursor));
  }

  async relationship<K extends 'ASSIGNMENT'|'ALLOCATION'>(token:string,scope:Scope,kind:K,externalId:string) {
    if(!['ASSIGNMENT','ALLOCATION'].includes(kind)) fail();
    return this.scoped(token,scope,false,async(uow,_protection,identities)=>{
      const repository=new TemporalRelationshipRepository(uow,identities,this.actorRoles.get(uow)!,'',async()=>{});
      return repository.dto(kind,await repository.byExternal(kind,externalId));
    });
  }
}
