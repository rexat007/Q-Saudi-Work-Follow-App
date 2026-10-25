import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { tripRepository } from '../repositories/trip.repository';
vi.mock('../firebase/config', () => ({ auth: { currentUser: { uid: 'u' } }, db: {} }));
const read = (path: string) => readFileSync(path, 'utf8');
describe('Trip mutation authority boundary (structural rules, not emulator proof)', () => {
  it('browser repository cannot create or update even through a client transaction', async () => {
    const transaction = { set: vi.fn(), update: vi.fn() };
    await expect(tripRepository.create({ projectId: 'P1', tripId: 'T1' } as any, transaction as any)).rejects.toThrow('TRIP_COMMAND_REQUIRED');
    await expect(tripRepository.update('P1', 'T1', { status: 'COMPLETED' }, 'u', transaction as any)).rejects.toThrow('TRIP_COMMAND_REQUIRED'); expect(transaction.set).not.toHaveBeenCalled(); expect(transaction.update).not.toHaveBeenCalled();
  });
  it('rules deny direct trip create/update/delete and direct lifecycle-event creation', () => {
    const source = read('firestore.rules'); const section = source.slice(source.indexOf('// Trips subcollection'), source.indexOf('// Collection Group Read Rule'));
    expect(section).toContain('allow update: if false;'); expect(section).toContain('allow create: if false;'); expect(section).toContain('allow delete: if false;'); expect(section).toContain('Events are emitted atomically by server commands');
    expect(source).toContain('projectId in currentUser().assignedProjectIds');
    const ledger = source.slice(source.indexOf('match /sync_operations/'), source.indexOf('// Import Batches'));
    expect(ledger.match(/!operationId\.matches\('\^TRIP-CMD-\.\*'\)/g)).toHaveLength(2);
  });
  it('active field UIs queue business intent and contain no direct Firestore trip writes', () => {
    for (const file of ['LoadingOperatorView', 'UnloadingOperatorView', 'DriverView']) {
      const source = read(`src/components/field/${file}.tsx`);
      expect(source).toContain('outboxService.queueOperation'); expect(source).not.toMatch(/tripRepository\.(create|update)\(/); expect(source).not.toMatch(/\b(updateDoc|setDoc)\(/);
    }
  });
  it('Driver ownership has no UID equality or assignedDriverId fallback', () => {
    const source = read('src/components/field/DriverView.tsx'); expect(source).toContain('t.driverId === authContext.linkedDriverId'); expect(source).not.toContain('assignedDriverId'); expect(source).not.toContain('driverId === authContext.userId');
  });
  it('every persistent operational HTTP handler delegates to the current-principal command service', () => {
    const source = read('server/app.ts'); expect(source).toContain("'/api/projects/:projectId/trips/commands'"); expect(source).toContain('new TripCommandsServerService().execute'); expect(source).toContain("code: 'TRIP_COMMAND_REQUIRED'");
    expect(source).not.toContain('serverTripService.transitionTripStatus('); expect(source).not.toContain('serverTripService.dispatchTrip('); expect(source).not.toContain('serverTripService.dispatchImportedTrip(');
  });
  it('outbox cannot accept cached processed ledger as server authorization', () => {
    const source = read('src/services/offline/outbox.service.ts'); expect(source).toContain('sendTripCommand'); expect(source).not.toContain('syncOperationRepository.findById'); expect(source).not.toContain('syncOperationRepository.create');
  });
  it('both active Admin role selectors contain all nine canonical choices', () => {
    const source = ts.createSourceFile('view.tsx', read('src/components/admin/AdminConsoleView.tsx'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const roleSets: Set<string>[] = [];
    const visit = (node: ts.Node) => {
      if (ts.isJsxElement(node) && node.openingElement.tagName.getText(source) === 'select') {
        const text = node.getText(source);
        if (text.includes('selectedUserForSecurity.role') || text.includes('approvalRole')) roleSets.push(new Set([...text.matchAll(/option value="([A-Z_]+)"/g)].map(match => match[1])));
      }
      node.forEachChild(visit);
    }; visit(source); expect(roleSets).toHaveLength(2);
    for (const roles of roleSets) expect([...roles].sort()).toEqual(['PROJECT_ADMIN','SUPER_ADMIN','SITE_SUPERVISOR','SUPERVISOR','DISPATCHER','FINANCE_AUDITOR','SCALE_OPERATOR','DRIVER','VIEWER'].sort());
  });
});
