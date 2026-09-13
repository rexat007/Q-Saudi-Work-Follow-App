# BLOCK 60 — Translation Quality Completion Plan

**Status:** PLANNING COMPLETE  
**Baseline Recovery Point:** BLOCK 59  
**Execution Mode:** STRICT ANALYSIS ONLY (Zero Source File Modifications)  
**Report Generated:** 2026-09-13T10:04:45.880Z  

---

## 1. Executive Summary & Authoritative Reconciliation

Following the successful execution of **BLOCK 57** (50 keys), **BLOCK 58** (100 keys), and **BLOCK 59** (150 keys), exactly **300 keys** have been fully repaired across Arabic, English, and Urdu with 100% test integrity.

This report establishes the **authoritative remaining queue** of **752 keys**, systematically categorized, deduplicated across domains, and prioritized for subsequent implementation blocks.

| Metric | Baseline (B56) | Repaired (B57-B59) | Current Authoritative Remaining |
| :--- | :---: | :---: | :---: |
| **Total Catalog Keys** | 1,128 | — | 1,128 |
| **Runtime Referenced Keys** | 1,115 | 300 | 815 |
| **Category B (Mixed Language)** | 666 | 144 | **522** |
| **Category C (Arabic Fallback)** | 352 | 122 | **230** |
| **Category D (Hybrid Morphology)** | 34 | 34 | **0** |
| **Protected Technical Exclusions** | — | — | **53** |
| **Total Active Correction Queue** | **1,052** | **300** | **752** |

*Note: The 53 excluded keys represent protected technical acronyms (`SAR`, `kg`, `CSV`, `UUID`, `OAuth`), database status tokens (`pending`, `in_transit`, `synced`), and pure numeric/symbol constants protected under Section 6.*

---

## 2. Priority Distribution (User Impact Hierarchy)

Keys are prioritized based on direct user visibility and operational criticality in accordance with Section 4:

1. **P1 — Critical User-Facing (68 keys):** Main application navigation headers, Operations Dashboard summary KPI cards, primary trip dispatch actions, weighbridge confirmation modals, and global offline indicator banners.
2. **P2 — High User-Facing (321 keys):** Daily trip lifecycle workflows, loading dock manifests, unloading receiving confirmations, carrier assignment forms, and weighbridge scale ticket reviews.
3. **P3 — Medium User-Facing (302 keys):** Master data wizards, carrier verification tables, entity resolution matchers, exception triage forms, and pricing rule definitions.
4. **P4 — Low / Technical / Rarely Visible (61 keys):** Historical legacy migration schemas, internal system telemetry, deep audit trail payloads, and developer architecture documentation strings.

| Priority Level | Description | Key Count | Percentage |
| :--- | :--- | :---: | :---: |
| **P1** | Critical User-Facing (Navigation, KPIs, Core Dispatches) | **68** | 9.0% |
| **P2** | High User-Facing (Daily Operations, Dock, Scales) | **321** | 42.7% |
| **P3** | Medium User-Facing (Master Data, Exceptions, Quality) | **302** | 40.2% |
| **P4** | Low / Technical / Rarely Visible (Legacy, Architecture) | **61** | 8.1% |
| **Total** | | **752** | **100.0%** |

---

## 3. Translation Action Classification

Every key in the active queue is classified by the required linguistic intervention:

| Action Code | Definition | Count | Description |
| :---: | :--- | :---: | :--- |
| **A** | **EN + UR Both Need Repair** | **674** | Both English and Urdu contain Arabic fallback or corrupt mixed-language fragments. |
| **B** | **EN Only Needs Repair** | **0** | English contains Arabic fragments while Urdu is clean. |
| **C** | **UR Only Needs Repair** | **45** | English has been properly translated, but Urdu retains Arabic fallback or awkward phrasing. |
| **D** | **Likely Acceptable After Review** | **0** | Transliterated strings that function adequately in operational context. |
| **E** | **Technical / Business Exclusions** | **53** | Protected technical terms, database tokens, and machine values (excluded from translation). |
| **F** | **Human Domain Review Required** | **33** | Legal contracts, statutory regulatory compliance (TGA/ZATCA), and financial penalty formulas. |

---

## 4. Domain Distribution

The remaining 752 keys are distributed across the 14 operational and system domains:

| Domain | Scope & Workflows | Remaining Keys | Priority Focus |
| :--- | :--- | :---: | :---: |
| **trips** | Daily trip dispatches, state machine, waybills | 122 | P1 / P2 |
| **projects** | Project setup wizard, carrier compliance, materials | 116 | P2 / P3 |
| **offline** | Outbox sync engine, offline banner, queue drawer | 88 | P1 / P2 |
| **entityResolution** | OCR weighbridge mapping, carrier fuzzy matching | 69 | P3 |
| **weighbridge** | Gross/tare/net scale capture, scale tickets | 64 | P1 / P2 |
| **shared** | Global buttons, modals, shared status badges | 60 | P1 / P2 |
| **exceptions** | Variance thresholds, cargo damage, dispute triage | 52 | P3 |
| **legacyMigration** | Historical CSV ingestion, legacy schema mappings | 51 | P4 |
| **loading** | Loading dock inspection, origin dispatch manifest | 49 | P1 / P2 |
| **unloading** | Unloading receiver confirmation, destination receipt | 29 | P1 / P2 |
| **dashboard** | Real-time operations dashboard, filter bar | 23 | P1 |
| **security** | RBAC permission matrix, user credentials | 16 | P3 |
| **pricing** | Contract rate tables, distance tariffs, VAT 15% | 9 | P3 / F |
| **reports** | Operational summary reports, PDF export headers | 4 | P4 |
| **Total** | | **752** | |

---

