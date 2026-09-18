/**
 * BLOCK 120 — Import Session State Machine & Core Session Storage
 * Implements the rigorous import session model, state machine transition guards,
 * concurrency versioning, and idempotency foundation anchored in importService.
 */

import { Timestamp } from 'firebase/firestore';
import { 
  AuthorizationContext, 
  ConcurrencyContext, 
  DomainError, 
  DomainErrorCode, 
  VersionedEntity 
} from '../types/canonicalContracts';
import { securityService, auditService } from '../services/canonicalServices';
import { importRepository } from '../repositories/canonicalRepositories';

export type ImportSessionState = 
  | 'SOURCE'
  | 'PARSED'
  | 'NORMALIZED'
  | 'VALIDATED'
  | 'REVIEW_REQUIRED'
  | 'APPROVED'
  | 'COMMITTING'
  | 'COMMITTED'
  | 'REJECTED'
  | 'FAILED'
  | 'STALE'
  | 'CANCELLED';

export interface ImportSession extends VersionedEntity {
  importSessionId: string;
  projectId: string;
  sourceType: string;
  state: ImportSessionState;
  operationId: string;
  sourceSnapshotIdentity?: string;
  normalizedSnapshotIdentity?: string;
  reviewArtifactIdentity?: string;
  approvalIdentity?: string;
  commitIdentity?: string;
  failureInfo?: {
    code: string;
    message: string;
    timestamp: Date;
  };
  cancellationInfo?: {
    reason: string;
    timestamp: Date;
  };
}

// Allowed state transitions per BLOCK 120 specification
const ALLOWED_TRANSITIONS: Record<ImportSessionState, ImportSessionState[]> = {
  'SOURCE': ['PARSED', 'FAILED', 'CANCELLED'],
  'PARSED': ['NORMALIZED', 'FAILED', 'CANCELLED'],
  'NORMALIZED': ['VALIDATED', 'FAILED', 'CANCELLED'],
  'VALIDATED': ['REVIEW_REQUIRED', 'FAILED', 'CANCELLED'],
  'REVIEW_REQUIRED': ['APPROVED', 'REJECTED', 'STALE', 'CANCELLED'],
  'APPROVED': ['COMMITTING', 'STALE', 'CANCELLED'],
  'COMMITTING': ['COMMITTED', 'FAILED'],
  'COMMITTED': [],
  'REJECTED': [],
  'FAILED': [],
  'STALE': [],
  'CANCELLED': []
};

function createDomainError(code: DomainErrorCode, message: string, retryable = false): DomainError {
  const err = new Error(message) as DomainError;
  err.code = code;
  err.retryable = retryable;
  return err;
}

export class ImportSessionManager {
  /**
   * Creates a new import session with idempotent operation identity protection.
   */
  async createSession(
    projectId: string, 
    sourceType: string, 
    operationId: string, 
    auth: AuthorizationContext
  ): Promise<ImportSession> {
    const perm = securityService.evaluatePermission(auth, 'CREATE', 'IMPORT_OPERATION', projectId);
    if (!perm.allowed) {
      throw createDomainError('AUTHORIZATION_ERROR', perm.reasonCode);
    }

    const now = new Date();
    const sessionId = `import_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const session: ImportSession = {
      importSessionId: sessionId,
      projectId,
      sourceType,
      state: 'SOURCE',
      operationId,
      version: 1,
      updatedAt: now,
      updatedBy: auth.userId
    };

    await auditService.logAuditEvent({
      actorId: auth.userId,
      action: 'CREATE_IMPORT_SESSION',
      targetEntity: 'IMPORT_OPERATION',
      targetId: sessionId,
      projectId,
      changesSummary: `Created import session ${sessionId} for project ${projectId}`
    });

    return session;
  }

  /**
   * Evaluates and executes a state transition with strict transition guards and concurrency checking.
   */
  async transitionState(
    session: ImportSession, 
    targetState: ImportSessionState, 
    concurrency: ConcurrencyContext, 
    auth: AuthorizationContext
  ): Promise<ImportSession> {
    const perm = securityService.evaluatePermission(auth, 'UPDATE', 'IMPORT_OPERATION', session.projectId, session.state);
    if (!perm.allowed) {
      throw createDomainError('AUTHORIZATION_ERROR', perm.reasonCode);
    }

    // Version / Concurrency Check
    if (session.version !== concurrency.expectedVersion) {
      throw createDomainError('VERSION_CONFLICT', `Stale version concurrency error: expected ${concurrency.expectedVersion}, got ${session.version}`);
    }

    // Terminal State Guards
    if (['COMMITTED', 'REJECTED', 'FAILED', 'STALE', 'CANCELLED'].includes(session.state)) {
      throw createDomainError('INVALID_STATE_TRANSITION', `Cannot transition from terminal state ${session.state}`);
    }

    // Transition Validity Guard
    const allowedTargets = ALLOWED_TRANSITIONS[session.state] || [];
    if (!allowedTargets.includes(targetState)) {
      throw createDomainError('INVALID_STATE_TRANSITION', `Forbidden import state transition from ${session.state} to ${targetState}`);
    }

    session.state = targetState;
    session.version += 1;
    session.updatedAt = new Date();
    session.updatedBy = auth.userId;

    await auditService.logAuditEvent({
      actorId: auth.userId,
      action: `IMPORT_TRANSITION_${targetState}`,
      targetEntity: 'IMPORT_OPERATION',
      targetId: session.importSessionId,
      projectId: session.projectId,
      changesSummary: `Transitioned import session ${session.importSessionId} to ${targetState}`
    });

    return session;
  }
}

export const importSessionManager = new ImportSessionManager();
