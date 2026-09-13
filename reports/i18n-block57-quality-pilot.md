# BLOCK 57 — Professional Translation Quality Pilot Report

**Status:** COMPLETE ✅  
**Date:** 2026-09-13T08:51:16.698Z  
**Target:** 50 Highest-Priority Quality Defects (EN/UR only)  
**Arabic Canonical Source:** 100% Intact & Untouched  

---

## 1. Discrepancy Reconciliation (BLOCK 56 Quality Queue)

Before commencing pilot repairs, the quality queue counts from BLOCK 56 were rigorously audited and reconciled:

- **Reported Problematic Total:** `1,052`
- **Sum of Rows in Domain Table:** `1,054`
- **Sum of Recommended Batches:** `1,052`
- **Discrepancy:** Exactly **2 entries** (`1,054 - 1,052 = 2`)

### Identification of the 2 Discrepant Keys:
1. **`offline.labels.pricing`** (`قواعد التسعير (Pricing Rules)`): Referenced in `OutboxDrawer.tsx` and `useDomainMeta.ts`. Counted under the `pricing` domain and the `offline` domain in raw domain tables.
2. **`projects.labels.pricing_2`**: Referenced in project wizard and rate sheets. Counted under both `pricing` and `projects` in raw domain tables.

### Reconciliation Resolution:
In the BLOCK 56 markdown report, BATCH-05 was defined as:
```
pricing (3) + reports (2) + projects (162) + offline (118) = 285 keys
```
However, BATCH-05 was recorded as **283 keys** because the 2 cross-domain pricing keys were deduplicated during batch formulation.
Summing the deduplicated batches:
```
178 (Batch 1) + 307 (Batch 2) + 172 (Batch 3) + 112 (Batch 4) + 283 (Batch 5) = 1,052 unique keys
```
The true unique count of problematic keys is therefore **1,052**, and no keys were lost or silently discarded.

---

## 2. Executive Pilot Summary

| Metric | Before Pilot (Block 56) | Repaired in Pilot (Block 57) | Remaining Quality Queue |
|---|---|---|---|
| **Category D (Literal / Hybrid Morphology)** | **34** | **34 (100% eliminated)** | **0** |
| **Category B (Mixed Arabic in EN/UR)** | **666** | **11** | **655** |
| **Category C (Untranslated / Fallback)** | **352** | **5** | **347** |
| **Category A (Acceptable / Professional)** | **63** | **+50** | **113** |
| **Total Referenced Keys** | **1,115** | **50** | **1,115** |

- **Review Status:** All 50 repaired entries are explicitly marked `reviewStatus = "REVIEW_REQUIRED"`. Zero entries were automatically marked `APPROVED`.
- **Interpolation Parameters:** 100% preserved verbatim (`${params.truckId}`).
- **Protected Business Codes:** Preserved (`IN_TRANSIT`, `ARRIVED`, `COMPLETED`, `PENDING`, `LOADED`, `ACTIVE`, `Upsert`, `Outbox`, `Service Account Credentials`, `Carrier Settlements`, `Admin Commit`, `Pricing Rules`, `Security Audit`).
- **Arabic Source Text:** Completely unchanged.

---

## 3. Catalog of Repaired 50 Pilot Entries

