# BLOCK 80 — FIELD REPORTS & CENTRAL EXECUTIVE DASHBOARD

## Executive Summary
Block 80 delivers the production **Field Reports Workspace** and **Central Executive Dashboard** assembly for enterprise Saudi logistics operations. All reporting suites and dashboard views strictly reuse the authoritative computational services, enforce project authorization boundaries, preserve historical pricing snapshot invariance, and adhere to the frozen 1,128 I18N catalog across Arabic, English, and Urdu.

---

## 1. Field Reports Workspace Architecture

The Field Reports Workspace is structured into 4 distinct functional categories:

### A. Operational Reports (7 Sub-Reports)
- **Daily Operations (`DAILY_OPERATIONS`)**: Comprehensive census of daily trips, dispatched tons, completed shipments, in-transit fleet, returned loads, and daily completion rates.
- **Shift Operations (`SHIFT_OPERATIONS`)**: Logistics movement aggregated across Morning, Evening, and Night shifts with supervisor accountability and ton/trip productivity metrics.
- **Carrier Performance (`CARRIER_PERFORMANCE`)**: Fleet efficiency evaluation, legal axle weight compliance, and exception-free delivery ratios.
- **Material Movement (`MATERIAL_MOVEMENT`)**: Volume and weight metrics partitioned by aggregate material types and project destinations.
- **Truck Utilization (`TRUCK_UTILIZATION`)**: Legal payload utilization analysis comparing actual net load against legal axle limits.
- **Returned Trips (`RETURNED_TRIPS`)**: Full accounting of rejected trips, return inspection reasons, quality auditor identities, and contract deduction impacts.
- **Source Breakdown (`SOURCE_BREAKDOWN`)**: Activity tracking across manual, weighbridge, OCR, and unified ingestion pipelines.

### B. Weighbridge / Variance Reports
- **Weight Variance (`WEIGHT_VARIANCE`)**: Origin vs destination scale net weight comparison, variance kilogram computation, tolerance band evaluation (±1%), and explicit detection of trips accepted via `ACCEPT_ORIGIN_NET_AS_DESTINATION`.

### C. Settlement & Financial Reports (7 Sub-Reports)
- **Settlement by Carrier (`SETTLEMENT_BY_CARRIER`)**: Verified carrier dues computed strictly from immutable pricing snapshots.
- **Settlement by Pricing Type (`SETTLEMENT_BY_PRICING_TYPE`)**: Financial comparison between `PER_TRIP` flat-rate and `PER_TON` metric tariffs.
- **Settlement by Material (`SETTLEMENT_BY_MATERIAL`)**: Transportation cost allocations per material type.
- **Trip-Based Settlement (`TRIP_BASED_SETTLEMENT`)**: Audit verification for `Amount = Trips × Rate/Trip` contracts with pending settlement isolation.
- **Ton-Based Settlement (`TON_BASED_SETTLEMENT`)**: Audit verification for `Amount = Net Tons × Rate/Ton` contracts with pending settlement isolation.
- **Daily Settlement (`DAILY_SETTLEMENT`)**: Daily accrual schedules and contractual liability cash-flow projections.
- **Project Settlement Summary (`PROJECT_SETTLEMENT_SUMMARY`)**: Comprehensive financial statement breaking down Gross Amount, Adjustments, Exception Deductions, and Net Due Amount.

### D. Ingestion / Exception Reports
- **Exception Report (`EXCEPTION_REPORT`)**: 12 failure classifications, severity tiers (CRITICAL, HIGH, MEDIUM, LOW), trip cross-references, resolution workflows, and penalty tracking.

---

## 2. Central Executive Dashboard (7 Conceptual Layers)

1. **Layer 1 — Core Executive KPIs**: High-level telemetry displaying active trips, completion velocity, total net tonnage, exception counts, and approved settlement totals.
2. **Layer 2 — Active Trip Funnel**: Progressive stage monitoring (`LOADING` → `LOADED` → `IN_TRANSIT` → `UNLOADING` → `COMPLETED` / `RETURNED` / `EXCEPTION`).
3. **Layer 3 — Exceptions Breakdown & Risk Matrix**: Exception frequency distributions, weight tolerance breach monitoring, and open issue aging indicators.
4. **Layer 4 — Financial Settlement Overview**: Separation of finalized revenue from pending tariff approvals, ensuring financial audit compliance.
5. **Layer 5 — Cross-Project Health & SLA**: Multi-project distribution comparing carrier reliability, material delivery velocity, and project authorization boundaries.
6. **Layer 6 — Daily Trends & Pricing Distribution**: Breakdown of `PER_TRIP` vs `PER_TON` operational volume, average rates, and volume trends.
7. **Layer 7 — System & Operations Health**: Live Terminal Board providing real-time vehicle movement tracking, search filters, and operational audit telemetry.

---

## 3. Strict System Invariants

1. **I18N Freeze Preservation**:
   - Arabic (`src/locales/ar.ts`): Exactly 1,128 keys
   - English (`src/locales/en.ts`): Exactly 1,128 keys
   - Urdu (`src/locales/ur.ts`): Exactly 1,128 keys
   - Key parity: 100% (zero missing, zero invented keys)
2. **Historical Pricing Snapshot Invariance**:
   - Historical trips use their immutable contractual snapshot rates (`settlementAmount`).
   - Master tariff modifications do NOT alter settled historical trips.
   - Pending settlement trips are strictly isolated from finalized revenue aggregates.
3. **Role-Based Access Control (RBAC) & Project Scoping**:
   - `SUPER_ADMIN`: Global enterprise-wide visibility across all projects.
   - `PROJECT_ADMIN`: Strictly isolated to authorized project IDs; cross-project unauthorized attempts return 0 records and trigger security audit flags.
   - `SITE_SUPERVISOR`: Scoped strictly to designated field stations.

---

## 4. Verification & Test Suite

The automated test suite `src/tests/fieldReportsCentralDashboardBlock80.test.ts` verified 22 test cases with 100% pass rate:
- **Operational Reports (BLOCK80-REP-01)**: PASSED
- **Weighbridge Variance (BLOCK80-REP-02)**: PASSED
- **Financial Settlement (BLOCK80-REP-03)**: PASSED
- **Exception Ingestion (BLOCK80-REP-04)**: PASSED
- **Project Isolation Filter (BLOCK80-FILT-01)**: PASSED
- **Multi-Parameter Filtering (BLOCK80-FILT-02)**: PASSED
- **Contractual Snapshot Invariance (BLOCK80-SNAP-01)**: PASSED
- **Pending Settlement Isolation (BLOCK80-PEND-01)**: PASSED
- **Dashboard 7 Layers (BLOCK80-DASH-01 to 07)**: ALL PASSED
- **RBAC Boundaries (BLOCK80-RBAC-01 to 03)**: ALL PASSED
- **I18N Frozen Catalog Parity (BLOCK80-I18N-01 to 04)**: ALL PASSED

---

## Quality Gate Sign-Off
- **TypeScript Linting**: PASSED (`npm run lint`)
- **Applet Compilation**: PASSED (`npm run build`)
- **Block 80 Test Suite**: PASSED (`npm run test:reports-dashboard-80` — 22/22 tests passed)
