# Translation Generation Executive Summary (BLOCK 43)

**Generated At:** 2026-09-29T11:17:09.469Z
**Translation Engine Provider:** Deterministic Domain & Terminology Engine (BLOCK 43)
**Canonical Source Language:** Arabic (`ar`) — 100% Preserved Invariance
**Target Proposal Languages:** English (`en`), Urdu (`ur`)

## 1. Key Metrics & Overall Yield

| Metric | Count | Percentage | Architectural Role |
| :--- | :--- | :--- | :--- |
| **Total Entries Processed** | **14712** | 100.0% | Complete catalog coverage |
| **Generated English Proposals** | **14712** | 100.0% | English target translation proposals |
| **Generated Urdu Proposals** | **14712** | 100.0% | Urdu target translation proposals |
| **Review-Required Proposals** | **14706** | 100.0% | Flagged for human translator sign-off |
| **High-Risk Entries** | **14706** | 100.0% | Formulas, conflicts, or complex templates |
| **Interpolation Entries** | **218** | 1.5% | Dynamic parameters strictly preserved |
| **Pluralization Requirements** | **155** | 1.1% | Aligned with Arabic 6-form rules |
| **Protected Business Tokens** | **1** | 0.0% | IDs, codes, units (SAR, KG, TON) |
| **Semantic Conflicts Isolated** | **1622** | 11.0% | Distinct contextual keys maintained |
| **Domain Terminology Entries** | **0** | 0.0% | Heavy transport & enterprise terms |

## 2. Confidence Level Distribution

| Confidence Level | Count | Percentage | Criteria |
| :--- | :--- | :--- | :--- |
| **HIGH** | **144** | 1.0% | Foundation verified & exact UI dictionary matches |
| **MEDIUM** | **3770** | 25.6% | Contextual UI terms with clear semantics |
| **LOW** | **10798** | 73.4% | Ambiguous phrases, high risk, or conflicts (Review Mandatory) |

## 3. Tiered Strategy Breakdown

| Strategy Tier | Count | Description |
| :--- | :--- | :--- |
| **Tier 1: Safe Generic UI** | **6** | Common buttons, actions, and standard alerts |
| **Tier 2: Contextual Application UI** | **0** | Logistics entities (Trucks, Drivers, Carriers, Projects) |
| **Tier 3: Domain-Sensitive** | **0** | Pricing, Settlement, Weighbridge, Security, Exceptions |
| **Tier 4: High Risk** | **14706** | Semantic conflicts, complex templates, mixed calculations |

## 4. Category Breakdown

| Category | Total Entries | Generated | Review Required | High Conf | Med Conf | Low Conf |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `other` | 5456 | 5456 | 5452 | 82 | 1140 | 4234 |
| `imports` | 2170 | 2170 | 2170 | 16 | 530 | 1624 |
| `projects` | 1100 | 1100 | 1100 | 6 | 317 | 777 |
| `reports` | 723 | 723 | 723 | 4 | 188 | 531 |
| `trips` | 722 | 722 | 722 | 7 | 274 | 441 |
| `pricing` | 590 | 590 | 590 | 1 | 193 | 396 |
| `security` | 565 | 565 | 565 | 3 | 190 | 372 |
| `navigation` | 442 | 442 | 442 | 0 | 77 | 365 |
| `weighbridge` | 359 | 359 | 359 | 4 | 88 | 267 |
| `unloading` | 312 | 312 | 312 | 3 | 115 | 194 |
| `offline` | 300 | 300 | 300 | 1 | 136 | 163 |
| `exceptions` | 300 | 300 | 299 | 1 | 94 | 205 |
| `legacyMigration` | 295 | 295 | 295 | 2 | 39 | 254 |
| `entityResolution` | 286 | 286 | 286 | 1 | 67 | 218 |
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
| `SEMANTIC_CONFLICT` | **1622** | Triggered by rule engine classification |
| `INTERPOLATION_RISK` | **8** | Triggered by rule engine classification |
| `PLURALIZATION_RISK` | **155** | Triggered by rule engine classification |
| `REPORT_EXPORT_RISK` | **4211** | Triggered by rule engine classification |
| `BUSINESS_DATA_RISK` | **1765** | Triggered by rule engine classification |
| `LOW_CONFIDENCE` | **14706** | Triggered by rule engine classification |

## 6. Architectural Invariance Guarantees

- **No Application Files Modified:** 0 application TSX/TS/JSX components touched.
- **No Codemod Executed:** Components continue serving literal strings in production.
- **Foundation Dictionary Untouched:** Verified BLOCK 40 foundation dictionary remains 100% identical.
- **Interpolation Parameter Preservation:** 100% of dynamic parameters verified across all generated proposals.
- **Business Data Intact:** Calculations, Firestore, pricing, reports, and weight state machines remain untouched.
