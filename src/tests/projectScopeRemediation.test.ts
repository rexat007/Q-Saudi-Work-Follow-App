import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { onSnapshot, getDocs } from 'firebase/firestore';
import { projectRepository } from '../repositories/project.repository';

const data = [{ projectId: 'P1' }, { projectId: 'P2' }];
vi.mock('../firebase/config', () => ({ auth: { currentUser: { uid: 'u' } }, db: {} }));
vi.mock('firebase/firestore', async original => ({
  ...await original<typeof import('firebase/firestore')>(),
  documentId: vi.fn(() => '__name__'),
  collection: vi.fn(() => ({ kind: 'collection' })),
  where: vi.fn((field, op, value) => ({ field, op, value })),
  query: vi.fn((collection, ...filters) => ({ collection, filters })),
  onSnapshot: vi.fn(), getDocs: vi.fn(),
}));
function snapshot(query: any) {
  const ids = query.filters?.find((filter: any) => filter.field === '__name__')?.value;
  return { docs: data.filter(item => !ids || ids.includes(item.projectId)).map(item => ({ id: item.projectId, data: () => item })) };
}
function ast(path: string) { return ts.createSourceFile(path, readFileSync(path, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX); }
function find(root: ts.Node, predicate: (node: ts.Node) => boolean): ts.Node {
  if (predicate(root)) return root;
  let found: ts.Node | undefined;
  root.forEachChild(node => { if (!found) { try { found = find(node, predicate); } catch { /* another branch */ } } });
  if (!found) throw Error('Missing source contract'); return found;
}
function effect(root: ts.SourceFile, marker: string): string {
  return find(root, node => ts.isCallExpression(node) && node.expression.getText(root) === 'useEffect' && node.arguments[0]?.getText(root).includes(marker)).getText(root);
}
const app = ast('src/App.tsx');
const scope = find(app, node => ts.isVariableDeclaration(node) && node.name.getText(app) === 'assignedProjectScopeKey');
// Execute the actual App effect bodies/dependencies with the actual project repository.
// Firebase callbacks are mocked; this is not browser/live Firestore verification.
const runEffects = new Function('useEffect', 'projectRepository', 'user', 'userProfile', 'effectiveRole', 'setProjects', 'setLoadingProjects', 'setSelectedProjectId', 'projects', 'activeTab',
  ts.transpileModule(`const ${scope.getText(app)}; ${effect(app, 'projectRepository.subscribeToProjects')}; ${effect(app, 'setSelectedProjectId')};`, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText);
function harness() {
  const slots: { dependencies: any[]; cleanup?: () => void }[] = [];
  let cursor = 0, projects: any[] = [], selected = '', uid = 'u', tab = 'FIELD_OPERATIONS';
  const useEffect = (callback: () => (() => void) | undefined, dependencies: any[]) => {
    const index = cursor++; const previous = slots[index];
    if (!previous || dependencies.some((value, i) => !Object.is(value, previous.dependencies[i]))) {
      previous?.cleanup?.(); slots[index] = { dependencies, cleanup: callback() };
    }
  };
  return {
    render(role: string, assignedProjectIds: string[]) {
      for (let render = 0; render < 2; render++) {
      cursor = 0; runEffects(useEffect, projectRepository, { uid }, { role, assignedProjectIds }, role, (value: any) => { projects = typeof value === 'function' ? value(projects) : value; }, () => {}, (value: any) => { selected = typeof value === 'function' ? value(selected) : value; }, projects, tab);
      }
    },
    select(id: string) { selected = id; }, wizard() { tab = 'WIZARD'; },
    projects: () => projects, selected: () => selected,
  };
}
beforeEach(() => {
  vi.restoreAllMocks(); vi.clearAllMocks();
  vi.mocked(onSnapshot).mockImplementation(((query: any, receive: any) => { receive(snapshot(query)); return vi.fn(); }) as any);
  vi.mocked(getDocs).mockImplementation(async query => snapshot(query) as any);
});
describe('Canonical project scope in active App effects', () => {
  it('PROJECT_ADMIN assigned P1 passes exact scope and receives P1', () => {
    const spy = vi.spyOn(projectRepository, 'subscribeToProjects'); const view = harness(); view.render('PROJECT_ADMIN', ['P1']);
    expect(spy).toHaveBeenCalledWith(expect.any(Function), expect.any(Function), ['P1'], false);
    expect(view.projects().map(value => value.projectId)).toEqual(['P1']); expect(view.selected()).toBe('P1');
  });
  it('empty assignments produce an empty list without unrestricted Firestore access', () => {
    const view = harness(); view.render('PROJECT_ADMIN', []); expect(view.projects()).toEqual([]); expect(onSnapshot).not.toHaveBeenCalled();
  });
  it('SUPER_ADMIN retains global subscription even with no assignments', () => {
    const spy = vi.spyOn(projectRepository, 'subscribeToProjects'); const view = harness(); view.render('SUPER_ADMIN', []);
    expect(spy).toHaveBeenCalledWith(expect.any(Function), expect.any(Function), [], true); expect(view.projects()).toHaveLength(2);
  });
  it.each(['DISPATCHER', 'SITE_SUPERVISOR', 'SUPERVISOR', 'FINANCE_AUDITOR', 'DRIVER', 'SCALE_OPERATOR', 'VIEWER'])('scopes role %s to its canonical assignments', role => {
    const view = harness(); view.render(role, ['P2']); expect(view.projects().map(value => value.projectId)).toEqual(['P2']);
  });
  it('restarts on assignment expansion without changing UID/role and keeps valid selection', () => {
    const spy = vi.spyOn(projectRepository, 'subscribeToProjects'); const view = harness(); view.render('PROJECT_ADMIN', ['P1']); view.select('P1');
    const unsubscribe = vi.mocked(onSnapshot).mock.results[0].value;
    view.render('PROJECT_ADMIN', ['P1', 'P2']); expect(spy).toHaveBeenCalledTimes(2); expect(unsubscribe).toHaveBeenCalledOnce(); expect(view.projects()).toHaveLength(2); expect(view.selected()).toBe('P1');
  });
  it('removes P1 and reconciles selection to P2, then clears selection for empty scope', () => {
    const view = harness(); view.render('PROJECT_ADMIN', ['P1', 'P2']); view.select('P1'); view.render('PROJECT_ADMIN', ['P2']);
    expect(view.projects().map(value => value.projectId)).toEqual(['P2']); expect(view.selected()).toBe('P2');
    view.render('PROJECT_ADMIN', []); expect(view.projects()).toEqual([]); expect(view.selected()).toBe('');
  });
  it('does not restart for reordered or newly allocated equivalent arrays', () => {
    const spy = vi.spyOn(projectRepository, 'subscribeToProjects'); const view = harness(); view.render('PROJECT_ADMIN', ['P1', 'P2']); view.render('PROJECT_ADMIN', ['P2', 'P1']);
    expect(spy).toHaveBeenCalledOnce();
  });
  it('preserves empty wizard selection for creation', () => {
    const view = harness(); view.wizard(); view.render('PROJECT_ADMIN', ['P1']); expect(view.selected()).toBe('');
  });
  it('preserves listAll repository scope and avoids collection reads for empty assignments', async () => {
    expect(await projectRepository.listAll([], false)).toEqual([]); expect(getDocs).not.toHaveBeenCalled();
    expect((await projectRepository.listAll(['P2'], false)).map(value => value.projectId)).toEqual(['P2']);
    expect(await projectRepository.listAll([], true)).toHaveLength(2);
  });
  it('all six active callers pass scope and SUPER_ADMIN authority', () => {
    const active = ['src/App.tsx', 'src/components/field/LoadingOperatorView.tsx', 'src/components/dashboard/OperationsDashboardView.tsx', 'src/components/admin/AdminConsoleView.tsx', 'src/components/reports/ReportsEngineView.tsx', 'src/services/offline/offlineCache.service.ts'];
    for (const path of active) {
      const root = ast(path); const call = find(root, node => ts.isCallExpression(node) && /^projectRepository\.(subscribeToProjects|listAll)$/.test(node.expression.getText(root))) as ts.CallExpression;
      expect(call.arguments.length, path).toBe(call.expression.getText(root).endsWith('listAll') ? 2 : 4);
    }
  });
  it('loading and dashboard effects react to canonical scope and dashboard filters cached fallback projects', () => {
    for (const path of ['src/components/field/LoadingOperatorView.tsx', 'src/components/dashboard/OperationsDashboardView.tsx']) {
      const root = ast(path); const source = effect(root, 'projectRepository.'); expect(source).toContain('assignedProjectScopeKey'); expect(source).toContain('authContext.userId'); expect(source).toContain('authContext.role');
    }
    const source = readFileSync('src/components/dashboard/OperationsDashboardView.tsx', 'utf8');
    expect(source).toContain('prjs = prjs.filter(p => isSuperAdmin || assignedProjectIds.includes(p.projectId))');
  });
});

const loading = ast('src/components/field/LoadingOperatorView.tsx');
const runLoadingEffects = new Function('useEffect', 'availableProjects', 'projectId', 'setProjectId', 'generationRef', 'setContext', 'setCarrierId', 'setTruckId', 'setDriverId', 'setMaterialId', 'setReadinessStatus', 'canonicalRelationshipContextService',
  ts.transpileModule(`${effect(loading, 'setProjectId')}; ${effect(loading, 'getProjectRelationshipContext')};`, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText);
function loadingHarness(initialSelection: string) {
  const slots: any[][] = [];
  let cursor = 0, selected = initialSelection, context: any = null, readiness = '', carrier = '', truck = '', driver = '', material = '';
  const generation = { current: 0 };
  const service = { getProjectRelationshipContext: vi.fn((id: string): Promise<any> => Promise.resolve({ projectId: id })) };
  const useEffect = (callback: () => void, dependencies: any[]) => {
    const index = cursor++;
    if (!slots[index] || dependencies.some((value, i) => !Object.is(value, slots[index][i]))) {
      slots[index] = dependencies; callback();
    }
  };
  return {
    service,
    render(ids: string[]) {
      const availableProjects = ids.map(id => ({ id }));
      for (let render = 0; render < 2; render++) {
        cursor = 0;
        runLoadingEffects(useEffect, availableProjects, selected, (value: any) => { selected = typeof value === 'function' ? value(selected) : value; }, generation,
          (value: any) => { context = value; }, (value: string) => { carrier = value; }, (value: string) => { truck = value; }, (value: string) => { driver = value; }, (value: string) => { material = value; }, (value: string) => { readiness = value; }, service);
      }
    },
    selected: () => selected, context: () => context, readiness: () => readiness,
    setEntitySelections() { carrier = 'carrier'; truck = 'truck'; driver = 'driver'; material = 'material'; },
    entitySelections: () => [carrier, truck, driver, material],
  };
}
describe('Loading project reconciliation after canonical scope changes', () => {
  it('replaces removed P1 with the first currently authorized project P2', () => {
    const view = loadingHarness('P1'); view.render(['P1', 'P2']); view.render(['P2']); expect(view.selected()).toBe('P2');
    expect(view.service.getProjectRelationshipContext.mock.calls.map(([id]) => id)).toEqual(['P1', 'P2']);
  });
  it('clears selection and existing context when scope becomes empty without another lookup', async () => {
    const view = loadingHarness('P1'); view.render(['P1']); await Promise.resolve(); expect(view.context()).toEqual({ projectId: 'P1' });
    view.setEntitySelections(); view.render([]);
    expect(view.selected()).toBe(''); expect(view.context()).toBeNull(); expect(view.readiness()).toBe('PENDING');
    expect(view.entitySelections()).toEqual(['', '', '', '']); expect(view.service.getProjectRelationshipContext).toHaveBeenCalledTimes(1);
  });
  it('keeps valid P2 selection and its context when scope changes to P2/P3', async () => {
    const view = loadingHarness('P2'); view.render(['P1', 'P2']); await Promise.resolve(); view.render(['P2', 'P3']);
    expect(view.selected()).toBe('P2'); expect(view.context()).toEqual({ projectId: 'P2' }); expect(view.service.getProjectRelationshipContext).toHaveBeenCalledTimes(1);
  });
  it('uses the existing project-switch generation guard to reject late P1 context', async () => {
    const view = loadingHarness('P1'); let resolveOld!: (value: unknown) => void;
    view.service.getProjectRelationshipContext.mockImplementationOnce(() => new Promise(resolve => { resolveOld = resolve; }));
    view.render(['P1', 'P2']); view.render(['P2']); await Promise.resolve();
    expect(view.context()).toEqual({ projectId: 'P2' }); resolveOld({ projectId: 'P1' }); await Promise.resolve();
    expect(view.context()).toEqual({ projectId: 'P2' }); expect(view.readiness()).toBe('READY');
  });
});
