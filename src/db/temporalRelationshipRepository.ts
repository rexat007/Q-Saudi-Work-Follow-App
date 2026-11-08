import { randomUUID } from 'node:crypto';
import { GlobalIdentityError, assertOperationallyEligible, validGlobalId, type GlobalKind } from '../utils/globalIdentityPolicy';
import { planCarrierAffiliationState, type CarrierAffiliationCommand } from '../utils/carrierAffiliationPolicy';
import { CanonicalFleetRelationshipPolicy } from '../utils/canonicalFleetRelationshipPolicy';
import { CanonicalIdentityRepository, identitySpec } from './canonicalIdentityRepository.js';
import type { UnitOfWork } from './unitOfWork.js';
import type { ProjectDriverCarrierAffiliationEntity, ProjectTruckCarrierAffiliationEntity } from '../types/projectCarrierAffiliation';
import type { ProjectDriverTruckAssignmentEntity } from '../types/projectDriverTruckAssignment';
import type { ProjectTruckMaterialAllocationEntity } from '../types/projectTruckMaterialAllocation';

export type SqlRelationshipKind = 'DRIVER_AFFILIATION'|'TRUCK_AFFILIATION'|'ASSIGNMENT'|'ALLOCATION';
type SqlTemporalMetadata = {
  recordStatus:'ACCEPTED';effectiveFrom:string;effectiveTo:string|null;revision:number;
  createdAt:string;createdBy:string;updatedAt:string|null;updatedBy:string|null;
};
type SerializedAffiliation<T> = Omit<T,'createdAt'|'updatedAt'|'updatedBy'> & SqlTemporalMetadata;
export interface SqlRelationshipProjection {
  DRIVER_AFFILIATION:SerializedAffiliation<ProjectDriverCarrierAffiliationEntity>;
  TRUCK_AFFILIATION:SerializedAffiliation<ProjectTruckCarrierAffiliationEntity>;
  ASSIGNMENT:ProjectDriverTruckAssignmentEntity & SqlTemporalMetadata;
  ALLOCATION:ProjectTruckMaterialAllocationEntity & SqlTemporalMetadata;
}
export const RELATIONSHIPS = {
  DRIVER_AFFILIATION:{table:'driver_carrier_affiliations',fields:{driver_id:'DRIVER',carrier_id:'CARRIER'},owner:'driver_id'},
  TRUCK_AFFILIATION:{table:'truck_carrier_affiliations',fields:{truck_id:'TRUCK',carrier_id:'CARRIER'},owner:'truck_id'},
  ASSIGNMENT:{table:'driver_truck_assignments',fields:{driver_id:'DRIVER',truck_id:'TRUCK'},owner:'driver_id'},
  ALLOCATION:{table:'truck_material_allocations',fields:{truck_id:'TRUCK',material_id:'MATERIAL'},owner:'truck_id'},
} as const;
const fail=(code:string):never=>{throw new GlobalIdentityError(code);};
export type TemporalEmitter=(kind:SqlRelationshipKind,id:string,action:string,before:unknown,after:unknown,
  revision:number,metadata?:Record<string,unknown>)=>Promise<void>;
export interface TemporalCleanup {kind:'ASSIGNMENT'|'ALLOCATION';row:any}

/** Transaction-bound accepted-period repository; no authentication or second pool. */
export class TemporalRelationshipRepository {
  private time?:string;
  private readonly externals=new Map<string,string>();
  private readonly affiliationOrigins=new Map<string,{createdAt:string;createdBy:string}>();
  private projectExternal?:string;
  constructor(readonly uow:UnitOfWork,readonly identities:CanonicalIdentityRepository,
    readonly role:string,readonly operationId:string,private readonly emit:TemporalEmitter) {
    if (!role) fail('FORBIDDEN_GLOBAL_COMMAND');
  }

  async at(refresh=false) {
    if (!this.time||refresh) this.time=(await this.uow.query("SELECT set_config('app.temporal_at',clock_timestamp()::text,true) AS at")).rows[0].at;
    return this.time!;
  }

