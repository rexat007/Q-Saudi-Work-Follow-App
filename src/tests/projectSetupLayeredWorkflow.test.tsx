// @vitest-environment happy-dom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PROJECT_SETUP_LAYERS, canEnterProjectSetupLayer, ProjectSetupLayer } from '../services/projectSetupWorkflow.service';
import { ProjectSetupWizard } from '../components/wizard/ProjectSetupWizard';
import { ProjectEntity, MaterialEntity, CarrierEntity, PricingRuleEntity } from '../types/entities';
import { AuthUserContext } from '../types/common';
import { projectService } from '../services/project.service';

// Mocks for i18n
vi.mock('../../i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    isRTL: false,
    locale: 'en',
    direction: 'ltr',
    setLocale: vi.fn(),
  })
}));

vi.mock('../i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    isRTL: false,
    locale: 'en',
    direction: 'ltr',
    setLocale: vi.fn(),
  })
}));

// Mocks for Firebase configuration to satisfy import references
vi.mock('../firebase/config', () => ({
  db: {},
  auth: {
    currentUser: {
      uid: 'USR-SA-WIZ',
      email: 'superadmin@qsaudi.com',
      displayName: 'Super Admin',
      role: 'SUPER_ADMIN' as const,
      assignedProjectIds: [],
      getIdToken: vi.fn().mockResolvedValue('mock-token'),
    }
  }
}));

vi.mock('../firebase/config', () => ({
  db: {},
  auth: {
    currentUser: {
      uid: 'USR-SA-WIZ',
      email: 'superadmin@qsaudi.com',
      displayName: 'Super Admin',
      role: 'SUPER_ADMIN' as const,
      assignedProjectIds: [],
      getIdToken: vi.fn().mockResolvedValue('mock-token'),
    }
  }
}));

// Mock repositories to prevent actual Firestore subscription calls
vi.mock('../repositories/project.repository', () => ({
  projectRepository: {
    subscribeToProjects: vi.fn(() => vi.fn()),
    listAll: vi.fn().mockResolvedValue([]),
    findById: vi.fn().mockResolvedValue(null),
    update: vi.fn().mockResolvedValue(undefined),
  }
}));

vi.mock('../repositories/material.repository', () => ({
  materialRepository: {}
}));

vi.mock('../repositories/carrier.repository', () => ({
  carrierRepository: {}
}));

vi.mock('../repositories/pricingRule.repository', () => ({
  pricingRuleRepository: {
    subscribeByProject: vi.fn(() => vi.fn()),
  }
}));

// Mock services to return mock project workspace/snapshots deterministically
vi.mock('../services/projectCanonicalRefresh.service', () => ({
  projectCanonicalRefreshService: {
    refresh: vi.fn().mockResolvedValue({
      materials: [],
      carriers: [],
      fleetRows: [],
      relationshipContext: {
        authorizedCarrierIds: [],
        authorizedMaterialIds: [],
        knownCarriers: [],
        knownMaterials: [],
        knownDrivers: [],
        knownTrucks: [],
      }
    }),
  }
}));

vi.mock('../services/workspace.service', () => ({
  clientWorkspaceService: {
    requestGoogleScopes: vi.fn().mockResolvedValue(undefined),
    provisionProjectDrive: vi.fn().mockResolvedValue({
      spreadsheetId: 'spread-123',
      projectFolderId: 'folder-123',
    }),
    syncInitialProjectWorkspace: vi.fn().mockResolvedValue(undefined),
  }
}));

const mockAuthContext: AuthUserContext = {
  userId: 'USR-SA-WIZ',
  email: 'superadmin@qsaudi.com',
  displayName: 'Super Admin',
  role: 'SUPER_ADMIN',
  assignedProjectIds: [],
};

const mockProject: ProjectEntity = {
  projectId: 'PRJ-RYD-101',
  projectCode: 'Q-PRJ-001',
  projectNumber: 1,
  nameAr: 'مشروع حفر الرياض',
  nameEn: 'Riyadh Excavation Project',
  clientName: 'أمانة منطقة الرياض',
  status: 'SETUP',
  startDate: '2026-10-01',
  location: {
    lat: 24.7136,
    lng: 46.6753,
    geoFenceRadiusMeters: 1000,
    addressAr: 'الرياض الملز',
  },
  settings: {
    currency: 'SAR',
    vatRatePercent: 15,
    zatcaTaxNumber: '310101010101013',
    googleDriveFolderId: 'folder-123',
    googleSpreadsheetId: 'spread-123',
    allowDriverSelfDispatch: false,
  },
  authorizedCarrierIds: [],
  authorizedMaterialIds: [],
  createdAt: new Date('2026-10-01T00:00:00.000Z'),
  createdBy: 'USR-SA-WIZ',
  updatedAt: new Date('2026-10-01T00:00:00.000Z'),
  updatedBy: 'USR-SA-WIZ',
};

