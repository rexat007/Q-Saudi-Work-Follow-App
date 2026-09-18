import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { 
  navigationService 
} from '../services/navigation.service';
import { UserRole } from '../types/common';

describe('Phase 6 — AdminConsole Canonical Authority Convergence Verification', () => {
  const rootDir = process.cwd();
  const appPath = path.join(rootDir, 'src/App.tsx');
  const adminConsoleViewPath = path.join(rootDir, 'src/components/admin/AdminConsoleView.tsx');
  const adminConsoleServicePath = path.join(rootDir, 'src/services/adminConsole.service.ts');
  const exceptionEngineServicePath = path.join(rootDir, 'src/services/exceptionEngine.service.ts');
  const projectRepoPath = path.join(rootDir, 'src/repositories/project.repository.ts');
  const userRepoPath = path.join(rootDir, 'src/repositories/user.repository.ts');
  const auditLogServicePath = path.join(rootDir, 'src/services/auditLog.service.ts');

  // 1. AdminConsoleView.tsx does NOT import legacy adminConsoleService
  it('1. AdminConsoleView.tsx does NOT import legacy adminConsoleService', () => {
    const content = fs.readFileSync(adminConsoleViewPath, 'utf-8');
    expect(content).not.toMatch(/import\s+.*adminConsoleService.*from/);
    expect(content).not.toMatch(/from\s+['"].*adminConsole\.service['"]/);
    expect(content).not.toContain('adminConsoleService.');
  });

  // 2. AdminConsoleView.tsx does NOT import legacy exceptionEngine
  it('2. AdminConsoleView.tsx does NOT import legacy exceptionEngine', () => {
    const content = fs.readFileSync(adminConsoleViewPath, 'utf-8');
    expect(content).not.toMatch(/import\s+.*exceptionEngine.*from/);
    expect(content).not.toMatch(/from\s+['"].*exceptionEngine\.service['"]/);
    expect(content).not.toContain('exceptionEngine.');
  });

  // 3. AdminConsoleView.tsx imports canonical repositories and services
  it('3. AdminConsoleView.tsx imports canonical projectRepository, userRepository, and auditLogService', () => {
    const content = fs.readFileSync(adminConsoleViewPath, 'utf-8');
    expect(content).toMatch(/import\s+.*projectRepository.*from\s+['"].*project\.repository['"]/);
    expect(content).toMatch(/import\s+.*userRepository.*from\s+['"].*user\.repository['"]/);
    expect(content).toMatch(/import\s+.*auditLogService.*from\s+['"].*auditLog\.service['"]/);
  });

  // 4. AdminConsoleView subscribes to projectRepository with live real-time subscription
  it('4. AdminConsoleView subscribes to projectRepository with assignedProjectIds & isSuperAdmin', () => {
    const content = fs.readFileSync(adminConsoleViewPath, 'utf-8');
    expect(content).toContain('projectRepository.subscribeToProjects');
    expect(content).toContain('assignedProjectIds');
    expect(content).toContain('isSuperAdmin');
  });

  // 5. AdminConsoleView subscribes to canonical userRepository
  it('5. AdminConsoleView subscribes to canonical userRepository', () => {
    const content = fs.readFileSync(adminConsoleViewPath, 'utf-8');
    expect(content).toContain('userRepository.subscribeToUsers');
  });

  // 6. AdminConsoleView subscribes to canonical auditLogService
  it('6. AdminConsoleView subscribes to canonical auditLogService', () => {
    const content = fs.readFileSync(adminConsoleViewPath, 'utf-8');
    expect(content).toContain('auditLogService.subscribeToRecentLogs');
    expect(content).toContain('auditLogService.recordLog');
  });

  // 7. Legacy Exception tab and modal handlers are completely eliminated from AdminConsoleView
  it('7. Legacy Exception tab and modal handlers are completely eliminated from AdminConsoleView', () => {
    const content = fs.readFileSync(adminConsoleViewPath, 'utf-8');
    expect(content).not.toContain("activeSection === 'EXCEPTIONS'");
    expect(content).not.toContain('resolvingException');
    expect(content).not.toContain('rejectingException');
    expect(content).not.toContain('handleResolveException');
    expect(content).not.toContain('handleRejectException');
    expect(content).not.toContain('clinicalReasonNotes');
  });

  // 8. Legacy Sync Health card and triggers are eliminated from AdminConsoleView
  it('8. Legacy Sync Health card and triggers are eliminated from AdminConsoleView', () => {
    const content = fs.readFileSync(adminConsoleViewPath, 'utf-8');
    expect(content).not.toContain('حالة المزامنة والربط السحابي (Cloud Sync Health)');
    expect(content).not.toContain('forceSyncNow');
  });

  // 9. User approval performs canonical writes with audit logging and NO legacy dual writes
  it('9. User approval performs canonical writes with audit logging and NO legacy dual writes', () => {
    const content = fs.readFileSync(adminConsoleViewPath, 'utf-8');
    expect(content).toContain('handleApproveUserConfirm');
    expect(content).toContain('userRepository.update(userToApprove.userId');
    expect(content).toContain("status: 'ACTIVE'");
    expect(content).toContain('auditLogService.recordLog');
    expect(content).not.toContain('adminConsoleService.approveUser');
  });

  // 10. User rejection performs canonical writes with audit logging and NO legacy dual writes
  it('10. User rejection performs canonical writes with audit logging and NO legacy dual writes', () => {
    const content = fs.readFileSync(adminConsoleViewPath, 'utf-8');
    expect(content).toContain('handleRejectUserConfirm');
    expect(content).toContain('userRepository.update(userToReject.userId');
    expect(content).toContain("status: 'REJECTED'");
    expect(content).toContain('auditLogService.recordLog');
    expect(content).not.toContain('adminConsoleService.rejectUser');
  });

  // 11. User suspension and reactivation perform canonical writes
  it('11. User suspension and reactivation perform canonical writes', () => {
    const content = fs.readFileSync(adminConsoleViewPath, 'utf-8');
    expect(content).toContain('handleSuspendUser');
    expect(content).toContain('handleReactivateUser');
    expect(content).not.toContain('adminConsoleService.suspendUser');
    expect(content).not.toContain('adminConsoleService.reactivateUser');
  });

  // 12. AdminConsole preserves unique required governance sections and capabilities
  it('12. AdminConsole preserves unique required governance sections and capabilities', () => {
    const content = fs.readFileSync(adminConsoleViewPath, 'utf-8');
    expect(content).toContain("'USERS'");
    expect(content).toContain("'SECURITY_ACCESS'");
    expect(content).toContain("'AUDIT_LOGS'");
    expect(content).toContain('handleSaveSecurityPolicy');
  });

  // 13. AdminConsole does NOT gain project creation or property editing authority
  it('13. AdminConsole does NOT gain project creation or property editing authority', () => {
    const content = fs.readFileSync(adminConsoleViewPath, 'utf-8');
    expect(content).not.toContain('projectRepository.create');
    expect(content).not.toContain('projectRepository.update');
    expect(content).not.toContain('handleCreateProject');
    expect(content).not.toContain('handleUpdateProject');
  });

  // 14. App.tsx maintains production route to AdminConsoleView
  it('14. App.tsx maintains production route to AdminConsoleView', () => {
    const content = fs.readFileSync(appPath, 'utf-8');
    expect(content).toMatch(/import\s+.*AdminConsoleView.*from\s+['"].*AdminConsoleView['"]/);
    expect(content).toContain("activeTab === 'ADMIN_CONSOLE'");
    expect(content).toContain('<AdminConsoleView');
  });

  // 15. navigationService authorizes ADMIN_CONSOLE for SUPER_ADMIN & PROJECT_ADMIN, denies others
  it('15. navigationService authorizes ADMIN_CONSOLE for SUPER_ADMIN & PROJECT_ADMIN, denies others', () => {
    expect(navigationService.isTabAuthorizedForRole('ADMIN_CONSOLE', 'SUPER_ADMIN')).toBe(true);
    expect(navigationService.isTabAuthorizedForRole('ADMIN_CONSOLE', 'PROJECT_ADMIN')).toBe(true);

    const unauthorizedRoles: UserRole[] = [
      'SUPERVISOR',
      'SITE_SUPERVISOR',
      'DISPATCHER',
      'FINANCE_AUDITOR',
      'VIEWER'
    ];

    unauthorizedRoles.forEach((role) => {
      expect(navigationService.isTabAuthorizedForRole('ADMIN_CONSOLE', role)).toBe(false);
    });
  });

  // 16. Legacy source files are preserved intact for test fixtures
  it('16. Legacy source files are preserved intact for test fixtures', () => {
    expect(fs.existsSync(adminConsoleServicePath)).toBe(true);
    expect(fs.existsSync(exceptionEngineServicePath)).toBe(true);
    expect(fs.existsSync(projectRepoPath)).toBe(true);
    expect(fs.existsSync(userRepoPath)).toBe(true);
    expect(fs.existsSync(auditLogServicePath)).toBe(true);
  });
});
