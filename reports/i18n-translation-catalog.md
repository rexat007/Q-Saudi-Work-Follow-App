# Production Translation Catalog & Semantic Review Report (BLOCK 42)

**Generated At:** 2026-09-20T07:02:12.606Z
**Catalog Version:** 1.0.0-block42
**Canonical Source Language:** Arabic (`ar`) — 100% Preserved Invariance
**Target Languages:** English (`en`), Urdu (`ur`)

## 1. Executive Catalog Metrics

| Metric | Count | Description |
| :--- | :--- | :--- |
| **Total Unique Catalog Keys** | **14195** | Distinct semantic translation keys generated |
| **Translated Keys (Phase 1 Foundation)** | **6** | Approved canonical terms (ar, en, ur verified) |
| **Untranslated Slots (Pending Review)** | **9226** | Explicitly flagged for professional human review |
| **Review Required Keys** | **9226** | Domain terminology requiring semantic verification |
| **Ambiguous Keys Isolated** | **4962** | Short tokens or codes quarantined from auto-translation |
| **Protected Business Tokens** | **1** | Database identifiers, formulas, units, currencies |
| **Interpolation Placeholders** | **236** | Dynamic parameters (e.g. `{count}`) strictly preserved |
| **Pluralization Requirements** | **154** | Expressions requiring 6 Arabic plural forms |
| **Semantic Conflicts Isolated** | **664** | Identical texts split into separate contextual keys |
| **Duplicate Groups (Type A Sharing)** | **2192** | Safe identical-context key reuse candidates |
| **Directional Migration Queue** | **271** | Physical Tailwind classes flagged for RTL/LTR migration |

## 2. Category Distribution & Translation Readiness

| Category | Total Keys | Translated | Untranslated | Review Required | Ambiguous |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `other` | 5545 | 4 | 3906 | 3906 | 1635 |
| `imports` | 1759 | 0 | 1176 | 1176 | 583 |
| `projects` | 1016 | 0 | 638 | 638 | 378 |
| `reports` | 723 | 0 | 396 | 396 | 326 |
| `trips` | 595 | 0 | 416 | 416 | 179 |
| `security` | 534 | 0 | 355 | 355 | 179 |
| `navigation` | 532 | 0 | 307 | 307 | 225 |
| `pricing` | 514 | 0 | 330 | 330 | 184 |
| `weighbridge` | 418 | 0 | 229 | 229 | 189 |
| `unloading` | 312 | 0 | 194 | 194 | 118 |
| `offline` | 302 | 0 | 184 | 184 | 118 |
| `exceptions` | 299 | 0 | 178 | 178 | 121 |
| `legacyMigration` | 295 | 0 | 124 | 124 | 171 |
| `entityResolution` | 288 | 0 | 190 | 190 | 98 |
| `loading` | 283 | 0 | 219 | 219 | 64 |
| `authentication` | 179 | 0 | 84 | 84 | 95 |
| `dashboard` | 152 | 1 | 90 | 90 | 61 |
| `trucks` | 128 | 0 | 65 | 65 | 63 |
| `drivers` | 105 | 0 | 34 | 34 | 71 |
| `validation` | 83 | 0 | 26 | 26 | 57 |
| `materials` | 73 | 0 | 40 | 40 | 33 |
| `carriers` | 52 | 0 | 40 | 40 | 12 |
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
| `src/App.tsx` | 743 | `ChevronLeft` | `Logical directional flip required (e.g. rtl:rotate-180)` | `MUST_MIGRATE` |
| `src/App.tsx` | 768 | `ChevronLeft` | `Logical directional flip required (e.g. rtl:rotate-180)` | `MUST_MIGRATE` |
| `src/components/FirestoreArchitectureView.tsx` | 471 | `text-left` | `text-start` | `MUST_MIGRATE` |
| `src/components/FirestoreArchitectureView.tsx` | 529 | `pr-1` | `pe-1` | `MUST_MIGRATE` |
| `src/components/TripEngineView.tsx` | 611 | `mr-1` | `me-1` | `MUST_MIGRATE` |
| `src/components/TripEngineView.tsx` | 631 | `mr-1` | `me-1` | `MUST_MIGRATE` |
| `src/components/TripEngineView.tsx` | 654 | `mr-1` | `me-1` | `MUST_MIGRATE` |
| `src/components/TripEngineView.tsx` | 674 | `mr-1` | `me-1` | `MUST_MIGRATE` |
| `src/components/TripEngineView.tsx` | 696 | `mr-1` | `me-1` | `MUST_MIGRATE` |
| `src/components/TripEngineView.tsx` | 953 | `ArrowRight` | `Logical directional flip required (e.g. rtl:rotate-180)` | `MUST_MIGRATE` |
| `src/components/TripEngineView.tsx` | 970 | `ArrowRight` | `Logical directional flip required (e.g. rtl:rotate-180)` | `MUST_MIGRATE` |
| `src/components/TripEngineView.tsx` | 987 | `ArrowRight` | `Logical directional flip required (e.g. rtl:rotate-180)` | `MUST_MIGRATE` |
| `src/components/TripEngineView.tsx` | 1004 | `ArrowRight` | `Logical directional flip required (e.g. rtl:rotate-180)` | `MUST_MIGRATE` |
| `src/components/TripEngineView.tsx` | 1021 | `ArrowRight` | `Logical directional flip required (e.g. rtl:rotate-180)` | `MUST_MIGRATE` |
| `src/components/TripEngineView.tsx` | 1039 | `ArrowRight` | `Logical directional flip required (e.g. rtl:rotate-180)` | `MUST_MIGRATE` |

## 5. Non-Destructive Invariance Guarantees

- **No Application Strings Modified:** Arabic UI strings remain 100% identical.
- **No Codemod Executed:** Components continue serving literal strings in production.
- **Complete Key Alignment:** 100% of keys exist in all 3 language slots with explicit status.
- **Business Data Intact:** Calculations, Firestore, pricing, reports, and weight state machines remain untouched.
