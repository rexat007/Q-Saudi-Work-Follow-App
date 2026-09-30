import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { clientWorkspaceService } from '../services/workspace.service';
import { auth } from '../firebase/config';
import { getGoogleAccessToken, resolveWorkspaceErrorStatusCode } from '../../server/app';
import { authenticateUser, enforceProjectIsolation, enforceAdminOnly, enforceDispatcherOrAbove } from '../../server/security.middleware';
import fs from 'fs';
import path from 'path';

describe('Project Google Workspace Dual-Token Auth Boundary Convergence (Unit 3) Tests', () => {
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
  });

  // Test 1: Authorization header contains Firebase ID token, not Google token
  it('1. Authorization header contains Firebase ID token, not Google token', async () => {
    const mockFirebaseIdToken = 'firebase-token-sample-12345';
    const mockGoogleOAuthToken = 'google-oauth-access-token-99999';

    Object.defineProperty(auth, 'currentUser', {
      value: {
        getIdToken: async () => mockFirebaseIdToken,
      },
      configurable: true,
      writable: true,
    });

    clientWorkspaceService.setAccessToken(mockGoogleOAuthToken);
    const headers = await clientWorkspaceService.getWorkspaceHeaders();

    expect(headers['Authorization']).toBe(`Bearer ${mockFirebaseIdToken}`);
    expect(headers['Authorization']).not.toBe(`Bearer ${mockGoogleOAuthToken}`);
  });

  // Test 2: Google token is sent using X-Google-Access-Token
  it('2. Google token is sent using X-Google-Access-Token', async () => {
    const mockGoogleOAuthToken = 'ya29.sample_google_oauth_token';

    Object.defineProperty(auth, 'currentUser', {
      value: {
        getIdToken: async () => 'fb-id-tok',
      },
      configurable: true,
      writable: true,
    });

    clientWorkspaceService.setAccessToken(mockGoogleOAuthToken);
    const headers = await clientWorkspaceService.getWorkspaceHeaders();

    expect(headers['X-Google-Access-Token']).toBe(mockGoogleOAuthToken);
  });

  // Test 3: Google token is never substituted for Firebase ID token
  it('3. Google token is never substituted for Firebase ID token', async () => {
    Object.defineProperty(auth, 'currentUser', {
      value: null,
      configurable: true,
      writable: true,
    });

    clientWorkspaceService.setAccessToken('google-oauth-standalone-token');

    // With requireAuth = false (e.g. unauthenticated probe)
    const headers = await clientWorkspaceService.getWorkspaceHeaders({}, false);

    expect(headers['Authorization']).toBeUndefined();
    expect(headers['X-Google-Access-Token']).toBe('google-oauth-standalone-token');
  });

  // Test 4: protected Workspace request fails closed if Firebase user/token is unavailable
  it('4. protected Workspace request fails closed if Firebase user/token is unavailable', async () => {
    Object.defineProperty(auth, 'currentUser', {
      value: null,
      configurable: true,
      writable: true,
    });

    await expect(clientWorkspaceService.getWorkspaceHeaders({}, true)).rejects.toThrow(
      /Firebase Authentication required/
    );

    // Also verify when getIdToken throws
    Object.defineProperty(auth, 'currentUser', {
      value: {
        getIdToken: async () => {
          throw new Error('Network failure refreshing Firebase ID token');
        },
      },
      configurable: true,
      writable: true,
    });

    await expect(clientWorkspaceService.getWorkspaceHeaders({}, true)).rejects.toThrow(
      /Network failure refreshing Firebase ID token/
    );
  });

  // Test 5: server workspace route reads Google token from X-Google-Access-Token
  it('5. server workspace route reads Google token from X-Google-Access-Token', () => {
    const reqString = {
      headers: {
        'x-google-access-token': 'ya29.live_server_google_token',
      },
    } as any;

    expect(getGoogleAccessToken(reqString)).toBe('ya29.live_server_google_token');

    const reqArray = {
      headers: {
        'x-google-access-token': ['token_element_zero', 'token_element_one'],
      },
    } as any;

    expect(getGoogleAccessToken(reqArray)).toBe('token_element_zero');
  });

  // Test 6: server route does NOT use req.headers.authorization as Google credential
  it('6. server route does NOT use req.headers.authorization as Google credential', () => {
    const reqWithOnlyAuth = {
      headers: {
        authorization: 'Bearer firebase-app-token-only',
      },
    } as any;

    expect(getGoogleAccessToken(reqWithOnlyAuth)).toBeUndefined();
  });

  // Test 7: authenticateUser behavior is unchanged
  it('7. authenticateUser behavior is unchanged: requires Authorization Bearer token', async () => {
    // If request only has x-google-access-token without Authorization Bearer
    const req = {
      headers: {
        'x-google-access-token': 'google-token-only',
      },
    } as any;

    let statusCode = 0;
    let responseBody: any = {};
    const res = {
      status: (code: number) => {
        statusCode = code;
        return res;
      },
      json: (body: any) => {
        responseBody = body;
        return res;
      },
    } as any;

    let nextCalled = false;
    await authenticateUser(req, res, () => {
      nextCalled = true;
    });

    expect(statusCode).toBe(401);
    expect(responseBody.code).toBe('UNAUTHORIZED_ACCESS');
    expect(nextCalled).toBe(false);
  });

  // Test 8: RBAC/project-isolation middleware remains unchanged
  it('8. RBAC/project-isolation middleware remains unchanged and active', () => {
    expect(typeof enforceProjectIsolation).toBe('function');
    expect(typeof enforceAdminOnly).toBe('function');
    expect(typeof enforceDispatcherOrAbove).toBe('function');

    const securityMiddlewarePath = path.resolve(__dirname, '../../server/security.middleware.ts');
    const content = fs.readFileSync(securityMiddlewarePath, 'utf-8');
    expect(content).toContain('export async function authenticateUser');
    expect(content).toContain('export function enforceProjectIsolation');
    expect(content).toContain('export const enforceAdminOnly');
    expect(content).toContain('export const enforceDispatcherOrAbove');
  });

  // Test 9: non-production mock Google token uses X-Google-Access-Token only
  it('9. non-production mock Google token uses X-Google-Access-Token only', async () => {
    const mockToken = 'mock_oauth_token_dev_1720000000000';
    clientWorkspaceService.setAccessToken(mockToken);

    Object.defineProperty(auth, 'currentUser', {
      value: {
        getIdToken: async () => 'test-firebase-token-777',
      },
      configurable: true,
      writable: true,
    });

    const headers = await clientWorkspaceService.getWorkspaceHeaders();
    expect(headers['X-Google-Access-Token']).toBe(mockToken);
    expect(headers['Authorization']).toBe('Bearer test-firebase-token-777');
    expect(headers['Authorization']).not.toContain(mockToken);
  });

  // Test 10: Fleet sync/reconciliation still uses server-authoritative ProjectFleetReadModel
  it('10. Fleet sync/reconciliation still uses server-authoritative ProjectFleetReadModel', () => {
    const appTsPath = path.resolve(__dirname, '../../server/app.ts');
    const appTsContent = fs.readFileSync(appTsPath, 'utf-8');

    expect(appTsContent).toContain('projectFleetReadModelService.getProjectFleetReadModel');
    expect(appTsContent).toContain('serverWorkspaceService.reconcileTabSnapshot');
    expect(appTsContent).not.toContain('req.body.fleetRoster');
  });

  // Test 11: no activation hook was added
  it('11. no activation hook was added', () => {
    const workspaceClientPath = path.resolve(__dirname, '../services/workspace.service.ts');
    const workspaceClientContent = fs.readFileSync(workspaceClientPath, 'utf-8');
    expect(workspaceClientContent).not.toContain('projectActivationService');
    expect(workspaceClientContent).not.toContain('activateProject');
  });

  // Test 12: no continuous mutation sync was added
  it('12. no continuous mutation sync was added', () => {
    const workspaceClientPath = path.resolve(__dirname, '../services/workspace.service.ts');
    const workspaceClientContent = fs.readFileSync(workspaceClientPath, 'utf-8');
    expect(workspaceClientContent).not.toContain('setInterval');
    expect(workspaceClientContent).not.toContain('onSnapshot');
  });

  // Test 13: GOOGLE_ACCESS_TOKEN_REQUIRED propagates HTTP 401
  it('13. GOOGLE_ACCESS_TOKEN_REQUIRED propagates HTTP 401', () => {
    const originalEnv = process.env.NODE_ENV;
    try {
      process.env.NODE_ENV = 'production';
      let caughtError: any;
      try {
        getGoogleAccessToken({ headers: {} } as any, true);
      } catch (err) {
        caughtError = err;
      }

      expect(caughtError).toBeDefined();
      expect(caughtError.code).toBe('GOOGLE_ACCESS_TOKEN_REQUIRED');
      expect(caughtError.statusCode).toBe(401);

      // Verify status code resolution helper resolves 401
      const resolved = resolveWorkspaceErrorStatusCode(caughtError);
      expect(resolved).toBe(401);
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });

  // Test 14: ordinary unexpected Workspace errors still default to HTTP 500
  it('14. ordinary unexpected Workspace errors still default to HTTP 500', () => {
    const unexpectedError = new Error('Unexpected Google API failure or socket hang up');
    expect(resolveWorkspaceErrorStatusCode(unexpectedError)).toBe(500);

    const emptyError = {};
    expect(resolveWorkspaceErrorStatusCode(emptyError)).toBe(500);

    expect(resolveWorkspaceErrorStatusCode(null)).toBe(500);
    expect(resolveWorkspaceErrorStatusCode(undefined)).toBe(500);
  });

  // Test 15: invalid statusCode values do not escape the safe 400–599 range
  it('15. invalid statusCode values do not escape the safe 400–599 range', () => {
    // 2xx success codes must not be returned by error handler
    expect(resolveWorkspaceErrorStatusCode({ statusCode: 200 })).toBe(500);
    expect(resolveWorkspaceErrorStatusCode({ statusCode: 204 })).toBe(500);
    // 3xx redirects
    expect(resolveWorkspaceErrorStatusCode({ statusCode: 302 })).toBe(500);
    // Out of HTTP range
    expect(resolveWorkspaceErrorStatusCode({ statusCode: 600 })).toBe(500);
    expect(resolveWorkspaceErrorStatusCode({ statusCode: -1 })).toBe(500);
    expect(resolveWorkspaceErrorStatusCode({ statusCode: 0 })).toBe(500);
    expect(resolveWorkspaceErrorStatusCode({ statusCode: '401' })).toBe(500);

    // Valid 4xx and 5xx codes must be preserved
    expect(resolveWorkspaceErrorStatusCode({ statusCode: 400 })).toBe(400);
    expect(resolveWorkspaceErrorStatusCode({ statusCode: 401 })).toBe(401);
    expect(resolveWorkspaceErrorStatusCode({ statusCode: 403 })).toBe(403);
    expect(resolveWorkspaceErrorStatusCode({ statusCode: 404 })).toBe(404);
    expect(resolveWorkspaceErrorStatusCode({ statusCode: 429 })).toBe(429);
    expect(resolveWorkspaceErrorStatusCode({ statusCode: 502 })).toBe(502);
    expect(resolveWorkspaceErrorStatusCode({ statusCode: 503 })).toBe(503);
  });

  // Test 16: no Workspace route reverts to using req.headers.authorization as Google credential
  it('16. no Workspace route reverts to using req.headers.authorization as Google credential', () => {
    const appTsPath = path.resolve(__dirname, '../../server/app.ts');
    const appTsContent = fs.readFileSync(appTsPath, 'utf-8');

    // All workspace routes must extract Google token exclusively through getGoogleAccessToken
    const workspaceEndpoints = [
      '/api/workspace/provision',
      '/api/workspace/sync/trips',
      '/api/workspace/sync/sheets',
      '/api/workspace/upload',
      '/api/workspace/drive/files',
      '/api/workspace/validate-destination',
      '/api/workspace/migrate/start',
      '/api/workspace/archive/download',
      '/api/workspace/drive/files/:fileId/content',
      '/api/workspace/sheets/spreadsheets',
      '/api/workspace/sheets/:spreadsheetId/metadata',
      '/api/workspace/sheets/:spreadsheetId/values',
    ];

    for (const endpoint of workspaceEndpoints) {
      expect(appTsContent).toContain(endpoint);
    }

    // Verify req.headers.authorization is never passed as Google credential to serverWorkspaceService
    const regex = /serverWorkspaceService\.[a-zA-Z]+\([^)]*req\.headers\.authorization[^)]*\)/;
    expect(regex.test(appTsContent)).toBe(false);
  });

  // Test 17: dual-token separation remains intact
  it('17. dual-token separation remains intact across client and server boundaries', async () => {
    Object.defineProperty(auth, 'currentUser', {
      value: {
        getIdToken: async () => 'test-firebase-id-token-999',
      },
      configurable: true,
      writable: true,
    });
    clientWorkspaceService.setAccessToken('test-google-oauth-token-888');

    const headers = await clientWorkspaceService.getWorkspaceHeaders();

    expect(headers['Authorization']).toBe('Bearer test-firebase-id-token-999');
    expect(headers['X-Google-Access-Token']).toBe('test-google-oauth-token-888');
    expect(headers['Authorization']).not.toContain('test-google-oauth-token-888');
    expect(headers['X-Google-Access-Token']).not.toContain('test-firebase-id-token-999');
  });
});