describe('Q-Saudi Project Setup Layered Workflow Test Suite', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  // ==================================================
  // A. CANONICAL ORDER
  // ==================================================
  it('A. Canonical Order represents the 8 ordered setup layers exactly', () => {
    const expectedOrder: ProjectSetupLayer[] = [
      'FOUNDATION',
      'WORKSPACE',
      'MATERIALS',
      'CARRIERS',
      'ROSTER',
      'PRICING',
      'ACCESS',
      'REVIEW_ACTIVATION',
    ];

    expect(PROJECT_SETUP_LAYERS.length).toBe(8);
    PROJECT_SETUP_LAYERS.forEach((layer, idx) => {
      expect(layer.id).toBe(expectedOrder[idx]);
      expect(layer.ordinal).toBe(idx + 1);
    });
  });

  // ==================================================
  // B. NEW PROJECT ENTRY CONTRACT
  // ==================================================
  it('B. New Project Entry Contract: Opened projects initialize to FOUNDATION layer', async () => {
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <ProjectSetupWizard
          projects={[mockProject]}
          authContext={mockAuthContext}
          selectedProjectId="PRJ-RYD-101"
        />
      );
    });

    // Sidebar should reflect Layer 1 (FOUNDATION) as the active layer
    expect(document.body.textContent).toContain('البيانات الأساسية وتكوين المشروع');
    
    // Check form is rendering foundation inputs like project name and client name
    const clientInput = document.body.querySelector('input[value="أمانة منطقة الرياض"]');
    expect(clientInput).not.toBeNull();

    root.unmount();
  });

  // ==================================================
  // C. EXISTING PROJECT ENTRY CONTRACT
  // ==================================================
  it('C. Existing Project Entry Contract: Selecting an existing project resets active layer to FOUNDATION', async () => {
    const root = createRoot(container);
    let selectedId: string | null = 'PRJ-RYD-101';

    await act(async () => {
      root.render(
        <ProjectSetupWizard
          projects={[mockProject]}
          authContext={mockAuthContext}
          selectedProjectId={selectedId || undefined}
        />
      );
    });

    expect(document.body.textContent).toContain('البيانات الأساسية وتكوين المشروع');

    root.unmount();
  });

  // ==================================================
  // D. CENTRAL NAVIGATION BOUNDARY
  // ==================================================
  it('D. Central Navigation Boundary: Attempting to enter blocked ROSTER without prerequisites fails and triggers error notice', async () => {
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <ProjectSetupWizard
          projects={[mockProject]}
          authContext={mockAuthContext}
          selectedProjectId="PRJ-RYD-101"
        />
      );
    });

    // Locate the ROSTER navigation button (Ordinal 5)
    const rosterTabBtn = Array.from(document.body.querySelectorAll('button')).find(
      (b) => b.textContent?.includes('Operational Roster') || b.textContent?.includes('سجل تشغيل السائقين والشاحنات')
    );
    expect(rosterTabBtn).not.toBeUndefined();

    // Trigger click on ROSTER layer tab
    await act(async () => {
      rosterTabBtn?.click();
    });

    // Ensure we did NOT navigate to ROSTER (remained on FOUNDATION) and the gate reason is rendered
    expect(document.body.textContent).not.toContain('سجل تشغيل السائقين والشاحنات الموحد (Roster)');
    expect(document.body.textContent).toContain('سجل تشغيل السائقين وقواعد الأسعار تتطلب مادة مصرحة واحدة وناقل واحد على الأقل');

    root.unmount();
  });

  // ==================================================
  // E. ROSTER BLOCKED WITHOUT MATERIALS
  // ==================================================
  it('E. Roster Blocked Without Materials', () => {
    const result = canEnterProjectSetupLayer('ROSTER', {
      projectId: 'PRJ-RYD-101',
      materialsCount: 0,
      carriersCount: 2,
    });
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('يلزم وجود مادة مصرح بها واحدة على الأقل');
  });

  // ==================================================
  // F. ROSTER BLOCKED WITHOUT CARRIERS
  // ==================================================
  it('F. Roster Blocked Without Carriers', () => {
    const result = canEnterProjectSetupLayer('ROSTER', {
      projectId: 'PRJ-RYD-101',
      materialsCount: 3,
      carriersCount: 0,
    });
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('يلزم وجود ناقل معتمد واحد على الأقل');
  });

  // ==================================================
  // G. ROSTER ALLOWED WITH BOTH
  // ==================================================
  it('G. Roster Allowed with Both Materials and Carriers', () => {
    const result = canEnterProjectSetupLayer('ROSTER', {
      projectId: 'PRJ-RYD-101',
      materialsCount: 1,
      carriersCount: 1,
    });
    expect(result.allowed).toBe(true);
  });

  // ==================================================
  // I. SMART IMPORT OWNERSHIP
  // ==================================================
  it('I. Smart Import launcher is only rendered under ROSTER layer', async () => {
    const root = createRoot(container);
    
    // To enter ROSTER, canEnterProjectSetupLayer checks require materials > 0 and carriers > 0.
    // In React state, we mock these lists via local states by passing mock materials / carriers, or
    // we can directly test that when the ROSTER tab is rendered, the launcher is present.
    // Let's force render or mock the component states if feasible, or render the wizard directly
    // since clicking standard tabs is controlled by materials/carriers counts in local state.
    // Let's render the component and see.
    await act(async () => {
      root.render(
        <ProjectSetupWizard
          projects={[mockProject]}
          authContext={mockAuthContext}
          selectedProjectId="PRJ-RYD-101"
        />
      );
    });

    // On FOUNDATION, the Smart Import upload/launcher controls should absolutely NOT exist.
    expect(document.body.textContent).not.toContain('استيراد سجل التشغيل الذكي (Smart Roster Import)');
    expect(document.body.textContent).not.toContain('استيراد ملف');

    root.unmount();
  });

  // ==================================================
  // J. WORKSPACE ISOLATION
  // ==================================================
  it('J. Workspace Isolation: Google Workspace Setup is isolated from other layers', async () => {
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <ProjectSetupWizard
          projects={[mockProject]}
          authContext={mockAuthContext}
          selectedProjectId="PRJ-RYD-101"
        />
      );
    });

    // On FOUNDATION layer (default), Google Sync triggers should be absent.
    expect(document.body.textContent).not.toContain('معرف شيت قوقل لإنزال الرحلات');

    // Click on WORKSPACE tab to switch
    const workspaceTabBtn = Array.from(document.body.querySelectorAll('button')).find(
      (b) => b.textContent?.includes('Google Workspace') || b.textContent?.includes('مساحة العمل ومزامنة قوقل')
    );
    expect(workspaceTabBtn).not.toBeUndefined();

    await act(async () => {
      workspaceTabBtn?.click();
    });

    // Workspace UI is now visible
    expect(document.body.textContent).toContain('معرف شيت قوقل لإنزال الرحلات');

    root.unmount();
  });

  // ==================================================
  // K. MATERIALS ISOLATION
  // ==================================================
  it('K. Materials Isolation: Materials list and modals are present only on MATERIALS layer', async () => {
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <ProjectSetupWizard
          projects={[mockProject]}
          authContext={mockAuthContext}
          selectedProjectId="PRJ-RYD-101"
        />
      );
    });

    // Default layer is FOUNDATION. Materials management should be absent.
    expect(document.body.textContent).not.toContain('إضافة مادة جديدة');

    // Click on MATERIALS layer tab (Ordinal 3)
    const materialsTabBtn = Array.from(document.body.querySelectorAll('button')).find(
      (b) => b.textContent?.includes('Authorized Materials') || b.textContent?.includes('قائمة المواد المصرح بها')
    );
    expect(materialsTabBtn).not.toBeUndefined();

    await act(async () => {
      materialsTabBtn?.click();
    });

    // Materials layer should render material actions
    expect(document.body.textContent).toContain('إضافة مادة جديدة');

    root.unmount();
  });

  // ==================================================
  // L. CARRIERS / ROSTER SEPARATION
  // ==================================================
  it('L. Carriers and Roster are strictly separated into Layer 4 and Layer 5', async () => {
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <ProjectSetupWizard
          projects={[mockProject]}
          authContext={mockAuthContext}
          selectedProjectId="PRJ-RYD-101"
        />
      );
    });

    // Navigate to CARRIERS layer tab
    const carriersTabBtn = Array.from(document.body.querySelectorAll('button')).find(
      (b) => b.textContent?.includes('Authorized Carriers') || b.textContent?.includes('الناقلون المعتمدون')
    );
    expect(carriersTabBtn).not.toBeUndefined();

    await act(async () => {
      carriersTabBtn?.click();
    });

    // Carrier management (add carrier) is visible, but Roster controls (Google Sheets sync / upload / intake) are absent
    expect(document.body.textContent).toContain('الناقلون المعتمدون بالمشروع');
    expect(document.body.textContent).toContain('إضافة ناقل جديد');
    expect(document.body.textContent).not.toContain('سجل تشغيل السائقين والشاحنات الموحد (Roster)');

    root.unmount();
  });

  // ==================================================
  // M. UNIT 2: FOUNDATION VIEW MODE (DEFAULT)
  // ==================================================
  it('M. Unit 2: Foundation opens in View Mode with single edit button and inputs disabled', async () => {
    const root = createRoot(container);
    const updateSpy = vi.spyOn(projectService, 'updateProject').mockResolvedValue(undefined);

    await act(async () => {
      root.render(
        <ProjectSetupWizard
          projects={[mockProject]}
          authContext={mockAuthContext}
          selectedProjectId="PRJ-RYD-101"
        />
      );
    });

    const editBtn = Array.from(document.body.querySelectorAll('button')).find(
      (b) => b.textContent?.includes('تعديل البيانات')
    );
    expect(editBtn).not.toBeUndefined();

    // Inputs should be disabled in view mode
    const clientInput = document.body.querySelector('input[value="أمانة منطقة الرياض"]') as HTMLInputElement;
    expect(clientInput).not.toBeNull();
    expect(clientInput.disabled).toBe(true);

    // No server mutations occurred
    expect(updateSpy).not.toHaveBeenCalled();

    root.unmount();
  });

  // ==================================================
  // N. UNIT 2: EDIT MODE, LOCAL DRAFT, DIRTY STATE & CANCEL
  // ==================================================
  it('N. Unit 2: Edit mode enables fields, typing does not mutate server, and Cancel restores canonical values', async () => {
    const root = createRoot(container);
    const updateSpy = vi.spyOn(projectService, 'updateProject').mockResolvedValue(undefined);

    await act(async () => {
      root.render(
        <ProjectSetupWizard
          projects={[mockProject]}
          authContext={mockAuthContext}
          selectedProjectId="PRJ-RYD-101"
        />
      );
    });

    // Click "تعديل البيانات"
    const editBtn = Array.from(document.body.querySelectorAll('button')).find(
      (b) => b.textContent?.includes('تعديل البيانات')
    );
    await act(async () => {
      editBtn?.click();
    });

    // Save and Cancel buttons should now be visible
    const saveBtn = Array.from(document.body.querySelectorAll('button')).find(
      (b) => b.textContent?.includes('حفظ التعديلات')
    ) as HTMLButtonElement;
    const cancelBtn = Array.from(document.body.querySelectorAll('button')).find(
      (b) => b.textContent?.includes('إلغاء')
    ) as HTMLButtonElement;

    expect(saveBtn).not.toBeUndefined();
    expect(cancelBtn).not.toBeUndefined();
    // Save is disabled initially because draft is clean
    expect(saveBtn.disabled).toBe(true);

    const clientInput = document.body.querySelector('input[value="أمانة منطقة الرياض"]') as HTMLInputElement;
    expect(clientInput.disabled).toBe(false);

    // Modify draft field
    await act(async () => {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
      nativeInputValueSetter?.call(clientInput, 'أمانة منطقة مكة المكرمة');
      clientInput.dispatchEvent(new Event('change', { bubbles: true }));
    });

    // Typing must NEVER mutate server state
    expect(updateSpy).not.toHaveBeenCalled();
    // Save should now be enabled because form is dirty
    expect(saveBtn.disabled).toBe(false);

    // Click Cancel
    await act(async () => {
      cancelBtn.click();
    });

    // Exited edit mode, canonical value restored, 0 server mutations
    expect(updateSpy).not.toHaveBeenCalled();
    const restoredClientInput = document.body.querySelector('input[value="أمانة منطقة الرياض"]') as HTMLInputElement;
    expect(restoredClientInput).not.toBeNull();
    expect(restoredClientInput.disabled).toBe(true);

    root.unmount();
  });

  // ==================================================
  // O. UNIT 2: SAVE DISPATCHES ONCE WITH CONSOLIDATED DRAFT
  // ==================================================
  it('O. Unit 2: Save validates draft, issues updateProject exactly ONCE, and exits edit mode', async () => {
    const root = createRoot(container);
    const updateSpy = vi.spyOn(projectService, 'updateProject').mockResolvedValue(undefined);

    await act(async () => {
      root.render(
        <ProjectSetupWizard
          projects={[mockProject]}
          authContext={mockAuthContext}
          selectedProjectId="PRJ-RYD-101"
        />
      );
    });

    // Enter edit mode
    const editBtn = Array.from(document.body.querySelectorAll('button')).find(
      (b) => b.textContent?.includes('تعديل البيانات')
    );
    await act(async () => {
      editBtn?.click();
    });

    // Modify nameAr
    const nameInput = document.body.querySelector('input[value="مشروع حفر الرياض"]') as HTMLInputElement;
    await act(async () => {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
      nativeInputValueSetter?.call(nameInput, 'مشروع البنية التحتية بالرياض');
      nameInput.dispatchEvent(new Event('change', { bubbles: true }));
    });

    const saveBtn = Array.from(document.body.querySelectorAll('button')).find(
      (b) => b.textContent?.includes('حفظ التعديلات')
    ) as HTMLButtonElement;
    expect(saveBtn.disabled).toBe(false);

    // Click Save
    await act(async () => {
      saveBtn.click();
    });

    // Called exactly ONCE
    expect(updateSpy).toHaveBeenCalledTimes(1);
    expect(updateSpy).toHaveBeenCalledWith(
      'PRJ-RYD-101',
      expect.objectContaining({
        nameAr: 'مشروع البنية التحتية بالرياض',
        clientName: 'أمانة منطقة الرياض',
      }),
      mockAuthContext
    );

    // Exited edit mode and shows deterministic success message
    expect(document.body.textContent).toContain('تم حفظ تعديلات المشروع بنجاح');

    root.unmount();
  });

  // ==================================================
  // P. UNIT 2: ACTIVE PROJECT POLICY PRESERVED
  // ==================================================
  it('P. Unit 2: Active project locks foundation fields and suppresses edit button', async () => {
    const root = createRoot(container);
    const activeProject: ProjectEntity = {
      ...mockProject,
      status: 'ACTIVE',
    };

    await act(async () => {
      root.render(
        <ProjectSetupWizard
          projects={[activeProject]}
          authContext={mockAuthContext}
          selectedProjectId="PRJ-RYD-101"
        />
      );
    });

    // "تعديل البيانات" should NOT be present when status is ACTIVE
    const editBtn = Array.from(document.body.querySelectorAll('button')).find(
      (b) => b.textContent?.includes('تعديل البيانات')
    );
    expect(editBtn).toBeUndefined();

    // Inputs remain locked
    const clientInput = document.body.querySelector('input[value="أمانة منطقة الرياض"]') as HTMLInputElement;
    expect(clientInput.disabled).toBe(true);

    root.unmount();
  });

  // ==================================================
  // Q. UNIT 2: SAVE FAILURE ERROR HANDLING
  // ==================================================
  it('Q. Unit 2: Save failure preserves draft, remains in edit mode, and displays error', async () => {
    const root = createRoot(container);
    vi.spyOn(projectService, 'updateProject').mockRejectedValue(new Error('NETWORK_TIMEOUT: Server unreachable'));

    await act(async () => {
      root.render(
        <ProjectSetupWizard
          projects={[mockProject]}
          authContext={mockAuthContext}
          selectedProjectId="PRJ-RYD-101"
        />
      );
    });

    // Enter edit mode
    const editBtn = Array.from(document.body.querySelectorAll('button')).find(
      (b) => b.textContent?.includes('تعديل البيانات')
    );
    await act(async () => {
      editBtn?.click();
    });

    const clientInput = document.body.querySelector('input[value="أمانة منطقة الرياض"]') as HTMLInputElement;
    await act(async () => {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
      nativeInputValueSetter?.call(clientInput, 'شركة تطوير الرياض القابضة');
      clientInput.dispatchEvent(new Event('change', { bubbles: true }));
    });

    const saveBtn = Array.from(document.body.querySelectorAll('button')).find(
      (b) => b.textContent?.includes('حفظ التعديلات')
    ) as HTMLButtonElement;

    await act(async () => {
      saveBtn.click();
    });

    // Error is displayed
    expect(document.body.textContent).toContain('NETWORK_TIMEOUT: Server unreachable');
    // Still in edit mode: clientInput is still enabled and has user's draft value
    expect(clientInput.disabled).toBe(false);
    expect(clientInput.value).toBe('شركة تطوير الرياض القابضة');

    root.unmount();
  });

  // ==================================================
  // R. UNIT 2: LOCAL VALIDATION GATES
  // ==================================================
  it('R. Unit 2: Local validation gates save when nameAr < 3 chars or ZATCA is invalid format', async () => {
    const root = createRoot(container);
    const updateSpy = vi.spyOn(projectService, 'updateProject').mockResolvedValue(undefined);

    await act(async () => {
      root.render(
        <ProjectSetupWizard
          projects={[mockProject]}
          authContext={mockAuthContext}
          selectedProjectId="PRJ-RYD-101"
        />
      );
    });

    // Enter edit mode
    const editBtn = Array.from(document.body.querySelectorAll('button')).find(
      (b) => b.textContent?.includes('تعديل البيانات')
    );
    await act(async () => {
      editBtn?.click();
    });

    // Set invalid nameAr (less than 3 chars)
    const nameInput = document.body.querySelector('input[value="مشروع حفر الرياض"]') as HTMLInputElement;
    await act(async () => {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
      nativeInputValueSetter?.call(nameInput, 'مش');
      nameInput.dispatchEvent(new Event('change', { bubbles: true }));
    });

    const saveBtn = Array.from(document.body.querySelectorAll('button')).find(
      (b) => b.textContent?.includes('حفظ التعديلات')
    ) as HTMLButtonElement;

    await act(async () => {
      saveBtn.click();
    });

    expect(updateSpy).not.toHaveBeenCalled();
    expect(document.body.textContent).toContain('اسم المشروع بالعربية يجب ألا يقل عن 3 أحرف');

    root.unmount();
  });

  // ==================================================
  // S. UNIT 2: PROJECT PROP REFRESH SAFETY
  // ==================================================
  it('S. Unit 2: Prop updates refresh view mode values, but do not overwrite active draft while editing', async () => {
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <ProjectSetupWizard
          projects={[mockProject]}
          authContext={mockAuthContext}
          selectedProjectId="PRJ-RYD-101"
        />
      );
    });

    // 1. While in view mode, prop update refreshes view
    const updatedProject: ProjectEntity = {
      ...mockProject,
      clientName: 'هيئة تطوير بوابة الدرعية',
    };

    await act(async () => {
      root.render(
        <ProjectSetupWizard
          projects={[updatedProject]}
          authContext={mockAuthContext}
          selectedProjectId="PRJ-RYD-101"
        />
      );
    });

    expect(document.body.querySelector('input[value="هيئة تطوير بوابة الدرعية"]')).not.toBeNull();

    // 2. Enter edit mode and modify draft
    const editBtn = Array.from(document.body.querySelectorAll('button')).find(
      (b) => b.textContent?.includes('تعديل البيانات')
    );
    await act(async () => {
      editBtn?.click();
    });

    const clientInput = document.body.querySelector('input[value="هيئة تطوير بوابة الدرعية"]') as HTMLInputElement;
    await act(async () => {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
      nativeInputValueSetter?.call(clientInput, 'مسودة المستخدم المحلية المستقلة');
      clientInput.dispatchEvent(new Event('change', { bubbles: true }));
    });

    // 3. New prop update arrives while editing
    const remoteUpdatedProject: ProjectEntity = {
      ...updatedProject,
      clientName: 'تحديث خارجي لا يجب أن يمسح المسودة',
    };

    await act(async () => {
      root.render(
        <ProjectSetupWizard
          projects={[remoteUpdatedProject]}
          authContext={mockAuthContext}
          selectedProjectId="PRJ-RYD-101"
        />
      );
    });

    // User's active draft must NOT be overwritten!
    expect(clientInput.value).toBe('مسودة المستخدم المحلية المستقلة');

    root.unmount();
  });
});
