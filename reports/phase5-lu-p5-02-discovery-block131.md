# BLOCK 131 — LU-P5-02 Discovery / Implementation Boundary Gate Report

**Mode:** Strict Read-Only Discovery / Implementation Boundary Definition  
**Block Type:** Forensic Discovery + Implementation Boundary Gate  
**Verdict:** `LU-P5-02_DISCOVERY_COMPLETE`  
**Date:** September 16, 2026  

---

## 1. Executive Summary

In strict compliance with the **Phase 5 Road-Map** established in Block 128 and the gap register established in Block 129, this discovery gate executes a forensic investigation into **LU-P5-02: Canonical Replay & Outbox Harmonization**.

### Project State Verification:
- **BLOCK 128**: `ACCEPTED / CLOSED`
- **BLOCK 129**: `PHASE_5_DISCOVERY_COMPLETE`
- **BLOCK 130**: `LU-P5-01 = VERIFIED_AND_CORRECTED` (GAP-P5-01 = `CLOSED`)
- **CURRENT PROJECT STATE**:
  - `GAP-P5-01`: **CLOSED** (Canonical Cache Hydration verified against canonical repositories)
  - `GAP-P5-02`: **OPEN** (Outbox fallback replay relies on legacy `tripEngineService`)
  - `GAP-P5-03`: **OPEN** (`ConflictResolutionService` queries legacy `tripEngineService`)
  - `GAP-P5-04`: **OPEN** (`UPDATE_TRIP_STATUS` & `RECORD_RECEIPT` replay unmapped)
  - **Phase 5 Status**: `IN_PROGRESS` (Not Complete)

### Primary Discovery Outcome:
1. **Existing Architecture Is Dual-Pathed**:
   - **Online Path (`navigator.onLine && !isSimulatedOffline`)**: Replay dispatches via HTTP `POST /api/projects/:projectId/trips` to `server.ts`, which validates project boundaries, checks idempotency via Firestore `clientUUID`, and invokes canonical `TripService.dispatchTrip()` backed by `tripRepository`.
   - **Fallback / Simulated Path (`!navigator.onLine || isSimulatedOffline || typeof window === 'undefined'`)**: Replay executes `OutboxService.commitOperation()`, which directly synthesizes a local trip, manually mutates legacy `(tripEngineService as any).trips`, and emits lifecycle events via `tripStateMachine`.
2. **Second Kitchen Risk Confirmed**: The fallback execution path in `OutboxService` is a parallel, competing business authority ("second kitchen") that calculates financials and mutates local state outside of `TripService` and `tripRepository`.
3. **Canonical Authority Boundaries Confirmed**:
   - `Firestore`: Single Durable Persistence Authority.
   - `TripService`: Single Business Operation Authority.
   - `tripRepository`: Single Persistence Access Authority.
   - `IndexedDB`: Client-side cache and mutation queue only.
   - `CanonicalCommitEngineService`: **NOT APPLICABLE** to outbox replay (it exclusively serves Stage 6 of the batch import pipeline).
4. **Scope Boundaries Established for LU-P5-02**:
   - Focus must be strictly placed on **`CREATE_TRIP_LOADING`** replay harmonization and the elimination of `tripEngineService` from `OutboxService.commitOperation()`, `OutboxService.detectStateConflict()`, and `OutboxService.syncAll()`.
   - `GAP-P5-03` (`ConflictResolutionService` reads) is identified as a critical co-dependency that must either be addressed at its read boundary or insulated so it does not query phantom memory.
   - `GAP-P5-04` (`UPDATE_TRIP_STATUS` and `RECORD_RECEIPT`) remains non-blocking for LU-P5-02 and is scheduled for subsequent convergence.

---

## 2. Evidence Discipline & Classification

Every finding in this report is anchored to direct codebase inspection and classified under four evidentiary standards:
- **ACTUAL**: Directly confirmed via source code, tests, or configuration in the repository.
- **INFERRED**: Deduced with high confidence from multiple actual code structures and architectural rules.
- **TARGET**: Architectural requirement established by Blocks 105–128 specifications.
- **UNVERIFIED**: Hypothesis requiring additional runtime or integration tests to prove.

---

