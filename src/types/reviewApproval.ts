/**
 * BLOCK 125 — Review-Gated Approval & Stale Approval Protection Types
 * Cryptographically and version-wise binds human approval decisions to immutable review artifacts.
 */

export type ApprovalDecision = 'APPROVED' | 'REJECTED';
export type ApprovalStatus = 'APPROVED' | 'REJECTED' | 'STALE' | 'INVALID';

export interface CanonicalApprovalRecord {
  approvalId: string;
  importSessionId: string;
  projectId: string;
  artifactId: string;
  artifactVersion: number;
  contentHash: string;
  reviewerId: string;
  reviewerEmail?: string;
  reviewerDisplayName?: string;
  approvedAt: string; // ISO 8601
  decision: ApprovalDecision;
  approvalStatus: ApprovalStatus;
  comment?: string;
  concurrencyVersion: number;
  immutabilityHash: string; // SHA-256 cryptographic binding over approval payload
}

export interface StaleEvaluationResult {
  isCurrent: boolean;
  status: ApprovalStatus;
  reasonCode: string;
  message: string;
  details?: {
    approvalSessionId: string;
    artifactSessionId: string;
    approvalArtifactId: string;
    currentArtifactId: string;
    approvalVersion: number;
    currentVersion: number;
    approvalContentHash: string;
    currentContentHash: string;
  };
}
