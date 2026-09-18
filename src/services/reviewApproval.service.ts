/**
 * BLOCK 125 — Review-Gated Approval & Stale Approval Protection Service
 * Cryptographically and version-wise binds human approval decisions to immutable review artifacts.
 * Prevents stale approvals and guards against unauthorized or out-of-sequence approvals.
 */

import crypto from 'crypto';
import { 
  CanonicalApprovalRecord, 
  ApprovalDecision, 
  ApprovalStatus, 
  StaleEvaluationResult 
} from '../types/reviewApproval';
import { CanonicalReviewArtifact } from '../types/reviewArtifact';
import { canonicalReviewArtifactService, canonicalize } from './reviewArtifact.service';
import { importSessionManager, ImportSession } from './importSessionManager';
import { securityService, auditService } from './canonicalServices';
import { 
  AuthorizationContext, 
  ConcurrencyContext, 
  DomainError, 
  DomainErrorCode, 
  DomainOperation 
} from '../types/canonicalContracts';

function createDomainError(code: DomainErrorCode, message: string, retryable = false): DomainError {
  const err = new Error(message) as DomainError;
  err.code = code;
  err.retryable = retryable;
  return err;
}

/**
 * Computes deterministic SHA-256 digest for an approval record payload.
 */
export function computeApprovalHash(payload: {
  importSessionId: string;
  projectId: string;
  artifactId: string;
  artifactVersion: number;
  contentHash: string;
  reviewerId: string;
  approvedAt: string;
  decision: ApprovalDecision;
  concurrencyVersion: number;
}): string {
  const canonicalPayload = canonicalize(payload);
  return crypto.createHash('sha256').update(JSON.stringify(canonicalPayload), 'utf8').digest('hex');
}

export class CanonicalReviewApprovalService {
  // In-memory append-only registry for approvals (scoped to runtime session)
  private approvalRegistry: Map<string, CanonicalApprovalRecord[]> = new Map();

  /**
   * Evaluates whether an existing approval record is strictly current and valid for a given review artifact.
   */
  isApprovalCurrent(approval: CanonicalApprovalRecord, currentArtifact: CanonicalReviewArtifact): boolean {
    const evalResult = this.evaluateApprovalStatus(approval, currentArtifact);
    return evalResult.isCurrent;
  }