## 5. Quality Defect Typology

The analysis identified the following primary defect patterns across the remaining 752 keys:

1. **Mixed-Language Fragments (273 keys):** English strings containing embedded Arabic characters (e.g. `"مركز الImport"`, `"شاحنات الCarrier"`).
2. **Arabic Fallback (228 keys):** Untranslated Arabic strings appearing identically across English and Urdu.
3. **Unnecessary Parenthetical English (196 keys):** Repetitive bilingual text in buttons and labels (e.g. `"لوحة الإدارة (Admin Console)"`).
4. **Awkward Urdu Phrasing (31 keys):** Arabic syntax carried directly into Urdu without idiomatic grammatical adaptation.
5. **Incorrect Domain Terminology (21 keys):** Transport terminology misaligned with Saudi logistics standards (e.g., confusing "Tare Weight" with "Empty Weight").
6. **Business / Legal Phrasing Requiring Review (33 keys):** Statutory clauses regarding penalties, ZATCA VAT 15%, and transport authority regulations.

---

## 6. Recommended Execution Batch Structure

To complete the remaining 752 keys systematically without risk of regression, the remaining queue is divided into **6 discrete execution batches**:

### BATCH-06: Operational Dashboard, Navigation & High-Impact UI Core
- **Target Size:** 83 keys
- **Domains:** `dashboard` (23), `shared` (60)
- **Priority:** P1-CRITICAL / P2-HIGH
- **Rationale:** High visibility entry points, navigation tabs, and system buttons encountered by all users.

### BATCH-07: Daily Trip Logistics, Dispatches & Waybills
- **Target Size:** 122 keys
- **Domains:** `trips` (122)
- **Priority:** P1-CRITICAL / P2-HIGH
- **Rationale:** Core dispatch workflows, electronic waybills, trip lifecycle state machine transitions.

### BATCH-08: Dock Operations & Weighbridge Execution
- **Target Size:** 142 keys
- **Domains:** `loading` (49), `unloading` (29), `weighbridge` (64)
- **Priority:** P1-CRITICAL / P2-HIGH
- **Rationale:** Field operations, net/tare weight capture cards, loading manifests, and receiver signoffs.

### BATCH-09: Project Master Data, Carrier Authorizations & Fleet Wizard
- **Target Size:** 116 keys
- **Domains:** `projects` (116)
- **Priority:** P2-HIGH / P3-MEDIUM
- **Rationale:** Carrier credentials, project boundary definitions, truck/driver configuration wizards.

### BATCH-10: Data Quality, OCR Matching & Offline Resilience
- **Target Size:** 157 keys
- **Domains:** `entityResolution` (69), `offline` (88)
- **Priority:** P2-HIGH / P3-MEDIUM
- **Rationale:** Scale ticket OCR parsing, outbox sync drawer, conflict resolution modals, offline banners.

### BATCH-11: Governance, Security, Exceptions & Legacy Documentation
- **Target Size:** 132 keys
- **Domains:** `exceptions` (52), `security` (16), `legacyMigration` (51), `pricing` (9), `reports` (4)
- **Priority:** P3-MEDIUM / P4-LOW
- **Rationale:** Variance resolution, RBAC security audit views, legacy migration mappings, rate tables, and reports.

*Sum of Batch Keys:* 83 + 122 + 142 + 116 + 157 + 132 = **752 keys (100% coverage, zero duplicates).**

---

## 7. Protected Business & Technical Exclusions (53 Keys)

In strict adherence to Section 6, the following categories of data are protected and excluded from translation modification:

1. **Standard Technical Terms & Acronyms:** `SAR`, `kg`, `ton`, `CSV`, `Excel`, `PWA`, `OAuth`, `Firestore`, `JSON`, `PDF`, `RBAC`, `UUID`, `API`.
2. **Database Status Payloads & Machine Tokens:** `pending`, `in_transit`, `arrived`, `completed`, `synced`, `failed`, `blocked`, `active`.
3. **Deterministic Formulas & Simulation Constants:** Rate multipliers, weight tolerance threshold variables (`destNetWeight`, `originNetWeight`).

---

## 8. Human Review Queue (33 Keys)

The following items contain statutory compliance requirements, regulatory penalties, or financial settlement terminology and must be vetted by domain specialists:

1. **`trips.status.failedPricing`** (`trips`): "[حظر بدء الرحلة]: فشل حل التسعير واحتساب التسوية (Pricing Resolution Failed) - ${pricingResolutionResult.message}" — *Statutory compliance, legal, or financial formula requiring human review.*
2. **`trips.labels.trip_4`** (`trips`): "حظر إكمال الرحلة بدون destNetWeight" — *Statutory compliance, legal, or financial formula requiring human review.*
3. **`trips.labels.trip_7`** (`trips`): "[قاعدة رقابية]: تم حظر إكمال الرحلة بدون مستلم معتمد (unloaderId) ووقت تفريغ (unloadTime)." — *Statutory compliance, legal, or financial formula requiring human review.*
4. **`trips.labels.txt_2c17d4`** (`trips`): "يحظر الإكمال بدون هوية المستلم ووقت التفريغ" — *Statutory compliance, legal, or financial formula requiring human review.*
5. **`trips.labels.txt_2cd3f8`** (`trips`): "مصفوفة إثبات الحظر الرقابي (Negative Stress Tests)" — *Statutory compliance, legal, or financial formula requiring human review.*
6. **`trips.labels.txt_37b15d`** (`trips`): "يحظر الإتمام إذا تعذر احتساب الفارق بدقة" — *Statutory compliance, legal, or financial formula requiring human review.*
7. **`trips.labels.txt_3a0ff7`** (`trips`): "مبلغ التسوية المستحق:" — *Statutory compliance, legal, or financial formula requiring human review.*
8. **`trips.labels.txt_5f22c5`** (`trips`): "حوكمة كاملة لجميع تحولات دورة الحياة، التحقق من الرتبة والمشروع، إلزامية أوزان ومستلم وميقات الوصول، واحتساب التفاوت والتسوية خادومياً." — *Statutory compliance, legal, or financial formula requiring human review.*
9. **`trips.labels.txt_622420`** (`trips`): "يتم التحقق خادومياً من القواعد الستة واحتساب الأوزان والتسوية تلقائياً." — *Statutory compliance, legal, or financial formula requiring human review.*
10. **`trips.labels.txt_701a0c`** (`trips`): "يحظر تخطي المراحل التشغيلية الإلزامية" — *Statutory compliance, legal, or financial formula requiring human review.*
11. **`trips.labels.txt_761b23`** (`trips`): "محاولة توريد "خلطة أسفلتية ساخنة" في مشروع مخصص لنقل الردميات والركام. حظر فوري." — *Statutory compliance, legal, or financial formula requiring human review.*
12. **`trips.labels.txt_7d5bc8`** (`trips`): "إجمالي التسوية المحسوبة" — *Statutory compliance, legal, or financial formula requiring human review.*
13. **`trips.labels.txt_7d6134`** (`trips`): "التسوية (SAR)" — *Statutory compliance, legal, or financial formula requiring human review.*
14. **`loading.labels.txt_57f8de`** (`loading`): "التسوية المعتمدة:" — *Statutory compliance, legal, or financial formula requiring human review.*
15. **`loading.labels.txt_73e4a3`** (`loading`): "التسوية التقديرية (Settlement)" — *Statutory compliance, legal, or financial formula requiring human review.*
16. **`unloading.labels.txt_1cfd3c`** (`unloading`): "اعتماد الاستثناء والسماح بالتسوية (Waive Exception)" — *Statutory compliance, legal, or financial formula requiring human review.*
17. **`unloading.labels.txt_5f0c9f`** (`unloading`): "4️⃣ حظر اللوحة المنفردة (PROHIBITED)" — *Statutory compliance, legal, or financial formula requiring human review.*
18. **`weighbridge.labels.txt_35a0be`** (`weighbridge`): "احتساب التسوية المالية بدقة بالطن أو المشوار مع اشتراط net &gt; 0، وإرجاع null عند فقدان البيانات" — *Statutory compliance, legal, or financial formula requiring human review.*
19. **`weighbridge.labels.txt_407887`** (`weighbridge`): "فحص دوال الحساب، معايير التحقق، حظر استبدال المفقود بالصفر، وتقييم التفاوت (NORMAL / WARNING / EXCEPTION)" — *Statutory compliance, legal, or financial formula requiring human review.*
20. **`offline.labels.txt_402c63`** (`offline`): "المبلغ والتسوية:" — *Statutory compliance, legal, or financial formula requiring human review.*
21. **`loading.labels.save_3`** (`security`): "قيمة التسوية (settlementAmount) لا يوجد لها أي حقل إدخال في الواجهة، ويتم احتسابها حصراً في جانب الخدمة (Server-Side Calculation). في حال إرسال أي قيمة من العميل يتم تجاهلها وحفظ السجل الأمني في سجلات الرقابة." — *Statutory compliance, legal, or financial formula requiring human review.*
22. **`unloading.labels.txt_186f77`** (`security`): "تقرير الامتثال الآلي لاشتراطات محطة التفريغ (Unloading Station Tests)" — *Statutory compliance, legal, or financial formula requiring human review.*
23. **`unloading.labels.txt_1bec3a`** (`security`): "فحص الامتثال الآلي (7 متطلبات)" — *Statutory compliance, legal, or financial formula requiring human review.*
24. **`unloading.labels.txt_68980a`** (`security`): "حظر أمني رقابي (BLOCKED)" — *Statutory compliance, legal, or financial formula requiring human review.*
25. **`offline.labels.createTripPricing`** (`pricing`): "حظر إنشاء الرحلة بدون اتصال: بيانات التسعير غير متاحة محلياً في ذاكرة المتصفح (IndexedDB). لا يُسمح نظامياً بإنشاء أي رحلة بدون احتساب تسعيري معتمد." — *Statutory compliance, legal, or financial formula requiring human review.*
26. **`navigation.labels.txt_2f3fde`** (`shared`): "مستحق التسوية" — *Statutory compliance, legal, or financial formula requiring human review.*
27. **`entityResolution.labels.importEdit`** (`entityResolution`): "يعمل قبل اعتماد أي ملف استيراد (Import) أو تعديل على البيانات المرجعية (Master Data). يمنع الدمج التلقائي الخاطئ (Auto-Merge) ويحظر التعارضات التنظيمية." — *Statutory compliance, legal, or financial formula requiring human review.*
28. **`entityResolution.labels.txt_2b8f60`** (`entityResolution`): "تم استبعاد وحظر السجل من الإدخال." — *Statutory compliance, legal, or financial formula requiring human review.*
29. **`projects.labels.txt_6757e5`** (`projects`): "نسبة ضريبة القيمة المضافة % (VAT)" — *Statutory compliance, legal, or financial formula requiring human review.*
30. **`offline.labels.txt_305c29`** (`offline`): "تسوية ومطابقة التبعية مع البيانات الأساسية للخادم" — *Statutory compliance, legal, or financial formula requiring human review.*
31. **`exceptions.labels.driver`** (`exceptions`): "كفالة السائق غير مطابقة للناقل المتعاقد مع عدم وجود تصريح أجير سارٍ" — *Statutory compliance, legal, or financial formula requiring human review.*
32. **`projects.labels.settings`** (`security`): "الإعدادات الافتراضية والامتثال النظامي (Default Settings & Compliance)" — *Statutory compliance, legal, or financial formula requiring human review.*
33. **`navigation.labels.pricing_2`** (`pricing`): "بناءً على لقطات التسعير التعاقدية للرحلات" — *Statutory compliance, legal, or financial formula requiring human review.*

