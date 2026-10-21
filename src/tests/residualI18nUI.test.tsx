// @vitest-environment happy-dom
import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '../i18n';
import { resolveTranslation } from '../i18n/utils';
import { OfflineIndicator } from '../components/offline/OfflineIndicator';
import { ConflictResolutionModal } from '../components/offline/ConflictResolutionModal';
import { OutboxDrawer } from '../components/offline/OutboxDrawer';
import { AuthButton } from '../components/auth/AuthButton';

const { state, resolveConflict, getOperations } = vi.hoisted(() => ({
  state: { simulated: false, diagnosticsFail: false, authError: 'تم إغلاق نافذة تسجيل الدخول من قبل المستخدم.' },
  resolveConflict: vi.fn().mockResolvedValue({ success: true, messageAr: 'UNCHANGED-SERVICE-ACK' }),
  getOperations: vi.fn<() => Promise<unknown[]>>().mockResolvedValue([]),
}));
vi.mock('../hooks/useOnlineStatus', () => ({ useOnlineStatus: () => ({ isOnline: false, isSimulatedOffline: state.simulated }) }));
vi.mock('../services/offline/conflictResolution.service', () => ({ conflictResolutionService: { resolveConflict, getConflicts: async () => [], subscribe: () => () => {} } }));
vi.mock('../firebase/authContext', () => ({ useAuth: () => ({ user: null, isAuthReady: true, authError: state.authError, clearAuthError: vi.fn(), signInWithGoogle: vi.fn(), signOutUser: vi.fn() }) }));

vi.mock('../services/offline/outbox.service', () => ({ outboxService: {
  getOperations, getStats: async () => ({ total: 0, pending: 0, sending: 0, synced: 0, failed: 0, conflict: 0 }),
  subscribe: () => () => {}, getDeviceId: () => 'ORIGINAL-DEVICE-42',
} }));
vi.mock('../services/offline/offlineCache.service', () => ({ offlineCacheService: { getCacheMetadata: async () => [] } }));
vi.mock('./conflictResolution.test', () => ({ runConflictResolutionTestSuite: async () => ({
  allPassed: !state.diagnosticsFail, totalTests: state.diagnosticsFail ? 3 : 1, passedTests: 1, failedTests: state.diagnosticsFail ? 2 : 0,
  results: [{ id: 'CONF-TEST-01', nameAr: 'اكتشاف تعارض الإصدارات (VERSION_CONFLICT)', passed: true,
    details: 'فشل اكتشاف تعارض الإصدار' }],
}) }));

let root: Root;
let host: HTMLDivElement;
beforeEach(() => {
  localStorage.clear();
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  resolveConflict.mockClear();
  getOperations.mockResolvedValue([]);
  state.diagnosticsFail = false;
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
});
const conflict = {
  conflictId: 'CONFLICT-KEEP-42', conflictType: 'PRICING_CHANGED',
  titleAr: 'تحديث في قاعدة التسعير الخادومية (Pricing Changed)',
  descriptionAr: 'المادة المنقولة',
  serverState: { status: 'IN_TRANSIT', serverVersion: 9 },
  pricingProtection: { snapshotRate: 12.5, serverCurrentRate: 15, currency: 'SAR', rateDifference: 2.5,
    policyNoteAr: 'UNKNOWN-BUSINESS-NOTE' },
  diffFields: [{ field: 'driverName', fieldLabelAr: 'حالة الرحلة', localValue: 'CUSTOMER-NAME-42', serverValue: 'ORIGINAL-NAME-43' }],
} as any;

