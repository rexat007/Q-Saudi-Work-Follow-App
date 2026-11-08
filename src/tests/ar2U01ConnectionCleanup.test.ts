import { describe, expect, it, vi } from 'vitest';
import type { Pool } from 'pg';
import { EventEmitter } from 'events';
import { withUnitOfWork } from '../db/unitOfWork.js';
import { buildPoolConfig, getAuthPool, getMigrationPool } from '../db/pool.js';

// Fault-injection unit tests, separately identified from real PostgreSQL tests.
describe('AR2-U01-SG1 cleanup failure injection', () => {
  const context = { companyId: 'company', actorId: 'actor' };

  it('uses an unprivileged default login instead of postgres', () => {
    vi.stubEnv('DATABASE_URL', '');
    vi.stubEnv('PGUSER', '');
    try {
      expect(buildPoolConfig({ host: 'localhost' }).user).toBe('qsa_runtime');
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it('requires separate authentication and migration credentials without runtime fallback', () => {
    vi.stubEnv('AUTH_DATABASE_URL', '');
    vi.stubEnv('MIGRATION_DATABASE_URL', '');
    try {
      expect(() => getAuthPool()).toThrow('AUTH_DATABASE_URL is required');
      expect(() => getMigrationPool()).toThrow('MIGRATION_DATABASE_URL is required');
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it.each(['DISCARD ALL', 'ROLLBACK'])(
    'destroys the client after %s fails', async failure => {
      const release = vi.fn();
      const query = vi.fn(async (sql: string) => {
        if (sql === failure) throw new Error(`injected ${failure} failure`);
        return { rows: [{}] };
      });
      const pool = { connect: async () => Object.assign(new EventEmitter(), { query, release }) } as unknown as Pool;
      if (failure === 'ROLLBACK') {
        await expect(withUnitOfWork(context, async () => { throw new Error('domain error'); }, pool)).rejects.toThrow('domain error');
      } else {
        expect(await withUnitOfWork(context, async () => 'committed', pool)).toBe('committed');
      }
      expect(release).toHaveBeenCalledExactlyOnceWith(true);
    });

  it('preserves the domain error when both rollback and cleanup are unsafe', async () => {
    const release = vi.fn();
    const query = vi.fn(async (sql: string) => {
      if (sql === 'ROLLBACK' || sql === 'DISCARD ALL') throw new Error('cleanup error');
      return { rows: [{}] };
    });
    const pool = { connect: async () => Object.assign(new EventEmitter(), { query, release }) } as unknown as Pool;
    await expect(withUnitOfWork(context, async () => { throw new Error('original error'); }, pool)).rejects.toThrow('original error');
    expect(release).toHaveBeenCalledExactlyOnceWith(true);
    expect(query).not.toHaveBeenCalledWith('DISCARD ALL');
  });

  it('returns a client for reuse only after successful cleanup', async () => {
    const release = vi.fn();
    const query = vi.fn(async () => ({ rows: [{}] }));
    const pool = { connect: async () => Object.assign(new EventEmitter(), { query, release }) } as unknown as Pool;
    await expect(withUnitOfWork(context, async () => { throw new Error('domain'); }, pool)).rejects.toThrow('domain');
    expect(query).toHaveBeenLastCalledWith('DISCARD ALL');
    expect(release).toHaveBeenCalledExactlyOnceWith(false);
  });
});