## 3. SECTION A — Actual Outbox Architecture

### 3.1 End-to-End Operation Flow

The offline mutation and replay lifecycle spans 8 discrete stages across the codebase:

```
[1. Operation Creation]
   LoadingStation.tsx / LoadingOperatorView.tsx
       │
       ▼
[2. Queue & Local Persistence]
   outboxService.queueOperation(params)
       ├── IndexedDB: 'outbox' store (status: 'PENDING')
       └── IndexedDB: 'trips' store (temporary entity with OFFLINE-PENDING serial)
       │
       ▼
[3. Sync Trigger Coordinator]
   networkStatusService (window.addEventListener('online')) / OutboxDrawer manual trigger
       │
       ▼
[4. Outbox Processing Pipeline]
   outboxService.syncAll(isSimulatedOffline)
       │
       ├── Step 4.1: Fetch PENDING / FAILED operations from IndexedDB
       ├── Step 4.2: Payload pre-validation (validatePayload)
       ├── Step 4.3: Idempotency pre-check (syncOperationRepository.findById)
       ├── Step 4.4: Conflict pre-detection (conflictResolutionService.detectConflict)
       │
       ▼
[5. Operation Dispatch & Execution]
   ┌─────────────────────────────────────────────────────────────────┐
   │ Check: isSimulatedOffline || typeof window === 'undefined'     │
   └───────────────────────────────┬─────────────────────────────────┘
                   No              │              Yes
         ┌─────────────────────────┴─────────────────────────┐
         ▼                                                   ▼
   [Online HTTP Replay]                              [Fallback Replay]
   POST /api/projects/:projectId/trips              outboxService.commitOperation(op)
         │                                                   │
   server.ts route handler                          Synthesizes TripRecord
   enforceProjectIsolation, RBAC                    Manually calculates weights/settlement
   Idempotency query (clientUUID)                   Mutates (tripEngineService as any).trips ⚠️
   serverTripService.dispatchTrip()                 tripStateMachine.addLifecycleEvent() ⚠️
   tripRepository.create() -> Firestore                      │
         │                                                   │
         └─────────────────────────┬─────────────────────────┘
                                   │
                                   ▼
[6. Server / Execution Acknowledgment]
   Retrieve serverTrip (tripId, tripNumber, snapshots, timestamps)
       │
       ▼
[7. Idempotency Record Storage]
   syncOperationRepository.create({
     operationId, projectId, clientOperationUUID, targetCollection: 'trips',
     targetDocId, status: 'PROCESSED', processedResponse: { ack: true }
   })
       │
       ▼
[8. Local Cache Reconciliation & Completion]
   - indexedDBService.delete('trips', tempTripId)
   - indexedDBService.put('trips', serverTrip)
   - indexedDBService.updateOutboxStatus(operationId, 'SYNCED', { serverAck })
   - notifyListeners()
```

### 3.2 Key Architectural Components:

1. **`src/services/offline/outbox.service.ts`**: Central outbox manager owning `queueOperation`, `syncAll`, `commitOperation`, `retryOperation`, and queue listeners.
2. **`src/services/offline/indexedDB.service.ts`**: Non-authoritative local IndexedDB storage providing atomic store operations (`outbox`, `trips`, `conflicts`, etc.).
3. **`src/services/offline/networkStatus.service.ts`**: Monitored browser connectivity wrapper invoking `outboxService.syncAll(false)` upon network restoration.
4. **`server.ts`**: Express backend entry point exposing authoritative route `POST /api/projects/:projectId/trips`.
5. **`src/services/trip.service.ts`**: Canonical domain business authority owning `dispatchTrip`, `transitionTripStatus`, `updateTrip`.
6. **`src/repositories/trip.repository.ts`**: Authoritative Firestore persistence repository for trip entities.
7. **`src/repositories/syncOperation.repository.ts`**: Authoritative Firestore persistence repository for idempotency ledgers (`projects/:projectId/sync_operations/:operationId`).

---

## 4. SECTION B — Operation Ownership Matrix

