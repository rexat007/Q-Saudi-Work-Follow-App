# Q-Saudi Work Follow — وثيقة إعادة التأسيس المعماري

**الإصدار:** `ARCH-R1 / REVISION 1.2 — IMPLEMENTATION CONTRACTS COMPLETE / OWNER FINAL APPROVAL PENDING`  
**التاريخ:** 7 نوفمبر 2026  
**مصدر مراجعة الشيفرة:** `rexat007/Q-Saudi-Work-Follow-App`، الفرع `main`، عند Commit `cf7ac517be93492125c6dabad0ea38f291da7ed3`  
**الحالة:** اكتملت مواصفات التصميم المطلوبة للمرحلة الأولى، بما فيها مخطط PostgreSQL وعقود API والعمليات والترحيل وخطة وحدات التنفيذ. **هذه نسخة جاهزة لمراجعة المالك وليست تصريحًا بالتنفيذ**. لا تعديل إنتاجي ولا نشر للمستودع.  
**نطاق التفويض:** التصميم فقط؛ لا مشروع موازٍ، لا نموذج تجريبي، لا تعديل إنتاجي، لا نشر، لا ترحيل بيانات قبل اعتماد الوثيقة.

> **قرار حوكمي:** المشروع يمر بمرحلتين فقط: (1) اعتماد وثيقة التصميم وتحديد ما يُحتفظ به وما يُعاد تأسيسه واتخاذ قرار قاعدة البيانات؛ (2) تنفيذ الوثيقة على **المستودع الأصلي** بوحدات مرتبة وعمليات ترحيل آمنة. اختبارات التنفيذ ليست مرحلة لبناء نموذج بديل مرتين؛ بل بوابات تحقق طبيعية أثناء تنفيذ النظام النهائي.

## 1. ملخص القرار التنفيذي

### 1.1 القرارات المعمارية المقترحة للاعتماد

| رقم القرار | القرار المستهدف | الدافع | الأثر الملزم |
|---|---|---|---|
| AR-01 | **PostgreSQL** قاعدة البيانات التشغيلية الوحيدة بعد التحويل | العلاقات الزمنية، قيود التفرد، تاريخ الأسعار، التقرير العلاقي، الاستعلامات المفهرسة، التحكم بالكلفة | إنهاء الاعتماد التشغيلي على Firestore عقب ترحيل معتمد؛ لا مصدران قابلان للكتابة لحقيقة واحدة |
| AR-02 | **الاحتفاظ بـReact + TypeScript + Express/Node** وتطوير نفس المستودع | تجنب خسارة واجهات المستخدم ونقل المنتج أو تغيير التقنية دون سبب | الواجهة تُعاد مواءمتها مع API موحد، لا إعادة نسخ واجهات Fleetbase/Odoo |
| AR-03 | **الاحتفاظ بـFirebase Authentication مؤقتًا** كموفر هوية فقط | عدم فقد حسابات المستخدمين وإعادة التسجيل | التحقق من رمز الهوية خادميًا؛ الأدوار والسلطة التجارية في PostgreSQL؛ واجهة موفر الهوية قابلة للاستبدال لاحقًا |
| AR-04 | **PostgreSQL transaction + outbox** لكل عملية أعمال تؤثر في البيانات أو التكاملات | إزالة التحديثات الجزئية بين الهوية والعلاقات والإيصالات والمزامنة | أمر واحد ينتج تغييره وإيصاله والحدث الصادر في معاملة واحدة، دون اتصال Google داخلها |
| AR-05 | **Command/Query separation** بإسقاطات قراءة مقصودة لواجهات Foundation وFleet وDashboard | منع إعادة تحميل مشروع بكامل علاقاته لكل شاشة | لوحة التأسيس تقرأ ملخصًا صغيرًا؛ بيانات الأسطول الكاملة تُحمّل بصفحات عند الحاجة فقط |
| AR-06 | **الاحتفاظ بعقود الأعمال** للاستيراد والاستئناف والصلاحيات والعلاقات الزمنية والتسعير والمخزون والتقارير | العقود أصل معرفي ثمين بغض النظر عن خلل طبقة التخزين | تعاد كتابة المحولات والمستودعات، لا يُسقط أي ضمان وظيفي دون بديل مكافئ ومثبت |
| AR-07 | **Google Sheets وجهة إسقاط لاحق** عبر عامل خادمي محدود، وليست مصدر الحقيقة | تقليل حركة الشبكة والتكرار ومنع التعارض | إرسال تغييرات معتمدة فقط مع watermark وإيصالات وتسوية، لا مزامنة متواصلة من المتصفح |
| AR-08 | **IndexedDB + Outbox محلي** بعد تكييفه مع عقد أوامر API | العمل دون اتصال ضرورة تشغيلية | أوامر موقعة سياقيًا، مفاتيح idempotency، سياج إصدار؛ لا قرار تجاري نهائي من العميل |
| AR-09 | **عدم بناء مشروع موازٍ أو اختبار منتج بديل** | اختيار المالك | التنفيذ في نفس الشجرة البرمجية، مع نطاق إصدار وميزة تفعيل وترحيل مرتب |
| AR-10 | **عدم تشغيل نظامين أساسيين بكتابتين متوازيتين** | منع الاختلاف بين Firestore وPostgreSQL | تصدير/استيراد ثم تجميد كتابة مؤقت ومصالحة وقطع انتقال محكوم |

**حد القرار:** هذه قرارات تصميم نهائية مقترحة داخل الوثيقة، لكنها لا تتحول إلى تفويض تنفيذ أو تغيير لمرجع `main` إلا بعد موافقة المالك. الاعتماد النهائي لا يتطلب إنشاء نموذج تجريبي مستقل.

### 1.2 لماذا PostgreSQL وليس تعديل Firestore فقط؟

السبب **ليس** أن Firestore عاجز عن الأداء الجيد عمومًا. السبب أن نطاق هذا التطبيق يعتمد على علاقات كثيرة متشابكة: عضويات كل مشروع في كيانات عامة، علاقات سائق/شاحنة/ناقل/مادة عبر فترات زمنية، أوامر رحلات، مخزون وتسويات، تاريخ تسعير، مراجعة استيراد واستئناف. الشيفرة الحالية تكرر قراءة مجموعات وحساب إسقاطات Foundation عديدة. PostgreSQL يسمح بفرض قيود التطابق والتفرد والارتباط الزمني في قاعدة البيانات، وتجميع البيانات عبر فهارس واستعلامات وقياس `EXPLAIN ANALYZE`، وتحويل كلفة القراءة من فوترة لكل وثيقة إلى سعة قاعدة بيانات قابلة للرصد. **لا يعني القرار انعدام تكاليف الاستضافة أو الفهارس أو مهام التشغيل.**

### 1.3 حدود الدليل الحالي

- DATA-F1 منشور في `main` (تخفيض استدعاءات point-get داخل معاملات Firestore في اختبارات معزولة)، وDATA-LIVE-02 منشور (إعادة استخدام غلاف المعاملة في Foundation)، لكن اللقطات التشغيلية السابقة أظهرت ارتفاعًا في القراءات المفوترة عند فتح مشروع؛ الإسناد التفصيلي إلى كل استدعاء لم يثبت بالكامل.
- لا يوجد في هذه الوثيقة تشغيل تجريبي لـPostgreSQL أو قياس فعلي لزمن الاستعلام في النظام الجديد. الأهداف الواردة لاحقًا **شروط قبول مستهدفة** وليست نتائج منفذة.
- لم تُقرأ هنا كل أسطر ملفات المستودع الـ1,429؛ بُني تصنيف الملفات على قوائم المصدر والوثائق الحاكمة وفحص الخدمات ذات الصلة. قبل تعديل أي وحدة يجب إعادة مطابقة ملفاتها مع SHA المرجعي، لا إعادة اتخاذ التصميم.


### 1.4 بوابة مراجعة قاعدة البيانات — REVISION 1.1

**القرار الهندسي ADR-001:** اختيار PostgreSQL كقاعدة التشغيل الوحيدة بعد القطع؛ **Firestore لا يبقى مصدر أعمال ثانويًا ولا منصة كتابة تشغيلية**. إبقاء Firebase Authentication مؤقتًا يخص إثبات الهوية فقط، ويمنع فقدان حسابات المستخدمين؛ `users`, `project_access`, `company_roles`, `status` والسلطة التجارية في PostgreSQL. موافقة المالك مطلوبة قبل بدء المرحلة الثانية.

| معيار القرار | Firestore بإعادة نمذجة واسعة | PostgreSQL داخل الخادم الحالي | الحسم |
|---|---|---|---|
| أعضاء المشروع والهوية المشتركة والعلاقات الزمنية | يحتاج نماذج فهرسة/إسقاطات وعمليات تحقق تطبيقية متعددة | FK مركبة، UNIQUE، GiST/EXCLUDE، قيود ومعاملات | PostgreSQL أوضح وأقوى عند مستوى تخزين الحقيقة |
| فتح Foundation لمشروع كبير | ممكن بإسقاطات وثائق مشتقة مع انضباط شديد في invalidation | ملخص مفهرس + pagination واستعلامات محدودة | PostgreSQL أقل إعادة بناء للعلاقات وأيسر تدقيقًا |
| رحلات/أسعار/تاريخ/تقارير | تحتاج تجميعات أو إسقاطات إضافية | JOIN وGROUP BY وفهارس وخطط تنفيذ | PostgreSQL أنسب لنطاق التقارير العلائقية |
| العمل دون اتصال | SDK Firestore يوفر ميزات نافعة للعميل، لكن التطبيق لديه IndexedDB/Outbox خاص | يحتاج API وأوامر Outbox الموجود وإعادة وصل | تكلفة تكييف مدروسة؛ ليست ميزة تلقائية لـPostgreSQL |
| الحماية والعزل | Firestore Rules مع تفويض خادمي | تفويض خادمي + RLS + FK نطاق الشركة | كلاهما ممكن؛ PostgreSQL يضيف حواجز علائقية |
| التكلفة والقياس | فوترة قراءات/كتابات حسب سياسة الخدمة واستعلاماتها | تكلفة حوسبة/تخزين واتصالات وصيانة؛ قياس استعلامات مفصل | PostgreSQL يتيح تحكمًا أوضح، **لا** يضمن توفيرًا آليًا |
| الترحيل من النظام الحالي | لا ترحيل قاعدة، لكن يستلزم إصلاحًا هيكليًا شاملًا مع استمرار الاعتماد | ترحيل بيانات وعقود وخطر cutover | كلفة أولية أعلى ومحددة؛ تُدار في مرحلة التنفيذ فقط |
| النسخ المستقلة لكل شركة مستقبلًا | تتطلب بنية Firebase ومشاريع/اعتمادًا سحابيًا لكل جهة | قاعدة PostgreSQL داخل كل بيئة شركة مع API محلي | PostgreSQL أكثر اتساقًا مع اتجاه الاستقلال المستقبلي |

**لماذا لم نحتفظ بـFirestore؟** إعادة بناء read models والقيود في Firestore قد تحسن الأداء، لكنها تبقي طبقة حماية العلاقات الزمنية والتفرد والتسويات مركبة من عمليات التطبيق وفهارس وإسقاطات متشابكة. القرار هنا يتعلق **بملاءمة نموذج الأعمال على مدى عمر المنتج**، لا بإثبات أن Firestore سبب كل قراءة من الـ9K/12K الملاحظة. بقي الإسناد التفصيلي لتلك القراءات غير مثبت.

**ما الذي لا يتغير:** React/Express، وظائف اللغة والواجهة، عقود الاستيراد والرحلات والتسعير، وأسماء هوية السائق/الشاحنة/الناقل/المادة ومعنى العضويات والمشاركة بين المشاريع. الأنظمة المفتوحة مصادر تصميم لا قاعدة شيفرة أو اعتماد ترخيص.

**قيد جوهري:** لا تطبيق موازٍ ولا تجربة منفصلة. بيئات اختبار PostgreSQL، وتشغيل migrations في CI، وتجارب استعادة النسخ أثناء **تنفيذ النظام الأصلي** اختبارات إلزامية وليست «إعادة بناء ثانية». لا يُغيّر الإنتاج حتى تمر بوابة cutover واحدة.

## 2. مصادر الحقيقة وحوكمة القرار

1. المرجع البرمجي: GitHub `main` عند SHA المثبت؛ تُعاد مراجعته عند بدء التنفيذ إذا تغير SHA.
2. الحوكمة: `docs/reconstruction/01_ENGINEERING_CONSTITUTION.md` و`02_PHASE_LEDGER.md` و`05_DECISION_AND_DEBT_LOG.md` و`PRODUCT_RECONSTRUCTION_ACCEPTANCE_GOVERNANCE.md` و`PROJECT_GOOGLE_SHEET_SYNC_CONTRACT.md` و`OPERATIONAL_PROFILES_WORKSPACE_ENGINE_CONTRACT.md`.
3. المرجع التشغيلي: اختبار المالك في المتصفح/Render/Firebase أقوى من مجرد تقرير Studio. الحالات السابقة: Foundation النهائي **محجوب**؛ Phase 10 **لم يبدأ**.
4. هذه الوثيقة، إذا اعتمدت، **تعدل قرار طبقة التخزين المستقبلي صراحةً** الذي كان ينص على Firestore كمصدر الحقيقة، ولا تعيد كتابة السجل التاريخي أو تزعم أن البنية الجديدة مُنفّذة. يُضاف سجل قرار ADR وترتيب نسخ الوثائق عند التطبيق.
5. المناهج السابقة للنشر: قائمة GitHub Sync الحقيقية هي مرجع تغييرات Studio؛ ينشر Studio جميع الملفات الظاهرة. لا Push/PR/Merge من دون إجراء المالك حيث تطلب الحوكمة ذلك.

## 3. مراجعة النظام الموجود — ما هو موجود فعلًا

### 3.1 التقنيات الحالية

- واجهة React + TypeScript + Vite؛ خادم Express/Node/TypeScript، حزم `firebase` و`firebase-admin`، Google APIs، اختبارات Vitest، وخدمة Workbox/PWA.
- Firebase Authentication والتحقق الخادمي من الهوية؛ بيانات الأعمال الأساسية بـFirestore، مع تخزين IndexedDB محلي وخط أوامر Outbox.
- تكامل Google Workspace/Drive/Sheets عبر مشروع Google Blueprint وحالات Provisioning/Continuity/Sync Worker، مع بروتوكولات التاريخ والإيصالات.
- النشر الحالي يعتمد على Render بحسب اختبار التشغيل الذي قدمه المالك؛ تفاصيل بيئة الإنتاج والأسرار والنسخ الاحتياطي يلزم جردها قبل التنفيذ.

