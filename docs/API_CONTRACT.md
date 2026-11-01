## Global user-active Workspace sync — current

POST `/api/workspace/user-active-sync` is behind Firebase authentication and precedes Project-specific Workspace routing. Body must be `{}`: no Project/list/resource/row fields or Google token header. The server discovers owned grants and current eligible pending work. A completed pass returns `{success:true,examined,eligible,attempted,delivered,skipped,deferred}` and HTTP 200 even if a Project requires Google authorization or is deferred. No Project/Script IDs, provider payload, email or credentials are returned. Firebase authentication alone may return global 401; malformed commands return 400 and unexpected pass availability failure is bounded WORKSPACE_COORDINATOR_UNAVAILABLE/503. Existing manual Project retry/repair/reauthorization/recovery endpoints remain unchanged. Exact state: [ledger](reconstruction/02_PHASE_LEDGER.md); semantics: [sync contract](reconstruction/PROJECT_GOOGLE_SHEET_SYNC_CONTRACT.md).

## Durable Google authorization diagnosis — current

Exact state: [phase ledger](reconstruction/02_PHASE_LEDGER.md); semantics: [credential contract](reconstruction/GWS2_BACKGROUND_AUTHORIZATION_CONTRACT.md).

- `GET /api/projects/:projectId/workspace` additionally includes `authorizationDiagnostic` in the existing status data. It is credential-free, no-store and computed from authorized metadata/current Firebase provider identity, not a Google refresh.
- `GET /api/projects/:projectId/workspace/authorization/diagnosis`: existing administrator/Project/build guards; no request resource IDs or credential input; returns `{success:true,data:{result,reason?,providerCode?,metadataOnly:true}}`. Results are CONNECTED_VALID, REAUTHORIZATION_REQUIRED, GRANT_BINDING_STALE, ACCOUNT_MISMATCH, AUTOMATION_SCOPE_REQUIRED or PROVIDER_TEMPORARILY_UNAVAILABLE. Reason and transient providerCode are closed vocabularies. Diagnosis failure is bounded; no raw error response.
- Existing consent POST/callback retain PKCE/state/nonce/browser/origin fences. CONNECTED completion is sent only after shared first-refresh validation and atomic candidate acceptance. On failure only bounded application code/authorization reason may cross the popup; no provider payload or credential/identity. Failed replacement leaves old continuity intact.

initialize/retry-sync/automation-recover keep their existing command bodies and server credential resolver. A genuine invalid grant may still return AUTHORIZATION_REQUIRED; status/diagnosis supplies the specific reason. Temporary Google service/network/rate/quota errors preserve the grant and return their existing canonical code. No resource recreation or new business API is introduced.

## Current operational configuration and recovery commands

Exact state is [the ledger](reconstruction/02_PHASE_LEDGER.md); policy is [the operational contract](reconstruction/OPERATIONAL_PROFILES_WORKSPACE_ENGINE_CONTRACT.md).

- `POST /api/projects/:projectId/operational-configuration`: `{configuration, expectedVersion, acknowledgeLegacyDualCompatibility?}` only. Current administrator, lifecycle, optimistic version and post-binding/operation migration fences apply. Explicit legacy dual adoption preserves existing Sheet/Trip history. Arbitrary foundation overposting cannot configure operations.
- Existing Trip command endpoint adds bounded `COMPLETE_LOADING`, `START_UNLOADING`, `ASSOCIATE_DRIVER` actions under existing origin/destination role policies. No new role or generic arbitrary-update endpoint. Driver null is accepted only by configured non-preloaded domain policy; canonical Truck/Carrier/Material/assignment/allocation/pricing checks still execute. Operational timestamps are server-recorded, never client-authored snapshots.
- `POST /api/projects/:projectId/workspace/automation/recover`: `{scriptProjectId}` only. Fresh Project administrator, Google subject/grants, current binding/lease and parent proof precede identity persistence/install/readback; no create fallback. Credential-free Workspace status additionally exposes `syncTrigger: USER_ACTIVE` and bounded `automationRecoveryRequired`.
- Existing `workspace/retry-sync` accepts `{}` only; uses transient Google permission or an existing valid encrypted grant. The active app requests canonical outbox/snapshot/report delivery. No row authority or scheduled-job requirement is added.

