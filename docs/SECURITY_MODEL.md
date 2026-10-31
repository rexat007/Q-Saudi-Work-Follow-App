## GWS1B-LIVE-01 — runtime generation boundary

The public runtime-version response exposes only buildId/workspaceContract and is no-store. Build IDs are compatibility evidence, not authentication or entitlement. Existing Firebase/principal/Project/lifecycle checks remain authoritative. Critical destination/provision routes require the exact served artifact build in X-App-Build before Google access; a forged matching public header cannot bypass normal authorization.

Version checks/grant preparation are token-free. Google OAuth client, origins, scopes, Picker keys, destination checks and blueprint/Script code are unchanged. PWA update only manages app/Workbox generations: no localStorage/session/auth/database/outbox clearing, no service-worker unregister, no user-data cache purge. Legacy page navigation is same-origin, generation-checked, once per worker/client and does not replay API mutations. Modern reload guards remember bounded target history and rate-limit across rolling deployments. Offline version failure blocks Workspace mutations while preserving offline app shell. Actual deployed/browser acceptance remains separate from source tests; status defers to [the ledger](reconstruction/02_PHASE_LEDGER.md).

## GWS1B — generated Workspace trust boundary

[The ledger](reconstruction/02_PHASE_LEDGER.md) owns acceptance. Isolated Google Identity Services authorization preserves Firebase UID and Google provider-subject equality. Request only `drive.file`, `spreadsheets`, `script.projects` and basic identity; no unrestricted Drive scope. Picker selects one destination folder only. Server rechecks active actor, Project scope/lifecycle, folder writability, foreign storage registry and operation/version tags. Only the human user's transient OAuth token creates native resources; service-account ownership is not the provisioning model.

Blueprint approval is a security/acceptance gate. The real supplied scripts are normalized to a simple dispatcher; no ScriptApp trigger-management calls or Execution API are active. Unknown/unreviewed or installable models remain blocked for other assets. Credentials/source IDs/operational records cannot enter the committed asset. Developer capture is an offline/read-only operator tool, not a production endpoint. Ambiguous external writes retain receipts and fail closed. No OAuth credentials are persisted in public DTOs or receipts. Existing RBAC, Firebase rules, outbox/manual retry and canonical app authority remain unchanged; real Google consent/Apps Script execution acceptance remains open.

## PFAG-RB2 maintenance trust boundary

Current supporting contract. [The ledger](reconstruction/02_PHASE_LEDGER.md) owns acceptance; [the field and permission matrix](reconstruction/PROJECT_FOUNDATION_MAINTENANCE_CONTRACT.md) is the maintenance policy reference.

Project create remains SUPER_ADMIN-only; UI now suppresses that control for PROJECT_ADMIN. Project profile/lifecycle and Driver/Truck profile commands require the current active PA/SA and Project scope. Driver/Truck edits additionally require an active scoped membership, preserve natural identity, enforce expected profile version and atomically audit. No global RBAC expansion or browser Firestore write authority is introduced. FINANCE_AUDITOR's existing canonical pricing permission is discoverable through the existing Wizard pricing form; other maintenance actions remain unavailable. Project user assignment remains SUPER_ADMIN-only.

Coherent foundation reads are scoped and restricted to PA/SA/FINANCE_AUDITOR. Maintenance profile fields are opt-in for PA/SA; operational import-resolution readers never receive them. All underlying reads use one server transaction; client generation/scope/projection and expected-result checks precede apply. Project switches invalidate late callbacks, including receipt-refresh paths. Existing operational lifecycle guards reject new operations on SUSPENDED Projects; cleanup remains legal. Runtime rules debt PFAG-RULES-01 stays OPEN / ENVIRONMENT_BLOCKED; no native emulator/deployed security acceptance is claimed.

## PFAG-RB1 persistence and lifecycle boundary

Current supporting security contract; status belongs to [the ledger](reconstruction/02_PHASE_LEDGER.md).

