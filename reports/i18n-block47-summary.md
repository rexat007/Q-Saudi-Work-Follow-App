# BLOCK 47 — Controlled i18n Migration: SAFE Batch Summary Report

## 1. Executive Summary

- **Execution Mode:** SAFE Batch Continuation Applied (Production Source Migration)
- **Timestamp:** 2026-09-12T11:39:43.007Z
- **Total SAFE Candidates Detected in Dry-Run:** 1112
- **Total SAFE Candidates Evaluated for Block:** 731
- **Total SAFE Candidates Applied in Batch:** 500 (Max batch ceiling: 500)
- **Categories Migrated:** materials (18), trips (167), loading (85), unloading (66), weighbridge (107), legacyMigration (57)
- **Deferred / Protected Categories:** database schemas, raw queries, network protocols, cryptography (Strictly protected)
- **Total Files Modified:** 8

## 2. File Hashes & Verification

| File Path | Pre-Migration Hash | Post-Migration Hash | Transforms Applied | Status |
|-----------|--------------------|---------------------|--------------------|--------|
| `/app/applet/src/components/wizard/Step2Materials.tsx` | `948e75043796920a` | `5313e7261fdb9480` | 18 | VALIDATED & APPLIED |
| `/app/applet/src/components/tripEngine/StateMachineController.tsx` | `3ea36a03a4aa933d` | `d43dff4e8ad45d4e` | 66 | VALIDATED & APPLIED |
| `/app/applet/src/components/TripEngineView.tsx` | `b53764df278ce011` | `0073acd19b33d8e1` | 101 | VALIDATED & APPLIED |
| `/app/applet/src/components/tripEngine/LoadingStation.tsx` | `e2da71ea0fb70d33` | `27da63226c3a34b3` | 85 | VALIDATED & APPLIED |
| `/app/applet/src/components/tripEngine/UnloadingStation.tsx` | `7ea205277548e730` | `1d69db576f1c66ca` | 66 | VALIDATED & APPLIED |
| `/app/applet/src/components/importCenter/WeighbridgeImportSection.tsx` | `59f0be3f38b44e65` | `f42095bce9466482` | 49 | VALIDATED & APPLIED |
| `/app/applet/src/components/tripEngine/WeightEngineView.tsx` | `7d36627fcf9f9b3c` | `8a469971171117d1` | 58 | VALIDATED & APPLIED |
| `/app/applet/src/components/migration/LegacyMigrationView.tsx` | `4f4f3eec793675c8` | `aff8a2bc29b0f706` | 57 | VALIDATED & APPLIED |

## 3. Applied Translation Keys & Canonical Arabic Sources

