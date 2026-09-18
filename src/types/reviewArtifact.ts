/**
 * BLOCK 124 — Review Artifact Generation & Immutability Binding Types
 */

import { ImportIssue } from './unifiedImport';
import { ImportConflictItem } from '../services/conflictEngine.service';

export type ReviewArtifactStatus = 'REVIEW_REQUIRED' | 'SUPERSEDED' | 'INVALIDATED';

export interface ReviewArtifactSummary {
  totalSourceRecords: number;
  totalNormalizedRecords: number;
  totalValidationFindings: number;
  totalDuplicates: number;
  totalConflicts: number;
  totalExceptions: number;
  blockingFindings: number;
  nonBlockingFindings: number;
  recordsRequiringReview: number;
}

export interface CanonicalReviewArtifact {
  artifactId: string;
  importSessionId: string;
  projectId: string;
  artifactVersion: number;
  createdAt: string; // ISO 8601
  createdBy: string; // userId
  sourceMetadata: {
    sourceType: string;
    sourceFileName?: string;
    totalRows: number;
  };
  normalizedRows: Record<string, any>[];
  validationFindings: ImportIssue[];
  duplicateFindings: any[];
  conflictFindings: ImportConflictItem[];
  summary: ReviewArtifactSummary;
  artifactStatus: ReviewArtifactStatus;
  contentHash: string;
}