Canonical pricing rules deny all direct client create/update/delete, including privileged client writes. Admin SDK server commands remain the mutation authority and enforce current principal/Project scope, optimistic version, commercial validation, overlap, lineage and audit. Scoped reads remain available. This source correction is not a claim that deployed rules have changed.

Central foundation lifecycle policy allows appropriate existing commands in SETUP/READY_FOR_REVIEW/APPROVED/ACTIVE, permits only explicit consistency cleanup in SUSPENDED/ARCHIVED, and denies unknown/legacy states. Existing command-specific restrictions still apply. Membership cleanup inherits authorized parent command scope/roles; no child privilege escalation or silent ENROLL reactivation is introduced. Carrier eligibility is revalidated for allocation. Failure in temporal closure, pointer cleanup or audit aborts the combined transaction.

Evidence boundary: negative pricing-rule tests inspect unconditional deny clauses. Native Firestore rules execution remains unverified locally because the official emulator download returns HTTP 403; in-memory services do not execute security rules. Live Firebase acceptance and rules deployment are not claimed.

# Current pricing trust boundary — P9-U1 / P9-U2

Classification: CURRENT_ARCHITECTURE_REFERENCE. Exact phase/unit/publication state belongs only to [the ledger](reconstruction/02_PHASE_LEDGER.md).

Server-authoritative create/edit/save/status/version commands re-read the current canonical account, Project scope and lifecycle, and active Carrier/applicable Material participation for expansion/maintenance. Status-only deactivation permits consistency cleanup after eligibility loss. Existing commercial admin authority is PROJECT_ADMIN / FINANCE_AUDITOR / SUPER_ADMIN; a forged browser role or legacy authorization array cannot override it. UI visibility is not authorization.

Expected-version checks and transaction query/read sets fence conflicting edits and replacements. The server owns successor IDs, lineage, usage and cutoff metadata. Rule mutation and existing CREATE/UPDATE audit records commit atomically with one replacement correlation ID. Failure rolls back the whole replacement; no evidence is deleted. Browser-calculated rates/tax totals are not final persistence inputs. Fixed Trip snapshots and stored financials cannot be repriced by a later commercial configuration change. This source verification is not live Firebase certification.

# Current Phase 8 trust boundary — bounded source reference

Classification: CURRENT_ARCHITECTURE_REFERENCE for this section. Acceptance and active unit remain owned by [the ledger](reconstruction/02_PHASE_LEDGER.md). This section describes source behavior, not a live penetration-test or Firebase deployment certification.

- Session mutations are authenticated HTTP/server operations. Server lifecycle validation owns legal transitions; schema/domain requirements distinguish Trip and Roster. Deep payload validation rejects raw File/Blob/Buffer/ArrayBuffer, credentials and nested/mixed-case secret fields.
- The route Project, persisted Session Project, reviewed intent and operation binding must agree. Execution status/retry/cancel reauthorize the current canonical account and Project permission on each transaction. A prior acceptedBy, client signature, browser state or token-role claim alone grants no commit authority.
- Commit authority loads the durable reviewed intent; clients send a version request, not target selections or completion lists. Source/mapping revisions, stable Session/Operation/Batch identities, signatures, warning consent and displacement approval remain bound. Immutable artifact digests are integrity evidence, not authentication.
- Current canonical identity, participation, affiliation and relationship authorities are reused. PREPARED_NEW materialization rechecks natural identity transactionally; no label/fuzzy/default target fallback or independent uniqueness scheme is introduced.
- Operation versions and server-generation fences serialize progress and reject stale attempts. Canonical mutation and receipt publication are atomic at each dependency-group boundary. A lost response must be resolved from durable status, never by assuming browser memory is completion authority.
- Completed receipts survive retries, cancellation and process replacement. Cancellation linearizes with group transactions and preserves completed effects; it is not rollback. Canonical drift may reduce pending work only within the approved maximum effect set; broader displacement requires renewed review.
- Generic checkpoint/chunk PATCH cannot bypass a managed execution. The legacy raw-row path remains guarded by `PHASE8_REVIEWED_INTENT_HANDOFF_REQUIRED`. No browser Firestore write authority or rule change is added; unmatched operation/session journal paths remain under the existing rules' default deny and are accessed through protected server/Admin SDK services.
- Local tests include serialized-store/service restart and browser loss/reload cases using a transactional in-memory database. They do not prove live Firebase, emulator behavior, exhaustive cross-role journeys or owner acceptance. B4 coordinates source/resume/status/retry/cancel/refresh through Project and Session generation checks. A late response cannot restore a previous Session into another Project. Local reattach uses exact bytes; remote pre-analysis resume rejects a changed snapshot. These client guards supplement server authorization and do not replace it. Broader live release/security acceptance remains separate.

