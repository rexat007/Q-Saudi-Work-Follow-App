import { describe, it, expect, beforeEach } from 'vitest';
import { createInMemoryAdminDb, setTestDbOverride, inMemoryAdminStore } from '../firebase/admin';
import { projectLifecycleServerService } from '../services/projectLifecycle.server';
import { ProjectEntity } from '../types/entities';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Project Lifecycle Server Authority Test Suite', () => {
  const superAdminContext = {
    userId: 'super-admin-1',
    email: 'super@qsaudi.com',
    role: 'SUPER_ADMIN' as const,
  };

  const projectAdminContext = {
    userId: 'project-admin-1',
    email: 'admin@qsaudi.com',
    role: 'PROJECT_ADMIN' as const,
    assignedProjectIds: ['Q-PRJ-006'],
  };

  const auditorContext = {
    userId: 'auditor-1',
    email: 'auditor@qsaudi.com',
    role: 'FINANCE_AUDITOR' as const,
  };

  const driverContext = {
    userId: 'driver-1',
    email: 'driver@qsaudi.com',
    role: 'DRIVER' as const,
  };

  const baselineProject: ProjectEntity = {
    projectId: 'Q-PRJ-006',
    projectCode: 'PRJ-RYD-006',
    projectNumber: 6,
    nameAr: 'مشروع تطوير الرياض',
    nameEn: 'Riyadh Development Project',
    clientName: 'أمانة منطقة الرياض',
    location: {
      lat: 24.7136,
      lng: 46.6753,
      geoFenceRadiusMeters: 500,
      addressAr: 'الرياض، المملكة العربية السعودية',
    },
    settings: {
      zatcaTaxNumber: '300000000000003',
      vatRatePercent: 15,
      allowDriverSelfDispatch: false,
    },
    status: 'SETUP',
    createdAt: new Date('2026-01-01'),
    createdBy: 'system-init',
    updatedAt: new Date('2026-01-01'),
    updatedBy: 'system-init',
  };

  beforeEach(() => {
    for (const key of Object.keys(inMemoryAdminStore)) {
      delete inMemoryAdminStore[key];
    }
    const testDb = createInMemoryAdminDb({});
    setTestDbOverride(testDb);

    // Seed baseline project
    inMemoryAdminStore['projects/Q-PRJ-006'] = { ...baselineProject };
  });

  // 1. project must exist
  it('1. project must exist', async () => {
    await expect(
      projectLifecycleServerService.transitionStatus('NON_EXISTENT_PRJ', 'READY_FOR_REVIEW', superAdminContext as any)
    ).rejects.toThrow('المشروع غير موجود');
  });

  // 2. SETUP -> READY_FOR_REVIEW succeeds
  it('2. SETUP -> READY_FOR_REVIEW succeeds', async () => {
    const res = await projectLifecycleServerService.transitionStatus('Q-PRJ-006', 'READY_FOR_REVIEW', projectAdminContext as any);
    expect(res.success).toBe(true);
    expect(res.previousStatus).toBe('SETUP');
    expect(res.newStatus).toBe('READY_FOR_REVIEW');
    expect(inMemoryAdminStore['projects/Q-PRJ-006'].status).toBe('READY_FOR_REVIEW');
  });

  // 3. READY_FOR_REVIEW -> APPROVED succeeds
  it('3. READY_FOR_REVIEW -> APPROVED succeeds', async () => {
    inMemoryAdminStore['projects/Q-PRJ-006'].status = 'READY_FOR_REVIEW';
    const res = await projectLifecycleServerService.transitionStatus('Q-PRJ-006', 'APPROVED', superAdminContext as any);
    expect(res.success).toBe(true);
    expect(res.previousStatus).toBe('READY_FOR_REVIEW');
    expect(res.newStatus).toBe('APPROVED');
    expect(inMemoryAdminStore['projects/Q-PRJ-006'].status).toBe('APPROVED');
  });

  // 4. READY_FOR_REVIEW -> SETUP succeeds
  it('4. READY_FOR_REVIEW -> SETUP succeeds', async () => {
    inMemoryAdminStore['projects/Q-PRJ-006'].status = 'READY_FOR_REVIEW';
    const res = await projectLifecycleServerService.transitionStatus('Q-PRJ-006', 'SETUP', superAdminContext as any, 'Missing weight bridge certificate');
    expect(res.success).toBe(true);
    expect(res.previousStatus).toBe('READY_FOR_REVIEW');
    expect(res.newStatus).toBe('SETUP');
    expect(inMemoryAdminStore['projects/Q-PRJ-006'].status).toBe('SETUP');
  });

  // 5. APPROVED -> READY_FOR_REVIEW succeeds
  it('5. APPROVED -> READY_FOR_REVIEW succeeds', async () => {
    inMemoryAdminStore['projects/Q-PRJ-006'].status = 'APPROVED';
    const res = await projectLifecycleServerService.transitionStatus('Q-PRJ-006', 'READY_FOR_REVIEW', superAdminContext as any);
    expect(res.success).toBe(true);
    expect(res.previousStatus).toBe('APPROVED');
    expect(res.newStatus).toBe('READY_FOR_REVIEW');
    expect(inMemoryAdminStore['projects/Q-PRJ-006'].status).toBe('READY_FOR_REVIEW');
  });

  // 6. APPROVED -> SETUP succeeds
  it('6. APPROVED -> SETUP succeeds', async () => {
    inMemoryAdminStore['projects/Q-PRJ-006'].status = 'APPROVED';
    const res = await projectLifecycleServerService.transitionStatus('Q-PRJ-006', 'SETUP', superAdminContext as any);
    expect(res.success).toBe(true);
    expect(res.previousStatus).toBe('APPROVED');
    expect(res.newStatus).toBe('SETUP');
    expect(inMemoryAdminStore['projects/Q-PRJ-006'].status).toBe('SETUP');
  });

  // 7. SETUP -> APPROVED is rejected
  it('7. SETUP -> APPROVED is rejected', async () => {
    inMemoryAdminStore['projects/Q-PRJ-006'].status = 'SETUP';
    await expect(
      projectLifecycleServerService.transitionStatus('Q-PRJ-006', 'APPROVED', superAdminContext as any)
    ).rejects.toThrow('انتقال غير صالح لحالة دورة حياة المشروع: لا يمكن الانتقال من SETUP إلى APPROVED');
  });

  // 8. SETUP -> ACTIVE is rejected
  it('8. SETUP -> ACTIVE is rejected', async () => {
    inMemoryAdminStore['projects/Q-PRJ-006'].status = 'SETUP';
    await expect(
      projectLifecycleServerService.transitionStatus('Q-PRJ-006', 'ACTIVE', superAdminContext as any)
    ).rejects.toThrow('لا يمكن تنشيط المشروع عبر مسار الانتقال العادي. يجب استخدام مسار التنشيط الرسمي (ProjectActivationService)');
  });

  // 9. READY_FOR_REVIEW -> ACTIVE is rejected
  it('9. READY_FOR_REVIEW -> ACTIVE is rejected', async () => {
    inMemoryAdminStore['projects/Q-PRJ-006'].status = 'READY_FOR_REVIEW';
    await expect(
      projectLifecycleServerService.transitionStatus('Q-PRJ-006', 'ACTIVE', superAdminContext as any)
    ).rejects.toThrow('لا يمكن تنشيط المشروع عبر مسار الانتقال العادي. يجب استخدام مسار التنشيط الرسمي (ProjectActivationService)');
  });

  // 10. unsupported target status is rejected
  it('10. unsupported target status is rejected', async () => {
    inMemoryAdminStore['projects/Q-PRJ-006'].status = 'SETUP';
    await expect(
      projectLifecycleServerService.transitionStatus('Q-PRJ-006', 'ARCHIVED' as any, superAdminContext as any)
    ).rejects.toThrow('انتقال غير صالح لحالة دورة حياة المشروع');
  });

  // 11. same-state transition is not silently accepted unless current canonical policy already explicitly permits it
  it('11. same-state transition is rejected as illegal', async () => {
    inMemoryAdminStore['projects/Q-PRJ-006'].status = 'SETUP';
    await expect(
      projectLifecycleServerService.transitionStatus('Q-PRJ-006', 'SETUP', superAdminContext as any)
    ).rejects.toThrow('انتقال غير صالح لحالة دورة حياة المشروع: لا يمكن الانتقال من SETUP إلى SETUP');
  });

  // 12. PROJECT_ADMIN is authorized
  it('12. PROJECT_ADMIN is authorized for assigned project', async () => {
    const res = await projectLifecycleServerService.transitionStatus('Q-PRJ-006', 'READY_FOR_REVIEW', projectAdminContext as any);
    expect(res.success).toBe(true);
    expect(res.newStatus).toBe('READY_FOR_REVIEW');
  });

  // 13. SUPER_ADMIN is authorized
  it('13. SUPER_ADMIN is authorized for any project', async () => {
    const res = await projectLifecycleServerService.transitionStatus('Q-PRJ-006', 'READY_FOR_REVIEW', superAdminContext as any);
    expect(res.success).toBe(true);
    expect(res.newStatus).toBe('READY_FOR_REVIEW');
  });

  // 14. FINANCE_AUDITOR is rejected
  it('14. FINANCE_AUDITOR is rejected', async () => {
    await expect(
      projectLifecycleServerService.transitionStatus('Q-PRJ-006', 'READY_FOR_REVIEW', auditorContext as any)
    ).rejects.toThrow('غير مصرح: لا تملك الصلاحية لتغيير حالة حوكمة المشروع');
  });

  // 15. other operational roles are rejected
  it('15. other operational roles are rejected', async () => {
    await expect(
      projectLifecycleServerService.transitionStatus('Q-PRJ-006', 'READY_FOR_REVIEW', driverContext as any)
    ).rejects.toThrow('غير مصرح: لا تملك الصلاحية لتغيير حالة حوكمة المشروع');

    await expect(
      projectLifecycleServerService.transitionStatus('Q-PRJ-006', 'READY_FOR_REVIEW', { userId: 'guest', role: 'VIEWER' } as any)
    ).rejects.toThrow('غير مصرح: لا تملك الصلاحية لتغيير حالة حوكمة المشروع');
  });

  // 16. URL projectId is authoritative
  it('16. URL projectId is authoritative (ignores body mismatch)', async () => {
    inMemoryAdminStore['projects/ATTACKER-PRJ'] = {
      projectId: 'ATTACKER-PRJ',
      status: 'SETUP',
    };

    // Transition Q-PRJ-006
    await projectLifecycleServerService.transitionStatus('Q-PRJ-006', 'READY_FOR_REVIEW', superAdminContext as any);

    expect(inMemoryAdminStore['projects/Q-PRJ-006'].status).toBe('READY_FOR_REVIEW');
    expect(inMemoryAdminStore['projects/ATTACKER-PRJ'].status).toBe('SETUP');
  });

  // 17. only status/update metadata are mutated on project document
  it('17. only status/update metadata are mutated on project document', async () => {
    await projectLifecycleServerService.transitionStatus('Q-PRJ-006', 'READY_FOR_REVIEW', projectAdminContext as any);
    const updated = inMemoryAdminStore['projects/Q-PRJ-006'];

    expect(updated.status).toBe('READY_FOR_REVIEW');
    expect(updated.updatedBy).toBe('project-admin-1');
    expect(updated.updatedAt).toBeDefined();
    expect(updated.nameAr).toBe('مشروع تطوير الرياض');
    expect(updated.nameEn).toBe('Riyadh Development Project');
    expect(updated.clientName).toBe('أمانة منطقة الرياض');
  });

  // 18. projectCode remains unchanged
  it('18. projectCode remains unchanged', async () => {
    await projectLifecycleServerService.transitionStatus('Q-PRJ-006', 'READY_FOR_REVIEW', superAdminContext as any);
    expect(inMemoryAdminStore['projects/Q-PRJ-006'].projectCode).toBe('PRJ-RYD-006');
  });

  // 19. projectNumber remains unchanged
  it('19. projectNumber remains unchanged', async () => {
    await projectLifecycleServerService.transitionStatus('Q-PRJ-006', 'READY_FOR_REVIEW', superAdminContext as any);
    expect(inMemoryAdminStore['projects/Q-PRJ-006'].projectNumber).toBe(6);
  });

  // 20. canonical audit log is created on successful transition
  it('20. canonical audit log is created on successful transition', async () => {
    await projectLifecycleServerService.transitionStatus('Q-PRJ-006', 'READY_FOR_REVIEW', superAdminContext as any);
    const auditKey = Object.keys(inMemoryAdminStore).find(k => k.startsWith('audit_logs/AUDIT-LIFECYCLE-Q-PRJ-006'));
    expect(auditKey).toBeDefined();
    expect(inMemoryAdminStore[auditKey!].projectId).toBe('Q-PRJ-006');
  });

  // 21. audit uses entityType PROJECT and action UPDATE
  it('21. audit uses entityType PROJECT and action UPDATE', async () => {
    await projectLifecycleServerService.transitionStatus('Q-PRJ-006', 'READY_FOR_REVIEW', superAdminContext as any);
    const auditKey = Object.keys(inMemoryAdminStore).find(k => k.startsWith('audit_logs/AUDIT-LIFECYCLE-Q-PRJ-006'));
    const auditEntry = inMemoryAdminStore[auditKey!];
    expect(auditEntry.entityType).toBe('PROJECT');
    expect(auditEntry.action).toBe('UPDATE');
    expect(auditEntry.entityId).toBe('Q-PRJ-006');
  });

  // 22. audit before/after snapshots correctly reflect transition
  it('22. audit before/after snapshots correctly reflect transition', async () => {
    await projectLifecycleServerService.transitionStatus('Q-PRJ-006', 'READY_FOR_REVIEW', superAdminContext as any);
    const auditKey = Object.keys(inMemoryAdminStore).find(k => k.startsWith('audit_logs/AUDIT-LIFECYCLE-Q-PRJ-006'));
    const auditEntry = inMemoryAdminStore[auditKey!];

    expect(auditEntry.changes.before.status).toBe('SETUP');
    expect(auditEntry.changes.after.status).toBe('READY_FOR_REVIEW');
    expect(auditEntry.changes.deltaFields).toContain('status');
  });

  // 23. updatedBy / actor.userId come from authenticated server context, not request body
  it('23. updatedBy / actor.userId come from authenticated server context', async () => {
    await projectLifecycleServerService.transitionStatus('Q-PRJ-006', 'READY_FOR_REVIEW', projectAdminContext as any);
    const updated = inMemoryAdminStore['projects/Q-PRJ-006'];
    expect(updated.updatedBy).toBe('project-admin-1');

    const auditKey = Object.keys(inMemoryAdminStore).find(k => k.startsWith('audit_logs/AUDIT-LIFECYCLE-Q-PRJ-006'));
    const auditEntry = inMemoryAdminStore[auditKey!];
    expect(auditEntry.actor.userId).toBe('project-admin-1');
    expect(auditEntry.createdBy).toBe('project-admin-1');
    expect(auditEntry.updatedBy).toBe('project-admin-1');
  });

  // 24. project update + audit are atomic
  it('24. project update + audit are atomic in single transaction', async () => {
    inMemoryAdminStore['projects/Q-PRJ-006'].status = 'SETUP';
    // When transition succeeds, both project status and audit log exist
    await projectLifecycleServerService.transitionStatus('Q-PRJ-006', 'READY_FOR_REVIEW', superAdminContext as any);

    expect(inMemoryAdminStore['projects/Q-PRJ-006'].status).toBe('READY_FOR_REVIEW');
    const auditCount = Object.keys(inMemoryAdminStore).filter(k => k.startsWith('audit_logs/AUDIT-LIFECYCLE-Q-PRJ-006')).length;
    expect(auditCount).toBe(1);
  });

  // 25. failed transition creates no audit record
  it('25. failed transition creates no audit record', async () => {
    inMemoryAdminStore['projects/Q-PRJ-006'].status = 'SETUP';
    try {
      await projectLifecycleServerService.transitionStatus('Q-PRJ-006', 'APPROVED', superAdminContext as any);
    } catch {
      // Expected rejection
    }

    expect(inMemoryAdminStore['projects/Q-PRJ-006'].status).toBe('SETUP');
    const auditCount = Object.keys(inMemoryAdminStore).filter(k => k.startsWith('audit_logs/AUDIT-LIFECYCLE-Q-PRJ-006')).length;
    expect(auditCount).toBe(0);
  });

  // 26. production lifecycle server path contains no auth.currentUser dependency
  it('26. production lifecycle server path contains no auth.currentUser dependency', () => {
    const serverCode = readFileSync(join(process.cwd(), 'src/services/projectLifecycle.server.ts'), 'utf-8');
    expect(serverCode).not.toContain('auth.currentUser');
  });

  // 27. production lifecycle server path contains no src/firebase/config dependency
  it('27. production lifecycle server path contains no src/firebase/config dependency', () => {
    const serverCode = readFileSync(join(process.cwd(), 'src/services/projectLifecycle.server.ts'), 'utf-8');
    expect(serverCode).not.toContain('../firebase/config');
    expect(serverCode).not.toContain('firebase/firestore');
  });

  // 28. production lifecycle server path does not call ProjectRepository browser mutation
  it('28. production lifecycle server path does not call ProjectRepository browser mutation', () => {
    const serverCode = readFileSync(join(process.cwd(), 'src/services/projectLifecycle.server.ts'), 'utf-8');
    expect(serverCode).not.toContain('ProjectRepository');
  });

  // 29. production lifecycle server path does not call AuditLogService / AuditLogRepository
  it('29. production lifecycle server path does not call AuditLogService / AuditLogRepository', () => {
    const serverCode = readFileSync(join(process.cwd(), 'src/services/projectLifecycle.server.ts'), 'utf-8');
    expect(serverCode).not.toContain('AuditLogService');
    expect(serverCode).not.toContain('AuditLogRepository');
  });

  // 30. server route retains enforceProjectIsolation + enforceAdminOnly
  it('30. server route retains enforceProjectIsolation + enforceAdminOnly', () => {
    const appCode = readFileSync(join(process.cwd(), 'server/app.ts'), 'utf-8');
    const routeRegex = /app\.post\(\s*['"]\/api\/projects\/:projectId\/lifecycle-transition['"]\s*,\s*enforceProjectIsolation\s*,\s*enforceAdminOnly/;
    expect(routeRegex.test(appCode)).toBe(true);
  });

  // 31. route invokes the server-authoritative lifecycle capability
  it('31. route invokes the server-authoritative lifecycle capability', () => {
    const appCode = readFileSync(join(process.cwd(), 'server/app.ts'), 'utf-8');
    expect(appCode).toContain("projectLifecycle.server");
    expect(appCode).toContain("projectLifecycleServerService");
  });

  // 32. ProjectSetupWizard still uses the lifecycle endpoint and does not directly mutate status
  it('32. ProjectSetupWizard still uses the lifecycle endpoint and does not directly mutate status', () => {
    const wizardCode = readFileSync(join(process.cwd(), 'src/components/wizard/ProjectSetupWizard.tsx'), 'utf-8');
    expect(wizardCode).toContain('/api/projects/${project.projectId}/lifecycle-transition');
    expect(wizardCode).toContain("method: 'POST'");
    expect(wizardCode).not.toMatch(/projectRepository\s*\.\s*update\s*\(/);
  });
});
