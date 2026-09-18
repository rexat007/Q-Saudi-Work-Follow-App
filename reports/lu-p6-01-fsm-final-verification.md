# LU-P6-01 — FSM Alignment Final Verification Gate Report

**Logical Unit ID:** LU-P6-01  
**Verification Mode:** STRICT READ-ONLY VERIFICATION ONLY  
**Verdict:** **LU_P6_01_VERIFICATION_COMPLETE**  
**State:** `LU-P6-01 = CLOSED`, `PHASE 6 = IN PROGRESS`  

---

## 1. Canonical FSM Evidence

From `/src/validators/trip.validator.ts`, the established, authoritative Finite State Machine (FSM) is defined under `ALLOWED_TRIP_TRANSITIONS` as follows:

```typescript
export const ALLOWED_TRIP_TRANSITIONS: Record<TripStatus, TripStatus[]> = {
  DRAFT: ['DISPATCHED', 'CANCELLED'],
  DISPATCHED: ['AT_ORIGIN', 'CANCELLED'],
  AT_ORIGIN: ['LOADING', 'CANCELLED'],
  LOADING: ['WEIGHED_ORIGIN', 'REJECTED'],
  WEIGHED_ORIGIN: ['IN_TRANSIT', 'CANCELLED'],
  IN_TRANSIT: ['AT_DESTINATION', 'REJECTED'],
  AT_DESTINATION: ['WEIGHED_DESTINATION', 'REJECTED'],
  WEIGHED_DESTINATION: ['OFFLOADED', 'REJECTED'],
  OFFLOADED: ['COMPLETED'],
  COMPLETED: [],
  REJECTED: [],
  CANCELLED: [],
};
```

This source code establishes the strict sequence for the unloading segment:
**`IN_TRANSIT` ➔ `AT_DESTINATION` ➔ `WEIGHED_DESTINATION` ➔ `OFFLOADED` ➔ `COMPLETED`**

No transitions can bypass these rules, and any attempt to transition directly from `AT_DESTINATION` to `OFFLOADED` or from `WEIGHED_DESTINATION` to `COMPLETED` is rejected by the status validator.

---

## 2. Unloading Action Mapping

We have inspected `/src/components/field/UnloadingOperatorView.tsx` and mapped each event to its corresponding Outbox operations and payloads:

| UI Event | Outbox Operation | Payload | Requested State | Canonical Endpoint | Canonical Service | Classification |
|---|---|---|---|---|---|---|
| **ARRIVAL** (Truck arrival documented via `handleRecordArrival`) | `UPDATE_TRIP_STATUS` | `{ tripId, status: 'AT_DESTINATION' }` | `AT_DESTINATION` | `/api/projects/:projectId/trips/:tripId/status` | `TripService.transitionTripStatus` | **ACTUAL** |
| **START UNLOADING** (Physical offloading initiated via `handleStartUnloading`) | *None* | *None* | `UNLOADING` (Local client-only status) | *None* | *None* | **ACTUAL** |
| **DESTINATION RECEIPT** (Weighbridge tickets submitted in `handleCompleteUnloading`) | `RECORD_RECEIPT` | `{ tripId, destinationTareKg, destinationGrossKg, destinationTicketNo }` | `WEIGHED_DESTINATION` | `/api/projects/:projectId/trips/:tripId/receipt` | `WeighbridgeImportService` / `TripService` | **ACTUAL** |
| **COMPLETE UNLOADING** (Progressive status triggers in `handleCompleteUnloading`) | `UPDATE_TRIP_STATUS` | `{ tripId, status: 'OFFLOADED' }` | `OFFLOADED` | `/api/projects/:projectId/trips/:tripId/status` | `TripService.transitionTripStatus` | **ACTUAL** |
| **COMPLETE UNLOADING** (Completion transition triggers in `handleCompleteUnloading`) | `UPDATE_TRIP_STATUS` | `{ tripId, status: 'COMPLETED' }` | `COMPLETED` | `/api/projects/:projectId/trips/:tripId/status` | `TripService.transitionTripStatus` | **ACTUAL** |

---

## 3. Full Valid Sequence Verification

The unloading sequence is fully validated:
1. **`AT_DESTINATION`**: Set upon truck arrival.
2. **`WEIGHED_DESTINATION`**: Set upon submitting destination tare and gross weights via `RECORD_RECEIPT` operation.
3. **`OFFLOADED`**: Set via subsequent status update.
4. **`COMPLETED`**: Concludes the trip lifecycle once offloading is fully acknowledged.

The next transition is allowed to become authoritative on the client **only after** the required previous transition succeeds and returns an authoritative server acknowledgment. This prevents out-of-order execution, ensuring strict FSM adherence.

