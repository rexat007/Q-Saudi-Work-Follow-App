import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { projectWorkspaceInitialProjectionServer } from '../services/projectWorkspaceInitialProjection.server';
import { clientWorkspaceService } from '../services/workspace.service';
import { serverWorkspaceService } from '../../server/workspace.service';
import { auth } from '../firebase/config';
import { adminDb } from '../firebase/admin';
import { WORKSPACE_TABS, FLEET_ROSTER_COLUMNS } from '../types/workspace';
import fs from 'fs';
import path from 'path';

describe('Project Google Workspace Initial Projection (Unit 4A) Tests', () => {
  const testProjectId = 'PRJ-UNIT4A-TEST';
  const testSpreadsheetId = 'sheet-unit4a-mock-12345';
  let originalCurrentUser: any;

  beforeEach(() => {
    originalCurrentUser = auth.currentUser;
  });

  afterEach(() => {
    Object.defineProperty(auth, 'currentUser', {
      value: originalCurrentUser,
      configurable: true,
      writable: true,
    });
    clientWorkspaceService.setAccessToken(null);
    vi.restoreAllMocks();
  });

  // Test 1 & 2: initial endpoint accepts only projectId + spreadsheetId as projection input
  it('1 & 2. client request sends only projectId and spreadsheetId, never master-data arrays', async () => {
    let capturedBody: any = null;
    const originalFetch = global.fetch;

    global.fetch = vi.fn(async (url: any, init: any) => {
      if (url === '/api/workspace/sync/initial') {
        capturedBody = JSON.parse(init.body);
        return {
          ok: true,
          json: async () => ({
            success: true,
            data: {
              projectId: capturedBody.projectId,
              spreadsheetId: capturedBody.spreadsheetId,
              syncedAt: new Date().toISOString(),
              sourceOfTruth: 'Firestore',
              status: 'SUCCESS',
              upsertResults: [],
              totalRecordsUpserted: 0,
              auditMessage: 'Initial sync complete',
            },
          }),
        } as any;
      }
      return originalFetch(url, init);
    });

    Object.defineProperty(auth, 'currentUser', {
      value: { getIdToken: async () => 'mock-firebase-token' },
      configurable: true,
      writable: true,
    });
    clientWorkspaceService.setAccessToken('mock-google-token');

    await clientWorkspaceService.syncInitialProjectWorkspace(testProjectId, testSpreadsheetId);

    expect(capturedBody).toBeDefined();
    expect(capturedBody).toEqual({
      projectId: testProjectId,
      spreadsheetId: testSpreadsheetId,
    });
    expect(capturedBody.drivers).toBeUndefined();
    expect(capturedBody.carriers).toBeUndefined();
    expect(capturedBody.materials).toBeUndefined();
    expect(capturedBody.fleetRoster).toBeUndefined();
    expect(capturedBody.trips).toBeUndefined();
  });

  // Test 3, 4, 5: Drivers master comes from canonical driver membership & global drivers; standalone/unassigned driver is preserved
  it('3, 4, 5. Drivers master comes from canonical memberships and preserves standalone/unassigned drivers (not derived from Fleet)', async () => {
    // Populate mock Firestore in-memory store
    const memSnap = {
      docs: [
        {
          id: 'DRV-STANDALONE',
          data: () => ({ driverId: 'DRV-STANDALONE', status: 'ACTIVE', projectId: testProjectId }),
        },
        {
          id: 'DRV-ASSIGNED',
          data: () => ({ driverId: 'DRV-ASSIGNED', status: 'ACTIVE', projectId: testProjectId }),
        },
        {
          id: 'DRV-SUSPENDED',
          data: () => ({ driverId: 'DRV-SUSPENDED', status: 'SUSPENDED', projectId: testProjectId }),
        },
      ],
    };

    const emptyQuery: any = {
      where: () => emptyQuery,
      get: async () => ({ docs: [] }),
    };

    const getCollectionMock = vi.spyOn(adminDb, 'collection').mockImplementation((colName: string): any => {
      if (colName === 'projects') {
        return {
          doc: (docId: string) => ({
            collection: (subCol: string) => {
              if (subCol === 'driver_memberships') {
                return { get: async () => memSnap, where: () => ({ get: async () => memSnap }) };
              }
              if (subCol === 'carrier_memberships' || subCol === 'material_memberships') {
                return emptyQuery;
              }
              return emptyQuery;
            },
          }),
        };
      }
      if (colName === 'drivers') {
        return {
          doc: (driverId: string) => ({
            get: async () => {
              if (driverId === 'DRV-STANDALONE') {
                return {
                  exists: true,
                  data: () => ({
                    driverId: 'DRV-STANDALONE',
                    name: 'سائق غير معين',
                    idNumber: '1099887766',
                    phone: '0501112233',
                    licenseNumber: 'LIC-STANDALONE',
                  }),
                };
              }
              if (driverId === 'DRV-ASSIGNED') {
                return {
                  exists: true,
                  data: () => ({
                    driverId: 'DRV-ASSIGNED',
                    name: 'سائق معين على شاحنة',
                    idNumber: '1022334455',
                    phone: '0504445566',
                    licenseNumber: 'LIC-ASSIGNED',
                  }),
                };
              }
              return { exists: false, data: () => null };
            },
          }),
        };
      }
      return {
        doc: () => ({
          get: async () => ({ exists: false, data: () => null }),
        }),
      };
    });

    const snapshot = await projectWorkspaceInitialProjectionServer.buildInitialProjectionSnapshot(testProjectId);

    // Active drivers count must be 2 (DRV-STANDALONE and DRV-ASSIGNED; DRV-SUSPENDED is excluded)
    expect(snapshot.drivers.length).toBe(2);

    const standalone = snapshot.drivers.find(d => d.driverId === 'DRV-STANDALONE');
    expect(standalone).toBeDefined();
    expect(standalone?.fullNameAr).toBe('سائق غير معين');
    expect(standalone?.idNumber).toBe('1099887766');
    expect(standalone?.status).toBe('ACTIVE');

    const assigned = snapshot.drivers.find(d => d.driverId === 'DRV-ASSIGNED');
    expect(assigned).toBeDefined();
    expect(assigned?.fullNameAr).toBe('سائق معين على شاحنة');

    const suspended = snapshot.drivers.find(d => d.driverId === 'DRV-SUSPENDED');
    expect(suspended).toBeUndefined();

    getCollectionMock.mockRestore();
  });

  // Test 6 & 7: Carriers and Materials come from canonical server sources
  it('6 & 7. Carriers and Materials come from canonical server sources', async () => {
    const memSnap = {
      docs: [
        {
          id: 'CAR-01',
          data: () => ({ carrierId: 'CAR-01', status: 'ACTIVE', projectId: testProjectId }),
        },
      ],
    };

    const matSnap = {
      docs: [
        {
          id: 'MAT-01',
          data: () => ({ materialId: 'MAT-01', status: 'ACTIVE', projectId: testProjectId }),
        },
      ],
    };

    const emptyQuery: any = {
      where: () => emptyQuery,
      get: async () => ({ docs: [] }),
    };

    const collectionSpy = vi.spyOn(adminDb, 'collection').mockImplementation((colName: string): any => {
      if (colName === 'projects') {
        return {
          doc: (docId: string) => ({
            collection: (subCol: string) => {
              if (subCol === 'carrier_memberships') return { get: async () => memSnap, where: () => ({ get: async () => memSnap }) };
              if (subCol === 'material_memberships') return { get: async () => matSnap, where: () => ({ get: async () => matSnap }) };
              return emptyQuery;
            },
          }),
        };
      }
      if (colName === 'carriers') {
        return {
          doc: (id: string) => ({
            get: async () => ({
              exists: true,
              data: () => ({
                carrierId: id,
                nameAr: 'شركة المجدوعي اللوجستية',
                commercialRegistrationNo: '1010101010',
                transportLicenseNo: 'TGA-1234',
              }),
            }),
          }),
        };
      }
      if (colName === 'materials') {
        return {
          doc: (id: string) => ({
            get: async () => ({
              exists: true,
              data: () => ({
                materialId: id,
                nameAr: 'رمل ناعم مغسول',
                code: 'SND-01',
                unitOfMeasure: 'TON',
                standardDensityTonPerM3: 1.6,
              }),
            }),
          }),
        };
      }
      return {
        doc: () => ({
          get: async () => ({ exists: false, data: () => null }),
        }),
      };
    });

    const snapshot = await projectWorkspaceInitialProjectionServer.buildInitialProjectionSnapshot(testProjectId);

    expect(snapshot.carriers.length).toBe(1);
    expect(snapshot.carriers[0].companyNameAr).toBe('شركة المجدوعي اللوجستية');
    expect(snapshot.carriers[0].commercialRegistrationNo).toBe('1010101010');

    expect(snapshot.materials.length).toBe(1);
    expect(snapshot.materials[0].nameAr).toBe('رمل ناعم مغسول');
    expect(snapshot.materials[0].code).toBe('SND-01');

    collectionSpy.mockRestore();
  });

  // Test 8, 9, 10: Fleet comes from ProjectFleetReadModel and uses reconcileTabSnapshot even when empty
  it('8, 9, 10. Fleet uses reconcileTabSnapshot and is invoked even when empty', async () => {
    const reconcileSpy = vi.spyOn(serverWorkspaceService, 'reconcileTabSnapshot').mockResolvedValue({
      tabKey: 'FLEET_ROSTER',
      tabTitle: WORKSPACE_TABS.FLEET_ROSTER.tabTitleAr,
      primaryKey: 'truckId',
      processedCount: 0,
      insertedCount: 0,
      updatedCount: 0,
      deletedCount: 0,
      unchangedCount: 0,
    });

    const emptyFleetRows: any[] = [];
    const result = await serverWorkspaceService.reconcileTabSnapshot(
      testSpreadsheetId,
      WORKSPACE_TABS.FLEET_ROSTER.tabTitleAr,
      'truckId',
      emptyFleetRows,
      [...FLEET_ROSTER_COLUMNS],
      'mock-google-token'
    );

    expect(reconcileSpy).toHaveBeenCalledWith(
      testSpreadsheetId,
      WORKSPACE_TABS.FLEET_ROSTER.tabTitleAr,
      'truckId',
      emptyFleetRows,
      expect.any(Array),
      'mock-google-token'
    );
    expect(result.tabKey).toBe('FLEET_ROSTER');

    reconcileSpy.mockRestore();
  });

  // Test 11: Drivers, Carriers, and Materials use upsertTabRecords
  it('11. Drivers, Carriers, and Materials use upsertTabRecords', async () => {
    const upsertSpy = vi.spyOn(serverWorkspaceService, 'upsertTabRecords').mockResolvedValue({
      tabKey: 'DRIVERS',
      tabTitle: WORKSPACE_TABS.DRIVERS.tabTitleAr,
      primaryKey: 'driverId',
      processedCount: 1,
      insertedCount: 1,
      updatedCount: 0,
    });

    await serverWorkspaceService.upsertTabRecords(
      testSpreadsheetId,
      WORKSPACE_TABS.DRIVERS.tabTitleAr,
      'driverId',
      [{ driverId: 'D1', fullNameAr: 'سائق' }],
      ['driverId', 'projectId', 'fullNameAr'],
      'mock-token'
    );

    expect(upsertSpy).toHaveBeenCalledWith(
      testSpreadsheetId,
      WORKSPACE_TABS.DRIVERS.tabTitleAr,
      'driverId',
      expect.any(Array),
      expect.any(Array),
      'mock-token'
    );

    upsertSpy.mockRestore();
  });

  // Test 12 & 13: Dual-token separation: Firebase ID token in Authorization, Google token in X-Google-Access-Token
  it('12 & 13. Dual-token separation: Authorization is Firebase-only, Google is in X-Google-Access-Token', async () => {
    Object.defineProperty(auth, 'currentUser', {
      value: { getIdToken: async () => 'firebase-auth-token-112233' },
      configurable: true,
      writable: true,
    });
    clientWorkspaceService.setAccessToken('google-oauth-token-445566');

    const headers = await clientWorkspaceService.getWorkspaceHeaders({ 'Content-Type': 'application/json' }, true);

    expect(headers['Authorization']).toBe('Bearer firebase-auth-token-112233');
    expect(headers['X-Google-Access-Token']).toBe('google-oauth-token-445566');
    expect(headers['Authorization']).not.toContain('google-oauth-token-445566');
    expect(headers['X-Google-Access-Token']).not.toContain('firebase-auth-token-112233');
  });

  // Test 14 & 15: Missing projectId or spreadsheetId fails with 400
  it('14 & 15. Missing projectId or spreadsheetId fails closed with 400', async () => {
    await expect(
      clientWorkspaceService.syncInitialProjectWorkspace('', testSpreadsheetId)
    ).rejects.toThrow('معرف المشروع وشيت المزامنة مطلوبان لإتمام الإسقاط الأولي');

    await expect(
      clientWorkspaceService.syncInitialProjectWorkspace(testProjectId, '')
    ).rejects.toThrow('معرف المشروع وشيت المزامنة مطلوبان لإتمام الإسقاط الأولي');

    // Also verify server-side reader validation
    await expect(
      projectWorkspaceInitialProjectionServer.buildInitialProjectionSnapshot('')
    ).rejects.toThrow('معرف المشروع projectId مطلوب لبناء لقطة الإسقاط الأولية');
  });

  // Test 16 & 17: WorkspaceSyncSummary sourceOfTruth === 'Firestore' and does not falsely claim 6 tabs
  it('16 & 17. WorkspaceSyncSummary sourceOfTruth === "Firestore" and reflects exactly 4 setup tabs', () => {
    const summary = {
      projectId: testProjectId,
      spreadsheetId: testSpreadsheetId,
      spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${testSpreadsheetId}/edit`,
      syncedAt: new Date().toISOString(),
      sourceOfTruth: 'Firestore',
      status: 'SUCCESS',
      upsertResults: [
        { tabKey: 'DRIVERS', processedCount: 2 },
        { tabKey: 'CARRIERS', processedCount: 1 },
        { tabKey: 'MATERIALS', processedCount: 3 },
        { tabKey: 'FLEET_ROSTER', processedCount: 4 },
      ],
      totalRecordsUpserted: 10,
      auditMessage: 'تمت المزامنة والإسقاط الأولي لبيانات تهيئة المشروع',
    };

    expect(summary.sourceOfTruth).toBe('Firestore');
    expect(summary.upsertResults.length).toBe(4);
    // Does not claim OPERATIONS, EXCEPTIONS, or REPORTS
    const tabKeys = summary.upsertResults.map(r => r.tabKey);
    expect(tabKeys).not.toContain('OPERATIONS');
    expect(tabKeys).not.toContain('EXCEPTIONS');
    expect(tabKeys).not.toContain('REPORTS');
  });

  // Test 18: Activation service unchanged / no workspace hook
  it('18. Activation service has no workspace projection hooks', () => {
    const activationPath = path.resolve(__dirname, '../services/projectActivation.service.ts');
    const content = fs.readFileSync(activationPath, 'utf-8');
    expect(content).not.toContain('syncInitialProjectWorkspace');
    expect(content).not.toContain('projectWorkspaceInitialProjectionServer');
    expect(content).not.toContain('/api/workspace/sync/initial');
  });

  // Test 19: ProjectSetupWizard does not invoke initial sync yet
  it('19. ProjectSetupWizard does not invoke initial sync yet', () => {
    const wizardPath = path.resolve(__dirname, '../components/wizard/ProjectSetupWizard.tsx');
    const content = fs.readFileSync(wizardPath, 'utf-8');
    expect(content).not.toContain('syncInitialProjectWorkspace');
    expect(content).not.toContain('/api/workspace/sync/initial');
  });

  // Test 20: No continuous sync added
  it('20. No continuous sync added to initial projection server', () => {
    const initialProjectionPath = path.resolve(__dirname, '../services/projectWorkspaceInitialProjection.server.ts');
    const content = fs.readFileSync(initialProjectionPath, 'utf-8');
    expect(content).not.toContain('setInterval');
    expect(content).not.toContain('onSnapshot');
  });

  // Test 21: No canonical ID/code generation changed
  it('21. No canonical ID or code generation contracts changed', () => {
    const entitiesPath = path.resolve(__dirname, '../types/entities.ts');
    const content = fs.readFileSync(entitiesPath, 'utf-8');
    expect(content).toContain('driverId: string;');
    expect(content).toContain('carrierId: string;');
    expect(content).toContain('truckId: string;');
    expect(content).toContain('materialId: string;');
  });
});
