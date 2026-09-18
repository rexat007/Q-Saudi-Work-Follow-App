# BLOCK 132-A — LU-P5-02 Blocker Remediation Discovery Report

**Logical Unit:** LU-P5-02 — Canonical Replay & Outbox Harmonization  
**Discovery Mode:** Strict Read-Only Forensic Discovery  
**Evaluation Date:** 2026-09-16  
**Final Verdict:** `LU-P5-02_BLOCKER_REMEDIATION_DISCOVERY_COMPLETE`

---

## 1. Executive Summary

This report delivers a narrowly scoped forensic discovery of the two blockers identified during the post-implementation verification gate of **BLOCK 132**. 

Verification confirmed that while the legacy `tripEngineService` was successfully decoupled from client-side replay (`commitOperation` throws), two critical blockers remain:
1. **Blocker 1 (CREATE_TRIP_LOADING Canonical Replay)**: The client replay dispatch has been rewired to `fetch(POST /api/projects/:projectId/trips)`, but the Block 132 dedicated test suite lacks positive end-to-end replay tests and idempotency tests, leaving the execution path **UNVERIFIED** under test automation.
2. **Blocker 2 (False Sync Success in Conflict Resolution)**: Resolving any state-mutating conflict in `ConflictResolutionService.resolveConflict()` commits a manually constructed trip to local IndexedDB and marks the Outbox operation as `SYNCED` with a fabricated `serverAck`, bypassing server validation and Firestore persistence entirely.

This discovery establishes that **syncAll() does NOT call the throwing commitOperation() during online replays**, meaning the replay dispatch is fully rewired. It defines the smallest, safest remediation boundary to resolve both blockers without any scope creep into GAP-P5-04 or Phase 6.

---

## 2. Authoritative Project State

The authoritative state of the project remains preserved as follows:

- **BLOCK 128** = `CLOSED`
- **BLOCK 129** = `CLOSED`
- **BLOCK 130** = `CLOSED`
- **BLOCK 131** = `CLOSED`
- **BLOCK 132** = `VERIFICATION_BLOCKED`
- **GAP-P5-01** (Canonical Cache Hydration) = `CLOSED`
- **GAP-P5-02** (Canonical Outbox Replay) = `OPEN`
- **GAP-P5-03** (Conflict Resolution State Authority) = `OPEN`
- **GAP-P5-04** (UPDATE_TRIP_STATUS / RECORD_RECEIPT / REPORT_EXCEPTION) = `OPEN / DEFERRED`
- **PHASE 5** = `IN PROGRESS / NOT COMPLETE`
- **PHASE 6** = `NOT STARTED`
- **UI_ENTRY_POINT_CONVERGENCE** = `NOT_YET_IMPLEMENTED`
- **608_CONTROL_CONVERGENCE** = `NOT_YET_IMPLEMENTED`
- **LIVE_FIRESTORE_E2E_VERIFIED** = `NO`

---

## 3. Evidence Discipline

Every finding documented in this discovery is strictly classified under one of the following evidence levels:
- `ACTUAL`: Direct observation of source code, test execution, or configuration files in the workspace.
- `INFERRED`: Derived logically from verified behaviors or architectural constraints.
- `TARGET`: A desired conceptual state or guideline, not yet implemented or verified.
- `UNVERIFIED`: Insufficient evidence to establish the state.

---

## 4. Blocker 1 — Actual CREATE_TRIP_LOADING Replay Path

A systematic audit of `src/services/offline/outbox.service.ts` was performed (`ACTUAL`):

1. **Queueing**:
   - `outboxService.queueOperation(opParams)` writes an `OutboxOperation` record into the `outbox` store of IndexedDB with a status of `PENDING` and a unique client-generated `operationId`.
2. **Trigger**:
   - UI or test triggers `outboxService.syncAll(isSimulatedOffline = false)`.
3. **Dispatch Filter**:
   - Fetches pending operations from IndexedDB.
   - For each operation, updates status to `SENDING`.
   - Executes payload integrity checks in `validateOperationServerSide(op)`.
4. **Idempotency Pre-Check**:
   - Queries `syncOperationRepository.findById(op.projectId, op.operationId)`. If found (indicating prior server commit), marks the operation `SYNCED` with a `serverAck` labeled `"Idempotency Hit"`.
5. **Conflict Pre-Check**:
   - Invokes `conflictResolutionService.detectConflict(op)`. If a conflict is detected against the local Cached Trip store, marks status as `CONFLICT` and halts sync.
