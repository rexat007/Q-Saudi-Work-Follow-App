import { getEffectiveRole, canEditProject, hasAdminRole } from '../utils/permissions';
import { DriverTruckImportNormalizer, DriverTruckImportEntityResolver, DriverTruckImportValidator, DriverTruckImportCommitter } from '../services/import/driverTruckImport';
import { DriverTruckPipelineService } from '../services/import/driverTruckPipeline.service';
import { PipelineContext } from '../types/unifiedImport';
import { UserEntity } from '../types/entities';

console.log('--- BLOCK 102 Test Suite Starting ---');

// 1. RBAC Tests
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

const effectiveViewerRole = getEffectiveRole(mockViewerUser);
if (effectiveViewerRole !== 'VIEWER') {
  console.error('FAILED: RBAC viewer role mismatch', effectiveViewerRole);
  process.exit(1);
}

if (canEditProject(mockViewerUser, 'Q-PRJ-001')) {
  console.error('FAILED: VIEWER should not have edit permissions on project');
  process.exit(1);
}

if (!canEditProject(mockAdminUser, 'Q-PRJ-001')) {
  console.error('FAILED: PROJECT_ADMIN should have edit permissions on project');
  process.exit(1);
}

console.log('✓ RBAC & Operational Authority tests passed.');

// 2. Normalization & Header Mapping Tests
const normalizer = new DriverTruckImportNormalizer();
const normalizedRow = normalizer.normalize({
  'اسم السائق': 'محمد علي السعيد',
  'رقم الجوال': '0501234567',
  'رقم الهوية': '1098765432',
  'رقم اللوحة': 'أ ب ج 1 2 3 4',
  'نوع الشاحنة': 'TIPPER_32M3'
}, 1);

if (normalizedRow.driverName !== 'محمد علي السعيد' || normalizedRow.driverPhone !== '0501234567') {
  console.error('FAILED: Header mapping / Phone normalization error', normalizedRow);
  process.exit(1);
}

console.log('✓ Multi-lingual header mapping tests passed.');

// 3. Entity Resolution & Confidence Score Tests
const resolver = new DriverTruckImportEntityResolver();
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

async function testEntityResolution() {
  const resolutions = await resolver.resolveEntities(normalizedRow, 1, mockContext);
  
  // Exact match by ID number
  if (!resolutions.driver || resolutions.driver.confidence !== 100 || resolutions.driver.matchedId !== 'DRV-100001') {
    console.error('FAILED: Driver ID exact match resolution', resolutions.driver);
    process.exit(1);
  }

  // Conflict test: Driver belonging to CAR-002 imported under CAR-001
  const conflictRow = normalizer.normalize({
    'اسم السائق': 'خالد عبدالله',
    'رقم الهوية': '1011121314',
    'شركة النقل': 'شركة النقل الوطنية'
  }, 2);

  const conflictResolutions = await resolver.resolveEntities(conflictRow, 2, mockContext);
  if (conflictResolutions.driver.relationshipStatus !== 'DRIVER_CARRIER_CONFLICT') {
    console.error('FAILED: Driver carrier conflict detection', conflictResolutions.driver);
    process.exit(1);
  }

  console.log('✓ Entity resolution & conflict detection tests passed.');
}

// 4. Material Scope Validation Test
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

if (!materialIssue || materialIssue.severity !== 'BLOCKING') {
  console.error('FAILED: Unresolved material scope validation', issues);
  process.exit(1);
}

console.log('✓ Project material scope validation tests passed.');

// 5. Roster Commit & ID Generation Tests
async function testCommitter() {
  const committer = new DriverTruckImportCommitter();
  const validBatch = {
    importBatchId: 'BATCH-102-001',
    projectId: 'Q-PRJ-001',
    source: { sourceType: 'MANUAL' as any, importBatchId: 'BATCH-102-001' },
    currentStage: 'REVIEW' as const,
    validationStatus: 'PASSED' as const,
    commitStatus: 'READY_TO_COMMIT' as const,
    totalRows: 1,
    validRows: 1,
    warningRows: 0,
    errorRows: 0,
    requiresReviewRows: 0,
    committedRows: 0,
    rows: [{
      rowNumber: 1,
      raw: {},
      canonical: {
        driverName: 'عمر الفاروق',
        driverPhone: '0555555555',
        driverIdentity: '1022334455',
        truckPlate: '5555XYZ'
      },
      entityResolutions: {
        carrier: { entityType: 'CARRIER' as const, originalValue: 'CAR-001', matchedId: 'CAR-001', confidence: 100, isExact: true }
      },
      validationIssues: [],
      reviewStatus: 'accepted' as const,
      status: 'VALID' as const
    }],
    issues: [],
    operationId: 'OP-102-COMMIT',
    createdAt: new Date().toISOString(),
    createdBy: 'usr_admin',
    auditTrail: []
  };

  const result = await committer.commit(validBatch, mockContext);
  if (!result.success || result.committedRows !== 1) {
    console.error('FAILED: Committer execution', result);
    process.exit(1);
  }

  // Check generated IDs in result
  const hasRosterId = result.committedEntityIds?.some(id => id.startsWith('Q-PRJ-001-DRV-'));
  const hasDriverId = result.committedEntityIds?.some(id => id.startsWith('DRV-'));

  if (!hasRosterId || !hasDriverId) {
    console.error('FAILED: ID formatting for Global Driver ID or Project Roster ID', result.committedEntityIds);
    process.exit(1);
  }

  console.log('✓ Roster commit & ID generation tests passed.');
}

async function runAll() {
  await testEntityResolution();
  await testCommitter();
  console.log('=== ALL BLOCK 102 TESTS PASSED SUCCESSFULLY ===');
}

runAll().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
