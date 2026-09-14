# BLOCK 82A — RUNTIME DATA ORIGIN TRACE

**Execution Mode**: READ ONLY  
**Inspection Date**: September 14, 2026  
**Target Application**: Q Saudi Work Follow (Tactical Logistics & Heavy Transport Architecture)  

---

## 1. Executive Summary

This forensic investigation traces the exact runtime origin of every numeric value, statistic, trip, KPI, and operational entity rendered in the live application preview.

### Core Discovery
The visible numbers in the live application preview **do NOT originate from Firestore or IndexedDB databases**. Instead, they are generated dynamically by pure in-memory services (`dashboardService`, `reportsEngineService`, `tripEngineService`) whose singleton state instances are initialized at module evaluation time with static seed arrays (`INITIAL_TRIP_SEED`, `INITIAL_EXCEPTIONS_SEED`, `DEFAULT_PROJECTS`, `DEFAULT_CARRIERS`, and hardcoded component defaults in `FieldSupervisionView.tsx` and `DriverView.tsx`).

---

## 2. Component & Value Tracing (Source Chains)

### (A) Central Executive Dashboard (`OperationsDashboardView.tsx`)
```
UI Component: OperationsDashboardView.tsx
  ↳ Hook: useMemo()
    ↳ Service: dashboardService.getFilteredTrips()
      ↳ Source: tripEngineService.getAllTrips()
        ↳ In-Memory Singleton: TripEngineService.trips
          ↳ Source Array: INITIAL_TRIP_SEED (src/services/tripEngine.service.ts, lines 29–548)
```
- **Total Trips (10)**: Count of items in `INITIAL_TRIP_SEED`.
- **Completed Trips (6)**: Items in `INITIAL_TRIP_SEED` where `status === 'COMPLETED'`.
- **In-Transit Trips (2)**: Items in `INITIAL_TRIP_SEED` where `status === 'IN_TRANSIT' | 'LOADED'`.
- **Returned Trips (1)**: Items in `INITIAL_TRIP_SEED` where `status === 'RETURNED'`.
- **Exception Trips (1)**: Items in `INITIAL_TRIP_SEED` where `status === 'EXCEPTION'`.
- **Total Net Tonnage (236.40 Tons)**: Sum of `destNetWeight` (or `netWeight`) divided by 1,000 for `INITIAL_TRIP_SEED`.
- **Total Financial Settlement (SAR 18,340.50)**: Sum of `pricingSnapshot.settlementAmount` for `INITIAL_TRIP_SEED`.
- **Carrier Performance**: Dynamic aggregation of `INITIAL_TRIP_SEED` grouped by `carrierId`.
- **Live Terminal Board (10 rows)**: Direct mapping over `INITIAL_TRIP_SEED`.

### (B) Field Reports & Exports (`ReportsEngineView.tsx`)
```
UI Component: ReportsEngineView.tsx
  ↳ Hook: useMemo()
    ↳ Service: reportsEngineService.filterTrips()
      ↳ Source: tripEngineService.getTrips()
        ↳ In-Memory Singleton: TripEngineService.trips (INITIAL_TRIP_SEED)
```
- Populates all 12 report categories (Daily, Shift, Carrier, Material, Truck, Financial, Weighbridge, Exceptions) directly from `tripEngineService.trips`.

### (C) Field Operations Workstations
- **Loading Workstation (`LoadingOperatorView.tsx`)**:
  - `tareWeight` defaults to `8,200 kg` via `useState(8200)` (line 93).
  - `grossWeight` defaults to `45,600 kg` via `useState(45600)` (line 94).
  - Carriers & Materials list populated from `SAMPLE_QUALITY_CONTEXT` (line 70).
- **Unloading Workstation (`UnloadingOperatorView.tsx`)**:
  - `searchQuery` defaults to `'TRP-NEOM-8892'` via `useState('TRP-NEOM-8892')` (line 68).
  - Destination weights default to Gross: `45,450 kg`, Tare: `14,200 kg`, Net: `31,250 kg` (lines 74–76).
  - Inbound queue populated via `tripEngineService.getAllTrips()` (line 94).
- **Field Supervision Station (`FieldSupervisionView.tsx`)**:
  - Active trips table renders a hardcoded array `mockTrips` (line 45) containing 3 rows (`TRP-101`, `TRP-102`, `TRP-103`).
- **Driver Isolated View (`DriverView.tsx`)**:
  - Current trip card renders a hardcoded object `mockTrip` (line 29) for `TRP-2024-0899` / `TCK-5510-XA`.

### (D) Exception Engine (`ExceptionEngineView.tsx`)
```
UI Component: ExceptionEngineView.tsx
  ↳ Hook: exceptionEngine.getAllExceptions()
    ↳ In-Memory Singleton: ExceptionEngine.exceptions (Map)
      ↳ Source Array: INITIAL_EXCEPTIONS_SEED (src/services/exceptionEngine.service.ts, lines 23–249)
```
- Renders 12 synthetic exception records covering all 12 exception taxonomy codes.

