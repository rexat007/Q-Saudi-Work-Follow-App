import {unavailablePostgres} from './helpers/unavailablePostgres.js';
import {beforeAll,afterAll,describe,it,expect} from 'vitest';
import {randomUUID,randomBytes} from 'node:crypto';
import pg from 'pg';
import express from 'express';
import type {Server} from 'node:http';
import {SqlImportAuthority,SQL_IMPORT_LIMITS} from '../db/importAuthority.js';
import {SqlTemporalAuthority} from '../db/temporalAuthority.js';
import {IsolatedSqlImportSourceStore,sha} from '../db/importArtifacts.js';
import {applyMigrations,verifyMigrations,loadMigrationFiles} from '../db/migrator.js';
import {withUnitOfWork} from '../db/unitOfWork.js';
import {mountIsolatedSqlImportRoutes} from '../../server/sqlImportRoutes.js';
import {normalizePlate} from '../utils/normalization';
import * as XLSX from 'xlsx';
import {encodeSessionChunks} from '../services/import/sessionArtifactCodec';
import {IdentityProtection} from '../db/identityProtection';

if(process.env.QSA_TEST_DATABASE_ISOLATED!=='1'||!process.env.TEST_DATABASE_URL)throw Error('Isolated PostgreSQL required');
const check=(name:string,fn:()=>Promise<void>)=>it(name,fn,30000);
describe('AR2-U05 native PostgreSQL durable reviewed import',()=>{
  const pool=(key:string,max=4)=>new pg.Pool({connectionString:process.env[key],max});
  const admin=pool('TEST_DATABASE_URL'),runtime=pool('DATABASE_URL',8),auth=pool('AUTH_DATABASE_URL'),migrator=pool('MIGRATION_DATABASE_URL');
  const company=randomUUID(),other=randomUUID(),project=randomUUID(),second=randomUUID(),foreign=randomUUID(),actor=randomUUID(),manager=randomUUID(),viewer=randomUUID();
  const scope={companyId:company,projectId:`Q-PRJ-${project}`},scopeB={companyId:company,projectId:`Q-PRJ-${second}`},scopeForeign={companyId:other,projectId:`Q-PRJ-${foreign}`};
  const verifyToken=async(token:string)=>{if(!['admin','manager','viewer'].includes(token))throw Error('invalid');return {uid:`u05-${token}-${actor}`,role:'SUPER_ADMIN'};};
  const dependencies={runtimePool:runtime,authPool:auth,verifyToken};
  const sourceStore=new IsolatedSqlImportSourceStore(),service=new SqlImportAuthority({...dependencies,sourceStore}),canonical=new SqlTemporalAuthority(dependencies);
  let carrier:string,material:string,sequence=710000,server:Server,url:string;
  const old=Object.fromEntries(['QSA_IDENTITY_HMAC_KEY','QSA_IDENTITY_ENCRYPTION_KEY','QSA_IDENTITY_KEY_VERSION'].map(k=>[k,process.env[k]]));
  const command=(at=scope)=>({...at,operationId:randomUUID()});
  const make=async(kind:'CARRIER'|'MATERIAL'|'DRIVER'|'TRUCK',natural?:string,profile?:any,at=scope)=>{
    const n=++sequence,result=await canonical.create('admin',{...command(at),kind,
      naturalKey:natural||(kind==='DRIVER'?`2${String(n).padStart(9,'0')}`:kind==='CARRIER'?`1${String(n).padStart(9,'0')}`:kind==='TRUCK'?`ا ب ج ${n}`:`MAT-${n}`),
      profile:profile||(kind==='DRIVER'?{fullNameAr:'سائق اختبار',phone:''}:kind==='TRUCK'?{truckType:'DUMPER'}:kind==='CARRIER'?{nameAr:'ناقل اختبار'}:{nameAr:'مادة اختبار',unitOfMeasure:'TON'})});
    await canonical.membership('admin',{...command(at),kind,entityId:result.identity.externalId,command:'ENROLL',expectedRevision:0});return result.identity;
  };
  const mappings={Carrier:'carrierName',Driver:'driverName',Identity:'driverIdentity',Plate:'truckPlate',TruckType:'truckType',Phone:'driverPhone',Material:'materialName',Code:'materialCode',Tare:'tareWeightKg',Gross:'maxGrossWeightKg',AlternateDriver:'unmapped'};
  const sourceBytes=(rows:any[])=>{
    const headers=Object.keys(rows[0].raw).filter(k=>!k.startsWith('_'));
    const cell=(v:unknown)=>'"'+String(v??'').replaceAll('"','""')+'"';
    return Buffer.from([headers.map(cell).join(','),...rows.map(r=>headers.map(h=>cell(r.raw[h])).join(','))].join('\n')+'\n');
  };
  const row=(number=1):any=>{const n=++sequence;return {rowNumber:number,status:'VALID',reviewStatus:'accepted',
    raw:{Carrier:'ناقل اختبار',Driver:'سائق اختبار',Identity:`2${String(n).padStart(9,'0')}`,Plate:`ا ب ج ${n}`,TruckType:'DUMPER',Phone:'',Material:'',Code:'',Tare:'',Gross:'',AlternateDriver:'سائق اختبار'},
    canonical:{carrierName:'ناقل اختبار',driverName:'سائق اختبار',driverIdentity:`2${String(n).padStart(9,'0')}`,driverPhone:'',truckPlate:normalizePlate(`ا ب ج ${n}`),truckType:'DUMPER'},validationIssues:[],entityResolutions:{
      carrier:{entityType:'CARRIER',matchedId:carrier,isAuthorized:true,recommendation:'ACCEPT'},
      material:{entityType:'MATERIAL',matchedId:material,isAuthorized:true,recommendation:'ACCEPT'},
      driver:{entityType:'DRIVER',creationDisposition:'PREPARED_NEW',isAuthorized:true,recommendation:'ACCEPT',preparedDriverPlan:{driverName:'سائق اختبار',residencyId:`2${String(n).padStart(9,'0')}`,phone:'',carrierId:carrier}},
      truck:{entityType:'TRUCK',creationDisposition:'PREPARED_NEW',isAuthorized:true,recommendation:'ACCEPT',preparedTruckPlan:{plateNumber:`ا ب ج ${n}`,truckType:'DUMPER',carrierId:carrier}}}};};
  const session=async(rows=[row()],options:{review?:boolean;domain?:'ROSTER'|'TRIP';sourceType?:string;at?:typeof scope;bytes?:Buffer}={})=>{
    const sourceType=options.sourceType||'CSV',at=options.at||scope;
    const s={sessionId:`IMP-${randomUUID()}`,operationId:randomUUID(),importBatchId:`BATCH-${randomUUID()}`,sourceRevisionId:randomUUID(),version:1,rows,scope:at};
    await service.createSession('admin',at,{sessionId:s.sessionId,requestId:randomUUID(),expectedVersion:0,operationId:s.operationId,importBatchId:s.importBatchId,sourceType,domain:options.domain||'ROSTER'});
    const bytes=options.bytes||sourceBytes(rows);
    const attached=await service.attachSource('admin',at,{sessionId:s.sessionId,requestId:randomUUID(),expectedVersion:1,sourceRevisionId:s.sourceRevisionId,contentSha256:sha(bytes),sourceType,
      metadata:sourceType==='GOOGLE_SHEETS'?{rowFormat:'CSV_UTF8',spreadsheetId:'synthetic-existing-sheet',sheetTitle:'Snapshot',modifiedTime:'2026-11-08T00:00:00Z'}:
        sourceType==='EXCEL'?{fileName:'synthetic.xlsx',sheetName:'Roster'}:sourceType==='GOOGLE_DRIVE'?{rowFormat:'CSV_UTF8',fileName:'synthetic.csv'}:{fileName:'synthetic.csv',mimeType:'text/csv'}},bytes);s.version=attached.version;
    const save=async(patch:any)=>{const next=await service.checkpoint('admin',at,{sessionId:s.sessionId,requestId:randomUUID(),expectedVersion:s.version,patch});s.version=next.version;};
    const batch={projectId:at.projectId,operationId:s.operationId,importBatchId:s.importBatchId,source:{sourceType,importBatchId:s.importBatchId},rows,
      metadata:{batchMaterialBinding:{materialId:material,provenance:'PROJECT_IMPORT_SELECTION',confirmed:true}},issues:[],warningConfirmation:{confirmed:true}};
    if(options.domain==='TRIP')return s;
    await save({lifecycleState:'MAPPING',rosterStage:'MAPPING_APPROVAL',currentStage:'MAPPING_APPROVAL',mapping:{mappingRevisionId:randomUUID(),sourceRevisionId:s.sourceRevisionId,mappings,approved:true}});
    for(const stage of ['CARRIER_RESOLUTION','MATERIAL_RESOLUTION','DRIVER_TRUCK_RESOLUTION'])await save({lifecycleState:'RESOLUTION',rosterStage:stage,currentStage:stage,importBatch:batch});
    await save({lifecycleState:'REVIEW',rosterStage:'FINAL_REVIEW',currentStage:'FINAL_REVIEW'});
    if(options.review!==false){const p=await service.preview('admin',at,s.sessionId);expect(p.intent.blockers).toEqual([]);
      const reviewed=await service.review('admin',at,{sessionId:s.sessionId,requestId:randomUUID(),expectedVersion:s.version,reviewedSignature:p.reviewedSignature,
        ...(p.intent.requiresDisplacementApproval?{displacementApprovedSignature:p.reviewedSignature}:{}),warningConfirmation:true});s.version=reviewed.version;}
    return s;
  };
  const start=async(s:Awaited<ReturnType<typeof session>>)=>{
    const cp=await service.readCheckpoint('admin',s.scope,s.sessionId),signature=sha(cp.reviewedCanonicalIntent.intent.signature);
    const request={sessionId:s.sessionId,requestId:randomUUID(),expectedVersion:s.version,operationId:s.operationId,reviewedSignature:signature};
    return {request,operation:await service.start('admin',s.scope,request)};
  };
  const status=(s:any)=>service.status('admin',s.scope||scope,s.sessionId,s.operationId);
  const advance=(s:any,version:number,requestId=randomUUID())=>service.advance('admin',s.scope||scope,{sessionId:s.sessionId,operationId:s.operationId,expectedVersion:version,requestId});
  const counts=async(s:any)=>{
    const id=(await admin.query('SELECT id FROM import_sessions WHERE company_id=$1 AND external_id=$2',[company,s.sessionId])).rows[0].id;
    const result:any={};for(const table of ['import_execution_receipts','import_execution_groups'])result[table]=Number((await admin.query(`SELECT count(*) FROM ${table} WHERE session_id=$1`,[id])).rows[0].count);
    result.identities=Number((await admin.query('SELECT (SELECT count(*) FROM drivers WHERE company_id=$1)+(SELECT count(*) FROM trucks WHERE company_id=$1) AS count',[company])).rows[0].count);
    for(const table of ['audit_events','outbox_events','idempotency_receipts','carriers','materials','identity_keys','project_carriers','project_materials','project_drivers','project_trucks','driver_carrier_affiliations','truck_carrier_affiliations','driver_truck_assignments','truck_material_allocations'])
      result[table]=Number((await admin.query(`SELECT count(*) FROM ${table} WHERE company_id=$1`,[company])).rows[0].count);return result;
  };
  const sqlSession=async(s:any)=>(await admin.query('SELECT * FROM import_sessions WHERE company_id=$1 AND external_id=$2',[company,s.sessionId])).rows[0];
  beforeAll(async()=>{
    process.env.QSA_IDENTITY_HMAC_KEY=randomBytes(32).toString('hex');process.env.QSA_IDENTITY_ENCRYPTION_KEY=randomBytes(32).toString('hex');process.env.QSA_IDENTITY_KEY_VERSION='u05-test';
    expect((await admin.query('SHOW server_version')).rows[0].server_version).toMatch(/^17\./);await applyMigrations(migrator);
    await admin.query(`INSERT INTO companies(id,slug,name,status) VALUES($1::uuid,$1::uuid::text,'fixture','ACTIVE'),($2::uuid,$2::uuid::text,'fixture','ACTIVE')`,[company,other]);
    await admin.query(`INSERT INTO projects(id,company_id,external_id,name,status) VALUES($1,$2,$3,'fixture','SETUP'),($4,$2,$5,'fixture','SETUP'),($6,$7,$8,'fixture','SETUP')`,
      [project,company,scope.projectId,second,scopeB.projectId,foreign,other,scopeForeign.projectId]);
    for(const [id,token,role] of [[actor,'admin','SUPER_ADMIN'],[manager,'manager','PROJECT_ADMIN'],[viewer,'viewer','VIEWER']]){
      await admin.query('INSERT INTO users(id,firebase_uid,status) VALUES($1,$2,\'ACTIVE\')',[id,`u05-${token}-${actor}`]);
      await admin.query(`INSERT INTO user_company_roles(id,company_id,user_id,role,status) VALUES(gen_random_uuid(),$1,$2,$3,'ACTIVE')`,[company,id,role]);
    }
    await admin.query(`INSERT INTO user_company_roles(id,company_id,user_id,role,status) VALUES(gen_random_uuid(),$1,$2,'SUPER_ADMIN','ACTIVE')`,[other,actor]);
    await admin.query(`INSERT INTO project_access(id,company_id,project_id,user_id,role,status) VALUES(gen_random_uuid(),$1,$2,$3,'PROJECT_ADMIN','ACTIVE')`,[company,project,manager]);
    carrier=(await make('CARRIER')).externalId;material=(await make('MATERIAL')).externalId;
    const app=express();app.disable('etag');mountIsolatedSqlImportRoutes(app,service);
    server=await new Promise<Server>(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s));});url=`http://127.0.0.1:${(server.address() as any).port}`;
  },30000);
  afterAll(async()=>{if(server)await new Promise<void>(resolve=>server.close(()=>resolve()));for(const [key,value]of Object.entries(old)){if(value===undefined)delete process.env[key];else process.env[key]=value;}
    await Promise.all([admin.end(),runtime.end(),auth.end(),migrator.end()]);});
  check('one frozen CSV row cannot authorize 1,000 invented checkpoint rows',async()=>{
    const s=await session([row()],{review:false}),cp=await service.readCheckpoint('admin',scope,s.sessionId),before=await counts(s);
    const batch=structuredClone(cp.importBatch);batch.rows=Array.from({length:1000},(_,i)=>({...row(i+1)}));
    await expect(service.checkpoint('admin',scope,{sessionId:s.sessionId,requestId:randomUUID(),expectedVersion:s.version,patch:{importBatch:batch}})).rejects.toMatchObject({code:'SOURCE_ROW_INVENTORY_MISMATCH'});
    expect(await counts(s)).toEqual(before);
  });
  for(const fault of ['extra','missing','duplicate','identity','physical','original','canonical'] as const)check(`source provenance rejects ${fault} without any SQL consequences`,async()=>{
    const s=await session([row(1),row(2)],{review:false}),cp=await service.readCheckpoint('admin',scope,s.sessionId),batch=structuredClone(cp.importBatch),before=await counts(s);
    if(fault==='extra')batch.rows.push({...row(3)});
    if(fault==='missing')batch.rows.pop();
    if(fault==='duplicate')batch.rows[1]=structuredClone(batch.rows[0]);
    if(fault==='identity')batch.rows[0].sourceRowId='0'.repeat(64);
    if(fault==='physical')batch.rows[0].sourceLocation.sourceRowNumber=99;
    if(fault==='original')batch.rows[0].raw.Driver='invented original';
    if(fault==='canonical')batch.rows[0].canonical.driverName='unapproved correction';
    await expect(service.checkpoint('admin',scope,{sessionId:s.sessionId,requestId:randomUUID(),expectedVersion:s.version,patch:{importBatch:batch}})).rejects.toHaveProperty('code');
    expect(await counts(s)).toEqual(before);
  });
  check('authorized corrections preserve original bytes, invalidate review and execute only after renewed resolution',async()=>{
    const s=await session(),original=await service.readCheckpoint('admin',scope,s.sessionId),r=original.importBatch.rows[0],oldSignature=sha(original.reviewedCanonicalIntent.intent.signature);
    const corrected=await service.correctRows('admin',scope,{sessionId:s.sessionId,requestId:randomUUID(),expectedVersion:s.version,corrections:[{sourceRowId:r.sourceRowId,field:'driverName',originalValue:r.canonical.driverName,correctedValue:'سائق مصحح',reason:'Reviewed spelling correction'}]});s.version=corrected.version;
    const cp=await service.readCheckpoint('admin',scope,s.sessionId);expect(cp.lifecycleState).toBe('REVIEW');expect(cp.source.fingerprint).toBe(original.source.fingerprint);
    expect(cp.importBatch.rows[0].raw.Driver).toBe(r.raw.Driver);expect(cp.importBatch.rows[0].canonical.driverName).toBe('سائق مصحح');expect(cp.importBatch.rows[0].entityResolutions.driver).toBeUndefined();
    expect(cp.sourceCorrections[0]).toMatchObject({sourceRowId:r.sourceRowId,originalValue:r.canonical.driverName,correctedValue:'سائق مصحح',sourceRevisionId:s.sourceRevisionId});expect(cp.sourceCorrections[0].approvedBy).toBe(actor);
    await expect(service.review('admin',scope,{sessionId:s.sessionId,requestId:randomUUID(),expectedVersion:s.version,reviewedSignature:oldSignature})).rejects.toHaveProperty('code');
    cp.importBatch.rows[0].entityResolutions.driver=structuredClone(r.entityResolutions.driver);cp.importBatch.rows[0].entityResolutions.driver.preparedDriverPlan.driverName='سائق مصحح';
    s.version=(await service.checkpoint('admin',scope,{sessionId:s.sessionId,requestId:randomUUID(),expectedVersion:s.version,patch:{importBatch:cp.importBatch}})).version;
    const preview=await service.preview('admin',scope,s.sessionId);expect(preview.reviewedSignature).not.toBe(oldSignature);expect(preview.intent.blockers).toEqual([]);
    s.version=(await service.review('admin',scope,{sessionId:s.sessionId,requestId:randomUUID(),expectedVersion:s.version,reviewedSignature:preview.reviewedSignature,warningConfirmation:true})).version;
    const started=await start(s);expect((await advance(s,started.operation.version)).operation.state).toBe('COMPLETED');
  });
  check('correction authority rejects forged provenance and wrong originals without effects',async()=>{
    const s=await session(),cp=await service.readCheckpoint('admin',scope,s.sessionId),r=cp.importBatch.rows[0],before=await counts(s);
    const correction={sourceRowId:r.sourceRowId,field:'driverName',originalValue:'forged',correctedValue:'other',reason:'reason'};
    for(const c of [correction,{...correction,originalValue:r.canonical.driverName,approvedBy:actor}])await expect(service.correctRows('admin',scope,{sessionId:s.sessionId,requestId:randomUUID(),expectedVersion:s.version,corrections:[c]})).rejects.toHaveProperty('code');
    await expect(service.checkpoint('admin',scope,{sessionId:s.sessionId,requestId:randomUUID(),expectedVersion:s.version,patch:{sourceCorrections:[correction]}})).rejects.toHaveProperty('code');expect(await counts(s)).toEqual(before);
  });
  check('reviewed signatures bind the frozen row inventory even for equal canonical decisions',async()=>{
    const r=row(),a=await session([r],{review:false}),b=await session([structuredClone(r),{...structuredClone(r),rowNumber:2}],{review:false});
    const pa=await service.preview('admin',scope,a.sessionId),pb=await service.preview('admin',scope,b.sessionId),before=await counts(b);expect(pa.reviewedSignature).not.toBe(pb.reviewedSignature);
    await expect(service.review('admin',scope,{sessionId:b.sessionId,requestId:randomUUID(),expectedVersion:b.version,reviewedSignature:pa.reviewedSignature})).rejects.toHaveProperty('code');expect(await counts(b)).toEqual(before);
  });
  for(const sourceType of ['EXCEL','GOOGLE_DRIVE'])check(`trusted ${sourceType} frozen adapter proves actual mapped rows`,async()=>{
    const r=row();let bytes=sourceBytes([r]);if(sourceType==='EXCEL'){const book=XLSX.utils.book_new();XLSX.utils.book_append_sheet(book,XLSX.utils.json_to_sheet([r.raw]),'Roster');bytes=XLSX.write(book,{type:'buffer',bookType:'xlsx',compression:true});}
    const s=await session([r],{sourceType,bytes}),cp=await service.readCheckpoint('admin',scope,s.sessionId);expect(cp.source.rowInventory.rowCount).toBe(1);expect(cp.importBatch.rows[0].sourceRowId).toMatch(/^[a-f0-9]{64}$/);
    const started=await start(s);expect((await advance(s,started.operation.version)).operation.state).toBe('COMPLETED');
  });
  for(const sourceType of ['EXCEL','GOOGLE_DRIVE'])check(`unsupported ${sourceType} source verification fails closed without effects`,async()=>{
    const s={sessionId:`IMP-${randomUUID()}`,operationId:randomUUID(),importBatchId:`BATCH-${randomUUID()}`};
    await service.createSession('admin',scope,{...s,requestId:randomUUID(),expectedVersion:0,sourceType});const before=await counts(s),bytes=Buffer.from('unverified legacy binary');
    await expect(service.attachSource('admin',scope,{sessionId:s.sessionId,requestId:randomUUID(),expectedVersion:1,sourceRevisionId:randomUUID(),contentSha256:sha(bytes),sourceType,metadata:{sheetName:'Roster',rowFormat:'UNVERIFIED'}},bytes)).rejects.toHaveProperty('code');expect(await counts(s)).toEqual(before);
  });
  for(const phase of ['start','recovery'] as const)check(`${phase} recomputes full inventory despite a valid sealed cached checkpoint`,async()=>{
    const s=await session([row(1),row(2)]);let lease:any;
    if(phase==='recovery'){const started=await start(s);lease=await service.acquire('admin',scope,{sessionId:s.sessionId,operationId:s.operationId,requestId:randomUUID(),expectedVersion:started.operation.version});}
    const cp=await service.readCheckpoint('admin',scope,s.sessionId),h=await sqlSession(s);cp.importBatch.rows[1].raw.Driver='invented after review';
    // Privileged fault injection bypasses the public checkpoint validator while
    // preserving valid artifact encryption, hashes and cached signed evidence.
    const chunks=encodeSessionChunks(cp),digest=sha(chunks.join('')),crypto=new IdentityProtection(),client=await admin.connect();
    try{await client.query('BEGIN');await client.query('DELETE FROM import_artifact_chunks WHERE artifact_id=$1',[h.checkpoint_artifact]);
      for(let i=0;i<chunks.length;i++)await client.query('INSERT INTO import_artifact_chunks(company_id,project_id,session_id,artifact_id,chunk_index,content_sha256,content_encrypted) VALUES($1,$2,$3,$4,$5,$6,$7)',[company,project,h.id,h.checkpoint_artifact,i,sha(chunks[i]),crypto.seal(chunks[i],`${company}/${project}/import/${h.id}/${h.checkpoint_artifact}/${i}`)]);
      await client.query('UPDATE import_source_artifacts SET content_sha256=$1,manifest=$2,byte_length=$3 WHERE id=$4',[digest,{count:chunks.length,digest},chunks.reduce((n,c)=>n+Buffer.byteLength(c),0),h.checkpoint_artifact]);await client.query('COMMIT');
    }catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();}const before=await counts(s);
    const fresh=new SqlImportAuthority({...dependencies,sourceStore:new IsolatedSqlImportSourceStore()});
    if(phase==='start')await expect(fresh.start('admin',scope,{sessionId:s.sessionId,operationId:s.operationId,requestId:randomUUID(),expectedVersion:s.version,reviewedSignature:sha(cp.reviewedCanonicalIntent.intent.signature)})).rejects.toMatchObject({code:'SOURCE_ROW_VALUE_MISMATCH'});
    else await expect(fresh.commitNext('admin',scope,{sessionId:s.sessionId,operationId:s.operationId,groupId:lease.groupId,fence:lease.fence,bindingHash:lease.bindingHash})).rejects.toMatchObject({code:'SOURCE_ROW_VALUE_MISMATCH'});
    expect(await counts(s)).toEqual(before);
  });
  check('reviewed prepared group commits identities, memberships, affiliations, assignment, allocation and one receipt',async()=>{
    const s=await session(),started=await start(s),result=await advance(s,started.operation.version);
    expect(result.operation.state).toBe('COMPLETED');expect(result.receipts).toHaveLength(1);expect(result.receipts[0].resultSummary).toMatchObject({createdIdentities:2,contributingRows:1});
    expect(result.receipts[0].resultSummary.assignments).toHaveLength(1);expect(result.receipts[0].resultSummary.allocations).toHaveLength(1);
    expect((await counts(s)).import_execution_receipts).toBe(1);expect(result.lifecycleState).toBe('COMMITTED');
  });
  check('source and checkpoint survive fresh service instances; source intake creates no domain identities',async()=>{
    const before=Number((await admin.query('SELECT count(*) FROM drivers WHERE company_id=$1',[company])).rows[0].count);
    const s=await session([row()],{review:false});const fresh=new SqlImportAuthority({...dependencies,sourceStore:new IsolatedSqlImportSourceStore()});
    const cp=await fresh.readCheckpoint('admin',scope,s.sessionId);expect(cp.source.fingerprint).toMatch(/^[0-9a-f]{64}$/);expect(cp.importBatch.rows).toHaveLength(1);
    expect(Number((await admin.query('SELECT count(*) FROM drivers WHERE company_id=$1',[company])).rows[0].count)).toBe(before);
  });
  check('start is idempotent across new request IDs; changed signatures and operations fail closed',async()=>{
    const s=await session(),first=await start(s),same=await service.start('admin',scope,{...first.request,requestId:randomUUID()});expect(same).toEqual(first.operation);
    await expect(service.start('admin',scope,{...first.request,requestId:randomUUID(),reviewedSignature:'f'.repeat(64)})).rejects.toHaveProperty('code');
    await expect(service.start('admin',scope,{...first.request,requestId:randomUUID(),operationId:randomUUID()})).rejects.toHaveProperty('code');
  });
  check('partial execution resumes with fresh connection pools and does not repeat a committed group',async()=>{
    const s=await session([row(1),row(2)]),started=await start(s),one=await advance(s,started.operation.version);expect(one.operation.state).toBe('PARTIAL');expect(one.operation.completedGroups).toBe(1);
    const freshRuntime=pool('DATABASE_URL'),freshAuth=pool('AUTH_DATABASE_URL');
    try{const fresh=new SqlImportAuthority({runtimePool:freshRuntime,authPool:freshAuth,verifyToken,sourceStore:new IsolatedSqlImportSourceStore()});
      const recovered=await fresh.status('admin',scope,s.sessionId,s.operationId);expect(recovered.receipts).toHaveLength(1);
      const done=await fresh.advance('admin',scope,{sessionId:s.sessionId,operationId:s.operationId,requestId:randomUUID(),expectedVersion:recovered.operation.version});
      expect(done.operation.state).toBe('COMPLETED');expect(done.receipts).toHaveLength(2);
    }finally{await Promise.all([freshRuntime.end(),freshAuth.end()]);}
  });
  check('simultaneous advances commit at most one group for the same expected operation version',async()=>{
    const s=await session(),started=await start(s),results=await Promise.allSettled([advance(s,started.operation.version),advance(s,started.operation.version)]);
    expect(results.filter(r=>r.status==='fulfilled')).toHaveLength(1);expect((await status(s)).operation.completedGroups).toBe(1);expect((await counts(s)).import_execution_receipts).toBe(1);
  });
  check('newer fence invalidates an older uncommitted group attempt',async()=>{
    const s=await session(),started=await start(s),first=await service.acquire('admin',scope,{sessionId:s.sessionId,operationId:s.operationId,requestId:randomUUID(),expectedVersion:started.operation.version});
    const secondFence=await service.acquire('admin',scope,{sessionId:s.sessionId,operationId:s.operationId,requestId:randomUUID(),expectedVersion:first.version});
    await expect(service.commitNext('admin',scope,{sessionId:s.sessionId,operationId:s.operationId,groupId:first.groupId,fence:first.fence,bindingHash:first.bindingHash})).rejects.toMatchObject({code:'EXECUTION_FENCE_STALE'});
    await service.commitNext('admin',scope,{sessionId:s.sessionId,operationId:s.operationId,groupId:secondFence.groupId,fence:secondFence.fence,bindingHash:secondFence.bindingHash});expect((await status(s)).operation.state).toBe('COMPLETED');
  });
  check('cancellation preserves committed groups and refuses further execution or source edits',async()=>{
    const s=await session([row(1),row(2)]),started=await start(s),partial=await advance(s,started.operation.version);
    const cancelled=await service.cancel('admin',scope,{sessionId:s.sessionId,operationId:s.operationId,requestId:randomUUID(),expectedVersion:partial.operation.version});expect(cancelled.state).toBe('CANCELLED');
    await expect(advance(s,cancelled.version)).rejects.toMatchObject({code:'EXECUTION_NOT_RETRYABLE'});expect((await status(s)).receipts).toHaveLength(1);
    await expect(service.checkpoint('admin',scope,{sessionId:s.sessionId,requestId:randomUUID(),expectedVersion:(await service.readCheckpoint('admin',scope,s.sessionId)).version,patch:{lifecycleState:'REVIEW'}})).rejects.toHaveProperty('code');
  });
  check('checkpoint CAS, direct review spoofing and forbidden credentials fail closed',async()=>{
    const s=await session([row()],{review:false});
    await expect(service.checkpoint('admin',scope,{sessionId:s.sessionId,requestId:randomUUID(),expectedVersion:s.version-1,patch:{warningConfirmation:true}})).rejects.toMatchObject({code:'IMPORT_VERSION_CONFLICT'});
    await expect(service.checkpoint('admin',scope,{sessionId:s.sessionId,requestId:randomUUID(),expectedVersion:s.version,patch:{lifecycleState:'INTENT_REVIEWED'}})).rejects.toMatchObject({code:'SERVER_REVIEW_REQUIRED'});
    await expect(service.checkpoint('admin',scope,{sessionId:s.sessionId,requestId:randomUUID(),expectedVersion:s.version,patch:{reviewSnapshot:{password:'secret'}}})).rejects.toHaveProperty('code');
  });
  check('missing source provider fails closed without pretending raw source is available',async()=>{
    const absent=new SqlImportAuthority(dependencies),s=await session([row()],{review:false});
    await expect(absent.preview('admin',scope,s.sessionId)).rejects.toMatchObject({code:'SOURCE_STORAGE_UNAVAILABLE'});
  });
  for(const defect of ['missing','duplicate','corrupt','manifest'] as const)check(`source artifact ${defect} is rejected without domain effects`,async()=>{
    const s=await session([row()],{review:false}),header=await sqlSession(s),before=await counts(s);
    const chunk=(await admin.query('SELECT * FROM import_artifact_chunks WHERE artifact_id=$1 ORDER BY chunk_index LIMIT 1',[header.source_artifact])).rows[0];
    if(defect==='missing')await admin.query('DELETE FROM import_artifact_chunks WHERE artifact_id=$1 AND chunk_index=0',[header.source_artifact]);
    if(defect==='duplicate'){
      await expect(admin.query(`INSERT INTO import_artifact_chunks(company_id,project_id,session_id,artifact_id,chunk_index,content_sha256,content_encrypted)
        VALUES($1,$2,$3,$4,$5,$6,$7)`,[chunk.company_id,chunk.project_id,chunk.session_id,chunk.artifact_id,chunk.chunk_index,chunk.content_sha256,chunk.content_encrypted])).rejects.toMatchObject({code:'23505'});
      return;
    }
    if(defect==='corrupt')await admin.query("UPDATE import_artifact_chunks SET content_encrypted='invalid' WHERE artifact_id=$1",[header.source_artifact]);
    if(defect==='manifest')await admin.query("UPDATE import_source_artifacts SET manifest=jsonb_set(manifest,'{digest}',to_jsonb(repeat('0',64))) WHERE id=$1",[header.source_artifact]);
    await expect(service.preview('admin',scope,s.sessionId)).rejects.toHaveProperty('code');expect(await counts(s)).toEqual(before);
  });
  check('checkpoint chunks reconstruct deterministically and corrupted checkpoint is never a successful empty session',async()=>{
    const s=await session([row()],{review:false}),header=await sqlSession(s);
    const before=await service.readCheckpoint('admin',scope,s.sessionId);expect((await service.readCheckpoint('admin',scope,s.sessionId))).toEqual(before);
    await admin.query("UPDATE import_artifact_chunks SET content_sha256=repeat('0',64) WHERE artifact_id=$1 AND chunk_index=0",[header.checkpoint_artifact]);
    await expect(service.readCheckpoint('admin',scope,s.sessionId)).rejects.toMatchObject({code:'IMPORT_ARTIFACT_CORRUPT'});
  });
  check('changed source bytes, hash and mutable remote content cannot replace reviewed evidence',async()=>{
    const s=await session(),before=await sqlSession(s),changed=Buffer.from('different source');
    await expect(service.attachSource('admin',scope,{sessionId:s.sessionId,requestId:randomUUID(),expectedVersion:s.version,sourceRevisionId:randomUUID(),contentSha256:sha(changed),sourceType:'CSV',metadata:{fileName:'synthetic.csv'}},changed)).rejects.toMatchObject({code:'IMMUTABLE_SOURCE_REVISION'});
    await expect(service.attachSource('admin',scope,{sessionId:s.sessionId,requestId:randomUUID(),expectedVersion:s.version,sourceRevisionId:randomUUID(),contentSha256:'0'.repeat(64),sourceType:'CSV',metadata:{}},changed)).rejects.toMatchObject({code:'SOURCE_HASH_MISMATCH'});
    expect((await sqlSession(s)).checkpoint_artifact).toBe(before.checkpoint_artifact);
  });
  check('explicit same-content source revision replacement invalidates prior approval',async()=>{
    const s=await session(),bytes=sourceBytes(s.rows);
    await service.attachSource('admin',scope,{sessionId:s.sessionId,requestId:randomUUID(),expectedVersion:s.version,sourceRevisionId:randomUUID(),contentSha256:sha(bytes),sourceType:'CSV',metadata:{fileName:'synthetic.csv',mimeType:'text/csv'}},bytes);
    const cp=await service.readCheckpoint('admin',scope,s.sessionId);expect(cp.lifecycleState).toBe('DISCOVERED');expect(cp.reviewedCanonicalIntent).toBeUndefined();expect(cp.mapping).toBeUndefined();expect(cp.importBatch).toBeUndefined();expect(cp.sourceCorrections).toBeUndefined();
  });
  check('mapping provenance is actor-stamped and wrong source/missing mapping revisions fail closed',async()=>{
    const s=await session([row()],{review:false}),cp=await service.readCheckpoint('admin',scope,s.sessionId);expect(cp.mapping.approvedBy).toBe(actor);
    for(const mapping of [{...cp.mapping,sourceRevisionId:randomUUID(),mappingRevisionId:randomUUID()},{...cp.mapping,mappings:{driverName:'Different'}}])
      await expect(service.checkpoint('admin',scope,{sessionId:s.sessionId,requestId:randomUUID(),expectedVersion:s.version,patch:{lifecycleState:'MAPPING',rosterStage:'MAPPING_APPROVAL',currentStage:'MAPPING_APPROVAL',invalidateReview:true,mapping}})).rejects.toHaveProperty('code');
  });
  check('explicit mapping replacement clears approval and prevents old reviewed signature execution',async()=>{
    const s=await session(),cp=await service.readCheckpoint('admin',scope,s.sessionId),signature=sha(cp.reviewedCanonicalIntent.intent.signature);
    const next=await service.checkpoint('admin',scope,{sessionId:s.sessionId,requestId:randomUUID(),expectedVersion:s.version,patch:{lifecycleState:'MAPPING',rosterStage:'MAPPING_APPROVAL',currentStage:'MAPPING_APPROVAL',invalidateReview:true,mapping:{...cp.mapping,mappingRevisionId:randomUUID(),mappings:{...mappings,Driver:'unmapped',AlternateDriver:'driverName'}}}});
    expect((await service.readCheckpoint('admin',scope,s.sessionId)).reviewedCanonicalIntent).toBeUndefined();
    await expect(service.start('admin',scope,{sessionId:s.sessionId,operationId:s.operationId,requestId:randomUUID(),expectedVersion:next.version,reviewedSignature:signature})).rejects.toHaveProperty('code');
  });
  check('unresolved/blocked rows and unconfirmed Material never receive approval or create globals',async()=>{
    const r=row();r.entityResolutions.material.matchedId=undefined;const s=await session([r],{review:false}),before=await counts(s),p=await service.preview('admin',scope,s.sessionId);
    expect(p.intent.blockers.length).toBeGreaterThan(0);
    await expect(service.review('admin',scope,{sessionId:s.sessionId,requestId:randomUUID(),expectedVersion:s.version,reviewedSignature:p.reviewedSignature})).rejects.toMatchObject({code:'REVIEWED_INTENT_STALE'});expect(await counts(s)).toEqual(before);
  });
  check('explicitly rejected rows have no group or canonical consequences',async()=>{
    const accepted=row(1),rejected=row(2);rejected.status='REJECTED';const s=await session([accepted,rejected]),started=await start(s);
    expect(started.operation.groupCount).toBe(1);const done=await advance(s,started.operation.version);expect(done.receipts[0].resultSummary.contributingRows).toBe(1);
    expect(done.receipts[0].resultSummary.createdIdentities).toBe(2);
  });
  check('compatible concurrent prepared materialization reuses globals; incompatible profile does not create substitutes',async()=>{
    const r=row(),s=await session([r]),d=r.entityResolutions.driver.preparedDriverPlan,t=r.entityResolutions.truck.preparedTruckPlan;
    const driver=await make('DRIVER',d.residencyId,{fullNameAr:d.driverName,phone:d.phone}),truck=await make('TRUCK',t.plateNumber,{truckType:'DUMPER'});
    const started=await start(s),done=await advance(s,started.operation.version);expect(done.operation.state).toBe('COMPLETED');
    expect(done.receipts[0].resultSummary).toMatchObject({createdIdentities:0,reusedConcurrentIdentities:2});
    expect(done.receipts[0].resultSummary.assignments[0]).toMatchObject({driverId:driver.externalId,truckId:truck.externalId});
    const wrong=row(),pending=await session([wrong]);await make('DRIVER',wrong.entityResolutions.driver.preparedDriverPlan.residencyId,{fullNameAr:'مختلف',phone:''});
    await expect(start(pending)).rejects.toMatchObject({code:'PREPARED_ENTITY_CONFLICT'});
  });
  for(const target of ['audit_events','outbox_events'])check(`late ${target} failure rolls back all group consequences and remains explicitly retryable`,async()=>{
    const s=await session(),started=await start(s),lease=await service.acquire('admin',scope,{sessionId:s.sessionId,operationId:s.operationId,requestId:randomUUID(),expectedVersion:started.operation.version});
    const before=await counts(s);
    await admin.query(`CREATE OR REPLACE FUNCTION u05_fail_group() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
      IF NEW.${target==='audit_events'?'action':'event_type'}='IMPORT_GROUP_COMMITTED' THEN RAISE EXCEPTION 'injected group failure'; END IF; RETURN NEW; END $$`);
    await admin.query(`CREATE TRIGGER u05_fail_group BEFORE INSERT ON ${target} FOR EACH ROW EXECUTE FUNCTION u05_fail_group()`);
    try{await expect(service.commitNext('admin',scope,{sessionId:s.sessionId,operationId:s.operationId,groupId:lease.groupId,fence:lease.fence,bindingHash:lease.bindingHash})).rejects.toMatchObject({status:503});expect(await counts(s)).toEqual(before);}
    finally{await admin.query(`DROP TRIGGER u05_fail_group ON ${target}`);}
    await service.commitNext('admin',scope,{sessionId:s.sessionId,operationId:s.operationId,groupId:lease.groupId,fence:lease.fence,bindingHash:lease.bindingHash});expect((await status(s)).operation.state).toBe('COMPLETED');
  });
  check('lost HTTP acknowledgment reads committed receipt and exact retry adds no effects',async()=>{
    const s=await session(),proof=(await service.readCheckpoint('admin',scope,s.sessionId)).importBatch.rows[0].raw._sourceProof,started=await start(s),request={sessionId:s.sessionId,operationId:s.operationId,expectedVersion:started.operation.version,requestId:randomUUID()};
    const app=express();app.post('/lost',async(_req,res)=>{await service.advance('admin',scope,request);res.socket?.destroy();});
    const broken=await new Promise<Server>(resolve=>{const server=app.listen(0,'127.0.0.1',()=>resolve(server));});
    try{await expect(fetch(`http://127.0.0.1:${(broken.address() as any).port}/lost`,{method:'POST'})).rejects.toThrow();}
    finally{await new Promise<void>(resolve=>broken.close(()=>resolve()));}
    expect((await status(s)).operation.state).toBe('COMPLETED');const before=await counts(s);
    expect((await service.advance('admin',scope,request)).operation.state).toBe('COMPLETED');expect(await counts(s)).toEqual(before);
    expect((await service.start('admin',scope,{...started.request})).state).toBe('COMPLETED');
    expect((await new SqlImportAuthority({...dependencies,sourceStore:new IsolatedSqlImportSourceStore()}).readCheckpoint('admin',scope,s.sessionId)).importBatch.rows[0].raw._sourceProof).toEqual(proof);
  });
  check('a separate Node process reconstructs committed execution truth without the original service object',async()=>{
    const s=await session(),started=await start(s);await advance(s,started.operation.version);
    const {spawn}=await import('node:child_process');
    const script=`import {SqlImportAuthority} from './src/db/importAuthority.ts';import {closePool} from './src/db/pool.ts';let input='';for await(const c of process.stdin)input+=c;const q=JSON.parse(input);try{const a=new SqlImportAuthority({verifyToken:async()=>({uid:q.uid})});const v=await a.status('verified',q.scope,q.session,q.operation);process.stdout.write(JSON.stringify({pid:process.pid,state:v.operation.state,receipts:v.receipts.length}));await closePool();}catch(e){process.stderr.write(String(e.code||'RESTART_PROBE_FAILED'));process.exit(1);}`;
    const output=await new Promise<string>((resolve,reject)=>{const child=spawn(process.execPath,['--import','tsx','--input-type=module','-e',script],{cwd:process.cwd(),env:process.env,windowsHide:true});let output='';child.stdout.on('data',d=>{output+=d;});child.on('error',reject);child.on('exit',code=>code===0?resolve(output):reject(Error('RESTART_PROBE_FAILED')));child.stdin.end(JSON.stringify({uid:`u05-admin-${actor}`,scope,session:s.sessionId,operation:s.operationId}));});
    expect(JSON.parse(output)).toMatchObject({state:'COMPLETED',receipts:1});expect(JSON.parse(output).pid).not.toBe(process.pid);
  });
  check('semantic changes become REVIEW_REQUIRED rather than automatic infinite retry',async()=>{
    const s=await session(),started=await start(s),r=s.rows[0];await make('DRIVER',r.entityResolutions.driver.preparedDriverPlan.residencyId,{fullNameAr:'غير مطابق',phone:''});
    const result=await advance(s,started.operation.version);expect(result.operation.state).toBe('REVIEW_REQUIRED');expect(result.retryAllowed).toBe(false);
    await expect(advance(s,result.operation.version)).rejects.toMatchObject({code:'EXECUTION_NOT_RETRYABLE'});expect(result.receipts).toHaveLength(0);
  });
  check('1,000 repeated source rows use one bounded group and constant distinct canonical effects',async()=>{
    const seed=row(),rows=Array.from({length:1000},(_,i)=>({...structuredClone(seed),rowNumber:i+1})),s=await session(rows),started=await start(s);
    const proof=await service.readCheckpoint('admin',scope,s.sessionId);expect(proof.source.rowInventory.rowCount).toBe(1000);expect(new Set(proof.importBatch.rows.map((r:any)=>r.sourceRowId)).size).toBe(1000);expect(proof.importBatch.rows[999].sourceLocation.sourceRowNumber).toBe(1001);
    expect(started.operation.groupCount).toBe(1);const fence=await service.acquire('admin',scope,{sessionId:s.sessionId,operationId:s.operationId,requestId:randomUUID(),expectedVersion:started.operation.version});
    const result=await service.commitNext('admin',scope,{sessionId:s.sessionId,operationId:s.operationId,groupId:fence.groupId,fence:fence.fence,bindingHash:fence.bindingHash});
    expect(result.queries).toBeLessThan(SQL_IMPORT_LIMITS.groupQueries);expect(result.receipt.resultSummary).toMatchObject({contributingRows:1000,createdIdentities:2});
    expect(result.receipt.resultSummary.assignments).toHaveLength(1);expect(result.receipt.resultSummary.allocations).toHaveLength(1);
    console.info('U05 GROUP BUDGET',JSON.stringify({rows:1000,groups:1,queries:result.queries,receiptBytes:Buffer.byteLength(JSON.stringify(result.receipt))}));
  });
  check('reassignment and reallocation require explicit displacement approval and preserve accepted closed history',async()=>{
    const d1=await make('DRIVER'),d2=await make('DRIVER'),t1=await make('TRUCK'),t2=await make('TRUCK'),oldMaterial=await make('MATERIAL');
    for(const [kind,entity] of [['DRIVER',d1],['DRIVER',d2],['TRUCK',t1],['TRUCK',t2]] as const)
      await canonical.affiliation('admin',{...command(),kind,entityId:entity.externalId,carrierId:carrier,command:'SET_AFFILIATION'});
    const a1=await canonical.assignment('admin',{...command(),command:'ASSIGN',driverId:d1.externalId,truckId:t1.externalId});
    const a2=await canonical.assignment('admin',{...command(),command:'ASSIGN',driverId:d2.externalId,truckId:t2.externalId});
    const allocation=await canonical.allocation('admin',{...command(),command:'ALLOCATE',truckId:t2.externalId,materialId:oldMaterial.externalId});
    const r=row();r.entityResolutions.driver={entityType:'DRIVER',matchedId:d1.externalId,recommendation:'ACCEPT',isAuthorized:true};
    r.entityResolutions.truck={entityType:'TRUCK',matchedId:t2.externalId,recommendation:'ACCEPT',isAuthorized:true};
    const s=await session([r],{review:false}),preview=await service.preview('admin',scope,s.sessionId),before=await counts(s);
    expect(preview.intent.requiresDisplacementApproval).toBe(true);
    await expect(service.review('admin',scope,{sessionId:s.sessionId,requestId:randomUUID(),expectedVersion:s.version,reviewedSignature:preview.reviewedSignature})).rejects.toMatchObject({code:'DISPLACEMENT_APPROVAL_REQUIRED'});
    expect(await counts(s)).toEqual(before);
    const accepted=await service.review('admin',scope,{sessionId:s.sessionId,requestId:randomUUID(),expectedVersion:s.version,reviewedSignature:preview.reviewedSignature,displacementApprovedSignature:preview.reviewedSignature});s.version=accepted.version;
    const started=await start(s),done=await advance(s,started.operation.version);expect(done.operation.state).toBe('COMPLETED');
    const closed=(await admin.query(`SELECT record_status,upper_inf(valid_period) AS open FROM driver_truck_assignments WHERE external_id=ANY($1::text[])`,[[a1.relationship.assignmentId,a2.relationship.assignmentId]])).rows;
    expect(closed).toEqual([{record_status:'ACCEPTED',open:false},{record_status:'ACCEPTED',open:false}]);
    expect((await admin.query('SELECT record_status,upper_inf(valid_period) AS open FROM truck_material_allocations WHERE external_id=$1',[allocation.relationship.allocationId])).rows[0]).toEqual({record_status:'ACCEPTED',open:false});
  });
  check('canonical membership/status changes after approval invalidate start without changing reviewed intent',async()=>{
    const s=await session(),before=await service.readCheckpoint('admin',scope,s.sessionId);
    const identity=(await admin.query('SELECT revision FROM carriers WHERE company_id=$1 AND external_id=$2',[company,carrier])).rows[0];
    await canonical.setStatus('admin',{...command(),kind:'CARRIER',entityId:carrier,status:'SUSPENDED',expectedRevision:Number(identity.revision)});
    try{await expect(start(s)).rejects.toMatchObject({code:'REVIEWED_INTENT_STALE'});expect((await service.readCheckpoint('admin',scope,s.sessionId)).reviewedCanonicalIntent).toEqual(before.reviewedCanonicalIntent);}
    finally{await canonical.setStatus('admin',{...command(),kind:'CARRIER',entityId:carrier,status:'ACTIVE',expectedRevision:Number(identity.revision)+1});}
  });
  check('cancel linearizes against an already acquired but uncommitted fence',async()=>{
    const s=await session(),started=await start(s),lease=await service.acquire('admin',scope,{sessionId:s.sessionId,operationId:s.operationId,requestId:randomUUID(),expectedVersion:started.operation.version});
    await service.cancel('admin',scope,{sessionId:s.sessionId,operationId:s.operationId,requestId:randomUUID(),expectedVersion:lease.version});
    await expect(service.commitNext('admin',scope,{sessionId:s.sessionId,operationId:s.operationId,groupId:lease.groupId,fence:lease.fence,bindingHash:lease.bindingHash})).rejects.toMatchObject({code:'EXECUTION_FENCE_STALE'});
    expect((await status(s)).receipts).toHaveLength(0);
  });
  check('real concurrent cancellation/group commit has exactly one linearized terminal result',async()=>{
    const s=await session(),started=await start(s),lease=await service.acquire('admin',scope,{sessionId:s.sessionId,operationId:s.operationId,requestId:randomUUID(),expectedVersion:started.operation.version}),before=await counts(s);
    await Promise.allSettled([service.cancel('admin',scope,{sessionId:s.sessionId,operationId:s.operationId,requestId:randomUUID(),expectedVersion:lease.version}),
      service.commitNext('admin',scope,{sessionId:s.sessionId,operationId:s.operationId,groupId:lease.groupId,fence:lease.fence,bindingHash:lease.bindingHash})]);
    const result=await status(s),after=await counts(s);expect(['COMPLETED','CANCELLED']).toContain(result.operation.state);
    expect(result.receipts.length).toBe(result.operation.state==='COMPLETED'?1:0);expect(after.identities-before.identities).toBe(result.operation.state==='COMPLETED'?2:0);
  });
  check('retryable infrastructure failure records PARTIAL and explicit retry commits once',async()=>{
    const s=await session(),started=await start(s);
    await admin.query(`CREATE OR REPLACE FUNCTION u05_fail_group() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.event_type='IMPORT_GROUP_COMMITTED' THEN RAISE EXCEPTION 'injected'; END IF; RETURN NEW; END $$`);
    await admin.query('CREATE TRIGGER u05_fail_group BEFORE INSERT ON outbox_events FOR EACH ROW EXECUTE FUNCTION u05_fail_group()');
    let partial:any;try{partial=await advance(s,started.operation.version);expect(partial.operation.state).toBe('PARTIAL');expect(partial.operation.failure.retryable).toBe(true);expect(partial.receipts).toHaveLength(0);}
    finally{await admin.query('DROP TRIGGER u05_fail_group ON outbox_events');}
    const done=await advance(s,partial.operation.version);expect(done.operation.state).toBe('COMPLETED');expect(done.receipts).toHaveLength(1);
  });
  check('completed execution is read-only; conflicting duplicate request payload cannot replay it',async()=>{
    const s=await session(),started=await start(s);await advance(s,started.operation.version);const before=await counts(s);
    await expect(service.start('admin',scope,{...started.request,reviewedSignature:'f'.repeat(64)})).rejects.toMatchObject({code:'IDEMPOTENCY_PAYLOAD_MISMATCH'});
    await expect(service.cancel('admin',scope,{sessionId:s.sessionId,operationId:s.operationId,requestId:randomUUID(),expectedVersion:(await status(s)).operation.version})).rejects.toMatchObject({code:'EXECUTION_ALREADY_COMPLETED'});
    expect(await counts(s)).toEqual(before);
  });
  check('status and receipt pages are bounded, scoped and artifact-free; status never reveals prepared natural IDs',async()=>{
    const s=await session([row(1),row(2),row(3)]),started=await start(s);let current=await advance(s,started.operation.version);current=await advance(s,current.operation.version);
    const minimal=new SqlImportAuthority(dependencies),page=await minimal.status('admin',scope,s.sessionId,s.operationId,1);expect(page.receipts).toHaveLength(1);expect(page.remaining.length).toBeLessThanOrEqual(1);expect(page.hasMore).toBe(true);
    const next=await minimal.status('admin',scope,s.sessionId,s.operationId,1,page.nextCursor!);expect(next.receipts[0].groupId).not.toBe(page.receipts[0].groupId);
    await expect(minimal.status('manager',scope,s.sessionId,s.operationId,1,page.nextCursor!)).rejects.toMatchObject({code:'INVALID_IMPORT_STATUS_CURSOR'});
    const text=JSON.stringify(page);for(const r of s.rows)expect(text).not.toContain(r.entityResolutions.driver.preparedDriverPlan.residencyId);
    expect(text).not.toMatch(/preparedIdentityMap|profile|sourceArtifact|plan_encrypted/);
    await advance(s,current.operation.version);await expect(minimal.status('admin',scope,s.sessionId,s.operationId,1,page.nextCursor!)).rejects.toMatchObject({code:'INVALID_IMPORT_STATUS_CURSOR'});
    for(const limit of [0,51])await expect(minimal.status('admin',scope,s.sessionId,s.operationId,limit)).rejects.toHaveProperty('code');
  });
  check('current account, company role and project access override stored approval',async()=>{
    const s=await session(),started=await start(s);
    await admin.query("UPDATE users SET status='SUSPENDED' WHERE id=$1",[manager]);
    try{await expect(service.status('manager',scope,s.sessionId,s.operationId)).rejects.toMatchObject({code:'ACCOUNT_SUSPENDED'});}finally{await admin.query("UPDATE users SET status='ACTIVE' WHERE id=$1",[manager]);}
    await admin.query("UPDATE user_company_roles SET status='REVOKED' WHERE user_id=$1",[manager]);
    try{await expect(service.status('manager',scope,s.sessionId,s.operationId)).rejects.toMatchObject({code:'NO_ACTIVE_COMPANY_ROLE'});}finally{await admin.query("UPDATE user_company_roles SET status='ACTIVE' WHERE user_id=$1",[manager]);}
    await admin.query("UPDATE project_access SET status='REVOKED' WHERE user_id=$1",[manager]);
    try{await expect(service.status('manager',scope,s.sessionId,s.operationId)).rejects.toHaveProperty('code');}finally{await admin.query("UPDATE project_access SET status='ACTIVE' WHERE user_id=$1",[manager]);}
    await expect(service.status('viewer',scope,s.sessionId,s.operationId)).rejects.toHaveProperty('code');expect(started.operation.state).toBe('READY');
  });
  check('two-company/project IDOR, artifact composite FKs and RLS fail closed',async()=>{
    const s=await session(),started=await start(s),header=await sqlSession(s),foreignSession=`IMP-${randomUUID()}`;
    await service.createSession('admin',scopeForeign,{sessionId:foreignSession,requestId:randomUUID(),expectedVersion:0,operationId:randomUUID(),importBatchId:'FOREIGN-BATCH',sourceType:'CSV'});
    const foreignHeader=(await admin.query('SELECT * FROM import_sessions WHERE company_id=$1 AND external_id=$2',[other,foreignSession])).rows[0];
    await expect(service.status('admin',scopeB,s.sessionId,s.operationId)).rejects.toHaveProperty('code');await expect(service.status('admin',scopeForeign,s.sessionId,s.operationId)).rejects.toHaveProperty('code');
    await withUnitOfWork({companyId:company,projectId:project,actorId:actor},async uow=>{
      expect((await uow.query('SELECT * FROM import_source_artifacts WHERE id=$1',[foreignHeader.checkpoint_artifact])).rowCount).toBe(0);
      expect((await uow.query('SELECT * FROM import_executions WHERE project_id=$1',[second])).rowCount).toBe(0);
    },runtime);
    await expect(withUnitOfWork({companyId:company,projectId:project,actorId:actor},uow=>uow.query(`INSERT INTO import_source_artifacts(id,company_id,project_id,session_id,artifact_kind,content_sha256,object_uri,manifest,byte_length)
      VALUES(gen_random_uuid(),$1,$2,$3,'SOURCE',repeat('0',64),'denied','{}',1)`,[company,project,foreignHeader.id]),runtime)).rejects.toMatchObject({code:'23503'});
    expect(header.id).not.toBe(foreignHeader.id);expect(started.operation.completedGroups).toBe(0);
  });
  check('immutable completed receipt/history grants and connection cleanup prevent tampering or escalation',async()=>{
    const s=await session(),started=await start(s);await advance(s,started.operation.version);
    for(const sql of ['UPDATE import_execution_receipts SET result_hash=repeat(\'0\',64)','DELETE FROM import_artifact_chunks',"SET ROLE qsa_command_authorizer"])
      await expect(withUnitOfWork({companyId:company,projectId:project,actorId:actor},uow=>uow.query(sql),runtime)).rejects.toMatchObject({code:'42501'});
    const h=await sqlSession(s);await expect(withUnitOfWork({companyId:company,projectId:project,actorId:actor},uow=>uow.query(`UPDATE import_executions SET state='PARTIAL',version=version+1 WHERE session_id=$1`,[h.id]),runtime)).rejects.toMatchObject({code:'23514'});
    const one=pool('DATABASE_URL',1);try{const fresh=new SqlImportAuthority({runtimePool:one,authPool:auth,verifyToken});await fresh.status('admin',scope,s.sessionId,s.operationId);
      const settings=(await one.query("SELECT current_setting('app.company_id',true) AS company,current_setting('app.actor_id',true) AS actor,current_setting('app.project_id',true) AS project,current_setting('app.operation_id',true) AS operation")).rows[0];expect(Object.values(settings).every(v=>!v)).toBe(true);
    }finally{await one.end();}
    const plaintext=(await admin.query('SELECT payload::text FROM outbox_events WHERE company_id=$1',[company])).rows.map(r=>r.payload).join('');
    expect(plaintext).not.toContain(s.rows[0].entityResolutions.driver.preparedDriverPlan.residencyId);expect(plaintext).not.toContain('سائق اختبار');
  });
  check('legacy sessions never acquire invented source/review authority',async()=>{
    const id=`LEGACY-${randomUUID()}`;await admin.query(`INSERT INTO import_sessions(id,company_id,project_id,external_id,state,source_hash) VALUES(gen_random_uuid(),$1,$2,$3,'REVIEW','unknown')`,[company,project,id]);
    await expect(service.readCheckpoint('admin',scope,id)).rejects.toMatchObject({code:'IMPORT_LEGACY_RECONCILIATION_REQUIRED'});
  });
  check('Trip review remains dependency-blocked on U06 without trip or provisional pricing writes',async()=>{
    const s=await session([row()],{domain:'TRIP'});
    const cp=await service.checkpoint('admin',scope,{sessionId:s.sessionId,requestId:randomUUID(),expectedVersion:s.version,patch:{lifecycleState:'MAPPING',currentStage:'MAPPING_APPROVAL'}});
    const resolved=await service.checkpoint('admin',scope,{sessionId:s.sessionId,requestId:randomUUID(),expectedVersion:cp.version,patch:{lifecycleState:'RESOLUTION',currentStage:'RESOLUTION'}});
    await service.checkpoint('admin',scope,{sessionId:s.sessionId,requestId:randomUUID(),expectedVersion:resolved.version,patch:{lifecycleState:'REVIEW',currentStage:'REVIEW',reviewSnapshot:{rows:[{rowNumber:1}]}}});
    await expect(service.preview('admin',scope,s.sessionId)).rejects.toMatchObject({code:'U06_TRIP_AUTHORITY_REQUIRED'});
    const cpRead=await service.readCheckpoint('admin',scope,s.sessionId);
    const blocked=await service.start('admin',scope,{sessionId:s.sessionId,operationId:s.operationId,requestId:randomUUID(),expectedVersion:cpRead.version});
    expect(blocked).toMatchObject({state:'REVIEW_REQUIRED',groupCount:0,completedGroups:0,failure:{code:'U06_TRIP_AUTHORITY_REQUIRED'}});
    await expect(advance(s,blocked.version)).rejects.toMatchObject({code:'EXECUTION_NOT_RETRYABLE'});
    expect(Number((await admin.query('SELECT count(*) FROM trips WHERE company_id=$1',[company])).rows[0].count)).toBe(0);expect((await service.readCheckpoint('admin',scope,s.sessionId)).reviewSnapshot.rows).toHaveLength(1);
  });
  check('invalid row/entity/group/source budgets reject without partial canonical effects',async()=>{
    const s=await session([row()],{review:false});
    const cp=await service.readCheckpoint('admin',scope,s.sessionId);cp.importBatch.rows.push({...cp.importBatch.rows[0]});
    await expect(service.checkpoint('admin',scope,{sessionId:s.sessionId,requestId:randomUUID(),expectedVersion:s.version,patch:{importBatch:cp.importBatch}})).rejects.toMatchObject({code:'INVALID_IMPORT_SESSION_BATCH'});
    await expect(service.attachSource('admin',scope,{sessionId:s.sessionId,requestId:randomUUID(),expectedVersion:s.version,sourceRevisionId:randomUUID(),sourceType:'CSV',contentSha256:'0'.repeat(64),metadata:{}},Buffer.alloc(2_000_001))).rejects.toHaveProperty('code');
    const rows=Array.from({length:8},(_,i)=>row(i+1));for(const r of rows){r.entityResolutions.driver.preparedDriverPlan=rows[0].entityResolutions.driver.preparedDriverPlan;
      r.raw.Identity=rows[0].raw.Identity;r.canonical.driverIdentity=rows[0].canonical.driverIdentity;}
    // A shared Driver with conflicting Trucks is rejected by the existing planner, not split into unsafe groups.
    const large=await session(rows,{review:false});expect((await service.preview('admin',scope,large.sessionId)).intent.blockers.some(b=>b.code==='CROSS_ROW_DRIVER_TRUCK_CONFLICT')).toBe(true);
  });
  check('isolated HTTP routing enforces authentication/limits and has no production mount',async()=>{
    const s=await session(),started=await start(s),path=`/api/v2/projects/${scope.projectId}/imports/${s.sessionId}/executions/${s.operationId}`;
    expect((await fetch(url+path)).status).toBe(401);
    const response=await fetch(url+path,{headers:{Authorization:'Bearer admin','X-Company-Id':company}});expect(response.status).toBe(200);expect(response.headers.get('cache-control')).toContain('no-store');
    expect((await fetch(url+path+'?limit=51',{headers:{Authorization:'Bearer admin','X-Company-Id':company}})).status).toBe(400);
    const {readFile}=await import('node:fs/promises');expect(await readFile('server/app.ts','utf8')).not.toContain('mountIsolatedSqlImportRoutes');
    const old=process.env.NODE_ENV;try{process.env.NODE_ENV='production';expect(()=>mountIsolatedSqlImportRoutes(express(),service)).toThrow('INACTIVE');expect(()=>new IsolatedSqlImportSourceStore()).toThrow('ISOLATED');}finally{process.env.NODE_ENV=old;}
    expect(started.operation.state).toBe('READY');
  });
  check('concurrent compatible imports reuse one natural identity and one active relationship without duplicate effects',async()=>{
    const r=row(),a=await session([structuredClone(r)]),b=await session([structuredClone(r)]),aa=await start(a),bb=await start(b);
    const [one,two]=await Promise.all([advance(a,aa.operation.version),advance(b,bb.operation.version)]);
    expect(one.operation.state).toBe('COMPLETED');expect(two.operation.state).toBe('COMPLETED');
    expect(one.receipts[0].resultSummary.assignments[0].assignmentId).toBe(two.receipts[0].resultSummary.assignments[0].assignmentId);
    expect(one.receipts[0].resultSummary.createdIdentities+two.receipts[0].resultSummary.createdIdentities).toBe(2);
    expect(one.receipts[0].resultSummary.reusedConcurrentIdentities+two.receipts[0].resultSummary.reusedConcurrentIdentities).toBe(2);
  });
  check('concurrent two-project SQL group materialization cannot evade company-wide temporal exclusion',async()=>{
    for(const [kind,id] of [['CARRIER',carrier],['MATERIAL',material]] as const)await canonical.membership('admin',{...command(scopeB),kind,entityId:id,command:'ENROLL',expectedRevision:0});
    const r=row(),a=await session([structuredClone(r)]),b=await session([structuredClone(r)],{at:scopeB}),aa=await start(a),bb=await start(b);
    const results=await Promise.all([advance(a,aa.operation.version),advance(b,bb.operation.version)]);
    expect(results.filter(r=>r.operation.state==='COMPLETED')).toHaveLength(1);expect(results.filter(r=>r.operation.state==='REVIEW_REQUIRED')).toHaveLength(1);
    expect(results.find(r=>r.operation.state==='REVIEW_REQUIRED')!.operation.failure!.code).toBe('TEMPORAL_RELATIONSHIP_CONFLICT');
    const {IdentityProtection}=await import('../db/identityProtection.js');const digest=new IdentityProtection().natural(company,'DRIVER',r.entityResolutions.driver.preparedDriverPlan.residencyId);
    expect(Number((await admin.query('SELECT count(*) FROM drivers WHERE company_id=$1 AND natural_key_hmac=$2',[company,digest])).rows[0].count)).toBe(1);
  });
  check('Google snapshot provenance stays frozen and status does not refetch mutable remote content',async()=>{
    const s=await session([row()],{sourceType:'GOOGLE_SHEETS'}),cp=await service.readCheckpoint('admin',scope,s.sessionId);
    expect(cp.source).toMatchObject({sourceType:'GOOGLE_SHEETS',requiresReattach:false,remote:{spreadsheetId:'synthetic-existing-sheet',sheetTitle:'Snapshot'}});
    const changed=Buffer.from('changed remote snapshot');
    await expect(service.attachSource('admin',scope,{sessionId:s.sessionId,requestId:randomUUID(),expectedVersion:s.version,sourceRevisionId:randomUUID(),sourceType:'GOOGLE_SHEETS',contentSha256:sha(changed),metadata:{spreadsheetId:'synthetic-existing-sheet',sheetTitle:'Snapshot'}},changed)).rejects.toMatchObject({code:'IMMUTABLE_SOURCE_REVISION'});
    const started=await start(s);expect((await status(s)).operation.state).toBe('READY');expect(started.operation.groupCount).toBe(1);
  });
  check('unavailable authentication transport and confirmed missing account never become identity registration authority',async()=>{
    const missingUid='unregistered-'+randomUUID();
    const state=async()=>(await admin.query(`SELECT (SELECT count(*) FROM users) AS users,
      (SELECT count(*) FROM import_sessions WHERE company_id=$1) AS sessions,
      (SELECT jsonb_agg(to_jsonb(p) ORDER BY p.id) FROM projects p WHERE company_id=$1) AS projects`,[company])).rows[0];
    const before=await state();
    const missing=new SqlImportAuthority({...dependencies,verifyToken:async()=>({uid:missingUid}),sourceStore});
    const request={sessionId:`IMP-${randomUUID()}`,requestId:randomUUID(),expectedVersion:0,operationId:randomUUID(),importBatchId:'BATCH',sourceType:'CSV'};
    await expect(missing.createSession('verified',scope,request)).rejects.toMatchObject({code:'USER_NOT_REGISTERED'});
    const badPool=await unavailablePostgres(process.env.AUTH_DATABASE_URL,200);
    try{const unavailable=new SqlImportAuthority({...dependencies,authPool:badPool.pool,sourceStore});await expect(unavailable.createSession('admin',scope,request).catch(error=>{expect(error.message).toBe('IMPORT_AUTHORITY_UNAVAILABLE');throw error;})).rejects.toMatchObject({code:'IMPORT_AUTHORITY_UNAVAILABLE',status:503});
      expect(badPool.rejectedConnections()).toBeGreaterThan(1);}
    finally{await badPool.close();}
    expect(await state()).toEqual(before);
    expect(Number((await admin.query('SELECT count(*) FROM users WHERE firebase_uid=$1',[missingUid])).rows[0].count)).toBe(0);
    expect(Number((await admin.query('SELECT count(*) FROM import_sessions WHERE external_id=$1',[request.sessionId])).rows[0].count)).toBe(0);
  });
  check('forged plan and receipt ciphertext fail closed rather than inventing recovery success',async()=>{
    const pending=await session(),started=await start(pending),h=await sqlSession(pending),before=await counts(pending);
    await admin.query("UPDATE import_execution_groups SET plan_encrypted='invalid',version=version+1 WHERE session_id=$1",[h.id]);
    const failed=await advance(pending,started.operation.version);expect(failed.operation.state).toBe('REVIEW_REQUIRED');expect((await counts(pending)).identities).toBe(before.identities);
    const s=await session(),op=await start(s);await advance(s,op.operation.version);const done=await sqlSession(s);
    await admin.query("UPDATE import_execution_receipts SET receipt_encrypted='invalid' WHERE session_id=$1",[done.id]);
    await expect(status(s)).rejects.toMatchObject({code:'IDENTITY_LOOKUP_INTEGRITY_ERROR'});
  });
  check('oversized valid dependency component is refused atomically instead of split across unsafe groups',async()=>{
    const drivers:any[]=[],trucks:any[]=[];
    for(let i=0;i<9;i++){
      drivers.push(await make('DRIVER'));trucks.push(await make('TRUCK'));
      for(const [kind,entity]of [['DRIVER',drivers[i]],['TRUCK',trucks[i]]] as const)await canonical.affiliation('admin',{...command(),kind,entityId:entity.externalId,carrierId:carrier,command:'SET_AFFILIATION'});
      await canonical.assignment('admin',{...command(),command:'ASSIGN',driverId:drivers[i].externalId,truckId:trucks[i].externalId});
    }
    const rows=drivers.map((driver,i)=>{const r=row(i+1);r.entityResolutions.driver={matchedId:driver.externalId,recommendation:'ACCEPT',isAuthorized:true};r.entityResolutions.truck={matchedId:trucks[(i+1)%9].externalId,recommendation:'ACCEPT',isAuthorized:true};return r;});
    const s=await session(rows),before=await counts(s);await expect(start(s)).rejects.toMatchObject({code:'IMPORT_GROUP_BUDGET'});expect(await counts(s)).toEqual(before);
  });
  for(const kind of ['driver','truck'])check(`${kind} preparation cannot smuggle fields that the canonical creation contract forbids`,async()=>{
    const r=row();r.entityResolutions[kind][kind==='driver'?'preparedDriverPlan':'preparedTruckPlan'].forceCreate=true;
    const s=await session([r],{review:false}),before=await counts(s);await expect(service.preview('admin',scope,s.sessionId)).rejects.toMatchObject({code:'PREPARED_ENTITY_CONFLICT'});expect(await counts(s)).toEqual(before);
  });
  check('a source provider receipt with mismatched provenance cannot advance a session',async()=>{
    const bad=new SqlImportAuthority({...dependencies,sourceStore:{
      put:async(uow,id,bytes,proof)=>({...await sourceStore.put(uow,id,bytes,proof),sourceRevisionId:randomUUID()}),
      get:(uow,id,artifact)=>sourceStore.get(uow,id,artifact)}});
    const sessionId=`IMP-${randomUUID()}`;await bad.createSession('admin',scope,{sessionId,requestId:randomUUID(),expectedVersion:0,operationId:randomUUID(),importBatchId:'BATCH',sourceType:'CSV'});
    const bytes=Buffer.from('synthetic source');await expect(bad.attachSource('admin',scope,{sessionId,requestId:randomUUID(),expectedVersion:1,sourceRevisionId:randomUUID(),sourceType:'CSV',contentSha256:sha(bytes),metadata:{}},bytes)).rejects.toMatchObject({code:'SOURCE_PROVENANCE_REQUIRED'});
    const row=(await admin.query('SELECT version,source_artifact FROM import_sessions WHERE external_id=$1',[sessionId])).rows[0];expect(row).toMatchObject({version:'1',source_artifact:null});
  });
  check('archived project denies new group execution while retaining authorized recovery and cancellation',async()=>{
    const s=await session(),started=await start(s);await admin.query("UPDATE projects SET status='ARCHIVED' WHERE id=$1",[project]);
    try{
      await expect(advance(s,started.operation.version)).rejects.toMatchObject({code:'PROJECT_LIFECYCLE_MUTATION_DENIED',status:409});
      expect((await status(s)).receipts).toHaveLength(0);
      expect((await service.cancel('admin',scope,{sessionId:s.sessionId,operationId:s.operationId,requestId:randomUUID(),expectedVersion:started.operation.version})).state).toBe('CANCELLED');
    }finally{await admin.query("UPDATE projects SET status='SETUP' WHERE id=$1",[project]);}
  });
  check('server-internal project aliases never replace the canonical external ID in a checkpoint',async()=>{
    const sessionId=`IMP-${randomUUID()}`,alias={companyId:company,projectId:project};
    await service.createSession('admin',alias,{sessionId,requestId:randomUUID(),expectedVersion:0,operationId:randomUUID(),importBatchId:'BATCH',sourceType:'CSV'});
    expect((await service.readCheckpoint('admin',scope,sessionId)).projectId).toBe(scope.projectId);
  });
  check('a terminal label without committed groups and receipts never becomes successful status truth',async()=>{
    const s=await session();await start(s);const h=await sqlSession(s);
    await admin.query("UPDATE import_executions SET state='COMPLETED',version=version+1 WHERE session_id=$1",[h.id]);
    await expect(status(s)).rejects.toMatchObject({code:'IMPORT_JOURNAL_INCONSISTENT'});
  });
  check('migration 007 repeat and checksum protection retain all published versions',async()=>{
    expect((await applyMigrations(migrator)).verified).toEqual(['001','002','003','004','005','006','007','008','009','010','011','012']);expect(await verifyMigrations(migrator)).toMatchObject({allValid:true,appliedCount:12});
    await admin.query("UPDATE schema_migrations SET checksum='tampered' WHERE version='007'");try{await expect(applyMigrations(migrator)).rejects.toThrow('checksum mismatch');}
    finally{await admin.query("UPDATE schema_migrations SET checksum=$1 WHERE version='007'",[loadMigrationFiles()[6].checksum]);}
  });
});
