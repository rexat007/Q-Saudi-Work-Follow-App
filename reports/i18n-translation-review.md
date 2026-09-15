# Professional Translation Human Review Queue (BLOCK 43)

**Generated At:** 2026-09-15T08:21:04.465Z
**Total Catalog Entries Processed:** 12853
**Total Proposals Requiring Human Review:** 12847 (100.0%)

## Review Instructions for Translators & Enterprise Auditors

1. **Arabic Canonical Invariance:** The Arabic text is the canonical source and must never be altered.
2. **Parameter Preservation:** Dynamic variables like `{count}` or `{ticketNo}` must appear verbatim with exact casing and brackets.
3. **Protected Identifiers:** Database fields (e.g. `ticketId`, `truckNo`) and currency codes (`SAR`, `KG`, `TON`) must never be translated as data identifiers.
4. **Operational Disambiguation:** Terms like "تحميل" must translate to operational "Loading" in station contexts, not "Download".

## Review Summary by Risk Reason

| Review Reason | Queue Count | Architectural Description |
| :--- | :--- | :--- |
| `SEMANTIC_CONFLICT` | **1603** | Identical source texts with different operational meanings quarantined to prevent UI/business conflation |
| `DOMAIN_TERM` | **0** | Domain-specific terminology requiring operational verification by enterprise domain leads |
| `INTERPOLATION_RISK` | **8** | Complex dynamic placeholders or parameter sequences requiring syntax verification |
| `PLURALIZATION_RISK` | **133** | Quantities requiring 6 Arabic plural forms aligned with target language plural rules |
| `REPORT_EXPORT_RISK` | **3384** | Report column or export header requiring separation of internal data key from display label |
| `BUSINESS_DATA_RISK` | **748** | Formulas, rates, or business calculations requiring strict identifier preservation |
| `LOW_CONFIDENCE` | **6971** | Ambiguous or composite phrases generated with low statistical confidence |
| `DIRECTIONAL_RISK` | **0** | Mixed-direction content (Arabic and Latin/numbers) needing directional inspection |
| `VALIDATION_FAILURE` | **0** | Proposal encountered parameter mismatch, missing tokens, or structural defects |
| `OTHER` | **0** | General review requirements flagged by migration pipeline |

### 1. Reason: `SEMANTIC_CONFLICT` (1603 items)

> Identical source texts with different operational meanings quarantined to prevent UI/business conflation

| Key | Arabic Source | Proposed English | Proposed Urdu | Recommendation & Context |
| :--- | :--- | :--- | :--- | :--- |
| `authentication.labels.txt_1567b8` | "غير محدد" | "غير محدد" | "غير محدد" | Verify context 'literal'. Do NOT merge with other instances of 'غير محدد'. |
| `authentication.labels.txt_1f05e4` | "البريد الإلكتروني:" | "البريد الإلكتروني:" | "البريد الإلكتروني:" | Verify context 'literal'. Do NOT merge with other instances of 'البريد الإلكتروني:'. |
| `authentication.labels.txt_2725af` | "مدير النظام" | "مدير النظام" | "مدير النظام" | Verify context 'literal'. Do NOT merge with other instances of 'مدير النظام'. |
| `authentication.labels.txt_65988f` | "المهندس طارق بن خالد الشمري" | "المهندس طارق بن خالد الشمري" | "المهندس طارق بن خالد الشمري" | Verify context 'prop_displayName'. Do NOT merge with other instances of 'المهندس طارق بن خالد الشمري'. |
| `authentication.labels.txt_6c67d4` | "مستخدم جديد" | "مستخدم جديد" | "مستخدم جديد" | Verify context 'literal'. Do NOT merge with other instances of 'مستخدم جديد'. |
| `authentication.labels.txt_b1a849` | "تسجيل الخروج" | "تسجيل الخروج" | "تسجيل الخروج" | Verify context 'literal'. Do NOT merge with other instances of 'تسجيل الخروج'. |
| `carriers.actions.cancel` | "إلغاء" | "Cancel Trip" | "ٹرپ منسوخ کریں" | Verify context 'jsx_text'. Do NOT merge with other instances of 'إلغاء'. |
| `carriers.labels.add` | "إضافة ناقل جديد" | "Add ناقل جديد" | "شامل کریں ناقل جديد" | Verify context 'jsx_text'. Do NOT merge with other instances of 'إضافة ناقل جديد'. |
| `carriers.labels.carrier_2` | "تسجيل الناقل" | "تسجيل Carrier" | "تسجيل کیریئر" | Verify context 'literal'. Do NOT merge with other instances of 'تسجيل الناقل'. |
| `carriers.labels.carrier_3` | "الناقل غير موجود" | "Carrier غير موجود" | "کیریئر غير موجود" | Verify context 'literal'. Do NOT merge with other instances of 'الناقل غير موجود'. |
| `carriers.labels.save` | "حفظ التعديلات" | "Save الEditات" | "محفوظ کریں الترمیم کریںات" | Verify context 'literal'. Do NOT merge with other instances of 'حفظ التعديلات'. |
| `carriers.labels.status` | "الحالة التشغيلية (status)" | "Status التشغيلية (status)" | "حالت التشغيلية (status)" | Verify context 'jsx_text'. Do NOT merge with other instances of 'الحالة التشغيلية (status)'. |
| `carriers.labels.txt_1f05e4` | "البريد الإلكتروني" | "البريد الإلكتروني" | "البريد الإلكتروني" | Verify context 'jsx_text'. Do NOT merge with other instances of 'البريد الإلكتروني'. |
| `carriers.labels.txt_252d6d` | "الجوال:" | "الجوال:" | "الجوال:" | Verify context 'jsx_text'. Do NOT merge with other instances of 'الجوال:'. |
| `carriers.labels.txt_2f889d` | "السجل التجاري:" | "السجل التجاري:" | "السجل التجاري:" | Verify context 'jsx_text'. Do NOT merge with other instances of 'السجل التجاري:'. |
| `carriers.labels.txt_2f9f86` | "مسؤول العمليات" | "مسؤول Operations" | "مسؤول آپریشنز" | Verify context 'literal'. Do NOT merge with other instances of 'مسؤول العمليات'. |
| `carriers.labels.txt_38b1a6` | "معطّل (DISABLED)" | "معطّل (DISABLED)" | "معطّل (DISABLED)" | Verify context 'jsx_text'. Do NOT merge with other instances of 'معطّل (DISABLED)'. |
| `carriers.labels.txt_5b459d` | "معطّل" | "معطّل" | "معطّل" | Verify context 'jsx_text'. Do NOT merge with other instances of 'معطّل'. |
| `carriers.labels.txt_7f2994` | "المسؤول:" | "المسؤول:" | "المسؤول:" | Verify context 'jsx_text'. Do NOT merge with other instances of 'المسؤول:'. |
| `carriers.status.active` | "نشط (ACTIVE)" | "Active (ACTIVE)" | "فعال (ACTIVE)" | Verify context 'jsx_text'. Do NOT merge with other instances of 'نشط (ACTIVE)'. |
| `carriers.status.active_2` | "نشط" | "Active" | "فعال" | Verify context 'jsx_text'. Do NOT merge with other instances of 'نشط'. |
| `dashboard.fields.trip` | "رقم الرحلة / التذكرة" | "رقم الTrip / التذكرة" | "رقم الٹرپ / التذكرة" | Verify context 'jsx_text'. Do NOT merge with other instances of 'رقم الرحلة / التذكرة'. |
| `dashboard.labels.carrier` | "الناقل (Carrier)" | "Carrier (Carrier)" | "کیریئر (Carrier)" | Verify context 'jsx_text'. Do NOT merge with other instances of 'الناقل (Carrier)'. |
| `dashboard.labels.carrier_2` | "الناقل" | "Carrier" | "کیریئر" | Verify context 'jsx_text'. Do NOT merge with other instances of 'الناقل'. |
| `dashboard.labels.download` | "تم التحميل (LOADED)" | "تم التحميل (LOADED)" | "تم التحميل (LOADED)" | Verify context 'jsx_text'. Do NOT merge with other instances of 'تم التحميل (LOADED)'. |
| ... | *and 1578 more items in this queue* | | | |

