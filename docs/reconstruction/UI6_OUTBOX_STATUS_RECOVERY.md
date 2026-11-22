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

# UI6 — Outbox Status & Recovery Clarity

2026-11-21. **UI6_IMPLEMENTED_LOCALLY / OWNER_SOURCE_REVIEW_PENDING / PUBLICATION_HOLD**. Local source review only; this is not source closure, CI certification or release acceptance.

## Source preflight and approved scope

HEAD/origin/main `9fda05f22888e97cd9538c7c32cb8c225c893376`, tree `26d930a9f1c03508461a54c53a73e0e266319cac`; branch `docs/ui5-postmerge-ui6-discovery-20261121`. The owner approved the bounded local implementation after [UI6 discovery](UI6_TARGET_DISCOVERY.md). Discovery was reconciled without a material contradiction. Seven presentation roots and six new test/fixture roots are the entire code scope; the other13 paths are ten inherited documents plus three new UI6 records/evidence. Nothing is staged, committed or published.

All ten initial documentation files were read and backed up with byte hashes before production editing. Six remain byte-identical; four current-state guides receive an additive prefix with their complete initial bytes retained as a suffix. Historical UI5 closure/discovery, raw evidence, inventories, timestamps and all historical tests are untouched.

## Demonstrated source problem and correction

The old coupled Promise.all discarded all four read results if any source failed, logged without an unavailable state, and could render an initially empty or previously loaded view without a truthful read status. Delayed reads could publish after actor switches or close/reopen. SENDING and AWAITING_RECEIPT shared a spinning indicator. Raw enum filters, Arabic-only action notifications, zero-processed success and a footer based only on pending count could imply more certainty than the source proved. These are source findings and controlled component regressions, not claims of live data loss or production incidents.

The correction uses independent source states, original-status labels/explanations, immutable captured UI lifetimes and request sequences. Commands still use the original services and server authority. The shared UI busy fence prevents duplicate active clicks; it is not a durable idempotency/authorization or retry policy. Original retry -> sync call order is retained. App's only change passes its existing pendingCount into OfflineIndicator; indicator direction follows the existing locale. No route or navigation registry was changed.

## Read-only dependency audit

PRESENTATION_TARGET: App.tsx (one prop), OutboxDrawer.tsx, OfflineIndicator.tsx, new pure outboxPresentation.ts and AR/EN/UR dictionaries. TEST_TARGET: the six new UI6 paths in the inventory below. DOCUMENTATION_TARGET: inherited current-state guides and new UI6 records.

READ_ONLY: ConflictResolutionModal; outbox.service, networkStatus.service, offlineCache.service, conflictResolution.service, indexedDB.service; offline/conflict types, useOnlineStatus, authContext, navigation registry, tripCommandClient, canonical Trip server/Rules and all existing regression tests. Exact baseline/current fingerprints and consequence mapping are in verification/raw dependency-audit.json. No command-engine file was modified to simplify presentation.

## Current status contract

| Exact persisted status | UI meaning / evidence |
| --- | --- |
| PENDING | Stored locally and awaiting processing; no delivery confirmation. |
| SENDING | An actual send is in progress; final outcome is not yet confirmed. The only status with a sending animation. |
| AWAITING_RECEIPT | Authoritative final result is unknown. Neutral/amber explanation, no sending animation. Existing original-receipt recovery is required; no replacement command is invited. |
| SYNCED | Recorded local synchronization state. Confirmed presentation additionally requires existing serverAck with trip identity and number. Missing ACK is explicitly unconfirmed; no receipt is fabricated. |
| FAILED | Review the reason and use the existing retry/recovery authority. Not a new permission to change payload/identity. |
| CONFLICT | Use the existing conflict-resolution interaction and authority; no invented local override. |

Storage values and all queue/ACK identities are unchanged. Network online, an action's completion or a zero-processed response never independently implies confirmation.

## Independent read states and lifetime model

Each operations/statistics/cache/conflicts reader has loading, ready or error, its own latest-request sequence, optional retained data and local observation timestamp. Initial loading is distinct from successful empty. Operation-source failure never renders confirmed-empty. Filtered-empty has a different message from a truly empty loaded source. Failed refresh retains data marked stale/unavailable and disables dependent actions. Statistics failure renders unavailable counts rather than asserted zeroes. Conflicts/cache can fail or remain outstanding without erasing operations or holding an otherwise completed queue action open.

A wrapper replaces authorization context identity/generation when actor, profile authority/loading, role/status/active state or project-scope key changes. Closing unmounts the workspace; layout cleanup permanently retires its captured lifetime. Reads/actions capture that lifetime and current UID, never a later ref value. A-B-A and close/reopen cannot revive old callbacks. Each publication also checks request sequence. Read/action retirement is a frontend continuity safeguard, not new canonical authorization.

