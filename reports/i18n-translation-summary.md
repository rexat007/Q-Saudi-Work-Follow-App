# Translation Generation Executive Summary (BLOCK 43)

**Generated At:** 2026-09-12T14:14:03.147Z
**Translation Engine Provider:** Deterministic Domain & Terminology Engine (BLOCK 43)
**Canonical Source Language:** Arabic (`ar`) — 100% Preserved Invariance
**Target Proposal Languages:** English (`en`), Urdu (`ur`)

## 1. Key Metrics & Overall Yield

| Metric | Count | Percentage | Architectural Role |
| :--- | :--- | :--- | :--- |
| **Total Entries Processed** | **8487** | 100.0% | Complete catalog coverage |
| **Generated English Proposals** | **8487** | 100.0% | English target translation proposals |
| **Generated Urdu Proposals** | **8487** | 100.0% | Urdu target translation proposals |
| **Review-Required Proposals** | **8481** | 99.9% | Flagged for human translator sign-off |
| **High-Risk Entries** | **8481** | 99.9% | Formulas, conflicts, or complex templates |
| **Interpolation Entries** | **194** | 2.3% | Dynamic parameters strictly preserved |
| **Pluralization Requirements** | **120** | 1.4% | Aligned with Arabic 6-form rules |
| **Protected Business Tokens** | **1** | 0.0% | IDs, codes, units (SAR, KG, TON) |
| **Semantic Conflicts Isolated** | **846** | 10.0% | Distinct contextual keys maintained |
| **Domain Terminology Entries** | **0** | 0.0% | Heavy transport & enterprise terms |

## 2. Confidence Level Distribution

| Confidence Level | Count | Percentage | Criteria |
| :--- | :--- | :--- | :--- |
| **HIGH** | **138** | 1.6% | Foundation verified & exact UI dictionary matches |
| **MEDIUM** | **2326** | 27.4% | Contextual UI terms with clear semantics |
| **LOW** | **6023** | 71.0% | Ambiguous phrases, high risk, or conflicts (Review Mandatory) |

## 3. Tiered Strategy Breakdown

| Strategy Tier | Count | Description |
| :--- | :--- | :--- |
| **Tier 1: Safe Generic UI** | **6** | Common buttons, actions, and standard alerts |
| **Tier 2: Contextual Application UI** | **0** | Logistics entities (Trucks, Drivers, Carriers, Projects) |
| **Tier 3: Domain-Sensitive** | **0** | Pricing, Settlement, Weighbridge, Security, Exceptions |
| **Tier 4: High Risk** | **8481** | Semantic conflicts, complex templates, mixed calculations |

## 4. Category Breakdown

| Category | Total Entries | Generated | Review Required | High Conf | Med Conf | Low Conf |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `other` | 2220 | 2220 | 2216 | 81 | 417 | 1722 |
| `imports` | 1574 | 1574 | 1574 | 17 | 388 | 1169 |
| `reports` | 567 | 567 | 567 | 3 | 166 | 398 |
| `trips` | 521 | 521 | 521 | 7 | 231 | 283 |
| `security` | 521 | 521 | 520 | 3 | 199 | 319 |
| `pricing` | 491 | 491 | 491 | 1 | 171 | 319 |
| `weighbridge` | 418 | 418 | 418 | 4 | 102 | 312 |
| `legacyMigration` | 295 | 295 | 295 | 2 | 34 | 259 |
| `exceptions` | 295 | 295 | 295 | 0 | 74 | 221 |
| `offline` | 271 | 271 | 271 | 1 | 116 | 154 |
| `entityResolution` | 267 | 267 | 267 | 1 | 58 | 208 |
| `navigation` | 232 | 232 | 232 | 2 | 55 | 175 |
| `projects` | 182 | 182 | 182 | 3 | 62 | 117 |
| `loading` | 154 | 154 | 154 | 4 | 71 | 79 |
| `dashboard` | 150 | 150 | 150 | 5 | 46 | 99 |
| `unloading` | 133 | 133 | 133 | 2 | 57 | 74 |
| `carriers` | 52 | 52 | 52 | 1 | 20 | 31 |
| `materials` | 50 | 50 | 50 | 0 | 26 | 24 |
| `validation` | 33 | 33 | 33 | 0 | 4 | 29 |
| `trucks` | 28 | 28 | 28 | 0 | 15 | 13 |
| `drivers` | 22 | 22 | 22 | 0 | 11 | 11 |
| `authentication` | 10 | 10 | 10 | 0 | 3 | 7 |
| `shared` | 1 | 1 | 0 | 1 | 0 | 0 |

## 5. Review Reasons Breakdown

| Review Reason | Items Flagged | Primary Trigger |
| :--- | :--- | :--- |
| `SEMANTIC_CONFLICT` | **846** | Triggered by rule engine classification |
| `INTERPOLATION_RISK` | **8** | Triggered by rule engine classification |
| `PLURALIZATION_RISK` | **120** | Triggered by rule engine classification |
| `REPORT_EXPORT_RISK` | **1691** | Triggered by rule engine classification |
| `BUSINESS_DATA_RISK` | **1290** | Triggered by rule engine classification |
| `LOW_CONFIDENCE` | **8481** | Triggered by rule engine classification |

## 6. Architectural Invariance Guarantees

- **No Application Files Modified:** 0 application TSX/TS/JSX components touched.
- **No Codemod Executed:** Components continue serving literal strings in production.
- **Foundation Dictionary Untouched:** Verified BLOCK 40 foundation dictionary remains 100% identical.
- **Interpolation Parameter Preservation:** 100% of dynamic parameters verified across all generated proposals.
- **Business Data Intact:** Calculations, Firestore, pricing, reports, and weight state machines remain untouched.