  private async rows(kind:SqlRelationshipKind,predicate:string,values:unknown[],lock=true,tail='') {
    const table=RELATIONSHIPS[kind].table;
    const result=await this.uow.query(`SELECT r.*,
      to_char(lower(r.valid_period) AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS effective_from,
      CASE WHEN upper_inf(r.valid_period) THEN NULL ELSE to_char(upper(r.valid_period) AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"') END AS effective_to,
      to_char(r.created_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS created_time,
      to_char(r.updated_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS updated_time,
      r.valid_period @> $3::timestamptz AS is_current,upper_inf(r.valid_period) AS is_open,
      lower(r.valid_period)>$3::timestamptz AS is_future,
      EXISTS(SELECT 1 FROM ${table}_events e WHERE e.company_id=r.company_id AND e.project_id=r.project_id
        AND e.relationship_id=r.id AND e.revision=r.revision
        AND jsonb_populate_record(NULL::${table},e.after_record) IS NOT DISTINCT FROM r) AS history_verified
      FROM ${table} r WHERE r.company_id=$1 AND r.project_id=$2 AND (${predicate})
      ${tail} ${lock?'FOR UPDATE OF r':''}`,[this.uow.context.companyId,this.uow.context.projectId,await this.at(),...values]);
    return result.rows;
  }

  assertProven(kind:SqlRelationshipKind,row:any,code='TEMPORAL_RECONCILIATION_REQUIRED') {
    if (!row || row.record_status!=='ACCEPTED' || row.voided_at!==null || !row.history_verified
      || !row.created_by || !row.created_role || !row.opened_operation_id || !Number.isSafeInteger(Number(row.revision))
      || Number(row.revision)<1 || (kind==='ASSIGNMENT'||kind==='ALLOCATION') && !validGlobalId(row.external_id)) fail(code);
  }

  async relevant(kind:SqlRelationshipKind,predicate:string,values:unknown[],legacyCode?:string) {
    const rows=await this.rows(kind,`${predicate} AND r.record_status='ACCEPTED' AND r.voided_at IS NULL
      AND r.valid_period && tstzrange($3::timestamptz,NULL,'[)')`,values);
    for (const row of rows) this.assertProven(kind,row,legacyCode);
    if (rows.some(row=>!row.is_current || !row.is_open)) fail('FUTURE_TEMPORAL_CONFLICT');
    return rows;
  }

  async current(kind:SqlRelationshipKind,field:string,id:string,legacyCode?:string) {
    if (!Object.hasOwn(RELATIONSHIPS[kind].fields,field)) fail('INVALID_TEMPORAL_COMMAND');
    const rows=await this.relevant(kind,`r.${field}=$4`,[id],legacyCode);
    if (rows.length>1) fail('TEMPORAL_RELATIONSHIP_INTEGRITY_ERROR');
    return rows[0]||null;
  }

  async latestAffiliation(kind:'DRIVER_AFFILIATION'|'TRUCK_AFFILIATION',id:string) {
    const active=await this.current(kind,RELATIONSHIPS[kind].owner,id);
    if (active) return active;
    const rows=await this.rows(kind,`r.${RELATIONSHIPS[kind].owner}=$4 AND r.record_status='ACCEPTED' AND r.voided_at IS NULL`,
      [id],true,'ORDER BY lower(r.valid_period) DESC,r.id DESC LIMIT 1');
    if (rows[0]) this.assertProven(kind,rows[0]);
    return rows[0]||null;
  }

  async byExternal(kind:'ASSIGNMENT'|'ALLOCATION',external:string) {
    if (!validGlobalId(external)) fail('INVALID_TEMPORAL_COMMAND');
    const rows=await this.rows(kind,'r.external_id=$4',[external]);
    if (rows.length!==1) fail('TEMPORAL_RELATIONSHIP_NOT_FOUND');
    this.assertProven(kind,rows[0]);
    if (rows[0].is_future || rows[0].is_current && !rows[0].is_open) fail('FUTURE_TEMPORAL_CONFLICT');
    return rows[0];
  }

  async external(kind:GlobalKind,id:string) {
    const key=`${kind}/${id}`;
    if (!this.externals.has(key)) {
      const result=await this.uow.query(`SELECT external_id FROM ${identitySpec(kind).table} WHERE company_id=$1 AND id=$2`,[this.uow.context.companyId,id]);
      if (result.rowCount!==1 || !validGlobalId(result.rows[0].external_id)) fail('TEMPORAL_RELATIONSHIP_INTEGRITY_ERROR');
      this.externals.set(key,result.rows[0].external_id);
    }
    return this.externals.get(key)!;
  }

