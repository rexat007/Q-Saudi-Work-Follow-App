# GAP-P5-04 — READ-ONLY DISCOVERY & VERIFICATION REPORT

## 1. Final Discovery Verdict
**OVERALL VERDICT: REAL IMPLEMENTATION GAP**
The existing Phase 5 architecture has a genuine implementation gap for the three operations defining `GAP-P5-04`. While the infrastructure for client-side queueing and server-side domain processing exists partially, there is a total disconnect in the outbox replay, canonical server endpoints, and end-to-end synchronization paths. No code changes, tests, or state advancements have been made in this block.

---

## 2. GAP-P5-04 Definition
`GAP-P5-04` is authoritatively defined as:
**Authoritative replay coverage and convergence for:**
1. `UPDATE_TRIP_STATUS`
2. `RECORD_RECEIPT`
3. `REPORT_EXCEPTION`

---

## 3. Detailed Runtime Path Traces

### UPDATE_TRIP_STATUS Trace
- **Queueing**: **UNVERIFIED / NO** (No production UI or client workflow queues this operation type into the IndexedDB outbox).
- **Payload**: **UNVERIFIED** (No standardized production payload schema exists except within simulated test structures).
- **syncAll() Processing**: **UNVERIFIED / NO** (`syncAll()` contains no branch or conditional logic to handle trip updates; any queued `UPDATE_TRIP_STATUS` operation is mistakenly routed to the `POST /api/projects/:projectId/trips` endpoint, resulting in duplicate creation errors or payload rejections).
- **Server Canonical Endpoint**: **UNVERIFIED / NO** (The server defines `PATCH /api/projects/:projectId/trips/:tripId`, but it is a static mock returning `success: true` and does not invoke any domain service or database update).
- **Canonical Service**: **UNVERIFIED** (The `TripService.transitionTripStatus` method exists in code but is completely unreachable from the outbox sync / endpoint dispatch flow).
- **Authoritative Persistence**: **UNVERIFIED / NO** (No real write to the Firestore database is performed by the sync/replay endpoint).
- **ACK / SYNCED / Cache Update**: **UNVERIFIED / NO** (IndexedDB cache hydration and server-acked status transitions do not occur).

### RECORD_RECEIPT Trace
- **Queueing / Payload / Replay**: **NOT IMPLEMENTED** (Completely absent from both the client outbox loop and the server endpoints).
- **Service / Repository / Write / ACK**: **NOT IMPLEMENTED** (No domain service or repository method exists for RECORD_RECEIPT specifically, nor are there any server-side database handlers).

### REPORT_EXCEPTION Trace
- **Queueing / Payload / Replay**: **NOT IMPLEMENTED** (Completely absent from both the client outbox loop and the server endpoints).
- **Service / Repository / Write / ACK**: **NOT IMPLEMENTED** (No domain service or repository method exists for REPORT_EXCEPTION specifically).

---

## 4. Canonical Service & Repository Mapping

| Operation | Canonical Domain Service | Method Name | Repository & Method | Authoritative Firestore Path |
| :--- | :--- | :--- | :--- | :--- |
| **UPDATE_TRIP_STATUS** | `TripService` (Server) | `transitionTripStatus` | `TripRepository.update` | `projects/{projectId}/trips/{tripId}` |
| **RECORD_RECEIPT** | **NOT IMPLEMENTED** | None | None | None |
| **REPORT_EXCEPTION** | **NOT IMPLEMENTED** | None | None | None |

---

## 5. Runtime & Test Path (ACTUAL / INFERRED / TARGET / UNVERIFIED)

| Trace Component | UPDATE_TRIP_STATUS | RECORD_RECEIPT | REPORT_EXCEPTION |
| :--- | :---: | :---: | :---: |
| **Outbox Queueing** | **UNVERIFIED** | **NOT IMPLEMENTED** | **NOT IMPLEMENTED** |
| **syncAll() Interception** | **UNVERIFIED** | **NOT IMPLEMENTED** | **NOT IMPLEMENTED** |
| **HTTP Dispatch Endpoint** | **UNVERIFIED** (Mocked PATCH) | **NOT IMPLEMENTED** | **NOT IMPLEMENTED** |
| **Auth & Project Isolation**| **TARGET** (Enforced in mock) | **NOT IMPLEMENTED** | **NOT IMPLEMENTED** |
| **RBAC / Policy Checking** | **TARGET** (Enforced in mock) | **NOT IMPLEMENTED** | **NOT IMPLEMENTED** |
| **Canonical Service Dispatch**| **UNVERIFIED** (Mocked) | **NOT IMPLEMENTED** | **NOT IMPLEMENTED** |
| **Authoritative Persistence**| **UNVERIFIED** | **NOT IMPLEMENTED** | **NOT IMPLEMENTED** |
| **Server ACK Returns** | **UNVERIFIED** | **NOT IMPLEMENTED** | **NOT IMPLEMENTED** |
| **IndexedDB Cache Update** | **UNVERIFIED** | **NOT IMPLEMENTED** | **NOT IMPLEMENTED** |
| **Outbox SYNCED Transition** | **UNVERIFIED** | **NOT IMPLEMENTED** | **NOT IMPLEMENTED** |

---

## 6. Conceptual Replay Convergence Matrix

