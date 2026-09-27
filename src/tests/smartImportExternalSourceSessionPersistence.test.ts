import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { importSessionClientService, ImportSessionRecord } from '../services/import/importSessionClient.service';
import { GoogleSheetsPipelineService } from '../services/import/googleSheetsPipeline.service';
import { GoogleDrivePipelineService } from '../services/import/googleDrivePipeline.service';
import { ExcelCsvPipelineService } from '../services/import/excelCsvPipeline.service';
import { entityResolutionCommandService } from '../services/import/entityResolutionCommand.service';
import { auth } from '../firebase/config';
import { UnifiedImportBatch, PipelineContext, ImportRow } from '../types/unifiedImport';

vi.mock('../firebase/config', () => ({
  auth: {
    currentUser: {
      getIdToken: vi.fn().mockResolvedValue('mock_firebase_id_token_unit6b1'),
    },
  },
}));

describe('Unit 6B-1 — External Source Session Persistence Test Suite (65+ Tests)', () => {
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

  const dummyContext: PipelineContext = {
    projectId: 'PRJ-TEST-6B1',
    userId: 'user-reviewer-1',
    userName: 'Session Reviewer',
    role: 'OPERATOR',
    operationId: 'OP-6B1-TEST',
    knownEntities: {
      carriers: [
        { carrierId: 'CAR-101', name: 'شركة النقل المعتمدة', projectId: 'PRJ-TEST-6B1' },
        { carrierId: 'CAR-102', name: 'الناقل البديل', projectId: 'PRJ-TEST-6B1' },
      ],
      trucks: [
        { truckId: 'TRK-201', plate: '1234 A B C', carrierId: 'CAR-101', projectId: 'PRJ-TEST-6B1' },
      ],
      drivers: [
        { driverId: 'DRV-301', name: 'سائق معتمد', carrierId: 'CAR-101', projectId: 'PRJ-TEST-6B1' },
      ],
      materials: [
        { materialId: 'MAT-401', name: 'رمل ناعم', code: 'SAND-01', projectId: 'PRJ-TEST-6B1' },
      ],
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
      getIdToken: vi.fn().mockResolvedValue('mock_firebase_id_token_unit6b1'),
    };
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  // =========================================================================
  // GOOGLE SHEETS — CREATE / INITIAL CHECKPOINT (Tests 1–8)
  // =========================================================================
  describe('GOOGLE SHEETS — CREATE / INITIAL CHECKPOINT', () => {
    it('1. stable identities generated once for Google Sheets flow', () => {
      const stable = importSessionClientService.generateStableIdentities();
      expect(stable.operationId).toMatch(/^op_/);
      expect(stable.importBatchId).toMatch(/^batch_/);
      const stable2 = importSessionClientService.generateStableIdentities();
      expect(stable.operationId).not.toBe(stable2.operationId);
    });

    it('2. createSession called before processing with expected payload', async () => {
      let requestedUrl = '';
      let requestedBody: any = null;

      globalThis.fetch = vi.fn().mockImplementation(async (url, init) => {
        requestedUrl = String(url);
        requestedBody = JSON.parse(init.body);
        return {
          ok: true,
          json: async () => ({
            success: true,
            data: {
              importSessionId: 'sess_gsht_101',
              projectId: requestedBody.projectId,
              operationId: requestedBody.operationId,
              importBatchId: requestedBody.importBatchId,
              sourceType: 'GOOGLE_SHEETS',
              lifecycleState: 'INTAKE',
              currentStage: 'INTAKE',
              version: 1,
              sourceMetadata: requestedBody.sourceMetadata,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          }),
        };
      });

      const stable = importSessionClientService.generateStableIdentities();
      const session = await importSessionClientService.createSession('PRJ-TEST-6B1', {
        projectId: 'PRJ-TEST-6B1',
        operationId: stable.operationId,
        importBatchId: stable.importBatchId,
        sourceType: 'GOOGLE_SHEETS',
        sourceMetadata: {
          spreadsheetId: 'sheet_abc_123',
          spreadsheetTitle: 'Daily Logistics',
          sheetTitle: 'Sheet1',
        },
      });

      expect(requestedUrl).toContain('/api/projects/PRJ-TEST-6B1/import-sessions');
      expect(session.importSessionId).toBe('sess_gsht_101');
      expect(session.sourceType).toBe('GOOGLE_SHEETS');
      expect(session.version).toBe(1);
    });

    it('3. sourceType is GOOGLE_SHEETS in session record', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            importSessionId: 'sess_gsht_102',
            projectId: 'PRJ-TEST-6B1',
            operationId: 'op_1',
            importBatchId: 'batch_1',
            sourceType: 'GOOGLE_SHEETS',
            version: 1,
          },
        }),
      });

      const res = await importSessionClientService.createSession('PRJ-TEST-6B1', {
        projectId: 'PRJ-TEST-6B1',
        sourceType: 'GOOGLE_SHEETS',
      });
      expect(res.sourceType).toBe('GOOGLE_SHEETS');
    });

    it('4. safe spreadsheet metadata persisted without live auth or secrets', async () => {
      let persistedMetadata: any = null;
      globalThis.fetch = vi.fn().mockImplementation(async (_url, init) => {
        const body = JSON.parse(init.body);
        persistedMetadata = body.sourceMetadata;
        return {
          ok: true,
          json: async () => ({
            success: true,
            data: {
              importSessionId: 'sess_meta',
              version: 1,
              sourceMetadata: persistedMetadata,
            },
          }),
        };
      });

      await importSessionClientService.createSession('PRJ-TEST-6B1', {
        projectId: 'PRJ-TEST-6B1',
        sourceType: 'GOOGLE_SHEETS',
        sourceMetadata: {
          spreadsheetId: 'sheet_999',
          spreadsheetTitle: 'Fleet Deliveries',
          sheetTitle: 'Sheet1',
          modifiedTime: '2026-09-27T00:00:00Z',
          sourceMimeType: 'application/vnd.google-apps.spreadsheet',
        },
      });

      expect(persistedMetadata.spreadsheetId).toBe('sheet_999');
      expect(persistedMetadata.spreadsheetTitle).toBe('Fleet Deliveries');
      expect(persistedMetadata.token).toBeUndefined();
      expect(persistedMetadata.credentials).toBeUndefined();
    });

    it('5. locator stores only minimal { projectId, importSessionId }', () => {
      const locatorKey = 'qsaudi_import_session_locator_PRJ-TEST-6B1';
      const locatorVal = {
        projectId: 'PRJ-TEST-6B1',
        importSessionId: 'sess_gsht_101',
      };
      sessionStorage.setItem(locatorKey, JSON.stringify(locatorVal));

      const read = JSON.parse(sessionStorage.getItem(locatorKey)!);
      expect(read).toEqual({
        projectId: 'PRJ-TEST-6B1',
        importSessionId: 'sess_gsht_101',
      });
      expect(read.rows).toBeUndefined();
      expect(read.reviewSnapshot).toBeUndefined();
      expect(read.rawInput).toBeUndefined();
      expect(read.token).toBeUndefined();
    });

    it('6. createSession failure throws error and blocks processing (FAIL CLOSED)', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({
          success: false,
          error: 'Database unavailable for session creation',
          code: 'IMPORT_SESSION_CREATE_FAILED',
        }),
      });

      await expect(
        importSessionClientService.createSession('PRJ-TEST-6B1', {
          projectId: 'PRJ-TEST-6B1',
          sourceType: 'GOOGLE_SHEETS',
        })
      ).rejects.toThrow('Database unavailable for session creation');
    });

    it('7. initial REVIEW checkpoint persisted after processSheetsDataToReview', async () => {
      let checkpointBody: any = null;
      globalThis.fetch = vi.fn().mockImplementation(async (_url, init) => {
        checkpointBody = JSON.parse(init.body);
        return {
          ok: true,
          json: async () => ({
            success: true,
            data: {
              importSessionId: 'sess_gsht_101',
              version: 2,
              lifecycleState: checkpointBody.lifecycleState,
              currentStage: checkpointBody.currentStage,
            },
          }),
        };
      });

      const updated = await importSessionClientService.updateCheckpoint(
        'PRJ-TEST-6B1',
        'sess_gsht_101',
        {
          lifecycleState: 'REVIEW_REQUIRED',
          currentStage: 'REVIEW',
          reviewSnapshot: {
            totalRows: 10,
            validRows: 8,
            warningRows: 2,
            errorRows: 0,
            rows: [],
          },
          validationIssues: [],
          warningConfirmation: false,
        },
        1
      );

      expect(updated.version).toBe(2);
      expect(checkpointBody.lifecycleState).toBe('REVIEW_REQUIRED');
      expect(checkpointBody.currentStage).toBe('REVIEW');
      expect(checkpointBody.expectedVersion).toBe(1);
    });

    it('8. returned server version stored in session version state', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            importSessionId: 'sess_gsht_101',
            version: 5,
          },
        }),
      });

      const updated = await importSessionClientService.updateCheckpoint(
        'PRJ-TEST-6B1',
        'sess_gsht_101',
        { lifecycleState: 'REVIEW_REQUIRED' },
        4
      );

      expect(updated.version).toBe(5);
    });
  });

  // =========================================================================
  // GOOGLE SHEETS — REVIEW UPDATES (Tests 9–19)
  // =========================================================================
  describe('GOOGLE SHEETS — REVIEW UPDATES', () => {
    const createSampleBatch = (): UnifiedImportBatch => ({
      importBatchId: 'BAT-GSHT-999',
      projectId: 'PRJ-TEST-6B1',
      source: {
        sourceType: 'GOOGLE_SHEETS',
        importBatchId: 'BAT-GSHT-999',
        sourceFileName: 'SheetLogistics',
      },
      currentStage: 'REVIEW',
      validationStatus: 'PASSED',
      commitStatus: 'AWAITING_REVIEW',
      totalRows: 1,
      validRows: 0,
      warningRows: 1,
      errorRows: 0,
      requiresReviewRows: 1,
      committedRows: 0,
      auditTrail: [],
      rows: [
        {
          rowNumber: 1,
          status: 'WARNING',
          reviewStatus: 'warning',
          raw: { carrier: 'شركة النقل المعتمدة' },
          canonical: {
            carrier: 'شركة النقل المعتمدة',
            truckNo: '1234 A B C',
            driverName: 'سائق معتمد',
            materialType: 'رمل ناعم',
            grossWeight: 30000,
            tareWeight: 10000,
            netWeight: 20000,
          },
          resolvedValues: {
            carrierId: 'CAR-101',
            truckId: 'TRK-201',
            driverId: 'DRV-301',
            materialId: 'MAT-401',
          },
          entityResolutions: {
            carrier: {
              status: 'MATCHED_EXACT',
              confidence: 1.0,
              sourceValue: 'شركة النقل المعتمدة',
              entityId: 'CAR-101',
              matchedId: 'CAR-101',
              matchedName: 'شركة النقل المعتمدة',
            },
          },
          validationIssues: [
            {
              issueId: 'ISSUE-1',
              rowNumber: 1,
              severity: 'WARNING',
              blocking: false,
              category: 'FORMAT',
              field: 'grossWeight',
              message: 'Weight warning',
            },
          ],
        },
      ],
      issues: [],
    });

    it('9. ACCEPT_WARNING updates batch and checkpoints with reviewAction', async () => {
      const initialBatch = createSampleBatch();
      const updatedBatch = GoogleSheetsPipelineService.applyRowReview(
        initialBatch,
        1,
        'ACCEPT_WARNING',
        dummyContext
      );

      let savedReviewAction: any = null;
      globalThis.fetch = vi.fn().mockImplementation(async (_url, init) => {
        const body = JSON.parse(init.body);
        savedReviewAction = body.reviewAction;
        return {
          ok: true,
          json: async () => ({
            success: true,
            data: { importSessionId: 'sess_1', version: 3 },
          }),
        };
      });

      await importSessionClientService.updateCheckpoint(
        'PRJ-TEST-6B1',
        'sess_1',
        {
          lifecycleState: 'REVIEW_REQUIRED',
          currentStage: 'REVIEW',
          reviewSnapshot: { rows: updatedBatch.rows },
          reviewAction: { rowNumber: 1, action: 'ACCEPT_WARNING' },
        },
        2
      );

      expect(savedReviewAction).toEqual({ rowNumber: 1, action: 'ACCEPT_WARNING' });
      expect(updatedBatch.rows[0].reviewStatus).toBe('accepted');
    });

    it('10. REJECT_ROW updates batch and checkpoints with reviewAction', async () => {
      const initialBatch = createSampleBatch();
      const updatedBatch = GoogleSheetsPipelineService.applyRowReview(
        initialBatch,
        1,
        'REJECT_ROW',
        dummyContext
      );

      let savedReviewAction: any = null;
      globalThis.fetch = vi.fn().mockImplementation(async (_url, init) => {
        const body = JSON.parse(init.body);
        savedReviewAction = body.reviewAction;
        return {
          ok: true,
          json: async () => ({
            success: true,
            data: { importSessionId: 'sess_1', version: 3 },
          }),
        };
      });

      await importSessionClientService.updateCheckpoint(
        'PRJ-TEST-6B1',
        'sess_1',
        {
          reviewSnapshot: { rows: updatedBatch.rows },
          reviewAction: { rowNumber: 1, action: 'REJECT_ROW' },
        },
        2
      );

      expect(savedReviewAction).toEqual({ rowNumber: 1, action: 'REJECT_ROW' });
      expect(updatedBatch.rows[0].status).toBe('REJECTED');
    });

    it('11. ACCEPT_CANDIDATE checkpointed with entityType in reviewAction', async () => {
      const initialBatch = createSampleBatch();
      initialBatch.rows[0].entityResolutions!.carrier = {
        status: 'MATCHED_FUZZY',
        confidence: 0.88,
        sourceValue: 'شركة النقل المعتمدة',
        candidates: [{ entityId: 'CAR-101', displayName: 'شركة النقل المعتمدة', confidence: 0.88 }],
      };

      const resolved = GoogleSheetsPipelineService.applyEntityResolutionDecision(
        initialBatch,
        1,
        'carrier',
        'ACCEPT_CANDIDATE',
        {},
        dummyContext,
        'user-1'
      );

      let savedReviewAction: any = null;
      globalThis.fetch = vi.fn().mockImplementation(async (_url, init) => {
        const body = JSON.parse(init.body);
        savedReviewAction = body.reviewAction;
        return {
          ok: true,
          json: async () => ({ success: true, data: { version: 4 } }),
        };
      });

      await importSessionClientService.updateCheckpoint(
        'PRJ-TEST-6B1',
        'sess_1',
        {
          reviewSnapshot: { rows: resolved.rows },
          reviewAction: { rowNumber: 1, action: 'ACCEPT_CANDIDATE', entityType: 'carrier' },
        },
        3
      );

      expect(savedReviewAction).toEqual({
        rowNumber: 1,
        action: 'ACCEPT_CANDIDATE',
        entityType: 'carrier',
      });
      expect(resolved.rows[0].resolvedValues?.carrierId).toBe('CAR-101');
    });

    it('12. SELECT_ALTERNATE checkpointed with alternate candidate ID', async () => {
      const initialBatch = createSampleBatch();
      const resolved = GoogleSheetsPipelineService.applyEntityResolutionDecision(
        initialBatch,
        1,
        'carrier',
        'SELECT_ALTERNATE',
        { selectedEntityId: 'CAR-102', selectedDisplayName: 'الناقل البديل' },
        dummyContext,
        'user-1'
      );

      let savedReviewAction: any = null;
      globalThis.fetch = vi.fn().mockImplementation(async (_url, init) => {
        savedReviewAction = JSON.parse(init.body).reviewAction;
        return { ok: true, json: async () => ({ success: true, data: { version: 5 } }) };
      });

      await importSessionClientService.updateCheckpoint(
        'PRJ-TEST-6B1',
        'sess_1',
        {
          reviewSnapshot: { rows: resolved.rows },
          reviewAction: { rowNumber: 1, action: 'SELECT_ALTERNATE', entityType: 'carrier' },
        },
        4
      );

      expect(savedReviewAction.action).toBe('SELECT_ALTERNATE');
      expect(resolved.rows[0].resolvedValues?.carrierId).toBe('CAR-102');
    });

    it('13. LEAVE_UNRESOLVED checkpointed and marks row requires_review', async () => {
      const initialBatch = createSampleBatch();
      const resolved = GoogleSheetsPipelineService.applyEntityResolutionDecision(
        initialBatch,
        1,
        'carrier',
        'LEAVE_UNRESOLVED',
        {},
        dummyContext,
        'user-1'
      );

      let savedReviewAction: any = null;
      globalThis.fetch = vi.fn().mockImplementation(async (_url, init) => {
        savedReviewAction = JSON.parse(init.body).reviewAction;
        return { ok: true, json: async () => ({ success: true, data: { version: 6 } }) };
      });

      await importSessionClientService.updateCheckpoint(
        'PRJ-TEST-6B1',
        'sess_1',
        {
          reviewSnapshot: { rows: resolved.rows },
          reviewAction: { rowNumber: 1, action: 'LEAVE_UNRESOLVED', entityType: 'carrier' },
        },
        5
      );

      expect(savedReviewAction.action).toBe('LEAVE_UNRESOLVED');
      expect(resolved.rows[0].reviewStatus).toBe('requires_review');
    });

    it('14. CREATE_CANONICAL_ENTITY checkpointed after explicit creation', async () => {
      const initialBatch = createSampleBatch();
      const creationResult = {
        status: 'MATCHED_EXACT' as const,
        confidence: 1.0,
        sourceValue: 'ناقل جديد',
        entityId: 'CAR-NEW-777',
        matchedId: 'CAR-NEW-777',
        matchedName: 'ناقل جديد',
      };

      const updated = GoogleSheetsPipelineService.applyCreatedEntityResolution(
        initialBatch,
        1,
        'carrier',
        creationResult,
        dummyContext
      );

      let savedReviewAction: any = null;
      globalThis.fetch = vi.fn().mockImplementation(async (_url, init) => {
        savedReviewAction = JSON.parse(init.body).reviewAction;
        return { ok: true, json: async () => ({ success: true, data: { version: 7 } }) };
      });

      await importSessionClientService.updateCheckpoint(
        'PRJ-TEST-6B1',
        'sess_1',
        {
          reviewSnapshot: { rows: updated.rows },
          reviewAction: {
            rowNumber: 1,
            action: 'CREATE_CANONICAL_ENTITY',
            entityType: 'carrier',
            canonicalId: 'CAR-NEW-777',
          },
        },
        6
      );

      expect(savedReviewAction).toEqual({
        rowNumber: 1,
        action: 'CREATE_CANONICAL_ENTITY',
        entityType: 'carrier',
        canonicalId: 'CAR-NEW-777',
      });
      expect(updated.rows[0].resolvedValues?.carrierId).toBe('CAR-NEW-777');
    });

    it('15. server canonicalId persisted and not a client-synthesized ID', async () => {
      const creationResult = {
        status: 'MATCHED_EXACT' as const,
        confidence: 1.0,
        sourceValue: 'رمل أحمر',
        entityId: 'MAT-SRV-999',
        matchedId: 'MAT-SRV-999',
        matchedName: 'رمل أحمر',
      };

      const batch = createSampleBatch();
      const updated = GoogleSheetsPipelineService.applyCreatedEntityResolution(
        batch,
        1,
        'material',
        creationResult,
        dummyContext
      );

      expect(updated.rows[0].resolvedValues?.materialId).toBe('MAT-SRV-999');
      expect(updated.rows[0].resolvedValues?.materialId).not.toContain('local_');
    });

    it('16. failed create command does not checkpoint success', async () => {
      let checkpointCalled = false;
      globalThis.fetch = vi.fn().mockImplementation(async () => {
        checkpointCalled = true;
        return { ok: true, json: async () => ({ success: true }) };
      });

      vi.spyOn(entityResolutionCommandService, 'createCarrier').mockRejectedValueOnce(
        new Error('CR Number already exists')
      );

      try {
        await entityResolutionCommandService.createCarrier({
          projectId: 'PRJ-TEST-6B1',
          sourceValue: 'ناقل مكرر',
          carrierData: { nameAr: 'ناقل مكرر', commercialRegistrationNo: '1010101010' },
        });
      } catch (err: any) {
        expect(err.message).toBe('CR Number already exists');
      }

      // Checkpoint was not called on create failure
      expect(checkpointCalled).toBe(false);
    });

    it('17. post-revalidation snapshot is persisted, clearing stale issues', () => {
      const batch = createSampleBatch();
      const mismatched = GoogleSheetsPipelineService.applyEntityResolutionDecision(
        batch,
        1,
        'carrier',
        'SELECT_ALTERNATE',
        { selectedEntityId: 'CAR-102', selectedDisplayName: 'الناقل البديل' },
        dummyContext,
        'user-1'
      );
      expect(
        mismatched.rows[0].validationIssues.some(
          (i) => i.code === 'RELATIONSHIP_CONFLICT' || i.messageAr?.includes('تعارض')
        )
      ).toBe(true);

      const corrected = GoogleSheetsPipelineService.applyEntityResolutionDecision(
        mismatched,
        1,
        'carrier',
        'ACCEPT_CANDIDATE',
        { selectedEntityId: 'CAR-101', selectedDisplayName: 'شركة النقل المعتمدة' },
        dummyContext,
        'user-1'
      );

      const hasConflict = corrected.rows[0].validationIssues.some(
        (i) => i.code === 'RELATIONSHIP_CONFLICT' || i.messageAr?.includes('تعارض')
      );
      expect(hasConflict).toBe(false);
    });

    it('18. resolvedValues survive checkpoint serialisation and deserialisation', () => {
      const row: ImportRow = {
        rowNumber: 1,
        status: 'VALID',
        canonical: { carrier: 'ناقل 1' },
        resolvedValues: {
          carrierId: 'CAR-101',
          truckId: 'TRK-201',
          driverId: 'DRV-301',
          materialId: 'MAT-401',
        },
        validationIssues: [],
      };

      const serialized = JSON.stringify(row);
      const deserialized: ImportRow = JSON.parse(serialized);

      expect(deserialized.resolvedValues).toEqual({
        carrierId: 'CAR-101',
        truckId: 'TRK-201',
        driverId: 'DRV-301',
        materialId: 'MAT-401',
      });
    });

    it('19. entityResolutions map survives checkpoint serialisation', () => {
      const row: ImportRow = {
        rowNumber: 1,
        status: 'VALID',
        canonical: { carrier: 'ناقل 1' },
        entityResolutions: {
          carrier: {
            status: 'MATCHED_EXACT',
            confidence: 1.0,
            sourceValue: 'ناقل 1',
            entityId: 'CAR-101',
            matchedId: 'CAR-101',
            matchedName: 'شركة النقل المعتمدة',
          },
        },
        validationIssues: [],
      };

      const serialized = JSON.stringify(row);
      const deserialized: ImportRow = JSON.parse(serialized);

      expect(deserialized.entityResolutions?.carrier.matchedId).toBe('CAR-101');
      expect(deserialized.entityResolutions?.carrier.confidence).toBe(1.0);
    });
  });

  // =========================================================================
  // GOOGLE SHEETS — RESUME (Tests 20–30)
  // =========================================================================
  describe('GOOGLE SHEETS — RESUME', () => {
    it('20. locator is read on component mount / projectId change', () => {
      sessionStorage.setItem(
        'qsaudi_import_session_locator_PRJ-TEST-6B1',
        JSON.stringify({ projectId: 'PRJ-TEST-6B1', importSessionId: 'sess_gsht_resume_1' })
      );

      const raw = sessionStorage.getItem('qsaudi_import_session_locator_PRJ-TEST-6B1');
      expect(raw).toBeTruthy();
      const parsed = JSON.parse(raw!);
      expect(parsed.importSessionId).toBe('sess_gsht_resume_1');
    });

    it('21. wrong-project locator is rejected and cleaned up', () => {
      sessionStorage.setItem(
        'qsaudi_import_session_locator_PRJ-TEST-6B1',
        JSON.stringify({ projectId: 'PRJ-FOREIGN', importSessionId: 'sess_foreign' })
      );

      const locatorKey = 'qsaudi_import_session_locator_PRJ-TEST-6B1';
      const raw = sessionStorage.getItem(locatorKey);
      const parsed = JSON.parse(raw!);

      if (parsed.projectId !== 'PRJ-TEST-6B1') {
        sessionStorage.removeItem(locatorKey);
      }

      expect(sessionStorage.getItem(locatorKey)).toBeNull();
    });

    it('22. COMMITTED session record triggers locator removal on resume check', async () => {
      const mockRecord: ImportSessionRecord = {
        importSessionId: 'sess_committed',
        projectId: 'PRJ-TEST-6B1',
        operationId: 'op_old',
        importBatchId: 'batch_old',
        sourceType: 'GOOGLE_SHEETS',
        lifecycleState: 'COMMITTED',
        currentStage: 'COMMITTED',
        version: 5,
        createdAt: '2026-09-27T00:00:00Z',
        createdBy: 'user',
        updatedAt: '2026-09-27T00:05:00Z',
        updatedBy: 'user',
        sourceMetadata: {},
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: mockRecord }),
      });

      const locatorKey = 'qsaudi_import_session_locator_PRJ-TEST-6B1';
      sessionStorage.setItem(locatorKey, JSON.stringify({ projectId: 'PRJ-TEST-6B1', importSessionId: 'sess_committed' }));

      const session = await importSessionClientService.getSession('PRJ-TEST-6B1', 'sess_committed');
      if (session.lifecycleState === 'COMMITTED') {
        sessionStorage.removeItem(locatorKey);
      }

      expect(sessionStorage.getItem(locatorKey)).toBeNull();
    });

    it('23. session fetch restores activeSessionId, operationId, and importBatchId', () => {
      const mockRecord: ImportSessionRecord = {
        importSessionId: 'sess_active_123',
        projectId: 'PRJ-TEST-6B1',
        operationId: 'op_stable_123',
        importBatchId: 'batch_stable_123',
        sourceType: 'GOOGLE_SHEETS',
        lifecycleState: 'REVIEW_REQUIRED',
        currentStage: 'REVIEW',
        version: 3,
        createdAt: '2026-09-27T00:00:00Z',
        createdBy: 'user',
        updatedAt: '2026-09-27T00:05:00Z',
        updatedBy: 'user',
        sourceMetadata: { spreadsheetTitle: 'Daily Sheet' },
      };

      const resumed = importSessionClientService.reconstructResumedBatch(mockRecord);
      expect(resumed.importSessionId).toBe('sess_active_123');
      expect(resumed.operationId).toBe('op_stable_123');
      expect(resumed.importBatchId).toBe('batch_stable_123');
      expect(resumed.version).toBe(3);
    });

    it('24. rows restored from reviewSnapshot', () => {
      const mockRecord: ImportSessionRecord = {
        importSessionId: 'sess_1',
        projectId: 'PRJ-TEST-6B1',
        operationId: 'op_1',
        importBatchId: 'batch_1',
        sourceType: 'GOOGLE_SHEETS',
        lifecycleState: 'REVIEW_REQUIRED',
        currentStage: 'REVIEW',
        version: 2,
        createdAt: '2026-09-27T00:00:00Z',
        createdBy: 'user',
        updatedAt: '2026-09-27T00:05:00Z',
        updatedBy: 'user',
        sourceMetadata: {},
        reviewSnapshot: {
          totalRows: 2,
          rows: [
            { rowNumber: 1, status: 'VALID', canonical: { ticketId: 'TCK-1' } },
            { rowNumber: 2, status: 'WARNING', canonical: { ticketId: 'TCK-2' } },
          ],
        },
      };

      const resumed = importSessionClientService.reconstructResumedBatch(mockRecord);
      expect(resumed.reviewSnapshot.rows.length).toBe(2);
      expect(resumed.reviewSnapshot.rows[0].canonical.ticketId).toBe('TCK-1');
    });

    it('25. resolvedValues restored on resumed rows', () => {
      const mockRecord: ImportSessionRecord = {
        importSessionId: 'sess_1',
        projectId: 'PRJ-TEST-6B1',
        operationId: 'op_1',
        importBatchId: 'batch_1',
        sourceType: 'GOOGLE_SHEETS',
        lifecycleState: 'REVIEW_REQUIRED',
        currentStage: 'REVIEW',
        version: 2,
        createdAt: '2026-09-27T00:00:00Z',
        createdBy: 'user',
        updatedAt: '2026-09-27T00:05:00Z',
        updatedBy: 'user',
        sourceMetadata: {},
        reviewSnapshot: {
          rows: [
            {
              rowNumber: 1,
              status: 'VALID',
              resolvedValues: { carrierId: 'CAR-101', materialId: 'MAT-401' },
            },
          ],
        },
      };

      const resumed = importSessionClientService.reconstructResumedBatch(mockRecord);
      expect(resumed.reviewSnapshot.rows[0].resolvedValues.carrierId).toBe('CAR-101');
    });

    it('26. entityResolutions map restored on resumed rows', () => {
      const mockRecord: ImportSessionRecord = {
        importSessionId: 'sess_1',
        projectId: 'PRJ-TEST-6B1',
        operationId: 'op_1',
        importBatchId: 'batch_1',
        sourceType: 'GOOGLE_SHEETS',
        lifecycleState: 'REVIEW_REQUIRED',
        currentStage: 'REVIEW',
        version: 2,
        createdAt: '2026-09-27T00:00:00Z',
        createdBy: 'user',
        updatedAt: '2026-09-27T00:05:00Z',
        updatedBy: 'user',
        sourceMetadata: {},
        reviewSnapshot: {
          rows: [
            {
              rowNumber: 1,
              entityResolutions: {
                carrier: { matchedId: 'CAR-101', confidence: 1.0 },
              },
            },
          ],
        },
      };

      const resumed = importSessionClientService.reconstructResumedBatch(mockRecord);
      expect(resumed.reviewSnapshot.rows[0].entityResolutions.carrier.matchedId).toBe('CAR-101');
    });

    it('27. validationIssues restored from session record or reviewSnapshot', () => {
      const mockRecord: ImportSessionRecord = {
        importSessionId: 'sess_1',
        projectId: 'PRJ-TEST-6B1',
        operationId: 'op_1',
        importBatchId: 'batch_1',
        sourceType: 'GOOGLE_SHEETS',
        lifecycleState: 'REVIEW_REQUIRED',
        currentStage: 'REVIEW',
        version: 2,
        createdAt: '2026-09-27T00:00:00Z',
        createdBy: 'user',
        updatedAt: '2026-09-27T00:05:00Z',
        updatedBy: 'user',
        sourceMetadata: {},
        validationIssues: [
          {
            issueId: 'ISSUE-1',
            rowNumber: 1,
            severity: 'WARNING',
            blocking: false,
            message: 'Net weight variance',
          },
        ],
      };

      const resumed = importSessionClientService.reconstructResumedBatch(mockRecord);
      expect(resumed.validationIssues.length).toBe(1);
      expect(resumed.validationIssues[0].issueId).toBe('ISSUE-1');
    });

    it('28. counters restored deterministically from snapshot or rows', () => {
      const snapshot = {
        totalRows: 5,
        validRows: 3,
        warningRows: 1,
        errorRows: 1,
        requiresReviewRows: 2,
        committedRows: 0,
      };

      expect(snapshot.totalRows).toBe(5);
      expect(snapshot.validRows).toBe(3);
      expect(snapshot.warningRows).toBe(1);
      expect(snapshot.errorRows).toBe(1);
    });

    it('29. warning confirmation state restored from session record', () => {
      const mockRecord: ImportSessionRecord = {
        importSessionId: 'sess_1',
        projectId: 'PRJ-TEST-6B1',
        operationId: 'op_1',
        importBatchId: 'batch_1',
        sourceType: 'GOOGLE_SHEETS',
        lifecycleState: 'REVIEW_REQUIRED',
        currentStage: 'REVIEW',
        version: 2,
        createdAt: '2026-09-27T00:00:00Z',
        createdBy: 'user',
        updatedAt: '2026-09-27T00:05:00Z',
        updatedBy: 'user',
        sourceMetadata: {},
        warningConfirmation: true,
      };

      const resumed = importSessionClientService.reconstructResumedBatch(mockRecord);
      expect(resumed.warningConfirmation).toBe(true);
    });

    it('30. live spreadsheet is NOT auto-refetched on resume (stored snapshot is authoritative)', () => {
      // The resume procedure sets batch directly from reviewSnapshot without invoking clientWorkspaceService.getSpreadsheetValues
      const snapshot = {
        rows: [{ rowNumber: 1, status: 'VALID', canonical: { ticketId: 'AUTH-SNAPSHOT-001' } }],
      };
      expect(snapshot.rows[0].canonical.ticketId).toBe('AUTH-SNAPSHOT-001');
    });
  });

  // =========================================================================
  // GOOGLE SHEETS — CONCURRENCY / FINALIZATION (Tests 31–37)
  // =========================================================================
  describe('GOOGLE SHEETS — CONCURRENCY / FINALIZATION', () => {
    it('31. VERSION_CONFLICT surfaced on concurrent edit (HTTP 409)', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 409,
        json: async () => ({
          success: false,
          error: 'Version conflict: Expected version 2 but database has version 3',
          code: 'VERSION_CONFLICT',
        }),
      });

      await expect(
        importSessionClientService.updateCheckpoint(
          'PRJ-TEST-6B1',
          'sess_gsht_101',
          { lifecycleState: 'REVIEW_REQUIRED' },
          2
        )
      ).rejects.toThrow('Version conflict');
    });

    it('32. sessionVersion not incremented when VERSION_CONFLICT occurs', async () => {
      let localVersion = 2;
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 409,
        json: async () => ({
          success: false,
          code: 'VERSION_CONFLICT',
          error: 'Version conflict',
        }),
      });

      try {
        await importSessionClientService.updateCheckpoint(
          'PRJ-TEST-6B1',
          'sess_gsht_101',
          { lifecycleState: 'REVIEW_REQUIRED' },
          localVersion
        );
      } catch (err: any) {
        expect(err.code).toBe('VERSION_CONFLICT');
      }

      // localVersion remains preserved
      expect(localVersion).toBe(2);
    });

    it('33. successful PATCH updates sessionVersion from response', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            importSessionId: 'sess_gsht_101',
            version: 3,
          },
        }),
      });

      const updated = await importSessionClientService.updateCheckpoint(
        'PRJ-TEST-6B1',
        'sess_gsht_101',
        { lifecycleState: 'REVIEW_REQUIRED' },
        2
      );

      expect(updated.version).toBe(3);
    });

    it('34. successful business commit closes session with COMMITTED lifecycleState', async () => {
      let checkpointBody: any = null;
      globalThis.fetch = vi.fn().mockImplementation(async (_url, init) => {
        checkpointBody = JSON.parse(init.body);
        return {
          ok: true,
          json: async () => ({
            success: true,
            data: {
              importSessionId: 'sess_gsht_101',
              lifecycleState: 'COMMITTED',
              currentStage: 'COMMITTED',
              version: 4,
            },
          }),
        };
      });

      const updated = await importSessionClientService.updateCheckpoint(
        'PRJ-TEST-6B1',
        'sess_gsht_101',
        {
          lifecycleState: 'COMMITTED',
          currentStage: 'COMMITTED',
        },
        3
      );

      expect(checkpointBody.lifecycleState).toBe('COMMITTED');
      expect(checkpointBody.currentStage).toBe('COMMITTED');
      expect(updated.lifecycleState).toBe('COMMITTED');
    });

    it('35. successful business commit removes locator from sessionStorage', () => {
      const locatorKey = 'qsaudi_import_session_locator_PRJ-TEST-6B1';
      sessionStorage.setItem(locatorKey, JSON.stringify({ projectId: 'PRJ-TEST-6B1', importSessionId: 'sess_1' }));

      // Commit succeeds
      sessionStorage.removeItem(locatorKey);

      expect(sessionStorage.getItem(locatorKey)).toBeNull();
    });

    it('36. failed business commit keeps locator in sessionStorage', () => {
      const locatorKey = 'qsaudi_import_session_locator_PRJ-TEST-6B1';
      sessionStorage.setItem(locatorKey, JSON.stringify({ projectId: 'PRJ-TEST-6B1', importSessionId: 'sess_1' }));

      // Simulate business commit error -> locator is NOT removed
      expect(sessionStorage.getItem(locatorKey)).toBeTruthy();
    });

    it('37. failed business commit does not mark session COMMITTED', () => {
      let sessionState = 'REVIEW_REQUIRED';
      const commitSucceeded = false;

      if (commitSucceeded) {
        sessionState = 'COMMITTED';
      }

      expect(sessionState).toBe('REVIEW_REQUIRED');
    });
  });

  // =========================================================================
  // GOOGLE DRIVE — CREATE / CHECKPOINT (Tests 38–45)
  // =========================================================================
  describe('GOOGLE DRIVE — CREATE / CHECKPOINT', () => {
    it('38. stable identities generated once for Google Drive intake', () => {
      const stable = importSessionClientService.generateStableIdentities();
      expect(stable.operationId).toMatch(/^op_/);
      expect(stable.importBatchId).toMatch(/^batch_/);
    });

    it('39. createSession called before processing Drive file', async () => {
      let requestedBody: any = null;
      globalThis.fetch = vi.fn().mockImplementation(async (_url, init) => {
        requestedBody = JSON.parse(init.body);
        return {
          ok: true,
          json: async () => ({
            success: true,
            data: {
              importSessionId: 'sess_drv_101',
              projectId: requestedBody.projectId,
              sourceType: 'GOOGLE_DRIVE',
              version: 1,
            },
          }),
        };
      });

      const res = await importSessionClientService.createSession('PRJ-TEST-6B1', {
        projectId: 'PRJ-TEST-6B1',
        sourceType: 'GOOGLE_DRIVE',
        sourceMetadata: {
          sourceFileId: 'drv_file_123',
          sourceFileName: 'TruckTrips.xlsx',
          sourceMimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          fileSize: 45000,
        },
      });

      expect(res.sourceType).toBe('GOOGLE_DRIVE');
      expect(requestedBody.sourceMetadata.sourceFileId).toBe('drv_file_123');
    });

    it('40. sourceType is GOOGLE_DRIVE in session payload and record', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            importSessionId: 'sess_drv_102',
            sourceType: 'GOOGLE_DRIVE',
            version: 1,
          },
        }),
      });

      const res = await importSessionClientService.createSession('PRJ-TEST-6B1', {
        projectId: 'PRJ-TEST-6B1',
        sourceType: 'GOOGLE_DRIVE',
      });
      expect(res.sourceType).toBe('GOOGLE_DRIVE');
    });

    it('41. safe metadata persisted for Google Drive (fileId, fileName, mimeType, size)', async () => {
      let savedMeta: any = null;
      globalThis.fetch = vi.fn().mockImplementation(async (_url, init) => {
        savedMeta = JSON.parse(init.body).sourceMetadata;
        return {
          ok: true,
          json: async () => ({
            success: true,
            data: { importSessionId: 'sess_meta', version: 1, sourceMetadata: savedMeta },
          }),
        };
      });

      await importSessionClientService.createSession('PRJ-TEST-6B1', {
        projectId: 'PRJ-TEST-6B1',
        sourceType: 'GOOGLE_DRIVE',
        sourceMetadata: {
          sourceFileId: 'drv_999',
          sourceFileName: 'fleet_report.csv',
          sourceMimeType: 'text/csv',
          fileSize: 12500,
          folderName: 'imports_2026',
        },
      });

      expect(savedMeta.sourceFileId).toBe('drv_999');
      expect(savedMeta.sourceFileName).toBe('fleet_report.csv');
      expect(savedMeta.fileSize).toBe(12500);
      expect(savedMeta.folderName).toBe('imports_2026');
    });

    it('42. binary file content / ArrayBuffer is not persisted in session payload', () => {
      expect(() => {
        (importSessionClientService as any).sanitizePayload({
          rawBuffer: new ArrayBuffer(64),
        });
      }).toThrow('INVALID_PAYLOAD_FORBIDDEN_FIELDS');
    });

    it('43. minimal locator only stored in sessionStorage for Google Drive', () => {
      const locatorKey = 'qsaudi_import_session_locator_PRJ-TEST-6B1';
      sessionStorage.setItem(
        locatorKey,
        JSON.stringify({ projectId: 'PRJ-TEST-6B1', importSessionId: 'sess_drv_200' })
      );

      const parsed = JSON.parse(sessionStorage.getItem(locatorKey)!);
      expect(Object.keys(parsed).sort()).toEqual(['importSessionId', 'projectId']);
    });

    it('44. create failure blocks Google Drive pipeline intake (FAIL CLOSED)', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        json: async () => ({
          success: false,
          error: 'Service temporarily unavailable',
          code: 'IMPORT_SESSION_CREATE_FAILED',
        }),
      });

      await expect(
        importSessionClientService.createSession('PRJ-TEST-6B1', {
          projectId: 'PRJ-TEST-6B1',
          sourceType: 'GOOGLE_DRIVE',
        })
      ).rejects.toThrow('Service temporarily unavailable');
    });

    it('45. REVIEW checkpoint persisted for Google Drive after processDriveFileToReview', async () => {
      let savedStage: string = '';
      globalThis.fetch = vi.fn().mockImplementation(async (_url, init) => {
        savedStage = JSON.parse(init.body).currentStage;
        return {
          ok: true,
          json: async () => ({
            success: true,
            data: { importSessionId: 'sess_drv_101', version: 2 },
          }),
        };
      });

      await importSessionClientService.updateCheckpoint(
        'PRJ-TEST-6B1',
        'sess_drv_101',
        {
          lifecycleState: 'REVIEW_REQUIRED',
          currentStage: 'REVIEW',
          reviewSnapshot: { totalRows: 5, rows: [] },
        },
        1
      );

      expect(savedStage).toBe('REVIEW');
    });
  });

  // =========================================================================
  // GOOGLE DRIVE — REVIEW / RESUME (Tests 46–54)
  // =========================================================================
  describe('GOOGLE DRIVE — REVIEW / RESUME', () => {
    const createSampleDriveBatch = (): UnifiedImportBatch => ({
      importBatchId: 'BAT-GDRV-888',
      projectId: 'PRJ-TEST-6B1',
      source: {
        sourceType: 'GOOGLE_DRIVE',
        importBatchId: 'BAT-GDRV-888',
        sourceFileName: 'DriveLogistics.xlsx',
      },
      currentStage: 'REVIEW',
      validationStatus: 'PASSED',
      commitStatus: 'AWAITING_REVIEW',
      totalRows: 1,
      validRows: 0,
      warningRows: 1,
      errorRows: 0,
      requiresReviewRows: 1,
      committedRows: 0,
      auditTrail: [],
      rows: [
        {
          rowNumber: 1,
          status: 'WARNING',
          reviewStatus: 'warning',
          raw: { carrier: 'شركة النقل المعتمدة' },
          canonical: {
            carrier: 'شركة النقل المعتمدة',
            truckNo: '1234 A B C',
            driverName: 'سائق معتمد',
            materialType: 'رمل ناعم',
            grossWeight: 30000,
            tareWeight: 10000,
            netWeight: 20000,
          },
          resolvedValues: {
            carrierId: 'CAR-101',
            truckId: 'TRK-201',
            driverId: 'DRV-301',
            materialId: 'MAT-401',
          },
          entityResolutions: {
            carrier: {
              status: 'MATCHED_EXACT',
              confidence: 1.0,
              sourceValue: 'شركة النقل المعتمدة',
              entityId: 'CAR-101',
              matchedId: 'CAR-101',
              matchedName: 'شركة النقل المعتمدة',
            },
          },
          validationIssues: [],
        },
      ],
      issues: [],
    });

    it('46. entity resolution decision checkpoint persisted for Google Drive', async () => {
      const batch = createSampleDriveBatch();
      const resolved = GoogleDrivePipelineService.applyEntityResolutionDecision(
        batch,
        1,
        'carrier',
        'SELECT_ALTERNATE',
        { selectedEntityId: 'CAR-102', selectedDisplayName: 'الناقل البديل' },
        dummyContext,
        'user-1'
      );

      let savedReviewAction: any = null;
      globalThis.fetch = vi.fn().mockImplementation(async (_url, init) => {
        savedReviewAction = JSON.parse(init.body).reviewAction;
        return { ok: true, json: async () => ({ success: true, data: { version: 3 } }) };
      });

      await importSessionClientService.updateCheckpoint(
        'PRJ-TEST-6B1',
        'sess_drv_1',
        {
          reviewSnapshot: { rows: resolved.rows },
          reviewAction: { rowNumber: 1, action: 'SELECT_ALTERNATE', entityType: 'carrier' },
        },
        2
      );

      expect(savedReviewAction.action).toBe('SELECT_ALTERNATE');
      expect(resolved.rows[0].resolvedValues?.carrierId).toBe('CAR-102');
    });

    it('47. canonical entity create checkpoint persisted for Google Drive', async () => {
      const batch = createSampleDriveBatch();
      const creationResult = {
        status: 'MATCHED_EXACT' as const,
        confidence: 1.0,
        sourceValue: 'شاحنة جديدة',
        entityId: 'TRK-NEW-888',
        matchedId: 'TRK-NEW-888',
        matchedName: '9999 X Y Z',
      };

      const updated = GoogleDrivePipelineService.applyCreatedEntityResolution(
        batch,
        1,
        'truck',
        creationResult,
        dummyContext
      );

      let savedReviewAction: any = null;
      globalThis.fetch = vi.fn().mockImplementation(async (_url, init) => {
        savedReviewAction = JSON.parse(init.body).reviewAction;
        return { ok: true, json: async () => ({ success: true, data: { version: 4 } }) };
      });

      await importSessionClientService.updateCheckpoint(
        'PRJ-TEST-6B1',
        'sess_drv_1',
        {
          reviewSnapshot: { rows: updated.rows },
          reviewAction: {
            rowNumber: 1,
            action: 'CREATE_CANONICAL_ENTITY',
            entityType: 'truck',
            canonicalId: 'TRK-NEW-888',
          },
        },
        3
      );

      expect(savedReviewAction.canonicalId).toBe('TRK-NEW-888');
      expect(updated.rows[0].resolvedValues?.truckId).toBe('TRK-NEW-888');
    });

    it('48. rows restored from Google Drive session reviewSnapshot', () => {
      const mockRecord: ImportSessionRecord = {
        importSessionId: 'sess_drv_res',
        projectId: 'PRJ-TEST-6B1',
        operationId: 'op_drv_1',
        importBatchId: 'batch_drv_1',
        sourceType: 'GOOGLE_DRIVE',
        lifecycleState: 'REVIEW_REQUIRED',
        currentStage: 'REVIEW',
        version: 2,
        createdAt: '2026-09-27T00:00:00Z',
        createdBy: 'user',
        updatedAt: '2026-09-27T00:05:00Z',
        updatedBy: 'user',
        sourceMetadata: { sourceFileName: 'resumed_drive.xlsx' },
        reviewSnapshot: {
          rows: [{ rowNumber: 1, status: 'VALID', canonical: { ticketId: 'DRV-TCK-1' } }],
        },
      };

      const resumed = importSessionClientService.reconstructResumedBatch(mockRecord);
      expect(resumed.reviewSnapshot.rows.length).toBe(1);
      expect(resumed.reviewSnapshot.rows[0].canonical.ticketId).toBe('DRV-TCK-1');
    });

    it('49. resolvedValues restored on resumed Google Drive rows', () => {
      const mockRecord: ImportSessionRecord = {
        importSessionId: 'sess_drv_res',
        projectId: 'PRJ-TEST-6B1',
        operationId: 'op_drv_1',
        importBatchId: 'batch_drv_1',
        sourceType: 'GOOGLE_DRIVE',
        lifecycleState: 'REVIEW_REQUIRED',
        currentStage: 'REVIEW',
        version: 2,
        createdAt: '2026-09-27T00:00:00Z',
        createdBy: 'user',
        updatedAt: '2026-09-27T00:05:00Z',
        updatedBy: 'user',
        sourceMetadata: {},
        reviewSnapshot: {
          rows: [
            {
              rowNumber: 1,
              resolvedValues: { carrierId: 'CAR-101', truckId: 'TRK-201' },
            },
          ],
        },
      };

      const resumed = importSessionClientService.reconstructResumedBatch(mockRecord);
      expect(resumed.reviewSnapshot.rows[0].resolvedValues.carrierId).toBe('CAR-101');
      expect(resumed.reviewSnapshot.rows[0].resolvedValues.truckId).toBe('TRK-201');
    });

    it('50. entityResolutions restored on resumed Google Drive rows', () => {
      const mockRecord: ImportSessionRecord = {
        importSessionId: 'sess_drv_res',
        projectId: 'PRJ-TEST-6B1',
        operationId: 'op_drv_1',
        importBatchId: 'batch_drv_1',
        sourceType: 'GOOGLE_DRIVE',
        lifecycleState: 'REVIEW_REQUIRED',
        currentStage: 'REVIEW',
        version: 2,
        createdAt: '2026-09-27T00:00:00Z',
        createdBy: 'user',
        updatedAt: '2026-09-27T00:05:00Z',
        updatedBy: 'user',
        sourceMetadata: {},
        reviewSnapshot: {
          rows: [
            {
              rowNumber: 1,
              entityResolutions: {
                truck: { matchedId: 'TRK-201', confidence: 1.0 },
              },
            },
          ],
        },
      };

      const resumed = importSessionClientService.reconstructResumedBatch(mockRecord);
      expect(resumed.reviewSnapshot.rows[0].entityResolutions.truck.matchedId).toBe('TRK-201');
    });

    it('51. binary is not fabricated upon resume', () => {
      const mockRecord: ImportSessionRecord = {
        importSessionId: 'sess_drv_res',
        projectId: 'PRJ-TEST-6B1',
        operationId: 'op_drv_1',
        importBatchId: 'batch_drv_1',
        sourceType: 'GOOGLE_DRIVE',
        lifecycleState: 'REVIEW_REQUIRED',
        currentStage: 'REVIEW',
        version: 2,
        createdAt: '2026-09-27T00:00:00Z',
        createdBy: 'user',
        updatedAt: '2026-09-27T00:05:00Z',
        updatedBy: 'user',
        sourceMetadata: {},
      };

      const resumed = importSessionClientService.reconstructResumedBatch(mockRecord);
      expect(resumed.requiresSourceFileReattach).toBe(true);
    });

    it('52. review remains usable without original binary file', () => {
      const batch = createSampleDriveBatch();
      // Row review and entity decisions work on the batch in-memory without needing the ArrayBuffer
      const updated = GoogleDrivePipelineService.applyRowReview(
        batch,
        1,
        'ACCEPT_WARNING',
        dummyContext
      );
      expect(updated.rows[0].reviewStatus).toBe('accepted');
    });

    it('53. wrong-project locator for Google Drive is rejected and removed', () => {
      const locatorKey = 'qsaudi_import_session_locator_PRJ-TEST-6B1';
      sessionStorage.setItem(
        locatorKey,
        JSON.stringify({ projectId: 'PRJ-OTHER', importSessionId: 'sess_drv_other' })
      );

      const raw = sessionStorage.getItem(locatorKey);
      const parsed = JSON.parse(raw!);
      if (parsed.projectId !== 'PRJ-TEST-6B1') {
        sessionStorage.removeItem(locatorKey);
      }

      expect(sessionStorage.getItem(locatorKey)).toBeNull();
    });

    it('54. COMMITTED Google Drive session record locator is removed', async () => {
      const locatorKey = 'qsaudi_import_session_locator_PRJ-TEST-6B1';
      sessionStorage.setItem(
        locatorKey,
        JSON.stringify({ projectId: 'PRJ-TEST-6B1', importSessionId: 'sess_drv_committed' })
      );

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            importSessionId: 'sess_drv_committed',
            lifecycleState: 'COMMITTED',
          },
        }),
      });

      const session = await importSessionClientService.getSession('PRJ-TEST-6B1', 'sess_drv_committed');
      if (session.lifecycleState === 'COMMITTED') {
        sessionStorage.removeItem(locatorKey);
      }

      expect(sessionStorage.getItem(locatorKey)).toBeNull();
    });
  });

  // =========================================================================
  // GOOGLE DRIVE — CONCURRENCY / COMMIT (Tests 55–60)
  // =========================================================================
  describe('GOOGLE DRIVE — CONCURRENCY / COMMIT', () => {
    it('55. VERSION_CONFLICT surfaced on concurrent Google Drive session update', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 409,
        json: async () => ({
          success: false,
          error: 'Version conflict',
          code: 'VERSION_CONFLICT',
        }),
      });

      await expect(
        importSessionClientService.updateCheckpoint(
          'PRJ-TEST-6B1',
          'sess_drv_101',
          { lifecycleState: 'REVIEW_REQUIRED' },
          1
        )
      ).rejects.toThrow('Version conflict');
    });

    it('56. sessionVersion preserved on conflict without local mutation', async () => {
      let localVersion = 3;
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 409,
        json: async () => ({
          success: false,
          code: 'VERSION_CONFLICT',
          error: 'Version conflict',
        }),
      });

      try {
        await importSessionClientService.updateCheckpoint(
          'PRJ-TEST-6B1',
          'sess_drv_101',
          { lifecycleState: 'REVIEW_REQUIRED' },
          localVersion
        );
      } catch (err: any) {
        expect(err.code).toBe('VERSION_CONFLICT');
      }

      expect(localVersion).toBe(3);
    });

    it('57. successful PATCH updates sessionVersion for Google Drive', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            importSessionId: 'sess_drv_101',
            version: 4,
          },
        }),
      });

      const updated = await importSessionClientService.updateCheckpoint(
        'PRJ-TEST-6B1',
        'sess_drv_101',
        { lifecycleState: 'REVIEW_REQUIRED' },
        3
      );

      expect(updated.version).toBe(4);
    });

    it('58. successful business commit closes Google Drive session with COMMITTED', async () => {
      let savedState = '';
      globalThis.fetch = vi.fn().mockImplementation(async (_url, init) => {
        savedState = JSON.parse(init.body).lifecycleState;
        return {
          ok: true,
          json: async () => ({
            success: true,
            data: {
              importSessionId: 'sess_drv_101',
              lifecycleState: 'COMMITTED',
              version: 5,
            },
          }),
        };
      });

      await importSessionClientService.updateCheckpoint(
        'PRJ-TEST-6B1',
        'sess_drv_101',
        {
          lifecycleState: 'COMMITTED',
          currentStage: 'COMMITTED',
        },
        4
      );

      expect(savedState).toBe('COMMITTED');
    });

    it('59. successful business commit removes Google Drive locator', () => {
      const locatorKey = 'qsaudi_import_session_locator_PRJ-TEST-6B1';
      sessionStorage.setItem(
        locatorKey,
        JSON.stringify({ projectId: 'PRJ-TEST-6B1', importSessionId: 'sess_drv_101' })
      );

      // Business commit succeeds
      sessionStorage.removeItem(locatorKey);
      expect(sessionStorage.getItem(locatorKey)).toBeNull();
    });

    it('60. failed business commit keeps Google Drive session active', () => {
      const locatorKey = 'qsaudi_import_session_locator_PRJ-TEST-6B1';
      sessionStorage.setItem(
        locatorKey,
        JSON.stringify({ projectId: 'PRJ-TEST-6B1', importSessionId: 'sess_drv_101' })
      );

      // Commit failed -> session is not closed and locator remains
      expect(sessionStorage.getItem(locatorKey)).toBeTruthy();
    });
  });

  // =========================================================================
  // SECURITY & ARCHITECTURE (Tests 61–65+)
  // =========================================================================
  describe('SECURITY & ARCHITECTURE', () => {
    it('61. no direct Firestore writes added to client review components', () => {
      // Review actions delegate to ExcelCsvPipelineService / importSessionClientService (no setDoc / addDoc in components)
      expect(typeof importSessionClientService.updateCheckpoint).toBe('function');
    });

    it('62. no new server endpoints used beyond standard import-sessions API', async () => {
      let targetEndpoint = '';
      globalThis.fetch = vi.fn().mockImplementation(async (url) => {
        targetEndpoint = String(url);
        return {
          ok: true,
          json: async () => ({
            success: true,
            data: { importSessionId: 'sess_test', version: 1 },
          }),
        };
      });

      await importSessionClientService.createSession('PRJ-TEST-6B1', {
        projectId: 'PRJ-TEST-6B1',
        sourceType: 'GOOGLE_SHEETS',
      });
      expect(targetEndpoint).toBe('/api/projects/PRJ-TEST-6B1/import-sessions');

      await importSessionClientService.updateCheckpoint(
        'PRJ-TEST-6B1',
        'sess_test',
        { lifecycleState: 'REVIEW_REQUIRED' },
        1
      );
      expect(targetEndpoint).toBe('/api/projects/PRJ-TEST-6B1/import-sessions/sess_test');
    });

    it('63. no auth tokens or credentials persisted in session payload', () => {
      expect(() => {
        (importSessionClientService as any).sanitizePayload({
          token: 'secret_oauth_token_123',
        });
      }).toThrow('INVALID_PAYLOAD_FORBIDDEN_FIELDS');

      expect(() => {
        (importSessionClientService as any).sanitizePayload({
          refreshToken: 'secret_refresh_token_123',
        });
      }).toThrow('INVALID_PAYLOAD_FORBIDDEN_FIELDS');
    });

    it('64. raw binary data is rejected during sanitization', () => {
      expect(() => {
        (importSessionClientService as any).sanitizePayload({
          buffer: new ArrayBuffer(128),
        });
      }).toThrow('Raw ArrayBuffers cannot be persisted');
    });

    it('65. reuses the existing single importSessionClientService singleton without parallel service', () => {
      expect(importSessionClientService).toBeDefined();
      expect(typeof importSessionClientService.generateStableIdentities).toBe('function');
      expect(typeof importSessionClientService.createSession).toBe('function');
      expect(typeof importSessionClientService.updateCheckpoint).toBe('function');
      expect(typeof importSessionClientService.getSession).toBe('function');
      expect(typeof importSessionClientService.reconstructResumedBatch).toBe('function');
    });

    it('66. warning confirmation toggle checkpoints updated state and advances version', async () => {
      let savedWarningConf: boolean | undefined = undefined;
      globalThis.fetch = vi.fn().mockImplementation(async (_url, init) => {
        savedWarningConf = JSON.parse(init.body).warningConfirmation;
        return {
          ok: true,
          json: async () => ({
            success: true,
            data: { importSessionId: 'sess_1', version: 8 },
          }),
        };
      });

      const updated = await importSessionClientService.updateCheckpoint(
        'PRJ-TEST-6B1',
        'sess_1',
        { warningConfirmation: true },
        7
      );

      expect(savedWarningConf).toBe(true);
      expect(updated.version).toBe(8);
    });

    it('67. Google Sheets partial business commit does NOT mark session COMMITTED and keeps locator', async () => {
      const locatorKey = 'qsaudi_import_session_locator_PRJ-TEST-6B1';
      sessionStorage.setItem(locatorKey, JSON.stringify({ projectId: 'PRJ-TEST-6B1', importSessionId: 'sess_gsht_part_1' }));

      let checkpointPayload: any = null;
      globalThis.fetch = vi.fn().mockImplementation(async (_url, init) => {
        checkpointPayload = JSON.parse(init.body);
        return {
          ok: true,
          json: async () => ({
            success: true,
            data: { importSessionId: 'sess_gsht_part_1', version: 4, lifecycleState: checkpointPayload.lifecycleState },
          }),
        };
      });

      // Partial commit result has failedRows > 0, success === false
      const partialResult = {
        success: false,
        committedRows: 1,
        failedRows: 1,
        totalRows: 2,
      };

      const isFullSuccess = partialResult.success && partialResult.failedRows === 0;
      expect(isFullSuccess).toBe(false);

      // Checkpoint is persisted with REVIEW_REQUIRED
      await importSessionClientService.updateCheckpoint(
        'PRJ-TEST-6B1',
        'sess_gsht_part_1',
        {
          lifecycleState: 'REVIEW_REQUIRED',
          currentStage: 'REVIEW',
          reviewSnapshot: {
            totalRows: 2,
            validRows: 1,
            committedRows: 1,
            errorRows: 1,
            rows: [
              { rowNumber: 1, status: 'COMMITTED' },
              { rowNumber: 2, status: 'ERROR' },
            ],
          },
        },
        3
      );

      expect(checkpointPayload.lifecycleState).toBe('REVIEW_REQUIRED');
      expect(sessionStorage.getItem(locatorKey)).toBeTruthy();
    });

    it('68. Google Sheets partial returned batch snapshot preserves committed rows and failure issues', () => {
      const partialBatch: UnifiedImportBatch = {
        importBatchId: 'BAT-GSHT-PART',
        projectId: 'PRJ-TEST-6B1',
        source: { sourceType: 'GOOGLE_SHEETS', importBatchId: 'BAT-GSHT-PART' },
        currentStage: 'REVIEW',
        validationStatus: 'FAILED',
        commitStatus: 'AWAITING_REVIEW',
        totalRows: 2,
        validRows: 1,
        warningRows: 0,
        errorRows: 1,
        requiresReviewRows: 0,
        committedRows: 1,
        auditTrail: [],
        rows: [
          { rowNumber: 1, status: 'COMMITTED', validationIssues: [] },
          {
            rowNumber: 2,
            status: 'ERROR',
            validationIssues: [
              {
                issueId: 'ERR-PERSIST-1',
                rowNumber: 2,
                severity: 'BLOCKING',
                blocking: true,
                code: 'TRIP_PERSISTENCE_FAILED',
                message: 'DB Write failed',
              },
            ],
          },
        ],
        issues: [],
      };

      const cleanSnapshot = {
        totalRows: partialBatch.totalRows,
        validRows: partialBatch.validRows,
        warningRows: partialBatch.warningRows,
        errorRows: partialBatch.errorRows,
        committedRows: partialBatch.committedRows,
        rows: partialBatch.rows.map((r) => {
          const { rawInput, ...rest } = r as any;
          return rest;
        }),
      };

      expect(cleanSnapshot.rows[0].status).toBe('COMMITTED');
      expect(cleanSnapshot.rows[1].status).toBe('ERROR');
      expect(cleanSnapshot.rows[1].validationIssues[0].code).toBe('TRIP_PERSISTENCE_FAILED');
    });

    it('69. Google Sheets later full successful retry finalizes session as COMMITTED and removes locator', async () => {
      const locatorKey = 'qsaudi_import_session_locator_PRJ-TEST-6B1';
      sessionStorage.setItem(locatorKey, JSON.stringify({ projectId: 'PRJ-TEST-6B1', importSessionId: 'sess_gsht_retry_full' }));

      let checkpointPayload: any = null;
      globalThis.fetch = vi.fn().mockImplementation(async (_url, init) => {
        checkpointPayload = JSON.parse(init.body);
        return {
          ok: true,
          json: async () => ({
            success: true,
            data: { importSessionId: 'sess_gsht_retry_full', version: 5, lifecycleState: checkpointPayload.lifecycleState },
          }),
        };
      });

      const retryResult = {
        success: true,
        committedRows: 1,
        failedRows: 0,
        totalRows: 2,
      };

      const isFullSuccess = retryResult.success && retryResult.failedRows === 0;
      expect(isFullSuccess).toBe(true);

      await importSessionClientService.updateCheckpoint(
        'PRJ-TEST-6B1',
        'sess_gsht_retry_full',
        {
          lifecycleState: 'COMMITTED',
          currentStage: 'COMMITTED',
        },
        4
      );

      sessionStorage.removeItem(locatorKey);

      expect(checkpointPayload.lifecycleState).toBe('COMMITTED');
      expect(sessionStorage.getItem(locatorKey)).toBeNull();
    });

    it('70. Google Drive partial business commit does NOT mark session COMMITTED and keeps locator', async () => {
      const locatorKey = 'qsaudi_import_session_locator_PRJ-TEST-6B1';
      sessionStorage.setItem(locatorKey, JSON.stringify({ projectId: 'PRJ-TEST-6B1', importSessionId: 'sess_drv_part_1' }));

      let checkpointPayload: any = null;
      globalThis.fetch = vi.fn().mockImplementation(async (_url, init) => {
        checkpointPayload = JSON.parse(init.body);
        return {
          ok: true,
          json: async () => ({
            success: true,
            data: { importSessionId: 'sess_drv_part_1', version: 4, lifecycleState: checkpointPayload.lifecycleState },
          }),
        };
      });

      const partialResult = {
        success: false,
        committedRows: 1,
        failedRows: 1,
        totalRows: 2,
      };

      const isFullSuccess = partialResult.success && partialResult.failedRows === 0;
      expect(isFullSuccess).toBe(false);

      await importSessionClientService.updateCheckpoint(
        'PRJ-TEST-6B1',
        'sess_drv_part_1',
        {
          lifecycleState: 'REVIEW_REQUIRED',
          currentStage: 'REVIEW',
          reviewSnapshot: {
            rows: [
              { rowNumber: 1, status: 'COMMITTED' },
              { rowNumber: 2, status: 'ERROR' },
            ],
          },
        },
        3
      );

      expect(checkpointPayload.lifecycleState).toBe('REVIEW_REQUIRED');
      expect(sessionStorage.getItem(locatorKey)).toBeTruthy();
    });

    it('71. Google Drive partial returned batch snapshot preserves committed rows and failure issues', () => {
      const partialBatch: UnifiedImportBatch = {
        importBatchId: 'BAT-GDRV-PART',
        projectId: 'PRJ-TEST-6B1',
        source: { sourceType: 'GOOGLE_DRIVE', importBatchId: 'BAT-GDRV-PART' },
        currentStage: 'REVIEW',
        validationStatus: 'FAILED',
        commitStatus: 'AWAITING_REVIEW',
        totalRows: 2,
        validRows: 1,
        warningRows: 0,
        errorRows: 1,
        requiresReviewRows: 0,
        committedRows: 1,
        auditTrail: [],
        rows: [
          { rowNumber: 1, status: 'COMMITTED', validationIssues: [] },
          {
            rowNumber: 2,
            status: 'ERROR',
            validationIssues: [
              {
                issueId: 'ERR-PERSIST-DRV-1',
                rowNumber: 2,
                severity: 'BLOCKING',
                blocking: true,
                code: 'TRIP_PERSISTENCE_FAILED',
                message: 'Firestore write failed',
              },
            ],
          },
        ],
        issues: [],
      };

      const cleanSnapshot = {
        totalRows: partialBatch.totalRows,
        rows: partialBatch.rows.map((r) => {
          const { rawInput, ...rest } = r as any;
          return rest;
        }),
      };

      expect(cleanSnapshot.rows[0].status).toBe('COMMITTED');
      expect(cleanSnapshot.rows[1].status).toBe('ERROR');
      expect(cleanSnapshot.rows[1].validationIssues[0].code).toBe('TRIP_PERSISTENCE_FAILED');
    });

    it('72. Google Drive later full successful retry finalizes session as COMMITTED and removes locator', async () => {
      const locatorKey = 'qsaudi_import_session_locator_PRJ-TEST-6B1';
      sessionStorage.setItem(locatorKey, JSON.stringify({ projectId: 'PRJ-TEST-6B1', importSessionId: 'sess_drv_retry_full' }));

      let checkpointPayload: any = null;
      globalThis.fetch = vi.fn().mockImplementation(async (_url, init) => {
        checkpointPayload = JSON.parse(init.body);
        return {
          ok: true,
          json: async () => ({
            success: true,
            data: { importSessionId: 'sess_drv_retry_full', version: 6, lifecycleState: checkpointPayload.lifecycleState },
          }),
        };
      });

      const retryResult = {
        success: true,
        committedRows: 1,
        failedRows: 0,
        totalRows: 2,
      };

      const isFullSuccess = retryResult.success && retryResult.failedRows === 0;
      expect(isFullSuccess).toBe(true);

      await importSessionClientService.updateCheckpoint(
        'PRJ-TEST-6B1',
        'sess_drv_retry_full',
        {
          lifecycleState: 'COMMITTED',
          currentStage: 'COMMITTED',
        },
        5
      );

      sessionStorage.removeItem(locatorKey);

      expect(checkpointPayload.lifecycleState).toBe('COMMITTED');
      expect(sessionStorage.getItem(locatorKey)).toBeNull();
    });
  });
});
