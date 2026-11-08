import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { randomUUID } from 'crypto';
import { mkdtempSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import pg from 'pg';
import { applyMigrations, loadMigrationFiles, verifyMigrations } from '../db/migrator.js';
import { resolveUserAuthContext } from '../db/authAdapter.js';
import { withUnitOfWork } from '../db/unitOfWork.js';

if (process.env.QSA_TEST_DATABASE_ISOLATED !== '1' || !process.env.TEST_DATABASE_URL) {
  throw new Error('An explicitly isolated TEST_DATABASE_URL is required');
}

describe('AR2-U01-SG1 real PostgreSQL 17 authority boundary', () => {
  const admin = new pg.Pool({ connectionString: process.env.TEST_DATABASE_URL });
  const migrator = new pg.Pool({ connectionString: process.env.MIGRATION_DATABASE_URL });
  const runtime = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
  const auth = new pg.Pool({ connectionString: process.env.AUTH_DATABASE_URL });
  const workerUrl = new URL(process.env.DATABASE_URL!);
  workerUrl.username = 'qsa_worker';
  const worker = new pg.Pool({ connectionString: workerUrl.toString(), max: 1 });
  const a = randomUUID(), b = randomUUID(), pa = randomUUID(), pb = randomUUID();
  const actor = randomUUID(), uid = `sg1-${randomUUID()}`;
  const context = { companyId: a, actorId: actor, projectId: pa };
  let eventId: string;

  beforeAll(async () => {
    expect((await admin.query('SHOW server_version')).rows[0].server_version).toMatch(/^17\./);
    await applyMigrations(migrator);
    await admin.query(`INSERT INTO companies(id,slug,name,status) VALUES
      ($1::uuid,$1::uuid::text,'SG1 A','ACTIVE'),($2::uuid,$2::uuid::text,'SG1 B','ACTIVE')`, [a, b]);
    await admin.query(`INSERT INTO projects(id,company_id,external_id,name,status) VALUES
      ($1,$2,'SG1-A','A','ACTIVE'),($3,$4,'SG1-B','B','ACTIVE')`, [pa, a, pb, b]);
    await admin.query("INSERT INTO users(id,firebase_uid,status) VALUES($1,$2,'ACTIVE')", [actor, uid]);
    await admin.query(`INSERT INTO user_company_roles(id,company_id,user_id,role,status)
      VALUES($1,$2,$3,'PROJECT_OFFICER','ACTIVE')`, [randomUUID(), a, actor]);
    await admin.query(`INSERT INTO project_access(id,company_id,project_id,user_id,role,status)
      VALUES($1,$2,$3,$4,'OFFICER','ACTIVE')`, [randomUUID(), a, pa, actor]);
  });

  afterAll(async () => {
    await Promise.all([runtime.end(), auth.end(), worker.end(), migrator.end(), admin.end()]);
  });

  it('uses non-owner, non-superuser service logins without role memberships', async () => {
    for (const [pool, role] of [[runtime, 'qsa_runtime'], [auth, 'qsa_auth'], [worker, 'qsa_worker']] as const) {
      const result = await pool.query(`SELECT session_user, current_user, rolsuper, rolbypassrls, rolcreaterole,
        (SELECT count(*)::int FROM pg_class WHERE relnamespace='public'::regnamespace AND relowner=r.oid) AS owned,
        (SELECT count(*)::int FROM pg_auth_members WHERE member=r.oid) AS memberships
        FROM pg_roles r WHERE rolname=session_user`);
      expect(result.rows[0]).toMatchObject({ session_user: role, current_user: role,
        rolsuper: false, rolbypassrls: false, rolcreaterole: false, owned: 0, memberships: 0 });
    }
  });

  it('fails closed without tenant context', async () => {
    expect((await runtime.query('SELECT * FROM projects')).rows).toEqual([]);
    await expect(runtime.query(`INSERT INTO outbox_events(id,company_id,project_id,aggregate_type,
      aggregate_id,event_type,aggregate_version,payload) VALUES($1,$2,$3,'TRIP','X','X',1,'{}')`,
    [randomUUID(), a, pa])).rejects.toMatchObject({ code: '42501' });
  });

  it('limits reads to the authorized company', async () => {
    await withUnitOfWork(context, async uow => {
      expect((await uow.query('SELECT id FROM projects')).rows).toEqual([{ id: pa }]);
      expect((await uow.query('SELECT id FROM projects WHERE id=$1', [pb])).rowCount).toBe(0);
    }, runtime);
  });

  it('rejects cross-company outbox insertion and rolls back its receipt', async () => {
    const operation = randomUUID();
    await expect(withUnitOfWork(context, async uow => {
      await uow.checkOrAcquireIdempotency(operation, 'hash');
      await uow.stageOutbox({ companyId: b, projectId: pb, aggregateType: 'TRIP', aggregateId: 'X',
        eventType: 'X', aggregateVersion: 1, payload: {} });
    }, runtime)).rejects.toMatchObject({ code: '42501' });
    expect((await admin.query('SELECT * FROM idempotency_receipts WHERE operation_id=$1', [operation])).rowCount).toBe(0);
  });

  it.each(['companies', 'users', 'user_company_roles', 'schema_migrations', 'migration_runs', 'audit_events', 'worker_jobs'])(
    'denies runtime reading sensitive table %s', async table => {
      await expect(withUnitOfWork(context, uow => uow.query(`SELECT * FROM ${table}`), runtime))
        .rejects.toMatchObject({ code: '42501' });
    });

  it.each(['users', 'user_company_roles', 'project_access', 'schema_migrations', 'audit_events', 'worker_jobs'])(
    'denies runtime mutation of authority/history/worker table %s', async table => {
      await expect(withUnitOfWork(context, uow => uow.query(`DELETE FROM ${table}`), runtime))
        .rejects.toMatchObject({ code: '42501' });
    });

  it('keeps receipt, audit, outbox and pending-job creation atomic and authorized', async () => {
    eventId = await withUnitOfWork(context, async uow => {
      const operation = randomUUID();
      await uow.checkOrAcquireIdempotency(operation, 'hash');
      const id = await uow.stageOutbox({ projectId: pa, aggregateType: 'TRIP', aggregateId: 'SG1',
        eventType: 'SG1_EVENT', aggregateVersion: 1, payload: {} });
      await uow.recordAudit({ action: 'SG1', entityKind: 'TRIP', entityId: 'SG1', operationId: operation });
      await uow.commitIdempotency(operation, id);
      return id;
    }, runtime);
    expect((await admin.query('SELECT status,attempts FROM worker_jobs WHERE event_id=$1', [eventId])).rows)
      .toEqual([{ status: 'PENDING', attempts: 0 }]);
  });

  it('denies cross-company receipt reads, updates and company reassignment', async () => {
    const operation = randomUUID();
    await withUnitOfWork(context, uow => uow.checkOrAcquireIdempotency(operation, 'hash'), runtime);
    await withUnitOfWork({ companyId: b, actorId: actor, projectId: pb }, async uow => {
      expect((await uow.query('SELECT * FROM idempotency_receipts WHERE operation_id=$1', [operation])).rowCount).toBe(0);
      expect((await uow.query("UPDATE idempotency_receipts SET state='COMMITTED' WHERE operation_id=$1", [operation])).rowCount).toBe(0);
    }, runtime);
    await expect(withUnitOfWork(context, uow => uow.query(
      'UPDATE idempotency_receipts SET company_id=$1,project_id=$2 WHERE operation_id=$3',
      [b, pb, operation]), runtime)).rejects.toMatchObject({ code: '42501' });
  });

  it('denies queue insertion with another company event or forged delivery state', async () => {
    for (const [company, status] of [[b, 'PENDING'], [a, 'COMPLETED']]) {
      await expect(withUnitOfWork({ ...context, companyId: company }, uow => uow.query(
        'INSERT INTO worker_jobs(id,company_id,event_id,status) VALUES($1,$2,$3,$4)',
        [randomUUID(), company, eventId, status]), runtime)).rejects.toMatchObject({ code: '42501' });
    }
  });

  it('denies audit insertion for a forged actor or another company project', async () => {
    for (const [actorId, project] of [[randomUUID(), pa], [actor, pb]]) {
      await expect(withUnitOfWork(context, uow => uow.query(`INSERT INTO audit_events
        (id,company_id,project_id,actor_id,action,entity_kind,entity_id,operation_id)
        VALUES($1,$2,$3,$4,'SG1','TRIP','SG1','SG1')`, [randomUUID(), a, project, actorId]), runtime))
        .rejects.toMatchObject({ code: '42501' });
    }
  });

  it.each(['qsa_migrator', 'qsa_auth', 'qsa_worker', 'postgres'])(
    'rejects runtime escalation to %s', async role => {
      await expect(runtime.query(`SET ROLE ${role}`)).rejects.toMatchObject({ code: '42501' });
    });

  it('rejects DDL and migration history access through the runtime login', async () => {
    await expect(runtime.query('CREATE TABLE public.sg1_forbidden(id int)')).rejects.toMatchObject({ code: '42501' });
    await expect(applyMigrations(runtime)).rejects.toThrow();
  });

  it('rejects privileged credentials at the runtime and auth application boundaries', async () => {
    await expect(withUnitOfWork(context, async () => true, admin)).rejects.toThrow('Unsafe database identity');
    await expect(resolveUserAuthContext({ uid }, a, admin)).rejects.toThrow('Unsafe database identity');
  });

  it('resolves only SQL-backed identity, company and active commercial roles', async () => {
    const resolved = await resolveUserAuthContext({ uid, role: 'SUPER_ADMIN', companyId: b } as any, a, auth);
    expect(resolved).toMatchObject({ userId: actor, companyId: a, role: 'PROJECT_OFFICER', accessibleProjectIds: [pa] });
    await expect(resolveUserAuthContext({ uid }, b, auth)).rejects.toMatchObject({ code: 'NO_ACTIVE_COMPANY_ROLE' });
    await expect(resolveUserAuthContext({ uid: randomUUID() }, a, auth)).rejects.toMatchObject({ code: 'USER_NOT_REGISTERED' });
  });

  it('rejects expired commercial roles', async () => {
    await admin.query('UPDATE user_company_roles SET valid_to=clock_timestamp() - interval \'1 second\' WHERE user_id=$1', [actor]);
    try {
      await expect(resolveUserAuthContext({ uid }, a, auth)).rejects.toMatchObject({ code: 'NO_ACTIVE_COMPANY_ROLE' });
    } finally {
      await admin.query('UPDATE user_company_roles SET valid_to=NULL WHERE user_id=$1', [actor]);
    }
  });

  it('confines authentication credentials to read-only lookup columns', async () => {
    await expect(auth.query("UPDATE users SET status='SUSPENDED'")).rejects.toMatchObject({ code: '42501' });
    await expect(auth.query('SELECT email FROM users')).rejects.toMatchObject({ code: '42501' });
    await expect(auth.query('SELECT * FROM outbox_events')).rejects.toMatchObject({ code: '42501' });
    await expect(auth.query('SET ROLE qsa_runtime')).rejects.toMatchObject({ code: '42501' });
  });

  it('confines workers to company-scoped delivery and lease columns', async () => {
    expect((await worker.query('SELECT * FROM worker_jobs')).rowCount).toBe(0);
    const client = await worker.connect();
    try {
      await client.query('BEGIN');
      await client.query("SELECT set_config('app.company_id',$1,true)", [a]);
      expect((await client.query("UPDATE worker_jobs SET status='LEASED',attempts=attempts+1 WHERE event_id=$1 RETURNING id", [eventId])).rowCount).toBe(1);
      await client.query('ROLLBACK');
      await client.query('BEGIN');
      await client.query("SELECT set_config('app.company_id',$1,true)", [b]);
      expect((await client.query('SELECT * FROM worker_jobs WHERE event_id=$1', [eventId])).rowCount).toBe(0);
      expect((await client.query("UPDATE worker_jobs SET status='COMPLETED' WHERE event_id=$1", [eventId])).rowCount).toBe(0);
      await client.query('ROLLBACK');
      await expect(client.query('UPDATE worker_jobs SET company_id=$1', [b])).rejects.toMatchObject({ code: '42501' });
      await expect(client.query('SELECT * FROM users')).rejects.toMatchObject({ code: '42501' });
      await expect(client.query('DELETE FROM projects')).rejects.toMatchObject({ code: '42501' });
      await expect(client.query('SET ROLE qsa_migrator')).rejects.toMatchObject({ code: '42501' });
    } finally {
      await client.query('ROLLBACK');
      await client.query('DISCARD ALL');
      client.release();
    }
  });

  it('clears tenant, actor, project, role and session pollution on the same physical connection', async () => {
    const first = await withUnitOfWork(context, async uow => {
      await uow.query("SELECT set_config('app.company_id',$1,false)", [a]);
      return (await uow.query('SELECT pg_backend_pid() AS pid')).rows[0].pid;
    }, runtime);
    const clean = (await runtime.query(`SELECT pg_backend_pid() AS pid, current_user,
      current_setting('app.company_id',true) AS company, current_setting('app.actor_id',true) AS actor,
      current_setting('app.project_id',true) AS project`)).rows[0];
    expect(clean.pid).toBe(first);
    expect(clean.current_user).toBe('qsa_runtime');
    expect(clean.company || '').toBe('');
    expect(clean.actor || '').toBe('');
    expect(clean.project || '').toBe('');
    await withUnitOfWork({ companyId: b, actorId: actor }, async uow => {
      expect((await uow.query('SELECT id FROM projects')).rows).toEqual([{ id: pb }]);
      expect((await uow.query("SELECT current_setting('app.project_id',true) AS project")).rows[0].project).toBe('');
    }, runtime);
  });

  it('evicts a real terminated backend when transaction and rollback fail', async () => {
    let terminated: number;
    await expect(withUnitOfWork(context, async uow => {
      terminated = (await uow.query('SELECT pg_backend_pid() AS pid')).rows[0].pid;
      await admin.query('SELECT pg_terminate_backend($1)', [terminated]);
      await uow.query('SELECT 1');
    }, runtime)).rejects.toThrow();
    expect((await runtime.query('SELECT pg_backend_pid() AS pid')).rows[0].pid).not.toBe(terminated!);
  });

  it('keeps migrations ordered, idempotent and checksum-protected', async () => {
    const rerun = await applyMigrations(migrator);
    expect(rerun.applied).toEqual([]);
    expect(rerun.verified).toEqual(['001', '002', '003', '004', '005']);
    expect(await verifyMigrations(migrator)).toMatchObject({ allValid: true, appliedCount: 5, pendingCount: 0 });
    await admin.query("UPDATE schema_migrations SET checksum='tampered' WHERE version='003'");
    try {
      await expect(applyMigrations(migrator)).rejects.toThrow('checksum mismatch');
      expect((await verifyMigrations(migrator)).allValid).toBe(false);
    } finally {
      await admin.query("UPDATE schema_migrations SET checksum=$1 WHERE version='003'", [loadMigrationFiles()[2].checksum]);
    }
  });

  it('rejects ambiguous migration numbering', () => {
    const directory = mkdtempSync(join(tmpdir(), 'qsa-sg1-migrations-'));
    try {
      writeFileSync(join(directory, '001_a.sql'), 'SELECT 1;');
      writeFileSync(join(directory, '001_b.sql'), 'SELECT 2;');
      expect(() => loadMigrationFiles(directory)).toThrow('duplicate');
    } finally {
      rmSync(directory, { recursive: true });
    }
  });

  it('rejects applied migration history whose source file is missing', async () => {
    await admin.query("INSERT INTO schema_migrations(version,name,checksum) VALUES('999','missing','invalid')");
    try {
      await expect(applyMigrations(migrator)).rejects.toThrow('missing file');
      expect((await verifyMigrations(migrator)).details).toContainEqual({ version: '999', status: 'MISSING_FILE' });
    } finally {
      await admin.query("DELETE FROM schema_migrations WHERE version='999'");
    }
  });

});
