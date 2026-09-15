# BLOCK 89A — TRIP NUMBERING PRODUCTION SAFETY AUDIT REPORT

**Audit Execution Date:** September 14, 2026
**Target Architecture:** BLOCK 89 Sequential Trip Identity System

---

## Executive Summary & Classification

Based on a thorough read-only audit of the `TripNumberGenerator` implementation, Firestore security rules, and offline fallback scenarios, the classification of the current system is as follows:

| Classification | Status / Value | Description |
| :--- | :--- | :--- |
| **TRIP_NUMBERING_PRODUCTION_SAFE** | **🔴 FAIL** | Due to local fallback uniqueness conflicts and direct client write exposure. |
| **FIRESTORE_AUTHORITATIVE** | **🟢 YES** | Online transactions are the single source of truth for sequences. |
| **OFFLINE_SAFE** | **🔴 NO** | Offline local counters start at 1 and can duplicate consumed indexes. |
| **CONCURRENCY_SAFE** | **🟢 YES** | Concurrent online users are serialized safely via server-side transactions. |
| **CLIENT_OVERRIDE_BLOCKED** | **🔴 NO** | Clients can bypass generator logic and write arbitrary `tripNumber` values. |
| **HISTORICAL_IMMUTABILITY** | **🟢 YES** | Direct deletions are blocked, and once saved, `tripNumber` is immutable. |

---

## Detailed Inspection & Verification

### 1. Online Production Trip Creation ALWAYS uses Firestore-authoritative numbering
* **Verification Status:** `🟢 PASS`
* **Analysis:** When the client has network connectivity and `auth.currentUser` is active, `TripNumberGenerator.getNextTripNumber` triggers `runTransaction` against `/systemCounters/tripNumber_{projectId}`. This reads, increments, and writes the counter server-side, securing absolute authority.

### 2. In-memory fallback cannot create a trip number that later conflicts with Firestore
* **Verification Status:** `🔴 FAIL`
* **Analysis (Unsafe Path):** When offline or unauthenticated, the transaction fails and the generator falls back to `this.inMemoryCounters[projectId] || 1`. It increments this local state in isolation. If a user offline spawns a trip, it gets assigned index `1`. If other online users have already registered index `1` with the server, reconnecting and syncing the offline trip writes a duplicate `tripNumber` attribute because Firestore only enforces uniqueness on the document ID (`tripId`), not on normal attributes.

### 3. Offline trip creation behavior is explicitly defined
* **Verification Status:** `🟢 PASS`
* **Analysis:** Fallback pathways are explicitly defined. On transaction failure or lack of auth, the system captures the error, issues a console warning, and falls back to partitioned in-memory key-value maps (`this.inMemoryCounters[projectId]`).

### 4. Synchronization after offline operation cannot duplicate tripNumber
* **Verification Status:** `🔴 FAIL`
* **Analysis:** No reconciliation, deduplication, or re-indexing logic exists to re-calculate a synchronized offline trip's number. When an offline-generated trip is uploaded, its static `tripNumber` (e.g., `TRP-00001`) is committed as-is, resulting in dual documents sharing the same sequential index.

### 5. Failed transactions cannot consume/reuse an unsafe number
* **Verification Status:** `🟢 PASS`
* **Analysis:** Transactions in Firestore are atomic and roll back entirely on failure or write contention. The authoritative sequence counter is never mutated in the database until the transaction successfully commits.

### 6. Concurrent users cannot generate the same trip number
* **Verification Status:** `🟢 PASS` (Online only) / `🔴 FAIL` (Mixed Offline-Online)
* **Analysis:** Online concurrent dispatchers are safely isolated and serialized via Firestore's pessimistic/optimistic server-side transactions. However, if offline clients are mixed with online users, duplicate allocation occurs via the fallback pathway.

### 7. Existing historical trip numbers remain immutable
* **Verification Status:** `🟢 PASS`
* **Analysis:** Security rules on `/projects/{projectId}/trips/{tripId}` explicitly block deletions (`allow delete: if false`). Updates are restricted such that the settled `pricingSnapshot` and `tripNumber` properties cannot be modified by standard users.

### 8. Client cannot supply or override tripNumber
* **Verification Status:** `🔴 FAIL`
* **Analysis (Vulnerability):** A malicious client can bypass `TripNumberGenerator` and execute a raw Firestore document write containing any arbitrary value for `tripNumber` (e.g., `TRP-99999` or custom spoof text). `firestore.rules` does not validate the value of `tripNumber` during creation.

### 9. Project prefix always matches the projectNumber
* **Verification Status:** `🟢 PASS`
* **Analysis:** The prefix format is derived from `projectNumberVal` (e.g., `Q-PRJ-0123`), falling back to `Q-PRJ-0001` only if the project document metadata fails to load.

### 10. Sequence cannot cross project boundaries
* **Verification Status:** `🟢 PASS`
* **Analysis:** The Firestore counters reside in project-isolated documents (`systemCounters/tripNumber_{projectId}`) and local fallback counters are keyed by `projectId` in memory, ensuring absolute tenant isolation.

---

## Actionable Recommendations & Minimum Fixes

To achieve full `TRIP_NUMBERING_PRODUCTION_SAFE = PASS`, the following adjustments must be introduced:

### 1. Shift Trip Creation to Server-Side Express API
* **Why:** Removing direct client-side creates from `firestore.rules` prevents malicious payload overrides.
* **The Minimum Fix:**
  - Update `firestore.rules` on `/trips/{tripId}` to restrict creations (`allow create: if isServerAuthorized();`).
  - Implement a secure, server-side Express API endpoint `/api/projects/:projectId/trips`. The backend server (using Firebase Admin SDK) handles the transaction, generates the safe sequential `tripNumber`, and persists the document.
  - Offline creations are queued locally inside an idempotent synchronization payload. When connection is re-established, the queue is replayed against the server endpoint which allocates valid, sequential sequence numbers dynamically upon actual ingest.

---
*Report generated in compliance with BLOCK 89A Security Auditing Guidelines.*
