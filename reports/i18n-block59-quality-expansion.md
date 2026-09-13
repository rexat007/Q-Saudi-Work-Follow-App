# BLOCK 59 — Professional Translation Quality Expansion II Report

**Execution Date:** 2026-09-13T09:40:03.350Z
**Status:** COMPLETE ✅
**Target Scope:** Exactly 150 translation keys repaired (100 Category C + 50 Category B) across prioritized operational domains.

## 1. Metrics & Category Reductions

| Category | Before Block 59 | Repaired in Block 59 | Remaining | Status |
|---|:---:|:---:|:---:|:---:|
| **Category B (Mixed Arabic in Target)** | 572 | **50** | **522** | In Progress (Progressive Reduction) |
| **Category C (Untranslated Fallback)** | 330 | **100** | **230** | In Progress (Progressive Reduction) |
| **Category D (Hybrid Morphology)** | 0 | 0 | **0** | **100% ELIMINATED in Block 57** |
| **TOTAL REPAIRED IN BLOCK 59** | - | **150** | - | Complete |

## 2. Priority Domain Distribution

| Priority Domain | Category C Repaired | Category B Repaired | Total Repaired |
|---|:---:|:---:|:---:|
| **dashboard** | 10 | 6 | **16** |
| **trips** | 15 | 8 | **23** |
| **loading** | 12 | 6 | **18** |
| **unloading** | 12 | 5 | **17** |
| **weighbridge** | 15 | 7 | **22** |
| **projects** | 15 | 8 | **23** |
| **offline** | 11 | 5 | **16** |
| **shared** | 10 | 5 | **15** |
| **TOTAL** | **100** | **50** | **150** |

## 3. Repaired Entries Audit Table

