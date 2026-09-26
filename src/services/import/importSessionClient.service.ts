import { auth } from '../../firebase/config';

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
   * Check for forbidden keys or non-serializable objects (File/Blob/Buffer)
   */
  private sanitizePayload(payload: any): any {
    if (!payload || typeof payload !== 'object') {
      return payload;
    }

    if (typeof File !== 'undefined' && payload instanceof File) {
      const err: any = new Error('INVALID_PAYLOAD_FORBIDDEN_FIELDS: Browser File objects cannot be persisted');
      err.code = 'INVALID_PAYLOAD_FORBIDDEN_FIELDS';
      throw err;
    }
    if (typeof Blob !== 'undefined' && payload instanceof Blob) {
      const err: any = new Error('INVALID_PAYLOAD_FORBIDDEN_FIELDS: Blob objects cannot be persisted');
      err.code = 'INVALID_PAYLOAD_FORBIDDEN_FIELDS';
      throw err;
    }
    if (typeof ArrayBuffer !== 'undefined' && payload instanceof ArrayBuffer) {
      const err: any = new Error('INVALID_PAYLOAD_FORBIDDEN_FIELDS: Raw ArrayBuffers cannot be persisted');
      err.code = 'INVALID_PAYLOAD_FORBIDDEN_FIELDS';
      throw err;
    }

    const forbiddenKeys = [
      'token',
      'accesstoken',
      'refreshtoken',
      'apikey',
      'secret',
      'password',
      'authorization',
      'credential',
      'credentials',
      'privatekey',
      'file',
    ];

    if (Array.isArray(payload)) {
      return payload.map(item => this.sanitizePayload(item));
    }

    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(payload)) {
      if (forbiddenKeys.includes(key.toLowerCase())) {
        const err: any = new Error(`INVALID_PAYLOAD_FORBIDDEN_FIELDS: Field '${key}' is forbidden`);
        err.code = 'INVALID_PAYLOAD_FORBIDDEN_FIELDS';
        throw err;
      }
      cleaned[key] = this.sanitizePayload(value);
    }
    return cleaned;
  }

  /**
   * Acquire Firebase ID token from canonical auth user
   */
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const user = auth.currentUser;
    if (!user) {
      const err: any = new Error('المستخدم غير موثق');
      err.code = 'UNAUTHENTICATED';
      throw err;
    }

    const token = await user.getIdToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
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

    const sanitized = this.sanitizePayload(payload);

    // Ensure stable identities if not supplied
    if (!sanitized.operationId || !sanitized.importBatchId) {
      const stable = this.generateStableIdentities();
      sanitized.operationId = sanitized.operationId || stable.operationId;
      sanitized.importBatchId = sanitized.importBatchId || stable.importBatchId;
    }

    const headers = await this.getAuthHeaders();

    const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}/import-sessions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(sanitized),
    });

    const resData = await response.json();

    if (!response.ok || !resData.success) {
      const err: any = new Error(resData.error || 'Failed to create import session');
      err.code = resData.code || 'IMPORT_SESSION_CREATE_FAILED';
      throw err;
    }

    return resData.data;
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

    const headers = await this.getAuthHeaders();

    const response = await fetch(
      `/api/projects/${encodeURIComponent(projectId)}/import-sessions/${encodeURIComponent(importSessionId)}`,
      {
        method: 'GET',
        headers,
      }
    );

    const resData = await response.json();

    if (!response.ok || !resData.success) {
      const err: any = new Error(resData.error || 'Failed to get import session');
      err.code = resData.code || 'IMPORT_SESSION_GET_FAILED';
      throw err;
    }

    return resData.data;
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

    const sanitizedUpdates = this.sanitizePayload(updates);
    const headers = await this.getAuthHeaders();

    const response = await fetch(
      `/api/projects/${encodeURIComponent(projectId)}/import-sessions/${encodeURIComponent(importSessionId)}`,
      {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          ...sanitizedUpdates,
          expectedVersion,
        }),
      }
    );

    const resData = await response.json();

    if (!response.ok || !resData.success) {
      const err: any = new Error(resData.error || 'Failed to update import session checkpoint');
      err.code = resData.code || (response.status === 409 ? 'VERSION_CONFLICT' : 'IMPORT_SESSION_UPDATE_FAILED');
      throw err;
    }

    return resData.data;
  }

  /**
   * Pure mapper: reconstructs a resumed review state from a persisted server session record
   */
  reconstructResumedBatch(sessionRecord: ImportSessionRecord): ResumedImportBatchState {
    if (!sessionRecord) {
      throw new Error('sessionRecord is required for resume mapping');
    }

    return {
      importSessionId: sessionRecord.importSessionId,
      projectId: sessionRecord.projectId,
      operationId: sessionRecord.operationId,
      importBatchId: sessionRecord.importBatchId,
      sourceType: sessionRecord.sourceType || 'EXCEL_CSV',
      lifecycleState: sessionRecord.lifecycleState || 'REVIEW',
      version: sessionRecord.version,
      sourceMetadata: sessionRecord.sourceMetadata || {},
      reviewSnapshot: sessionRecord.reviewSnapshot || null,
      entityResolutions: sessionRecord.entityResolutions || [],
      reviewAction: sessionRecord.reviewAction || null,
      validationIssues: sessionRecord.validationIssues || [],
      warningConfirmation: Boolean(sessionRecord.warningConfirmation),
      requiresSourceFileReattach: true, // Binary file is not stored in session persistence
    };
  }
}

export const importSessionClientService = new ImportSessionClientService();