| # | Translation Key | Category | Canonical Arabic Source | Applied In |
|---|-----------------|----------|-------------------------|------------|
| 1 | `materials.labels.deleteMaterial` | `materials` | حذف المادة | `/app/applet/src/components/wizard/Step2Materials.tsx:427` |
| 2 | `materials.labels.editMaterial` | `materials` | تعديل بيانات المادة | `/app/applet/src/components/wizard/Step2Materials.tsx:418` |
| 3 | `materials.labels.txt_112afc` | `materials` | اضغط للتبديل بين التفعيل والتعطيل | `/app/applet/src/components/wizard/Step2Materials.tsx:394` |
| 4 | `materials.labels.txt_737581` | `materials` | تحريك لأسفل | `/app/applet/src/components/wizard/Step2Materials.tsx:356` |
| 5 | `materials.labels.txt_73756a` | `materials` | تحريك لأعلى | `/app/applet/src/components/wizard/Step2Materials.tsx:346` |
| 6 | `materials.labels.status_2` | `materials` | الحالة (Status) | `/app/applet/src/components/wizard/Step2Materials.tsx:328` |
| 7 | `materials.labels.txt_252118` | `materials` | الوحدة | `/app/applet/src/components/wizard/Step2Materials.tsx:327` |
| 8 | `materials.labels.txt_7f591f` | `materials` | الترتيب | `/app/applet/src/components/wizard/Step2Materials.tsx:324` |
| 9 | `materials.labels.txt_9e7170` | `materials` | أضف أول مادة الآن | `/app/applet/src/components/wizard/Step2Materials.tsx:316` |
| 10 | `materials.labels.add_2` | `materials` | لم تتم إضافة أي مواد للمشروع بعد. | `/app/applet/src/components/wizard/Step2Materials.tsx:309` |
| 11 | `materials.labels.txt_1a4fae` | `materials` | يمكنك استخدام الأسهم ⬆️⬇️ لتغيير الترتيب المعتمد في السندات | `/app/applet/src/components/wizard/Step2Materials.tsx:302` |
| 12 | `materials.labels.txt_60028f` | `materials` | رد كامل (TRIP) - مقطوع | `/app/applet/src/components/wizard/Step2Materials.tsx:254` |
| 13 | `materials.labels.txt_6688ac` | `materials` | متر مكعب (M3) - حجمي | `/app/applet/src/components/wizard/Step2Materials.tsx:253` |
| 14 | `materials.labels.txt_3b64b7` | `materials` | وحدة القياس المعتمدة | `/app/applet/src/components/wizard/Step2Materials.tsx:244` |
| 15 | `materials.labels.material_2` | `materials` | رمز المادة (materialCode) | `/app/applet/src/components/wizard/Step2Materials.tsx:230` |
| 16 | `materials.labels.materials_3` | `materials` | تنبيهات إدارة المواد: | `/app/applet/src/components/wizard/Step2Materials.tsx:180` |
| 17 | `materials.labels.materials_2` | `materials` | أضف المواد المعتمدة للمشروع مع تحديد الرموز، وحدات القياس، والترتيب التشغيلي. | `/app/applet/src/components/wizard/Step2Materials.tsx:159` |
| 18 | `materials.labels.materials` | `materials` | الخطوة 2: إدارة المواد ونطاق التوريد (Materials) | `/app/applet/src/components/wizard/Step2Materials.tsx:156` |
| 19 | `trips.labels.txt_625185` | `trips` | الفروقات الموثقة (Field-level Diff): | `/app/applet/src/components/tripEngine/StateMachineController.tsx:1195` |
| 20 | `trips.labels.txt_5980b8` | `trips` | إصدار: | `/app/applet/src/components/tripEngine/StateMachineController.tsx:1183` |
| 21 | `trips.labels.txt_584eb0` | `trips` | لا يوجد سجل تدقيق متاح حالياً لهذه الرحلة. | `/app/applet/src/components/tripEngine/StateMachineController.tsx:1166` |
| 22 | `trips.labels.txt_4c39d7` | `trips` | توثيق التغييرات والمقارنة التفاضلية (Diff) وتتبع تزايد الإصدارات (Optimistic Versioning): | `/app/applet/src/components/tripEngine/StateMachineController.tsx:1156` |
| 23 | `trips.labels.txt_46a3cb` | `trips` | سجل التدقيق الرقابي غير القابل للتعديل (Immutable Audit Trail) | `/app/applet/src/components/tripEngine/StateMachineController.tsx:1153` |
| 24 | `trips.labels.txt_124138` | `trips` | السبب/الملاحظة: | `/app/applet/src/components/tripEngine/StateMachineController.tsx:1130` |
| 25 | `trips.labels.trip_25` | `trips` | لا توجد أحداث مسجلة لهذه الرحلة بعد. قم بتنفيذ تحول في دورة الحياة لتوليد الحدث الأول. | `/app/applet/src/components/tripEngine/StateMachineController.tsx:1108` |
| 26 | `trips.labels.timeProject` | `trips` | كل تحول ينشئ حدثاً مستقلاً موثقاً بالوقت والرتبة والمشروع والبيانات المرفقة: | `/app/applet/src/components/tripEngine/StateMachineController.tsx:1098` |
| 27 | `trips.labels.cancelTrip` | `trips` | إلغاء أمر الرحلة قبل الانطلاق بقرار تشغيلي معتمد ومبرر. | `/app/applet/src/components/tripEngine/StateMachineController.tsx:1080` |
| 28 | `trips.labels.txt_2e7926` | `trips` | CANCELLED (ملغاة) | `/app/applet/src/components/tripEngine/StateMachineController.tsx:1079` |
| 29 | `trips.labels.txt_4e4194` | `trips` | EXCEPTION (استثناء / عطل) | `/app/applet/src/components/tripEngine/StateMachineController.tsx:1073` |
| 30 | `trips.labels.confirmBackTruck` | `trips` | تأكيد رجوع الشاحنة إلى الكسارة أو المحجر المصدر. | `/app/applet/src/components/tripEngine/StateMachineController.tsx:1068` |
| 31 | `trips.labels.txt_1e7d43` | `trips` | RETURNED (تم الإرجاع للمصدر) | `/app/applet/src/components/tripEngine/StateMachineController.tsx:1067` |
| 32 | `trips.labels.location_9` | `trips` | رفض الشحنة بالموقع أو تلف العينات مع اشتراط كتابة السبب. | `/app/applet/src/components/tripEngine/StateMachineController.tsx:1062` |
| 33 | `trips.labels.txt_1b87fb` | `trips` | RETURN_REQUESTED (طلب إرجاع) | `/app/applet/src/components/tripEngine/StateMachineController.tsx:1061` |
| 34 | `trips.labels.txt_13cdfe` | `trips` | مسارات الاستثناء والإرجاع والإلغاء (Branches & Terminals): | `/app/applet/src/components/tripEngine/StateMachineController.tsx:1058` |
| 35 | `trips.labels.txt_23fa6b` | `trips` | المسار الذهبي القياسي (Happy Path): | `/app/applet/src/components/tripEngine/StateMachineController.tsx:1020` |
| 36 | `trips.labels.txt_3ac325` | `trips` | تسلسل الحالات التشغيلية، بوابات الحوكمة، ومسارات الاستثناء والإرجاع والإلغاء: | `/app/applet/src/components/tripEngine/StateMachineController.tsx:1010` |
| 37 | `trips.labels.txt_7a972e` | `trips` | المخطط الهيكلي للحالات العشر (10-State Lifecycle Topology) | `/app/applet/src/components/tripEngine/StateMachineController.tsx:1007` |
| 38 | `trips.labels.editTrip_2` | `trips` | يحظر تعديل رحلة من مستخدم يتبع مشروعاً آخر | `/app/applet/src/components/tripEngine/StateMachineController.tsx:965` |
| 39 | `trips.labels.project_4` | `trips` | 8. تعارض المشروع (Project Isolation) | `/app/applet/src/components/tripEngine/StateMachineController.tsx:964` |
| 40 | `trips.labels.driverDownload` | `trips` | مثال: محاولة السائق اعتماد التحميل أو الاستلام | `/app/applet/src/components/tripEngine/StateMachineController.tsx:953` |
| 41 | `trips.labels.status_6` | `trips` | 7. تغيير الحالة برتبة غير مصرحة | `/app/applet/src/components/tripEngine/StateMachineController.tsx:952` |
| 42 | `trips.labels.txt_701a0c` | `trips` | يحظر تخطي المراحل التشغيلية الإلزامية | `/app/applet/src/components/tripEngine/StateMachineController.tsx:941` |
| 43 | `trips.labels.txt_1a8cbe` | `trips` | 6. قفز غير قانوني (DRAFT ➔ COMPLETED) | `/app/applet/src/components/tripEngine/StateMachineController.tsx:940` |
| 44 | `trips.status.failedPricing` | `trips` | يحظر التحول إلى IN_TRANSIT إذا فشل التسعير | `/app/applet/src/components/tripEngine/StateMachineController.tsx:929` |
| 45 | `trips.status.tripFailed_4` | `trips` | 5. بدء رحلة إذا فشل Pricing Resolution | `/app/applet/src/components/tripEngine/StateMachineController.tsx:928` |
| 46 | `trips.labels.txt_37b15d` | `trips` | يحظر الإتمام إذا تعذر احتساب الفارق بدقة | `/app/applet/src/components/tripEngine/StateMachineController.tsx:917` |
| 47 | `trips.labels.trip_21` | `trips` | 4. إتمام رحلة بدون حساب variance | `/app/applet/src/components/tripEngine/StateMachineController.tsx:916` |
| 48 | `trips.labels.txt_2c17d4` | `trips` | يحظر الإكمال بدون هوية المستلم ووقت التفريغ | `/app/applet/src/components/tripEngine/StateMachineController.tsx:905` |
| 49 | `trips.labels.trip_20` | `trips` | 3. إكمال الرحلة بدون unloaderId أو unloadTime | `/app/applet/src/components/tripEngine/StateMachineController.tsx:904` |
| 50 | `trips.labels.trip_19` | `trips` | يحظر إكمال الرحلة إذا كان destNetWeight مفقوداً | `/app/applet/src/components/tripEngine/StateMachineController.tsx:893` |
| 51 | `trips.labels.edit_5` | `trips` | يحظر تعديل status مباشرة دون المرور بالمحرك | `/app/applet/src/components/tripEngine/StateMachineController.tsx:881` |
| 52 | `trips.labels.edit_4` | `trips` | 1. تجربة التعديل المباشر من العميل (Direct Mutation) | `/app/applet/src/components/tripEngine/StateMachineController.tsx:880` |
| 53 | `trips.labels.txt_58f744` | `trips` | انقر على أي تجربة أدناه لإثبات أن محرك الحالات يرفض أي اختراق أو انتهاك لقواعد الحوكمة الصارمة: | `/app/applet/src/components/tripEngine/StateMachineController.tsx:869` |
| 54 | `trips.labels.txt_2cd3f8` | `trips` | مصفوفة إثبات الحظر الرقابي (Negative Stress Tests) | `/app/applet/src/components/tripEngine/StateMachineController.tsx:865` |
| 55 | `trips.labels.txt_178295` | `trips` | اعتماد الانتقال وزيادة الـ Version | `/app/applet/src/components/tripEngine/StateMachineController.tsx:851` |
| 56 | `trips.labels.txt_5d1540` | `trips` | سبب أو ملاحظة التحول (يُحفظ في سجل الأحداث والتدقيق): | `/app/applet/src/components/tripEngine/StateMachineController.tsx:828` |
| 57 | `trips.labels.txt_f45a43` | `trips` | وقت التفريغ الفعلي (unloadTime) | `/app/applet/src/components/tripEngine/StateMachineController.tsx:805` |
| 58 | `trips.labels.cancel` | `trips` | إلغاء ✕ | `/app/applet/src/components/tripEngine/StateMachineController.tsx:772` |
| 59 | `trips.labels.txt_10cba9` | `trips` | صالح ومحلول ✓ | `/app/applet/src/components/tripEngine/StateMachineController.tsx:704` |
| 60 | `trips.labels.pricing_3` | `trips` | التسعير والتسوية الخادومية | `/app/applet/src/components/tripEngine/StateMachineController.tsx:680` |
| 61 | `trips.labels.trip_18` | `trips` | إلزامي قبل إكمال الرحلة | `/app/applet/src/components/tripEngine/StateMachineController.tsx:664` |
| 62 | `trips.labels.trip_16` | `trips` | اختر رحلة للاختبار والتحكم: | `/app/applet/src/components/tripEngine/StateMachineController.tsx:596` |
| 63 | `trips.labels.txt_4cc4c6` | `trips` | PRJ-REDSEA-002 (مشروع البحر الأحمر - لاختبار التعارض ✗) | `/app/applet/src/components/tripEngine/StateMachineController.tsx:582` |
| 64 | `trips.labels.txt_233016` | `trips` | PRJ-NEOM-001 (مشروع نيوم - مطابق) | `/app/applet/src/components/tripEngine/StateMachineController.tsx:581` |
| 65 | `trips.status.projectActive` | `trips` | المشروع النشط للمستخدم: | `/app/applet/src/components/tripEngine/StateMachineController.tsx:574` |
| 66 | `trips.labels.txt_7ccbe0` | `trips` | AUDITOR (المدقق المالي ومفتش الجودة) | `/app/applet/src/components/tripEngine/StateMachineController.tsx:567` |
| 67 | `trips.labels.txt_2750ef` | `trips` | OPERATIONS_MANAGER (مدير العمليات) | `/app/applet/src/components/tripEngine/StateMachineController.tsx:566` |
| 68 | `trips.labels.txt_29b5f9` | `trips` | SITE_RECEIVER (مستلم ومفتش الموقع) | `/app/applet/src/components/tripEngine/StateMachineController.tsx:565` |
| 69 | `trips.labels.txt_7517d4` | `trips` | DRIVER (السائق) | `/app/applet/src/components/tripEngine/StateMachineController.tsx:564` |
| 70 | `trips.labels.txt_2e23b2` | `trips` | SCALE_OPERATOR (كاتب ميزان المصدر) | `/app/applet/src/components/tripEngine/StateMachineController.tsx:563` |
| 71 | `trips.labels.txt_f4327d` | `trips` | DISPATCHER (مرحل العمليات) | `/app/applet/src/components/tripEngine/StateMachineController.tsx:562` |
| 72 | `trips.labels.txt_54360d` | `trips` | رتبة المشغل الحالي: | `/app/applet/src/components/tripEngine/StateMachineController.tsx:546` |
| 73 | `trips.labels.txt_68729b` | `trips` | مخطط الحالات العشر (Diagram) | `/app/applet/src/components/tripEngine/StateMachineController.tsx:514` |
| 74 | `trips.labels.txt_a636ce` | `trips` | لوحة التحكم والانتقال | `/app/applet/src/components/tripEngine/StateMachineController.tsx:503` |
| 75 | `trips.labels.txt_5f22c5` | `trips` | حوكمة كاملة لجميع تحولات دورة الحياة، التحقق من الرتبة والمشروع، إلزامية أوزان ومستلم وميقات الوصول، واحتساب التفاوت والتسوية خادومياً. | `/app/applet/src/components/tripEngine/StateMachineController.tsx:487` |
| 76 | `trips.labels.edit_3` | `trips` | 10 حالات رسمية + حظر التعديل المباشر | `/app/applet/src/components/tripEngine/StateMachineController.tsx:483` |
| 77 | `trips.labels.txt_2ae109` | `trips` | محرك الحالات المركزي (Centralized Trip State Machine) | `/app/applet/src/components/tripEngine/StateMachineController.tsx:481` |
| 78 | `trips.labels.txt_3740a7` | `trips` | ملغاة (CANCELLED) | `/app/applet/src/components/tripEngine/StateMachineController.tsx:466` |
| 79 | `trips.labels.txt_4fb822` | `trips` | استثناء مسجل (EXCEPTION) | `/app/applet/src/components/tripEngine/StateMachineController.tsx:464` |
| 80 | `trips.labels.txt_135d7e` | `trips` | مرتجعة للمصدر (RETURNED) | `/app/applet/src/components/tripEngine/StateMachineController.tsx:462` |
| 81 | `trips.labels.txt_45a060` | `trips` | طلب إرجاع (RETURN_REQUESTED) | `/app/applet/src/components/tripEngine/StateMachineController.tsx:460` |
| 82 | `trips.status.txt_4c5ffa` | `trips` | مكتملة ومسواة (COMPLETED) | `/app/applet/src/components/tripEngine/StateMachineController.tsx:458` |
| 83 | `trips.labels.location` | `trips` | وصلت الموقع (ARRIVED) | `/app/applet/src/components/tripEngine/StateMachineController.tsx:454` |
| 84 | `trips.labels.txt_499473` | `trips` | في الطريق (IN_TRANSIT) | `/app/applet/src/components/tripEngine/StateMachineController.tsx:452` |
| 85 | `trips.labels.trip_7` | `trips` | ملاحظات الرحلة والتتبع الرقابي (notes): | `/app/applet/src/components/TripEngineView.tsx:1578` |
| 86 | `trips.labels.notes` | `trips` | 4. المشغلون والتوقيت والملاحظات | `/app/applet/src/components/TripEngineView.tsx:1557` |
| 87 | `trips.labels.txt_566fcf` | `trips` | صافي الوصول (destNetWeight) | `/app/applet/src/components/TripEngineView.tsx:1516` |
| 88 | `trips.labels.txt_34781c` | `trips` | حساب خادومي صارم | `/app/applet/src/components/TripEngineView.tsx:1513` |
| 89 | `trips.labels.txt_ca71d3` | `trips` | صافي المصدر (netWeight) | `/app/applet/src/components/TripEngineView.tsx:1511` |
| 90 | `trips.labels.txt_2ed89d` | `trips` | 2. حوكمة الأوزان (Weights) | `/app/applet/src/components/TripEngineView.tsx:1500` |
| 91 | `trips.labels.txt_50e5d7` | `trips` | 1. المعرفات والبيانات التشغيلية | `/app/applet/src/components/TripEngineView.tsx:1460` |
| 92 | `trips.labels.confirm` | `trips` | تأكيد الاستلام واعتماد الفارق | `/app/applet/src/components/TripEngineView.tsx:1423` |
| 93 | `trips.labels.txt_74ca11` | `trips` | ملاحظات الاستلام | `/app/applet/src/components/TripEngineView.tsx:1402` |
| 94 | `trips.labels.location_7` | `trips` | مستلم الموقع / المفتش (unloaderId) | `/app/applet/src/components/TripEngineView.tsx:1391` |
| 95 | `trips.labels.txt_240ccf` | `trips` | التحقق من القاعدة: يتم تحويل destNetWeight و varianceWeight من null إلى أرقام محققة. | `/app/applet/src/components/TripEngineView.tsx:1385` |
| 96 | `trips.labels.location_6` | `trips` | تسجيل استلام الموقع وميزان الوصول | `/app/applet/src/components/TripEngineView.tsx:1326` |
| 97 | `trips.labels.location_5` | `trips` | استلام الموقع | `/app/applet/src/components/TripEngineView.tsx:1302` |
| 98 | `trips.labels.location_4` | `trips` | تسجيل وصول واستلام في الموقع | `/app/applet/src/components/TripEngineView.tsx:1299` |
| 99 | `trips.labels.viewDetailsTrip` | `trips` | عرض تفاصيل الرحلة والـ Snapshot | `/app/applet/src/components/TripEngineView.tsx:1282` |
| 100 | `trips.labels.status_2` | `trips` | محرك الحالة | `/app/applet/src/components/TripEngineView.tsx:1276` |
| 101 | `trips.labels.txt_371dfc` | `trips` | التحكم في دورة الحياة بالمحرك المركزي | `/app/applet/src/components/TripEngineView.tsx:1273` |
| 102 | `trips.labels.txt_7b64c0` | `trips` | null (لم تُستلم) | `/app/applet/src/components/TripEngineView.tsx:1191` |
| 103 | `trips.labels.search` | `trips` | لا توجد رحلات مطابقة لمعايير البحث | `/app/applet/src/components/TripEngineView.tsx:1140` |
| 104 | `trips.labels.txt_1309b3` | `trips` | إجراءات | `/app/applet/src/components/TripEngineView.tsx:1133` |
| 105 | `trips.labels.status` | `trips` | الحالة / الإصدار | `/app/applet/src/components/TripEngineView.tsx:1132` |
| 106 | `trips.labels.txt_7d6134` | `trips` | التسوية (SAR) | `/app/applet/src/components/TripEngineView.tsx:1131` |
| 107 | `trips.labels.txt_414461` | `trips` | أوزان المصدر (كجم) | `/app/applet/src/components/TripEngineView.tsx:1128` |
| 108 | `trips.labels.driverMaterial` | `trips` | السائق والمادة | `/app/applet/src/components/TripEngineView.tsx:1127` |
| 109 | `trips.labels.carrierTruck` | `trips` | الناقل والشاحنة | `/app/applet/src/components/TripEngineView.tsx:1126` |
| 110 | `trips.labels.txt_3740a7` | `trips` | ملغاة (CANCELLED) | `/app/applet/src/components/TripEngineView.tsx:1111` |
| 111 | `trips.labels.txt_66dfa3` | `trips` | طلب إرجاع (RETURN_REQ) | `/app/applet/src/components/TripEngineView.tsx:1108` |
| 112 | `trips.status.txt_6e12f5` | `trips` | مكتملة ومستلمة (COMPLETED) | `/app/applet/src/components/TripEngineView.tsx:1107` |
| 113 | `trips.labels.location` | `trips` | وصلت الموقع (ARRIVED) | `/app/applet/src/components/TripEngineView.tsx:1105` |
| 114 | `trips.labels.txt_499473` | `trips` | في الطريق (IN_TRANSIT) | `/app/applet/src/components/TripEngineView.tsx:1104` |
| 115 | `trips.labels.txt_72e74a` | `trips` | جميع الحالات (10 حالات) | `/app/applet/src/components/TripEngineView.tsx:1101` |
| 116 | `trips.labels.download_3` | `trips` | تحميل واختبار سيناريو الأمان الرقابي | `/app/applet/src/components/TripEngineView.tsx:1070` |
| 117 | `trips.labels.txt_752683` | `trips` | سيناريو 7: اختبار أمان الأوزان - رفض netWeight من العميل وحسابه خادومياً | `/app/applet/src/components/TripEngineView.tsx:1061` |
| 118 | `trips.labels.download_2` | `trips` | تحميل واختبار السيناريو | `/app/applet/src/components/TripEngineView.tsx:1047` |
| 119 | `trips.labels.txt_99c9e5` | `trips` | قاعدة 6 ✗ | `/app/applet/src/components/TripEngineView.tsx:1041` |
| 120 | `trips.labels.txt_16825e` | `trips` | سيناريو 6: تسعيرة منتهية الصلاحية | `/app/applet/src/components/TripEngineView.tsx:1040` |
| 121 | `trips.labels.download_2` | `trips` | تحميل واختبار السيناريو | `/app/applet/src/components/TripEngineView.tsx:1029` |
| 122 | `trips.labels.carrier_2` | `trips` | اختيار شاحنة كفالتها تتبع المجدوعي مع تعيين الناقل بن لادن. يتم الحظر لعدم صحة العلاقة. | `/app/applet/src/components/TripEngineView.tsx:1026` |
| 123 | `trips.labels.txt_99cda6` | `trips` | قاعدة 5 ✗ | `/app/applet/src/components/TripEngineView.tsx:1023` |
| 124 | `trips.labels.truckCarrier` | `trips` | سيناريو 5: تعارض الشاحنة والناقل | `/app/applet/src/components/TripEngineView.tsx:1022` |
| 125 | `trips.labels.download_2` | `trips` | تحميل واختبار السيناريو | `/app/applet/src/components/TripEngineView.tsx:1011` |
| 126 | `trips.labels.txt_761b23` | `trips` | محاولة توريد "خلطة أسفلتية ساخنة" في مشروع مخصص لنقل الردميات والركام. حظر فوري. | `/app/applet/src/components/TripEngineView.tsx:1008` |
| 127 | `trips.labels.txt_99d167` | `trips` | قاعدة 4 ✗ | `/app/applet/src/components/TripEngineView.tsx:1005` |
| 128 | `trips.labels.txt_6ff1cd` | `trips` | سيناريو 4: مادة غير مسموحة | `/app/applet/src/components/TripEngineView.tsx:1004` |
| 129 | `trips.labels.download_2` | `trips` | تحميل واختبار السيناريو | `/app/applet/src/components/TripEngineView.tsx:993` |
| 130 | `trips.labels.create` | `trips` | اختيار "مؤسسة الشرقي" التي لا تملك ترخيص عمل في مشروع نيوم. يحظر النظام إنشاء الرحلة. | `/app/applet/src/components/TripEngineView.tsx:990` |
| 131 | `trips.labels.txt_99d528` | `trips` | قاعدة 3 ✗ | `/app/applet/src/components/TripEngineView.tsx:987` |
| 132 | `trips.labels.txt_3da066` | `trips` | سيناريو 3: ناقل غير مصرح | `/app/applet/src/components/TripEngineView.tsx:986` |
| 133 | `trips.labels.download_2` | `trips` | تحميل واختبار السيناريو | `/app/applet/src/components/TripEngineView.tsx:975` |
| 134 | `trips.labels.txt_762e97` | `trips` | ناقل بن لادن، شاحنة وسائق مطابقان، مادة رمل، تسعيرة مقطوعية ثابتة 1400 ر.س للرد الواحد. | `/app/applet/src/components/TripEngineView.tsx:972` |
| 135 | `trips.labels.txt_e1f245` | `trips` | ناجح ✓ | `/app/applet/src/components/TripEngineView.tsx:969` |
| 136 | `trips.labels.trip_4` | `trips` | سيناريو 2: رحلة مقطوعية (بالرد) | `/app/applet/src/components/TripEngineView.tsx:968` |
| 137 | `trips.labels.download_2` | `trips` | تحميل واختبار السيناريو | `/app/applet/src/components/TripEngineView.tsx:957` |
| 138 | `trips.labels.txt_333d61` | `trips` | ناقل مصرح (المجدوعي)، شاحنة وسائق مطابقان، مادة ركام معتمدة، وتسعيرة سارية بالطن. | `/app/applet/src/components/TripEngineView.tsx:954` |
| 139 | `trips.labels.txt_e1f245` | `trips` | ناجح ✓ | `/app/applet/src/components/TripEngineView.tsx:951` |
| 140 | `trips.labels.trip_3` | `trips` | سيناريو 1: رحلة مطابقة (بالطن) | `/app/applet/src/components/TripEngineView.tsx:950` |
| 141 | `trips.labels.downloadTrips` | `trips` | انقر على أي سيناريو أدناه لتحميل بياناته فوراً وملاحظة سلوك محرك الرحلات في القبول أو الحظر: | `/app/applet/src/components/TripEngineView.tsx:940` |
| 142 | `trips.labels.txt_5bcf4e` | `trips` | مصفوفة سيناريوهات الاختبار العملي للقواعد المعمارية | `/app/applet/src/components/TripEngineView.tsx:937` |
| 143 | `trips.labels.savePricingTrip` | `trips` | يتم حفظ لقطة التسعير (Pricing Snapshot) داخل سجل الرحلة لضمان عدم التلاعب المستقبلي. | `/app/applet/src/components/TripEngineView.tsx:924` |
| 144 | `trips.labels.txt_3a0ff7` | `trips` | مبلغ التسوية المستحق: | `/app/applet/src/components/TripEngineView.tsx:917` |
| 145 | `trips.labels.txt_15d5c6` | `trips` | أساس التسوية (settlementBase): | `/app/applet/src/components/TripEngineView.tsx:903` |
| 146 | `trips.labels.txt_7f5953` | `trips` | null (في انتظار الاستلام) | `/app/applet/src/components/TripEngineView.tsx:899` |
| 147 | `trips.labels.txt_7f5953` | `trips` | null (في انتظار الاستلام) | `/app/applet/src/components/TripEngineView.tsx:894` |
| 148 | `trips.labels.txt_599f05` | `trips` | الحسابات الخادومية الصارمة (Server-Side) | `/app/applet/src/components/TripEngineView.tsx:882` |
| 149 | `trips.labels.txt_5ed1a7` | `trips` | حالة فحص القواعد الستة اللحظي | `/app/applet/src/components/TripEngineView.tsx:841` |
| 150 | `trips.labels.trip_2` | `trips` | ترحيل واعتماد الرحلة فوراً في النظام (Dispatch Trip) | `/app/applet/src/components/TripEngineView.tsx:824` |
| 151 | `trips.labels.trip` | `trips` | ملاحظات الرحلة (notes) | `/app/applet/src/components/TripEngineView.tsx:802` |
| 152 | `trips.labels.downloadWeighbridge` | `trips` | مسؤول التحميل / كاتب الميزان (loaderId) | `/app/applet/src/components/TripEngineView.tsx:792` |
| 153 | `trips.labels.txt_41dcd5` | `trips` | محاكاة إرسال netWeight غير موثوق من العميل لاختبار الحماية الرقابية: "لا تقبل netWeight من client" | `/app/applet/src/components/TripEngineView.tsx:765` |
| 154 | `trips.labels.txt_3da9ae` | `trips` | أوزان ميزان البسكول في موقع المصدر (Origin Scale) | `/app/applet/src/components/TripEngineView.tsx:717` |
| 155 | `trips.labels.pricing_2` | `trips` | قاعدة التسعير (pricingRuleId) | `/app/applet/src/components/TripEngineView.tsx:697` |
| 156 | `trips.labels.txt_1b13ad` | `trips` | [قاعدة 2 و 5: صالح وكفالة الناقل] | `/app/applet/src/components/TripEngineView.tsx:675` |
| 157 | `trips.labels.driver` | `trips` | السائق (driverId) | `/app/applet/src/components/TripEngineView.tsx:674` |
| 158 | `trips.labels.txt_3969ce` | `trips` | [قاعدة 1 و 5: تبعية الناقل] | `/app/applet/src/components/TripEngineView.tsx:654` |
| 159 | `trips.labels.truck_2` | `trips` | الشاحنة (truckId) | `/app/applet/src/components/TripEngineView.tsx:653` |
| 160 | `trips.labels.txt_411e2d` | `trips` | [قاعدة 4: مصرح للمشروع] | `/app/applet/src/components/TripEngineView.tsx:630` |
| 161 | `trips.labels.material` | `trips` | المادة (materialId) | `/app/applet/src/components/TripEngineView.tsx:629` |
| 162 | `trips.labels.txt_22b00b` | `trips` | [قاعدة 3: مصرح للمشروع] | `/app/applet/src/components/TripEngineView.tsx:609` |
| 163 | `trips.labels.carrier` | `trips` | الناقل (carrierId) | `/app/applet/src/components/TripEngineView.tsx:608` |
| 164 | `trips.labels.pricing` | `trips` | يُفحص به سريان قاعدة التسعير | `/app/applet/src/components/TripEngineView.tsx:589` |
| 165 | `trips.labels.txt_77937d` | `trips` | نيوم - القطاع 4 اللوجستي | `/app/applet/src/components/TripEngineView.tsx:577` |
| 166 | `trips.labels.project_2` | `trips` | المشروع (projectId) | `/app/applet/src/components/TripEngineView.tsx:570` |
| 167 | `trips.labels.txt_6615b4` | `trips` | انتهاك قواعد التحقق | `/app/applet/src/components/TripEngineView.tsx:560` |
| 168 | `trips.labels.txt_5eb20e` | `trips` | مطابق للقواعد الـ 6 | `/app/applet/src/components/TripEngineView.tsx:555` |
| 169 | `trips.labels.txt_622420` | `trips` | يتم التحقق خادومياً من القواعد الستة واحتساب الأوزان والتسوية تلقائياً. | `/app/applet/src/components/TripEngineView.tsx:546` |
| 170 | `trips.labels.createTrip_2` | `trips` | إنشاء وترحيل رحلة جديدة (Dispatch Trip) | `/app/applet/src/components/TripEngineView.tsx:545` |
| 171 | `trips.labels.txt_6ae7c3` | `trips` | احتساب خادومي Server-Side | `/app/applet/src/components/TripEngineView.tsx:477` |
| 172 | `trips.labels.txt_7d5bc8` | `trips` | إجمالي التسوية المحسوبة | `/app/applet/src/components/TripEngineView.tsx:475` |
| 173 | `trips.labels.txt_40f0a8` | `trips` | تم احتساب varianceWeight | `/app/applet/src/components/TripEngineView.tsx:471` |
| 174 | `trips.labels.txt_3cbe5a` | `trips` | مستلمة ومفرغة بالكامل | `/app/applet/src/components/TripEngineView.tsx:469` |
| 175 | `trips.labels.txt_429ecc` | `trips` | قيد النقل (In-Transit) | `/app/applet/src/components/TripEngineView.tsx:460` |
| 176 | `trips.labels.txt_1af9f4` | `trips` | سجلات نظامية موثقة | `/app/applet/src/components/TripEngineView.tsx:456` |
| 177 | `trips.labels.trips_3` | `trips` | إعادة ضبط الرحلات الافتراضية | `/app/applet/src/components/TripEngineView.tsx:443` |
| 178 | `trips.labels.txt_268208` | `trips` | مصفوفة سيناريوهات الاختبار (7 حالات) | `/app/applet/src/components/TripEngineView.tsx:435` |
| 179 | `trips.labels.createTrip` | `trips` | إنشاء وترحيل رحلة (New Trip) | `/app/applet/src/components/TripEngineView.tsx:424` |
| 180 | `trips.labels.txt_4fd2e9` | `trips` | محرك الحالات المركزي (State Machine) | `/app/applet/src/components/TripEngineView.tsx:402` |
| 181 | `trips.labels.txt_14036c` | `trips` | محرك الأوزان والتفاوت (Weight Engine) | `/app/applet/src/components/TripEngineView.tsx:391` |
| 182 | `trips.labels.txt_934de7` | `trips` | محطة التفريغ (Unloading) | `/app/applet/src/components/TripEngineView.tsx:380` |
| 183 | `trips.labels.download` | `trips` | محطة التحميل (Loading) | `/app/applet/src/components/TripEngineView.tsx:369` |
| 184 | `trips.labels.txt_7064be` | `trips` | قواعد البيانات المرجعية الستة | `/app/applet/src/components/TripEngineView.tsx:351` |
| 185 | `trips.labels.trips` | `trips` | محرك الرحلات اللوجستية (Trip Engine) | `/app/applet/src/components/TripEngineView.tsx:348` |
| 186 | `loading.labels.txt_732b41` | `loading` | نتائج الفحص البرمجي الآلي المباشر (Automated Suite): | `/app/applet/src/components/tripEngine/LoadingStation.tsx:1619` |
| 187 | `loading.labels.save_3` | `loading` | قيمة التسوية (settlementAmount) لا يوجد لها أي حقل إدخال في الواجهة، ويتم احتسابها حصراً في جانب الخدمة (Server-Side Calculation). في حال إرسال أي قيمة من العميل يتم تجاهلها وحفظ السجل الأمني في سجلات الرقابة. | `/app/applet/src/components/tripEngine/LoadingStation.tsx:1612` |
| 188 | `loading.labels.txt_3c2d03` | `loading` | محمي ومحصن | `/app/applet/src/components/tripEngine/LoadingStation.tsx:1609` |
| 189 | `loading.labels.edit_2` | `loading` | حظر تعديل settlementAmount من الواجهة: | `/app/applet/src/components/tripEngine/LoadingStation.tsx:1607` |
| 190 | `loading.labels.txt_1a9224` | `loading` | : تسجيل حدث SCALE_WEIGHT_CONFIRMED وسجل التدقيق | `/app/applet/src/components/tripEngine/LoadingStation.tsx:1593` |
| 191 | `loading.labels.createTripStatusSave` | `loading` | : إنشاء سجل الرحلة المبدئي بالحالة LOADED وحفظ Pricing Snapshot | `/app/applet/src/components/tripEngine/LoadingStation.tsx:1589` |
| 192 | `loading.labels.txt_19142a` | `loading` | تسلسل ذري (Atomic) | `/app/applet/src/components/tripEngine/LoadingStation.tsx:1584` |
| 193 | `loading.labels.txt_2b7e09` | `loading` | التسلسل الإجرائي الصارم بعد Confirm: | `/app/applet/src/components/tripEngine/LoadingStation.tsx:1582` |
| 194 | `loading.labels.txt_31e684` | `loading` | مفعّل بوضوح | `/app/applet/src/components/tripEngine/LoadingStation.tsx:1570` |
| 195 | `loading.labels.pricingConfirm` | `loading` | إظهار طريقة التسعير للمستخدم قبل التأكيد: | `/app/applet/src/components/tripEngine/LoadingStation.tsx:1568` |
| 196 | `loading.labels.txt_a9fcb1` | `loading` | 120 SAR (مقطوعية ثابتة للرد) | `/app/applet/src/components/tripEngine/LoadingStation.tsx:1555` |
| 197 | `loading.labels.txt_49a8b5` | `loading` | مثال PER_TRIP: | `/app/applet/src/components/tripEngine/LoadingStation.tsx:1554` |
| 198 | `loading.labels.txt_a2ced3` | `loading` | صافي: 45,600 كجم (Gross) - 8,200 كجم (Tare) = 37,400 كجم = 37.4 طن | `/app/applet/src/components/tripEngine/LoadingStation.tsx:1550` |
| 199 | `loading.labels.txt_797eb0` | `loading` | مثال PER_TON: | `/app/applet/src/components/tripEngine/LoadingStation.tsx:1547` |
| 200 | `loading.labels.txt_20c9dd` | `loading` | دقة حسابية 100% | `/app/applet/src/components/tripEngine/LoadingStation.tsx:1543` |
| 201 | `loading.labels.pricing_6` | `loading` | أمثلة التسعير المطلوبة نصاً في البرومبت: | `/app/applet/src/components/tripEngine/LoadingStation.tsx:1541` |
| 202 | `loading.status.completed_2` | `loading` | مكتمل 5 عناصر | `/app/applet/src/components/tripEngine/LoadingStation.tsx:1525` |
| 203 | `loading.labels.txt_285ec5` | `loading` | عناصر شاشة المعاينة (Preview يعرض): | `/app/applet/src/components/tripEngine/LoadingStation.tsx:1523` |
| 204 | `loading.labels.txt_2f5b25` | `loading` | تم تنفيذ الشريط التتابعي بالكامل (Workflow Stepper) مع التحقق من صلاحيات الكيانات وعزل المشاريع. | `/app/applet/src/components/tripEngine/LoadingStation.tsx:1514` |
| 205 | `loading.status.completed` | `loading` | مكتمل 8 خطوات | `/app/applet/src/components/tripEngine/LoadingStation.tsx:1508` |
| 206 | `loading.labels.txt_68840f` | `loading` | مسار خطوات العمل (Workflow): | `/app/applet/src/components/tripEngine/LoadingStation.tsx:1506` |
| 207 | `loading.labels.txt_258b75` | `loading` | مصفوفة التحقق التفصيلية من بنود البرومبت: | `/app/applet/src/components/tripEngine/LoadingStation.tsx:1498` |
| 208 | `loading.labels.txt_73aefc` | `loading` | العودة للواجهة | `/app/applet/src/components/tripEngine/LoadingStation.tsx:1490` |
| 209 | `loading.status.success` | `loading` | تم تنفيذ واختبار جميع متطلبات البرومبت بنجاح (100%) | `/app/applet/src/components/tripEngine/LoadingStation.tsx:1479` |
| 210 | `loading.labels.txt_3400c3` | `loading` | تقرير التحقق والمطابقة الصارمة لمتطلبات البرومبت | `/app/applet/src/components/tripEngine/LoadingStation.tsx:1454` |
| 211 | `loading.labels.txt_79f87c` | `loading` | : تسجيل حدث توثيق الأوزان بالميزان. | `/app/applet/src/components/tripEngine/LoadingStation.tsx:1435` |
| 212 | `loading.labels.createTripDownload` | `loading` | : إنشاء سجل الرحلة بحالة التحميل المبدئية. | `/app/applet/src/components/tripEngine/LoadingStation.tsx:1434` |
| 213 | `loading.labels.confirm_4` | `loading` | تسلسل المحرك بعد التأكيد: | `/app/applet/src/components/tripEngine/LoadingStation.tsx:1431` |
| 214 | `loading.labels.txt_212255` | `loading` | حماية التسوية الآلية | `/app/applet/src/components/tripEngine/LoadingStation.tsx:1419` |
| 215 | `loading.labels.txt_6765dc` | `loading` | صافي الحمولة (Net): | `/app/applet/src/components/tripEngine/LoadingStation.tsx:1407` |
| 216 | `loading.labels.createTrip_2` | `loading` | إنشاء رحلة جديدة | `/app/applet/src/components/tripEngine/LoadingStation.tsx:1304` |
| 217 | `loading.labels.viewDetailsTrip` | `loading` | عرض تفاصيل الرحلة | `/app/applet/src/components/tripEngine/LoadingStation.tsx:1272` |
| 218 | `loading.labels.txt_195be1` | `loading` | تسلسل المحرك المنجز: | `/app/applet/src/components/tripEngine/LoadingStation.tsx:1265` |
| 219 | `loading.labels.txt_57f8de` | `loading` | التسوية المعتمدة: | `/app/applet/src/components/tripEngine/LoadingStation.tsx:1256` |
| 220 | `loading.status.createConfirmTripDownload` | `loading` | تم إنشاء وتأكيد أمر الرحلة بمحطة التحميل بنجاح! | `/app/applet/src/components/tripEngine/LoadingStation.tsx:1235` |
| 221 | `loading.status.pricingSuccess` | `loading` | تم اجتياز جميع الفحوصات الرقابية، الأوزان، وقواعد التسعير بنجاح تام! | `/app/applet/src/components/tripEngine/LoadingStation.tsx:1225` |
| 222 | `loading.labels.txt_458dbb` | `loading` | التنبيهات الرقابية والفحص المسبق (Warnings): | `/app/applet/src/components/tripEngine/LoadingStation.tsx:1214` |
| 223 | `loading.labels.pricing_4` | `loading` | تبديل قاعدة التسعير للمقارنة: | `/app/applet/src/components/tripEngine/LoadingStation.tsx:1193` |
| 224 | `loading.labels.edit` | `loading` | ممنوع تعديل قيمة التسوية من الواجهة | `/app/applet/src/components/tripEngine/LoadingStation.tsx:1186` |
| 225 | `loading.labels.txt_56bb7e` | `loading` | المعادلة الحسابية المطبقة: | `/app/applet/src/components/tripEngine/LoadingStation.tsx:1170` |
| 226 | `loading.labels.confirm` | `loading` | طريقة احتساب التسعيرة المعتمدة قبل التأكيد: | `/app/applet/src/components/tripEngine/LoadingStation.tsx:1161` |
| 227 | `loading.labels.txt_31e3da` | `loading` | محسوبة خادومياً بالكامل | `/app/applet/src/components/tripEngine/LoadingStation.tsx:1152` |
| 228 | `loading.labels.txt_73e4a3` | `loading` | التسوية التقديرية (Settlement) | `/app/applet/src/components/tripEngine/LoadingStation.tsx:1147` |
| 229 | `loading.labels.txt_67b2a1` | `loading` | سارٍ وموثق بالعقد | `/app/applet/src/components/tripEngine/LoadingStation.tsx:1142` |
| 230 | `loading.labels.txt_37e310` | `loading` | التسوية محمية رقابياً | `/app/applet/src/components/tripEngine/LoadingStation.tsx:1105` |
| 231 | `loading.labels.downloadPricing_4` | `loading` | الخطوة 8: معاينة بطاقة التحميل والتسعير (Preview) | `/app/applet/src/components/tripEngine/LoadingStation.tsx:1097` |
| 232 | `loading.labels.txt_1f364f` | `loading` | 49,800 كجم (صافي 35.6 طن) | `/app/applet/src/components/tripEngine/LoadingStation.tsx:1082` |
| 233 | `loading.labels.txt_3668a3` | `loading` | 42,000 كجم (صافي 28 طن) | `/app/applet/src/components/tripEngine/LoadingStation.tsx:1075` |
| 234 | `loading.labels.txt_4d6846` | `loading` | 45,600 كجم (صافي 37.4 طن) | `/app/applet/src/components/tripEngine/LoadingStation.tsx:1068` |
| 235 | `loading.labels.txt_74acad` | `loading` | أوزان قائمة نموذجية: | `/app/applet/src/components/tripEngine/LoadingStation.tsx:1061` |
| 236 | `loading.labels.txt_6e3072` | `loading` | صافي الحمولة المحسوب فورياً (Net Weight): | `/app/applet/src/components/tripEngine/LoadingStation.tsx:1049` |
| 237 | `loading.labels.txt_72a483` | `loading` | قراءة ميزان الخروج بعد اكتمال تعبئة الحمولة (Scale Out) بالكيلوجرام | `/app/applet/src/components/tripEngine/LoadingStation.tsx:1026` |
| 238 | `loading.labels.txt_2dbe14` | `loading` | 15,000 كجم (رأس وتيدر) | `/app/applet/src/components/tripEngine/LoadingStation.tsx:1011` |
| 239 | `loading.labels.txt_4116bc` | `loading` | 14,200 كجم (قلاب ثقيل) | `/app/applet/src/components/tripEngine/LoadingStation.tsx:1004` |
| 240 | `loading.labels.txt_419290` | `loading` | 8,200 كجم (تريلا خفيفة) | `/app/applet/src/components/tripEngine/LoadingStation.tsx:997` |
| 241 | `loading.labels.txt_604b70` | `loading` | أوزان فارغة نموذجية (محاكاة الميزان): | `/app/applet/src/components/tripEngine/LoadingStation.tsx:990` |
| 242 | `loading.labels.txt_177f70` | `loading` | قراءة ميزان الدخول بالمصدر (Scale In) بالكيلوجرام | `/app/applet/src/components/tripEngine/LoadingStation.tsx:968` |
| 243 | `loading.labels.material_3` | `loading` | كود المادة: | `/app/applet/src/components/tripEngine/LoadingStation.tsx:953` |
| 244 | `loading.labels.materialsProject_2` | `loading` | المواد المصرحة بالمشروع | `/app/applet/src/components/tripEngine/LoadingStation.tsx:933` |
| 245 | `loading.labels.materialsProject` | `loading` | المواد المعتمدة للتوريد في موقع المشروع | `/app/applet/src/components/tripEngine/LoadingStation.tsx:928` |
| 246 | `loading.labels.material_2` | `loading` | الخطوة 5: اختيار المادة (Material) | `/app/applet/src/components/tripEngine/LoadingStation.tsx:927` |
| 247 | `loading.labels.txt_2dfd1b` | `loading` | الهوية/الإقامة: | `/app/applet/src/components/tripEngine/LoadingStation.tsx:911` |
| 248 | `loading.labels.drivers` | `loading` | السائقون المصرحون | `/app/applet/src/components/tripEngine/LoadingStation.tsx:890` |
| 249 | `loading.labels.driversCarrierTruck` | `loading` | السائقون المصرحون والمسجلون تحت الناقل والشاحنة | `/app/applet/src/components/tripEngine/LoadingStation.tsx:885` |
| 250 | `loading.labels.driver` | `loading` | الخطوة 4: اختيار السائق (Driver) | `/app/applet/src/components/tripEngine/LoadingStation.tsx:884` |
| 251 | `loading.labels.txt_754551` | `loading` | فحص دوري سارٍ | `/app/applet/src/components/tripEngine/LoadingStation.tsx:869` |
| 252 | `loading.labels.trucks` | `loading` | الشاحنات المتاحة للناقل المختار | `/app/applet/src/components/tripEngine/LoadingStation.tsx:847` |
| 253 | `loading.labels.carrier_4` | `loading` | شاحنات أسطول الناقل التابعة للمشروع | `/app/applet/src/components/tripEngine/LoadingStation.tsx:842` |
| 254 | `loading.labels.truck` | `loading` | الخطوة 3: اختيار الشاحنة (Truck) | `/app/applet/src/components/tripEngine/LoadingStation.tsx:841` |
| 255 | `loading.labels.txt_545437` | `loading` | شركات النقل المصرحة | `/app/applet/src/components/tripEngine/LoadingStation.tsx:800` |
| 256 | `loading.labels.project_3` | `loading` | يقتصر الاختيار على شركات النقل المصرح لها بالعمل في المشروع | `/app/applet/src/components/tripEngine/LoadingStation.tsx:795` |
| 257 | `loading.labels.carrier_2` | `loading` | الخطوة 2: اختيار الناقل المعتمد (Carrier) | `/app/applet/src/components/tripEngine/LoadingStation.tsx:794` |
| 258 | `loading.status.active` | `loading` | نشط ومعتمد | `/app/applet/src/components/tripEngine/LoadingStation.tsx:779` |
| 259 | `loading.labels.txt_6555e1` | `loading` | مشروع العمل المعتمد | `/app/applet/src/components/tripEngine/LoadingStation.tsx:755` |
| 260 | `loading.labels.projectDownloadPricing` | `loading` | تحديد المشروع التابع له أمر التحميل لتطبيق لوائح العزل والتسعير | `/app/applet/src/components/tripEngine/LoadingStation.tsx:750` |
| 261 | `loading.labels.project` | `loading` | الخطوة 1: اختيار المشروع (Project) | `/app/applet/src/components/tripEngine/LoadingStation.tsx:749` |
| 262 | `loading.labels.pricing_2` | `loading` | بيانات التسعير: | `/app/applet/src/components/tripEngine/LoadingStation.tsx:684` |
| 263 | `loading.labels.txt_4c9019` | `loading` | البيانات الأساسية: | `/app/applet/src/components/tripEngine/LoadingStation.tsx:672` |
| 264 | `loading.labels.txt_78af8a` | `loading` | بالمقطوعية: 120 ر.س | `/app/applet/src/components/tripEngine/LoadingStation.tsx:615` |
| 265 | `loading.labels.downloadPricing_2` | `loading` | تحميل مثال التسعير بالمقطوعية (120 SAR) | `/app/applet/src/components/tripEngine/LoadingStation.tsx:612` |
| 266 | `loading.labels.txt_17a514` | `loading` | بالطن: 37.4 × 8.5 = 317.90 ر.س | `/app/applet/src/components/tripEngine/LoadingStation.tsx:607` |
| 267 | `loading.labels.downloadPricing` | `loading` | تحميل مثال التسعير بالطن (37.4 × 8.5 = 317.90 SAR) | `/app/applet/src/components/tripEngine/LoadingStation.tsx:604` |
| 268 | `loading.labels.txt_6d4e47` | `loading` | الأمثلة المباشرة: | `/app/applet/src/components/tripEngine/LoadingStation.tsx:600` |
| 269 | `loading.labels.txt_7339fe` | `loading` | فحص ومطابقة جميع متطلبات البرومبت برمجياً | `/app/applet/src/components/tripEngine/LoadingStation.tsx:593` |
| 270 | `loading.labels.downloadWeighbridge_2` | `loading` | محطة التحميل والميزان (Loading Station) | `/app/applet/src/components/tripEngine/LoadingStation.tsx:580` |
| 271 | `unloading.labels.txt_48bcec` | `unloading` | جميع الاختبارات الخادومية مطابقة للمواصفات القياسية. | `/app/applet/src/components/tripEngine/UnloadingStation.tsx:1197` |
| 272 | `unloading.labels.txt_e43d44` | `unloading` | ناجحة 100% | `/app/applet/src/components/tripEngine/UnloadingStation.tsx:1155` |
| 273 | `unloading.labels.txt_23ed64` | `unloading` | تم فحص جميع القواعد الصارمة الواردة في البرومبت برمجياً | `/app/applet/src/components/tripEngine/UnloadingStation.tsx:1134` |
| 274 | `unloading.labels.txt_186f77` | `unloading` | تقرير الامتثال الآلي لاشتراطات محطة التفريغ (Unloading Station Tests) | `/app/applet/src/components/tripEngine/UnloadingStation.tsx:1131` |
| 275 | `unloading.labels.searchTrip_2` | `unloading` | بانتظار البحث عن رحلة | `/app/applet/src/components/tripEngine/UnloadingStation.tsx:1110` |
| 276 | `unloading.labels.txt_67076e` | `unloading` | ✓ تم اعتماد الاستثناء إدارياً | `/app/applet/src/components/tripEngine/UnloadingStation.tsx:1095` |
| 277 | `unloading.labels.txt_1cfd3c` | `unloading` | اعتماد الاستثناء والسماح بالتسوية (Waive Exception) | `/app/applet/src/components/tripEngine/UnloadingStation.tsx:1089` |
| 278 | `unloading.labels.user` | `unloading` | معرف المستخدم: | `/app/applet/src/components/tripEngine/UnloadingStation.tsx:1063` |
| 279 | `unloading.labels.txt_4f7379` | `unloading` | المسؤول المُبلّغ: | `/app/applet/src/components/tripEngine/UnloadingStation.tsx:1062` |
| 280 | `unloading.labels.project_2` | `unloading` | مطلوب اعتماد مدير المشروع | `/app/applet/src/components/tripEngine/UnloadingStation.tsx:1025` |
| 281 | `unloading.labels.create` | `unloading` | — تم إنشاء كائن استثناء مالي وتشغيلي رسمي في قاعدة البيانات يمنع التسوية المالية حتى الاعتماد الإداري. | `/app/applet/src/components/tripEngine/UnloadingStation.tsx:1019` |
| 282 | `unloading.labels.txt_2af283` | `unloading` | "ولا تعتبر الفرق مجرد لون في الواجهة" | `/app/applet/src/components/tripEngine/UnloadingStation.tsx:1019` |
| 283 | `unloading.labels.txt_57f705` | `unloading` | تنفيذاً للاشتراط: | `/app/applet/src/components/tripEngine/UnloadingStation.tsx:1019` |
| 284 | `unloading.labels.txt_7dbd48` | `unloading` | سجل الاستثناءات الرسمية المنشأة (Created Official Exception Entity) | `/app/applet/src/components/tripEngine/UnloadingStation.tsx:1012` |
| 285 | `unloading.labels.refresh_2` | `unloading` | ✓ حزم التحديث الذري الإلزامي للحقول الخمسة على السيرفر (Atomic Server Updates): | `/app/applet/src/components/tripEngine/UnloadingStation.tsx:964` |
| 286 | `unloading.labels.txt_1efd8d` | `unloading` | تفاوت طبيعي مبرر للشحنة | `/app/applet/src/components/tripEngine/UnloadingStation.tsx:954` |
| 287 | `unloading.labels.txt_4db372` | `unloading` | ضمن التسامح المسموح | `/app/applet/src/components/tripEngine/UnloadingStation.tsx:951` |
| 288 | `unloading.labels.txt_30adf1` | `unloading` | خارج التسامح (Exception) | `/app/applet/src/components/tripEngine/UnloadingStation.tsx:941` |
| 289 | `unloading.labels.txt_23937a` | `unloading` | نتيجة فحص المطابقة | `/app/applet/src/components/tripEngine/UnloadingStation.tsx:934` |
| 290 | `unloading.labels.txt_576fc8` | `unloading` | مدخل محطة التفريغ | `/app/applet/src/components/tripEngine/UnloadingStation.tsx:900` |
| 291 | `unloading.labels.txt_3af241` | `unloading` | محسوب مسبقاً بالمصدر | `/app/applet/src/components/tripEngine/UnloadingStation.tsx:892` |
| 292 | `unloading.labels.txt_5adc67` | `unloading` | حد التسامح المعتمد: | `/app/applet/src/components/tripEngine/UnloadingStation.tsx:878` |
| 293 | `unloading.labels.txt_9a2a40` | `unloading` | المعادلة الخادومية الصارمة: | `/app/applet/src/components/tripEngine/UnloadingStation.tsx:872` |
| 294 | `unloading.labels.refresh` | `unloading` | اعتماد التفريغ وتحديث الحقول الـ 5 | `/app/applet/src/components/tripEngine/UnloadingStation.tsx:851` |
| 295 | `unloading.status.txt_2c78c0` | `unloading` | مكتملة ومفرغة بالكامل (COMPLETED) | `/app/applet/src/components/tripEngine/UnloadingStation.tsx:846` |
| 296 | `unloading.labels.txt_70c619` | `unloading` | عجز كبير (-2500 كجم ➔ Exception) | `/app/applet/src/components/tripEngine/UnloadingStation.tsx:826` |
| 297 | `unloading.labels.txt_34f055` | `unloading` | مطابق طبيعي (-150 كجم) | `/app/applet/src/components/tripEngine/UnloadingStation.tsx:819` |
| 298 | `unloading.labels.txt_540518` | `unloading` | أمثلة أوزان سريعة للاختبار: | `/app/applet/src/components/tripEngine/UnloadingStation.tsx:812` |
| 299 | `unloading.labels.location_5` | `unloading` | الفارغ بالموقع | `/app/applet/src/components/tripEngine/UnloadingStation.tsx:787` |
| 300 | `unloading.labels.location_4` | `unloading` | القائم بالموقع | `/app/applet/src/components/tripEngine/UnloadingStation.tsx:777` |
| 301 | `unloading.labels.txt_2e57eb` | `unloading` | يحسب الخادم varianceWeight ويحدّث: unloaderId, arrivalTime, unloadTime, destNetWeight, varianceWeight. | `/app/applet/src/components/tripEngine/UnloadingStation.tsx:759` |
| 302 | `unloading.labels.txt_753b7a` | `unloading` | بدء التفريغ (ARRIVED ➔ UNLOADING) | `/app/applet/src/components/tripEngine/UnloadingStation.tsx:735` |
| 303 | `unloading.labels.location_2` | `unloading` | إسناد منصة التفريغ وتعيين هوية مستلم الموقع المعتمد. | `/app/applet/src/components/tripEngine/UnloadingStation.tsx:701` |
| 304 | `unloading.labels.txt_280c6b` | `unloading` | عند بدء التفريغ (Start Unloading) | `/app/applet/src/components/tripEngine/UnloadingStation.tsx:694` |
| 305 | `unloading.labels.confirmTruck` | `unloading` | تأكيد وصول الشاحنة (IN_TRANSIT ➔ ARRIVED) | `/app/applet/src/components/tripEngine/UnloadingStation.tsx:677` |
| 306 | `unloading.labels.txt_12f468` | `unloading` | وقت الوصول الفعلي (arrivalTime) | `/app/applet/src/components/tripEngine/UnloadingStation.tsx:648` |
| 307 | `unloading.labels.truckTime` | `unloading` | تسجيل وصول الشاحنة عند البوابة الرئيسية وتوثيق طابع الوقت الزمني. | `/app/applet/src/components/tripEngine/UnloadingStation.tsx:644` |
| 308 | `unloading.labels.txt_304aff` | `unloading` | عند الوصول (Arrival) | `/app/applet/src/components/tripEngine/UnloadingStation.tsx:637` |
| 309 | `unloading.labels.txt_2f5c04` | `unloading` | حالة دورة الحياة | `/app/applet/src/components/tripEngine/UnloadingStation.tsx:610` |
| 310 | `unloading.labels.txt_173722` | `unloading` | التسعيرة المعتمدة | `/app/applet/src/components/tripEngine/UnloadingStation.tsx:604` |
| 311 | `unloading.labels.truck_2` | `unloading` | معرف ولـوحة الشاحنة | `/app/applet/src/components/tripEngine/UnloadingStation.tsx:591` |
| 312 | `unloading.labels.txt_53c5e6` | `unloading` | . تم تفعيل مسار محطة التفريغ أدناه. | `/app/applet/src/components/tripEngine/UnloadingStation.tsx:559` |
| 313 | `unloading.labels.txt_17be32` | `unloading` | تمت المطابقة عبر: | `/app/applet/src/components/tripEngine/UnloadingStation.tsx:559` |
| 314 | `unloading.labels.tripsTrip` | `unloading` | يُحظر المضي التلقائي لمنع الخلط بين الرحلات أو الورديات المختلفة. الرجاء اختيار الرحلة المستهدفة أدناه: | `/app/applet/src/components/tripEngine/UnloadingStation.tsx:496` |
| 315 | `unloading.labels.trip_3` | `unloading` | تنبيه غامض: تم العثور على أكثر من رحلة للشاحنة | `/app/applet/src/components/tripEngine/UnloadingStation.tsx:493` |
| 316 | `unloading.labels.trip_2` | `unloading` | اشتراط صارم: لا تستخدم truckPlate وحده لتحديد الرحلة | `/app/applet/src/components/tripEngine/UnloadingStation.tsx:474` |
| 317 | `unloading.labels.txt_68980a` | `unloading` | حظر أمني رقابي (BLOCKED) | `/app/applet/src/components/tripEngine/UnloadingStation.tsx:472` |
| 318 | `unloading.labels.trip` | `unloading` | لم يتم العثور على أي رحلة مطابقة | `/app/applet/src/components/tripEngine/UnloadingStation.tsx:456` |
| 319 | `unloading.labels.txt_e24ccf` | `unloading` | 5️⃣ غير موجود (0 ➔ NOT_FOUND) | `/app/applet/src/components/tripEngine/UnloadingStation.tsx:440` |
| 320 | `unloading.labels.txt_5f0c9f` | `unloading` | 4️⃣ حظر اللوحة المنفردة (PROHIBITED) | `/app/applet/src/components/tripEngine/UnloadingStation.tsx:430` |
| 321 | `unloading.labels.truck` | `unloading` | 3️⃣ معرف الشاحنة truckId (&gt;1 ➔ AMBIGUOUS) | `/app/applet/src/components/tripEngine/UnloadingStation.tsx:419` |
| 322 | `unloading.labels.txt_714754` | `unloading` | 2️⃣ التذكرة ticketId (1 ➔ CONTINUE) | `/app/applet/src/components/tripEngine/UnloadingStation.tsx:409` |
| 323 | `unloading.labels.txt_ab913c` | `unloading` | 1️⃣ الأساسي tripSerial (1 ➔ CONTINUE) | `/app/applet/src/components/tripEngine/UnloadingStation.tsx:399` |
| 324 | `unloading.labels.txt_13d6c6` | `unloading` | سيناريوهات تجربة فورية: | `/app/applet/src/components/tripEngine/UnloadingStation.tsx:390` |
| 325 | `unloading.labels.search` | `unloading` | بحث وتحقق | `/app/applet/src/components/tripEngine/UnloadingStation.tsx:384` |
| 326 | `unloading.labels.txt_5bfe91` | `unloading` | قواعد النتائج: | `/app/applet/src/components/tripEngine/UnloadingStation.tsx:358` |
| 327 | `unloading.labels.txt_424fcb` | `unloading` | . (يُمنع استخدام truckPlate وحده). | `/app/applet/src/components/tripEngine/UnloadingStation.tsx:353` |
| 328 | `unloading.labels.txt_11fefd` | `unloading` | ➔ ثم: | `/app/applet/src/components/tripEngine/UnloadingStation.tsx:353` |
| 329 | `unloading.labels.txt_11fefd` | `unloading` | ➔ ثم: | `/app/applet/src/components/tripEngine/UnloadingStation.tsx:353` |
| 330 | `unloading.labels.txt_3aa019` | `unloading` | تسلسل البحث: الأساسي | `/app/applet/src/components/tripEngine/UnloadingStation.tsx:353` |
| 331 | `unloading.labels.searchTrip` | `unloading` | البحث والتعرف على الرحلة (Search & Identification) | `/app/applet/src/components/tripEngine/UnloadingStation.tsx:350` |
| 332 | `unloading.labels.txt_1bec3a` | `unloading` | فحص الامتثال الآلي (7 متطلبات) | `/app/applet/src/components/tripEngine/UnloadingStation.tsx:337` |
| 333 | `unloading.labels.searchCreate` | `unloading` | فحص الامتثال لقواعد البحث الخادومي، حظر اللوحة، التدرج، وإنشاء كائنات الاستثناء | `/app/applet/src/components/tripEngine/UnloadingStation.tsx:334` |
| 334 | `unloading.labels.txt_58bc1a` | `unloading` | حساب الفارق الخادومي الصارم | `/app/applet/src/components/tripEngine/UnloadingStation.tsx:320` |
| 335 | `unloading.labels.location` | `unloading` | حوكمة استلام الموقع | `/app/applet/src/components/tripEngine/UnloadingStation.tsx:317` |
| 336 | `unloading.labels.project` | `unloading` | محطة التفريغ والاستلام بموقع المشروع (Unloading Station) | `/app/applet/src/components/tripEngine/UnloadingStation.tsx:314` |
| 337 | `weighbridge.labels.confirm_4` | `weighbridge` | تأكيد واعتماد القرار الرقابي | `/app/applet/src/components/importCenter/WeighbridgeImportSection.tsx:780` |
| 338 | `weighbridge.labels.cancel` | `weighbridge` | إلغاء وتراجع (Cancel) | `/app/applet/src/components/importCenter/WeighbridgeImportSection.tsx:772` |
| 339 | `weighbridge.labels.txt_1e62d1` | `weighbridge` | ملاحظات أو مبرر الاعتماد (اختياري): | `/app/applet/src/components/importCenter/WeighbridgeImportSection.tsx:754` |
| 340 | `weighbridge.labels.txt_504ae8` | `weighbridge` | 0.00 كجم | `/app/applet/src/components/importCenter/WeighbridgeImportSection.tsx:745` |
| 341 | `weighbridge.labels.confirm_3` | `weighbridge` | تأكيد اعتماد صافي المصدر كصافي وصول (Audit Confirmation) | `/app/applet/src/components/importCenter/WeighbridgeImportSection.tsx:725` |
| 342 | `weighbridge.labels.txt_5e145b` | `weighbridge` | تم القبول الرقابي | `/app/applet/src/components/importCenter/WeighbridgeImportSection.tsx:705` |
| 343 | `weighbridge.labels.txt_2fc5ef` | `weighbridge` | قبول صافي المصدر | `/app/applet/src/components/importCenter/WeighbridgeImportSection.tsx:700` |
| 344 | `weighbridge.labels.txt_70b26a` | `weighbridge` | بدون تفريغ (تحذير) | `/app/applet/src/components/importCenter/WeighbridgeImportSection.tsx:676` |
| 345 | `weighbridge.labels.txt_65ecd8` | `weighbridge` | صافي معتمد | `/app/applet/src/components/importCenter/WeighbridgeImportSection.tsx:672` |
| 346 | `weighbridge.labels.txt_68c5e6` | `weighbridge` | — (غير متوفر) | `/app/applet/src/components/importCenter/WeighbridgeImportSection.tsx:655` |
| 347 | `weighbridge.labels.txt_6e04d1` | `weighbridge` | محسوب (gross-tare) | `/app/applet/src/components/importCenter/WeighbridgeImportSection.tsx:647` |
| 348 | `weighbridge.labels.txt_5b4968` | `weighbridge` | مفقود | `/app/applet/src/components/importCenter/WeighbridgeImportSection.tsx:638` |
| 349 | `weighbridge.labels.txt_119698` | `weighbridge` | مفقود (Missing) | `/app/applet/src/components/importCenter/WeighbridgeImportSection.tsx:635` |
| 350 | `weighbridge.labels.txt_30b047` | `weighbridge` | إجراء رقابي (Decision) | `/app/applet/src/components/importCenter/WeighbridgeImportSection.tsx:617` |
| 351 | `weighbridge.labels.txt_58cd17` | `weighbridge` | حالة التدقيق | `/app/applet/src/components/importCenter/WeighbridgeImportSection.tsx:616` |
| 352 | `weighbridge.labels.txt_2523f6` | `weighbridge` | صافي المصدر | `/app/applet/src/components/importCenter/WeighbridgeImportSection.tsx:613` |
| 353 | `weighbridge.labels.txt_46d801` | `weighbridge` | القائم (كجم) | `/app/applet/src/components/importCenter/WeighbridgeImportSection.tsx:612` |
| 354 | `weighbridge.labels.txt_a59113` | `weighbridge` | الفارغ (كجم) | `/app/applet/src/components/importCenter/WeighbridgeImportSection.tsx:611` |
| 355 | `weighbridge.labels.txt_609ec2` | `weighbridge` | فحص تطابق الأوزان، احتساب الصافي، التحقق من الحقول الإلزامية، وتطبيق قرار قبول صافي المصدر كصافي وصول. | `/app/applet/src/components/importCenter/WeighbridgeImportSection.tsx:572` |
| 356 | `weighbridge.labels.weighbridge_7` | `weighbridge` | جدول مراجعة تذاكر الميزان والأوزان (Weighbridge Review Table) | `/app/applet/src/components/importCenter/WeighbridgeImportSection.tsx:569` |
| 357 | `weighbridge.labels.trips_2` | `weighbridge` | أرقام الرحلات المنشأة: | `/app/applet/src/components/importCenter/WeighbridgeImportSection.tsx:548` |
| 358 | `weighbridge.labels.txt_600341` | `weighbridge` | المصدر التشغيلي المسجل: | `/app/applet/src/components/importCenter/WeighbridgeImportSection.tsx:545` |
| 359 | `weighbridge.labels.trips` | `weighbridge` | عدد الرحلات المعتمدة: | `/app/applet/src/components/importCenter/WeighbridgeImportSection.tsx:544` |
| 360 | `weighbridge.labels.txt_24fc12` | `weighbridge` | معرف العملية (Operation ID): | `/app/applet/src/components/importCenter/WeighbridgeImportSection.tsx:543` |
| 361 | `weighbridge.labels.weighbridge_6` | `weighbridge` | اعتماد دفعة الميزان نهائياً (COMMIT) | `/app/applet/src/components/importCenter/WeighbridgeImportSection.tsx:515` |
| 362 | `weighbridge.labels.txt_4c9996` | `weighbridge` | جاري الاعتماد وتوليد الرحلات... | `/app/applet/src/components/importCenter/WeighbridgeImportSection.tsx:510` |
| 363 | `weighbridge.labels.weighbridge_5` | `weighbridge` | جميع الصفوف مطابقة لبروفايل الميزان وجاهزة للاعتماد الفوري. | `/app/applet/src/components/importCenter/WeighbridgeImportSection.tsx:492` |
| 364 | `weighbridge.labels.txt_4ee2df` | `weighbridge` | أقر بالموافقة على اعتماد الصفوف المتضمنة تحذيرات (مثل شحنات بدون بيانات تفريغ). | `/app/applet/src/components/importCenter/WeighbridgeImportSection.tsx:487` |
| 365 | `weighbridge.labels.txt_3b5d97` | `weighbridge` | تمنع الاعتماد حتمياً | `/app/applet/src/components/importCenter/WeighbridgeImportSection.tsx:466` |
| 366 | `weighbridge.labels.txt_614e8f` | `weighbridge` | تتطلب إقراراً ولا تمنع | `/app/applet/src/components/importCenter/WeighbridgeImportSection.tsx:460` |
| 367 | `weighbridge.labels.txt_2eacb2` | `weighbridge` | صفوف صالحة (Valid) | `/app/applet/src/components/importCenter/WeighbridgeImportSection.tsx:453` |
| 368 | `weighbridge.labels.weighbridge_4` | `weighbridge` | دفعة الميزان في مرحلة المراجعة (Review Stage - Human Gate) | `/app/applet/src/components/importCenter/WeighbridgeImportSection.tsx:420` |
| 369 | `weighbridge.labels.txt_70030c` | `weighbridge` | المصدر التشغيلي: WEIGHBRIDGE | `/app/applet/src/components/importCenter/WeighbridgeImportSection.tsx:417` |
| 370 | `weighbridge.status.success_2` | `weighbridge` | تم تنفيذ الإجراء الرقابي بنجاح: | `/app/applet/src/components/importCenter/WeighbridgeImportSection.tsx:394` |
| 371 | `weighbridge.labels.importWeighbridge_3` | `weighbridge` | تنفيذ مسار استيراد الميزان وصولاً للمراجعة | `/app/applet/src/components/importCenter/WeighbridgeImportSection.tsx:381` |
| 372 | `weighbridge.labels.txt_5ace0a` | `weighbridge` | جاري معالجة المسار الموحد (10 مراحل)... | `/app/applet/src/components/importCenter/WeighbridgeImportSection.tsx:376` |
| 373 | `weighbridge.labels.txt_72ad0e` | `weighbridge` | المعالجة تتوقف إلزامياً عند مرحلة المراجعة (REVIEW) ولا تُنشئ رحلات أو تكتب في قاعدة البيانات إلا بعد الاعتماد الصريح (COMMIT). | `/app/applet/src/components/importCenter/WeighbridgeImportSection.tsx:363` |
| 374 | `weighbridge.labels.weighbridge_3` | `weighbridge` | محتوى ملف الميزان (CSV Text / Raw Input): | `/app/applet/src/components/importCenter/WeighbridgeImportSection.tsx:346` |
| 375 | `weighbridge.labels.txt_63b3fb` | `weighbridge` | نموذج يتضمن مخالفات وأخطاء ميزان | `/app/applet/src/components/importCenter/WeighbridgeImportSection.tsx:336` |
| 376 | `weighbridge.labels.txt_574ba6` | `weighbridge` | نموذج تذاكر ميزان صالحة (4 صفوف) | `/app/applet/src/components/importCenter/WeighbridgeImportSection.tsx:325` |
| 377 | `weighbridge.labels.importWeighbridge_2` | `weighbridge` | يدعم مسار الاستيراد الموحد قراءة بيانات الميزان من ملفات CSV وExcel وتكامل Google Drive وSheets. | `/app/applet/src/components/importCenter/WeighbridgeImportSection.tsx:310` |
| 378 | `weighbridge.labels.weighbridge_2` | `weighbridge` | مصدر وتنسيق إدخال بيانات الميزان | `/app/applet/src/components/importCenter/WeighbridgeImportSection.tsx:307` |
| 379 | `weighbridge.labels.confirm` | `weighbridge` | إجراء رقابي صريح بتأكيد بشري ومسار تدقيق مستقل. يحدد destNetWeight ويحسب الفرق الحقيقي = 0 كجم. | `/app/applet/src/components/importCenter/WeighbridgeImportSection.tsx:294` |
| 380 | `weighbridge.labels.txt_355854` | `weighbridge` | اعتماد صافي المصدر كصافي وصول: | `/app/applet/src/components/importCenter/WeighbridgeImportSection.tsx:292` |
| 381 | `weighbridge.labels.txt_3524f5` | `weighbridge` | غياب بيانات التفريغ (Non-blocking): | `/app/applet/src/components/importCenter/WeighbridgeImportSection.tsx:282` |
| 382 | `weighbridge.labels.weighbridge` | `weighbridge` | الحقول الإلزامية لتذكرة الميزان: | `/app/applet/src/components/importCenter/WeighbridgeImportSection.tsx:272` |
| 383 | `weighbridge.labels.txt_150ad3` | `weighbridge` | إعادة ضبط Idempotency | `/app/applet/src/components/importCenter/WeighbridgeImportSection.tsx:262` |
| 384 | `weighbridge.labels.import` | `weighbridge` | بروفايل متخصص لاستيراد تذاكر وسجلات ميزان البسكول عبر مسار الاستيراد الموحد (Unified Pipeline). يفصل بين المصدر التشغيلي (WEIGHBRIDGE) ومصدر الإدخال (Excel/CSV/Sheets/Drive). | `/app/applet/src/components/importCenter/WeighbridgeImportSection.tsx:248` |
| 385 | `weighbridge.labels.importWeighbridge` | `weighbridge` | استيراد بيانات الميزان (Weighbridge Import) | `/app/applet/src/components/importCenter/WeighbridgeImportSection.tsx:238` |
| 386 | `weighbridge.labels.txt_78dd06` | `weighbridge` | إعادة الفحص الآن | `/app/applet/src/components/tripEngine/WeightEngineView.tsx:920` |
| 387 | `weighbridge.labels.txt_407887` | `weighbridge` | فحص دوال الحساب، معايير التحقق، حظر استبدال المفقود بالصفر، وتقييم التفاوت (NORMAL / WARNING / EXCEPTION) | `/app/applet/src/components/tripEngine/WeightEngineView.tsx:910` |
| 388 | `weighbridge.labels.txt_3142f6` | `weighbridge` | تقرير التحقق البرمجي لاشتراطات Weight Engine (13 فحصاً آلياً) | `/app/applet/src/components/tripEngine/WeightEngineView.tsx:907` |
| 389 | `weighbridge.labels.save` | `weighbridge` | حفظ القاعدة في محرك الأوزان | `/app/applet/src/components/tripEngine/WeightEngineView.tsx:856` |
| 390 | `weighbridge.labels.txt_405131` | `weighbridge` | تفاوت نسبة (%) | `/app/applet/src/components/tripEngine/WeightEngineView.tsx:839` |
| 391 | `weighbridge.labels.txt_579085` | `weighbridge` | تفاوت مطلق (كجم) | `/app/applet/src/components/tripEngine/WeightEngineView.tsx:827` |
| 392 | `weighbridge.labels.txt_2456f5` | `weighbridge` | حالة القاعدة (status) | `/app/applet/src/components/tripEngine/WeightEngineView.tsx:804` |
| 393 | `weighbridge.labels.txt_5c97fe` | `weighbridge` | percentage (نسبة فقط) | `/app/applet/src/components/tripEngine/WeightEngineView.tsx:799` |
| 394 | `weighbridge.labels.txt_722bae` | `weighbridge` | absolute (مطلق فقط) | `/app/applet/src/components/tripEngine/WeightEngineView.tsx:798` |
| 395 | `weighbridge.labels.txt_2161ff` | `weighbridge` | both (مطلق ونسبة معاً) | `/app/applet/src/components/tripEngine/WeightEngineView.tsx:797` |
| 396 | `weighbridge.labels.txt_4dce1b` | `weighbridge` | نوع التفاوت المسموح | `/app/applet/src/components/tripEngine/WeightEngineView.tsx:791` |
| 397 | `weighbridge.labels.material` | `weighbridge` | معرف المادة (materialId) | `/app/applet/src/components/tripEngine/WeightEngineView.tsx:781` |
| 398 | `weighbridge.labels.addRefresh` | `weighbridge` | إضافة أو تحديث قاعدة تفاوت (Tolerance Rule) | `/app/applet/src/components/tripEngine/WeightEngineView.tsx:766` |
| 399 | `weighbridge.labels.txt_69b595` | `weighbridge` | المبلغ النهائي المستحق: | `/app/applet/src/components/tripEngine/WeightEngineView.tsx:730` |
| 400 | `weighbridge.labels.txt_47e373` | `weighbridge` | معادلة الاحتساب المالية: | `/app/applet/src/components/tripEngine/WeightEngineView.tsx:723` |
| 401 | `weighbridge.labels.txt_4851db` | `weighbridge` | net مفقود (➔ null قطعي دون استبداله بـ 0) | `/app/applet/src/components/tripEngine/WeightEngineView.tsx:713` |
| 402 | `weighbridge.labels.txt_7a0944` | `weighbridge` | net = 0 (مرفوض ➔ null) | `/app/applet/src/components/tripEngine/WeightEngineView.tsx:706` |
| 403 | `weighbridge.labels.txt_6e06f6` | `weighbridge` | 37,400 كجم (37.4 طن) | `/app/applet/src/components/tripEngine/WeightEngineView.tsx:699` |
| 404 | `weighbridge.labels.txt_17ffad` | `weighbridge` | أمثلة سريعة: | `/app/applet/src/components/tripEngine/WeightEngineView.tsx:693` |
| 405 | `weighbridge.labels.pricing` | `weighbridge` | اختر قاعدة التسعير (Master Pricing Rule) | `/app/applet/src/components/tripEngine/WeightEngineView.tsx:662` |
| 406 | `weighbridge.labels.txt_35a0be` | `weighbridge` | احتساب التسوية المالية بدقة بالطن أو المشوار مع اشتراط net &gt; 0، وإرجاع null عند فقدان البيانات | `/app/applet/src/components/tripEngine/WeightEngineView.tsx:647` |
| 407 | `weighbridge.labels.details` | `weighbridge` | تفاصيل التقييم الخادومي: | `/app/applet/src/components/tripEngine/WeightEngineView.tsx:614` |
| 408 | `weighbridge.labels.txt_26b92a` | `weighbridge` | تجربة مخرج: EXCEPTION (-750 كجم / تجاوز الحد) | `/app/applet/src/components/tripEngine/WeightEngineView.tsx:600` |
| 409 | `weighbridge.labels.txt_1247cf` | `weighbridge` | تجربة مخرج: WARNING (-380 كجم / &gt;75%) | `/app/applet/src/components/tripEngine/WeightEngineView.tsx:591` |
| 410 | `weighbridge.labels.txt_60b8a5` | `weighbridge` | تجربة مخرج: NORMAL (-120 كجم) | `/app/applet/src/components/tripEngine/WeightEngineView.tsx:582` |
| 411 | `weighbridge.labels.txt_57ac4b` | `weighbridge` | اختبار المخرجات الثلاثة مباشرة: | `/app/applet/src/components/tripEngine/WeightEngineView.tsx:574` |
| 412 | `weighbridge.labels.download_2` | `weighbridge` | صافي التحميل (loadedNet) | `/app/applet/src/components/tripEngine/WeightEngineView.tsx:561` |
| 413 | `weighbridge.labels.txt_709573` | `weighbridge` | الفارق المراد فحصه (variance) | `/app/applet/src/components/tripEngine/WeightEngineView.tsx:550` |
| 414 | `weighbridge.labels.txt_d894c3` | `weighbridge` | تفاوت نسبة (percentageTolerance) | `/app/applet/src/components/tripEngine/WeightEngineView.tsx:537` |
| 415 | `weighbridge.labels.txt_1644f0` | `weighbridge` | تفاوت مطلق (absoluteTolerance) | `/app/applet/src/components/tripEngine/WeightEngineView.tsx:523` |
| 416 | `weighbridge.labels.txt_5c97fe` | `weighbridge` | percentage (نسبة فقط) | `/app/applet/src/components/tripEngine/WeightEngineView.tsx:517` |
| 417 | `weighbridge.labels.txt_722bae` | `weighbridge` | absolute (مطلق فقط) | `/app/applet/src/components/tripEngine/WeightEngineView.tsx:516` |
| 418 | `weighbridge.labels.txt_2161ff` | `weighbridge` | both (مطلق ونسبة معاً) | `/app/applet/src/components/tripEngine/WeightEngineView.tsx:515` |
| 419 | `weighbridge.labels.txt_14234f` | `weighbridge` | نوع التفاوت (Tolerance Mode) | `/app/applet/src/components/tripEngine/WeightEngineView.tsx:509` |
| 420 | `weighbridge.labels.txt_641620` | `weighbridge` | المخرج (Output): | `/app/applet/src/components/tripEngine/WeightEngineView.tsx:493` |
| 421 | `weighbridge.labels.txt_cd2e11` | `weighbridge` | دعم أنواع التفاوت: absolute \| percentage \| or both ➔ وإخراج: NORMAL \| WARNING \| EXCEPTION | `/app/applet/src/components/tripEngine/WeightEngineView.tsx:486` |
| 422 | `weighbridge.labels.txt_265f32` | `weighbridge` | استلام مفقود (➔ null) | `/app/applet/src/components/tripEngine/WeightEngineView.tsx:438` |
| 423 | `weighbridge.labels.txt_aced6f` | `weighbridge` | loadedNet = 0 (مرفوض) | `/app/applet/src/components/tripEngine/WeightEngineView.tsx:431` |
| 424 | `weighbridge.labels.txt_577d5a` | `weighbridge` | عجز كبير (-2500 كجم) | `/app/applet/src/components/tripEngine/WeightEngineView.tsx:424` |
| 425 | `weighbridge.labels.txt_222b14` | `weighbridge` | طبيعي (-150 كجم) | `/app/applet/src/components/tripEngine/WeightEngineView.tsx:417` |
| 426 | `weighbridge.labels.txt_17ffad` | `weighbridge` | أمثلة سريعة: | `/app/applet/src/components/tripEngine/WeightEngineView.tsx:411` |
| 427 | `weighbridge.labels.location` | `weighbridge` | صافي الاستلام بالموقع (receivedNet) كجم | `/app/applet/src/components/tripEngine/WeightEngineView.tsx:397` |
| 428 | `weighbridge.labels.download` | `weighbridge` | صافي التحميل بالمصدر (loadedNet) كجم | `/app/applet/src/components/tripEngine/WeightEngineView.tsx:385` |
| 429 | `weighbridge.labels.txt_446bca` | `weighbridge` | حساب الفارق واشتراط net &gt; 0 و received &gt; 0 | `/app/applet/src/components/tripEngine/WeightEngineView.tsx:371` |
| 430 | `weighbridge.labels.txt_780026` | `weighbridge` | النتيجة المُرجعة (netWeight): | `/app/applet/src/components/tripEngine/WeightEngineView.tsx:342` |
| 431 | `weighbridge.labels.txt_241697` | `weighbridge` | tare مفقود (➔ null) | `/app/applet/src/components/tripEngine/WeightEngineView.tsx:333` |
| 432 | `weighbridge.labels.txt_6ff41d` | `weighbridge` | gross &lt; tare (مرفوض) | `/app/applet/src/components/tripEngine/WeightEngineView.tsx:326` |
| 433 | `weighbridge.labels.txt_487f8f` | `weighbridge` | tare = 0 (مرفوض) | `/app/applet/src/components/tripEngine/WeightEngineView.tsx:319` |
| 434 | `weighbridge.labels.txt_69dab8` | `weighbridge` | صحيح (44,700 - 14,200) | `/app/applet/src/components/tripEngine/WeightEngineView.tsx:312` |
| 435 | `weighbridge.labels.txt_17ffad` | `weighbridge` | أمثلة سريعة: | `/app/applet/src/components/tripEngine/WeightEngineView.tsx:306` |
| 436 | `weighbridge.labels.txt_17aab5` | `weighbridge` | لا تستخدم 0 كبديل عن missing data ➔ النتيجة null | `/app/applet/src/components/tripEngine/WeightEngineView.tsx:245` |
| 437 | `weighbridge.labels.txt_18b9e9` | `weighbridge` | قواعد التحقق الصارمة (Strict Validation): | `/app/applet/src/components/tripEngine/WeightEngineView.tsx:237` |
| 438 | `weighbridge.labels.txt_53ce46` | `weighbridge` | قواعد التفاوت (Tolerance Rules) | `/app/applet/src/components/tripEngine/WeightEngineView.tsx:213` |
| 439 | `weighbridge.labels.txt_7fffbf` | `weighbridge` | دوال المحرك الـ 4 (Functions Sandbox) | `/app/applet/src/components/tripEngine/WeightEngineView.tsx:201` |
| 440 | `weighbridge.labels.txt_44da4c` | `weighbridge` | وحدة مستقلة تتولى حصرياً العمليات الحسابية للأوزان، فروقات التحميل، تقييم التفاوت (مطلق / نسبة / كلاهما) مع مخرجات الحالات (NORMAL / WARNING / EXCEPTION)، واحتساب التسويات المالية وفق قواعد التحقق الصارمة. | `/app/applet/src/components/tripEngine/WeightEngineView.tsx:185` |
| 441 | `weighbridge.labels.txt_32f0a0` | `weighbridge` | حظر الصفر البديل (null قطعي) | `/app/applet/src/components/tripEngine/WeightEngineView.tsx:181` |
| 442 | `weighbridge.labels.txt_518cd3` | `weighbridge` | محرك حسابي خادومي | `/app/applet/src/components/tripEngine/WeightEngineView.tsx:178` |
| 443 | `weighbridge.labels.txt_2837b3` | `weighbridge` | محرك الأوزان المستقل (Standalone Weight Engine) | `/app/applet/src/components/tripEngine/WeightEngineView.tsx:175` |
| 444 | `legacyMigration.labels.edit_4` | `legacyMigration` | محمي بنسبة 100% (لم ولن يتم تعديل أي بايت) | `/app/applet/src/components/migration/LegacyMigrationView.tsx:1057` |
| 445 | `legacyMigration.labels.txt_3a366d` | `legacyMigration` | حماية ملف Google Sheet الأصلي: | `/app/applet/src/components/migration/LegacyMigrationView.tsx:1054` |
| 446 | `legacyMigration.labels.tripsPricing` | `legacyMigration` | الرحلات ذات التسعير غير المحدد (LEGACY_UNRESOLVED): | `/app/applet/src/components/migration/LegacyMigrationView.tsx:1050` |
| 447 | `legacyMigration.labels.txt_34d624` | `legacyMigration` | السجلات المرفوضة (تكرار أو تعارض أوزان) المستبعدة: | `/app/applet/src/components/migration/LegacyMigrationView.tsx:1046` |
| 448 | `legacyMigration.labels.txt_73bda7` | `legacyMigration` | إجمالي السجلات السليمة المراد ترحيلها: | `/app/applet/src/components/migration/LegacyMigrationView.tsx:1042` |
| 449 | `legacyMigration.labels.txt_7da94c` | `legacyMigration` | اعتماد المطابقة | `/app/applet/src/components/migration/LegacyMigrationView.tsx:989` |
| 450 | `legacyMigration.labels.txt_7c3a05` | `legacyMigration` | الكيانات المقترحة من سجل البيانات المعتمدة: | `/app/applet/src/components/migration/LegacyMigrationView.tsx:974` |
| 451 | `legacyMigration.labels.txt_26a591` | `legacyMigration` | القيمة الواردة في شيت قوقل الأصلي: | `/app/applet/src/components/migration/LegacyMigrationView.tsx:969` |
| 452 | `legacyMigration.labels.txt_29633c` | `legacyMigration` | مراجعة المطابقة المقترحة (Candidate Review) | `/app/applet/src/components/migration/LegacyMigrationView.tsx:954` |
| 453 | `legacyMigration.labels.txt_a00b26` | `legacyMigration` | جاهز للترحيل | `/app/applet/src/components/migration/LegacyMigrationView.tsx:906` |
| 454 | `legacyMigration.labels.txt_52920f` | `legacyMigration` | LEGACY_UNRESOLVED (غير محدد) | `/app/applet/src/components/migration/LegacyMigrationView.tsx:893` |
| 455 | `legacyMigration.labels.txt_59cfca` | `legacyMigration` | توجيه: | `/app/applet/src/components/migration/LegacyMigrationView.tsx:887` |
| 456 | `legacyMigration.labels.txt_1d9cbd` | `legacyMigration` | لوحة جديدة | `/app/applet/src/components/migration/LegacyMigrationView.tsx:830` |
| 457 | `legacyMigration.labels.txt_686b44` | `legacyMigration` | غير معتمد | `/app/applet/src/components/migration/LegacyMigrationView.tsx:808` |
| 458 | `legacyMigration.labels.txt_372a1f` | `legacyMigration` | غير مقيد (يتطلب اعتماد ككيان جديد) | `/app/applet/src/components/migration/LegacyMigrationView.tsx:782` |
| 459 | `legacyMigration.labels.edit_3` | `legacyMigration` | مطابقة مقترحة - انقر للاعتماد أو التعديل | `/app/applet/src/components/migration/LegacyMigrationView.tsx:775` |
| 460 | `legacyMigration.labels.txt_51f3d3` | `legacyMigration` | تذكرة مكررة | `/app/applet/src/components/migration/LegacyMigrationView.tsx:753` |
| 461 | `legacyMigration.labels.txt_57c825` | `legacyMigration` | لا توجد سجلات مطابقة لهذا الفلتر أو البحث. | `/app/applet/src/components/migration/LegacyMigrationView.tsx:725` |
| 462 | `legacyMigration.labels.status` | `legacyMigration` | الحالة والتحقق | `/app/applet/src/components/migration/LegacyMigrationView.tsx:717` |
| 463 | `legacyMigration.labels.pricing_3` | `legacyMigration` | التسعير (Pricing Resolution) | `/app/applet/src/components/migration/LegacyMigrationView.tsx:716` |
| 464 | `legacyMigration.labels.txt_149d03` | `legacyMigration` | الأوزان (قائم/فارغ/صافي) | `/app/applet/src/components/migration/LegacyMigrationView.tsx:715` |
| 465 | `legacyMigration.labels.driver_2` | `legacyMigration` | السائق (Driver Matching) | `/app/applet/src/components/migration/LegacyMigrationView.tsx:714` |
| 466 | `legacyMigration.labels.truck_2` | `legacyMigration` | الشاحنة (Truck Matching) | `/app/applet/src/components/migration/LegacyMigrationView.tsx:713` |
| 467 | `legacyMigration.labels.material_2` | `legacyMigration` | المادة (Material Matching) | `/app/applet/src/components/migration/LegacyMigrationView.tsx:712` |
| 468 | `legacyMigration.labels.carrier_2` | `legacyMigration` | الناقل (Carrier Matching) | `/app/applet/src/components/migration/LegacyMigrationView.tsx:711` |
| 469 | `legacyMigration.status.failed_2` | `legacyMigration` | فشل الاختبار | `/app/applet/src/components/migration/LegacyMigrationView.tsx:692` |
| 470 | `legacyMigration.status.success_3` | `legacyMigration` | اجتاز بنجاح | `/app/applet/src/components/migration/LegacyMigrationView.tsx:687` |
| 471 | `legacyMigration.status.success_2` | `legacyMigration` | نسبة النجاح | `/app/applet/src/components/migration/LegacyMigrationView.tsx:653` |
| 472 | `legacyMigration.labels.txt_55a807` | `legacyMigration` | فاشلة (Failed) | `/app/applet/src/components/migration/LegacyMigrationView.tsx:649` |
| 473 | `legacyMigration.labels.txt_327227` | `legacyMigration` | ناجحة (Passed) | `/app/applet/src/components/migration/LegacyMigrationView.tsx:645` |
| 474 | `legacyMigration.labels.txt_50fd44` | `legacyMigration` | إجمالي الاختبارات | `/app/applet/src/components/migration/LegacyMigrationView.tsx:641` |
| 475 | `legacyMigration.labels.pricing_2` | `legacyMigration` | التحقق الفوري من 50 اختباراً دقيقاً (LM-01 إلى LM-50) تغطي كافة مراحل التحويل والمطابقة والتسعير والأمان. | `/app/applet/src/components/migration/LegacyMigrationView.tsx:624` |
| 476 | `legacyMigration.labels.txt_7d9ac6` | `legacyMigration` | تسعير غير محدد (LEGACY_UNRESOLVED) | `/app/applet/src/components/migration/LegacyMigrationView.tsx:540` |
| 477 | `legacyMigration.labels.txt_634453` | `legacyMigration` | مطابقات مقترحة للمراجعة | `/app/applet/src/components/migration/LegacyMigrationView.tsx:528` |
| 478 | `legacyMigration.labels.txt_115a70` | `legacyMigration` | تفصيل الكيانات المحتملة/غير المطابقة (Unmatched / Candidates): | `/app/applet/src/components/migration/LegacyMigrationView.tsx:480` |
| 479 | `legacyMigration.labels.txt_279c98` | `legacyMigration` | تفصيل الكيانات المطابقة تماماً (Matched): | `/app/applet/src/components/migration/LegacyMigrationView.tsx:458` |
| 480 | `legacyMigration.labels.txt_1b99af` | `legacyMigration` | تعارضات حسابية | `/app/applet/src/components/migration/LegacyMigrationView.tsx:450` |
| 481 | `legacyMigration.labels.txt_f7eb0f` | `legacyMigration` | تذاكر مكررة | `/app/applet/src/components/migration/LegacyMigrationView.tsx:441` |
| 482 | `legacyMigration.labels.txt_3c53d3` | `legacyMigration` | مقترحات للمراجعة | `/app/applet/src/components/migration/LegacyMigrationView.tsx:420` |
| 483 | `legacyMigration.labels.txt_6aac69` | `legacyMigration` | مطابقات تامة (ناقل/مادة/شاحنة/سائق) | `/app/applet/src/components/migration/LegacyMigrationView.tsx:409` |
| 484 | `legacyMigration.labels.txt_123549` | `legacyMigration` | بها أخطاء مانعة | `/app/applet/src/components/migration/LegacyMigrationView.tsx:399` |
| 485 | `legacyMigration.labels.txt_505cc5` | `legacyMigration` | جاهزة للترحيل | `/app/applet/src/components/migration/LegacyMigrationView.tsx:390` |
| 486 | `legacyMigration.labels.txt_37ac91` | `legacyMigration` | إجمالي الأسطر | `/app/applet/src/components/migration/LegacyMigrationView.tsx:381` |
| 487 | `legacyMigration.labels.txt_117a46` | `legacyMigration` | المصدر غير معدل | `/app/applet/src/components/migration/LegacyMigrationView.tsx:367` |
| 488 | `legacyMigration.labels.txt_11840b` | `legacyMigration` | مؤشرات التحقق والمطابقة الثنائية (Pre-Commit Analysis KPIs) | `/app/applet/src/components/migration/LegacyMigrationView.tsx:358` |
| 489 | `legacyMigration.labels.txt_22d9d7` | `legacyMigration` | تقرير التحليل والمعاينة (Migration Report) | `/app/applet/src/components/migration/LegacyMigrationView.tsx:351` |
| 490 | `legacyMigration.labels.txt_2d3767` | `legacyMigration` | إجراء التحليل والمعاينة فقط (Generate Preview) | `/app/applet/src/components/migration/LegacyMigrationView.tsx:306` |
| 491 | `legacyMigration.labels.txt_1bdb9e` | `legacyMigration` | يتم تحويل كافة الحقول إلى هيكلية الكيانات الحديثة (Modern FSM Trip Entity) مع مطابقة الناقل، المادة، الشاحنة، والسائق. | `/app/applet/src/components/migration/LegacyMigrationView.tsx:294` |
| 492 | `legacyMigration.labels.txt_5f49c9` | `legacyMigration` | أعمدة الشيت القديم الـ 20 المشمولة بالتحويل (20-Column Schema Mapping) | `/app/applet/src/components/migration/LegacyMigrationView.tsx:291` |
| 493 | `legacyMigration.labels.txt_5c2cd4` | `legacyMigration` | معتمد من Admin | `/app/applet/src/components/migration/LegacyMigrationView.tsx:280` |
| 494 | `legacyMigration.labels.txt_42479d` | `legacyMigration` | إلى النظام وقاعدة البيانات، مع تسجيل قيد التدقيق | `/app/applet/src/components/migration/LegacyMigrationView.tsx:275` |
| 495 | `legacyMigration.status.success` | `legacyMigration` | بنجاح وترحيل | `/app/applet/src/components/migration/LegacyMigrationView.tsx:275` |
| 496 | `legacyMigration.labels.create` | `legacyMigration` | تم إنشاء دفعة الترحيل | `/app/applet/src/components/migration/LegacyMigrationView.tsx:275` |
| 497 | `legacyMigration.status.txt_1d98ed` | `legacyMigration` | تم اعتماد وترحيل البيانات بنجاح! | `/app/applet/src/components/migration/LegacyMigrationView.tsx:273` |
| 498 | `legacyMigration.labels.edit_2` | `legacyMigration` | محمي من التعديل (Read-Only) | `/app/applet/src/components/migration/LegacyMigrationView.tsx:260` |
| 499 | `legacyMigration.labels.confirm` | `legacyMigration` | تتيح الأداة سحب وتحويل الـ 20 عموداً التشغيلية مع فحص ومطابقة الكيانات الأساسية (Master Data Matching)، حماية السجلات القائمة من الازدواجية، ومعاينة تقرير الترحيل بالكامل، مع منع اعتماد أي ترحيل إلا بعد تأكيد صريح من مدير النظام (Admin Commit). | `/app/applet/src/components/migration/LegacyMigrationView.tsx:250` |
| 500 | `legacyMigration.labels.edit` | `legacyMigration` | 🔒 ممنوع تعديل المصدر (Read-Only Guaranteed) | `/app/applet/src/components/migration/LegacyMigrationView.tsx:240` |

