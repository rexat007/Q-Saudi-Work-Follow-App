# BLOCK 63 — Professional Translation Quality Expansion III Report

**Status:** COMPLETE ✅  
**GitHub Recovery Point:** BLOCK 62  
**Timestamp:** 2026-09-13T10:55:38.827Z  

## 1. Executive Summary & Defect Burn-Down

| Defect Category | Block 62 Baseline | Repaired in Block 63 | Remaining Authoritative | Status |
|---|:---:|:---:|:---:|:---:|
| **Category B (Mixed Arabic in Target)** | 352 | **100** | **252** | Progressing 🚀 |
| **Category C (Untranslated Fallback)** | 150 | **50** | **100** | Progressing 🚀 |
| **Category D (Corrupt Morphology)** | 0 | **0** | **0** | **100% ELIMINATED** |
| **Human Review Governance Queue** | 33 | **0** | **33** | Preserved (Untouched) |
| **Total Authoritative Queue** | 502 | **150** | **352** | Active Pipeline |

## 2. Domain Distribution

| Domain | Category B | Category C | Total Repaired |
|---|:---:|:---:|:---:|
| `projects` | 25 | 23 | **48** |
| `offline` | 37 | 16 | **53** |
| `weighbridge` | 37 | 9 | **46** |
| `pricing` | 1 | 1 | **2** |
| `security` | 0 | 1 | **1** |
| **Total** | **100** | **50** | **150** |

## 3. Skipped Keys & Technical Exclusions

| # | Key | Category | Priority | Governance Justification |
|---|---|:---:|:---:|---|
| 1 | `navigation.labels.trips` | **B** | P1 | Hard-pinned in legacy quality test switcherAndQualityBlock56.test.ts (I18N-QUALITY-01) as required detection fixture |
| 2 | `navigation.labels.import` | **B** | P1 | Hard-pinned in legacy quality test switcherAndQualityBlock56.test.ts (I18N-QUALITY-01/02) as required detection fixture |
| 3 | `trips.labels.status_6` | **B** | P1 | Embedded Arabic literal in interpolation code expression; referred to technical governance |

## 4. Repaired Entries Audit (150 Total)