### 1. Reason: `INTERPOLATION_RISK` (8 items)

> Complex dynamic placeholders or parameter sequences requiring syntax verification

| Key | Arabic Source | Proposed English | Proposed Urdu | Recommendation & Context |
| :--- | :--- | :--- | :--- | :--- |
| `entityResolution.labels.driverCarrier` | "تعارض السائق مع الناقل: السائق [${sourceValue}] مسجل تحت كفالة/تشغيل الناقل (${expCarrier}) وليس الناقل (${provCarrier})." | "تعارض Driver مع Carrier: Driver [${sourceValue}] مسجل تحت كفالة/تشغيل Carrier (${expCarrier}) وليس Carrier (${provCarrier})." | "تعارض ڈرائیور مع کیریئر: ڈرائیور [${sourceValue}] مسجل تحت كفالة/تشغيل کیریئر (${expCarrier}) وليس کیریئر (${provCarrier})." | Ensure parameter(s) [sourceValue, expCarrier, provCarrier] remain unmodified in translation syntax. |
| `entityResolution.labels.truckCarrierEdit` | "تعارض في ملكية الشاحنة: الشاحنة [${sourceValue}] مقيدة رسمياً للناقل (${expCarrier})، بينما الإدخال يشير إلى الناقل (${provCarrier}). النظام يمنع التعديل التلقائي للعلاقة." | "تعارض في ملكية Truck: Truck [${sourceValue}] Restrictedة رسمياً للناقل (${expCarrier})، بينما الإدخال يشير إلى Carrier (${provCarrier}). النظام يمنع الEdit التلقائي للعلاقة." | "تعارض في ملكية ٹرک: ٹرک [${sourceValue}] پابندة رسمياً للناقل (${expCarrier})، بينما الإدخال يشير إلى کیریئر (${provCarrier}). النظام يمنع الترمیم کریں التلقائي للعلاقة." | Ensure parameter(s) [sourceValue, expCarrier, provCarrier] remain unmodified in translation syntax. |
| `imports.fields.txt_423cda` | "الوزن الصافي المسجل في التذكرة (${net} كجم) يختلف عن الصافي المحسوب (القائم ${gross} - الفارغ ${tare} = ${calculatedNet} كجم) بفارق ${difference} كجم." | "Net Weight المسجل في التذكرة (${net} kg) يختلف عن الصافي المحسوب (القائم ${gross} - الفارغ ${tare} = ${calculatedNet} kg) بفارق ${difference} kg." | "خالص وزن المسجل في التذكرة (${net} کلوگرام) يختلف عن الصافي المحسوب (القائم ${gross} - الفارغ ${tare} = ${calculatedNet} کلوگرام) بفارق ${difference} کلوگرام." | Ensure parameter(s) [net, gross, tare, calculatedNet, difference] remain unmodified in translation syntax. |
| `imports.labels.driverCarrier_2` | "تعارض كفالة السائق: السائق (${cleanDriver}) مرتبط بالناقل (${expectedCarrier}) بينما السجل الوارد ينسبه للناقل (${cleanCarrier})." | "تعارض كفالة Driver: Driver (${cleanDriver}) مرتبط بCarrier (${expectedCarrier}) بينما السجل الوارد ينسبه للناقل (${cleanCarrier})." | "تعارض كفالة ڈرائیور: ڈرائیور (${cleanDriver}) مرتبط بکیریئر (${expectedCarrier}) بينما السجل الوارد ينسبه للناقل (${cleanCarrier})." | Ensure parameter(s) [cleanDriver, expectedCarrier, cleanCarrier] remain unmodified in translation syntax. |
| `imports.labels.truckCarrier_5` | "تعارض في العلاقة: الشاحنة (${cleanTruck}) مرتبطة في السجلات بالناقل (${expectedCarrier}) بينما السجل الوارد ينسبها للناقل (${cleanCarrier})." | "تعارض في العلاقة: Truck (${cleanTruck}) مرتبطة في السجلات بCarrier (${expectedCarrier}) بينما السجل الوارد ينسبها للناقل (${cleanCarrier})." | "تعارض في العلاقة: ٹرک (${cleanTruck}) مرتبطة في السجلات بکیریئر (${expectedCarrier}) بينما السجل الوارد ينسبها للناقل (${cleanCarrier})." | Ensure parameter(s) [cleanTruck, expectedCarrier, cleanCarrier] remain unmodified in translation syntax. |
| `imports.labels.txt_590dc8` | "اكتملت مراحل التحليل والمعايرة حتى المراجعة (REVIEW). الإجمالي: ${batch.totalRows}، صالح: ${validCount}، تحذيرات: ${warningCount}، أخطاء: ${errorCount}." | "اكتملت مراحل التحليل والمعايرة حتى المراجعة (REVIEW). Total: ${batch.totalRows}، صالح: ${validCount}، تحذيرات: ${warningCount}، أخطاء: ${errorCount}." | "اكتملت مراحل التحليل والمعايرة حتى المراجعة (REVIEW). کل: ${batch.totalRows}، صالح: ${validCount}، تحذيرات: ${warningCount}، أخطاء: ${errorCount}." | Ensure parameter(s) [validCount, warningCount, errorCount] remain unmodified in translation syntax. |
| `other.fields.txt_713130` | "# Q Saudi Work Follow — نموذج البيانات والمخطط الهيكلي (Data Model & Schema)

## 1. فلسفة تخزين البيانات ومصدر الحقيقة
- Firestore هو قاعدة البيانات الأساسية والمصدر الأوحد للحقيقة (SSOT).
- تنظيم البيانات بنمط Multi-Tenant Scoped Subcollections (/projects/{projectId}/...).
- Denormalization استراتيجي للقطات التاريخية (Pricing Snapshot, Truck Snapshot, Driver Snapshot).

