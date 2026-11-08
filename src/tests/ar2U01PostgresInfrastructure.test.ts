/**
 * Real PostgreSQL 17 Infrastructure Verification Test Suite
 * Architecture Authority: ARCH-R1 / Revision 1.2 & ADR-001
 * Scope: AR2-U01 Migrations, Constraints, GiST Exclusion, Roles/RLS, UnitOfWork, Auth, Backup/Restore
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as crypto from 'crypto';
import { execFileSync } from 'child_process';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import pg from 'pg';
import { getPool, getAuthPool, getMigrationPool, closePool, withTransaction } from '../db/pool.js';
import { applyMigrations, verifyMigrations } from '../db/migrator.js';
import { withUnitOfWork } from '../db/unitOfWork.js';
import { resolveUserAuthContext, assertProjectAccess, AuthenticationError, AuthorizationError } from '../db/authAdapter.js';
import { resolveFirestorePath } from '../db/firestoreMapping.js';

describe('AR2-U01: PostgreSQL 17 Infrastructure & Canonical Schema', () => {
  if (process.env.QSA_TEST_DATABASE_ISOLATED !== '1' || !process.env.TEST_DATABASE_URL) {
    throw new Error('An explicitly isolated TEST_DATABASE_URL is required');
  }
  const pool = new pg.Pool({ connectionString: process.env.TEST_DATABASE_URL });
  getPool();

  beforeAll(async () => {
    // Fail-closed verification: Ensure real PostgreSQL is reachable
    try {
      const res = await pool.query('SELECT version();');
      expect(res.rows[0].version).toMatch(/PostgreSQL 17\./);
    } catch (err) {
      throw new Error(`Real PostgreSQL 17 not reachable! Failing closed per AR2-U01 mandate: ${(err as Error).message}`);
    }

    // Apply migrations
    const migrationRes = await applyMigrations(getMigrationPool());
    expect(migrationRes.applied.length + migrationRes.verified.length).toBeGreaterThanOrEqual(2);
  });

  afterAll(async () => {
    await closePool();
    await pool.end();
  });

  describe('1. Engine & Extension Contracts', () => {
    it('verifies running on real PostgreSQL 17', async () => {
      const res = await pool.query('SELECT version() AS version;');
      expect(res.rows[0].version).toContain('PostgreSQL 17');
    });

    it('verifies btree_gist extension is installed and active', async () => {
      const res = await pool.query(
        "SELECT extname, extversion FROM pg_extension WHERE extname = 'btree_gist';"
      );
      expect(res.rows.length).toBe(1);
      expect(res.rows[0].extname).toBe('btree_gist');
    });

    it('verifies migration runner is idempotent and verifies checksums', async () => {
      const verification = await verifyMigrations(getMigrationPool());
      expect(verification.allValid).toBe(true);
      expect(verification.pendingCount).toBe(0);
      expect(verification.appliedCount).toBeGreaterThanOrEqual(2);
    });
  });

  describe('2. Canonical Schema Constraints & GiST Exclusion', () => {
    it('enforces composite foreign key from project to company', async () => {
      const nonExistentCompanyId = crypto.randomUUID();
      const projectId = crypto.randomUUID();

      await expect(
        pool.query(
          `INSERT INTO projects (id, company_id, external_id, name, status)
           VALUES ($1, $2, 'Q-PRJ-TEST', 'Test Project', 'ACTIVE')`,
          [projectId, nonExistentCompanyId]
        )
      ).rejects.toThrow();
    });

    it('enforces GiST temporal exclusion constraint on driver_truck_assignments', async () => {
      const companyId = crypto.randomUUID();
      const projectId = crypto.randomUUID();
      const driverId = crypto.randomUUID();
      const truckId1 = crypto.randomUUID();
      const truckId2 = crypto.randomUUID();

      await withTransaction(async client => {
        // Create company, project, driver, trucks
        await client.query(
          `INSERT INTO companies (id, slug, name, status) VALUES ($1, $2, 'Excl Co', 'ACTIVE')`,
          [companyId, `excl-${Date.now()}`]
        );
        await client.query(
          `INSERT INTO projects (id, company_id, external_id, name, status) VALUES ($1, $2, 'PRJ-EXCL', 'Excl Prj', 'ACTIVE')`,
          [projectId, companyId]
        );
        await client.query(
          `INSERT INTO drivers (id, company_id, external_id, name, status) VALUES ($1, $2, 'DRV-EXCL', 'Driver One', 'ACTIVE')`,
          [driverId, companyId]
        );
        await client.query(
          `INSERT INTO trucks (id, company_id, external_id, normalized_plate, type, status) VALUES ($1, $2, 'TRK-EXCL-1', '1111 AAA', 'DUMP', 'ACTIVE')`,
          [truckId1, companyId]
        );
        await client.query(
          `INSERT INTO trucks (id, company_id, external_id, normalized_plate, type, status) VALUES ($1, $2, 'TRK-EXCL-2', '2222 BBB', 'DUMP', 'ACTIVE')`,
          [truckId2, companyId]
        );

        // First assignment: 2026-11-01 to 2026-11-10
        await client.query(
          `INSERT INTO driver_truck_assignments (
            id, company_id, project_id, driver_id, truck_id, valid_period, record_status
          ) VALUES (
            $1, $2, $3, $4, $5, tstzrange('2026-11-01 00:00:00Z', '2026-11-10 00:00:00Z', '[)'), 'ACCEPTED'
          )`,
          [crypto.randomUUID(), companyId, projectId, driverId, truckId1]
        );

        // Non-overlapping assignment later in time: ALLOWED
        await client.query(
          `INSERT INTO driver_truck_assignments (
            id, company_id, project_id, driver_id, truck_id, valid_period, record_status
          ) VALUES (
            $1, $2, $3, $4, $5, tstzrange('2026-11-15 00:00:00Z', '2026-11-20 00:00:00Z', '[)'), 'ACCEPTED'
          )`,
          [crypto.randomUUID(), companyId, projectId, driverId, truckId2]
        );

        // Overlapping assignment for the SAME driver (2026-11-05 to 2026-11-12): MUST REJECT by GiST exclusion
        await client.query('SAVEPOINT sp_overlap');
        let overlapError: Error | null = null;
        try {
          await client.query(
            `INSERT INTO driver_truck_assignments (
              id, company_id, project_id, driver_id, truck_id, valid_period, record_status
            ) VALUES (
              $1, $2, $3, $4, $5, tstzrange('2026-11-05 00:00:00Z', '2026-11-12 00:00:00Z', '[)'), 'ACCEPTED'
            )`,
            [crypto.randomUUID(), companyId, projectId, driverId, truckId2]
          );
        } catch (err) {
          overlapError = err as Error;
          await client.query('ROLLBACK TO SAVEPOINT sp_overlap');
        }

        expect(overlapError).not.toBeNull();
        expect(overlapError?.message).toMatch(/exclusion|violates exclusion constraint/i);

        // Voided assignment with overlapping period: ALLOWED (WHERE record_status = 'ACCEPTED' AND voided_at IS NULL)
        await client.query(
          `INSERT INTO driver_truck_assignments (
            id, company_id, project_id, driver_id, truck_id, valid_period, record_status, voided_at
          ) VALUES (
            $1, $2, $3, $4, $5, tstzrange('2026-11-05 00:00:00Z', '2026-11-12 00:00:00Z', '[)'), 'VOIDED', clock_timestamp()
          )`,
          [crypto.randomUUID(), companyId, projectId, driverId, truckId2]
        );
      }, pool);
    });
  });

  describe('3. Row-Level Security & Tenant Isolation', () => {
    it('isolates company rows and prevents cross-tenant leaks', async () => {
      const companyA = crypto.randomUUID();
      const companyB = crypto.randomUUID();
      const projectA = crypto.randomUUID();
      const projectB = crypto.randomUUID();
      const actorId = crypto.randomUUID();

      // Seed companies and projects directly
      await pool.query(
        `INSERT INTO companies (id, slug, name, status) VALUES
         ($1, $2, 'Company A', 'ACTIVE'),
         ($3, $4, 'Company B', 'ACTIVE')`,
        [companyA, `co-a-${Date.now()}`, companyB, `co-b-${Date.now()}`]
      );
      await pool.query(
        `INSERT INTO projects (id, company_id, external_id, name, status) VALUES
         ($1, $2, 'Q-PRJ-A', 'Project A', 'ACTIVE'),
         ($3, $4, 'Q-PRJ-B', 'Project B', 'ACTIVE')`,
        [projectA, companyA, projectB, companyB]
      );

      // Query inside Company A's UnitOfWork
      await withUnitOfWork({ companyId: companyA, actorId }, async uow => {
        const res = await uow.query('SELECT external_id FROM projects ORDER BY external_id');
        expect(res.rows.length).toBe(1);
        expect(res.rows[0].external_id).toBe('Q-PRJ-A');
      });

      // Query inside Company B's UnitOfWork
      await withUnitOfWork({ companyId: companyB, actorId }, async uow => {
        const res = await uow.query('SELECT external_id FROM projects ORDER BY external_id');
        expect(res.rows.length).toBe(1);
        expect(res.rows[0].external_id).toBe('Q-PRJ-B');
      });

      // Query under qsa_runtime with NO company_id set: fail-closed (0 rows returned)
      const unauthenticatedClient = await getPool().connect();
      try {
        await unauthenticatedClient.query('SET ROLE qsa_runtime');
        const res = await unauthenticatedClient.query('SELECT * FROM projects');
        expect(res.rows.length).toBe(0);
      } finally {
        await unauthenticatedClient.query('RESET ROLE');
        unauthenticatedClient.release();
      }
    });

    it('resets context across connection pool checkout (no session leakage)', async () => {
      const companyA = crypto.randomUUID();
      const actorId = crypto.randomUUID();

      await withUnitOfWork({ companyId: companyA, actorId }, async uow => {
        const res = await uow.query("SELECT current_setting('app.company_id', true) AS cid");
        expect(res.rows[0].cid).toBe(companyA);
      });

      // Fresh client checkout from pool must have empty context
      const freshClient = await getPool().connect();
      try {
        const res = await freshClient.query("SELECT current_setting('app.company_id', true) AS cid");
        expect(res.rows[0].cid || '').toBe('');
      } finally {
        freshClient.release();
      }
    });
  });

  describe('4. UnitOfWork Outbox Staging & Idempotency', () => {
    it('commits domain mutation, outbox event, and idempotency record atomically', async () => {
      const companyId = crypto.randomUUID();
      const projectId = crypto.randomUUID();
      const actorId = crypto.randomUUID();
      const operationId = `OP-${Date.now()}`;
      const requestHash = 'sha256-hash-payload-123';

      await pool.query(
        `INSERT INTO companies (id, slug, name, status) VALUES ($1, $2, 'Atomic Co', 'ACTIVE')`,
        [companyId, `atomic-${Date.now()}`]
      );
      await pool.query(
        `INSERT INTO projects (id, company_id, external_id, name, status) VALUES ($1, $2, 'PRJ-ATOMIC', 'Atomic Prj', 'ACTIVE')`,
        [projectId, companyId]
      );

      // Run Unit of Work
      const eventId = await withUnitOfWork({ companyId, projectId, actorId }, async uow => {
        const idemp = await uow.checkOrAcquireIdempotency(operationId, requestHash);
        expect(idemp.isDuplicate).toBe(false);

        const stagedEventId = await uow.stageOutbox({
          projectId,
          aggregateType: 'TRIP',
          aggregateId: 'TRIP-101',
          eventType: 'TRIP_RECORDED',
          aggregateVersion: 1,
          payload: { weightKg: 24500, station: 'STATION_A' }
        });

        await uow.recordAudit({
          action: 'RECORD_TRIP',
          entityKind: 'TRIP',
          entityId: 'TRIP-101',
          operationId,
          projectId
        });

        await uow.commitIdempotency(operationId, stagedEventId);
        return stagedEventId;
      });

      expect(eventId).toBeDefined();

      // Verify idempotency record is COMMITTED and duplicate is detected
      await withUnitOfWork({ companyId, projectId, actorId }, async uow => {
        const checkDuplicate = await uow.checkOrAcquireIdempotency(operationId, requestHash);
        expect(checkDuplicate.isDuplicate).toBe(true);
        expect(checkDuplicate.state).toBe('COMMITTED');
        expect(checkDuplicate.resultRef).toBe(eventId);
      });

      // Verify payload mismatch throws error
      await withUnitOfWork({ companyId, projectId, actorId }, async uow => {
        await expect(
          uow.checkOrAcquireIdempotency(operationId, 'different-payload-hash')
        ).rejects.toThrow(/IDEMPOTENCY_PAYLOAD_MISMATCH/);
      });
    });

    it('rolls back completely on error leaving no artifacts or dirty state', async () => {
      const companyId = crypto.randomUUID();
      const projectId = crypto.randomUUID();
      const actorId = crypto.randomUUID();
      const failedOpId = `OP-FAIL-${Date.now()}`;

      await pool.query(
        `INSERT INTO companies (id, slug, name, status) VALUES ($1, $2, 'Rollback Co', 'ACTIVE')`,
        [companyId, `rollback-${Date.now()}`]
      );
      await pool.query(
        `INSERT INTO projects (id, company_id, external_id, name, status) VALUES ($1, $2, 'PRJ-RB', 'Rollback Prj', 'ACTIVE')`,
        [projectId, companyId]
      );

      await expect(
        withUnitOfWork({ companyId, projectId, actorId }, async uow => {
          await uow.checkOrAcquireIdempotency(failedOpId, 'hash-fail');
          await uow.stageOutbox({
            projectId,
            aggregateType: 'TRIP',
            aggregateId: 'TRIP-FAIL',
            eventType: 'FAILED_EVENT',
            aggregateVersion: 1,
            payload: {}
          });
          throw new Error('SIMULATED_DOMAIN_FAILURE');
        })
      ).rejects.toThrow('SIMULATED_DOMAIN_FAILURE');

      // Verify nothing was committed
      await withUnitOfWork({ companyId, projectId, actorId }, async uow => {
        const idempCheck = await uow.query(
          'SELECT * FROM idempotency_receipts WHERE company_id = $1 AND operation_id = $2',
          [companyId, failedOpId]
        );
        expect(idempCheck.rows.length).toBe(0);

        const outboxCheck = await uow.query(
          "SELECT * FROM outbox_events WHERE company_id = $1 AND aggregate_id = 'TRIP-FAIL'",
          [companyId]
        );
        expect(outboxCheck.rows.length).toBe(0);
      });
    });
  });

  describe('5. Authentication Adapter & Authorization Boundaries', () => {
    it('resolves active user, company role, and accessible projects', async () => {
      const companyId = crypto.randomUUID();
      const userId = crypto.randomUUID();
      const projectId = crypto.randomUUID();
      const firebaseUid = `fb-uid-${Date.now()}`;

      await pool.query(
        `INSERT INTO companies (id, slug, name, status) VALUES ($1, $2, 'Auth Co', 'ACTIVE')`,
        [companyId, `auth-co-${Date.now()}`]
      );
      await pool.query(
        `INSERT INTO users (id, firebase_uid, display_name, status) VALUES ($1, $2, 'Test Engineer', 'ACTIVE')`,
        [userId, firebaseUid]
      );
      await pool.query(
        `INSERT INTO user_company_roles (id, company_id, user_id, role, status) VALUES ($1, $2, $3, 'PROJECT_OFFICER', 'ACTIVE')`,
        [crypto.randomUUID(), companyId, userId]
      );
      await pool.query(
        `INSERT INTO projects (id, company_id, external_id, name, status) VALUES ($1, $2, 'PRJ-AUTH-1', 'Auth Prj 1', 'ACTIVE')`,
        [projectId, companyId]
      );
      await pool.query(
        `INSERT INTO project_access (id, company_id, project_id, user_id, role, status) VALUES ($1, $2, $3, $4, 'OFFICER', 'ACTIVE')`,
        [crypto.randomUUID(), companyId, projectId, userId]
      );

      const authContext = await resolveUserAuthContext({ uid: firebaseUid }, companyId, getAuthPool());
      expect(authContext.userId).toBe(userId);
      expect(authContext.companyId).toBe(companyId);
      expect(authContext.role).toBe('PROJECT_OFFICER');
      expect(authContext.accessibleProjectIds).toContain(projectId);

      // Verify assertion succeeds for accessible project
      expect(() => assertProjectAccess(authContext, projectId)).not.toThrow();

      // Verify assertion throws for non-accessible project
      const unauthorizedProjectId = crypto.randomUUID();
      expect(() => assertProjectAccess(authContext, unauthorizedProjectId)).toThrow(AuthorizationError);
    });

    it('fails closed when user account is suspended or not registered', async () => {
      const suspendedUid = `fb-suspended-${Date.now()}`;
      await pool.query(
        `INSERT INTO users (id, firebase_uid, display_name, status) VALUES ($1, $2, 'Suspended User', 'SUSPENDED')`,
        [crypto.randomUUID(), suspendedUid]
      );

      await expect(resolveUserAuthContext({ uid: suspendedUid }, undefined, getAuthPool())).rejects.toThrow(
        AuthenticationError
      );

      await expect(resolveUserAuthContext({ uid: 'non-existent-uid' }, undefined, getAuthPool())).rejects.toThrow(
        AuthenticationError
      );
    });
  });

  describe('6. Read-Only Firestore Path Mapping Inventory', () => {
    it('correctly maps Firestore collection paths to PostgreSQL relational tables', () => {
      const parsedTruck = resolveFirestorePath('projects/Q-PRJ-011/trucks/TRK-001');
      expect(parsedTruck).not.toBeNull();
      expect(parsedTruck?.targetTable).toBe('trucks');
      expect(parsedTruck?.entityKind).toBe('TRUCK');
      expect(parsedTruck?.extractedIds.projectId).toBe('Q-PRJ-011');
      expect(parsedTruck?.extractedIds.truckId).toBe('TRK-001');

      const parsedTrip = resolveFirestorePath('projects/Q-PRJ-011/trips/TRIP-999');
      expect(parsedTrip?.targetTable).toBe('trips');
      expect(parsedTrip?.entityKind).toBe('TRIP');

      const parsedSession = resolveFirestorePath('projects/Q-PRJ-011/importSessions/SESSION-42');
      expect(parsedSession?.targetTable).toBe('import_sessions');
      expect(parsedSession?.entityKind).toBe('IMPORT_SESSION');

      const invalidPath = resolveFirestorePath('unknown/collection/path');
      expect(invalidPath).toBeNull();
    });
  });

  describe('7. Backup and Restore Rehearsal', () => {
    it('rehearses pg_dump export and pg_restore / psql restore into rehearsal database', async () => {
      const directory = mkdtempSync(join(tmpdir(), 'qsa-sg1-restore-'));
      const dumpFile = join(directory, 'schema.sql');
      const restoreDb = `qsa_restore_${crypto.randomUUID().replaceAll('-', '')}`;
      const url = new URL(process.env.TEST_DATABASE_URL!);
      const env = { ...process.env, PGHOST: url.hostname, PGPORT: url.port || '5432',
        PGUSER: decodeURIComponent(url.username), PGPASSWORD: decodeURIComponent(url.password),
        PGDATABASE: url.pathname.slice(1) };
      const bin = (name: string) => process.env.PG_BIN_DIR
        ? join(process.env.PG_BIN_DIR, name + (process.platform === 'win32' ? '.exe' : '')) : name;
      let restored: pg.Pool | undefined;
      let created = false;
      try {
        execFileSync(bin('pg_dump'), ['--schema-only', '-f', dumpFile], { env });
        await pool.query(`CREATE DATABASE ${restoreDb}`);
        created = true;
        execFileSync(bin('psql'), ['-X', '-v', 'ON_ERROR_STOP=1', '-d', restoreDb, '-f', dumpFile], { env });
        url.pathname = '/' + restoreDb;
        restored = new pg.Pool({ connectionString: url.toString() });
        const sql = "SELECT count(*)::int AS count FROM information_schema.tables WHERE table_schema = 'public'";
        const originalCount = (await pool.query(sql)).rows[0].count;
        const restoredCount = (await restored.query(sql)).rows[0].count;
        expect(restoredCount).toBe(originalCount);
        expect(restoredCount).toBeGreaterThanOrEqual(42);
      } finally {
        await restored?.end();
        if (created) await pool.query(`DROP DATABASE ${restoreDb}`);
        rmSync(directory, { recursive: true });
      }
    }, 30000);
  });
});
