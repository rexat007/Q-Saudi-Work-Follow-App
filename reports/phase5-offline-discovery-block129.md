# BLOCK 129 — Phase 5 Offline / Outbox Discovery Gate Report

**Mode:** Strict Read-Only Discovery / Architectural Analysis & Gap Mapping  
**Verdict:** `PHASE_5_DISCOVERY_COMPLETE`  
**Date:** September 16, 2026  

---

## 1. Executive Summary

In accordance with the Block 128 roadmap rebase and Phase 5 authorization, this forensic discovery inspects the **current implementation** of the offline storage, IndexedDB, local cache reconciliation, Outbox mutation queue, anti-Last-Write-Wins (LWW) conflict engine, and synchronization replay pipelines across the Q-Saudi Work Follow codebase.

### Core Discovery Findings:
1. **IndexedDB is Strictly Non-Authoritative**: IndexedDB database (`q_saudi_logistics_offline_db` v2) encapsulates 10 object stores purely for client caching and pending queue mutations. It does not overwrite Firestore directly.
2. **Deletion-Aware Cache Reconciliation (Block 103B) is Preserved**: The `OfflineCacheService.reconcileStore` engine purges local records when upstream entities are deleted, preventing ghost records from remaining selectable.
3. **Outbox Replay Online Path Routes Through Canonical Trip Service**: When online, Outbox sync dispatches via HTTP to `/api/projects/:projectId/trips`, which invokes `TripService.dispatchTrip()`, validating domain references, active status, taking immutable snapshots, allocating atomic trip numbers, and saving via `tripRepository`.
4. **Second Kitchen Risks Identified in Offline Hydration & Fallback Commit**:
   - `OfflineCacheService.seedAllMasterData()` currently pulls data from legacy `adminConsoleService` rather than canonical domain repositories (`projectRepository`, `carrierRepository`, `truckRepository`, `driverRepository`, etc.).
   - `OutboxService.commitOperation()` in simulated/fallback mode writes to the legacy `tripEngineService` in-memory store rather than invoking canonical `TripService`.
   - `ConflictResolutionService.detectConflict()` queries legacy `tripEngineService` rather than canonical `tripRepository`.
5. **Phase 5 Implementation Scope Defined**: The exact 3 logical implementation units (`LU-P5-01`, `LU-P5-02`, `LU-P5-03`) required to close these gaps and achieve 100% canonical convergence have been mapped without assigning premature future block numbers.

---

## 2. Evidence Discipline & Classification

All findings are strictly categorized according to repository evidence:
- **ACTUAL**: Directly confirmed in current code, tests, or config.
- **INFERRED**: Concluded from multiple pieces of actual evidence.
- **TARGET**: Required target state defined by Block 105–128 specifications.
- **UNVERIFIED**: Cannot be established without additional tooling/infrastructure.

---

## 3. Current Offline Architecture Overview

The offline architecture is organized around three clear layers:

```
[UI Layer (LoadingStation / LoadingOperatorView)]
        │
        ├── Reads from ──► [IndexedDB Local Cache (OfflineCacheService)]
        │
        └── Queues to ──► [IndexedDB Outbox Store (OutboxService)]
                                  │
                          [Replay / Sync Trigger]
                                  │
    ┌─────────────────────────────┴─────────────────────────────┐
    ▼ (Online Network Path)                                     ▼ (Simulated Fallback Path)
[POST /api/projects/:projectId/trips]                [OutboxService.commitOperation()]
    │                                                           │
    ▼ (Security Middleware: Auth, Scope, RBAC)                  ▼ (Legacy In-Memory Update)
[TripService.dispatchTrip()]                         [tripEngineService.trips] ⚠️ (Gap)
    │
    ├── Master Data Validation (Repositories)
    ├── Active Status & Authorization Checks
    ├── Immutable Snapshot Generation
    ├── Atomic Trip Number Allocation
    │
    ▼
[tripRepository.create() ──► Firestore]
    │
    ├── auditLogService & tripEventService
    └── syncOperationRepository.create() (Idempotency Ledger)
```

---

## 4. IndexedDB Forensic Inventory

- **Database Name**: `q_saudi_logistics_offline_db`
- **Database Version**: `2`
- **Implementation File**: `/src/services/offline/indexedDB.service.ts`
- **Authority Status**: Cache and Pending Queue Only (`ACTUAL`).

### Object Stores Breakdown:

