# Phase 6 — UI Entrypoint Discovery & Mapping Report

## 1. Executive Summary
**DISCOVERY STATUS: COMPLETE**  
Following the successful completion of Phase 5, this Phase 6 Discovery Gating phase has independently mapped the front-end user interface entry points across the application. 

The investigation has revealed several significant **"Multiple Doors" / "Second Kitchen"** anomalies, where high-level operational workflows are handled via parallel, disconnected, or duplicated front-end mechanisms. Most notably:
1. **Critical Operational Disconnect (P0)**: While the backend server implements robust, database-backed REST endpoints utilizing the real Firestore `TripService`, the frontend field workstations (Loading, Unloading, Driver, and Supervision views) rely heavily on an in-memory client-side mock service (`tripEngineService`) for online pathways. Only the loading operator's offline workflow uses the local IndexedDB/Outbox sync engine to communicate with the real server.
2. **Entity Administration Overlap (P1)**: The administration of Carriers, Materials, Drivers, and Trucks is duplicated between the setup-focused `ProjectWorkspaceView` (which performs live mutations to the database) and the global `MasterDataView` (which uses in-memory mock states under fallback conditions and repository writes when logged in).
3. **Integration and Supervision Redundancy (P2/P3)**: Configurable Google Drive properties are split across different sub-tabs, and the entire 12-stage Import Center is nested directly inside the Field Supervision workstation.

This report establishes the baseline state and provides a clear convergence blueprint to transition the application to the strict mandate:  
**"ONE BUSINESS CAPABILITY → ONE CANONICAL UI OWNER → ONE CANONICAL WORKFLOW."**

---

## 2. Methodology & Findings
Our discovery process traced imports, state variables, and repository subscription patterns across the frontend codebase to map how each business capability behaves at runtime.

### 2.1 The Trip Lifecycle: Workstations vs. Developer Views
*   **Door A (Field Operations Workstations)**: Under `src/components/field/FieldOperationsView.tsx`, users can select roles and open loading or unloading stations:
    *   `LoadingOperatorView.tsx` (online path) calls `tripEngineService.createTripViaLoadingStation(...)` directly in the browser's local memory. The dispatched cargo remains transient and never reaches Firestore.
    *   `UnloadingOperatorView.tsx` uses `tripEngineService.completeUnloadingWithVariance(...)` in local memory. There is no Outbox queueing or API dispatch for unloading processes, rendering unloading operations purely temporary.
    *   Only `LoadingOperatorView.tsx` (offline path) queues a `'CREATE_TRIP_LOADING'` operation to `outboxService`, which correctly synchronizes via `POST /api/projects/:projectId/trips`.
*   **Door B (Trip Engine Developer Tab)**: `src/components/TripEngineView.tsx` imports `LoadingStation.tsx`, `UnloadingStation.tsx`, and `StateMachineController.tsx`. These interact 100% with the in-memory mock database inside `tripEngineService.ts`. This serves as an excellent visual simulator but represents an isolated "Second Kitchen."
*   **Door C (REST API Server)**: The actual node server (`server.ts`) hosts authoritative endpoints (`POST /api/projects/:projectId/trips`, `PATCH /api/projects/:projectId/trips/:tripId/status`) backed by the live, snapshot-saving Firestore `TripService`. Under normal online UI operation, **these endpoints are completely bypassed**.

### 2.2 Master Data Administration: Workspace vs. Master Data Tab
*   **Door A (Project Workspace Tab)**: `src/components/workspace/ProjectWorkspaceView.tsx` serves as the primary project dashboard. Under its tabs (`carriers`, `drivers`, `materials`, `pricing`), it directly subscribes to Firestore real-time queries (e.g., `carrierRepository.subscribeByProject`) and triggers real mutations (`carrierRepository.create`, etc.). This represents the **canonical data owner**.
*   **Door B (Master Data Tab)**: `src/components/masterData/MasterDataView.tsx` lists projects, carriers, materials, trucks, and drivers. It duplicates the creation forms, search layouts, and validation logic. When a user is authenticated, it writes directly to the Firestore repositories, but when unauthenticated, it falls back to an in-memory `adminConsoleService` mock pool. 

---

## 3. Discovered UI Entrypoints & Gaps Matrix