### 3.2 خريطة الخدمات الحالية

| مجال | ملفات مرجعية قائمة | ملاحظة تصميمية |
|---|---|---|
| مشروع/تأسيس | `src/services/projectCommands.server.ts`, `projectFleetQuery.server.ts`, `projectReadiness.server.ts`, `setupFleetQuery.server.ts` | Foundation يعيد سياقًا كبيرًا من عدة خدمات وعضويات وإسقاطات |
| هوية وعلاقات | `globalIdentityAuthority.server.ts`, `projectParticipationAuthority.server.ts`, `temporalRelationshipAuthority.server.ts`, `projectFleetReadModel.server.ts` | استقلال الهوية العامة عن مشاركتها في المشاريع مبدأ يجب حفظه |
| استيراد ذكي | `src/services/import/rosterExecution.server.ts`, `reviewedRosterCommit.server.ts`, `rosterCanonicalIntent.service.ts`, `src/services/importSessionArtifacts.server.ts` | التوقيع والمراجعة والإيصالات والسياج والاستئناف ضرورية |
| الرحلات | `tripCommands.server.ts`, `tripCommandTransaction.server.ts`, `tripStateMachine.service.ts`, `canonicalTripPersistence.server.ts` | قرارات الرحلات والتسعير يجب أن تظل خادمية وتاريخية |
| Offline | `src/services/offline/outbox.service.ts`, `offlineCache.service.ts`, `indexedDB.service.ts` | يُحتفظ بمسار العمل المنقطع، ويُعاد وصل التخزين والأوامر بالـAPI الجديد |
| Workspace | `projectGoogleWorkspace.server.ts`, `projectGoogleSheetEvent.server.ts`, `server/workspaceSyncCoordinator.ts`, `server/workspaceSyncWorker.ts` | Google Sheets إسقاط مشتق مع سياق ربط وموارد تاريخية يجب حفظها |
| التقارير/التسعير | `projectPricing.server.ts`, `operationalReporting.ts`, `reportsEngine.service.ts` | استعلامات ملخص مفهرسة وsnapshot تجاري لكل رحلة |
| API والأمن | `server/app.ts`, `server/security.middleware.ts` | الحفاظ على مدخل واحد للتوثيق والتفويض والتعامل مع أخطاء المجال |

**مثال مثبت من الشيفرة:** `ProjectFleetQueryService.foundation()` يبني قراءة إدارية وإسقاط إعداد وأسطول وتسعير وجاهزية في معاملة واحدة، ويعود بـ`SERVER_TRANSACTION_SNAPSHOT`. كما أن `ProjectCanonicalRefresh` يرسل طلب `/api/projects/:projectId/foundation-snapshot`؛ لهذا تُستبدل آلية تحميل الحالة، لا محتويات علاقة الشاحنة بالسائق.

## 4. المصادر المفتوحة — ما نستفيد منه دون نقل المنتج

| المرجع المفتوح | الأنماط المفيدة المثبتة في توثيقه | ما لا ننقله |
|---|---|---|
| **Fleetbase** | واجهة API مستقلة؛ حدود وحدات تشغيل؛ عامل مهام وQueue؛ قاعدة بيانات علائقية؛ فصل الواجهة عن الخادم | لا نقل Ember/Laravel أو شيفرة AGPL إلى المنتج المغلق دون مراجعة حقوق الترخيص |
| **OCA stock-logistics-transport** | الكيان التشغيلي Vehicle/Driver/Route/Trip؛ أوامر شحن وتحميل وتفريغ ومخازن وأرصفة | لا نقل نظام Odoo ولا استبدال هوية Q-Saudi ونموذج مشاريعه |
| **Frappe/ERPNext** | فصل Jobs ذات الأثر الطويل عن استجابة المتصفح؛ مرحلة enqueue بعد نجاح المعاملة؛ عمليات ERP وتقرير مركزي | لا إعادة بناء النظام بإطار Python ولا استيراد مخطط ERP بأكمله |
| **PostgreSQL** | قيود FK وUNIQUE وEXCLUDE، وفهارس بتركيب مفاتيح، وRow-Level Security، والتحقق بـEXPLAIN، ومعاملات ACID | لا افتراض أن RLS وحده يزيل الحاجة إلى التفويض الخادمي |

**ترخيص:** الاستلهام من الأفكار العامة لا يساوي نسخ شيفرة تنفيذية. قبل نسخ أي ملف/مكوّن مفتوح المصدر تُراجع رخصته الفردية والاشتقاق والاستخدام التجاري، وتُوثّق الموافقة. في هذه الخطة لا توجد حاجة لنسخ شيفرة Fleetbase أو OCA.

مصادر قابلة للمراجعة:
- Fleetbase architecture: https://fleetbase.io/docs/platform/getting-started/architecture
- Fleetbase licensing: https://fleetbase.io/docs/community/licensing
- OCA transport modules: https://github.com/OCA/stock-logistics-transport
- Frappe jobs: https://docs.frappe.io/framework/user/en/api/background_jobs
- PostgreSQL constraints/RLS: https://www.postgresql.org/docs/17/ddl-constraints.html وhttps://www.postgresql.org/docs/17/ddl-rowsecurity.html

## 5. مصفوفة الاحتفاظ وإعادة التأسيس

`RETAIN_AS_IS` لا يعني ضمان خلو الوحدة من أي خلل؛ يعني أن وظيفتها ودورها لا يتغيران في التصميم. كل ملف إنتاجي يتغير عبر اختبار عقد وخريطة ترحيل.

| المجال/الوحدة | التصنيف | ما يبقى | ما يتغير |
|---|---|---|---|
| React UI + ترجمات ar/en/ur + responsive | `RETAIN_AND_ADAPT` | تجربة المستخدم والتنقل والمكونات المعتمدة | استخدام API/Query hooks مستقرة، عدم استدعاء مستودعات البيانات من الواجهة |
| Firebase Auth + الحسابات | `RETAIN_AND_ADAPT` | UID والحسابات وسياق الدخول | الأدوار والمشاركة من PostgreSQL؛ واجهة موفر هوية قابلة للاستبدال لاحقًا |
| قواعد الصلاحيات والـprincipal | `RETAIN_AND_ADAPT` | الأدوار، التفويض، fail-closed، audit | نقل السلطة التجارية والقرار إلى مستودعات SQL داخل نفس المعاملة |
| النطاق العام Carrier/Material/Driver/Truck | `RETAIN_AND_ADAPT` | الهوية الموحدة للشركة والمشاركات المتعددة بين المشاريع | الجداول وعلاقات FK وقيود natural-key والتاريخ |
| Project Foundation / Setup | `REBUILD_IN_PLACE` | مراحل التأسيس، جاهزية الاعتماد، التشغيل والصلاحيات | استبدال استعلامات إعادة بناء السياق بإسقاط صغير + قوائم مفهرسة عند الطلب |
| Fleet Read Model / ProjectFleetQuery | `REBUILD_IN_PLACE` | عقد المخرجات اللازمة لكل مرحلة | مستودعات SQL محددة ونطاق الاستعلام، واجهات جاهزة بلا full scans |
| Smart Import parsing/normalization/review | `RETAIN_AND_ADAPT` | Excel/CSV وخرائط الأعمدة وكشف التكرار والمراجعة | التخزين الدائم وtransaction commit والـdedup على SQL |
| Smart Import durable sessions/receipts/fencing | `REBUILD_IN_PLACE` | معاني التوقيع والاعتماد والاستئناف والإيصالات | جداول version/fence/operation + معاملات قابلة للإعادة دون تكرار نتيجة |
| Temporal assignment/allocation | `REBUILD_IN_PLACE` | منع التعارض، التاريخ، displaced counterpart، فشل آمن عند فساد بيانات | `tstzrange` + `EXCLUDE` + أوامر مؤمنة بالقفل والتاريخ |
| Trip command/state/weight/pricing | `RETAIN_AND_ADAPT` | آلية الأوامر وتاريخ الأسعار وأوزان فارغ/محمل/مفرغ | مستودع SQL، سلسلة أحداث، بيانات Snapshot لكل رحلة |
| Offline IndexedDB/Outbox | `RETAIN_AND_ADAPT` | العمل المنقطع والعودة بعد الاتصال ومفاتيح العمليات | عقود الإرسال ونسخ بيانات العرض وإبطالها؛ عدم حذف Cache بتحميل جزئي |
| Workspace / Sheets / Drive | `REBUILD_IN_PLACE` لطبقة النقل و`RETAIN_AND_ADAPT` للعقود | resource IDs, OAuth, blueprint, continuity, report ownership, user permissions | outbox/worker من DB؛ تحديثات تغيّرية وحالة backlog؛ عدم التزامن المتكرر من واجهة المستخدم |
| Reports/dashboard | `REBUILD_IN_PLACE` لمحرك التجميع | أسماء التقارير ومقاييس الرحلات والعمليات | SQL materialized/read models وQueries محددة ومؤشرات متابعة |
| Firestore operational repositories | `REPLACE_DEPENDENCY` | البيانات السابقة لأغراض الترحيل والتحقق والأرشفة | تنتهي كمصدر تشغيل بعد القطع؛ تُبقي نسخة احتياطية مقيدة القراءة |
| أدوات Firestore cache (`txReadCache`) | `RETIRE_WITH_PROVEN_EQUIVALENCE` | لا تتطلب الاحتفاظ بها بعد غياب SDK من المسار النهائي | يُحذف الاعتماد عليها بعد إثبات تكافؤ العمليات على SQL |
| GitHub governance / tests | `RETAIN_AND_ADAPT` | السجلات والبوابات والعقود والاختبارات | إضافة اختبارات معاملات SQL وRLS والهجرة والضغط وإغلاق مسارات Firestore القديمة |


### 5.1 التثبيت العملي لمصفوفة الاحتفاظ/إعادة التأسيس

بعد مطابقة خدمات Q-Saudi عند `cf7ac517be93492125c6dabad0ea38f291da7ed3`، يكون نطاق التنفيذ **على الملفات الموجودة** وليس بناء طبقات أعمال مكررة:

| الملفات/الحدود | القرار الملزم | معيار الإبقاء/التحويل |
|---|---|---|
| `src/services/projectFleetQuery.server.ts`, `setupFleetQuery.server.ts`, `projectFleetReadModel.server.ts` | `REBUILD_IN_PLACE` | التخلص من تجميع كامل الهويات عند مجرد فتح المشروع؛ فصل summary عن القوائم، مع تكافؤ جاهزية التأسيس والأدوار |
| `src/services/globalIdentityAuthority.server.ts`, `projectParticipationAuthority.server.ts`, `temporalRelationshipAuthority.server.ts` | `RETAIN_AND_ADAPT` للقواعد و`REBUILD_IN_PLACE` للوصول إلى البيانات | نقل نفس فشل الصلاحيات والتفرد والتعارض الزمني إلى أوامر SQL وقيود قاعدة، مع حفظ الهوية عبر المشاريع |
| `src/services/import/rosterCanonicalIntent.service.ts`, `import/rosterExecution.server.ts`, `import/reviewedRosterCommit.server.ts` | `RETAIN_AND_ADAPT` لمواصفات التوقيع و`REBUILD_IN_PLACE` للاستمرار والمعاملات | عدم تغيير acceptedSignature أو fencing/receipts عند إعادة المحاولة أو ضياع الرد؛ تحويل مستودعات Firestore فقط |
| `src/services/tripCommands.server.ts`, `tripCommandTransaction.server.ts`, `projectPricing.server.ts` | `RETAIN_AND_ADAPT` للأوامر/التسعير؛ `REBUILD_IN_PLACE` لتنفيذها ذريًا | لا إعادة تسعير للرحلات القديمة، ولا تغيير فرض وزن التحميل والتفريغ، ولا كتابة غير مصرح بها |
| `src/services/offline/offlineCache.service.ts`, `offline/outbox.service.ts` | `RETAIN_AND_ADAPT` | إبقاء الأوامر المؤجلة وهوية الجهاز والقفل بين المستخدم/المشروع وتجنب حذف البيانات عند snapshot جزئي |
| `src/services/projectGoogleWorkspace.server.ts`, `server/workspaceSyncCoordinator.ts`, `server/workspaceSyncWorker.ts` | `RETAIN_AND_ADAPT` للـOAuth وresource binding، `REBUILD_IN_PLACE` لمنظومة إسقاط العمل | لا إعادة إنشاء مجلدات/جداول موجودة؛ لا نشاط من المتصفح عند الخمول؛ إشعارات بعد Commit لا داخل المعاملة |
| `src/utils/txReadCache.ts` ومداخل Firebase Firestore repositories | `RETIRE_WITH_PROVEN_EQUIVALENCE` بعد cutover فقط | لا حذف مبكر أو إصلاح موضعي جديد؛ حسم مصدر التخزين يمنع احتياجه في المسار النهائي |
| `src/components`, `src/locales`, `src/types` وواجهات المستخدم | `RETAIN_AND_ADAPT` | الحفاظ على العربية والإنجليزية والأردية ومراحل العمل، مع تحويل مصدر البيانات خلف واجهات/مهايئات محددة |
| `docs/reconstruction`, `src/tests` | `RETAIN_AND_ADAPT` | لا طمس السجل التاريخي؛ نقل اختبارات القواعد من mock Firestore إلى قاعدة SQL فعلية وE2E |

**فصل سلطة العرض عن سلطة القرار:** `foundation-summary` و`fleet?cursor` مخصصان للقراءة ولا يؤهلان أمرًا تجاريًا. أوامر الموافقة والاستيراد والإسناد والتسعير تعيد قراءة الحقائق الملزمة داخل SQL transaction وتحت القيد والتفويض المعتمدين. لا تُستنسخ قواعد المجال في JavaScript العميل.

## 6. البنية التشغيلية المستهدفة

