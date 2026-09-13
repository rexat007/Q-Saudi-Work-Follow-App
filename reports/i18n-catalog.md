# i18n Catalog Extraction & Translation-Key Architecture Report (BLOCK 41)

**Generated At:** 2026-09-13T09:40:19.717Z
**Scope:** Read-only AST catalog analysis for existing application codebase.

## 1. Executive Summary Metrics

| Metric | Count | Description |
| :--- | :--- | :--- |
| **Total Files Scanned** | 246 | TypeScript and TSX files analyzed in `src/` |
| **Total Extracted Candidates** | 32117 | Total strings and text nodes parsed |
| **Real User-Facing Texts** | 9304 | Confirmed visible Arabic and UI texts |
| **Likely User-Facing Texts** | 353 | English UI text in visible elements |
| **Ambiguous Texts** | 7430 | Short or context-isolated tokens for manual review |
| **Technical Strings** | 6868 | CSS classes, paths, enums, regexes, operators |
| **Non-User-Facing Strings** | 8162 | Internal IDs, collection names, database keys |
| **Distinct Proposed Keys** | 7620 | Hierarchical keys generated (e.g. `shared.actions.save`) |
| **Duplicate Groups** | 4178 | Sets of identical/normalized recurring texts |
| **Semantic Conflict Groups** | 485 | Identical texts requiring distinct contextual keys |
| **Keys Requiring Review** | 9384 | Entries flagged with special cases or ambiguity |
| **High / Critical Risk Hotspots** | 2265 | Concatenations, templates, or business data overlaps |

## 2. Category Distribution

| Semantic Category | User-Facing Strings | Description |
| :--- | :--- | :--- |
| `other` | 4672 | Classified operational domain |
| `imports` | 1430 | Classified operational domain |
| `security` | 456 | Classified operational domain |
| `trips` | 455 | Classified operational domain |
| `reports` | 449 | Classified operational domain |
| `pricing` | 345 | Classified operational domain |
| `weighbridge` | 281 | Classified operational domain |
| `entityResolution` | 264 | Classified operational domain |
| `exceptions` | 188 | Classified operational domain |
| `offline` | 184 | Classified operational domain |
| `legacyMigration` | 173 | Classified operational domain |
| `navigation` | 137 | Classified operational domain |
| `loading` | 137 | Classified operational domain |
| `unloading` | 132 | Classified operational domain |
| `projects` | 121 | Classified operational domain |
| `dashboard` | 110 | Classified operational domain |
| `carriers` | 41 | Classified operational domain |
| `materials` | 35 | Classified operational domain |
| `validation` | 16 | Classified operational domain |
| `trucks` | 15 | Classified operational domain |
| `drivers` | 11 | Classified operational domain |
| `authentication` | 5 | Classified operational domain |
| `shared` | 0 | Classified operational domain |

## 3. Directional (RTL / LTR) Class Inventory

- **Total Directional Usages Detected:** 324
- **Must Migrate (Physical to Logical):** 229 (e.g. `text-left` -> `text-start`, `pl-` -> `ps-`)
- **Probably Safe / Technical:** 95

### Directional Classes Sample (First 15 Entries)

| File | Line | Class / Icon | Type | Risk | Suggested Replacement |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `src/App.tsx` | 447 | `mr-0.5` | margin | `MUST_MIGRATE` | `me-0.5` |
| `src/App.tsx` | 706 | `ChevronLeft` | icon | `MUST_MIGRATE` | `Logical directional flip required (e.g. rtl:rotate-180)` |
| `src/App.tsx` | 729 | `ChevronLeft` | icon | `MUST_MIGRATE` | `Logical directional flip required (e.g. rtl:rotate-180)` |
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

## 4. Semantic Conflict Groups Sample

Identical visible text appearing across different operational domains with distinct contextual intent.

