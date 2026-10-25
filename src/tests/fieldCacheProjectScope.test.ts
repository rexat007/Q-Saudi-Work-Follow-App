import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { filterProjectScope } from '../utils/projectScope';

// Execute the real production refresh bodies with controlled persistence collaborators.
function initializer(file: string, name: string) {
  const root = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let value: ts.Expression | undefined;
  const visit = (node: ts.Node) => {
    if (ts.isVariableDeclaration(node) && node.name.getText(root) === name) value = node.initializer;
    node.forEachChild(visit);
  };
  visit(root); if (!value) throw Error(`Missing ${name}`);
  if (ts.isCallExpression(value) && value.expression.getText(root) === 'useCallback') value = value.arguments[0];
  return value.getText(root);
}
function runtime(kind: 'Driver' | 'Unloading', ids: string[], role = kind === 'Driver' ? 'DRIVER' : 'SCALE_OPERATOR') {
  const file = `src/components/field/${kind === 'Driver' ? 'DriverView' : 'UnloadingOperatorView'}.tsx`;
  const name = kind === 'Driver' ? 'refreshActiveTrip' : 'refreshInboundTrips';
  const context = { userId: 'u', linkedDriverId: 'DRV-A', role: role as any, assignedProjectIds: ids };
  const ref = { current: 'current' };
  const trips = [{ tripId: 'T1', projectId: 'P1', driverId: 'DRV-A', status: 'IN_TRANSIT' }, { tripId: 'T2', projectId: 'P2', driverId: 'DRV-A', status: 'IN_TRANSIT' }, { tripId: 'T3', projectId: 'P2', driverId: 'other', status: 'IN_TRANSIT' }];
  const selected = vi.fn(), inbound = vi.fn(), cache = vi.fn();
  const repository = { listByProject: vi.fn(async (_projectId: string) => []), listAll: vi.fn(async () => [{ projectId: 'P1' }, { projectId: 'P2' }]) };
  const indexed = { getAll: vi.fn(async () => trips), putMany: vi.fn() };
  const code = ts.transpileModule(`return (${initializer(file, name)});`, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
  const fn = new Function('authContext', 'scopeKey', 'scopeRef', 'isOnline', 'filterProjectScope', 'indexedDBService', 'tripRepository', 'projectRepository', 'setActiveTrip', 'setInboundTrips', 'setTripsCache', 'operationalTripProjection', code)(context, 'current', ref, true, filterProjectScope, indexed, repository, repository, selected, inbound, cache, (trip: any) => trip);
  return { run: fn, selected, inbound, cache, context, ref, repository, indexed, trips };
}
describe('Active field cache readers obey current project authority', () => {
  it('driver keeps the driver constraint as well as canonical project scope', async () => {
    const view = runtime('Driver', ['P2']); await view.run();
    expect(view.repository.listByProject).toHaveBeenCalledWith('P2'); expect(view.repository.listByProject).toHaveBeenCalledTimes(1);
    expect(view.selected).toHaveBeenLastCalledWith(view.trips[1]);
  });
  it('driver empty scope hides cached trips and performs no network read', async () => {
    const view = runtime('Driver', []); await view.run(); expect(view.selected).toHaveBeenLastCalledWith(null); expect(view.repository.listByProject).not.toHaveBeenCalled();
  });
  it('unloading scopes both inbound queue and search cache', async () => {
    const view = runtime('Unloading', ['P2']); await view.run();
    expect(view.inbound).toHaveBeenLastCalledWith(view.trips.slice(1)); expect(view.cache).toHaveBeenLastCalledWith(view.trips.slice(1));
    expect(view.repository.listByProject).toHaveBeenCalledWith('P2'); expect(view.repository.listByProject).toHaveBeenCalledTimes(1);
  });
  it('unloading empty scope never restores trips from shared cache', async () => {
    const view = runtime('Unloading', []); await view.run(); expect(view.inbound).toHaveBeenLastCalledWith([]); expect(view.cache).toHaveBeenLastCalledWith([]); expect(view.repository.listByProject).not.toHaveBeenCalled();
  });
  it('unloading SUPER_ADMIN obtains explicit global project scope for network hydration', async () => {
    const view = runtime('Unloading', [], 'SUPER_ADMIN'); await view.run(); expect(view.repository.listAll).toHaveBeenCalledWith([], true);
    expect(view.repository.listByProject.mock.calls.map(call => call[0])).toEqual(['P1', 'P2']); expect(view.cache).toHaveBeenLastCalledWith(view.trips);
  });
  it.each(['Driver', 'Unloading'] as const)('%s ignores a refresh completed after authority changed', async kind => {
    const view = runtime(kind, ['P1']);
    view.indexed.getAll.mockImplementation(async () => { view.ref.current = 'revoked'; return view.trips; });
    await view.run(); expect(view.selected).not.toHaveBeenCalled(); expect(view.inbound).not.toHaveBeenCalled(); expect(view.cache).not.toHaveBeenCalled();
  });
});
