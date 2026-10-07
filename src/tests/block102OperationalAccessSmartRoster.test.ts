import { describe, it, expect } from 'vitest';
import { getEffectiveRole, canEditProject } from '../utils/permissions';
import {
  DriverTruckImportNormalizer,
  DriverTruckImportEntityResolver,
  DriverTruckImportValidator
} from '../services/import/driverTruckImport';
import { PipelineContext } from '../types/unifiedImport';
import { UserEntity } from '../types/entities';

describe('BLOCK 102 — Operational Access & Smart Roster Import Suite', () => {
  // 1. RBAC Fixtures
  const mockViewerUser: UserEntity = { 
    userId: 'usr_1', 
    email: 'viewer@q-saudi.com', 
    fullName: 'Viewer User',
    role: 'VIEWER', 
    assignedProjectIds: ['Q-PRJ-001'],
    isActive: true,
    createdAt: new Date() as any,
    updatedAt: new Date() as any,
    createdBy: 'sys',
    updatedBy: 'sys'
  };

  const mockAdminUser: UserEntity = { 
    userId: 'usr_2', 
    email: 'admin@q-saudi.com', 
    fullName: 'Admin User',
    role: 'PROJECT_ADMIN', 
    assignedProjectIds: ['Q-PRJ-001'],
    isActive: true,
    createdAt: new Date() as any,
    updatedAt: new Date() as any,
    createdBy: 'sys',
    updatedBy: 'sys'
  };

  const mockContext: PipelineContext = {
    projectId: 'Q-PRJ-001',
    userId: 'usr_admin',
    operationId: 'OP-102-TEST',
    knownEntities: {
      carriers: [{ carrierId: 'CAR-001', name: 'شركة النقل الوطنية' }],
      drivers: [
        { driverId: 'DRV-100001', name: 'محمد علي السعيد', idNumber: '1098765432', carrierId: 'CAR-001' },
        { driverId: 'DRV-100002', name: 'خالد عبدالله', idNumber: '1011121314', carrierId: 'CAR-002' }
      ],
      trucks: [
        { truckId: 'TRK-101', plate: '1234ABC', carrierId: 'CAR-001' }
      ],
      materials: [
        { materialId: 'MAT-001', name: 'حصى 3/4', code: 'GRAVEL_34' }
      ]
    }
  };

  it('1. RBAC & Operational Authority: enforces viewer read-only and admin edit permissions', () => {
    const effectiveViewerRole = getEffectiveRole(mockViewerUser);
    expect(effectiveViewerRole).toBe('VIEWER');
    expect(canEditProject(mockViewerUser, 'Q-PRJ-001')).toBe(false);
    expect(canEditProject(mockAdminUser, 'Q-PRJ-001')).toBe(true);
  });

  it('2. Multi-lingual header mapping & phone normalization', () => {
    const normalizer = new DriverTruckImportNormalizer();
    const normalizedRow = normalizer.normalize({
      'اسم السائق': 'محمد علي السعيد',
      'رقم الجوال': '0501234567',
      'رقم الهوية': '1098765432',
      'رقم اللوحة': 'أ ب ج 1 2 3 4',
      'نوع الشاحنة': 'TIPPER_32M3'
    }, 1);

    expect(normalizedRow.driverName).toBe('محمد علي السعيد');
    expect(normalizedRow.driverPhone).toBe('0501234567');
  });

  it('3. Entity resolution exact match by Driver identity ID number', async () => {
    const normalizer = new DriverTruckImportNormalizer();
    const normalizedRow = normalizer.normalize({
      'اسم السائق': 'محمد علي السعيد',
      'رقم الجوال': '0501234567',
      'رقم الهوية': '1098765432',
      'رقم اللوحة': 'أ ب ج 1 2 3 4',
      'نوع الشاحنة': 'TIPPER_32M3'
    }, 1);

    const resolver = new DriverTruckImportEntityResolver();
    const resolutions = await resolver.resolveEntities(normalizedRow, 1, mockContext);

    expect(resolutions.driver).toBeDefined();
    expect(resolutions.driver.confidence).toBe(100);
    expect(resolutions.driver.matchedId).toBe('DRV-100001');
  });

  it('4. Carrier conflict detection when driver belongs to another carrier', async () => {
    const normalizer = new DriverTruckImportNormalizer();
    const conflictRow = normalizer.normalize({
      'اسم السائق': 'خالد عبدالله',
      'رقم الهوية': '1011121314',
      'شركة النقل': 'شركة النقل الوطنية'
    }, 2);

    const resolver = new DriverTruckImportEntityResolver();
    const conflictResolutions = await resolver.resolveEntities(conflictRow, 2, mockContext);

    expect(conflictResolutions.driver.relationshipStatus).toBe('DRIVER_CARRIER_CONFLICT');
  });

  it('5. Project material scope validation: marks unmapped/unresolved material as BLOCKING', () => {
    const validator = new DriverTruckImportValidator();
    const unmappedMaterialRow = {
      rowNumber: 1,
      raw: {},
      canonical: {
        driverName: 'علي حسن',
        materialName: 'مادة غريبة غير معرفة'
      },
      entityResolutions: {
        carrier: { entityType: 'CARRIER' as const, originalValue: 'CAR-001', matchedId: 'CAR-001', confidence: 100, isExact: true }
      },
      validationIssues: [],
      reviewStatus: 'accepted' as const,
      status: 'VALID' as const
    };

    const issues = validator.validateRow(unmappedMaterialRow, mockContext);
    const materialIssue = issues.find(i => i.code === 'UNRESOLVED_MATERIAL');

    expect(materialIssue).toBeDefined();
    expect(materialIssue?.severity).toBe('BLOCKING');
  });
});