```text
Browser / PWA (React + TypeScript)
  ├── Foundation Summary Query (small, project-scoped)
  ├── Fleet/Roster paginated queries
  ├── Command API (mutations only)
  └── IndexedDB offline commands & scoped snapshots
             │ HTTPS / authenticated versioned API
             ▼
Existing Node/Express Backend (same repository)
  ├── Auth adapter (Firebase token verification now; provider-neutral later)
  ├── Authorization / Company + Project scoped principal
  ├── Domain command services (Project, Fleet, Import, Trip, Pricing)
  ├── Read services (Foundation, Fleet, Reports)
  ├── SQL repositories + Unit of Work + schema validation
  └── Transactional Outbox / Idempotency / Audit
             │
             ▼
       PostgreSQL 17 (single canonical writer)
          ├── Canonical normalized tables + temporal constraints
          ├── Append-only events / snapshots / receipts
          ├── Query projections and summary tables
          └── Work/Integration job queue
             │ after COMMIT (independent worker)
             ▼
    Google Sheets / Drive / Reports exports
```

**نطاق الشركة مستقبلًا:** الخطة المستقبلية في `FUTURE_ARCHITECTURE_AND_DISTRIBUTION_DIRECTION.md` تتصور تثبيتًا مستقلًا لكل شركة. لهذا نُعرّف `company_id` في عقود الأعمال منذ البداية، مع إمكان امتلاك كل شركة قاعدة بيانات مستقلة عند إصدار نسخة قابلة للتثبيت. داخل شركة واحدة تشترك المشاريع في هوية الكيانات وتنفصل بالمشاركات، أما شركتان مستقلتان فلا تتشاركان قاعدة أعمال افتراضيًا.

### 6.1 التقنيات المقترحة

- PostgreSQL **17** إصدارًا مرجعيًا للتصميم وSQL migrations، مع `btree_gist` للقيود الزمنية. PostgreSQL 18 متاح أيضًا في وقت هذه المراجعة؛ لا يحتاج التصميم إلى خاصية خاصة بـ18. يمكن اختيار 18 في نشر المرحلة الثانية بعد تحقق توافق الاستضافة والامتدادات والنسخ الاحتياطي، دون إعادة اتخاذ قرار محرك قاعدة البيانات.
- مكتبة `pg` (اتصالات parameterized وpool) وملفات SQL migrations مرتبة ومرقمة؛ اختيار أداة تطبيق SQL migration محددة في أول وحدة من المرحلة الثانية دون تغيير تصميم الجداول أو العقود.
- PostgreSQL transactional work queue (`FOR UPDATE SKIP LOCKED`, lease, retry, backoff, dead-letter) كبداية؛ **لا نضيف Redis لمجرد التشابه مع Fleetbase**. يمكن إدخاله لاحقًا إذا أثبتت أحمال الإنتاج ضرورة وظيفية.
- احتفاظ بالسيرفر Express/Node ونشر خادم API وعامل Jobs منفصلين من نفس المستودع والحزمة. لا استدعاءات Google داخل معاملة SQL.
- نسخة production DB تدعم PITR، وخزن ملفات خارجي اختياري للملفات الكبيرة، ومقاييس PostgreSQL وAPI.

## 7. نموذج البيانات العلائقي — النسخة الملزمة

### 7.1 مجموعات الجداول

**الحوكمة:** `companies`, `users`, `user_company_roles`, `projects`, `project_access`, `audit_events`, `schema_migrations`, `migration_runs`.  
**الكيانات العالمية داخل الشركة:** `carriers`, `materials`, `drivers`, `trucks`, `identity_keys`, `identity_key_reservations`.  
**المشاركات/العلاقات:** `project_carriers`, `project_materials`, `project_drivers`, `project_trucks`, `driver_carrier_affiliations`, `truck_carrier_affiliations`, `driver_truck_assignments`, `truck_material_allocations`.  
**العمليات:** `trips`, `trip_events`, `trip_weight_records`, `receipts`, `exceptions`, `pricing_rules`, `trip_price_snapshots`, `operational_adjustments`.  
**الاستيراد:** `import_sessions`, `import_source_artifacts`, `import_row_decisions`, `import_execution_groups`, `import_execution_receipts`, `idempotency_receipts`.  
**التكاملات والتقارير:** `outbox_events`, `worker_jobs`, `workspace_bindings`, `workspace_sync_receipts`, `project_foundation_summaries`, `report_snapshots`.

**قاعدة عامة:** `id` داخلي مستقر غير قابل لإعادة الاستخدام، و`legacy_id`/`source_ref` للتتبع؛ حقول الزمن `timestamptz` وحفظ الأوزان في وحدات دقيقة وواضحة (مثل `weight_kg` برقم صحيح أو `numeric` ثابت، وليس `float` للمال/الكمية المعتمدة)، وحفظ البيانات التجارية التاريخية منفصلة عن الملف العالمي المتغير.

### 7.2 العلاقات الأساسية

```text
company 1 ── N projects
company 1 ── N global carriers / drivers / trucks / materials
project N ── N global identities (via membership tables, with effective periods)
project 1 ── N trips
trip N ── 1 carrier, driver, truck, material (snapshot at command commit)
truck/driver ── N historical assignment periods
truck ── N historical material allocation periods
project 1 ── N pricing rule versions
import session 1 ── N reviewed groups ── N durable receipts
committed business transaction 1 ── N transactional outbox events
```

### 7.3 القيود ومثال SQL توضيحي (المثال المحدّث 1.2)

**قيود ملزمة في التطبيق النهائي:**

- كل مرجع مشروع إلى كيان عالمي يجب أن يتحقق من انتمائه إلى الشركة ومن عضوية فعالة في المشروع عند وقت الأمر.
- الـnatural key الموحد مثل إقامة السائق أو رقم لوحة السيارة، بعد التطبيع، فريد **داخل الشركة** حيث يوجد مفتاح صالح؛ عند وجود تكرار تاريخي لا يتم الدمج الصامت: يُنشأ سجل تسوية استثنائية قبل فرض القيد.
- لا تتداخل فترات إسناد سائق لشاحنة أو شاحنة لسائق في نفس الشركة؛ إن كان تاريخ التطبيق الحالي يسمح بتداخل مشروعين تجاريًا يجب تصنيف السجلات القديمة ومعالجتها صراحة عند الترحيل، لا محوها.
- لا تتداخل تخصيصات مادة فعالة للشاحنة نفسها. التاريخ لا يُغيّر دون حدث تعديل مصرح به وإيصال.
- مفاتيح الطلبات `operation_id` و`(company_id, project_id, idempotency_key)` فريدة لمنع تكرار الكتابة عند ضياع الرد وإعادة المحاولة.

```sql
-- DDL ILLUSTRATION, not a complete executable migration.
CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE driver_truck_assignments (
  id uuid PRIMARY KEY,
  company_id uuid NOT NULL,
  project_id uuid NOT NULL,
  driver_id uuid NOT NULL,
  truck_id uuid NOT NULL,
  valid_period tstzrange NOT NULL,
  record_status text NOT NULL CHECK (record_status IN ('ACCEPTED','VOIDED')),
  voided_at timestamptz,
  CHECK (NOT isempty(valid_period)),
  CHECK ((record_status = 'ACCEPTED' AND voided_at IS NULL) OR
         (record_status = 'VOIDED' AND voided_at IS NOT NULL))
  -- Composite tenant FKs to company/project/member tables are required
  -- in the full SQL migration and omitted from this illustrative fragment.
);

ALTER TABLE driver_truck_assignments
  ADD CONSTRAINT one_driver_per_period
  EXCLUDE USING gist (company_id WITH =, driver_id WITH =,
                      valid_period WITH &&)
  WHERE (record_status = 'ACCEPTED' AND voided_at IS NULL);

ALTER TABLE driver_truck_assignments
  ADD CONSTRAINT one_truck_per_period
  EXCLUDE USING gist (company_id WITH =, truck_id WITH =,
                      valid_period WITH &&)
  WHERE (record_status = 'ACCEPTED' AND voided_at IS NULL);

CREATE INDEX idx_assignments_project_driver
  ON driver_truck_assignments(company_id, project_id, driver_id);
```

**تنبيه:** يعكس المثال معيار حفظ التاريخ المعتمد حتى بعد انتهاء فترة العلاقة. لا يُعتبر جدولًا كاملًا قابلًا للنشر؛ قيود FK المركبة، سجل الإبطال، سياسة RLS وسياق الطلب تُحكم في مواصفات 17–23 أدناه. لا تُلغى علاقة قديمة بتغيير حالة التشغيل من ACTIVE إلى CLOSED؛ انتهاء `valid_period` عملية مختلفة عن إبطال سجل تاريخي.

### 7.4 العزل الأمني

- استعلامات كل خدمة تجارية تحتوي `company_id` و`project_id` عند اللزوم؛ لا عميل يتصل بـPostgreSQL مباشرة.
- التحقق من UID صالح عبر موفر الهوية ثم استخراج أدوار الشركة والمشروع من القاعدة داخل العملية الخادمية؛ المستخدم غير النشط/المحظور يفشل مغلقًا.
- تشغيل RLS كدفاع إضافي `FORCE ROW LEVEL SECURITY` لجداول النطاق، مع `SET LOCAL app.company_id` و`SET LOCAL app.actor_id` في كل transaction. مستخدم تطبيق غير مالك للجدول ولا يملك BYPASSRLS. اختبارات تحقق اختراق المشروع واجبة.
- الأحداث وسجلات التدقيق تتضمن UUID العملية والفاعل والزمن والـrow version دون تخزين كلمات مرور أو رموز Google.


### 7.5 قواعد تنفيذ Schema لا يجوز تأجيل قرارها للمرحلة الثانية

1. **حد الشركة والمشروع:** لكل جدول تشغيل `company_id`، وكل سجل مرتبط بمشروع يتضمن `project_id` مع مفتاح أجنبي مركب إلى `projects(company_id, id)`؛ العضوية تُثبت بواسطة FK مركبة أو فحص أمر خادمي ذري حين تكون صلاحيتها زمنية. مجرد وجود `project_id` في JSON لا يساوي عزلًا.
2. **الهوية القديمة:** يحتفظ كل سجل بـ`legacy_firestore_path`/`legacy_id` ومفتاح الربط (unique ضمن نوع الكيان والشركة). تعيين الشركة الأولى للهويات القديمة يعتمد على جرد يثبت نطاق ملكيتها، **لا** تقسيم تلقائي أو دمج بين شركتين.
3. **المفاتيح الطبيعية الحساسة:** تستخدم الهوية المعيارية مفتاحًا فريدًا في نطاق الشركة، مع تخزين الحقول الحساسة مشفرة ومنع نشر رقم الإقامة/الهاتف داخل logs. يمكن استخدام بصمة HMAC مفاتيح مفصولة لكل نوع لمطابقة مُفوَّضة؛ لا Hash غير محمي لرقم هوية قابل للتخمين.
4. **التاريخ الزمني:** نحتاج منع التعارض في كل فترات الإسناد المعتمدة حتى بعد انتهائها؛ شرط `WHERE state='ACTIVE'` الوارد في مثال 7.3 **لا يكفي بمفرده** إذا تحول صف من ACTIVE إلى SUPERSEDED مع بقاء فترة تاريخية معتمدة. النموذج التنفيذي يفصل `valid_period` و`record_status` (معتمد/باطل)، ويطبق EXCLUDE على الفترات المعتمدة غير المبطلة، أو ينقل سجل التاريخ إلى جدول append-only بقيود مكافئة. لا يسمح بإصلاح تاريخ فاسد بصمت.
5. **حد المعاملة:** كل أمر مؤثر يولد تغيير المجال + سجل تدقيق + receipt/idempotency + outbox في معاملة SQL واحدة. لا ينتظر Google Sheets أو شبكة خارجية داخل SQL transaction. التنازع المغلق يحكمه `UNIQUE`, `EXCLUDE`, FK, version وlocks، ومعاملات عالية الخطورة تستخدم `SERIALIZABLE` حيث يلزم مع إعادة محاولة **محددة** لأخطاء التسلسل فقط، مع الرجوع لحقيقة receipt عند غموض نجاح commit.
6. **الصفحات والملخص:** واجهة Foundation لا تسترجع كل أعضاء المشروع. SQL query لـsummary ثابتة التعقيد تقريبًا بالنسبة إلى عدد الشاحنات؛ صفحة الأسطول keyset بترتيب مستقر، و`limit ≤ 50` مبدئيًا. إسقاط متأخر لا يمثل حجة لقرار أمر.
7. **RLS:** تُفعّل على الجداول المؤهلة مع حساب خدمة غير مالك ولا يملك `BYPASSRLS`، و`SET LOCAL` متضمنًا الشركة والمستخدم في **المعاملة نفسها**؛ لا يوضع actor/tenant في state عام للـPool. `FORCE RLS` حماية إضافية لا تغني عن التفويض ورفض project ID المتلاعب به.
8. **المصادر التاريخية:** عدم حذف سجلات import/receipts/worker delivery وأسماء موارد Workspace التاريخية. بعد القطع Firestore أرشيف مقيد القراءة للترحيل/التحقق فقط، وليس مصدرًا تكامليًا حاليًا.
9. **أعمدة المال والوزن:** مبلغ/ضريبة `numeric` بدقة ثابتة وتوحيد العملة، أوزان كيلوغرام بمعامل واضح، قياسات الميزان الأصلية منفصلة عن الكمية المعتمدة؛ لا floats للمال.
10. **اختيار خدمة الاستضافة:** محرك القاعدة محسوم؛ مزود PostgreSQL (Render managed أو بديل مطابق)، سياسة PITR، حدود الاتصال، نسخ الاحتياطي، وأدوات الهجرة التشغيلية تفاصيل تهيئة **تُنفذ داخل نفس المرحلة الثانية** دون فتح مقارنة جديدة بين قواعد البيانات.

مرجع سلامة القيود: PostgreSQL 17 `UNIQUE/FK/EXCLUDE`؛ الحماية: PostgreSQL 17 RLS و`FORCE`؛ العزل: معاملات PostgreSQL `READ COMMITTED` ليست snapshot موحدة لجميع الاستعلامات داخل معاملة طويلة، لذا يلزم اختيار isolation والقيود حسب حالة الأمر.

## 8. العقود التشغيلية الرئيسية

### 8.1 Project Foundation — علاج السبب الهيكلي

