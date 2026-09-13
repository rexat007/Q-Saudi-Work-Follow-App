# BLOCK 58 — Professional Translation Quality Expansion Report

**Execution Date:** 2026-09-13T09:02:01.436Z
**Status:** COMPLETE ✅
**Target Scope:** Maximum 100 translation keys repaired across prioritized operational domains.

## 1. Metrics & Category Reductions

| Category | Before Block 58 | Repaired in Block 58 | Remaining | Status |
|---|:---:|:---:|:---:|:---:|
| **Category B (Mixed Arabic in Target)** | 655 | **82** | **573** | In Progress (Progressive Reduction) |
| **Category C (Untranslated Fallback)** | 347 | **18** | **329** | In Progress (Progressive Reduction) |
| **Category D (Hybrid Morphology)** | 0 | 0 | **0** | **100% ELIMINATED in Block 57** |
| **Total Repaired in Block 58** | - | **100** | - | **100 / 100 Complete** |

## 2. Domain Distribution

| Domain | Count | Primary Operational Scope |
|---|:---:|---|
| `dashboard` | 20 | Tonnage summaries, operational indicators, project compliance, role authorities |
| `trips` | 20 | Dispatch controls, trip status cards, engine security, cancel workflows |
| `loading` | 15 | Station titles, master data checks, pricing rules, preview steps, driver list |
| `unloading` | 15 | Receiving tare/gross weights, variance approvals, server search rules, exception objects |
| `weighbridge` | 15 | Ticket import pipeline, tolerance rules, scale calculations, audit decisions |
| `projects` | 10 | Carrier licensing, contractor authorization, strict dependency validations |
| `offline` | 5 | PWA home screen, exception reporting, dispatch cancellation, server sync conflict |

## 3. Repaired Entries Matrix (100 Keys)

