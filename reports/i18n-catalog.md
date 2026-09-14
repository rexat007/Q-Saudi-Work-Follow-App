# i18n Catalog Extraction & Translation-Key Architecture Report (BLOCK 41)

**Generated At:** 2026-09-14T08:00:15.585Z
**Scope:** Read-only AST catalog analysis for existing application codebase.

## 1. Executive Summary Metrics

| Metric | Count | Description |
| :--- | :--- | :--- |
| **Total Files Scanned** | 277 | TypeScript and TSX files analyzed in `src/` |
| **Total Extracted Candidates** | 35642 | Total strings and text nodes parsed |
| **Real User-Facing Texts** | 9238 | Confirmed visible Arabic and UI texts |
| **Likely User-Facing Texts** | 369 | English UI text in visible elements |
| **Ambiguous Texts** | 8540 | Short or context-isolated tokens for manual review |
| **Technical Strings** | 7566 | CSS classes, paths, enums, regexes, operators |
| **Non-User-Facing Strings** | 9929 | Internal IDs, collection names, database keys |
| **Distinct Proposed Keys** | 8200 | Hierarchical keys generated (e.g. `shared.actions.save`) |
| **Duplicate Groups** | 4216 | Sets of identical/normalized recurring texts |
| **Semantic Conflict Groups** | 601 | Identical texts requiring distinct contextual keys |
| **Keys Requiring Review** | 10492 | Entries flagged with special cases or ambiguity |
| **High / Critical Risk Hotspots** | 2294 | Concatenations, templates, or business data overlaps |

## 2. Category Distribution

| Semantic Category | User-Facing Strings | Description |
| :--- | :--- | :--- |
| `other` | 4289 | Classified operational domain |
| `imports` | 1428 | Classified operational domain |
| `security` | 456 | Classified operational domain |
| `trips` | 455 | Classified operational domain |
| `reports` | 453 | Classified operational domain |
| `pricing` | 345 | Classified operational domain |
| `weighbridge` | 281 | Classified operational domain |
| `entityResolution` | 264 | Classified operational domain |
| `navigation` | 248 | Classified operational domain |
| `loading` | 230 | Classified operational domain |
| `unloading` | 226 | Classified operational domain |
| `exceptions` | 188 | Classified operational domain |
| `offline` | 184 | Classified operational domain |
| `legacyMigration` | 173 | Classified operational domain |
| `projects` | 121 | Classified operational domain |
| `dashboard` | 110 | Classified operational domain |
| `carriers` | 41 | Classified operational domain |
| `materials` | 35 | Classified operational domain |
| `drivers` | 31 | Classified operational domain |
| `authentication` | 18 | Classified operational domain |
| `validation` | 16 | Classified operational domain |
| `trucks` | 15 | Classified operational domain |
| `shared` | 0 | Classified operational domain |

## 3. Directional (RTL / LTR) Class Inventory

- **Total Directional Usages Detected:** 362
- **Must Migrate (Physical to Logical):** 254 (e.g. `text-left` -> `text-start`, `pl-` -> `ps-`)
- **Probably Safe / Technical:** 108

### Directional Classes Sample (First 15 Entries)

| File | Line | Class / Icon | Type | Risk | Suggested Replacement |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `src/App.tsx` | 635 | `ChevronLeft` | icon | `MUST_MIGRATE` | `Logical directional flip required (e.g. rtl:rotate-180)` |
| `src/App.tsx` | 660 | `ChevronLeft` | icon | `MUST_MIGRATE` | `Logical directional flip required (e.g. rtl:rotate-180)` |
| `src/components/FirestoreArchitectureView.tsx` | 471 | `text-left` | text-alignment | `MUST_MIGRATE` | `text-start` |
| `src/components/FirestoreArchitectureView.tsx` | 529 | `pr-1` | padding | `MUST_MIGRATE` | `pe-1` |
| `src/components/FirestoreArchitectureView.tsx` | 716 | `border-rose-200` | border | `PROBABLY_SAFE` | `border-rose-200` |
| `src/components/TripEngineView.tsx` | 609 | `mr-1` | margin | `MUST_MIGRATE` | `me-1` |
| `src/components/TripEngineView.tsx` | 629 | `mr-1` | margin | `MUST_MIGRATE` | `me-1` |
| `src/components/TripEngineView.tsx` | 652 | `mr-1` | margin | `MUST_MIGRATE` | `me-1` |
| `src/components/TripEngineView.tsx` | 672 | `mr-1` | margin | `MUST_MIGRATE` | `me-1` |
| `src/components/TripEngineView.tsx` | 694 | `mr-1` | margin | `MUST_MIGRATE` | `me-1` |
| `src/components/TripEngineView.tsx` | 765 | `border-rose-200` | border | `PROBABLY_SAFE` | `border-rose-200` |
| `src/components/TripEngineView.tsx` | 772 | `border-rose-300` | border | `PROBABLY_SAFE` | `border-rose-300` |
| `src/components/TripEngineView.tsx` | 950 | `ArrowRight` | icon | `MUST_MIGRATE` | `Logical directional flip required (e.g. rtl:rotate-180)` |
| `src/components/TripEngineView.tsx` | 967 | `ArrowRight` | icon | `MUST_MIGRATE` | `Logical directional flip required (e.g. rtl:rotate-180)` |
| `src/components/TripEngineView.tsx` | 974 | `border-rose-200` | border | `PROBABLY_SAFE` | `border-rose-200` |