لا تعيد شاشة Foundation حساب كل الأسطول عند الدخول. **الملخص الصغير** يشمل معلومات المشروع، حالة التأسيس، الإصدار، صلاحية الفاعل، تقدم المراحل، أعداد الناقلين والمواد والسائقين والشاحنات، جاهزية الحسابات والتسعير، ومؤشرات Workspace. تفاصيل أسطول/عضويات/تاريخ تُحمّل لكل شاشة بصفحات وحسب الحاجة.

- `GET /api/v2/projects/:id/foundation-summary` — استعلام مفهرس/ملخص بحد بيانات مقيد، `ETag`/`revision` واضح، لا N+1 على هويات الأسطول.
- `GET /api/v2/projects/:id/fleet?cursor=&limit=50` — صفحات مرتبطة بالمشروع؛ إرجاع مؤشرات مرجعية، لا تاريخ العلاقات كله.
- `GET /api/v2/projects/:id/setup/:stage` — تفاصيل المقطع المقصود.
- `POST /api/v2/projects/:id/commands/...` — تغييرات مؤمنة بـ`expected_revision` وidempotency.

جداول الملخص المشتقة تُحدّث داخل **نفس معاملة** تغيير الأعمال أو بأحداث outbox مع علامة `pending` صريحة. لا تُستعمل إسقاطات متأخرة كحجة لاعتماد أمر أو حق تعديل. إعادة تحميل كاملة لمشروع ذي 1,000 شاحنة غير مقبولة عند مجرد فتح Foundation.

### 8.2 الهوية العالمية والمشاركات الزمنية

Driver/Truck/Carrier/Material لها هوية واحدة داخل الشركة، والمشاركة عبر مشاريع متعددة تتم بجداول أعضاء مستقلة. حقوق التعديل ومدة الصلاحية والانتساب للناقل تربط بالمشروع والزمن. أي قرار إسناد يستخدم المعاملة وقاعدة الوقت الحالية ومجموعة القيود وليس إسقاط الواجهة. `displaced counterpart` يُقرأ ويُصادق عليه قبل التبديل؛ لا إصلاح صامت لبيانات فاسدة.

### 8.3 الاستيراد الذكي

1. استقبال المصدر كـartifact ثابت مع hash وprovenance، وتحليل ملفات Excel/CSV دون كتابة كيانات تشغيلية.
2. حفظ نسخة `import_session` وقرارات التصحيح/المطابقة ومفاتيح الهويات المرشحة وتوقيع نية المراجعة.
3. بناء خطة التنفيذ على الخادم وإلزام `expected_version` و`reviewed_signature` و`fence`.
4. تنفيذ مجموعات معاملة بحجم محدود: فحص التفرد/المشاركات والتعارضات، كتابة العمليات المعتمدة و`import_execution_receipts` وحدث outbox واحد أو أكثر، ثم commit.
5. بعد ضياع الرد، يعيد العميل قراءة حقيقة الإيصال؛ لا يعيد مجموعة منفذة. بعد إعادة تشغيل السيرفر، يقرأ السجل الدائم ويستأنف ضمن السياج نفسه.
6. خطأ الهوية أو الصلاحيات أو التوقيع يفشل مغلقًا، ولا يخلق حسابًا أو عضوية تلقائيًا أثناء عطل الشبكة.

تظل قواعد `PROFILE_UNAVAILABLE` مقابل `NO_PROFILE` والتعامل مع إلغاء العملية والـlegacy session محفوظة؛ السجلات التاريخية تُرحّل مع `operation_id`, `version`, `receipt` وتوثيق حالة الحجب.

### 8.4 الرحلات والميزان والتفريغ

- دورة العمل: مصدر تحميل ← وزن فارغ ومحمل وزمنهما ← تعيين الناقل والسائق والشاحنة والمادة ← رحلة معتمدة ← وصول المستودع ← بداية/نهاية التفريغ ← وزن مفرغ/استلام ← تسوية/استثناء.
- تخزين الوقائع الخام كما وردت من الميزان مع timestamps ووزن وحدة القياس و`source_file_hash`، وعدم استبدال قياسات المصدر بسبب تصحيح لاحق دون audit.
- `trip_events` إضافة تاريخية، و`trips.current_state` إسقاط تشغيلي مادي من الحدث الأخير؛ تطبيق state machine خادمي داخل نفس transaction.
- أوامر التسعير تلتقط `pricing_rule_version`, `tariff_snapshot`, units and quantity at the moment of trip pricing. لا إعادة تسعير رحلات قديمة عند تغيير قواعد المستقبل.

### 8.5 Offline + IndexedDB

- نستبقي IndexedDB كواجهة قراءة محلية وأوامر Outbox. لا يعتبر العميل حكمًا نهائيًا في الأسماء الفريدة أو العضويات أو التسعير أو التعارض الزمني.
- `operation_id` فريد، `device_id` و`actor_id` و`company_id` و`project_id` و`expected_revision` و`payload_schema_version` جزء من ظرف الأمر.
- `sync` يعالج الأوامر بترتيب قانوني مع ACK/REREAD؛ فشل الصلاحيات أو تعارض النسخة يعرض خطأ واضحًا ويحتاج إجراء مستخدم، ولا يعيد محاولة عشوائية لا نهائية.
- Snapshot محلي جزئي لا يحذف مجموعات غير موجودة بسبب الصفحة/الفلتر؛ `fullSnapshot` و`completeThrough` flags مطلوبة. عند logout أو تبديل المستخدم/المشروع تُفرغ المساحات المصنفة بيانات حساسة ويحظر تسربها بين السياقات.

### 8.6 Google Sheets / Workspace

- تبقى Binding IDs وDrive Folder وSpreadsheet وScript IDs والتفويض والـBlueprint ونسخ القوالب التاريخية مرجعًا لا يُعاد إنشاؤه أثناء الترحيل.
- عند Commit أمر عمل تُكتب `outbox_events` في نفس المعاملة، يحمل eventId وprojectId وrevision وpayload minimized.
- عامل خادمي يأخذ أحداثًا مع lease و`FOR UPDATE SKIP LOCKED`، يجمّعها بفترات وحدود، ويحدث Google Sheets بفروق فقط؛ يسجل delivery receipt وwatermark ويعيد المحاولة بتأخير، مع سقف استدعاءات ومراقبة quota.
- لا يستدعي المتصفح Google Sheets مباشرة لحفظ حقيقة أعمال؛ ولا تتسبب mount/focus/visibility في sync بلا حدث. التقارير المشتقة الثقيلة تُحدث بعملية صريحة أو job مضبوط.
- إذا فشل Google Sheets يستمر مصدر الحقيقة في PostgreSQL وتظهر حالة إسقاط متأخر؛ لا تُعاد كتابة أمر أعمال أو تضاعف رحلة بسببه.

## 9. بوابات API والأخطاء والاستجابة

**أنماط API الملزمة:**

| العملية | الـendpoint المستهدف | ضمانات |
|---|---|---|
| Foundation summary | `GET /api/v2/projects/{id}/foundation-summary` | project scope + revision، لا heavy projection |
| Fleet list | `GET /api/v2/projects/{id}/fleet?cursor=...` | keyset pagination، حد أقصى معلوم |
| Fleet mutation | `POST /api/v2/projects/{id}/fleet/commands` | transaction، RBAC، idempotency، temporal constraints |
| Start import | `POST /api/v2/projects/{id}/imports/{sid}/executions` | reviewed intent، expectedVersion، operationId |
| Advance import | `POST /api/v2/projects/{id}/imports/{sid}/executions/{oid}/advance` | fence، transactional receipts، recovery |
| Import status | `GET /api/v2/projects/{id}/imports/{sid}/executions/{oid}` | durable receipt truth |
| Trip command | `POST /api/v2/projects/{id}/trips/commands` | server state machine + pricing snapshot |
| Workspace | `GET /api/v2/projects/{id}/workspace/status` | bounded read, no auto-sync side effect |
| Reports | `GET /api/v2/projects/{id}/reports/{name}` | indexed/paginated snapshot مع تحديث واضح |

**الأخطاء:** HTTP 401 للتوثيق، 403 للتفويض، 404 لإخفاء موارد خارج النطاق حيث يلزم، 409 للنسخة/التعارض، 422 للمدخلات، 429 للتكرار/القيود؛ أكواد مجال ثابتة داخل body. لا إرجاع stack أو PII.

## 10. أداء وتكلفة وقابلية توسع — معايير قبول مقترحة

تُثبت قبل التنفيذ كأهداف هندسية، ويُعدّلها المالك في اعتماد التصميم إن لزم. **ليست نتائج تم اختبارها بالفعل.**

| السيناريو | هدف القبول | طريقة البرهان في التنفيذ |
|---|---|---|
| دخول مشروع/لوحة Foundation | طلب summary أساسي واحد لكل generation، لا 3 طلبات متطابقة؛ `p95 ≤ 1s` تحت حمل القبول | traces API، browser Network، query count/latency |
| نمو 24 → 100 → 1,000 شاحنة | عدد SQL queries لفتح summary شبه ثابت؛ لا O(N) hydration للملفات العالمية | query logs, EXPLAIN ANALYZE، dataset واقعي |
| GET Foundation summary | سقف أولي **≤ 12 SQL statements** في المسار الاعتيادي، لا نقل قوائم كاملة | instrumentation ثابت + test gate |
| Fleet paging | صفحة ≤ 50، مع مؤشرات صحيحة وتغيير مشروع آمن | SQL plans وقياس حجم الاستجابة |
| استيراد 1,000 صف | لا تكرار عمليات/إيصالات؛ يكتمل ضمن SLA يعتمد بعد حجم الملف والمستخدمين | اختبارات تشغيل وقاعدة بيانات حقيقية، وليس mocks فقط |
| تشغيل متزامن | لا نسخ هوية أو علاقات متداخلة، وتفسير conflicts | tests ضد PostgreSQL concurrent transactions |
| خمول المستخدم | **صفر polling API دوري غير لازم**؛ لا كتابة/قراءة Sheets في الخمول دون pending jobs | browser + backend counters + job ledger |
| Google Sheets | صفر dual-write؛ سقف محاولات عامل مضبوط، receipt/watermark لكل event | اختبار quotas/failure/retry |
| انقطاع الشبكة | عدم فقد أو تكرار الأوامر والإيصالات | offline/reload/restart/lost-ACK tests |
| أمن متعدد المشاريع | صفر وصول/تسريب بين شركتين أو مشروعين دون صلاحية | RBAC + RLS + IDOR tests |

**متطلبات الرصد:** `request_id`, `company_id`, `project_id` (مقنّعة في telemetry الخارجية), `route`, duration, query count, returned rows, transactions, retries, job age/backlog, sheet API calls; لا تسجيل بيانات سائقين أو هواتف أو أرقام هويات في القياس.

## 11. خطة تنفيذ المرحلة الثانية على المشروع الأصلي

> التنفيذ يُقسم إلى **وحدات هندسية داخل المرحلة الثانية فقط**، وليس مراحل بحث أو نماذج موازية. تنفذ كل وحدة على المستودع نفسه، وبعد موافقة المالك، مع الاختبارات اللازمة والبوابات والتوثيق. يجب ألا يعود المطور لتقرير قاعدة البيانات أو معنى الهوية في كل وحدة.

| الوحدة | النطاق النهائي | المخرجات المطلوبة | شرط الانتقال |
|---|---|---|---|
| P2-U01 — Infra & schema | إضافة PostgreSQL connection pool، migrations، tenant/RLS وauth adapter | قاعدة وصلاحيات وبيئة اختبار مستقلة **داخل نفس المشروع** | migrations + RLS + backup/restore pass |
| P2-U02 — Canonical master identity | نقل مخطط carriers/drivers/trucks/materials والمفاتيح الطبيعية وعضويات المشاريع | SQL repositories وقيود التفرد والجداول الزمنية | duplicate/concurrency/tenant tests |
| P2-U03 — Foundation & setup | إعادة بناء ProjectFleetQuery/SetupFleetQuery/Readiness على API ملخصات وإسقاطات | شاشة تأسيس موجودة متصلة بـsummary + paginated fleet | p95/query budget + browser acceptance |
| P2-U04 — Temporal fleet | الإسناد والتخصيص والانتساب الناقل/المدة | معاملة SQL + exclusion/history/receipts | overlap/corrupt/displacement tests |
| P2-U05 — Smart Import | sessions + review + plan + batch commit + receipts + resumption | نفس UI ومسار الاستيراد بقاعدة واحدة | signature, recovery, duplicate, failure tests |
| P2-U06 — Trips & pricing | الأوامر والوزن والتفريغ والتسعير التاريخي | state machine + immutable snapshots | trips/concurrency/pricing invariants |
| P2-U07 — Offline | إعادة وصل Outbox وIndexedDB بالـAPI الجديد | مقاومة الانقطاع والتبديل والاستئناف | offline/client lifecycle acceptance |
| P2-U08 — Workspace & reporting | outbox worker + Google Sheets projection + indexed reports | Sheets متزامنة بعد Commit، بلا read storms | retry/quiescence/multi-project tests |
| P2-U09 — Migration & cutover | جرد/نسخ/ترحيل/تسوية/تبديل السلطة التشغيلية | PostgreSQL الكاتب الوحيد، Firestore legacy read-only | reconciled counts, hashes, live E2E, owner signoff |
| P2-U10 — Product closure | مراجعة كل الرحلات التجارية وتطبيق المتصفح والأدوار ومراقبة الأداء | release مع audit trail وخطة تشغيل وصيانة | real acceptance + Phase 10 decision منفصل |

**ترتيب دقيق:** تُبنى البنية والجداول والخدمات داخل المستودع الحالي، لكن لا تقطع الواجهة التشغيلية إلى SQL مبكرًا قبل اكتمال الجداول التابعة وعقودها. تتراكم الوظائف النهائية خلف طبقة repository/feature flag محدودة، ثم تُحوّل السلطة **مرة واحدة** في وحدة cutover. هذا ليس تطبيقًا موازيًا مستقلًا، ولا نظامين أساسيين مفتوحين للكتابة.


### 11.1 قرار تنفيذ بلا نموذج موازٍ