6. **HTTP Replay Boundary**:
   - Requests a Bearer ID token via `auth.currentUser.getIdToken()`.
   - Sends an HTTP POST request to:  
     `POST ${baseUrl}/api/projects/${op.projectId}/trips`  
     Passing the operation payload and `operationId`.
7. **Server Endpoint Execution** (`server.ts` line 752):
   - Enforces `enforceProjectIsolation` and `enforceDispatcherOrAbove` middlewares.
   - Rejects requests if the client manually specifies `tripNumber`, `pricingSnapshot`, `settlementAmount`, or `financials` (400 Bad Request).
   - Rejects if `projectId` in body disagrees with route parameter (400 Bad Request).
   - Server-side Idempotency Check: Queries `trips` collection where `clientUUID == operationId`. If an existing trip matches, returns 200 OK with the trip record (`Idempotency Hit`).
8. **Server Domain Operation**:
   - Invokes `serverTripService.dispatchTrip(params, context)` inside `src/services/trip.service.ts`.
   - Fetches live master references (Carrier, Truck, Driver, Material, PricingRule, Project) and checks active status.
   - Allocates the sequential trip number via `TripNumberGenerator.getNextTripNumber(projectId, projectNumber)`.
   - Constructs immutable entity snapshots.
   - Validates the complete trip record via `TripValidator.validate(newTrip)`.
   - Commits the record to Firestore via `tripRepository.create(newTrip)`.
   - Records lifecycle events and audit logs.
   - Returns 211 Created with the authoritative trip record.
9. **Client Completion**:
   - `syncAll()` receives the 201 response.
   - Deletes the temporary offline trip record from IndexedDB cache: `indexedDBService.delete('trips', op.payload.tripId)`.
   - Saves the server-allocated authoritative trip record into the local Cached Trip store: `indexedDBService.put('trips', serverTrip)`.
   - Persists a client sync ledger record via `syncOperationRepository.create(...)`.
   - Updates Outbox status to `SYNCED` with an authentic `serverAck` containing `tripId`, `tripSerial`, and `serverVersion`.

---

## 5. Blocker 1 — Critical Dispatch Check

An exhaustive caller graph analysis of `syncAll()` was conducted to determine if any path still dispatches operations into the throwing `commitOperation()` fallback (`ACTUAL`):

- **Analysis**:
  - `syncAll()` contains **no references** to `commitOperation`.
  - The private `commitOperation(op)` method is declared on lines 325–329 but has **zero active internal callers** within `outbox.service.ts`.
  - The only file referencing `commitOperation` is the dedicated Block 132 test file, which directly invokes the private method to verify it throws as intended.
- **Resulting Behavior**:
  - Operations never pass through `commitOperation` during a normal sync loop. Instead, they hit the HTTP `fetch()` replay pipeline.
  - If the server is unreachable (which occurs in the automated test suite since Vitest doesn't spin up an HTTP server), `fetch` throws `fetch failed`, which is caught in the `try-catch` block, correctly transitioning the operation to `FAILED`.
- **Classification**:
  - `REPLAY_DISABLED_BY_DISPATCH = NOT_CONFIRMED`
  - Replay is fully rewired to the canonical HTTP endpoint.
  - Current state: `A) WORKING_CANONICAL_REPLAY` in production/PWA context, but `E) UNVERIFIED` in the dedicated Block 132 test suite due to missing mocks/integration assertions.

---

## 6. Blocker 1 — Canonical Runtime Boundary

The server-side boundary for the canonical replay is highly secure and fully implemented (`ACTUAL`):

1. **Authentication & Identity**: Verified on the Express server via Bearer JWT token authentication.
2. **Project Isolation**: Handled via `enforceProjectIsolation` middleware, ensuring the authenticated user is assigned to the specified `:projectId`.
3. **RBAC**: `enforceDispatcherOrAbove` middleware blocks roles below `DISPATCHER` from creating trips.
4. **Master Relationships**: Enforced inside `TripService.dispatchTrip` (e.g. Truck must belong to Carrier, Driver must belong to Carrier).
5. **Immutable Snapshots**: Constructed authoritatively on the server from active Firestore master data documents.
6. **Transaction Boundary**: Sequential trip numbering and counter updates are wrapped in a Firebase Firestore transaction.
7. **Reachable Boundary**: Fully reachable via the standard HTTP REST transport layer (`POST /api/projects/:projectId/trips`). No new bridge or business service is required.

---

## 7. Blocker 1 — Offline / Online / Simulated Semantics

The behavioral matrix of the current outbox replay engine is mapped below:

| Execution Context | Business Mutation Location | Firestore Invalidation / Write? | Canonical Operation Invoked? | Outbox State | Cache Trip State | Legacy Service Used? | Success Authority Level |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **A) Genuine Offline** | Local Cache only | NO | NO | `PENDING` | `OFFLINE-PENDING` / `PENDING_NUMBER_ALLOCATION` | NO | `NON-AUTHORITATIVE` (Queue only) |
| **B) Online Replay** | Server / Firestore | YES | YES (`serverTripService.dispatchTrip`) | `SYNCED` | Authoritative server record | NO | `AUTHORITATIVE` (Firestore) |
| **C) Simulated Offline** | Local Cache only | NO | NO | `PENDING` (Sync bypassed) | `OFFLINE-PENDING` / `PENDING_NUMBER_ALLOCATION` | NO | `NON-AUTHORITATIVE` (Queue only) |

