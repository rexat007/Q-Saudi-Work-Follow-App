// @vitest-environment happy-dom
import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { WorkspaceEnsurePanel } from '../components/wizard/WorkspaceEnsurePanel';
import type { WorkspaceEnsureClient } from '../utils/workspaceEnsureJourney';
import type { WorkspaceEnsureStatus } from '../types/workspaceProvisioning';

const state = (state: WorkspaceEnsureStatus['state']): WorkspaceEnsureStatus => ({
  state,
  operationId: 'op-ready',
  phase: state === 'READY' ? 'READY' : 'WORKBOOK',
  completed: state === 'READY' ? ['AUTHORIZATION', 'BINDING', 'WORKBOOK', 'MASTER_DATA', 'SCRIPT', 'FINAL_VERIFY'] : [],
  actionRequired: null,
  retryable: false,
  canResume: false,
});

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

describe('Manual Workspace Incremental Sync UI Wiring', () => {
  let host: HTMLDivElement;
  let root: Root;

  const f = {
    ensureWorkspace: vi.fn(),
    observeWorkspaceProvisioning: vi.fn(),
    connectBackgroundAuthorization: vi.fn(),
    drainPendingWorkspace: vi.fn(),
    refreshOperationalReports: vi.fn(),
    requestUserActiveWorkspaceSync: vi.fn(),
  };

  function createClient(statusState: WorkspaceEnsureStatus['state'] = 'READY'): WorkspaceEnsureClient & {
    drainPendingWorkspace: ReturnType<typeof vi.fn>;
  } {
    return {
      ensureWorkspace: f.ensureWorkspace.mockResolvedValue(state(statusState)),
      observeWorkspaceProvisioning: f.observeWorkspaceProvisioning.mockResolvedValue(state(statusState)),
      connectBackgroundAuthorization: f.connectBackgroundAuthorization.mockResolvedValue(undefined),
      drainPendingWorkspace: f.drainPendingWorkspace.mockResolvedValue(undefined),
    };
  }

  beforeEach(() => {
    vi.clearAllMocks();
    host = document.createElement('div');
    document.body.append(host);
    root = createRoot(host);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    host.remove();
  });

  it('13. READY state shows both Verify action and Manual sync action', async () => {
    const client = createClient('READY');
    await act(async () => {
      root.render(<WorkspaceEnsurePanel projectId="P1" service={client} t={k => k} />);
    });

    const buttons = host.querySelectorAll('button');
    expect(buttons).toHaveLength(2);
    expect(buttons[0].textContent).toBe('gws.one.verify');
    expect(buttons[1].textContent).toBe('gws.one.sync');
  });

  it('NOT_CONFIGURED state shows only Prepare/Verify button, not Manual sync button', async () => {
    const client = createClient('NOT_CONFIGURED');
    await act(async () => {
      root.render(<WorkspaceEnsurePanel projectId="P1" service={client} t={k => k} />);
    });

    const buttons = host.querySelectorAll('button');
    expect(buttons).toHaveLength(1);
    expect(buttons[0].textContent).toBe('gws.one.prepare');
  });

  it('14. Clicking Verify executes ensure journey and never calls drainPendingWorkspace (retry-sync)', async () => {
    const client = createClient('READY');
    await act(async () => {
      root.render(<WorkspaceEnsurePanel projectId="P1" service={client} t={k => k} />);
    });

    const verifyBtn = host.querySelectorAll('button')[0];
    expect(verifyBtn.textContent).toBe('gws.one.verify');

    await act(async () => {
      verifyBtn.click();
    });

    expect(client.ensureWorkspace).toHaveBeenCalledOnce();
    expect(client.drainPendingWorkspace).not.toHaveBeenCalled();
    expect(f.drainPendingWorkspace).not.toHaveBeenCalled();
  });

  it('15. Clicking Manual Sync calls drainPendingWorkspace (retry-sync) exactly once, with zero ensure or report refresh calls', async () => {
    const client = createClient('READY');
    await act(async () => {
      root.render(<WorkspaceEnsurePanel projectId="P1" service={client} t={k => k} />);
    });

    f.ensureWorkspace.mockClear();

    const syncBtn = host.querySelectorAll('button')[1];
    expect(syncBtn.textContent).toBe('gws.one.sync');

    await act(async () => {
      syncBtn.click();
    });

    expect(client.drainPendingWorkspace).toHaveBeenCalledTimes(1);
    expect(client.drainPendingWorkspace).toHaveBeenCalledWith('P1');
    expect(client.ensureWorkspace).not.toHaveBeenCalled();
    expect(f.refreshOperationalReports).not.toHaveBeenCalled();
    expect(f.requestUserActiveWorkspaceSync).not.toHaveBeenCalled();
  });

  it('16. Double click while sync is in flight does not duplicate calls', async () => {
    let resolveSync!: () => void;
    const slowSync = new Promise<void>(r => { resolveSync = r; });
    const client = createClient('READY');
    client.drainPendingWorkspace.mockImplementation(() => slowSync);

    await act(async () => {
      root.render(<WorkspaceEnsurePanel projectId="P1" service={client} t={k => k} />);
    });

    const syncBtn = host.querySelectorAll('button')[1];
    expect(syncBtn.disabled).toBe(false);

    await act(async () => {
      syncBtn.click();
    });

    // In flight: button should be disabled
    expect(syncBtn.disabled).toBe(true);

    // Second click during in-flight
    await act(async () => {
      syncBtn.click();
    });

    expect(client.drainPendingWorkspace).toHaveBeenCalledTimes(1);

    // Finish request
    await act(async () => {
      resolveSync();
    });

    // Success feedback rendered and button re-enabled
    expect(host.textContent).toContain('gws.one.sync_complete');
    expect(syncBtn.disabled).toBe(false);
  });

  it('17. Successful sync renders success feedback and re-enables button', async () => {
    const client = createClient('READY');
    client.drainPendingWorkspace.mockResolvedValueOnce(undefined);

    await act(async () => {
      root.render(<WorkspaceEnsurePanel projectId="P1" service={client} t={k => k} />);
    });

    const syncBtn = host.querySelectorAll('button')[1];

    await act(async () => {
      syncBtn.click();
    });

    expect(host.textContent).toContain('gws.one.sync_complete');
    expect(syncBtn.disabled).toBe(false);
  });

  it('18. Failed sync renders bounded failure feedback, re-enables button, and does not open OAuth', async () => {
    const client = createClient('READY');
    client.drainPendingWorkspace.mockRejectedValueOnce(new Error('WORKSPACE_SYNC_DEFERRED'));

    await act(async () => {
      root.render(<WorkspaceEnsurePanel projectId="P1" service={client} t={k => k} />);
    });

    const syncBtn = host.querySelectorAll('button')[1];

    await act(async () => {
      syncBtn.click();
    });

    expect(host.textContent).toContain('gws.one.sync_failed');
    expect(syncBtn.disabled).toBe(false);
    expect(client.connectBackgroundAuthorization).not.toHaveBeenCalled();
  });

  it('7. No automatic invocation of drainPendingWorkspace on mount or status observation', async () => {
    const client = createClient('READY');
    await act(async () => {
      root.render(<WorkspaceEnsurePanel projectId="P1" service={client} t={k => k} />);
    });

    expect(client.drainPendingWorkspace).not.toHaveBeenCalled();
  });
});
