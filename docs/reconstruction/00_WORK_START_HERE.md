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

## CURRENT ENTRY POINTER — UI5 local source review — 2026-11-15

Read the [sole phase ledger](02_PHASE_LEDGER.md) and [UI5 implementation/evidence](UI5_ACCOUNT_REVIEW.md). Owner-authorized UI5 is implemented locally, verified with three unchanged inherited administration failures, and awaiting owner review. UI1–UI4 remain merged/source-closed. No commit/push/PR/merge/deployment/SQL/RB4 or Beta 2 authorization. Earlier pointers below remain historical.

## CURRENT ENTRY POINTER — UI4 source-closed; UI5 discovery only — 2026-11-15

Read the [sole current-state phase ledger](02_PHASE_LEDGER.md) first. UI4, UI4-RB1 and UI4-CI1 are merged/source-closed; UI5 is **NOT_STARTED / TARGET_DISCOVERY_ONLY**. Current source is main `08f67b6046cc10e2ee6f3cd8387bcf7bffcaf551`, PR #105, with exact-merge post-CI run 43727306098 successful. Supporting [UI4 closure](UI4_OPERATIONAL_REPORTS.md) and [merge/CI evidence](ui4/postmerge-closure.json) distinguish current facts from older pending local/PR gates below.

Review [UI5 area-wide comparison and proposed Account Review & Access Decisions contract](UI5_TARGET_DISCOVERY.md). That selection is a proposal for owner review, not an implementation authorization. No UI5 production work, commit, push, PR, merge, deployment, SQL cutover, dual writes or RB4 activation is authorized by this task. Physical-device, screen-reader, real Workspace and Beta 2 acceptance remain separate. Earlier entry pointers retain their historical meaning and timestamps.

## CURRENT ENTRY POINTER — UI4 local owner review

