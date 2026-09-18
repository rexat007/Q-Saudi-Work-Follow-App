import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { 
  navigationService, 
  DEVELOPER_TOOLS_REGISTRY, 
  NAV_ITEMS_REGISTRY,
  SYSTEM_ROLES 
} from '../services/navigation.service';
import { UserRole } from '../types/common';

describe('Phase 6 — ExceptionEngine Standalone Surface Retirement Verification', () => {
  const rootDir = process.cwd();
  const appPath = path.join(rootDir, 'src/App.tsx');
  const navPath = path.join(rootDir, 'src/services/navigation.service.ts');
  const exceptionEngineViewPath = path.join(rootDir, 'src/components/exceptionEngine/ExceptionEngineView.tsx');
  const exceptionEngineServicePath = path.join(rootDir, 'src/services/exceptionEngine.service.ts');
  const adminConsolePath = path.join(rootDir, 'src/components/admin/AdminConsoleView.tsx');
  const fieldSupervisionPath = path.join(rootDir, 'src/components/field/FieldSupervisionView.tsx');
  const unloadingOperatorPath = path.join(rootDir, 'src/components/field/UnloadingOperatorView.tsx');
  const reportsEnginePath = path.join(rootDir, 'src/components/reports/ReportsEngineView.tsx');
  const exceptionRepoPath = path.join(rootDir, 'src/repositories/exception.repository.ts');
  const importCenterPath = path.join(rootDir, 'src/components/importCenter/ImportCenterView.tsx');
  const tripEngineViewPath = path.join(rootDir, 'src/components/TripEngineView.tsx');
  const dataQualityPath = path.join(rootDir, 'src/components/dataQuality/DataQualityView.tsx');

  // 1. App.tsx has no production ExceptionEngineView import
  it('1. App.tsx has no production ExceptionEngineView import', () => {
    const appContent = fs.readFileSync(appPath, 'utf-8');
    expect(appContent).not.toMatch(/import\s+.*ExceptionEngineView.*from/);
  });

  // 2. App.tsx has no EXCEPTION_ENGINE render branch
  it('2. App.tsx has no EXCEPTION_ENGINE render branch', () => {
    const appContent = fs.readFileSync(appPath, 'utf-8');
    expect(appContent).not.toContain("activeTab === 'EXCEPTION_ENGINE'");
    expect(appContent).not.toContain('<ExceptionEngineView');
  });

  // 3. navigationService denies EXCEPTION_ENGINE for SUPER_ADMIN
  it('3. navigationService denies EXCEPTION_ENGINE for SUPER_ADMIN', () => {
    const isAuthorized = navigationService.isTabAuthorizedForRole('EXCEPTION_ENGINE', 'SUPER_ADMIN');
    expect(isAuthorized).toBe(false);

    const devTools = navigationService.getAuthorizedDeveloperTools('SUPER_ADMIN');
    expect(devTools.some(t => t.id === 'EXCEPTION_ENGINE')).toBe(false);

    const allTabs = navigationService.getAuthorizedTabs('SUPER_ADMIN');
    expect(allTabs.some(t => t.id === 'EXCEPTION_ENGINE')).toBe(false);
  });

  // 4. navigationService denies EXCEPTION_ENGINE for PROJECT_ADMIN
  it('4. navigationService denies EXCEPTION_ENGINE for PROJECT_ADMIN', () => {
    const isAuthorized = navigationService.isTabAuthorizedForRole('EXCEPTION_ENGINE', 'PROJECT_ADMIN');
    expect(isAuthorized).toBe(false);
  });

  // 5. navigationService denies EXCEPTION_ENGINE for all other roles
  it('5. navigationService denies EXCEPTION_ENGINE for all other roles', () => {
    SYSTEM_ROLES.forEach((role: UserRole) => {
      const isAuthorized = navigationService.isTabAuthorizedForRole('EXCEPTION_ENGINE', role);
      expect(isAuthorized).toBe(false);
    });
  });

  // 6. no production navigation registry exposes EXCEPTION_ENGINE
  it('6. no production navigation registry exposes EXCEPTION_ENGINE', () => {
    const navItem = NAV_ITEMS_REGISTRY.find(item => item.id === 'EXCEPTION_ENGINE');
    expect(navItem).toBeUndefined();

    const devItem = DEVELOPER_TOOLS_REGISTRY.find(item => item.id === 'EXCEPTION_ENGINE');
    expect(devItem).toBeUndefined();
  });

  // 7. ExceptionEngineView.tsx still exists
  it('7. ExceptionEngineView.tsx still exists as diagnostic/simulator source', () => {
    expect(fs.existsSync(exceptionEngineViewPath)).toBe(true);
    const content = fs.readFileSync(exceptionEngineViewPath, 'utf-8');
    expect(content.length).toBeGreaterThan(100);
  });

  // 8. exceptionEngine.service.ts still exists
  it('8. exceptionEngine.service.ts still exists for tests and AdminConsole usage', () => {
    expect(fs.existsSync(exceptionEngineServicePath)).toBe(true);
    const content = fs.readFileSync(exceptionEngineServicePath, 'utf-8');
    expect(content).toContain('class ExceptionEngineService');
  });

  // 9. no replacement standalone ExceptionEngine production control exists
  it('9. no replacement standalone ExceptionEngine production control exists', () => {
    const appContent = fs.readFileSync(appPath, 'utf-8');
    expect(appContent).not.toContain('Exception Simulator');
    expect(appContent).not.toContain('Legacy Exception Console');
    expect(appContent).not.toContain('Exception Test Harness');
  });

  // 10. FieldSupervisionView remains present
  it('10. FieldSupervisionView remains present', () => {
    expect(fs.existsSync(fieldSupervisionPath)).toBe(true);
  });

  // 11. UnloadingOperatorView remains present
  it('11. UnloadingOperatorView remains present', () => {
    expect(fs.existsSync(unloadingOperatorPath)).toBe(true);
  });

  // 12. ReportsEngineView remains present
  it('12. ReportsEngineView remains present', () => {
    expect(fs.existsSync(reportsEnginePath)).toBe(true);
  });

  // 13. exceptionRepository remains canonical and unchanged
  it('13. exceptionRepository remains canonical and unchanged', () => {
    expect(fs.existsSync(exceptionRepoPath)).toBe(true);
    const content = fs.readFileSync(exceptionRepoPath, 'utf-8');
    expect(content).toContain('export const exceptionRepository');
  });

  // 14. AdminConsoleView remains untouched
  it('14. AdminConsoleView remains untouched in production App.tsx', () => {
    expect(fs.existsSync(adminConsolePath)).toBe(true);
    const appContent = fs.readFileSync(appPath, 'utf-8');
    expect(appContent).toContain("activeTab === 'ADMIN_CONSOLE'");
  });

  // 15. AdminConsole exceptionEngine service dependency is converged to canonical authority
  it('15. AdminConsole exceptionEngine service dependency is eliminated', () => {
    const adminContent = fs.readFileSync(adminConsolePath, 'utf-8');
    expect(adminContent).not.toContain('exceptionEngine.getAllExceptions');
    expect(adminContent).not.toContain('exceptionEngine.resolveException');
    expect(adminContent).not.toContain('exceptionEngine.rejectException');
  });

  // 16. TripEngine remains retired
  it('16. TripEngine remains retired', () => {
    expect(fs.existsSync(tripEngineViewPath)).toBe(true);
    const appContent = fs.readFileSync(appPath, 'utf-8');
    expect(appContent).not.toContain("activeTab === 'TRIP_ENGINE'");
    expect(navigationService.isTabAuthorizedForRole('TRIP_ENGINE', 'SUPER_ADMIN')).toBe(false);
  });

  // 17. DataQuality remains retired
  it('17. DataQuality remains retired', () => {
    expect(fs.existsSync(dataQualityPath)).toBe(true);
    const appContent = fs.readFileSync(appPath, 'utf-8');
    expect(appContent).not.toContain("activeTab === 'DATA_QUALITY'");
    expect(navigationService.isTabAuthorizedForRole('DATA_QUALITY', 'SUPER_ADMIN')).toBe(false);
  });

  // 18. ImportCenter remains canonical
  it('18. ImportCenter remains canonical', () => {
    expect(fs.existsSync(importCenterPath)).toBe(true);
    const appContent = fs.readFileSync(appPath, 'utf-8');
    expect(appContent).toContain("activeTab === 'IMPORT_CENTER'");
  });
});
