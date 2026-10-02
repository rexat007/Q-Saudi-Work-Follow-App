import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { ProjectProvisioningAdminService } from '../services/projectProvisioning.server';
import {
  CarrierManagementClientService,
  CarrierUpdateInput,
} from '../services/carrierManagementClient.service';
import { CarrierEditorModal } from '../components/masterData/CarrierEditorModal';
import { ProjectCanonicalRefreshService } from '../services/projectCanonicalRefresh.service';
import { canonicalRelationshipContextService } from '../services/canonicalRelationshipContext.service';
import { adminDb } from '../firebase/admin';

describe('FOUNDATION A2 — Canonical Carrier Edit Authority', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const provisioningServerPath = path.resolve(__dirname, '../services/projectProvisioning.server.ts');
  const provisioningServerContent = fs.readFileSync(provisioningServerPath, 'utf-8');

  const serverAppPath = path.resolve(__dirname, '../../server/app.ts');
  const serverAppContent = fs.readFileSync(serverAppPath, 'utf-8');

  const clientServicePath = path.resolve(__dirname, '../services/carrierManagementClient.service.ts');
  const clientServiceContent = fs.readFileSync(clientServicePath, 'utf-8');

  const modalPath = path.resolve(__dirname, '../components/masterData/CarrierEditorModal.tsx');
  const modalContent = fs.readFileSync(modalPath, 'utf-8');

  const refreshServicePath = path.resolve(__dirname, '../services/projectCanonicalRefresh.service.ts');
  const refreshServiceContent = fs.readFileSync(refreshServicePath, 'utf-8');

  const wizardPath = path.resolve(__dirname, '../components/wizard/ProjectSetupWizard.tsx');
  const wizardContent = fs.readFileSync(wizardPath, 'utf-8');

  // 1. canonical PATCH route exists
  it('1. canonical PATCH route exists', () => {
    expect(serverAppContent).toContain("app.patch('/api/projects/:projectId/carriers/:carrierId'");
  });

  // 2. route uses enforceProjectIsolation
  it('2. route uses enforceProjectIsolation', () => {
    const patchBlock = serverAppContent.slice(
      serverAppContent.indexOf("app.patch('/api/projects/:projectId/carriers/:carrierId'"),
      serverAppContent.indexOf('});', serverAppContent.indexOf("app.patch('/api/projects/:projectId/carriers/:carrierId'"))
    );
    expect(patchBlock).toContain('enforceProjectIsolation');
  });

  // 3. route uses enforceAdminOnly
  it('3. route uses enforceAdminOnly', () => {
    const patchBlock = serverAppContent.slice(
      serverAppContent.indexOf("app.patch('/api/projects/:projectId/carriers/:carrierId'"),
      serverAppContent.indexOf('});', serverAppContent.indexOf("app.patch('/api/projects/:projectId/carriers/:carrierId'"))
    );
    expect(patchBlock).toContain('enforceAdminOnly');
  });

  // 4. route delegates to updateProjectCarrier
  it('4. route delegates to updateProjectCarrier', () => {
    const patchBlock = serverAppContent.slice(
      serverAppContent.indexOf("app.patch('/api/projects/:projectId/carriers/:carrierId'"),
      serverAppContent.indexOf('});', serverAppContent.indexOf("app.patch('/api/projects/:projectId/carriers/:carrierId'"))
    );
    expect(patchBlock).toContain('provisioningService.updateProjectCarrier(projectId, carrierId, carrierData, user)');
  });

  // 5. service validates projectId
  it('5. service validates projectId', async () => {
    const service = new ProjectProvisioningAdminService();
    await expect(
      service.updateProjectCarrier('', 'CAR-01', { name: 'اسم ناقل' }, { userId: 'admin-1' })
    ).rejects.toThrow(/projectId is required/);
  });

  // 6. service validates carrierId
  it('6. service validates carrierId', async () => {
    const service = new ProjectProvisioningAdminService();
    await expect(
      service.updateProjectCarrier('PRJ-01', '', { name: 'اسم ناقل' }, { userId: 'admin-1' })
    ).rejects.toThrow(/carrierId is required/);
  });

  // 7. missing project fails closed
  it('7. missing project fails closed', async () => {
    const service = new ProjectProvisioningAdminService();
    await expect(
      service.updateProjectCarrier('PRJ-NONEXISTENT', 'CAR-01', { name: 'اسم ناقل' }, { userId: 'admin-1' })
    ).rejects.toThrow(/PROJECT_NOT_FOUND/);
  });

  // 8. missing global carrier fails closed
  it('8. missing global carrier fails closed', async () => {
    const service = new ProjectProvisioningAdminService();
    // Setup existing project and membership, but no global carrier
    await adminDb.collection('projects').doc('PRJ-A2-TEST1').set({ projectId: 'PRJ-A2-TEST1', name: 'مشروع اختبار' });
    await adminDb.collection('projects').doc('PRJ-A2-TEST1').collection('carrier_memberships').doc('CAR-MISSING-GLOBAL').set({
      projectId: 'PRJ-A2-TEST1',
      carrierId: 'CAR-MISSING-GLOBAL',
      status: 'ACTIVE',
    });

    await expect(
      service.updateProjectCarrier('PRJ-A2-TEST1', 'CAR-MISSING-GLOBAL', { name: 'اسم ناقل جديد' }, { userId: 'admin-1' })
    ).rejects.toThrow(/CARRIER_NOT_FOUND/);
  });

  // 9. missing project membership fails closed
  it('9. missing project membership fails closed', async () => {
    const service = new ProjectProvisioningAdminService();
    await adminDb.collection('projects').doc('PRJ-A2-TEST2').set({ projectId: 'PRJ-A2-TEST2' });
    await adminDb.collection('carriers').doc('CAR-GLOBAL-ONLY').set({ carrierId: 'CAR-GLOBAL-ONLY', commercialRegistrationNo: '1010000001' });

    await expect(
      service.updateProjectCarrier('PRJ-A2-TEST2', 'CAR-GLOBAL-ONLY', { name: 'اسم ناقل جديد' }, { userId: 'admin-1' })
    ).rejects.toThrow(/CARRIER_NOT_ACTIVE_IN_PROJECT/);
  });

  // 10. non-ACTIVE membership fails closed
  it('10. non-ACTIVE membership fails closed', async () => {
    const service = new ProjectProvisioningAdminService();
    await adminDb.collection('projects').doc('PRJ-A2-TEST3').set({ projectId: 'PRJ-A2-TEST3' });
    await adminDb.collection('projects').doc('PRJ-A2-TEST3').collection('carrier_memberships').doc('CAR-INACTIVE').set({
      projectId: 'PRJ-A2-TEST3',
      carrierId: 'CAR-INACTIVE',
      status: 'INACTIVE',
    });
    await adminDb.collection('carriers').doc('CAR-INACTIVE').set({ carrierId: 'CAR-INACTIVE', commercialRegistrationNo: '1010000002' });

    await expect(
      service.updateProjectCarrier('PRJ-A2-TEST3', 'CAR-INACTIVE', { name: 'اسم ناقل جديد' }, { userId: 'admin-1' })
    ).rejects.toThrow(/CARRIER_NOT_ACTIVE_IN_PROJECT/);
  });

  // 11. carrierId cannot change
  it('11. carrierId cannot change', async () => {
    const service = new ProjectProvisioningAdminService();
    await expect(
      service.updateProjectCarrier('PRJ-01', 'CAR-01', { carrierId: 'CAR-DIFFERENT', name: 'ناقل' }, { userId: 'admin-1' })
    ).rejects.toThrow(/IMMUTABLE_CARRIER_ID/);
  });

  // 12. CR cannot change
  it('12. CR cannot change', async () => {
    const service = new ProjectProvisioningAdminService();
    await adminDb.collection('projects').doc('PRJ-A2-CR').set({ projectId: 'PRJ-A2-CR' });
    await adminDb.collection('projects').doc('PRJ-A2-CR').collection('carrier_memberships').doc('CAR-CR-TEST').set({
      projectId: 'PRJ-A2-CR',
      carrierId: 'CAR-CR-TEST',
      status: 'ACTIVE',
    });
    await adminDb.collection('carriers').doc('CAR-CR-TEST').set({
      carrierId: 'CAR-CR-TEST',
      commercialRegistrationNo: '1010111111',
      nameAr: 'الناقل القديم',
    });

    await expect(
      service.updateProjectCarrier('PRJ-A2-CR', 'CAR-CR-TEST', { commercialRegistrationNo: '1010999999', name: 'الناقل المعدل' }, { userId: 'admin-1' })
    ).rejects.toThrow(/IMMUTABLE_CARRIER_CR/);
  });

  // 13. natural identity lookup is untouched
  it('13. natural identity lookup is untouched', () => {
    const updateCarrierMethod = provisioningServerContent.slice(
      provisioningServerContent.indexOf('async updateProjectCarrier('),
      provisioningServerContent.indexOf('listProjectMaterials(', provisioningServerContent.indexOf('async updateProjectCarrier('))
    );
    expect(updateCarrierMethod).not.toContain("collection('natural_identity_lookups')");
  });

  // 14. no new carrierId generated
  it('14. no new carrierId generated', () => {
    const updateCarrierMethod = provisioningServerContent.slice(
      provisioningServerContent.indexOf('async updateProjectCarrier('),
      provisioningServerContent.indexOf('listProjectMaterials(', provisioningServerContent.indexOf('async updateProjectCarrier('))
    );
    expect(updateCarrierMethod).not.toContain('generateOpaqueGlobalId');
  });

  // 15. no new membership created
  it('15. no new membership created', () => {
    const updateCarrierMethod = provisioningServerContent.slice(
      provisioningServerContent.indexOf('async updateProjectCarrier('),
      provisioningServerContent.indexOf('listProjectMaterials(', provisioningServerContent.indexOf('async updateProjectCarrier('))
    );
    expect(updateCarrierMethod).not.toContain('mustCreateMembership');
  });

  // 16. carrier name can update
  it('16. carrier name can update', async () => {
    const service = new ProjectProvisioningAdminService();
    await adminDb.collection('projects').doc('PRJ-A2-UPDATE').set({ projectId: 'PRJ-A2-UPDATE' });
    await adminDb.collection('projects').doc('PRJ-A2-UPDATE').collection('carrier_memberships').doc('CAR-UPD-1').set({
      projectId: 'PRJ-A2-UPDATE',
      carrierId: 'CAR-UPD-1',
      status: 'ACTIVE',
    });
    await adminDb.collection('carriers').doc('CAR-UPD-1').set({
      carrierId: 'CAR-UPD-1',
      commercialRegistrationNo: '1010222222',
      nameAr: 'اسم الناقل القديم',
    });

    const res = await service.updateProjectCarrier('PRJ-A2-UPDATE', 'CAR-UPD-1', { name: 'شركة النقل العالمية المحدثة' }, { userId: 'actor-1' });
    expect(res.carrier.name).toBe('شركة النقل العالمية المحدثة');
  });

  // 17. TGA/license can update
  it('17. TGA/license can update', async () => {
    const service = new ProjectProvisioningAdminService();
    const res = await service.updateProjectCarrier('PRJ-A2-UPDATE', 'CAR-UPD-1', { transportLicenseNo: 'TGA-NEW-9988' }, { userId: 'actor-1' });
    expect(res.carrier.transportLicenseNo).toBe('TGA-NEW-9988');
  });

  // 18. TGA/license can be cleared
  it('18. TGA/license can be cleared', async () => {
    const service = new ProjectProvisioningAdminService();
    const res = await service.updateProjectCarrier('PRJ-A2-UPDATE', 'CAR-UPD-1', { transportLicenseNo: '' }, { userId: 'actor-1' });
    expect(res.carrier.transportLicenseNo).toBeNull();
  });

  // 19. contact name can update
  it('19. contact name can update', async () => {
    const service = new ProjectProvisioningAdminService();
    const res = await service.updateProjectCarrier('PRJ-A2-UPDATE', 'CAR-UPD-1', { contactPersonName: 'خالد عبدالله' }, { userId: 'actor-1' });
    expect(res.carrier.contactPerson?.name).toBe('خالد عبدالله');
  });

  // 20. phone can update
  it('20. phone can update', async () => {
    const service = new ProjectProvisioningAdminService();
    const res = await service.updateProjectCarrier('PRJ-A2-UPDATE', 'CAR-UPD-1', { contactPhone: '0551234567' }, { userId: 'actor-1' });
    expect(res.carrier.contactPerson?.phone).toBe('0551234567');
  });

  // 21. email can update
  it('21. email can update', async () => {
    const service = new ProjectProvisioningAdminService();
    const res = await service.updateProjectCarrier('PRJ-A2-UPDATE', 'CAR-UPD-1', { contactEmail: 'khaled@carrier.com' }, { userId: 'actor-1' });
    expect(res.carrier.contactPerson?.email).toBe('khaled@carrier.com');
  });

  // 22. all contact fields can be cleared
  it('22. all contact fields can be cleared', async () => {
    const service = new ProjectProvisioningAdminService();
    const res = await service.updateProjectCarrier(
      'PRJ-A2-UPDATE',
      'CAR-UPD-1',
      { contactPersonName: '', contactPhone: '', contactEmail: '' },
      { userId: 'actor-1' }
    );
    expect(res.carrier.contactPerson).toBeNull();
  });

  // 23. undefined values are not persisted
  it('23. undefined values are not persisted', async () => {
    const docSnap = await adminDb.collection('carriers').doc('CAR-UPD-1').get();
    const data = docSnap.data();
    for (const [k, v] of Object.entries(data)) {
      expect(v).not.toBeUndefined();
    }
  });

  // 24. createdAt is preserved
  it('24. createdAt is preserved', async () => {
    const initialCreatedDate = new Date('2026-01-01T00:00:00Z');
    await adminDb.collection('carriers').doc('CAR-DATE-TEST').set({
      carrierId: 'CAR-DATE-TEST',
      commercialRegistrationNo: '1010333333',
      nameAr: 'ناقل زمني',
      createdAt: initialCreatedDate,
      createdBy: 'original-creator',
    });
    await adminDb.collection('projects').doc('PRJ-DATE').set({ projectId: 'PRJ-DATE' });
    await adminDb.collection('projects').doc('PRJ-DATE').collection('carrier_memberships').doc('CAR-DATE-TEST').set({
      projectId: 'PRJ-DATE',
      carrierId: 'CAR-DATE-TEST',
      status: 'ACTIVE',
    });

    const service = new ProjectProvisioningAdminService();
    await service.updateProjectCarrier('PRJ-DATE', 'CAR-DATE-TEST', { name: 'ناقل زمني محدث' }, { userId: 'new-actor' });

    const updatedDoc = (await adminDb.collection('carriers').doc('CAR-DATE-TEST').get()).data();
    expect(updatedDoc.createdAt).toEqual(initialCreatedDate);
    expect(updatedDoc.createdBy).toBe('original-creator');
  });

  // 25. createdBy is preserved
  it('25. createdBy is preserved', async () => {
    const updatedDoc = (await adminDb.collection('carriers').doc('CAR-DATE-TEST').get()).data();
    expect(updatedDoc.createdBy).toBe('original-creator');
  });

  // 26. updatedAt changes
  it('26. updatedAt changes', async () => {
    const updatedDoc = (await adminDb.collection('carriers').doc('CAR-DATE-TEST').get()).data();
    expect(updatedDoc.updatedAt).toBeDefined();
  });

  // 27. updatedBy is current actor
  it('27. updatedBy is current actor', async () => {
    const updatedDoc = (await adminDb.collection('carriers').doc('CAR-DATE-TEST').get()).data();
    expect(updatedDoc.updatedBy).toBe('new-actor');
  });

  // 28. CARRIERS projection marked dirty
  it('28. CARRIERS projection marked dirty', () => {
    expect(provisioningServerContent).toContain("['CARRIERS'],\n        'PROJECT_CARRIER_UPDATED'");
  });

  // 29. transaction reads occur before writes
  it('29. transaction reads occur before writes', () => {
    const updateBlock = provisioningServerContent.slice(
      provisioningServerContent.indexOf('async updateProjectCarrier('),
      provisioningServerContent.indexOf('listProjectMaterials(', provisioningServerContent.indexOf('async updateProjectCarrier('))
    );
    expect(updateBlock).toContain('// --- PHASE 1: ALL TRANSACTION READS ---');
    expect(updateBlock).toContain('// --- PHASE 2: ALL TRANSACTION WRITES ---');
    expect(updateBlock.indexOf('PHASE 1')).toBeLessThan(updateBlock.indexOf('PHASE 2'));
  });

  // 30. server returns persisted canonical profile
  it('30. server returns persisted canonical profile', async () => {
    const service = new ProjectProvisioningAdminService();
    const res = await service.updateProjectCarrier('PRJ-DATE', 'CAR-DATE-TEST', { name: 'اسم نهائي' }, { userId: 'user-1' });
    expect(res).toEqual({
      projectId: 'PRJ-DATE',
      carrierId: 'CAR-DATE-TEST',
      carrier: {
        carrierId: 'CAR-DATE-TEST',
        name: 'اسم نهائي',
        commercialRegistrationNo: '1010333333',
        transportLicenseNo: null,
        contactPerson: null,
      },
    });
  });

  // 31. client update uses PATCH endpoint
  it('31. client update uses PATCH endpoint', async () => {
    let capturedMethod = '';
    let capturedUrl = '';
    const fetchMock = vi.fn().mockImplementation((url, opts) => {
      capturedUrl = url;
      capturedMethod = opts.method;
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, carrier: { carrierId: 'CAR-01', name: 'N' } }),
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    const client = new CarrierManagementClientService();
    await client.updateProjectCarrier('PRJ-01', 'CAR-01', { name: 'الاسم الجديد' }, 'token-abc');

    expect(capturedMethod).toBe('PATCH');
    expect(capturedUrl).toBe('/api/projects/PRJ-01/carriers/CAR-01');
    vi.unstubAllGlobals();
  });

  // 32. client uses auth token
  it('32. client uses auth token', async () => {
    let capturedHeaders: any = null;
    const fetchMock = vi.fn().mockImplementation((url, opts) => {
      capturedHeaders = opts.headers;
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, carrier: { carrierId: 'CAR-01', name: 'N' } }),
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    const client = new CarrierManagementClientService();
    await client.updateProjectCarrier('PRJ-01', 'CAR-01', { name: 'الاسم الجديد' }, 'bearer-token-999');

    expect(capturedHeaders.Authorization).toBe('Bearer bearer-token-999');
    vi.unstubAllGlobals();
  });

  // 33. client performs no Firestore write
  it('33. client performs no Firestore write', () => {
    expect(clientServiceContent).not.toContain('setDoc');
    expect(clientServiceContent).not.toContain('updateDoc');
    expect(clientServiceContent).not.toContain('addDoc');
  });

  // 34. CarrierEditorModal supports CREATE
  it('34. CarrierEditorModal supports CREATE', () => {
    expect(modalContent).toContain("mode?: 'CREATE' | 'EDIT'");
    expect(modalContent).toContain('onCreated?:');
  });

  // 35. CarrierEditorModal supports EDIT
  it('35. CarrierEditorModal supports EDIT', () => {
    expect(modalContent).toContain('onUpdated?:');
    expect(modalContent).toContain('initialCarrier?:');
    expect(modalContent).toContain('تعديل بيانات الناقل');
  });

  // 36. edit form prefills existing values
  it('36. edit form prefills existing values', () => {
    expect(modalContent).toContain('if (isEditMode && initialCarrier) {');
    expect(modalContent).toContain('setName(initialCarrier.name');
    expect(modalContent).toContain('setCommercialRegistrationNo(initialCarrier.commercialRegistrationNo');
  });

  // 37. CR is read-only in EDIT
  it('37. CR is read-only in EDIT', () => {
    expect(modalContent).toContain('disabled={isSubmitting || refreshFailed || isEditMode}');
    expect(modalContent).toContain('رقم الهوية ثابت وغير قابل للتعديل');
  });

  // 38. carrierId is not editable
  it('38. carrierId is not editable', () => {
    expect(modalContent).not.toContain('<input value={carrierId}');
  });

  // 39. create behavior remains working
  it('39. create behavior remains working', () => {
    expect(modalContent).toContain('clientService.createProjectCarrier(projectId, payload)');
    expect(modalContent).toContain('await onCreated(result)');
  });

  // 40. edit calls updateProjectCarrier only once
  it('40. edit calls updateProjectCarrier only once', () => {
    expect(modalContent).toContain('let result = updatedCarrierResult;');
    expect(modalContent).toContain('result = await updater(projectId, targetCarrierId, payload);');
  });

  // 41. edit-refresh retry does not PATCH again
  it('41. edit-refresh retry does not PATCH again', () => {
    const handleRetrySection = modalContent.slice(
      modalContent.indexOf('const handleRetryRefresh ='),
      modalContent.indexOf('return (', modalContent.indexOf('const handleRetryRefresh ='))
    );
    expect(handleRetrySection).not.toContain('updater(');
    expect(handleRetrySection).not.toContain('updateProjectCarrier(');
    expect(handleRetrySection).toContain('await onUpdated(updatedCarrierResult)');
  });

  // 42. refresh service supports carrierProfile expectation
  it('42. refresh service supports carrierProfile expectation', () => {
    expect(refreshServiceContent).toContain('carrierProfile?: ProjectCanonicalRefreshCarrierProfileExpectation');
    expect(refreshServiceContent).toContain('if (expect?.carrierProfile) {');
  });

  // 43. edit convergence checks refreshed carrier name
  it('43. edit convergence checks refreshed carrier name', async () => {
    const refresh = new ProjectCanonicalRefreshService();
    const fetchMock = vi.fn().mockImplementation((url) => {
      if (url.includes('/materials')) return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data: [] }) });
      if (url.includes('/carriers')) return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data: [{ carrierId: 'CAR-01', name: 'الاسم القديم' }] }) });
      if (url.includes('/fleet-read-model')) return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data: { rows: [] } }) });
      return Promise.reject(new Error('not found'));
    });
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(canonicalRelationshipContextService, 'getProjectRelationshipContext').mockResolvedValue({
      projectId: 'PRJ-01',
      authorizedCarrierIds: ['CAR-01'],
      knownCarriers: [{ carrierId: 'CAR-01', name: 'الاسم القديم', status: 'ACTIVE' }],
    } as any);

    await expect(
      refresh.refresh('PRJ-01', {
        overrideToken: 'tok',
        expect: { carrierProfile: { carrierId: 'CAR-01', name: 'الاسم الجديد المستهدف' } },
        maxAttempts: 1,
      })
    ).rejects.toThrow(/Carrier name mismatch/);
    vi.unstubAllGlobals();
  });

  // 44. edit convergence checks relationship-context carrier name
  it('44. edit convergence checks relationship-context carrier name', async () => {
    const refresh = new ProjectCanonicalRefreshService();
    const fetchMock = vi.fn().mockImplementation((url) => {
      if (url.includes('/materials')) return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data: [] }) });
      if (url.includes('/carriers')) return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data: [{ carrierId: 'CAR-01', name: 'الاسم الجديد' }] }) });
      if (url.includes('/fleet-read-model')) return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data: { rows: [] } }) });
      return Promise.reject(new Error('not found'));
    });
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(canonicalRelationshipContextService, 'getProjectRelationshipContext').mockResolvedValue({
      projectId: 'PRJ-01',
      authorizedCarrierIds: ['CAR-01'],
      knownCarriers: [{ carrierId: 'CAR-01', name: 'الاسم القديم غير المتطابق', status: 'ACTIVE' }],
    } as any);

    await expect(
      refresh.refresh('PRJ-01', {
        overrideToken: 'tok',
        expect: { carrierProfile: { carrierId: 'CAR-01', name: 'الاسم الجديد' } },
        maxAttempts: 1,
      })
    ).rejects.toThrow(/Carrier name mismatch in knownCarriers/);
    vi.unstubAllGlobals();
  });

  // 45. edit convergence checks optional field presence/absence
  it('45. edit convergence checks optional field presence/absence', async () => {
    const refresh = new ProjectCanonicalRefreshService();
    const fetchMock = vi.fn().mockImplementation((url) => {
      if (url.includes('/materials')) return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data: [] }) });
      if (url.includes('/carriers')) return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data: [{ carrierId: 'CAR-01', name: 'الاسم الجديد', transportLicenseNo: 'OLD-LIC' }] }) });
      if (url.includes('/fleet-read-model')) return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data: { rows: [] } }) });
      return Promise.reject(new Error('not found'));
    });
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(canonicalRelationshipContextService, 'getProjectRelationshipContext').mockResolvedValue({
      projectId: 'PRJ-01',
      authorizedCarrierIds: ['CAR-01'],
      knownCarriers: [{ carrierId: 'CAR-01', name: 'الاسم الجديد', status: 'ACTIVE' }],
    } as any);

    // Expecting transportLicenseNo to be cleared (null), but server returned OLD-LIC
    await expect(
      refresh.refresh('PRJ-01', {
        overrideToken: 'tok',
        expect: { carrierProfile: { carrierId: 'CAR-01', name: 'الاسم الجديد', transportLicenseNo: null } },
        maxAttempts: 1,
      })
    ).rejects.toThrow(/Carrier transportLicenseNo mismatch/);
    vi.unstubAllGlobals();
  });

  // 46. stale old profile fails convergence
  it('46. stale old profile fails convergence', async () => {
    const refresh = new ProjectCanonicalRefreshService();
    const fetchMock = vi.fn().mockImplementation((url) => {
      if (url.includes('/materials')) return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data: [] }) });
      if (url.includes('/carriers')) return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data: [{ carrierId: 'CAR-01', name: 'قديم', contactPerson: { phone: '0550000000' } }] }) });
      if (url.includes('/fleet-read-model')) return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data: { rows: [] } }) });
      return Promise.reject(new Error('not found'));
    });
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(canonicalRelationshipContextService, 'getProjectRelationshipContext').mockResolvedValue({
      projectId: 'PRJ-01',
      authorizedCarrierIds: ['CAR-01'],
      knownCarriers: [{ carrierId: 'CAR-01', name: 'قديم', status: 'ACTIVE' }],
    } as any);

    await expect(
      refresh.refresh('PRJ-01', {
        overrideToken: 'tok',
        expect: { carrierProfile: { carrierId: 'CAR-01', name: 'جديد', contactPhone: '0551111111' } },
        maxAttempts: 1,
      })
    ).rejects.toThrow(/CANONICAL_REFRESH_NOT_CONVERGED/);
    vi.unstubAllGlobals();
  });

  // 47. ProjectSetupWizard exposes minimal Edit action
  it('47. ProjectSetupWizard exposes minimal Edit action', () => {
    expect(wizardContent).toContain('onClick={() => setEditingCarrier(c)}');
    expect(wizardContent).toContain('<span>تعديل</span>');
  });

  // 48. edit opens same CarrierEditorModal
  it('48. edit opens same CarrierEditorModal', () => {
    const editModalInvocation = wizardContent.slice(
      wizardContent.indexOf('{editingCarrier && ('),
      wizardContent.indexOf('/>', wizardContent.indexOf('{editingCarrier && (')) + 2
    );
    expect(editModalInvocation).toContain('<CarrierEditorModal');
    expect(editModalInvocation).toContain('mode="EDIT"');
    expect(editModalInvocation).toContain('initialCarrier={editingCarrier}');
  });

  // 49. successful edit uses full canonical refresh
  it('49. successful edit uses full canonical refresh', () => {
    const editModalInvocation = wizardContent.slice(
      wizardContent.indexOf('{editingCarrier && ('),
      wizardContent.indexOf('/>', wizardContent.indexOf('{editingCarrier && (')) + 2
    );
    expect(editModalInvocation).toContain('projectCanonicalRefreshService.refresh(');
    expect(editModalInvocation).toContain('carrierProfile:');
  });

  // 50. successful edit applies atomic snapshot
  it('50. successful edit applies atomic snapshot', () => {
    const editModalInvocation = wizardContent.slice(
      wizardContent.indexOf('{editingCarrier && ('),
      wizardContent.indexOf('/>', wizardContent.indexOf('{editingCarrier && (')) + 2
    );
    expect(editModalInvocation).toContain('applyCanonicalSnapshot(snapshot)');
  });

  // 51. project phase remains unchanged
  it('51. project phase remains unchanged', () => {
    const editModalInvocation = wizardContent.slice(
      wizardContent.indexOf('{editingCarrier && ('),
      wizardContent.indexOf('/>', wizardContent.indexOf('{editingCarrier && (')) + 2
    );
    expect(editModalInvocation).not.toContain('setActivePhase');
  });

  // 52. listProjectCarriers no longer fabricates TGA
  it('52. listProjectCarriers no longer fabricates TGA', () => {
    expect(provisioningServerContent).not.toContain('`TGA-${m.carrierId}`');
  });

  // 53. listProjectCarriers no longer fabricates contact values
  it('53. listProjectCarriers no longer fabricates contact values', () => {
    expect(provisioningServerContent).not.toContain("{ name: 'Operations', phone: '—', email: '—' }");
  });

  // 54. Smart Import remains untouched
  it('54. Smart Import remains untouched', () => {
    expect(wizardContent).toContain('handleApproveRosterMappingAndStartPipeline');
    expect(wizardContent).toContain('DriverTruckPipelineService');
  });

  // 55. Material flow remains untouched
  it('55. Material flow remains untouched', () => {
    expect(wizardContent).toContain('handleAddMaterial');
    expect(wizardContent).toContain('isAddingMaterial');
  });

  // 56. CR identity migration remains out of scope
  it('56. CR identity migration remains out of scope', () => {
    expect(modalContent).toContain('(رقم الهوية ثابت وغير قابل للتعديل)');
  });

  // =========================================================================
  // CARRIER MEMBERSHIP ZERO-DUPLICATION & READ-ONLY AUTHORITY (REMEDIATION)
  // =========================================================================

  // 57. carrier membership is read to authorize the edit
  it('57. carrier membership is read to authorize the edit', async () => {
    const service = new ProjectProvisioningAdminService();
    const prjId = 'PRJ-MEM-AUTH-CHECK';
    const carId = 'CAR-MEM-AUTH-CHECK';
    await adminDb.collection('projects').doc(prjId).set({ projectId: prjId });
    await adminDb.collection('carriers').doc(carId).set({ carrierId: carId, commercialRegistrationNo: '1010888881', nameAr: 'ناقل 1' });
    
    // No membership doc
    await expect(
      service.updateProjectCarrier(prjId, carId, { name: 'ناقل جديد' }, { userId: 'admin-1' })
    ).rejects.toThrow(/CARRIER_NOT_ACTIVE_IN_PROJECT/);

    // INACTIVE membership doc
    await adminDb.collection('projects').doc(prjId).collection('carrier_memberships').doc(carId).set({
      projectId: prjId,
      carrierId: carId,
      status: 'INACTIVE',
    });
    await expect(
      service.updateProjectCarrier(prjId, carId, { name: 'ناقل جديد' }, { userId: 'admin-1' })
    ).rejects.toThrow(/CARRIER_NOT_ACTIVE_IN_PROJECT/);
  });

  // 58. carrier membership receives ZERO writes during profile update
  it('58. carrier membership receives ZERO writes during profile update', () => {
    const updateCarrierMethod = provisioningServerContent.slice(
      provisioningServerContent.indexOf('async updateProjectCarrier('),
      provisioningServerContent.indexOf('listProjectMaterials(', provisioningServerContent.indexOf('async updateProjectCarrier('))
    );
    // Must NOT call tx.set / tx.update / tx.delete on membershipRef
    expect(updateCarrierMethod).not.toMatch(/tx\.(set|update|delete)\s*\(\s*membershipRef/);
    // Must NOT set or update into carrier_memberships collection
    expect(updateCarrierMethod).not.toMatch(/tx\.(set|update|delete)\s*\([^)]*carrier_memberships/);
  });

  // 59. membership document before edit deep-equals membership document after edit
  it('59. membership document before edit deep-equals membership document after edit', async () => {
    const service = new ProjectProvisioningAdminService();
    const prjId = 'PRJ-ZERO-DUP';
    const carId = 'CAR-ZERO-DUP-1';
    const originalMembership = {
      projectId: prjId,
      carrierId: carId,
      status: 'ACTIVE',
      createdAt: new Date('2026-01-15T10:00:00Z'),
      createdBy: 'initial-admin',
      updatedAt: new Date('2026-01-15T10:00:00Z'),
      updatedBy: 'initial-admin',
    };

    await adminDb.collection('projects').doc(prjId).set({ projectId: prjId });
    await adminDb.collection('projects').doc(prjId).collection('carrier_memberships').doc(carId).set(originalMembership);
    await adminDb.collection('carriers').doc(carId).set({
      carrierId: carId,
      commercialRegistrationNo: '1010999901',
      nameAr: 'اسم الناقل الأصلي',
      transportLicenseNo: 'LIC-OLD-1',
      contactPerson: { name: 'مسؤول قديم', phone: '0500000000', email: 'old@carrier.sa' },
    });

    const beforeSnap = await adminDb.collection('projects').doc(prjId).collection('carrier_memberships').doc(carId).get();
    const beforeData = beforeSnap.data();

    await service.updateProjectCarrier(
      prjId,
      carId,
      {
        name: 'اسم الناقل الحديث جدا',
        transportLicenseNo: 'LIC-NEW-99',
        contactPersonName: 'مسؤول جديد',
        contactPhone: '0555555555',
        contactEmail: 'new@carrier.sa',
      },
      { userId: 'admin-updater' }
    );

    const afterSnap = await adminDb.collection('projects').doc(prjId).collection('carrier_memberships').doc(carId).get();
    const afterData = afterSnap.data();

    // Membership document must remain identical
    expect(afterData).toEqual(beforeData);
  });

  // 60. membership updatedAt is unchanged
  it('60. membership updatedAt is unchanged', async () => {
    const prjId = 'PRJ-ZERO-DUP';
    const carId = 'CAR-ZERO-DUP-1';
    const snap = await adminDb.collection('projects').doc(prjId).collection('carrier_memberships').doc(carId).get();
    expect(snap.data().updatedAt).toEqual(new Date('2026-01-15T10:00:00Z'));
  });

  // 61. membership updatedBy is unchanged
  it('61. membership updatedBy is unchanged', async () => {
    const prjId = 'PRJ-ZERO-DUP';
    const carId = 'CAR-ZERO-DUP-1';
    const snap = await adminDb.collection('projects').doc(prjId).collection('carrier_memberships').doc(carId).get();
    expect(snap.data().updatedBy).toBe('initial-admin');
  });

  // 62. name is NOT copied into membership
  it('62. name is NOT copied into membership', async () => {
    const prjId = 'PRJ-ZERO-DUP';
    const carId = 'CAR-ZERO-DUP-1';
    const snap = await adminDb.collection('projects').doc(prjId).collection('carrier_memberships').doc(carId).get();
    expect(snap.data().name).toBeUndefined();
    expect(snap.data().nameAr).toBeUndefined();
  });

  // 63. commercialRegistrationNo is NOT copied into membership
  it('63. commercialRegistrationNo is NOT copied into membership', async () => {
    const prjId = 'PRJ-ZERO-DUP';
    const carId = 'CAR-ZERO-DUP-1';
    const snap = await adminDb.collection('projects').doc(prjId).collection('carrier_memberships').doc(carId).get();
    expect(snap.data().commercialRegistrationNo).toBeUndefined();
  });

  // 64. transportLicenseNo is NOT copied into membership
  it('64. transportLicenseNo is NOT copied into membership', async () => {
    const prjId = 'PRJ-ZERO-DUP';
    const carId = 'CAR-ZERO-DUP-1';
    const snap = await adminDb.collection('projects').doc(prjId).collection('carrier_memberships').doc(carId).get();
    expect(snap.data().transportLicenseNo).toBeUndefined();
  });

  // 65. contactPerson is NOT copied into membership
  it('65. contactPerson is NOT copied into membership', async () => {
    const prjId = 'PRJ-ZERO-DUP';
    const carId = 'CAR-ZERO-DUP-1';
    const snap = await adminDb.collection('projects').doc(prjId).collection('carrier_memberships').doc(carId).get();
    expect(snap.data().contactPerson).toBeUndefined();
    expect(snap.data().contactPersonName).toBeUndefined();
    expect(snap.data().contactPhone).toBeUndefined();
    expect(snap.data().contactEmail).toBeUndefined();
  });

  // 66. global carriers/{carrierId} is the only carrier-profile document updated
  it('66. global carriers/{carrierId} is the only carrier-profile document updated', async () => {
    const carId = 'CAR-ZERO-DUP-1';
    const globalSnap = await adminDb.collection('carriers').doc(carId).get();
    const globalData = globalSnap.data();
    expect(globalData.nameAr).toBe('اسم الناقل الحديث جدا');
    expect(globalData.transportLicenseNo).toBe('LIC-NEW-99');
    expect(globalData.contactPerson?.name).toBe('مسؤول جديد');
    expect(globalData.contactPerson?.phone).toBe('0555555555');
    expect(globalData.contactPerson?.email).toBe('new@carrier.sa');
    expect(globalData.updatedBy).toBe('admin-updater');
  });

  // 67. workspace CARRIERS projection is still marked dirty
  it('67. workspace CARRIERS projection is still marked dirty', () => {
    const updateCarrierMethod = provisioningServerContent.slice(
      provisioningServerContent.indexOf('async updateProjectCarrier('),
      provisioningServerContent.indexOf('listProjectMaterials(', provisioningServerContent.indexOf('async updateProjectCarrier('))
    );
    expect(updateCarrierMethod).toContain('markDirtyInTransaction(');
    expect(updateCarrierMethod).toContain("['CARRIERS']");
    expect(updateCarrierMethod).toContain("'PROJECT_CARRIER_UPDATED'");
  });

  // 68. natural_identity_lookups remains unchanged
  it('68. natural_identity_lookups remains unchanged', async () => {
    const service = new ProjectProvisioningAdminService();
    const prjId = 'PRJ-LOOKUP-TEST';
    const carId = 'CAR-LOOKUP-1';
    const lookupKey = 'CARRIER#1010777777';
    await adminDb.collection('projects').doc(prjId).set({ projectId: prjId });
    await adminDb.collection('projects').doc(prjId).collection('carrier_memberships').doc(carId).set({
      projectId: prjId,
      carrierId: carId,
      status: 'ACTIVE',
    });
    await adminDb.collection('carriers').doc(carId).set({
      carrierId: carId,
      commercialRegistrationNo: '1010777777',
      nameAr: 'ناقل هوية 1',
    });
    await adminDb.collection('natural_identity_lookups').doc(lookupKey).set({
      key: lookupKey,
      entityType: 'CARRIER',
      globalId: carId,
      createdAt: new Date('2026-01-01T00:00:00Z'),
    });

    const beforeLookup = (await adminDb.collection('natural_identity_lookups').doc(lookupKey).get()).data();

    await service.updateProjectCarrier(prjId, carId, { name: 'اسم معدل' }, { userId: 'admin-1' });

    const afterLookup = (await adminDb.collection('natural_identity_lookups').doc(lookupKey).get()).data();
    expect(afterLookup).toEqual(beforeLookup);
  });
});
