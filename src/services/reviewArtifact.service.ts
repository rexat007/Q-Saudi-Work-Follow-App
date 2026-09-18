/**
 * BLOCK 124 — Review Artifact Generation & Immutability Binding Service
 * Creates deterministic, immutable, versioned review artifacts cryptographically bound
 * via SHA-256 content hash, preserving complete provenance without performing production writes.
 */

import crypto from 'crypto';
import { CanonicalReviewArtifact, ReviewArtifactSummary, ReviewArtifactStatus } from '../types/reviewArtifact';
import { ImportIssue } from '../types/unifiedImport';
import { ImportConflictItem } from './conflictEngine.service';
import { ImportSession } from './importSessionManager';
import { AuthorizationContext, DomainError, DomainErrorCode } from '../types/canonicalContracts';

function createDomainError(code: DomainErrorCode, message: string, retryable = false): DomainError {
  const err = new Error(message) as DomainError;
  err.code = code;
  err.retryable = retryable;
  return err;
}

/**
 * Recursively canonicalizes objects by sorting keys and stabilizing structures.
 */
export function canonicalize(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(canonicalize);
  }
  const sortedKeys = Object.keys(obj).sort();
  const result: Record<string, any> = {};
  for (const key of sortedKeys) {
    const val = obj[key];
    if (val !== undefined) {
      result[key] = canonicalize(val);
    }
  }
  return result;
}

/**
 * Computes deterministic SHA-256 content hash for review artifact content.
 */
export function computeArtifactHash(content: {
  importSessionId: string;
  projectId: string;
  artifactVersion: number;
  sourceMetadata: any;
  normalizedRows: any[];
  validationFindings: any[];
  duplicateFindings: any[];
  conflictFindings: any[];
  summary: any;
}): string {
  const canonicalContent = canonicalize(content);
  const serialized = JSON.stringify(canonicalContent);
  return crypto.createHash('sha256').update(serialized, 'utf8').digest('hex');
}

export class CanonicalReviewArtifactService {
  /**
   * Generates a deterministic, immutable, versioned review artifact from session, normalized rows, and findings.
   */
  generateArtifact(
    session: ImportSession,
    normalizedRows: Record<string, any>[],
    validationFindings: ImportIssue[],
    duplicateFindings: any[],
    conflictFindings: ImportConflictItem[],
    auth: AuthorizationContext,
    artifactVersion: number = 1
  ): CanonicalReviewArtifact {
    if (!session || !session.importSessionId) {
      throw createDomainError('VALIDATION_ERROR', 'Valid session is required to generate review artifact.');
    }

    // Defensive deep copy to guarantee input immutability
    const safeNormalizedRows = JSON.parse(JSON.stringify(normalizedRows || []));
    const safeValidationFindings = JSON.parse(JSON.stringify(validationFindings || []));
    const safeDuplicateFindings = JSON.parse(JSON.stringify(duplicateFindings || []));
    const safeConflictFindings = JSON.parse(JSON.stringify(conflictFindings || []));

    const sourceMetadata = {
      sourceType: session.sourceType,
      totalRows: safeNormalizedRows.length
    };

    // Calculate deterministic summary counts
    const blockingFindings = safeValidationFindings.filter((i: ImportIssue) => i.blocking || i.severity === 'BLOCKING').length;
    const nonBlockingFindings = safeValidationFindings.length - blockingFindings;
    const totalDuplicates = safeDuplicateFindings.length;
    const totalConflicts = safeConflictFindings.length;

    // Identify rows requiring review (rows with blocking errors, warnings, or conflicts)
    const reviewRowNumbers = new Set<number>();
    safeValidationFindings.forEach((i: ImportIssue) => { if (i.row) reviewRowNumbers.add(i.row); });
    safeDuplicateFindings.forEach((d: any) => { if (d.rowNumber) reviewRowNumbers.add(d.rowNumber); });
    safeConflictFindings.forEach((c: ImportConflictItem) => { if (c.sourceRowNumber) reviewRowNumbers.add(c.sourceRowNumber); });

    const summary: ReviewArtifactSummary = {
      totalSourceRecords: safeNormalizedRows.length,
      totalNormalizedRecords: safeNormalizedRows.length,
      totalValidationFindings: safeValidationFindings.length,
      totalDuplicates,
      totalConflicts,
      totalExceptions: blockingFindings,
      blockingFindings,
      nonBlockingFindings,
      recordsRequiringReview: reviewRowNumbers.size
    };

    const hashPayload = {
      importSessionId: session.importSessionId,
      projectId: session.projectId,
      artifactVersion,
      sourceMetadata,
      normalizedRows: safeNormalizedRows,
      validationFindings: safeValidationFindings,
      duplicateFindings: safeDuplicateFindings,
      conflictFindings: safeConflictFindings,
      summary
    };

    const contentHash = computeArtifactHash(hashPayload);
    const artifactId = `art_${session.importSessionId}_v${artifactVersion}_${contentHash.substring(0, 10)}`;

    const artifact: CanonicalReviewArtifact = {
      artifactId,
      importSessionId: session.importSessionId,
      projectId: session.projectId,
      artifactVersion,
      createdAt: new Date().toISOString(),
      createdBy: auth.userId,
      sourceMetadata,
      normalizedRows: safeNormalizedRows,
      validationFindings: safeValidationFindings,
      duplicateFindings: safeDuplicateFindings,
      conflictFindings: safeConflictFindings,
      summary,
      artifactStatus: 'REVIEW_REQUIRED',
      contentHash
    };

    // Freeze object to enforce runtime immutability
    return Object.freeze(artifact);
  }

  /**
   * Verifies whether an artifact's content matches its cryptographic content hash.
   */
  verifyArtifact(artifact: CanonicalReviewArtifact): boolean {
    const hashPayload = {
      importSessionId: artifact.importSessionId,
      projectId: artifact.projectId,
      artifactVersion: artifact.artifactVersion,
      sourceMetadata: artifact.sourceMetadata,
      normalizedRows: artifact.normalizedRows,
      validationFindings: artifact.validationFindings,
      duplicateFindings: artifact.duplicateFindings,
      conflictFindings: artifact.conflictFindings,
      summary: artifact.summary
    };
    const recomputedHash = computeArtifactHash(hashPayload);
    return recomputedHash === artifact.contentHash;
  }

  /**
   * Generates a new version of the review artifact if source/review content updates.
   */
  createNewVersion(
    existingArtifact: CanonicalReviewArtifact,
    newNormalizedRows: Record<string, any>[],
    newValidationFindings: ImportIssue[],
    newDuplicateFindings: any[],
    newConflictFindings: ImportConflictItem[],
    auth: AuthorizationContext,
    session: ImportSession
  ): CanonicalReviewArtifact {
    return this.generateArtifact(
      session,
      newNormalizedRows,
      newValidationFindings,
      newDuplicateFindings,
      newConflictFindings,
      auth,
      existingArtifact.artifactVersion + 1
    );
  }
}

export const canonicalReviewArtifactService = new CanonicalReviewArtifactService();