New configured provisioning resolves one of four versioned native template factories. Existing unconfigured legacy behavior remains until explicit adoption. Binding-first/independent health supersedes the old structure-before-READY phrasing below. Older GWS1B descriptions are historical where inconsistent.

## GWS1B — current Workspace provisioning commands

Exact state defers to [the ledger](reconstruction/02_PHASE_LEDGER.md). `POST /api/projects/:projectId/workspace/destination` accepts only `destinationRootFolderId`, freshly authorizes the actor/Project and Google subject/scopes, validates folder writability and the compiled blueprint, and records a scoped approval. `POST /api/workspace/provision` accepts only `projectId` and `destinationRootFolderId`; canonical name/account/lifecycle are loaded server-side, never trusted from a full client Project. Existing bindings are reused without implicit migration. New resources use the owner-local approved SABIL-HAIL-V1 compiled asset. Bound source + manifest readback and structure validation precede READY; no script execution/deployment or trigger-installation endpoint is added.

`GET /api/projects/:projectId/workspace/template` is retired (410); no runtime template configuration is exposed. `GET /api/projects/:projectId/workspace` remains the credential-free status authority. Existing initial sync/retry drain canonical durable outbox events, not client rows. Old payload-driven writers remain fenced for permanent bindings. See [the sync contract](reconstruction/PROJECT_GOOGLE_SHEET_SYNC_CONTRACT.md).

## PFAG-RB2 coherent foundation and maintenance API

Current source reference; [the ledger](reconstruction/02_PHASE_LEDGER.md) owns status. Detailed field/permission policy is [the maintenance contract](reconstruction/PROJECT_FOUNDATION_MAINTENANCE_CONTRACT.md).

| Route | Current bounded contract |
|---|---|
| GET /api/projects/:projectId/foundation-snapshot | Active scoped PA/SA/FINANCE_AUDITOR; one transaction returns Project, Carrier/Material lists, relationship context, Fleet rows, Setup participants and readiness, plus canonical pricing list metadata. consistency = SERVER_TRANSACTION_SNAPSHOT |
| POST /api/projects/:projectId/foundation | PA/SA; body only updates and integer expectedVersion. Single existing Project command validates allowlist/status/expected version and audits. ACTIVE allows nameAr/nameEn/clientName/description only; historical-sensitive settings/location/dates remain locked |
| POST /api/projects/:projectId/lifecycle-transition | Existing PA/SA lifecycle command additionally accepts ACTIVE → SUSPENDED; preserves membership/temporal state and history |
| POST /api/projects/:projectId/reactivate | PA/SA; explicit SUSPENDED → ACTIVE through existing activation readiness/path/pricing/transaction authority; failure returns blockers |
| POST /api/projects/:projectId/fleet-profile/:kind/:entityId | PA/SA; DRIVER/TRUCK only, active Project membership, updates + expectedVersion. Immutable identity/status/relationship/ownership fields reject. Optional mutable null/empty clears supported |

Legacy profile versions default to zero; successful profile writes increment. PROFILE_VERSION_CONFLICT / PROJECT_VERSION_CONFLICT reject stale forms. IDENTITY_MIGRATION_REQUIRED rejects identity correction through ordinary editing. REFRESH_INCOHERENT and REFRESH_STALE_GENERATION are client-side convergence boundaries; confirmed mutation + failed refresh retains receipt and retries only refresh. Canonical pricing list flags normalize the accepted legacy isActive alias without changing persisted records. Pricing status cleanup uses the existing save endpoint; no new pricing authority/form is added.

## PFAG-RB1 foundation safety contract

Classification: CURRENT_ARCHITECTURE_REFERENCE; acceptance and publication are owned by [the ledger](reconstruction/02_PHASE_LEDGER.md).

Project membership SUSPEND/REMOVE commands now compose consequence planning and writes in the same transaction. The response includes `closedRelationships`; `DEPENDENT_RELATIONSHIPS_ACTIVE` includes `dependencies` category counts. Driver closes its active assignment; Truck closes assignment/allocation; Material closes allocations up to the bounded limit of 50. Larger Material plans reject before writes and require explicit canonical cleanup. Carrier uses rejection outcome B: active Driver/Truck affiliations, affected assignments/allocations and active pricing rules must be cleaned up first. No mass cascade is implied.

