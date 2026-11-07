# Q-Saudi Work Follow — محضر تنفيذ الوحدة AR2-U01
## البنية التحتية والمخطط العلائقي الأساسي لـ PostgreSQL 17

**تاريخ التنفيذ:** 7 نوفمبر 2026  
**مرجع الأساس البرمجي (Authoritative Git Baseline):** `cf7ac517be93492125c6dabad0ea38f291da7ed3`  
**المرجع المعماري المعتمد:** `ARCH-R1 / REVISION 1.2` و `ADR-001` (المعتمدان بمحضر المالك بتاريخ 2026-11-07)  
**الحالة التشغيلية:** `AR2_U01_IMPLEMENTED_PENDING_OWNER_REVIEW`  
**وضع النشر:** `PUBLISHING_STATUS = NOT_AUTHORIZED` (لا رفع إلى GitHub، لا Pull Request، لا Merge، لا تفعيل إنتاجي)

---

### 1. ملخص نطاق التنفيذ المنجز

تطبيق البنية التحتية الأولى لقاعدة بيانات PostgreSQL 17 في الشجرة البرمجية للمشروع نفسه دون أي مساس بمسارات Firestore الإنتاجية الحالية أو بناء نظام موازٍ:

1. **إدارة الهجرة المقفلة (Versioned Migrations & Advisory Locking):**
   - محرك هجرة مستقل يعتمد `pg_advisory_lock(7142026)` لمنع التشغيل المتزامن.
   - التحقق الصارم من بصمات SHA-256 للملفات لمنع التلاعب بالمهاجرات السابقة.
   - تطبيق متسلسل داخل معاملات ACID آمنة.
2. **المخطط القانوني الكامل (Canonical Schema):**
   - الامتداد الزمني `btree_gist` مفعّل.
   - 42 جدولًا تشمل كامل كتالوج القسمين 7 و 17 في وثيقة ARCH-R1.2 (الحوكمة، الهويات العالمية، العضويات، العلاقات الزمنية، العمليات، الاستيراد الذكي، التدقيق، صندوق الصادر Transactional Outbox، وعامل المهام).
   - قيود `EXCLUDE USING gist` على الفترات الزمنية `tstzrange` لمنع التداخل الزمني للسائق أو الشاحنة لنفس الشركة.
3. **أدوار قاعدة البيانات وحماية الصفوف (Roles & FORCE RLS):**
   - الأدوار الثلاثة: `qsa_migrator`, `qsa_runtime`, `qsa_worker`.
   - دور التشغيل `qsa_runtime` ليس مالكًا للمخطط ولا يملك `BYPASSRLS`.
   - سياسات RLS مفروضة قسرًا `FORCE ROW LEVEL SECURITY` باستخدام سياق المعاملة المحلي `current_setting('app.company_id', true)`.
4. **وحدة العمل والسياق الآمن (Unit of Work & Request Isolation):**
   - تنفيذ العمليات تحت سياق محلي للمعاملة `set_config('app.company_id', ..., true)` يضمن إعادة ضبط الاتصال فور انتهاء المعاملة وانعدام التسريب بين اتصالات الـPool.
   - صندوق الصادر الذري `outbox_events` وإيداع المهام `worker_jobs` داخل نفس معاملة الأعمال.
   - حماية التكرار الدائمة `idempotency_receipts`.
5. **محول التوثيق (Auth Adapter):**
   - الاحتفاظ بـ Firebase Auth للتحقق من الهوية، مع قصر الأدوار والصلاحيات التجارية على PostgreSQL.
   - الفشل الآمن المغلق (Fail-closed) عند تعليق الحساب أو غياب الصلاحية.
6. **جرد ومطابقة مسارات Firestore (Read-Only Mapping):**
   - إطار قراءة وتحليل للمسارات التاريخية دون تصدير أو تعديل على بيانات الإنتاج.
7. **إثباتات الاختبار على PostgreSQL 17 حقيقية:**
   - نجاح اختبارات المحرك، القيود، عزل RLS، وحدة العمل، والتراجع عند الفشل، وتجربة أخذ نسخة احتياطية واستعادتها `pg_dump` و `psql restore`.

---

### 2. قائمة الملفات المنفذة

| الملف | الغرض |
|---|---|
| `src/db/types.ts` | عقود الأنواع، سياق الطلب، سجلات الهجرة وصندوق الصادر |
| `src/db/pool.ts` | إدارة تجمع الاتصالات والمهلات والمعاملات |
| `src/db/migrator.ts` | مشغل الهجرات المعتمد بالأقفال الاستشارية والبصمات |
| `src/db/migrations/001_canonical_schema.sql` | المخطط الكامل للأقسام 7 و17 (42 جدولًا وقيود GiST) |
| `src/db/migrations/002_roles_and_rls.sql` | تعريف الأدوار والصلاحيات وسياسات FORCE RLS |
| `src/db/unitOfWork.ts` | عزل المعاملات، سياق المستأجر، صندوق الصادر، والـIdempotency |
| `src/db/authAdapter.ts` | مطابقة هوية Firebase مع سلطة أدوار PostgreSQL (fail-closed) |
| `src/db/firestoreMapping.ts` | جرد ومطابقة مسارات Firestore للقراءة فقط |
| `src/tests/ar2U01PostgresInfrastructure.test.ts` | حزمة الاختبارات الشاملة على PostgreSQL 17 حقيقي |
| `package.json` | تثبيت `pg` و `@types/pg` وإضافة أوامر `db:migrate` و `test:postgres-infra` |
