## Zero-Picker live closure — current

State authority: [02_PHASE_LEDGER.md](02_PHASE_LEDGER.md). Closure baseline `870a6a8813eab20cff7e354a1a3d9df221757b63`. Q-PRJ-009 symptoms are owner-provided evidence; this source unit does not manually repair or mutate that Project.

NORMAL_DESTINATION_POLICY = APPLICATION_MANAGED_DRIVE_ROOT; GOOGLE_PICKER_NORMAL_FLOW = RETIRED; NORMAL_GOOGLE_INTERACTIONS = ONE_OAUTH_FLOW. One primary action may obtain one durable OAuth grant, then the server ensures Q Saudi Work Follow / Projects / <projectCode> — <projectName>, Sheet, binding, workbook, data, Script and strict READY. No requestGoogleScopes, browser Drive token, Picker or destination selection occurs in runWorkspaceEnsureJourney. Optional custom destinations remain explicit advanced compatibility tooling, outside normal ensure. POST ensure now accepts only `{}`. Legacy pending DESTINATION is translated into canonical resume/Google authorization, not another Picker request.

### Managed root identity and permissions

The existing drive.file scope permits creation/access of these application-created folders. No broader Drive permission is requested. Native Drive creation atomically attaches appProperties owner=Q_SAUDI_WORK_FOLLOW, schemaVersion=1, subjectHash and resourceRole WORKSPACE_ROOT/PROJECTS_ROOT. Lookups use those exact ownership tags with bounded listings, never a title. IDs are verified for MIME/trashed/write capability; Projects must have the canonical application parent. Names alone cannot authorize adoption or replacement.

Server-only workspace_drive_roots/<account hash> holds applicationRootId, projectsRootId, per-resource create intent, owner/expiry/revision and bounded state/error. It is shared infrastructure per authorized Google account, not a second Project binding registry. Project continuity stores only its managedRootKey pointer plus its existing Project resource receipts/binding. Shared-root and Project leases compose at provider boundaries. Concurrent Projects join an active root operation. A lost root-create response reconciles tagged ownership; an unresolved create intent never causes another create merely because a listing is empty. Only an acknowledged provider rejection proving non-creation clears that attempt’s intent for a later command; no automatic retry is added. The managedRootKey survives repeated claims; bound Workspaces verify the same root identities/parent and cannot create replacement roots when their receipt/evidence is missing. Foreign/duplicate tags or wrong parents fail closed. Historical bound/partial Project resource identities remain unchanged; no forced root migration is performed.

### Handoff source diagnosis and closure

Initial merged GWS-ONE already wrote binding, operation fence and grant together. This unit does not pretend those writes were absent. A shared pure adoption proof now validates Project, operation, actor, active grant pointer, Google subject, recorded folder/Sheet, binding revision and provisioning actor. The same transaction commits continuity.binding, ensureOperation bindingRevision/spreadsheetId and active grant bindingRevision/spreadsheetId/provisioningOperationId. A fresh transaction then verifies committed identity and refresh proof before Workbook execution. No second OAuth is required solely for revision 0→1 or empty→real Spreadsheet.

A valid legacy partial handoff can be reconciled on the same ensure command only with that full durable proof; it cannot attach another Project, subject or credential. The same helper owns first commit and compatibility adoption. A stale provision request no longer writes a degraded state over an already committed binding after another owner completed the operation. This is a generic source migration, not a manual Q-PRJ-009 patch.

### HTTP conflict and generation classification

| Condition | Normal handling |
|---|---|
| Active ensure/resource/shared-root lease | 200 PREPARING; observe that canonical owner |
| Stale owner/fence, valid progressing owner | Read canonical state; 200 join/READY |
| Expired valid operation | Canonical canResume, same ensure command |
| Impossible binding/subject/ownership identity | ATTENTION_REQUIRED; no adoption/recreation |
| APP_UPDATE_REQUIRED before/at POST | Keep the generation fence; save bounded navigation hint, guarded PWA update/reload, then observe/resume |
| Auth/scope denial | Existing Google-consent boundary; no browser-token fallback |

