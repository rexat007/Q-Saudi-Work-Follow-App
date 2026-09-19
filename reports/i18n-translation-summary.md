# Translation Generation Executive Summary (BLOCK 43)

**Generated At:** 2026-09-19T10:03:03.263Z
**Translation Engine Provider:** Deterministic Domain & Terminology Engine (BLOCK 43)
**Canonical Source Language:** Arabic (`ar`) — 100% Preserved Invariance
**Target Proposal Languages:** English (`en`), Urdu (`ur`)

## 1. Key Metrics & Overall Yield

| Metric | Count | Percentage | Architectural Role |
| :--- | :--- | :--- | :--- |
| **Total Entries Processed** | **13907** | 100.0% | Complete catalog coverage |
| **Generated English Proposals** | **13907** | 100.0% | English target translation proposals |
| **Generated Urdu Proposals** | **13907** | 100.0% | Urdu target translation proposals |
| **Review-Required Proposals** | **13901** | 100.0% | Flagged for human translator sign-off |
| **High-Risk Entries** | **13901** | 100.0% | Formulas, conflicts, or complex templates |
| **Interpolation Entries** | **234** | 1.7% | Dynamic parameters strictly preserved |
| **Pluralization Requirements** | **153** | 1.1% | Aligned with Arabic 6-form rules |
| **Protected Business Tokens** | **1** | 0.0% | IDs, codes, units (SAR, KG, TON) |
| **Semantic Conflicts Isolated** | **1631** | 11.7% | Distinct contextual keys maintained |
| **Domain Terminology Entries** | **0** | 0.0% | Heavy transport & enterprise terms |

## 2. Confidence Level Distribution

| Confidence Level | Count | Percentage | Criteria |
| :--- | :--- | :--- | :--- |
| **HIGH** | **146** | 1.0% | Foundation verified & exact UI dictionary matches |
| **MEDIUM** | **3804** | 27.4% | Contextual UI terms with clear semantics |
| **LOW** | **9957** | 71.6% | Ambiguous phrases, high risk, or conflicts (Review Mandatory) |

## 3. Tiered Strategy Breakdown

| Strategy Tier | Count | Description |
| :--- | :--- | :--- |
| **Tier 1: Safe Generic UI** | **6** | Common buttons, actions, and standard alerts |
| **Tier 2: Contextual Application UI** | **0** | Logistics entities (Trucks, Drivers, Carriers, Projects) |
| **Tier 3: Domain-Sensitive** | **0** | Pricing, Settlement, Weighbridge, Security, Exceptions |
| **Tier 4: High Risk** | **13901** | Semantic conflicts, complex templates, mixed calculations |

## 4. Category Breakdown

| Category | Total Entries | Generated | Review Required | High Conf | Med Conf | Low Conf |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `other` | 5535 | 5535 | 5531 | 82 | 1197 | 4256 |
| `imports` | 1750 | 1750 | 1750 | 17 | 528 | 1205 |
| `projects` | 881 | 881 | 881 | 5 | 277 | 599 |
| `reports` | 723 | 723 | 723 | 4 | 188 | 531 |
| `trips` | 595 | 595 | 595 | 7 | 243 | 345 |
| `security` | 533 | 533 | 533 | 3 | 187 | 343 |
| `navigation` | 532 | 532 | 532 | 2 | 119 | 411 |
| `pricing` | 514 | 514 | 514 | 1 | 184 | 329 |
| `weighbridge` | 418 | 418 | 418 | 4 | 114 | 300 |
| `unloading` | 312 | 312 | 312 | 3 | 115 | 194 |
| `offline` | 302 | 302 | 302 | 1 | 136 | 165 |
| `exceptions` | 299 | 299 | 299 | 0 | 94 | 205 |
| `legacyMigration` | 295 | 295 | 295 | 2 | 39 | 254 |
| `entityResolution` | 288 | 288 | 288 | 1 | 68 | 219 |
| `loading` | 283 | 283 | 283 | 4 | 127 | 152 |
| `dashboard` | 152 | 152 | 151 | 6 | 48 | 98 |
| `authentication` | 115 | 115 | 115 | 0 | 30 | 85 |
| `drivers` | 105 | 105 | 105 | 2 | 23 | 80 |
| `validation` | 83 | 83 | 83 | 0 | 9 | 74 |
| `materials` | 73 | 73 | 73 | 0 | 31 | 42 |
| `trucks` | 59 | 59 | 59 | 0 | 23 | 36 |
| `carriers` | 52 | 52 | 52 | 1 | 20 | 31 |
| `shared` | 8 | 8 | 7 | 1 | 4 | 3 |

## 5. Review Reasons Breakdown

| Review Reason | Items Flagged | Primary Trigger |
| :--- | :--- | :--- |
| `SEMANTIC_CONFLICT` | **1631** | Triggered by rule engine classification |
| `INTERPOLATION_RISK` | **9** | Triggered by rule engine classification |
| `PLURALIZATION_RISK` | **153** | Triggered by rule engine classification |
| `REPORT_EXPORT_RISK` | **4103** | Triggered by rule engine classification |
| `BUSINESS_DATA_RISK` | **1759** | Triggered by rule engine classification |
| `LOW_CONFIDENCE` | **13901** | Triggered by rule engine classification |

## 6. Architectural Invariance Guarantees

- **No Application Files Modified:** 0 application TSX/TS/JSX components touched.
- **No Codemod Executed:** Components continue serving literal strings in production.
- **Foundation Dictionary Untouched:** Verified BLOCK 40 foundation dictionary remains 100% identical.
- **Interpolation Parameter Preservation:** 100% of dynamic parameters verified across all generated proposals.
- **Business Data Intact:** Calculations, Firestore, pricing, reports, and weight state machines remain untouched.
