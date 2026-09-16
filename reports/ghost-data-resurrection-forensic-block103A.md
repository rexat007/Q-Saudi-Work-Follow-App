# BLOCK 103A Forensic Audit: Ghost Data Resurrection

## 1. Incident Overview
**Incident:** P0 Data Resurrection
**Symptom:** Records previously removed from the system (projects, carriers, and related master data) reappeared in the application after a refresh/update, causing data integrity confusion and risking the creation of operational data linked to deleted entities.

## 2. Root Cause Analysis
The forensic audit confirmed that the resurrection is not caused by records being written back to Firestore. Instead, the incident stems from an **asynchronous caching vulnerability (Upsert-Only Sync) within the Offline Cache Architecture**.

### The Mechanism of Resurrection
1. **Lack of Tombstoning/Deletions in IndexedDB**: When the application caches master data for offline support (via `offlineCacheService` and `indexedDBService.putMany`), the storage engine executes a loop of `store.put(item)` operations. This acts purely as an UPSERT. The sync logic **never deletes** local records that have been removed from the upstream authoritative source (Firestore).
2. **Orphaned Record Retention**: When a project or carrier is deleted in Firestore by an admin, the record remains indefinitely in the user's local `IndexedDB` cache.
3. **UI Hydration**: Upon application startup or when navigating to offline-first views (like `LoadingStation` and `UnloadingStation`), the application populates selectors using `offlineCacheService.getProjects()`. This reads directly from `IndexedDB`, fetching the orphaned records and rendering them as active, causing them to "reappear" to the user.

### Compounding Risks
* **Trip Commit Vulnerability**: Because deleted projects/carriers reappear in offline-first dropdowns, a user can inadvertently select a deleted entity and create a trip. The `OutboxService` queues this trip (`CREATE_TRIP_LOADING`) and, upon regaining connectivity, syncs it to the server. The server-side outbox processing does not rigorously assert the continued existence of the master data in Firestore, resulting in active trips bound to deleted projects/carriers.
* **MasterDataView Fallback Vulnerability**: In `MasterDataView.tsx`, if the live Firestore synchronization fails (e.g., network failure), the system executes a runtime fallback to `adminConsoleService.getProjects()`. While empty by default in production, if any lifecycle sequence (such as a developer override or a legacy test trigger) previously invoked `loadDemoMasterData()`, static hardcoded fixtures (e.g., `PRJ-NEOM-001`) would be instantly resurrected and injected into the live production UI.
* **DataCleanupService Inadequacy**: The `DataCleanupService` attempts to purge stale cache data in IndexedDB by matching hardcoded strings (e.g., 'NEOM', 'BINLADIN'). It fails to systematically reconcile IndexedDB content against the active Firestore registry, thereby completely missing generic orphaned records.

## 3. Affected Subsystems
* **`src/services/offline/indexedDB.service.ts`**: `putMany()` fails to prune unlisted records.
* **`src/services/offline/offlineCache.service.ts`**: Hydration pathways unconditionally trust local cache without verifying upstream tombstones.
* **`src/components/masterData/MasterDataView.tsx`**: Unsafe error-fallback logic risks fixture injection.
* **`src/services/dataCleanup.service.ts`**: Heuristic-based cleanup is insufficient for production state reconciliation.

## 4. Verification of Strict Invariants
During this audit, **zero modifications** were made to the codebase, Firestore, IndexedDB, or any other operational state. All activities were restricted to read-only static analysis and structural mapping as mandated by BLOCK 103A.