| # | Key | Domain | Arabic Source | Repaired English (EN) | Repaired Urdu (UR) | Problem Type |
|---|---|---|---|---|---|---|
| 1 | `carriers.labels.materialsProject` | projects | حدد الناقلين المصرح لهم بنقل وتوريد المواد في هذا المشروع (مثل Carrier A، Carrier B، Carrier C). | Select authorized carriers to transport and supply materials for this project (e.g. Carrier A, Carrier B, Carrier C). | اس منصوبے کے لیے مواد کی ترسیل کے مجاز کیریئرز کا انتخاب کریں (مثلاً Carrier A، Carrier B، Carrier C)۔ | hybrid_morphology |
| 2 | `carriers.labels.txt_4ef914` | projects | تنبيهات بيانات الناقلين: | Carrier Data Alerts: | کیریئر ڈیٹا الرٹس: | hybrid_morphology |
| 3 | `carriers.labels.txt_5ee946` | projects | الخطوة 3: شركات النقل والناقلين المعتمدين (Carriers) | Step 3: Transport Companies & Approved Carriers (Carriers) | مرحلہ 3: ٹرانسپورٹ کمپنیاں اور منظور شدہ کیریئرز (Carriers) | hybrid_morphology |
| 4 | `dashboard.labels.txt_45844d` | dashboard | لوحة أداء ومطابقة الناقلين (Carrier Performance) | Carrier Performance & Reconciliation Dashboard (Carrier Performance) | کیریئر کی کارکردگی اور مفاہمت کا ڈیش بورڈ (Carrier Performance) | hybrid_morphology |
| 5 | `dashboard.labels.txt_553cd5` | dashboard | كافة الناقلين | All Carriers | تمام کیریئرز | hybrid_morphology |
| 6 | `dashboard.status.txt_4f5139` | dashboard | مكتملة (Completed) | Completed | مکمل | hybrid_morphology |
| 7 | `entityResolution.labels.txt_3b4a4b` | entityResolution | سيناريوهات جاهزة: | Predefined Scenarios: | تیار شدہ منظرنامے: | hybrid_morphology |
| 8 | `entityResolution.labels.txt_c5e3f3` | entityResolution | قم بتجربة أي قيمة نصية أو اضغط على أحد السيناريوهات الجاهزة لاختبار سلوك المحرك وتطبيقه الدقيق للقواعد. | Enter any text value or select a predefined scenario to test engine behavior and precise rule enforcement. | انجن کے طرز عمل اور قواعد کے درست نفاذ کو جانچنے کے لیے کوئی بھی متنی قدر درج کریں یا تیار منظرنامے پر کلک کریں۔ | hybrid_morphology |
| 9 | `exceptions.labels.refreshTrip` | exceptions | تحديث سجل الرحلة بنسخة قديمة متضاربة مع النسخة المحفوظة بالخادم | Updating trip record with an outdated copy that conflicts with the server version | ٹرپ کے ریکارڈ کو پرانی کاپی سے اپ ڈیٹ کرنا جو سرور کے ورژن سے متصادم ہے | hybrid_morphology |
| 10 | `exceptions.labels.status_2` | exceptions | تم تسجيل 3 سجلات تدقيق غير قابلة للتعديل عند (الإنشاء، بدء المراجعة، والاعتماد) مع تسجيل الحالة السابقة واللاحقة | 3 immutable audit records logged at (Creation, Review Start, and Approval) with previous and next status tracking | 3 غیر متبدل آڈٹ لاگز (تخلیق، جائزہ شروع، اور منظوری) پر پچھلی اور اگلی حالت کے ساتھ محفوظ کیے گئے | hybrid_morphology |
| 11 | `legacyMigration.labels.txt_505cc5` | legacyMigration | جاهزة للترحيل | Ready for Migration | منتقلی کے لیے تیار | hybrid_morphology |
| 12 | `loading.labels.pricing_6` | loading | أمثلة التسعير المطلوبة نصاً في البرومبت: | Required pricing examples specified in prompt: | پرامپٹ میں مطلوبہ قیمت کے نمونے: | hybrid_morphology |
| 13 | `navigation.labels.project_6` | projects | معاينة رحلات المشروع المسقطة (جاهزة للإسقاط بالـ Upsert) | Preview mapped project trips (Ready for Upsert) | منصوبے کے میپ شدہ ٹرپس کا پیش نظارہ (Upsert کے لیے تیار) | hybrid_morphology |
| 14 | `navigation.status.txt_4c0b8d` | offline | فتح صندوق العمليات المعلقة (Outbox) وإعدادات عدم الاتصال ومحاكاة الشبكة | Open pending operations outbox (Outbox), offline settings, and network simulation | زیر التواء آپریشنز آؤٹ باکس (Outbox)، آف لائن ترتیبات اور نیٹ ورک سیمولیشن کھولیں | hybrid_morphology |
| 15 | `offline.labels.truck_2` | offline | الشاحنة (${params.truckId}) غير متوفرة أو معطلة في الذاكرة المحلية | Truck (${params.truckId}) is unavailable or disabled in local storage | ٹرک (${params.truckId}) مقامی اسٹوریج میں دستیاب نہیں یا غیر فعال ہے | hybrid_morphology |
| 16 | `offline.labels.txt_262349` | offline | الناقلين (Carriers) | Carriers | کیریئرز | hybrid_morphology |
| 17 | `offline.labels.txt_499f33` | offline | السائقين (Drivers) | Drivers | ڈرائیورز | hybrid_morphology |
| 18 | `offline.status.closeTrip` | offline | إغلاق العملية المعلقة واعتبار الرحلة في حالتها النهائية المسجلة خادومياً. | Close pending operation and treat trip in its final server-recorded state. | زیر التواء آپریشن کو بند کریں اور ٹرپ کو سرور پر درج حتمی حالت میں شمار کریں۔ | hybrid_morphology |
| 19 | `offline.status.trip` | offline | تعارض: الرحلة مكتملة ومغلقة بالفعل على الخادم | Conflict: Trip is already completed and closed on server | تنازعہ: ٹرپ سرور پر پہلے ہی مکمل اور بند ہے | hybrid_morphology |
| 20 | `offline.status.txt_60598f` | offline | لا توجد تعارضات معلقة في النظام حالياً | No pending conflicts currently in the system | اس وقت سسٹم میں کوئی زیر التواء تنازعات نہیں ہیں | hybrid_morphology |
| 21 | `other.labels.drivers_4` | shared | السائقون الميدانيون المرخصون والمربوطون بالناقلين. | Licensed field drivers associated with carriers. | کیریئرز کے ساتھ منسلک لائسنس یافتہ فیلڈ ڈرائیورز۔ | hybrid_morphology |
| 22 | `other.labels.materialsTrucks` | shared | كل مشروع يحتوي فقط على المواد والنواقل المصرح لهم به رسمياً، وتتبعهم الشاحنات والسائقين. | Each project includes only officially authorized materials and carriers, followed by trucks and drivers. | ہر منصوبہ صرف باضابطہ مجاز مواد اور کیریئرز پر مشتمل ہوتا ہے، جس کے بعد ٹرک اور ڈرائیورز آتے ہیں۔ | hybrid_morphology |
| 23 | `other.labels.txt_24c076` | shared | جاهزية حساب الخدمة وحقوق الوصول السحابية (Service Account Credentials) | Service Account Credentials & Cloud Access Readiness (Service Account Credentials) | سروس اکاؤنٹ کریڈنشلز اور کلاؤڈ رسائی کی تیاری (Service Account Credentials) | hybrid_morphology |
| 24 | `other.labels.txt_4a65bf` | shared | كشف مطابقات الناقلين (Carrier Settlements) | Carrier Settlements Statement (Carrier Settlements) | کیریئر تصفیہ جات کی مفاہمت کی تفصیلات (Carrier Settlements) | hybrid_morphology |
| 25 | `other.status.txt_671eeb` | shared | النشطة فقط (ACTIVE) | Active Only (ACTIVE) | صرف فعال (ACTIVE) | hybrid_morphology |
| 26 | `projects.labels.notesProject` | projects | يرجى تصحيح الملاحظات التالية في بيانات المشروع: | Please correct the following notes in project data: | برائے مہربانی منصوبے کے ڈیٹا میں درج ذیل نوٹس درست کریں: | hybrid_morphology |
| 27 | `projects.labels.project_8` | projects | حالة المشروع مطلوبة | Project status is required | منصوبے کی حالت درکار ہے | hybrid_morphology |
| 28 | `projects.labels.txt_1f839a` | projects | حدد المستخدمين المصرح لهم بالدخول إلى المشروع، مع تعيين الأدوار التشغيلية (مدير، مأمور حركة، مدقق مالي). | Select users authorized to access the project and assign operational roles (Manager, Dispatcher, Financial Auditor). | منصوبے تک رسائی کے مجاز صارفین کا انتخاب کریں اور آپریشنل کردار تفویض کریں (منیجر، ڈسپیچر، مالیاتی آڈیٹر)۔ | hybrid_morphology |
| 29 | `projects.labels.txt_484b31` | projects | الخطوة 5: إدارة صلاحيات المستخدمين والوصول للمشروع (Project Access) | Step 5: User Permissions and Project Access Management (Project Access) | مرحلہ 5: صارف کے اختیارات اور منصوبے تک رسائی کا انتظام (Project Access) | hybrid_morphology |
| 30 | `projects.labels.txt_6f43c8` | projects | قائمة المستخدمين والتحكم في الوصول | User List & Access Control | صارفین کی فہرست اور رسائی کا کنٹرول | hybrid_morphology |
| 31 | `trips.status.txt_4c5ffa` | trips | مكتملة ومسواة (COMPLETED) | Completed & Settled (COMPLETED) | مکمل اور طے شدہ (COMPLETED) | hybrid_morphology |
| 32 | `trips.status.txt_6e12f5` | trips | مكتملة ومستلمة (COMPLETED) | Completed & Received (COMPLETED) | مکمل اور وصول شدہ (COMPLETED) | hybrid_morphology |
| 33 | `unloading.status.txt_2c78c0` | unloading | مكتملة ومفرغة بالكامل (COMPLETED) | Fully Completed & Discharged (COMPLETED) | مکمل اور مکمل طور پر خالی شدہ (COMPLETED) | hybrid_morphology |
| 34 | `weighbridge.labels.weighbridge_5` | weighbridge | جميع الصفوف مطابقة لبروفايل الميزان وجاهزة للاعتماد الفوري. | All rows match the weighbridge profile and are ready for immediate approval. | تمام قطاریں وزنی پل کے پروفائل سے مماثل ہیں اور فوری منظوری کے لیے تیار ہیں۔ | hybrid_morphology |
| 35 | `dashboard.labels.continue` | dashboard | رصد ومتابعة مؤشرات الحركة، الأوزان، التسويات التعاقدية، ولوحة البوابات المباشرة مع عزل أمني صارم للمشاريع. | Monitor traffic indicators, tonnages, contractual settlements, and live gate panels with strict project isolation. | منصوبوں کی سخت سیکیورٹی تنہائی کے ساتھ نقل و حرکت، وزن، معاہداتی تصفیے اور لائیو گیٹس ڈیش بورڈ کی نگرانی کریں۔ | arabic_in_en |
| 36 | `dashboard.labels.continue_2` | dashboard | متابعة فورية ومباشرة للشاحنات عبر موازين التحميل، الترحيل الميداني، والتفريغ في المواقع | Direct real-time tracking of trucks across loading weighbridges, field dispatch, and site unloading | لوڈنگ وزنی پلوں، فیلڈ ڈسپیچ اور سائٹ ان لوڈنگ کے ذریعے ٹرکوں کی فوری براہ راست نگرانی | arabic_in_en |
| 37 | `unloading.labels.confirmTruck` | unloading | تأكيد وصول الشاحنة (IN_TRANSIT ➔ ARRIVED) | Confirm Truck Arrival (IN_TRANSIT ➔ ARRIVED) | ٹرک کی آمد کی تصدیق کریں (IN_TRANSIT ➔ ARRIVED) | arabic_in_en |
| 38 | `exceptions.labels.ambiguous` | exceptions | رحلة غامضة أو غير محددة | Ambiguous or Unassigned Trip | غیر واضح یا غیر متعین ٹرپ | arabic_in_en |
| 39 | `loading.labels.carrier_2` | loading | رمز الناقل: | Carrier Code: | کیریئر کوڈ: | arabic_in_en |
| 40 | `navigation.labels.projects` | projects | المعمارية الهندسية الصارمة لمنظومة النقل الثقيل والمشاريع متعددة الأطراف (Multi-Project) | Rigorous Enterprise Architecture for Heavy Transport & Multi-Party Projects (Multi-Project) | ہیوی ٹرانسپورٹ اور ملٹی پارٹی منصوبوں کا جامع تکنیکی ڈھانچہ (Multi-Project) | arabic_in_en |
| 41 | `legacyMigration.status.txt_1d98ed` | legacyMigration | تم اعتماد وترحيل البيانات بنجاح! | Data approved and migrated successfully! | ڈیٹا کامیابی سے منظور اور منتقل ہو گیا! | arabic_in_en |
| 42 | `legacyMigration.labels.confirm` | legacyMigration | تأكيد وترحيل السجلات (Admin Commit) | Confirm & Commit Records (Admin Commit) | ریکارڈز کی توثیق اور منتقلی (Admin Commit) | arabic_in_en |
| 43 | `navigation.labels.txt_3fe43d` | shared | التدقيق الأمني والحوكمة (Security Audit) | Security Audit & Governance (Security Audit) | سیکیورٹی آڈٹ اور گورننس (Security Audit) | untranslated_description |
| 44 | `dashboard.labels.download` | dashboard | تم التحميل (LOADED) | Loaded (LOADED) | لوڈ ہو گیا (LOADED) | untranslated_description |
| 45 | `dashboard.labels.pricing_2` | dashboard | نوع التسعير | Pricing Type | قیمت کی قسم | untranslated_description |
| 46 | `dashboard.labels.truckDriver` | dashboard | الشاحنة والسائق | Truck & Driver | ٹرک اور ڈرائیور | arabic_in_en |
| 47 | `dashboard.labels.projectMaterial` | dashboard | المشروع والمادة | Project & Material | منصوبہ اور مواد | arabic_in_en |
| 48 | `dashboard.labels.txt_11cccb` | dashboard | بانتظار الوصول | Awaiting Arrival | آمد کا انتظار | untranslated_description |
| 49 | `dashboard.labels.txt_12bb4c` | dashboard | المستحق التعاقدي | Contractual Entitlement | معاہداتی واجبات | untranslated_description |
| 50 | `weighbridge.labels.importWeighbridge` | weighbridge | استيراد بيانات الميزان (Weighbridge Import) | Import Weighbridge Data (Weighbridge Import) | وزنی پل کا ڈیٹا درآمد کریں (Weighbridge Import) | arabic_in_en |

---

## 4. Verification & Validation Summary

- **I18N-QUALITY-05 (No accidental Arabic fragments in repaired EN):** PASSED ✅
- **I18N-QUALITY-06 (No accidental Arabic fragments in repaired UR):** PASSED ✅
- **I18N-QUALITY-07 (No hybrid morphology):** PASSED ✅
- **I18N-QUALITY-08 (Semantic meaning preserved):** PASSED ✅
- **I18N-QUALITY-09 (Protected tokens preserved):** PASSED ✅
- **I18N-QUALITY-10 (Interpolation preserved):** PASSED ✅
- **I18N-QUALITY-11 (Only selected pilot entries changed):** PASSED ✅
