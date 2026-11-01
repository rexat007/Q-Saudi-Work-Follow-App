## Durable Google authorization lifecycle metadata — current

State: [phase ledger](reconstruction/02_PHASE_LEDGER.md); authority: [credential contract](reconstruction/GWS2_BACKGROUND_AUTHORIZATION_CONTRACT.md).

Server-only `workspace_google_authorizations/{authorizationId}` retains encrypted `secret`, Project/actor/subject/Spreadsheet/bindingRevision and scopes. Status now explicitly includes PENDING_VALIDATION, ACTIVE, AUTHORIZATION_REQUIRED, SUPERSEDED and REVOKED. Candidates have `expiresAt` (milliseconds); accepted records clear it and record `refreshValidatedAt`, `automationRequested`, `automationAuthorized`, `lastFailureReason` and update time. No raw access token is persisted. Failed candidates are deleted; interrupted/expired noncanonical candidates cannot activate or be selected by ACTIVE discovery.

`workspace_google_oauth_transactions` adds `previousAuthorizationId` and `authorizationVersion` to the existing ten-minute single-use context. Continuity increments `authorizationVersion` on acceptance/revocation and retains canonical `backgroundAuthorizationId`/status plus allowlisted `authorizationDiagnostic`. Diagnosis/audit contains only closed result/reason/provider code and metadataOnly=true, never credential/email/provider identity. A candidate never becomes the continuity pointer before proof. Failed replacement does not rewrite old continuity or grant.

Binding revision remains the current security/lease generation: new native/legacy bindings start at 1; ordinary repair, Script package/identity maintenance and Ops reports preserve it. No redundant structural/security revision field or resource-ID migration is invented. Physical weights, Trip snapshots, canonical master identity and existing outbox representation remain unchanged.

## Current operational capability and Trip snapshot representation

Status defers to [the ledger](reconstruction/02_PHASE_LEDGER.md); field/policy details are [the operational contract](reconstruction/OPERATIONAL_PROFILES_WORKSPACE_ENGINE_CONTRACT.md).

Project has optional `operationalConfiguration`, plus the internal `operationalConfigurationRequired` marker for new Projects. Its integer version fences administrative saves. Configuration stores independent measurement modes, Driver intake, route metrics, explicit shift windows, optional capacity policy and required checkpoints. New Trips store `operationalSnapshot` (schemaVersion/configuration/derived profile/configurationVersion/estimatedCapacityTonnes/driverAtDispatch), `operationalTimeline` and `operationalWeights`. Physical canonical weights remain kg; explicitly named operational weights are tonnes. Unknown Driver is null only under configured non-preloaded intake. Old Trips and pricing snapshots are not rewritten.

Configured Trip outbox entries contain projectId/tripId/kind=PROFILE_TRIP/revision/status/updatedAt, not browser rows. Server reads canonical Trip state for delivery and rebuilds app-owned aggregates. Continuity preserves confirmed Script identity before content install; explicit generic parent-proven recovery reuses uncertain existing automation. Resource tags on an explicitly adopted SABIL dual Sheet are preserved while the resolver supplies the current dual views/bundle; no replacement Sheet is created.

## GWS1B — durable generated Workspace representation

Current reference; [the ledger](reconstruction/02_PHASE_LEDGER.md) owns status. `projects/{projectId}/workspace_destination/current` binds approved destination root, Project, actor and Google subject. `workspace_continuity/current` records immutable blueprint version/root/subject, execution owner and stages, Project folder ID, spreadsheet ID and Script project ID as each external result becomes known. Binding is published atomically with Project compatibility IDs and audit only after validation.

New public binding fields include `destinationRootFolderId`, `projectFolderId`, `workspaceBlueprintVersion`, `appsScriptBlueprintVersion`, `scriptProjectId`, subject/account label and existing file URL/identity/revision. `templateId/templateVersion` are optional legacy provenance, not new blueprint configuration. Existing legacy bindings are not migrated. Tokens, raw reference data and source workbook IDs are not stored as blueprint content. The compiled asset carries sanitized Sheets structures and exact reviewed Script files plus capture/classification evidence; SABIL-HAIL-V1 is captured from owner-local XLSX + Script source; provenance.json records source/release digests. The manifest is reconstructed, not a Google export. Initial prepared capacity is 297 operational rows, with formula-only expansion on capacity exhaustion under the existing sync fence.