## 4. Architectural Safety & Invariant Guarantees

- **Zero Non-SAFE Transformations:** 100% of applied replacements were classified as `SAFE`. Zero `LOW_RISK`, `HIGH_RISK`, `REVIEW_ONLY`, or `SKIP` candidates were applied.
- **Zero Business Logic Modification:** 0 pricing logic changes, 0 report logic changes, 0 import logic changes, 0 security changes, 0 Firestore changes, 0 API changes, 0 database schema changes, 0 state-machine changes, 0 offline logic changes.
- **Zero CSS Directional Alterations:** No Tailwind directional classes (e.g. `mr-`, `pl-`, `left-`, `right-`, `dir="rtl"`, `dir="ltr"`) were altered.
- **React Hook Integrity:** All components import `useI18n` exactly once, and invoke `const { t } = useI18n()` strictly at the top level of the component body.
- **Protected Business Identifiers Preserved:** Zero business tokens (`projectId`, `ticketId`, `truckNo`, `carrierId`, `status`, etc.) or machine-readable values (`COMPLETED`, `PENDING`, `ACTIVE`, etc.) were transformed.
- **Arabic Production Behavior Preserved:** All applied keys resolve to identical Arabic strings registered in the Arabic locale dictionary.
- **Idempotency Verified:** Re-running the scanner confirms 0 pending SAFE candidates for migrated nodes, with zero duplicate translations.

## 5. Next Steps

BLOCK 47 SAFE batch migration is complete. All regression tests green and changes verified.
