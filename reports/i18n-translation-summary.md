# Translation Generation Executive Summary (BLOCK 43)

**Generated At:** 2026-09-27T10:06:08.794Z
**Translation Engine Provider:** Deterministic Domain & Terminology Engine (BLOCK 43)
**Canonical Source Language:** Arabic (`ar`) — 100% Preserved Invariance
**Target Proposal Languages:** English (`en`), Urdu (`ur`)

## 1. Key Metrics & Overall Yield

| Metric | Count | Percentage | Architectural Role |
| :--- | :--- | :--- | :--- |
| **Total Entries Processed** | **15526** | 100.0% | Complete catalog coverage |
| **Generated English Proposals** | **15526** | 100.0% | English target translation proposals |
| **Generated Urdu Proposals** | **15526** | 100.0% | Urdu target translation proposals |
| **Review-Required Proposals** | **15520** | 100.0% | Flagged for human translator sign-off |
| **High-Risk Entries** | **15520** | 100.0% | Formulas, conflicts, or complex templates |
| **Interpolation Entries** | **237** | 1.5% | Dynamic parameters strictly preserved |
| **Pluralization Requirements** | **160** | 1.0% | Aligned with Arabic 6-form rules |
| **Protected Business Tokens** | **1** | 0.0% | IDs, codes, units (SAR, KG, TON) |
| **Semantic Conflicts Isolated** | **1792** | 11.5% | Distinct contextual keys maintained |
| **Domain Terminology Entries** | **0** | 0.0% | Heavy transport & enterprise terms |

## 2. Confidence Level Distribution

| Confidence Level | Count | Percentage | Criteria |
| :--- | :--- | :--- | :--- |
| **HIGH** | **147** | 0.9% | Foundation verified & exact UI dictionary matches |
| **MEDIUM** | **4108** | 26.5% | Contextual UI terms with clear semantics |
| **LOW** | **11271** | 72.6% | Ambiguous phrases, high risk, or conflicts (Review Mandatory) |

## 3. Tiered Strategy Breakdown

| Strategy Tier | Count | Description |
| :--- | :--- | :--- |
| **Tier 1: Safe Generic UI** | **6** | Common buttons, actions, and standard alerts |
| **Tier 2: Contextual Application UI** | **0** | Logistics entities (Trucks, Drivers, Carriers, Projects) |
| **Tier 3: Domain-Sensitive** | **0** | Pricing, Settlement, Weighbridge, Security, Exceptions |
| **Tier 4: High Risk** | **15520** | Semantic conflicts, complex templates, mixed calculations |

## 4. Category Breakdown

| Category | Total Entries | Generated | Review Required | High Conf | Med Conf | Low Conf |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `other` | 5623 | 5623 | 5619 | 82 | 1220 | 4321 |
| `imports` | 2547 | 2547 | 2547 | 17 | 676 | 1854 |
| `projects` | 1174 | 1174 | 1174 | 6 | 356 | 812 |
| `reports` | 723 | 723 | 723 | 4 | 188 | 531 |
| `trips` | 714 | 714 | 714 | 7 | 272 | 435 |
| `navigation` | 598 | 598 | 598 | 2 | 125 | 471 |
| `pricing` | 590 | 590 | 590 | 1 | 193 | 396 |
| `security` | 565 | 565 | 565 | 3 | 190 | 372 |
| `weighbridge` | 405 | 405 | 405 | 4 | 114 | 287 |
| `unloading` | 312 | 312 | 312 | 3 | 115 | 194 |
| `offline` | 300 | 300 | 300 | 1 | 136 | 163 |
| `exceptions` | 300 | 300 | 299 | 1 | 94 | 205 |
| `legacyMigration` | 295 | 295 | 295 | 2 | 39 | 254 |
| `entityResolution` | 288 | 288 | 288 | 1 | 68 | 219 |
| `loading` | 279 | 279 | 279 | 4 | 127 | 148 |
| `authentication` | 202 | 202 | 202 | 0 | 34 | 168 |
| `dashboard` | 146 | 146 | 146 | 5 | 45 | 96 |
| `trucks` | 128 | 128 | 128 | 0 | 28 | 100 |
| `drivers` | 105 | 105 | 105 | 2 | 23 | 80 |
| `materials` | 89 | 89 | 89 | 0 | 32 | 57 |
| `validation` | 83 | 83 | 83 | 0 | 9 | 74 |
| `carriers` | 52 | 52 | 52 | 1 | 20 | 31 |
| `shared` | 8 | 8 | 7 | 1 | 4 | 3 |

## 5. Review Reasons Breakdown

| Review Reason | Items Flagged | Primary Trigger |
| :--- | :--- | :--- |
| `SEMANTIC_CONFLICT` | **1792** | Triggered by rule engine classification |
| `INTERPOLATION_RISK` | **8** | Triggered by rule engine classification |
| `PLURALIZATION_RISK` | **160** | Triggered by rule engine classification |
| `REPORT_EXPORT_RISK` | **4304** | Triggered by rule engine classification |
| `BUSINESS_DATA_RISK` | **1878** | Triggered by rule engine classification |
| `LOW_CONFIDENCE` | **15520** | Triggered by rule engine classification |

## 6. Architectural Invariance Guarantees

- **No Application Files Modified:** 0 application TSX/TS/JSX components touched.
- **No Codemod Executed:** Components continue serving literal strings in production.
- **Foundation Dictionary Untouched:** Verified BLOCK 40 foundation dictionary remains 100% identical.
- **Interpolation Parameter Preservation:** 100% of dynamic parameters verified across all generated proposals.
- **Business Data Intact:** Calculations, Firestore, pricing, reports, and weight state machines remain untouched.