`projects/{projectId}/workspace_sync_outbox/{sha256(tripId)}` remains the canonical coalesced projection event with revision/mappingRequired/delivery state, staged atomically with Trip commands. Correlation and input ownership remain in [the sync contract](reconstruction/PROJECT_GOOGLE_SHEET_SYNC_CONTRACT.md).

## PFAG-RB2 maintenance representation

Current source reference; [maintenance field matrix](reconstruction/PROJECT_FOUNDATION_MAINTENANCE_CONTRACT.md) defines editable/locked fields, while [the ledger](reconstruction/02_PHASE_LEDGER.md) owns state.

Project and global Driver/Truck profile records use optional integer version for optimistic profile edits; legacy missing version means zero. The server increments version on accepted profile saves. Clients submit expectedVersion separately, not a version field patch. Existing audit records retain before/after and actor/time. No historical Trip/report/pricing snapshot is rewritten, and no identity migration/backfill is performed.

The foundation snapshot is an ephemeral transaction-composed response, not a persisted journal or new domain revision/event model. Driver/Truck maintenance profiles are present for authorized Project administrators; Finance receives pricing/readiness context without the maintenance profile details. Suspension changes only Project lifecycle/audit. Reactivation persists ACTIVE only after authoritative readiness revalidation. ARCHIVED transition is deferred with its existing mutation fence intact.

## PFAG-RB1 historical projection and consequence representation

Current architecture reference; see [the ledger](reconstruction/02_PHASE_LEDGER.md) for acceptance/publication.

Membership consequences preserve temporal documents as CLOSED with effectiveTo/updated actor/time, delete corresponding active-slot pointers and retain original intervals. Existing membership/temporal audit records carry the requested parent action and closed relationship identities; no second audit store is introduced. Global identity records are not changed. Existing projection dirty markers are updated atomically; no new coherent-read protocol is claimed.

Historical report fallback mapping:

| Field | Classification | Missing or conflicting captured value |
|---|---|---|
| Project/Carrier/Driver/Truck plate/Material display | HISTORICAL_SNAPSHOT_REQUIRED; ID_ONLY_SAFE_FALLBACK | Saved root/nested snapshot, then legacy captured flat label, then canonical ID; differing labels in one group use its ID |
| Pricing terms, rates and commercial facts | HISTORICAL_SNAPSHOT_REQUIRED | Preserve stored pricing snapshot; do not reprice from today's rule |
| Truck legal payload / utilization | UNAVAILABLE_IF_NOT_CAPTURED | No live/default capacity; missing or mixed captured limits yield unavailable derived utilization |
| Printed Project name | HISTORICAL_SNAPSHOT_REQUIRED; ID_ONLY_SAFE_FALLBACK | Unanimous saved name or Project ID, never live Project display |
| Printed Project tax number | UNAVAILABLE_IF_NOT_CAPTURED | Unanimous captured tax number or unavailable, never fabricated default |
| Explicit current-profile screens | LIVE_PROFILE_ALLOWED | Current Master Data only on explicitly live surfaces; not historical report output |

Single-Project report output exposes optional `historicalProjectInfo` from the captured Trips. No migration, snapshot backfill or new persisted commercial authority is introduced.

# Current pricing snapshots and versions — P9-U1 / P9-U2

Classification: CURRENT_ARCHITECTURE_REFERENCE. Exact phase/unit/publication state belongs only to [the ledger](reconstruction/02_PHASE_LEDGER.md).

Canonical rules remain `projects/{projectId}/pricing_rules/{pricingRuleId}`. Existing `version` is the server optimistic revision. A successor receives a new server-generated ID, `parentRuleId` and an advanced version. The predecessor retains original commercial fields and gains `supersededByRuleId` / `supersededFrom`, plus a revision/audit stamp. `supersededFrom` is an exclusive query cutoff, not an overwrite of original effective dates. These bindings cannot be supplied by clients. `hasHistoricalTrips` is computed list metadata and is not stored on the rule.

