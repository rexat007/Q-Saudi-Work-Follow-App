// @vitest-environment happy-dom
import React, {act} from 'react';
import {createRoot, type Root} from 'react-dom/client';
import {createServer, type Server} from 'node:http';
import {beforeEach, afterEach, it, expect, vi} from 'vitest';

const f = vi.hoisted(() => ({
  users: [] as any[], read: vi.fn(), first: 'unknown',
  requests: [] as {target: string; command: string}[],
  fetchCalls: [] as {target: string; command: string}[],
}));
vi.mock('../firebase/config', () => ({
  auth: {get currentUser() {return {uid: 'actor', getIdToken: async () => 'synthetic-ir01-token'};}}, db: {},
}));
vi.mock('../firebase/authContext', () => ({useAuth: () => ({
  user: {uid: 'actor'}, profileAuthority: 'AVAILABLE', isProfileLoading: false,
  userProfile: {userId: 'actor', role: 'SUPER_ADMIN', status: 'ACTIVE', isActive: true, assignedProjectIds: ['P1']},
})}));
vi.mock('../repositories/user.repository', () => ({userRepository: {
  listAll: async () => structuredClone(f.users), findByIdFromServer: (id: string) => f.read(id),
}}));
vi.mock('../repositories/project.repository', () => ({projectRepository: {listAll: async () => [{projectId: 'P1', nameAr: 'Synthetic project'}]}}));
vi.mock('../services/auditLog.service', () => ({auditLogService: {getRecentAuditLogs: async () => []}}));
vi.mock('../i18n', () => ({useI18n: () => ({t: (key: string) => key, direction: 'ltr', locale: 'en'})}));
// No command-service mock: AdminConsoleView uses the production token/fetch/error/readback path.
import {AdminConsoleView} from '../components/admin/AdminConsoleView';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
const networkFetch = globalThis.fetch.bind(globalThis);
const pending = new Set<Promise<Response>>();
let host: HTMLDivElement, root: Root, server: Server, base: string;
const state = () => document.querySelector('[data-decision-status]')?.getAttribute('data-decision-status');
const button = (name: string, scope: ParentNode = document) =>
  Array.from(scope.querySelectorAll<HTMLButtonElement>('button')).find(node => node.textContent === name)!;
const settle = () => act(async () => {
  for (let n = 0; n < 4; n++) {
    await Promise.allSettled([...pending]);
    await new Promise<void>(resolve => setImmediate(resolve));
  }
});
const click = async (name: string, scope: ParentNode = document) => {
  expect(button(name, scope), name).toBeDefined();
  await act(async () => button(name, scope).click());
  await settle();
};
const review = async (id: string) => {
  await act(async () => host.querySelector<HTMLButtonElement>(`[data-review-user="${id}"]`)!.click());
  await settle();
};
const row = (id: string) => host.querySelector(`[data-review-user="${id}"]`)!.closest('tr')!;
const direct = (action: string, id = 'B') => click(action === 'suspendAccount' ? 'admin_console.btn_suspend' : 'admin_console.btn_reactivate', row(id));
const render = async () => {await act(async () => root.render(<AdminConsoleView/>)); await settle();};
const selectSafeThenUsers = async () => {await review('A'); await click('admin_console.tab_users');};
const count = (target: string) => f.requests.filter(request => request.target === target).length;

