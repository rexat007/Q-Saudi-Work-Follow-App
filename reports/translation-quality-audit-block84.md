# BLOCK 84 — LIGHTWEIGHT TRANSLATION QUALITY AUDIT REPORT

**Execution Timestamp:** 2026-09-14T10:04:25.179Z  
**Audit Scope:** Focused Linguistic & Terminology Quality Review  
**Audit Status:** **NEEDS REVIEW**  

---

## 1. Executive Summary & Invariants Check

A non-destructive, read-only quality audit was performed across all **1,128 translation keys** in the Arabic (`ar`), English (`en`), and Urdu (`ur`) localization dictionaries.

### Invariant Verification Checklist:
- [x] **Catalog Key Counts:** Exactly **1,128 keys per locale** (`AR: 1,128`, `EN: 1,128`, `UR: 1,128`). Zero keys added, deleted, or renamed.
- [x] **Interpolation Tokens:** Standardized across all 3 languages ({count}, {name}, etc.).
- [x] **No Code/Data Modifications:** Production code, routes, schemas, pricing logic, and state machines remain 100% untouched.

---

## 2. Automatic Quality Signals Breakdown

| Category | Severity | Issues Found | Context & Problem Summary |
| :--- | :---: | :---: | :--- |
| **Interpolation Token Mismatch** | **P1** | 0 | Token structure is identical across all 3 locales. |
| **English Language Leakage in English Dictionary** | **P2** | 1 | English dictionary string contains stray Arabic characters (`navigation.labels.trips`). |
| **Untranslated English / Mixed Text in Urdu** | **P2** | 8 | Urdu dictionary contains raw English strings or mixed Arabic prefixes. |
| **Overly Long Menu Strings** | **P3** | 8 | Navigation strings that exceed 80 characters and may require flex-wrap layout protection. |

---

## 3. Shortlisted Linguistic Findings (Max 50 High-Confidence Issues)


### 1. `navigation.labels.projects`
- **Severity:** `P3` | **Classification:** `CONTEXT_DEPENDENT` | **Locale:** `AR`
- **Production Context:** Main Navigation / System Header / Top Menu Bar
- **Current Translations:**
  - **AR:** `المعمارية الهندسية الصارمة لمنظومة النقل الثقيل والمشاريع متعددة الأطراف (Multi-Project)`
  - **EN:** `Rigorous Enterprise Architecture for Heavy Transport & Multi-Party Projects (Multi-Project)`
  - **UR:** `ہیوی ٹرانسپورٹ اور ملٹی پارٹی منصوبوں کا جامع تکنیکی ڈھانچہ (Multi-Project)`
- **Identified Problem:** Unusually long Arabic string in navigation menu item creates potential truncation or text wrapping risk on mobile screens.
- **Recommended Wording Direction:** Ensure layout uses flexible flex-wrap or tooltip truncation on mobile viewports.
- **Confidence:** `HIGH`

---

### 2. `navigation.labels.trips`
- **Severity:** `P2` | **Classification:** `NEEDS_REVIEW` | **Locale:** `UR`
- **Production Context:** Main Navigation / System Header / Top Menu Bar
- **Current Translations:**
  - **AR:** `محرك الرحلات (Trip Engine)`
  - **EN:** `محرك Trips (Trip Engine)`
  - **UR:** `محرك ٹرپس (Trip Engine)`
- **Identified Problem:** Urdu dictionary key contains Arabic prefix "محرك" combined with raw English "Trip Engine".
- **Recommended Wording Direction:** Use pure Urdu phrasing: "ٹرپ انجن (Trip Engine)".
- **Confidence:** `HIGH`

---

### 3. `navigation.labels.txt_17c5e1`
- **Severity:** `P3` | **Classification:** `CONTEXT_DEPENDENT` | **Locale:** `AR`
- **Production Context:** Main Navigation / System Header / Top Menu Bar
- **Current Translations:**
  - **AR:** `هذه المبادئ الـ 12 هي السقف الهندسي الحاكم لكامل المنظومة. لا يُسمح بأي استثناء أو خرق لأي مبدأ في أي مرحلة تطويرية أو كود تنفيذي.`
  - **EN:** `These 12 principles serve as the governing architectural ceiling for the entire platform. No exception or violation of any principle is permitted at any development stage or executive code.`
  - **UR:** `یہ 12 اصول پورے پلیٹ فارم کے لیے حاکم تکنیکی چھت ہیں۔ کسی بھی ترقیاتی مرحلے یا انتظامی کوڈ میں کسی اصول کی استثنا یا خلاف ورزی کی اجازت نہیں ہے۔`
