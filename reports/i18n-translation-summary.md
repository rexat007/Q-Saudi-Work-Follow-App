# Translation Generation Executive Summary (BLOCK 43)

**Generated At:** 2026-09-15T04:38:34.568Z
**Translation Engine Provider:** Deterministic Domain & Terminology Engine (BLOCK 43)
**Canonical Source Language:** Arabic (`ar`) — 100% Preserved Invariance
**Target Proposal Languages:** English (`en`), Urdu (`ur`)

## 1. Key Metrics & Overall Yield

| Metric | Count | Percentage | Architectural Role |
| :--- | :--- | :--- | :--- |
| **Total Entries Processed** | **12758** | 100.0% | Complete catalog coverage |
| **Generated English Proposals** | **12758** | 100.0% | English target translation proposals |
| **Generated Urdu Proposals** | **12758** | 100.0% | Urdu target translation proposals |
| **Review-Required Proposals** | **12752** | 100.0% | Flagged for human translator sign-off |
| **High-Risk Entries** | **12752** | 100.0% | Formulas, conflicts, or complex templates |
| **Interpolation Entries** | **221** | 1.7% | Dynamic parameters strictly preserved |
| **Pluralization Requirements** | **154** | 1.2% | Aligned with Arabic 6-form rules |
| **Protected Business Tokens** | **1** | 0.0% | IDs, codes, units (SAR, KG, TON) |
| **Semantic Conflicts Isolated** | **1609** | 12.6% | Distinct contextual keys maintained |
| **Domain Terminology Entries** | **0** | 0.0% | Heavy transport & enterprise terms |

## 2. Confidence Level Distribution

| Confidence Level | Count | Percentage | Criteria |
| :--- | :--- | :--- | :--- |
| **HIGH** | **144** | 1.1% | Foundation verified & exact UI dictionary matches |
| **MEDIUM** | **3618** | 28.4% | Contextual UI terms with clear semantics |
| **LOW** | **8996** | 70.5% | Ambiguous phrases, high risk, or conflicts (Review Mandatory) |

## 3. Tiered Strategy Breakdown

| Strategy Tier | Count | Description |
| :--- | :--- | :--- |
| **Tier 1: Safe Generic UI** | **6** | Common buttons, actions, and standard alerts |
| **Tier 2: Contextual Application UI** | **0** | Logistics entities (Trucks, Drivers, Carriers, Projects) |
| **Tier 3: Domain-Sensitive** | **0** | Pricing, Settlement, Weighbridge, Security, Exceptions |
| **Tier 4: High Risk** | **12752** | Semantic conflicts, complex templates, mixed calculations |

## 4. Category Breakdown

| Category | Total Entries | Generated | Review Required | High Conf | Med Conf | Low Conf |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `other` | 5223 | 5223 | 5219 | 82 | 1180 | 3961 |
| `imports` | 1663 | 1663 | 1663 | 17 | 515 | 1131 |
| `reports` | 610 | 610 | 610 | 4 | 179 | 427 |
| `projects` | 587 | 587 | 587 | 4 | 175 | 408 |
| `trips` | 583 | 583 | 583 | 7 | 242 | 334 |
| `security` | 566 | 566 | 565 | 3 | 218 | 345 |
| `pricing` | 514 | 514 | 514 | 1 | 184 | 329 |
| `navigation` | 439 | 439 | 439 | 2 | 91 | 346 |
| `weighbridge` | 418 | 418 | 418 | 4 | 114 | 300 |
| `offline` | 302 | 302 | 302 | 1 | 129 | 172 |
| `legacyMigration` | 295 | 295 | 295 | 2 | 39 | 254 |
| `exceptions` | 295 | 295 | 295 | 0 | 94 | 201 |
| `entityResolution` | 267 | 267 | 267 | 1 | 67 | 199 |
| `unloading` | 263 | 263 | 263 | 3 | 110 | 150 |
| `loading` | 229 | 229 | 229 | 4 | 110 | 115 |
| `dashboard` | 150 | 150 | 150 | 5 | 48 | 97 |
| `authentication` | 113 | 113 | 113 | 0 | 30 | 83 |
| `drivers` | 77 | 77 | 77 | 2 | 23 | 52 |
| `carriers` | 52 | 52 | 52 | 1 | 20 | 31 |
| `materials` | 50 | 50 | 50 | 0 | 26 | 24 |
| `validation` | 33 | 33 | 33 | 0 | 9 | 24 |
| `trucks` | 28 | 28 | 28 | 0 | 15 | 13 |
| `shared` | 1 | 1 | 0 | 1 | 0 | 0 |

## 5. Review Reasons Breakdown

| Review Reason | Items Flagged | Primary Trigger |
| :--- | :--- | :--- |
| `SEMANTIC_CONFLICT` | **1609** | Triggered by rule engine classification |
| `INTERPOLATION_RISK` | **8** | Triggered by rule engine classification |
| `PLURALIZATION_RISK` | **154** | Triggered by rule engine classification |
| `REPORT_EXPORT_RISK` | **3954** | Triggered by rule engine classification |
| `BUSINESS_DATA_RISK` | **1685** | Triggered by rule engine classification |
| `LOW_CONFIDENCE` | **12752** | Triggered by rule engine classification |

## 6. Architectural Invariance Guarantees

- **No Application Files Modified:** 0 application TSX/TS/JSX components touched.
- **No Codemod Executed:** Components continue serving literal strings in production.
- **Foundation Dictionary Untouched:** Verified BLOCK 40 foundation dictionary remains 100% identical.
- **Interpolation Parameter Preservation:** 100% of dynamic parameters verified across all generated proposals.
- **Business Data Intact:** Calculations, Firestore, pricing, reports, and weight state machines remain untouched.
