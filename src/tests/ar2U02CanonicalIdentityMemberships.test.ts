import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { randomBytes, randomUUID } from 'node:crypto';
import pg, { type Pool } from 'pg';
import { SqlCanonicalAuthority, type CreateCanonicalCommand } from '../db/canonicalAuthority.js';
import { identitySpec } from '../db/canonicalIdentityRepository.js';
import { applyMigrations, loadMigrationFiles, verifyMigrations } from '../db/migrator.js';
import { withUnitOfWork } from '../db/unitOfWork.js';
import { GLOBAL_IDENTITIES, type GlobalKind } from '../utils/globalIdentityPolicy';

if (process.env.QSA_TEST_DATABASE_ISOLATED !== '1' || !process.env.TEST_DATABASE_URL) throw new Error('Explicit isolated PostgreSQL fixture required');
const requiredPool = (variable: string, max = 4) => {
  if (!process.env[variable]) throw new Error(`${variable} required`);
  return new pg.Pool({ connectionString:process.env[variable],max });
};
const kinds = ['DRIVER','TRUCK','CARRIER','MATERIAL'] as const;

describe('AR2-U02 real PostgreSQL 17 canonical authorities', () => {
  const admin = requiredPool('TEST_DATABASE_URL'), runtime = requiredPool('DATABASE_URL',8);
  const auth = requiredPool('AUTH_DATABASE_URL'), migrator = requiredPool('MIGRATION_DATABASE_URL');
  const company = randomUUID(), otherCompany = randomUUID(), project = randomUUID(), second = randomUUID(), foreign = randomUUID();
  const actor = randomUUID(), manager = randomUUID(), viewer = randomUUID();
  const externalProject = `Q-PRJ-${randomUUID()}`, externalSecond = `Q-PRJ-${randomUUID()}`;
  const identities = { admin:`fb-${actor}`,manager:`fb-${manager}`,viewer:`fb-${viewer}` };
  const verifier = async (token: string) => {
    if (!Object.hasOwn(identities,token)) throw new Error('invalid token');
    return { uid:identities[token as keyof typeof identities],role:'SUPER_ADMIN',companyId:otherCompany };
  };
  const authority = new SqlCanonicalAuthority({ runtimePool:runtime,authPool:auth,verifyToken:verifier });
  const savedSecrets = Object.fromEntries(['QSA_IDENTITY_HMAC_KEY','QSA_IDENTITY_ENCRYPTION_KEY','QSA_IDENTITY_KEY_VERSION'].map(k=>[k,process.env[k]]));
  let sequence = 100000;
  const scope = {companyId:company,projectId:externalProject};
  const command = () => ({...scope,operationId:randomUUID()});
  const input = (kind: GlobalKind, extra: Partial<CreateCanonicalCommand> = {}): CreateCanonicalCommand => {
    const next = ++sequence;
    return {...command(),kind,naturalKey: kind==='DRIVER' ? `2${String(next).padStart(9,'0')}`
      : kind==='CARRIER' ? `1${String(next).padStart(9,'0')}` : kind==='TRUCK' ? `ا ب ج ${next}` : `AGG ${next}`,
    profile:kind==='DRIVER' ? {fullNameAr:'سائق التحقق',phone:'٠٥٥١٢٣٤٥٦٧'} : kind==='TRUCK'
      ? {truckType:'DUMPER',tareWeightKg:12000,maxGrossWeightKg:40000}
      : kind==='CARRIER' ? {nameAr:'شركة التحقق'} : {nameAr:'مادة التحقق',unitOfMeasure:'TON'},...extra};
  };
  const enroll = (kind: GlobalKind, entityId: string, extra: Record<string,any> = {}) => authority.membership('admin',
    {...command(),kind,entityId,command:'ENROLL',expectedRevision:0,...extra});
  const count = async (table: string, predicate: string, values: unknown[]) => Number((await admin.query(`SELECT count(*) FROM ${table} WHERE ${predicate}`,values)).rows[0].count);

  beforeAll(async () => {
    process.env.QSA_IDENTITY_HMAC_KEY = randomBytes(32).toString('hex');
    process.env.QSA_IDENTITY_ENCRYPTION_KEY = randomBytes(32).toString('hex');
    process.env.QSA_IDENTITY_KEY_VERSION = 'u02-test';
    expect((await admin.query('SHOW server_version')).rows[0].server_version).toMatch(/^17\./);
    await applyMigrations(migrator);
    await admin.query(`INSERT INTO companies(id,slug,name,status) VALUES
      ($1::uuid,$1::uuid::text,'U02 A','ACTIVE'),($2::uuid,$2::uuid::text,'U02 B','ACTIVE')`,[company,otherCompany]);
    await admin.query(`INSERT INTO projects(id,company_id,external_id,name,status) VALUES
      ($1,$2,$3,'U02 A','ACTIVE'),($4,$2,$5,'U02 A2','APPROVED'),($6,$7,$8,'U02 B','ACTIVE')`,
    [project,company,externalProject,second,externalSecond,foreign,otherCompany,`Q-PRJ-${foreign}`]);
    for (const [id,uid,role] of [[actor,identities.admin,'SUPER_ADMIN'],[manager,identities.manager,'PROJECT_ADMIN'],[viewer,identities.viewer,'VIEWER']]) {
      await admin.query("INSERT INTO users(id,firebase_uid,status) VALUES($1,$2,'ACTIVE')",[id,uid]);
      await admin.query("INSERT INTO user_company_roles(id,company_id,user_id,role,status) VALUES($1,$2,$3,$4,'ACTIVE')",[randomUUID(),company,id,role]);
    }
    await admin.query("INSERT INTO user_company_roles(id,company_id,user_id,role,status) VALUES($1,$2,$3,'SUPER_ADMIN','ACTIVE')",[randomUUID(),otherCompany,actor]);
    await admin.query("INSERT INTO project_access(id,company_id,project_id,user_id,role,status) VALUES($1,$2,$3,$4,'PROJECT_ADMIN','ACTIVE')",[randomUUID(),company,project,manager]);
  });

  afterAll(async () => {
    for (const [key,value] of Object.entries(savedSecrets)) { if (value === undefined) delete process.env[key]; else process.env[key]=value; }
    await Promise.all([admin.end(),runtime.end(),auth.end(),migrator.end()]);
  });

  for (const kind of kinds) {
    it(`${kind}: creates, normalizes, resolves and reuses one identity in two projects`, async () => {
      const request = input(kind);
      const first = await authority.create('admin',request);
      expect(first.created).toBe(true);
      expect(first.identity.externalId).not.toBe(request.naturalKey);
      expect(first.identity[GLOBAL_IDENTITIES[kind].id]).toBe(first.identity.externalId);
      expect(first.identity.version).toBe(first.identity.revision);
      expect(first.identity.id).toMatch(/^[0-9a-f-]{36}$/);
      const variant = kind==='DRIVER' ? request.naturalKey.replace(/[0-9]/g,d=>'٠١٢٣٤٥٦٧٨٩'[Number(d)])
        : kind==='MATERIAL' ? request.naturalKey.toLowerCase() : request.naturalKey;
      expect((await authority.resolve('admin',scope,kind,variant))?.id).toBe(first.identity.id);
      const reused = await authority.create('admin',{...request,projectId:externalSecond,operationId:randomUUID(),naturalKey:variant});
      expect(reused.identity.id).toBe(first.identity.id); expect(reused.created).toBe(false);
      const one = await enroll(kind,first.identity.externalId);
      const two = await enroll(kind,first.identity.externalId,{projectId:externalSecond});
      expect(one.membership.projectId).toBe(externalProject);
      expect(two.membership.projectId).toBe(externalSecond);
      expect(one.membership[GLOBAL_IDENTITIES[kind].id]).toBe(first.identity.externalId);
      expect(await count(identitySpec(kind).table,'company_id=$1 AND id=$2',[company,first.identity.id])).toBe(1);
      expect(await count(identitySpec(kind).member,`company_id=$1 AND ${identitySpec(kind).field}=$2`,[company,first.identity.id])).toBe(2);
    });

    it(`${kind}: concurrent creation across projects yields one canonical row and one creation event`, async () => {
      const request = input(kind);
      const results = await Promise.all(Array.from({length:10},(_,i)=>authority.create('admin',{
        ...request,operationId:randomUUID(),projectId:i%2 ? externalProject:externalSecond })));
      expect(new Set(results.map(r=>r.identity.id)).size).toBe(1);
      expect(results.filter(r=>r.created)).toHaveLength(1);
      const entity = results[0].identity;
      expect(await count(identitySpec(kind).table,'company_id=$1 AND id=$2',[company,entity.id])).toBe(1);
      expect(await count('audit_events',"company_id=$1 AND entity_id=$2 AND action='CANONICAL_IDENTITY_CREATED'",[company,entity.externalId])).toBe(1);
      expect(await count('outbox_events',"company_id=$1 AND aggregate_id=$2 AND event_type='CANONICAL_IDENTITY_CREATED'",[company,entity.externalId])).toBe(1);
    });

    it(`${kind}: membership lifecycle preserves provenance, history and strict no-ops`, async () => {
      const entity = (await authority.create('admin',input(kind))).identity;
      const first = await enroll(kind,entity.externalId);
      const duplicate = await enroll(kind,entity.externalId);
      expect(duplicate.idempotent).toBe(true); expect(duplicate.membership).toEqual(first.membership);
      let member = first.membership;
      for (const [action,status] of [['SUSPEND','SUSPENDED'],['REMOVE','REMOVED'],['REACTIVATE','ACTIVE']] as const) {
        const result = await authority.membership('admin',{...command(),kind,entityId:entity.externalId,command:action,
          expectedRevision:member.revision,reason:'approved change'});
        expect(result.membership.status).toBe(status);
        expect(result.membership.createdBy).toBe(actor); expect(result.membership.updatedBy).toBe(actor);
        expect(result.membership.createdAt).toBe(first.membership.createdAt);
        member = result.membership;
      }
      const history = (await admin.query(`SELECT revision,previous_status,status,actor_id,actor_role,previous_period FROM ${identitySpec(kind).member}_history WHERE membership_id=$1 ORDER BY revision`,[member.id])).rows;
      expect(history.map(r=>r.status)).toEqual(['ACTIVE','SUSPENDED','REMOVED','ACTIVE']);
      expect(history.every(r=>r.actor_id===actor)).toBe(true);
      expect(history.every(r=>r.actor_role==='SUPER_ADMIN')).toBe(true);
      expect(history[1].previous_period).not.toContain(',)');
      expect((await authority.operationalIdentity('admin',scope,kind,entity.externalId)).id).toBe(entity.id);
    });

    it(`${kind}: rejects invalid transitions, stale revisions and missing membership`, async () => {
      const entity = (await authority.create('admin',input(kind))).identity;
      await expect(authority.membership('admin',{...command(),kind,entityId:entity.externalId,command:'REACTIVATE',expectedRevision:0})).rejects.toMatchObject({code:'MEMBERSHIP_NOT_FOUND'});
      await enroll(kind,entity.externalId);
      await expect(authority.membership('admin',{...command(),kind,entityId:entity.externalId,command:'SUSPEND',expectedRevision:0})).rejects.toMatchObject({code:'REVISION_CONFLICT'});
      await authority.membership('admin',{...command(),kind,entityId:entity.externalId,command:'REMOVE',expectedRevision:1});
      await expect(authority.membership('admin',{...command(),kind,entityId:entity.externalId,command:'SUSPEND',expectedRevision:2})).rejects.toMatchObject({code:'INVALID_STATE_TRANSITION'});
      await expect(enroll(kind,entity.externalId)).rejects.toMatchObject({code:'MEMBERSHIP_STATE_CONFLICT'});
    });

    it(`${kind}: concurrent enrollment is unique and stale competing changes cannot both commit`, async () => {
      const entity = (await authority.create('admin',input(kind))).identity;
      const results = await Promise.all(Array.from({length:8},()=>enroll(kind,entity.externalId)));
      expect(results.filter(r=>!r.idempotent)).toHaveLength(1);
      const changes = await Promise.allSettled(['SUSPEND','REMOVE'].map(action=>authority.membership('admin',{
        ...command(),kind,entityId:entity.externalId,command:action as 'SUSPEND'|'REMOVE',expectedRevision:1})));
      expect(changes.filter(r=>r.status==='fulfilled')).toHaveLength(1);
      expect(await count(identitySpec(kind).member,`company_id=$1 AND project_id=$2 AND ${identitySpec(kind).field}=$3`,[company,project,entity.id])).toBe(1);
      expect(await count(`${identitySpec(kind).member}_history`,'membership_id=$1',[results[0].membership.id])).toBe(2);
    });

    it(`${kind}: PostgreSQL rejects duplicate keys even when the service precheck is bypassed`,async()=>{
      const entity = (await authority.create('admin',input(kind))).identity;
      const {table} = identitySpec(kind);
      await expect(withUnitOfWork({companyId:company,actorId:actor,projectId:project},uow=>uow.query(
        `INSERT INTO ${table} SELECT (jsonb_populate_record(NULL::${table},to_jsonb(t)||
          jsonb_build_object('id',$2::uuid,'external_id',$3::text))).* FROM ${table} t WHERE id=$1`,
        [entity.id,randomUUID(),`COPY-${randomUUID()}`]),runtime)).rejects.toMatchObject({code:'23505'});
    });

    for (const status of GLOBAL_IDENTITIES[kind].statuses.filter(s=>s!=='ACTIVE')) {
      it(`${kind}: ${status} preserves meaning and blocks enroll, reactivate and operational use`, async () => {
        const entity = (await authority.create('admin',input(kind))).identity;
        await enroll(kind,entity.externalId);
        await authority.setStatus('admin',{...command(),kind,entityId:entity.externalId,status,expectedRevision:0});
        expect((await authority.resolve('admin',scope,kind,entity.profile[GLOBAL_IDENTITIES[kind].natural]))?.status).toBe(status);
        await expect(enroll(kind,entity.externalId,{projectId:externalSecond})).rejects.toMatchObject({code:'GLOBAL_ENTITY_INELIGIBLE'});
        await expect(authority.operationalIdentity('admin',scope,kind,entity.externalId)).rejects.toMatchObject({code:'GLOBAL_ENTITY_INELIGIBLE'});
        await authority.membership('admin',{...command(),kind,entityId:entity.externalId,command:'SUSPEND',expectedRevision:1});
        await expect(authority.membership('admin',{...command(),kind,entityId:entity.externalId,command:'REACTIVATE',expectedRevision:2})).rejects.toMatchObject({code:'GLOBAL_ENTITY_INELIGIBLE'});
        await authority.membership('admin',{...command(),kind,entityId:entity.externalId,command:'REMOVE',expectedRevision:2});
      });
    }
  }

  it('keeps identical natural identities isolated across companies', async () => {
    const request = input('DRIVER');
    const a = (await authority.create('admin',request)).identity;
    const b = (await authority.create('admin',{...request,companyId:otherCompany,projectId:foreign,operationId:randomUUID()})).identity;
    expect(a.id).not.toBe(b.id);
    await expect(enroll('DRIVER',b.id)).rejects.toMatchObject({code:'GLOBAL_ENTITY_NOT_FOUND'});
    expect((await authority.resolve('admin',scope,'DRIVER',request.naturalKey))?.id).toBe(a.id);
    await expect(authority.create('admin',{...input('MATERIAL'),projectId:foreign})).rejects.toMatchObject({code:'PROJECT_NOT_FOUND'});
  });

  it.each(kinds)('%s rejects invalid natural keys',async kind=>{
    await expect(authority.create('admin',input(kind,{naturalKey:kind==='TRUCK' ? '' : '!'}))).rejects.toMatchObject({code:'INVALID_NATURAL_KEY'});
  });

  it('blocks injected role/tenant authority and unverified tokens',async()=>{
    await expect(authority.create('bad-token',input('DRIVER'))).rejects.toMatchObject({code:'INVALID_TOKEN'});
    await expect(authority.create('admin',{...input('MATERIAL'),role:'SUPER_ADMIN'} as any)).rejects.toMatchObject({code:'INVALID_PARTICIPATION_COMMAND'});
    await expect(authority.create('viewer',input('MATERIAL'))).rejects.toMatchObject({code:'FORBIDDEN_GLOBAL_COMMAND'});
    await authority.create('manager',input('MATERIAL'));
    await expect(authority.create('manager',input('MATERIAL',{projectId:externalSecond}))).rejects.toMatchObject({code:'FORBIDDEN_GLOBAL_COMMAND'});
    await expect(authority.create('manager',input('MATERIAL',{companyId:otherCompany,projectId:foreign}))).rejects.toMatchObject({code:'NO_ACTIVE_COMPANY_ROLE'});
  });

  it('checks governance role and optimistic global revision',async()=>{
    const entity = (await authority.create('admin',input('DRIVER'))).identity;
    const change = {...command(),kind:'DRIVER' as const,entityId:entity.externalId,status:'SUSPENDED',expectedRevision:0};
    await expect(authority.setStatus('manager',change)).rejects.toMatchObject({code:'FORBIDDEN_GLOBAL_COMMAND'});
    await authority.setStatus('admin',change);
    await expect(authority.setStatus('admin',{...change,operationId:randomUUID(),status:'ACTIVE'})).rejects.toMatchObject({code:'REVISION_CONFLICT'});
  });

  it('preserves an existing external ID and rejects conflicting natural/external/source mappings',async()=>{
    const externalId = `CAR-${randomBytes(16).toString('hex')}`;
    const request = input('CARRIER',{externalId,source:{legacyId:externalId,firestorePath:`carriers/${externalId}`}});
    const first = await authority.create('admin',request);
    expect(first.identity.externalId).toBe(externalId);
    expect((await authority.resolveLegacy('admin',scope,'CARRIER',request.source!))?.externalId).toBe(externalId);
    await expect(authority.create('admin',input('CARRIER',{externalId}))).rejects.toMatchObject({code:'CANONICAL_IDENTITY_CONFLICT'});
    await expect(authority.create('admin',input('CARRIER',{source:request.source}))).rejects.toMatchObject({code:'IDENTITY_LOOKUP_INTEGRITY_ERROR'});
    await expect(authority.create('admin',{...request,operationId:randomUUID(),externalId:`CAR-${randomUUID()}`})).rejects.toMatchObject({code:'IDENTITY_LOOKUP_INTEGRITY_ERROR'});
    await expect(authority.create('admin',input('CARRIER',{externalId:first.identity.id}))).rejects.toMatchObject({code:'IDENTITY_LOOKUP_INTEGRITY_ERROR'});
  });

  it('replays membership and global-status responses without duplicate audit, history or jobs',async()=>{
    const entity = (await authority.create('admin',input('MATERIAL'))).identity;
    const operationId = randomUUID();
    const changes = await Promise.all(Array.from({length:6},()=>enroll('MATERIAL',entity.externalId,{operationId})));
    expect(changes.every(r=>JSON.stringify(r)===JSON.stringify(changes[0]))).toBe(true);
    expect(await count('audit_events','operation_id=$1',[operationId])).toBe(1);
    expect(await count('project_materials_history','operation_id=$1',[operationId])).toBe(1);
    expect(await count('outbox_events',"payload->>'operationId'=$1",[operationId])).toBe(1);
    await expect(enroll('MATERIAL',entity.externalId,{operationId,reason:'changed'})).rejects.toMatchObject({code:'IDEMPOTENCY_PAYLOAD_MISMATCH'});
    const status = {...command(),kind:'MATERIAL' as const,entityId:entity.externalId,status:'INACTIVE',expectedRevision:0};
    expect(await authority.setStatus('admin',status)).toEqual(await authority.setStatus('admin',status));
    expect(await count('audit_events','operation_id=$1',[status.operationId])).toBe(1);
    const audit = (await admin.query('SELECT actor_id,actor_role FROM audit_events WHERE operation_id=$1',[status.operationId])).rows[0];
    expect(audit).toEqual({actor_id:actor,actor_role:'SUPER_ADMIN'});
  });

  it('denies expired company roles and expired project access',async()=>{
    await admin.query("UPDATE user_company_roles SET valid_to=clock_timestamp()-interval '1 second' WHERE user_id=$1",[manager]);
    try { await expect(authority.create('manager',input('MATERIAL'))).rejects.toMatchObject({code:'NO_ACTIVE_COMPANY_ROLE'}); }
    finally { await admin.query('UPDATE user_company_roles SET valid_to=NULL WHERE user_id=$1',[manager]); }
    await admin.query("UPDATE project_access SET valid_period=tstzrange('2020-01-01','2021-01-01','[)') WHERE user_id=$1",[manager]);
    try { await expect(authority.create('manager',input('MATERIAL'))).rejects.toMatchObject({code:'FORBIDDEN_GLOBAL_COMMAND'}); }
    finally { await admin.query("UPDATE project_access SET valid_period=tstzrange(clock_timestamp(),NULL,'[)') WHERE user_id=$1",[manager]); }
  });

  it('rechecks account revocation after initial authentication inside the domain transaction',async()=>{
    let revoked = false;
    const hooked = {query:async (...args: any[])=>{
      const result = await (auth.query as any)(...args);
      if (!revoked && String(args[0]).includes('SELECT pa.project_id')) {
        revoked=true; await admin.query("UPDATE users SET status='SUSPENDED' WHERE id=$1",[manager]);
      }
      return result;
    }} as unknown as Pool;
    const service = new SqlCanonicalAuthority({runtimePool:runtime,authPool:hooked,verifyToken:verifier});
    try { await expect(service.create('manager',input('MATERIAL'))).rejects.toMatchObject({code:'ACCOUNT_NOT_ACTIVE',status:403}); }
    finally { await admin.query("UPDATE users SET status='ACTIVE' WHERE id=$1",[manager]); }
  });

  it('holds authority row locks until transaction completion',async()=>{
    const client = await runtime.connect(), revoke = await admin.connect();
    try {
      await client.query('BEGIN');
      await client.query("SELECT set_config('app.company_id',$1,true),set_config('app.project_id',$2,true),set_config('app.actor_id',$3,true)",[company,project,actor]);
      await client.query('SELECT * FROM qsa_authorize_canonical_command(false)');
      await revoke.query("SET lock_timeout='150ms'");
      await expect(revoke.query("UPDATE users SET status='SUSPENDED' WHERE id=$1",[actor])).rejects.toMatchObject({code:'55P03'});
    } finally { await client.query('ROLLBACK'); await client.query('DISCARD ALL');client.release();await revoke.query('RESET lock_timeout');revoke.release(); }
  });

  it('protects PII with keyed lookups and authenticated encryption, including legacy mappings and receipts',async()=>{
    const request = input('DRIVER'); request.source={legacyId:request.naturalKey,firestorePath:`drivers/${request.naturalKey}`};
    const entity = (await authority.create('admin',request)).identity;
    expect((await authority.resolveLegacy('admin',scope,'DRIVER',request.source))?.externalId).toBe(entity.externalId);
    const row = (await admin.query('SELECT * FROM drivers WHERE id=$1',[entity.id])).rows[0];
    expect(row.identity_key_hmac).toHaveLength(32); expect(row.name).toBe(entity.externalId);
    const data = await admin.query(`SELECT row_to_json(x)::text AS raw FROM (
      SELECT profile_encrypted AS value FROM drivers WHERE id=$1 UNION ALL
      SELECT source_encrypted FROM legacy_identity_mappings WHERE company_id=$2 AND target_external_id=$3 UNION ALL
      SELECT result_encrypted FROM idempotency_receipts WHERE operation_id=$4) x`,[entity.id,company,entity.externalId,request.operationId]);
    for (const result of data.rows) {
      expect(result.raw).not.toContain(request.naturalKey);
      expect(result.raw).not.toContain('سائق التحقق');
      expect(result.raw).not.toContain('0551234567');
    }
    const lookup = (await admin.query('SELECT * FROM identity_keys WHERE company_id=$1 AND target_external_id=$2',[company,entity.externalId])).rows[0];
    expect(lookup.key_hmac.equals(row.natural_key_hmac)).toBe(true);
  });

  it('fails closed for missing secrets and accidental key replacement without creating duplicates',async()=>{
    const request = input('DRIVER');
    const entity = (await authority.create('admin',request)).identity;
    const previous = process.env.QSA_IDENTITY_HMAC_KEY!;
    try {
      delete process.env.QSA_IDENTITY_HMAC_KEY;
      await expect(authority.create('admin',input('DRIVER'))).rejects.toMatchObject({code:'IDENTITY_SECRET_UNAVAILABLE'});
      process.env.QSA_IDENTITY_HMAC_KEY=randomBytes(32).toString('hex');
      await expect(authority.create('admin',{...request,operationId:randomUUID()})).rejects.toMatchObject({code:'IDENTITY_RECONCILIATION_REQUIRED'});
    } finally { process.env.QSA_IDENTITY_HMAC_KEY=previous; }
    expect(await count('drivers','company_id=$1 AND id=$2',[company,entity.id])).toBe(1);
  });

  it('requires a distinct strong encryption secret and detects ciphertext tampering',async()=>{
    const previous = process.env.QSA_IDENTITY_ENCRYPTION_KEY!;
    try {
      delete process.env.QSA_IDENTITY_ENCRYPTION_KEY;
      await expect(authority.create('admin',input('DRIVER'))).rejects.toMatchObject({code:'IDENTITY_SECRET_UNAVAILABLE'});
      process.env.QSA_IDENTITY_ENCRYPTION_KEY=process.env.QSA_IDENTITY_HMAC_KEY;
      await expect(authority.create('admin',input('DRIVER'))).rejects.toMatchObject({code:'IDENTITY_SECRET_UNAVAILABLE'});
    } finally { process.env.QSA_IDENTITY_ENCRYPTION_KEY=previous; }
    const request = input('DRIVER'), entity = (await authority.create('admin',request)).identity;
    await admin.query("UPDATE drivers SET profile_encrypted=profile_encrypted||'corrupted' WHERE id=$1",[entity.id]);
    await expect(authority.resolve('admin',scope,'DRIVER',request.naturalKey)).rejects.toMatchObject({code:'IDENTITY_LOOKUP_INTEGRITY_ERROR'});
  });

  it('replays lost responses exactly once and rejects payload or actor changes',async()=>{
    const request = input('CARRIER');
    const results = await Promise.all(Array.from({length:8},()=>authority.create('admin',request)));
    expect(results.every(result=>JSON.stringify(result)===JSON.stringify(results[0]))).toBe(true);
    expect(await count('audit_events','operation_id=$1',[request.operationId])).toBe(1);
    expect(await count('idempotency_receipts','operation_id=$1',[request.operationId])).toBe(1);
    await expect(authority.create('admin',{...request,profile:{nameAr:'different'}})).rejects.toMatchObject({code:'IDEMPOTENCY_PAYLOAD_MISMATCH'});
    await expect(authority.create('manager',request)).rejects.toMatchObject({code:'IDEMPOTENCY_PAYLOAD_MISMATCH'});
  });

  it('rolls back membership, history, audit, receipt and outbox on a real database staging failure',async()=>{
    const entity = (await authority.create('admin',input('MATERIAL'))).identity;
    const operationId = randomUUID();
    await admin.query(`CREATE FUNCTION public.u02_test_abort() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN IF NEW.aggregate_id='${entity.externalId}' AND NEW.event_type='MEMBERSHIP_ENROLL' THEN
      RAISE EXCEPTION 'U02_TEST_STAGING_FAILURE'; END IF; RETURN NEW; END $$`);
    await admin.query('CREATE TRIGGER u02_test_abort BEFORE INSERT ON outbox_events FOR EACH ROW EXECUTE FUNCTION public.u02_test_abort()');
    try {
      await expect(enroll('MATERIAL',entity.externalId,{operationId})).rejects.toMatchObject({code:'SQL_AUTHORITY_UNAVAILABLE'});
      expect(await count('project_materials','company_id=$1 AND material_id=$2',[company,entity.id])).toBe(0);
      expect(await count('project_materials_history','operation_id=$1',[operationId])).toBe(0);
      expect(await count('audit_events','operation_id=$1',[operationId])).toBe(0);
      expect(await count('idempotency_receipts','operation_id=$1',[operationId])).toBe(0);
    } finally { await admin.query('DROP TRIGGER u02_test_abort ON outbox_events');await admin.query('DROP FUNCTION public.u02_test_abort()'); }
  });

  it('rejects dependent temporal consequences without rewriting U03 relationships',async()=>{
    const entities = Object.fromEntries(await Promise.all(kinds.map(async kind=>[kind,(await authority.create('admin',input(kind))).identity])));
    for (const kind of kinds) await enroll(kind,entities[kind].externalId);
    await admin.query(`INSERT INTO driver_carrier_affiliations(id,company_id,project_id,driver_id,carrier_id,valid_period,record_status)
      VALUES($1,$2,$3,$4,$5,tstzrange(clock_timestamp(),NULL,'[)'),'ACCEPTED')`,[randomUUID(),company,project,entities.DRIVER.id,entities.CARRIER.id]);
    await admin.query(`INSERT INTO driver_truck_assignments(id,company_id,project_id,driver_id,truck_id,valid_period,record_status)
      VALUES($1,$2,$3,$4,$5,tstzrange(clock_timestamp(),NULL,'[)'),'ACCEPTED')`,[randomUUID(),company,project,entities.DRIVER.id,entities.TRUCK.id]);
    await admin.query(`INSERT INTO truck_material_allocations(id,company_id,project_id,truck_id,material_id,valid_period,record_status)
      VALUES($1,$2,$3,$4,$5,tstzrange(clock_timestamp(),NULL,'[)'),'ACCEPTED')`,[randomUUID(),company,project,entities.TRUCK.id,entities.MATERIAL.id]);
    const sql = 'SELECT row_to_json(a) AS row FROM driver_truck_assignments a WHERE driver_id=$1';
    const before = (await admin.query(sql,[entities.DRIVER.id])).rows;
    for (const kind of kinds) await expect(authority.membership('admin',{...command(),kind,entityId:entities[kind].externalId,
      command:'REMOVE',expectedRevision:1})).rejects.toMatchObject({code:'DEPENDENT_RELATIONSHIPS_ACTIVE'});
    expect((await admin.query(sql,[entities.DRIVER.id])).rows).toEqual(before);
  });

  it('retains unresolved legacy INACTIVE membership and rejects ambiguous commands',async()=>{
    const entity = (await authority.create('admin',input('MATERIAL'))).identity;
    await admin.query("INSERT INTO project_materials(id,company_id,project_id,material_id,status) VALUES($1,$2,$3,$4,'INACTIVE')",[randomUUID(),company,project,entity.id]);
    await expect(authority.membership('admin',{...command(),kind:'MATERIAL',entityId:entity.externalId,command:'REACTIVATE',expectedRevision:0})).rejects.toMatchObject({code:'PERSISTENCE_BOUNDARY_INVALID'});
    expect(await count('project_materials',"material_id=$1 AND status='INACTIVE'",[entity.id])).toBe(1);
  });

  it('preserves ended relationship history and guards future accepted dependencies',async()=>{
    for (const future of [false,true]) {
      const driver = (await authority.create('admin',input('DRIVER'))).identity;
      const truck = (await authority.create('admin',input('TRUCK'))).identity;
      await enroll('DRIVER',driver.externalId);
      const period = future ? '[2040-01-01,2041-01-01)' : '[2020-01-01,2021-01-01)';
      const assignment = randomUUID();
      await admin.query(`INSERT INTO driver_truck_assignments(id,company_id,project_id,driver_id,truck_id,valid_period,record_status)
        VALUES($1,$2,$3,$4,$5,$6::tstzrange,'ACCEPTED')`,[assignment,company,project,driver.id,truck.id,period]);
      const sql = 'SELECT row_to_json(a) AS row FROM driver_truck_assignments a WHERE id=$1';
      const before = (await admin.query(sql,[assignment])).rows;
      const change = authority.membership('admin',{...command(),kind:'DRIVER',entityId:driver.externalId,command:'REMOVE',expectedRevision:1});
      if (future) await expect(change).rejects.toMatchObject({code:'DEPENDENT_RELATIONSHIPS_ACTIVE'});
      else expect((await change).membership.status).toBe('REMOVED');
      expect((await admin.query(sql,[assignment])).rows).toEqual(before);
    }
  });

  it('fails closed on unreconciled identity provenance and corrupt lookup targets',async()=>{
    const id = randomUUID();
    await admin.query("INSERT INTO carriers(id,company_id,external_id,name,status) VALUES($1,$2,$3,'Legacy','ACTIVE')",[id,company,`CAR-${id}`]);
    try { await expect(authority.create('admin',input('CARRIER'))).rejects.toMatchObject({code:'IDENTITY_RECONCILIATION_REQUIRED'}); }
    finally { await admin.query('DELETE FROM carriers WHERE id=$1',[id]); }
    const a = (await authority.create('admin',input('DRIVER'))).identity;
    const b = (await authority.create('admin',input('DRIVER'))).identity;
    await expect(admin.query('UPDATE identity_keys SET target_external_id=$1 WHERE company_id=$2 AND target_external_id=$3',[b.externalId,company,a.externalId])).rejects.toThrow('IDENTITY_LOOKUP_INTEGRITY_ERROR');
    await admin.query("UPDATE identity_keys SET verification_status='SUPERSEDED' WHERE company_id=$1 AND target_external_id=$2",[company,a.externalId]);
    await expect(authority.resolve('admin',scope,'DRIVER',a.profile.nationalId)).rejects.toMatchObject({code:'IDENTITY_LOOKUP_INTEGRITY_ERROR'});
  });

  it('enforces project lifecycle and effective membership periods',async()=>{
    const entity = (await authority.create('admin',input('TRUCK'))).identity;
    await enroll('TRUCK',entity.externalId);
    await admin.query("UPDATE projects SET status='ARCHIVED' WHERE id=$1",[project]);
    try {
      await expect(authority.create('admin',input('TRUCK'))).rejects.toMatchObject({code:'PROJECT_LIFECYCLE_MUTATION_DENIED'});
      await authority.membership('admin',{...command(),kind:'TRUCK',entityId:entity.externalId,command:'SUSPEND',expectedRevision:1});
    } finally { await admin.query("UPDATE projects SET status='ACTIVE' WHERE id=$1",[project]); }
    await authority.membership('admin',{...command(),kind:'TRUCK',entityId:entity.externalId,command:'REACTIVATE',expectedRevision:2});
    await admin.query("UPDATE project_trucks SET valid_period=tstzrange('2020-01-01','2021-01-01','[)') WHERE truck_id=$1",[entity.id]);
    await expect(authority.operationalIdentity('admin',scope,'TRUCK',entity.externalId)).rejects.toMatchObject({code:'ENTITY_MEMBERSHIP_NOT_ACTIVE'});
  });

  it('keeps runtime non-owner, enforces RLS/FKs, denies history mutation and role escalation',async()=>{
    expect((await runtime.query('SELECT * FROM drivers')).rowCount).toBe(0);
    const entity = (await authority.create('admin',input('MATERIAL'))).identity;
    const member = await enroll('MATERIAL',entity.externalId,{projectId:externalSecond});
    await withUnitOfWork({companyId:company,actorId:actor,projectId:project},async uow=>{
      expect((await uow.query('SELECT * FROM project_materials WHERE id=$1',[member.membership.id])).rowCount).toBe(0);
    },runtime);
    await expect(withUnitOfWork({companyId:otherCompany,actorId:actor,projectId:foreign},uow=>uow.query(`INSERT INTO project_materials
      (id,company_id,project_id,material_id,status) VALUES($1,$2,$3,$4,'ACTIVE')`,[randomUUID(),otherCompany,foreign,entity.id]),runtime)).rejects.toMatchObject({code:'23503'});
    await expect(runtime.query('DELETE FROM project_materials_history')).rejects.toMatchObject({code:'42501'});
    await expect(runtime.query('UPDATE identity_keys SET verification_status=\'SUPERSEDED\'')).rejects.toMatchObject({code:'42501'});
    for (const role of ['qsa_migrator','qsa_auth','qsa_command_authorizer']) await expect(runtime.query(`SET ROLE ${role}`)).rejects.toMatchObject({code:'42501'});
    const state = (await runtime.query(`SELECT current_user,current_setting('app.company_id',true) AS company,
      current_setting('app.project_id',true) AS project FROM pg_roles WHERE rolname=current_user AND NOT rolsuper AND NOT rolbypassrls`)).rows[0];
    expect(state.current_user).toBe('qsa_runtime');expect(state.company || '').toBe('');expect(state.project || '').toBe('');
    expect((await admin.query("SELECT rolcanlogin FROM pg_roles WHERE rolname='qsa_command_authorizer'")).rows[0].rolcanlogin).toBe(false);
  });

  it('repeats migration 004 safely and rejects checksum tampering',async()=>{
    expect((await applyMigrations(migrator)).verified).toEqual(['001','002','003','004','005','006']);
    expect(await verifyMigrations(migrator)).toMatchObject({allValid:true,appliedCount:6,pendingCount:0});
    await admin.query("UPDATE schema_migrations SET checksum='invalid' WHERE version='004'");
    try { await expect(applyMigrations(migrator)).rejects.toThrow('checksum mismatch'); }
    finally { await admin.query("UPDATE schema_migrations SET checksum=$1 WHERE version='004'",[loadMigrationFiles()[3].checksum]); }
  });
});
