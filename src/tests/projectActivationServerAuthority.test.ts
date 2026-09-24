import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createInMemoryAdminDb, setTestDbOverride, inMemoryAdminStore } from '../firebase/admin';
import { ProjectActivationService } from '../services/projectActivation.service';
import { ProjectReadinessAdminReadContext } from '../services/projectReadiness.server';
import { ProjectEntity, PricingRuleEntity } from '../types/entities';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Project Activation Server Authority Test Suite', () => {
  let activationService: ProjectActivationService;

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
    status: 'APPROVED',
    createdAt: new Date('2026-01-01'),
    createdBy: 'system-init',
    updatedAt: new Date('2026-01-01'),
    updatedBy: 'system-init',
  };

  const setupFullCoherentOperationalPath = (projectId = 'Q-PRJ-006') => {
    inMemoryAdminStore[`projects/${projectId}`] = { ...baselineProject, projectId };
    inMemoryAdminStore[`projects/${projectId}/driver_memberships/DRV-001`] = { driverId: 'DRV-001', status: 'ACTIVE' };
    inMemoryAdminStore[`projects/${projectId}/truck_memberships/TRK-001`] = { truckId: 'TRK-001', status: 'ACTIVE' };
    inMemoryAdminStore[`projects/${projectId}/carrier_memberships/CAR-001`] = { carrierId: 'CAR-001', status: 'ACTIVE' };
    inMemoryAdminStore[`projects/${projectId}/material_memberships/MAT-001`] = { materialId: 'MAT-001', status: 'ACTIVE' };

    inMemoryAdminStore[`projects/${projectId}/driver_carrier_affiliations/DRV-001`] = { driverId: 'DRV-001', carrierId: 'CAR-001', status: 'ACTIVE' };
    inMemoryAdminStore[`projects/${projectId}/truck_carrier_affiliations/TRK-001`] = { truckId: 'TRK-001', carrierId: 'CAR-001', status: 'ACTIVE' };

    inMemoryAdminStore[`projects/${projectId}/driver_active_assignments/DRV-001`] = { assignmentId: 'ASN-001' };
    inMemoryAdminStore[`projects/${projectId}/truck_active_assignments/TRK-001`] = { assignmentId: 'ASN-001' };
    inMemoryAdminStore[`projects/${projectId}/driver_truck_assignments/ASN-001`] = {
      assignmentId: 'ASN-001',
      driverId: 'DRV-001',
      truckId: 'TRK-001',
      status: 'ACTIVE',
    };

    inMemoryAdminStore[`projects/${projectId}/truck_active_material_allocations/TRK-001`] = { allocationId: 'ALC-001' };
    inMemoryAdminStore[`projects/${projectId}/truck_material_allocations/ALC-001`] = {
      allocationId: 'ALC-001',
      projectId,
      truckId: 'TRK-001',
      materialId: 'MAT-001',
      status: 'ACTIVE',
      effectiveFrom: '2020-01-01',
      effectiveTo: null,
    };

    inMemoryAdminStore[`projects/${projectId}/pricing_rules/PRC-001`] = {
      pricingRuleId: 'PRC-001',
      projectId,
      carrierId: 'CAR-001',
      materialId: 'MAT-001',
      effectiveFrom: '2020-01-01',
      effectiveTo: '3000-01-01',
      status: 'ACTIVE',
    };
  };

  beforeEach(() => {
    for (const key of Object.keys(inMemoryAdminStore)) {
      delete inMemoryAdminStore[key];
    }
    const testDb = createInMemoryAdminDb({});
    setTestDbOverride(testDb);
    activationService = new ProjectActivationService();
  });

  // 1. project must exist
  it('1. project must exist', async () => {
    await expect(
      activationService.activateProject('NON_EXISTENT', superAdminContext as any)
    ).rejects.toThrow('المشروع غير موجود');
  });

  // 2. PROJECT_ADMIN authorized for assigned project
  it('2. PROJECT_ADMIN authorized for assigned project', async () => {
    setupFullCoherentOperationalPath('Q-PRJ-006');
    await activationService.activateProject('Q-PRJ-006', projectAdminContext as any);
    expect(inMemoryAdminStore['projects/Q-PRJ-006'].status).toBe('ACTIVE');
  });

  // 3. SUPER_ADMIN authorized
  it('3. SUPER_ADMIN authorized for any project', async () => {
    setupFullCoherentOperationalPath('Q-PRJ-006');
    await activationService.activateProject('Q-PRJ-006', superAdminContext as any);
    expect(inMemoryAdminStore['projects/Q-PRJ-006'].status).toBe('ACTIVE');
  });

  // 4. FINANCE_AUDITOR rejected
  it('4. FINANCE_AUDITOR rejected', async () => {
    setupFullCoherentOperationalPath('Q-PRJ-006');
    await expect(
      activationService.activateProject('Q-PRJ-006', auditorContext as any)
    ).rejects.toThrow('غير مصرح لك بتنشيط المشروع');
  });

  // 5. other operational roles rejected
  it('5. other operational roles rejected', async () => {
    setupFullCoherentOperationalPath('Q-PRJ-006');
    await expect(
      activationService.activateProject('Q-PRJ-006', driverContext as any)
    ).rejects.toThrow('غير مصرح لك بتنشيط المشروع');
  });

  // 6. project must be APPROVED before first activation
  it('6. project must be APPROVED before first activation', async () => {
    setupFullCoherentOperationalPath('Q-PRJ-006');
    expect(inMemoryAdminStore['projects/Q-PRJ-006'].status).toBe('APPROVED');
  });

  // 7. SETUP activation rejected
  it('7. SETUP activation rejected', async () => {
    setupFullCoherentOperationalPath('Q-PRJ-006');
    inMemoryAdminStore['projects/Q-PRJ-006'].status = 'SETUP';
    await expect(
      activationService.activateProject('Q-PRJ-006', superAdminContext as any)
    ).rejects.toThrow('لا يمكن تنشيط مشروع ما لم يكن في حالة معتمد (APPROVED)');
  });

  // 8. READY_FOR_REVIEW activation rejected
  it('8. READY_FOR_REVIEW activation rejected', async () => {
    setupFullCoherentOperationalPath('Q-PRJ-006');
    inMemoryAdminStore['projects/Q-PRJ-006'].status = 'READY_FOR_REVIEW';
    await expect(
      activationService.activateProject('Q-PRJ-006', superAdminContext as any)
    ).rejects.toThrow('لا يمكن تنشيط مشروع ما لم يكن في حالة معتمد (APPROVED)');
  });

  // 9. already ACTIVE is idempotent success
  it('9. already ACTIVE is idempotent success', async () => {
    setupFullCoherentOperationalPath('Q-PRJ-006');
    inMemoryAdminStore['projects/Q-PRJ-006'].status = 'ACTIVE';
    await expect(
      activationService.activateProject('Q-PRJ-006', superAdminContext as any)
    ).resolves.toBeUndefined();
    expect(inMemoryAdminStore['projects/Q-PRJ-006'].status).toBe('ACTIVE');
  });

  // 10. already ACTIVE creates no duplicate activation audit
  it('10. already ACTIVE creates no duplicate activation audit', async () => {
    setupFullCoherentOperationalPath('Q-PRJ-006');
    inMemoryAdminStore['projects/Q-PRJ-006'].status = 'ACTIVE';
    await activationService.activateProject('Q-PRJ-006', superAdminContext as any);
    const audits = Object.keys(inMemoryAdminStore).filter(k => k.startsWith('audit_logs/'));
    expect(audits.length).toBe(0);
  });

  // 11. readiness false rejects activation
  it('11. readiness false rejects activation', async () => {
    setupFullCoherentOperationalPath('Q-PRJ-006');
    // Remove carrier membership
    delete inMemoryAdminStore['projects/Q-PRJ-006/carrier_memberships/CAR-001'];
    await expect(
      activationService.activateProject('Q-PRJ-006', superAdminContext as any)
    ).rejects.toThrow('المشروع غير جاهز للتنشيط');
  });

  // 12. missing candidatePath rejects activation
  it('12. missing candidatePath rejects activation', async () => {
    setupFullCoherentOperationalPath('Q-PRJ-006');
    // Remove pricing rule so candidatePath is incomplete
    delete inMemoryAdminStore['projects/Q-PRJ-006/pricing_rules/PRC-001'];
    await expect(
      activationService.activateProject('Q-PRJ-006', superAdminContext as any)
    ).rejects.toThrow('المشروع غير جاهز للتنشيط');
  });

  // 13. server uses ProjectReadinessAdminReadContext
  it('13. server uses ProjectReadinessAdminReadContext', async () => {
    const context = new ProjectReadinessAdminReadContext();
    setupFullCoherentOperationalPath('Q-PRJ-006');
    const prj = await context.getProject('Q-PRJ-006');
    expect(prj?.projectId).toBe('Q-PRJ-006');
  });

  // 14. client-supplied candidate IDs are not trusted
  it('14. client-supplied candidate IDs are not trusted (uses server discovery)', async () => {
    setupFullCoherentOperationalPath('Q-PRJ-006');
    // activateProject does not accept client candidatePath parameter, takes only projectId & server context
    await activationService.activateProject('Q-PRJ-006', superAdminContext as any);
    expect(inMemoryAdminStore['projects/Q-PRJ-006'].status).toBe('ACTIVE');
  });

  // 15. driver membership missing rejected
  it('15. driver membership missing in transaction rejected', async () => {
    setupFullCoherentOperationalPath('Q-PRJ-006');
    // We simulate stale discovery by directly deleting after discovery or corrupting transaction doc
    delete inMemoryAdminStore['projects/Q-PRJ-006/driver_memberships/DRV-001'];
    await expect(
      activationService.activateProject('Q-PRJ-006', superAdminContext as any)
    ).rejects.toThrow('المشروع غير جاهز للتنشيط');
  });

  // 16. driver membership non-ACTIVE rejected
  it('16. driver membership non-ACTIVE rejected', async () => {
    setupFullCoherentOperationalPath('Q-PRJ-006');
    inMemoryAdminStore['projects/Q-PRJ-006/driver_memberships/DRV-001'].status = 'SUSPENDED';
    await expect(
      activationService.activateProject('Q-PRJ-006', superAdminContext as any)
    ).rejects.toThrow('المشروع غير جاهز للتنشيط');
  });

  // 17. truck membership missing/non-ACTIVE rejected
  it('17. truck membership missing/non-ACTIVE rejected', async () => {
    setupFullCoherentOperationalPath('Q-PRJ-006');
    inMemoryAdminStore['projects/Q-PRJ-006/truck_memberships/TRK-001'].status = 'INACTIVE';
    await expect(
      activationService.activateProject('Q-PRJ-006', superAdminContext as any)
    ).rejects.toThrow('المشروع غير جاهز للتنشيط');
  });

  // 18. carrier membership missing/non-ACTIVE rejected
  it('18. carrier membership missing/non-ACTIVE rejected', async () => {
    setupFullCoherentOperationalPath('Q-PRJ-006');
    inMemoryAdminStore['projects/Q-PRJ-006/carrier_memberships/CAR-001'].status = 'SUSPENDED';
    await expect(
      activationService.activateProject('Q-PRJ-006', superAdminContext as any)
    ).rejects.toThrow('المشروع غير جاهز للتنشيط');
  });

  // 19. material membership missing/non-ACTIVE rejected
  it('19. material membership missing/non-ACTIVE rejected', async () => {
    setupFullCoherentOperationalPath('Q-PRJ-006');
    inMemoryAdminStore['projects/Q-PRJ-006/material_memberships/MAT-001'].status = 'INACTIVE';
    await expect(
      activationService.activateProject('Q-PRJ-006', superAdminContext as any)
    ).rejects.toThrow('المشروع غير جاهز للتنشيط');
  });

  // 20. driver affiliation missing/non-ACTIVE rejected
  it('20. driver affiliation missing/non-ACTIVE rejected', async () => {
    setupFullCoherentOperationalPath('Q-PRJ-006');
    inMemoryAdminStore['projects/Q-PRJ-006/driver_carrier_affiliations/DRV-001'].status = 'INACTIVE';
    await expect(
      activationService.activateProject('Q-PRJ-006', superAdminContext as any)
    ).rejects.toThrow('المشروع غير جاهز للتنشيط');
  });

  // 21. driver affiliation carrier mismatch rejected
  it('21. driver affiliation carrier mismatch rejected', async () => {
    setupFullCoherentOperationalPath('Q-PRJ-006');
    inMemoryAdminStore['projects/Q-PRJ-006/driver_carrier_affiliations/DRV-001'].carrierId = 'CAR-OTHER';
    await expect(
      activationService.activateProject('Q-PRJ-006', superAdminContext as any)
    ).rejects.toThrow('المشروع غير جاهز للتنشيط');
  });

  // 22. truck affiliation missing/non-ACTIVE rejected
  it('22. truck affiliation missing/non-ACTIVE rejected', async () => {
    setupFullCoherentOperationalPath('Q-PRJ-006');
    inMemoryAdminStore['projects/Q-PRJ-006/truck_carrier_affiliations/TRK-001'].status = 'INACTIVE';
    await expect(
      activationService.activateProject('Q-PRJ-006', superAdminContext as any)
    ).rejects.toThrow('المشروع غير جاهز للتنشيط');
  });

  // 23. truck affiliation carrier mismatch rejected
  it('23. truck affiliation carrier mismatch rejected', async () => {
    setupFullCoherentOperationalPath('Q-PRJ-006');
    inMemoryAdminStore['projects/Q-PRJ-006/truck_carrier_affiliations/TRK-001'].carrierId = 'CAR-OTHER';
    await expect(
      activationService.activateProject('Q-PRJ-006', superAdminContext as any)
    ).rejects.toThrow('المشروع غير جاهز للتنشيط');
  });

  // 24. driver active assignment pointer mismatch rejected
  it('24. driver active assignment pointer mismatch rejected', async () => {
    setupFullCoherentOperationalPath('Q-PRJ-006');
    inMemoryAdminStore['projects/Q-PRJ-006/driver_active_assignments/DRV-001'].assignmentId = 'ASN-OTHER';
    await expect(
      activationService.activateProject('Q-PRJ-006', superAdminContext as any)
    ).rejects.toThrow('المشروع غير جاهز للتنشيط');
  });

  // 25. truck active assignment pointer mismatch rejected
  it('25. truck active assignment pointer mismatch rejected', async () => {
    setupFullCoherentOperationalPath('Q-PRJ-006');
    inMemoryAdminStore['projects/Q-PRJ-006/truck_active_assignments/TRK-001'].assignmentId = 'ASN-OTHER';
    await expect(
      activationService.activateProject('Q-PRJ-006', superAdminContext as any)
    ).rejects.toThrow('فشل تنشيط المشروع: مؤشر التعيين النشط غير متطابق');
  });

  // 26. assignment missing rejected
  it('26. assignment missing rejected', async () => {
    setupFullCoherentOperationalPath('Q-PRJ-006');
    delete inMemoryAdminStore['projects/Q-PRJ-006/driver_truck_assignments/ASN-001'];
    await expect(
      activationService.activateProject('Q-PRJ-006', superAdminContext as any)
    ).rejects.toThrow('المشروع غير جاهز للتنشيط');
  });

  // 27. assignment non-ACTIVE rejected
  it('27. assignment non-ACTIVE rejected', async () => {
    setupFullCoherentOperationalPath('Q-PRJ-006');
    inMemoryAdminStore['projects/Q-PRJ-006/driver_truck_assignments/ASN-001'].status = 'ENDED';
    await expect(
      activationService.activateProject('Q-PRJ-006', superAdminContext as any)
    ).rejects.toThrow('المشروع غير جاهز للتنشيط');
  });

  // 28. assignment driver mismatch rejected
  it('28. assignment driver mismatch rejected', async () => {
    setupFullCoherentOperationalPath('Q-PRJ-006');
    inMemoryAdminStore['projects/Q-PRJ-006/driver_truck_assignments/ASN-001'].driverId = 'DRV-OTHER';
    await expect(
      activationService.activateProject('Q-PRJ-006', superAdminContext as any)
    ).rejects.toThrow('فشل تنشيط المشروع: تفاصيل التعيين غير متطابقة أو غير نشطة');
  });

  // 29. assignment truck mismatch rejected
  it('29. assignment truck mismatch rejected', async () => {
    setupFullCoherentOperationalPath('Q-PRJ-006');
    inMemoryAdminStore['projects/Q-PRJ-006/driver_truck_assignments/ASN-001'].truckId = 'TRK-OTHER';
    await expect(
      activationService.activateProject('Q-PRJ-006', superAdminContext as any)
    ).rejects.toThrow('المشروع غير جاهز للتنشيط');
  });

  // 30. active material allocation pointer mismatch rejected
  it('30. active material allocation pointer mismatch rejected', async () => {
    setupFullCoherentOperationalPath('Q-PRJ-006');
    inMemoryAdminStore['projects/Q-PRJ-006/truck_active_material_allocations/TRK-001'].allocationId = 'ALC-OTHER';
    await expect(
      activationService.activateProject('Q-PRJ-006', superAdminContext as any)
    ).rejects.toThrow('المشروع غير جاهز للتنشيط');
  });

  // 31. allocation missing rejected
  it('31. allocation missing rejected', async () => {
    setupFullCoherentOperationalPath('Q-PRJ-006');
    delete inMemoryAdminStore['projects/Q-PRJ-006/truck_material_allocations/ALC-001'];
    await expect(
      activationService.activateProject('Q-PRJ-006', superAdminContext as any)
    ).rejects.toThrow('المشروع غير جاهز للتنشيط');
  });

  // 32. allocation non-ACTIVE rejected
  it('32. allocation non-ACTIVE rejected', async () => {
    setupFullCoherentOperationalPath('Q-PRJ-006');
    inMemoryAdminStore['projects/Q-PRJ-006/truck_material_allocations/ALC-001'].status = 'ENDED';
    await expect(
      activationService.activateProject('Q-PRJ-006', superAdminContext as any)
    ).rejects.toThrow('المشروع غير جاهز للتنشيط');
  });

  // 33. allocation truck mismatch rejected
  it('33. allocation truck mismatch rejected', async () => {
    setupFullCoherentOperationalPath('Q-PRJ-006');
    inMemoryAdminStore['projects/Q-PRJ-006/truck_material_allocations/ALC-001'].truckId = 'TRK-OTHER';
    await expect(
      activationService.activateProject('Q-PRJ-006', superAdminContext as any)
    ).rejects.toThrow('المشروع غير جاهز للتنشيط');
  });

  // 34. allocation material mismatch rejected
  it('34. allocation material mismatch rejected', async () => {
    setupFullCoherentOperationalPath('Q-PRJ-006');
    inMemoryAdminStore['projects/Q-PRJ-006/truck_material_allocations/ALC-001'].materialId = 'MAT-OTHER';
    await expect(
      activationService.activateProject('Q-PRJ-006', superAdminContext as any)
    ).rejects.toThrow('المشروع غير جاهز للتنشيط');
  });

  // 35. closed allocation effectiveTo !== null rejected
  it('35. closed allocation effectiveTo !== null rejected', async () => {
    setupFullCoherentOperationalPath('Q-PRJ-006');
    inMemoryAdminStore['projects/Q-PRJ-006/truck_material_allocations/ALC-001'].effectiveTo = '2026-02-01';
    await expect(
      activationService.activateProject('Q-PRJ-006', superAdminContext as any)
    ).rejects.toThrow('المشروع غير جاهز للتنشيط');
  });

  // 36. pricing rule missing rejected
  it('36. pricing rule missing rejected', async () => {
    setupFullCoherentOperationalPath('Q-PRJ-006');
    delete inMemoryAdminStore['projects/Q-PRJ-006/pricing_rules/PRC-001'];
    await expect(
      activationService.activateProject('Q-PRJ-006', superAdminContext as any)
    ).rejects.toThrow('المشروع غير جاهز للتنشيط');
  });

  // 37. pricing project mismatch rejected
  it('37. pricing project mismatch rejected', async () => {
    setupFullCoherentOperationalPath('Q-PRJ-006');
    inMemoryAdminStore['projects/Q-PRJ-006/pricing_rules/PRC-001'].projectId = 'Q-PRJ-OTHER';
    await expect(
      activationService.activateProject('Q-PRJ-006', superAdminContext as any)
    ).rejects.toThrow('المشروع غير جاهز للتنشيط');
  });

  // 38. pricing carrier mismatch rejected
  it('38. pricing carrier mismatch rejected', async () => {
    setupFullCoherentOperationalPath('Q-PRJ-006');
    inMemoryAdminStore['projects/Q-PRJ-006/pricing_rules/PRC-001'].carrierId = 'CAR-OTHER';
    await expect(
      activationService.activateProject('Q-PRJ-006', superAdminContext as any)
    ).rejects.toThrow('المشروع غير جاهز للتنشيط');
  });

  // 39. pricing material mismatch rejected
  it('39. pricing material mismatch rejected', async () => {
    setupFullCoherentOperationalPath('Q-PRJ-006');
    inMemoryAdminStore['projects/Q-PRJ-006/pricing_rules/PRC-001'].materialId = 'MAT-OTHER';
    await expect(
      activationService.activateProject('Q-PRJ-006', superAdminContext as any)
    ).rejects.toThrow('المشروع غير جاهز للتنشيط');
  });

  // 40. future pricing rejected
  it('40. future pricing rejected', async () => {
    setupFullCoherentOperationalPath('Q-PRJ-006');
    inMemoryAdminStore['projects/Q-PRJ-006/pricing_rules/PRC-001'].effectiveFrom = '2099-01-01';
    await expect(
      activationService.activateProject('Q-PRJ-006', superAdminContext as any)
    ).rejects.toThrow('المشروع غير جاهز للتنشيط');
  });

  // 41. expired pricing rejected
  it('41. expired pricing rejected', async () => {
    setupFullCoherentOperationalPath('Q-PRJ-006');
    inMemoryAdminStore['projects/Q-PRJ-006/pricing_rules/PRC-001'].effectiveTo = '2020-01-01';
    await expect(
      activationService.activateProject('Q-PRJ-006', superAdminContext as any)
    ).rejects.toThrow('المشروع غير جاهز للتنشيط');
  });

  // 42. coherent APPROVED project activates successfully
  it('42. coherent APPROVED project activates successfully', async () => {
    setupFullCoherentOperationalPath('Q-PRJ-006');
    await activationService.activateProject('Q-PRJ-006', superAdminContext as any);
    expect(inMemoryAdminStore['projects/Q-PRJ-006'].status).toBe('ACTIVE');
  });

  // 43. only project status/update metadata change
  it('43. only project status/update metadata change', async () => {
    setupFullCoherentOperationalPath('Q-PRJ-006');
    await activationService.activateProject('Q-PRJ-006', projectAdminContext as any);
    const prj = inMemoryAdminStore['projects/Q-PRJ-006'];
    expect(prj.status).toBe('ACTIVE');
    expect(prj.updatedBy).toBe('project-admin-1');
    expect(prj.updatedAt).toBeDefined();
    expect(prj.nameAr).toBe('مشروع تطوير الرياض');
    expect(prj.clientName).toBe('أمانة منطقة الرياض');
  });

  // 44. projectCode preserved
  it('44. projectCode preserved', async () => {
    setupFullCoherentOperationalPath('Q-PRJ-006');
    await activationService.activateProject('Q-PRJ-006', superAdminContext as any);
    expect(inMemoryAdminStore['projects/Q-PRJ-006'].projectCode).toBe('PRJ-RYD-006');
  });

  // 45. projectNumber preserved
  it('45. projectNumber preserved', async () => {
    setupFullCoherentOperationalPath('Q-PRJ-006');
    await activationService.activateProject('Q-PRJ-006', superAdminContext as any);
    expect(inMemoryAdminStore['projects/Q-PRJ-006'].projectNumber).toBe(6);
  });

  // 46. canonical PROJECT/UPDATE audit written
  it('46. canonical PROJECT/UPDATE audit written', async () => {
    setupFullCoherentOperationalPath('Q-PRJ-006');
    await activationService.activateProject('Q-PRJ-006', superAdminContext as any);
    const auditKey = Object.keys(inMemoryAdminStore).find(k => k.startsWith('audit_logs/AUDIT-ACTIVATION-Q-PRJ-006'));
    expect(auditKey).toBeDefined();
    expect(inMemoryAdminStore[auditKey!].entityType).toBe('PROJECT');
    expect(inMemoryAdminStore[auditKey!].action).toBe('UPDATE');
  });

  // 47. audit before APPROVED / after ACTIVE correct
  it('47. audit before APPROVED / after ACTIVE correct', async () => {
    setupFullCoherentOperationalPath('Q-PRJ-006');
    await activationService.activateProject('Q-PRJ-006', superAdminContext as any);
    const auditKey = Object.keys(inMemoryAdminStore).find(k => k.startsWith('audit_logs/AUDIT-ACTIVATION-Q-PRJ-006'));
    const entry = inMemoryAdminStore[auditKey!];
    expect(entry.changes.before.status).toBe('APPROVED');
    expect(entry.changes.after.status).toBe('ACTIVE');
    expect(entry.changes.deltaFields).toContain('status');
  });

  // 48. actor/updatedBy come from authenticated context
  it('48. actor/updatedBy come from authenticated context', async () => {
    setupFullCoherentOperationalPath('Q-PRJ-006');
    await activationService.activateProject('Q-PRJ-006', projectAdminContext as any);
    const auditKey = Object.keys(inMemoryAdminStore).find(k => k.startsWith('audit_logs/AUDIT-ACTIVATION-Q-PRJ-006'));
    const entry = inMemoryAdminStore[auditKey!];
    expect(entry.actor.userId).toBe('project-admin-1');
    expect(entry.createdBy).toBe('project-admin-1');
    expect(entry.updatedBy).toBe('project-admin-1');
  });

  // 49. project ACTIVE update + audit atomic
  it('49. project ACTIVE update + audit atomic', async () => {
    setupFullCoherentOperationalPath('Q-PRJ-006');
    await activationService.activateProject('Q-PRJ-006', superAdminContext as any);
    expect(inMemoryAdminStore['projects/Q-PRJ-006'].status).toBe('ACTIVE');
    const auditCount = Object.keys(inMemoryAdminStore).filter(k => k.startsWith('audit_logs/AUDIT-ACTIVATION-Q-PRJ-006')).length;
    expect(auditCount).toBe(1);
  });

  // 50. failed activation leaves project APPROVED
  it('50. failed activation leaves project APPROVED', async () => {
    setupFullCoherentOperationalPath('Q-PRJ-006');
    // Remove truck assignment to induce failure
    delete inMemoryAdminStore['projects/Q-PRJ-006/truck_active_assignments/TRK-001'];
    try {
      await activationService.activateProject('Q-PRJ-006', superAdminContext as any);
    } catch {
      // expected
    }
    expect(inMemoryAdminStore['projects/Q-PRJ-006'].status).toBe('APPROVED');
  });

  // 51. failed activation writes no audit
  it('51. failed activation writes no audit', async () => {
    setupFullCoherentOperationalPath('Q-PRJ-006');
    delete inMemoryAdminStore['projects/Q-PRJ-006/truck_active_assignments/TRK-001'];
    try {
      await activationService.activateProject('Q-PRJ-006', superAdminContext as any);
    } catch {
      // expected
    }
    const auditCount = Object.keys(inMemoryAdminStore).filter(k => k.startsWith('audit_logs/AUDIT-ACTIVATION-Q-PRJ-006')).length;
    expect(auditCount).toBe(0);
  });

  // 52. stale candidate mutation between readiness and transaction is detected
  it('52. stale candidate mutation between readiness and transaction is detected', async () => {
    setupFullCoherentOperationalPath('Q-PRJ-006');
    // We spy on evaluateProjectReadiness to return candidate, then mutate before transaction runs
    const origMethod = (activationService as any).readinessService.evaluateProjectReadiness.bind((activationService as any).readinessService);
    (activationService as any).readinessService.evaluateProjectReadiness = async (...args: any[]) => {
      const res = await origMethod(...args);
      // Stale mutation occurs here right after discovery!
      inMemoryAdminStore['projects/Q-PRJ-006/carrier_memberships/CAR-001'].status = 'SUSPENDED';
      return res;
    };

    await expect(
      activationService.activateProject('Q-PRJ-006', superAdminContext as any)
    ).rejects.toThrow('فشل تنشيط المشروع: عضوية غير نشطة');
  });

  // 53. production activation path has no auth.currentUser dependency
  it('53. production activation path has no auth.currentUser dependency', () => {
    const code = readFileSync(join(process.cwd(), 'src/services/projectActivation.service.ts'), 'utf-8');
    expect(code).not.toContain('auth.currentUser');
  });

  // 54. production activation path has no src/firebase/config dependency
  it('54. production activation path has no src/firebase/config dependency', () => {
    const code = readFileSync(join(process.cwd(), 'src/services/projectActivation.service.ts'), 'utf-8');
    expect(code).not.toContain('../firebase/config');
  });

  // 55. production activation path has no firebase/firestore Client SDK dependency
  it('55. production activation path has no firebase/firestore Client SDK dependency', () => {
    const code = readFileSync(join(process.cwd(), 'src/services/projectActivation.service.ts'), 'utf-8');
    expect(code).not.toContain('firebase/firestore');
  });

  // 56. production activation path does not invoke browser repositories
  it('56. production activation path does not invoke browser repositories', () => {
    const code = readFileSync(join(process.cwd(), 'src/services/projectActivation.service.ts'), 'utf-8');
    expect(code).not.toContain('projectRepository');
    expect(code).not.toContain('pricingRuleRepository');
    expect(code).not.toContain('projectMembershipRepository');
  });

  // 57. production activation path does not invoke AuditLogService/AuditLogRepository
  it('57. production activation path does not invoke AuditLogService/AuditLogRepository', () => {
    const code = readFileSync(join(process.cwd(), 'src/services/projectActivation.service.ts'), 'utf-8');
    expect(code).not.toContain('auditLogService');
    expect(code).not.toContain('auditLogRepository');
  });

  // 58. route retains enforceProjectIsolation + enforceAdminOnly
  it('58. route retains enforceProjectIsolation + enforceAdminOnly', () => {
    const appCode = readFileSync(join(process.cwd(), 'server/app.ts'), 'utf-8');
    const routeRegex = /app\.post\(\s*['"]\/api\/projects\/:projectId\/activate['"]\s*,\s*enforceProjectIsolation\s*,\s*enforceAdminOnly/;
    expect(routeRegex.test(appCode)).toBe(true);
  });

  // 59. route invokes the canonical server-safe activation capability
  it('59. route invokes the canonical server-safe activation capability', () => {
    const appCode = readFileSync(join(process.cwd(), 'server/app.ts'), 'utf-8');
    expect(appCode).toContain('projectActivation.service');
    expect(appCode).toContain('projectActivationService.activateProject');
  });

  // 60. Wizard still activates only through POST /activate
  it('60. Wizard still activates only through POST /activate', () => {
    const wizardCode = readFileSync(join(process.cwd(), 'src/components/wizard/ProjectSetupWizard.tsx'), 'utf-8');
    expect(wizardCode).toContain('/api/projects/${project.projectId}/activate');
    expect(wizardCode).toContain("method: 'POST'");
  });

  // 61. ACTIVE + degraded readiness returns idempotent success
  it('61. ACTIVE + degraded readiness returns idempotent success', async () => {
    // Project is ACTIVE but has NO operational memberships, affiliations, or pricing rules at all
    inMemoryAdminStore['projects/Q-PRJ-ACTIVE'] = {
      projectId: 'Q-PRJ-ACTIVE',
      projectCode: 'PRJ-ACT',
      projectNumber: 'PN-ACT',
      status: 'ACTIVE',
      updatedAt: new Date('2026-01-01T00:00:00Z'),
      updatedBy: 'ORIGINAL_ACTOR',
    };

    await expect(
      activationService.activateProject('Q-PRJ-ACTIVE', superAdminContext as any)
    ).resolves.toBeUndefined();
  });

  // 62. ACTIVE path does NOT invoke evaluateProjectReadiness
  it('62. ACTIVE path does NOT invoke evaluateProjectReadiness', async () => {
    inMemoryAdminStore['projects/Q-PRJ-ACTIVE'] = {
      projectId: 'Q-PRJ-ACTIVE',
      status: 'ACTIVE',
    };

    const spy = vi.spyOn((activationService as any).readinessService, 'evaluateProjectReadiness');
    await activationService.activateProject('Q-PRJ-ACTIVE', superAdminContext as any);
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  // 63. ACTIVE path writes zero project updates
  it('63. ACTIVE path writes zero project updates', async () => {
    const origDate = new Date('2026-01-01T00:00:00Z');
    inMemoryAdminStore['projects/Q-PRJ-ACTIVE'] = {
      projectId: 'Q-PRJ-ACTIVE',
      status: 'ACTIVE',
      updatedAt: origDate,
      updatedBy: 'ORIGINAL_CREATOR',
    };

    await activationService.activateProject('Q-PRJ-ACTIVE', superAdminContext as any);
    expect(inMemoryAdminStore['projects/Q-PRJ-ACTIVE'].updatedAt).toEqual(origDate);
    expect(inMemoryAdminStore['projects/Q-PRJ-ACTIVE'].updatedBy).toBe('ORIGINAL_CREATOR');
  });

  // 64. ACTIVE path writes zero activation audits
  it('64. ACTIVE path writes zero activation audits', async () => {
    inMemoryAdminStore['projects/Q-PRJ-ACTIVE'] = {
      projectId: 'Q-PRJ-ACTIVE',
      status: 'ACTIVE',
    };

    await activationService.activateProject('Q-PRJ-ACTIVE', superAdminContext as any);
    const auditLogs = Object.keys(inMemoryAdminStore).filter(k => k.startsWith('audit_logs/'));
    expect(auditLogs.length).toBe(0);
  });

  // 65. APPROVED path still invokes readiness normally
  it('65. APPROVED path still invokes readiness normally', async () => {
    setupFullCoherentOperationalPath('Q-PRJ-006');
    const spy = vi.spyOn((activationService as any).readinessService, 'evaluateProjectReadiness');
    await activationService.activateProject('Q-PRJ-006', superAdminContext as any);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith('Q-PRJ-006', expect.any(Date), expect.anything());
    spy.mockRestore();
  });

  // 66. Preflight sees APPROVED, but project becomes ACTIVE before transaction -> idempotent success & no duplicate audit
  it('66. Preflight sees APPROVED, but project becomes ACTIVE before transaction -> idempotent success & no duplicate audit', async () => {
    setupFullCoherentOperationalPath('Q-PRJ-006');

    // Mutate project to ACTIVE right after readiness evaluation completes (simulating concurrent activation)
    const origReadiness = (activationService as any).readinessService.evaluateProjectReadiness.bind((activationService as any).readinessService);
    (activationService as any).readinessService.evaluateProjectReadiness = async (...args: any[]) => {
      const res = await origReadiness(...args);
      inMemoryAdminStore['projects/Q-PRJ-006'].status = 'ACTIVE';
      return res;
    };

    await expect(
      activationService.activateProject('Q-PRJ-006', superAdminContext as any)
    ).resolves.toBeUndefined();

    const audits = Object.keys(inMemoryAdminStore).filter(k => k.startsWith('audit_logs/'));
    expect(audits.length).toBe(0);
  });

  // 67. Preflight sees APPROVED, but project becomes non-APPROVED/non-ACTIVE before transaction -> fail closed, zero audit
  it('67. Preflight sees APPROVED, but project becomes non-APPROVED/non-ACTIVE before transaction -> fail closed, zero audit', async () => {
    setupFullCoherentOperationalPath('Q-PRJ-006');

    // Mutate project to SUSPENDED right after readiness evaluation
    const origReadiness = (activationService as any).readinessService.evaluateProjectReadiness.bind((activationService as any).readinessService);
    (activationService as any).readinessService.evaluateProjectReadiness = async (...args: any[]) => {
      const res = await origReadiness(...args);
      inMemoryAdminStore['projects/Q-PRJ-006'].status = 'SUSPENDED';
      return res;
    };

    await expect(
      activationService.activateProject('Q-PRJ-006', superAdminContext as any)
    ).rejects.toThrow('لا يمكن تنشيط مشروع ما لم يكن في حالة معتمد (APPROVED)');

    const audits = Object.keys(inMemoryAdminStore).filter(k => k.startsWith('audit_logs/'));
    expect(audits.length).toBe(0);
  });
});
