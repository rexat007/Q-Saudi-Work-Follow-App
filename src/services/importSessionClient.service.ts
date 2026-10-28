import { encodeSessionChunks } from './import/sessionArtifactCodec';
import { assertSessionPayload, sourceFingerprint, prepareDurableBatch } from './import/durableSessionContract';
import { auth } from '../firebase/config';
import {
  CreateImportSessionPayload,
  ImportSessionRecord,
  UpdateImportSessionPayload,
} from '../types/importSession';

export class ImportSessionVersionConflictError extends Error {
  public code = 'VERSION_CONFLICT';
  public expectedVersion: number;
  public serverVersion?: number;
  public authoritativeSession?: ImportSessionRecord;

  constructor(message: string, expectedVersion: number, serverVersion?: number) {
    super(message);
    this.name = 'ImportSessionVersionConflictError';
    this.expectedVersion = expectedVersion;
    this.serverVersion = serverVersion;
  }
}

export class ImportSessionClientService {
  public async commitReviewedIntent(projectId: string, importSessionId: string, expectedVersion: number): Promise<import('../types/importExecution').RosterExecutionCommitResponse> {
    const token = await this.getAuthToken();
    const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}/import-sessions/${encodeURIComponent(importSessionId)}/commit-reviewed-intent`, {
      method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`},body:JSON.stringify({expectedVersion})
    });
    const json = await response.json();
    if(!response.ok || !json.success) throw Object.assign(new Error(json.code || 'REVIEWED_COMMIT_FAILED'),{code:json.code,serverVersion:json.serverVersion});
    return json.data;
  }

  /** Transport for future P8-B4 integration; no completion/plan authority lives in the browser. */
  public async getExecutionStatus(projectId:string, sessionId:string):Promise<import('../types/importExecution').ImportExecutionStatus> {
    return this.executionCommand(projectId,sessionId);
  }
  public async retryExecution(projectId:string,sessionId:string,expectedOperationVersion:number):Promise<import('../types/importExecution').ImportExecutionStatus> {
    return this.executionCommand(projectId,sessionId,'retry',expectedOperationVersion);
  }
  public async cancelExecution(projectId:string,sessionId:string,expectedOperationVersion:number):Promise<import('../types/importExecution').ImportExecutionStatus> {
    return this.executionCommand(projectId,sessionId,'cancel',expectedOperationVersion);
  }
  private async executionCommand(projectId:string,sessionId:string,action?:'retry'|'cancel',expectedOperationVersion?:number) {
    const token=await this.getAuthToken();
    const response=await fetch(`/api/projects/${encodeURIComponent(projectId)}/import-sessions/${encodeURIComponent(sessionId)}/execution${action?'/'+action:''}`,{
      method:action?'POST':'GET',headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`},...(action?{body:JSON.stringify({expectedOperationVersion})}:{})
    });
    const json=await response.json();if(!response.ok||!json.success)throw Object.assign(new Error(json.code||'EXECUTION_REQUEST_FAILED'),{code:json.code});return json.data;
  }

  private async getAuthToken(overrideToken?: string): Promise<string> {
    if (overrideToken) return overrideToken;
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw Object.assign(new Error('المستخدم غير موثق'), { code: 'UNAUTHENTICATED' });
    }
    const token = await currentUser.getIdToken();
    if (!token) {
      throw new Error('تعذر استخراج رمز المصادقة');
    }
    return token;
  }

  /**
   * Creates a new persistent import session on the server.
   * POST /api/projects/:projectId/import-sessions
   */
  public async createSession(
    projectId: string,
    payload: CreateImportSessionPayload,
    overrideToken?: string
  ): Promise<ImportSessionRecord> {
    if (!projectId || !projectId.trim()) {
      throw new Error('معرف المشروع مطلوب لإنشاء جلسة استيراد');
    }

    const token = await this.getAuthToken(overrideToken);

    assertSessionPayload(payload);
    const response = await fetch(`/api/projects/${encodeURIComponent(projectId.trim())}/import-sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    let json: any;
    try {
      json = await response.json();
    } catch {
      throw new Error(`فشل الاتصال بالخادم HTTP ${response.status}`);
    }

    if (!response.ok || !json.success) {
      const err: any = new Error(json.error || `فشل إنشاء جلسة الاستيراد (${response.status})`);
      err.code = json.code || 'CREATE_SESSION_FAILED';
      throw err;
    }

    return json.data || json.session;
  }

  /**
   * Retrieves an existing import session by ID.
   * GET /api/projects/:projectId/import-sessions/:importSessionId
   */
  public async getSession(
    projectId: string,
    importSessionId: string,
    overrideToken?: string
  ): Promise<ImportSessionRecord> {
    if (!projectId || !projectId.trim()) {
      throw new Error('معرف المشروع مطلوب');
    }
    if (!importSessionId || !importSessionId.trim()) {
      throw new Error('معرف جلسة الاستيراد مطلوب');
    }

    const token = await this.getAuthToken(overrideToken);

    const response = await fetch(
      `/api/projects/${encodeURIComponent(projectId.trim())}/import-sessions/${encodeURIComponent(importSessionId.trim())}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    let json: any;
    try {
      json = await response.json();
    } catch {
      throw new Error(`فشل الاتصال بالخادم HTTP ${response.status}`);
    }

    if (!response.ok || !json.success) {
      const err: any = new Error(json.error || `فشل استرجاع جلسة الاستيراد (${response.status})`);
      err.code = json.code || 'GET_SESSION_FAILED';
      throw err;
    }

    return json.data || json.session;
  }

  /**
   * Lists all resumable import sessions for a project ordered by updatedAt DESC.
   * GET /api/projects/:projectId/import-sessions
   */
  public async listResumableSessions(
    projectId: string,
    overrideToken?: string,
    includeRosterResults = false
  ): Promise<ImportSessionRecord[]> {
    if (!projectId || !projectId.trim()) {
      throw new Error('معرف المشروع مطلوب');
    }

    const token = await this.getAuthToken(overrideToken);

    const response = await fetch(
      `/api/projects/${encodeURIComponent(projectId.trim())}/import-sessions${includeRosterResults ? "?includeRosterResults=true" : ""}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    let json: any;
    try {
      json = await response.json();
    } catch {
      throw new Error(`فشل الاتصال بالخادم HTTP ${response.status}`);
    }

    if (!response.ok || !json.success) {
      const err: any = new Error(json.error || `فشل استعراض جلسات الاستيراد (${response.status})`);
      err.code = json.code || 'LIST_SESSIONS_FAILED';
      throw err;
    }

    return json.sessions || [];
  }

  /**
   * Updates an import session checkpoint with expectedVersion optimistic concurrency.
   * PATCH /api/projects/:projectId/import-sessions/:importSessionId
   */
  public async updateCheckpoint(
    projectId: string,
    importSessionId: string,
    updates: UpdateImportSessionPayload,
    expectedVersion: number,
    overrideToken?: string
  ): Promise<ImportSessionRecord> {
    if (!projectId || !projectId.trim()) {
      throw new Error('معرف المشروع مطلوب');
    }
    if (!importSessionId || !importSessionId.trim()) {
      throw new Error('معرف جلسة الاستيراد مطلوب');
    }
    if (!Number.isSafeInteger(expectedVersion) || expectedVersion < 1) {
      throw new Error('رقم الإصدار المتوقع (expectedVersion) مطلوب للتحكم بالتزامن المتفائل');
    }

    const token = await this.getAuthToken(overrideToken);

    assertSessionPayload(updates);
    if (updates.importBatch) updates = { ...updates, importBatch: prepareDurableBatch(updates.importBatch) };
    const requiresChunks = JSON.stringify(updates).length > 40000;
    if (!updates.artifactChunk && !updates.checkpointArtifact && requiresChunks) {
      const chunks = encodeSessionChunks(updates);
      const digest = await sourceFingerprint(new TextEncoder().encode(chunks.join('')).buffer as ArrayBuffer);
      const manifest = { artifactId: crypto.randomUUID(), count: chunks.length, digest };
      for (let index = 0; index < manifest.count; index++) await this.updateCheckpoint(projectId, importSessionId, { artifactChunk: { ...manifest, index, text: chunks[index] } }, expectedVersion, overrideToken);
      updates = { checkpointArtifact: manifest };
    }

    const response = await fetch(
      `/api/projects/${encodeURIComponent(projectId.trim())}/import-sessions/${encodeURIComponent(importSessionId.trim())}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...updates,
          expectedVersion,
        }),
      }
    );

    let json: any;
    try {
      json = await response.json();
    } catch {
      throw new Error(`فشل الاتصال بالخادم HTTP ${response.status}`);
    }

    if (!response.ok || !json.success) {
      if (json.code === 'VERSION_CONFLICT' || response.status === 409) {
        const conflict = new ImportSessionVersionConflictError(
          json.error || 'تعارض في إصدار جلسة الاستيراد (VERSION_CONFLICT): تم تعديل الجلسة من جهة أخرى.',
          expectedVersion, json.serverVersion
        );
        // Recovery read only. Never automatically retry the stale mutation.
        try { conflict.authoritativeSession = await this.getSession(projectId, importSessionId, overrideToken); } catch { /* Access/network failures leave the mutation fenced. */ }
        throw conflict;
      }
      const err: any = new Error(json.error || `فشل تحديث نقطة استئناف الاستيراد (${response.status})`);
      err.code = json.code || 'UPDATE_CHECKPOINT_FAILED';
      throw err;
    }

    return json.data || json.session;
  }
}

export const importSessionClientService = new ImportSessionClientService();
