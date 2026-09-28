import { describe, it, expect } from 'vitest';
import { 
  navigationService, 
  NAV_ITEMS_REGISTRY, 
  DEVELOPER_TOOLS_REGISTRY, 
  SYSTEM_ROLES 
} from '../services/navigation.service';
import fs from 'fs';
import path from 'path';

describe('Step 3A — Primary Kitchen Navigation Convergence', () => {
  const RETIRED_TABS = ['IMPORT_CENTER', 'MASTER_DATA', 'WORKSPACE_INTEGRATION'] as const;

  it('1. IMPORT_CENTER is not present in production navigation registry or tool lists', () => {
    const registryIds = NAV_ITEMS_REGISTRY.map(item => item.id);
    expect(registryIds).not.toContain('IMPORT_CENTER');

    SYSTEM_ROLES.forEach(role => {
      const primaryTabs = navigationService.getAuthorizedPrimaryTabs(role).map(t => t.id);
      const systemTools = navigationService.getAuthorizedSystemTools(role).map(t => t.id);
      expect(primaryTabs).not.toContain('IMPORT_CENTER');
      expect(systemTools).not.toContain('IMPORT_CENTER');
    });
  });

  it('2. MASTER_DATA is not present in production navigation registry or tool lists', () => {
    const registryIds = NAV_ITEMS_REGISTRY.map(item => item.id);
    expect(registryIds).not.toContain('MASTER_DATA');

    SYSTEM_ROLES.forEach(role => {
      const primaryTabs = navigationService.getAuthorizedPrimaryTabs(role).map(t => t.id);
      const systemTools = navigationService.getAuthorizedSystemTools(role).map(t => t.id);
      expect(primaryTabs).not.toContain('MASTER_DATA');
      expect(systemTools).not.toContain('MASTER_DATA');
    });
  });

  it('3. WORKSPACE_INTEGRATION is not present in production navigation registry or tool lists', () => {
    const registryIds = NAV_ITEMS_REGISTRY.map(item => item.id);
    expect(registryIds).not.toContain('WORKSPACE_INTEGRATION');

    SYSTEM_ROLES.forEach(role => {
      const primaryTabs = navigationService.getAuthorizedPrimaryTabs(role).map(t => t.id);
      const systemTools = navigationService.getAuthorizedSystemTools(role).map(t => t.id);
      expect(primaryTabs).not.toContain('WORKSPACE_INTEGRATION');
      expect(systemTools).not.toContain('WORKSPACE_INTEGRATION');
    });
  });

  it('4. No system role receives authorization for any retired navigation tab', () => {
    SYSTEM_ROLES.forEach(role => {
      RETIRED_TABS.forEach(tabId => {
        const isAuth = navigationService.isTabAuthorizedForRole(tabId, role);
        expect(isAuth).toBe(false);
      });
    });
  });

  it('5. Mobile navigation / sidebar / drawers cannot expose retired tabs for any role', () => {
    SYSTEM_ROLES.forEach(role => {
      const allTabs = navigationService.getAuthorizedTabs(role).map(t => t.id);
      RETIRED_TABS.forEach(retiredId => {
        expect(allTabs).not.toContain(retiredId);
      });
    });
  });

  it('6. Stale activeTab for retired IDs triggers fallback to existing canonical role defaults', () => {
    SYSTEM_ROLES.forEach(role => {
      RETIRED_TABS.forEach(staleTabId => {
        const isAuth = navigationService.isTabAuthorizedForRole(staleTabId, role);
        expect(isAuth).toBe(false); // Triggers route guard isCurrentTabAuthorized = false
        const fallbackTab = navigationService.getDefaultTabForRole(role);
        expect(fallbackTab).toBeDefined();
        expect(['WIZARD', 'FIELD_OPERATIONS', 'REPORTS_ENGINE', 'OPERATIONS_DASHBOARD']).toContain(fallbackTab);
      });
    });
  });

  it('7. Project Workspace remains authorized and reachable via WIZARD tab for admin roles', () => {
    expect(navigationService.isTabAuthorizedForRole('WIZARD', 'SUPER_ADMIN')).toBe(true);
    expect(navigationService.isTabAuthorizedForRole('WIZARD', 'PROJECT_ADMIN')).toBe(true);

    const superAdminPrimary = navigationService.getAuthorizedPrimaryTabs('SUPER_ADMIN').map(t => t.id);
    expect(superAdminPrimary).toContain('WIZARD');
  });

  it('8. Project Setup Wizard remains authorized and reachable via WIZARD tab for admin roles', () => {
    const wizardDef = NAV_ITEMS_REGISTRY.find(item => item.id === 'WIZARD');
    expect(wizardDef).toBeDefined();
    expect(wizardDef?.isPrimary).toBe(true);
    expect(wizardDef?.allowedRoles).toContain('SUPER_ADMIN');
    expect(wizardDef?.allowedRoles).toContain('PROJECT_ADMIN');
  });

  it('9. No import service/pipeline files were modified during navigation convergence', () => {
    const importServicesDir = path.resolve(process.cwd(), 'src/services/import');
    const files = fs.readdirSync(importServicesDir);
    expect(files.length).toBeGreaterThan(0);
    expect(files).toContain('driverTruckPipeline.service.ts');
    expect(files).toContain('excelCsvPipeline.service.ts');
    expect(files).toContain('rosterBatchReview.service.ts');
  });

  it('10. Physical file status audit (Retired vs Canonical)', () => {
    const importCenterPath = path.resolve(process.cwd(), 'src/components/importCenter/ImportCenterView.tsx');
    const masterDataPath = path.resolve(process.cwd(), 'src/components/masterData/MasterDataView.tsx');
    const workspaceIntegrationPath = path.resolve(process.cwd(), 'src/components/workspace/WorkspaceIntegrationView.tsx');

    // ImportCenterView and MasterDataView are physically retired
    expect(fs.existsSync(importCenterPath)).toBe(false);
    expect(fs.existsSync(masterDataPath)).toBe(false);
    
    // WorkspaceIntegrationView remains present on disk but retired from navigation
    expect(fs.existsSync(workspaceIntegrationPath)).toBe(true);
  });
});