- **Identified Problem:** Unusually long Arabic string in navigation menu item creates potential truncation or text wrapping risk on mobile screens.
- **Recommended Wording Direction:** Ensure layout uses flexible flex-wrap or tooltip truncation on mobile viewports.
- **Confidence:** `HIGH`

---

### 4. `navigation.labels.txt_23bdd6`
- **Severity:** `P3` | **Classification:** `CONTEXT_DEPENDENT` | **Locale:** `AR`
- **Production Context:** Main Navigation / System Header / Top Menu Bar
- **Current Translations:**
  - **AR:** `اختر أي كيان لاستعراض ارتباطاته الدقيقة، درجة التعددية (Cardinality)، وواجبات التحقق الخادومية الصارمة.`
  - **EN:** `Select any entity to inspect cardinality and server validation invariants.`
  - **UR:** `کسی بھی ادارے کو منتخب کر کے اس کے باہمی روابط اور توثیقی شرائط دیکھیں۔`
- **Identified Problem:** Unusually long Arabic string in navigation menu item creates potential truncation or text wrapping risk on mobile screens.
- **Recommended Wording Direction:** Ensure layout uses flexible flex-wrap or tooltip truncation on mobile viewports.
- **Confidence:** `HIGH`

---

### 5. `navigation.labels.txt_791f1b`
- **Severity:** `P3` | **Classification:** `CONTEXT_DEPENDENT` | **Locale:** `AR`
- **Production Context:** Main Navigation / System Header / Top Menu Bar
- **Current Translations:**
  - **AR:** `كل ارتباط بين كيانين يتم التحقق منه خادومياً داخل الـ Transactions في Firestore ولا يُترك القرار للواجهة الأمامية مطلقاً.`
  - **EN:** `كل ارتباط بين كيانين يتم التحقق منه خادومياً داخل الـ Transactions في Firestore ولا يُترك القرار للواجهة الأمامية مطلقاً.`
  - **UR:** `كل ارتباط بين كيانين يتم التحقق منه خادومياً داخل الـ Transactions في Firestore ولا يُترك القرار للواجهة الأمامية مطلقاً.`
- **Identified Problem:** Unusually long Arabic string in navigation menu item creates potential truncation or text wrapping risk on mobile screens.
- **Recommended Wording Direction:** Ensure layout uses flexible flex-wrap or tooltip truncation on mobile viewports.
- **Confidence:** `HIGH`

---

### 6. `materials.labels.materials_2`
- **Severity:** `P2` | **Classification:** `NEEDS_REVIEW` | **Locale:** `UR`
- **Production Context:** Production Application Surface
- **Current Translations:**
  - **AR:** `materials`
  - **EN:** `materials`
  - **UR:** `materials`
- **Identified Problem:** Untranslated English string leakage in Urdu dictionary where native Urdu text is expected.
- **Recommended Wording Direction:** Translate English label into standard Urdu script (e.g. کیریئر / مال بردار / پروجیکٹس).
- **Confidence:** `HIGH`

---

### 7. `navigation.labels.projectReports`
- **Severity:** `P3` | **Classification:** `CONTEXT_DEPENDENT` | **Locale:** `AR`
- **Production Context:** Main Navigation / System Header / Top Menu Bar
- **Current Translations:**
  - **AR:** `تنظيم وثائق المشروع داخل المجلد الجذري مع ثلاثة مجلدات فرعية مخصصة للملفات المستوردة والتقارير والمستندات القابلة للطباعة:`
  - **EN:** `Organize project documents within the root folder with three subfolders dedicated to imported files, reports, and printable documents:`
  - **UR:** `درآمد شدہ فائلوں، رپورٹس اور پرنٹ کے قابل دستاویزات کے لیے وقف تین ذیلی فولڈرز کے ساتھ روٹ فولڈر کے اندر پروجیکٹ دستاویزات کو منظم کریں:`
