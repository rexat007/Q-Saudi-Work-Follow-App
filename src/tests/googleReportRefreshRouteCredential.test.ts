import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import http from 'node:http';
import type { AddressInfo } from 'node:net';

const f = vi.hoisted(() => ({
  status: vi.fn(),
  access: vi.fn(),
  blueprintPort: vi.fn(),
  refreshOperationalReports: vi.fn(),
}));

vi.mock('../../server/security.middleware', () => {
  const pass = (_req: any, _res: any, next: any) => next();
  return {
    authenticateUser: (req: any, _res: any, next: any) => {
      if (req.headers.authorization !== 'Bearer fixture-firebase') return _res.status(401).end();
      req.user = { userId: 'actor', role: 'SUPER_ADMIN', assignedProjectIds: ['P1'] };
      next();
    },
    enforceProjectIsolation: pass,
    enforceTripSupervisorRestrictions: pass,
    enforceTruckCarrierIntegrity: pass,
    enforceIdempotency: pass,
    enforceFileUploadSecurity: pass,
    enforceRole: () => pass,
    enforceAdminOnly: pass,
    enforceAuditorOrAdmin: pass,
    enforceDispatcherOrAbove: pass,
    enforceWeighbridgeUnloadIntegrity: pass,
  };
});

vi.mock('../../server/runtimeVersion', () => ({
  runtimeVersionHandler: (_q: any, r: any) => r.json({}),
  workspaceGenerationFence: (_q: any, _r: any, next: any) => next(),
}));

vi.mock('../../server/workspaceSyncWorker', () => ({
  workspaceOfflineAuthorization: { access: f.access },
  workspaceSyncCoordinator: {},
}));

vi.mock('../../server/projectGoogleBlueprint.adapter', () => ({
  projectGoogleBlueprintPort: f.blueprintPort,
}));

vi.mock('../../server/projectGoogleTemplate.adapter', () => ({
  projectGoogleTemplatePort: vi.fn(),
}));

vi.mock('../services/projectGoogleWorkspace.server', async original => {
  const actual = await original<any>();
  return {
    ...actual,
    projectGoogleWorkspaceServer: {
      status: f.status,
      refreshOperationalReports: f.refreshOperationalReports,
    },
  };
});

vi.mock('../../server/workspace.isolation', async original => ({
  ...await original<any>(),
  strictWorkspaceProject: (_req: any, res: any, next: any) => next(),
  WorkspaceStorageBoundary: class {
    async project() { return { projectId: 'P1' }; }
    async assertCanonicalStorage() {}
  },
}));

import { app } from '../../server/app';
import { commandDatabase } from './helpers/commandDatabase';
import { setTestDbOverride } from '../firebase/admin';
import { GoogleWorkspaceCommandError } from '../services/projectGoogleWorkspace.server';