  async dto<K extends SqlRelationshipKind>(kind:K,row:any):Promise<SqlRelationshipProjection[K]> {
    this.assertProven(kind,row);
    if (row.is_future || row.is_current && !row.is_open) fail('FUTURE_TEMPORAL_CONFLICT');
    if (!this.projectExternal) this.projectExternal=(await this.uow.query('SELECT external_id FROM projects WHERE company_id=$1 AND id=$2',
      [this.uow.context.companyId,this.uow.context.projectId])).rows[0].external_id;
    let origin={createdAt:row.created_time,createdBy:row.created_by};
    if(kind==='DRIVER_AFFILIATION'||kind==='TRUCK_AFFILIATION'){
      const owner=RELATIONSHIPS[kind].owner,key=`${kind}/${row[owner]}`;
      if(!this.affiliationOrigins.has(key)){
        const first=(await this.rows(kind,`r.${owner}=$4 AND r.record_status='ACCEPTED' AND r.voided_at IS NULL`,
          [row[owner]],false,'ORDER BY lower(r.valid_period),r.id LIMIT 1'))[0];
        this.assertProven(kind,first);
        this.affiliationOrigins.set(key,{createdAt:first.created_time,createdBy:first.created_by});
      }
      origin=this.affiliationOrigins.get(key)!;
    }
    const common={projectId:this.projectExternal!,
      recordStatus:'ACCEPTED' as const,effectiveFrom:row.effective_from as string,effectiveTo:row.effective_to as string|null,revision:Number(row.revision),
      ...origin,updatedAt:row.updated_time,updatedBy:row.updated_by};
    const affiliationStatus=row.is_current?'ACTIVE' as const:'INACTIVE' as const;
    const temporalStatus=row.is_current?'ACTIVE' as const:'CLOSED' as const;
    // Each branch is checked against the existing canonical contract before the
    // indexed return assertion correlates the runtime kind with generic K.
    let projection:SqlRelationshipProjection[SqlRelationshipKind];
    switch(kind){
      case 'DRIVER_AFFILIATION': projection={...common,status:affiliationStatus,
        driverId:await this.external('DRIVER',row.driver_id),carrierId:await this.external('CARRIER',row.carrier_id)} satisfies SqlRelationshipProjection['DRIVER_AFFILIATION'];break;
      case 'TRUCK_AFFILIATION': projection={...common,status:affiliationStatus,
        truckId:await this.external('TRUCK',row.truck_id),carrierId:await this.external('CARRIER',row.carrier_id)} satisfies SqlRelationshipProjection['TRUCK_AFFILIATION'];break;
      case 'ASSIGNMENT': projection={...common,status:temporalStatus,assignmentId:row.external_id,
        driverId:await this.external('DRIVER',row.driver_id),truckId:await this.external('TRUCK',row.truck_id)} satisfies SqlRelationshipProjection['ASSIGNMENT'];break;
      case 'ALLOCATION': projection={...common,status:temporalStatus,allocationId:row.external_id,
        truckId:await this.external('TRUCK',row.truck_id),materialId:await this.external('MATERIAL',row.material_id)} satisfies SqlRelationshipProjection['ALLOCATION'];break;
      default:return fail('INVALID_TEMPORAL_COMMAND');
    }
    return projection as SqlRelationshipProjection[K];
  }

  async participation(kind:GlobalKind,identifier:string) {
    const global=await this.identities.get(kind,identifier,true);
    assertOperationallyEligible(kind,global);
    const spec=identitySpec(kind);
    const member=await this.uow.query(`SELECT id FROM ${spec.member} WHERE company_id=$1 AND project_id=$2
      AND ${spec.field}=$3 AND status='ACTIVE' AND valid_period @> clock_timestamp() FOR SHARE`,
    [this.uow.context.companyId,this.uow.context.projectId,global.id]);
    if (!member.rowCount) fail('TEMPORAL_PARTICIPATION_INACTIVE');
    return global;
  }