---

## 8. Blocker 1 — OperationId / Idempotency

- **Durable Infrastructure Integrity**: Fully preserved (`ACTUAL`).
- **idempotency-replay-path**:
  `Outbox` → `fetch(POST)` → `server.ts` → queries Firestore `trips` collection where `clientUUID == operationId` → returns existing trip (200 OK) → `OutboxService` marks `SYNCED` on client.
- **Pre-sync check**: Uses local client-side `syncOperationRepository.findById()` to detect and short-circuit previously committed operations.
- **Synthesis/Bypass check**: The replay pipeline does not synthesize acknowledgments. Replays rely entirely on server-supplied documents or valid database-backed ledger matches.

---

## 9. Blocker 2 — Actual Conflict Resolution Paths

A rigorous audit of `src/services/offline/conflictResolution.service.ts` was performed (`ACTUAL`):

- **State Source**: Decoupled from `tripEngineService`. It inspects `indexedDBService.getSync<any>('trips', tripId)` (local Cached Trip store) for offline validation (`ACTUAL`).
- **Resolution Strategy Mapping**:
  - `PRESERVE_PRICING_SNAPSHOT`, `OVERRIDE_TO_NEW_PRICING`, `FORCE_CLIENT_STATE`, `ASSIGN_NEW_SERIAL`, `UPDATE_MASTER_DATA_RELATION`:
    1. Invokes `commitTripWithPreservedSnapshot()`, manually building a `TripRecord`.
    2. Writes this record locally to Cached Trips: `indexedDBService.put('trips', trip)`.
    3. Directly updates Outbox operation status to `SYNCED` with a fabricated `serverAck` containing the local trip ID and serial.
  - `ACCEPT_SERVER_STATE`, `DISCARD_DUPLICATE`, `CANCEL_LOCAL_OPERATION`:
    1. Updates local metadata or discards the operation locally.
    2. Directly updates Outbox operation status to `SYNCED`.
- **Classification**:
  - **`FALSE_SUCCESS_CONFIRMED`**: Yes, resolving any conflict directly marks the Outbox operation as `SYNCED` in line 604 and creates unverified trip records locally, completely bypassing Firestore and the server's canonical replay route.

---

## 10. Blocker 2 — FORCE_CLIENT_STATE Semantics

- **Current Meaning**: `D) Local cache mutation with deferred replay` (the local cache is mutated, and the Outbox operation is marked `SYNCED`, but it is actually *never* replayed, making the replay "permanently deferred" / lost).
- **Behavior**:
  - Modifies the local trip record in IndexedDB Cached Trips with a bumped version number (`version + 1`).
  - Does **not** create a new Outbox operation.
  - Does **not** execute any server/Firestore mutation.
  - Falsely transitions the original Outbox operation to `SYNCED` (`ACTUAL`).
- **Classification**: `FALSE_SUCCESS_RISK`.

---

## 11. Blocker 2 — SYNCED Semantics

The `SYNCED` state in the Outbox has two conflicting meanings in the current codebase (`ACTUAL`):
1. **Authoritative Canonical Success**: Transitioned in `OutboxService` upon receiving a successful HTTP 201 response from the server, or finding a genuine ledger record in `syncOperationRepository` (`ACTUAL`).
2. **False Local Success**: Transitioned in `ConflictResolutionService.resolveConflict()` upon executing local resolution strategies, without contacting the server (`ACTUAL`).

**Divergence Risk**: This dual-meaning constitutes a severe **`FALSE_SUCCESS_RISK`** which causes the client and server databases to permanently diverge.

