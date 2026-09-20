# Translation Generation Executive Summary (BLOCK 43)

**Generated At:** 2026-09-20T08:06:20.725Z
**Translation Engine Provider:** Deterministic Domain & Terminology Engine (BLOCK 43)
**Canonical Source Language:** Arabic (`ar`) — 100% Preserved Invariance
**Target Proposal Languages:** English (`en`), Urdu (`ur`)

## 1. Key Metrics & Overall Yield

| Metric | Count | Percentage | Architectural Role |
| :--- | :--- | :--- | :--- |
| **Total Entries Processed** | **14361** | 100.0% | Complete catalog coverage |
| **Generated English Proposals** | **14361** | 100.0% | English target translation proposals |
| **Generated Urdu Proposals** | **14361** | 100.0% | Urdu target translation proposals |
| **Review-Required Proposals** | **14355** | 100.0% | Flagged for human translator sign-off |
| **High-Risk Entries** | **14355** | 100.0% | Formulas, conflicts, or complex templates |
| **Interpolation Entries** | **237** | 1.7% | Dynamic parameters strictly preserved |
| **Pluralization Requirements** | **154** | 1.1% | Aligned with Arabic 6-form rules |
| **Protected Business Tokens** | **1** | 0.0% | IDs, codes, units (SAR, KG, TON) |
| **Semantic Conflicts Isolated** | **1672** | 11.6% | Distinct contextual keys maintained |
| **Domain Terminology Entries** | **0** | 0.0% | Heavy transport & enterprise terms |

## 2. Confidence Level Distribution

| Confidence Level | Count | Percentage | Criteria |
| :--- | :--- | :--- | :--- |
| **HIGH** | **147** | 1.0% | Foundation verified & exact UI dictionary matches |
| **MEDIUM** | **3903** | 27.2% | Contextual UI terms with clear semantics |
| **LOW** | **10311** | 71.8% | Ambiguous phrases, high risk, or conflicts (Review Mandatory) |

## 3. Tiered Strategy Breakdown

| Strategy Tier | Count | Description |
| :--- | :--- | :--- |
| **Tier 1: Safe Generic UI** | **6** | Common buttons, actions, and standard alerts |
| **Tier 2: Contextual Application UI** | **0** | Logistics entities (Trucks, Drivers, Carriers, Projects) |
| **Tier 3: Domain-Sensitive** | **0** | Pricing, Settlement, Weighbridge, Security, Exceptions |
| **Tier 4: High Risk** | **14355** | Semantic conflicts, complex templates, mixed calculations |

## 4. Category Breakdown

| Category | Total Entries | Generated | Review Required | High Conf | Med Conf | Low Conf |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `other` | 5564 | 5564 | 5560 | 82 | 1197 | 4285 |
| `imports` | 1755 | 1755 | 1755 | 17 | 531 | 1207 |
| `projects` | 1016 | 1016 | 1016 | 6 | 335 | 675 |
| `reports` | 723 | 723 | 723 | 4 | 188 | 531 |
| `trips` | 713 | 713 | 713 | 7 | 272 | 434 |
| `navigation` | 554 | 554 | 554 | 2 | 121 | 431 |
| `security` | 534 | 534 | 534 | 3 | 187 | 344 |
| `pricing` | 514 | 514 | 514 | 1 | 184 | 329 |
| `weighbridge` | 418 | 418 | 418 | 4 | 114 | 300 |
| `unloading` | 312 | 312 | 312 | 3 | 115 | 194 |
| `offline` | 302 | 302 | 302 | 1 | 136 | 165 |
| `exceptions` | 299 | 299 | 299 | 0 | 94 | 205 |
| `legacyMigration` | 295 | 295 | 295 | 2 | 39 | 254 |
| `entityResolution` | 288 | 288 | 288 | 1 | 68 | 219 |
| `loading` | 279 | 279 | 279 | 4 | 127 | 148 |
| `authentication` | 179 | 179 | 179 | 0 | 31 | 148 |
| `dashboard` | 152 | 152 | 151 | 6 | 48 | 98 |
| `trucks` | 128 | 128 | 128 | 0 | 28 | 100 |
| `drivers` | 105 | 105 | 105 | 2 | 23 | 80 |
| `materials` | 88 | 88 | 88 | 0 | 32 | 56 |
| `validation` | 83 | 83 | 83 | 0 | 9 | 74 |
| `carriers` | 52 | 52 | 52 | 1 | 20 | 31 |
| `shared` | 8 | 8 | 7 | 1 | 4 | 3 |

## 5. Review Reasons Breakdown

| Review Reason | Items Flagged | Primary Trigger |
| :--- | :--- | :--- |
| `SEMANTIC_CONFLICT` | **1672** | Triggered by rule engine classification |
| `INTERPOLATION_RISK` | **9** | Triggered by rule engine classification |
| `PLURALIZATION_RISK` | **154** | Triggered by rule engine classification |
| `REPORT_EXPORT_RISK` | **4157** | Triggered by rule engine classification |
| `BUSINESS_DATA_RISK` | **1807** | Triggered by rule engine classification |
| `LOW_CONFIDENCE` | **14355** | Triggered by rule engine classification |

## 6. Architectural Invariance Guarantees

- **No Application Files Modified:** 0 application TSX/TS/JSX components touched.
- **No Codemod Executed:** Components continue serving literal strings in production.
- **Foundation Dictionary Untouched:** Verified BLOCK 40 foundation dictionary remains 100% identical.
- **Interpolation Parameter Preservation:** 100% of dynamic parameters verified across all generated proposals.
- **Business Data Intact:** Calculations, Firestore, pricing, reports, and weight state machines remain untouched.
