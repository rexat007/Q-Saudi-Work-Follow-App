import type { ReviewedRosterCommitReceipt } from './importSession';
export type ImportExecutionState = 'READY' | 'EXECUTING' | 'PARTIAL' | 'REVIEW_REQUIRED' | 'CANCELLED' | 'COMPLETED';
export interface ExecutionConsequence {
  id: string;
  kind: string;
  action: string;
  subject: string;
  target?: string;
}
export interface ImportExecutionOperation {
  projectId: string;
  importSessionId: string;
  operationId: string;
  importBatchId: string;
  executionKey: string;
  bindingHash: string;
  reviewedSignature: string;
  reviewArtifactDigest?: string;
  sourceRevisionId: string;
  mappingRevisionId: string;
  requestVersion: number;
  sessionVersion: number;
  version: number;
  fence: number;
  state: ImportExecutionState;
  groupCount: number;
  completedGroups: number;
  consequenceCount: number;
  completedConsequences: number;
  planManifest: {
    artifactId: string;
    count: number;
    digest: string;
  };
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  failure?: {
    groupId: string;
    code: string;
    retryable: boolean;
    reviewRequired: boolean;
  } | null;
  accumulated?: ReviewedRosterCommitReceipt;
  cancellation?: {
    requestedAt: string;
    requestedBy: string;
    acknowledgedAt?: string;
  };
  receipt?: ReviewedRosterCommitReceipt;
}
export interface ImportExecutionGroup {
  id: string;
  rows: number[];
  signatureDigest: string;
  provenanceDigest: string;
  currentProof: any[];
  plan: any;
  consequences: ExecutionConsequence[];
}
export interface ImportExecutionReceipt {
  groupId: string;
  bindingHash: string;
  fence: number;
  completedAt: string;
  completedBy: string;
  consequences: (ExecutionConsequence & {
    outcome: 'MUTATED' | 'SATISFIED';
    proof: {
      groupId: string;
      canonicalId?: string;
    };
  })[];
  result: ReviewedRosterCommitReceipt;
}
export interface ImportExecutionStatus {
  operation: ImportExecutionOperation;
  retryAllowed: boolean;
  reviewRequired: boolean;
  completed: ImportExecutionReceipt[];
  remaining: {
    groupId: string;
    consequences: ExecutionConsequence[];
  }[];
}
export type RosterExecutionCommitResponse = import('./importSession').ReviewedRosterCommitResponse | {
  lifecycleState: Exclude<ImportExecutionState, 'COMPLETED'>;
  execution: ImportExecutionStatus;
};
