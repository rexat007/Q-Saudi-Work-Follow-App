/**
 * Versioned SQL Migration Infrastructure for PostgreSQL 17
 * Architecture Authority: ARCH-R1 / Revision 1.2 & ADR-001
 * Scope: AR2-U01 Advisory Locking, Checksums, Ordered Application, Verification
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import type { Pool, PoolClient } from 'pg';
import { fileURLToPath } from 'url';
import { getMigrationPool, closePool } from './pool.js';
import type { MigrationRecord, MigrationResult } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Deterministic advisory lock identifier for Q-Saudi database migrations
const MIGRATION_ADVISORY_LOCK_ID = 7142026;

export const MIGRATIONS_DIR = path.resolve(__dirname, 'migrations');

export interface MigrationFile {
  version: string;
  name: string;
  filename: string;
  filepath: string;
  sql: string;
  checksum: string;
}

export function computeChecksum(content: string): string {
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

export function loadMigrationFiles(dir: string = MIGRATIONS_DIR): MigrationFile[] {
  if (!fs.existsSync(dir)) {
    throw new Error(`Migrations directory not found: ${dir}`);
  }

  const files = fs.readdirSync(dir)
    .filter(file => file.endsWith('.sql'))
    .sort((a, b) => a.localeCompare(b));

  const versions = new Set<number>();
  return files.map(filename => {
    const filepath = path.join(dir, filename);
    const sql = fs.readFileSync(filepath, 'utf8');
    const checksum = computeChecksum(sql);
    const match = filename.match(/^(\d+)_(.+)\.sql$/);
    if (!match || versions.has(Number(match[1])) || Number(match[1]) !== versions.size + 1) {
      throw new Error(`Invalid, duplicate or out-of-order migration: ${filename}`);
    }
    versions.add(Number(match[1]));
    const version = match ? match[1] : filename.replace(/\.sql$/, '');
    const name = match ? match[2] : filename.replace(/\.sql$/, '');

    return {
      version,
      name,
      filename,
      filepath,
      sql,
      checksum
    };
  });
}

export async function ensureMigrationTable(client: PoolClient): Promise<void> {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version text PRIMARY KEY,
      name text NOT NULL,
      checksum text NOT NULL,
      applied_at timestamptz NOT NULL DEFAULT clock_timestamp()
    );
  `);
}

export async function acquireMigrationLock(client: PoolClient): Promise<void> {
  const res = await client.query('SELECT pg_advisory_lock($1)', [MIGRATION_ADVISORY_LOCK_ID]);
  if (!res) {
    throw new Error('Failed to acquire migration advisory lock');
  }
}

export async function releaseMigrationLock(client: PoolClient): Promise<void> {
  await client.query('SELECT pg_advisory_unlock($1)', [MIGRATION_ADVISORY_LOCK_ID]);
}

export async function getAppliedMigrations(client: PoolClient): Promise<Map<string, MigrationRecord>> {
  await ensureMigrationTable(client);
  const res = await client.query<MigrationRecord>(
    'SELECT version, name, checksum, applied_at FROM schema_migrations ORDER BY version ASC'
  );
  const map = new Map<string, MigrationRecord>();
  for (const row of res.rows) {
    map.set(row.version, row);
  }
  return map;
}

export async function applyMigrations(poolOverride?: Pool): Promise<MigrationResult> {
  const pool = poolOverride || getMigrationPool();
  const client = await pool.connect();

  const result: MigrationResult = {
    applied: [],
    verified: [],
    skipped: []
  };

  try {
    await acquireMigrationLock(client);
    await ensureMigrationTable(client);

    const migrationFiles = loadMigrationFiles();
    const appliedMap = await getAppliedMigrations(client);

    // Validate the entire applied history before executing any pending SQL.
    for (const [version, applied] of appliedMap) {
      const file = migrationFiles.find(m => m.version === version);
      if (!file || file.checksum !== applied.checksum) {
        throw new Error(`Migration checksum mismatch or missing file for version ${version}`);
      }
    }

    for (const m of migrationFiles) {
      const existing = appliedMap.get(m.version);

      if (existing) {
        if (existing.checksum !== m.checksum) {
          throw new Error(
            `Migration checksum mismatch for version ${m.version} (${m.name})!\n` +
            `Recorded in DB: ${existing.checksum}\n` +
            `Current file:   ${m.checksum}`
          );
        }
        result.verified.push(m.version);
        result.skipped.push(m.version);
      } else {
        // Apply migration in transaction
        await client.query('BEGIN');
        try {
          await client.query(m.sql);
          await client.query(
            'INSERT INTO schema_migrations (version, name, checksum, applied_at) VALUES ($1, $2, $3, clock_timestamp())',
            [m.version, m.name, m.checksum]
          );
          await client.query('COMMIT');
          result.applied.push(m.version);
        } catch (err) {
          await client.query('ROLLBACK');
          throw new Error(`Failed to apply migration ${m.version} (${m.name}): ${(err as Error).message}`);
        }
      }
    }

    return result;
  } finally {
    let discard = false;
    try {
      await releaseMigrationLock(client);
    } catch (unlockErr) {
      discard = true;
    }
    client.release(discard);
  }
}

export async function verifyMigrations(poolOverride?: Pool): Promise<{
  allValid: boolean;
  appliedCount: number;
  pendingCount: number;
  details: Array<{ version: string; status: 'VALID' | 'PENDING' | 'CHECKSUM_MISMATCH' | 'MISSING_FILE' }>;
}> {
  const pool = poolOverride || getMigrationPool();
  const client = await pool.connect();

  try {
    await ensureMigrationTable(client);
    const migrationFiles = loadMigrationFiles();
    const appliedMap = await getAppliedMigrations(client);

    let allValid = true;
    let appliedCount = 0;
    let pendingCount = 0;
    const details: Array<{ version: string; status: 'VALID' | 'PENDING' | 'CHECKSUM_MISMATCH' | 'MISSING_FILE' }> = [];
    for (const version of appliedMap.keys()) {
      if (!migrationFiles.some(file => file.version === version)) {
        allValid = false;
        details.push({ version, status: 'MISSING_FILE' });
      }
    }

    for (const m of migrationFiles) {
      const existing = appliedMap.get(m.version);
      if (!existing) {
        pendingCount++;
        allValid = false;
        details.push({ version: m.version, status: 'PENDING' });
      } else if (existing.checksum !== m.checksum) {
        allValid = false;
        details.push({ version: m.version, status: 'CHECKSUM_MISMATCH' });
      } else {
        appliedCount++;
        details.push({ version: m.version, status: 'VALID' });
      }
    }

    return { allValid, appliedCount, pendingCount, details };
  } finally {
    client.release();
  }
}

// CLI execution handler
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  (async () => {
    try {
      console.log('Running PostgreSQL migrations...');
      const res = await applyMigrations();
      console.log(`Migrations complete. Applied: ${res.applied.length}, Verified: ${res.verified.length}`);
      await closePool();
      process.exit(0);
    } catch (err) {
      console.error('Migration execution failed:', err);
      await closePool();
      process.exit(1);
    }
  })();
}
