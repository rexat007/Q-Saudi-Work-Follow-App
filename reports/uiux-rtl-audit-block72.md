# BLOCK 72 — UI/UX & RTL/LTR VISUAL AUDIT REPORT

**Audit Phase**: `UI/UX & RTL/LTR Visual Audit`  
**Audit Strategy**: `AUDIT FIRST (Read-Only Analysis)`  
**Translation Layer Status**: `FORMALLY FROZEN (BLOCK 71 Preserved)`  
**Timestamp**: `2026-09-13T20:00:00.000Z`  
**Audited Locales**: `Arabic (ar, RTL)`, `English (en, LTR)`, `Urdu (ur, RTL)`  

---

## 1. Executive Summary

Following the formal closure and freezing of the internationalization (i18n) layer in BLOCK 71, this audit comprehensively inspects the application's actual visual layout, responsive behavior, accessibility compliance, and bidirectional (RTL/LTR) user experience across all core modules.

In strict compliance with governance constraints:
- **No translations were modified** (`src/locales/ar/index.ts`, `src/locales/en/index.ts`, `src/locales/ur/index.ts` remain 100% frozen).
- **No business logic, state machines, pricing engines, or security rules were altered**.
- **All findings are documented first** and classified by severity without automated mass-refactoring.

### Summary Metrics
| Severity Level | Count | Definition |
| :--- | :--- | :--- |
| **P0 (Critical / Blocker)** | **0** | Broken rendering, crash, inaccessible view, fatal visual corruption |
| **P1 (Major)** | **2** | Significant layout misalignment, directional inversion, unmirrored overlays |
| **P2 (Inconsistency)** | **5** | Hardcoded physical properties, mobile touch target limits, horizontal density |
| **P3 (Cosmetic)** | **3** | Fixed min-widths on mobile, legacy English headers in RTL, icon margin spacing |
| **Total Findings** | **10** | Documented with exact reproductions and targeted fixes |

---

## 2. Audit Scope & Domain Breakdown

### 2.1 Bidirectional (RTL / LTR) Architecture
- **Root Directional Management**: `App.tsx` correctly sets `dir={direction}` on the root element based on `useI18n()`. `ar` and `ur` resolve to `dir="rtl"`, and `en` resolves to `dir="ltr"`.
- **Directional Integrity**:
  - Grid structures, cards, and flex containers naturally mirror in most views.
  - Sub-drawers, specific step arrows, and certain search inputs contain physical properties (`mr-*`, `pr-*`, `left-*`, `right-*`) that do not automatically adapt to document direction.

### 2.2 Responsive UI (Desktop, Tablet, Mobile)
- **Desktop (≥ 1280px)**: Spacious layouts, clear card grids, and high data density perform as intended.
- **Tablet (768px – 1024px)**: Top navigation bar (17 tabs) requires horizontal scrolling; table views rely on `overflow-x-auto`.
- **Mobile (< 640px)**: Most dashboards wrap vertically into single-column layouts; station steppers use horizontal scrolling with `min-w-[700px]`.

### 2.3 Core UX Modules Audited
1. **Navigation & Header**: Mode switching, Language Switcher, Offline / Outbox indicator, Auth.
2. **Operations Dashboard**: KPI cards, filter bars, restricted security profile views.
3. **Trip Engine**: Loading Station, Unloading Station, Weighbridge Inspector, Trip Cards.
4. **Pricing Engine**: Pricing Simulator, Contractual Rules table, 34-test matrix.
5. **Project Setup Wizard**: 7-step wizard, material/carrier inputs, review gate.
6. **Import Center**: 12-stage pipeline, review and human correction table.
7. **Master Data**: Carrier, Material, Truck, Driver management tables.
8. **Reports Engine**: 15 operational reports, filter panels, summary metrics.
9. **Exception Engine**: 12 exception types, resolution modals, SLA tracking.
10. **Offline / PWA**: Outbox Drawer, IndexedDB status, conflict resolution.

---

## 3. Detailed Audit Findings & Catalog

