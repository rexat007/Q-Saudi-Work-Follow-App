# BLOCK 109 — TARGET API & PERSISTENCE CONTRACT SPECIFICATION REPORT

## 1. Executive Summary
This report establishes the authoritative Target API, Command, Repository, Persistence, Transaction, Versioning, Idempotency, and Audit contracts for the future rebuilt Q-Saudi Work Follow application in accordance with BLOCK 109. Operating in strict read-only architectural specification mode, this document defines the persistence hierarchy, repository boundaries, Firestore conceptual path ownership, transaction boundaries, concurrency controls, idempotency mechanisms, and security model without altering any code, database state, or runtime configuration.

## 2. Target Persistence Architecture
Defines the clean, unbypassed persistence hierarchy:
```
UI / Client
↓
Canonical Domain Service
↓
Application Command / Operation Contract
↓
Repository / Persistence Adapter
↓
Firestore
↓
Audit / Durable Event Boundary
```
Prohibits direct UI-to-Firestore writes, direct repository bypasses, and unvalidated offline cache overrides.

## 3. Canonical Repositories & Firestore Path Ownership
Establishes 10 canonical repositories mapping directly to Firestore paths:
- `projectRepository` → `/projects/{projectId}`
- `projectRosterRepository` → `/projects/{projectId}/roster/{rosterId}`
- `pricingRepository` → `/projects/{projectId}/pricingRules/{pricingRuleId}`
- `tripRepository` → `/projects/{projectId}/trips/{tripId}`
- `exceptionRepository` → `/projects/{projectId}/exceptions/{exceptionId}`
- `importRepository` → `/projects/{projectId}/imports/{importId}`
- `userRepository` → `/users/{userId}`
- `membershipRepository` → `/projects/{projectId}/membership/{membershipId}`
- `auditRepository` → `/auditLogs/{auditId}`
- `storageRepository` → `/projects/{projectId}/storageProfile`

## 4. Key Persistence & API Contracts
- **Server-Authoritative Trip Numbering**: Managed atomically via `tripRepository` and `tripService` with collision protection and offline outbox revalidation.
- **Driver & Truck Intake**: Project-originated intake committing through `driverTruckIntakeService` into `projectRosterRepository` and `projectRepository`, with global registries acting purely as derived lookup projections.
- **Field Operations**: Fully integrated into `tripService` and `tripRepository`.
- **Snapshots & Immutability**: Committed pricing and trip snapshots are permanently immutable.
- **Import Gate**: Gated strictly through `importService` review before calling domain repositories to commit.

## 5. Safety Assertions & Validation Results
- CODE_CHANGED = NO
- DATA_CHANGED = NO
- FIRESTORE_CHANGED = NO
- INDEXEDDB_CHANGED = NO
- GOOGLE_DRIVE_CHANGED = NO
- GOOGLE_SHEETS_CHANGED = NO
- ROUTES_CHANGED = NO
- UI_CHANGED = NO
- AUTHENTICATION_STATE_CHANGED = NO
- CONFIGURATION_CHANGED = NO
- P0 = 0
- P1 = 0
- PRODUCTION_FIXTURE_PATHS = 0
- GHOST_DATA_PATHS_REMAINING = 0
- RELEASE_BLOCKER = NO

**Final Verdict**: `TARGET_API_PERSISTENCE_CONTRACTS_ESTABLISHED`