  async insert(kind:SqlRelationshipKind,refs:Record<string,string>) {
    const spec=RELATIONSHIPS[kind],at=await this.at();
    const columns=['id','company_id','project_id',...Object.keys(spec.fields),'valid_period','record_status',
      'revision','created_at','updated_at','created_by','updated_by','created_role','updated_role','opened_operation_id','external_id'];
    const values:unknown[]=[randomUUID(),this.uow.context.companyId,this.uow.context.projectId,...Object.keys(spec.fields).map(f=>refs[f])];
    const params=values.map((_,i)=>`$${i+1}`);
    const timeIndex=values.length+1;
    values.push(at,this.uow.context.actorId,this.role,this.operationId,
      kind==='ASSIGNMENT'?`ASN-${randomUUID().replaceAll('-','')}`:kind==='ALLOCATION'?`TMA-${randomUUID().replaceAll('-','')}`:null);
    params.push(`tstzrange($${timeIndex}::timestamptz,NULL,'[)')`,"'ACCEPTED'",'1',`$${timeIndex}`,`$${timeIndex}`,
      `$${timeIndex+1}`,`$${timeIndex+1}`,`$${timeIndex+2}`,`$${timeIndex+2}`,`$${timeIndex+3}`,`$${timeIndex+4}`);
    await this.uow.query("SELECT set_config('app.temporal_action','CREATE',true)");
    const result=await this.uow.query(`INSERT INTO ${spec.table}(${columns.join(',')}) VALUES(${params.join(',')}) RETURNING id`,values);
    return (await this.rows(kind,'r.id=$4',[result.rows[0].id]))[0];
  }

  async close(kind:SqlRelationshipKind,row:any,reason?:string) {
    this.assertProven(kind,row);
    if (!row.is_current) {
      if (row.is_future) fail('FUTURE_TEMPORAL_CONFLICT');
      return row;
    }
    if (!row.is_open) fail('FUTURE_TEMPORAL_CONFLICT');
    await this.uow.query("SELECT set_config('app.temporal_action','CLOSE',true)");
    const result=await this.uow.query(`UPDATE ${RELATIONSHIPS[kind].table}
      SET valid_period=tstzrange(lower(valid_period),$1::timestamptz,'[)'),revision=revision+1,
        updated_at=$1,updated_by=$2,updated_role=$3,closed_operation_id=$4,close_reason=$5
      WHERE company_id=$6 AND project_id=$7 AND id=$8 AND revision=$9 AND upper_inf(valid_period)
        AND lower(valid_period)<$1::timestamptz RETURNING id`,
    [await this.at(),this.uow.context.actorId,this.role,this.operationId,reason??null,this.uow.context.companyId,this.uow.context.projectId,row.id,row.revision]);
    if (result.rowCount!==1) fail('TEMPORAL_REVISION_CONFLICT');
    return (await this.rows(kind,'r.id=$4',[row.id]))[0];
  }

  private aggregate(kind:SqlRelationshipKind,row:any) {
    return row.external_id || `${this.uow.context.projectId}/${row[RELATIONSHIPS[kind].owner]}/${row.id}`;
  }

  async publish<K extends SqlRelationshipKind>(kind:K,action:string,before:any[],after:any,closedIds:string[],parentMembership?:unknown) {
    const beforeDto=[];
    for(const row of before) beforeDto.push(await this.dto(kind,row));
    const afterDto=await this.dto(kind,after);
    await this.emit(kind,this.aggregate(kind,after),`TEMPORAL_${action}`,beforeDto,afterDto,Number(after.revision),
      {relationshipKind:kind,closedIds,parentMembership,periodId:after.id});
    return {relationship:afterDto,idempotent:false,closedIds};
  }

  async affiliation(kind:'DRIVER'|'TRUCK',entityId:string,carrierId:string,command:CarrierAffiliationCommand,reason?:string) {
    const relationKind=kind==='DRIVER'?'DRIVER_AFFILIATION':'TRUCK_AFFILIATION',field=kind==='DRIVER'?'driver_id':'truck_id';
    const entity=command==='INACTIVATE'?await this.identities.get(kind,entityId,true):await this.participation(kind,entityId);
    const carrier=command==='INACTIVATE'?await this.identities.get('CARRIER',carrierId):await this.participation('CARRIER',carrierId);
    const before=await this.latestAffiliation(relationKind,entity.id);
    const decision=planCarrierAffiliationState(kind,command,carrier.id,before?{carrierId:before.carrier_id,status:before.is_current?'ACTIVE':'INACTIVE'}:null);
    if (!decision.changed) return {relationship:await this.dto(relationKind,before),idempotent:true,closedIds:[]};
    const assignment=await this.current('ASSIGNMENT',field,entity.id);
    if (assignment) {
      if (decision.status!=='ACTIVE') fail('P5_B3_RELATIONSHIP_DEPENDENCY');
      const counterpart=kind==='DRIVER'?await this.current('TRUCK_AFFILIATION','truck_id',assignment.truck_id)
        :await this.current('DRIVER_AFFILIATION','driver_id',assignment.driver_id);
      if (!counterpart || counterpart.carrier_id!==carrier.id) fail('P5_B3_RELATIONSHIP_DEPENDENCY');
    }
    if (kind==='TRUCK' && decision.status!=='ACTIVE' && await this.current('ALLOCATION','truck_id',entity.id)) fail('P5_B3_RELATIONSHIP_DEPENDENCY');
    const oldActive=Boolean(before?.is_current);
    if (oldActive) await this.close(relationKind,before,reason);
    const after=decision.status==='ACTIVE'?await this.insert(relationKind,{[field]:entity.id,carrier_id:carrier.id})
      :(await this.rows(relationKind,'r.id=$4',[before.id]))[0];
    return this.publish(relationKind,command,before?[before]:[],after,[]);
  }