TripPricingSnapshot retains selected ID/version, rate/model/currency, effective facts, minimum billable weight, VAT applicability/percentage and contractual waiting terms. Final amount and tax remain stored on the Trip. Subsequent rule/configuration replacement never changes those records. Existing explicit imported pending snapshots are unresolved evidence, not zero-price agreements. Historical unsupported model snapshots remain readable; they do not authorize new unsupported calculations. No mass migration is performed.

# Current Phase 8 persistence model — bounded source reference

Classification: CURRENT_ARCHITECTURE_REFERENCE for this section. State/acceptance is owned by [the ledger](reconstruction/02_PHASE_LEDGER.md). Fields below come from `src/types/importSession.ts`, `src/types/importExecution.ts`, the durable session contract and the B3 server source. B4 adds no new persisted schema or journal: it consumes these same records. Original design text below is historical.

| Durable location / concept | Implemented representation and binding |
|---|---|
| `projects/{projectId}/importSessions/{importSessionId}` | Schema-v2 header: `schemaVersion`, `domain`, `projectId`, `importSessionId`, `operationId`, `importBatchId`, `sourceType`, `lifecycleState`, `currentStage`, `version`, actor/time stamps; Roster uses `rosterStage` |
| Source revision | `source.sourceRevisionId`, source type and accepted discovery/provider facts; local files retain fingerprint/name/size/MIME and `requiresReattach`, not file bytes |
| Mapping revision | `mappingRevisionId`, `sourceRevisionId`, approved mappings and server approval stamps |
| First-class reviewed intent | Project/Session/Operation/Batch, source/mapping revisions, accepted/displacement signatures and semantic intent; stored as a first-class artifact, not approval inferred from a row blob |
| Session artifacts | Immutable `checkpointChunks/{artifactId}_{index}` with count/digest/index/text; `checkpointArtifact` / `artifactFields` manifest pointers publish only complete artifacts; header review acceptance/consent controls remain authoritative |
| Managed execution session linkage | `executionOperationId`, `executionBindingHash`; ordinary checkpoint/chunk mutation is blocked once the execution owns the session |
| `projects/{projectId}/importExecutions/{executionKey}` | Locator hash of Project + existing operation ID, not a new canonical entity ID. Binds Project/Session/Operation/Batch, reviewed signature digest, source/mapping revisions and optional review artifact digest |
| Operation concurrency and progress | `version`, `fence`, `requestVersion`, `sessionVersion`, group/consequence counts and completed counters; `READY`, `EXECUTING`, `PARTIAL`, `REVIEW_REQUIRED`, `CANCELLED`, `COMPLETED` |
| Immutable execution plan | `planManifest` points to operation `checkpointChunks`, using the B1 artifact codec; groups contain sealed semantic plans, provenance/relationship proof and deterministic consequences |
| `importExecutions/{executionKey}/receipts/{groupId}` | Atomic group evidence: binding/fence, completed actor/time, consequence IDs, MUTATED/SATISFIED outcomes and proof references, plus B2 canonical result |
| Failure and cancellation | `failure` identifies the unfinished failed group/code and retry/review flags; `cancellation.requestedAt/requestedBy/acknowledgedAt` records durable stop without deleting successful receipts |
| Terminal truth | `receipt` / session `commitReceipt`, prepared-to-canonical map and result summary. `accumulated` carries bounded progress; `receiptDetails` references full execution-journal detail when summary arrays are truncated |

The operation binding prevents reuse of the same Project-scoped operation for a different Session/Batch/review. Consequence hashes bind semantic effects to the reviewed operation; row numbers are provenance, not retryable-effect identities. Canonical Driver/Truck IDs and natural identity rules remain owned by the existing authorities.