No catch-and-ignore 409 or additional retry/sleep mechanism is introduced. Every command invocation, including after consent, consults canonical state after a fence failure. Continuation is saved before the preflight generation check can initiate an immediate reload, and updated for a raced POST mismatch. A genuine generation mismatch stops the old-page journey and blocks its automatic continuation instead of repeatedly posting ensure. Project navigation changes clear the old hint; actual browser reload preserves it. Successful READY consumes it. Session hints contain only actor/Project/operation/time, expire, grant no authority and cannot restore a Project outside the current server-scoped inventory. Restoration is once per page; the current Project/intent guard prevents stale requests replacing the navigation hint. Existing PWA per-target reload/worker-version checks and offline-cache policy remain.

NORMAL_409_CONFLICT = ZERO for legitimate concurrency/join paths. A generation race may still produce one internal APP_UPDATE_REQUIRED 409; it initiates reload rather than appearing as an operator error. True non-normal security/identity refusals retain their boundaries. Workbook and durable-authorization repair remain internal phases, never separate required normal buttons.

The accepted 4×3 matrix, 13 fresh tabs, metadata ownership, bounded-memory repair, user-active sync/no cron and ambiguous Script-create ATTENTION_REQUIRED/no-duplicate exception remain. Source/local fixtures do not claim deployed acceptance. After owner deployment use a new fresh Project unless Q-PRJ-009 identities are independently proven clean. RESET_TEST_PROJECTS remains a separate future owner-reviewed operation, not executed here.

### Local zero-Picker closure verification — 2026-11-02

91/91 focused cases PASS. Coverage includes all 12 measurement/intake combinations, one effective root/Projects/Project-folder/Spreadsheet/Script set after 20 repeated commands, zero Picker/GIS/Drive-token requests in the normal journey, one durable OAuth at most, real React/client/engine continuation, 13 fresh tabs, atomic five-field handoff and committed read-back, proven legacy partial handoff, no foreign adoption, and no stale request downgrading a completed binding. Native Drive fixtures assert drive.file authorization, atomic appProperties, tag-filtered bounded discovery, parent/write proof and incomplete-list fail-closed behavior. Root receipt loss, ambiguous creation, acknowledged quota rejection, duplicate/foreign ownership, shared leases and bound-root identity loss remain safe.

Reload fixtures cover both preflight and raced-POST build changes, actor/Project/operation hints before immediate reload, per-target reload-once across page instances, current-scope navigation restoration, actual remount resuming the durable operation with unchanged IDs, and stale Project requests unable to replace the hint. The actual generation fence is unchanged; concurrency HTTP tests return 200 canonical progress, while a build race retains its internal APP_UPDATE_REQUIRED signal and never creates a normal-user 409 loop. Legacy pending destination state migrates to managed-root resume/Google authorization, not Picker. No new ordinary button or manual Script/destination input is introduced.

Affected regression selection: 81 files, consolidated latest results 1471/1503 PASS, skipped/pending 0. All 32 failed assertions were reproduced independently on untouched merged 870a6a8813eab20cff7e354a1a3d9df221757b63. They remain the seven historical files listed in the initial-engine observation below. workspaceConvergence.test.ts and workspaceIntegration.test.ts retain identical baseline empty-suite errors. The broad command is nonzero / NOT all green. No new failing case/suite error, test removal or skip is hidden. Existing engine/UI cases remain 43/8; existing HTTP cases are preserved and extended from 10 to 14. Counts describe these observations only.

Build PASS; baseline/final lint EXIT 2 / NOT PASS, 440→440 diagnostics, added/removed 0 using a multiset normalized only for positions/equivalent quoted-union display order. Diff check PASS. No Google scopes/Cloud settings, locale, dependency/config/workflow/rules, blueprint/Script assets, generated artifacts or business/API-domain changes outside the Workspace closure. Source/controlled fixtures do not prove live Google/Render acceptance. No Q-PRJ-009 patch, reset, PR, merge or Phase 10; use independently clean identities or a new Project after owner deployment.

## Initial engine architecture, retained contracts

# GWS-ONE — one-click provisioning engine

Current phase/unit authority: [02_PHASE_LEDGER.md](02_PHASE_LEDGER.md). Baseline `c1dc6254773b5d8e74c8067d4ce96f3f0e98ad71`. This contract describes local source; live Google/deployment acceptance remains separate.

## Product and authority

