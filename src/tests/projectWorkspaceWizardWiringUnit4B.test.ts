import { describe, it, expect, vi } from 'vitest';
import { executeProjectWorkspaceSyncOrchestration } from '../components/wizard/ProjectSetupWizard';
import fs from 'fs';
import path from 'path';

describe('Project Workspace Wizard Initial Projection Orchestration (Unit 4B) Tests', () => {
  // Helper to construct mock workspace service
  const createMockWorkspaceService = () => ({
    requestGoogleScopes: vi.fn().mockResolvedValue(undefined),
    provisionProjectDrive: vi.fn().mockResolvedValue({
      projectFolderId: 'fld_new_123',
      spreadsheetId: 'sheet_new_456',
      projectFolderName: 'مشروع الاختبار',
      subfolders: {
        importedFilesFolderId: 'sub_1',
        reportsFolderId: 'sub_2',
        printableDocsFolderId: 'sub_3',
      },
    }),
    syncInitialProjectWorkspace: vi.fn().mockResolvedValue({
      success: true,
      processedCount: 4,
      sourceOfTruth: 'Firestore',
      auditMessage: 'تمت مزامنة 4 شيتات بنجاح',
      tabs: [],
    }),
  });

  // Test 1: first-time flow requests Google scopes
  it('1. first-time flow requests Google scopes before provisioning or sync', async () => {
    const mockService = createMockWorkspaceService();
    const setIsSyncingGoogle = vi.fn();
    const setSyncNotice = vi.fn();

    const project = {
      projectId: 'proj_first_time',
      nameAr: 'مشروع جديد',
      settings: {},
    };

    await executeProjectWorkspaceSyncOrchestration({
      project,
      isSyncingGoogle: false,
      setIsSyncingGoogle,
      setSyncNotice,
      workspaceService: mockService as any,
    });

    expect(mockService.requestGoogleScopes).toHaveBeenCalledTimes(1);
  });

  // Test 2: first-time flow provisions Workspace
  it('2. first-time flow provisions Workspace when neither ID exists', async () => {
    const mockService = createMockWorkspaceService();
    const setIsSyncingGoogle = vi.fn();
    const setSyncNotice = vi.fn();

    const project = {
      projectId: 'proj_first_time',
      nameAr: 'مشروع جديد',
      settings: {},
    };

    await executeProjectWorkspaceSyncOrchestration({
      project,
      isSyncingGoogle: false,
      setIsSyncingGoogle,
      setSyncNotice,
      workspaceService: mockService as any,
    });

    expect(mockService.provisionProjectDrive).toHaveBeenCalledTimes(1);
    expect(mockService.provisionProjectDrive).toHaveBeenCalledWith(project);
  });

  // Test 3: first-time flow uses returned spreadsheetId directly
  it('3. first-time flow uses returned spreadsheetId directly without waiting for React state', async () => {
    const mockService = createMockWorkspaceService();
    mockService.provisionProjectDrive.mockResolvedValueOnce({
      projectFolderId: 'fld_fresh_999',
      spreadsheetId: 'sheet_fresh_888',
      projectFolderName: 'مشروع فريش',
      subfolders: {} as any,
    });

    const setIsSyncingGoogle = vi.fn();
    const setSyncNotice = vi.fn();

    const project = {
      projectId: 'proj_first_time',
      nameAr: 'مشروع جديد',
      settings: {
        googleSpreadsheetId: undefined, // State is not yet updated
      },
    };

    await executeProjectWorkspaceSyncOrchestration({
      project,
      isSyncingGoogle: false,
      setIsSyncingGoogle,
      setSyncNotice,
      workspaceService: mockService as any,
    });

    expect(mockService.syncInitialProjectWorkspace).toHaveBeenCalledWith(
      'proj_first_time',
      'sheet_fresh_888' // Used returned value directly
    );
  });

  // Test 4: first-time flow invokes syncInitialProjectWorkspace after provision
  it('4. first-time flow invokes syncInitialProjectWorkspace after provision and reports success', async () => {
    const mockService = createMockWorkspaceService();
    const setIsSyncingGoogle = vi.fn();
    const setSyncNotice = vi.fn();

    const project = {
      projectId: 'proj_first_time',
      settings: {},
    };

    await executeProjectWorkspaceSyncOrchestration({
      project,
      isSyncingGoogle: false,
      setIsSyncingGoogle,
      setSyncNotice,
      workspaceService: mockService as any,
    });

    expect(mockService.syncInitialProjectWorkspace).toHaveBeenCalledTimes(1);
    expect(setSyncNotice).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'success',
        text: expect.stringContaining('إسقاط بيانات المشروع الأولية'),
      })
    );
  });

  // Test 5: initial projection occurs only after provisioning succeeds
  it('5. initial projection occurs only after provisioning succeeds; fails closed if provision fails', async () => {
    const mockService = createMockWorkspaceService();
    mockService.provisionProjectDrive.mockRejectedValueOnce(new Error('Quota exceeded on Google Drive'));

    const setIsSyncingGoogle = vi.fn();
    const setSyncNotice = vi.fn();

    const project = {
      projectId: 'proj_first_time',
      settings: {},
    };

    await executeProjectWorkspaceSyncOrchestration({
      project,
      isSyncingGoogle: false,
      setIsSyncingGoogle,
      setSyncNotice,
      workspaceService: mockService as any,
    });

    expect(mockService.provisionProjectDrive).toHaveBeenCalledTimes(1);
    expect(mockService.syncInitialProjectWorkspace).not.toHaveBeenCalled();
    expect(setSyncNotice).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'error',
        text: expect.stringContaining('Quota exceeded on Google Drive'),
      })
    );
  });

  // Test 6: both existing IDs -> provisioning is skipped
  it('6. both existing IDs -> provisioning is skipped', async () => {
    const mockService = createMockWorkspaceService();
    const setIsSyncingGoogle = vi.fn();
    const setSyncNotice = vi.fn();

    const project = {
      projectId: 'proj_existing',
      settings: {
        googleDriveFolderId: 'fld_existing_111',
        googleSpreadsheetId: 'sheet_existing_222',
      },
    };

    await executeProjectWorkspaceSyncOrchestration({
      project,
      isSyncingGoogle: false,
      setIsSyncingGoogle,
      setSyncNotice,
      workspaceService: mockService as any,
    });

    expect(mockService.provisionProjectDrive).not.toHaveBeenCalled();
  });

  // Test 7: both existing IDs -> initial projection uses existing spreadsheetId
  it('7. both existing IDs -> initial projection uses existing spreadsheetId', async () => {
    const mockService = createMockWorkspaceService();
    const setIsSyncingGoogle = vi.fn();
    const setSyncNotice = vi.fn();

    const project = {
      projectId: 'proj_existing',
      settings: {
        googleDriveFolderId: 'fld_existing_111',
        googleSpreadsheetId: 'sheet_existing_222',
      },
    };

    await executeProjectWorkspaceSyncOrchestration({
      project,
      isSyncingGoogle: false,
      setIsSyncingGoogle,
      setSyncNotice,
      workspaceService: mockService as any,
    });

    expect(mockService.syncInitialProjectWorkspace).toHaveBeenCalledWith(
      'proj_existing',
      'sheet_existing_222'
    );
  });

  // Test 8: existing Workspace resync does not create new Workspace resources
  it('8. existing Workspace resync does not create new Workspace resources and reports resync notice', async () => {
    const mockService = createMockWorkspaceService();
    const setIsSyncingGoogle = vi.fn();
    const setSyncNotice = vi.fn();

    const project = {
      projectId: 'proj_existing',
      settings: {
        googleDriveFolderId: 'fld_existing_111',
        googleSpreadsheetId: 'sheet_existing_222',
      },
    };

    await executeProjectWorkspaceSyncOrchestration({
      project,
      isSyncingGoogle: false,
      setIsSyncingGoogle,
      setSyncNotice,
      workspaceService: mockService as any,
    });

    expect(mockService.provisionProjectDrive).not.toHaveBeenCalled();
    expect(setSyncNotice).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'success',
        text: expect.stringContaining('دون إعادة تهيئة مساحة العمل'),
      })
    );
  });

  // Test 9: folder-only inconsistent state fails closed
  it('9. folder-only inconsistent state fails closed without calling Google APIs', async () => {
    const mockService = createMockWorkspaceService();
    const setIsSyncingGoogle = vi.fn();
    const setSyncNotice = vi.fn();

    const project = {
      projectId: 'proj_inconsistent_1',
      settings: {
        googleDriveFolderId: 'fld_existing_only',
        // googleSpreadsheetId is missing
      },
    };

    await executeProjectWorkspaceSyncOrchestration({
      project,
      isSyncingGoogle: false,
      setIsSyncingGoogle,
      setSyncNotice,
      workspaceService: mockService as any,
    });

    expect(mockService.requestGoogleScopes).not.toHaveBeenCalled();
    expect(mockService.provisionProjectDrive).not.toHaveBeenCalled();
    expect(mockService.syncInitialProjectWorkspace).not.toHaveBeenCalled();
    expect(setSyncNotice).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'error',
        text: expect.stringContaining('غير مكتملة أو غير متطابقة'),
      })
    );
  });

  // Test 10: spreadsheet-only inconsistent state fails closed
  it('10. spreadsheet-only inconsistent state fails closed without calling Google APIs', async () => {
    const mockService = createMockWorkspaceService();
    const setIsSyncingGoogle = vi.fn();
    const setSyncNotice = vi.fn();

    const project = {
      projectId: 'proj_inconsistent_2',
      settings: {
        googleSpreadsheetId: 'sheet_existing_only',
        // googleDriveFolderId is missing
      },
    };

    await executeProjectWorkspaceSyncOrchestration({
      project,
      isSyncingGoogle: false,
      setIsSyncingGoogle,
      setSyncNotice,
      workspaceService: mockService as any,
    });

    expect(mockService.requestGoogleScopes).not.toHaveBeenCalled();
    expect(mockService.provisionProjectDrive).not.toHaveBeenCalled();
    expect(mockService.syncInitialProjectWorkspace).not.toHaveBeenCalled();
    expect(setSyncNotice).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'error',
        text: expect.stringContaining('غير مكتملة أو غير متطابقة'),
      })
    );
  });

  // Test 11: projection failure after successful first-time provisioning does not report full success
  it('11. projection failure after successful first-time provisioning does not report full success', async () => {
    const mockService = createMockWorkspaceService();
    mockService.syncInitialProjectWorkspace.mockRejectedValueOnce(
      new Error('Firestore read failed during initial projection')
    );

    const setIsSyncingGoogle = vi.fn();
    const setSyncNotice = vi.fn();

    const project = {
      projectId: 'proj_partial_fail',
      settings: {},
    };

    await executeProjectWorkspaceSyncOrchestration({
      project,
      isSyncingGoogle: false,
      setIsSyncingGoogle,
      setSyncNotice,
      workspaceService: mockService as any,
    });

    expect(mockService.provisionProjectDrive).toHaveBeenCalledTimes(1);
    expect(mockService.syncInitialProjectWorkspace).toHaveBeenCalledTimes(1);
    expect(setSyncNotice).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'error',
        text: expect.stringContaining('تعذر إكمال إسقاط البيانات الأولية'),
      })
    );
  });

  // Test 12: existing projection failure does not invoke provisioning
  it('12. existing projection failure does not invoke provisioning fallback', async () => {
    const mockService = createMockWorkspaceService();
    mockService.syncInitialProjectWorkspace.mockRejectedValueOnce(
      new Error('Google Sheets API rate limited')
    );

    const setIsSyncingGoogle = vi.fn();
    const setSyncNotice = vi.fn();

    const project = {
      projectId: 'proj_existing_fail',
      settings: {
        googleDriveFolderId: 'fld_exist',
        googleSpreadsheetId: 'sheet_exist',
      },
    };

    await executeProjectWorkspaceSyncOrchestration({
      project,
      isSyncingGoogle: false,
      setIsSyncingGoogle,
      setSyncNotice,
      workspaceService: mockService as any,
    });

    expect(mockService.provisionProjectDrive).not.toHaveBeenCalled();
    expect(setSyncNotice).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'error',
        text: expect.stringContaining('فشل تحديث وإسقاط البيانات في جدول البيانات'),
      })
    );
  });

  // Test 13: one existing button remains
  it('13. one existing button remains: source contract confirms exactly one Google Workspace button in Wizard', () => {
    const wizardPath = path.resolve(__dirname, '../components/wizard/ProjectSetupWizard.tsx');
    const wizardContent = fs.readFileSync(wizardPath, 'utf-8');

    // Button uses onClick={handleSyncGoogleWorkspace}
    const buttonMatches = wizardContent.match(/onClick=\{handleSyncGoogleWorkspace\}/g) || [];
    expect(buttonMatches.length).toBe(1);

    // Dynamic button label based on both IDs presence
    expect(wizardContent).toContain('تحديث مزامنة Google Workspace');
    expect(wizardContent).toContain('تهيئة ومزامنة Google Workspace');
  });

  // Test 14: isSyncingGoogle prevents double submission
  it('14. isSyncingGoogle prevents double submission while operation is running', async () => {
    const mockService = createMockWorkspaceService();
    const setIsSyncingGoogle = vi.fn();
    const setSyncNotice = vi.fn();

    const project = {
      projectId: 'proj_first_time',
      settings: {},
    };

    // Call when isSyncingGoogle is already true (simulating rapid second click)
    await executeProjectWorkspaceSyncOrchestration({
      project,
      isSyncingGoogle: true,
      setIsSyncingGoogle,
      setSyncNotice,
      workspaceService: mockService as any,
    });

    expect(mockService.requestGoogleScopes).not.toHaveBeenCalled();
    expect(mockService.provisionProjectDrive).not.toHaveBeenCalled();
    expect(mockService.syncInitialProjectWorkspace).not.toHaveBeenCalled();
  });

  // Test 15: Wizard sends no master-data arrays
  it('15. Wizard sends no master-data arrays: source contract confirms syncInitialProjectWorkspace takes only (projectId, spreadsheetId)', () => {
    const wizardPath = path.resolve(__dirname, '../components/wizard/ProjectSetupWizard.tsx');
    const wizardContent = fs.readFileSync(wizardPath, 'utf-8');

    // Confirm the invocation passes only 2 arguments
    expect(wizardContent).toMatch(
      /workspaceService\.syncInitialProjectWorkspace\s*\(\s*project\.projectId\s*,\s*provisionedSpreadsheetId\s*\)/
    );
    expect(wizardContent).toMatch(
      /workspaceService\.syncInitialProjectWorkspace\s*\(\s*project\.projectId\s*,\s*project\.settings!\.googleSpreadsheetId!\s*\)/
    );

    // Confirm no client-side master-data arrays are passed within the call arguments
    expect(wizardContent).not.toMatch(/syncInitialProjectWorkspace\s*\([^)]*drivers/);
    expect(wizardContent).not.toMatch(/syncInitialProjectWorkspace\s*\([^)]*carriers/);
    expect(wizardContent).not.toMatch(/syncInitialProjectWorkspace\s*\([^)]*materials/);
    expect(wizardContent).not.toMatch(/syncInitialProjectWorkspace\s*\([^)]*fleetRoster/);
  });

  // Test 16: activation handler contains no Workspace call
  it('16. activation handler contains no Workspace call: source contract confirms handleActivateProject is uncoupled', () => {
    const wizardPath = path.resolve(__dirname, '../components/wizard/ProjectSetupWizard.tsx');
    const wizardContent = fs.readFileSync(wizardPath, 'utf-8');

    const activateHandlerStart = wizardContent.indexOf('const handleActivateProject = async () =>');
    expect(activateHandlerStart).toBeGreaterThan(-1);

    const activateHandlerEnd = wizardContent.indexOf('};', activateHandlerStart);
    const activateHandlerContent = wizardContent.slice(activateHandlerStart, activateHandlerEnd + 2);

    expect(activateHandlerContent).not.toContain('workspaceService');
    expect(activateHandlerContent).not.toContain('clientWorkspaceService');
    expect(activateHandlerContent).not.toContain('syncInitialProjectWorkspace');
    expect(activateHandlerContent).not.toContain('provisionProjectDrive');
    expect(activateHandlerContent).not.toContain('api/workspace');

    // Also verify src/services/projectActivation.service.ts
    const activationServicePath = path.resolve(__dirname, '../services/projectActivation.service.ts');
    const activationServiceContent = fs.readFileSync(activationServicePath, 'utf-8');
    expect(activationServiceContent).not.toContain('workspaceService');
    expect(activationServiceContent).not.toContain('syncInitialProjectWorkspace');
    expect(activationServiceContent).not.toContain('provisionProjectDrive');
  });

  // Test 17: no continuous sync introduced
  it('17. no continuous sync introduced: source contract confirms no onSnapshot or setInterval in Wizard sync orchestration', () => {
    const wizardPath = path.resolve(__dirname, '../components/wizard/ProjectSetupWizard.tsx');
    const wizardContent = fs.readFileSync(wizardPath, 'utf-8');

    const orchestrationStart = wizardContent.indexOf('export async function executeProjectWorkspaceSyncOrchestration');
    const orchestrationEnd = wizardContent.indexOf('const handleSyncGoogleWorkspace = async () =>');
    const orchestrationContent = wizardContent.slice(orchestrationStart, orchestrationEnd);

    expect(orchestrationContent).not.toContain('onSnapshot');
    expect(orchestrationContent).not.toContain('setInterval');
    expect(orchestrationContent).not.toContain('setTimeout');
    expect(orchestrationContent).not.toContain('polling');
  });

  // Test 18: no canonical ID or code generation changed
  it('18. no canonical ID or code generation changed: source contract confirms ID generator contracts untouched', () => {
    const wizardPath = path.resolve(__dirname, '../components/wizard/ProjectSetupWizard.tsx');
    const wizardContent = fs.readFileSync(wizardPath, 'utf-8');

    // Confirm core generation references remain canonical
    expect(wizardContent).toContain('createProject');
    expect(wizardContent).not.toContain('generateCustomDisplayCode');
    expect(wizardContent).not.toContain('overrideEntityNumber');
  });
});
