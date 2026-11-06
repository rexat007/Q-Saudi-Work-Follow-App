import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { auth } from '../firebase/config';
import { importSessionClientService } from '../services/importSessionClient.service';

vi.mock('../firebase/config', () => ({
  auth: {
    currentUser: null,
  },
}));

describe('Smart Import Durable Execution — Client Auth Recovery & Transport Assurance', () => {
  const originalFetch = globalThis.fetch;
  let mockGetIdToken: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.restoreAllMocks();
    mockGetIdToken = vi.fn().mockImplementation(async (forceRefresh?: boolean) => {
      return forceRefresh ? 'fresh_reloaded_token_456' : 'stale_initial_token_123';
    });

    (auth as any).currentUser = {
      uid: 'user-pilot-1',
      getIdToken: mockGetIdToken,
    };
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('Scenario A: Execution status handles 401 TOKEN_EXPIRED -> calls getIdToken(true) once -> replays once with fresh token -> 200', async () => {
    const fetchHistory: { url: string; authHeader: string; method: string }[] = [];

    globalThis.fetch = vi.fn().mockImplementation(async (url: string, init: any) => {
      fetchHistory.push({
        url,
        authHeader: init.headers['Authorization'],
        method: init.method || 'GET',
      });

      if (fetchHistory.length === 1) {
        return {
          ok: false,
          status: 401,
          json: async () => ({ success: false, code: 'TOKEN_EXPIRED', error: 'Token expired' }),
        };
      }

      return {
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: {
            operation: {
              importSessionId: 'ses-alpha',
              state: 'RUNNING',
            },
            retryAllowed: true,
            reviewRequired: false,
            completed: [],
            remaining: [],
          },
        }),
      };
    });

    const status = await importSessionClientService.getExecutionStatus('PRJ-011', 'ses-alpha');

    expect(status.operation.state).toBe('RUNNING');

    expect(fetchHistory).toHaveLength(2);
    expect(fetchHistory[0].url).toContain('/api/projects/PRJ-011/import-sessions/ses-alpha/execution');
    expect(fetchHistory[0].method).toBe('GET');
    expect(fetchHistory[0].authHeader).toBe('Bearer stale_initial_token_123');

    expect(fetchHistory[1].url).toContain('/api/projects/PRJ-011/import-sessions/ses-alpha/execution');
    expect(fetchHistory[1].method).toBe('GET');
    expect(fetchHistory[1].authHeader).toBe('Bearer fresh_reloaded_token_456');

    expect(mockGetIdToken).toHaveBeenCalledTimes(2);
    expect(mockGetIdToken).toHaveBeenNthCalledWith(1);
    expect(mockGetIdToken).toHaveBeenNthCalledWith(2, true);
  });

  it('Scenario B: Execution retry handles 401 TOKEN_EXPIRED -> refreshes token once -> replays with exact expectedOperationVersion', async () => {
    const fetchHistory: { url: string; authHeader: string; method: string; body: any }[] = [];

    globalThis.fetch = vi.fn().mockImplementation(async (url: string, init: any) => {
      fetchHistory.push({
        url,
        authHeader: init.headers['Authorization'],
        method: init.method,
        body: init.body ? JSON.parse(init.body) : null,
      });

      if (fetchHistory.length === 1) {
        return {
          ok: false,
          status: 401,
          json: async () => ({ success: false, code: 'TOKEN_EXPIRED', error: 'Token expired' }),
        };
      }

      return {
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: {
            operation: {
              importSessionId: 'ses-alpha',
              state: 'RUNNING',
              version: 4,
            },
            retryAllowed: true,
            reviewRequired: false,
            completed: [],
            remaining: [],
          },
        }),
      };
    });

    const result = await importSessionClientService.retryExecution('PRJ-011', 'ses-alpha', 3);

    expect(result.operation.version).toBe(4);
    expect(fetchHistory).toHaveLength(2);
    expect(fetchHistory[0].url).toContain('/execution/retry');
    expect(fetchHistory[0].method).toBe('POST');
    expect(fetchHistory[0].authHeader).toBe('Bearer stale_initial_token_123');
    expect(fetchHistory[0].body).toEqual({ expectedOperationVersion: 3 });

    expect(fetchHistory[1].url).toContain('/execution/retry');
    expect(fetchHistory[1].method).toBe('POST');
    expect(fetchHistory[1].authHeader).toBe('Bearer fresh_reloaded_token_456');
    expect(fetchHistory[1].body).toEqual({ expectedOperationVersion: 3 });

    expect(mockGetIdToken).toHaveBeenCalledTimes(2);
    expect(mockGetIdToken).toHaveBeenLastCalledWith(true);
  });

  it('Scenario C: Invalid cached token (401 INVALID_TOKEN) refreshes at most once; second 401 propagates without loop', async () => {
    const fetchHistory: { url: string; authHeader: string }[] = [];

    globalThis.fetch = vi.fn().mockImplementation(async (url: string, init: any) => {
      fetchHistory.push({
        url,
        authHeader: init.headers['Authorization'],
      });

      return {
        ok: false,
        status: 401,
        json: async () => ({ success: false, code: 'INVALID_TOKEN', error: 'Invalid token signature' }),
      };
    });

    await expect(
      importSessionClientService.getExecutionStatus('PRJ-011', 'ses-alpha')
    ).rejects.toMatchObject({
      code: 'INVALID_TOKEN',
    });

    // Exactly 2 attempts: original + 1 refresh replay. Never an infinite loop.
    expect(fetchHistory).toHaveLength(2);
    expect(fetchHistory[0].authHeader).toBe('Bearer stale_initial_token_123');
    expect(fetchHistory[1].authHeader).toBe('Bearer fresh_reloaded_token_456');
    expect(mockGetIdToken).toHaveBeenCalledTimes(2);
    expect(mockGetIdToken).toHaveBeenLastCalledWith(true);
  });

  it.each([
    ['TOKEN_REVOKED'],
    ['IDENTITY_DISABLED'],
    ['USER_NOT_FOUND'],
    ['UNAUTHORIZED_ACCESS'],
  ])('Scenario D: Non-refreshable 401 code %s triggers 0 refreshes and 0 replays', async (nonRefreshableCode) => {
    let callCount = 0;

    globalThis.fetch = vi.fn().mockImplementation(async () => {
      callCount++;
      return {
        ok: false,
        status: 401,
        json: async () => ({ success: false, code: nonRefreshableCode, error: `Denied: ${nonRefreshableCode}` }),
      };
    });

    await expect(
      importSessionClientService.getExecutionStatus('PRJ-011', 'ses-alpha')
    ).rejects.toMatchObject({
      code: nonRefreshableCode,
    });

    expect(callCount).toBe(1);
    expect(mockGetIdToken).toHaveBeenCalledTimes(1);
    expect(mockGetIdToken).not.toHaveBeenCalledWith(true);
  });

  it('Scenario E: 503 SERVICE_UNAVAILABLE triggers 0 token refreshes and 0 transport replays', async () => {
    let callCount = 0;

    globalThis.fetch = vi.fn().mockImplementation(async () => {
      callCount++;
      return {
        ok: false,
        status: 503,
        json: async () => ({ success: false, code: 'SERVICE_UNAVAILABLE', error: 'Authority unavailable' }),
      };
    });

    await expect(
      importSessionClientService.getExecutionStatus('PRJ-011', 'ses-alpha')
    ).rejects.toMatchObject({
      code: 'SERVICE_UNAVAILABLE',
    });

    expect(callCount).toBe(1);
    expect(mockGetIdToken).toHaveBeenCalledTimes(1);
    expect(mockGetIdToken).not.toHaveBeenCalledWith(true);
  });

  it('Scenario F: commitReviewedIntent client timeout / AbortError triggers 0 replays; error propagates for durable status recovery', async () => {
    let commitCalls = 0;

    globalThis.fetch = vi.fn().mockImplementation(async () => {
      commitCalls++;
      const abortError = new DOMException('The operation was aborted due to timeout', 'TimeoutError');
      throw abortError;
    });

    await expect(
      importSessionClientService.commitReviewedIntent('PRJ-011', 'ses-alpha', 1)
    ).rejects.toThrow('The operation was aborted due to timeout');

    // Crucial: commit-reviewed-intent MUST NOT be replayed on timeout!
    expect(commitCalls).toBe(1);
    expect(mockGetIdToken).toHaveBeenCalledTimes(1);
    expect(mockGetIdToken).not.toHaveBeenCalledWith(true);
  });

  it('Scenario G: commitReviewedIntent actual 401 TOKEN_EXPIRED executes exactly 1 forced refresh and 1 replay', async () => {
    const fetchHistory: { url: string; authHeader: string; body: any }[] = [];

    globalThis.fetch = vi.fn().mockImplementation(async (url: string, init: any) => {
      fetchHistory.push({
        url,
        authHeader: init.headers['Authorization'],
        body: JSON.parse(init.body),
      });

      if (fetchHistory.length === 1) {
        return {
          ok: false,
          status: 401,
          json: async () => ({ success: false, code: 'TOKEN_EXPIRED', error: 'Token expired' }),
        };
      }

      return {
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: {
            commitReceiptId: 'rcpt-123',
            operationId: 'op-123',
            authoritativeVersion: 2,
          },
        }),
      };
    });

    const result = await importSessionClientService.commitReviewedIntent('PRJ-011', 'ses-alpha', 1);

    expect(result).toEqual({
      commitReceiptId: 'rcpt-123',
      operationId: 'op-123',
      authoritativeVersion: 2,
    });

    expect(fetchHistory).toHaveLength(2);
    expect(fetchHistory[0].url).toContain('/commit-reviewed-intent');
    expect(fetchHistory[0].authHeader).toBe('Bearer stale_initial_token_123');
    expect(fetchHistory[0].body).toEqual({ expectedVersion: 1 });

    expect(fetchHistory[1].url).toContain('/commit-reviewed-intent');
    expect(fetchHistory[1].authHeader).toBe('Bearer fresh_reloaded_token_456');
    expect(fetchHistory[1].body).toEqual({ expectedVersion: 1 });

    expect(mockGetIdToken).toHaveBeenCalledTimes(2);
    expect(mockGetIdToken).toHaveBeenLastCalledWith(true);
  });

  it('cancelExecution also recovers on 401 TOKEN_EXPIRED with 1 forced refresh and 1 replay', async () => {
    const fetchHistory: { url: string; authHeader: string; method: string }[] = [];

    globalThis.fetch = vi.fn().mockImplementation(async (url: string, init: any) => {
      fetchHistory.push({
        url,
        authHeader: init.headers['Authorization'],
        method: init.method,
      });

      if (fetchHistory.length === 1) {
        return {
          ok: false,
          status: 401,
          json: async () => ({ success: false, code: 'TOKEN_EXPIRED' }),
        };
      }

      return {
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: {
            operation: {
              importSessionId: 'ses-alpha',
              state: 'CANCELLED',
            },
            retryAllowed: false,
            reviewRequired: false,
            completed: [],
            remaining: [],
          },
        }),
      };
    });

    const res = await importSessionClientService.cancelExecution('PRJ-011', 'ses-alpha', 2);
    expect(res.operation.state).toBe('CANCELLED');
    expect(fetchHistory).toHaveLength(2);
    expect(fetchHistory[0].url).toContain('/execution/cancel');
    expect(fetchHistory[1].authHeader).toBe('Bearer fresh_reloaded_token_456');
    expect(mockGetIdToken).toHaveBeenCalledTimes(2);
    expect(mockGetIdToken).toHaveBeenLastCalledWith(true);
  });

  it('updateCheckpoint also recovers on 401 TOKEN_EXPIRED with 1 forced refresh and 1 replay', async () => {
    let callCount = 0;

    globalThis.fetch = vi.fn().mockImplementation(async () => {
      callCount++;
      if (callCount === 1) {
        return {
          ok: false,
          status: 401,
          json: async () => ({ success: false, code: 'TOKEN_EXPIRED' }),
        };
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: {
            importSessionId: 'ses-alpha',
            version: 2,
          },
        }),
      };
    });

    const res = await importSessionClientService.updateCheckpoint('PRJ-011', 'ses-alpha', {}, 1);
    expect(res.version).toBe(2);
    expect(callCount).toBe(2);
    expect(mockGetIdToken).toHaveBeenCalledTimes(2);
    expect(mockGetIdToken).toHaveBeenLastCalledWith(true);
  });
});
