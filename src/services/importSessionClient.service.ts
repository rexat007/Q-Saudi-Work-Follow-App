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

  constructor(message: string, expectedVersion: number, serverVersion?: number) {
    super(message);
    this.name = 'ImportSessionVersionConflictError';
    this.expectedVersion = expectedVersion;
    this.serverVersion = serverVersion;
  }
}

export class ImportSessionClientService {
  private async getAuthToken(overrideToken?: string): Promise<string> {
    if (overrideToken) return overrideToken;
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('المستخدم غير مسجل الدخول');
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
    overrideToken?: string
  ): Promise<ImportSessionRecord[]> {
    if (!projectId || !projectId.trim()) {
      throw new Error('معرف المشروع مطلوب');
    }

    const token = await this.getAuthToken(overrideToken);

    const response = await fetch(
      `/api/projects/${encodeURIComponent(projectId.trim())}/import-sessions`,
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
    if (typeof expectedVersion !== 'number') {
      throw new Error('رقم الإصدار المتوقع (expectedVersion) مطلوب للتحكم بالتزامن المتفائل');
    }

    const token = await this.getAuthToken(overrideToken);

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
        throw new ImportSessionVersionConflictError(
          json.error || 'تعارض في إصدار جلسة الاستيراد (VERSION_CONFLICT): تم تعديل الجلسة من جهة أخرى.',
          expectedVersion
        );
      }
      const err: any = new Error(json.error || `فشل تحديث نقطة استئناف الاستيراد (${response.status})`);
      err.code = json.code || 'UPDATE_CHECKPOINT_FAILED';
      throw err;
    }

    return json.data || json.session;
  }
}

export const importSessionClientService = new ImportSessionClientService();
