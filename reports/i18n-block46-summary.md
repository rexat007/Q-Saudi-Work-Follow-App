# BLOCK 46 — Controlled i18n Migration: SAFE Batch Summary Report

## 1. Executive Summary

- **Execution Mode:** SAFE Batch Expansion Applied (Production Source Migration)
- **Timestamp:** 2026-09-12T10:48:25.332Z
- **Total SAFE Candidates Detected in Dry-Run:** 1112
- **Total SAFE Candidates Evaluated:** 1086
- **Total SAFE Candidates Applied in Batch:** 300 (Max batch ceiling: 300)
- **Categories Migrated:** navigation (57), authentication (4), dashboard (75), projects (37), carriers (19), entityResolution (65), exceptions (43)
- **Deferred / Protected Categories:** trips, loading, unloading, weighbridge, imports, pricing, reports, security, offline, database schemas (Strictly protected)
- **Total Files Modified:** 12

## 2. File Hashes & Verification

| File Path | Pre-Migration Hash | Post-Migration Hash | Transforms Applied | Status |
|-----------|--------------------|---------------------|--------------------|--------|
| `/app/applet/src/components/workspace/WorkspaceIntegrationView.tsx` | `a84e9837f9ef56dd` | `325d825b2d407b30` | 57 | VALIDATED & APPLIED |
| `/app/applet/src/components/auth/AuthButton.tsx` | `6b5126ec34084824` | `c4cca59858543253` | 4 | VALIDATED & APPLIED |
| `/app/applet/src/components/dashboard/OperationsDashboardView.tsx` | `fc183ad7659b5f4b` | `77cf54665b0a955e` | 68 | VALIDATED & APPLIED |
| `/app/applet/src/components/dashboard/WidgetFilterBar.tsx` | `e3df66cf9628a519` | `f7a06d3a185def4e` | 7 | VALIDATED & APPLIED |
| `/app/applet/src/components/wizard/ProjectSetupWizard.tsx` | `b3107391a3d50896` | `87665f5d0ee94e17` | 6 | VALIDATED & APPLIED |
| `/app/applet/src/components/wizard/Step1ProjectInfo.tsx` | `f3420a520b467fac` | `4d108d68b37b7e78` | 14 | VALIDATED & APPLIED |
| `/app/applet/src/components/wizard/Step5ProjectAccess.tsx` | `e1661d1431fe49f0` | `6bc686279ecec452` | 17 | VALIDATED & APPLIED |
| `/app/applet/src/components/wizard/Step3Carriers.tsx` | `50ad58f25127b8ac` | `f5b8beaa1d3fddb4` | 11 | VALIDATED & APPLIED |
| `/app/applet/src/components/wizard/Step4PricingRules.tsx` | `e6994375e9198ba5` | `9f4810be96783c61` | 2 | VALIDATED & APPLIED |
| `/app/applet/src/components/wizard/Step7Review.tsx` | `3a8bcccaf6d0548a` | `cca51f1090d6f8d5` | 6 | VALIDATED & APPLIED |
| `/app/applet/src/components/dataQuality/DataQualityView.tsx` | `589227513ae8b2aa` | `9468f01fe66e26df` | 65 | VALIDATED & APPLIED |
| `/app/applet/src/components/exceptionEngine/ExceptionEngineView.tsx` | `64b8d9a772a76768` | `60583439ccb9a2a9` | 43 | VALIDATED & APPLIED |

## 3. Applied Translation Keys & Canonical Arabic Sources