beforeEach(async () => {
  f.first = 'unknown'; f.requests = []; f.fetchCalls = []; f.read.mockReset(); pending.clear();
  f.users = [
    {userId: 'A', fullName: 'Safe Alice', email: 'alice@example.invalid', role: 'VIEWER', assignedProjectIds: ['P1'], status: 'ACTIVE', isActive: true},
    {userId: 'B', fullName: 'Held Bob', email: 'bob@example.invalid', role: 'VIEWER', assignedProjectIds: ['P1'], status: 'ACTIVE', isActive: true},
  ];
  f.read.mockImplementation(async (id: string) => structuredClone(f.users.find(user => user.userId === id) || null));
  server = createServer(async (request, response) => {
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    if (request.method === 'OPTIONS') {response.writeHead(204); response.end(); return;}
    const target = decodeURIComponent(request.url!.split('/')[4]);
    let body = ''; for await (const chunk of request) body += chunk;
    const command = JSON.parse(body).command;
    f.requests.push({target, command});
    expect(request.method).toBe('POST');
    expect(request.headers.authorization).toBe('Bearer synthetic-ir01-token');
    if (target === 'B' && count('B') === 1 && f.first === 'unknown') {
      // A genuinely received HTTP command with no response: its outcome cannot be certified.
      response.destroy(); return;
    }
    if (target === 'B' && count('B') === 1 && f.first === 'rejected') {
      response.writeHead(400, {'Content-Type': 'application/json'});
      response.end(JSON.stringify({success: false, code: 'INVALID_ADMIN_COMMAND'})); return;
    }
    const user = f.users.find(value => value.userId === target)!;
    if (command === 'suspendAccount') Object.assign(user, {status: 'SUSPENDED', isActive: false});
    else if (command === 'reactivateAccount') Object.assign(user, {status: 'ACTIVE', isActive: true});
    else throw Error('UNEXPECTED_IR01_FIXTURE_COMMAND');
    response.writeHead(200, {'Content-Type': 'application/json'});
    response.end(JSON.stringify({success: true, user: {userId: target}}));
  });
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  base = 'http://127.0.0.1:' + (server.address() as any).port;
  // Resolve only the relative URL. The captured fetch performs real loopback HTTP.
  vi.stubGlobal('fetch', (input: RequestInfo | URL, init?: RequestInit) => {
    const path = String(input);
    expect(path).toMatch(/^\/api\/admin\/users\/[AB]\/commands$/);
    f.fetchCalls.push({target: decodeURIComponent(path.split('/')[4]), command: JSON.parse(String(init?.body)).command});
    const task = networkFetch(base + path, init); pending.add(task);
    task.then(() => pending.delete(task), () => pending.delete(task));
    return task;
  });
  host = document.createElement('div'); document.body.append(host); root = createRoot(host);
});
afterEach(async () => {
  await settle(); await act(async () => root.unmount()); host.remove(); vi.unstubAllGlobals();
  server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve()));
});

for (const action of ['suspendAccount', 'reactivateAccount']) {
  for (const readCurrentState of [false, true]) {
    it(`IR01 unresolved B -> safe A -> direct ${action} B submits no further HTTP${readCurrentState ? ' after state-only read' : ''}`, async () => {
      if (action === 'reactivateAccount') Object.assign(f.users[1], {status: 'SUSPENDED', isActive: false});
      await render(); await direct(action);
      expect(state()).toBe('unresolved'); expect(count('B')).toBe(1); expect(f.fetchCalls).toHaveLength(1);
      if (readCurrentState) {
        await click('ui5.review_state');
        expect(f.read).toHaveBeenCalledWith('B'); expect(state()).toBe('unresolved');
        expect(count('B')).toBe(1); expect(f.fetchCalls).toHaveLength(1);
      }
      await selectSafeThenUsers();
      // This is a different render from the unresolved B render. The direct B action selects and decides in one event.
      expect(button(action === 'suspendAccount' ? 'admin_console.btn_suspend' : 'admin_console.btn_reactivate', row('B')).disabled).toBe(false);
      await direct(action);
      console.log('IR01_RETURN_TO_HELD_TARGET', {action, readCurrentState, http: f.requests, fetch: f.fetchCalls});
      expect(count('B'), 'uncertain target must be checked synchronously, before token/HTTP').toBe(1);
      expect(f.fetchCalls.filter(call => call.target === 'B')).toHaveLength(1);
      expect(state()).toBe('unresolved');
    });
  }

  it(`IR01 unknown ${action} on B does not block eligible A`, async () => {
    if (action === 'reactivateAccount') Object.assign(f.users[1], {status: 'SUSPENDED', isActive: false});
    await render(); await direct(action); expect(state()).toBe('unresolved');
    await selectSafeThenUsers(); await direct('suspendAccount', 'A');
    expect(f.requests).toEqual([{target: 'B', command: action}, {target: 'A', command: 'suspendAccount'}]);
    expect(f.fetchCalls).toHaveLength(2); expect(state()).toBe('confirmed');
    await review('B'); expect(state()).toBe('unresolved'); expect(count('B')).toBe(1);
  });

  for (const first of ['confirmed', 'rejected']) {
    it(`IR01 ${first} B outcome permits legitimate later direct ${action}`, async () => {
      f.first = first;
      const initial = first === 'confirmed' ? (action === 'suspendAccount' ? 'reactivateAccount' : 'suspendAccount') : action;
      if (initial === 'reactivateAccount') Object.assign(f.users[1], {status: 'SUSPENDED', isActive: false});
      await render(); await direct(initial);
      expect(state()).toBe(first === 'confirmed' ? 'confirmed' : 'failed');
      await selectSafeThenUsers(); await direct(action);
      expect(f.requests).toEqual([{target: 'B', command: initial}, {target: 'B', command: action}]);
      expect(f.fetchCalls).toHaveLength(2); expect(state()).toBe('confirmed');
    });
  }
}
