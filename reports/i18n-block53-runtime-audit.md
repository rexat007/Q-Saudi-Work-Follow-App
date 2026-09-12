# BLOCK 53 — i18n Runtime Key Audit & Unresolved-Key Detection Report

**Execution Date:** 2026-09-12T14:15:00.000Z  
**Status:** ANALYSIS COMPLETE — PURE AUDIT (0 CODE MODIFICATIONS TO APPLICATION/BUSINESS LOGIC)  
**Total Referenced Keys:** 1,115  
**Resolvable Keys:** 54 (4.84%)  
**Unresolved Keys (Literal Key-as-Value in UI):** 1,061 (95.16%)  
**Runtime Dictionary Size:** 67 keys (ar), 67 keys (en), 67 keys (ur)  

---

## 1. Executive Summary

This audit evaluates the complete end-to-end runtime translation path across the application:
```
useI18n() → t(...) → translation dictionaries → catalog → generated translations → fallback
```

### Key Findings:
1. **1,115 unique translation keys** are statically referenced across **1,186 call sites** in **35 application components and hooks**.
2. Only **54 referenced keys** (plus 13 general shared foundation keys = 67 total) are present in the runtime dictionaries (`src/locales/ar`, `src/locales/en`, `src/locales/ur`).
3. **1,061 referenced keys** are missing from the runtime dictionaries.
4. **Fallback Mechanism Analysis**: Under `src/i18n/utils.ts` (`resolveTranslation`):
   - When a key is requested in `en` or `ur`, it checks the locale dictionary.
   - If missing, it emits a development warning: `[i18n] Missing translation key "..." for locale "..."`.
   - It then falls back to `DEFAULT_LOCALE` (`'ar'`).
   - Because the key is **also missing in `'ar'`**, `resolveTranslation` executes `text = key` and returns the key itself.
5. **UI Rendering Impact**: If rendered, these **1,061 keys appear literally in the UI** as raw key strings (e.g. `other.labels.txt_259961`, `tripEngine.labels.txt_...`, `offline.labels.cancelTrip`).
6. **Key Preservation in Artifacts**: Although absent from `src/locales/`, **1,029** of these missing keys are fully preserved with canonical Arabic text in prior migration block manifests (`reports/i18n-block45-manifest.json` through `reports/i18n-block52-manifest.json`) and summary reports, and **32 keys** were prepared in BLOCK 52 presentation hooks (`useDomainMeta.ts` and `useExceptionTypeMeta.ts`).

---

## 2. Quantitative Key Resolution Metrics

| Metric | Count | Percentage | Status / Notes |
|---|---|---|---|
| **Total Referenced Keys** | 1,115 | 100.0% | Unique static arguments to `t(...)`, `translate(...)` |
| **Total Call Sites** | 1,186 | - | Spread across 35 files |
| **Resolvable Keys** | 54 | 4.84% | Fully resolvable in AR, EN, UR with non-empty text |
| **Unresolved Keys** | 1,061 | 95.16% | Missing in AR, EN, UR; returns literal key |
| **Key-as-Value Cases** | 1,061 | 95.16% | Returns `key` directly upon resolution |
| **Empty-Value Cases** | 0 | 0.00% | Zero keys resolve to `""` |
| **Missing in AR** | 1,061 | 95.16% | Not present in `src/locales/ar/index.ts` |
| **Missing in EN** | 1,061 | 95.16% | Not present in `src/locales/en/index.ts` |
| **Missing in UR** | 1,061 | 95.16% | Not present in `src/locales/ur/index.ts` |
| **Runtime Dictionaries Total** | 67 | - | 100% parity across `ar`, `en`, `ur` |

---

## 3. Important Prefix Analysis (`txt_*` Generated Keys)

Generated keys formatted as `*.labels.txt_*`, `*.messages.txt_*`, and `*.status.txt_*` were specifically audited to prevent internal hash tokens from leaking into production screens.

| Classification Category | Count | Status / Impact |
|---|---|---|
| **A. Correctly Resolvable** | 42 | **SAFE**: Defined in `src/locales/` (BLOCK 45 navigation & BLOCK 52 migrations); renders localized Arabic, English, and Urdu cleanly without leaking key. |
| **B. Missing from Runtime Dictionaries** | 694 | **UNRESOLVED**: Statically referenced in components (e.g. `TripEngineView`, `LoadingStation`, `MasterDataView`), but missing from `src/locales/ar/index.ts`. |
| **C. Mapped Incorrectly** | 0 | **CLEAN**: Zero malformed keys or syntax errors detected. |
| **D. Fallback Failure** | 694 | **LEAK RISK**: When requested in `en` or `ur`, fallback to `ar` fails because `ar` is also missing; returns the literal `*.txt_*` hash to the UI. |
| **E. Stale Artifacts** | 3,379 | **ORPHANED**: 3,379 `txt_*` keys exist in `i18n-translation-catalog.json` and proposal artifacts that were never applied to application code. |
| **F. Valid in AR but Untranslated in EN/UR** | 0 | **CLEAN**: All keys present in `ar` have corresponding non-empty entries in `en` and `ur`. |

