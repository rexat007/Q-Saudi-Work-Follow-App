import { beforeAll,afterAll,describe,it,expect } from 'vitest';
import { randomBytes,randomUUID } from 'node:crypto';
import pg,{type PoolClient} from 'pg';
import { SqlTemporalAuthority } from '../db/temporalAuthority.js';
import { RELATIONSHIPS,type SqlRelationshipKind } from '../db/temporalRelationshipRepository.js';
import { applyMigrations,verifyMigrations,loadMigrationFiles } from '../db/migrator.js';
import { withUnitOfWork } from '../db/unitOfWork.js';
import type { GlobalKind } from '../utils/globalIdentityPolicy';

if(process.env.QSA_TEST_DATABASE_ISOLATED!=='1'||!process.env.TEST_DATABASE_URL) throw new Error('Explicit isolated PostgreSQL required');
const pool=(variable:string,max=4)=>{
  if(!process.env[variable]) throw new Error(`${variable} required`);
  return new pg.Pool({connectionString:process.env[variable],max});
};
const check=(name:string,fn:()=>Promise<void>)=>it(name,fn,20000);

describe('AR2-U03 real PostgreSQL 17 temporal authority',()=>{
  const admin=pool('TEST_DATABASE_URL'),runtime=pool('DATABASE_URL',12),auth=pool('AUTH_DATABASE_URL'),migrator=pool('MIGRATION_DATABASE_URL');
  const service=new SqlTemporalAuthority({runtimePool:runtime,authPool:auth,verifyToken:async token=>{
    if(!['admin','manager','viewer'].includes(token)) throw new Error('invalid token');
    return {uid:`u03-${token}-${actor}`,role:'SUPER_ADMIN'};
  }});
  const company=randomUUID(),other=randomUUID(),project=randomUUID(),second=randomUUID(),foreign=randomUUID();
  const actor=randomUUID(),manager=randomUUID(),viewer=randomUUID();
  const scope={companyId:company,projectId:`Q-PRJ-${project}`},scopeB={companyId:company,projectId:`Q-PRJ-${second}`};
  const scopeForeign={companyId:other,projectId:`Q-PRJ-${foreign}`};
  const oldKeys=Object.fromEntries(['QSA_IDENTITY_HMAC_KEY','QSA_IDENTITY_ENCRYPTION_KEY','QSA_IDENTITY_KEY_VERSION'].map(k=>[k,process.env[k]]));
  let sequence=300000;
  const command=(at=scope)=>({...at,operationId:randomUUID()});
  const make=async(kind:GlobalKind,at=scope)=>{
    const n=++sequence;
    const result=await service.create('admin',{...command(at),kind,naturalKey:kind==='DRIVER'?`2${String(n).padStart(9,'0')}`
      :kind==='CARRIER'?`1${String(n).padStart(9,'0')}`:kind==='TRUCK'?`ا ب ج ${n}`:`MAT ${n}`,
    profile:kind==='DRIVER'?{fullNameAr:'سائق الاختبار',phone:'0551234567'}:kind==='TRUCK'?{truckType:'DUMPER'}
      :kind==='CARRIER'?{nameAr:'ناقل الاختبار'}:{nameAr:'مادة الاختبار',unitOfMeasure:'TON'}});
    await service.membership('admin',{...command(at),kind,entityId:result.identity.externalId,command:'ENROLL',expectedRevision:0});
    return result.identity;
  };
  const fleet=async(options:{d?:number;t?:number;c?:number;m?:number;affiliations?:boolean}={},at=scope)=>{
    const result:{d:any[];t:any[];c:any[];m:any[]}={d:[],t:[],c:[],m:[]};
    for(const [field,kind] of [['c','CARRIER'],['d','DRIVER'],['t','TRUCK'],['m','MATERIAL']] as const){
      for(let i=0;i<(options[field]??1);i++) result[field].push(await make(kind,at));
    }
    if(options.affiliations!==false) for(const [field,kind] of [['d','DRIVER'],['t','TRUCK']] as const){
      for(const entity of result[field]) await service.affiliation('admin',{...command(at),kind,entityId:entity.externalId,
        carrierId:result.c[0].externalId,command:'SET_AFFILIATION'});
    }
    return result;
  };
  const assign=(f:{d:any[];t:any[]},d=0,t=0,extra:Record<string,any>={})=>service.assignment('admin',{
    ...command(),driverId:f.d[d].externalId,truckId:f.t[t].externalId,command:'ASSIGN',...extra});
  const allocate=(f:{t:any[];m:any[]},t=0,m=0,extra:Record<string,any>={})=>service.allocation('admin',{
    ...command(),truckId:f.t[t].externalId,materialId:f.m[m].externalId,command:'ALLOCATE',...extra});
  const count=async(table:string,predicate:string,values:unknown[])=>Number((await admin.query(`SELECT count(*) FROM ${table} WHERE ${predicate}`,values)).rows[0].count);

  // Privileged synthetic historical fixtures with an explicit attestation event.
  // Production legacy rows are not automatically mapped or attested by U03.
  const seedAccepted=async(kind:SqlRelationshipKind,refs:Record<string,string>,period:string)=>{
    const table=RELATIONSHIPS[kind].table,fields=Object.keys(RELATIONSHIPS[kind].fields),id=randomUUID(),operation=randomUUID();
    const values:unknown[]=[id,company,project,...fields.map(field=>refs[field])];
    const at=values.length+1;values.push(period,actor,operation,kind==='ASSIGNMENT'?`ASN-${randomUUID().replaceAll('-','')}`:kind==='ALLOCATION'?`TMA-${randomUUID().replaceAll('-','')}`:null);
    const params=Array.from({length:at-1},(_,i)=>`$${i+1}`),range=`$${at}::tstzrange`;
    params.push(range,"'ACCEPTED'",`CASE WHEN upper_inf(${range}) THEN 1 ELSE 2 END`,`lower(${range})`,
      `CASE WHEN upper_inf(${range}) THEN lower(${range}) ELSE upper(${range}) END`,
      `$${at+1}`,`$${at+1}`,"'SUPER_ADMIN'","'SUPER_ADMIN'",`$${at+2}`,`CASE WHEN upper_inf(${range}) THEN NULL ELSE $${at+2} END`,`$${at+3}`);
    const row=(await admin.query(`INSERT INTO ${table}(id,company_id,project_id,${fields.join(',')},valid_period,record_status,
      revision,created_at,updated_at,created_by,updated_by,created_role,updated_role,opened_operation_id,closed_operation_id,external_id)
      VALUES(${params.join(',')}) RETURNING *`,values)).rows[0];
    await admin.query(`INSERT INTO ${table}_events(company_id,project_id,relationship_id,revision,operation_id,action,actor_id,actor_role,effective_at,after_record)
      SELECT company_id,project_id,id,revision,$2,'TEST_RECONCILED_FIXTURE',updated_by,updated_role,updated_at,to_jsonb(r)
      FROM ${table} r WHERE id=$1`,[id,operation]);
    return row;
  };
  const rawContext=async(client:PoolClient,projectId=project,companyId=company,at?:string)=>{
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.company_id',$1,true),set_config('app.project_id',$2,true),set_config('app.actor_id',$3,true)",[companyId,projectId,actor]);
    const role=(await client.query('SELECT * FROM qsa_authorize_canonical_command(false)')).rows[0].commercial_role;
    await client.query("SELECT set_config('app.commercial_role',$1,true),set_config('app.operation_id',$2,true)",[role,randomUUID()]);
    if(at) await client.query("SELECT set_config('app.temporal_at',$1,true)",[at]);
    else await client.query("SELECT set_config('app.temporal_at',clock_timestamp()::text,true)");
  };
  const rawInsert=async(client:PoolClient,kind:SqlRelationshipKind,refs:Record<string,string>,projectId=project,companyId=company,periodSql?:string)=>{
    const table=RELATIONSHIPS[kind].table,fields=Object.keys(RELATIONSHIPS[kind].fields);
    const values=[randomUUID(),companyId,projectId,...fields.map(field=>refs[field]),
      kind==='ASSIGNMENT'?`ASN-${randomUUID().replaceAll('-','')}`:kind==='ALLOCATION'?`TMA-${randomUUID().replaceAll('-','')}`:null];
    const at="current_setting('app.temporal_at')::timestamptz",who="current_setting('app.actor_id')::uuid",role="current_setting('app.commercial_role')";
    return client.query(`INSERT INTO ${table}(id,company_id,project_id,${fields.join(',')},external_id,valid_period,record_status,
      revision,created_at,updated_at,created_by,updated_by,created_role,updated_role,opened_operation_id)
      VALUES(${values.map((_,i)=>`$${i+1}`).join(',')},${periodSql||`tstzrange(${at},NULL,'[)')`},'ACCEPTED',1,
      ${at},${at},${who},${who},${role},${role},current_setting('app.operation_id')) RETURNING id,external_id`,values);
  };
  const release=async(client:PoolClient)=>{await client.query('ROLLBACK');await client.query('DISCARD ALL');client.release();};

  beforeAll(async()=>{
    process.env.QSA_IDENTITY_HMAC_KEY=randomBytes(32).toString('hex');
    process.env.QSA_IDENTITY_ENCRYPTION_KEY=randomBytes(32).toString('hex');
    process.env.QSA_IDENTITY_KEY_VERSION='u03-test';
    expect((await admin.query('SHOW server_version')).rows[0].server_version).toMatch(/^17\./);
    await applyMigrations(migrator);
    await admin.query(`INSERT INTO companies(id,slug,name,status) VALUES
      ($1::uuid,$1::uuid::text,'U03 A','ACTIVE'),($2::uuid,$2::uuid::text,'U03 B','ACTIVE')`,[company,other]);
    await admin.query(`INSERT INTO projects(id,company_id,external_id,name,status) VALUES
      ($1,$2,$3,'A','ACTIVE'),($4,$2,$5,'A2','ACTIVE'),($6,$7,$8,'B','ACTIVE')`,
    [project,company,scope.projectId,second,scopeB.projectId,foreign,other,scopeForeign.projectId]);
    for(const [id,token,role] of [[actor,'admin','SUPER_ADMIN'],[manager,'manager','PROJECT_ADMIN'],[viewer,'viewer','VIEWER']]){
      await admin.query("INSERT INTO users(id,firebase_uid,status) VALUES($1,$2,'ACTIVE')",[id,`u03-${token}-${actor}`]);
      await admin.query("INSERT INTO user_company_roles(id,company_id,user_id,role,status) VALUES($1,$2,$3,$4,'ACTIVE')",[randomUUID(),company,id,role]);
    }
    await admin.query("INSERT INTO user_company_roles(id,company_id,user_id,role,status) VALUES($1,$2,$3,'SUPER_ADMIN','ACTIVE')",[randomUUID(),other,actor]);
    await admin.query("INSERT INTO project_access(id,company_id,project_id,user_id,role,status) VALUES($1,$2,$3,$4,'PROJECT_ADMIN','ACTIVE')",[randomUUID(),company,project,manager]);
  });
  afterAll(async()=>{
    for(const [key,value] of Object.entries(oldKeys)){if(value===undefined)delete process.env[key];else process.env[key]=value;}
    await Promise.all([admin.end(),runtime.end(),auth.end(),migrator.end()]);
  });

  for(const kind of ['DRIVER','TRUCK'] as const){
    check(`${kind} affiliation set/no-op/inactivate/reactivate/reassign preserves accepted history`,async()=>{
      const f=await fleet({c:2,affiliations:false}),entity=kind==='DRIVER'?f.d[0]:f.t[0];
      const change={...command(),kind,entityId:entity.externalId,carrierId:f.c[0].externalId,command:'SET_AFFILIATION' as const};
      const first=await service.affiliation('admin',change);
      expect(first.relationship.status).toBe('ACTIVE');expect(first.relationship).not.toHaveProperty('affiliationId');
      expect((await service.affiliation('admin',{...change,operationId:randomUUID()})).idempotent).toBe(true);
      const inactive=await service.affiliation('admin',{...change,operationId:randomUUID(),command:'INACTIVATE'});
      expect(inactive.relationship.status).toBe('INACTIVE');
      const restored=await service.affiliation('admin',{...change,operationId:randomUUID(),command:'REACTIVATE_AFFILIATION'});
      expect(restored.relationship.effectiveFrom).not.toBe(first.relationship.effectiveFrom);
      const next=await service.affiliation('admin',{...change,operationId:randomUUID(),command:'REASSIGN',carrierId:f.c[1].externalId});
      expect(next.relationship.carrierId).toBe(f.c[1].externalId);
      expect(restored.relationship.createdAt).toBe(first.relationship.createdAt);
      expect(next.relationship.createdAt).toBe(first.relationship.createdAt);
      const history=await service.history('admin',scope,kind==='DRIVER'?'DRIVER_AFFILIATION':'TRUCK_AFFILIATION',kind==='DRIVER'?'driverId':'truckId',entity.externalId);
      expect(history.map(r=>r.status)).toEqual(['ACTIVE','INACTIVE','INACTIVE']);
      expect(history.every(r=>r.recordStatus==='ACCEPTED')).toBe(true);
    });

    check(`${kind} affiliation rejects missing/ineligible participation and invalid transitions`,async()=>{
      const f=await fleet({affiliations:false}),entity=kind==='DRIVER'?f.d[0]:f.t[0];
      const request={...command(),kind,entityId:entity.externalId,carrierId:f.c[0].externalId,command:'REACTIVATE_AFFILIATION' as const};
      await expect(service.affiliation('admin',request)).rejects.toMatchObject({code:'AFFILIATION_NOT_FOUND'});
      await service.setStatus('admin',{...command(),kind,entityId:entity.externalId,status:kind==='TRUCK'?'MAINTENANCE':'SUSPENDED',expectedRevision:0});
      await expect(service.affiliation('admin',{...request,operationId:randomUUID(),command:'SET_AFFILIATION'})).rejects.toMatchObject({code:'GLOBAL_ENTITY_INELIGIBLE'});
    });
  }

  check('assignment initial, strict repeat and explicit closure preserve ASN identity and periods',async()=>{
    const f=await fleet(),first=await assign(f);
    expect(first.relationship.assignmentId).toMatch(/^ASN-[0-9a-f]{32}$/);
    expect(first.relationship).not.toHaveProperty('carrierId');
    expect((await assign(f)).idempotent).toBe(true);
    const closed=await service.assignment('admin',{...command(),command:'CLOSE',assignmentId:first.relationship.assignmentId});
    expect(closed.relationship.status).toBe('CLOSED');expect(closed.relationship.recordStatus).toBe('ACCEPTED');
    expect(closed.relationship.effectiveFrom).toBe(first.relationship.effectiveFrom);
    expect((await service.assignment('admin',{...command(),command:'CLOSE',assignmentId:first.relationship.assignmentId})).idempotent).toBe(true);
    expect(await count('driver_truck_assignments_events','relationship_id=(SELECT id FROM driver_truck_assignments WHERE external_id=$1)',[first.relationship.assignmentId])).toBe(2);
  });

  check('reassignment closes both displaced pairs at the exact half-open replacement boundary',async()=>{
    const f=await fleet({d:2,t:2}),a=await assign(f,0,0),b=await assign(f,1,1);
    const result=await assign(f,0,1,{command:'REASSIGN'});
    expect(new Set(result.closedIds)).toEqual(new Set([a.relationship.assignmentId,b.relationship.assignmentId]));
    const rows=(await admin.query(`SELECT external_id,record_status,voided_at,lower(valid_period)::text AS start,upper(valid_period)::text AS finish
      FROM driver_truck_assignments WHERE company_id=$1 AND external_id=ANY($2::text[])`,[company,[...result.closedIds,result.relationship.assignmentId]])).rows;
    const start=rows.find(r=>r.external_id===result.relationship.assignmentId).start;
    expect(rows.filter(r=>r.finish!==null).every(r=>r.finish===start)).toBe(true);
    expect(rows.every(r=>r.record_status==='ACCEPTED'&&r.voided_at===null)).toBe(true);
    const old=await service.history('admin',scope,'ASSIGNMENT','truckId',f.t[0].externalId);
    expect(old).toHaveLength(1);expect(old[0].status).toBe('CLOSED');
  });

  check('allocation repeat, reallocation and closure preserve TMA history',async()=>{
    const f=await fleet({m:2}),first=await allocate(f);
    expect(first.relationship.allocationId).toMatch(/^TMA-[0-9a-f]{32}$/);
    expect(first.relationship).not.toHaveProperty('carrierId');expect(first.relationship).not.toHaveProperty('plate');
    expect((await allocate(f)).idempotent).toBe(true);
    const secondAllocation=await allocate(f,0,1,{command:'REALLOCATE'});
    expect(secondAllocation.closedIds).toEqual([first.relationship.allocationId]);
    const history=await service.history('admin',scope,'ALLOCATION','truckId',f.t[0].externalId);
    expect(history.map(r=>r.status)).toEqual(['ACTIVE','CLOSED']);
    expect(history[1].effectiveTo).toBe(history[0].effectiveFrom);
    await service.allocation('admin',{...command(),command:'CLOSE',allocationId:secondAllocation.relationship.allocationId});
  });

  check('driver membership reduction atomically closes assignment but preserves affiliation',async()=>{
    const f=await fleet(),first=await assign(f),operationId=randomUUID();
    const reduced=await service.membership('admin',{...scope,operationId,kind:'DRIVER',entityId:f.d[0].externalId,command:'SUSPEND',expectedRevision:1});
    expect(reduced.closedRelationships).toEqual([{kind:'ASSIGNMENT',id:first.relationship.assignmentId}]);
    expect(reduced.membership.status).toBe('SUSPENDED');
    const history=await service.history('admin',scope,'ASSIGNMENT','driverId',f.d[0].externalId);
    expect(history[0].status).toBe('CLOSED');
    const affiliations=await service.history('admin',scope,'DRIVER_AFFILIATION','driverId',f.d[0].externalId);
    expect(affiliations[0].status).toBe('ACTIVE');
    expect(await count('audit_events','operation_id=$1',[operationId])).toBe(2);
    expect(await count('idempotency_receipts','operation_id=$1',[operationId])).toBe(1);
  });

  check('truck membership reduction closes assignment and allocation in one command',async()=>{
    const f=await fleet(),assignment=await assign(f),allocation=await allocate(f),operationId=randomUUID();
    const result=await service.membership('admin',{...scope,operationId,kind:'TRUCK',entityId:f.t[0].externalId,command:'REMOVE',expectedRevision:1});
    expect(new Set(result.closedRelationships.map(r=>r.id))).toEqual(new Set([assignment.relationship.assignmentId,allocation.relationship.allocationId]));
    expect(await count('audit_events','operation_id=$1',[operationId])).toBe(3);
    const boundary=(await admin.query(`SELECT upper(a.valid_period)=lower(m.valid_period) AS assignment_boundary,
      upper(t.valid_period)=lower(m.valid_period) AS allocation_boundary FROM project_trucks m
      JOIN driver_truck_assignments a ON a.truck_id=m.truck_id AND a.external_id=$1
      JOIN truck_material_allocations t ON t.truck_id=m.truck_id AND t.external_id=$2 WHERE m.truck_id=$3`,
    [assignment.relationship.assignmentId,allocation.relationship.allocationId,f.t[0].id])).rows[0];
    expect(boundary).toEqual({assignment_boundary:true,allocation_boundary:true});
  });

  check('material membership reduction closes each current allocation; carrier reduction remains guarded',async()=>{
    const f=await fleet({t:2}),a=await allocate(f,0),b=await allocate(f,1);
    await expect(service.membership('admin',{...command(),kind:'CARRIER',entityId:f.c[0].externalId,command:'REMOVE',expectedRevision:1})).rejects.toMatchObject({code:'DEPENDENT_RELATIONSHIPS_ACTIVE'});
    const result=await service.membership('admin',{...command(),kind:'MATERIAL',entityId:f.m[0].externalId,command:'SUSPEND',expectedRevision:1});
    expect(new Set(result.closedRelationships.map(r=>r.id))).toEqual(new Set([a.relationship.allocationId,b.relationship.allocationId]));
  });

  check('affiliation changes cannot mismatch an assigned counterpart or strand an allocation',async()=>{
    const f=await fleet({c:2}),assignment=await assign(f),allocation=await allocate(f);
    for(const kind of ['DRIVER','TRUCK'] as const){
      const entity=kind==='DRIVER'?f.d[0]:f.t[0];
      await expect(service.affiliation('admin',{...command(),kind,entityId:entity.externalId,carrierId:f.c[1].externalId,command:'REASSIGN'})).rejects.toMatchObject({code:'P5_B3_RELATIONSHIP_DEPENDENCY'});
      await expect(service.affiliation('admin',{...command(),kind,entityId:entity.externalId,carrierId:f.c[0].externalId,command:'INACTIVATE'})).rejects.toMatchObject({code:'P5_B3_RELATIONSHIP_DEPENDENCY'});
    }
    await service.assignment('admin',{...command(),command:'CLOSE',assignmentId:assignment.relationship.assignmentId});
    await expect(service.affiliation('admin',{...command(),kind:'TRUCK',entityId:f.t[0].externalId,carrierId:f.c[0].externalId,command:'INACTIVATE'})).rejects.toMatchObject({code:'P5_B3_RELATIONSHIP_DEPENDENCY'});
    await service.allocation('admin',{...command(),command:'CLOSE',allocationId:allocation.relationship.allocationId});
    expect((await service.affiliation('admin',{...command(),kind:'TRUCK',entityId:f.t[0].externalId,carrierId:f.c[0].externalId,command:'INACTIVATE'})).relationship.status).toBe('INACTIVE');
  });

  check('assignments reject carrier mismatch and require explicit reassignment',async()=>{
    const f=await fleet({c:2,t:2});
    await service.affiliation('admin',{...command(),kind:'TRUCK',entityId:f.t[1].externalId,carrierId:f.c[1].externalId,command:'REASSIGN'});
    await expect(assign(f,0,1)).rejects.toMatchObject({code:'CARRIER_MISMATCH'});
    await assign(f,0,0);
    await service.affiliation('admin',{...command(),kind:'TRUCK',entityId:f.t[1].externalId,carrierId:f.c[0].externalId,command:'REASSIGN'});
    await expect(assign(f,0,1)).rejects.toMatchObject({code:'ASSIGNMENT_STATE_CONFLICT'});
  });

  for(const displaced of ['driver','truck'] as const){
    check(`explicit reassignment releases displaced ${displaced} without altering its material allocation`,async()=>{
      const f=await fleet({d:2,t:2}),first=await assign(f),allocation=await allocate(f);
      const next=await assign(f,displaced==='driver'?1:0,displaced==='driver'?0:1,{command:'REASSIGN'});
      expect(next.closedIds).toEqual([first.relationship.assignmentId]);
      expect((await service.relationship('admin',scope,'ALLOCATION',allocation.relationship.allocationId)).status).toBe('ACTIVE');
      expect((await service.assignment('admin',{...command(),command:'CLOSE',assignmentId:first.relationship.assignmentId})).idempotent).toBe(true);
      expect((await service.relationship('admin',scope,'ASSIGNMENT',next.relationship.assignmentId)).status).toBe('ACTIVE');
    });
  }

  for(const [kind,status] of [['DRIVER','SUSPENDED'],['TRUCK','MAINTENANCE'],['CARRIER','SUSPENDED']] as const){
    check(`assignment fails for globally ${status} ${kind} without changing existing history`,async()=>{
      const f=await fleet(),entity=kind==='DRIVER'?f.d[0]:kind==='TRUCK'?f.t[0]:f.c[0];
      await service.setStatus('admin',{...command(),kind,entityId:entity.externalId,status,expectedRevision:0});
      await expect(assign(f)).rejects.toMatchObject({code:'GLOBAL_ENTITY_INELIGIBLE'});
      expect(await count('driver_truck_assignments','company_id=$1 AND driver_id=$2',[company,f.d[0].id])).toBe(0);
    });
  }
  for(const kind of ['DRIVER','TRUCK','CARRIER'] as const){
    check(`assignment requires currently effective ${kind} membership`,async()=>{
      const f=await fleet(),entity=kind==='DRIVER'?f.d[0]:kind==='TRUCK'?f.t[0]:f.c[0];
      const table={DRIVER:'project_drivers',TRUCK:'project_trucks',CARRIER:'project_carriers'}[kind],field=kind.toLowerCase()+'_id';
      await admin.query(`UPDATE ${table} SET valid_period=tstzrange('2020-01-01','2021-01-01','[)') WHERE company_id=$1 AND ${field}=$2`,[company,entity.id]);
      await expect(assign(f)).rejects.toMatchObject({code:'TEMPORAL_PARTICIPATION_INACTIVE'});
    });
  }
  for(const [kind,status] of [['TRUCK','MAINTENANCE'],['MATERIAL','INACTIVE'],['CARRIER','SUSPENDED']] as const){
    check(`allocation fails for globally ${status} ${kind}`,async()=>{
      const f=await fleet(),entity=kind==='TRUCK'?f.t[0]:kind==='MATERIAL'?f.m[0]:f.c[0];
      await service.setStatus('admin',{...command(),kind,entityId:entity.externalId,status,expectedRevision:0});
      await expect(allocate(f)).rejects.toMatchObject({code:'GLOBAL_ENTITY_INELIGIBLE'});
    });
  }
  for(const kind of ['TRUCK','MATERIAL','CARRIER'] as const){
    check(`allocation requires active ${kind} membership`,async()=>{
      const f=await fleet(),entity=kind==='TRUCK'?f.t[0]:kind==='MATERIAL'?f.m[0]:f.c[0];
      const table={TRUCK:'project_trucks',MATERIAL:'project_materials',CARRIER:'project_carriers'}[kind],field=kind.toLowerCase()+'_id';
      await admin.query(`UPDATE ${table} SET status='SUSPENDED' WHERE company_id=$1 AND ${field}=$2`,[company,entity.id]);
      await expect(allocate(f)).rejects.toMatchObject({code:'TEMPORAL_PARTICIPATION_INACTIVE'});
    });
  }

  check('global suspension preserves periods; explicit cleanup remains available in archived projects',async()=>{
    const f=await fleet(),assignment=await assign(f),allocation=await allocate(f);
    await service.setStatus('admin',{...command(),kind:'TRUCK',entityId:f.t[0].externalId,status:'MAINTENANCE',expectedRevision:0});
    expect((await service.relationship('admin',scope,'ASSIGNMENT',assignment.relationship.assignmentId)).status).toBe('ACTIVE');
    expect((await service.relationship('admin',scope,'ALLOCATION',allocation.relationship.allocationId)).status).toBe('ACTIVE');
    await admin.query("UPDATE projects SET status='ARCHIVED' WHERE id=$1",[project]);
    try{
      await expect(assign(f)).rejects.toMatchObject({code:'PROJECT_LIFECYCLE_MUTATION_DENIED'});
      await service.assignment('admin',{...command(),command:'CLOSE',assignmentId:assignment.relationship.assignmentId});
      await service.allocation('admin',{...command(),command:'CLOSE',allocationId:allocation.relationship.allocationId});
      expect((await service.affiliation('admin',{...command(),kind:'TRUCK',entityId:f.t[0].externalId,carrierId:f.c[0].externalId,command:'INACTIVATE'})).relationship.status).toBe('INACTIVE');
    }finally{await admin.query("UPDATE projects SET status='ACTIVE' WHERE id=$1",[project]);}
  });

  check('simultaneous incompatible API assignments serialize to one committed pair',async()=>{
    const f=await fleet({t:2});
    const results=await Promise.allSettled([assign(f,0,0),assign(f,0,1)]);
    expect(results.filter(r=>r.status==='fulfilled')).toHaveLength(1);
    expect((results.find(r=>r.status==='rejected') as PromiseRejectedResult).reason.code).toBe('ASSIGNMENT_STATE_CONFLICT');
    expect(await count('driver_truck_assignments',"company_id=$1 AND driver_id=$2 AND upper_inf(valid_period)",[company,f.d[0].id])).toBe(1);
  });
  check('simultaneous incompatible API allocations commit one material only',async()=>{
    const f=await fleet({m:2});
    const results=await Promise.allSettled([allocate(f,0,0),allocate(f,0,1)]);
    expect(results.filter(r=>r.status==='fulfilled')).toHaveLength(1);
    expect((results.find(r=>r.status==='rejected') as PromiseRejectedResult).reason.code).toBe('ALLOCATION_STATE_CONFLICT');
  });

  for(const type of ['ASSIGNMENT','ALLOCATION'] as const){
    check(`${type} lost-response retries preserve one receipt/audit/history/outbox effect`,async()=>{
      const f=await fleet(),operationId=randomUUID();
      const call=()=>type==='ASSIGNMENT'?assign(f,0,0,{operationId}):allocate(f,0,0,{operationId});
      const results=await Promise.all(Array.from({length:6},call));
      expect(results.every(r=>JSON.stringify(r)===JSON.stringify(results[0]))).toBe(true);
      expect(await count('idempotency_receipts','operation_id=$1',[operationId])).toBe(1);
      expect(await count('audit_events','operation_id=$1',[operationId])).toBe(1);
      expect(await count(RELATIONSHIPS[type].table+'_events','operation_id=$1',[operationId])).toBe(1);
      expect(await count('outbox_events',"payload->>'operationId'=$1",[operationId])).toBe(1);
      await expect(type==='ASSIGNMENT'?assign(f,0,0,{operationId,reason:'changed'}):allocate(f,0,0,{operationId,reason:'changed'})).rejects.toMatchObject({code:'IDEMPOTENCY_PAYLOAD_MISMATCH'});
    });
  }

  for(const kind of Object.keys(RELATIONSHIPS) as SqlRelationshipKind[]){
    check(`${kind} EXCLUDE rejects a real two-connection cross-project race without service prechecks`,async()=>{
      const f=await fleet({c:2,t:2,m:2,affiliations:false});
      const refs=(alternative:boolean):Record<string,string>=>kind==='DRIVER_AFFILIATION'?{driver_id:f.d[0].id,carrier_id:f.c[alternative?1:0].id}
        :kind==='TRUCK_AFFILIATION'?{truck_id:f.t[0].id,carrier_id:f.c[alternative?1:0].id}
        :kind==='ASSIGNMENT'?{driver_id:f.d[0].id,truck_id:f.t[alternative?1:0].id}:{truck_id:f.t[0].id,material_id:f.m[alternative?1:0].id};
      const clients=await Promise.all([runtime.connect(),runtime.connect()]);
      try{
        await Promise.all(clients.map((client,i)=>rawContext(client,i?second:project)));
        const pids=await Promise.all(clients.map(async client=>(await client.query('SELECT pg_backend_pid() AS pid')).rows[0].pid));
        expect(new Set(pids).size).toBe(2);
        const results=await Promise.allSettled(clients.map(async(client,i)=>{
          try{const result=await rawInsert(client,kind,refs(Boolean(i)),i?second:project);await client.query('COMMIT');return result;}
          catch(error){await client.query('ROLLBACK');throw error;}
        }));
        expect(results.filter(r=>r.status==='fulfilled')).toHaveLength(1);
        expect((results.find(r=>r.status==='rejected') as PromiseRejectedResult).reason.code).toBe('23P01');
      }finally{for(const client of clients)await release(client);}
    });
  }

  for(const kind of ['DRIVER','TRUCK'] as const){
    check(`${kind} affiliation cannot be duplicated or moved into another project`,async()=>{
      const f=await fleet(),entity=kind==='DRIVER'?f.d[0]:f.t[0];
      for(const [globalKind,value] of [[kind,entity],['CARRIER',f.c[0]]] as const) await service.membership('admin',{
        ...command(scopeB),kind:globalKind,entityId:value.externalId,command:'ENROLL',expectedRevision:0});
      await expect(service.affiliation('admin',{...command(scopeB),kind,entityId:entity.externalId,carrierId:f.c[0].externalId,command:'SET_AFFILIATION'}))
        .rejects.toMatchObject({code:'TEMPORAL_RELATIONSHIP_CONFLICT'});
      const history=await service.history('admin',scope,kind==='DRIVER'?'DRIVER_AFFILIATION':'TRUCK_AFFILIATION',kind==='DRIVER'?'driverId':'truckId',entity.externalId);
      expect(history).toHaveLength(1);expect(history[0].status).toBe('ACTIVE');
    });
  }

  check('project and company authority cannot read or close another project relationship',async()=>{
    const f=await fleet(),assignment=await assign(f),allocation=await allocate(f);
    for(const type of ['ASSIGNMENT','ALLOCATION'] as const){
      const id=type==='ASSIGNMENT'?assignment.relationship.assignmentId:allocation.relationship.allocationId;
      await expect(service.relationship('admin',scopeB,type,id)).rejects.toMatchObject({code:'TEMPORAL_RELATIONSHIP_NOT_FOUND'});
      await expect(type==='ASSIGNMENT'?service.assignment('admin',{...command(scopeB),command:'CLOSE',assignmentId:id})
        :service.allocation('admin',{...command(scopeB),command:'CLOSE',allocationId:id})).rejects.toMatchObject({code:'TEMPORAL_RELATIONSHIP_NOT_FOUND'});
      await expect(service.relationship('manager',scopeB,type,id)).rejects.toMatchObject({code:'FORBIDDEN_GLOBAL_COMMAND'});
      await expect(service.relationship('admin',scopeForeign,type,id)).rejects.toMatchObject({code:'TEMPORAL_RELATIONSHIP_NOT_FOUND'});
    }
    await expect(service.assignment('viewer',{...command(),command:'CLOSE',assignmentId:assignment.relationship.assignmentId})).rejects.toMatchObject({code:'FORBIDDEN_GLOBAL_COMMAND'});
    await expect(service.assignment('admin',{...command(),projectId:scopeForeign.projectId,command:'CLOSE',assignmentId:assignment.relationship.assignmentId})).rejects.toMatchObject({code:'PROJECT_NOT_FOUND'});
    expect((await service.relationship('admin',scope,'ASSIGNMENT',assignment.relationship.assignmentId)).status).toBe('ACTIVE');
  });

  check('runtime RLS and composite FKs reject foreign tenant references and history reads',async()=>{
    const f=await fleet(),assignment=await assign(f);
    await withUnitOfWork({companyId:other,projectId:foreign,actorId:actor},async uow=>{
      expect((await uow.query('SELECT * FROM driver_truck_assignments WHERE external_id=$1',[assignment.relationship.assignmentId])).rowCount).toBe(0);
      expect((await uow.query('SELECT * FROM driver_truck_assignments_events')).rowCount).toBe(0);
    },runtime);
    const client=await runtime.connect();
    try{
      await rawContext(client,foreign,other);
      await expect(rawInsert(client,'ASSIGNMENT',{driver_id:f.d[0].id,truck_id:f.t[0].id},foreign,other)).rejects.toMatchObject({code:'23503'});
    }finally{await release(client);}
  });

  for(const kind of Object.keys(RELATIONSHIPS) as SqlRelationshipKind[]){
    check(`${kind} accepted closed history still excludes overlapping periods`,async()=>{
      const f=await fleet({affiliations:false});
      const refs:Record<string,string>=kind==='DRIVER_AFFILIATION'?{driver_id:f.d[0].id,carrier_id:f.c[0].id}
        :kind==='TRUCK_AFFILIATION'?{truck_id:f.t[0].id,carrier_id:f.c[0].id}
        :kind==='ASSIGNMENT'?{driver_id:f.d[0].id,truck_id:f.t[0].id}:{truck_id:f.t[0].id,material_id:f.m[0].id};
      const historical=await seedAccepted(kind,refs,'[2020-01-01,2021-01-01)');
      const client=await runtime.connect();
      try{
        await rawContext(client,project,company,'2020-06-01T00:00:00Z');
        await expect(rawInsert(client,kind,refs)).rejects.toMatchObject({code:'23P01'});
      }finally{await release(client);}
      const row=(await admin.query(`SELECT record_status,voided_at,valid_period FROM ${RELATIONSHIPS[kind].table} WHERE id=$1`,[historical.id])).rows[0];
      expect(row.record_status).toBe('ACCEPTED');expect(row.voided_at).toBeNull();expect(row.valid_period).toBe(historical.valid_period);
    });
  }

  for(const [name,expression] of [
    ['empty',"tstzrange(current_setting('app.temporal_at')::timestamptz,current_setting('app.temporal_at')::timestamptz,'[)')"],
    ['inverted',"tstzrange(current_setting('app.temporal_at')::timestamptz,current_setting('app.temporal_at')::timestamptz-interval '1 second','[)')"],
    ['exclusive lower',"tstzrange(current_setting('app.temporal_at')::timestamptz,NULL,'()')"],
    ['unbounded lower',"tstzrange(NULL,NULL,'[)')"],
  ]){
    check(`PostgreSQL rejects ${name} runtime periods without application validation`,async()=>{
      const f=await fleet({affiliations:false}),client=await runtime.connect();
      try{
        await rawContext(client);
        await expect(rawInsert(client,'ASSIGNMENT',{driver_id:f.d[0].id,truck_id:f.t[0].id},project,company,expression)).rejects.toThrow();
      }finally{await release(client);}
      expect(await count('driver_truck_assignments','driver_id=$1',[f.d[0].id])).toBe(0);
    });
  }

  check('future accepted assignments and allocations cannot be prematurely closed or displaced',async()=>{
    const f=await fleet();
    const assignment=await seedAccepted('ASSIGNMENT',{driver_id:f.d[0].id,truck_id:f.t[0].id},'[2040-01-01,)');
    const allocation=await seedAccepted('ALLOCATION',{truck_id:f.t[0].id,material_id:f.m[0].id},'[2040-01-01,)');
    await expect(assign(f)).rejects.toMatchObject({code:'FUTURE_TEMPORAL_CONFLICT'});
    await expect(allocate(f)).rejects.toMatchObject({code:'FUTURE_TEMPORAL_CONFLICT'});
    await expect(service.assignment('admin',{...command(),command:'CLOSE',assignmentId:assignment.external_id})).rejects.toMatchObject({code:'FUTURE_TEMPORAL_CONFLICT'});
    await expect(service.allocation('admin',{...command(),command:'CLOSE',allocationId:allocation.external_id})).rejects.toMatchObject({code:'FUTURE_TEMPORAL_CONFLICT'});
    await expect(service.membership('admin',{...command(),kind:'TRUCK',entityId:f.t[0].externalId,command:'REMOVE',expectedRevision:1})).rejects.toMatchObject({code:'FUTURE_TEMPORAL_CONFLICT'});
    expect((await admin.query('SELECT upper_inf(valid_period) AS open FROM driver_truck_assignments WHERE id=$1',[assignment.id])).rows[0].open).toBe(true);
  });

  check('caller times, roles, foreign references and internal UUID replacement IDs fail closed',async()=>{
    const f=await fleet(),assignment=await assign(f);
    await expect(assign(f,0,0,{effectiveFrom:'2040-01-01'})).rejects.toMatchObject({code:'INVALID_TEMPORAL_COMMAND'});
    await expect(assign(f,0,0,{role:'SUPER_ADMIN'})).rejects.toMatchObject({code:'INVALID_TEMPORAL_COMMAND'});
    await expect(service.assignment('admin',{...command(),command:'REASSIGN',driverId:'DRV-does-not-exist',truckId:f.t[0].externalId})).rejects.toMatchObject({code:'GLOBAL_ENTITY_NOT_FOUND'});
    const row=(await admin.query('SELECT id FROM driver_truck_assignments WHERE external_id=$1',[assignment.relationship.assignmentId])).rows[0];
    await expect(service.assignment('admin',{...command(),command:'CLOSE',assignmentId:row.id})).rejects.toMatchObject({code:'TEMPORAL_RELATIONSHIP_NOT_FOUND'});
    await expect(service.assignment('unknown-token',{...command(),command:'CLOSE',assignmentId:assignment.relationship.assignmentId})).rejects.toMatchObject({code:'INVALID_TOKEN'});
  });

  check('membership cleanup also reconciles proven same-state consequences without rewriting the parent',async()=>{
    const f=await fleet(),assignment=await assign(f);
    await admin.query("UPDATE project_drivers SET status='SUSPENDED' WHERE driver_id=$1",[f.d[0].id]);
    const before=(await admin.query('SELECT row_to_json(m) AS row FROM project_drivers m WHERE driver_id=$1',[f.d[0].id])).rows[0].row;
    const operationId=randomUUID(),request={...scope,operationId,kind:'DRIVER' as const,entityId:f.d[0].externalId,command:'SUSPEND' as const,expectedRevision:1};
    const result=await service.membership('admin',request);
    expect(result.idempotent).toBe(false);expect(result.closedRelationships).toEqual([{kind:'ASSIGNMENT',id:assignment.relationship.assignmentId}]);
    expect(await service.membership('admin',request)).toEqual(result);
    expect((await admin.query('SELECT row_to_json(m) AS row FROM project_drivers m WHERE driver_id=$1',[f.d[0].id])).rows[0].row).toEqual(before);
    expect(await count('audit_events','operation_id=$1',[operationId])).toBe(1);
  });

  for(const target of ['audit_events','outbox_events']){
    check(`${target} failure rolls back both displaced assignments and all temporal events`,async()=>{
      const f=await fleet({d:2,t:2});await assign(f,0,0);await assign(f,1,1);
      const operationId=randomUUID(),ids=[f.d[0].id,f.d[1].id];
      const sql='SELECT row_to_json(r) AS row FROM driver_truck_assignments r WHERE driver_id=ANY($1::uuid[]) ORDER BY id';
      const before=(await admin.query(sql,[ids])).rows;
      await admin.query(`CREATE FUNCTION u03_abort() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
        IF ${target==='audit_events'?`NEW.operation_id='${operationId}'`:`NEW.payload->>'operationId'='${operationId}'`} THEN
        RAISE EXCEPTION 'U03_TEST_FAILURE'; END IF;RETURN NEW;END $$`);
      await admin.query(`CREATE TRIGGER u03_abort BEFORE INSERT ON ${target} FOR EACH ROW EXECUTE FUNCTION u03_abort()`);
      try{
        await expect(assign(f,0,1,{command:'REASSIGN',operationId})).rejects.toMatchObject({code:'SQL_AUTHORITY_UNAVAILABLE'});
        expect((await admin.query(sql,[ids])).rows).toEqual(before);
        expect(await count('driver_truck_assignments_events','operation_id=$1',[operationId])).toBe(0);
        expect(await count('audit_events','operation_id=$1',[operationId])).toBe(0);
        expect(await count('outbox_events',"payload->>'operationId'=$1",[operationId])).toBe(0);
        expect(await count('idempotency_receipts','operation_id=$1',[operationId])).toBe(0);
      }finally{await admin.query(`DROP TRIGGER u03_abort ON ${target}`);await admin.query('DROP FUNCTION u03_abort()');}
    });
  }

  check('late parent membership audit failure rolls back already staged temporal cleanup',async()=>{
    const f=await fleet();const assignment=await assign(f),allocation=await allocate(f),operationId=randomUUID();
    await admin.query(`CREATE FUNCTION u03_abort_parent() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
      IF NEW.operation_id='${operationId}' AND NEW.action='MEMBERSHIP_REMOVE' THEN RAISE EXCEPTION 'U03_PARENT_FAILURE';END IF;RETURN NEW;END $$`);
    await admin.query('CREATE TRIGGER u03_abort_parent BEFORE INSERT ON audit_events FOR EACH ROW EXECUTE FUNCTION u03_abort_parent()');
    try{
      await expect(service.membership('admin',{...scope,operationId,kind:'TRUCK',entityId:f.t[0].externalId,command:'REMOVE',expectedRevision:1})).rejects.toMatchObject({code:'SQL_AUTHORITY_UNAVAILABLE'});
      expect((await service.relationship('admin',scope,'ASSIGNMENT',assignment.relationship.assignmentId)).status).toBe('ACTIVE');
      expect((await service.relationship('admin',scope,'ALLOCATION',allocation.relationship.allocationId)).status).toBe('ACTIVE');
      expect((await admin.query('SELECT status,revision FROM project_trucks WHERE truck_id=$1',[f.t[0].id])).rows[0]).toEqual({status:'ACTIVE',revision:'1'});
      for(const table of ['audit_events','idempotency_receipts','driver_truck_assignments_events','truck_material_allocations_events']) expect(await count(table,'operation_id=$1',[operationId])).toBe(0);
    }finally{await admin.query('DROP TRIGGER u03_abort_parent ON audit_events');await admin.query('DROP FUNCTION u03_abort_parent()');}
  });

  check('affiliation logical creation provenance survives a different actor reactivating a new period',async()=>{
    const f=await fleet({affiliations:false}),base={kind:'DRIVER' as const,entityId:f.d[0].externalId,carrierId:f.c[0].externalId};
    const first=await service.affiliation('manager',{...command(),...base,command:'SET_AFFILIATION'});
    await service.affiliation('admin',{...command(),...base,command:'INACTIVATE'});
    const next=await service.affiliation('admin',{...command(),...base,command:'REACTIVATE_AFFILIATION'});
    expect(next.relationship.createdBy).toBe(manager);expect(next.relationship.createdAt).toBe(first.relationship.createdAt);
    expect(next.relationship.updatedBy).toBe(actor);
    const events=(await admin.query(`SELECT actor_id,actor_role FROM driver_carrier_affiliations_events
      WHERE company_id=$1 AND after_record->>'driver_id'=$2 ORDER BY effective_at,revision`,[company,f.d[0].id])).rows;
    expect(events.map(e=>e.actor_role)).toEqual(['PROJECT_ADMIN','SUPER_ADMIN','SUPER_ADMIN']);
  });

  check('closed history and immutable references cannot be tampered with through runtime grants',async()=>{
    const f=await fleet(),first=await assign(f),id=(await admin.query('SELECT id FROM driver_truck_assignments WHERE external_id=$1',[first.relationship.assignmentId])).rows[0].id;
    await service.assignment('admin',{...command(),command:'CLOSE',assignmentId:first.relationship.assignmentId});
    await expect(runtime.query('DELETE FROM driver_truck_assignments WHERE id=$1',[id])).rejects.toMatchObject({code:'42501'});
    await expect(runtime.query('UPDATE driver_truck_assignments SET truck_id=$1 WHERE id=$2',[f.t[0].id,id])).rejects.toMatchObject({code:'42501'});
    for(const operation of ['UPDATE driver_truck_assignments_events SET revision=999','DELETE FROM driver_truck_assignments_events',
      'INSERT INTO driver_truck_assignments_events SELECT * FROM driver_truck_assignments_events']){
      await expect(runtime.query(operation)).rejects.toMatchObject({code:'42501'});
    }
    const client=await runtime.connect();
    try{
      await rawContext(client);
      await expect(client.query("UPDATE driver_truck_assignments SET valid_period=tstzrange(lower(valid_period),NULL,'[)') WHERE id=$1",[id])).rejects.toMatchObject({code:'23514'});
    }finally{await release(client);}
    expect((await service.relationship('admin',scope,'ASSIGNMENT',first.relationship.assignmentId)).status).toBe('CLOSED');
    for(const role of ['qsa_migrator','qsa_temporal_history_writer','qsa_command_authorizer','qsa_auth']) await expect(runtime.query(`SET ROLE ${role}`)).rejects.toMatchObject({code:'42501'});
  });

  check('stale history witnesses and forged receipt results fail closed without normal repair',async()=>{
    const f=await fleet(),operationId=randomUUID(),first=await assign(f,0,0,{operationId});
    const row=(await admin.query('SELECT id FROM driver_truck_assignments WHERE external_id=$1',[first.relationship.assignmentId])).rows[0];
    await admin.query("UPDATE idempotency_receipts SET result_encrypted=result_encrypted||'tampered' WHERE operation_id=$1",[operationId]);
    await expect(assign(f,0,0,{operationId})).rejects.toMatchObject({code:'IDENTITY_LOOKUP_INTEGRITY_ERROR'});
    await admin.query("UPDATE driver_truck_assignments_events SET after_record=jsonb_set(after_record,'{revision}','999') WHERE relationship_id=$1",[row.id]);
    await expect(service.assignment('admin',{...command(),command:'CLOSE',assignmentId:first.relationship.assignmentId})).rejects.toMatchObject({code:'TEMPORAL_RECONCILIATION_REQUIRED'});
    expect((await admin.query('SELECT upper_inf(valid_period) AS open FROM driver_truck_assignments WHERE id=$1',[row.id])).rows[0].open).toBe(true);
  });

  check('VOIDED remains explicit invalidation and is never projected as normal CLOSED history',async()=>{
    const f=await fleet(),first=await assign(f);
    await admin.query("UPDATE driver_truck_assignments SET record_status='VOIDED',voided_at=clock_timestamp() WHERE external_id=$1",[first.relationship.assignmentId]);
    await expect(service.relationship('admin',scope,'ASSIGNMENT',first.relationship.assignmentId)).rejects.toMatchObject({code:'TEMPORAL_RECONCILIATION_REQUIRED'});
    expect(await service.history('admin',scope,'ASSIGNMENT','driverId',f.d[0].externalId)).toEqual([]);
    expect((await admin.query('SELECT record_status,voided_at FROM driver_truck_assignments WHERE external_id=$1',[first.relationship.assignmentId])).rows[0].record_status).toBe('VOIDED');
  });

  check('new operation/role/time settings are cleared on same-connection pool reuse',async()=>{
    const one=new pg.Pool({connectionString:process.env.DATABASE_URL,max:1});
    const isolated=new SqlTemporalAuthority({runtimePool:one,authPool:auth,verifyToken:async()=>({uid:`u03-admin-${actor}`})});
    try{
      const f=await fleet();await isolated.assignment('valid',{...command(),driverId:f.d[0].externalId,truckId:f.t[0].externalId,command:'ASSIGN'});
      const state=(await one.query(`SELECT current_user,current_setting('app.company_id',true) AS company,
        current_setting('app.project_id',true) AS project,current_setting('app.actor_id',true) AS actor,
        current_setting('app.operation_id',true) AS operation,current_setting('app.commercial_role',true) AS role,
        current_setting('app.temporal_at',true) AS time,current_setting('app.temporal_action',true) AS action`)).rows[0];
      expect(state.current_user).toBe('qsa_runtime');
      for(const key of ['company','project','actor','operation','role','time','action']) expect(state[key]||'').toBe('');
    }finally{await one.end();}
  });

  check('history uses the real index and keyset pages retain completed records beyond the first 50',async()=>{
    const f=await fleet();const operation=randomUUID();
    await admin.query(`INSERT INTO driver_truck_assignments(id,company_id,project_id,driver_id,truck_id,valid_period,record_status,
      external_id,revision,created_at,updated_at,created_by,updated_by,created_role,updated_role,opened_operation_id,closed_operation_id)
      SELECT gen_random_uuid(),$1,$2,$3,$4,tstzrange('1990-01-01'::timestamptz+n*interval '1 day',
        '1990-01-01'::timestamptz+(n+1)*interval '1 day','[)'),'ACCEPTED','ASN-'||replace(gen_random_uuid()::text,'-',''),2,
        '1990-01-01'::timestamptz+n*interval '1 day','1990-01-01'::timestamptz+(n+1)*interval '1 day',
        $5,$5,'SUPER_ADMIN','SUPER_ADMIN',$6,$6 FROM generate_series(1,2000) n`,[company,project,f.d[0].id,f.t[0].id,actor,operation]);
    await admin.query(`INSERT INTO driver_truck_assignments_events(company_id,project_id,relationship_id,revision,operation_id,action,actor_id,actor_role,effective_at,after_record)
      SELECT company_id,project_id,id,revision,$2,'TEST_RECONCILED_FIXTURE',updated_by,updated_role,updated_at,to_jsonb(r)
      FROM driver_truck_assignments r WHERE driver_id=$1`,[f.d[0].id,operation]);
    await admin.query('ANALYZE driver_truck_assignments');
    const plan=(await admin.query(`EXPLAIN (ANALYZE,BUFFERS,FORMAT JSON) SELECT id FROM driver_truck_assignments
      WHERE company_id=$1 AND project_id=$2 AND driver_id=$3 ORDER BY lower(valid_period) DESC,id DESC LIMIT 50`,[company,project,f.d[0].id])).rows[0]['QUERY PLAN'][0];
    expect(JSON.stringify(plan)).toContain('driver_truck_assignments_history_idx');
    console.info('U03 history EXPLAIN',JSON.stringify({index:'driver_truck_assignments_history_idx',executionMs:plan['Execution Time'],rows:plan.Plan['Actual Rows']}));
    const a=await service.historyPage('admin',scope,'ASSIGNMENT','driverId',f.d[0].externalId,50);
    const b=await service.historyPage('admin',scope,'ASSIGNMENT','driverId',f.d[0].externalId,50,a.nextCursor!);
    expect(a.items).toHaveLength(50);expect(b.items).toHaveLength(50);expect(new Set([...a.items,...b.items].map(r=>r.assignmentId)).size).toBe(100);
    expect(a.items.every(r=>r.status==='CLOSED'&&r.recordStatus==='ACCEPTED')).toBe(true);
    expect(await service.relationship('admin',scope,'ASSIGNMENT',b.items.at(-1)!.assignmentId)).toEqual(b.items.at(-1));
    await expect(service.historyPage('admin',scope,'ASSIGNMENT','driverId',f.d[0].externalId,50,'invalid')).rejects.toMatchObject({code:'INVALID_TEMPORAL_COMMAND'});
  });

  check('migration 005 repeats without reapplication and rejects changed checksums',async()=>{
    expect((await applyMigrations(migrator)).verified).toEqual(['001','002','003','004','005']);
    expect(await verifyMigrations(migrator)).toMatchObject({allValid:true,appliedCount:5,pendingCount:0});
    await admin.query("UPDATE schema_migrations SET checksum='tampered' WHERE version='005'");
    try{await expect(applyMigrations(migrator)).rejects.toThrow('checksum mismatch');}
    finally{await admin.query("UPDATE schema_migrations SET checksum=$1 WHERE version='005'",[loadMigrationFiles()[4].checksum]);}
  });

  check('same-state carrier reduction cannot bypass the existing dependency safeguard',async()=>{
    const f=await fleet();
    await admin.query("UPDATE project_carriers SET status='REMOVED' WHERE carrier_id=$1",[f.c[0].id]);
    const operationId=randomUUID();
    await expect(service.membership('admin',{...scope,operationId,kind:'CARRIER',entityId:f.c[0].externalId,command:'REMOVE',expectedRevision:1}))
      .rejects.toMatchObject({code:'DEPENDENT_RELATIONSHIPS_ACTIVE'});
    expect(await count('idempotency_receipts','operation_id=$1',[operationId])).toBe(0);
    expect((await service.history('admin',scope,'DRIVER_AFFILIATION','driverId',f.d[0].externalId))[0].status).toBe('ACTIVE');
  });

  check('membership cleanup in Project A never cascades into Project B',async()=>{
    const f=await fleet({},scopeB);
    const relationship=await service.assignment('admin',{...command(scopeB),driverId:f.d[0].externalId,truckId:f.t[0].externalId,command:'ASSIGN'});
    await service.membership('admin',{...command(),kind:'DRIVER',entityId:f.d[0].externalId,command:'ENROLL',expectedRevision:0});
    const result=await service.membership('manager',{...command(),kind:'DRIVER',entityId:f.d[0].externalId,command:'SUSPEND',expectedRevision:1});
    expect(result.closedRelationships).toEqual([]);
    expect((await service.relationship('admin',scopeB,'ASSIGNMENT',relationship.relationship.assignmentId)).status).toBe('ACTIVE');
  });

  check('material cleanup exceeding the established 50-relationship limit makes no partial changes',async()=>{
    const tenant=randomUUID(),p=randomUUID(),at={companyId:tenant,projectId:`Q-PRJ-${p}`};
    await admin.query("INSERT INTO companies(id,slug,name,status) VALUES($1::uuid,$1::uuid::text,'Limit fixture','ACTIVE')",[tenant]);
    await admin.query("INSERT INTO projects(id,company_id,external_id,name,status) VALUES($1,$2,$3,'Limit fixture','ACTIVE')",[p,tenant,at.projectId]);
    await admin.query("INSERT INTO user_company_roles(id,company_id,user_id,role,status) VALUES($1,$2,$3,'SUPER_ADMIN','ACTIVE')",[randomUUID(),tenant,actor]);
    const material=await make('MATERIAL',at),operation=randomUUID();
    await admin.query(`INSERT INTO trucks(id,company_id,external_id,normalized_plate,type,status)
      SELECT gen_random_uuid(),$1,'TRK-'||replace(gen_random_uuid()::text,'-',''),'LIMIT-'||n||'-'||$2,'DUMPER','ACTIVE'
      FROM generate_series(1,51) n`,[tenant,operation]);
    await admin.query(`INSERT INTO truck_material_allocations(id,company_id,project_id,truck_id,material_id,valid_period,record_status,
      external_id,revision,created_by,updated_by,created_role,updated_role,opened_operation_id,updated_at)
      SELECT gen_random_uuid(),$1,$2,t.id,$3,tstzrange(clock_timestamp(),NULL,'[)'),'ACCEPTED',
        'TMA-'||replace(gen_random_uuid()::text,'-',''),1,$4,$4,'SUPER_ADMIN','SUPER_ADMIN',$5,clock_timestamp()
      FROM trucks t WHERE t.company_id=$1`,[tenant,p,material.id,actor,operation]);
    await admin.query(`INSERT INTO truck_material_allocations_events(company_id,project_id,relationship_id,revision,operation_id,action,actor_id,actor_role,effective_at,after_record)
      SELECT company_id,project_id,id,revision,$2,'TEST_RECONCILED_FIXTURE',updated_by,updated_role,updated_at,to_jsonb(r)
      FROM truck_material_allocations r WHERE company_id=$1`,[tenant,operation]);
    await expect(service.membership('admin',{...command(at),kind:'MATERIAL',entityId:material.externalId,command:'REMOVE',expectedRevision:1}))
      .rejects.toMatchObject({code:'DEPENDENT_RELATIONSHIPS_ACTIVE'});
    expect(await count('truck_material_allocations','company_id=$1 AND upper_inf(valid_period)',[tenant])).toBe(51);
    expect((await admin.query('SELECT status FROM project_materials WHERE company_id=$1 AND material_id=$2',[tenant,material.id])).rows[0].status).toBe('ACTIVE');
  });
});