## Historical original specification — preserved reference

> **HISTORICAL_RECORD — original design/reference specification.** The preserved body may combine implemented behavior with former targets; it is not proof of current routes, schemas, security, deployment or reconstruction status. Current GitHub main takes precedence. For the verified repository overview see [MASTER_PROJECT_HANDOFF.md](reconstruction/MASTER_PROJECT_HANDOFF.md); current state is [02_PHASE_LEDGER.md](reconstruction/02_PHASE_LEDGER.md). No historical target here authorizes product changes.

# Q Saudi Work Follow — نموذج الأمان والتحكم بالوصول (Security Model & Access Control)

## 1. مبادئ الأمان الصارمة (Zero-Trust Security Principles)

1. **العميل كيان غير موثوق به إطلاقاً (Untrusted Client):**
   * لا يُعتد بأي قيمة تأتي من العميل فيما يخص الصلاحيات، الحالات، الحسابات المالية، أو أسعار المواد.
2. **عزل المشاريع التام (Multi-Project Tenant Isolation):**
   * المستخدم المصرح له بالعمل على مشروع "قطار الرياض" لا يمتلك أي قدرة على استعلام أو الوصول لبيانات مشروع "نيوم" أو "مشروع القدية".
3. **انعدام الأسرار في واجهة المستخدم (No Secrets in Frontend):**
   * لا يحتوي كود المتصفح أو تطبيق PWA على أي مفتاح لخدمات Google Workspace (Sheets / Drive Service Accounts) أو مفاتيح خادم Firebase Admin SDK.
4. **عدم إمكانية التلاعب بسجلات التدقيق (Tamper-Proof Audit Logging):**
   * سجلات التدقيق تُنشأ من جهة الخادم حصراً بصفة "Append-Only"، ولا تتيح قواعد الأمان أي عمليات حذف (`delete`) أو تعديل (`update`).

---

## 2. إدارة الهوية والرموز المخصصة (IAM & Firebase Custom Claims)

تُعتمد الرموز المميزة (Firebase ID Tokens) كمرجع أساسي للهوية بعد تسجيل الدخول. يتم إرفاق مصفوفة الصلاحيات الخاصة بالمشاريع داخل رمز JWT في حقل `customClaims`:

```json
{
  "uid": "usr_saudi_dispatcher_89",
  "email": "dispatcher@qsaudi.com",
  "projectRoles": {
    "proj_riyadh_metro_01": "DISPATCHER",
    "proj_qiddiya_earthworks": "VIEWER"
  },
  "isSuperAdmin": false
}
```

### الأدوار التشغيلية (Role-Based Access Control - RBAC):

| الدور (Role) | الصلاحيات الوظيفية الميدانية |
|---|---|
| **PROJECT_ADMIN** | إدارة المشروع، تعيين الناقلين، ضبط مصفوفة التسعير، اعتماد الاستثناءات الحرجة. |
| **DISPATCHER** | إطلاق الرحلات، تسجيل أوزان الانطلاق، توثيق تذاكر الميزان، رفع الاستثناءات. |
| **DESTINATION_SUPERVISOR** | تسجيل وصول الرحلة، تسجيل وزن الموقع، تأكيد التفريغ، رفع استثناءات الفروقات. |
| **FINANCE_AUDITOR** | مراجعة واعتماد الحسابات المالية، فحص قيود الفوترة وضريبة القيمة المضافة. |
| **DRIVER** | عرض تفاصيل الرحلة الحالية المسندة إليه، تسجيل حالات التحرك والتوقف الميداني. |
| **VIEWER / CLIENT** | قراءة التقارير والمؤشرات التشغيلية بدون أي صلاحية تعديل. |