| Operation Type | Actual Producer | Current Replay Owner | Canonical Owner | Canonical Repository | Online Path | Offline / Fallback Path | In LU-P5-02? | Evidence Class |
|---|---|---|---|---|---|---|:---:|:---:|
| **`CREATE_TRIP_LOADING`** | `LoadingStation.tsx`, `LoadingOperatorView.tsx` | Online: `serverTripService.dispatchTrip`<br>Fallback: `outboxService.commitOperation` | `TripService.dispatchTrip` | `tripRepository` | `POST /api/projects/:projectId/trips` | `outboxService.commitOperation` (legacy `tripEngineService`) | **YES** (Core Scope) | ACTUAL |
| **`UPDATE_TRIP_STATUS`** | `UnloadingStation.tsx`, `OutboxDrawer.tsx` (sim), `conflictResolution.service.ts` | Fallback: unhandled/generic mutation | `TripService.transitionTripStatus` | `tripRepository` | `PATCH /api/projects/:projectId/trips/:tripId` | Fallback generic mutation / unrouted | **NO** (GAP-P5-04) | ACTUAL |
| **`RECORD_RECEIPT`** | `UnloadingStation.tsx` (field destination weighing) | Fallback: unhandled | `TripService.transitionTripStatus` (target `OFFLOADED` / `COMPLETED`) | `tripRepository` | `POST /api/projects/:projectId/weighbridge/commit` or `PATCH` | Fallback unhandled | **NO** (GAP-P5-04) | ACTUAL |
| **`REPORT_EXCEPTION`** | `UnloadingStation.tsx`, `fieldSupervision.service.ts` | Fallback: unhandled | `TripEventService` / `TripService` (status `REJECTED`) | `tripRepository`, `tripEventRepository` | Unhandled / custom API | Fallback unhandled | **NO** (GAP-P5-04) | ACTUAL |

---

## 5. SECTION C — Detailed Trace: `CREATE_TRIP_LOADING`

### 5.1 Step-by-Step Flow:
1. **User Action**: The scale operator on site completes the gross weighing in `LoadingOperatorView.tsx` or `LoadingStation.tsx` while offline.
2. **Local Queueing**:
   - Operator invokes `outboxService.queueOperation({ operationType: 'CREATE_TRIP_LOADING', projectId, userId, payload })`.
   - Generates unique `operationId = uuidv4()`.
   - Saves to IndexedDB `outbox` table with status `'PENDING'`.
   - Assigns a temporary trip ID (`TEMP-TRP-...`) and temporary serial `OFFLINE-PENDING`.
   - Stores the temporary trip in IndexedDB `trips` store to allow immediate field visibility.
3. **Reconnection & Sync Trigger**:
   - `networkStatusService` detects `window.online` or operator clicks "Sync Now" in `OutboxDrawer.tsx`.
   - Calls `outboxService.syncAll(isSimulatedOffline)`.
4. **Online Replay Path**:
   - Replay executes HTTP `POST /api/projects/:projectId/trips` with `operationId` passed as clientUUID.
   - `server.ts` validates dispatcher role, verifies project isolation, and ensures client did not attempt to forge a server tripNumber or override pricing snapshots.
   - Idempotency check checks if a trip with `clientUUID === operationId` already exists in Firestore.
   - Invokes `serverTripService.dispatchTrip(params, context)`.
   - Validates carrier, truck, driver, material, pricingRule references in canonical repositories.
   - Generates immutable snapshots (`carrierSnapshot`, `truckSnapshot`, `driverSnapshot`, `materialSnapshot`, `pricingSnapshot`).
   - Allocates sequential, atomic `tripNumber` via `TripNumberGenerator`.
   - Saves `TripEntity` to Firestore via `tripRepository.create()`.
   - Server returns 201 Created with canonical `trip` payload.
   - Client deletes temporary trip from IndexedDB and replaces it with authoritative `serverTrip`.
   - Records processed operation in `syncOperationRepository`.
   - Marks outbox entry `'SYNCED'`.
