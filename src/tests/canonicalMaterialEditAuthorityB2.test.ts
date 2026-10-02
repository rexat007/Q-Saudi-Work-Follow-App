import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { ProjectProvisioningAdminService } from '../services/projectProvisioning.server';
import {
  MaterialManagementClientService,
  materialManagementClientService,
  MaterialUpdateInput,
} from '../services/materialManagementClient.service';
import { MaterialEditorModal } from '../components/masterData/MaterialEditorModal';
import {
  ProjectCanonicalRefreshService,
  projectCanonicalRefreshService,
} from '../services/projectCanonicalRefresh.service';
import { canonicalRelationshipContextService } from '../services/canonicalRelationshipContext.service';
import { adminDb } from '../firebase/admin';

describe('FOUNDATION B2 — Canonical Material Edit Authority', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const provisioningServerPath = path.resolve(__dirname, '../services/projectProvisioning.server.ts');
  const provisioningServerContent = fs.readFileSync(provisioningServerPath, 'utf-8');

  const serverAppPath = path.resolve(__dirname, '../../server/app.ts');
  const serverAppContent = fs.readFileSync(serverAppPath, 'utf-8');

  const clientServicePath = path.resolve(__dirname, '../services/materialManagementClient.service.ts');
  const clientServiceContent = fs.readFileSync(clientServicePath, 'utf-8');

  const modalPath = path.resolve(__dirname, '../components/masterData/MaterialEditorModal.tsx');
  const modalContent = fs.readFileSync(modalPath, 'utf-8');

  const refreshServicePath = path.resolve(__dirname, '../services/projectCanonicalRefresh.service.ts');
  const refreshServiceContent = fs.readFileSync(refreshServicePath, 'utf-8');

  const wizardPath = path.resolve(__dirname, '../components/wizard/ProjectSetupWizard.tsx');
  const wizardContent = fs.readFileSync(wizardPath, 'utf-8');

  // ==========================================
  // 1. SERVER AUTHORITY & IDENTITY CONTRACT
  // ==========================================

  // 1. materialId is immutable
  it('1. materialId is immutable', async () => {
    const service = new ProjectProvisioningAdminService();
    await expect(
      service.updateProjectMaterial(
        'PRJ-01',
        'MAT-01',
        { materialId: 'MAT-DIFFERENT', name: 'بحص' },
        { userId: 'admin-1' }
      )
    ).rejects.toThrow(/IMMUTABLE_MATERIAL_ID/);
  });

  // 2. code is immutable
  it('2. code is immutable', async () => {
    const service = new ProjectProvisioningAdminService();
    await adminDb.collection('projects').doc('PRJ-MAT-CODE').set({ projectId: 'PRJ-MAT-CODE' });
    await adminDb
      .collection('projects')
      .doc('PRJ-MAT-CODE')
      .collection('material_memberships')
      .doc('MAT-CODE-1')
      .set({
        projectId: 'PRJ-MAT-CODE',
        materialId: 'MAT-CODE-1',
        status: 'ACTIVE',
      });
    await adminDb.collection('materials').doc('MAT-CODE-1').set({
      materialId: 'MAT-CODE-1',
      code: 'AGG-10MM',
      nameAr: 'بحص 10 مم',
    });

    await expect(
      service.updateProjectMaterial(
        'PRJ-MAT-CODE',
        'MAT-CODE-1',
        { code: 'AGG-20MM', name: 'بحص 20 مم' },
        { userId: 'admin-1' }
      )
    ).rejects.toThrow(/IMMUTABLE_MATERIAL_CODE/);
  });

  // 3. code immutability uses normalized canonical code semantics
  it('3. code immutability uses normalized canonical code semantics', async () => {
    const service = new ProjectProvisioningAdminService();
    // Same normalized code (e.g. lowercase vs uppercase) should be accepted as unchanged
    const res = await service.updateProjectMaterial(
      'PRJ-MAT-CODE',
      'MAT-CODE-1',
      { code: 'agg-10mm', name: 'بحص 10 مم محدث' },
      { userId: 'admin-1' }
    );
    expect(res.material.name).toBe('بحص 10 مم محدث');
    expect(res.material.code).toBe('AGG-10MM');
  });

  // 4. active project membership is required
  it('4. active project membership is required', async () => {
    const service = new ProjectProvisioningAdminService();
    await adminDb.collection('projects').doc('PRJ-MAT-NOMEM').set({ projectId: 'PRJ-MAT-NOMEM' });
    await adminDb.collection('materials').doc('MAT-NOMEM-1').set({
      materialId: 'MAT-NOMEM-1',
      code: 'SAND-RED',
      nameAr: 'رمل أحمر',
    });

    await expect(
      service.updateProjectMaterial(
        'PRJ-MAT-NOMEM',
        'MAT-NOMEM-1',
        { name: 'رمل أحمر جديد' },
        { userId: 'admin-1' }
      )
    ).rejects.toThrow(/MATERIAL_NOT_ACTIVE_IN_PROJECT/);
  });

  // 5. inactive membership fails closed
  it('5. inactive membership fails closed', async () => {
    const service = new ProjectProvisioningAdminService();
    await adminDb.collection('projects').doc('PRJ-MAT-INACTIVE').set({ projectId: 'PRJ-MAT-INACTIVE' });
    await adminDb
      .collection('projects')
      .doc('PRJ-MAT-INACTIVE')
      .collection('material_memberships')
      .doc('MAT-INACTIVE-1')
      .set({
        projectId: 'PRJ-MAT-INACTIVE',
        materialId: 'MAT-INACTIVE-1',
        status: 'INACTIVE',
      });
    await adminDb.collection('materials').doc('MAT-INACTIVE-1').set({
      materialId: 'MAT-INACTIVE-1',
      code: 'GABC-BASE',
      nameAr: 'طبقة أساس',
    });

    await expect(
      service.updateProjectMaterial(
        'PRJ-MAT-INACTIVE',
        'MAT-INACTIVE-1',
        { name: 'طبقة أساس معدلة' },
        { userId: 'admin-1' }
      )
    ).rejects.toThrow(/MATERIAL_NOT_ACTIVE_IN_PROJECT/);
  });

  // 6. missing global Material fails closed
  it('6. missing global Material fails closed', async () => {
    const service = new ProjectProvisioningAdminService();
    await adminDb.collection('projects').doc('PRJ-MAT-NOGLOBAL').set({ projectId: 'PRJ-MAT-NOGLOBAL' });
    await adminDb
      .collection('projects')
      .doc('PRJ-MAT-NOGLOBAL')
      .collection('material_memberships')
      .doc('MAT-MISSING-GLOBAL')
      .set({
        projectId: 'PRJ-MAT-NOGLOBAL',
        materialId: 'MAT-MISSING-GLOBAL',
        status: 'ACTIVE',
      });

    await expect(
      service.updateProjectMaterial(
        'PRJ-MAT-NOGLOBAL',
        'MAT-MISSING-GLOBAL',
        { name: 'مادة جديدة' },
        { userId: 'admin-1' }
      )
    ).rejects.toThrow(/MATERIAL_NOT_FOUND/);
  });

  // 7. membership is READ ONLY during profile update
  it('7. membership is READ ONLY during profile update', () => {
    const updateMaterialMethod = provisioningServerContent.slice(
      provisioningServerContent.indexOf('async updateProjectMaterial('),
      provisioningServerContent.length
    );
    expect(updateMaterialMethod).not.toMatch(/tx\.(set|update|delete)\s*\(\s*membershipRef/);
    expect(updateMaterialMethod).not.toMatch(/tx\.(set|update|delete)\s*\([^)]*material_memberships/);
  });

  // 8. no profile duplication into membership
  it('8. no profile duplication into membership', async () => {
    const service = new ProjectProvisioningAdminService();
    const prjId = 'PRJ-MAT-ZERO-DUP';
    const matId = 'MAT-ZERO-DUP-1';
    const originalMembership = {
      projectId: prjId,
      materialId: matId,
      status: 'ACTIVE',
      createdAt: new Date('2026-01-01T00:00:00Z'),
      createdBy: 'admin-seed',
      updatedAt: new Date('2026-01-01T00:00:00Z'),
      updatedBy: 'admin-seed',
    };

    await adminDb.collection('projects').doc(prjId).set({ projectId: prjId });
    await adminDb.collection('projects').doc(prjId).collection('material_memberships').doc(matId).set(originalMembership);
    await adminDb.collection('materials').doc(matId).set({
      materialId: matId,
      code: 'AGG-10MM',
      nameAr: 'بحص 10 مم قديم',
      unitOfMeasure: 'TON',
      standardDensityTonPerM3: 1.6,
    });

    await service.updateProjectMaterial(
      prjId,
      matId,
      {
        name: 'بحص 10 مم مكرر ومغسول',
        unitOfMeasure: 'M3',
        standardDensityTonPerM3: 1.75,
      },
      { userId: 'admin-updater' }
    );

    const afterSnap = await adminDb.collection('projects').doc(prjId).collection('material_memberships').doc(matId).get();
    const afterData = afterSnap.data();

    // Membership doc must be completely unchanged and contain zero profile fields
    expect(afterData).toEqual(originalMembership);
    expect(afterData.name).toBeUndefined();
    expect(afterData.nameAr).toBeUndefined();
    expect(afterData.code).toBeUndefined();
    expect(afterData.unitOfMeasure).toBeUndefined();
    expect(afterData.standardDensityTonPerM3).toBeUndefined();
  });

  // 9. natural_identity_lookups is untouched
  it('9. natural_identity_lookups is untouched', async () => {
    const service = new ProjectProvisioningAdminService();
    const prjId = 'PRJ-MAT-LOOKUP';
    const matId = 'MAT-LOOKUP-1';
    const lookupKey = 'MATERIAL#AGG-10MM';

    await adminDb.collection('projects').doc(prjId).set({ projectId: prjId });
    await adminDb.collection('projects').doc(prjId).collection('material_memberships').doc(matId).set({
      projectId: prjId,
      materialId: matId,
      status: 'ACTIVE',
    });
    await adminDb.collection('materials').doc(matId).set({
      materialId: matId,
      code: 'AGG-10MM',
      nameAr: 'بحص 10 مم',
    });
    await adminDb.collection('natural_identity_lookups').doc(lookupKey).set({
      key: lookupKey,
      entityType: 'MATERIAL',
      systemId: matId,
      createdAt: new Date('2026-01-01T00:00:00Z'),
    });

    const beforeLookup = (await adminDb.collection('natural_identity_lookups').doc(lookupKey).get()).data();
    await service.updateProjectMaterial(prjId, matId, { name: 'اسم مادة معدل' }, { userId: 'admin-1' });
    const afterLookup = (await adminDb.collection('natural_identity_lookups').doc(lookupKey).get()).data();

    expect(afterLookup).toEqual(beforeLookup);
  });

  // 10. global Material profile is updated
  it('10. global Material profile is updated', async () => {
    const matId = 'MAT-ZERO-DUP-1';
    const globalSnap = await adminDb.collection('materials').doc(matId).get();
    const globalData = globalSnap.data();

    expect(globalData.nameAr).toBe('بحص 10 مم مكرر ومغسول');
    expect(globalData.unitOfMeasure).toBe('M3');
    expect(globalData.standardDensityTonPerM3).toBe(1.75);
    expect(globalData.updatedBy).toBe('admin-updater');
  });

  // 11. createdAt / createdBy preserved
  it('11. createdAt / createdBy preserved', async () => {
    const initialCreatedDate = new Date('2026-01-01T00:00:00Z');
    await adminDb.collection('materials').doc('MAT-DATE-TEST').set({
      materialId: 'MAT-DATE-TEST',
      code: 'SAND-TEST',
      nameAr: 'رمل زمني',
      createdAt: initialCreatedDate,
      createdBy: 'original-creator',
    });
    await adminDb.collection('projects').doc('PRJ-DATE-MAT').set({ projectId: 'PRJ-DATE-MAT' });
    await adminDb.collection('projects').doc('PRJ-DATE-MAT').collection('material_memberships').doc('MAT-DATE-TEST').set({
      projectId: 'PRJ-DATE-MAT',
      materialId: 'MAT-DATE-TEST',
      status: 'ACTIVE',
    });

    const service = new ProjectProvisioningAdminService();
    await service.updateProjectMaterial(
      'PRJ-DATE-MAT',
      'MAT-DATE-TEST',
      { name: 'رمل زمني محدث' },
      { userId: 'new-updater' }
    );

    const updatedDoc = (await adminDb.collection('materials').doc('MAT-DATE-TEST').get()).data();
    expect(updatedDoc.createdAt).toEqual(initialCreatedDate);
    expect(updatedDoc.createdBy).toBe('original-creator');
  });

  // 12. updatedAt / updatedBy refreshed
  it('12. updatedAt / updatedBy refreshed', async () => {
    const updatedDoc = (await adminDb.collection('materials').doc('MAT-DATE-TEST').get()).data();
    expect(updatedDoc.updatedAt).toBeDefined();
    expect(updatedDoc.updatedBy).toBe('new-updater');
  });

  // 13. workspace MATERIALS projection is marked dirty
  it('13. workspace MATERIALS projection is marked dirty', () => {
    const updateMaterialMethod = provisioningServerContent.slice(
      provisioningServerContent.indexOf('async updateProjectMaterial('),
      provisioningServerContent.length
    );
    expect(updateMaterialMethod).toContain('markDirtyInTransaction(');
    expect(updateMaterialMethod).toContain("['MATERIALS']");
    expect(updateMaterialMethod).toContain("'PROJECT_MATERIAL_UPDATED'");
  });

  // 14. name validation
  it('14. name validation', async () => {
    const service = new ProjectProvisioningAdminService();
    await expect(
      service.updateProjectMaterial('PRJ-01', 'MAT-01', { name: '' }, { userId: 'admin-1' })
    ).rejects.toThrow(/INVALID_MATERIAL_NAME/);
  });

  // 15. unit validation
  it('15. unit validation', async () => {
    const service = new ProjectProvisioningAdminService();
    await expect(
      service.updateProjectMaterial('PRJ-01', 'MAT-01', { unitOfMeasure: 'INVALID' as any }, { userId: 'admin-1' })
    ).rejects.toThrow(/INVALID_UNIT_OF_MEASURE/);
  });

  // 16. density validation
  it('16. density validation', async () => {
    const service = new ProjectProvisioningAdminService();
    await expect(
      service.updateProjectMaterial('PRJ-01', 'MAT-01', { standardDensityTonPerM3: -5 }, { userId: 'admin-1' })
    ).rejects.toThrow(/INVALID_MATERIAL_DENSITY/);
  });

  // ==========================================
  // 2. HTTP / CLIENT BOUNDARY
  // ==========================================

  // 17. PATCH route is /api/projects/:projectId/materials/:materialId
  it('17. PATCH route is /api/projects/:projectId/materials/:materialId', () => {
    expect(serverAppContent).toContain("app.patch('/api/projects/:projectId/materials/:materialId'");
  });

  // 18. route uses enforceProjectIsolation
  it('18. route uses enforceProjectIsolation', () => {
    const patchBlock = serverAppContent.slice(
      serverAppContent.indexOf("app.patch('/api/projects/:projectId/materials/:materialId'"),
      serverAppContent.indexOf('});', serverAppContent.indexOf("app.patch('/api/projects/:projectId/materials/:materialId'"))
    );
    expect(patchBlock).toContain('enforceProjectIsolation');
  });

  // 19. route uses enforceAdminOnly
  it('19. route uses enforceAdminOnly', () => {
    const patchBlock = serverAppContent.slice(
      serverAppContent.indexOf("app.patch('/api/projects/:projectId/materials/:materialId'"),
      serverAppContent.indexOf('});', serverAppContent.indexOf("app.patch('/api/projects/:projectId/materials/:materialId'"))
    );
    expect(patchBlock).toContain('enforceAdminOnly');
  });

  // 20. client uses PATCH canonical authority
  it('20. client uses PATCH canonical authority', async () => {
    let capturedMethod = '';
    let capturedUrl = '';
    let capturedBody: any = null;

    const fetchMock = vi.fn().mockImplementation((url, opts) => {
      capturedUrl = url;
      capturedMethod = opts.method;
      capturedBody = JSON.parse(opts.body);
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            projectId: 'PRJ-101',
            materialId: 'MAT-202',
            material: {
              materialId: 'MAT-202',
              name: 'رمل أحمر ممتاز',
              code: 'SAND-RED',
              unitOfMeasure: 'M3',
              standardDensityTonPerM3: 1.55,
            },
          }),
      });
    });

    vi.stubGlobal('fetch', fetchMock);

    const service = new MaterialManagementClientService();
    const res = await service.updateProjectMaterial(
      'PRJ-101',
      'MAT-202',
      { name: 'رمل أحمر ممتاز', unitOfMeasure: 'M3', standardDensityTonPerM3: 1.55 },
      'test-auth-token'
    );

    expect(capturedMethod).toBe('PATCH');
    expect(capturedUrl).toBe('/api/projects/PRJ-101/materials/MAT-202');
    expect(capturedBody).toEqual({
      materialData: {
        name: 'رمل أحمر ممتاز',
        unitOfMeasure: 'M3',
        standardDensityTonPerM3: 1.55,
      },
    });
    expect(res.material.name).toBe('رمل أحمر ممتاز');

    vi.unstubAllGlobals();
  });

  // 21. no direct Firestore writes in client
  it('21. no direct Firestore writes in client', () => {
    expect(clientServiceContent).not.toContain('setDoc');
    expect(clientServiceContent).not.toContain('updateDoc');
    expect(clientServiceContent).not.toContain('deleteDoc');
  });

  // 22. no client ID generation
  it('22. no client ID generation', () => {
    expect(clientServiceContent).not.toContain('uuid');
    expect(clientServiceContent).not.toContain('randomUUID');
    expect(clientServiceContent).not.toContain('generateId');
  });

  // ==========================================
  // 3. REUSABLE MODAL CREATE + EDIT
  // ==========================================

  // 23. one MaterialEditorModal supports CREATE + EDIT
  it('23. one MaterialEditorModal supports CREATE + EDIT', () => {
    expect(modalContent).toContain("mode?: 'CREATE' | 'EDIT'");
    expect(modalContent).toContain('initialMaterial?:');
    expect(modalContent).toContain('export const MaterialEditorModal');
  });

  // 24. EDIT pre-fills canonical values
  it('24. EDIT pre-fills canonical values', () => {
    expect(modalContent).toContain('setName(initialMaterial.name');
    expect(modalContent).toContain('setCode(initialMaterial.code');
    expect(modalContent).toContain('setUnitOfMeasure');
    expect(modalContent).toContain('setStandardDensityTonPerM3');
  });

  // 25. code visible but read-only
  it('25. code visible but read-only', () => {
    expect(modalContent).toContain('(رمز الهوية ثابت وغير قابل للتعديل)');
    expect(modalContent).toContain('disabled={isEditMode');
  });

  // 26. materialId not editable
  it('26. materialId not editable', () => {
    expect(modalContent).not.toContain('name="materialId"');
    expect(modalContent).not.toContain('setMaterialId');
  });

  // 27. CREATE still works
  it('27. CREATE still works', () => {
    expect(modalContent).toContain('clientService.createProjectMaterial');
    expect(modalContent).toContain('onCreated');
  });

  // 28. EDIT uses updateProjectMaterial
  it('28. EDIT uses updateProjectMaterial', () => {
    expect(modalContent).toContain('clientService.updateProjectMaterial');
    expect(modalContent).toContain('onUpdated');
  });

  // 29. PATCH success + refresh failure stores result
  it('29. PATCH success + refresh failure stores result', () => {
    expect(modalContent).toContain('setUpdatedMaterialResult(result)');
    expect(modalContent).toContain('setRefreshFailed(true)');
  });

  // 30. refresh retry does not repeat PATCH
  it('30. refresh retry does not repeat PATCH', () => {
    const retryBlock = modalContent.slice(
      modalContent.indexOf('const handleRetryRefresh ='),
      modalContent.indexOf('return (', modalContent.indexOf('const handleRetryRefresh ='))
    );
    expect(retryBlock).not.toContain('updateProjectMaterial');
    expect(retryBlock).toContain('await onUpdated(updatedMaterialResult)');
  });

  // 31. retry reuses same MaterialUpdateResult
  it('31. retry reuses same MaterialUpdateResult', () => {
    const retryBlock = modalContent.slice(
      modalContent.indexOf('const handleRetryRefresh ='),
      modalContent.indexOf('return (', modalContent.indexOf('const handleRetryRefresh ='))
    );
    expect(retryBlock).toContain('updatedMaterialResult && onUpdated');
  });

  // ==========================================
  // 4. CANONICAL REFRESH BARRIER CONVERGENCE
  // ==========================================

  // 32. materialProfile expectation exists
  it('32. materialProfile expectation exists', () => {
    expect(refreshServiceContent).toContain('materialProfile?: ProjectCanonicalRefreshMaterialProfileExpectation');
  });

  // 33. material visibility is proven
  it('33. material visibility is proven', async () => {
    const refresh = new ProjectCanonicalRefreshService();
    const fetchMock = vi.fn().mockImplementation((url) => {
      if (url.includes('/materials')) return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data: [] }) });
      if (url.includes('/carriers')) return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data: [] }) });
      if (url.includes('/fleet-read-model')) return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data: { rows: [] } }) });
      return Promise.reject(new Error('not found'));
    });
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(canonicalRelationshipContextService, 'getProjectRelationshipContext').mockResolvedValue({
      projectId: 'PRJ-01',
      authorizedMaterialIds: [],
      knownMaterials: [],
    } as any);

    await expect(
      refresh.refresh('PRJ-01', {
        overrideToken: 'tok',
        expect: { materialProfile: { materialId: 'MAT-NONEXIST', name: 'بحص' } },
        maxAttempts: 1,
      })
    ).rejects.toThrow(/CANONICAL_REFRESH_NOT_CONVERGED/);

    vi.unstubAllGlobals();
  });

  // 34. name convergence checked
  it('34. name convergence checked', async () => {
    const refresh = new ProjectCanonicalRefreshService();
    const fetchMock = vi.fn().mockImplementation((url) => {
      if (url.includes('/materials')) return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data: [{ materialId: 'MAT-01', name: 'بحص قديم', code: 'AGG-10' }] }) });
      if (url.includes('/carriers')) return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data: [] }) });
      if (url.includes('/fleet-read-model')) return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data: { rows: [] } }) });
      return Promise.reject(new Error('not found'));
    });
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(canonicalRelationshipContextService, 'getProjectRelationshipContext').mockResolvedValue({
      projectId: 'PRJ-01',
      authorizedMaterialIds: ['MAT-01'],
      knownMaterials: [{ materialId: 'MAT-01', name: 'بحص قديم' }],
    } as any);

    await expect(
      refresh.refresh('PRJ-01', {
        overrideToken: 'tok',
        expect: { materialProfile: { materialId: 'MAT-01', name: 'بحص جديد' } },
        maxAttempts: 1,
      })
    ).rejects.toThrow(/Material name mismatch/);

    vi.unstubAllGlobals();
  });

  // 35. code convergence checked
  it('35. code convergence checked', async () => {
    const refresh = new ProjectCanonicalRefreshService();
    const fetchMock = vi.fn().mockImplementation((url) => {
      if (url.includes('/materials')) return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data: [{ materialId: 'MAT-01', name: 'بحص', code: 'AGG-OLD' }] }) });
      if (url.includes('/carriers')) return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data: [] }) });
      if (url.includes('/fleet-read-model')) return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data: { rows: [] } }) });
      return Promise.reject(new Error('not found'));
    });
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(canonicalRelationshipContextService, 'getProjectRelationshipContext').mockResolvedValue({
      projectId: 'PRJ-01',
      authorizedMaterialIds: ['MAT-01'],
      knownMaterials: [{ materialId: 'MAT-01', name: 'بحص' }],
    } as any);

    await expect(
      refresh.refresh('PRJ-01', {
        overrideToken: 'tok',
        expect: { materialProfile: { materialId: 'MAT-01', code: 'AGG-NEW' } },
        maxAttempts: 1,
      })
    ).rejects.toThrow(/Material code mismatch/);

    vi.unstubAllGlobals();
  });

  // 36. unitOfMeasure convergence checked
  it('36. unitOfMeasure convergence checked', async () => {
    const refresh = new ProjectCanonicalRefreshService();
    const fetchMock = vi.fn().mockImplementation((url) => {
      if (url.includes('/materials')) return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data: [{ materialId: 'MAT-01', name: 'بحص', code: 'AGG-10', unitOfMeasure: 'TON' }] }) });
      if (url.includes('/carriers')) return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data: [] }) });
      if (url.includes('/fleet-read-model')) return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data: { rows: [] } }) });
      return Promise.reject(new Error('not found'));
    });
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(canonicalRelationshipContextService, 'getProjectRelationshipContext').mockResolvedValue({
      projectId: 'PRJ-01',
      authorizedMaterialIds: ['MAT-01'],
      knownMaterials: [{ materialId: 'MAT-01', name: 'بحص' }],
    } as any);

    await expect(
      refresh.refresh('PRJ-01', {
        overrideToken: 'tok',
        expect: { materialProfile: { materialId: 'MAT-01', unitOfMeasure: 'M3' } },
        maxAttempts: 1,
      })
    ).rejects.toThrow(/Material unitOfMeasure mismatch/);

    vi.unstubAllGlobals();
  });

  // 37. density convergence checked
  it('37. density convergence checked', async () => {
    const refresh = new ProjectCanonicalRefreshService();
    const fetchMock = vi.fn().mockImplementation((url) => {
      if (url.includes('/materials')) return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data: [{ materialId: 'MAT-01', name: 'بحص', code: 'AGG-10', standardDensityTonPerM3: 1.6 }] }) });
      if (url.includes('/carriers')) return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data: [] }) });
      if (url.includes('/fleet-read-model')) return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data: { rows: [] } }) });
      return Promise.reject(new Error('not found'));
    });
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(canonicalRelationshipContextService, 'getProjectRelationshipContext').mockResolvedValue({
      projectId: 'PRJ-01',
      authorizedMaterialIds: ['MAT-01'],
      knownMaterials: [{ materialId: 'MAT-01', name: 'بحص' }],
    } as any);

    await expect(
      refresh.refresh('PRJ-01', {
        overrideToken: 'tok',
        expect: { materialProfile: { materialId: 'MAT-01', standardDensityTonPerM3: 1.8 } },
        maxAttempts: 1,
      })
    ).rejects.toThrow(/Material standardDensityTonPerM3 mismatch/);

    vi.unstubAllGlobals();
  });

  // 38. bounded retry preserved
  it('38. bounded retry preserved', async () => {
    const refresh = new ProjectCanonicalRefreshService();
    let callCount = 0;
    const fetchMock = vi.fn().mockImplementation(() => {
      callCount++;
      return Promise.resolve({ ok: false, status: 500 });
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      refresh.refresh('PRJ-01', { overrideToken: 'tok', maxAttempts: 2, delayMs: 1 })
    ).rejects.toThrow(/CANONICAL_REFRESH_MATERIALS_FAILED/);

    expect(callCount).toBe(2 * 3); // 2 attempts, 3 concurrent fetch calls per attempt
    vi.unstubAllGlobals();
  });

  // ==========================================
  // 5. PROJECT SETUP WIZARD INTEGRATION
  // ==========================================

  // 39. Material Edit uses same modal
  it('39. Material Edit uses same modal', () => {
    const editModalInvocation = wizardContent.slice(
      wizardContent.indexOf('{editingMaterial && ('),
      wizardContent.indexOf('/>', wizardContent.indexOf('{editingMaterial && (')) + 2
    );
    expect(editModalInvocation).toContain('<MaterialEditorModal');
    expect(editModalInvocation).toContain('mode="EDIT"');
    expect(editModalInvocation).toContain('initialMaterial={');
  });

  // 40. canonical snapshot applied after successful convergence
  it('40. canonical snapshot applied after successful convergence', () => {
    const editModalInvocation = wizardContent.slice(
      wizardContent.indexOf('{editingMaterial && ('),
      wizardContent.indexOf('/>', wizardContent.indexOf('{editingMaterial && (')) + 2
    );
    expect(editModalInvocation).toContain('projectCanonicalRefreshService.refresh(');
    expect(editModalInvocation).toContain('materialProfile:');
    expect(editModalInvocation).toContain('applyCanonicalSnapshot(snapshot)');
  });

  // 41. wizard phase remains unchanged
  it('41. wizard phase remains unchanged', () => {
    const editModalInvocation = wizardContent.slice(
      wizardContent.indexOf('{editingMaterial && ('),
      wizardContent.indexOf('/>', wizardContent.indexOf('{editingMaterial && (')) + 2
    );
    expect(editModalInvocation).not.toContain('setActivePhase');
  });

  // 42. list updates immediately
  it('42. list updates immediately', () => {
    expect(wizardContent).toContain('onClick={() => setEditingMaterial(m)}');
    expect(wizardContent).toContain('<span>تعديل</span>');
  });

  // 43. existing ENROLL_MATERIAL/create behavior remains intact
  it('43. existing ENROLL_MATERIAL/create behavior remains intact', () => {
    expect(wizardContent).toContain('isOperationallyMutable');
    expect(wizardContent).toContain('setIsAddingMaterial(true)');
  });

  // ==========================================
  // 6. LIST INTEGRITY
  // ==========================================

  // 44. listProjectMaterials does not fabricate fake name/code/unit profile values
  it('44. listProjectMaterials does not fabricate fake name/code/unit profile values', () => {
    const listMethod = provisioningServerContent.slice(
      provisioningServerContent.indexOf('async listProjectMaterials('),
      provisioningServerContent.indexOf('async listProjectCarriers(', provisioningServerContent.indexOf('async listProjectMaterials('))
    );
    expect(listMethod).not.toContain("'غير معروف'");
    expect(listMethod).not.toContain("'—'");
  });

  // 45. density is returned when canonical value exists
  it('45. density is returned when canonical value exists', () => {
    const listMethod = provisioningServerContent.slice(
      provisioningServerContent.indexOf('async listProjectMaterials('),
      provisioningServerContent.indexOf('async listProjectCarriers(', provisioningServerContent.indexOf('async listProjectMaterials('))
    );
    expect(listMethod).toContain('standardDensityTonPerM3:');
  });

  // 46. project material membership remains participation-only
  it('46. project material membership remains participation-only', () => {
    const listMethod = provisioningServerContent.slice(
      provisioningServerContent.indexOf('async listProjectMaterials('),
      provisioningServerContent.indexOf('async listProjectCarriers(', provisioningServerContent.indexOf('async listProjectMaterials('))
    );
    expect(listMethod).toContain("collection('material_memberships')");
    expect(listMethod).toContain("collection('materials')");
  });
});
