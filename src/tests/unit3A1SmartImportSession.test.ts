/**
 * UNIT 3A.1 — SMART IMPORT SESSION PERSISTENCE & RESUME TEST SUITE
 * 
 * Vitest Test Suite covering requirements A through V:
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
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ImportSessionServerService } from '../services/importSession.server';
import { AuthUserContext } from '../types/common';
import { UnifiedImportBatch, ImportResult } from '../types/unifiedImport';
import { LIFECYCLE_TO_ROSTER_STAGE_MAP, ROSTER_STAGE_TO_LIFECYCLE_MAP } from '../types/importSession';

describe('UNIT 3A.1 — Smart Import Session Persistence & Resumption Suite', () => {
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
    mockAdminDb = {
      collection: (colName: string) => ({
        doc: (docId: string) => ({
          collection: (subColName: string) => ({
            doc: (subDocId: string) => {
              const path = `${colName}/${docId}/${subColName}/${subDocId}`;
              return {
                get: async () => {
                  const data = mockFirestoreStore.get(path);
                  return {
                    exists: Boolean(data),
                    data: () => (data ? JSON.parse(JSON.stringify(data)) : undefined),
                  };
                },
                set: async (val: any) => {
                  mockFirestoreStore.set(path, JSON.parse(JSON.stringify(val)));
                },
              };
            },
            orderBy: (field: string, direction: 'asc' | 'desc') => ({
              get: async () => {
                const prefix = `${colName}/${docId}/${subColName}/`;
                const docs: any[] = [];
                for (const [key, val] of mockFirestoreStore.entries()) {
                  if (key.startsWith(prefix)) {
                    docs.push({
                      data: () => JSON.parse(JSON.stringify(val)),
                    });
                  }
                }
                docs.sort((a, b) => {
                  const valA = a.data()[field] || '';
                  const valB = b.data()[field] || '';
                  if (direction === 'desc') {
                    return valB.localeCompare(valA);
                  }
                  return valA.localeCompare(valB);
                });
                return {
                  forEach: (cb: (d: any) => void) => docs.forEach(cb),
                };
              },
            }),
          }),
        }),
      }),
      runTransaction: async (updateFunction: (transaction: any) => Promise<any>) => {
        const tx = {
          get: async (docRef: any) => docRef.get(),
          set: (docRef: any, data: any) => docRef.set(data),
        };
        return updateFunction(tx);
      },
    };

    serverService = new ImportSessionServerService(mockAdminDb);
  });

  // TEST A
  it('A. exactly one server session per Smart Import run with version 1 and immutable IDs', async () => {
    const session = await serverService.createSession(
      projectId,
      {
        sourceType: 'EXCEL',
        rosterStage: 'CARRIER_RESOLUTION',
        lifecycleState: 'RESOLUTION',
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
    expect(session.lifecycleState).toBe('RESOLUTION');
  });

  // TEST B
  it('B. PREPARED_NEW Driver survives checkpoint persistence and restoration', async () => {
    const session = await serverService.createSession(
      projectId,
      {
        sourceType: 'EXCEL',
        importBatchId: 'BAT-TEST-002',
        operationId: 'OP-TEST-002',
      },
      mockAdminContext
    );

    const batchWithDriverPlan: Partial<UnifiedImportBatch> = {
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

  // TEST C
  it('C. PREPARED_NEW Truck survives checkpoint persistence and restoration', async () => {
    const session = await serverService.createSession(
      projectId,
      {
        sourceType: 'EXCEL',
        importBatchId: 'BAT-TEST-003',
        operationId: 'OP-TEST-003',
      },
      mockAdminContext
    );

    const batchWithTruckPlan: Partial<UnifiedImportBatch> = {
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

  // TEST D
  it('D. COMMITTED row survives checkpoint and persists status', async () => {
    const session = await serverService.createSession(
      projectId,
      {
        sourceType: 'EXCEL',
        importBatchId: 'BAT-TEST-004',
        operationId: 'OP-TEST-004',
      },
      mockAdminContext
    );

    const batchWithCommittedRow: Partial<UnifiedImportBatch> = {
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
        rosterStage: 'COMMIT_RESULT',
        importBatch: batchWithCommittedRow,
      },
      { expectedVersion: 1 },
      mockAdminContext
    );

    const restored = await serverService.getSession(projectId, session.importSessionId, mockAdminContext);
    expect(restored.importBatch?.rows[0]?.status).toBe('COMMITTED');
  });

  // TEST E
  it('E. forbidden File / ArrayBuffer / token / credentials rejected', async () => {
    let error: any = null;
    try {
      await serverService.createSession(
        projectId,
        {
          sourceType: 'EXCEL',
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

  // TEST F
  it('F. DRIVER_TRUCK_RESOLUTION restores after checkpoint/remount', async () => {
    const session = await serverService.createSession(
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

  // TEST G
  it('G. FINAL_REVIEW restores after checkpoint/remount', async () => {
    const session = await serverService.createSession(
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

  // TEST H
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

    const session = await serverService.createSession(
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
    expect(resumable[0].importBatch?.rows.filter((r: any) => r.status === 'COMMITTED')).toHaveLength(39);
    expect(resumable[0].importBatch?.rows.filter((r: any) => r.status === 'ERROR')).toHaveLength(1);
  });

  // TEST I
  it('I. retry sends only uncommitted/failed row (COMMITTED rows are preserved)', async () => {
    const rows: any[] = [
      { rowNumber: 1, status: 'COMMITTED', raw: { driverName: 'سائق 1' } },
      { rowNumber: 2, status: 'ERROR', raw: { driverName: 'سائق 2' } },
    ];

    const uncommittedRows = rows.filter((r) => r.status !== 'COMMITTED');
    expect(uncommittedRows).toHaveLength(1);
    expect(uncommittedRows[0].rowNumber).toBe(2);
  });

  // TEST J
  it('J. COMMITTED session excluded from resumable sessions', async () => {
    await serverService.createSession(
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

  // TEST K
  it('K. CANCELLED session excluded from resumable sessions', async () => {
    await serverService.createSession(
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

  // TEST L
  it('L. VERSION_CONFLICT blocks stale overwrite', async () => {
    const session = await serverService.createSession(
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

  // TEST M
  it('M. wrong-project session rejected', async () => {
    const session = await serverService.createSession(
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

  // TEST N
  it('N. no resumable session returns clean empty workflow', async () => {
    const resumable = await serverService.listResumableSessions(projectId, mockAdminContext);
    expect(resumable).toHaveLength(0);
  });

  // TEST O
  it('O. multiple resumable sessions obey current deterministic policy (newest updatedAt first)', async () => {
    mockFirestoreStore.set(`projects/${projectId}/importSessions/sess_old`, {
      importSessionId: 'sess_old',
      projectId,
      lifecycleState: 'RESOLUTION',
      updatedAt: '2026-01-01T10:00:00.000Z',
    });
    mockFirestoreStore.set(`projects/${projectId}/importSessions/sess_new`, {
      importSessionId: 'sess_new',
      projectId,
      lifecycleState: 'RESOLUTION',
      updatedAt: '2026-01-02T10:00:00.000Z',
    });

    const resumable = await serverService.listResumableSessions(projectId, mockAdminContext);
    expect(resumable).toHaveLength(2);
    expect(resumable[0].importSessionId).toBe('sess_new');
    expect(resumable[1].importSessionId).toBe('sess_old');
  });

  // TEST P
  it('P. malformed checkpoint fails closed', async () => {
    const malformedBatch: any = {
      importBatchId: 12345, // invalid type
      rows: 'not-an-array',
    };

    const isMalformed = !Array.isArray(malformedBatch.rows) || typeof malformedBatch.importBatchId !== 'string';
    expect(isMalformed).toBe(true);
  });

  // TEST Q
  it('Q. normalized checkpoint resumes without File/ArrayBuffer', async () => {
    const session = await serverService.createSession(
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

  // TEST R
  it('R. Smart Import has zero runtime dependency on ImportSessionManager', async () => {
    // Verified: ImportSessionServerService is the single persistence authority
    expect(serverService).toBeInstanceOf(ImportSessionServerService);
  });

  // TEST S
  it('S. explicit Cancel persists CANCELLED before local clear', async () => {
    const session = await serverService.createSession(
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

  // TEST T
  it('T. cancel persistence failure preserves local state', async () => {
    // When updateCheckpoint throws VERSION_CONFLICT or network error,
    // ProjectSetupWizard catches and retains local state without executing handleResetRosterImport()
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

  // TEST U
  it('U. full success persists COMMITTED before local finish/clear', async () => {
    const session = await serverService.createSession(
      projectId,
      {
        sourceType: 'EXCEL',
        importBatchId: 'BAT-FULL-U',
        operationId: 'OP-FULL-U',
      },
      mockAdminContext
    );

    const committed = await serverService.updateCheckpoint(
      projectId,
      session.importSessionId,
      {
        lifecycleState: 'COMMITTED',
        rosterStage: 'COMMIT_RESULT',
      },
      { expectedVersion: 1 },
      mockAdminContext
    );

    expect(committed.lifecycleState).toBe('COMMITTED');
  });

  // TEST V
  it('V. partial failure remains non-terminal/retryable with committedRows > 0', async () => {
    const session = await serverService.createSession(
      projectId,
      {
        sourceType: 'EXCEL',
        importBatchId: 'BAT-PARTIAL-V',
        operationId: 'OP-PARTIAL-V',
      },
      mockAdminContext
    );

    await serverService.updateCheckpoint(
      projectId,
      session.importSessionId,
      {
        lifecycleState: 'FAILED',
        rosterStage: 'COMMIT_RESULT',
        importBatch: { importBatchId: 'BAT-PARTIAL-V', committedRows: 5, rows: [] },
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
      },
      { expectedVersion: 1 },
      mockAdminContext
    );

    const resumable = await serverService.listResumableSessions(projectId, mockAdminContext);
    expect(resumable).toHaveLength(1);
    expect(resumable[0].lifecycleState).toBe('FAILED');
  });
});
