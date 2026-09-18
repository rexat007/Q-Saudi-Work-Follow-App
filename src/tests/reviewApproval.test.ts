/**
 * BLOCK 125 — Review-Gated Approval & Stale Approval Protection Unit Tests
 */

import { importSessionManager } from '../services/importSessionManager';
import { canonicalImportPipelineService } from '../services/importPipeline.service';
import { canonicalValidationService } from '../services/validationPipeline.service';
import { canonicalConflictEngine } from '../services/conflictEngine.service';
import { canonicalReviewArtifactService } from '../services/reviewArtifact.service';
import { canonicalReviewApprovalService } from '../services/reviewApproval.service';
import { AuthorizationContext } from '../types/canonicalContracts';

async function runTests() {
  console.log('--- BLOCK 125 Review Approval Test Suite Starting ---');

  const adminAuth: AuthorizationContext = {
    userId: 'user_admin',
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

  const viewerAuth: AuthorizationContext = {
    userId: 'user_viewer',
    email: 'viewer@qsaudi.com',
    displayName: 'Test Viewer',
    accountStatus: 'ACTIVE',
    memberships: {
      'proj_1': {
        projectId: 'proj_1',
        role: 'VIEWER',
        membershipState: 'ACTIVE',
        assignedAt: new Date()
      }
    }
  };

  const inactiveAuth: AuthorizationContext = {
    userId: 'user_inactive',
    email: 'inactive@qsaudi.com',
    displayName: 'Test Inactive',
    accountStatus: 'SUSPENDED',
    memberships: {
      'proj_1': {
        projectId: 'proj_1',
        role: 'PROJECT_ADMIN',
        membershipState: 'ACTIVE',
        assignedAt: new Date()
      }
    }
  };

  // 1. Setup session through parsing, normalization, validation, and conflict resolution (reaches REVIEW_REQUIRED)
  let session = await importSessionManager.createSession('proj_1', 'CSV', 'op_app_1', adminAuth);
  const csvContent = 'ticketId,truckNo,netWeight\nTKT-100,TRK-500,200\n';
  const parsed = await canonicalImportPipelineService.parseSource(session, csvContent, { expectedVersion: 1 }, adminAuth);
  const normalized = await canonicalImportPipelineService.normalizeRows(parsed.session, parsed.rawRows, { expectedVersion: 2 }, adminAuth);
  const validation = await canonicalValidationService.validateAndDeduplicate(normalized.session, normalized.normalizedRows, { expectedVersion: 3 }, adminAuth);
  const conflictResult = await canonicalConflictEngine.classifyAndTransitionToReview(validation.session, validation.issues, validation.duplicates, { expectedVersion: 4 }, adminAuth);

  // Generate Review Artifact V1
  const artifactV1 = canonicalReviewArtifactService.generateArtifact(
    conflictResult.session,
    validation.validRows,
    validation.issues,
    validation.duplicates,
    conflictResult.conflicts,
    adminAuth,
    1
  );

  // 2. Reject approval by unauthorized viewer
  try {
    await canonicalReviewApprovalService.recordApproval(
      conflictResult.session,
      artifactV1,
      'APPROVED',
      { expectedVersion: 5 },
      viewerAuth
    );
    throw new Error('Failed: Unauthorized viewer was able to approve import');
  } catch (err: any) {
    if (err.message.includes('Failed: Unauthorized')) throw err;
  }

  // 3. Reject approval by inactive account
  try {
    await canonicalReviewApprovalService.recordApproval(
      conflictResult.session,
      artifactV1,
      'APPROVED',
      { expectedVersion: 5 },
      inactiveAuth
    );
    throw new Error('Failed: Inactive account was able to approve import');
  } catch (err: any) {
    if (err.message.includes('Failed: Inactive')) throw err;
  }

  // 4. Reject approval with stale concurrency version
  try {
    await canonicalReviewApprovalService.recordApproval(
      conflictResult.session,
      artifactV1,
      'APPROVED',
      { expectedVersion: 99 },
      adminAuth
    );
    throw new Error('Failed: Concurrency mismatch did not throw error');
  } catch (err: any) {
    if (err.message.includes('Failed: Concurrency')) throw err;
  }

  // 5. Valid approval of REVIEW_REQUIRED artifact
  const approvalResult = await canonicalReviewApprovalService.recordApproval(
    conflictResult.session,
    artifactV1,
    'APPROVED',
    { expectedVersion: 5 },
    adminAuth,
    'Approved for production commit test'
  );

  if (approvalResult.session.state !== 'APPROVED') {
    throw new Error('Failed: Session state did not advance to APPROVED');
  }
  if (!approvalResult.approval.approvalId || approvalResult.approval.decision !== 'APPROVED') {
    throw new Error('Failed: Approval record is missing or incorrect');
  }

  // 6. Verify approval bindings
  const approval = approvalResult.approval;
  if (
    approval.importSessionId !== conflictResult.session.importSessionId ||
    approval.artifactId !== artifactV1.artifactId ||
    approval.artifactVersion !== artifactV1.artifactVersion ||
    approval.contentHash !== artifactV1.contentHash
  ) {
    throw new Error('Failed: Approval record does not bind exact session, artifact, version, and hash');
  }

  // 7. Verify isApprovalCurrent returns true for the exact approved artifact
  const isCurrentV1 = canonicalReviewApprovalService.isApprovalCurrent(approval, artifactV1);
  if (!isCurrentV1) {
    throw new Error('Failed: isApprovalCurrent returned false for exact approved artifact');
  }

  // 8. Stale Approval Protection: Generate V2 artifact with changed content
  const artifactV2 = canonicalReviewArtifactService.createNewVersion(
    artifactV1,
    [{ ticketId: 'TKT-100', truckNo: 'TRK-500', netWeight: 350 }],
    [],
    [],
    [],
    adminAuth,
    approvalResult.session
  );

  // V1 approval must NOT validate against V2 artifact
  const isCurrentV2 = canonicalReviewApprovalService.isApprovalCurrent(approval, artifactV2);
  if (isCurrentV2) {
    throw new Error('Failed: V1 approval erroneously validated against V2 artifact');
  }

  const evalV2 = canonicalReviewApprovalService.evaluateApprovalStatus(approval, artifactV2);
  if (evalV2.status !== 'STALE' || evalV2.isCurrent !== false) {
    throw new Error('Failed: evaluateApprovalStatus did not mark V1 approval as STALE for V2 artifact');
  }

  // 9. Tampered/Mismatch Content Hash check
  const tamperedArtifact = { ...artifactV1, contentHash: 'tampered_hash_value' };
  const isCurrentTampered = canonicalReviewApprovalService.isApprovalCurrent(approval, tamperedArtifact as any);
  if (isCurrentTampered) {
    throw new Error('Failed: Approval validated against tampered contentHash');
  }

  // 10. Rejection from non-REVIEW_REQUIRED state
  try {
    await canonicalReviewApprovalService.recordApproval(
      approvalResult.session, // now in APPROVED state
      artifactV1,
      'APPROVED',
      { expectedVersion: 6 },
      adminAuth
    );
    throw new Error('Failed: Approved session allowed re-approval from APPROVED state');
  } catch (err: any) {
    if (err.message.includes('Failed: Approved session')) throw err;
  }

  // 11. Approval history and immutability check
  const history = canonicalReviewApprovalService.getApprovalHistory(conflictResult.session.importSessionId);
  if (history.length !== 1 || history[0].approvalId !== approval.approvalId) {
    throw new Error('Failed: Approval history retrieval failed or record was modified');
  }

  console.log('✓ BLOCK 125 Review Approval tests passed successfully.');
}

runTests().then(() => process.exit(0)).catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
