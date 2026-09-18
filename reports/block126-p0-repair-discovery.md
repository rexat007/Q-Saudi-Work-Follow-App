# BLOCK 126 — P0 Repair Discovery Report
**Block Title:** Transactional Commit Engine & Canonical Service Delegation  
**Topic:** Atomic Commit Boundary & Durable Idempotency  
**Discovery Timestamp:** 2026-09-16T14:10:00Z  
**Verdict:** `REPAIR_PATH_CONFIRMED`

---

## 1. Executive Summary & Objective
This discovery audit formulates the minimal, architecturally rigorous repair path to eliminate two confirmed P0 blockers in BLOCK 126:
- **BLK-126-01:** Lack of atomic multi-entity transaction / partial failure rollback across domain writes.
- **BLK-126-02:** Transient in-memory storage of commit records and idempotency registries.

---

## 2. Existing Transaction Infrastructure in Codebase
- **SDK & Environment:** Firebase Web Modular SDK v9 (`firebase/firestore`).
- **Core Primitives Available:** `runTransaction(db, updateFunction)` and `writeBatch(db)`.
- **Existing Production Usage:**
  - `src/services/projectNumberGenerator.ts` (lines 35–45): Uses `runTransaction` to atomically increment project sequence numbers.
  - `src/services/tripNumberGenerator.ts` (lines 52–65): Uses `runTransaction` to atomically issue next trip sequential IDs.
- **Repository Abstraction:**
  Canonical repositories (`trip.repository.ts`, `driver.repository.ts`, `truck.repository.ts`, `projectCarrierRoster.repository.ts`, `importBatch.repository.ts`) currently execute independent `setDoc`/`updateDoc` calls. They do not yet accept an optional `transaction?: Transaction` context.

---

## 3. Firestore Schema & Rules Capabilities (Zero-Change Solution)
An audit of `firebase-blueprint.json` and `firestore.rules` reveals that all necessary durable collection structures already exist and are secured:

1. **`projects/{projectId}/import_batches/{batchId}`**
   - **Status in Rules:** Fully defined with role permissions (`PROJECT_ADMIN`, `DISPATCHER`, `SUPERVISOR`, `SUPER_ADMIN`).
   - **Schema Properties:** `batchId`, `projectId`, `batchType`, `totalRecords`, `processedRecords`, `failedRecords`, `status`, `createdAt`, `createdBy`, `updatedAt`, `updatedBy`.
   - **Capability:** Holds the durable `CanonicalCommitRecord`, `commitId`, `immutabilityHash`, and session snapshot.

2. **`projects/{projectId}/sync_operations/{operationId}`**
   - **Status in Rules:** Fully defined idempotency ledger with audit stamping.
   - **Capability:** Provides project-scoped atomic operation reservation for duplicate detection across restarts and distributed instances.

3. **`audit_logs/{auditLogId}`**
   - **Status in Rules:** Append-only immutable log.

**Result:** **0 schema changes and 0 firestore.rules changes required.**

---

## 4. Atomic Commit Boundary Architecture
### Design
The commit engine's `executeCommit` method will utilize Firestore's `runTransaction`:
1. **Atomic Read Phase:**
   - Read the import session / batch document at `projects/{projectId}/import_batches/{importSessionId}`.
   - Verify `state === 'APPROVED'` and `version === expectedVersion`.
   - Read the idempotency reservation document at `projects/{projectId}/sync_operations/{operationId}`.
   - If already completed: return `IDEMPOTENT_REPLAY` without re-executing writes.
   - If in-flight under another actor/version: abort with concurrency / idempotency conflict.
2. **Atomic Write Phase:**
   - Execute all domain entity mutations inside the transaction context (`transaction.set(...)`):
     - Roster records → `projects/{projectId}/roster/{rosterId}`
     - Drivers → `projects/{projectId}/drivers/{driverId}`
     - Trucks → `projects/{projectId}/trucks/{truckId}`
     - Trips → `projects/{projectId}/trips/{tripId}`
   - Write immutable `CanonicalCommitRecord` to `projects/{projectId}/import_batches/{importSessionId}` with status `COMMITTED` and computed `immutabilityHash`.
   - Update `sync_operations` entry to status `PROCESSED`.
3. **Outcome:** All domain entities, session state, idempotency marker, and commit record commit together in a single atomic Firestore commit. If any entity fails or encounters a conflict, Firestore automatically rolls back all mutations.

---

## 5. Durable Idempotency & Multi-Instance Concurrency
| Scenario | Behavior under Proposed Architecture |
|---|---|
| **Same operationId + Same artifact** | `runTransaction` reads existing `import_batches` record with status `COMMITTED` and returns `IDEMPOTENT_REPLAY` without executing writes. |
| **Same operationId + Different artifact** | `runTransaction` detects mismatched `contentHash` or `artifactId` and throws `IDEMPOTENCY_CONFLICT`. |
| **Process / Container Restart** | State is read directly from Firestore; replay protection remains 100% intact. |
| **Concurrent Multi-Instance Requests** | Firestore transactions lock document reads; only one transaction commits, the second retries and encounters `COMMITTED` status. |
| **Partial Failure** | Transaction aborts completely. No orphaned records remain in Firestore. |

---

## 6. Minimal Repair Scope
### A. Files to Modify (Bounded to Transaction Context Support):
1. `src/repositories/trip.repository.ts`: Add optional `transaction?: Transaction` to `create`/`update`.
2. `src/repositories/driver.repository.ts`: Add optional `transaction?: Transaction` to `create`/`update`.
3. `src/repositories/truck.repository.ts`: Add optional `transaction?: Transaction` to `create`/`update`.
4. `src/repositories/projectCarrierRoster.repository.ts`: Add optional `transaction?: Transaction` to `create`/`update`.
5. `src/repositories/importBatch.repository.ts`: Add optional `transaction?: Transaction` to `create`/`update`.
6. `src/services/commitEngine.service.ts`: Implement `runTransaction` boundary and durable Firestore storage via `importBatchRepository`.
7. `src/tests/commitEngine.test.ts`: Add tests for atomic rollback, restart simulation, and durable idempotency.

### B. Files That MUST NOT Change (Preserved & Protected):
- `src/services/importPipeline.service.ts` (Block 121)
- `src/services/validationPipeline.service.ts` (Block 122)
- `src/services/conflictEngine.service.ts` (Block 123)
- `src/services/reviewArtifact.service.ts` (Block 124)
- `src/services/reviewApproval.service.ts` (Block 125)
- `firestore.rules` (Strictly untouched)
- `firebase-blueprint.json` (Strictly untouched)

---

## 7. Recommended Repair Sequence (When Authorized)
- **Step 1:** Enhance canonical repositories to accept optional `transaction?: Transaction` parameter.
- **Step 2:** Refactor `CanonicalCommitEngineService.executeCommit` to execute within `runTransaction(db, async (transaction) => { ... })`.
- **Step 3:** Persist commit records and session states into `importBatchRepository` (durable Firestore path).
- **Step 4:** Verify multi-instance concurrency, restart survival, and partial failure atomicity in test suite.
- **Step 5:** Run full regression suite across Blocks 120–126.

---

## 8. Final Discovery Verdict

# `REPAIR_PATH_CONFIRMED`
*(Both P0 blockers can be cleanly resolved using existing Firestore transaction primitives and established schema collections with zero schema or security rule alterations).*
