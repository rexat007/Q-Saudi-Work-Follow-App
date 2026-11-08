import {unavailablePostgres} from './helpers/unavailablePostgres.js';
import {beforeAll,afterAll,describe,it,expect} from 'vitest';
import {randomBytes,randomUUID} from 'node:crypto';
import os from 'node:os';
import {performance} from 'node:perf_hooks';
import pg from 'pg';
import express from 'express';
import type {Server} from 'node:http';
import {SqlProjectReadAuthority} from '../db/projectReadAuthority.js';
import {SqlTemporalAuthority} from '../db/temporalAuthority.js';
import {FOUNDATION_SQL} from '../db/foundationReadRepository.js';
import {applyMigrations,verifyMigrations,loadMigrationFiles} from '../db/migrator.js';
import {mountIsolatedSqlProjectReadRoutes} from '../../server/sqlProjectReadRoutes.js';
import {withUnitOfWork} from '../db/unitOfWork.js';

if(process.env.QSA_TEST_DATABASE_ISOLATED!=='1'||!process.env.TEST_DATABASE_URL)throw Error('Isolated PostgreSQL required');
const check=(name:string,fn:()=>Promise<void>)=>it(name,fn,30000);
describe('AR2-U04 real PostgreSQL bounded Foundation reads',()=>{
  const pool=(key:string)=>new pg.Pool({connectionString:process.env[key],max:4});
  const admin=pool('TEST_DATABASE_URL'),runtime=pool('DATABASE_URL'),auth=pool('AUTH_DATABASE_URL'),migrator=pool('MIGRATION_DATABASE_URL');
  let measurement:{statements:string[];rows:number;queryMs:number}|null=null;
  // Count actual client protocol calls, including role checks, BEGIN/COMMIT and DISCARD.
  for(const pool of [runtime,auth])pool.on('connect',client=>{
    const original=client.query.bind(client);
    (client as any).query=(...args:any[])=>{
      const m=measurement,start=performance.now();if(m)m.statements.push(typeof args[0]==='string'?args[0]:args[0].text);
      const record=(result:any)=>{if(m){m.rows+=result?.rows?.length||0;m.queryMs+=performance.now()-start;}};
      if(typeof args.at(-1)==='function'){
        const cb=args.at(-1);args[args.length-1]=(error:any,result:any)=>{record(result);cb(error,result);};
        return (original as any)(...args);
      }
      return (original as any)(...args).then((result:any)=>{record(result);return result;});
    };
  });
  const company=randomUUID(),other=randomUUID(),actor=randomUUID(),manager=randomUUID(),finance=randomUUID(),viewer=randomUUID();
  const projects=new Map<number,string>();const second=randomUUID(),foreign=randomUUID();
  const uid=(token:string)=>`u04-${token}-${actor}`;
  const verifyToken=async(token:string)=>{if(!['admin','manager','finance','viewer'].includes(token))throw Error('Invalid');return {uid:uid(token),role:'SUPER_ADMIN'};};
  let now=Date.now();const key=randomBytes(32);
  const reads=new SqlProjectReadAuthority({runtimePool:runtime,authPool:auth,verifyToken,backendEpoch:'u04-isolated-1',cursorKey:key,now:()=>now});
  const commands=new SqlTemporalAuthority({runtimePool:runtime,authPool:auth,verifyToken});
  let server:Server,url:string;
  const scope=(n=24)=>({companyId:company,projectExternalId:`Q-PRJ-${projects.get(n)}`});
  const request=async(path:string,token='admin',companyId=company,headers:Record<string,string>={})=>fetch(url+path,{headers:{Authorization:`Bearer ${token}`,'X-Company-Id':companyId,...headers}});
  const route=(n=24)=>`/api/v2/projects/${scope(n).projectExternalId}`;
  const keys=['QSA_IDENTITY_HMAC_KEY','QSA_IDENTITY_ENCRYPTION_KEY','QSA_IDENTITY_KEY_VERSION'];
  const old=Object.fromEntries(keys.map(k=>[k,process.env[k]]));
  const freshProjection=async(n=24)=>admin.query(`INSERT INTO project_foundation_summaries(id,company_id,project_id,project_revision,foundation_revision,source_revision,stale)
    SELECT gen_random_uuid(),company_id,id,version,1,readiness_revision,false FROM projects WHERE id=$1
    ON CONFLICT(company_id,project_id) DO UPDATE SET project_revision=excluded.project_revision,
      foundation_revision=project_foundation_summaries.foundation_revision+1,source_revision=excluded.source_revision,stale=false`,[projects.get(n)]);
  const canonicalFixtures=new Map<string,string>();
  const make=async(kind:'TRUCK'|'DRIVER'|'CARRIER'|'MATERIAL',n=24)=>{
    if(canonicalFixtures.has(kind))return canonicalFixtures.get(kind)!;
    const result=await commands.create('admin',{companyId:company,projectId:scope(n).projectExternalId,operationId:randomUUID(),kind,
      naturalKey:kind==='DRIVER'?'2000000041':kind==='CARRIER'?'1000000041':kind==='TRUCK'?'ا ب ج 9141':'U04 MATERIAL',
      profile:kind==='DRIVER'?{fullNameAr:'اختبار',phone:'0551234567'}:kind==='TRUCK'?{truckType:'DUMPER'}:
        kind==='CARRIER'?{nameAr:'اختبار'}:{nameAr:'اختبار',unitOfMeasure:'TON'}});
    canonicalFixtures.set(kind,result.identity.externalId);return result.identity.externalId;
  };
  const member=async(kind:any,entityId:string,command:any,n=24,expectedRevision=0)=>commands.membership('admin',{
    companyId:company,projectId:scope(n).projectExternalId,operationId:randomUUID(),kind,entityId,command,expectedRevision});
  beforeAll(async()=>{
    process.env.QSA_IDENTITY_HMAC_KEY=randomBytes(32).toString('hex');process.env.QSA_IDENTITY_ENCRYPTION_KEY=randomBytes(32).toString('hex');process.env.QSA_IDENTITY_KEY_VERSION='u04-test';
    expect((await admin.query('SHOW server_version')).rows[0].server_version).toMatch(/^17\./);
    await applyMigrations(migrator);
    await admin.query(`INSERT INTO companies(id,slug,name,status) VALUES($1::uuid,$1::uuid::text,'fixture','ACTIVE'),($2::uuid,$2::uuid::text,'fixture','ACTIVE')`,[company,other]);
    for(const [id,token] of [[actor,'admin'],[manager,'manager'],[finance,'finance'],[viewer,'viewer']]){
      await admin.query('INSERT INTO users(id,firebase_uid,status) VALUES($1,$2,\'ACTIVE\')',[id,uid(token)]);
      await admin.query(`INSERT INTO user_company_roles(id,company_id,user_id,role,status) VALUES(gen_random_uuid(),$1,$2,$3,'ACTIVE')`,
        [company,id,token==='admin'?'SUPER_ADMIN':token==='manager'?'PROJECT_ADMIN':token==='finance'?'FINANCE_AUDITOR':'VIEWER']);
    }
    await admin.query(`INSERT INTO user_company_roles(id,company_id,user_id,role,status) VALUES(gen_random_uuid(),$1,$2,'SUPER_ADMIN','ACTIVE')`,[other,actor]);
    for(const [id,tenant] of [[second,company],[foreign,other]])await admin.query(`INSERT INTO projects(id,company_id,external_id,name,status) VALUES($1,$2,$3,'fixture','ACTIVE')`,[id,tenant,`Q-PRJ-${id}`]);
    for(const n of [24,100,1000]){
      const p=randomUUID();projects.set(n,p);
      await admin.query(`INSERT INTO projects(id,company_id,external_id,name,status) VALUES($1,$2,$3,'fixture','SETUP')`,[p,company,`Q-PRJ-${p}`]);
      if(n===24)for(const kind of ['DRIVER','TRUCK','CARRIER','MATERIAL'] as const)await make(kind);
      await admin.query(`WITH globals AS (INSERT INTO trucks(id,company_id,external_id,normalized_plate,type,status)
        SELECT gen_random_uuid(),$1::uuid,'TRK-FIXTURE-'||$2::uuid::text||'-'||g,'FIXTURE-'||$2::uuid::text||'-'||g,'DUMPER','ACTIVE' FROM generate_series(1,$3::int) g RETURNING id)
        INSERT INTO project_trucks(id,company_id,project_id,truck_id,status) SELECT gen_random_uuid(),$1,$2,id,'ACTIVE' FROM globals`,[company,p,n]);
      // Keep external IDs distinct between fixture projects (canonical company uniqueness).
    }
    for(const [user,role] of [[manager,'PROJECT_ADMIN'],[finance,'FINANCE_AUDITOR']])await admin.query(`INSERT INTO project_access(id,company_id,project_id,user_id,role,status)
      VALUES(gen_random_uuid(),$1,$2,$3,$4,'ACTIVE')`,[company,projects.get(24),user,role]);
    // A second tenant supplies realistic index selectivity; do not disable seqscan
    // or demand an index over a table consisting almost entirely of one project.
    await admin.query(`WITH globals AS (INSERT INTO trucks(id,company_id,external_id,normalized_plate,type,status)
      SELECT gen_random_uuid(),$1::uuid,'TRK-BACKGROUND-'||g,'BACKGROUND-'||g,'DUMPER','ACTIVE'
      FROM generate_series(1,5000) g RETURNING id)
      INSERT INTO project_trucks(id,company_id,project_id,truck_id,status) SELECT gen_random_uuid(),$1,$2,id,'ACTIVE' FROM globals`,[other,foreign]);
    for(const table of ['projects','project_trucks','trucks','project_foundation_summaries'])await admin.query(`ANALYZE ${table}`);
    const app=express();app.disable('etag');mountIsolatedSqlProjectReadRoutes(app,reads);
    server=await new Promise<Server>(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s));});
    url=`http://127.0.0.1:${(server.address() as any).port}`;
  },30000);
  afterAll(async()=>{measurement=null;if(server)await new Promise<void>(resolve=>server.close(()=>resolve()));for(const k of keys){if(old[k]===undefined)delete process.env[k];else process.env[k]=old[k];}
    await Promise.all([admin.end(),runtime.end(),auth.end(),migrator.end()]);});

  check('summary contains scalar facts, explicit pending stages and no identity/profile arrays',async()=>{
    const r=await reads.summary('admin',scope());expect(r.body.data.counts.trucks).toBe(24);
    expect(r.body.data).toMatchObject({stale:true,foundationRevision:null,readinessState:'INCOMPLETE',workspaceStatus:'UNBOUND'});
    expect(r.body.data.setupStages).toHaveLength(8);
    expect(JSON.stringify(r.body)).not.toMatch(/knownDrivers|knownTrucks|phone|nationalId|normalized_plate|profile|participants|pricingRules|fleetRows/);
  });
  for(const n of [24,100,1000])check(`${n}-truck summary has constant protocol query count and bounded payload`,async()=>{
    measurement={statements:[],rows:0,queryMs:0};const started=performance.now();
    const response=await request(route(n)+'/foundation-summary');const text=await response.text();const elapsed=performance.now()-started;
    const m=measurement;measurement=null;expect(response.status).toBe(200);
    // Ten client statements plus the single SELECT inside the SQL authorizer.
    expect(m.statements.length).toBe(10);expect(m.statements.length+1).toBeLessThanOrEqual(12);expect(m.rows).toBeLessThanOrEqual(10);
    expect(Buffer.byteLength(text)).toBeLessThan(2500);expect(JSON.parse(text).data.counts.trucks).toBe(n);
    console.info('U04 BUDGET',JSON.stringify({trucks:n,clientStatements:m.statements.length,includingFunction:11,rows:m.rows,
      bytes:Buffer.byteLength(text),queryMs:m.queryMs,routeMs:elapsed}));
  });
  check('real indexed queries and local route workload meet the documented acceptance budget',async()=>{
    const queryTimes:number[]=[],routeTimes:number[]=[];
    for(const n of [24,100,1000]){
      const samples:number[]=[];
      for(let warm=0;warm<3;warm++)await request(route(n)+'/foundation-summary').then(r=>r.arrayBuffer());
      for(let batch=0;batch<10;batch++)await Promise.all(Array.from({length:4},async()=>{
        const start=performance.now();const response=await request(route(n)+'/foundation-summary');await response.arrayBuffer();
        expect(response.status).toBe(200);samples.push(performance.now()-start);
      }));
      samples.sort((a,b)=>a-b);expect(samples[Math.ceil(samples.length*.95)-1]).toBeLessThanOrEqual(1000);
      routeTimes.push(...samples);
      const plan=await withUnitOfWork({companyId:company,actorId:actor,projectId:projects.get(n)},async uow=>
        (await uow.query('EXPLAIN (ANALYZE,BUFFERS,FORMAT JSON) '+FOUNDATION_SQL,[company,projects.get(n)])).rows[0]['QUERY PLAN'][0],runtime,{readOnlySnapshot:true});
      queryTimes.push(plan['Execution Time']);
      const text=JSON.stringify(plan);expect(text).toContain('project_trucks');
      if(n===1000)expect(text).toMatch(/idx_project_trucks_lookup|project_trucks_(page_idx|company_id_project_id_truck_id_key)/);
      const indexes:string[]=[];const visit=(node:any)=>{if(node['Index Name'])indexes.push(node['Index Name']);for(const child of node.Plans||[])visit(child);};visit(plan.Plan);
      console.info('U04 PERFORMANCE',JSON.stringify({trucks:n,requests:40,concurrency:4,p50:samples[19],p95:samples[37],sqlMs:plan['Execution Time'],indexes}));
    }
    console.info('U04 HARDWARE',JSON.stringify({platform:os.platform(),cpu:os.cpus()[0]?.model,logicalCpus:os.cpus().length,memoryGiB:os.totalmem()/1024**3,
      poolMax:4,backgroundTenantTrucks:5000,workload:'native loopback PG17 and isolated HTTP; 3 warmups + 40 requests per size, concurrency 4; not browser/production'}));
  });
  check('stable page traversal never duplicates or omits rows and never exceeds 50',async()=>{
    const seen=new Set<string>();let cursor:string|undefined;
    do{const p=await reads.page('admin',scope(100),{cursor,limit:37});expect(p.items.length).toBeLessThanOrEqual(37);
      expect(p.fullSnapshot).toBe(false);for(const row of p.items){expect(seen.has(row.entityId)).toBe(false);seen.add(row.entityId);}
      expect(p.hasMore).toBe(Boolean(p.nextCursor));cursor=p.nextCursor||undefined;
    }while(cursor);expect(seen.size).toBe(100);
  });
  for(const limit of [0,51,-1,1.5,NaN])check(`invalid limit ${limit} fails closed`,async()=>{
    await expect(reads.page('admin',scope(),{limit})).rejects.toMatchObject({status:400});
  });
  for(const mutation of ['signature','project','company','actor','filter','limit','epoch'] as const)check(`cursor is bound to ${mutation}`,async()=>{
    const page=await reads.page('admin',scope(),{limit:10});const cursor=page.nextCursor!;
    if(mutation==='signature')await expect(reads.page('admin',scope(),{limit:10,cursor:cursor+'x'})).rejects.toMatchObject({status:400});
    if(mutation==='project')await expect(reads.page('admin',scope(100),{limit:10,cursor})).rejects.toMatchObject({status:400});
    if(mutation==='company')await expect(reads.page('admin',{companyId:other,projectExternalId:`Q-PRJ-${foreign}`},{limit:10,cursor})).rejects.toMatchObject({status:400});
    if(mutation==='actor')await expect(reads.page('manager',scope(),{limit:10,cursor})).rejects.toMatchObject({status:400});
    if(mutation==='filter')await expect(reads.page('admin',scope(),{stage:'ROSTER',kind:'DRIVER',limit:10,cursor})).rejects.toMatchObject({status:400});
    if(mutation==='limit')await expect(reads.page('admin',scope(),{limit:11,cursor})).rejects.toMatchObject({status:400});
    if(mutation==='epoch'){
      const changed=new SqlProjectReadAuthority({runtimePool:runtime,authPool:auth,verifyToken,cursorKey:key,backendEpoch:'u04-isolated-2'});
      await expect(changed.page('admin',scope(),{limit:10,cursor})).rejects.toMatchObject({status:400});
    }
  });
  check('expired and revision-stale cursors reject without a partial response',async()=>{
    const page=await reads.page('admin',scope(),{limit:10});now+=300001;
    await expect(reads.page('admin',scope(),{limit:10,cursor:page.nextCursor!})).rejects.toMatchObject({status:409});now=Date.now();
    const before=await reads.page('admin',scope(),{limit:10});await admin.query('UPDATE projects SET status=\'APPROVED\' WHERE id=$1',[projects.get(24)]);
    await expect(reads.page('admin',scope(),{limit:10,cursor:before.nextCursor!})).rejects.toMatchObject({status:409});
  });
  check('time-bound membership validity fences a cursor even without a database write',async()=>{
    await admin.query(`UPDATE project_trucks SET valid_period=tstzrange(now()-interval '1 day',now()+interval '1 minute','[)')
      WHERE id=(SELECT id FROM project_trucks WHERE project_id=$1 LIMIT 1)`,[projects.get(24)]);
    const page=await reads.page('admin',scope(),{limit:10});now+=61000;
    await expect(reads.page('admin',scope(),{limit:10,cursor:page.nextCursor!})).rejects.toMatchObject({status:409});now=Date.now();
  });
  check('unauthorized company, missing project and inaccessible project share the same public denial',async()=>{
    for(const path of [route(100),`/api/v2/projects/Q-PRJ-${second}`,`/api/v2/projects/Q-PRJ-${randomUUID()}`]){
      const response=await request(path+'/foundation-summary','manager');expect(response.status).toBe(404);expect(await response.json()).toEqual({error:{code:'PROJECT_NOT_FOUND'}});
    }
    expect((await request(route()+'/foundation-summary','admin',other)).status).toBe(404);
    expect((await request(route()+'/foundation-summary','viewer')).status).toBe(404);
    expect((await request(route()+'/foundation-summary','invalid')).status).toBe(401);
  });
  check('account suspension, role revocation and project-access revocation are checked on each request',async()=>{
    expect((await request(route()+'/foundation-summary','manager')).status).toBe(200);
    await admin.query('UPDATE users SET status=\'SUSPENDED\' WHERE id=$1',[manager]);
    expect((await request(route()+'/foundation-summary','manager')).status).toBe(401);await admin.query('UPDATE users SET status=\'ACTIVE\' WHERE id=$1',[manager]);
    await admin.query('UPDATE user_company_roles SET status=\'REVOKED\' WHERE user_id=$1',[manager]);
    expect((await request(route()+'/foundation-summary','manager')).status).toBe(404);await admin.query('UPDATE user_company_roles SET status=\'ACTIVE\' WHERE user_id=$1',[manager]);
    await admin.query('UPDATE project_access SET status=\'REVOKED\' WHERE user_id=$1',[manager]);
    expect((await request(route()+'/foundation-summary','manager')).status).toBe(404);await admin.query('UPDATE project_access SET status=\'ACTIVE\' WHERE user_id=$1',[manager]);
  });
  check('ETags are scope-bound; 304 requires current nonstale facts and current authorization',async()=>{
    await freshProjection();const first=await request(route()+'/foundation-summary');const tag=first.headers.get('etag')!;
    expect(first.headers.get('cache-control')).toContain('no-store');expect((await request(route()+'/foundation-summary','admin',company,{'If-None-Match':tag})).status).toBe(304);
    expect((await request(route()+'/foundation-summary','finance',company,{'If-None-Match':tag})).status).toBe(200);
    expect((await request(route(100)+'/foundation-summary','admin',company,{'If-None-Match':tag})).status).toBe(200);
    await admin.query('UPDATE projects SET status=\'SETUP\' WHERE id=$1',[projects.get(24)]);
    const stale=await request(route()+'/foundation-summary','admin',company,{'If-None-Match':tag});expect(stale.status).toBe(200);
    const staleTag=stale.headers.get('etag')!;expect((await request(route()+'/foundation-summary','admin',company,{'If-None-Match':staleTag})).status).toBe(200);
  });
  check('U02 enrollment/status and U03 temporal commands atomically invalidate summaries and fence pages',async()=>{
    const driver=await make('DRIVER'),truck=await make('TRUCK'),carrier=await make('CARRIER'),material=await make('MATERIAL');
    for(const [kind,id] of [['DRIVER',driver],['TRUCK',truck],['CARRIER',carrier],['MATERIAL',material]] as const)await member(kind,id,'ENROLL');
    for(const [kind,id] of [['DRIVER',driver],['TRUCK',truck]] as const)await commands.affiliation('admin',{companyId:company,projectId:scope().projectExternalId,
      operationId:randomUUID(),kind,entityId:id,carrierId:carrier,command:'SET_AFFILIATION'});
    await freshProjection();const before=await reads.page('admin',scope(),{limit:10});
    const assigned=await commands.assignment('admin',{companyId:company,projectId:scope().projectExternalId,operationId:randomUUID(),driverId:driver,truckId:truck,command:'ASSIGN'});
    const after=await reads.summary('admin',scope());expect(after.body.data.stale).toBe(true);expect(BigInt(after.body.data.sourceRevision)).toBeGreaterThan(BigInt(before.sourceRevision));
    await expect(reads.page('admin',scope(),{limit:10,cursor:before.nextCursor!})).rejects.toMatchObject({status:409});
    const all=await reads.page('admin',scope());expect(all.items.find(i=>i.entityId===truck)).toMatchObject({assignmentId:assigned.relationship.assignmentId,driverId:driver,carrierId:carrier});
    await member('TRUCK',truck,'SUSPEND',24,1);const ended=await reads.page('admin',scope());expect(ended.items.find(i=>i.entityId===truck)?.assignmentId).toBeNull();
    expect((await reads.summary('admin',scope())).body.data.counts.trucks).toBe(24);
  });
  check('global status invalidates every dependent project without changing membership or temporal rows',async()=>{
    const truck=await make('TRUCK');await member('TRUCK',truck,'ENROLL',100);
    await freshProjection(24);await freshProjection(100);
    const identity=(await admin.query('SELECT revision FROM trucks WHERE company_id=$1 AND external_id=$2',[company,truck])).rows[0];
    await commands.setStatus('admin',{companyId:company,projectId:scope().projectExternalId,operationId:randomUUID(),kind:'TRUCK',entityId:truck,status:'MAINTENANCE',expectedRevision:Number(identity.revision)});
    expect((await reads.summary('admin',scope())).body.data.stale).toBe(true);expect((await reads.summary('admin',scope(100))).body.data.stale).toBe(true);
  });
  check('transaction rollback also rolls back revisions and staleness',async()=>{
    await freshProjection();const before=(await reads.summary('admin',scope())).body.data;
    const client=await admin.connect();try{await client.query('BEGIN');await client.query('UPDATE project_trucks SET status=\'REMOVED\' WHERE project_id=$1',[projects.get(24)]);await client.query('ROLLBACK');}finally{client.release();}
    expect((await reads.summary('admin',scope())).body.data).toEqual(before);
  });
  check('workspace binding existence never fabricates successful provisioning or READY',async()=>{
    await admin.query('INSERT INTO workspace_bindings(id,company_id,project_id) VALUES(gen_random_uuid(),$1,$2)',[company,projects.get(24)]);
    const s=await reads.summary('admin',scope());expect(s.body.data.workspaceStatus).toBe('BOUND_PROVISIONING_UNVERIFIED');expect(s.body.data.readinessState).toBe('INCOMPLETE');
  });
  check('RLS denies foreign project summaries, runtime cannot edit projections or invoke invalidation capability',async()=>{
    await withUnitOfWork({companyId:company,actorId:actor,projectId:projects.get(24)},async uow=>{
      expect((await uow.query('SELECT * FROM project_foundation_summaries WHERE project_id=$1',[projects.get(100)])).rowCount).toBe(0);
      expect((await uow.query('SELECT * FROM project_foundation_summaries WHERE company_id=$1',[other])).rowCount).toBe(0);
    },runtime);
    for(const sql of ['UPDATE project_foundation_summaries SET stale=false','SELECT qsa_invalidate_foundation()',"SET ROLE qsa_foundation_invalidator"])
      await expect(withUnitOfWork({companyId:company,actorId:actor,projectId:projects.get(24)},uow=>uow.query(sql),runtime)).rejects.toMatchObject({code:'42501'});
  });
  check('unsupported query/stage/duplicate parameters fail closed and setup pages are bounded',async()=>{
    for(const path of ['/fleet?limit=51','/fleet?limit=2&limit=3','/fleet?phone=secret','/setup/UNKNOWN'])expect((await request(route()+path)).status).toBe(400);
    for(const stage of ['ROSTER','CARRIERS','MATERIALS']){
      const r=await request(route()+'/setup/'+stage);expect(r.status).toBe(200);expect((await r.json()).items.length).toBeLessThanOrEqual(50);
    }
    const s=await request(route()+'/setup/WORKSPACE');expect(s.status).toBe(200);expect((await s.json()).data.summary.state).toBe('PENDING');
  });
  check('routes cannot be mounted in production and no live server import activates the seam',async()=>{
    const previous=process.env.NODE_ENV;try{process.env.NODE_ENV='production';expect(()=>mountIsolatedSqlProjectReadRoutes(express(),reads)).toThrow('INACTIVE');}finally{process.env.NODE_ENV=previous;}
    const {readFile}=await import('node:fs/promises');expect(await readFile('server/app.ts','utf8')).not.toContain('mountIsolatedSqlProjectReadRoutes');
  });
  check('authorization-scope changes invalidate an otherwise current cursor for the same actor',async()=>{
    const page=await reads.page('finance',scope(),{limit:10});
    await admin.query(`UPDATE user_company_roles SET valid_to=now()+interval '1 day' WHERE user_id=$1`,[finance]);
    await expect(reads.page('finance',scope(),{limit:10,cursor:page.nextCursor!})).rejects.toMatchObject({status:400});
  });
  check('read-only snapshot and cleanup protect a reused physical runtime connection',async()=>{
    const one=new pg.Pool({connectionString:process.env.DATABASE_URL,max:1});
    try{
      const service=new SqlProjectReadAuthority({runtimePool:one,authPool:auth,verifyToken,cursorKey:key,backendEpoch:'u04-isolated-1'});
      await service.summary('admin',scope());
      const settings=(await one.query(`SELECT current_setting('app.company_id',true) AS company,current_setting('app.actor_id',true) AS actor,
        current_setting('app.project_id',true) AS project`)).rows[0];
      expect(Object.values(settings).every(v=>!v)).toBe(true);
      await expect(withUnitOfWork({companyId:company,actorId:actor,projectId:projects.get(24)},uow=>uow.query('UPDATE project_trucks SET status=\'REMOVED\''),one,{readOnlySnapshot:true})).rejects.toMatchObject({code:'25006'});
    }finally{await one.end();}
  });
  check('database outage produces sanitized 503 and never a fallback response',async()=>{
    const unavailable=await unavailablePostgres(process.env.DATABASE_URL,300);
    try{
      const service=new SqlProjectReadAuthority({runtimePool:unavailable.pool,authPool:auth,verifyToken,cursorKey:key,backendEpoch:'u04-isolated-1'});
      await expect(service.summary('admin',scope()).catch(error=>{expect(error.message).toBe('CANONICAL_READ_UNAVAILABLE');throw error;})).rejects.toMatchObject({code:'CANONICAL_READ_UNAVAILABLE',status:503});
      expect(unavailable.rejectedConnections()).toBeGreaterThan(1);
    }finally{await unavailable.close();}
  });
  check('migration 006 is repeat-safe and checksum protected',async()=>{
    expect((await applyMigrations(migrator)).verified).toEqual(['001','002','003','004','005','006','007','008','009']);
    expect(await verifyMigrations(migrator)).toMatchObject({allValid:true,appliedCount:9});
    await admin.query("UPDATE schema_migrations SET checksum='invalid' WHERE version='006'");
    try{await expect(applyMigrations(migrator)).rejects.toThrow('checksum mismatch');}finally{await admin.query("UPDATE schema_migrations SET checksum=$1 WHERE version='006'",[loadMigrationFiles()[5].checksum]);}
  });
});
