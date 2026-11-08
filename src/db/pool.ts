/**
 * PostgreSQL Connection Pool Ownership and Lifecycle
 * Architecture Authority: ARCH-R1 / Revision 1.2, Section 17.4
 * Scope: AR2-U01 Explicit pool ownership, parameterized queries, transaction lifecycle
 */

import pg from 'pg';
import type { PoolClient, QueryResult, QueryResultRow } from 'pg';

const { Pool } = pg;

export interface PoolConfig {
  connectionString?: string;
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  database?: string;
  max?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
  statement_timeout?: number;
}

let activePool: pg.Pool | null = null;
let currentConfig: PoolConfig | null = null;
let authPool: pg.Pool | null = null;
let migrationPool: pg.Pool | null = null;

function credentialPool(variable: 'AUTH_DATABASE_URL' | 'MIGRATION_DATABASE_URL'): pg.Pool {
  const connectionString = process.env[variable];
  if (!connectionString) throw new Error(`${variable} is required; runtime credentials are never used as a fallback`);
  return new Pool({ connectionString, max: 4, connectionTimeoutMillis: 5000, statement_timeout: 30000 });
}

export function getAuthPool(): pg.Pool {
  return authPool ||= credentialPool('AUTH_DATABASE_URL');
}

export function getMigrationPool(): pg.Pool {
  return migrationPool ||= credentialPool('MIGRATION_DATABASE_URL');
}

export async function assertServiceIdentity(pool: pg.Pool | PoolClient, role: 'qsa_runtime' | 'qsa_auth'): Promise<void> {
  const result = await pool.query(`
    SELECT r.rolname FROM pg_catalog.pg_roles r
    WHERE r.rolname = session_user AND r.rolname = $1
      AND NOT (r.rolsuper OR r.rolbypassrls OR r.rolcreaterole OR r.rolcreatedb OR r.rolreplication)
      AND NOT EXISTS (SELECT 1 FROM pg_catalog.pg_class c
        JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relowner = r.oid)
      AND NOT EXISTS (SELECT 1 FROM pg_catalog.pg_auth_members m WHERE m.member = r.oid)
  `, [role]);
  if (result.rows.length !== 1) throw new Error(`Unsafe database identity: connect directly as non-owner ${role}`);
}

export function buildPoolConfig(overrides: Partial<PoolConfig> = {}): PoolConfig {
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl && !overrides.connectionString && !overrides.host) {
    return {
      connectionString: databaseUrl,
      max: Number(process.env.PG_POOL_MAX || 20),
      idleTimeoutMillis: Number(process.env.PG_IDLE_TIMEOUT_MS || 30000),
      connectionTimeoutMillis: Number(process.env.PG_CONN_TIMEOUT_MS || 5000),
      statement_timeout: Number(process.env.PG_STATEMENT_TIMEOUT_MS || 30000),
      ...overrides
    };
  }

  return {
    host: overrides.host || process.env.PGHOST || '/tmp',
    port: overrides.port || Number(process.env.PGPORT || 5432),
    user: overrides.user || process.env.PGUSER || 'qsa_runtime',
    password: overrides.password !== undefined ? overrides.password : (process.env.PGPASSWORD || ''),
    database: overrides.database || process.env.PGDATABASE || 'qsaudi_test',
    max: overrides.max || Number(process.env.PG_POOL_MAX || 20),
    idleTimeoutMillis: overrides.idleTimeoutMillis || Number(process.env.PG_IDLE_TIMEOUT_MS || 30000),
    connectionTimeoutMillis: overrides.connectionTimeoutMillis || Number(process.env.PG_CONN_TIMEOUT_MS || 5000),
    statement_timeout: overrides.statement_timeout || Number(process.env.PG_STATEMENT_TIMEOUT_MS || 30000),
    ...overrides
  };
}

export function getPool(configOverrides?: Partial<PoolConfig>): pg.Pool {
  if (activePool) {
    return activePool;
  }

  currentConfig = buildPoolConfig(configOverrides);
  activePool = new Pool(currentConfig);

  activePool.on('error', (err: Error) => {
    // Log unexpected errors on idle clients; do not swallow
    console.error('Unexpected error on idle PostgreSQL client:', err);
  });

  return activePool;
}

export async function closePool(): Promise<void> {
  const auxiliaryPools = [authPool, migrationPool];
  authPool = null;
  migrationPool = null;
  await Promise.all(auxiliaryPools.map(pool => pool?.end()));
  if (activePool) {
    const poolToClose = activePool;
    activePool = null;
    currentConfig = null;
    await poolToClose.end();
  }
}

/**
 * Execute parameterized query with explicit pool ownership
 */
export async function query<T extends QueryResultRow = any>(
  text: string,
  params: unknown[] = []
): Promise<QueryResult<T>> {
  const pool = getPool();
  return pool.query<T>(text, params);
}

/**
 * Transaction execution helper with automatic rollback on error
 */
export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>,
  clientOrPool?: pg.Pool | PoolClient
): Promise<T> {
  const pool = clientOrPool instanceof Pool ? (clientOrPool as pg.Pool) : getPool();
  const client = (clientOrPool && !(clientOrPool instanceof Pool))
    ? (clientOrPool as PoolClient)
    : await pool.connect();

  const isDedicatedClient = !(clientOrPool && !(clientOrPool instanceof Pool));
  let discard = false;
  const onConnectionError = () => { discard = true; };
  client.on('error', onConnectionError);

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackErr) {
      discard = true;
    }
    throw error;
  } finally {
    if (isDedicatedClient) {
      try {
        if (!discard) await client.query('DISCARD ALL');
      } catch {
        discard = true;
      }
      client.release(discard);
    }
    client.removeListener('error', onConnectionError);
  }
}