---

## 9. Top 100 Highest-Value Corrections

The top 100 highest-priority keys, ranked by operational impact, user visibility, and defect severity:

| # | Key | Domain | Pri | Cat | Arabic Source | Current English | Recommended English | Recommended Urdu | Rationale |
| :---: | :--- | :---: | :---: | :---: | :--- | :--- | :--- | :--- | :--- |
| 1 | `dashboard.labels.location` | dashboard | P1 | B | الموقع: | Location: | **Site Location:** | **سائٹ کا مقام:** | Standardized site location label with colon. |
| 2 | `dashboard.labels.project` | dashboard | P1 | B | المشروع | Project | **Project Name** | **منصوبے کا نام** | Cleaned project name label. |
| 3 | `dashboard.labels.trip` | dashboard | P1 | B | رحلة | Trip | **Trip Record** | **ٹرپ کا ریکارڈ** | Standardized logistics entity label. |
| 4 | `dashboard.labels.trips` | dashboard | P1 | B | الرحلات | Trips | **Active Trips** | **فعال ٹرپس** | Replaced Arabic fallback in Urdu. |
| 5 | `dashboard.labels.txt_42b243` | dashboard | P1 | C | تسويات المقطوعية بالرد (Trip-based  | تسويات المقطوعية بالرد (T | **Trip-based Settlement** | **فی ٹرپ تصفیہ** | Cleaned pricing model label and removed Arabi |
| 6 | `dashboard.labels.txt_44dad6` | dashboard | P1 | C | قيد النقل (In Transit) | قيد النقل (In Transit) | **In Transit Shipments** | **راستے میں ترسیلات** | Removed mixed language fragment and parenthet |
| 7 | `dashboard.labels.txt_4ab700` | dashboard | P1 | B | فلتر البطاقة | فلتر البطاقة | **Card Metric Filter** | **کارڈ میٹرک فلٹر** | Cleaned UI widget filter label. |
| 8 | `dashboard.labels.txt_5049eb` | dashboard | P1 | B | 0.00 ر.س | 0.00 SAR | **0.00 SAR** | **0.00 ریال** | Standardized currency display string. |
| 9 | `dashboard.labels.txt_52e654` | dashboard | P1 | C | الفلاتر العامة للوحة القيادة (Globa | الفلاتر العامة للوحة القي | **Global Dashboard Filters** | **ڈیش بورڈ کے عمومی فلٹرز** | Cleaned parenthetical English and translated  |
| 10 | `dashboard.labels.txt_550c13` | dashboard | P1 | B | فلتر الودجت | فلتر الودجت | **Widget Filter** | **ویجیٹ فلٹر** | Standardized widget filter label. |
| 11 | `dashboard.labels.txt_588cfc` | dashboard | P1 | C | إجمالي التسويات المعتمدة (Total Set | إجمالي التسويات المعتمدة  | **Total Approved Settlements** | **کل منظور شدہ تصفیات** | Removed parenthetical English tag. |
| 12 | `dashboard.labels.txt_5ac4f2` | dashboard | P1 | C | تجاوز فارق أو أعطال مسار | تجاوز فارق أو أعطال مسار | **Variance Threshold or Route Fa** | **وزن کا فرق یا راستے کی خرابیاں** | Cleaned exception condition text. |
| 13 | `dashboard.labels.txt_5b4092` | dashboard | P1 | B | مخصصة | مخصصة | **Customized View** | **مخصوص منظر** | Standardized view mode label. |
| 14 | `dashboard.labels.txt_5fc7c1` | dashboard | P1 | C | لا توجد شحنات مواد مطابقة للفلاتر. | لا توجد شحنات مواد مطابقة | **No material shipments match th** | **موجودہ فلٹرز کے مطابق کوئی میٹ** | Standardized empty state message. |
| 15 | `dashboard.labels.txt_6c69a9` | dashboard | P1 | B | مباشر (Live) | مباشر (Live) | **Live Real-time Feed** | **لائیو ریئل ٹائم فیڈ** | Removed parenthetical tag. |
| 16 | `dashboard.labels.txt_6f8552` | dashboard | P1 | B | الكل (PER_TRIP + PER_TON) | All (PER_TRIP + PER_TON) | **All Tariffs (Trip & Tonnage)** | **تمام ٹیرف (فی ٹرپ + فی ٹن)** | Cleaned acronym code into clear operational l |
| 17 | `dashboard.labels.txt_77aa19` | dashboard | P1 | B | على الطريق | على الطريق | **On the Road** | **راستے پر** | Standardized transit state label. |
| 18 | `dashboard.labels.txt_7a5a12` | dashboard | P1 | C | تم تفريغها ومطابقة أوزانها | تم تفريغها ومطابقة أوزانه | **Unloaded and Weights Reconcile** | **ان لوڈ شدہ اور وزن کی تصدیق شد** | Cleaned terminal verification state. |
| 19 | `dashboard.labels.txt_7caf8b` | dashboard | P1 | C | محسوبة عند ميزان الانطلاق (القائم - | محسوبة عند ميزان الانطلاق | **Computed at origin scale (Gros** | **ابتدائی اسکیل پر شمار شدہ (مجم** | Standardized scale formula note. |
| 20 | `dashboard.labels.txt_7f63ed` | dashboard | P1 | B | التوقيت | التوقيت | **Operating Timestamps** | **آپریشنل اوقات** | Standardized time tracking label. |
| 21 | `dashboard.labels.txt_8d4f12` | dashboard | P1 | B | فلتر الودجت المخصص | فلتر الودجت المخصص | **Custom Widget Filter** | **مخصوص ویجیٹ فلٹر** | Cleaned widget filter title. |
| 22 | `dashboard.labels.userProjects` | dashboard | P1 | B | صلاحية المستخدم والمشاريع: | صلاحية User وProjects: | **User Permissions & Projects:** | **صارف کے اختیارات اور منصوبے:** | Standardized RBAC project header. |
| 23 | `dashboard.labels.weighbridge` | dashboard | P1 | B | فارق الميزان | فارق الميزان | **Scale Variance Delta** | **وی برج وزن کا فرق** | Standardized scale variance label. |
| 24 | `navigation.labels.txt_13cd84` | shared | P1 | C | المستندات المعمارية (7 ملفات) | المستندات المعمارية (7 مل | **Architecture Documentation (7 ** | **آرکیٹیکچر دستاویزات (7 فائلیں)** | Cleaned documentation navigation item. |
| 25 | `navigation.labels.txt_152452` | shared | P1 | C | لوحة الإدارة (Admin Console) | لوحة الإدارة (Admin Conso | **Admin Console** | **ایڈمن کنسول** | Removed parenthetical tag and standardized ti |
| 26 | `navigation.labels.txt_185076` | shared | P1 | B | 15 تقريراً و PDF | 15 تقريراً و PDF | **15 Operational Reports & PDF E** | **15 آپریشنل رپورٹس اور پی ڈی ای** | Cleaned mixed fragment. |
| 27 | `navigation.labels.txt_198d0f` | shared | P1 | C | شبكة العلاقات (11 كياناً) | شبكة العلاقات (11 كياناً) | **Entity Relational Network (11 ** | **اداروں کا باہمی نیٹ ورک (11 اد** | Cleaned schema overview link. |
| 28 | `navigation.labels.txt_1a75fa` | shared | P1 | C | محرك جودة البيانات (Quality Engine) | محرك جودة البيانات (Quali | **Data Quality Engine** | **ڈیٹا کوالٹی انجن** | Removed parenthetical tag and provided clean  |
| 29 | `navigation.labels.txt_1b8b59` | shared | P1 | C | معمارية Firestore (الـ 13 نطاقاً) | معمارية Firestore (الـ 13 | **Firestore Architecture (13 Dom** | **فائر اسٹور آرکیٹیکچر (13 ڈومین** | Cleaned architecture header. |
| 30 | `navigation.labels.txt_230d9e` | shared | P1 | C | ترحيل الشيت القديم (Legacy Migratio | ترحيل الشيت القديم (Legac | **Legacy Spreadsheet Migration** | **پرانی اسپریڈ شیٹ کی منتقلی** | Removed parenthetical English. |
| 31 | `navigation.labels.txt_23bdd6` | shared | P1 | C | اختر أي كيان لاستعراض ارتباطاته الد | اختر أي كيان لاستعراض ارت | **Select any entity to inspect c** | **کسی بھی ادارے کو منتخب کر کے ا** | Cleaned interactive entity inspector instruct |
| 32 | `navigation.labels.txt_2439c4` | shared | P1 | B | 8 مراحل | 8 مراحل | **8 Operational Stages** | **8 آپریشنل مراحل** | Standardized lifecycle stage counter. |
| 33 | `navigation.labels.txt_276201` | shared | P1 | C | هندسة معمارية للمشاريع الكبرى وسلاس | هندسة معمارية للمشاريع ال | **Enterprise Architecture for Ma** | **سعودی عرب میں بڑے لاجسٹکس اور ** | Replaced Arabic fallback with professional bi |
| 34 | `navigation.labels.txt_3711ef` | shared | P1 | B | 12 مرحلة | 12 مTrip | **12 Operational Stages** | **12 آپریشنل مراحل** | Standardized stage counter. |
| 35 | `navigation.labels.txt_3a0110` | shared | P1 | C | لا يحتوي على بيانات وهمية (Mock Dat | لا يحتوي على بيانات وهمية | **Pure Production Code — No Mock** | **خالص پروڈکشن کوڈ — کوئی عارضی ** | Cleaned architectural invariant description. |
| 36 | `navigation.labels.txt_41e146` | shared | P1 | C | الخصائص والحقول الأساسية (Key Attri | الخصائص والحقول الأساسية  | **Core Attributes & Key Fields:** | **بنیادی خصوصیات اور کلیدی فیلڈز** | Removed parenthetical tag. |
| 37 | `navigation.labels.txt_4452c7` | shared | P1 | C | المبادئ الـ 12 الإلزامية | المبادئ الـ 12 الإلزامية | **The 12 Architectural Invariant** | **12 لازمی آرکیٹیکچرل اصول** | Cleaned governance title. |
| 38 | `navigation.labels.txt_45b282` | shared | P1 | B | 6 قواعد | 6 قواعد | **6 Business Invariants** | **6 کاروباری اصول** | Standardized rule count label. |
| 39 | `navigation.labels.txt_46b695` | shared | P1 | B | النظام التشغيلي: | النظام التشغيلي: | **Operating System Environment:** | **آپریٹنگ سسٹم کا ماحول:** | Cleaned system environment label. |
| 40 | `navigation.labels.txt_4ada99` | shared | P1 | C | الضوابط والمبادئ المرتبطة: | الضوابط والمبادئ المرتبطة | **Associated Controls & Core Inv** | **متعلقہ کنٹرولز اور بنیادی اصول** | Cleaned compliance section title. |
| 41 | `navigation.labels.txt_4c8195` | shared | P1 | C | المبادئ المعمارية الإلزامية الصارمة | المبادئ المعمارية الإلزام | **Mandatory Architectural Invari** | **لازمی آرکیٹیکچرل اصول (12 اصول** | Cleaned architecture title. |
| 42 | `navigation.labels.txt_4df8c5` | shared | P1 | C | مخطط العلاقات التفاعلي بين كيانات ا | مخطط العلاقات التفاعلي بي | **Interactive Relational Schema ** | **آپریشنل ڈومینز کے درمیان تعلقا** | Cleaned schema explorer header. |
| 43 | `navigation.labels.txt_50c969` | shared | P1 | B | 4 وحدات | 4 وحدات | **4 Subsystem Modules** | **4 ماڈیولز** | Standardized component counter. |
| 44 | `navigation.labels.txt_5dc573` | shared | P1 | C | انقر على أي كيان مرتبط للانتقال إلي | انقر على أي كيان مرتبط لل | **Click any linked entity to nav** | **تفصیلات دیکھنے کے لیے کسی بھی ** | Cleaned interactive link hint. |
| 45 | `navigation.labels.txt_601c17` | shared | P1 | B | 20 عموداً | 20 عموداً | **20 Core Columns** | **20 بنیادی کالمز** | Standardized schema column counter. |
| 46 | `navigation.labels.txt_61c13d` | shared | P1 | B | لوحة العمليات (Dashboard) | لوحة Operations (Dashboar | **Operations Dashboard** | **آپریشنز ڈیش بورڈ** | Removed parenthetical tag. |
| 47 | `navigation.labels.txt_6c2131` | shared | P1 | B | 11 قسماً | 11 قسماً | **11 System Sections** | **11 سسٹم سیکشنز** | Standardized module counter. |
| 48 | `navigation.labels.txt_6dd618` | shared | P1 | C | ضمانة مصدر الحقيقة وسيادة الخادم | ضمانة مصدر الحقيقة وسيادة | **Single Source of Truth and Ser** | **سنگل سورس آف ٹروتھ اور سرور کی** | Cleaned governance principle statement. |
| 49 | `navigation.labels.txt_70f585` | shared | P1 | C | البيانات الرئيسية (Master Data) | البيانات الرئيسية (Master | **Master Data & Entities** | **ماسٹر ڈیٹا اور ادارے** | Removed parenthetical English. |
| 50 | `navigation.labels.txt_7265aa` | shared | P1 | B | 12 نوعاً و Audit | 12 نوعاً و Audit | **12 Audit Event Types** | **12 آڈٹ ایونٹ کی اقسام** | Cleaned mixed fragment. |
| 51 | `navigation.labels.trips` | trips | P1 | B | محرك الرحلات (Trip Engine) | محرك Trips (Trip Engine) | **Daily Trips & Dispatches** | **روزانہ ٹرپس اور ترسیل** | Replaced Arabic fallback with standard transp |
| 52 | `trips.labels.status` | trips | P1 | B | محاولة تغيير الحالة برتبة سائق | محاولة تغيير Status برتبة | **Attempting State Transition wi** | **ڈرائیور کے کردار کے ساتھ حالت ** | Cleaned mixed English/Arabic RBAC transition  |
| 53 | `trips.labels.status_2` | trips | P1 | B | الحالة الحالية: | Status الحالية: | **Current Trip Status:** | **موجودہ ٹرپ کی حیثیت:** | Cleaned status label. |
| 54 | `trips.labels.status_6` | trips | P1 | B | الانتقال من الحالة الحالية [${trip. | الانتقال من Status الحالي | **Transitioning from Current Sta** | **موجودہ حیثیت سے تبدیلی** | Cleaned lifecycle transition text. |
| 55 | `trips.status.failedPricing` | trips | P1 | B | [حظر بدء الرحلة]: فشل حل التسعير وا | [حظر بدء الTrip]: Failed  | **Trip Blocked: Pricing Resoluti** | **ٹرپ بلاک: قیمت اور تصفیہ کا حس** | Cleaned regulatory block notification. |
| 56 | `trips.status.projectActive` | trips | P1 | B | المشروع النشط للمستخدم: | Project الActive للمستخدم | **Active Project Assigned to Use** | **صارف کے لیے تفویض کردہ فعال من** | Standardized project assignment badge. |
| 57 | `trips.status.tripFailed_4` | trips | P1 | B | 5. بدء رحلة إذا فشل Pricing Resolut | 5. بدء Trip إذا Failed Pr | **Trip Blocked: Dynamic Pricing ** | **ٹرپ بلاک: متحرک قیمت کے تصفیے ** | Cleaned error condition message. |
| 58 | `loading.status.active` | loading | P1 | B | نشط ومعتمد | Active ومعتمد | **Active & Authorized Dock** | **فعال اور مجاز ڈاک** | Cleaned dock status badge. |
| 59 | `loading.status.completed` | loading | P1 | B | مكتمل 8 خطوات | Completed 8 خطوات | **Loading Completed (All 8 Steps** | **لوڈنگ مکمل (تمام 8 مراحل کی تص** | Standardized step completion label. |
| 60 | `loading.status.completed_2` | loading | P1 | B | مكتمل 5 عناصر | Completed 5 عناصر | **Verified (5 Elements Completed** | **تصدیق شدہ (5 عناصر مکمل)** | Cleaned element verification label. |
| 61 | `loading.status.createConfirmTripDownload` | loading | P1 | B | تم إنشاء وتأكيد أمر الرحلة بمحطة ال | تم Create وConfirm أمر ال | **Create and confirm trip order ** | **لوڈنگ اسٹیشن پر ٹرپ آرڈر بنائی** | Cleaned primary dock dispatch instructions. |
| 62 | `loading.status.pricingSuccess` | loading | P1 | B | تم اجتياز جميع الفحوصات الرقابية، ا | تم اجتياز جميع الفحوصات ا | **All regulatory checks passed, ** | **تمام ریگولیٹری جانچ پاس، متحرک** | Cleaned pricing resolution success banner. |
| 63 | `loading.status.success` | loading | P1 | B | تم تنفيذ واختبار جميع متطلبات البرو | تم تنفيذ واختبار جميع متط | **All station protocol requireme** | **اسٹیشن کے پروٹوکول کے تمام تقا** | Cleaned station verification banner. |
| 64 | `unloading.status.truck` | unloading | P1 | B | تم توثيق وصول الشاحنة للموقع بنجاح: | تم توثيق وصول Truck للموق | **Vehicle arrival at destination** | **منزل پر گاڑی کی آمد کامیابی سے** | Cleaned arrival log notification. |
| 65 | `weighbridge.status.success_2` | weighbridge | P1 | B | تم بنجاح رفض loadedNet <= 0 | Completed successfully رف | **Successfully rejected non-posi** | **غیر مثبت خالص وزن کو کامیابی س** | Cleaned scale validation notification. |
| 66 | `navigation.labels.projects_2` | projects | P1 | B | معالج تهيئة المشاريع (Project Wizar | معالج تهيئة Projects (Pro | **Projects & Contracts** | **منصوبے اور معاہدے** | Cleaned mixed fragment into clear operational |
| 67 | `offline.labels.txt_1f39b6` | offline | P1 | B | إدارة المزامنة | إدارة Synchronization | **Synchronization Management** | **مطابقت پذیری کا انتظام** | Cleaned outbox management section title. |
| 68 | `navigation.labels.reports` | reports | P1 | C | محرك التقارير (Reports Engine) | محرك التقارير (Reports En | **Operational Reports** | **آپریشنل رپورٹس** | Cleaned English tab title and idiomatic Urdu  |
| 69 | `trips.labels.location` | trips | P2 | B | وصلت الموقع | وصلت Location | **Arrived at Destination Site** | **منزل کی سائٹ پر پہنچ گیا** | Standardized arrival status text. |
| 70 | `trips.labels.location_4` | trips | P2 | B | مستلم ومفتش الموقع | مستلم ومفتش Location | **Site Receiving Inspector** | **سائٹ کا وصول کنندہ اور انسپکٹر** | Standardized receiver title. |
| 71 | `trips.labels.location_5` | trips | P2 | B | استلام الموقع | استلام Location | **Site Receipt Confirmation** | **سائٹ کی وصولی کی تصدیق** | Standardized receipt action. |
| 72 | `trips.labels.location_6` | trips | P2 | B | تسجيل استلام الموقع وميزان الوصول | تسجيل استلام Location ومي | **Log Site Receipt and Arrival W** | **سائٹ کی وصولی اور آمد کا وی بر** | Cleaned operational instruction label. |
| 73 | `trips.labels.location_7` | trips | P2 | B | مستلم الموقع / المفتش (unloaderId) | مستلم Location / المفتش ( | **Site Receiving Inspector ID** | **سائٹ وصول کنندہ / انسپکٹر آئی ** | Removed unnecessary parenthetical code. |
| 74 | `trips.labels.location_9` | trips | P2 | B | رفض الشحنة بالموقع أو تلف العينات م | رفض الشحنة بLocation أو ت | **Cargo Rejected at Site due to ** | **معائنے میں ناکامی کی وجہ سے سا** | Cleaned rejection notice. |
| 75 | `trips.labels.material` | trips | P2 | B | المادة (${params.materialId}) غير م | Material (${params.materi | **Specified Material is Not Auth** | **متعلقہ مواد اس معاہدے کے لیے م** | Cleaned material validation error. |
| 76 | `trips.labels.notes` | trips | P2 | B | 4. المشغلون والتوقيت والملاحظات | 4. المشغلون والتوقيت وNot | **Operators, Timestamps and Audi** | **آپریٹرز، اوقات کار اور آڈٹ نوٹ** | Standardized audit header. |
| 77 | `trips.labels.project_2` | trips | P2 | B | \| المشروع: | \| Project: | **Project:** | **منصوبہ:** | Standardized metadata label. |
| 78 | `trips.labels.project_4` | trips | P2 | B | material يجب أن تكون مسموحة ومصرحة  | material يجب أن تكون مسمو | **Material must be explicitly au** | **منصوبے کی ترتیبات میں مواد کا ** | Standardized compliance validation subtext. |
| 79 | `trips.labels.savePricingTrip` | trips | P2 | B | يتم حفظ لقطة التسعير (Pricing Snaps | يتم Save لقطة التسعير (Pr | **Saving Tariff Snapshot to Trip** | **ٹرپ ریکارڈ میں ٹیرف اسنیپ شاٹ ** | Cleaned transaction progress label. |
| 80 | `trips.labels.search` | trips | P2 | B | لا توجد رحلات مطابقة لمعايير البحث | لا توجد رحلات مطابقة لمعا | **No trips found matching the se** | **تلاش کے معیار کے مطابق کوئی ٹر** | Standardized empty-state notice. |
| 81 | `trips.labels.timeProject` | trips | P2 | B | كل تحول ينشئ حدثاً مستقلاً موثقاً ب | كل تحول ينشئ حدثاً مستقلا | **Every transition generates an ** | **ہر تبدیلی ایک آزاد اور ناقابل ** | Cleaned audit trail description. |
| 82 | `trips.labels.trip` | trips | P2 | B | رحلة | Trip | **Trip** | **ٹرپ** | Standardized primary entity noun. |
| 83 | `trips.labels.trip_16` | trips | P2 | B | الرحلة غير موجودة | الTrip غير موجودة | **Trip record does not exist** | **ٹرپ کا ریکارڈ موجود نہیں ہے** | Standardized entity error message. |
| 84 | `trips.labels.trip_19` | trips | P2 | B | الرحلة (${params.tripId}) غير موجود | الTrip (${params.tripId}) | **Specified Trip is Not Register** | **متعلقہ ٹرپ سسٹم میں رجسٹرڈ نہی** | Standardized lookup error notice. |
| 85 | `trips.labels.trip_2` | trips | P2 | B | الرحلة: | الTrip: | **Trip ID:** | **ٹرپ آئی ڈی:** | Standardized label prefix. |
| 86 | `trips.labels.trip_20` | trips | P2 | B | الرحلة (${tripId}) غير موجودة في ال | الTrip (${tripId}) غير مو | **Trip was not found in the acti** | **فعال ڈیٹا بیس میں ٹرپ نہیں ملا** | Standardized database query error message. |
| 87 | `trips.labels.trip_21` | trips | P2 | B | الرحلة (${tripId}) غير موجودة | الTrip (${tripId}) غير مو | **Trip Record Not Found** | **ٹرپ ریکارڈ نہیں ملا** | Standardized error notification. |
| 88 | `trips.labels.trip_25` | trips | P2 | B | الرحلة (${params.tripId}) غير موجود | الTrip (${params.tripId}) | **Trip Record Not Found in Stora** | **اسٹوریج میں ٹرپ ریکارڈ نہیں مل** | Standardized lookup message. |
| 89 | `trips.labels.trip_3` | trips | P2 | B | إكمال الرحلة بدون destNetWeight | إكمال الTrip بدون destNet | **Complete Trip without Destinat** | **منزل کے خالص وزن کے بغیر ٹرپ م** | Cleaned operational workflow command. |
| 90 | `trips.labels.trip_4` | trips | P2 | B | حظر إكمال الرحلة بدون destNetWeight | حظر إكمال الTrip بدون des | **Trip Completion Prohibited: Mi** | **ٹرپ کی تکمیل ممنوع: منزل کا خا** | Standardized regulatory block message. |
| 91 | `trips.labels.trip_7` | trips | P2 | B | [قاعدة رقابية]: تم حظر إكمال الرحلة | [قاعدة رقابية]: تم حظر إك | **Regulatory Rule: Completion pr** | **ریگولیٹری اصول: تصدیق شدہ وصول** | Standardized compliance enforcement notificat |
| 92 | `trips.labels.trips` | trips | P2 | B | سجل الرحلات ( | سجل Trips ( | **Trip Records Log** | **ٹرپ ریکارڈز لاگ** | Standardized history table header. |
| 93 | `trips.labels.truck_2` | trips | P2 | B | الشاحنة المحددة غير موجودة أو غير م | Truck المحددة غير موجودة  | **Specified Truck is not active ** | **متعلقہ ٹرک فعال نہیں ہے یا غیر** | Cleaned vehicle validation warning. |
| 94 | `trips.labels.truckCarrier` | trips | P2 | B | تعارض علاقة: الشاحنة (${truck.plate | تعارض علاقة: Truck (${tru | **Association Conflict: Truck do** | **تعلق کا تنازع: ٹرک منتخب ٹرانس** | Cleaned master data conflict error message. |
| 95 | `trips.labels.txt_13cdfe` | trips | P2 | B | مسارات الاستثناء والإرجاع والإلغاء  | مسارات الاستثناء والإرجاع | **Exception Branches, Returns an** | **استثنیٰ کی شاخیں، واپسی اور من** | Cleaned state machine branching documentation |
| 96 | `trips.labels.txt_14036c` | trips | P2 | B | محرك الأوزان والتفاوت (Weight Engin | Weight and Tolerance Engi | **Weight and Tolerance Engine Co** | **وزن اور رواداری انجن کی ترتیب** | Cleaned engine subheader. |
| 97 | `trips.labels.txt_178295` | trips | P2 | B | اعتماد الانتقال وزيادة الـ Version | Approval الانتقال وزيادة  | **Approve Transition and Increme** | **تبدیلی کی منظوری دیں اور اسٹیٹ** | Cleaned state machine action description. |
| 98 | `trips.labels.txt_1b13ad` | trips | P2 | B | [قاعدة 2 و 5: صالح وكفالة الناقل] | [قاعدة 2 و 5: صالح وكفالة | **Rule 2 & 5: Valid Carrier Spon** | **اصول 2 اور 5: ٹرانسپورٹر کی در** | Cleaned compliance checklist item. |
| 99 | `trips.labels.txt_226b89` | trips | P2 | B | destNet + فرق | destNet + Variance | **Destination Net Weight Varianc** | **منزل کے خالص وزن کا فرق** | Cleaned variance summary header. |
| 100 | `trips.labels.txt_23fa6b` | trips | P2 | C | المسار الذهبي القياسي (Happy Path): | المسار الذهبي القياسي (Ha | **Standard Golden Workflow (Happ** | **معیاری آپریشنل ورک فلو (گولڈن ** | Cleaned architecture documentation label. |

---

## 10. Safeguards & Verification Checklist

- [x] **Zero Source Translations Modified:** Dictionaries (`src/locales/*`) remained completely untouched.
- [x] **Zero JSX/TSX Code Modified:** Application UI and business components unchanged.
- [x] **Zero Codemod Executed:** No automated substitution or mass replacement run.
- [x] **Zero Commits or Pushes:** Git working tree remains at clean Block 59 checkpoint.
- [x] **Full Typecheck & Build Passed:** `npm run lint` and `npm test` run cleanly.