- **نفس المستودع، نفس واجهات المنتج:** تضاف طبقة PostgreSQL خلف الخدمات الموجودة؛ لا واجهة ثانية للمستخدمين ولا مستودع جديد لإعادة كتابة Q-Saudi كاملًا.
- **لا سلطة أعمال مزدوجة:** قبل cutover لا يكتب الإنتاج إلا Firestore؛ بعد cutover لا يكتب إلا PostgreSQL. قد توجد نسخة اختبار/استعادة لبيانات PostgreSQL أثناء التنفيذ لإثبات صحة migrations والترحيل، لكنها لا تستقبل أوامر تشغيل إنتاجية.
- **تجميد القرار المعماري:** تغيير محرك البيانات أو كيان الشركة/العضويات لا يعاد طرحه كل وحدة. أي تعارض مكتشف في شيفرة مصدرية يرفع كـDesign Amendment واضح للمالك قبل تعديل العقد؛ لا تحويل قرار هندسي جوهري تلقائيًا في Google AI Studio.
- **إدارة النشر:** كل وحدة مرتبطة بتغيير موثق داخل الشجرة الأصلية، قائمة GitHub Sync مطابقة للملفات المعدلة، اختبارات قاعدة PostgreSQL فعلية، ونشر بقرار المالك ومراجعة GitHub SHA. لا حذف للسجل القديم أو ملفات Firebase قبل إثبات equivalence والقطع.
- **قبول المنتج:** Phase 10 التاريخية تظل NOT_STARTED؛ لا تستخدم إعادة التأسيس لتجاوز بوابة Foundation والقبول العملي.

## 12. خطة ترحيل البيانات والعودة الآمنة

1. **الجرد والأرشفة:** تعداد Firestore collections/document counts/IDs والعضويات والتواريخ والـSession receipts والرحلات وحالات Offline pending وWorkspace bindings. لا تخزين بيانات شخصية في مستودع Git أو تقارير مفتوحة.
2. **خريطة المصدر إلى الوجهة:** جداول mapping ثابتة لكل نوع وحقول الهوية والتاريخ والعملة والوزن والأحداث والإيصالات؛ حفظ legacy IDs. مقارنة hash/relations لكل دفعة وتصنيف السجلات التالفة دون إصلاح تلقائي.
3. **نسخ احتياطي ثابت:** Firebase export ولقطة لبيانات Google Sheets ذات الصلة، PostgreSQL PITR/restore exercise وتوثيق الوقت والمسؤول. لا حذف مشروع قديم في هذه الوحدة دون تفويض منفصل.
4. **Backfill while old app remains authority:** تحميل نسخة مرجعية **للقراءة فقط** إلى PostgreSQL، لا كتابة عمليات من الإنتاج على الوجهتين. يمكن تحديث النسخة مسبقًا دون تسميتها مصدر الحقيقة.
5. **فترة تجميد كتابة معلنة قصيرة:** إيقاف إنشاء الرحلات/تعديلات التأسيس والاستيراد الجديد، جمع آخر offsets/IDs، إيقاف workers التي تنشئ آثارًا، معالجة/تجميد Outbox العملاء واستيراد الجلسات، تصدير delta نهائي.
6. **تسوية وتدقيق:** تطابق أعداد الكيانات، الهوية الطبيعية، العلاقات الفعالة، فترات التاريخ، أرصدة الرحلات، التسعير، إصدارات الجلسات، عدد الإيصالات، وعلاقات Google IDs. فشل أي شرط جوهري يمنع القطع.
7. **Cutover واحد:** تعيين `canonical_store=postgres`, زيادة `backend_epoch` وتطبيق fence على العملاء القديمة، نشر web/server معًا، منع أي أمر جديد على Firestore، إعادة تشغيل worker على PostgreSQL events؛ يظل Firebase Authentication فقط إذا تقرر الاحتفاظ به.
8. **Recovery:** في حال فشل قبل استئناف الكتابة الجديدة يمكن العودة إلى Firestore بعد فحص المخزون. **بعد قبول كتابة على PostgreSQL لا توجد عودة عمياء**: إما إصلاح forward أو تصدير عكسي متحكم لكل write جديد مع reconcile قبل إعادة السلطة؛ لا dual-write صامت.
9. **الإغلاق:** فترة مراقبة، تقارير invariants، أداء وسلامة الصلاحيات، موافقة المالك، ثم تجميد Firestore القديم وإلغاء صلاحيات الكتابة إليه بعد حفظ النسخ المطلوبة.

**أثر جلسات الاستيراد القديمة:** لا تُعتبر كل الجلسات قابلة للاستئناف تلقائيًا. تُصنّف `COMPLETED`, `PENDING_REVIEW`, `IN_PROGRESS`, `CANCELLED`؛ يُرحّل كل receipt موجود وتحفظ توقيعات النية ونسخة البروتوكول. الحالات غير القابلة للنقل تُحجب مع إجراء استعادة مُعلن، لا يُعاد تنفيذها من الصفر.

## 13. بوابة التحقق والأمن والقبول

**اختبارات ملزمة متدرجة، جميعها على التطبيق الأصلي والقاعدة الجديدة أثناء التنفيذ:**

- DB: migrations forward/restore, FK/UNIQUE/RLS/exclusion/check constraints، تنازع متزامن وتكرار operationId.
- Authority: actor roles, inactive accounts, cross-company/project access، تحريف projectId أو reference ID أو source natural key.
- Import: Excel/CSV import, normalization, review signatures، تعطيل العضوية بين مرحلتين، lost response, retry, cancel, restart, receipts، تسلسل المجموعات وفساد التاريخ.
- Trip: lifecycle, loading/unloading, route/warehouse receipts, trip weight calculation، التسعير التاريخي والغرامات، عدم إعادة تسعير رحلات قديمة.
- Offline: IndexedDB partial snapshot isolation، logout/account switch، forward-only epoch cutover، conflict resolution، lossless recovery.
- Sheets: retry/backoff quota، duplicate delivery, bound resource IDs، report aggregation, idle quiescence.
- UI: العربية والإنجليزية والأردية والتجاوب والجوال، إدخال وإظهار الأخطاء والتنقل بين مراحل المشروع والعودة بعد إعادة التشغيل.
- Live: قياس Chrome Network + PostgreSQL queries + worker jobs + Google API quota، ومقارنة مشروع 24/100/1000 مركبة مع خطوط أداء قبول موثقة.
- Owner: لا تُغلق ميزة لمجرد نجاح الاختبارات. موافقة المالك بعد استخدام متصفح حقيقي لازمة وفق `PRODUCT_RECONSTRUCTION_ACCEPTANCE_GOVERNANCE.md`.

## 14. المخاطر والقيود والردود

| خطر | شدة | قرار المعالجة |
|---|---|---|
| ترحيل تاريخ/إيصالات غير مكتمل | حرج | reconciliation شرط مانع؛ لا حذف؛ حفظ raw history |
| تداخل علاقات زمنية موجودة لا تسمح به قيود PostgreSQL | عالٍ | inventory/quarantine وتصحيح مصرح به مع audit قبل القيد |
| تقطع صلاحيات Firebase عن أدوار SQL | عالٍ | token → actor mapping؛ اختبار revocation والعضوية على السيرفر |
| انقطاع خدمة الترحيل | عالٍ | freeze محدد وbackups وrollback policy قبل الكتابة الجديدة |
| عملاء Offline قديمون يرسلون أوامر على مصدر سابق | عالٍ | schema version + backend epoch fencing + idempotency receipts |
| تعارض Google Sheets مع تغيّر المصدر | عالٍ | outbox freeze/watermark + preserve resource IDs + retry bounded |
| سوء تصميم SQL يؤدي N+1 جديد | عالٍ | مراجعة execution plan ومقاييس حد query قبل قبول أي API |
| تكاليف PostgreSQL وتشغيل القاعدة | متوسط | provider sizing/backup/monitoring، سعة وقياس لا وعود مجانية |
| نسخ كود مفتوح المصدر برخصة غير متوافقة | عالٍ | ممنوع إلا بمراجعة ترخيص صريحة؛ الاستفادة من pattern فقط |
| ازدواجية البيانات أثناء الترحيل | حرج | one writer gate، لا dual-write |

## 15. قرارات تُعرض على المالك لاعتماد الوثيقة

هذه ليست أسئلة تمنع إصدار الوثيقة؛ هي **نقاط الموافقة الصريحة** المطلوبة قبل بدء المرحلة الثانية:

1. اعتماد PostgreSQL قاعدة التشغيل الوحيدة بعد الانتقال، مع بقاء Firebase Authentication مؤقتًا، وإيقاف Firestore كمرجع أعمال بعد القطع.
2. اعتماد الاحتفاظ بـReact/Express وواجهات ومبادئ Q-Saudi، وعدم نقل Fleetbase/Odoo كمنتج.
3. اعتماد هوية شركة عامة مع عضويات متعددة للمشاريع؛ ومنع تداخل إسنادات السائق/الشاحنة في الشركة عبر الزمن (مع تسوية السجلات القديمة عند الحاجة).
4. اعتماد خطة ترحيل فيها freeze/cutover واضح ولا كتابة مزدوجة.
5. اعتماد مقاييس قبول أولية Foundation وFleet وOffline وSheets، مع حق تعديل الأرقام قبل تجميد التنفيذ.
6. اعتماد ترتيب وحدات التنفيذ داخل المرحلة الثانية. Phase 10 القديمة تبقى متوقفة حتى تتحقق معايير Foundation النهائية، أو يصدر تفويض صريح بتعديل خارطة المراحل.

## 16. قائمة أدلة المصدر المستخدمة

**شيفرة Q-Saudi المباشرة** (تُثبّت على SHA عند التنفيذ):
- https://github.com/rexat007/Q-Saudi-Work-Follow-App/blob/cf7ac517be93492125c6dabad0ea38f291da7ed3/src/services/projectFleetQuery.server.ts
- https://github.com/rexat007/Q-Saudi-Work-Follow-App/blob/cf7ac517be93492125c6dabad0ea38f291da7ed3/src/services/setupFleetQuery.server.ts
- https://github.com/rexat007/Q-Saudi-Work-Follow-App/blob/cf7ac517be93492125c6dabad0ea38f291da7ed3/src/services/import/rosterExecution.server.ts
- https://github.com/rexat007/Q-Saudi-Work-Follow-App/blob/cf7ac517be93492125c6dabad0ea38f291da7ed3/src/services/import/reviewedRosterCommit.server.ts
- https://github.com/rexat007/Q-Saudi-Work-Follow-App/blob/cf7ac517be93492125c6dabad0ea38f291da7ed3/src/services/tripCommands.server.ts
- https://github.com/rexat007/Q-Saudi-Work-Follow-App/blob/cf7ac517be93492125c6dabad0ea38f291da7ed3/src/services/offline/outbox.service.ts
- https://github.com/rexat007/Q-Saudi-Work-Follow-App/blob/cf7ac517be93492125c6dabad0ea38f291da7ed3/docs/reconstruction/01_ENGINEERING_CONSTITUTION.md
- https://github.com/rexat007/Q-Saudi-Work-Follow-App/blob/cf7ac517be93492125c6dabad0ea38f291da7ed3/docs/reconstruction/PRODUCT_RECONSTRUCTION_ACCEPTANCE_GOVERNANCE.md
- https://github.com/rexat007/Q-Saudi-Work-Follow-App/blob/cf7ac517be93492125c6dabad0ea38f291da7ed3/docs/reconstruction/FUTURE_ARCHITECTURE_AND_DISTRIBUTION_DIRECTION.md

**مراجع الأنماط المفتوحة:** Fleetbase Architecture / Licensing؛ OCA Transport module inventory؛ Frappe Background Jobs؛ PostgreSQL 17 Constraints / Row Security / Indexes. روابطها في القسم 4.


### 16.1 روابط التحقق الرسمي المستخدمة في مراجعة الإصدارين 1.1 و1.2

- PostgreSQL 17 Constraints (مفاتيح أجنبية وفريدة ومنع التعارض): https://www.postgresql.org/docs/17/ddl-constraints.html
- PostgreSQL 17 Transaction Isolation (READ COMMITTED / SERIALIZABLE): https://www.postgresql.org/docs/17/transaction-iso.html
- PostgreSQL 17 Row Security (FORCE، امتيازات BYPASSRLS): https://www.postgresql.org/docs/17/ddl-rowsecurity.html
- PostgreSQL 17 `EXPLAIN`: https://www.postgresql.org/docs/17/sql-explain.html
- PostgreSQL 17 `pg_stat_statements`: https://www.postgresql.org/docs/17/pgstatstatements.html
- Fleetbase architecture: https://fleetbase.io/docs/platform/getting-started/architecture
- Fleetbase license: https://fleetbase.io/licensing
- OCA transport modules: https://github.com/OCA/stock-logistics-transport

**محدودية التحقق:** استعرضت المصدر الحالي للمستودع ومسارات الأعمال المركزية، ولم أشغّل اختبار SQL أو مرحّل بيانات في هذه المرحلة؛ لذلك التصميم قرار قابل للتنفيذ وليس إثبات تشغيل. لم أتلق صلاحية نقل الشيفرة أو بيانات الشركة.


## 17. عقد نموذج البيانات التفصيلي — المرجع الملزم للتنفيذ

### 17.1 اصطلاحات التصميم

- **الهوية الداخلية:** `uuid` للـPK والـFK؛ **الهوية الخارجية الحالية** (`Q-PRJ-011`, `DRV-...`, `TRK-...`, `CAR-...`, `MAT-...`) تبقى ثابتة في API والإيصالات والهجرة عبر عمود `external_id` فريد لكل نوع داخل الشركة. لا نغيّر معرّفات المستخدم أثناء التحويل، ولا نجعل UUID جديدًا مرجعًا غير قابل للمصالحة.
- **النطاق:** `company_id uuid not null` في كل جدول أعمال؛ وعند الارتباط بمشروع يضاف `project_id uuid not null`. تستخدم FK مركبة `(company_id, project_id)→projects(company_id,id)`، وFK مركبة للهوية العالمية `(company_id, entity_id)` مع `UNIQUE(company_id,id)` في جدول الهوية.
- **الأوامر:** `revision bigint` تزداد مع كل تعديل قانوني، و`created_at`, `updated_at` من توقيت الخادم. لحقائق الوقت المعتمد نستخدم `timestamptz` و`daterange` أو `tstzrange`؛ الوقت المحلي يُعرض باستخدام منطقة زمنية للجهة ويحتفظ بمصدره الأصلي.
- **المبالغ:** `numeric(18,4)` لقيمة التعرفة في وحدة التسعير، و`numeric(18,2)` للمبالغ المعتمدة بالريال وفق سياسة التقريب؛ الأوزان `numeric(18,3)` بالكيلوغرام عند كون المصدر دقيقًا حتى الجرام، مع `source_unit` و`raw_value` منفصلين. **لا float لحساب الوزن التجاري أو المال.**
- **الحذف:** حقائق الرحلات والإيصالات والأحداث والتسعير التاريخي لا تخضع للحذف المتسلسل. الإبطال/التصحيح يسجل حدثًا مع فاعل وسبب، وحق الحذف القانوني للبيانات الشخصية له إجراء منفصل يوازن متطلبات الاحتفاظ القانونية مع الخصوصية.
- **تجميعات العرض:** `project_foundation_summaries` جداول مشتقة تعدّها الخدمات داخل معاملة تغيير العمل، أو تعلن `stale` إذا كان الحساب المؤجل مسموحًا. أبدًا لا تقرر صلاحية الأمر التجاري بدل السجلات الأصلية.