### Finding AUDIT-72-01: Outbox Drawer Hardcoded `dir="rtl"` and Physical Positioning
- **Screen / Component**: `src/components/offline/OutboxDrawer.tsx` (Lines 295–296)
- **Category**: RTL/LTR & Modals / Drawers
- **Severity**: **P1 (Major)**
- **Issue Description**: The outer drawer wrapper hardcodes `dir="rtl"`, `justify-end`, `border-r`, and `text-right`:
  ```tsx
  <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-xs transition-opacity" dir="rtl">
    <div className="w-full max-w-2xl h-full bg-stone-50 border-r border-stone-200 shadow-2xl flex flex-col overflow-hidden text-right">
  ```
  When the user selects English (`en`, LTR), the Outbox drawer ignores the active direction, remaining anchored to the screen's left edge (due to `justify-end` in RTL) with right-aligned text and right borders.
- **Affected Locales**: English (`en`)
- **Reproduction**:
  1. Switch language to English (`EN`) via top-bar LanguageSwitcher.
  2. Click the Outbox pill (`Offline / Online`) in the top navigation.
  3. Observe drawer renders in RTL orientation on the left of the viewport.
- **Recommended Fix**:
  - Remove explicit `dir="rtl"` so the drawer inherits document direction.
  - Replace `justify-end` with logical or direction-conditional positioning (`ltr:justify-end rtl:justify-start` or natural flex flow).
  - Replace `border-r` with `border-l rtl:border-r ltr:border-l`.
  - Replace `text-right` with `text-start`.

---

### Finding AUDIT-72-02: Directional Arrow Inversion in Workflow Steppers
- **Screen / Component**: `src/components/tripEngine/LoadingStation.tsx` (Lines 1284, 1309), `src/components/wizard/ProjectSetupWizard.tsx` (Lines 471, 485)
- **Category**: RTL/LTR & Icons
- **Severity**: **P1 (Major)**
- **Issue Description**: Previous and Next buttons hardcode `<ArrowRight />` for "Previous" and `<ArrowLeft />` for "Next":
  ```tsx
  // Previous button
  <ArrowRight className="w-4 h-4" />
  <span>السابق</span>

  // Next button
  <span>التالي</span>
  <ArrowLeft className="w-4 h-4" />
  ```
  In RTL, pointing right indicates "back to origin" and left indicates "forward in time". In LTR (English), this visual metaphor is reversed: ArrowRight signifies "Next", and ArrowLeft signifies "Previous". This causes semantic disorientation for English users.
- **Affected Locales**: English (`en`)
- **Reproduction**:
  1. Switch language to English.
  2. Open Loading Station or Project Setup Wizard.
  3. Observe "Previous" button displays an arrow pointing right (`→`), while "Next" displays an arrow pointing left (`←`).
- **Recommended Fix**:
  - Add Tailwind's `rtl:rotate-180` to directional arrow icons:
    ```tsx
    <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
    ```
  - Or use direction-aware icon selection based on `isRTL`.

---

### Finding AUDIT-72-03: Language Switcher Hardcoded `text-left` and `right-0`
- **Screen / Component**: `src/components/i18n/LanguageSwitcher.tsx` (Lines 28, 45)
- **Category**: RTL/LTR & Navigation
- **Severity**: **P2 (Inconsistency)**
- **Issue Description**: The switcher container explicitly declares `text-left`, and the dropdown menu declares `right-0`:
  ```tsx
  <div className="relative inline-block text-left shrink-0 z-40" ...>
  ...
  <div className="absolute right-0 mt-1 w-32 rounded-xl bg-white ... z-50">
  ```
  In RTL modes (Arabic and Urdu), `text-left` conflicts with the surrounding RTL flow, and `right-0` pins the menu to the physical right edge, potentially clipping against narrow viewports.
- **Affected Locales**: Arabic (`ar`), Urdu (`ur`)
- **Reproduction**:
  1. Select Arabic or Urdu.
  2. Inspect the LanguageSwitcher dropdown alignment.
- **Recommended Fix**:
  - Replace `text-left` with `text-start`.
  - Replace `right-0` with Tailwind logical `end-0` or `rtl:left-0 ltr:right-0`.

---

### Finding AUDIT-72-04: Search Inputs Physical Padding and Absolute Icon Alignment
- **Screen / Component**:
  - `src/components/masterData/MasterDataView.tsx` (Lines 856, 861)
  - `src/components/importCenter/ImportCenterView.tsx` (Lines 781, 787)
  - `src/components/reports/ReportsEngineView.tsx` (Lines 702, 708)
  - `src/components/pricing/PricingEngineView.tsx` (Lines 782, 784)