A group mutation, receipt and version advance are one transaction. Failed groups produce no partial canonical writes; earlier completed groups stay complete. Cancellation records completed and remaining knowledge and does not claim rollback. Final bounded summaries never replace the full group receipts or claim complete fresh canonical proof when truncated. No per-field source payload, new schema field or durable UI cache is inferred from the old design below.

B4 remote-source resume compares the persisted spreadsheet/tab and SHA-256 of the accepted values snapshot. Local reattach checks persisted file metadata and SHA-256 against the same buffer supplied to analysis. Terminal receipts and durable review snapshots require no source bytes.

## Historical original specification — preserved reference

> **HISTORICAL_RECORD — original design/reference specification.** The preserved body may combine implemented behavior with former targets; it is not proof of current routes, schemas, security, deployment or reconstruction status. Current GitHub main takes precedence. For the verified repository overview see [MASTER_PROJECT_HANDOFF.md](reconstruction/MASTER_PROJECT_HANDOFF.md); current state is [02_PHASE_LEDGER.md](reconstruction/02_PHASE_LEDGER.md). No historical target here authorizes product changes.

# Q Saudi Work Follow — نموذج البيانات والمخطط الهيكلي (Data Model & Schema)

## 1. فلسفة تخزين البيانات ومصدر الحقيقة (Storage Philosophy)

* **Firestore** هو قاعدة البيانات العملياتية الأساسية والمصدر الأوحد للحقيقة (Single Source of Truth - SSOT).
* يتم تنظيم البيانات بنمط **Multi-Tenant Scoped Subcollections** لضمان العزل التام للمشاريع وسهولة تطبيق أمان Firestore Security Rules.
* **Denormalization الاستراتيجي للقطات التاريخية (Historical Snapshots):**
  البيانات المرجعية (مثل اسم السائق، رقم لوحة الشاحنة، اسم الناقل، مصفوفة التسعير الحالية) يتم أخذ لقطة فورية منها (`Snapshot`) وتضمينها داخل وثيقة الرحلة (`Trip`). هذا يضمن أن أي تعديل مستقبلي على بيانات السائق أو تعديل في أسعار الناقل لن يغير السجلات المالية والمحاسبية القديمة نهائياً.

---

## 2. الهيكلية الشجرية لمجموعات Firestore (Firestore Hierarchy)

```
/projects/{projectId}                             (وثيقة المشروع الرئيسية)
   ├── /carriers/{carrierId}                      (شركات النقل المتعاقدة)
   ├── /materials/{materialId}                    (المواد المصرح بنقلها ومواصفاتها)
   ├── /pricing_rules/{ruleId}                    (قواعد التسعير والتعريفات)
   ├── /trucks/{truckId}                          (أسطول الشاحنات المعتمد)
   ├── /drivers/{driverId}                        (السائقون المعتمدون)
   ├── /trips/{tripId}                            (سجلات الرحلات الميدانية)
   │      ├── /events/{eventId}                   (الأحداث الزمنية للرحلة)
   │      └── /exceptions/{exceptionId}           (الاستثناءات والتعثرات)
   ├── /sync_operations/{syncOpId}                (عمليات المزامنة لضمان عدم التكرار Idempotency)
   └── /sheet_projections/{projectionId}          (بيانات ربط وإسقاط Google Sheets)

/users/{userId}                                   (ملفات المستخدمين والأدوار)
/audit_logs/{auditLogId}                          (سجل التدقيق الشامل غير القابل للتعديل)
```

---

## 3. تعريفات الكيانات والواجهات البرمجية (TypeScript Entity Schemas)

### 3.1 مشروع (Project Entity)
```typescript
interface Project {
  id: string;                                   // معرّف المشروع (e.g. "proj_riyadh_metro_01")
  nameAr: string;                               // اسم المشروع بالعربية
  nameEn: string;                               // Project Name in English
  clientName: string;                           // اسم العميل / الجهة المالكة
  location: {
    lat: number;
    lng: number;
    geoFenceRadiusMeters: number;               // نطاق السياج الجغرافي للموقع
    addressAr: string;
  };
  settings: {
    zatcaTaxNumber: string;                     // الرقم الضريبي 15 رقم
    vatRatePercent: number;                     // عادة 15% في المملكة
    googleDriveFolderId: string;                // معرّف المجلد الرئيسي على Google Drive
    googleSpreadsheetId: string;                // معرّف ملف Google Sheets للتقارير
    allowDriverSelfDispatch: boolean;
  };
  status: 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED';
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}
```