Canonical pricing writes remain authenticated server commands, not browser Firestore writes. Direct client create/update/delete on `pricing_rules` are denied. Current account, scope, expected version, overlap, lineage and audit checks remain authoritative. Status-only deactivation is consistency cleanup; activation or changes to commercial/name/notes fields are not cleanup.

All scoped foundation writes consume the central mutation classification: NEW_OPERATION, MAINTENANCE or CONSISTENCY_CLEANUP. ARCHIVED/SUSPENDED reject expansion and maintenance; safe explicit cleanup remains available. Unknown/legacy lifecycle states fail closed. No Project suspension/reactivation endpoint is added.

# Current pricing API — P9-U1 / P9-U2

Classification: CURRENT_ARCHITECTURE_REFERENCE. Exact phase/unit/publication state belongs only to [the ledger](reconstruction/02_PHASE_LEDGER.md).

| Endpoint | Contract |
|---|---|
| `GET /api/projects/:projectId/pricing-rules` | Authenticated scoped account; canonical list `{success,data}` with computed `hasHistoricalTrips` projection |
| `POST /api/projects/:projectId/pricing-rules` | Current PROJECT_ADMIN / FINANCE_AUDITOR / SUPER_ADMIN; canonical participation, overlap and atomic audit |
| `POST /api/projects/:projectId/pricing-rules/:ruleId/update` | Strict edit; expectedVersion required; linked commercial mutation rejected |
| `POST /api/projects/:projectId/pricing-rules/:ruleId/save` | Same current server write authority and expectedVersion. Unused rule edits retain identity. Used commercial changes atomically create a server-ID successor, predecessor cutoff and correlated audit events. Status-only changes retain identity. Returns the actually persisted rule, which may have a new ID |

The URL Project and current account govern authorization. `hasHistoricalTrips`, lineage and cutoffs are server-owned, never accepted as client authority. Replacement requires the same Carrier/Material, a date-only UTC start later than the predecessor start, ACTIVE successor, and a conflict-free resolution window. There is one successor per predecessor; stale versions fail closed. Clearing an end date uses an explicit empty/null value; omitting it preserves the current end. No deletion or automatic historical repricing endpoint exists.

The server internally resolves the canonical Project/Carrier/Material/date before new Trip persistence. The same pure policy is used by readiness. Rates are tax-exclusive; existing stored tax terms, not browser totals, govern final calculation. The old unused client COW placeholder remains fail-closed and is not the production command; the Wizard uses `/save`.

# Current Phase 8 API — bounded source contract

Classification: CURRENT_ARCHITECTURE_REFERENCE for this section. Exact implementation/owner acceptance state is in [the ledger](reconstruction/02_PHASE_LEDGER.md). These routes are implemented in `server/app.ts`; prior endpoints in the preserved original specification below are not automatically current authority.

All paths below begin `/api/projects/:projectId/import-sessions`. Firebase Bearer authentication and Project isolation precede service-level authorization. Session handlers apply existing allowed-role checks; commit/execution/recovery additionally use the current canonical command principal (SUPER_ADMIN, or PROJECT_ADMIN assigned to the Project), not a client role or acceptedBy stamp.

| Method / suffix | Current contract |
|---|---|
| `POST /` | Create a canonical initial session. Never create directly at advanced review/execution lifecycle. Returns `{success,data}` |
| `GET /` | List authorized resumable session headers: `{success,sessions,count}`; selected artifacts are loaded separately |
| `GET /:importSessionId` | Read the server session/artifacts: `{success,data}`; legacy B2 terminal receipts remain available here |
| `PATCH /:importSessionId` | Versioned checkpoint or bounded immutable chunk staging. `expectedVersion` required; legal server transitions only. Generic Roster execution transitions remain fenced; execution-managed sessions reject ordinary checkpoint/chunk mutation |
| `POST /:importSessionId/commit-reviewed-intent` | `{expectedVersion}`; optional `operationId` / SHA256 `reviewedSignature` must match if supplied. Never accepts a client execution plan, intent, receipt or completion list |
| `GET /:importSessionId/execution` | Durable B3 operation status: `{success,data:{operation,retryAllowed,reviewRequired,completed,remaining}}` |
| `POST /:importSessionId/execution/retry` | Only `{expectedOperationVersion}`. Acquires a new server fence and executes only unfinished groups; stale version or terminal/review-required state is rejected |
| `POST /:importSessionId/execution/cancel` | Only `{expectedOperationVersion}`. Persists an acknowledged stop at a safe transaction boundary; completed effects/receipts remain |

