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
        // carrierId missing from response!
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
        // materialId missing
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

  it('10. unauthenticated creation fails closed with UNAUTHENTICATED', async () => {
    (auth as any).currentUser = null;

    await expect(
      entityResolutionCommandService.createCarrier({
        projectId: 'PRJ-NEOM-01',
        sourceValue: 'ناقل غير موثق',
        carrierData: { nameAr: 'ناقل', commercialRegistrationNo: '1010111111' },
      })
    ).rejects.toThrow('المستخدم غير موثق');

    try {
      await entityResolutionCommandService.createCarrier({
        projectId: 'PRJ-NEOM-01',
        sourceValue: 'ناقل غير موثق',
        carrierData: { nameAr: 'ناقل', commercialRegistrationNo: '1010111111' },
      });
    } catch (err: any) {
      expect(err.code).toBe('UNAUTHENTICATED');
    }
  });

  it('11. projectId required on every command', async () => {
    expect(() =>
      entityResolutionCommandService.selectExisting({
        projectId: '',
        entityType: 'CARRIER',
        entityId: 'CAR-1',
        displayName: 'Carrier',
        sourceValue: 'Carrier',
      })
    ).toThrow('معرف المشروع مطلوب');

    await expect(
      entityResolutionCommandService.createCarrier({
        projectId: '',
        sourceValue: 'Test',
        carrierData: { nameAr: 'Test', commercialRegistrationNo: '1010123456' },
      })
    ).rejects.toThrow('معرف المشروع مطلوب');

    await expect(
      entityResolutionCommandService.createMaterial({
        projectId: '',
        sourceValue: 'Test',
        materialData: { code: 'TEST', nameAr: 'Test' },
      })
    ).rejects.toThrow('معرف المشروع مطلوب');
  });

  it('12. no firebase/firestore client SDK import in command service file', () => {
    const serviceFilePath = path.resolve(__dirname, '../services/import/entityResolutionCommand.service.ts');
    const code = fs.readFileSync(serviceFilePath, 'utf-8');

    expect(code).not.toContain('firebase/firestore');
    expect(code).not.toContain('getFirestore');
    expect(code).not.toContain('collection(');
    expect(code).not.toContain('doc(');
  });

  it('13. no client-generated canonical IDs in adapter', async () => {
    const serviceFilePath = path.resolve(__dirname, '../services/import/entityResolutionCommand.service.ts');
    const code = fs.readFileSync(serviceFilePath, 'utf-8');

    expect(code).not.toContain('Date.now()');
    expect(code).not.toContain('Math.random()');
    expect(code).not.toContain('crypto.randomUUID()');
  });

  it('14. no trip/business import commit endpoint called', async () => {
    let calledUrl = '';

    globalThis.fetch = vi.fn().mockImplementation(async (url: string) => {
      calledUrl = url;
      return { ok: true, json: async () => ({ success: true, carrierId: 'CAR-1' }) };
    });

    await entityResolutionCommandService.createCarrier({
      projectId: 'PRJ-1',
      sourceValue: 'C1',
      carrierData: { nameAr: 'C1', commercialRegistrationNo: '1010123456' },
    });

    expect(calledUrl).not.toContain('/api/projects/PRJ-1/trips');
    expect(calledUrl).not.toContain('/weighbridge/commit');
    expect(calledUrl).not.toContain('/import-sessions');
  });

  it('15. server error surfaces deterministic code', async () => {
    globalThis.fetch = vi.fn().mockImplementation(async () => ({
      ok: false,
      status: 400,
      json: async () => ({
        success: false,
        error: 'رقم السجل التجاري غير صالح',
        code: 'INVALID_CR_NUMBER',
      }),
    }));

    try {
      await entityResolutionCommandService.createCarrier({
        projectId: 'PRJ-1',
        sourceValue: 'C1',
        carrierData: { nameAr: 'C1', commercialRegistrationNo: '123' },
      });
    } catch (err: any) {
      expect(err.code).toBe('INVALID_CR_NUMBER');
      expect(err.message).toBe('رقم السجل التجاري غير صالح');
    }
  });

  it('16. DRIVER/TRUCK create behavior matches the audited canonical intake capability (rejects safely with PRECONDITION_BOUNDARY_CHANGE_REQUIRED)', async () => {
    await expect(
      entityResolutionCommandService.createDriver({
        projectId: 'PRJ-1',
        sourceValue: 'سائق جديد',
        driverData: { driverName: 'أحمد', residencyId: '1010101010' },
      })
    ).rejects.toThrow('إنشاء السائق المنفرد غير مدعوم على الخادم بدون تسجيل الأسطول المشترك');

    try {
      await entityResolutionCommandService.createDriver({
        projectId: 'PRJ-1',
        sourceValue: 'سائق جديد',
        driverData: { driverName: 'أحمد', residencyId: '1010101010' },
      });
    } catch (err: any) {
      expect(err.code).toBe('PRECONDITION_BOUNDARY_CHANGE_REQUIRED');
    }

    await expect(
      entityResolutionCommandService.createTruck({
        projectId: 'PRJ-1',
        sourceValue: 'شاحنة جديدة',
        truckData: { plateNumber: '1234 أ ب ج' },
      })
    ).rejects.toThrow('إنشاء الشاحنة المنفردة غير مدعوم على الخادم بدون تسجيل الأسطول المشترك');

    try {
      await entityResolutionCommandService.createTruck({
        projectId: 'PRJ-1',
        sourceValue: 'شاحنة جديدة',
        truckData: { plateNumber: '1234 أ ب ج' },
      });
    } catch (err: any) {
      expect(err.code).toBe('PRECONDITION_BOUNDARY_CHANGE_REQUIRED');
    }
  });

  it('17. adapter confidence values remain strictly within [0.0, 1.0] decimal canonical scale', async () => {
    globalThis.fetch = vi.fn().mockImplementation(async () => ({
      ok: true,
      json: async () => ({
        success: true,
        carrierId: 'CAR-CONF-1',
        materialId: 'MAT-CONF-1',
      }),
    }));

    const selectRes = entityResolutionCommandService.selectExisting({
      projectId: 'PRJ-1',
      entityType: 'CARRIER',
      entityId: 'CAR-1',
      displayName: 'Carrier 1',
      sourceValue: 'C1',
    });

    const carrierRes = await entityResolutionCommandService.createCarrier({
      projectId: 'PRJ-1',
      sourceValue: 'C1',
      carrierData: { nameAr: 'C1', commercialRegistrationNo: '1010123456' },
    });

    const materialRes = await entityResolutionCommandService.createMaterial({
      projectId: 'PRJ-1',
      sourceValue: 'M1',
      materialData: { code: 'M1', nameAr: 'M1' },
    });

    [selectRes, carrierRes, materialRes].forEach((res) => {
      expect(res.confidence).toBeGreaterThanOrEqual(0.0);
      expect(res.confidence).toBeLessThanOrEqual(1.0);
      expect(res.confidence).toBe(1.0);
    });
  });
});