| Object Store | Key Path | Indexes | Purpose | Evidence Class |
|---|---|---|---|:---:|
| `projects` | `projectId` | *(none)* | Cached active project records | ACTUAL |
| `carriers` | `carrierId` | `projectId` | Cached authorized carriers | ACTUAL |
| `materials` | `materialId` | `projectId` | Cached authorized materials | ACTUAL |
| `trucks` | `truckId` | `carrierId`, `projectId` | Cached carrier-assigned trucks | ACTUAL |
| `drivers` | `driverId` | `carrierId`, `projectId` | Cached carrier-assigned drivers | ACTUAL |
| `pricingRules` | `pricingRuleId` | `projectId`, `carrierId`, `materialId` | Cached pricing rules for field rate calculation | ACTUAL |
| `trips` | `tripId` | `projectId`, `status` | Local operational and temporary offline trips | ACTUAL |
| `outbox` | `operationId` | `status`, `projectId`, `createdAt` | Pending mutation operation queue | ACTUAL |
| `metadata` | `storeName` | *(none)* | Store version, timestamp, and record counts | ACTUAL |
| `conflicts` | `conflictId` | `status`, `conflictType`, `operationId`, `projectId` | Explicit conflict records (Anti-LWW) | ACTUAL |

---

## 5. Cache Reconciliation Map (Block 103B Preservation)

- **Implementation**: `/src/services/offline/offlineCache.service.ts` -> `reconcileStore<T>()`.
- **Mechanism**:
  1. Retrieves all existing local records from IndexedDB for a given store.
  2. Compares local keys against incoming authoritative keys (`authoritativeKeys = new Set(authoritativeItems.map(getKey))`).
  3. Iterates and executes `indexedDBService.delete(storeName, key)` for any key absent from the authoritative set.
  4. Stores the new items with `indexedDBService.putMany(storeName, authoritativeItems)`.
  5. Updates store metadata with timestamp, record count, and version.
- **Verification**: Tested and confirmed in `/src/tests/ghostDataEliminationBlock103B.test.ts`. Deleted remote entities disappear locally, preventing ghost operational selections.
- **Identified Gap (`GAP-P5-01`)**: `OfflineCacheService.seedAllMasterData()` currently pulls data from legacy `adminConsoleService` in-memory arrays rather than canonical repositories (`projectRepository`, `carrierRepository`, etc.).

---

## 6. Outbox Forensic Inventory

- **Implementation**: `/src/services/offline/outbox.service.ts`
- **Data Model (`OutboxOperation`)**:
  - `operationId`: Unique UUID generated via `OP-${Date.now()}-${rand}` or clientUUID.
  - `projectId`: Mandatory target project identifier.
  - `userId`: Author of the mutation.
  - `deviceId`: Persistent hardware/client identifier (`q_saudi_device_id`).
  - `operationType`: `'CREATE_TRIP_LOADING' | 'UPDATE_TRIP_STATUS' | 'RECORD_RECEIPT' | 'REPORT_EXCEPTION'`.
  - `payload`: Complete mutation payload (including local weights, snapshots, and timestamps).
  - `createdAt`: ISO 8601 creation timestamp.
  - `retryCount`: Integer incremented on retryable failures (capped at 5).
  - `status`: `'PENDING' | 'SENDING' | 'SYNCED' | 'FAILED' | 'CONFLICT'`.
  - `errorReason`: Detailed error message on failure.
  - `syncedAt`: ISO 8601 acknowledgment timestamp.
  - `serverAck`: Server commit acknowledgment details (`tripId`, `tripSerial`, `serverVersion`, `committedAt`).
  - `conflictDetails`: Details of detected conflicts (`conflictId`, `conflictType`, `diffFields`, etc.).

---

## 7. Outbox State Machine

The outbox implements a formal 5-state lifecycle:

```
                  ┌──────────────┐
                  │   INITIAL    │
                  └──────┬───────┘
                         │ queueOperation()
                         ▼
                  ┌──────────────┐
       ┌─────────►│   PENDING    │◄─────────┐
       │          └──────┬───────┘          │
       │                 │ syncAll()        │ retryOperation()
       │                 ▼                  │ resolveConflict()
       │          ┌──────────────┐          │
       │          │   SENDING    │          │
       │          └──┬───┬────┬──┘          │
       │             │   │    │             │
Client/Server Error  │   │    │ Conflict    │
(retryCount < 5)     │   │    │ Detected    │
       ┌─────────────┘   │    └─────────┐   │
       ▼                 │              ▼   │
┌──────────────┐         │       ┌──────────┴───┐
│    FAILED    │         │       │   CONFLICT   │
└──────────────┘         │       └──────────────┘
                         │ Success / Idempotency Hit
                         ▼
                  ┌──────────────┐
                  │    SYNCED    │ (Server ACK confirmed)
                  └──────────────┘
```

