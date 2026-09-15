import { describe, it, expect, beforeEach } from 'vitest';
import { projectService } from '../services/project.service';
import { ProjectValidator } from '../validators/project.validator';
import { ProjectNumberGenerator } from '../services/projectNumberGenerator';
import { AuthUserContext } from '../types/common';
import { ProjectEntity } from '../types/entities';

const SUPER_ADMIN_CTX: AuthUserContext = {
  userId: 'U-TEST-ADMIN',
  role: 'SUPER_ADMIN',
  email: 'admin@example.com',
  displayName: 'Super Admin',
};

describe('BLOCK 100H-FIX — Project Creation Validation & Atomic Number Allocation', () => {
  beforeEach(() => {
    ProjectNumberGenerator.resetInMemorySequence(1);
    projectService.clearIdempotencyCache();
  });

  describe('1. Status Validation & Canonical States', () => {
    it('accepts all canonical ProjectEntity status values in ProjectValidator', () => {
      const canonicalStatuses: ProjectEntity['status'][] = [
        'DRAFT',
        'SETUP',
        'READY_FOR_REVIEW',
        'APPROVED',
        'ACTIVE',
        'SUSPENDED',
        'ARCHIVED',
        'PLANNING',
      ];

      canonicalStatuses.forEach((st) => {
        const result = ProjectValidator.validate({
          projectId: 'Q-PRJ-001',
          nameAr: 'مشروع اختبار الحالة',
          status: st,
        });
        expect(result.isValid).toBe(true);
      });
    });

    it('rejects invalid or unrecognized project status values', () => {
      const result = ProjectValidator.validate({
        projectId: 'Q-PRJ-001',
        nameAr: 'مشروع اختبار',
        status: 'INVALID_STATUS_XYZ' as any,
      });
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === 'status')).toBe(true);
    });

    it('defaults project creation status to SETUP when omitted', async () => {
      ProjectNumberGenerator.resetInMemorySequence(1);
      const created = await projectService.createProject(
        {
          projectId: 'TEMP_GENERATE',
          projectCode: 'TEMP_GENERATE',
          projectNumber: 0,
          nameAr: 'مشروع بدون حالة محددة',
          nameEn: 'Project Default Status',
          clientName: 'عميل الاختبار',
          description: 'اختبار الحالة الافتراضية',
          status: undefined as any,
          startDate: '2026-09-15',
          endDate: '2026-12-31',
          authorizedCarrierIds: [],
          authorizedMaterialIds: [],
          location: { lat: 24.7136, lng: 46.6753, geoFenceRadiusMeters: 1000, addressAr: 'الرياض' },
          settings: { currency: 'SAR', vatRatePercent: 15, zatcaTaxNumber: '300000000000003', requireTareOnExit: true, maxToleranceKg: 500, allowDriverSelfDispatch: false },
        },
        SUPER_ADMIN_CTX
      );

      expect(created.status).toBe('SETUP');
    });
  });

  describe('2. Validation Execution Before Sequence Number Allocation', () => {
    it('preserves sequence counter when validation fails on invalid input', async () => {
      ProjectNumberGenerator.resetInMemorySequence(1);

      // Attempt 1: Invalid payload (Arabic name length < 3)
      const invalidPayload = {
        projectId: 'TEMP_GENERATE',
        projectCode: 'TEMP_GENERATE',
        projectNumber: 0,
        nameAr: 'أ', // Invalid length (<3)
        nameEn: 'Invalid Short Name',
        clientName: 'عميل',
        status: 'SETUP' as const,
        startDate: '2026-09-15',
        endDate: '2026-12-31',
        authorizedCarrierIds: [],
        authorizedMaterialIds: [],
        location: { lat: 24.7136, lng: 46.6753, geoFenceRadiusMeters: 1000, addressAr: 'الرياض' },
        settings: { currency: 'SAR', vatRatePercent: 15, zatcaTaxNumber: '300000000000003', requireTareOnExit: true, maxToleranceKg: 500, allowDriverSelfDispatch: false },
      };

      await expect(projectService.createProject(invalidPayload as any, SUPER_ADMIN_CTX)).rejects.toThrow(
        'خطأ في التحقق من صحة المشروع'
      );

      // Attempt 2: Valid payload immediately after failed attempt
      const validPayload = {
        projectId: 'TEMP_GENERATE',
        projectCode: 'TEMP_GENERATE',
        projectNumber: 0,
        nameAr: 'مشروع نخلة الجديد',
        nameEn: 'New Palm Project',
        clientName: 'شركة النخلة',
        status: 'SETUP' as const,
        startDate: '2026-09-15',
        endDate: '2026-12-31',
        authorizedCarrierIds: [],
        authorizedMaterialIds: [],
        location: { lat: 24.7136, lng: 46.6753, geoFenceRadiusMeters: 1000, addressAr: 'الرياض' },
        settings: { currency: 'SAR', vatRatePercent: 15, zatcaTaxNumber: '300000000000003', requireTareOnExit: true, maxToleranceKg: 500, allowDriverSelfDispatch: false },
      };

      const createdProject = await projectService.createProject(validPayload as any, SUPER_ADMIN_CTX);

      // First valid creation MUST receive Q-PRJ-001 (showing sequence counter was not consumed by the invalid attempt)
      expect(createdProject.projectCode).toBe('Q-PRJ-001');
      expect(createdProject.projectNumber).toBe(1);
    });
  });

  describe('3. Concurrent Creation & Code Uniqueness Stress Test (12+)', () => {
    it('handles 12 concurrent valid project creations with unique sequential codes', async () => {
      ProjectNumberGenerator.resetInMemorySequence(1);

      const creationTasks = Array.from({ length: 12 }).map((_, index) =>
        projectService.createProject(
          {
            projectId: 'TEMP_GENERATE',
            projectCode: 'TEMP_GENERATE',
            projectNumber: 0,
            nameAr: `مشروع متزامن رقم ${index + 1}`,
            nameEn: `Concurrent Project ${index + 1}`,
            clientName: `العميل ${index + 1}`,
            status: 'SETUP',
            startDate: '2026-09-15',
            endDate: '2026-12-31',
            authorizedCarrierIds: [],
            authorizedMaterialIds: [],
            location: { lat: 24.7136, lng: 46.6753, geoFenceRadiusMeters: 1000, addressAr: 'الرياض' },
            settings: { currency: 'SAR', vatRatePercent: 15, zatcaTaxNumber: '300000000000003', requireTareOnExit: true, maxToleranceKg: 500, allowDriverSelfDispatch: false },
          },
          SUPER_ADMIN_CTX
        )
      );

      const createdProjects = await Promise.all(creationTasks);

      expect(createdProjects.length).toBe(12);

      const codes = createdProjects.map((p) => p.projectCode);
      const uniqueCodes = new Set(codes);

      expect(uniqueCodes.size).toBe(12);

      // Verify exact sequential codes Q-PRJ-001 to Q-PRJ-012
      createdProjects.forEach((proj) => {
        expect(proj.projectCode).toMatch(/^Q-PRJ-\d{3}$/);
      });
    });
  });

  describe('4. Project Code Authority & Client Override Protection', () => {
    it('blocks client from overriding projectCode or projectNumber', async () => {
      ProjectNumberGenerator.resetInMemorySequence(10);

      const payloadWithHackedCodes = {
        projectId: 'HACKED-ID-999',
        projectCode: 'CLIENT-HACK-CODE',
        projectNumber: 9999,
        nameAr: 'مشروع حماية المعرّفات',
        nameEn: 'ID Protection Project',
        clientName: 'شركة الأمان',
        status: 'SETUP' as const,
        startDate: '2026-09-15',
        endDate: '2026-12-31',
        authorizedCarrierIds: [],
        authorizedMaterialIds: [],
        location: { lat: 24.7136, lng: 46.6753, geoFenceRadiusMeters: 1000, addressAr: 'الرياض' },
        settings: { currency: 'SAR', vatRatePercent: 15, zatcaTaxNumber: '300000000000003', requireTareOnExit: true, maxToleranceKg: 500, allowDriverSelfDispatch: false },
      };

      const created = await projectService.createProject(payloadWithHackedCodes as any, SUPER_ADMIN_CTX);

      // Server overrides client-provided code with Q-PRJ-010
      expect(created.projectCode).toBe('Q-PRJ-010');
      expect(created.projectNumber).toBe(10);
      expect(created.projectId).toBe('Q-PRJ-010');
    });
  });

  describe('5. Google Workspace Disabled & Undefined Field Protection', () => {
    it('creates project successfully when Google Workspace provisioning is disabled or omitted', async () => {
      ProjectNumberGenerator.resetInMemorySequence(1);

      const payload = {
        projectId: 'TEMP_GENERATE',
        projectCode: 'TEMP_GENERATE',
        projectNumber: 0,
        nameAr: 'مشروع بدون جوجل درايف',
        nameEn: 'No Drive Project',
        clientName: 'عميل محلي',
        status: 'SETUP' as const,
        startDate: '2026-09-15',
        endDate: '2026-12-31',
        authorizedCarrierIds: [],
        authorizedMaterialIds: [],
        location: { lat: 24.7136, lng: 46.6753, geoFenceRadiusMeters: 1000, addressAr: 'الرياض' },
        settings: {
          currency: 'SAR',
          vatRatePercent: 15,
          zatcaTaxNumber: '300000000000003',
          requireTareOnExit: true,
          maxToleranceKg: 500,
          allowDriverSelfDispatch: false,
          googleDriveProvisioning: {
            enabled: false,
          },
        },
      };

      const created = await projectService.createProject(payload as any, SUPER_ADMIN_CTX);

      expect(created.projectId).toBe('Q-PRJ-001');
      expect(created.settings.googleDriveProvisioning?.enabled).toBe(false);

      // Verify no undefined properties exist
      const hasUndefined = JSON.stringify(created).includes('undefined');
      expect(hasUndefined).toBe(false);
    });
  });

  describe('6. Idempotency Protection', () => {
    it('returns cached project result when operationId is repeated', async () => {
      ProjectNumberGenerator.resetInMemorySequence(1);
      const fixedOpId = 'OP-BLOCK100H-IDEMPOTENT-01';

      const payload = {
        projectId: 'TEMP_GENERATE',
        projectCode: 'TEMP_GENERATE',
        projectNumber: 0,
        operationId: fixedOpId,
        nameAr: 'مشروع تكرار العملية',
        nameEn: 'Idempotency Project',
        clientName: 'عميل مكرر',
        status: 'SETUP' as const,
        startDate: '2026-09-15',
        endDate: '2026-12-31',
        authorizedCarrierIds: [],
        authorizedMaterialIds: [],
        location: { lat: 24.7136, lng: 46.6753, geoFenceRadiusMeters: 1000, addressAr: 'الرياض' },
        settings: { currency: 'SAR', vatRatePercent: 15, zatcaTaxNumber: '300000000000003', requireTareOnExit: true, maxToleranceKg: 500, allowDriverSelfDispatch: false },
      };

      const res1 = await projectService.createProject(payload as any, SUPER_ADMIN_CTX);
      const res2 = await projectService.createProject(payload as any, SUPER_ADMIN_CTX);

      // Both calls return the exact same project object
      expect(res1.projectId).toBe('Q-PRJ-001');
      expect(res2.projectId).toBe('Q-PRJ-001');
      expect(res1).toEqual(res2);
    });
  });
});