---

## 3. نموذج قواعد أمان Firestore (Authoritative Security Rules Blueprint)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // الدوال المساعدة للتحقق من الصلاحيات
    function isAuthenticated() {
      return request.auth != null;
    }

    function isSuperAdmin() {
      return isAuthenticated() && request.auth.token.isSuperAdmin == true;
    }

    function hasProjectRole(projectId, allowedRoles) {
      return isAuthenticated() && 
        (isSuperAdmin() || 
        (request.auth.token.projectRoles != null && 
         request.auth.token.projectRoles[projectId] in allowedRoles));
    }

    // 1. عزل وثائق المشاريع
    match /projects/{projectId} {
      allow read: if hasProjectRole(projectId, ['PROJECT_ADMIN', 'DISPATCHER', 'DESTINATION_SUPERVISOR', 'FINANCE_AUDITOR', 'VIEWER']);
      allow write: if isSuperAdmin() || hasProjectRole(projectId, ['PROJECT_ADMIN']);

      // 2. الكيانات التشغيلية الفرعية (Carriers, Trucks, Drivers, Materials)
      match /carriers/{carrierId} {
        allow read: if hasProjectRole(projectId, ['PROJECT_ADMIN', 'DISPATCHER', 'DESTINATION_SUPERVISOR', 'FINANCE_AUDITOR', 'VIEWER']);
        allow write: if hasProjectRole(projectId, ['PROJECT_ADMIN']);
      }

      match /trucks/{truckId} {
        allow read: if hasProjectRole(projectId, ['PROJECT_ADMIN', 'DISPATCHER', 'DESTINATION_SUPERVISOR', 'FINANCE_AUDITOR', 'VIEWER']);
        allow write: if hasProjectRole(projectId, ['PROJECT_ADMIN', 'DISPATCHER']);
      }

      match /drivers/{driverId} {
        allow read: if hasProjectRole(projectId, ['PROJECT_ADMIN', 'DISPATCHER', 'DESTINATION_SUPERVISOR', 'FINANCE_AUDITOR', 'VIEWER']);
        allow write: if hasProjectRole(projectId, ['PROJECT_ADMIN', 'DISPATCHER']);
      }

      match /materials/{materialId} {
        allow read: if hasProjectRole(projectId, ['PROJECT_ADMIN', 'DISPATCHER', 'DESTINATION_SUPERVISOR', 'FINANCE_AUDITOR', 'VIEWER']);
        allow write: if hasProjectRole(projectId, ['PROJECT_ADMIN']);
      }

      // 3. قواعد التسعير: ممنوع تعديلها من الميدان نهائياً
      match /pricing_rules/{ruleId} {
        allow read: if hasProjectRole(projectId, ['PROJECT_ADMIN', 'FINANCE_AUDITOR']);
        allow write: if hasProjectRole(projectId, ['PROJECT_ADMIN', 'FINANCE_AUDITOR']);
      }

      // 4. الرحلات (Trips): لا يُسمح للعميل بتعديل الحالة أو القيمة المالية مباشرة
      match /trips/{tripId} {
        allow read: if hasProjectRole(projectId, ['PROJECT_ADMIN', 'DISPATCHER', 'DESTINATION_SUPERVISOR', 'FINANCE_AUDITOR', 'VIEWER', 'DRIVER']);
        
        // يُمنع الكتابة المباشرة للرحلة من العميل لتعديل الحسابات المالية أو الحالات؛
        // التعديلات تتم عبر Cloud Functions / Node.js API حصراً أو عبر قيود صارمة جداً.
        allow create: if hasProjectRole(projectId, ['PROJECT_ADMIN', 'DISPATCHER']) &&
          request.resource.data.financials.isFinalized == false &&
          request.resource.data.financials.totalAmountSAR == 0;
          
        allow update: if false; // التحديث المباشر مغلق؛ يتم عبر واجهات الـ Backend المعتمدة
        allow delete: if false; // الرحلات لا تُحذف للحفاظ على السجل الضريبي
        
        // الأحداث الفرعية للرحلة
        match /events/{eventId} {
          allow read: if hasProjectRole(projectId, ['PROJECT_ADMIN', 'DISPATCHER', 'DESTINATION_SUPERVISOR', 'FINANCE_AUDITOR', 'VIEWER']);
          allow create: if hasProjectRole(projectId, ['PROJECT_ADMIN', 'DISPATCHER', 'DESTINATION_SUPERVISOR', 'DRIVER']);
          allow update, delete: if false; // الأحداث غير قابلة للتعديل أو الحذف
        }

        match /exceptions/{exceptionId} {
          allow read: if hasProjectRole(projectId, ['PROJECT_ADMIN', 'DISPATCHER', 'DESTINATION_SUPERVISOR', 'FINANCE_AUDITOR']);
          allow create: if hasProjectRole(projectId, ['PROJECT_ADMIN', 'DISPATCHER', 'DESTINATION_SUPERVISOR']);
          allow update: if hasProjectRole(projectId, ['PROJECT_ADMIN']); // فقط المدير يعتمد الاستثناء
          allow delete: if false;
        }
      }

      // 5. سجل عمليات المزامنة Idempotency Ops
      match /sync_operations/{syncOpId} {
        allow read, write: if hasProjectRole(projectId, ['PROJECT_ADMIN', 'DISPATCHER', 'DESTINATION_SUPERVISOR', 'DRIVER']);
      }
    }

    // 6. سجل التدقيق العام (Audit Logs): للقراءة فقط للمدقق، وممنوع الحذف نهائياً
    match /audit_logs/{auditId} {
      allow read: if isSuperAdmin() || 
        (isAuthenticated() && request.auth.token.isAuditor == true);
      allow write: if false; // يكتب فقط عبر Firebase Admin SDK الخادومي
    }
  }
}
```

---

## 4. أمان الخادم وعزل الخدمات الخارجية (External Services Isolation)

```
[ Frontend PWA Client ]
         │ (Only Firebase ID Token)
         ▼