### 3.2 الناقل (Carrier Entity)
```typescript
interface Carrier {
  id: string;                                   // معرّف الناقل
  projectId: string;                            // معرّف المشروع المرتبط به
  companyNameAr: string;                        // اسم شركة النقل
  commercialRegistrationNo: string;             // السجل التجاري (CR)
  transportLicenseNo: string;                   // ترخيص هيئة النقل (TGA)
  contactPerson: {
    name: string;
    phone: string;                              // e.g. "+9665XXXXXXXX"
    email: string;
  };
  isActive: boolean;
  pricingRuleId: string;                        // قاعدة التسعير الافتراضية للناقل
  createdAt: FirebaseFirestore.Timestamp;
}
```

### 3.3 المادة (Material Entity)
```typescript
interface Material {
  id: string;
  projectId: string;
  code: string;                                 // e.g. "AGG_20MM", "BASE_COURSE"
  nameAr: string;
  unitOfMeasure: 'TON' | 'M3' | 'TRIP';
  standardDensityTonPerM3?: number;             // الكثافة القياسية
  maxAllowableMoisturePercent?: number;         // نسبة الرطوبة المسموحة
  isActive: boolean;
}
```

### 3.4 الشاحنة (Truck Entity)
```typescript
interface Truck {
  id: string;
  projectId: string;
  carrierId: string;
  plateNumberAr: string;                        // e.g. "أ ب ج 1234"
  plateNumberEn: string;                        // e.g. "ABC 1234"
  truckType: 'TIPPER_32M3' | 'TRAILER_24M' | 'FLATBED' | 'DUMPER';
  tareWeightKg: number;                         // الوزن الفارغ المعتمد رسميًا
  maxGrossWeightKg: number;                     // الحد الأقصى للوزن الإجمالي النظامي
  legalPayloadLimitKg: number;                  // حمولة النظام المسموح بها (Gross - Tare)
  mvpiValidUntil: FirebaseFirestore.Timestamp;  // تاريخ سريان الفحص الدوري
  insuranceValidUntil: FirebaseFirestore.Timestamp;
  isActive: boolean;
}
```

### 3.5 السائق (Driver Entity)
```typescript
interface Driver {
  id: string;
  projectId: string;
  carrierId: string;
  fullNameAr: string;
  nationalOrIqamaId: string;                    // رقم الهوية أو الإقامة (10 أرقام)
  phone: string;                                // جوال السائق للـ OTP
  licenseNumber: string;
  licenseValidUntil: FirebaseFirestore.Timestamp;
  currentAssignedTruckId?: string;
  isActive: boolean;
}
```

### 3.6 قاعدة التسعير (Pricing Rule Entity)
```typescript
interface PricingRule {
  id: string;
  projectId: string;
  carrierId?: string;                           // اختياري إذا كانت خاصة بناقل
  materialId: string;
  name: string;
  pricingModel: 'PER_TON' | 'PER_TRIP' | 'PER_KM' | 'FLAT_RATE';
  baseRateSAR: number;                          // السعر الأساسي بالريال السعودي
  minimumBillableWeightKg?: number;             // الحد الأدنى للوزن المحتسب
  demurrageRatePerHourSAR: number;              // سعر غرامة التأخير في الساعة
  freeTimeHours: number;                        // ساعات الانتظار المجانية المسموحة
  vatApplicable: boolean;                       // خضوع للضريبة (15%)
  effectiveDate: FirebaseFirestore.Timestamp;
  expiryDate?: FirebaseFirestore.Timestamp;
  isActive: boolean;
}
```

