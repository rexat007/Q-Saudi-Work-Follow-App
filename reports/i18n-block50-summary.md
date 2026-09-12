# BLOCK 50 — LOW_RISK Controlled Expansion Summary

**Execution Date:** 2026-09-12T13:34:52.927Z
**Batch Status:** SUCCESS — APPLIED AND VALIDATED
**LOW_RISK Available:** 111
**LOW_RISK Selected & Applied:** 1
**LOW_RISK Skipped:** 110
**Cumulative Total Translated:** 1161
**Files Changed:** 1 (`src/components/offline/ConflictResolutionModal.tsx`)

## Applied Transformations

- **File**: `src/components/offline/ConflictResolutionModal.tsx` (Line 106)
  - **Key**: `offline.labels.txt_5b9d20`
  - **Text**: "تم تسجيل رفض أو إرجاع الشحنة على الخادم."
  - **Replacement**: `t('offline.labels.txt_5b9d20')`
  - **Category**: `offline`

## Skip Reasons Breakdown (110 total skipped)

1. **EXCLUDED_STATE_MACHINE_LOGIC (41 candidates)**: Located in `src/components/tripEngine/StateMachineController.tsx` covering guard tests, assertion messages, and state transition validations. Mandated excluded from automated migration.
2. **EXCLUDED_FIRESTORE_ARCHITECTURE_EXPORT (25 candidates)**: Located in `src/components/FirestoreArchitectureView.tsx` inside top-level exported array `DOMAINS_LIST`. React hooks cannot be used outside component lifecycle; Firestore architecture excluded.
3. **EXCLUDED_BUSINESS_DATA_AND_SIMULATION_TEMPLATE (19 candidates)**: Form initializers, mock project models, and dynamic business data in `ProjectSetupWizard.tsx` (8), `TripEngineView.tsx` (9), `WeightEngineView.tsx` (1), and `UnloadingStation.tsx` (1). Protected from business data mutation.
4. **EXCLUDED_TOP_LEVEL_SCOPE_OUTSIDE_REACT_COMPONENT (12 candidates)**: Located in `src/components/exceptionEngine/ExceptionEngineView.tsx` in dictionary `EXCEPTION_DEFINITIONS` defined outside the component function.
5. **EXCLUDED_PRICING_AND_OFFLINE_LOGIC (7 candidates)**: Pricing rules and offline scenario calculations in `src/components/tripEngine/LoadingStation.tsx` (6) and `src/components/offline/OutboxDrawer.tsx` (1). Mandated excluded.
6. **EXCLUDED_IMPORT_LOGIC_AND_BUSINESS_NAMES (5 candidates)**: Located in `src/components/importCenter/WeighbridgeImportSection.tsx` involving import idempotency cache and carrier company names. Mandated excluded.
7. **EXCLUDED_TECHNICAL_HTML_ATTRIBUTE (1 candidate)**: HTML attribute `referrerPolicy="no-referrer"` in `src/components/auth/AuthButton.tsx`. Not user-facing text.

## Safety & Non-Regression Invariants

- **Zero Business Logic Changes**: Verified intact across all engines.
- **Zero Directional CSS Changes**: No changes to `text-right`, `text-left`, `pr-`, `pl-`, or direction styles.
- **Zero Identifier Collisions**: Lexical scope analysis confirmed clean `t` binding.
- **Zero Interpolation Mismatches**: Candidate contains 0 interpolation parameters.
- **Protected Tokens**: 100% preserved.
- **Cumulative Tracking**: Manifest updated in `reports/i18n-codemod-manifest.json`.