WORKSPACE_PRODUCT_ENTRYPOINT = ONE_CLICK_ENSURE; WORKSPACE_ORCHESTRATION_AUTHORITY = SERVER; NORMAL_WORKSPACE_BUTTONS = ONE_PRIMARY_ACTION. Normal UI exposes NOT_CONFIGURED, PREPARING, ACTION_REQUIRED, READY, ATTENTION_REQUIRED. It displays translated progress and one prepare/verify control. Manual Script ID, initialize, retry, repair, recover and maintenance controls are retired from ordinary UX and remain within closed privileged Advanced diagnostics.

`POST /api/projects/:projectId/workspace/ensure` accepts `{}`; `GET` on the same path observes the canonical operation. Neither accepts resource identities/phase/state/credential claims. Firebase authentication, live Project role/scope/mutability and generation fences remain. Only server-declared Google authorization may interrupt the normal client journey; destination management is internal. After accepted OAuth callback/read-back, the same journey automatically invokes ensure again. Correlation binds consent to Project, operation, browser transaction, authorization version and binding version. A pending operation is discoverable after browser refresh; active work is observed and expired work resumes. The client observes bounded progress; it does not choose creation/repair/sync phases. Normal provisioning uses durable consent only; Picker is advanced compatibility tooling.

## Responsibility convergence

| Existing authority | Retained responsibility |
|---|---|
| ProjectGoogleWorkspaceServer | Canonical Project access, receipt-backed resources, binding, repair, Script content authority, projection and execution leases |
| WorkspaceGoogleOfflineAuthorization | Encrypted refresh grant/PKCE/nonce/subject validation, active pointer, current principal and binding fences |
| WorkspaceProvisioningOrchestrator | One explicit durable lifecycle and strict composite completion, using the above authorities |
| WorkspaceSyncCoordinator | User-active pending delivery after provisioning; heavy ensure is not triggered by normal application activity |
| Blueprint adapter / registry | Tagged resource creation/reconciliation, parent/content proof, bounded inspection and profile-specific manifest |
| Wizard / client service | Start/resume/observe and satisfy declared human actions; specialized tools remain advanced |

No parallel resource registry is introduced. `ensureOperation` is embedded in the existing Project continuity record: Project/operation/actor, configuration hash, profile/version, durable phase/completed checkpoints, attempt/revision, bounded last error, created/updated/progress timestamps, owner/expiry and a bounded 48-event timeline. Existing continuity resource IDs, destination receipt, binding and sync leases remain canonical. The phase order is PREFLIGHT → AUTHORIZATION → DESTINATION → FOLDER → SPREADSHEET → BINDING → WORKBOOK → MASTER_DATA → SCRIPT → SCRIPT_VERIFY → FINAL_SYNC → FINAL_VERIFY → READY. Confirmations are monotonic; retries revalidate existing resources and use their durable identities.

One expiring outer operation lease serializes ensure. The existing inner sync/resource leases fence each mutating authority. They compose at the provider request boundary; final verification restores the outer fence after inner release. Concurrent callers observe PREPARING, not a user-facing 409. Expired owners may be resumed; stale owner acknowledgments are rejected. A current principal/grant/configuration change cannot silently acknowledge old work. Resource creation never happens from client-supplied state.

## Durable authorization before binding

The existing encrypted grant lifecycle now accepts an explicit ensure-operation-bound pre-binding descriptor. It is not a fake resource binding: spreadsheet identity is empty/revision 0 until provisioning commits. OAuth start verifies the current operation/actor and Google subject. Callback checks the same operation, subject, browser proof, authorization version and descriptor; refresh validation is unchanged. The canonical binding transaction atomically promotes the active grant to the actual Spreadsheet/revision before bound execution. After binding, only the durable server grant can execute; browser tokens remain provisioning/Picker-only. Another/stale operation or callback cannot promote or replace this authority. No new scope, client secret path, browser refresh credential or weakening of credential Firestore rules.

## Resource/restart rules and accepted exception

Folder and native Spreadsheet creation atomically attach operation/role/version ownership metadata through Drive. A lost response resumes by unique matching ownership evidence. A zero/multiple/wrong-parent match is not permission to guess or create a replacement. The same Project operation ID, root, folder, Spreadsheet and binding persist across retry; historical migration is explicit.