### 3.7 الرحلة (Trip Entity - الحاوية المركزية)
```typescript
interface Trip {
  id: string;                                   // Trip ID (UUID or Auto-ID)
  tripNumber: string;                           // الرقم التشغيلي المتسلسل (e.g. "TRP-2026-004128")
  projectId: string;
  
  // لقطات غير قابلة للتعديل للحفاظ على الدقة التاريخية
  carrierSnapshot: {
    id: string;
    nameAr: string;
    commercialRegistrationNo: string;
  };
  truckSnapshot: {
    id: string;
    plateNumberAr: string;
    tareWeightKg: number;
    legalPayloadLimitKg: number;
  };
  driverSnapshot: {
    id: string;
    nameAr: string;
    nationalOrIqamaId: string;
    phone: string;
  };
  materialSnapshot: {
    id: string;
    code: string;
    nameAr: string;
    unitOfMeasure: string;
  };
  pricingSnapshot: {
    ruleId: string;
    pricingModel: string;
    baseRateSAR: number;
    vatApplicable: boolean;
    vatRatePercent: number;
  };

  // الحالة التشغيلية الخادومية (FSM)
  status: 
    | 'DRAFT'
    | 'DISPATCHED'
    | 'AT_ORIGIN'
    | 'LOADING'
    | 'WEIGHED_ORIGIN'
    | 'IN_TRANSIT'
    | 'AT_DESTINATION'
    | 'WEIGHED_DESTINATION'
    | 'OFFLOADED'
    | 'COMPLETED'
    | 'REJECTED'
    | 'CANCELLED';

  // قياسات الميزان (Server Validated Weights)
  weights: {
    originTareKg?: number;
    originGrossKg?: number;
    originNetKg?: number;                       // Gross - Tare
    originWeighbridgeTicketNo?: string;
    originWeighbridgeTicketDriveFileId?: string; // رابط تذكرة الميزان على Google Drive
    
    destinationTareKg?: number;
    destinationGrossKg?: number;
    destinationNetKg?: number;
    destinationWeighbridgeTicketNo?: string;
    destinationWeighbridgeTicketDriveFileId?: string;

    billableWeightKg?: number;                  // الوزن المعتمد للفوترة خادومياً
  };

  // الحساب المالي الخادومي النهائي (لا يحدده العميل أبداً)
  financials: {
    baseAmountSAR: number;                      // القيمة الأساسية
    demurrageAmountSAR: number;                 // غرامات التأخير
    deductionsAmountSAR: number;                // خصومات الجودة أو الانسكاب
    subtotalSAR: number;                        // قبل الضريبة
    vatAmountSAR: number;                       // 15% VAT
    totalAmountSAR: number;                     // الإجمالي النهائي المستحق
    currency: 'SAR';
    isFinalized: boolean;                       // تم قفل القيمة المالية
    finalizedAt?: FirebaseFirestore.Timestamp;
  };

  // بيانات المزامنة والتحكم الميداني
  clientUUID: string;                           // معرّف الرحلة من طرف العميل
  syncStatus: 'SYNCED' | 'PENDING' | 'CONFLICT';
  hasExceptions: boolean;
  activeExceptionCount: number;

  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}
```

### 3.8 أحداث الرحلة (Trip Event Entity)
```typescript
interface TripEvent {
  id: string;
  tripId: string;
  projectId: string;
  eventType: 
    | 'EVENT_DISPATCHED'
    | 'EVENT_ORIGIN_ARRIVAL'
    | 'EVENT_WEIGHBRIDGE_ORIGIN_CAPTURED'
    | 'EVENT_DEPART_ORIGIN'
    | 'EVENT_DESTINATION_ARRIVAL'
    | 'EVENT_WEIGHBRIDGE_DESTINATION_CAPTURED'
    | 'EVENT_CARGO_OFFLOADED'
    | 'EVENT_TRIP_COMPLETED'
    | 'EVENT_EXCEPTION_RAISED';
  
  statusResulting: Trip['status'];              // الحالة الناتجة بعد الحدث
  actor: {
    userId: string;
    role: string;
    displayName: string;
  };
  deviceTimestamp: string;                      // وقت الجهاز في الميدان (ISO)
  serverTimestamp: FirebaseFirestore.Timestamp; // الطابع الزمني المعتمد خادومياً
  location?: {
    latitude: number;
    longitude: number;
    accuracyMeters: number;
  };
  payload: Record<string, any>;                 // تفاصيل الحدث (مثل أوزان، صور، ملاحظات)
  idempotencyKey: string;
}
```