- **Identified Problem:** Unusually long Arabic string in navigation menu item creates potential truncation or text wrapping risk on mobile screens.
- **Recommended Wording Direction:** Ensure layout uses flexible flex-wrap or tooltip truncation on mobile viewports.
- **Confidence:** `HIGH`

---

### 8. `offline.labels.projects`
- **Severity:** `P2` | **Classification:** `NEEDS_REVIEW` | **Locale:** `UR`
- **Production Context:** Production Application Surface
- **Current Translations:**
  - **AR:** `projects`
  - **EN:** `projects`
  - **UR:** `projects`
- **Identified Problem:** Untranslated English string leakage in Urdu dictionary where native Urdu text is expected.
- **Recommended Wording Direction:** Translate English label into standard Urdu script (e.g. کیریئر / مال بردار / پروجیکٹس).
- **Confidence:** `HIGH`

---

### 9. `offline.labels.trips`
- **Severity:** `P2` | **Classification:** `NEEDS_REVIEW` | **Locale:** `UR`
- **Production Context:** Production Application Surface
- **Current Translations:**
  - **AR:** `trips`
  - **EN:** `trips`
  - **UR:** `trips`
- **Identified Problem:** Untranslated English string leakage in Urdu dictionary where native Urdu text is expected.
- **Recommended Wording Direction:** Translate English label into standard Urdu script (e.g. کیریئر / مال بردار / پروجیکٹس).
- **Confidence:** `HIGH`

---

### 10. `other.labels.carrier_10`
- **Severity:** `P2` | **Classification:** `NEEDS_REVIEW` | **Locale:** `UR`
- **Production Context:** Projects Setup & Master Data Management
- **Current Translations:**
  - **AR:** `carrier`
  - **EN:** `carrier`
  - **UR:** `carrier`
- **Identified Problem:** Untranslated English string leakage in Urdu dictionary where native Urdu text is expected.
- **Recommended Wording Direction:** Translate English label into standard Urdu script (e.g. کیریئر / مال بردار / پروجیکٹس).
- **Confidence:** `HIGH`

---

### 11. `other.labels.carrier_7`
- **Severity:** `P2` | **Classification:** `NEEDS_REVIEW` | **Locale:** `ALL`
- **Production Context:** Projects Setup & Master Data Management
- **Current Translations:**
  - **AR:** `الناقل التابع له (Driver → Carrier):`
  - **EN:** `Associated Carrier (Driver → Carrier):`
  - **UR:** `منسلک کیریئر (Driver → Carrier):`
- **Identified Problem:** Potential domain terminology conflict: key refers to carrier (ناقل) but translation mentions driver (سائق).
- **Recommended Wording Direction:** Maintain strict distinction between Carrier (الناقل / شركة النقل) and Driver (السائق).
- **Confidence:** `HIGH`

---

### 12. `other.labels.carrier_8`
- **Severity:** `P2` | **Classification:** `NEEDS_REVIEW` | **Locale:** `UR`
- **Production Context:** Projects Setup & Master Data Management
- **Current Translations:**
  - **AR:** `Carrier`
  - **EN:** `Carrier`
  - **UR:** `Carrier`
- **Identified Problem:** Untranslated English string leakage in Urdu dictionary where native Urdu text is expected.
- **Recommended Wording Direction:** Translate English label into standard Urdu script (e.g. کیریئر / مال بردار / پروجیکٹس).
- **Confidence:** `HIGH`

---

### 13. `other.labels.enterprise`
- **Severity:** `P2` | **Classification:** `NEEDS_REVIEW` | **Locale:** `UR`
- **Production Context:** Production Application Surface
- **Current Translations:**
  - **AR:** `Enterprise`
  - **EN:** `Enterprise`
  - **UR:** `Enterprise`
