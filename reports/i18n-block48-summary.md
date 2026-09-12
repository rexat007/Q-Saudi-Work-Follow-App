# BLOCK 48 — Controlled i18n Migration: SAFE Batch Summary Report

## 1. Executive Summary

- **Execution Mode:** Final SAFE Batch Applied (Complete SAFE Migration) (Production Source Migration)
- **Timestamp:** 2026-09-12T12:05:44.318Z
- **Total SAFE Candidates Detected in Dry-Run:** 1112
- **Total SAFE Candidates Evaluated for Block:** 228
- **Total SAFE Candidates Applied in Batch:** 228 (Max batch ceiling: 350)
- **Categories Migrated:** offline (109), other (119)
- **Deferred / Protected Categories:** database schemas, raw queries, network protocols, cryptography (Strictly protected)
- **Total Files Modified:** 7

## 2. File Hashes & Verification

| File Path | Pre-Migration Hash | Post-Migration Hash | Transforms Applied | Status |
|-----------|--------------------|---------------------|--------------------|--------|
| `/app/applet/src/components/offline/ConflictResolutionModal.tsx` | `ca42cbd0b3accb57` | `08e991fb7d220861` | 30 | VALIDATED & APPLIED |
| `/app/applet/src/components/offline/OfflineIndicator.tsx` | `afbe4a2b47b132a2` | `d36fc7523b83fe65` | 1 | VALIDATED & APPLIED |
| `/app/applet/src/components/offline/OutboxDrawer.tsx` | `ad4accab403bf8e9` | `caae073d44010c6e` | 66 | VALIDATED & APPLIED |
| `/app/applet/src/components/offline/PWAInstallButton.tsx` | `f0a9f943ef81b030` | `b928ce7d49da3433` | 12 | VALIDATED & APPLIED |
| `/app/applet/src/components/FirestoreArchitectureView.tsx` | `5f2863f0a0d6974d` | `230cdc05f9ef3de3` | 25 | VALIDATED & APPLIED |
| `/app/applet/src/components/masterData/MasterDataView.tsx` | `a04f86d7d6a28bea` | `58ae0640b7d22c8a` | 77 | VALIDATED & APPLIED |
| `/app/applet/src/components/wizard/Step6GoogleDrive.tsx` | `499067d70b1de1cf` | `c5c0a7e26b543d84` | 17 | VALIDATED & APPLIED |

## 3. Applied Translation Keys & Canonical Arabic Sources

