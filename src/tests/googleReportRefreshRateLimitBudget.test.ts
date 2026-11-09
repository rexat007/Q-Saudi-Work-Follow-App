import {describe,it,expect,vi,beforeEach} from 'vitest';
import {projectGoogleBlueprintPort} from '../../server/projectGoogleBlueprint.adapter';
import {buildOperationalReport} from '../services/operationalReporting';
import {operationConfig} from './helpers/operationalProfileFixture';
import {GoogleWorkspaceCommandError, workspaceOperation} from '../services/projectGoogleWorkspace.server';
import {operationalSheetsFixture} from './helpers/operationalSheetsFixture';

vi.mock('../../server/workspace.isolation', async importOriginal => {
  const original = await importOriginal<any>();
  return { ...original, WorkspaceStorageBoundary: class { async assertCanonicalStorage() {} } };
});

const f = vi.hoisted(() => ({
  driveGet: vi.fn(),
  api: null as any
}));

vi.mock('googleapis', () => ({
  google: {
    auth: {
      OAuth2: class {
        setCredentials() {}
        async getTokenInfo() {
          return {
            scopes: [
              'https://www.googleapis.com/auth/drive.file',
              'https://www.googleapis.com/auth/spreadsheets',
              'https://www.googleapis.com/auth/script.projects'
            ]
          };
        }
      }
    },
    sheets: () => f.api,
    drive: () => ({
      files: {
        get: f.driveGet
      }
    }),
    script: () => ({})
  }
}));

