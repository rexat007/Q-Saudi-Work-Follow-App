# BLOCK 70 — Corrected Controlled Application of Human-Approved Decisions

## Executive Summary
- **Authoritative Ledger:** `reports/i18n-human-approved-decisions-reconciled.json`
- **Ledger Checksum (SHA-256):** `a64c3b50a5137bd5b614e06426e44fe261638b75081e9c42c1c348b066fe39c9`
- **Application Strategy:** Strict Key-Based Mapping (`ledger.items[n].key` → exact locale key path)
- **Total Ledger Decisions:** 33
  - **REVISE:** 29 (EN + UR updated)
  - **FIX_SOURCE:** 2 (AR parenthetical removed, EN + UR updated)
  - **APPROVE:** 1 (`trips.labels.txt_7d6134` ISO SAR updated)
  - **KEEP_EXCEPTION:** 1 (`trips.labels.txt_761b23` strictly unchanged)
- **Total Modified Keys:** 32 (1 item kept as exception)
- **EN Updates:** 32
- **UR Updates:** 32
- **AR Updates:** 2 (`loading.labels.txt_73e4a3` & `projects.labels.settings`)
- **Unauthorized Keys Changed:** 0
- **Unauthorized Files Changed:** 0

---

## Regression Guard Confirmations
1. `unloading.labels.txt_1cfd3c` → **ONLY** `unloading.labels.txt_1cfd3c` (Waive Exception preserved)
2. `unloading.labels.txt_5f0c9f` → **ONLY** `unloading.labels.txt_5f0c9f` (PROHIBITED preserved)
3. `weighbridge.labels.txt_35a0be` → **ONLY** `weighbridge.labels.txt_35a0be` (`net > 0`, `null` preserved)
4. `weighbridge.labels.txt_407887` → **ONLY** `weighbridge.labels.txt_407887` (`NORMAL`, `WARNING`, `EXCEPTION` preserved)
5. `offline.labels.txt_402c63` → **ONLY** `offline.labels.txt_402c63` (Amount & Settlement)
6. `loading.labels.save_3` → **ONLY** `loading.labels.save_3` (`settlementAmount`, `Server-Side Calculation` preserved)

### Prohibited Pricing Keys (Zero Modification Asserted)
- `pricing.labels.waiveException`: **NOT MODIFIED (0 changes)**
- `pricing.labels.txt_a72c4e`: **NOT MODIFIED (0 changes)**
- `pricing.labels.txt_ac1785`: **NOT MODIFIED (0 changes)**
- `pricing.labels.txt_001d84`: **NOT MODIFIED (0 changes)**
- `pricing.labels.txt_0c8dcf`: **NOT MODIFIED (0 changes)**
- `pricing.labels.txt_523ca0`: **NOT MODIFIED (0 changes)**

---