describe('Google Report Refresh Route Credential Fix', () => {
  let server: http.Server;

  beforeEach(async () => {
    vi.clearAllMocks();
    const x = commandDatabase({
      'projects/P1/workspace_continuity/current': {
        binding: { projectId: 'P1', spreadsheetId: 'file-123' },
      },
    });
    setTestDbOverride(x.db);

    f.status.mockResolvedValue({
      binding: { projectId: 'P1', spreadsheetId: 'file-123' },
      backgroundAuthorization: 'CONNECTED',
    });
    f.access.mockResolvedValue({
      accessToken: 'durable-server-token-xyz',
      authorizationId: 'auth-grant-1',
    });
    f.blueprintPort.mockReturnValue({
      marker: 'blueprint-port-mock',
    });
    f.refreshOperationalReports.mockResolvedValue({
      state: 'READY',
      lastReportRefreshAt: '2026-11-04T12:00:00.000Z',
    });

    await new Promise<void>((resolve, reject) => {
      server = app.listen(0, '127.0.0.1', resolve);
      server.once('error', reject);
    });
  });

  afterEach(async () => {
    if (server?.listening) {
      await new Promise<void>((resolve, reject) => server.close(e => e ? reject(e) : resolve()));
    }
  });

  it('9 & 10. resolveWorkspaceExecutionToken passes dependencies and awaited token to projectGoogleBlueprintPort', async () => {
    const port = (server.address() as AddressInfo).port;
    const response = await fetch(`http://127.0.0.1:${port}/api/projects/P1/workspace/refresh-reports`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer fixture-firebase',
        'Content-Type': 'application/json',
      },
      body: '{}',
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({
      success: true,
      data: {
        state: 'READY',
        lastReportRefreshAt: '2026-11-04T12:00:00.000Z',
      },
    });

    // 1. Check status dependency called with projectId and user
    expect(f.status).toHaveBeenCalledWith('P1', expect.objectContaining({ userId: 'actor' }));
    // 2. Check access dependency called with projectId and user
    expect(f.access).toHaveBeenCalledWith('P1', expect.objectContaining({ userId: 'actor' }));
    // 3. Check projectGoogleBlueprintPort received resolved string token, not Promise or object
    expect(f.blueprintPort).toHaveBeenCalledWith('durable-server-token-xyz', 'P1');
    // 4. Check refreshOperationalReports received the constructed blueprint port
    expect(f.refreshOperationalReports).toHaveBeenCalledWith(
      'P1',
      expect.objectContaining({ userId: 'actor' }),
      expect.objectContaining({ marker: 'blueprint-port-mock' }),
    );
  });

  it('4. Rejects browser Google token and relies strictly on durable server background authorization', async () => {
    const port = (server.address() as AddressInfo).port;
    const response = await fetch(`http://127.0.0.1:${port}/api/projects/P1/workspace/refresh-reports`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer fixture-firebase',
        'Content-Type': 'application/json',
        'X-Google-Access-Token': 'unauthorized-browser-token',
      },
      body: '{}',
    });

    expect(response.status).toBe(200);
    // Even if browser token was sent, blueprintPort received durable server token
    expect(f.blueprintPort).toHaveBeenCalledWith('durable-server-token-xyz', 'P1');
    expect(f.blueprintPort).not.toHaveBeenCalledWith('unauthorized-browser-token', expect.anything());
  });

  it('11. Successful refresh returns 200 and success true with data', async () => {
    const port = (server.address() as AddressInfo).port;
    const response = await fetch(`http://127.0.0.1:${port}/api/projects/P1/workspace/refresh-reports`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer fixture-firebase',
        'Content-Type': 'application/json',
      },
      body: '{}',
    });

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.data.state).toBe('READY');
  });

  it('12. When background authorization is not connected, returns 401 AUTHORIZATION_REQUIRED without generic 500', async () => {
    f.status.mockResolvedValueOnce({
      binding: { projectId: 'P1', spreadsheetId: 'file-123' },
      backgroundAuthorization: 'NOT_CONNECTED',
    });

    const port = (server.address() as AddressInfo).port;
    const response = await fetch(`http://127.0.0.1:${port}/api/projects/P1/workspace/refresh-reports`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer fixture-firebase',
        'Content-Type': 'application/json',
      },
      body: '{}',
    });

    expect(response.status).toBe(401);
    const json = await response.json();
    expect(json).toEqual({
      success: false,
      code: 'AUTHORIZATION_REQUIRED',
      error: 'AUTHORIZATION_REQUIRED',
    });
    expect(f.access).not.toHaveBeenCalled();
    expect(f.blueprintPort).not.toHaveBeenCalled();
    expect(f.refreshOperationalReports).not.toHaveBeenCalled();
  });

  it('13. Known GoogleWorkspaceCommandError preserves its bounded HTTP status and code', async () => {
    f.refreshOperationalReports.mockRejectedValueOnce(
      new GoogleWorkspaceCommandError('WORKSPACE_ACCOUNT_CHANGE_REQUIRES_EXPLICIT_MIGRATION', 409),
    );

    const port = (server.address() as AddressInfo).port;
    const response = await fetch(`http://127.0.0.1:${port}/api/projects/P1/workspace/refresh-reports`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer fixture-firebase',
        'Content-Type': 'application/json',
      },
      body: '{}',
    });

    expect(response.status).toBe(409);
    const json = await response.json();
    expect(json).toEqual({
      success: false,
      code: 'WORKSPACE_ACCOUNT_CHANGE_REQUIRES_EXPLICIT_MIGRATION',
      error: 'WORKSPACE_ACCOUNT_CHANGE_REQUIRES_EXPLICIT_MIGRATION',
    });
  });

  it('8. Does not leak secrets, tokens, or stack traces on errors', async () => {
    f.refreshOperationalReports.mockRejectedValueOnce(new Error('Internal unexpected Google API secret key error'));

    const port = (server.address() as AddressInfo).port;
    const response = await fetch(`http://127.0.0.1:${port}/api/projects/P1/workspace/refresh-reports`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer fixture-firebase',
        'Content-Type': 'application/json',
      },
      body: '{}',
    });

    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json).toEqual({
      success: false,
      code: 'REPORT_REFRESH_FAILED',
      error: 'REPORT_REFRESH_FAILED',
    });
    const rawText = JSON.stringify(json);
    expect(rawText).not.toContain('durable-server-token-xyz');
    expect(rawText).not.toContain('stack');
  });
});