Read the [sole current-state ledger](02_PHASE_LEDGER.md#current-ui4-owner-authorized-local-implementation--2026-11-15) and [UI4 scope/evidence](UI4_OPERATIONAL_REPORTS.md). The owner authorized bounded implementation after the historical proposal. No publication or production operation is authorized. All prior checkpoints below are historical.

## CURRENT CHECKPOINT — post PR #104, 2026-11-15

GitHub main `800434f634fb7ea5099fc12e4ec064dfb05d6df2` merges UI3 and its documentation-only RB1 (PR #104); exact-main Secret-free foundation CI run `43666983421` succeeded. UI3 = MERGED / SOURCE_VERIFIED / SOURCE_CLOSED, not product-live accepted; historical broad 605/638 remains NOT PASS and the 15 earlier additional failures remain CAUSE_UNRESOLVED despite passing bounded contrast. `02_PHASE_LEDGER.md` alone owns current state. Next is UI4 area-wide discovery/target contract, NOT implementation; no SQL/RB4 activation, deployment or unauthorized publication. Older entries below are historical.

Read the [sole current-state ledger](02_PHASE_LEDGER.md#current-post-merge-override--ui3--pr-104--2026-11-15); the summary above is an entry pointer, not another state owner.

## Current Controlled Incremental Workspace Projection & Derived Report Refresh checkpoint — 2026-11-03

Read [02_PHASE_LEDGER.md](02_PHASE_LEDGER.md) first; it alone owns current state. Working source contains completed Controlled Incremental Workspace Projection & Cost, Scale, Synchronization Architecture and Explicit Derived Report Refresh Convergence verified locally (`7d50d3a31e72eb2e573ed169a029d5822f0a0742` baseline). Standard operational authority is strictly Firestore (`FIRESTORE` = SOLE CANONICAL OPERATIONAL AUTHORITY; `GOOGLE_SHEETS` = DEFERRED PROJECTION / CONTINUITY / REPORT EXPORT). Ordinary data sync (`retrySync`) performs strictly incremental Trip projection (0 full Trip collection scans). Derived operational reports are updated via an explicit bounded server-authoritative operation (`refreshOperationalReports` / `POST /api/projects/:projectId/workspace/refresh-reports`). Automatic user-active activity trigger POST requests (`useUserActiveWorkspaceSync`) and unbounded continuous 30s PWA polling in `pwaUpdate.ts` are retired to strictly 0 calls. Scheduled worker (`WorkspaceSyncCoordinator.ts`) filters and skips non-ACTIVE projects without Google calls. Local test suites `controlledIncrementalWorkspaceProjection.test.ts` (5/5 PASS), `userActiveWorkspaceSync.test.tsx` (10/10 PASS), `runtimeGenerationConvergence.test.ts` (18/18 PASS), and `workspaceSyncCoordinator.test.ts` (28/28 PASS) all pass (61/61 total PASS). Publication is pending owner review; no push, PR, merge, or Phase 10.

## Historical Operational Profile Impact Assessment checkpoint — 2026-11-03

Read [02_PHASE_LEDGER.md](02_PHASE_LEDGER.md) first; it alone owns current state. Working source contains completed Operational Profile Impact Assessment and Reviewed Apply implementation verified locally (`9923c5b5adc40ff7ad5e69b46cbfc14f34f7dbbe` baseline). Same-profile reviewed reconfigurations are supported while preserving historical Trip snapshots and Google Workspace resource identities without creating duplicate folders/sheets/scripts. General cross-profile migration remains fail-closed. Local test suites `operationalProfileAssessment.test.ts` (13/13 PASS) and `projectWorkspaceMutationInvalidationUnit5B.test.ts` (40/40 PASS) pass. Previous gates Smart Import Dark Contrast Family (`LIVE_PASS`), Durable Recovery (`LIVE_PASS`), and Account Profile Continuity (`LIVE_PASS`) are preserved. Publication is pending owner review; no push, PR, merge, or Phase 10. Deployed Q-PRJ-011 retest and Workspace quiescence retest remain required.

## Historical Smart Import live-remediation checkpoint — 2026-11-03

Read [02_PHASE_LEDGER.md](02_PHASE_LEDGER.md) first; it alone owns current state. Starting merged main `0f1c6b841da168dc4464c17cbd9f5096fef5e32d` contains PR #88. Owner reports profile recovery and same durable Import Session/stage restoration passed live; restored-stage prerequisite drift and invisible shared Material/bulk controls exposed two bounded defects. Current source correction derives effective stage from fresh existing gates and styles the two shared components. [Evidence and remaining live checks](LIVE_INTAKE_CONTINUITY_CONTRACT.md). Final Review live acceptance is incomplete; Workspace quiescence still requires owner live retest. One local commit only; no push/PR/merge, Workspace redesign or Phase 10. Older checkpoints below are historical.

## Historical PR #88 Workspace quiescence checkpoint — 2026-11-03

Read [02_PHASE_LEDGER.md](02_PHASE_LEDGER.md) first; it alone owns exact current state. Starting verified merged main: `be908ce2642e68ff784282ab3cacfd6b94efc745` (PR #87). Owner observed correct profile-unavailable behavior, followed by Firestore quota exhaustion and repeated Workspace retries. The bounded source remedy and controlled operation budgets are in [WORKSPACE_SYNC_QUIESCENCE_CONTRACT.md](WORKSPACE_SYNC_QUIESCENCE_CONTRACT.md). Live intake acceptance is paused pending owner retest; local verification is not live acceptance. Only a local commit is authorized: no push/PR/merge, Phase 10 or Trips/Reports redesign. Earlier continuation instructions below are historical where superseded.

## Historical PR #87 live intake continuity checkpoint — 2026-11-03

Read [02_PHASE_LEDGER.md](02_PHASE_LEDGER.md) first. Verified merged main is `637b7d54429ac586e101689deae35e013a9eab77` (PR #86). The current bounded unit addresses account-profile outage continuity, bulk canonical identity reuse and explicit operational Material binding; see [LIVE_INTAKE_CONTINUITY_CONTRACT.md](LIVE_INTAKE_CONTINUITY_CONTRACT.md). Local verification precedes the authorized one-commit branch publication. No PR/merge, new phase or live acceptance is performed. Older continuation checkpoints below are historical where superseded.

## Historical PR #86 Smart Import continuation

Read [02_PHASE_LEDGER.md](02_PHASE_LEDGER.md) first. Verified main `4d193d96791425c4d3c3bcaa60f06175036efdfb` merges GWS-ONE live closure (PR #85). The current bounded package assures the existing Smart Roster journey, owned nested dialogs, async/session ownership, canonical resolution, durable recovery and scale. See [SMART_IMPORT_ASSURANCE_CONTRACT.md](SMART_IMPORT_ASSURANCE_CONTRACT.md). No Trips/Reports/new phase, live Project mutation, PR or merge is authorized. Deployed Q-PRJ-010 acceptance remains NOT_PERFORMED.

# Q-SAUDI WORK FOLLOW — RECONSTRUCTION PROGRAM
## WORK START HERE & OPERATIONAL DIRECTIVES

### Executive Summary
Welcome to the repository-governed reconstruction program for Q-Saudi Work Follow. This program manages the systematic engineering transition of the application from historical patch-based feature development to a hardened, server-authoritative, production-grade enterprise platform (Phase 0 through Phase 18).

This directory (`docs/reconstruction/`) contains repository-governed current contracts and clearly marked historical records. Governance changes through bounded, reviewed documentation units; it is not an immutable snapshot.

**Current state has one owner:** [02_PHASE_LEDGER.md](02_PHASE_LEDGER.md). Use it for the active phase/unit, next unit, closed units, open-debt routing and execution rules. Do not use Studio copies or historical release reports as competing ledgers.

P0-U5 is documentation-only. Whole-App i18n and residual remediation are merged and accepted for this reconstruction stage; remaining mixed/bilingual labels are deferred non-blocking debt, not authorization to reopen localization.


### Historical Continuation Checkpoint — 2026-11-02

- **Verified merged baseline**: `4d193d96791425c4d3c3bcaa60f06175036efdfb` (GWS-ONE live closure, PR #85).
- **Phase 0**: VERIFIED / CLOSED / FROZEN.
- **Phase 1**: VERIFIED / CLOSED.
- **Phase 2**: VERIFIED / CLOSED.
- **Phases 3–6**: source reconstruction closed for the current track; previously recorded live/deployment gates remain separate where applicable and are not silently promoted by this checkpoint.
- **Phase 7 — Smart Import Core**: SOURCE CLOSED.
- **Smart Import pre-Phase-8 correction gate**: CLOSED.
  - SI-CG1 — Identity, Grouping & Provenance Correction: MERGED / SOURCE VERIFIED.
  - SI-CG2 — Layer & Contextual Creation Convergence: MERGED / SOURCE VERIFIED.
- **Phase 8 — Smart Import Persistence, Resume & Commit Integrity**: MERGED / SOURCE_VERIFIED / CLOSED.
  - P8-B1 — Durable Session & Reviewed Intent Authority: MERGED / SOURCE VERIFIED / CLOSED — PR #57, merge `4fa203fd1ef67d03e393bb1f75fb12a4a10f00d5`.
  - P8-B2 — Server Commit Authority & Prepared Identity Materialization: MERGED / SOURCE VERIFIED / CLOSED — PR #58, merge `1f7f3344e65dfc9b6837b10cb5349827da1587eb`.
- **Continuation**: [the ledger](02_PHASE_LEDGER.md) owns state; baseline `4d193d96791425c4d3c3bcaa60f06175036efdfb` merges GWS-ONE live closure. Current bounded work is Smart Import assurance; see [assurance contract](SMART_IMPORT_ASSURANCE_CONTRACT.md). Existing phase closures and external acceptance gates remain.
- **P8-B3**: MERGED / SOURCE_VERIFIED / CLOSED.
- **Next action**: complete the authorized Smart Import assurance branch publication and stop for owner review; no PR/merge. Deployed Q-PRJ-010 acceptance is a separate unperformed gate. Preserve the existing zero-Picker, durable-grant, strict READY, Script-create ambiguity and USER_ACTIVE/no-cron Workspace contracts; no manual Project repair/reset or Phase 10.
- **Current TypeScript diagnostics baseline**: 440 after P8-B2; new diagnostics added by P8-B2: 0.
- **Lint**: EXIT 2 / NOT PASS remains historical debt, not a new P8-B2 regression.
- **Remaining focused Smart Import test debt**: historical C5 cases 38, 61, 62 and 67; no new P8-B2 failures.
- **Live Firebase acceptance** for P8-B1/P8-B2 is NOT claimed; verification used focused automated tests and controlled browser/in-memory service checks.
- **Historical P8-B2 continuation snapshot**: [CURRENT_CONVERSATION_HANDOFF_2026-10-28.md](CURRENT_CONVERSATION_HANDOFF_2026-10-28.md).


---

### Core Operational Principles
1. **GitHub Main Is Code Truth**: The remote `main` branch on GitHub is the sole source of code truth.
2. **Minimum Necessary Governance**: Use the streamlined method in [STREAMLINED_RECONSTRUCTION_EXECUTION_METHOD.md](STREAMLINED_RECONSTRUCTION_EXECUTION_METHOD.md). Combine or skip gates that add no material protection; preserve extra gates for high-risk work.
3. **Bounded Batches, Not Endless Micro-Units**: Prefer one coherent batch for related safe work with a shared purpose and regression surface. Split only when risk, ownership or verification requires it.
4. **No Greenfield Rewrites**: Existing application code is valuable asset material. Reconstruction hardens, converges, and stabilizes capabilities rather than discarding existing working features.
5. **Area-Wide Review Before Editing**: Review the full relevant family, then fix the coherent defect family rather than stopping at the first visible symptom.
6. **Server Authority**: The backend (Node/Express/Firebase Admin) is the sole authority for business logic, pricing computations, trip state transitions, and persistent data reconciliation.
7. **Multi-Tenant Isolation**: Every database query, outbox item, REST endpoint, and UI state context must be strictly isolated by `projectId`.
8. **Responsive / Cross-Device Invariant**: Field UI must function flawlessly across mobile, tablet, and desktop viewports with strict RTL Arabic layout discipline.

---

### Governance Entry Points
- **Document Authority**: `docs/reconstruction/DOCUMENT_AUTHORITY.md`
- **Engineering Constitution**: `docs/reconstruction/01_ENGINEERING_CONSTITUTION.md`
- **Active Phase Ledger**: `docs/reconstruction/02_PHASE_LEDGER.md`
- **Streamlined Execution Method**: `docs/reconstruction/STREAMLINED_RECONSTRUCTION_EXECUTION_METHOD.md`
- **Implementation Unit Protocol**: `docs/reconstruction/03_IMPLEMENTATION_UNIT_TEMPLATE.md`
- **Verification & Push Gate**: `docs/reconstruction/04_VERIFICATION_AND_PUSH_GATE.md`
- **Decision & Debt Log**: `docs/reconstruction/05_DECISION_AND_DEBT_LOG.md`
- **Master Reconstruction Plan**: `docs/reconstruction/RECONSTRUCTION_PLAN.md`
- **Foundational Plan (Phases 0–18)**: `docs/reconstruction/FOUNDATIONAL_PLAN_PHASE_0_TO_18.md`
