import { describe, it, expect, vi } from 'vitest';
import { isFirestoreQuotaError, isFirestoreTransientError } from '../../server/security.middleware';
import { ProjectFleetQueryService } from '../services/projectFleetQuery.server';
import { ProjectReadinessAdminReadContext } from '../services/projectReadiness.server';

describe('Firestore Quota Exhaustion & Read Amplification Remediation', () => {
  it('detects gRPC code 8 and RESOURCE_EXHAUSTED as quota error', () => {
    expect(isFirestoreQuotaError({ code: 8 })).toBe(true);
    expect(isFirestoreQuotaError({ code: '8' })).toBe(true);
    expect(isFirestoreQuotaError({ code: 'RESOURCE_EXHAUSTED' })).toBe(true);
    expect(isFirestoreQuotaError({ code: 'resource-exhausted' })).toBe(true);
    expect(isFirestoreQuotaError({ message: '8 RESOURCE_EXHAUSTED: Quota exceeded for project' })).toBe(true);
    expect(isFirestoreQuotaError({ details: 'Quota exceeded for quota metric' })).toBe(true);

    expect(isFirestoreQuotaError({ code: 'auth/id-token-expired' })).toBe(false);
    expect(isFirestoreQuotaError({ code: 'UNAUTHORIZED' })).toBe(false);
    expect(isFirestoreQuotaError(null)).toBe(false);
  });

  it('detects code 14 / unavailable and code 4 / deadline-exceeded as transient error', () => {
    expect(isFirestoreTransientError({ code: 14 })).toBe(true);
    expect(isFirestoreTransientError({ code: '14' })).toBe(true);
    expect(isFirestoreTransientError({ code: 'unavailable' })).toBe(true);
    expect(isFirestoreTransientError({ code: 'UNAVAILABLE' })).toBe(true);
    expect(isFirestoreTransientError({ code: 4 })).toBe(true);
    expect(isFirestoreTransientError({ code: '4' })).toBe(true);
    expect(isFirestoreTransientError({ code: 'deadline-exceeded' })).toBe(true);
    expect(isFirestoreTransientError({ code: 'DEADLINE_EXCEEDED' })).toBe(true);

    expect(isFirestoreTransientError({ code: 8 })).toBe(false);
    expect(isFirestoreTransientError({ code: 'INVALID_TOKEN' })).toBe(false);
  });

  it('ProjectReadinessAdminReadContext reuses cachedProject and eliminates redundant Firestore read', async () => {
    const cachedProject: any = {
      projectId: 'PRJ-NEOM-01',
      nameAr: 'مشروع نيوم',
      code: 'PRJ-NEOM-01',
      status: 'PLANNING'
    };

    let readCount = 0;
    const reader = vi.fn(async () => {
      readCount++;
      return { exists: true, data: () => cachedProject };
    });

    const ctxWithCache = new ProjectReadinessAdminReadContext(null, reader, cachedProject);
    const p1 = await ctxWithCache.getProject('PRJ-NEOM-01');
    expect(p1).toEqual(cachedProject);
    expect(readCount).toBe(0); // 0 reads because cachedProject was returned directly

    const ctxWithoutCache = new ProjectReadinessAdminReadContext(null, reader);
    const p2 = await ctxWithoutCache.getProject('PRJ-NEOM-01');
    expect(p2).toBeDefined();
    expect(readCount).toBe(1); // 1 read because no cache was provided
  });

  it('foundation reads project document only once during authorization and reuses it', async () => {
    const projectData = {
      projectId: 'PRJ-NEOM-01',
      nameAr: 'مشروع نيوم',
      code: 'PRJ-NEOM-01',
      status: 'PLANNING'
    };

    let projectReadCount = 0;
    let userReadCount = 0;

    const mockDb: any = {
      collection(colName: string) {
        return {
          doc(id: string) {
            return {
              colName,
              id,
              collection(subCol: string) {
                return {
                  doc(subId: string) {
                    return { subCol, subId };
                  },
                  where() {
                    return {
                      get: async () => ({ docs: [] })
                    };
                  }
                };
              }
            };
          }
        };
      },
      runTransaction: async (fn: any) => {
        const tx = {
          get: async (ref: any) => {
            if (ref?.colName === 'users') {
              userReadCount++;
              return {
                exists: true,
                data: () => ({
                  userId: 'USR-ADMIN',
                  role: 'PROJECT_ADMIN',
                  status: 'ACTIVE',
                  isActive: true,
                  assignedProjectIds: ['PRJ-NEOM-01']
                })
              };
            }
            if (ref?.colName === 'projects' && !ref?.subCol) {
              projectReadCount++;
              return {
                exists: true,
                data: () => projectData
              };
            }
            // For subcollections or other references
            return {
              exists: true,
              docs: [],
              data: () => ({})
            };
          }
        };
        return fn(tx);
      }
    };

    const service = new ProjectFleetQueryService(mockDb);
    const result = await service.foundation('PRJ-NEOM-01', { userId: 'USR-ADMIN' });

    expect(result.projectId).toBe('PRJ-NEOM-01');
    expect(userReadCount).toBe(1);
    // Project document must be read exactly once in authorize and reused
    expect(projectReadCount).toBe(1);
  });
});