- **Category**: RTL/LTR & Forms
- **Severity**: **P2 (Inconsistency)**
- **Issue Description**: Search inputs position the search magnifying glass icon using `absolute right-3 top-2.5` and set padding `pr-9 pl-3` (or `pr-8 pl-3`). In LTR (English), this leaves the icon floating on the far right (trailing edge) while text typing starts on the left edge with standard padding, creating an unmirrored appearance.
- **Affected Locales**: English (`en`)
- **Reproduction**:
  1. In English locale, open Master Data or Reports Engine.
  2. Type a query into the search input. Notice the search icon sits on the far right rather than at the start of the input.
- **Recommended Fix**:
  - Adopt Tailwind logical classes `ps-9 pe-3` and `start-3`, or directional classes `rtl:right-3 ltr:left-3` and `rtl:pr-9 ltr:pl-9`.

---

### Finding AUDIT-72-05: Table Alignment (`text-right`) and Physical Column Borders (`border-l`)
- **Screen / Component**:
  - `src/components/masterData/MasterDataView.tsx` (Line 906)
  - `src/components/reports/ReportsEngineView.tsx` (Lines 719, 726, 747, 755)
  - `src/components/pricing/PricingEngineView.tsx` (Line 680)
- **Category**: RTL/LTR & Tables
- **Severity**: **P2 (Inconsistency)**
- **Issue Description**: Tables explicitly set `<table className="w-full text-right ...">`, and cell borders use `border-l`. In LTR (English), English text and numbers remain forced to the right margin instead of natural left alignment.
- **Affected Locales**: English (`en`)
- **Reproduction**:
  1. In English locale, open Master Data Carriers or Pricing Rules.
  2. Columns with names and descriptions are aligned to the right.
- **Recommended Fix**:
  - Replace `text-right` with `text-start` on table containers and `<th>` elements.
  - Use `border-e` (border inline end) or standard table border collapse.

---

### Finding AUDIT-72-06: Top Navigation Bar Density on Mid-Size Viewports
- **Screen / Component**: `src/App.tsx` (Lines 151–152)
- **Category**: Responsive UI & Navigation
- **Severity**: **P2 (Inconsistency)**
- **Issue Description**: The primary application header hosts 17 tab buttons in a single flex container. On viewports between 768px (iPad) and 1280px (laptop), horizontal scrolling is required, but there are no visual indicators (such as gradient shadows or scroll arrows) signifying additional off-screen tabs.
- **Affected Locales**: All (`ar`, `en`, `ur`)
- **Reproduction**:
  1. Emulate a 768px tablet viewport.
  2. Inspect the top navigation bar. Tabs past the 4th tab are clipped off-screen without a scroll indicator.
- **Recommended Fix**:
  - Add gradient edge fades to the scroll container (`pointer-events-none`).
  - Introduce a grouped dropdown or category switcher on screens below 1024px.

---

### Finding AUDIT-72-07: Interactive Elements Touch Target Sizes
- **Screen / Component**: `src/components/pricing/PricingEngineView.tsx` (Filter pills, line 816), `src/components/tripEngine/WeightEngineView.tsx` (Preset buttons, lines 305–320)
- **Category**: Accessibility & Responsive UI
- **Severity**: **P2 (Inconsistency)**
- **Issue Description**: Preset chips and category filter pills utilize tight padding (`py-0.5 px-2`, yielding total element heights of ~24px). WCAG 2.5.5 / 2.5.8 recommendations require a minimum touch target bounding box of 44x44px for reliable touch interaction on mobile devices.
- **Affected Locales**: All (`ar`, `en`, `ur`)
- **Reproduction**:
  1. On a touch device or mobile emulation, attempt to tap individual filter pills in the Pricing Engine test matrix.
- **Recommended Fix**:
  - Adjust padding responsively: `py-1.5 px-3 min-h-[36px]` on mobile with touch expansion or `min-h-[44px]` touch target envelopes.

---