describe('Residual localized UI keeps action and data contracts', () => {
  it.each(['ar', 'en', 'ur'] as const)('renders a parameter-free failure title and preserves diagnostic counts in %s', async locale => {
    getOperations.mockResolvedValue([{
      operationId: 'FAILED-OP-42', operationType: 'CREATE_TRIP', status: 'FAILED',
      createdAt: '2026-10-21T00:00:00Z', payload: {}, retryCount: 2,
      errorReason: 'UNCHANGED-OUTBOX-ERROR',
    }]);
    state.diagnosticsFail = true;
    await act(async () => root.render(<I18nProvider initialLocale={locale}><OutboxDrawer isOpen onClose={() => {}} /></I18nProvider>));
    const title = resolveTranslation('legacyMigration.status.failed_2', locale);
    expect(title).not.toMatch(/\{[^}]+\}/);
    expect(Array.from(host.querySelectorAll('div.font-bold')).some(element => element.textContent === title)).toBe(true);
    expect(host.textContent).toContain('UNCHANGED-OUTBOX-ERROR');
    expect(host.textContent).not.toMatch(/\{(?:passed|failed)\}/);
    const tab = Array.from(host.querySelectorAll('button')).find(button => button.textContent?.includes(resolveTranslation('offline.labels.txt_47ad3c', locale)));
    expect(tab).toBeDefined();
    await act(async () => tab?.click());
    const run = Array.from(host.querySelectorAll('button')).find(button => button.textContent?.includes(resolveTranslation('residual.ui.run_conflict_checks', locale)));
    expect(run).toBeDefined();
    await act(async () => run?.click());
    expect(host.textContent).toContain(resolveTranslation('offline.status.failed_2', locale, { passed: 1, failed: 2 }));
    expect(host.textContent).toContain('1/3 PASSED');
    expect(host.textContent).toContain('CONF-TEST-01');
    expect(host.textContent).not.toMatch(/\{(?:passed|failed)\}/);
  });

  it('opens and executes the Outbox diagnostic action with translated results and original case IDs', async () => {
    await act(async () => root.render(<I18nProvider initialLocale="en"><OutboxDrawer isOpen onClose={() => {}} /></I18nProvider>));
    expect(host.textContent).toContain('ORIGINAL-DEVICE-42');
    const tab = Array.from(host.querySelectorAll('button')).find(button => button.textContent?.includes(resolveTranslation('offline.labels.txt_47ad3c', 'en')));
    expect(tab).toBeDefined();
    await act(async () => tab?.click());
    const run = Array.from(host.querySelectorAll('button')).find(button => button.textContent?.includes(resolveTranslation('residual.ui.run_conflict_checks', 'en')));
    expect(run).toBeDefined();
    await act(async () => run?.click());
    expect(host.textContent).toContain('CONF-TEST-01');
    expect(host.textContent).toContain('Detect record version conflicts (VERSION_CONFLICT)');
    expect(host.textContent).toContain('Failed to detect the version conflict');
  });

  it.each(['ar', 'en', 'ur'] as const)('renders offline state and preserves the outbox action in %s', async locale => {
    const open = vi.fn();
    state.simulated = false;
    await act(async () => root.render(<I18nProvider initialLocale={locale}><OfflineIndicator pendingCount={3} onOpenOutbox={open} /></I18nProvider>));
    expect(host.textContent).toContain(resolveTranslation('residual.ui.offline_local_data', locale));
    expect(host.textContent).toContain(resolveTranslation('residual.ui.pending_in_outbox', locale, { count: 3 }));
    await act(async () => (host.querySelector('button') as HTMLButtonElement).click());
    expect(open).toHaveBeenCalledTimes(1);
    state.simulated = true;
    await act(async () => root.render(<I18nProvider initialLocale={locale}><OfflineIndicator /></I18nProvider>));
    expect(host.textContent).toContain(resolveTranslation('residual.ui.simulated_offline', locale));
  });

  it.each(['ar', 'en', 'ur'] as const)('localizes auth prose without altering authentication in %s', async locale => {
    await act(async () => root.render(<I18nProvider initialLocale={locale}><AuthButton /></I18nProvider>));
    expect(host.textContent).toContain(resolveTranslation('residual.messages.sign_in_window_was_closed_by_the_user', locale));
    expect(host.querySelector('button')).not.toBeNull();
  });

  it.each(['ar', 'en', 'ur'] as const)('preserves conflict decisions, numeric rates and business values in %s', async locale => {
    const close = vi.fn(), resolved = vi.fn();
    await act(async () => root.render(<I18nProvider initialLocale={locale}><ConflictResolutionModal conflict={conflict} isOpen onClose={close} onResolved={resolved} /></I18nProvider>));
    expect(host.textContent).toContain('12.5');
    expect(host.textContent).toContain('15');
    expect(host.textContent).toContain('CUSTOMER-NAME-42');
    expect(host.textContent).toContain('ORIGINAL-NAME-43');
    expect(host.textContent).toContain('UNKNOWN-BUSINESS-NOTE');
    const action = Array.from(host.querySelectorAll('button')).find(button => button.textContent?.includes(resolveTranslation('offline.labels.txt_3ba53d', locale)));
    expect(action).toBeDefined();
    const text = host.querySelector('textarea') as HTMLTextAreaElement;
    const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
    await act(async () => { setter?.call(text, 'USER-JUSTIFICATION-42'); text.dispatchEvent(new Event('input', { bubbles: true })); text.dispatchEvent(new Event('change', { bubbles: true })); });
    await act(async () => action?.click());
    expect(resolveConflict).toHaveBeenCalledWith('CONFLICT-KEEP-42', expect.objectContaining({ strategy: 'PRESERVE_PRICING_SNAPSHOT', justification: 'USER-JUSTIFICATION-42' }));
    expect(resolved).toHaveBeenCalledWith('CONFLICT-KEEP-42', 'UNCHANGED-SERVICE-ACK');
    expect(close).toHaveBeenCalledTimes(1);
  });
});
