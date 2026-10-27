import { importSessionClientService as durableClient } from '../importSessionClient.service';
import { assertSessionPayload, reconstructSmartImportResumeState } from './durableSessionContract';

export interface SourceMetadata {
  sourceFileName?: string;
  sourceMimeType?: string;
  sourceSheetName?: string;
  fileSize?: number;
  headerRowIndex?: number;
  [key: string]: any;
}

export interface CreateImportSessionClientPayload {
  importSessionId?: string;
  projectId: string;
  operationId?: string;
  importBatchId?: string;
  sourceType?: string;
  lifecycleState?: string;
  currentStage?: string;
  sourceMetadata?: SourceMetadata;
  reviewSnapshot?: any;
  entityResolutions?: any[];
  reviewAction?: any;
  validationIssues?: any[];
  warningConfirmation?: boolean;
  [key: string]: any;
}

export interface ImportSessionCheckpointUpdates {
  lifecycleState?: string;
  currentStage?: string;
  reviewSnapshot?: any;
  entityResolutions?: any[];
  reviewAction?: any;
  validationIssues?: any[];
  warningConfirmation?: boolean;
  sourceMetadata?: SourceMetadata;
  [key: string]: any;
}

export interface ImportSessionRecord {
  importSessionId: string;
  projectId: string;
  operationId: string;
  importBatchId: string;
  sourceType: string;
  lifecycleState: string;
  currentStage: string;
  version: number;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  sourceMetadata: SourceMetadata;
  reviewSnapshot?: any;
  entityResolutions?: any[];
  reviewAction?: any;
  validationIssues?: any[];
  warningConfirmation?: boolean;
  importBatch?: any;
  source?: any;
  schemaVersion?: number;
}

export interface ResumedImportBatchState {
  importSessionId: string;
  projectId: string;
  operationId: string;
  importBatchId: string;
  sourceType: string;
  lifecycleState: string;
  version: number;
  sourceMetadata: SourceMetadata;
  reviewSnapshot: any;
  entityResolutions: any[];
  reviewAction: any;
  validationIssues: any[];
  warningConfirmation: boolean;
  requiresSourceFileReattach: boolean;
  durableStage?: string;
  legacyClassification?: string;
}

export class ImportSessionClientService {
  /**
   * Helper to generate stable client-side IDs for new import flows
   */
  generateStableIdentities() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return {
      operationId: `op_${timestamp}_${random}`,
      importBatchId: `batch_${timestamp}_${random}`,
    };
  }

  /**
   * Create a new server-authoritative import session
   */
  async createSession(
    projectId: string,
    payload: CreateImportSessionClientPayload
  ): Promise<ImportSessionRecord> {
    if (!projectId) {
      const err: any = new Error('projectId is required');
      err.code = 'INVALID_PROJECT_ID';
      throw err;
    }

    assertSessionPayload(payload);
    const stable = (!payload.operationId || !payload.importBatchId) ? this.generateStableIdentities() : null;
    // Shape adapter only: one create, always the canonical initial state. Source acceptance is a host command.
    return durableClient.createSession(projectId, {
      ...payload, domain: 'TRIP', operationId: payload.operationId || stable!.operationId,
      importBatchId: payload.importBatchId || stable!.importBatchId,
      lifecycleState: 'SOURCE', currentStage: 'PARSING',
    } as any) as any;
  }

  /**
   * Get an existing import session
   */
  async getSession(projectId: string, importSessionId: string): Promise<ImportSessionRecord> {
    if (!projectId || !importSessionId) {
      const err: any = new Error('projectId and importSessionId are required');
      err.code = 'INVALID_PARAMS';
      throw err;
    }

    return durableClient.getSession(projectId, importSessionId) as any;
  }

  /**
   * Update checkpoint with optimistic concurrency
   */
  async updateCheckpoint(
    projectId: string,
    importSessionId: string,
    updates: ImportSessionCheckpointUpdates,
    expectedVersion: number
  ): Promise<ImportSessionRecord> {
    if (!projectId || !importSessionId) {
      const err: any = new Error('projectId and importSessionId are required');
      err.code = 'INVALID_PARAMS';
      throw err;
    }

    if (typeof expectedVersion !== 'number') {
      const err: any = new Error('expectedVersion is required and must be a number');
      err.code = 'INVALID_CONCURRENCY_VERSION';
      throw err;
    }

    assertSessionPayload(updates);
    // The server validates the transition and OCC in one transaction. No preflight GET or hidden state walking.
    return durableClient.updateCheckpoint(projectId, importSessionId, updates as any, expectedVersion) as any;
  }

  /**
   * Pure mapper: reconstructs a resumed review state from a persisted server session record
   */
  reconstructResumedBatch(sessionRecord: ImportSessionRecord): ResumedImportBatchState {
    if (!sessionRecord) {
      throw new Error('sessionRecord is required for resume mapping');
    }

    const state = reconstructSmartImportResumeState(sessionRecord, sessionRecord.projectId);

    return {
      importSessionId: sessionRecord.importSessionId,
      projectId: sessionRecord.projectId,
      operationId: sessionRecord.operationId,
      importBatchId: sessionRecord.importBatchId,
      sourceType: sessionRecord.sourceType,
      lifecycleState: state.legacy ? 'SOURCE' : sessionRecord.lifecycleState,
      durableStage: state.durableStage,
      legacyClassification: state.legacyClassification,
      version: sessionRecord.version,
      sourceMetadata: sessionRecord.sourceMetadata || {},
      reviewSnapshot: sessionRecord.reviewSnapshot || null,
      entityResolutions: sessionRecord.entityResolutions || [],
      reviewAction: sessionRecord.reviewAction || null,
      validationIssues: sessionRecord.validationIssues || [],
      warningConfirmation: Boolean(sessionRecord.warningConfirmation),
      requiresSourceFileReattach: state.requiresSourceReattach, // Binary file is not stored in session persistence
    };
  }
}

export const importSessionClientService = new ImportSessionClientService();
