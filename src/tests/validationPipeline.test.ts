/**
 * BLOCK 122 — Validation & Deduplication Unit Tests
 */

import { importSessionManager } from '../services/importSessionManager';
import { canonicalImportPipelineService } from '../services/importPipeline.service';
import { canonicalValidationService } from '../services/validationPipeline.service';
import { AuthorizationContext } from '../types/canonicalContracts';

async function runTests() {
  console.log('--- BLOCK 122 Validation & Deduplication Test Suite Starting ---');

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

  // 1. Create session
  let session = await importSessionManager.createSession('proj_1', 'CSV', 'op_val_1', mockAuth);

  // 2. Parse
  const csvContent = 'ticketId,truckNo,netWeight\nTKT-001,TRK-100,150\nTKT-001,TRK-100,150\n';
  const parsed = await canonicalImportPipelineService.parseSource(session, csvContent, { expectedVersion: 1 }, mockAuth);

  // 3. Normalize
  const normalized = await canonicalImportPipelineService.normalizeRows(parsed.session, parsed.rawRows, { expectedVersion: 2 }, mockAuth);

  // 4. Validate & Deduplicate
  const validationResult = await canonicalValidationService.validateAndDeduplicate(
    normalized.session,
    normalized.normalizedRows,
    { expectedVersion: 3 },
    mockAuth
  );

  if (validationResult.session.state !== 'VALIDATED') {
    throw new Error('Failed: session did not advance to VALIDATED');
  }
  if (validationResult.totalValidated !== 2) {
    throw new Error('Failed: totalValidated count mismatch');
  }
  if (validationResult.duplicates.length !== 1) {
    throw new Error('Failed: duplicate detection count mismatch');
  }

  // 5. Reject validation from invalid state
  const session2 = await importSessionManager.createSession('proj_1', 'CSV', 'op_val_2', mockAuth);
  let caughtInvalid = false;
  try {
    await canonicalValidationService.validateAndDeduplicate(session2, [], { expectedVersion: 1 }, mockAuth);
  } catch {
    caughtInvalid = true;
  }
  if (!caughtInvalid) {
    throw new Error('Failed: validation from SOURCE state should be rejected');
  }

  console.log('✓ BLOCK 122 Validation tests passed successfully.');
}

runTests().then(() => process.exit(0)).catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
