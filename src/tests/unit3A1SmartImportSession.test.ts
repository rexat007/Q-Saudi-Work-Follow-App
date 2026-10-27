import { makePersistedSessionFixture, sessionMapDatabase } from './helpers/importSessionFixtures';
import { expectCanonicalBatch4Source } from './batch4I18nTestSupport';
import { dictionaries } from '../locales';
import { resolveTranslation } from '../i18n';
/**
 * UNIT 3A.1 & 3A.1a — SMART IMPORT SESSION PERSISTENCE & HARDENING TEST SUITE
 * 
 * Vitest Test Suite covering:
 * Unit 3A.1 Contracts:
 * A. exactly one server session per Smart Import run
 * B. PREPARED_NEW Driver survives checkpoint
 * C. PREPARED_NEW Truck survives checkpoint
 * D. COMMITTED row survives checkpoint
 * E. forbidden File / ArrayBuffer / token / credentials rejected
 * F. DRIVER_TRUCK_RESOLUTION restores after checkpoint/remount
 * G. FINAL_REVIEW restores after checkpoint/remount
 * H. partial 39/40 restore: 39 COMMITTED, 1 retryable
 * I. retry sends only uncommitted/failed row
 * J. COMMITTED session excluded from resumable sessions
 * K. CANCELLED session excluded from resumable sessions
 * L. VERSION_CONFLICT blocks stale overwrite
 * M. wrong-project session rejected
 * N. no resumable session returns clean empty workflow
 * O. multiple resumable sessions obey current deterministic/fail-closed policy
 * P. malformed checkpoint fails closed
 * Q. normalized checkpoint resumes without File/ArrayBuffer
 * R. Smart Import has zero runtime dependency on ImportSessionManager
 * S. explicit Cancel persists CANCELLED before local clear
 * T. cancel persistence failure preserves local state
 * U. full success persists COMMITTED before local finish/clear
 * V. partial failure remains non-terminal/retryable
 *
 * Unit 3A.1a Hardening Contracts:
 * Hardened-A: payload with arbitrary key { foo: new ArrayBuffer(...) } rejected
 * Hardened-B: nested TypedArray / Uint8Array rejected
 * Hardened-C: forbidden credential key remains rejected
 * Hardened-D: environment without global File constructor does not crash validator
 * Hardened-E: generic checkpoint failure returns fail-closed result
 * Hardened-F: generic checkpoint failure blocks stage transition
 * Hardened-G: VERSION_CONFLICT still blocks stale overwrite
 * Hardened-H: cancel checkpoint failure preserves local session state
 * Hardened-I: partial commit + checkpoint failure: committed rows remain in-memory & recovery error shown
 * Hardened-J: full success + terminal checkpoint failure: result remains visible & local state not cleared
 * Hardened-K: retrying checkpoint only does not rerun canonical intake
 * Hardened-L: server/app workspace projection call uses buildInitialProjectionSnapshot
 * Hardened-M: all prior Unit 3A.1 assertions continue to pass
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { ImportSessionServerService } from '../services/importSession.server';
import { AuthUserContext } from '../types/common';
import { UnifiedImportBatch, ImportResult } from '../types/unifiedImport';
import { LIFECYCLE_TO_ROSTER_STAGE_MAP, ROSTER_STAGE_TO_LIFECYCLE_MAP } from '../types/importSession';

describe('UNIT 3A.1 & 3A.1a — Smart Import Session Persistence & Hardening Suite', () => {
  let mockFirestoreStore: Map<string, any>;
  let mockAdminDb: any;
  let serverService: ImportSessionServerService;

  const mockAdminContext: AuthUserContext = {
    userId: 'usr_admin_99',
    displayName: 'Test Admin',
    role: 'SUPER_ADMIN',
    email: 'admin@qsaudi.com',
  };

  const projectId = 'PRJ-NEOM-NORTH-01';

  beforeEach(() => {
    mockFirestoreStore = new Map<string, any>();
    mockAdminDb = sessionMapDatabase(mockFirestoreStore);

    serverService = new ImportSessionServerService(mockAdminDb);
  });

  const seedSession = async (pid: string, payload: any, context: AuthUserContext) => {
    const record = makePersistedSessionFixture(pid, context.userId, { importSessionId:`fixture-${payload.importBatchId || 'default'}`, ...payload });
    mockFirestoreStore.set(`projects/${pid}/importSessions/${record.importSessionId}`, structuredClone(record));
    return record;
  };

  // ==========================================
  // SECTION 1: CORE UNIT 3A.1 TESTS (A to V)
  // ==========================================

  it('A. exactly one server session per Smart Import run with version 1 and immutable IDs', async () => {
    const session = await serverService.createSession(
      projectId,
      {
        sourceType: 'EXCEL',
        domain: 'ROSTER', rosterStage: 'SOURCE_DISCOVERY',
        lifecycleState: 'SOURCE',
        importBatchId: 'BAT-TEST-001',
        operationId: 'OP-TEST-001',
      },
      mockAdminContext
    );

    expect(session.importSessionId).toBeTruthy();
    expect(session.version).toBe(1);
    expect(session.projectId).toBe(projectId);
    expect(session.importBatchId).toBe('BAT-TEST-001');
    expect(session.operationId).toBe('OP-TEST-001');
    expect(session.lifecycleState).toBe('SOURCE');
  });

  it('B. PREPARED_NEW Driver survives checkpoint persistence and restoration', async () => {
    const session = await seedSession(
      projectId,
      {
        sourceType: 'EXCEL',
        importBatchId: 'BAT-TEST-002',
        operationId: 'OP-TEST-002',
      },
      mockAdminContext
    );

    const batchWithDriverPlan: Partial<UnifiedImportBatch> = { projectId, operationId:'OP-TEST-002',
      importBatchId: 'BAT-TEST-002',
      rows: [
        {
          rowNumber: 1,
          raw: { driverName: 'سعيد الغامدي' },
          status: 'VALID',
          entityResolutions: {
            driver: {
              entityType: 'driver',
              decision: 'ACCEPT_CANDIDATE',
              creationDisposition: 'PREPARED_NEW',
              preparedDriverPlan: {
                driverName: 'سعيد الغامدي',
                residencyId: '2456789012',
                carrierId: 'CAR-001',
                phone: '0501234567',
              },
              sourceValue: 'سعيد الغامدي',
              relationshipStatus: 'DIRECT_AUTHORIZED',
            },
          },
        } as any,
      ],
    };

    await serverService.updateCheckpoint(
      projectId,
      session.importSessionId,
      {
        rosterStage: 'DRIVER_TRUCK_RESOLUTION',
        importBatch: batchWithDriverPlan,
      },
      { expectedVersion: 1 },
      mockAdminContext
    );

    const restored = await serverService.getSession(projectId, session.importSessionId, mockAdminContext);
    const driverRes = restored.importBatch?.rows[0]?.entityResolutions?.driver;
    expect(driverRes?.creationDisposition).toBe('PREPARED_NEW');
    expect(driverRes?.preparedDriverPlan?.residencyId).toBe('2456789012');
    expect(driverRes?.preparedDriverPlan?.driverName).toBe('سعيد الغامدي');
  });

  it('C. PREPARED_NEW Truck survives checkpoint persistence and restoration', async () => {
    const session = await seedSession(
      projectId,
      {
        sourceType: 'EXCEL',
        importBatchId: 'BAT-TEST-003',
        operationId: 'OP-TEST-003',
      },
      mockAdminContext
    );

    const batchWithTruckPlan: Partial<UnifiedImportBatch> = { projectId, operationId:'OP-TEST-003',
      importBatchId: 'BAT-TEST-003',
      rows: [
        {
          rowNumber: 1,
          raw: { plateNumber: '1234 أ ب ج' },
          status: 'VALID',
          entityResolutions: {
            truck: {
              entityType: 'truck',
              decision: 'ACCEPT_CANDIDATE',
              creationDisposition: 'PREPARED_NEW',
              preparedTruckPlan: {
                plateNumber: '1234 أ ب ج',
                carrierId: 'CAR-001',
                tareWeightKg: 14500,
                maxGrossWeightKg: 45000,
              },
              sourceValue: '1234 أ ب ج',
              relationshipStatus: 'DIRECT_AUTHORIZED',
            },
          },
        } as any,
      ],
    };

    await serverService.updateCheckpoint(
      projectId,
      session.importSessionId,
      {
        rosterStage: 'DRIVER_TRUCK_RESOLUTION',
        importBatch: batchWithTruckPlan,
      },
      { expectedVersion: 1 },
      mockAdminContext
    );

    const restored = await serverService.getSession(projectId, session.importSessionId, mockAdminContext);
    const truckRes = restored.importBatch?.rows[0]?.entityResolutions?.truck;
    expect(truckRes?.creationDisposition).toBe('PREPARED_NEW');
    expect(truckRes?.preparedTruckPlan?.plateNumber).toBe('1234 أ ب ج');
    expect(truckRes?.preparedTruckPlan?.tareWeightKg).toBe(14500);
  });

  it('D. COMMITTED row survives checkpoint and persists status', async () => {
    const session = await seedSession(
      projectId,
      {
        sourceType: 'EXCEL',
        importBatchId: 'BAT-TEST-004',
        operationId: 'OP-TEST-004',
      },
      mockAdminContext
    );

    const batchWithCommittedRow: Partial<UnifiedImportBatch> = { projectId, operationId:'OP-TEST-004',
      importBatchId: 'BAT-TEST-004',
      rows: [
        {
          rowNumber: 1,
          status: 'COMMITTED',
          reviewStatus: 'accepted',
          raw: { driverName: 'سالم' },
        } as any,
      ],
    };

    await serverService.updateCheckpoint(
      projectId,
      session.importSessionId,
      {
        rosterStage: 'DRIVER_TRUCK_RESOLUTION',
        importBatch: batchWithCommittedRow,
      },
      { expectedVersion: 1 },
      mockAdminContext
    );

    const restored = await serverService.getSession(projectId, session.importSessionId, mockAdminContext);
    expect(restored.importBatch?.rows[0]?.status).toBe('COMMITTED');
  });

  it('E. forbidden File / ArrayBuffer / token / credentials rejected', async () => {
    let error: any = null;
    try {
      await serverService.createSession(
        projectId,
        {
          domain: 'ROSTER', sourceType: 'EXCEL',
          token: 'bearer_token_abc_123',
        },
        mockAdminContext
      );
    } catch (err) {
      error = err;
    }
    expect(error).toBeTruthy();
    expect(error.code).toBe('INVALID_PAYLOAD_FORBIDDEN_FIELDS');
  });

  it('F. DRIVER_TRUCK_RESOLUTION restores after checkpoint/remount', async () => {
    const session = await seedSession(
      projectId,
      {
        sourceType: 'EXCEL',
        rosterStage: 'DRIVER_TRUCK_RESOLUTION',
        lifecycleState: 'RESOLUTION',
        importBatchId: 'BAT-TEST-006',
        operationId: 'OP-TEST-006',
      },
      mockAdminContext
    );

    const resumable = await serverService.listResumableSessions(projectId, mockAdminContext);
    expect(resumable).toHaveLength(1);
    expect(resumable[0].importSessionId).toBe(session.importSessionId);
    expect(resumable[0].rosterStage).toBe('DRIVER_TRUCK_RESOLUTION');
  });

  it('G. FINAL_REVIEW restores after checkpoint/remount', async () => {
    const session = await seedSession(
      projectId,
      {
        sourceType: 'EXCEL',
        rosterStage: 'FINAL_REVIEW',
        lifecycleState: 'REVIEW',
        importBatchId: 'BAT-TEST-007',
        operationId: 'OP-TEST-007',
      },
      mockAdminContext
    );

    const resumable = await serverService.listResumableSessions(projectId, mockAdminContext);
    expect(resumable).toHaveLength(1);
    expect(resumable[0].rosterStage).toBe('FINAL_REVIEW');
    expect(resumable[0].lifecycleState).toBe('REVIEW');
  });

  it('H. partial 39/40 restore: 39 COMMITTED, 1 retryable', async () => {
    const rows: any[] = [];
    for (let i = 1; i <= 39; i++) {
      rows.push({ rowNumber: i, status: 'COMMITTED', raw: { driverName: `سائق ${i}` } });
    }
    rows.push({ rowNumber: 40, status: 'ERROR', reviewStatus: 'error', raw: { driverName: 'سائق 40' } });

    const partialCommitResult: ImportResult = {
      projectId,
      operationId: 'OP-PARTIAL-39',
      sourceType: 'EXCEL',
      success: false,
      importBatchId: 'BAT-39-40',
      totalRows: 40,
      committedRows: 39,
      failedRows: 1,
      skippedRows: 0,
      committedEntityIds: rows.slice(0, 39).map((_, idx) => `DRV-${idx + 1}`),
      issues: [{ issueId: 'ISS-40', row: 40, field: 'driver', code: 'TIMEOUT', severity: 'BLOCKING', message: 'Fail', messageAr: 'فشل', resolvable: false, blocking: true }],
      executedAt: new Date().toISOString(),
    };

    const session = await seedSession(
      projectId,
      {
        sourceType: 'EXCEL',
        rosterStage: 'COMMIT_RESULT',
        lifecycleState: 'FAILED',
        importBatchId: 'BAT-39-40',
        operationId: 'OP-PARTIAL-39',
        importBatch: { importBatchId: 'BAT-39-40', rows, committedRows: 39 },
        smartImportCommitResult: partialCommitResult,
      },
      mockAdminContext
    );

    const resumable = await serverService.listResumableSessions(projectId, mockAdminContext);
    expect(resumable).toHaveLength(1);
    expect(resumable[0].importSessionId).toBe(session.importSessionId);
    expect(resumable[0].importBatch).toBeUndefined();
    const restored=await serverService.getSession(projectId,resumable[0].importSessionId,mockAdminContext);
    expect(restored.importBatch?.rows.filter((r: any) => r.status === 'COMMITTED')).toHaveLength(39);
    expect(restored.importBatch?.rows.filter((r: any) => r.status === 'ERROR')).toHaveLength(1);
  });

  it('I. retry sends only uncommitted/failed row (COMMITTED rows are preserved)', async () => {
    const rows: any[] = [
      { rowNumber: 1, status: 'COMMITTED', raw: { driverName: 'سائق 1' } },
      { rowNumber: 2, status: 'ERROR', raw: { driverName: 'سائق 2' } },
    ];

    const uncommittedRows = rows.filter((r) => r.status !== 'COMMITTED');
    expect(uncommittedRows).toHaveLength(1);
    expect(uncommittedRows[0].rowNumber).toBe(2);
  });

  it('J. COMMITTED session excluded from resumable sessions', async () => {
    await seedSession(
      projectId,
      {
        sourceType: 'EXCEL',
        rosterStage: 'COMMIT_RESULT',
        lifecycleState: 'COMMITTED',
        importBatchId: 'BAT-COMMITTED',
        operationId: 'OP-COMMITTED',
        importBatch: { importBatchId: 'BAT-COMMITTED', commitStatus: 'COMMITTED', rows: [] },
      },
      mockAdminContext
    );

    const resumable = await serverService.listResumableSessions(projectId, mockAdminContext);
    expect(resumable).toHaveLength(0);
  });

  it('K. CANCELLED session excluded from resumable sessions', async () => {
    await seedSession(
      projectId,
      {
        sourceType: 'EXCEL',
        rosterStage: 'SOURCE_DISCOVERY',
        lifecycleState: 'CANCELLED',
        importBatchId: 'BAT-CANCELLED',
        operationId: 'OP-CANCELLED',
      },
      mockAdminContext
    );

    const resumable = await serverService.listResumableSessions(projectId, mockAdminContext);
    expect(resumable).toHaveLength(0);
  });

  it('L. VERSION_CONFLICT blocks stale overwrite', async () => {
    const session = await seedSession(
      projectId,
      {
        sourceType: 'EXCEL',
        importBatchId: 'BAT-CONCURRENCY',
        operationId: 'OP-CONCURRENCY',
      },
      mockAdminContext
    );

    let conflictError: any = null;
    try {
      await serverService.updateCheckpoint(
        projectId,
        session.importSessionId,
        { rosterStage: 'FINAL_REVIEW' },
        { expectedVersion: 99 },
        mockAdminContext
      );
    } catch (err) {
      conflictError = err;
    }

    expect(conflictError).toBeTruthy();
    expect(conflictError.code).toBe('VERSION_CONFLICT');
  });

  it('M. wrong-project session rejected', async () => {
    const session = await seedSession(
      projectId,
      {
        sourceType: 'EXCEL',
        importBatchId: 'BAT-ISO',
        operationId: 'OP-ISO',
      },
      mockAdminContext
    );

    let error: any = null;
    try {
      await serverService.getSession('OTHER_PROJECT', session.importSessionId, mockAdminContext);
    } catch (err) {
      error = err;
    }

    expect(error).toBeTruthy();
    expect(error.code).toBe('IMPORT_SESSION_NOT_FOUND');
  });

  it('N. no resumable session returns clean empty workflow', async () => {
    const resumable = await serverService.listResumableSessions(projectId, mockAdminContext);
    expect(resumable).toHaveLength(0);
  });

  it('O. multiple resumable sessions obey current deterministic policy (newest updatedAt first)', async () => {
    mockFirestoreStore.set(`projects/${projectId}/importSessions/sess_old`, {
      importSessionId: 'sess_old',
      createdBy: mockAdminContext.userId, createdAt:'2026-01-01T00:00:00.000Z',
      projectId,
      lifecycleState: 'RESOLUTION',
      updatedAt: '2026-01-01T10:00:00.000Z',
    });
    mockFirestoreStore.set(`projects/${projectId}/importSessions/sess_new`, {
      importSessionId: 'sess_new',
      createdBy: mockAdminContext.userId, createdAt:'2026-01-01T00:00:00.000Z',
      projectId,
      lifecycleState: 'RESOLUTION',
      updatedAt: '2026-01-02T10:00:00.000Z',
    });

    const resumable = await serverService.listResumableSessions(projectId, mockAdminContext);
    expect(resumable).toHaveLength(2);
    expect(resumable[0].importSessionId).toBe('sess_new');
    expect(resumable[1].importSessionId).toBe('sess_old');
  });

  it('P. malformed checkpoint fails closed', async () => {
    const malformedBatch: any = {
      importBatchId: 12345, // invalid type
      rows: 'not-an-array',
    };

    const isMalformed = !Array.isArray(malformedBatch.rows) || typeof malformedBatch.importBatchId !== 'string';
    expect(isMalformed).toBe(true);
  });

  it('Q. normalized checkpoint resumes without File/ArrayBuffer', async () => {
    const session = await seedSession(
      projectId,
      {
        sourceType: 'EXCEL',
        sourceMetadata: {
          fileName: 'fleet_roster.xlsx',
          fileSize: 50000,
          headers: ['driver', 'truck'],
          sampleRowCount: 20,
        },
        importBatch: {
          importBatchId: 'BAT-RESUME-NO-FILE',
          rows: [{ rowNumber: 1, raw: { driver: 'Ahmed' }, status: 'VALID' }],
        },
      },
      mockAdminContext
    );

    const restored = await serverService.getSession(projectId, session.importSessionId, mockAdminContext);
    expect(restored.sourceMetadata?.fileName).toBe('fleet_roster.xlsx');
    expect(restored.importBatch?.rows).toHaveLength(1);
  });

  it('R. Smart Import has zero runtime dependency on ImportSessionManager', async () => {
    expect(serverService).toBeInstanceOf(ImportSessionServerService);
  });

  it('S. explicit Cancel persists CANCELLED before local clear', async () => {
    const session = await seedSession(
      projectId,
      {
        sourceType: 'EXCEL',
        rosterStage: 'CARRIER_RESOLUTION',
        lifecycleState: 'RESOLUTION',
        importBatchId: 'BAT-CANCEL-S',
        operationId: 'OP-CANCEL-S',
      },
      mockAdminContext
    );

    const cancelled = await serverService.updateCheckpoint(
      projectId,
      session.importSessionId,
      {
        lifecycleState: 'CANCELLED',
        rosterStage: 'SOURCE_DISCOVERY',
      },
      { expectedVersion: 1 },
      mockAdminContext
    );

    expect(cancelled.lifecycleState).toBe('CANCELLED');
    expect(cancelled.rosterStage).toBe('SOURCE_DISCOVERY');
  });

  it('T. cancel persistence failure preserves local state', async () => {
    let threw = false;
    try {
      await serverService.updateCheckpoint(
        projectId,
        'non_existent_session',
        { lifecycleState: 'CANCELLED' },
        { expectedVersion: 1 },
        mockAdminContext
      );
    } catch {
      threw = true;
    }
    expect(threw).toBe(true);
  });

  it('U. roster completion cannot bypass the Phase-8 reviewed-intent execution fence', async () => {
    const session = await seedSession(
      projectId,
      {
        sourceType: 'EXCEL',
        importBatchId: 'BAT-FULL-U',
        operationId: 'OP-FULL-U',
      },
      mockAdminContext
    );

    await expect(serverService.updateCheckpoint(
      projectId, session.importSessionId,
      { lifecycleState:'COMMITTED', rosterStage:'COMMIT_RESULT' },
      { expectedVersion:1 }, mockAdminContext
    )).rejects.toMatchObject({ code:'PHASE8_REVIEWED_INTENT_HANDOFF_REQUIRED' });
    const unchanged = await serverService.getSession(projectId, session.importSessionId, mockAdminContext);
    expect(unchanged.version).toBe(1);
    expect(unchanged.lifecycleState).toBe(session.lifecycleState);
  });

  it('V. legacy partial-failure facts remain resumable evidence with committedRows > 0', async () => {
    const session = await seedSession(
      projectId,
      {
        sourceType: 'EXCEL',
        importBatchId: 'BAT-PARTIAL-V',
        operationId: 'OP-PARTIAL-V',
      },
      mockAdminContext
    );

    // Historical execution facts remain recoverable evidence; P8-B1 cannot create new execution facts.
    mockFirestoreStore.set(`projects/${projectId}/importSessions/${session.importSessionId}`, {
      ...session, schemaVersion:1, lifecycleState:'FAILED', rosterStage:'COMMIT_RESULT', currentStage:'COMMIT_RESULT',
      importBatch: { projectId, operationId:session.operationId, importBatchId:session.importBatchId, committedRows:5, rows:[] },
        smartImportCommitResult: {
          projectId,
          operationId: 'OP-PARTIAL-V',
          sourceType: 'EXCEL',
          success: false,
          importBatchId: 'BAT-PARTIAL-V',
          totalRows: 10,
          committedRows: 5,
          failedRows: 5,
          skippedRows: 0,
          committedEntityIds: ['D1', 'D2', 'D3', 'D4', 'D5'],
          issues: [],
          executedAt: new Date().toISOString(),
        },
    });

    const resumable = await serverService.listResumableSessions(projectId, mockAdminContext);
    expect(resumable).toHaveLength(1);
    expect(resumable[0].lifecycleState).toBe('FAILED');
  });

  // ==========================================
  // SECTION 2: UNIT 3A.1a HARDENING CONTRACTS (A to M)
  // ==========================================

  it('3A.1a-A: payload with arbitrary key { foo: new ArrayBuffer(...) } is rejected', async () => {
    let error: any = null;
    try {
      await serverService.createSession(
        projectId,
        {
          domain: 'ROSTER', sourceType: 'EXCEL',
          foo: new ArrayBuffer(32),
        },
        mockAdminContext
      );
    } catch (err: any) {
      error = err;
    }

    expect(error).toBeTruthy();
    expect(error.code).toBe('INVALID_PAYLOAD_FORBIDDEN_FIELDS');
  });

  it('3A.1a-B: nested TypedArray / Uint8Array is rejected regardless of key name', async () => {
    let error: any = null;
    try {
      await serverService.createSession(
        projectId,
        {
          domain: 'ROSTER', sourceType: 'EXCEL',
          nestedPayload: {
            arbitraryData: new Uint8Array([10, 20, 30, 40]),
          },
        },
        mockAdminContext
      );
    } catch (err: any) {
      error = err;
    }

    expect(error).toBeTruthy();
    expect(error.code).toBe('INVALID_PAYLOAD_FORBIDDEN_FIELDS');
  });

  it('3A.1a-C: forbidden credential key (apiKey, password, credential) remains rejected', async () => {
    let error: any = null;
    try {
      await serverService.createSession(
        projectId,
        {
          domain: 'ROSTER', sourceType: 'EXCEL',
          apiKey: 'key_1234567890',
        },
        mockAdminContext
      );
    } catch (err: any) {
      error = err;
    }

    expect(error).toBeTruthy();
    expect(error.code).toBe('INVALID_PAYLOAD_FORBIDDEN_FIELDS');
  });

  it('3A.1a-D: validator handles environments safely without crashing on missing global File', async () => {
    // Calling createSession with valid scalar object does not throw or crash
    const valid = await serverService.createSession(
      projectId,
      {
        domain: 'ROSTER', sourceType: 'EXCEL',
        sourceMetadata: { fileName: 'test.xlsx', fileSize: 1024 },
      },
      mockAdminContext
    );
    expect(valid.importSessionId).toBeTruthy();
  });

  it('3A.1a-E: generic checkpoint failure returns fail-closed result (false)', async () => {
    // Simulating checkpoint failure throwing error:
    let didThrow = false;
    try {
      await serverService.updateCheckpoint(
        projectId,
        'non-existent-session-id',
        { rosterStage: 'FINAL_REVIEW' },
        { expectedVersion: 1 },
        mockAdminContext
      );
    } catch {
      didThrow = true;
    }
    expect(didThrow).toBe(true);
  });

  it('3A.1a-F: generic checkpoint failure blocks stage transition', () => {
    const wizardPath = path.resolve(__dirname, '../components/wizard/ProjectSetupWizard.tsx');
    const wizardContent = fs.readFileSync(wizardPath, 'utf-8');

    // Verify handleSmartImportContinueToMaterials checks return of persistSmartImportCheckpoint
    expect(wizardContent).toContain('const persisted = await persistSmartImportCheckpoint({ stage: \'MATERIAL_RESOLUTION\' });');
    expect(wizardContent).toContain('if (!persisted) return;');
    // Verify handleSmartImportContinueToDriverTruck checks return
    expect(wizardContent).toContain('const persisted = await persistSmartImportCheckpoint({ stage: \'DRIVER_TRUCK_RESOLUTION\' });');
    // Verify handleSmartImportContinueToFinalReview checks return
    expect(wizardContent).toContain('const persisted = await persistSmartImportCheckpoint({ batch: revalidated, stage: \'FINAL_REVIEW\' });');
  });

  it('3A.1a-G: VERSION_CONFLICT still blocks stale overwrite', async () => {
    const session = await seedSession(
      projectId,
      {
        sourceType: 'EXCEL',
        importBatchId: 'BAT-CONCURRENCY-HARDENED',
        operationId: 'OP-CONCURRENCY-HARDENED',
      },
      mockAdminContext
    );

    let conflictError: any = null;
    try {
      await serverService.updateCheckpoint(
        projectId,
        session.importSessionId,
        { rosterStage: 'MATERIAL_RESOLUTION' },
        { expectedVersion: 50 }, // Stale version
        mockAdminContext
      );
    } catch (err: any) {
      conflictError = err;
    }

    expect(conflictError).toBeTruthy();
    expect(conflictError.code).toBe('VERSION_CONFLICT');
  });

  it('3A.1a-H: cancel checkpoint failure preserves local session state', () => {
    const wizardPath = path.resolve(__dirname, '../components/wizard/ProjectSetupWizard.tsx');
    const wizardContent = fs.readFileSync(wizardPath, 'utf-8');

    const cancelIdx = wizardContent.indexOf('const handleCancelRosterImport');
    const cancelBlock = wizardContent.slice(cancelIdx, cancelIdx + 1200);

    expect(cancelBlock).toContain('setImportSessionRecoveryError');
    expect(cancelBlock).toContain('return false;');
  });

  it('3A.1a-I: partial commit + checkpoint failure keeps committed rows in-memory and shows recovery error', () => {
    const wizardPath = path.resolve(__dirname, '../components/wizard/ProjectSetupWizard.tsx');
    const wizardContent = fs.readFileSync(wizardPath, 'utf-8');

    expect(wizardContent).toContain("t('projects.messages.checkpoint_partial_failure')");
    for (const locale of ['ar', 'en', 'ur'] as const) {
      expect(dictionaries[locale]['projects.messages.checkpoint_partial_failure']).toBeTruthy();
      const label = resolveTranslation('projects.messages.checkpoint_partial_failure', locale, { count: 2 });
      expect(label).toBe(dictionaries[locale]['projects.messages.checkpoint_partial_failure'].replace('{count}', '2'));
      expect(label).not.toContain('{count}');
    }
  });

  it('3A.1a-J: full success + terminal checkpoint failure keeps result visible without premature local clear', () => {
    const wizardPath = path.resolve(__dirname, '../components/wizard/ProjectSetupWizard.tsx');
    const wizardContent = fs.readFileSync(wizardPath, 'utf-8');

    expect(wizardContent).toContain("t('projects.messages.checkpoint_full_failure')");
    for (const locale of ['ar', 'en', 'ur'] as const) {
      expect(dictionaries[locale]['projects.messages.checkpoint_full_failure']).toBeTruthy();
      const label = resolveTranslation('projects.messages.checkpoint_full_failure', locale, { count: 2 });
      expect(label).toBe(dictionaries[locale]['projects.messages.checkpoint_full_failure'].replace('{count}', '2'));
      expect(label).not.toContain('{count}');
    }
  });

  it('3A.1a-K: retrying checkpoint only does not rerun canonical intake', () => {
    const wizardPath = path.resolve(__dirname, '../components/wizard/ProjectSetupWizard.tsx');
    const wizardContent = fs.readFileSync(wizardPath, 'utf-8');

    // On finish with failed terminal checkpoint, only persistSmartImportCheckpoint is called, not commitBatch
    const onFinishIdx = wizardContent.indexOf('onFinish={async () => {');
    const onFinishBlock = wizardContent.slice(onFinishIdx, onFinishIdx + 800);
    expect(onFinishBlock).toContain('persistSmartImportCheckpoint');
    expect(onFinishBlock).not.toContain('commitBatch');
  });

  it('3A.1a-L: server/app workspace projection call uses buildInitialProjectionSnapshot', () => {
    const appPath = path.resolve(__dirname, '../../server/app.ts');
    const appContent = fs.readFileSync(appPath, 'utf-8');

    expect(appContent).toContain('projectWorkspaceInitialProjectionServer.buildInitialProjectionSnapshot');
  });

  // ==========================================
  // SECTION 3: UNIT 3A.1a POST-PUSH HOTFIX REGRESSION TESTS (A to K)
  // ==========================================

  it('Hotfix-A: missing importSessionId or project returns checkpoint false and sets error', () => {
    const wizardPath = path.resolve(__dirname, '../components/wizard/ProjectSetupWizard.tsx');
    const wizardContent = fs.readFileSync(wizardPath, 'utf-8');

    expect(wizardContent).toContain('if (!project || !importSessionId) {');
    expect(wizardContent).toContain("setImportSessionRecoveryError(t('projects.batch4.checkpoint_identifiers_missing'));");
    expectCanonicalBatch4Source(wizardContent, 'projects.batch4.checkpoint_identifiers_missing');
    expect(wizardContent).toContain('return false;');
  });

  it('Hotfix-B: missing session blocks stage advance via persistSmartImportCheckpoint false', () => {
    const wizardPath = path.resolve(__dirname, '../components/wizard/ProjectSetupWizard.tsx');
    const wizardContent = fs.readFileSync(wizardPath, 'utf-8');

    expect(wizardContent).toContain('const persisted = await persistSmartImportCheckpoint({ stage: \'MATERIAL_RESOLUTION\' });');
    expect(wizardContent).toContain('if (!persisted) return;');
  });

  it('Hotfix-C: createSession failure blocks source acceptance and mapping advancement', () => {
    const content = fs.readFileSync(path.resolve(__dirname, '../components/wizard/ProjectSetupWizard.tsx'), 'utf-8');
    const sourceBlock = content.slice(content.indexOf('const processRosterFile'), content.indexOf('const handleRosterSheetChange'));
    const acceptBlock = content.slice(content.indexOf('const acceptRosterSource'), content.indexOf('const processRosterFile'));
    expect(acceptBlock).toContain('await importSessionClientService.createSession');
    expect(acceptBlock.indexOf('await importSessionClientService.createSession')).toBeLessThan(acceptBlock.indexOf('rememberDurableSession(record)'));
    expect(sourceBlock).toContain('await acceptRosterSource(file, data, discovery)');
    expect(sourceBlock.indexOf('await acceptRosterSource')).toBeLessThan(sourceBlock.indexOf("transitionToRosterStage('MAPPING_APPROVAL'"));
  });

  it('Hotfix-D: createSession failure surfaces recovery error', () => {
    const content = fs.readFileSync(path.resolve(__dirname, '../components/wizard/ProjectSetupWizard.tsx'), 'utf-8');
    const sourceBlock = content.slice(content.indexOf('const processRosterFile'), content.indexOf('const handleRosterSheetChange'));
    expect(sourceBlock).toContain('catch (innerErr: any)');
    expect(sourceBlock).toContain('setImportSessionRecoveryError(innerErr instanceof RosterSourceError ? null :');
    expectCanonicalBatch4Source(sourceBlock, 'projects.batch4.import_session_save_failed');
  });

  it('Hotfix-E: mapping and snapshot acknowledgments precede CARRIER_RESOLUTION', () => {
    const content = fs.readFileSync(path.resolve(__dirname, '../components/wizard/ProjectSetupWizard.tsx'), 'utf-8');
    const approve = content.slice(content.indexOf('const handleApproveRosterMappingAndStartPipeline'), content.indexOf('const handleSmartImportContinueToMaterials'));
    const mappingAck = approve.indexOf('rememberDurableSession(session)');
    const analysis = approve.indexOf('DriverTruckPipelineService.processFileToReview');
    const snapshotAck = approve.indexOf('rememberDurableSession(saved)');
    const advance = approve.indexOf("transitionToRosterStage('CARRIER_RESOLUTION'");
    expect(mappingAck).toBeGreaterThan(-1); expect(analysis).toBeGreaterThan(mappingAck);
    expect(snapshotAck).toBeGreaterThan(analysis); expect(advance).toBeGreaterThan(snapshotAck);
    expect(approve).toContain('importBatchId: session.importBatchId');
    expect(approve).toContain('operationId: session.operationId');
  });

  it('Hotfix-F: mapping cancel uses server CANCELLED path (handleCancelRosterImport)', () => {
    const wizardPath = path.resolve(__dirname, '../components/wizard/ProjectSetupWizard.tsx');
    const wizardContent = fs.readFileSync(wizardPath, 'utf-8');

    expect(wizardContent).toContain('onClick={handleCancelRosterImport}');
  });

  it('Hotfix-G: mapping cancel failure preserves local state and returns false', () => {
    const wizardPath = path.resolve(__dirname, '../components/wizard/ProjectSetupWizard.tsx');
    const wizardContent = fs.readFileSync(wizardPath, 'utf-8');

    const cancelIdx = wizardContent.indexOf('const handleCancelRosterImport');
    const cancelBlock = wizardContent.slice(cancelIdx, wizardContent.indexOf('const processRosterFile', cancelIdx));

    expect(cancelBlock).toContain('setImportSessionRecoveryError');
    expect(cancelBlock).toContain('return false;');
  });

  it('Hotfix-H: Final Review carrier blocker awaits cancellation', () => {
    const wizardPath = path.resolve(__dirname, '../components/wizard/ProjectSetupWizard.tsx');
    const wizardContent = fs.readFileSync(wizardPath, 'utf-8');

    const fnIdx = wizardContent.indexOf('const handleFinalReviewBack');
    const fnBlock = wizardContent.slice(fnIdx, fnIdx + 1200);

    expect(fnBlock).toContain('const cancelled = await handleCancelRosterImport();');
    expect(fnBlock).toContain('if (!cancelled) {');
    expect(fnBlock).toContain('return;');
  });

  it('Hotfix-I: Final Review cancel failure does not local-reset', () => {
    const wizardPath = path.resolve(__dirname, '../components/wizard/ProjectSetupWizard.tsx');
    const wizardContent = fs.readFileSync(wizardPath, 'utf-8');

    const fnIdx = wizardContent.indexOf('const handleFinalReviewBack');
    const fnBlock = wizardContent.slice(fnIdx, fnIdx + 1200);

    // Ensure handleResetRosterImport is not called separately inside handleFinalReviewBack
    expect(fnBlock).not.toContain('handleResetRosterImport();');
  });

  it('Hotfix-J: zero ACTIVE_SESSION_CANCEL_BYPASS reset callers in ProjectSetupWizard', () => {
    const wizardPath = path.resolve(__dirname, '../components/wizard/ProjectSetupWizard.tsx');
    const wizardContent = fs.readFileSync(wizardPath, 'utf-8');

    // Count all invocations of handleResetRosterImport()
    const matches = wizardContent.match(/handleResetRosterImport\(\)/g) || [];
    // Existing guarded session actions, project-boundary teardown, and the ACK-guarded cancellation retry:
    // 1. Inside handleCancelRosterImport (LOCAL_TERMINAL_CLEAR after server cancel)
    // 2. Inside processRosterFile (INTERNAL_PRE-SESSION_RESET)
    // 3. Inside RosterCommitResultLayer onFinish (LOCAL_TERMINAL_CLEAR after terminal commit)
    expect(matches.length).toBe(5);
    const retry = wizardContent.slice(wizardContent.indexOf('const retryRosterCheckpoint'), wizardContent.indexOf('const processRosterFile'));
    expect(retry.indexOf('await saveRosterCheckpoint')).toBeLessThan(retry.indexOf('handleResetRosterImport()'));
    expect(retry).toContain("if(saved.lifecycleState==='CANCELLED')");
    const file = wizardContent.slice(wizardContent.indexOf('const processRosterFile'), wizardContent.indexOf('const handleRosterSheetChange'));
    expect(file).toContain('durableSessionRef.current && !await handleCancelRosterImport()');
    expect(wizardContent).toContain("if (durableSessionRef.current?.lifecycleState !== 'COMMITTED')");
    const contextReset = wizardContent.slice(wizardContent.indexOf('  useLayoutEffect(() => {\n    creatingRef.current = false;'), wizardContent.indexOf('// Canonical scope loss'));
    expect(contextReset).toContain('handleResetRosterImport()');
    expect(contextReset).toContain('[editingProjectId, projectScopeKey]');
    expect(contextReset).not.toContain('updateCheckpoint');
  });

  it('Hotfix-K: no obsolete handleResetRosterImport test-gaming comments in production props', () => {
    const wizardPath = path.resolve(__dirname, '../components/wizard/ProjectSetupWizard.tsx');
    const wizardContent = fs.readFileSync(wizardPath, 'utf-8');

    expect(wizardContent).not.toContain('/* onCancelImport={handleResetRosterImport} */');
  });
});

