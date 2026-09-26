import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { auth } from '../firebase/config';
import {
  importSessionClientService,
  ImportSessionRecord,
} from '../services/import/importSessionClient.service';
import * as fs from 'fs';
import * as path from 'path';

vi.mock('../firebase/config', () => ({
  auth: {
    currentUser: {
      getIdToken: vi.fn().mockResolvedValue('mock_firebase_id_token_123'),
    },
  },
}));

describe('Smart Import Unit 4B-1 Client Session Adapter Test Suite', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
    // Default authenticated mock user
    (auth as any).currentUser = {
      getIdToken: vi.fn().mockResolvedValue('mock_firebase_id_token_123'),
    };
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('1. create calls correct POST route with Bearer Firebase ID token', async () => {
    let calledUrl = '';
    let calledMethod = '';
    let calledAuthHeader = '';
    let calledBody: any = null;

    globalThis.fetch = vi.fn().mockImplementation(async (url: string, options: any) => {
      calledUrl = url;
      calledMethod = options.method;
      calledAuthHeader = options.headers['Authorization'];
      calledBody = JSON.parse(options.body);
      return {
        ok: true,
        json: async () => ({
          success: true,
          data: {
            importSessionId: 'session-101',
            projectId: 'PRJ-001',
            operationId: calledBody.operationId,
            importBatchId: calledBody.importBatchId,
            version: 1,
          },
        }),
      };
    });

    const result = await importSessionClientService.createSession('PRJ-001', {
      projectId: 'PRJ-001',
      sourceType: 'EXCEL_CSV',
    });

    expect(calledUrl).toBe('/api/projects/PRJ-001/import-sessions');
    expect(calledMethod).toBe('POST');
    expect(calledAuthHeader).toBe('Bearer mock_firebase_id_token_123');
    expect(result.importSessionId).toBe('session-101');
    expect(result.projectId).toBe('PRJ-001');
  });

  it('2. get calls correct GET route with Bearer Firebase ID token', async () => {
    let calledUrl = '';
    let calledMethod = '';
    let calledAuthHeader = '';

    globalThis.fetch = vi.fn().mockImplementation(async (url: string, options: any) => {
      calledUrl = url;
      calledMethod = options?.method || 'GET';
      calledAuthHeader = options.headers['Authorization'];
      return {
        ok: true,
        json: async () => ({
          success: true,
          data: {
            importSessionId: 'session-123',
            projectId: 'PRJ-001',
            operationId: 'op-123',
            importBatchId: 'batch-123',
            version: 2,
          },
        }),
      };
    });

    const session = await importSessionClientService.getSession('PRJ-001', 'session-123');

    expect(calledUrl).toBe('/api/projects/PRJ-001/import-sessions/session-123');
    expect(calledMethod).toBe('GET');
    expect(calledAuthHeader).toBe('Bearer mock_firebase_id_token_123');
    expect(session.importSessionId).toBe('session-123');
    expect(session.version).toBe(2);
  });

  it('3. update calls correct PATCH route with Bearer Firebase ID token', async () => {
    let calledUrl = '';
    let calledMethod = '';
    let calledAuthHeader = '';

    globalThis.fetch = vi.fn().mockImplementation(async (url: string, options: any) => {
      calledUrl = url;
      calledMethod = options.method;
      calledAuthHeader = options.headers['Authorization'];
      return {
        ok: true,
        json: async () => ({
          success: true,
          data: {
            importSessionId: 'session-123',
            projectId: 'PRJ-001',
            version: 3,
          },
        }),
      };
    });

    const updated = await importSessionClientService.updateCheckpoint(
      'PRJ-001',
      'session-123',
      { lifecycleState: 'REVIEW' },
      2
    );

    expect(calledUrl).toBe('/api/projects/PRJ-001/import-sessions/session-123');
    expect(calledMethod).toBe('PATCH');
    expect(calledAuthHeader).toBe('Bearer mock_firebase_id_token_123');
    expect(updated.version).toBe(3);
  });

  it('4. expectedVersion sent on PATCH', async () => {
    let calledBody: any = null;

    globalThis.fetch = vi.fn().mockImplementation(async (url: string, options: any) => {
      calledBody = JSON.parse(options.body);
      return {
        ok: true,
        json: async () => ({
          success: true,
          data: { importSessionId: 'session-123', version: 3 },
        }),
      };
    });

    await importSessionClientService.updateCheckpoint(
      'PRJ-001',
      'session-123',
      { currentStage: 'VALIDATION' },
      2
    );

    expect(calledBody.expectedVersion).toBe(2);
    expect(calledBody.currentStage).toBe('VALIDATION');
  });

  it('5. VERSION_CONFLICT surfaced distinctly', async () => {
    globalThis.fetch = vi.fn().mockImplementation(async () => {
      return {
        ok: false,
        status: 409,
        json: async () => ({
          success: false,
          error: 'Version mismatch conflict',
          code: 'VERSION_CONFLICT',
        }),
      };
    });

    await expect(
      importSessionClientService.updateCheckpoint('PRJ-001', 'session-123', {}, 1)
    ).rejects.toThrow('Version mismatch conflict');

    try {
      await importSessionClientService.updateCheckpoint('PRJ-001', 'session-123', {}, 1);
    } catch (err: any) {
      expect(err.code).toBe('VERSION_CONFLICT');
    }
  });

  it('6. stable operationId preserved', async () => {
    let sentPayload: any = null;

    globalThis.fetch = vi.fn().mockImplementation(async (url: string, options: any) => {
      sentPayload = JSON.parse(options.body);
      return {
        ok: true,
        json: async () => ({
          success: true,
          data: { ...sentPayload, importSessionId: 'sess-1' },
        }),
      };
    });

    const existingOpId = 'op_stable_999';
    await importSessionClientService.createSession('PRJ-001', {
      projectId: 'PRJ-001',
      operationId: existingOpId,
    });

    expect(sentPayload.operationId).toBe(existingOpId);
  });

  it('7. stable importBatchId preserved', async () => {
    let sentPayload: any = null;

    globalThis.fetch = vi.fn().mockImplementation(async (url: string, options: any) => {
      sentPayload = JSON.parse(options.body);
      return {
        ok: true,
        json: async () => ({
          success: true,
          data: { ...sentPayload, importSessionId: 'sess-1' },
        }),
      };
    });

    const existingBatchId = 'batch_stable_888';
    await importSessionClientService.createSession('PRJ-001', {
      projectId: 'PRJ-001',
      importBatchId: existingBatchId,
    });

    expect(sentPayload.importBatchId).toBe(existingBatchId);
  });

  it('8. existing session does not regenerate IDs', async () => {
    const mockRecord: ImportSessionRecord = {
      importSessionId: 'session-existing-1',
      projectId: 'PRJ-001',
      operationId: 'op_existing_111',
      importBatchId: 'batch_existing_222',
      sourceType: 'EXCEL_CSV',
      lifecycleState: 'REVIEW',
      currentStage: 'REVIEW',
      version: 5,
      createdAt: '2026-01-01T00:00:00Z',
      createdBy: 'user-1',
      updatedAt: '2026-01-01T00:00:00Z',
      updatedBy: 'user-1',
      sourceMetadata: { sourceFileName: 'trips.xlsx' },
    };

    globalThis.fetch = vi.fn().mockImplementation(async () => {
      return {
        ok: true,
        json: async () => ({
          success: true,
          data: mockRecord,
        }),
      };
    });

    const session = await importSessionClientService.getSession('PRJ-001', 'session-existing-1');
    const resumed = importSessionClientService.reconstructResumedBatch(session);

    expect(resumed.importSessionId).toBe('session-existing-1');
    expect(resumed.operationId).toBe('op_existing_111');
    expect(resumed.importBatchId).toBe('batch_existing_222');
  });

  it('9. browser File/raw bytes are not included in persisted payload', async () => {
    const mockFilePayload = {
      projectId: 'PRJ-001',
      reviewSnapshot: {
        rawFile: new File(['dummy content'], 'test.xlsx', { type: 'application/vnd.ms-excel' }),
      },
    };

    await expect(
      importSessionClientService.createSession('PRJ-001', mockFilePayload)
    ).rejects.toThrow('INVALID_PAYLOAD_FORBIDDEN_FIELDS');
  });

  it('10. nested auth/token values are not intentionally copied', async () => {
    const mockSecretPayload = {
      projectId: 'PRJ-001',
      sourceMetadata: {
        config: {
          token: 'secret_bearer_token',
        },
      },
    };

    await expect(
      importSessionClientService.createSession('PRJ-001', mockSecretPayload)
    ).rejects.toThrow('INVALID_PAYLOAD_FORBIDDEN_FIELDS');
  });

  it('11. reviewSnapshot round-trip mapping', () => {
    const mockSnapshot = {
      summary: { totalRows: 150, validRows: 145 },
      sampleRows: [{ rowNumber: 1, driverName: 'Ahmed' }],
    };

    const mockRecord: ImportSessionRecord = {
      importSessionId: 'sess-roundtrip-1',
      projectId: 'PRJ-001',
      operationId: 'op_rt',
      importBatchId: 'batch_rt',
      sourceType: 'EXCEL_CSV',
      lifecycleState: 'REVIEW',
      currentStage: 'REVIEW',
      version: 2,
      createdAt: '2026-01-01T00:00:00Z',
      createdBy: 'user-1',
      updatedAt: '2026-01-01T00:00:00Z',
      updatedBy: 'user-1',
      sourceMetadata: { sourceFileName: 'test.xlsx' },
      reviewSnapshot: mockSnapshot,
      entityResolutions: [{ type: 'DRIVER', sourceValue: 'Ahmed', resolvedId: 'drv-1' }],
      warningConfirmation: true,
    };

    const resumed = importSessionClientService.reconstructResumedBatch(mockRecord);

    expect(resumed.reviewSnapshot).toEqual(mockSnapshot);
    expect(resumed.entityResolutions).toHaveLength(1);
    expect(resumed.warningConfirmation).toBe(true);
  });

  it('12. resume without raw source marks source reattach requirement', () => {
    const mockRecord: ImportSessionRecord = {
      importSessionId: 'sess-no-raw-1',
      projectId: 'PRJ-001',
      operationId: 'op_noraw',
      importBatchId: 'batch_noraw',
      sourceType: 'EXCEL_CSV',
      lifecycleState: 'REVIEW',
      currentStage: 'REVIEW',
      version: 1,
      createdAt: '2026-01-01T00:00:00Z',
      createdBy: 'user-1',
      updatedAt: '2026-01-01T00:00:00Z',
      updatedBy: 'user-1',
      sourceMetadata: { sourceFileName: 'data.csv' },
    };

    const resumed = importSessionClientService.reconstructResumedBatch(mockRecord);

    expect(resumed.requiresSourceFileReattach).toBe(true);
  });

  it('13. no firebase/firestore client import in adapter', () => {
    const adapterFilePath = path.resolve(__dirname, '../services/import/importSessionClient.service.ts');
    const code = fs.readFileSync(adapterFilePath, 'utf-8');

    expect(code).not.toContain('firebase/firestore');
    expect(code).not.toContain('getFirestore');
    expect(code).not.toContain('collection(');
    expect(code).not.toContain('doc(');
  });

  it('14. no business entity writes', async () => {
    let calledUrl = '';

    globalThis.fetch = vi.fn().mockImplementation(async (url: string) => {
      calledUrl = url;
      return {
        ok: true,
        json: async () => ({
          success: true,
          data: { importSessionId: 'sess-1', projectId: 'PRJ-001' },
        }),
      };
    });

    await importSessionClientService.createSession('PRJ-001', {
      projectId: 'PRJ-001',
      sourceType: 'EXCEL_CSV',
    });

    expect(calledUrl).not.toContain('/api/trips');
    expect(calledUrl).not.toContain('/api/drivers');
    expect(calledUrl).not.toContain('/api/trucks');
    expect(calledUrl).not.toContain('/api/carriers');
    expect(calledUrl).not.toContain('/api/materials');
  });

  it('15. missing authenticated user fails closed with UNAUTHENTICATED', async () => {
    (auth as any).currentUser = null;

    await expect(
      importSessionClientService.createSession('PRJ-001', { projectId: 'PRJ-001' })
    ).rejects.toThrow('المستخدم غير موثق');

    try {
      await importSessionClientService.createSession('PRJ-001', { projectId: 'PRJ-001' });
    } catch (err: any) {
      expect(err.code).toBe('UNAUTHENTICATED');
    }
  });

  it('16. mixed-case forbidden key is rejected case-insensitively', async () => {
    const mockCasePayload = {
      projectId: 'PRJ-001',
      sourceMetadata: {
        APIKEY: 'secret_value',
        ReFrEsHToKeN: 'token_val',
      },
    };

    await expect(
      importSessionClientService.createSession('PRJ-001', mockCasePayload)
    ).rejects.toThrow('INVALID_PAYLOAD_FORBIDDEN_FIELDS');
  });

  it('17. no localStorage auth_token references in adapter source code', () => {
    const adapterFilePath = path.resolve(__dirname, '../services/import/importSessionClient.service.ts');
    const code = fs.readFileSync(adapterFilePath, 'utf-8');

    expect(code).not.toContain('localStorage');
    expect(code).not.toContain('auth_token');
  });
});
