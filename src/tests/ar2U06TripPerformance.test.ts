import {it,expect} from 'vitest';
import {randomUUID,randomBytes} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import os from 'node:os';
import pg from 'pg';
import express from 'express';
import {SqlTripAuthority} from '../db/tripAuthority.js';
import {SqlTemporalAuthority} from '../db/temporalAuthority.js';
import {IdentityProtection} from '../db/identityProtection.js';
import {SQL_TRIP_EPOCH} from '../db/tripContracts.js';
import {normalizePlate} from '../utils/normalization';
import {mountIsolatedSqlTripRoutes} from '../../server/sqlTripRoutes.js';
if(process.env.QSA_TEST_DATABASE_ISOLATED!=='1'||!process.env.TEST_DATABASE_URL)throw Error('Isolated native PostgreSQL required');
it('AR2-U06 24/100/1000-truck native SQL and HTTP query/history workload',async()=>{
 const admin=new pg.Pool({connectionString:process.env.TEST_DATABASE_URL}),runtime=new pg.Pool({connectionString:process.env.DATABASE_URL,max:8}),auth=new pg.Pool({connectionString:process.env.AUTH_DATABASE_URL,max:4});
 const company=randomUUID(),project=randomUUID(),actor=randomUUID(),scope={companyId:company,projectId:'Q-PRJ-'+project},old={...process.env};let server:any;
 const deps={runtimePool:runtime,authPool:auth,verifyToken:async(token:string)=>{if(token!=='verified')throw Error('bad');return {uid:actor};}},service=new SqlTripAuthority(deps),canonical=new SqlTemporalAuthority(deps);
 let protocol:{calls:number}|null=null;for(const pool of [runtime,auth])pool.on('connect',client=>{const query=client.query.bind(client);(client as any).query=(...args:any[])=>{if(protocol)protocol.calls++;return (query as any)(...args);};});
 const env=(command:string,payload:any)=>({operationId:randomUUID(),expectedRevision:0,backendEpoch:SQL_TRIP_EPOCH,payloadSchemaVersion:1,command,payload});
 let counter=920000;
 const make=async(kind:'CARRIER'|'MATERIAL'|'TRUCK')=>{const n=++counter,result=await canonical.create('verified',{...scope,operationId:randomUUID(),kind,naturalKey:kind==='CARRIER'?`1${String(n).padStart(9,'0')}`:kind==='MATERIAL'?`PERF-${n}`:`ا ب ج ${n}`,profile:kind==='CARRIER'?{nameAr:'Synthetic benchmark'}:kind==='MATERIAL'?{nameAr:'Synthetic material',unitOfMeasure:'TON'}:{truckType:'DUMPER'}});await canonical.membership('verified',{...scope,operationId:randomUUID(),kind,entityId:result.identity.externalId,command:'ENROLL',expectedRevision:0});return result.identity;};
 try{
  process.env.QSA_IDENTITY_HMAC_KEY=randomBytes(32).toString('hex');process.env.QSA_IDENTITY_ENCRYPTION_KEY=randomBytes(32).toString('hex');process.env.QSA_IDENTITY_KEY_VERSION='u06-perf';
  expect((await admin.query('SHOW server_version')).rows[0].server_version).toMatch(/^17\./);
  await admin.query("INSERT INTO companies(id,slug,name,status) VALUES($1::uuid,$1::uuid::text,'Synthetic benchmark','ACTIVE')",[company]);
  await admin.query("INSERT INTO users(id,firebase_uid,status) VALUES($1::uuid,$1::uuid::text,'ACTIVE')",[actor]);
  await admin.query("INSERT INTO user_company_roles(id,company_id,user_id,role,status) VALUES(gen_random_uuid(),$1,$2,'SUPER_ADMIN','ACTIVE')",[company,actor]);
  const configuration={schemaVersion:1,loadingMeasurementMode:'NONE',unloadingMeasurementMode:'NONE',driverIntakeMode:'MIXED',routeConfiguration:{loadingLocation:'Synthetic origin',unloadingLocation:'Synthetic destination'},shiftConfiguration:{mode:'NONE'},capacityEstimationPolicy:{mode:'NONE'}};
  await admin.query("INSERT INTO projects(id,company_id,external_id,project_number,name,status,operational_configuration) VALUES($1,$2,$3,'9003','Synthetic benchmark','SETUP',$4)",[project,company,scope.projectId,configuration]);
  const carrier=await make('CARRIER'),material=await make('MATERIAL'),truck=await make('TRUCK');
  await canonical.affiliation('verified',{...scope,operationId:randomUUID(),kind:'TRUCK',entityId:truck.externalId,carrierId:carrier.externalId,command:'SET_AFFILIATION'});await canonical.allocation('verified',{...scope,operationId:randomUUID(),command:'ALLOCATE',truckId:truck.externalId,materialId:material.externalId});
  await service.savePricing('verified',scope,env('SAVE_PRICING_RULE',{rule:{pricingRuleId:'PERF-PRICE',carrierId:carrier.externalId,materialId:material.externalId,pricingType:'PER_TRIP',rate:'125.1250',currency:'SAR',effectiveFrom:'2020-01-01'}}));
  const payload={carrierId:carrier.externalId,materialId:material.externalId,truckId:truck.externalId,driverId:null,pricingRuleId:'PERF-PRICE'};
  // Establish the canonical counter before injecting classified synthetic legacy history.
  await service.execute('verified',scope,env('DISPATCH_TRIP',payload));
  const app=express();mountIsolatedSqlTripRoutes(app,service,async()=>company);server=await new Promise<any>(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s));});const url=`http://127.0.0.1:${server.address().port}/api/v2/projects/${scope.projectId}/trips/commands`;
  const send=async(request:any)=>{const at=performance.now(),res=await fetch(url,{method:'POST',headers:{authorization:'Bearer verified','content-type':'application/json'},body:JSON.stringify(request)}),body=await res.json();expect(res.status).toBe(200);return {body,ms:performance.now()-at};};
  let total=1;const crypto=new IdentityProtection(),results:any[]=[];
  for(const size of [24,100,1000]){
   const fixtures:any[]=[];for(let i=total;i<size;i++){const id=randomUUID(),external='TRK-PERF-'+i,plate=`ا ب ج ${950000+i}`,profile={plate,normalizedPlate:normalizePlate(plate),truckType:'DUMPER'};fixtures.push({id,external,plate:profile.normalizedPlate,hmac:crypto.natural(company,'TRUCK',plate).toString('hex'),encrypted:crypto.seal(profile,`${company}/TRUCK/${external}`)});}
   if(fixtures.length){
    await admin.query(`INSERT INTO trucks(id,company_id,external_id,normalized_plate,type,status,natural_key_hmac,profile_encrypted,crypto_key_version,created_by,updated_by) SELECT x.id::uuid,$2,x.external,x.plate,'DUMPER','ACTIVE',decode(x.hmac,'hex'),x.encrypted,$3,$4,$4 FROM jsonb_to_recordset($1::jsonb) AS x(id text,external text,plate text,hmac text,encrypted text)`,[JSON.stringify(fixtures),company,crypto.version,actor]);
    await admin.query(`INSERT INTO identity_keys(id,company_id,kind,key_hmac,target_external_id,verification_status) SELECT gen_random_uuid(),$2,'TRUCK',decode(x.hmac,'hex'),x.external,'VERIFIED' FROM jsonb_to_recordset($1::jsonb) AS x(external text,hmac text)`,[JSON.stringify(fixtures),company]);
    await admin.query(`INSERT INTO project_trucks(id,company_id,project_id,truck_id,status,revision) SELECT gen_random_uuid(),$2,$3,x.id::uuid,'ACTIVE',1 FROM jsonb_to_recordset($1::jsonb) AS x(id text)`,[JSON.stringify(fixtures),company,project]);
    await admin.query(`INSERT INTO trips(id,company_id,project_id,external_id,trip_number,carrier_id,driver_id,truck_id,material_id,state,version) SELECT gen_random_uuid(),$2,$3,'HIST-PERF-'||x.id,'HIST-'||x.id,$4,NULL,x.id::uuid,$5,'COMPLETED',9 FROM jsonb_to_recordset($1::jsonb) AS x(id text)`,[JSON.stringify(fixtures),company,project,carrier.id,material.id]);
    // Synthetic archived histories retain explicit legacy classification (authority_schema NULL).
    await admin.query(`INSERT INTO trip_events(id,company_id,project_id,trip_id,seq,event_type,occurred_at,operation_id,payload,resulting_state,actor_id,payload_schema_version)
     SELECT gen_random_uuid(),$1,$2,t.id,s.n,'EVENT_'||s.state,'2026-01-01T00:00:00Z'::timestamptz+s.n*interval '5 minutes',gen_random_uuid()::text,'{"synthetic":true}'::jsonb,s.state,$3,1 FROM trips t CROSS JOIN (VALUES(1,'DISPATCHED'),(2,'AT_ORIGIN'),(3,'LOADING'),(4,'WEIGHED_ORIGIN'),(5,'IN_TRANSIT'),(6,'AT_DESTINATION'),(7,'WEIGHED_DESTINATION'),(8,'OFFLOADED'),(9,'COMPLETED')) AS s(n,state) WHERE t.company_id=$1 AND t.project_id=$2 AND t.external_id LIKE 'HIST-PERF-%' AND NOT EXISTS(SELECT FROM trip_events e WHERE e.trip_id=t.id AND e.company_id=$1) ORDER BY t.id,s.n`,[company,project,actor]);
    await admin.query(`INSERT INTO trip_weight_records(id,company_id,project_id,trip_id,event_id,actor_id,measurement_type,weight_kg,raw_value,source_unit,source_type,source_ref,source_event_key,captured_at,authority_status)
     SELECT gen_random_uuid(),$1,$2,t.id,e.id,$3,w.kind,w.kg::numeric,w.kg,'KG','MANUAL','SYNTHETIC-'||t.id,'SYNTHETIC-'||t.id,e.occurred_at,'MEASURED' FROM trips t JOIN trip_events e ON e.trip_id=t.id AND e.company_id=$1 AND e.seq=4 CROSS JOIN(VALUES('ORIGIN_TARE','10000'),('ORIGIN_GROSS','30000'),('ORIGIN_NET','20000')) w(kind,kg) WHERE t.company_id=$1 AND t.project_id=$2 AND t.external_id LIKE 'HIST-PERF-%' AND NOT EXISTS(SELECT FROM trip_weight_records m WHERE m.trip_id=t.id AND m.company_id=$1)`,[company,project,actor]);
   }
   total=size;await admin.query('ANALYZE trips');await admin.query('ANALYZE trip_events');await admin.query('ANALYZE trip_weight_records');
   expect(Number((await admin.query('SELECT count(*) FROM project_trucks WHERE company_id=$1 AND project_id=$2',[company,project])).rows[0].count)).toBe(size);
   for(let i=0;i<3;i++)await send(env('DISPATCH_TRIP',payload));const before=(await admin.query(`SELECT (SELECT count(*) FROM trip_events WHERE company_id=$1) AS events,(SELECT count(*) FROM audit_events WHERE company_id=$1 AND entity_kind='TRIP') AS audit,(SELECT count(*) FROM outbox_events WHERE company_id=$1 AND aggregate_type='TRIP') AS outbox`,[company])).rows[0];
   const measured:any[]=[];protocol={calls:0};for(let batch=0;batch<10;batch++)measured.push(...await Promise.all(Array.from({length:4},()=>send(env('DISPATCH_TRIP',payload)))));const calls=protocol.calls;protocol=null;
   const after=(await admin.query(`SELECT (SELECT count(*) FROM trip_events WHERE company_id=$1) AS events,(SELECT count(*) FROM audit_events WHERE company_id=$1 AND entity_kind='TRIP') AS audit,(SELECT count(*) FROM outbox_events WHERE company_id=$1 AND aggregate_type='TRIP') AS outbox`,[company])).rows[0];for(const k of ['events','audit','outbox'])expect(Number(after[k])-Number(before[k])).toBe(40);
   const latency=measured.map(v=>v.ms).sort((a,b)=>a-b),queryCounts=measured.map(v=>v.body.queries),request=env('DISPATCH_TRIP',payload),first=await send(request),repeat=await send(request);expect(repeat.body.trip.tripId).toBe(first.body.trip.tripId);
   results.push({trucks:size,syntheticHistoricalTrips:size-1,historyEvents:(size-1)*9,concurrency:4,requests:40,commandQueriesMin:Math.min(...queryCounts),commandQueriesMax:Math.max(...queryCounts),protocolQueriesPerRequest:calls/40,p50Ms:latency[19],p95Ms:latency[37],transactionP95Ms:measured.map(v=>v.body.transactionMs).sort((a,b)=>a-b)[37],events:40,audit:40,outbox:40,repeatCreates:0});
  }
  expect(new Set(results.map(r=>r.commandQueriesMax)).size).toBe(1);expect(results[2].commandQueriesMax).toBeLessThan(180);
  const pricingPlan=(await admin.query(`EXPLAIN (ANALYZE,BUFFERS,FORMAT JSON) SELECT * FROM pricing_rules WHERE company_id=$1 AND project_id=$2 AND carrier_id=$3 AND (material_id=$4 OR material_id IS NULL) AND commercial_terms IS NOT NULL AND effective_period @> now() ORDER BY external_id LIMIT 129`,[company,project,carrier.id,material.id])).rows[0]['QUERY PLAN'];
  const history=(await admin.query("SELECT id FROM trips WHERE company_id=$1 AND external_id LIKE 'HIST-PERF-%' LIMIT 1",[company])).rows[0];
  const weightPlan=(await admin.query('EXPLAIN (ANALYZE,BUFFERS,FORMAT JSON) SELECT * FROM trip_weight_records WHERE company_id=$1 AND project_id=$2 AND trip_id=$3 ORDER BY id LIMIT 51',[company,project,history.id])).rows[0]['QUERY PLAN'];
  console.info('U06 PERFORMANCE',JSON.stringify({hardware:{platform:process.platform,cpu:os.cpus()[0].model,logicalCpus:os.cpus().length,memoryGiB:os.totalmem()/2**30},workload:'native PG17 loopback + isolated HTTP, 3 warmups, 40 dispatches/size, concurrency 4; synthetic archived histories classified legacy; no browser/production claim',results,pricingPlan,weightPlan}));
 }finally{if(server)await new Promise<void>(r=>server.close(()=>r()));await Promise.all([admin.end(),runtime.end(),auth.end()]);for(const k of ['QSA_IDENTITY_HMAC_KEY','QSA_IDENTITY_ENCRYPTION_KEY','QSA_IDENTITY_KEY_VERSION']){if(old[k]===undefined)delete process.env[k];else process.env[k]=old[k];}}
},180000);