[ Secure Node.js Server Environment ]
    ├── process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    ├── process.env.GOOGLE_WORKSPACE_CLIENT_EMAIL
    ├── process.env.GOOGLE_WORKSPACE_PRIVATE_KEY
    └── process.env.ZATCA_INTEGRATION_SECRETS
         │
         ├──► (Google Sheets API v4 with Service Account)
         └──► (Google Drive API v3 with Service Account)
```

* يتم تخزين مفتاح `Service Account` الخاص بـ Google Drive و Google Sheets في بيئة تشغيل الخادم المشفرة (`Cloud Secret Manager`).
* لا يملك العميل أي عنوان URL مباشر أو Token لرفع الملفات إلى Drive؛ بل يرسل الملف كـ Stream إلى الخادم الذي يتحقق من الحجم (أقصى حد 10MB لكل تذكرة) والنوع (JPEG, PNG, PDF)، ثم يقوم بالرفع إلى مجلد المشروع الهرمي المحدد.

---

## 5. سجل التدقيق الإلزامي للتغييرات الحساسة (Audit Trail Specification)

أي تعديل على السجلات التالية يؤدي فورياً لإصدار سجل تدقيق في مجموعة `/audit_logs`:
1. تعديل وزن تذكرة ميزان أو تصحيح يدوي.
2. اعتماد أو تسوية استثناء حمولة زائدة (Overweight Exception).
3. تعديل في مصفوفة أسعار الناقل (`Pricing Rule`).
4. تغيير يدوي لحالة الرحلة من قِبل المشرف الميداني.
5. تعديل ضريبة أو خصم مالي على قيمة الرحلة.
