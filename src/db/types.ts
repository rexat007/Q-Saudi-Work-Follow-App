/**
 * Database Types and Contracts for Q-Saudi Work Follow
 * Architecture Authority: ARCH-R1 / Revision 1.2 & ADR-001
 * Permitted Scope: AR2-U01 Infrastructure, Types, and Contracts
 */

export type DbRole = 'qsa_migrator' | 'qsa_runtime' | 'qsa_worker';

export interface RequestContext {
  companyId: string;
  projectId?: string;
  actorId: string;
}

export interface MigrationRecord {
  id?: number;
  version: string;
  name: string;
  checksum: string;
  applied_at?: Date;
}

export interface MigrationResult {
  applied: string[];
  verified: string[];
  skipped: string[];
}

export interface OutboxEvent {
  id?: string;
  companyId: string;
  projectId: string;
  aggregateType: string;
  aggregateId: string;
  eventType: string;
  aggregateVersion: number;
  payload: Record<string, unknown>;
  occurredAt?: Date;
}

export type IdempotencyState = 'IN_FLIGHT' | 'COMMITTED' | 'FAILED';

export interface IdempotencyRecord {
  companyId: string;
  projectId: string;
  operationId: string;
  actorId: string;
  requestHash: string;
  resultRef?: string | null;
  state: IdempotencyState;
}

export interface UserAuthContext {
  userId: string;
  firebaseUid: string;
  companyId: string;
  role: string;
  status: 'ACTIVE' | 'SUSPENDED';
  accessibleProjectIds: string[];
}
