import { describe, it, expect, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { createInMemoryAdminDb, setTestDbOverride, inMemoryAdminStore, adminDb } from '../firebase/admin';
import { ProjectProvisioningAdminService } from '../services/projectProvisioning.server';

describe('Project Material/Carrier Server Authority Convergence Test Suite', () => {
  let service: ProjectProvisioningAdminService;

  beforeEach(() => {
    // Clear mock in-memory database store
    for (const key of Object.keys(inMemoryAdminStore)) {
      delete inMemoryAdminStore[key];
    }
    const testDb = createInMemoryAdminDb({});
    
    // Instrument runTransaction to strictly enforce Firestore's read-before-write sequence rule
    const originalRunTransaction = testDb.runTransaction;
    testDb.runTransaction = async (cb: any) => {
      let writeOccurred = false;
      const trackedTx = {
        get: async (ref: any) => {
          if (writeOccurred) {
            throw new Error('FIRESTORE_TRANSACTION_VIOLATION: Attempted transaction read (get) AFTER a write (set/update/delete) has already been executed. All reads must occur before any writes.');
          }
          if (ref && ref._isQuery) {
            const results: any[] = [];
            const prefix = `${ref.col}/`;
            for (const [key, val] of Object.entries(inMemoryAdminStore)) {
              if (key.startsWith(prefix)) {
                const relativeKey = key.slice(prefix.length);
                if (!relativeKey.includes('/')) {
                  if (val && val[ref.field] === ref.value) {
                    results.push({
                      id: relativeKey,
                      data: () => val,
                    });
                  }
                }
              }
            }
            return {
              size: results.length,
              docs: results,
            };
          }
          return ref.get();
        },
        set: (ref: any, data: any) => {
          writeOccurred = true;
          return ref.set(data);
        },
        update: (ref: any, data: any) => {
          writeOccurred = true;
          return ref.update(data);
        },
        delete: (ref: any) => {
          writeOccurred = true;
          return ref.delete();
        }
      };
      return cb(trackedTx);
    };

    setTestDbOverride(testDb);
    service = new ProjectProvisioningAdminService();
  });

  // --- META-TEST FOR INTEGRITY GUARD ---

  it('Proves our transaction validator correctly intercepts read-after-write violation', async () => {
    await expect(
      adminDb.runTransaction(async (tx: any) => {
        const docRef = adminDb.collection('materials').doc('test-mat');
        tx.set(docRef, { val: 1 });
        await tx.get(docRef);
      })
    ).rejects.toThrow('FIRESTORE_TRANSACTION_VIOLATION');
  });

  // --- ORIGINAL 6 MATERIAL CONVERGENCE TESTS ---

  it('1. Existing global material is reused by canonical code', async () => {
    inMemoryAdminStore['projects/Q-PRJ-006'] = { projectId: 'Q-PRJ-006', status: 'ACTIVE' };
    
    inMemoryAdminStore['materials/MAT-existing-123'] = {
      materialId: 'MAT-existing-123',
      code: 'AGG-10MM',
      nameAr: 'بحص 10 مم',
      status: 'ACTIVE',
    };
    inMemoryAdminStore['natural_identity_lookups/MATERIAL_QUdHLTEwTU0_'] = {
      entityType: 'MATERIAL',
      systemId: 'MAT-existing-123',
    };

    const result = await service.setupProjectMaterial('Q-PRJ-006', { code: 'AGG-10MM', name: 'بحص 10 مم مكرر' }, { userId: 'admin-1' });
    expect(result.materialId).toBe('MAT-existing-123');
    expect(result.membershipStatus).toBe('ACTIVE');

    expect(inMemoryAdminStore['projects/Q-PRJ-006/material_memberships/MAT-existing-123']).toBeDefined();
    expect(inMemoryAdminStore['projects/Q-PRJ-006/material_memberships/MAT-existing-123'].status).toBe('ACTIVE');
  });

  it('2. New global material is created when absent', async () => {
    inMemoryAdminStore['projects/Q-PRJ-006'] = { projectId: 'Q-PRJ-006', status: 'ACTIVE' };

    const result = await service.setupProjectMaterial('Q-PRJ-006', { code: 'NEW-SAND', name: 'رمل أحمر' }, { userId: 'admin-1' });
    expect(result.materialId).toBeDefined();
    expect(result.materialId.startsWith('MAT-')).toBe(true);

    const globalDoc = inMemoryAdminStore[`materials/${result.materialId}`];
    expect(globalDoc).toBeDefined();
    expect(globalDoc.code).toBe('NEW-SAND');
    expect(globalDoc.nameAr).toBe('رمل احمر');

    expect(inMemoryAdminStore['natural_identity_lookups/MATERIAL_TkVXLVNBTkQ_']).toBeDefined();
    expect(inMemoryAdminStore['natural_identity_lookups/MATERIAL_TkVXLVNBTkQ_'].systemId).toBe(result.materialId);
  });

  it('3. Project material membership is created ACTIVE', async () => {
    inMemoryAdminStore['projects/Q-PRJ-006'] = { projectId: 'Q-PRJ-006', status: 'ACTIVE' };

    const result = await service.setupProjectMaterial('Q-PRJ-006', { code: 'AGG-20MM', name: 'بحص 20 مم' }, { userId: 'admin-1' });
    const membership = inMemoryAdminStore[`projects/Q-PRJ-006/material_memberships/${result.materialId}`];
    expect(membership).toBeDefined();
    expect(membership.status).toBe('ACTIVE');
    expect(membership.projectId).toBe('Q-PRJ-006');
    expect(membership.materialId).toBe(result.materialId);
  });

  it('4. Repeated material setup is idempotent', async () => {
    inMemoryAdminStore['projects/Q-PRJ-006'] = { projectId: 'Q-PRJ-006', status: 'ACTIVE' };

    const first = await service.setupProjectMaterial('Q-PRJ-006', { code: 'AGG-10MM', name: 'بحص 10 مم' }, { userId: 'admin-1' });
    const keysBefore = Object.keys(inMemoryAdminStore).length;

    const second = await service.setupProjectMaterial('Q-PRJ-006', { code: 'AGG-10MM', name: 'بحص 10 مم' }, { userId: 'admin-1' });
    const keysAfter = Object.keys(inMemoryAdminStore).length;

    expect(first.materialId).toBe(second.materialId);
    expect(keysBefore).toBe(keysAfter);
  });

  it('5. No project-scoped legacy material identity is written', async () => {
    inMemoryAdminStore['projects/Q-PRJ-006'] = { projectId: 'Q-PRJ-006', status: 'ACTIVE' };

    const result = await service.setupProjectMaterial('Q-PRJ-006', { code: 'SAND-01', name: 'رمل' }, { userId: 'admin-1' });
    
    for (const key of Object.keys(inMemoryAdminStore)) {
      expect(key.includes('/materials/')).toBe(false);
    }
  });

  it('6. Missing project fails correctly for material setup', async () => {
    await expect(
      service.setupProjectMaterial('Q-PRJ-MISSING', { code: 'AGG-10MM', name: 'بحص' }, { userId: 'admin-1' })
    ).rejects.toThrow('PROJECT_NOT_FOUND');
  });

  // --- MATERIAL REGRESSION PROTECTION & PARITY ---

  it('7. New Material provisioning performs all transaction reads before writes', async () => {
    inMemoryAdminStore['projects/Q-PRJ-006'] = { projectId: 'Q-PRJ-006', status: 'ACTIVE' };

    const result = await service.setupProjectMaterial('Q-PRJ-006', { code: 'AGG-10MM', name: 'بحص' }, { userId: 'admin-1' });
    expect(result.materialId).toBeDefined();
    expect(inMemoryAdminStore[`projects/Q-PRJ-006/material_memberships/${result.materialId}`]).toBeDefined();
  });

  it('8. New Material preserves canonical optional-field semantics (no forced 1.6 density)', async () => {
    inMemoryAdminStore['projects/Q-PRJ-006'] = { projectId: 'Q-PRJ-006', status: 'ACTIVE' };

    const result = await service.setupProjectMaterial('Q-PRJ-006', { code: 'RAW-SAND', name: 'رمل خام' }, { userId: 'admin-1' });
    const globalDoc = inMemoryAdminStore[`materials/${result.materialId}`];
    
    expect(globalDoc).toBeDefined();
    expect(globalDoc.standardDensityTonPerM3).toBeUndefined();
    expect(globalDoc.maxAllowableMoisturePercent).toBeUndefined();
    expect(globalDoc.unitOfMeasure).toBe('TON');
  });

  it('9. Lookup -> missing Material target fails closed (DANGLING_LOOKUP_DETECTED)', async () => {
    inMemoryAdminStore['projects/Q-PRJ-006'] = { projectId: 'Q-PRJ-006', status: 'ACTIVE' };
    
    inMemoryAdminStore['natural_identity_lookups/MATERIAL_QUdHLTEwTU0_'] = {
      entityType: 'MATERIAL',
      systemId: 'MAT-missing-999',
    };

    await expect(
      service.setupProjectMaterial('Q-PRJ-006', { code: 'AGG-10MM', name: 'بحص 10 مم' }, { userId: 'admin-1' })
    ).rejects.toThrow('DANGLING_LOOKUP_DETECTED');

    expect(inMemoryAdminStore['projects/Q-PRJ-006/material_memberships/MAT-missing-999']).toBeUndefined();
  });

  it('10. Existing ACTIVE material membership is idempotent (no writes, returns status ACTIVE)', async () => {
    inMemoryAdminStore['projects/Q-PRJ-006'] = { projectId: 'Q-PRJ-006', status: 'ACTIVE' };
    inMemoryAdminStore['materials/MAT-active-123'] = { materialId: 'MAT-active-123', code: 'AGG-10MM', status: 'ACTIVE' };
    inMemoryAdminStore['natural_identity_lookups/MATERIAL_QUdHLTEwTU0_'] = { entityType: 'MATERIAL', systemId: 'MAT-active-123' };
    
    inMemoryAdminStore['projects/Q-PRJ-006/material_memberships/MAT-active-123'] = {
      projectId: 'Q-PRJ-006',
      materialId: 'MAT-active-123',
      status: 'ACTIVE',
      createdAt: new Date('2026-09-01T00:00:00Z'),
    };

    const result = await service.setupProjectMaterial('Q-PRJ-006', { code: 'AGG-10MM' }, { userId: 'admin-1' });
    expect(result.materialId).toBe('MAT-active-123');
    expect(result.membershipStatus).toBe('ACTIVE');
    
    const membership = inMemoryAdminStore['projects/Q-PRJ-006/material_memberships/MAT-active-123'];
    expect(membership.createdAt.toISOString()).toBe('2026-09-01T00:00:00.000Z');
  });

  it('11. SUSPENDED material membership is NOT reactivated and throws MEMBERSHIP_STATE_CONFLICT', async () => {
    inMemoryAdminStore['projects/Q-PRJ-006'] = { projectId: 'Q-PRJ-006', status: 'ACTIVE' };
    inMemoryAdminStore['materials/MAT-susp-123'] = { materialId: 'MAT-susp-123', code: 'AGG-10MM', status: 'ACTIVE' };
    inMemoryAdminStore['natural_identity_lookups/MATERIAL_QUdHLTEwTU0_'] = { entityType: 'MATERIAL', systemId: 'MAT-susp-123' };
    
    inMemoryAdminStore['projects/Q-PRJ-006/material_memberships/MAT-susp-123'] = {
      projectId: 'Q-PRJ-006',
      materialId: 'MAT-susp-123',
      status: 'SUSPENDED',
    };

    await expect(
      service.setupProjectMaterial('Q-PRJ-006', { code: 'AGG-10MM' }, { userId: 'admin-1' })
    ).rejects.toThrow('MEMBERSHIP_STATE_CONFLICT');

    expect(inMemoryAdminStore['projects/Q-PRJ-006/material_memberships/MAT-susp-123'].status).toBe('SUSPENDED');
  });

  it('12. REMOVED material membership is NOT reactivated and throws MEMBERSHIP_STATE_CONFLICT', async () => {
    inMemoryAdminStore['projects/Q-PRJ-006'] = { projectId: 'Q-PRJ-006', status: 'ACTIVE' };
    inMemoryAdminStore['materials/MAT-rem-123'] = { materialId: 'MAT-rem-123', code: 'AGG-10MM', status: 'ACTIVE' };
    inMemoryAdminStore['natural_identity_lookups/MATERIAL_QUdHLTEwTU0_'] = { entityType: 'MATERIAL', systemId: 'MAT-rem-123' };
    
    inMemoryAdminStore['projects/Q-PRJ-006/material_memberships/MAT-rem-123'] = {
      projectId: 'Q-PRJ-006',
      materialId: 'MAT-rem-123',
      status: 'REMOVED',
    };

    await expect(
      service.setupProjectMaterial('Q-PRJ-006', { code: 'AGG-10MM' }, { userId: 'admin-1' })
    ).rejects.toThrow('MEMBERSHIP_STATE_CONFLICT');

    expect(inMemoryAdminStore['projects/Q-PRJ-006/material_memberships/MAT-rem-123'].status).toBe('REMOVED');
  });

  // --- ORIGINAL 6 CARRIER CONVERGENCE TESTS ---

  it('13. Existing global carrier is reused by commercialRegistrationNo', async () => {
    inMemoryAdminStore['projects/Q-PRJ-006'] = { projectId: 'Q-PRJ-006', status: 'ACTIVE' };

    inMemoryAdminStore['carriers/CAR-existing-999'] = {
      carrierId: 'CAR-existing-999',
      nameAr: 'شركة النقل المتقدمة',
      commercialRegistrationNo: '1010888888',
      status: 'ACTIVE',
    };
    inMemoryAdminStore['natural_identity_lookups/CARRIER_MTAxMDg4ODg4OA_'] = {
      entityType: 'CARRIER',
      systemId: 'CAR-existing-999',
    };

    const result = await service.setupProjectCarrier('Q-PRJ-006', {
      name: 'شركة النقل المتقدمة مكرر',
      commercialRegistrationNo: '1010888888',
    }, { userId: 'admin-1' });

    expect(result.carrierId).toBe('CAR-existing-999');
    expect(result.membershipStatus).toBe('ACTIVE');
    expect(inMemoryAdminStore['projects/Q-PRJ-006/carrier_memberships/CAR-existing-999']).toBeDefined();
  });

  it('14. New global carrier is created when absent', async () => {
    inMemoryAdminStore['projects/Q-PRJ-006'] = { projectId: 'Q-PRJ-006', status: 'ACTIVE' };

    const result = await service.setupProjectCarrier('Q-PRJ-006', {
      name: 'مؤسسة الرياض اللوجستية',
      commercialRegistrationNo: '1010111111',
      transportLicenseNo: 'TGA-887766',
    }, { userId: 'admin-1' });

    expect(result.carrierId).toBeDefined();
    expect(result.carrierId.startsWith('CAR-')).toBe(true);

    const globalDoc = inMemoryAdminStore[`carriers/${result.carrierId}`];
    expect(globalDoc).toBeDefined();
    expect(globalDoc.commercialRegistrationNo).toBe('1010111111');
    expect(globalDoc.nameAr).toBe('مؤسسه الرياض اللوجستيه');

    expect(inMemoryAdminStore['natural_identity_lookups/CARRIER_MTAxMDExMTExMQ__']).toBeDefined();
  });

  it('15. Project carrier membership is created ACTIVE', async () => {
    inMemoryAdminStore['projects/Q-PRJ-006'] = { projectId: 'Q-PRJ-006', status: 'ACTIVE' };

    const result = await service.setupProjectCarrier('Q-PRJ-006', {
      name: 'الناقل الوطني',
      commercialRegistrationNo: '1010333333',
    }, { userId: 'admin-1' });

    const membership = inMemoryAdminStore[`projects/Q-PRJ-006/carrier_memberships/${result.carrierId}`];
    expect(membership).toBeDefined();
    expect(membership.status).toBe('ACTIVE');
    expect(membership.carrierId).toBe(result.carrierId);
  });

  it('16. Repeated carrier setup is idempotent', async () => {
    inMemoryAdminStore['projects/Q-PRJ-006'] = { projectId: 'Q-PRJ-006', status: 'ACTIVE' };

    const first = await service.setupProjectCarrier('Q-PRJ-006', {
      name: 'الناقل السريع',
      commercialRegistrationNo: '1010444444',
    }, { userId: 'admin-1' });
    const keysBefore = Object.keys(inMemoryAdminStore).length;

    const second = await service.setupProjectCarrier('Q-PRJ-006', {
      name: 'الناقل السريع',
      commercialRegistrationNo: '1010444444',
    }, { userId: 'admin-1' });
    const keysAfter = Object.keys(inMemoryAdminStore).length;

    expect(first.carrierId).toBe(second.carrierId);
    expect(keysBefore).toBe(keysAfter);
  });

  it('17. No project-scoped legacy carrier identity is written', async () => {
    inMemoryAdminStore['projects/Q-PRJ-006'] = { projectId: 'Q-PRJ-006', status: 'ACTIVE' };

    await service.setupProjectCarrier('Q-PRJ-006', {
      name: 'الناقل الجديد',
      commercialRegistrationNo: '1010555555',
    }, { userId: 'admin-1' });

    for (const key of Object.keys(inMemoryAdminStore)) {
      expect(key.includes('/carriers/')).toBe(false);
    }
  });

  it('18. Missing project fails correctly for carrier setup', async () => {
    await expect(
      service.setupProjectCarrier('Q-PRJ-MISSING', { name: 'ناقل', commercialRegistrationNo: '1010000000' }, { userId: 'admin-1' })
    ).rejects.toThrow('PROJECT_NOT_FOUND');
  });

  // --- CARRIER REGRESSION PROTECTION & PARITY ---

  it('19. New Carrier provisioning performs all transaction reads before writes', async () => {
    inMemoryAdminStore['projects/Q-PRJ-006'] = { projectId: 'Q-PRJ-006', status: 'ACTIVE' };

    const result = await service.setupProjectCarrier('Q-PRJ-006', {
      name: 'ناقل سريع مكرر',
      commercialRegistrationNo: '1010444444',
    }, { userId: 'admin-1' });
    expect(result.carrierId).toBeDefined();
    expect(inMemoryAdminStore[`projects/Q-PRJ-006/carrier_memberships/${result.carrierId}`]).toBeDefined();
  });

  it('20. New Carrier does not fabricate transport license/contact values', async () => {
    inMemoryAdminStore['projects/Q-PRJ-006'] = { projectId: 'Q-PRJ-006', status: 'ACTIVE' };

    const result = await service.setupProjectCarrier('Q-PRJ-006', {
      name: 'مؤسسة النصر اللوجستية',
      commercialRegistrationNo: '1010999999',
    }, { userId: 'admin-1' });

    const globalDoc = inMemoryAdminStore[`carriers/${result.carrierId}`];
    expect(globalDoc).toBeDefined();
    expect(globalDoc.transportLicenseNo).toBeUndefined();
    expect(globalDoc.contactPerson).toBeUndefined();
  });

  it('21. Lookup -> missing Carrier target fails closed (DANGLING_LOOKUP_DETECTED)', async () => {
    inMemoryAdminStore['projects/Q-PRJ-006'] = { projectId: 'Q-PRJ-006', status: 'ACTIVE' };

    inMemoryAdminStore['natural_identity_lookups/CARRIER_MTAxMDExMTExMQ__'] = {
      entityType: 'CARRIER',
      systemId: 'CAR-missing-999',
    };

    await expect(
      service.setupProjectCarrier('Q-PRJ-006', {
        name: 'الناقل اللوجستي',
        commercialRegistrationNo: '1010111111',
      }, { userId: 'admin-1' })
    ).rejects.toThrow('DANGLING_LOOKUP_DETECTED');

    expect(inMemoryAdminStore['projects/Q-PRJ-006/carrier_memberships/CAR-missing-999']).toBeUndefined();
  });

  it('22. Existing ACTIVE carrier membership is idempotent', async () => {
    inMemoryAdminStore['projects/Q-PRJ-006'] = { projectId: 'Q-PRJ-006', status: 'ACTIVE' };
    inMemoryAdminStore['carriers/CAR-active-123'] = { carrierId: 'CAR-active-123', commercialRegistrationNo: '1010111111', status: 'ACTIVE' };
    inMemoryAdminStore['natural_identity_lookups/CARRIER_MTAxMDExMTExMQ__'] = { entityType: 'CARRIER', systemId: 'CAR-active-123' };

    inMemoryAdminStore['projects/Q-PRJ-006/carrier_memberships/CAR-active-123'] = {
      projectId: 'Q-PRJ-006',
      carrierId: 'CAR-active-123',
      status: 'ACTIVE',
      createdAt: new Date('2026-09-01T00:00:00Z'),
    };

    const result = await service.setupProjectCarrier('Q-PRJ-006', {
      name: 'الناقل النشط',
      commercialRegistrationNo: '1010111111',
    }, { userId: 'admin-1' });

    expect(result.carrierId).toBe('CAR-active-123');
    expect(result.membershipStatus).toBe('ACTIVE');

    const membership = inMemoryAdminStore['projects/Q-PRJ-006/carrier_memberships/CAR-active-123'];
    expect(membership.createdAt.toISOString()).toBe('2026-09-01T00:00:00.000Z');
  });

  it('23. SUSPENDED carrier membership is NOT reactivated and throws MEMBERSHIP_STATE_CONFLICT', async () => {
    inMemoryAdminStore['projects/Q-PRJ-006'] = { projectId: 'Q-PRJ-006', status: 'ACTIVE' };
    inMemoryAdminStore['carriers/CAR-susp-123'] = { carrierId: 'CAR-susp-123', commercialRegistrationNo: '1010111111', status: 'ACTIVE' };
    inMemoryAdminStore['natural_identity_lookups/CARRIER_MTAxMDExMTExMQ__'] = { entityType: 'CARRIER', systemId: 'CAR-susp-123' };

    inMemoryAdminStore['projects/Q-PRJ-006/carrier_memberships/CAR-susp-123'] = {
      projectId: 'Q-PRJ-006',
      carrierId: 'CAR-susp-123',
      status: 'SUSPENDED',
    };

    await expect(
      service.setupProjectCarrier('Q-PRJ-006', {
        name: 'الناقل المعطل',
        commercialRegistrationNo: '1010111111',
      }, { userId: 'admin-1' })
    ).rejects.toThrow('MEMBERSHIP_STATE_CONFLICT');

    expect(inMemoryAdminStore['projects/Q-PRJ-006/carrier_memberships/CAR-susp-123'].status).toBe('SUSPENDED');
  });

  it('24. REMOVED carrier membership is NOT reactivated and throws MEMBERSHIP_STATE_CONFLICT', async () => {
    inMemoryAdminStore['projects/Q-PRJ-006'] = { projectId: 'Q-PRJ-006', status: 'ACTIVE' };
    inMemoryAdminStore['carriers/CAR-rem-123'] = { carrierId: 'CAR-rem-123', commercialRegistrationNo: '1010111111', status: 'ACTIVE' };
    inMemoryAdminStore['natural_identity_lookups/CARRIER_MTAxMDExMTExMQ__'] = { entityType: 'CARRIER', systemId: 'CAR-rem-123' };

    inMemoryAdminStore['projects/Q-PRJ-006/carrier_memberships/CAR-rem-123'] = {
      projectId: 'Q-PRJ-006',
      carrierId: 'CAR-rem-123',
      status: 'REMOVED',
    };

    await expect(
      service.setupProjectCarrier('Q-PRJ-006', {
        name: 'الناقل المحذوف',
        commercialRegistrationNo: '1010111111',
      }, { userId: 'admin-1' })
    ).rejects.toThrow('MEMBERSHIP_STATE_CONFLICT');

    expect(inMemoryAdminStore['projects/Q-PRJ-006/carrier_memberships/CAR-rem-123'].status).toBe('REMOVED');
  });

  // --- GENERAL COMPLIANCE TESTS ---

  it('25. Material listing resolves from active project memberships + global material catalog', async () => {
    inMemoryAdminStore['projects/Q-PRJ-006'] = { projectId: 'Q-PRJ-006', status: 'ACTIVE' };

    inMemoryAdminStore['projects/Q-PRJ-006/material_memberships/MAT-1'] = { projectId: 'Q-PRJ-006', materialId: 'MAT-1', status: 'ACTIVE' };
    inMemoryAdminStore['projects/Q-PRJ-006/material_memberships/MAT-2'] = { projectId: 'Q-PRJ-006', materialId: 'MAT-2', status: 'REMOVED' };

    inMemoryAdminStore['materials/MAT-1'] = { materialId: 'MAT-1', code: 'AGG-10MM', nameAr: 'بحص 10 مم', status: 'ACTIVE' };
    inMemoryAdminStore['materials/MAT-2'] = { materialId: 'MAT-2', code: 'AGG-20MM', nameAr: 'بحص 20 مم', status: 'ACTIVE' };

    const list = await service.listProjectMaterials('Q-PRJ-006');
    expect(list).toHaveLength(1);
    expect(list[0].materialId).toBe('MAT-1');
    expect(list[0].name).toBe('بحص 10 مم');
    expect(list[0].isActive).toBe(true);
  });

  it('26. Carrier listing resolves from active project memberships + global carrier registry', async () => {
    inMemoryAdminStore['projects/Q-PRJ-006'] = { projectId: 'Q-PRJ-006', status: 'ACTIVE' };

    inMemoryAdminStore['projects/Q-PRJ-006/carrier_memberships/CAR-1'] = { projectId: 'Q-PRJ-006', carrierId: 'CAR-1', status: 'ACTIVE' };
    inMemoryAdminStore['projects/Q-PRJ-006/carrier_memberships/CAR-2'] = { projectId: 'Q-PRJ-006', carrierId: 'CAR-2', status: 'SUSPENDED' };

    inMemoryAdminStore['carriers/CAR-1'] = { carrierId: 'CAR-1', commercialRegistrationNo: '1010111111', nameAr: 'ناقل 1', status: 'ACTIVE' };
    inMemoryAdminStore['carriers/CAR-2'] = { carrierId: 'CAR-2', commercialRegistrationNo: '1010222222', nameAr: 'ناقل 2', status: 'ACTIVE' };

    const list = await service.listProjectCarriers('Q-PRJ-006');
    expect(list).toHaveLength(1);
    expect(list[0].carrierId).toBe('CAR-1');
    expect(list[0].name).toBe('ناقل 1');
    expect(list[0].isActive).toBe(true);
  });

  it('27. Route implementation static guard validation (enforceProjectIsolation, enforceAdminOnly, ProjectProvisioningAdminService)', () => {
    const appPath = path.resolve(process.cwd(), 'server/app.ts');
    const fileContent = fs.readFileSync(appPath, 'utf8');

    expect(fileContent).toContain("app.post('/api/projects/:projectId/setup-material', enforceProjectIsolation, enforceAdminOnly");
    expect(fileContent).toContain("app.post('/api/projects/:projectId/setup-carrier', enforceProjectIsolation, enforceAdminOnly");
    expect(fileContent).toContain("ProjectProvisioningAdminService");
  });

  it('28. No auth.currentUser leak inside projectProvisioning.server.ts', () => {
    const svcPath = path.resolve(process.cwd(), 'src/services/projectProvisioning.server.ts');
    const fileContent = fs.readFileSync(svcPath, 'utf8');

    expect(fileContent).not.toContain('auth.currentUser');
  });
});