Opening/filtering/state refresh has no explicit business-command call. No polling was added; notifications are coalesced within a microtask and subscriptions exist only for an open workspace. Existing getCacheMetadata may initialize the local master-data cache; this is not a claim of globally network-free reads. Existing service-owned reconnect and simulation-exit synchronization is unchanged.

## Existing action consequences

| Action | Unchanged execution authority/order | Truthful result |
| --- | --- | --- |
| Refresh state | Relevant existing reader only | Local availability/observation; no delivery or automatic retry claim. |
| Synchronize now | syncAll(isSimulatedOffline), existing queue-wide eligibility/order/dependencies | Batch counts only. Zero processed is neutral; failures/conflicts/incomplete counts need review. Other work may remain even after a successful batch. |
| Retry online | retryOperation(originalId), then existing syncAll | Explicitly explains queue-wide consequence and original receipt recovery; no per-row-only claim. |
| Retry offline | Existing retryOperation, no immediate syncAll | Prepared locally for later; not delivery success. |
| Clear synchronized | Existing clearSynced, only when the loaded view has trusted acknowledged synchronized records | Device-local records removed; server trips remain. Uncertain/unacknowledged work has no new delete path. |
| Resolve conflict | Existing ConflictResolutionModal/service | Current conflict prerequisites remain required. No new local correction, policy or command. |
| Refresh cache | Existing refreshCacheWithBump, then local readers | Cache-version feedback is separate from command delivery. |
| Restore connectivity / leave simulation | Existing networkStatusService automatic synchronization | Consequence disclosed in visible text; no new auto replay or changed retry policy. |

Ambiguous action exceptions produce explicit unknown-result guidance; they do not become a successful delivery notice. The record's HTTP tests count actual command and receipt requests separately.

## Red-to-green and matched identities

Before any production edit, new real-component regressions reported29/29 FAIL on the exact main production bytes; the initial test and source hashes are retained. One new-test accessible-name selector adjustment and an additional pending-auxiliary-read case are separately recorded. Final unchanged30-case assertion bytes against the pinned original Outbox component (only import paths normalized; additive current dictionaries available) report30/30 FAIL. The same30 cases now pass, plus three actual-engine/HTTP/server-command cases: **33/33 PASS**. This second control is not mislabeled a fresh full-repository main checkout.

The first implementation parse error and all intermediate failures remain in raw evidence. The original TCP-reset browser fixture recorded2/9 passing and7 timeouts waiting for an observable awaiting-receipt state; that attempt is NOT relabeled green and its exact cause is not asserted as a production regression or transient. The final owned loss boundary executes the real server transaction, then withholds its successful response at the browser test proxy. No business engine is replaced with a success fixture.

Expanded baseline554/579 versus candidate587/612: **NOT PASS**, native exit1 on both. All original registered test identities/statuses are identical. Candidate adds33 passing cases and zero failed identities. Exact inherited failed assertions:

- `adminConsoleConvergence.test.ts`: Phase 6 — AdminConsole Canonical Authority Convergence Verification 4. AdminConsoleView subscribes to projectRepository with assignedProjectIds & isSuperAdmin
- `adminConsoleConvergence.test.ts`: Phase 6 — AdminConsole Canonical Authority Convergence Verification 5. AdminConsoleView subscribes to canonical userRepository
- `adminConsoleConvergence.test.ts`: Phase 6 — AdminConsole Canonical Authority Convergence Verification 6. AdminConsoleView subscribes to canonical auditLogService

An additional unchanged setup failure is recorded separately: canonicalReplayHarmonizationBlock132 imports conflictResolution.test's beforeAll. That helper queues TESTER-01 while the importing suite mocks current UID actor; queueOperation correctly throws AUTH_CONTEXT_CHANGED. Its22 registered cases remain unexecuted on baseline and candidate. They are not counted as passed or skipped by a new exclusion, and no historical test/assertion/auth guard was changed to make the suite green.

Existing UI5 76/76 (23 review+18 readback+8 transport+27 PUB01) and IR01 10/10 pass in the expanded candidate. Historical326/329 and316/319 remain separate NOT PASS records, as do UI4's14 inherited identities. [Verification](ui6/verification.json) records every baseline/candidate identity and native result.

## Browser, emulator, build and acceptance boundaries

