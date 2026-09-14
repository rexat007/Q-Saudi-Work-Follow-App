# BLOCK 76: Final Product UI Architecture & Role-Based Experience

**Date**: 2026-09-13  
**Status**: APPROVED ARCHITECTURAL SPECIFICATION  
**Phase**: ARCHITECTURE & UX DEFINITION ONLY  
**Base Recovery Point**: BLOCK 75 (`reports/uiux-block75-p3-fixes.json`)  
**Translation Layer**: STRICTLY FROZEN (1,128 keys per locale, 0 drift)  
**Scope Invariant**: **No redesigned interface was implemented in BLOCK 76.**

---

## 1. Executive Summary

BLOCK 76 defines the definitive, enterprise-grade user interface architecture and role-based operational experience for the **Q Saudi Work Follow** platform prior to constructing the modernized field and management interfaces in future blocks.

This document serves as the **authoritative architectural blueprint** for all user-facing interactions. It establishes:
1. **Four Major Interface Areas**: Field Input / Field Operations, Projects Interface, Field Reports Interface, and Central Dashboard.
2. **Strict Authority & Role-Based Experience**: Full mapping to the pre-existing 9 system roles with zero invented roles.
3. **Dedicated Field Workflows**: Shortest safe paths for Loading, Unloading, Supervision, and Driver.
4. **Information Architecture & Navigation Model**: Role-aware hierarchy with full backward-compatibility preservation for developer and audit tools.
5. **Multi-Tier Responsive Design**: Dedicated strategies for Phone (< 640px), Tablet (640–1024px), and Desktop (> 1024px).
6. **Component Reuse & Phased Implementation Plan**: Clear roadmap for Blocks 77 through 81.

---

## 2. The Four Major Interface Areas

```
+----------------------------------------------------------------------------------------------------+
|                                    Q SAUDI WORK FOLLOW (CORE ARCHITECTURE)                         |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  [1. FIELD OPERATIONS]         [2. PROJECTS]             [3. FIELD REPORTS]    [4. CENTRAL DASHBOARD]
|  ├─ A. Loading Station         ├─ Project Directory      ├─ Operational        ├─ Executive KPIs   |
|  ├─ B. Unloading Station       ├─ Project Wizard         ├─ Weights & Variance ├─ Active Funnel    |
|  ├─ C. Field Supervision       ├─ Configuration & Rules  ├─ Server Settlement  ├─ Exceptions Alert |
|  └─ D. Driver Mobile View      ├─ Master Data Workspace  └─ Ingestion & Audit  ├─ Financial Health |
|                                └─ User Access (RBAC)                           ├─ Project Benchmarks|
|                                                                                └─ System Integrity |
|                                                                                                    |
|  [SECONDARY DRAWER: SYSTEM & DEVELOPER TOOLS]                                                      |
|  Security Audit • Legacy Migration • Admin Console • Workspace Integration • Exception Engine •   |
|  Import Center • Data Quality Engine • Pricing Tester • Firestore Architecture • Documentation    |
+----------------------------------------------------------------------------------------------------+
```

---

### Area 1: Field Input / Field Operations
Dedicated to rapid, high-accuracy field data capture, weighbridge execution, and operational supervision in high-tempo, outdoor Saudi logistics environments (quarries, construction sites, border scales, industrial cities).

#### 1A. Loading Interface (Loading Station)
- **Primary User**: `SCALE_OPERATOR` (Weighbridge Scale Operator).
- **Secondary Users**: `DISPATCHER`, `SUPERVISOR`, `PROJECT_ADMIN`, `SUPER_ADMIN`.
- **Purpose**: Rapid outbound vehicle weighing, tare/gross recording, gross weight validation, digital waybill ticket generation, and trip dispatch.
- **Entry Point**: `/field/loading`.
- **Main Screen**: Outbound Weighbridge Console with live scale indicators.
- **Secondary Screens**: Truck Tare Database, Driver Iqama Verification, Printed Weigh Ticket Modal, Outbox Queue.
- **Primary Actions**: Capture Tare Weight -> Capture Gross Weight -> Axle Limit Check -> Print Ticket -> Dispatch Trip (`LOADED`).
- **Critical Information**: Truck Plate Number, Max Gross Axle Limit, Tare Weight, Gross Weight, Net Weight, Assigned Project, Material Type, Tamper Flag.
- **Blocking States**: Overloaded vehicle exceeding MOT limit; negative or zero net weight; inactive carrier/truck; missing driver license.
- **Warning States**: Manual weight entry (scale offline bypass); carrier license near expiration; buffered offline dispatch.
- **Empty States**: Scale queue idle; prompt operator to enter plate number or scan truck barcode.
- **Success States**: Trip record generated with unique Ticket ID, synchronized to cloud or stored in offline Mutation Queue.
- **Offline Behavior**: 100% operational offline; generates sequential local ticket IDs and buffers dispatches in IndexedDB `mutationQueue`.
- **Responsive Behavior**:
  - *Phone (< 640px)*: High-contrast single-column flow, 44px+ touch presets, large numeric pad, camera barcode scanner.
  - *Tablet (640–1024px)*: Split view: Vehicle/driver search on left, live weight indicators and ticket preview on right.
  - *Desktop (> 1024px)*: High-density weighbridge dashboard with serial COM-port live scale feed and dispatch queue.
