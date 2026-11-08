/**
 * SQL Unit of Work & Request Isolation Boundary
 * Architecture Authority: ARCH-R1 / Revision 1.2, Section 17.4 & ADR-001
 * Scope: AR2-U01 Transaction-local tenant context, outbox staging, idempotency, audit trail
 */

import * as crypto from 'crypto';
import type { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import { getPool, assertServiceIdentity } from './pool.js';
import type { RequestContext, OutboxEvent, IdempotencyState } from './types.js';

export interface IdempotencyCheckResult {
  isDuplicate: boolean;
  state?: IdempotencyState;
  resultRef?: string | null;
}

export class UnitOfWork {
  public readonly client: PoolClient;
  public readonly context: RequestContext;
  private readonly stagedOutboxEvents: OutboxEvent[] = [];

  constructor(client: PoolClient, context: RequestContext) {
    this.client = client;
    this.context = context;
  }

  /**
   * Execute parameterized SQL query within the tenant-isolated unit of work
   */
  async query<T extends QueryResultRow = any>(
    text: string,
    params: unknown[] = []
  ): Promise<QueryResult<T>> {
    return this.client.query<T>(text, params);
  }

  /**
   * Stage a transactional outbox event to be written within the same transaction
   */
  async stageOutbox(event: Omit<OutboxEvent, 'companyId' | 'id' | 'occurredAt'> & { companyId?: string }): Promise<string> {
    const eventId = crypto.randomUUID();
    const companyId = event.companyId || this.context.companyId;
    const occurredAt = new Date();

    await this.client.query(
      `INSERT INTO outbox_events (
        id, company_id, project_id, aggregate_type, aggregate_id, event_type, aggregate_version, payload, occurred_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        eventId,
        companyId,
        event.projectId,
        event.aggregateType,
        event.aggregateId,
        event.eventType,
        event.aggregateVersion,
        JSON.stringify(event.payload),
        occurredAt
      ]
    );

    // Also queue into worker_jobs for asynchronous execution
    const jobId = crypto.randomUUID();
    await this.client.query(
      `INSERT INTO worker_jobs (
        id, company_id, event_id, status, attempts, available_at, created_at, updated_at
      ) VALUES ($1, $2, $3, 'PENDING', 0, $4, $4, $4)`,
      [jobId, companyId, eventId, occurredAt]
    );

    this.stagedOutboxEvents.push({
      ...event,
      id: eventId,
      companyId,
      occurredAt
    });

    return eventId;
  }

  /**
   * Record audit event within the transaction
   */
  async recordAudit(params: {
    action: string;
    entityKind: string;
    entityId: string;
    operationId: string;
    projectId?: string;
    beforeDigest?: string;
    afterDigest?: string;
  }): Promise<void> {
    const auditId = crypto.randomUUID();
    await this.client.query(
      `INSERT INTO audit_events (
        id, company_id, project_id, actor_id, action, entity_kind, entity_id, operation_id, before_digest, after_digest, occurred_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, clock_timestamp())`,
      [
        auditId,
        this.context.companyId,
        params.projectId || this.context.projectId || null,
        this.context.actorId,
        params.action,
        params.entityKind,
        params.entityId,
        params.operationId,
        params.beforeDigest || null,
        params.afterDigest || null
      ]
    );
  }

  /**
   * Check or acquire idempotency guard within the transaction
   */
  async checkOrAcquireIdempotency(
    operationId: string,
    requestHash: string,
    projectIdOverride?: string
  ): Promise<IdempotencyCheckResult> {
    const projectId = projectIdOverride || this.context.projectId;
    if (!projectId) {
      throw new Error('Project ID required for idempotency checking');
    }

    const checkRes = await this.client.query<{
      state: IdempotencyState;
      request_hash: string;
      result_ref: string | null;
    }>(
      `SELECT state, request_hash, result_ref FROM idempotency_receipts
       WHERE company_id = $1 AND project_id = $2 AND operation_id = $3`,
      [this.context.companyId, projectId, operationId]
    );

    if (checkRes.rows.length > 0) {
      const existing = checkRes.rows[0];
      if (existing.request_hash !== requestHash) {
        throw new Error(`IDEMPOTENCY_PAYLOAD_MISMATCH: Operation ${operationId} previously called with different payload`);
      }
      return {
        isDuplicate: true,
        state: existing.state,
        resultRef: existing.result_ref
      };
    }

    // Insert IN_FLIGHT record
    const id = crypto.randomUUID();
    await this.client.query(
      `INSERT INTO idempotency_receipts (
        id, company_id, project_id, operation_id, actor_id, request_hash, state, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, 'IN_FLIGHT', clock_timestamp())`,
      [id, this.context.companyId, projectId, operationId, this.context.actorId, requestHash]
    );

    return { isDuplicate: false, state: 'IN_FLIGHT' };
  }

  /**
   * Commit idempotency record on successful operation completion
   */
  async commitIdempotency(
    operationId: string,
    resultRef?: string | null,
    projectIdOverride?: string
  ): Promise<void> {
    const projectId = projectIdOverride || this.context.projectId;
    await this.client.query(
      `UPDATE idempotency_receipts
       SET state = 'COMMITTED', result_ref = $4
       WHERE company_id = $1 AND project_id = $2 AND operation_id = $3`,
      [this.context.companyId, projectId, operationId, resultRef || null]
    );
  }
}

/**
 * Execute work inside an isolated, transaction-local tenant context
 */
export async function withUnitOfWork<T>(
  context: RequestContext,
  operation: (uow: UnitOfWork) => Promise<T>,
  poolOverride?: Pool,
  options?: { readOnlySnapshot: true }
): Promise<T> {
  if (!context.companyId) {
    throw new Error('Tenant isolation failure: context.companyId is required');
  }
  if (!context.actorId) {
    throw new Error('Security context failure: context.actorId is required');
  }

  const pool = poolOverride || getPool();
  const client = await pool.connect();
  let discard = false;
  // Checked-out clients emit socket errors independently of query rejection.
  // Mark them unusable while the operation/cleanup owns the connection.
  const onConnectionError = () => { discard = true; };
  client.on('error', onConnectionError);

  try {
    await assertServiceIdentity(client, 'qsa_runtime');
    await client.query(options?.readOnlySnapshot ? 'BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY' : 'BEGIN');

    // Switch to runtime role to enforce RLS (no bypass)
    await client.query('SET LOCAL ROLE qsa_runtime');

    // CRITICAL: is_local is set to true (3rd argument).
    // This ensures settings automatically reset when transaction terminates.
    if (options?.readOnlySnapshot) {
      await client.query("SELECT set_config('app.company_id',$1,true),set_config('app.actor_id',$2,true),set_config('app.project_id',$3,true)",
        [context.companyId,context.actorId,context.projectId || '']);
    } else {
      await client.query("SELECT set_config('app.company_id', $1, true)", [context.companyId]);
      await client.query("SELECT set_config('app.actor_id', $1, true)", [context.actorId]);

      if (context.projectId) {
        await client.query("SELECT set_config('app.project_id', $1, true)", [context.projectId]);
      } else {
        await client.query("SELECT set_config('app.project_id', '', true)");
      }
    }

    const uow = new UnitOfWork(client, context);
    const result = await operation(uow);

    await client.query('COMMIT');
    return result;
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rbErr) {
      // A failed rollback leaves transaction/security state unknown.
      discard = true;
    }
    throw error;
  } finally {
    // DISCARD ALL runs outside a transaction and removes role, GUCs, temporary
    // objects and prepared statements. Any failure evicts the physical client.
    try {
      if (!discard) await client.query('DISCARD ALL');
    } catch {
      discard = true;
    }
    client.release(discard);
    client.removeListener('error', onConnectionError);
  }
}
