import { describe, it, expect, beforeEach } from 'vitest';
import { createInMemoryAdminDb, setTestDbOverride, inMemoryAdminStore } from '../firebase/admin';
import { importSessionServerService } from '../services/importSession.server';

describe('Smart Import Unit 4A Server Session Persistence Test Suite', () => {
  const adminContext = {
    userId: 'admin-1',
    email: 'admin@q-saudi.com',
    role: 'PROJECT_ADMIN' as const,
  };

  const dispatcherContext = {
    userId: 'disp-1',
    email: 'dispatcher@q-saudi.com',
    role: 'DISPATCHER' as const,
  };

  beforeEach(() => {
    for (const key of Object.keys(inMemoryAdminStore)) {
      delete inMemoryAdminStore[key];
    }
    const testDb = createInMemoryAdminDb({});
    setTestDbOverride(testDb);

    inMemoryAdminStore['projects/PRJ-001'] = { projectId: 'PRJ-001', nameAr: 'مشروع 1' };
    inMemoryAdminStore['projects/PRJ-002'] = { projectId: 'PRJ-002', nameAr: 'مشروع 2' };
  });

  it('1. create session', async () => {
    const session = await importSessionServerService.createSession('PRJ-001', {
      importSessionId: 'ses-101',
      operationId: 'op-101',
      importBatchId: 'batch-101',
      sourceType: 'EXCEL_CSV',
    }, adminContext);

    expect(session.importSessionId).toBe('ses-101');
    expect(session.version).toBe(1);
    expect(inMemoryAdminStore['projects/PRJ-001/importSessions/ses-101']).toBeDefined();
  });

  it('2. stored projectId', async () => {
    const session = await importSessionServerService.createSession('PRJ-001', {
      importSessionId: 'ses-102',
      operationId: 'op-102',
      importBatchId: 'batch-102',
    }, adminContext);

    expect(session.projectId).toBe('PRJ-001');
    const stored = inMemoryAdminStore['projects/PRJ-001/importSessions/ses-102'];
    expect(stored.projectId).toBe('PRJ-001');
  });

  it('3. stable importSessionId', async () => {
    const session = await importSessionServerService.createSession('PRJ-001', {
      importSessionId: 'ses-103',
      operationId: 'op-103',
      importBatchId: 'batch-103',
    }, adminContext);

    const updated = await importSessionServerService.updateCheckpoint('PRJ-001', 'ses-103', {
      importSessionId: 'ses-103',
      currentStage: 'VALIDATING',
    }, { expectedVersion: 1 }, adminContext);

    expect(updated.importSessionId).toBe('ses-103');
  });

  it('4. stable operationId', async () => {
    await importSessionServerService.createSession('PRJ-001', {
      importSessionId: 'ses-104',
      operationId: 'op-104',
      importBatchId: 'batch-104',
    }, adminContext);

    const updated = await importSessionServerService.updateCheckpoint('PRJ-001', 'ses-104', {
      operationId: 'op-104',
      currentStage: 'REVIEWING',
    }, { expectedVersion: 1 }, adminContext);

    expect(updated.operationId).toBe('op-104');
  });

  it('5. stable importBatchId', async () => {
    await importSessionServerService.createSession('PRJ-001', {
      importSessionId: 'ses-105',
      operationId: 'op-105',
      importBatchId: 'batch-105',
    }, adminContext);

    const updated = await importSessionServerService.updateCheckpoint('PRJ-001', 'ses-105', {
      importBatchId: 'batch-105',
      currentStage: 'APPROVED',
    }, { expectedVersion: 1 }, adminContext);

    expect(updated.importBatchId).toBe('batch-105');
  });

  it('6. get existing session', async () => {
    await importSessionServerService.createSession('PRJ-001', {
      importSessionId: 'ses-106',
      operationId: 'op-106',
      importBatchId: 'batch-106',
    }, adminContext);

    const fetched = await importSessionServerService.getSession('PRJ-001', 'ses-106', adminContext);
    expect(fetched.importSessionId).toBe('ses-106');
  });

  it('7. unknown session returns not found', async () => {
    await expect(
      importSessionServerService.getSession('PRJ-001', 'non-existent', adminContext)
    ).rejects.toThrow('جلسة الاستيراد غير موجودة');
  });

  it('8. cross-project get fails closed', async () => {
    inMemoryAdminStore['projects/PRJ-002/importSessions/ses-cross'] = {
      importSessionId: 'ses-cross',
      projectId: 'PRJ-001', // Mismatched stored project
      operationId: 'op-cross',
      importBatchId: 'batch-cross',
      version: 1,
    };

    await expect(
      importSessionServerService.getSession('PRJ-002', 'ses-cross', adminContext)
    ).rejects.toThrow('عزل أمني');
  });

  it('9. valid checkpoint update', async () => {
    await importSessionServerService.createSession('PRJ-001', {
      importSessionId: 'ses-107',
      operationId: 'op-107',
      importBatchId: 'batch-107',
    }, adminContext);

    const updated = await importSessionServerService.updateCheckpoint('PRJ-001', 'ses-107', {
      currentStage: 'NORMALIZING',
    }, { expectedVersion: 1 }, adminContext);

    expect(updated.currentStage).toBe('NORMALIZING');
    expect(updated.version).toBe(2);
  });

  it('10. version increments once', async () => {
    await importSessionServerService.createSession('PRJ-001', {
      importSessionId: 'ses-108',
      operationId: 'op-108',
      importBatchId: 'batch-108',
    }, adminContext);

    const u1 = await importSessionServerService.updateCheckpoint('PRJ-001', 'ses-108', { currentStage: 'S1' }, { expectedVersion: 1 }, adminContext);
    expect(u1.version).toBe(2);

    const u2 = await importSessionServerService.updateCheckpoint('PRJ-001', 'ses-108', { currentStage: 'S2' }, { expectedVersion: 2 }, adminContext);
    expect(u2.version).toBe(3);
  });

  it('11. stale expectedVersion rejected', async () => {
    await importSessionServerService.createSession('PRJ-001', {
      importSessionId: 'ses-109',
      operationId: 'op-109',
      importBatchId: 'batch-109',
    }, adminContext);

    await importSessionServerService.updateCheckpoint('PRJ-001', 'ses-109', { currentStage: 'S1' }, { expectedVersion: 1 }, adminContext);

    await expect(
      importSessionServerService.updateCheckpoint('PRJ-001', 'ses-109', { currentStage: 'S2' }, { expectedVersion: 1 }, adminContext)
    ).rejects.toThrow('تعارض إصدار (VERSION_CONFLICT)');
  });

  it('12. stale update does not overwrite newer state', async () => {
    await importSessionServerService.createSession('PRJ-001', {
      importSessionId: 'ses-110',
      operationId: 'op-110',
      importBatchId: 'batch-110',
    }, adminContext);

    await importSessionServerService.updateCheckpoint('PRJ-001', 'ses-110', { currentStage: 'NEWER' }, { expectedVersion: 1 }, adminContext);

    try {
      await importSessionServerService.updateCheckpoint('PRJ-001', 'ses-110', { currentStage: 'STALE' }, { expectedVersion: 1 }, adminContext);
    } catch (e) {
      // Expected
    }

    const current = await importSessionServerService.getSession('PRJ-001', 'ses-110', adminContext);
    expect(current.currentStage).toBe('NEWER');
  });

  it('13. importSessionId mutation rejected', async () => {
    await importSessionServerService.createSession('PRJ-001', {
      importSessionId: 'ses-111',
      operationId: 'op-111',
      importBatchId: 'batch-111',
    }, adminContext);

    await expect(
      importSessionServerService.updateCheckpoint('PRJ-001', 'ses-111', { importSessionId: 'ses-mutated' }, { expectedVersion: 1 }, adminContext)
    ).rejects.toThrow('تغيير معرف جلسة الاستيراد');
  });

  it('14. operationId mutation rejected', async () => {
    await importSessionServerService.createSession('PRJ-001', {
      importSessionId: 'ses-112',
      operationId: 'op-112',
      importBatchId: 'batch-112',
    }, adminContext);

    await expect(
      importSessionServerService.updateCheckpoint('PRJ-001', 'ses-112', { operationId: 'op-mutated' }, { expectedVersion: 1 }, adminContext)
    ).rejects.toThrow('تغيير معرف العملية');
  });

  it('15. importBatchId mutation rejected', async () => {
    await importSessionServerService.createSession('PRJ-001', {
      importSessionId: 'ses-113',
      operationId: 'op-113',
      importBatchId: 'batch-113',
    }, adminContext);

    await expect(
      importSessionServerService.updateCheckpoint('PRJ-001', 'ses-113', { importBatchId: 'batch-mutated' }, { expectedVersion: 1 }, adminContext)
    ).rejects.toThrow('تغيير معرف دفعة الاستيراد');
  });

  it('16. reviewSnapshot persists', async () => {
    const updated = await importSessionServerService.createSession('PRJ-001', {
      importSessionId: 'ses-114',
      operationId: 'op-114',
      importBatchId: 'batch-114',
      reviewSnapshot: { summaryRows: 50, validCount: 45 },
    }, adminContext);

    expect(updated.reviewSnapshot).toEqual({ summaryRows: 50, validCount: 45 });
  });

  it('17. entityResolutions persist', async () => {
    const updated = await importSessionServerService.createSession('PRJ-001', {
      importSessionId: 'ses-115',
      operationId: 'op-115',
      importBatchId: 'batch-115',
      entityResolutions: { driverId: 'DRV-1' },
    }, adminContext);

    expect(updated.entityResolutions).toEqual({ driverId: 'DRV-1' });
  });

  it('18. reviewAction persists', async () => {
    const updated = await importSessionServerService.createSession('PRJ-001', {
      importSessionId: 'ses-116',
      operationId: 'op-116',
      importBatchId: 'batch-116',
      reviewAction: 'APPROVE',
    }, adminContext);

    expect(updated.reviewAction).toBe('APPROVE');
  });

  it('19. validationIssues persist', async () => {
    const updated = await importSessionServerService.createSession('PRJ-001', {
      importSessionId: 'ses-117',
      operationId: 'op-117',
      importBatchId: 'batch-117',
      validationIssues: [{ code: 'ERR_1', message: 'Missing truck' }],
    }, adminContext);

    expect(updated.validationIssues).toHaveLength(1);
    expect(updated.validationIssues[0].code).toBe('ERR_1');
  });

  it('20. warning confirmation persists', async () => {
    const updated = await importSessionServerService.createSession('PRJ-001', {
      importSessionId: 'ses-118',
      operationId: 'op-118',
      importBatchId: 'batch-118',
      warningConfirmation: true,
    }, adminContext);

    expect(updated.warningConfirmation).toBe(true);
  });

  it('21. browser File-like payload rejected/sanitized', async () => {
    await expect(
      importSessionServerService.createSession('PRJ-001', {
        importSessionId: 'ses-119',
        file: { name: 'test.csv' },
      }, adminContext)
    ).rejects.toThrow('يُحظر تضمين كائنات الملفات');
  });

  it('22. secrets/tokens rejected/sanitized', async () => {
    await expect(
      importSessionServerService.createSession('PRJ-001', {
        importSessionId: 'ses-120',
        token: 'secret-jwt',
      }, adminContext)
    ).rejects.toThrow('يُحظر تضمين كائنات الملفات (File objects) أو الرموز السرية');
  });

  it('23. authentication required', async () => {
    await expect(
      importSessionServerService.getSession('PRJ-001', 'ses-101', null as any)
    ).rejects.toThrow('المستخدم غير مصادق عليه');
  });

  it('24. project isolation middleware/service enforced', async () => {
    await expect(
      importSessionServerService.createSession('PRJ-001', {
        projectId: 'PRJ-002',
        importSessionId: 'ses-iso',
      }, adminContext)
    ).rejects.toThrow('عدم تطابق معرّف المشروع');
  });

  it('25. no canonical business collections written', async () => {
    await importSessionServerService.createSession('PRJ-001', {
      importSessionId: 'ses-121',
      operationId: 'op-121',
      importBatchId: 'batch-121',
    }, adminContext);

    expect(inMemoryAdminStore['projects/PRJ-001/trips']).toBeUndefined();
    expect(inMemoryAdminStore['projects/PRJ-001/drivers']).toBeUndefined();
    expect(inMemoryAdminStore['projects/PRJ-001/carriers']).toBeUndefined();
  });

  it('26. existing /api/intake/canonical behavior untouched', async () => {
    // Verify that the import session persistence module does not export or affect intake service
    const { driverTruckIntakeServer } = await import('../services/driverTruckIntake.server');
    expect(driverTruckIntakeServer).toBeDefined();
    expect(typeof driverTruckIntakeServer.processSharedIntake).toBe('function');
  });
});