- **Shortest Safe Workflow**:
  1. Operator enters Truck Plate (or scans barcode) -> System autocompletes default Tare & Carrier.
  2. Select active Project and Destination site.
  3. Verify Driver Iqama and License validity.
  4. Select Material type and snapshot active Pricing Rule.
  5. Read or enter Tare Weight (kg).
  6. Read Gross Weight (kg) from bridge scale.
  7. Automated Net Weight calculation (`Gross - Tare`) with axle limit verification.
  8. Preview ticket and click "Issue Ticket & Dispatch" (creates Trip in `LOADED` status).

#### 1B. Unloading Interface (Unloading Station)
- **Primary User**: `SCALE_OPERATOR` / `SITE_RECEIVER` (Site Receiving Inspector).
- **Secondary Users**: `SUPERVISOR`, `PROJECT_ADMIN`, `SUPER_ADMIN`.
- **Purpose**: Inbound trip reception, destination weighbridge capture, origin-vs-destination weight variance checking, exception triggering, and delivery confirmation.
- **Entry Point**: `/field/unloading`.
- **Main Screen**: Inbound Receiving Console.
- **Secondary Screens**: Trip Search by Waybill/Ticket, Variance Evaluation Inspector, Exception Filing Drawer, Delivery Sign-off Slip.
- **Primary Actions**: Search In-Transit Trip -> Record Destination Gross/Tare -> Evaluate Variance -> Flag Exception (if breached) -> Confirm Delivery (`COMPLETED`).
- **Critical Information**: Origin Net Weight (kg), Destination Net Weight (kg), Variance Value (kg & %), Configured Project Tolerance Threshold (%), Arrival & Discharge Timestamps.
- **Blocking States**: Trip not found or not in `IN_TRANSIT`/`ARRIVED` status; severe weight deficit (> 5%) without supervisor override.
- **Warning States**: Variance exceeds allowable project tolerance (e.g. > 1.5% or > 500 kg); delayed arrival beyond travel window.
- **Empty States**: Inbound lane idle; search by Waybill ID, Ticket #, or Truck Plate.
- **Success States**: Trip marked `COMPLETED`; destination receipt locked; settlement base finalized.
- **Offline Behavior**: Searches cached active trips in IndexedDB; queues arrival and unloading mutations in local buffer.
- **Responsive Behavior**:
  - *Phone (< 640px)*: Quick-search input at top, card summary of matched cargo, 2 large numeric inputs for weights, one green confirmation button.
  - *Tablet (640–1024px)*: Dual panel: Trip manifest details on left, dual-scale weight calculator and variance gauge on right.
  - *Desktop (> 1024px)*: Multi-lane inbound receiving terminal with automated weighbridge status.
- **Shortest Safe Workflow**:
  1. Scan Waybill QR code or input Ticket # / Plate #.
  2. System matches Trip in `IN_TRANSIT` or `ARRIVED` status.
  3. Capture Destination Arrival Timestamp and Unloader ID.
  4. Capture Destination Gross & Tare Weights (or Direct Net Weight).
  5. System calculates Variance: `(Dest Net - Origin Net) / Origin Net * 100`.
  6. If variance > threshold: Automatically trigger `WEIGHT_DISCREPANCY` exception requiring supervisor justification.
  7. Confirm Unloading -> Transition Trip to `COMPLETED`.

