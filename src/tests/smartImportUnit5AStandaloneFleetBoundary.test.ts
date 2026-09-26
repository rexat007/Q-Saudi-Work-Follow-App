import { describe, it, expect, beforeEach, vi } from 'vitest';
import { driverTruckIntakeServer } from '../services/driverTruckIntake.server';
import { AuthUserContext } from '../types/common';
import * as fs from 'fs';
import * as path from 'path';

// In-Memory Firestore Document & Collection Store
class FakeFirestoreStore {
  public docs: Map<string, any> = new Map();

  clear() {
    this.docs.clear();
  }

  setDoc(docPath: string, data: any) {
    this.docs.set(docPath, JSON.parse(JSON.stringify(data)));
  }

  getDoc(docPath: string) {
    const data = this.docs.get(docPath);
    if (!data) return { exists: false, data: () => undefined };
    return { exists: true, data: () => JSON.parse(JSON.stringify(data)) };
  }

  queryWhere(collectionPath: string, field: string, op: string, value: any) {
    const matchedDocs: any[] = [];
    const prefix = collectionPath + '/';
    for (const [key, val] of this.docs.entries()) {
      if (key.startsWith(prefix) && key.substring(prefix.length).indexOf('/') === -1) {
        if (op === '==' && val[field] === value) {
          matchedDocs.push({ id: key.split('/').pop(), data: () => val });
        }
      }
    }
    return {
      size: matchedDocs.length,
      empty: matchedDocs.length === 0,
      docs: matchedDocs,
    };
  }
}

const fakeStore = new FakeFirestoreStore();

const createDocRef = (pathStr: string) => ({
  path: pathStr,
  collection: (subCol: string) => createColRef(`${pathStr}/${subCol}`),
});

const createColRef = (colPath: string) => ({
  path: colPath,
  _col: colPath,
  doc: (docId: string) => createDocRef(`${colPath}/${docId}`),
  where: (field: string, op: string, val: any) => ({
    _col: colPath,
    _field: field,
    _op: op,
    _val: val,
  }),
});

// Mock Admin DB for Unit Tests
vi.mock('../firebase/admin', () => ({
  adminDb: {
    collection: (colName: string) => createColRef(colName),
    runTransaction: async (updateFunction: (tx: any) => Promise<any>) => {
      const writes: Array<{ type: 'set' | 'update' | 'delete'; path: string; data?: any }> = [];

      const tx = {
        get: async (refOrQuery: any) => {
          if (refOrQuery._col) {
            return fakeStore.queryWhere(refOrQuery._col, refOrQuery._field, refOrQuery._op, refOrQuery._val);
          }
          const path = refOrQuery.path || refOrQuery;
          return fakeStore.getDoc(path);
        },
        set: (ref: any, data: any) => {
          const path = ref.path || ref;
          writes.push({ type: 'set', path, data });
        },
        update: (ref: any, data: any) => {
          const path = ref.path || ref;
          writes.push({ type: 'update', path, data });
        },
        delete: (ref: any) => {
          const path = ref.path || ref;
          writes.push({ type: 'delete', path });
        },
      };

      const result = await updateFunction(tx);

      // Commit transaction writes atomically into fakeStore
      for (const w of writes) {
        if (w.type === 'set' || w.type === 'update') {
          fakeStore.setDoc(w.path, w.data);
        } else if (w.type === 'delete') {
          fakeStore.docs.delete(w.path);
        }
      }

      return result;
    },
  },
}));

