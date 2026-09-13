# BLOCK 64 — Professional Translation Quality Expansion IV Report

**Status:** COMPLETE ✅  
**GitHub Recovery Point:** BLOCK 63  
**Timestamp:** 2026-09-13T11:49:26.793Z  

## 1. Executive Summary & Defect Burn-Down

| Defect Category | Block 63 Baseline | Repaired in Block 64 | Remaining Authoritative | Status |
|---|:---:|:---:|:---:|:---:|
| **Category B (Mixed Arabic in Target)** | 252 | **100** | **152** | Progressing 🚀 |
| **Category C (Untranslated Fallback)** | 100 | **50** | **50** | Progressing 🚀 |
| **Category D (Corrupt Morphology)** | 0 | **0** | **0** | **100% ELIMINATED** |
| **Human Review Governance Queue** | 33 | **0** | **33** | Preserved (Untouched) |
| **Total Authoritative Queue** | 385 | **150** | **235** | Active Pipeline |

## 2. Domain Distribution

| Domain | Category B | Category C | Total Repaired |
|---|:---:|:---:|:---:|
| `projects` | 61 | 1 | **62** |
| `offline` | 23 | 9 | **32** |
| `entityResolution` | 16 | 27 | **43** |
| `exceptions` | 0 | 10 | **10** |
| `shared` | 0 | 3 | **3** |
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
| 1 | `other.labels.driver_6` | `projects` | **B** | السائق | Driver | ڈرائیور | `REVIEW_REQUIRED` |
| 2 | `other.labels.drivers_5` | `projects` | **B** | السائقون (Drivers) | Drivers | ڈرائیورز (Drivers) | `REVIEW_REQUIRED` |
| 3 | `other.labels.material_4` | `projects` | **B** | رمز المادة (Code) | Material Code | مٹیریل کوڈ | `REVIEW_REQUIRED` |
| 4 | `other.labels.material_6` | `projects` | **B** | تفعيل المادة (تحويل إلى ACTIVE) | Activate Material (Set to ACTIVE) | مٹیریل فعال کریں (ACTIVE میں تبدیل کریں) | `REVIEW_REQUIRED` |
| 5 | `other.labels.material_9` | `projects` | **B** | المادة الإنشائية أو الخام المنقولة ومواصفاتها الفيزيائية والتوريدية. | Transported construction or raw material with its physical and supply specifications. | منتقل کردہ تعمیراتی یا خام مٹیریل اور اس کی طبعی اور ترسیلی خصوصیات۔ | `REVIEW_REQUIRED` |
| 6 | `other.labels.materialProject_3` | `projects` | **B** | تبديل تصريح المادة لهذا المشروع | Toggle material permit for this project | اس پروجیکٹ کے لیے مٹیریل کا اجازت نامہ تبدیل کریں | `REVIEW_REQUIRED` |
| 7 | `other.labels.materials_5` | `projects` | **B** | المواد (Materials) | Materials | مٹیریلز | `REVIEW_REQUIRED` |
| 8 | `other.labels.materials_7` | `projects` | **B** | المواد المعتمدة (Step 2) | Approved Materials (Step 2) | منظور شدہ مٹیریلز (Step 2) | `REVIEW_REQUIRED` |
| 9 | `other.labels.project_4` | `projects` | **B** | ${code} - أرشيف ومستندات المشروع اللوجستية | ${code} - Project Logistics Documents and Archive | ${code} - پروجیکٹ لاجسٹکس دستاویزات اور آرکائیو | `REVIEW_REQUIRED` |
| 10 | `other.labels.project_5` | `projects` | **B** | معرف المشروع في Firestore: | Project Identifier in Firestore: | Firestore میں پروجیکٹ شناختی کوڈ: | `REVIEW_REQUIRED` |
| 11 | `other.labels.project_6` | `projects` | **B** | نسخ رمز المشروع | Copy Project Code | پروجیکٹ کوڈ کاپی کریں | `REVIEW_REQUIRED` |
| 12 | `other.labels.projects_5` | `projects` | **B** | الكيان الجذري التشغيلي والحدود المالية وحاجز عزل المشاريع (Tenant Boundary). | Root operational entity, financial perimeter, and multi-tenant isolation boundary (Tenant Boundary). | بنیادی آپریشنل اکائی، مالیاتی حدود اور کثیر صارف تنہائی کی حد (Tenant Boundary)۔ | `REVIEW_REQUIRED` |
| 13 | `other.labels.refresh_2` | `projects` | **B** | العميل يرسل مقترحات أحداث، بينما الخادم هو الكيان الوحيد المخول باعتماد التغيير وتحديث حالة الرحلة. | Client submits proposed events, while the server is the sole authoritative entity authorized to approve changes and update trip status. | کلائنٹ مجوزہ واقعات بھیجتا ہے، جبکہ سرور واحد بااختیار ادارہ ہے جو تبدیلیوں کی منظوری اور ٹرپ کی حالت کو اپ ڈیٹ کرنے کا مجاز ہے۔ | `REVIEW_REQUIRED` |
| 14 | `other.labels.saveCarrier` | `projects` | **B** | حفظ وتطبيع الناقل | Save and Normalize Carrier | کیریئر محفوظ کریں اور نارملائز کریں | `REVIEW_REQUIRED` |
| 15 | `other.labels.saveDriver` | `projects` | **B** | حفظ وتطبيع السائق | Save and Normalize Driver | ڈرائیور محفوظ کریں اور نارملائز کریں | `REVIEW_REQUIRED` |
| 16 | `other.labels.saveMaterial` | `projects` | **B** | حفظ وتطبيع المادة | Save and Normalize Material | مٹیریل محفوظ کریں اور نارملائز کریں | `REVIEW_REQUIRED` |
| 17 | `other.labels.saveTruck` | `projects` | **B** | حفظ وتطبيع الشاحنة | Save and Normalize Truck | ٹرک محفوظ کریں اور نارملائز کریں | `REVIEW_REQUIRED` |
| 18 | `other.labels.truck` | `projects` | **B** | تعطيل الشاحنة (تحويل إلى INACTIVE) | Deactivate Truck (Set to INACTIVE) | ٹرک غیر فعال کریں (INACTIVE میں تبدیل کریں) | `REVIEW_REQUIRED` |
| 19 | `other.labels.truck_2` | `projects` | **B** | تفعيل الشاحنة (تحويل إلى ACTIVE) | Activate Truck (Set to ACTIVE) | ٹرک فعال کریں (ACTIVE میں تبدیل کریں) | `REVIEW_REQUIRED` |
| 20 | `other.labels.truck_5` | `projects` | **B** | الشاحنة (Truck) | Truck | ٹرک | `REVIEW_REQUIRED` |
| 21 | `other.labels.txt_14af6c` | `projects` | **B** | المجلد الحاوي لكافة تذاكر الميزان، إشعارات التوريد وسجلات الشاحنات. | Directory containing all weighbridge tickets, delivery notes, and truck records. | وہ فولڈر جس میں تمام وزنی پل ٹکٹس، ترسیل کے نوٹس اور ٹرکوں کے ریکارڈ موجود ہیں۔ | `REVIEW_REQUIRED` |
| 22 | `other.labels.txt_1a0a87` | `projects` | **B** | عنوان جدول العمليات Google Sheets (spreadsheetTitle) | Operations Google Sheets Spreadsheet Title (spreadsheetTitle) | آپریشنز Google Sheets اسپریڈ شیٹ کا عنوان (spreadsheetTitle) | `REVIEW_REQUIRED` |
| 23 | `other.labels.txt_2ed1b5` | `projects` | **B** | الكل (ACTIVE + INACTIVE) | All (ACTIVE + INACTIVE) | تمام (ACTIVE + INACTIVE) | `REVIEW_REQUIRED` |
| 24 | `other.labels.txt_35c4cc` | `projects` | **B** | فحص النزاهة والاختبارات الآلية | Automated Integrity Checks and Tests | خودکار سالمیت کی جانچ اور ٹیسٹ | `REVIEW_REQUIRED` |
| 25 | `other.labels.txt_36b6da` | `projects` | **B** | ناقل معتمد | Authorized Carrier | مجاز کیریئر | `REVIEW_REQUIRED` |
| 26 | `other.labels.txt_394b13` | `projects` | **B** | حالة الاعتماد المعماري | Architectural Certification Status | آرکیٹیکچرل تصدیق کی حالت | `REVIEW_REQUIRED` |
| 27 | `other.labels.txt_3fb9ae` | `projects` | **B** | بالرد (TRIP) | Per Trip (TRIP) | فی چکر (TRIP) | `REVIEW_REQUIRED` |
| 28 | `other.labels.txt_47f763` | `projects` | **B** | نتائج الفحص الهندسي الصارم لوحدات Master Data (9 فئات اختبار) | Rigorous Engineering Audit Results for Master Data Modules (9 Test Categories) | Master Data ماڈیولز کے سخت انجینئرنگ آڈٹ کے نتائج (9 ٹیسٹ کیٹیگریز) | `REVIEW_REQUIRED` |
| 29 | `other.labels.txt_4e4d76` | `projects` | **B** | يعمل التطبيق حالياً بالبيانات المرجعية الكاملة للمشاريع السعودية. لتفعيل المزامنة المباشرة لقواعد بيانات Firestore وتخزين التعديلات سحابياً، يمكنك تسجيل الدخول بحساب Google. | The application is currently running with full baseline reference data for Saudi projects. To enable live synchronization with Firestore databases and persist edits to the cloud, please sign in with your Google account. | ایپلی کیشن فی الحال سعودی منصوبوں کے مکمل حوالہ جاتی ڈیٹا کے ساتھ کام کر رہی ہے۔ Firestore ڈیٹا بیسز کے ساتھ براہ راست مطابقت پذیری اور کلاؤڈ میں ترامیم محفوظ کرنے کے لیے، آپ اپنے Google اکاؤنٹ سے لاگ ان کر سکتے ہیں۔ | `REVIEW_REQUIRED` |
| 30 | `other.labels.txt_592f64` | `projects` | **B** | راسب (FAILED) | Failed (FAILED) | ناکام (FAILED) | `REVIEW_REQUIRED` |
| 31 | `other.labels.txt_5c9a61` | `projects` | **B** | فحوصات ناجحة (100%) | Successful Checks (100%) | کامیاب چیکس (100%) | `REVIEW_REQUIRED` |
| 32 | `other.labels.txt_618712` | `projects` | **B** | الهوية / الإقامة | National ID / Iqama | قومی شناختی کارڈ / اقامہ | `REVIEW_REQUIRED` |
| 33 | `other.labels.txt_66cfae` | `projects` | **B** | ناقل غير مصرح | Unauthorized Carrier | غیر مجاز کیریئر | `REVIEW_REQUIRED` |
| 34 | `other.labels.txt_67f664` | `projects` | **B** | مسجلة في النظام: | Registered in System: | سسٹم میں رجسٹرڈ: | `REVIEW_REQUIRED` |
| 35 | `other.labels.txt_6b093a` | `projects` | **B** | جميع النواقل | All Carriers | تمام کیریئرز | `REVIEW_REQUIRED` |
| 36 | `other.labels.txt_714016` | `projects` | **B** | أي ناقل أو مادة أو شاحنة أو سائق ورد في رحلات سابقة لا يُحذف مطلقاً لحماية الحسابات. | Any carrier, material, truck, or driver referenced in past trips is never deleted in order to safeguard financial and audit integrity. | ماضی کے ٹرپس میں شامل کسی بھی کیریئر، مٹیریل، ٹرک یا ڈرائیور کو کبھی حذف نہیں کیا جاتا تاکہ مالیاتی حسابات اور آڈٹ کا تحفظ برقرار رہے۔ | `REVIEW_REQUIRED` |
| 37 | `other.labels.txt_73dcb9` | `projects` | **B** | هذا السجل مرتبط بـ | This record is linked to | یہ ریکارڈ منسلک ہے | `REVIEW_REQUIRED` |
| 38 | `other.labels.txt_7bb941` | `projects` | **B** | مع ذلك، وتطبيقاً لقاعدة «استخدم ACTIVE/INACTIVE بدلاً من hard delete»، سيتم تعطيل السجل بتحويل حالته إلى (INACTIVE). | However, enforcing the rule "use ACTIVE/INACTIVE instead of hard delete", this record will be deactivated by setting its status to (INACTIVE). | اس کے باوجود، "ہارڈ ڈیلیٹ کے بجائے ACTIVE/INACTIVE استعمال کریں" کے اصول کے نفاذ کے تحت، اس ریکارڈ کو غیر فعال کر کے اس کی حالت (INACTIVE) کر دی جائے گی۔ | `REVIEW_REQUIRED` |
| 39 | `other.labels.txt_7f7eb1` | `projects` | **B** | إدارة البيانات الرئيسية (Master Data Modules) | Master Data Management (Master Data Modules) | ماسٹر ڈیٹا مینجمنٹ (Master Data Modules) | `REVIEW_REQUIRED` |
| 40 | `other.labels.txt_ebe0e2` | `projects` | **B** | إخفاقات | Failures | ناکامیاں | `REVIEW_REQUIRED` |
| 41 | `other.messages.driverCarrier` | `projects` | **B** | تم تسجيل السائق وربطه بالناقل (Driver → Carrier) محلياً. | Driver registered and linked to carrier (Driver → Carrier) locally. | ڈرائیور کامیابی سے رجسٹرڈ اور کیریئر کے ساتھ منسلک (Driver → Carrier) مقامی طور پر کر دیا گیا۔ | `REVIEW_REQUIRED` |
| 42 | `other.messages.driverCarrier_2` | `projects` | **B** | تم تسجيل السائق وربطه بالناقل (Driver → Carrier) مع تطبيع الهوية والجوال. | Driver registered and linked to carrier (Driver → Carrier) with normalized national ID and mobile. | ڈرائیور کامیابی سے رجسٹرڈ اور کیریئر سے منسلک (Driver → Carrier) شناختی کارڈ اور موبائل نمبر کی نارملائزیشن کے ساتھ کر دیا گیا۔ | `REVIEW_REQUIRED` |
| 43 | `other.messages.truckCarrier` | `projects` | **B** | تم تسجيل الشاحنة وربطها بالناقل (Truck → Carrier) محلياً. | Truck registered and linked to carrier (Truck → Carrier) locally. | ٹرک کامیابی سے رجسٹرڈ اور کیریئر سے منسلک (Truck → Carrier) مقامی طور پر کر دیا گیا۔ | `REVIEW_REQUIRED` |
| 44 | `other.messages.truckCarrier_2` | `projects` | **B** | تم تسجيل الشاحنة وربطها بالناقل (Truck → Carrier) مع تطبيع اللوحة. | Truck registered and linked to carrier (Truck → Carrier) with normalized license plate. | ٹرک کامیابی سے رجسٹرڈ اور کیریئر سے منسلک (Truck → Carrier) نمبر پلیٹ کی نارملائزیشن کے ساتھ کر دیا گیا۔ | `REVIEW_REQUIRED` |
| 45 | `other.status.projectActive` | `projects` | **B** | المشروع النشط: | Active Project: | فعال پروجیکٹ: | `REVIEW_REQUIRED` |
| 46 | `other.status.success_2` | `projects` | **B** | تمت التهيئة والأرشفة بنجاح | Initialization and archiving completed successfully | ابتدائی ترتیب اور آرکائیو کامیابی کے ساتھ مکمل ہو گئی | `REVIEW_REQUIRED` |
| 47 | `other.status.success_3` | `projects` | **B** | نجاح | Success | کامیابی | `REVIEW_REQUIRED` |
| 48 | `projects.labels.add_2` | `projects` | **B** | يجب إضافة ناقل واحد على الأقل للمشروع | At least one carrier must be added to the project | پروجیکٹ میں کم از کم ایک کیریئر شامل کرنا ضروری ہے | `REVIEW_REQUIRED` |
| 49 | `projects.labels.add_3` | `projects` | **B** | إضافة وتعيين الصلاحية | Add and Assign Role | شامل کریں اور کردار تفویض کریں | `REVIEW_REQUIRED` |
| 50 | `projects.labels.location` | `projects` | **B** | الموقع الجغرافي للمشروع | Geographic Location of Project | پروجیکٹ کا جغرافیائی مقام | `REVIEW_REQUIRED` |
| 51 | `projects.labels.project_10` | `projects` | **B** | دعوة مستخدم جديد وتعيين صلاحياته في المشروع | Invite a new user and assign permissions in the project | نئے صارف کو مدعو کریں اور پروجیکٹ میں اختیارات تفویض کریں | `REVIEW_REQUIRED` |
| 52 | `projects.labels.project_11` | `projects` | **B** | مدير المشروع (PROJECT_ADMIN) | Project Administrator (PROJECT_ADMIN) | پروجیکٹ ایڈمنسٹریٹر (PROJECT_ADMIN) | `REVIEW_REQUIRED` |
| 53 | `projects.labels.project_4` | `projects` | **B** | مديرو المشروع (Admin): | Project Administrators (Admin): | پروجیکٹ ایڈمنسٹریٹرز (Admin): | `REVIEW_REQUIRED` |
| 54 | `projects.labels.project_6` | `projects` | **B** | رمز المشروع (projectCode) مطلوب | Project code (projectCode) is required | پروجیکٹ کوڈ (projectCode) درکار ہے | `REVIEW_REQUIRED` |
| 55 | `projects.labels.project_7` | `projects` | **B** | رمز المشروع يجب أن يحتوي على أحرف وأرقام وشرطات فقط بدون مسافات | Project code must contain letters, numbers, and dashes only with no spaces | پروجیکٹ کوڈ میں صرف حروف، اعداد اور ڈیشز ہونے چاہئیں، بغیر فاصلے کے | `REVIEW_REQUIRED` |
| 56 | `projects.labels.trucks` | `projects` | **B** | التفاوت المسموح في أوزان الشاحنات (كجم) | Permitted Weight Variance for Trucks (KG) | ٹرکوں کے وزن میں جائز تفاوت (KG) | `REVIEW_REQUIRED` |
| 57 | `projects.labels.txt_42e94e` | `projects` | **B** | مراقب عام (VIEWER) | General Observer (VIEWER) | عمومی مبصر (VIEWER) | `REVIEW_REQUIRED` |
| 58 | `projects.labels.txt_50bf83` | `projects` | **B** | تنبيهات الصلاحيات: | Permissions Warnings: | اختیارات کی وارننگز: | `REVIEW_REQUIRED` |
| 59 | `projects.labels.txt_74b183` | `projects` | **B** | معرف وحيد للمشروع في Firestore يمنع تعديله بعد الإنشاء. | Unique project identifier in Firestore; modification is prohibited after creation. | Firestore میں پروجیکٹ کا منفرد شناختی کوڈ؛ تخلیق کے بعد اس میں ترمیم ممنوع ہے۔ | `REVIEW_REQUIRED` |
| 60 | `projects.labels.txt_78a490` | `projects` | **B** | الدور التشغيلي (Role) | Operational Role (Role) | آپریشنل کردار (Role) | `REVIEW_REQUIRED` |
| 61 | `projects.labels.userProject` | `projects` | **B** | حدد مربع الاختيار لضم المستخدم إلى هذا المشروع وتحديد دوره | Check the box to add the user to this project and define their role | صارف کو اس پروجیکٹ میں شامل کرنے اور اس کا کردار منتخب کرنے کے لیے چیک باکس کو نشان زد کریں | `REVIEW_REQUIRED` |
| 62 | `offline.labels.status` | `offline` | **B** | مقارنة الحالة المحفوظة (Preserved Local Command vs Server State) | State Comparison (Preserved Local Command vs Server State) | محفوظ شدہ حالت کا موازنہ (Preserved Local Command vs Server State) | `REVIEW_REQUIRED` |
| 63 | `offline.labels.trip` | `offline` | **B** | تعارض: الرحلة مصنفة كمرتجعة (RETURNED) على الخادم | Conflict: Trip is classified as returned (RETURNED) on server | تنازع: ٹرپ سرور پر واپس شدہ (RETURNED) کے طور پر درجہ بند ہے | `REVIEW_REQUIRED` |
| 64 | `offline.labels.truck` | `offline` | **B** | تعارض تبعية الشاحنة للناقل (Truck-Carrier Conflict) | Truck-Carrier Dependency Conflict (Truck-Carrier Conflict) | ٹرک اور کیریئر کے تعلق کا تنازع (Truck-Carrier Conflict) | `REVIEW_REQUIRED` |
| 65 | `offline.labels.txt_10f795` | `offline` | **B** | السجل على الخادم تم تعديله بالتوازي بإصدار أحدث. | The server record has been modified concurrently with a newer version. | سرور پر ریکارڈ کو بیک وقت ایک نئے ورژن کے ساتھ تبدیل کر دیا گیا ہے۔ | `REVIEW_REQUIRED` |
| 66 | `offline.labels.txt_2a088a` | `offline` | **B** | سيعمل التطبيق كبرنامج مستقل بالكامل بدون إنترنت عبر تقنية Offline PWA. | The application operates completely standalone without internet via Offline PWA technology. | ایپلی کیشن Offline PWA ٹیکنالوجی کے ذریعے انٹرنیٹ کے بغیر مکمل طور پر خودمختار کام کرے گی۔ | `REVIEW_REQUIRED` |
| 67 | `offline.labels.txt_35c87e` | `offline` | **B** | تثبيت التطبيق على أجهزة iOS | Install Application on iOS Devices | iOS آلات پر ایپلی کیشن انسٹال کریں | `REVIEW_REQUIRED` |
| 68 | `offline.labels.txt_3ba53d` | `offline` | **B** | اعتماد الحل الصريح والترحيل | Approve Explicit Resolution and Commit | واضح حل کی منظوری دیں اور لاگو کریں | `REVIEW_REQUIRED` |
| 69 | `offline.labels.txt_3d9611` | `offline` | **B** | اعتماد حالة الخادم (Accept Server State) | Accept Server State | سرور کی حالت قبول کریں (Accept Server State) | `REVIEW_REQUIRED` |
| 70 | `offline.labels.txt_3db2df` | `offline` | **B** | فهمت ذلك | Understood | سمجھ آ گئی | `REVIEW_REQUIRED` |
| 71 | `offline.labels.txt_3e2425` | `offline` | **B** | ملاحظات التحكيم | Arbitration Notes | ثالثی کے نوٹس | `REVIEW_REQUIRED` |
| 72 | `offline.labels.txt_4c59dc` | `offline` | **B** | محمي باللقطة | Protected by Snapshot | اسنیپ شاٹ کے ذریعے محفوظ | `REVIEW_REQUIRED` |
| 73 | `offline.labels.txt_4d3e1f` | `offline` | **B** | جدول الفروقات (Diff) | Difference Table (Diff) | تفاوت کا جدول (Diff) | `REVIEW_REQUIRED` |
| 74 | `offline.labels.txt_4e1b80` | `offline` | **B** | سيتم تسجيل القرار في سجل التدقيق ومزامنة حالة Outbox تلقائياً | The resolution will be recorded in the audit log and the Outbox state synchronized automatically | فیصلہ آڈٹ لاگ میں ریکارڈ کیا جائے گا اور آؤٹ باکس کی حالت خودکار طور پر مطابقت پذیر ہو جائے گی | `REVIEW_REQUIRED` |
| 75 | `offline.labels.txt_5037be` | `offline` | **B** | البيانات الخام (JSON) | Raw Data (JSON) | خام ڈیٹا (JSON) | `REVIEW_REQUIRED` |
| 76 | `offline.labels.txt_540354` | `offline` | **B** | اضغط على زر | Click the button | بٹن پر کلک کریں | `REVIEW_REQUIRED` |
| 77 | `offline.labels.txt_59a3b5` | `offline` | **B** | الحقل | Field | فیلڈ | `REVIEW_REQUIRED` |
| 78 | `offline.labels.txt_6357c3` | `offline` | **B** | تثبيت PWA | Install PWA | PWA انسٹال کریں | `REVIEW_REQUIRED` |
| 79 | `offline.labels.txt_6a75f1` | `offline` | **B** | المشاركة (Share) | Share | شیئر کریں | `REVIEW_REQUIRED` |
| 80 | `offline.labels.txt_6fd255` | `offline` | **B** | تثبيت التطبيق (PWA) | Install Application (PWA) | ایپلی کیشن انسٹال کریں (PWA) | `REVIEW_REQUIRED` |
| 81 | `offline.labels.txt_71eceb` | `offline` | **B** | القاعدة المعمارية الصارمة: | Strict Architectural Rule: | سخت تعمیراتی اصول: | `REVIEW_REQUIRED` |
| 82 | `offline.labels.txt_7c7b96` | `offline` | **B** | تثبيت التطبيق على جهازك للعمل بدون إنترنت PWA | Install the app on your device to work offline via PWA | انٹرنیٹ کے بغیر کام کرنے کے لیے اپنے آلے پر ایپلی کیشن (PWA) انسٹال کریں | `REVIEW_REQUIRED` |
| 83 | `offline.labels.txt_7e9398` | `offline` | **B** | مشرف العمليات الميدانية (Scale Supervisor) | Scale Supervisor (Scale Supervisor) | فیلڈ آپریشنز سپروائزر (Scale Supervisor) | `REVIEW_REQUIRED` |
| 84 | `offline.status.cancelSuccess` | `offline` | **B** | إلغاء التذكرة المكررة محلياً حيث تم ترحيلها بنجاح مسبقاً. | Cancel duplicated ticket locally as it has already been committed successfully. | مقامی طور پر ڈپلیکیٹ ٹکٹ منسوخ کر دیا گیا کیونکہ یہ پہلے ہی کامیابی کے ساتھ منتقل ہو چکا ہے۔ | `REVIEW_REQUIRED` |
| 85 | `entityResolution.labels.carrier_3` | `entityResolution` | **B** | الناقل | Carrier | کیریئر | `REVIEW_REQUIRED` |
| 86 | `entityResolution.labels.driver_2` | `entityResolution` | **B** | السائق | Driver | ڈرائیور | `REVIEW_REQUIRED` |
| 87 | `entityResolution.labels.edit` | `entityResolution` | **B** | تعديل بالتوازي في وضع عدم الاتصال | Concurrent Edit in Offline Mode | آف لائن موڈ میں ہم وقت ترمیم | `REVIEW_REQUIRED` |
| 88 | `entityResolution.labels.import` | `entityResolution` | **B** | تعارض حرج في العلاقات أو الصلاحيات. يمنع الإدخال أو الاستيراد نهائياً حتى تتم المعالجة والتصحيح. | Critical conflict in entity relationships or permissions. Intake or import is strictly blocked until resolved and corrected. | تعلقات یا اختیارات میں سنگین تنازع۔ حل اور درستگی تک ڈیٹا اندراج یا امپورٹ مکمل طور پر ممنوع ہے۔ | `REVIEW_REQUIRED` |
| 89 | `entityResolution.labels.truck` | `entityResolution` | **B** | تعارض الشاحنة (CARRIER_TRUCK_CONFLICT) | Truck Conflict (CARRIER_TRUCK_CONFLICT) | ٹرک تنازع (CARRIER_TRUCK_CONFLICT) | `REVIEW_REQUIRED` |
| 90 | `entityResolution.labels.txt_116ee2` | `entityResolution` | **B** | تطبيق المعالجة واعتماد السجل | Apply Resolution and Approve Record | حل لاگو کریں اور ریکارڈ منظور کریں | `REVIEW_REQUIRED` |
| 91 | `entityResolution.labels.txt_148e7c` | `entityResolution` | **B** | مطابقة وآمنة (LOW) | Matched and Safe (LOW) | مماثل اور محفوظ (LOW) | `REVIEW_REQUIRED` |
| 92 | `entityResolution.labels.txt_189ba3` | `entityResolution` | **B** | محظور / مستبعد | Blocked / Excluded | مسدود / خارج شدہ | `REVIEW_REQUIRED` |
| 93 | `entityResolution.labels.txt_24239d` | `entityResolution` | **B** | ناقل (Carrier) | Carrier | کیریئر | `REVIEW_REQUIRED` |
| 94 | `entityResolution.labels.txt_257cc7` | `entityResolution` | **B** | 8 مراحل منفذة | 8 Stages Executed | 8 مراحل مکمل | `REVIEW_REQUIRED` |
| 95 | `entityResolution.labels.txt_273452` | `entityResolution` | **B** | مخاطر عالية (HIGH) | High Risk (HIGH) | بلند خطرہ (HIGH) | `REVIEW_REQUIRED` |
| 96 | `entityResolution.labels.txt_2a7413` | `entityResolution` | **B** | تتطلب تأكيداً يدوياً | Requires Manual Confirmation | دستی تصدیق درکار ہے | `REVIEW_REQUIRED` |
| 97 | `entityResolution.labels.txt_2c7a04` | `entityResolution` | **B** | المرشح في قاعدة البيانات (Candidate) | Database Candidate (Candidate) | ڈیٹا بیس میں مجوزہ ریکارڈ (Candidate) | `REVIEW_REQUIRED` |
| 98 | `entityResolution.labels.txt_2fc03e` | `entityResolution` | **B** | تمت المعالجة اليدوية | Manually Processed | دستی طور پر پروسیس شدہ | `REVIEW_REQUIRED` |
| 99 | `entityResolution.labels.txt_30daee` | `entityResolution` | **B** | تم الاعتماد بعد اجتياز التحقق والمطابقة. | Approved after passing verification and matching. | تصدیق اور مماثلت کے مراحل کامیابی سے طے کرنے کے بعد منظور کر لیا گیا۔ | `REVIEW_REQUIRED` |
| 100 | `entityResolution.labels.txt_30e91e` | `entityResolution` | **B** | استلام القيمة النصية الأولية من الملف أو واجهة الإدخال بدون أي تعديل. | Intake of raw string value from file or input interface without modification. | فائل یا ان پٹ انٹرفیس سے بغیر کسی ترمیم کے ابتدائی متنی قدر کی وصولی۔ | `REVIEW_REQUIRED` |
| 101 | `projects.labels.txt_ee3f70` | `projects` | **C** | نصف قطر السياج الجغرافي للموقع (GeoFence بالمتر) | Site Geofence Radius (GeoFence in meters) | سائٹ کے جغرافیائی دائرے کا رداس (میٹر میں GeoFence) | `REVIEW_REQUIRED` |
| 102 | `offline.labels.txt_3d5113` | `offline` | **C** | مبرر القرار التدقيقي (Audit Justification): | Audit Justification for Decision: | آڈٹ فیصلے کا جواز (Audit Justification): | `REVIEW_REQUIRED` |
| 103 | `offline.labels.txt_41c156` | `offline` | **C** | ضمانة ثبات تسعير الـ Offline (Pricing Snapshot Invariance) | Offline Pricing Snapshot Invariance Guarantee | آف لائن قیمت کی مستقل مزاجی کی ضمانت (Pricing Snapshot Invariance) | `REVIEW_REQUIRED` |
| 104 | `offline.labels.txt_47cf18` | `offline` | **C** | القرار الإلزامي الصريح (Explicit Resolution Strategy) | Explicit Resolution Strategy | لازمی واضح حل کی حکمت عملی (Explicit Resolution Strategy) | `REVIEW_REQUIRED` |
| 105 | `offline.labels.txt_4d4137` | `offline` | **C** | رفض ترحيل الشحنة لمخالفتها شروط التفويض في السجل المركزي. | Shipment intake rejected due to violation of authorization terms in central registry. | مرکزی رجسٹر میں اجازت نامے کی شرائط کی خلاف ورزی کی بنا پر شپمنٹ کی منتقلی مسترد کر دی گئی۔ | `REVIEW_REQUIRED` |
| 106 | `offline.labels.txt_5b9d20` | `offline` | **C** | تم تسجيل رفض أو إرجاع الشحنة على الخادم. | Shipment rejection or return has been registered on the server. | سرور پر شپمنٹ کا مسترد ہونا یا واپسی ریکارڈ کر دی گئی ہے۔ | `REVIEW_REQUIRED` |
| 107 | `offline.labels.txt_604d7b` | `offline` | **C** | استبعاد العملية المكررة (Discard Duplicate) | Discard Duplicate Operation (Discard Duplicate) | ڈپلیکیٹ آپریشن کو مسترد کریں (Discard Duplicate) | `REVIEW_REQUIRED` |
| 108 | `offline.labels.txt_60c85c` | `offline` | **C** | فرض الأمر المحلي بالإصدار الجديد (Force Local With Audit) | Force Local Operation with Audit Trail (Force Local With Audit) | آڈٹ ریکارڈ کے ساتھ مقامی آپریشن نافذ کریں (Force Local With Audit) | `REVIEW_REQUIRED` |
| 109 | `offline.labels.txt_69531e` | `offline` | **C** | حالة الخادم (Server State) | Server State | سرور کی حالت (Server State) | `REVIEW_REQUIRED` |
| 110 | `offline.labels.txt_78ff43` | `offline` | **C** | تثبيت على أجهزة آيفون / آيباد | Install on iPhone / iPad Devices | آئی فون / آئی پیڈ آلات پر انسٹال کریں | `REVIEW_REQUIRED` |
| 111 | `entityResolution.labels.txt_14919c` | `entityResolution` | **C** | الأسباب والتعليقات النظامية: | Regulatory Reasons and Remarks: | باقاعدہ وجوہات اور تبصرے: | `REVIEW_REQUIRED` |
| 112 | `entityResolution.labels.txt_15728b` | `entityResolution` | **C** | حرج (CRITICAL) - يمنع الإدخال | Critical (CRITICAL) - Intake Blocked | سنگین (CRITICAL) - اندراج ممنوع ہے | `REVIEW_REQUIRED` |
| 113 | `entityResolution.labels.txt_16c00c` | `entityResolution` | **C** | معايرة قياسية ذكية تحافظ على المعنى (إزالة التشكيل والتطويل، توحيد الأرقام، الإبقاء على الفروق الجوهرية). | Intelligent canonical standardization preserving semantics (removing diacritics and tatweel, normalizing digits, retaining substantive differences). | معنی کو محفوظ رکھنے والی ذہین معیاری ایڈجسٹمنٹ (اعراب اور کشیدہ علامات کا خاتمہ، ہندسوں کی یکسانیت، بنیادی فرق کی برقراری)۔ | `REVIEW_REQUIRED` |
| 114 | `entityResolution.labels.txt_17f8ed` | `entityResolution` | **C** | الفازي vs الفزي (Possible Match) | Fuzzy vs Normalized Matching (Possible Match) | فزی بمقابلہ نارملائزڈ مماثلت (Possible Match) | `REVIEW_REQUIRED` |
| 115 | `entityResolution.labels.txt_1c98fc` | `entityResolution` | **C** | عالي (HIGH) - لا تعتمد تلقائياً | High (HIGH) - Do Not Auto-Approve | اعلیٰ (HIGH) - خودکار منظوری نہ دیں | `REVIEW_REQUIRED` |
| 116 | `entityResolution.labels.txt_1ccbcc` | `entityResolution` | **C** | ⚠️ يتطلب تدخلاً صريحاً لعدم التطابق الكافي. | ⚠️ Explicit intervention required due to insufficient matching confidence. | ⚠️ ناکافی مماثلت کی وجہ سے واضح دستی مداخلت درکار ہے۔ | `REVIEW_REQUIRED` |
| 117 | `entityResolution.labels.txt_2acaf8` | `entityResolution` | **C** | تعارض علاقات (RELATIONSHIP) | Relationship Conflict (RELATIONSHIP) | تعلقات کا تنازع (RELATIONSHIP) | `REVIEW_REQUIRED` |
| 118 | `entityResolution.labels.txt_2e1ff5` | `entityResolution` | **C** | معالجة التعارض التنظيمي (Conflict Resolution) | Regulatory Conflict Resolution (Conflict Resolution) | تنظیمی تنازعات کا حل (Conflict Resolution) | `REVIEW_REQUIRED` |
| 119 | `entityResolution.labels.txt_2e6c0e` | `entityResolution` | **C** | درجة التطابق (Match Score): | Match Score: | مماثلت کا تناسب (Match Score): | `REVIEW_REQUIRED` |
| 120 | `entityResolution.labels.txt_392bf7` | `entityResolution` | **C** | مطابقة لوائح النقل السعودية (صيغ اللوحات، أرقام الهويات، حدود الأوزان والحمولات). | Compliance with Saudi transport regulations (license plate formats, national IDs, weight and payload limits). | سعودی ٹرانسپورٹ کے ضوابط سے ہم آہنگی (نمبر پلیٹ فارمیٹس، شناختی کارڈ نمبرز، وزن اور لوڈنگ کی حدود)۔ | `REVIEW_REQUIRED` |
| 121 | `entityResolution.labels.txt_39b3f8` | `entityResolution` | **C** | بوابة رقابة إلزامية (Pre-Import Gate) | Mandatory Control Gate (Pre-Import Gate) | لازمی کنٹرول گیٹ (Pre-Import Gate) | `REVIEW_REQUIRED` |
| 122 | `entityResolution.labels.txt_3a8654` | `entityResolution` | **C** | القيمة المدخلة الأصلية (Source) | Source Input Value (Source) | اصل درج شدہ قدر (Source) | `REVIEW_REQUIRED` |
| 123 | `entityResolution.labels.txt_42e7b2` | `entityResolution` | **C** | تتبع تنفيذ خط الأنابيب (Pipeline Execution Trace) | Pipeline Execution Trace | پائپ لائن پر عمل درآمد کی تفصیلی ٹریسنگ (Pipeline Execution Trace) | `REVIEW_REQUIRED` |
| 124 | `entityResolution.labels.txt_42f259` | `entityResolution` | **C** | مشروع نيوم - قطاع الشمال (PRJ-NEOM-001) | NEOM Project - Northern Sector (PRJ-NEOM-001) | نیوم پروجیکٹ - شمالی سیکٹر (PRJ-NEOM-001) | `REVIEW_REQUIRED` |
| 125 | `entityResolution.labels.txt_446084` | `entityResolution` | **C** | خط الأنابيب المعماري الإلزامي (The 8-Stage Quality Pipeline) | Mandatory Architectural Pipeline (The 8-Stage Quality Pipeline) | لازمی آرکیٹیکچرل پائپ لائن (The 8-Stage Quality Pipeline) | `REVIEW_REQUIRED` |
| 126 | `entityResolution.labels.txt_4b1baa` | `entityResolution` | **C** | تطابق تام (Exact Match) | Exact Match | مکمل مماثلت (Exact Match) | `REVIEW_REQUIRED` |
| 127 | `entityResolution.labels.txt_4be3c3` | `entityResolution` | **C** | القيمة الأولية المدخلة (Raw Value) | Raw Input Value (Raw Value) | خام ان پٹ ویلیو (Raw Value) | `REVIEW_REQUIRED` |
| 128 | `entityResolution.labels.txt_4d8e7a` | `entityResolution` | **C** | مادة غير مسموحة (MATERIAL_NOT_ALLOWED) | Material Not Allowed (MATERIAL_NOT_ALLOWED) | غیر مجاز مٹیریل (MATERIAL_NOT_ALLOWED) | `REVIEW_REQUIRED` |
| 129 | `entityResolution.labels.txt_5182e1` | `entityResolution` | **C** | ناقل غير مصرح (CARRIER_NOT_ALLOWED) | Unauthorized Carrier (CARRIER_NOT_ALLOWED) | غیر مجاز کیریئر (CARRIER_NOT_ALLOWED) | `REVIEW_REQUIRED` |
| 130 | `entityResolution.labels.txt_5604bd` | `entityResolution` | **C** | ⛔ لا يمكن الإدخال حتى تتم معالجة التعارض يدوياً. | ⛔ Intake cannot proceed until conflict is manually resolved. | ⛔ تنازع کو دستی طور پر حل کیے جانے تک اندراج ممکن نہیں۔ | `REVIEW_REQUIRED` |
| 131 | `entityResolution.labels.txt_5786fc` | `entityResolution` | **C** | نوع الكيان المراد مطابقته | Entity Type to Match | مماثلت کے لیے مطلوبہ اکائی کی قسم | `REVIEW_REQUIRED` |
| 132 | `entityResolution.labels.txt_63d60e` | `entityResolution` | **C** | احتساب درجة المخاطرة الحتمية (CRITICAL / HIGH / MEDIUM / LOW). | Deterministic risk severity assessment (CRITICAL / HIGH / MEDIUM / LOW). | حتمی رسک گریڈ کا حساب (CRITICAL / HIGH / MEDIUM / LOW)۔ | `REVIEW_REQUIRED` |
| 133 | `entityResolution.labels.txt_63e83a` | `entityResolution` | **C** | إجمالي السجلات المفحوصة | Total Inspected Records | جانچ شدہ کل ریکارڈز | `REVIEW_REQUIRED` |
| 134 | `entityResolution.labels.txt_6608f0` | `entityResolution` | **C** | تسلسل حتمي يضمن معالجة كل قيمة مدخلة عبر 8 محطات تدقيق متتالية قبل أي كتابة في Firestore | Deterministic pipeline guaranteeing every intake value is processed through 8 sequential audit stages prior to any commit in Firestore | حتمی سلسلہ جو اس بات کو یقینی بناتا ہے کہ Firestore میں لکھنے سے قبل ہر درج شدہ قدر 8 متواتر آڈٹ مراحل سے گزرے | `REVIEW_REQUIRED` |
| 135 | `entityResolution.labels.txt_795a77` | `entityResolution` | **C** | ✓ جميع الحقول مطابقة ومجازة نظامياً. | ✓ All fields are verified and compliant with regulatory standards. | ✓ تمام فیلڈز مطابقت رکھتی ہیں اور باضابطہ طور پر منظور شدہ ہیں۔ | `REVIEW_REQUIRED` |
| 136 | `entityResolution.labels.txt_7e9185` | `entityResolution` | **C** | لا يوجد تطابق (NO_MATCH) | No Match Found (NO_MATCH) | کوئی مماثلت نہیں ملی (NO_MATCH) | `REVIEW_REQUIRED` |
| 137 | `entityResolution.labels.txt_a74c7a` | `entityResolution` | **C** | خوارزميات التشابه (Levenshtein & Jaro-Winkler) لحساب نسبة التطابق واكتشاف Possible Matches. | Similarity algorithms (Levenshtein & Jaro-Winkler) to calculate match confidence and detect Possible Matches. | مماثلت کے الگورتھم (Levenshtein & Jaro-Winkler) تاکہ مماثلت کے تناسب کا حساب لگایا جا سکے اور ممکنہ مماثلت تلاش کی جا سکے۔ | `REVIEW_REQUIRED` |
| 138 | `exceptions.labels.txt_268748` | `exceptions` | **C** | معتمدة ومحلولة (RESOLVED) | Approved and Resolved (RESOLVED) | منظور شدہ اور حل شدہ (RESOLVED) | `REVIEW_REQUIRED` |
| 139 | `exceptions.labels.txt_2fee62` | `exceptions` | **C** | فتح استثناء تشغيلي جديد (Raise Exception) | Raise New Operational Exception (Raise Exception) | نیا آپریشنل استثناء درج کریں (Raise Exception) | `REVIEW_REQUIRED` |
| 140 | `exceptions.labels.txt_391836` | `exceptions` | **C** | فتح استثناء جديد (Raise Exception) | Raise New Exception (Raise Exception) | نیا استثناء درج کریں (Raise Exception) | `REVIEW_REQUIRED` |
| 141 | `exceptions.labels.txt_482fcf` | `exceptions` | **C** | محلولة ومعتمدة (RESOLVED) | Resolved and Approved (RESOLVED) | حل شدہ اور منظور شدہ (RESOLVED) | `REVIEW_REQUIRED` |
| 142 | `exceptions.labels.txt_4eb7b8` | `exceptions` | **C** | سجل تدقيق إلزامي (Audit Trail) | Mandatory Audit Trail (Audit Trail) | لازمی آڈٹ لاگ (Audit Trail) | `REVIEW_REQUIRED` |
| 143 | `exceptions.labels.txt_5675c9` | `exceptions` | **C** | بدء المراجعة (UNDER_REVIEW) | Initiate Review (UNDER_REVIEW) | جائزہ شروع کریں (UNDER_REVIEW) | `REVIEW_REQUIRED` |
| 144 | `exceptions.labels.txt_5b7754` | `exceptions` | **C** | المُبلّغ / النظام (openedBy) | Reporter / System (openedBy) | رپورٹ کنندہ / سسٹم (openedBy) | `REVIEW_REQUIRED` |
| 145 | `exceptions.labels.txt_60d9c1` | `exceptions` | **C** | النظام التشغيلي متوافق ومستقر | Operating system is compliant and stable | آپریشنل سسٹم ہم آہنگ اور مستحکم ہے | `REVIEW_REQUIRED` |
| 146 | `exceptions.labels.txt_69c1d3` | `exceptions` | **C** | نوع الاستثناء (12 Types) | Exception Type (12 Types) | استثناء کی قسم (12 Types) | `REVIEW_REQUIRED` |
| 147 | `exceptions.labels.txt_6abe88` | `exceptions` | **C** | قيد المراجعة (UNDER_REVIEW) | Under Review (UNDER_REVIEW) | زیر جائزہ (UNDER_REVIEW) | `REVIEW_REQUIRED` |
| 148 | `navigation.labels.txt_15ec91` | `shared` | **C** | التمدد غير الإتلافي (Additive Only): | Non-Destructive Extension (Additive Only): | غیر تخریبی توسیع (Additive Only): | `REVIEW_REQUIRED` |
| 149 | `navigation.labels.txt_19c7ca` | `shared` | **C** | تكامل Google Sheets و Google Drive من جانب الخادم | Server-side integration with Google Sheets and Google Drive | سرور کی سطح پر Google Sheets اور Google Drive کا انضمام | `REVIEW_REQUIRED` |
| 150 | `navigation.labels.txt_19e865` | `shared` | **C** | 1. أعمدة التشغيل الـ 20 الحالية (Legacy Operational Columns) | 1. Current 20 Operational Columns (Legacy Operational Columns) | 1. موجودہ 20 آپریشنل کالمز (Legacy Operational Columns) | `REVIEW_REQUIRED` |