  async assignment(driverId:string,truckId:string,command:'ASSIGN'|'REASSIGN',reason?:string) {
    const driver=await this.participation('DRIVER',driverId),truck=await this.participation('TRUCK',truckId);
    const driverAff=await this.current('DRIVER_AFFILIATION','driver_id',driver.id),truckAff=await this.current('TRUCK_AFFILIATION','truck_id',truck.id);
    if (!driverAff||!truckAff) fail('TEMPORAL_PARTICIPATION_INACTIVE');
    if (driverAff.carrier_id!==truckAff.carrier_id) fail('CARRIER_MISMATCH');
    await this.participation('CARRIER',await this.external('CARRIER',truckAff.carrier_id));
    await this.at(true); // Choose the write boundary after all eligibility locks.
    const d=await this.current('ASSIGNMENT','driver_id',driver.id),t=await this.current('ASSIGNMENT','truck_id',truck.id);
    const same=CanonicalFleetRelationshipPolicy.isAssignmentIdempotent(driver.id,truck.id,d?{assignmentId:d.external_id}:null,
      t?{assignmentId:t.external_id}:null,d?{assignmentId:d.external_id,projectId:this.uow.context.projectId!,
        driverId:d.driver_id,truckId:d.truck_id,status:'ACTIVE',effectiveFrom:d.effective_from,effectiveTo:null,
        createdAt:d.created_time,createdBy:d.created_by}:null);
    if (same) return {relationship:await this.dto('ASSIGNMENT',d),idempotent:true,closedIds:[]};
    const before=[...new Map([d,t].filter(Boolean).map(row=>[row.id,row])).values()].sort((a,b)=>a.id.localeCompare(b.id));
    if (command==='ASSIGN'&&before.length) fail('ASSIGNMENT_STATE_CONFLICT');
    for (const row of before) await this.close('ASSIGNMENT',row,reason);
    const after=await this.insert('ASSIGNMENT',{driver_id:driver.id,truck_id:truck.id});
    return this.publish('ASSIGNMENT',command,before,after,before.map(row=>row.external_id));
  }

  async allocation(truckId:string,materialId:string,command:'ALLOCATE'|'REALLOCATE',reason?:string) {
    const truck=await this.participation('TRUCK',truckId),material=await this.participation('MATERIAL',materialId);
    const affiliation=await this.current('TRUCK_AFFILIATION','truck_id',truck.id);
    if (!affiliation) fail('TEMPORAL_PARTICIPATION_INACTIVE');
    await this.participation('CARRIER',await this.external('CARRIER',affiliation.carrier_id));
    await this.at(true);
    const before=await this.current('ALLOCATION','truck_id',truck.id);
    if (before?.material_id===material.id) return {relationship:await this.dto('ALLOCATION',before),idempotent:true,closedIds:[]};
    if (command==='ALLOCATE'&&before) fail('ALLOCATION_STATE_CONFLICT');
    if (before) await this.close('ALLOCATION',before,reason);
    const after=await this.insert('ALLOCATION',{truck_id:truck.id,material_id:material.id});
    return this.publish('ALLOCATION',command,before?[before]:[],after,before?[before.external_id]:[]);
  }

  async closeExplicit<K extends 'ASSIGNMENT'|'ALLOCATION'>(kind:K,external:string,reason?:string) {
    const before=await this.byExternal(kind,external);
    if (!before.is_current) return {relationship:await this.dto(kind,before),idempotent:true,closedIds:[]};
    const after=await this.close(kind,before,reason);
    return this.publish(kind,'CLOSE',[before],after,[before.external_id]);
  }