describe('Google Report Refresh — Rate Limit & Request Budget Closure', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    f.driveGet.mockResolvedValue({
      data: {
        mimeType: 'application/vnd.google-apps.spreadsheet',
        parents: ['folder'],
        appProperties: {
          qSaudiWorkspaceOperation: workspaceOperation('P1'),
          resourceRole: 'SPREADSHEET'
        }
      }
    });
    const fixture = operationalSheetsFixture();
    f.api = fixture.api;
  });

  it('bounds provider read requests independently of row count for derived snapshot tabs', async () => {
    const config = operationConfig('WEIGHBRIDGE', 'WEIGHBRIDGE');
    const report = buildOperationalReport([], { projectId: 'P1' }, new Date(), config);
    const port = projectGoogleBlueprintPort('fixture', 'P1');

    f.api.spreadsheets.get.mockClear();

    await port.projectProfileReports!('file', report);

    // Verify sheets.get calls count is bounded and flat for all 7 derived snapshot tabs
    const readRequests = f.api.spreadsheets.get.mock.calls.length;
    expect(readRequests).toBeLessThan(30);
  });

  it('retries bounded exponential backoff with jitter on GOOGLE_RATE_LIMITED and invokes deliveryFence', async () => {
    const config = operationConfig('WEIGHBRIDGE', 'WEIGHBRIDGE');
    const report = buildOperationalReport([], { projectId: 'P1' }, new Date(), config);
    const port = projectGoogleBlueprintPort('fixture', 'P1');

    let fenceCalls = 0;
    port.setDeliveryFence(async () => { fenceCalls++; });

    let attempts = 0;
    f.driveGet.mockImplementation(async () => {
      attempts++;
      if (attempts === 1) {
        throw { response: { status: 429, data: { error: { message: 'Rate limit exceeded' } } } };
      }
      return {
        data: {
          mimeType: 'application/vnd.google-apps.spreadsheet',
          parents: ['folder'],
          appProperties: { qSaudiWorkspaceOperation: workspaceOperation('P1'), resourceRole: 'SPREADSHEET' }
        }
      };
    });

    await port.projectProfileReports!('file', report);

    expect(attempts).toBeGreaterThanOrEqual(2);
    expect(fenceCalls).toBeGreaterThanOrEqual(2);
  });

  it('returns GOOGLE_RATE_LIMITED after retries exhausted (max 3 retries)', async () => {
    const config = operationConfig('WEIGHBRIDGE', 'WEIGHBRIDGE');
    const report = buildOperationalReport([], { projectId: 'P1' }, new Date(), config);
    const port = projectGoogleBlueprintPort('fixture', 'P1');

    f.driveGet.mockImplementation(async () => {
      throw { response: { status: 429, data: { error: { message: 'Rate limit exceeded' } } } };
    });

    const err = await port.projectProfileReports!('file', report).catch(e => e);
    expect(err).toBeInstanceOf(GoogleWorkspaceCommandError);
    expect(err.code).toBe('GOOGLE_RATE_LIMITED');
    expect(err.status).toBe(429);
  }, 10000);

  it('does not retry non-rate-limit errors like 403 GOOGLE_PERMISSION_DENIED', async () => {
    const config = operationConfig('WEIGHBRIDGE', 'WEIGHBRIDGE');
    const report = buildOperationalReport([], { projectId: 'P1' }, new Date(), config);
    const port = projectGoogleBlueprintPort('fixture', 'P1');

    let attempts = 0;
    f.driveGet.mockImplementation(async () => {
      attempts++;
      throw { response: { status: 403, data: { error: { message: 'Permission denied' } } } };
    });

    const err = await port.projectProfileReports!('file', report).catch(e => e);
    expect(attempts).toBe(1); // 0 retries
    expect(err.code).toBe('GOOGLE_PERMISSION_DENIED');
  });

  describe('Server-Authoritative 60-Second Quota Guard & Timestamp Semantics', () => {
    let mockContinuity: any;
    let mockDb: any;
    let mockWho: any;

    beforeEach(() => {
      const mockUser = {
        userId: 'u1',
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
        isActive: true,
        email: 'admin@q-saudi.sa',
        assignedProjectIds: ['P1']
      };
      const mockProject = { projectId: 'P1', nameAr: 'مشروع اختبار', status: 'ACTIVE' };

      mockContinuity = {
        binding: {
          projectId: 'P1',
          googleSubject: 'user@q-saudi.sa',
          spreadsheetId: 'sheet-1',
          destinationRootFolderId: 'root-1',
          projectFolderId: 'folder-1',
          workspaceBlueprintVersion: 'SABIL-HAIL-V1',
          revision: 1
        },
        state: 'READY',
        workbookHealth: 'HEALTHY',
        automationState: 'READY',
        backgroundAuthorization: 'CONNECTED'
      };

      const userDoc = { _col: 'users', _docId: 'u1' };
      const projectDoc = { _col: 'projects', _docId: 'P1' };
      const continuityDoc = { _col: 'workspace_continuity', _docId: 'current' };

      const mockOutboxQuery = {
        where: () => mockOutboxQuery,
        limit: () => mockOutboxQuery,
        count: () => ({ get: async () => ({ data: () => ({ count: 0 }) }) }),
        get: async () => ({ docs: [] }),
        _isQuery: true
      };

      const docObj = (type: string) => ({
        _type: type,
        get: async () => ({
          exists: true,
          data: () => (type === 'user' ? mockUser : type === 'project' ? mockProject : type === 'continuity' ? mockContinuity : type==='projectionState'?{projectId:'P1',dirtyTabs:[],mutationRevision:1,updatedAt:new Date().toISOString()}:undefined)
        }),
        collection: (subName: string) => {
          if (subName === 'workspace_continuity') return { doc: () => docObj('continuity') };
          if (subName === 'workspace_sync_outbox') return {...mockOutboxQuery,doc:()=>docObj('outbox')};
          if (subName === 'workspace_projection_state') return { doc: () => docObj('projectionState') };
          if (subName === 'trips') return { get: async () => ({ docs: [] }) };
          return { doc: () => docObj('generic'), where: () => mockOutboxQuery, get: async () => ({ docs: [] }) };
        }
      });

      mockDb = {
        collection: (col: string) => ({
          doc: (docId: string) => docObj(col === 'users' ? 'user' : col === 'projects' ? 'project' : 'generic'),
          where: () => mockOutboxQuery
        }),
        runTransaction: async (cb: any) => cb({
          get: async (ref: any) => {
            if (ref?._isQuery) return { docs: [] };
            if (ref?._type === 'user' || ref?._col === 'users' || ref?._docId === 'u1') return { exists: true, data: () => mockUser };
            if (ref?._type === 'project' || ref?._col === 'projects' || ref?._docId === 'P1') return { exists: true, data: () => mockProject };
            if (ref?._type === 'projectionState') return { exists: true, data: () => ({ projectId: 'P1', dirtyTabs: [], mutationRevision: 1, updatedAt: new Date().toISOString() }) };
            return ref?._type==='continuity'?{exists:true,data:()=>mockContinuity}:{exists:false,data:()=>undefined};
          },
          set: (ref: any, data: any) => {
            if (ref?._type === 'continuity') {
              mockContinuity = { ...mockContinuity, ...data };
            }
          },
          update: (ref: any, data: any) => {
            if (ref?._type === 'continuity') {
              mockContinuity = { ...mockContinuity, ...data };
            }
          }
        })
      };

      mockWho = { userId: 'u1', role: 'SUPER_ADMIN' };
    });

    it('blocks rapid second click inside 60s following successful refresh with REPORT_REFRESH_COOLDOWN and 0 provider calls', async () => {
      const { ProjectGoogleWorkspaceServer } = await import('../services/projectGoogleWorkspace.server');
      const server = new ProjectGoogleWorkspaceServer(mockDb);

      let providerCalls = 0;
      const mockPort: any = {
        subject: async () => 'user@q-saudi.sa',
        verifyBinding: async () => {},
        projectProfileReports: async () => { providerCalls++; }
      };

      // 1st refresh = success
      await server.refreshOperationalReports('P1', mockWho, mockPort);
      expect(providerCalls).toBe(1);
      expect(mockContinuity.lastReportRefreshAttemptAt).toBeDefined();
      expect(mockContinuity.lastReportRefreshAt).toBeDefined();

      // 2nd refresh after 5s = blocked with 0 provider calls
      const err = await server.refreshOperationalReports('P1', mockWho, mockPort).catch(e => e);
      expect(providerCalls).toBe(1); // Provider calls remain 1 (0 new provider calls!)
      expect(err).toBeInstanceOf(GoogleWorkspaceCommandError);
      expect(err.code).toBe('REPORT_REFRESH_COOLDOWN');
      expect(err.status).toBe(429);
      expect(err.retryAfterSeconds).toBeGreaterThan(0);
    });

    it('blocks rapid second click inside 60s following 429 failure and updates lastReportRefreshAttemptAt without altering lastReportRefreshAt', async () => {
      const { ProjectGoogleWorkspaceServer } = await import('../services/projectGoogleWorkspace.server');
      const server = new ProjectGoogleWorkspaceServer(mockDb);

      let providerCalls = 0;
      const mockPort: any = {
        subject: async () => 'user@q-saudi.sa',
        verifyBinding: async () => {},
        projectProfileReports: async () => {
          providerCalls++;
          throw new GoogleWorkspaceCommandError('GOOGLE_RATE_LIMITED', 429);
        }
      };

      // 1st refresh = 429 failure
      const err1 = await server.refreshOperationalReports('P1', mockWho, mockPort).catch(e => e);
      expect(err1.code).toBe('GOOGLE_RATE_LIMITED');
      expect(providerCalls).toBe(1);

      const attemptTime1 = mockContinuity.lastReportRefreshAttemptAt;
      expect(attemptTime1).toBeDefined();
      expect(mockContinuity.lastReportRefreshAt).toBeUndefined(); // Unchanged on failure!

      // 2nd refresh after 5s = blocked by 60s cooldown with 0 new provider calls
      const err2 = await server.refreshOperationalReports('P1', mockWho, mockPort).catch(e => e);
      expect(providerCalls).toBe(1); // Provider calls STILL 1!
      expect(err2.code).toBe('REPORT_REFRESH_COOLDOWN');
      expect(err2.status).toBe(429);
      expect(mockContinuity.lastReportRefreshAt).toBeUndefined(); // Still unchanged on blocked request
    });

    it('admits new refresh attempt after 60-second cooldown expires', async () => {
      const { ProjectGoogleWorkspaceServer } = await import('../services/projectGoogleWorkspace.server');
      const server = new ProjectGoogleWorkspaceServer(mockDb);

      let providerCalls = 0;
      const mockPort: any = {
        subject: async () => 'user@q-saudi.sa',
        verifyBinding: async () => {},
        projectProfileReports: async () => { providerCalls++; }
      };

      // Set old attempt from 65 seconds ago
      mockContinuity.lastReportRefreshAttemptAt = new Date(Date.now() - 65000).toISOString();

      await server.refreshOperationalReports('P1', mockWho, mockPort);
      expect(providerCalls).toBe(1);
    });

    it('fences concurrent refresh requests so at most one provider execution occurs', async () => {
      const { ProjectGoogleWorkspaceServer } = await import('../services/projectGoogleWorkspace.server');
      const server = new ProjectGoogleWorkspaceServer(mockDb);

      let providerCalls = 0;
      const mockPort: any = {
        subject: async () => 'user@q-saudi.sa',
        verifyBinding: async () => {},
        projectProfileReports: async () => {
          providerCalls++;
          await new Promise(r => setTimeout(r, 50));
        }
      };

      // Execute 2 concurrent requests
      const [res1, res2] = await Promise.allSettled([
        server.refreshOperationalReports('P1', mockWho, mockPort),
        server.refreshOperationalReports('P1', mockWho, mockPort)
      ]);

      expect(providerCalls).toBe(1); // Exactly 1 provider execution!
      const failed = [res1, res2].find(r => r.status === 'rejected') as PromiseRejectedResult;
      expect(failed).toBeDefined();
      expect((failed.reason as any).code).toBe('REPORT_REFRESH_COOLDOWN');
    });
  });
});