- **Identified Problem:** Untranslated English string leakage in Urdu dictionary where native Urdu text is expected.
- **Recommended Wording Direction:** Translate English label into standard Urdu script (e.g. کیریئر / مال بردار / پروجیکٹس).
- **Confidence:** `HIGH`

---

### 14. `other.labels.trip_3`
- **Severity:** `P2` | **Classification:** `NEEDS_REVIEW` | **Locale:** `UR`
- **Production Context:** Production Application Surface
- **Current Translations:**
  - **AR:** `TRIP`
  - **EN:** `TRIP`
  - **UR:** `TRIP`
- **Identified Problem:** Untranslated English string leakage in Urdu dictionary where native Urdu text is expected.
- **Recommended Wording Direction:** Translate English label into standard Urdu script (e.g. کیریئر / مال بردار / پروجیکٹس).
- **Confidence:** `HIGH`

---

### 15. `projects.labels.materials`
- **Severity:** `P2` | **Classification:** `NEEDS_REVIEW` | **Locale:** `UR`
- **Production Context:** Projects Setup & Master Data Management
- **Current Translations:**
  - **AR:** `Materials`
  - **EN:** `Materials`
  - **UR:** `Materials`
- **Identified Problem:** Untranslated English string leakage in Urdu dictionary where native Urdu text is expected.
- **Recommended Wording Direction:** Translate English label into standard Urdu script (e.g. کیریئر / مال بردار / پروجیکٹس).
- **Confidence:** `HIGH`

---

### 16. `projects.labels.projects`
- **Severity:** `P2` | **Classification:** `NEEDS_REVIEW` | **Locale:** `UR`
- **Production Context:** Projects Setup & Master Data Management
- **Current Translations:**
  - **AR:** `projects`
  - **EN:** `projects`
  - **UR:** `projects`
- **Identified Problem:** Untranslated English string leakage in Urdu dictionary where native Urdu text is expected.
- **Recommended Wording Direction:** Translate English label into standard Urdu script (e.g. کیریئر / مال بردار / پروجیکٹس).
- **Confidence:** `HIGH`

---

### 17. `trips.labels.trips_3`
- **Severity:** `P2` | **Classification:** `NEEDS_REVIEW` | **Locale:** `UR`
- **Production Context:** Production Application Surface
- **Current Translations:**
  - **AR:** `trips`
  - **EN:** `trips`
  - **UR:** `trips`
- **Identified Problem:** Untranslated English string leakage in Urdu dictionary where native Urdu text is expected.
- **Recommended Wording Direction:** Translate English label into standard Urdu script (e.g. کیریئر / مال بردار / پروجیکٹس).
- **Confidence:** `HIGH`

---

### 18. `weighbridge.labels.txt_504ae8`
- **Severity:** `P2` | **Classification:** `NEEDS_REVIEW` | **Locale:** `UR`
- **Production Context:** Weighbridge Scale Scale Operator View
- **Current Translations:**
  - **AR:** `0.00 كجم`
  - **EN:** `0.00 KG`
  - **UR:** `0.00 KG`
- **Identified Problem:** Untranslated English string leakage in Urdu dictionary where native Urdu text is expected.
- **Recommended Wording Direction:** Translate English label into standard Urdu script (e.g. کیریئر / مال بردار / پروجیکٹس).
- **Confidence:** `HIGH`

---

### 19. `weighbridge.labels.txt_6e06f6`
- **Severity:** `P2` | **Classification:** `NEEDS_REVIEW` | **Locale:** `UR`
- **Production Context:** Weighbridge Scale Scale Operator View
- **Current Translations:**
  - **AR:** `37,400 كجم (37.4 طن)`
  - **EN:** `37,400 KG (37.4 TON)`
  - **UR:** `37,400 KG (37.4 TON)`
- **Identified Problem:** Untranslated English string leakage in Urdu dictionary where native Urdu text is expected.
- **Recommended Wording Direction:** Translate English label into standard Urdu script (e.g. کیریئر / مال بردار / پروجیکٹس).
- **Confidence:** `HIGH`


---

## 4. Final Quality Gate Summary

```text
Translation Audit = NEEDS REVIEW
AR = 1,128
EN = 1,128
UR = 1,128
High-confidence issues = 19
```