## 2. الهيكلية الشجرية
/projects/{projectId}
   ├── /carriers/{carrierId}
   ├── /materials/{materialId}
   ├── /pricing_rules/{ruleId}
   ├── /trucks/{truckId}
   ├── /drivers/{driverId}
   ├── /trips/{tripId}
   │      ├── /events/{eventId}
   │      └── /exceptions/{exceptionId}
   ├── /sync_operations/{syncOpId}
   └── /sheet_projections/{projectionId}
/users/{userId}
/audit_logs/{auditLogId}" | "# Q Saudi Work Follow — نموذج Data والمخطط الهيكلي (Data Model & Schema)

## 1. فلسفة تخزين Data ومصدر الحقيقة
- Firestore هو قاعدة Data الأساسية وSource الأوحد للحقيقة (SSOT).
- تنظيم Data بنمط Multi-Tenant Scoped Subcollections (/projects/{projectId}/...).
- Denormalization استراتيجي للقطات التاريخية (Pricing Snapshot, Truck Snapshot, Driver Snapshot).

## 2. الهيكلية الشجرية
/projects/{projectId}
   ├── /carriers/{carrierId}
   ├── /materials/{materialId}
   ├── /pricing_rules/{ruleId}
   ├── /trucks/{truckId}
   ├── /drivers/{driverId}
   ├── /trips/{tripId}
   │      ├── /events/{eventId}
   │      └── /exceptions/{exceptionId}
   ├── /sync_operations/{syncOpId}
   └── /sheet_projections/{projectionId}
/users/{userId}
/audit_logs/{auditLogId}" | "# Q Saudi Work Follow — نموذج ڈیٹا والمخطط الهيكلي (Data Model & Schema)

## 1. فلسفة تخزين ڈیٹا ومصدر الحقيقة
- Firestore هو قاعدة ڈیٹا الأساسية وماخذ الأوحد للحقيقة (SSOT).
- تنظيم ڈیٹا بنمط Multi-Tenant Scoped Subcollections (/projects/{projectId}/...).
- Denormalization استراتيجي للقطات التاريخية (Pricing Snapshot, Truck Snapshot, Driver Snapshot).

## 2. الهيكلية الشجرية
/projects/{projectId}
   ├── /carriers/{carrierId}
   ├── /materials/{materialId}
   ├── /pricing_rules/{ruleId}
   ├── /trucks/{truckId}
   ├── /drivers/{driverId}
   ├── /trips/{tripId}
   │      ├── /events/{eventId}
   │      └── /exceptions/{exceptionId}
   ├── /sync_operations/{syncOpId}
   └── /sheet_projections/{projectionId}
/users/{userId}
/audit_logs/{auditLogId}" | Ensure parameter(s) [projectId, carrierId, materialId, ruleId, truckId, driverId, tripId, eventId, exceptionId, syncOpId, projectionId, userId, auditLogId] remain unmodified in translation syntax. |
| `projects.labels.carrier_4` | "تضارب تسعير: الناقل (${carrierDisplay}) لديه قاعدتا تسعير متطابقتان بنموذج (${pricingTypeLabel}) لمادة (${materialDisplay}) في فترتين زمنيتين متداخلتين: [${period1Str}] و [${period2Str}]." | "تضارب تسعير: Carrier (${carrierDisplay}) لديه قاعدتا تسعير متطابقتان بنموذج (${pricingTypeLabel}) لمادة (${materialDisplay}) في فترتين زمنيتين متداخلتين: [${period1Str}] و [${period2Str}]." | "تضارب تسعير: کیریئر (${carrierDisplay}) لديه قاعدتا تسعير متطابقتان بنموذج (${pricingTypeLabel}) لمادة (${materialDisplay}) في فترتين زمنيتين متداخلتين: [${period1Str}] و [${period2Str}]." | Ensure parameter(s) [carrierDisplay, pricingTypeLabel, materialDisplay, period1Str, period2Str] remain unmodified in translation syntax. |

### 1. Reason: `PLURALIZATION_RISK` (133 items)

> Quantities requiring 6 Arabic plural forms aligned with target language plural rules