### 17.2 كتالوج الجداول، المفاتيح، والحد الأدنى من الحقول

| الجدول | أهم الحقول إلى جانب `id`, `company_id`, timestamps | القيود والعلاقات المقصودة |
|---|---|---|
| `companies` | `slug`, `status`, `timezone`, `currency` | `slug UNIQUE`؛ بيئة الشركة المستقلة مستقبلًا يمكن أن تضم شركة واحدة |
| `users` | `firebase_uid`, `status`, `display_name`, `last_auth_at` | `firebase_uid UNIQUE`؛ أدوار الأعمال ليست من token وحده |
| `user_company_roles` | `user_id`, `role`, `valid_from`, `valid_to` | FK الشركة/المستخدم؛ صلاحية حالية وفترات تاريخية؛ لا توليد أدوار ضمنية |
| `projects` | `external_id`, `project_number`, `status`, `version`, `operational_profile`, `readiness_revision` | `UNIQUE(company_id,external_id)` و`UNIQUE(company_id,project_number)`؛ حالات العمل محفوظة |
| `project_access` | `project_id`, `user_id`, `role`, `status`, `valid_period` | مفتاح الشركة/المشروع والفاعل؛ دور حالي مع مراجعة التاريخ |
| `carriers` | `external_id`, `name`, `registration_key_hmac`, `status` | `UNIQUE(company_id,external_id)`؛ مفتاح طبيعي حسب عقد التطبيع |
| `materials` | `external_id`, `code_normalized`, `unit`, `status` | `UNIQUE(company_id,code_normalized)` للمفاتيح المعتمدة |
| `drivers` | `external_id`, `identity_key_hmac`, `name_encrypted`, `phone_encrypted`, `status` | `UNIQUE(company_id,identity_key_hmac)` للقيم المتحققة وغير الفارغة |
| `trucks` | `external_id`, `normalized_plate`, `type`, `status`, `weights_profile` | `UNIQUE(company_id,normalized_plate)` للمركبات المؤكدة؛ لا دمج صامت |
| `identity_keys` | `kind`, `key_hmac`, `target_external_id`, `verification_status` | `UNIQUE(company_id,kind,key_hmac)`؛ حجز خادمي مؤقت والتحقق من هدف النوع بمعاملة |
| `project_carriers`, `project_materials`, `project_drivers`, `project_trucks` | `project_id`, `entity_id`, `status`, `valid_period`, `revision` | FK شركة/مشروع/كيان؛ تمنع تكرار العضوية الحالية، تحفظ تغييرات التاريخ |
| `driver_carrier_affiliations`, `truck_carrier_affiliations` | `project_id`, `driver_id` أو `truck_id`, `carrier_id`, `valid_period`, `record_status` | FK إلى عضوية المشروع وقيود عدم تداخل النسب المعتمدة |
| `driver_truck_assignments` | `project_id`, `driver_id`, `truck_id`, `valid_period`, `record_status`, `voided_at` | EXCLUDE زمني على السائق والشاحنة داخل الشركة للتاريخ المعتمد؛ تحقق العضوية زمن الأمر |
| `truck_material_allocations` | `project_id`, `truck_id`, `material_id`, `valid_period`, `record_status`, `voided_at` | EXCLUDE للشاحنة والفترة؛ مادة معتمدة لكل فترة أو قواعد أخرى موثقة |
| `pricing_rules` | `project_id`, `carrier_id`, `material_id`, `version`, `effective_period`, `pricing_model`, `rate`, `tax_policy` | فريدة للنطاق/الإصدار؛ رفض تداخل الأسعار المعتمدة لنفس الأولوية التجارية |
| `trips` | `project_id`, `external_id`, `trip_number`, `carrier_id`, `driver_id`, `truck_id`, `material_id`, `state`, `version` | FK مركبة؛ رقم رحلة فريد لكل مشروع؛ قبول الأوامر ضمن الحالة والسياق |
| `trip_events` | `trip_id`, `seq`, `event_type`, `occurred_at`, `operation_id`, `payload` | `UNIQUE(company_id,trip_id,seq)`؛ سجل إضافة فقط؛ نسخة schema لكل payload |
| `trip_weight_records` | `trip_id`, `measurement_type`, `weight_kg`, `source_unit`, `source_ref`, `captured_at`, `authority_status` | لا تغيير صامت للوزن الأصلي؛ أي تصحيح موثق |
| `receipts` | `trip_id`, `receipt_type`, `quantity_kg`, `received_at`, `actor_id`, `source_ref` | فصل مستند الاستلام عن حالة الرحلة؛ هوية المستند مستقلة |
| `pricing_snapshots` | `trip_id`, `pricing_rule_id`, `pricing_rule_version`, `rate`, `quantity_basis`, `tax`, `final_amount` | نسخة تجارية ثابتة؛ لا تعاد كتابة النتائج القديمة عند تعديل التعرفة |
| `exceptions`, `operational_adjustments` | `project_id`, `trip_id`, `reason`, `status`, `resolved_by` | تصحيح وتدقيق؛ لا تغيير غير موثق لوقائع الوزن |
| `import_sessions` | `project_id`, `external_id`, `state`, `version`, `source_hash`, `reviewed_signature`, `fence`, `schema_version` | `UNIQUE(company_id,project_id,external_id)`؛ استئناف دائم |
| `import_source_artifacts` | `session_id`, `content_sha256`, `object_uri`, `manifest`, `byte_length` | أصل ثابت/مشفّر؛ رابط تخزين غير عام؛ لا حفظ ملفات ضخمة في صف SQL |
| `import_row_decisions` | `session_id`, `source_row_key`, `decision`, `resolved_ids`, `review_version` | `UNIQUE(company_id,session_id,source_row_key,review_version)`؛ traceability |
| `import_execution_groups` | `session_id`, `operation_id`, `group_key`, `state`, `fence`, `version` | تقدم مستقل واستئناف محدد |
| `import_execution_receipts` | `session_id`, `operation_id`, `group_key`, `result_hash`, `committed_at` | قيد فريد لكل مجموعة عملية، يمنع إعادة التنفيذ بعد فقد الرد |
| `idempotency_receipts` | `project_id`, `operation_id`, `actor_id`, `request_hash`, `result_ref`, `state` | `UNIQUE(company_id,project_id,operation_id)`؛ المفتاح نفسه + جسم مختلف = conflict |
| `audit_events` | `actor_id`, `project_id`, `action`, `entity_kind`, `entity_id`, `operation_id`, `before_digest`, `after_digest` | حدث إضافة فقط، مع تقليل المعلومات الحساسة |
| `outbox_events` | `project_id`, `aggregate_type`, `aggregate_id`, `event_type`, `aggregate_version`, `payload`, `occurred_at` | يضاف داخل transaction الأمر فقط؛ `event_id` فريد |
| `worker_jobs` | `event_id`, `status`, `attempts`, `available_at`, `lease_until`, `last_error_code` | `FOR UPDATE SKIP LOCKED`, leases, retry/backoff, dead letter |
| `workspace_bindings` | `project_id`, `folder_id`, `spreadsheet_id`, `script_id`, `google_subject`, `authorization_ref`, `template_version` | حفظ الموارد القديمة ومنع إعادة إنشائها أثناء الانتقال |
| `workspace_sync_receipts` | `project_id`, `event_id`, `destination_id`, `delivery_revision`, `delivery_status` | فريد لكل وجهة/حدث؛ watermark وحماية الإعادة |
| `project_foundation_summaries` | `project_id`, `project_revision`, `ready_stage_count`, `carrier_count`, `material_count`, `driver_count`, `truck_count`, `readiness_state`, `stale` | صف واحد لكل مشروع؛ نطاق عرض محدود |
| `report_snapshots` | `project_id`, `report_kind`, `through_revision`, `generated_at`, `payload_ref` | إعادة إنشاء آمنة، معلنة زمن التوليد؛ ليست حقيقة رحلات |
| `migration_runs`, `legacy_identity_map` | `batch_id`, `source_path`, `target_kind`, `target_id`, `source_hash`, `status` | `UNIQUE(source_path)` داخل نطاق الهجرة؛ ربط كامل للتحقق وإعادة التحميل |

**حدّ اليقين:** أسماء الجداول والحقول أعلاه **تصميم مستهدف** وليست ادعاءً بأنها موجودة حاليًا في Firestore. مصدر كل نقل يؤكد من الشيفرة والسجل الفعلي أثناء ترحيل المرحلة الثانية. أية حقول تظهر في سجلات إنتاجية غير ممثلة هنا يجب تصنيفها إلى canonical/derived/archive قبل القطع؛ لا تسقط البيانات لأنها غير مدرجة في هذا الكتالوج.

### 17.3 نموذج FK وعزل نموذجي قابل لتحويله إلى Migration

```sql
-- CONTRACT EXAMPLE: a migration excerpt, not a complete production schema.
CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE companies (
  id uuid PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  status text NOT NULL CHECK (status IN ('ACTIVE','SUSPENDED'))
);

CREATE TABLE projects (
  id uuid PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id),
  external_id text NOT NULL,
  status text NOT NULL,
  version bigint NOT NULL DEFAULT 0,
  UNIQUE(company_id, id),
  UNIQUE(company_id, external_id)
);

CREATE TABLE drivers (
  id uuid PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id),
  external_id text NOT NULL,
  identity_key_hmac bytea,
  UNIQUE(company_id, id),
  UNIQUE(company_id, external_id),
  UNIQUE(company_id, identity_key_hmac)
);

CREATE TABLE trucks (
  id uuid PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id),
  external_id text NOT NULL,
  normalized_plate text NOT NULL,
  UNIQUE(company_id, id),
  UNIQUE(company_id, external_id),
  UNIQUE(company_id, normalized_plate)
);

CREATE TABLE driver_truck_assignments (
  id uuid PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id),
  project_id uuid NOT NULL,
  driver_id uuid NOT NULL,
  truck_id uuid NOT NULL,
  valid_period tstzrange NOT NULL,
  record_status text NOT NULL CHECK (record_status IN ('ACCEPTED','VOIDED')),
  voided_at timestamptz,
  CHECK (NOT isempty(valid_period)),
  CHECK ((record_status='ACCEPTED' AND voided_at IS NULL) OR
         (record_status='VOIDED' AND voided_at IS NOT NULL)),
  FOREIGN KEY (company_id, project_id) REFERENCES projects(company_id,id),
  FOREIGN KEY (company_id, driver_id) REFERENCES drivers(company_id,id),
  FOREIGN KEY (company_id, truck_id) REFERENCES trucks(company_id,id),
  EXCLUDE USING gist (company_id WITH =, driver_id WITH =, valid_period WITH &&)
    WHERE (record_status='ACCEPTED' AND voided_at IS NULL),
  EXCLUDE USING gist (company_id WITH =, truck_id WITH =, valid_period WITH &&)
    WHERE (record_status='ACCEPTED' AND voided_at IS NULL)
);
CREATE INDEX idx_assignment_project ON driver_truck_assignments(company_id,project_id);
```

**ملاحظة زمنية ملزمة:** الوقت المعتمد `[start,end)` (حد البداية شامل، حد النهاية غير شامل)، و`[start,)` للعلاقة المفتوحة؛ علاقة انتهت قانونيًا لا تُلغى من قيود EXCLUDE. إبطال التاريخ يستخدم `VOIDED` وحدث تدقيق مع سبب؛ إصلاح التاريخ بالنسخ يتم ضمن معاملة متسلسلة. قواعد السماح بإسناد مركبة لأكثر من مشروع في فترتين متباعدتين واضحة؛ التداخل المتزامن عبر مشروعين ممنوع افتراضيًا بالقيود على مستوى الشركة، ما لم يُعدّل المالك هذه القاعدة قبل اعتماد الوثيقة.

**ملاحظة خصوصية:** مثال `drivers.identity_key_hmac` يتطلب مفتاحًا سريًا خارج قاعدة البيانات، يدور بإصدار وتحت إجراءات تغيير مفتاح وتطبيع ثابتة. لا يكشف `HMAC` قيمة الهوية الخام، لكنه لا يغني عن تشفير الحقول الحساسة والتحكم بإمكانية الوصول. يُرفض إنشاء هوية معتمدة عند فشل التحقق من المفتاح أو التطبيع، لا تكتب قيمة افتراضية.

### 17.4 العزل وقواعد التنفيذ الأمني