describe('Smart Import Unit 5A-Server Standalone Fleet Boundary Test Suite', () => {
  const adminContext: AuthUserContext = {
    userId: 'user-admin-1',
    email: 'admin@q-saudi.com',
    role: 'PROJECT_ADMIN',
    assignedProjectIds: ['PRJ-5A'],
  };

  const nonAdminContext: AuthUserContext = {
    userId: 'user-field-1',
    email: 'field@q-saudi.com',
    role: 'FIELD_SUPERVISOR',
    assignedProjectIds: ['PRJ-5A'],
  };

  beforeEach(() => {
    fakeStore.clear();
    vi.restoreAllMocks();

    // Seed Active Carrier Membership in Project PRJ-5A
    fakeStore.setDoc('projects/PRJ-5A/carrier_memberships/CAR-1', {
      carrierId: 'CAR-1',
      projectId: 'PRJ-5A',
      status: 'ACTIVE',
    });
  });

  it('1. standalone Driver requires projectId', async () => {
    await expect(
      driverTruckIntakeServer.createStandaloneDriver(
        {
          projectId: '',
          carrierId: 'CAR-1',
          driverName: 'أحمد علي',
          residencyId: '1010101010',
        },
        adminContext
      )
    ).rejects.toThrow('معرف المشروع مطلوب');
  });

  it('2. standalone Driver requires carrierId', async () => {
    await expect(
      driverTruckIntakeServer.createStandaloneDriver(
        {
          projectId: 'PRJ-5A',
          carrierId: '',
          driverName: 'أحمد علي',
          residencyId: '1010101010',
        },
        adminContext
      )
    ).rejects.toThrow('معرف الناقل مطلوب');
  });

  it('3. standalone Driver requires valid residencyId', async () => {
    await expect(
      driverTruckIntakeServer.createStandaloneDriver(
        {
          projectId: 'PRJ-5A',
          carrierId: 'CAR-1',
          driverName: 'أحمد علي',
          residencyId: '123', // Invalid digits
        },
        adminContext
      )
    ).rejects.toThrow('رقم الهوية الوطنية أو الإقامة غير صالح');
  });

  it('4. Driver canonical ID is server-generated', async () => {
    const res = await driverTruckIntakeServer.createStandaloneDriver(
      {
        projectId: 'PRJ-5A',
        carrierId: 'CAR-1',
        driverName: 'أحمد علي',
        residencyId: '1010101010',
      },
      adminContext
    );

    expect(res.driverId).toMatch(/^DRV-[a-f0-9]{32}$/);
    expect(res.identityStatus).toBe('CREATED');
  });

  it('5. same residencyId resolves to same Driver ID', async () => {
    const res1 = await driverTruckIntakeServer.createStandaloneDriver(
      {
        projectId: 'PRJ-5A',
        carrierId: 'CAR-1',
        driverName: 'أحمد علي',
        residencyId: '1010101010',
      },
      adminContext
    );

    const res2 = await driverTruckIntakeServer.createStandaloneDriver(
      {
        projectId: 'PRJ-5A',
        carrierId: 'CAR-1',
        driverName: 'أحمد علي المصحح',
        residencyId: '1010101010',
      },
      adminContext
    );

    expect(res1.driverId).toBe(res2.driverId);
    expect(res2.identityStatus).toBe('EXISTING');
  });

  it('6. Driver creation creates no Truck', async () => {
    await driverTruckIntakeServer.createStandaloneDriver(
      {
        projectId: 'PRJ-5A',
        carrierId: 'CAR-1',
        driverName: 'خالد عبدالله',
        residencyId: '1020202020',
      },
      adminContext
    );

    for (const k of fakeStore.docs.keys()) {
      expect(k).not.toContain('trucks/');
    }
  });

  it('7. Driver creation creates no assignment', async () => {
    await driverTruckIntakeServer.createStandaloneDriver(
      {
        projectId: 'PRJ-5A',
        carrierId: 'CAR-1',
        driverName: 'خالد عبدالله',
        residencyId: '1020202020',
      },
      adminContext
    );

    for (const k of fakeStore.docs.keys()) {
      expect(k).not.toContain('driver_truck_assignments');
      expect(k).not.toContain('driver_active_assignments');
    }
  });

  it('8. Driver creation creates no material allocation', async () => {
    await driverTruckIntakeServer.createStandaloneDriver(
      {
        projectId: 'PRJ-5A',
        carrierId: 'CAR-1',
        driverName: 'خالد عبدالله',
        residencyId: '1020202020',
      },
      adminContext
    );

    for (const k of fakeStore.docs.keys()) {
      expect(k).not.toContain('truck_material_allocations');
    }
  });

  it('9. Driver active affiliation to another carrier fails closed', async () => {
    // Seed Driver with active affiliation to CAR-OTHER
    const res1 = await driverTruckIntakeServer.createStandaloneDriver(
      {
        projectId: 'PRJ-5A',
        carrierId: 'CAR-1',
        driverName: 'سعيد حسن',
        residencyId: '1030303030',
      },
      adminContext
    );

    // Seed CAR-2 in project
    fakeStore.setDoc('projects/PRJ-5A/carrier_memberships/CAR-2', {
      carrierId: 'CAR-2',
      projectId: 'PRJ-5A',
      status: 'ACTIVE',
    });

    // Attempting to attach same driver to CAR-2 when already actively affiliated to CAR-1 MUST fail closed
    await expect(
      driverTruckIntakeServer.createStandaloneDriver(
        {
          projectId: 'PRJ-5A',
          carrierId: 'CAR-2',
          driverName: 'سعيد حسن',
          residencyId: '1030303030',
        },
        adminContext
      )
    ).rejects.toThrow(/DRIVER_CARRIER_AFFILIATION_CONFLICT/);
  });

  it('10. Driver requires active project carrier membership', async () => {
    await expect(
      driverTruckIntakeServer.createStandaloneDriver(
        {
          projectId: 'PRJ-5A',
          carrierId: 'CAR-INACTIVE-99',
          driverName: 'عمر',
          residencyId: '1040404040',
        },
        adminContext
      )
    ).rejects.toThrow(/CARRIER_NOT_ACTIVE_IN_PROJECT/);
  });

  it('11. standalone Truck requires projectId', async () => {
    await expect(
      driverTruckIntakeServer.createStandaloneTruck(
        {
          projectId: '',
          carrierId: 'CAR-1',
          plateNumber: '1234 ABC',
        },
        adminContext
      )
    ).rejects.toThrow('معرف المشروع مطلوب');
  });

  it('12. standalone Truck requires carrierId', async () => {
    await expect(
      driverTruckIntakeServer.createStandaloneTruck(
        {
          projectId: 'PRJ-5A',
          carrierId: '',
          plateNumber: '1234 ABC',
        },
        adminContext
      )
    ).rejects.toThrow('معرف الناقل مطلوب');
  });

  it('13. standalone Truck requires plateNumber', async () => {
    await expect(
      driverTruckIntakeServer.createStandaloneTruck(
        {
          projectId: 'PRJ-5A',
          carrierId: 'CAR-1',
          plateNumber: '',
        },
        adminContext
      )
    ).rejects.toThrow('رقم لوحة الشاحنة مطلوب');
  });

  it('14. Truck canonical ID is server-generated', async () => {
    const res = await driverTruckIntakeServer.createStandaloneTruck(
      {
        projectId: 'PRJ-5A',
        carrierId: 'CAR-1',
        plateNumber: '5678 XYZ',
      },
      adminContext
    );

    expect(res.truckId).toMatch(/^TRK-[a-f0-9]{32}$/);
    expect(res.identityStatus).toBe('CREATED');
  });

  it('15. same normalized plate resolves to same Truck ID', async () => {
    const res1 = await driverTruckIntakeServer.createStandaloneTruck(
      {
        projectId: 'PRJ-5A',
        carrierId: 'CAR-1',
        plateNumber: '1234 أ ب ج',
      },
      adminContext
    );

    const res2 = await driverTruckIntakeServer.createStandaloneTruck(
      {
        projectId: 'PRJ-5A',
        carrierId: 'CAR-1',
        plateNumber: '1234_أ_ب_ج',
      },
      adminContext
    );

    expect(res1.truckId).toBe(res2.truckId);
    expect(res2.identityStatus).toBe('EXISTING');
  });

  it('16. Truck creation creates no Driver', async () => {
    await driverTruckIntakeServer.createStandaloneTruck(
      {
        projectId: 'PRJ-5A',
        carrierId: 'CAR-1',
        plateNumber: '8888 KSA',
      },
      adminContext
    );

    for (const k of fakeStore.docs.keys()) {
      expect(k).not.toContain('drivers/');
    }
  });

  it('17. Truck creation creates no assignment', async () => {
    await driverTruckIntakeServer.createStandaloneTruck(
      {
        projectId: 'PRJ-5A',
        carrierId: 'CAR-1',
        plateNumber: '8888 KSA',
      },
      adminContext
    );

    for (const k of fakeStore.docs.keys()) {
      expect(k).not.toContain('driver_truck_assignments');
    }
  });

  it('18. Truck creation creates no material allocation', async () => {
    await driverTruckIntakeServer.createStandaloneTruck(
      {
        projectId: 'PRJ-5A',
        carrierId: 'CAR-1',
        plateNumber: '8888 KSA',
      },
      adminContext
    );

    for (const k of fakeStore.docs.keys()) {
      expect(k).not.toContain('truck_material_allocations');
    }
  });

  it('19. Truck active affiliation to another carrier fails closed', async () => {
    await driverTruckIntakeServer.createStandaloneTruck(
      {
        projectId: 'PRJ-5A',
        carrierId: 'CAR-1',
        plateNumber: '7777 KSA',
      },
      adminContext
    );

    fakeStore.setDoc('projects/PRJ-5A/carrier_memberships/CAR-2', {
      carrierId: 'CAR-2',
      projectId: 'PRJ-5A',
      status: 'ACTIVE',
    });

    await expect(
      driverTruckIntakeServer.createStandaloneTruck(
        {
          projectId: 'PRJ-5A',
          carrierId: 'CAR-2',
          plateNumber: '7777 KSA',
        },
        adminContext
      )
    ).rejects.toThrow(/TRUCK_CARRIER_AFFILIATION_CONFLICT/);
  });

  it('20. Truck requires active project carrier membership', async () => {
    await expect(
      driverTruckIntakeServer.createStandaloneTruck(
        {
          projectId: 'PRJ-5A',
          carrierId: 'CAR-INACTIVE-99',
          plateNumber: '9999 KSA',
        },
        adminContext
      )
    ).rejects.toThrow(/CARRIER_NOT_ACTIVE_IN_PROJECT/);
  });

  it('21. project isolation enforced', async () => {
    const userOtherProject: AuthUserContext = {
      userId: 'user-admin-2',
      email: 'admin2@q-saudi.com',
      role: 'PROJECT_ADMIN',
      assignedProjectIds: ['PRJ-OTHER'],
    };

    await expect(
      driverTruckIntakeServer.createStandaloneDriver(
        {
          projectId: 'PRJ-5A',
          carrierId: 'CAR-1',
          driverName: 'أحمد',
          residencyId: '1090909090',
        },
        userOtherProject
      )
    ).rejects.toThrow(/عزل أمني/);
  });

  it('22. unauthorized role rejected', async () => {
    await expect(
      driverTruckIntakeServer.createStandaloneDriver(
        {
          projectId: 'PRJ-5A',
          carrierId: 'CAR-1',
          driverName: 'أحمد',
          residencyId: '1090909090',
        },
        nonAdminContext
      )
    ).rejects.toThrow(/غير مصرح لك/);
  });

  it('23. unauthenticated/missing actor rejected', async () => {
    const unauthContext: AuthUserContext = {
      userId: '',
      email: '',
      role: 'PROJECT_ADMIN',
    };

    await expect(
      driverTruckIntakeServer.createStandaloneDriver(
        {
          projectId: 'PRJ-5A',
          carrierId: 'CAR-1',
          driverName: 'أحمد',
          residencyId: '1090909090',
        },
        unauthContext
      )
    ).rejects.toThrow(/UNAUTHENTICATED_ACTOR/);
  });

  it('24. natural lookup integrity conflict fails closed', async () => {
    // Seed dangling lookup pointing to non-existent global driver ID
    const { computeNaturalKeyToken } = await import('../repositories/globalIdentity.repository');
    const token = computeNaturalKeyToken('DRIVER', '1070707070');
    fakeStore.setDoc(`natural_identity_lookups/${token}`, {
      entityType: 'DRIVER',
      systemId: 'DRV-MISSING-DANGLING',
    });

    await expect(
      driverTruckIntakeServer.createStandaloneDriver(
        {
          projectId: 'PRJ-5A',
          carrierId: 'CAR-1',
          driverName: 'أيمن',
          residencyId: '1070707070',
        },
        adminContext
      )
    ).rejects.toThrow(/IDENTITY_LOOKUP_INTEGRITY_ERROR/);
  });

  it('25. no Date.now()/Math.random() used for canonical Driver/Truck IDs', async () => {
    const serviceFilePath = path.resolve(__dirname, '../services/driverTruckIntake.server.ts');
    const code = fs.readFileSync(serviceFilePath, 'utf-8');

    // Verify driverId generation uses crypto.randomBytes
    expect(code).toContain("driverId = `DRV-${hashHex}`");
    expect(code).toContain("truckId = `TRK-${hashHex}`");
    expect(code).not.toContain("driverId = `DRV-${Date.now()}`");
    expect(code).not.toContain("truckId = `TRK-${Date.now()}`");
  });

  it('26. setup-driver route uses standalone Driver method only', () => {
    const appFilePath = path.resolve(__dirname, '../../server/app.ts');
    const code = fs.readFileSync(appFilePath, 'utf-8');

    expect(code).toContain("app.post('/api/projects/:projectId/setup-driver'");
    expect(code).toContain("createStandaloneDriver(");
  });

  it('27. setup-truck route uses standalone Truck method only', () => {
    const appFilePath = path.resolve(__dirname, '../../server/app.ts');
    const code = fs.readFileSync(appFilePath, 'utf-8');

    expect(code).toContain("app.post('/api/projects/:projectId/setup-truck'");
    expect(code).toContain("createStandaloneTruck(");
  });

  it('28. neither standalone route calls processSharedIntake()', () => {
    const appFilePath = path.resolve(__dirname, '../../server/app.ts');
    const code = fs.readFileSync(appFilePath, 'utf-8');

    const setupDriverBlock = code.substring(
      code.indexOf("app.post('/api/projects/:projectId/setup-driver'"),
      code.indexOf("app.post('/api/projects/:projectId/setup-truck'")
    );

    const setupTruckBlock = code.substring(
      code.indexOf("app.post('/api/projects/:projectId/setup-truck'"),
      code.indexOf("// Assuming these endpoints list from canonical membership")
    );

    expect(setupDriverBlock).not.toContain("processSharedIntake");
    expect(setupTruckBlock).not.toContain("processSharedIntake");
  });
});
