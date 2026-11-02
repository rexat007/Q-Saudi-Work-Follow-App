# GWS-ONE — one-click provisioning engine

Current phase/unit authority: [02_PHASE_LEDGER.md](02_PHASE_LEDGER.md). Baseline `c1dc6254773b5d8e74c8067d4ce96f3f0e98ad71`. This contract describes local source; live Google/deployment acceptance remains separate.

## Product and authority

WORKSPACE_PRODUCT_ENTRYPOINT = ONE_CLICK_ENSURE; WORKSPACE_ORCHESTRATION_AUTHORITY = SERVER; NORMAL_WORKSPACE_BUTTONS = ONE_PRIMARY_ACTION. Normal UI exposes NOT_CONFIGURED, PREPARING, ACTION_REQUIRED, READY, ATTENTION_REQUIRED. It displays translated progress and one prepare/verify control. Manual Script ID, initialize, retry, repair, recover and maintenance controls are retired from ordinary UX and remain within closed privileged Advanced diagnostics.

`POST /api/projects/:projectId/workspace/ensure` accepts `{}` or a user-selected destinationRootFolderId; `GET` on the same path observes the canonical operation. Neither accepts resource identities/phase/state/credential claims. Firebase authentication, live Project role/scope/mutability and generation fences remain. Only server-declared authorization/destination actions may interrupt the client journey. After accepted OAuth callback/read-back, the same journey automatically invokes ensure again. Correlation binds consent to Project, operation, browser transaction, authorization version and binding version. A pending operation is discoverable after browser refresh; active work is observed and expired work resumes. The client observes bounded progress; it does not choose creation/repair/sync phases. Google interactions still require browser user consent/Picker permission where genuinely needed.

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

## Local verification observation — 2026-11-02

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