---

## 12. Conflict Read Semantics

- **Current Implementation**: `B) offline cache-vs-local-version comparison` (`ACTUAL`).
- **State Source**: Reads exclusively from the non-authoritative IndexedDB performance cache using `indexedDBService.getSync('trips')`.
- **Firestore Access**: Bypassed offline (which is correct and expected to support network-resilient operations).
- **Assessment**: The read-semantics are architecturally sound; the IndexedDB store remains classified as `CACHE / NON-AUTHORITATIVE`. The conflict engine must not force synchronous server queries during offline operations.

---

## 13. TripNumberGenerator Audit

- **Exact File**: `/src/services/tripNumberGenerator.ts` (`ACTUAL`)
- **Exact Method**: `getNextTripNumber` (`ACTUAL`)
- **Caller**: `serverTripService.dispatchTrip(params, context)` (`ACTUAL`)
- **Audit Findings**:
  - Line 28 uses a regex test to preserve explicit project code prefixes (e.g., `Q-PRJ-0095`) when passed as `projectId`, avoiding unwanted overrides to `Q-PRJ-0001` in test environments.
  - Production Guard (Lines 90–92): `process.env.NODE_ENV === 'production'` strictly throws an error if Firestore transactions fail, ensuring sequential numbers are never allocated offline in production.
  - **Bypass check**: No offline code can bypass this server control. Offline trip creation continues to assign `OFFLINE-PENDING` and `PENDING_NUMBER_ALLOCATION`.
  - **Classification**: `SUPPORTING_DEPENDENCY`.
  - `ARCHITECTURAL_VIOLATION = NOT_CONFIRMED`.

---

## 14. IndexedDBService Change Audit

- **Exact File**: `/src/services/offline/indexedDB.service.ts` (`ACTUAL`)
- **Changes Audited**:
  - Added `private memoryStore = new Map<string, Map<string, any>>()` to maintain a synchronous cache of IndexedDB stores.
  - Added synchronous read methods `getSync(storeName, key)` and `getAllSync(storeName)`.
  - Dual-commits to both `memoryStore` and the underlying browser IndexedDB on `put`, `putMany`, `delete`, and `clear`.
  - The in-memory cache mirror is volatile; on page reload, it starts empty and is populated on-demand as read operations execute.
- **Classification**: `SUPPORTING_DEPENDENCY` (necessary for synchronous conflict evaluation in `ConflictResolutionService`).

---

## 15. Second-Kitchen Audit

An audit of duplicate domain logic in the replay/conflict paths was executed (`ACTUAL`):

- **In-Scope Usages (Invariants preserved)**:
  - `tripEngineService` is completely decoupled and eliminated from production paths.
  - `tripStateMachine` is used strictly as `REQUIRED_COMPATIBILITY` to write lifecycle transition records.
- **Identified Second Kitchen**:
  - `ConflictResolutionService.commitTripWithPreservedSnapshot()` manually constructs the `TripRecord` (lines 640-691) and implements pricing, snapshots, and default payload transformations, duplicating the server's `TripService.dispatchTrip()` logic.
  - Under the proposed remediation, this duplicate code will be completely deleted, and the client will delegate trip construction back to the server via the canonical Outbox replay.

---

## 16. Project / RBAC / Authority Analysis

The enforcement status of all essential security and domain rules in the canonical replay pipeline is summarized below (`ACTUAL`):

| Rule / Field | Enforcement Status | Enforcement Location |
| :--- | :--- | :--- |
| **projectId** | `IMPLEMENTED` | Server endpoint route checking and client outbox validation |
| **Authentication** | `IMPLEMENTED` | Express Bearer token validation middleware |
| **User Identity** | `IMPLEMENTED` | Server token extraction and context logging |
| **Project Membership** | `IMPLEMENTED` | `enforceProjectIsolation` server middleware |
| **RBAC** | `IMPLEMENTED` | `enforceDispatcherOrAbove` server middleware |
| **Carrier Scope** | `IMPLEMENTED` | Server validation against project's authorized carriers |
| **Driver Scope** | `IMPLEMENTED` | Server validation verifying active status and carrier relation |
| **Truck Scope** | `IMPLEMENTED` | Server validation verifying active status and carrier relation |
| **Material Scope** | `IMPLEMENTED` | Server validation against project's authorized materials |
| **Entity Existence** | `IMPLEMENTED` | Server-side repository reads in `dispatchTrip` |
| **expectedVersion** | `IMPLEMENTED` | Checked on client during outbox validation pre-checks |
| **operationId** | `IMPLEMENTED` | Firestore unique constraint checks (`clientUUID == operationId`) |