| # | Key | Domain | Cat | Arabic Source | English Translation | Urdu Translation | Status |
|---|---|---|:---:|---|---|---|:---:|
| 1 | `projects.labels.add` | `projects` | **B** | يجب إضافة مادة واحدة على الأقل للمشروع | At least one material must be added to the project | پروجیکٹ میں کم از کم ایک مٹیریل شامل کرنا ضروری ہے | `REVIEW_REQUIRED` |
| 2 | `projects.labels.pricing_2` | `projects` | **B** | ${ruleLabel}: نوع التسعير يجب أن يكون بالرد (PER_TRIP) أو بالطن (PER_TON) | ${ruleLabel}: Pricing type must be per trip (PER_TRIP) or per ton (PER_TON) | ${ruleLabel}: قیمت کے تعین کی قسم فی چکر (PER_TRIP) یا فی ٹن (PER_TON) ہونی چاہیے | `REVIEW_REQUIRED` |
| 3 | `projects.labels.project` | `projects` | **B** | PRJ - أرشيف ومستندات المشروع اللوجستية | PRJ - Project Logistics Documents and Archive | PRJ - پروجیکٹ لاجسٹکس دستاویزات اور آرکائیو | `REVIEW_REQUIRED` |
| 4 | `projects.labels.txt_2bed60` | `projects` | **B** | المراجعة والإنشاء | Review and Creation | جائزہ اور تخلیق | `REVIEW_REQUIRED` |
| 5 | `projects.labels.txt_38ae35` | `projects` | **B** | إعادة تعيين المعالج | Reset Wizard | وزرڈ ری سیٹ کریں | `REVIEW_REQUIRED` |
| 6 | `projects.labels.txt_3ba0be` | `projects` | **B** | شركات النقل | Transport Companies | ٹرانسپورٹ کمپنیاں | `REVIEW_REQUIRED` |
| 7 | `projects.labels.txt_3d1068` | `projects` | **B** | تكامل Google | Google Integration | Google انٹیگریشن | `REVIEW_REQUIRED` |
| 8 | `projects.labels.txt_4b1fb1` | `projects` | **B** | تجربة فحص التضارب الزمني | Test Temporal Conflict Check | وقتی تنازع کی جانچ کا ٹیسٹ | `REVIEW_REQUIRED` |
| 9 | `projects.labels.txt_6e8506` | `projects` | **B** | صلاحيات الوصول | Access Permissions | رسائی کے اختیارات | `REVIEW_REQUIRED` |
| 10 | `offline.labels.edit_2` | `offline` | **B** | VERSION_CONFLICT توازي التعديل | VERSION_CONFLICT Concurrent Modification | VERSION_CONFLICT ہم وقت ترمیم | `REVIEW_REQUIRED` |
| 11 | `offline.labels.editMaterial` | `offline` | **B** | MASTER_DATA_CHANGED إيقاف أو تعديل المادة | MASTER_DATA_CHANGED Material Deactivated or Modified | MASTER_DATA_CHANGED مٹیریل معطل یا تبدیل ہو گیا | `REVIEW_REQUIRED` |
| 12 | `offline.labels.filter` | `offline` | **B** | التصفية: | Filter: | فلٹر: | `REVIEW_REQUIRED` |
| 13 | `offline.labels.save` | `offline` | **B** | حفظ الأمرين: | Preserve Both Commands: | دونوں احکامات کا تحفظ: | `REVIEW_REQUIRED` |
| 14 | `offline.labels.save_2` | `offline` | **B** | يتم تجميد الأمر المحلي وحفظ حالة الخادم وإصدار سجل تعارض موثق في IndexedDB. | The local command is frozen, the server state is saved, and a documented conflict record is generated in IndexedDB. | مقامی کمانڈ منجمد کر دی جاتی ہے، سرور کی حالت محفوظ کی جاتی ہے، اور IndexedDB میں ایک دستاویزی تنازع کا ریکارڈ جاری کیا جاتا ہے۔ | `REVIEW_REQUIRED` |
| 15 | `offline.labels.save_3` | `offline` | **B** | برنامج فحص برمجي للتحقق من كافة القواعد والمحددات الإلزامية: الأنواع الـ 7، Anti-LWW، حفظ الأمرين، إشعار المستخدم، ثبات تسعير الـ Offline، والحل الصريح. | Automated verification suite to validate all mandatory rules and constraints: 7 conflict types, Anti-LWW, both commands preserved, user notification, Offline pricing stability, and explicit resolution. | تمام لازمی قواعد اور شرائط کی تصدیق کے لیے پروگرامنگ جانچ: 7 اقسام، Anti-LWW، دونوں احکامات کا تحفظ، صارف کو اطلاع، Offline قیمت کا استحکام، اور واضح حل۔ | `REVIEW_REQUIRED` |
| 16 | `offline.labels.trip_2` | `offline` | **B** | التذكرة محجوزة لرحلة سابقة | Ticket is reserved for a previous trip | ٹکٹ پچھلی ٹرپ کے لیے پہلے سے مخصوص ہے | `REVIEW_REQUIRED` |
| 17 | `offline.labels.txt_10b6c4` | `offline` | **B** | جميع العمليات متوافقة مع الخادم. يمكنك الضغط على أي زر في المحاكي أعلاه لاختبار منظومة معالجة التعارضات وحماية لقطات التسعير. | All operations are synchronized with the server. You can click any button in the simulator above to test the conflict resolution engine and pricing snapshot protection. | تمام آپریشنز سرور کے ساتھ ہم آہنگ ہیں۔ آپ تنازعات کے حل کے نظام اور قیمتوں کے اسنیپ شاٹ کے تحفظ کی جانچ کے لیے اوپر والے سمیلیٹر میں کسی بھی بٹن پر کلک کر سکتے ہیں۔ | `REVIEW_REQUIRED` |
| 18 | `offline.labels.txt_140117` | `offline` | **B** | حالة IndexedDB المحلية، طابور الصادر Outbox، وخطوات المزامنة الخادومية | Local IndexedDB State, Outbox Queue, and Server Synchronization Steps | مقامی IndexedDB کی حالت، Outbox کی قطار، اور سرور مطابقت پذیری کے مراحل | `REVIEW_REQUIRED` |
| 19 | `offline.labels.txt_32233e` | `offline` | **B** | 5. تكرار تذكرة | 5. Duplicate Ticket | 5. ڈپلیکیٹ ٹکٹ | `REVIEW_REQUIRED` |
| 20 | `offline.labels.txt_3bb240` | `offline` | **B** | جاري الإرسال SENDING | SENDING in progress | بھیجا جا رہا ہے (SENDING) | `REVIEW_REQUIRED` |
| 21 | `offline.labels.txt_4043c4` | `offline` | **B** | تنظيف العمليات المزامنة | Clean Up Synchronized Operations | مطابقت پذیر آپریشنز کو صاف کریں | `REVIEW_REQUIRED` |
| 22 | `offline.labels.txt_41cc14` | `offline` | **B** | جاهز للاستخدام Offline | Ready for Offline Use | آف لائن استعمال کے لیے تیار | `REVIEW_REQUIRED` |
| 23 | `offline.labels.txt_46be08` | `offline` | **B** | حل التعارض الصريح | Explicit Conflict Resolution | واضح تنازع کا حل | `REVIEW_REQUIRED` |
| 24 | `offline.labels.txt_4e058d` | `offline` | **B** | 2. تعارض إصدار | 2. Version Conflict | 2. ورژن کا تنازع | `REVIEW_REQUIRED` |
| 25 | `offline.labels.txt_532950` | `offline` | **B** | جاري المحاكاة... | Simulating... | نقالی جاری ہے... | `REVIEW_REQUIRED` |
| 26 | `offline.labels.txt_539bb6` | `offline` | **B** | يتم التحقق من وجود جميع Master Data (المشروع، الناقل، الشاحنة، السائق، المادة) في IndexedDB. | Verifying presence of all Master Data (Project, Carrier, Truck, Driver, Material) in IndexedDB. | IndexedDB میں تمام Master Data (پروجیکٹ، کیریئر، ٹرک، ڈرائیور، مٹیریل) کی موجودگی کی تصدیق کی جا رہی ہے۔ | `REVIEW_REQUIRED` |
| 27 | `offline.labels.txt_5542eb` | `offline` | **B** | إدارة عدم الاتصال والمزامنة (Offline-First PWA) | Offline Management and Synchronization (Offline-First PWA) | آف لائن انتظام اور مطابقت پذیری (Offline-First PWA) | `REVIEW_REQUIRED` |
| 28 | `offline.labels.txt_5753f6` | `offline` | **B** | لا يتم استبدال البيانات التشغيلية للرحلات تلقائياً، بل يُلزم المشرف بالحل الصريح. | Operational trip data is not replaced automatically; supervisor explicit resolution is required. | ٹرپس کا آپریشنل ڈیٹا خودکار طور پر تبدیل نہیں ہوتا، بلکہ سپروائزر پر واضح حل کو لازمی قرار دیا گیا ہے۔ | `REVIEW_REQUIRED` |
| 29 | `offline.labels.txt_6464df` | `offline` | **B** | عدد السجلات: | Record Count: | ریکارڈز کی تعداد: | `REVIEW_REQUIRED` |
| 30 | `offline.labels.txt_6526c5` | `offline` | **B** | المحاولات: | Attempts: | کوششیں: | `REVIEW_REQUIRED` |
| 31 | `offline.labels.txt_66cc97` | `offline` | **B** | قاعدة إلزامية: | Mandatory Rule: | لازمی قاعدہ: | `REVIEW_REQUIRED` |
| 32 | `offline.labels.txt_712649` | `offline` | **B** | فحص التحقق الآلي للتعارضات (Automated Conflict Test Suite) | Automated Conflict Test Suite Verification | تنازعات کے لیے خودکار تصدیقی ٹیسٹ سوٹ (Automated Conflict Test Suite) | `REVIEW_REQUIRED` |
| 33 | `offline.labels.txt_731fc0` | `offline` | **B** | تمت المزامنة SYNCED | SYNCED | مطابقت پذیر (SYNCED) | `REVIEW_REQUIRED` |
| 34 | `offline.labels.txt_7490af` | `offline` | **B** | الطابع الزمني: | Timestamp: | ٹائم اسٹیمپ: | `REVIEW_REQUIRED` |
| 35 | `offline.labels.txt_751d01` | `offline` | **B** | تعارض CONFLICT | Conflict (CONFLICT) | تنازع (CONFLICT) | `REVIEW_REQUIRED` |
| 36 | `offline.labels.txt_759c62` | `offline` | **B** | 7. تغيير بيانات أساسية | 7. Master Data Change | 7. بنیادی ڈیٹا کی تبدیلی | `REVIEW_REQUIRED` |
| 37 | `offline.labels.txt_7eabcf` | `offline` | **B** | قيد الانتظار PENDING | PENDING | زیر التواء (PENDING) | `REVIEW_REQUIRED` |
| 38 | `offline.labels.txt_8b427e` | `offline` | **B** | مسح المؤكدة | Clear Confirmed | تصدیق شدہ کو صاف کریں | `REVIEW_REQUIRED` |
| 39 | `offline.labels.txt_a748f4` | `offline` | **B** | إعادة فحص (Retry) | Retry Check (Retry) | دوبارہ جانچ کریں (Retry) | `REVIEW_REQUIRED` |
| 40 | `offline.labels.txt_a9b605` | `offline` | **B** | المبرر التدقيقي: | Audit Justification: | آڈٹ کا جواز: | `REVIEW_REQUIRED` |
| 41 | `offline.messages.txt_2165a5` | `offline` | **B** | تمت إعادة تعيين العملية إلى حالة الانتظار (PENDING). ستتم المزامنة عند الاتصال. | Operation reset to pending status (PENDING). It will sync upon connection. | آپریشن کو زیر التواء حالت (PENDING) پر دوبارہ ترتیب دیا گیا ہے۔ کنکشن بحال ہونے پر مطابقت پذیری ہوگی۔ | `REVIEW_REQUIRED` |
| 42 | `offline.messages.txt_36ec7e` | `offline` | **B** | لا يمكن بدء المزامنة: التطبيق في وضع عدم الاتصال (Offline). | Cannot start synchronization: application is in offline mode (Offline). | مطابقت پذیری شروع نہیں ہو سکتی: ایپلیکیشن آف لائن موڈ (Offline) میں ہے۔ | `REVIEW_REQUIRED` |
| 43 | `offline.status.failed_2` | `offline` | **B** | فشل الفحص: اجتاز ${testSuiteResult.passedTests} وفشل ${testSuiteResult.failedTests} | Check failed: passed ${testSuiteResult.passedTests} and failed ${testSuiteResult.failedTests} | جانچ ناکام: ${testSuiteResult.passedTests} کامیاب اور ${testSuiteResult.failedTests} ناکام ہوئے | `REVIEW_REQUIRED` |
| 44 | `offline.status.pending_2` | `offline` | **B** | تنبيه تسعير معلق (Pending Pricing Resolution): | Pending Pricing Resolution Alert: | زیر التواء قیمت کے حل کا الرٹ (Pending Pricing Resolution): | `REVIEW_REQUIRED` |
| 45 | `offline.status.success` | `offline` | **B** | اجتازت جميع اختبارات التعارضات (${res.passedTests}/${res.totalTests}) بنجاح تام وفق المحددات الإلزامية. | All conflict tests passed (${res.passedTests}/${res.totalTests}) successfully according to mandatory criteria. | تمام تنازعات کے ٹیسٹ (${res.passedTests}/${res.totalTests}) لازمی معیارات کے مطابق مکمل کامیابی سے پاس ہو گئے۔ | `REVIEW_REQUIRED` |
| 46 | `offline.status.txt_177559` | `offline` | **B** | فشلت FAILED | FAILED | ناکام ہو گیا (FAILED) | `REVIEW_REQUIRED` |
| 47 | `weighbridge.labels.txt_355854` | `weighbridge` | **B** | اعتماد صافي المصدر كصافي وصول: | Approve Source Net Weight as Arrival Net Weight: | ماخذ کے خالص وزن کو آمد کے خالص وزن کے طور پر منظور کریں: | `REVIEW_REQUIRED` |
| 48 | `weighbridge.labels.txt_3b5d97` | `weighbridge` | **B** | تمنع الاعتماد حتمياً | Strictly Prevents Approval | منظوری کو قطعی طور پر روکتا ہے | `REVIEW_REQUIRED` |
| 49 | `weighbridge.labels.txt_405131` | `weighbridge` | **B** | تفاوت نسبة (%) | Percentage Tolerance (%) | فیصد رواداری (%) | `REVIEW_REQUIRED` |
| 50 | `weighbridge.labels.txt_44da4c` | `weighbridge` | **B** | وحدة مستقلة تتولى حصرياً العمليات الحسابية للأوزان، فروقات التحميل، تقييم التفاوت (مطلق / نسبة / كلاهما) مع مخرجات الحالات (NORMAL / WARNING / EXCEPTION)، واحتساب التسويات المالية وفق قواعد التحقق الصارمة. | An independent module exclusively responsible for weight computations, loading variances, tolerance evaluations (absolute / percentage / both) with status outputs (NORMAL / WARNING / EXCEPTION), and financial settlements calculation under strict validation rules. | ایک خود مختار ماڈیول جو خصوصی طور پر وزن کے حسابات، لوڈنگ کے فرق، رواداری کی جانچ (مطلق / فیصد / دونوں) مع اسٹیٹس آؤٹ پٹ (NORMAL / WARNING / EXCEPTION)، اور سخت تصدیقی قواعد کے تحت مالی تصفیوں کے حساب کا ذمہ دار ہے۔ | `REVIEW_REQUIRED` |
| 51 | `weighbridge.labels.txt_46d801` | `weighbridge` | **B** | القائم (كجم) | Gross Weight (KG) | مجموعی وزن (KG) | `REVIEW_REQUIRED` |
| 52 | `weighbridge.labels.txt_487f8f` | `weighbridge` | **B** | tare = 0 (مرفوض) | tare = 0 (rejected) | tare = 0 (مسترد) | `REVIEW_REQUIRED` |
| 53 | `weighbridge.labels.txt_4c9996` | `weighbridge` | **B** | جاري الاعتماد وتوليد الرحلات... | Approving and generating trips... | منظوری اور ٹرپس کی تیاری جاری ہے... | `REVIEW_REQUIRED` |
| 54 | `weighbridge.labels.txt_4dce1b` | `weighbridge` | **B** | نوع التفاوت المسموح | Permitted Tolerance Type | مجاز رواداری کی قسم | `REVIEW_REQUIRED` |
| 55 | `weighbridge.labels.txt_4ee2df` | `weighbridge` | **B** | أقر بالموافقة على اعتماد الصفوف المتضمنة تحذيرات (مثل شحنات بدون بيانات تفريغ). | I acknowledge and approve rows containing warnings (such as shipments without discharge data). | میں انتباہات پر مشتمل قطاروں کی منظوری تسلیم اور منظور کرتا ہوں (جیسے کہ ان لوڈنگ ڈیٹا کے بغیر ترسیلات)۔ | `REVIEW_REQUIRED` |
| 56 | `weighbridge.labels.txt_504ae8` | `weighbridge` | **B** | 0.00 كجم | 0.00 KG | 0.00 KG | `REVIEW_REQUIRED` |
| 57 | `weighbridge.labels.txt_518cd3` | `weighbridge` | **B** | محرك حسابي خادومي | Server-Side Computational Engine | سرور سائیڈ کمپیوٹیشنل انجن | `REVIEW_REQUIRED` |
| 58 | `weighbridge.labels.txt_577d5a` | `weighbridge` | **B** | عجز كبير (-2500 كجم) | Significant Shortage (-2500 KG) | بڑی کمی (-2500 KG) | `REVIEW_REQUIRED` |
| 59 | `weighbridge.labels.txt_579085` | `weighbridge` | **B** | تفاوت مطلق (كجم) | Absolute Tolerance (KG) | مطلق رواداری (KG) | `REVIEW_REQUIRED` |
| 60 | `weighbridge.labels.txt_58cd17` | `weighbridge` | **B** | حالة التدقيق | Audit Status | آڈٹ کی حالت | `REVIEW_REQUIRED` |
| 61 | `weighbridge.labels.txt_5b4968` | `weighbridge` | **B** | مفقود | Missing | غائب | `REVIEW_REQUIRED` |
| 62 | `weighbridge.labels.txt_5c97fe` | `weighbridge` | **B** | percentage (نسبة فقط) | percentage (percentage only) | percentage (صرف فیصد) | `REVIEW_REQUIRED` |
| 63 | `weighbridge.labels.txt_5e145b` | `weighbridge` | **B** | تم القبول الرقابي | Regulatory Approval Granted | نگرانی کی منظوری مل گئی | `REVIEW_REQUIRED` |
| 64 | `weighbridge.labels.txt_600341` | `weighbridge` | **B** | المصدر التشغيلي المسجل: | Recorded Operational Source: | درج شدہ آپریشنل ماخذ: | `REVIEW_REQUIRED` |
| 65 | `weighbridge.labels.txt_609ec2` | `weighbridge` | **B** | فحص تطابق الأوزان، احتساب الصافي، التحقق من الحقول الإلزامية، وتطبيق قرار قبول صافي المصدر كصافي وصول. | Verifying weight matching, calculating net weight, validating mandatory fields, and applying decision to accept source net weight as arrival net weight. | وزن کی مطابقت کی جانچ، خالص وزن کا حساب، لازمی فیلڈز کی تصدیق، اور ماخذ کے خالص وزن کو آمد کے خالص وزن کے طور پر قبول کرنے کے فیصلے کا اطلاق۔ | `REVIEW_REQUIRED` |
| 66 | `weighbridge.labels.txt_60b8a5` | `weighbridge` | **B** | تجربة مخرج: NORMAL (-120 كجم) | Output Test: NORMAL (-120 KG) | آؤٹ پٹ ٹیسٹ: NORMAL (-120 KG) | `REVIEW_REQUIRED` |
| 67 | `weighbridge.labels.txt_641620` | `weighbridge` | **B** | المخرج (Output): | Output: | آؤٹ پٹ (Output): | `REVIEW_REQUIRED` |
| 68 | `weighbridge.labels.txt_65ecd8` | `weighbridge` | **B** | صافي معتمد | Approved Net Weight | منظور شدہ خالص وزن | `REVIEW_REQUIRED` |
| 69 | `weighbridge.labels.txt_68c5e6` | `weighbridge` | **B** | — (غير متوفر) | — (Not available) | — (دستیاب نہیں) | `REVIEW_REQUIRED` |
| 70 | `weighbridge.labels.txt_6e04d1` | `weighbridge` | **B** | محسوب (gross-tare) | Calculated (gross-tare) | حساب شدہ (gross-tare) | `REVIEW_REQUIRED` |
| 71 | `weighbridge.labels.txt_6e06f6` | `weighbridge` | **B** | 37,400 كجم (37.4 طن) | 37,400 KG (37.4 TON) | 37,400 KG (37.4 TON) | `REVIEW_REQUIRED` |
| 72 | `weighbridge.labels.txt_70030c` | `weighbridge` | **B** | المصدر التشغيلي: WEIGHBRIDGE | Operational Source: WEIGHBRIDGE | آپریشنل ماخذ: WEIGHBRIDGE | `REVIEW_REQUIRED` |
| 73 | `weighbridge.labels.txt_709573` | `weighbridge` | **B** | الفارق المراد فحصه (variance) | Variance to Check (variance) | جانچ کے لیے مطلوبہ فرق (variance) | `REVIEW_REQUIRED` |
| 74 | `weighbridge.labels.txt_70b26a` | `weighbridge` | **B** | بدون تفريغ (تحذير) | Without Discharge (Warning) | ان لوڈنگ کے بغیر (انتباہ) | `REVIEW_REQUIRED` |
| 75 | `weighbridge.labels.txt_722bae` | `weighbridge` | **B** | absolute (مطلق فقط) | absolute (absolute only) | absolute (صرف مطلق) | `REVIEW_REQUIRED` |
| 76 | `weighbridge.labels.txt_72ad0e` | `weighbridge` | **B** | المعالجة تتوقف إلزامياً عند مرحلة المراجعة (REVIEW) ولا تُنشئ رحلات أو تكتب في قاعدة البيانات إلا بعد الاعتماد الصريح (COMMIT). | Processing strictly halts at the review stage (REVIEW) and does not create trips or write to the database until explicit approval (COMMIT). | پروسیسنگ لازمی طور پر جائزہ کے مرحلے (REVIEW) پر رک جاتی ہے اور واضح منظوری (COMMIT) تک نہ تو ٹرپس تخلیق کرتی ہے اور نہ ہی ڈیٹا بیس میں درج کرتی ہے۔ | `REVIEW_REQUIRED` |
| 77 | `weighbridge.labels.txt_78dd06` | `weighbridge` | **B** | إعادة الفحص الآن | Recheck Now | ابھی دوبارہ جانچ کریں | `REVIEW_REQUIRED` |
| 78 | `weighbridge.labels.txt_a59113` | `weighbridge` | **B** | الفارغ (كجم) | Tare Weight (KG) | خالی گاڑی کا وزن (KG) | `REVIEW_REQUIRED` |
| 79 | `weighbridge.labels.txt_aced6f` | `weighbridge` | **B** | loadedNet = 0 (مرفوض) | loadedNet = 0 (rejected) | loadedNet = 0 (مسترد) | `REVIEW_REQUIRED` |
| 80 | `weighbridge.labels.weighbridge` | `weighbridge` | **B** | موقع أو كبينة الميزان | Weighbridge Location or Cabin | وزن کے پل کا مقام یا کیبن | `REVIEW_REQUIRED` |
| 81 | `weighbridge.labels.weighbridge_4` | `weighbridge` | **B** | دفعة الميزان في مرحلة المراجعة (Review Stage - Human Gate) | Weighbridge Batch in Review Stage (Review Stage - Human Gate) | وزن کے پل کی کھیپ جائزہ کے مرحلے میں (Review Stage - Human Gate) | `REVIEW_REQUIRED` |
| 82 | `weighbridge.labels.weighbridge_6` | `weighbridge` | **B** | اعتماد دفعة الميزان نهائياً (COMMIT) | Finalize Weighbridge Batch Approval (COMMIT) | وزن کے پل کی کھیپ کی حتمی منظوری (COMMIT) | `REVIEW_REQUIRED` |
| 83 | `weighbridge.messages.txt_5d74e2` | `weighbridge` | **B** | تمت إعادة ضبط ذاكرة التحقق التكراري (Idempotency Cache) للاختبار. | Idempotency cache has been reset for testing. | جانچ کے لیے آئیڈیمپوٹینسی کیشے دوبارہ ترتیب دے دی گئی ہے۔ | `REVIEW_REQUIRED` |
| 84 | `offline.labels.pricing` | `pricing` | **B** | قواعد التسعير (Pricing Rules) | Pricing Rules | قیمت کے قواعد (Pricing Rules) | `REVIEW_REQUIRED` |
| 85 | `materials.labels.deleteMaterial` | `projects` | **B** | حذف المادة | Delete Material | مٹیریل حذف کریں | `REVIEW_REQUIRED` |
| 86 | `materials.labels.status_2` | `projects` | **B** | الحالة (Status) | Status | حالت (Status) | `REVIEW_REQUIRED` |
| 87 | `navigation.labels.project_7` | `projects` | **B** | سجل المشروع (Google Sheets) | Project Log (Google Sheets) | پروجیکٹ لاگ (Google Sheets) | `REVIEW_REQUIRED` |
| 88 | `other.labels.carrier_3` | `projects` | **B** | تعطيل الناقل (تحويل إلى INACTIVE) | Deactivate Carrier (Set to INACTIVE) | کیریئر کو معطل کریں (INACTIVE میں تبدیل کریں) | `REVIEW_REQUIRED` |
| 89 | `other.labels.carrier_4` | `projects` | **B** | تفعيل الناقل (تحويل إلى ACTIVE) | Activate Carrier (Set to ACTIVE) | کیریئر کو فعال کریں (ACTIVE میں تبدیل کریں) | `REVIEW_REQUIRED` |
| 90 | `other.labels.carrier_7` | `projects` | **B** | الناقل التابع له (Driver → Carrier): | Associated Carrier (Driver → Carrier): | منسلک کیریئر (Driver → Carrier): | `REVIEW_REQUIRED` |
| 91 | `other.labels.carrierProject_2` | `projects` | **B** | تبديل تصريح الناقل لهذا المشروع | Toggle Carrier Authorization for this Project | اس پروجیکٹ کے لیے کیریئر کی اجازت تبدیل کریں | `REVIEW_REQUIRED` |
| 92 | `other.labels.carriers_4` | `projects` | **B** | الناقلون المسجلون | Registered Carriers | رجسٹرڈ کیریئرز | `REVIEW_REQUIRED` |
| 93 | `other.labels.createProject` | `projects` | **B** | إنشاء وثيقة المشروع الرئيسية في /projects/{projectId} | Create main project document at /projects/{projectId} | /projects/{projectId} پر مرکزی پروجیکٹ دستاویز بنائیں | `REVIEW_REQUIRED` |
| 94 | `other.labels.delete` | `projects` | **B** | أنت تحاول حذف السجل: | You are attempting to delete the record: | آپ ریکارڈ حذف کرنے کی کوشش کر رہے ہیں: | `REVIEW_REQUIRED` |
| 95 | `other.labels.delete_2` | `projects` | **B** | حذف کریں | Delete | حذف کریں | `REVIEW_REQUIRED` |
| 96 | `other.labels.delete_3` | `projects` | **B** | تم الحذف | Deleted | حذف کر دیا گیا | `REVIEW_REQUIRED` |
| 97 | `other.labels.delete_5` | `projects` | **B** | ممنوع الحذف الفعلي (Hard Delete) في النظام المعماري. استخدم ACTIVE/INACTIVE بدلاً من hard delete. | Hard delete is prohibited in system architecture. Use ACTIVE/INACTIVE instead of hard delete. | سسٹم آرکیٹیکچر میں قطعی حذف (Hard Delete) ممنوع ہے۔ hard delete کے بجائے ACTIVE/INACTIVE استعمال کریں۔ | `REVIEW_REQUIRED` |
| 98 | `other.labels.delete_6` | `projects` | **B** | ممنوع حذف | Deletion Prohibited | حذف کرنا ممنوع ہے | `REVIEW_REQUIRED` |
| 99 | `other.labels.driver_2` | `projects` | **B** | تعطيل السائق (تحويل إلى INACTIVE) | Deactivate Driver (Set to INACTIVE) | ڈرائیور کو معطل کریں (INACTIVE میں تبدیل کریں) | `REVIEW_REQUIRED` |
| 100 | `other.labels.driver_3` | `projects` | **B** | تفعيل السائق (تحويل إلى ACTIVE) | Activate Driver (Set to ACTIVE) | ڈرائیور کو فعال کریں (ACTIVE میں تبدیل کریں) | `REVIEW_REQUIRED` |
| 101 | `projects.labels.txt_2d2a83` | `projects` | **C** | استعادة نموذج نيوم التجريبي | Restore NEOM Demo Template | نیوم ڈیمو ٹیمپلیٹ بحال کریں | `REVIEW_REQUIRED` |
| 102 | `offline.labels.txt_31f297` | `offline` | **C** | محاكاة انقطاع الإنترنت: | Internet Disconnection Simulation: | انٹرنیٹ منقطع ہونے کی نقالی: | `REVIEW_REQUIRED` |
| 103 | `offline.labels.txt_3f37a7` | `offline` | **C** | حالة الشبكة: متصل بالإنترنت (Online) | Network Status: Connected to Internet (Online) | نیٹ ورک کی حالت: انٹرنیٹ سے منسلک (Online) | `REVIEW_REQUIRED` |
| 104 | `offline.labels.txt_44754a` | `offline` | **C** | منع "آخر كتابة تفوز" (No LWW): | Prevent "Last-Write-Wins" (No LWW): | "آخری تحریر کی جیت" کی روک تھام (No LWW): | `REVIEW_REQUIRED` |
| 105 | `offline.labels.txt_47ad3c` | `offline` | **C** | معالجة التعارضات (Conflicts) | Conflict Resolution (Conflicts) | تنازعات کا حل (Conflicts) | `REVIEW_REQUIRED` |
| 106 | `offline.labels.txt_519208` | `offline` | **C** | الذاكرة المحلية IndexedDB (Master Data) | Local Storage IndexedDB (Master Data) | مقامی اسٹوریج IndexedDB (Master Data) | `REVIEW_REQUIRED` |
| 107 | `offline.labels.txt_55319d` | `offline` | **C** | محاكي التعارضات التشغيلية (Interactive Conflict Simulator) | Operational Conflict Simulator (Interactive Conflict Simulator) | آپریشنل تنازعات کا سمیلیٹر (Interactive Conflict Simulator) | `REVIEW_REQUIRED` |
| 108 | `offline.labels.txt_5cde42` | `offline` | **C** | تتم الحسابات المالية وصافي الأوزان محلياً وتُدرج في Outbox بحالة PENDING حتى عودة الاتصال. | Financial calculations and net weights are computed locally and queued in Outbox with PENDING status until connectivity is restored. | مالی حسابات اور خالص وزن کا حساب مقامی طور پر لگایا جاتا ہے اور کنکشن بحال ہونے تک PENDING حالت کے ساتھ Outbox میں شامل کیا جاتا ہے۔ | `REVIEW_REQUIRED` |
| 109 | `offline.labels.txt_5fc250` | `offline` | **C** | TRIP_ALREADY_RETURNED مرفوضة | TRIP_ALREADY_RETURNED Rejected | TRIP_ALREADY_RETURNED مسترد | `REVIEW_REQUIRED` |
| 110 | `offline.labels.txt_66c55e` | `offline` | **C** | طابور الصادر (Outbox Queue) | Outbox Queue | آؤٹ باکس کی قطار (Outbox Queue) | `REVIEW_REQUIRED` |
| 111 | `offline.labels.txt_6aae4c` | `offline` | **C** | سريان الأسعار الجديدة: | Effective Date of New Prices: | نئی قیمتوں کا نفاذ: | `REVIEW_REQUIRED` |
| 112 | `offline.labels.txt_6aaee2` | `offline` | **C** | حماية تسعير الـ Offline: | Offline Pricing Protection: | آف لائن قیمتوں کا تحفظ (Offline): | `REVIEW_REQUIRED` |
| 113 | `offline.labels.txt_6fc0d8` | `offline` | **C** | سجل تخزين Master Data في IndexedDB | Master Data Storage Record in IndexedDB | IndexedDB میں Master Data کے ذخیرے کا ریکارڈ | `REVIEW_REQUIRED` |
| 114 | `offline.labels.txt_74ecba` | `offline` | **C** | حالة الشبكة: غير متصل (Offline Mode) | Network Status: Disconnected (Offline Mode) | نیٹ ورک کی حالت: منقطع (Offline Mode) | `REVIEW_REQUIRED` |
| 115 | `offline.labels.txt_7eb4ca` | `offline` | **C** | TRUCK_CARRIER_CONFLICT تبعية | TRUCK_CARRIER_CONFLICT Dependency | TRUCK_CARRIER_CONFLICT انحصار | `REVIEW_REQUIRED` |
| 116 | `offline.labels.txt_9a78d6` | `offline` | **C** | معايير التشغيل بدون اتصال (Offline Rules): | Offline Operating Standards (Offline Rules): | آف لائن آپریشن کے معیارات (Offline Rules): | `REVIEW_REQUIRED` |
| 117 | `offline.labels.txt_9b46da` | `offline` | **C** | لا توجد عمليات في هذا التصنيف | No operations found in this category | اس زمرے میں کوئی آپریشنز موجود نہیں ہیں | `REVIEW_REQUIRED` |
| 118 | `weighbridge.labels.txt_6ff41d` | `weighbridge` | **C** | gross &lt; tare (مرفوض) | gross < tare (rejected) | gross < tare (مسترد) | `REVIEW_REQUIRED` |
| 119 | `weighbridge.labels.txt_780026` | `weighbridge` | **C** | النتيجة المُرجعة (netWeight): | Returned Result (netWeight): | واپس کردہ نتیجہ (netWeight): | `REVIEW_REQUIRED` |
| 120 | `weighbridge.labels.txt_7a0944` | `weighbridge` | **C** | net = 0 (مرفوض ➔ null) | net = 0 (rejected ➔ null) | net = 0 (مسترد ➔ null) | `REVIEW_REQUIRED` |
| 121 | `weighbridge.labels.txt_7fffbf` | `weighbridge` | **C** | دوال المحرك الـ 4 (Functions Sandbox) | 4 Engine Functions (Functions Sandbox) | انجن کے 4 فنکشنز (Functions Sandbox) | `REVIEW_REQUIRED` |
| 122 | `weighbridge.labels.txt_cd2e11` | `weighbridge` | **C** | دعم أنواع التفاوت: absolute \ | Supported tolerance types: absolute / percentage / both | رواداری کی معاون اقسام: absolute / percentage / both | `REVIEW_REQUIRED` |
| 123 | `weighbridge.labels.txt_d894c3` | `weighbridge` | **C** | تفاوت نسبة (percentageTolerance) | Percentage Tolerance (percentageTolerance) | فیصد رواداری (percentageTolerance) | `REVIEW_REQUIRED` |
| 124 | `weighbridge.labels.weighbridge_2` | `weighbridge` | **C** | ملاحظات إضافية على تذكرة الميزان | Additional Notes on Weighbridge Ticket | وزن کے پل کے ٹکٹ پر اضافی نوٹس | `REVIEW_REQUIRED` |
| 125 | `weighbridge.labels.weighbridge_3` | `weighbridge` | **C** | محتوى ملف الميزان (CSV Text / Raw Input): | Weighbridge File Content (CSV Text / Raw Input): | وزن کے پل کی فائل کا مواد (CSV Text / Raw Input): | `REVIEW_REQUIRED` |
| 126 | `weighbridge.labels.weighbridge_7` | `weighbridge` | **C** | جدول مراجعة تذاكر الميزان والأوزان (Weighbridge Review Table) | Weighbridge Review Table and Weights (Weighbridge Review Table) | وزن کے پل کے ٹکٹوں اور اوزان کا جائزہ ٹیبل (Weighbridge Review Table) | `REVIEW_REQUIRED` |
| 127 | `trips.labels.txt_752683` | `security` | **C** | سيناريو 7: اختبار أمان الأوزان - رفض netWeight من العميل وحسابه خادومياً | Scenario 7: Weight Security Test - Reject client netWeight and compute on server | منظرنامہ 7: وزن کی حفاظت کا ٹیسٹ - کلائنٹ کے netWeight کو مسترد کرنا اور سرور پر حساب لگانا | `REVIEW_REQUIRED` |
| 128 | `offline.labels.pricing_2` | `pricing` | **C** | قاعدة التسعير المحلية خارج نطاق الصلاحية للتشغيل (${pricingRule.effectiveFrom} إلى ${pricingRule.effectiveTo}) | Local pricing rule is out of operational validity range (${pricingRule.effectiveFrom} to ${pricingRule.effectiveTo}) | مقامی قیمت کا اصول آپریشنل میعاد کی حد سے باہر ہے (${pricingRule.effectiveFrom} تا ${pricingRule.effectiveTo}) | `REVIEW_REQUIRED` |
| 129 | `other.labels.txt_24cc60` | `projects` | **C** | هيكل المجلدات والأوراق السحابية التي سيتم إنشاؤها تلقائياً: | Structure of cloud folders and sheets to be automatically created: | کلاؤڈ فولڈرز اور شیٹس کا ڈھانچہ جو خودکار طور پر تیار کیا جائے گا: | `REVIEW_REQUIRED` |
| 130 | `other.labels.txt_330dcc` | `projects` | **C** | 📂 مجلدات Google Drive: | 📂 Google Drive Folders: | 📂 Google Drive فولڈرز: | `REVIEW_REQUIRED` |
| 131 | `other.labels.txt_34897c` | `projects` | **C** | تعطيل السجل (تحويل إلى INACTIVE) | Deactivate Record (Set to INACTIVE) | ریکارڈ کو معطل کریں (INACTIVE میں تبدیل کریں) | `REVIEW_REQUIRED` |
| 132 | `other.labels.txt_412551` | `projects` | **C** | توليد التسميات الآلية للمشروع | Generate Automated Project Labels | پروجیکٹ کے لیے خودکار لیبلز تیار کریں | `REVIEW_REQUIRED` |
| 133 | `other.labels.txt_4755d8` | `projects` | **C** | الإجراء النظامي المتاح: | Available Regulatory Action: | دستیاب قانونی کارروائی: | `REVIEW_REQUIRED` |
| 134 | `other.labels.txt_486bf8` | `projects` | **C** | وضع الاستعراض والتجربة (Preview Mode) | Preview and Trial Mode (Preview Mode) | معائنہ اور آزمائشی موڈ (Preview Mode) | `REVIEW_REQUIRED` |
| 135 | `other.labels.txt_558322` | `projects` | **C** | تفعيل التهيئة الآلية لمساحة عمل Google Drive و Sheets | Enable Automated Provisioning for Google Drive and Sheets Workspace | Google Drive اور Sheets ورک اسپیس کی خودکار تیاری کو فعال کریں | `REVIEW_REQUIRED` |
| 136 | `other.labels.txt_5860fa` | `projects` | **C** | المصنف المالي والتشغيلي المتزامن لحظياً مع Firestore. | Financial and operational workbook synchronized in real time with Firestore. | مالی اور آپریشنل ورک بک جو Firestore کے ساتھ فوری طور پر مطابقت پذیر ہوتی ہے۔ | `REVIEW_REQUIRED` |
| 137 | `other.labels.txt_63748e` | `projects` | **C** | يمكنك تحويل حالة السجل إلى | You can change record status to | آپ ریکارڈ کی حالت تبدیل کر سکتے ہیں | `REVIEW_REQUIRED` |
| 138 | `other.labels.txt_674f3e` | `projects` | **C** | اضغط على زر «إعادة تشغيل الاختبارات» لتشغيل الحزمة فورياً. | Click "Rerun Tests" to run the test suite immediately. | ٹیسٹ سوٹ کو فوری طور پر چلانے کے لیے «ٹیسٹ دوبارہ چلائیں» کے بٹن پر کلک کریں۔ | `REVIEW_REQUIRED` |
| 139 | `other.labels.txt_68f9e8` | `projects` | **C** | السجل التجاري (10 أرقام): | Commercial Registration (10 digits): | تجارتی رجسٹریشن (10 ہندسے): | `REVIEW_REQUIRED` |
| 140 | `other.labels.txt_71317d` | `projects` | **C** | جارٍ تنفيذ السيناريوهات الاختبارية في الذاكرة ومستودع Firestore... | Executing test scenarios in memory and Firestore repository... | میموری اور Firestore ریپوزٹری میں آزمائشی منظرنامے چلائے جا رہے ہیں... | `REVIEW_REQUIRED` |
| 141 | `other.labels.txt_f4c520` | `projects` | **C** | المعطلة فقط (INACTIVE) | Inactive Only (INACTIVE) | صرف غیر فعال (INACTIVE) | `REVIEW_REQUIRED` |
| 142 | `other.labels.txt_f87929` | `projects` | **C** | لم يتم استخدام هذا السجل في أي رحلات سابقة | This record has not been used in any previous trips | یہ ریکارڈ پچھلی کسی بھی ٹرپ میں استعمال نہیں ہوا ہے | `REVIEW_REQUIRED` |
| 143 | `other.labels.txt_f8afcf` | `projects` | **C** | تنبيهات تهيئة Google Workspace: | Google Workspace Configuration Alerts: | Google Workspace کنفیگریشن الرٹس: | `REVIEW_REQUIRED` |
| 144 | `other.messages.txt_197fc5` | `projects` | **C** | يتطلب تشغيل الفحوصات الآلية على Firestore تسجيل الدخول بحساب Google أولاً. | Running automated checks on Firestore requires logging in with a Google account first. | Firestore پر خودکار جانچ چلانے کے لیے پہلے Google اکاؤنٹ سے لاگ ان کرنا ضروری ہے۔ | `REVIEW_REQUIRED` |
| 145 | `other.messages.txt_731859` | `projects` | **C** | تعذر الاتصال ببيانات Firestore المباشرة، تم تفعيل وضع المعاينة المحلي. | Could not connect to live Firestore data; local preview mode activated. | براہ راست Firestore ڈیٹا سے رابطہ نہیں ہو سکا، مقامی پیش منظر موڈ فعال کر دیا گیا ہے۔ | `REVIEW_REQUIRED` |
| 146 | `projects.labels.txt_126e48` | `projects` | **C** | السماح بالتسجيل الذاتي للسائقين | Allow Driver Self-Registration | ڈرائیوروں کے خود اندراج کی اجازت دیں | `REVIEW_REQUIRED` |
| 147 | `projects.labels.txt_17e9e8` | `projects` | **C** | الجهة المالكة / العميل الرئيسي (Client Name) | Owner Entity / Main Client (Client Name) | مالک ادارہ / بنیادی کلائنٹ (Client Name) | `REVIEW_REQUIRED` |
| 148 | `projects.labels.txt_36fea4` | `projects` | **C** | العملة التشغيلية (currency) | Operating Currency (currency) | آپریشنل کرنسی (currency) | `REVIEW_REQUIRED` |
| 149 | `projects.labels.txt_4a32a9` | `projects` | **C** | مأمور حركة وميزان (DISPATCHER) | Traffic and Weighbridge Officer (DISPATCHER) | ٹریفک اور وی برج آفیسر (DISPATCHER) | `REVIEW_REQUIRED` |
| 150 | `projects.labels.txt_606611` | `projects` | **C** | مدقق مالي (FINANCE_AUDITOR) | Financial Auditor (FINANCE_AUDITOR) | مالیاتی آڈیٹر (FINANCE_AUDITOR) | `REVIEW_REQUIRED` |