| # | Key | Domain | Cat | Problem Type | Arabic Source (Unchanged) | Repaired English (newEn) | Repaired Urdu (newUr) | Review Status |
|---|---|---|:---:|---|---|---|---|:---:|
| 1 | `dashboard.labels.downloadLocation` | `dashboard` | B | `arabic_in_en` | أوزان التحميل / الموقع | Loading / Site Weights | لوڈنگ / سائٹ کا وزن | `REVIEW_REQUIRED` |
| 2 | `dashboard.labels.download_2` | `dashboard` | C | `untranslated_fallback` | تم التحميل | Loaded | لوڈ ہو گیا | `REVIEW_REQUIRED` |
| 3 | `dashboard.labels.download_3` | `dashboard` | C | `untranslated_fallback` | دقة حساب إجمالي أوزان التحميل والاستلام وفارق الموازين | Accuracy of total loading weights, received weights, and scale variance calculation | کل لوڈنگ وزن، موصولہ وزن اور وزنی پل کے فرق کے حساب کی درستگی | `REVIEW_REQUIRED` |
| 4 | `dashboard.labels.location_2` | `dashboard` | B | `arabic_in_en` | إجمالي أوزان الاستلام بالموقع (Total Received Tons) | Total Site Received Weights (Total Received Tons) | سائٹ پر موصولہ کل وزن (Total Received Tons) | `REVIEW_REQUIRED` |
| 5 | `dashboard.labels.materials_2` | `dashboard` | B | `arabic_in_en` | كافة المواد | All Materials | تمام مٹیریلز | `REVIEW_REQUIRED` |
| 6 | `dashboard.labels.pricing_3` | `dashboard` | C | `untranslated_fallback` | تم توزيع ${matDist.length} مواد، ونموذجي التسعير (PER_TRIP و PER_TON) بنسبة 100%. | ${matDist.length} materials and both pricing models (PER_TRIP and PER_TON) distributed at 100%. | ${matDist.length} مٹیریلز اور دونوں قیمت کے ماڈلز (PER_TRIP اور PER_TON) 100% تقسیم کیے گئے۔ | `REVIEW_REQUIRED` |
| 7 | `dashboard.labels.projects` | `dashboard` | B | `arabic_in_en` | اختباراً لعزل المشاريع وحسابات الأوزان والتسويات. | Tests for project isolation, weight calculations, and settlements. | منصوبوں کی تفریق، وزن کے حسابات اور سیٹلمنٹس کے ٹیسٹ۔ | `REVIEW_REQUIRED` |
| 8 | `dashboard.labels.projects_2` | `dashboard` | B | `arabic_in_en` | إدارة العمليات المركزية - كافة المشاريع | Central Operations Management - All Projects | مرکزی آپریشنز مینجمنٹ - تمام منصوبے | `REVIEW_REQUIRED` |
| 9 | `dashboard.labels.projects_3` | `dashboard` | B | `arabic_in_en` | صلاحية مدير العمليات العام لكافة المشاريع | General Operations Manager authority for all projects | تمام منصوبوں کے لیے جنرل آپریشنز مینیجر کے اختیارات | `REVIEW_REQUIRED` |
| 10 | `dashboard.labels.projects_4` | `dashboard` | B | `arabic_in_en` | تم السماح لمدير العمليات العام بالوصول لـ ${superRes.trips.length} رحلات من مختلف المشاريع بدون حجب. | General Operations Manager granted access to ${superRes.trips.length} trips across various projects without restriction. | جنرل آپریشنز مینیجر کو بغیر کسی پابندی کے مختلف منصوبوں سے ${superRes.trips.length} ٹرپس تک رسائی دی گئی۔ | `REVIEW_REQUIRED` |
| 11 | `dashboard.labels.projects_5` | `dashboard` | B | `arabic_in_en` | نتائج فحص أمان المشاريع وصحة مؤشرات العمليات (Compliance Suite) | Project security scan results and operational indicator health (Compliance Suite) | پروجیکٹ سیکیورٹی اسکین کے نتائج اور آپریشنل اشاریوں کی درستگی (Compliance Suite) | `REVIEW_REQUIRED` |
| 12 | `dashboard.labels.projects_7` | `dashboard` | B | `arabic_in_en` | كافة المشاريع المصرحة | All Authorized Projects | تمام مجاز منصوبے | `REVIEW_REQUIRED` |
| 13 | `dashboard.labels.search` | `dashboard` | B | `arabic_in_en` | لا توجد حركات مسجلة تطابق معايير الفلترة أو البحث الحالية. | No recorded transactions match the current filter or search criteria. | موجودہ فلٹر یا تلاش کے معیار کے مطابق کوئی ریکارڈ شدہ ٹرانزیکشن موجود نہیں ہے۔ | `REVIEW_REQUIRED` |
| 14 | `dashboard.labels.trips_2` | `dashboard` | B | `arabic_in_en` | دقة حساب بطاقات حالات وأعداد الرحلات | Calculation accuracy of trip status cards and counts | ٹرپ کی حالت کے کارڈز اور گنتی کے حساب کی درستگی | `REVIEW_REQUIRED` |
| 15 | `dashboard.labels.txt_1137e3` | `dashboard` | C | `untranslated_fallback` | استثناءات (Exceptions) | Exceptions | استثنیات (Exceptions) | `REVIEW_REQUIRED` |
| 16 | `dashboard.labels.txt_11a6ad` | `dashboard` | C | `untranslated_fallback` | مستوى صلاحيات المدير العام للمنظومة | System General Manager authority level | سسٹم کے جنرل مینیجر کے اختیارات کی سطح | `REVIEW_REQUIRED` |
| 17 | `dashboard.labels.txt_125b36` | `dashboard` | C | `untranslated_fallback` | بطاقات الأوزان وتفاوت الموازين (Tonnage & Weighbridge Variance) | Weight and Scale Variance Cards (Tonnage & Weighbridge Variance) | وزن اور وزنی پل کے فرق کے کارڈز (Tonnage & Weighbridge Variance) | `REVIEW_REQUIRED` |
| 18 | `dashboard.labels.txt_15b1d1` | `dashboard` | C | `untranslated_fallback` | لا توجد بيانات ناقلين مطابقة لمعايير الفلترة الحالية. | No carrier data matches the current filter criteria. | موجودہ فلٹر کے معیار کے مطابق کیریئرز کا کوئی ڈیٹا نہیں ملا۔ | `REVIEW_REQUIRED` |
| 19 | `dashboard.labels.txt_176fe6` | `dashboard` | C | `untranslated_fallback` | مقطوعية بالرد (PER_TRIP) | Fixed rate per trip (PER_TRIP) | فی ٹرپ طے شدہ شرح (PER_TRIP) | `REVIEW_REQUIRED` |
| 20 | `dashboard.labels.txt_18193c` | `dashboard` | C | `untranslated_fallback` | بطاقات التسويات والمستحقات المالية (Financial Settlement - Snapshot Invariance) | Financial Settlements and Dues Cards (Financial Settlement - Snapshot Invariance) | مالی سیٹلمنٹس اور واجبات کے کارڈز (Financial Settlement - Snapshot Invariance) | `REVIEW_REQUIRED` |
| 21 | `trips.labels.cancel` | `trips` | B | `arabic_in_en` | إلغاء ✕ | Cancel ✕ | منسوخ کریں ✕ | `REVIEW_REQUIRED` |
| 22 | `trips.labels.cancelTrip` | `trips` | B | `arabic_in_en` | إلغاء أمر الرحلة كلياً قبل الانطلاق أو بقرار تشغيلي معتمد | Cancel trip order completely before departure or by approved operational decision | روانگی سے قبل یا مجاز آپریشنل فیصلے کے تحت ٹرپ آرڈر کو مکمل منسوخ کریں | `REVIEW_REQUIRED` |
| 23 | `trips.labels.carrier` | `trips` | B | `arabic_in_en` | الناقل (${params.carrierId}) غير مسجل في النظام | Carrier (${params.carrierId}) is not registered in the system | کیریئر (${params.carrierId}) سسٹم میں رجسٹرڈ نہیں ہے | `REVIEW_REQUIRED` |
| 24 | `trips.labels.carrierTruck` | `trips` | B | `arabic_in_en` | الناقل والشاحنة: | Carrier and Truck: | کیریئر اور ٹرک: | `REVIEW_REQUIRED` |
| 25 | `trips.labels.carrier_2` | `trips` | B | `arabic_in_en` | الناقل (${carrier.name}) حالته معطلة (INACTIVE) | Carrier (${carrier.name}) is inactive (INACTIVE) | کیریئر (${carrier.name}) کی حالت غیر فعال ہے (INACTIVE) | `REVIEW_REQUIRED` |
| 26 | `trips.labels.confirm` | `trips` | B | `arabic_in_en` | تأكيد التحول إلى [ | Confirm transition to [ | حالت کی تبدیلی کی تصدیق کریں [ | `REVIEW_REQUIRED` |
| 27 | `trips.labels.confirmBackTruck` | `trips` | B | `arabic_in_en` | تأكيد رجوع الشاحنة إلى الكسارة أو المحجر المصدر. | Confirm truck return to crusher or source quarry. | کرشر یا ماخذ کان میں ٹرک کی واپسی کی تصدیق کریں۔ | `REVIEW_REQUIRED` |
| 28 | `trips.labels.create` | `trips` | B | `arabic_in_en` | تم الإنشاء: | Created: | تخلیق شدہ: | `REVIEW_REQUIRED` |
| 29 | `trips.labels.createTrip` | `trips` | B | `arabic_in_en` | تعذر إنشاء الرحلة لانتهاك قواعد التحقق المعمارية: ${validation.blockingError} | Unable to create trip due to architectural validation violation: ${validation.blockingError} | آرکیٹیکچرل تصدیقی قواعد کی خلاف ورزی کے باعث ٹرپ بنانا ممکن نہیں: ${validation.blockingError} | `REVIEW_REQUIRED` |
| 30 | `trips.labels.createTrip_2` | `trips` | B | `arabic_in_en` | تم إنشاء أمر الرحلة واعتماد تسعير الرد والقواعد الستة | Trip order created, trip pricing approved, and six core rules enforced | ٹرپ کا آرڈر بنا دیا گیا، ٹرپ کی قیمت منظور کر دی گئی اور چھ بنیادی قواعد نافذ کر دیے گئے | `REVIEW_REQUIRED` |
| 31 | `trips.labels.create_2` | `trips` | B | `arabic_in_en` | تعذر إنشاء واعتماد الشحنة بمحطة التحميل: ${validation.blockingError} | Unable to create and approve shipment at loading station: ${validation.blockingError} | لوڈنگ اسٹیشن پر شپمنٹ بنانا اور منظور کرنا ممکن نہیں: ${validation.blockingError} | `REVIEW_REQUIRED` |
| 32 | `trips.labels.download` | `trips` | C | `untranslated_fallback` | تم التحميل (LOADED) | Loaded (LOADED) | لوڈ ہو گیا (LOADED) | `REVIEW_REQUIRED` |
| 33 | `trips.labels.downloadTrips` | `trips` | B | `arabic_in_en` | انقر على أي سيناريو أدناه لتحميل بياناته فوراً وملاحظة سلوك محرك الرحلات في القبول أو الحظر: | Click any scenario below to load its data immediately and observe the trip engine behavior in accepting or blocking: | اس کا ڈیٹا فوری لوڈ کرنے اور منظوری یا روک تھام میں ٹرپ انجن کا رویہ دیکھنے کے لیے نیچے دیے گئے کسی بھی منظر نامے پر کلک کریں: | `REVIEW_REQUIRED` |
| 34 | `trips.labels.downloadWeighbridge` | `trips` | B | `arabic_in_en` | مشغل محطة التحميل والميزان | Loading Station and Scale Operator | لوڈنگ اسٹیشن اور وزنی پل آپریٹر | `REVIEW_REQUIRED` |
| 35 | `trips.labels.download_2` | `trips` | C | `untranslated_fallback` | تحميل واختبار السيناريو | Load and Test Scenario | منظر نامہ لوڈ اور ٹیسٹ کریں | `REVIEW_REQUIRED` |
| 36 | `trips.labels.download_3` | `trips` | C | `untranslated_fallback` | تحميل واختبار سيناريو الأمان الرقابي | Load and Test Regulatory Security Scenario | نگرانی کے سیکیورٹی منظر نامے کو لوڈ اور ٹیسٹ کریں | `REVIEW_REQUIRED` |
| 37 | `trips.labels.driver` | `trips` | B | `arabic_in_en` | السائق (driverId) | Driver (driverId) | ڈرائیور (driverId) | `REVIEW_REQUIRED` |
| 38 | `trips.labels.driverDownload` | `trips` | B | `arabic_in_en` | مثال: محاولة السائق اعتماد التحميل أو الاستلام | Example: Driver attempting to approve loading or receipt | مثال: ڈرائیور کی طرف سے لوڈنگ یا وصولی کی منظوری کی کوشش | `REVIEW_REQUIRED` |
| 39 | `trips.labels.driverMaterial` | `trips` | B | `arabic_in_en` | السائق والمادة | Driver and Material | ڈرائیور اور مٹیریل | `REVIEW_REQUIRED` |
| 40 | `trips.labels.editTrip_2` | `trips` | B | `arabic_in_en` | لا يمكن تعديل حالة الرحلة لأنها مقفلة ومفوترة نهائياً | Trip status cannot be edited because it is locked and finally invoiced | ٹرپ کی حالت میں ترمیم نہیں کی جا سکتی کیونکہ یہ بند اور حتمی طور پر انوائس ہو چکی ہے | `REVIEW_REQUIRED` |
| 41 | `loading.labels.carrier_4` | `loading` | B | `arabic_in_en` | شاحنات أسطول الناقل التابعة للمشروع | Carrier fleet trucks assigned to the project | پروجیکٹ سے منسلک کیریئر کے بیڑے کے ٹرکس | `REVIEW_REQUIRED` |
| 42 | `loading.labels.confirm` | `loading` | B | `arabic_in_en` | تأكيد وترحيل الشحنة مع التحقق الخادومي المباشر | Confirm and dispatch shipment with direct server-side verification | براہ راست سرور کی توثیق کے ساتھ شپمنٹ کی تصدیق اور روانگی | `REVIEW_REQUIRED` |
| 43 | `loading.labels.confirm_4` | `loading` | B | `arabic_in_en` | تسلسل المحرك بعد التأكيد: | Engine sequence after confirmation: | تصدیق کے بعد انجن کی ترتیب: | `REVIEW_REQUIRED` |
| 44 | `loading.labels.createTripDownload` | `loading` | B | `arabic_in_en` | : إنشاء سجل الرحلة بحالة التحميل المبدئية. | : Create trip record with initial loading status. | : ابتدائی لوڈنگ کی حالت کے ساتھ ٹرپ ریکارڈ بنائیں۔ | `REVIEW_REQUIRED` |
| 45 | `loading.labels.createTripStatusSave` | `loading` | B | `arabic_in_en` | : إنشاء سجل الرحلة المبدئي بالحالة LOADED وحفظ Pricing Snapshot | : Create initial trip record with LOADED status and save Pricing Snapshot | : LOADED حالت کے ساتھ ابتدائی ٹرپ ریکارڈ بنائیں اور Pricing Snapshot محفوظ کریں | `REVIEW_REQUIRED` |
| 46 | `loading.labels.createTrip_2` | `loading` | B | `arabic_in_en` | محظور نظامياً: لا يمكن إنشاء رحلة Offline بدون بيانات تسعير معتمدة مسبقاً | System prohibited: Cannot create offline trip without pre-approved pricing data | سسٹم کی رو سے ممنوع: پہلے سے منظور شدہ قیمت کے ڈیٹا کے بغیر آف لائن ٹرپ نہیں بنایا جا سکتا | `REVIEW_REQUIRED` |
| 47 | `loading.labels.downloadPricing` | `loading` | B | `arabic_in_en` | يعمل التحميل بدون اتصال: تتوفر Master Data وقاعدة التسعير محلياً. يتم الاحتساب والحفظ محلياً ثم الإدراج في Outbox. | Offline loading active: Master Data and pricing rules available locally. Calculation and saving occur locally, then queued in Outbox. | آف لائن لوڈنگ فعال ہے: Master Data اور قیمت کا اصول مقامی طور پر دستیاب ہے۔ حساب اور بچت مقامی طور پر ہوتی ہے اور پھر Outbox میں شامل کی جاتی ہے۔ | `REVIEW_REQUIRED` |
| 48 | `loading.labels.downloadPricing_2` | `loading` | C | `untranslated_fallback` | تحميل مثال التسعير بالمقطوعية (120 SAR) | Load flat rate pricing example (120 SAR) | فلیٹ ریٹ کی قیمت کی مثال لوڈ کریں (120 SAR) | `REVIEW_REQUIRED` |
| 49 | `loading.labels.downloadPricing_4` | `loading` | C | `untranslated_fallback` | الخطوة 8: معاينة بطاقة التحميل والتسعير (Preview) | Step 8: Preview Loading and Pricing Card | مرحلہ 8: لوڈنگ اور قیمت کے کارڈ کا پیش نظارہ (Preview) | `REVIEW_REQUIRED` |
| 50 | `loading.labels.downloadWeighbridge_2` | `loading` | B | `arabic_in_en` | محطة التحميل والميزان (Loading Station) | Loading and Weighbridge Station (Loading Station) | لوڈنگ اور وزنی پل اسٹیشن (Loading Station) | `REVIEW_REQUIRED` |
| 51 | `loading.labels.drivers` | `loading` | B | `arabic_in_en` | السائقون المصرحون | Authorized Drivers | مجاز ڈرائیورز | `REVIEW_REQUIRED` |
| 52 | `loading.labels.driversCarrierTruck` | `loading` | B | `arabic_in_en` | السائقون المصرحون والمسجلون تحت الناقل والشاحنة | Authorized drivers registered under the carrier and truck | کیریئر اور ٹرک کے تحت رجسٹرڈ مجاز ڈرائیورز | `REVIEW_REQUIRED` |
| 53 | `loading.labels.edit` | `loading` | B | `arabic_in_en` | ممنوع تعديل قيمة التسوية من الواجهة | Editing settlement amount from user interface is strictly prohibited | یوزر انٹرفیس سے سیٹلمنٹ کی رقم میں ترمیم کرنا سختی سے ممنوع ہے | `REVIEW_REQUIRED` |
| 54 | `loading.labels.edit_2` | `loading` | B | `arabic_in_en` | حظر تعديل settlementAmount من الواجهة: | Prohibit editing settlementAmount from user interface: | یوزر انٹرفیس سے settlementAmount میں ترمیم پر پابندی: | `REVIEW_REQUIRED` |
| 55 | `loading.labels.material_3` | `loading` | B | `arabic_in_en` | كود المادة: | Material Code: | مٹیریل کوڈ: | `REVIEW_REQUIRED` |
| 56 | `unloading.labels.create` | `unloading` | B | `arabic_in_en` | إنشاء كائن استثناء رسمي (TripExceptionEntity) حقيقي وليس مجرد لون واجهة | Create an authentic formal exception object (TripExceptionEntity), not just a UI color state | ایک حقیقی باضابطہ استثنائی آبجیکٹ (TripExceptionEntity) بنائیں، محض انٹرفیس کا رنگ نہیں | `REVIEW_REQUIRED` |
| 57 | `unloading.labels.location` | `unloading` | B | `arabic_in_en` | هوية مستلم الموقع (unloaderId) | Site Receiver Identifier (unloaderId) | سائٹ وصول کنندہ کی شناخت (unloaderId) | `REVIEW_REQUIRED` |
| 58 | `unloading.labels.location_2` | `unloading` | B | `arabic_in_en` | تمت مراجعة الفارق واحتساب نسبة رطوبة وتبخر طبيعية معتمدة من مدير الموقع | Variance reviewed and natural moisture and evaporation rate approved by site manager accounted for | فرق کا جائزہ لیا گیا اور سائٹ مینیجر کی طرف سے منظور شدہ قدرتی نمی اور بخارات کے تناسب کا حساب لگایا گیا | `REVIEW_REQUIRED` |
| 59 | `unloading.labels.location_4` | `unloading` | B | `arabic_in_en` | القائم بالموقع | Gross Weight at Site | سائٹ پر مجموعی وزن | `REVIEW_REQUIRED` |
| 60 | `unloading.labels.location_5` | `unloading` | B | `arabic_in_en` | الفارغ بالموقع | Tare Weight at Site | سائٹ پر خالی وزن | `REVIEW_REQUIRED` |
| 61 | `unloading.labels.project` | `unloading` | B | `arabic_in_en` | محطة التفريغ والاستلام بموقع المشروع (Unloading Station) | Unloading and Receiving Station at Project Site (Unloading Station) | پروجیکٹ سائٹ پر ان لوڈنگ اور وصولی کا اسٹیشن (Unloading Station) | `REVIEW_REQUIRED` |
| 62 | `unloading.labels.project_2` | `unloading` | B | `arabic_in_en` | مطلوب اعتماد مدير المشروع | Project Manager approval required | پروجیکٹ مینیجر کی منظوری درکار ہے | `REVIEW_REQUIRED` |
| 63 | `unloading.labels.refresh` | `unloading` | B | `arabic_in_en` | سيتم التحديث | Will be updated | اپ ڈیٹ کر دیا جائے گا | `REVIEW_REQUIRED` |
| 64 | `unloading.labels.refresh_2` | `unloading` | B | `arabic_in_en` | ✓ حزم التحديث الذري الإلزامي للحقول الخمسة على السيرفر (Atomic Server Updates): | ✓ Mandatory atomic server update batch for the five fields (Atomic Server Updates): | ✓ سرور پر پانچ فیلڈز کے لیے لازمی ایٹمی اپ ڈیٹ بیچ (Atomic Server Updates): | `REVIEW_REQUIRED` |
| 65 | `unloading.labels.search` | `unloading` | B | `arabic_in_en` | بحث وتحقق | Search and Verify | تلاش اور تصدیق | `REVIEW_REQUIRED` |
| 66 | `unloading.labels.searchCreate` | `unloading` | B | `arabic_in_en` | فحص الامتثال لقواعد البحث الخادومي، حظر اللوحة، التدرج، وإنشاء كائنات الاستثناء | Audit compliance with server search rules, license plate lockouts, escalation, and exception object creation | سرور سرچ کے قواعد، نمبر پلیٹ بلاک، تدریج اور استثنائی آبجیکٹس کی تخلیق کے ساتھ مطابقت کی جانچ | `REVIEW_REQUIRED` |
| 67 | `unloading.labels.searchTrip` | `unloading` | B | `arabic_in_en` | البحث والتعرف على الرحلة (Search & Identification) | Trip Search and Identification (Search & Identification) | ٹرپ کی تلاش اور شناخت (Search & Identification) | `REVIEW_REQUIRED` |
| 68 | `unloading.labels.searchTrip_2` | `unloading` | B | `arabic_in_en` | بانتظار البحث عن رحلة | Awaiting trip search | ٹرپ کی تلاش کا انتظار ہے | `REVIEW_REQUIRED` |
| 69 | `unloading.labels.trip` | `unloading` | B | `arabic_in_en` | تم اختيار الرحلة المحددة: ${cand.tripSerial} | Selected designated trip: ${cand.tripSerial} | منتخب کردہ نامزد ٹرپ: ${cand.tripSerial} | `REVIEW_REQUIRED` |
| 70 | `unloading.labels.trip_2` | `unloading` | B | `arabic_in_en` | اشتراط صارم: لا تستخدم truckPlate وحده لتحديد الرحلة | Strict requirement: Do not use truckPlate alone to identify the trip | سخت شرط: ٹرپ کی شناخت کے لیے صرف truckPlate کا استعمال نہ کریں | `REVIEW_REQUIRED` |
| 71 | `weighbridge.labels.addRefresh` | `weighbridge` | B | `arabic_in_en` | إضافة أو تحديث قاعدة تفاوت (Tolerance Rule) | Add or update tolerance rule (Tolerance Rule) | رواداری کا اصول شامل یا اپ ڈیٹ کریں (Tolerance Rule) | `REVIEW_REQUIRED` |
| 72 | `weighbridge.labels.cancel` | `weighbridge` | B | `arabic_in_en` | إلغاء وتراجع (Cancel) | Cancel and revert (Cancel) | منسوخ اور واپس کریں (Cancel) | `REVIEW_REQUIRED` |
| 73 | `weighbridge.labels.confirm` | `weighbridge` | B | `arabic_in_en` | بانتظار تأكيد التحذيرات (WARNINGS_PENDING) | Awaiting warnings confirmation (WARNINGS_PENDING) | انتباہات کی تصدیق کا انتظار ہے (WARNINGS_PENDING) | `REVIEW_REQUIRED` |
| 74 | `weighbridge.labels.confirm_3` | `weighbridge` | B | `arabic_in_en` | تأكيد اعتماد صافي المصدر كصافي وصول (Audit Confirmation) | Confirm approval of source net weight as arrival net weight (Audit Confirmation) | ماخذ کے خالص وزن کو آمد کے خالص وزن کے طور پر منظور کرنے کی تصدیق کریں (Audit Confirmation) | `REVIEW_REQUIRED` |
| 75 | `weighbridge.labels.confirm_4` | `weighbridge` | B | `arabic_in_en` | تأكيد واعتماد القرار الرقابي | Confirm and approve regulatory decision | نگرانی کے فیصلے کی تصدیق اور منظوری دیں | `REVIEW_REQUIRED` |
| 76 | `weighbridge.labels.details` | `weighbridge` | B | `arabic_in_en` | تفاصيل التقييم الخادومي: | Server-side evaluation details: | سرور سائیڈ جانچ کی تفصیلات: | `REVIEW_REQUIRED` |
| 77 | `weighbridge.labels.download` | `weighbridge` | B | `arabic_in_en` | calculateVariance: التحقق الإلزامي من (net > 0) لصافي التحميل | calculateVariance: Mandatory verification of (net > 0) for loading net weight | calculateVariance: لوڈنگ کے خالص وزن کے لیے (net > 0) کی لازمی توثیق | `REVIEW_REQUIRED` |
| 78 | `weighbridge.labels.download_2` | `weighbridge` | C | `untranslated_fallback` | صافي التحميل (loadedNet) | Loading Net Weight (loadedNet) | لوڈنگ کا خالص وزن (loadedNet) | `REVIEW_REQUIRED` |
| 79 | `weighbridge.labels.import` | `weighbridge` | B | `arabic_in_en` | بروفايل متخصص لاستيراد تذاكر وسجلات ميزان البسكول عبر مسار الاستيراد الموحد (Unified Pipeline). يفصل بين المصدر التشغيلي (WEIGHBRIDGE) ومصدر الإدخال (Excel/CSV/Sheets/Drive). | Specialized profile for importing weighbridge tickets and logs via the Unified Pipeline. Separates operational source (WEIGHBRIDGE) from input source (Excel/CSV/Sheets/Drive). | یونیفائیڈ پائپ لائن (Unified Pipeline) کے ذریعے وزنی پل کے ٹکٹوں اور لاگز کو درآمد کرنے کا خصوصی پروفائل۔ آپریشنل ماخذ (WEIGHBRIDGE) اور ان پٹ ماخذ (Excel/CSV/Sheets/Drive) کو الگ کرتا ہے۔ | `REVIEW_REQUIRED` |
| 80 | `weighbridge.labels.importWeighbridge_2` | `weighbridge` | B | `arabic_in_en` | يدعم مسار الاستيراد الموحد قراءة بيانات الميزان من ملفات CSV وExcel وتكامل Google Drive وSheets. | Unified import pipeline supports reading scale data from CSV and Excel files as well as Google Drive and Sheets integrations. | یونیفائیڈ امپورٹ پائپ لائن CSV اور Excel فائلوں کے ساتھ ساتھ Google Drive اور Sheets کے انضمام سے وزنی پل کے ڈیٹا کو پڑھنے کی حمایت کرتی ہے۔ | `REVIEW_REQUIRED` |
| 81 | `weighbridge.labels.importWeighbridge_3` | `weighbridge` | B | `arabic_in_en` | تنفيذ مسار استيراد الميزان وصولاً للمراجعة | Execute weighbridge import pipeline through to audit review | آڈٹ جائزے تک وزنی پل کی درآمدی پائپ لائن کو مکمل کریں | `REVIEW_REQUIRED` |
| 82 | `weighbridge.labels.location` | `weighbridge` | B | `arabic_in_en` | صافي الاستلام بالموقع (receivedNet) كجم | Site Received Net Weight (receivedNet) kg | سائٹ پر موصولہ خالص وزن (receivedNet) کلوگرام | `REVIEW_REQUIRED` |
| 83 | `weighbridge.labels.pricing` | `weighbridge` | C | `untranslated_fallback` | قاعدة التسعير (pricingRule) مفقودة أو غير محددة. | Pricing rule (pricingRule) is missing or undefined. | قیمت کا اصول (pricingRule) گم ہے یا متعین نہیں ہے۔ | `REVIEW_REQUIRED` |
| 84 | `weighbridge.labels.save` | `weighbridge` | B | `arabic_in_en` | حفظ القاعدة في محرك الأوزان | Save rule in Weight Engine | اصول کو وزن کے انجن میں محفوظ کریں | `REVIEW_REQUIRED` |
| 85 | `weighbridge.labels.trips` | `weighbridge` | B | `arabic_in_en` | عدد الرحلات المعتمدة: | Approved Trips Count: | منظور شدہ ٹرپس کی تعداد: | `REVIEW_REQUIRED` |
| 86 | `carriers.labels.carrier_2` | `projects` | B | `arabic_in_en` | تسجيل الناقل | Register Carrier | کیریئر کی رجسٹریشن | `REVIEW_REQUIRED` |
| 87 | `carriers.labels.project_2` | `projects` | B | `arabic_in_en` | لا يوجد ناقلون مسجلون في المشروع حتى الآن. | No carriers registered in the project yet. | ابھی تک منصوبے میں کوئی کیریئر رجسٹرڈ نہیں ہے۔ | `REVIEW_REQUIRED` |
| 88 | `carriers.labels.trucksPricing` | `projects` | B | `arabic_in_en` | معرف وحيد للربط مع الشاحنات وقواعد التسعير | Unique identifier for linking with trucks and pricing rules | ٹرکس اور قیمتوں کے قواعد سے منسلک کرنے کے لیے منفرد شناخت کنندہ | `REVIEW_REQUIRED` |
| 89 | `carriers.labels.txt_5a7969` | `projects` | C | `untranslated_fallback` | أضف أول ناقل الآن | Add First Carrier Now | اب پہلا کیریئر شامل کریں | `REVIEW_REQUIRED` |
| 90 | `carriers.labels.txt_6354e4` | `projects` | C | `untranslated_fallback` | ترخيص هيئة النقل العامة (TGA) | Transport General Authority (TGA) License | ٹرانسپورٹ جنرل اتھارٹی (TGA) کا لائسنس | `REVIEW_REQUIRED` |
| 91 | `carriers.status.status` | `projects` | B | `arabic_in_en` | تغيير الحالة (نشط / معطّل) | Change Status (Active / Disabled) | حالت تبدیل کریں (فعال / غیر فعال) | `REVIEW_REQUIRED` |
| 92 | `entityResolution.labels.carrier_5` | `projects` | B | `arabic_in_en` | الناقل غير مسجل في قائمة المقاولين المعتمدين للمشروع. هل ترغب في ترخيص هذا الناقل وإضافته للمشروع رسمياً؟ | The carrier is not registered in the project's approved contractor list. Do you want to authorize this carrier and officially add them to the project? | کیریئر پروجیکٹ کے منظور شدہ ٹھیکیداروں کی فہرست میں شامل نہیں ہے۔ کیا آپ اس کیریئر کو مجاز بنا کر سرکاری طور پر پروجیکٹ میں شامل کرنا چاہتے ہیں؟ | `REVIEW_REQUIRED` |
| 93 | `entityResolution.labels.confirm` | `projects` | B | `arabic_in_en` | ℹ️ يوجد مرشح تقريبي (Possible Match)، يرجى التأكيد قبل الدمج. | ℹ️ Possible match found. Please confirm before merging. | ℹ️ ممکنہ مماثلت موجود ہے، براہ کرم انضمام سے قبل تصدیق کریں۔ | `REVIEW_REQUIRED` |
| 94 | `entityResolution.labels.details` | `projects` | B | `arabic_in_en` | تفاصيل المطابقة وتفسير الخوارزمية | Matching Details and Algorithm Explanation | مماثلت کی تفصیلات اور الگورتھم کی وضاحت | `REVIEW_REQUIRED` |
| 95 | `entityResolution.labels.driver` | `projects` | B | `arabic_in_en` | التحقق الصارم من التبعيات (الشاحنة للناقل، السائق للناقل، والترخيص في المشروع). | Strict validation of dependencies (truck to carrier, driver to carrier, and project authorization). | وابستگیوں کی سخت جانچ پڑتال (کیریئر کے لیے ٹرک، کیریئر کے لیے ڈرائیور، اور پروجیکٹ میں اجازت نامہ)۔ | `REVIEW_REQUIRED` |
| 96 | `offline.labels.add` | `offline` | B | `arabic_in_en` | إضافة إلى الصفحة الرئيسية (Add to Home Screen) | Add to Home Screen | ہوم اسکرین میں شامل کریں (Add to Home Screen) | `REVIEW_REQUIRED` |
| 97 | `offline.labels.cancel` | `offline` | B | `arabic_in_en` | إلغاء العملية المحلية مع تسجيل تقرير تباين تشغيلي (Exception Report) | Cancel local operation with logging of operational variance exception report (Exception Report) | آپریشنل فرق کے استثنائی رپورٹ (Exception Report) کے اندراج کے ساتھ مقامی آپریشن منسوخ کریں | `REVIEW_REQUIRED` |
| 98 | `offline.labels.cancelTrip` | `offline` | B | `arabic_in_en` | إلغاء أمر الرحلة لعدم صلاحية الكيان (Cancel Dispatch) | Cancel trip dispatch due to invalid entity (Cancel Dispatch) | ناقص شناخت کی وجہ سے ٹرپ آرڈر منسوخ کریں (Cancel Dispatch) | `REVIEW_REQUIRED` |
| 99 | `offline.labels.cancel_2` | `offline` | B | `arabic_in_en` | إلغاء ومراجعة لاحقاً | Cancel and review later | منسوخ کریں اور بعد میں جائزہ لیں | `REVIEW_REQUIRED` |
| 100 | `offline.labels.carrier` | `offline` | B | `arabic_in_en` | الناقل الفعلي بالخادم: ${serverTruckConflict.serverCarrierName} | Actual carrier on server: ${serverTruckConflict.serverCarrierName} | سرور پر اصل کیریئر: ${serverTruckConflict.serverCarrierName} | `REVIEW_REQUIRED` |

## 4. Quality & Safety Guarantees

- **Arabic Canonical Source:** 100% untouched and unmodified.
- **Accidental Arabic in English:** 0 occurrences found across all 100 repaired entries.
- **Hybrid Morphology:** 0 hybrid suffixes in English or Urdu.
- **Interpolation Parity:** Exact bitwise preservation of all parameters (`${matDist.length}`, `${superRes.trips.length}`, `${params.carrierId}`, `${carrier.name}`, `${validation.blockingError}`, `${cand.tripSerial}`, `${serverTruckConflict.serverCarrierName}`).
- **Protected Tokens:** All technical identifiers, currencies, units, and status codes preserved intact.
- **Review Status:** Every entry marked `REVIEW_REQUIRED`.
- **Non-repudiation:** No code mods, no component alterations, no git commit/push.