#### 1C. Field Supervision Interface
- **Primary User**: `SUPERVISOR` / `SITE_SUPERVISOR`.
- **Secondary Users**: `PROJECT_ADMIN`, `SUPER_ADMIN`.
- **Purpose**: Live operational monitoring of trips across all states, real-time exception adjudication, weighbridge batch file ingestion, unresolved entity resolution, and shift performance management.
- **Entry Point**: `/field/supervision`.
- **Main Screen**: Supervisor Operational Command Hub.
- **Secondary Screens**: Active Trips Real-time Grid, Pending Exceptions & Decisions Queue, Weighbridge File Ingestion Station, Entity Resolution Sandbox, Shift Summary.
- **Primary Actions**: Approve/Reject Exceptions, Resolve Unmatched Entities, Ingest Daily Weighbridge CSV/XLSX, Commit Verified Batches, Intervene in Stalled Dispatches.
- **Critical Information**: Real-time In-Transit Trips, Open High-Risk Exceptions, Ingestion Batch Health, Shift Tonnage vs Target, Vehicle Cycle Times.
- **Blocking States**: Unresolved critical exceptions blocking carrier settlement; uncommitted import batches with data anomalies.
- **Warning States**: Stalled vehicles in transit > 4 hours; sudden surge in weight variance frequency.
- **Empty States**: Shift running cleanly: zero active exceptions and zero pending import files.
- **Success States**: Exception resolved with immutable audit trail; import batch successfully committed into trip database.
- **Offline Behavior**: Read-only trip inspection from local cache; decisions queued locally until back online.
- **Responsive Behavior**:
  - *Phone (< 640px)*: Segmented card view ("Alerts", "Trips", "Imports") with swipe gestures for rapid approve/reject actions.
  - *Tablet (640–1024px)*: Master-detail view: exception/batch list on left, decision metadata and history on right.
  - *Desktop (> 1024px)*: Full command center: live KPI metrics, active trip data table, exception triage board, and batch drop-zone.

#### 1D. Driver Interface
- **Primary User**: `DRIVER`.
- **Secondary Users**: None (strictly driver-isolated).
- **Purpose**: Ultra-simple, focused interface allowing drivers to view their currently assigned active trip, view cargo details, mark arrival at the destination site (`ARRIVED`), and present an electronic ticket QR code.
- **Entry Point**: `/field/driver`.
- **Main Screen**: Active Trip Card & Electronic Waybill.
- **Secondary Screens**: Trip Route Overview, Digital QR/Barcode Screen, Shift Trip History.
- **Primary Actions**: View Assigned Trip, Click "Mark Arrived at Destination Site", Present Electronic Ticket.
- **Critical Information**: Assigned Truck Plate, Material Name, Loading Station, Destination Site, Net Cargo Weight, Ticket Number.
- **Blocking States**: No active trip assigned to driver's ID; account inactive.
- **Warning States**: No cellular coverage (arrival action buffered locally).
- **Empty States**: "لا توجد رحلات مسندة حالياً" (No active trips assigned. Please check with your Dispatcher).
- **Success States**: Trip updated to `ARRIVED`; weighbridge scale notified of vehicle arrival.
- **Offline Behavior**: Displays cached trip manifest; queue arrival action in `mutationQueue`.
- **Responsive Behavior**:
  - *Phone (< 640px)*: Large typography, high sunlight contrast, 56px large primary touch button.
  - *Tablet (640–1024px)*: Centered mobile card container with large scannable QR code.
  - *Desktop (> 1024px)*: Emulated mobile container.
- **Strict Architecture Boundaries**: Driver CANNOT create trips, edit weights, view other drivers' trips, or resolve exceptions.

---

### Area 2: Projects Interface
Dedicated to project lifecycle management, configuration of operational rules, master data governance, and user role assignments.

- **Primary User**: `PROJECT_ADMIN`.
- **Secondary Users**: `SUPER_ADMIN` (Global Provisioning), `VIEWER` (Read-Only).
- **Sub-Interfaces**:
  1. **Authorized Projects Directory**: Listing of all projects accessible by user (`assignedProjectIds` or all for `SUPER_ADMIN`) with status, active fleet count, and daily tonnage.
  2. **Project Provisioning Wizard**: 7-step wizard (Metadata -> Geofences & Tolerances -> Carriers -> Pricing Rules -> User Access -> Review -> Commit).
  3. **Project Configuration & Settings**: Operational tolerance limits (percentage and kg), shift schedules, active zones, and settlement terms.
  4. **Project Master Data Workspace**: Scoped management of Carriers, Trucks (tare calibrations), Drivers (licenses), and Materials (pricing ties).
  5. **Project User Access & Governance**: Scoped RBAC assigning users (`DISPATCHER`, `SCALE_OPERATOR`, `SUPERVISOR`, `FINANCE_AUDITOR`) to specific projects.
