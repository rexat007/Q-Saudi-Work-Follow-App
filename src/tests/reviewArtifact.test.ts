/**
 * BLOCK 124 — Review Artifact Generation & Immutability Binding Unit Tests
 */

import { importSessionManager } from '../services/importSessionManager';
import { canonicalImportPipelineService } from '../services/importPipeline.service';
import { canonicalValidationService } from '../services/validationPipeline.service';
import { canonicalConflictEngine } from '../services/conflictEngine.service';
import { canonicalReviewArtifactService, computeArtifactHash, canonicalize } from '../services/reviewArtifact.service';
import { AuthorizationContext } from '../types/canonicalContracts';

async function runTests() {
  console.log('--- BLOCK 124 Review Artifact Test Suite Starting ---');

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

  // 1. Create session, parse, normalize, validate, conflict classify
  let session = await importSessionManager.createSession('proj_1', 'CSV', 'op_art_1', mockAuth);
  const csvContent = 'ticketId,truckNo,netWeight\nTKT-001,TRK-100,150\nTKT-001,TRK-100,150\n';
  const parsed = await canonicalImportPipelineService.parseSource(session, csvContent, { expectedVersion: 1 }, mockAuth);
  const normalized = await canonicalImportPipelineService.normalizeRows(parsed.session, parsed.rawRows, { expectedVersion: 2 }, mockAuth);
  const validation = await canonicalValidationService.validateAndDeduplicate(normalized.session, normalized.normalizedRows, { expectedVersion: 3 }, mockAuth);
  const conflictResult = await canonicalConflictEngine.classifyAndTransitionToReview(validation.session, validation.issues, validation.duplicates, { expectedVersion: 4 }, mockAuth);

  // 2. Generate Review Artifact
  const artifact = canonicalReviewArtifactService.generateArtifact(
    conflictResult.session,
    validation.validRows,
    validation.issues,
    validation.duplicates,
    conflictResult.conflicts,
    mockAuth,
    1
  );

  if (!artifact.artifactId || !artifact.contentHash || artifact.artifactVersion !== 1) {
    throw new Error('Failed: Review artifact metadata/hash missing or invalid version');
  }

  // 3. Verify artifact hash integrity
  const isValid = canonicalReviewArtifactService.verifyArtifact(artifact);
  if (!isValid) {
    throw new Error('Failed: Review artifact content hash verification failed');
  }

  // 4. Property order independence (canonicalization)
  const payloadA = { b: 2, a: 1 };
  const payloadB = { a: 1, b: 2 };
  const hashA = computeArtifactHash({ importSessionId: 's1', projectId: 'p1', artifactVersion: 1, sourceMetadata: {}, normalizedRows: [payloadA], validationFindings: [], duplicateFindings: [], conflictFindings: [], summary: {} as any });
  const hashB = computeArtifactHash({ importSessionId: 's1', projectId: 'p1', artifactVersion: 1, sourceMetadata: {}, normalizedRows: [payloadB], validationFindings: [], duplicateFindings: [], conflictFindings: [], summary: {} as any });

  if (hashA !== hashB) {
    throw new Error('Failed: Canonicalization failed to produce identical hash for reordered properties');
  }

  // 5. Changed content -> Changed hash
  const payloadChanged = { a: 1, b: 99 };
  const hashChanged = computeArtifactHash({ importSessionId: 's1', projectId: 'p1', artifactVersion: 1, sourceMetadata: {}, normalizedRows: [payloadChanged], validationFindings: [], duplicateFindings: [], conflictFindings: [], summary: {} as any });
  if (hashA === hashChanged) {
    throw new Error('Failed: Changed content produced identical hash');
  }

  // 6. Input immutability check
  const inputRows = [{ ticketId: 'TKT-001' }];
  const inputRowsCopy = JSON.parse(JSON.stringify(inputRows));
  canonicalReviewArtifactService.generateArtifact(conflictResult.session, inputRows, [], [], [], mockAuth, 1);
  if (JSON.stringify(inputRows) !== JSON.stringify(inputRowsCopy)) {
    throw new Error('Failed: Artifact generation mutated input rows');
  }

  // 7. Versioning check
  const v2Artifact = canonicalReviewArtifactService.createNewVersion(
    artifact,
    [{ ticketId: 'TKT-002' }],
    [],
    [],
    [],
    mockAuth,
    conflictResult.session
  );
  if (v2Artifact.artifactVersion !== 2 || v2Artifact.contentHash === artifact.contentHash) {
    throw new Error('Failed: Artifact versioning or hash update failed');
  }

  console.log('✓ BLOCK 124 Review Artifact tests passed successfully.');
}

runTests().then(() => process.exit(0)).catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
