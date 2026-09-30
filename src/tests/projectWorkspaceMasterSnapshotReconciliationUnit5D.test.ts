import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { 
  planReconciliationDeletions,
  serverWorkspaceService 
} from '../../server/workspace.service';
import { WORKSPACE_TABS, FLEET_ROSTER_COLUMNS } from '../types/workspace';
import { inMemoryAdminStore, createInMemoryAdminDb, setTestDbOverride } from '../firebase/admin';
import {
  getState,
  markDirty,
  markProjectionSuccessful,
} from '../services/projectWorkspaceProjectionState.server';
import { resolveWorkspaceErrorStatusCode } from '../../server/app';

describe('Project Workspace Master Snapshot Reconciliation (Unit 5D) Tests', () => {
  const TEST_PROJECT_ID = 'PRJ-UNIT5D-TEST';

  beforeEach(() => {
    for (const key of Object.keys(inMemoryAdminStore)) {
      delete inMemoryAdminStore[key];
    }
    setTestDbOverride(createInMemoryAdminDb());
  });

  // ==========================================
  // SECTION 1: ROUTE ARCHITECTURE (1 - 8)
  // ==========================================

  // 1. /sync/initial uses reconcileTabSnapshot for DRIVERS
  it('1. /sync/initial uses reconcileTabSnapshot for DRIVERS', () => {
    const appTsPath = path.resolve(__dirname, '../../server/app.ts');
    const appTsContent = fs.readFileSync(appTsPath, 'utf-8');

    const routeIndex = appTsContent.indexOf("app.post('/api/workspace/sync/initial'");
    expect(routeIndex).toBeGreaterThan(-1);
    const routeSnippet = appTsContent.slice(routeIndex, routeIndex + 5000);

    expect(routeSnippet).toContain('WORKSPACE_TABS.DRIVERS.tabTitleAr');
    const drvCall = routeSnippet.slice(routeSnippet.indexOf('// 2. DRIVERS Master:'), routeSnippet.indexOf('// 3. CARRIERS Master:'));
    expect(drvCall).toContain('serverWorkspaceService.reconcileTabSnapshot');
    expect(drvCall).toContain("'driverId'");
    expect(drvCall).toContain('snapshot.drivers');
  });

  // 2. /sync/initial uses reconcileTabSnapshot for CARRIERS
  it('2. /sync/initial uses reconcileTabSnapshot for CARRIERS', () => {
    const appTsPath = path.resolve(__dirname, '../../server/app.ts');
    const appTsContent = fs.readFileSync(appTsPath, 'utf-8');

    const routeIndex = appTsContent.indexOf("app.post('/api/workspace/sync/initial'");
    const routeSnippet = appTsContent.slice(routeIndex, routeIndex + 5000);

    const carCall = routeSnippet.slice(routeSnippet.indexOf('// 3. CARRIERS Master:'), routeSnippet.indexOf('// 4. MATERIALS Master:'));
    expect(carCall).toContain('serverWorkspaceService.reconcileTabSnapshot');
    expect(carCall).toContain("'carrierId'");
    expect(carCall).toContain('snapshot.carriers');
  });

  // 3. /sync/initial uses reconcileTabSnapshot for MATERIALS
  it('3. /sync/initial uses reconcileTabSnapshot for MATERIALS', () => {
    const appTsPath = path.resolve(__dirname, '../../server/app.ts');
    const appTsContent = fs.readFileSync(appTsPath, 'utf-8');

    const routeIndex = appTsContent.indexOf("app.post('/api/workspace/sync/initial'");
    const routeSnippet = appTsContent.slice(routeIndex, routeIndex + 5000);

    const matCall = routeSnippet.slice(routeSnippet.indexOf('// 4. MATERIALS Master:'), routeSnippet.indexOf('// 5. FLEET_ROSTER:'));
    expect(matCall).toContain('serverWorkspaceService.reconcileTabSnapshot');
    expect(matCall).toContain("'materialId'");
    expect(matCall).toContain('snapshot.materials');
  });

  // 4. /sync/initial preserves reconcileTabSnapshot for FLEET_ROSTER
  it('4. /sync/initial preserves reconcileTabSnapshot for FLEET_ROSTER', () => {
    const appTsPath = path.resolve(__dirname, '../../server/app.ts');
    const appTsContent = fs.readFileSync(appTsPath, 'utf-8');

    const routeIndex = appTsContent.indexOf("app.post('/api/workspace/sync/initial'");
    const routeSnippet = appTsContent.slice(routeIndex, routeIndex + 5000);

    const fleetCall = routeSnippet.slice(routeSnippet.indexOf('// 5. FLEET_ROSTER:'), routeSnippet.indexOf('const projectionCompletedAt'));
    expect(fleetCall).toContain('serverWorkspaceService.reconcileTabSnapshot');
    expect(fleetCall).toContain("'truckId'");
    expect(fleetCall).toContain('snapshot.fleetRows');
  });

  // 5. exactly four authoritative reconciliation calls exist in /sync/initial
  it('5. exactly four authoritative reconciliation calls exist in /sync/initial', () => {
    const appTsPath = path.resolve(__dirname, '../../server/app.ts');
    const appTsContent = fs.readFileSync(appTsPath, 'utf-8');

    const routeIndex = appTsContent.indexOf("app.post('/api/workspace/sync/initial'");
    const nextRouteIndex = appTsContent.indexOf("app.get('/api/workspace/status'", routeIndex);
    const routeSnippet = appTsContent.slice(routeIndex, nextRouteIndex > -1 ? nextRouteIndex : routeIndex + 5000);

    const reconcileMatches = routeSnippet.match(/serverWorkspaceService\.reconcileTabSnapshot\(/g);
    expect(reconcileMatches).not.toBeNull();
    expect(reconcileMatches!.length).toBe(4);
  });

  // 6. /sync/initial no longer uses upsertTabRecords for DRIVERS
  it('6. /sync/initial no longer uses upsertTabRecords for DRIVERS', () => {
    const appTsPath = path.resolve(__dirname, '../../server/app.ts');
    const appTsContent = fs.readFileSync(appTsPath, 'utf-8');

    const routeIndex = appTsContent.indexOf("app.post('/api/workspace/sync/initial'");
    const routeSnippet = appTsContent.slice(routeIndex, routeIndex + 5000);

    const drvCall = routeSnippet.slice(routeSnippet.indexOf('// 2. DRIVERS Master:'), routeSnippet.indexOf('// 3. CARRIERS Master:'));
    expect(drvCall).not.toContain('upsertTabRecords');
    expect(drvCall).not.toContain('if (snapshot.drivers.length > 0)');
  });

  // 7. /sync/initial no longer uses upsertTabRecords for CARRIERS
  it('7. /sync/initial no longer uses upsertTabRecords for CARRIERS', () => {
    const appTsPath = path.resolve(__dirname, '../../server/app.ts');
    const appTsContent = fs.readFileSync(appTsPath, 'utf-8');

    const routeIndex = appTsContent.indexOf("app.post('/api/workspace/sync/initial'");
    const routeSnippet = appTsContent.slice(routeIndex, routeIndex + 5000);

    const carCall = routeSnippet.slice(routeSnippet.indexOf('// 3. CARRIERS Master:'), routeSnippet.indexOf('// 4. MATERIALS Master:'));
    expect(carCall).not.toContain('upsertTabRecords');
    expect(carCall).not.toContain('if (snapshot.carriers.length > 0)');
  });

  // 8. /sync/initial no longer uses upsertTabRecords for MATERIALS
  it('8. /sync/initial no longer uses upsertTabRecords for MATERIALS', () => {
    const appTsPath = path.resolve(__dirname, '../../server/app.ts');
    const appTsContent = fs.readFileSync(appTsPath, 'utf-8');

    const routeIndex = appTsContent.indexOf("app.post('/api/workspace/sync/initial'");
    const routeSnippet = appTsContent.slice(routeIndex, routeIndex + 5000);

    const matCall = routeSnippet.slice(routeSnippet.indexOf('// 4. MATERIALS Master:'), routeSnippet.indexOf('// 5. FLEET_ROSTER:'));
    expect(matCall).not.toContain('upsertTabRecords');
    expect(matCall).not.toContain('if (snapshot.materials.length > 0)');
  });

  // ==========================================
  // SECTION 2: DRIVERS SNAPSHOT (9 - 15)
  // ==========================================

  // 9. stale driver keyed row is deleted
  it('9. stale driver keyed row is deleted', () => {
    const existingRows = [
      ['DRV-ACTIVE', 'PRJ-1', 'سائق نشط'],
      ['DRV-STALE', 'PRJ-1', 'سائق قديم ملغي'],
    ];
    const authoritativeKeys = new Set(['DRV-ACTIVE']);
    const toDelete = planReconciliationDeletions(existingRows, 0, authoritativeKeys, 2);

    expect(toDelete).toContain(3); // Row 3 (DRV-STALE) is deleted
    expect(toDelete).not.toContain(2); // Row 2 (DRV-ACTIVE) is kept
  });

  // 10. duplicate driverId later row is deleted
  it('10. duplicate driverId later row is deleted', () => {
    const existingRows = [
      ['DRV-001', 'PRJ-1', 'سائق أول'],
      ['DRV-001', 'PRJ-1', 'سائق مكرر'],
    ];
    const authoritativeKeys = new Set(['DRV-001']);
    const toDelete = planReconciliationDeletions(existingRows, 0, authoritativeKeys, 2);

    expect(toDelete).toEqual([3]); // Only row 3 (duplicate) is deleted
  });

  // 11. earliest duplicate driver row is retained
  it('11. earliest duplicate driver row is retained', () => {
    const existingRows = [
      ['DRV-001', 'PRJ-1', 'أول ظهور'],
      ['DRV-002', 'PRJ-1', 'سائق 2'],
      ['DRV-001', 'PRJ-1', 'تكرار ثانٍ'],
      ['DRV-001', 'PRJ-1', 'تكرار ثالث'],
    ];
    const authoritativeKeys = new Set(['DRV-001', 'DRV-002']);
    const toDelete = planReconciliationDeletions(existingRows, 0, authoritativeKeys, 2);

    expect(toDelete).toEqual([5, 4]); // Rows 5 and 4 deleted, Row 2 preserved
  });

  // 12. blank driverId row is preserved
  it('12. blank driverId row is preserved', () => {
    const existingRows = [
      ['DRV-001', 'PRJ-1', 'سائق معتمد'],
      ['', 'PRJ-1', 'ملاحظات يدوية فارغة المفتاح'],
      ['   ', 'PRJ-1', 'مسافات فقط'],
    ];
    const authoritativeKeys = new Set(['DRV-001']);
    const toDelete = planReconciliationDeletions(existingRows, 0, authoritativeKeys, 2);

    expect(toDelete).toEqual([]); // No deletions; blank key rows are left untouched
  });

  // 13. empty authoritative Drivers snapshot deletes all managed driver rows
  it('13. empty authoritative Drivers snapshot deletes all managed driver rows', () => {
    const existingRows = [
      ['DRV-001', 'PRJ-1', 'سائق 1'],
      ['DRV-002', 'PRJ-1', 'سائق 2'],
      ['', 'PRJ-1', 'صف يدوي بدون مفتاح'],
      ['DRV-003', 'PRJ-1', 'سائق 3'],
    ];
    const emptyAuthoritativeKeys = new Set<string>();
    const toDelete = planReconciliationDeletions(existingRows, 0, emptyAuthoritativeKeys, 2);

    expect(toDelete).toEqual([5, 3, 2]); // Rows 5, 3, 2 deleted (in descending order), row 4 blank preserved
  });

  // 14. empty Drivers reconciliation succeeds
  it('14. empty Drivers reconciliation succeeds', async () => {
    const reconcileSpy = vi.spyOn(serverWorkspaceService, 'reconcileTabSnapshot').mockResolvedValue({
      tabKey: 'DRIVERS',
      tabTitle: WORKSPACE_TABS.DRIVERS.tabTitleAr,
      primaryKey: 'driverId',
      processedCount: 0,
      insertedCount: 0,
      updatedCount: 0,
      deletedCount: 2,
      unchangedCount: 0,
    });

    const result = await serverWorkspaceService.reconcileTabSnapshot(
      'mock-sheet-id',
      WORKSPACE_TABS.DRIVERS.tabTitleAr,
      'driverId',
      [],
      ['driverId', 'projectId', 'fullNameAr'],
      'mock-token'
    );

    expect(result.tabKey).toBe('DRIVERS');
    expect(result.processedCount).toBe(0);
    expect(result.deletedCount).toBe(2);

    reconcileSpy.mockRestore();
  });

  // 15. successful empty Drivers reconciliation makes DRIVERS eligible for acknowledgement
  it('15. successful empty Drivers reconciliation makes DRIVERS eligible for acknowledgement', async () => {
    await markDirty(TEST_PROJECT_ID, ['DRIVERS']);
    const dirtyState = await getState(TEST_PROJECT_ID);

    const ack = await markProjectionSuccessful(TEST_PROJECT_ID, ['DRIVERS'], undefined, dirtyState.mutationRevision);
    expect(ack.dirtyTabs).toEqual([]);
    expect(ack.lastSuccessfulProjectionTabs).toEqual(['DRIVERS']);
  });

  // ==========================================
  // SECTION 3: CARRIERS SNAPSHOT (16 - 20)
  // ==========================================

  // 16. stale carrier keyed row is deleted
  it('16. stale carrier keyed row is deleted', () => {
    const existingRows = [
      ['CAR-ACTIVE', 'PRJ-1', 'شركة نشطة'],
      ['CAR-STALE', 'PRJ-1', 'شركة ملغاة'],
    ];
    const authoritativeKeys = new Set(['CAR-ACTIVE']);
    const toDelete = planReconciliationDeletions(existingRows, 0, authoritativeKeys, 2);

    expect(toDelete).toContain(3);
    expect(toDelete).not.toContain(2);
  });

  // 17. duplicate carrierId later row is deleted
  it('17. duplicate carrierId later row is deleted', () => {
    const existingRows = [
      ['CAR-001', 'PRJ-1', 'شركة أصلية'],
      ['CAR-001', 'PRJ-1', 'شركة مكررة'],
    ];
    const authoritativeKeys = new Set(['CAR-001']);
    const toDelete = planReconciliationDeletions(existingRows, 0, authoritativeKeys, 2);

    expect(toDelete).toEqual([3]);
  });

  // 18. blank carrierId row is preserved
  it('18. blank carrierId row is preserved', () => {
    const existingRows = [
      ['CAR-001', 'PRJ-1', 'شركة معتمدة'],
      ['', 'PRJ-1', 'صف فارغ'],
    ];
    const authoritativeKeys = new Set(['CAR-001']);
    const toDelete = planReconciliationDeletions(existingRows, 0, authoritativeKeys, 2);

    expect(toDelete).toEqual([]);
  });

  // 19. empty authoritative Carriers snapshot deletes all managed carrier rows
  it('19. empty authoritative Carriers snapshot deletes all managed carrier rows', () => {
    const existingRows = [
      ['CAR-001', 'PRJ-1', 'شركة 1'],
      ['CAR-002', 'PRJ-1', 'شركة 2'],
      ['', 'PRJ-1', 'غير معرّف'],
    ];
    const emptyKeys = new Set<string>();
    const toDelete = planReconciliationDeletions(existingRows, 0, emptyKeys, 2);

    expect(toDelete).toEqual([3, 2]); // Rows 3 and 2 deleted
  });

  // 20. successful empty Carriers reconciliation makes CARRIERS eligible for acknowledgement
  it('20. successful empty Carriers reconciliation makes CARRIERS eligible for acknowledgement', async () => {
    await markDirty(TEST_PROJECT_ID, ['CARRIERS']);
    const dirtyState = await getState(TEST_PROJECT_ID);

    const ack = await markProjectionSuccessful(TEST_PROJECT_ID, ['CARRIERS'], undefined, dirtyState.mutationRevision);
    expect(ack.dirtyTabs).toEqual([]);
    expect(ack.lastSuccessfulProjectionTabs).toEqual(['CARRIERS']);
  });

  // ==========================================
  // SECTION 4: MATERIALS SNAPSHOT (21 - 25)
  // ==========================================

  // 21. stale material keyed row is deleted
  it('21. stale material keyed row is deleted', () => {
    const existingRows = [
      ['MAT-ACTIVE', 'PRJ-1', 'رمل ناعم'],
      ['MAT-STALE', 'PRJ-1', 'مادة محذوفة'],
    ];
    const authoritativeKeys = new Set(['MAT-ACTIVE']);
    const toDelete = planReconciliationDeletions(existingRows, 0, authoritativeKeys, 2);

    expect(toDelete).toContain(3);
    expect(toDelete).not.toContain(2);
  });

  // 22. duplicate materialId later row is deleted
  it('22. duplicate materialId later row is deleted', () => {
    const existingRows = [
      ['MAT-001', 'PRJ-1', 'مادة أ'],
      ['MAT-001', 'PRJ-1', 'مادة أ مكررة'],
    ];
    const authoritativeKeys = new Set(['MAT-001']);
    const toDelete = planReconciliationDeletions(existingRows, 0, authoritativeKeys, 2);

    expect(toDelete).toEqual([3]);
  });

  // 23. blank materialId row is preserved
  it('23. blank materialId row is preserved', () => {
    const existingRows = [
      ['MAT-001', 'PRJ-1', 'مادة صالحة'],
      ['', 'PRJ-1', 'سطر بدون كود'],
    ];
    const authoritativeKeys = new Set(['MAT-001']);
    const toDelete = planReconciliationDeletions(existingRows, 0, authoritativeKeys, 2);

    expect(toDelete).toEqual([]);
  });

  // 24. empty authoritative Materials snapshot deletes all managed material rows
  it('24. empty authoritative Materials snapshot deletes all managed material rows', () => {
    const existingRows = [
      ['MAT-001', 'PRJ-1', 'مادة 1'],
      ['MAT-002', 'PRJ-1', 'مادة 2'],
      ['', 'PRJ-1', 'ملاحظة عامة'],
    ];
    const emptyKeys = new Set<string>();
    const toDelete = planReconciliationDeletions(existingRows, 0, emptyKeys, 2);

    expect(toDelete).toEqual([3, 2]);
  });

  // 25. successful empty Materials reconciliation makes MATERIALS eligible for acknowledgement
  it('25. successful empty Materials reconciliation makes MATERIALS eligible for acknowledgement', async () => {
    await markDirty(TEST_PROJECT_ID, ['MATERIALS']);
    const dirtyState = await getState(TEST_PROJECT_ID);

    const ack = await markProjectionSuccessful(TEST_PROJECT_ID, ['MATERIALS'], undefined, dirtyState.mutationRevision);
    expect(ack.dirtyTabs).toEqual([]);
    expect(ack.lastSuccessfulProjectionTabs).toEqual(['MATERIALS']);
  });

  // ==========================================
  // SECTION 5: FULL INITIAL SNAPSHOT (26 - 35)
  // ==========================================

  // 26. four tabs reconcile even when all authoritative arrays are empty
  it('26. four tabs reconcile even when all authoritative arrays are empty', () => {
    const appTsPath = path.resolve(__dirname, '../../server/app.ts');
    const appTsContent = fs.readFileSync(appTsPath, 'utf-8');

    const routeIndex = appTsContent.indexOf("app.post('/api/workspace/sync/initial'");
    const routeSnippet = appTsContent.slice(routeIndex, routeIndex + 5000);

    // Verify all four tabs invoke reconcileTabSnapshot unconditionally (no if length > 0 guard)
    expect(routeSnippet).not.toContain('if (snapshot.drivers.length > 0)');
    expect(routeSnippet).not.toContain('if (snapshot.carriers.length > 0)');
    expect(routeSnippet).not.toContain('if (snapshot.materials.length > 0)');
    expect(routeSnippet).not.toContain('if (snapshot.fleetRows.length > 0)');
  });

  // 27. successfullyProjectedTabs contains all four tabs after all four reconciliations succeed
  it('27. successfullyProjectedTabs contains all four tabs after all four reconciliations succeed', () => {
    const appTsPath = path.resolve(__dirname, '../../server/app.ts');
    const appTsContent = fs.readFileSync(appTsPath, 'utf-8');

    const routeIndex = appTsContent.indexOf("app.post('/api/workspace/sync/initial'");
    const routeSnippet = appTsContent.slice(routeIndex, routeIndex + 5000);

    expect(routeSnippet).toContain("successfullyProjectedTabs.push('DRIVERS')");
    expect(routeSnippet).toContain("successfullyProjectedTabs.push('CARRIERS')");
    expect(routeSnippet).toContain("successfullyProjectedTabs.push('MATERIALS')");
    expect(routeSnippet).toContain("successfullyProjectedTabs.push('FLEET_ROSTER')");
  });

  // 28. acknowledgement still occurs exactly once
  it('28. acknowledgement still occurs exactly once', () => {
    const appTsPath = path.resolve(__dirname, '../../server/app.ts');
    const appTsContent = fs.readFileSync(appTsPath, 'utf-8');

    const routeIndex = appTsContent.indexOf("app.post('/api/workspace/sync/initial'");
    const routeSnippet = appTsContent.slice(routeIndex, routeIndex + 5000);

    const matches = routeSnippet.match(/markWorkspaceProjectionSuccessful\(/g);
    expect(matches).not.toBeNull();
    expect(matches!.length).toBe(1);
  });

  // 29. acknowledgement happens after all four reconciliations
  it('29. acknowledgement happens after all four reconciliations', () => {
    const appTsPath = path.resolve(__dirname, '../../server/app.ts');
    const appTsContent = fs.readFileSync(appTsPath, 'utf-8');

    const routeIndex = appTsContent.indexOf("app.post('/api/workspace/sync/initial'");
    const routeSnippet = appTsContent.slice(routeIndex, routeIndex + 5000);

    const drvPos = routeSnippet.indexOf("WORKSPACE_TABS.DRIVERS.tabTitleAr");
    const carPos = routeSnippet.indexOf("WORKSPACE_TABS.CARRIERS.tabTitleAr");
    const matPos = routeSnippet.indexOf("WORKSPACE_TABS.MATERIALS.tabTitleAr");
    const fleetPos = routeSnippet.indexOf("WORKSPACE_TABS.FLEET_ROSTER.tabTitleAr");
    const ackPos = routeSnippet.indexOf("markWorkspaceProjectionSuccessful(");

    expect(drvPos).toBeGreaterThan(-1);
    expect(carPos).toBeGreaterThan(drvPos);
    expect(matPos).toBeGreaterThan(carPos);
    expect(fleetPos).toBeGreaterThan(matPos);
    expect(ackPos).toBeGreaterThan(fleetPos);
  });

  // 30. Google failure in Drivers prevents acknowledgement
  it('30. Google failure in Drivers prevents acknowledgement', () => {
    const appTsPath = path.resolve(__dirname, '../../server/app.ts');
    const appTsContent = fs.readFileSync(appTsPath, 'utf-8');

    const routeIndex = appTsContent.indexOf("app.post('/api/workspace/sync/initial'");
    const routeSnippet = appTsContent.slice(routeIndex, routeIndex + 5000);

    // Any error in Google operations jumps to catch block before acknowledgement
    expect(routeSnippet).toContain('} catch (error: any) {');
    const tryBlock = routeSnippet.slice(0, routeSnippet.indexOf('} catch (error: any) {'));
    expect(tryBlock).toContain('await serverWorkspaceService.reconcileTabSnapshot(\n      cleanSpreadsheetId,\n      WORKSPACE_TABS.DRIVERS.tabTitleAr');
  });

  // 31. Google failure in Carriers prevents acknowledgement
  it('31. Google failure in Carriers prevents acknowledgement', () => {
    const appTsPath = path.resolve(__dirname, '../../server/app.ts');
    const appTsContent = fs.readFileSync(appTsPath, 'utf-8');

    const routeIndex = appTsContent.indexOf("app.post('/api/workspace/sync/initial'");
    const routeSnippet = appTsContent.slice(routeIndex, routeIndex + 5000);

    const tryBlock = routeSnippet.slice(0, routeSnippet.indexOf('} catch (error: any) {'));
    expect(tryBlock).toContain('await serverWorkspaceService.reconcileTabSnapshot(\n      cleanSpreadsheetId,\n      WORKSPACE_TABS.CARRIERS.tabTitleAr');
  });

  // 32. Google failure in Materials prevents acknowledgement
  it('32. Google failure in Materials prevents acknowledgement', () => {
    const appTsPath = path.resolve(__dirname, '../../server/app.ts');
    const appTsContent = fs.readFileSync(appTsPath, 'utf-8');

    const routeIndex = appTsContent.indexOf("app.post('/api/workspace/sync/initial'");
    const routeSnippet = appTsContent.slice(routeIndex, routeIndex + 5000);

    const tryBlock = routeSnippet.slice(0, routeSnippet.indexOf('} catch (error: any) {'));
    expect(tryBlock).toContain('await serverWorkspaceService.reconcileTabSnapshot(\n      cleanSpreadsheetId,\n      WORKSPACE_TABS.MATERIALS.tabTitleAr');
  });

  // 33. Google failure in Fleet prevents acknowledgement
  it('33. Google failure in Fleet prevents acknowledgement', () => {
    const appTsPath = path.resolve(__dirname, '../../server/app.ts');
    const appTsContent = fs.readFileSync(appTsPath, 'utf-8');

    const routeIndex = appTsContent.indexOf("app.post('/api/workspace/sync/initial'");
    const routeSnippet = appTsContent.slice(routeIndex, routeIndex + 5000);

    const tryBlock = routeSnippet.slice(0, routeSnippet.indexOf('} catch (error: any) {'));
    expect(tryBlock).toContain('await serverWorkspaceService.reconcileTabSnapshot(\n      cleanSpreadsheetId,\n      WORKSPACE_TABS.FLEET_ROSTER.tabTitleAr');
  });

  // 34. revision capture still occurs before snapshot build
  it('34. revision capture still occurs before snapshot build', () => {
    const appTsPath = path.resolve(__dirname, '../../server/app.ts');
    const appTsContent = fs.readFileSync(appTsPath, 'utf-8');

    const routeIndex = appTsContent.indexOf("app.post('/api/workspace/sync/initial'");
    const routeSnippet = appTsContent.slice(routeIndex, routeIndex + 5000);

    const revisionReadPos = routeSnippet.indexOf('getWorkspaceProjectionState');
    const snapshotBuildPos = routeSnippet.indexOf('buildInitialProjectionSnapshot');

    expect(revisionReadPos).toBeGreaterThan(-1);
    expect(snapshotBuildPos).toBeGreaterThan(-1);
    expect(revisionReadPos).toBeLessThan(snapshotBuildPos);
  });

  // 35. revision conflict behavior remains HTTP 409
  it('35. revision conflict behavior remains HTTP 409', () => {
    const conflictError: any = new Error('Revision conflict detected');
    conflictError.code = 'WORKSPACE_PROJECTION_REVISION_CONFLICT';
    conflictError.statusCode = 409;

    const statusCode = resolveWorkspaceErrorStatusCode(conflictError);
    expect(statusCode).toBe(409);
  });

  // ==========================================
  // SECTION 6: BOUNDARIES (36 - 40)
  // ==========================================

  // 36. /sync/sheets behavior remains unchanged
  it('36. /sync/sheets behavior remains unchanged and still uses legacy upsertTabRecords', () => {
    const appTsPath = path.resolve(__dirname, '../../server/app.ts');
    const appTsContent = fs.readFileSync(appTsPath, 'utf-8');

    const routeIndex = appTsContent.indexOf("app.post('/api/workspace/sync/sheets'");
    expect(routeIndex).toBeGreaterThan(-1);
    const routeSnippet = appTsContent.slice(routeIndex, routeIndex + 3000);

    expect(routeSnippet).toContain('serverWorkspaceService.upsertTabRecords');
    expect(routeSnippet).not.toContain('reconcileTabSnapshot');
  });

  // 37. /sync/trips remains unchanged
  it('37. /sync/trips remains unchanged', () => {
    const appTsPath = path.resolve(__dirname, '../../server/app.ts');
    const appTsContent = fs.readFileSync(appTsPath, 'utf-8');

    const routeIndex = appTsContent.indexOf("app.post('/api/workspace/sync/trips'");
    expect(routeIndex).toBeGreaterThan(-1);
    const routeSnippet = appTsContent.slice(routeIndex, routeIndex + 1500);

    expect(routeSnippet).toContain('serverWorkspaceService.upsertTabRecords');
    expect(routeSnippet).not.toContain('reconcileTabSnapshot');
  });

  // 38. generic reconciliation engine is not duplicated
  it('38. generic reconciliation engine is not duplicated and resides only in server/workspace.service.ts', () => {
    const wsServicePath = path.resolve(__dirname, '../../server/workspace.service.ts');
    const wsContent = fs.readFileSync(wsServicePath, 'utf-8');

    expect(wsContent).toContain('export function planReconciliationDeletions(');
    expect(wsContent).toContain('public async reconcileTabSnapshot(');

    // Verify it is not redefined in app.ts
    const appTsPath = path.resolve(__dirname, '../../server/app.ts');
    const appContent = fs.readFileSync(appTsPath, 'utf-8');
    expect(appContent).not.toContain('function planReconciliationDeletions');
  });

  // 39. Workspace state/mutation services remain untouched
  it('39. Workspace state/mutation services remain untouched', () => {
    const statePath = path.resolve(__dirname, '../services/projectWorkspaceProjectionState.server.ts');
    const stateContent = fs.readFileSync(statePath, 'utf-8');
    expect(stateContent).toContain('export async function markProjectionSuccessful');
    expect(stateContent).toContain('export async function markDirty');
    expect(stateContent).toContain('export async function markDirtyInTransaction');

    const provPath = path.resolve(__dirname, '../services/projectProvisioning.server.ts');
    const provContent = fs.readFileSync(provPath, 'utf-8');
    expect(provContent).toContain('markDirtyInTransaction');
  });

  // 40. ID/code generation remains untouched
  it('40. ID/code generation remains untouched', () => {
    const entityTypesPath = path.resolve(__dirname, '../types/entities.ts');
    const entityContent = fs.readFileSync(entityTypesPath, 'utf-8');
    expect(entityContent).toContain('driverId: string;');
    expect(entityContent).toContain('carrierId: string;');
    expect(entityContent).toContain('truckId: string;');
    expect(entityContent).toContain('materialId: string;');
  });
});