| # | Key | Domain | Cat | Arabic Source | Repaired English | Repaired Urdu | Review Status |
|---|---|---|:---:|---|---|---|:---:|
| 1 | `dashboard.labels.txt_18b638` | dashboard | **C** | الصافي المعتمد في نقطة التفريغ | Approved Net Weight at Unloading Point | ان لوڈنگ پوائنٹ پر منظور شدہ خالص وزن | `REVIEW_REQUIRED` |
| 2 | `dashboard.labels.txt_196321` | dashboard | **C** | الخاضعة للتحميل والترحيل | Subject to Loading and Dispatch | لوڈنگ اور ڈسپیچ کے تابع | `REVIEW_REQUIRED` |
| 3 | `dashboard.labels.txt_19e345` | dashboard | **C** | فلاتر الودجت المخصصة (Widget Filter Cont | Custom Widget Filters (Widget Filter Con | کسٹم ویجیٹ فلٹرز (Widget Filter Controls | `REVIEW_REQUIRED` |
| 4 | `dashboard.labels.txt_1b110d` | dashboard | **C** | صافي فارق الموازين (Total Variance) | Total Scale Variance (Total Variance) | وزنی پل کا کل فرق (Total Variance) | `REVIEW_REQUIRED` |
| 5 | `dashboard.labels.txt_2530ed` | dashboard | **C** | لوحة البوابات والموازين الحية (Live Term | Live Gates and Weighbridges Board (Live  | لائیو گیٹس اور وزنی پلوں کا بورڈ (Live T | `REVIEW_REQUIRED` |
| 6 | `dashboard.labels.txt_2ca1cc` | dashboard | **C** | مرتجعة (Returned) | Returned (Returned) | واپس شدہ (Returned) | `REVIEW_REQUIRED` |
| 7 | `dashboard.labels.txt_2f010a` | dashboard | **C** | فلتر | Filter | فلٹر | `REVIEW_REQUIRED` |
| 8 | `dashboard.labels.txt_3318a9` | dashboard | **C** | كافة الحالات | All Statuses | تمام حالات | `REVIEW_REQUIRED` |
| 9 | `dashboard.labels.txt_356679` | dashboard | **C** | إجمالي مستحق النموذج: | Total Due for Model: | ماڈل کا کل واجب الادا: | `REVIEW_REQUIRED` |
| 10 | `dashboard.labels.txt_36b0b2` | dashboard | **C** | - تُطبَّق تلقائياً على كافة الودجات ما ل | - Automatically applied to all widgets u | - خودکار طریقے سے تمام ویجیٹس پر لاگو ہو | `REVIEW_REQUIRED` |
| 11 | `trips.labels.pricing` | trips | **C** | حل التسعير (Pricing Resolution): | Pricing Resolution (Pricing Resolution): | قیمت کا تعین (Pricing Resolution): | `REVIEW_REQUIRED` |
| 12 | `trips.labels.pricing_2` | trips | **C** | قاعدة التسعير (${params.pricingRuleId})  | Pricing rule (${params.pricingRuleId}) n | قیمت کا قاعدہ (${params.pricingRuleId})  | `REVIEW_REQUIRED` |
| 13 | `trips.labels.pricing_3` | trips | **C** | قاعدة التسعير (${pricingRule.name}) معطل | Pricing rule (${pricingRule.name}) is di | قیمت کا قاعدہ (${pricingRule.name}) غیر  | `REVIEW_REQUIRED` |
| 14 | `trips.labels.txt_10cba9` | trips | **C** | صالح ومحلول ✓ | Valid and Resolved ✓ | درست اور حل شدہ ✓ | `REVIEW_REQUIRED` |
| 15 | `trips.labels.txt_124138` | trips | **C** | السبب/الملاحظة: | Reason / Note: | وجہ / نوٹ: | `REVIEW_REQUIRED` |
| 16 | `trips.labels.txt_1309b3` | trips | **C** | إجراءات | Actions | اقدامات | `REVIEW_REQUIRED` |
| 17 | `trips.labels.txt_135d7e` | trips | **C** | مرتجعة للمصدر (RETURNED) | Returned to Origin (RETURNED) | ماخذ پر واپس کر دیا گیا (RETURNED) | `REVIEW_REQUIRED` |
| 18 | `trips.labels.txt_15d5c6` | trips | **C** | أساس التسوية (settlementBase): | Settlement Base (settlementBase): | بنیاد برائے تصفیہ (settlementBase): | `REVIEW_REQUIRED` |
| 19 | `trips.labels.txt_16825e` | trips | **C** | سيناريو 6: تسعيرة منتهية الصلاحية | Scenario 6: Expired Tariff | منظرنامہ 6: میعاد ختم شدہ ٹیرف | `REVIEW_REQUIRED` |
| 20 | `trips.labels.txt_1a8cbe` | trips | **C** | 6. قفز غير قانوني (DRAFT ➔ COMPLETED) | 6. Illegal Skip (DRAFT ➔ COMPLETED) | 6. غیر قانونی چھلانگ (DRAFT ➔ COMPLETED) | `REVIEW_REQUIRED` |
| 21 | `trips.labels.txt_1af9f4` | trips | **C** | سجلات نظامية موثقة | Documented Regulatory Records | دستاویزی قانونی ریکارڈز | `REVIEW_REQUIRED` |
| 22 | `trips.labels.txt_1b87fb` | trips | **C** | RETURN_REQUESTED (طلب إرجاع) | RETURN_REQUESTED (Return Requested) | RETURN_REQUESTED (واپسی کی درخواست کی گئ | `REVIEW_REQUIRED` |
| 23 | `trips.labels.txt_1e7d43` | trips | **C** | RETURNED (تم الإرجاع للمصدر) | RETURNED (Returned to Origin) | RETURNED (ماخذ پر واپس کر دیا گیا) | `REVIEW_REQUIRED` |
| 24 | `trips.labels.txt_22b00b` | trips | **C** | [قاعدة 3: مصرح للمشروع] | [Rule 3: Authorized for Project] | [قاعدہ 3: پروجیکٹ کے لیے مجاز] | `REVIEW_REQUIRED` |
| 25 | `trips.labels.txt_233016` | trips | **C** | PRJ-NEOM-001 (مشروع نيوم - مطابق) | PRJ-NEOM-001 (NEOM Project - Compliant) | PRJ-NEOM-001 (نیوم پروجیکٹ - مطابقت پذیر | `REVIEW_REQUIRED` |
| 26 | `loading.labels.pricing_2` | loading | **C** | نوع التسعير (Pricing Type) | Pricing Type (Pricing Type) | قیمت کی قسم (Pricing Type) | `REVIEW_REQUIRED` |
| 27 | `loading.labels.pricing_4` | loading | **C** | تبديل قاعدة التسعير للمقارنة: | Switch Pricing Rule for Comparison: | موازنہ کے لیے قیمت کا قاعدہ تبدیل کریں: | `REVIEW_REQUIRED` |
| 28 | `loading.labels.txt_19142a` | loading | **C** | تسلسل ذري (Atomic) | Atomic Sequence (Atomic) | اٹامک تسلسل (Atomic) | `REVIEW_REQUIRED` |
| 29 | `loading.labels.txt_195be1` | loading | **C** | تسلسل المحرك المنجز: | Completed Engine Sequence: | مکمل شدہ انجن تسلسل: | `REVIEW_REQUIRED` |
| 30 | `loading.labels.txt_20c9dd` | loading | **C** | دقة حسابية 100% | 100% Calculation Precision | 100% حسابی درستگی | `REVIEW_REQUIRED` |
| 31 | `loading.labels.txt_212255` | loading | **C** | حماية التسوية الآلية | Automated Settlement Protection | خودکار تصفیے کا تحفظ | `REVIEW_REQUIRED` |
| 32 | `loading.labels.txt_2b7e09` | loading | **C** | التسلسل الإجرائي الصارم بعد Confirm: | Strict Procedural Sequence after Confirm | تصدیق کے بعد سخت طریقہ کار کا تسلسل: | `REVIEW_REQUIRED` |
| 33 | `loading.labels.txt_2dfd1b` | loading | **C** | الهوية/الإقامة: | National ID / Iqama: | شناختی کارڈ / اقامہ: | `REVIEW_REQUIRED` |
| 34 | `loading.labels.txt_31e3da` | loading | **C** | محسوبة خادومياً بالكامل | Fully Server-Calculated | مکمل سرور پر شمار شدہ | `REVIEW_REQUIRED` |
| 35 | `loading.labels.txt_31e684` | loading | **C** | مفعّل بوضوح | Explicitly Enabled | واضح طور پر فعال | `REVIEW_REQUIRED` |
| 36 | `loading.labels.txt_37e310` | loading | **C** | التسوية محمية رقابياً | Settlement Protected by Governance | تصفیہ ریگولیٹری تحفظ کے تحت | `REVIEW_REQUIRED` |
| 37 | `loading.labels.txt_3c2d03` | loading | **C** | محمي ومحصن | Protected and Secured | محفوظ اور مستحکم | `REVIEW_REQUIRED` |
| 38 | `unloading.labels.txt_11fefd` | unloading | **C** | ➔ ثم: | ➔ Then: | ➔ پھر: | `REVIEW_REQUIRED` |
| 39 | `unloading.labels.txt_12f468` | unloading | **C** | وقت الوصول الفعلي (arrivalTime) | Actual Arrival Time (arrivalTime) | آمد کا اصل وقت (arrivalTime) | `REVIEW_REQUIRED` |
| 40 | `unloading.labels.txt_13d6c6` | unloading | **C** | سيناريوهات تجربة فورية: | Immediate Test Scenarios: | فوری ٹیسٹ منظرنامے: | `REVIEW_REQUIRED` |
| 41 | `unloading.labels.txt_17be32` | unloading | **C** | تمت المطابقة عبر: | Matched via: | مطابقت بذریعہ: | `REVIEW_REQUIRED` |
| 42 | `unloading.labels.txt_1efd8d` | unloading | **C** | تفاوت طبيعي مبرر للشحنة | Justified Normal Shipment Variance | کھیپ کا جائز قدرتی فرق | `REVIEW_REQUIRED` |
| 43 | `unloading.labels.txt_280c6b` | unloading | **C** | عند بدء التفريغ (Start Unloading) | Upon Start Unloading (Start Unloading) | ان لوڈنگ کے آغاز پر (Start Unloading) | `REVIEW_REQUIRED` |
| 44 | `unloading.labels.txt_2af283` | unloading | **C** | "ولا تعتبر الفرق مجرد لون في الواجهة" | "The difference is not merely a UI color | "یہ فرق صرف انٹرفیس کا رنگ نہیں ہے" | `REVIEW_REQUIRED` |
| 45 | `unloading.labels.txt_2e57eb` | unloading | **C** | يحسب الخادم varianceWeight ويحدّث: unloa | Server calculates varianceWeight and upd | سرور varianceWeight کا حساب لگاتا ہے اور | `REVIEW_REQUIRED` |
| 46 | `unloading.labels.txt_2f5c04` | unloading | **C** | حالة دورة الحياة | Lifecycle Status | لائف سائیکل کی حالت | `REVIEW_REQUIRED` |
| 47 | `unloading.labels.txt_304aff` | unloading | **C** | عند الوصول (Arrival) | Upon Arrival (Arrival) | آمد پر (Arrival) | `REVIEW_REQUIRED` |
| 48 | `unloading.labels.txt_30adf1` | unloading | **C** | خارج التسامح (Exception) | Out of Tolerance (Exception) | تفاوت کی حد سے باہر (Exception) | `REVIEW_REQUIRED` |
| 49 | `unloading.labels.txt_424fcb` | unloading | **C** | . (يُمنع استخدام truckPlate وحده). | . (Using truckPlate alone is prohibited) | . (صرف truckPlate کا استعمال ممنوع ہے)۔ | `REVIEW_REQUIRED` |
| 50 | `weighbridge.labels.txt_119698` | weighbridge | **C** | مفقود (Missing) | Missing (Missing) | لاپتہ (Missing) | `REVIEW_REQUIRED` |
| 51 | `weighbridge.labels.txt_14234f` | weighbridge | **C** | نوع التفاوت (Tolerance Mode) | Tolerance Mode (Tolerance Mode) | تفاوت کا طریقہ کار (Tolerance Mode) | `REVIEW_REQUIRED` |
| 52 | `weighbridge.labels.txt_150ad3` | weighbridge | **C** | إعادة ضبط Idempotency | Reset Idempotency | Idempotency ری سیٹ کریں | `REVIEW_REQUIRED` |
| 53 | `weighbridge.labels.txt_1644f0` | weighbridge | **C** | تفاوت مطلق (absoluteTolerance) | Absolute Tolerance (absoluteTolerance) | مطلق تفاوت (absoluteTolerance) | `REVIEW_REQUIRED` |
| 54 | `weighbridge.labels.txt_17aab5` | weighbridge | **C** | لا تستخدم 0 كبديل عن missing data ➔ النت | Do not use 0 instead of missing data ➔ R | لاپتہ ڈیٹا کی جگہ 0 استعمال نہ کریں ➔ نت | `REVIEW_REQUIRED` |
| 55 | `weighbridge.labels.txt_17ffad` | weighbridge | **C** | أمثلة سريعة: | Quick Examples: | فوری مثالیں: | `REVIEW_REQUIRED` |
| 56 | `weighbridge.labels.txt_2161ff` | weighbridge | **C** | both (مطلق ونسبة معاً) | Both (Absolute and Percentage Together) | دونوں (مطلق اور فیصد ایک ساتھ) | `REVIEW_REQUIRED` |
| 57 | `weighbridge.labels.txt_241697` | weighbridge | **C** | tare مفقود (➔ null) | Tare Weight Missing (➔ null) | خالی گاڑی کا وزن غائب (➔ null) | `REVIEW_REQUIRED` |
| 58 | `weighbridge.labels.txt_2456f5` | weighbridge | **C** | حالة القاعدة (status) | Rule Status (status) | قاعدے کی حالت (status) | `REVIEW_REQUIRED` |
| 59 | `weighbridge.labels.txt_24fc12` | weighbridge | **C** | معرف العملية (Operation ID): | Operation ID (Operation ID): | آپریشن شناختی نمبر (Operation ID): | `REVIEW_REQUIRED` |
| 60 | `weighbridge.labels.txt_265f32` | weighbridge | **C** | استلام مفقود (➔ null) | Receiving Weight Missing (➔ null) | وصولی کا وزن غائب (➔ null) | `REVIEW_REQUIRED` |
| 61 | `weighbridge.labels.txt_2eacb2` | weighbridge | **C** | صفوف صالحة (Valid) | Valid Rows (Valid) | درست قطاریں (Valid) | `REVIEW_REQUIRED` |
| 62 | `weighbridge.labels.txt_30b047` | weighbridge | **C** | إجراء رقابي (Decision) | Regulatory Decision (Decision) | نگرانی کا فیصلہ (Decision) | `REVIEW_REQUIRED` |
| 63 | `weighbridge.labels.txt_32f0a0` | weighbridge | **C** | حظر الصفر البديل (null قطعي) | Prohibit Substitute Zero (Strict null) | متبادل صفر کی ممانعت (حتمی null) | `REVIEW_REQUIRED` |
| 64 | `weighbridge.labels.txt_3524f5` | weighbridge | **C** | غياب بيانات التفريغ (Non-blocking): | Absence of Unloading Data (Non-blocking) | ان لوڈنگ ڈیٹا کی عدم موجودگی (غیر رکاوٹی | `REVIEW_REQUIRED` |
| 65 | `materials.labels.txt_112afc` | projects | **C** | اضغط للتبديل بين التفعيل والتعطيل | Click to toggle active and inactive stat | فعال اور غیر فعال کے درمیان تبدیل کرنے ک | `REVIEW_REQUIRED` |
| 66 | `materials.labels.txt_1a4fae` | projects | **C** | يمكنك استخدام الأسهم ⬆️⬇️ لتغيير الترتيب | You can use the ⬆️⬇️ arrows to reorder a | آپ واؤچرز میں منظور شدہ ترتیب بدلنے کے ل | `REVIEW_REQUIRED` |
| 67 | `materials.labels.txt_252118` | projects | **C** | الوحدة | Unit | اکائی | `REVIEW_REQUIRED` |
| 68 | `materials.labels.txt_3b64b7` | projects | **C** | وحدة القياس المعتمدة | Approved Unit of Measurement | منظور شدہ پیمائش کی اکائی | `REVIEW_REQUIRED` |
| 69 | `materials.labels.txt_60028f` | projects | **C** | رد كامل (TRIP) - مقطوع | Full Trip (TRIP) - Lump Sum | مکمل چکر (TRIP) - یکمشت | `REVIEW_REQUIRED` |
| 70 | `materials.labels.txt_6688ac` | projects | **C** | متر مكعب (M3) - حجمي | Cubic Meter (M3) - Volume | مکعب میٹر (M3) - حجم | `REVIEW_REQUIRED` |
| 71 | `materials.labels.txt_73756a` | projects | **C** | تحريك لأعلى | Move Up | اوپر منتقل کریں | `REVIEW_REQUIRED` |
| 72 | `materials.labels.txt_737581` | projects | **C** | تحريك لأسفل | Move Down | نیچے منتقل کریں | `REVIEW_REQUIRED` |
| 73 | `materials.labels.txt_7f591f` | projects | **C** | الترتيب | Order / Sequence | ترتیب | `REVIEW_REQUIRED` |
| 74 | `materials.labels.txt_9e7170` | projects | **C** | أضف أول مادة الآن | Add First Material Now | پہلا مٹیریل ابھی شامل کریں | `REVIEW_REQUIRED` |
| 75 | `other.labels.txt_109c7a` | projects | **C** | وحدة القياس الأساسية: | Base Unit of Measurement: | بنیادی پیمائش کی اکائی: | `REVIEW_REQUIRED` |
| 76 | `other.labels.txt_1118c2` | projects | **C** | الخطوة 6: تهيئة مساحة العمل السحابية (Go | Step 6: Provision Cloud Workspace (Googl | مرحلہ 6: کلاؤڈ ورک اسپیس کی تشکیل (Googl | `REVIEW_REQUIRED` |
| 77 | `other.labels.txt_13cd13` | projects | **C** | 📊 أوراق عمل Google Sheets (Tabs): | 📊 Google Sheets Tabs (Tabs): | 📊 Google Sheets ٹیبز (Tabs): | `REVIEW_REQUIRED` |
| 78 | `other.labels.txt_1e1bdf` | projects | **C** | تسجيل الدخول عبر Google | Sign in with Google | Google کے ذریعے سائن ان کریں | `REVIEW_REQUIRED` |
| 79 | `other.labels.txt_207857` | projects | **C** | نظام ACTIVE / INACTIVE: | ACTIVE / INACTIVE State System: | ACTIVE / INACTIVE نظام کی حالت: | `REVIEW_REQUIRED` |
| 80 | `offline.labels.txt_15265b` | offline | **C** | DUPLICATE_OPERATION تكرار القيد | DUPLICATE_OPERATION Duplicate Entry | DUPLICATE_OPERATION ڈپلیکیٹ اندراج | `REVIEW_REQUIRED` |
| 81 | `offline.labels.txt_18aa37` | offline | **C** | مركز معالجة التعارضات التشغيلية (Conflic | Operational Conflict Resolution Center ( | آپریشنل تنازعات کے حل کا مرکز (Conflict  | `REVIEW_REQUIRED` |
| 82 | `offline.labels.txt_197045` | offline | **C** | ثبات تسعير الـ Offline: | Offline Pricing Invariance: | آف لائن قیمت کا استحکام: | `REVIEW_REQUIRED` |
| 83 | `offline.labels.txt_1bc609` | offline | **C** | في شريط متصفح سفاري. | in Safari browser bar. | سفاری براؤزر بار میں۔ | `REVIEW_REQUIRED` |
| 84 | `offline.labels.txt_21781d` | offline | **C** | محددات حوكمة التعارضات (Conflict Resolut | Conflict Resolution Governance Mandates  | تنازعات کے حل کے گورننس کے اصول (Conflic | `REVIEW_REQUIRED` |
| 85 | `offline.labels.txt_231b48` | offline | **C** | الفروقات الميدانية المرصودة: | Observed Field Discrepancies: | فیلڈ میں دیکھے گئے تفاوت: | `REVIEW_REQUIRED` |
| 86 | `offline.labels.txt_24195a` | offline | **C** | الأمر الميداني المحلي (Local Command) | Local Field Command (Local Command) | مقامی فیلڈ کمانڈ (Local Command) | `REVIEW_REQUIRED` |
| 87 | `offline.labels.txt_25bbf9` | offline | **C** | مرر للأسفل واختر | Scroll down and select | نیچے سکرول کریں اور منتخب کریں | `REVIEW_REQUIRED` |
| 88 | `offline.labels.txt_292ade` | offline | **C** | استجابة المصادقة الخادومية (Server ACK): | Server Authentication Acknowledgment (Se | سرور تصدیقی اعتراف (Server ACK): | `REVIEW_REQUIRED` |
| 89 | `offline.labels.txt_2a087d` | offline | **C** | TRIP_ALREADY_COMPLETED مغلقة | TRIP_ALREADY_COMPLETED Closed | TRIP_ALREADY_COMPLETED بند شدہ | `REVIEW_REQUIRED` |
| 90 | `offline.labels.txt_2eef0a` | offline | **C** | PRICING_CHANGED وحماية Snapshot | PRICING_CHANGED and Snapshot Protection | PRICING_CHANGED اور Snapshot تحفظ | `REVIEW_REQUIRED` |
| 91 | `authentication.labels.txt_3548e6` | shared | **C** | متصل بـ Firestore | Connected to Firestore | Firestore سے منسلک ہے | `REVIEW_REQUIRED` |
| 92 | `authentication.labels.txt_413ffd` | shared | **C** | تسجيل الدخول (Google) | Sign In (Google) | سائن ان کریں (Google) | `REVIEW_REQUIRED` |
| 93 | `authentication.labels.txt_b1a849` | shared | **C** | تسجيل الخروج | Sign Out | سائن آؤٹ کریں | `REVIEW_REQUIRED` |
| 94 | `navigation.labels.txt_102b03` | shared | **C** | 4 مجلدات فرعية | 4 Subfolders | 4 ذیلی فولڈرز | `REVIEW_REQUIRED` |
| 95 | `navigation.labels.txt_10324c` | shared | **C** | تنبيه: يوجد تعارضات تشغيلية تتطلب حلاً ص | Alert: Operational conflicts detected re | انتباہ: آپریشنل تنازعات پائے گئے ہیں جن  | `REVIEW_REQUIRED` |
| 96 | `navigation.labels.txt_114bd2` | shared | **C** | reports (التقارير) | Reports (Reports) | رپورٹس (Reports) | `REVIEW_REQUIRED` |
| 97 | `navigation.labels.txt_116753` | shared | **C** | جداول الإسقاط الستة في Google Sheets (Pr | Six Projection Tabs in Google Sheets (Pr | Google Sheets میں چھ پروجیکشن ٹیبز (Proj | `REVIEW_REQUIRED` |
| 98 | `navigation.labels.txt_11ed5e` | shared | **C** | 7 خطوات | 7 Steps | 7 مراحل | `REVIEW_REQUIRED` |
| 99 | `navigation.labels.txt_12e46c` | shared | **C** | Upsert وليس Blind Append | Upsert, not Blind Append | Upsert، Blind Append نہیں | `REVIEW_REQUIRED` |
| 100 | `navigation.labels.txt_136877` | shared | **C** | هيكل Google Drive للمشروع | Project Google Drive Structure | پروجیکٹ کا Google Drive ڈھانچہ | `REVIEW_REQUIRED` |
| 101 | `dashboard.labels.txt_3563c6` | dashboard | **B** | إعادة المزامنة مع الفلاتر العامة | Resynchronize with Global Filters | عالمی فلٹرز کے ساتھ دوبارہ مطابقت پذیری  | `REVIEW_REQUIRED` |
| 102 | `dashboard.labels.txt_38efc7` | dashboard | **B** | إعادة تعيين الكل | Reset All | سب دوبارہ ترتیب دیں | `REVIEW_REQUIRED` |
| 103 | `dashboard.labels.txt_3b0cf8` | dashboard | **B** | المستحقات (ر.س) | Dues (SAR) | واجبات (سعودی ریال) | `REVIEW_REQUIRED` |
| 104 | `dashboard.labels.txt_7d6fcd` | dashboard | **B** | لوحة العمليات والتحكم اللوجستي (Operatio | Operations and Logistics Control Dashboa | آپریشنز اور لاجسٹکس کنٹرول ڈیش بورڈ (Ope | `REVIEW_REQUIRED` |
| 105 | `dashboard.labels.txt_7ef999` | dashboard | **B** | الأطنان | Tons | ٹن | `REVIEW_REQUIRED` |
| 106 | `dashboard.labels.txt_b1749a` | dashboard | **B** | تسويات الأطنان (Ton-based Settlement) | Ton-based Settlement (Ton-based Settleme | ٹن کی بنیاد پر تصفیہ (Ton-based Settleme | `REVIEW_REQUIRED` |
| 107 | `other.labels.deleteCarrierTrips` | trips | **B** | حذف الناقل (فحص الرحلات والنزاهة) | Delete Carrier (Verify Trips and Integri | کیریئر حذف کریں (ٹرپس اور سالمیت کی جانچ | `REVIEW_REQUIRED` |
| 108 | `other.labels.deleteDriverTrips` | trips | **B** | حذف السائق (فحص الرحلات والنزاهة) | Delete Driver (Verify Trips and Integrit | ڈرائیور حذف کریں (ٹرپس اور سالمیت کی جان | `REVIEW_REQUIRED` |
| 109 | `other.labels.deleteMaterialTrips` | trips | **B** | حذف المادة (فحص الرحلات والنزاهة) | Delete Material (Verify Trips and Integr | مٹیریل حذف کریں (ٹرپس اور سالمیت کی جانچ | `REVIEW_REQUIRED` |
| 110 | `other.labels.deleteTruckTrips` | trips | **B** | حذف الشاحنة (فحص الرحلات والنزاهة) | Delete Truck (Verify Trips and Integrity | ٹرک حذف کریں (ٹرپس اور سالمیت کی جانچ) | `REVIEW_REQUIRED` |
| 111 | `other.labels.trip` | trips | **B** | أحداث الرحلة | Trip Events | ٹرپ کے واقعات | `REVIEW_REQUIRED` |
| 112 | `other.labels.trips_4` | trips | **B** | أرقام الرحلات: | Trip Numbers: | ٹرپ نمبرز: | `REVIEW_REQUIRED` |
| 113 | `other.labels.trips_6` | trips | **B** | تُنسب له الرحلات المنفذة بواسطة أسطوله و | Trips executed by their fleet and driver | ان کے بیڑے اور ڈرائیوروں کے ذریعے مکمل ک | `REVIEW_REQUIRED` |
| 114 | `other.labels.trips_7` | trips | **B** | يقوم بتنفيذ الرحلات الميدانية المسندة له | Executes field trips assigned to them. | انہیں تفویض کردہ فیلڈ ٹرپس انجام دیتا ہے | `REVIEW_REQUIRED` |
| 115 | `loading.labels.materialsProject` | loading | **B** | المواد المعتمدة للتوريد في موقع المشروع | Materials Approved for Supply at Project | پروجیکٹ سائٹ پر سپلائی کے لیے منظور شدہ  | `REVIEW_REQUIRED` |
| 116 | `loading.labels.materialsProject_2` | loading | **B** | المواد المصرحة بالمشروع | Materials Authorized for Project | پروجیکٹ کے لیے مجاز مٹیریلز | `REVIEW_REQUIRED` |
| 117 | `loading.labels.pricingConfirm` | loading | **B** | إظهار طريقة التسعير للمستخدم قبل التأكيد | Display pricing methodology to user befo | تصدیق سے پہلے صارف کو قیمت کے تعین کا طر | `REVIEW_REQUIRED` |
| 118 | `loading.labels.project` | loading | **B** | معرّف المشروع: | Project ID: | پروجیکٹ آئی ڈی: | `REVIEW_REQUIRED` |
| 119 | `loading.labels.projectDownloadPricing` | loading | **B** | تحديد المشروع التابع له أمر التحميل لتطب | Select project associated with loading o | علیحدگی اور قیمت کے قواعد لاگو کرنے کے ل | `REVIEW_REQUIRED` |
| 120 | `loading.labels.project_3` | loading | **B** | يقتصر الاختيار على شركات النقل المصرح له | Selection is restricted to carriers auth | انتخاب صرف ان کیریئرز تک محدود ہے جو پرو | `REVIEW_REQUIRED` |
| 121 | `unloading.labels.trip_3` | unloading | **B** | تنبيه غامض: تم العثور على أكثر من رحلة ل | Ambiguity Alert: Multiple trips found fo | ابہام کا انتباہ: ٹرک کے لیے ایک سے زیادہ | `REVIEW_REQUIRED` |
| 122 | `unloading.labels.tripsTrip` | unloading | **B** | يُحظر المضي التلقائي لمنع الخلط بين الرح | Automatic continuation is prevented to a | مختلف ٹرپس یا شفٹوں کے اختلاط سے بچنے کے | `REVIEW_REQUIRED` |
| 123 | `unloading.labels.truck` | unloading | **B** | نجح التدرج لمعرف الشاحنة truckId (الحالة | Graduated resolution succeeded for truck | ٹرک شناخت کنندہ truckId کے لیے درجہ بندی | `REVIEW_REQUIRED` |
| 124 | `unloading.labels.truckTime` | unloading | **B** | تسجيل وصول الشاحنة عند البوابة الرئيسية  | Record truck arrival at main gate and do | مین گیٹ پر ٹرک کی آمد درج کریں اور ٹائم  | `REVIEW_REQUIRED` |
| 125 | `unloading.labels.truck_2` | unloading | **B** | معرف ولـوحة الشاحنة | Truck ID and License Plate | ٹرک آئی ڈی اور لائسنس پلیٹ | `REVIEW_REQUIRED` |
| 126 | `weighbridge.labels.trips_2` | weighbridge | **B** | أرقام الرحلات المنشأة: | Created Trip Numbers: | تخلیق شدہ ٹرپ نمبرز: | `REVIEW_REQUIRED` |
| 127 | `weighbridge.labels.txt_1247cf` | weighbridge | **B** | تجربة مخرج: WARNING (-380 كجم / &gt;75%) | Output Test: WARNING (-380 kg / >75%) | آؤٹ پٹ ٹیسٹ: انتباہ (-380 کلوگرام / >75% | `REVIEW_REQUIRED` |
| 128 | `weighbridge.labels.txt_18b9e9` | weighbridge | **B** | قواعد التحقق الصارمة (Strict Validation) | Strict Validation Rules (Strict Validati | سخت توثیقی قواعد (Strict Validation): | `REVIEW_REQUIRED` |
| 129 | `weighbridge.labels.txt_1e62d1` | weighbridge | **B** | ملاحظات أو مبرر الاعتماد (اختياري): | Notes or Justification for Approval (Opt | منظوری کے لیے نوٹس یا جواز (اختیاری): | `REVIEW_REQUIRED` |
| 130 | `weighbridge.labels.txt_222b14` | weighbridge | **B** | طبيعي (-150 كجم) | Normal (-150 kg) | معمول کے مطابق (-150 کلوگرام) | `REVIEW_REQUIRED` |
| 131 | `weighbridge.labels.txt_2523f6` | weighbridge | **B** | صافي المصدر | Origin Net Weight | ماخذ کا خالص وزن | `REVIEW_REQUIRED` |
| 132 | `weighbridge.labels.txt_26b92a` | weighbridge | **B** | تجربة مخرج: EXCEPTION (-750 كجم / تجاوز  | Output Test: EXCEPTION (-750 kg / Limit  | آؤٹ پٹ ٹیسٹ: استثنیٰ (-750 کلوگرام / حد  | `REVIEW_REQUIRED` |
| 133 | `materials.labels.add_2` | projects | **B** | لم تتم إضافة أي مواد للمشروع بعد. | No materials have been added to the proj | ابھی تک پروجیکٹ میں کوئی مٹیریل شامل نہی | `REVIEW_REQUIRED` |
| 134 | `materials.labels.editMaterial` | projects | **B** | تعديل بيانات المادة | Edit Material Data | مٹیریل کا ڈیٹا ترمیم کریں | `REVIEW_REQUIRED` |
| 135 | `materials.labels.material_2` | projects | **B** | رمز المادة (Code) | Material Code (Code) | مٹیریل کوڈ (Code) | `REVIEW_REQUIRED` |
| 136 | `materials.labels.materials` | projects | **B** | قائمة المواد المعتمدة ( | List of Approved Materials ( | منظور شدہ مٹیریلز کی فہرست ( | `REVIEW_REQUIRED` |
| 137 | `materials.labels.materials_3` | projects | **B** | تنبيهات إدارة المواد: | Material Management Alerts: | مٹیریل مینجمنٹ انتباہات: | `REVIEW_REQUIRED` |
| 138 | `navigation.labels.projectUpload` | projects | **B** | يرجى تهيئة مجلدات المشروع في Google Driv | Please initialize project folders in Goo | براہ کرم فائلز اپ لوڈ کرنے سے پہلے Googl | `REVIEW_REQUIRED` |
| 139 | `navigation.labels.project_2` | projects | **B** | تهيئة هيكل المشروع في Drive & Sheets | Initialize Project Structure in Drive &  | Drive اور Sheets میں پروجیکٹ کا ڈھانچہ ت | `REVIEW_REQUIRED` |
| 140 | `navigation.labels.project_3` | projects | **B** | المشروع المحدد | Selected Project | منتخب کردہ پروجیکٹ | `REVIEW_REQUIRED` |
| 141 | `offline.labels.createTrip` | offline | **B** | ساري وقت إنشاء الرحلة بدون اتصال | Effective at trip creation time while of | آف لائن رہتے ہوئے ٹرپ کی تخلیق کے وقت نا | `REVIEW_REQUIRED` |
| 142 | `offline.labels.createTrip_2` | offline | **B** | عند العمل في وضع عدم الاتصال (Offline) و | When working in offline mode and creatin | جب آف لائن موڈ میں کام کرتے ہوئے لوڈنگ ا | `REVIEW_REQUIRED` |
| 143 | `offline.labels.deleteSave` | offline | **B** | حذف العملية من طابور الصادر وحفظ ملف الت | Delete operation from outbox and save au | آؤٹ باکس سے آپریشن حذف کریں اور لاجسٹکس  | `REVIEW_REQUIRED` |
| 144 | `offline.labels.details` | offline | **B** | تفاصيل التعارض (Conflict Detected): | Conflict Details (Conflict Detected): | تنازعہ کی تفصیلات (Conflict Detected): | `REVIEW_REQUIRED` |
| 145 | `offline.labels.edit` | offline | **B** | تم تعليق أو تعديل الكيان خادومياً أثناء  | Entity was suspended or modified on the  | آف لائن کام کے دوران سرور پر ہستی کو معط | `REVIEW_REQUIRED` |
| 146 | `authentication.labels.txt_49cb21` | shared | **B** | جاري تهيئة التحقق... | Initializing authentication... | توثیق کی تشکیل جاری ہے... | `REVIEW_REQUIRED` |
| 147 | `navigation.labels.refresh` | shared | **B** | يتم سحب السجلات من مستودعات البيانات الر | Records are pulled from primary data sto | ریکارڈز Firestore کے بنیادی ڈیٹا اسٹورز  | `REVIEW_REQUIRED` |
| 148 | `navigation.labels.refresh_4` | shared | **B** | التحديث يتم عبر فحص عمود tripId بدقة ومط | Update is performed by strictly checking | اپ ڈیٹ tripId کالم کی سختی سے جانچ کر کے | `REVIEW_REQUIRED` |
| 149 | `navigation.labels.txt_132f08` | shared | **B** | غير مسجل بعد (اضغط تهيئة المشروع) | Not registered yet (Click to initialize  | ابھی رجسٹرڈ نہیں ہوا (پروجیکٹ تشکیل دینے | `REVIEW_REQUIRED` |
| 150 | `navigation.labels.txt_17c5e1` | shared | **B** | هذه المبادئ الـ 12 هي السقف الهندسي الحا | These 12 principles serve as the governi | یہ 12 اصول پورے پلیٹ فارم کے لیے حاکم تک | `REVIEW_REQUIRED` |

## 4. Verification Guarantees

- **Zero Arabic Modification**: Canonical Arabic dictionary in `src/locales/ar/index.ts` is 100% untouched.
- **No Accidental Arabic in English**: All 150 repaired English entries verified to have zero Arabic script characters.
- **Urdu Natural Syntax**: Natural Urdu phrasing and terminology, free from untranslated Arabic phrases.
- **Token & Parameter Parity**: All parameters (e.g. `${params.pricingRuleId}`, `${searchResult.status}`, `${searchResult.count}`) and protected tokens (`Google Sheets`, `Google Drive`, `Firestore`, `SAR`, `KG`, `TON`, `M3`, `TRIP`, `Idempotency`, `Anti-LWW`, `Upsert`, `Blind Append`, `DUPLICATE_OPERATION`, `TRIP_ALREADY_COMPLETED`, `PRICING_CHANGED`, `INACTIVE`, `RETURNED`, `RETURN_REQUESTED`, `DRAFT`, `COMPLETED`, `truckId`, `tripId`) preserved exactly.
- **No Scope Overlap**: Exactly 150 new unique keys repaired with zero collision against Block 57 (20 keys) or Block 58 (100 keys).