## Complete Application Audit Table
| # | Exact Key | Domain | Decision | Languages Changed | Protected Tokens Preserved |
|---|-----------|--------|----------|-------------------|----------------------------|
| 1 | `trips.status.failedPricing` | trips | **REVISE** | EN, UR | ${pricingResolutionResult.message}, Pricing Resolution Failed |
| 2 | `trips.labels.trip_4` | trips | **REVISE** | EN, UR | destNetWeight |
| 3 | `trips.labels.trip_7` | trips | **REVISE** | EN, UR | unloaderId, unloadTime |
| 4 | `trips.labels.txt_2c17d4` | trips | **REVISE** | EN, UR | — |
| 5 | `trips.labels.txt_2cd3f8` | trips | **REVISE** | EN, UR | Negative Stress Tests |
| 6 | `trips.labels.txt_37b15d` | trips | **REVISE** | EN, UR | — |
| 7 | `trips.labels.txt_3a0ff7` | trips | **REVISE** | EN, UR | — |
| 8 | `trips.labels.txt_5f22c5` | trips | **REVISE** | EN, UR | — |
| 9 | `trips.labels.txt_622420` | trips | **REVISE** | EN, UR | — |
| 10 | `trips.labels.txt_701a0c` | trips | **REVISE** | EN, UR | — |
| 11 | `trips.labels.txt_761b23` | trips | **KEEP_EXCEPTION** | NONE (EXCEPTION) | "خلطة أسفلتية ساخنة" |
| 12 | `trips.labels.txt_7d5bc8` | trips | **REVISE** | EN, UR | — |
| 13 | `trips.labels.txt_7d6134` | trips | **APPROVE** | EN, UR | SAR |
| 14 | `loading.labels.txt_57f8de` | loading | **REVISE** | EN, UR | — |
| 15 | `loading.labels.txt_73e4a3` | loading | **FIX_SOURCE** | AR, EN, UR | Settlement |
| 16 | `unloading.labels.txt_1cfd3c` | unloading | **REVISE** | EN, UR | Waive Exception |
| 17 | `unloading.labels.txt_5f0c9f` | unloading | **REVISE** | EN, UR | PROHIBITED |
| 18 | `weighbridge.labels.txt_35a0be` | weighbridge | **REVISE** | EN, UR | net > 0, null |
| 19 | `weighbridge.labels.txt_407887` | weighbridge | **REVISE** | EN, UR | NORMAL, WARNING, EXCEPTION |
| 20 | `offline.labels.txt_402c63` | offline | **REVISE** | EN, UR | — |
| 21 | `loading.labels.save_3` | security | **REVISE** | EN, UR | settlementAmount, Server-Side Calculation |
| 22 | `unloading.labels.txt_186f77` | security | **REVISE** | EN, UR | Unloading Station Tests |
| 23 | `unloading.labels.txt_1bec3a` | security | **REVISE** | EN, UR | 7 |
| 24 | `unloading.labels.txt_68980a` | security | **REVISE** | EN, UR | BLOCKED |
| 25 | `offline.labels.createTripPricing` | pricing | **REVISE** | EN, UR | IndexedDB |
| 26 | `navigation.labels.txt_2f3fde` | shared | **REVISE** | EN, UR | — |
| 27 | `entityResolution.labels.importEdit` | entityResolution | **REVISE** | EN, UR | Import, Master Data, Auto-Merge |
| 28 | `entityResolution.labels.txt_2b8f60` | entityResolution | **REVISE** | EN, UR | — |
| 29 | `projects.labels.txt_6757e5` | projects | **REVISE** | EN, UR | VAT, % |
| 30 | `offline.labels.txt_305c29` | offline | **REVISE** | EN, UR | — |
| 31 | `exceptions.labels.driver` | exceptions | **REVISE** | EN, UR | Ajeer |
| 32 | `projects.labels.settings` | security | **FIX_SOURCE** | AR, EN, UR | Default Settings & Compliance |
| 33 | `navigation.labels.pricing_2` | pricing | **REVISE** | EN, UR | — |

---

## FIX_SOURCE Canonical Arabic Transitions
1. **`loading.labels.txt_73e4a3`**
   - **Before:** `التسوية التقديرية (Settlement)`
   - **After:** `التسوية التقديرية`
   - **Removed:** Redundant English parenthetical `(Settlement)`
2. **`projects.labels.settings`**
   - **Before:** `الإعدادات الافتراضية والامتثال النظامي (Default Settings & Compliance)`
   - **After:** `الإعدادات الافتراضية والامتثال النظامي`
   - **Removed:** Redundant English parenthetical `(Default Settings & Compliance)`

---

## Verification Attestation
- **Zero Arabic Glyphs in Updated English:** Verified (0 occurrences)
- **Token Parity:** 100% of declared protected tokens preserved in EN and UR
- **Interpolation Parity:** Exact `${pricingResolutionResult.message}` runtime expression preserved
- **Exception Invariance:** `trips.labels.txt_761b23` retained identical in all locales and test fixtures