| # | Translation Key | Category | Canonical Arabic Source | Applied In |
|---|-----------------|----------|-------------------------|------------|
| 1 | `navigation.labels.refresh_4` | `navigation` | التحديث يتم عبر فحص عمود tripId بدقة ومطابقة الصف المحدد حصراً. | `/app/applet/src/components/workspace/WorkspaceIntegrationView.tsx:749` |
| 2 | `navigation.labels.txt_3c3f5c` | `navigation` | مطابقة المفتاح التقني tripId: | `/app/applet/src/components/workspace/WorkspaceIntegrationView.tsx:748` |
| 3 | `navigation.labels.pricing_5` | `navigation` | أعمدة التسعير الستة تُضاف في أقصى اليمين (الأعمدة من 21 إلى 26). | `/app/applet/src/components/workspace/WorkspaceIntegrationView.tsx:741` |
| 4 | `navigation.labels.txt_15ec91` | `navigation` | التمدد غير الإتلافي (Additive Only): | `/app/applet/src/components/workspace/WorkspaceIntegrationView.tsx:740` |
| 5 | `navigation.labels.deleteReports` | `navigation` | لا يتم حذف أو إعادة ترتيب أي عمود قديم لمنع إتلاف التقارير الحالية. | `/app/applet/src/components/workspace/WorkspaceIntegrationView.tsx:733` |
| 6 | `navigation.labels.txt_177b34` | `navigation` | حماية الأعمدة الـ 20: | `/app/applet/src/components/workspace/WorkspaceIntegrationView.tsx:732` |
| 7 | `navigation.labels.txt_4d5df6` | `navigation` | خطة الترحيل وعدم كسر الأعمدة القديمة | `/app/applet/src/components/workspace/WorkspaceIntegrationView.tsx:721` |
| 8 | `navigation.labels.txt_310722` | `navigation` | فتح الملف المرفوع في Google Drive | `/app/applet/src/components/workspace/WorkspaceIntegrationView.tsx:708` |
| 9 | `navigation.labels.txt_1a928c` | `navigation` | imported files (ملفات الاستيراد) | `/app/applet/src/components/workspace/WorkspaceIntegrationView.tsx:692` |
| 10 | `navigation.labels.txt_114bd2` | `navigation` | reports (التقارير) | `/app/applet/src/components/workspace/WorkspaceIntegrationView.tsx:691` |
| 11 | `navigation.labels.txt_3f72a1` | `navigation` | printable documents (الوثائق القابلة للطباعة) | `/app/applet/src/components/workspace/WorkspaceIntegrationView.tsx:690` |
| 12 | `navigation.labels.upload` | `navigation` | رفع وثيقة تشغيلية إلى مجلد Drive للمشروع | `/app/applet/src/components/workspace/WorkspaceIntegrationView.tsx:672` |
| 13 | `navigation.labels.txt_7f13e8` | `navigation` | الإسقاط | `/app/applet/src/components/workspace/WorkspaceIntegrationView.tsx:663` |
| 14 | `navigation.labels.project_7` | `navigation` | سجل المشروع (Google Sheets) | `/app/applet/src/components/workspace/WorkspaceIntegrationView.tsx:661` |
| 15 | `navigation.labels.txt_acdcf5` | `navigation` | الوثائق القابلة للطباعة | `/app/applet/src/components/workspace/WorkspaceIntegrationView.tsx:655` |
| 16 | `navigation.labels.reports_2` | `navigation` | التقارير وسجلات التشغيل | `/app/applet/src/components/workspace/WorkspaceIntegrationView.tsx:647` |
| 17 | `navigation.labels.import` | `navigation` | ملفات الاستيراد | `/app/applet/src/components/workspace/WorkspaceIntegrationView.tsx:639` |
| 18 | `navigation.labels.projectReports` | `navigation` | تنظيم وثائق المشروع داخل المجلد الجذري مع ثلاثة مجلدات فرعية مخصصة للملفات المستوردة والتقارير والمستندات القابلة للطباعة: | `/app/applet/src/components/workspace/WorkspaceIntegrationView.tsx:623` |
| 19 | `navigation.labels.txt_102b03` | `navigation` | 4 مجلدات فرعية | `/app/applet/src/components/workspace/WorkspaceIntegrationView.tsx:618` |
| 20 | `navigation.labels.txt_136877` | `navigation` | هيكل Google Drive للمشروع | `/app/applet/src/components/workspace/WorkspaceIntegrationView.tsx:615` |
| 21 | `navigation.labels.txt_7f525d` | `navigation` | نتائج آخر عملية مزامنة وإسقاط ذكية (Upsert Summary) | `/app/applet/src/components/workspace/WorkspaceIntegrationView.tsx:585` |
| 22 | `navigation.labels.txt_2f3fde` | `navigation` | مستحق التسوية | `/app/applet/src/components/workspace/WorkspaceIntegrationView.tsx:528` |
| 23 | `navigation.labels.txt_4eac23` | `navigation` | الصافي (كجم) | `/app/applet/src/components/workspace/WorkspaceIntegrationView.tsx:524` |
| 24 | `navigation.labels.project_6` | `navigation` | معاينة رحلات المشروع المسقطة (جاهزة للإسقاط بالـ Upsert) | `/app/applet/src/components/workspace/WorkspaceIntegrationView.tsx:513` |
| 25 | `navigation.labels.txt_2d0c08` | `navigation` | 3. أعمدة التدقيق والمطابقة (Audit Metadata Columns) | `/app/applet/src/components/workspace/WorkspaceIntegrationView.tsx:494` |
| 26 | `navigation.labels.pricing_3` | `navigation` | 2. أعمدة التسعير الـ 6 المضافة حديثاً (Pricing Snapshot Columns) | `/app/applet/src/components/workspace/WorkspaceIntegrationView.tsx:478` |
| 27 | `navigation.labels.txt_19e865` | `navigation` | 1. أعمدة التشغيل الـ 20 الحالية (Legacy Operational Columns) | `/app/applet/src/components/workspace/WorkspaceIntegrationView.tsx:462` |
| 28 | `navigation.labels.pricing_2` | `navigation` | توافق أعمدة العمليات الـ 20 + أعمدة التسعير الـ 6 (مخطط الإسقاط الرسمي) | `/app/applet/src/components/workspace/WorkspaceIntegrationView.tsx:447` |
| 29 | `navigation.labels.refresh` | `navigation` | طريقة التحديث: | `/app/applet/src/components/workspace/WorkspaceIntegrationView.tsx:436` |
| 30 | `navigation.labels.txt_75522f` | `navigation` | فتح الشيت في Google Docs | `/app/applet/src/components/workspace/WorkspaceIntegrationView.tsx:394` |
| 31 | `navigation.labels.txt_42845c` | `navigation` | تمثيل متزامن ومحدث تلقائياً عبر Upsert بالمعرف التقني | `/app/applet/src/components/workspace/WorkspaceIntegrationView.tsx:383` |
| 32 | `navigation.labels.txt_116753` | `navigation` | جداول الإسقاط الستة في Google Sheets (Projection Tabs) | `/app/applet/src/components/workspace/WorkspaceIntegrationView.tsx:381` |
| 33 | `navigation.labels.txt_257f0d` | `navigation` | المجلد الجذري للمشروع | `/app/applet/src/components/workspace/WorkspaceIntegrationView.tsx:366` |
| 34 | `navigation.labels.txt_684973` | `navigation` | غير مسجل بعد | `/app/applet/src/components/workspace/WorkspaceIntegrationView.tsx:364` |
| 35 | `navigation.labels.txt_454be9` | `navigation` | Google Drive Folder ID (المسجل) | `/app/applet/src/components/workspace/WorkspaceIntegrationView.tsx:347` |
| 36 | `navigation.labels.txt_2c9a36` | `navigation` | مفتاح الربط المباشر من Project Registry | `/app/applet/src/components/workspace/WorkspaceIntegrationView.tsx:343` |
| 37 | `navigation.labels.txt_132f08` | `navigation` | غير مسجل بعد (اضغط تهيئة المشروع) | `/app/applet/src/components/workspace/WorkspaceIntegrationView.tsx:341` |
| 38 | `navigation.labels.txt_48ae1b` | `navigation` | Google Spreadsheet ID (المسجل) | `/app/applet/src/components/workspace/WorkspaceIntegrationView.tsx:326` |
| 39 | `navigation.labels.txt_2a462a` | `navigation` | تحديد معرفات Google Drive و Google Sheets المرتبطة بكل مشروع في Firestore | `/app/applet/src/components/workspace/WorkspaceIntegrationView.tsx:285` |
| 40 | `navigation.labels.projects` | `navigation` | سجل المشاريع (Project Registry) | `/app/applet/src/components/workspace/WorkspaceIntegrationView.tsx:284` |
| 41 | `navigation.labels.txt_202ca4` | `navigation` | المفتاح التقني للعمليات: tripId | `/app/applet/src/components/workspace/WorkspaceIntegrationView.tsx:238` |
| 42 | `navigation.labels.txt_12e46c` | `navigation` | Upsert وليس Blind Append | `/app/applet/src/components/workspace/WorkspaceIntegrationView.tsx:237` |
| 43 | `navigation.labels.txt_6b7707` | `navigation` | إسقاط متزامن للعرض والمراجعة | `/app/applet/src/components/workspace/WorkspaceIntegrationView.tsx:230` |
| 44 | `navigation.labels.txt_5c0d92` | `navigation` | Google Sheets هو Projection | `/app/applet/src/components/workspace/WorkspaceIntegrationView.tsx:229` |
| 45 | `navigation.labels.pricing` | `navigation` | سجلات العمليات والتسعير محصنة | `/app/applet/src/components/workspace/WorkspaceIntegrationView.tsx:222` |
| 46 | `navigation.labels.txt_55b425` | `navigation` | Firestore هو Source of Truth | `/app/applet/src/components/workspace/WorkspaceIntegrationView.tsx:221` |
| 47 | `navigation.labels.txt_22bd57` | `navigation` | مزامنة الإسقاط (Upsert Sync) | `/app/applet/src/components/workspace/WorkspaceIntegrationView.tsx:211` |
| 48 | `navigation.labels.txt_681fb6` | `navigation` | ربط تصاريح Google Workspace | `/app/applet/src/components/workspace/WorkspaceIntegrationView.tsx:200` |
| 49 | `navigation.labels.project_3` | `navigation` | المخزن في سجل المشروع (Project Registry). | `/app/applet/src/components/workspace/WorkspaceIntegrationView.tsx:189` |
| 50 | `navigation.labels.txt_1f48b9` | `navigation` | واستخدام | `/app/applet/src/components/workspace/WorkspaceIntegrationView.tsx:189` |
| 51 | `navigation.labels.txt_6f6242` | `navigation` | ،
              مع منع استخدام | `/app/applet/src/components/workspace/WorkspaceIntegrationView.tsx:188` |