| # | Translation Key | Category | Canonical Arabic Source | Applied In |
|---|-----------------|----------|-------------------------|------------|
| 1 | `offline.labels.txt_3ba53d` | `offline` | اعتماد الحل الصريح والترحيل | `/app/applet/src/components/offline/ConflictResolutionModal.tsx:636` |
| 2 | `offline.labels.cancel_2` | `offline` | إلغاء ومراجعة لاحقاً | `/app/applet/src/components/offline/ConflictResolutionModal.tsx:628` |
| 3 | `offline.labels.txt_4e1b80` | `offline` | سيتم تسجيل القرار في سجل التدقيق ومزامنة حالة Outbox تلقائياً | `/app/applet/src/components/offline/ConflictResolutionModal.tsx:619` |
| 4 | `offline.labels.txt_3d5113` | `offline` | مبرر القرار التدقيقي (Audit Justification): | `/app/applet/src/components/offline/ConflictResolutionModal.tsx:601` |
| 5 | `offline.labels.txt_4d4137` | `offline` | رفض ترحيل الشحنة لمخالفتها شروط التفويض في السجل المركزي. | `/app/applet/src/components/offline/ConflictResolutionModal.tsx:589` |
| 6 | `offline.labels.cancelTrip` | `offline` | إلغاء أمر الرحلة لعدم صلاحية الكيان (Cancel Dispatch) | `/app/applet/src/components/offline/ConflictResolutionModal.tsx:586` |
| 7 | `offline.labels.truck_2` | `offline` | إعادة ربط الشاحنة أو الكيان بالناقل/المشروع المصرح به خادومياً واعتماد الرحلة. | `/app/applet/src/components/offline/ConflictResolutionModal.tsx:564` |
| 8 | `offline.labels.txt_305c29` | `offline` | تسوية ومطابقة التبعية مع البيانات الأساسية للخادم | `/app/applet/src/components/offline/ConflictResolutionModal.tsx:561` |
| 9 | `offline.status.cancelSuccess` | `offline` | إلغاء التذكرة المكررة محلياً حيث تم ترحيلها بنجاح مسبقاً. | `/app/applet/src/components/offline/ConflictResolutionModal.tsx:510` |
| 10 | `offline.labels.txt_604d7b` | `offline` | استبعاد العملية المكررة (Discard Duplicate) | `/app/applet/src/components/offline/ConflictResolutionModal.tsx:507` |
| 11 | `offline.labels.deleteSave` | `offline` | حذف العملية من طابور الصادر وحفظ ملف التدقيق للمراجعة اللوجستية. | `/app/applet/src/components/offline/ConflictResolutionModal.tsx:481` |
| 12 | `offline.labels.cancel` | `offline` | إلغاء العملية المحلية مع تسجيل تقرير تباين تشغيلي (Exception Report) | `/app/applet/src/components/offline/ConflictResolutionModal.tsx:478` |
| 13 | `offline.status.closeTrip` | `offline` | إغلاق العملية المعلقة واعتبار الرحلة في حالتها النهائية المسجلة خادومياً. | `/app/applet/src/components/offline/ConflictResolutionModal.tsx:456` |
| 14 | `offline.labels.txt_60c85c` | `offline` | فرض الأمر المحلي بالإصدار الجديد (Force Local With Audit) | `/app/applet/src/components/offline/ConflictResolutionModal.tsx:424` |
| 15 | `offline.labels.txt_3d9611` | `offline` | اعتماد حالة الخادم (Accept Server State) | `/app/applet/src/components/offline/ConflictResolutionModal.tsx:399` |
| 16 | `offline.labels.txt_184f19` | `offline` | اختر استراتيجية الحل المناسبة مع توثيق سبب القرار في سجل التدقيق الأمني | `/app/applet/src/components/offline/ConflictResolutionModal.tsx:320` |
| 17 | `offline.labels.txt_47cf18` | `offline` | القرار الإلزامي الصريح (Explicit Resolution Strategy) | `/app/applet/src/components/offline/ConflictResolutionModal.tsx:317` |
| 18 | `offline.labels.txt_4c59dc` | `offline` | محمي باللقطة | `/app/applet/src/components/offline/ConflictResolutionModal.tsx:287` |
| 19 | `offline.labels.txt_3e2425` | `offline` | ملاحظات التحكيم | `/app/applet/src/components/offline/ConflictResolutionModal.tsx:263` |
| 20 | `offline.labels.txt_69531e` | `offline` | حالة الخادم (Server State) | `/app/applet/src/components/offline/ConflictResolutionModal.tsx:260` |
| 21 | `offline.labels.txt_24195a` | `offline` | الأمر الميداني المحلي (Local Command) | `/app/applet/src/components/offline/ConflictResolutionModal.tsx:255` |
| 22 | `offline.labels.txt_59a3b5` | `offline` | الحقل | `/app/applet/src/components/offline/ConflictResolutionModal.tsx:252` |
| 23 | `offline.labels.txt_5037be` | `offline` | البيانات الخام (JSON) | `/app/applet/src/components/offline/ConflictResolutionModal.tsx:242` |
| 24 | `offline.labels.txt_4d3e1f` | `offline` | جدول الفروقات (Diff) | `/app/applet/src/components/offline/ConflictResolutionModal.tsx:234` |
| 25 | `offline.labels.status` | `offline` | مقارنة الحالة المحفوظة (Preserved Local Command vs Server State) | `/app/applet/src/components/offline/ConflictResolutionModal.tsx:225` |
| 26 | `offline.labels.txt_71eceb` | `offline` | القاعدة المعمارية الصارمة: | `/app/applet/src/components/offline/ConflictResolutionModal.tsx:207` |
| 27 | `offline.labels.createTrip` | `offline` | ساري وقت إنشاء الرحلة بدون اتصال | `/app/applet/src/components/offline/ConflictResolutionModal.tsx:193` |
| 28 | `offline.labels.txt_41c156` | `offline` | ضمانة ثبات تسعير الـ Offline (Pricing Snapshot Invariance) | `/app/applet/src/components/offline/ConflictResolutionModal.tsx:180` |
| 29 | `offline.labels.trips` | `offline` | مبدأ إلزامي: منع "آخر كتابة تفوز" (Anti Last-Write-Wins) لحماية سلامة بيانات الرحلات | `/app/applet/src/components/offline/ConflictResolutionModal.tsx:150` |
| 30 | `offline.labels.txt_18aa37` | `offline` | مركز معالجة التعارضات التشغيلية (Conflict Resolution) | `/app/applet/src/components/offline/ConflictResolutionModal.tsx:144` |
| 31 | `offline.labels.txt_1f39b6` | `offline` | إدارة المزامنة | `/app/applet/src/components/offline/OfflineIndicator.tsx:43` |
| 32 | `offline.labels.txt_5cde42` | `offline` | تتم الحسابات المالية وصافي الأوزان محلياً وتُدرج في Outbox بحالة PENDING حتى عودة الاتصال. | `/app/applet/src/components/offline/OutboxDrawer.tsx:1000` |
| 33 | `offline.labels.createTripPricing` | `offline` | لا يُسمح بإنشاء أي رحلة Offline إذا كانت بيانات التسعير غير متوفرة محلياً. | `/app/applet/src/components/offline/OutboxDrawer.tsx:999` |
| 34 | `offline.labels.txt_66cc97` | `offline` | قاعدة إلزامية: | `/app/applet/src/components/offline/OutboxDrawer.tsx:999` |
| 35 | `offline.labels.txt_539bb6` | `offline` | يتم التحقق من وجود جميع Master Data (المشروع، الناقل، الشاحنة، السائق، المادة) في IndexedDB. | `/app/applet/src/components/offline/OutboxDrawer.tsx:998` |
| 36 | `offline.labels.txt_9a78d6` | `offline` | معايير التشغيل بدون اتصال (Offline Rules): | `/app/applet/src/components/offline/OutboxDrawer.tsx:995` |
| 37 | `offline.labels.txt_41cc14` | `offline` | جاهز للاستخدام Offline | `/app/applet/src/components/offline/OutboxDrawer.tsx:985` |
| 38 | `offline.labels.txt_7490af` | `offline` | الطابع الزمني: | `/app/applet/src/components/offline/OutboxDrawer.tsx:976` |
| 39 | `offline.labels.txt_6464df` | `offline` | عدد السجلات: | `/app/applet/src/components/offline/OutboxDrawer.tsx:972` |
| 40 | `offline.labels.txt_6fc0d8` | `offline` | سجل تخزين Master Data في IndexedDB | `/app/applet/src/components/offline/OutboxDrawer.tsx:939` |
| 41 | `offline.labels.txt_a9b605` | `offline` | المبرر التدقيقي: | `/app/applet/src/components/offline/OutboxDrawer.tsx:923` |
| 42 | `offline.labels.txt_231b48` | `offline` | الفروقات الميدانية المرصودة: | `/app/applet/src/components/offline/OutboxDrawer.tsx:891` |
| 43 | `offline.labels.txt_6aaee2` | `offline` | حماية تسعير الـ Offline: | `/app/applet/src/components/offline/OutboxDrawer.tsx:877` |
| 44 | `offline.labels.txt_46be08` | `offline` | حل التعارض الصريح | `/app/applet/src/components/offline/OutboxDrawer.tsx:866` |
| 45 | `offline.labels.txt_10b6c4` | `offline` | جميع العمليات متوافقة مع الخادم. يمكنك الضغط على أي زر في المحاكي أعلاه لاختبار منظومة معالجة التعارضات وحماية لقطات التسعير. | `/app/applet/src/components/offline/OutboxDrawer.tsx:824` |
| 46 | `offline.status.txt_60598f` | `offline` | لا توجد تعارضات معلقة في النظام حالياً | `/app/applet/src/components/offline/OutboxDrawer.tsx:822` |
| 47 | `offline.labels.save_3` | `offline` | برنامج فحص برمجي للتحقق من كافة القواعد والمحددات الإلزامية: الأنواع الـ 7، Anti-LWW، حفظ الأمرين، إشعار المستخدم، ثبات تسعير الـ Offline، والحل الصريح. | `/app/applet/src/components/offline/OutboxDrawer.tsx:749` |
| 48 | `offline.labels.txt_712649` | `offline` | فحص التحقق الآلي للتعارضات (Automated Conflict Test Suite) | `/app/applet/src/components/offline/OutboxDrawer.tsx:746` |
| 49 | `offline.labels.editMaterial` | `offline` | MASTER_DATA_CHANGED إيقاف أو تعديل المادة | `/app/applet/src/components/offline/OutboxDrawer.tsx:735` |
| 50 | `offline.labels.txt_759c62` | `offline` | 7. تغيير بيانات أساسية | `/app/applet/src/components/offline/OutboxDrawer.tsx:733` |
| 51 | `offline.labels.txt_7eb4ca` | `offline` | TRUCK_CARRIER_CONFLICT تبعية | `/app/applet/src/components/offline/OutboxDrawer.tsx:723` |
| 52 | `offline.labels.carrier` | `offline` | 6. تعارض الناقل | `/app/applet/src/components/offline/OutboxDrawer.tsx:721` |
| 53 | `offline.labels.txt_15265b` | `offline` | DUPLICATE_OPERATION تكرار القيد | `/app/applet/src/components/offline/OutboxDrawer.tsx:711` |
| 54 | `offline.labels.txt_32233e` | `offline` | 5. تكرار تذكرة | `/app/applet/src/components/offline/OutboxDrawer.tsx:709` |
| 55 | `offline.labels.txt_5fc250` | `offline` | TRIP_ALREADY_RETURNED مرفوضة | `/app/applet/src/components/offline/OutboxDrawer.tsx:699` |
| 56 | `offline.labels.trip_2` | `offline` | 4. رحلة مرتجعة | `/app/applet/src/components/offline/OutboxDrawer.tsx:697` |
| 57 | `offline.labels.txt_2a087d` | `offline` | TRIP_ALREADY_COMPLETED مغلقة | `/app/applet/src/components/offline/OutboxDrawer.tsx:687` |
| 58 | `offline.status.trip` | `offline` | 3. رحلة مكتملة | `/app/applet/src/components/offline/OutboxDrawer.tsx:685` |
| 59 | `offline.labels.edit_2` | `offline` | VERSION_CONFLICT توازي التعديل | `/app/applet/src/components/offline/OutboxDrawer.tsx:675` |
| 60 | `offline.labels.txt_4e058d` | `offline` | 2. تعارض إصدار | `/app/applet/src/components/offline/OutboxDrawer.tsx:673` |
| 61 | `offline.labels.txt_2eef0a` | `offline` | PRICING_CHANGED وحماية Snapshot | `/app/applet/src/components/offline/OutboxDrawer.tsx:663` |
| 62 | `offline.labels.txt_532950` | `offline` | جاري المحاكاة... | `/app/applet/src/components/offline/OutboxDrawer.tsx:648` |
| 63 | `offline.labels.pricing_2` | `offline` | اضغط لتوليد أي سيناريو واختبار آلية التدقيق وحماية التسعير ومنع الكتابة التلقائية: | `/app/applet/src/components/offline/OutboxDrawer.tsx:642` |
| 64 | `offline.labels.txt_55319d` | `offline` | محاكي التعارضات التشغيلية (Interactive Conflict Simulator) | `/app/applet/src/components/offline/OutboxDrawer.tsx:639` |
| 65 | `offline.labels.txt_6aae4c` | `offline` | سريان الأسعار الجديدة: | `/app/applet/src/components/offline/OutboxDrawer.tsx:628` |
| 66 | `offline.labels.save_2` | `offline` | يتم تجميد الأمر المحلي وحفظ حالة الخادم وإصدار سجل تعارض موثق في IndexedDB. | `/app/applet/src/components/offline/OutboxDrawer.tsx:624` |
| 67 | `offline.labels.save` | `offline` | حفظ الأمرين: | `/app/applet/src/components/offline/OutboxDrawer.tsx:624` |
| 68 | `offline.labels.txt_197045` | `offline` | ثبات تسعير الـ Offline: | `/app/applet/src/components/offline/OutboxDrawer.tsx:620` |
| 69 | `offline.labels.txt_5753f6` | `offline` | لا يتم استبدال البيانات التشغيلية للرحلات تلقائياً، بل يُلزم المشرف بالحل الصريح. | `/app/applet/src/components/offline/OutboxDrawer.tsx:616` |
| 70 | `offline.labels.txt_44754a` | `offline` | منع "آخر كتابة تفوز" (No LWW): | `/app/applet/src/components/offline/OutboxDrawer.tsx:616` |
| 71 | `offline.labels.txt_21781d` | `offline` | محددات حوكمة التعارضات (Conflict Resolution Mandates) | `/app/applet/src/components/offline/OutboxDrawer.tsx:607` |
| 72 | `offline.labels.txt_a748f4` | `offline` | إعادة فحص (Retry) | `/app/applet/src/components/offline/OutboxDrawer.tsx:581` |
| 73 | `offline.labels.txt_46be08` | `offline` | حل التعارض الصريح | `/app/applet/src/components/offline/OutboxDrawer.tsx:571` |
| 74 | `offline.labels.details` | `offline` | تفاصيل التعارض (Conflict Detected): | `/app/applet/src/components/offline/OutboxDrawer.tsx:548` |
| 75 | `offline.status.failed_2` | `offline` | سبب الفشل (Server Validation Error): | `/app/applet/src/components/offline/OutboxDrawer.tsx:538` |
| 76 | `offline.labels.txt_292ade` | `offline` | استجابة المصادقة الخادومية (Server ACK): | `/app/applet/src/components/offline/OutboxDrawer.tsx:528` |
| 77 | `offline.status.pending_2` | `offline` | تنبيه تسعير معلق (Pending Pricing Resolution): | `/app/applet/src/components/offline/OutboxDrawer.tsx:515` |
| 78 | `offline.labels.txt_6526c5` | `offline` | المحاولات: | `/app/applet/src/components/offline/OutboxDrawer.tsx:505` |
| 79 | `offline.labels.txt_402c63` | `offline` | المبلغ والتسوية: | `/app/applet/src/components/offline/OutboxDrawer.tsx:492` |
| 80 | `offline.labels.createTrip_2` | `offline` | عند العمل في وضع عدم الاتصال (Offline) وإنشاء رحلة من محطة التحميل، ستظهر العمليات هنا تلقائياً لتتم مزامنتها. | `/app/applet/src/components/offline/OutboxDrawer.tsx:451` |
| 81 | `offline.labels.txt_9b46da` | `offline` | لا توجد عمليات في هذا التصنيف | `/app/applet/src/components/offline/OutboxDrawer.tsx:449` |
| 82 | `offline.labels.txt_8b427e` | `offline` | مسح المؤكدة | `/app/applet/src/components/offline/OutboxDrawer.tsx:431` |
| 83 | `offline.labels.txt_4043c4` | `offline` | تنظيف العمليات المزامنة | `/app/applet/src/components/offline/OutboxDrawer.tsx:428` |
| 84 | `offline.labels.filter` | `offline` | التصفية: | `/app/applet/src/components/offline/OutboxDrawer.tsx:407` |
| 85 | `offline.labels.txt_519208` | `offline` | الذاكرة المحلية IndexedDB (Master Data) | `/app/applet/src/components/offline/OutboxDrawer.tsx:396` |
| 86 | `offline.labels.txt_47ad3c` | `offline` | معالجة التعارضات (Conflicts) | `/app/applet/src/components/offline/OutboxDrawer.tsx:379` |
| 87 | `offline.labels.txt_66c55e` | `offline` | طابور الصادر (Outbox Queue) | `/app/applet/src/components/offline/OutboxDrawer.tsx:362` |
| 88 | `offline.labels.txt_31f297` | `offline` | محاكاة انقطاع الإنترنت: | `/app/applet/src/components/offline/OutboxDrawer.tsx:337` |
| 89 | `offline.labels.txt_74ecba` | `offline` | حالة الشبكة: غير متصل (Offline Mode) | `/app/applet/src/components/offline/OutboxDrawer.tsx:326` |
| 90 | `offline.labels.txt_3f37a7` | `offline` | حالة الشبكة: متصل بالإنترنت (Online) | `/app/applet/src/components/offline/OutboxDrawer.tsx:321` |
| 91 | `offline.labels.txt_140117` | `offline` | حالة IndexedDB المحلية، طابور الصادر Outbox، وخطوات المزامنة الخادومية | `/app/applet/src/components/offline/OutboxDrawer.tsx:303` |
| 92 | `offline.labels.txt_5542eb` | `offline` | إدارة عدم الاتصال والمزامنة (Offline-First PWA) | `/app/applet/src/components/offline/OutboxDrawer.tsx:302` |
| 93 | `offline.labels.txt_751d01` | `offline` | تعارض CONFLICT | `/app/applet/src/components/offline/OutboxDrawer.tsx:276` |
| 94 | `offline.status.txt_177559` | `offline` | فشلت FAILED | `/app/applet/src/components/offline/OutboxDrawer.tsx:269` |
| 95 | `offline.labels.txt_731fc0` | `offline` | تمت المزامنة SYNCED | `/app/applet/src/components/offline/OutboxDrawer.tsx:262` |
| 96 | `offline.labels.txt_3bb240` | `offline` | جاري الإرسال SENDING | `/app/applet/src/components/offline/OutboxDrawer.tsx:255` |
| 97 | `offline.labels.txt_7eabcf` | `offline` | قيد الانتظار PENDING | `/app/applet/src/components/offline/OutboxDrawer.tsx:248` |
| 98 | `offline.labels.txt_3db2df` | `offline` | فهمت ذلك | `/app/applet/src/components/offline/PWAInstallButton.tsx:71` |
| 99 | `offline.labels.txt_2a088a` | `offline` | سيعمل التطبيق كبرنامج مستقل بالكامل بدون إنترنت عبر تقنية Offline PWA. | `/app/applet/src/components/offline/PWAInstallButton.tsx:64` |
| 100 | `offline.labels.add` | `offline` | إضافة إلى الصفحة الرئيسية (Add to Home Screen) | `/app/applet/src/components/offline/PWAInstallButton.tsx:60` |
| 101 | `offline.labels.txt_25bbf9` | `offline` | مرر للأسفل واختر | `/app/applet/src/components/offline/PWAInstallButton.tsx:60` |
| 102 | `offline.labels.txt_1bc609` | `offline` | في شريط متصفح سفاري. | `/app/applet/src/components/offline/PWAInstallButton.tsx:56` |
| 103 | `offline.labels.txt_6a75f1` | `offline` | المشاركة (Share) | `/app/applet/src/components/offline/PWAInstallButton.tsx:56` |
| 104 | `offline.labels.txt_540354` | `offline` | اضغط على زر | `/app/applet/src/components/offline/PWAInstallButton.tsx:56` |
| 105 | `offline.labels.txt_35c87e` | `offline` | تثبيت التطبيق على أجهزة iOS | `/app/applet/src/components/offline/PWAInstallButton.tsx:45` |
| 106 | `offline.labels.txt_6357c3` | `offline` | تثبيت PWA | `/app/applet/src/components/offline/PWAInstallButton.tsx:38` |
| 107 | `offline.labels.txt_78ff43` | `offline` | تثبيت على أجهزة آيفون / آيباد | `/app/applet/src/components/offline/PWAInstallButton.tsx:35` |
| 108 | `offline.labels.txt_6fd255` | `offline` | تثبيت التطبيق (PWA) | `/app/applet/src/components/offline/PWAInstallButton.tsx:23` |
| 109 | `offline.labels.txt_7c7b96` | `offline` | تثبيت التطبيق على جهازك للعمل بدون إنترنت PWA | `/app/applet/src/components/offline/PWAInstallButton.tsx:20` |
| 110 | `other.labels.txt_633e2d` | `other` | الوثيقة المحتسبة والمختومة بالطوابع الإلزامية (Ready for Firestore SSOT): | `/app/applet/src/components/FirestoreArchitectureView.tsx:760` |
| 111 | `other.labels.txt_72168c` | `other` | اختبار رفض هوية سائق غير صحيحة (Driver Validator Test) | `/app/applet/src/components/FirestoreArchitectureView.tsx:722` |
| 112 | `other.labels.trip_3` | `other` | محاكاة إطلاق رحلة نظامية (Valid Trip Dispatch) | `/app/applet/src/components/FirestoreArchitectureView.tsx:713` |
| 113 | `other.labels.txt_16e97e` | `other` | DRIVER (سائق ميداني) | `/app/applet/src/components/FirestoreArchitectureView.tsx:700` |
| 114 | `other.labels.txt_4648ec` | `other` | FINANCE_AUDITOR (مدقق مالي) | `/app/applet/src/components/FirestoreArchitectureView.tsx:699` |
| 115 | `other.labels.txt_265a70` | `other` | DISPATCHER (مأمور حركة) | `/app/applet/src/components/FirestoreArchitectureView.tsx:698` |
| 116 | `other.labels.txt_158f99` | `other` | PROJECT_ADMIN (مدير مشروع) | `/app/applet/src/components/FirestoreArchitectureView.tsx:697` |
| 117 | `other.labels.user_4` | `other` | دور المستخدم الفاعل: | `/app/applet/src/components/FirestoreArchitectureView.tsx:691` |
| 118 | `other.labels.txt_139e03` | `other` | تحقق عملي يثبت أن الواجهة لا تكتب في Firestore إلا بعد المرور عبر Service ➔ Validator ➔ Repository. | `/app/applet/src/components/FirestoreArchitectureView.tsx:685` |
| 119 | `other.labels.txt_20e3e1` | `other` | محاكي التدفق المعماري التفاعلي (Pipeline Verification) | `/app/applet/src/components/FirestoreArchitectureView.tsx:682` |
| 120 | `other.labels.refresh` | `other` | يعزل استدعاءات Firestore مع معالجة الأخطاء وطوابع التحديث التلقائية. | `/app/applet/src/components/FirestoreArchitectureView.tsx:650` |
| 121 | `other.labels.txt_3c30da` | `other` | مستودع البيانات (Repository) | `/app/applet/src/components/FirestoreArchitectureView.tsx:644` |
| 122 | `other.labels.txt_2bbe99` | `other` | بوابة الأعمال الوحيدة المسموح لـ React باستدعائها. يمنع الكتابات المباشرة. | `/app/applet/src/components/FirestoreArchitectureView.tsx:631` |
| 123 | `other.labels.txt_9d8db2` | `other` | طبقة المنطق (Service) | `/app/applet/src/components/FirestoreArchitectureView.tsx:625` |
| 124 | `other.labels.save` | `other` | يفحص ضوابط النطاق وقواعد المملكة قبل أي حفظ في قاعدة البيانات. | `/app/applet/src/components/FirestoreArchitectureView.tsx:612` |
| 125 | `other.labels.txt_2168d6` | `other` | محرك التحقق (Validator) | `/app/applet/src/components/FirestoreArchitectureView.tsx:606` |
| 126 | `other.labels.txt_54bf89` | `other` | مسار المجموعة الهيكلي في Firestore: | `/app/applet/src/components/FirestoreArchitectureView.tsx:591` |
| 127 | `other.labels.txt_6aaf22` | `other` | النطاقات الـ 13 (Domain Modules) | `/app/applet/src/components/FirestoreArchitectureView.tsx:524` |
| 128 | `other.labels.txt_38f4aa` | `other` | بنية مجزأة لكل نطاق بشكل مستقل | `/app/applet/src/components/FirestoreArchitectureView.tsx:512` |
| 129 | `other.labels.txt_1b9b40` | `other` | حظر الكتابة المباشرة من المتصفح | `/app/applet/src/components/FirestoreArchitectureView.tsx:505` |
| 130 | `other.labels.txt_68176b` | `other` | طابع زمني وهوية آخر مُعدّل | `/app/applet/src/components/FirestoreArchitectureView.tsx:498` |
| 131 | `other.labels.txt_109310` | `other` | طابع زمني وهوية منشئ السجل | `/app/applet/src/components/FirestoreArchitectureView.tsx:491` |
| 132 | `other.labels.txt_4c37e4` | `other` | فحص الاتصال (Server Ping) | `/app/applet/src/components/FirestoreArchitectureView.tsx:480` |
| 133 | `other.labels.txt_1ea1ac` | `other` | قاعدة البيانات التشغيلية الأساسية (SSOT) مفعّلة وفق قواعد الأمان الصارمة Zero-Trust ABAC. | `/app/applet/src/components/FirestoreArchitectureView.tsx:464` |
| 134 | `other.labels.txt_259961` | `other` | حالة اتصال وتكامل Firestore & Firebase | `/app/applet/src/components/FirestoreArchitectureView.tsx:453` |
| 135 | `other.labels.saveDriver` | `other` | حفظ وتطبيع السائق | `/app/applet/src/components/masterData/MasterDataView.tsx:1801` |
| 136 | `other.labels.driver_6` | `other` | معرّف السائق (Driver ID): | `/app/applet/src/components/masterData/MasterDataView.tsx:1735` |
| 137 | `other.labels.carrier_10` | `other` | -- اختر الناقل المعتمد -- | `/app/applet/src/components/masterData/MasterDataView.tsx:1726` |
| 138 | `other.labels.saveTruck` | `other` | حفظ وتطبيع الشاحنة | `/app/applet/src/components/masterData/MasterDataView.tsx:1709` |
| 139 | `other.labels.truck_5` | `other` | معرّف الشاحنة (Truck ID): | `/app/applet/src/components/masterData/MasterDataView.tsx:1649` |
| 140 | `other.labels.carrier_10` | `other` | -- اختر الناقل المعتمد -- | `/app/applet/src/components/masterData/MasterDataView.tsx:1640` |
| 141 | `other.labels.saveMaterial` | `other` | حفظ وتطبيع المادة | `/app/applet/src/components/masterData/MasterDataView.tsx:1623` |
| 142 | `other.labels.txt_3fb9ae` | `other` | بالرد (TRIP) | `/app/applet/src/components/masterData/MasterDataView.tsx:1608` |
| 143 | `other.labels.txt_109c7a` | `other` | وحدة القياس الأساسية: | `/app/applet/src/components/masterData/MasterDataView.tsx:1600` |
| 144 | `other.labels.material_9` | `other` | معرّف المادة (Material ID): | `/app/applet/src/components/masterData/MasterDataView.tsx:1562` |
| 145 | `other.labels.saveCarrier` | `other` | حفظ وتطبيع الناقل | `/app/applet/src/components/masterData/MasterDataView.tsx:1552` |
| 146 | `other.labels.txt_68f9e8` | `other` | السجل التجاري (10 أرقام): | `/app/applet/src/components/masterData/MasterDataView.tsx:1530` |
| 147 | `other.labels.txt_34897c` | `other` | تعطيل السجل (تحويل إلى INACTIVE) | `/app/applet/src/components/masterData/MasterDataView.tsx:1473` |
| 148 | `other.labels.txt_7bb941` | `other` | مع ذلك، وتطبيقاً لقاعدة «استخدم ACTIVE/INACTIVE بدلاً من hard delete»، سيتم تعطيل السجل بتحويل حالته إلى (INACTIVE). | `/app/applet/src/components/masterData/MasterDataView.tsx:1443` |
| 149 | `other.labels.txt_f87929` | `other` | لم يتم استخدام هذا السجل في أي رحلات سابقة | `/app/applet/src/components/masterData/MasterDataView.tsx:1440` |
| 150 | `other.labels.txt_63748e` | `other` | يمكنك تحويل حالة السجل إلى | `/app/applet/src/components/masterData/MasterDataView.tsx:1432` |
| 151 | `other.labels.txt_4755d8` | `other` | الإجراء النظامي المتاح: | `/app/applet/src/components/masterData/MasterDataView.tsx:1430` |
| 152 | `other.labels.delete_6` | `other` | وفقاً للقاعدة الصارمة لمنظومة النقل الثقيل (Q Saudi): «ممنوع حذف Master Data المستخدمة في رحلات سابقة، واستخدم ACTIVE/INACTIVE بدلاً من hard delete». | `/app/applet/src/components/masterData/MasterDataView.tsx:1425` |
| 153 | `other.labels.txt_67f664` | `other` | مسجلة في النظام: | `/app/applet/src/components/masterData/MasterDataView.tsx:1418` |
| 154 | `other.labels.txt_73dcb9` | `other` | هذا السجل مرتبط بـ | `/app/applet/src/components/masterData/MasterDataView.tsx:1418` |
| 155 | `other.labels.delete_5` | `other` | ممنوع الحذف الفعلي (Hard Delete) نهائياً! | `/app/applet/src/components/masterData/MasterDataView.tsx:1415` |
| 156 | `other.labels.trips_4` | `other` | جارٍ فحص الرحلات السابقة والعمليات المحاسبية المرتبطة بهذا السجل... | `/app/applet/src/components/masterData/MasterDataView.tsx:1408` |
| 157 | `other.labels.txt_674f3e` | `other` | اضغط على زر «إعادة تشغيل الاختبارات» لتشغيل الحزمة فورياً. | `/app/applet/src/components/masterData/MasterDataView.tsx:1376` |
| 158 | `other.labels.txt_592f64` | `other` | راسب (FAILED) | `/app/applet/src/components/masterData/MasterDataView.tsx:1367` |
| 159 | `other.labels.txt_71317d` | `other` | جارٍ تنفيذ السيناريوهات الاختبارية في الذاكرة ومستودع Firestore... | `/app/applet/src/components/masterData/MasterDataView.tsx:1327` |
| 160 | `other.labels.txt_394b13` | `other` | حالة الاعتماد المعماري | `/app/applet/src/components/masterData/MasterDataView.tsx:1318` |
| 161 | `other.labels.enterprise` | `other` | Enterprise | `/app/applet/src/components/masterData/MasterDataView.tsx:1317` |
| 162 | `other.labels.txt_ebe0e2` | `other` | إخفاقات | `/app/applet/src/components/masterData/MasterDataView.tsx:1314` |
| 163 | `other.labels.txt_5c9a61` | `other` | فحوصات ناجحة (100%) | `/app/applet/src/components/masterData/MasterDataView.tsx:1310` |
| 164 | `other.labels.delete_3` | `other` | التحقق البرمجي التلقائي من علاقات الكيانات، عزل المشاريع، حظر الحذف للسجلات المستخدمة، ودورة حياة ACTIVE/INACTIVE. | `/app/applet/src/components/masterData/MasterDataView.tsx:1286` |
| 165 | `other.labels.txt_47f763` | `other` | نتائج الفحص الهندسي الصارم لوحدات Master Data (9 فئات اختبار) | `/app/applet/src/components/masterData/MasterDataView.tsx:1283` |
| 166 | `other.labels.deleteDriverTrips` | `other` | حذف السائق (فحص الرحلات والنزاهة) | `/app/applet/src/components/masterData/MasterDataView.tsx:1262` |
| 167 | `other.labels.txt_66cfae` | `other` | ناقل غير مصرح | `/app/applet/src/components/masterData/MasterDataView.tsx:1233` |
| 168 | `other.labels.txt_36b6da` | `other` | ناقل معتمد | `/app/applet/src/components/masterData/MasterDataView.tsx:1231` |
| 169 | `other.labels.driver_3` | `other` | حالة السائق | `/app/applet/src/components/masterData/MasterDataView.tsx:1197` |
| 170 | `other.labels.carrier_8` | `other` | الناقل التابع له (Driver → Carrier) | `/app/applet/src/components/masterData/MasterDataView.tsx:1196` |
| 171 | `other.labels.txt_618712` | `other` | الهوية / الإقامة | `/app/applet/src/components/masterData/MasterDataView.tsx:1194` |
| 172 | `other.labels.driver_2` | `other` | معرّف السائق | `/app/applet/src/components/masterData/MasterDataView.tsx:1192` |
| 173 | `other.labels.deleteTruckTrips` | `other` | حذف الشاحنة (فحص الرحلات والنزاهة) | `/app/applet/src/components/masterData/MasterDataView.tsx:1172` |
| 174 | `other.labels.txt_66cfae` | `other` | ناقل غير مصرح | `/app/applet/src/components/masterData/MasterDataView.tsx:1139` |
| 175 | `other.labels.txt_36b6da` | `other` | ناقل معتمد | `/app/applet/src/components/masterData/MasterDataView.tsx:1137` |
| 176 | `other.labels.truck_2` | `other` | حالة الشاحنة | `/app/applet/src/components/masterData/MasterDataView.tsx:1109` |
| 177 | `other.labels.txt_3aa747` | `other` | أوزان الأمان (فارغ / إجمالي) | `/app/applet/src/components/masterData/MasterDataView.tsx:1108` |
| 178 | `other.labels.carrier_7` | `other` | الناقل التابع له (Truck → Carrier) | `/app/applet/src/components/masterData/MasterDataView.tsx:1107` |
| 179 | `other.labels.truck` | `other` | معرّف الشاحنة | `/app/applet/src/components/masterData/MasterDataView.tsx:1105` |
| 180 | `other.labels.deleteMaterialTrips` | `other` | حذف المادة (فحص الرحلات والنزاهة) | `/app/applet/src/components/masterData/MasterDataView.tsx:1085` |
| 181 | `other.labels.project_5` | `other` | مصرح بالمشروع | `/app/applet/src/components/masterData/MasterDataView.tsx:1051` |
| 182 | `other.labels.materialProject_3` | `other` | تبديل تصريح المادة لهذا المشروع | `/app/applet/src/components/masterData/MasterDataView.tsx:1046` |
| 183 | `other.labels.material_6` | `other` | حالة المادة | `/app/applet/src/components/masterData/MasterDataView.tsx:1010` |
| 184 | `other.labels.project_6` | `other` | تصريح التوريد بالمشروع | `/app/applet/src/components/masterData/MasterDataView.tsx:1009` |
| 185 | `other.labels.material_4` | `other` | معرّف المادة | `/app/applet/src/components/masterData/MasterDataView.tsx:1005` |
| 186 | `other.labels.deleteCarrierTrips` | `other` | حذف الناقل (فحص الرحلات والنزاهة) | `/app/applet/src/components/masterData/MasterDataView.tsx:985` |
| 187 | `other.labels.project_5` | `other` | مصرح بالمشروع | `/app/applet/src/components/masterData/MasterDataView.tsx:951` |
| 188 | `other.labels.carrierProject_2` | `other` | تبديل تصريح الناقل لهذا المشروع | `/app/applet/src/components/masterData/MasterDataView.tsx:946` |
| 189 | `other.labels.carrier_4` | `other` | حالة الناقل | `/app/applet/src/components/masterData/MasterDataView.tsx:913` |
| 190 | `other.labels.project_4` | `other` | تصريح المشروع | `/app/applet/src/components/masterData/MasterDataView.tsx:912` |
| 191 | `other.labels.carrier_3` | `other` | معرّف الناقل | `/app/applet/src/components/masterData/MasterDataView.tsx:909` |
| 192 | `other.labels.txt_6b093a` | `other` | جميع النواقل | `/app/applet/src/components/masterData/MasterDataView.tsx:889` |
| 193 | `other.labels.txt_f4c520` | `other` | المعطلة فقط (INACTIVE) | `/app/applet/src/components/masterData/MasterDataView.tsx:876` |
| 194 | `other.status.txt_671eeb` | `other` | النشطة فقط (ACTIVE) | `/app/applet/src/components/masterData/MasterDataView.tsx:875` |
| 195 | `other.labels.txt_2ed1b5` | `other` | الكل (ACTIVE + INACTIVE) | `/app/applet/src/components/masterData/MasterDataView.tsx:874` |
| 196 | `other.labels.txt_35c4cc` | `other` | فحص النزاهة والاختبارات الآلية | `/app/applet/src/components/masterData/MasterDataView.tsx:827` |
| 197 | `other.labels.drivers_5` | `other` | السائقون (Drivers) | `/app/applet/src/components/masterData/MasterDataView.tsx:801` |
| 198 | `other.labels.carriers_4` | `other` | الناقلون (Carriers) | `/app/applet/src/components/masterData/MasterDataView.tsx:744` |
| 199 | `other.labels.materialsTrucks` | `other` | كل مشروع يحتوي فقط على المواد والنواقل المصرح لهم به رسمياً، وتتبعهم الشاحنات والسائقين. | `/app/applet/src/components/masterData/MasterDataView.tsx:706` |
| 200 | `other.labels.materials_5` | `other` | حصر المواد والنواقل لكل مشروع: | `/app/applet/src/components/masterData/MasterDataView.tsx:705` |
| 201 | `other.labels.delete_2` | `other` | يُعتمد التعطيل (INACTIVE) بدلاً من الحذف الفعلي، لمنع استخدامه في رحلات مستقبلية. | `/app/applet/src/components/masterData/MasterDataView.tsx:699` |
| 202 | `other.labels.txt_207857` | `other` | نظام ACTIVE / INACTIVE: | `/app/applet/src/components/masterData/MasterDataView.tsx:698` |
| 203 | `other.labels.txt_714016` | `other` | أي ناقل أو مادة أو شاحنة أو سائق ورد في رحلات سابقة لا يُحذف مطلقاً لحماية الحسابات. | `/app/applet/src/components/masterData/MasterDataView.tsx:692` |
| 204 | `other.labels.delete` | `other` | ممنوع حذف السجلات المستخدمة: | `/app/applet/src/components/masterData/MasterDataView.tsx:691` |
| 205 | `other.labels.refresh_2` | `other` | تحديث البيانات | `/app/applet/src/components/masterData/MasterDataView.tsx:678` |
| 206 | `other.status.projectActive` | `other` | المشروع النشط: | `/app/applet/src/components/masterData/MasterDataView.tsx:663` |
| 207 | `other.labels.projects_5` | `other` | عزل المشاريع ونزاهة السجلات | `/app/applet/src/components/masterData/MasterDataView.tsx:653` |
| 208 | `other.labels.txt_7f7eb1` | `other` | إدارة البيانات الرئيسية (Master Data Modules) | `/app/applet/src/components/masterData/MasterDataView.tsx:650` |
| 209 | `other.labels.txt_1e1bdf` | `other` | تسجيل الدخول عبر Google | `/app/applet/src/components/masterData/MasterDataView.tsx:636` |
| 210 | `other.labels.txt_4e4d76` | `other` | يعمل التطبيق حالياً بالبيانات المرجعية الكاملة للمشاريع السعودية. لتفعيل المزامنة المباشرة لقواعد بيانات Firestore وتخزين التعديلات سحابياً، يمكنك تسجيل الدخول بحساب Google. | `/app/applet/src/components/masterData/MasterDataView.tsx:628` |
| 211 | `other.labels.txt_486bf8` | `other` | وضع الاستعراض والتجربة (Preview Mode) | `/app/applet/src/components/masterData/MasterDataView.tsx:626` |
| 212 | `other.status.success_3` | `other` | تم التحقق من الاتصال السحابي بنجاح | `/app/applet/src/components/wizard/Step6GoogleDrive.tsx:255` |
| 213 | `other.labels.txt_24c076` | `other` | جاهزية حساب الخدمة وحقوق الوصول السحابية (Service Account Credentials) | `/app/applet/src/components/wizard/Step6GoogleDrive.tsx:247` |
| 214 | `other.labels.trips_7` | `other` | أرشفة ملخص الرحلات وإشعارات التوريد بنهاية كل وردية | `/app/applet/src/components/wizard/Step6GoogleDrive.tsx:237` |
| 215 | `other.labels.materials_7` | `other` | ملخص استهلاك المواد الصادرة (Material Totals) | `/app/applet/src/components/wizard/Step6GoogleDrive.tsx:208` |
| 216 | `other.labels.txt_4a65bf` | `other` | كشف مطابقات الناقلين (Carrier Settlements) | `/app/applet/src/components/wizard/Step6GoogleDrive.tsx:204` |
| 217 | `other.labels.trips_6` | `other` | سجل الرحلات اليومي (Trips Log) | `/app/applet/src/components/wizard/Step6GoogleDrive.tsx:196` |
| 218 | `other.labels.txt_13cd13` | `other` | 📊 أوراق عمل Google Sheets (Tabs): | `/app/applet/src/components/wizard/Step6GoogleDrive.tsx:191` |
| 219 | `other.labels.txt_330dcc` | `other` | 📂 مجلدات Google Drive: | `/app/applet/src/components/wizard/Step6GoogleDrive.tsx:176` |
| 220 | `other.labels.txt_24cc60` | `other` | هيكل المجلدات والأوراق السحابية التي سيتم إنشاؤها تلقائياً: | `/app/applet/src/components/wizard/Step6GoogleDrive.tsx:169` |
| 221 | `other.labels.txt_5860fa` | `other` | المصنف المالي والتشغيلي المتزامن لحظياً مع Firestore. | `/app/applet/src/components/wizard/Step6GoogleDrive.tsx:160` |
| 222 | `other.labels.txt_1a0a87` | `other` | عنوان جدول العمليات Google Sheets (spreadsheetTitle) | `/app/applet/src/components/wizard/Step6GoogleDrive.tsx:150` |
| 223 | `other.labels.txt_14af6c` | `other` | المجلد الحاوي لكافة تذاكر الميزان، إشعارات التوريد وسجلات الشاحنات. | `/app/applet/src/components/wizard/Step6GoogleDrive.tsx:144` |
| 224 | `other.labels.createProject` | `other` | إنشاء المجلدات السحابية وتوزيع الجداول تلقائياً فور اعتماد المشروع في Firestore. | `/app/applet/src/components/wizard/Step6GoogleDrive.tsx:111` |
| 225 | `other.labels.txt_558322` | `other` | تفعيل التهيئة الآلية لمساحة عمل Google Drive و Sheets | `/app/applet/src/components/wizard/Step6GoogleDrive.tsx:108` |
| 226 | `other.labels.txt_f8afcf` | `other` | تنبيهات تهيئة Google Workspace: | `/app/applet/src/components/wizard/Step6GoogleDrive.tsx:90` |
| 227 | `other.labels.txt_412551` | `other` | توليد التسميات الآلية للمشروع | `/app/applet/src/components/wizard/Step6GoogleDrive.tsx:84` |
| 228 | `other.labels.txt_1118c2` | `other` | الخطوة 6: تهيئة مساحة العمل السحابية (Google Drive & Sheets Provisioning) | `/app/applet/src/components/wizard/Step6GoogleDrive.tsx:71` |

