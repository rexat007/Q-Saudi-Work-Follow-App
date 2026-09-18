/**
 * BLOCK 121 — Parser & Normalization Unit Tests
 */

import { importSessionManager } from '../services/importSessionManager';
import { canonicalImportPipelineService } from '../services/importPipeline.service';
import { AuthorizationContext } from '../types/canonicalContracts';

async function runTests() {
  console.log('--- BLOCK 121 Import Pipeline Test Suite Starting ---');

  const mockAuth: AuthorizationContext = {
    userId: 'user_123',
    email: 'admin@qsaudi.com',
    displayName: 'Test Admin',
    accountStatus: 'ACTIVE',
    globalRole: 'SUPER_ADMIN',
    memberships: {
      'proj_1': {
        projectId: 'proj_1',
        role: 'PROJECT_ADMIN',
        membershipState: 'ACTIVE',
        assignedAt: new Date()
      }
    }
  };

  // 1. Parse CSV
  const session = await importSessionManager.createSession('proj_1', 'CSV', 'op_csv_1', mockAuth);
  const csvContent = 'Driver Name,Truck Plate,Net Weight\nAli,XYZ-123,150.5\n';

  const parsedResult = await canonicalImportPipelineService.parseSource(
    session,
    csvContent,
    { expectedVersion: 1 },
    mockAuth
  );

  if (parsedResult.session.state !== 'PARSED' || !parsedResult.headers.includes('Driver Name') || parsedResult.rawRows.length !== 1) {
    throw new Error('Failed: parseSource did not transition session or parse headers/rows correctly');
  }

  // 2. Normalize rows
  const normalized = await canonicalImportPipelineService.normalizeRows(
    parsedResult.session,
    parsedResult.rawRows,
    { expectedVersion: 2 },
    mockAuth
  );

  if (normalized.session.state !== 'NORMALIZED' || normalized.normalizedRows.length !== 1) {
    throw new Error('Failed: normalizeRows did not transition session or normalize rows');
  }

  // 3. Reject normalization from invalid state
  const session2 = await importSessionManager.createSession('proj_1', 'CSV', 'op_csv_3', mockAuth);
  let caughtInvalid = false;
  try {
    await canonicalImportPipelineService.normalizeRows(session2, [], { expectedVersion: 1 }, mockAuth);
  } catch {
    caughtInvalid = true;
  }
  if (!caughtInvalid) {
    throw new Error('Failed: normalization from SOURCE state should be rejected');
  }

  console.log('✓ BLOCK 121 Import Pipeline tests passed successfully.');
}

runTests().then(() => process.exit(0)).catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
