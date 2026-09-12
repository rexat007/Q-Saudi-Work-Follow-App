# Translation Generation Executive Summary (BLOCK 43)

**Generated At:** 2026-09-12T12:58:29.384Z
**Translation Engine Provider:** Deterministic Domain & Terminology Engine (BLOCK 43)
**Canonical Source Language:** Arabic (`ar`) — 100% Preserved Invariance
**Target Proposal Languages:** English (`en`), Urdu (`ur`)

## 1. Key Metrics & Overall Yield

| Metric | Count | Percentage | Architectural Role |
| :--- | :--- | :--- | :--- |
| **Total Entries Processed** | **8483** | 100.0% | Complete catalog coverage |
| **Generated English Proposals** | **8483** | 100.0% | English target translation proposals |
| **Generated Urdu Proposals** | **8483** | 100.0% | Urdu target translation proposals |
| **Review-Required Proposals** | **8477** | 99.9% | Flagged for human translator sign-off |
| **High-Risk Entries** | **8477** | 99.9% | Formulas, conflicts, or complex templates |
| **Interpolation Entries** | **192** | 2.3% | Dynamic parameters strictly preserved |
| **Pluralization Requirements** | **120** | 1.4% | Aligned with Arabic 6-form rules |
| **Protected Business Tokens** | **1** | 0.0% | IDs, codes, units (SAR, KG, TON) |
| **Semantic Conflicts Isolated** | **834** | 9.8% | Distinct contextual keys maintained |
| **Domain Terminology Entries** | **0** | 0.0% | Heavy transport & enterprise terms |

## 2. Confidence Level Distribution

| Confidence Level | Count | Percentage | Criteria |
| :--- | :--- | :--- | :--- |
| **HIGH** | **138** | 1.6% | Foundation verified & exact UI dictionary matches |
| **MEDIUM** | **2354** | 27.7% | Contextual UI terms with clear semantics |
| **LOW** | **5991** | 70.6% | Ambiguous phrases, high risk, or conflicts (Review Mandatory) |

## 3. Tiered Strategy Breakdown

| Strategy Tier | Count | Description |
| :--- | :--- | :--- |
| **Tier 1: Safe Generic UI** | **6** | Common buttons, actions, and standard alerts |
| **Tier 2: Contextual Application UI** | **0** | Logistics entities (Trucks, Drivers, Carriers, Projects) |
| **Tier 3: Domain-Sensitive** | **0** | Pricing, Settlement, Weighbridge, Security, Exceptions |
| **Tier 4: High Risk** | **8477** | Semantic conflicts, complex templates, mixed calculations |

## 4. Category Breakdown

| Category | Total Entries | Generated | Review Required | High Conf | Med Conf | Low Conf |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `other` | 2191 | 2191 | 2187 | 81 | 422 | 1688 |
| `imports` | 1575 | 1575 | 1575 | 17 | 389 | 1169 |
| `reports` | 567 | 567 | 567 | 3 | 166 | 398 |
| `trips` | 528 | 528 | 528 | 7 | 233 | 288 |
| `security` | 503 | 503 | 502 | 3 | 198 | 302 |
| `pricing` | 491 | 491 | 491 | 1 | 171 | 319 |
| `weighbridge` | 419 | 419 | 419 | 4 | 102 | 313 |
| `legacyMigration` | 295 | 295 | 295 | 2 | 34 | 259 |
| `exceptions` | 295 | 295 | 295 | 0 | 74 | 221 |
| `offline` | 284 | 284 | 284 | 1 | 127 | 156 |
| `entityResolution` | 277 | 277 | 277 | 1 | 61 | 215 |
| `navigation` | 236 | 236 | 236 | 2 | 58 | 176 |
| `projects` | 188 | 188 | 188 | 3 | 65 | 120 |
| `loading` | 154 | 154 | 154 | 4 | 71 | 79 |
| `dashboard` | 150 | 150 | 150 | 5 | 46 | 99 |
| `unloading` | 134 | 134 | 134 | 2 | 58 | 74 |
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
| `SEMANTIC_CONFLICT` | **834** | Triggered by rule engine classification |
| `INTERPOLATION_RISK` | **8** | Triggered by rule engine classification |
| `PLURALIZATION_RISK` | **120** | Triggered by rule engine classification |
| `REPORT_EXPORT_RISK` | **1686** | Triggered by rule engine classification |
| `BUSINESS_DATA_RISK` | **1290** | Triggered by rule engine classification |
| `LOW_CONFIDENCE` | **8477** | Triggered by rule engine classification |

## 6. Architectural Invariance Guarantees

- **No Application Files Modified:** 0 application TSX/TS/JSX components touched.
- **No Codemod Executed:** Components continue serving literal strings in production.
- **Foundation Dictionary Untouched:** Verified BLOCK 40 foundation dictionary remains 100% identical.
- **Interpolation Parameter Preservation:** 100% of dynamic parameters verified across all generated proposals.
- **Business Data Intact:** Calculations, Firestore, pricing, reports, and weight state machines remain untouched.
