# PHASE 6 POST-LU-P6-04 DISCOVERY REPORT

## 1. Current Phase 6 State
- GAP_P5_04 = DEFERRED
- PHASE_6 = IN_PROGRESS
- UI_ENTRY_POINT_CONVERGENCE = NOT_YET_IMPLEMENTED
- 608_CONTROL_CONVERGENCE = NOT_YET_IMPLEMENTED
- LIVE_FIRESTORE_E2E_VERIFIED = NO

## 2. Closed Units
| Unit | Status | Evidence |
|---|---|---|
| LU-P6-01 | CLOSED | Verified in Phase 6 state |
| LU-P6-02A | CLOSED | Verified in Phase 6 state |
| LU-P6-02B2 | CLOSED | Verified in Phase 6 state |
| LU-P6-03 | CLOSED | Verified in Phase 6 state and FSM alignment report |
| LU-P6-04 | CLOSED | Verified via LU-P6-04 implementation report |

## 3. Remaining Production Divergences

| Path | Production? | Current Behavior | Canonical Owner | Risk | Evidence |
|---|---|---|---|---|---|
| `ReportsEngineView.tsx` | YES | Reads trips from `tripEngineService.getTrips()` on mount | `tripRepository` / `indexedDBService` | HIGH - Bypasses canonical state | `useMemo(() => tripEngineService.getTrips(), [])` |
| `OperationsDashboardView.tsx` | YES | Relies on `dashboardService` which defaults to `tripEngineService.getAllTrips()` | `tripRepository` / `indexedDBService` | HIGH - Bypasses canonical state | `dashboardService.getFilteredTrips` implicitly calling `tripEngineService` |
| `WorkspaceIntegrationView.tsx` | YES | Reads `tripEngineService.getTrips()` to sync to Google Drive | `tripRepository` | HIGH - Exports non-canonical data | `const trips = tripEngineService.getTrips();` |
| `UnloadingOperatorView.tsx` | YES | Reads from `tripEngineService` if local indexedDB cache is empty | `indexedDBService` | LOW - Fallback only, but still divergent | `if (inbounds.length === 0) { ... tripEngineService.getAllTrips() }` |

## 4. tripEngineService Audit

| File | Reference | Classification | Production Reachability | Action |
|---|---|---|---|---|
| `src/components/field/UnloadingOperatorView.tsx` | `tripEngineService.getAllTrips()` | PRODUCTION | YES (Fallback path) | Remove fallback |
| `src/components/workspace/WorkspaceIntegrationView.tsx` | `tripEngineService.getTrips()` | PRODUCTION | YES | Refactor to use `tripRepository` |
| `src/components/reports/ReportsEngineView.tsx` | `tripEngineService.getTrips()` | PRODUCTION | YES | Refactor to use `tripRepository`/`indexedDB` |
| `src/components/dashboard/OperationsDashboardView.tsx` | implicit | PRODUCTION | YES | Refactor to use `tripRepository`/`indexedDB` |
| `src/components/tripEngine/*` | multiple | DEVELOPER_ONLY | NO | Ignore (Sandbox) |
| `src/components/TripEngineView.tsx` | multiple | DEVELOPER_ONLY | NO | Ignore (Sandbox) |
| `src/services/dashboard.service.ts` | `tripEngineService.getAllTrips()` | PRODUCTION | YES | Remove default fallback |
| `src/services/reportsEngine.service.ts` | `tripEngineService.getTrips()` | PRODUCTION | YES | Remove default fallback |
| `src/services/workspace.service.ts` | `tripEngineService.getTrips()` | PRODUCTION | YES | Remove default fallback |

## 5. MasterDataView Audit
`MasterDataView.tsx` uses `adminConsoleService.getCarriers()`, `getMaterials()`, `getTrucks()`, `getDrivers()`, and `getProjects()`. 
However, this usage is explicitly gated by `if (!user)` to provide a "Safe demo mode when unauthenticated (avoids permission errors)". For authenticated users, it correctly uses canonical repositories like `projectRepository.listAll()` and `masterDataService.getProjectMasterData(pId)`. Therefore, it does NOT violate canonical ownership for actual production use; it behaves as a preview/fallback only.

## 6. Candidate Next Units

**Candidate A: LU-P6-05 — Central Reports Read Convergence**
- **Target Files**: `src/components/reports/ReportsEngineView.tsx`, `src/services/reportsEngine.service.ts`
- **Current Problem**: Bypasses canonical storage to load trips from `tripEngineService`.
- **Canonical Owner**: `tripRepository` / `indexedDBService`
- **Dependencies**: None
- **Tests**: `fieldReportsCentralDashboardBlock80.test.ts`
- **Scope Boundary**: Reports view trip loading ONLY.

**Candidate B: LU-P6-06 — Operations Dashboard Read Convergence**
- **Target Files**: `src/components/dashboard/OperationsDashboardView.tsx`, `src/services/dashboard.service.ts`
- **Current Problem**: Bypasses canonical storage to load trips via `dashboardService` using `tripEngineService`.
- **Canonical Owner**: `tripRepository` / `indexedDBService`
- **Dependencies**: None
- **Tests**: `fieldReportsCentralDashboardBlock80.test.ts`
- **Scope Boundary**: Dashboard trip metrics loading ONLY.

**Candidate C: LU-P6-07 — Workspace Integration Trip Convergence**
- **Target Files**: `src/components/workspace/WorkspaceIntegrationView.tsx`, `src/services/workspace.service.ts`
- **Current Problem**: Uses `tripEngineService.getTrips()` to gather data for external migration.
- **Canonical Owner**: `tripRepository`
- **Dependencies**: None
- **Scope Boundary**: Workspace Google Drive migration logic ONLY.

**Candidate D: LU-P6-08 — UnloadingOperatorView Fallback Removal**
- **Target Files**: `src/components/field/UnloadingOperatorView.tsx`
- **Current Problem**: Legacy fallback to `tripEngineService` remains if canonical list is empty.
- **Canonical Owner**: `indexedDBService`
- **Dependencies**: None
- **Scope Boundary**: Fallback removal ONLY.

## 7. NEXT LOGICAL UNIT

NEXT_UNIT = LU-P6-05 — Central Reports Read Convergence
TARGET_FILES = src/components/reports/ReportsEngineView.tsx, src/services/reportsEngine.service.ts
CURRENT_PROBLEM = ReportsEngineView and reportsEngine.service.ts depend on tripEngineService to fetch trips and evaluate reports, completely bypassing canonical trip data.
CANONICAL_OWNER = indexedDBService / tripRepository
REQUIRED_CHANGE = Refactor ReportsEngineView to asynchronously fetch trips via indexedDBService / tripRepository (similar to FieldSupervisionView) and pass them explicitly to the reports engine, while removing the default tripEngineService fallback from reportsEngine.service.ts.
REGRESSION_TESTS = src/tests/fieldReportsCentralDashboardBlock80.test.ts, src/tests/fieldSupervisionConvergenceP604.test.ts
DO_NOT_TOUCH = OperationsDashboardView, WorkspaceIntegrationView, TripEngine, MasterData

## 8. Why This Unit Is Next
`ReportsEngineView.tsx` is one of the primary production consumers of trip data. By switching it to the canonical read path, we eliminate a major production UI dependency on `tripEngineService` without touching unrelated features. It naturally follows `FieldSupervisionView` (LU-P6-04), as it's another read-only convergence target that requires no new architecture or mutation logic. It also sets the stage for fixing the dashboard and workspace integrations.
