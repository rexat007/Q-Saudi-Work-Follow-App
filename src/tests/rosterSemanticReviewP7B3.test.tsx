// @vitest-environment happy-dom
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
let root: Root | undefined, host: HTMLDivElement;
function cleanup() { if (root) act(() => root!.unmount()); root = undefined; document.body.innerHTML = ''; localStorage.clear(); }
function render(node: React.ReactNode) { host = document.createElement('div'); document.body.append(host); root = createRoot(host); act(() => root!.render(node)); return { rerender: (next: React.ReactNode) => act(() => root!.render(next)) }; }
const screen = {
  getByRole: (role: string, options?: { name: string }) => { const candidates = role === 'button' ? Array.from(host.querySelectorAll('button')) : role === 'checkbox' ? Array.from(host.querySelectorAll('input[type=checkbox]')) : Array.from(host.querySelectorAll(`[role=${role}]`)); const found = candidates.find(e => !options || e.textContent === options.name); if (!found) throw Error(`missing ${role}`); return found; },
  getAllByText: (text: RegExp) => Array.from(host.querySelectorAll('p,span,dd,dt')).filter(e => text.test(e.textContent || '')),
  getByText: (text: string | RegExp) => { const e = Array.from(host.querySelectorAll('p,span')).find(e => typeof text === 'string' ? e.textContent === text : text.test(e.textContent || '')); if (!e) throw Error(`missing text ${text}`); return e; },
  queryByText: (text: string | RegExp) => Array.from(host.querySelectorAll('p,span')).find(e => typeof text === 'string' ? e.textContent === text : text.test(e.textContent || '')) || null
};
const fireEvent = { click: (e: Element) => act(() => { (e as HTMLElement).click(); }) };
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
import { I18nProvider } from '../i18n';
import { enTranslations } from '../locales/en';
import { arTranslations } from '../locales/ar';
import { RosterSemanticReview } from '../components/import/RosterSemanticReview';
import type { RosterCanonicalIntent } from '../types/rosterCanonicalIntent';
const tr = enTranslations;
function intent(): RosterCanonicalIntent { return { projectId: 'P1', rowDecisions: [{ rowNumber: 2, status: 'CONTRIBUTING', entities: { driver: 'D1', truck: 'T1', material: 'M1' } }], entities: [{ kind: 'DRIVER', key: 'D1', label: 'Ahmed', prepared: false, rowNumbers: [2] }, { kind: 'TRUCK', key: 'T1', label: 'ABC 123', prepared: false, rowNumbers: [2] }, { kind: 'TRUCK', key: 'T9', label: 'XYZ 999', prepared: false, rowNumbers: [] }, { kind: 'DRIVER', key: 'D8', label: 'Mohamed', prepared: false, rowNumbers: [] }, { kind: 'MATERIAL', key: 'M1', label: 'Sand', prepared: false, rowNumbers: [2] }, { kind: 'MATERIAL', key: 'M9', label: 'Gravel', prepared: false, rowNumbers: [] }], assignmentIntents: [{ driverId: 'D1', truckId: 'T1', action: 'REASSIGN', displaced: [{ assignmentId: 'A1', driverId: 'D1', truckId: 'T9' }, { assignmentId: 'A2', driverId: 'D8', truckId: 'T1' }], rowNumbers: [2] }], allocationIntents: [{ truckId: 'T1', materialId: 'M1', action: 'REALLOCATE', displaced: { allocationId: 'L', truckId: 'T1', materialId: 'M9' }, rowNumbers: [2] }], entityConsequences: [{ key: 'DRIVER:D1', action: 'REUSE', completed: true, rowNumbers: [2] }], blockers: [], warnings: [], requiresDisplacementApproval: true, signature: 'review-A' }; }
afterEach(cleanup);
describe('P7-B3 semantic review UI', () => {
  it('shows both displaced pairs and current material with human labels', () => { render(<I18nProvider initialLocale="en"><RosterSemanticReview intent={intent()} onAccept={vi.fn()} /></I18nProvider>); for (const text of ['Ahmed', 'ABC 123', 'XYZ 999', 'Mohamed', 'Sand', 'Gravel']) expect(screen.getAllByText(new RegExp(text)).length).toBeGreaterThan(0); expect(screen.queryByText('D8')).toBeNull(); expect(screen.queryByText('T9')).toBeNull(); });
  it.each(['ASSIGN', 'REASSIGN', 'NO_CHANGE'] as const)('renders %s from intent authority', action => { const v = intent(); v.assignmentIntents[0].action = action; render(<I18nProvider initialLocale="en"><RosterSemanticReview intent={v} onAccept={vi.fn()} /></I18nProvider>); expect(screen.getByText(tr[`intent.action.${action}`])).toBeTruthy(); });
  it.each(['ALLOCATE', 'REALLOCATE', 'NO_CHANGE'] as const)('renders %s allocation', action => { const v = intent(); v.allocationIntents[0].action = action; render(<I18nProvider initialLocale="en"><RosterSemanticReview intent={v} onAccept={vi.fn()} /></I18nProvider>); expect(screen.getByText(tr[`intent.action.${action}`])).toBeTruthy(); });
  it('requires separate displacement approval and passes its exact signature', () => { const accept = vi.fn(); render(<I18nProvider initialLocale="en"><RosterSemanticReview intent={intent()} onAccept={accept} /></I18nProvider>); const button = screen.getByRole('button', { name: tr['intent.accept'] }) as HTMLButtonElement; expect(button.disabled).toBe(true); fireEvent.click(screen.getByRole('checkbox')); expect(button.disabled).toBe(false); fireEvent.click(button); expect(accept).toHaveBeenCalledWith('review-A', 'review-A'); });
  it('invalidates approval after candidate or current context changes', () => { const accept = vi.fn(), v = intent(); const { rerender } = render(<I18nProvider initialLocale="en"><RosterSemanticReview intent={v} onAccept={accept} /></I18nProvider>); fireEvent.click(screen.getByRole('checkbox')); rerender(<I18nProvider initialLocale="en"><RosterSemanticReview intent={{ ...v, signature: 'review-B' }} onAccept={accept} /></I18nProvider>); expect((screen.getByRole('checkbox') as HTMLInputElement).checked).toBe(false); expect((screen.getByRole('button', { name: tr['intent.accept'] }) as HTMLButtonElement).disabled).toBe(true); });
  it.each(['CROSS_ROW_DRIVER_TRUCK_CONFLICT', 'UNRESOLVED_CANONICAL_ENTITY', 'RELATIONSHIP_CONTEXT_STALE'])('blocks %s even if displacement approved', code => { const v = intent(); v.blockers = [{ code, rowNumbers: [2, 9] }]; render(<I18nProvider initialLocale="en"><RosterSemanticReview intent={v} onAccept={vi.fn()} /></I18nProvider>); expect((screen.getByRole('button', { name: tr['intent.accept'] }) as HTMLButtonElement).disabled).toBe(true); expect(screen.getByRole('alert').textContent).toContain('2, 9'); expect(screen.getByRole('alert').textContent).not.toContain(code); });
  it('uses Arabic labels for direction and explicit relationship approval', () => { render(<I18nProvider initialLocale="ar"><RosterSemanticReview intent={intent()} onAccept={vi.fn()} /></I18nProvider>); expect(screen.getByRole('checkbox').parentElement?.textContent).toContain(arTranslations['intent.confirm']); expect(screen.getAllByText(new RegExp(arTranslations['intent.driver'])).length).toBeGreaterThan(0); expect(screen.queryByText('REASSIGN')).toBeNull(); });
  it('does not present batch-local prepared keys as system IDs', () => { const v = intent(); v.entities[0] = { ...v.entities[0], key: 'prepared:driver:1234567890', prepared: true }; v.assignmentIntents[0].driverId = v.entities[0].key; v.entityConsequences = [{ key: `DRIVER:${v.entities[0].key}`, action: 'PREPARE_NEW', completed: false, rowNumbers: [2] }]; render(<I18nProvider initialLocale="en"><RosterSemanticReview intent={v} onAccept={vi.fn()} /></I18nProvider>); expect(screen.getByText(new RegExp(tr['intent.new.DRIVER']))).toBeTruthy(); expect(screen.queryByText(/prepared:driver:/)).toBeNull(); });
  it.each(['ar', 'en', 'ur'] as const)('SI-CG1 exposes factual source rows separately from import rows in %s', locale => {
    const v = intent(); v.sourceRows = [{sourceType:'EXCEL',sourceSheetName:'Roster',sourceRowNumber:6,internalRowNumber:2}];
    render(<I18nProvider initialLocale={locale}><RosterSemanticReview intent={v} onAccept={vi.fn()} /></I18nProvider>);
    expect(host.textContent).toContain('Roster: 6');
    expect(host.textContent).not.toContain('undefined');
    expect(host.textContent).not.toContain('intent.sourceRows');
    expect((screen.getByRole('button') as HTMLButtonElement).disabled).toBe(true);
  });
  it('SI-CG1 never invents a source row for legacy intent without factual provenance',()=>{
    render(<I18nProvider initialLocale="en"><RosterSemanticReview intent={intent()} onAccept={vi.fn()} /></I18nProvider>);
    expect(host.textContent).not.toContain(enTranslations['intent.sourceRows']);
    expect(host.textContent).toContain(`${enTranslations['intent.rows']}: 2`);
  });

});