| Text | Occurrences | Reason | Distinct Contexts & Keys |
| :--- | :--- | :--- | :--- |
| "كجم" | 41 | Identical string "كجم" occurs in multiple semantic contexts with distinct keys (trips.labels.txt_18471c, security.labels.txt_18471c, dashboard.labels.txt_18471c, entityResolution.labels.txt_18471c, imports.labels.txt_18471c, weighbridge.labels.txt_18471c, other.labels.txt_18471c, loading.labels.txt_18471c, unloading.labels.txt_18471c). | `trips` (trips.labels.txt_18471c)<br/>`security` (security.labels.txt_18471c)<br/>`dashboard` (dashboard.labels.txt_18471c)<br/>`entityResolution` (entityResolution.labels.txt_18471c)<br/>`imports` (imports.labels.txt_18471c)<br/>`weighbridge` (weighbridge.labels.txt_18471c)<br/>`other` (other.labels.txt_18471c)<br/>`loading` (loading.labels.txt_18471c)<br/>`unloading` (unloading.labels.txt_18471c)<br/>`other` (other.labels.txt_18471c)<br/>`other` (other.labels.txt_18471c)<br/>`other` (other.labels.txt_18471c)<br/>`other` (other.labels.txt_18471c)<br/>`other` (other.labels.txt_18471c) |
| "رقم التذكرة" | 35 | Identical string "رقم التذكرة" occurs in multiple semantic contexts with distinct keys (imports.fields.ticketNumber, weighbridge.fields.ticketNumber, loading.fields.ticketNumber, other.fields.ticketNumber, legacyMigration.fields.ticketNumber). | `imports` (imports.fields.ticketNumber)<br/>`weighbridge` (weighbridge.fields.ticketNumber)<br/>`loading` (loading.fields.ticketNumber)<br/>`other` (other.fields.ticketNumber)<br/>`other` (other.fields.ticketNumber)<br/>`imports` (imports.fields.ticketNumber)<br/>`imports` (imports.fields.ticketNumber)<br/>`imports` (imports.fields.ticketNumber)<br/>`other` (other.fields.ticketNumber)<br/>`other` (other.fields.ticketNumber)<br/>`legacyMigration` (legacyMigration.fields.ticketNumber)<br/>`weighbridge` (weighbridge.fields.ticketNumber)<br/>`weighbridge` (weighbridge.fields.ticketNumber)<br/>`weighbridge` (weighbridge.fields.ticketNumber) |
| "الشركة الشرقية للنقل" | 34 | Identical string "الشركة الشرقية للنقل" occurs in multiple semantic contexts with distinct keys (imports.labels.txt_95f5e9, entityResolution.labels.txt_95f5e9). | `imports` (imports.labels.txt_95f5e9)<br/>`imports` (imports.labels.txt_95f5e9)<br/>`imports` (imports.labels.txt_95f5e9)<br/>`imports` (imports.labels.txt_95f5e9)<br/>`imports` (imports.labels.txt_95f5e9)<br/>`imports` (imports.labels.txt_95f5e9)<br/>`imports` (imports.labels.txt_95f5e9)<br/>`entityResolution` (entityResolution.labels.txt_95f5e9)<br/>`entityResolution` (entityResolution.labels.txt_95f5e9)<br/>`entityResolution` (entityResolution.labels.txt_95f5e9)<br/>`entityResolution` (entityResolution.labels.txt_95f5e9)<br/>`entityResolution` (entityResolution.labels.txt_95f5e9)<br/>`entityResolution` (entityResolution.labels.txt_95f5e9)<br/>`entityResolution` (entityResolution.labels.txt_95f5e9)<br/>`entityResolution` (entityResolution.labels.txt_95f5e9)<br/>`imports` (imports.labels.txt_95f5e9) |
| "الناقل" | 34 | Identical string "الناقل" occurs in multiple semantic contexts with distinct keys (security.labels.carrier_2, dashboard.labels.carrier_2, entityResolution.labels.carrier_3, imports.labels.carrier_7, weighbridge.labels.carrier, other.labels.carrier_2, legacyMigration.labels.carrier_2, pricing.labels.carrier, reports.labels.carrier, loading.fields.carrier, loading.labels.carrier_3, other.fields.carrier_4, reports.fields.carrier_4). | `security` (security.labels.carrier_2)<br/>`dashboard` (dashboard.labels.carrier_2)<br/>`entityResolution` (entityResolution.labels.carrier_3)<br/>`imports` (imports.labels.carrier_7)<br/>`weighbridge` (weighbridge.labels.carrier)<br/>`other` (other.labels.carrier_2)<br/>`legacyMigration` (legacyMigration.labels.carrier_2)<br/>`pricing` (pricing.labels.carrier)<br/>`reports` (reports.labels.carrier)<br/>`loading` (loading.fields.carrier)<br/>`loading` (loading.labels.carrier_3)<br/>`other` (other.labels.carrier_2)<br/>`other` (other.fields.carrier_4)<br/>`other` (other.fields.carrier_4)<br/>`imports` (imports.labels.carrier_7)<br/>`reports` (reports.fields.carrier_4)<br/>`other` (other.labels.carrier_2)<br/>`weighbridge` (weighbridge.labels.carrier) |
| "إلغاء" | 33 | Identical string "إلغاء" occurs in multiple semantic contexts with distinct keys (trips.actions.cancel, entityResolution.actions.cancel, exceptions.actions.cancel, legacyMigration.actions.cancel, materials.actions.cancel, carriers.actions.cancel, pricing.actions.cancel, projects.actions.cancel, other.actions.cancel). | `trips` (trips.actions.cancel)<br/>`entityResolution` (entityResolution.actions.cancel)<br/>`exceptions` (exceptions.actions.cancel)<br/>`legacyMigration` (legacyMigration.actions.cancel)<br/>`materials` (materials.actions.cancel)<br/>`carriers` (carriers.actions.cancel)<br/>`pricing` (pricing.actions.cancel)<br/>`projects` (projects.actions.cancel)<br/>`other` (other.actions.cancel)<br/>`other` (other.actions.cancel)<br/>`other` (other.actions.cancel)<br/>`other` (other.actions.cancel)<br/>`other` (other.actions.cancel)<br/>`other` (other.actions.cancel)<br/>`other` (other.actions.cancel) |
| "1010-أ ب ج" | 32 | Identical string "1010-أ ب ج" occurs in multiple semantic contexts with distinct keys (imports.labels.txt_6dd358, entityResolution.labels.txt_6dd358). | `imports` (imports.labels.txt_6dd358)<br/>`imports` (imports.labels.txt_6dd358)<br/>`imports` (imports.labels.txt_6dd358)<br/>`imports` (imports.labels.txt_6dd358)<br/>`entityResolution` (entityResolution.labels.txt_6dd358)<br/>`entityResolution` (entityResolution.labels.txt_6dd358)<br/>`entityResolution` (entityResolution.labels.txt_6dd358)<br/>`entityResolution` (entityResolution.labels.txt_6dd358)<br/>`entityResolution` (entityResolution.labels.txt_6dd358)<br/>`imports` (imports.labels.txt_6dd358) |
| "الوزن الصافي" | 24 | Identical string "الوزن الصافي" occurs in multiple semantic contexts with distinct keys (unloading.fields.netWeight, other.fields.netWeight, imports.fields.netWeight, weighbridge.fields.netWeight). | `unloading` (unloading.fields.netWeight)<br/>`other` (other.fields.netWeight)<br/>`other` (other.fields.netWeight)<br/>`imports` (imports.fields.netWeight)<br/>`imports` (imports.fields.netWeight)<br/>`other` (other.fields.netWeight)<br/>`other` (other.fields.netWeight)<br/>`weighbridge` (weighbridge.fields.netWeight)<br/>`weighbridge` (weighbridge.fields.netWeight) |
| "مؤسسة الرمال السريعة" | 23 | Identical string "مؤسسة الرمال السريعة" occurs in multiple semantic contexts with distinct keys (imports.labels.txt_1e149b, entityResolution.labels.txt_1e149b). | `imports` (imports.labels.txt_1e149b)<br/>`imports` (imports.labels.txt_1e149b)<br/>`imports` (imports.labels.txt_1e149b)<br/>`imports` (imports.labels.txt_1e149b)<br/>`entityResolution` (entityResolution.labels.txt_1e149b)<br/>`entityResolution` (entityResolution.labels.txt_1e149b)<br/>`entityResolution` (entityResolution.labels.txt_1e149b)<br/>`entityResolution` (entityResolution.labels.txt_1e149b)<br/>`entityResolution` (entityResolution.labels.txt_1e149b)<br/>`entityResolution` (entityResolution.labels.txt_1e149b)<br/>`entityResolution` (entityResolution.labels.txt_1e149b) |
| "المادة" | 22 | Identical string "المادة" occurs in multiple semantic contexts with distinct keys (dashboard.labels.material_2, entityResolution.labels.material_3, imports.labels.material_2, legacyMigration.labels.material_2, pricing.labels.material_2, reports.labels.material, loading.fields.material, loading.labels.material_2, unloading.labels.material, weighbridge.labels.material, other.labels.material_10, other.fields.material_3, reports.fields.material_3). | `dashboard` (dashboard.labels.material_2)<br/>`entityResolution` (entityResolution.labels.material_3)<br/>`imports` (imports.labels.material_2)<br/>`legacyMigration` (legacyMigration.labels.material_2)<br/>`pricing` (pricing.labels.material_2)<br/>`reports` (reports.labels.material)<br/>`loading` (loading.fields.material)<br/>`loading` (loading.labels.material_2)<br/>`unloading` (unloading.labels.material)<br/>`weighbridge` (weighbridge.labels.material)<br/>`other` (other.labels.material_10)<br/>`other` (other.fields.material_3)<br/>`other` (other.fields.material_3)<br/>`other` (other.fields.material_3)<br/>`imports` (imports.labels.material_2)<br/>`reports` (reports.fields.material_3) |
| "أ ب ج 1234" | 19 | Identical string "أ ب ج 1234" occurs in multiple semantic contexts with distinct keys (other.labels.txt_5045a4, entityResolution.fields.txt_5045a4, trips.labels.txt_5045a4, legacyMigration.labels.txt_5045a4). | `other` (other.labels.txt_5045a4)<br/>`entityResolution` (entityResolution.fields.txt_5045a4)<br/>`other` (other.labels.txt_5045a4)<br/>`other` (other.labels.txt_5045a4)<br/>`other` (other.labels.txt_5045a4)<br/>`trips` (trips.labels.txt_5045a4)<br/>`legacyMigration` (legacyMigration.labels.txt_5045a4)<br/>`legacyMigration` (legacyMigration.labels.txt_5045a4)<br/>`legacyMigration` (legacyMigration.labels.txt_5045a4)<br/>`legacyMigration` (legacyMigration.labels.txt_5045a4) |

## 5. High-Risk Hotspots & Special Cases

- **Concatenated Strings (`+`):** 9
- **Template Literals (`${...}`):** 627
- **Interpolation Placeholders (`{...}`):** 232
- **Mixed Numbers & Units:** 961
- **Currency String Usages:** 383
- **Unit String Usages:** 731
- **Protected Business Field Matches:** 304

## 6. Safety & Non-Destructive Invariance Confirmation

- **No Code Modifications:** Zero application strings were rewritten or modified.
- **No Calling `t()` across app:** No automated codemod was executed.
- **Business Logic Invariance:** Pricing, reports, weighbridge, offline, and state machines are 100% untouched.
- **Deterministic Reproducibility:** Every catalog run generates identical keys and hashes.
