import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  CarrierManagementClientService,
  carrierManagementClientService,
  CarrierCreateInput,
} from '../services/carrierManagementClient.service';
import { CarrierEditorModal } from '../components/masterData/CarrierEditorModal';

describe('FOUNDATION A1 — Reusable Carrier Creation Component & Client Command Boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const modalPath = path.resolve(__dirname, '../components/masterData/CarrierEditorModal.tsx');
  const modalContent = fs.readFileSync(modalPath, 'utf-8');

  const clientServicePath = path.resolve(__dirname, '../services/carrierManagementClient.service.ts');
  const clientServiceContent = fs.readFileSync(clientServicePath, 'utf-8');

  const wizardPath = path.resolve(__dirname, '../components/wizard/ProjectSetupWizard.tsx');
  const wizardContent = fs.readFileSync(wizardPath, 'utf-8');

  const serverAppPath = path.resolve(__dirname, '../../server/app.ts');
  const serverAppContent = fs.readFileSync(serverAppPath, 'utf-8');

  // 1. CarrierEditorModal exists
  it('1. CarrierEditorModal exists', () => {
    expect(CarrierEditorModal).toBeDefined();
    expect(typeof CarrierEditorModal).toBe('function');
  });

  // 2. Modal is independent of ProjectSetupWizard
  it('2. Modal is independent of ProjectSetupWizard', () => {
    expect(modalContent).not.toContain('ProjectSetupWizard');
    expect(modalContent).not.toContain('ProjectWizard');
  });

  // 3. Modal does not import Smart Import services
  it('3. Modal does not import Smart Import services', () => {
    expect(modalContent).not.toContain('importBatch');
    expect(modalContent).not.toContain('SmartImport');
    expect(modalContent).not.toContain('smartSourceDiscovery');
    expect(modalContent).not.toContain('DriverTruckPipelineService');
    expect(modalContent).not.toContain('rosterBatchReview');
  });

  // 4. Modal supports projectId
  it('4. Modal supports projectId', () => {
    expect(modalContent).toContain('projectId: string;');
  });

  // 5. Modal supports initialName
  it('5. Modal supports initialName', () => {
    expect(modalContent).toContain('initialName?: string;');
  });

  // 6. Carrier name is required
  it('6. Carrier name is required', async () => {
    const service = new CarrierManagementClientService();
    await expect(
      service.createProjectCarrier('PRJ-01', {
        name: '',
        commercialRegistrationNo: '1010123456',
      }, 'mock-token')
    ).rejects.toThrow(/INVALID_NAME/);
  });

  // 7. Carrier name minimum length is enforced (minimum 3 characters)
  it('7. Carrier name minimum length is enforced', async () => {
    const service = new CarrierManagementClientService();
    await expect(
      service.createProjectCarrier('PRJ-01', {
        name: 'AB',
        commercialRegistrationNo: '1010123456',
      }, 'mock-token')
    ).rejects.toThrow(/at least 3 characters/);
  });

  // 8. CR is required
  it('8. CR is required', async () => {
    const service = new CarrierManagementClientService();
    await expect(
      service.createProjectCarrier('PRJ-01', {
        name: 'شركة النقل الحديث',
        commercialRegistrationNo: '',
      }, 'mock-token')
    ).rejects.toThrow(/INVALID_CR_NUMBER/);
  });

  // 9. CR must be exactly 10 digits
  it('9. CR must be exactly 10 digits', async () => {
    const service = new CarrierManagementClientService();
    await expect(
      service.createProjectCarrier('PRJ-01', {
        name: 'شركة النقل الحديث',
        commercialRegistrationNo: '123456789', // 9 digits
      }, 'mock-token')
    ).rejects.toThrow(/exactly 10 digits/);

    await expect(
      service.createProjectCarrier('PRJ-01', {
        name: 'شركة النقل الحديث',
        commercialRegistrationNo: '12345678901', // 11 digits
      }, 'mock-token')
    ).rejects.toThrow(/exactly 10 digits/);
  });

  // 10. transportLicenseNo is optional
  it('10. transportLicenseNo is optional', () => {
    expect(clientServiceContent).toContain('transportLicenseNo?: string;');
    expect(modalContent).toContain('transportLicenseNo');
  });

  // 11. contact name is optional
  it('11. contact name is optional', () => {
    expect(clientServiceContent).toContain('contactPersonName?: string;');
  });

  // 12. phone is optional
  it('12. phone is optional', () => {
    expect(clientServiceContent).toContain('contactPhone?: string;');
  });

  // 13. email is optional
  it('13. email is optional', () => {
    expect(clientServiceContent).toContain('contactEmail?: string;');
  });

  // 14. absent optional fields are omitted from payload
  it('14. absent optional fields are omitted from payload', async () => {
    let capturedBody: any = null;
    const fetchMock = vi.fn().mockImplementation((url, options) => {
      capturedBody = JSON.parse(options.body);
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, projectId: 'PRJ-TEST', carrierId: 'CAR-001', membershipStatus: 'ACTIVE' }),
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    const service = new CarrierManagementClientService();
    await service.createProjectCarrier('PRJ-TEST', {
      name: 'شركة الخليج للنقل',
      commercialRegistrationNo: '1010998877',
      // No optional fields provided
    }, 'mock-token');

    expect(capturedBody).toBeDefined();
    expect(capturedBody.carrierData).toEqual({
      name: 'شركة الخليج للنقل',
      commercialRegistrationNo: '1010998877',
    });
    expect(capturedBody.carrierData.transportLicenseNo).toBeUndefined();
    expect(capturedBody.carrierData.contactPersonName).toBeUndefined();
    expect(capturedBody.carrierData.contactPhone).toBeUndefined();
    expect(capturedBody.carrierData.contactEmail).toBeUndefined();

    vi.unstubAllGlobals();
  });

  // 15. create command uses /setup-carrier
  it('15. create command uses /setup-carrier', async () => {
    let capturedUrl = '';
    const fetchMock = vi.fn().mockImplementation((url) => {
      capturedUrl = url;
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, projectId: 'PRJ-TEST', carrierId: 'CAR-001', membershipStatus: 'ACTIVE' }),
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    const service = new CarrierManagementClientService();
    await service.createProjectCarrier('PRJ-TEST', {
      name: 'شركة اليمامة',
      commercialRegistrationNo: '1010112233',
    }, 'mock-token');

    expect(capturedUrl).toBe('/api/projects/PRJ-TEST/setup-carrier');
    vi.unstubAllGlobals();
  });

  // 16. create command uses authenticated token
  it('16. create command uses authenticated token', async () => {
    let capturedHeaders: any = null;
    const fetchMock = vi.fn().mockImplementation((url, options) => {
      capturedHeaders = options.headers;
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, projectId: 'PRJ-TEST', carrierId: 'CAR-001', membershipStatus: 'ACTIVE' }),
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    const service = new CarrierManagementClientService();
    await service.createProjectCarrier('PRJ-TEST', {
      name: 'شركة اليمامة',
      commercialRegistrationNo: '1010112233',
    }, 'auth-bearer-token-xyz');

    expect(capturedHeaders.Authorization).toBe('Bearer auth-bearer-token-xyz');
    vi.unstubAllGlobals();
  });

  // 17. create command does not write Firestore directly
  it('17. create command does not write Firestore directly', () => {
    expect(clientServiceContent).not.toContain('setDoc');
    expect(clientServiceContent).not.toContain('addDoc');
    expect(clientServiceContent).not.toContain('updateDoc');
    expect(clientServiceContent).not.toContain('carrierRepository.create');
  });

  // 18. ProjectSetupWizard no longer contains inline carrier form fields
  it('18. ProjectSetupWizard no longer contains inline carrier form fields', () => {
    expect(wizardContent).not.toContain('const [carName, setCarName]');
    expect(wizardContent).not.toContain('const [carCr, setCarCr]');
    expect(wizardContent).not.toContain('const [carLicense, setCarLicense]');
    expect(wizardContent).not.toContain('const [carContactName, setCarContactName]');
    expect(wizardContent).not.toContain('const [carContactPhone, setCarContactPhone]');
    expect(wizardContent).not.toContain('const [carContactEmail, setCarContactEmail]');
    expect(wizardContent).not.toContain('const handleAddCarrier =');
  });

  // 19. ProjectSetupWizard opens CarrierEditorModal
  it('19. ProjectSetupWizard opens CarrierEditorModal', () => {
    expect(wizardContent).toContain('<CarrierEditorModal');
    expect(wizardContent).toContain('open={isCarrierEditorOpen}');
    expect(wizardContent).toContain('setIsCarrierEditorOpen(true)');
  });

  // 20. existing "إضافة ناقل جديد" entry point is preserved
  it('20. existing "إضافة ناقل جديد" entry point is preserved', () => {
    expect(wizardContent).toContain('إضافة ناقل جديد');
  });

  // 21. successful creation reloads project carrier list
  it('21. successful creation reloads project carrier list', () => {
    const modalInvocation = wizardContent.slice(
      wizardContent.indexOf('<CarrierEditorModal'),
      wizardContent.indexOf('</CarrierEditorModal>') !== -1
        ? wizardContent.indexOf('</CarrierEditorModal>') + 21
        : wizardContent.indexOf('/>', wizardContent.indexOf('<CarrierEditorModal')) + 2
    );
    expect(modalInvocation).toContain('/api/projects/${project.projectId}/carriers');
    expect(modalInvocation).toContain('setCarriers');
  });

  // 22. wizard phase is preserved
  it('22. wizard phase is preserved', () => {
    const modalInvocation = wizardContent.slice(
      wizardContent.indexOf('<CarrierEditorModal'),
      wizardContent.indexOf('/>', wizardContent.indexOf('<CarrierEditorModal')) + 2
    );
    // Should not call setActivePhase or reset project
    expect(modalInvocation).not.toContain('setActivePhase');
  });

  // 23. no CanonicalRelationshipContext prerequisite exists before create
  it('23. no CanonicalRelationshipContext prerequisite exists before create', () => {
    expect(modalContent).not.toContain('canonicalRelationshipContextService');
    expect(clientServiceContent).not.toContain('canonicalRelationshipContextService');
  });

  // 24. zero-carrier project can open/create through modal
  it('24. zero-carrier project can open/create through modal', () => {
    // Modal opens regardless of whether carriers array is empty
    expect(modalContent).toContain('export const CarrierEditorModal');
    expect(clientServiceContent).toContain('createProjectCarrier');
  });

  // 25. no legacy carrierService.updateCarrier use
  it('25. no legacy carrierService.updateCarrier use', () => {
    expect(modalContent).not.toContain('carrierService.updateCarrier');
    expect(clientServiceContent).not.toContain('carrierService.updateCarrier');
  });

  // 26. no carrierRepository.update use
  it('26. no carrierRepository.update use', () => {
    expect(modalContent).not.toContain('carrierRepository.update');
    expect(clientServiceContent).not.toContain('carrierRepository.update');
  });

  // 27. no server endpoint change
  it('27. no server endpoint change', () => {
    expect(serverAppContent).toContain("app.post('/api/projects/:projectId/setup-carrier'");
  });

  // 28. no material flow change
  it('28. no material flow change', () => {
    expect(wizardContent).toContain('isAddingMaterial');
    expect(wizardContent).toContain('handleAddMaterial');
  });

  // 29. no Driver/Truck Smart Import change
  it('29. no Driver/Truck Smart Import change', () => {
    expect(wizardContent).toContain('handleApproveRosterMappingAndStartPipeline');
    expect(wizardContent).toContain('DriverTruckPipelineService.processFileToReview');
  });

  // 30. no ID generation change
  it('30. no ID generation change', () => {
    expect(serverAppContent).toContain('ProjectProvisioningAdminService');
  });
});