| 52 | `navigation.labels.txt_409d13` | `navigation` | Google Sheets كإسقاط تشغيلي (Projection) | `/app/applet/src/components/workspace/WorkspaceIntegrationView.tsx:188` |
| 53 | `navigation.labels.txt_000648` | `navigation` | و | `/app/applet/src/components/workspace/WorkspaceIntegrationView.tsx:187` |
| 54 | `navigation.labels.txt_706091` | `navigation` | Firestore المصدر الوحيد للحقيقة (Source of Truth) | `/app/applet/src/components/workspace/WorkspaceIntegrationView.tsx:187` |
| 55 | `navigation.labels.txt_269608` | `navigation` | تطبيق مبدأ | `/app/applet/src/components/workspace/WorkspaceIntegrationView.tsx:187` |
| 56 | `navigation.labels.txt_19c7ca` | `navigation` | تكامل Google Sheets و Google Drive من جانب الخادم | `/app/applet/src/components/workspace/WorkspaceIntegrationView.tsx:184` |
| 57 | `navigation.labels.txt_58e08d` | `navigation` | معمارية الخادم المتكاملة • Google Workspace Server-Side Integration | `/app/applet/src/components/workspace/WorkspaceIntegrationView.tsx:181` |
| 58 | `authentication.labels.txt_413ffd` | `authentication` | تسجيل الدخول (Google) | `/app/applet/src/components/auth/AuthButton.tsx:92` |
| 59 | `authentication.labels.txt_b1a849` | `authentication` | تسجيل الخروج | `/app/applet/src/components/auth/AuthButton.tsx:61` |
| 60 | `authentication.labels.txt_3548e6` | `authentication` | متصل بـ Firestore | `/app/applet/src/components/auth/AuthButton.tsx:54` |
| 61 | `authentication.labels.txt_49cb21` | `authentication` | جاري تهيئة التحقق... | `/app/applet/src/components/auth/AuthButton.tsx:12` |
| 62 | `dashboard.labels.projects_5` | `dashboard` | نتائج فحص أمان المشاريع وصحة مؤشرات العمليات (Compliance Suite) | `/app/applet/src/components/dashboard/OperationsDashboardView.tsx:1187` |
| 63 | `dashboard.labels.txt_5049eb` | `dashboard` | 0.00 ر.س | `/app/applet/src/components/dashboard/OperationsDashboardView.tsx:1163` |
| 64 | `dashboard.labels.txt_11cccb` | `dashboard` | بانتظار الوصول | `/app/applet/src/components/dashboard/OperationsDashboardView.tsx:1142` |
| 65 | `dashboard.labels.search` | `dashboard` | لا توجد حركات مسجلة تطابق معايير الفلترة أو البحث الحالية. | `/app/applet/src/components/dashboard/OperationsDashboardView.tsx:1088` |
| 66 | `dashboard.labels.txt_7f63ed` | `dashboard` | التوقيت | `/app/applet/src/components/dashboard/OperationsDashboardView.tsx:1081` |
| 67 | `dashboard.labels.txt_12bb4c` | `dashboard` | المستحق التعاقدي | `/app/applet/src/components/dashboard/OperationsDashboardView.tsx:1080` |
| 68 | `dashboard.labels.weighbridge` | `dashboard` | فارق الميزان | `/app/applet/src/components/dashboard/OperationsDashboardView.tsx:1079` |
| 69 | `dashboard.labels.downloadLocation` | `dashboard` | أوزان التحميل / الموقع | `/app/applet/src/components/dashboard/OperationsDashboardView.tsx:1078` |
| 70 | `dashboard.labels.projectMaterial` | `dashboard` | المشروع والمادة | `/app/applet/src/components/dashboard/OperationsDashboardView.tsx:1075` |
| 71 | `dashboard.labels.truckDriver` | `dashboard` | الشاحنة والسائق | `/app/applet/src/components/dashboard/OperationsDashboardView.tsx:1074` |
| 72 | `dashboard.labels.txt_8d4f12` | `dashboard` | فلتر الودجت المخصص | `/app/applet/src/components/dashboard/OperationsDashboardView.tsx:1050` |
| 73 | `dashboard.labels.txt_3318a9` | `dashboard` | كافة الحالات | `/app/applet/src/components/dashboard/OperationsDashboardView.tsx:1039` |
| 74 | `dashboard.labels.continue_2` | `dashboard` | متابعة فورية ومباشرة للشاحنات عبر موازين التحميل، الترحيل الميداني، والتفريغ في المواقع | `/app/applet/src/components/dashboard/OperationsDashboardView.tsx:1016` |
| 75 | `dashboard.labels.txt_2530ed` | `dashboard` | لوحة البوابات والموازين الحية (Live Terminal Board) | `/app/applet/src/components/dashboard/OperationsDashboardView.tsx:1010` |
| 76 | `dashboard.labels.txt_356679` | `dashboard` | إجمالي مستحق النموذج: | `/app/applet/src/components/dashboard/OperationsDashboardView.tsx:993` |
| 77 | `dashboard.labels.txt_7ef999` | `dashboard` | الأطنان | `/app/applet/src/components/dashboard/OperationsDashboardView.tsx:982` |
| 78 | `dashboard.labels.txt_550c13` | `dashboard` | فلتر الودجت | `/app/applet/src/components/dashboard/OperationsDashboardView.tsx:940` |
| 79 | `dashboard.labels.pricing_3` | `dashboard` | توزيع نماذج التسعير التعاقدية (Pricing Distribution: PER_TRIP vs PER_TON) | `/app/applet/src/components/dashboard/OperationsDashboardView.tsx:931` |
| 80 | `dashboard.labels.txt_5fc7c1` | `dashboard` | لا توجد شحنات مواد مطابقة للفلاتر. | `/app/applet/src/components/dashboard/OperationsDashboardView.tsx:888` |
| 81 | `dashboard.labels.txt_2f010a` | `dashboard` | فلتر | `/app/applet/src/components/dashboard/OperationsDashboardView.tsx:864` |
| 82 | `dashboard.labels.materials_2` | `dashboard` | توزيع المواد والخامات (Material Distribution) | `/app/applet/src/components/dashboard/OperationsDashboardView.tsx:855` |
| 83 | `dashboard.labels.txt_15b1d1` | `dashboard` | لا توجد بيانات ناقلين مطابقة لمعايير الفلترة الحالية. | `/app/applet/src/components/dashboard/OperationsDashboardView.tsx:814` |
| 84 | `dashboard.labels.txt_3b0cf8` | `dashboard` | المستحقات (ر.س) | `/app/applet/src/components/dashboard/OperationsDashboardView.tsx:807` |
| 85 | `dashboard.labels.download_3` | `dashboard` | أطنان التحميل | `/app/applet/src/components/dashboard/OperationsDashboardView.tsx:806` |
| 86 | `dashboard.labels.txt_2f010a` | `dashboard` | فلتر | `/app/applet/src/components/dashboard/OperationsDashboardView.tsx:778` |
| 87 | `dashboard.labels.txt_45844d` | `dashboard` | لوحة أداء ومطابقة الناقلين (Carrier Performance) | `/app/applet/src/components/dashboard/OperationsDashboardView.tsx:769` |
| 88 | `dashboard.labels.txt_b1749a` | `dashboard` | تسويات الأطنان (Ton-based Settlement) | `/app/applet/src/components/dashboard/OperationsDashboardView.tsx:740` |
| 89 | `dashboard.labels.txt_42b243` | `dashboard` | تسويات المقطوعية بالرد (Trip-based Settlement) | `/app/applet/src/components/dashboard/OperationsDashboardView.tsx:720` |
| 90 | `dashboard.labels.pricing_2` | `dashboard` | محسوبة بدقة من لقطات التسعير التعاقدية المثبتة | `/app/applet/src/components/dashboard/OperationsDashboardView.tsx:713` |
| 91 | `dashboard.labels.txt_588cfc` | `dashboard` | إجمالي التسويات المعتمدة (Total Settlement) | `/app/applet/src/components/dashboard/OperationsDashboardView.tsx:705` |
| 92 | `dashboard.labels.txt_4ab700` | `dashboard` | فلتر البطاقة | `/app/applet/src/components/dashboard/OperationsDashboardView.tsx:681` |
| 93 | `dashboard.labels.txt_18193c` | `dashboard` | بطاقات التسويات والمستحقات المالية (Financial Settlement - Snapshot Invariance) | `/app/applet/src/components/dashboard/OperationsDashboardView.tsx:672` |
| 94 | `dashboard.labels.txt_1b110d` | `dashboard` | صافي فارق الموازين (Total Variance) | `/app/applet/src/components/dashboard/OperationsDashboardView.tsx:637` |
| 95 | `dashboard.labels.txt_18b638` | `dashboard` | الصافي المعتمد في نقطة التفريغ | `/app/applet/src/components/dashboard/OperationsDashboardView.tsx:626` |
| 96 | `dashboard.labels.location_2` | `dashboard` | إجمالي أوزان الاستلام بالموقع (Total Received Tons) | `/app/applet/src/components/dashboard/OperationsDashboardView.tsx:618` |
| 97 | `dashboard.labels.txt_7caf8b` | `dashboard` | محسوبة عند ميزان الانطلاق (القائم - الفارغ) | `/app/applet/src/components/dashboard/OperationsDashboardView.tsx:612` |
| 98 | `dashboard.labels.download_2` | `dashboard` | إجمالي أوزان التحميل (Total Loaded Tons) | `/app/applet/src/components/dashboard/OperationsDashboardView.tsx:604` |
| 99 | `dashboard.labels.txt_4ab700` | `dashboard` | فلتر البطاقة | `/app/applet/src/components/dashboard/OperationsDashboardView.tsx:580` |
| 100 | `dashboard.labels.txt_125b36` | `dashboard` | بطاقات الأوزان وتفاوت الموازين (Tonnage & Weighbridge Variance) | `/app/applet/src/components/dashboard/OperationsDashboardView.tsx:571` |
| 101 | `dashboard.labels.txt_5ac4f2` | `dashboard` | تجاوز فارق أو أعطال مسار | `/app/applet/src/components/dashboard/OperationsDashboardView.tsx:559` |
| 102 | `dashboard.labels.txt_1137e3` | `dashboard` | استثناءات (Exceptions) | `/app/applet/src/components/dashboard/OperationsDashboardView.tsx:549` |
| 103 | `dashboard.labels.location` | `dashboard` | شحنات مرفوضة بالموقع | `/app/applet/src/components/dashboard/OperationsDashboardView.tsx:542` |
| 104 | `dashboard.labels.txt_2ca1cc` | `dashboard` | مرتجعة (Returned) | `/app/applet/src/components/dashboard/OperationsDashboardView.tsx:530` |
| 105 | `dashboard.labels.download` | `dashboard` | انطلقت من ميزان التحميل | `/app/applet/src/components/dashboard/OperationsDashboardView.tsx:523` |
| 106 | `dashboard.labels.txt_77aa19` | `dashboard` | على الطريق | `/app/applet/src/components/dashboard/OperationsDashboardView.tsx:520` |
| 107 | `dashboard.labels.txt_44dad6` | `dashboard` | قيد النقل (In Transit) | `/app/applet/src/components/dashboard/OperationsDashboardView.tsx:513` |
| 108 | `dashboard.labels.txt_7a5a12` | `dashboard` | تم تفريغها ومطابقة أوزانها | `/app/applet/src/components/dashboard/OperationsDashboardView.tsx:506` |
| 109 | `dashboard.status.txt_4f5139` | `dashboard` | مكتملة (Completed) | `/app/applet/src/components/dashboard/OperationsDashboardView.tsx:494` |
| 110 | `dashboard.labels.txt_196321` | `dashboard` | الخاضعة للتحميل والترحيل | `/app/applet/src/components/dashboard/OperationsDashboardView.tsx:487` |
| 111 | `dashboard.labels.trips_2` | `dashboard` | إجمالي الرحلات (Total Trips) | `/app/applet/src/components/dashboard/OperationsDashboardView.tsx:479` |
| 112 | `dashboard.labels.txt_4ab700` | `dashboard` | فلتر البطاقة | `/app/applet/src/components/dashboard/OperationsDashboardView.tsx:455` |
| 113 | `dashboard.labels.trips` | `dashboard` | بطاقات حجم وحالات الرحلات (Trips Volume & Operational Status) | `/app/applet/src/components/dashboard/OperationsDashboardView.tsx:446` |
| 114 | `dashboard.labels.txt_176fe6` | `dashboard` | مقطوعية بالرد (PER_TRIP) | `/app/applet/src/components/dashboard/OperationsDashboardView.tsx:433` |
| 115 | `dashboard.labels.txt_6f8552` | `dashboard` | الكل (PER_TRIP + PER_TON) | `/app/applet/src/components/dashboard/OperationsDashboardView.tsx:432` |
| 116 | `dashboard.labels.projects_4` | `dashboard` | كافة المشاريع المصرحة (All Projects) | `/app/applet/src/components/dashboard/OperationsDashboardView.tsx:357` |
| 117 | `dashboard.labels.project` | `dashboard` | المشروع المصرح به | `/app/applet/src/components/dashboard/OperationsDashboardView.tsx:349` |
| 118 | `dashboard.labels.txt_38efc7` | `dashboard` | إعادة تعيين الكل | `/app/applet/src/components/dashboard/OperationsDashboardView.tsx:340` |
| 119 | `dashboard.labels.txt_36b0b2` | `dashboard` | - تُطبَّق تلقائياً على كافة الودجات ما لم يتم تخصيص ودجت محدد | `/app/applet/src/components/dashboard/OperationsDashboardView.tsx:321` |
| 120 | `dashboard.labels.txt_52e654` | `dashboard` | الفلاتر العامة للوحة القيادة (Global Dashboard Filters) | `/app/applet/src/components/dashboard/OperationsDashboardView.tsx:319` |
| 121 | `dashboard.labels.txt_11a6ad` | `dashboard` | مستوى صلاحيات المدير العام للمنظومة | `/app/applet/src/components/dashboard/OperationsDashboardView.tsx:308` |
| 122 | `dashboard.labels.trip` | `dashboard` | يتم حجب أي رحلة خارج النطاق المصرح به آلياً | `/app/applet/src/components/dashboard/OperationsDashboardView.tsx:305` |
| 123 | `dashboard.labels.projects_3` | `dashboard` | كافة المشاريع (وصول مركزي غير مقيد) | `/app/applet/src/components/dashboard/OperationsDashboardView.tsx:288` |
| 124 | `dashboard.labels.projects_2` | `dashboard` | المشاريع المصرح بها لهذا الحساب: | `/app/applet/src/components/dashboard/OperationsDashboardView.tsx:285` |
| 125 | `dashboard.labels.projects` | `dashboard` | تشغيل فحص الامتثال الآلي لعزل المشاريع وصحة العمليات | `/app/applet/src/components/dashboard/OperationsDashboardView.tsx:273` |
| 126 | `dashboard.labels.userProjects` | `dashboard` | صلاحية المستخدم والمشاريع: | `/app/applet/src/components/dashboard/OperationsDashboardView.tsx:247` |
| 127 | `dashboard.labels.continue` | `dashboard` | رصد ومتابعة مؤشرات الحركة، الأوزان، التسويات التعاقدية، ولوحة البوابات المباشرة مع عزل أمني صارم للمشاريع. | `/app/applet/src/components/dashboard/OperationsDashboardView.tsx:236` |
| 128 | `dashboard.labels.txt_6c69a9` | `dashboard` | مباشر (Live) | `/app/applet/src/components/dashboard/OperationsDashboardView.tsx:232` |
| 129 | `dashboard.labels.txt_7d6fcd` | `dashboard` | لوحة العمليات والتحكم اللوجستي (Operations Dashboard) | `/app/applet/src/components/dashboard/OperationsDashboardView.tsx:230` |
| 130 | `dashboard.labels.txt_176fe6` | `dashboard` | مقطوعية بالرد (PER_TRIP) | `/app/applet/src/components/dashboard/WidgetFilterBar.tsx:150` |
| 131 | `dashboard.labels.txt_6f8552` | `dashboard` | الكل (PER_TRIP + PER_TON) | `/app/applet/src/components/dashboard/WidgetFilterBar.tsx:149` |
| 132 | `dashboard.labels.txt_553cd5` | `dashboard` | كافة الناقلين | `/app/applet/src/components/dashboard/WidgetFilterBar.tsx:109` |
| 133 | `dashboard.labels.projects_7` | `dashboard` | كافة المشاريع المصرحة | `/app/applet/src/components/dashboard/WidgetFilterBar.tsx:74` |
| 134 | `dashboard.labels.txt_3563c6` | `dashboard` | إعادة المزامنة مع الفلاتر العامة | `/app/applet/src/components/dashboard/WidgetFilterBar.tsx:56` |
| 135 | `dashboard.labels.txt_5b4092` | `dashboard` | مخصصة | `/app/applet/src/components/dashboard/WidgetFilterBar.tsx:45` |
| 136 | `dashboard.labels.txt_19e345` | `dashboard` | فلاتر الودجت المخصصة (Widget Filter Controls) | `/app/applet/src/components/dashboard/WidgetFilterBar.tsx:42` |
| 137 | `projects.labels.txt_38ae35` | `projects` | إعادة تعيين المعالج | `/app/applet/src/components/wizard/ProjectSetupWizard.tsx:306` |
| 138 | `projects.labels.txt_4b1fb1` | `projects` | تجربة فحص التضارب الزمني | `/app/applet/src/components/wizard/ProjectSetupWizard.tsx:299` |
| 139 | `projects.labels.add` | `projects` | إضافة قاعدة تسعير مكررة لاختبار كشف التضارب الزمني | `/app/applet/src/components/wizard/ProjectSetupWizard.tsx:296` |
| 140 | `projects.labels.txt_2d2a83` | `projects` | استعادة نموذج نيوم التجريبي | `/app/applet/src/components/wizard/ProjectSetupWizard.tsx:289` |
| 141 | `projects.labels.pricing_2` | `projects` | معمارية متعددة الخطوات تضمن تأسيس المشاريع، المواد، الناقلين، وقواعد التسعير المنفصلة مع منع التداخل الزمني، وتهيئة Google Workspace آلياً. | `/app/applet/src/components/wizard/ProjectSetupWizard.tsx:274` |
| 142 | `projects.labels.projects` | `projects` | معالج تأسيس وتهيئة المشاريع اللوجستية (Project Setup Wizard) | `/app/applet/src/components/wizard/ProjectSetupWizard.tsx:271` |
| 143 | `projects.labels.txt_ee3f70` | `projects` | نصف قطر السياج الجغرافي للموقع (GeoFence بالمتر) | `/app/applet/src/components/wizard/Step1ProjectInfo.tsx:292` |
| 144 | `projects.labels.location` | `projects` | العنوان / الموقع الجغرافي للمشروع | `/app/applet/src/components/wizard/Step1ProjectInfo.tsx:280` |
| 145 | `projects.labels.txt_126e48` | `projects` | السماح بالتسجيل الذاتي للسائقين | `/app/applet/src/components/wizard/Step1ProjectInfo.tsx:271` |
| 146 | `projects.labels.trucks` | `projects` | التفاوت المسموح في أوزان الشاحنات (كجم) | `/app/applet/src/components/wizard/Step1ProjectInfo.tsx:239` |
| 147 | `projects.labels.txt_6757e5` | `projects` | نسبة ضريبة القيمة المضافة % (VAT) | `/app/applet/src/components/wizard/Step1ProjectInfo.tsx:213` |
| 148 | `projects.labels.txt_36fea4` | `projects` | العملة التشغيلية (currency) | `/app/applet/src/components/wizard/Step1ProjectInfo.tsx:201` |
| 149 | `projects.labels.settings` | `projects` | الإعدادات الافتراضية والامتثال النظامي (Default Settings & Compliance) | `/app/applet/src/components/wizard/Step1ProjectInfo.tsx:195` |
| 150 | `projects.labels.project_8` | `projects` | وصف المشروع ونطاق العمليات اللوجستية (description) | `/app/applet/src/components/wizard/Step1ProjectInfo.tsx:179` |
| 151 | `projects.labels.project_7` | `projects` | حالة المشروع التشغيلية (status) | `/app/applet/src/components/wizard/Step1ProjectInfo.tsx:117` |
| 152 | `projects.labels.txt_17e9e8` | `projects` | الجهة المالكة / العميل الرئيسي (Client Name) | `/app/applet/src/components/wizard/Step1ProjectInfo.tsx:102` |
| 153 | `projects.labels.txt_74b183` | `projects` | معرف وحيد للمشروع في Firestore يمنع تعديله بعد الإنشاء. | `/app/applet/src/components/wizard/Step1ProjectInfo.tsx:79` |
| 154 | `projects.labels.project_6` | `projects` | رمز المشروع التعريفي (projectCode) | `/app/applet/src/components/wizard/Step1ProjectInfo.tsx:68` |
| 155 | `projects.labels.notesProject` | `projects` | يرجى تصحيح الملاحظات التالية في بيانات المشروع: | `/app/applet/src/components/wizard/Step1ProjectInfo.tsx:54` |
| 156 | `projects.labels.project_4` | `projects` | الخطوة 1: بيانات المشروع الأساسية (Project Information) | `/app/applet/src/components/wizard/Step1ProjectInfo.tsx:39` |
| 157 | `projects.labels.txt_42e94e` | `projects` | مراقب عام (VIEWER) | `/app/applet/src/components/wizard/Step5ProjectAccess.tsx:280` |
| 158 | `projects.labels.txt_606611` | `projects` | مدقق مالي (FINANCE_AUDITOR) | `/app/applet/src/components/wizard/Step5ProjectAccess.tsx:279` |
| 159 | `projects.labels.txt_4a32a9` | `projects` | مأمور حركة وميزان (DISPATCHER) | `/app/applet/src/components/wizard/Step5ProjectAccess.tsx:278` |
| 160 | `projects.labels.project_11` | `projects` | مدير المشروع (PROJECT_ADMIN) | `/app/applet/src/components/wizard/Step5ProjectAccess.tsx:277` |
| 161 | `projects.labels.userProject` | `projects` | حدد مربع الاختيار لضم المستخدم إلى هذا المشروع وتحديد دوره | `/app/applet/src/components/wizard/Step5ProjectAccess.tsx:220` |
| 162 | `projects.labels.txt_6f43c8` | `projects` | قائمة المستخدمين والتحكم في الوصول | `/app/applet/src/components/wizard/Step5ProjectAccess.tsx:218` |
| 163 | `projects.labels.add_3` | `projects` | إضافة وتعيين الصلاحية | `/app/applet/src/components/wizard/Step5ProjectAccess.tsx:209` |
| 164 | `projects.labels.txt_42e94e` | `projects` | مراقب عام (VIEWER) | `/app/applet/src/components/wizard/Step5ProjectAccess.tsx:190` |
| 165 | `projects.labels.txt_606611` | `projects` | مدقق مالي (FINANCE_AUDITOR) | `/app/applet/src/components/wizard/Step5ProjectAccess.tsx:189` |
| 166 | `projects.labels.txt_4a32a9` | `projects` | مأمور حركة وميزان (DISPATCHER) | `/app/applet/src/components/wizard/Step5ProjectAccess.tsx:188` |
| 167 | `projects.labels.project_11` | `projects` | مدير المشروع (PROJECT_ADMIN) | `/app/applet/src/components/wizard/Step5ProjectAccess.tsx:187` |
| 168 | `projects.labels.txt_78a490` | `projects` | الدور التشغيلي (Role) | `/app/applet/src/components/wizard/Step5ProjectAccess.tsx:180` |
| 169 | `projects.labels.project_10` | `projects` | دعوة مستخدم جديد وتعيين صلاحياته في المشروع | `/app/applet/src/components/wizard/Step5ProjectAccess.tsx:133` |
| 170 | `projects.labels.txt_50bf83` | `projects` | تنبيهات الصلاحيات: | `/app/applet/src/components/wizard/Step5ProjectAccess.tsx:102` |
| 171 | `projects.labels.add_2` | `projects` | إضافة مستخدم جديد | `/app/applet/src/components/wizard/Step5ProjectAccess.tsx:96` |
| 172 | `projects.labels.txt_1f839a` | `projects` | حدد المستخدمين المصرح لهم بالدخول إلى المشروع، مع تعيين الأدوار التشغيلية (مدير، مأمور حركة، مدقق مالي). | `/app/applet/src/components/wizard/Step5ProjectAccess.tsx:87` |
| 173 | `projects.labels.txt_484b31` | `projects` | الخطوة 5: إدارة صلاحيات المستخدمين والوصول للمشروع (Project Access) | `/app/applet/src/components/wizard/Step5ProjectAccess.tsx:84` |
| 174 | `carriers.labels.txt_5a7969` | `carriers` | أضف أول ناقل الآن | `/app/applet/src/components/wizard/Step3Carriers.tsx:453` |
| 175 | `carriers.labels.project_2` | `carriers` | لا يوجد ناقلون مسجلون في المشروع حتى الآن. | `/app/applet/src/components/wizard/Step3Carriers.tsx:446` |
| 176 | `shared.actions.delete` | `carriers` | حذف | `/app/applet/src/components/wizard/Step3Carriers.tsx:436` |
| 177 | `shared.actions.edit` | `carriers` | تعديل | `/app/applet/src/components/wizard/Step3Carriers.tsx:427` |
| 178 | `carriers.status.status` | `carriers` | تغيير الحالة (نشط / معطّل) | `/app/applet/src/components/wizard/Step3Carriers.tsx:374` |
| 179 | `carriers.labels.txt_6354e4` | `carriers` | ترخيص هيئة النقل العامة (TGA) | `/app/applet/src/components/wizard/Step3Carriers.tsx:267` |
| 180 | `carriers.labels.trucksPricing` | `carriers` | معرف وحيد للربط مع الشاحنات وقواعد التسعير | `/app/applet/src/components/wizard/Step3Carriers.tsx:219` |
| 181 | `carriers.labels.carrier_2` | `carriers` | معرف الناقل (carrierId) | `/app/applet/src/components/wizard/Step3Carriers.tsx:209` |
| 182 | `carriers.labels.txt_4ef914` | `carriers` | تنبيهات بيانات الناقلين: | `/app/applet/src/components/wizard/Step3Carriers.tsx:173` |
| 183 | `carriers.labels.materialsProject` | `carriers` | حدد الناقلين المصرح لهم بنقل وتوريد المواد في هذا المشروع (مثل Carrier A، Carrier B، Carrier C). | `/app/applet/src/components/wizard/Step3Carriers.tsx:152` |
| 184 | `carriers.labels.txt_5ee946` | `carriers` | الخطوة 3: شركات النقل والناقلين المعتمدين (Carriers) | `/app/applet/src/components/wizard/Step3Carriers.tsx:149` |
| 185 | `shared.actions.delete` | `carriers` | حذف | `/app/applet/src/components/wizard/Step4PricingRules.tsx:639` |
| 186 | `shared.actions.edit` | `carriers` | تعديل | `/app/applet/src/components/wizard/Step4PricingRules.tsx:630` |
| 187 | `shared.actions.edit` | `carriers` | تعديل | `/app/applet/src/components/wizard/Step7Review.tsx:425` |
| 188 | `shared.actions.edit` | `carriers` | تعديل | `/app/applet/src/components/wizard/Step7Review.tsx:393` |
| 189 | `shared.actions.edit` | `carriers` | تعديل | `/app/applet/src/components/wizard/Step7Review.tsx:363` |
| 190 | `shared.actions.edit` | `carriers` | تعديل | `/app/applet/src/components/wizard/Step7Review.tsx:333` |
| 191 | `shared.actions.edit` | `carriers` | تعديل | `/app/applet/src/components/wizard/Step7Review.tsx:297` |
| 192 | `shared.actions.edit` | `carriers` | تعديل | `/app/applet/src/components/wizard/Step7Review.tsx:262` |
| 193 | `entityResolution.labels.txt_116ee2` | `entityResolution` | تطبيق المعالجة واعتماد السجل | `/app/applet/src/components/dataQuality/DataQualityView.tsx:1028` |
| 194 | `entityResolution.labels.carrier_5` | `entityResolution` | الناقل غير مسجل في قائمة المقاولين المعتمدين للمشروع. هل ترغب في ترخيص هذا الناقل وإضافته للمشروع رسمياً؟ | `/app/applet/src/components/dataQuality/DataQualityView.tsx:999` |
| 195 | `entityResolution.labels.edit` | `entityResolution` | النظام يمنع التعديل التلقائي للعلاقات أو فرض التبعية بدون موافقة صريحة من المشرف اللوجستي. | `/app/applet/src/components/dataQuality/DataQualityView.tsx:973` |
| 196 | `entityResolution.labels.txt_2e1ff5` | `entityResolution` | معالجة التعارض التنظيمي (Conflict Resolution) | `/app/applet/src/components/dataQuality/DataQualityView.tsx:958` |
| 197 | `entityResolution.labels.txt_b85bc9` | `entityResolution` | استبعاد السجل (Block) | `/app/applet/src/components/dataQuality/DataQualityView.tsx:937` |
| 198 | `entityResolution.labels.txt_821666` | `entityResolution` | اعتماد المرشح المقترح | `/app/applet/src/components/dataQuality/DataQualityView.tsx:927` |
| 199 | `entityResolution.labels.txt_5f7536` | `entityResolution` | معالجة وتصحيح التعارض | `/app/applet/src/components/dataQuality/DataQualityView.tsx:916` |
| 200 | `entityResolution.labels.txt_795a77` | `entityResolution` | ✓ جميع الحقول مطابقة ومجازة نظامياً. | `/app/applet/src/components/dataQuality/DataQualityView.tsx:897` |
| 201 | `entityResolution.labels.confirm` | `entityResolution` | ℹ️ يوجد مرشح تقريبي (Possible Match)، يرجى التأكيد قبل الدمج. | `/app/applet/src/components/dataQuality/DataQualityView.tsx:893` |
| 202 | `entityResolution.labels.txt_1ccbcc` | `entityResolution` | ⚠️ يتطلب تدخلاً صريحاً لعدم التطابق الكافي. | `/app/applet/src/components/dataQuality/DataQualityView.tsx:889` |
| 203 | `entityResolution.labels.txt_5604bd` | `entityResolution` | ⛔ لا يمكن الإدخال حتى تتم معالجة التعارض يدوياً. | `/app/applet/src/components/dataQuality/DataQualityView.tsx:885` |
| 204 | `entityResolution.labels.txt_63f80a` | `entityResolution` | ملاحظة المعالجة: | `/app/applet/src/components/dataQuality/DataQualityView.tsx:874` |
| 205 | `entityResolution.labels.txt_49d442` | `entityResolution` | تنبيهات وملاحظات التحقق: | `/app/applet/src/components/dataQuality/DataQualityView.tsx:859` |
| 206 | `entityResolution.labels.txt_5eedc6` | `entityResolution` | قيد المراجعة البشرية | `/app/applet/src/components/dataQuality/DataQualityView.tsx:775` |
| 207 | `entityResolution.labels.txt_189ba3` | `entityResolution` | محظور / مستبعد | `/app/applet/src/components/dataQuality/DataQualityView.tsx:770` |
| 208 | `entityResolution.labels.txt_2fc03e` | `entityResolution` | تمت المعالجة اليدوية | `/app/applet/src/components/dataQuality/DataQualityView.tsx:765` |
| 209 | `entityResolution.labels.txt_6f59c5` | `entityResolution` | سجلات الشحن والتوريد المحملة من الإكسل تخضع للفحص المسبق وتُصنف حسب المخاطر لمنع تلوث قاعدة البيانات. | `/app/applet/src/components/dataQuality/DataQualityView.tsx:674` |
| 210 | `entityResolution.labels.import` | `entityResolution` | طابور تدقيق ملفات الاستيراد والمراجعة البشرية (Human Review Queue) | `/app/applet/src/components/dataQuality/DataQualityView.tsx:671` |
| 211 | `entityResolution.labels.txt_257cc7` | `entityResolution` | 8 مراحل منفذة | `/app/applet/src/components/dataQuality/DataQualityView.tsx:626` |
| 212 | `entityResolution.labels.txt_42e7b2` | `entityResolution` | تتبع تنفيذ خط الأنابيب (Pipeline Execution Trace) | `/app/applet/src/components/dataQuality/DataQualityView.tsx:624` |
| 213 | `entityResolution.labels.txt_14919c` | `entityResolution` | الأسباب والتعليقات النظامية: | `/app/applet/src/components/dataQuality/DataQualityView.tsx:590` |
| 214 | `entityResolution.labels.txt_2c7a04` | `entityResolution` | المرشح في قاعدة البيانات (Candidate) | `/app/applet/src/components/dataQuality/DataQualityView.tsx:583` |
| 215 | `entityResolution.labels.txt_3a8654` | `entityResolution` | القيمة المدخلة الأصلية (Source) | `/app/applet/src/components/dataQuality/DataQualityView.tsx:579` |
| 216 | `entityResolution.labels.details` | `entityResolution` | تفاصيل المطابقة وتفسير الخوارزمية | `/app/applet/src/components/dataQuality/DataQualityView.tsx:573` |
| 217 | `entityResolution.labels.txt_2e6c0e` | `entityResolution` | درجة التطابق (Match Score): | `/app/applet/src/components/dataQuality/DataQualityView.tsx:560` |
| 218 | `entityResolution.labels.txt_4f6e90` | `entityResolution` | نتيجة الفحص الفوري: | `/app/applet/src/components/dataQuality/DataQualityView.tsx:554` |
| 219 | `entityResolution.labels.carrier_3` | `entityResolution` | الناقل المزعوم في الملف (Context Carrier) | `/app/applet/src/components/dataQuality/DataQualityView.tsx:534` |
| 220 | `entityResolution.labels.txt_4be3c3` | `entityResolution` | القيمة الأولية المدخلة (Raw Value) | `/app/applet/src/components/dataQuality/DataQualityView.tsx:521` |
| 221 | `entityResolution.labels.txt_5e3712` | `entityResolution` | مادة (Material) | `/app/applet/src/components/dataQuality/DataQualityView.tsx:515` |
| 222 | `entityResolution.labels.txt_50a968` | `entityResolution` | سائق (Driver) | `/app/applet/src/components/dataQuality/DataQualityView.tsx:514` |
| 223 | `entityResolution.labels.txt_788746` | `entityResolution` | شاحنة / لوحة (Truck) | `/app/applet/src/components/dataQuality/DataQualityView.tsx:513` |
| 224 | `entityResolution.labels.txt_24239d` | `entityResolution` | ناقل (Carrier) | `/app/applet/src/components/dataQuality/DataQualityView.tsx:512` |
| 225 | `entityResolution.labels.txt_5786fc` | `entityResolution` | نوع الكيان المراد مطابقته | `/app/applet/src/components/dataQuality/DataQualityView.tsx:505` |
| 226 | `entityResolution.labels.txt_4b1baa` | `entityResolution` | تطابق تام (Exact Match) | `/app/applet/src/components/dataQuality/DataQualityView.tsx:496` |
| 227 | `entityResolution.labels.driver_2` | `entityResolution` | تعارض السائق (DRIVER_CARRIER_CONFLICT) | `/app/applet/src/components/dataQuality/DataQualityView.tsx:490` |
| 228 | `entityResolution.labels.txt_5182e1` | `entityResolution` | ناقل غير مصرح (CARRIER_NOT_ALLOWED) | `/app/applet/src/components/dataQuality/DataQualityView.tsx:484` |
| 229 | `entityResolution.labels.txt_4d8e7a` | `entityResolution` | مادة غير مسموحة (MATERIAL_NOT_ALLOWED) | `/app/applet/src/components/dataQuality/DataQualityView.tsx:478` |
| 230 | `entityResolution.labels.truck` | `entityResolution` | تعارض الشاحنة (CARRIER_TRUCK_CONFLICT) | `/app/applet/src/components/dataQuality/DataQualityView.tsx:472` |
| 231 | `entityResolution.labels.txt_17f8ed` | `entityResolution` | الفازي vs الفزي (Possible Match) | `/app/applet/src/components/dataQuality/DataQualityView.tsx:466` |
| 232 | `entityResolution.labels.txt_3b4a4b` | `entityResolution` | سيناريوهات جاهزة: | `/app/applet/src/components/dataQuality/DataQualityView.tsx:461` |
| 233 | `entityResolution.labels.txt_c5e3f3` | `entityResolution` | قم بتجربة أي قيمة نصية أو اضغط على أحد السيناريوهات الجاهزة لاختبار سلوك المحرك وتطبيقه الدقيق للقواعد. | `/app/applet/src/components/dataQuality/DataQualityView.tsx:455` |
| 234 | `entityResolution.labels.txt_528963` | `entityResolution` | مختبر التحقق المباشر وسيناريوهات الاختبار (Interactive Quality Sandbox) | `/app/applet/src/components/dataQuality/DataQualityView.tsx:452` |
| 235 | `entityResolution.labels.txt_6608f0` | `entityResolution` | تسلسل حتمي يضمن معالجة كل قيمة مدخلة عبر 8 محطات تدقيق متتالية قبل أي كتابة في Firestore | `/app/applet/src/components/dataQuality/DataQualityView.tsx:406` |
| 236 | `entityResolution.labels.txt_446084` | `entityResolution` | خط الأنابيب المعماري الإلزامي (The 8-Stage Quality Pipeline) | `/app/applet/src/components/dataQuality/DataQualityView.tsx:403` |
| 237 | `entityResolution.labels.txt_36e41a` | `entityResolution` | يمكن اعتمادها | `/app/applet/src/components/dataQuality/DataQualityView.tsx:392` |
| 238 | `entityResolution.labels.txt_148e7c` | `entityResolution` | مطابقة وآمنة (LOW) | `/app/applet/src/components/dataQuality/DataQualityView.tsx:390` |
| 239 | `entityResolution.labels.txt_2a7413` | `entityResolution` | تتطلب تأكيداً يدوياً | `/app/applet/src/components/dataQuality/DataQualityView.tsx:387` |
| 240 | `entityResolution.labels.txt_33b784` | `entityResolution` | مخاطر متوسطة (MEDIUM) | `/app/applet/src/components/dataQuality/DataQualityView.tsx:385` |
| 241 | `entityResolution.labels.txt_540515` | `entityResolution` | لا تعتمد تلقائياً | `/app/applet/src/components/dataQuality/DataQualityView.tsx:382` |
| 242 | `entityResolution.labels.txt_273452` | `entityResolution` | مخاطر عالية (HIGH) | `/app/applet/src/components/dataQuality/DataQualityView.tsx:380` |
| 243 | `entityResolution.labels.txt_6d2ee9` | `entityResolution` | يمنع الإدخال نهائياً | `/app/applet/src/components/dataQuality/DataQualityView.tsx:377` |
| 244 | `entityResolution.labels.txt_5664da` | `entityResolution` | مخاطر حرجة (CRITICAL) | `/app/applet/src/components/dataQuality/DataQualityView.tsx:375` |
| 245 | `entityResolution.labels.txt_63e83a` | `entityResolution` | إجمالي السجلات المفحوصة | `/app/applet/src/components/dataQuality/DataQualityView.tsx:371` |
| 246 | `entityResolution.labels.txt_42f259` | `entityResolution` | مشروع نيوم - قطاع الشمال (PRJ-NEOM-001) | `/app/applet/src/components/dataQuality/DataQualityView.tsx:363` |
| 247 | `entityResolution.status.projectActive` | `entityResolution` | نطاق المشروع النشط | `/app/applet/src/components/dataQuality/DataQualityView.tsx:362` |
| 248 | `entityResolution.labels.importEdit` | `entityResolution` | يعمل قبل اعتماد أي ملف استيراد (Import) أو تعديل على البيانات المرجعية (Master Data). يمنع الدمج التلقائي الخاطئ (Auto-Merge) ويحظر التعارضات التنظيمية. | `/app/applet/src/components/dataQuality/DataQualityView.tsx:355` |
| 249 | `entityResolution.labels.txt_39b3f8` | `entityResolution` | بوابة رقابة إلزامية (Pre-Import Gate) | `/app/applet/src/components/dataQuality/DataQualityView.tsx:348` |
| 250 | `entityResolution.labels.txt_ba0af6` | `entityResolution` | محرك جودة البيانات المستقل (Data Quality Engine) | `/app/applet/src/components/dataQuality/DataQualityView.tsx:345` |
| 251 | `entityResolution.labels.txt_7e9185` | `entityResolution` | لا يوجد تطابق (NO_MATCH) | `/app/applet/src/components/dataQuality/DataQualityView.tsx:316` |
| 252 | `entityResolution.labels.txt_2acaf8` | `entityResolution` | تعارض علاقات (RELATIONSHIP) | `/app/applet/src/components/dataQuality/DataQualityView.tsx:314` |
| 253 | `entityResolution.labels.txt_53e136` | `entityResolution` | تطابق تقريبي (FUZZY) | `/app/applet/src/components/dataQuality/DataQualityView.tsx:312` |
| 254 | `entityResolution.labels.txt_313051` | `entityResolution` | منخفض (LOW) - اعتماد آمن | `/app/applet/src/components/dataQuality/DataQualityView.tsx:301` |
| 255 | `entityResolution.labels.txt_327fe2` | `entityResolution` | متوسط (MEDIUM) - يتطلب تأكيداً | `/app/applet/src/components/dataQuality/DataQualityView.tsx:294` |
| 256 | `entityResolution.labels.txt_1c98fc` | `entityResolution` | عالي (HIGH) - لا تعتمد تلقائياً | `/app/applet/src/components/dataQuality/DataQualityView.tsx:287` |
| 257 | `entityResolution.labels.txt_15728b` | `entityResolution` | حرج (CRITICAL) - يمنع الإدخال | `/app/applet/src/components/dataQuality/DataQualityView.tsx:280` |
| 258 | `exceptions.labels.txt_7c124a` | `exceptions` | تقرير التحقق البرمجي لاشتراطات Exception Engine (8 فحوصات معمارية) | `/app/applet/src/components/exceptionEngine/ExceptionEngineView.tsx:912` |
| 259 | `exceptions.labels.status_3` | `exceptions` | الحالة اللاحقة (After): | `/app/applet/src/components/exceptionEngine/ExceptionEngineView.tsx:888` |
| 260 | `exceptions.labels.status_2` | `exceptions` | الحالة السابقة (Before): | `/app/applet/src/components/exceptionEngine/ExceptionEngineView.tsx:882` |
| 261 | `exceptions.labels.txt_72387b` | `exceptions` | الاستثناء: | `/app/applet/src/components/exceptionEngine/ExceptionEngineView.tsx:851` |
| 262 | `exceptions.labels.status` | `exceptions` | كل قيد يمثل عملية معالجة (إنشاء، بدء مراجعة، حل، رفض) مع بصمة الوقت، المنفذ، والحالة قبل وبعد التعديل. | `/app/applet/src/components/exceptionEngine/ExceptionEngineView.tsx:830` |
| 263 | `exceptions.labels.txt_3f1220` | `exceptions` | سجل التدقيق الإلزامي للاستثناءات (Exception Audit Logs) | `/app/applet/src/components/exceptionEngine/ExceptionEngineView.tsx:827` |
| 264 | `exceptions.labels.save` | `exceptions` | حفظ الاستثناء وتسجيل قيد التدقيق الإلزامي | `/app/applet/src/components/exceptionEngine/ExceptionEngineView.tsx:811` |
| 265 | `exceptions.labels.details` | `exceptions` | شرح وتفاصيل الاستثناء (description) | `/app/applet/src/components/exceptionEngine/ExceptionEngineView.tsx:782` |
| 266 | `exceptions.labels.txt_5b7754` | `exceptions` | المُبلّغ / النظام (openedBy) | `/app/applet/src/components/exceptionEngine/ExceptionEngineView.tsx:769` |
| 267 | `exceptions.labels.trip_5` | `exceptions` | بدون رحلة (عام) | `/app/applet/src/components/exceptionEngine/ExceptionEngineView.tsx:754` |
| 268 | `exceptions.labels.trip_4` | `exceptions` | معرف الرحلة (tripId - Nullable) | `/app/applet/src/components/exceptionEngine/ExceptionEngineView.tsx:746` |
| 269 | `exceptions.labels.txt_7d3f95` | `exceptions` | CRITICAL (حرجة) | `/app/applet/src/components/exceptionEngine/ExceptionEngineView.tsx:727` |
| 270 | `exceptions.labels.txt_10c619` | `exceptions` | BLOCKING (حاجزة / توقف الرحلة) | `/app/applet/src/components/exceptionEngine/ExceptionEngineView.tsx:726` |
| 271 | `exceptions.labels.txt_4ae5ff` | `exceptions` | HIGH (عالية) | `/app/applet/src/components/exceptionEngine/ExceptionEngineView.tsx:725` |
| 272 | `exceptions.labels.txt_5662ab` | `exceptions` | MEDIUM (متوسطة) | `/app/applet/src/components/exceptionEngine/ExceptionEngineView.tsx:724` |
| 273 | `exceptions.labels.txt_45ffe0` | `exceptions` | LOW (منخفضة) | `/app/applet/src/components/exceptionEngine/ExceptionEngineView.tsx:723` |
| 274 | `exceptions.labels.txt_d776cd` | `exceptions` | درجة الخطورة (Severity) | `/app/applet/src/components/exceptionEngine/ExceptionEngineView.tsx:717` |
| 275 | `exceptions.labels.txt_69c1d3` | `exceptions` | نوع الاستثناء (12 Types) | `/app/applet/src/components/exceptionEngine/ExceptionEngineView.tsx:694` |
| 276 | `exceptions.labels.txt_4d1247` | `exceptions` | اختر أحد الأنواع الـ 12 المعتمدة وحدد درجة الخطورة والأدلة، وسيتم تلقائياً تسجيل قيد تدقيق غير قابل للحذف في Audit Log. | `/app/applet/src/components/exceptionEngine/ExceptionEngineView.tsx:685` |
| 277 | `exceptions.labels.txt_2fee62` | `exceptions` | فتح استثناء تشغيلي جديد (Raise Exception) | `/app/applet/src/components/exceptionEngine/ExceptionEngineView.tsx:682` |
| 278 | `exceptions.labels.txt_4734c7` | `exceptions` | رفض الاستثناء (REJECT) | `/app/applet/src/components/exceptionEngine/ExceptionEngineView.tsx:651` |
| 279 | `exceptions.labels.txt_64d8a5` | `exceptions` | اعتماد الحل (RESOLVE) | `/app/applet/src/components/exceptionEngine/ExceptionEngineView.tsx:640` |
| 280 | `exceptions.labels.txt_5675c9` | `exceptions` | بدء المراجعة (UNDER_REVIEW) | `/app/applet/src/components/exceptionEngine/ExceptionEngineView.tsx:629` |
| 281 | `exceptions.labels.txt_7f2a74` | `exceptions` | المراجع: | `/app/applet/src/components/exceptionEngine/ExceptionEngineView.tsx:572` |
| 282 | `exceptions.labels.txt_368d82` | `exceptions` | فُتح بواسطة: | `/app/applet/src/components/exceptionEngine/ExceptionEngineView.tsx:569` |
| 283 | `exceptions.labels.trip_3` | `exceptions` | عام (بدون رحلة - tripId: null) | `/app/applet/src/components/exceptionEngine/ExceptionEngineView.tsx:538` |
| 284 | `exceptions.labels.txt_60d9c1` | `exceptions` | النظام التشغيلي متوافق ومستقر | `/app/applet/src/components/exceptionEngine/ExceptionEngineView.tsx:493` |
| 285 | `exceptions.labels.search` | `exceptions` | لا توجد استثناءات مطابقة لمعايير البحث الحالية | `/app/applet/src/components/exceptionEngine/ExceptionEngineView.tsx:492` |
| 286 | `exceptions.labels.cancelFilter` | `exceptions` | إلغاء التصفية | `/app/applet/src/components/exceptionEngine/ExceptionEngineView.tsx:479` |
| 287 | `exceptions.labels.txt_44f88f` | `exceptions` | جميع الأنواع الـ 12 | `/app/applet/src/components/exceptionEngine/ExceptionEngineView.tsx:462` |
| 288 | `exceptions.labels.txt_2fa8d7` | `exceptions` | مرفوضة (REJECTED) | `/app/applet/src/components/exceptionEngine/ExceptionEngineView.tsx:453` |
| 289 | `exceptions.labels.txt_482fcf` | `exceptions` | محلولة ومعتمدة (RESOLVED) | `/app/applet/src/components/exceptionEngine/ExceptionEngineView.tsx:452` |
| 290 | `exceptions.labels.txt_6abe88` | `exceptions` | قيد المراجعة (UNDER_REVIEW) | `/app/applet/src/components/exceptionEngine/ExceptionEngineView.tsx:451` |
| 291 | `exceptions.labels.txt_186ae9` | `exceptions` | مفتوحة فقط (OPEN) | `/app/applet/src/components/exceptionEngine/ExceptionEngineView.tsx:450` |
| 292 | `exceptions.labels.txt_7bbe1c` | `exceptions` | سجلات التدقيق (AUDIT) | `/app/applet/src/components/exceptionEngine/ExceptionEngineView.tsx:415` |
| 293 | `exceptions.labels.txt_2fa8d7` | `exceptions` | مرفوضة (REJECTED) | `/app/applet/src/components/exceptionEngine/ExceptionEngineView.tsx:407` |
| 294 | `exceptions.labels.txt_268748` | `exceptions` | معتمدة ومحلولة (RESOLVED) | `/app/applet/src/components/exceptionEngine/ExceptionEngineView.tsx:399` |
| 295 | `exceptions.labels.txt_42390c` | `exceptions` | قيد المراجعة (REVIEW) | `/app/applet/src/components/exceptionEngine/ExceptionEngineView.tsx:391` |
| 296 | `exceptions.labels.txt_2abe41` | `exceptions` | مفتوحة (OPEN) | `/app/applet/src/components/exceptionEngine/ExceptionEngineView.tsx:383` |
| 297 | `exceptions.labels.txt_54e0a5` | `exceptions` | إجمالي الاستثناءات | `/app/applet/src/components/exceptionEngine/ExceptionEngineView.tsx:373` |
| 298 | `exceptions.labels.txt_391836` | `exceptions` | فتح استثناء جديد (Raise Exception) | `/app/applet/src/components/exceptionEngine/ExceptionEngineView.tsx:338` |
| 299 | `exceptions.labels.txt_4eb7b8` | `exceptions` | سجل تدقيق إلزامي (Audit Trail) | `/app/applet/src/components/exceptionEngine/ExceptionEngineView.tsx:303` |
| 300 | `exceptions.labels.txt_1d573a` | `exceptions` | 12 نوعاً معيارياً | `/app/applet/src/components/exceptionEngine/ExceptionEngineView.tsx:300` |

