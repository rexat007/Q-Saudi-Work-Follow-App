# Translation Generation Executive Summary (BLOCK 43)

**Generated At:** 2026-09-15T08:21:04.466Z
**Translation Engine Provider:** Deterministic Domain & Terminology Engine (BLOCK 43)
**Canonical Source Language:** Arabic (`ar`) — 100% Preserved Invariance
**Target Proposal Languages:** English (`en`), Urdu (`ur`)

## 1. Key Metrics & Overall Yield

| Metric | Count | Percentage | Architectural Role |
| :--- | :--- | :--- | :--- |
| **Total Entries Processed** | **12853** | 100.0% | Complete catalog coverage |
| **Generated English Proposals** | **12853** | 100.0% | English target translation proposals |
| **Generated Urdu Proposals** | **12853** | 100.0% | Urdu target translation proposals |
| **Review-Required Proposals** | **12847** | 100.0% | Flagged for human translator sign-off |
| **High-Risk Entries** | **12847** | 100.0% | Formulas, conflicts, or complex templates |
| **Interpolation Entries** | **221** | 1.7% | Dynamic parameters strictly preserved |
| **Pluralization Requirements** | **153** | 1.2% | Aligned with Arabic 6-form rules |
| **Protected Business Tokens** | **1** | 0.0% | IDs, codes, units (SAR, KG, TON) |
| **Semantic Conflicts Isolated** | **1603** | 12.5% | Distinct contextual keys maintained |
| **Domain Terminology Entries** | **0** | 0.0% | Heavy transport & enterprise terms |

## 2. Confidence Level Distribution

| Confidence Level | Count | Percentage | Criteria |
| :--- | :--- | :--- | :--- |
| **HIGH** | **144** | 1.1% | Foundation verified & exact UI dictionary matches |
| **MEDIUM** | **3619** | 28.2% | Contextual UI terms with clear semantics |
| **LOW** | **9090** | 70.7% | Ambiguous phrases, high risk, or conflicts (Review Mandatory) |

## 3. Tiered Strategy Breakdown

| Strategy Tier | Count | Description |
| :--- | :--- | :--- |
| **Tier 1: Safe Generic UI** | **6** | Common buttons, actions, and standard alerts |
| **Tier 2: Contextual Application UI** | **0** | Logistics entities (Trucks, Drivers, Carriers, Projects) |
| **Tier 3: Domain-Sensitive** | **0** | Pricing, Settlement, Weighbridge, Security, Exceptions |
| **Tier 4: High Risk** | **12847** | Semantic conflicts, complex templates, mixed calculations |

## 4. Category Breakdown

| Category | Total Entries | Generated | Review Required | High Conf | Med Conf | Low Conf |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `other` | 5284 | 5284 | 5280 | 82 | 1181 | 4021 |
| `imports` | 1664 | 1664 | 1664 | 17 | 515 | 1132 |
| `reports` | 610 | 610 | 610 | 4 | 179 | 427 |
| `trips` | 584 | 584 | 584 | 7 | 242 | 335 |
| `security` | 571 | 571 | 570 | 3 | 218 | 350 |
| `projects` | 568 | 568 | 568 | 4 | 172 | 392 |
| `pricing` | 514 | 514 | 514 | 1 | 184 | 329 |
| `navigation` | 437 | 437 | 437 | 2 | 91 | 344 |
| `weighbridge` | 418 | 418 | 418 | 4 | 114 | 300 |
| `offline` | 296 | 296 | 296 | 1 | 128 | 167 |
| `legacyMigration` | 295 | 295 | 295 | 2 | 39 | 254 |
| `exceptions` | 295 | 295 | 295 | 0 | 94 | 201 |
| `entityResolution` | 268 | 268 | 268 | 1 | 67 | 200 |
| `unloading` | 263 | 263 | 263 | 3 | 110 | 150 |
| `loading` | 230 | 230 | 230 | 4 | 110 | 116 |
| `dashboard` | 150 | 150 | 150 | 5 | 48 | 97 |
| `authentication` | 115 | 115 | 115 | 0 | 30 | 85 |
| `drivers` | 77 | 77 | 77 | 2 | 23 | 52 |
| `validation` | 76 | 76 | 76 | 0 | 9 | 67 |
| `carriers` | 52 | 52 | 52 | 1 | 20 | 31 |
| `materials` | 50 | 50 | 50 | 0 | 26 | 24 |
| `trucks` | 28 | 28 | 28 | 0 | 15 | 13 |
| `shared` | 8 | 8 | 7 | 1 | 4 | 3 |

## 5. Review Reasons Breakdown

| Review Reason | Items Flagged | Primary Trigger |
| :--- | :--- | :--- |
| `SEMANTIC_CONFLICT` | **1603** | Triggered by rule engine classification |
| `INTERPOLATION_RISK` | **8** | Triggered by rule engine classification |
| `PLURALIZATION_RISK` | **153** | Triggered by rule engine classification |
| `REPORT_EXPORT_RISK` | **3956** | Triggered by rule engine classification |
| `BUSINESS_DATA_RISK` | **1691** | Triggered by rule engine classification |
| `LOW_CONFIDENCE` | **12847** | Triggered by rule engine classification |

## 6. Architectural Invariance Guarantees

- **No Application Files Modified:** 0 application TSX/TS/JSX components touched.
- **No Codemod Executed:** Components continue serving literal strings in production.
- **Foundation Dictionary Untouched:** Verified BLOCK 40 foundation dictionary remains 100% identical.
- **Interpolation Parameter Preservation:** 100% of dynamic parameters verified across all generated proposals.
- **Business Data Intact:** Calculations, Firestore, pricing, reports, and weight state machines remain untouched.