| Business Capability | Door A (UI Path) | Door B (UI Path) | Server API & Core Persistence | Convergence Priority | Gap Classification & Impact |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **Cargo Dispatch & Loading** | `LoadingOperatorView` (Field workstation) | `LoadingStation` (Trip Engine developer tab) | `POST /api/projects/.../trips` → `TripService.dispatchTrip` → Firestore | **P0** | **Critical Architectural Split**: Online workstation dispatches are locked in local memory (`tripEngineService`), bypassing the database server entirely. |
| **Unloading & Trip Completion**| `UnloadingOperatorView` (Field workstation) | `UnloadingStation` (Trip Engine developer tab) | `PATCH /api/projects/.../trips/.../status` → `TripService.transitionTripStatus` → Firestore | **P0** | **Critical Server Bypass**: Unloading arrival, weighing, and variance computations operate purely in-memory, bypassing server-side financial settlement. |
| **Master Data (Carriers, Materials, Roster)** | `ProjectWorkspaceView` (Projects / Wizard Tab) | `MasterDataView` (Dedicated Master Data Menu Tab) | `carrierRepository.create` etc. → Live Firestore collections | **P1** | **Duplicate Forms & Validation**: Parallel administrative panels managing the same entities using different visual components and fallback routines. |
| **Google Workspace Sync** | `ProjectWorkspaceView` (Google Tab) | `WorkspaceIntegrationView` (Dedicated Integration Menu Tab) | `projectService.updateProject` → Google Drive Config snap in Firestore | **P2** | **Split Configuration**: Configuration properties are stored per-project inside the workspace, but live synchronization is triggered on a global tab. |
| **Import Center Supervision** | `ImportCenterView` (Dedicated Tab) | Nested in `FieldSupervisionView` (Supervision Imports Tab) | `ImportCenterService.commitBatch` → Transient Local React State | **P3** | **Redundant Views**: The entire 12-stage CSV parsing dashboard is embedded inside the field supervisor's view, bloating rendering and breaking roles. |

---

## 4. Gap Classifications and Actionable Convergence Plans

### GAP-P6-UI-01: Online Workstation Outbox Disconnection (P0 - Critical)
*   **Description**: Online dispatches in `LoadingOperatorView.tsx` are executed against the client-side `tripEngineService` rather than enqueuing into the Outbox or executing HTTP POST dispatches. Consequently, cargo trips dispatched during normal online operations never write to Firestore.
*   **Impact**: Operational data loss. Online dispatches are lost on page refresh.
*   **Convergence Plan**: Re-engineer the workstation's dispatch logic. Direct both the online and offline pathways to record dispatches via `outboxService.queueOperation`. In the outbox replayer, online operations are immediately dispatched synchronously to the backend REST route, matching the offline sync replay.

### GAP-P6-UI-02: Unloading Completion Server Bypass (P0 - Critical)
*   **Description**: Destination arrival, weighing tickets, and variance exceptions are captured exclusively inside the client's memory. The server's `transitionTripStatus` REST route is completely uncalled during workstation unloading.
*   **Impact**: Inability to record trip completions or calculate official, audited financials in Firestore.
*   **Convergence Plan**: Modify `UnloadingOperatorView.tsx` to enqueue a `'RECORD_RECEIPT'` (or `'UPDATE_TRIP_STATUS'`) action in the Outbox upon unloading. Ensure this triggers a `POST` or `PATCH` request to the server, allowing the backend `TripService` to transition the status, process the weight variance, and save authoritative financials to the database.

### GAP-P6-UI-03: Duplicate Master Data Administrative Doors (P1 - High)
*   **Description**: Users can modify project carrier rosters and materials in both the setup `ProjectWorkspaceView` and the dedicated `MasterDataView`. Both contain distinct, non-shared forms and UI templates.
*   **Impact**: Increased visual noise, maintenance overhead, and risk of validating entities differently.
*   **Convergence Plan**: Establishe `ProjectWorkspaceView` as the **sole canonical administrative workspace** for project-scoped master data. Refactor `MasterDataView` to act as a read-only, cross-project analytical directory. Any edit or create actions initiated on `MasterDataView` should redirect the user to the active project workspace.

### GAP-P6-UI-04: Separated Google Workspace Entrypoints (P2 - Medium)
*   **Description**: Project-specific folder mappings and Shared Drive connections are managed in the `ProjectWorkspaceView` Google tab, but manual spreadsheet syncing and Google Sheets connection statuses are checked on the global `Workspace_Integration` tab.
*   **Impact**: Confusing UX where configuration and action are divided.
*   **Convergence Plan**: Unify Google Workspace setup, folder mapping, and manual spreadsheet synchronization into a single 'Google Integration' panel inside `ProjectWorkspaceView`, leaving the global tab as a diagnostic super-admin audit log.

### GAP-P6-UI-05: Redundant Embedded Import Center Views (P3 - Low)
*   **Description**: The full, heavy 12-stage CSV parser dashboard (`ImportCenterView`) is nested under the field supervisor's terminal layout, duplicating the main `IMPORT_CENTER` tab.
*   **Impact**: Slower layout rendering, DOM bloat, and overlapping navigation paths.
*   **Convergence Plan**: Remove the embedded `<ImportCenterView />` from `FieldSupervisionView.tsx`. Replace it with a read-only log of recently processed imports, containing a clear navigation button to redirect supervisors to the dedicated Import Center tab when corrections are required.

---

## 5. Architectural Consensus
By completing this rigorous Phase 6 discovery phase, we have mapped every entry point and visual workflow back to its database authority. This documentation provides a secure roadmap for future convergence. All code files, existing test suites, and database tables have been kept fully intact and unmodified during this read-only block.
