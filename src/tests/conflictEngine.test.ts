/**
 * BLOCK 123 — Conflict & Exception Engine Unit Tests
 */

import { importSessionManager } from '../services/importSessionManager';
import { canonicalImportPipelineService } from '../services/importPipeline.service';
import { canonicalValidationService } from '../services/validationPipeline.service';
import { canonicalConflictEngine } from '../services/conflictEngine.service';
import { AuthorizationContext } from '../types/canonicalContracts';

async function runTests() {
  console.log('--- BLOCK 123 Conflict Engine Test Suite Starting ---');

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
  let session = await importSessionManager.createSession('proj_1', 'CSV', 'op_conf_1', mockAuth);

  // 2. Parse
  const csvContent = 'ticketId,truckNo,netWeight\nTKT-001,TRK-100,150\nTKT-001,TRK-100,150\n';
  const parsed = await canonicalImportPipelineService.parseSource(session, csvContent, { expectedVersion: 1 }, mockAuth);

  // 3. Normalize
  const normalized = await canonicalImportPipelineService.normalizeRows(parsed.session, parsed.rawRows, { expectedVersion: 2 }, mockAuth);

  // 4. Validate & Deduplicate -> Advances to VALIDATED (version 3)
  const validationResult = await canonicalValidationService.validateAndDeduplicate(
    normalized.session,
    normalized.normalizedRows,
    { expectedVersion: 3 },
    mockAuth
  );

  if (validationResult.session.state !== 'VALIDATED') {
    throw new Error('Failed: session did not advance to VALIDATED');
  }

  // 5. Classify Conflicts -> Advances to REVIEW_REQUIRED (version 4)
  const conflictResult = await canonicalConflictEngine.classifyAndTransitionToReview(
    validationResult.session,
    validationResult.issues,
    validationResult.duplicates,
    { expectedVersion: 4 },
    mockAuth
  );

  if (conflictResult.session.state !== 'REVIEW_REQUIRED') {
    throw new Error('Failed: session did not advance to REVIEW_REQUIRED');
  }
  if (conflictResult.conflicts.length === 0) {
    throw new Error('Failed: conflicts not classified');
  }
  if (!conflictResult.conflicts[0].resolutionIntent) {
    throw new Error('Failed: resolution intent missing');
  }

  // 6. Reject conflict classification if session is not in VALIDATED state
  const session2 = await importSessionManager.createSession('proj_1', 'CSV', 'op_conf_2', mockAuth);
  let caughtInvalid = false;
  try {
    await canonicalConflictEngine.classifyAndTransitionToReview(session2, [], [], { expectedVersion: 1 }, mockAuth);
  } catch {
    caughtInvalid = true;
  }
  if (!caughtInvalid) {
    throw new Error('Failed: conflict classification from SOURCE state should be rejected');
  }

  console.log('✓ BLOCK 123 Conflict Engine tests passed successfully.');
}

runTests().then(() => process.exit(0)).catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