- فصل أدوار قاعدة البيانات: `qsa_migrator` مالك مخطط محدود، `qsa_runtime` مستخدم تشغيل غير مالك ولا BYPASSRLS، و`qsa_worker` لقراءة الوظائف ثم التبديل إلى سياق النطاق. لا يستخدم Runtime دور superuser أو database owner.
- جميع استعلامات أعمال Runtime تتم داخل `BEGIN ... COMMIT` مع سياق `company_id`, `actor_id`, وعند انطباقه `project_id` عبر `SELECT set_config('app.company_id',$1,true)`، وليس حالة ثابتة في Pool. عند نقص السياق: deny.
- سياسات RLS على جداول الشركة تفرض `company_id = nullif(current_setting('app.company_id',true),'')::uuid` لـ`USING` و`WITH CHECK`. الجداول الخاصة بالمشاريع تحتاج كذلك تحقق صلاحية المشروع؛ تطبّق قواعد صلاحية project بمرجع موثوق خادميًا وWHERE المشروع، واختبارات تمنع العبث بمعرف المشروع. لا نفترض أن company-RLS وحدها تمنع تسرب مشروع داخل الشركة.
- تنفيذ أوامر التأثير يعيد فحص صلاحيات الفاعل وحالة الحساب/المشروع عند لحظة المعاملة. token Firebase دليل هوية، وليس سند صلاحيات كتابة قائمًا بذاته. الـworker لا ينتحل المستخدم أو يوسّع امتيازاته دون تفويض خدمة مصرح به ومقيّد.
- FK وUNIQUE قد تكشفان وجود معرف عبر رمز خطأ حتى مع RLS؛ تُحوَّل أخطاء DB إلى أكواد مجال لا تعيد PII أو تفاصيل مستودع/سجل محمي.
- `pg` Pool له حد ثابت واتصالات محدودة وstatement timeout وtransaction timeout وسياسة معاملة قصيرة؛ أي إجراء خارجي (Google، بريد، تخزين ملف) خارج المعاملة وبواسطة outbox.
- RLS على جداول متعلقة بالشركة لا تحمي بيانات الملفات خارج PostgreSQL؛ `import_source_artifacts.object_uri` يتطلب صلاحية خادمية وروابط قصيرة/موقعة، وملفات خاصة لا يستطيع مستخدم شركة ثانية الوصول لها.

## 18. عقود API النهائية والقراءة المحدودة

### 18.1 Foundation summary

**GET** `/api/v2/projects/:projectExternalId/foundation-summary`

- سياق authenticated `actor`, `company` وproject authorization مفروض؛ `200` يحمل `projectRevision`, `foundationRevision`, `readinessState`, `setupStages`, `counts`, `workspaceStatus`, `generatedAt`, `backendEpoch` فقط. لا `knownDrivers` ولا `knownTrucks` ولا `setup.participants` أو هويات وطنية أو هواتف.
- استجابة `304` مسموحة عند `If-None-Match` مطابق مع نفس principal/scope؛ لا Cache مشترك بين حسابات. بعد أمر تغيير، `projectRevision` يتغير ويمنع عرض summary قديم باعتباره جديدًا.
- `401` رمز منتهي، `403/404` رفض صلاحية/مورد مع سياسة عدم كشف الوجود، `503` إذا لم تستطع القاعدة إصدار قراءة معتمدة. لا رجوع صامت لمحتوى Firestore عند فشل PostgreSQL بعد القطع.

مثال هيكل الاستجابة (قيم توضيحية وليست بيانات مشروع حقيقي):

```json
{
  "data": {
    "projectExternalId": "Q-PRJ-EXAMPLE",
    "projectRevision": 42,
    "foundationRevision": 42,
    "status": "SETUP",
    "readinessState": "NOT_READY",
    "setupStages": [{"stage": "FLEET", "state": "IN_PROGRESS"}],
    "counts": {"carriers": 2, "materials": 1, "drivers": 24, "trucks": 24},
    "workspaceStatus": "PROVISIONED",
    "stale": false
  },
  "meta": {"backendEpoch": 2, "generatedAt": "2026-11-07T00:00:00Z"}
}
```

**تنبيه:** لا تستبدل هذه القراءة حساب جاهزية التأسيس عند إصدار أمر تفعيل؛ أمر التفعيل يعيد قراءة الحقائق المباشرة والقيود في قاعدة البيانات. الرد `stale=true` يمنع إظهار جاهزية مؤكدة حتى تحديث الإسقاط.

### 18.2 Fleet, membership, temporal history

- **GET** `/api/v2/projects/:projectExternalId/fleet?limit=50&cursor=...`: حجم الصفحة `1..50`, keyset cursor يربط بـ`company`, `project`, filter, sort, snapshot revision، ويرفض إعادة استخدامه مع سياق آخر؛ يعتمد ترتيبًا ثابتًا من حقل محدد ثم ID. حقول العرض قليلة وغير حساسة افتراضيًا.
- **GET** `/api/v2/projects/:projectExternalId/setup/:stage`: يحمل فقط حقائق المرحلة المحددة، مع صفحات للشاحنات/السائقين والانتساب دون إجبار تحميل كل علاقات التاريخ.
- **GET** `/api/v2/projects/:projectExternalId/trucks/:truckExternalId/history?cursor=...`: ترخيص خاص لقراءة السجل، لا إفشاء هوية وطنية أو PII بلا صلاحية.
- كل قائمة ترجع `nextCursor`, `hasMore`, و`sourceRevision`. انتهاء الصفحة لا يعني اكتمال نسخة Offline إلا إذا تضمن العقد `fullSnapshot=true` أو `completeThrough` على مستوى المجموعة؛ لا حذف محلّي من partial.

### 18.3 Envelope موحد للأوامر

```json
{
  "operationId": "a-stable-client-generated-uuid",
  "expectedRevision": 42,
  "backendEpoch": 2,
  "payloadSchemaVersion": 1,
  "command": "RECORD_LOADING",
  "payload": {"tripExternalId": "EXAMPLE", "observedAt": "2026-11-07T00:00:00Z"}
}
```

- تمثل `operationId` هوية **طلب واحدة ثابتة** عبر انقطاع الشبكة وإعادة المحاولة، وليست قيمة جديدة لكل Retry. `companyId` و`projectId` لا يؤخذان كسلطة من جسم العميل؛ تُشتقان من جلسة موثوقة ومسار المشروع وتُقارن بالقيم المرسلة إن وجدت.
- تبدأ المعاملة بـ`authorize` ثم تفحص receipt قديمًا بنفس المفتاح. عند العثور على Receipt و`requestHash` مطابق تعاد **نفس النتيجة الموقعة منطقيًا** دون كتابة ثانية؛ وعند الاختلاف `409 IDEMPOTENCY_PAYLOAD_MISMATCH`.
- تحقق `expectedRevision` و`backendEpoch`، والتفرد الزمني، العضويات، الأسعار والتوقيعات، ثم تحديث المجال + audit + receipt + outbox في نفس SQL transaction.
- `409 VERSION_CONFLICT`, `409 TEMPORAL_CONFLICT`, `409 BACKEND_EPOCH_MISMATCH`, `422 INVALID_MEASUREMENT`, `403 FORBIDDEN`, `503 DATABASE_UNAVAILABLE`. حالة الاستجابة المفقودة تُحسم بـ`GET` للإيصال؛ لا تعاد العملية تلقائيًا من دون فحص.
- `429` يُستخدم فقط للتحكم في المعدل مع `Retry-After`, لا باعتباره بديلًا عن `409` لقواعد الأعمال.

### 18.4 عقود الاستيراد والرحلة والتقارير

- **Import:** `POST /imports/{session}/executions` و`advance`, `status` تحفظ `expectedVersion`, `reviewedSignature`, `fence`, `groupKey`, `operationId`, `receipt`. لا قراءة للملف من مصدر متغيّر بعد اعتماد hash؛ جلسة cancelled لا يمكن استكمالها بأمر جديد إلا بعقد بدء مراجعة جديد.
- **Trip:** `POST /trips/commands` يمر عبر state machine الخادم نفسه، مع تحقق الوزن الخام والوحدة والوقت والموقع والأطراف والسعر وقت القرار. تحفظ `trip_events` و`pricing_snapshots` حتى مع تغيير السائق أو المادة لاحقًا.
- **Reports:** `GET /reports/{reportKind}` يعيد `throughRevision`, `generatedAt`, `isStale`, `pageCursor` أو رابط تصدير مخول، ولا يبدأ جدولة متكررة عند مجرد فتح التقرير.
- **Workspace:** `GET /workspace/status` بلا آثار جانبية. أمر `POST /workspace/refresh-reports` مقيد ومعلن، وليس حدث تحميل تلقائي. التزامن مع Sheets يتم عبر worker بعد SQL COMMIT.

### 18.5 ترابط الواجهات أثناء التحويل

قبل قطع السلطة يحتفظ `/api/...` القديم بسلوكه مع Firestore؛ وفي نسخة الإنتاج النهائية يتحول الاستهلاك إلى `/api/v2/...` مع تطبيق توافق مؤقت **داخل الخادم نفسه** للواجهات التي لم تُعدَّل بعد، دون مصدر بيانات مزدوج أو تطبيق ثاني. لا يُسمح بتشغيل خادم يكتب `/api/v1` إلى Firestore وخادم `/api/v2` يكتب إلى SQL في آن واحد على بيانات تشغيلية. تغلق بوابة قبول القطع كل endpoint قديم قابل للكتابة أو تعيد توجيهه إلى سلطة واحدة مع التحقق من العقد.

## 19. عقود المعاملة والـOutbox والتزامن

### 19.1 طريقة معاملات SQL

- أداة الاتصال: `pg` parameterized queries. ملفات DDL مراجعة ومرقمة داخل `server/db/migrations/`؛ runner واحد بمعاملة و`advisory lock` وسجل `schema_migrations(checksum,applied_at)`. لا إعادة كتابة ملف migration منشور، بل migration جديد قابل للتتبع.
- `READ COMMITTED` للقراءات اليومية مع قفل الصف وحواجز القاعدة عند كتابة الكيانات؛ استخدام `SERIALIZABLE` للأوامر التي يعتمد قرارها على مجموعة بيانات قد تتغير بفعل تزامن لا تحميه UNIQUE/EXCLUDE وحدها، مع Retry محدود فقط لـserialization/deadlock بحسب طبيعة العملية ومفتاح idempotency. لا إعادة محاولة عامة لخطأ خارج ذلك.
- تسلسل القفل: الشركة/المشروع → session/operation → identities أو trip → العلاقات → receipt/outbox؛ يوحد جميع أوامر إنشاء/تعديل الكيانات لمنع deadlocks، مع timeout واضح وتسجيل `requestId` لا بيانات حساسة.
- `COMMIT` قد ينجح رغم فقد رد HTTP؛ أي إعادة محاولة تبحث عن `idempotency_receipts` قبل إعادة الكتابة، وتعيد النتيجة الثابتة أو حالة الاستمرار الموثقة.

### 19.2 Transactional outbox

```text
Authenticated business command
  → SQL transaction
     → canonical rows / trip events / version
     → audit record
     → idempotency receipt
     → outbox_event
  → COMMIT
  → HTTP response (or receipt recovery after lost response)

Independent bounded worker
  → claim pending event (SKIP LOCKED + short lease)
  → issue idempotent Google Sheets delta / delivery
  → persist delivery receipt and watermark
  → retries with exponential backoff / bounded quota
  → DEAD_LETTER + operator recovery if terminal
```

- Worker ما بيرجع يصدر أمر الرحلة أو يغيّر مصدر الحقيقة عند فشل Google. لا مزامنة مباشرة من المتصفح، ولا تحريك عمل بسبب `focus` أو `visibilitychange` وحدهما. لا حاجة لـRedis كبداية؛ نفس قاعدة PostgreSQL تعالج طابورًا محدودًا.
- الاستلام من Google عمليًا at-least-once؛ لا يجوز الادعاء بـexactly-once delivery عبر شبكات مختلفة. نحصل على **أثر نهائي منطقي واحد** باستخدام eventId/receipt/watermark وعمليات overwrite/upsert ذات هوية صف ثابتة.
- لا يفتح العامل قاعدة الشركة كلها في ذاكرة التطبيق؛ يقرأ أحداثًا بصفحات، وينتظر لا مبالاة إذا لا Pending Jobs. مقاييس backlog وretry/429 مطلوبة.

## 20. مصفوفة ترحيل Firestore → PostgreSQL وإجراءات القطع

### 20.1 خريطة مجموعات المصدر المؤكدة من مسارات الإنتاج

| مسار Firestore الحالي (شكل معرّف) | مصير البيانات | بوابة المصالحة |
|---|---|---|
| `users/{uid}` | `users` + أدوار الشركة و`project_access` | عدد الحسابات وهويات Firebase ومبدأ عدم تغيير UID؛ لا إعادة تسجيل |
| `projects/{projectId}` | `projects` + `project_foundation_summaries` | externalId/status/version/config وحقول التشغيل جميعها |
| `carriers/{id}`, `materials/{id}`, `drivers/{id}`, `trucks/{id}` | الجداول العالمية الأربعة | تطبيع هوية، مفاتيح HMAC، عدم دمج/إعادة إنشاء صامت |
| `projects/{p}/{kind}_memberships/{id}` | جداول عضويات المشروع الأربع | عضويات ACTIVE/INACTIVE وجميع الحالات التاريخية |
| `projects/{p}/{driver|truck}_carrier_affiliations/{id}` | انتساب الناقل ذي الفترة | ربط شركة/مشروع/كيان ووقت فعال وسجل تبديل |
| `projects/{p}/driver_truck_assignments/{id}` مع `driver_active_assignments`, `truck_active_assignments` | جدول تاريخي + حالة إسقاط لحظية | pointer يطابق التاريخ الفعلي أو يسجل استثناء تحضير |
| `projects/{p}/truck_material_allocations/{id}` مع `truck_active_material_allocations` | جدول تخصيصات تاريخي + read projection | عدم إهدار تاريخ مغلق أو نسبة شاحنة/مادة |
| `projects/{p}/trips/{id}` و`sync_operations` | `trips`,`trip_events`,`idempotency_receipts` | رقم/عمليات/حالة/وزن/سعر وتوقيع التكرار |
| `projects/{p}/importSessions/{id}/checkpointChunks/...` | `import_sessions`, `import_source_artifacts`, snapshots/checkpoints | إعادة تجميع hash وmanifest، لا إسقاط chunk مفقود |
| `projects/{p}/importExecutions/{id}/receipts/...` | `import_execution_groups`, `import_execution_receipts` | operation/fence/reviewed signature + receipts idempotency |
| `audit_logs/{id}` | `audit_events` | حفظ التسلسل والفاعل والوقت مع تقليل PII في فهارس البحث |
| `projects/{p}` متعلقات Workspace (`workspace_continuity`, binding/outbox) | `workspace_bindings`,`workspace_sync_receipts`,`outbox_events` | resource IDs/OAuth provenance والـwatermark والتاريخ بلا إعادة إنشاء |

**تمييز:** بعض أسماء child collections وآليات الترميز تتغير بين المسارات؛ هذه الخريطة مبنية على مراجع مصدرية فعلية، وليست تصديرًا شاملاً لجميع Collections. وحدة الجرد الأولى في التنفيذ ملزمة بإنتاج inventory مُصرح به من Firestore الحقيقي وإلحاق كل مسار غير مدرج بخريطة رسمية **قبل أي نقل أو حذف**، دون تغيير القرار المعماري.