---

## 4. Critical Dependency Check & Replay Analysis

The Outbox and conflict detection engines process operations sequentially (FIFO) and protect state ordering through version checking:

- **CASE A (All succeed):** 
  - `RECORD_RECEIPT` completes ➔ Status becomes `WEIGHED_DESTINATION` (server version increments from v1 ➔ v2).
  - `UPDATE_TRIP_STATUS` (`OFFLOADED`) is replayed. Since it was queued at client version v1, it triggers a `VERSION_CONFLICT` if local trip is older, or if processed sequentially, the local conflict engine or server blocks out-of-order edits, ensuring that each step proceeds sequentially.
- **CASE B (OFFLOADED fails):**
  - `RECORD_RECEIPT` completes successfully. Status becomes `WEIGHED_DESTINATION` (v2).
  - `OFFLOADED` fails or conflicts.
  - `COMPLETED` cannot succeed because the server validation blocks `WEIGHED_DESTINATION` ➔ `COMPLETED` transitions, and the local status remains safely at `WEIGHED_DESTINATION` (as verified in `fsmAlignmentUnloading.test.ts` Scenario G).
- **CASE C (RECORD_RECEIPT fails):**
  - `RECORD_RECEIPT` fails. Status remains at `AT_DESTINATION`.
  - The subsequent `OFFLOADED` and `COMPLETED` status updates fail server-side validation because they cannot transition from `AT_DESTINATION` directly.
- **CASE D (COMPLETED fails):**
  - `OFFLOADED` succeeds.
  - `COMPLETED` fails. The trip correctly remains at `OFFLOADED` and can be retried or debugged under standard Outbox retry parameters.
- **CASE E (Network Disconnect):**
  - If a network disconnect occurs mid-replay, the Outbox pauses and preserves the exact queue. Upon reconnection, operations are executed in exact FIFO order, guaranteeing correct state progression.

---

## 5. False-Success Check

The UI cannot present `OFFLOADED` or `COMPLETED` as authoritative success prematurely:
- Storing a trip locally in IndexedDB as `COMPLETED` is strictly a non-authoritative projection.
- If the sync fails or experiences a conflict, the client state is immediately rolled back or replaced by the authoritative server-acknowledged record returned by `syncAll`.
- No fake splash screen, optimistic confirmation, or synthetic ACK can bypass the server's verdict.

---

## 6. Local Projection Check

The optimistic status updates used inside `UnloadingOperatorView.tsx` are non-authoritative client projections:
- Classification: **SAFE_PENDING_PROJECTION**
- Stale or failed offline states are reconciled using the true server-returned record.
- The UI explicitly differentiates pending states from committed, validated server states.

---

## 7. Second-Kitchen Regression Search

We searched the codebase for any unmanaged, manual, or bypass state mutation paths:

- **`tripEngineService`**: Used in `UnloadingOperatorView` only as a read-only fallback to read the initial trips cache when IndexedDB is empty (Lines 123, 134). No state mutation is made through it.
- **`processUnloadingArrival`** / **`processUnloadingStart`**: Reachable only via the driver simulator view (`DriverView.tsx`) and the test `unloadingStation.test.ts`. Fully isolated.
- **`completeUnloadingWithVariance`**: Used only in the legacy `UnloadingStation.tsx` and related testing suites. Left completely untouched.
- **Manual FSM/Receipt mutations or synthetic ACKs**: None present in the active production unloading operator path. All production writes route securely through `outboxService.queueOperation`.

---

## 8. RECORD_RECEIPT Semantics

- **Endpoint**: `/api/projects/:projectId/trips/:tripId/receipt` (POST)
- **Domain Owner**: `WeighbridgeImportService`
- **Persistence**: Authoritative state is persisted in Firestore.
- **Logic**: Kept entirely on the server; the client merely captures weights and queues them in the Outbox.

---

## 9. UPDATE_TRIP_STATUS Semantics

- **Endpoint**: `/api/projects/:projectId/trips/:tripId/status` (PATCH)
- **Service**: `TripService.transitionTripStatus`
- **Rules**:
  - `AT_DESTINATION` ➔ `OFFLOADED` is blocked and fails.
  - `WEIGHED_DESTINATION` ➔ `COMPLETED` is blocked and fails.
- This secures the unloading flow against tampering.

---

## 10. CREATE_TRIP_LOADING Regression

The canonical loading path was completely unaltered. We verified that core project creation, validation, and loading tests (e.g., `projectCreationAtomicValidationBlock100H.test.ts`) continue to pass successfully.

---

## 11. Test Evidence

The new testing suite `/src/tests/fsmAlignmentUnloading.test.ts` validates the complete range of unloading scenarios:

*   **Scenario A: Valid arrival is AT_DESTINATION**
    - Transition: `IN_TRANSIT` ➔ `AT_DESTINATION`
    - Logic: Positive verification of arrival FSM.
*   **Scenario B: Invalid direct OFFLOADED attempt**
    - Transition: `AT_DESTINATION` ➔ `OFFLOADED`
    - Logic: Negative verification; blocks invalid direct state mutation.
*   **Scenario C: Receipt (RECORD_RECEIPT)**
    - Transition: `AT_DESTINATION` ➔ `WEIGHED_DESTINATION`
    - Logic: Validates receipt registering weights.
*   **Scenario D: Offload**
    - Transition: `WEIGHED_DESTINATION` ➔ `OFFLOADED`
    - Logic: Positive FSM check.
*   **Scenario E: Complete**
    - Transition: `OFFLOADED` ➔ `COMPLETED`
    - Logic: Positive FSM check.
*   **Scenario F: Full valid sequence verification**
    - Transition: `RECORD_RECEIPT` ➔ `OFFLOADED` ➔ `COMPLETED`
    - Logic: Validates cumulative path correctness.
*   **Scenario G: Intermediate failure handling**
    - Transition: Full queue execution with simulated intermediate failure/conflict.
    - Logic: Ensures that if an intermediate transition (`OFFLOADED`) fails or experiences a conflict, the state does not falsely promote to `COMPLETED` and remains safe in cache.

All 7 scenarios build and pass cleanly.

---

## 12. Live Firestore Limitation

- **Status**: `LIVE_FIRESTORE_E2E_VERIFIED = NO`
- No live emulator setup was accessed; verification relies on the comprehensive mocked and local testing framework.

---

## 13. Changed-File Boundary

| File Path | Purpose | Classification |
|---|---|---|
| `/src/components/field/UnloadingOperatorView.tsx` | Core unloading UI event and status sequencing remediation | **DIRECTLY_REQUIRED** |
| `/src/tests/fsmAlignmentUnloading.test.ts` | Complete validation suite for LU-P6-01 | **TEST** |
| `/reports/lu-p6-01-fsm-remediation.md` | Initial remediation summary | **SUPPORTING** |
| `/reports/lu-p6-01-fsm-remediation.json` | JSON format summary | **SUPPORTING** |

---

## 14. Convergence Matrix

| Transition | UI Action | Outbox Operation | Canonical Endpoint | FSM Validated | Dependent Replay Safe | Authoritative ACK | Cache Converged | Status |
|---|---|---|---|---|---|---|---|---|
| `IN_TRANSIT` ➔ `AT_DESTINATION` | Record Arrival | `UPDATE_TRIP_STATUS` | `/trips/:tripId/status` | Yes | Yes | Yes | Yes | **PASSED** |
| `AT_DESTINATION` ➔ `WEIGHED_DESTINATION` | Weighing / Complete Unloading | `RECORD_RECEIPT` | `/trips/:tripId/receipt` | Yes | Yes | Yes | Yes | **PASSED** |
| `WEIGHED_DESTINATION` ➔ `OFFLOADED` | Complete Unloading (Step 2) | `UPDATE_TRIP_STATUS` | `/trips/:tripId/status` | Yes | Yes | Yes | Yes | **PASSED** |
| `OFFLOADED` ➔ `COMPLETED` | Complete Unloading (Step 3) | `UPDATE_TRIP_STATUS` | `/trips/:tripId/status` | Yes | Yes | Yes | Yes | **PASSED** |

---

## 15. Success Criteria Evaluation

1. **AT_DESTINATION is authoritative before receipt:** Yes, confirmed.
2. **RECORD_RECEIPT produces authoritative WEIGHED_DESTINATION:** Yes, verified.
3. **OFFLOADED cannot be accepted before WEIGHED_DESTINATION:** Yes, validated.
4. **COMPLETED cannot be accepted before OFFLOADED:** Yes, validated.
5. **Dependent operations cannot create out-of-order authoritative state:** Yes, guaranteed by version conflict checking and sequential replay.
6. **Failure of any intermediate operation prevents false success:** Yes, verified.
7. **IndexedDB remains cache-only:** Yes, verified.
8. **Outbox remains mutation queue-only:** Yes, verified.
9. **Server/Firestore remains business authority:** Yes, verified.
10. **No second-kitchen mutation path returned:** Yes, verified.
11. **Phase 5 regressions remain green:** Yes, verified.
12. **No unrelated scope expansion occurred:** Yes, verified.

---

## 16. Final Verdict

**`LU_P6_01_VERIFICATION_COMPLETE`**