Native Edge **157.0.4341.60**, headless executable, AR/EN/UR x320/768/1440 viewport journeys: **9/9 PASS**. Actual rendered component, real browser IndexedDB, Outbox engine and production HTTP transport with staged canonical server transaction fixture. Tests verify source failure isolation, filtered empty, uncertainty without confirmation, original receipt recovery with1 command POST+1 receipt POST, focus entry/trap/Escape/return and no document-width overflow. These are emulated viewport sizes, not physical-device tests. Screenshots and per-journey JSON are in raw/browser.

Authenticated local Auth/Firestore emulator journey: **1/1 PASS**, native exit0 and owned-service cleanup0. Uses real AuthProvider, real Firebase token verification and production server routes/Firestore authority around the actual Outbox component; it is not labeled a full-App navigation acceptance run. A committed command with hidden response remains uncertain, original receipt confirms without duplicate command, a subsequent command after canonical role revocation is denied without changing the Trip, and another authenticated actor sees no prior-actor operations. Fresh project/users are isolated synthetic fixtures; no live provider or account was mutated. First cold Auth startup timeout and its cleanup race are retained separately; the successful second run reports no remaining listeners.

Inactive SQL-backend preservation: existing AR2-U07 offline continuity **53/53 PASS** on an owned local PostgreSQL cluster/database with existing main migrations only; no013 source, cutover or operational SQL activation. The first pg_ctl stop wait timed out while a shutdown checkpoint took82.526s; the server subsequently completed shutdown. Follow-up native status reports no server running, with no postmaster PID. No protected service was stopped.

Final runtime i18n **16/16 PASS**; TypeScript/npm lint and client/PWA/server production build **PASS**, Node22.22.0. AR/EN/UR each add the same43 complete UI6 keys; original dictionary entries remain unchanged. No incomplete prefix key, dependency/configuration/workflow or old test edits. No new CI run is claimed for unpublished source.

Physical-device, screen-reader, live operational/Google Workspace, independent product and Beta2 acceptance remain outstanding. Source/DOM/browser focus evidence is distinct from those gates.

## Exact working-tree inventory (26)

Ten inherited documentation paths remain part of the unpublished checkout; the UI6 delta adds seven production roots, six tests/fixtures and three new documentation/evidence paths. Initial hashes and exact byte preservation are recorded in the manifest/raw backups.

- `docs/reconstruction/00_WORK_START_HERE.md`
- `docs/reconstruction/02_PHASE_LEDGER.md`
- `docs/reconstruction/05_DECISION_AND_DEBT_LOG.md`
- `docs/reconstruction/MASTER_PROJECT_HANDOFF.md`
- `docs/reconstruction/UI5_ACCOUNT_REVIEW.md`
- `docs/reconstruction/UI5_IR01_DECISION_ADMISSION.md`
- `docs/reconstruction/UI5_POSTMERGE_CLOSURE.md`
- `docs/reconstruction/UI5_PUB01_RETIREMENT.md`
- `docs/reconstruction/UI6_OUTBOX_STATUS_RECOVERY.md`
- `docs/reconstruction/UI6_TARGET_DISCOVERY.md`
- `docs/reconstruction/ui5/postmerge-closure.json`
- `docs/reconstruction/ui6/verification-raw.zip`
- `docs/reconstruction/ui6/verification.json`
- `src/App.tsx`
- `src/components/offline/OfflineIndicator.tsx`
- `src/components/offline/OutboxDrawer.tsx`
- `src/components/offline/outboxPresentation.ts`
- `src/locales/ar/index.ts`
- `src/locales/en/index.ts`
- `src/locales/ur/index.ts`
- `src/tests/helpers/ui6OutboxBrowserEntry.tsx`
- `src/tests/helpers/ui6OutboxConnectedEntry.tsx`
- `src/tests/ui6OutboxBrowser.test.ts`
- `src/tests/ui6OutboxConnectedJourney.test.ts`
- `src/tests/ui6OutboxPresentation.test.tsx`
- `src/tests/ui6OutboxTransport.test.tsx`

## Preservation and publication stop

All22 protected worktrees retain original HEAD/status/dirty hashes, including RB4 nine original dirty files and unpublished migration013. Original UI5 feature checkout remains clean on689cff. All production outside the seven allowed roots, every historical test, server/Rules/SQL file and historical raw ZIP/manifests remain byte-identical to preflight. UI5 is still MERGED / SOURCE_CLOSED; Firestore remains canonical authority. No commit, push, PR, merge, deployment, SQL/RB4 activation, cleanup or UI7 occurred. Current branch/HEAD/index and complete final inventory are in verification.

Owner must review the local correction, causal red-to-green controls, remaining inherited setup/assertion debt and acceptance boundaries before publication. This unit remains unmerged/unpublished; no source closure or release acceptance is claimed.