---

## 3. Exact Display Origin Table

| Visible Value / Widget | Component | Data Source Chain | Classification | Exact File & Function | Action Required (Minimal Fix) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **10 Total Trips** | `OperationsDashboardView.tsx` | `dashboardService` → `tripEngineService.trips` | `SEED_DATA` | `/src/services/tripEngine.service.ts`<br>`TripEngineService.trips` (line 563) | Change default in-memory initialization to `private trips: TripRecord[] = [];` |
| **6 Completed Trips** | `OperationsDashboardView.tsx` | `dashboardService.computeTripStatusMetrics()` | `SEED_DATA` | `/src/services/dashboard.service.ts`<br>`computeTripStatusMetrics` | Automatically resolves to 0 when `trips` is `[]`. |
| **2 In-Transit Trips** | `OperationsDashboardView.tsx` | `dashboardService.computeTripStatusMetrics()` | `SEED_DATA` | `/src/services/dashboard.service.ts`<br>`computeTripStatusMetrics` | Automatically resolves to 0 when `trips` is `[]`. |
| **1 Returned Trip** | `OperationsDashboardView.tsx` | `dashboardService.computeTripStatusMetrics()` | `SEED_DATA` | `/src/services/dashboard.service.ts`<br>`computeTripStatusMetrics` | Automatically resolves to 0 when `trips` is `[]`. |
| **1 Exception Trip** | `OperationsDashboardView.tsx` | `dashboardService.computeTripStatusMetrics()` | `SEED_DATA` | `/src/services/dashboard.service.ts`<br>`computeTripStatusMetrics` | Automatically resolves to 0 when `trips` is `[]`. |
| **236.40 Net Tonnage** | `OperationsDashboardView.tsx` | `dashboardService.computeTonnageMetrics()` | `SIMULATION_DATA` | `/src/services/dashboard.service.ts`<br>`computeTonnageMetrics` | Automatically resolves to 0 when `trips` is `[]`. |
| **SAR 18,340.50 Settlement** | `OperationsDashboardView.tsx` | `dashboardService.computeSettlementMetrics()` | `SIMULATION_DATA` | `/src/services/dashboard.service.ts`<br>`computeSettlementMetrics` | Automatically resolves to 0 when `trips` is `[]`. |
| **4 Carriers Ranking** | `OperationsDashboardView.tsx` | `dashboardService.computeCarrierPerformance()` | `SEED_DATA` | `/src/services/dashboard.service.ts`<br>`computeCarrierPerformance` | Automatically resolves to empty array `[]` when `trips` is `[]`. |
| **10 Terminal Rows** | `OperationsDashboardView.tsx` | `dashboardService.generateLiveTerminalBoard()` | `SEED_DATA` | `/src/services/dashboard.service.ts`<br>`generateLiveTerminalBoard` | Automatically resolves to empty array `[]` when `trips` is `[]`. |
| **12 Exceptions List** | `ExceptionEngineView.tsx` | `exceptionEngine.getAllExceptions()` | `SEED_DATA` | `/src/services/exceptionEngine.service.ts`<br>`ExceptionEngine constructor` | Initialize `this.exceptions = new Map();` without automatic seed injection. |
| **3 Supervision Trips** | `FieldSupervisionView.tsx` | Direct component array `mockTrips` | `HARDCODED_UI_DEFAULT` | `/src/components/field/FieldSupervisionView.tsx`<br>`const mockTrips` (line 45) | Connect to `tripEngineService.getTrips()`. |
| **1 Driver Trip Card** | `DriverView.tsx` | Direct component object `mockTrip` | `HARDCODED_UI_DEFAULT` | `/src/components/field/DriverView.tsx`<br>`const mockTrip` (line 29) | Connect to `tripEngineService` for driver's active trip. |
| **Scale Weights (8.2t/45.6t)** | `LoadingOperatorView.tsx` | Component `useState(8200)` / `useState(45600)` | `HARDCODED_UI_DEFAULT` | `/src/components/field/LoadingOperatorView.tsx`<br>lines 93–94 | Set default initial state to `0` or `''`. |
| **Unloading Weights (45.45t/14.2t)** | `UnloadingOperatorView.tsx` | Component `useState(45450)` / `useState(14200)` | `HARDCODED_UI_DEFAULT` | `/src/components/field/UnloadingOperatorView.tsx`<br>lines 74–76 | Set default initial state to `0` or `''`. |

---

## 4. Firestore & Local Storage Trace

