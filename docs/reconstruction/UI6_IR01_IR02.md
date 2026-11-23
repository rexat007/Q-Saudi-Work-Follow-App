## CURRENT UI6 POSTMERGE SOURCE CLOSURE — 2026-11-22

UI1–UI6 = MERGED / MAIN_SOURCE_VERIFIED / SOURCE_CLOSED. UI6-PUB-01 = MERGED / RECEIPT_TRUTH_VERIFIED / SOURCE_CLOSED. UI6-IR01 = MERGED / OPERATION_TYPE_ACK_VERIFIED / SOURCE_CLOSED. UI6-IR02 = MERGED / BATCH_OUTCOME_TRUTH_VERIFIED / SOURCE_CLOSED. UI7 = NOT_STARTED / TARGET_DISCOVERY_ONLY / OWNER_REVIEW_PENDING; UI8 NOT_STARTED.

PR [#107](https://github.com/rexat007/Q-Saudi-Work-Follow-App/pull/107) merged2026-11-22T05:49:27Z. Verified origin/main and isolated local HEAD `9721022418b58ff917f967519f281e9332e21cc5`; parents `9fda05f22888e97cd9538c7c32cb8c225c893376` and final candidate `ea96d895960b0ef93397f363cbf650756e2ed9ae`. Merge/candidate tree `ba107bf64fb4562eaf04c46638667a6ee27be92e`, all38 merged paths and their candidate blobs match. Required postmerge CI [44991047286](https://github.com/rexat007/Q-Saudi-Work-Follow-App/actions/runs/44991047286) and dynamic/CodeQL [44991047322](https://github.com/rexat007/Q-Saudi-Work-Follow-App/actions/runs/44991047322) completed SUCCESS on the merge SHA itself. Required foundation, PostgreSQL17 authority regressions, Typecheck debt observability, Analyze(python) and Analyze(actions) all SUCCESS. Typecheck observability is configured non-blocking; independently inspecting its log confirms the underlying `npm run lint`/`tsc --noEmit` outcome was success. Job success alone is not used as compiler proof. No fresh local full-typecheck or product test rerun in this documentation task.

Retained premerge evidence: UI6 original33/33, UI6-PUB01 26/26, IR01/IR02 additional65/65, previous Edge AR/EN/UR ×320/768/1440 9/9 (Edge157.0.4341.60, correction execution2026-11-22). Authenticated emulator1/1 is historical2026-11-21, NOT_RERUN after corrections or merge. Broad affected678/703 remains **NOT PASS**, with exactly3 inherited failed identities and22 inherited setup-unexecuted identities. Historical613/638 and earlier non-green populations, all red-to-green assertions, failed/interrupted attempts and raw archives remain unchanged; source closure does not waive this debt.

[UI6 postmerge closure](UI6_POSTMERGE_CLOSURE.md) and [machine verification](ui6/postmerge-closure.json) own the exact merge,38-path inventory, CI outcomes and evidence boundaries. [UI7 discovery](UI7_TARGET_DISCOVERY.md) recommends one bounded legacy-dashboard source/cache-provenance unit, subject to owner approval; no UI7 source/test implementation is authorized or performed. Foundational Phase0–18 numbering remains distinct from UI-unit numbering.

This closes source only. No physical-device, screen-reader, live operational/Google Workspace, product or Beta2 acceptance. Firestore remains operational authority. No SQL cutover, dual writes, RB4 activation, migration013 publication or deployment. All22 protected worktrees and RB4 original nine dirty files/unpublished013 are preserved. This task changes documentation only, retains each complete merged document below as an exact byte suffix, and performs no commit/push/PR/merge. Documentation and UI7 proposal remain local for owner review.

---

## CURRENT CONTROLLED PUBLICATION AUDIT — 2026-11-22

UI1–UI5 = MERGED / SOURCE_CLOSED. UI6 = PUBLISHED / SOURCE_REVIEW_PENDING (existing Draft PR #107); UI7 = NOT_STARTED. Original UI6 published head `2c2d8613d8b091f35db9254de37673ebaf7d40aa`, unchanged main `9fda05f22888e97cd9538c7c32cb8c225c893376`. IR01/IR02 = INDEPENDENT_PUBLICATION_AUDIT_PASSED / CONTROLLED_CORRECTIVE_PUBLICATION_AUTHORIZED, conditional on exact staged-source identity and fast-forward remote checks. Owner merge remains HOLD; no source closure or deployment authorization.

The independent audit verified all18 correction paths (5 production,5 tests/fixtures,8 documentation/evidence), all tested source hashes, all99 raw-archive entries, byte-identical65 red-to-green tests, and the complete638-instance historical outcome reconciliation. Combined PR scope is the exact union of30 published paths and18 correction paths: **38 files**, with10 overlapping paths. Five operation types retain their actual recorded ACK contracts; additional all-status/insufficient-evidence probes37/37 PASS are separate audit checks, not added to the703-case aggregate. No source/test bytes changed during this audit, so completed matching test gates are retained without unnecessary reruns.

Current affected **678/703 — NOT PASS** retains exactly3 inherited failures and22 inherited setup-unexecuted instances. UI6 33/33, UI6-PUB01 26/26, UI5 76/76 (including PUB01 27/27), UI5-IR01 10/10, new corrections65/65, offline continuity53/53, runtime i18n16/16, TypeScript/lint/build and final native Edge9/9 remain verified. Edge157.0.4341.60 AR/EN/UR ×320/768/1440 was executed on2026-11-22; original UI6 browser/authenticated-emulator evidence is2026-11-21, and authenticated emulator1/1 remains historical NOT_RERUN. Initial new-browser fixture9 timeouts, all red/green attempts, prior timestamps and original UI6-PUB01 raw evidence remain preserved.

All22 protected worktrees, RB4 original nine dirty files and unpublished013 retain exact HEAD/status/dirty hashes. The published checkout remains unchanged. Firestore remains canonical; no engine, transport, storage/schema, server, Rules, principal fencing, retry/receipt/idempotency, reconnect, conflict or SQL authority change. No RB4/013 activation, UI7, deployment or physical-device/screen-reader/live operational/Workspace/product/Beta2 acceptance.

[Current correction and audit](UI6_IR01_IR02.md) · [reviewed hashes and exact38-path union](ui6/ir01-ir02-verification.json). The complete prior local-review sections below are historical snapshots preserved unchanged. The corrective commit, remote SHA and actual new-head CI conclusions must be verified after publication and recorded in the publication receipt; local tests do not establish GitHub CI success. Stop at independent owner review.

---

# UI6 — Independent Review Corrections IR01 + IR02

Client date: 2026-11-22 (Asia/Riyadh). LOCAL CORRECTION / OWNER REVIEW / PUBLICATION HOLD.

## Source and evidence boundary

Draft [PR #107](https://github.com/rexat007/Q-Saudi-Work-Follow-App/pull/107) remains open and unmerged at `2c2d8613d8b091f35db9254de37673ebaf7d40aa`; main is `9fda05f22888e97cd9538c7c32cb8c225c893376`. Pinned candidate tree: `70fa24cfc8d32f07d40dbf92567d683ae268881d`. This task uses an isolated `fix/ui6-ir01-ir02-20261122` worktree at that HEAD. The published checkout remains clean and unchanged. These changes are uncommitted; no remote CI result certifies this local correction. No commit, push, PR mutation, merge or deployment occurred.

The 30 published UI6 paths remain the baseline. Five production presentation files are corrected, five new test/fixture files are added, and eight documentation/evidence paths record this correction. Older records, manifests and raw archives retain their historical scope and outcomes. The current section added to each guide preserves its complete published body as a byte-identical suffix.

## IR01: observed red and operation-specific ACK policy

The actual component and production Outbox/HTTP transport execute a real `REPORT_EXCEPTION` against `TripCommandsServerService` over an explicit staged transaction fixture. Its canonical exception exists and the operation becomes SYNCED, with `serverAck.committedAt` and the engine's exact exception marker, without ACK trip identifiers. The original helper returns false, renders no confirmation and disables Clear Synced even alongside a genuinely synchronized trip. Original HTTP assertions fail before production editing. This is a controlled source reproduction, not a claim of a live production incident.

| Operation type | Existing successful stored ACK | Presentation recognition | Negative controls |
| --- | --- | --- | --- |
| TRIP_COMMAND | tripId + tripSerial; canonicalTrip/version/time may also exist | SYNCED + nonblank string tripId and tripSerial | Missing/partial/blank identities, uncertain status rejected |
| CREATE_TRIP_LOADING | tripId + tripSerial, version/time/message | Same trip identity rule | Same negative cases |
| UPDATE_TRIP_STATUS | tripId + tripSerial, version/time/message | Same trip identity rule | Same negative cases |
| RECORD_RECEIPT | tripId + tripSerial, version/time/message | Same trip identity rule | Same negative cases |
| REPORT_EXCEPTION | committedAt + exact existing messageAr; no trip identifiers | SYNCED + queued tripId/exceptionId + parseable committedAt + exact existing engine marker | Missing/time-only/message-only/invalid-time/unknown-message/trip-only ACK, missing queued identity and uncertain status rejected |

Unsupported operation types cannot borrow a trip ACK. Discrimination follows persisted operationType, including generic TRIP_COMMAND's existing trip-response branch. No new ACK field, storage contract or server response is introduced. The exception marker is `تم تسجيل الاستثناء التشغيلي بنجاح خادومياً (ACK Confirmed)`. The unchanged engine writes committedAt after its successful response; this timestamp is locally recorded, not independently signed server evidence. The helper recognizes the genuine existing stored shape; it cannot independently authenticate an arbitrary fabricated local record and grants no retry or business authority.

OutboxDrawer only omits the trip-number phrase when that ACK has no tripSerial. The existing exception marker resolves through the established AR/EN/UR message mapper. No trip identity is invented. Existing Clear Synced admission continues to require all synchronized rows to have sufficient ACK evidence. Valid trip + exception ACK records can be removed locally; an unknown record survives, insufficient synchronized ACK still blocks clearing, server truth and HTTP call count remain unchanged.

IR01 component matrix: **29 PASS / 11 FAIL → 40/40 PASS**. Actual HTTP exception and cleanup paths: **0/2 → 2/2 PASS**.

## IR02: actual commit with lost HTTP response

The real command service commits RECORD_ARRIVAL, leaving the canonical trip AT_DESTINATION; the HTTP response is destroyed afterward. The unchanged client stores AWAITING_RECEIPT / RECEIPT_REQUIRED. The exact counters remain processedCount=1, syncedCount=0, failedCount=1, conflictCount=0. The original notification said `failed 1` / `فشلت 1` / `ناکام 1`, so all three actual-transport assertions failed before editing.

Only values of existing `ui6.batch_counts` and `ui6.batch_review` in AR/EN/UR change. The {failed} placeholder and every numeric engine field remain unchanged. It now describes operations requiring review or recovery; explanatory text includes possible unknown server outcomes and directs users to each operation's recorded state.

| Locale | Replacement count phrase |
| --- | --- |
| EN | requiring review or recovery {failed} |
| AR | تحتاج مراجعة أو استرداد {failed} |
| UR | جائزہ یا بازیابی درکار {failed} |

| Batch case | Required interpretation verified in all three locales |
| --- | --- |
| Unknown | AWAITING_RECEIPT remains unconfirmed; no terminal-failure claim or success notification |
| Confirmed failure | FAILED keeps its existing distinct alert/diagnostic |
| Conflict | CONFLICT keeps its distinct presentation and counter |
| Fully synchronized | Same numeric counters, successful processed-batch notification; no queue-wide proof |
| Mixed | Original processed/synced/review/conflict numbers; each card's actual recorded state retained |
| Zero processed | Neutral no-processed message; no universal success |

Original retryOperation → syncAll order is verified online; offline retry does not sync. Actual lost-response recovery sends exactly one original business command and one receipt request, not a replacement command. No new HTTP endpoint, command, background polling or engine state is added.

IR02 component cases: **5 PASS / 15 FAIL →20/20 PASS**. Actual HTTP multilingual cases: **0/3 →3/3 PASS**. Across IR01/IR02: **34 PASS /31 FAIL →65/65 PASS**, with identical test bytes and assertion identities on the red and green arms. The three new original-regression files were sealed before production editing; no assertion was edited after red.

## Regression and verification

Fresh affected family: **678/703 — NOT PASS**, comprising unchanged historical613/638 plus65 new passing cases. All638 original instance outcomes match exactly using filename + fullName + occurrence (one inherited duplicate title is preserved). Exactly three inherited failed identities remain:

- adminConsoleConvergence.test.ts: Phase 6 — AdminConsole Canonical Authority Convergence Verification 4. AdminConsoleView subscribes to projectRepository with assignedProjectIds & isSuperAdmin
- adminConsoleConvergence.test.ts: Phase 6 — AdminConsole Canonical Authority Convergence Verification 5. AdminConsoleView subscribes to canonical userRepository
- adminConsoleConvergence.test.ts: Phase 6 — AdminConsole Canonical Authority Convergence Verification 6. AdminConsoleView subscribes to canonical auditLogService

The22 canonicalReplayHarmonizationBlock132/imported conflictResolution cases remain setup-unexecuted after the same inherited beforeAll AUTH_CONTEXT_CHANGED mismatch (TESTER-01 fixture versus actor). Their exact identities are retained in the verification manifest. These are not passing coverage or newly introduced skips. Historical613/638,587/612,554/579 and UI5 326/329/316/319 remain separate NOT PASS records; all original failures/interrupted attempts and dated evidence remain unchanged.

- Existing UI6 **33/33 PASS** (30 component +3 real-HTTP cases).
- Existing UI6-PUB01 **26/26 PASS**; receipt diagnostic correction unchanged.
- UI5 family **76/76 PASS**, including PUB01 **27/27**; UI5-IR01 **10/10 PASS** separately.
- Offline continuity **53/53 PASS**, real browser IndexedDB and an owned isolated PostgreSQL17 test cluster; owned cluster stopped, no operational SQL activation and no migration013.
- Unchanged `npm run test:i18n-runtime`: **16/16 PASS**.
- `npm run lint` (`tsc --noEmit`): **PASS**. `npm run build`: **PASS**, including client/PWA/server, with retained bundle/dynamic-import warnings.
- Fresh native Edge AR/EN/UR ×320/768/1440: **9/9 PASS**. Actual component, IndexedDB, engine, HTTP transport and canonical server with explicit controlled identity/staged transaction fixtures; not an authenticated Firebase-emulator claim. Mixed trip-unknown/exception-ACK summary, receipt recovery, local clear, source failure, keyboard focus/return and viewport overflow are verified.
- Historical authenticated emulator **1/1 NOT_RERUN** after these corrections. It remains historical only; fresh HTTP/browser coverage is separately bounded. No physical-device, screen-reader, live Firebase/Google Workspace/operational/product/Beta2 acceptance.

The initial new mixed-browser fixture produced **0/9 PASS,9 timeouts**: both operations used T1, so an unknown arrival correctly fenced its later exception under the unchanged engine. This attempt and both original fixture files remain archived. Only the new fixture was corrected to queue the exception against independent canonical T2; all ACK, summary, HTTP-count, receipt and cleanup assertions were retained. The final nine journeys pass. This fixture correction does not alter the sealed65 red-to-green tests or any production source. No failed attempt is overwritten or reported as source success.

## Preservation and owner gate

All22 legacy protected worktrees retain exact HEAD, porcelain status and every pre-existing dirty-file SHA256. RB4's nine dirty paths and unpublished013 are unchanged. Published UI6 checkout stays clean at the pinned SHA. All original UI6/PUB01 test files, old raw ZIPs, manifests, UI5 closure and historical evidence are unchanged. The five current guides preserve their full published bodies beneath additive current-state sections.

Outbox engine, syncAll counters/return types, retry/receipt/idempotency/dependency ordering, IndexedDB schema, network/transport/token behavior, permanent authorization lifetime/IR01 protections, server/Rules/Firestore authority are byte-identical to the pinned source. Firestore remains canonical. No SQL cutover, dual writes, RB4/013 activation, deployment or UI7.

[Verification manifest](ui6/ir01-ir02-verification.json) owns the exact18-path local delta, source hashes, all failure identities and archive hash. [Raw evidence](ui6/ir01-ir02-raw.zip) retains both red and green JSON/logs, rendered records and notifications, runner metadata, browser screenshots, continuity results, preservation and source/test snapshots. SHA256 records distinguish raw working bytes from Git's LF-normalized blob identity; no new commit SHA exists.

**UI6_IR01_IR02_CORRECTED_LOCALLY_AWAITING_OWNER_REVIEW**. Publication/merge remain **HOLD**. The owner must review the corrected local source, ACK-policy boundary, unchanged red-to-green tests and retained non-green debt before any separate publication instruction.
