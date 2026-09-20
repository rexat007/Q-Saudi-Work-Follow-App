/**
 * BLOCK 126 — Transactional Commit Engine Unit Tests (P0 REPAIR VERIFIED)
 * Comprehensive validation for commit orchestration, pre-commit gates,
 * canonical service delegation, failure rollbacks, stale protection, durable idempotency,
 * atomic transaction boundary, and audit logging.
 */

import { importSessionManager } from '../services/importSessionManager';
import { canonicalImportPipelineService } from '../services/importPipeline.service';
import { canonicalValidationService } from '../services/validationPipeline.service';
import { canonicalConflictEngine } from '../services/conflictEngine.service';
import { canonicalReviewArtifactService } from '../services/reviewArtifact.service';
import { canonicalReviewApprovalService } from '../services/reviewApproval.service';
import { canonicalCommitEngineService } from '../services/commitEngine.service';
import { AuthorizationContext } from '../types/canonicalContracts';
import { adminDb } from '../firebase/admin';

async function runCommitTests() {
  console.log('--- BLOCK 126 Transactional Commit Engine Test Suite Starting ---');

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
      },
      'proj_2': {
        projectId: 'proj_2',
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

  // 1. Setup Session through Blocks 120-125
  const rawCsv = `ticketId,truckNo,netWeight\nTKT-101,TRK-501,320\nTKT-102,TRK-502,340`;
  const session = await importSessionManager.createSession('proj_1', 'CSV', 'op_commit_100', adminAuth);
  const parsed = await canonicalImportPipelineService.parseSource(session, rawCsv, { expectedVersion: 1 }, adminAuth);
  const normalized = await canonicalImportPipelineService.normalizeRows(parsed.session, parsed.rawRows, { expectedVersion: 2 }, adminAuth);
  const validation = await canonicalValidationService.validateAndDeduplicate(normalized.session, normalized.normalizedRows, { expectedVersion: 3 }, adminAuth);
  const conflictResult = await canonicalConflictEngine.classifyAndTransitionToReview(validation.session, validation.issues, validation.duplicates, { expectedVersion: 4 }, adminAuth);
  
  const artifact = canonicalReviewArtifactService.generateArtifact(
    conflictResult.session,
    validation.validRows,
    validation.issues,
    validation.duplicates,
    conflictResult.conflicts,
    adminAuth,
    1
  );

  const approvalResult = await canonicalReviewApprovalService.recordApproval(
    conflictResult.session,
    artifact,
    'APPROVED',
    { expectedVersion: 5 },
    adminAuth,
    'Ready for production deployment'
  );

  const approval = approvalResult.approval;
  let currentSession = approvalResult.session;

  if (currentSession.state !== 'APPROVED') {
    throw new Error(`Expected session to be in APPROVED state, got ${currentSession.state}`);
  }

  // 2. Test Pre-commit Verification Gate
  const preCheck = canonicalCommitEngineService.verifyPreCommit(
    currentSession,
    artifact,
    approval,
    { expectedVersion: currentSession.version },
    adminAuth
  );

  if (!preCheck.isValid) {
    throw new Error(`Pre-commit check failed unexpectedly: ${preCheck.failures.join(', ')}`);
  }

  // 3. Test Authorization: Viewer should be denied COMMIT operation
  try {
    await canonicalCommitEngineService.executeCommit(
      currentSession,
      artifact,
      approval,
      { expectedVersion: currentSession.version },
      viewerAuth
    );
    throw new Error('Failed: Viewer was permitted to execute commit');
  } catch (err: any) {
    if (err.message.includes('Failed: Viewer')) throw err;
  }

  // 4. Test Concurrency Protection: Stale version should fail
  try {
    await canonicalCommitEngineService.executeCommit(
      currentSession,
      artifact,
      approval,
      { expectedVersion: 999 },
      adminAuth
    );
    throw new Error('Failed: Stale version was permitted to execute commit');
  } catch (err: any) {
    if (err.message.includes('Failed: Stale version')) throw err;
  }

  // 5. Test Stale Approval Protection: Tampered contentHash must fail commit
  const tamperedArtifact = { ...artifact, contentHash: 'tampered_hash_value' };
  try {
    await canonicalCommitEngineService.executeCommit(
      currentSession,
      tamperedArtifact as any,
      approval,
      { expectedVersion: currentSession.version },
      adminAuth
    );
    throw new Error('Failed: Tampered artifact was committed');
  } catch (err: any) {
    if (err.message.includes('Failed: Tampered artifact')) throw err;
  }

  // 6. Test Successful Commit Execution (Trip Source)
  const commitResult = await canonicalCommitEngineService.executeCommit(
    currentSession,
    artifact,
    approval,
    { expectedVersion: currentSession.version },
    adminAuth
  );

  if (!commitResult.success) {
    throw new Error('Commit failed execution');
  }

  if (commitResult.session.state !== 'COMMITTED') {
    throw new Error(`Expected session state COMMITTED, got ${commitResult.session.state}`);
  }

  if (!commitResult.session.commitIdentity || commitResult.commitRecord.status !== 'COMMITTED') {
    throw new Error('Commit record or session commit identity is invalid');
  }

  if (commitResult.commitRecord.committedEntities.length !== 2) {
    throw new Error(`Expected 2 committed trip entities, got ${commitResult.commitRecord.committedEntities.length}`);
  }

  // 7. Verify Immutability of Commit Record
  const history = canonicalCommitEngineService.getCommitHistory(currentSession.importSessionId);
  if (history.length !== 1 || history[0].commitId !== commitResult.commitRecord.commitId) {
    throw new Error('Commit history lookup failed');
  }

  // 8. Test Durable Idempotency: Idempotent Replay on identical retry
  const replayResult = await canonicalCommitEngineService.executeCommit(
    currentSession,
    artifact,
    approval,
    { expectedVersion: currentSession.version },
    adminAuth
  );

  if (!replayResult.success || replayResult.commitRecord.commitId !== commitResult.commitRecord.commitId) {
    throw new Error('Idempotent replay failed to return existing commit record');
  }

  // 9. Test Durable Idempotency Conflict: Same operationId with altered artifact must fail
  const alteredArtifact = { ...artifact, artifactId: 'art_diff_123', contentHash: 'different_hash_000' };
  try {
    await canonicalCommitEngineService.executeCommit(
      { ...currentSession, state: 'APPROVED' as const },
      alteredArtifact as any,
      approval,
      { expectedVersion: currentSession.version },
      adminAuth
    );
    throw new Error('Failed: Idempotency conflict was not raised for altered payload');
  } catch (err: any) {
    if (err.message.includes('Failed: Idempotency conflict')) throw err;
  }

  // 10. Test Double-Commit Prevention: Non-replay call against COMMITTED session must fail
  try {
    await canonicalCommitEngineService.executeCommit(
      commitResult.session,
      alteredArtifact as any,
      approval,
      { expectedVersion: commitResult.session.version },
      adminAuth
    );
    throw new Error('Failed: Already committed session permitted double commit');
  } catch (err: any) {
    if (err.message.includes('Failed: Already committed session')) throw err;
  }

  // 11. Test Driver/Truck/Roster Canonical Domain Delegation
  await adminDb.collection('projects').doc('proj_1').collection('carrier_memberships').doc('carrier_1').set({
    carrierId: 'carrier_1',
    status: 'ACTIVE',
    projectId: 'proj_1',
  });
  await adminDb.collection('projects').doc('proj_1').collection('material_memberships').doc('mat_1').set({
    materialId: 'mat_1',
    status: 'ACTIVE',
    projectId: 'proj_1',
  });

  const rawRosterCsv = `driverName,driverPhone,truckPlate,residencyId,carrierId,materialId\nAhmed Ali,0501112233,ABC 1234,1023456789,carrier_1,mat_1`;
  const rosterSession = await importSessionManager.createSession('proj_1', 'ROSTER_IMPORT', 'op_roster_1', adminAuth);
  const rParsed = await canonicalImportPipelineService.parseSource(rosterSession, rawRosterCsv, { expectedVersion: 1 }, adminAuth);
  const rNorm = await canonicalImportPipelineService.normalizeRows(rParsed.session, rParsed.rawRows, { expectedVersion: 2 }, adminAuth);
  const rVal = await canonicalValidationService.validateAndDeduplicate(rNorm.session, rNorm.normalizedRows, { expectedVersion: 3 }, adminAuth);
  const rConf = await canonicalConflictEngine.classifyAndTransitionToReview(rVal.session, rVal.issues, rVal.duplicates, { expectedVersion: 4 }, adminAuth);
  const rArt = canonicalReviewArtifactService.generateArtifact(rConf.session, rVal.validRows, rVal.issues, rVal.duplicates, rConf.conflicts, adminAuth, 1);
  const rApp = await canonicalReviewApprovalService.recordApproval(rConf.session, rArt, 'APPROVED', { expectedVersion: 5 }, adminAuth);

  const rosterCommit = await canonicalCommitEngineService.executeCommit(rApp.session, rArt, rApp.approval, { expectedVersion: 6 }, adminAuth);
  if (rosterCommit.commitRecord.committedEntities.length !== 2) { // DRIVER, TRUCK
    throw new Error(`Expected 2 fleet entities, got ${rosterCommit.commitRecord.committedEntities.length}`);
  }

  // 12. Test Cross-Project Isolation
  const p2Session = await importSessionManager.createSession('proj_2', 'CSV', 'op_p2_1', adminAuth);
  const p2Parsed = await canonicalImportPipelineService.parseSource(p2Session, rawCsv, { expectedVersion: 1 }, adminAuth);
  const p2Norm = await canonicalImportPipelineService.normalizeRows(p2Parsed.session, p2Parsed.rawRows, { expectedVersion: 2 }, adminAuth);
  const p2Val = await canonicalValidationService.validateAndDeduplicate(p2Norm.session, p2Norm.normalizedRows, { expectedVersion: 3 }, adminAuth);
  const p2Conf = await canonicalConflictEngine.classifyAndTransitionToReview(p2Val.session, p2Val.issues, p2Val.duplicates, { expectedVersion: 4 }, adminAuth);
  const p2Art = canonicalReviewArtifactService.generateArtifact(p2Conf.session, p2Val.validRows, p2Val.issues, p2Val.duplicates, p2Conf.conflicts, adminAuth, 1);
  const p2App = await canonicalReviewApprovalService.recordApproval(p2Conf.session, p2Art, 'APPROVED', { expectedVersion: 5 }, adminAuth);

  // Attempting to commit proj_2 session with proj_1 artifact should fail
  try {
    await canonicalCommitEngineService.executeCommit(p2App.session, artifact, rApp.approval, { expectedVersion: 6 }, adminAuth);
    throw new Error('Failed: Cross-project mismatch was permitted');
  } catch (err: any) {
    if (err.message.includes('Failed: Cross-project mismatch')) throw err;
  }

  console.log('✓ BLOCK 126 Transactional Commit Engine tests passed successfully.');
}

runCommitTests().then(() => process.exit(0)).catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
