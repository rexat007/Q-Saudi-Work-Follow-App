# Translation Generation Executive Summary (BLOCK 43)

**Generated At:** 2026-09-14T11:06:21.910Z
**Translation Engine Provider:** Deterministic Domain & Terminology Engine (BLOCK 43)
**Canonical Source Language:** Arabic (`ar`) — 100% Preserved Invariance
**Target Proposal Languages:** English (`en`), Urdu (`ur`)

## 1. Key Metrics & Overall Yield

| Metric | Count | Percentage | Architectural Role |
| :--- | :--- | :--- | :--- |
| **Total Entries Processed** | **11965** | 100.0% | Complete catalog coverage |
| **Generated English Proposals** | **11965** | 100.0% | English target translation proposals |
| **Generated Urdu Proposals** | **11965** | 100.0% | Urdu target translation proposals |
| **Review-Required Proposals** | **11959** | 99.9% | Flagged for human translator sign-off |
| **High-Risk Entries** | **11959** | 99.9% | Formulas, conflicts, or complex templates |
| **Interpolation Entries** | **216** | 1.8% | Dynamic parameters strictly preserved |
| **Pluralization Requirements** | **154** | 1.3% | Aligned with Arabic 6-form rules |
| **Protected Business Tokens** | **1** | 0.0% | IDs, codes, units (SAR, KG, TON) |
| **Semantic Conflicts Isolated** | **1526** | 12.8% | Distinct contextual keys maintained |
| **Domain Terminology Entries** | **0** | 0.0% | Heavy transport & enterprise terms |

## 2. Confidence Level Distribution

| Confidence Level | Count | Percentage | Criteria |
| :--- | :--- | :--- | :--- |
| **HIGH** | **143** | 1.2% | Foundation verified & exact UI dictionary matches |
| **MEDIUM** | **3406** | 28.5% | Contextual UI terms with clear semantics |
| **LOW** | **8416** | 70.3% | Ambiguous phrases, high risk, or conflicts (Review Mandatory) |

## 3. Tiered Strategy Breakdown

| Strategy Tier | Count | Description |
| :--- | :--- | :--- |
| **Tier 1: Safe Generic UI** | **6** | Common buttons, actions, and standard alerts |
| **Tier 2: Contextual Application UI** | **0** | Logistics entities (Trucks, Drivers, Carriers, Projects) |
| **Tier 3: Domain-Sensitive** | **0** | Pricing, Settlement, Weighbridge, Security, Exceptions |
| **Tier 4: High Risk** | **11959** | Semantic conflicts, complex templates, mixed calculations |

## 4. Category Breakdown

| Category | Total Entries | Generated | Review Required | High Conf | Med Conf | Low Conf |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `other` | 5147 | 5147 | 5143 | 82 | 1148 | 3917 |
| `imports` | 1572 | 1572 | 1572 | 17 | 483 | 1072 |
| `reports` | 610 | 610 | 610 | 4 | 179 | 427 |
| `security` | 557 | 557 | 556 | 3 | 214 | 340 |
| `trips` | 521 | 521 | 521 | 7 | 240 | 274 |
| `pricing` | 491 | 491 | 491 | 1 | 178 | 312 |
| `weighbridge` | 418 | 418 | 418 | 4 | 114 | 300 |
| `navigation` | 413 | 413 | 413 | 2 | 89 | 322 |
| `legacyMigration` | 295 | 295 | 295 | 2 | 39 | 254 |
| `exceptions` | 295 | 295 | 295 | 0 | 94 | 201 |
| `offline` | 271 | 271 | 271 | 1 | 128 | 142 |
| `entityResolution` | 267 | 267 | 267 | 1 | 67 | 199 |
| `unloading` | 263 | 263 | 263 | 3 | 110 | 150 |
| `loading` | 232 | 232 | 232 | 4 | 110 | 118 |
| `projects` | 197 | 197 | 197 | 3 | 62 | 132 |
| `dashboard` | 150 | 150 | 150 | 5 | 48 | 97 |
| `drivers` | 77 | 77 | 77 | 2 | 23 | 52 |
| `carriers` | 52 | 52 | 52 | 1 | 20 | 31 |
| `materials` | 50 | 50 | 50 | 0 | 26 | 24 |
| `validation` | 33 | 33 | 33 | 0 | 9 | 24 |
| `trucks` | 28 | 28 | 28 | 0 | 15 | 13 |
| `authentication` | 25 | 25 | 25 | 0 | 10 | 15 |
| `shared` | 1 | 1 | 0 | 1 | 0 | 0 |

## 5. Review Reasons Breakdown

| Review Reason | Items Flagged | Primary Trigger |
| :--- | :--- | :--- |
| `SEMANTIC_CONFLICT` | **1526** | Triggered by rule engine classification |
| `INTERPOLATION_RISK` | **8** | Triggered by rule engine classification |
| `PLURALIZATION_RISK` | **154** | Triggered by rule engine classification |
| `REPORT_EXPORT_RISK` | **3871** | Triggered by rule engine classification |
| `BUSINESS_DATA_RISK` | **1630** | Triggered by rule engine classification |
| `LOW_CONFIDENCE` | **11959** | Triggered by rule engine classification |

## 6. Architectural Invariance Guarantees

- **No Application Files Modified:** 0 application TSX/TS/JSX components touched.
- **No Codemod Executed:** Components continue serving literal strings in production.
- **Foundation Dictionary Untouched:** Verified BLOCK 40 foundation dictionary remains 100% identical.
- **Interpolation Parameter Preservation:** 100% of dynamic parameters verified across all generated proposals.
- **Business Data Intact:** Calculations, Firestore, pricing, reports, and weight state machines remain untouched.