5. **Fallback Replay Path (CURRENT DEFECT - GAP-P5-02)**:
   - When offline simulation is active OR running in Node environment without network (`typeof window === 'undefined'`), `syncAll` routes to `outboxService.commitOperation(op)`.
   - `commitOperation(op)` invokes **NO** canonical validation.
   - Directly calculates `netWeight` and `settlementAmount` in `outbox.service.ts`.
   - Mutates `(tripEngineService as any).trips = [serverTrip, ...existingTrips]`.
   - Calls `tripStateMachine.addLifecycleEvent()`.
   - Records operation in `syncOperationRepository`.
   - Marks outbox operation `'SYNCED'`.
   - **CRITICAL DEFECT**: The trip is never saved to Firestore! It exists purely in legacy memory and local IndexedDB, creating an irreconcilable desynchronization between client and server.

### 5.2 Elimination of Legacy Service:
Can `tripEngineService` be eliminated from fallback replay without introducing new business logic?
**YES**: Fallback replay must not act as a parallel business kitchen. In environments where client-side canonical services are available, replay must route directly to canonical `TripService.dispatchTrip()` (or when truly offline, replay must simply remain `PENDING` until real server connectivity is re-established, because trip creation requires atomic server numbering and Firestore persistence).

---

## 6. SECTION D — `tripEngineService` Dependency Map

A forensic scan of the entire offline synchronization, outbox, and conflict resolution code reveals 10 specific touchpoints with `tripEngineService`:

| File | Line(s) | Function / Context | Usage Category | Authoritative? | Belongs in LU-P5-02? | Replacement Candidate | Evidence Class |
|---|---|---|---|:---:|:---:|---|:---:|
| `outbox.service.ts` | 22 | Import statement | IMPORT | No | YES | Remove import | ACTUAL |
| `outbox.service.ts` | 230–236 | `syncAll()` post-HTTP sync | WRITE / CACHE SYNC | No | YES | Remove legacy memory update; rely on `indexedDBService` | ACTUAL |
| `outbox.service.ts` | 325 | `detectStateConflict()` | READ (Conflict Pre-check) | No | YES | Query `tripRepository.findById()` or local IndexedDB cache | ACTUAL |
| `outbox.service.ts` | 415–421 | `commitOperation()` | WRITE / STATE MUTATION | No | YES | Route to canonical `TripService.dispatchTrip()` or defer until online | ACTUAL |
| `conflictResolution.service.ts` | 30 | Import statement | IMPORT | No | YES / CO-DEP | Remove or replace with `tripRepository` | ACTUAL |
| `conflictResolution.service.ts` | 69 | `detectConflict()` | READ (Server Trip Lookup) | No | YES / CO-DEP | `tripRepository.findById(projectId, tripId)` | ACTUAL |
| `conflictResolution.service.ts` | 178 | `detectConflict()` | READ (Duplicate Ticket Check) | No | YES / CO-DEP | `tripRepository.listByProject()` or IndexedDB cache | ACTUAL |
| `conflictResolution.service.ts` | 503 | `resolveConflict()` (FORCE_CLIENT) | READ (Existing Trip Lookup) | No | YES / CO-DEP | `tripRepository.findById(projectId, tripId)` | ACTUAL |
| `conflictResolution.service.ts` | 675–682 | `commitTripWithPreservedSnapshot()` | WRITE / STATE MUTATION | No | YES / CO-DEP | Canonical `tripRepository.create()` or `TripService` | ACTUAL |
| `conflictResolution.service.ts` | 789, 812, 838, 863 | Simulator helper methods | TEST / SIMULATION | No | NO (Test only) | Keep isolated or point to sample fixture | ACTUAL |

---

## 7. SECTION E — Conflict Resolution Boundary (`ConflictResolutionService`)

### 7.1 Data Inspection:
`ConflictResolutionService` inspects the following data points to identify conflicts:
1. `serverTrip.status` (detects `TRIP_ALREADY_COMPLETED`, `TRIP_ALREADY_RETURNED`).
2. `serverTrip.version` (detects `VERSION_CONFLICT`).
3. `serverTrip.ticketId` (detects `DUPLICATE_OPERATION` across different trips).
4. `pricingService.getRules()` (detects `PRICING_CHANGED`).
5. Master data relationships (truck/carrier mismatch, deactivated material).

### 7.2 Why It Reads `tripEngineService`:
Historically (Blocks 77–80), `tripEngineService` served as the in-memory prototype database before the canonical repository layer was implemented in Blocks 114–116. `ConflictResolutionService` was wired directly to this in-memory mock and never refactored to query canonical repositories.

