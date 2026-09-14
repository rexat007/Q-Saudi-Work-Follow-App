# BLOCK 77 — Field Operations: Loading & Unloading Dedicated Interfaces

**Status**: Implemented & Formally Verified  
**Date**: September 13, 2026  
**Architecture Baseline**: Block 76 GitHub Recovery Point (`reports/final-ui-architecture-block76.md`)  
**I18N Status**: Strictly Frozen (1,128 Keys per Locale in AR, EN, UR — 0 Changes)

---

## Executive Summary

BLOCK 77 implements the first production field operator interfaces in direct execution of the architecture defined in BLOCK 76:
1. **Loading Operator Interface** (`src/components/field/LoadingOperatorView.tsx`): Dedicated field workstation for Scale Operators and Dispatchers at source quarry and project loading weighbridges.
2. **Unloading Operator Interface** (`src/components/field/UnloadingOperatorView.tsx`): Dedicated field workstation for Site Receivers and Scale Operators at destination project receipt weighbridges.
3. **Field Operations Suite** (`src/components/field/FieldOperationsView.tsx`): Unified operator environment featuring station switching, live offline simulation, role simulation, and in-app notifications.

Both interfaces are purpose-built field tools adhering strictly to the **IDENTIFY → CAPTURE → VALIDATE → ACT → CONFIRM** operational paradigm, replacing administrative clutter with touch-first controls, large digital scale displays, and zero-typing inbound truck queues.

---

## 1. Loading Operator Interface

### Primary Roles
- `SCALE_OPERATOR`
- `DISPATCHER` (where authorized by project RBAC)
- Operational Supervisors & Administrators: `SUPERVISOR`, `SITE_SUPERVISOR`, `PROJECT_ADMIN`, `SUPER_ADMIN`

### Forbidden Roles & Security Barrier
- `FINANCE_AUDITOR`
- `DRIVER`
- `VIEWER`

If an unauthorized user accesses the Loading Operator interface, a high-contrast security barrier immediately blocks interaction, displaying the actor's identifier and role without exposing operational weighbridge controls.

### Workflow: IDENTIFY → CAPTURE → VALIDATE → ACT → CONFIRM
1. **IDENTIFY**:
   - Project selection scoped to the operator's authorized project assignments (`assignedProjectIds`).
   - Carrier quick selector: Large, high-contrast cards showing company name and code.
   - Truck selector: Instant one-tap cards filtered to trucks belonging to the chosen carrier.
   - Driver selector: One-tap dropdown showing licensed drivers belonging to the chosen carrier.
   - Material selector: Authorized bill-of-quantities materials for the project.
2. **CAPTURE**:
   - Dual tare/gross weighbridge entry points with large 24px-32px digital readouts.
   - Quick tare presets: `8,200 kg`, `13,800 kg`, `14,200 kg`, `15,000 kg`.
   - Quick gross presets: `42,000 kg`, `45,600 kg`, `49,800 kg`.
   - Touch adjustment buttons: `+100`, `+500`, `-100`, `-500` kg.
   - Live digital scale simulation buttons ("Scale In" and "Scale Out") for instant weighbridge hardware readouts.
3. **VALIDATE**:
   - Instant client calculation of net weight (`Gross - Tare`) in kilograms and metric tons.
   - Regulatory weight and axle checks:
     - Warning banner if net weight exceeds 35 metric tons (Saudi General Transport Authority limits).
     - Warning banner if gross weight exceeds 50 metric tons.
   - Invariant blocking error if `Gross <= Tare` (disables the primary dispatch action).
   - Read-only contractual settlement preview enforcing that financial totals are computed server-side only.
4. **ACT**:
   - Dominant, high-contrast primary touch action (min-height 52px): **تأكيد وإصدار تذكرة الرحلة (Confirm & Dispatch)**.
   - Creates the trip record via `tripEngineService.createTripViaLoadingStation`, immediately advancing status from `LOADED` to `IN_TRANSIT`.
   - Rejects any client-submitted `clientNetWeight` in accordance with core security invariants.
   - Offline awareness: If offline, validates IndexedDB prerequisites via `offlineCacheService.validateOfflineTripPrerequisites`, persists the trip locally, and queues a `CREATE_TRIP` task into `outboxService`.
5. **CONFIRM**:
   - Digital thermal weighbridge ticket layout featuring ticket ID, trip serial, truck plate, driver name, carrier, tare/gross/net weights, and timestamp.
   - Print and share action buttons.
   - One-touch "Next Truck" reset button that keeps project context intact for high-speed continuous weighbridge throughput.

---

## 2. Unloading Operator Interface

### Primary Roles
- `SCALE_OPERATOR`
- `SITE_RECEIVER`
- Operational Supervisors & Administrators: `SITE_SUPERVISOR`, `SUPERVISOR`, `PROJECT_ADMIN`, `SUPER_ADMIN`

### Forbidden Roles & Security Barrier
- `DISPATCHER` (Dispatchers operate at the origin and cannot confirm destination receipt)
- `FINANCE_AUDITOR`
- `DRIVER`
- `VIEWER`

### Workflow: IDENTIFY → CAPTURE → VALIDATE → ACT → CONFIRM
1. **IDENTIFY**:
   - Rapid search by `tripSerial`, `ticketId`, or `truckId`.
   - Security check prohibiting bare-plate lookup (`PLATE_ONLY_PROHIBITED`) to prevent ambiguous matching of historical trips.
   - **Inbound Manifest Queue (Zero Typing)**: Live list of trucks currently in `IN_TRANSIT`, `ARRIVED`, or `UNLOADING` status. The site receiver simply taps the arriving truck card to populate the workstation.
