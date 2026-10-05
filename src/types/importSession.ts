/**
 * Q-SAUDI — Smart Import Session & Checkpoint Contract
 * Unit 3A.1: Bounded Persistence & Resumption Schema
 */

import { RosterSmartImportStage } from '../services/import/rosterSmartImportWorkflow.service';
import { ImportResult, UnifiedImportBatch } from './unifiedImport';

export type ImportSessionLifecycleState =
  | 'SOURCE'
  | 'DISCOVERED'
  | 'MAPPING'
  | 'RESOLUTION'
  | 'REVIEW'
  | 'COMMITTING'
  | 'COMMITTED'
  | 'FAILED'
  | 'CANCELLED'
  | 'REJECTED';

export const ROSTER_STAGE_TO_LIFECYCLE_MAP: Record<RosterSmartImportStage, ImportSessionLifecycleState> = {
  SOURCE_DISCOVERY: 'DISCOVERED',
  MAPPING_APPROVAL: 'MAPPING',
  CARRIER_RESOLUTION: 'RESOLUTION',
  MATERIAL_RESOLUTION: 'RESOLUTION',
  DRIVER_TRUCK_RESOLUTION: 'RESOLUTION',
  FINAL_REVIEW: 'REVIEW',
  COMMIT_RESULT: 'COMMITTING',
};

export const LIFECYCLE_TO_ROSTER_STAGE_MAP: Record<ImportSessionLifecycleState, RosterSmartImportStage> = {
  SOURCE: 'SOURCE_DISCOVERY',
  DISCOVERED: 'SOURCE_DISCOVERY',
  MAPPING: 'MAPPING_APPROVAL',
  RESOLUTION: 'CARRIER_RESOLUTION',
  REVIEW: 'FINAL_REVIEW',
  COMMITTING: 'COMMIT_RESULT',
  COMMITTED: 'COMMIT_RESULT',
  FAILED: 'COMMIT_RESULT',
  CANCELLED: 'SOURCE_DISCOVERY',
  REJECTED: 'SOURCE_DISCOVERY',
};

/**
 * Safe, serializable source discovery metadata.
 * STRICT FORBIDDEN PAYLOAD: NEVER contains File, Blob, ArrayBuffer, or credentials.
 */
export interface SafeDiscoveryMetadata {
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  sheetNames?: string[];
  selectedSheet?: string;
  headers?: string[];
  detectedColumns?: Record<string, string>;
  sampleRowCount?: number;
}

/**
 * Checkpoint payload representing the durable snapshot of a Smart Import session.
 */
export interface SmartImportCheckpointData {
  rosterStage: RosterSmartImportStage;
  lifecycleState: ImportSessionLifecycleState;
  importBatch: UnifiedImportBatch;
  smartImportCommitResult?: ImportResult | null;
  isRosterMappingApproved?: boolean;
  discoveryMetadata?: SafeDiscoveryMetadata | null;
}

/**
 * Full Import Session document stored on the server at:
 * projects/{projectId}/importSessions/{importSessionId}
 */
export interface ImportSessionRecord {
  importSessionId: string;
  projectId: string;
  operationId: string;
  importBatchId: string;
  sourceType: string;
  lifecycleState: ImportSessionLifecycleState;
  currentStage: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  sourceMetadata?: SafeDiscoveryMetadata;
  rosterStage?: RosterSmartImportStage;
  importBatch?: UnifiedImportBatch | null;
  smartImportCommitResult?: ImportResult | null;
  isRosterMappingApproved?: boolean;
  rosterDiscoveryResult?: SafeDiscoveryMetadata | null;
  validationIssues?: any[];
  warningConfirmation?: boolean;
  [key: string]: any;
}

export interface CreateImportSessionPayload {
  importSessionId?: string;
  operationId?: string;
  importBatchId?: string;
  sourceType?: string;
  lifecycleState?: ImportSessionLifecycleState;
  currentStage?: string;
  rosterStage?: RosterSmartImportStage;
  importBatch?: UnifiedImportBatch | null;
  smartImportCommitResult?: ImportResult | null;
  isRosterMappingApproved?: boolean;
  sourceMetadata?: SafeDiscoveryMetadata;
  rosterDiscoveryResult?: SafeDiscoveryMetadata | null;
}

export interface UpdateImportSessionPayload {
  lifecycleState?: ImportSessionLifecycleState;
  currentStage?: string;
  rosterStage?: RosterSmartImportStage;
  importBatch?: UnifiedImportBatch;
  smartImportCommitResult?: ImportResult | null;
  isRosterMappingApproved?: boolean;
  sourceMetadata?: SafeDiscoveryMetadata;
  rosterDiscoveryResult?: SafeDiscoveryMetadata | null;
  [key: string]: any;
}
