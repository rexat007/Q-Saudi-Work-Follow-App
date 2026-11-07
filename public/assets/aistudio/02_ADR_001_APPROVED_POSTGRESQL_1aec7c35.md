# Q-Saudi Work Follow — ADR-001: PostgreSQL Authoritative Store

**التاريخ:** 2026-11-07  
**المرجع:** `main@cf7ac517be93492125c6dabad0ea38f291da7ed3`  
**الحالة:** `DECISION_SPECIFIED / OWNER_FINAL_APPROVAL_PENDING`  
**الوثيقة الأم:** `QSA_ARCH_PHASE1_FINAL_DESIGN_REVISION_1_2_2026-11-07.md`

## القرار

اختيار PostgreSQL (المرجع التصميمي PostgreSQL 17) بصفته مصدر البيانات التشغيلية الوحيد بعد cutover، مع استمرار React/TypeScript وNode/Express والـDomain Contracts. Firebase Authentication مؤقت لإثبات هوية المستخدم، بينما الأدوار والمشاركات والصلاحيات التجارية في PostgreSQL. Firestore يبقى مصدر الإنتاج حتى cutover فقط، ثم أرشيفًا محميًا مقيد القراءة؛ ولا توجد كتابة أعمال مزدوجة. Google Sheets وجهة إسقاط مشتقة تُحدَّث من outbox خادمي بعد commit.

## لماذا هذا القرار؟

العلاقات بين الشركات/المشاريع والكيانات العالمية والعضويات والزمن والتسعير والإيصالات تحتاج FK/UNIQUE/EXCLUDE وقياس SQL قابل للرصد، وهي أكثر ملاءمة للنظام من استمرار بناء إسقاطات Firestore متعددة لمسار Foundation. لا يُنسب إلى PostgreSQL أداء متحقق قبل تنفيذ النظام؛ لا يوجد تشغيل أو مقارنة أداء فعلية ضمن هذه المرحلة.

## البدائل المرفوضة

- الحفاظ على Firestore مع إعادة تصميم إسقاطاته: ممكن هندسيًا، لكنه يتطلب استمرار فرض العلاقات الزمنية والتفرد في التطبيق/المعاملات بدل قيود قاعدة علائقية.
- MySQL/MariaDB: صالحان لأغراض كثيرة، لكن PostgreSQL يملك أدوات وقيود نطاق زمني وRLS وEXCLUDE أكثر ملاءمة للعلاقات المرجعية الموجودة في Q-Saudi.
- استبدال المنتج بـFleetbase أو Odoo: يعيد بناء تجربة المنتج ويضاعف أعمال تكامل المجال؛ المصادر تستخدم لاستلهام الأنماط العامة فقط.

## شروط التنفيذ في المشروع الأصلي

- لا منصة مستقلة ولا Proof of Concept ولا إعادة بناء على مستودع موازٍ.
- كل أوامر الـdomain والـreceipts/outbox ضمن SQL transaction واحدة، وقيود نطاق الشركة/المشروع إجبارية.
- هوية السائق/الشاحنة/الناقل/المادة موحدة **داخل الشركة**، متعددة المشاركة بين المشاريع، مع preserving legacy ID mapping.
- تصحيح النموذج الزمني قبل توليد DDL: التاريخ المعتمد المحفوظ لا يسقط من EXCLUDE بمجرد انتهاء الحالة الحالية.
- PostgreSQL staged/CI backup & migration rehearsal جزء من تنفيذ النظام الأصلي، وليس منتجًا تجريبيًا ثانيًا.
- Cutover مرة واحدة بتجميد كتابة، نسخة قابلة للاستعادة، استيراد/تسوية، fencing لأوامر Offline، ثم تشغيل PostgreSQL وحده.

## ما الذي يلزم لاعتماده؟

موافقة المالك على قرار تغيير مصدر البيانات، مع اعتماد نسخة وثيقة التصميم 1.1 ومصفوفة الاحتفاظ وإعادة التأسيس. لا نشر، ولا ترحيل، ولا تعديل إنتاجي قبل تلك الموافقة.

## مراجع

- https://www.postgresql.org/docs/17/ddl-constraints.html
- https://www.postgresql.org/docs/17/transaction-iso.html
- https://www.postgresql.org/docs/17/ddl-rowsecurity.html
- https://github.com/rexat007/Q-Saudi-Work-Follow-App/tree/cf7ac517be93492125c6dabad0ea38f291da7ed3

## تثبيت عقد الإصدار 1.2

- PostgreSQL `17` قاعدة التصميم المرجعية، `pg` وSQL migrations مرقمة مع checksums/locking.
- لا عزل شركة بمجرد تسمية الجدول؛ تستخدم composite FK وRLS `qsa_runtime` غير مالك، والتحقق خادميًا من صلاحية المشروع.
- العلاقات الزمنية تحفظ التاريخ المعتمد حتى بعد الإغلاق، و`EXCLUDE` لا يقتصر على الحالة التشغيلية `ACTIVE`.
- `Q-PRJ-...` و`DRV-...` وبقية معرفات الأعمال تبقى `external_id` ثابتة أثناء ترحيل UUID داخلي.
- تصدير البيانات والمصالحة والتجميد والـepoch والقطع مرة واحدة، بلا dual write.
- لا تعديل إنتاجي أو تشغيل PostgreSQL قبل اعتماد المالك وثيقة التصميم النهائية.