## 4. Architectural Safety & Invariant Guarantees

- **Zero Non-SAFE Transformations:** 100% of applied replacements were classified as `SAFE`. Zero `LOW_RISK`, `HIGH_RISK`, `REVIEW_ONLY`, or `SKIP` candidates were applied.
- **Zero Business Logic Modification:** 0 pricing logic changes, 0 report logic changes, 0 import logic changes, 0 security changes, 0 Firestore changes, 0 API changes, 0 database schema changes, 0 state-machine changes, 0 offline logic changes.
- **Zero CSS Directional Alterations:** No Tailwind directional classes (e.g. `mr-`, `pl-`, `left-`, `right-`, `dir="rtl"`, `dir="ltr"`) were altered.
- **React Hook Integrity:** All components import `useI18n` exactly once, and invoke `const { t } = useI18n()` strictly at the top level of the component body.
- **Protected Business Identifiers Preserved:** Zero business tokens (`projectId`, `ticketId`, `truckNo`, `carrierId`, `status`, etc.) or machine-readable values (`COMPLETED`, `PENDING`, `ACTIVE`, etc.) were transformed.
- **Arabic Production Behavior Preserved:** All applied keys resolve to identical Arabic strings registered in the Arabic locale dictionary.
- **Idempotency Verified:** Re-running the scanner confirms 0 pending SAFE candidates for migrated nodes, with zero duplicate translations.

## 5. Next Steps

BLOCK 48 SAFE batch migration is complete. All regression tests green and changes verified.
