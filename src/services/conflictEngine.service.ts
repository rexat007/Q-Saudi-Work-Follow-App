/**
 * BLOCK 123 — Conflict & Exception Resolution Engine
 * Implements canonical conflict and exception classification, resolution-intent analysis,
 * and session advancement (VALIDATED -> REVIEW_REQUIRED) without performing production writes.
 */

import { ImportSession, ImportSessionManager, importSessionManager } from './importSessionManager';
import { AuthorizationContext, ConcurrencyContext, DomainError, DomainErrorCode } from '../types/canonicalContracts';

function createDomainError(code: DomainErrorCode, message: string, retryable = false): DomainError {
  const err = new Error(message) as DomainError;
  err.code = code;
  err.retryable = retryable;
  return err;
}

export type ConflictCategory =
  | 'DUPLICATE_RECORD'
  | 'CONFLICTING_RECORD'
  | 'MISSING_REQUIRED_RELATION'
  | 'INVALID_PROJECT_MEMBERSHIP'
  | 'PRICING_DISCREPANCY'
  | 'TRIP_ANOMALY'
  | 'UNRESOLVABLE_VALIDATION_FINDING'
  | 'SOURCE_DATA_INCONSISTENCY';

export type ResolutionIntent =
  | 'ACCEPT_SOURCE'
  | 'KEEP_EXISTING'
  | 'REJECT_SOURCE_RECORD'
  | 'MERGE_REVIEW_REQUIRED'
  | 'MANUAL_CORRECTION_REQUIRED'
  | 'ASSIGN_RELATIONSHIP'
  | 'PRICING_REVIEW_REQUIRED'
  | 'INVESTIGATION_REQUIRED'
  | 'NO_AUTOMATIC_RESOLUTION';

export interface ImportConflictItem {
  conflictId: string;
  importSessionId: string;
  sourceRowNumber: number;
  category: ConflictCategory;
  severity: 'BLOCKING' | 'WARNING' | 'INFO';
  description: string;
  conflictingFields: string[];
  competingValues: { source?: any; existing?: any };
  resolutionIntent: ResolutionIntent;
  status: 'PENDING_REVIEW';
}

export interface ConflictClassificationResult {
  session: ImportSession;
  conflicts: ImportConflictItem[];
  totalConflicts: number;
}

export class CanonicalConflictEngine {
  /**
   * Analyzes validation issues and duplicates, classifying them into structured conflicts and exception cases,
   * then transitions the session VALIDATED -> REVIEW_REQUIRED.
   */
  async classifyAndTransitionToReview(
    session: ImportSession,
    validationIssues: any[],
    duplicates: any[],
    concurrency: ConcurrencyContext,
    auth: AuthorizationContext
  ): Promise<ConflictClassificationResult> {
    if (session.state !== 'VALIDATED') {
      throw createDomainError('INVALID_STATE_TRANSITION', `Cannot classify conflicts for session in state ${session.state}; expected VALIDATED`);
    }

    const conflicts: ImportConflictItem[] = [];

    // 1. Classify duplicates as conflicts
    for (const dup of duplicates) {
      conflicts.push({
        conflictId: `conflict_dup_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        importSessionId: session.importSessionId,
        sourceRowNumber: dup.rowNumber || 0,
        category: 'DUPLICATE_RECORD',
        severity: 'WARNING',
        description: `Duplicate record detected for key ${dup.duplicateInfo?.matchKey || 'unknown'}.`,
        conflictingFields: ['ticketId', 'truckNo'],
        competingValues: { source: dup.raw },
        resolutionIntent: 'MERGE_REVIEW_REQUIRED',
        status: 'PENDING_REVIEW'
      });
    }

    // 2. Classify validation issues as conflicts or exceptions
    for (const issue of (validationIssues || [])) {
      const isBlocking = issue.blocking || issue.severity === 'BLOCKING';
      const category: ConflictCategory = isBlocking ? 'UNRESOLVABLE_VALIDATION_FINDING' : 'SOURCE_DATA_INCONSISTENCY';

      conflicts.push({
        conflictId: `conflict_iss_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        importSessionId: session.importSessionId,
        sourceRowNumber: issue.rowNumber || 0,
        category,
        severity: isBlocking ? 'BLOCKING' : 'WARNING',
        description: issue.message || issue.error || 'Validation finding requires review.',
        conflictingFields: issue.field ? [issue.field] : [],
        competingValues: { source: issue.value },
        resolutionIntent: isBlocking ? 'MANUAL_CORRECTION_REQUIRED' : 'INVESTIGATION_REQUIRED',
        status: 'PENDING_REVIEW'
      });
    }

    // Transition session VALIDATED -> REVIEW_REQUIRED
    const updatedSession = await importSessionManager.transitionState(session, 'REVIEW_REQUIRED', concurrency, auth);
    updatedSession.reviewArtifactIdentity = `review_precursor_${Date.now()}`;

    return {
      session: updatedSession,
      conflicts,
      totalConflicts: conflicts.length
    };
  }
}

export const canonicalConflictEngine = new CanonicalConflictEngine();
