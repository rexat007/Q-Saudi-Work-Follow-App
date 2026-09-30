import { describe, it, expect } from 'vitest';
import { 
  planReconciliationDeletions, 
  buildDeleteDimensionRequests,
  serverWorkspaceService
} from '../../server/workspace.service';
import { WORKSPACE_TABS, FLEET_ROSTER_COLUMNS } from '../types/workspace';
import fs from 'fs';
import path from 'path';

describe('Project Workspace Fleet Roster Unit 2: Stale-Row Reconciliation Tests', () => {
  // Test 1: stale key deleted
  it('1. stale key deleted: unreferenced existing key is identified for deletion', () => {
    const existingRows = [
      ['TRK-ACTIVE', 'Active Truck'],
      ['TRK-STALE', 'Stale Truck'],
    ];
    const authoritativeKeys = new Set(['TRK-ACTIVE']);
    const toDelete = planReconciliationDeletions(existingRows, 0, authoritativeKeys, 2);

    expect(toDelete).toContain(3); // Row 3 (TRK-STALE) must be deleted
  });

  // Test 2: authoritative key retained
  it('2. authoritative key retained: valid existing key in authoritative snapshot is preserved', () => {
    const existingRows = [
      ['TRK-ACTIVE', 'Active Truck'],
      ['TRK-OLD', 'Old Truck'],
    ];
    const authoritativeKeys = new Set(['TRK-ACTIVE']);
    const toDelete = planReconciliationDeletions(existingRows, 0, authoritativeKeys, 2);

    expect(toDelete).not.toContain(2); // Row 2 (TRK-ACTIVE) must NOT be deleted
  });

  // Test 3: duplicate key collapsed
  it('3. duplicate key collapsed: duplicate rows for the same truckId are identified for deletion', () => {
    const existingRows = [
      ['TRK-001', 'First Occurrence'],
      ['TRK-001', 'Duplicate Occurrence'],
    ];
    const authoritativeKeys = new Set(['TRK-001']);
    const toDelete = planReconciliationDeletions(existingRows, 0, authoritativeKeys, 2);

    expect(toDelete.length).toBe(1);
    expect(toDelete).toEqual([3]); // Only row 3 (duplicate) is deleted
  });

  // Test 4: earliest duplicate retained
  it('4. earliest duplicate retained: first occurrence of duplicate key is kept, subsequent occurrences deleted', () => {
    const existingRows = [
      ['TRK-001', 'Row 2 First'],
      ['TRK-002', 'Row 3 First'],
      ['TRK-001', 'Row 4 Duplicate'],
      ['TRK-001', 'Row 5 Duplicate'],
    ];
    const authoritativeKeys = new Set(['TRK-001', 'TRK-002']);
    const toDelete = planReconciliationDeletions(existingRows, 0, authoritativeKeys, 2);

    expect(toDelete).toEqual([5, 4]); // Rows 4 and 5 deleted; Row 2 kept
    expect(toDelete).not.toContain(2);
    expect(toDelete).not.toContain(3);
  });

  // Test 5: descending deletion order
  it('5. descending deletion order: planned deletion row numbers are sorted in descending order for safe bottom-up removal', () => {
    const existingRows = [
      ['TRK-001', 'Kept'],
      ['TRK-STALE-1', 'Delete row 3'],
      ['TRK-002', 'Kept'],
      ['TRK-STALE-2', 'Delete row 5'],
      ['TRK-STALE-3', 'Delete row 6'],
    ];
    const authoritativeKeys = new Set(['TRK-001', 'TRK-002']);
    const toDelete = planReconciliationDeletions(existingRows, 0, authoritativeKeys, 2);

    expect(toDelete).toEqual([6, 5, 3]);
    // Assert strictly descending order
    for (let i = 0; i < toDelete.length - 1; i++) {
      expect(toDelete[i]).toBeGreaterThan(toDelete[i + 1]);
    }
  });

  // Test 6: exact 1-based row → 0-based deleteDimension indexes
  it('6. exact 1-based row → 0-based deleteDimension indexes: converts row numbers using startIndex=row-1, endIndex=row', () => {
    const sheetId = 98765;
    const descendingRows = [5, 3, 2];
    const requests = buildDeleteDimensionRequests(sheetId, descendingRows);

    expect(requests).toHaveLength(3);

    // Row 5 -> startIndex: 4, endIndex: 5
    expect(requests[0]).toEqual({
      deleteDimension: {
        range: {
          sheetId: 98765,
          dimension: 'ROWS',
          startIndex: 4,
          endIndex: 5,
        },
      },
    });

    // Row 3 -> startIndex: 2, endIndex: 3
    expect(requests[1]).toEqual({
      deleteDimension: {
        range: {
          sheetId: 98765,
          dimension: 'ROWS',
          startIndex: 2,
          endIndex: 3,
        },
      },
    });

    // Row 2 -> startIndex: 1, endIndex: 2
    expect(requests[2]).toEqual({
      deleteDimension: {
        range: {
          sheetId: 98765,
          dimension: 'ROWS',
          startIndex: 1,
          endIndex: 2,
        },
      },
    });
  });

  // Test 7: header row protected
  it('7. header row protected: row 1 is never included in deletions and buildDeleteDimensionRequests forbids row <= 1', () => {
    const existingWithHeader = [
      ['truckId', 'plateNumber'],
      ['TRK-001', 'Plate 1'],
    ];
    // Even if row 1 is checked at startRowNumber 1
    const toDelete = planReconciliationDeletions(existingWithHeader, 0, new Set(['TRK-001']), 1);
    expect(toDelete).not.toContain(1);

    expect(() => buildDeleteDimensionRequests(123, [1])).toThrow(/Header row 1/);
    expect(() => buildDeleteDimensionRequests(123, [0])).toThrow(/Header row 1/);
  });

  // Test 8: empty authoritative snapshot deletes all managed rows
  it('8. empty authoritative snapshot deletes all managed rows while leaving unmanaged/blank rows intact', () => {
    const existingRows = [
      ['TRK-001', 'Row 2 managed'],
      ['TRK-002', 'Row 3 managed'],
      ['', 'Row 4 blank/unmanaged'],
      ['TRK-003', 'Row 5 managed'],
    ];
    const emptyAuthoritativeKeys = new Set<string>();
    const toDelete = planReconciliationDeletions(existingRows, 0, emptyAuthoritativeKeys, 2);

    expect(toDelete).toEqual([5, 3, 2]);
    expect(toDelete).not.toContain(4); // Row 4 (blank) preserved
  });

  // Test 9: blank truckId row preserved
  it('9. blank truckId row preserved: rows with undefined, null, or empty whitespace primary keys are not deleted', () => {
    const existingRows = [
      ['', 'Empty string'],
      ['   ', 'Whitespace string'],
      [null, 'Null cell'],
      [undefined, 'Undefined cell'],
      ['TRK-001', 'Valid Truck'],
    ];
    const authoritativeKeys = new Set(['TRK-001']);
    const toDelete = planReconciliationDeletions(existingRows, 0, authoritativeKeys, 2);

    // Rows 2, 3, 4, 5 are blank/unmanaged, Row 6 is TRK-001 (authoritative). Nothing to delete.
    expect(toDelete).toEqual([]);
  });

  // Test 10: route reconciles Fleet even for zero mapped Fleet rows
  it('10. route reconciles Fleet even for zero mapped Fleet rows: reconcileTabSnapshot handles empty records list', async () => {
    // In simulated/no-auth mode, reconcileTabSnapshot accepts an empty authoritativeRecords array
    const result = await serverWorkspaceService.reconcileTabSnapshot(
      'mock_spreadsheet_id',
      WORKSPACE_TABS.FLEET_ROSTER.tabTitleAr,
      'truckId',
      [],
      FLEET_ROSTER_COLUMNS
    );

    expect(result).toBeDefined();
    expect(result.primaryKey).toBe('truckId');
    expect(result.processedCount).toBe(0);
    expect(result.deletedCount).toBeDefined();
    expect(typeof result.deletedCount).toBe('number');
  });

  // Test 11: non-Fleet tabs remain upsert-only
  it('11. non-Fleet tabs remain upsert-only: app.ts only invokes reconcileTabSnapshot for FLEET_ROSTER', () => {
    const appTsPath = path.resolve(__dirname, '../../server/app.ts');
    const appTsContent = fs.readFileSync(appTsPath, 'utf-8');

    // Find occurrences of reconcileTabSnapshot
    const reconcileCalls = appTsContent.match(/reconcileTabSnapshot/g) || [];
    expect(reconcileCalls.length).toBe(1);

    // Verify it is specifically associated with FLEET_ROSTER
    expect(appTsContent).toContain('WORKSPACE_TABS.FLEET_ROSTER.tabTitleAr');
    
    // Verify other tabs use upsertTabRecords
    expect(appTsContent).toContain("WORKSPACE_TABS.OPERATIONS.tabTitleAr,\n        'tripId'");
    expect(appTsContent).toContain("WORKSPACE_TABS.DRIVERS.tabTitleAr,\n        'driverId'");
    expect(appTsContent).toContain("WORKSPACE_TABS.CARRIERS.tabTitleAr,\n        'carrierId'");
    expect(appTsContent).toContain("WORKSPACE_TABS.MATERIALS.tabTitleAr,\n        'materialId'");
    expect(appTsContent).toContain("WORKSPACE_TABS.EXCEPTIONS.tabTitleAr,\n        'exceptionId'");
    expect(appTsContent).toContain("WORKSPACE_TABS.REPORTS.tabTitleAr,\n        'reportCode'");
  });

  // Test 12: no whole-sheet clear/wipe logic introduced
  it('12. no whole-sheet clear/wipe logic introduced: no destructive clear methods used in workspace service', () => {
    const servicePath = path.resolve(__dirname, '../../server/workspace.service.ts');
    const serviceContent = fs.readFileSync(servicePath, 'utf-8');

    expect(serviceContent).not.toContain('values.clear');
    expect(serviceContent).not.toContain('batchClear');
    expect(serviceContent).not.toContain('spreadsheets.sheets.delete');
    expect(serviceContent).not.toContain('deleteSheet');
  });
});
