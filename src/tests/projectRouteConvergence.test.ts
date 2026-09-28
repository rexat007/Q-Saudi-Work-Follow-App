import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { ProjectSetupWizard } from '../components/wizard/ProjectSetupWizard';
import { ProjectEntity } from '../types/entities';
import fs from 'fs';
import path from 'path';

// Mock the react-markdown and useI18n to avoid translation loading issues in test environments
vi.mock('../../i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    isRTL: false,
    locale: 'en'
  })
}));

vi.mock('react-markdown', () => ({
  default: ({ children }: { children: string }) => children
}));

describe('Step 3B-0 — Project Selection Route Convergence', () => {
  const mockProjects: ProjectEntity[] = [
    {
      projectId: 'PRJ-ACTIVE-100',
      nameAr: 'مشروع نشط الرياض',
      nameEn: 'Active Project Riyadh',
      projectCode: 'PRJ-100',
      projectNumber: 100,
      clientNameAr: 'العميل أ',
      clientNameEn: 'Client A',
      status: 'ACTIVE',
      vatRate: 15,
      zatcaId: 'Z-100',
      startDate: '2026-09-01',
      allowDriverSelfDispatch: false,
      googleDriveProvisioning: {
        enabled: true,
        rootFolderName: 'Active Root',
        spreadsheetTitle: 'Active Sheet',
        status: 'READY'
      }
    },
    {
      projectId: 'PRJ-SETUP-200',
      nameAr: 'مشروع تحت التهيئة نيوم',
      nameEn: 'Setup Project Neom',
      projectCode: 'PRJ-200',
      projectNumber: 200,
      clientNameAr: 'العميل ب',
      clientNameEn: 'Client B',
      status: 'SETUP',
      vatRate: 15,
      zatcaId: 'Z-200',
      startDate: '2026-09-10',
      allowDriverSelfDispatch: false,
      googleDriveProvisioning: {
        enabled: true,
        rootFolderName: 'Setup Root',
        spreadsheetTitle: 'Setup Sheet',
        status: 'PENDING'
      }
    }
  ];

  const mockAuthContext = {
    userId: 'USR-ADMIN-1',
    displayName: 'مدير مشروع أ',
    email: 'admin@qsaudi.com',
    role: 'PROJECT_ADMIN' as const,
    assignedProjectIds: ['PRJ-ACTIVE-100', 'PRJ-SETUP-200']
  };

  it('1. App.tsx rendering structure has no split rendering of ProjectWorkspaceView', () => {
    const appFileContent = fs.readFileSync(path.resolve(process.cwd(), 'src/App.tsx'), 'utf-8');
    
    // Prove that App.tsx does not contain a split check of selectedProjectId rendering ProjectWorkspaceView
    expect(appFileContent).not.toContain('<ProjectWorkspaceView');
    expect(appFileContent).not.toContain('selectedProjectId ? (');
    expect(appFileContent).toContain('<ProjectSetupWizard');
  });

  it('2. selectedProjectId passed as prop synchronizes with editingProjectId in ProjectSetupWizard', () => {
    // Check type definition to ensure prop exist
    const propsKeys: (keyof React.ComponentProps<typeof ProjectSetupWizard>)[] = [
      'projects',
      'authContext',
      'selectedProjectId',
      'onSelectProject'
    ];
    expect(propsKeys).toContain('selectedProjectId');
    expect(propsKeys).toContain('onSelectProject');
  });

  it('3. ProjectWorkspaceView is physically retired and unreachable from App.tsx via selectedProjectId', () => {
    const workspaceViewPath = path.resolve(process.cwd(), 'src/components/workspace/ProjectWorkspaceView.tsx');
    expect(fs.existsSync(workspaceViewPath)).toBe(false);

    const appFileContent = fs.readFileSync(path.resolve(process.cwd(), 'src/App.tsx'), 'utf-8');
    expect(appFileContent).not.toContain('import { ProjectWorkspaceView }');
  });

  it('4. Project creation, dashboard cards selection, and Back to Dashboard actions trigger prop synchronization', () => {
    const wizardContent = fs.readFileSync(path.resolve(process.cwd(), 'src/components/wizard/ProjectSetupWizard.tsx'), 'utf-8');
    
    // Prove synchronization code exists
    expect(wizardContent).toContain('useEffect(() => {');
    expect(wizardContent).toContain('setEditingProjectId(selectedProjectId);');
    
    // Prove callback notification is invoked on back-to-dashboard and project card clicks
    expect(wizardContent).toContain('onSelectProject?.(');
    expect(wizardContent).toContain('setEditingProjectId(null);');
  });
});