## 4. Architectural Safety & Invariant Guarantees

- **Zero Non-SAFE Transformations:** 100% of applied replacements were classified as `SAFE`. Zero `LOW_RISK`, `HIGH_RISK`, `REVIEW_ONLY`, or `SKIP` candidates were applied.
- **Zero Business Logic Modification:** 0 pricing logic changes, 0 report logic changes, 0 import logic changes, 0 security changes, 0 Firestore changes, 0 API changes, 0 database schema changes, 0 state-machine changes, 0 offline logic changes.
- **Zero CSS Directional Alterations:** No Tailwind directional classes (e.g. `mr-`, `pl-`, `left-`, `right-`, `dir="rtl"`, `dir="ltr"`) were altered.
- **React Hook Integrity:** All components import `useI18n` exactly once, and invoke `const { t } = useI18n()` strictly at the top level of the component body.
- **Protected Business Identifiers Preserved:** Zero business tokens (`projectId`, `ticketId`, `truckNo`, `carrierId`, `status`, etc.) or machine-readable values (`COMPLETED`, `PENDING`, `ACTIVE`, etc.) were transformed.
- **Arabic Production Behavior Preserved:** All applied keys resolve to identical Arabic strings registered in the Arabic locale dictionary.
- **Idempotency Verified:** Re-running the scanner confirms 0 pending SAFE candidates for migrated nodes, with zero duplicate translations.

## 5. Next Steps

BLOCK 46 SAFE batch expansion is complete. All regressions tests green and changes verified.