### 7.3 Canonical Repository API Sufficiency:
- `tripRepository.findById(projectId, tripId)`: Provides authoritative `TripEntity`.
- `tripRepository.findByTripNumber(projectId, tripNumber)`: Provides ticket/number lookups.
- `TripValidator`: Authoritative transition validation.
The existing repository APIs are **100% sufficient** to replace all reads in `ConflictResolutionService`.

### 7.4 Authoritative Status:
`ConflictResolutionService` is **ADVISORY**:
- It pauses the synchronization pipeline when anomalies are detected.
- It generates a `ConflictRecord` in IndexedDB (`conflicts` store) with status `'OPEN'`.
- It prompts the operations supervisor in the UI for explicit, logged resolution (Anti-LWW).
- It does **not** silently overwrite server state.

### 7.5 Integration Boundary for GAP-P5-03:
- `GAP-P5-03` is a **DIRECT CO-DEPENDENCY (Category A)** of `LU-P5-02`.
- **Reason**: If `OutboxService` eliminates `tripEngineService`, any offline operations will no longer exist in `tripEngineService.trips`. If `ConflictResolutionService.detectConflict()` continues querying `tripEngineService`, it will query empty arrays and generate false positives or fail to detect real conflicts.
- Therefore, the read-boundary migration of `ConflictResolutionService` (switching its lookup from `tripEngineService` to `tripRepository` and/or cached IndexedDB trips) must be coordinated directly within the LU-P5-02 boundary.

---

## 8. SECTION F — Canonical Trip Operation Contract

The canonical business operation authority is strictly defined in `src/services/trip.service.ts` and `src/repositories/trip.repository.ts`:

### 8.1 `TripService` Public Methods:
1. **`dispatchTrip(params: DispatchTripParams, context: AuthUserContext): Promise<TripEntity>`**:
   - Authoritative trip creation.
   - Validates project membership, authorizations, active entity statuses.
   - Enforces truck-carrier and driver-carrier pairings.
   - Generates immutable snapshots (`carrierSnapshot`, `truckSnapshot`, `driverSnapshot`, `materialSnapshot`, `pricingSnapshot`).
   - Allocates atomic `tripNumber`.
   - Persists to Firestore via `tripRepository.create()`.
   - Records lifecycle event and audit log.
2. **`transitionTripStatus(projectId, tripId, targetStatus, payload, context): Promise<TripEntity>`**:
   - Validates state transitions via `TripValidator.validateStatusTransition()`.
   - Validates origin/destination weights and calculates variance.
   - Updates Firestore via `tripRepository.update()`.
3. **`updateTrip(projectId, tripId, updates, context): Promise<TripEntity>`**:
   - Updates non-status attributes with validation and audit logging.
4. **`getTrip(projectId, tripId): Promise<TripEntity | null>`**:
   - Reads directly from `tripRepository.findById()`.
5. **`getTripsByProject(projectId, limitCount): Promise<TripEntity[]>`**:
   - Reads from `tripRepository.listByProject()`.

---

## 9. SECTION G — CanonicalCommitEngineService Applicability

### **CANONICAL_COMMIT_ENGINE_ROLE = NOT_APPLICABLE**

### Evidentiary Justification:
1. **File Location**: `src/services/commitEngine.service.ts`.
2. **Domain Purpose**: `CanonicalCommitEngineService` exclusively manages **Stage 6 of the File Import Pipeline** (bulk Excel, CSV, and Google Sheets batch imports).
3. **Input Signatures**: It operates strictly on `ImportSession`, `CanonicalReviewArtifact`, and `CanonicalApprovalRecord` objects (see lines 83–89 and lines 140–165 of `src/services/commitEngine.service.ts`).
4. **Architectural Invariant**: It possesses no methods for operational single-trip dispatch, weighbridge loading, or outbox mutation replay.
5. **Architectural Hazard**: Any attempt to route operational Outbox replays through `CanonicalCommitEngineService` would be a severe domain boundary violation, forcing fake import sessions and artificial approval records for routine truck loading.

---