- **Clear Separation of Concerns**:
  - *Project Management*: Scoped strictly to specific project parameters within `assignedProjectIds`.
  - *Field Operation*: Pure execution (weighing, dispatching, receiving) without project configuration rights.
  - *Central Administration*: Global tenant provisioning, global security audits, and cross-project governance.

---

### Area 3: Field Reports Interface
Enterprise reporting engine providing operational, financial, and compliance insights with multi-format export capabilities.

- **Primary User**: `FINANCE_AUDITOR`.
- **Secondary Users**: `PROJECT_ADMIN`, `SUPERVISOR`, `SUPER_ADMIN`, `VIEWER`.
- **Report Categories**:
  1. **Operational Reports**: Daily Tonnage & Shift Throughput, Fleet/Carrier Utilization, Hourly Dispatch Rhythm, Driver Performance.
  2. **Weighbridge & Weight Variance Reports**: Origin vs Destination Weight Variance Analysis, Tare Weight Drift Log, Overweight Axle Violations, Tolerance Breach History.
  3. **Server Settlement & Financial Reports**: Carrier Freight Statements, ZATCA 15% VAT Reconciliation, Priced vs Pending Settlement Audit, Pricing Snapshot Integrity.
  4. **Weighbridge Ingestion & Exceptions Reports**: Batch File Ingestion Audit, Unresolved Entity Resolution Rate, Operational Exception Log, Tamper Attempt Analysis.
- **Preserved Business & Reporting Rules**:
  - *Source Type Isolation*: Filter by `MANUAL`, `WEIGHBRIDGE`, `EXCEL`, `CSV`, `GOOGLE_SHEETS`, `API`.
  - *Pending Settlement Separation*: Quarantines unpriced or pending trips without distorting confirmed settlement totals.
  - *Pricing Snapshot Governance*: Billing calculations strictly preserve the historical rate captured at trip creation.
  - *Server-Side Settlement Calculation*: Financial figures evaluated strictly via backend formulas (`base * rate + 15% VAT`).
  - *Export Capabilities*: Standardized PDF, XLSX, and CSV generation with column security masking based on user role.

---

### Area 4: Central Dashboard
Executive and management overview providing real-time strategic intelligence, cross-project KPIs, settlement health, and exception alerts.

- **Primary User**: `SUPER_ADMIN`.
- **Secondary Users**: `PROJECT_ADMIN`, `FINANCE_AUDITOR`, `SUPERVISOR`, `VIEWER`.
- **7-Level Information Hierarchy**:
  1. **Most Important Operational KPIs**: Total Shift Tonnage (MT), Active In-Transit Trips Count, Active Carrier Fleet Count, Overall Tonnage Fulfillment %.
  2. **Active & Pending Trips Overview**: Trip Status Funnel (`DRAFT` -> `LOADED` -> `IN_TRANSIT` -> `ARRIVED` -> `UNLOADING` -> `COMPLETED`), Average Transit Cycle Time, Scale Queue Depths.
  3. **Exceptions & Blocking Issues**: High-Severity Exception Banner, Unresolved Weight Discrepancies, Carrier/Driver Conflicts, Overloaded Trucks Warning.
  4. **Financial & Settlement Overview**: Gross Freight Value (SAR), ZATCA 15% VAT Liability (SAR), Pending Settlement Value (SAR), Average Cost per Ton (SAR/MT).
  5. **Cross-Project Health & Comparison**: Project Tonnage Comparison Bar Chart, Project Variance Benchmarking, SLA Adherence Rates.
  6. **Daily Performance Trends**: 24-Hour Dispatch & Delivery Throughput Graph, Peak Weighbridge Utilization Windows, Carrier On-Time Delivery Rates.
  7. **System & Operational Health Alerts**: Offline Mutation Queue Buffer Depth, Weighbridge Ingestion Stream Status, Google Sheets Sync Connectivity, Data Integrity Score.
- **Management Discipline**: The Central Dashboard is designed exclusively for strategic visibility, trend analysis, and intervention dispatch. It must **never** serve as an operational data entry console or replace field weighbridge stations.

---

## 3. Existing System Authority & Role-Based Experience

All interfaces map strictly to the existing 9 authorization roles defined in `src/types/common.ts` and `src/types/entities.ts`:

