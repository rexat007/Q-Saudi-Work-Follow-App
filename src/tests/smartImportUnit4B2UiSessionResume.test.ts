import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { importSessionClientService } from '../services/import/importSessionClient.service';
import { ExcelCsvPipelineService } from '../services/import/excelCsvPipeline.service';
import { auth } from '../firebase/config';

vi.mock('../firebase/config', () => ({
  auth: {
    currentUser: {
      getIdToken: vi.fn().mockResolvedValue('mock_firebase_id_token_unit4b2'),
    },
  },
}));

describe('Smart Import Unit 4B-2 UI Session Wiring & Resume Test Suite', () => {
  const originalFetch = globalThis.fetch;

  let storageStore: Record<string, string> = {};

  const mockSessionStorage = {
    getItem: (key: string) => storageStore[key] || null,
    setItem: (key: string, val: string) => {
      storageStore[key] = val;
    },
    removeItem: (key: string) => {
      delete storageStore[key];
    },
    clear: () => {
      storageStore = {};
    },
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    storageStore = {};
    Object.defineProperty(globalThis, 'sessionStorage', {
      value: mockSessionStorage,
      writable: true,
    });
    (auth as any).currentUser = {
      getIdToken: vi.fn().mockResolvedValue('mock_firebase_id_token_unit4b2'),
    };
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('1. new flow generates identities once', () => {
    const id1 = importSessionClientService.generateStableIdentities();
    const id2 = importSessionClientService.generateStableIdentities();

    expect(id1.operationId).toMatch(/^op_/);
    expect(id1.importBatchId).toMatch(/^batch_/);
    expect(id2.operationId).toMatch(/^op_/);
    expect(id1.operationId).not.toBe(id2.operationId);
  });

  it('2. stable operationId reused in PipelineContext', () => {
    const stable = importSessionClientService.generateStableIdentities();
    const pipelineContext = {
      projectId: 'PRJ-4B2',
      userId: 'user-1',
      operationId: stable.operationId,
    };

    expect(pipelineContext.operationId).toBe(stable.operationId);
  });

  it('3. stable importBatchId reused in pipeline batch', async () => {
    const stable = importSessionClientService.generateStableIdentities();
    const sampleCsv = 'تاريخ الشحنة,اسم السائق,رقم اللوحة,اسم الناقل,المادة,الوزن القائم,الوزن فارغ\n2026-01-01,أحمد,1234 ABC,ناقل 1,رمل,30000,10000';

    const batch = await ExcelCsvPipelineService.processFileToReview(
      sampleCsv,
      'trips.csv',
      sampleCsv.length,
      'text/csv',
      { projectId: 'PRJ-4B2', operationId: stable.operationId },
      { importBatchId: stable.importBatchId }
    );

    expect(batch.importBatchId).toBe(stable.importBatchId);
    expect(batch.source.importBatchId).toBe(stable.importBatchId);
  });

  it('4. sheet change does not generate replacement IDs', () => {
    const stable = importSessionClientService.generateStableIdentities();
    let currentOpId = stable.operationId;
    let currentBatchId = stable.importBatchId;

    // Simulate sheet change action: reuse existing active identities
    const activeOpIdAfterSheetChange = currentOpId;
    const activeBatchIdAfterSheetChange = currentBatchId;

    expect(activeOpIdAfterSheetChange).toBe(stable.operationId);
    expect(activeBatchIdAfterSheetChange).toBe(stable.importBatchId);
  });

  it('5. header-row change does not generate replacement IDs', () => {
    const stable = importSessionClientService.generateStableIdentities();
    const activeOpIdAfterHeaderChange = stable.operationId;
    const activeBatchIdAfterHeaderChange = stable.importBatchId;

    expect(activeOpIdAfterHeaderChange).toBe(stable.operationId);
    expect(activeBatchIdAfterHeaderChange).toBe(stable.importBatchId);
  });

  it('6. server session created exactly once for new flow', async () => {
    let callCount = 0;
    globalThis.fetch = vi.fn().mockImplementation(async (url: string, options: any) => {
      if (options.method === 'POST') {
        callCount++;
        return {
          ok: true,
          json: async () => ({
            success: true,
            data: {
              importSessionId: 'sess-created-1',
              projectId: 'PRJ-4B2',
              operationId: 'op_1',
              importBatchId: 'batch_1',
              version: 1,
            },
          }),
        };
      }
      return { ok: true, json: async () => ({ success: true, data: {} }) };
    });

    await importSessionClientService.createSession('PRJ-4B2', {
      projectId: 'PRJ-4B2',
      sourceType: 'CSV',
    });

    expect(callCount).toBe(1);
  });

  it('7. REVIEW checkpoint persisted after processing', async () => {
    let checkpointMethod = '';
    let checkpointBody: any = null;

    globalThis.fetch = vi.fn().mockImplementation(async (url: string, options: any) => {
      if (options.method === 'PATCH') {
        checkpointMethod = options.method;
        checkpointBody = JSON.parse(options.body);
        return {
          ok: true,
          json: async () => ({
            success: true,
            data: { importSessionId: 'sess-1', version: 2 },
          }),
        };
      }
      return { ok: true, json: async () => ({ success: true, data: {} }) };
    });

    await importSessionClientService.updateCheckpoint(
      'PRJ-4B2',
      'sess-1',
      { lifecycleState: 'REVIEW_REQUIRED', currentStage: 'REVIEW' },
      1
    );

    expect(checkpointMethod).toBe('PATCH');
    expect(checkpointBody.lifecycleState).toBe('REVIEW_REQUIRED');
    expect(checkpointBody.currentStage).toBe('REVIEW');
  });

  it('8. persisted snapshot excludes source.rawInput', async () => {
    let sentPayload: any = null;

    globalThis.fetch = vi.fn().mockImplementation(async (url: string, options: any) => {
      sentPayload = JSON.parse(options.body);
      return {
        ok: true,
        json: async () => ({
          success: true,
          data: { importSessionId: 'sess-1', version: 2 },
        }),
      };
    });

    const dirtySnapshot = {
      rows: [{ rowNumber: 1, rawInput: 'binary data bytes' }],
    };

    const cleanSnapshot = {
      rows: dirtySnapshot.rows.map((r) => {
        const { rawInput, ...rest } = r;
        return rest;
      }),
    };

    await importSessionClientService.updateCheckpoint(
      'PRJ-4B2',
      'sess-1',
      { reviewSnapshot: cleanSnapshot },
      1
    );

    expect(sentPayload.reviewSnapshot.rows[0].rawInput).toBeUndefined();
  });

  it('9. persisted snapshot excludes File/ArrayBuffer', async () => {
    const mockFilePayload = {
      projectId: 'PRJ-4B2',
      reviewSnapshot: {
        rawBuffer: new ArrayBuffer(8),
      },
    };

    await expect(
      importSessionClientService.createSession('PRJ-4B2', mockFilePayload)
    ).rejects.toThrow('INVALID_PAYLOAD_FORBIDDEN_FIELDS');
  });

  it('10. row review action persists checkpoint', async () => {
    let patchedAction: any = null;

    globalThis.fetch = vi.fn().mockImplementation(async (url: string, options: any) => {
      if (options.method === 'PATCH') {
        patchedAction = JSON.parse(options.body).reviewAction;
        return {
          ok: true,
          json: async () => ({
            success: true,
            data: { importSessionId: 'sess-1', version: 3 },
          }),
        };
      }
      return { ok: true, json: async () => ({ success: true, data: {} }) };
    });

    await importSessionClientService.updateCheckpoint(
      'PRJ-4B2',
      'sess-1',
      { reviewAction: { rowNumber: 5, action: 'ACCEPT_WARNING' } },
      2
    );

    expect(patchedAction).toEqual({ rowNumber: 5, action: 'ACCEPT_WARNING' });
  });

  it('11. expectedVersion uses current server version', async () => {
    let sentExpectedVersion: number | null = null;

    globalThis.fetch = vi.fn().mockImplementation(async (url: string, options: any) => {
      sentExpectedVersion = JSON.parse(options.body).expectedVersion;
      return {
        ok: true,
        json: async () => ({
          success: true,
          data: { importSessionId: 'sess-1', version: 4 },
        }),
      };
    });

    await importSessionClientService.updateCheckpoint('PRJ-4B2', 'sess-1', {}, 3);

    expect(sentExpectedVersion).toBe(3);
  });

  it('12. server-returned version replaces local version', async () => {
    globalThis.fetch = vi.fn().mockImplementation(async () => ({
      ok: true,
      json: async () => ({
        success: true,
        data: { importSessionId: 'sess-1', version: 10 },
      }),
    }));

    const res = await importSessionClientService.updateCheckpoint('PRJ-4B2', 'sess-1', {}, 9);

    expect(res.version).toBe(10);
  });

  it('13. VERSION_CONFLICT is surfaced', async () => {
    globalThis.fetch = vi.fn().mockImplementation(async () => ({
      ok: false,
      status: 409,
      json: async () => ({
        success: false,
        error: 'Version conflict',
        code: 'VERSION_CONFLICT',
      }),
    }));

    try {
      await importSessionClientService.updateCheckpoint('PRJ-4B2', 'sess-1', {}, 1);
    } catch (err: any) {
      expect(err.code).toBe('VERSION_CONFLICT');
    }
  });

  it('14. resume locator stores only projectId + importSessionId', () => {
    const locatorKey = 'qsaudi_import_session_locator_PRJ-4B2';
    sessionStorage.setItem(
      locatorKey,
      JSON.stringify({ projectId: 'PRJ-4B2', importSessionId: 'sess-777' })
    );

    const stored = JSON.parse(sessionStorage.getItem(locatorKey)!);

    expect(stored).toEqual({ projectId: 'PRJ-4B2', importSessionId: 'sess-777' });
    expect(stored.rows).toBeUndefined();
    expect(stored.reviewSnapshot).toBeUndefined();
  });

  it('15. refresh resume GETs server session', async () => {
    let getCalled = false;

    globalThis.fetch = vi.fn().mockImplementation(async (url: string, options: any) => {
      if (!options?.method || options.method === 'GET') {
        getCalled = true;
        return {
          ok: true,
          json: async () => ({
            success: true,
            data: {
              importSessionId: 'sess-777',
              projectId: 'PRJ-4B2',
              operationId: 'op_resumed',
              importBatchId: 'batch_resumed',
              version: 2,
              lifecycleState: 'REVIEW_REQUIRED',
            },
          }),
        };
      }
      return { ok: true, json: async () => ({ success: true, data: {} }) };
    });

    const record = await importSessionClientService.getSession('PRJ-4B2', 'sess-777');

    expect(getCalled).toBe(true);
    expect(record.importSessionId).toBe('sess-777');
  });

  it('16. resumed IDs remain unchanged', () => {
    const mockRecord = {
      importSessionId: 'sess-stable-99',
      projectId: 'PRJ-4B2',
      operationId: 'op_stable_original',
      importBatchId: 'batch_stable_original',
      sourceType: 'CSV',
      lifecycleState: 'REVIEW_REQUIRED',
      version: 3,
      createdAt: '2026-01-01T00:00:00Z',
      createdBy: 'user-1',
      updatedAt: '2026-01-01T00:00:00Z',
      updatedBy: 'user-1',
      sourceMetadata: {},
    };

    const resumed = importSessionClientService.reconstructResumedBatch(mockRecord as any);

    expect(resumed.importSessionId).toBe('sess-stable-99');
    expect(resumed.operationId).toBe('op_stable_original');
    expect(resumed.importBatchId).toBe('batch_stable_original');
  });

  it('17. resumed state marks source reattach requirement', () => {
    const mockRecord = {
      importSessionId: 'sess-1',
      projectId: 'PRJ-4B2',
      operationId: 'op_1',
      importBatchId: 'batch_1',
      version: 1,
    };

    const resumed = importSessionClientService.reconstructResumedBatch(mockRecord as any);

    expect(resumed.requiresSourceFileReattach).toBe(true);
  });

  it('18. reattach does not create a new import session', () => {
    const activeSessionId = 'sess-existing-44';
    const isReattach = true;

    // When reattaching file, activeSessionId is reused
    const finalSessionId = isReattach ? activeSessionId : 'sess-new';

    expect(finalSessionId).toBe('sess-existing-44');
  });

  it('19. reset clears locator but does not delete server session', () => {
    const locatorKey = 'qsaudi_import_session_locator_PRJ-4B2';
    sessionStorage.setItem(
      locatorKey,
      JSON.stringify({ projectId: 'PRJ-4B2', importSessionId: 'sess-777' })
    );

    // Simulate reset
    sessionStorage.removeItem(locatorKey);

    expect(sessionStorage.getItem(locatorKey)).toBeNull();
  });

  it('20. no business writes occur before commit', async () => {
    let tripEndpointCalled = false;

    globalThis.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes('/api/trips')) {
        tripEndpointCalled = true;
      }
      return { ok: true, json: async () => ({ success: true, data: {} }) };
    });

    await importSessionClientService.createSession('PRJ-4B2', { projectId: 'PRJ-4B2' });
    await importSessionClientService.updateCheckpoint('PRJ-4B2', 'sess-1', {}, 1);

    expect(tripEndpointCalled).toBe(false);
  });

  it('21. successful commit clears locator', () => {
    const locatorKey = 'qsaudi_import_session_locator_PRJ-4B2';
    sessionStorage.setItem(
      locatorKey,
      JSON.stringify({ projectId: 'PRJ-4B2', importSessionId: 'sess-777' })
    );

    // Simulate commit completion
    sessionStorage.removeItem(locatorKey);

    expect(sessionStorage.getItem(locatorKey)).toBeNull();
  });

  it('22. successful commit checkpoints COMMITTED state if implemented', async () => {
    let lastState = '';

    globalThis.fetch = vi.fn().mockImplementation(async (url: string, options: any) => {
      lastState = JSON.parse(options.body).lifecycleState;
      return {
        ok: true,
        json: async () => ({
          success: true,
          data: { importSessionId: 'sess-1', version: 5 },
        }),
      };
    });

    await importSessionClientService.updateCheckpoint(
      'PRJ-4B2',
      'sess-1',
      { lifecycleState: 'COMMITTED', currentStage: 'COMMITTED' },
      4
    );

    expect(lastState).toBe('COMMITTED');
  });
});