| Key | Arabic Source | Proposed English | Proposed Urdu | Recommendation & Context |
| :--- | :--- | :--- | :--- | :--- |
| `dashboard.labels.txt_17805f` | "إجمالي التسويات: ${settMetrics.totalSettlementAmount} ر.س (مقطوعية: ${settMetrics.tripBasedSettlementAmount}، أطنان: ${settMetrics.tonBasedSettlementAmount})." | "إجمالي التسويات: ${settMetrics.totalSettlementAmount} SAR (مقطوعية: ${settMetrics.tripBasedSettlementAmount}، tons: ${settMetrics.tonBasedSettlementAmount})." | "إجمالي التسويات: ${settMetrics.totalSettlementAmount} سعودی ریال (مقطوعية: ${settMetrics.tripBasedSettlementAmount}، ٹن: ${settMetrics.tonBasedSettlementAmount})." | Validate plural rules for Arabic (zero, one, two, few, many, other) vs English/Urdu (one, other). |
| `dashboard.status.txt_19a7a2` | "إجمالي: ${statusMetrics.totalTrips}, المكتملة: ${statusMetrics.completedTrips}, قيد الترحيل: ${statusMetrics.inTransitTrips}." | "إجمالي: ${statusMetrics.totalTrips}, الCompletedة: ${statusMetrics.completedTrips}, قيد الترحيل: ${statusMetrics.inTransitTrips}." | "إجمالي: ${statusMetrics.totalTrips}, المکملة: ${statusMetrics.completedTrips}, قيد الترحيل: ${statusMetrics.inTransitTrips}." | Validate plural rules for Arabic (zero, one, two, few, many, other) vs English/Urdu (one, other). |
| `entityResolution.fields.txt_6014d9` | "تذكرة رقم 0123456789" | "تذكرة رقم 0123456789" | "تذكرة رقم 0123456789" | Validate plural rules for Arabic (zero, one, two, few, many, other) vs English/Urdu (one, other). |
| `entityResolution.labels.txt_22771a` | "كجم | إجمالي:" | "kg | إجمالي:" | "کلوگرام | إجمالي:" | Validate plural rules for Arabic (zero, one, two, few, many, other) vs English/Urdu (one, other). |
| `exceptions.fields.refresh` | "تعارض النسخ المتفائلة (Optimistic Concurrency Clash): محاولة تحديث تذكرة الوصول بالنسخة رقم (1) بينما خادم قاعدة البيانات يحتوي النسخة رقم (2)" | "تعارض الCopy المتفائلة (Optimistic Concurrency Clash): محاولة Refresh تذكرة الوصول بالCopyة رقم (1) بينما خادم قاعدة Data يحتوي الCopyة رقم (2)" | "تعارض الکاپی کریں المتفائلة (Optimistic Concurrency Clash): محاولة تازہ کریں تذكرة الوصول بالکاپی کریںة رقم (1) بينما خادم قاعدة ڈیٹا يحتوي الکاپی کریںة رقم (2)" | Validate plural rules for Arabic (zero, one, two, few, many, other) vs English/Urdu (one, other). |
| `exceptions.fields.tripWeighbridge` | "محاولة إدخال رحلة مكررة بنفس الرقم التسلسلي لتذكرة الميزان المحررة (WB-TKT-88091)" | "محاولة إدخال Trip مكررة بنفس الرقم التسلسلي لتذكرة الميزان المحررة (WB-TKT-88091)" | "محاولة إدخال ٹرپ مكررة بنفس الرقم التسلسلي لتذكرة الميزان المحررة (WB-TKT-88091)" | Validate plural rules for Arabic (zero, one, two, few, many, other) vs English/Urdu (one, other). |
| `exceptions.labels.txt_1334ce` | "لا توجد قاعدة تسعير معتمدة وسارية للناقل (CAR-ALBILAD-08) لنقل مادة الصخور البحرية (MAT-ARMOR-ROCK) للمشروع" | "لا توجد قاعدة تسعير معتمدة وسارية للناقل (CAR-ALBILAD-08) لنقل مادة الصخور البحرية (MAT-ARMOR-ROCK) للمشروع" | "لا توجد قاعدة تسعير معتمدة وسارية للناقل (CAR-ALBILAD-08) لنقل مادة الصخور البحرية (MAT-ARMOR-ROCK) للمشروع" | Validate plural rules for Arabic (zero, one, two, few, many, other) vs English/Urdu (one, other). |
| `exceptions.status.createSuccessError` | "تم إنشاء وتحقق سجل استثناء لكل نوع من الأنواع الـ 12 بنجاح دون أي خطأ" | "تم Create وتحقق سجل استثناء لكل نوع من الأنواع الـ 12 بSuccess دون أي Error" | "تم تخلیق کریں وتحقق سجل استثناء لكل نوع من الأنواع الـ 12 بکامیاب دون أي خرابی" | Validate plural rules for Arabic (zero, one, two, few, many, other) vs English/Urdu (one, other). |
| `imports.fields.txt_1eceb7` | "وزن إجمالي" | "وزن إجمالي" | "وزن إجمالي" | Validate plural rules for Arabic (zero, one, two, few, many, other) vs English/Urdu (one, other). |
| `imports.fields.txt_5fedb0` | "إجمالي السجلات يجب أن يكون رقمًا غير سالب" | "إجمالي السجلات يجب أن يكون رقمًا غير سالب" | "إجمالي السجلات يجب أن يكون رقمًا غير سالب" | Validate plural rules for Arabic (zero, one, two, few, many, other) vs English/Urdu (one, other). |
| `imports.labels.truckEditProject` | "تعارض حرج في العلاقة (RELATIONSHIP_CONFLICT): الشاحنة (${matchedTruck.plate}) مقيدة في السجلات المعتمدة للناقل (${registeredCarrier})، بينما الملف الوارد ينسبها للناقل (${claimedCarrier}). يمنع النظام إعادة تعيين الشاحنة أو تعديل سجلات المشروع الأساسية تلقائياً." | "تعارض حرج في العلاقة (RELATIONSHIP_CONFLICT): Truck (${matchedTruck.plate}) Restrictedة في السجلات المعتمدة للناقل (${registeredCarrier})، بينما الملف الوارد ينسبها للناقل (${claimedCarrier}). يمنع النظام إعادة تعيين Truck أو Edit سجلات Project الأساسية تلقائياً." | "تعارض حرج في العلاقة (RELATIONSHIP_CONFLICT): ٹرک (${matchedTruck.plate}) پابندة في السجلات المعتمدة للناقل (${registeredCarrier})، بينما الملف الوارد ينسبها للناقل (${claimedCarrier}). يمنع النظام إعادة تعيين ٹرک أو ترمیم کریں سجلات پروجیکٹ الأساسية تلقائياً." | Validate plural rules for Arabic (zero, one, two, few, many, other) vs English/Urdu (one, other). |
| `imports.labels.truck_9` | "الشاحنة / اللوحة (${raw}) غير مسجلة في سجلات أسطول المشروع." | "Truck / اللوحة (${raw}) غير مسجلة في سجلات أسطول Project." | "ٹرک / اللوحة (${raw}) غير مسجلة في سجلات أسطول پروجیکٹ." | Validate plural rules for Arabic (zero, one, two, few, many, other) vs English/Urdu (one, other). |
| `imports.labels.txt_27a67d` | "فارغ: ${tareKg} / إجمالي: ${grossKg}" | "فارغ: ${tareKg} / Total: ${grossKg}" | "فارغ: ${tareKg} / کل: ${grossKg}" | Validate plural rules for Arabic (zero, one, two, few, many, other) vs English/Urdu (one, other). |
| `imports.labels.txt_326cdf` | "تم وسم الصف الثاني كمكرر: ${secondRowDuplicate}، إجمالي المكرر: ${batch.rows.filter((r) => r.duplicateInfo?.isDuplicate).length}" | "تم وسم الصف الثاني كمكرر: ${secondRowDuplicate}، إجمالي المكرر: ${batch.rows.filter((r) => r.duplicateInfo?.isDuplicate).length}" | "تم وسم الصف الثاني كمكرر: ${secondRowDuplicate}، إجمالي المكرر: ${batch.rows.filter((r) => r.duplicateInfo?.isDuplicate).length}" | Validate plural rules for Arabic (zero, one, two, few, many, other) vs English/Urdu (one, other). |
| `imports.labels.txt_342ca6` | "إجمالي السجلات الأصلية المؤرشفة:" | "إجمالي السجلات الأصلية المؤرشفة:" | "إجمالي السجلات الأصلية المؤرشفة:" | Validate plural rules for Arabic (zero, one, two, few, many, other) vs English/Urdu (one, other). |
| `imports.labels.txt_4cde00` | "مؤشر صف الترويسة (${headerRowIdx}) أكبر من عدد صفوف الجدول المتاحة (${values.length})." | "مؤشر صف الترويسة (${headerRowIdx}) أكبر من عدد صفوف الجدول المتاحة (${values.length})." | "مؤشر صف الترويسة (${headerRowIdx}) أكبر من عدد صفوف الجدول المتاحة (${values.length})." | Validate plural rules for Arabic (zero, one, two, few, many, other) vs English/Urdu (one, other). |
| `imports.labels.txt_513ae4` | "إجمالي الصفوف (rowCount)" | "إجمالي الصفوف (rowCount)" | "إجمالي الصفوف (rowCount)" | Validate plural rules for Arabic (zero, one, two, few, many, other) vs English/Urdu (one, other). |
| `loading.fields.total` | "تنبيه وزن إجمالي مرتفع: الوزن الإجمالي (${(grossWeight / 1000).toFixed(1)} طن) قد يعرض المركبة لمخالفة الموازين المتنقلة." | "تنبيه وزن إجمالي مرتفع: Gross Weight (${(grossWeight / 1000).toFixed(1)} ton) قد يView المركبة لمخالفة الموازين المتنقلة." | "تنبيه وزن إجمالي مرتفع: مجموعی وزن (${(grossWeight / 1000).toFixed(1)} ٹن) قد يدیکھیں المركبة لمخالفة الموازين المتنقلة." | Validate plural rules for Arabic (zero, one, two, few, many, other) vs English/Urdu (one, other). |
| `loading.fields.txt_5ddea6` | "تنبيه وزن إجمالي مرتفع: الوزن القائم (${(grossWeight / 1000).toFixed(1)} طن) قد يعرض المركبة لمخالفة محطات الوزن المتنقلة." | "تنبيه وزن إجمالي مرتفع: الوزن القائم (${(grossWeight / 1000).toFixed(1)} ton) قد يView المركبة لمخالفة محطات الوزن المتنقلة." | "تنبيه وزن إجمالي مرتفع: الوزن القائم (${(grossWeight / 1000).toFixed(1)} ٹن) قد يدیکھیں المركبة لمخالفة محطات الوزن المتنقلة." | Validate plural rules for Arabic (zero, one, two, few, many, other) vs English/Urdu (one, other). |
| `loading.labels.txt_1b30bf` | "تنبيه حمولة زائدة: صافي الحمولة (${netWeightTons} طن) يتجاوز الحد النظامي الموصى به (35 طن) وفق لائحة الهيئة العامة للنقل." | "تنبيه حمولة زائدة: صافي الحمولة (${netWeightTons} ton) يتجاوز الحد النظامي الموصى به (35 ton) وفق لائحة الهيئة العامة للنقل." | "تنبيه حمولة زائدة: صافي الحمولة (${netWeightTons} ٹن) يتجاوز الحد النظامي الموصى به (35 ٹن) وفق لائحة الهيئة العامة للنقل." | Validate plural rules for Arabic (zero, one, two, few, many, other) vs English/Urdu (one, other). |
| `loading.labels.txt_4d6b95` | "من إجمالي" | "من إجمالي" | "من إجمالي" | Validate plural rules for Arabic (zero, one, two, few, many, other) vs English/Urdu (one, other). |
| `loading.labels.txt_56e34f` | "${netWeightTons} طن × ${activePricingRule.agreedRate} = ${total.toFixed(2)} ${activePricingRule.currency || 'SAR'}" | "${netWeightTons} ton × ${activePricingRule.agreedRate} = ${total.toFixed(2)} ${activePricingRule.currency || 'SAR'}" | "${netWeightTons} ٹن × ${activePricingRule.agreedRate} = ${total.toFixed(2)} ${activePricingRule.currency || 'SAR'}" | Validate plural rules for Arabic (zero, one, two, few, many, other) vs English/Urdu (one, other). |
| `loading.messages.downloadPricing` | "تم تحميل سيناريو مثال التسعير بالطن (37.4 طن × 8.5 ر.س = 317.90 ر.س)" | "تم تحميل سيناريو مثال التسعير بالton (37.4 ton × 8.5 SAR = 317.90 SAR)" | "تم تحميل سيناريو مثال التسعير بالٹن (37.4 ٹن × 8.5 سعودی ریال = 317.90 سعودی ریال)" | Validate plural rules for Arabic (zero, one, two, few, many, other) vs English/Urdu (one, other). |
| `navigation.labels.project_8` | "إجمالي الكميات الموردة بالمشروع" | "إجمالي الكميات الموردة بProject" | "إجمالي الكميات الموردة بپروجیکٹ" | Validate plural rules for Arabic (zero, one, two, few, many, other) vs English/Urdu (one, other). |
| `navigation.labels.txt_19f9d7` | "إجمالي حالات الاستثناء وفروقات الموازين" | "إجمالي حالات الاستثناء وفروقات الموازين" | "إجمالي حالات الاستثناء وفروقات الموازين" | Validate plural rules for Arabic (zero, one, two, few, many, other) vs English/Urdu (one, other). |
| ... | *and 108 more items in this queue* | | | |