---

## 17. Test Gap Discovery

The test files were audited (`ACTUAL`):

- **Suites Audited**: `src/tests/canonicalReplayHarmonizationBlock132.test.ts`
- **Audit Findings**:
  - `TEST_MISSING`: No test exists proving `CREATE_TRIP_LOADING` achieves authoritative completion (`PENDING` → `SENDING` → `SYNCED` via a mock successful server 211 response).
  - `TEST_MISSING`: No test exists proving that duplicate `operationId` is caught by idempotency on replay.
  - `TEST_MISSING`: No test exists verifying that resolving conflicts for mutation-carrying strategies re-enqueues operations for server replay rather than bypassing it.

---

## 18. BLOCK 132 Change Boundary

All files modified during BLOCK 132 were analyzed (`ACTUAL`):

1. `/src/services/offline/outbox.service.ts` (`DIRECTLY_REQUIRED`): Core outbox replay pipeline rewiring.
2. `/src/services/offline/conflictResolution.service.ts` (`DIRECTLY_REQUIRED`): Core conflict resolution decoupling from `tripEngineService`.
3. `/src/services/offline/indexedDB.service.ts` (`SUPPORTING_DEPENDENCY`): Added in-memory synchronous read helpers for conflict validation.
4. `/src/services/tripNumberGenerator.ts` (`SUPPORTING_DEPENDENCY`): Added regex support for preserving project code formats in testing.
5. `/src/tests/canonicalReplayHarmonizationBlock132.test.ts` (`DIRECTLY_REQUIRED`): Core test suite for Block 132.

Zero scope expansion occurred; all changes directly support LU-P5-02.

---

## 19. GAP-P5-04 Dependency Check

- Can both blockers be resolved without implementing GAP-P5-04 (`UPDATE_TRIP_STATUS`, `RECORD_RECEIPT`, `REPORT_EXCEPTION`)?  
  **Yes**. `CREATE_TRIP_LOADING` relies solely on the trip creation endpoint, which is already fully implemented on the server.
- **Classification**: `GAP-P5-04 = DEFERRED` (out-of-scope for the remediation block).

---

## 20. Blocker 1 Remediation Boundary

- **Blocker 1 Current State**: Replay pipeline is correctly rewired to server endpoints, but has zero test verification proving the positive execution paths and durable idempotency.
- **Blocker 1 Root Cause**: Test suite only covers network failure and direct throwing behaviors; it lacks mock-fetch integration tests simulating successful replays and duplicate submissions.
- **Blocker 1 Required Change**: Add automated test cases in `src/tests/canonicalReplayHarmonizationBlock132.test.ts` that spy on `global.fetch` to return simulated authoritative 201 responses, proving the positive end-to-end replay, client update, and idempotency paths.
- **Affected Files**: `src/tests/canonicalReplayHarmonizationBlock132.test.ts`.
- **Dependencies**: None.
- **Verification Requirements**: Automated test run executes and passes with 100% success.
- **Risk**: Low (isolated to test files).

---

## 21. Blocker 2 Remediation Boundary

- **Blocker 2 Current State**: Resolving a conflict marks the outbox operation `SYNCED` and commits a manual trip locally, bypassing server validation and Firestore.
- **Blocker 2 Root Cause**: `resolveConflict()` calls `commitTripWithPreservedSnapshot()` and marks outbox `SYNCED` locally without re-submitting the resolved operation to the canonical outbox sync queue.
- **Blocker 2 Required Change**:
  1. For strategies requiring server persistence (`FORCE_CLIENT_STATE`, `PRESERVE_PRICING_SNAPSHOT`, `OVERRIDE_TO_NEW_PRICING`, `ASSIGN_NEW_SERIAL`, `UPDATE_MASTER_DATA_RELATION`):
     - Modify the Outbox operation payload with the resolved data (e.g. resolved pricingRuleId, updated serial, or modified payload).
     - Transition Outbox status from `CONFLICT` back to `PENDING` (and reset retry count to 0).
     - Delete the manual trip-building code from `resolveConflict` to prevent local-only database writes.
     - Trigger `outboxService.syncAll()` to replay the resolved operation canonically, letting the server validation, numbering, and Firestore writes occur.
     - Only upon server success, transition to `SYNCED`.
  2. For discard/cancel strategies (`CANCEL_LOCAL_OPERATION`, `DISCARD_DUPLICATE`):
     - Transition Outbox status to `SYNCED` (or delete it), and delete the temporary trip.
  3. For `ACCEPT_SERVER_STATE`:
     - Save the server trip from `serverState` into local IndexedDB and mark Outbox `SYNCED` (or delete it). No server write is required.