---

## 8. Actual vs. Target Replay Paths

### A. ACTUAL Current Replay Path (Online Mode):
1. **Outbox Queue**: `outboxService.getOperations()` fetches `PENDING` items.
2. **Status Transition**: State set to `SENDING`.
3. **Pre-Validation**: `outboxService.validateOperationServerSide()` runs local payload sanity checks.
4. **Idempotency Pre-Check**: `syncOperationRepository.findById(op.projectId, op.operationId)` checks if already processed.
5. **Conflict Detection**: `conflictResolutionService.detectConflict(op)` checks for version or status conflicts against server state.
6. **HTTP Dispatch**: `fetch('/api/projects/${op.projectId}/trips', { method: 'POST', body: ... })`.
7. **Server Ingress**: Express middleware executes `authenticateUser`, `enforceProjectIsolation`, `enforceDispatcherOrAbove`.
8. **Server Idempotency**: Query on Firestore `projects/:projectId/trips` where `clientUUID == operationId`. If hit, returns existing trip.
9. **Authoritative Execution**: `serverTripService.dispatchTrip(params, context)`:
   - Fetches live entities from `carrierRepository`, `truckRepository`, `driverRepository`, `materialRepository`, `pricingRuleRepository`, `projectRepository`.
   - Asserts entity existence and `status === 'ACTIVE'`.
   - Asserts `truck.carrierId === params.carrierId` and `driver.carrierId === params.carrierId`.
   - Constructs immutable historical snapshots.
   - Generates next sequential trip number via `TripNumberGenerator`.
   - Persists trip via `tripRepository.create()`.
   - Logs audit and lifecycle events via `auditLogService` and `tripEventService`.
10. **Client ACK**: Client receives HTTP 201 response, deletes temporary offline trip from IndexedDB `trips`, stores authoritative server trip in IndexedDB, records `syncOperationRepository.create()`, and transitions outbox status to `SYNCED`.

### B. ACTUAL Fallback Replay Path (Simulated / Local Mode):
1. `outboxService.commitOperation(op)` manually calculates settlement amounts and writes directly to `tripEngineService.trips` (legacy in-memory array).
2. Emits `tripStateMachine.addLifecycleEvent()`.
3. Calls `syncOperationRepository.create()`.
4. Sets outbox status to `SYNCED`.
*Finding*: This fallback branch bypasses canonical `TripService` and represents a **Second Kitchen Risk** during simulated offline execution (`GAP-P5-02`).

### C. TARGET Phase 5 Replay Path:
All replay executions (whether live HTTP, in-memory test runner, or background worker) route through the **Canonical Domain Operation Layer** (`TripService` / `CanonicalCommitEngineService`) and **Canonical Repositories**, ensuring zero divergence between online and offline commits.

---

## 9. Authoritative Revalidation Matrix

| Revalidation Condition | Status | Actual Evidence Location |
|---|:---:|---|
| 1. Project Exists | **IMPLEMENTED** | `TripService.dispatchTrip` line 54, `server.ts` line 754 |
| 2. Project is Active | **PARTIAL** | Project repository fetches project; active status assertion in `TripService` is partial |
| 3. User is Authenticated | **IMPLEMENTED** | `server.ts` line 36 (`authenticateUser`), `TripService` line 46 |
| 4. User has Required RBAC Permission | **IMPLEMENTED** | `server.ts` line 755 (`enforceDispatcherOrAbove`) |
| 5. Project Membership is Valid | **IMPLEMENTED** | `server.ts` line 754 (`enforceProjectIsolation`) |
| 6. Referenced Carrier is Valid & Active | **IMPLEMENTED** | `TripService.dispatchTrip` lines 49, 70 |
| 7. Referenced Driver is Valid & Active | **IMPLEMENTED** | `TripService.dispatchTrip` lines 51, 81, 85 |
| 8. Referenced Truck is Valid & Active | **IMPLEMENTED** | `TripService.dispatchTrip` lines 50, 73, 77 |
| 9. Referenced Material is Valid & Active | **IMPLEMENTED** | `TripService.dispatchTrip` lines 52, 89 |
| 10. Roster Relationship is Active | **PARTIAL** | Checked via `project.authorizedCarrierIds` and `authorizedMaterialIds`; full `ProjectCarrierRoster` check is partial |
| 11. expectedVersion Matches | **PARTIAL** | Evaluated in `ConflictResolutionService.detectConflict` for updates; creation generates new version |
| 12. operationId Not Previously Committed | **IMPLEMENTED** | Checked in `syncOperationRepository` and `server.ts` line 799 (`where('clientUUID', '==', operationId)`) |
| 13. Stale/Deleted Target Rejected Safely | **IMPLEMENTED** | Canonical repository lookups fail and reject replay |
| 14. Retry After Partial Failure is Safe | **IMPLEMENTED** | Idempotency layer returns existing record without duplicating domain writes |