  /**
   * Performs deep evaluation of an approval against a review artifact, identifying stale, invalid, or current states.
   */
  evaluateApprovalStatus(
    approval: CanonicalApprovalRecord, 
    currentArtifact: CanonicalReviewArtifact
  ): StaleEvaluationResult {
    if (!approval || !currentArtifact) {
      return {
        isCurrent: false,
        status: 'INVALID',
        reasonCode: 'MISSING_PARAMETERS',
        message: 'Both approval record and current review artifact are required.'
      };
    }

    if (approval.decision === 'REJECTED') {
      return {
        isCurrent: false,
        status: 'REJECTED',
        reasonCode: 'DECISION_WAS_REJECTED',
        message: 'The import was explicitly rejected by the reviewer.'
      };
    }

    const details = {
      approvalSessionId: approval.importSessionId,
      artifactSessionId: currentArtifact.importSessionId,
      approvalArtifactId: approval.artifactId,
      currentArtifactId: currentArtifact.artifactId,
      approvalVersion: approval.artifactVersion,
      currentVersion: currentArtifact.artifactVersion,
      approvalContentHash: approval.contentHash,
      currentContentHash: currentArtifact.contentHash
    };

    // 1. Session Binding Check
    if (approval.importSessionId !== currentArtifact.importSessionId) {
      return {
        isCurrent: false,
        status: 'INVALID',
        reasonCode: 'SESSION_MISMATCH',
        message: `Approval belongs to session ${approval.importSessionId}, but artifact belongs to ${currentArtifact.importSessionId}.`,
        details
      };
    }

    // 2. Project Scope Check
    if (approval.projectId !== currentArtifact.projectId) {
      return {
        isCurrent: false,
        status: 'INVALID',
        reasonCode: 'PROJECT_MISMATCH',
        message: `Approval project ${approval.projectId} does not match artifact project ${currentArtifact.projectId}.`,
        details
      };
    }

    // 3. Artifact Integrity Check
    const isIntegrityValid = canonicalReviewArtifactService.verifyArtifact(currentArtifact);
    if (!isIntegrityValid) {
      return {
        isCurrent: false,
        status: 'INVALID',
        reasonCode: 'CORRUPT_ARTIFACT_INTEGRITY',
        message: 'Current review artifact content does not match its internal cryptographic contentHash.',
        details
      };
    }

    // 4. Artifact Version Check (Stale Detection)
    if (approval.artifactVersion !== currentArtifact.artifactVersion) {
      return {
        isCurrent: false,
        status: 'STALE',
        reasonCode: 'ARTIFACT_VERSION_MISMATCH',
        message: `Approval was granted for artifact version ${approval.artifactVersion}, but current artifact is version ${currentArtifact.artifactVersion}.`,
        details
      };
    }

    // 5. Content Hash Check (Cryptographic Tamper / Content Mutation Detection)
    if (approval.contentHash !== currentArtifact.contentHash) {
      return {
        isCurrent: false,
        status: 'STALE',
        reasonCode: 'CONTENT_HASH_MISMATCH',
        message: 'Review artifact content has changed since approval was granted.',
        details
      };
    }

    // 6. Artifact ID Check (Stale Artifact Identity)
    if (approval.artifactId !== currentArtifact.artifactId) {
      return {
        isCurrent: false,
        status: 'STALE',
        reasonCode: 'ARTIFACT_ID_MISMATCH',
        message: `Approval artifact ID ${approval.artifactId} does not match current artifact ID ${currentArtifact.artifactId}.`,
        details
      };
    }

    return {
      isCurrent: true,
      status: 'APPROVED',
      reasonCode: 'VALID_AND_CURRENT',
      message: 'Approval is current and cryptographically bound to the active review artifact.',
      details
    };
  }