Script protocol: SCRIPT_CREATE_INTENT + automationCreationAllowed=false → provider create → SCRIPT_IDENTITY_RECORDED → canonical content install → parent/content verification. Returned ID and binding are persisted before content install. Known IDs verify/install only on mismatch/re-verify; no replacement creation. Pure pre-create permission/service failure can retry without having consumed creation. Once a create may have left the process without a durably recorded ID, SCRIPT_CREATE_IDENTITY_UNCERTAIN is non-retryable ATTENTION_REQUIRED. This precise provider boundary is owner-accepted: preserve resources and zero additional creates, not automatic READY. No local journal can recover a bound Script ID absent from all durable local evidence through an API that lacks idempotency or get-by-parent discovery.

Advanced identity recovery requires an authorized admin/durable grant, current binding revision/lease, matching Google subject, proven Script parent == canonical Spreadsheet, and no competing Project identity claim. Script identities are claimed transactionally in server-only metadata; canonical storage/parent proof remains mandatory. Supplied IDs are never trusted by themselves. Successful proof makes the existing operation resumable. Normal users never type Script IDs. Historical foreign-resource permission denial is classified HISTORICAL_EXTERNAL_RESOURCE_PERMISSION and does not authorize resource replacement.

## Intentional fresh template

FRESH_TEMPLATE_AUTHORITY = PROFILE_MANIFEST. Four measurement profiles × three existing driver-intake modes resolve deterministically; PRE_REGISTERED and HYBRID in product terminology correspond to PRELOADED_ROSTER and MIXED. Intake remains orthogonal to measurement and never makes Material globally mandatory.

Fresh V2 contains exactly the 9 owned Ops tabs plus 4 owned canonical reference tables. Every manifest entry carries stable key/title, purpose, profile/schema and DOCUMENT ownership metadata. Owned renamed tabs resolve from metadata; duplicate owners or a canonical title occupied by an unowned/foreign tab fail closed. Repeat ensure never duplicates owned tabs. Fresh generation does not cumulatively inherit historical compatibility. Current profiles all require the lightweight profile report/menu/review Script bundle; none is falsely marked NOT_REQUIRED to bypass readiness.

| Tab | Fresh purpose |
|---|---|
| Ops Overview | REQUIRED_REPORTING |
| Ops Trip Register | REQUIRED_OPERATIONAL |
| Ops Live Movement | REQUIRED_OPERATIONAL |
| Ops Daily Operations | REQUIRED_REPORTING |
| Ops Carrier Performance | REQUIRED_REPORTING |
| Ops Driver & Truck Performance | REQUIRED_REPORTING |
| Ops Exceptions | REQUIRED_REPORTING |
| Ops Dashboard | REQUIRED_REPORTING |
| Ops Audit | REQUIRED_AUDIT |
| السائقين (MASTER_DRIVERS) | REQUIRED_REFERENCE |
| الناقلين (MASTER_CARRIERS) | REQUIRED_REFERENCE |
| المواد (MASTER_MATERIALS) | REQUIRED_REFERENCE |
| سجل الأسطول والتشغيل (MASTER_FLEET_ROSTER) | REQUIRED_REFERENCE |

| Historical SABIL tab | Fresh disposition |
|---|---|
| Loading Register | LEGACY_COMPATIBILITY_ONLY |
| Offload Data | LEGACY_COMPATIBILITY_ONLY |
| Offload Operations Audit | LEGACY_COMPATIBILITY_ONLY |
| Daily Summary | LEGACY_COMPATIBILITY_ONLY |
| Carrier Report Viewer | LEGACY_COMPATIBILITY_ONLY |
| Carrier Daily Report | LEGACY_COMPATIBILITY_ONLY |
| Dashboard | LEGACY_COMPATIBILITY_ONLY |

Legacy Script routines and register/report formulas remain for existing historical workbooks. Fresh profile Trip events/reporting use owned Ops surfaces and canonical Firestore projections instead. Existing SABIL/partial/unowned user tabs are preserved, never deleted/reclassified as a fresh template. The only removable default is a positively proven pristine initial Sheet1. Blueprint selection/version is persisted in binding; subsequent workers resolve that version rather than silently upgrading historical resources.

## Completion, failures and memory

WORKSPACE_READY = STRICT_COMPOSITE_GATE: proven binding/resources, valid durable authorization, healthy workbook, verified required Script, completed canonical projection, zero pending/dirty work, successful synchronization, final resource/workbook and authorization proof. READY is not inferred from a binding or a successful HTTP response alone. Public observation can demote readiness when canonical health/auth/data changes; details remain in privileged diagnostics. Retryable network/5xx/quota failures preserve checkpoints and resources. Identity/subject/ownership conflict and uncertain Script create require attention; no automatic consent loop, blind create or false success.

