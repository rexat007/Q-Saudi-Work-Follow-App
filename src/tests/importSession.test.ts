/**
 * BLOCK 120 — Import Session Unit Tests
 */

import { importSessionManager } from '../services/importSessionManager';
import { AuthorizationContext } from '../types/canonicalContracts';

async function runTests() {
  console.log('--- BLOCK 120 Import Session Test Suite Starting ---');

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
  const session = await importSessionManager.createSession('proj_1', 'CSV', 'op_abc', mockAuth);
  if (session.state !== 'SOURCE' || session.version !== 1 || !session.importSessionId) {
    throw new Error('Failed: session creation state/version mismatch');
  }

  // 2. Valid transition SOURCE -> PARSED
  const updated = await importSessionManager.transitionState(session, 'PARSED', { expectedVersion: 1 }, mockAuth);
  if (updated.state !== 'PARSED' || updated.version !== 2) {
    throw new Error('Failed: transition SOURCE -> PARSED');
  }

  // 3. Stale version concurrency mismatch
  let caughtStale = false;
  try {
    await importSessionManager.transitionState(session, 'PARSED', { expectedVersion: 99 }, mockAuth);
  } catch {
    caughtStale = true;
  }
  if (!caughtStale) {
    throw new Error('Failed: stale version concurrency should have been rejected');
  }

  // 4. Forbidden transition SOURCE -> COMMITTED
  let caughtForbidden = false;
  try {
    await importSessionManager.transitionState(session, 'COMMITTED', { expectedVersion: 1 }, mockAuth);
  } catch {
    caughtForbidden = true;
  }
  if (!caughtForbidden) {
    throw new Error('Failed: forbidden transition SOURCE -> COMMITTED should have been rejected');
  }

  // 5. Terminal state protection
  const session5 = await importSessionManager.createSession('proj_1', 'CSV', 'op_4', mockAuth);
  let s = await importSessionManager.transitionState(session5, 'PARSED', { expectedVersion: 1 }, mockAuth);
  s = await importSessionManager.transitionState(s, 'NORMALIZED', { expectedVersion: 2 }, mockAuth);
  s = await importSessionManager.transitionState(s, 'VALIDATED', { expectedVersion: 3 }, mockAuth);
  s = await importSessionManager.transitionState(s, 'REVIEW_REQUIRED', { expectedVersion: 4 }, mockAuth);
  s = await importSessionManager.transitionState(s, 'APPROVED', { expectedVersion: 5 }, mockAuth);
  s = await importSessionManager.transitionState(s, 'COMMITTING', { expectedVersion: 6 }, mockAuth);
  s = await importSessionManager.transitionState(s, 'COMMITTED', { expectedVersion: 7 }, mockAuth);

  if (s.state !== 'COMMITTED') {
    throw new Error('Failed: session should be COMMITTED');
  }

  let caughtTerminal = false;
  try {
    await importSessionManager.transitionState(s, 'FAILED', { expectedVersion: 8 }, mockAuth);
  } catch {
    caughtTerminal = true;
  }
  if (!caughtTerminal) {
    throw new Error('Failed: transition from terminal COMMITTED state should be rejected');
  }

  console.log('✓ BLOCK 120 Import Session tests passed successfully.');
}

runTests().then(() => process.exit(0)).catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