### Firestore Database
- **Database Instance**: `ai-studio-qsaudiworkfollow-ab1cba1e-ac08-4099-bc72-193202e518f1`
- **Query / Document Audit**:
  - `projects`: 0 documents queried by default dashboard.
  - `trips`: 0 documents queried by default dashboard.
  - `exceptions`: 0 documents queried by default dashboard.
- **Classification**: `DERIVED_FROM_EMPTY_STATE` (The database is provisioned and ready, but default view does not pull from Firestore directly without authenticated user action).

### Local Storage / IndexedDB
- `IndexedDB` (`q_saudi_logistics_offline_db`): Clean of uncommitted operational records post Block 82.
- `localStorage`: Contains only `q_saudi_locale` ('ar') and `q_saudi_active_role` ('SUPER_ADMIN').
- `outbox`: 0 pending sync operations.

---

## 5. Empty-Database Test Evaluation

We inspected the code path that executes when `tripEngineService.trips` is passed an empty array `[]`:

1. **`dashboardService.computeTripStatusMetrics([])`**:
   - `totalTrips = 0`
   - `completedTrips = 0`, `inTransitTrips = 0`, `returnedTrips = 0`, `exceptionTrips = 0`, `pendingReviewTrips = 0`
2. **`dashboardService.computeTonnageMetrics([])`**:
   - `totalOriginNetTons = 0`, `totalDestinationNetTons = 0`, `netVarianceTons = 0`, `netVariancePercent = 0`
3. **`dashboardService.computeSettlementMetrics([])`**:
   - `totalSettlementSAR = 0`, `finalizedSettlementSAR = 0`, `pendingSettlementSAR = 0`
4. **`dashboardService.computeCarrierPerformance([])`**: Returns `[]`. The UI gracefully displays an empty-state message.
5. **`dashboardService.computeMaterialDistribution([])`**: Returns `[]`. The UI gracefully displays an empty-state message.
6. **`dashboardService.computePricingDistribution([])`**: Returns `[]`. The UI gracefully displays an empty-state message.
7. **`dashboardService.generateLiveTerminalBoard([])`**: Returns `[]`. The UI displays an empty table message.

**Conclusion**: The dashboard computation functions do **NOT fabricate fake numbers, fallback metrics, or synthetic curves** when data is empty. They are mathematically pure and render `0` and empty lists cleanly.

---

## 6. Final Conclusion & Explicit Answers

### **A. Are the visible numbers coming from persisted data?**
> **No.** None of the visible dashboard counters, tonnage summaries, or financial totals are queried from Firestore or IndexedDB.

### **B. Are they being generated by application code?**
> **Yes.** The metrics are mathematically calculated by `dashboardService` and `reportsEngineService` at runtime by aggregating the in-memory array in `tripEngineService`.

### **C. Are they static fixtures/defaults?**
> **Yes.** The initial state fed into `tripEngineService` is the static fixture array `INITIAL_TRIP_SEED` (10 items), and the exceptions feed is `INITIAL_EXCEPTIONS_SEED` (12 items). Furthermore, `FieldSupervisionView.tsx` and `DriverView.tsx` contain inline static arrays/objects (`mockTrips` and `mockTrip`), and the scale operator forms contain hardcoded default numbers in `useState`.

### **D. Is there a mixture?**
> **Yes.** The runtime state is a mixture of:
> 1. **`SEED_DATA` & `SIMULATION_DATA`**: In-memory service seeds (`INITIAL_TRIP_SEED`, `INITIAL_EXCEPTIONS_SEED`, `DEFAULT_PROJECTS`, `DEFAULT_CARRIERS`).
> 2. **`HARDCODED_UI_DEFAULT`**: Inline constants and form `useState` default values in specific React view components.

### **E. What exact change is required to make a completely fresh runtime display truly empty/clean?**

To make a completely fresh runtime display 100% clean and empty (without deleting test fixtures from automated test suites):
1. **`src/services/tripEngine.service.ts`**:
   - Change `private trips: TripRecord[] = [...INITIAL_TRIP_SEED];` to `private trips: TripRecord[] = [];`.
   - Preserve `INITIAL_TRIP_SEED` export for test files (`src/tests/*`) and explicit "Load Demo Data" button.
2. **`src/services/exceptionEngine.service.ts`**:
   - Change constructor to initialize an empty `Map<string, ExceptionRecord>()` instead of iterating over `INITIAL_EXCEPTIONS_SEED`.
3. **`src/components/field/FieldSupervisionView.tsx`**:
   - Replace inline `mockTrips = [ ... ]` with `tripEngineService.getTrips()`.
4. **`src/components/field/DriverView.tsx`**:
   - Replace inline `mockTrip = { ... }` with a lookup from `tripEngineService.getTrips()` matching the driver.
5. **`src/components/field/LoadingOperatorView.tsx` & `UnloadingOperatorView.tsx`**:
   - Change `useState(8200)` and `useState(45600)` to `useState<number | ''>('')` (or `0`).