### 1. Reason: `REPORT_EXPORT_RISK` (3384 items)

> Report column or export header requiring separation of internal data key from display label

| Key | Arabic Source | Proposed English | Proposed Urdu | Recommendation & Context |
| :--- | :--- | :--- | :--- | :--- |
| `authentication.columns.cancel` | "تم إلغاء طلب تسجيل الدخول." | "تم Cancel طلب تسجيل الدخول." | "تم منسوخ کریں طلب تسجيل الدخول." | Ensure internal key 'cancel' remains untranslated; translate presentation label only. |
| `authentication.columns.close` | "تم إغلاق نافذة تسجيل الدخول من قبل المستخدم." | "تم Close نافذة تسجيل الدخول من قبل User." | "تم بند کریں نافذة تسجيل الدخول من قبل صارف." | Ensure internal key 'close' remains untranslated; translate presentation label only. |
| `authentication.columns.txt_110c51` | "تم حظر النافذة المنبثقة من قِبل المتصفح. يُرجى السماح بالنوافذ المنبثقة." | "تم حظر النافذة المنبثقة من قِبل المتصفح. يُرجى السماح بالنوافذ المنبثقة." | "تم حظر النافذة المنبثقة من قِبل المتصفح. يُرجى السماح بالنوافذ المنبثقة." | Ensure internal key 'txt_110c51' remains untranslated; translate presentation label only. |
| `authentication.columns.txt_628e01` | "تعذر الاتصال بخدمة المصادقة. يرجى التحقق من اتصالك بالإنترنت." | "تعذر الاتصال بخدمة المصادقة. يرجى Verify اتصالك بالإنترنت." | "تعذر الاتصال بخدمة المصادقة. يرجى تصدیق کریں اتصالك بالإنترنت." | Ensure internal key 'txt_628e01' remains untranslated; translate presentation label only. |
| `authentication.fields.txt_1fd2a9` | "الاسم الكامل الثلاثي للمستخدم" | "الاسم الكامل الثلاثي للمستخدم" | "الاسم الكامل الثلاثي للمستخدم" | Ensure internal key 'txt_1fd2a9' remains untranslated; translate presentation label only. |
| `authentication.fields.txt_465327` | "يُرجى إدخال الاسم الكامل." | "يُرجى إدخال الاسم الكامل." | "يُرجى إدخال الاسم الكامل." | Ensure internal key 'txt_465327' remains untranslated; translate presentation label only. |
| `authentication.fields.txt_7a428f` | "أدخل اسمك بالكامل" | "أدخل اسمك بالكامل" | "أدخل اسمك بالكامل" | Ensure internal key 'txt_7a428f' remains untranslated; translate presentation label only. |
| `authentication.fields.user` | "اسم المستخدم:" | "اسم User:" | "اسم صارف:" | Ensure internal key 'user' remains untranslated; translate presentation label only. |
| `carriers.columns.carriers` | "carriers" | "carriers" | "carriers" | Ensure internal key 'carriers' remains untranslated; translate presentation label only. |
| `carriers.columns.projects` | "projects" | "projects" | "projects" | Ensure internal key 'projects' remains untranslated; translate presentation label only. |
| `carriers.fields.carrier` | "معرف الناقل (carrierId) مطلوب" | "معرف Carrier (carrierId) Required" | "معرف کیریئر (carrierId) لازمی" | Ensure internal key 'carrier' remains untranslated; translate presentation label only. |
| `carriers.fields.carrier_2` | "اسم الناقل يجب أن يتكون من 3 أحرف على الأقل" | "Carrier Name يجب أن يتكون من 3 أحرف على الأقل" | "کیریئر کا نام يجب أن يتكون من 3 أحرف على الأقل" | Ensure internal key 'carrier_2' remains untranslated; translate presentation label only. |
| `carriers.fields.commercialregistrationno` | "commercialRegistrationNo" | "commercialRegistrationNo" | "commercialRegistrationNo" | Ensure internal key 'commercialregistrationno' remains untranslated; translate presentation label only. |
| `carriers.fields.name` | "name" | "name" | "name" | Ensure internal key 'name' remains untranslated; translate presentation label only. |
| `carriers.fields.tgaLog12345` | "TGA-LOG-12345" | "TGA-LOG-12345" | "TGA-LOG-12345" | Ensure internal key 'tgaLog12345' remains untranslated; translate presentation label only. |
| `carriers.fields.txt_13dd75` | "رقم جوال التواصل" | "رقم جوال التواصل" | "رقم جوال التواصل" | Ensure internal key 'txt_13dd75' remains untranslated; translate presentation label only. |
| `carriers.fields.txt_23aacd` | "رقم السجل التجاري للناقل يجب أن يكون 10 أرقام نظامية سعودية" | "رقم السجل التجاري للناقل يجب أن يكون 10 أرقام نظامية سعودية" | "رقم السجل التجاري للناقل يجب أن يكون 10 أرقام نظامية سعودية" | Ensure internal key 'txt_23aacd' remains untranslated; translate presentation label only. |
| `carriers.fields.txt_30a77c` | "رقم السجل التجاري يجب أن يتكون من 10 أرقام" | "رقم السجل التجاري يجب أن يتكون من 10 أرقام" | "رقم السجل التجاري يجب أن يتكون من 10 أرقام" | Ensure internal key 'txt_30a77c' remains untranslated; translate presentation label only. |
| `carriers.fields.txt_4718fe` | "e.g. CAR-A أو CAR-ALRASHID-01" | "e.g. CAR-A أو CAR-ALRASHID-01" | "e.g. CAR-A أو CAR-ALRASHID-01" | Ensure internal key 'txt_4718fe' remains untranslated; translate presentation label only. |
| `carriers.fields.txt_49c361` | "رقم السجل التجاري (CR 10 أرقام)" | "رقم السجل التجاري (CR 10 أرقام)" | "رقم السجل التجاري (CR 10 أرقام)" | Ensure internal key 'txt_49c361' remains untranslated; translate presentation label only. |
| `carriers.fields.txt_49e1b2` | "فهد الرشيد" | "فهد الرشيد" | "فهد الرشيد" | Ensure internal key 'txt_49e1b2' remains untranslated; translate presentation label only. |
| `carriers.fields.txt_521cc9` | "اسم مسؤول العمليات" | "اسم مسؤول Operations" | "اسم مسؤول آپریشنز" | Ensure internal key 'txt_521cc9' remains untranslated; translate presentation label only. |
| `carriers.fields.txt_558361` | "اسم شركة النقل (carrierName) مطلوب ولا يقل عن 3 أحرف" | "اسم شركة النقل (carrierName) Required ولا يقل عن 3 أحرف" | "اسم شركة النقل (carrierName) لازمی ولا يقل عن 3 أحرف" | Ensure internal key 'txt_558361' remains untranslated; translate presentation label only. |
| `carriers.fields.txt_599d91` | "contact@carrier.sa" | "contact@carrier.sa" | "contact@carrier.sa" | Ensure internal key 'txt_599d91' remains untranslated; translate presentation label only. |
| `carriers.fields.txt_5a7cd0` | "اسم شركة أو مؤسسة النقل (carrierName)" | "اسم شركة أو مؤسسة النقل (carrierName)" | "اسم شركة أو مؤسسة النقل (carrierName)" | Ensure internal key 'txt_5a7cd0' remains untranslated; translate presentation label only. |
| ... | *and 3359 more items in this queue* | | | |