  /**
   * Records a review-gated human approval or rejection decision.
   * Enforces security authorization, lifecycle state validity, concurrency guards, and immutability binding.
   */
  async recordApproval(
    session: ImportSession,
    artifact: CanonicalReviewArtifact,
    decision: ApprovalDecision,
    concurrency: ConcurrencyContext,
    auth: AuthorizationContext,
    comment?: string
  ): Promise<{ session: ImportSession; approval: CanonicalApprovalRecord }> {
    if (!session || !session.importSessionId) {
      throw createDomainError('VALIDATION_ERROR', 'A valid import session is required.');
    }
    if (!artifact || !artifact.artifactId) {
      throw createDomainError('VALIDATION_ERROR', 'A valid review artifact is required.');
    }

    // 1. Session State Guard
    if (session.state !== 'REVIEW_REQUIRED') {
      throw createDomainError(
        'INVALID_STATE_TRANSITION',
        `Approval is allowed only when session is in REVIEW_REQUIRED state (current state: ${session.state}).`
      );
    }

    // 2. Artifact Status Guard
    if (artifact.artifactStatus !== 'REVIEW_REQUIRED') {
      throw createDomainError(
        'INVALID_STATE_TRANSITION',
        `Approval is allowed only for artifacts in REVIEW_REQUIRED status (current status: ${artifact.artifactStatus}).`
      );
    }

    // 3. Session & Project Binding Verification
    if (artifact.importSessionId !== session.importSessionId) {
      throw createDomainError(
        'VALIDATION_ERROR',
        `Artifact session (${artifact.importSessionId}) does not match target session (${session.importSessionId}).`
      );
    }
    if (artifact.projectId !== session.projectId) {
      throw createDomainError(
        'PROJECT_SCOPE_ERROR',
        `Artifact project (${artifact.projectId}) does not match session project (${session.projectId}).`
      );
    }

    // 4. Cryptographic Artifact Integrity Verification
    const isIntegrityValid = canonicalReviewArtifactService.verifyArtifact(artifact);
    if (!isIntegrityValid) {
      throw createDomainError(
        'VALIDATION_ERROR',
        'Review artifact content integrity verification failed (contentHash mismatch).'
      );
    }

    // 5. Security Authorization Check
    const perm = securityService.evaluatePermission(
      auth,
      'APPROVE' as DomainOperation,
      'IMPORT_OPERATION',
      session.projectId,
      session.state
    );
    if (!perm.allowed) {
      throw createDomainError('AUTHORIZATION_ERROR', perm.reasonCode || 'User is not authorized to approve imports.');
    }

    // Extra explicit check for read-only roles
    if (auth.globalRole !== 'SUPER_ADMIN') {
      const membership = auth.memberships[session.projectId];
      if (!membership || membership.role === 'VIEWER' || membership.role === 'FINANCE_AUDITOR') {
        throw createDomainError('AUTHORIZATION_ERROR', 'Read-only roles cannot approve import sessions.');
      }
    }

    // 6. Concurrency Version Check
    if (session.version !== concurrency.expectedVersion) {
      throw createDomainError(
        'VERSION_CONFLICT',
        `Stale concurrency error: expected session version ${concurrency.expectedVersion}, got ${session.version}`
      );
    }

    const approvedAt = new Date().toISOString();
    const approvalId = `app_${session.importSessionId}_v${artifact.artifactVersion}_${Date.now()}`;

    const hashPayload = {
      importSessionId: session.importSessionId,
      projectId: session.projectId,
      artifactId: artifact.artifactId,
      artifactVersion: artifact.artifactVersion,
      contentHash: artifact.contentHash,
      reviewerId: auth.userId,
      approvedAt,
      decision,
      concurrencyVersion: concurrency.expectedVersion
    };

    const immutabilityHash = computeApprovalHash(hashPayload);

    const approvalRecord: CanonicalApprovalRecord = Object.freeze({
      approvalId,
      importSessionId: session.importSessionId,
      projectId: session.projectId,
      artifactId: artifact.artifactId,
      artifactVersion: artifact.artifactVersion,
      contentHash: artifact.contentHash,
      reviewerId: auth.userId,
      reviewerEmail: auth.email,
      reviewerDisplayName: auth.displayName,
      approvedAt,
      decision,
      approvalStatus: decision === 'APPROVED' ? 'APPROVED' : 'REJECTED',
      comment,
      concurrencyVersion: concurrency.expectedVersion,
      immutabilityHash
    });

    // 7. Session State Transition (REVIEW_REQUIRED -> APPROVED or REJECTED)
    const targetState = decision === 'APPROVED' ? 'APPROVED' : 'REJECTED';
    const updatedSession = await importSessionManager.transitionState(
      session,
      targetState,
      concurrency,
      auth
    );
    updatedSession.approvalIdentity = approvalId;

    // 8. Append-only in-memory storage of approval
    const existingList = this.approvalRegistry.get(session.importSessionId) || [];
    existingList.push(approvalRecord);
    this.approvalRegistry.set(session.importSessionId, existingList);

    // 9. Immutable Audit Event Logging
    await auditService.logAuditEvent({
      actorId: auth.userId,
      action: decision === 'APPROVED' ? 'APPROVE_IMPORT_ARTIFACT' : 'REJECT_IMPORT_ARTIFACT',
      targetEntity: 'IMPORT_OPERATION',
      targetId: session.importSessionId,
      projectId: session.projectId,
      changesSummary: `Recorded ${decision} for artifact ${artifact.artifactId} (v${artifact.artifactVersion}, hash ${artifact.contentHash}) with approval ${approvalId}`
    });

    return {
      session: updatedSession,
      approval: approvalRecord
    };
  }

  /**
   * Retrieves all historical approval/rejection records for an import session.
   */
  getApprovalHistory(importSessionId: string): CanonicalApprovalRecord[] {
    const list = this.approvalRegistry.get(importSessionId) || [];
    return [...list];
  }
}

export const canonicalReviewApprovalService = new CanonicalReviewApprovalService();
