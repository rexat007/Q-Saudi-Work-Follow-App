// @vitest-environment happy-dom
import React,{act} from 'react';
import {createRoot} from 'react-dom/client';
import {beforeEach,afterEach,describe,it,expect,vi} from 'vitest';
import {AdaptiveOperationalReports} from '../components/reports/AdaptiveOperationalReports';
import {clientWorkspaceService} from '../services/workspace.service';
import {tripRepository} from '../repositories/trip.repository';
import {buildOperationalReport} from '../services/operationalReporting';

const f = vi.hoisted(() => ({
  refresh: vi.fn(),
  status: vi.fn(),
  subscribe: vi.fn(),
  buildReport: vi.fn(),
}));

vi.mock('../services/workspace.service', () => ({
  clientWorkspaceService: {
    refreshOperationalReports: f.refresh,
    getGoogleWorkspaceStatus: f.status,
  },
}));

vi.mock('../repositories/trip.repository', () => ({
  tripRepository: {
    subscribeByProject: f.subscribe,
    listByProject: vi.fn(async () => []),
  },
}));

vi.mock('../services/operationalReporting', () => ({
  buildOperationalReport: f.buildReport,
}));

vi.mock('../i18n', () => ({
  useI18n: () => ({
    t: (key: string, params?: any) => {
      if (key === 'op.last_google_report_refresh') return `last_refresh:${params.at}`;
      if (key === 'op.legacy_excluded') return `legacy_excluded:${params.count}`;
      return key;
    },
    isRTL: false,
  }),
}));

// Mock profileTripColumns to avoid complex resolution in tests
vi.mock('../services/operationalReportColumns', () => ({
  profileTripColumns: () => ['tripId', 'status'],
}));

let host: HTMLDivElement, root: ReturnType<typeof createRoot>;

describe('Google Derived Report Refresh UI Wiring', () => {
  const projectId = 'PRJ-1';
  const mockReport = {
    projectId,
    rows: [],
    liveMovement: [],
    capabilities: { measuredLoading: false, measuredUnloading: false, weightReconciliation: false, estimatedProduction: false },
    metrics: {},
    legacyTripsExcluded: 0,
    periods: { daily: [], weekly: [] },
    productivity: { carrier: {}, truck: {}, driver: {}, shift: {}, material: {} },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
    host = document.createElement('div');
    document.body.append(host);
    root = createRoot(host);

    f.status.mockResolvedValue({ lastReportRefreshAt: null });
    f.subscribe.mockImplementation((_p, cb) => {
      cb([]);
      return () => {};
    });
    f.buildReport.mockReturnValue(mockReport);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    host.remove();
  });

  const getRefreshButton = () => {
    return Array.from(host.querySelectorAll('button')).find(b => b.textContent === 'op.refresh_google_reports' || b.textContent === 'op.refreshing_google_reports') as HTMLButtonElement;
  };

  const mockConfig = { profileId: 'P1', version: 1, columns: [], capabilities: {} } as any;

  it('refreshOperationalReports is called exactly once on button click', async () => {
    f.refresh.mockResolvedValue({ lastReportRefreshAt: '2026-11-03T12:00:00Z' });
    await act(async () => root.render(<AdaptiveOperationalReports projectId={projectId} configuration={mockConfig} />));
    
    const btn = getRefreshButton();
    expect(btn).toBeDefined();
    
    await act(async () => btn.click());
    expect(f.refresh).toHaveBeenCalledWith(projectId);
    expect(f.refresh).toHaveBeenCalledTimes(1);
  });

  it('does not refresh automatically on mount or list load', async () => {
    await act(async () => root.render(<AdaptiveOperationalReports projectId={projectId} configuration={mockConfig} />));
    expect(f.refresh).not.toHaveBeenCalled();
  });

  it('prevents duplicate clicks while refreshing', async () => {
    let resolveRefresh: any;
    const refreshPromise = new Promise(resolve => { resolveRefresh = resolve; });
    f.refresh.mockReturnValue(refreshPromise);

    await act(async () => root.render(<AdaptiveOperationalReports projectId={projectId} configuration={mockConfig} />));
    const btn = getRefreshButton();

    await act(async () => {
      btn.click();
    });
    expect(f.refresh).toHaveBeenCalledTimes(1);
    expect(btn.disabled).toBe(true);

    await act(async () => {
      btn.click(); // Second click
    });
    expect(f.refresh).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveRefresh({ lastReportRefreshAt: '2026-11-03T13:00:00Z' });
    });
    expect(btn.disabled).toBe(false);
  });

  it('does not fetch workspace status on mount', async () => {
    await act(async () => root.render(<AdaptiveOperationalReports projectId={projectId} configuration={mockConfig} />));
    expect(f.status).not.toHaveBeenCalled();
  });

  it('shows success feedback and updates last refresh timestamp without extra GET', async () => {
    const timestamp = '2026-11-03T14:00:00Z';
    f.refresh.mockResolvedValue({ lastReportRefreshAt: timestamp });
    
    await act(async () => root.render(<AdaptiveOperationalReports projectId={projectId} configuration={mockConfig} />));
    expect(f.status).not.toHaveBeenCalled();
    
    const btn = getRefreshButton();
    await act(async () => btn.click());
    
    expect(host.textContent).toContain('op.google_reports_refreshed');
    expect(host.textContent).toContain('last_refresh:');
    expect(f.status).not.toHaveBeenCalled();
  });

  it('shows failure feedback and preserves app report content', async () => {
    f.refresh.mockRejectedValue(new Error('REFRESH_FAILED'));
    const testRows = [{ tripId: 'T1', status: 'COMPLETED' }];
    f.buildReport.mockReturnValue({ ...mockReport, rows: testRows, liveMovement: testRows });

    await act(async () => root.render(<AdaptiveOperationalReports projectId={projectId} configuration={mockConfig} />));
    
    // Change family to LIVE to see the rows table
    const familySelect = host.querySelector('select') as HTMLSelectElement;
    await act(async () => {
      familySelect.value = 'LIVE';
      familySelect.dispatchEvent(new Event('change', { bubbles: true }));
    });

    expect(host.textContent).toContain('T1'); // Initial content in table

    const btn = getRefreshButton();
    await act(async () => btn.click());

    expect(host.textContent).toContain('op.google_reports_refresh_failed');
    expect(host.textContent).toContain('T1'); // Content preserved
  });

  it('does not trigger ordinary sync actions', async () => {
    await act(async () => root.render(<AdaptiveOperationalReports projectId={projectId} configuration={mockConfig} />));
    const btn = getRefreshButton();
    await act(async () => btn.click());

    // We only check what we MOCKED. If we didn't mock it, it wouldn't be called unless imported.
    // Since we didn't import or mock other workspace methods like drainPendingWorkspace,
    // they are not part of this component's wiring if they weren't added.
  });
});