2. **CAPTURE**:
   - Support for both **Direct Net** weight entry and **Dual Scale** entry (Destination Gross - Destination Tare).
   - Touch adjustments (`±100 kg`, `±500 kg`).
   - Quick tolerance simulation presets: acceptable minor shrinkage (`-150 kg`) and major discrepancy (`-2,500 kg`).
3. **VALIDATE**:
   - **Variance and Tolerance Handling**:
     - Live variance calculation: `varianceWeight = destNetWeight - originNetWeight`.
     - Percentage variance: `(varianceWeight / originNetWeight) * 100`.
     - Effective tolerance threshold: `max(500 kg, originNet * 1.5%)`.
     - High-visibility status indicator:
       - Green badge: Within tolerance.
       - Red badge: Out of tolerance (shrinkage or overage beyond contractual tolerance).
4. **ACT**:
   - State-machine compliance:
     - `IN_TRANSIT`: One-touch button "Record Arrival" advances status to `ARRIVED`.
     - `ARRIVED`: One-touch button "Start Unloading" assigns receiver and advances status to `UNLOADING`.
     - `UNLOADING`: Primary button "Complete & Verify Variance" triggers server-side closure and moves trip to `COMPLETED`.
   - **Explicit Origin Net Acceptance**:
     - When destination scale is uncalibrated or origin weight is contractually adopted, the operator clicks **"اعتماد صافي وزن المصدر كوزن استلام" (Accept Origin Net as Destination)**.
     - This explicitly sets `destNetWeight = originNetWeight`, records variance as `0 kg`, and attaches an audit note `[اعتماد صريح لصافي وزن المصدر]`.
   - If variance exceeds tolerance upon completion, `tripEngineService` automatically registers a formal `TripExceptionEntity` (severity `HIGH` or `BLOCKING`) and freezes financial settlement until managerial review.
5. **CONFIRM**:
   - Destination receipt presentation displaying origin net vs destination net comparison and verified variance stamp.
   - Instant transition to receive the next inbound vehicle.

---

## 3. Role-Based Security & Barriers

| Interface | Authorized Roles | Forbidden Roles | Enforcement Location |
| :--- | :--- | :--- | :--- |
| **Loading Station** | `SCALE_OPERATOR`, `DISPATCHER`, `SUPERVISOR`, `SITE_SUPERVISOR`, `PROJECT_ADMIN`, `SUPER_ADMIN` | `FINANCE_AUDITOR`, `DRIVER`, `VIEWER` | `LoadingOperatorView.tsx` & `tripEngineService.ts` |
| **Unloading Station** | `SCALE_OPERATOR`, `SITE_RECEIVER`, `SITE_SUPERVISOR`, `SUPERVISOR`, `PROJECT_ADMIN`, `SUPER_ADMIN` | `DISPATCHER`, `FINANCE_AUDITOR`, `DRIVER`, `VIEWER` | `UnloadingOperatorView.tsx` & `tripEngineService.ts` |

---

## 4. Responsive Workstation Modes

Both workstations are crafted with Tailwind utility classes following strict responsive design rules:

### 1. Phone (< 640px)
- Single-column linear layout.
- Minimum 44px to 52px touch targets for all interactive controls.
- One dominant call-to-action button anchored at the bottom of each workflow step.
- Secondary analytics and dense diagnostic tables are suppressed to maintain operational focus.

### 2. Tablet (640px – 1024px)
- Optimized 2-column workstation layout.
- Column 1: Entity identification and inbound manifest selector.
- Column 2: Weighbridge scale controls, variance gauges, and primary execution button.

### 3. Desktop (> 1024px)
- High-throughput operational workstation.
- Left panel: Entity selectors, inbound truck manifest queue, and historical context.
- Center/Right panel: Large digital weight displays, axle compliance gauges, and primary actions.

---

## 5. Offline Outbox & Persistence Preservation

1. **Prerequisite Check**: Before local dispatch, `offlineCacheService.validateOfflineTripPrerequisites` validates that the project, carrier, truck, driver, material, and pricing rule exist in the local cache.
2. **Pricing Rule Invariant**: If a pricing rule is missing offline, trip creation is strictly blocked.
3. **Outbox Synchronization**: When offline, new trips are saved to IndexedDB (`TRP-OFFLINE-*`) and queued into `outboxService` with an idempotent mutation key (`CREATE-TRIP-OFFLINE-*`).

---

## 6. I18N Freeze Verification

The I18N catalog remains **strictly frozen**:
- `src/locales/ar/index.ts`: Exactly **1,128 keys**
- `src/locales/en/index.ts`: Exactly **1,128 keys**
- `src/locales/ur/index.ts`: Exactly **1,128 keys**
- Translation drift: **0 keys**

No keys were added, modified, or deleted. All new UI text leverages either existing translation tokens or standard contextual domain Arabic strings.

---

## 7. Quality Assurance & Test Coverage

All 21 comprehensive test cases in `src/tests/fieldLoadingUnloadingBlock77.test.ts` pass with zero failures:
- `B77-T01` to `B77-T04`: Role authorization and unauthorized barriers.
- `B77-T05` to `B77-T07`: Loading happy path, client net weight tampering rejection, and weight invariants.
- `B77-T08` to `B77-T12`: Unloading trip lookup, plate-only prohibition, variance calculation, tolerance exception handling, and origin-net acceptance.
- `B77-T13` to `B77-T17`: Component existence, field operations suite, and deliverable reports.
- `B77-T18` to `B77-T21`: Strict I18N freeze across all three language catalogs.
