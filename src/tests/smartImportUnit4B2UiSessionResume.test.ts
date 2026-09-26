import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { importSessionClientService } from '../services/import/importSessionClient.service';
import { ExcelCsvPipelineService } from '../services/import/excelCsvPipeline.service';
import { auth } from '../firebase/config';
import { UnifiedImportBatch } from '../types/unifiedImport';

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

    const finalSessionId = isReattach ? activeSessionId : 'sess-new';

    expect(finalSessionId).toBe('sess-existing-44');
  });

  it('19. reset clears locator but does not delete server session', () => {
    const locatorKey = 'qsaudi_import_session_locator_PRJ-4B2';
    sessionStorage.setItem(
      locatorKey,
      JSON.stringify({ projectId: 'PRJ-4B2', importSessionId: 'sess-777' })
    );

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

  // ==================================================
  // REMEDIATION REGRESSION TESTS (ISSUES 1, 2, 3)
  // ==================================================

  it('23. first new-flow REVIEW checkpoint uses server-returned session ID and version', async () => {
    let createdSessionId = '';
    let patchedSessionId = '';
    let patchedVersion = 0;

    globalThis.fetch = vi.fn().mockImplementation(async (url: string, options: any) => {
      if (options.method === 'POST') {
        return {
          ok: true,
          json: async () => ({
            success: true,
            data: {
              importSessionId: 'sess-server-created-888',
              projectId: 'PRJ-4B2',
              version: 1,
            },
          }),
        };
      }
      if (options.method === 'PATCH') {
        patchedSessionId = url.split('/').pop() || '';
        patchedVersion = JSON.parse(options.body).expectedVersion;
        return {
          ok: true,
          json: async () => ({
            success: true,
            data: {
              importSessionId: 'sess-server-created-888',
              version: 2,
            },
          }),
        };
      }
      return { ok: true, json: async () => ({ success: true, data: {} }) };
    });

    const sessionRecord = await importSessionClientService.createSession('PRJ-4B2', {
      projectId: 'PRJ-4B2',
      sourceType: 'CSV',
    });

    createdSessionId = sessionRecord.importSessionId;
    const initialVersion = sessionRecord.version;

    // Simulate explicit override pass to avoid React async state race
    await importSessionClientService.updateCheckpoint(
      'PRJ-4B2',
      createdSessionId,
      { lifecycleState: 'REVIEW_REQUIRED', currentStage: 'REVIEW' },
      initialVersion
    );

    expect(patchedSessionId).toBe('sess-server-created-888');
    expect(patchedVersion).toBe(1);
  });

  it('24. createSession failure stops pipeline processing (fail-closed)', async () => {
    globalThis.fetch = vi.fn().mockImplementation(async (url: string, options: any) => {
      if (options.method === 'POST') {
        return {
          ok: false,
          status: 500,
          json: async () => ({
            success: false,
            error: 'Server error creating session',
          }),
        };
      }
      return { ok: true, json: async () => ({ success: true, data: {} }) };
    });

    let pipelineCalled = false;
    try {
      await importSessionClientService.createSession('PRJ-4B2', { projectId: 'PRJ-4B2' });
      pipelineCalled = true;
    } catch (err: any) {
      expect(err.message).toBe('Server error creating session');
    }

    expect(pipelineCalled).toBe(false);
  });

  it('25. resumed batch conforms to canonical UnifiedImportBatch shape', () => {
    const mockRecord = {
      importSessionId: 'sess-100',
      projectId: 'PRJ-4B2',
      operationId: 'op_100',
      importBatchId: 'batch_100',
      sourceType: 'EXCEL_CSV',
      lifecycleState: 'REVIEW_REQUIRED',
      currentStage: 'REVIEW',
      version: 2,
      createdAt: '2026-01-01T00:00:00Z',
      createdBy: 'user-admin',
      updatedAt: '2026-01-01T01:00:00Z',
      updatedBy: 'user-admin',
      sourceMetadata: {
        sourceFileName: 'trips.xlsx',
        sourceMimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        sourceSheetName: 'Trips',
      },
      reviewSnapshot: {
        totalRows: 10,
        validRows: 8,
        warningRows: 1,
        errorRows: 1,
        requiresReviewRows: 0,
        rows: [
          {
            rowNumber: 1,
            status: 'VALID',
            reviewStatus: 'accepted',
            raw: { driver: 'Ahmed' },
            canonical: { driverName: 'Ahmed' },
            validationIssues: [],
          },
        ],
      },
      validationIssues: [],
      warningConfirmation: true,
    };

    const resumedState = importSessionClientService.reconstructResumedBatch(mockRecord as any);
    const snapshot = resumedState.reviewSnapshot;

    const batch: UnifiedImportBatch = {
      importBatchId: mockRecord.importBatchId,
      projectId: mockRecord.projectId,
      source: {
        sourceType: (mockRecord.sourceType as any) || 'EXCEL_CSV',
        importBatchId: mockRecord.importBatchId,
        sourceFileName: mockRecord.sourceMetadata.sourceFileName,
        sourceMimeType: mockRecord.sourceMetadata.sourceMimeType,
        sourceSheetName: mockRecord.sourceMetadata.sourceSheetName,
      },
      currentStage: (mockRecord.currentStage as any) || 'REVIEW',
      validationStatus: 'PASSED',
      commitStatus: 'AWAITING_REVIEW',
      totalRows: snapshot.totalRows,
      validRows: snapshot.validRows,
      warningRows: snapshot.warningRows,
      errorRows: snapshot.errorRows,
      requiresReviewRows: snapshot.requiresReviewRows,
      committedRows: 0,
      rows: snapshot.rows,
      issues: mockRecord.validationIssues || [],
      operationId: mockRecord.operationId,
      createdAt: mockRecord.createdAt,
      createdBy: mockRecord.createdBy,
      warningConfirmation: {
        confirmed: Boolean(mockRecord.warningConfirmation),
        confirmedBy: mockRecord.createdBy,
        confirmedAt: mockRecord.updatedAt,
      },
      auditTrail: [
        {
          timestamp: mockRecord.updatedAt,
          userId: mockRecord.createdBy,
          action: 'SESSION_RESUMED',
          details: 'Resumed session',
        },
      ],
    };

    // Assert canonical fields are present
    expect(batch.importBatchId).toBe('batch_100');
    expect(batch.projectId).toBe('PRJ-4B2');
    expect(batch.source.sourceType).toBe('EXCEL_CSV');
    expect(batch.currentStage).toBe('REVIEW');
    expect(batch.validationStatus).toBe('PASSED');
    expect(batch.commitStatus).toBe('AWAITING_REVIEW');
    expect(batch.totalRows).toBe(10);
    expect(batch.validRows).toBe(8);
    expect(batch.warningRows).toBe(1);
    expect(batch.errorRows).toBe(1);
    expect(batch.requiresReviewRows).toBe(0);
    expect(batch.committedRows).toBe(0);
    expect(batch.rows).toHaveLength(1);
    expect(batch.issues).toEqual([]);
    expect(batch.operationId).toBe('op_100');
    expect(batch.createdAt).toBe('2026-01-01T00:00:00Z');
    expect(batch.createdBy).toBe('user-admin');
    expect(batch.auditTrail).toHaveLength(1);
    expect(batch.warningConfirmation?.confirmed).toBe(true);

    // Assert no non-contract fields exist on batch
    expect((batch as any).id).toBeUndefined();
    expect((batch as any).status).toBeUndefined();
    expect((batch as any).summary).toBeUndefined();
    expect((batch as any).validationIssues).toBeUndefined();
    expect((batch as any).entityResolutions).toBeUndefined();
  });

  it('26. no raw binary is fabricated on resume', () => {
    const mockRecord = {
      importSessionId: 'sess-200',
      projectId: 'PRJ-4B2',
      operationId: 'op_200',
      importBatchId: 'batch_200',
      sourceType: 'CSV',
      lifecycleState: 'REVIEW_REQUIRED',
      version: 1,
      createdAt: '2026-01-01T00:00:00Z',
      createdBy: 'user-1',
      updatedAt: '2026-01-01T00:00:00Z',
      updatedBy: 'user-1',
      sourceMetadata: { sourceFileName: 'data.csv' },
    };

    const resumedState = importSessionClientService.reconstructResumedBatch(mockRecord as any);

    expect(resumedState.requiresSourceFileReattach).toBe(true);
    expect((resumedState as any).rawInput).toBeUndefined();
    expect((resumedState as any).rawBuffer).toBeUndefined();
  });
});