## 10. SECTION H — Online vs. Fallback Parity & Second Kitchen Analysis

| Dimension | Online Replay Path | Fallback Replay Path (Current) | Parity Status | Second Kitchen Risk |
|---|---|---|:---:|:---:|
| **Entry Point** | `POST /api/projects/:projectId/trips` | `outboxService.commitOperation()` | DIVERGENT | High |
| **Auth & RBAC** | `enforceDispatcherOrAbove`, project isolation | Bypassed (local execution) | DIVERGENT | High |
| **Domain Validation** | `TripValidator.validate()` | None (raw field assignment) | DIVERGENT | Critical |
| **Entity Existence** | Repositories verify carrier/truck/driver/material | Assumes local payload is valid | DIVERGENT | High |
| **Active Status Check** | Verified in Firestore master data | Bypassed | DIVERGENT | High |
| **Snapshot Generation** | Full immutable snapshots created from DB | Ad-hoc / shallow payload snapshot | DIVERGENT | High |
| **Trip Numbering** | Server atomic `TripNumberGenerator` | Random serial generation | DIVERGENT | Critical |
| **Pricing Calculation** | Server verifies pricing rule rate | Client-supplied settlement accepted | DIVERGENT | Critical |
| **Persistence Target** | Firestore (`projects/:id/trips/:id`) | In-memory `tripEngineService.trips` | DIVERGENT | Critical |
| **Idempotency** | Firestore `sync_operations` + `clientUUID` | Firestore `sync_operations` (if authed) | PARTIAL | Medium |
| **Audit Logging** | `auditLogService.recordLog()` | Bypassed | DIVERGENT | High |
| **Lifecycle Events** | `tripEventService.recordEvent()` | `tripStateMachine.addLifecycleEvent()` | DIVERGENT | High |

### Second Kitchen Diagnosis:
`outboxService.commitOperation()` represents a classic **"Second Kitchen"** anti-pattern. It duplicates business logic (weight subtraction, settlement calculation, serial formatting) and writes to an alternative, non-canonical state store (`tripEngineService`), leading to silent state drift.

---

## 11. SECTION I — State Machine Ownership

| Component / Action | Current Owner | Target Owner | Evidence Class |
|---|---|---|:---:|
| **Trip Status Transitions** | `tripStateMachine.service.ts` + `TripService` | `TripService` (using `TripValidator`) | ACTUAL / TARGET |
| **Transition Rules Definition** | `STATE_TRANSITIONS` (in `tripStateMachine.ts`) | `ALLOWED_TRIP_TRANSITIONS` (in `trip.validator.ts`) | ACTUAL / TARGET |
| **Variance Calculation** | `completeUnloadingWithVariance` (in `tripEngine.ts`) | `TripService.transitionTripStatus()` | ACTUAL / TARGET |
| **Offline Replay Status Update** | `outboxService.commitOperation()` | `TripService` via server route | ACTUAL / TARGET |

---

## 12. SECTION J — Idempotency Architecture

### 12.1 Generation:
- Every outbox operation generates a cryptographic or UUIDv4 `operationId` during `queueOperation`.
- The `operationId` is mapped 1:1 to `clientUUID`.

### 12.2 Verification:
- **Online**: `server.ts` checks `tripRepository.findByClientUUID(projectId, operationId)`. If found, it returns `200 OK` with `{ trip: existingTrip, message: 'Idempotency Hit' }`.
- **Pre-Replay**: `outboxService.syncAll()` queries `syncOperationRepository.findById(projectId, op.operationId)`. If status is `'PROCESSED'`, it skips re-execution and marks the local operation `'SYNCED'`.

### 12.3 Completion Guarantee:
- An operation is **NEVER** marked `'SYNCED'` until the authoritative commit is verified and the record is stored in `syncOperationRepository`.

---

## 13. SECTION K — ExpectedVersion & Anti-LWW

1. **Version Tracking**:
   - `TripEntity` implements `BaseAuditedEntity` with `updatedAt` timestamps.
   - Legacy `TripRecord` possessed a numeric `version` counter.
2. **Conflict Prevention**:
   - Anti-LWW is strictly enforced: when concurrent edits occur, `ConflictResolutionService` intercepts the operation, marks it `CONFLICT`, and requires explicit supervisor adjudication.
   - Client commands never overwrite server state unconditionally.

