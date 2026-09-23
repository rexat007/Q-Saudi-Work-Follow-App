import { describe, it, expect, beforeEach } from 'vitest';
import { createInMemoryAdminDb, setTestDbOverride, inMemoryAdminStore } from '../firebase/admin';
import { projectPricingServerService } from '../services/projectPricing.server';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Project Pricing Server Authority Test Suite', () => {
  const adminContext = {
    userId: 'admin-1',
    email: 'admin@q-saudi.com',
    role: 'PROJECT_ADMIN' as const,
  };

  const auditorContext = {
    userId: 'auditor-1',
    email: 'auditor@q-saudi.com',
    role: 'FINANCE_AUDITOR' as const,
  };

  const superAdminContext = {
    userId: 'super-1',
    email: 'super@q-saudi.com',
    role: 'SUPER_ADMIN' as const,
  };

  beforeEach(() => {
    for (const key of Object.keys(inMemoryAdminStore)) {
      delete inMemoryAdminStore[key];
    }
    const testDb = createInMemoryAdminDb({});
    setTestDbOverride(testDb);

    // Seed baseline project
    inMemoryAdminStore['projects/Q-PRJ-006'] = { projectId: 'Q-PRJ-006', nameAr: 'مشروع الاختبار' };
  });

  // Original Baseline Tests (Preserved)
  it('Creates a pricing rule server-side when authorized', async () => {
    inMemoryAdminStore['projects/Q-PRJ-006/carrier_memberships/CAR-1'] = { carrierId: 'CAR-1', status: 'ACTIVE' };
    inMemoryAdminStore['projects/Q-PRJ-006/material_memberships/MAT-1'] = { materialId: 'MAT-1', status: 'ACTIVE' };

    const payload = {
      pricingRuleId: 'PR-1',
      name: 'تعرفة 1',
      pricingModel: 'PER_TON',
      baseRateSAR: 100,
      carrierId: 'CAR-1',
      materialId: 'MAT-1',
      effectiveFrom: '2026-01-01',
      currency: 'SAR',
    };

    const result = await projectPricingServerService.createPricingRule('Q-PRJ-006', payload, adminContext as any);

    expect(result.pricingRuleId).toBe('PR-1');
    expect(inMemoryAdminStore['projects/Q-PRJ-006/pricing_rules/PR-1']).toBeDefined();
  });

  it('Fails creation if unauthorized', async () => {
    await expect(
      projectPricingServerService.createPricingRule('Q-PRJ-006', {}, { userId: 'user-1', role: 'DRIVER' } as any)
    ).rejects.toThrow('غير مصرح لك بإنشاء أو تعديل قواعد التسعير');
  });

  it('Fails creation if rule overlaps', async () => {
    inMemoryAdminStore['projects/Q-PRJ-006/carrier_memberships/CAR-1'] = { carrierId: 'CAR-1', status: 'ACTIVE' };
    inMemoryAdminStore['projects/Q-PRJ-006/material_memberships/MAT-1'] = { materialId: 'MAT-1', status: 'ACTIVE' };

    inMemoryAdminStore['projects/Q-PRJ-006/pricing_rules/PR-1'] = {
      pricingRuleId: 'PR-1',
      projectId: 'Q-PRJ-006',
      carrierId: 'CAR-1',
      materialId: 'MAT-1',
      name: 'تعرفة قديمة',
      pricingModel: 'PER_TON',
      baseRateSAR: 100,
      effectiveFrom: '2026-01-01',
      effectiveTo: '2026-12-31',
      status: 'ACTIVE',
      isActive: true,
    };

    const payload = {
      pricingRuleId: 'PR-2',
      name: 'تعرفة 2',
      pricingModel: 'PER_TON',
      baseRateSAR: 100,
      carrierId: 'CAR-1',
      materialId: 'MAT-1',
      effectiveFrom: '2026-06-01',
      currency: 'SAR',
    };

    await expect(
      projectPricingServerService.createPricingRule('Q-PRJ-006', payload, adminContext as any)
    ).rejects.toThrow('يوجد تداخل زمني مع قاعدة تسعير سارية');
  });

  // Expanded Coverage Contract Tests
  it('1. ACTIVE carrier membership accepted', async () => {
    inMemoryAdminStore['projects/Q-PRJ-006/carrier_memberships/CAR-ACTIVE'] = { carrierId: 'CAR-ACTIVE', status: 'ACTIVE' };
    const payload = {
      pricingRuleId: 'PR-ACTIVE-CAR',
      carrierId: 'CAR-ACTIVE',
      pricingModel: 'PER_TON',
      baseRateSAR: 50,
      effectiveFrom: '2026-01-01',
    };
    const res = await projectPricingServerService.createPricingRule('Q-PRJ-006', payload, adminContext as any);
    expect(res.pricingRuleId).toBe('PR-ACTIVE-CAR');
    expect(res.carrierId).toBe('CAR-ACTIVE');
  });

  it('2. missing carrier membership rejected', async () => {
    const payload = {
      pricingRuleId: 'PR-MISSING-CAR',
      carrierId: 'CAR-NON-EXISTENT',
      pricingModel: 'PER_TON',
      baseRateSAR: 50,
      effectiveFrom: '2026-01-01',
    };
    await expect(
      projectPricingServerService.createPricingRule('Q-PRJ-006', payload, adminContext as any)
    ).rejects.toThrow('الناقل غير موجود في المشروع أو غير نشط');
  });

  it('3. SUSPENDED carrier membership rejected', async () => {
    inMemoryAdminStore['projects/Q-PRJ-006/carrier_memberships/CAR-SUSP'] = { carrierId: 'CAR-SUSP', status: 'SUSPENDED' };
    const payload = {
      pricingRuleId: 'PR-SUSP-CAR',
      carrierId: 'CAR-SUSP',
      pricingModel: 'PER_TON',
      baseRateSAR: 50,
      effectiveFrom: '2026-01-01',
    };
    await expect(
      projectPricingServerService.createPricingRule('Q-PRJ-006', payload, adminContext as any)
    ).rejects.toThrow('الناقل غير موجود في المشروع أو غير نشط');
  });

  it('4. REMOVED carrier membership rejected', async () => {
    inMemoryAdminStore['projects/Q-PRJ-006/carrier_memberships/CAR-REM'] = { carrierId: 'CAR-REM', status: 'REMOVED' };
    const payload = {
      pricingRuleId: 'PR-REM-CAR',
      carrierId: 'CAR-REM',
      pricingModel: 'PER_TON',
      baseRateSAR: 50,
      effectiveFrom: '2026-01-01',
    };
    await expect(
      projectPricingServerService.createPricingRule('Q-PRJ-006', payload, adminContext as any)
    ).rejects.toThrow('الناقل غير موجود في المشروع أو غير نشط');
  });

  it('5. ACTIVE material membership accepted', async () => {
    inMemoryAdminStore['projects/Q-PRJ-006/carrier_memberships/CAR-1'] = { carrierId: 'CAR-1', status: 'ACTIVE' };
    inMemoryAdminStore['projects/Q-PRJ-006/material_memberships/MAT-ACTIVE'] = { materialId: 'MAT-ACTIVE', status: 'ACTIVE' };
    const payload = {
      pricingRuleId: 'PR-MAT-ACTIVE',
      carrierId: 'CAR-1',
      materialId: 'MAT-ACTIVE',
      pricingModel: 'PER_TRIP',
      baseRateSAR: 150,
      effectiveFrom: '2026-01-01',
    };
    const res = await projectPricingServerService.createPricingRule('Q-PRJ-006', payload, adminContext as any);
    expect(res.materialId).toBe('MAT-ACTIVE');
  });

  it('6. missing material membership rejected', async () => {
    inMemoryAdminStore['projects/Q-PRJ-006/carrier_memberships/CAR-1'] = { carrierId: 'CAR-1', status: 'ACTIVE' };
    const payload = {
      pricingRuleId: 'PR-MAT-MISS',
      carrierId: 'CAR-1',
      materialId: 'MAT-GHOST',
      pricingModel: 'PER_TRIP',
      baseRateSAR: 150,
      effectiveFrom: '2026-01-01',
    };
    await expect(
      projectPricingServerService.createPricingRule('Q-PRJ-006', payload, adminContext as any)
    ).rejects.toThrow('المادة غير موجودة في المشروع أو غير نشطة');
  });

  it('7. non-ACTIVE material membership rejected', async () => {
    inMemoryAdminStore['projects/Q-PRJ-006/carrier_memberships/CAR-1'] = { carrierId: 'CAR-1', status: 'ACTIVE' };
    inMemoryAdminStore['projects/Q-PRJ-006/material_memberships/MAT-INACT'] = { materialId: 'MAT-INACT', status: 'INACTIVE' };
    const payload = {
      pricingRuleId: 'PR-MAT-INACT',
      carrierId: 'CAR-1',
      materialId: 'MAT-INACT',
      pricingModel: 'PER_TRIP',
      baseRateSAR: 150,
      effectiveFrom: '2026-01-01',
    };
    await expect(
      projectPricingServerService.createPricingRule('Q-PRJ-006', payload, adminContext as any)
    ).rejects.toThrow('المادة غير موجودة في المشروع أو غير نشطة');
  });

  it('8. PricingRuleValidator enforced', async () => {
    inMemoryAdminStore['projects/Q-PRJ-006/carrier_memberships/CAR-1'] = { carrierId: 'CAR-1', status: 'ACTIVE' };
    // Missing carrierId
    await expect(
      projectPricingServerService.createPricingRule('Q-PRJ-006', {
        pricingRuleId: 'PR-INV-1',
        pricingModel: 'PER_TON',
        baseRateSAR: 100,
        effectiveFrom: '2026-01-01',
      }, adminContext as any)
    ).rejects.toThrow('خطأ في مصفوفة التسعير');
  });

  it('9. baseRateSAR <= 0 rejected', async () => {
    inMemoryAdminStore['projects/Q-PRJ-006/carrier_memberships/CAR-1'] = { carrierId: 'CAR-1', status: 'ACTIVE' };
    await expect(
      projectPricingServerService.createPricingRule('Q-PRJ-006', {
        pricingRuleId: 'PR-ZERO-RATE',
        carrierId: 'CAR-1',
        pricingModel: 'PER_TON',
        baseRateSAR: 0,
        effectiveFrom: '2026-01-01',
      }, adminContext as any)
    ).rejects.toThrow('خطأ في مصفوفة التسعير');

    await expect(
      projectPricingServerService.createPricingRule('Q-PRJ-006', {
        pricingRuleId: 'PR-NEG-RATE',
        carrierId: 'CAR-1',
        pricingModel: 'PER_TON',
        baseRateSAR: -50,
        effectiveFrom: '2026-01-01',
      }, adminContext as any)
    ).rejects.toThrow('خطأ في مصفوفة التسعير');
  });

  it('10. invalid date range rejected', async () => {
    inMemoryAdminStore['projects/Q-PRJ-006/carrier_memberships/CAR-1'] = { carrierId: 'CAR-1', status: 'ACTIVE' };
    await expect(
      projectPricingServerService.createPricingRule('Q-PRJ-006', {
        pricingRuleId: 'PR-DATE-INV',
        carrierId: 'CAR-1',
        pricingModel: 'PER_TON',
        baseRateSAR: 100,
        effectiveFrom: '2026-12-31',
        effectiveTo: '2026-01-01',
      }, adminContext as any)
    ).rejects.toThrow('تاريخ نهاية السريان يجب أن يكون لاحقًا لتاريخ البداية');
  });

  it('11. canonical overlap rejected', async () => {
    inMemoryAdminStore['projects/Q-PRJ-006/carrier_memberships/CAR-1'] = { carrierId: 'CAR-1', status: 'ACTIVE' };
    inMemoryAdminStore['projects/Q-PRJ-006/pricing_rules/PR-EXISTING'] = {
      pricingRuleId: 'PR-EXISTING',
      projectId: 'Q-PRJ-006',
      carrierId: 'CAR-1',
      pricingModel: 'PER_TON',
      baseRateSAR: 90,
      effectiveFrom: '2026-01-01',
      effectiveTo: '2026-06-30',
      status: 'ACTIVE',
      isActive: true,
    };

    const payload = {
      pricingRuleId: 'PR-OVERLAP',
      carrierId: 'CAR-1',
      pricingModel: 'PER_TON',
      baseRateSAR: 95,
      effectiveFrom: '2026-05-01',
      effectiveTo: '2026-10-31',
    };

    await expect(
      projectPricingServerService.createPricingRule('Q-PRJ-006', payload, auditorContext as any)
    ).rejects.toThrow('يوجد تداخل زمني مع قاعدة تسعير سارية');
  });

  it('12. non-overlap accepted', async () => {
    inMemoryAdminStore['projects/Q-PRJ-006/carrier_memberships/CAR-1'] = { carrierId: 'CAR-1', status: 'ACTIVE' };
    inMemoryAdminStore['projects/Q-PRJ-006/pricing_rules/PR-PERIOD-1'] = {
      pricingRuleId: 'PR-PERIOD-1',
      projectId: 'Q-PRJ-006',
      carrierId: 'CAR-1',
      pricingModel: 'PER_TON',
      baseRateSAR: 90,
      effectiveFrom: '2026-01-01',
      effectiveTo: '2026-05-31',
      status: 'ACTIVE',
      isActive: true,
    };

    const payload = {
      pricingRuleId: 'PR-PERIOD-2',
      carrierId: 'CAR-1',
      pricingModel: 'PER_TON',
      baseRateSAR: 95,
      effectiveFrom: '2026-06-01',
      effectiveTo: '2026-12-31',
    };

    const res = await projectPricingServerService.createPricingRule('Q-PRJ-006', payload, superAdminContext as any);
    expect(res.pricingRuleId).toBe('PR-PERIOD-2');
    expect(inMemoryAdminStore['projects/Q-PRJ-006/pricing_rules/PR-PERIOD-2']).toBeDefined();
  });

  it('13. pricingRuleId collision rejected', async () => {
    inMemoryAdminStore['projects/Q-PRJ-006/carrier_memberships/CAR-1'] = { carrierId: 'CAR-1', status: 'ACTIVE' };
    inMemoryAdminStore['projects/Q-PRJ-006/pricing_rules/PR-COLLIDE'] = {
      pricingRuleId: 'PR-COLLIDE',
      projectId: 'Q-PRJ-006',
      carrierId: 'CAR-1',
      name: 'Original Rule',
      baseRateSAR: 100,
      status: 'ACTIVE',
      isActive: true,
    };

    const payload = {
      pricingRuleId: 'PR-COLLIDE',
      carrierId: 'CAR-1',
      pricingModel: 'PER_TON',
      baseRateSAR: 200,
      effectiveFrom: '2027-01-01',
    };

    await expect(
      projectPricingServerService.createPricingRule('Q-PRJ-006', payload, adminContext as any)
    ).rejects.toThrow('معرّف قاعدة التسعير موجود مسبقًا');
  });

  it('14. existing rule never overwritten', async () => {
    inMemoryAdminStore['projects/Q-PRJ-006/carrier_memberships/CAR-1'] = { carrierId: 'CAR-1', status: 'ACTIVE' };
    const originalDoc = {
      pricingRuleId: 'PR-SAFE',
      projectId: 'Q-PRJ-006',
      carrierId: 'CAR-1',
      name: 'Do Not Overwrite Me',
      baseRateSAR: 777,
      status: 'ACTIVE',
      isActive: true,
    };
    inMemoryAdminStore['projects/Q-PRJ-006/pricing_rules/PR-SAFE'] = { ...originalDoc };

    try {
      await projectPricingServerService.createPricingRule('Q-PRJ-006', {
        pricingRuleId: 'PR-SAFE',
        carrierId: 'CAR-1',
        pricingModel: 'PER_TON',
        baseRateSAR: 999,
        effectiveFrom: '2027-01-01',
      }, adminContext as any);
    } catch {
      // Expected to fail
    }

    expect(inMemoryAdminStore['projects/Q-PRJ-006/pricing_rules/PR-SAFE'].name).toBe('Do Not Overwrite Me');
    expect(inMemoryAdminStore['projects/Q-PRJ-006/pricing_rules/PR-SAFE'].baseRateSAR).toBe(777);
  });

  it('15. stored PricingRule uses canonical PricingRuleEntity field names', async () => {
    inMemoryAdminStore['projects/Q-PRJ-006/carrier_memberships/CAR-1'] = { carrierId: 'CAR-1', status: 'ACTIVE' };
    const payload = {
      pricingRuleId: 'PR-CANONICAL-FIELDS',
      carrierId: 'CAR-1',
      name: 'اتفاقية تسعير كانونيكال',
      pricingModel: 'PER_TON',
      baseRateSAR: 85,
      currency: 'SAR',
      effectiveFrom: '2026-03-01',
      effectiveTo: '2026-09-01',
      notes: 'ملاحظة تدقيق',
      minimumBillableWeightKg: 1000,
      demurrageRatePerHourSAR: 45,
      freeTimeHours: 3,
      vatApplicable: true,
    };

    await projectPricingServerService.createPricingRule('Q-PRJ-006', payload, adminContext as any);
    const stored = inMemoryAdminStore['projects/Q-PRJ-006/pricing_rules/PR-CANONICAL-FIELDS'];

    expect(stored).toBeDefined();
    expect(stored.pricingRuleId).toBe('PR-CANONICAL-FIELDS');
    expect(stored.projectId).toBe('Q-PRJ-006');
    expect(stored.carrierId).toBe('CAR-1');
    expect(stored.name).toBe('اتفاقية تسعير كانونيكال');
    expect(stored.pricingModel).toBe('PER_TON');
    expect(stored.baseRateSAR).toBe(85);
    expect(stored.currency).toBe('SAR');
    expect(stored.effectiveFrom).toBe('2026-03-01');
    expect(stored.effectiveTo).toBe('2026-09-01');
    expect(stored.notes).toBe('ملاحظة تدقيق');
    expect(stored.minimumBillableWeightKg).toBe(1000);
    expect(stored.demurrageRatePerHourSAR).toBe(45);
    expect(stored.freeTimeHours).toBe(3);
    expect(stored.vatApplicable).toBe(true);
    expect(stored.status).toBe('ACTIVE');
    expect(stored.isActive).toBe(true);
    expect(stored.createdAt).toBeDefined();
    expect(stored.createdBy).toBe('admin-1');
    expect(stored.updatedAt).toBeDefined();
    expect(stored.updatedBy).toBe('admin-1');
  });

  it('16. alternate ruleType/value/effectiveDate/endDate schema is NOT used', async () => {
    inMemoryAdminStore['projects/Q-PRJ-006/carrier_memberships/CAR-1'] = { carrierId: 'CAR-1', status: 'ACTIVE' };
    const payload = {
      pricingRuleId: 'PR-NO-ALTERNATE',
      carrierId: 'CAR-1',
      pricingModel: 'PER_TON',
      baseRateSAR: 120,
      effectiveFrom: '2026-01-01',
      ruleType: 'LEGACY_TIER',
      value: 9999,
      effectiveDate: '2026-01-01',
      endDate: '2026-12-31',
    };

    await projectPricingServerService.createPricingRule('Q-PRJ-006', payload, adminContext as any);
    const stored = inMemoryAdminStore['projects/Q-PRJ-006/pricing_rules/PR-NO-ALTERNATE'];

    expect(stored.ruleType).toBeUndefined();
    expect(stored.value).toBeUndefined();
    expect(stored.effectiveDate).toBeUndefined();
    expect(stored.endDate).toBeUndefined();
  });

  it('17. no undefined values reach Firestore', async () => {
    inMemoryAdminStore['projects/Q-PRJ-006/carrier_memberships/CAR-1'] = { carrierId: 'CAR-1', status: 'ACTIVE' };
    const payload = {
      pricingRuleId: 'PR-NO-UNDEFINED',
      carrierId: 'CAR-1',
      pricingModel: 'PER_TRIP',
      baseRateSAR: 200,
      effectiveFrom: '2026-01-01',
      materialId: undefined,
      effectiveTo: undefined,
      notes: undefined,
      minimumBillableWeightKg: undefined,
    };

    await projectPricingServerService.createPricingRule('Q-PRJ-006', payload, adminContext as any);
    const stored = inMemoryAdminStore['projects/Q-PRJ-006/pricing_rules/PR-NO-UNDEFINED'];

    for (const [k, v] of Object.entries(stored)) {
      expect(v, `Field ${k} was undefined`).not.toBeUndefined();
    }
  });

  it('18. createdBy/updatedBy come from authenticated server user', async () => {
    inMemoryAdminStore['projects/Q-PRJ-006/carrier_memberships/CAR-1'] = { carrierId: 'CAR-1', status: 'ACTIVE' };
    const payload = {
      pricingRuleId: 'PR-AUTH-USER',
      carrierId: 'CAR-1',
      pricingModel: 'PER_TON',
      baseRateSAR: 110,
      effectiveFrom: '2026-01-01',
      createdBy: 'malicious-spoof',
      updatedBy: 'malicious-spoof',
    };

    const res = await projectPricingServerService.createPricingRule('Q-PRJ-006', payload, auditorContext as any);
    expect(res.createdBy).toBe('auditor-1');
    expect(res.updatedBy).toBe('auditor-1');

    const stored = inMemoryAdminStore['projects/Q-PRJ-006/pricing_rules/PR-AUTH-USER'];
    expect(stored.createdBy).toBe('auditor-1');
    expect(stored.updatedBy).toBe('auditor-1');
  });

  it('19. URL projectId is authoritative', async () => {
    inMemoryAdminStore['projects/URL-PRJ-AUTHORITATIVE'] = { projectId: 'URL-PRJ-AUTHORITATIVE' };
    inMemoryAdminStore['projects/URL-PRJ-AUTHORITATIVE/carrier_memberships/CAR-1'] = { carrierId: 'CAR-1', status: 'ACTIVE' };

    const payload = {
      pricingRuleId: 'PR-AUTH-PROJECT',
      projectId: 'ATTACKER-PROJECT-MISMATCH',
      carrierId: 'CAR-1',
      pricingModel: 'PER_TON',
      baseRateSAR: 100,
      effectiveFrom: '2026-01-01',
    };

    const res = await projectPricingServerService.createPricingRule('URL-PRJ-AUTHORITATIVE', payload, adminContext as any);
    expect(res.projectId).toBe('URL-PRJ-AUTHORITATIVE');
    expect(inMemoryAdminStore['projects/URL-PRJ-AUTHORITATIVE/pricing_rules/PR-AUTH-PROJECT']).toBeDefined();
    expect(inMemoryAdminStore['projects/ATTACKER-PROJECT-MISMATCH/pricing_rules/PR-AUTH-PROJECT']).toBeUndefined();
  });

  it('20. canonical AuditLogEntity CREATE record is written', async () => {
    inMemoryAdminStore['projects/Q-PRJ-006/carrier_memberships/CAR-1'] = { carrierId: 'CAR-1', status: 'ACTIVE' };
    const payload = {
      pricingRuleId: 'PR-AUDIT-TEST',
      carrierId: 'CAR-1',
      pricingModel: 'PER_TON',
      baseRateSAR: 125,
      effectiveFrom: '2026-01-01',
    };

    await projectPricingServerService.createPricingRule('Q-PRJ-006', payload, adminContext as any);

    // Find audit log
    const auditKey = Object.keys(inMemoryAdminStore).find(k => k.startsWith('audit_logs/AUDIT-PRICING-PR-AUDIT-TEST'));
    expect(auditKey).toBeDefined();

    const auditEntry = inMemoryAdminStore[auditKey!];
    expect(auditEntry.entityType).toBe('PRICING_RULE');
    expect(auditEntry.action).toBe('CREATE');
    expect(auditEntry.entityId).toBe('PR-AUDIT-TEST');
    expect(auditEntry.projectId).toBe('Q-PRJ-006');
    expect(auditEntry.actor.userId).toBe('admin-1');
    expect(auditEntry.actor.role).toBe('PROJECT_ADMIN');
    expect(auditEntry.changes.before).toBeNull();
    expect(auditEntry.changes.after.pricingRuleId).toBe('PR-AUDIT-TEST');
    expect(Array.isArray(auditEntry.changes.deltaFields)).toBe(true);
    expect(auditEntry.correlationId).toBeDefined();
    expect(auditEntry.createdBy).toBe('admin-1');
    expect(auditEntry.updatedBy).toBe('admin-1');
  });

  it('21. pricing + audit are atomic', async () => {
    inMemoryAdminStore['projects/Q-PRJ-006/carrier_memberships/CAR-1'] = { carrierId: 'CAR-1', status: 'ACTIVE' };
    inMemoryAdminStore['projects/Q-PRJ-006/pricing_rules/PR-EXISTING-COLLISION'] = {
      pricingRuleId: 'PR-EXISTING-COLLISION',
      projectId: 'Q-PRJ-006',
      carrierId: 'CAR-1',
      status: 'ACTIVE',
    };

    // Attempt collision
    try {
      await projectPricingServerService.createPricingRule('Q-PRJ-006', {
        pricingRuleId: 'PR-EXISTING-COLLISION',
        carrierId: 'CAR-1',
        pricingModel: 'PER_TON',
        baseRateSAR: 150,
        effectiveFrom: '2026-01-01',
      }, adminContext as any);
    } catch {
      // Expected collision
    }

    // Verify NO orphaned audit log was written
    const orphanAudit = Object.keys(inMemoryAdminStore).find(k => k.includes('PR-EXISTING-COLLISION') && k.startsWith('audit_logs/'));
    expect(orphanAudit).toBeUndefined();
  });

  it('22. Wizard uses POST endpoint', () => {
    const wizardContent = readFileSync(join(process.cwd(), 'src/components/wizard/ProjectSetupWizard.tsx'), 'utf-8');
    expect(wizardContent).toContain('/api/projects/${project.projectId}/pricing-rules');
    expect(wizardContent).toContain("method: 'POST'");
    // Verify it does NOT call browser repository create
    expect(wizardContent).not.toMatch(/pricingRuleRepository\s*\.\s*create\s*\(/);
  });

  it('23. Workspace uses same POST endpoint', () => {
    const workspaceContent = readFileSync(join(process.cwd(), 'src/components/workspace/ProjectWorkspaceView.tsx'), 'utf-8');
    expect(workspaceContent).toContain('/api/projects/${project.projectId}/pricing-rules');
    expect(workspaceContent).toContain("method: 'POST'");
    // Verify it does NOT call browser repository create
    expect(workspaceContent).not.toMatch(/pricingRuleRepository\s*\.\s*create\s*\(/);
  });

  it('24. production mutation path has no auth.currentUser/browser repository dependency', () => {
    const serverServiceContent = readFileSync(join(process.cwd(), 'src/services/projectPricing.server.ts'), 'utf-8');
    expect(serverServiceContent).not.toContain('auth.currentUser');
    expect(serverServiceContent).not.toContain('pricingRuleRepository');
    expect(serverServiceContent).not.toContain('../firebase/config');
  });

  it('25. route retains enforceProjectIsolation + enforceAuditorOrAdmin', () => {
    const appContent = readFileSync(join(process.cwd(), 'server/app.ts'), 'utf-8');
    const pricingRouteRegex = /app\.post\(\s*['"]\/api\/projects\/:projectId\/pricing-rules['"]\s*,\s*enforceProjectIsolation\s*,\s*enforceAuditorOrAdmin/;
    expect(pricingRouteRegex.test(appContent)).toBe(true);
  });
});