| Existing Role | Allowed Interfaces | Project Scope | Read | Create | Edit | Delete | Approve | Import | Reporting |
|---|---|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **SUPER_ADMIN** | All 4 Areas + Admin Tools | Global (`*`) | Yes | Yes | Yes | Yes | Yes | Yes | Yes (Full) |
| **PROJECT_ADMIN** | Projects, Field Ops, Reports, Dashboard | Assigned Projects | Yes | Yes (Proj Scope) | Yes | No (Soft) | Yes | Yes | Yes (Full) |
| **SUPERVISOR** / **SITE_SUPERVISOR** | Field Ops (1A, 1B, 1C), Reports, Dashboard | Assigned Projects | Yes | Yes (Trips/Batches)| Yes (Trips) | No | Yes (Exceptions) | Yes | Yes (Operational) |
| **DISPATCHER** | Field Ops (1A Loading), Reports (Read) | Assigned Projects | Yes | Yes (Loading Trips)| Yes (Pending) | No | No | No | Yes (Read-Only) |
| **SCALE_OPERATOR** | Field Ops (1A Loading, 1B Unloading) | Station / Assigned | Yes | Yes (Weights/Tickets)| Yes (Scale Data)| No | No | No | Yes (Scale Log) |
| **FINANCE_AUDITOR** | Reports, Central Dashboard, Projects (Read) | Assigned / Global | Yes | No | No | No | Yes (Financial) | No | Yes (Full Financial) |
| **DRIVER** | Field Ops (1D Driver View Only) | Self-Assigned Trip | Yes | No | No | No | No | No | No |
| **VIEWER** | Projects (Read), Reports (Read), Dashboard | Assigned Projects | Yes | No | No | No | No | No | Yes (Read-Only) |

*Zero new roles are invented. All permissions enforce `assignedProjectIds` tenant boundaries.*

---

## 4. Navigation Architecture

To preserve 100% of existing functionality while offering a clean, product-grade experience, the top-level navigation will be organized into 4 primary role-aware areas, complemented by a secondary **System & Developer Tools Drawer**:

```
+---------------------------------------------------------------------------------------------------------+
| [Q Saudi Work Follow]   [Dashboard]  [Field Operations v]  [Projects v]  [Field Reports]  [System Tools v]|
+---------------------------------------------------------------------------------------------------------+
```

### Dynamic Role-Based Top-Level Items
1. **Dashboard** (`NAV_DASHBOARD`): Visible to `SUPER_ADMIN`, `PROJECT_ADMIN`, `SUPERVISOR`, `FINANCE_AUDITOR`, `VIEWER`.
2. **Field Operations** (`NAV_FIELD_OPS`):
   - *Loading Station*: Visible to `SCALE_OPERATOR`, `DISPATCHER`, `SUPERVISOR`, `PROJECT_ADMIN`, `SUPER_ADMIN`.
   - *Unloading Station*: Visible to `SCALE_OPERATOR`, `SUPERVISOR`, `SITE_SUPERVISOR`, `PROJECT_ADMIN`, `SUPER_ADMIN`.
   - *Field Supervision*: Visible to `SUPERVISOR`, `SITE_SUPERVISOR`, `PROJECT_ADMIN`, `SUPER_ADMIN`.
   - *Driver Console*: Visible exclusively to `DRIVER`.
3. **Projects** (`NAV_PROJECTS`):
   - *Projects Directory*: Visible to `PROJECT_ADMIN`, `SUPER_ADMIN`, `FINANCE_AUDITOR`, `VIEWER`.
   - *Project Setup Wizard*: Visible to `PROJECT_ADMIN`, `SUPER_ADMIN`.
   - *Master Data*: Visible to `PROJECT_ADMIN`, `SUPER_ADMIN`.
4. **Field Reports** (`NAV_REPORTS`): Visible to `FINANCE_AUDITOR`, `PROJECT_ADMIN`, `SUPERVISOR`, `SUPER_ADMIN`, `VIEWER`.
5. **System & Developer Tools** (`NAV_SYSTEM_TOOLS` - Secondary Drawer):
   - Preserves all 17 pre-existing tabs without omission:
     - `SECURITY_AUDIT` (16-Domain Compliance Suite)
     - `LEGACY_MIGRATION` (20-Column Legacy Engine)
     - `ADMIN_CONSOLE` (11-Section Enterprise Admin)
     - `WORKSPACE_INTEGRATION` (Google Sheets & Drive)
     - `EXCEPTION_ENGINE` (12-Type Exception Sandbox)
     - `IMPORT_CENTER` (12-Stage Ingestion Pipeline)
     - `DATA_QUALITY` (Entity Resolution & Fuzzy Match)
     - `PRICING_ENGINE` (9 Pricing Automated Tests)
     - `FIRESTORE_ARCH` (Firestore Domain Models)
     - `RELATIONS` (Entity Relationships Explorer)
     - `PRINCIPLES` (Architectural Governance Principles)
     - `DOCS` (Markdown System Documentation)