### 3.9 الاستثناءات التشغيلية (Exception Entity)
```typescript
interface TripException {
  id: string;
  tripId: string;
  projectId: string;
  type: 
    | 'OVERWEIGHT_VIOLATION'                    // تجاوز الوزن القانوني للشاحنة
    | 'WEIGHT_DISCREPANCY'                      // فرق ميزان كبير بين التحميل والتفريغ
    | 'ROUTE_DEVIATION'                         // انحراف عن المسار المحدد
    | 'EXCESSIVE_TRANSIT_TIME'                  // تأخر غير مبرر
    | 'DAMAGED_CARGO'                           // تلف في المادة
    | 'VEHICLE_BREAKDOWN'                       // عطل ميكانيكي
    | 'OFF_HOURS_MOVEMENT';                     // تحرك في أوقات حظر الشاحنات بالرياض/جدة
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'BLOCKING';
  status: 'OPEN' | 'INVESTIGATING' | 'WAIVED' | 'RESOLVED';
  reportedBy: {
    userId: string;
    displayName: string;
    timestamp: FirebaseFirestore.Timestamp;
  };
  resolution?: {
    resolvedByUserId: string;
    resolutionNotes: string;
    financialPenaltySAR?: number;
    resolvedAt: FirebaseFirestore.Timestamp;
  };
}
```

### 3.10 سجل التدقيق غير القابل للتعديل (Audit Log Entity)
```typescript
interface AuditLog {
  id: string;
  projectId: string;
  entityType: 'TRIP' | 'PRICING_RULE' | 'TRUCK' | 'USER_ROLE' | 'FINANCIAL_ADJUSTMENT';
  entityId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'FORCE_STATUS_CHANGE' | 'RECALCULATE_PRICING';
  actor: {
    userId: string;
    email: string;
    role: string;
    ipAddress: string;
    userAgent: string;
  };
  changes: {
    before: Record<string, any> | null;
    after: Record<string, any>;
    deltaFields: string[];
  };
  correlationId: string;
  serverTimestamp: FirebaseFirestore.Timestamp;
}
```

### 3.11 عملية المزامنة وحماية التكرار (Sync Operation Entity)
```typescript
interface SyncOperation {
  id: string;                                   // تساوي idempotencyKey
  projectId: string;
  userId: string;
  clientOperationUUID: string;
  targetCollection: string;
  targetDocId: string;
  status: 'PROCESSED' | 'FAILED' | 'REJECTED';
  processedResponse: Record<string, any>;
  processedAt: FirebaseFirestore.Timestamp;
  ttl: FirebaseFirestore.Timestamp;             // الاحتفاظ بها 90 يوماً للمطابقة
}
```

---

## 4. استراتيجية الفهارس (Firestore Indexing Strategy)

لضمان سرعة الاستعلام وتفادي اختناقات الأداء الميدانية:

1. **مؤشرات الحقول الفردية (Single-Field Indexes):**
   * `tripNumber` (Unique per project)
   * `status`
   * `clientUUID`
   * `createdAt`

2. **مؤشرات الفهارس المركبة (Composite Indexes):**
   * `trips`: `projectId` (Asc) + `status` (Asc) + `createdAt` (Desc)
   * `trips`: `projectId` (Asc) + `carrierSnapshot.id` (Asc) + `createdAt` (Desc)
   * `trips`: `projectId` (Asc) + `truckSnapshot.id` (Asc) + `status` (Asc)
   * `events`: `tripId` (Asc) + `serverTimestamp` (Asc)
   * `audit_logs`: `projectId` (Asc) + `entityType` (Asc) + `serverTimestamp` (Desc)
   * `sync_operations`: `projectId` (Asc) + `clientOperationUUID` (Asc)
