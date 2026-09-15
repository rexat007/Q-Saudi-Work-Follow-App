# Production Translation Catalog & Semantic Review Report (BLOCK 42)

**Generated At:** 2026-09-15T09:55:14.240Z
**Catalog Version:** 1.0.0-block42
**Canonical Source Language:** Arabic (`ar`) — 100% Preserved Invariance
**Target Languages:** English (`en`), Urdu (`ur`)

## 1. Executive Catalog Metrics

| Metric | Count | Description |
| :--- | :--- | :--- |
| **Total Unique Catalog Keys** | **12854** | Distinct semantic translation keys generated |
| **Translated Keys (Phase 1 Foundation)** | **6** | Approved canonical terms (ar, en, ur verified) |
| **Untranslated Slots (Pending Review)** | **8726** | Explicitly flagged for professional human review |
| **Review Required Keys** | **8726** | Domain terminology requiring semantic verification |
| **Ambiguous Keys Isolated** | **4121** | Short tokens or codes quarantined from auto-translation |
| **Protected Business Tokens** | **1** | Database identifiers, formulas, units, currencies |
| **Interpolation Placeholders** | **221** | Dynamic parameters (e.g. `{count}`) strictly preserved |
| **Pluralization Requirements** | **153** | Expressions requiring 6 Arabic plural forms |
| **Semantic Conflicts Isolated** | **640** | Identical texts split into separate contextual keys |
| **Duplicate Groups (Type A Sharing)** | **1779** | Safe identical-context key reuse candidates |
| **Directional Migration Queue** | **269** | Physical Tailwind classes flagged for RTL/LTR migration |

## 2. Category Distribution & Translation Readiness

| Category | Total Keys | Translated | Untranslated | Review Required | Ambiguous |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `other` | 5284 | 4 | 3838 | 3838 | 1442 |
| `imports` | 1664 | 0 | 1148 | 1148 | 516 |
| `reports` | 610 | 0 | 382 | 382 | 227 |
| `trips` | 584 | 0 | 413 | 413 | 171 |
| `security` | 571 | 1 | 409 | 409 | 161 |
| `projects` | 568 | 0 | 363 | 363 | 205 |
| `pricing` | 514 | 0 | 330 | 330 | 184 |
| `navigation` | 438 | 0 | 245 | 245 | 193 |
| `weighbridge` | 418 | 0 | 229 | 229 | 189 |
| `offline` | 296 | 0 | 178 | 178 | 118 |
| `exceptions` | 295 | 0 | 178 | 178 | 117 |
| `legacyMigration` | 295 | 0 | 124 | 124 | 171 |
| `entityResolution` | 268 | 0 | 189 | 189 | 79 |
| `unloading` | 263 | 0 | 189 | 189 | 74 |
| `loading` | 230 | 0 | 194 | 194 | 36 |
| `dashboard` | 150 | 0 | 90 | 90 | 60 |
| `authentication` | 115 | 0 | 76 | 76 | 39 |
| `drivers` | 77 | 0 | 33 | 33 | 44 |
| `validation` | 76 | 0 | 26 | 26 | 50 |
| `carriers` | 52 | 0 | 40 | 40 | 12 |
| `materials` | 50 | 0 | 32 | 32 | 18 |
| `trucks` | 28 | 0 | 15 | 15 | 13 |
| `shared` | 8 | 1 | 5 | 5 | 2 |

## 3. Semantic Conflict Separation (Sample)

Identical Arabic terms separated into distinct keys based on operational context to prevent catastrophic UI or business conflation:

| Key | Arabic Source | Category | Semantic Context | Review Status |
| :--- | :--- | :--- | :--- | :--- |
| `authentication.labels.txt_1567b8` | "غير محدد" | `authentication` | literal | `REVIEW_REQUIRED` |
| `authentication.labels.txt_1f05e4` | "البريد الإلكتروني:" | `authentication` | literal | `REVIEW_REQUIRED` |
| `authentication.labels.txt_2725af` | "مدير النظام" | `authentication` | literal | `REVIEW_REQUIRED` |
| `authentication.labels.txt_65988f` | "المهندس طارق بن خالد الشمري" | `authentication` | prop_displayName | `REVIEW_REQUIRED` |
| `authentication.labels.txt_6c67d4` | "مستخدم جديد" | `authentication` | literal | `REVIEW_REQUIRED` |
| `authentication.labels.txt_b1a849` | "تسجيل الخروج" | `authentication` | literal | `REVIEW_REQUIRED` |
| `carriers.actions.cancel` | "إلغاء" | `carriers` | jsx_text | `REVIEW_REQUIRED` |
| `carriers.labels.add` | "إضافة ناقل جديد" | `carriers` | jsx_text | `REVIEW_REQUIRED` |
| `carriers.labels.carrier_2` | "تسجيل الناقل" | `carriers` | literal | `REVIEW_REQUIRED` |
| `carriers.labels.carrier_3` | "الناقل غير موجود" | `carriers` | literal | `REVIEW_REQUIRED` |
| `carriers.labels.save` | "حفظ التعديلات" | `carriers` | literal | `REVIEW_REQUIRED` |
| `carriers.labels.status` | "الحالة التشغيلية (status)" | `carriers` | jsx_text | `REVIEW_REQUIRED` |
| `carriers.labels.txt_1f05e4` | "البريد الإلكتروني" | `carriers` | jsx_text | `REVIEW_REQUIRED` |
| `carriers.labels.txt_252d6d` | "الجوال:" | `carriers` | jsx_text | `REVIEW_REQUIRED` |
| `carriers.labels.txt_2f889d` | "السجل التجاري:" | `carriers` | jsx_text | `REVIEW_REQUIRED` |

## 4. Directional Migration Queue (First 15 Items)

| File | Line | Physical Class | Recommended Logical Class | Risk |
| :--- | :--- | :--- | :--- | :--- |
| `src/App.tsx` | 740 | `ChevronLeft` | `Logical directional flip required (e.g. rtl:rotate-180)` | `MUST_MIGRATE` |
| `src/App.tsx` | 765 | `ChevronLeft` | `Logical directional flip required (e.g. rtl:rotate-180)` | `MUST_MIGRATE` |
| `src/components/FirestoreArchitectureView.tsx` | 471 | `text-left` | `text-start` | `MUST_MIGRATE` |
| `src/components/FirestoreArchitectureView.tsx` | 529 | `pr-1` | `pe-1` | `MUST_MIGRATE` |
| `src/components/TripEngineView.tsx` | 608 | `mr-1` | `me-1` | `MUST_MIGRATE` |
| `src/components/TripEngineView.tsx` | 628 | `mr-1` | `me-1` | `MUST_MIGRATE` |
| `src/components/TripEngineView.tsx` | 651 | `mr-1` | `me-1` | `MUST_MIGRATE` |
| `src/components/TripEngineView.tsx` | 671 | `mr-1` | `me-1` | `MUST_MIGRATE` |
| `src/components/TripEngineView.tsx` | 693 | `mr-1` | `me-1` | `MUST_MIGRATE` |
| `src/components/TripEngineView.tsx` | 950 | `ArrowRight` | `Logical directional flip required (e.g. rtl:rotate-180)` | `MUST_MIGRATE` |
| `src/components/TripEngineView.tsx` | 967 | `ArrowRight` | `Logical directional flip required (e.g. rtl:rotate-180)` | `MUST_MIGRATE` |
| `src/components/TripEngineView.tsx` | 984 | `ArrowRight` | `Logical directional flip required (e.g. rtl:rotate-180)` | `MUST_MIGRATE` |
| `src/components/TripEngineView.tsx` | 1001 | `ArrowRight` | `Logical directional flip required (e.g. rtl:rotate-180)` | `MUST_MIGRATE` |
| `src/components/TripEngineView.tsx` | 1018 | `ArrowRight` | `Logical directional flip required (e.g. rtl:rotate-180)` | `MUST_MIGRATE` |
| `src/components/TripEngineView.tsx` | 1036 | `ArrowRight` | `Logical directional flip required (e.g. rtl:rotate-180)` | `MUST_MIGRATE` |

## 5. Non-Destructive Invariance Guarantees

- **No Application Strings Modified:** Arabic UI strings remain 100% identical.
- **No Codemod Executed:** Components continue serving literal strings in production.
- **Complete Key Alignment:** 100% of keys exist in all 3 language slots with explicit status.
- **Business Data Intact:** Calculations, Firestore, pricing, reports, and weight state machines remain untouched.