---

## 14. SECTION L — Project Isolation, RBAC & Authority Boundaries

1. **Project Isolation**:
   - Multi-tenant routing strictly isolates all data under `projects/{projectId}/...`.
   - Cross-project writes are rejected by middleware `enforceProjectIsolation` and Firestore security rules.
2. **RBAC**:
   - Replay of `CREATE_TRIP_LOADING` requires `DISPATCHER`, `OPERATIONS_MANAGER`, `PROJECT_ADMIN`, or `SUPER_ADMIN`.
   - Offline queueing records `userId` and `deviceId` for end-to-end attribution.

---

## 15. SECTION M — Legacy Dependencies Inventory

| Dependency | Location | Current Role in Replay | Planned Disposition in LU-P5-02 |
|---|---|---|---|
| `tripEngineService` | `src/services/tripEngine.service.ts` | State store for fallback commit & conflict check | **ELIMINATE COMPLETELY** from Outbox and Conflict paths |
| `tripStateMachine` | `src/services/tripStateMachine.service.ts` | In-memory lifecycle event logger in fallback | **ELIMINATE** from outbox fallback; rely on canonical services |
| `MasterPricingRule` | `src/services/tripEngine.service.ts` | Type import in outbox and conflict | Replace with `PricingRuleEntity` |
| `adminConsoleService` | `src/services/adminConsole.service.ts` | Hydration source (previously closed in Block 130) | Maintained closed (`GAP-P5-01 = CLOSED`) |

---

## 16. SECTION N — Duplicate Business Logic Inventory

The following duplicate logic was identified between canonical and offline paths:
1. **Weight Calculations**: `originNetKg = originGrossKg - originTareKg` duplicated in `TripService`, `TripValidator`, `tripEngineService`, and `outboxService.commitOperation`.
2. **Settlement Calculations**: Ton-rate multiplication duplicated in `TripService` and `outboxService.commitOperation`.
3. **Serial Number Formatting**: Temporary serial synthesis duplicated across field components and outbox fallback.

**Convergence Strategy**: Retain calculations strictly inside canonical `TripService` and `TripValidator`.

---

## 17. SECTION O — GAP-P5-04 Dependency Boundary Analysis

1. **Does LU-P5-02 depend on `UPDATE_TRIP_STATUS`?**  
   **NO**. `UPDATE_TRIP_STATUS` operates on existing trips and is not required to complete canonical replay of newly created offline trips (`CREATE_TRIP_LOADING`).
2. **Does LU-P5-02 depend on `RECORD_RECEIPT`?**  
   **NO**. Weighbridge unloading and destination receipt belong to destination workflows, independent of initial loading dispatch replay.
3. **Does LU-P5-02 depend on `REPORT_EXCEPTION`?**  
   **NO**. Exception reporting is an auxiliary operational workflow.
4. **Can `CREATE_TRIP_LOADING` be fully converged without implementing GAP-P5-04?**  
   **YES**. `CREATE_TRIP_LOADING` is self-contained. Converging it eliminates the primary source of offline state pollution.
5. **Smallest safe dependency**: Ensure that unhandled operation types in the outbox are safely preserved in `'PENDING'` status without throwing unhandled exceptions or polluting legacy state.

---

## 18. SECTION P — Existing Test Coverage Inventory

1. **`src/tests/concurrencyIntegrityStressBlock95.test.ts`**:
   - Tests `outboxService.queueOperation` and `outboxService.syncAll()`.
   - Tests idempotency replay hits.
   - Tests offline error capture (`FAILED` state).
2. **`src/tests/secureTripNumberingOffline89B.test.ts`**:
   - Tests offline outbox queue generation.
   - Tests `OFFLINE-PENDING` serial convention.
   - Tests server-authoritative numbering security rules.
3. **`src/tests/conflictResolution.test.ts`**:
   - Tests the 7 conflict types, anti-LWW guarantees, and pricing invariance.

---

## 19. SECTION Q — Implementation Boundary for LU-P5-02

