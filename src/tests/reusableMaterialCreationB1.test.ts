import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  MaterialManagementClientService,
  materialManagementClientService,
  MaterialCreateInput,
} from '../services/materialManagementClient.service';
import { MaterialEditorModal } from '../components/masterData/MaterialEditorModal';

describe('FOUNDATION B1 — Reusable Material Creation Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const modalPath = path.resolve(__dirname, '../components/masterData/MaterialEditorModal.tsx');
  const modalContent = fs.readFileSync(modalPath, 'utf-8');

  const clientServicePath = path.resolve(__dirname, '../services/materialManagementClient.service.ts');
  const clientServiceContent = fs.readFileSync(clientServicePath, 'utf-8');

  const wizardPath = path.resolve(__dirname, '../components/wizard/ProjectSetupWizard.tsx');
  const wizardContent = fs.readFileSync(wizardPath, 'utf-8');

  // 1. MaterialEditorModal is reusable and exists
  it('1. MaterialEditorModal is reusable and exported', () => {
    expect(MaterialEditorModal).toBeDefined();
    expect(modalContent).toContain('export const MaterialEditorModal');
  });

  // 2. MaterialEditorModal is independent of ProjectSetupWizard internal state
  it('2. MaterialEditorModal is independent of ProjectSetupWizard internal state', () => {
    expect(modalContent).not.toContain('ProjectSetupWizard');
    expect(modalContent).not.toContain('isAddingMaterial');
    expect(modalContent).not.toContain('applyCanonicalSnapshot');
  });

  // 3. Client service class and singleton are exported
  it('3. Client service class and singleton are exported', () => {
    expect(MaterialManagementClientService).toBeDefined();
    expect(materialManagementClientService).toBeDefined();
    expect(clientServiceContent).toContain('export class MaterialManagementClientService');
    expect(clientServiceContent).toContain('export const materialManagementClientService');
  });

  // 4. Client service validates projectId
  it('4. Client service validates projectId', async () => {
    const service = new MaterialManagementClientService();
    await expect(
      service.createProjectMaterial('', { name: 'بحص 10 مم', code: 'AGG-10' }, 'test-token')
    ).rejects.toThrow(/projectId is required/);
  });

  // 5. Client service validates material name
  it('5. Client service validates material name', async () => {
    const service = new MaterialManagementClientService();
    await expect(
      service.createProjectMaterial('PRJ-01', { name: '', code: 'AGG-10' }, 'test-token')
    ).rejects.toThrow(/Material name must be at least 2 characters/);
  });

  // 6. Client service validates material code
  it('6. Client service validates material code', async () => {
    const service = new MaterialManagementClientService();
    await expect(
      service.createProjectMaterial('PRJ-01', { name: 'بحص 10 مم', code: '' }, 'test-token')
    ).rejects.toThrow(/Material code must be at least 2 characters/);
  });

  // 7. Client service validates unitOfMeasure
  it('7. Client service validates unitOfMeasure', async () => {
    const service = new MaterialManagementClientService();
    await expect(
      service.createProjectMaterial(
        'PRJ-01',
        { name: 'بحص 10 مم', code: 'AGG-10', unitOfMeasure: 'INVALID' as any },
        'test-token'
      )
    ).rejects.toThrow(/unitOfMeasure must be TON, M3, or TRIP/);
  });

  // 8. Client service calls POST /api/projects/:projectId/setup-material
  it('8. Client service calls POST /api/projects/:projectId/setup-material', async () => {
    let capturedUrl = '';
    let capturedMethod = '';
    let capturedHeaders: Record<string, string> = {};
    let capturedBody: any = null;

    const fetchMock = vi.fn().mockImplementation((url, opts) => {
      capturedUrl = url;
      capturedMethod = opts.method;
      capturedHeaders = opts.headers;
      capturedBody = JSON.parse(opts.body);
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            projectId: 'PRJ-101',
            materialId: 'MAT-9988',
            membershipStatus: 'ACTIVE',
          }),
      });
    });

    vi.stubGlobal('fetch', fetchMock);

    const service = new MaterialManagementClientService();
    const result = await service.createProjectMaterial(
      'PRJ-101',
      {
        name: 'رمل أحمر مغسول',
        code: 'SAND-RED',
        unitOfMeasure: 'M3',
        standardDensityTonPerM3: 1.5,
      },
      'token-xyz'
    );

    expect(capturedUrl).toBe('/api/projects/PRJ-101/setup-material');
    expect(capturedMethod).toBe('POST');
    expect(capturedHeaders['Authorization']).toBe('Bearer token-xyz');
    expect(capturedHeaders['Content-Type']).toBe('application/json');
    expect(capturedBody).toEqual({
      materialData: {
        name: 'رمل أحمر مغسول',
        code: 'SAND-RED',
        unitOfMeasure: 'M3',
        standardDensityTonPerM3: 1.5,
      },
    });

    expect(result).toEqual({
      success: true,
      projectId: 'PRJ-101',
      materialId: 'MAT-9988',
      membershipStatus: 'ACTIVE',
    });

    vi.unstubAllGlobals();
  });

  // 9. Material ID is authoritative from server and never generated client-side
  it('9. Material ID is authoritative from server and never generated client-side', () => {
    expect(clientServiceContent).not.toContain('generateId');
    expect(clientServiceContent).not.toContain('uuid');
    expect(clientServiceContent).not.toContain('randomUUID');
    expect(modalContent).not.toContain('generateId');
    expect(modalContent).not.toContain('uuid');
  });

  // 10. Client service performs no direct Firestore writes
  it('10. Client service performs no direct Firestore writes', () => {
    expect(clientServiceContent).not.toContain('setDoc');
    expect(clientServiceContent).not.toContain('addDoc');
    expect(clientServiceContent).not.toContain('collection(');
    expect(clientServiceContent).not.toContain('doc(');
  });

  // 11. Modal performs no direct Firestore writes
  it('11. Modal performs no direct Firestore writes', () => {
    expect(modalContent).not.toContain('setDoc');
    expect(modalContent).not.toContain('addDoc');
    expect(modalContent).not.toContain('collection(');
    expect(modalContent).not.toContain('doc(');
  });

  // 12. UnitOfMeasure supports TON, M3, TRIP in modal
  it('12. UnitOfMeasure supports TON, M3, TRIP in modal', () => {
    expect(modalContent).toContain('<option value="TON">');
    expect(modalContent).toContain('<option value="M3">');
    expect(modalContent).toContain('<option value="TRIP">');
  });

  // 13. Mutation-succeeded + refresh-failed stores result and offers retry
  it('13. Mutation-succeeded + refresh-failed stores result and offers retry', () => {
    expect(modalContent).toContain('createdMaterialResult');
    expect(modalContent).toContain('refreshFailed');
    expect(modalContent).toContain('handleRetryRefresh');
    expect(modalContent).toContain('إعادة تحديث البيانات');
  });

  // 14. Retry refresh never re-executes POST /setup-material
  it('14. Retry refresh never re-executes POST /setup-material', () => {
    const retryBlock = modalContent.slice(
      modalContent.indexOf('const handleRetryRefresh ='),
      modalContent.indexOf('return (', modalContent.indexOf('const handleRetryRefresh ='))
    );
    expect(retryBlock).not.toContain('createProjectMaterial');
    expect(retryBlock).toContain('onCreated(createdMaterialResult)');
  });

  // 15. ProjectSetupWizard imports and renders MaterialEditorModal
  it('15. ProjectSetupWizard imports and renders MaterialEditorModal', () => {
    expect(wizardContent).toContain("import { MaterialEditorModal } from '../masterData/MaterialEditorModal';");
    expect(wizardContent).toContain('<MaterialEditorModal');
    expect(wizardContent).toContain('open={isAddingMaterial}');
    expect(wizardContent).toContain('projectId={project.projectId}');
  });

  // 16. ProjectSetupWizard passes expect: { materialId: result.materialId } to canonical refresh
  it('16. ProjectSetupWizard passes expect: { materialId: result.materialId } to canonical refresh', () => {
    const modalInvocation = wizardContent.slice(
      wizardContent.indexOf('<MaterialEditorModal'),
      wizardContent.indexOf('/>', wizardContent.indexOf('<MaterialEditorModal')) + 2
    );
    expect(modalInvocation).toContain('projectCanonicalRefreshService.refresh(');
    expect(modalInvocation).toContain('{ expect: { materialId: result.materialId } }');
    expect(modalInvocation).toContain('applyCanonicalSnapshot(snapshot)');
  });

  // 17. ProjectSetupWizard removed obsolete inline form and local create fields
  it('17. ProjectSetupWizard removed obsolete inline form and local create fields', () => {
    expect(wizardContent).not.toContain('const [matName, setMatName]');
    expect(wizardContent).not.toContain('const [matCode, setMatCode]');
    expect(wizardContent).not.toContain('const [matUnit, setMatUnit]');
    expect(wizardContent).not.toContain('const [matDensity, setMatDensity]');
    expect(wizardContent).not.toContain('const handleAddMaterial =');
  });

  // 18. ENROLL_MATERIAL mutability gate is preserved
  it('18. ENROLL_MATERIAL mutability gate is preserved', () => {
    expect(wizardContent).toContain('isOperationallyMutable');
    expect(wizardContent).toContain('setIsAddingMaterial(true)');
  });

  // 19. B1 is CREATE ONLY - no PATCH or Material EDIT introduced
  it('19. B1 is CREATE ONLY - no PATCH or Material EDIT introduced', () => {
    expect(modalContent).not.toContain("mode === 'EDIT'");
    expect(modalContent).not.toContain('updateProjectMaterial');
    expect(clientServiceContent).not.toContain('updateProjectMaterial');
    expect(clientServiceContent).not.toContain('PATCH');
  });

  // 20. Smart Import Material creation logic remains untouched
  it('20. Smart Import Material creation logic remains untouched', () => {
    expect(wizardContent).toContain('handleApproveRosterMappingAndStartPipeline');
    expect(wizardContent).toContain('DriverTruckPipelineService');
  });
});