### 20.2 تشغيل الترحيل داخل النظام الأصلي

1. **Inventory:** جرد عدد مستندات كل collection والمشاريع والعضويات والـreceipts والتاريخ والـWorkspace IDs وحالة pending Offline؛ يكتمل mapping للعناصر غير المعروفة من دون إظهار بيانات حساسة في التقارير.
2. **Prerequisites:** إنشاء PostgreSQL ونسخ Firestore محمية و`pg_dump` وPITR، اختبار استعادة حي داخل بيئة اختبار نفس التطبيق، والتحقق من مخطط العزل والقيود.
3. **Backfill:** تصدير دفعات ذات hash/manifest، تحويل هوية واحدة إلى UUID داخلي مع `legacy_identity_map`، إعادة إدخال idempotent لكل دفعة، وحفظ raw archive محمي عند عدم فهم سجل، وليس تخمين بيانات ناقصة.
4. **Resolve integrity:** استثناءات الهويات الطبيعية والتداخل الزمني أو المؤشرات اليتيمة تمنع القطع. لا حذف تلقائي ولا تصحيح سعر/وزن من دون اعتماد بشري موثق.
5. **Freeze writes:** تفعيل حالة خدمة خادمية موحدة تمنع كل أوامر الكتابة بما فيها Offline replays وأوامر Workspace، مع تجميد/تفريغ الأعمال pending وتوثيق آخر revision/receipt/event؛ قراءة مسموحة لواجهة اطلاع مؤقتة.
6. **Final delta + reconcile:** تصدير الذيل النهائي بعد freeze، التحقق من counts, foreign keys, natural IDs, temporal periods, trip prices, import receipts, workspace IDs, outbox watermark. تقرير صفر mismatch حرج، ونسخة احتياطية قابلة للاستعادة.
7. **One authority switch:** نشر نسخة Backend/Frontend متطابقة `backendEpoch` وتغيير `canonical_store` عبر إعداد خادمي واحد، رفض كل endpoint عميل قديم يحمل epoch سابق؛ لا split brain أثناء تحديث البنية.
8. **Post-cutover:** استئناف أوامر الأعمال على PostgreSQL وحده وworker الجديد، متابعة أخطاء JWT/RLS وAPI، والتحقق من عدم حدوث أي كتابة Firestore. الحفاظ على قواعد Firestore مانعة للكتابة التشغيلية بحسب بنية صلاحيات Admin SDK والخدمات.
9. **Rollback:** قبل أول كتابة PostgreSQL يمكن الرجوع للمصدر القديم وفق خطة موثقة. **بعد أول كتابة جديدة على SQL يمنع rollback العشوائي**؛ يلزم forward repair أو reverse-delta موثق مع reconcile وتجميد، بقرار owner.

**قيد خاص:** لا حذف مشاريع الاختبار التاريخية أو Beta2 أو حسابات Firebase أثناء الترحيل. سياسة إعادة ضبط بيئة قبول Foundation القديمة موضوع مستقل يخضع لجرد وقرار صريح قبل أي حذف. لا يكسر ترحيل قاعدة البيانات معرّفات ملفات Drive/Sheets/Script أو ملكيتها.

### 20.3 Gate القطع الثابتة

| البوابة | شرط Go | شرط No-Go |
|---|---|---|
| مصدر البيانات | كل الـcollections في الجرد ولها mapping/قرار حفظ مصرح | collection غير معروف أو سجل إنتاجي بلا مصير |
| الهويات والعلاقات | لا duplicates غير محلولة؛ كل FK سليمة؛ لا تعارض زمن تاريخي غير مصحح | mismatch في هوية سائق/شاحنة أو تعارض تاريخي |
| الرحلات والتسعير | تطابق عدد/قيم/نسخ/إيصالات وأوزان | إعادة تسعير تاريخي أو فقد حدث تحميل/تفريغ |
| Smart Import | كل session state/receipt/version/fence قابل للقراءة أو محجوب معلن | lost ACK قد ينتج تكرارًا أو التوقيع مجهول |
| Offline | جميع Pending commands مصنفة وfenced؛ لا عميل قديم يكتب | أوامر يتيمة قد تنفذ على المتجرين |
| Workspace | الموارد والـwatermark منقولة؛ لا duplicate script/folder | تعطل Google بسبب نسيان binding أو تكرار تنشيط |
| الأمن | RLS/tenant/project auth وUIDs مطابقة؛ no broad worker bypass | وصول عابر لنطاق أو فقد حساب |
| التشغيل | restore rehearsal + build/CI + browser/smoke + metrics | عدم وجود استعادة أو خطط استعلام مقبولة |
| التفويض | مالك المشروع اعتمد القطع صراحة | لا تفويض أو اختلاف deployment epoch |

## 21. معايير قبول قابلة للاختبار أثناء تنفيذ المشروع الأصلي

**خط الأساس:** أهداف تصميم يجب إثباتها لاحقًا، وليست نتائج الآن. أحجام المشاريع التجريبية 24 و100 و1,000 مركبة عبر fixtures اصطناعية خالية من PII؛ لا نموذج تطبيق موازٍ.

| المؤشر | الحد المبدئي الملزم | آلية التحقق |
|---|---|---|
| Foundation summary | طلب واحد لكل generation، مع إمكان refresh مقصود بعد command | browser HAR + server request trace |
| SQL statements عند فتح Foundation | `≤12` استعلامًا عاديًا، بدون لكل شاحنة/سائق استعلام منفصل | query instrumentation + `pg_stat_statements` |
| زمن استجابة Foundation | p95 ≤ 1s في بيئة acceptance المحددة | HTTP traces لعدة جلسات، مع تحديد عتاد البيئة |
| Payload Foundation | بلا arrays كاملة للسائقين والشاحنات؛ حجم مضبوط ومستقل عمليًا عن N | response size tests 24/100/1000 |
| Fleet pagination | صفحة بحد أقصى 50، cursor آمن ونطاق صحيح | EXPLAIN/Index + cursor/project swap tests |
| PostgreSQL | لا full table scan غير مبرر عند فتح المشروع؛ فهارس تظهر بخطة مقاسة | EXPLAIN (ANALYZE, BUFFERS) على fixtures |
| تكافؤ الرحلة/الأسعار | 100% تطابق في الحالات المقبولة/المرفوضة وناتج التسعير والوزن | contract regression + real SQL integration |
| علاقات الهوية | 0 duplicates/invalid links/overlap accepted | FK/EXCLUDE/UNIQUE concurrency tests |
| معاملات الاستيراد | فقد الرد/الانقطاع لا يعيد تنفيذ مجموعة ولا يلغي receipt صحيحًا | durable recovery/lost-ACK tests |
| Offline | نفس operationId لا ينتج أثرين ولو أعيد بعد زمن؛ epoch fences | offline recovery / role revocation tests |
| Google idle | 0 Google sync calls دون event/pending/explicit refresh | worker and browser idle measurements |
| الفصل الأمني | 0 leakage بين مشروعين/شركتين | DB RLS, IDOR, REST tests |

**قاعدة القياس:** لا يساوي ارتفاع مقياس Firebase في نافذة الساعة قياس تكلفة request واحد. للنسخة الجديدة نجمع الطلبات المرتبطة بمعرّفات trace مع SQL statements وزمن التنفيذ وعدد الصفوف. لا يُدَّعى تحقق الميزانيات إلا بعد تشغيل النظام النهائي.

## 22. Manifest تنفيذ المرحلة الثانية — اعتمادات الوحدات والحدود

**هذه وحدات ضمن المرحلة الثانية الواحدة، وليست مرحلة تطوير نموذج اختبار ثم مشروع آخر.** كل وحدة تُنفذ مباشرة داخل repository، مع اختبارات ومسار نشر بقرار المالك؛ لا تصميم متجدد بواسطة أداة التنفيذ.

| الوحدة | الاعتماد السابق | ما يُحوّل داخل نفس المستودع | بوابة القبول |
|---|---|---|---|
| `AR2-U01` schema/auth/sql | تصميم 1.2 معتمد | SQL migrations/roles/connection/unit-of-work؛ inventory + source mapping؛ Auth adapter | RLS + FK + restore + schema migration verified |
| `AR2-U02` canonical entities | U01 | global identity + membership authorities + normalization + mappings | zero duplicate + multi-project role tests |
| `AR2-U03` temporal | U02 | affiliation, assignment, allocation; historical reconciliation | EXCLUDE + temporal history + concurrency |
| `AR2-U04` Foundation/readiness | U02–U03 | project summary + scoped pages + UI wiring in existing components | query/p95 + UI equivalence + no heavy open |
| `AR2-U05` Import durable | U01–U04 | session artifact mapping + reviewed signature + group commit + receipts | P8 regressions + lost-ACK/restart in real DB |
| `AR2-U06` Trips/pricing | U02–U05 | trip command lifecycle + weights + tariff snapshots | historical pricing and weighbridge delivery invariants |
| `AR2-U07` Offline | U04–U06 | client outbox, epoch fence, receipt recovery, cache scope | repeat/outage/logout/account switch tests |
| `AR2-U08` Workspace/reporting | U01, U04, U06 | SQL outbox/worker, preserve Google binding, report query projections | quota/idempotency/quiet idle/ownership tests |
| `AR2-U09` Cutover | U01–U08 | frozen export + reconcile + single authority switchover + deploy | all Go gates, explicit owner authorization |
| `AR2-U10` cleanup/live acceptance | U09 | retire old Firestore operational SDK paths; live monitoring / source docs | product acceptance, restore, measured live costs |

**تسمية الوحدات:** `AR2-U*` وحدات إعادة التأسيس داخل المرحلة الثانية **الجديدة** فقط؛ لا تعني بدء أو إغلاق `Phase 10` التاريخية من خطة 0–18. تبقى Phase 10 `NOT_STARTED` إلى حين تفويض المالك المستقل الذي تنظمه Foundation acceptance.

### 22.1 أحكام التنفيذ التي لا تعاد مناقشتها في كل وحدة

1. **لا إعادة هيكلة للمنتج** خارج الملفات المصرح بها في الوحدة، ولا مشروع جديد، ولا إزالة لاختبارات أو وثائق الحوكمة.
2. لا يعتمد اختبار Mock-only لإغلاق انتقال تخزين: يجب تشغيل PostgreSQL حقيقي في اختبارات CI للوحدات التي تكتب أو تقرأ منه.
3. الحفاظ على البيانات الحساسة وعزلها في الاختبارات، وعدم إدخال dump شخصي داخل Git.
4. لا مقارنة جديدة لاختيار محرك DB؛ الاعتراض يكون Design Amendment موثقًا عند دليل فني قاطع وموافقة المالك، لا قرارًا داخليًا من Studio.
5. لا تغيّر إجراءات نشر المالك؛ Studio يعرض **كل** ملف معدل ضمن GitHub Sync. GitHub `main` مصدر الحقيقة، وكل Push يتحقق منه بعد صدوره بـSHA/Parent/Exact diff.
6. لا يدّعي الإنجاز المالي أو الجاهزية التشغيلية بمجرد نجاح build؛ يلزم قياس حي وreal user acceptance.
7. كل تعديل SQL مؤثر يكتب changelog وmigration mapping وفحوصات rollback إلى جانب اختبار الوحدة.
8. لا يتم إنشاء Google Drive/Sheets/Script resources جديدة بلا قرار صريح؛ إعادة استخدام IDs القديمة أصل تعاقدي.

## 23. سجل القرارات النهائية وحدود الموافقة

| الرمز | القرار | وضعه في هذه النسخة |
|---|---|---|
| ADR-001 | PostgreSQL 17 هدف التصميم ومصدر الأعمال الوحيد بعد cutover | ENGINEERING_RECOMMENDATION، يحتاج موافقة المالك |
| ADR-002 | Keep React/Express/Firebase Auth temporarily | DESIGN_SPECIFIED، يحتاج اعتماد الحزمة |
| ADR-003 | Company-scoped global identity + project memberships | DESIGN_SPECIFIED، يحتاج اعتماد الحزمة |
| ADR-004 | Temporal full history exclusion; pricing snapshots; audit receipts | DESIGN_SPECIFIED، يحتاج اعتماد الحزمة |
| ADR-005 | Foundation bounded summary + paginated details | DESIGN_SPECIFIED، يحتاج اعتماد الحزمة |
| ADR-006 | SQL transactional outbox + server-owned Sheets | DESIGN_SPECIFIED، يحتاج اعتماد الحزمة |
| ADR-007 | Offline idempotency + backend epoch + single writer | DESIGN_SPECIFIED، يحتاج اعتماد الحزمة |
| ADR-008 | Single in-place execution; freeze/reconcile/one cutover | DESIGN_SPECIFIED، يحتاج اعتماد الحزمة |

**مسائل تشغيلية ليست إعادة قرار معماري:** عنوان خدمة PostgreSQL، سعة الاستضافة، أسماء الأسرار، تاريخ نافذة التجميد، واختيار موعد القطع تحدد في وحدة التنفيذ المعنية ببيئة المالك؛ لا يجوز أن تغيّر نموذج البيانات أو مبدأ المصدر الواحد دون تعديل تصميم معتمد. معيار قبول الأداء في القسم 21 يتطلب توصيف عتاد الاختبار قبل القياس، لا اختيار نظام جديد.

**الحالة:** `PHASE_1_DESIGN_PACKAGE_READY_FOR_OWNER_APPROVAL`، وليس `PHASE_1_ACCEPTED`. بعد الاعتماد فقط تُفعّل `AR2-U01` في المستودع الأصلي. لم يُنفذ أي SQL migration، أو تشغيل DB، أو تغيير UI، أو نشر GitHub ضمن إعداد هذه الوثيقة.

---

**الحالة النهائية لهذه النسخة:** `QSA_ARCH_R1_2_DESIGN_PACKAGE_READY_FOR_OWNER_APPROVAL / NO_PRODUCTION_CHANGE`.  
**المرحلة التالية بعد اعتماد المالك:** تنفيذ مباشر على المستودع الأصلي حسب الوحدات المحددة أدناه، دون تطبيق موازٍ أو إعادة دراسة قرار القاعدة من جديد.