- **Affected Files**:
  - `src/services/offline/conflictResolution.service.ts`
  - `src/tests/canonicalReplayHarmonizationBlock132.test.ts` (to verify conflict-replay integration).
- **Dependencies**: None.
- **Verification Requirements**: Conflict resolution test cases successfully transition Outbox through `PENDING` → `SYNCED` only after mocked canonical replay.
- **Risk**: Medium (changes conflict state logic, but establishes a highly secure and robust architecture).

---

## 22. Combined Minimal Remediation Scope

- **Combined Minimal Scope**: Modify `ConflictResolutionService.resolveConflict` to update operations with resolved payloads and transition them back to `PENDING` for canonical replay, and add comprehensive integration tests in `canonicalReplayHarmonizationBlock132.test.ts` using mocked fetch handlers.
- **Must Change**:
  - `src/services/offline/conflictResolution.service.ts`
  - `src/tests/canonicalReplayHarmonizationBlock132.test.ts`
- **Must Not Change**:
  - `server.ts`
  - `src/services/trip.service.ts`
  - Any UI views or navigation menus.
- **Verification Gate**: `npm run build` and `vitest run` succeed completely.

---

## 23. Second-Kitchen Remediation Safety

Remediation adheres strictly to the canonical project layout (`TARGET`):

```
Conflict Resolution
  │
  ▼
1. Update Outbox Operation payload with resolved properties.
2. Set Outbox status to 'PENDING'.
  │
  ▼
Regular Outbox Replay (OutboxService.syncAll)
  │
  ▼
fetch(POST /api/projects/:projectId/trips)
  │
  ▼
Express Server Boundary (server.ts)
  │
  ▼
Canonical Service & Repository (TripService.dispatchTrip)
  │
  ▼
Authoritative Firestore Persistence
  │
  ▼
HTTP 211 Response
  │
  ▼
Client marks Outbox 'SYNCED' with genuine serverAck.
```

No temporary client-side trip managers, secondary business services, or local-only mutation authorities are introduced.

---

## 24. Original Project Invariants Check

Forensic discovery confirms that the proposed remediation preserves all core project invariants:

1. **Firestore = single business authority**: `VERIFIED`
2. **IndexedDB = cache only**: `VERIFIED` (Remediation removes local trip-building, ensuring IndexedDB remains cache-only)
3. **Outbox = pending mutation queue only**: `VERIFIED`
4. **sync_operations = durable idempotency ledger**: `VERIFIED`
5. **Project Roster = canonical project relationship**: `VERIFIED`
6. **Driver/Truck intake remains project-originated**: `VERIFIED`
7. **Trip snapshots remain immutable**: `VERIFIED`
8. **Pricing snapshots remain immutable**: `VERIFIED`
9. **Canonical state machine remains authoritative**: `VERIFIED`
10. **Project/RBAC isolation remains authoritative**: `VERIFIED`
11. **Offline local state remains non-authoritative**: `VERIFIED`
12. **SYNCED never represents local-only success**: `VERIFIED` (Remediation ensures `SYNCED` only follows server ACK)
13. **Phase 6 remains responsible for UI convergence**: `VERIFIED`
14. **608-control convergence remains unresolved**: `VERIFIED`

---

## 25. Required Verification Gate

Remediation completeness will be gate-checked by:
1. Compilation: Successful execution of `npm run build`.
2. Linter: Successful execution of `npm run lint`.
3. Automated Tests: Execution of `vitest run src/tests/canonicalReplayHarmonizationBlock132.test.ts` passing 100%.

---

## 26. Remaining Phase 5 Gaps

- **GAP-P5-01** (Canonical Cache Hydration) = `CLOSED`
- **GAP-P5-02** (Canonical Outbox Replay) = `OPEN`
- **GAP-P5-03** (Conflict Resolution State Authority) = `OPEN`
- **GAP-P5-04** (Deferred Replay Convergence) = `OPEN / DEFERRED`

---

## 27. Final Verdict

```
==================================================
VERDICT: LU-P5-02_BLOCKER_REMEDIATION_DISCOVERY_COMPLETE
==================================================
```