### 1. Reason: `BUSINESS_DATA_RISK` (748 items)

> Formulas, rates, or business calculations requiring strict identifier preservation

| Key | Arabic Source | Proposed English | Proposed Urdu | Recommendation & Context |
| :--- | :--- | :--- | :--- | :--- |
| `authentication.labels.txt_6e1f8e` | "نطاق التطبيق (${hostname}) غير مدرج في قائمة النطاقات المصرح بها (Authorized Domains) في Firebase Console. يمكنك إضافته عبر: Firebase Console -> Authentication -> Settings -> Authorized domains." | "نطاق الApply (${hostname}) غير مدرج في قائمة النطاقات المصرح بها (Authorized Domains) في Firebase Console. يمكنك إضافته عبر: Firebase Console -> Authentication -> Settings -> Authorized domains." | "نطاق اللاگو کریں (${hostname}) غير مدرج في قائمة النطاقات المصرح بها (Authorized Domains) في Firebase Console. يمكنك إضافته عبر: Firebase Console -> Authentication -> Settings -> Authorized domains." | Protect financial or scale tokens: [hostname]. |
| `authentication.labels.txt_7a78d9` | "مثال: مهندس موقع بمشروع نيوم لتسجيل موازين الشحنات اليومية" | "مثال: مهندس موقع بمشروع نيوم لتسجيل موازين الشحنات اليومية" | "مثال: مهندس موقع بمشروع نيوم لتسجيل موازين الشحنات اليومية" | Protect financial or scale tokens: []. |
| `carriers.labels.carrier` | "معرف الناقل (${cleanId}) مسجل مسبقاً في المشروع." | "معرف Carrier (${cleanId}) مسجل مسبقاً في Project." | "معرف کیریئر (${cleanId}) مسجل مسبقاً في پروجیکٹ." | Protect financial or scale tokens: [cleanId]. |
| `carriers.labels.error` | "خطأ في بيانات الناقل: ${validation.errors.map(e => e.messageAr).join(' | ')}" | "Error في بيانات Carrier: ${validation.errors.map(e => e.messageAr).join(' | ')}" | "خرابی في بيانات کیریئر: ${validation.errors.map(e => e.messageAr).join(' | ')}" | Protect financial or scale tokens: []. |
| `carriers.labels.errorRefresh` | "خطأ في تحديث الناقل: ${validation.errors.map(e => e.messageAr).join(' | ')}" | "Error في Refresh Carrier: ${validation.errors.map(e => e.messageAr).join(' | ')}" | "خرابی في تازہ کریں کیریئر: ${validation.errors.map(e => e.messageAr).join(' | ')}" | Protect financial or scale tokens: []. |
| `dashboard.labels.filter` | "تم تصفية البيانات بدقة: حصل مدير نيوم على رحلات نيوم فقط (${neomRes.trips.length} رحلة) وتم حجب مشروع البحر الأحمر نهائياً." | "تم Filter Data بدقة: حصل مدير نيوم على رحلات نيوم فقط (${neomRes.trips.length} Trip) وتم حجب مشروع البحر الأحمر نهائياً." | "تم فلٹر کریں ڈیٹا بدقة: حصل مدير نيوم على رحلات نيوم فقط (${neomRes.trips.length} ٹرپ) وتم حجب مشروع البحر الأحمر نهائياً." | Protect financial or scale tokens: []. |
| `dashboard.labels.trip_3` | "رحلة بالطن" | "Trip بالton" | "ٹرپ بالٹن" | Protect financial or scale tokens: [TON]. |
| `dashboard.labels.txt_1bf649` | "أوزان التحميل: ${tonMetrics.totalLoadedTons} طن، الاستلام: ${tonMetrics.totalReceivedTons} طن، الفارق: ${tonMetrics.totalVarianceTons} طن." | "أوزان التحميل: ${tonMetrics.totalLoadedTons} ton، الاستلام: ${tonMetrics.totalReceivedTons} ton، الفارق: ${tonMetrics.totalVarianceTons} ton." | "أوزان التحميل: ${tonMetrics.totalLoadedTons} ٹن، الاستلام: ${tonMetrics.totalReceivedTons} ٹن، الفارق: ${tonMetrics.totalVarianceTons} ٹن." | Protect financial or scale tokens: [TON]. |
| `dashboard.labels.txt_209b00` | "تم رصد محاولة وصول لمشروع غير مصرح به وإرجاع مصفوفة فارغة مع تفعيل علامة الانتهاك الأمني." | "تم رصد محاولة وصول لمشروع غير مصرح به وإرجاع مصفوفة فارغة مع تفعيل علامة الانتهاك الأمني." | "تم رصد محاولة وصول لمشروع غير مصرح به وإرجاع مصفوفة فارغة مع تفعيل علامة الانتهاك الأمني." | Protect financial or scale tokens: []. |
| `dashboard.labels.txt_27a436` | "ضمن نسبة التسامح (±1%)" | "ضمن نسبة التسامح (±1%)" | "ضمن نسبة التسامح (±1%)" | Protect financial or scale tokens: []. |
| `dashboard.labels.txt_368ced` | "ثبات لقطات التسوية ومطابقة PER_TRIP و PER_TON" | "ثبات لقطات التسوية ومطابقة PER_TRIP و PER_TON" | "ثبات لقطات التسوية ومطابقة PER_TRIP و PER_TON" | Protect financial or scale tokens: []. |
| `dashboard.labels.txt_633cee` | "كافة فحوصات الأمان والعمليات ناجحة بنسبة 100%" | "كافة فحوصات الأمان وOperations ناجحة بنسبة 100%" | "كافة فحوصات الأمان وآپریشنز ناجحة بنسبة 100%" | Protect financial or scale tokens: []. |
| `dashboard.labels.txt_6ab017` | "عقود الطن المتري (PER_TON)" | "عقود الton المتري (PER_TON)" | "عقود الٹن المتري (PER_TON)" | Protect financial or scale tokens: [TON]. |
| `dashboard.labels.txt_6cd5a8` | "بطاقات الأوزان (Tonnage & Variance Cards)" | "بطاقات الأوزان (Tonnage & Variance Cards)" | "بطاقات الأوزان (Tonnage & Variance Cards)" | Protect financial or scale tokens: []. |
| `dashboard.status.success` | "تم تجميع الأداء بنجاح لـ ${carrierPerf.length} ناقلين." | "تم تجميع الأداء بSuccess لـ ${carrierPerf.length} ناقلين." | "تم تجميع الأداء بکامیاب لـ ${carrierPerf.length} ناقلين." | Protect financial or scale tokens: []. |
| `dashboard.status.trips` | "تم ترتيب الرحلات النشطة قيد الترحيل في مقدمة لوحة البوابات الحية." | "تم ترتيب Trips الActiveة قيد الترحيل في مقدمة لوحة البوابات الحية." | "تم ترتيب ٹرپس الفعالة قيد الترحيل في مقدمة لوحة البوابات الحية." | Protect financial or scale tokens: []. |
| `drivers.labels.error` | "خطأ في بيانات السائق: ${validation.errors.map(e => e.messageAr).join(' | ')}" | "Error في بيانات Driver: ${validation.errors.map(e => e.messageAr).join(' | ')}" | "خرابی في بيانات ڈرائیور: ${validation.errors.map(e => e.messageAr).join(' | ')}" | Protect financial or scale tokens: []. |
| `drivers.labels.errorRefresh` | "خطأ في تحديث السائق: ${validation.errors.map(e => e.messageAr).join(' | ')}" | "Error في Refresh Driver: ${validation.errors.map(e => e.messageAr).join(' | ')}" | "خرابی في تازہ کریں ڈرائیور: ${validation.errors.map(e => e.messageAr).join(' | ')}" | Protect financial or scale tokens: []. |
| `entityResolution.labels.carrier` | "تم ترخيص الناقل [${resolutionCarrierId}] للمشروع يدوياً." | "تم ترخيص Carrier [${resolutionCarrierId}] للمشروع يدوياً." | "تم ترخيص کیریئر [${resolutionCarrierId}] للمشروع يدوياً." | Protect financial or scale tokens: [resolutionCarrierId]. |
| `entityResolution.labels.carrier_4` | "الناقل [${candidateValue || candidateId}] غير معتمد أو غير مصرح له في نطاق هذا المشروع." | "Carrier [${candidateValue || candidateId}] غير معتمد أو غير مصرح له في نطاق هذا Project." | "کیریئر [${candidateValue || candidateId}] غير معتمد أو غير مصرح له في نطاق هذا پروجیکٹ." | Protect financial or scale tokens: []. |
| `entityResolution.labels.closeTrip` | "تم رصد إغلاق الرحلة الخادومي (${targetTrip.tripSerial}) ومنع الكتابة التلقائية" | "تم رصد Close الTrip الخادومي (${targetTrip.tripSerial}) ومنع الكتابة التلقائية" | "تم رصد بند کریں الٹرپ الخادومي (${targetTrip.tripSerial}) ومنع الكتابة التلقائية" | Protect financial or scale tokens: []. |
| `entityResolution.labels.material_5` | "المادة [${candidateValue || candidateId}] غير مسموح بنقلها أو غير معتمدة في هذا المشروع." | "Material [${candidateValue || candidateId}] غير مسموح بنقلها أو غير معتمدة في هذا Project." | "مٹیریل [${candidateValue || candidateId}] غير مسموح بنقلها أو غير معتمدة في هذا پروجیکٹ." | Protect financial or scale tokens: []. |
| `entityResolution.labels.material_6` | "تم رصد المادة الموقوفة (MAT-DEACTIVATED) وتجميد العملية" | "تم رصد Material الموقوفة (MAT-DEACTIVATED) وتجميد العملية" | "تم رصد مٹیریل الموقوفة (MAT-DEACTIVATED) وتجميد العملية" | Protect financial or scale tokens: []. |
| `entityResolution.labels.truckCarrier` | "تم تصحيح تبعية الشاحنة يدوياً إلى الناقل [${resolutionCarrierId}]." | "تم تصحيح تبعية Truck يدوياً إلى Carrier [${resolutionCarrierId}]." | "تم تصحيح تبعية ٹرک يدوياً إلى کیریئر [${resolutionCarrierId}]." | Protect financial or scale tokens: [resolutionCarrierId]. |
| `entityResolution.labels.txt_1164f5` | "عُثر على تطابق مقترح (Possible Match) بنسبة ${highestScore}% مع "${bestCandidate.value}". ${matchDetails}" | "عُثر على تطابق مقترح (Possible Match) بنسبة ${highestScore}% مع "${bestCandidate.value}". ${matchDetails}" | "عُثر على تطابق مقترح (Possible Match) بنسبة ${highestScore}% مع "${bestCandidate.value}". ${matchDetails}" | Protect financial or scale tokens: [highestScore, matchDetails]. |
| ... | *and 723 more items in this queue* | | | |

