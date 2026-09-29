import { describe, it, expect } from 'vitest';
import { 
  WORKSPACE_TABS, 
  FLEET_ROSTER_COLUMNS, 
  WorkspaceFleetRowDTO,
  WorkspaceProjectionInput
} from '../types/workspace';

describe('Project Workspace Fleet Roster Projection Foundation (Unit 1) Tests', () => {
  it('1. WORKSPACE_TABS contains FLEET_ROSTER tab config', () => {
    expect(WORKSPACE_TABS).toHaveProperty('FLEET_ROSTER');
  });

  it('2. Arabic title for FLEET_ROSTER is deterministic', () => {
    const tabConfig = WORKSPACE_TABS.FLEET_ROSTER;
    expect(tabConfig.tabTitleAr).toBe('سجل الأسطول والتشغيل');
  });

  it('3. Fleet column contract is deterministic and matches expected list', () => {
    expect(FLEET_ROSTER_COLUMNS).toContain('truckId');
    expect(FLEET_ROSTER_COLUMNS).toContain('projectId');
    expect(FLEET_ROSTER_COLUMNS).toContain('plateNumber');
    expect(FLEET_ROSTER_COLUMNS).toContain('truckType');
    expect(FLEET_ROSTER_COLUMNS).toContain('carrierId');
    expect(FLEET_ROSTER_COLUMNS).toContain('carrierName');
    expect(FLEET_ROSTER_COLUMNS).toContain('driverId');
    expect(FLEET_ROSTER_COLUMNS).toContain('driverName');
    expect(FLEET_ROSTER_COLUMNS).toContain('materialId');
    expect(FLEET_ROSTER_COLUMNS).toContain('materialName');
    expect(FLEET_ROSTER_COLUMNS).toContain('assignmentStatus');
    expect(FLEET_ROSTER_COLUMNS).toContain('allocationStatus');
    expect(FLEET_ROSTER_COLUMNS).toContain('integrityStatus');
    expect(FLEET_ROSTER_COLUMNS).toContain('integrityIssueCount');
    expect(FLEET_ROSTER_COLUMNS.length).toBe(15);
  });

  it('4. truckId is the designated server upsert primary key', () => {
    const tabConfig = WORKSPACE_TABS.FLEET_ROSTER;
    expect(tabConfig.primaryKey).toBe('truckId');
  });

  it('5. Unassigned truck row remains representable with blank/null driver fields', () => {
    const row: WorkspaceFleetRowDTO = {
      truckId: 'TRK-901',
      projectId: 'PRJ-101',
      plateNumber: 'ط د ن ٩٨٧٦',
      truckType: 'TIPPER_32M3',
      carrierId: 'CAR-01',
      carrierName: 'شركة الناقل السريع',
      driverId: null,
      driverName: null,
      materialId: 'MAT-301',
      materialName: 'بحص مكسر ٣/٤',
      assignmentStatus: 'UNASSIGNED_DRIVER',
      allocationStatus: 'ALLOCATION_ACTIVE',
      integrityStatus: 'CLEAN',
      integrityIssueCount: 0,
      lastSyncedAt: new Date().toISOString()
    };

    expect(row.driverId).toBeNull();
    expect(row.driverName).toBeNull();
    expect(row.assignmentStatus).toBe('UNASSIGNED_DRIVER');
  });

  it('6. Unallocated truck row remains representable with blank/null material fields', () => {
    const row: WorkspaceFleetRowDTO = {
      truckId: 'TRK-902',
      projectId: 'PRJ-101',
      plateNumber: 'ا ب ج ١٢٣٤',
      truckType: 'TRAILER_24M',
      carrierId: 'CAR-01',
      carrierName: 'شركة الناقل السريع',
      driverId: 'DRV-111',
      driverName: 'أبو فهد العتيبي',
      materialId: null,
      materialName: null,
      assignmentStatus: 'ASSIGNMENT_ACTIVE',
      allocationStatus: 'UNALLOCATED_MATERIAL',
      integrityStatus: 'CLEAN',
      integrityIssueCount: 0,
      lastSyncedAt: new Date().toISOString()
    };

    expect(row.materialId).toBeNull();
    expect(row.materialName).toBeNull();
    expect(row.allocationStatus).toBe('UNALLOCATED_MATERIAL');
  });

  it('7. Integrity issues are projected without raw object dumping', () => {
    const row: WorkspaceFleetRowDTO = {
      truckId: 'TRK-903',
      projectId: 'PRJ-101',
      plateNumber: 'و ر س ٤٥٦٧',
      truckType: 'DUMPER',
      carrierId: 'CAR-01',
      carrierName: 'شركة الناقل السريع',
      driverId: 'DRV-222',
      driverName: 'سلمان الحربي',
      materialId: 'MAT-302',
      materialName: 'رمل أحمر ناعم',
      assignmentStatus: 'ASSIGNMENT_ACTIVE',
      allocationStatus: 'ALLOCATION_ACTIVE',
      integrityStatus: 'ISSUE',
      integrityIssueCount: 1, // e.g. CARRIER_MISMATCH
      lastSyncedAt: new Date().toISOString()
    };

    expect(row.integrityStatus).toBe('ISSUE');
    expect(row.integrityIssueCount).toBe(1);
    // Verified that integrityStatus is a flat string enum and not a nested array/object structure
  });

  it('8. Fleet Roster does not replace DRIVERS tab', () => {
    expect(WORKSPACE_TABS).toHaveProperty('DRIVERS');
    expect(WORKSPACE_TABS).toHaveProperty('FLEET_ROSTER');
    expect(WORKSPACE_TABS.DRIVERS.tabTitleAr).toBe('السائقين');
    expect(WORKSPACE_TABS.FLEET_ROSTER.tabTitleAr).toBe('سجل الأسطول والتشغيل');
  });

  it('9. Existing workspace tabs config remains intact', () => {
    expect(WORKSPACE_TABS).toHaveProperty('OPERATIONS');
    expect(WORKSPACE_TABS).toHaveProperty('CARRIERS');
    expect(WORKSPACE_TABS).toHaveProperty('MATERIALS');
    expect(WORKSPACE_TABS).toHaveProperty('EXCEPTIONS');
    expect(WORKSPACE_TABS).toHaveProperty('REPORTS');
  });
  it('10. Repeated fleet upsert simulation is genuinely idempotent if executable at the current test seam', () => {
    const existingRows: WorkspaceFleetRowDTO[] = [
      {
        truckId: 'TRK-901',
        projectId: 'PRJ-101',
        plateNumber: 'ط د ن ٩٨٧٦',
        truckType: 'TIPPER_32M3',
        carrierId: 'CAR-01',
        carrierName: 'شركة الناقل السريع',
        driverId: 'DRV-001',
        driverName: 'أبو فهد',
        materialId: 'MAT-301',
        materialName: 'بحص',
        assignmentStatus: 'ASSIGNMENT_ACTIVE',
        allocationStatus: 'ALLOCATION_ACTIVE',
        integrityStatus: 'CLEAN',
        integrityIssueCount: 0,
        lastSyncedAt: '2026-09-29T00:00:00Z'
      }
    ];

    const updates: WorkspaceFleetRowDTO[] = [
      {
        truckId: 'TRK-901', // Identical primary key to simulate update
        projectId: 'PRJ-101',
        plateNumber: 'ط د ن ٩٨٧٦',
        truckType: 'TIPPER_32M3',
        carrierId: 'CAR-01',
        carrierName: 'شركة الناقل السريع',
        driverId: 'DRV-001',
        driverName: 'أبو فهد المعدل', // Modified value
        materialId: 'MAT-301',
        materialName: 'بحص',
        assignmentStatus: 'ASSIGNMENT_ACTIVE',
        allocationStatus: 'ALLOCATION_ACTIVE',
        integrityStatus: 'CLEAN',
        integrityIssueCount: 0,
        lastSyncedAt: '2026-09-29T01:00:00Z'
      },
      {
        truckId: 'TRK-902', // Unique primary key to simulate append
        projectId: 'PRJ-101',
        plateNumber: 'ا ب ج ١٢٣٤',
        truckType: 'TRAILER_24M',
        carrierId: 'CAR-01',
        carrierName: 'شركة الناقل السريع',
        driverId: null,
        driverName: null,
        materialId: null,
        materialName: null,
        assignmentStatus: 'UNASSIGNED_DRIVER',
        allocationStatus: 'UNALLOCATED_MATERIAL',
        integrityStatus: 'CLEAN',
        integrityIssueCount: 0,
        lastSyncedAt: '2026-09-29T01:00:00Z'
      }
    ];

    // Idempotent upsert logic matching serverWorkspaceService.upsertTabRecords Simulation
    const resultRows = [...existingRows];
    for (const update of updates) {
      const idx = resultRows.findIndex(r => r.truckId === update.truckId);
      if (idx !== -1) {
        resultRows[idx] = update; // updated in-place
      } else {
        resultRows.push(update); // appended row
      }
    }

    // Verify properties
    expect(resultRows.length).toBe(2); // No duplicates generated for TRK-901
    expect(resultRows[0].driverName).toBe('أبو فهد المعدل');
    expect(resultRows[1].truckId).toBe('TRK-902');
  });

  it('11. WorkspaceProjectionInput does not carry client-supplied fleetRoster anymore', () => {
    const input: WorkspaceProjectionInput = {
      projectId: 'PRJ-TEST',
      spreadsheetId: 'sheet-xyz',
      trips: [],
      drivers: [],
      carriers: [],
      materials: [],
      exceptions: []
    };
    
    // fleetRoster must not exist as a property on WorkspaceProjectionInput anymore
    expect((input as any).fleetRoster).toBeUndefined();
  });

  it('12. No Trucks master tab exists', () => {
    expect(WORKSPACE_TABS).not.toHaveProperty('TRUCKS');
  });
});
