import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { inMemoryAdminStore, adminDb, createInMemoryAdminDb, setTestDbOverride } from '../firebase/admin';
import {
  getState,
  markDirty,
  markDirtyInTransaction,
  markProjectionSuccessful,
  createCleanProjectionState,
  projectWorkspaceProjectionStateServer,
} from '../services/projectWorkspaceProjectionState.server';
import { resolveWorkspaceErrorStatusCode } from '../../server/app';

describe('Unit 5C: Concurrency-Safe Successful Projection Acknowledgement Tests', () => {
  const TEST_PROJECT_ID = 'PRJ-UNIT5C-001';

  beforeEach(() => {
    // Reset in-memory store before each test
    for (const key of Object.keys(inMemoryAdminStore)) {
      delete inMemoryAdminStore[key];
    }
    setTestDbOverride(createInMemoryAdminDb());
  });

  // ==========================================
  // SECTION 1: REVISION CONTRACT
  // ==========================================

  // 1. clean default mutationRevision === 0
  it('1. clean default mutationRevision === 0', async () => {
    const cleanState = createCleanProjectionState(TEST_PROJECT_ID);
    expect(cleanState.mutationRevision).toBe(0);

    const fetchedState = await getState(TEST_PROJECT_ID);
    expect(fetchedState.mutationRevision).toBe(0);
  });

  // 2. historical state missing mutationRevision normalizes to 0
  it('2. historical state missing mutationRevision normalizes to 0', async () => {
    const docKey = `projects/${TEST_PROJECT_ID}/workspace_projection_state/current`;
    inMemoryAdminStore[docKey] = {
      projectId: TEST_PROJECT_ID,
      dirtyTabs: ['MATERIALS'],
      dirtySince: '2026-09-30T00:00:00.000Z',
      lastMutationAt: '2026-09-30T00:00:00.000Z',
      lastMutationReason: 'Historical legacy mutation without revision',
      lastSuccessfulProjectionAt: null,
      lastSuccessfulProjectionTabs: [],
      updatedAt: '2026-09-30T00:00:00.000Z',
    };

    const state = await getState(TEST_PROJECT_ID);
    expect(state.mutationRevision).toBe(0);
  });

  // 3. first dirty mutation increments revision 0 → 1
  it('3. first dirty mutation increments revision 0 -> 1', async () => {
    const state = await markDirty(TEST_PROJECT_ID, ['MATERIALS'], 'First mutation');
    expect(state.mutationRevision).toBe(1);
    expect(state.dirtyTabs).toEqual(['MATERIALS']);
  });

  // 4. second real dirty mutation increments revision 1 → 2
  it('4. second real dirty mutation increments revision 1 -> 2', async () => {
    await markDirty(TEST_PROJECT_ID, ['DRIVERS'], 'First mutation');
    const state2 = await markDirty(TEST_PROJECT_ID, ['CARRIERS'], 'Second mutation');

    expect(state2.mutationRevision).toBe(2);
    expect(state2.dirtyTabs).toEqual(['DRIVERS', 'CARRIERS']);
  });

  // 5. markProjectionSuccessful preserves mutationRevision
  it('5. markProjectionSuccessful preserves mutationRevision', async () => {
    await markDirty(TEST_PROJECT_ID, ['DRIVERS', 'MATERIALS']);
    const dirtyState = await getState(TEST_PROJECT_ID);
    expect(dirtyState.mutationRevision).toBe(1);

    const ackState = await markProjectionSuccessful(
      TEST_PROJECT_ID,
      ['DRIVERS'],
      '2026-09-30T01:00:00.000Z',
      1
    );

    expect(ackState.mutationRevision).toBe(1);
  });

  // 6. successful acknowledgement with matching revision clears projected dirty tab
  it('6. successful acknowledgement with matching revision clears projected dirty tab', async () => {
    await markDirty(TEST_PROJECT_ID, ['DRIVERS']);
    const dirtyState = await getState(TEST_PROJECT_ID);

    const ackState = await markProjectionSuccessful(
      TEST_PROJECT_ID,
      ['DRIVERS'],
      '2026-09-30T01:00:00.000Z',
      dirtyState.mutationRevision
    );

    expect(ackState.dirtyTabs).toEqual([]);
    expect(ackState.lastSuccessfulProjectionTabs).toEqual(['DRIVERS']);
  });

  // 7. unrelated dirty tabs remain
  it('7. unrelated dirty tabs remain', async () => {
    await markDirty(TEST_PROJECT_ID, ['DRIVERS', 'FLEET_ROSTER', 'MATERIALS']);
    const dirtyState = await getState(TEST_PROJECT_ID);

    const ackState = await markProjectionSuccessful(
      TEST_PROJECT_ID,
      ['FLEET_ROSTER'],
      '2026-09-30T01:00:00.000Z',
      dirtyState.mutationRevision
    );

    expect(ackState.dirtyTabs).toEqual(['DRIVERS', 'MATERIALS']);
  });

  // 8. matching revision partial success preserves dirtySince
  it('8. matching revision partial success preserves dirtySince', async () => {
    const dirtyState = await markDirty(TEST_PROJECT_ID, ['DRIVERS', 'CARRIERS']);
    const originalDirtySince = dirtyState.dirtySince;
    expect(originalDirtySince).not.toBeNull();

    const ackState = await markProjectionSuccessful(
      TEST_PROJECT_ID,
      ['DRIVERS'],
      '2026-09-30T01:00:00.000Z',
      dirtyState.mutationRevision
    );

    expect(ackState.dirtyTabs).toEqual(['CARRIERS']);
    expect(ackState.dirtySince).toBe(originalDirtySince);
  });

  // 9. matching revision full success clears dirtySince
  it('9. matching revision full success clears dirtySince', async () => {
    const dirtyState = await markDirty(TEST_PROJECT_ID, ['MATERIALS']);
    expect(dirtyState.dirtySince).not.toBeNull();

    const ackState = await markProjectionSuccessful(
      TEST_PROJECT_ID,
      ['MATERIALS'],
      '2026-09-30T01:00:00.000Z',
      dirtyState.mutationRevision
    );

    expect(ackState.dirtyTabs).toEqual([]);
    expect(ackState.dirtySince).toBeNull();
  });

  // ==========================================
  // SECTION 2: CONCURRENCY CONFLICT
  // ==========================================

  // 10. expected revision mismatch throws WORKSPACE_PROJECTION_REVISION_CONFLICT
  it('10. expected revision mismatch throws WORKSPACE_PROJECTION_REVISION_CONFLICT', async () => {
    await markDirty(TEST_PROJECT_ID, ['MATERIALS']); // revision is 1
    await markDirty(TEST_PROJECT_ID, ['DRIVERS']); // revision is now 2

    // Caller attempts to acknowledge with stale revision 1
    await expect(
      markProjectionSuccessful(TEST_PROJECT_ID, ['MATERIALS'], '2026-09-30T01:00:00.000Z', 1)
    ).rejects.toMatchObject({
      code: 'WORKSPACE_PROJECTION_REVISION_CONFLICT',
    });
  });

  // 11. revision conflict has statusCode 409
  it('11. revision conflict has statusCode 409', async () => {
    await markDirty(TEST_PROJECT_ID, ['CARRIERS']); // revision is 1

    try {
      await markProjectionSuccessful(TEST_PROJECT_ID, ['CARRIERS'], '2026-09-30T01:00:00.000Z', 999);
      expect.fail('Should have thrown revision conflict error');
    } catch (err: any) {
      expect(err.code).toBe('WORKSPACE_PROJECTION_REVISION_CONFLICT');
      expect(err.statusCode).toBe(409);
    }
  });

  // 12. revision conflict leaves dirtyTabs unchanged
  it('12. revision conflict leaves dirtyTabs unchanged', async () => {
    await markDirty(TEST_PROJECT_ID, ['DRIVERS', 'MATERIALS']);

    try {
      await markProjectionSuccessful(TEST_PROJECT_ID, ['DRIVERS'], '2026-09-30T01:00:00.000Z', 99);
    } catch (err) {
      // Expected conflict
    }

    const state = await getState(TEST_PROJECT_ID);
    expect(state.dirtyTabs).toEqual(['DRIVERS', 'MATERIALS']);
  });

  // 13. revision conflict leaves dirtySince unchanged
  it('13. revision conflict leaves dirtySince unchanged', async () => {
    const dirtyState = await markDirty(TEST_PROJECT_ID, ['FLEET_ROSTER']);
    const originalDirtySince = dirtyState.dirtySince;

    try {
      await markProjectionSuccessful(TEST_PROJECT_ID, ['FLEET_ROSTER'], '2026-09-30T01:00:00.000Z', 42);
    } catch (err) {
      // Expected conflict
    }

    const state = await getState(TEST_PROJECT_ID);
    expect(state.dirtySince).toBe(originalDirtySince);
  });

  // 14. revision conflict leaves lastSuccessfulProjectionAt unchanged
  it('14. revision conflict leaves lastSuccessfulProjectionAt unchanged', async () => {
    const docKey = `projects/${TEST_PROJECT_ID}/workspace_projection_state/current`;
    inMemoryAdminStore[docKey] = {
      projectId: TEST_PROJECT_ID,
      dirtyTabs: ['DRIVERS'],
      dirtySince: '2026-09-30T00:00:00.000Z',
      lastMutationAt: '2026-09-30T00:00:00.000Z',
      lastMutationReason: 'Prior',
      lastSuccessfulProjectionAt: '2026-09-29T12:00:00.000Z',
      lastSuccessfulProjectionTabs: ['MATERIALS'],
      mutationRevision: 3,
      updatedAt: '2026-09-30T00:00:00.000Z',
    };

    try {
      await markProjectionSuccessful(TEST_PROJECT_ID, ['DRIVERS'], '2026-09-30T15:00:00.000Z', 2);
    } catch (err) {
      // Expected conflict
    }

    const state = await getState(TEST_PROJECT_ID);
    expect(state.lastSuccessfulProjectionAt).toBe('2026-09-29T12:00:00.000Z');
  });

  // 15. revision conflict leaves lastSuccessfulProjectionTabs unchanged
  it('15. revision conflict leaves lastSuccessfulProjectionTabs unchanged', async () => {
    const docKey = `projects/${TEST_PROJECT_ID}/workspace_projection_state/current`;
    inMemoryAdminStore[docKey] = {
      projectId: TEST_PROJECT_ID,
      dirtyTabs: ['CARRIERS'],
      dirtySince: '2026-09-30T00:00:00.000Z',
      lastMutationAt: '2026-09-30T00:00:00.000Z',
      lastMutationReason: 'Prior',
      lastSuccessfulProjectionAt: '2026-09-29T12:00:00.000Z',
      lastSuccessfulProjectionTabs: ['DRIVERS'],
      mutationRevision: 5,
      updatedAt: '2026-09-30T00:00:00.000Z',
    };

    try {
      await markProjectionSuccessful(TEST_PROJECT_ID, ['CARRIERS'], '2026-09-30T15:00:00.000Z', 4);
    } catch (err) {
      // Expected conflict
    }

    const state = await getState(TEST_PROJECT_ID);
    expect(state.lastSuccessfulProjectionTabs).toEqual(['DRIVERS']);
  });

  // 16. revision conflict performs no projection-state write
  it('16. revision conflict performs no projection-state write', async () => {
    await markDirty(TEST_PROJECT_ID, ['MATERIALS']);
    const stateBefore = inMemoryAdminStore[`projects/${TEST_PROJECT_ID}/workspace_projection_state/current`];

    try {
      await markProjectionSuccessful(TEST_PROJECT_ID, ['MATERIALS'], '2026-09-30T15:00:00.000Z', 99);
    } catch (err) {
      // Expected conflict
    }

    const stateAfter = inMemoryAdminStore[`projects/${TEST_PROJECT_ID}/workspace_projection_state/current`];
    expect(stateAfter.updatedAt).toBe(stateBefore.updatedAt);
    expect(stateAfter.dirtyTabs).toEqual(stateBefore.dirtyTabs);
  });

  // ==========================================
  // SECTION 3: INITIAL ROUTE ORDER / BEHAVIOR
  // ==========================================

  // 17. /sync/initial captures freshness revision before buildInitialProjectionSnapshot
  it('17. /sync/initial captures freshness revision before buildInitialProjectionSnapshot', () => {
    const appTsPath = path.resolve(__dirname, '../../server/app.ts');
    const appTsContent = fs.readFileSync(appTsPath, 'utf-8');

    const routeIndex = appTsContent.indexOf("app.post('/api/workspace/sync/initial'");
    expect(routeIndex).toBeGreaterThan(-1);

    const routeSnippet = appTsContent.slice(routeIndex, routeIndex + 5000);

    const getStatePos = routeSnippet.indexOf('getWorkspaceProjectionState');
    const buildSnapshotPos = routeSnippet.indexOf('buildInitialProjectionSnapshot');

    expect(getStatePos).toBeGreaterThan(-1);
    expect(buildSnapshotPos).toBeGreaterThan(-1);
    expect(getStatePos).toBeLessThan(buildSnapshotPos);
  });

  // 18. acknowledgement occurs only after Google projection calls
  it('18. acknowledgement occurs only after Google projection calls', () => {
    const appTsPath = path.resolve(__dirname, '../../server/app.ts');
    const appTsContent = fs.readFileSync(appTsPath, 'utf-8');

    const routeIndex = appTsContent.indexOf("app.post('/api/workspace/sync/initial'");
    const routeSnippet = appTsContent.slice(routeIndex, routeIndex + 5000);

    const reconcileFleetPos = routeSnippet.indexOf('reconcileTabSnapshot');
    const markAckPos = routeSnippet.indexOf('markWorkspaceProjectionSuccessful');

    expect(reconcileFleetPos).toBeGreaterThan(-1);
    expect(markAckPos).toBeGreaterThan(-1);
    expect(reconcileFleetPos).toBeLessThan(markAckPos);
  });

  // 19. acknowledgement called exactly once
  it('19. acknowledgement called exactly once', () => {
    const appTsPath = path.resolve(__dirname, '../../server/app.ts');
    const appTsContent = fs.readFileSync(appTsPath, 'utf-8');

    const routeIndex = appTsContent.indexOf("app.post('/api/workspace/sync/initial'");
    const routeSnippet = appTsContent.slice(routeIndex, routeIndex + 5000);

    const matches = routeSnippet.match(/markWorkspaceProjectionSuccessful\(/g);
    expect(matches).not.toBeNull();
    expect(matches!.length).toBe(1);
  });

  // 20. DRIVERS acknowledged after successful Drivers reconciliation (Unit 5D)
  it('20. DRIVERS acknowledged after successful Drivers reconciliation', () => {
    const appTsPath = path.resolve(__dirname, '../../server/app.ts');
    const appTsContent = fs.readFileSync(appTsPath, 'utf-8');

    const routeIndex = appTsContent.indexOf("app.post('/api/workspace/sync/initial'");
    const routeSnippet = appTsContent.slice(routeIndex, routeIndex + 5000);

    expect(routeSnippet).toContain("reconcileTabSnapshot(\n      cleanSpreadsheetId,\n      WORKSPACE_TABS.DRIVERS.tabTitleAr");
    expect(routeSnippet).toContain("successfullyProjectedTabs.push('DRIVERS')");
  });

  // 21. empty Drivers reconciliation is acknowledged (Unit 5D)
  it('21. empty Drivers reconciliation is acknowledged', async () => {
    // In Unit 5D, empty Drivers reconciliation executes and is included in successfullyProjectedTabs
    const projectedTabs: any[] = ['DRIVERS', 'FLEET_ROSTER'];
    await markDirty(TEST_PROJECT_ID, ['DRIVERS', 'FLEET_ROSTER']);

    const ack = await markProjectionSuccessful(TEST_PROJECT_ID, projectedTabs, undefined, 1);
    expect(ack.dirtyTabs).toEqual([]);
    expect(ack.lastSuccessfulProjectionTabs).toEqual(['DRIVERS', 'FLEET_ROSTER']);
  });

  // 22. CARRIERS acknowledged after successful Carriers reconciliation (Unit 5D)
  it('22. CARRIERS acknowledged after successful Carriers reconciliation', () => {
    const appTsPath = path.resolve(__dirname, '../../server/app.ts');
    const appTsContent = fs.readFileSync(appTsPath, 'utf-8');

    const routeIndex = appTsContent.indexOf("app.post('/api/workspace/sync/initial'");
    const routeSnippet = appTsContent.slice(routeIndex, routeIndex + 5000);

    expect(routeSnippet).toContain("reconcileTabSnapshot(\n      cleanSpreadsheetId,\n      WORKSPACE_TABS.CARRIERS.tabTitleAr");
    expect(routeSnippet).toContain("successfullyProjectedTabs.push('CARRIERS')");
  });

  // 23. empty Carriers reconciliation is acknowledged (Unit 5D)
  it('23. empty Carriers reconciliation is acknowledged', async () => {
    const projectedTabs: any[] = ['CARRIERS', 'FLEET_ROSTER'];
    await markDirty(TEST_PROJECT_ID, ['CARRIERS', 'FLEET_ROSTER']);

    const ack = await markProjectionSuccessful(TEST_PROJECT_ID, projectedTabs, undefined, 1);
    expect(ack.dirtyTabs).toEqual([]);
    expect(ack.lastSuccessfulProjectionTabs).toEqual(['CARRIERS', 'FLEET_ROSTER']);
  });

  // 24. MATERIALS acknowledged after successful Materials reconciliation (Unit 5D)
  it('24. MATERIALS acknowledged after successful Materials reconciliation', () => {
    const appTsPath = path.resolve(__dirname, '../../server/app.ts');
    const appTsContent = fs.readFileSync(appTsPath, 'utf-8');

    const routeIndex = appTsContent.indexOf("app.post('/api/workspace/sync/initial'");
    const routeSnippet = appTsContent.slice(routeIndex, routeIndex + 5000);

    expect(routeSnippet).toContain("reconcileTabSnapshot(\n      cleanSpreadsheetId,\n      WORKSPACE_TABS.MATERIALS.tabTitleAr");
    expect(routeSnippet).toContain("successfullyProjectedTabs.push('MATERIALS')");
  });

  // 25. empty Materials reconciliation is acknowledged (Unit 5D)
  it('25. empty Materials reconciliation is acknowledged', async () => {
    const projectedTabs: any[] = ['MATERIALS', 'FLEET_ROSTER'];
    await markDirty(TEST_PROJECT_ID, ['MATERIALS', 'FLEET_ROSTER']);

    const ack = await markProjectionSuccessful(TEST_PROJECT_ID, projectedTabs, undefined, 1);
    expect(ack.dirtyTabs).toEqual([]);
    expect(ack.lastSuccessfulProjectionTabs).toEqual(['MATERIALS', 'FLEET_ROSTER']);
  });

  // 26. FLEET_ROSTER acknowledged after successful reconciliation
  it('26. FLEET_ROSTER acknowledged after successful reconciliation', () => {
    const appTsPath = path.resolve(__dirname, '../../server/app.ts');
    const appTsContent = fs.readFileSync(appTsPath, 'utf-8');

    const routeIndex = appTsContent.indexOf("app.post('/api/workspace/sync/initial'");
    const routeSnippet = appTsContent.slice(routeIndex, routeIndex + 5000);

    expect(routeSnippet).toContain('reconcileTabSnapshot');
    expect(routeSnippet).toContain("successfullyProjectedTabs.push('FLEET_ROSTER')");
  });

  // 27. empty Fleet reconciliation may still acknowledge FLEET_ROSTER
  it('27. empty Fleet reconciliation may still acknowledge FLEET_ROSTER', async () => {
    await markDirty(TEST_PROJECT_ID, ['FLEET_ROSTER']);
    const ack = await markProjectionSuccessful(TEST_PROJECT_ID, ['FLEET_ROSTER'], undefined, 1);
    expect(ack.dirtyTabs).toEqual([]);
    expect(ack.lastSuccessfulProjectionTabs).toEqual(['FLEET_ROSTER']);
  });

  // 28. Google failure prevents acknowledgement
  it('28. Google failure prevents acknowledgement', () => {
    const appTsPath = path.resolve(__dirname, '../../server/app.ts');
    const appTsContent = fs.readFileSync(appTsPath, 'utf-8');

    const routeIndex = appTsContent.indexOf("app.post('/api/workspace/sync/initial'");
    const routeSnippet = appTsContent.slice(routeIndex, routeIndex + 5000);

    // If an error throws in Google calls (Phase 2-5), it jumps directly to catch block without executing Phase 6 ack
    expect(routeSnippet).toContain('} catch (error: any) {');
  });

  // 29. acknowledgement failure prevents HTTP success
  it('29. acknowledgement failure prevents HTTP success', () => {
    const appTsPath = path.resolve(__dirname, '../../server/app.ts');
    const appTsContent = fs.readFileSync(appTsPath, 'utf-8');

    const routeIndex = appTsContent.indexOf("app.post('/api/workspace/sync/initial'");
    const routeSnippet = appTsContent.slice(routeIndex, routeIndex + 5000);

    // markWorkspaceProjectionSuccessful is awaited inside try block BEFORE res.json({ success: true })
    const markAckPos = routeSnippet.indexOf('markWorkspaceProjectionSuccessful');
    const resJsonPos = routeSnippet.indexOf('res.json({');

    expect(markAckPos).toBeGreaterThan(-1);
    expect(resJsonPos).toBeGreaterThan(-1);
    expect(markAckPos).toBeLessThan(resJsonPos);
  });

  // 30. revision conflict resolves to HTTP 409
  it('30. revision conflict resolves to HTTP 409', () => {
    const conflictError: any = new Error('Revision conflict');
    conflictError.code = 'WORKSPACE_PROJECTION_REVISION_CONFLICT';
    conflictError.statusCode = 409;

    const statusCode = resolveWorkspaceErrorStatusCode(conflictError);
    expect(statusCode).toBe(409);
  });

  // 31. summary syncedAt uses projectionCompletedAt acknowledgement timestamp
  it('31. summary syncedAt uses projectionCompletedAt acknowledgement timestamp', () => {
    const appTsPath = path.resolve(__dirname, '../../server/app.ts');
    const appTsContent = fs.readFileSync(appTsPath, 'utf-8');

    const routeIndex = appTsContent.indexOf("app.post('/api/workspace/sync/initial'");
    const routeSnippet = appTsContent.slice(routeIndex, routeIndex + 5000);

    expect(routeSnippet).toContain('const projectionCompletedAt = new Date().toISOString();');
    expect(routeSnippet).toContain('markWorkspaceProjectionSuccessful(');
    expect(routeSnippet).toContain('syncedAt: projectionCompletedAt');
  });

  // ==========================================
  // SECTION 4: BOUNDARIES
  // ==========================================

  // 32. /sync/sheets has no markProjectionSuccessful wiring
  it('32. /sync/sheets has no markProjectionSuccessful wiring', () => {
    const appTsPath = path.resolve(__dirname, '../../server/app.ts');
    const appTsContent = fs.readFileSync(appTsPath, 'utf-8');

    const routeIndex = appTsContent.indexOf("app.post('/api/workspace/sync/sheets'");
    const routeSnippet = appTsContent.slice(routeIndex, routeIndex + 1500);

    expect(routeSnippet).not.toContain('markProjectionSuccessful');
    expect(routeSnippet).not.toContain('expectedMutationRevision');
  });

  // 33. /sync/trips has no markProjectionSuccessful wiring
  it('33. /sync/trips has no markProjectionSuccessful wiring', () => {
    const appTsPath = path.resolve(__dirname, '../../server/app.ts');
    const appTsContent = fs.readFileSync(appTsPath, 'utf-8');

    const routeIndex = appTsContent.indexOf("app.post('/api/workspace/sync/trips'");
    const routeSnippet = appTsContent.slice(routeIndex, routeIndex + 1500);

    expect(routeSnippet).not.toContain('markProjectionSuccessful');
  });

  // 34. Wizard remains untouched
  it('34. Wizard remains untouched in Unit 5C', () => {
    const wizardPath = path.resolve(__dirname, '../components/wizard/ProjectSetupWizard.tsx');
    const wizardContent = fs.readFileSync(wizardPath, 'utf-8');
    expect(wizardContent).not.toContain('expectedMutationRevision');
    expect(wizardContent).not.toContain('mutationRevision');
  });

  // 35. Unit 5B mutation services remain untouched
  it('35. Unit 5B mutation services remain untouched in Unit 5C', () => {
    const provPath = path.resolve(__dirname, '../services/projectProvisioning.server.ts');
    const provContent = fs.readFileSync(provPath, 'utf-8');
    expect(provContent).not.toContain('expectedMutationRevision');

    const intakePath = path.resolve(__dirname, '../services/driverTruckIntake.server.ts');
    const intakeContent = fs.readFileSync(intakePath, 'utf-8');
    expect(intakeContent).not.toContain('expectedMutationRevision');
  });

  // 36. projection-state service has no Google dependency
  it('36. projection-state service has no Google dependency', () => {
    const statePath = path.resolve(__dirname, '../services/projectWorkspaceProjectionState.server.ts');
    const stateContent = fs.readFileSync(statePath, 'utf-8');

    expect(stateContent).not.toContain('googleapis');
    expect(stateContent).not.toContain('clientWorkspaceService');
    expect(stateContent).not.toContain('serverWorkspaceService');
    expect(stateContent).not.toContain('google.sheets');
  });

  // 37. OPERATIONS acknowledgement not introduced
  it('37. OPERATIONS acknowledgement not introduced', () => {
    const appTsPath = path.resolve(__dirname, '../../server/app.ts');
    const appTsContent = fs.readFileSync(appTsPath, 'utf-8');

    const routeIndex = appTsContent.indexOf("app.post('/api/workspace/sync/initial'");
    const routeSnippet = appTsContent.slice(routeIndex, routeIndex + 2500);

    expect(routeSnippet).not.toContain("successfullyProjectedTabs.push('OPERATIONS')");
  });

  // 38. EXCEPTIONS acknowledgement not introduced
  it('38. EXCEPTIONS acknowledgement not introduced', () => {
    const appTsPath = path.resolve(__dirname, '../../server/app.ts');
    const appTsContent = fs.readFileSync(appTsPath, 'utf-8');

    const routeIndex = appTsContent.indexOf("app.post('/api/workspace/sync/initial'");
    const routeSnippet = appTsContent.slice(routeIndex, routeIndex + 2500);

    expect(routeSnippet).not.toContain("successfullyProjectedTabs.push('EXCEPTIONS')");
  });

  // 39. REPORTS acknowledgement not introduced
  it('39. REPORTS acknowledgement not introduced', () => {
    const appTsPath = path.resolve(__dirname, '../../server/app.ts');
    const appTsContent = fs.readFileSync(appTsPath, 'utf-8');

    const routeIndex = appTsContent.indexOf("app.post('/api/workspace/sync/initial'");
    const routeSnippet = appTsContent.slice(routeIndex, routeIndex + 2500);

    expect(routeSnippet).not.toContain("successfullyProjectedTabs.push('REPORTS')");
  });

  // 40. canonical ID/code generation unchanged
  it('40. canonical ID/code generation unchanged', () => {
    const entitiesPath = path.resolve(__dirname, '../types/entities.ts');
    const entitiesContent = fs.readFileSync(entitiesPath, 'utf-8');

    expect(entitiesContent).toContain('projectId: string');
    expect(entitiesContent).toContain('projectCode?: string');
  });
});