The commit endpoint creates a B3 operation and normally advances at most four independent groups per request. An existing EXECUTING/PARTIAL operation is reported rather than blindly taken over by an old commit request; explicit retry uses the current operation version. Terminal success returns `{lifecycleState:'COMMITTED',receipt,canonicalRefresh}` plus B3 execution status. Other states return `{lifecycleState,execution}` and do not authorize optimistic UI success. Matching completed retries return the existing receipt; cancelled operations do not restart. A pre-B3 B2 atomic receipt retains its existing idempotent commit behavior; no historical B3 journal is fabricated for it, and its session read remains authoritative.

`VERSION_CONFLICT`, `EXECUTION_VERSION_CONFLICT`, `EXECUTION_FENCE_STALE`, binding mismatch and REVIEW_REQUIRED are distinct from completion. A committed transaction followed by failed canonical refresh remains committed; `COMMIT_SUCCEEDED_CANONICAL_REFRESH_PENDING` must not cause business replay. A summary referencing truncated journal detail likewise does not claim complete canonical proof.

B4 integrates the existing status/retry/cancel transport into the Wizard. The list route accepts optional `includeRosterResults=true`: only schema-v2 Roster COMMITTED/CANCELLED records are additionally returned, under the existing Project/creator authorization; default resumable and Trip filtering remains unchanged. The existing Workspace spreadsheet-values reader supplies the Sheets source adapter. Long-running background execution is not added by this contract. Route envelopes expose service error codes; an error response is not proof that a transaction never committed—query durable status after response uncertainty.

## Historical original specification — preserved reference

> **HISTORICAL_RECORD — original design/reference specification.** The preserved body may combine implemented behavior with former targets; it is not proof of current routes, schemas, security, deployment or reconstruction status. Current GitHub main takes precedence. For the verified repository overview see [MASTER_PROJECT_HANDOFF.md](reconstruction/MASTER_PROJECT_HANDOFF.md); current state is [02_PHASE_LEDGER.md](reconstruction/02_PHASE_LEDGER.md). No historical target here authorizes product changes.

# Q Saudi Work Follow — عقد واجهات برمجة التطبيقات (API Contract)

## 1. المعايير العامة والبروتوكولات (General Standards)

* **البروتوكول:** RESTful JSON عبر HTTPS حصراً.
* **إلزامية المصادقة:** جميع الطلبات (باستثناء فحص الصحة `/health`) تتطلب رمز هوية معتمد من Firebase:
  ```http
  Authorization: Bearer <Firebase_ID_Token>
  ```
* **رأس سياق المشروع (Multi-Project Context):**
  ```http
  X-Project-Id: <projectId>
  ```
  يتحقق الخادم من وجود صلاحية للمستخدم على هذا المشروع عبر الـ Custom Claims المشفرة.
* **رأس الحماية من التكرار (Idempotency Key):**
  ```http
  X-Idempotency-Key: <UUIDv4>
  ```
  إلزامي لكل عمليات الكتابة (`POST`, `PUT`, `PATCH`). إذا تم إرسال نفس المعرّف مرتين، يعيد الخادم نفس النتيجة السابقة دون إعادة تنفيذ العملية (مبدأ رقم 9).

---

## 2. هيكلية الاستجابة القياسية (Standard Response Envelope)