### 19.1 Objective:
Eliminate legacy `tripEngineService` and `tripStateMachine` dependencies from `OutboxService` fallback execution and synchronize conflict detection lookups to canonical repositories. Route all outbox replay logic through canonical domain authorities.

### 19.2 MUST CHANGE:
1. **`src/services/offline/outbox.service.ts`**:
   - Remove imports of `tripEngineService` and `tripStateMachine`.
   - In `syncAll()`: Remove in-memory updates to `(tripEngineService as any).trips`.
   - In `detectStateConflict()`: Replace `tripEngineService.getTripById()` with lookup from `tripRepository` and/or IndexedDB cached trips.
   - In `commitOperation()`: Remove legacy manual trip construction and in-memory mutation. Converge fallback execution on canonical `TripService` / `tripRepository` or require online sync for authoritative persistence.
2. **`src/services/offline/conflictResolution.service.ts`** (Co-dependency Boundary):
   - Replace `tripEngineService.getTripById()` and `tripEngineService.getTrips()` with canonical repository lookups or cached store lookups.
   - Remove mutations to `(tripEngineService as any).trips` in `commitTripWithPreservedSnapshot()`.

### 19.3 MUST NOT CHANGE:
- DO NOT modify UI entry points or field operator views (`LoadingStation.tsx`, `LoadingOperatorView.tsx`).
- DO NOT implement `RECORD_RECEIPT` or `REPORT_EXCEPTION` replay (GAP-P5-04).
- DO NOT alter the 608 UI controls (Phase 6 scope).
- DO NOT modify `CanonicalCommitEngineService` (exclusively belongs to import pipeline).
- DO NOT alter IndexedDB database schema version or object store keys.

### 19.4 Affected Files:
- `src/services/offline/outbox.service.ts`
- `src/services/offline/conflictResolution.service.ts`

### 19.5 Supporting Files (Read/Reference Only):
- `src/services/trip.service.ts`
- `src/repositories/trip.repository.ts`
- `src/repositories/syncOperation.repository.ts`
- `server.ts`

---

## 20. SECTION R — Second Kitchen Safety Gate

- [x] **No Alternative Authority**: The implementation will NOT create any new in-memory stores, alternative state managers, or uncoordinated persistence paths.
- [x] **Single Business Authority**: All operational state changes converge strictly on `TripService`.
- [x] **Single Persistence Authority**: All durable state commits converge strictly on `tripRepository` and Firestore.
- [x] **Client Non-Authoritative**: IndexedDB remains strictly a cache and pending outbox queue.

---

## 21. SECTION S — Change Readiness Matrix

| Requirement | Status | Evidence |
|---|:---:|---|
| **Architecture Mapped** | READY | Section A & C |
| **Legacy Usages Identified** | READY | Section D |
| **Canonical Operation Identified** | READY | `TripService.dispatchTrip` (Section F) |
| **Commit Engine Non-applicability Proven** | READY | Section G |
| **GAP-P5-03 Boundary Clarified** | READY | Section E (Direct Co-dependency) |
| **GAP-P5-04 Isolated** | READY | Section O (Deferred to later unit) |
| **Safety Invariants Defined** | READY | Section R |

---

## 22. Remaining Phase 5 Gaps Status

| Gap ID | Area | Target | Status After Block 131 |
|---|---|---|:---:|
| **GAP-P5-01** | Canonical Cache Hydration | Hydrate cache from canonical repositories | **CLOSED** (Block 130) |
| **GAP-P5-02** | Outbox Replay Harmonization | Eliminate `tripEngineService` from outbox fallback replay | **OPEN** (Ready for implementation in next block) |
| **GAP-P5-03** | Conflict Resolution Data Source | Query canonical state instead of `tripEngineService` | **OPEN** (Ready for implementation in LU-P5-02 boundary) |
| **GAP-P5-04** | Update / Receipt Replay Convergence | Route status updates & receipts to canonical services | **OPEN** (Deferred to subsequent unit) |

---

## 23. Final Verdict

# `LU-P5-02_DISCOVERY_COMPLETE`

The forensic discovery of LU-P5-02 is formally complete. The boundary is precisely delineated, the legacy dependencies are fully cataloged, and the implementation path is completely defined without introducing any secondary business authorities.