| Operation | Queued | Canonical Replay | Authoritative Write | Authoritative ACK | Cache Convergence | Durable Idempotency | Failure Safe | Test Proof |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **UPDATE_TRIP_STATUS**| **NO** | **NO** | **NO** | **NO** | **NO** | **NO** | **NO** | **NO** |
| **RECORD_RECEIPT** | **NO** | **NO** | **NO** | **NO** | **NO** | **NO** | **NO** | **NO** |
| **REPORT_EXCEPTION** | **NO** | **NO** | **NO** | **NO** | **NO** | **NO** | **NO** | **NO** |

---

## 7. Second-Kitchen Search Results

A full, project-wide search of the codebase yields the following:
- **`tripEngineService`**: Defined in `src/services/tripEngine.service.ts`. It represents the legacy, client-side simulation engine. It is imported and utilized across multiple dashboard, admin, and cleanup services (`src/services/workspace.service.ts`, `dashboard.service.ts`, `adminConsole.service.ts`, etc.) as an in-memory/fallback database. It is **NOT** reachable from any outbox synchronization or conflict-resolution production flow, and does not create parallel database writes during replay.
- **Direct Firestore Mutation**: Absent from outbox sync code (which strictly uses Firestore repositories for checks and delegates mutation writes to server services).
- **Direct IndexedDB Mutation**: Local cache updating in `syncAll` is strictly client-cache hydration matching server returns (preserving the "cache only" invariant).
- **Synthetic ACK / Direct SYNCED Transitions**: None exist in production sync paths.

---

## 8. Failure Semantics
In the current code, any network, `4xx`, or `5xx` error encountered on any operation during `syncAll()` would be caught by the general catch-block, incrementing the retry count and setting the outbox status to `FAILED`. Because `UPDATE_TRIP_STATUS`, `RECORD_RECEIPT`, and `REPORT_EXCEPTION` are not implemented, they cannot reach `SYNCED` under any normal or error execution flow.

---

## 9. Durable Idempotency Status
Durable idempotency utilizing `sync_operations` ledgers is **NOT IMPLEMENTED** for `UPDATE_TRIP_STATUS`, `RECORD_RECEIPT`, or `REPORT_EXCEPTION`. The ledger queries inside `syncAll` are hardcoded to skip checks for anything other than creation, and the server-side update routes do not check or save `sync_operations` records.

---

## 10. Existing Test Evidence
- **Test File**: `src/tests/conflictResolution.test.ts`
- **Tests**: `VERSION_CONFLICT` (Test 1), `TRIP_ALREADY_COMPLETED` (Test 3), `TRIP_ALREADY_RETURNED` (Test 4).
- **Behavior Proven**: These tests construct mocked `UPDATE_TRIP_STATUS` operations *strictly* to test client-side conflict-detection parameters in memory. They do **NOT** cross the canonical HTTP boundary, do **NOT** prove replay, and do **NOT** hit server-side persistence.
- No tests exist covering the replay of `RECORD_RECEIPT` or `REPORT_EXCEPTION`.

---

## 11. Exact Files/Symbols Inspected
- `/src/services/offline/outbox.service.ts` (`syncAll`, `validateOperationServerSide`)
- `/src/services/offline/conflictResolution.service.ts` (`detectConflict`)
- `/src/services/trip.service.ts` (`transitionTripStatus`, `updateTrip`)
- `/server.ts` (Mocked PATCH routes on `/api/projects/:projectId/trips/:tripId` and `/api/trips/:tripId`)
- `/src/repositories/trip.repository.ts` (`update`)
- `/src/types/offline.ts` (Outbox operation types declarations)
- `/src/tests/conflictResolution.test.ts` (Mocks validating status-update conflict detection)

---

## 12. Smallest Logical Unit Required to Resolve GAP-P5-04
Should implementation be authorized, the minimal scope includes:
1. **Client-Side Outbox Replay**: Update `syncAll()` to branch on `operationType` so it can dispatch correct HTTP PATCH/POST calls to dedicated endpoints instead of routing everything to `POST /api/projects/.../trips`.
2. **Server Endpoints Integration**: Convert the mocked PATCH endpoints in `server.ts` to call `serverTripService.transitionTripStatus` so that changes are securely validated and persisted in Firestore, and register idempotency ledger records.
3. **Receipt and Exception Workflows**: Wire `RECORD_RECEIPT` and `REPORT_EXCEPTION` payload states into the sync state machine and add server-side persistence/event tracking.
4. **Idempotency & Cache Convergence**: Propagate `operationId`/`clientUUID` into the database update triggers to prevent double processing, returning complete authoritative Trip payloads to satisfy the "cache only" IndexedDB update.
5. **Harmonization Tests**: Create comprehensive tests verifying outbox replay convergence across status updates, receipts, and exceptions.

---

## 13. Architectural Invariants Validation
The existing design preserves the key invariants:
- **IndexedDB**: Cache only (hydrated by server-acked responses).
- **Outbox**: Mutation queue only.
- **Firestore**: Business authority (mocked endpoints do not write, but the system prevents React from doing direct writes).
- **sync_operations**: Durable ledger (only creators use it currently, but pattern is in place).

---

## 14. Implementation Scope Declaration
**No production code, test files, configuration files, database schemas, or database records were modified or implemented.** The project state remains locked at Phase 5 (In Progress).
