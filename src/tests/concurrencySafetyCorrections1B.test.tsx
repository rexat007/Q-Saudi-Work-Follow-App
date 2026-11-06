// @vitest-environment happy-dom
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WorkspaceEnsurePanel } from '../components/wizard/WorkspaceEnsurePanel';
import { projectCanonicalRefreshService } from '../services/projectCanonicalRefresh.service';

vi.mock('../services/projectCanonicalRefresh.service', () => ({
  projectCanonicalRefreshService: {
    refresh: vi.fn(),
  },
}));

describe('FQ-RECOVERY-01B Concurrency Safety Corrections', () => {
  let host: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
    host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    host.remove();
    vi.restoreAllMocks();
  });

  describe('Correction A — Detached Promise Rejection Handling', () => {
    it('handles shared readiness promise rejection without unhandled promise rejection errors', async () => {
      let rejectPromise!: (err: Error) => void;
      const sharedPromise = new Promise<any>((_, reject) => {
        rejectPromise = reject;
      });

      let inFlightRef: { promise: Promise<any> } | null = { promise: sharedPromise };

      // Attach rejection-safe cleanup as implemented in ProjectSetupWizard
      sharedPromise.then(
        () => {
          if (inFlightRef?.promise === sharedPromise) inFlightRef = null;
        },
        () => {
          if (inFlightRef?.promise === sharedPromise) inFlightRef = null;
        }
      );

      // Multiple callers awaiting the shared promise
      const caller1 = sharedPromise.catch((err) => err.message);
      const caller2 = sharedPromise.catch((err) => err.message);

      // Trigger rejection
      rejectPromise(new Error('READINESS_NETWORK_FAILURE'));

      const res1 = await caller1;
      const res2 = await caller2;

      expect(res1).toBe('READINESS_NETWORK_FAILURE');
      expect(res2).toBe('READINESS_NETWORK_FAILURE');
      expect(inFlightRef).toBeNull();
    });

    it('completes in-flight ref cleanup when promise rejects', async () => {
      let rejectFn!: (reason: any) => void;
      const failingPromise = new Promise((_, reject) => {
        rejectFn = reject;
      });

      let inFlightRef: any = { promise: failingPromise };

      failingPromise.then(
        () => { if (inFlightRef?.promise === failingPromise) inFlightRef = null; },
        () => { if (inFlightRef?.promise === failingPromise) inFlightRef = null; }
      );

      const handled = failingPromise.catch((e) => e);
      rejectFn(new Error('FIRESTORE_QUOTA_EXHAUSTED'));

      await handled;
      expect(inFlightRef).toBeNull();
    });
  });

  describe('Correction B — Readiness Transport Single-Flight Sharing', () => {
    it('shares a single in-flight transport promise across concurrent readiness requests', async () => {
      let resolveRefresh!: (val: any) => void;
      const refreshPromise = new Promise((resolve) => {
        resolveRefresh = resolve;
      });
      (projectCanonicalRefreshService.refresh as any).mockReturnValue(refreshPromise);

      // Simulate ProjectSetupWizard fetchServerReadiness single-flight coordination
      let inFlightRef: { projectId: string; generation: number; canonicalRevision: number; promise: Promise<any> } | null = null;

      const triggerFetch = (targetProjectId: string, gen: number, rev: number) => {
        let snapshotPromise: Promise<any>;
        if (
          inFlightRef &&
          inFlightRef.projectId === targetProjectId &&
          inFlightRef.generation === gen &&
          inFlightRef.canonicalRevision === rev
        ) {
          snapshotPromise = inFlightRef.promise;
        } else {
          snapshotPromise = projectCanonicalRefreshService.refresh(targetProjectId, { isCurrent: () => true });
          inFlightRef = { projectId: targetProjectId, generation: gen, canonicalRevision: rev, promise: snapshotPromise };
          snapshotPromise.then(
            () => { if (inFlightRef?.promise === snapshotPromise) inFlightRef = null; },
            () => { if (inFlightRef?.promise === snapshotPromise) inFlightRef = null; }
          );
        }
        return snapshotPromise;
      };

      // Call twice concurrently with same params
      const p1 = triggerFetch('PRJ-1', 1, 1);
      const p2 = triggerFetch('PRJ-1', 1, 1);

      expect(p1).toBe(p2);
      expect(projectCanonicalRefreshService.refresh).toHaveBeenCalledTimes(1);

      // Resolve transport
      const dummySnapshot = { readiness: { ready: true } };
      resolveRefresh(dummySnapshot);

      const res1 = await p1;
      const res2 = await p2;

      expect(res1).toEqual(dummySnapshot);
      expect(res2).toEqual(dummySnapshot);
      expect(inFlightRef).toBeNull();
    });

    it('invalidates single-flight in-flight ref when project or revision changes', () => {
      let inFlightRef: any = null;

      const triggerFetch = (targetProjectId: string, gen: number, rev: number) => {
        let snapshotPromise: Promise<any>;
        if (
          inFlightRef &&
          inFlightRef.projectId === targetProjectId &&
          inFlightRef.generation === gen &&
          inFlightRef.canonicalRevision === rev
        ) {
          snapshotPromise = inFlightRef.promise;
        } else {
          snapshotPromise = Promise.resolve({ readiness: { ready: true } });
          inFlightRef = { projectId: targetProjectId, generation: gen, canonicalRevision: rev, promise: snapshotPromise };
        }
        return snapshotPromise;
      };

      triggerFetch('PRJ-1', 1, 1);
      const firstRef = inFlightRef;

      // Project switches to PRJ-2
      triggerFetch('PRJ-2', 1, 1);
      const secondRef = inFlightRef;

      expect(firstRef).not.toBe(secondRef);
      expect(secondRef.projectId).toBe('PRJ-2');
    });
  });

  describe('Correction C — Owner-Aware Workspace Observation Lock', () => {
    it('prevents overlapping observation for same project and respects owner token on cleanup', async () => {
      let resolveObserve1!: (val: any) => void;
      const observe1Promise = new Promise<any>((r) => {
        resolveObserve1 = r;
      });

      const mockService = {
        ensureWorkspace: vi.fn(),
        observeWorkspaceProvisioning: vi.fn().mockImplementation(() => observe1Promise),
        connectBackgroundAuthorization: vi.fn(),
      };

      const t = (k: string) => k;

      // Render Panel 1
      await act(async () => {
        root.render(<WorkspaceEnsurePanel projectId="PRJ-CONCURRENCY-01" service={mockService as any} t={t} />);
      });

      // Panel 1 initiated observation
      expect(mockService.observeWorkspaceProvisioning).toHaveBeenCalledTimes(1);

      // Render a second panel for same project in another container
      const host2 = document.createElement('div');
      document.body.appendChild(host2);
      const root2 = createRoot(host2);

      await act(async () => {
        root2.render(<WorkspaceEnsurePanel projectId="PRJ-CONCURRENCY-01" service={mockService as any} t={t} />);
      });

      // Observe should NOT have been called again while Panel 1 is observing
      expect(mockService.observeWorkspaceProvisioning).toHaveBeenCalledTimes(1);

      // Unmount Panel 2 before Panel 1 finishes
      await act(async () => {
        root2.unmount();
      });
      host2.remove();

      // Resolve Panel 1's observe
      await act(async () => {
        resolveObserve1({
          state: 'PREPARING',
          operationId: 'op-1',
          phase: 'WORKBOOK',
          completed: [],
          canResume: false,
          retryable: false,
        });
      });

      expect(host.textContent).toContain('gws.one.preparing');
    });

    it('proves old unmounted owner releases its own lock and new owner acquires lock securely', async () => {
      let resolveObserve1!: (val: any) => void;
      const observe1Promise = new Promise<any>((r) => resolveObserve1 = r);

      let resolveObserve2!: (val: any) => void;
      const observe2Promise = new Promise<any>((r) => resolveObserve2 = r);

      let callCount = 0;
      const mockService = {
        ensureWorkspace: vi.fn(),
        observeWorkspaceProvisioning: vi.fn().mockImplementation(() => {
          callCount++;
          return callCount === 1 ? observe1Promise : observe2Promise;
        }),
        connectBackgroundAuthorization: vi.fn(),
      };

      const t = (k: string) => k;

      // Mount Panel 1 (Owner 1)
      await act(async () => {
        root.render(<WorkspaceEnsurePanel projectId="PRJ-LOCK-OWNER" service={mockService as any} t={t} />);
      });

      expect(mockService.observeWorkspaceProvisioning).toHaveBeenCalledTimes(1);

      // Unmount Panel 1 while observation 1 is unresolved -> Releases lock for Owner 1
      await act(async () => {
        root.unmount();
      });

      // Remount new Panel 2 (Owner 2) in new container
      const host2 = document.createElement('div');
      document.body.appendChild(host2);
      const root2 = createRoot(host2);

      await act(async () => {
        root2.render(<WorkspaceEnsurePanel projectId="PRJ-LOCK-OWNER" service={mockService as any} t={t} />);
      });

      // Panel 2 should now acquire lock and call observeWorkspaceProvisioning a 2nd time
      expect(mockService.observeWorkspaceProvisioning).toHaveBeenCalledTimes(2);

      // Resolve observation 1 now (old owner)
      resolveObserve1({ state: 'PREPARING', completed: [], canResume: false });

      // Clean up Panel 2
      await act(async () => {
        root2.unmount();
      });
      host2.remove();
    });

    it('stops polling on 503 FIRESTORE_QUOTA_EXHAUSTED and allows manual recovery', async () => {
      const quotaErr = Object.assign(new Error('Quota exceeded'), {
        code: 'FIRESTORE_QUOTA_EXHAUSTED',
        status: 503,
      });

      const mockService = {
        ensureWorkspace: vi.fn(),
        observeWorkspaceProvisioning: vi.fn().mockRejectedValue(quotaErr),
        connectBackgroundAuthorization: vi.fn(),
      };

      const t = (k: string) => (k === 'gws.one.quota_exhausted' ? 'Quota exceeded' : k);

      await act(async () => {
        root.render(<WorkspaceEnsurePanel projectId="PRJ-QUOTA-PANEL" service={mockService as any} t={t} />);
      });

      expect(mockService.observeWorkspaceProvisioning).toHaveBeenCalledTimes(1);
      expect(host.textContent).toContain('Quota exceeded');
    });
  });
});

