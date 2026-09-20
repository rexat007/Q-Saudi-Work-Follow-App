import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DriverTruckImportCommitter } from '../services/import/driverTruckImport';
import { UnifiedImportBatch, PipelineContext } from '../types/unifiedImport';

// Mock auth from '../firebase/config'
vi.mock('../firebase/config', () => ({
  auth: {
    currentUser: {
      getIdToken: async () => 'test-firebase-token',
    },
  },
}));

describe('Phase 6: Fleet Entry Point & Legacy Roster Retirement', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    global.fetch = vi.fn();
  });

  it('should verify that DriverTruckImportCommitter uses the canonical intake API /api/intake/canonical sequentially', async () => {
    const mockBatch: UnifiedImportBatch = {
      importBatchId: 'BAT-123',
      projectId: 'PROJ-TEST',
      source: {
        sourceType: 'EXCEL',
        importBatchId: 'BAT-123',
        sourceFileName: 'test.xlsx',
        rawInput: new ArrayBuffer(0),
      },
      currentStage: 'PARSE',
      commitStatus: 'PARSED',
      requiresReviewRows: 0,
      committedRows: 0,
      operationId: 'OP-123',
      validationStatus: 'PASSED',
      totalRows: 2,
      validRows: 2,
      errorRows: 0,
      warningRows: 0,
      rows: [
        {
          rowNumber: 1,
          status: 'VALID',
          reviewStatus: 'accepted',
          raw: {},
          canonical: {
            driverName: 'Sami Al-Farsi',
            truckPlate: 'ABC 1234',
            driverPhone: '+966501111111',
            driverIdentity: '1011111111',
            materialId: 'MAT-SAND',
          },
          validationIssues: [],
          entityResolutions: {
            carrier: {
              entityType: 'CARRIER',
              originalValue: 'Golden Carrier',
              matchedId: 'CAR-GOLD',
              matchedName: 'Golden Carrier',
              confidence: 100,
              isExact: true,
              isAuthorized: true,
              riskLevel: 'LOW',
            },
          },
        },
        {
          rowNumber: 2,
          status: 'VALID',
          reviewStatus: 'accepted',
          raw: {},
          canonical: {
            driverName: 'Fahd Al-Otaibi',
            truckPlate: 'XYZ 9999',
            driverPhone: '+966502222222',
            driverIdentity: '1022222222',
            materialId: 'MAT-GRAVEL',
          },
          validationIssues: [],
          entityResolutions: {
            carrier: {
              entityType: 'CARRIER',
              originalValue: 'Golden Carrier',
              matchedId: 'CAR-GOLD',
              matchedName: 'Golden Carrier',
              confidence: 100,
              isExact: true,
              isAuthorized: true,
              riskLevel: 'LOW',
            },
          },
        },
      ],
      issues: [],
      createdAt: new Date().toISOString(),
      auditTrail: [],
      createdBy: 'user-admin',
    };

    const mockContext: PipelineContext = {
      projectId: 'PROJ-TEST',
      userId: 'user-admin',
      role: 'PROJECT_ADMIN',
      operationId: 'OP-123',
    };

    const fetchSpy = vi.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ affiliationId: 'AFF-MOCK' }),
      })
    );
    global.fetch = fetchSpy;

    const committer = new DriverTruckImportCommitter();
    const result = await committer.commit(mockBatch, mockContext);

    // 1. Verify successful response structure
    expect(result.success).toBe(true);
    expect(result.committedRows).toBe(2);
    expect(result.failedRows).toBe(0);

    // 2. Verify sequential endpoint invocations to the canonical API
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(fetchSpy).toHaveBeenNthCalledWith(
      1,
      '/api/intake/canonical',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-firebase-token',
        },
        body: JSON.stringify({
          projectId: 'PROJ-TEST',
          carrierId: 'CAR-GOLD',
          materialId: 'MAT-SAND',
          driverName: 'Sami Al-Farsi',
          plateNumber: 'ABC 1234',
          phone: '+966501111111',
          residencyId: '1011111111',
        }),
      })
    );

    expect(fetchSpy).toHaveBeenNthCalledWith(
      2,
      '/api/intake/canonical',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-firebase-token',
        },
        body: JSON.stringify({
          projectId: 'PROJ-TEST',
          carrierId: 'CAR-GOLD',
          materialId: 'MAT-GRAVEL',
          driverName: 'Fahd Al-Otaibi',
          plateNumber: 'XYZ 9999',
          phone: '+966502222222',
          residencyId: '1022222222',
        }),
      })
    );
  });

  it('should handle sequential errors gracefully inside DriverTruckImportCommitter', async () => {
    const mockBatch: UnifiedImportBatch = {
      importBatchId: 'BAT-123',
      projectId: 'PROJ-TEST',
      source: {
        sourceType: 'EXCEL',
        importBatchId: 'BAT-123',
        sourceFileName: 'test.xlsx',
        rawInput: new ArrayBuffer(0),
      },
      currentStage: 'PARSE',
      commitStatus: 'PARSED',
      requiresReviewRows: 0,
      committedRows: 0,
      operationId: 'OP-123',
      validationStatus: 'PASSED',
      totalRows: 1,
      validRows: 1,
      errorRows: 0,
      warningRows: 0,
      rows: [
        {
          rowNumber: 1,
          status: 'VALID',
          reviewStatus: 'accepted',
          raw: {},
          canonical: {
            driverName: 'Sami Al-Farsi',
            truckPlate: 'ABC 1234',
          },
          validationIssues: [],
          entityResolutions: {
            carrier: {
              entityType: 'CARRIER',
              originalValue: 'Golden Carrier',
              matchedId: 'CAR-GOLD',
              matchedName: 'Golden Carrier',
              confidence: 100,
              isExact: true,
              isAuthorized: true,
              riskLevel: 'LOW',
            },
          },
        },
      ],
      issues: [],
      createdAt: new Date().toISOString(),
      auditTrail: [],
      createdBy: 'user-admin',
    };

    const mockContext: PipelineContext = {
      projectId: 'PROJ-TEST',
      userId: 'user-admin',
      role: 'PROJECT_ADMIN',
      operationId: 'OP-123',
    };

    // Return custom API error
    global.fetch = vi.fn().mockImplementation(() =>
      Promise.resolve({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: 'علاقة السائق بالناقل مسجلة وغير مسموح بالتكرار' }),
      })
    );

    const committer = new DriverTruckImportCommitter();
    const result = await committer.commit(mockBatch, mockContext);

    expect(result.success).toBe(false);
    expect(result.committedRows).toBe(0);
    expect(result.failedRows).toBe(1);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0].messageAr).toContain('علاقة السائق بالناقل مسجلة وغير مسموح بالتكرار');
  });
});