  async membershipPlans(kind:GlobalKind,id:string):Promise<TemporalCleanup[]> {
    const plans:TemporalCleanup[]=[];
    if (kind==='DRIVER'||kind==='TRUCK') {
      const row=await this.current('ASSIGNMENT',kind==='DRIVER'?'driver_id':'truck_id',id,'DEPENDENT_RELATIONSHIPS_ACTIVE');
      if(row) plans.push({kind:'ASSIGNMENT',row});
    }
    if(kind==='TRUCK') {
      const row=await this.current('ALLOCATION','truck_id',id,'DEPENDENT_RELATIONSHIPS_ACTIVE');
      if(row) plans.push({kind:'ALLOCATION',row});
    }
    if(kind==='MATERIAL') {
      const rows=await this.relevant('ALLOCATION','r.material_id=$4',[id],'DEPENDENT_RELATIONSHIPS_ACTIVE');
      if(rows.length>50) fail('DEPENDENT_RELATIONSHIPS_ACTIVE');
      for(const row of rows) plans.push({kind:'ALLOCATION',row});
    }
    // Unproven legacy affiliations retain the U02 fail-closed guard. Proven
    // affiliations remain in place, as in the existing membership workflow.
    if(kind==='DRIVER'||kind==='TRUCK') await this.current(kind==='DRIVER'?'DRIVER_AFFILIATION':'TRUCK_AFFILIATION',
      kind==='DRIVER'?'driver_id':'truck_id',id,'DEPENDENT_RELATIONSHIPS_ACTIVE');
    return plans.sort((a,b)=>a.kind===b.kind?a.row.id.localeCompare(b.row.id):a.kind==='ASSIGNMENT'?-1:1);
  }

  async closeMembership(plans:TemporalCleanup[],parent:{kind:GlobalKind;entityId:string;command:string},reason?:string) {
    const closed:{kind:string;id:string}[]=[];
    for(const plan of plans) {
      const after=await this.close(plan.kind,plan.row,reason);
      await this.publish(plan.kind,'CLOSE',[plan.row],after,[plan.row.external_id],parent);
      closed.push({kind:plan.kind,id:plan.row.external_id});
    }
    return closed;
  }

  async history<K extends SqlRelationshipKind>(kind:K,field:string,identifier:string,limit=50) {
    return (await this.historyPage(kind,field,identifier,limit)).items;
  }

  async historyPage<K extends SqlRelationshipKind>(kind:K,field:string,identifier:string,limit=50,cursor?:string) {
    if(!Object.hasOwn(RELATIONSHIPS[kind].fields,field)||!Number.isInteger(limit)||limit<1||limit>50) fail('INVALID_TEMPORAL_COMMAND');
    let boundary:[string,string]|undefined;
    if(cursor!==undefined){
      try{
        if(typeof cursor!=='string'||cursor.length>256) throw new Error();
        const value=JSON.parse(Buffer.from(cursor,'base64url').toString('utf8'));
        if(!Array.isArray(value)||value.length!==2||typeof value[0]!=='string'
          ||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}Z$/.test(value[0])||!Number.isFinite(Date.parse(value[0]))
          ||typeof value[1]!=='string'||!/^[0-9a-f-]{36}$/.test(value[1])) throw new Error();
        boundary=value as [string,string];
      }catch{fail('INVALID_TEMPORAL_COMMAND');}
    }
    const globalKind=(RELATIONSHIPS[kind].fields as Record<string,GlobalKind>)[field];
    const identity=await this.identities.get(globalKind,identifier);
    const values:unknown[]=[identity.id,...(boundary||[]),limit+1];
    const rows=await this.rows(kind,`r.${field}=$4 AND r.record_status='ACCEPTED' AND r.voided_at IS NULL
      ${boundary?'AND (lower(r.valid_period),r.id)<($5::timestamptz,$6::uuid)':''}`,
      values,false,`ORDER BY lower(r.valid_period) DESC,r.id DESC LIMIT $${boundary?7:5}`);
    const selected=rows.slice(0,limit),items=[];
    for(const row of selected) items.push(await this.dto(kind,row));
    const last=selected.at(-1);
    return {items,nextCursor:rows.length>limit?Buffer.from(JSON.stringify([last.effective_from,last.id])).toString('base64url'):null};
  }
}