### 2.1 استجابة النجاح (Success):
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "correlationId": "req_8f12a9c4-0012",
    "serverTimestamp": "2026-09-09T14:25:30.124Z",
    "projectId": "proj_riyadh_metro_01"
  }
}
```

### 2.2 استجابة الخطأ (Standard Error):
```json
{
  "success": false,
  "error": {
    "code": "INVALID_STATE_TRANSITION",
    "message": "لا يمكن نقل الرحلة من حالة AT_ORIGIN مباشرة إلى COMPLETED دون توثيق الميزان والتفريغ.",
    "details": {
      "currentStatus": "AT_ORIGIN",
      "attemptedStatus": "COMPLETED",
      "requiredEvents": ["EVENT_WEIGHBRIDGE_ORIGIN_CAPTURED", "EVENT_DEPART_ORIGIN"]
    },
    "correlationId": "err_5b88c0a1-7721"
  }
}
```

---

## 3. نقاط النهاية الأساسية (Core API Endpoints)

### 3.1 فحص صلاحيات المستخدم على المشروع
* **المسار:** `GET /api/v1/auth/context`
* **الوصف:** يتحقق من رمز المستخدم ويعيد المشاريع المصرح له بالوصول إليها ودوره في كل مشروع.
* **الاستجابة (200 OK):**
```json
{
  "success": true,
  "data": {
    "userId": "usr_saudi_dispatcher_89",
    "email": "dispatcher@qsaudi.com",
    "accessibleProjects": [
      {
        "projectId": "proj_riyadh_metro_01",
        "role": "DISPATCHER",
        "permissions": ["TRIP_CREATE", "TRIP_EVENT_LOG", "WEIGHBRIDGE_INPUT"]
      }
    ]
  }
}
```

---

### 3.2 إطلاق رحلة جديدة (Dispatch Trip)
* **المسار:** `POST /api/v1/projects/{projectId}/trips`
* **المسؤولية:** خادومية بحتة. يقوم الخادم بالتحقق من سريان فحص الشاحنة، ورخصة السائق، وتوليد `tripNumber` متسلسل، وأخذ لقطة التسعير الحالية (`pricingSnapshot`).
* **الرؤوس الإلزامية:** `Authorization`, `X-Project-Id`, `X-Idempotency-Key`
* **جسم الطلب (Request Body):**
```json
{
  "clientUUID": "c89b21de-74f1-46ab-9610-184bc27a1923",
  "carrierId": "carr_al_mousa_trans",
  "truckId": "trk_volvo_4521_ksa",
  "driverId": "drv_ahmed_al_otaibi",
  "materialId": "mat_base_course_class_a",
  "originSite": "كسارة الدهناء - الموقع الشمالي",
  "destinationSite": "مشروع قطار الرياض - محطة 3B",
  "notes": "توريد عاجل قبل إغلاق التحميل"
}
```
* **استجابة الخادم (201 Created):**
```json
{
  "success": true,
  "data": {
    "tripId": "trp_994821a8",
    "tripNumber": "TRP-2026-008412",
    "status": "DISPATCHED",
    "clientUUID": "c89b21de-74f1-46ab-9610-184bc27a1923",
    "pricingSnapshot": {
      "ruleId": "rule_ton_base_course_01",
      "pricingModel": "PER_TON",
      "baseRateSAR": 28.50,
      "vatRatePercent": 15.0
    },
    "financials": {
      "baseAmountSAR": 0.00,
      "vatAmountSAR": 0.00,
      "totalAmountSAR": 0.00,
      "isFinalized": false
    },
    "createdAt": "2026-09-09T14:30:00.000Z"
  }
}
```

---

### 3.3 تسجيل حدث رحلة (Log Trip Event & Transition)
* **المسار:** `POST /api/v1/projects/{projectId}/trips/{tripId}/events`
* **المسؤولية:** العميل لا يحدد الحالة؛ الخادم يقيم الحدث ويفحص آلة الحالات (State Machine).
* **جسم الطلب (Request Body):**
```json
{
  "clientEventUUID": "evt_d398f821-2314-4112",
  "eventType": "EVENT_WEIGHBRIDGE_ORIGIN_CAPTURED",
  "deviceTimestamp": "2026-09-09T14:45:12.000Z",
  "location": {
    "latitude": 24.7136,
    "longitude": 46.6753,
    "accuracyMeters": 6.5
  },
  "payload": {
    "weighbridgeTicketNo": "WB-DHN-88219",
    "grossWeightKg": 44850,
    "tareWeightKg": 14200,
    "ticketPhotoDriveFileId": "drive_file_1982aa00f"
  }
}
```
* **استجابة الخادم (200 OK):**
```json
{
  "success": true,
  "data": {
    "eventId": "evt_srv_884129",
    "tripId": "trp_994821a8",
    "newStatus": "WEIGHED_ORIGIN",
    "weights": {
      "originTareKg": 14200,
      "originGrossKg": 44850,
      "originNetKg": 30650
    },
    "hasExceptions": false
  }
}
```

---

### 3.4 إتمام الرحلة واحتساب القيمة المالية نهائياً (Complete Trip)
* **المسار:** `POST /api/v1/projects/{projectId}/trips/{tripId}/complete`
* **المسؤولية:** الخادم يحسب القيمة المالية النهائية (القاعدة 6) ويحدث حالة الرحلة إلى `COMPLETED` ويكتب في `audit_logs` ويوجه إشعاراً لـ Google Sheets.
* **جسم الطلب (Request Body):**
```json
{
  "clientEventUUID": "evt_f98124cc-0099",
  "destinationGrossWeightKg": 44780,
  "destinationTareWeightKg": 14220,
  "destinationTicketNo": "WB-DEST-44012",
  "offloadSupervisorNotes": "تم التفريغ ومطابقة العينة بنجاح"
}
```
* **استجابة الخادم (200 OK):**
```json
{
  "success": true,
  "data": {
    "tripId": "trp_994821a8",
    "tripNumber": "TRP-2026-008412",
    "status": "COMPLETED",
    "weights": {
      "originNetKg": 30650,
      "destinationNetKg": 30560,
      "discrepancyKg": -90,
      "billableWeightKg": 30560
    },
    "financials": {
      "billableWeightTons": 30.56,
      "ratePerTonSAR": 28.50,
      "baseAmountSAR": 870.96,
      "demurrageAmountSAR": 0.00,
      "deductionsAmountSAR": 0.00,
      "subtotalSAR": 870.96,
      "vatAmountSAR": 130.64,
      "totalAmountSAR": 1001.60,
      "currency": "SAR",
      "isFinalized": true,
      "finalizedAt": "2026-09-09T16:10:00.000Z"
    }
  }
}
```

---

### 3.5 رفع استثناء تشغيلي (Raise Operational Exception)
* **المسار:** `POST /api/v1/projects/{projectId}/trips/{tripId}/exceptions`
* **جسم الطلب:**
```json
{
  "clientUUID": "exc_998124aa-1123",
  "type": "OVERWEIGHT_VIOLATION",
  "severity": "BLOCKING",
  "details": {
    "measuredGrossKg": 48200,
    "legalMaxGrossKg": 45000,
    "excessWeightKg": 3200
  },
  "notes": "الوزن يتجاوز الحد النظامي المسموح به لوزارة النقل."
}
```

---

### 3.6 مزامنة العمليات الميدانية دفعة واحدة (Idempotent Batch Sync)
* **المسار:** `POST /api/v1/projects/{projectId}/sync/batch`
* **الوصف:** مخصص لتفريغ قائمة انتظار IndexedDB الميدانية بعد عودة الاتصال بالإنترنت.
* **جسم الطلب:**
```json
{
  "batchId": "sync_batch_20260909_001",
  "operations": [
    {
      "idempotencyKey": "op_uuid_101",
      "type": "TRIP_EVENT",
      "tripId": "trp_994821a8",
      "payload": { ... }
    },
    {
      "idempotencyKey": "op_uuid_102",
      "type": "TRIP_EVENT",
      "tripId": "trp_994821a8",
      "payload": { ... }
    }
  ]
}
```
* **الاستجابة (200 OK):**
```json
{
  "success": true,
  "data": {
    "processedCount": 2,
    "results": [
      { "idempotencyKey": "op_uuid_101", "status": "COMMITTED" },
      { "idempotencyKey": "op_uuid_102", "status": "ALREADY_PROCESSED" }
    ]
  }
}
```

---

### 3.7 رفع وثائق الميزان إلى Google Drive
* **المسار:** `POST /api/v1/projects/{projectId}/drive/upload-ticket`
* **المحتوى:** `multipart/form-data`
* **المسؤولية:** يستقبل الخادم الصورة بصيغة Binary، ويتحقق من نوع الملف وحجمه، ثم يرفع الملف إلى المجلد الهرمي للمشروع على Google Drive ويعيد `driveFileId` فقط. لا يتم تخزين مفاتيح Drive في العميل.