## 4. Semantic Conflict Groups Sample

Identical visible text appearing across different operational domains with distinct contextual intent.

| Text | Occurrences | Reason | Distinct Contexts & Keys |
| :--- | :--- | :--- | :--- |
| "كجم" | 52 | Identical string "كجم" occurs in multiple semantic contexts with distinct keys (trips.labels.txt_18471c, security.labels.txt_18471c, dashboard.labels.txt_18471c, entityResolution.labels.txt_18471c, other.labels.txt_18471c, loading.labels.txt_18471c, unloading.labels.txt_18471c, imports.labels.txt_18471c, weighbridge.labels.txt_18471c). | `trips` (trips.labels.txt_18471c)<br/>`security` (security.labels.txt_18471c)<br/>`dashboard` (dashboard.labels.txt_18471c)<br/>`entityResolution` (entityResolution.labels.txt_18471c)<br/>`other` (other.labels.txt_18471c)<br/>`loading` (loading.labels.txt_18471c)<br/>`unloading` (unloading.labels.txt_18471c)<br/>`imports` (imports.labels.txt_18471c)<br/>`weighbridge` (weighbridge.labels.txt_18471c)<br/>`other` (other.labels.txt_18471c)<br/>`other` (other.labels.txt_18471c)<br/>`other` (other.labels.txt_18471c)<br/>`other` (other.labels.txt_18471c)<br/>`other` (other.labels.txt_18471c) |
| "الشركة الشرقية للنقل" | 38 | Identical string "الشركة الشرقية للنقل" occurs in multiple semantic contexts with distinct keys (imports.labels.txt_95f5e9, entityResolution.labels.txt_95f5e9, other.labels.txt_95f5e9). | `imports` (imports.labels.txt_95f5e9)<br/>`imports` (imports.labels.txt_95f5e9)<br/>`imports` (imports.labels.txt_95f5e9)<br/>`imports` (imports.labels.txt_95f5e9)<br/>`imports` (imports.labels.txt_95f5e9)<br/>`imports` (imports.labels.txt_95f5e9)<br/>`imports` (imports.labels.txt_95f5e9)<br/>`entityResolution` (entityResolution.labels.txt_95f5e9)<br/>`entityResolution` (entityResolution.labels.txt_95f5e9)<br/>`entityResolution` (entityResolution.labels.txt_95f5e9)<br/>`entityResolution` (entityResolution.labels.txt_95f5e9)<br/>`entityResolution` (entityResolution.labels.txt_95f5e9)<br/>`entityResolution` (entityResolution.labels.txt_95f5e9)<br/>`entityResolution` (entityResolution.labels.txt_95f5e9)<br/>`entityResolution` (entityResolution.labels.txt_95f5e9)<br/>`imports` (imports.labels.txt_95f5e9)<br/>`other` (other.labels.txt_95f5e9)<br/>`other` (other.labels.txt_95f5e9)<br/>`other` (other.labels.txt_95f5e9)<br/>`other` (other.labels.txt_95f5e9) |
| "الناقل" | 37 | Identical string "الناقل" occurs in multiple semantic contexts with distinct keys (security.labels.carrier_2, dashboard.labels.carrier_2, entityResolution.labels.carrier_3, drivers.labels.carrier, loading.labels.carrier, unloading.labels.carrier, imports.labels.carrier_7, weighbridge.labels.carrier, other.labels.carrier_2, legacyMigration.labels.carrier_2, pricing.labels.carrier, reports.labels.carrier, loading.fields.carrier, other.fields.carrier_4, reports.fields.carrier_4). | `security` (security.labels.carrier_2)<br/>`dashboard` (dashboard.labels.carrier_2)<br/>`entityResolution` (entityResolution.labels.carrier_3)<br/>`drivers` (drivers.labels.carrier)<br/>`loading` (loading.labels.carrier)<br/>`unloading` (unloading.labels.carrier)<br/>`imports` (imports.labels.carrier_7)<br/>`weighbridge` (weighbridge.labels.carrier)<br/>`other` (other.labels.carrier_2)<br/>`legacyMigration` (legacyMigration.labels.carrier_2)<br/>`pricing` (pricing.labels.carrier)<br/>`reports` (reports.labels.carrier)<br/>`loading` (loading.fields.carrier)<br/>`other` (other.labels.carrier_2)<br/>`other` (other.fields.carrier_4)<br/>`other` (other.fields.carrier_4)<br/>`imports` (imports.labels.carrier_7)<br/>`reports` (reports.fields.carrier_4)<br/>`other` (other.labels.carrier_2)<br/>`weighbridge` (weighbridge.labels.carrier) |
| "رقم التذكرة" | 35 | Identical string "رقم التذكرة" occurs in multiple semantic contexts with distinct keys (imports.fields.ticketNumber, weighbridge.fields.ticketNumber, loading.fields.ticketNumber, other.fields.ticketNumber, legacyMigration.fields.ticketNumber). | `imports` (imports.fields.ticketNumber)<br/>`weighbridge` (weighbridge.fields.ticketNumber)<br/>`loading` (loading.fields.ticketNumber)<br/>`other` (other.fields.ticketNumber)<br/>`other` (other.fields.ticketNumber)<br/>`imports` (imports.fields.ticketNumber)<br/>`imports` (imports.fields.ticketNumber)<br/>`imports` (imports.fields.ticketNumber)<br/>`other` (other.fields.ticketNumber)<br/>`other` (other.fields.ticketNumber)<br/>`legacyMigration` (legacyMigration.fields.ticketNumber)<br/>`weighbridge` (weighbridge.fields.ticketNumber)<br/>`weighbridge` (weighbridge.fields.ticketNumber)<br/>`weighbridge` (weighbridge.fields.ticketNumber) |
| "1010-أ ب ج" | 34 | Identical string "1010-أ ب ج" occurs in multiple semantic contexts with distinct keys (imports.labels.txt_6dd358, entityResolution.labels.txt_6dd358, other.labels.txt_6dd358). | `imports` (imports.labels.txt_6dd358)<br/>`imports` (imports.labels.txt_6dd358)<br/>`imports` (imports.labels.txt_6dd358)<br/>`imports` (imports.labels.txt_6dd358)<br/>`entityResolution` (entityResolution.labels.txt_6dd358)<br/>`entityResolution` (entityResolution.labels.txt_6dd358)<br/>`entityResolution` (entityResolution.labels.txt_6dd358)<br/>`entityResolution` (entityResolution.labels.txt_6dd358)<br/>`entityResolution` (entityResolution.labels.txt_6dd358)<br/>`imports` (imports.labels.txt_6dd358)<br/>`other` (other.labels.txt_6dd358)<br/>`other` (other.labels.txt_6dd358) |
| "إلغاء" | 33 | Identical string "إلغاء" occurs in multiple semantic contexts with distinct keys (trips.actions.cancel, entityResolution.actions.cancel, exceptions.actions.cancel, legacyMigration.actions.cancel, materials.actions.cancel, carriers.actions.cancel, pricing.actions.cancel, projects.actions.cancel, other.actions.cancel). | `trips` (trips.actions.cancel)<br/>`entityResolution` (entityResolution.actions.cancel)<br/>`exceptions` (exceptions.actions.cancel)<br/>`legacyMigration` (legacyMigration.actions.cancel)<br/>`materials` (materials.actions.cancel)<br/>`carriers` (carriers.actions.cancel)<br/>`pricing` (pricing.actions.cancel)<br/>`projects` (projects.actions.cancel)<br/>`other` (other.actions.cancel)<br/>`other` (other.actions.cancel)<br/>`other` (other.actions.cancel)<br/>`other` (other.actions.cancel)<br/>`other` (other.actions.cancel)<br/>`other` (other.actions.cancel)<br/>`other` (other.actions.cancel) |
| "المادة" | 24 | Identical string "المادة" occurs in multiple semantic contexts with distinct keys (dashboard.labels.material_2, entityResolution.labels.material_3, drivers.labels.material, other.labels.material_2, imports.labels.material_2, legacyMigration.labels.material_2, pricing.labels.material_2, reports.labels.material, loading.fields.material, loading.labels.material_5, unloading.labels.material_2, weighbridge.labels.material, other.fields.material_3, reports.fields.material_3). | `dashboard` (dashboard.labels.material_2)<br/>`entityResolution` (entityResolution.labels.material_3)<br/>`drivers` (drivers.labels.material)<br/>`other` (other.labels.material_2)<br/>`imports` (imports.labels.material_2)<br/>`legacyMigration` (legacyMigration.labels.material_2)<br/>`pricing` (pricing.labels.material_2)<br/>`reports` (reports.labels.material)<br/>`loading` (loading.fields.material)<br/>`loading` (loading.labels.material_5)<br/>`unloading` (unloading.labels.material_2)<br/>`weighbridge` (weighbridge.labels.material)<br/>`other` (other.labels.material_2)<br/>`other` (other.fields.material_3)<br/>`other` (other.fields.material_3)<br/>`other` (other.fields.material_3)<br/>`imports` (imports.labels.material_2)<br/>`reports` (reports.fields.material_3) |
| "الوزن الصافي" | 24 | Identical string "الوزن الصافي" occurs in multiple semantic contexts with distinct keys (unloading.fields.netWeight, other.fields.netWeight, imports.fields.netWeight, weighbridge.fields.netWeight). | `unloading` (unloading.fields.netWeight)<br/>`other` (other.fields.netWeight)<br/>`other` (other.fields.netWeight)<br/>`imports` (imports.fields.netWeight)<br/>`imports` (imports.fields.netWeight)<br/>`other` (other.fields.netWeight)<br/>`other` (other.fields.netWeight)<br/>`weighbridge` (weighbridge.fields.netWeight)<br/>`weighbridge` (weighbridge.fields.netWeight) |
| "مؤسسة الرمال السريعة" | 24 | Identical string "مؤسسة الرمال السريعة" occurs in multiple semantic contexts with distinct keys (imports.labels.txt_1e149b, entityResolution.labels.txt_1e149b, other.labels.txt_1e149b). | `imports` (imports.labels.txt_1e149b)<br/>`imports` (imports.labels.txt_1e149b)<br/>`imports` (imports.labels.txt_1e149b)<br/>`imports` (imports.labels.txt_1e149b)<br/>`entityResolution` (entityResolution.labels.txt_1e149b)<br/>`entityResolution` (entityResolution.labels.txt_1e149b)<br/>`entityResolution` (entityResolution.labels.txt_1e149b)<br/>`entityResolution` (entityResolution.labels.txt_1e149b)<br/>`entityResolution` (entityResolution.labels.txt_1e149b)<br/>`entityResolution` (entityResolution.labels.txt_1e149b)<br/>`entityResolution` (entityResolution.labels.txt_1e149b)<br/>`other` (other.labels.txt_1e149b) |
| "أ ب ج 1234" | 19 | Identical string "أ ب ج 1234" occurs in multiple semantic contexts with distinct keys (other.labels.txt_5045a4, entityResolution.fields.txt_5045a4, trips.labels.txt_5045a4, legacyMigration.labels.txt_5045a4). | `other` (other.labels.txt_5045a4)<br/>`entityResolution` (entityResolution.fields.txt_5045a4)<br/>`other` (other.labels.txt_5045a4)<br/>`other` (other.labels.txt_5045a4)<br/>`other` (other.labels.txt_5045a4)<br/>`trips` (trips.labels.txt_5045a4)<br/>`legacyMigration` (legacyMigration.labels.txt_5045a4)<br/>`legacyMigration` (legacyMigration.labels.txt_5045a4)<br/>`legacyMigration` (legacyMigration.labels.txt_5045a4)<br/>`legacyMigration` (legacyMigration.labels.txt_5045a4) |

## 5. High-Risk Hotspots & Special Cases

- **Concatenated Strings (`+`):** 9
- **Template Literals (`${...}`):** 648
- **Interpolation Placeholders (`{...}`):** 255
- **Mixed Numbers & Units:** 911
- **Currency String Usages:** 419
- **Unit String Usages:** 849
- **Protected Business Field Matches:** 344

## 6. Safety & Non-Destructive Invariance Confirmation

- **No Code Modifications:** Zero application strings were rewritten or modified.
- **No Calling `t()` across app:** No automated codemod was executed.
- **Business Logic Invariance:** Pricing, reports, weighbridge, offline, and state machines are 100% untouched.
- **Deterministic Reproducibility:** Every catalog run generates identical keys and hashes.
