import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { entityResolutionCommandService } from '../services/import/entityResolutionCommand.service';
import { auth } from '../firebase/config';
import * as fs from 'fs';
import * as path from 'path';

vi.mock('../firebase/config', () => ({
  auth: {
    currentUser: {
      getIdToken: vi.fn().mockResolvedValue('mock_firebase_id_token_unit5a'),
    },
  },
}));

describe('Smart Import Unit 5A Canonical Entity Resolution Command Adapter Test Suite', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
    (auth as any).currentUser = {
      getIdToken: vi.fn().mockResolvedValue('mock_firebase_id_token_unit5a'),
    };
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('1. selectExisting returns supplied canonical ID unchanged', () => {
    const res = entityResolutionCommandService.selectExisting({
      projectId: 'PRJ-NEOM-01',
      entityType: 'CARRIER',
      entityId: 'CAR-12345',
      displayName: 'شركة الناقل المعتمد',
      sourceValue: 'ناقل 1',
    });

    expect(res.matchedId).toBe('CAR-12345');
    expect(res.matchedName).toBe('شركة الناقل المعتمد');
    expect(res.entityType).toBe('CARRIER');
    expect(res.confidence).toBe(1.0);
    expect(res.isExact).toBe(true);
    expect(res.isAuthorized).toBe(true);
  });

  it('2. selectExisting performs zero mutation fetch calls', () => {
    const fetchSpy = vi.fn();
    globalThis.fetch = fetchSpy;

    entityResolutionCommandService.selectExisting({
      projectId: 'PRJ-NEOM-01',
      entityType: 'TRUCK',
      entityId: 'TRK-999',
      displayName: 'شاحنة 1234',
      sourceValue: '1234 أ ب ج',
    });

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('3. carrier create calls correct setup-carrier route', async () => {
    let calledUrl = '';
    let calledMethod = '';

    globalThis.fetch = vi.fn().mockImplementation(async (url: string, options: any) => {
      calledUrl = url;
      calledMethod = options.method;
      return {
        ok: true,
        json: async () => ({
          success: true,
          carrierId: 'CAR-SERVER-777',
        }),
      };
    });

    await entityResolutionCommandService.createCarrier({
      projectId: 'PRJ-NEOM-01',
      sourceValue: 'الناقل العربي',
      carrierData: {
        nameAr: 'الناقل العربي',
        commercialRegistrationNo: '1010123456',
      },
    });

    expect(calledUrl).toBe('/api/projects/PRJ-NEOM-01/setup-carrier');
    expect(calledMethod).toBe('POST');
  });

  it('4. carrier create uses Firebase Bearer token', async () => {
    let calledAuthHeader = '';

    globalThis.fetch = vi.fn().mockImplementation(async (url: string, options: any) => {
      calledAuthHeader = options.headers['Authorization'];
      return {
        ok: true,
        json: async () => ({
          success: true,
          carrierId: 'CAR-SERVER-777',
        }),
      };
    });

    await entityResolutionCommandService.createCarrier({
      projectId: 'PRJ-NEOM-01',
      sourceValue: 'الناقل العربي',
      carrierData: {
        nameAr: 'الناقل العربي',
        commercialRegistrationNo: '1010123456',
      },
    });

    expect(calledAuthHeader).toBe('Bearer mock_firebase_id_token_unit5a');
  });

  it('5. carrier create returns server carrierId', async () => {
    globalThis.fetch = vi.fn().mockImplementation(async () => ({
      ok: true,
      json: async () => ({
        success: true,
        carrierId: 'CAR-SERVER-888',
      }),
    }));

    const res = await entityResolutionCommandService.createCarrier({
      projectId: 'PRJ-NEOM-01',
      sourceValue: 'ناقل الخادم',
      carrierData: {
        nameAr: 'ناقل الخادم',
        commercialRegistrationNo: '1010888888',
      },
    });

    expect(res.matchedId).toBe('CAR-SERVER-888');
    expect(res.matchedName).toBe('ناقل الخادم');
  });

  it('6. missing carrierId fails closed with CANONICAL_ID_MISSING', async () => {
    globalThis.fetch = vi.fn().mockImplementation(async () => ({
      ok: true,
      json: async () => ({
        success: true,
      }),
    }));

    await expect(
      entityResolutionCommandService.createCarrier({
        projectId: 'PRJ-NEOM-01',
        sourceValue: 'ناقل ناقص',
        carrierData: {
          nameAr: 'ناقل ناقص',
          commercialRegistrationNo: '1010999999',
        },
      })
    ).rejects.toThrow('لم يتضمن رد الخادم معرف الناقل المعتمد (carrierId)');

    try {
      await entityResolutionCommandService.createCarrier({
        projectId: 'PRJ-NEOM-01',
        sourceValue: 'ناقل ناقص',
        carrierData: {
          nameAr: 'ناقل ناقص',
          commercialRegistrationNo: '1010999999',
        },
      });
    } catch (err: any) {
      expect(err.code).toBe('CANONICAL_ID_MISSING');
    }
  });

  it('7. material create calls correct setup-material route', async () => {
    let calledUrl = '';
    let calledMethod = '';

    globalThis.fetch = vi.fn().mockImplementation(async (url: string, options: any) => {
      calledUrl = url;
      calledMethod = options.method;
      return {
        ok: true,
        json: async () => ({
          success: true,
          materialId: 'MAT-SERVER-555',
        }),
      };
    });

    await entityResolutionCommandService.createMaterial({
      projectId: 'PRJ-NEOM-01',
      sourceValue: 'رمل ناعم',
      materialData: {
        code: 'SAND_FINE',
        nameAr: 'رمل ناعم',
      },
    });

    expect(calledUrl).toBe('/api/projects/PRJ-NEOM-01/setup-material');
    expect(calledMethod).toBe('POST');
  });

  it('8. material create returns server materialId', async () => {
    globalThis.fetch = vi.fn().mockImplementation(async () => ({
      ok: true,
      json: async () => ({
        success: true,
        materialId: 'MAT-SERVER-333',
      }),
    }));

    const res = await entityResolutionCommandService.createMaterial({
      projectId: 'PRJ-NEOM-01',
      sourceValue: 'حصى',
      materialData: {
        code: 'GRAVEL',
        nameAr: 'حصى',
      },
    });

    expect(res.matchedId).toBe('MAT-SERVER-333');
    expect(res.entityType).toBe('MATERIAL');
  });

  it('9. missing materialId fails closed with CANONICAL_ID_MISSING', async () => {
    globalThis.fetch = vi.fn().mockImplementation(async () => ({
      ok: true,
      json: async () => ({
        success: true,
      }),
    }));

    await expect(
      entityResolutionCommandService.createMaterial({
        projectId: 'PRJ-NEOM-01',
        sourceValue: 'مادة ناقصة',
        materialData: { code: 'MISSING', nameAr: 'مادة ناقصة' },
      })
    ).rejects.toThrow('لم يتضمن رد الخادم معرف المادة المعتمد (materialId)');
  });

  it('10. createDriver calls setup-driver route', async () => {
    let calledUrl = '';
    let calledMethod = '';

    globalThis.fetch = vi.fn().mockImplementation(async (url: string, options: any) => {
      calledUrl = url;
      calledMethod = options.method;
      return {
        ok: true,
        json: async () => ({
          success: true,
          driverId: 'DRV-SERVER-101',
        }),
      };
    });

    await entityResolutionCommandService.createDriver({
      projectId: 'PRJ-NEOM-01',
      sourceValue: 'سائق جديد',
      driverData: {
        carrierId: 'CAR-1',
        driverName: 'أحمد علي',
        residencyId: '1010101010',
      },
    });

    expect(calledUrl).toBe('/api/projects/PRJ-NEOM-01/setup-driver');
    expect(calledMethod).toBe('POST');
  });

  it('11. createDriver sends Firebase Bearer token', async () => {
    let calledAuthHeader = '';

    globalThis.fetch = vi.fn().mockImplementation(async (url: string, options: any) => {
      calledAuthHeader = options.headers['Authorization'];
      return {
        ok: true,
        json: async () => ({
          success: true,
          driverId: 'DRV-SERVER-101',
        }),
      };
    });

    await entityResolutionCommandService.createDriver({
      projectId: 'PRJ-NEOM-01',
      sourceValue: 'سائق جديد',
      driverData: {
        carrierId: 'CAR-1',
        driverName: 'أحمد علي',
        residencyId: '1010101010',
      },
    });

    expect(calledAuthHeader).toBe('Bearer mock_firebase_id_token_unit5a');
  });

  it('12. createDriver body includes driverData only and no projectId in body root', async () => {
    let sentBody: any = null;

    globalThis.fetch = vi.fn().mockImplementation(async (url: string, options: any) => {
      sentBody = JSON.parse(options.body);
      return {
        ok: true,
        json: async () => ({
          success: true,
          driverId: 'DRV-SERVER-101',
        }),
      };
    });

    await entityResolutionCommandService.createDriver({
      projectId: 'PRJ-NEOM-01',
      sourceValue: 'سائق جديد',
      driverData: {
        carrierId: 'CAR-1',
        driverName: 'أحمد علي',
        residencyId: '1010101010',
      },
    });

    expect(sentBody).toEqual({
      driverData: {
        carrierId: 'CAR-1',
        driverName: 'أحمد علي',
        residencyId: '1010101010',
      },
    });
    expect(sentBody.projectId).toBeUndefined();
    expect(sentBody.driverData.projectId).toBeUndefined();
  });

  it('13. createDriver returns server driverId', async () => {
    globalThis.fetch = vi.fn().mockImplementation(async () => ({
      ok: true,
      json: async () => ({
        success: true,
        driverId: 'DRV-SERVER-202',
      }),
    }));

    const res = await entityResolutionCommandService.createDriver({
      projectId: 'PRJ-NEOM-01',
      sourceValue: 'سائق جديد',
      driverData: {
        carrierId: 'CAR-1',
        driverName: 'أحمد علي',
        residencyId: '1010101010',
      },
    });

    expect(res.matchedId).toBe('DRV-SERVER-202');
    expect(res.entityType).toBe('DRIVER');
    expect(res.matchedName).toBe('أحمد علي');
    expect(res.confidence).toBe(1.0);
  });

  it('14. createDriver missing driverId fails with CANONICAL_ID_MISSING', async () => {
    globalThis.fetch = vi.fn().mockImplementation(async () => ({
      ok: true,
      json: async () => ({
        success: true,
      }),
    }));

    await expect(
      entityResolutionCommandService.createDriver({
        projectId: 'PRJ-NEOM-01',
        sourceValue: 'سائق ناقص',
        driverData: {
          carrierId: 'CAR-1',
          driverName: 'سائق',
          residencyId: '1010101010',
        },
      })
    ).rejects.toThrow('لم يتضمن رد الخادم معرف السائق المعتمد (driverId)');

    try {
      await entityResolutionCommandService.createDriver({
        projectId: 'PRJ-NEOM-01',
        sourceValue: 'سائق ناقص',
        driverData: {
          carrierId: 'CAR-1',
          driverName: 'سائق',
          residencyId: '1010101010',
        },
      });
    } catch (err: any) {
      expect(err.code).toBe('CANONICAL_ID_MISSING');
    }
  });

  it('15. createDriver requires carrierId', async () => {
    await expect(
      entityResolutionCommandService.createDriver({
        projectId: 'PRJ-NEOM-01',
        sourceValue: 'سائق',
        driverData: {
          carrierId: '',
          driverName: 'سائق',
          residencyId: '1010101010',
        },
      })
    ).rejects.toThrow('معرف الناقل (carrierId) مطلوب للسائق');
  });

  it('16. createDriver server error preserves deterministic code', async () => {
    globalThis.fetch = vi.fn().mockImplementation(async () => ({
      ok: false,
      status: 400,
      json: async () => ({
        success: false,
        error: 'رقم الإقامة غير صالح',
        code: 'INVALID_RESIDENCY_ID',
      }),
    }));

    try {
      await entityResolutionCommandService.createDriver({
        projectId: 'PRJ-NEOM-01',
        sourceValue: 'سائق',
        driverData: {
          carrierId: 'CAR-1',
          driverName: 'سائق',
          residencyId: '999',
        },
      });
    } catch (err: any) {
      expect(err.code).toBe('INVALID_RESIDENCY_ID');
      expect(err.message).toBe('رقم الإقامة غير صالح');
    }
  });

  it('17. createTruck calls setup-truck route', async () => {
    let calledUrl = '';
    let calledMethod = '';

    globalThis.fetch = vi.fn().mockImplementation(async (url: string, options: any) => {
      calledUrl = url;
      calledMethod = options.method;
      return {
        ok: true,
        json: async () => ({
          success: true,
          truckId: 'TRK-SERVER-301',
        }),
      };
    });

    await entityResolutionCommandService.createTruck({
      projectId: 'PRJ-NEOM-01',
      sourceValue: 'شاحنة جديدة',
      truckData: {
        carrierId: 'CAR-1',
        plateNumber: '1234 ABC',
      },
    });

    expect(calledUrl).toBe('/api/projects/PRJ-NEOM-01/setup-truck');
    expect(calledMethod).toBe('POST');
  });

  it('18. createTruck sends Firebase Bearer token', async () => {
    let calledAuthHeader = '';

    globalThis.fetch = vi.fn().mockImplementation(async (url: string, options: any) => {
      calledAuthHeader = options.headers['Authorization'];
      return {
        ok: true,
        json: async () => ({
          success: true,
          truckId: 'TRK-SERVER-301',
        }),
      };
    });

    await entityResolutionCommandService.createTruck({
      projectId: 'PRJ-NEOM-01',
      sourceValue: 'شاحنة جديدة',
      truckData: {
        carrierId: 'CAR-1',
        plateNumber: '1234 ABC',
      },
    });

    expect(calledAuthHeader).toBe('Bearer mock_firebase_id_token_unit5a');
  });

  it('19. createTruck body includes truckData only and no projectId in request body', async () => {
    let sentBody: any = null;

    globalThis.fetch = vi.fn().mockImplementation(async (url: string, options: any) => {
      sentBody = JSON.parse(options.body);
      return {
        ok: true,
        json: async () => ({
          success: true,
          truckId: 'TRK-SERVER-301',
        }),
      };
    });

    await entityResolutionCommandService.createTruck({
      projectId: 'PRJ-NEOM-01',
      sourceValue: 'شاحنة جديدة',
      truckData: {
        carrierId: 'CAR-1',
        plateNumber: '1234 ABC',
        truckType: 'Tipper',
      },
    });

    expect(sentBody).toEqual({
      truckData: {
        carrierId: 'CAR-1',
        plateNumber: '1234 ABC',
        truckType: 'Tipper',
      },
    });
    expect(sentBody.projectId).toBeUndefined();
    expect(sentBody.truckData.projectId).toBeUndefined();
  });

  it('20. createTruck returns server truckId', async () => {
    globalThis.fetch = vi.fn().mockImplementation(async () => ({
      ok: true,
      json: async () => ({
        success: true,
        truckId: 'TRK-SERVER-404',
      }),
    }));

    const res = await entityResolutionCommandService.createTruck({
      projectId: 'PRJ-NEOM-01',
      sourceValue: 'شاحنة جديدة',
      truckData: {
        carrierId: 'CAR-1',
        plateNumber: '1234 ABC',
      },
    });

    expect(res.matchedId).toBe('TRK-SERVER-404');
    expect(res.entityType).toBe('TRUCK');
    expect(res.matchedName).toBe('1234 ABC');
    expect(res.confidence).toBe(1.0);
  });

  it('21. createTruck missing truckId fails with CANONICAL_ID_MISSING', async () => {
    globalThis.fetch = vi.fn().mockImplementation(async () => ({
      ok: true,
      json: async () => ({
        success: true,
      }),
    }));

    await expect(
      entityResolutionCommandService.createTruck({
        projectId: 'PRJ-NEOM-01',
        sourceValue: 'شاحنة ناقصة',
        truckData: {
          carrierId: 'CAR-1',
          plateNumber: '1234 ABC',
        },
      })
    ).rejects.toThrow('لم يتضمن رد الخادم معرف الشاحنة المعتمد (truckId)');

    try {
      await entityResolutionCommandService.createTruck({
        projectId: 'PRJ-NEOM-01',
        sourceValue: 'شاحنة ناقصة',
        truckData: {
          carrierId: 'CAR-1',
          plateNumber: '1234 ABC',
        },
      });
    } catch (err: any) {
      expect(err.code).toBe('CANONICAL_ID_MISSING');
    }
  });

  it('22. createTruck requires carrierId', async () => {
    await expect(
      entityResolutionCommandService.createTruck({
        projectId: 'PRJ-NEOM-01',
        sourceValue: 'شاحنة',
        truckData: {
          carrierId: '',
          plateNumber: '1234 ABC',
        },
      })
    ).rejects.toThrow('معرف الناقل (carrierId) مطلوب للشاحنة');
  });

  it('23. createTruck server error preserves deterministic code', async () => {
    globalThis.fetch = vi.fn().mockImplementation(async () => ({
      ok: false,
      status: 400,
      json: async () => ({
        success: false,
        error: 'تعارض في تبعية الناقل للشاحنة',
        code: 'TRUCK_CARRIER_AFFILIATION_CONFLICT',
      }),
    }));

    try {
      await entityResolutionCommandService.createTruck({
        projectId: 'PRJ-NEOM-01',
        sourceValue: 'شاحنة',
        truckData: {
          carrierId: 'CAR-2',
          plateNumber: '1234 ABC',
        },
      });
    } catch (err: any) {
      expect(err.code).toBe('TRUCK_CARRIER_AFFILIATION_CONFLICT');
      expect(err.message).toBe('تعارض في تبعية الناقل للشاحنة');
    }
  });

  it('24. adapter source contains no /api/intake/canonical call', () => {
    const serviceFilePath = path.resolve(__dirname, '../services/import/entityResolutionCommand.service.ts');
    const code = fs.readFileSync(serviceFilePath, 'utf-8');

    expect(code).not.toContain('/api/intake/canonical');
  });

  it('25. adapter still contains no firebase/firestore import', () => {
    const serviceFilePath = path.resolve(__dirname, '../services/import/entityResolutionCommand.service.ts');
    const code = fs.readFileSync(serviceFilePath, 'utf-8');

    expect(code).not.toContain('firebase/firestore');
    expect(code).not.toContain('getFirestore');
    expect(code).not.toContain('collection(');
    expect(code).not.toContain('doc(');
  });

  it('26. adapter generates no canonical IDs locally', () => {
    const serviceFilePath = path.resolve(__dirname, '../services/import/entityResolutionCommand.service.ts');
    const code = fs.readFileSync(serviceFilePath, 'utf-8');

    expect(code).not.toContain('Date.now()');
    expect(code).not.toContain('Math.random()');
    expect(code).not.toContain('crypto.randomUUID()');
  });

  it('27. Driver/Truck successful confidence remains exactly 1.0', async () => {
    globalThis.fetch = vi.fn().mockImplementation(async () => ({
      ok: true,
      json: async () => ({
        success: true,
        driverId: 'DRV-1',
        truckId: 'TRK-1',
      }),
    }));

    const drvRes = await entityResolutionCommandService.createDriver({
      projectId: 'PRJ-1',
      sourceValue: 'D1',
      driverData: { carrierId: 'CAR-1', driverName: 'D1', residencyId: '1010101010' },
    });

    const trkRes = await entityResolutionCommandService.createTruck({
      projectId: 'PRJ-1',
      sourceValue: 'T1',
      truckData: { carrierId: 'CAR-1', plateNumber: 'T1' },
    });

    expect(drvRes.confidence).toBe(1.0);
    expect(trkRes.confidence).toBe(1.0);
  });

  it('28. unauthenticated Driver/Truck creation fails UNAUTHENTICATED', async () => {
    (auth as any).currentUser = null;

    await expect(
      entityResolutionCommandService.createDriver({
        projectId: 'PRJ-1',
        sourceValue: 'D1',
        driverData: { carrierId: 'CAR-1', driverName: 'D1', residencyId: '1010101010' },
      })
    ).rejects.toThrow('المستخدم غير موثق');

    await expect(
      entityResolutionCommandService.createTruck({
        projectId: 'PRJ-1',
        sourceValue: 'T1',
        truckData: { carrierId: 'CAR-1', plateNumber: 'T1' },
      })
    ).rejects.toThrow('المستخدم غير موثق');
  });

  it('29. projectId required for Driver/Truck creation', async () => {
    await expect(
      entityResolutionCommandService.createDriver({
        projectId: '',
        sourceValue: 'D1',
        driverData: { carrierId: 'CAR-1', driverName: 'D1', residencyId: '1010101010' },
      })
    ).rejects.toThrow('معرف المشروع مطلوب');

    await expect(
      entityResolutionCommandService.createTruck({
        projectId: '',
        sourceValue: 'T1',
        truckData: { carrierId: 'CAR-1', plateNumber: 'T1' },
      })
    ).rejects.toThrow('معرف المشروع مطلوب');
  });
});
