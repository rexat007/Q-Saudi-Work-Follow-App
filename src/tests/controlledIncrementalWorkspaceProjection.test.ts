// @vitest-environment happy-dom
import {describe,it,expect,vi} from 'vitest';
import {useUserActiveWorkspaceSync} from '../hooks/useUserActiveWorkspaceSync';
import {WorkspaceSyncCoordinator} from '../../server/workspaceSyncCoordinator';
import {ProjectGoogleWorkspaceServer} from '../services/projectGoogleWorkspace.server';
import {createCleanProjectionState} from '../services/projectWorkspaceProjectionState.server';
import type {AuthUserContext} from '../types/common';

describe('Controlled Incremental Workspace Projection Architecture Suite', () => {
  describe('1. Client Trigger Retirement (USER_ACTIVE_GLOBAL_SYNC = RETIRED)', () => {
    it('useUserActiveWorkspaceSync does not execute automatic fetch requests on call or activity', () => {
      const fetchSpy = vi.fn();
      vi.stubGlobal('fetch', fetchSpy);
      
      const context: AuthUserContext = { userId: 'admin-1', role: 'SUPER_ADMIN' };
      useUserActiveWorkspaceSync(context);
      
      expect(fetchSpy).not.toHaveBeenCalled();
      
      vi.unstubAllGlobals();
    });

    it('AUTOMATIC_USER_ACTIVE_SYNC_POSTS is strictly 0 across user activity triggers', () => {
      const fetchSpy = vi.fn();
      vi.stubGlobal('fetch', fetchSpy);
      
      useUserActiveWorkspaceSync({ userId: 'admin-1', role: 'SUPER_ADMIN' });
      window.dispatchEvent(new Event('focus'));
      window.dispatchEvent(new Event('online'));
      document.dispatchEvent(new Event('visibilitychange'));
      
      expect(fetchSpy).not.toHaveBeenCalled();
      vi.unstubAllGlobals();
    });
  });

  describe('2. Ordinary Incremental Sync (No Full Trip Scan)', () => {
    it('1 changed Trip in a 1000-Trip Project performs 0 full trip collection reads', async () => {
      let fullCollectionReadCount = 0;
      
      const mockUser = {
        userId: 'user-1',
        email: 'user1@q-saudi.sa',
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
        isActive: true,
        assignedProjectIds: ['PRJ-1000'],
      };

      const mockProject = {
        projectId: 'PRJ-1000',
        projectCode: 'PRJ1000',
        nameAr: 'مشروع اختبار',
        nameEn: 'Test Project',
        ownerUserId: 'user-1',
        status: 'ACTIVE',
        createdAt: '2026-11-03T00:00:00Z',
        updatedAt: '2026-11-03T00:00:00Z',
        createdBy: 'user-1',
        updatedBy: 'user-1',
        settings: { googleSpreadsheetId: 'sheet-123' },
      };

      const mockContinuity = {
        owner: 'test-owner',
        state: 'READY',
        workbookHealth: 'HEALTHY',
        automationState: 'READY',
        backgroundAuthorization: 'CONNECTED',
        lastSuccessfulSyncAt: '2026-11-03T00:00:00Z',
        syncLeaseExpiresAt: Date.now() + 60000,
        syncLeaseRevision: 0,
        syncLeaseSpreadsheetId: 'sheet-123',
        binding: {
          googleSubject: 'admin@q-saudi.sa',
          projectId: 'PRJ-1000',
          spreadsheetId: 'sheet-123',
          revision: 0,
          workspaceBlueprintVersion: 'SABIL-HAIL-V1',
        },
      };

      const mockProjectionState = createCleanProjectionState('PRJ-1000');
      let liveContinuity = { ...mockContinuity };

      const docObj = (type: string) => ({ _type: type, get:async()=>({exists:type==='projectionState',data:()=>type==='projectionState'?mockProjectionState:undefined}) });

      const mockOutboxDocs = [
        {
          id: 'TRP-1000-001-doc',
          data: () => ({
            kind: 'PROFILE_TRIP',
            projectId: 'PRJ-1000',
            tripId: 'TRP-1000-001',
            revision: 1,
            status: 'PENDING',
          }),
        },
      ];

      const mockOutboxQuery = {
        _isQuery: true,
        limit: () => ({
          _isQuery: true,
          get: async () => ({ docs: mockOutboxDocs }),
        }),
        count: () => ({
          get: async () => ({ data: () => ({ count: 0 }) }),
        }),
        get: async () => ({ docs: mockOutboxDocs }),
      };

      const mockDb: any = {
        collection: (name: string) => {
          if (name === 'users') {
            return {
              doc: () => docObj('user'),
            };
          }
          if (name === 'projects') {
            return {
              doc: (projectId: string) => ({
                ...docObj('project'),
                get: async () => ({
                  exists: true,
                  data: () => mockProject,
                }),
                collection: (subName: string) => {
                  if (subName === 'trips') {
                    return {
                      get: async () => {
                        fullCollectionReadCount++;
                        return { docs: [] };
                      },
                      doc: (tripId: string) => ({
                        get: async () => ({
                          exists: true,
                          data: () => ({
                            tripId,
                            tripNumber: 'TRP-1000-001',
                            projectId,
                            carrierId: 'CAR-1',
                            driverId: 'DRV-1',
                            truckId: 'TRK-1',
                            materialId: 'MAT-1',
                            status: 'COMPLETED',
                            createdAt: '2026-11-03T00:00:00Z',
                            operationalSnapshot: { driverNameAr: 'سائق', plateNumberAr: '123' },
                          }),
                        }),
                      }),
                    };
                  }
                  if (subName === 'workspace_continuity') {
                    return {
                      doc: () => docObj('continuity'),
                    };
                  }
                  if (subName === 'workspace_sync_outbox') {
                    return {
                      where: () => mockOutboxQuery,
                      doc: () => ({
                        get: async () => ({
                          data: () => ({ revision: 1 }),
                        }),
                      }),
                    };
                  }
                  if (subName === 'workspace_projection_state') {
                    return {
                      doc: () => docObj('projectionState'),
                    };
                  }
                  return { doc: () => ({ get: async () => ({ exists: false }) }) };
                },
              }),
            };
          }
          return {
            doc: () => docObj('generic'),
          };
        },
        runTransaction: async (cb: any) => cb({
          get: async (ref: any) => {
            if (ref?._isQuery) {
              return { docs: mockOutboxDocs, exists: true, data: () => mockProjectionState };
            }
            if (ref?._type === 'user') return { exists: true, data: () => mockUser };
            if (ref?._type === 'continuity') return { exists: true, data: () => liveContinuity };
            if (ref?._type === 'projectionState') return { exists: true, data: () => mockProjectionState };
            if (ref?._type === 'project') return { exists: true, data: () => mockProject };
            return { exists: true, data: () => mockProject };
          },
          set: (ref: any, data: any) => {
            if (ref?._type === 'continuity') liveContinuity = { ...liveContinuity, ...data };
          },
          update: (ref: any, data: any) => {
            if (ref?._type === 'continuity') liveContinuity = { ...liveContinuity, ...data };
          },
        }),
      };

      const server = new ProjectGoogleWorkspaceServer(mockDb);
      const mockWho: AuthUserContext = { userId: 'user-1', role: 'SUPER_ADMIN' };
      const mockGooglePort: any = {
        subject: async () => 'admin@q-saudi.sa',
        verifyBinding: async () => {},
        projectProfileTrip: async () => {},
      };

      // Execute incremental retrySync
      await server.retrySync('PRJ-1000', mockWho, mockGooglePort, { pendingOnly: true });

      // Verify that NO full collection read of 'trips' was performed!
      expect(fullCollectionReadCount).toBe(0);
    });
  });

  describe('3. Scheduled Worker Filtering & Inactive Project Skipping', () => {
    it('Scheduled worker skips INACTIVE and SETUP projects without Google calls', async () => {
      let googleCalls = 0;
      const mockOffline: any = {
        access: async () => {
          googleCalls++;
          return { authorizationId: 'grant-inactive', accessToken: 'token-1' };
        },
      };

      const mockUser = {
        userId: 'actor-1',
        email: 'actor1@q-saudi.sa',
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
        isActive: true,
        assignedProjectIds: ['PRJ-INACTIVE'],
      };

      const mockInactiveProject = {
        projectId: 'PRJ-INACTIVE',
        projectCode: 'PRJINACTIVE',
        nameAr: 'غير نشط',
        ownerUserId: 'actor-1',
        status: 'SETUP', // Valid non-ACTIVE status (SETUP)
        createdAt: '2026-11-03T00:00:00Z',
        updatedAt: '2026-11-03T00:00:00Z',
        createdBy: 'actor-1',
        updatedBy: 'actor-1',
      };

      const docObj = (type: string) => ({ _type: type });

      const mockGrantDocs = [
        {
          id: 'grant-inactive',
          data: () => ({
            status: 'ACTIVE',
            projectId: 'PRJ-INACTIVE',
            actorId: 'actor-1',
          }),
        },
      ];

      const createQueryMock = (): any => ({
        where: () => createQueryMock(),
        orderBy: () => createQueryMock(),
        startAfter: () => createQueryMock(),
        limit: () => createQueryMock(),
        get: async () => ({
          docs: mockGrantDocs,
        }),
      });

      const mockDb: any = {
        collection: (name: string) => {
          if (name === 'workspace_sync_coordinators') {
            return {
              doc: () => docObj('coordinator'),
            };
          }
          if (name === 'workspace_google_authorizations' || name === 'workspace_google_offline_authorizations') {
            return {
              ...createQueryMock(),
              doc: () => docObj('grant'),
            };
          }
          if (name === 'users') {
            return {
              doc: () => docObj('user'),
            };
          }
          if (name === 'projects') {
            return {
              doc: (id: string) => ({
                ...docObj('project'),
                collection: () => ({
                  doc: () => docObj('continuity'),
                }),
              }),
            };
          }
          return createQueryMock();
        },
        runTransaction: async (cb: any) => {
          return cb({
            get: async (ref: any) => {
              if (ref?._type === 'user') return { exists: true, data: () => mockUser };
              if (ref?._type === 'coordinator') return { exists: false, data: () => ({}) };
              if (ref?._type === 'project') return { exists: true, data: () => mockInactiveProject };
              if (ref?._type === 'continuity') return { exists: true, data: () => ({ backgroundAuthorizationId: 'grant-inactive' }) };
              if (ref?._type === 'grant') return { exists: true, data: () => ({ status: 'ACTIVE', projectId: 'PRJ-INACTIVE', actorId: 'actor-1' }) };
              return { exists: true, data: () => mockInactiveProject };
            },
            set: () => {},
          });
        },
      };

      const coordinator = new WorkspaceSyncCoordinator(mockOffline, mockDb);
      const pass = await coordinator.runScheduled();

      expect(pass.skipped).toBe(1);
      expect(pass.attempted).toBe(0);
      expect(googleCalls).toBe(0); // ZERO Google delivery calls for inactive projects!
    });
  });

  describe('4. Explicit Bounded Report Refresh & Resource Identity Preservation', () => {
    it('Explicit report refresh reads current project trips and calls projectProfileReports without creating new resources', async () => {
      let reportCallCount = 0;
      let projectTripsReadCount = 0;
      let otherProjectTripsReadCount = 0;

      const mockUser = {
        userId: 'user-1',
        email: 'user1@q-saudi.sa',
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
        isActive: true,
        assignedProjectIds: ['PRJ-1000'],
      };

      const testOpConfig: any = {
        schemaVersion: 1,
        loadingMeasurementMode: 'WEIGHBRIDGE',
        unloadingMeasurementMode: 'WEIGHBRIDGE',
        driverIntakeMode: 'PRELOADED_ROSTER',
        routeConfiguration: { loadingLocation: 'موقع التحميل', unloadingLocation: 'موقع التفريغ', distanceKm: 50 },
        shiftConfiguration: { mode: 'NONE' },
        capacityEstimationPolicy: { mode: 'NONE' },
        requiredCheckpoints: ['loadingStartedAt', 'loadingCompletedAt', 'departedAt', 'arrivedAt', 'unloadingStartedAt', 'unloadingCompletedAt'],
      };

      const mockProject = {
        projectId: 'PRJ-1000',
        projectCode: 'PRJ1000',
        nameAr: 'مشروع أ',
        ownerUserId: 'user-1',
        status: 'ACTIVE',
        createdAt: '2026-11-03T00:00:00Z',
        updatedAt: '2026-11-03T00:00:00Z',
        createdBy: 'user-1',
        updatedBy: 'user-1',
        settings: { googleSpreadsheetId: 'sheet-123' },
        operationalConfiguration: testOpConfig,
      };

      let liveContinuity = {
        owner: 'test-owner',
        state: 'READY',
        workbookHealth: 'HEALTHY',
        automationState: 'READY',
        backgroundAuthorization: 'CONNECTED',
        lastSuccessfulSyncAt: '2026-11-03T00:00:00Z',
        syncLeaseExpiresAt: Date.now() + 60000,
        syncLeaseRevision: 0,
        syncLeaseSpreadsheetId: 'sheet-123',
        binding: {
          googleSubject: 'admin@q-saudi.sa',
          projectId: 'PRJ-1000',
          spreadsheetId: 'sheet-123',
          revision: 0,
          workspaceBlueprintVersion: 'SABIL-HAIL-V1',
        },
      };

      const docObj = (type: string) => ({ _type: type, get:async()=>({exists:type==='projectionState',data:()=>type==='projectionState'?mockProjectionState:undefined}) });
      const mockProjectionState = createCleanProjectionState('PRJ-1000');
      const mockOutboxQuery = {
        _isQuery: true,
        limit: () => ({ _isQuery: true, get: async () => ({ docs: [] }) }),
        count: () => ({ get: async () => ({ data: () => ({ count: 0 }) }) }),
        get: async () => ({ docs: [] }),
      };

      const mockDb: any = {
        collection: (name: string) => {
          if (name === 'users') return { doc: () => docObj('user') };
          if (name === 'projects') {
            return {
              doc: (id: string) => ({
                ...docObj('project'),
                collection: (subName: string) => {
                  if (subName === 'trips') {
                    return {
                      get: async () => {
                        if (id === 'PRJ-1000') projectTripsReadCount++;
                        else otherProjectTripsReadCount++;
                        return {
                          docs: [
                            {
                              id: 'TRP-1000-001',
                              data: () => ({
                                tripId: 'TRP-1000-001',
                                tripNumber: 'TRP-1000-001',
                                projectId: 'PRJ-1000',
                                carrierId: 'CAR-1',
                                driverId: 'DRV-1',
                                truckId: 'TRK-1',
                                materialId: 'MAT-1',
                                status: 'COMPLETED',
                                createdAt: '2026-11-03T00:00:00Z',
                                updatedAt: '2026-11-03T00:00:00Z',
                                operationalSnapshot: { driverNameAr: 'سائق', plateNumberAr: '123', configuration: testOpConfig },
                                weights: { originNetKg: 30000, destinationNetKg: 29800 },
                              }),
                            },
                          ],
                        };
                      },
                    };
                  }
                  if (subName === 'workspace_continuity') return { doc: () => docObj('continuity') };
                  if (subName === 'workspace_sync_outbox') return { where: () => mockOutboxQuery, doc: () => docObj('generic') };
                  if (subName === 'workspace_projection_state') return { doc: () => docObj('projectionState') };
                  return { doc: () => docObj('generic') };
                },
              }),
            };
          }
          return { doc: () => docObj('generic') };
        },
        runTransaction: async (cb: any) => cb({
          get: async (ref: any) => {
            if (ref?._isQuery) return { docs: [], exists: true, data: () => mockProjectionState };
            if (ref?._type === 'user') return { exists: true, data: () => mockUser };
            if (ref?._type === 'continuity') return { exists: true, data: () => liveContinuity };
            if (ref?._type === 'projectionState') return { exists: true, data: () => mockProjectionState };
            if (ref?._type === 'project') return { exists: true, data: () => mockProject };
            return { exists: true, data: () => mockProject };
          },
          set: (ref: any, data: any) => {
            if (ref?._type === 'continuity') liveContinuity = { ...liveContinuity, ...data };
          },
          update: (ref: any, data: any) => {
            if (ref?._type === 'continuity') liveContinuity = { ...liveContinuity, ...data };
          },
        }),
      };

      const server = new ProjectGoogleWorkspaceServer(mockDb);
      const mockWho: AuthUserContext = { userId: 'user-1', role: 'SUPER_ADMIN' };
      const mockGooglePort: any = {
        subject: async () => 'admin@q-saudi.sa',
        verifyBinding: async () => {},
        projectProfileReports: async () => {
          reportCallCount++;
        },
      };

      // Execute explicit report refresh
      await server.refreshOperationalReports('PRJ-1000', mockWho, mockGooglePort);

      expect(reportCallCount).toBe(1);
      expect(projectTripsReadCount).toBe(1);
      expect(otherProjectTripsReadCount).toBe(0); // Project-scoped: no reads for other projects!
      expect(liveContinuity.binding.spreadsheetId).toBe('sheet-123'); // Resource identity preserved!
    });
  });
});