### 1. Reason: `LOW_CONFIDENCE` (6971 items)

> Ambiguous or composite phrases generated with low statistical confidence

| Key | Arabic Source | Proposed English | Proposed Urdu | Recommendation & Context |
| :--- | :--- | :--- | :--- | :--- |
| `authentication.labels.44px` | "44px" | "44px" | "44px" | Review phrasing carefully; replace with verified domain phrase if needed. |
| `authentication.labels.close` | "إغلاق التنبيه" | "Close التنبيه" | "بند کریں التنبيه" | Review phrasing carefully; replace with verified domain phrase if needed. |
| `authentication.labels.create` | "تم رفض طلب إنشاء الحساب" | "تم رفض طلب Create الحساب" | "تم رفض طلب تخلیق کریں الحساب" | Review phrasing carefully; replace with verified domain phrase if needed. |
| `authentication.labels.error` | "حدث خطأ أثناء إرسال الطلب. يرجى المحاولة لاحقاً." | "حدث Error أثناء إرسال الطلب. يرجى المحاولة لاحقاً." | "حدث خرابی أثناء إرسال الطلب. يرجى المحاولة لاحقاً." | Review phrasing carefully; replace with verified domain phrase if needed. |
| `authentication.labels.fail` | "FAIL" | "FAIL" | "FAIL" | Review phrasing carefully; replace with verified domain phrase if needed. |
| `authentication.labels.googleAuthVerified` | "Google Auth Verified" | "Google Auth Verified" | "Google Auth Verified" | Review phrasing carefully; replace with verified domain phrase if needed. |
| `authentication.labels.lucideReact` | "lucide-react" | "lucide-react" | "lucide-react" | Review phrasing carefully; replace with verified domain phrase if needed. |
| `authentication.labels.noReferrer` | "no-referrer" | "no-referrer" | "no-referrer" | Review phrasing carefully; replace with verified domain phrase if needed. |
| `authentication.labels.pass` | "PASS" | "PASS" | "PASS" | Review phrasing carefully; replace with verified domain phrase if needed. |
| `authentication.labels.prjNeomNorth01` | "PRJ-NEOM-NORTH-01" | "PRJ-NEOM-NORTH-01" | "PRJ-NEOM-NORTH-01" | Review phrasing carefully; replace with verified domain phrase if needed. |
| `authentication.labels.prjRedseaResort02` | "PRJ-REDSEA-RESORT-02" | "PRJ-REDSEA-RESORT-02" | "PRJ-REDSEA-RESORT-02" | Review phrasing carefully; replace with verified domain phrase if needed. |
| `authentication.labels.project` | "مدير المشروع المشرف (PROJECT_ADMIN)" | "مدير Project المشرف (PROJECT_ADMIN)" | "مدير پروجیکٹ المشرف (PROJECT_ADMIN)" | Review phrasing carefully; replace with verified domain phrase if needed. |
| `authentication.labels.projects` | "نطاق المشاريع المصرحة:" | "نطاق Projects المصرحة:" | "نطاق پروجیکٹس المصرحة:" | Review phrasing carefully; replace with verified domain phrase if needed. |
| `authentication.labels.react` | "react" | "react" | "react" | Review phrasing carefully; replace with verified domain phrase if needed. |
| `authentication.labels.role` | "role" | "role" | "role" | Review phrasing carefully; replace with verified domain phrase if needed. |
| `authentication.labels.rtl` | "rtl" | "rtl" | "rtl" | Review phrasing carefully; replace with verified domain phrase if needed. |
| `authentication.labels.selectAccount` | "select_account" | "select_account" | "select_account" | Review phrasing carefully; replace with verified domain phrase if needed. |
| `authentication.labels.tc86b01` | "TC-86B-01" | "TC-86B-01" | "TC-86B-01" | Review phrasing carefully; replace with verified domain phrase if needed. |
| `authentication.labels.tc86b02` | "TC-86B-02" | "TC-86B-02" | "TC-86B-02" | Review phrasing carefully; replace with verified domain phrase if needed. |
| `authentication.labels.tc86b03` | "TC-86B-03" | "TC-86B-03" | "TC-86B-03" | Review phrasing carefully; replace with verified domain phrase if needed. |
| `authentication.labels.tc86b04` | "TC-86B-04" | "TC-86B-04" | "TC-86B-04" | Review phrasing carefully; replace with verified domain phrase if needed. |
| `authentication.labels.tc86b05` | "TC-86B-05" | "TC-86B-05" | "TC-86B-05" | Review phrasing carefully; replace with verified domain phrase if needed. |
| `authentication.labels.tc86b06` | "TC-86B-06" | "TC-86B-06" | "TC-86B-06" | Review phrasing carefully; replace with verified domain phrase if needed. |
| `authentication.labels.tc86b07` | "TC-86B-07" | "TC-86B-07" | "TC-86B-07" | Review phrasing carefully; replace with verified domain phrase if needed. |
| `authentication.labels.tc86b08` | "TC-86B-08" | "TC-86B-08" | "TC-86B-08" | Review phrasing carefully; replace with verified domain phrase if needed. |
| ... | *and 6946 more items in this queue* | | | |