---

## 10. OperationId / Durable Idempotency Trace

```
[Client UI Mutation]
       │
       ▼ Generates operationId: "OP-1726500000000-1234"
[IndexedDB 'outbox' Store] (keyPath: operationId)
       │
       ▼ Transmitted via POST /api/projects/:projectId/trips body { operationId }
[Server Ingress (server.ts)]
       │
       ├── Check 1: Firestore Query on projects/:projectId/trips where clientUUID == operationId
       │            └── Hit: Returns existing trip with "Idempotency Hit" ACK
       │
       └── Check 2: syncOperationRepository.findById(projectId, operationId)
                    └── Hit: Returns existing sync operation
       │
       ▼ On First Commit:
[syncOperationRepository.create({ operationId, status: 'PROCESSED', targetCollection: 'trips' })]
       │
       ▼ Persisted into Firestore: /projects/:projectId/sync_operations/:operationId
```

---

## 11. ExpectedVersion / Concurrency Analysis

- **Local Capture**: Captured in `OutboxOperation.payload.version` when mutation is drafted.
- **Anti-LWW Enforcement**:
  - `ConflictResolutionService.detectConflict()` compares `serverTrip.version` against `localCommand.version`.
  - If `serverTrip.version > localVersion`, the operation is blocked from syncing, marked as `CONFLICT`, and a `ConflictRecord` (type: `VERSION_CONFLICT`) is persisted in IndexedDB.
  - Requires explicit user resolution strategy (`ACCEPT_SERVER_STATE`, `FORCE_CLIENT_STATE`, `MANUAL_MERGE`, etc.).
- **Pricing Snapshot Protection**: If a trip was created offline with a valid `pricingSnapshot`, the rate is locked at dispatch time and protected against subsequent master pricing rule updates.

---

## 12. Project Isolation Analysis

**Status: `PASS`**
- All IndexedDB queries are filtered and partitioned by `projectId`.
- `OutboxOperation` schema strictly enforces mandatory `projectId`.
- Express API routes enforce `enforceProjectIsolation` middleware.
- `TripService` scopes all repository lookups (`projectRepository`, `carrierRepository`, `truckRepository`, etc.) to `params.projectId`.
- No path exists for offline mutations to bleed across project boundaries.

---

## 13. Legacy Paths & Second Kitchen Analysis

The following legacy linkages were identified in the offline subsystem:

| Subsystem Component | Legacy Dependency | Current Usage | Phase 5 Disposition |
|---|---|---|---|
| `OfflineCacheService` | `adminConsoleService` | Sourcing master data during cache seeding | **REWIRE IN PHASE 5** to use canonical repositories |
| `OutboxService` | `tripEngineService` | In-memory trip mutation during simulated offline fallback | **REWIRE IN PHASE 5** to use canonical `TripService` |
| `ConflictResolutionService` | `tripEngineService` | Reading server trip state during conflict evaluation | **REWIRE IN PHASE 5** to use `tripRepository` / `TripService` |
| `OutboxService` | `tripStateMachine` | Firing in-memory lifecycle events | **REWIRE IN PHASE 5** to use `tripEventService` / `auditLogService` |

---

## 14. Phase 5 Gap Register

