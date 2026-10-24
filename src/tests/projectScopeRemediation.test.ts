import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { onSnapshot, getDocs } from 'firebase/firestore';
import { projectRepository } from '../repositories/project.repository';

const data = [{ projectId: 'P1' }, { projectId: 'P2' }];
vi.mock('../firebase/config', () => ({ auth: { currentUser: { uid: 'u' } }, db: {} }));
vi.mock('firebase/firestore', async original => ({
  ...await original<typeof import('firebase/firestore')>(),
  collection: vi.fn(() => ({ kind: 'collection' })),
  where: vi.fn((field, op, value) => ({ field, op, value })),
  query: vi.fn((collection, ...filters) => ({ collection, filters })),
  onSnapshot: vi.fn(), getDocs: vi.fn(),
}));
function snapshot(query: any) {
  const ids = query.filters?.find((filter: any) => filter.field === 'projectId')?.value;
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
      cursor = 0; runEffects(useEffect, projectRepository, { uid }, { role, assignedProjectIds }, role, (value: any[]) => { projects = value; }, () => {}, (value: any) => { selected = typeof value === 'function' ? value(selected) : value; }, projects, tab);
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