---

## 5. Responsive Strategy

| Screen Size | Breakpoint | Target Interfaces | Primary UX Paradigms |
|---|---|---|---|
| **Phone** | `< 640px` | Loading, Unloading, Driver, Mobile Supervision | - Single-column vertical stacks<br>- Minimum 44px–56px touch target buttons<br>- Zero horizontal overflow/scrolling<br>- High sunlight contrast typography<br>- Camera barcode/QR scanning integration |
| **Tablet** | `640px – 1024px` | Field Supervision, Inbound Weighing, Projects Directory | - Two-column master-detail split views<br>- Floating primary action button<br>- Responsive table column prioritization<br>- Collapsible filtering sheets |
| **Desktop** | `> 1024px` | Central Dashboard, Project Management, Financial Reports | - High-density information grids<br>- Side-by-side data comparison panels<br>- Sticky header tables with multi-sort<br>- Keyboard navigation accelerators |

---

## 6. Component Reuse & Redesign Roadmap

### Reusable Components (High Value Preservation)
- `src/components/tripEngine/LoadingStation.tsx`: Reused as core engine for Area 1A (Loading Station).
- `src/components/tripEngine/UnloadingStation.tsx`: Reused as core engine for Area 1B (Unloading Station).
- `src/components/tripEngine/StateMachineController.tsx`: Reused for supervision state transitions and audit trails.
- `src/components/reports/ReportsEngineView.tsx`: Reused for Area 3 (Field Reports).
- `src/components/wizard/ProjectSetupWizard.tsx`: Reused for Area 2 (Project Creation Wizard).
- `src/components/masterData/MasterDataView.tsx`: Reused for Area 2 (Project Master Data).
- `src/components/dashboard/OperationsDashboardView.tsx`: Reused and promoted for Area 4 (Central Dashboard).
- `src/components/importCenter/ImportCenterView.tsx`: Reused for Area 1C (Weighbridge Batch Ingestion).

### Components to Create / Redesign in Future Blocks
1. **Dedicated Driver View** (`DriverConsoleView.tsx`): Streamlined, low-overhead (< 250 LOC) card view with large arrival button and digital ticket QR code.
2. **Dedicated Supervision Command Board** (`FieldSupervisionView.tsx`): Consolidating active trips, pending exceptions, and daily weighbridge batch drops into a single operational view.
3. **Role-Aware Root Navigation Shell**: Refactoring `App.tsx` top navigation from 17 tabs to 4 primary role-aware areas plus the System Tools Drawer.

---

## 7. Implementation Roadmap for Future Blocks

1. **BLOCK 77**: **Field Operations — Loading & Unloading Operator Dedicated Interfaces**  
   *Scope*: Build dedicated, distraction-free Loading Station and Unloading Station views tailored for Scale Operators with offline persistence.
2. **BLOCK 78**: **Field Supervision & Driver Dedicated Interfaces**  
   *Scope*: Build the Field Supervision command center (live trips, exceptions, batch import triage) and the dedicated Driver mobile view (active trip, arrival trigger, digital ticket).
3. **BLOCK 79**: **Project Management & Master Data Workspace**  
   *Scope*: Build the multi-project directory, edit/configuration drawers, and integrate project-scoped master data and access control governance.
4. **BLOCK 80**: **Field Reports & Central Executive Dashboard**  
   *Scope*: Refactor Field Reports into 4 categorized domains and enhance Central Executive Dashboard with cross-project comparison and financial indicators.
5. **BLOCK 81**: **Role-Based Navigation & System Assembly**  
   *Scope*: Unify the 4 major areas under dynamic role-based navigation with full backward-compatibility developer drawer, completing product readiness.

---

## 8. Verification & Explicit Confirmations

- **I18N remains FROZEN.** (Arabic: 1,128 keys, English: 1,128 keys, Urdu: 1,128 keys; zero drift; zero keys added/modified).
- **No redesigned interface was implemented in BLOCK 76.** (Architecture and UX definition only).
- **Business Logic Intact**: Zero modifications to pricing rules, financial calculations, state machine transitions, security rules, or database schemas.
