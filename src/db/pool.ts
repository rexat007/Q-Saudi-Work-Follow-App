/**
 * PostgreSQL Connection Pool Ownership and Lifecycle
 * Architecture Authority: ARCH-R1 / Revision 1.2, Section 17.4
 * Scope: AR2-U01 Explicit pool ownership, parameterized queries, transaction lifecycle
 */

import pg from 'pg';
import type { PoolClient, QueryResult, QueryResultRow } from 'pg';
import type { DbRole } from './types.js';

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
    user: overrides.user || process.env.PGUSER || 'postgres',
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

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackErr) {
      console.error('Failed to rollback transaction:', rollbackErr);
    }
    throw error;
  } finally {
    if (isDedicatedClient) {
      client.release();
    }
  }
}
