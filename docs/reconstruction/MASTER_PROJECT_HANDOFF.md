## CURRENT CONTROLLED PUBLICATION AUDIT — 2026-11-22

UI1–UI5 = MERGED / SOURCE_CLOSED. UI6 = PUBLISHED / SOURCE_REVIEW_PENDING (existing Draft PR #107); UI7 = NOT_STARTED. Original UI6 published head `2c2d8613d8b091f35db9254de37673ebaf7d40aa`, unchanged main `9fda05f22888e97cd9538c7c32cb8c225c893376`. IR01/IR02 = INDEPENDENT_PUBLICATION_AUDIT_PASSED / CONTROLLED_CORRECTIVE_PUBLICATION_AUTHORIZED, conditional on exact staged-source identity and fast-forward remote checks. Owner merge remains HOLD; no source closure or deployment authorization.

The independent audit verified all18 correction paths (5 production,5 tests/fixtures,8 documentation/evidence), all tested source hashes, all99 raw-archive entries, byte-identical65 red-to-green tests, and the complete638-instance historical outcome reconciliation. Combined PR scope is the exact union of30 published paths and18 correction paths: **38 files**, with10 overlapping paths. Five operation types retain their actual recorded ACK contracts; additional all-status/insufficient-evidence probes37/37 PASS are separate audit checks, not added to the703-case aggregate. No source/test bytes changed during this audit, so completed matching test gates are retained without unnecessary reruns.

Current affected **678/703 — NOT PASS** retains exactly3 inherited failures and22 inherited setup-unexecuted instances. UI6 33/33, UI6-PUB01 26/26, UI5 76/76 (including PUB01 27/27), UI5-IR01 10/10, new corrections65/65, offline continuity53/53, runtime i18n16/16, TypeScript/lint/build and final native Edge9/9 remain verified. Edge157.0.4341.60 AR/EN/UR ×320/768/1440 was executed on2026-11-22; original UI6 browser/authenticated-emulator evidence is2026-11-21, and authenticated emulator1/1 remains historical NOT_RERUN. Initial new-browser fixture9 timeouts, all red/green attempts, prior timestamps and original UI6-PUB01 raw evidence remain preserved.

All22 protected worktrees, RB4 original nine dirty files and unpublished013 retain exact HEAD/status/dirty hashes. The published checkout remains unchanged. Firestore remains canonical; no engine, transport, storage/schema, server, Rules, principal fencing, retry/receipt/idempotency, reconnect, conflict or SQL authority change. No RB4/013 activation, UI7, deployment or physical-device/screen-reader/live operational/Workspace/product/Beta2 acceptance.

[Current correction and audit](UI6_IR01_IR02.md) · [reviewed hashes and exact38-path union](ui6/ir01-ir02-verification.json). The complete prior local-review sections below are historical snapshots preserved unchanged. The corrective commit, remote SHA and actual new-head CI conclusions must be verified after publication and recorded in the publication receipt; local tests do not establish GitHub CI success. Stop at independent owner review.

---

## CURRENT UI6 IR01 + IR02 LOCAL CORRECTION — 2026-11-22

UI6 = DRAFT_PR_107 / INDEPENDENT_REVIEW_HOLD. Published head `2c2d8613d8b091f35db9254de37673ebaf7d40aa`, main `9fda05f22888e97cd9538c7c32cb8c225c893376`. UI6-IR01 + IR02 = CORRECTED_LOCALLY / AWAITING_OWNER_REVIEW / PUBLICATION_HOLD. UI1–UI5 source closure remains unchanged; UI7 NOT_STARTED. No commit/push/PR mutation/merge/deployment in this correction task.

IR01 recognizes the existing operation-specific recorded ACK: four trip-bearing types keep tripId + tripSerial; REPORT_EXCEPTION uses its existing committedAt + exact engine marker with queued trip/exception identity. No trip number is invented. A timestamp alone, incomplete evidence or an uncertain status cannot confirm a row. IR02 relabels the unchanged failedCount aggregate in AR/EN/UR as requiring review or recovery, including possible unknown server outcomes; individual FAILED/CONFLICT/SYNCED/AWAITING_RECEIPT states and numeric counters remain intact. Engine/storage/schema/transport/server/Rules/authorization/receipt/retry/idempotency code is unchanged.

The same65 original regression assertions:34 PASS/31 FAIL on pinned production source, then65/65 PASS after the bounded five-file presentation correction; test bytes unchanged. Fresh existing UI6 33/33, UI6-PUB01 26/26, UI5 76/76 (includes PUB01 27/27), UI5-IR01 10/10, offline continuity53/53, runtime i18n16/16 and TypeScript/lint/build PASS. Native Edge AR/EN/UR ×320/768/1440 final9/9 PASS; the first new mixed-browser fixture's9 timeouts remain separately preserved and explained. Historical authenticated emulator1/1 is NOT_RERUN, not fresh acceptance.

Fresh affected678/703 is **NOT PASS**: the historical613/638 retains exactly the same638 instance outcomes, three failed identities and22 inherited setup-unexecuted identities;65 new cases pass independently. No old tests or raw evidence were changed or weakened. Historical UI5 and UI6 non-green aggregates and timestamps remain intact. All22 protected worktrees, RB4 nine dirty files and unpublished013 remain unchanged; published UI6 checkout stays clean. Firestore remains canonical; SQL cutover/dual writes/RB4/013 activation and UI7 remain unauthorized. Physical-device/screen-reader/live operational/Google Workspace/product/Beta2 acceptance is separate and outstanding.

[Correction, contract matrices and evidence boundaries](UI6_IR01_IR02.md) · [exact local delta and source seal](ui6/ir01-ir02-verification.json) · [new red/green raw evidence](ui6/ir01-ir02-raw.zip). This additive current section supersedes only the current review gate; the complete published historical body follows unchanged. Owner source/evidence review is required before any separate publication instruction; merge remains HOLD.

---

## CURRENT UI6-PUB-01 LOCAL CORRECTION — 2026-11-21

UI6-PUB-01 = CORRECTED_LOCALLY / AWAITING_OWNER_REVIEW / PUBLICATION_HOLD. UI6 remains IMPLEMENTED_LOCALLY, uncommitted, unpublished and not source-closed. UI1–UI5 remain MERGED / SOURCE_CLOSED; UI7 NOT_STARTED.

The independent publication audit's receipt-truth blocker was reproduced unchanged before this correction:2/3 PASS,1/3 FAIL. The same original test bytes now pass3/3. A small canonical-status branch changes only OutboxDrawer's diagnostic panel: uncertain receipts use cautionary text/icon and no failure/success/sending indicator; FAILED keeps useful alert diagnostics; CONFLICT keeps its distinct presentation; stale diagnostics do not imply failure during PENDING/SENDING or contradict a SYNCED record's existing ACK. Existing AR/EN/UR keys are reused; locales and every command/read/admission/lifetime/ACK handler outside the panel are byte-identical.

Fresh results: new correction26/26, existing UI6 33/33, UI5 76/76 (includes PUB01 27/27), IR01 10/10; native Edge AR/EN/UR x320/768/1440 9/9; inactive SQL offline-continuity53/53; runtime16/16 and TypeScript/lint/build PASS. Historical authenticated emulator1/1 is **carried forward, not rerun**, under exact unchanged non-presentation integration/authority code and fresh actual-engine HTTP3-case coverage. No physical-device/screen-reader/live operational/Google Workspace or Beta2 acceptance.

Fresh affected613/638 remains **NOT PASS**: exactly the same three inherited failed identities and22 beforeAll-unexecuted identities. Historical554/579 and587/612 remain separate dated results. Matched pre-correction component control with the same26 new assertions:24 FAIL/2 PASS; corrected26/26 PASS. Original UI6 chronology remains29 red cases before first production edit, followed later by the30-case original-component control; no history is relabeled. Original26 candidate-path snapshots, UI6 manifests/raw ZIP and independent failed audit remain unchanged in their historical scope.

Current corrected30-path inventory, tested hashes and evidence: [UI6-PUB-01 correction](UI6_PUB01_RECEIPT_TRUTH.md), [correction verification](ui6/pub01-verification.json). The older26-path UI6 verification below owns the pre-correction snapshot and must not be used as the final source seal. All22 protected worktrees, RB4 nine dirty files and unpublished013 remain preserved. Firestore is canonical; no engine/Rules/server/storage/retry-policy/SQL/RB4 activation or deployment changes. No commit/push/PR/merge. Owner review is the next gate; publication remains unauthorized.

---

## CURRENT UI6 LOCAL IMPLEMENTATION — 2026-11-21

UI5 remains MERGED / MAIN_SOURCE_VERIFIED / SOURCE_CLOSED, including PUB01 and IR01. UI6 = IMPLEMENTED_LOCALLY / OWNER_SOURCE_REVIEW_PENDING / PUBLICATION_HOLD. The owner approved Outbox Status & Recovery Clarity after the discovery snapshot below. This supersedes only the earlier UI6 NOT_STARTED/discovery gate; all ten inherited document bodies and initial hashes remain preserved.

UI6 is bounded to seven presentation/locale roots and six new test/fixture roots. Canonical command, retry/receipt, IndexedDB, conflict, network reconnect, server, Rules, SQL and Workspace authorities remain unchanged. Recorded local results: UI6 33/33, native Edge AR/EN/UR x320/768/1440 9/9, authenticated Auth/Firestore emulator component/production-server journey1/1, inactive-backend PostgreSQL offline continuity53/53, runtime16/16 and final TypeScript/lint/build PASS. Browser and emulator are new UI6 evidence, separate from the historical pre-IR01 UI5 journeys.

Expanded matched family: baseline554/579 versus candidate587/612; both have exactly three inherited failed assertions plus22 unchanged unexecuted cases after an inherited Canonical Replay beforeAll AUTH_CONTEXT_CHANGED error. Aggregate **NOT PASS**; no new failure identity. Existing UI5 76/76 (includes PUB01 27/27) and IR01 10/10 pass. Historical UI5 326/329 and316/319, UI4 fourteen inherited identities and all raw historical evidence are unchanged.

Current implementation, action/read-state contract, exact inventory, tested hashes and limitations: [UI6 implementation](UI6_OUTBOX_STATUS_RECOVERY.md), [verification](ui6/verification.json). All22 protected worktrees/RB4 original nine dirty files/unpublished013 remain preserved. Firestore stays canonical; SQL/RB4/013 activation remains unauthorized. No commit/push/PR/merge/deployment or UI7. Physical-device, screen-reader, live operational/Google Workspace, product and Beta2 acceptance remain outstanding. Stop at owner source review.

---

## CURRENT SOURCE CLOSURE — 2026-11-21

UI5 = MERGED / MAIN_SOURCE_VERIFIED / SOURCE_CLOSED. UI5-PUB-01 = MERGED / PERMANENT_CONTEXT_RETIREMENT_VERIFIED / SOURCE_CLOSED. UI5-IR01 = MERGED / TARGET_ADMISSION_VERIFIED / SOURCE_CLOSED. UI6 = NOT_STARTED / TARGET_DISCOVERY_ONLY / OWNER_REVIEW_PENDING.

PR [#106](https://github.com/rexat007/Q-Saudi-Work-Follow-App/pull/106) merged at 2026-11-21T06:36:58Z. Verified main `9fda05f22888e97cd9538c7c32cb8c225c893376`; parents `08f67b6046cc10e2ee6f3cd8387bcf7bffcaf551` and final feature `689cff352aeb8927f30757fc31bae4f901dd38b1`. Merge/candidate tree `26d930a9f1c03508461a54c53a73e0e266319cac`; all37 PR paths verified. Required post-merge CI [44876381349](https://github.com/rexat007/Q-Saudi-Work-Follow-App/actions/runs/44876381349) completed SUCCESS on the exact merge SHA: Required foundation, Typecheck debt observability and PostgreSQL 17 authority regressions all SUCCESS. Dynamic CI [44876380867](https://github.com/rexat007/Q-Saudi-Work-Follow-App/actions/runs/44876380867) completed SUCCESS on that SHA: Analyze (python) and Analyze (actions). The previously pending PostgreSQL gate is now completed, directly observed.

The permanent authorization leases and synchronous unresolved-target admission guard remain intact. Final recorded affected326/329 is **NOT PASS**, with exactly three unchanged inherited failures. IR01 10/10, previous UI5 76/76 and PUB01 27/27 pass (PUB01 is included in76). Historical316/319, original failed/interrupted attempts and raw red-to-green evidence remain unchanged. Prior Edge9/9 and authenticated emulator1/1 are historical **pre-IR01/pre-merge**, not fresh post-merge acceptance. No tests/browser/emulator journeys were rerun in this documentation-only task.

This closes source only. Physical-device, screen-reader, live operational/Google Workspace, product and Beta2 acceptance remain separate and unaccepted. Firestore remains canonical operational authority. SQL cutover, dual writes, deployment, RB4/migration013 activation and UI6 implementation remain unauthorized. All22 protected worktrees and RB4 original nine dirty files/unpublished013 are preserved. No commit, push, PR or merge occurs in this task.

Current authority: [UI5 post-merge closure](UI5_POSTMERGE_CLOSURE.md), [source/CI evidence](ui5/postmerge-closure.json). All earlier sections below are preserved verbatim historical snapshots; their earlier HOLD/publication gates and timestamps do not override this verified source closure.

UI6 owner-review proposal: [Outbox Delivery Status & Recovery Guidance](UI6_TARGET_DISCOVERY.md). Discovery only; no implementation. Alternatives, source paths, authority boundaries and planned regression/browser/emulator acceptance are recorded there.

---

## CURRENT UI5 CONTROLLED PUBLICATION CANDIDATE — 2026-11-20

UI5 = SOURCE_IMPLEMENTED / AWAITING_INDEPENDENT_REVIEW. UI5-PUB-01 is corrected and its permanent-retirement review passed. UI4 = MERGED / SOURCE_CLOSED. UI6 = NOT_STARTED. The owner has now authorized one implementation commit, normal push to `ui/ui5-account-review-20261120` and a draft PR against main, conditional on the final gates. This candidate record precedes remote publication; remote SHA, draft PR and CI conclusions must be verified from GitHub and the publication receipt, not inferred from this text. Merge, deployment, SQL cutover and RB4 activation remain unauthorized.

Final scope remains33 paths:8 production/8 tests-fixtures/17 docs-evidence. Seven inherited document bodies and original failed publication evidence remain preserved. The final publication recheck reports316/319 with the same three inherited failures, all76 UI5 cases and27 retirement cases passing, unchanged original regression1/1 passing, and runtime16/16 passing. Exact production/test hashes match the previously successful TypeScript/lint/build, Edge9/9 and authenticated emulator1/1 evidence. Broad aggregate remains NOT PASS; physical-device, screen-reader, live operational/provider and product/Beta2 acceptance remain separate. See [current inventory](ui5/exact-file-inventory.json), [verification including new raw recheck output](ui5/verification.json) and [retirement audit](UI5_PUB01_RETIREMENT.md). Earlier dated gates below are preserved historical snapshots and do not override this publication authorization or the owner merge gate.

## CURRENT UI5-PUB-01 CORRECTION — 2026-11-20

UI5 = SOURCE_IMPLEMENTED / UI5-PUB-01_CORRECTED_LOCALLY / OWNER_REVIEW_PENDING. See [permanent retirement and post-correction audit](UI5_PUB01_RETIREMENT.md). Original audit FAIL is retained; its unchanged reproduction is now1/1 PASS. All27 new boundary cases and all76 UI5 cases pass. Affected316/319 retains the same three inherited failures: aggregate NOT PASS. Fresh Edge9/9, authenticated local emulator1/1, runtime16/16 and TypeScript/lint/build pass. Final scope33 files:8 production/8 tests/17 docs. Original30-path bytes and historical evidence are preserved in the new raw archive. UI4 remains MERGED / SOURCE_CLOSED; protected22/RB4 nine/migration013 preserved. No commit/push/PR/merge/deployment/SQL/RB4/UI6 or product/Beta2 authorization. Earlier local records below are historical, not the current publication decision.

## CURRENT HANDOFF — UI5 local owner source review — 2026-11-15

Follow the [sole phase ledger](02_PHASE_LEDGER.md). Owner-authorized UI5 is implemented under [the amended preserved contract](UI5_TARGET_DISCOVERY.md); [implementation and exact verification](UI5_ACCOUNT_REVIEW.md) are ready for owner review. Review independent reads, stable identity/drafts, only existing privileged commands, duplicate guards, explicit server-only field readback, partial/conflict/unresolved feedback, driver binding and owned AR/EN/UR dialogs. Backend/Rules, UI1–UI4, Outbox/Workspace/SQL and canonical authority are preserved.

Scope 30 changed files (8 production / 7 new tests-fixtures / 15 docs-evidence), including the seven inherited documentation changes. Baseline 240/243 vs candidate 288/291 stays NOT PASS with the same three failures. All 48 new cases, Edge 9/9, real local Auth/Firestore/server 1/1, runtime 16/16 and TypeScript/lint/build pass. No remote UI5 CI or live/device/screen-reader/Beta 2 certification. All 22 protected worktrees and RB4/013 unchanged. STOP at owner review; no commit/push/PR/merge/deployment/SQL/RB4/UI6. Earlier handoffs remain historical.

## CURRENT HANDOFF — UI4 merged/source-closed; UI5 contract review — 2026-11-15

Follow the [sole authoritative phase ledger](02_PHASE_LEDGER.md). This handoff is an entry pointer; prior authoring-time proposals, local-only permissions and CI-pending checkpoints below retain their original timestamps and are historical.

Verified source: [PR #105](https://github.com/rexat007/Q-Saudi-Work-Follow-App/pull/105) merged at `08f67b6046cc10e2ee6f3cd8387bcf7bffcaf551` on `2026-11-15T14:59:09Z` (17:59:09 Asia/Riyadh), candidate head `f6a4cded84651c8a904da640886ff02b9746c0f9`. [Post-merge CI 43727306098](https://github.com/rexat007/Q-Saudi-Work-Follow-App/actions/runs/43727306098) completed **success** on the merge SHA itself: Required foundation, PostgreSQL 17 authority regressions and Typecheck debt observability all succeeded. Merged scope: **52 files — 9 production, 9 tests/fixtures, 34 documentation/evidence**. Local Git confirms parents `800434f634fb7ea5099fc12e4ec064dfb05d6df2` + `f6a4cded84651c8a904da640886ff02b9746c0f9`, candidate ancestry and an identical candidate/merge tree.

Source disposition: UI4 = MERGED / MAIN_SOURCE_VERIFIED / SOURCE_CLOSED; UI4-RB1 = MERGED / XLSX_INTEGRITY_CORRECTED; UI4-CI1 = MERGED / REQUIRED_CI_PASSED. Exact [closure evidence](ui4/postmerge-closure.json) binds merge identity, ancestry and all three successful exact-merge jobs. Historical broad 310/324 versus 394/408 remains NOT PASS with the same 14 failure identities; focused/connected success does not replace it.

Next owner decision: review the [UI5 area-wide shortlist and proposed Administrator Account Review & Access Decisions contract](UI5_TARGET_DISCOVERY.md). UI5 = NOT_STARTED / TARGET_DISCOVERY_ONLY. The proposal covers one account decision journey, keeps existing SUPER_ADMIN-only audited commands and PROJECT_ADMIN read-only behavior, and excludes audit redesign, fleet/import, offline replay, Workspace/provider and global authority changes. All future implementation/test/browser/emulator gates are proposed, not executed in this task. No UI5 production change is authorized until that bounded contract is accepted.

This is **source closure**, not product/live acceptance, device or screen-reader certification, real Google Workspace acceptance, deployment or Beta 2 release authorization. Firestore remains the active operational authority; Google Workspace remains derived projection/continuity. SQL cutover, dual writes, deployment and RB4 activation remain unauthorized. Original non-green results, failed/interrupted attempts, timestamps and raw archives remain historical evidence; later success does not rewrite them.

The real repository was used through an isolated exact-main documentation checkout; all 22 prior worktrees and original RB4/013 work remain protected. This reconciliation/discovery remains uncommitted and unpublished. No commit, push, PR, merge, deployment, SQL cutover or RB4 activation was performed. Stop at owner review.

## UI4 implementation entry pointer — 2026-11-15

The owner authorized UI4 after the historical proposal below. Follow the [sole current-state ledger](02_PHASE_LEDGER.md#current-ui4-owner-authorized-local-implementation--2026-11-15) and [UI4 verification record](UI4_OPERATIONAL_REPORTS.md). The older discovery-only wording is retained as historical evidence and does not describe the present authorization. Local changes only; no commit/publication/production permission.

## CURRENT CHECKPOINT — post PR #104, 2026-11-15

GitHub main `800434f634fb7ea5099fc12e4ec064dfb05d6df2` merges UI3 and its documentation-only RB1 (PR #104); exact-main Secret-free foundation CI run `43666983421` succeeded. UI3 = MERGED / SOURCE_VERIFIED / SOURCE_CLOSED, not product-live accepted; historical broad 605/638 remains NOT PASS and the 15 earlier additional failures remain CAUSE_UNRESOLVED despite passing bounded contrast. `02_PHASE_LEDGER.md` alone owns current state. Next is UI4 area-wide discovery/target contract, NOT implementation; no SQL/RB4 activation, deployment or unauthorized publication. Older entries below are historical.

Current state is owned only by the [phase ledger](02_PHASE_LEDGER.md#current-post-merge-override--ui3--pr-104--2026-11-15). Supporting source/evidence: [UI3 record](UI3_PROJECT_SETUP_SMART_IMPORT.md#post-merge-disposition-2026-11-15), [RB1 forensic record](ui3-rb1/README.md). Owner-provided `02_REPOSITORY_DOC_RECONCILIATION_2026-11-15.md` is external reconciliation context, not a second repository ledger. This handoff does not authorize implementation, commit or publication.

## UI4 owner-authorized implementation amendments — 2026-11-15

The owner has now authorized bounded UI4 implementation on verified main800434f. The discovery proposal below is preserved as authoring-time history; this dated amendment incorporates the binding execution contract. Commit, push, PR, merge, deployment and SQL/RB4 activation remain unauthorized. The phase ledger alone owns current execution state.

1. Only the mounted active report surface may issue its intended reads. Compose adaptive and legacy/financial child components; do not conditionally invoke Hooks or run hidden legacy loaders behind the adaptive view.
2. Fence principal, canonical account/authorization status, role/project scope and each request generation. Retire stale results, feedback and print state synchronously on context change. A failed/unauthorized/incomplete read is never a confirmed empty dataset.
3. The active project/filter/report-family selection produces one canonical presentation dataset for rendering, financial summary, CSV, XLSX and printing, reusing the existing engines. Keep historical row evidence when selecting Live/Delay subsets. Existing legacy quick table search is explicitly presentation-only: it narrows visible rows, not report totals/exports/print; show that scope next to the search and counts. No silent truncation or hidden row limit.
4. Google refresh visibility follows the existing admin/project authorization contract. Preserve the endpoint, credential/grant recheck, cooldown, binding IDs and single server transport. No new command, provider or privilege expansion.
5. Label separately: successful Firestore server-read completion observed on this device, local report generation, and the server-returned Google refresh timestamp. A missing server timestamp remains unavailable, with no Date.now fallback or synthetic success proof.
6. Verify all existing daily/weekly, carrier/truck/driver/shift/material productivity, Delay, Live and supported reconciliation families. Keep existing financial calculations and immutable historical profile/pricing snapshots.
7. Remove the timestamp-derived REP reference from print. A local preview has no official server-issued document identity; blank signature fields do not certify approval.
8. Preserve the existing dialog ownership/focus behavior, keyboard operation, RTL/responsive layouts and same-scope Arabic/English/Urdu translations. No framework/font/dependency/CI changes.

Dependency classification/file allowlist was frozen before production edits in the external UI4 preflight evidence. Existing App routing, repositories, server/middleware, all calculation/profile/report export services, DTOs, Outbox, SQL/migrations and Workspace bindings are KEEP/unchanged. HARDEN report-local scope/read/feedback and print truthfulness; CONVERGE local report presentation; RETIRE hidden reads and synthetic official reference; REBUILD none; DEFER all unrelated units. All five inherited documentation edits and raw historical failure evidence remain preserved. Final local verification and owner review are required; this amendment is not product/live acceptance.

## UI4 proposed target contract — 2026-11-15

**PROPOSAL ONLY — OWNER REVIEW REQUIRED.** Proposed title: **UI4 — Operational Reports: Scoped Reading, Freshness & Export Clarity**. This is a source-derived candidate, not an approved UI4 assignment, implementation or new current-state ledger. Current disposition belongs only to [02_PHASE_LEDGER.md](02_PHASE_LEDGER.md#current-post-merge-override--ui3--pr-104--2026-11-15). Source inspected at `800434f634fb7ea5099fc12e4ec064dfb05d6df2`; no browser, emulator, test, build, device or production operation was executed for this discovery. Screenshots: **NOT_CAPTURED**. Earlier source-audit/rendering artifacts are historical context, not current browser observations.

### Area-wide discovery and selection rationale

| Remaining journey / actual entry | Current source ownership and observed role | Disposition for this proposal |
| --- | --- | --- |
| Sign-in → account approval/status → profile continuity | [App](../../src/App.tsx), [AccountStatusGate](../../src/components/auth/AccountStatusGate.tsx), [ProfileContinuity](../../src/components/auth/ProfileContinuity.tsx), [auth context](../../src/firebase/authContext.tsx) | KEEP authority gates; DEFER broad account UX. Profile continuity already owns an authority-level overlay; do not duplicate it. |
| Project context / desktop and mobile navigation | [Sidebar](../../src/components/navigation/Sidebar.tsx), [MobileNavDrawer](../../src/components/navigation/MobileNavDrawer.tsx), [navigation registry](../../src/services/navigation.service.ts) | KEEP existing role/project entry contracts. No global shell or framework redesign. Keyboard concerns without a current browser run remain hypotheses. |
| Setup, readiness, roster import | [ProjectSetupWizard](../../src/components/wizard/ProjectSetupWizard.tsx), [FleetSetupWorkspace](../../src/components/wizard/FleetSetupWorkspace.tsx), import components | KEEP merged UI3; do not reopen its stages, commands or navigation gate. |
| Trip entry, dispatch, timeline, weighing and driver association | [FieldOperationsView](../../src/components/field/FieldOperationsView.tsx), [AdaptiveOperationsView](../../src/components/field/AdaptiveOperationsView.tsx) | KEEP UI1/UI2; report links may reference confirmed Trip facts, never execute Trip commands. |
| Selected configured project's reports and configured dashboard | [App:558](../../src/App.tsx#L558), [App:565](../../src/App.tsx#L565), [ReportsEngineView](../../src/components/reports/ReportsEngineView.tsx), [AdaptiveOperationalReports](../../src/components/reports/AdaptiveOperationalReports.tsx) | **SELECTED coherent UI4 candidate**: both entries reach the same operational-report renderer, so one bounded change covers the important read/filter/export journey. |
| Unconfigured/legacy dashboard and financial reporting | [OperationsDashboardView](../../src/components/dashboard/OperationsDashboardView.tsx), [WidgetFilterBar](../../src/components/dashboard/WidgetFilterBar.tsx), legacy branches within ReportsEngineView | These are real conditional routes, not dead code. KEEP calculations, authorization and entry/return behavior; DEFER seven-widget redesign and financial-screen redesign. Shared print-frame changes require their regressions. |
| Account/driver governance and audits | [AdminConsoleView](../../src/components/admin/AdminConsoleView.tsx), [DriverAccountBindingControl](../../src/components/admin/DriverAccountBindingControl.tsx), [SecurityAuditView](../../src/components/security/SecurityAuditView.tsx) | KEEP canonical server commands; DEFER separate governance UX, not an inferred part of UI4. |
| Offline/PWA, uncertain commands and conflicts | [OutboxDrawer](../../src/components/offline/OutboxDrawer.tsx), [OfflineIndicator](../../src/components/offline/OfflineIndicator.tsx), [ConflictResolutionModal](../../src/components/offline/ConflictResolutionModal.tsx), existing offline services | KEEP original operation/receipt recovery. DEFER Outbox redesign and U07/SQL/provider debt. |
| Workspace provisioning / grant / automation recovery | Wizard WORKSPACE → [WorkspaceEnsurePanel](../../src/components/wizard/WorkspaceEnsurePanel.tsx), [WorkspaceAutomationRecovery](../../src/components/wizard/WorkspaceAutomationRecovery.tsx) | KEEP resource identities and existing authorized maintenance. UI4 overlap is only the report renderer's existing explicit derived-report refresh action; no provisioning/repair work. |
| Developer and legacy tools | App secondary branches and navigation developer registry | Conditional tool authorization is distinct from primary product navigation. Do not treat every JSX branch or retired standalone route as an active user screen; no revival or removal in UI4. |

Why this area first: operators who finish accepted setup and Trip workflows must inspect scoped movement, understand the age/source of their evidence, and export an auditable result. Two primary routes reuse one renderer; current source exposes specific filter/projection/action-hierarchy gaps. Existing report/snapshot/1002-row export regressions offer bounded protection. This has stronger source evidence and lower business-mutation risk than a speculative global-shell, admin or offline rewrite. No fresh P0 incident, measured quota outage or live usability failure is claimed. Historical release/live/cost debt retains its own gates; UI4 does not close it.

Requirements basis: [product acceptance governance](PRODUCT_RECONSTRUCTION_ACCEPTANCE_GOVERNANCE.md), existing [ReportDataset/filters](../../src/types/reports.ts), report metadata and RP-27/RP-28/RP-34 comments in [reportsEngine.service](../../src/services/reportsEngine.service.ts), and current source/tests below. No new report family, business formula or authority is proposed.

### Exact entry routes and call graph

These are application state tabs, **not invented URL routes**:

1. Sidebar/mobile navigation → `REPORTS_ENGINE` → App → `ReportsEngineView`. A selected project with operationalConfiguration renders keyed `AdaptiveOperationalReports` unless the existing category is PRICING/SETTLEMENT. The existing Financial reports button selects the legacy financial branch; preserve that branch and a clear return to operational reports.
2. `OPERATIONS_DASHBOARD` → App → keyed `AdaptiveOperationalReports` for a configured selected project; otherwise the existing `OperationsDashboardView`. No consolidation/removal of either navigation permission set is proposed.
3. Adaptive renderer → [tripRepository.listCompleteByProject](../../src/repositories/trip.repository.ts) → authenticated Firestore `projects/{projectId}/trips`, server reads in pages500 with a hard maximum50000. Reaching the bound fails; it never yields a falsely complete truncated export. Principal checks and Rules remain authoritative.
4. Read facts → [buildOperationalReport/profileTripRow](../../src/services/operationalReporting.ts) → [operationalProfileResolver](../../src/services/operationalProfileResolver.ts) and [profileTripColumns](../../src/services/operationalReportColumns.ts). Each Trip's approved historical snapshot determines weights/times/applicability, not current project edits.
5. Existing `ReportDataset` → [reportsEngineService export/summary](../../src/services/reportsEngine.service.ts) → CSV/XLSX or [PrintableReportModal](../../src/components/reports/PrintableReportModal.tsx). Preserve complete filtered rows, numeric facts, financial snapshots and pending/finalized separation.
6. Explicit secondary Google action → [clientWorkspaceService.refreshOperationalReports](../../src/services/workspace.service.ts#L868) → [POST /api/projects/:projectId/workspace/refresh-reports](../../server/app.ts#L65) → authentication/project isolation/role and runtime generation fence → existing execution credential resolver → [ProjectGoogleWorkspaceServer](../../src/services/projectGoogleWorkspace.server.ts#L649) → approved Google transport. Cooldown, authorization, binding and provider journal remain server-owned. This is downstream projection, not a reload of the local report's Firestore dataset.

Roles: REPORTS_ENGINE currently admits SUPER_ADMIN, PROJECT_ADMIN, SUPERVISOR, SITE_SUPERVISOR, DISPATCHER, FINANCE_AUDITOR, VIEWER; OPERATIONS_DASHBOARD admits SUPER_ADMIN, PROJECT_ADMIN, FINANCE_AUDITOR, VIEWER. DRIVER/SCALE_OPERATOR are not granted those entries by this proposal. Google refresh has a different capability: outer middleware admits dispatcher-or-above, but transaction-time `authorized` requires SUPER_ADMIN or assigned PROJECT_ADMIN, active account/lifecycle conditions and valid Workspace authorization. A report-reader role is not permission to mutate the projection. UI hints may use the existing current profile/scope; backend reauthorization remains decisive, with no new capability endpoint or browser authority.

### Current source facts versus hypotheses

| ID / priority | Source evidence and user implication | Classification / verification limit |
| --- | --- | --- |
| R1 / P1 | ReportsEngineView's legacy loader effect at142–216 runs before its adaptive early return at366 and has no adaptive-active guard. Its default ALL filter enables authorized-project enumeration/read work while that legacy UI is not shown; the child also loads the selected project. | Source-confirmed enabled duplicate/broad read paths, not a measured call count or quota incident. Harden the view boundary; retain legacy financial reads when that branch is actually selected. |
| R2 / P1 | Adaptive dataset at116 supplies `filtersApplied:{projectId}` while its rows respond to date/carrier/truck/driver/shift/material/status filters. PrintableReportModal at87–100 reads applied dates/carrier/material from that metadata. | Source-confirmed filter provenance omission: a filtered output cannot fully describe its criteria. Map UI filters into the **existing** declared ReportFilterParams names; keep rows/totals unchanged. |
| R3 / P1 | The Google refresh button is unconditional in AdaptiveOperationalReports, despite the different reader/admin permission sets and transaction-time authorization at ProjectGoogleWorkspaceServer:100. | Source-confirmed actionable-permission mismatch; not an authorization bypass. Offer an honest admin/grant handoff or non-actionable explanation to readers; do not weaken server policy. |
| R4 / P1 | Firestore report reads are one-shot; only the error panel exposes `readRevision` retry. Google refresh neither reloads that source dataset nor proves its freshness. LIVE is a report family over this loaded snapshot. | Source-confirmed refresh semantics. Provide one explicit source-read action and clearly secondary Google projection action; label source read time separately from server-confirmed projection time. No polling, focus/online triggers or auto-sync. |
| R5 / P1 | Print preview is a fixed div frame without dialog/focus/Escape ownership. Its date formatting is hardcoded ar-SA, and physical left/right classes coexist with RTL. | Source-confirmed semantic/localization gaps; actual focus escape, clipping and computed contrast have **not** been observed in a current browser. Preserve paper styling and existing print/export contracts. |
| R6 / P2 | Adaptive filters expose technical IDs, KPI cards share one flat grid, and no explicit source-empty versus filtered-empty branch is present. | Source-confirmed presentation structure; user confusion, contrast failure and mobile clipping are hypotheses until observed. Reuse snapshot labels where available, keep isolated IDs as fallback, never broad master lookups or invented names. |
| H1 / hardening | Adaptive's local lastRefreshAt is not reset by its project/read effect; async projection feedback has no local captured-context check; missing server timestamp falls back to browser clock. However **both production mount sites key the component by project ID**, which already protects ordinary project-switch remounts. | Do **not** call this a reproduced cross-project leak. Test principal/role/grant changes, late ACKs and absent timestamps; preserve key-based protection and show unknown server time honestly. The server normally records lastReportRefreshAt on successful refresh; no missing-time production response was observed. |

### Bounded implementation contract proposed for owner review

One UI4 batch: **choose current project/report → understand source and projection freshness → filter and inspect complete results → export/print exactly that scope**. The explicit Google action is a secondary existing projection operation, not another workflow or writer.

- **KEEP:** Firestore/Rules read authority, current route role sets, complete bounded report read, immutable Trip/pricing snapshots, profile-specific measured/estimated/not-applicable semantics, ReportDataset numeric totals, finalized/pending financial separation, existing server/Google credentials, resources and journals. Keep the legacy financial and unconfigured-dashboard routes reachable under their existing permissions.
- **HARDEN:** make read/loading/denied/unavailable/empty/filtered-empty and stale/refreshing/success/unknown/failure states explicit; scope visible results and pending action feedback to current verified principal/project/role generation. Never display source read failure as zero successful results. Never use client time as a server-confirmed Google timestamp or treat a provider timeout as success. Keep existing authoritative recovery/status operations; no new queue, receipt authority, blind retry or provider call on mount.
- **CONVERGE:** one report header with project/profile/report-family context; legible local typography and grouped KPI sections using unchanged metrics; compact filter rows with clear active criteria/reset; one primary source-read action, exports adjacent to result scope, secondary role-appropriate Google refresh; keyboard-scrollable long tables and an accessible print dialog with focus return. Make LIVE's snapshot nature clear. Labels, numbers and identifiers must remain truthful.
- **RETIRE:** only the unshown legacy loader's work while the adaptive branch is active, after exact read-count and financial-branch regression proof. Do not remove report families, legacy financial execution, metrics or data.
- **REBUILD:** **none proposed**. If this needs a new data source, report engine, global framework or business-authority redesign, stop and return the specific dependency for owner review.
- **DEFER:** other global shell/admin/account/offline surfaces; legacy seven-widget/financial-screen visual redesign; Google binding/provisioning/Script maintenance; UI1–UI3 reopening; historical failure stabilization; U09/RB4/SQL, migrations, provider configuration, epoch changes, deployments and live data operations.

Do not paginate/truncate away existing complete results in this unit. Preserve the current1002-row DOM/export assertion and the50000 safety-bound error. Long tables use contained accessible scrolling; any future visual pagination requires a separately reviewed compatibility contract, not weakening that assertion. No new report/calculation/format is declared supported. Keep existing CSV/XLSX/PDF identities and negative authority checks.

### Expected source/test impact surface, not an edit authorization

Expected existing production roots: `src/components/reports/AdaptiveOperationalReports.tsx`, `ReportsEngineView.tsx`, `PrintableReportModal.tsx`, `src/App.tsx` only for existing context plumbing if needed, and `src/locales/{ar,en,ur}/index.ts`. At most two small report-local presentation components, e.g. `src/components/reports/ReportReadContext.tsx` and `ReportStatePanel.tsx`, if duplication is demonstrated. No global CSS/font/component-framework/dependency change. Do not change `navigation.service`, server/middleware, repositories, operationalReporting/profile resolution, report calculation/financial services, permissions or persistence for this UI batch.

Expected tests: new scoped report-state/component tests, a native AR/EN/UR browser fixture using actual report components, and a connected actual-App emulator report journey. Existing `googleDerivedReportRefreshUi.test.tsx` may need explicit current-auth fixture wiring if a required scoped prop is added; preserve every existing assertion/case and no-auto-call semantics. Treat this as an expected surface; the next authorized implementation must establish an exact file allowlist before edits. No test/fixture is added by this handoff.

### Verification and owner-acceptance matrix

All gates below are **PROPOSED / NOT_RUN in this task**. The verified historical UI3 gates and exact-main CI do not stand in for UI4 acceptance.

| Gate | Required evidence for the subsequent authorized batch |
| --- | --- |
| Source/authority | Reverify then-current merged main and clean isolated scope. Verify both actual entry branches, current roles and principal/project generation. Only existing read/projection commands; unchanged server/services/types/calculation/snapshot/Outbox/SQL/migration/CI/dependency blobs outside the approved UI allowlist. |
| Component regression | Ready/loading/unavailable/denied/source-empty/filtered-empty; correct filter metadata; principal/role/project changes and late source/projection ACK; no invented timestamp or identity; reader cannot invoke admin refresh; double-click suppressed; cooldown/rate/provider failures preserve valid source content; no automatic provider or status calls on mount/focus/filters. Prove hidden legacy reads absent only when adaptive branch is active, and present correctly for permitted financial view. |
| Existing complete report families | `reportsEngine.test.ts`, `reportsEngineConvergence.test.ts`, `reportsEngineControlCleanup.test.ts`, `dashboard.test.ts`, `fieldReportsCentralDashboardBlock80.test.ts`, `dashboardReportsI18n.test.ts`, `operationalProfiles.test.ts`, `operationalReportTabIsolation.test.ts`, `googleDerivedReportRefreshUi.test.tsx`, `googleReportRefreshRouteCredential.test.ts`, `googleReportRefreshRateLimitBudget.test.ts`. Inspect source-derived assertions; report failures against exact baseline by identity, never waive/skip or grow timeouts to green. |
| Real browser / languages | Actual report entry/filter/read/export/print controls, AR/EN/UR at390/768/1440 plus844/1000-height samples; document lang/dir; RTL with LTR-isolated IDs/times; logical spacing; no horizontal body overflow, contained scrollable tables; visible keyboard focus, labels, Enter/Space, dialog focus trap/Escape/return, zoom and long values. Measure contrast; do not certify accessibility from screenshots alone. No global typography change. |
| Connected emulator / integration | Real App + authenticated local Auth/Firestore + existing server routes. Assigned/unassigned project, reader/admin, suspended/revoked scope, all four approved operational profiles, recorded versus absent checkpoints, missing measurements and unchanged historical snapshots. CSV/XLSX/PDF match the full filtered dataset; preserve1002-row and missing-bound failure cases. Existing approved server test Google transport only, no live Google operation or production source adapter. No business mutations from read/export; explicit authorized projection operation keeps current server budget and identities. |
| UI1–UI3 and finance continuity | Relevant unchanged navigation/Trip/roster tests, existing `convergence2Browser.test.ts`, `convergence2CacheBrowser.test.ts`, `convergence3Journey.test.ts` and UI3 connected journey where source overlap warrants. Keep exact commands, reviewed source/receipt recovery, finalized/pending amounts and historical pricing. Do not reimplement their workflows to seed report acceptance. |
| Toolchain / reporting | TypeScript, lint, client/PWA/server build and diff/path checks on final candidate; no false PASS for historical baseline debt. Record actual language/viewport/role coverage and absent physical-device/screen-reader/live checks. Source/CI closure remains separate from product/live and global Beta2 certification. |
| Owner acceptance | Owner reviews this proposed scope first. After a separately authorized implementation and verified source/browser/emulator evidence, owner explicitly accepts report context/read freshness/filter/export/print behavior using chosen roles/profiles/languages/devices. Live Google/device operations need their own explicit authorization. No automatic product CLOSED, publication, merge or deployment. |

**Next owner decision:** approve this single report-reading/freshness/export contract, revise its boundaries, or select another area with source-backed priority. UI4 implementation remains NOT_STARTED until that review and a separate explicit implementation instruction. No approved UI4 title is inferred from its number.

## Controlled Incremental Workspace Projection handoff checkpoint — 2026-11-03

Exact state belongs to [02_PHASE_LEDGER.md](02_PHASE_LEDGER.md). Baseline: `7d50d3a31e72eb2e573ed169a029d5822f0a0742`. Working source contains the completed Controlled Incremental Workspace Projection & Explicit Derived Report Refresh Convergence.

- latest source working unit = Controlled Incremental Workspace Projection & Explicit Derived Report Refresh Convergence
- publication = pending (0 pushes / PRs / merges performed)
- canonical operational authority = `FIRESTORE` (Firestore sole operational authority; Google Sheets deferred projection/continuity)
- user-active sync trigger = RETIRED (`AUTOMATIC_USER_ACTIVE_SYNC_POSTS` strictly 0 calls)
- PWA update polling = RETIRED (30s continuous timer eliminated)
- ordinary incremental sync full collection reads = 0 (`collection('trips').get()` removed from ordinary `retrySync`, 0 `projectProfileReports` calls)
- derived operational report refresh = EXPLICIT_BOUNDED_OPERATION (`refreshOperationalReports` / `POST /api/projects/:projectId/workspace/refresh-reports`)
- scheduled worker non-active project filtering = VERIFIED (`WorkspaceSyncCoordinator.ts` skips non-ACTIVE projects without Google calls)
- test verification = 61/61 total PASS across 4 suites (`controlledIncrementalWorkspaceProjection.test.ts` 5/5, `userActiveWorkspaceSync.test.tsx` 10/10, `runtimeGenerationConvergence.test.ts` 18/18, `workspaceSyncCoordinator.test.ts` 28/28)
- next acceptance order =
  1. publish source
  2. verify deployed runtime SHA
  3. live operational cost & scale retest
  4. verify zero automatic activity sync POST requests
  5. verify ordinary incremental sync writes pending outbox changes with zero full trip collection reads
  6. verify explicit report refresh updates derived report tabs on demand
  7. verify scheduled worker skips non-active projects

Phase 10 does not start automatically.

## Historical Operational Profile Impact Assessment handoff checkpoint — 2026-11-03

Exact state belongs to [02_PHASE_LEDGER.md](02_PHASE_LEDGER.md). Baseline: `9923c5b5adc40ff7ad5e69b46cbfc14f34f7dbbe`. Working source contains the completed Operational Profile Impact Assessment and Reviewed Apply implementation.

- latest source working unit = Operational Profile Impact Assessment & Reviewed Apply
- publication = pending (0 pushes / PRs / merges performed)
- live fixture = Q-PRJ-011
- next acceptance order =
  1. publish source
  2. verify deployed runtime SHA
  3. Q-PRJ-011 reviewed apply live test
  4. verify same Workspace resource IDs (folder, spreadsheet, script)
  5. converge Workspace to READY
  6. five-minute quiescence test
  7. inspect Firestore usage
  8. final Foundation acceptance decision

Phase 10 does not start automatically.

## Historical Smart Import resume and contrast continuation — 2026-11-03

Exact state belongs to [02_PHASE_LEDGER.md](02_PHASE_LEDGER.md). Merged main `0f1c6b841da168dc4464c17cbd9f5096fef5e32d` contains Workspace quiescence PR #88; its live retest is still open. Owner restored the same durable Roster session after quota recovery, then observed a saved Driver/Truck stage inconsistent with current canonical prerequisites. The old session was cancelled; its exact originating blocker is not known. Current bounded source correction reuses fresh canonical/group/material gates to route backward only as needed, retains all valid durable facts and improves specific blocker presentation. Material selection and bulk approval now have shared dark-theme text/control/status/focus styling across their existing hosts. [Evidence and owner retest](LIVE_INTAKE_CONTINUITY_CONTRACT.md). Local tests do not establish deployed visual or Final Review acceptance. One local commit only; no push/PR/merge or Phase 10. Older continuations below are historical.

## Historical PR #88 Workspace sync quiescence continuation — 2026-11-03

Exact current state belongs to [02_PHASE_LEDGER.md](02_PHASE_LEDGER.md). Merged main `be908ce2642e68ff784282ab3cacfd6b94efc745` contains PR #87. Owner-reported profile continuity passed live; quota exhaustion and repeated Workspace retries pause the wider live intake matrix. The bounded correction removes recursive mutating resume, duplicate observers, delivered-history drains and redundant lease/checkpoint writes, while retaining strict READY, durable grants, Script identity, managed root and current Project authority. Browser activity is throttled across remount; zero-work coordinator writes are constant. [Audit, measurements and remaining live retest](WORKSPACE_SYNC_QUIESCENCE_CONTRACT.md). Global invalidation remains unchanged for canonical completeness. Local commit only; no push, PR, merge, Google/live resource change or Phase 10. Older checkpoints below are historical.

## Historical PR #87 live intake continuity continuation — 2026-11-03

Exact current state: [02_PHASE_LEDGER.md](02_PHASE_LEDGER.md). Baseline `637b7d54429ac586e101689deae35e013a9eab77` merges PR #86. Current bounded work distinguishes profile unavailability from confirmed absence, preserves mounted Roster continuity, adds bounded global natural-key discovery/safe approval and requires explicit operational Material binding even without a source column or weighbridge. [Contract and unexecuted live matrix](LIVE_INTAKE_CONTINUITY_CONTRACT.md). No new phase or GWS redesign; earlier checkpoints are historical where superseded.

## Smart Import assurance continuation

Exact state is owned only by [02_PHASE_LEDGER.md](02_PHASE_LEDGER.md). Merged baseline `4d193d96791425c4d3c3bcaa60f06175036efdfb` contains PR #85. The assurance package retains the seven-stage Roster/Phase-8 architecture and adds consistent portal/input/focus ownership, synchronous command gates, session-generation fencing, read-only convergence retry, fail-closed snapshot handling and bounded large-roster presentation. No GWS provisioning changes, new phase, Trips/Reports work or live Project mutation. Verification and manual acceptance matrix: [SMART_IMPORT_ASSURANCE_CONTRACT.md](SMART_IMPORT_ASSURANCE_CONTRACT.md). One branch commit/push is authorized after local verification; PR/merge and live acceptance remain separate. Older checkpoints are historical.

## Historical zero-Picker live closure continuation

Current baseline 870a6a8813eab20cff7e354a1a3d9df221757b63; branch reconstruction/gws-one-live-closure. Normal entry is one ensure action with one durable OAuth flow, application-managed root, atomic handoff and automatic reload/resume. Picker/custom destination and technical repair remain advanced only. Source verification/branch publication do not claim deployed acceptance; no manual Q-PRJ-009 repair/reset/PR/merge or Phase 10. Exact current state belongs to the ledger. Earlier continuation checkpoints are historical where superseded.

Current authority: [ledger](02_PHASE_LEDGER.md); details: [GWS-ONE](GWS_ONE_PROVISIONING_ENGINE.md).

## Historical initial GWS-ONE continuation

Baseline c1dc6254773b5d8e74c8067d4ce96f3f0e98ad71; branch reconstruction/gws-one-click-provisioning-engine. Current unit converges ordinary Workspace setup/verify to one server ensure action, durable operation-bound consent/resume, strict composite readiness and intentional fresh manifests. Technical recovery stays advanced; uncertain Script create has the owner-approved fail-safe exception. Source verification precedes the authorized branch publication; owner review/merge remain separate. No PR/merge/reset/live acceptance. Exact state belongs only to the ledger; earlier continuation checkpoints are historical where superseded.

Current state: [ledger](02_PHASE_LEDGER.md); implementation contract: [GWS-ONE](GWS_ONE_PROVISIONING_ENGINE.md).

## Historical automation maintenance continuation

[02_PHASE_LEDGER.md](02_PHASE_LEDGER.md) owns exact state. Baseline `3c6f74013fe9afcd4211955770039d6f860bfaf0` merges the callback fix. Known-ID degraded/uninstalled automation now has a server-derived maintenance flag and explicit repair action, independent of healthy workbook/sync. It uses durable authorization and an existing-ID precondition, shares canonical Script verification/installation, never creates resources or drains data, and requires unchanged-ID READY read-back. See [sync](PROJECT_GOOGLE_SHEET_SYNC_CONTRACT.md) and [template policy](OPERATIONAL_PROFILES_WORKSPACE_ENGINE_CONTRACT.md). CLEAN_PROJECT_TEMPLATE_ACCEPTANCE and RESET_TEST_PROJECTS are future separately authorized acceptance debt, not executed. No PR/merge, live repair/reset, template redesign or later-phase implementation. Earlier checkpoints remain historical where superseded.

## Historical OAuth popup callback implementation continuation

[02_PHASE_LEDGER.md](02_PHASE_LEDGER.md) owns exact state. Merged baseline `adc7ea93acec86a09c5111c7f8d6c539d4f9f293` includes bound durable-only authorization. Current correction replaces opener-only completion/closed polling with correlated same-origin BroadcastChannel and bounded cleanup. Dedicated callback HTML plus a narrow Workbox navigation exclusion prevents a second app window; opener/self-close remain best-effort. Canonical read-back, full durable grant acceptance and resource identity remain mandatory. See [credential](GWS2_BACKGROUND_AUTHORIZATION_CONTRACT.md) and [sync](PROJECT_GOOGLE_SHEET_SYNC_CONTRACT.md) contracts. No live Google/Render acceptance, PR/merge, resource recreation or later-phase work. Older checkpoints below are historical where superseded.

## Historical Workspace authorization convergence implementation continuation

[02_PHASE_LEDGER.md](02_PHASE_LEDGER.md) owns exact state. Merged baseline `79b5df8abecd23c70e2bbd74d6072d4d4d84d291` includes bounded-memory repair. Bound execution now requires durable server authorization; browser Google permission ends at initial resource binding. Canonical GET overrides stale client state, consent requires server read-back, and failed consent cannot fall back or initialize. Missing grant preserves the healthy Sheet and exposes one activation action; optional Script permission stays separate. See [sync](PROJECT_GOOGLE_SHEET_SYNC_CONTRACT.md) and [credential](GWS2_BACKGROUND_AUTHORIZATION_CONTRACT.md) contracts. Source verification is not deployment/live recovery; no replacement resources/manual Firestore changes, PR/merge, GWS2 expansion or Phase 10. Older continuation checkpoints are historical where superseded.

## Historical bounded-memory Workspace repair implementation continuation

[02_PHASE_LEDGER.md](02_PHASE_LEDGER.md) owns exact state. Merged baseline `fff5c313b3276e7c4672f00fad9cce7ae550f4a7` includes the global server coordinator. Current bounded repair replaces production full workbook snapshots with structural metadata, normalized canonical evidence and capped ranges; post-write verification reads only changed evidence. Owned Ops projection pages by verified numeric sheet identity, preserves legacy Dashboard/history and reuses the existing Script identity. See [the sync contract](PROJECT_GOOGLE_SHEET_SYNC_CONTRACT.md) for resource limits, master-projection audit and verification evidence. No hosting RAM change, Google resource recreation, scope/asset change or live deployment is performed. One commit/branch push is authorized; owner review/merge/deployment acceptance remain separate. Phase 10 and unrelated work are not started. Older checkpoints below are historical where superseded.

## Historical global user-active coordination implementation continuation

[02_PHASE_LEDGER.md](02_PHASE_LEDGER.md) owns exact state. Baseline `7dcd4e8489dec84802316c4a222a022adf4de669` merges durable authorization acceptance. Current bounded work retires the root Project retry loop in favor of one Firebase-only server coordinator pass. Server-owned grant/current principal/pending-work proof precedes Google refresh; Project attention and provider failures cannot become global Google 401. Read [the sync contract](PROJECT_GOOGLE_SHEET_SYNC_CONTRACT.md) for bounded paging, leases, pending-only delivery and verification. USER_ACTIVE remains the trigger; cron is not required. No OAuth, Picker, Script recovery or workbook repair runs automatically. Owner review remains required after the authorized branch publication; no PR/merge, Phase 10, deployment or live acceptance is implied. Older checkpoints below are historical where superseded.

## Historical adaptive operations continuation

Use [02_PHASE_LEDGER.md](02_PHASE_LEDGER.md) for exact state. Merged baseline is `6a7f1973a9737757f1de82f664f375ecb5d65f79` (PR #74). The current operational-profile package implements four independent measurement topologies × three intake modes, immutable Trip provenance, registry-resolved native workbooks/Script bundles, generic existing-Script recovery and canonical operational analytics. See [the current contract](OPERATIONAL_PROFILES_WORKSPACE_ENGINE_CONTRACT.md).

Current Google delivery trigger is USER_ACTIVE / REQUEST_DRIVEN; worker/cron is not required or deployed by this unit. Retain dormant source; do not follow older scheduled-worker instructions as the current next step. Q-PRJ-007 uses owner-confirmed ON_FIRST_OPERATION with dual scales and existing-Sheet preservation. No real Google migration/recovery/deployment was performed here. Owner review and applicable live acceptance remain separate; no Phase 10 or unrelated audit starts.

## Historical complete Google Workspace package continuation

Exact state: [02_PHASE_LEDGER.md](02_PHASE_LEDGER.md). Baseline `92cc6c838ab4e823eb691f62a9b56084fb6ab5dc` merges GWS2 A+B through PR #73. The current package adds binding-first structure repair, optional approved automation, server-only encrypted offline authorization and a standalone renewable-leased worker using the existing canonical outbox. GWS2-C is no longer source-deferred. Local verification/publication is separate from external deployment and live acceptance. Q-PRJ-007 has not been mutated here; recover its existing folder/Sheet. Historical uncertain Script creation must remain degraded rather than duplicated. See [sync behavior](PROJECT_GOOGLE_SHEET_SYNC_CONTRACT.md) and [exact external deployment steps](GWS2_BACKGROUND_AUTHORIZATION_CONTRACT.md). No Phase 10, PFAG-OPS-01 or Sheet-to-Firestore master ingestion starts here. Earlier checkpoints below are historical/superseded where inconsistent.

## Historical GWS1B-LIVE-02 continuation

Exact current state: [02_PHASE_LEDGER.md](02_PHASE_LEDGER.md). PR #69 merged PWA generation convergence; owner reports the current Q-PRJ-007 error is DESTINATION_NOT_WRITABLE. Initial provisioning now validates the Picker-granted writable folder and selected-ID registry/reservation checks without migration ancestry traversal. drive.file is preserved; migration validation/scopes/blueprint/Script are unchanged. Source fix requires owner review/merge/deploy and a retry on the same Project; no live Google success is claimed. Contract/proof: [PROJECT_GOOGLE_SHEET_SYNC_CONTRACT.md](PROJECT_GOOGLE_SHEET_SYNC_CONTRACT.md).

## Historical GWS1B-LIVE-01 merged checkpoint

Exact state: [02_PHASE_LEDGER.md](02_PHASE_LEDGER.md). PR #68 merged GWS1B. Owner-reported RUNTIME_TEMPLATE_SELECTION_RETIRED after redeploy is consistent with an old controlled client reaching the new retired route. Current source has no production client caller. This bounded unit reconciles PWA/app/API generations using shared build metadata, critical command fences, supported worker activation and guarded reload, plus separates current attempt and previous sync errors. Do not change Google permissions or destination validation to address that retired-call symptom. After owner merge/deploy, verify real deployed build convergence first, then retry Q-PRJ-007 Workspace/Google acceptance separately. No GWS2, PFAG-OPS-01 or Phase10 work is activated.

## Historical GWS1B continuation

Supporting summary only; [02_PHASE_LEDGER.md](02_PHASE_LEDGER.md) owns exact state. Current merged baseline is `a38c0b00e581638169f8740816f9a4646c30dbe0`, including isolated Workspace OAuth correction. GWS1B replaces hidden template copying with destination-only selection and programmatic versioned native workbook/bound-script generation. The owner-local XLSX and nine Script files are now captured into sanitized SABIL-HAIL-V1. Simple onOpen/onEdit replace four installable/timer dependencies; static initialization is generated directly. Local source/controlled verification is separate from live acceptance. Read [the sync contract](PROJECT_GOOGLE_SHEET_SYNC_CONTRACT.md) for capture, validation, recovery and remaining acceptance gates. No GWS2, autonomous refresh, dynamic intake or Phase 10 change.

### Foundation assurance maintenance checkpoint

Supporting summary only; [02_PHASE_LEDGER.md](02_PHASE_LEDGER.md) owns exact state. RB1 merged at `f56418f3ae16cbe2f2d4c726a0590d26bd6e2310`, retaining the approved native-rules verification debt PFAG-RULES-01. RB2 composes coherent foundation refresh, bounded ACTIVE profile edits, explicit Project suspension/readiness-gated reactivation, reusable Driver/Truck profile editing and permission/readiness presentation. [The maintenance contract](PROJECT_FOUNDATION_MAINTENANCE_CONTRACT.md) records field and permission matrices. No Phase 10 implementation or live deployment certification is implied; owner merge remains manual.

# MASTER PROJECT HANDOFF
## Architectural Overview & Handoff Reference

### Program Overview
This document serves as the master project handoff reference for the Q-Saudi Work Follow reconstruction program. It synthesizes architectural decisions, core system models, data boundaries, and technical stack details to guide engineering execution across Phase 0 through Phase 18.

---

### System Architecture Summary
- **Frontend Stack**: React 19 SPA built with Vite 6, Tailwind CSS v4, Lucide React icons, RTL Arabic alignment, PWA Service Worker.
- **Server Stack**: Node.js with Express server in `server.ts` / `server/app.ts`, running via `tsx` in development and bundled to `server-dist/server.cjs` via Esbuild for production (`"start": "node server-dist/server.cjs"`).
- **Persistence Stack**: Firebase Firestore (multi-tenant collections) & Firebase Authentication (via `firebase-admin` on server and `firebase/app` on client).
- **Project Setup Workflow**: Accepted 8-Layer Project Setup model (`src/services/projectSetupWorkflow.service.ts` & `src/components/wizard/ProjectSetupWizard.tsx`).
- **Domain Services**: Canonical drivers, carriers, materials, fleet rows, pricing rules, and trip dispatch repositories.

---

### Handoff Directives
1. **Repository Authority**: All reconstruction work operates under the rules defined in `docs/reconstruction/DOCUMENT_AUTHORITY.md`.
2. **Phase Continuity**: Refer to `docs/reconstruction/02_PHASE_LEDGER.md` for current active phase and unit state.
3. **Quality Gates**: Verification is proportional to risk; standing gates remain defined in `docs/reconstruction/04_VERIFICATION_AND_PUSH_GATE.md`.
4. **Execution Method**: Follow `docs/reconstruction/STREAMLINED_RECONSTRUCTION_EXECUTION_METHOD.md`: phase-level audit, bounded batches, combined publication, manual owner merge, one normal post-merge audit, and extra gates only where risk justifies them.

### Current repository and acceptance scope

Supporting overview, Phase 2 activation evidence baseline `747e86662b867aa5990f87fb0e60c79b077efb86`; unit status is owned only by [02_PHASE_LEDGER.md](02_PHASE_LEDGER.md). `package.json` defines Node 22 / npm 10 (`npm@10.9.8`), with `package-lock.json` canonical. `server.ts` mounts Vite middleware in development and serves `dist` in production; the production server bundle is built with Esbuild. Firebase Auth/Firestore remain in use. Server-authoritative services are accepted boundaries, not a blanket live-certification claim for every legacy path.

The setup layers in `projectSetupWorkflow.service.ts` are FOUNDATION, WORKSPACE, MATERIALS, CARRIERS, ROSTER, PRICING, ACCESS and REVIEW_ACTIVATION. ACCESS is the semantic access/governance identity; the retired numeric Phase-4 UI shape is not restored. Historical restoration Phase/Block names are not the reconstruction roadmap's current status.

Whole-App i18n Batches 1–4 and residual remediation are merged and accepted for the current stage. AR/EN/UR parity is established; dictionary size is dynamic. Browser review is sufficiently accepted for this stage, without claiming exhaustive manual label verification. Mixed/bilingual labels remain deferred non-blocking debt. Future desktop/company/database/licensing directions remain proposals under [the future-direction document](FUTURE_ARCHITECTURE_AND_DISTRIBUTION_DIRECTION.md), not current implementation.


### Current reconstruction checkpoint

The [ledger](02_PHASE_LEDGER.md) is the single current-state authority. Accepted source history has progressed through the Smart Import Master Design correction, SI-CG1, SI-CG2, durable sessions (P8-B1) and reviewed-intent commit authority (P8-B2). The P8-B2 merge is `1f7f3344e65dfc9b6837b10cb5349827da1587eb`; P8-B3 recovery is merged through PR #60. B4 coordinates the same server truth in the resumed Wizard journey.

Smart Import separates source discovery, approved mapping, canonical resolution, reviewed semantic intent, durable session artifacts, server commit authority and execution recovery. Current reference sections are in [Architecture](../ARCHITECTURE.md), [Data Model](../DATA_MODEL.md), [API Contract](../API_CONTRACT.md) and [Security Model](../SECURITY_MODEL.md). B3 reuses B2 and canonical business authorities; independent dependency groups retain atomic mutation/receipt boundaries. Completed effects are not replayed or rolled back by cancellation. Terminal summary limits retain full journal details and do not imply full current convergence proof.

Historical P9-U2 publication was authorized and has merged. RB1 source publication has merged; current assurance/owner-review gates belong only to the ledger. Merged B4 includes resume UI and the shared Sheets Roster adapter. Typecheck/lint debt and external-dependent test failures remain separately observed; passing build or local in-memory tests does not certify live Firebase, Beta 2, user acceptance or release readiness.
### Current Reconstruction Checkpoint — 2026-10-29

- Historical merged B3 baseline used to implement B4: `8c6a348d17b0f94215a56bb9a66f2e643c19f24c`.
- Historical P9-U1 implementation baseline: PR #61 — P8-B4, `31b2065f00b0d07763afc153582ef9be71dbd159`.
- Historical P9-U2 implementation baseline: PR #62 — P9-U1, `303469ef29b7cf906964316691e491c0df6d5e45`.
- Historical Phase 9 closure baseline: PR #63 — P9-U2, `f261ebc5508d881c9bfbe3dc77af1ccad75ec914`. Current verified merged RB1 baseline: `f56418f3ae16cbe2f2d4c726a0590d26bd6e2310`. The ledger owns the assurance gate.
- Phase 0: VERIFIED / CLOSED / FROZEN.
- Phases 1–2: VERIFIED / CLOSED.
- Phase 7 — Smart Import Core: SOURCE CLOSED.
- Pre-Phase-8 correction gate: CLOSED through SI-CG1 + SI-CG2.
- Phase 8 — Smart Import Persistence, Resume & Commit Integrity: MERGED / SOURCE_VERIFIED / CLOSED.
- P8-B1 — Durable Session & Reviewed Intent Authority: MERGED / SOURCE VERIFIED / CLOSED, PR #57, merge `4fa203fd1ef67d03e393bb1f75fb12a4a10f00d5`.
- P8-B2 — Server Commit Authority & Prepared Identity Materialization: MERGED / SOURCE VERIFIED / CLOSED, implementation `6b56d2def2f02aae1d60b5a7d3352210cc584931`, PR #58, merge `1f7f3344e65dfc9b6837b10cb5349827da1587eb`.
- B3 is merged/source-verified; B4 supplies the resume UI coordination. Exact current status and next action belong only to [the ledger](02_PHASE_LEDGER.md).
- Current diagnostics baseline: **440**.
- Lint remains **EXIT 2 / NOT PASS** historical debt.
- Remaining focused Smart Import failures are historical C5 cases **38, 61, 62, 67**; P8-B2 introduced zero new failures.
- P8-B1 and P8-B2 do not have live Firebase acceptance; controlled automated/browser evidence is accepted as source verification only.

### Smart Import binding architecture at this checkpoint

The accepted Smart Import product model is:

```text
SOURCE
→ DISCOVERY
→ MAPPING APPROVAL
→ NORMALIZATION
→ CANONICAL IDENTITY RESOLUTION
→ PROJECT PARTICIPATION / AFFILIATION RESOLUTION
→ CROSS-ROW CANONICAL INTENT
→ TRUE EXCEPTION-ONLY HUMAN REVIEW
→ SEMANTIC FINAL REVIEW
→ DURABLE REVIEWED INTENT
→ SERVER CANONICAL COMMIT AUTHORITY
→ CANONICAL REFRESH / PROOF
→ RESULT / RECOVERY
```

Binding rules:

1. **One decision per semantic identity/problem, not per source row.**
2. **Natural identity outranks name/fuzzy evidence.**
3. **Rejected rows remain provenance but do not participate in active semantic groups.**
4. **Operational Roster Material is required.** A missing source column requires explicit durable Project Material selection; the older participation-only optional-Material policy is superseded for this journey.
5. **Contextual missing-entity handling reuses canonical application capabilities.** Smart Import may invoke creation/enrollment/reactivation/affiliation but must not own a parallel Master Data authority.
6. **PREPARED_NEW remains distinct from immediate contextual canonical creation.**
7. **No hidden temporal side effects** during contextual entity creation.
8. **Resume restores persisted facts only; missing source bytes require explicit reattach.**
9. **Reviewed intent is bound to Project + Session + Operation + Batch + Source Revision + Mapping Revision + accepted semantic signature.**
10. **Raw rows are not commit authority after semantic review.**
11. The legacy roster row committer remains fenced by `PHASE8_REVIEWED_INTENT_HANDOFF_REQUIRED`.
12. P8-B2's atomic commit authority may execute only the exact currently revalidated reviewed consequences; stale semantics fail closed.
13. Merged P8-B3 preserves the above invariants through its durable execution journal; B4 renders that authority without creating a second commit or execution authority.

### Immediate continuation

Open [02_PHASE_LEDGER.md](02_PHASE_LEDGER.md) for current continuation. [The dated P8-B2 handoff](CURRENT_CONVERSATION_HANDOFF_2026-10-28.md) is historical. Do not reopen SI-CG1, SI-CG2, P8-B1 or P8-B2 without a concrete regression supported by current GitHub main.


### Pricing authority continuation

Exact current unit/status is owned by [the ledger](02_PHASE_LEDGER.md). Merged P9-U1 established canonical server pricing and fixed Trip snapshots. P9-U2 adds server-decided copy-on-write, explicit replacement cutoffs, status UX, correlated existing audit records, stored tax/minimum-weight preservation and closure evidence. Setup and operations share the same pricing policy; old rule/configuration changes do not reprice historical Trips. Unsupported legacy calculators and unused browser adjustment approvals are not activated. The source-closure decision and owner-merge gate are defined only in the ledger; Phase 10 is not started.