### Finding AUDIT-72-08: Hardcoded English Column Headers in Import Review Table
- **Screen / Component**: `src/components/importCenter/ImportCenterView.tsx` (Lines 797–800)
- **Category**: Visual Consistency & I18N
- **Severity**: **P3 (Cosmetic)**
- **Issue Description**: The table headers in the Import Center Human Review Table display raw English labels: `Row`, `Field`, `Original Value`, `Suggested Value`. In Arabic and Urdu modes, this creates an inconsistency with the rest of the localized interface. Under the BLOCK 71 i18n freeze policy, translation files cannot be modified now.
- **Affected Locales**: Arabic (`ar`), Urdu (`ur`)
- **Reproduction**:
  1. Open Import Center in Arabic or Urdu.
  2. Navigate to Active Batch review. Column headers remain in English.
- **Recommended Fix**:
  - Catalog for implementation when the translation layer is formally unfrozen in a future release block.

---

### Finding AUDIT-72-09: Hardcoded Physical Margins (`mr-0.5`, `mr-1`)
- **Screen / Component**: `src/App.tsx` (Line 447), `src/components/reports/ReportsEngineView.tsx` (Line 620)
- **Category**: RTL/LTR & Spacing
- **Severity**: **P3 (Cosmetic)**
- **Issue Description**: Small physical spacing classes such as `mr-0.5` or `mr-1` are used between inline icons and text labels. In RTL mode, `mr` places margin to the right (inline start), pushing the icon towards the start instead of separating it from the following label.
- **Affected Locales**: Arabic (`ar`), Urdu (`ur`)
- **Reproduction**:
  1. Inspect the Outbox button in the top navigation header.
- **Recommended Fix**:
  - Replace `mr-*` and `ml-*` with flex container `gap-*` or Tailwind's `me-*` / `ms-*` logical margin classes.

---

### Finding AUDIT-72-10: Fixed `min-w-[700px]` on Step Containers
- **Screen / Component**: `src/components/tripEngine/LoadingStation.tsx` (Line 700), `src/components/tripEngine/UnloadingStation.tsx` (Line 735)
- **Category**: Responsive UI
- **Severity**: **P3 (Cosmetic)**
- **Issue Description**: Workflow steppers enforce `min-w-[700px]` inside `overflow-x-auto`. While this prevents stepper label wrap, on mobile viewports (< 640px) it forces users to horizontally scroll the header bar to see all steps.
- **Affected Locales**: All (`ar`, `en`, `ur`)
- **Reproduction**:
  1. Open Loading Station on mobile viewport (width: 375px).
  2. Notice the stepper bar requires horizontal swipe to view steps 4 through 8.
- **Recommended Fix**:
  - Implement a dual-mode stepper: a compact stepper indicator (`Step 2 of 8: Carrier`) on mobile, and the full multi-step bar on `md:` and above.

---

## 4. Architectural Stability & Compliance Matrix

| Audit Dimension | Status | Verification Detail |
| :--- | :--- | :--- |
| **I18N Translation Freeze** | **PRESERVED** | `src/locales/ar/index.ts`, `en/index.ts`, `ur/index.ts` unmodified |
| **Locale Direction Binding** | **VERIFIED** | `ar: rtl`, `ur: rtl`, `en: ltr` verified via `LOCALE_DIRECTIONS` |
| **Business Logic Integrity** | **PRESERVED** | Zero alterations to pricing, trip state-machines, or security rules |
| **Test Suite Compatibility** | **VERIFIED** | All automated tests continue to execute cleanly |
| **Lint & TypeScript Build** | **VERIFIED** | Zero syntax errors, zero missing types |

---

## 5. Next Steps & Recommended Implementation Roadmap

1. **Phase 1 (Post-Audit Priority Fixes - P1)**:
   - Make Outbox Drawer direction-aware by removing hardcoded `dir="rtl"` and using logical positioning.
   - Mirror workflow arrow navigation icons using `rtl:rotate-180`.
2. **Phase 2 (Polish & Consistency - P2)**:
   - Convert search input paddings to logical `ps-*` / `pe-*` and `start-*`.
   - Update table alignment classes to `text-start` and logical borders.
   - Add scroll affordances to top navigation.
3. **Phase 3 (Long-term Enhancements - P3)**:
   - Mobile touch target adjustments for compact action pills.
   - Dual-mode mobile stepper for loading/unloading stations.