---

## 4. Runtime Parity Across Languages

For the 54 resolvable keys:
- **Arabic (`ar`)**: 54 / 54 valid non-empty values. 
- **English (`en`)**: 54 / 54 valid non-empty values.
- **Urdu (`ur`)**: 54 / 54 valid non-empty values.
- **Canonical Alignment**: 51 keys match canonical catalog/manifest text verbatim; 3 keys (`navigation.labels.reports`, `navigation.labels.pricing`, `offline.labels.pricing`) have deliberate contextual UI refinements applied during foundational blocks.

For the 1,061 unresolved keys:
- **Arabic (`ar`)**: Missing in runtime dictionary (resolves to literal key).
- **English (`en`)**: Missing in runtime dictionary (falls back to `ar`, which is missing, resolving to literal key).
- **Urdu (`ur`)**: Missing in runtime dictionary (falls back to `ar`, which is missing, resolving to literal key).

---

## 5. Component Coverage & Resolution Rates

All 35 application files containing translation calls were inspected:

| File Path | Total Calls | Unique Keys | Resolvable | Unresolved | Resolution Rate | Callers Used |
|---|---|---|---|---|---|---|
| `src/components/TripEngineView.tsx` | 102 | 95 | 0 | 95 | 0.0% | `t` |
| `src/components/tripEngine/LoadingStation.tsx` | 85 | 85 | 0 | 85 | 0.0% | `t`, `translate` |
| `src/components/masterData/MasterDataView.tsx` | 89 | 81 | 1 | 80 | 1.2% | `t` |
| `src/components/dataQuality/DataQualityView.tsx` | 75 | 75 | 0 | 75 | 0.0% | `t` |
| `src/components/offline/OutboxDrawer.tsx` | 73 | 72 | 1 | 71 | 1.4% | `t` |
| `src/components/tripEngine/StateMachineController.tsx` | 72 | 72 | 2 | 70 | 2.8% | `t` |
| `src/components/tripEngine/UnloadingStation.tsx` | 67 | 66 | 0 | 66 | 0.0% | `t` |
| `src/components/dashboard/OperationsDashboardView.tsx` | 68 | 65 | 0 | 65 | 0.0% | `t` |
| `src/components/workspace/WorkspaceIntegrationView.tsx` | 61 | 61 | 3 | 58 | 4.9% | `t` |
| `src/components/migration/LegacyMigrationView.tsx` | 57 | 57 | 0 | 57 | 0.0% | `t` |
| `src/components/tripEngine/WeightEngineView.tsx` | 58 | 53 | 0 | 53 | 0.0% | `t` |
| `src/components/importCenter/WeighbridgeImportSection.tsx` | 50 | 50 | 1 | 49 | 2.0% | `t` |
| `src/components/exceptionEngine/ExceptionEngineView.tsx` | 43 | 42 | 0 | 42 | 0.0% | `t` |
| `src/components/offline/ConflictResolutionModal.tsx` | 36 | 36 | 0 | 36 | 0.0% | `t` |
| `src/components/FirestoreArchitectureView.tsx` | 25 | 25 | 0 | 25 | 0.0% | `t` |
| `src/hooks/useDomainMeta.ts` | 26 | 20 | 1 | 19 | 5.0% | `t` |
| `src/components/wizard/Step2Materials.tsx` | 18 | 18 | 0 | 18 | 0.0% | `t` |
| `src/components/wizard/Step6GoogleDrive.tsx` | 17 | 17 | 0 | 17 | 0.0% | `t` |
| `src/components/wizard/Step1ProjectInfo.tsx` | 14 | 14 | 0 | 14 | 0.0% | `t` |
| `src/components/wizard/Step5ProjectAccess.tsx` | 17 | 13 | 0 | 13 | 0.0% | `t` |
| `src/hooks/useExceptionTypeMeta.ts` | 24 | 13 | 0 | 13 | 0.0% | `t` |
| `src/components/offline/PWAInstallButton.tsx` | 12 | 12 | 0 | 12 | 0.0% | `t` |
| `src/components/wizard/Step3TrucksCarriers.tsx` | 12 | 12 | 0 | 12 | 0.0% | `t` |
| `src/components/wizard/ProjectCreationWizard.tsx` | 6 | 6 | 0 | 6 | 0.0% | `t` |
| `src/components/offline/OfflineIndicator.tsx` | 1 | 1 | 0 | 1 | 0.0% | `t` |
| `src/components/security/SecurityAuditView.tsx` | 1 | 1 | 0 | 1 | 0.0% | `t` |
| `src/components/reports/ReportsEngineView.tsx` | 1 | 1 | 0 | 1 | 0.0% | `t` |
| `src/App.tsx` | 46 | 46 | 46 | 0 | **100.0%** | `t` |
| `src/components/admin/AdminConsoleView.tsx` | 1 | 1 | 1 | 0 | **100.0%** | `t` |
| `src/components/i18n/LanguageSwitcher.tsx` | 1 | 1 | 1 | 0 | **100.0%** | `t` |
| `src/components/importCenter/EntityResolutionSection.tsx` | 1 | 1 | 1 | 0 | **100.0%** | `t` |
| `src/components/importCenter/ImportCenterView.tsx` | 1 | 1 | 1 | 0 | **100.0%** | `t` |
| `src/components/pricing/PricingEngineView.tsx` | 1 | 1 | 1 | 0 | **100.0%** | `t` |
| `src/components/wizard/Step4PricingRules.tsx` | 2 | 2 | 2 | 0 | **100.0%** | `t` |
| `src/components/wizard/Step7Review.tsx` | 1 | 1 | 1 | 0 | **100.0%** | `t` |