| Gap ID | Area | Current State | Target State | Severity | Blocking | Disposition |
|---|---|---|---|:---:|:---:|:---:|
| **GAP-P5-01** | Cache Hydration Source | `offlineCacheService.seedAllMasterData()` reads from legacy `adminConsoleService` in-memory state. | Hydrates directly from Canonical Repositories (`projectRepository`, `carrierRepository`, etc.). | **P1** | Yes | `MUST_IMPLEMENT` |
| **GAP-P5-02** | Outbox Fallback Replay | `outboxService.commitOperation()` directly mutates `tripEngineService.trips` in memory. | All replays execute through canonical `TripService` / `CanonicalCommitEngineService`. | **P1** | Yes | `MUST_IMPLEMENT` |
| **GAP-P5-03** | Conflict Engine Integration | `conflictResolutionService` queries `tripEngineService` for server trip comparison. | Queries canonical `tripRepository.findById()`. | **P2** | No | `MUST_IMPLEMENT` |
| **GAP-P5-04** | State Update Replay Endpoints | Server API currently only exposes `/api/projects/:projectId/trips` for creation. | Provide unified handlers for `UPDATE_TRIP_STATUS` and `RECORD_RECEIPT` enforcing `expectedVersion`. | **P2** | No | `SHOULD_IMPLEMENT` |

---

## 15. Phase 5 Logical Implementation Units

To close all Phase 5 gaps cleanly without introducing unnecessary complexity, the following **3 Logical Units** are defined:

### Unit 1: Canonical Cache Hydration (`LU-P5-01`)
- **Purpose**: Rewire `OfflineCacheService` to hydrate master data stores (`projects`, `carriers`, `materials`, `trucks`, `drivers`, `pricingRules`) directly from Canonical Repositories.
- **Affected Files**: `/src/services/offline/offlineCache.service.ts`, `/src/tests/ghostDataEliminationBlock103B.test.ts`.
- **Gaps Closed**: `GAP-P5-01`.
- **Dependencies**: Phase 2 Repositories.
- **Risk**: Low.

### Unit 2: Canonical Replay & Outbox Harmonization (`LU-P5-02`)
- **Purpose**: Eliminate legacy `tripEngineService` from `OutboxService` fallback execution and `ConflictResolutionService`. Route all replay logic to canonical `TripService` and `tripRepository`.
- **Affected Files**: `/src/services/offline/outbox.service.ts`, `/src/services/offline/conflictResolution.service.ts`.
- **Gaps Closed**: `GAP-P5-02`, `GAP-P5-03`.
- **Dependencies**: `LU-P5-01`, `TripService`, `tripRepository`, `syncOperationRepository`.
- **Risk**: Medium.

### Unit 3: Phase 5 Comprehensive Verification Suite (`LU-P5-03`)
- **Purpose**: Create a unified end-to-end verification suite testing IndexedDB caching, deletion-aware reconciliation, outbox replay revalidation, anti-LWW conflict detection, and durable idempotency.
- **Affected Files**: `/src/tests/phase5OfflineOutboxVerification.test.ts`.
- **Gaps Closed**: `GAP-P5-01`, `GAP-P5-02`, `GAP-P5-03`, `GAP-P5-04`.
- **Dependencies**: `LU-P5-01`, `LU-P5-02`.
- **Risk**: Low.

---

## 16. Multiple Doors / Second Kitchen Safety Check

- **Second Business Service**: None introduced. Backend "One Kitchen" model is preserved.
- **Second Persistence Authority**: None introduced. Firestore remains sole persistence authority; IndexedDB is cache-only.
- **Second State Machine**: None introduced. Replay harmonizes with canonical domain state machines.
- **608-Control Convergence**: Explicitly preserved for Phase 6.
  `UI_ENTRY_POINT_CONVERGENCE = NOT_YET_IMPLEMENTED`.

---

## 17. Safety & Invariant Verification

```
CODE_CHANGED = NO
DATA_CHANGED = NO
FIRESTORE_DATA_CHANGED = NO
FIRESTORE_SCHEMA_CHANGED = NO
FIRESTORE_RULES_CHANGED = NO
INDEXEDDB_CHANGED = NO
GOOGLE_DRIVE_CHANGED = NO
GOOGLE_SHEETS_CHANGED = NO
ROUTES_CHANGED = NO
UI_CHANGED = NO
AUTHENTICATION_STATE_CHANGED = NO
CONFIGURATION_CHANGED = NO
RUNTIME_STATE_CHANGED = NO

RELEASE_BLOCKER = NO
UI_ENTRY_POINT_CONVERGENCE = NOT_YET_IMPLEMENTED
LIVE_FIRESTORE_E2E_VERIFIED = NO
```

---

## 18. Final Verdict

**`PHASE_5_DISCOVERY_COMPLETE`**

The forensic analysis of the offline, IndexedDB, outbox, and replay architecture is complete. All existing mechanisms, state machines, reconciliation behaviors, and legacy linkages have been mapped with precision. Phase 5 implementation scope and logical units are fully defined and ready for execution upon authorization.
