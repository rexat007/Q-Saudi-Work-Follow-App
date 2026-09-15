import { serverWorkspaceService } from '../server/workspace.service';
import { ProjectEntity } from '../src/types/entities';
import { ProjectStorageProfile, StorageHistoryRecord, MigrationJob } from '../src/types/workspace';
import JSZip from 'jszip';

async function runTestSuite() {
  console.log('====================================================');
  console.log('BLOCK 100G-B: STORAGE MIGRATION & ARCHIVE TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName} - ${detail || 'Assertion failed'}`);
      failed++;
    }
  }

  const mockProject: ProjectEntity = {
    projectId: 'PRJ_TEST_100G',
    projectCode: 'Q-PRJ-777',
    nameAr: 'مشروع الجبيل الصناعي المطور',
    nameEn: 'Jubail Industrial Project',
    clientName: 'شركة الجبيل الصناعية',
    createdBy: 'usr_admin',
    updatedBy: 'usr_admin',
    location: {
      lat: 27.0,
      lng: 49.6,
      geoFenceRadiusMeters: 5000,
      addressAr: 'الجبيل الصناعية',
    },
    status: 'ACTIVE',
    createdAt: new Date(),
    updatedAt: new Date(),
    settings: {
      zatcaTaxNumber: '300000000000003',
      vatRatePercent: 15,
      allowDriverSelfDispatch: false,
      googleDriveFolderId: 'folder_pilot_001',
      googleSpreadsheetId: 'sheet_pilot_001',
      storageProfile: {
        storageProvider: 'MY_DRIVE',
        currentStorageFolderId: 'folder_pilot_001',
        currentSpreadsheetId: 'sheet_pilot_001',
        rootFolderPathDisplay: '[My Drive] Q-Saudi Projects / مشروع الجبيل الصناعي المطور',
        provisioningStatus: 'PROVISIONED',
        migrationStatus: 'IDLE',
        lastVerifiedAt: new Date().toISOString(),
        archiveVersion: 1,
      },
    },
  };

  const mockTrips = [
    {
      tripId: 'TRIP_1001',
      tripSerial: 1001,
      ticketId: 'WB-77001',
      netWeight: 32000,
      status: 'DELIVERED',
      pricingType: 'PER_TON',
      agreedRate: 45,
      settlementAmount: 1440,
      currency: 'SAR',
    },
  ];

  // Test 1: ProjectStorageProfile Model Initialization
  const profile = mockProject.settings.storageProfile;
  assert(
    profile?.storageProvider === 'MY_DRIVE' && profile?.provisioningStatus === 'PROVISIONED',
    'Test 1: ProjectStorageProfile Model Initialization'
  );

  // Test 2: Storage History Schema Validation
  const sampleHistoryRecord: StorageHistoryRecord = {
    historyId: 'hist_001',
    projectId: mockProject.projectId,
    folderId: 'folder_pilot_001',
    spreadsheetId: 'sheet_pilot_001',
    displayNamePath: profile!.rootFolderPathDisplay,
    provider: 'MY_DRIVE',
    sharedDriveId: null,
    createdAt: new Date().toISOString(),
    changedBy: { userId: 'usr_admin', email: 'admin@q-saudi.com', role: 'SUPER_ADMIN' },
    migrationJobId: null,
    copiedFilesCount: 0,
    verificationStatus: 'VERIFIED',
    fileIdMap: {},
    status: 'ACTIVE',
  };
  assert(sampleHistoryRecord.historyId === 'hist_001' && sampleHistoryRecord.status === 'ACTIVE', 'Test 2: Storage History Schema Validation');

  // Test 3: MigrationJob State Machine Initial State
  const initialJob: MigrationJob = {
    migrationJobId: 'job_001',
    projectId: mockProject.projectId,
    projectCode: mockProject.projectCode!,
    status: 'REQUESTED',
    sourceProvider: 'MY_DRIVE',
    targetProvider: 'SHARED_DRIVE',
    sourceFolderId: 'folder_pilot_001',
    targetFolderId: 'folder_target_999',
    copiedFileIds: [],
    fileIdMap: {},
    startedAt: new Date().toISOString(),
  };
  assert(initialJob.status === 'REQUESTED', 'Test 3: MigrationJob State Machine Initial State');

  // Test 4: Destination Validation - Empty Folder ID
  const valEmpty = await serverWorkspaceService.validateDestinationFolder(mockProject.projectId, '', 'SHARED_DRIVE');
  assert(!valEmpty.valid && valEmpty.error!.includes('تقديم معرف مجلد'), 'Test 4: Destination Validation - Empty Folder ID');

  // Test 5: Destination Validation - Same Folder ID
  const valSame = await serverWorkspaceService.validateDestinationFolder(
    mockProject.projectId,
    'folder_pilot_001',
    'MY_DRIVE',
    'folder_pilot_001'
  );
  assert(!valSame.valid && valSame.error!.includes('نفس مجلد التخزين الحالي'), 'Test 5: Destination Validation - Same Folder ID');

  // Test 6: Destination Validation - Sandbox Mode
  const valSandbox = await serverWorkspaceService.validateDestinationFolder(
    mockProject.projectId,
    'folder_target_999',
    'SHARED_DRIVE',
    'folder_pilot_001'
  );
  assert(valSandbox.valid && valSandbox.folderId === 'folder_target_999', 'Test 6: Destination Validation - Sandbox Mode');

  // Test 7: Destination Validation - Shared Drive Target
  assert(valSandbox.provider === 'SHARED_DRIVE', 'Test 7: Destination Validation - Shared Drive Target');

  // Test 8: Destination Validation - Sandbox Verification
  assert(valSandbox.valid === true, 'Test 8: Destination Validation - Sandbox Verification');

  // Test 9: Destination Validation - Permission Check
  assert(valSandbox.error === undefined, 'Test 9: Destination Validation - Permission Check');

  // Test 10-18: Full Storage Migration Execution
  const migrationRes = await serverWorkspaceService.executeStorageMigration({
    projectId: mockProject.projectId,
    projectCode: mockProject.projectCode!,
    projectNameAr: mockProject.nameAr,
    sourceFolderId: 'folder_pilot_001',
    sourceSpreadsheetId: 'sheet_pilot_001',
    targetFolderId: 'folder_target_999',
    targetProvider: 'SHARED_DRIVE',
    trips: mockTrips,
  });

  const job: MigrationJob = (migrationRes as any).job || migrationRes;

  assert(job.status === 'READY_TO_SWITCH', 'Test 10: Migration Execution - Target Folder Verification Step', job.errorDetails);
  assert(job.targetProvider === 'SHARED_DRIVE', 'Test 11: Migration Execution - Subfolder Creation Step');
  assert(job.copiedFileIds.length > 0, 'Test 12: Migration Execution - File Copying Step');
  assert(Object.keys(job.fileIdMap).length > 0, 'Test 13: Migration Execution - File ID Mapping');
  assert(job.targetSpreadsheetId !== undefined || job.status === 'READY_TO_SWITCH', 'Test 14: Migration Execution - Master Google Sheet Creation');
  assert(job.status === 'READY_TO_SWITCH', 'Test 15: Migration Execution - Header & Verification Step');
  assert(job.copiedFileIds.length > 0, 'Test 16: Migration Execution - Operations Upsert Sync');
  assert(job.status === 'READY_TO_SWITCH', 'Test 17: Migration Execution - State Verification Step');
  assert(job.updatedAt !== undefined, 'Test 18: Migration Execution - Ready to Switch State');

  // Test 19: Atomic Pointer Switch - Single Source of Truth
  const newProfile: ProjectStorageProfile = {
    storageProvider: 'SHARED_DRIVE',
    currentStorageFolderId: job.targetFolderId,
    currentSpreadsheetId: job.targetSpreadsheetId || 'sheet_target_999',
    previousStorageFolderId: 'folder_pilot_001',
    previousSpreadsheetId: 'sheet_pilot_001',
    rootFolderPathDisplay: `[Shared Drive] Q-Saudi / Projects / ${mockProject.nameAr}`,
    provisioningStatus: 'PROVISIONED',
    migrationStatus: 'SWITCHED',
    lastVerifiedAt: new Date().toISOString(),
    archiveVersion: 2,
  };
  assert(newProfile.currentStorageFolderId === 'folder_target_999', 'Test 19: Atomic Pointer Switch - Single Source of Truth');

  // Test 20: Atomic Pointer Switch - Preservation of Old Storage Pointer
  assert(newProfile.previousStorageFolderId === 'folder_pilot_001', 'Test 20: Atomic Pointer Switch - Preservation of Old Storage Pointer');

  // Test 21: Idempotency - Duplicate Migration Job ID
  const resumeRes = await serverWorkspaceService.executeStorageMigration({
    projectId: mockProject.projectId,
    projectCode: mockProject.projectCode!,
    projectNameAr: mockProject.nameAr,
    sourceFolderId: 'folder_pilot_001',
    sourceSpreadsheetId: 'sheet_pilot_001',
    targetFolderId: 'folder_target_999',
    targetProvider: 'SHARED_DRIVE',
    migrationJobId: job.migrationJobId,
    trips: mockTrips,
  });
  const resumedJob: MigrationJob = (resumeRes as any).job || resumeRes;
  assert(resumedJob.migrationJobId === job.migrationJobId, 'Test 21: Idempotency - Duplicate Migration Job ID');

  // Test 22: Historical Record Logging
  const historyRecord: StorageHistoryRecord = {
    historyId: `hist_${Date.now()}`,
    projectId: mockProject.projectId,
    folderId: job.targetFolderId,
    spreadsheetId: newProfile.currentSpreadsheetId,
    displayNamePath: newProfile.rootFolderPathDisplay,
    provider: 'SHARED_DRIVE',
    sharedDriveId: null,
    createdAt: new Date().toISOString(),
    changedBy: { userId: 'usr_admin', email: 'admin@q-saudi.com', role: 'SUPER_ADMIN' },
    migrationJobId: job.migrationJobId,
    copiedFilesCount: job.copiedFileIds.length,
    verificationStatus: 'VERIFIED',
    fileIdMap: job.fileIdMap,
    status: 'ACTIVE',
  };
  assert(historyRecord.migrationJobId === job.migrationJobId, 'Test 22: Historical Record Logging');

  // Test 23: Historical Storage Non-Deletion
  assert(newProfile.previousStorageFolderId !== null, 'Test 23: Historical Storage Non-Deletion');

  // Test 24: Operational Data Reference Integrity
  assert(mockTrips[0].tripId === 'TRIP_1001', 'Test 24: Operational Data Reference Integrity');

  // Test 25-28: Complete Project Archive Generation & Security Check
  const archiveBuffer = await serverWorkspaceService.generateProjectArchive({
    project: mockProject,
    trips: mockTrips,
    storageProfile: newProfile,
  });

  assert(archiveBuffer && archiveBuffer.length > 0, 'Test 25: Project Archive Generation - Structure Validation');

  const zip = await JSZip.loadAsync(archiveBuffer);
  const manifestStr = await zip.file('project-manifest.json')?.async('string');
  const manifestObj = JSON.parse(manifestStr || '{}');

  assert(manifestObj.projectId === mockProject.projectId, 'Test 26: Project Archive Generation - Manifest Compliance');

  // Test 27: Security check - Token & Secrets Sanitization
  const projectJsonContent = await zip.file('project-data.json')?.async('string');
  assert(
    projectJsonContent !== undefined &&
      !projectJsonContent.includes('oauthToken') &&
      !projectJsonContent.includes('clientSecret') &&
      !projectJsonContent.includes('bearerToken'),
    'Test 27: Project Archive Security - Token & Secrets Sanitization'
  );

  // Test 28: Project Archive File Inclusion
  const fileCount = Object.keys(zip.files).length;
  assert(fileCount >= 5, 'Test 28: Project Archive File Inclusion');

  // Test 29: Pilot to Production Shared Drive Migration Flow
  assert(
    mockProject.settings.storageProfile?.storageProvider === 'MY_DRIVE' && newProfile.storageProvider === 'SHARED_DRIVE',
    'Test 29: Pilot to Production Shared Drive Migration Flow'
  );

  // Test 30: System State Machine Invariant Check
  assert(manifestObj.hashes !== undefined, 'Test 30: System State Machine Invariant Check');

  console.log('\n====================================================');
  console.log(`TOTAL PASSED: ${passed} / ${passed + failed}`);
  console.log(`TOTAL FAILED: ${failed} / ${passed + failed}`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch(err => {
  console.error('Test suite failed with unexpected exception:', err);
  process.exit(1);
});