Canonical Firestore business data is projected, never imported back as a second database. Metadata-first bounded repair and existing owned-table paged delivery remain. No full workbook grid fetch, sleep-based server phase sequencing, scheduler/RAM upgrade or unrelated domain change. Existing generic master projection volume ceilings remain their separate contract; structural provisioning remains independent of legacy row volume.

## Clean acceptance and reset boundary

The executable `workspaceOneClickProvisioning` fixtures use the real orchestrator, encrypted grant lifecycle, binding promotion, canonical projection builder and request-interpreting workbook model. They are deterministic provider emulation, not actual Google/Firebase/Render acceptance. Owner live clean acceptance remains CLEAN_PROJECT_TEMPLATE_ACCEPTANCE after merge/verification. RESET_TEST_PROJECTS is NOT_EXECUTED: a separate owner-reviewed operation may delete disposable historical Projects including the old Beta2 Project, preserve users/auth/infrastructure and approved global identities, then create fresh Projects for all profiles and verify exact resources/tabs/idempotence. No Q-PRJ-007/Q-PRJ-008 mutation or deletion is part of this source unit.

## Historical initial-engine verification observation — 2026-11-02

GWS-ONE engine + React journey: 51/51 PASS. This includes the actual React primary control driving the real orchestrator, encrypted grant/callback validation, binding promotion, resource receipts, canonical projection builder and workbook mutation interpreter from one click. The 12-configuration matrix repeats ensure 20 times per configuration with one folder, one Spreadsheet, one Script and 13 uniquely owned tabs. An empty fresh Project produces neutral canonical references without fabricated rows. Double-click joins, folder/Sheet lost responses, before-create failure, persisted identities, process lease expiry/stale owner fencing, content install/verification interruption, every major temporary-provider phase, revoked grants, wrong operations and untrusted payload sanitization are covered. The ambiguous Script-create result is an accepted PASS only when attention is durable and additional create calls remain zero.

Seven-file focused closure, latest result per file: 164/164 PASS (overlapping broader results). Native adapter checks prove bounded fresh creation, canonical locale/timezone, safe default removal, repeat without writes, metadata-owned rename and rejection of an unowned master-title collision. Existing large historical-grid regression remains unchanged and passing. Localhost HTTP checks retain Firebase/no-browser-fallback behavior and validate the ensure body/observation route.

Affected regression inventory: 77 files, latest result per file 1439/1471 PASS, 0 skipped/pending. The broad command exits nonzero and is NOT all green. All 32 failures were independently reproduced on a clean archive of merged baseline c1dc6254773b5d8e74c8067d4ce96f3f0e98ad71:

| Historical file | Failing cases |
|---|---:|
| projectActivationReadiness.test.ts | 1 |
| projectWorkspaceMasterSnapshotReconciliationUnit5D.test.ts | 1 |
| projectWorkspaceMutationInvalidationUnit5B.test.ts | 25 |
| projectWorkspaceProjectionAcknowledgementUnit5C.test.ts | 1 |
| setupReadinessBoundary.test.ts | 2 |
| smartImportEntityReviewWorkspaceR2.test.ts | 1 |
| translationByConstructionGuard.test.ts | 1 |

workspaceConvergence.test.ts and workspaceIntegration.test.ts also produce unchanged historical “No test suite found” errors on both baseline and current source. They were not deleted, skipped or converted into passing tests. No new failing assertions or suite errors remain. Existing test counts/coverage are preserved; the two modified existing files add HTTP/native-adapter coverage. Results are consolidated latest per file after scoped final reruns, not a claim that one broad invocation passed.

Build PASS. Baseline/final lint EXIT 2 / NOT PASS, 440→440 diagnostics, added/removed 0 using diagnostic multisets normalized only for source positions and equivalent quoted-union display order. No suppressions. AR/EN/UR each 4683 keys; 15 additions each, duplicate definitions/parity gaps/empty values 0. Diff check PASS. No package/config/lockfile/workflow/rules/source-asset/generated changes. Local verification is not deployed Google/Firebase/Render acceptance or an independent GitHub audit. Publication is one authorized commit/branch push only; no PR/merge/reset.
