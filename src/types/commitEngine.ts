/**
 * BLOCK 126 — Transactional Commit Engine Contracts
 * Strict types for commit orchestration, canonical domain service delegation,
 * idempotency, concurrency, and audit trails.
 */

import { 
  AuthorizationContext, 
  ConcurrencyContext, 
  DomainError, 
  DomainErrorCode, 
  IdempotencyContext 
} from './canonicalContracts';
import { ImportSession, ImportSessionState } from '../services/importSessionManager';
import { CanonicalReviewArtifact } from './reviewArtifact';
import { CanonicalApprovalRecord } from './reviewApproval';

export type CommitPhase = 
  | 'PRE_COMMIT_VERIFICATION'
  | 'SESSION_COMMITTING'
  | 'DOMAIN_DELEGATION'
  | 'SESSION_COMMITTED'
  | 'AUDIT_RECORDING';

export type CommitStatus = 
  | 'COMMITTED'
  | 'FAILED'
  | 'ABORTED';

export interface CommittedDomainEntityRef {
  entityType: 'TRIP' | 'PROJECT_ROSTER' | 'DRIVER' | 'TRUCK' | 'PRICING_RULE' | 'EXCEPTION';
  entityId: string;
  projectId: string;
  operation: 'CREATE' | 'UPDATE';
  canonicalService: 'tripService' | 'projectRosterService' | 'driverTruckIntakeService' | 'pricingService' | 'exceptionService';
  idempotencyKey?: string;
  committedAt: string;
}

export interface CommitPreVerificationResult {
  isValid: boolean;
  sessionValid: boolean;
  artifactValid: boolean;
  approvalValid: boolean;
  approvalCurrent: boolean;
  projectMatch: boolean;
  concurrencyValid: boolean;
  failures: string[];
}

export interface CanonicalCommitRecord {
  commitId: string;
  importSessionId: string;
  projectId: string;
  artifactId: string;
  artifactVersion: number;
  contentHash: string;
  approvalId: string;
  status: CommitStatus;
  committerId: string;
  committerEmail: string;
  committerDisplayName: string;
  committedAt: string;
  totalRecordsProcessed: number;
  totalCommittedEntities: number;
  committedEntities: CommittedDomainEntityRef[];
  failureDetails?: {
    code: DomainErrorCode | string;
    message: string;
    phase: CommitPhase;
    timestamp: string;
  };
  immutabilityHash: string;
}

export interface CommitExecutionResult {
  success: boolean;
  session: ImportSession;
  commitRecord: CanonicalCommitRecord;
  error?: DomainError;
}