**Summary**: 8 components have 100% resolution; 27 components have unpopulated keys in runtime dictionaries.

---

## 6. UI Metadata Hooks Status (Inspection Only)

In strict accordance with BLOCK 53 directives, UI metadata consumers were inspected with zero code modifications:

### 1. `useExceptionTypeMeta()` (`src/hooks/useExceptionTypeMeta.ts`)
- **Status**: UNUSED in application components.
- **Active Consumers**: None (tested in `src/tests/metadataHooks.test.ts`).
- **Static Feeder**: `EXCEPTION_TYPE_META` in `src/components/exceptionEngine/ExceptionEngineView.tsx` (lines 37–116).
- **Future Migration Required**: When approved, refactor `ExceptionEngineView.tsx` to bind `const exceptionMeta = useExceptionTypeMeta();` and read `exceptionMeta[type].label` and `exceptionMeta[type].description` dynamically.

### 2. `useDomainMeta()` (`src/hooks/useDomainMeta.ts`)
- **Status**: UNUSED in application components.
- **Active Consumers**: None (tested in `src/tests/metadataHooks.test.ts`).
- **Static Feeder**: `DOMAINS_LIST` in `src/components/FirestoreArchitectureView.tsx` (lines 58–278).
- **Future Migration Required**: When approved, refactor `FirestoreArchitectureView.tsx` to bind `const domainMeta = useDomainMeta();` and read `domainMeta.getDomain(id).name` and `domainMeta.getDomain(id).description` dynamically.

---

## 7. Dedicated Test Suite Execution

A dedicated test suite `src/tests/runtimeKeyAudit.test.ts` was implemented and executed:

| Test ID | Test Name | Status | Validated Condition |
|---|---|---|---|
| `I18N-RUNTIME-01` | Referenced key resolves in ar | **PASSED** | Valid referenced keys resolve to non-empty Arabic strings |
| `I18N-RUNTIME-02` | Referenced key resolves in en | **PASSED** | Valid referenced keys resolve to non-empty English strings |
| `I18N-RUNTIME-03` | Referenced key resolves in ur | **PASSED** | Valid referenced keys resolve to non-empty Urdu strings |
| `I18N-RUNTIME-04` | Missing key cannot silently render as an unintended production value | **PASSED** | Missing key returns itself and triggers developer warning (no silent mock values) |
| `I18N-RUNTIME-05` | txt_* keys do not render literally when valid | **PASSED** | All 42 valid `txt_*` keys in dictionaries resolve to real translated text |
| `I18N-RUNTIME-06` | Foundation fallback remains intact | **PASSED** | Missing locale keys correctly fall back to Arabic canonical text |
| `I18N-RUNTIME-07` | Interpolation keys remain resolvable | **PASSED** | Template variables (`{count}`) interpolate properly across all 3 locales |

---

## 8. Invariant & Boundary Assurance

1. **Zero application UI modifications**: No component JSX, styling, or presentation markup was modified.
2. **Zero codemod migrations**: No new codemods or transforms were applied.
3. **Zero business logic modifications**: Pricing, state machines, validation rules, and reports remain 100% untouched.
4. **Zero CSS direction modifications**: Physical and logical directional styles remain intact.
5. **Zero git operations**: No `git commit` or `git push` executed.
